import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Logo, STATUS_LABEL } from '../components/ui'
import { DISCIPLINES, GROUPS, VENUES } from '../data/seed'
import { actTitle, byStart, discipline, group, isDuel, useStore } from '../data/store'
import type { Activity, Announcement, Correction, Status } from '../data/types'

export default function Manage() {
  const { session, logout } = useStore()
  return (
    <div className="manage">
      <header className="topbar">
        <Link to="/inicio" aria-label="Volver al evento">
          <Logo />
        </Link>
        <div className="top-actions">
          <Link to="/inicio" className="link">
            Ver evento
          </Link>
          {session && (
            <button className="btn ghost" onClick={logout}>
              Cerrar sesión
            </button>
          )}
        </div>
      </header>
      <main>
        <div className="page">{!session ? <Login /> : session.role === 'admin' ? <Admin /> : <Delegate groupId={session.groupId!} />}</div>
      </main>
    </div>
  )
}

function Login() {
  const { login } = useStore()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!login(u, p)) setErr('Usuario o contraseña incorrectos.')
  }
  return (
    <form className="card form narrow" onSubmit={submit}>
      <h1>Acceso de gestión</h1>
      <p className="muted">Solo para delegados y administración. Los estudiantes no necesitan cuenta.</p>
      <label>
        Usuario
        <input value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" required />
      </label>
      <label>
        Contraseña
        <input type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required />
      </label>
      {err && <p className="error">{err}</p>}
      <button className="btn primary">Ingresar</button>
      <p className="small muted demo">
        <b>Prototipo · cuentas de prueba:</b> <code>admin</code> / <code>admin2026</code> · delegado de X ciclo: <code>delegado10</code> /{' '}
        <code>ciclo10</code> (igual del 1 al 10).
      </p>
    </form>
  )
}

function Delegate({ groupId }: { groupId: string }) {
  const { participants, corrections, addParticipant, requestCorrection } = useStore()
  const g = group(groupId)!
  const [did, setDid] = useState(DISCIPLINES[0].id)
  const [name, setName] = useState('')
  const [jersey, setJersey] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [asking, setAsking] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const d = discipline(did)!
  const list = participants.filter((p) => p.groupId === groupId && p.disciplineId === did)
  const pendingFor = (pid: string) => corrections.some((c) => c.participantId === pid && c.status === 'pendiente')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err = addParticipant({ groupId, disciplineId: did, name, jersey: d.usesJersey ? +jersey : undefined })
    setMsg(err ? { ok: false, text: err } : { ok: true, text: 'Participante registrado. Queda pendiente de confirmación.' })
    if (!err) {
      setName('')
      setJersey('')
    }
  }

  return (
    <>
      <h1>Delegado · {g.name}</h1>
      <p className="muted">Puedes agregar participantes de tu ciclo. Una vez enviados no se editan: solicita la corrección a la administración.</p>
      <div className="chips">
        {DISCIPLINES.map((x) => (
          <button key={x.id} className={`chip big${x.id === did ? ' on' : ''}`} onClick={() => (setDid(x.id), setMsg(null))}>
            {x.icon} {x.name}
          </button>
        ))}
      </div>

      <form className="card form" onSubmit={submit}>
        <h2>Inscribir en {d.name}</h2>
        <div className="row">
          <label className="grow">
            Nombres y apellidos
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          {d.usesJersey && (
            <label>
              Dorsal
              <input type="number" min={1} max={99} value={jersey} onChange={(e) => setJersey(e.target.value)} required style={{ width: 90 }} />
            </label>
          )}
        </div>
        {msg && <p className={msg.ok ? 'success' : 'error'}>{msg.text}</p>}
        <button className="btn primary">Enviar inscripción</button>
      </form>

      <h2>
        Inscritos en {d.name} ({list.length})
      </h2>
      <div className="list">
        {list.map((p) => (
          <div key={p.id} className="card item">
            <div className="item-main">
              <strong>
                {p.jersey != null && <span className="num">#{p.jersey} </span>}
                {p.name}
              </strong>
              <span className={`badge ${p.status === 'confirmado' ? 'ok' : 'warn'}`}>{p.status === 'confirmado' ? 'Confirmado' : 'Por confirmar'}</span>
            </div>
            {pendingFor(p.id) ? (
              <span className="small muted">Corrección solicitada</span>
            ) : asking === p.id ? (
              <form
                className="row"
                onSubmit={(e) => {
                  e.preventDefault()
                  requestCorrection(p.id, reason.trim())
                  setAsking(null)
                  setReason('')
                }}
              >
                <input className="grow" placeholder="¿Qué se debe corregir?" value={reason} onChange={(e) => setReason(e.target.value)} required autoFocus />
                <button className="btn primary">Enviar</button>
                <button type="button" className="btn ghost" onClick={() => setAsking(null)}>
                  Cancelar
                </button>
              </form>
            ) : (
              <button className="btn ghost" onClick={() => (setAsking(p.id), setReason(''))}>
                Solicitar corrección
              </button>
            )}
          </div>
        ))}
        {!list.length && <p className="muted">Aún no inscribes a nadie en esta disciplina.</p>}
      </div>
    </>
  )
}

