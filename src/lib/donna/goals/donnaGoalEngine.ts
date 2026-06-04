// Sprint 1831–1860 — DONNA Intent, Goal & Continuity Engine V1
// Goal Engine
//
// Maps: Intent → Entity → Goal → Workflow Candidate
//
// The full resolution chain:
//   director text
//     → donnaIntentEngine  (what are they trying to do?)
//     → donnaEntityResolver (who/what are they talking about?)
//     → donnaGoalEngine    (what outcome are they trying to achieve?)
//     → guidedCompletionRegistry (which workflow gets them there?)
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Goal confidence is blended from intent + entity confidence.
//   - Workflow candidates link to the guided completion registry.
//   - Approval-safe: goal resolution never triggers mutations.

import type { IntentResult, DirectorIntent } from '../intent/donnaIntentEngine'
import type { EntityResolutionResult } from '../entities/donnaEntityResolver'
import { resolveEntities } from '../entities/donnaEntityResolver'
import { classifyIntent } from '../intent/donnaIntentEngine'
import {
  blendConfidence,
  isClarificationNeeded,
  toConfidenceLevel,
  CONFIDENCE_ACT_THRESHOLD,
} from '../intent/confidenceScoring'
import type { GuidedWorkflowId } from '../guidedCompletion/guidedCompletionRegistry'

// ── Goal types ────────────────────────────────────────────────────────────────

export type DirectorGoal =
  | 'curriculum_completion'
  | 'academy_setup_completion'
  | 'player_onboarding_completion'
  | 'assessment_completion'
  | 'parent_update_completion'
  | 'readiness_review_completion'
  | 'player_progress_review'
  | 'class_template_completion'
  | 'fitness_template_completion'
  | 'review_queue_clear'
  | 'session_review_completion'
  | 'attendance_completion'
  | 'general_guidance'

// ── Goal result ───────────────────────────────────────────────────────────────

export interface GoalResult {
  goal: DirectorGoal
  confidence: number
  possibleGoals: Array<{ goal: DirectorGoal; confidence: number }>
  /** Linked guided completion workflow, or null if no workflow exists for this goal */
  workflowCandidate: GuidedWorkflowId | null
  clarificationNeeded: boolean
  clarificationQuestion: string | null
  /** Entity subject label: "Orange Ball 2", "Jamie Chen" */
  subjectLabel: string | null
  /** Human-readable goal description */
  goalDescription: string
  /** Recommended director route for this goal */
  recommendedRoute: string | null
  /** Intent that produced this goal */
  sourceIntent: DirectorIntent
  reasoning: string
}

// ── Goal definitions ──────────────────────────────────────────────────────────

interface GoalDefinition {
  goal: DirectorGoal
  description: string
  route: string | null
  workflowCandidate: GuidedWorkflowId | null
}

const GOAL_DEFINITIONS: Record<DirectorGoal, GoalDefinition> = {
  curriculum_completion: {
    goal: 'curriculum_completion',
    description: 'Complete a curriculum level definition with goal, skills, drills, and assessment criteria.',
    route: '/director/curriculum',
    workflowCandidate: 'curriculum_builder_completion',
  },
  academy_setup_completion: {
    goal: 'academy_setup_completion',
    description: 'Complete academy setup: philosophy, curriculum structure, coaches, and parent portal.',
    route: '/director/onboarding',
    workflowCandidate: 'academy_setup_completion',
  },
  player_onboarding_completion: {
    goal: 'player_onboarding_completion',
    description: 'Add a new player: name, age, level placement, coach, group, and parent link.',
    route: '/director/players',
    workflowCandidate: 'player_onboarding_completion',
  },
  assessment_completion: {
    goal: 'assessment_completion',
    description: 'Complete a structured player assessment across development domains.',
    route: '/director/players',
    workflowCandidate: 'assessment_completion',
  },
  parent_update_completion: {
    goal: 'parent_update_completion',
    description: 'Draft a parent-safe progress update for director review and approval.',
    route: '/director/review',
    workflowCandidate: 'parent_update_completion',
  },
  readiness_review_completion: {
    goal: 'readiness_review_completion',
    description: 'Review level readiness signals and decide whether to advance a player.',
    route: '/director/level-up',
    workflowCandidate: null,
  },
  player_progress_review: {
    goal: 'player_progress_review',
    description: "Review a player's development signals, coach observations, and current priorities.",
    route: '/director/players',
    workflowCandidate: null,
  },
  class_template_completion: {
    goal: 'class_template_completion',
    description: 'Build a class template with block structure, drills, and curriculum level.',
    route: '/director/templates',
    workflowCandidate: 'template_builder_completion',
  },
  fitness_template_completion: {
    goal: 'fitness_template_completion',
    description: 'Build a fitness template for use in training sessions.',
    route: '/director/templates',
    workflowCandidate: 'template_builder_completion',
  },
  review_queue_clear: {
    goal: 'review_queue_clear',
    description: 'Process all pending review queue items — approve, reject, or defer.',
    route: '/director/review',
    workflowCandidate: null,
  },
  session_review_completion: {
    goal: 'session_review_completion',
    description: 'Review a session debrief, wrap-up, and attendance record.',
    route: '/director/sessions',
    workflowCandidate: null,
  },
  attendance_completion: {
    goal: 'attendance_completion',
    description: 'Record or verify attendance for a session.',
    route: '/director/sessions',
    workflowCandidate: null,
  },
  general_guidance: {
    goal: 'general_guidance',
    description: 'Get general guidance about AcademyOS and decide what to do next.',
    route: '/director',
    workflowCandidate: null,
  },
}

