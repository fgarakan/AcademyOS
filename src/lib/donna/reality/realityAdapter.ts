// Mega Sprint 3151–3180 — DONNA Reality Synchronization Engine V1
// Part 3 — Reality Adapter
//
// Converts between LivePageState (UI boundary contract) and RealitySnapshot
// (canonical reality representation with provenance and freshness).
//
// Three operations:
//   1. livePageStateToSnapshot() — wraps raw values in RealitySignals with
//      provenance='ui_prop', timestamps them, and applies freshness rules.
//      Stale signals are marked isStale=true immediately.
//
//   2. projectSnapshotToLiveState() — extracts fresh values from a snapshot
//      back to LivePageState shape. Stale or unknown signals project as null.
//      This lets existing page resolvers consume snapshot data unchanged —
//      no signature changes required.
//
//   3. formatSnapshotForAI() — renders a snapshot as a short, freshness-aware
//      context string for AI teacher calls. Stale signals are silently omitted.
//      Returns "" when no fresh signals are available.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Stale signals NEVER appear in projected live state or AI context.
//   - Unknown signals (null value) pass through silently — null means unknown, not zero.

import type { LivePageState } from '../operating/livePageState'
import { createPartialLivePageState } from '../operating/livePageState'
import { buildRealitySnapshot } from './realitySynchronizationEngine'
import type { RealitySyncInput } from './realitySynchronizationEngine'
import type { RealitySnapshot } from './realitySnapshot'
import { freshValue } from './realitySnapshot'

// ── 1. Adapter: LivePageState → RealitySnapshot ───────────────────────────────

/**
 * Wrap a LivePageState in a RealitySnapshot.
 *
 * Every field receives a RealitySignal with provenance='ui_prop' and freshness
 * rules applied. Signals that exceed their domain TTL are marked isStale=true
 * and will project as null downstream.
 *
 * The timestamp used is liveState.lastUpdatedAt (when provided) — this ensures
 * the adapter respects the age of the data as reported by the UI, not the
 * moment the adapter was called.
 */
export function livePageStateToSnapshot(liveState: LivePageState): RealitySnapshot {
  const ts = liveState.lastUpdatedAt ?? new Date().toISOString()

  const input: RealitySyncInput = {
    route:     liveState.route,
    source:    'ui_prop',
    timestamp: ts,

    // Academy
    academyId:          liveState.academyId,
    onboardingComplete: liveState.onboardingComplete,
    onboardingProgress: liveState.onboardingProgress,

    // Players
    activePlayerCount:             liveState.activePlayerCount,
    playersNeedingAttention:       liveState.playersNeedingAttention       ?? null,
    playersWithoutAssessment:      liveState.playersWithoutAssessment      ?? null,
    playersWithoutPlacement:       liveState.playersWithoutPlacement       ?? null,
    playersMissingCurriculumLevel: liveState.playersMissingCurriculumLevel,

    // Curriculum
    curriculumSpineActive:        liveState.curriculumSpineActive,
    curriculumSetupStepsComplete: liveState.curriculumSetupStepsComplete,
    curriculumSetupStepsTotal:    liveState.curriculumSetupStepsTotal,
    curriculumProgressPercent:    liveState.curriculumProgress             ?? null,
    pendingCurriculumReviews:     liveState.pendingCurriculumReviews       ?? null,

    // Groups
    underfilledGroups: liveState.underfilledGroups ?? null,
    overfilledGroups:  liveState.overfilledGroups  ?? null,

    // Sessions
    upcomingSessions:    liveState.upcomingSessions    ?? null,
    unassignedSessions:  liveState.unassignedSessions  ?? null,
    coachCoverageIssues: liveState.coachCoverageIssues ?? null,

    // Approvals
    pendingReviewCount:        liveState.pendingReviewCount,
    pendingParentApprovals:    liveState.pendingParentApprovals    ?? null,
    pendingCoachApprovals:     liveState.pendingCoachApprovals     ?? null,
    pendingPlacementReviews:   liveState.pendingPlacementReviews   ?? null,
    pendingPromotionApprovals: liveState.pendingPromotionApprovals ?? null,

    // Placement
    placementQueueCount: liveState.placementQueueCount,

    // Promotions
    levelUpQueueCount:   liveState.levelUpQueueCount,
    promotionQueueCount: liveState.promotionQueueCount ?? null,

    // Coaches
    activeCoachCount: liveState.activeCoachCount,

    // Assessments — derived from playersWithoutAssessment
    overdueAssessmentPlayers: liveState.playersWithoutAssessment ?? null,
  }

  return buildRealitySnapshot(input)
}

// ── 2. Projection: RealitySnapshot → LivePageState (fresh values only) ────────

/**
 * Project a RealitySnapshot back to LivePageState shape.
 *
 * Only fresh values survive — any signal where isStale=true or value=null
 * projects as null. This ensures page resolvers (resolvePageIntelligence,
 * buildCompletionPath, resolvePageTask) never receive stale counts as if
 * they were live.
 *
 * Invariant: project(adapt(liveState)).pendingReviewCount ===
 *   (liveState.pendingReviewCount is fresh ? liveState.pendingReviewCount : null)
 */