const TABS = ['Actividades', 'Inscripciones', 'Correcciones', 'Anuncios'] as const

function Admin() {
  const { corrections, participants, reset } = useStore()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Actividades')
  const count: Record<string, number> = {
    Correcciones: corrections.filter((c) => c.status === 'pendiente').length,
    Inscripciones: participants.filter((p) => p.status === 'pendiente').length,
  }
  return (
    <>
      <h1>Administración</h1>
      <div className="seg wrap" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {t}
            {count[t] > 0 && <span className="count">{count[t]}</span>}
          </button>
        ))}
      </div>
      {tab === 'Actividades' && <AdminActivities />}
      {tab === 'Inscripciones' && <AdminParticipants />}
      {tab === 'Correcciones' && <AdminCorrections />}
      {tab === 'Anuncios' && <AdminAnnouncements />}
      <p className="small muted" style={{ marginTop: 32 }}>
        <button className="btn ghost" onClick={() => confirm('¿Restablecer todos los datos de demostración?') && reset()}>
          Restablecer datos de demostración
        </button>
      </p>
    </>
  )
}

function AdminActivities() {
  const { activities } = useStore()
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="list">
      {[...activities].sort(byStart).map((a) => (
        <div key={a.id} className="card item">
          <button className="item-main as-btn" onClick={() => setOpen(open === a.id ? null : a.id)} aria-expanded={open === a.id}>
            <strong>
              {a.start} · {actTitle(a)}
            </strong>
            <span className={`badge st-${a.status}`}>{STATUS_LABEL[a.status]}</span>
          </button>
          {open === a.id && <ActivityEditor a={a} onDone={() => setOpen(null)} />}
        </div>
      ))}
    </div>
  )
}

function ActivityEditor({ a, onDone }: { a: Activity; onDone: () => void }) {
  const { updateActivity } = useStore()
  const [f, setF] = useState({ start: a.start, end: a.end, venueId: a.venueId, status: a.status, s0: a.score?.[0] ?? 0, s1: a.score?.[1] ?? 0 })
  const [err, setErr] = useState('')
  const duel = isDuel(a) && a.groupIds.length === 2
  const save = (e: FormEvent) => {
    e.preventDefault()
    const withScore = duel && (f.status === 'en_curso' || f.status === 'finalizado')
    const res = updateActivity(a.id, {
      start: f.start,
      end: f.end,
      venueId: f.venueId,
      status: f.status,
      score: withScore ? [f.s0, f.s1] : a.score,
    })
    if (res) setErr(res)
    else onDone()
  }
  return (
    <form className="form" onSubmit={save}>
      <div className="row">
        <label>
          Inicio
          <input type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} required />
        </label>
        <label>
          Fin
          <input type="time" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} required />
        </label>
        <label className="grow">
          Lugar
          <select value={f.venueId} onChange={(e) => setF({ ...f, venueId: e.target.value })}>
            {VENUES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grow">
          Estado
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Status })}>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      {duel && (
        <div className="row">
          {a.groupIds.map((gid, i) => (
            <label key={gid}>
              Marcador {group(gid)!.name}
              <input
                type="number"
                min={0}
                value={i ? f.s1 : f.s0}
                onChange={(e) => setF({ ...f, [i ? 's1' : 's0']: Math.max(0, +e.target.value) })}
                style={{ width: 110 }}
              />
            </label>
          ))}
        </div>
      )}
      {err && <p className="error">{err}</p>}
      <div className="row">
        <button className="btn primary">Guardar cambios</button>
        <button type="button" className="btn ghost" onClick={onDone}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

