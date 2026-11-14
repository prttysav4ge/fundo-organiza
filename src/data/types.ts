// Modelo genérico: un evento tiene "grupos" (hoy ciclos; mañana carreras o
// facultades), equipos, disciplinas, sedes (zonas del mapa) y actividades.

export type Status = 'pendiente' | 'en_curso' | 'finalizado' | 'reprogramado' | 'cancelado'

export interface Group {
  id: string
  name: string
  short: string
  theme: string
  color: string
  ink: string
}

export interface RosterRule {
  max?: number
  jersey: boolean
  gender?: boolean
  /** Cuenta para el límite de 2 deportes y excluye de la gincana. */
  sport: boolean
}

export interface Discipline {
  id: string
  name: string
  icon: string
  /** duelo: llave de eliminación. puntos: puestos que suman puntaje. partido: un solo encuentro. info: sin competencia en cancha. */
  format: 'duelo' | 'puntos' | 'partido' | 'info'
  unit?: string
  roster?: RosterRule
  summary: string
  rules: string[]
}

export interface Venue {
  id: string
  name: string
  color: string
  text: string
}

/** Lado de un partido: equipo fijo, ganador de otro partido, cupo de la llave o texto libre. */
export type Side =
  | { team: string }
  | { winner: string }
  | { slot: 'direct' | 'semiA' | 'semiB'; of: string }
  | { label: string }

export interface Activity {
  id: string
  code?: string
  title: string
  disciplineId?: string
  venueId: string
  start: string // "HH:MM"
  end: string
  approx?: boolean
  sides?: [Side, Side]
  status: Status
  score?: [number, number]
  /** Ganador explícito: por penales o por W.O. ('none' = doble W.O.). */
  winner?: string
  wo?: boolean
  /** Gincana: grupos en orden de puesto (1.° a 4.°). */
  places?: string[]
  stage?: string
  note?: string
  custom?: boolean
}

export interface Participant {
  id: string
  groupId: string
  teamId: string
  disciplineId: string
  name: string
  upaoId: string
  jersey?: number
  gender?: 'F' | 'M'
  status: 'pendiente' | 'confirmado'
}

export interface Announcement {
  id: string
  title: string
  body: string
  date: string
  groupIds: string[]
  kind: 'info' | 'cambio' | 'urgente'
}

export interface Correction {
  id: string
  participantId: string
  groupId: string
  message: string
  status: 'pendiente' | 'resuelta' | 'rechazada'
}

export interface EventData {
  activities: Activity[]
  participants: Participant[]
  announcements: Announcement[]
  corrections: Correction[]
  /** Pase directo a la final decidido por la comisión (por disciplina). */
  directOverride: Record<string, string>
}
