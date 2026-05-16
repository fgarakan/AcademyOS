// Attendance Exception Parser
// Parses free-text coach attendance phrases into structured drafts.
// No DB calls. No mutations. Deterministic pattern matching only.

// ── Output types ──────────────────────────────────────────────────────────────

export interface AbsenceDraft {
  playerName: string
  source: 'exception_parser'
  confidence: 'high' | 'medium' | 'low'
  rawPhrase: string
  directorReviewRequired: true
  officialWriteApplied: false
}

export interface UnrosteredAttendeeDraft {
  playerName: string
  source: 'exception_parser'
  confidence: 'high' | 'medium' | 'low'
  rawPhrase: string
  directorReviewRequired: true
  officialWriteApplied: false
}

export interface AttendanceExceptionParseResult {
  inputText: string
  everyonePresent: boolean
  absences: AbsenceDraft[]
  unrosterred: UnrosteredAttendeeDraft[]
  unsureFlag: boolean
  parsedAt: string
  warnings: string[]
  directorReviewRequired: true
}

// ── Pattern definitions ───────────────────────────────────────────────────────

// Patterns that indicate everyone was present
const EVERYONE_PRESENT_PATTERNS = [
  /\beveryone\s+(was\s+)?(here|present|there|in|attended)\b/i,
  /\ball\s+(players?\s+)?(were\s+)?(here|present|there|in|attended)\b/i,
  /\bfull\s+(attendance|group|roster)\b/i,
  /\bno\s+(absences?|one\s+missing|issues?)\b/i,
  /\bperfect\s+attendance\b/i,
]

// Patterns that indicate exceptions after "everyone was here"
const EXCEPTION_PREFIXES = [
  /except\b/i,
  /aside\s+from\b/i,
  /besides?\b/i,
  /apart\s+from\b/i,
  /other\s+than\b/i,
  /but\s+not\b/i,
  /minus\b/i,
]

// Patterns that indicate absence
const ABSENCE_PATTERNS = [
  /(\b[A-Z][a-z]{1,19}\b)\s+(was|is|were)\s+(absent|not\s+there|not\s+here|missing|sick|away|out)/gi,
  /(\b[A-Z][a-z]{1,19}\b)\s+(didn['']?t|did\s+not)\s+(show|come|make\s+it|attend)/gi,
  /\b(absent|missing|didn['']?t\s+show(?:\s+up)?|not\s+here|not\s+there)\b[:\s]+(\b[A-Z][a-z]{1,19}\b)/gi,
  /\b(absent|missing)\b[:\s]+(\b[A-Z][a-z]{1,19}\b)/gi,
]

// Patterns that indicate an unrostered player showed up
const UNROSTERED_PATTERNS = [
  /(\b[A-Z][a-z]{1,19}\b)\s+(showed?\s+up|turned\s+up|just\s+appeared?|came\s+in|joined?|attended?\s+unexpectedly)/gi,
  /\b(new|unrostered|unexpected|extra|unknown|random)\s+player\b[:\s]+(\b[A-Z][a-z]{1,19}\b)/gi,
  /\b(\b[A-Z][a-z]{1,19}\b)\s+(was|is)\s+(not\s+on\s+the\s+roster|unrostered|not\s+registered)/gi,
  /\b(someone|a\s+player|a\s+kid|a\s+new\s+player)\s+(I\s+)?don['']?t\s+(know|recognize)\b/gi,
]

// Names to exclude from parsing (common words that look like names)
const EXCLUDED_WORDS = new Set([
  'the', 'and', 'but', 'not', 'was', 'were', 'all', 'everyone', 'someone',
  'this', 'that', 'they', 'them', 'from', 'with', 'here', 'there', 'just',
  'also', 'very', 'really', 'today', 'great', 'good', 'bad', 'fine',
  'yes', 'no', 'okay', 'fine', 'well', 'sure', 'miss', 'max', 'had',
  'one', 'two', 'three', 'four', 'five', 'some', 'new', 'our', 'their',
  'full', 'late', 'last', 'next', 'back', 'more', 'less', 'most', 'any',
  'came', 'went', 'made', 'done', 'come', 'show', 'left', 'even',
])

// ── Name extraction helpers ───────────────────────────────────────────────────

function extractNamesFromExceptionClause(clause: string): string[] {
  const names: string[] = []
  // Match capitalized words (likely names)
  const capitalizedWords = clause.match(/\b[A-Z][a-z]{1,19}\b/g) ?? []
  for (const word of capitalizedWords) {
    if (!EXCLUDED_WORDS.has(word.toLowerCase())) {
      names.push(word)
    }
  }
  return Array.from(new Set(names))
}

