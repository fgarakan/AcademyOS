// Mega Sprint 2951–2960 — DONNA Conversational Continuity + Completion Repair V1
// Completion Detector
//
// Detects explicit completion signals ("done", "finished", "handled") and
// builds a two-part completion response:
//   1. Confirmation that the arc is closed
//   2. Suggested next priority (based on what the arc was about)
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Only fires when an active ConversationNavigatorState is present.
//   - Always captures the concept and entity from the active state.
//   - Always suggests a next priority after marking completion.

import type { ConversationNavigatorState } from './donnaConversationNavigator'
import type { AcademyOSConcept } from './donnaMeaningExtractor'

// ── Completion phrase list ────────────────────────────────────────────────────

const COMPLETION_PHRASES: string[] = [
  'done', 'finished', 'handled', 'completed', 'resolved', 'sorted',
  "that's done", "it's done", "all done", "we're done", 'done with that',
  'took care of it', 'took care of that', 'all set', "it's handled",
  "that's handled", 'taken care of',
]

/**
 * Returns true when the text is an explicit completion signal that should
 * mark the active conversation arc as done.
 */
export function isCompletionPhrase(lower: string): boolean {
  const stripped = lower.replace(/[.!?,]$/, '').trim()
  return COMPLETION_PHRASES.includes(stripped)
}

// ── Concept → next priority suggestions ──────────────────────────────────────

interface NextPrioritySuggestion {
  text: string
  route?: string
}

function getNextPriority(
  concept: AcademyOSConcept | null,
  entity: string | null,
): NextPrioritySuggestion {
  const name = entity ?? 'this area'

  switch (concept) {
    case 'parent_concern':
    case 'communication_issue':
      return {
        text: `Next priority: check if any other families show similar patterns — want me to pull up the parent engagement view?`,
        route: '/director/communications',
      }

    case 'enrollment_issue':
      return {
        text: `Next priority: review group enrollment levels across all programs — want me to open the enrollment dashboard?`,
        route: '/director/programs',
      }

    case 'retention_risk':
      return {
        text: `Next priority: check other players at similar risk levels — want me to surface the retention risk list?`,
        route: '/director/players',
      }

    case 'progression_issue':
    case 'readiness_issue':
    case 'advancement_opportunity':
      return {
        text: `Next priority: review upcoming assessment windows — want me to open the player progression view?`,
        route: '/director/players',
      }

    case 'engagement_issue':
    case 'session_quality':
    case 'effort_issue':
    case 'focus_issue':
      return {
        text: `Next priority: check session notes from ${name} over the last two weeks — want me to open session history?`,
        route: '/director/sessions',
      }

    case 'curriculum_issue':
    case 'grouping_issue':
      return {
        text: `Next priority: review the group structure and curriculum map for this level — want me to open programs?`,
        route: '/director/programs',
      }

    case 'coach_behavior_gap':
    case 'coach_execution_issue':
      return {
        text: `Next priority: check coach observation completion rates — want me to open the coach oversight view?`,
        route: '/director/coaches',
      }

    case 'assessment_need':
      return {
        text: `Next priority: schedule the next assessment block — want me to open the scheduling view?`,
        route: '/director/schedule',
      }

    case 'confidence_issue':
      return {
        text: `Next priority: check if ${name} has any notes from recent sessions — want me to pull up their profile?`,
        route: '/director/players',
      }

    case 'expectation_issue':
      return {
        text: `Next priority: review the communication log with this family — want me to open the parent view?`,
        route: '/director/communications',
      }

    case 'attendance_issue':
      return {
        text: `Next priority: check attendance trends across all groups this month — want me to open the attendance view?`,
        route: '/director/sessions',
      }

    case 'scheduling_question':
      return {
        text: `Next priority: confirm the schedule is up to date — want me to open the schedule view?`,
        route: '/director/schedule',
      }

    default:
      return {
        text: `What would you like to focus on next — players, coaches, programs, or communications?`,
      }
  }
}

// ── Confirmation message builders ─────────────────────────────────────────────

function buildConfirmation(
  concept: AcademyOSConcept | null,
  entity: string | null,
  turnCount: number,
): string {
  const entityPart = entity ? ` on ${entity}` : ''
  const arcLength = turnCount > 1 ? ` across ${turnCount} turns` : ''

  if (concept) {
    const label = concept.replace(/_/g, ' ')
    return `Got it — marking the ${label} concern${entityPart} as handled${arcLength}. Learning captured.`
  }

  return `Done${entityPart}. Arc closed${arcLength}. Learning captured.`
}

// ── Main completion response builder ─────────────────────────────────────────

export interface CompletionResponse {
  confirmation: string
  nextPriority: string
  suggestedRoute: string | null
  full: string
}

/**
 * Build a two-part completion response: confirmation + next priority.
 *
 * The caller is responsible for:
 * 1. Calling captureConversationLearning() + bridgeConversationRecord()
 * 2. Advancing navigator state to 'completion' via advanceConversation()
 */
export function buildCompletionResponse(
  state: ConversationNavigatorState,
): CompletionResponse {
  const confirmation = buildConfirmation(state.topConcept, state.extractedEntity, state.turnCount)
  const suggestion = getNextPriority(state.topConcept, state.extractedEntity)

  return {
    confirmation,
    nextPriority: suggestion.text,
    suggestedRoute: suggestion.route ?? null,
    full: `${confirmation}\n\n${suggestion.text}`,
  }
}
