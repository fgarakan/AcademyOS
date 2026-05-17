// Sprint 598 — DONNA Multi-Step Task Flow V1
// Typed state machine for the DONNA command flow:
// input → classify → clarify? → preview → confirm → submit → result
// Pure TypeScript — no DB, no execution. Flow state only.

import type { DonnaCommandCategory, DonnaCommandDestination, DonnaRouteResult } from './donnaCommandRouter'
import type { IntentClassificationResult } from './donnaIntentClassifier'
import type { SessionMemoryEntry } from './donnaSessionMemory'

// ── Flow steps ────────────────────────────────────────────────────────────────

export type DonnaFlowStep =
  | 'idle'
  | 'input'
  | 'classifying'
  | 'clarifying'
  | 'previewing'
  | 'confirming'
  | 'submitting'
  | 'complete'
  | 'cancelled'
  | 'error'

// ── Flow state ────────────────────────────────────────────────────────────────

export interface DonnaFlowState {
  step: DonnaFlowStep
  rawInput: string | null
  classification: IntentClassificationResult | null
  route: DonnaRouteResult | null
  sessionMemoryId: string | null
  errorMessage: string | null
  completedAt: number | null
}

// ── Initial state ─────────────────────────────────────────────────────────────

export function createInitialFlowState(): DonnaFlowState {
  return {
    step: 'idle',
    rawInput: null,
    classification: null,
    route: null,
    sessionMemoryId: null,
    errorMessage: null,
    completedAt: null,
  }
}

// ── Transitions ───────────────────────────────────────────────────────────────

export function transitionFlow(
  state: DonnaFlowState,
  event: DonnaFlowEvent,
): DonnaFlowState {
  switch (event.type) {
    case 'START_INPUT':
      return { ...createInitialFlowState(), step: 'input', rawInput: null }

    case 'INPUT_SUBMITTED':
      return { ...state, step: 'classifying', rawInput: event.input }

    case 'CLASSIFIED': {
      const nextStep: DonnaFlowStep = event.classification.requiresClarification
        ? 'clarifying'
        : 'previewing'
      return {
        ...state,
        step: nextStep,
        classification: event.classification,
        route: event.route,
      }
    }

    case 'CLARIFICATION_SELECTED':
      return {
        ...state,
        step: 'previewing',
        classification: event.updatedClassification,
        route: event.route,
      }

    case 'PREVIEW_CONFIRMED':
      return { ...state, step: 'confirming' }

    case 'CONFIRMED':
      return { ...state, step: 'submitting' }

    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        step: 'complete',
        sessionMemoryId: event.sessionMemoryId ?? null,
        completedAt: Date.now(),
      }

    case 'SUBMIT_ERROR':
      return { ...state, step: 'error', errorMessage: event.message }

    case 'CANCEL':
      return { ...state, step: 'cancelled' }

    case 'RESET':
      return createInitialFlowState()

    default:
      return state
  }
}

// ── Events ────────────────────────────────────────────────────────────────────

export type DonnaFlowEvent =
  | { type: 'START_INPUT' }
  | { type: 'INPUT_SUBMITTED'; input: string }
  | { type: 'CLASSIFIED'; classification: IntentClassificationResult; route: DonnaRouteResult }
  | { type: 'CLARIFICATION_SELECTED'; updatedClassification: IntentClassificationResult; route: DonnaRouteResult }
  | { type: 'PREVIEW_CONFIRMED' }
  | { type: 'CONFIRMED' }
  | { type: 'SUBMIT_SUCCESS'; sessionMemoryId?: string }
  | { type: 'SUBMIT_ERROR'; message: string }
  | { type: 'CANCEL' }
  | { type: 'RESET' }

// ── Guards ────────────────────────────────────────────────────────────────────

export function canAdvance(state: DonnaFlowState): boolean {
  return state.step !== 'submitting' && state.step !== 'complete' && state.step !== 'cancelled'
}

export function isTerminal(state: DonnaFlowState): boolean {
  return state.step === 'complete' || state.step === 'cancelled' || state.step === 'error'
}

export function isInProgress(state: DonnaFlowState): boolean {
  return !isTerminal(state) && state.step !== 'idle'
}

// ── Step labels ───────────────────────────────────────────────────────────────

export const FLOW_STEP_LABELS: Record<DonnaFlowStep, string> = {
  idle: 'Ready',
  input: 'Listening',
  classifying: 'Understanding…',
  clarifying: 'Clarifying',
  previewing: 'Preview',
  confirming: 'Confirm',
  submitting: 'Submitting…',
  complete: 'Done',
  cancelled: 'Cancelled',
  error: 'Error',
}
