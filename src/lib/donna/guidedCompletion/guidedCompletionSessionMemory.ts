// Sprint 1811–1820 — DONNA Guided Completion Engine V1
// sessionStorage-backed state for active guided completion workflows.
//
// Tracks: active workflow, current step, collected answers, completion %,
// next question, and blocked reason.
//
// Design rules:
//   - Client-side only (sessionStorage). Never throws. Fails silently.
//   - Stores only safe metadata and director answers — no player PII beyond
//     names the director has explicitly entered.
//   - TTL: 4 hours. Stale entries are discarded on read.
//   - One active guided completion per session — most recent wins.
//   - Answers are stored as plain strings — the director typed them.

import type { GuidedWorkflowId } from './guidedCompletionRegistry'
import { getWorkflow, requiredStepCount } from './guidedCompletionRegistry'

// ── State shape ───────────────────────────────────────────────────────────────

export interface GuidedCompletionSessionState {
  workflowId: GuidedWorkflowId
  /** Human-readable label, e.g. "Orange Ball 2" or "Jamie Chen" */
  subjectLabel: string | null
  /** 1-based index of the current step being asked */
  currentStepIndex: number
  /** fieldId → director's answer (string) */
  answers: Record<string, string>
  /** 0–100 */
  completionPct: number
  /** The last question DONNA asked */
  lastQuestion: string | null
  /** The next question DONNA will ask (null when complete) */
  nextQuestion: string | null
  /** If set, DONNA is blocked and cannot proceed without director action */
  blockedReason: string | null
  /** Date.now() at session start */
  startedAt: number
  /** Date.now() at last update */
  updatedAt: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'donna_guided_completion_v1'
const TTL_MS      = 4 * 60 * 60 * 1000  // 4 hours

// ── Storage helpers ───────────────────────────────────────────────────────────

function readFromStorage(): GuidedCompletionSessionState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GuidedCompletionSessionState
    if (!parsed.workflowId || typeof parsed.startedAt !== 'number') return null
    if (Date.now() - parsed.startedAt > TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeToStorage(state: GuidedCompletionSessionState): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* non-fatal */
  }
}

function clearStorage(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* non-fatal */
  }
}

// ── Completion % helper ───────────────────────────────────────────────────────

function computeCompletionPct(
  workflowId: GuidedWorkflowId,
  answers: Record<string, string>,
): number {
  const workflow = getWorkflow(workflowId)
  if (!workflow) return 0
  const total = workflow.requiredSteps.length
  if (total === 0) return 100
  const answered = workflow.requiredSteps.filter(
    s => typeof answers[s.fieldId] === 'string' && answers[s.fieldId].trim() !== '',
  ).length
  return Math.round((answered / total) * 100)
}

// ── Next unanswered step ──────────────────────────────────────────────────────

function findNextQuestion(
  workflowId: GuidedWorkflowId,
  answers: Record<string, string>,
): string | null {
  const workflow = getWorkflow(workflowId)
  if (!workflow) return null
  const next = workflow.requiredSteps.find(
    s => !answers[s.fieldId] || answers[s.fieldId].trim() === '',
  )
  return next?.question ?? null
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Start a new guided completion session.
 * Overwrites any existing session.
 */
export function startGuidedCompletion(
  workflowId: GuidedWorkflowId,
  subjectLabel: string | null = null,
): GuidedCompletionSessionState {
  const workflow = getWorkflow(workflowId)
  const firstQuestion = workflow?.requiredSteps[0]?.question ?? null

  const state: GuidedCompletionSessionState = {
    workflowId,
    subjectLabel,
    currentStepIndex: 1,
    answers: {},
    completionPct: 0,
    lastQuestion: null,
    nextQuestion: firstQuestion,
    blockedReason: null,
    startedAt: Date.now(),
    updatedAt: Date.now(),
  }

  writeToStorage(state)
  return state
}

/**
 * Record a director's answer to the current step.
 * Advances the step index and updates completionPct.
 * Returns the updated state.
 */
export function recordAnswer(
  fieldId: string,
  answer: string,
): GuidedCompletionSessionState | null {
  const state = readFromStorage()
  if (!state) return null

  const updatedAnswers = { ...state.answers, [fieldId]: answer.trim() }
  const pct = computeCompletionPct(state.workflowId, updatedAnswers)
  const nextQ = findNextQuestion(state.workflowId, updatedAnswers)
  const totalRequired = requiredStepCount(state.workflowId)

  // Advance step index (count of answered required steps + 1, capped at total)
  const workflow = getWorkflow(state.workflowId)
  const answeredRequired = workflow
    ? workflow.requiredSteps.filter(
        s => updatedAnswers[s.fieldId] && updatedAnswers[s.fieldId].trim() !== '',
      ).length
    : state.currentStepIndex

  const nextStepIndex = Math.min(answeredRequired + 1, totalRequired)

  const updated: GuidedCompletionSessionState = {
    ...state,
    currentStepIndex: nextStepIndex,
    answers: updatedAnswers,
    completionPct: pct,
    lastQuestion: state.nextQuestion,
    nextQuestion: nextQ,
    updatedAt: Date.now(),
  }

  writeToStorage(updated)
  return updated
}

/**
 * Returns the current guided completion session state, or null if none is active.
 */
export function getCurrentGuidedCompletion(): GuidedCompletionSessionState | null {
  return readFromStorage()
}

/**
 * Returns true when all required fields have been answered.
 */
export function isGuidedCompletionDone(state: GuidedCompletionSessionState): boolean {
  return state.completionPct === 100
}

/**
 * Set a blocked reason (e.g. "Awaiting director confirmation before continuing").
 */
export function setBlockedReason(reason: string): void {
  const state = readFromStorage()
  if (!state) return
  writeToStorage({ ...state, blockedReason: reason, updatedAt: Date.now() })
}

/**
 * Clear the blocked state and allow DONNA to continue.
 */
export function clearBlockedReason(): void {
  const state = readFromStorage()
  if (!state) return
  writeToStorage({ ...state, blockedReason: null, updatedAt: Date.now() })
}

/**
 * Clear the active guided completion session entirely.
 */
export function clearGuidedCompletion(): void {
  clearStorage()
}

/**
 * Update the subject label (e.g. when the director names the player or level).
 */
export function updateSubjectLabel(label: string): void {
  const state = readFromStorage()
  if (!state) return
  writeToStorage({ ...state, subjectLabel: label, updatedAt: Date.now() })
}
