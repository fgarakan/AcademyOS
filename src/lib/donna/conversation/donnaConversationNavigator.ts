// Sprint 2831–2860 — DONNA Conversational Intelligence & Learning Foundation V1
// Part 5 — Conversation Navigator
//
// Manages the Question → Understanding → Action → Completion state flow.
// Ensures DONNA always moves forward toward a concrete outcome.
//
// State machine:
//   question      — DONNA needs more information
//   understanding — DONNA has enough to frame the issue
//   action        — DONNA is proposing or creating something
//   completion    — Task is done; wrap-up and next step offered
//
// Separate from donnaConversationNavigation.ts (which handles page routing).
// This module handles conversational state, not routing state.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Each turn consumes the current state and produces an updated state.
//   - State is immutable — every update produces a new state object.
//   - Never goes backward. Always advances or holds at action/completion.

import type { InterpreterRole } from './donnaIntentInterpreter'
import type { AcademyOSConcept } from './donnaMeaningExtractor'

// ── State types ───────────────────────────────────────────────────────────────

export type ConversationStage =
  | 'question'        // collecting more information
  | 'understanding'   // interpreting what the user means
  | 'action'          // proposing or executing a DONNA output
  | 'completion'      // task done, next step offered
  | 'blocked'         // safety gate or out-of-scope

// ── Navigator state ───────────────────────────────────────────────────────────

export interface ConversationNavigatorState {
  stage: ConversationStage
  role: InterpreterRole
  clarificationCount: number          // how many clarification questions asked
  topConcept: AcademyOSConcept | null
  intentConfidence: number            // 0–1
  extractedEntity: string | null      // player name, group name, etc.
  proposedActionType: string | null   // what DONNA is proposing
  completionRoute: string | null      // next navigation route on completion
  turnCount: number
  lastTurnAt: string                  // ISO timestamp
  history: ConversationTurn[]
}

export interface ConversationTurn {
  turnIndex: number
  stage: ConversationStage
  userText: string
  donnaResponse: string
  conceptDetected: AcademyOSConcept | null
  confidence: number
}

// ── Navigator output ──────────────────────────────────────────────────────────

export interface NavigatorOutput {
  updatedState: ConversationNavigatorState
  donnaResponse: string
  stage: ConversationStage
  suggestedRoute: string | null
  actionProposed: string | null
  completionMessage: string | null
  canActNow: boolean
}

// ── Stage transition rules ────────────────────────────────────────────────────

interface StageTransitionInput {
  currentStage: ConversationStage
  clarificationCount: number
  intentConfidence: number
  hasDraftOutput: boolean
  isBlocked: boolean
  hasEntityContext: boolean
}

function computeNextStage(input: StageTransitionInput): ConversationStage {
  if (input.isBlocked) return 'blocked'

  if (input.hasDraftOutput) return 'completion'

  switch (input.currentStage) {
    case 'question':
      // After one clarification question, move to understanding regardless
      if (input.clarificationCount >= 1) return 'understanding'
      // High confidence — skip question stage
      if (input.intentConfidence >= 0.75) return 'understanding'
      return 'question'

    case 'understanding':
      // Once we have enough context, move to action
      if (input.intentConfidence >= 0.60 || input.hasEntityContext) return 'action'
      // Second turn — move to action anyway (contract: max 1 clarification)
      if (input.clarificationCount >= 1) return 'action'
      return 'understanding'

    case 'action':
      return 'action'  // hold until explicit completion signal

    case 'completion':
      return 'completion'  // terminal

    case 'blocked':
      return 'blocked'

    default:
      return 'question'
  }
}

// ── Response builders ─────────────────────────────────────────────────────────

