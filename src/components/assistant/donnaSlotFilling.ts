// Sprint 318 — Donna Slot Filling V1
// Pure TypeScript. No DB, no API, no async, no React.
//
// Extracts slot values from raw text for each major workflow type.
// "Slots" are draft field values that can be pre-populated before Donna
// asks follow-up questions, reducing the number of turns in a workflow.
//
// Used by donnaConversationController.ts (Phase 6) when a new draft is created.
// The returned slots are passed directly to donnaDraftRuntime.createDraft().

import type { WorkflowId } from './donnaIntentRouter'

// ── Types ──────────────────────────────────────────────────────────────────────

export type SlotMap = Record<string, string>

// ── Shared extraction utilities ────────────────────────────────────────────────

const TENNIS_LEVELS: readonly string[] = [
  'High Performance 3', 'High Performance 2', 'High Performance 1',
  'Yellow 3', 'Yellow 2', 'Yellow 1',
  'Green 3', 'Green 2', 'Green 1',
  'Orange 3', 'Orange 2', 'Orange 1',
  'Red 3', 'Red 2', 'Red 1',
]

function extractLevel(text: string): string | null {
  const lower = text.toLowerCase()
  for (const level of TENNIS_LEVELS) {
    if (lower.includes(level.toLowerCase())) return level
  }
  return null
}

function extractDurationMinutes(text: string): string | null {
  const lower = text.toLowerCase()
  if (lower.includes('hour and a half') || lower.includes('1.5 hour')) return '90'
  if (lower.includes('one hour') || lower.includes('1 hour') || lower.includes('an hour')) return '60'
  const match = lower.match(/(\d+)\s*(?:min(?:utes?)?|mins?)/)
  if (match) {
    const val = parseInt(match[1], 10)
    if (val > 0 && val <= 300) return String(val)
  }
  return null
}

/**
 * Rough player-name heuristic — looks for "for [Name]" / "about [Name]" patterns.
 * Only returns a value when the match looks like a proper noun (starts with capital).
 */
function extractPlayerName(text: string): string | null {
  const match = text.match(/(?:for|about)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/)
  return match ? match[1] : null
}

/**
 * Extract a date or day reference from text.
 * Returns the raw matched string; the caller resolves to an actual date.
 * e.g. "tomorrow", "Monday", "next Thursday", "June 15"
 */
function extractDateHint(text: string): string | null {
  const lower = text.toLowerCase()
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ]

  if (lower.includes('today')) return 'today'
  if (lower.includes('tomorrow')) return 'tomorrow'

  const nextDayMatch = lower.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)
  if (nextDayMatch) return `next ${nextDayMatch[1]}`

  for (const day of dayNames) {
    if (lower.includes(day)) return day
  }

  for (const month of months) {
    const monthMatch = lower.match(new RegExp(`${month}\\s+(\\d{1,2})`))
    if (monthMatch) return `${month} ${monthMatch[1]}`
  }

  return null
}

// ── Per-workflow slot extractors ───────────────────────────────────────────────

// Sprint 322: Richer class template slot extraction
// Focus areas extracted as comma-separated string; intensity and style as single values.

const FOCUS_AREA_KEYWORDS: Array<{ phrases: string[]; canonical: string }> = [
  { phrases: ['forehand prep', 'forehand preparation', 'forehand'], canonical: 'forehand' },
  { phrases: ['backhand prep', 'backhand preparation', 'backhand'], canonical: 'backhand' },
  { phrases: ['transition to net', 'net approach', 'volley', 'approach shot'], canonical: 'transition to net' },
  { phrases: ['serve and return', 'serve return', 'return of serve'], canonical: 'serve and return' },
  { phrases: ['serve practice', 'serve work', 'serving'], canonical: 'serve' },
  { phrases: ['movement', 'footwork', 'court movement', 'agility'], canonical: 'footwork and movement' },
  { phrases: ['point play', 'point construction', 'rally'], canonical: 'point play' },
  { phrases: ['live ball', 'live-ball', 'live ball game'], canonical: 'live-ball games' },
  { phrases: ['match play', 'competitive match', 'game-based'], canonical: 'match play' },
  { phrases: ['consistency', 'control', 'rallying'], canonical: 'consistency' },
]

const INTENSITY_KEYWORDS: Array<{ phrases: string[]; canonical: string }> = [
  { phrases: ['high intensity', 'intense', 'challenging', 'push hard'], canonical: 'high' },
  { phrases: ['low intensity', 'easy', 'beginner-friendly', 'beginner friendly', 'relaxed'], canonical: 'low' },
  { phrases: ['moderate intensity', 'medium intensity'], canonical: 'medium' },
]

const STYLE_KEYWORDS: Array<{ phrases: string[]; canonical: string }> = [
  { phrases: ['competitive', 'game-focused', 'match-oriented'], canonical: 'competitive' },
  { phrases: ['technical', 'skill-focused', 'technique-heavy'], canonical: 'technical' },
  { phrases: ['balanced', 'mixed', 'all-around'], canonical: 'balanced' },
  { phrases: ['progressive', 'gradual build', 'build up'], canonical: 'progressive' },
]

function extractFocusAreas(text: string): string | null {
  const lower = text.toLowerCase()
  const found: string[] = []
  for (const { phrases, canonical } of FOCUS_AREA_KEYWORDS) {
    if (phrases.some(p => lower.includes(p)) && !found.includes(canonical)) {
      found.push(canonical)
    }
  }
  return found.length > 0 ? found.join(', ') : null
}

function extractIntensity(text: string): string | null {
  const lower = text.toLowerCase()
  for (const { phrases, canonical } of INTENSITY_KEYWORDS) {
    if (phrases.some(p => lower.includes(p))) return canonical
  }
  return null
}

