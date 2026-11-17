import { createClient } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { LOCAL_ONLY, SUPABASE } from '../config'
import { computeBracket, teamGroup, teamName, type Bracket } from './bracket'
import { DISCIPLINES, EVENT, GROUPS, TEAMS, VENUES, seed } from './seed'
import type { Activity, Announcement, Correction, EventData, Participant, ScoreReport } from './types'

// Capa de datos. Con Supabase (modo normal) los datos son compartidos y se
// actualizan en vivo; una copia queda en el navegador para mostrarse sin señal.
// Con VITE_LOCAL=1 todo vive solo en el navegador (vista previa de demostración).

const sb = LOCAL_ONLY ? null : createClient(SUPABASE.url, SUPABASE.anonKey, { auth: { persistSession: false } })
export const REMOTE = !!sb

const KEY = REMOTE ? 'fundo-organiza-cache-v2' : 'fundo-organiza-v4'

export interface Session {
  role: 'admin' | 'delegado'
  groupId?: string
  token?: string
}

// Solo para la versión de demostración (sin servidor).
function demoLogin(user: string, pass: string): Session | null {
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
export const venue = (id: string) => VENUES.find((x) => x.id === id) ?? VENUES[VENUES.length - 1]
export const teamsFor = (disciplineId: string, groupId: string) => TEAMS[disciplineId]?.[groupId] ?? [groupId]
export const byStart = (a: Activity, b: Activity) => toMin(a.start) - toMin(b.start) || toMin(a.end) - toMin(b.end)
/** Días que faltan para el evento (0 = hoy, negativo = ya pasó). */
export const daysToEvent = () => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
  return Math.round((Date.parse(EVENT.day) - Date.parse(today)) / 864e5)
}
export { teamGroup, teamName }

export type NewParticipant = Omit<Participant, 'id' | 'status'>
type Result = Promise<string | null>

