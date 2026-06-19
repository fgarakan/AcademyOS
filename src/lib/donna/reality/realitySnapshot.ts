// Mega Sprint 3151–3180 — DONNA Reality Synchronization Engine V1
// Part 1 — Reality Snapshot
//
// RealitySnapshot is the canonical, immutable representation of academy reality
// at a given point in time. Every DONNA decision should be traceable to a signal
// in this snapshot.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Every field is a RealitySignal<T> — never a raw value.
//   - null means unknown, not zero. Never fabricate.
//   - Serializable — safe to pass across server/client boundary.

// ── Signal metadata ───────────────────────────────────────────────────────────

export type ConfidenceLevel = 'verified' | 'estimated' | 'derived' | 'unknown'
export type RealitySource =
  | 'db_query'        // directly queried from Supabase
  | 'ui_prop'         // passed as a React prop from the page
  | 'server_action'   // returned by a server action
  | 'derived'         // computed from other signals
  | 'unknown'         // source not recorded

// ── Core signal type ──────────────────────────────────────────────────────────

export interface RealitySignal<T> {
  /** The actual value. null means unknown — never fabricated. */
  value: T | null
  /** ISO 8601 timestamp when this value was last observed. */
  timestamp: string | null
  /** Age in milliseconds since timestamp. null when timestamp is null. */
  ageMs: number | null
  /** 0.0–1.0. 1.0 = directly verified from DB. 0.0 = completely unknown. */
  confidence: number
  /** Human-readable confidence tier */
  confidenceLevel: ConfidenceLevel
  /** Where this value came from */
  source: RealitySource
  /** True when ageMs exceeds the domain freshness threshold */
  isStale: boolean
  /** Human-readable explanation of staleness — null when not stale */
  stalenessReason: string | null
}

// ── Section types ─────────────────────────────────────────────────────────────

export interface AcademySection {
  academyId: RealitySignal<string>
  academyName: RealitySignal<string>
  onboardingComplete: RealitySignal<boolean>
  onboardingProgress: RealitySignal<number>
}

export interface PlayersSection {
  activeCount: RealitySignal<number>
  needingAttention: RealitySignal<number>
  withoutAssessment: RealitySignal<number>
  withoutPlacement: RealitySignal<number>
  missingCurriculumLevel: RealitySignal<number>
}

export interface CurriculumSection {
  spineActive: RealitySignal<boolean>
  setupStepsComplete: RealitySignal<number>
  setupStepsTotal: RealitySignal<number>
  progressPercent: RealitySignal<number>
  pendingReviews: RealitySignal<number>
}

export interface GroupsSection {
  underfilledCount: RealitySignal<number>
  overfilledCount: RealitySignal<number>
}

export interface SessionsSection {
  upcomingCount: RealitySignal<number>
  unassignedCount: RealitySignal<number>
  coachCoverageIssues: RealitySignal<number>
}

export interface ApprovalsSection {
  pendingTotal: RealitySignal<number>
  pendingParent: RealitySignal<number>
  pendingCoach: RealitySignal<number>
  pendingCurriculum: RealitySignal<number>
  pendingPlacement: RealitySignal<number>
  pendingPromotion: RealitySignal<number>
}

export interface PlacementSection {
  queueCount: RealitySignal<number>
}

export interface PromotionsSection {
  queueCount: RealitySignal<number>
  pendingApprovals: RealitySignal<number>
}

export interface CoachesSection {
  activeCount: RealitySignal<number>
  coverageIssues: RealitySignal<number>
}

export interface AssessmentsSection {
  overduePlayers: RealitySignal<number>
}

export interface ParentActivitySection {
  pendingApprovals: RealitySignal<number>
}

export interface HealthSignalsSection {
  overallScore: RealitySignal<number>
  criticalSignalCount: RealitySignal<number>
  escalatedSignalCount: RealitySignal<number>
}

// ── Canonical snapshot ────────────────────────────────────────────────────────

export interface RealitySnapshot {
  snapshotId: string
  createdAt: string
  route: string
  academy: AcademySection
  players: PlayersSection
  curriculum: CurriculumSection
  groups: GroupsSection
  sessions: SessionsSection
  approvals: ApprovalsSection
  placement: PlacementSection
  promotions: PromotionsSection
  coaches: CoachesSection
  assessments: AssessmentsSection
  parentActivity: ParentActivitySection
  healthSignals: HealthSignalsSection
}

// ── Signal factories ──────────────────────────────────────────────────────────

/** Build a known signal — value is confirmed and timestamped. */
export function createRealitySignal<T>(
  value: T,
  source: RealitySource,
  timestamp?: string,
): RealitySignal<T> {
  const ts = timestamp ?? new Date().toISOString()
  const ageMs = Date.now() - new Date(ts).getTime()
  return {
    value,
    timestamp: ts,
    ageMs,
    confidence: source === 'db_query' ? 1.0 : source === 'server_action' ? 0.95 : source === 'ui_prop' ? 0.85 : 0.70,
    confidenceLevel: source === 'db_query' ? 'verified' : source === 'derived' ? 'derived' : 'estimated',
    source,
    isStale: false,
    stalenessReason: null,
  }
}

/** Build an unknown signal — value is not available. */
export function createUnknownSignal<T>(): RealitySignal<T> {
  return {
    value: null,
    timestamp: null,
    ageMs: null,
    confidence: 0.0,
    confidenceLevel: 'unknown',
    source: 'unknown',
    isStale: false,
    stalenessReason: null,
  }
}

/** Mark a signal as stale with a reason. */
export function markStale<T>(
  signal: RealitySignal<T>,
  reason: string,
): RealitySignal<T> {
  return { ...signal, isStale: true, stalenessReason: reason }
}

/** Extract value only if signal is fresh — null if stale or unknown. */
export function freshValue<T>(signal: RealitySignal<T>): T | null {
  return signal.isStale ? null : signal.value
}

/** Compare signals — return the one that is fresher (or non-null if one is null). */
export function fresherSignal<T>(
  a: RealitySignal<T>,
  b: RealitySignal<T>,
): RealitySignal<T> {
  if (a.value === null) return b
  if (b.value === null) return a
  if (a.timestamp === null) return b
  if (b.timestamp === null) return a
  return a.timestamp >= b.timestamp ? a : b
}
