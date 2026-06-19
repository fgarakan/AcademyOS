// Mega Sprint 3151–3180 — DONNA Reality Synchronization Engine V1
// Part 2 — Reality Synchronization Engine
//
// Responsibilities:
//   1. Accept scattered page state values (existing LivePageStateInput pattern)
//   2. Wrap each value in a RealitySignal with provenance metadata
//   3. Apply freshness rules — mark stale signals
//   4. Normalize into a single canonical RealitySnapshot
//   5. Support merging two snapshots (later timestamp wins per field)
//
// Unknown values remain null. Never fabricate.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Idempotent — calling with the same input always produces the same snapshot.

import {
  createRealitySignal,
  createUnknownSignal,
  fresherSignal,
} from './realitySnapshot'
import type {
  RealitySnapshot,
  RealitySignal,
  RealitySource,
  AcademySection,
  PlayersSection,
  CurriculumSection,
  GroupsSection,
  SessionsSection,
  ApprovalsSection,
  PlacementSection,
  PromotionsSection,
  CoachesSection,
  AssessmentsSection,
  ParentActivitySection,
  HealthSignalsSection,
} from './realitySnapshot'
import { applyFreshnessRule } from './realityFreshnessRules'

// ── Sync input ────────────────────────────────────────────────────────────────

export interface RealitySyncInput {
  route: string
  source?: RealitySource
  timestamp?: string

  // Academy
  academyId?: string | null
  academyName?: string | null
  onboardingComplete?: boolean | null
  onboardingProgress?: number | null

  // Players
  activePlayerCount?: number | null
  playersNeedingAttention?: number | null
  playersWithoutAssessment?: number | null
  playersWithoutPlacement?: number | null
  playersMissingCurriculumLevel?: number | null

  // Curriculum
  curriculumSpineActive?: boolean | null
  curriculumSetupStepsComplete?: number | null
  curriculumSetupStepsTotal?: number | null
  curriculumProgressPercent?: number | null
  pendingCurriculumReviews?: number | null

  // Groups
  underfilledGroups?: number | null
  overfilledGroups?: number | null

  // Sessions
  upcomingSessions?: number | null
  unassignedSessions?: number | null
  coachCoverageIssues?: number | null

  // Approvals
  pendingReviewCount?: number | null
  pendingParentApprovals?: number | null
  pendingCoachApprovals?: number | null
  pendingPlacementReviews?: number | null
  pendingPromotionApprovals?: number | null

  // Placement
  placementQueueCount?: number | null

  // Promotions
  levelUpQueueCount?: number | null
  promotionQueueCount?: number | null

  // Coaches
  activeCoachCount?: number | null

  // Assessments
  overdueAssessmentPlayers?: number | null

  // Health (derived)
  healthOverallScore?: number | null
  healthCriticalSignals?: number | null
  healthEscalatedSignals?: number | null
}

// ── Signal builder helpers ────────────────────────────────────────────────────

function sig<T>(
  value: T | null | undefined,
  fieldName: string,
  source: RealitySource,
  timestamp: string,
): RealitySignal<T> {
  if (value === null || value === undefined) {
    return createUnknownSignal<T>()
  }
  const raw = createRealitySignal<T>(value, source, timestamp)
  return applyFreshnessRule(raw, fieldName)
}

// ── Main builder ──────────────────────────────────────────────────────────────

let _snapshotCounter = 0

function generateSnapshotId(): string {
  return `snap_${Date.now()}_${++_snapshotCounter}`
}

/**
 * Build a canonical RealitySnapshot from scattered page state values.
 * All null/undefined inputs produce unknown signals.
 * All known values are wrapped with provenance, timestamped, and freshness-checked.
 */
