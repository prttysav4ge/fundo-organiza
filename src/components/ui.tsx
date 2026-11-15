import poloC10 from '../assets/polo-c10.webp'
import poloC6 from '../assets/polo-c6.webp'
import { Link } from 'react-router-dom'
import { REMOTE, discipline, fmtDate, fmtTime, group, teamGroup, useStore, venue } from '../data/store'
import type { Activity, Announcement, Group, Status } from '../data/types'

export const STATUS_LABEL: Record<Status, string> = {
  en_curso: 'En curso',
  pendiente: 'Próximo',
  finalizado: 'Finalizado',
  reprogramado: 'Reprogramado',
  cancelado: 'Cancelado',
}

export const StatusBadge = ({ status }: { status: Status }) => (
  <span className={`badge st-${status}`}>
    {status === 'en_curso' && <i className="dot" />}
    {STATUS_LABEL[status]}
  </span>
)

export function ActivityCard({ a }: { a: Activity }) {
  const { cicloId, bracket, plays, activities } = useStore()
  const v = venue(a.venueId)
  const d = discipline(a.disciplineId)
  const sides = bracket.sides[a.id]
  const win = a.status === 'finalizado' ? bracket.winner[a.id] : null
  const mine = !!cicloId && plays(a, cicloId)
  const showScore = a.score && !a.wo && (a.status === 'en_curso' || a.status === 'finalizado')
  // Partidos que dependen de un resultado en disputa.
  const waitingFor = (a.sides ?? [])
    .map((sd) => ('winner' in sd ? activities.find((x) => x.id === sd.winner) : undefined))
    .filter((x) => x?.dispute && x.status !== 'finalizado')
    .map((x) => `${discipline(x!.disciplineId)?.name} ${x!.code}`)
  const tied = a.status === 'finalizado' && showScore && a.score![0] === a.score![1]
  const panelIcon = d?.icon ?? GENERAL_ICON[a.id] ?? '📌'
  return (
    <article className={`act${mine ? ' mine' : ''} st-${a.status}`} style={{ borderLeftColor: v.color }}>
      <div className="act-time">
        <strong>{fmtTime(a.start)}</strong>
        <span>{a.approx ? 'hora aprox.' : fmtTime(a.end)}</span>
        <span className="act-place">
          <span aria-hidden="true">📍</span> {v.place}
        </span>
      </div>
      <div className="act-body">
        <div className="act-top">
          {a.dispute && a.status !== 'finalizado' ? <span className="badge st-cancelado">⚠️ Resultado en disputa</span> : <StatusBadge status={a.status} />}
          {(a.stage || a.code) && (
            <span className="muted small">
              {a.code && `${a.code} · `}
              {a.stage}
            </span>
          )}
        </div>
        {sides ? (
          <div className="versus">
            {sides.map((s, i) => (
              <span key={i} className={`team${win && win === s.team ? ' win' : ''}${s.team ? '' : ' tbd'}`}>
                <i className="swatch" style={{ background: s.team ? group(teamGroup(s.team))!.color : '#c5ccd8' }} />
                {s.label}
                {s.team && <small>{group(teamGroup(s.team))!.theme}</small>}
                {showScore && <b>{a.score![i]}</b>}
              </span>
            ))}
          </div>
        ) : (
          <h4>{a.title}</h4>
        )}
        {a.status === 'finalizado' && a.wo && <p className="small result">{win ? 'Ganó por W.O.' : 'Doble W.O.: ambos eliminados'}</p>}
        {tied && win && <p className="small result">Definido por penales</p>}
        {a.status === 'finalizado' && a.places && a.places.some(Boolean) && (
          <ol className="places">
            {a.places.map((gid, i) => gid && <li key={i}>{group(gid)!.name}</li>)}
          </ol>
        )}
        {a.status === 'finalizado' && a.champion && (
          <p className="small result">
            🏆 Campeón: {a.champion.name} ({group(a.champion.groupId)?.name})
          </p>
        )}
        {mine && <p className="tag-mine">Tu ciclo</p>}
        {a.note && <p className="small muted">{a.note}</p>}
        {waitingFor.length > 0 && <p className="small hint">⏸️ En espera: el resultado de {waitingFor.join(', ')} está en disputa.</p>}
      </div>
      {d ? (
        <Link to={`/competencias/${d.id}`} className="act-panel" style={{ background: v.color, color: v.text }}>
          <span className="act-icon" aria-hidden="true">
            {panelIcon}
          </span>
          <span className="act-sport">{d.name}</span>
        </Link>
      ) : (
        <div className="act-panel" style={{ background: v.color, color: v.text }} aria-hidden="true">
          <span className="act-icon">{panelIcon}</span>
        </div>
      )}
    </article>
  )
}

