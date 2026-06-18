// Mega Sprint 3091–3120 — DONNA Live State-Aware Completion Engine V1
// Part 3 — Live Page State Builder
//
// Builds a LivePageState from values already available in the UI/action layer.
// Only uses values that have already been loaded — does not add new DB queries.
// Null is the correct return for any field that is not yet available.

import { createPartialLivePageState } from './livePageState'
import type { LivePageState } from './livePageState'

// ── Input from the UI layer ────────────────────────────────────────────────────

export interface LivePageStateInput {
  route: string
  academyId?: string | null
  /** From onboardingComplete prop on DonnaAssistantButton */
  onboardingComplete?: boolean | null
  /** Number of pending items already loaded in the review queue badge */
  pendingReviewCount?: number | null
  /** From any curriculum page props already available */
  curriculumSpineActive?: boolean | null
  /** Players without curriculum level — already available in player list queries */
  playersMissingCurriculumLevel?: number | null
  /** From placement page if loaded */
  placementQueueCount?: number | null
  /** From level-up page if loaded */
  levelUpQueueCount?: number | null
  /** Active player count if already known from academy data */
  activePlayerCount?: number | null
  /** Active coach count if already known */
  activeCoachCount?: number | null
}

/**
 * Build a LivePageState from values already available in the UI.
 * Does not perform any DB queries. Returns null for any field not provided.
 */
export function buildLivePageState(input: LivePageStateInput): LivePageState {
  const {
    route,
    academyId = null,
    onboardingComplete = null,
    pendingReviewCount = null,
    curriculumSpineActive = null,
    playersMissingCurriculumLevel = null,
    placementQueueCount = null,
    levelUpQueueCount = null,
    activePlayerCount = null,
    activeCoachCount = null,
  } = input

  // Derive onboardingProgress from onboardingComplete where possible.
  // 7/7 when complete, null when not complete (we don't know exact step count from this input).
  const onboardingProgress: number | null = onboardingComplete === true ? 7 : null

  return createPartialLivePageState(route, {
    academyId,
    onboardingComplete,
    onboardingProgress,
    pendingReviewCount,
    curriculumSpineActive,
    playersMissingCurriculumLevel,
    placementQueueCount,
    levelUpQueueCount,
    activePlayerCount,
    activeCoachCount,
  })
}
