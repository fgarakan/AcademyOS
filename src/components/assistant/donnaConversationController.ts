// Sprint 319 — Donna Conversation Controller V1
// Pure TypeScript. No DB, no API, no async, no React.
//
// Full conversation orchestration layer. Takes a director input string,
// uses the intent router to classify it, and returns a ConversationTurn
// describing exactly what Donna should say and do next.
//
// DonnaAssistantButton.tsx (Phase 7) calls handleInput() at the top of its
// command routing pipeline, replacing the scattered inline routing logic.
//
// State is immutable: each call returns a new ConversationState.

import { classifyIntent } from './donnaIntentRouter'
import type { DonnaIntentResult, WorkflowId, IntentType } from './donnaIntentRouter'
import { getWorkflow } from './donnaWorkflowRegistry'
import {
  createDraft,
  updateDraft,
  undoLastChange,
  resetDraft,
  getNextQuestion,
  getMissingSlots,
  summarizeDraft,
  toCollectedFields,
  markReadyForReview,
} from './donnaDraftRuntime'
import type { DonnaDraftState } from './donnaDraftRuntime'
import { extractSlots } from './donnaSlotFilling'
import type { DonnaTaskId } from './donnaTaskContracts'
import { DONNA_TASK_CONTRACTS } from './donnaTaskContracts'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ConversationPhase =
  | 'idle'              // no active task
  | 'collecting'        // in a guided draft, asking questions
  | 'ready_for_review'  // draft complete, awaiting director button
  | 'approved'          // director approved — execution pending
  | 'cancelled'         // director cancelled

export interface ConversationState {
  phase: ConversationPhase
  activeDraft: DonnaDraftState | null
  /** The last classified intent — used by DonnaAssistantButton for routing */
  lastIntent: DonnaIntentResult | null
  /** Current field being asked — null when not collecting */
  currentFieldId: string | null
}

export interface ConversationTurn {
  /** Updated conversation state after this turn */
  nextState: ConversationState
  /** What Donna should say out loud */
  speakText: string
  /** Optional secondary display message (different from spoken text) */
  displayMessage: string | null
  /** True when Donna expects another input from the director */
  expectingInput: boolean
  /** When true, show the draft review panel on screen */
  showDraftReview: boolean
  /** Action the conversation expects the UI layer to perform */
  uiAction: ConversationUiAction
}

export type ConversationUiAction =
  | { type: 'none' }
  | { type: 'open_review_queue' }
  | { type: 'navigate'; destination: string }
  | { type: 'open_onboarding' }
  | { type: 'start_template_draft'; initialText: string }  // hands off to TemplateDraftPanel
  | { type: 'show_draft_review' }                          // show review panel
  | { type: 'close_draft' }                                // clear draft state
  | { type: 'fetch_context' }                              // context summary request

// ── Initial state ──────────────────────────────────────────────────────────────

export function createConversationState(): ConversationState {
  return {
    phase: 'idle',
    activeDraft: null,
    lastIntent: null,
    currentFieldId: null,
  }
}

// ── Private helpers ────────────────────────────────────────────────────────────

function idleTurn(state: ConversationState, speakText: string, displayMessage?: string): ConversationTurn {
  return {
    nextState: state,
    speakText,
    displayMessage: displayMessage ?? null,
    expectingInput: true,
    showDraftReview: false,
    uiAction: { type: 'none' },
  }
}

function buildCollectingTurn(
  state: ConversationState,
  draft: DonnaDraftState,
  speakText: string,
): ConversationTurn {
  const nextQ = getNextQuestion(draft)
  return {
    nextState: {
      ...state,
      phase: 'collecting',
      activeDraft: draft,
      currentFieldId: nextQ?.fieldId ?? null,
    },
    speakText,
    displayMessage: null,
    expectingInput: true,
    showDraftReview: false,
    uiAction: { type: 'none' },
  }
}

function buildReadyForReviewTurn(
  state: ConversationState,
  draft: DonnaDraftState,
  workflow: ReturnType<typeof getWorkflow>,
): ConversationTurn {
  const readyLine = workflow?.readyForReviewLine ??
    'The draft is ready. Review it on screen before approving.'
  return {
    nextState: {
      ...state,
      phase: 'ready_for_review',
      activeDraft: draft,
      currentFieldId: null,
    },
    speakText: readyLine,
    displayMessage: null,
    expectingInput: false,
    showDraftReview: true,
    uiAction: { type: 'show_draft_review' },
  }
}