/** Íconos de las actividades generales (sin competencia). */
const GENERAL_ICON: Record<string, string> = { bus1: '🚌', bus2: '🚌', desfile: '🎉', dj: '🎵', almuerzo: '🍽️', baileton: '💃' }

/** Fotos de los polos que ya existen. Para agregar otro: src/assets/polo-<id>.webp y añadirlo aquí. */
const POLO_PHOTOS: Record<string, string> = { c6: poloC6, c10: poloC10 }

export function Jersey({ g, size = 150 }: { g: Group; size?: number }) {
  const photo = POLO_PHOTOS[g.id]
  if (photo) return <img className="polo" src={photo} alt={`Polo de ${g.name}: ${g.theme}`} style={{ height: size * 1.3 }} />
  return (
    <svg viewBox="0 0 120 130" width={size} height={size * 1.08} role="img" aria-label={`Polo de ${g.name}: ${g.theme}`}>
      <path d="M38 8 12 22 2 50l20 8 4-10v74h68V48l4 10 20-8-10-28L82 8c-4 10-12 14-22 14S42 18 38 8Z" fill={g.color} />
      <path d="M26 74 94 74V122H26Z" fill="rgba(0,0,0,.16)" />
      <path d="M38 8c4 10 12 14 22 14s18-4 22-14l-6-2c-3 6-9 9-16 9s-13-3-16-9Z" fill="rgba(255,255,255,.55)" />
      <text x="60" y="58" textAnchor="middle" fontSize={g.theme.length > 8 ? 11 : 14} fontWeight="800" fill={g.ink}>
        {g.theme}
      </text>
      <text x="60" y="106" textAnchor="middle" fontSize="28" fontWeight="800" fill={g.ink}>
        {g.short}
      </text>
    </svg>
  )
}

export function AnnouncementCard({ n }: { n: Announcement }) {
  return (
    <article className={`ann k-${n.kind}`}>
      <div className="ann-head">
        <strong>{n.title}</strong>
        <span className="small muted">
          {fmtDate(n.date)}
          {n.date.length > 10 && ` · ${new Date(n.date).toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Lima' })}`}
        </span>
      </div>
      <p>{n.body}</p>
      <span className="small muted">Para: {n.groupIds.length ? n.groupIds.map((x) => group(x)?.name).join(', ') : 'todos'}</span>
    </article>
  )
}

export const Logo = () => (
  <span className="logo">
    <svg viewBox="0 0 40 48" width="30" height="36" aria-hidden="true">
      <path d="M20 47 6 28a16 16 0 1 1 28 0Z" fill="#0b4ea2" />
      <rect x="11" y="11" width="18" height="16" rx="3" fill="#fff" />
      <rect x="14" y="14" width="5" height="4" rx="1" fill="#f47b20" />
      <rect x="21" y="14" width="5" height="4" rx="1" fill="#0b4ea2" />
      <rect x="14" y="20" width="5" height="4" rx="1" fill="#0b4ea2" />
      <rect x="21" y="20" width="5" height="4" rx="1" fill="#f47b20" />
    </svg>
    <span>
      <b>Fundo</b>
      <em>Organiza</em>
    </span>
  </span>
)

export function OfflineBanner() {
  const { online, loaded } = useStore()
  if (!REMOTE) return null
  if (!loaded) return <p className="banner">Cargando datos actualizados…</p>
  if (!online) return <p className="banner warn">Sin conexión: se muestran los últimos datos guardados en este celular.</p>
  return null
}

/** Aviso para todos cuando los delegados reportan marcadores distintos. */
export function DisputeBanner() {
  const { disputes, title } = useStore()
  if (!disputes.length) return null
  return (
    <div className="banner danger" role="alert">
      <b>⚠️ Resultado en disputa:</b> {disputes.map((a) => title(a)).join(' · ')}. Los delegados reportaron marcadores distintos: el siguiente partido no
      continúa hasta que se registre el resultado real.
    </div>
  )
}
