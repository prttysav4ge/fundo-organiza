import type { Activity, Discipline, EventData, Group, Side, Venue } from './types'

// Datos tomados de las Bases del Día de Integración ICSI – ISIA 2026.

export const EVENT = {
  name: 'Día de Integración ICSI – ISIA 2026',
  dateLabel: 'Sábado 21 de noviembre de 2026',
  hours: '8:00 a. m. – 5:00 p. m.',
  place: 'Fundo UPAO',
  day: '2026-11-21',
  /** Cierre de inscripciones en la plataforma: jueves 19 de noviembre, 4:00 p. m. (hora de Perú). */
  deadline: '2026-11-19T16:00:00-05:00',
  /** Concurso tecnológico: formulario de postulación y bases en PDF. */
  contestFormUrl: 'https://forms.gle/nciCAkMdrx5XuE4n9',
  contestRulesUrl: 'https://drive.google.com/file/d/1I4lGUvqXBHAM-Ow124MSimqJ17CVxTzy/view?usp=sharing',
  deadlineLabel: 'jueves 19 de noviembre, 4:00 p. m.',
}

const ORD = ['1.er', '2.°', '3.er', '4.°', '5.°', '6.°', '7.°', '8.°', '9.°', '10.°']
const LANG: [string, string, string][] = [
  ['Java', '#e76f00', '#fff'],
  ['JavaScript', '#f2d21b', '#2b2400'],
  ['C++', '#00599c', '#fff'],
  ['Ruby', '#cc342d', '#fff'],
  ['C#', '#68217a', '#fff'],
  ['TypeScript', '#3178c6', '#fff'],
  ['Assembly', '#5c6470', '#fff'],
  ['Python', '#2f6f9f', '#ffd43b'],
  ['Rust', '#a0410d', '#fff'],
  ['PHP', '#6a6fb0', '#fff'],
]

export const GROUPS: Group[] = [
  ...LANG.map(([theme, color, ink], i) => ({ id: `c${i + 1}`, name: `${ORD[i]} ciclo`, short: `${i + 1}`, theme, color, ink })),
  { id: 'ce', name: 'Egresados', short: 'E', theme: 'Swift', color: '#f05138', ink: '#fff' },
]

/** Equipos por disciplina cuando un grupo lleva más de uno (fútbol del 1.er ciclo). */
export const TEAMS: Record<string, Record<string, string[]>> = { futbol: { c1: ['c1.1', 'c1.2'] } }

const elim = 'Eliminación directa. De los tres ganadores de la 2.ª ronda, uno pasa directo a la final y los otros dos juegan la semifinal.'
const common = [
  'El resultado lo registran los delegados de los dos ciclos del partido. Si sus marcadores no coinciden, el partido queda en disputa y no se avanza hasta corregirlo.',
  'Sin tolerancia: el equipo que no esté completo a la hora programada pierde por W.O.',
  'Todos juegan con el polo de su ciclo y con su número de polo.',
  'Antes de cada partido se muestra el carnet universitario o el campus virtual.',
]

