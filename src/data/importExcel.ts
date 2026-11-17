import { GROUPS } from './seed'
import type { NewParticipant } from './store'

// Lee el Excel de inscripción que se entregó a los delegados: una hoja con el
// ciclo en la primera fila ("10° CICLO") y una sección por deporte
// ("FÚTBOL ⚽", "BÁSQUET 🏀", …) seguida de su fila de encabezados
// (N° de polo | Nombre completo | ID | DNI | Correo institucional).

export interface ImportRow {
  sheetRow: number
  section: string
  data: NewParticipant
  /** Error de lectura (faltan datos); las reglas se revisan después. */
  error?: string
}

export interface ImportResult {
  /** Ciclo que dice el Excel, si se pudo leer. */
  groupId: string | null
  groupText: string
  rows: ImportRow[]
  warnings: string[]
}

const norm = (v: unknown) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim()

/** Disciplina según el título de la sección. */
function sectionDiscipline(text: string): string | null {
  const t = norm(text)
  if (t.length > 40) return null
  const women = /DAMAS|MUJERES|FEMENINO/.test(t)
  if (/FUTBOL/.test(t)) return women ? 'futbol_damas' : 'futbol'
  if (/BASQUET|BASKET|BALONCESTO/.test(t)) return women ? 'basquet_damas' : 'basquet'
  if (/VOLEY|VOLEI|VOLLEY/.test(t)) return 'voley'
  if (/GINCANA|GYMKHANA|YINCANA/.test(t)) return 'gincana'
  if (/AJEDREZ/.test(t)) return 'ajedrez'
  return null
}

/** Ciclo según un texto como "10° CICLO", "X ciclo" o "Egresados". */
function groupFrom(text: string): string | null {
  const t = norm(text)
  if (/EGRESAD/.test(t)) return 'ce'
  if (!/CICLO/.test(t)) return null
  const n = /(\d{1,2})/.exec(t)
  if (n && +n[1] >= 1 && +n[1] <= 10) return `c${+n[1]}`
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  const r = /\b(X|IX|VIII|VII|VI|V|IV|III|II|I)\b/.exec(t)
  return r ? `c${roman.indexOf(r[1]) + 1}` : null
}

/** Excel guarda a veces el ID o el DNI como número y se pierden los ceros de adelante. */
function digits(v: unknown, kind: 'id' | 'dni'): string {
  if (v == null || v === '') return ''
  const s = typeof v === 'number' ? String(Math.round(v)) : String(v).replace(/\s+/g, '')
  if (!/^\d+$/.test(s)) return s
  if (kind === 'dni') return s.length < 8 ? s.padStart(8, '0') : s
  if (s.length <= 6) return s.padStart(6, '0')
  return s.length < 9 ? s.padStart(9, '0') : s
}

export async function readRegistrationExcel(file: File, myGroup: string): Promise<ImportResult> {
  const { default: readXlsxFile } = await import('read-excel-file')
  const rows = (await readXlsxFile(file)) as unknown[][]
  const cell = (r: number, c: number) => rows[r]?.[c]
  const text = (r: number, c: number) => String(cell(r, c) ?? '').trim()
  const empty = (r: number) => !rows[r] || rows[r].slice(0, 6).every((v) => v == null || String(v).trim() === '')

  const out: ImportResult = { groupId: null, groupText: '', rows: [], warnings: [] }
  for (let r = 0; r < Math.min(rows.length, 5) && !out.groupId; r++)
    for (let c = 0; c < 6; c++) {
      const g = groupFrom(text(r, c))
      if (g) {
        out.groupId = g
        out.groupText = text(r, c)
        break
      }
    }

  let footballSections = 0
  for (let r = 0; r < rows.length; r++) {
    const title = text(r, 0)
    const disc = sectionDiscipline(title)
    if (!disc) continue
    // Fila de encabezados: la primera con "nombre" en las 3 filas siguientes.
    let h = -1
    for (let k = r + 1; k <= r + 3 && k < rows.length; k++) if ((rows[k] ?? []).some((v) => /NOMBRE/.test(norm(v)))) h = k
    if (h < 0) {
      out.warnings.push(`No encontré los encabezados de la sección «${title}» (fila ${r + 1}).`)
      continue
    }
    const header = (rows[h] ?? []).map(norm)
    const col = (re: RegExp) => header.findIndex((x) => re.test(x))
    const cPolo = col(/POLO|DORSAL|NUMERO/)
    const cName = col(/NOMBRE/)
    const cId = header.findIndex((x) => /^ID\b|ID UPAO|CODIGO/.test(x))
    const cDni = col(/DNI/)
    const cMail = col(/CORREO|EMAIL|E-MAIL/)

    let team = myGroup
    if (disc === 'futbol' && myGroup === 'c1') {
      const t = norm(title)
      team = /\bB\b|1\.2/.test(t) ? 'c1.2' : /\bA\b|1\.1/.test(t) ? 'c1.1' : footballSections === 0 ? 'c1.1' : 'c1.2'
      footballSections++
    }

    for (let k = h + 1; k < rows.length; k++) {
      if (sectionDiscipline(text(k, 0))) break
      if (empty(k)) {
        // Una fila vacía cierra la sección si la siguiente también lo está.
        if (empty(k + 1)) break
        continue
      }
      const name = cName >= 0 ? text(k, cName).replace(/\s+/g, ' ') : ''
      const upaoId = cId >= 0 ? digits(cell(k, cId), 'id') : ''
      const dni = cDni >= 0 ? digits(cell(k, cDni), 'dni') : ''
      const email = cMail >= 0 ? text(k, cMail).toLowerCase() : ''
      const poloRaw = cPolo >= 0 ? cell(k, cPolo) : null
      const jersey = poloRaw != null && String(poloRaw).trim() !== '' ? Number(poloRaw) : undefined
      if (!name && !upaoId && !dni && !email) continue
      const missing = [!name && 'nombre', !upaoId && 'ID', !dni && 'DNI', !email && 'correo'].filter(Boolean)
      out.rows.push({
        sheetRow: k + 1,
        section: title,
        data: { groupId: myGroup, teamId: team, disciplineId: disc, name, upaoId, dni, email, jersey },
        error: missing.length ? `Faltan datos: ${missing.join(', ')}.` : undefined,
      })
    }
  }
  if (!out.rows.length) out.warnings.push('No encontré jugadores. Revisa que el Excel tenga el formato que se entregó a los delegados.')
  return out
}

export const groupName = (id: string | null) => GROUPS.find((g) => g.id === id)?.name ?? '—'
