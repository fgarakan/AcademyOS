// Player Import Parser — Sprint 103
// Pure TypeScript. No database queries. No mutations.

export const IMPORT_COLUMNS = [
  'first_name', 'last_name', 'birth_year', 'ball_level',
  'current_group', 'primary_coach', 'curriculum_level',
  'strength_1', 'strength_2', 'strength_3',
  'need_1', 'need_2', 'need_3',
  'current_priority', 'coach_notes', 'status',
] as const

export type ImportColumn = typeof IMPORT_COLUMNS[number]

export const VALID_BALL_LEVELS = ['red', 'orange', 'green', 'yellow'] as const
export type BallLevel = typeof VALID_BALL_LEVELS[number]

export const VALID_STATUSES = ['active', 'on_hold'] as const

export interface RawImportRow {
  rowIndex: number
  raw: Record<string, string>
}

export interface NormalizedImportRow {
  rowIndex: number
  firstName: string
  lastName: string
  fullName: string
  birthYear: number | null
  ballLevel: BallLevel | null
  currentGroup: string | null
  primaryCoach: string | null
  curriculumLevel: string | null
  strengths: string[]
  needs: string[]
  developmentFocus: string | null
  currentPriority: string | null
  coachNotes: string | null
  status: 'active' | 'on_hold'
}

export interface ImportRowError {
  rowIndex: number
  field: string
  message: string
}

export interface ImportRowWarning {
  rowIndex: number
  field: string
  message: string
}

export interface ParseResult {
  normalizedRows: NormalizedImportRow[]
  errors: ImportRowError[]
  warnings: ImportRowWarning[]
  duplicateCandidates: Array<{ fullName: string; rowIndexes: number[] }>
  counts: {
    totalRows: number
    validRows: number
    errorRows: number
    warningRows: number
  }
}

// ─── CSV parsing ─────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    const next = line[i + 1]

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export function parsePlayerImportCsv(csvText: string): { rawRows: RawImportRow[]; headerError: string | null } {
  const lines = csvText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)

  if (lines.length === 0) {
    return { rawRows: [], headerError: 'CSV is empty.' }
  }

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim())

  const missingRequired = (['first_name', 'last_name'] as const).filter(h => !headers.includes(h))
  if (missingRequired.length > 0) {
    return {
      rawRows: [],
      headerError: `CSV is missing required header column(s): ${missingRequired.join(', ')}. First row must be a header row.`,
    }
  }

  const rawRows: RawImportRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const raw: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      raw[headers[j]] = values[j] ?? ''
    }
    rawRows.push({ rowIndex: i, raw })
  }

  return { rawRows, headerError: null }
}

// ─── Normalization ────────────────────────────────────────────────────────────

function col(raw: Record<string, string>, key: string): string {
  return (raw[key] ?? '').trim()
}