export const DISCIPLINES: Discipline[] = [
  {
    id: 'futbol',
    name: 'Fútbol',
    icon: '⚽',
    format: 'duelo',
    unit: 'Goles',
    roster: { max: 10, jersey: true, sport: true },
    summary: '12 equipos (el 1.er ciclo con dos), solo varones. Canchas 1, 2 y 3.',
    rules: [
      elim,
      '7 jugadores en cancha (6 + arquero) y hasta 3 suplentes.',
      'Dos tiempos de 15 minutos con 3 de descanso. Cambios ilimitados con reingreso.',
      'Empate: penales a muerte súbita desde el primer tiro.',
      'Pase directo: mayor diferencia de goles en su partido de 2.ª ronda (los penales no cuentan); si hay empate, mejor puesto en la gincana.',
      'Tarjeta roja: sale sin reemplazo y no juega más fútbol en el torneo.',
      ...common,
    ],
  },
  {
    id: 'voley',
    name: 'Vóley',
    icon: '🏐',
    format: 'duelo',
    unit: 'Sets',
    roster: { max: 8, jersey: true, sport: true },
    summary: '11 equipos mixtos. El 1.er ciclo pasa directo a la 2.ª ronda por sorteo.',
    rules: [
      elim,
      '6 jugadores en cancha y hasta 2 suplentes, con mínimo 2 mujeres en cancha todo el partido.',
      'Gana quien gane 2 sets: 1.° y 2.° a 15 puntos, 3.° a 10; siempre con 2 de diferencia.',
      'Las horas son aproximadas: cada partido empieza al terminar el anterior, nunca antes de la hora indicada.',
      'Pase directo: menos sets perdidos en el torneo (el 1.er ciclo no puede recibirlo); si hay empate, mejor puesto en la gincana.',
      'Tarjeta roja: sale sin reemplazo y no juega más vóley en el torneo.',
      ...common,
    ],
  },
  {
    id: 'basquet',
    name: 'Básquet',
    icon: '🏀',
    format: 'duelo',
    unit: 'Puntos',
    roster: { max: 8, jersey: true, sport: true },
    summary: '11 equipos, solo varones. El 7.° ciclo pasa directo a la 2.ª ronda por sorteo.',
    rules: [
      elim,
      '5 jugadores en cancha y hasta 3 suplentes.',
      'Dos tiempos de 10 minutos con 3 de descanso, a reloj corrido.',
      'Empate: punto de oro (gana el primero que anote).',
      'Con 5 faltas personales el jugador sale y puede ser reemplazado.',
      'Pase directo: mayor diferencia de puntos en el torneo (el 7.° ciclo no puede recibirlo); si hay empate, mejor puesto en la gincana.',
      ...common,
    ],
  },
  {
    id: 'gincana',
    name: 'Gincana',
    icon: '🎯',
    format: 'puntos',
    roster: { max: 10, jersey: false, sport: false },
    summary: '5 juegos seguidos en la cancha 4, de 10:30 a 11:50 a. m.',
    rules: [
      'Cada ciclo inscribe hasta 10 personas. Pueden participar también quienes juegan fútbol, vóley o básquet.',
      'Cada persona participa en máximo 2 juegos.',
      'Puntaje por juego: 1.° puesto 5 puntos, 2.° 3, 3.° 2 y 4.° 1.',
      'Gana el ciclo con más puntos. Desempate: más primeros puestos y, si persiste, un jalón de soga.',
      'La tabla final también desempata el pase directo a la final en fútbol, vóley y básquet.',
    ],
  },
  {
    id: 'concurso',
    name: 'Concurso tecnológico',
    icon: '💡',
    format: 'info',
    summary: 'Premio a la Excelencia en Creación Tecnológica Estudiantil (1.ª edición). Postulación hasta el jueves 19, 10:00 p. m. Ganador: sábado 21, 1:45 p. m., en el escenario.',
    rules: [
      'Pueden postular estudiantes vigentes y exalumnos de la carrera, solos o en equipo, sin límite de integrantes; cada uno debe haber aportado de verdad al proyecto. Una persona puede estar en más de un proyecto.',
      'Los equipos pueden tener integrantes externos a la UPAO: se inscriben con un nombre de grupo y al menos un estudiante o exalumno como representante.',
      'Cada exalumno adjunta una prueba de estudios (constancia de egresado, diploma, certificado o captura del campus virtual).',
      'El proyecto debe ser software accesible desde un enlace (web, app, bot o app móvil), gratuito, de uso libre (no hecho para una empresa), propio y original. No participan proyectos de hardware o IoT. Se puede usar IA para construirlo.',
      'Debe funcionar y seguir en línea desde la postulación hasta el sábado 21. Si no funciona cuando el jurado lo prueba, queda descalificado.',
      'Postulación: del viernes 13 al jueves 19 de noviembre, 10:00 p. m. Evaluación del jurado: viernes 20.',
      'Jurado: dos representantes del DNT Hub Digital UPAO y un docente de la carrera. No revisa el código; sus decisiones son inapelables.',
      'Criterios (nota de 1 a 5): potencial e impacto 35 %, concepto y problema 30 %, originalidad 20 %, experiencia de uso y diseño 15 %. Desempate: mayor nota en potencial e impacto.',
      'El jurado define los 3 primeros puestos y se les avisa antes del evento. Al menos un integrante de cada uno debe estar en el escenario a la 1:45 p. m.; si nadie del ganador está presente, el premio pasa al siguiente.',
      'Premio: diploma. Los proyectos siguen siendo de sus autores.',
    ],
  },
  {
    id: 'ajedrez',
    name: 'Ajedrez',
    icon: '♟️',
    format: 'individual',
    roster: { jersey: false, sport: false },
    summary: 'Torneo blitz individual en el escenario, de 11:30 a. m. a 12:30 p. m. Cada ciclo inscribe a los jugadores que quiera.',
    rules: [
      'Cada ciclo inscribe a los jugadores que quiera (sin límite). Pueden inscribirse aunque ya jueguen dos deportes.',
      'Es también una actividad de activación: cualquiera puede acercarse a aprender y habrá personas guiando a quienes recién empiezan.',
      'No cuenta para el límite de 2 deportes; quien juegue otro deporte es responsable de sus cruces de horario. No da derecho al almuerzo.',
      'Ritmo: 3 minutos por jugador con 2 segundos de incremento por jugada.',
      'Sistema suizo por rondas de 15 a 20 minutos. Si los jugadores son impares, en cada ronda descansa uno.',
      'Al iniciar la ronda corre el reloj del ausente; si no llega antes de que se agote, pierde por W.O. Con 2 W.O. queda retirado.',
      'Puntaje: victoria 1, empate ½, derrota 0. Desempates: resultado particular, Buchholz total y número de victorias.',
      'Leyes del Ajedrez de la FIDE. Pieza tocada, pieza jugada. La segunda jugada ilegal pierde la partida.',
      'Prohibido usar celulares, relojes inteligentes u otros dispositivos, conversar con el rival o el público y recibir ayuda.',
      'El campeón se anuncia en la premiación de las 2:00 p. m. No recibe trofeo.',
    ],
  },
  {
    id: 'futbol_damas',
    name: 'Fútbol damas',
    icon: '⚽',
    format: 'partido',
    unit: 'Goles',
    roster: { jersey: false, sport: false },
    summary: 'Un solo partido entre dos equipos de alumnas. Cancha 2, 11:20 a. m. Cada ciclo inscribe a las jugadoras que quiera.',
    rules: ['Mismas reglas del fútbol.', 'No cuenta para el límite de 2 deportes: las jugadoras pueden estar también en básquet damas y en vóley.', 'No otorga trofeo.'],
  },
  {
    id: 'basquet_damas',
    name: 'Básquet damas',
    icon: '🏀',
    format: 'partido',
    unit: 'Puntos',
    roster: { jersey: false, sport: false },
    summary: 'Un solo partido entre dos equipos de alumnas. Cancha de vóley, 12:55 p. m. Cada ciclo inscribe a las jugadoras que quiera.',
    rules: ['Mismas reglas del básquet.', 'No cuenta para el límite de 2 deportes: las jugadoras pueden estar también en fútbol damas y en vóley.', 'No otorga trofeo.'],
  },
]

