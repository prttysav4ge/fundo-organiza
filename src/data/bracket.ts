import { DISCIPLINES, GROUPS, R1, R2 } from './seed'
import type { Activity, Side } from './types'

// Resuelve las llaves: quién avanza, quién recibe el pase directo a la final
// (según las bases) y la tabla de la gincana.

export const GINCANA_POINTS = [5, 3, 2, 1]
/** Equipos que ya saltaron la 1.ª ronda y no pueden recibir el pase directo. */
const NO_DIRECT: Record<string, string> = { voley: 'c1', basquet: 'c7' }

export const teamGroup = (team: string) => team.split('.')[0]
export const teamName = (team: string) => {
  const g = GROUPS.find((x) => x.id === teamGroup(team))
  return team.includes('.') ? `${g?.name} · ${team.slice(1)}` : (g?.name ?? team)
}

export interface SideView {
  team: string | null
  label: string
}
export interface GRow {
  group: string
  points: number
  firsts: number
}
export interface DirectInfo {
  /** Pase directo confirmado (lo confirma el árbitro / la comisión). */
  team: string | null
  /** Pronóstico según los criterios de las bases (no es oficial). */
  forecast: string | null
  candidates: string[]
  reason: string
}
export interface Bracket {
  sides: Record<string, [SideView, SideView]>
  winner: Record<string, string | null>
  direct: Record<string, DirectInfo>
  gincana: GRow[]
  gincanaDone: boolean
}

export function gincanaTable(acts: Activity[]): GRow[] {
  const rows: Record<string, GRow> = {}
  acts
    .filter((a) => a.disciplineId === 'gincana' && a.status === 'finalizado')
    .forEach((a) =>
      (a.places ?? []).forEach((gid, i) => {
        if (!gid) return
        const r = (rows[gid] ??= { group: gid, points: 0, firsts: 0 })
        r.points += GINCANA_POINTS[i] ?? 0
        if (i === 0) r.firsts++
      }),
    )
  return Object.values(rows).sort((a, b) => b.points - a.points || b.firsts - a.firsts)
}