// ── Intent → Goal mapping ─────────────────────────────────────────────────────

interface GoalCandidate {
  goal: DirectorGoal
  weight: number
}

const INTENT_TO_GOALS: Record<DirectorIntent, GoalCandidate[]> = {
  curriculum_help: [
    { goal: 'curriculum_completion',      weight: 0.90 },
    { goal: 'readiness_review_completion', weight: 0.40 },
  ],
  player_progress_review: [
    { goal: 'player_progress_review',     weight: 0.90 },
    { goal: 'assessment_completion',      weight: 0.50 },
    { goal: 'readiness_review_completion', weight: 0.45 },
    { goal: 'parent_update_completion',   weight: 0.30 },
  ],
  parent_communication: [
    { goal: 'parent_update_completion',   weight: 0.95 },
    { goal: 'player_progress_review',     weight: 0.30 },
  ],
  assessment: [
    { goal: 'assessment_completion',      weight: 0.95 },
    { goal: 'player_progress_review',     weight: 0.40 },
  ],
  onboarding_setup: [
    { goal: 'academy_setup_completion',   weight: 0.90 },
    { goal: 'player_onboarding_completion', weight: 0.40 },
  ],
  template_building: [
    { goal: 'class_template_completion',  weight: 0.85 },
    { goal: 'fitness_template_completion', weight: 0.50 },
  ],
  level_readiness: [
    { goal: 'readiness_review_completion', weight: 0.90 },
    { goal: 'player_progress_review',     weight: 0.50 },
    { goal: 'assessment_completion',      weight: 0.40 },
  ],
  session_review: [
    { goal: 'session_review_completion',  weight: 0.90 },
    { goal: 'attendance_completion',      weight: 0.40 },
  ],
  review_queue: [
    { goal: 'review_queue_clear',         weight: 0.95 },
  ],
  attendance: [
    { goal: 'attendance_completion',      weight: 0.95 },
    { goal: 'session_review_completion',  weight: 0.35 },
  ],
  general_help: [
    { goal: 'general_guidance',           weight: 0.80 },
  ],
  unknown: [
    { goal: 'general_guidance',           weight: 0.40 },
  ],
}

// ── Goal descriptions ─────────────────────────────────────────────────────────

const GOAL_LABELS: Record<DirectorGoal, string> = {
  curriculum_completion:        'Complete a curriculum level',
  academy_setup_completion:     'Finish academy setup',
  player_onboarding_completion: 'Add a new player',
  assessment_completion:        'Complete a player assessment',
  parent_update_completion:     'Create a parent update',
  readiness_review_completion:  'Review level readiness',
  player_progress_review:       'Review player progress',
  class_template_completion:    'Build a class template',
  fitness_template_completion:  'Build a fitness template',
  review_queue_clear:           'Clear the review queue',
  session_review_completion:    'Review a session',
  attendance_completion:        'Record attendance',
  general_guidance:             'Get general guidance',
}

export { GOAL_LABELS }

// ── Resolution ────────────────────────────────────────────────────────────────

/**
 * Resolve an IntentResult + EntityResolutionResult to a GoalResult.
 * Confidence is blended from intent + entity signals.
 */
