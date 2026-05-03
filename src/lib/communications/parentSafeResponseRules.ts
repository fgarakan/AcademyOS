// Parent-Safe Response Rules — Sprint 217
// Pure utility module — no DB calls, no side effects, no external AI.
// Governs what data is safe for parent-facing communication and how it should be framed.

// ── Field allowlist ────────────────────────────────────────────────────────────
// Only these field paths are safe to surface in parent-facing contexts.
// Use canShowParentField() as a gate before including any field in a parent message.

const PARENT_VISIBLE_FIELDS = new Set<string>([
  'player.full_name',
  'player.first_name',
  'player.curriculum_level_display_name',
  'player.curriculum_stage',
  'session_attendance.status',
  'parent_safe_draft',
  'player_development_priorities.parent_message',
])

export function canShowParentField(fieldName: string): boolean {
  return PARENT_VISIBLE_FIELDS.has(fieldName)
}

// ── Sanitization ───────────────────────────────────────────────────────────────
// These patterns replace harsh or internal-only language with parent-appropriate alternatives.
// Applied left-to-right; order matters for overlapping matches.

const SANITIZE_RULES: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\bpoor performance\b/gi,            replacement: 'developing performance' },
  { pattern: /\bneeds improvement\b/gi,           replacement: 'working on' },
  { pattern: /\bneeds work\b/gi,                  replacement: 'working on' },
  { pattern: /\bmust improve\b/gi,                replacement: 'continuing to work on' },
  { pattern: /\bstruggling with\b/gi,             replacement: 'working through' },
  { pattern: /\bstruggling\b/gi,                  replacement: 'working through challenges' },
  { pattern: /\bfailing\b/gi,                     replacement: 'still developing' },
  { pattern: /\bdeficient\b/gi,                   replacement: 'developing' },
  { pattern: /\bweak\b/gi,                        replacement: 'building' },
  { pattern: /\bpoor\b/gi,                        replacement: 'developing' },
  { pattern: /\bbad\b/gi,                         replacement: 'still learning' },
  // Strip internal annotations — never expose to parents
  { pattern: /INTERNAL:[^\n]*/g,                  replacement: '' },
  { pattern: /\[COACH[^\]]*\]/gi,                 replacement: '' },
  { pattern: /\[INTERNAL[^\]]*\]/gi,              replacement: '' },
  { pattern: /\[DIRECTOR[^\]]*\]/gi,              replacement: '' },
]

export function sanitizeParentFacingText(text: string): string {
  let result = text
  for (const { pattern, replacement } of SANITIZE_RULES) {
    result = result.replace(pattern, replacement)
  }
  return result.replace(/\s{2,}/g, ' ').trim()
}

// ── Tone guidelines ────────────────────────────────────────────────────────────
// Use these in UI guardrail copy, coach guidance panels, and AI prompt constraints.

export function getParentSafeToneGuidelines(): string[] {
  return [
    "Use the player's first name — never 'your child' or 'the player'.",
    "Frame everything as a learning journey, not a deficit or ranking.",
    "Reference specific skills (footwork, grip, serve) rather than character traits.",
    "One growth area maximum per message — don't list multiple weaknesses.",
    "Never compare the player to teammates or to a generic standard.",
    "Avoid raw scores, percentile ranks, or internal assessment language.",
    "For absences: acknowledge without blame — 'we missed [name] today'.",
    "Keep notifications under 3 sentences where possible.",
    "End with encouragement or a forward-looking statement.",
    "If an observation is ambiguous or unclear, omit it — send nothing rather than something misleading.",
  ]
}

// ── Draft builder ──────────────────────────────────────────────────────────────

export interface ParentGuidanceDraftParams {
  firstName: string
  focusKeywords: string[]
  observationText?: string
  attendanceStatus?: 'present' | 'absent' | 'late' | 'excused'
}

export function buildParentSupportGuidanceDraft(params: ParentGuidanceDraftParams): string {
  const { firstName, focusKeywords, observationText, attendanceStatus } = params

  if (attendanceStatus === 'absent') {
    return `We missed ${firstName} in today's session — we hope all is well and look forward to seeing them next time.`
  }

  const focus = focusKeywords.length > 0
    ? focusKeywords.slice(0, 2).join(' and ')
    : 'their technique'

  const arrivalNote = attendanceStatus === 'late'
    ? `${firstName} joined us a little late today. `
    : ''

  const base = `${arrivalNote}${firstName} worked on ${focus} in today's session.`

  if (!observationText?.trim()) return base

  const sanitized = sanitizeParentFacingText(observationText.trim())
  if (!sanitized) return base

  const sentence = sanitized.charAt(0).toUpperCase() + sanitized.slice(1)
  const ended = sentence.endsWith('.') || sentence.endsWith('!') ? sentence : `${sentence}.`
  return `${base} ${ended}`
}
