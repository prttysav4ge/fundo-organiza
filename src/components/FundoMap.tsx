import mapSmall from '../assets/mapa-fundo-640.webp'
import mapLarge from '../assets/mapa-fundo.webp'
import { VENUES } from '../data/seed'
import { useStore } from '../data/store'

// Croquis interactivo del Fundo. Sigue la composición del diseño original: cada
// zona tiene un área tocable y una etiqueta centrada. Posiciones en % del mapa
// (proporción 1273 × 1003) para que la misma plantilla sirva con una foto aérea
// de fondo o con el dibujo vectorial de respaldo. La imagen se arma uniendo las
// capas del diseño (fondo, escenario, piscina, vóley y básquet).

/** Cambiar a false para volver al dibujo vectorial. */
const USE_IMAGE = true

interface Zone {
  id: string
  /** Centro de la etiqueta, en %. */
  label: [number, number]
  /** Área tocable: x, y, ancho, alto en %. */
  area: [number, number, number, number]
}

const ZONES: Zone[] = [
  { id: 'escenario', label: [36, 16], area: [11.8, 7.9, 24.5, 31.5] },
  { id: 'voley', label: [71.5, 19], area: [63, 0, 17, 38.3] },
  { id: 'basquet', label: [90.5, 19], area: [82, 0, 17, 38.3] },
  { id: 'cancha1', label: [56.2, 55], area: [39, 39, 30.5, 30.5] },
  { id: 'cancha4', label: [82, 55], area: [69.5, 39, 30.5, 30.5] },
  { id: 'cancha2', label: [56.2, 80], area: [39, 69.5, 30.5, 30.5] },
  { id: 'cancha3', label: [82, 80], area: [69.5, 69.5, 30.5, 30.5] },
  { id: 'piscina', label: [23.7, 68], area: [10.2, 48.5, 27, 39.5] },
]

interface Props {
  selected: string | null
  onSelect: (venueId: string) => void
}

export default function FundoMap({ selected, onSelect }: Props) {
  const { activities, cicloId, plays } = useStore()
  const live = (v: string) => activities.some((a) => a.venueId === v && a.status === 'en_curso')
  const mine = (v: string) =>
    !!cicloId && activities.some((a) => a.venueId === v && plays(a, cicloId) && a.status !== 'finalizado' && a.status !== 'cancelado')

  return (
    <div className="fmap" role="group" aria-label="Mapa interactivo del Fundo UPAO">
      {USE_IMAGE ? (
        <img className="fmap-bg" src={mapLarge} srcSet={`${mapSmall} 636w, ${mapLarge} 1273w`} sizes="(min-width: 900px) 60vw, 100vw" alt="" decoding="async" />
      ) : (
        <MapDrawing />
      )}
      {ZONES.map((z) => {
        const v = VENUES.find((x) => x.id === z.id)!
        const isLive = live(z.id)
        const isMine = mine(z.id)
        const [x, y, w, h] = z.area
        const label = `${v.name}${isLive ? ', actividad en curso' : ''}${isMine ? ', tu ciclo juega aquí' : ''}`
        return (
          <div key={z.id} className={`fzone${selected === z.id ? ' sel' : ''}`}>
            <button
              className="farea"
              style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
              onClick={() => onSelect(z.id)}
              aria-hidden="true"
              tabIndex={-1}
            />
            <button
              className={`fpill${isMine ? ' mine' : ''}`}
              style={{ left: `${z.label[0]}%`, top: `${z.label[1]}%`, background: v.color, color: v.text }}
              onClick={() => onSelect(z.id)}
              aria-label={label}
              aria-pressed={selected === z.id}
            >
              {isMine && <span className="fstar" aria-hidden="true">★</span>}
              {v.name}
              {isLive && <span className="flive" aria-hidden="true" />}
            </button>
          </div>
        )
      })}
    </div>
  )
}

