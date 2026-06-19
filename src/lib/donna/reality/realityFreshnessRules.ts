// Mega Sprint 3151–3180 — DONNA Reality Synchronization Engine V1
// Part 4 — Reality Freshness Rules
//
// Defines maximum signal age per domain before a value is considered stale.
// Stale signals project as null in LivePageState so DONNA never presents
// outdated counts as current reality.
//
// DONNA response policy for stale signals:
//   "I don't have a current value for X — it was last updated N minutes ago."
// Never invent a value. Never use stale data as if it were fresh.

import type { RealitySignal } from './realitySnapshot'
import { markStale } from './realitySnapshot'

// ── Freshness thresholds (milliseconds) ──────────────────────────────────────

export type FreshnessDomain =
  | 'pending_approvals'      // review queue counts — high velocity, short TTL
  | 'player_attention'       // attention flags — changes when coach submits wrap-up
  | 'player_assessment'      // assessment overdue counts — changes per cycle
  | 'player_placement'       // placement queue — changes when player enrolled
  | 'promotion_queue'        // level-up candidates — changes when assessment submitted
  | 'curriculum_state'       // spine active / levels — rarely changes mid-session
  | 'session_state'          // upcoming/unassigned sessions — moderate velocity
  | 'onboarding'             // onboarding steps — rarely changes
  | 'coach_state'            // coach count / coverage — low velocity
  | 'group_state'            // group fill rates — low velocity
  | 'health_scores'          // computed scores — derived, moderate TTL
  | 'default'                // fallback for any unclassified signal

const FRESHNESS_THRESHOLDS_MS: Record<FreshnessDomain, number> = {
  pending_approvals:  5 * 60 * 1000,   //  5 minutes
  player_attention:   5 * 60 * 1000,   //  5 minutes
  player_assessment:  15 * 60 * 1000,  // 15 minutes
  player_placement:   10 * 60 * 1000,  // 10 minutes
  promotion_queue:    10 * 60 * 1000,  // 10 minutes
  curriculum_state:   15 * 60 * 1000,  // 15 minutes
  session_state:      10 * 60 * 1000,  // 10 minutes
  onboarding:         30 * 60 * 1000,  // 30 minutes
  coach_state:        30 * 60 * 1000,  // 30 minutes
  group_state:        30 * 60 * 1000,  // 30 minutes
  health_scores:      15 * 60 * 1000,  // 15 minutes
  default:            10 * 60 * 1000,  // 10 minutes
}

/** Human-readable TTL label for display in DONNA responses. */
export const FRESHNESS_LABELS: Record<FreshnessDomain, string> = {
  pending_approvals: '5 minutes',
  player_attention:  '5 minutes',
  player_assessment: '15 minutes',
  player_placement:  '10 minutes',
  promotion_queue:   '10 minutes',
  curriculum_state:  '15 minutes',
  session_state:     '10 minutes',
  onboarding:        '30 minutes',
  coach_state:       '30 minutes',
  group_state:       '30 minutes',
  health_scores:     '15 minutes',
  default:           '10 minutes',
}

// ── Signal-to-domain mapping ──────────────────────────────────────────────────

/** Map a named signal field to its freshness domain. */
export const SIGNAL_DOMAINS: Record<string, FreshnessDomain> = {
  // Academy
  academyId:              'onboarding',
  academyName:            'onboarding',
  onboardingComplete:     'onboarding',
  onboardingProgress:     'onboarding',
  // Players
  activeCount:            'coach_state',
  needingAttention:       'player_attention',
  withoutAssessment:      'player_assessment',
  withoutPlacement:       'player_placement',
  missingCurriculumLevel: 'curriculum_state',
  // Curriculum
  spineActive:            'curriculum_state',
  setupStepsComplete:     'curriculum_state',
  setupStepsTotal:        'curriculum_state',
  progressPercent:        'curriculum_state',
  pendingCurriculumReviews: 'pending_approvals',
  // Groups
  underfilledCount:       'group_state',
  overfilledCount:        'group_state',
  // Sessions
  upcomingCount:          'session_state',
  unassignedCount:        'session_state',
  coachCoverageIssues:    'session_state',
  // Approvals
  pendingTotal:           'pending_approvals',
  pendingParent:          'pending_approvals',
  pendingCoach:           'pending_approvals',
  pendingCurriculum:      'pending_approvals',
  pendingPlacement:       'pending_approvals',
  pendingPromotion:       'pending_approvals',
  // Placement
  queueCount:             'player_placement',
  // Promotions
  promotionQueueCount:    'promotion_queue',
  pendingApprovals:       'pending_approvals',
  // Coaches
  coachActiveCount:       'coach_state',
  // Assessments
  overduePlayers:         'player_assessment',
  // Parent
  parentPendingApprovals: 'pending_approvals',
  // Health
  overallScore:           'health_scores',
  criticalSignalCount:    'health_scores',
  escalatedSignalCount:   'health_scores',
}

// ── Freshness evaluation ──────────────────────────────────────────────────────

/** Returns true when the signal's ageMs is within the domain threshold. */
export function isSignalFresh<T>(
  signal: RealitySignal<T>,
  domain: FreshnessDomain,
): boolean {
  if (signal.value === null) return true  // null is always "fresh" — it means unknown
  if (signal.ageMs === null) return false // no timestamp → treat as stale
  return signal.ageMs <= FRESHNESS_THRESHOLDS_MS[domain]
}

/** Apply staleness rules to a signal. Returns updated signal with isStale / stalenessReason set. */
export function applyFreshnessRule<T>(
  signal: RealitySignal<T>,
  fieldName: string,
): RealitySignal<T> {
  if (signal.value === null) return signal
  const domain = SIGNAL_DOMAINS[fieldName] ?? 'default'
  const fresh = isSignalFresh(signal, domain)
  if (fresh) return signal
  const ttl = FRESHNESS_LABELS[domain]
  const ageMin = signal.ageMs !== null ? Math.round(signal.ageMs / 60000) : null
  const agePart = ageMin !== null ? ` (last updated ${ageMin}m ago, TTL ${ttl})` : ` (TTL ${ttl})`
  return markStale(signal, `${fieldName} exceeded freshness threshold${agePart}`)
}

/** Apply freshness rules to every named field in a record. */
export function applyFreshnessRulesToRecord<R extends Record<string, RealitySignal<unknown>>>(
  record: R,
): R {
  const result = {} as R
  for (const key of Object.keys(record) as Array<keyof R>) {
    result[key] = applyFreshnessRule(record[key] as RealitySignal<unknown>, key as string) as R[typeof key]
  }
  return result
}

/** Build a human-readable staleness warning for use in DONNA responses. */
export function buildStalenessWarning(fieldLabel: string, ageMs: number | null): string {
  if (ageMs === null) {
    return `I don't have a current value for ${fieldLabel} — no timestamp was recorded.`
  }
  const ageMin = Math.round(ageMs / 60000)
  if (ageMin < 1) {
    return `I don't have a current value for ${fieldLabel} — it was last updated less than a minute ago but is marked stale.`
  }
  return `I don't have a current value for ${fieldLabel} — it was last updated ${ageMin} minute${ageMin !== 1 ? 's' : ''} ago.`
}
