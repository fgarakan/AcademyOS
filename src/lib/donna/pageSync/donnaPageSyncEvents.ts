// Mega Sprint 934–963C — DONNA Page State Synchronization V1
// Browser custom event contract.
//
// Event names, detail shapes, dispatch helpers, and listener factories.
//
// Design rules:
//   - Client-side only. All functions guard with typeof window !== 'undefined'.
//   - Pure side-effect dispatchers — no state, no React, no DB.
//   - Callers own dispatch timing. This file only defines the contract.
//   - All listeners return a cleanup function for use in useEffect.
//
// Event flow:
//   Surface (DonnaVoiceReadyShell / DonnaAssistantButton)
//     → receives GoalSessionResult with pageStatePatch
//     → calls dispatchPageStatePatch(patch)
//     → page receives donna:page-state-patch
//     → page updates its own state

import type { PageStatePatch } from './donnaPageStateSync'

// ── Event name constants ───────────────────────────────────────────────────────

/** Fired when DONNA records an answer that maps to a page field. */
export const DONNA_PAGE_STATE_PATCH_EVENT = 'donna:page-state-patch'

/** Fired when a goal session starts (workflow opened, Step 1 asked). */
export const DONNA_GOAL_SESSION_STARTED_EVENT = 'donna:goal-session-started'

/** Fired when a goal session completes (all steps done, draft summary shown). */
export const DONNA_GOAL_SESSION_COMPLETED_EVENT = 'donna:goal-session-completed'

// ── Event detail types ────────────────────────────────────────────────────────

export interface GoalSessionStartedDetail {
  workflowId: string
  route: string
  label: string
}

export interface GoalSessionCompletedDetail {
  workflowId: string
  draftType: string
  answers: Record<string, string>
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

/**
 * Dispatch a page state patch event.
 * Called by the surface after recording a goal session answer.
 */
export function dispatchPageStatePatch(patch: PageStatePatch): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<PageStatePatch>(DONNA_PAGE_STATE_PATCH_EVENT, {
      detail: patch,
      bubbles: false,
    }),
  )
}

/**
 * Dispatch a goal session started event.
 * Called by the surface when a new goal session opens.
 */
export function dispatchGoalSessionStarted(detail: GoalSessionStartedDetail): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<GoalSessionStartedDetail>(DONNA_GOAL_SESSION_STARTED_EVENT, {
      detail,
      bubbles: false,
    }),
  )
}

/**
 * Dispatch a goal session completed event.
 * Called by the surface when a workflow produces its final draft summary.
 */
export function dispatchGoalSessionCompleted(detail: GoalSessionCompletedDetail): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<GoalSessionCompletedDetail>(DONNA_GOAL_SESSION_COMPLETED_EVENT, {
      detail,
      bubbles: false,
    }),
  )
}

// ── Listen ────────────────────────────────────────────────────────────────────

/**
 * Listen for page state patch events.
 * Returns a cleanup function — pass it to useEffect return.
 *
 * @example
 * useEffect(() => onPageStatePatch(patch => { ... }), [])
 */
export function onPageStatePatch(
  handler: (patch: PageStatePatch) => void,
): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (e: Event) =>
    handler((e as CustomEvent<PageStatePatch>).detail)
  window.addEventListener(DONNA_PAGE_STATE_PATCH_EVENT, listener)
  return () => window.removeEventListener(DONNA_PAGE_STATE_PATCH_EVENT, listener)
}

/**
 * Listen for goal session started events.
 * Returns a cleanup function.
 */
export function onGoalSessionStarted(
  handler: (detail: GoalSessionStartedDetail) => void,
): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (e: Event) =>
    handler((e as CustomEvent<GoalSessionStartedDetail>).detail)
  window.addEventListener(DONNA_GOAL_SESSION_STARTED_EVENT, listener)
  return () => window.removeEventListener(DONNA_GOAL_SESSION_STARTED_EVENT, listener)
}

/**
 * Listen for goal session completed events.
 * Returns a cleanup function.
 */
export function onGoalSessionCompleted(
  handler: (detail: GoalSessionCompletedDetail) => void,
): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (e: Event) =>
    handler((e as CustomEvent<GoalSessionCompletedDetail>).detail)
  window.addEventListener(DONNA_GOAL_SESSION_COMPLETED_EVENT, listener)
  return () => window.removeEventListener(DONNA_GOAL_SESSION_COMPLETED_EVENT, listener)
}
