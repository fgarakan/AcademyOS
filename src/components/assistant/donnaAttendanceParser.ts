// Donna Attendance Parser — Sprint 274
// Client-side, rule-based attendance statement analysis.
// No AI, no DB, no API, no async. Pure text parsing.
// Mirrors the server-side logic in attendanceExceptionDraftAction.ts.

import type { DonnaAttendanceParsed } from './donnaAttendanceTypes'

const EVERYONE_PHRASES = [
  'everyone was here', 'everyone came', 'everyone here', 'everyone present',
  'everybody was here', 'everybody came', 'all were here', 'all came',
  'whole group', 'full group', 'everyone showed up', 'all showed up',
  'everyone', 'everybody',
]

const EXCEPT_TRIGGERS = ['except', 'apart from', 'but not', 'excluding', 'other than']

const NAME_STOP_WORDS = new Set([
  'everyone', 'everybody', 'all', 'they', 'he', 'she', 'it', 'we', 'you', 'i',
  'the', 'a', 'an', 'this', 'that', 'also', 'and', 'but', 'or', 'so', 'just',
  'only', 'even', 'now', 'today', 'here', 'there', 'then', 'no', 'not', 'new',
  'kid', 'player', 'student', 'member', 'coach', 'one', 'two', 'three',
])

function hasEveryoneBaseline(text: string): boolean {
  const lower = text.toLowerCase()
  return EVERYONE_PHRASES.some(p => lower.includes(p))
}

function extractAbsentNameQueries(text: string): string[] {
  const lower = text.toLowerCase()
  const names: string[] = []

  for (const trigger of EXCEPT_TRIGGERS) {
    const idx = lower.indexOf(trigger)
    if (idx === -1) continue

    const afterTrigger = text.slice(idx + trigger.length).trim()
    const end = afterTrigger.search(/[.!?\n]/)
    const chunk = end >= 0 ? afterTrigger.slice(0, end) : afterTrigger

    const parts = chunk
      .replace(/\band\b/gi, ',')
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 50)

    for (const part of parts) {
      const word = part.split(/\s+/)[0]
      if (word && !NAME_STOP_WORDS.has(word.toLowerCase())) {
        names.push(word)
      }
    }
    break
  }

  return names
}

function extractUnrosteredNameQueries(text: string, absentNames: string[]): string[] {
  // Fresh regex instances each call — avoids stateful lastIndex with /g flag
  const ARRIVAL_PATTERNS = [
    /\b([A-Z][a-z]{1,20})\s+(?:showed\s+up|came\s+in|turned\s+up|arrived|appeared)\b/g,
    /\bnew\s+(?:kid|player|student|member)\s+([A-Z][a-z]{1,20})\b/g,
    /\balso[,\s]+([A-Z][a-z]{1,20})\s+(?:showed|came|turned|arrived)\b/g,
  ]

  const found: string[] = []
  const seen = new Set<string>()

  for (const pattern of ARRIVAL_PATTERNS) {
    let m: RegExpExecArray | null
    while ((m = pattern.exec(text)) !== null) {
      const name = m[1]?.trim()
      if (!name || NAME_STOP_WORDS.has(name.toLowerCase()) || seen.has(name.toLowerCase())) continue
      seen.add(name.toLowerCase())
      if (absentNames.some(a => a.toLowerCase() === name.toLowerCase())) continue
      found.push(name)
    }
  }

  return found
}

export function parseAttendanceStatement(text: string): DonnaAttendanceParsed {
  const trimmed = text.trim()
  if (!trimmed) {
    return {
      assumedEveryonePresent: false,
      absentNameQueries: [],
      unrosteredNameQueries: [],
      confidence: 'low',
      safetyNotes: ['No attendance statement provided.'],
    }
  }

  const assumedEveryonePresent = hasEveryoneBaseline(trimmed)
  const absentNameQueries = extractAbsentNameQueries(trimmed)
  const unrosteredNameQueries = extractUnrosteredNameQueries(trimmed, absentNameQueries)

  const safetyNotes: string[] = [
    'Draft only — no attendance records have been changed.',
    'Roster matching happens server-side when you submit for review.',
    'Unrostered attendees require director review before any action.',
  ]

  if (!assumedEveryonePresent && absentNameQueries.length === 0) {
    safetyNotes.push(
      'No "everyone" baseline or "except" pattern detected — all players will be marked unknown.',
    )
  }

  if (unrosteredNameQueries.length > 0) {
    safetyNotes.push(
      `${unrosteredNameQueries.length} possible unrostered attendee(s) detected. These will be flagged for review, not added to the roster.`,
    )
  }

  const confidence: 'low' | 'medium' | 'high' =
    assumedEveryonePresent || absentNameQueries.length > 0
      ? 'high'
      : unrosteredNameQueries.length > 0
      ? 'medium'
      : 'low'

  return {
    assumedEveryonePresent,
    absentNameQueries,
    unrosteredNameQueries,
    confidence,
    safetyNotes,
  }
}