export function computeBracket(acts: Activity[], overrides: Record<string, string>): Bracket {
  const byId: Record<string, Activity> = Object.fromEntries(acts.map((a) => [a.id, a]))
  const gincana = gincanaTable(acts)
  const games = acts.filter((a) => a.disciplineId === 'gincana')
  const gincanaDone = games.length > 0 && games.every((a) => a.status === 'finalizado' || a.status === 'cancelado')

  const wMemo: Record<string, string | null> = {}
  const sMemo: Record<string, [string | null, string | null]> = {}
  const dMemo: Record<string, DirectInfo & { semi: [string | null, string | null] }> = {}

  const sideTeam = (s: Side): string | null => {
    if ('team' in s) return s.team
    if ('winner' in s) return winner(s.winner)
    if ('slot' in s) {
      const d = direct(s.of)
      return s.slot === 'direct' ? d.team : d.semi[s.slot === 'semiA' ? 0 : 1]
    }
    return null
  }
  const sides = (id: string) => (sMemo[id] ??= byId[id].sides!.map(sideTeam) as [string | null, string | null])

  function winner(id: string): string | null {
    if (id in wMemo) return wMemo[id]
    const a = byId[id]
    const [x, y] = sides(id)
    let res: string | null = null
    if (x === 'none' || y === 'none') res = x === 'none' ? y : x
    else if (a.status === 'finalizado' && x && y) {
      const explicit = a.winner && [x, y, 'none'].includes(a.winner) ? a.winner : null
      if (a.wo) res = explicit
      else if (a.score) res = a.score[0] > a.score[1] ? x : a.score[1] > a.score[0] ? y : explicit
    }
    return (wMemo[id] = res)
  }

  /** Estadística de un equipo en 1.ª y 2.ª ronda (los W.O. no suman). */
  const stat = (d: string, team: string, onlyR2: boolean) => {
    let diff = 0
    let lost = 0
    acts
      .filter((a) => a.disciplineId === d && (a.stage === R2 || (!onlyR2 && a.stage === R1)) && a.status === 'finalizado' && !a.wo && a.score)
      .forEach((a) => {
        const i = sides(a.id).indexOf(team)
        if (i < 0) return
        diff += a.score![i] - a.score![1 - i]
        lost += a.score![1 - i]
      })
    return { diff, lost }
  }

  function direct(d: string) {
    if (dMemo[d]) return dMemo[d]
    // Mismo orden que el servidor: partidos de 2.ª ronda ordenados por id.
    const r2 = acts.filter((a) => a.disciplineId === d && a.stage === R2).sort((a, b) => a.id.localeCompare(b.id))
    const ws = r2.map((a) => winner(a.id))
    const none = (reason: string) => (dMemo[d] = { team: null, forecast: null, candidates: [], semi: [null, null], reason })
    if (ws.some((x) => x === null)) return none('Se define al terminar la 2.ª ronda.')
    const teams = ws.filter((x) => x !== 'none') as string[]
    if (teams.length < 3) {
      // Con dobles W.O. no hay tres ganadores: los que quedan avanzan sin semifinal.
      return (dMemo[d] = {
        team: teams[0] ?? 'none',
        forecast: null,
        candidates: teams,
        semi: [teams[1] ?? 'none', 'none'],
        reason: 'Menos de tres ganadores en 2.ª ronda: no se juega semifinal.',
      })
    }
    // Pronóstico según las bases.
    const elig = teams.filter((x) => x !== NO_DIRECT[d])
    const metric = (x: string) => (d === 'futbol' ? stat(d, x, true).diff : d === 'voley' ? -stat(d, x, false).lost : stat(d, x, false).diff)
    const best = Math.max(...elig.map(metric))
    let tied = elig.filter((x) => metric(x) === best)
    let reason = d === 'futbol' ? 'mayor diferencia de goles en 2.ª ronda' : d === 'voley' ? 'menos sets perdidos en el torneo' : 'mayor diferencia de puntos en el torneo'
    if (tied.length > 1 && gincanaDone) {
      const key = (x: string) => {
        const r = gincana.find((g) => g.group === teamGroup(x))
        return r ? r.points * 100 + r.firsts : -1
      }
      const top = Math.max(...tied.map(key))
      tied = tied.filter((x) => key(x) === top)
      reason = 'empate resuelto con la tabla de la gincana'
    }
    const forecast = tied.length === 1 ? tied[0] : null
    if (!forecast) reason = gincanaDone ? 'hay empate entre varios equipos' : 'hay empate; se desempata con la tabla final de la gincana'
    const team = overrides[d] && teams.includes(overrides[d]) ? overrides[d] : null
    const rest = teams.filter((x) => x !== team)
    return (dMemo[d] = { team, forecast, candidates: teams, semi: team ? [rest[0], rest[1]] : [null, null], reason })
  }

  const out: Bracket = { sides: {}, winner: {}, direct: {}, gincana, gincanaDone }
  const label = (s: Side, team: string | null) => {
    if (team === 'none') return 'Sin rival'
    if (team) return teamName(team)
    if ('winner' in s) return `Ganador ${byId[s.winner].code}`
    if ('slot' in s) return s.slot === 'direct' ? 'Pase directo (por confirmar)' : 'Ganador de 2.ª ronda'
    return 'label' in s ? s.label : ''
  }
  acts.forEach((a) => {
    if (!a.sides) return
    const ts = sides(a.id)
    out.sides[a.id] = a.sides.map((s, i) => ({ team: ts[i] === 'none' ? null : ts[i], label: label(s, ts[i]) })) as [SideView, SideView]
    const wn = winner(a.id)
    out.winner[a.id] = wn === 'none' ? null : wn
  })
  DISCIPLINES.filter((d) => d.format === 'duelo').forEach((d) => {
    const { team, forecast, candidates, reason } = direct(d.id)
    out.direct[d.id] = { team: team === 'none' ? null : team, forecast, candidates, reason }
  })
  return out
}
