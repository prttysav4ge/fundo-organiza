import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom'
import FundoMap from '../components/FundoMap'
import { ActivityCard, AnnouncementCard, Jersey, Logo, STATUS_LABEL } from '../components/ui'
import { DISCIPLINES, EVENT_NAME, GROUPS } from '../data/seed'
import { byStart, discipline, group, involves, isDuel, isGeneral, useStore, venue, winnerOf } from '../data/store'
import type { Status } from '../data/types'

const NAV = [
  ['/inicio', '🏠', 'Inicio'],
  ['/cronograma', '🗓️', 'Cronograma'],
  ['/disciplinas', '🏆', 'Disciplinas'],
  ['/anuncios', '📣', 'Anuncios'],
]

export function Welcome() {
  const { setCiclo, cicloId } = useStore()
  const nav = useNavigate()
  return (
    <div className="welcome">
      <Logo />
      <p className="eyebrow">{EVENT_NAME}</p>
      <h1>¿De qué ciclo eres?</h1>
      <p className="muted">Elige tu ciclo para ver tus partidos, horarios y canchas. No necesitas cuenta.</p>
      <div className="ciclo-grid">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            className={cicloId === g.id ? 'on' : ''}
            style={{ borderColor: g.color }}
            onClick={() => {
              setCiclo(g.id)
              nav('/inicio')
            }}
          >
            <b style={{ color: g.color }}>{g.short}</b>
            <span>ciclo</span>
          </button>
        ))}
      </div>
      <Link to="/delegados" className="link">
        Iniciar sesión para delegados
      </Link>
    </div>
  )
}

