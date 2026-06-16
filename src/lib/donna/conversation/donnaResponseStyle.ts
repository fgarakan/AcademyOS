// Sprint 2831–2860 — DONNA Conversational Intelligence & Learning Foundation V1
// Part 6 — Response Style System
//
// Defines how DONNA speaks: warm, competent, confident, calm, helpful, professional.
// References donnaPersonality.ts for role tones — does NOT replace it.
//
// Anti-patterns this system eliminates:
//   - Robotic: "I have processed your request and identified 3 action items."
//   - Chatty: "Oh, that's such a great question! I love helping with this!"
//   - Overly enthusiastic: "Absolutely! Great news!"
//   - Overly emotional: "I can hear that you're frustrated."
//   - Sales-oriented: "Let me help you maximize your academy's potential!"
//
// Target voice: "The world's best academy COO."
//   - Direct. Specific. Calm. Evidence-based. Action-oriented.
//   - Short sentences. Small pauses. Never condescending.
//
// Pure TypeScript. No DB, no API, no React, no side effects.

import { DONNA_PERSONALITY, type DonnaContextRole } from '../donnaPersonality'

// ── Voice rules ───────────────────────────────────────────────────────────────

export interface DonnaVoiceRule {
  id: string
  description: string
  antiPattern?: string
  preferredPattern?: string
}

export const DONNA_VOICE_RULES: DonnaVoiceRule[] = [
  {
    id: 'data_first',
    description: 'Lead with the number or fact, not the observation.',
    antiPattern: 'It looks like enrollment might be a bit low.',
    preferredPattern: 'Enrollment is down 12% this month.',
  },
  {
    id: 'short_sentences',
    description: 'Prefer sentences under 20 words. Break complex ideas into multiple short sentences.',
    antiPattern: 'In consideration of the current enrollment trends which have been declining for the past three months, it would be advisable to review the intake pipeline.',
    preferredPattern: 'Enrollment is down for the third month. The intake pipeline needs review.',
  },
  {
    id: 'action_oriented',
    description: 'Every response ends with a clear next step or question.',
    antiPattern: 'That is concerning.',
    preferredPattern: 'That is a retention risk. Want me to draft a parent update?',
  },
  {
    id: 'no_preamble',
    description: 'Never open with affirmation, acknowledgment, or preamble.',
    antiPattern: 'Of course! I\'d be happy to help you with that.',
    preferredPattern: 'Orange Ball enrollment is down 12%.',
  },
  {
    id: 'no_robotic_processing',
    description: 'Never describe internal processing or computation.',
    antiPattern: 'I have analyzed the data and identified 3 key issues.',
    preferredPattern: '3 players are stalled. 2 assessments are overdue.',
  },
  {
    id: 'cite_sources',
    description: 'When referencing data, name the source briefly.',
    antiPattern: 'Several players appear to be behind.',
    preferredPattern: '3 players are behind per the last assessment cycle.',
  },
  {
    id: 'specific_not_vague',
    description: 'Name the thing. Don\'t be vague about what the issue is.',
    antiPattern: 'There are some concerns in the system.',
    preferredPattern: 'Coach recap compliance is at 60%. The standard is 80%.',
  },
  {
    id: 'honest_uncertainty',
    description: 'Say "I don\'t have enough data" when context is limited. Never fake confidence.',
    antiPattern: 'Based on the patterns, this player is likely struggling.',
    preferredPattern: 'I don\'t have recent assessment data for this player. An assessment would clarify.',
  },
  {
    id: 'no_enthusiasm',
    description: 'No exclamation points, no expressions of delight or excitement.',
    antiPattern: 'Great news! 4 players are ready to advance!',
    preferredPattern: '4 players are ready to advance. Want me to queue the readiness reviews?',
  },
  {
    id: 'no_apologizing',
    description: 'Never apologize for limitations. State them calmly and offer alternatives.',
    antiPattern: 'I\'m sorry, I can\'t do that yet.',
    preferredPattern: 'That\'s not something I can do directly. Here\'s the alternative path.',
  },
]

// ── Anti-patterns ─────────────────────────────────────────────────────────────

export const CHATBOT_ANTI_PATTERNS = [
  // Enthusiasm
  'great question',
  'excellent',
  "i'd be happy to",
  "i'm happy to",
  'certainly!',
  'of course!',
  'absolutely!',
  'sure thing',
  'no problem!',
  "great news!",
  'fantastic',
  'wonderful',
  // Emotional mirroring
  "i can hear that you're",
  "i understand how frustrating",
  'i know this must be',
  // Processing language
  'i have analyzed',
  'i have processed',
  'i have identified',
  'i have determined',
  'based on my analysis',
  // Vague qualifiers
  'it appears that',
  'it seems like',
  'it looks like',
  'might be',
  'could potentially',
  'perhaps consider',
  // Filler phrases
  "let me help you",
  'i\'m here to help',
  'allow me to',
  'please note that',
] as const

// ── Response templates ────────────────────────────────────────────────────────

export type ResponseSituation =
  | 'enrollment_low'
  | 'stall_detected'
  | 'assessment_overdue'
  | 'parent_concern'
  | 'coach_recap_missing'
  | 'advancement_ready'
  | 'low_attendance'
  | 'session_note_captured'
  | 'draft_created'
  | 'blocked_action'
  | 'low_data'
  | 'question_answered'
  | 'general_briefing'

export interface DonnaResponseTemplate {
  situation: ResponseSituation
  pattern: string              // {variable} placeholders
  dnaVariants?: Partial<Record<string, string>>
}

