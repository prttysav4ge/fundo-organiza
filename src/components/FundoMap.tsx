import type { ReactElement } from 'react'
import { VENUES } from '../data/seed'
import { useStore } from '../data/store'

// Croquis interactivo del Fundo. Cada zona es un botón; las posiciones de las
// etiquetas se definen aquí para poder cambiar de mapa en otros eventos.
const LABEL: Record<string, [number, number]> = {
  escenario: [262, 122],
  voley: [486, 143],
  basquet: [616, 143],
  cancha1: [383, 328],
  cancha4: [557, 328],
  cancha2: [383, 455],
  cancha3: [557, 455],
  piscina: [150, 440],
}

interface Props {
  selected: string | null
  onSelect: (venueId: string) => void
}

export default function FundoMap({ selected, onSelect }: Props) {
  const { activities, cicloId, plays } = useStore()
  const live = (v: string) => activities.some((a) => a.venueId === v && a.status === 'en_curso')
  const mine = (v: string) =>
    !!cicloId && activities.some((a) => a.venueId === v && plays(a, cicloId) && a.status !== 'finalizado' && a.status !== 'cancelado')

  const zone = (id: string, shape: ReactElement) => {
    const v = VENUES.find((x) => x.id === id)!
    const [x, y] = LABEL[id]
    const w = v.name.length * 10 + 30
    const isLive = live(id)
    const isMine = mine(id)
    return (
      <g
        key={id}
        className={`zone${selected === id ? ' sel' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`${v.name}${isLive ? ', actividad en curso' : ''}${isMine ? ', tu ciclo tiene actividad aquí' : ''}`}
        onClick={() => onSelect(id)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(id))}
      >
        {shape}
        <g className="pill">
          <rect x={x - w / 2} y={y - 19} width={w} height={38} rx={19} fill={v.color} stroke={isMine ? '#fff' : 'none'} strokeWidth={3} />
          <text x={x} y={y + 7} textAnchor="middle" fill={v.text}>
            {v.name}
          </text>
          {isLive && (
            <g>
              <circle className="pulse" cx={x + w / 2 - 4} cy={y - 16} r={7} fill="#e11d48" />
              <circle cx={x + w / 2 - 4} cy={y - 16} r={5} fill="#e11d48" stroke="#fff" strokeWidth={1.5} />
            </g>
          )}
          {isMine && (
            <text x={x - w / 2 + 2} y={y - 10} fontSize={15} textAnchor="middle">
              ⭐
            </text>
          )}
        </g>
      </g>
    )
  }

  const court = (x: number, outer: string, inner: string, line: string, key: string) => (
    <g>
      <rect className="hit" x={x} y={0} width={116} height={292} fill={outer} />
      <rect x={x + 10} y={10} width={96} height={272} fill={inner} stroke="#fff" strokeWidth={1.5} />
      <line x1={x + 10} y1={146} x2={x + 106} y2={146} stroke="#fff" strokeWidth={1.5} />
      <rect x={x + 46} y={10} width={24} height={40} fill={line} />
      <rect x={x + 46} y={242} width={24} height={40} fill={line} />
      <path d={`M${x + 28} 10a30 34 0 0 0 60 0M${x + 28} 282a30 34 0 0 1 60 0`} fill="none" stroke="#fff" strokeWidth={1.5} />
      <title>{key}</title>
    </g>
  )

  const pitch = (x: number, y: number) => (
    <g>
      <rect className="hit" x={x} y={y} width={166} height={118} rx={6} fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.75)" strokeWidth={2} />
      <line x1={x + 83} y1={y} x2={x + 83} y2={y + 118} stroke="rgba(255,255,255,.6)" strokeWidth={1.5} />
      <circle cx={x + 83} cy={y + 59} r={16} fill="none" stroke="rgba(255,255,255,.6)" strokeWidth={1.5} />
    </g>
  )

  return (
    <svg className="fundo-map" viewBox="0 0 680 540" role="group" aria-label="Mapa interactivo del Fundo UPAO">
      <defs>
        <pattern id="grass" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#3f9a2d" />
          <rect width="20" height="40" fill="#4bab35" />
        </pattern>
        <pattern id="water" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#2a9fe0" />
          <line x1="0" y1="0" x2="0" y2="16" stroke="#1565a8" strokeWidth="2" />
        </pattern>
      </defs>
      <rect width="680" height="540" fill="#4d4d4d" />
      <rect x="55" y="0" width="365" height="250" fill="#3d5239" />
      {/* Senderos */}
      <g fill="none" stroke="#c9c1ae" strokeLinecap="round" strokeLinejoin="round">
        <path d="M205 272 L270 215 L420 215" strokeWidth="14" />
        <path d="M205 272 L120 262 L70 215" strokeWidth="12" />
        <path d="M205 272 L120 300" strokeWidth="9" />
        <path d="M120 262 L118 330" strokeWidth="9" />
      </g>
      <path d="M310 215 V160 H380 V75 H420 V215Z" fill="#c9c1ae" />
      <circle cx="205" cy="272" r="24" fill="#c9c1ae" />
      <path d="M28 172 80 120 150 190 98 242Z" fill="#c9c1ae" />
      <rect x="66" y="88" width="26" height="26" transform="rotate(45 79 101)" fill="#c9c1ae" />

      <rect x="262" y="250" width="418" height="290" fill="url(#grass)" />

      {zone(
        'escenario',
        <g transform="rotate(42 178 170)">
          <rect className="hit" x="112" y="104" width="132" height="132" fill="#b3aea6" stroke="#6b4a33" strokeWidth="5" />
          <path d="M112 104h76l-22 40-54 20Z" fill="#8a5a2e" />
        </g>,
      )}
      {zone('voley', court(428, '#7c4ddb', '#f7d98a', '#7c4ddb', 'Cancha de vóley'))}
      {zone('basquet', court(558, '#1b3fae', '#f26a1b', '#1b3fae', 'Cancha de básquet'))}
      {zone('cancha1', pitch(300, 268))}
      {zone('cancha4', pitch(474, 268))}
      {zone('cancha2', pitch(300, 396))}
      {zone('cancha3', pitch(474, 396))}
      {zone(
        'piscina',
        <g transform="rotate(-30 150 420)">
          <rect className="hit" x="88" y="312" width="124" height="216" rx="12" fill="#eadfd3" />
          <rect x="100" y="326" width="100" height="188" fill="url(#water)" />
        </g>,
      )}
    </svg>
  )
}
