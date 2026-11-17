import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { DisputeBanner, Logo, OfflineBanner, STATUS_LABEL } from '../components/ui'
import { DISCIPLINES, EVENT, GROUPS, VENUES } from '../data/seed'
import { readRegistrationExcel, type ImportResult } from '../data/importExcel'
import { REMOTE, byStart, discipline, validateParticipant, fmtDate, fmtTime, group, teamName, teamsFor, useStore } from '../data/store'
import type { Activity, Announcement, Correction, Participant, ScoreReport, Status } from '../data/types'

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
          <DisputeBanner />
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
      <details className="forgot">
        <summary>¿Olvidaste tu contraseña?</summary>
        <p className="small">
          Escríbele a la comisión organizadora con tu usuario (por ejemplo, <code>delegado6</code>). Te dará una contraseña temporal; al entrar, cámbiala en
          «Cambiar mi contraseña», al final de tu panel.
        </p>
      </details>
      {!REMOTE && (
      <p className="small muted demo">
        <b>Cuentas provisionales:</b> <code>admin</code> / <code>admin2026</code> · delegados <code>delegado1</code>…<code>delegado10</code> con{' '}
        <code>ciclo1</code>…<code>ciclo10</code> · egresados <code>delegadoe</code> / <code>egresados</code>.
      </p>
      )}
    </form>
  )
}

const teamLabel = (t: string) => (t.includes('.') ? `Equipo ${t.endsWith('.1') ? 'A' : 'B'} (${t.slice(1)})` : '')