// ── Main entry point ───────────────────────────────────────────────────────────

/**
 * Process a director input string against the current conversation state.
 * Returns a ConversationTurn describing what Donna should do next.
 *
 * Call this at the top of every input handler (voice transcript or typed submit).
 * The returned nextState replaces the current ConversationState in the caller.
 */
export function handleInput(
  text: string,
  state: ConversationState,
): ConversationTurn {
  const intent = classifyIntent(text)
  const stateWithIntent: ConversationState = { ...state, lastIntent: intent }

  // ── Undo ────────────────────────────────────────────────────────────────────
  if (intent.intentType === 'undo') {
    if (!state.activeDraft || state.activeDraft.history.length === 0) {
      return idleTurn(stateWithIntent, "There's nothing to undo.")
    }
    const reverted = undoLastChange(state.activeDraft)
    const nextQ = getNextQuestion(reverted)
    const speakText = nextQ
      ? `Undone. ${nextQ.question}`
      : "Undone. The draft is back to its previous state."
    return buildCollectingTurn(stateWithIntent, reverted, speakText)
  }

  // ── Go back ─────────────────────────────────────────────────────────────────
  if (intent.intentType === 'go_back') {
    if (!state.activeDraft || state.activeDraft.history.length === 0) {
      return idleTurn(stateWithIntent, "There's nothing to go back to.")
    }
    const reverted = undoLastChange(state.activeDraft)
    const nextQ = getNextQuestion(reverted)
    const speakText = nextQ
      ? nextQ.question
      : "We're back at the start of this section."
    return buildCollectingTurn(stateWithIntent, reverted, speakText)
  }

  // ── Cancel ──────────────────────────────────────────────────────────────────
  if (intent.intentType === 'cancel') {
    return {
      nextState: { ...stateWithIntent, phase: 'cancelled', activeDraft: null, currentFieldId: null },
      speakText: "Cancelled. You can start a new task whenever you're ready.",
      displayMessage: null,
      expectingInput: true,
      showDraftReview: false,
      uiAction: { type: 'close_draft' },
    }
  }

  // ── Protected approval phrase ────────────────────────────────────────────────
  if (intent.intentType === 'approve_or_execute') {
    return idleTurn(
      stateWithIntent,
      intent.safeResponse,
      'Use the on-screen button to approve actions.',
    )
  }

  // ── Continue an active draft: treat input as the next field answer ───────────
  if (state.phase === 'collecting' && state.activeDraft && state.currentFieldId) {
    // Only treat as draft answer if not a navigation/workflow command
    const isRedirectIntent: IntentType[] = [
      'navigate', 'start_workflow', 'create_draft', 'general_question',
    ]
    if (!isRedirectIntent.includes(intent.intentType)) {
      const updated = updateDraft(state.activeDraft, state.currentFieldId, text)
      const workflow = getWorkflow(updated.workflowId ?? ('' as WorkflowId))

      if (updated.phase === 'ready_for_review') {
        const finalized = markReadyForReview(updated)
        return buildReadyForReviewTurn(stateWithIntent, finalized, workflow)
      }

      const nextQ = getNextQuestion(updated)
      const speakText = nextQ?.question ?? 'Draft is ready for review.'
      return buildCollectingTurn(stateWithIntent, updated, speakText)
    }
  }

  // ── Navigate ────────────────────────────────────────────────────────────────
  if (intent.intentType === 'navigate') {
    if (intent.workflowId === 'academy_setup') {
      return {
        nextState: { ...stateWithIntent, phase: 'idle' },
        speakText: intent.safeResponse,
        displayMessage: null,
        expectingInput: false,
        showDraftReview: false,
        uiAction: { type: 'open_onboarding' },
      }
    }
    if (intent.workflowId === 'review_queue') {
      return {
        nextState: { ...stateWithIntent, phase: 'idle' },
        speakText: intent.safeResponse,
        displayMessage: null,
        expectingInput: false,
        showDraftReview: false,
        uiAction: { type: 'open_review_queue' },
      }
    }
    const destination = intent.extractedSlots.destination
    if (destination) {
      return {
        nextState: { ...stateWithIntent, phase: 'idle' },
        speakText: intent.safeResponse,
        displayMessage: null,
        expectingInput: false,
        showDraftReview: false,
        uiAction: { type: 'navigate', destination },
      }
    }
    return idleTurn(stateWithIntent, intent.safeResponse)
  }

  // ── General question / context / suggestions ─────────────────────────────────
  if (intent.intentType === 'general_question') {
    return {
      nextState: { ...stateWithIntent, phase: 'idle' },
      speakText: intent.safeResponse,
      displayMessage: null,
      expectingInput: true,
      showDraftReview: false,
      uiAction: { type: 'fetch_context' },
    }
  }

  // ── Create draft (single-task) ───────────────────────────────────────────────
  if (intent.intentType === 'create_draft') {
    const { workflowId } = intent

    // Class template always hands off to TemplateDraftPanel
    if (workflowId === 'class_template_creation') {
      return {
        nextState: { ...stateWithIntent, phase: 'idle' },
        speakText: intent.safeResponse,
        displayMessage: null,
        expectingInput: true,
        showDraftReview: false,
        uiAction: { type: 'start_template_draft', initialText: text },
      }
    }

    // Review queue is a read operation — open the panel
    if (workflowId === 'review_queue') {
      return {
        nextState: { ...stateWithIntent, phase: 'idle' },
        speakText: intent.safeResponse,
        displayMessage: null,
        expectingInput: false,
        showDraftReview: false,
        uiAction: { type: 'open_review_queue' },
      }
    }

    // Generic task draft
    const workflow = workflowId ? getWorkflow(workflowId) : null
    const taskId = workflow?.primaryTaskId
    if (!taskId) {
      return idleTurn(
        stateWithIntent,
        intent.safeResponse,
        "I'm not sure how to help with that yet. Try a different command.",
      )
    }

    const slots = extractSlots(text, workflowId ?? null)
    const draft = createDraft(taskId, workflowId ?? null, slots)
    const nextQ = getNextQuestion(draft)

    if (!nextQ) {
      // All fields pre-filled by slots — go straight to review
      const finalized = markReadyForReview(draft)
      return buildReadyForReviewTurn(stateWithIntent, finalized, workflow)
    }

    const openingLine = workflow?.openingLine ?? intent.safeResponse
    const speakText = `${openingLine} ${nextQ.question}`
    return buildCollectingTurn(stateWithIntent, draft, speakText)
  }

  // ── Multi-step workflow ──────────────────────────────────────────────────────
  if (intent.intentType === 'start_workflow') {
    // Multi-step: start with the first step's task as a draft.
    // The controller only manages one step at a time; the UI layer
    // advances to the next step after each approval gate.
    const { workflowId } = intent
    const workflow = workflowId ? getWorkflow(workflowId) : null
    const firstStep = workflow?.steps[0]
    const taskId = firstStep?.taskId

    if (!taskId) {
      return idleTurn(stateWithIntent, intent.safeResponse)
    }

    const slots = extractSlots(text, workflowId ?? null)
    const draft = createDraft(taskId, workflowId ?? null, slots)
    const nextQ = getNextQuestion(draft)
    const openingLine = workflow?.openingLine ?? intent.safeResponse
    const speakText = nextQ ? `${openingLine} ${nextQ.question}` : openingLine
    return buildCollectingTurn(stateWithIntent, draft, speakText)
  }

  // ── Unknown ──────────────────────────────────────────────────────────────────
  return idleTurn(stateWithIntent, intent.safeResponse)
}

/**
 * Called by the UI layer when the director clicks "Approve and Save".
 * Marks the draft approved and returns the collectedFields ready for server action.
 */
export function approveCurrentDraft(state: ConversationState): {
  nextState: ConversationState
  collectedFields: Record<string, string>
  taskId: DonnaTaskId | null
} {
  if (!state.activeDraft) {
    return { nextState: state, collectedFields: {}, taskId: null }
  }
  return {
    nextState: {
      ...state,
      phase: 'approved',
      activeDraft: { ...state.activeDraft, phase: 'approved' },
    },
    collectedFields: toCollectedFields(state.activeDraft),
    taskId: state.activeDraft.taskId,
  }
}

/**
 * Called by the UI layer when the director clicks "Discard" or "Start Over".
 */
export function discardCurrentDraft(state: ConversationState): ConversationState {
  return {
    ...state,
    phase: 'idle',
    activeDraft: null,
    currentFieldId: null,
  }
}

/**
 * Returns a human-readable summary of the current draft for display.
 * Returns null when no draft is active.
 */
export function getCurrentDraftSummary(state: ConversationState) {
  if (!state.activeDraft) return null
  return summarizeDraft(state.activeDraft)
}
