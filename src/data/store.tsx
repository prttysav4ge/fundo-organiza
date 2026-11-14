import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { computeBracket, teamGroup, teamName, type Bracket } from './bracket'
import { DISCIPLINES, EVENT, GROUPS, TEAMS, VENUES, seed } from './seed'
import type { Activity, Announcement, EventData, Participant } from './types'

// Capa de datos: hoy todo vive en localStorage de cada navegador. Para producción,
// estas mismas funciones se reemplazan por llamadas a un backend compartido.

const KEY = 'fundo-organiza-v2'

export interface Session {
  role: 'admin' | 'delegado'
  groupId?: string
}

// Credenciales provisionales (en producción la autenticación va en el servidor).
export function checkLogin(user: string, pass: string): Session | null {
  if (user === 'admin' && pass === 'admin2026') return { role: 'admin' }
  if (user === 'delegadoe' && pass === 'egresados') return { role: 'delegado', groupId: 'ce' }
  const m = /^delegado(\d+)$/.exec(user)
  if (m && +m[1] >= 1 && +m[1] <= 10 && pass === `ciclo${m[1]}`) return { role: 'delegado', groupId: `c${m[1]}` }
  return null
}

export const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3)
export const fmtTime = (t: string) => {
  const h = +t.slice(0, 2)
  return `${((h + 11) % 12) + 1}:${t.slice(3)} ${h < 12 ? 'a. m.' : 'p. m.'}`
}
export const fmtDate = (iso: string) =>
  new Date(iso.length === 10 ? iso + 'T12:00:00-05:00' : iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', timeZone: 'America/Lima' })
export const group = (id?: string | null) => GROUPS.find((x) => x.id === id)
export const discipline = (id?: string) => DISCIPLINES.find((x) => x.id === id)
export const venue = (id: string) => VENUES.find((x) => x.id === id)!
export const teamsFor = (disciplineId: string, groupId: string) => TEAMS[disciplineId]?.[groupId] ?? [groupId]
export const byStart = (a: Activity, b: Activity) => toMin(a.start) - toMin(b.start) || toMin(a.end) - toMin(b.end)
export const inscriptionsOpen = () => Date.now() < new Date(EVENT.deadline).getTime()
/** Días que faltan para el evento (0 = hoy, negativo = ya pasó). */
export const daysToEvent = () => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
  return Math.round((Date.parse(EVENT.day) - Date.parse(today)) / 864e5)
}
export { teamGroup, teamName }

export type NewParticipant = Omit<Participant, 'id' | 'status'>

interface Store extends EventData {
  bracket: Bracket
  cicloId: string | null
  setCiclo: (id: string | null) => void
  session: Session | null
  login: (u: string, p: string) => boolean
  logout: () => void
  /** ¿El grupo juega (ya definido) en esta actividad? */
  plays: (a: Activity, groupId: string) => boolean
  /** Actividad abierta a todos: no es un partido entre equipos de ciclo. */
  isGeneral: (a: Activity) => boolean
  title: (a: Activity) => string
  addParticipant: (p: NewParticipant) => string | null
  confirmParticipant: (id: string) => void
  confirmAll: (groupId: string) => void
  removeParticipant: (id: string) => void
  requestCorrection: (participantId: string, message: string) => void
  resolveCorrection: (id: string, patch: Partial<Participant> | null) => string | null
  updateActivity: (id: string, patch: Partial<Activity>) => string | null
  addActivity: (a: Pick<Activity, 'title' | 'venueId' | 'start' | 'end'>) => string | null
  removeActivity: (id: string) => void
  setDirect: (disciplineId: string, team: string) => void
  addAnnouncement: (a: Omit<Announcement, 'id' | 'date'>) => void
  removeAnnouncement: (id: string) => void
  reset: () => void
}

const Ctx = createContext<Store>(null as unknown as Store)
export const useStore = () => useContext(Ctx)

