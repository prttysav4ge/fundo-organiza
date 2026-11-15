import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Logo, OfflineBanner, STATUS_LABEL } from '../components/ui'
import { DISCIPLINES, EVENT, GROUPS, VENUES } from '../data/seed'
import { REMOTE, byStart, discipline, fmtDate, group, teamName, teamsFor, useStore } from '../data/store'
import type { Activity, Announcement, Correction, Participant, Status } from '../data/types'

const ROSTERED = DISCIPLINES.filter((d) => d.roster)
const MIN_PLAYERS: Record<string, number> = { futbol: 7, voley: 6, basquet: 5 }

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
        <div className="page">
          <OfflineBanner />
          {!session ? <Login /> : session.role === 'admin' ? <Admin /> : <Delegate groupId={session.groupId!} />}
          {session && REMOTE && <ChangePassword />}
        </div>
      </main>
    </div>
  )
}

function Login() {
  const { login } = useStore()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (!(await login(u, p))) setErr('Usuario o contraseña incorrectos.')
    } catch (x) {
      setErr((x as Error).message)
    }
    setBusy(false)
  }
  return (
    <form className="card form narrow" onSubmit={submit}>
      <h1>Acceso de gestión</h1>
      <p className="muted">Solo para delegados de ciclo y la comisión organizadora. Los estudiantes no necesitan cuenta.</p>
      <label>
        Usuario
        <input value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" autoCapitalize="none" required />
      </label>
      <label>
        Contraseña
        <input type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required />
      </label>
      {err && <p className="error">{err}</p>}
      <button className="btn primary" disabled={busy}>
        {busy ? 'Ingresando…' : 'Ingresar'}
      </button>
      {!REMOTE && (
      <p className="small muted demo">
        <b>Cuentas provisionales:</b> <code>admin</code> / <code>admin2026</code> · delegados <code>delegado1</code>…<code>delegado10</code> con{' '}
        <code>ciclo1</code>…<code>ciclo10</code> · egresados <code>delegadoe</code> / <code>egresados</code>.
      </p>
      )}
    </form>
  )
}