export function projectSnapshotToLiveState(snapshot: RealitySnapshot): LivePageState {
  const a  = snapshot.academy
  const p  = snapshot.players
  const c  = snapshot.curriculum
  const g  = snapshot.groups
  const s  = snapshot.sessions
  const ap = snapshot.approvals
  const pl = snapshot.placement
  const pr = snapshot.promotions
  const co = snapshot.coaches

  return createPartialLivePageState(snapshot.route, {
    // Academy
    academyId:          freshValue(a.academyId),
    onboardingComplete: freshValue(a.onboardingComplete),
    onboardingProgress: freshValue(a.onboardingProgress),

    // Players
    activePlayerCount:             freshValue(p.activeCount),
    playersNeedingAttention:       freshValue(p.needingAttention),
    playersWithoutAssessment:      freshValue(p.withoutAssessment),
    playersWithoutPlacement:       freshValue(p.withoutPlacement),
    playersMissingCurriculumLevel: freshValue(p.missingCurriculumLevel),

    // Curriculum
    curriculumSpineActive:        freshValue(c.spineActive),
    curriculumSetupStepsComplete: freshValue(c.setupStepsComplete),
    curriculumSetupStepsTotal:    freshValue(c.setupStepsTotal),
    curriculumProgress:           freshValue(c.progressPercent),
    pendingCurriculumReviews:     freshValue(ap.pendingCurriculum),

    // Groups
    underfilledGroups: freshValue(g.underfilledCount),
    overfilledGroups:  freshValue(g.overfilledCount),

    // Sessions
    upcomingSessions:    freshValue(s.upcomingCount),
    unassignedSessions:  freshValue(s.unassignedCount),
    coachCoverageIssues: freshValue(s.coachCoverageIssues),

    // Approvals
    pendingReviewCount:        freshValue(ap.pendingTotal),
    pendingParentApprovals:    freshValue(ap.pendingParent),
    pendingCoachApprovals:     freshValue(ap.pendingCoach),
    pendingPlacementReviews:   freshValue(ap.pendingPlacement),
    pendingPromotionApprovals: freshValue(pr.pendingApprovals),

    // Placement
    placementQueueCount: freshValue(pl.queueCount),

    // Promotions
    levelUpQueueCount:   freshValue(pr.queueCount),
    promotionQueueCount: freshValue(pr.queueCount),

    // Coaches
    activeCoachCount: freshValue(co.activeCount),

    // Preserve the snapshot's creation timestamp
    lastUpdatedAt: snapshot.createdAt,
  })
}

// ── 3. AI context formatter ───────────────────────────────────────────────────

/**
 * Format a RealitySnapshot as a concise string for AI teacher calls.
 *
 * Only fresh signals are emitted — stale values are silently dropped.
 * Unknown signals (null) are also omitted (null means unknown, not zero).
 *
 * Format: "Live (snapshot): pending=3; missing-levels=2; attention=1"
 * Returns "" when no fresh signals are available.
 *
 * For strategic AI context (which concatenates directly): wrap the return value
 * with " | " prefix: `snapshot ? ` | ${formatSnapshotForAI(snapshot)}` : ...`
 */
export function formatSnapshotForAI(snapshot: RealitySnapshot | null | undefined): string {
  if (!snapshot) return ''

  const parts: string[] = []

  // Approvals
  const pending = freshValue(snapshot.approvals.pendingTotal)
  if (pending !== null) parts.push(`pending=${pending}`)

  const parentApprovals = freshValue(snapshot.approvals.pendingParent)
  if (parentApprovals !== null && parentApprovals > 0) parts.push(`parent-approvals=${parentApprovals}`)

  // Players
  const missingLevels = freshValue(snapshot.players.missingCurriculumLevel)
  if (missingLevels !== null && missingLevels > 0) parts.push(`missing-levels=${missingLevels}`)

  const attention = freshValue(snapshot.players.needingAttention)
  if (attention !== null && attention > 0) parts.push(`attention=${attention}`)

  // Progression queues
  const levelUpQ = freshValue(snapshot.promotions.queueCount)
  if (levelUpQ !== null && levelUpQ > 0) parts.push(`level-up-queue=${levelUpQ}`)

  const placementQ = freshValue(snapshot.placement.queueCount)
  if (placementQ !== null && placementQ > 0) parts.push(`placement-queue=${placementQ}`)

  // Curriculum
  const spineActive = freshValue(snapshot.curriculum.spineActive)
  if (spineActive === false) parts.push('spine=inactive')
  else if (spineActive === true) parts.push('spine=active')

  // Academy setup
  const onboarding = freshValue(snapshot.academy.onboardingComplete)
  if (onboarding === false) parts.push('onboarding=incomplete')

  if (parts.length === 0) return ''
  return `Live (snapshot): ${parts.join('; ')}`
}