export function resolveIntentToGoal(
  intentResult: IntentResult,
  entityResult: EntityResolutionResult,
): GoalResult {
  const candidates = INTENT_TO_GOALS[intentResult.intent] ?? [
    { goal: 'general_guidance' as DirectorGoal, weight: 0.4 },
  ]

  // Blend goal confidence from intent confidence + entity presence boost
  const entityBoost = entityResult.primary ? Math.min(entityResult.primary.confidence * 0.2, 0.15) : 0

  const scoredGoals = candidates.map(({ goal, weight }) => ({
    goal,
    confidence: Math.min(blendConfidence(intentResult.confidence, 0.7, weight, 0.3) + entityBoost, 1.0),
  })).sort((a, b) => b.confidence - a.confidence)

  const best = scoredGoals[0] ?? { goal: 'general_guidance' as DirectorGoal, confidence: 0.3 }
  const def = GOAL_DEFINITIONS[best.goal]

  const clarificationNeeded = isClarificationNeeded(best.confidence) || intentResult.clarificationNeeded
  const subjectLabel = entityResult.primary?.normalizedLabel ?? intentResult.extractedEntity ?? null

  const goalDescription = subjectLabel
    ? `${def.description} (${subjectLabel})`
    : def.description

  const clarificationQuestion = clarificationNeeded
    ? buildGoalClarification(intentResult, entityResult, scoredGoals.slice(0, 3))
    : null

  const reasoning =
    `Goal: ${best.goal} (${Math.round(best.confidence * 100)}%). ` +
    `Intent: ${intentResult.intent}. ` +
    (subjectLabel ? `Entity: "${subjectLabel}".` : 'No entity.')

  return {
    goal: best.goal,
    confidence: best.confidence,
    possibleGoals: scoredGoals.slice(0, 4),
    workflowCandidate: def.workflowCandidate,
    clarificationNeeded,
    clarificationQuestion,
    subjectLabel,
    goalDescription,
    recommendedRoute: def.route,
    sourceIntent: intentResult.intent,
    reasoning,
  }
}

/**
 * Convenience: resolve directly from text + pathname.
 * Runs intent engine + entity resolver + goal engine in sequence.
 */
export function resolveTextToGoal(text: string, pathname = '/director'): GoalResult {
  const intentResult = classifyIntent(text, pathname)
  const entityResult = resolveEntities(text)
  return resolveIntentToGoal(intentResult, entityResult)
}

// ── DONNA response builder ────────────────────────────────────────────────────

/**
 * Build DONNA's opening statement when a goal is inferred.
 * E.g.: "I think you're trying to complete the Orange Ball 2 curriculum. Is that right?"
 */
export function buildGoalInferenceMessage(goal: GoalResult): string {
  const subjectPart = goal.subjectLabel ? ` — ${goal.subjectLabel}` : ''
  const label = GOAL_LABELS[goal.goal] ?? goal.goal
  const conf = Math.round(goal.confidence * 100)

  if (goal.confidence >= CONFIDENCE_ACT_THRESHOLD) {
    const workflow = goal.workflowCandidate
      ? ` I can walk you through it step by step.`
      : ` Let me help you get there.`
    return `I think you're trying to: **${label}${subjectPart}**.${workflow}`
  }

  if (goal.confidence >= 0.50) {
    return (
      goal.clarificationQuestion ??
      `I think you might be trying to **${label}${subjectPart}** (${conf}% confident). Is that right?`
    )
  }

  return goal.clarificationQuestion ?? "Could you tell me a bit more about what you'd like to accomplish?"
}

// ── Clarification builder ─────────────────────────────────────────────────────

function buildGoalClarification(
  intentResult: IntentResult,
  entityResult: EntityResolutionResult,
  topGoals: Array<{ goal: DirectorGoal; confidence: number }>,
): string {
  const subject = entityResult.primary?.normalizedLabel ?? intentResult.extractedEntity
  const subjectPart = subject ? ` about **${subject}**` : ''

  if (topGoals.length === 0) {
    return "Could you give me a bit more context about what you'd like to accomplish?"
  }

  const options = topGoals
    .slice(0, 3)
    .map((g, i) => `${i + 1}. ${GOAL_LABELS[g.goal] ?? g.goal}`)
    .join('\n')

  return `I want to make sure I understand correctly${subjectPart}. Would you like to:\n\n${options}\n\nOr describe what you need in your own words.`
}