const PName = ({ p }: { p: Participant }) => (
  <strong>
    {p.jersey != null && <span className="num">#{p.jersey} </span>}
    {p.name}
    {p.gender === 'F' && <span className="small muted"> · mujer</span>}
    {p.teamId !== p.groupId && <span className="small muted"> · equipo {p.teamId.slice(1)}</span>}
  </strong>
)
const PBadge = ({ p }: { p: Participant }) => (
  <span className={`badge ${p.status === 'confirmado' ? 'ok' : 'warn'}`}>{p.status === 'confirmado' ? 'Confirmado' : 'Por confirmar'}</span>
)

function Delegate({ groupId }: { groupId: string }) {
  const { participants, corrections, addParticipant, requestCorrection, inscriptionsOpen: open } = useStore()
  const g = group(groupId)!
  const [did, setDid] = useState(ROSTERED[0].id)
  const d = discipline(did)!
  const rule = d.roster!
  const teams = teamsFor(did, groupId)
  const [f, setF] = useState({ name: '', upaoId: '', jersey: '', gender: '', team: '' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [asking, setAsking] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const mine = participants.filter((p) => p.groupId === groupId)
  const list = mine.filter((p) => p.disciplineId === did)
  const teamId = teams.includes(f.team) ? f.team : teams[0]
  const pendingFor = (pid: string) => corrections.some((c) => c.participantId === pid && c.status === 'pendiente')

  const hints: string[] = []
  teams.forEach((t) => {
    const n = list.filter((p) => p.teamId === t)
    const tag = teams.length > 1 ? ` (equipo ${t.slice(1)})` : ''
    if (MIN_PLAYERS[did] && n.length < MIN_PLAYERS[did]) hints.push(`Faltan ${MIN_PLAYERS[did] - n.length} para el mínimo de ${MIN_PLAYERS[did]} en cancha${tag}.`)
    if (did === 'voley' && n.length > 0 && n.filter((p) => p.gender === 'F').length < 2) hints.push('El vóley exige mínimo 2 mujeres en cancha.')
    if (did === 'gincana' && n.length !== 10) hints.push(`La gincana requiere exactamente 10 personas: llevas ${n.length}.`)
  })

  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const err = await addParticipant({
      groupId,
      teamId,
      disciplineId: did,
      name: f.name,
      upaoId: f.upaoId,
      jersey: rule.jersey ? +f.jersey : undefined,
      gender: rule.gender ? (f.gender as 'F' | 'M') || undefined : undefined,
    })
    setBusy(false)
    setMsg(err ? { ok: false, text: err } : { ok: true, text: 'Participante registrado. Queda pendiente de confirmación.' })
    if (!err) setF({ ...f, name: '', upaoId: '', jersey: '', gender: '' })
  }

  return (
    <>
      <h1>Delegado · {g.name}</h1>
      <p className="muted">
        Inscribe a los participantes de tu ciclo ({g.theme}). Una vez enviados no se editan: solicita la corrección a la comisión organizadora.
      </p>
      <p className={`card info ${open ? '' : 'closed'}`}>
        {open ? (
          <>
            ⏳ Inscripciones abiertas hasta el <b>{EVENT.deadlineLabel}</b>
          </>
        ) : (
          <>
            🔒 El plazo de inscripción venció (<b>{EVENT.deadlineLabel}</b>). Ya no se aceptan inscripciones ni cambios.
          </>
        )}
      </p>
      <div className="chips">
        {ROSTERED.map((x) => {
          const n = mine.filter((p) => p.disciplineId === x.id).length
          return (
            <button key={x.id} className={`chip big${x.id === did ? ' on' : ''}`} onClick={() => (setDid(x.id), setMsg(null))}>
              {x.icon} {x.name} <span className="count">{n}</span>
            </button>
          )
        })}
      </div>

      {open && (
        <form className="card form" onSubmit={submit}>
          <h2>Inscribir en {d.name}</h2>
          <div className="row">
            <label className="grow">
              Nombres y apellidos
              <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
            </label>
            <label>
              ID UPAO
              <input inputMode="numeric" maxLength={9} placeholder="6 o 9 dígitos" value={f.upaoId} onChange={(e) => setF({ ...f, upaoId: e.target.value })} required style={{ width: 140 }} />
            </label>
            {rule.jersey && (
              <label>
                N.° de polo
                <input type="number" min={1} max={99} value={f.jersey} onChange={(e) => setF({ ...f, jersey: e.target.value })} required style={{ width: 100 }} />
              </label>
            )}
            {rule.gender && (
              <label>
                Sexo
                <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })} required>
                  <option value="">Elegir…</option>
                  <option value="F">Mujer</option>
                  <option value="M">Varón</option>
                </select>
              </label>
            )}
            {teams.length > 1 && (
              <label>
                Equipo
                <select value={teamId} onChange={(e) => setF({ ...f, team: e.target.value })}>
                  {teams.map((t) => (
                    <option key={t} value={t}>
                      {t.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {msg && <p className={msg.ok ? 'success' : 'error'}>{msg.text}</p>}
          <button className="btn primary" disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar inscripción'}
          </button>
        </form>
      )}

      <h2>
        Inscritos en {d.name} ({list.length}
        {rule.max ? ` de ${rule.max * teams.length}` : ''})
      </h2>
      {hints.map((h) => (
        <p key={h} className="small hint">
          ⚠️ {h}
        </p>
      ))}
      <div className="list">
        {list.map((p) => (
          <div key={p.id} className="card item">
            <div className="item-main">
              <span>
                <PName p={p} />
                <span className="small muted"> · ID {p.upaoId}</span>
              </span>
              <PBadge p={p} />
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
        {!list.length && <p className="muted">Aún no inscribes a nadie en {d.name}.</p>}
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
      <h1>Comisión organizadora</h1>
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
      {!REMOTE && (
      <p className="small muted" style={{ marginTop: 32 }}>
        <button className="btn ghost danger" onClick={() => confirm('Se borrarán inscripciones, resultados y anuncios de este navegador. ¿Continuar?') && reset()}>
          Restablecer todo al estado inicial
        </button>
      </p>
      )}
    </>
  )
}

function AdminActivities() {
  const { activities, bracket, title, setDirect, directOverride, addActivity } = useStore()
  const [open, setOpen] = useState<string | null>(null)
  const [nf, setNf] = useState({ title: '', venueId: 'escenario', start: '', end: '' })
  const [err, setErr] = useState('')
  return (
    <>
      <div className="card form">
        <h2>Pase directo a la final</h2>
        {DISCIPLINES.filter((d) => d.format === 'duelo').map((d) => {
          const info = bracket.direct[d.id]
          return (
            <div key={d.id} className="row">
              <span className="grow">
                <b>{d.name}:</b> {info.team ? teamName(info.team) : 'por definir'} <span className="small muted">{info.reason}</span>
              </span>
              {info.candidates.length === 3 && (
                <select value={directOverride[d.id] ?? ''} onChange={(e) => setDirect(d.id, e.target.value)} aria-label={`Pase directo en ${d.name}`}>
                  <option value="">Según las bases</option>
                  {info.candidates.map((t) => (
                    <option key={t} value={t}>
                      {teamName(t)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )
        })}
      </div>

      <div className="list">
        {[...activities].sort(byStart).map((a) => (
          <div key={a.id} className="card item">
            <button className="item-main as-btn" onClick={() => setOpen(open === a.id ? null : a.id)} aria-expanded={open === a.id}>
              <strong>
                {a.start} · {title(a)}
              </strong>
              <span className={`badge st-${a.status}`}>{STATUS_LABEL[a.status]}</span>
            </button>
            {open === a.id && <ActivityEditor a={a} onDone={() => setOpen(null)} />}
          </div>
        ))}
      </div>

      <form
        className="card form"
        onSubmit={(e) => {
          e.preventDefault()
          addActivity(nf).then((res) => {
            setErr(res ?? '')
            if (!res) setNf({ ...nf, title: '', start: '', end: '' })
          })
        }}
      >
        <h2>Agregar actividad general</h2>
        <div className="row">
          <label className="grow">
            Nombre
            <input value={nf.title} onChange={(e) => setNf({ ...nf, title: e.target.value })} required />
          </label>
          <label>
            Lugar
            <select value={nf.venueId} onChange={(e) => setNf({ ...nf, venueId: e.target.value })}>
              {VENUES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Inicio
            <input type="time" value={nf.start} onChange={(e) => setNf({ ...nf, start: e.target.value })} required />
          </label>
          <label>
            Fin
            <input type="time" value={nf.end} onChange={(e) => setNf({ ...nf, end: e.target.value })} required />
          </label>
        </div>
        {err && <p className="error">{err}</p>}
        <button className="btn primary">Agregar</button>
      </form>
    </>
  )
}

function ActivityEditor({ a, onDone }: { a: Activity; onDone: () => void }) {
  const { updateActivity, removeActivity, bracket } = useStore()
  const sides = bracket.sides[a.id]
  const d = discipline(a.disciplineId)
  const [f, setF] = useState({
    start: a.start,
    end: a.end,
    venueId: a.venueId,
    status: a.status,
    s0: a.score?.[0] ?? 0,
    s1: a.score?.[1] ?? 0,
    wo: !!a.wo,
    winner: a.winner ?? '',
    places: [0, 1, 2, 3].map((i) => a.places?.[i] ?? ''),
    chName: a.champion?.name ?? '',
    chGroup: a.champion?.groupId ?? '',
  })
  const [err, setErr] = useState('')
  const isGame = a.disciplineId === 'gincana'
  const isChess = a.disciplineId === 'ajedrez'
  const teams = sides?.map((s) => s.team)
  const ready = !!teams && teams.every(Boolean)
  const labelled = !!a.sides && 'label' in a.sides[0]
  const playing = f.status === 'en_curso' || f.status === 'finalizado'
  const done = f.status === 'finalizado'
  const tie = f.s0 === f.s1

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const patch: Partial<Activity> = { start: f.start, end: f.end, venueId: f.venueId, status: f.status }
    if (sides && playing) {
      if (!ready && !labelled) return setErr('Aún no se definen los dos equipos de este partido.')
      if (f.wo) {
        if (done && !f.winner) return setErr('Indica quién gana por W.O.')
        Object.assign(patch, { wo: true, winner: f.winner || undefined, score: undefined })
      } else {
        if (done && a.disciplineId === 'voley' && Math.max(f.s0, f.s1) !== 2) return setErr('En vóley gana quien llega a 2 sets (2-0 o 2-1).')
        if (done && tie && d?.unit === 'Puntos') return setErr('En básquet no hay empate: se define por punto de oro.')
        if (done && tie && d?.unit === 'Sets') return setErr('En vóley no hay empate.')
        if (done && tie && ready && !f.winner) return setErr('Empate: indica quién ganó en penales.')
        Object.assign(patch, { wo: false, score: [f.s0, f.s1], winner: tie && f.winner !== 'none' ? f.winner || undefined : undefined })
      }
    }
    if (isChess && done) {
      if (f.chName.trim() && !f.chGroup) return setErr('Indica el ciclo del campeón.')
      patch.champion = f.chName.trim() ? { name: f.chName.trim().replace(/\s+/g, ' '), groupId: f.chGroup } : undefined
    }
    if (isGame && done) {
      const chosen = f.places.filter(Boolean)
      if (!f.places[0]) return setErr('Indica al menos el 1.er puesto.')
      if (new Set(chosen).size !== chosen.length) return setErr('Un ciclo no puede ocupar dos puestos en el mismo juego.')
      patch.places = f.places
    }
    const res = await updateActivity(a.id, patch)
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

      {sides && playing && (
        <>
          {ready && (
            <label className="check">
              <input type="checkbox" checked={f.wo} onChange={(e) => setF({ ...f, wo: e.target.checked, winner: '' })} /> Partido definido por W.O.
            </label>
          )}
          {!f.wo && (
            <div className="row">
              {sides.map((s, i) => (
                <label key={i}>
                  {d?.unit} · {s.label}
                  <input
                    type="number"
                    min={0}
                    value={i ? f.s1 : f.s0}
                    onChange={(e) => setF({ ...f, [i ? 's1' : 's0']: Math.max(0, Math.floor(+e.target.value)) })}
                    style={{ width: 120 }}
                  />
                </label>
              ))}
            </div>
          )}
          {ready && done && (f.wo || (tie && d?.unit === 'Goles')) && (
            <label>
              {f.wo ? 'Gana por W.O.' : 'Ganador en penales'}
              <select value={f.winner} onChange={(e) => setF({ ...f, winner: e.target.value })}>
                <option value="">Elegir…</option>
                {sides.map((s) => (
                  <option key={s.team!} value={s.team!}>
                    {s.label}
                  </option>
                ))}
                {f.wo && <option value="none">Ninguno (doble W.O.)</option>}
              </select>
            </label>
          )}
        </>
      )}

      {isChess && done && (
        <div className="row">
          <label className="grow">
            Campeón de ajedrez (nombre completo)
            <input value={f.chName} onChange={(e) => setF({ ...f, chName: e.target.value })} />
          </label>
          <label>
            Ciclo
            <select value={f.chGroup} onChange={(e) => setF({ ...f, chGroup: e.target.value })}>
              <option value="">Elegir…</option>
              {GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {isGame && done && (
        <div className="row">
          {f.places.map((val, i) => (
            <label key={i}>
              {i + 1}.° puesto
              <select value={val} onChange={(e) => setF({ ...f, places: f.places.map((x, j) => (j === i ? e.target.value : x)) })}>
                <option value="">—</option>
                {GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
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
        {a.custom && (
          <button type="button" className="btn ghost danger" onClick={() => confirm('¿Eliminar esta actividad?') && removeActivity(a.id)}>
            Eliminar
          </button>
        )}
      </div>
    </form>
  )
}

function AdminParticipants() {
  const { participants, confirmParticipants, removeParticipant } = useStore()
  const [gid, setGid] = useState('todos')
  const [did, setDid] = useState('todas')
  const [onlyPending, setOnlyPending] = useState(false)
  const list = participants.filter(
    (p) => (gid === 'todos' || p.groupId === gid) && (did === 'todas' || p.disciplineId === did) && (!onlyPending || p.status === 'pendiente'),
  )
  const people = new Set(participants.map((p) => p.upaoId)).size
  const pending = list.filter((p) => p.status === 'pendiente').length
  return (
    <>
      <p className="card info">
        <b>{participants.length}</b> inscripciones de <b>{people}</b> personas distintas (lista para el almuerzo, exclusivo para inscritos).
      </p>
      <div className="filters">
        <select value={gid} onChange={(e) => setGid(e.target.value)} aria-label="Ciclo">
          <option value="todos">Todos los ciclos</option>
          {GROUPS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select value={did} onChange={(e) => setDid(e.target.value)} aria-label="Disciplina">
          <option value="todas">Todas las disciplinas</option>
          {ROSTERED.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} /> Solo por confirmar
        </label>
        {pending > 0 && did === 'todas' && (
          <button className="btn ghost" onClick={() => confirm(`¿Confirmar las inscripciones pendientes de ${gid === 'todos' ? 'todos los ciclos' : group(gid)!.name}?`) && confirmParticipants(list.filter((p) => p.status === 'pendiente').map((p) => p.id))}>
            Confirmar todas
          </button>
        )}
      </div>
      <div className="list">
        {list.map((p) => (
          <div key={p.id} className="card item">
            <div className="item-main">
              <PName p={p} />
              <span className="small muted">
                {group(p.groupId)!.name} · {discipline(p.disciplineId)!.name} · ID {p.upaoId}
              </span>
            </div>
            <div className="row">
              {p.status === 'pendiente' ? (
                <button className="btn primary" onClick={() => confirmParticipants([p.id])}>
                  Confirmar
                </button>
              ) : (
                <PBadge p={p} />
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
  const [upaoId, setUpaoId] = useState(p?.upaoId ?? '')
  const [jersey, setJersey] = useState(p?.jersey?.toString() ?? '')
  const [err, setErr] = useState('')
  if (!p) return null
  const d = discipline(p.disciplineId)!
  return (
    <form
      className="card item form"
      onSubmit={(e) => {
        e.preventDefault()
        resolveCorrection(c.id, { name, upaoId: upaoId.trim(), jersey: d.roster!.jersey ? +jersey : undefined }).then((r) => setErr(r ?? ''))
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
        <label>
          ID UPAO
          <input inputMode="numeric" maxLength={9} value={upaoId} onChange={(e) => setUpaoId(e.target.value)} required style={{ width: 140 }} />
        </label>
        {d.roster!.jersey && (
          <label>
            N.° de polo
            <input type="number" min={1} max={99} value={jersey} onChange={(e) => setJersey(e.target.value)} required style={{ width: 100 }} />
          </label>
        )}
      </div>
      {err && <p className="error">{err}</p>}
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
  const { announcements, addAnnouncement, removeAnnouncement } = useStore()
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
          <legend>Dirigido a (sin marcar = todos)</legend>
          <div className="chips">
            {GROUPS.map((g) => (
              <label key={g.id} className={`chip${targets.includes(g.id) ? ' on' : ''}`}>
                <input
                  type="checkbox"
                  className="sr"
                  checked={targets.includes(g.id)}
                  onChange={() => setTargets((t) => (t.includes(g.id) ? t.filter((x) => x !== g.id) : [...t, g.id]))}
                />
                {g.id === 'ce' ? 'Egresados' : g.short}
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
            <div className="item-main">
              <strong>{n.title}</strong>
              <button className="btn ghost danger" onClick={() => confirm('¿Eliminar este anuncio?') && removeAnnouncement(n.id)}>
                Eliminar
              </button>
            </div>
            <span className="small muted">
              {fmtDate(n.date)} · {n.groupIds.length ? n.groupIds.map((x) => group(x)!.name).join(', ') : 'Todos'}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

function ChangePassword() {
  const { changePassword } = useStore()
  const [o, setO] = useState('')
  const [n, setN] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <details className="card rules" style={{ marginTop: 32 }}>
      <summary>Cambiar mi contraseña</summary>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault()
          const err = await changePassword(o, n)
          setMsg(err ? { ok: false, text: err } : { ok: true, text: 'Contraseña actualizada.' })
          if (!err) (setO(''), setN(''))
        }}
      >
        <div className="row">
          <label className="grow">
            Contraseña actual
            <input type="password" value={o} onChange={(e) => setO(e.target.value)} autoComplete="current-password" required />
          </label>
          <label className="grow">
            Nueva contraseña (mínimo 8 caracteres)
            <input type="password" value={n} onChange={(e) => setN(e.target.value)} autoComplete="new-password" minLength={8} required />
          </label>
        </div>
        {msg && <p className={msg.ok ? 'success' : 'error'}>{msg.text}</p>}
        <button className="btn primary">Guardar contraseña</button>
      </form>
    </details>
  )
}