export function buildRealitySnapshot(input: RealitySyncInput): RealitySnapshot {
  const source: RealitySource = input.source ?? 'ui_prop'
  const ts = input.timestamp ?? new Date().toISOString()
  const s = <T>(value: T | null | undefined, fieldName: string) => sig<T>(value, fieldName, source, ts)

  const academy: AcademySection = {
    academyId:          s(input.academyId,          'academyId'),
    academyName:        s(input.academyName,         'academyName'),
    onboardingComplete: s(input.onboardingComplete,  'onboardingComplete'),
    onboardingProgress: s(input.onboardingProgress,  'onboardingProgress'),
  }

  const players: PlayersSection = {
    activeCount:            s(input.activePlayerCount,            'activeCount'),
    needingAttention:       s(input.playersNeedingAttention,      'needingAttention'),
    withoutAssessment:      s(input.playersWithoutAssessment,     'withoutAssessment'),
    withoutPlacement:       s(input.playersWithoutPlacement,      'withoutPlacement'),
    missingCurriculumLevel: s(input.playersMissingCurriculumLevel,'missingCurriculumLevel'),
  }

  const curriculum: CurriculumSection = {
    spineActive:        s(input.curriculumSpineActive,          'spineActive'),
    setupStepsComplete: s(input.curriculumSetupStepsComplete,   'setupStepsComplete'),
    setupStepsTotal:    s(input.curriculumSetupStepsTotal,      'setupStepsTotal'),
    progressPercent:    s(input.curriculumProgressPercent,      'progressPercent'),
    pendingReviews:     s(input.pendingCurriculumReviews,       'pendingCurriculumReviews'),
  }

  const groups: GroupsSection = {
    underfilledCount: s(input.underfilledGroups, 'underfilledCount'),
    overfilledCount:  s(input.overfilledGroups,  'overfilledCount'),
  }

  const sessions: SessionsSection = {
    upcomingCount:      s(input.upcomingSessions,     'upcomingCount'),
    unassignedCount:    s(input.unassignedSessions,   'unassignedCount'),
    coachCoverageIssues: s(input.coachCoverageIssues, 'coachCoverageIssues'),
  }

  const approvals: ApprovalsSection = {
    pendingTotal:     s(input.pendingReviewCount,      'pendingTotal'),
    pendingParent:    s(input.pendingParentApprovals,  'pendingParent'),
    pendingCoach:     s(input.pendingCoachApprovals,   'pendingCoach'),
    pendingCurriculum:s(input.pendingCurriculumReviews,'pendingCurriculum'),
    pendingPlacement: s(input.pendingPlacementReviews, 'pendingPlacement'),
    pendingPromotion: s(input.pendingPromotionApprovals,'pendingPromotion'),
  }

  const placement: PlacementSection = {
    queueCount: s(input.placementQueueCount, 'queueCount'),
  }

  const promotions: PromotionsSection = {
    queueCount:       s(input.levelUpQueueCount ?? input.promotionQueueCount, 'queueCount'),
    pendingApprovals: s(input.pendingPromotionApprovals, 'pendingApprovals'),
  }

  const coaches: CoachesSection = {
    activeCount:     s(input.activeCoachCount,     'coachActiveCount'),
    coverageIssues:  s(input.coachCoverageIssues,  'coachCoverageIssues'),
  }

  const assessments: AssessmentsSection = {
    overduePlayers: s(input.overdueAssessmentPlayers ?? input.playersWithoutAssessment, 'overduePlayers'),
  }

  const parentActivity: ParentActivitySection = {
    pendingApprovals: s(input.pendingParentApprovals, 'parentPendingApprovals'),
  }

  const healthSignals: HealthSignalsSection = {
    overallScore:        s(input.healthOverallScore,     'overallScore'),
    criticalSignalCount: s(input.healthCriticalSignals,  'criticalSignalCount'),
    escalatedSignalCount:s(input.healthEscalatedSignals, 'escalatedSignalCount'),
  }

  return {
    snapshotId: generateSnapshotId(),
    createdAt:  ts,
    route:      input.route,
    academy,
    players,
    curriculum,
    groups,
    sessions,
    approvals,
    placement,
    promotions,
    coaches,
    assessments,
    parentActivity,
    healthSignals,
  }
}

// ── Empty snapshot factory ────────────────────────────────────────────────────

/** Build a fully-unknown snapshot (all signals null). Used as a baseline for merging. */
export function createEmptySnapshot(route: string): RealitySnapshot {
  return buildRealitySnapshot({ route })
}

// ── Merge logic ───────────────────────────────────────────────────────────────

/**
 * Merge two snapshots. For each signal, the fresher non-null value wins.
 * overlay takes precedence on equal timestamps.
 */
