// parseAttendanceExceptionText
// Sprint 835 — Attendance Exception Parsing Fix V1
//
// Pure deterministic parser for coach attendance exception text.
// No DB calls. No mutations. No external API.
// Extracts absent names and unexpected attendee names from free-text input.
//
// Output shape:
//   rawText         — original input, trimmed
//   absentNames     — names parsed as absent (needs roster match before writing)
//   unexpectedNames — names parsed as unrostered arrivals
//   confidence      — overall parse confidence: high | medium | low
//   warnings        — safety notes + ambiguity flags for director review
//
// Safety invariants:
//   - Does not match names to player IDs (no roster access at this layer)
//   - Does not create or modify any DB record
//   - All output requires director review before any official change

// ── Output type ────────────────────────────────────────────────────────────────

export interface AttendanceExceptionTextParseResult {
  rawText: string
  absentNames: string[]
  unexpectedNames: string[]
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]
}

// ── Pattern constants ──────────────────────────────────────────────────────────

// Phrases indicating full attendance (no exceptions)
const EVERYONE_PRESENT_PHRASES = [
  'everyone was here', 'everyone was there', 'everyone came',
  'everyone is here', 'everyone showed up', 'everyone attended',
  'everybody was here', 'everybody was there', 'everybody came',
  'all were here', 'all came', 'all showed up', 'all attended',
  'whole group', 'full group', 'full attendance', 'perfect attendance',
  'no absences', 'no one missing', 'no one was missing',
]

// Exception trigger words — mark the boundary after which absent names appear
const EXCEPT_TRIGGERS = [
  'except', 'apart from', 'aside from', 'other than', 'but not', 'excluding', 'minus',
]

// Arrival patterns — indicate an unrostered/unexpected player showed up
// Format: /regex/g — capture group 1 is the name
const ARRIVAL_PATTERNS: RegExp[] = [
  // "Jeremy showed up" / "Jeremy turned up" / "Jeremy came in" / "Jeremy arrived"
  /\b([A-Z][a-z]{1,24})\s+(?:showed?\s+up|turned\s+up|came\s+in|just\s+appeared?|arrived|joined?\s+us?|came\s+along)\b/g,
  // "new player Jeremy" / "new kid Jeremy"
  /\bnew\s+(?:player|kid|student|member)\s+([A-Z][a-z]{1,24})\b/g,
  // "also Jeremy showed up" / "also Jeremy came"
  /\balso[,\s]+([A-Z][a-z]{1,24})\s+(?:showed|came|turned|arrived)\b/g,
  // "[Name] also came" / "[Name] also showed up"
  /\b([A-Z][a-z]{1,24})\s+also\s+(?:showed?\s+up|came|turned\s+up|arrived)\b/g,
]

// Explicit absence patterns — capture group 1 or 2 is the name
const ABSENCE_PATTERNS: RegExp[] = [
  // "Sarah was absent" / "Sarah is absent" / "Sarah was missing" / "Sarah was sick"
  /\b([A-Z][a-z]{1,24})\s+(?:was|is|were)\s+(?:absent|not\s+there|not\s+here|missing|sick|away|out)\b/g,
  // "Sarah missed" / "Sarah didn't come" / "Sarah didn't show" / "Sarah didn't make it"
  /\b([A-Z][a-z]{1,24})\s+(?:missed|didn['']?t\s+(?:show(?:\s+up)?|come|make\s+it|attend))\b/g,
  // "absent: Sarah" / "missing: Sarah"
  /\b(?:absent|missing)\b[:\s]+([A-Z][a-z]{1,24})\b/g,
]

// Words that look capitalised but are never player names
const NAME_STOP_WORDS = new Set([
  'the', 'and', 'but', 'not', 'was', 'were', 'all', 'everyone', 'everyone',
  'someone', 'nobody', 'this', 'that', 'they', 'them', 'from', 'with',
  'here', 'there', 'just', 'also', 'very', 'really', 'today', 'great',
  'good', 'bad', 'fine', 'yes', 'no', 'okay', 'well', 'sure', 'miss',
  'had', 'one', 'two', 'three', 'four', 'five', 'some', 'new', 'our',
  'their', 'full', 'late', 'last', 'next', 'back', 'more', 'less', 'most',
  'any', 'came', 'went', 'made', 'done', 'come', 'show', 'left', 'even',
  'after', 'before', 'during', 'then', 'when', 'where', 'what', 'who',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
])

