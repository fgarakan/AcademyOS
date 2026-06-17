// Mega Sprint 3091–3120 — DONNA Live State-Aware Completion Engine V1
// Part 1 — Live Page State Contract
//
// Defines the shape of live academy state that can be passed from the UI into
// the DONNA brain so completion paths are driven by reality, not static checklists.
//
// Design rules:
//   - All fields are nullable (null = unknown / not yet available).
//   - No fabricated data. If a value is unavailable, return null.
//   - The brain treats null as "unknown" and falls back to static guidance.
//   - This type crosses the UI→brain boundary — keep it serializable (no functions, no Date objects).

export interface LivePageState {
  /** Canonical route this state describes */
  route: string

  /** Academy ID (null when not yet resolved) */
  academyId: string | null

  /** Whether all 7 onboarding steps are marked complete */
  onboardingComplete: boolean | null

  /** Number of onboarding steps completed (0–7, null if unknown) */
  onboardingProgress: number | null

  /** Items currently in the director review queue */
  pendingReviewCount: number | null

  /**
   * Whether the curriculum spine is active (at least one level defined and active).
   * null = unknown (curriculum data not yet loaded).
   */
  curriculumSpineActive: boolean | null

  /** Number of curriculum setup steps complete out of curriculumSetupStepsTotal */
  curriculumSetupStepsComplete: number | null

  /** Total curriculum setup steps (null if unknown) */
  curriculumSetupStepsTotal: number | null

  /** Number of active players who do not have a curriculum level assigned */
  playersMissingCurriculumLevel: number | null

  /** Number of players in the placement intake queue */
  placementQueueCount: number | null

  /** Number of players in the level-up review queue */
  levelUpQueueCount: number | null

  /** Total active players in the academy */
  activePlayerCount: number | null

  /** Total active coaches in the academy */
  activeCoachCount: number | null

  /** ISO 8601 timestamp when this state was last updated */
  lastUpdatedAt: string | null
}

/** Build a minimal LivePageState with only what's known. Use null for everything else. */
export function createPartialLivePageState(
  route: string,
  overrides: Partial<Omit<LivePageState, 'route'>>,
): LivePageState {
  return {
    route,
    academyId: null,
    onboardingComplete: null,
    onboardingProgress: null,
    pendingReviewCount: null,
    curriculumSpineActive: null,
    curriculumSetupStepsComplete: null,
    curriculumSetupStepsTotal: null,
    playersMissingCurriculumLevel: null,
    placementQueueCount: null,
    levelUpQueueCount: null,
    activePlayerCount: null,
    activeCoachCount: null,
    lastUpdatedAt: new Date().toISOString(),
    ...overrides,
  }
}