export const VENUES: Venue[] = [
  { id: 'cancha1', name: 'Cancha 1', place: 'Cancha 1 de fútbol', color: '#f25c5c', text: '#3b0d0d' },
  { id: 'cancha2', name: 'Cancha 2', place: 'Cancha 2 de fútbol', color: '#19b5d8', text: '#06303a' },
  { id: 'cancha3', name: 'Cancha 3', place: 'Cancha 3 de fútbol', color: '#7ed957', text: '#173a08' },
  { id: 'cancha4', name: 'Cancha 4', place: 'Cancha 4', color: '#f7d54a', text: '#3f3300' },
  { id: 'voley', name: 'Vóley', place: 'Cancha de vóley', color: '#7c4ddb', text: '#ffffff' },
  { id: 'basquet', name: 'Básquet', place: 'Cancha de básquet', color: '#14308f', text: '#ffffff' },
  { id: 'escenario', name: 'Escenario', place: 'Escenario', color: '#f9914a', text: '#3d1c00' },
  { id: 'piscina', name: 'Piscina', place: 'Piscina', color: '#2a8fd6', text: '#ffffff' },
  { id: 'fundo', name: 'Fundo UPAO', place: 'Fundo UPAO', color: '#8792a6', text: '#ffffff' },
]

export const R1 = '1.ª ronda'
export const R2 = '2.ª ronda'