function buildUnderstandingResponse(
  concept: AcademyOSConcept | null,
  entity: string | null,
  role: InterpreterRole,
): string {
  if (!concept) {
    return "Let me take a look at the current signals and give you a clear picture."
  }

  const entityPart = entity ? ` for ${entity}` : ''

  const UNDERSTANDING_RESPONSES: Record<string, string> = {
    enrollment_issue:          `Enrollment numbers${entityPart} — let me pull the current picture.`,
    retention_risk:            `Retention signal${entityPart} flagged. Let me check what we know.`,
    parent_concern:            `Parent concern${entityPart} noted. Let me see what data we have.`,
    progression_issue:         `Player stall${entityPart} detected. Checking development signals now.`,
    engagement_issue:          `Engagement gap${entityPart} identified. Let me frame the options.`,
    session_quality:           `Session issue logged${entityPart}. Let me help you capture what happened.`,
    grouping_issue:            `Group composition concern${entityPart}. Let me check current placement data.`,
    confidence_issue:          `Confidence signal${entityPart} noted. I\'ll flag this with relevant context.`,
    assessment_need:           `Assessment timing${entityPart} — checking the overdue list.`,
    advancement_opportunity:   `Advancement readiness${entityPart} — I\'ll pull the gate criteria.`,
    curriculum_issue:          `Curriculum gap${entityPart} — let me check what we have at this level.`,
    coach_behavior_gap:        `Coach behavior signal${entityPart}. Let me check current recap stats.`,
    focus_issue:               `Focus concern${entityPart} noted. Let me frame the next action.`,
    effort_issue:              `Effort signal${entityPart} noted. Let me help you document this.`,
    readiness_issue:           `Readiness concern${entityPart}. I\'ll check placement and assessment data.`,
    communication_issue:       `Communication gap${entityPart}. Let me draft a summary.`,
    attendance_issue:          `Attendance concern${entityPart}. Let me pull the recent numbers.`,
    expectation_issue:         `Expectation gap${entityPart} noted. Let me help align on what we track.`,
    parent_concern_signal:     `Parent concern${entityPart} noted. Flagging for director review.`,
    coach_execution_issue:     `Coach execution concern${entityPart}. Checking wrap-up compliance.`,
    scheduling_question:       `Schedule question${entityPart}. Let me pull the upcoming sessions.`,
  }

  return UNDERSTANDING_RESPONSES[concept] ?? `Understood${entityPart}. Let me frame the next step.`
}

function buildActionResponse(
  concept: AcademyOSConcept | null,
  entity: string | null,
  role: InterpreterRole,
): { response: string; actionType: string; route: string | null } {
  const entityPart = entity ? ` for ${entity}` : ''

  const ACTION_MAP: Record<string, { response: string; actionType: string; route: string | null }> = {
    enrollment_issue: {
      response: `Enrollment is down${entityPart}. Want me to draft a review of remaining capacity and an outreach recommendation?`,
      actionType: 'enrollment_review_draft',
      route: '/director/players',
    },
    retention_risk: {
      response: `Retention risk flagged${entityPart}. Want me to draft a parent engagement update for director review?`,
      actionType: 'parent_update_draft',
      route: '/director/review',
    },
    parent_concern: {
      response: `Parent concern captured${entityPart}. I\'ll draft a parent update for your review.`,
      actionType: 'parent_update_draft',
      route: '/director/review',
    },
    progression_issue: {
      response: `Player stall captured${entityPart}. Want me to flag this for an assessment review?`,
      actionType: 'assessment_flag',
      route: '/director/players',
    },
    engagement_issue: {
      response: `Engagement gap noted${entityPart}. I\'ll log this as a session observation for the wrap-up.`,
      actionType: 'session_observation',
      route: null,
    },
    session_quality: {
      response: `Session note captured${entityPart}. Let\'s complete the wrap-up — I\'ll guide you through it.`,
      actionType: 'wrap_up_completion',
      route: '/coach/sessions',
    },
    grouping_issue: {
      response: `Group concern${entityPart} noted. Want to review current player placement, or flag for a director discussion?`,
      actionType: 'placement_review',
      route: '/director/players',
    },
    confidence_issue: {
      response: `Confidence signal${entityPart} logged. Want to flag this for the director to review?`,
      actionType: 'player_flag',
      route: '/director/players',
    },
    assessment_need: {
      response: `Assessment need flagged${entityPart}. Want me to add this to the director\'s attention queue?`,
      actionType: 'assessment_flag',
      route: '/director/review',
    },
    advancement_opportunity: {
      response: `Advancement readiness${entityPart} noted. I\'ll prepare a readiness review for director approval.`,
      actionType: 'advancement_draft',
      route: '/director/review',
    },
    curriculum_issue: {
      response: `Curriculum issue${entityPart} captured. Want to flag this for the curriculum builder?`,
      actionType: 'curriculum_flag',
      route: '/director/curriculum',
    },
  }

  const action = ACTION_MAP[concept ?? '']

  if (!action) {
    return {
      response: `I\'ve logged this${entityPart}. What would you like to do next — create a draft, flag for review, or navigate somewhere?`,
      actionType: 'general_capture',
      route: null,
    }
  }

  return action
}

