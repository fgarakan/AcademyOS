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
  | { type: 'apply_revision'; fieldId: string; value: string }  // natural revision command

// ── Revision command detection ─────────────────────────────────────────────────

export interface RevisionCommand {
  fieldId: string
  value: string
  confirmationText: string  // what Donna says after applying
}

const TENNIS_LEVELS_FOR_REVISION: readonly string[] = [
  'high performance 3', 'high performance 2', 'high performance 1',
  'yellow 3', 'yellow 2', 'yellow 1',
  'green 3', 'green 2', 'green 1',
  'orange 3', 'orange 2', 'orange 1',
  'red 3', 'red 2', 'red 1',
]

const REVISION_PATTERNS: Array<{
  phrases: readonly string[]
  fieldId: string
  value: string
  confirmationText: string
}> = [
  {
    phrases: ['make it more competitive', 'more competitive', 'add more competition', 'competitive game'],
    fieldId: 'style', value: 'competitive',
    confirmationText: "Made it more competitive. The structure now emphasizes game-based drilling.",
  },
  {
    phrases: ['make it more technical', 'more technical', 'focus on technique', 'technical focus'],
    fieldId: 'style', value: 'technical',
    confirmationText: "Made it more technical. The structure now prioritizes skill-building blocks.",
  },
  {
    phrases: ['make it more balanced', 'more balanced', 'balanced approach'],
    fieldId: 'style', value: 'balanced',
    confirmationText: "Balanced it out — mix of technical work and match play.",
  },
  {
    phrases: ['make it harder', 'make it more intense', 'higher intensity', 'more intense', 'push harder'],
    fieldId: 'intensity', value: 'high',
    confirmationText: "Intensity raised. This template will challenge the players more.",
  },
  {
    phrases: ['make it simpler', 'make it easier', 'lower intensity', 'less intense', 'beginner-friendly', 'beginner friendly'],
    fieldId: 'intensity', value: 'low',
    confirmationText: "Intensity lowered. This template is more approachable.",
  },
  {
    phrases: ['add a live ball game', 'add live ball', 'include a live ball game'],
    fieldId: 'focusAreas', value: '+live ball game',
    confirmationText: "Added a live-ball game block to the structure.",
  },
  {
    phrases: ['add transition to net', 'add net approach', 'add volley', 'volley focus'],
    fieldId: 'focusAreas', value: '+transition to net',
    confirmationText: "Added a net approach / volley block.",
  },
  {
    phrases: ['focus more on footwork', 'add footwork', 'footwork focus', 'movement focus'],
    fieldId: 'focusAreas', value: '+footwork',
    confirmationText: "Added footwork emphasis to the plan.",
  },
  {
    phrases: ['focus more on forehand', 'add forehand work', 'forehand prep'],
    fieldId: 'focusAreas', value: '+forehand',
    confirmationText: "Forehand prep added as a focus area.",
  },
  {
    phrases: ['focus more on serve', 'add serve work', 'serve and return'],
    fieldId: 'focusAreas', value: '+serve',
    confirmationText: "Serve work added as a focus area.",
  },
  {
    phrases: ['add a cool-down', 'add cool down', 'add recap'],
    fieldId: 'focusAreas', value: '+cool-down',
    confirmationText: "Cool-down / recap block added.",
  },
]

/**
 * Detect a natural revision command in director input.
 * Returns a RevisionCommand when matched, or null when no revision pattern is found.
 * Used when there is an active draft to apply targeted field updates without
 * disrupting the current question sequence.
 */