const t = (x: number | string): Side => ({ team: `c${x}` })
const w = (id: string): Side => ({ winner: id })
const semi = (of: string): [Side, Side] => [{ slot: 'semiA', of }, { slot: 'semiB', of }]

type Row = [string, [Side, Side], string, string, string]
const matches = (d: string, pre: string, rows: Row[], venue?: string, approx = false): Activity[] =>
  rows.map(([stage, sides, start, end, v], i) => ({
    id: `${pre}${i + 1}`,
    code: `P${i + 1}`,
    title: stage === 'Final' || stage === 'Semifinal' ? stage : '',
    disciplineId: d,
    venueId: venue ?? v,
    start,
    end,
    approx,
    sides,
    status: 'pendiente',
    stage,
  }))

const general = (id: string, title: string, venueId: string, start: string, end: string, extra: Partial<Activity> = {}): Activity => ({
  id,
  title,
  venueId,
  start,
  end,
  status: 'pendiente',
  ...extra,
})

const ACTIVITIES: Activity[] = [
  general('bus1', 'Llegada en bus', 'fundo', '07:00', '08:00'),
  general('desfile', 'Desfile de los ciclos', 'cancha4', '08:10', '08:50', { note: 'Cada ciclo presenta a su rey, su mascota y su barra.' }),
  ...matches('futbol', 'f', [
    [R1, [t('1.1'), t('1.2')], '09:00', '09:35', 'cancha1'],
    [R1, [t(2), t(4)], '09:00', '09:35', 'cancha2'],
    [R1, [t(3), t(7)], '09:00', '09:35', 'cancha3'],
    [R1, [t(5), t('e')], '09:45', '10:20', 'cancha1'],
    [R1, [t(6), t(10)], '09:45', '10:20', 'cancha2'],
    [R1, [t(8), t(9)], '09:45', '10:20', 'cancha3'],
    [R2, [w('f1'), w('f2')], '10:30', '11:05', 'cancha1'],
    [R2, [w('f3'), w('f4')], '10:40', '11:15', 'cancha2'],
    [R2, [w('f5'), w('f6')], '10:40', '11:15', 'cancha3'],
    ['Semifinal', semi('futbol'), '12:00', '12:35', 'cancha1'],
    ['Final', [w('f10'), { slot: 'direct', of: 'futbol' }], '13:00', '13:35', 'cancha1'],
  ]),
  ...matches(
    'voley',
    'v',
    [
      [R1, [t(2), t('e')], '09:00', '09:20', ''],
      [R1, [t(6), t(10)], '09:20', '09:40', ''],
      [R1, [t(7), t(8)], '09:40', '10:00', ''],
      [R1, [t(4), t(5)], '10:00', '10:20', ''],
      [R1, [t(3), t(9)], '10:20', '10:40', ''],
      [R2, [w('v1'), w('v2')], '10:40', '11:00', ''],
      [R2, [w('v3'), w('v4')], '11:00', '11:20', ''],
      [R2, [w('v5'), t(1)], '11:20', '11:40', ''],
      ['Semifinal', semi('voley'), '12:00', '12:30', ''],
      ['Final', [w('v9'), { slot: 'direct', of: 'voley' }], '12:30', '12:50', ''],
    ],
    'voley',
    true,
  ),
  ...matches(
    'basquet',
    'b',
    [
      [R1, [t(8), t(10)], '09:00', '09:25', ''],
      [R1, [t(3), t(9)], '09:25', '09:50', ''],
      [R1, [t(6), t('e')], '09:50', '10:15', ''],
      [R1, [t(4), t(5)], '10:15', '10:40', ''],
      [R1, [t(1), t(2)], '10:40', '11:05', ''],
      [R2, [w('b1'), w('b2')], '11:05', '11:30', ''],
      [R2, [w('b3'), w('b4')], '11:30', '11:55', ''],
      [R2, [w('b5'), t(7)], '11:55', '12:20', ''],
      ['Semifinal', semi('basquet'), '12:30', '12:55', ''],
      ['Final', [w('b9'), { slot: 'direct', of: 'basquet' }], '13:00', '13:30', ''],
    ],
    'basquet',
  ),
  ...(
    [
      ['Jalar la soga', '10:30', '10:55', '5 personas por ciclo. Eliminación con un solo jalón de máximo 90 segundos.'],
      ['Carrera de huevos', '11:00', '11:08', '3 personas por ciclo. Relevo con los 11 ciclos a la vez.'],
      ['Carrera de pies atados', '11:10', '11:22', '3 personas atadas juntas. Dos series por tiempo.'],
      ['Carrera de sacos', '11:25', '11:32', '3 personas por ciclo. Relevo con los 11 ciclos a la vez.'],
      ['Tutti frutti con sacos', '11:35', '11:50', '5 personas por ciclo. Gana quien complete primero las 5 categorías.'],
    ] as const
  ).map(([title, start, end, note], i) => general(`g${i + 1}`, title, 'cancha4', start, end, { disciplineId: 'gincana', note, stage: `Juego ${i + 1} de 5` })),
  general('fd', 'Fútbol damas', 'cancha2', '11:20', '11:45', { disciplineId: 'futbol_damas', sides: [{ label: 'Equipo A' }, { label: 'Equipo B' }] }),
  general('bd', 'Básquet damas', 'voley', '12:55', '13:20', { disciplineId: 'basquet_damas', sides: [{ label: 'Equipo A' }, { label: 'Equipo B' }] }),
  general('ajedrez', 'Torneo de ajedrez blitz', 'escenario', '11:30', '12:30', { disciplineId: 'ajedrez', note: 'Los inscritos deben estar en el escenario antes de las 11:30 a. m.' }),
  general('dj', 'Inicio de la música con DJ Angel', 'escenario', '13:00', '17:00', { note: 'La música sigue hasta el cierre del evento.' }),
  general('concurso', 'Anuncio del ganador del concurso tecnológico', 'escenario', '13:45', '14:00', { disciplineId: 'concurso' }),
  general('almuerzo', 'Almuerzo y premiación', 'escenario', '14:00', '15:00', { note: 'Almuerzo exclusivo para inscritos. Se entregan los trofeos de fútbol, vóley, básquet y gincana y se anuncia al campeón de ajedrez.' }),
  general('baileton', 'Bailetón', 'escenario', '14:30', '17:00'),
  general('bus2', 'Retorno en bus', 'fundo', '17:00', '17:30'),
]