function AdminParticipants() {
  const { participants, confirmParticipant, removeParticipant } = useStore()
  const [gid, setGid] = useState('todos')
  const [onlyPending, setOnlyPending] = useState(true)
  const list = participants.filter((p) => (gid === 'todos' || p.groupId === gid) && (!onlyPending || p.status === 'pendiente'))
  return (
    <>
      <div className="filters">
        <select value={gid} onChange={(e) => setGid(e.target.value)} aria-label="Ciclo">
          <option value="todos">Todos los ciclos</option>
          {GROUPS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} /> Solo por confirmar
        </label>
      </div>
      <div className="list">
        {list.map((p) => (
          <div key={p.id} className="card item">
            <div className="item-main">
              <strong>
                {p.jersey != null && <span className="num">#{p.jersey} </span>}
                {p.name}
              </strong>
              <span className="small muted">
                {group(p.groupId)!.name} · {discipline(p.disciplineId)!.name}
              </span>
            </div>
            <div className="row">
              {p.status === 'pendiente' ? (
                <button className="btn primary" onClick={() => confirmParticipant(p.id)}>
                  Confirmar
                </button>
              ) : (
                <span className="badge ok">Confirmado</span>
              )}
              <button className="btn ghost danger" onClick={() => confirm(`¿Eliminar la inscripción de ${p.name}?`) && removeParticipant(p.id)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {!list.length && <p className="muted">No hay inscripciones con esos filtros.</p>}
      </div>
    </>
  )
}

function AdminCorrections() {
  const { corrections } = useStore()
  const pending = corrections.filter((c) => c.status === 'pendiente')
  return (
    <div className="list">
      {pending.map((c) => (
        <CorrectionItem key={c.id} c={c} />
      ))}
      {!pending.length && <p className="muted">No hay solicitudes de corrección pendientes.</p>}
    </div>
  )
}

function CorrectionItem({ c }: { c: Correction }) {
  const { participants, resolveCorrection } = useStore()
  const p = participants.find((x) => x.id === c.participantId)
  const [name, setName] = useState(p?.name ?? '')
  const [jersey, setJersey] = useState(p?.jersey?.toString() ?? '')
  if (!p) return null
  const d = discipline(p.disciplineId)!
  return (
    <form
      className="card item form"
      onSubmit={(e) => {
        e.preventDefault()
        resolveCorrection(c.id, { name: name.trim(), jersey: d.usesJersey ? +jersey : undefined })
      }}
    >
      <span className="small muted">
        {group(c.groupId)!.name} · {d.name}
      </span>
      <p>
        <b>Solicitud:</b> {c.message}
      </p>
      <div className="row">
        <label className="grow">
          Nombres y apellidos
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        {d.usesJersey && (
          <label>
            Dorsal
            <input type="number" min={1} max={99} value={jersey} onChange={(e) => setJersey(e.target.value)} required style={{ width: 90 }} />
          </label>
        )}
      </div>
      <div className="row">
        <button className="btn primary">Aplicar y resolver</button>
        <button type="button" className="btn ghost danger" onClick={() => resolveCorrection(c.id, null)}>
          Rechazar
        </button>
      </div>
    </form>
  )
}

function AdminAnnouncements() {
  const { announcements, addAnnouncement } = useStore()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [kind, setKind] = useState<Announcement['kind']>('info')
  const [targets, setTargets] = useState<string[]>([])
  return (
    <>
      <form
        className="card form"
        onSubmit={(e) => {
          e.preventDefault()
          addAnnouncement({ title: title.trim(), body: body.trim(), kind, groupIds: targets })
          setTitle('')
          setBody('')
          setTargets([])
        }}
      >
        <h2>Publicar anuncio</h2>
        <label>
          Título
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Mensaje
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} required />
        </label>
        <label>
          Tipo
          <select value={kind} onChange={(e) => setKind(e.target.value as Announcement['kind'])}>
            <option value="info">Informativo</option>
            <option value="cambio">Cambio de programación</option>
            <option value="urgente">Urgente</option>
          </select>
        </label>
        <fieldset>
          <legend>Dirigido a (sin marcar = todos los ciclos)</legend>
          <div className="chips">
            {GROUPS.map((g) => (
              <label key={g.id} className={`chip${targets.includes(g.id) ? ' on' : ''}`}>
                <input
                  type="checkbox"
                  className="sr"
                  checked={targets.includes(g.id)}
                  onChange={() => setTargets((t) => (t.includes(g.id) ? t.filter((x) => x !== g.id) : [...t, g.id]))}
                />
                {g.short}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="btn primary">Publicar</button>
      </form>
      <h2>Publicados ({announcements.length})</h2>
      <div className="list">
        {announcements.map((n) => (
          <div key={n.id} className="card item">
            <strong>{n.title}</strong>
            <span className="small muted">
              {n.time} · {n.groupIds.length ? n.groupIds.map((x) => group(x)!.short).join(', ') : 'Todos'}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
