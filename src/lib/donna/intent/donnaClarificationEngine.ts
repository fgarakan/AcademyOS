// Sprint 1831–1860 — DONNA Intent, Goal & Continuity Engine V1
// Contextual Clarification Engine
//
// Generates smart clarification questions when intent or goal confidence is low.
// Questions are:
//   - Concise: max 4 options
//   - Page-aware: different options on different routes
//   - Entity-aware: personalized when a player/level was detected
//   - Approval-safe: never suggests bypassing review pipeline
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Uses confidence scoring thresholds from confidenceScoring.ts.
//   - Returns at most 4 options to avoid cognitive overload.

import {
  isClarificationNeeded,
  CONFIDENCE_ACT_THRESHOLD,
} from './confidenceScoring'
import type { DirectorIntent } from './donnaIntentEngine'
import type { DirectorGoal } from '../goals/donnaGoalEngine'
import type { EntityType } from '../entities/donnaEntityResolver'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClarificationOption {
  /** Short label shown to director */
  label: string
  /** Goal this option maps to */
  goalHint: DirectorGoal
  /** Trigger phrase DONNA submits if director selects this option */
  triggerPhrase: string
}

export interface ClarificationQuestion {
  /** The question DONNA asks */
  question: string
  /** Ordered options (max 4) */
  options: ClarificationOption[]
  /** Additional context note (e.g. "Only available from the player profile") */
  contextNote: string | null
  /** True when DONNA should wait for explicit selection before acting */
  requiresSelection: boolean
}

// ── Page-aware option sets ─────────────────────────────────────────────────────

const DEFAULT_OPTIONS: ClarificationOption[] = [
  {
    label: 'Review player progress',
    goalHint: 'player_progress_review',
    triggerPhrase: 'review player progress',
  },
  {
    label: 'Create a parent update',
    goalHint: 'parent_update_completion',
    triggerPhrase: 'create a parent update with me',
  },
  {
    label: 'Complete an assessment',
    goalHint: 'assessment_completion',
    triggerPhrase: 'help me complete this assessment',
  },
  {
    label: 'Review level readiness',
    goalHint: 'readiness_review_completion',
    triggerPhrase: 'review level readiness',
  },
]

const CURRICULUM_OPTIONS: ClarificationOption[] = [
  {
    label: 'Build a curriculum level',
    goalHint: 'curriculum_completion',
    triggerPhrase: 'walk me through curriculum builder',
  },
  {
    label: 'Review level coverage gaps',
    goalHint: 'curriculum_completion',
    triggerPhrase: 'where are the curriculum gaps',
  },
  {
    label: 'Build a class template',
    goalHint: 'class_template_completion',
    triggerPhrase: 'walk me through template builder',
  },
  {
    label: 'Review player readiness for this level',
    goalHint: 'readiness_review_completion',
    triggerPhrase: 'review level readiness',
  },
]

const PLAYER_PROFILE_OPTIONS: ClarificationOption[] = [
  {
    label: 'Review recent progress',
    goalHint: 'player_progress_review',
    triggerPhrase: 'summarize this player\'s recent progress',
  },
  {
    label: 'Complete an assessment',
    goalHint: 'assessment_completion',
    triggerPhrase: 'help me complete this assessment',
  },
  {
    label: 'Create a parent update',
    goalHint: 'parent_update_completion',
    triggerPhrase: 'create a parent update with me',
  },
  {
    label: 'Review level readiness',
    goalHint: 'readiness_review_completion',
    triggerPhrase: 'review level readiness',
  },
]

const REVIEW_OPTIONS: ClarificationOption[] = [
  {
    label: 'Approve the highest priority item',
    goalHint: 'review_queue_clear',
    triggerPhrase: 'what needs approval first',
  },
  {
    label: 'Summarize everything pending',
    goalHint: 'review_queue_clear',
    triggerPhrase: 'summarize the review queue',
  },
  {
    label: 'Review parent-facing items first',
    goalHint: 'review_queue_clear',
    triggerPhrase: 'which items have parent visibility risk',
  },
  {
    label: 'Explain what happens after I approve',
    goalHint: 'review_queue_clear',
    triggerPhrase: 'what happens after I approve this',
  },
]

const SESSION_OPTIONS: ClarificationOption[] = [
  {
    label: 'Review a session debrief',
    goalHint: 'session_review_completion',
    triggerPhrase: 'review session',
  },
  {
    label: 'Record attendance',
    goalHint: 'attendance_completion',
    triggerPhrase: 'help me record attendance',
  },
  {
    label: 'Review wrap-up coverage',
    goalHint: 'session_review_completion',
    triggerPhrase: 'which coaches still need to submit wrap-ups',
  },
  {
    label: 'Build a session template',
    goalHint: 'class_template_completion',
    triggerPhrase: 'walk me through template builder',
  },
]

const SETUP_OPTIONS: ClarificationOption[] = [
  {
    label: 'Continue Academy Onboarding',
    goalHint: 'academy_setup_completion',
    triggerPhrase: 'help me finish academy setup',
  },
  {
    label: 'Add a new player',
    goalHint: 'player_onboarding_completion',
    triggerPhrase: 'guide me through adding a player',
  },
  {
    label: 'Build the curriculum',
    goalHint: 'curriculum_completion',
    triggerPhrase: 'walk me through curriculum builder',
  },
  {
    label: 'Set up class templates',
    goalHint: 'class_template_completion',
    triggerPhrase: 'walk me through template builder',
  },
]

// ── Route → option set ────────────────────────────────────────────────────────

