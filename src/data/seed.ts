import type { Activity, Discipline, EventData, Group, Participant, Venue } from './types'

// DATOS DE DEMOSTRACIÓN. Nombres, temáticas, horarios y resultados son inventados.

export const EVENT_NAME = 'Día de Integración · Ing. de Sistemas e IA'

const g = (n: number, short: string, theme: string, color: string): Group => ({
  id: `c${n}`,
  name: `${short} ciclo`,
  short,
  ordinal: `${n}°`,
  theme,
  color,
})

export const GROUPS: Group[] = [
  g(1, 'I', 'Scratch', '#f59e0b'),
  g(2, 'II', 'Python', '#2f7dd1'),
  g(3, 'III', 'Java', '#d9482b'),
  g(4, 'IV', 'C++', '#0e7490'),
  g(5, 'V', 'JavaScript', '#b88a00'),
  g(6, 'VI', 'Linux', '#374151'),
  g(7, 'VII', 'Kotlin', '#9333ea'),
  g(8, 'VIII', 'Docker', '#0284c7'),
  g(9, 'IX', 'Rust', '#b45309'),
  g(10, 'X', 'php', '#5b4bc4'),
]

export const DISCIPLINES: Discipline[] = [
  { id: 'futbol', name: 'Fútbol', icon: '⚽', format: 'duelo', usesJersey: true },
  { id: 'voley', name: 'Vóley', icon: '🏐', format: 'duelo', usesJersey: true },
  { id: 'basquet', name: 'Básquet', icon: '🏀', format: 'duelo', usesJersey: true },
  { id: 'ajedrez', name: 'Ajedrez', icon: '♟️', format: 'puntos', usesJersey: false },
  { id: 'gincana', name: 'Gincana', icon: '🎯', format: 'puntos', usesJersey: false },
]

export const VENUES: Venue[] = [
  { id: 'cancha1', name: 'Cancha 1', color: '#f25c5c', text: '#3b0d0d' },
  { id: 'cancha2', name: 'Cancha 2', color: '#19b5d8', text: '#06303a' },
  { id: 'cancha3', name: 'Cancha 3', color: '#7ed957', text: '#173a08' },
  { id: 'cancha4', name: 'Cancha 4', color: '#f7d54a', text: '#3f3300' },
  { id: 'voley', name: 'Vóley', color: '#7c4ddb', text: '#ffffff' },
  { id: 'basquet', name: 'Básquet', color: '#14308f', text: '#ffffff' },
  { id: 'local', name: 'Local de actividades', color: '#f9914a', text: '#3d1c00' },
  { id: 'piscina', name: 'Piscina', color: '#2a8fd6', text: '#ffffff' },
]

let n = 0
const act = (a: Omit<Activity, 'id'>): Activity => ({ id: `a${++n}`, ...a })
const duel = (
  disciplineId: string,
  venueId: string,
  start: string,
  end: string,
  a: number,
  b: number,
  status: Activity['status'],
  score?: [number, number],
  extra: Partial<Activity> = {},
) =>
  act({
    title: '',
    disciplineId,
    venueId,
    start,
    end,
    groupIds: [`c${a}`, `c${b}`],
    status,
    score,
    stage: 'Primera ronda',
    ...extra,
  })

