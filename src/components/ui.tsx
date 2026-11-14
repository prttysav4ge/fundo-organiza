import { Link } from 'react-router-dom'
import { actTitle, discipline, fmtTime, group, isDuel, useStore, venue, winnerOf } from '../data/store'
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
  const { cicloId } = useStore()
  const v = venue(a.venueId)
  const d = discipline(a.disciplineId)
  const win = winnerOf(a)
  const duel = isDuel(a) && a.groupIds.length === 2
  const mine = !!cicloId && a.groupIds.includes(cicloId)
  return (
    <article className={`act${mine ? ' mine' : ''} st-${a.status}`} style={{ borderLeftColor: v.color }}>
      <div className="act-time">
        <strong>{fmtTime(a.start)}</strong>
        <span>{fmtTime(a.end)}</span>
      </div>
      <div className="act-body">
        <div className="act-top">
          <StatusBadge status={a.status} />
          {a.stage && <span className="muted small">{a.stage}</span>}
        </div>
        {duel ? (
          <div className="versus">
            {a.groupIds.map((gid, i) => (
              <span key={gid} className={`team${win === gid ? ' win' : ''}`}>
                <i className="swatch" style={{ background: group(gid)!.color }} />
                {group(gid)!.name}
                {a.score && <b>{a.score[i]}</b>}
              </span>
            ))}
          </div>
        ) : (
          <h4>{actTitle(a)}</h4>
        )}
        <p className="act-meta">
          {d && (
            <Link to={`/disciplinas/${d.id}`}>
              {d.icon} {d.name}
            </Link>
          )}
          <span>📍 {v.name}</span>
          {mine && <span className="tag-mine">Tu ciclo</span>}
        </p>
        {a.note && <p className="small muted">{a.note}</p>}
      </div>
    </article>
  )
}

export function Jersey({ g, size = 150 }: { g: Group; size?: number }) {
  return (
    <svg viewBox="0 0 120 130" width={size} height={size * 1.08} role="img" aria-label={`Polo de ${g.name}`}>
      <path d="M38 8 12 22 2 50l20 8 4-10v74h68V48l4 10 20-8-10-28L82 8c-4 10-12 14-22 14S42 18 38 8Z" fill={g.color} />
      <path d="M26 74 94 74V122H26Z" fill="rgba(0,0,0,.18)" />
      <path d="M38 8c4 10 12 14 22 14s18-4 22-14l-6-2c-3 6-9 9-16 9s-13-3-16-9Z" fill="rgba(255,255,255,.55)" />
      <text x="60" y="58" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">
        {g.theme}
      </text>
      <text x="60" y="104" textAnchor="middle" fontSize="26" fontWeight="800" fill="rgba(255,255,255,.9)">
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
        <span className="small muted">{fmtTime(n.time)}</span>
      </div>
      <p>{n.body}</p>
      <span className="small muted">
        Para: {n.groupIds.length ? n.groupIds.map((x) => group(x)?.name).join(', ') : 'todos los ciclos'}
      </span>
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