interface Store extends EventData {
  bracket: Bracket
  /** false si la última sincronización con el servidor falló (se muestran datos guardados). */
  online: boolean
  loaded: boolean
  deadline: string
  inscriptionsOpen: boolean
  cicloId: string | null
  setCiclo: (id: string | null) => void
  session: Session | null
  login: (u: string, p: string) => Promise<boolean>
  logout: () => void
  changePassword: (oldPass: string, newPass: string) => Result
  listAccounts: () => Promise<{ username: string; role: string; group_id: string | null }[]>
  resetPassword: (user: string) => Promise<{ pass?: string; error?: string }>
  plays: (a: Activity, groupId: string) => boolean
  isGeneral: (a: Activity) => boolean
  title: (a: Activity) => string
  addParticipant: (p: NewParticipant) => Result
  confirmParticipants: (ids: string[]) => Result
  removeParticipant: (id: string) => Result
  requestCorrection: (participantId: string, message: string) => Result
  resolveCorrection: (id: string, patch: Partial<Participant> | null) => Result
  updateActivity: (id: string, patch: Partial<Activity>) => Result
  addActivity: (a: Pick<Activity, 'title' | 'venueId' | 'start' | 'end'>) => Result
  removeActivity: (id: string) => Result
  setDirect: (disciplineId: string, team: string) => Result
  addAnnouncement: (a: Omit<Announcement, 'id' | 'date'>) => Result
  removeAnnouncement: (id: string) => Result
  /** El delegado registra el resultado de un partido de su ciclo. */
  reportScore: (activityId: string, r: Omit<ScoreReport, 'activityId' | 'groupId' | 'date'>) => Result
  /** Partidos con marcadores distintos entre delegados. */
  disputes: Activity[]
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

export const NAME_RE = /^[^,]+,\s*[^,]+$/
export const normEmail = (e: string) => e.trim().toLowerCase()

/** Reglas de inscripción. En modo Supabase el servidor las vuelve a aplicar. */
export function validateParticipant(all: Participant[], p: NewParticipant, ignoreId?: string): string | null {
  const d = discipline(p.disciplineId)
  const rule = d?.roster
  if (!d || !rule) return 'Disciplina no válida.'
  const others = all.filter((x) => x.id !== ignoreId)
  if (!NAME_RE.test(clean(p.name))) return 'Escribe el nombre como «Apellidos, Nombres» (por ejemplo: Rojas Cruz, Ana María).'
  if (!/^(\d{6}|\d{9})$/.test(p.upaoId)) return 'El ID UPAO debe tener 6 o 9 dígitos.'
  if (!/^\d{8}$/.test(p.dni)) return 'El DNI debe tener 8 dígitos.'
  if (!/^[a-z0-9._%+-]+@upao\.edu\.pe$/.test(normEmail(p.email))) return 'Usa el correo institucional (termina en @upao.edu.pe).'
  // Los ID de otros ciclos no llegan al navegador del delegado: el servidor completa estas comprobaciones.
  const same = others.filter((x) => x.upaoId && x.upaoId === p.upaoId)
  if (same.some((x) => x.dni && x.dni !== p.dni)) return 'Ese ID UPAO ya está registrado con otro DNI.'
  if (others.some((x) => x.dni && x.dni === p.dni && x.upaoId && x.upaoId !== p.upaoId)) return 'Ese DNI ya está registrado con otro ID UPAO.'
  const other = same.find((x) => x.groupId !== p.groupId)
  if (other) return `Ese ID ya está inscrito por ${group(other.groupId)!.name}. Cada estudiante participa por un solo ciclo.`
  if (same.some((x) => x.disciplineId === p.disciplineId)) return `Ese ID ya está inscrito en ${d.name}.`
  const sports = same.filter((x) => discipline(x.disciplineId)?.roster?.sport)
  if (rule.sport) {
    if (sports.length >= 2) return 'Máximo 2 deportes por jugador (fútbol, vóley o básquet).'
    if (same.some((x) => x.disciplineId === 'gincana')) return 'Quien está en la gincana no puede inscribirse en fútbol, vóley ni básquet.'
  }
  if (p.disciplineId === 'gincana' && sports.length) return 'Quien está inscrito en fútbol, vóley o básquet no puede inscribirse en la gincana.'
  const team = others.filter((x) => x.disciplineId === p.disciplineId && x.teamId === p.teamId)
  if (rule.max && team.length >= rule.max) return `El equipo ya tiene el máximo de ${rule.max} inscritos en ${d.name}.`
  if (rule.jersey) {
    if (!p.jersey || p.jersey < 1 || p.jersey > 99 || !Number.isInteger(p.jersey)) return 'Indica un número de polo entre 1 y 99.'
    if (team.some((x) => x.jersey === p.jersey)) return `El número ${p.jersey} ya está asignado en este equipo de ${d.name}.`
  }
  return null
}

/** Revisa que un marcador sea posible según el deporte. */
export function validateReport(a: Activity, r: Omit<ScoreReport, 'activityId' | 'groupId' | 'date'>, teams: [string, string]): string | null {
  const unit = discipline(a.disciplineId)?.unit
  if (r.wo) {
    if (!r.winner || ![...teams, 'none'].includes(r.winner)) return 'Indica quién gana por W.O.'
    return null
  }
  const [x, y] = r.score
  if (![x, y].every((n) => Number.isInteger(n) && n >= 0 && n < 300)) return 'Marcador no válido.'
  if (unit === 'Sets' && (Math.max(x, y) !== 2 || Math.min(x, y) > 1)) return 'En vóley gana quien llega a 2 sets (2-0 o 2-1).'
  if (unit === 'Puntos' && x === y) return 'En básquet no hay empate: se define por punto de oro.'
  if (unit === 'Goles' && x === y && (!r.winner || !teams.includes(r.winner))) return 'Empate: indica quién ganó en penales.'
  return null
}

/** Compara reportes: iguales = mismo marcador, mismo W.O. y mismo ganador. */
const sameReport = (a: ScoreReport, b: ScoreReport) =>
  a.score[0] === b.score[0] && a.score[1] === b.score[1] && !!a.wo === !!b.wo && (a.winner ?? '') === (b.winner ?? '')

/* ------------------------------------------------------------ Supabase */

type Row = Record<string, unknown>
const toParticipant = (r: Row): Participant => ({
  id: r.id as string,
  groupId: r.group_id as string,
  teamId: r.team_id as string,
  disciplineId: r.discipline_id as string,
  name: r.name as string,
  upaoId: (r.upao_id as string) ?? '',
  dni: (r.dni as string) ?? '',
  email: (r.email as string) ?? '',
  jersey: (r.jersey as number) ?? undefined,
  status: r.status as Participant['status'],
})
const toCorrection = (r: Row): Correction => ({
  id: r.id as string,
  participantId: r.participant_id as string,
  groupId: r.group_id as string,
  message: r.message as string,
  status: r.status as Correction['status'],
})
const errMsg = (e: { message?: string } | null) =>
  e ? (/fetch|network/i.test(e.message ?? '') ? 'Sin conexión con el servidor. Revisa tu señal e inténtalo de nuevo.' : (e.message ?? 'Error desconocido.')) : null

interface Remote {
  data: EventData
  deadline: string
}

async function fetchRemote(session: Session | null): Promise<Remote> {
  const [a, n, s, p, rp] = await Promise.all([
    sb!.from('activities').select('data'),
    sb!.from('announcements').select('data,created_at').order('created_at', { ascending: false }),
    sb!.from('settings').select('key,value'),
    sb!.from('participants_public').select('*').order('created_at'),
    sb!.from('score_reports').select('*'),
  ])
  const err = a.error || n.error || s.error || p.error || rp.error
  if (err) throw err
  const settings = Object.fromEntries((s.data ?? []).map((r) => [r.key, r.value]))
  let participants = (p.data ?? []).map(toParticipant)
  let corrections: Correction[] = []
  if (session?.token) {
    const [mp, mc] = await Promise.all([sb!.rpc('my_participants', { p_token: session.token }), sb!.rpc('my_corrections', { p_token: session.token })])
    if (mp.error) throw mp.error
    const full = new Map((mp.data as Row[]).map((r) => [r.id as string, toParticipant(r)]))
    participants = participants.map((x) => full.get(x.id) ?? x)
    corrections = ((mc.data as Row[]) ?? []).map(toCorrection)
  }
  return {
    data: {
      activities: (a.data ?? []).map((r) => r.data as Activity),
      announcements: (n.data ?? []).map((r) => r.data as Announcement),
      participants,
      corrections,
      reports: (rp.data ?? []).map((r) => ({ ...(r.report as Omit<ScoreReport, 'activityId' | 'groupId'>), activityId: r.activity_id, groupId: r.group_id, date: r.updated_at })),
      directOverride: (settings.directOverride as Record<string, string>) ?? {},
    },
    deadline: (settings.deadline as string) ?? EVENT.deadline,
  }
}

/* ------------------------------------------------------------ Provider */

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<EventData>(() => ({ ...seed(), ...load<Partial<EventData>>(KEY, {}) }))
  const [deadline, setDeadline] = useState<string>(() => load(KEY + '-deadline', EVENT.deadline))
  const [online, setOnline] = useState(true)
  const [loaded, setLoaded] = useState(!REMOTE)
  const [cicloId, setCicloId] = useState<string | null>(() => load('fundo-organiza-ciclo', null))
  const [session, setSession] = useState<Session | null>(() => load(KEY + '-session', null))
  const [now, setNow] = useState(Date.now())
  const sessionRef = useRef(session)
  sessionRef.current = session