const ACTIVITIES: Activity[] = [
  act({ title: 'Inauguración y bienvenida', venueId: 'local', start: '08:30', end: '09:00', groupIds: [], status: 'finalizado' }),

  duel('futbol', 'cancha1', '09:00', '09:40', 1, 2, 'finalizado', [2, 1]),
  duel('futbol', 'cancha2', '09:00', '09:40', 3, 4, 'finalizado', [0, 3]),
  duel('futbol', 'cancha3', '09:00', '09:40', 5, 6, 'finalizado', [2, 0]),
  duel('futbol', 'cancha4', '09:00', '09:40', 7, 8, 'finalizado', [1, 2]),
  duel('basquet', 'basquet', '09:00', '09:45', 10, 8, 'finalizado', [24, 18]),
  duel('voley', 'voley', '09:00', '09:45', 1, 2, 'finalizado', [2, 0]),

  duel('futbol', 'cancha1', '10:00', '10:40', 10, 9, 'en_curso', [1, 0]),
  duel('voley', 'voley', '10:10', '10:55', 10, 5, 'en_curso', [1, 0]),
  duel('basquet', 'basquet', '10:00', '10:45', 3, 5, 'en_curso', [10, 12]),
  act({
    title: 'Ajedrez · Ronda 1',
    disciplineId: 'ajedrez',
    venueId: 'local',
    start: '10:00',
    end: '11:00',
    groupIds: [],
    status: 'en_curso',
    points: { c10: 2, c7: 2, c3: 1, c5: 1, c1: 0, c8: 0 },
  }),

  duel('futbol', 'cancha2', '10:50', '11:30', 2, 4, 'pendiente', undefined, { stage: 'Cuartos de final' }),
  duel('basquet', 'basquet', '11:00', '11:45', 1, 6, 'pendiente'),
  duel('voley', 'voley', '11:30', '12:15', 3, 7, 'reprogramado', undefined, { note: 'Antes programado para las 10:40' }),
  act({ title: 'Gincana de integración', disciplineId: 'gincana', venueId: 'local', start: '11:00', end: '12:00', groupIds: [], status: 'pendiente' }),
  duel('futbol', 'cancha3', '11:40', '12:20', 5, 8, 'pendiente', undefined, { stage: 'Cuartos de final' }),
  act({ title: 'Juegos acuáticos', venueId: 'piscina', start: '12:00', end: '13:00', groupIds: [], status: 'pendiente' }),
  act({ title: 'Almuerzo de confraternidad', venueId: 'local', start: '13:00', end: '14:00', groupIds: [], status: 'pendiente' }),
  act({ title: 'Semifinal 1', disciplineId: 'futbol', venueId: 'cancha1', start: '14:15', end: '14:55', groupIds: [], status: 'pendiente', stage: 'Semifinal' }),
  act({ title: 'Semifinal 2', disciplineId: 'futbol', venueId: 'cancha4', start: '14:15', end: '14:55', groupIds: [], status: 'pendiente', stage: 'Semifinal' }),
  act({ title: 'Final de básquet', disciplineId: 'basquet', venueId: 'basquet', start: '15:00', end: '15:45', groupIds: [], status: 'pendiente', stage: 'Final' }),
  act({ title: 'Final de vóley', disciplineId: 'voley', venueId: 'voley', start: '15:00', end: '15:45', groupIds: [], status: 'pendiente', stage: 'Final' }),
  act({ title: 'Final de fútbol', disciplineId: 'futbol', venueId: 'cancha1', start: '16:00', end: '16:50', groupIds: [], status: 'pendiente', stage: 'Final' }),
  act({ title: 'Premiación y clausura', venueId: 'local', start: '17:00', end: '17:30', groupIds: [], status: 'pendiente' }),
]

const FIRST = ['Ana', 'Luis', 'María', 'Carlos', 'Lucía', 'Diego', 'Valeria', 'José', 'Camila', 'Renzo', 'Fiorella', 'Marco', 'Sofía', 'Piero', 'Daniela', 'Jorge']
const LAST = ['Rojas', 'Castillo', 'Vásquez', 'Mendoza', 'Flores', 'Rodríguez', 'Chávez', 'Paredes', 'Reyes', 'Cruz', 'Sánchez', 'León', 'Díaz', 'Torres', 'Alva', 'Guevara']

function makeParticipants(): Participant[] {
  const out: Participant[] = []
  let k = 0
  GROUPS.forEach((grp, gi) => {
    DISCIPLINES.forEach((d, di) => {
      const count = d.id === 'futbol' ? 7 : d.id === 'ajedrez' ? 2 : d.id === 'gincana' ? 4 : 6
      for (let i = 0; i < count; i++) {
        const s = gi * 7 + di * 3 + i * 5
        out.push({
          id: `p${++k}`,
          groupId: grp.id,
          disciplineId: d.id,
          name: `${FIRST[s % FIRST.length]} ${LAST[(s * 3 + gi) % LAST.length]} ${LAST[(s + di + 5) % LAST.length]}`,
          jersey: d.usesJersey ? i * 3 + 1 + ((gi + di) % 3) : undefined,
          status: i === count - 1 && gi % 2 === 1 ? 'pendiente' : 'confirmado',
        })
      }
    })
  })
  return out
}

export const seed = (): EventData => ({
  activities: ACTIVITIES.map((a) => ({ ...a })),
  participants: makeParticipants(),
  announcements: [
    { id: 'n1', title: 'Cambio de horario en vóley', body: 'El partido III vs VII se reprograma para las 11:30 a. m. en la cancha de vóley.', time: '09:50', groupIds: ['c3', 'c7'], kind: 'cambio' },
    { id: 'n2', title: 'Gincana a las 11:00', body: 'Cada ciclo debe presentar a sus 4 representantes en el local de actividades 10 minutos antes.', time: '09:30', groupIds: [], kind: 'info' },
    { id: 'n3', title: 'Delegados: revisen sus listas', body: 'Verifiquen nombres y dorsales de sus equipos antes de cada partido.', time: '08:45', groupIds: [], kind: 'info' },
  ],
  corrections: [],
})
