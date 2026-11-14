import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DISCIPLINES, GROUPS, VENUES, seed } from './seed'
import type { Activity, Announcement, EventData, Participant } from './types'

// Capa de datos del prototipo: todo vive en localStorage. Para producción, estas
// mismas funciones se reemplazan por llamadas a un backend (p. ej. Supabase).

const KEY = 'fundo-organiza-v1'

export interface Session {
  role: 'admin' | 'delegado'
  groupId?: string
}

// Credenciales de demostración (en producción la autenticación va en el servidor).
export function checkLogin(user: string, pass: string): Session | null {
  if (user === 'admin' && pass === 'admin2026') return { role: 'admin' }
  const m = /^delegado(\d+)$/.exec(user)
  if (m && +m[1] >= 1 && +m[1] <= GROUPS.length && pass === `ciclo${m[1]}`) return { role: 'delegado', groupId: `c${m[1]}` }
  return null
}

export const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3)
export const fmtTime = (t: string) => {
  const h = +t.slice(0, 2)
  return `${((h + 11) % 12) + 1}:${t.slice(3)} ${h < 12 ? 'a. m.' : 'p. m.'}`
}
export const group = (id?: string) => GROUPS.find((x) => x.id === id)
export const discipline = (id?: string) => DISCIPLINES.find((x) => x.id === id)
export const venue = (id: string) => VENUES.find((x) => x.id === id)!
export const isDuel = (a: Activity) => discipline(a.disciplineId)?.format === 'duelo'
export const involves = (a: Activity, gid: string) => a.groupIds.includes(gid)
/** Actividad abierta a todos (no es un duelo entre dos equipos). */
export const isGeneral = (a: Activity) => !isDuel(a)
export const actTitle = (a: Activity) => {
  const d = discipline(a.disciplineId)
  if (isDuel(a) && a.groupIds.length === 2) return `${d!.name}: ${group(a.groupIds[0])!.short} vs ${group(a.groupIds[1])!.short}`
  return a.title
}
export const winnerOf = (a: Activity) =>
  a.status === 'finalizado' && a.score && a.groupIds.length === 2 && a.score[0] !== a.score[1]
    ? a.groupIds[a.score[0] > a.score[1] ? 0 : 1]
    : undefined
export const byStart = (a: Activity, b: Activity) => toMin(a.start) - toMin(b.start)

interface Store extends EventData {
  cicloId: string | null
  setCiclo: (id: string | null) => void
  session: Session | null
  login: (u: string, p: string) => boolean
  logout: () => void
  addParticipant: (p: Omit<Participant, 'id' | 'status'>) => string | null
  confirmParticipant: (id: string) => void
  removeParticipant: (id: string) => void
  requestCorrection: (participantId: string, message: string) => void
  resolveCorrection: (id: string, patch: { name: string; jersey?: number } | null) => void
  updateActivity: (id: string, patch: Partial<Activity>) => string | null
  addAnnouncement: (a: Omit<Announcement, 'id' | 'time'>) => void
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
const nowHM = () => new Date().toTimeString().slice(0, 5)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<EventData>(() => load(KEY, seed()))
  const [cicloId, setCicloId] = useState<string | null>(() => load(KEY + '-ciclo', null))
  const [session, setSession] = useState<Session | null>(() => load(KEY + '-session', null))

  useEffect(() => save(KEY, data), [data])
  useEffect(() => save(KEY + '-ciclo', cicloId), [cicloId])
  useEffect(() => save(KEY + '-session', session), [session])

  const store: Store = {
    ...data,
    cicloId,
    setCiclo: setCicloId,
    session,
    login: (u, p) => {
      const s = checkLogin(u.trim().toLowerCase(), p)
      if (s) setSession(s)
      return !!s
    },
    logout: () => setSession(null),

    addParticipant: (p) => {
      const name = p.name.trim().replace(/\s+/g, ' ')
      if (name.length < 5) return 'Escribe nombres y apellidos completos.'
      const same = data.participants.filter((x) => x.groupId === p.groupId && x.disciplineId === p.disciplineId)
      if (same.some((x) => x.name.toLowerCase() === name.toLowerCase())) return 'Ese estudiante ya está inscrito en esta disciplina.'
      if (discipline(p.disciplineId)?.usesJersey) {
        if (!p.jersey || p.jersey < 1 || p.jersey > 99) return 'Indica un dorsal entre 1 y 99.'
        if (same.some((x) => x.jersey === p.jersey)) return `El dorsal ${p.jersey} ya está asignado en este equipo.`
      }
      setData((d) => ({ ...d, participants: [...d.participants, { ...p, name, id: uid(), status: 'pendiente' }] }))
      return null
    },
    confirmParticipant: (id) =>
      setData((d) => ({ ...d, participants: d.participants.map((x) => (x.id === id ? { ...x, status: 'confirmado' } : x)) })),
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
    resolveCorrection: (id, patch) =>
      setData((d) => {
        const c = d.corrections.find((x) => x.id === id)
        if (!c) return d
        return {
          ...d,
          corrections: d.corrections.map((x) => (x.id === id ? { ...x, status: patch ? 'resuelta' : 'rechazada' } : x)),
          participants: patch ? d.participants.map((x) => (x.id === c.participantId ? { ...x, ...patch } : x)) : d.participants,
        }
      }),

    updateActivity: (id, patch) => {
      const cur = data.activities.find((x) => x.id === id)
      if (!cur) return 'Actividad no encontrada.'
      const next = { ...cur, ...patch }
      if (toMin(next.end) <= toMin(next.start)) return 'La hora de fin debe ser posterior a la de inicio.'
      if (next.status !== 'cancelado' && next.status !== 'finalizado') {
        for (const o of data.activities) {
          if (o.id === id || o.status === 'cancelado' || o.status === 'finalizado') continue
          const overlap = toMin(next.start) < toMin(o.end) && toMin(o.start) < toMin(next.end)
          if (!overlap) continue
          if (o.venueId === next.venueId)
            return `Cruce de lugar: ${venue(o.venueId).name} ya tiene «${actTitle(o)}» (${fmtTime(o.start)} – ${fmtTime(o.end)})`
          const shared = isDuel(next) && isDuel(o) && next.disciplineId === o.disciplineId && next.groupIds.find((gid) => o.groupIds.includes(gid))
          if (shared) return `Cruce de equipo: ${group(shared)!.name} ya juega «${actTitle(o)}» a esa hora.`
        }
      }
      setData((d) => ({ ...d, activities: d.activities.map((x) => (x.id === id ? next : x)) }))
      return null
    },
    addAnnouncement: (a) =>
      setData((d) => ({ ...d, announcements: [{ ...a, id: uid(), time: nowHM() }, ...d.announcements] })),
    reset: () => setData(seed()),
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}