// ── Initial state ─────────────────────────────────────────────────────────────

export function createInitialNavigatorState(role: InterpreterRole): ConversationNavigatorState {
  return {
    stage: 'question',
    role,
    clarificationCount: 0,
    topConcept: null,
    intentConfidence: 0,
    extractedEntity: null,
    proposedActionType: null,
    completionRoute: null,
    turnCount: 0,
    lastTurnAt: new Date().toISOString(),
    history: [],
  }
}

// ── Main navigator ────────────────────────────────────────────────────────────

/**
 * Advance the conversation one turn.
 *
 * Takes the current state and new turn inputs, returns updated state and DONNA's response.
 */
export function advanceConversation(
  state: ConversationNavigatorState,
  input: {
    userText: string
    topConcept: AcademyOSConcept | null
    intentConfidence: number
    extractedEntity: string | null
    hasDraftOutput?: boolean
    isBlocked?: boolean
    donnaQuestionAsked?: boolean
  },
): NavigatorOutput {
  const {
    userText,
    topConcept,
    intentConfidence,
    extractedEntity,
    hasDraftOutput = false,
    isBlocked = false,
    donnaQuestionAsked = false,
  } = input

  const newClarificationCount = state.clarificationCount + (donnaQuestionAsked ? 1 : 0)

  const nextStage = computeNextStage({
    currentStage: state.stage,
    clarificationCount: newClarificationCount,
    intentConfidence,
    hasDraftOutput,
    isBlocked,
    hasEntityContext: Boolean(extractedEntity ?? state.extractedEntity),
  })

  let donnaResponse = ''
  let actionProposed: string | null = null
  let suggestedRoute: string | null = null
  let completionMessage: string | null = null
  let canActNow = false

  const entity = extractedEntity ?? state.extractedEntity
  const concept = topConcept ?? state.topConcept

  switch (nextStage) {
    case 'question':
      donnaResponse = "I need one more detail to help you precisely."
      break

    case 'understanding':
      donnaResponse = buildUnderstandingResponse(concept, entity, state.role)
      canActNow = intentConfidence >= 0.60
      break

    case 'action': {
      const action = buildActionResponse(concept, entity, state.role)
      donnaResponse = action.response
      actionProposed = action.actionType
      suggestedRoute = action.route
      canActNow = true
      break
    }

    case 'completion':
      completionMessage = entity
        ? `Done. I\'ve captured this for ${entity}.`
        : `Done. Your next step is in the Review Center.`
      donnaResponse = completionMessage
      suggestedRoute = state.completionRoute
      canActNow = false
      break

    case 'blocked':
      donnaResponse = "I can\'t proceed — this action requires director approval through the Review Center."
      canActNow = false
      break
  }

  const newTurn: ConversationTurn = {
    turnIndex: state.turnCount,
    stage: nextStage,
    userText,
    donnaResponse,
    conceptDetected: topConcept,
    confidence: intentConfidence,
  }

  const updatedState: ConversationNavigatorState = {
    ...state,
    stage: nextStage,
    clarificationCount: newClarificationCount,
    topConcept: concept,
    intentConfidence,
    extractedEntity: entity,
    proposedActionType: actionProposed,
    completionRoute: suggestedRoute ?? state.completionRoute,
    turnCount: state.turnCount + 1,
    lastTurnAt: new Date().toISOString(),
    history: [...state.history, newTurn],
  }

  return {
    updatedState,
    donnaResponse,
    stage: nextStage,
    suggestedRoute,
    actionProposed,
    completionMessage,
    canActNow,
  }
}

// ── Diagnostics ───────────────────────────────────────────────────────────────

/**
 * Returns a short summary of the current conversation state for debugging.
 */
export function describeNavigatorState(state: ConversationNavigatorState): string {
  return [
    `Stage: ${state.stage}`,
    `Turns: ${state.turnCount}`,
    `Concept: ${state.topConcept ?? 'none'}`,
    `Confidence: ${(state.intentConfidence * 100).toFixed(0)}%`,
    `Entity: ${state.extractedEntity ?? 'none'}`,
    `Clarifications asked: ${state.clarificationCount}`,
  ].join(' | ')
}