// ── Helper functions ───────────────────────────────────────────────────────────

function isValidName(word: string): boolean {
  if (!word || word.length < 2) return false
  if (NAME_STOP_WORDS.has(word.toLowerCase())) return false
  // Must start with uppercase letter
  if (!/^[A-Z]/.test(word)) return false
  return true
}

function extractNamesFromExceptClause(text: string, afterTrigger: string): string[] {
  // Everything after the trigger up to a sentence boundary or a clause that signals
  // a new topic (e.g., ", and Jeremy showed up")
  // Split on ", and" or "; and" first to avoid capturing unrostered names as absences
  const sentenceEnd = afterTrigger.search(/[.!?\n]/)
  let clause = sentenceEnd >= 0 ? afterTrigger.slice(0, sentenceEnd) : afterTrigger

  // Remove sub-clauses about unexpected arrivals before extracting absent names
  // e.g. ", and Jeremy showed up" should not contribute to absentNames
  const arrivalBreak = clause.search(/,?\s+and\s+[A-Z][a-z]+\s+(?:showed?\s+up|turned\s+up|came\s+in|arrived|appeared)/i)
  if (arrivalBreak >= 0) {
    clause = clause.slice(0, arrivalBreak)
  }

  // Also strip after "and [Name] came" style endings
  const andArrivalBreak = clause.search(/\band\s+[A-Z][a-z]+\s+(?:showed?\s+up|turned\s+up|came\s+in|arrived|appeared)/i)
  if (andArrivalBreak >= 0) {
    clause = clause.slice(0, andArrivalBreak)
  }

  // Normalise "and" → comma for splitting
  const normalised = clause.replace(/\band\b/gi, ',')
  const parts = normalised.split(',').map(s => s.trim()).filter(s => s.length > 0)

  const names: string[] = []
  for (const part of parts) {
    // Take the first word of each part as the name candidate
    const firstWord = part.split(/\s+/)[0]
    if (firstWord && isValidName(firstWord)) {
      names.push(firstWord)
    }
  }
  return names
}

function extractNamesFromPatterns(text: string, patterns: RegExp[]): { name: string; rawPhrase: string }[] {
  const results: { name: string; rawPhrase: string }[] = []

  for (const pattern of patterns) {
    // Always re-create to reset lastIndex
    const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      // Try group 1 first, then group 2
      const candidate = (match[1] && isValidName(match[1])) ? match[1]
        : (match[2] && isValidName(match[2])) ? match[2]
        : null
      if (candidate) {
        results.push({ name: candidate, rawPhrase: match[0].trim() })
      }
    }
  }

  return results
}

// ── Main parser ────────────────────────────────────────────────────────────────

/**
 * Parse free-text coach attendance exception input.
 *
 * Returns a structured result with absent names and unexpected attendee names.
 * Does NOT access the database — names are raw strings, not matched to player IDs.
 * All names require director review and roster matching before any official write.
 *
 * Safety: this function is purely deterministic and side-effect-free.
 */