function extractStyle(text: string): string | null {
  const lower = text.toLowerCase()
  for (const { phrases, canonical } of STYLE_KEYWORDS) {
    if (phrases.some(p => lower.includes(p))) return canonical
  }
  return null
}

function extractPlayerCount(text: string): string | null {
  const match = text.match(/(\d+)\s*(?:player|kid|student|athlete)s?/)
  if (match) return match[1]
  return null
}

function extractConstraints(text: string): string | null {
  const lower = text.toLowerCase()
  const constraints: string[] = []
  if (lower.includes('with constraint') || lower.includes('with limitations')) constraints.push('constraints')
  if (lower.includes('without net') || lower.includes('no net')) constraints.push('no net')
  if (lower.includes('small court') || lower.includes('mini court')) constraints.push('small court')
  return constraints.length > 0 ? constraints.join(', ') : null
}

function extractClassTemplateSlots(text: string): SlotMap {
  const slots: SlotMap = {}
  const level = extractLevel(text)
  if (level) slots.level = level
  const duration = extractDurationMinutes(text)
  if (duration) slots.durationMinutes = duration
  const focusAreas = extractFocusAreas(text)
  if (focusAreas) slots.focusAreas = focusAreas
  const intensity = extractIntensity(text)
  if (intensity) slots.intensity = intensity
  const style = extractStyle(text)
  if (style) slots.style = style
  const playerCount = extractPlayerCount(text)
  if (playerCount) slots.playerCount = playerCount
  const constraints = extractConstraints(text)
  if (constraints) slots.constraints = constraints
  return slots
}

function extractSessionSlots(text: string): SlotMap {
  const slots: SlotMap = {}
  const level = extractLevel(text)
  if (level) slots.level = level
  const dateHint = extractDateHint(text)
  if (dateHint) slots.sessionDate = dateHint
  const duration = extractDurationMinutes(text)
  if (duration) slots.durationMinutes = duration
  return slots
}

function extractParentUpdateSlots(text: string): SlotMap {
  const slots: SlotMap = {}
  const playerName = extractPlayerName(text)
  if (playerName) slots.playerName = playerName
  return slots
}

function extractCoachNoteSlots(text: string): SlotMap {
  const slots: SlotMap = {}
  const playerName = extractPlayerName(text)
  if (playerName) slots.playerName = playerName
  const dateHint = extractDateHint(text)
  if (dateHint) slots.sessionDate = dateHint
  return slots
}

function extractAttendanceSlots(text: string): SlotMap {
  const slots: SlotMap = {}
  const playerName = extractPlayerName(text)
  if (playerName) slots.playerName = playerName
  const dateHint = extractDateHint(text)
  if (dateHint) slots.sessionDate = dateHint

  const lower = text.toLowerCase()
  if (lower.includes('absent') || lower.includes('missed') || lower.includes('not on the roster')) {
    slots.exceptionType = 'absent'
  } else if (lower.includes('late') || lower.includes('late arrival')) {
    slots.exceptionType = 'late_arrival'
  } else if (lower.includes('make up') || lower.includes('makeup')) {
    slots.exceptionType = 'makeup_session'
  } else if (lower.includes('unrostered') || lower.includes('showed up')) {
    slots.exceptionType = 'unrostered_attendee'
  }

  return slots
}

function extractCurriculumSlots(text: string): SlotMap {
  const slots: SlotMap = {}
  const level = extractLevel(text)
  if (level) slots.level = level

  const lower = text.toLowerCase()
  if (lower.includes('add drill') || lower.includes('add a drill')) {
    slots.adjustmentType = 'add_drill'
  } else if (lower.includes('remove drill') || lower.includes('remove a drill')) {
    slots.adjustmentType = 'remove_drill'
  }

  return slots
}

function extractLevelReadinessSlots(text: string): SlotMap {
  const slots: SlotMap = {}
  const playerName = extractPlayerName(text)
  if (playerName) slots.playerName = playerName
  const level = extractLevel(text)
  if (level) slots.targetLevel = level
  return slots
}

// ── Dispatch ───────────────────────────────────────────────────────────────────

/**
 * Extract pre-populated slot values from raw input text for a given workflow.
 * Returns an empty object if no slots are detected or if the workflowId is
 * not yet mapped to an extractor.
 *
 * These slots are passed to donnaDraftRuntime.createDraft() as initialSlots,
 * skipping those questions in the guided flow.
 */
export function extractSlots(text: string, workflowId: WorkflowId | null): SlotMap {
  if (!workflowId) return {}

  switch (workflowId) {
    case 'class_template_creation': return extractClassTemplateSlots(text)
    case 'session_creation':        return extractSessionSlots(text)
    case 'parent_update_draft':     return extractParentUpdateSlots(text)
    case 'coach_note_capture':      return extractCoachNoteSlots(text)
    case 'attendance_exception':    return extractAttendanceSlots(text)
    case 'curriculum_override':     return extractCurriculumSlots(text)
    case 'level_readiness':         return extractLevelReadinessSlots(text)
    case 'academy_setup':           return {}
    case 'review_queue':            return {}
  }
}

/**
 * Given a slot map and a fieldId from a task contract, return the pre-filled
 * value if present, or null if the slot was not extracted.
 */
export function getSlotValue(slots: SlotMap, fieldId: string): string | null {
  return slots[fieldId] ?? null
}

/**
 * Merge two slot maps, with the second taking precedence on conflicts.
 */
export function mergeSlots(base: SlotMap, override: SlotMap): SlotMap {
  return { ...base, ...override }
}