function extractNamesFromPattern(text: string, patterns: RegExp[]): { name: string; rawPhrase: string; confidence: 'high' | 'medium' | 'low' }[] {
  const results: { name: string; rawPhrase: string; confidence: 'high' | 'medium' | 'low' }[] = []

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      // The name is in capture group 1 or 2 depending on pattern shape
      const candidateGroup1 = match[1]
      const candidateGroup2 = match[2]
      const name = (candidateGroup1 && !EXCLUDED_WORDS.has(candidateGroup1.toLowerCase()))
        ? candidateGroup1
        : (candidateGroup2 && !EXCLUDED_WORDS.has(candidateGroup2.toLowerCase()))
          ? candidateGroup2
          : null

      if (name && name.length > 1) {
        results.push({
          name,
          rawPhrase: match[0].trim(),
          confidence: 'high',
        })
      }
    }
  }

  return results
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseAttendanceExceptions(inputText: string): AttendanceExceptionParseResult {
  const warnings: string[] = []
  const absenceDrafts: AbsenceDraft[] = []
  const unrosteredDrafts: UnrosteredAttendeeDraft[] = []
  const seenAbsenceNames = new Set<string>()
  const seenUnrosteredNames = new Set<string>()

  const normalized = inputText.trim()

  if (!normalized) {
    return {
      inputText,
      everyonePresent: false,
      absences: [],
      unrosterred: [],
      unsureFlag: false,
      parsedAt: new Date().toISOString(),
      warnings: ['Empty input — no attendance data to parse.'],
      directorReviewRequired: true,
    }
  }

  // Check unsure
  const unsureFlag =
    /\bunsure\b|\bnot\s+sure\b|\bdon['']?t\s+know\b|\bcan['']?t\s+remember\b/i.test(normalized)

  // Check everyone present (base)
  let everyonePresent = EVERYONE_PRESENT_PATTERNS.some(p => p.test(normalized))

  // Check for "everyone was here except [names]"
  const exceptionMatch = EXCEPTION_PREFIXES.reduce<string | null>((found, prefix) => {
    if (found) return found
    const idx = normalized.search(prefix)
    if (idx >= 0 && everyonePresent) {
      return normalized.slice(idx)
    }
    return null
  }, null)

  if (exceptionMatch) {
    // Everyone was present except some players — those are absences
    everyonePresent = false
    const exceptionNames = extractNamesFromExceptionClause(exceptionMatch)
    for (const name of exceptionNames) {
      if (!seenAbsenceNames.has(name.toLowerCase())) {
        seenAbsenceNames.add(name.toLowerCase())
        absenceDrafts.push({
          playerName: name,
          source: 'exception_parser',
          confidence: 'high',
          rawPhrase: exceptionMatch.trim(),
          directorReviewRequired: true,
          officialWriteApplied: false,
        })
      }
    }
  }

  // Explicit absence patterns
  const explicitAbsences = extractNamesFromPattern(normalized, ABSENCE_PATTERNS)
  for (const { name, rawPhrase, confidence } of explicitAbsences) {
    if (!seenAbsenceNames.has(name.toLowerCase())) {
      seenAbsenceNames.add(name.toLowerCase())
      absenceDrafts.push({
        playerName: name,
        source: 'exception_parser',
        confidence,
        rawPhrase,
        directorReviewRequired: true,
        officialWriteApplied: false,
      })
    }
  }

  // Explicit unrostered patterns
  const explicitUnrostered = extractNamesFromPattern(normalized, UNROSTERED_PATTERNS)
  for (const { name, rawPhrase, confidence } of explicitUnrostered) {
    if (!seenUnrosteredNames.has(name.toLowerCase()) && !seenAbsenceNames.has(name.toLowerCase())) {
      seenUnrosteredNames.add(name.toLowerCase())
      unrosteredDrafts.push({
        playerName: name,
        source: 'exception_parser',
        confidence,
        rawPhrase,
        directorReviewRequired: true,
        officialWriteApplied: false,
      })
    }
  }

  // Warn if nothing was parsed from a non-empty, non-everyone input
  if (!everyonePresent && absenceDrafts.length === 0 && unrosteredDrafts.length === 0 && !unsureFlag) {
    warnings.push(
      'Could not detect specific names or attendance states. Please review manually.',
    )
  }

  // Warn on low-confidence names (single-character, very short)
  const shortNames = [
    ...absenceDrafts.filter(a => a.playerName.length <= 2),
    ...unrosteredDrafts.filter(u => u.playerName.length <= 2),
  ]
  if (shortNames.length > 0) {
    warnings.push(
      `Short names detected (${shortNames.map(s => s.playerName).join(', ')}) — may be initials. Confirm identity before submitting.`,
    )
  }

  return {
    inputText,
    everyonePresent,
    absences: absenceDrafts,
    unrosterred: unrosteredDrafts,
    unsureFlag,
    parsedAt: new Date().toISOString(),
    warnings,
    directorReviewRequired: true,
  }
}

// ── Summary helper ────────────────────────────────────────────────────────────

export function summarizeAttendanceParseResult(result: AttendanceExceptionParseResult): string {
  if (result.everyonePresent) return 'Full attendance — everyone present.'
  if (result.unsureFlag) return 'Coach unsure of attendance — manual review needed.'

  const parts: string[] = []
  if (result.absences.length > 0) {
    parts.push(`${result.absences.length} absence(s): ${result.absences.map(a => a.playerName).join(', ')}`)
  }
  if (result.unrosterred.length > 0) {
    parts.push(`${result.unrosterred.length} unexpected: ${result.unrosterred.map(u => u.playerName).join(', ')}`)
  }
  if (parts.length === 0) return 'Attendance notes recorded — no specific exceptions detected.'
  return parts.join(' · ') + ' (director review required)'
}