export function Layout() {
  const { cicloId, session } = useStore()
  const g = group(cicloId ?? undefined)
  if (!g) return <Navigate to="/" replace />
  return (
    <>
      <header className="topbar">
        <Link to="/inicio" aria-label="Fundo Organiza, inicio">
          <Logo />
        </Link>
        <nav className="topnav">
          {NAV.map(([to, , label]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="top-actions">
          <Link to="/" className="chip" title="Cambiar de ciclo">
            <i className="swatch" style={{ background: g.color }} />
            {g.name} ▾
          </Link>
          <Link to="/delegados" className="link hide-sm">
            {session ? 'Panel de gestión' : 'Delegados'}
          </Link>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <nav className="bottomnav">
        {NAV.map(([to, icon, label]) => (
          <NavLink key={to} to={to}>
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
        <NavLink to="/delegados">
          <span>🔑</span>Gestión
        </NavLink>
      </nav>
    </>
  )
}

export function Home() {
  const { activities, announcements, cicloId } = useStore()
  const [sel, setSel] = useState<string | null>(null)
  const g = group(cicloId!)!
  const sorted = [...activities].sort(byStart)
  const mineDuel = sorted.filter((a) => isDuel(a) && involves(a, g.id))
  const liveMine = mineDuel.filter((a) => a.status === 'en_curso')
  const liveGeneral = sorted.filter((a) => isGeneral(a) && a.status === 'en_curso')
  const upcoming = sorted.filter(
    (a) => (a.status === 'pendiente' || a.status === 'reprogramado') && (isGeneral(a) || involves(a, g.id)),
  )
  const played = mineDuel.filter((a) => a.status === 'finalizado')
  const anns = announcements.filter((n) => !n.groupIds.length || n.groupIds.includes(g.id)).slice(0, 2)
  const atVenue = sel ? sorted.filter((a) => a.venueId === sel) : []

  return (
    <div className="home">
      <section className="hero card">
        <Jersey g={g} size={84} />
        <div>
          <h1>
            {g.ordinal} ciclo
          </h1>
          <p className="muted">Temática: {g.theme}</p>
        </div>
      </section>

      <section className="map-wrap">
        <FundoMap selected={sel} onSelect={(v) => setSel(v === sel ? null : v)} />
        <p className="legend">
          <span>
            <i className="dot" /> En curso
          </span>
          <span>⭐ Tu ciclo juega aquí</span>
          <span>Toca una zona para ver su programación</span>
        </p>
        {sel && (
          <div className="sheet card" aria-live="polite">
            <div className="sheet-head">
              <h3>
                <i className="swatch" style={{ background: venue(sel).color }} /> {venue(sel).name}
              </h3>
              <button className="btn ghost" onClick={() => setSel(null)} aria-label="Cerrar">
                ✕
              </button>
            </div>
            {atVenue.length ? atVenue.map((a) => <ActivityCard key={a.id} a={a} />) : <p className="muted">Sin actividades programadas.</p>}
          </div>
        )}
      </section>

      <section className="panel">
        {anns.length > 0 && (
          <div>
            <h2>
              Anuncios <Link to="/anuncios">Ver todos</Link>
            </h2>
            {anns.map((n) => (
              <AnnouncementCard key={n.id} n={n} />
            ))}
          </div>
        )}
        <div>
          <h2>
            Ahora mismo <Link to="/cronograma">Ver cronograma completo</Link>
          </h2>
          {liveMine.length + liveGeneral.length === 0 && <p className="muted">No hay actividades en curso para tu ciclo.</p>}
          {liveMine.length > 0 && <h3 className="sub">De tu ciclo</h3>}
          {liveMine.map((a) => (
            <ActivityCard key={a.id} a={a} />
          ))}
          {liveGeneral.length > 0 && <h3 className="sub">Generales</h3>}
          {liveGeneral.map((a) => (
            <ActivityCard key={a.id} a={a} />
          ))}
        </div>
        <div>
          <h2>Lo que viene</h2>
          {upcoming.slice(0, 4).map((a) => (
            <ActivityCard key={a.id} a={a} />
          ))}
          {!upcoming.length && <p className="muted">No hay más actividades pendientes.</p>}
        </div>
        <div>
          <h2>Tus resultados</h2>
          {played.map((a) => (
            <ActivityCard key={a.id} a={a} />
          ))}
          {!played.length && <p className="muted">Tu ciclo aún no termina ningún partido.</p>}
        </div>
        <div>
          <h2>Equipos de tu ciclo</h2>
          <div className="chips">
            {DISCIPLINES.map((d) => (
              <Link key={d.id} to={`/disciplinas/${d.id}`} className="chip big">
                {d.icon} {d.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export function Schedule() {
  const { activities, cicloId } = useStore()
  const [onlyMine, setOnlyMine] = useState(false)
  const [status, setStatus] = useState<Status | 'todos'>('todos')
  const list = [...activities]
    .sort(byStart)
    .filter((a) => !onlyMine || isGeneral(a) || involves(a, cicloId!))
    .filter((a) => status === 'todos' || a.status === status)
  return (
    <div className="page">
      <h1>Cronograma</h1>
      <div className="filters">
        <div className="seg" role="group" aria-label="Alcance">
          <button className={!onlyMine ? 'on' : ''} onClick={() => setOnlyMine(false)}>
            Todo el evento
          </button>
          <button className={onlyMine ? 'on' : ''} onClick={() => setOnlyMine(true)}>
            Mi ciclo
          </button>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as Status | 'todos')} aria-label="Estado">
          <option value="todos">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      {list.map((a) => (
        <ActivityCard key={a.id} a={a} />
      ))}
      {!list.length && <p className="muted">No hay actividades con esos filtros.</p>}
    </div>
  )
}

export function Disciplines() {
  const { activities } = useStore()
  return (
    <div className="page">
      <h1>Disciplinas</h1>
      <div className="disc-grid">
        {DISCIPLINES.map((d) => {
          const acts = activities.filter((a) => a.disciplineId === d.id)
          const live = acts.filter((a) => a.status === 'en_curso').length
          return (
            <Link key={d.id} to={d.id} className="card disc">
              <span className="disc-icon">{d.icon}</span>
              <strong>{d.name}</strong>
              <span className="muted small">
                {acts.length} {d.format === 'duelo' ? 'partidos' : 'actividades'}
                {live > 0 && ` · ${live} en curso`}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function DisciplinePage() {
  const { id } = useParams()
  const { activities, participants, cicloId } = useStore()
  const [gid, setGid] = useState(cicloId!)
  const d = discipline(id)
  if (!d) return <Navigate to="/disciplinas" replace />
  const acts = activities.filter((a) => a.disciplineId === d.id).sort(byStart)
  const roster = participants.filter((p) => p.disciplineId === d.id && p.groupId === gid)
  const winners = acts.map(winnerOf).filter(Boolean) as string[]
  const table: Record<string, number> = {}
  acts.forEach((a) => Object.entries(a.points ?? {}).forEach(([k, v]) => (table[k] = (table[k] ?? 0) + v)))
  const ranking = Object.entries(table).sort((a, b) => b[1] - a[1])

  return (
    <div className="page">
      <Link to="/disciplinas" className="link">
        ← Disciplinas
      </Link>
      <h1>
        {d.icon} {d.name}
      </h1>

      {d.format === 'duelo' ? (
        <>
          <h2>Ganadores hasta ahora</h2>
          {winners.length ? (
            <div className="chips">
              {winners.map((w, i) => (
                <span key={i} className="chip">
                  <i className="swatch" style={{ background: group(w)!.color }} />
                  {group(w)!.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted">Aún no hay partidos finalizados.</p>
          )}
        </>
      ) : (
        <>
          <h2>Tabla de puntos</h2>
          {ranking.length ? (
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ciclo</th>
                  <th>Puntos</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map(([k, v], i) => (
                  <tr key={k} className={k === cicloId ? 'hl' : ''}>
                    <td>{i + 1}</td>
                    <td>{group(k)!.name}</td>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">Todavía no se registran puntajes.</p>
          )}
        </>
      )}

      <h2>{d.format === 'duelo' ? 'Partidos' : 'Programación'}</h2>
      {acts.map((a) => (
        <ActivityCard key={a.id} a={a} />
      ))}

      <h2>Participantes inscritos</h2>
      <select value={gid} onChange={(e) => setGid(e.target.value)} aria-label="Ciclo">
        {GROUPS.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <table className="tbl">
        <thead>
          <tr>
            {d.usesJersey && <th>Dorsal</th>}
            <th>Nombres y apellidos</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {roster.map((p) => (
            <tr key={p.id}>
              {d.usesJersey && <td className="num">{p.jersey}</td>}
              <td>{p.name}</td>
              <td>
                <span className={`badge ${p.status === 'confirmado' ? 'ok' : 'warn'}`}>
                  {p.status === 'confirmado' ? 'Confirmado' : 'Por confirmar'}
                </span>
              </td>
            </tr>
          ))}
          {!roster.length && (
            <tr>
              <td colSpan={3} className="muted">
                Sin inscritos todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="small muted">¿Ves un error en tu nombre o dorsal? Avísale a tu delegado para que solicite la corrección.</p>
    </div>
  )
}

export function Announcements() {
  const { announcements, cicloId } = useStore()
  const [all, setAll] = useState(false)
  const list = announcements.filter((n) => all || !n.groupIds.length || n.groupIds.includes(cicloId!))
  return (
    <div className="page">
      <h1>Anuncios</h1>
      <div className="seg" role="group" aria-label="Alcance">
        <button className={!all ? 'on' : ''} onClick={() => setAll(false)}>
          Para mi ciclo
        </button>
        <button className={all ? 'on' : ''} onClick={() => setAll(true)}>
          Todos
        </button>
      </div>
      {list.map((n) => (
        <AnnouncementCard key={n.id} n={n} />
      ))}
      {!list.length && <p className="muted">No hay anuncios.</p>}
    </div>
  )
}