const load = <T,>(k: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(k)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
const save = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* almacenamiento no disponible */
  }
}
const uid = () => Math.random().toString(36).slice(2, 10)
const clean = (s: string) => s.trim().replace(/\s+/g, ' ')

/** Reglas de inscripción de las bases (capítulos III, V y XII). Devuelve el error o null. */
export function validateParticipant(all: Participant[], p: NewParticipant, ignoreId?: string): string | null {
  const d = discipline(p.disciplineId)
  const rule = d?.roster
  if (!d || !rule) return 'Disciplina no válida.'
  const others = all.filter((x) => x.id !== ignoreId)
  if (clean(p.name).split(' ').length < 2) return 'Escribe nombres y apellidos completos.'
  if (!/^\d{6,10}$/.test(p.upaoId)) return 'El ID UPAO debe tener solo números (6 a 10 dígitos).'
  const mine = others.filter((x) => x.upaoId === p.upaoId)
  const other = mine.find((x) => x.groupId !== p.groupId)
  if (other) return `Ese ID ya está inscrito por ${group(other.groupId)!.name}. Cada estudiante participa por un solo ciclo.`
  if (mine.some((x) => x.disciplineId === p.disciplineId)) return `Ese ID ya está inscrito en ${d.name}.`
  const sports = mine.filter((x) => discipline(x.disciplineId)?.roster?.sport)
  if (rule.sport) {
    if (sports.length >= 2) return 'Máximo 2 deportes por jugador (fútbol, vóley o básquet).'
    if (mine.some((x) => x.disciplineId === 'gincana')) return 'Quien está en la gincana no puede inscribirse en fútbol, vóley ni básquet.'
  }
  if (p.disciplineId === 'gincana' && sports.length) return 'Quien está inscrito en fútbol, vóley o básquet no puede inscribirse en la gincana.'
  const team = others.filter((x) => x.disciplineId === p.disciplineId && x.teamId === p.teamId)
  if (rule.max && team.length >= rule.max) return `El equipo ya tiene el máximo de ${rule.max} inscritos en ${d.name}.`
  if (rule.jersey) {
    if (!p.jersey || p.jersey < 1 || p.jersey > 99 || !Number.isInteger(p.jersey)) return 'Indica un número de polo entre 1 y 99.'
    if (team.some((x) => x.jersey === p.jersey)) return `El número ${p.jersey} ya está asignado en este equipo de ${d.name}.`
  }
  if (rule.gender && !p.gender) return 'Indica si es mujer o varón (el vóley exige mínimo 2 mujeres en cancha).'
  return null
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<EventData>(() => load(KEY, seed()))
  const [cicloId, setCicloId] = useState<string | null>(() => load(KEY + '-ciclo', null))
  const [session, setSession] = useState<Session | null>(() => load(KEY + '-session', null))

  useEffect(() => save(KEY, data), [data])
  useEffect(() => save(KEY + '-ciclo', cicloId), [cicloId])
  useEffect(() => save(KEY + '-session', session), [session])

  const bracket = useMemo(() => computeBracket(data.activities, data.directOverride), [data.activities, data.directOverride])

  const title = (a: Activity) => {
    const s = bracket.sides[a.id]
    const d = discipline(a.disciplineId)
    if (!s) return a.title
    return `${d?.name ?? ''}${a.code ? ` ${a.code}` : ''}: ${s[0].label} vs ${s[1].label}`
  }
  const conflict = (next: Activity): string | null => {
    if (toMin(next.end) <= toMin(next.start)) return 'La hora de fin debe ser posterior a la de inicio.'
    if (next.status === 'cancelado' || next.status === 'finalizado' || next.venueId === 'fundo') return null
    for (const o of data.activities) {
      if (o.id === next.id || o.status === 'cancelado' || o.status === 'finalizado') continue
      if (o.venueId === next.venueId && toMin(next.start) < toMin(o.end) && toMin(o.start) < toMin(next.end))
        return `Cruce de lugar: ${venue(o.venueId).name} ya tiene «${title(o)}» (${fmtTime(o.start)} – ${fmtTime(o.end)}).`
    }
    return null
  }

  const store: Store = {
    ...data,
    bracket,
    cicloId,
    setCiclo: setCicloId,
    session,
    login: (u, p) => {
      const s = checkLogin(u.trim().toLowerCase(), p)
      if (s) setSession(s)
      return !!s
    },
    logout: () => setSession(null),
    plays: (a, gid) => !!bracket.sides[a.id]?.some((s) => s.team && teamGroup(s.team) === gid),
    isGeneral: (a) => !a.sides || 'label' in a.sides[0],
    title,

    addParticipant: (raw) => {
      if (!inscriptionsOpen()) return `El plazo de inscripción venció (${EVENT.deadlineLabel})`
      const p = { ...raw, name: clean(raw.name), upaoId: raw.upaoId.trim() }
      const err = validateParticipant(data.participants, p)
      if (err) return err
      setData((d) => ({ ...d, participants: [...d.participants, { ...p, id: uid(), status: 'pendiente' }] }))
      return null
    },
    confirmParticipant: (id) =>
      setData((d) => ({ ...d, participants: d.participants.map((x) => (x.id === id ? { ...x, status: 'confirmado' } : x)) })),
    confirmAll: (gid) =>
      setData((d) => ({ ...d, participants: d.participants.map((x) => (gid === 'todos' || x.groupId === gid ? { ...x, status: 'confirmado' } : x)) })),
    removeParticipant: (id) =>
      setData((d) => ({
        ...d,
        participants: d.participants.filter((x) => x.id !== id),
        corrections: d.corrections.filter((c) => c.participantId !== id),
      })),
    requestCorrection: (participantId, message) => {
      const p = data.participants.find((x) => x.id === participantId)
      if (!p) return
      setData((d) => ({
        ...d,
        corrections: [...d.corrections, { id: uid(), participantId, groupId: p.groupId, message, status: 'pendiente' }],
      }))
    },
    resolveCorrection: (id, patch) => {
      const c = data.corrections.find((x) => x.id === id)
      const p = data.participants.find((x) => x.id === c?.participantId)
      if (!c || !p) return 'Solicitud no encontrada.'
      if (patch) {
        const next = { ...p, ...patch, name: clean(patch.name ?? p.name) }
        const err = validateParticipant(data.participants, next, p.id)
        if (err) return err
        setData((d) => ({ ...d, participants: d.participants.map((x) => (x.id === p.id ? next : x)) }))
      }
      setData((d) => ({ ...d, corrections: d.corrections.map((x) => (x.id === id ? { ...x, status: patch ? 'resuelta' : 'rechazada' } : x)) }))
      return null
    },

    updateActivity: (id, patch) => {
      const cur = data.activities.find((x) => x.id === id)
      if (!cur) return 'Actividad no encontrada.'
      const next = { ...cur, ...patch }
      const err = conflict(next)
      if (err) return err
      setData((d) => ({ ...d, activities: d.activities.map((x) => (x.id === id ? next : x)) }))
      return null
    },
    addActivity: (a) => {
      const next: Activity = { ...a, title: clean(a.title), id: 'x' + uid(), status: 'pendiente', custom: true }
      const err = conflict(next)
      if (err) return err
      setData((d) => ({ ...d, activities: [...d.activities, next] }))
      return null
    },
    removeActivity: (id) => setData((d) => ({ ...d, activities: d.activities.filter((x) => x.id !== id || !x.custom) })),
    setDirect: (did, team) =>
      setData((d) => {
        const o = { ...d.directOverride }
        if (team) o[did] = team
        else delete o[did]
        return { ...d, directOverride: o }
      }),
    addAnnouncement: (a) => setData((d) => ({ ...d, announcements: [{ ...a, id: uid(), date: new Date().toISOString() }, ...d.announcements] })),
    removeAnnouncement: (id) => setData((d) => ({ ...d, announcements: d.announcements.filter((x) => x.id !== id) })),
    reset: () => setData(seed()),
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}
