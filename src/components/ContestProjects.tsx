import { useEffect, useState } from 'react'
import { PROJECTS, type ContestProject } from '../data/projects'
import { group, sb } from '../data/store'

/** Galería de proyectos postulados al concurso: tarjetas con su video promocional. */
export default function ContestProjects() {
  // Orden de postulación: cada proyecto nuevo va al final.
  const list = PROJECTS
  const likes = useLikes()
  return (
    <section className="contest">
      <div className="contest-head">
        <h2>Proyectos postulados ({PROJECTS.length})</h2>
        <p className="disc-count">👥 {PROJECTS.reduce((n, x) => n + x.members.length, 0)} participantes inscritos</p>
        <p className="muted">Conoce lo que están creando tus compañeros. ¿Tienes un proyecto? Postula hasta el jueves 19 de noviembre, 10:00 p. m.</p>
      </div>
      <div className="project-grid">
        {list.map((p) => (
          <ProjectCard key={p.id} p={p} likes={likes} />
        ))}
      </div>
    </section>
  )
}

function ProjectCard({ p, likes }: { p: ContestProject; likes: Likes }) {
  const [showTest, setShowTest] = useState(false)
  const [more, setMore] = useState(false)
  const cycles = [...new Set(p.groupIds)].map((g) => group(g)).filter(Boolean)
  return (
    <article className="project">
      <div className="project-media">
        {p.video ? (
          <video controls playsInline preload={p.poster ? 'none' : 'metadata'} poster={p.poster} aria-label={`Video promocional de ${p.name}`}>
            <source src={p.video} type="video/mp4" />
          </video>
        ) : p.youtube ? (
          <YouTube id={p.youtube} title={p.name} />
        ) : p.image ? (
          <a className="project-image" href={p.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${p.name}`}>
            <img src={p.image} alt={`Vista de ${p.name}`} loading="lazy" />
          </a>
        ) : (
          <a className="project-placeholder" href={p.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${p.name}`}>
            <span className="project-initial">{p.name.slice(0, 1)}</span>
            <span className="small">🎬 Video promocional próximamente</span>
          </a>
        )}
      </div>
      <div className="project-body">
        <div className="project-title">
          <div className="project-name">
            <h3>{p.name}</h3>
            {cycles.map((g) => (
              <span key={g!.id} className="project-cycle" style={{ background: g!.color, color: g!.ink }}>
                {g!.name}
              </span>
            ))}
          </div>
          <button
            className={`heart${likes.mine.has(p.id) ? ' on' : ''}`}
            onClick={() => likes.toggle(p.id)}
            aria-pressed={likes.mine.has(p.id)}
            aria-label={`${likes.mine.has(p.id) ? 'Quitar' : 'Dar'} corazón a ${p.name}`}
          >
            <span className="heart-icon" aria-hidden="true">
              {likes.mine.has(p.id) ? '❤️' : '🤍'}
            </span>
            <span>{likes.counts[p.id] ?? 0}</span>
          </button>
        </div>
        <p className="project-summary">{p.summary}</p>
        <p className="small project-members">👤 {p.members.join(' · ')}</p>
        {more && (
          <div className="project-more small">
            <h4>Descripción</h4>
            <p>{p.description}</p>
            <h4>Problema que resuelve</h4>
            <p>{p.problem}</p>
          </div>
        )}
        <div className="project-actions">
          <a className="btn primary" href={p.url} target="_blank" rel="noreferrer">
            Abrir proyecto ↗
          </a>
          {p.test && (
            <button className="btn ghost" onClick={() => setShowTest(!showTest)} aria-expanded={showTest}>
              🔑 Probar el sistema
            </button>
          )}
          <button className="btn ghost link-btn" onClick={() => setMore(!more)} aria-expanded={more}>
            {more ? 'Ver menos ▴' : 'Ver más ▾'}
          </button>
        </div>
        {showTest && p.test && (
          <div className="project-test">
            <p className="small">
              <b>{p.test.note ?? 'Datos de prueba'}</b> · úsalos para entrar a {p.name}:
            </p>
            {p.test.fields.map((f) => (
              <CopyRow key={f.label} label={f.label} value={f.value} />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* el portapapeles puede no estar disponible: el texto queda seleccionable */
    }
  }
  return (
    <div className="copy-row">
      <span className="small muted">{label}</span>
      <code>{value}</code>
      <button className="btn ghost" onClick={copy}>
        {copied ? '✓ Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------ corazones */

interface Likes {
  counts: Record<string, number>
  mine: Set<string>
  toggle: (id: string) => void
}

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* sin almacenamiento */
    }
  },
}

/** Identificador anónimo de este dispositivo: un corazón por proyecto y dispositivo. */
function deviceId() {
  let id = store.get('fo-device')
  if (!id) {
    id = crypto.randomUUID()
    store.set('fo-device', id)
  }
  return id
}

function useLikes(): Likes {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [mine, setMine] = useState<Set<string>>(() => new Set(JSON.parse(store.get('fo-likes') ?? '[]') as string[]))
  useEffect(() => {
    if (!sb) return
    sb.from('project_like_counts')
      .select('project_id,likes')
      .then(({ data }) => data && setCounts(Object.fromEntries(data.map((r) => [r.project_id, r.likes]))))
  }, [])
  const toggle = async (id: string) => {
    const was = mine.has(id)
    const next = new Set(mine)
    if (was) next.delete(id)
    else next.add(id)
    setMine(next)
    store.set('fo-likes', JSON.stringify([...next]))
    setCounts((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + (was ? -1 : 1)) }))
    if (!sb) return
    const { data, error } = await sb.rpc('toggle_like', { p_project: id, p_device: deviceId() })
    if (!error && typeof data === 'number') setCounts((c) => ({ ...c, [id]: data }))
  }
  return { counts, mine, toggle }
}

/** Video de YouTube: muestra la miniatura y carga el reproductor solo al tocarla. */
function YouTube({ id, title }: { id: string; title: string }) {
  const [play, setPlay] = useState(false)
  if (play)
    return (
      <iframe
        className="yt"
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={`Video promocional de ${title}`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    )
  return (
    <button className="yt-thumb" onClick={() => setPlay(true)} aria-label={`Reproducir el video de ${title}`}>
      <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
      <span className="yt-play" aria-hidden="true">▶</span>
    </button>
  )
}
