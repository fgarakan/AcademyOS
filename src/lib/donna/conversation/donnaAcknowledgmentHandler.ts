// Mega Sprint 2951–2960 — DONNA Conversational Continuity + Completion Repair V1
// Acknowledgment Handler
//
// Detects short acknowledgment phrases ("okay", "got it", "understood") and
// builds a continuation response that advances the active navigator state
// rather than restarting interpretation.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Only fires when an active ConversationNavigatorState is present.
//   - Never restarts the clarification loop.
//   - Response is stage-aware: understands where in the arc the director is.

import type { ConversationNavigatorState } from './donnaConversationNavigator'
import type { AcademyOSConcept } from './donnaMeaningExtractor'

// ── Acknowledgment phrase list ────────────────────────────────────────────────

const ACKNOWLEDGMENT_PHRASES: string[] = [
  'okay', 'ok', 'got it', 'understood', 'noted', 'alright', 'sounds good',
  'sure', 'makes sense', 'right', 'yes', 'yep', 'yup', 'cool', 'thanks',
  'thank you', 'great', 'perfect', 'good', 'fine',
]

/**
 * Returns true when the text is a short acknowledgment that should advance
 * the active conversation rather than restart interpretation.
 */
export function isAcknowledgmentPhrase(lower: string): boolean {
  const stripped = lower.replace(/[.!?,]$/, '').trim()
  return ACKNOWLEDGMENT_PHRASES.includes(stripped)
}

// ── Concept label map ─────────────────────────────────────────────────────────

const CONCEPT_LABELS: Partial<Record<AcademyOSConcept, string>> = {
  enrollment_issue:         'enrollment',
  retention_risk:           'retention risk',
  parent_concern:           'parent concern',
  progression_issue:        'player progression',
  engagement_issue:         'session engagement',
  session_quality:          'session quality',
  grouping_issue:           'group composition',
  confidence_issue:         'player confidence',
  assessment_need:          'assessment timing',
  advancement_opportunity:  'advancement readiness',
  curriculum_issue:         'curriculum fit',
  coach_behavior_gap:       'coach behavior',
  focus_issue:              'session focus',
  effort_issue:             'player effort',
  readiness_issue:          'player readiness',
  communication_issue:      'communication gap',
  attendance_issue:         'attendance',
  expectation_issue:        'expectation gap',
  coach_execution_issue:    'coach execution',
  scheduling_question:      'scheduling',
}

// ── Response builders by stage ────────────────────────────────────────────────

function buildQuestionStageResponse(state: ConversationNavigatorState): string {
  const concept = state.topConcept
  const entity = state.extractedEntity

  if (concept) {
    const label = CONCEPT_LABELS[concept] ?? concept.replace(/_/g, ' ')
    const entityPart = entity ? ` for ${entity}` : ''
    return `Got it. To help you with ${label}${entityPart}, I need one more detail. ${getConceptFollowUp(concept, entity)}`
  }

  return "Understood. What's the main concern — is it about a specific player, a group, or a broader academy pattern?"
}

function buildUnderstandingStageResponse(state: ConversationNavigatorState): string {
  const concept = state.topConcept
  const entity = state.extractedEntity
  const entityPart = entity ? ` for ${entity}` : ''

  if (concept) {
    const label = CONCEPT_LABELS[concept] ?? concept.replace(/_/g, ' ')
    return `Okay — I've noted the ${label} concern${entityPart}. Let me frame the next step.`
  }

  return `Okay${entityPart}. Let me frame what we should do next.`
}

function buildActionStageResponse(state: ConversationNavigatorState): string {
  const entity = state.extractedEntity
  const proposed = state.proposedActionType

  if (proposed && entity) {
    return `Got it${entity ? ` — continuing with ${entity}` : ''}. Ready to proceed when you are.`
  }
  if (entity) {
    return `Understood. Continuing with ${entity}. What would you like to do next — draft, flag, or navigate?`
  }
  return "Got it. The action is queued. Would you like to draft, flag for review, or navigate to the relevant section?"
}

function getConceptFollowUp(concept: AcademyOSConcept, entity: string | null): string {
  const name = entity ?? 'this area'
  switch (concept) {
    case 'parent_concern':
      return `Is this concern about one family or a pattern across several?`
    case 'enrollment_issue':
      return `Which group are you most concerned about — or is this academy-wide?`
    case 'progression_issue':
      return `Is this about one player specifically, or are several players stalling?`
    case 'retention_risk':
      return `Is ${name} showing disengagement signals, or is this a family-level concern?`
    case 'engagement_issue':
      return `Was this a one-off session issue, or have you been seeing this pattern?`
    case 'session_quality':
      return `What was the main issue — effort, focus, curriculum, or energy level?`
    case 'curriculum_issue':
      return `Is the content too hard, too easy, or just not landing with the group?`
    case 'grouping_issue':
      return `Is the group struggling with mixed skill levels, or something else?`
    default:
      return `Can you give me one more detail so I can frame the right next step?`
  }
}

// ── Main response builder ─────────────────────────────────────────────────────

/**
 * Build a stage-aware continuation response for an acknowledgment phrase.
 *
 * Returns the display text DONNA should show. The caller is responsible for
 * advancing the navigator state via advanceConversation().
 */
export function buildAcknowledgmentContinuationResponse(
  state: ConversationNavigatorState,
): string {
  switch (state.stage) {
    case 'question':
      return buildQuestionStageResponse(state)

    case 'understanding':
      return buildUnderstandingStageResponse(state)

    case 'action':
      return buildActionStageResponse(state)

    case 'completion':
      return "We've wrapped that one up. What would you like to tackle next?"

    case 'blocked':
      return "This action requires director approval through the Review Center. Want me to open it?"

    default:
      return "Understood. Ready when you are — what's next?"
  }
}
