// Sprint 1881–1890 — DONNA COO Orchestration Memory V1
//
// sessionStorage-backed orchestration state for the DONNA COO guidance loop.
// Tracks which priorities DONNA is guiding the director through, the current
// priority, completed/skipped items, and pause state.
//
// After DONNA presents today's priorities and the director says "yes" or "skip",
// this module tracks where the director is in the priority sequence.
//
// Supported commands (via detectDirectorControl in donnaAutonomousGuidanceEngine):
//   yes / start / walk me through it  → accept current priority
//   not now / pause                    → pause guidance
//   skip / move on                     → advance to next priority
//   stop guiding me / stop             → clear and pause
//   show me options / what else        → show alternate priorities
//   what's next / continue             → advance to next priority
//
// Design rules:
//   - sessionStorage only (clears on tab close)
//   - 30-minute TTL (state resets if idle too long)
//   - No DB, no API, no React, no mutations
//   - Director approval gates are NEVER bypassed by this module

import type { GuidedWorkflowId } from '@/lib/donna/guidedCompletion/guidedCompletionRegistry'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface COOPriorityItem {
  rank: number
  /** Short, human-readable label for this priority */
  label: string
  /** One-sentence description of why this matters */
  description: string
  /** Deep-link for navigation (null if no specific page) */
  link: string | null
  /** Guided completion workflow that covers this priority (null if none) */
  workflowId: GuidedWorkflowId | null
}

export interface COOOrchestrationState {
  /** Random session ID — used for deduplication */
  sessionId: string
  /** Ordered priorities (max 3) from today guidance loop */
  priorities: COOPriorityItem[]
  /** Index into priorities[] of the current active item (0-based) */
  currentIndex: number
  /** Indices that have been explicitly skipped by the director */
  skippedIndices: number[]
  /** Indices that have been completed (workflow or navigation done) */
  completedIndices: number[]
  /** True when director said "not now" / "pause" / "stop guiding me" */
  isPaused: boolean
  /** The last follow-up question DONNA asked */
  lastFollowUpQuestion: string | null
  /** Unix ms — TTL reference point */
  createdAt: number
  /** Unix ms — last activity (reset on any interaction) */
  lastActivityAt: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'donna_coo_orchestration'
const TTL_MS = 30 * 60 * 1000 // 30 minutes

// ── Serialization ─────────────────────────────────────────────────────────────

function readState(): COOOrchestrationState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const state = JSON.parse(raw) as COOOrchestrationState
    // TTL check
    if (Date.now() - state.lastActivityAt > TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return state
  } catch {
    return null
  }
}

function writeState(state: COOOrchestrationState): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* ignore quota errors */ }
}

function generateSessionId(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Read the current orchestration state (null if empty or expired). */
export function getCOOState(): COOOrchestrationState | null {
  return readState()
}

/**
 * Start a new COO guidance session with the given priorities.
 * Replaces any existing state. Returns the new state.
 */
export function setCOOPriorities(items: COOPriorityItem[]): COOOrchestrationState {
  const now = Date.now()
  const state: COOOrchestrationState = {
    sessionId: generateSessionId(),
    priorities: items.slice(0, 3),
    currentIndex: 0,
    skippedIndices: [],
    completedIndices: [],
    isPaused: false,
    lastFollowUpQuestion: null,
    createdAt: now,
    lastActivityAt: now,
  }
  writeState(state)
  return state
}

/** Get the current active priority item (null if no state or out of range). */
export function getCurrentCOOPriority(): COOPriorityItem | null {
  const state = readState()
  if (!state) return null
  return state.priorities[state.currentIndex] ?? null
}

/** Get the next priority after the current one (for previewing what's coming). */
export function getNextCOOPriority(): COOPriorityItem | null {
  const state = readState()
  if (!state) return null
  const nextIndex = state.currentIndex + 1
  return state.priorities[nextIndex] ?? null
}

/**
 * Skip the current priority and advance to the next.
 * Returns the updated state, or null if there are no more priorities.
 */
export function skipCOOPriority(): COOOrchestrationState | null {
  const state = readState()
  if (!state) return null
  const nextIndex = findNextActive(state, state.currentIndex + 1)
  if (nextIndex === null) {
    clearCOO()
    return null
  }
  const updated: COOOrchestrationState = {
    ...state,
    currentIndex: nextIndex,
    skippedIndices: [...state.skippedIndices, state.currentIndex],
    lastActivityAt: Date.now(),
  }
  writeState(updated)
  return updated
}

/**
 * Mark the current priority as completed and advance to the next.
 * Returns the updated state, or null if there are no more priorities.
 */
export function completeCOOPriority(): COOOrchestrationState | null {
  const state = readState()
  if (!state) return null
  const nextIndex = findNextActive(state, state.currentIndex + 1)
  if (nextIndex === null) {
    clearCOO()
    return null
  }
  const updated: COOOrchestrationState = {
    ...state,
    currentIndex: nextIndex,
    completedIndices: [...state.completedIndices, state.currentIndex],
    lastActivityAt: Date.now(),
  }
  writeState(updated)
  return updated
}

/**
 * Pause COO guidance. The director said "not now" or "stop guiding me".
 * State is preserved so the director can resume later.
 */
export function pauseCOO(): void {
  const state = readState()
  if (!state) return
  writeState({ ...state, isPaused: true, lastActivityAt: Date.now() })
}

/** Resume COO guidance after a pause. */
export function resumeCOO(): void {
  const state = readState()
  if (!state) return
  writeState({ ...state, isPaused: false, lastActivityAt: Date.now() })
}

/** Clear all COO orchestration state. */
export function clearCOO(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

/** Update the last follow-up question (for continuity). */
export function setLastFollowUpQuestion(question: string): void {
  const state = readState()
  if (!state) return
  writeState({ ...state, lastFollowUpQuestion: question, lastActivityAt: Date.now() })
}

/** Bump lastActivityAt to prevent TTL expiry during an active session. */
export function touchCOOActivity(): void {
  const state = readState()
  if (!state) return
  writeState({ ...state, lastActivityAt: Date.now() })
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Find the next index that is neither skipped nor completed. Returns null if none. */
function findNextActive(state: COOOrchestrationState, fromIndex: number): number | null {
  const inactive = new Set([...state.skippedIndices, ...state.completedIndices])
  for (let i = fromIndex; i < state.priorities.length; i++) {
    if (!inactive.has(i)) return i
  }
  return null
}