export function parseAttendanceExceptionText(input: string): AttendanceExceptionTextParseResult {
  const rawText = (input ?? '').trim()
  const warnings: string[] = []

  // Empty input — no action needed
  if (!rawText) {
    return {
      rawText,
      absentNames: [],
      unexpectedNames: [],
      confidence: 'low',
      warnings: ['Empty attendance answer — no exceptions to parse.'],
    }
  }

  const lower = rawText.toLowerCase()

  // ── Unsure flag ─────────────────────────────────────────────
  const isUnsure = /\bunsure\b|\bnot\s+sure\b|\bdon['']?t\s+know\b|\bcan['']?t\s+remember\b/i.test(rawText)
  if (isUnsure) {
    warnings.push('Coach indicated uncertainty — manual director review required.')
  }

  // ── Check "everyone present" baseline ───────────────────────
  const hasEveryoneBaseline = EVERYONE_PRESENT_PHRASES.some(phrase => lower.includes(phrase))

  // ── Collect absent names ─────────────────────────────────────
  const seenAbsent = new Set<string>()
  const absentNames: string[] = []

  // 1. "everyone ... except [names]" pattern
  if (hasEveryoneBaseline) {
    for (const trigger of EXCEPT_TRIGGERS) {
      const idx = lower.indexOf(trigger)
      if (idx === -1) continue

      const afterTrigger = rawText.slice(idx + trigger.length).trimStart()
      const extracted = extractNamesFromExceptClause(rawText, afterTrigger)
      for (const name of extracted) {
        if (!seenAbsent.has(name.toLowerCase())) {
          seenAbsent.add(name.toLowerCase())
          absentNames.push(name)
        }
      }
      // Continue scanning for additional except triggers (do not break)
      // e.g. "everyone here except Sarah, excluding Max"
    }
  }

  // 2. Explicit absence patterns (e.g. "Sarah was absent", "Max missed")
  const explicitAbsences = extractNamesFromPatterns(rawText, ABSENCE_PATTERNS)
  for (const { name } of explicitAbsences) {
    if (!seenAbsent.has(name.toLowerCase())) {
      seenAbsent.add(name.toLowerCase())
      absentNames.push(name)
    }
  }

  // ── Collect unexpected attendee names ───────────────────────
  const seenUnrostered = new Set<string>()
  const unexpectedNames: string[] = []

  const arrivals = extractNamesFromPatterns(rawText, ARRIVAL_PATTERNS)
  for (const { name } of arrivals) {
    const key = name.toLowerCase()
    if (!seenUnrostered.has(key) && !seenAbsent.has(key)) {
      seenUnrostered.add(key)
      unexpectedNames.push(name)
    }
  }

  // ── Warnings for edge cases ───────────────────────────────────

  // Short names (likely initials)
  const shortNames = [...absentNames, ...unexpectedNames].filter(n => n.length <= 2)
  if (shortNames.length > 0) {
    warnings.push(
      `Short name(s) detected (${shortNames.join(', ')}) — may be initials. Director must confirm identity.`,
    )
  }

  // "everyone was here" with no except clause and no absences — full attendance, no draft needed
  if (hasEveryoneBaseline && absentNames.length === 0 && unexpectedNames.length === 0 && !isUnsure) {
    return {
      rawText,
      absentNames: [],
      unexpectedNames: [],
      confidence: 'high',
      warnings: [],
    }
  }

  // Non-empty input but nothing detected — ambiguous free text
  if (!hasEveryoneBaseline && absentNames.length === 0 && unexpectedNames.length === 0) {
    return {
      rawText,
      absentNames: [],
      unexpectedNames: [],
      confidence: 'low',
      warnings: [
        'Attendance text did not match any absence or unexpected-arrival patterns.',
        'Director should review the original wrap-up notes manually.',
      ],
    }
  }

  // ── Confidence scoring ─────────────────────────────────────────

  let confidence: 'high' | 'medium' | 'low'

  if (isUnsure || warnings.some(w => w.includes('initials'))) {
    confidence = 'low'
  } else if (hasEveryoneBaseline && (absentNames.length > 0 || unexpectedNames.length > 0)) {
    // "everyone was here except X" — strongest pattern
    confidence = 'high'
  } else if (absentNames.length > 0 || unexpectedNames.length > 0) {
    // Explicit absence/arrival patterns without everyone baseline
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  // Standard review reminder always present when exceptions are found
  warnings.push(
    'Names are parsed from free text — director must verify player identity and match to roster before applying.',
  )
  warnings.push(
    'Draft only. No official attendance has been changed.',
  )

  return {
    rawText,
    absentNames,
    unexpectedNames,
    confidence,
    warnings,
  }
}