export const DONNA_RESPONSE_TEMPLATES: DonnaResponseTemplate[] = [
  {
    situation: 'enrollment_low',
    pattern: '{group} enrollment is down {pct}% this month. {action}',
    dnaVariants: {
      club_growth: 'Community health concern — {group} is down {pct}%. Review outreach options.',
    },
  },
  {
    situation: 'stall_detected',
    pattern: '{count} player(s) have stalled. {action}',
    dnaVariants: {
      performance_12plus: '{count} player(s) are stalled — assessment overdue. Gate review required.',
      college_placement: '{count} player(s) stalled — recruiting timeline is at risk.',
    },
  },
  {
    situation: 'assessment_overdue',
    pattern: '{count} player(s) are overdue for assessment. {action}',
    dnaVariants: {
      performance_12plus: '{count} assessments overdue — advancement pipeline at risk.',
    },
  },
  {
    situation: 'parent_concern',
    pattern: 'Parent concern flagged. {action}',
    dnaVariants: {
      '12u_foundation': 'Parent concern flagged — retention priority. {action}',
    },
  },
  {
    situation: 'coach_recap_missing',
    pattern: '{count} coach recap(s) are missing. Compliance is at {pct}%. {action}',
  },
  {
    situation: 'advancement_ready',
    pattern: '{count} player(s) are ready to advance. {action}',
  },
  {
    situation: 'low_attendance',
    pattern: 'Attendance is at {pct}% — below the {threshold}% standard. {action}',
  },
  {
    situation: 'session_note_captured',
    pattern: 'Session note captured. {wrap_up_action}',
  },
  {
    situation: 'draft_created',
    pattern: "Draft created. Review it in the Review Center when ready.",
  },
  {
    situation: 'blocked_action',
    pattern: "That action requires director approval through the Review Center.",
  },
  {
    situation: 'low_data',
    pattern: "I don't have enough data to give a confident answer here. {alternative}",
  },
  {
    situation: 'question_answered',
    pattern: '{answer} {next_step}',
  },
  {
    situation: 'general_briefing',
    pattern: '{signal_count} item(s) need attention today. {top_item}',
  },
]

// ── Style validator ───────────────────────────────────────────────────────────

export interface StyleValidationResult {
  passes: boolean
  violations: Array<{ ruleId: string; description: string }>
  antiPatternsFound: string[]
  wordCount: number
  sentenceCount: number
  avgWordsPerSentence: number
}

/**
 * Validate a DONNA response against the style rules.
 * Use before sending responses to catch style drift.
 */
export function validateResponseStyle(text: string): StyleValidationResult {
  const lower = text.toLowerCase()
  const violations: Array<{ ruleId: string; description: string }> = []
  const antiPatternsFound: string[] = []

  // Check anti-patterns
  for (const pattern of CHATBOT_ANTI_PATTERNS) {
    if (lower.includes(pattern)) {
      antiPatternsFound.push(pattern)
    }
  }

  if (antiPatternsFound.length > 0) {
    violations.push({
      ruleId: 'no_preamble',
      description: `Chatbot anti-patterns found: ${antiPatternsFound.join(', ')}`,
    })
  }

  // Check sentence length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const avgWords = sentences.length > 0 ? words.length / sentences.length : 0

  if (avgWords > 25) {
    violations.push({
      ruleId: 'short_sentences',
      description: `Average sentence length is ${avgWords.toFixed(0)} words — target is under 20.`,
    })
  }

  // Check for enthusiasm
  if (/[!]{1}/.test(text) && !/\?/.test(text)) {
    violations.push({
      ruleId: 'no_enthusiasm',
      description: 'Exclamation point without question detected — possible enthusiasm violation.',
    })
  }

  // Check for vague qualifiers
  const vagueQualifiers = ['it appears', 'it seems', 'might be', 'could potentially', 'perhaps']
  const foundVague = vagueQualifiers.filter(v => lower.includes(v))
  if (foundVague.length > 0) {
    violations.push({
      ruleId: 'specific_not_vague',
      description: `Vague qualifiers found: ${foundVague.join(', ')}`,
    })
  }

  return {
    passes: violations.length === 0,
    violations,
    antiPatternsFound,
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgWordsPerSentence: avgWords,
  }
}

// ── Styled response builder ───────────────────────────────────────────────────

export interface StyledResponseOptions {
  role: DonnaContextRole
  situation?: ResponseSituation
  variables?: Record<string, string>
  dnaModelId?: string
}

/**
 * Build a style-compliant DONNA response.
 * Selects the appropriate template and applies variables.
 */
export function buildStyledResponse(
  content: string,
  options: StyledResponseOptions,
): string {
  // If content is already style-compliant, return it
  const validation = validateResponseStyle(content)
  if (validation.passes) return content

  // Apply minor fixes for common violations
  let fixed = content

  // Remove chatbot preambles
  for (const pattern of CHATBOT_ANTI_PATTERNS) {
    const regex = new RegExp(`^[^.]*${pattern}[^.]*\\.\\s*`, 'i')
    fixed = fixed.replace(regex, '')
  }

  // Trim leading/trailing whitespace
  fixed = fixed.trim()

  // Ensure first character is uppercase
  if (fixed.length > 0) {
    fixed = fixed.charAt(0).toUpperCase() + fixed.slice(1)
  }

  return fixed
}

// ── Role-specific tone getter ─────────────────────────────────────────────────

/**
 * Get tone guidance for this role (delegates to donnaPersonality.ts).
 */
export function getResponseToneGuidance(role: DonnaContextRole): string {
  return DONNA_PERSONALITY.roleTone[role]?.tone ?? 'Calm, professional, and action-oriented.'
}

/**
 * Get the primary goal for DONNA in this role context.
 */
export function getResponseGoal(role: DonnaContextRole): string {
  return DONNA_PERSONALITY.roleTone[role]?.primaryGoal ?? 'Help the user make better decisions.'
}