/** Dibujo de respaldo con la misma distribución que el diseño original. */
function MapDrawing() {
  const bleachers = (x: number, y: number, n: number) => (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`translate(${x + i * 92} ${y})`}>
          <rect width="86" height="58" rx="4" fill="#1c2a44" />
          {[8, 24, 40].map((r) => (
            <rect key={r} x="6" y={r} width="74" height="10" rx="2" fill="#e9eef6" opacity="0.9" />
          ))}
        </g>
      ))}
    </g>
  )
  const court = (x: number, outer: string, inner: string, paint: string) => (
    <g>
      <rect x={x} y="0" width="216" height="378" fill={outer} />
      <rect x={x + 16} y="18" width="184" height="346" fill={inner} stroke="#fff" strokeWidth="3" />
      <line x1={x + 16} y1="191" x2={x + 200} y2="191" stroke="#fff" strokeWidth="3" />
      <circle cx={x + 108} cy="191" r="26" fill="none" stroke="#fff" strokeWidth="3" />
      <rect x={x + 86} y="18" width="44" height="76" fill={paint} stroke="#fff" strokeWidth="3" />
      <rect x={x + 86} y="288" width="44" height="76" fill={paint} stroke="#fff" strokeWidth="3" />
      <path d={`M${x + 50} 18 a58 72 0 0 0 116 0 M${x + 50} 364 a58 72 0 0 1 116 0`} fill="none" stroke="#fff" strokeWidth="3" />
    </g>
  )
  return (
    <svg className="fmap-bg" viewBox="0 0 1273 1003" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="fm-grass" width="78" height="78" patternUnits="userSpaceOnUse">
          <rect width="78" height="78" fill="#3f9a2d" />
          <rect width="39" height="78" fill="#4aa936" />
        </pattern>
        <pattern id="fm-lawn" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#2f4a2c" />
          <circle cx="3" cy="4" r="1.4" fill="#3b5a36" />
          <circle cx="9" cy="9" r="1.2" fill="#284026" />
        </pattern>
        <linearGradient id="fm-water" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38b6f0" />
          <stop offset="1" stopColor="#1478c8" />
        </linearGradient>
      </defs>
      <rect width="1273" height="1003" fill="#555" />
      <rect x="103" y="0" width="687" height="395" fill="url(#fm-lawn)" />
      <rect x="175" y="395" width="320" height="80" fill="url(#fm-lawn)" />
      {/* Senderos */}
      <path d="M718 60h72v270H505l-121 108" fill="none" stroke="#c9c1ae" strokeWidth="26" strokeLinejoin="round" />
      <path d="M582 210h208v120H582Z" fill="#c9c1ae" />
      <path d="M92 300 64 330l60 60 40-40M104 330c60 0 110 40 130 90l150 10M215 420l20 140" fill="none" stroke="#c9c1ae" strokeWidth="22" strokeLinecap="round" />
      <circle cx="384" cy="430" r="44" fill="#c9c1ae" />
      <path d="M140 76 178 114 140 152 102 114Z" fill="#c9c1ae" />
      {/* Escenario */}
      <g transform="rotate(38 306 300)">
        <rect x="186" y="180" width="240" height="240" fill="#a9a39a" stroke="#6b4a33" strokeWidth="10" />
        <rect x="200" y="194" width="212" height="212" fill="#b9b3aa" />
        <path d="M186 180h160l-40 70-120 40Z" fill="#8a5a2e" />
      </g>
      {court(803, '#7c4ddb', '#f7d98a', '#7c4ddb')}
      {court(1044, '#1b3fae', '#f26a1b', '#1b3fae')}
      {/* Campo de fútbol */}
      <rect x="495" y="388" width="778" height="615" fill="url(#fm-grass)" />
      <g fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="3">
        <rect x="515" y="470" width="368" height="248" rx="6" />
        <rect x="885" y="470" width="368" height="248" rx="6" />
        <rect x="515" y="720" width="368" height="230" rx="6" />
        <rect x="885" y="720" width="368" height="230" rx="6" />
        <circle cx="699" cy="594" r="34" />
        <circle cx="1069" cy="594" r="34" />
        <circle cx="699" cy="835" r="34" />
        <circle cx="1069" cy="835" r="34" />
      </g>
      {bleachers(510, 398, 3)}
      {bleachers(895, 398, 4)}
      {bleachers(510, 955, 4)}
      {bleachers(895, 955, 4)}
      {/* Piscina */}
      <g transform="rotate(-33 300 760)">
        <rect x="170" y="555" width="260" height="410" rx="22" fill="#eadfd3" />
        <rect x="192" y="578" width="216" height="364" fill="url(#fm-water)" />
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <line key={i} x1={192 + i * 27} y1="582" x2={192 + i * 27} y2="938" stroke="#0f4f8a" strokeWidth="2" strokeDasharray="10 6" opacity="0.6" />
        ))}
      </g>
    </svg>
  )
}