export function normalizePlayerImportRow(row: RawImportRow): {
  normalized: NormalizedImportRow | null
  errors: ImportRowError[]
  warnings: ImportRowWarning[]
} {
  const errors: ImportRowError[] = []
  const warnings: ImportRowWarning[] = []
  const { rowIndex, raw } = row

  const firstName = col(raw, 'first_name')
  const lastName = col(raw, 'last_name')

  if (!firstName) errors.push({ rowIndex, field: 'first_name', message: 'first_name is required.' })
  if (!lastName) errors.push({ rowIndex, field: 'last_name', message: 'last_name is required.' })

  if (errors.length > 0) return { normalized: null, errors, warnings }

  const fullName = `${firstName} ${lastName}`

  // birth_year
  let birthYear: number | null = null
  const rawBirthYear = col(raw, 'birth_year')
  if (rawBirthYear) {
    const parsed = parseInt(rawBirthYear, 10)
    if (isNaN(parsed) || rawBirthYear.length !== 4 || parsed < 1950 || parsed > new Date().getFullYear()) {
      errors.push({ rowIndex, field: 'birth_year', message: `Invalid birth_year "${rawBirthYear}". Must be a 4-digit year.` })
    } else {
      birthYear = parsed
    }
  } else {
    warnings.push({ rowIndex, field: 'birth_year', message: `birth_year is blank. Date of birth will be recorded as unknown (1900-01-01).` })
  }

  // ball_level
  let ballLevel: BallLevel | null = null
  const rawBallLevel = col(raw, 'ball_level').toLowerCase()
  if (rawBallLevel) {
    if (VALID_BALL_LEVELS.includes(rawBallLevel as BallLevel)) {
      ballLevel = rawBallLevel as BallLevel
    } else {
      warnings.push({ rowIndex, field: 'ball_level', message: `Unrecognised ball_level "${col(raw, 'ball_level')}". Expected: red, orange, green, yellow. Value will be ignored.` })
    }
  }

  // status
  const rawStatus = col(raw, 'status').toLowerCase()
  let status: 'active' | 'on_hold' = 'active'
  if (rawStatus && !VALID_STATUSES.includes(rawStatus as typeof VALID_STATUSES[number])) {
    warnings.push({ rowIndex, field: 'status', message: `Unrecognised status "${col(raw, 'status')}". Defaulting to "active".` })
  } else if (rawStatus === 'on_hold') {
    status = 'on_hold'
  }

  // strengths
  const strengths = [col(raw, 'strength_1'), col(raw, 'strength_2'), col(raw, 'strength_3')]
    .filter(s => s.length > 0)
    .slice(0, 3)

  // needs
  const needs = [col(raw, 'need_1'), col(raw, 'need_2'), col(raw, 'need_3')]
    .filter(s => s.length > 0)
    .slice(0, 3)

  const developmentFocus = needs.length > 0 ? needs[0] : null

  // current_priority
  let currentPriority = col(raw, 'current_priority')
  if (currentPriority.length > 200) {
    warnings.push({ rowIndex, field: 'current_priority', message: `current_priority is longer than 200 characters and will be truncated.` })
    currentPriority = currentPriority.slice(0, 200)
  }

  // coach_notes
  let coachNotes = col(raw, 'coach_notes')
  if (coachNotes.length > 500) {
    warnings.push({ rowIndex, field: 'coach_notes', message: `coach_notes is longer than 500 characters and will be truncated.` })
    coachNotes = coachNotes.slice(0, 500)
  }

  const normalized: NormalizedImportRow = {
    rowIndex,
    firstName,
    lastName,
    fullName,
    birthYear,
    ballLevel,
    currentGroup: col(raw, 'current_group') || null,
    primaryCoach: col(raw, 'primary_coach') || null,
    curriculumLevel: col(raw, 'curriculum_level') || null,
    strengths,
    needs,
    developmentFocus,
    currentPriority: currentPriority || null,
    coachNotes: coachNotes || null,
    status,
  }

  return { normalized, errors, warnings }
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validatePlayerImportRows(rawRows: RawImportRow[]): ParseResult {
  const normalizedRows: NormalizedImportRow[] = []
  const allErrors: ImportRowError[] = []
  const allWarnings: ImportRowWarning[] = []
  const rowsWithErrors = new Set<number>()
  const rowsWithWarnings = new Set<number>()

  for (const row of rawRows) {
    const { normalized, errors, warnings } = normalizePlayerImportRow(row)
    if (errors.length > 0) {
      allErrors.push(...errors)
      rowsWithErrors.add(row.rowIndex)
    }
    if (warnings.length > 0) {
      allWarnings.push(...warnings)
      rowsWithWarnings.add(row.rowIndex)
    }
    if (normalized) normalizedRows.push(normalized)
  }

  // Detect duplicates within the upload
  const nameCounts = new Map<string, number[]>()
  for (const row of normalizedRows) {
    const key = row.fullName.toLowerCase()
    const existing = nameCounts.get(key) ?? []
    existing.push(row.rowIndex)
    nameCounts.set(key, existing)
  }

  const duplicateCandidates: ParseResult['duplicateCandidates'] = []
  for (const [name, indexes] of Array.from(nameCounts.entries())) {
    if (indexes.length > 1) {
      duplicateCandidates.push({
        fullName: name,
        rowIndexes: indexes,
      })
      for (const idx of indexes) {
        allWarnings.push({
          rowIndex: idx,
          field: 'name',
          message: `Duplicate name "${name}" appears ${indexes.length} times in this upload. Only the first row will be imported; the rest will be skipped.`,
        })
        rowsWithWarnings.add(idx)
      }
    }
  }

  // Deduplicate normalized rows (keep first occurrence only)
  const seenNames = new Set<string>()
  const deduplicatedRows = normalizedRows.filter(row => {
    const key = row.fullName.toLowerCase()
    if (seenNames.has(key)) return false
    seenNames.add(key)
    return true
  })

  return {
    normalizedRows: deduplicatedRows,
    errors: allErrors,
    warnings: allWarnings,
    duplicateCandidates,
    counts: {
      totalRows: rawRows.length,
      validRows: deduplicatedRows.length,
      errorRows: rowsWithErrors.size,
      warningRows: rowsWithWarnings.size,
    },
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function runPlayerImportParsing(csvText: string): ParseResult & { headerError: string | null } {
  const { rawRows, headerError } = parsePlayerImportCsv(csvText)

  if (headerError) {
    return {
      normalizedRows: [],
      errors: [],
      warnings: [],
      duplicateCandidates: [],
      counts: { totalRows: 0, validRows: 0, errorRows: 0, warningRows: 0 },
      headerError,
    }
  }

  if (rawRows.length === 0) {
    return {
      normalizedRows: [],
      errors: [],
      warnings: [{ rowIndex: 0, field: 'csv', message: 'CSV has headers but no data rows.' }],
      duplicateCandidates: [],
      counts: { totalRows: 0, validRows: 0, errorRows: 0, warningRows: 0 },
      headerError: null,
    }
  }

  return { ...validatePlayerImportRows(rawRows), headerError: null }
}