const PName = ({ p }: { p: Participant }) => (
  <strong>
    {p.jersey != null && <span className="num">#{p.jersey} </span>}
    {p.name}
    {p.teamId !== p.groupId && <span className="small muted"> · {teamLabel(p.teamId)}</span>}
  </strong>
)
const PBadge = ({ p }: { p: Participant }) => (
  <span className={`badge ${p.status === 'confirmado' ? 'ok' : 'warn'}`}>{p.status === 'confirmado' ? 'Confirmado' : 'Por confirmar'}</span>
)
const PData = ({ p }: { p: Participant }) => (
  <span className="small muted pdata">{p.upaoId ? `ID ${p.upaoId} · DNI ${p.dni} · ${p.email}` : 'Cargando datos…'}</span>
)

function Delegate({ groupId }: { groupId: string }) {
  const { activities, bracket } = useStore()
  const g = group(groupId)!
  const [tab, setTab] = useState<'Inscripciones' | 'Resultados'>('Inscripciones')
  const pendingReports = activities.filter((a) => {
    const s = bracket.sides[a.id]
    return s && s.every((x) => x.team) && s.some((x) => x.team!.split('.')[0] === groupId) && (a.status === 'en_curso' || a.dispute)
  }).length
  return (
    <>
      <h1>Delegado · {g.name}</h1>
      <div className="seg wrap" role="tablist">
        {(['Inscripciones', 'Resultados'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {t}
            {t === 'Resultados' && pendingReports > 0 && <span className="count">{pendingReports}</span>}
          </button>
        ))}
      </div>
      {tab === 'Inscripciones' ? <DelegateRoster groupId={groupId} /> : <DelegateResults groupId={groupId} />}
    </>
  )
}

function DelegateRoster({ groupId }: { groupId: string }) {
  const { participants, corrections, addParticipant, requestCorrection, inscriptionsOpen: open } = useStore()
  const g = group(groupId)!
  const [did, setDid] = useState(ROSTERED[0].id)
  const d = discipline(did)!
  const rule = d.roster!
  const teams = teamsFor(did, groupId)
  const empty = { name: '', upaoId: '', dni: '', email: '', jersey: '' }
  const [f, setF] = useState({ ...empty, team: '' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [asking, setAsking] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const mine = participants.filter((p) => p.groupId === groupId)
  const list = mine.filter((p) => p.disciplineId === did)
  const teamId = teams.includes(f.team) ? f.team : teams[0]
  const pendingFor = (pid: string) => corrections.some((c) => c.participantId === pid && c.status === 'pendiente')

  const hints: string[] = []
  teams.forEach((t) => {
    const n = list.filter((p) => p.teamId === t).length
    const tag = teams.length > 1 ? ` (${teamLabel(t)})` : ''
    if (MIN_PLAYERS[did] && n < MIN_PLAYERS[did]) hints.push(`Faltan ${MIN_PLAYERS[did] - n} para el mínimo de ${MIN_PLAYERS[did]} en cancha${tag}.`)
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const err = await addParticipant({
      groupId,
      teamId,
      disciplineId: did,
      name: f.name,
      upaoId: f.upaoId.trim(),
      dni: f.dni.trim(),
      email: f.email.trim().toLowerCase(),
      jersey: rule.jersey ? +f.jersey : undefined,
    })
    setBusy(false)
    setMsg(err ? { ok: false, text: err } : { ok: true, text: 'Participante registrado. Queda pendiente de confirmación.' })
    if (!err) setF({ ...f, ...empty })
  }

  return (
    <>
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
      {open && <ExcelUpload groupId={groupId} />}

      <h2>Inscritos por deporte</h2>
      <div className="chips">
        {ROSTERED.map((x) => {
          const n = mine.filter((p) => p.disciplineId === x.id).length
          const max = x.roster!.max ? x.roster!.max * teamsFor(x.id, groupId).length : null
          return (
            <button key={x.id} className={`chip big${x.id === did ? ' on' : ''}`} onClick={() => (setDid(x.id), setMsg(null))}>
              {x.icon} {x.name}{' '}
              <span className="count">
                {n}
                {max ? `/${max}` : ''}
              </span>
            </button>
          )
        })}
      </div>

      {open && (
        <details className="card manual">
          <summary>O inscribir a una persona a mano en {d.name}</summary>
        <form className="form" onSubmit={submit}>
          <h2>Inscribir en {d.name}</h2>
          <p className="small muted">
            {rule.max ? `Máximo ${rule.max} por equipo.` : 'Sin límite de inscritos.'}{' '}
            {rule.sport
              ? 'Cuenta para el límite de 2 deportes (fútbol, vóley o básquet).'
              : did === 'gincana'
                ? 'Solo para quienes no están en fútbol, vóley ni básquet.'
                : 'No cuenta para el límite de 2 deportes.'}
          </p>
          <div className="row">
            {rule.jersey && (
              <label>
                N.° de polo
                <input id="f-jersey" type="number" min={1} max={99} value={f.jersey} onChange={(e) => setF({ ...f, jersey: e.target.value })} required style={{ width: 100 }} />
              </label>
            )}
            <label className="grow">
              Nombre completo (Apellidos, Nombres)
              <input id="f-name" placeholder="Rojas Cruz, Ana María" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
            </label>
          </div>
          <div className="row">
            <label>
              ID UPAO
              <input id="f-id" inputMode="numeric" maxLength={9} placeholder="6 o 9 dígitos" value={f.upaoId} onChange={(e) => setF({ ...f, upaoId: e.target.value })} required style={{ width: 140 }} />
            </label>
            <label>
              DNI
              <input id="f-dni" inputMode="numeric" maxLength={8} placeholder="8 dígitos" value={f.dni} onChange={(e) => setF({ ...f, dni: e.target.value })} required style={{ width: 130 }} />
            </label>
            <label className="grow">
              Correo institucional
              <input id="f-email" type="email" placeholder="usuario@upao.edu.pe" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
            </label>
            {teams.length > 1 && (
              <label>
                Equipo
                <select id="f-team" value={teamId} onChange={(e) => setF({ ...f, team: e.target.value })}>
                  {teams.map((t) => (
                    <option key={t} value={t}>
                      {teamLabel(t)}
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
        </details>
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
              <PName p={p} />
              <PBadge p={p} />
            </div>
            <PData p={p} />
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

/** Partidos del ciclo del delegado, para registrar el marcador. */
function DelegateResults({ groupId }: { groupId: string }) {
  const { activities, bracket, reports } = useStore()
  const mine = [...activities]
    .sort(byStart)
    .filter((a) => {
      const s = bracket.sides[a.id]
      return s && s.every((x) => x.team) && s.some((x) => x.team!.split('.')[0] === groupId) && a.status !== 'cancelado'
    })
  return (
    <>
      <p className="muted">
        Registra el resultado de cada partido de tu ciclo apenas termine. El delegado del otro ciclo también lo registra: si los dos marcadores coinciden, el
        resultado se confirma solo y el ganador avanza. Si no coinciden, el partido queda <b>en disputa</b> y se avisa a todos hasta que se corrija.
      </p>
      <div className="list">
        {mine.map((a) => (
          <ReportItem key={a.id} a={a} groupId={groupId} reports={reports.filter((r) => r.activityId === a.id)} />
        ))}
        {!mine.length && <p className="muted">Tu ciclo no tiene partidos definidos por ahora. Los de 2.ª ronda en adelante aparecen cuando se conoce el rival.</p>}
      </div>
    </>
  )
}

function ReportItem({ a, groupId, reports }: { a: Activity; groupId: string; reports: ScoreReport[] }) {
  const { bracket, title, reportScore } = useStore()
  const sides = bracket.sides[a.id]
  const d = discipline(a.disciplineId)
  const mineRep = reports.find((r) => r.groupId === groupId)
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ s0: mineRep?.score[0] ?? 0, s1: mineRep?.score[1] ?? 0, wo: !!mineRep?.wo, winner: mineRep?.winner ?? '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const closed = a.status === 'finalizado'
  const groups = [...new Set(sides.map((s) => s.team!.split('.')[0]))]
  const tie = !f.wo && f.s0 === f.s1
  const fmt = (r: ScoreReport) => (r.wo ? `W.O. · gana ${r.winner === 'none' ? 'nadie' : teamName(r.winner!)}` : `${r.score[0]} – ${r.score[1]}${r.winner ? ` (penales: ${teamName(r.winner)})` : ''}`)

  const send = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const res = await reportScore(a.id, { score: [f.s0, f.s1], wo: f.wo, winner: f.winner || undefined })
    setBusy(false)
    setErr(res ?? '')
    if (!res) setOpen(false)
  }

  return (
    <div className={`card item${a.dispute ? ' disputed' : ''}`}>
      <div className="item-main">
        <strong>
          {fmtTime(a.start)} · {title(a)}
        </strong>
        {a.dispute ? <span className="badge st-cancelado">En disputa</span> : <span className={`badge st-${a.status}`}>{STATUS_LABEL[a.status]}</span>}
      </div>
      <ul className="reports">
        {groups.map((gid) => {
          const r = reports.find((x) => x.groupId === gid)
          return (
            <li key={gid}>
              {group(gid)!.name}: {r ? <b>{fmt(r)}</b> : <span className="muted">sin registrar</span>}
            </li>
          )
        })}
      </ul>
      {closed ? (
        <span className="small result">Resultado confirmado{a.score && !a.wo ? `: ${a.score[0]} – ${a.score[1]}` : ''}</span>
      ) : !open ? (
        <button className="btn primary" onClick={() => setOpen(true)}>
          {mineRep ? 'Corregir mi resultado' : 'Registrar resultado'}
        </button>
      ) : (
        <form className="form" onSubmit={send}>
          <label className="check">
            <input type="checkbox" checked={f.wo} onChange={(e) => setF({ ...f, wo: e.target.checked, winner: '' })} /> Se definió por W.O.
          </label>
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
                    style={{ width: 110 }}
                  />
                </label>
              ))}
            </div>
          )}
          {(f.wo || (tie && d?.unit === 'Goles')) && (
            <label>
              {f.wo ? 'Gana por W.O.' : 'Ganador en penales'}
              <select value={f.winner} onChange={(e) => setF({ ...f, winner: e.target.value })} required>
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
          {err && <p className="error">{err}</p>}
          <div className="row">
            <button className="btn primary" disabled={busy}>
              {busy ? 'Enviando…' : 'Enviar resultado'}
            </button>
            <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

const TABS = ['Actividades', 'Inscripciones', 'Correcciones', 'Anuncios', 'Cuentas'] as const

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
      {tab === 'Cuentas' && <AdminAccounts />}
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
                <b>{d.name}:</b>{' '}
                {info.team ? (
                  <>✅ Confirmado: {teamName(info.team)}</>
                ) : info.forecast ? (
                  <>
                    Pronóstico: {teamName(info.forecast)} <span className="small muted">({info.reason}). Confírmalo con el árbitro.</span>
                  </>
                ) : (
                  <span className="muted">{info.candidates.length ? info.reason : 'Se define al terminar la 2.ª ronda.'}</span>
                )}
              </span>
              {info.candidates.length === 3 && (
                <select value={directOverride[d.id] ?? ''} onChange={(e) => setDirect(d.id, e.target.value)} aria-label={`Pase directo en ${d.name}`}>
                  <option value="">Sin confirmar</option>
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
              {a.dispute && a.status !== 'finalizado' ? <span className="badge st-cancelado">En disputa</span> : <span className={`badge st-${a.status}`}>{STATUS_LABEL[a.status]}</span>}
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
    // La comisión resuelve la disputa al cerrar el partido.
    if (f.status === 'finalizado') patch.dispute = false
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

      {sides && <EditorReports a={a} />}

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
                {group(p.groupId)!.name} · {discipline(p.disciplineId)!.name}
              </span>
            </div>
            <PData p={p} />
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
  const [dni, setDni] = useState(p?.dni ?? '')
  const [email, setEmail] = useState(p?.email ?? '')
  const [jersey, setJersey] = useState(p?.jersey?.toString() ?? '')
  const [err, setErr] = useState('')
  if (!p) return null
  const d = discipline(p.disciplineId)!
  return (
    <form
      className="card item form"
      onSubmit={(e) => {
        e.preventDefault()
        resolveCorrection(c.id, { name, upaoId: upaoId.trim(), dni: dni.trim(), email: email.trim().toLowerCase(), jersey: d.roster!.jersey ? +jersey : undefined }).then((r) => setErr(r ?? ''))
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
          Nombre completo (Apellidos, Nombres)
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          ID UPAO
          <input inputMode="numeric" maxLength={9} value={upaoId} onChange={(e) => setUpaoId(e.target.value)} required style={{ width: 140 }} />
        </label>
        <label>
          DNI
          <input inputMode="numeric" maxLength={8} value={dni} onChange={(e) => setDni(e.target.value)} required style={{ width: 130 }} />
        </label>
        <label className="grow">
          Correo institucional
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
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

/** Lo que reportaron los delegados, para que la comisión lo vea al editar. */
function EditorReports({ a }: { a: Activity }) {
  const { reports } = useStore()
  const rs = reports.filter((r) => r.activityId === a.id)
  if (!rs.length) return null
  return (
    <div className={`card info${a.dispute ? ' closed' : ''}`}>
      <b>{a.dispute ? '⚠️ Los delegados reportaron resultados distintos:' : 'Reportado por los delegados:'}</b>
      <ul className="reports">
        {rs.map((r) => (
          <li key={r.groupId}>
            {group(r.groupId)!.name}: {r.wo ? `W.O., gana ${r.winner === 'none' ? 'nadie' : teamName(r.winner!)}` : `${r.score[0]} – ${r.score[1]}`}
            {!r.wo && r.winner ? ` (penales: ${teamName(r.winner)})` : ''}
          </li>
        ))}
      </ul>
      {a.dispute && <span className="small">Verifica con el árbitro y registra aquí el resultado correcto como «Finalizado».</span>}
    </div>
  )
}

/** La comisión restablece la contraseña de un delegado que la olvidó. */
function AdminAccounts() {
  const { listAccounts, resetPassword } = useStore()
  const [rows, setRows] = useState<{ username: string; role: string; group_id: string | null }[] | null>(null)
  const [result, setResult] = useState<Record<string, { pass?: string; error?: string }>>({})
  const [asking, setAsking] = useState<string | null>(null)
  useEffect(() => {
    listAccounts().then(setRows)
  }, [])
  if (!REMOTE) return <p className="muted">Disponible solo en la versión conectada al servidor.</p>
  if (!rows) return <p className="muted">Cargando cuentas…</p>
  return (
    <>
      <p className="muted">
        Si un delegado olvidó su contraseña, genera una temporal y entrégasela en persona o por mensaje privado. Su sesión abierta se cierra y la contraseña anterior deja de
        funcionar.
      </p>
      <div className="list">
        {rows
          .filter((r) => r.role === 'delegado')
          .map((r) => (
            <div key={r.username} className="card item">
              <div className="item-main">
                <span>
                  <strong>{r.username}</strong> <span className="small muted">· {group(r.group_id)?.name}</span>
                </span>
                {asking === r.username ? (
                  <span className="row">
                    <button
                      className="btn primary"
                      onClick={async () => {
                        setResult({ ...result, [r.username]: await resetPassword(r.username) })
                        setAsking(null)
                      }}
                    >
                      Sí, restablecer
                    </button>
                    <button className="btn ghost" onClick={() => setAsking(null)}>
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <button className="btn ghost" onClick={() => setAsking(r.username)}>
                    Restablecer contraseña
                  </button>
                )}
              </div>
              {result[r.username]?.pass && (
                <p className="success">
                  Nueva contraseña temporal: <code className="pass">{result[r.username].pass}</code>
                </p>
              )}
              {result[r.username]?.error && <p className="error">{result[r.username].error}</p>}
            </div>
          ))}
      </div>
    </>
  )
}

/** Subir el Excel de inscripción del ciclo (formato entregado a los delegados). */
function ExcelUpload({ groupId }: { groupId: string }) {
  const { participants, addParticipants } = useStore()
  const g = group(groupId)!
  const [res, setRes] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [readErr, setReadErr] = useState('')
  const [progress, setProgress] = useState<number | null>(null)
  const [sent, setSent] = useState<(string | null)[] | null>(null)
  const [inputKey, setInputKey] = useState(0)

  const onFile = async (file: File | undefined) => {
    setRes(null)
    setSent(null)
    setReadErr('')
    if (!file) return
    setFileName(file.name)
    try {
      setRes(await readRegistrationExcel(file, groupId))
    } catch {
      setReadErr('No pude leer el archivo. Súbelo en formato Excel (.xlsx).')
    }
  }

  // Revisión previa: reglas de las bases aplicadas fila por fila, acumulando las anteriores.
  const wrongCycle = !!res?.groupId && res.groupId !== groupId
  const checked = (() => {
    if (!res) return []
    const acc = [...participants]
    return res.rows.map((r) => {
      if (r.error) return { r, status: 'error' as const, msg: r.error }
      const dup = participants.find((x) => x.groupId === groupId && x.disciplineId === r.data.disciplineId && x.upaoId === r.data.upaoId)
      if (dup) return { r, status: 'skip' as const, msg: 'Ya estaba inscrito.' }
      const err = validateParticipant(acc, { ...r.data, email: r.data.email.toLowerCase() })
      if (err) return { r, status: 'error' as const, msg: err }
      acc.push({ ...r.data, id: `tmp${r.sheetRow}`, status: 'pendiente' })
      return { r, status: 'ok' as const, msg: 'Listo para inscribir' }
    })
  })()
  const ready = checked.filter((x) => x.status === 'ok')

  const send = async () => {
    setProgress(0)
    const out = await addParticipants(
      ready.map((x) => x.r.data),
      (n) => setProgress(n),
    )
    setProgress(null)
    setSent(out)
  }

  return (
    <div className="card form excel">
      <h2>📄 Subir Excel de inscripción</h2>
      <p className="excel-note">
        Sube el Excel <b>SOLO DE TU CICLO ({g.name})</b>, en el formato que se les dio: una sección por deporte (Fútbol, Básquet, Vóley, Gincana…) con las columnas N° de polo,
        Nombre completo (Apellidos, Nombres), ID, DNI y Correo institucional.
      </p>
      <label className="file">
        <input key={inputKey} id="excel-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {readErr && <p className="error">{readErr}</p>}

      {res && (
        <>
          <p className="small muted">
            {fileName} · {res.rows.length} filas leídas{res.groupText ? ` · dice «${res.groupText}»` : ''}
          </p>
          {wrongCycle ? (
            <p className="error">
              Este Excel es del {group(res.groupId)?.name}. Solo puedes subir el Excel de tu ciclo ({g.name}).
            </p>
          ) : (
            <>
              {res.warnings.map((w) => (
                <p key={w} className="small hint">
                  ⚠️ {w}
                </p>
              ))}
              {!sent && (
                <>
                  <div className="tbl-wrap">
                    <table className="tbl small-tbl">
                      <thead>
                        <tr>
                          <th>Fila</th>
                          <th>Deporte</th>
                          <th>N.°</th>
                          <th>Nombre</th>
                          <th>Revisión</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checked.map(({ r, status, msg }) => (
                          <tr key={r.sheetRow} className={`st-row ${status}`}>
                            <td>{r.sheetRow}</td>
                            <td>
                              {discipline(r.data.disciplineId)?.name}
                              {r.data.teamId !== groupId ? ` ${teamLabel(r.data.teamId)}` : ''}
                            </td>
                            <td>{discipline(r.data.disciplineId)?.roster?.jersey ? r.data.jersey ?? '—' : ''}</td>
                            <td>{r.data.name || '—'}</td>
                            <td>{status === 'ok' ? '✅ ' : status === 'skip' ? '↩️ ' : '❌ '}{msg}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="small">
                    <b>{ready.length}</b> listos · {checked.filter((x) => x.status === 'error').length} con errores · {checked.filter((x) => x.status === 'skip').length} ya inscritos.
                    {checked.some((x) => x.status === 'error') && ' Corrige las filas con ❌ en tu Excel y vuelve a subirlo: las que ya se inscribieron se saltan solas.'}
                  </p>
                  <button className="btn primary" disabled={!ready.length || progress != null} onClick={send}>
                    {progress != null ? `Inscribiendo… ${progress}/${ready.length}` : `Inscribir ${ready.length} jugador${ready.length === 1 ? '' : 'es'}`}
                  </button>
                </>
              )}
              {sent && (
                <div>
                  <p className="success">
                    Se inscribieron {sent.filter((x) => !x).length} de {sent.length}. Quedan pendientes de confirmación por la comisión.
                  </p>
                  {sent.some(Boolean) && (
                    <ul className="small">
                      {sent.map((e, i) => e && <li key={i} className="error">Fila {ready[i].r.sheetRow} ({ready[i].r.data.name}): {e}</li>)}
                    </ul>
                  )}
                  <button className="btn ghost" onClick={() => (setRes(null), setSent(null), setInputKey((k) => k + 1))}>
                    Subir otro Excel
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
