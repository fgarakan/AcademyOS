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

  // ── Mega Sprint 3121–3150 — Expanded live state signals ──────────────────────

  // Curriculum
  /** 0–100 pct of curriculum levels that have content defined */
  curriculumProgress?: number | null
  /** Review queue items of type curriculum */
  pendingCurriculumReviews?: number | null

  // Placement
  /** Review queue items of type placement */
  pendingPlacementReviews?: number | null

  // Level Up
  /** Players eligible for promotion (broader alias for levelUpQueueCount) */
  promotionQueueCount?: number | null
  /** Promotion proposals currently in the review queue */
  pendingPromotionApprovals?: number | null

  // Sessions
  /** Sessions scheduled in next 7 days */
  upcomingSessions?: number | null
  /** Sessions with no coach assigned */
  unassignedSessions?: number | null
  /** Coaches with session coverage gaps */
  coachCoverageIssues?: number | null

  // Approvals breakdown
  /** Parent-visible items in the review queue */
  pendingParentApprovals?: number | null
  /** Coach-facing items in the review queue */
  pendingCoachApprovals?: number | null

  // Players
  /** Players with attention flags set */
  playersNeedingAttention?: number | null
  /** Players with no assessment in the last 90 days */
  playersWithoutAssessment?: number | null
  /** Players in intake (unplaced) */
  playersWithoutPlacement?: number | null

  // Groups
  /** Groups below minimum enrollment */
  underfilledGroups?: number | null
  /** Groups above maximum enrollment */
  overfilledGroups?: number | null

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
    // Expanded signals (3121–3150) — all null by default
    curriculumProgress: null,
    pendingCurriculumReviews: null,
    pendingPlacementReviews: null,
    promotionQueueCount: null,
    pendingPromotionApprovals: null,
    upcomingSessions: null,
    unassignedSessions: null,
    coachCoverageIssues: null,
    pendingParentApprovals: null,
    pendingCoachApprovals: null,
    playersNeedingAttention: null,
    playersWithoutAssessment: null,
    playersWithoutPlacement: null,
    underfilledGroups: null,
    overfilledGroups: null,
    lastUpdatedAt: new Date().toISOString(),
    ...overrides,
  }
}