  useEffect(() => save(KEY, data), [data])
  useEffect(() => save(KEY + '-deadline', deadline), [deadline])
  useEffect(() => save('fundo-organiza-ciclo', cicloId), [cicloId])
  useEffect(() => save(KEY + '-session', session), [session])
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const refresh = useCallback(async () => {
    if (!sb) return
    try {
      const r = await fetchRemote(sessionRef.current)
      setData(r.data)
      setDeadline(r.deadline)
      setOnline(true)
    } catch (e) {
      const m = (e as Error).message ?? ''
      if (/sesión expiró/i.test(m)) setSession(null)
      setOnline(false)
    } finally {
      setLoaded(true)
    }
  }, [])

  // Carga inicial, actualización en vivo y respaldo periódico.
  useEffect(() => {
    if (!sb) return
    refresh()
    let timer: ReturnType<typeof setTimeout> | undefined
    const soon = () => {
      clearTimeout(timer)
      timer = setTimeout(refresh, 400)
    }
    const ch = sb
      .channel('publico')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, soon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, soon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, soon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'score_reports' }, soon)
      .subscribe()
    const poll = setInterval(refresh, 45_000)
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', refresh)
    return () => {
      clearInterval(poll)
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', refresh)
      sb!.removeChannel(ch)
    }
  }, [refresh])
  useEffect(() => {
    if (REMOTE) refresh()
  }, [session?.token, refresh])

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
    // Solo se cruzan dos competencias en el mismo lugar; las actividades generales
    // (almuerzo, música, bailetón…) pueden compartir espacio y horario.
    if (!next.disciplineId) return null
    for (const o of data.activities) {
      if (o.id === next.id || !o.disciplineId || o.status === 'cancelado' || o.status === 'finalizado') continue
      if (o.venueId === next.venueId && toMin(next.start) < toMin(o.end) && toMin(o.start) < toMin(next.end))
        return `Cruce de lugar: ${venue(o.venueId).name} ya tiene «${title(o)}» (${fmtTime(o.start)} – ${fmtTime(o.end)}).`
    }
    return null
  }

  /** Ejecuta una función del servidor y vuelve a cargar los datos. */
  const rpc = async (fn: string, args: Record<string, unknown>): Result => {
    const { error } = await sb!.rpc(fn, { p_token: session?.token, ...args })
    if (error) {
      if (/sesión expiró/i.test(error.message)) setSession(null)
      return errMsg(error)
    }
    await refresh()
    return null
  }
  const local = (f: (d: EventData) => EventData): Result => {
    setData(f)
    return Promise.resolve(null)
  }
  const open = now < new Date(deadline).getTime()
  const saveActivity = (next: Activity): Result => {
    const err = conflict(next)
    if (err) return Promise.resolve(err)
    if (!REMOTE) return local((d) => ({ ...d, activities: d.activities.some((x) => x.id === next.id) ? d.activities.map((x) => (x.id === next.id ? next : x)) : [...d.activities, next] }))
    return rpc('admin_save_activity', { p_data: next })
  }

  const store: Store = {
    ...data,
    bracket,
    online,
    loaded,
    deadline,
    inscriptionsOpen: open,
    cicloId,
    setCiclo: setCicloId,
    session,
    login: async (u, p) => {
      const user = u.trim().toLowerCase()
      if (!sb) {
        const s = demoLogin(user, p)
        if (s) setSession(s)
        return !!s
      }
      const { data: r, error } = await sb.rpc('login', { p_user: user, p_pass: p })
      if (error) throw new Error(errMsg(error)!)
      if (!r) return false
      setSession({ role: r.role, groupId: r.groupId ?? undefined, token: r.token })
      return true
    },
    logout: () => {
      if (sb && session?.token) sb.rpc('logout', { p_token: session.token }).then(() => undefined)
      setSession(null)
    },
    listAccounts: async () => {
      if (!sb) return []
      const { data: r } = await sb.rpc('admin_list_accounts', { p_token: session?.token })
      return r ?? []
    },
    resetPassword: async (user) => {
      if (!sb) return { error: 'No disponible en la versión de demostración.' }
      const { data: r, error } = await sb.rpc('admin_reset_password', { p_token: session?.token, p_user: user })
      return error ? { error: errMsg(error)! } : { pass: r as string }
    },
    changePassword: async (o, n) => {
      if (!sb) return 'En la versión de demostración no se pueden cambiar contraseñas.'
      const { error } = await sb.rpc('change_password', { p_token: session?.token, p_old: o, p_new: n })
      return errMsg(error)
    },
    plays: (a, gid) => !!bracket.sides[a.id]?.some((s) => s.team && teamGroup(s.team) === gid),
    isGeneral: (a) => !a.sides || 'label' in a.sides[0],
    title,

    addParticipant: async (raw) => {
      if (session?.role !== 'admin' && !open) return `El plazo de inscripción venció (${EVENT.deadlineLabel}).`
      const p = { ...raw, name: clean(raw.name), upaoId: raw.upaoId.trim() }
      // En modo Supabase el delegado no ve los ID de otros ciclos: el servidor completa la validación.
      const err = validateParticipant(data.participants, p)
      if (err) return err
      if (REMOTE) return rpc('add_participant', { p })
      return local((d) => ({ ...d, participants: [...d.participants, { ...p, id: uid(), status: 'pendiente' }] }))
    },
    confirmParticipants: (ids) =>
      REMOTE
        ? rpc('admin_confirm', { p_ids: ids })
        : local((d) => ({ ...d, participants: d.participants.map((x) => (ids.includes(x.id) ? { ...x, status: 'confirmado' } : x)) })),
    removeParticipant: (id) =>
      REMOTE
        ? rpc('admin_remove_participant', { p_id: id })
        : local((d) => ({ ...d, participants: d.participants.filter((x) => x.id !== id), corrections: d.corrections.filter((c) => c.participantId !== id) })),
    requestCorrection: (participantId, message) => {
      if (REMOTE) return rpc('request_correction', { p_participant: participantId, p_message: message })
      const p = data.participants.find((x) => x.id === participantId)
      if (!p) return Promise.resolve('Participante no encontrado.')
      return local((d) => ({ ...d, corrections: [...d.corrections, { id: uid(), participantId, groupId: p.groupId, message, status: 'pendiente' }] }))
    },
    resolveCorrection: async (id, patch) => {
      const c = data.corrections.find((x) => x.id === id)
      const p = data.participants.find((x) => x.id === c?.participantId)
      if (!c || !p) return 'Solicitud no encontrada.'
      if (patch) {
        const next = { ...p, ...patch, name: clean(patch.name ?? p.name) }
        const err = validateParticipant(data.participants, next, p.id)
        if (err) return err
        if (!REMOTE) setData((d) => ({ ...d, participants: d.participants.map((x) => (x.id === p.id ? next : x)) }))
      }
      if (REMOTE) return rpc('admin_resolve_correction', { p_id: id, p_patch: patch })
      return local((d) => ({ ...d, corrections: d.corrections.map((x) => (x.id === id ? { ...x, status: patch ? 'resuelta' : 'rechazada' } : x)) }))
    },

    updateActivity: (id, patch) => {
      const cur = data.activities.find((x) => x.id === id)
      if (!cur) return Promise.resolve('Actividad no encontrada.')
      return saveActivity(JSON.parse(JSON.stringify({ ...cur, ...patch })))
    },
    addActivity: (a) => saveActivity({ ...a, title: clean(a.title), id: 'x' + uid(), status: 'pendiente', custom: true }),
    removeActivity: (id) =>
      REMOTE ? rpc('admin_delete_activity', { p_id: id }) : local((d) => ({ ...d, activities: d.activities.filter((x) => x.id !== id || !x.custom) })),
    setDirect: (did, team) => {
      const o = { ...data.directOverride }
      if (team) o[did] = team
      else delete o[did]
      return REMOTE ? rpc('admin_set_setting', { p_key: 'directOverride', p_value: o }) : local((d) => ({ ...d, directOverride: o }))
    },
    addAnnouncement: (a) => {
      const n: Announcement = { ...a, id: uid(), date: new Date().toISOString() }
      return REMOTE ? rpc('admin_save_announcement', { p_data: n }) : local((d) => ({ ...d, announcements: [n, ...d.announcements] }))
    },
    removeAnnouncement: (id) =>
      REMOTE ? rpc('admin_delete_announcement', { p_id: id }) : local((d) => ({ ...d, announcements: d.announcements.filter((x) => x.id !== id) })),
    disputes: data.activities.filter((a) => a.dispute && a.status !== 'finalizado' && a.status !== 'cancelado'),
    reportScore: async (activityId, r) => {
      const a = data.activities.find((x) => x.id === activityId)
      const gid = session?.groupId
      const sides = bracket.sides[activityId]
      if (!a || !sides || !gid) return 'Partido no encontrado.'
      const teams = sides.map((x) => x.team) as [string, string]
      if (!teams[0] || !teams[1]) return 'Aún no se definen los dos equipos de este partido.'
      if (!teams.some((t) => teamGroup(t) === gid)) return 'Solo puedes registrar resultados de partidos de tu ciclo.'
      if (a.status === 'finalizado' || a.status === 'cancelado') return 'Este partido ya está cerrado. Si hay un error, avisa a la comisión organizadora.'
      const err = validateReport(a, r, teams)
      if (err) return err
      const clean: Omit<ScoreReport, 'activityId' | 'groupId' | 'date'> = r.wo ? { score: [0, 0], wo: true, winner: r.winner } : { score: r.score, winner: r.score[0] === r.score[1] ? r.winner : undefined }
      if (REMOTE) return rpc('report_score', { p_activity: activityId, p_report: clean })
      // Versión de demostración: misma lógica que el servidor.
      setData((d) => {
        const rep: ScoreReport = { ...clean, activityId, groupId: gid, date: new Date().toISOString() }
        const reports = [...d.reports.filter((x) => !(x.activityId === activityId && x.groupId === gid)), rep]
        const groups = [...new Set(teams.map(teamGroup))]
        const mine = groups.map((g) => reports.find((x) => x.activityId === activityId && x.groupId === g))
        let act = { ...a }
        if (mine.every(Boolean)) {
          if (mine.every((x) => sameReport(x!, mine[0]!)))
            act = { ...act, status: 'finalizado', score: rep.wo ? undefined : rep.score, wo: !!rep.wo, winner: rep.winner, dispute: false }
          else act = { ...act, dispute: true }
        }
        return { ...d, reports, activities: d.activities.map((x) => (x.id === activityId ? act : x)) }
      })
      return null
    },
    reset: () => {
      if (!REMOTE) setData(seed())
    },
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}
