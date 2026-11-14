import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom'
import FundoMap from '../components/FundoMap'
import { ActivityCard, AnnouncementCard, Jersey, Logo, STATUS_LABEL } from '../components/ui'
import { GINCANA_POINTS } from '../data/bracket'
import { DISCIPLINES, EVENT, GROUPS } from '../data/seed'
import { byStart, daysToEvent, discipline, group, teamGroup, teamName, teamsFor, useStore, venue } from '../data/store'
import type { Status } from '../data/types'

const NAV = [
  ['/inicio', '🏠', 'Inicio'],
  ['/cronograma', '🗓️', 'Cronograma'],
  ['/competencias', '🏆', 'Competencias'],
  ['/anuncios', '📣', 'Anuncios'],
]

const countdown = () => {
  const n = daysToEvent()
  return n > 1 ? `Faltan ${n} días` : n === 1 ? '¡Es mañana!' : n === 0 ? '¡Es hoy!' : 'Evento finalizado'
}

export function Welcome() {
  const { setCiclo, cicloId } = useStore()
  const nav = useNavigate()
  return (
    <div className="welcome">
      <Logo />
      <p className="eyebrow">{EVENT.name}</p>
      <p className="muted">
        {EVENT.dateLabel} · {EVENT.hours} · {EVENT.place}
      </p>
      <h1>¿De qué ciclo eres?</h1>
      <p className="muted">Elige tu equipo para ver tus partidos, horarios y canchas. No necesitas cuenta.</p>
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
            <b>{g.id === 'ce' ? 'Egresados' : g.name}</b>
            <span>{g.theme}</span>
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
  const g = group(cicloId)
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
  const { activities, announcements, cicloId, plays, isGeneral } = useStore()
  const [sel, setSel] = useState<string | null>(null)
  const g = group(cicloId)!
  const sorted = [...activities].sort(byStart)
  const mine = sorted.filter((a) => plays(a, g.id))
  const live = sorted.filter((a) => a.status === 'en_curso')
  const liveMine = live.filter((a) => plays(a, g.id))
  const liveOther = live.filter((a) => isGeneral(a))
  const open = (a: { status: Status }) => a.status === 'pendiente' || a.status === 'reprogramado'
  const myNext = mine.filter(open)
  const generalNext = sorted.filter((a) => open(a) && isGeneral(a))
  const played = mine.filter((a) => a.status === 'finalizado')
  const anns = announcements.filter((n) => !n.groupIds.length || n.groupIds.includes(g.id)).slice(0, 2)
  const atVenue = sel ? sorted.filter((a) => a.venueId === sel) : []

  return (
    <div className="home">
      <section className="hero card">
        <Jersey g={g} size={84} />
        <div>
          <h1>{g.name}</h1>
          <p className="muted">Lenguaje: {g.theme}</p>
          <p className="small">
            <b>{countdown()}</b> · {EVENT.dateLabel}
          </p>
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
            {atVenue.length ? (
              atVenue.map((a) => <ActivityCard key={a.id} a={a} />)
            ) : (
              <p className="muted">{sel === 'piscina' ? 'La natación no está confirmada: depende del permiso para usar la piscina.' : 'Sin actividades programadas.'}</p>
            )}
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
        {live.length > 0 && (
          <div>
            <h2>Ahora mismo</h2>
            {liveMine.length > 0 && <h3 className="sub">De tu ciclo</h3>}
            {liveMine.map((a) => (
              <ActivityCard key={a.id} a={a} />
            ))}
            {liveOther.length > 0 && <h3 className="sub">Generales</h3>}
            {liveOther.map((a) => (
              <ActivityCard key={a.id} a={a} />
            ))}
            {liveMine.length + liveOther.length === 0 && <p className="muted">Tu ciclo no tiene actividades en curso.</p>}
          </div>
        )}
        <div>
          <h2>
            Tus próximos partidos <Link to="/cronograma">Ver cronograma completo</Link>
          </h2>
          {myNext.map((a) => (
            <ActivityCard key={a.id} a={a} />
          ))}
          {!myNext.length && <p className="muted">Tu ciclo no tiene partidos pendientes definidos. Si sigue en carrera, el siguiente aparecerá aquí al definirse la llave.</p>}
        </div>
        <div>
          <h2>Actividades generales</h2>
          {generalNext.slice(0, 5).map((a) => (
            <ActivityCard key={a.id} a={a} />
          ))}
          {!generalNext.length && <p className="muted">No quedan actividades generales pendientes.</p>}
        </div>
        {played.length > 0 && (
          <div>
            <h2>Tus resultados</h2>
            {played.map((a) => (
              <ActivityCard key={a.id} a={a} />
            ))}
          </div>
        )}
        <div>
          <h2>Equipos de tu ciclo</h2>
          <div className="chips">
            {DISCIPLINES.filter((d) => d.roster).map((d) => (
              <Link key={d.id} to={`/competencias/${d.id}`} className="chip big">
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
  const { activities, cicloId, plays, isGeneral } = useStore()
  const [onlyMine, setOnlyMine] = useState(false)
  const [status, setStatus] = useState<Status | 'todos'>('todos')
  const list = [...activities]
    .sort(byStart)
    .filter((a) => !onlyMine || isGeneral(a) || plays(a, cicloId!))
    .filter((a) => status === 'todos' || a.status === status)
  return (
    <div className="page">
      <h1>Cronograma</h1>
      <p className="muted">
        {EVENT.dateLabel} · {EVENT.place}. Los partidos empiezan a la hora programada, sin tolerancia.
      </p>
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
      <h1>Competencias</h1>
      <div className="disc-grid">
        {DISCIPLINES.map((d) => {
          const live = activities.filter((a) => a.disciplineId === d.id && a.status === 'en_curso').length
          return (
            <Link key={d.id} to={d.id} className="card disc">
              <span className="disc-icon">{d.icon}</span>
              <strong>{d.name}</strong>
              <span className="muted small">{d.summary}</span>
              {live > 0 && (
                <span className="badge st-en_curso">
                  <i className="dot" />
                  {live} en curso
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function DisciplinePage() {
  const { id } = useParams()
  const { activities, participants, cicloId, bracket } = useStore()
  const [gid, setGid] = useState(cicloId!)
  const d = discipline(id)
  if (!d) return <Navigate to="/competencias" replace />
  const acts = activities.filter((a) => a.disciplineId === d.id).sort(byStart)
  const roster = participants.filter((p) => p.disciplineId === d.id && p.groupId === gid).sort((a, b) => a.teamId.localeCompare(b.teamId) || (a.jersey ?? 0) - (b.jersey ?? 0))
  const multi = teamsFor(d.id, gid).length > 1
  const final = acts.find((a) => a.stage === 'Final')
  const champion = final?.status === 'finalizado' ? bracket.winner[final.id] : null
  const direct = bracket.direct[d.id]
  const ginChampion = d.id === 'gincana' && bracket.gincanaDone ? bracket.gincana[0] : null

  return (
    <div className="page">
      <Link to="/competencias" className="link">
        ← Competencias
      </Link>
      <h1>
        {d.icon} {d.name}
      </h1>
      <p className="muted">{d.summary}</p>

      {champion && (
        <p className="champion">
          🏆 Campeón: <b>{teamName(champion)}</b> ({group(teamGroup(champion))!.theme})
        </p>
      )}
      {ginChampion && (
        <p className="champion">
          🏆 Ganador de la gincana: <b>{group(ginChampion.group)!.name}</b>
        </p>
      )}

      <details className="card rules">
        <summary>Reglas principales</summary>
        <ul>
          {d.rules.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </details>

      {d.format === 'duelo' && direct && (
        <p className="card info">
          <b>Pase directo a la final:</b> {direct.team ? teamName(direct.team) : 'por definir'}. <span className="muted">{direct.reason}</span>
        </p>
      )}

      {d.format === 'puntos' && (
        <>
          <h2>Tabla de puntos</h2>
          {bracket.gincana.length ? (
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ciclo</th>
                  <th>1.os puestos</th>
                  <th>Puntos</th>
                </tr>
              </thead>
              <tbody>
                {bracket.gincana.map((r, i) => (
                  <tr key={r.group} className={r.group === cicloId ? 'hl' : ''}>
                    <td>{i + 1}</td>
                    <td>{group(r.group)!.name}</td>
                    <td>{r.firsts}</td>
                    <td className="num">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">Todavía no se registran puntajes. Cada juego da {GINCANA_POINTS.join(', ')} puntos a los cuatro primeros.</p>
          )}
        </>
      )}

      {acts.length > 0 && <h2>{d.format === 'duelo' ? 'Fixture' : d.format === 'puntos' ? 'Juegos' : 'Programación'}</h2>}
      {acts.map((a) => (
        <ActivityCard key={a.id} a={a} />
      ))}

      {d.roster && (
        <>
          <h2>Inscritos</h2>
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
                {d.roster.jersey && <th>N.°</th>}
                <th>Nombres y apellidos</th>
                {multi && <th>Equipo</th>}
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((p) => (
                <tr key={p.id}>
                  {d.roster!.jersey && <td className="num">{p.jersey}</td>}
                  <td>{p.name}</td>
                  {multi && <td>{p.teamId.slice(1)}</td>}
                  <td>
                    <span className={`badge ${p.status === 'confirmado' ? 'ok' : 'warn'}`}>{p.status === 'confirmado' ? 'Confirmado' : 'Por confirmar'}</span>
                  </td>
                </tr>
              ))}
              {!roster.length && (
                <tr>
                  <td colSpan={4} className="muted">
                    Sin inscritos todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="small muted">¿Ves un error en tu nombre o número? Avísale a tu delegado antes del cierre de inscripciones ({EVENT.deadlineLabel}).</p>
        </>
      )}
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
