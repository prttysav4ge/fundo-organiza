import { useState } from 'react'
import { PROJECTS, type ContestProject } from '../data/projects'
import { group } from '../data/store'

/** Galería de proyectos postulados al concurso: tarjetas con su video promocional. */
export default function ContestProjects() {
  // Orden de postulación: cada proyecto nuevo va al final.
  const list = PROJECTS
  return (
    <section className="contest">
      <div className="contest-head">
        <h2>Proyectos postulados ({PROJECTS.length})</h2>
        <p className="muted">Conoce lo que están creando tus compañeros. ¿Tienes un proyecto? Postula hasta el jueves 19 de noviembre, 10:00 p. m.</p>
      </div>
      <div className="project-grid">
        {list.map((p) => (
          <ProjectCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  )
}

function ProjectCard({ p }: { p: ContestProject }) {
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
          <h3>{p.name}</h3>
          {cycles.map((g) => (
            <span key={g!.id} className="project-cycle" style={{ background: g!.color, color: g!.ink }}>
              {g!.name}
            </span>
          ))}
        </div>
        <p className="project-summary">{p.summary}</p>
        <p className="small project-members">👤 {p.members.join(' · ')}</p>
        {more && (
          <div className="project-more small">
            <p>{p.description}</p>
            <p>
              <b>Problema que resuelve:</b> {p.problem}
            </p>
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