export const seed = (): EventData => ({
  activities: ACTIVITIES.map((a) => ({ ...a })),
  participants: [],
  announcements: [
    {
      id: 'n1',
      title: 'Inscripciones hasta el jueves 19, 4:00 p. m.',
      body: 'El delegado de cada ciclo inscribe a sus participantes hasta el jueves 19 de noviembre a las 4:00 p. m. No se aceptan inscripciones ni cambios fuera de plazo.',
      date: '2026-11-13',
      groupIds: [],
      kind: 'urgente',
    },
    {
      id: 'n2',
      title: 'Sin tiempo de tolerancia',
      body: 'Los equipos deben estar completos en la cancha antes de la hora programada. Quien no esté completo pierde por W.O.',
      date: '2026-11-13',
      groupIds: [],
      kind: 'info',
    },
    {
      id: 'n3',
      title: 'Lleva tu carnet y tu polo',
      body: 'Para jugar debes mostrar tu carnet universitario o campus virtual y usar el polo del lenguaje de tu ciclo con tu número.',
      date: '2026-11-13',
      groupIds: [],
      kind: 'info',
    },
    {
      id: 'n4',
      title: 'Buses al Fundo',
      body: 'Salida hacia el Fundo entre las 7:00 y las 8:00 a. m. Retorno a las 5:00 p. m.',
      date: '2026-11-13',
      groupIds: [],
      kind: 'info',
    },
  ],
  corrections: [],
  reports: [],
  directOverride: {},
})