export function detectRevisionCommand(text: string): RevisionCommand | null {
  const lower = text.toLowerCase().trim()

  for (const pattern of REVISION_PATTERNS) {
    if (pattern.phrases.some(p => lower.includes(p))) {
      return { fieldId: pattern.fieldId, value: pattern.value, confirmationText: pattern.confirmationText }
    }
  }

  // Duration change: "change duration to X" / "change it to X minutes" / "make it X minutes"
  const durMatch = lower.match(/(?:change (?:duration|it|the class) to|make it)\s+(\d+)\s*(?:min(?:utes?)?|mins?)?/)
  if (durMatch) {
    return {
      fieldId: 'durationMinutes',
      value: durMatch[1],
      confirmationText: `Updated duration to ${durMatch[1]} minutes.`,
    }
  }

  // Level change: "change level to Orange 2" / "change it to Green 1"
  if (lower.includes('change') || lower.includes('switch to') || lower.includes('make it')) {
    for (const level of TENNIS_LEVELS_FOR_REVISION) {
      if (lower.includes(level)) {
        const formatted = level.replace(/\b\w/g, c => c.toUpperCase())
        return {
          fieldId: 'level',
          value: formatted,
          confirmationText: `Level updated to ${formatted}.`,
        }
      }
    }
  }

  return null
}

// ── Show-draft phrase detection ────────────────────────────────────────────────

const SHOW_DRAFT_PHRASES: readonly string[] = [
  'show me the draft', 'review it', 'what did you build', 'show the draft',
  'review draft', 'show me what you have', 'what have you built',
  'show me the plan', 'what did you make', 'let me see it', 'let me see the draft',
  'show me so far', 'what do you have so far',
]

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
    console.log('[DonnaGoldenPath] undo_applied', {
      version: reverted.history.length + 1,
      phase: reverted.phase,
      fields: Object.keys(reverted.fields),
    })
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
    console.log('[DonnaGoldenPath] protected_action_blocked', {
      input: text,
      activeDraft: state.activeDraft?.taskId ?? null,
    })
    return idleTurn(
      stateWithIntent,
      intent.safeResponse,
      'Use the on-screen button to approve actions.',
    )
  }

  // ── Show draft (when active draft exists + show-draft phrase) ───────────────
  if (state.activeDraft !== null && SHOW_DRAFT_PHRASES.some(p => text.toLowerCase().includes(p))) {
    const summary = summarizeDraft(state.activeDraft)
    const speakText = summary.isComplete
      ? "Here's the draft — it's ready for your review."
      : `Here's what I have so far. Still need: ${summary.missingRequiredIds.join(', ')}.`
    return {
      nextState: stateWithIntent,
      speakText,
      displayMessage: null,
      expectingInput: true,
      showDraftReview: true,
      uiAction: { type: 'show_draft_review' },
    }
  }

  // ── Natural revision command (when active draft exists) ───────────────────────
  // Sprint 346: allow revisions in both collecting AND ready_for_review phases —
  // the draft is ready to review but the director may still want to refine it.
  if (
    state.activeDraft !== null &&
    (state.phase === 'collecting' || state.phase === 'ready_for_review')
  ) {
    const revision = detectRevisionCommand(text)
    if (revision) {
      let fieldValue = revision.value
      if (revision.fieldId === 'focusAreas' && revision.value.startsWith('+')) {
        const newFocus = revision.value.slice(1).trim()
        const existing = state.activeDraft.fields['focusAreas']?.value ?? ''
        fieldValue = existing ? `${existing}, ${newFocus}` : newFocus
      }
      const updated = updateDraft(state.activeDraft, revision.fieldId, fieldValue)
      const nextQ = getNextQuestion(updated)
      const workflow = getWorkflow(updated.workflowId ?? ('' as WorkflowId))

      console.log('[DonnaGoldenPath] revision_applied', {
        fieldId: revision.fieldId,
        value: fieldValue,
        version: updated.history.length + 1,
        phase: updated.phase,
      })

      if (updated.phase === 'ready_for_review') {
        const finalized = markReadyForReview(updated)
        return buildReadyForReviewTurn(stateWithIntent, finalized, workflow)
      }

      const speakText = nextQ
        ? `${revision.confirmationText} ${nextQ.question}`
        : revision.confirmationText
      return buildCollectingTurn(stateWithIntent, updated, speakText)
    }
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
    // If a draft is active and the question looks like "show draft", surface the review
    if (state.activeDraft !== null && SHOW_DRAFT_PHRASES.some(p => text.toLowerCase().includes(p))) {
      return {
        nextState: stateWithIntent,
        speakText: "Here's what I've built so far.",
        displayMessage: null,
        expectingInput: true,
        showDraftReview: true,
        uiAction: { type: 'show_draft_review' },
      }
    }
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