function getOptionsForRoute(pathname: string): ClarificationOption[] {
  if (pathname.startsWith('/director/curriculum')) return CURRICULUM_OPTIONS
  if (pathname.startsWith('/director/players/') && pathname.split('/').length >= 4) return PLAYER_PROFILE_OPTIONS
  if (pathname.startsWith('/director/review'))    return REVIEW_OPTIONS
  if (pathname.startsWith('/director/sessions'))  return SESSION_OPTIONS
  if (pathname.startsWith('/director/coach'))     return SESSION_OPTIONS
  if (pathname.startsWith('/director/onboarding')) return SETUP_OPTIONS
  return DEFAULT_OPTIONS
}

// ── Entity-aware question prefix ──────────────────────────────────────────────

function buildQuestionPrefix(
  entity: string | null,
  entityType: EntityType | null,
): string {
  if (!entity) return "I want to make sure I understand. Would you like to:"
  switch (entityType) {
    case 'player':   return `I see you're asking about **${entity}**. Would you like to:`
    case 'coach':    return `I see you're asking about **${entity}**. Would you like to:`
    case 'curriculum_level': return `I see you're asking about **${entity}**. Would you like to:`
    case 'session':  return `I see you're asking about **${entity}**. Would you like to:`
    default:         return `I see you're asking about **${entity}**. Would you like to:`
  }
}

// ── Intent-filtered options ───────────────────────────────────────────────────
// When we have a partial intent match, filter options to most relevant.

const INTENT_PREFERRED_OPTIONS: Partial<Record<DirectorIntent, ClarificationOption[]>> = {
  player_progress_review: [
    {
      label: 'Review recent progress',
      goalHint: 'player_progress_review',
      triggerPhrase: 'review player progress',
    },
    {
      label: 'Complete an assessment',
      goalHint: 'assessment_completion',
      triggerPhrase: 'help me complete this assessment',
    },
    {
      label: 'Create a parent update',
      goalHint: 'parent_update_completion',
      triggerPhrase: 'create a parent update with me',
    },
    {
      label: 'Review level readiness',
      goalHint: 'readiness_review_completion',
      triggerPhrase: 'review level readiness',
    },
  ],
  parent_communication: [
    {
      label: 'Create a parent update draft',
      goalHint: 'parent_update_completion',
      triggerPhrase: 'create a parent update with me',
    },
    {
      label: 'Review what parents can see',
      goalHint: 'parent_update_completion',
      triggerPhrase: 'what can parents see',
    },
  ],
  curriculum_help: CURRICULUM_OPTIONS,
  template_building: [
    {
      label: 'Build a class template',
      goalHint: 'class_template_completion',
      triggerPhrase: 'walk me through template builder',
    },
    {
      label: 'Build a curriculum level',
      goalHint: 'curriculum_completion',
      triggerPhrase: 'walk me through curriculum builder',
    },
  ],
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Build a clarification question for the director.
 *
 * @param confidence - Overall confidence score (0–1)
 * @param pathname   - Current route (for page-aware options)
 * @param entity     - Detected entity label, or null
 * @param entityType - Detected entity type, or null
 * @param intent     - Best-guess intent, or null
 */
export function buildClarificationQuestion(params: {
  confidence: number
  pathname: string
  entity?: string | null
  entityType?: EntityType | null
  intent?: DirectorIntent | null
}): ClarificationQuestion | null {
  if (!isClarificationNeeded(params.confidence)) return null

  const { pathname, entity = null, entityType = null, intent = null } = params

  // Pick options: prefer intent-filtered, then page-aware, then default
  let options: ClarificationOption[]
  if (intent && INTENT_PREFERRED_OPTIONS[intent]) {
    options = INTENT_PREFERRED_OPTIONS[intent]!.slice(0, 4)
  } else {
    options = getOptionsForRoute(pathname).slice(0, 4)
  }

  const questionPrefix = buildQuestionPrefix(entity, entityType ?? null)

  const contextNote = params.confidence < 0.35
    ? 'I\'m not sure what you need — pick an option or describe it in your own words.'
    : null

  return {
    question: questionPrefix,
    options,
    contextNote,
    requiresSelection: true,
  }
}

/**
 * Format a clarification question as a DONNA chat message.
 * Options are listed as numbered choices.
 */
export function formatClarificationMessage(cq: ClarificationQuestion): string {
  const optionLines = cq.options
    .map((o, i) => `${i + 1}. ${o.label}`)
    .join('\n')

  const parts = [
    cq.question,
    '',
    optionLines,
  ]

  if (cq.contextNote) {
    parts.push('')
    parts.push(`_${cq.contextNote}_`)
  }

  return parts.join('\n')
}

/**
 * Given a director's selection response (e.g. "1", "option 2", "the first one"),
 * return the selected ClarificationOption's triggerPhrase, or null if unparseable.
 */
export function parseOptionSelection(
  text: string,
  options: ClarificationOption[],
): ClarificationOption | null {
  const lower = text.toLowerCase().trim()

  // Numeric selection: "1", "2", "3", "4"
  const numMatch = lower.match(/^(\d)/)
  if (numMatch) {
    const idx = parseInt(numMatch[1], 10) - 1
    return options[idx] ?? null
  }

  // Keyword match against option labels
  for (const option of options) {
    if (lower.includes(option.label.toLowerCase().slice(0, 12))) {
      return option
    }
  }

  return null
}

/**
 * Returns true when the confidence is below the threshold at which clarification is needed.
 * Exported for consistent threshold usage across the stack.
 */
export { isClarificationNeeded }
