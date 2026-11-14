// Modelo de datos genérico: un evento tiene "grupos" (hoy ciclos; mañana carreras
// o facultades), disciplinas, sedes (zonas del mapa) y actividades.

export type Status = 'pendiente' | 'en_curso' | 'finalizado' | 'reprogramado' | 'cancelado'

export interface Group {
  id: string
  name: string // "X ciclo"
  short: string // "X"
  ordinal: string // "10°"
  theme: string
  color: string
}

export interface Discipline {
  id: string
  name: string
  icon: string
  /** duelo: partidos de un equipo contra otro. puntos: todos compiten y acumulan puntaje. */
  format: 'duelo' | 'puntos'
  usesJersey: boolean
}

export interface Venue {
  id: string
  name: string
  color: string
  text: string
}

export interface Activity {
  id: string
  title: string
  disciplineId?: string
  venueId: string
  start: string // "HH:MM"
  end: string
  /** Duelo: 2 grupos (vacío = por definir). Puntos o general: vacío = todos. */
  groupIds: string[]
  status: Status
  score?: [number, number]
  points?: Record<string, number>
  stage?: string
  note?: string
}

export interface Participant {
  id: string
  groupId: string
  disciplineId: string
  name: string
  jersey?: number
  status: 'pendiente' | 'confirmado'
}

export interface Announcement {
  id: string
  title: string
  body: string
  time: string
  /** Vacío = para todos. */
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
}
