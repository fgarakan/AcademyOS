// Sprint 994 — DONNA Parent-Safe Context Filter V1
// Ensures no parent-unsafe content reaches parent-facing DONNA responses.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// Rules (from parentSafeResponseRules.ts):
//   1. No raw coach notes in parent-facing output
//   2. No internal assessment scores in parent-facing output
//   3. No player comparison data in parent-facing output
//   4. No behavioral flags (risk signals) in parent-facing output
//   5. No level change proposals in parent-facing output
//   6. Only positive progress, session topics, and encouragement in parent-facing output
//
// This filter is applied to any DONNA context data before it is used
// in a parent-facing response (email draft, portal message, parent update).

// ── Filter result ─────────────────────────────────────────────────────────────

export interface ParentSafeFilterResult {
  /** Whether the input is safe for parent-facing use */
  safe: boolean
  /** Fields that were blocked */
  blockedFields: string[]
  /** The filtered (sanitized) data with unsafe fields removed */
  sanitizedData: Record<string, unknown>
  /** Summary of what was removed */
  filterSummary: string
}

// ── Blocked field patterns ────────────────────────────────────────────────────

const BLOCKED_FIELD_NAMES: readonly string[] = [
  'coach_notes', 'coach_note', 'raw_notes', 'observations',
  'internal_assessment', 'score_delta', 'risk_signals', 'risk_level',
  'behavioral_flags', 'attention_flags', 'level_movement_proposal',
  'comparison_data', 'peer_comparison', 'ranking',
  'session_notes_raw', 'voice_notes', 'recap_raw',
]

const BLOCKED_CONTENT_PATTERNS = [
  /coach.*note/i,
  /internal.*assessment/i,
  /risk.*signal/i,
  /behavioral.*flag/i,
  /raw.*note/i,
  /ranked\s+\d+(st|nd|rd|th)/i,
  /compared to (other|peers|the group)/i,
]

function isFieldBlocked(key: string): boolean {
  return BLOCKED_FIELD_NAMES.some(blocked => key.toLowerCase().includes(blocked.toLowerCase()))
}

function hasBlockedContent(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return BLOCKED_CONTENT_PATTERNS.some(p => p.test(value))
}

// ── Filter function ───────────────────────────────────────────────────────────

/**
 * Filter a data object to remove parent-unsafe fields.
 * Returns sanitized data with blocked fields removed and filter summary.
 * Safe to call on any data before including it in a parent-facing response.
 */
export function applyParentSafeFilter(
  data: Record<string, unknown>,
): ParentSafeFilterResult {
  const blockedFields: string[] = []
  const sanitizedData: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (isFieldBlocked(key)) {
      blockedFields.push(key)
      continue
    }
    if (hasBlockedContent(value)) {
      blockedFields.push(key)
      continue
    }
    sanitizedData[key] = value
  }

  const safe = blockedFields.length === 0

  return {
    safe,
    blockedFields,
    sanitizedData,
    filterSummary: safe
      ? 'All fields passed parent-safe review.'
      : `Removed ${blockedFields.length} field(s) not suitable for parent-facing content: ${blockedFields.join(', ')}.`,
  }
}

/**
 * Check if a text string is safe for parent-facing use.
 * Returns true only if no blocked content patterns are found.
 */
export function isTextParentSafe(text: string): boolean {
  return !BLOCKED_CONTENT_PATTERNS.some(p => p.test(text))
}

/**
 * Build a parent-safe summary from a player's curriculum context.
 * Never includes raw coach notes, behavioral flags, or internal scores.
 * Always uses encouraging, forward-looking language.
 */
export function buildParentSafeSummary(params: {
  playerFirstName: string
  curriculumLevelLabel?: string | null
  sessionTopics?: string[]
  progressStatement?: string | null
}): string {
  const { playerFirstName, curriculumLevelLabel, sessionTopics = [], progressStatement } = params
  const lines: string[] = []

  if (curriculumLevelLabel) {
    lines.push(`${playerFirstName} is currently working at the ${curriculumLevelLabel} level.`)
  }
  if (sessionTopics.length > 0) {
    lines.push(`Recent sessions have focused on: ${sessionTopics.slice(0, 3).join(', ')}.`)
  }
  if (progressStatement) {
    lines.push(progressStatement)
  }
  if (lines.length === 0) {
    lines.push(`${playerFirstName} is making progress in their development program.`)
  }

  return lines.join(' ')
}