export function mergeRealitySnapshots(
  base: RealitySnapshot,
  overlay: RealitySnapshot,
): RealitySnapshot {
  const m = <T>(a: RealitySignal<T>, b: RealitySignal<T>): RealitySignal<T> => fresherSignal(a, b)

  return {
    snapshotId: generateSnapshotId(),
    createdAt:  overlay.createdAt >= base.createdAt ? overlay.createdAt : base.createdAt,
    route:      overlay.route || base.route,

    academy: {
      academyId:          m(base.academy.academyId,          overlay.academy.academyId),
      academyName:        m(base.academy.academyName,         overlay.academy.academyName),
      onboardingComplete: m(base.academy.onboardingComplete,  overlay.academy.onboardingComplete),
      onboardingProgress: m(base.academy.onboardingProgress,  overlay.academy.onboardingProgress),
    },

    players: {
      activeCount:            m(base.players.activeCount,            overlay.players.activeCount),
      needingAttention:       m(base.players.needingAttention,       overlay.players.needingAttention),
      withoutAssessment:      m(base.players.withoutAssessment,      overlay.players.withoutAssessment),
      withoutPlacement:       m(base.players.withoutPlacement,       overlay.players.withoutPlacement),
      missingCurriculumLevel: m(base.players.missingCurriculumLevel, overlay.players.missingCurriculumLevel),
    },

    curriculum: {
      spineActive:        m(base.curriculum.spineActive,        overlay.curriculum.spineActive),
      setupStepsComplete: m(base.curriculum.setupStepsComplete, overlay.curriculum.setupStepsComplete),
      setupStepsTotal:    m(base.curriculum.setupStepsTotal,    overlay.curriculum.setupStepsTotal),
      progressPercent:    m(base.curriculum.progressPercent,    overlay.curriculum.progressPercent),
      pendingReviews:     m(base.curriculum.pendingReviews,     overlay.curriculum.pendingReviews),
    },

    groups: {
      underfilledCount: m(base.groups.underfilledCount, overlay.groups.underfilledCount),
      overfilledCount:  m(base.groups.overfilledCount,  overlay.groups.overfilledCount),
    },

    sessions: {
      upcomingCount:       m(base.sessions.upcomingCount,       overlay.sessions.upcomingCount),
      unassignedCount:     m(base.sessions.unassignedCount,     overlay.sessions.unassignedCount),
      coachCoverageIssues: m(base.sessions.coachCoverageIssues, overlay.sessions.coachCoverageIssues),
    },

    approvals: {
      pendingTotal:      m(base.approvals.pendingTotal,      overlay.approvals.pendingTotal),
      pendingParent:     m(base.approvals.pendingParent,     overlay.approvals.pendingParent),
      pendingCoach:      m(base.approvals.pendingCoach,      overlay.approvals.pendingCoach),
      pendingCurriculum: m(base.approvals.pendingCurriculum, overlay.approvals.pendingCurriculum),
      pendingPlacement:  m(base.approvals.pendingPlacement,  overlay.approvals.pendingPlacement),
      pendingPromotion:  m(base.approvals.pendingPromotion,  overlay.approvals.pendingPromotion),
    },

    placement: {
      queueCount: m(base.placement.queueCount, overlay.placement.queueCount),
    },

    promotions: {
      queueCount:       m(base.promotions.queueCount,       overlay.promotions.queueCount),
      pendingApprovals: m(base.promotions.pendingApprovals, overlay.promotions.pendingApprovals),
    },

    coaches: {
      activeCount:    m(base.coaches.activeCount,    overlay.coaches.activeCount),
      coverageIssues: m(base.coaches.coverageIssues, overlay.coaches.coverageIssues),
    },

    assessments: {
      overduePlayers: m(base.assessments.overduePlayers, overlay.assessments.overduePlayers),
    },

    parentActivity: {
      pendingApprovals: m(base.parentActivity.pendingApprovals, overlay.parentActivity.pendingApprovals),
    },

    healthSignals: {
      overallScore:         m(base.healthSignals.overallScore,         overlay.healthSignals.overallScore),
      criticalSignalCount:  m(base.healthSignals.criticalSignalCount,  overlay.healthSignals.criticalSignalCount),
      escalatedSignalCount: m(base.healthSignals.escalatedSignalCount, overlay.healthSignals.escalatedSignalCount),
    },
  }
}

// ── Snapshot summary ──────────────────────────────────────────────────────────

export interface SnapshotSummary {
  route: string
  createdAt: string
  knownSignals: number
  unknownSignals: number
  staleSignals: number
  overallConfidence: number
}

/** Summarize a snapshot for debugging and display. */
export function summarizeSnapshot(snapshot: RealitySnapshot): SnapshotSummary {
  const allSignals: RealitySignal<unknown>[] = [
    ...Object.values(snapshot.academy),
    ...Object.values(snapshot.players),
    ...Object.values(snapshot.curriculum),
    ...Object.values(snapshot.groups),
    ...Object.values(snapshot.sessions),
    ...Object.values(snapshot.approvals),
    snapshot.placement.queueCount,
    ...Object.values(snapshot.promotions),
    ...Object.values(snapshot.coaches),
    snapshot.assessments.overduePlayers,
    snapshot.parentActivity.pendingApprovals,
    ...Object.values(snapshot.healthSignals),
  ]

  const known   = allSignals.filter(s => s.value !== null)
  const unknown = allSignals.filter(s => s.value === null)
  const stale   = allSignals.filter(s => s.isStale)
  const avgConf = known.length > 0
    ? known.reduce((sum, s) => sum + s.confidence, 0) / known.length
    : 0

  return {
    route:             snapshot.route,
    createdAt:         snapshot.createdAt,
    knownSignals:      known.length,
    unknownSignals:    unknown.length,
    staleSignals:      stale.length,
    overallConfidence: Math.round(avgConf * 100) / 100,
  }
}
