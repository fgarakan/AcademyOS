// Sprint 913.2 — DONNA Attention Ranking Engine V1
// Deterministic, read-only priority ranking from DirectorDonnaContext signals.
// Turns academy operating state into a ranked list of what matters most, why it
// matters, what the evidence is, and what the director should do first.
//
// Rules:
//   - Deterministic only. No LLM. No random. Same ctx → same output.
//   - No DB calls, no mutations, no server actions.
//   - Never invents data that is not in ctx.
//   - If a signal is absent, no priority is emitted for it.
//   - Sorted by score descending (highest urgency first).
//   - Approval flags are accurate — nothing marked approved unless reviewed by director.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'

// ── Priority type ──────────────────────────────────────────────────────────────

export type DonnaAttentionCategory =
  | 'safety'
  | 'parent_records'
  | 'player_development'
  | 'coach_execution'
  | 'review_queue'
  | 'curriculum'
  | 'onboarding'
  | 'sessions'
  | 'system'

export type DonnaAttentionSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface DonnaAttentionPriority {
  /** Stable identifier — used for deduplication and answer routing. */
  id: string
  /** Human-readable one-line description. */
  label: string
  category: DonnaAttentionCategory
  severity: DonnaAttentionSeverity
  /** 0–100 sort key. Higher = more urgent. */
  score: number
  /** Why this matters to the academy right now. */
  whyItMatters: string
  /** What data supports this signal. */
  evidence: string
  /** The single best action the director can take. */
  bestNextAction: string
  /** Optional deep-link for navigation. */
  href?: string
  /** True when director approval is required before any effect. */
  requiresApproval: boolean
  /** What DONNA will NOT do automatically. */
  donnaWillNotDo: string
}

// ── Scoring constants ──────────────────────────────────────────────────────────
// Scores are on a 0–100 scale.
// Base scores reflect typical urgency ordering.
// Multipliers reflect per-unit severity amplification (capped).

const SCORE_MISSING_WRAP_UPS_BASE    = 80
const SCORE_HIGH_RISK_PLAYER_BASE    = 75
const SCORE_ATTENDANCE_EXCEPTION_BASE = 70
const SCORE_STALE_QUEUE_HIGH         = 75   // ≥14 days old
const SCORE_STALE_QUEUE_MED          = 65   // 7–13 days old
const SCORE_PENDING_REVIEWS_BASE     = 60
const SCORE_MEDIUM_RISK_PLAYER_BASE  = 55
const SCORE_ADVANCEMENT_ELIGIBLE_BASE = 50
const SCORE_CURRICULUM_DRAFTS_BASE   = 40
const SCORE_CURRICULUM_GAPS_BASE     = 35
const SCORE_ONBOARDING_NOT_STARTED   = 45
const SCORE_ONBOARDING_PARTIAL       = 30

function cap(value: number, max: number): number {
  return Math.min(value, max)
}

// ── Main builder ───────────────────────────────────────────────────────────────

/**
 * Builds a ranked list of attention priorities from DirectorDonnaContext.
 * Returns an empty array when no signals are active (all-clear state).
 * Sorted by score descending — first item is always the top priority.
 */
export function buildAttentionPriorities(
  ctx: DirectorDonnaContext,
): DonnaAttentionPriority[] {
  const priorities: DonnaAttentionPriority[] = []

  // ── 1. Missing coach wrap-ups (today) ─────────────────────────────────────
  // Time-critical: daily observations decay. Cannot be recovered after the session.
  if (ctx.missingWrapUps > 0) {
    const score = cap(SCORE_MISSING_WRAP_UPS_BASE + ctx.missingWrapUps * 3, 95)
    const plural = ctx.missingWrapUps !== 1
    priorities.push({
      id: 'missing_wrap_ups',
      label: `${ctx.missingWrapUps} missing coach wrap-up${plural ? 's' : ''} from today`,
      category: 'coach_execution',
      severity: ctx.missingWrapUps > 2 ? 'critical' : 'high',
      score,
      whyItMatters: "Coaching observations from today's sessions cannot be recovered retroactively. Once the session window closes, these notes are permanently lost.",
      evidence: `${ctx.missingWrapUps} of today's ${ctx.todaySessions > 0 ? ctx.todaySessions + ' ' : ''}sessions have no coach wrap-up submitted.`,
      bestNextAction: 'Open Sessions and follow up with coaches to submit wrap-ups before end of day.',
      href: '/director/sessions',
      requiresApproval: false,
      donnaWillNotDo: 'DONNA will not submit wrap-ups or contact coaches automatically.',
    })
  }

  // ── 2. High-risk player attention ─────────────────────────────────────────
  // Player safety, readiness, and parent-communication risk.
  if (ctx.highRiskPlayerCount > 0) {
    const score = cap(SCORE_HIGH_RISK_PLAYER_BASE + ctx.highRiskPlayerCount * 3, 90)
    const namedPlayers = ctx.attentionItems
      .filter(a => a.risk === 'high' && a.playerName)
      .slice(0, 2)
      .map(a => a.playerName as string)
    const nameNote = namedPlayers.length > 0 ? ` (including ${namedPlayers.join(', ')})` : ''
    const plural = ctx.highRiskPlayerCount !== 1
    priorities.push({
      id: 'high_risk_players',
      label: `${ctx.highRiskPlayerCount} player${plural ? 's' : ''}${nameNote} flagged high-risk`,
      category: 'player_development',
      severity: ctx.highRiskPlayerCount >= 3 ? 'critical' : 'high',
      score,
      whyItMatters: 'High-risk flags indicate concern observations or attendance patterns that may affect player development, readiness, and upcoming parent communications.',
      evidence: `${ctx.highRiskPlayerCount} player${plural ? 's' : ''} with high-risk signals from recent observations or session absences.`,
      bestNextAction: 'Review the flagged player profiles, check recent coach notes, and decide if a parent update or coaching intervention is needed.',
      href: '/director/players',
      requiresApproval: true,
      donnaWillNotDo: 'DONNA will not publish parent updates or initiate coaching conversations automatically.',
    })
  }

  // ── 3. Attendance exceptions (parent-facing records) ─────────────────────
  // Approval affects parent-visible records — high care required.
  if (ctx.attendanceExceptions > 0) {
    const score = cap(SCORE_ATTENDANCE_EXCEPTION_BASE + ctx.attendanceExceptions * 2, 85)
    const plural = ctx.attendanceExceptions !== 1
    priorities.push({
      id: 'attendance_exceptions',
      label: `${ctx.attendanceExceptions} attendance exception${plural ? 's' : ''} pending review`,
      category: 'parent_records',
      severity: ctx.attendanceExceptions >= 3 ? 'high' : 'medium',
      score,
      whyItMatters: 'Attendance exceptions affect parent-visible records. Approving inaccurate exceptions can cause incorrect communications or billing.',
      evidence: `${ctx.attendanceExceptions} attendance exception${plural ? 's' : ''} with status pending_review in proposed_actions.`,
      bestNextAction: 'Open the Review Center and review each attendance exception carefully before approving.',
      href: '/director/review',
      requiresApproval: true,
      donnaWillNotDo: 'DONNA will not approve, modify, or apply attendance records automatically.',
    })
  }

  // ── 4. Stale review queue ────────────────────────────────────────────────
  // Items sitting in the queue >7 days block downstream coach/player workflows.
  // Only added when pendingReviews > 0 AND age >= 7. Replaces generic pending signal.
  const staleAge = ctx.oldestPendingReviewAgeDays ?? 0
  const queueIsStale = ctx.pendingReviews > 0 && staleAge >= 7

  if (queueIsStale) {
    const score = staleAge >= 14 ? SCORE_STALE_QUEUE_HIGH : SCORE_STALE_QUEUE_MED
    priorities.push({
      id: 'stale_review_queue',
      label: `Review queue oldest item is ${staleAge} day${staleAge !== 1 ? 's' : ''} old`,
      category: 'review_queue',
      severity: staleAge >= 14 ? 'high' : 'medium',
      score,
      whyItMatters: 'Every day of delay on review items means coaches and players are waiting on decisions. Stale queues signal a workflow bottleneck.',
      evidence: `Oldest pending item in the Review Queue is ${staleAge} days old with status pending_review.`,
      bestNextAction: 'Open the Review Center and clear the oldest items first — prioritize anything affecting parent communications or player advancement.',
      href: '/director/review',
      requiresApproval: true,
      donnaWillNotDo: 'DONNA will not approve or process any review items automatically.',
    })
  } else if (ctx.pendingReviews > 0) {
    // ── 5. Pending review queue (fresh, not stale) ───────────────────────────
    const score = cap(SCORE_PENDING_REVIEWS_BASE + ctx.pendingReviews, 75)
    const plural = ctx.pendingReviews !== 1
    priorities.push({
      id: 'pending_reviews',
      label: `${ctx.pendingReviews} item${plural ? 's' : ''} in the Review Queue`,
      category: 'review_queue',
      severity: ctx.pendingReviews >= 5 ? 'high' : 'medium',
      score,
      whyItMatters: 'Pending review items are waiting for your decision before coaches and players can move forward with records and communications.',
      evidence: `${ctx.pendingReviews} proposed_action${plural ? 's' : ''} with status pending_review.`,
      bestNextAction: 'Open the Review Center and work through the pending items.',
      href: '/director/review',
      requiresApproval: true,
      donnaWillNotDo: 'DONNA will not approve or apply any review items automatically.',
    })
  }

  // ── 6. Medium-risk player attention (only when no high-risk) ─────────────
  if (ctx.mediumRiskPlayerCount > 0 && ctx.highRiskPlayerCount === 0) {
    const score = cap(SCORE_MEDIUM_RISK_PLAYER_BASE + ctx.mediumRiskPlayerCount * 2, 65)
    const plural = ctx.mediumRiskPlayerCount !== 1
    priorities.push({
      id: 'medium_risk_players',
      label: `${ctx.mediumRiskPlayerCount} player${plural ? 's' : ''} flagged medium-risk`,
      category: 'player_development',
      severity: 'medium',
      score,
      whyItMatters: 'Medium-risk flags are early warning signals — attendance gaps or isolated concern observations that may escalate without monitoring.',
      evidence: `${ctx.mediumRiskPlayerCount} player${plural ? 's' : ''} with medium-risk signals from recent observations or session absences.`,
      bestNextAction: 'Review the flagged player profiles and decide whether to act now or continue monitoring.',
      href: '/director/players',
      requiresApproval: false,
      donnaWillNotDo: 'DONNA will not create or publish parent communications automatically.',
    })
  }

  // ── 7. Advancement-eligible players ─────────────────────────────────────
  if (ctx.advancementEligibleCount > 0) {
    const score = cap(SCORE_ADVANCEMENT_ELIGIBLE_BASE + ctx.advancementEligibleCount, 60)
    const plural = ctx.advancementEligibleCount !== 1
    priorities.push({
      id: 'advancement_eligible',
      label: `${ctx.advancementEligibleCount} player${plural ? 's' : ''} ready to advance`,
      category: 'player_development',
      severity: 'medium',
      score,
      whyItMatters: 'Players meeting advancement criteria are waiting for a level decision. Delay affects motivation and coach planning for the next cycle.',
      evidence: `${ctx.advancementEligibleCount} player${plural ? 's' : ''} meet advancement criteria in the curriculum tracking view.`,
      bestNextAction: 'Review the advancement-eligible player profiles and make level movement decisions.',
      href: '/director/players',
      requiresApproval: true,
      donnaWillNotDo: 'DONNA will not move players to a new level. Level changes require explicit director approval through the Review Center.',
    })
  }

  // ── 8. Curriculum drafts (separate queue) ────────────────────────────────
  if (ctx.curriculumDraftCount > 0) {
    const score = cap(SCORE_CURRICULUM_DRAFTS_BASE + ctx.curriculumDraftCount * 2, 55)
    const plural = ctx.curriculumDraftCount !== 1
    priorities.push({
      id: 'curriculum_drafts',
      label: `${ctx.curriculumDraftCount} curriculum draft${plural ? 's' : ''} waiting in Curriculum Builder`,
      category: 'curriculum',
      severity: ctx.curriculumDraftCount >= 3 ? 'medium' : 'low',
      score,
      whyItMatters: 'Curriculum drafts are proposed changes that have not been applied to the official curriculum. They affect coach planning when approved.',
      evidence: `${ctx.curriculumDraftCount} pending/draft row${plural ? 's' : ''} in academy_curriculum_overrides.`,
      bestNextAction: 'Open the Curriculum Builder and review the pending drafts. Approve those that are correct, reject those that need revision.',
      href: '/director/curriculum/builder',
      requiresApproval: true,
      donnaWillNotDo: 'DONNA will not approve or apply curriculum changes automatically.',
    })
  }

  // ── 9. Curriculum gaps ────────────────────────────────────────────────────
  if (ctx.curriculumGaps.length > 0) {
    const score = cap(SCORE_CURRICULUM_GAPS_BASE + ctx.curriculumGaps.length * 2, 50)
    const plural = ctx.curriculumGaps.length !== 1
    priorities.push({
      id: 'curriculum_gaps',
      label: `${ctx.curriculumGaps.length} curriculum gap${plural ? 's' : ''} flagged`,
      category: 'curriculum',
      severity: ctx.curriculumGaps.length >= 4 ? 'medium' : 'low',
      score,
      whyItMatters: 'Curriculum gaps mean some levels lack content definitions, weakening coach delivery consistency and player development planning.',
      evidence: `${ctx.curriculumGaps.length} structural gap${plural ? 's' : ''} detected in curriculum level definitions.`,
      bestNextAction: "Open the Curriculum Builder to review the gaps. Ask DONNA to draft new drills or gates to fill them — they'll go through the approval flow.",
      href: '/director/curriculum/builder',
      requiresApproval: true,
      donnaWillNotDo: 'DONNA will not add curriculum content automatically. Any additions go through draft → review → approval.',
    })
  }

  // ── 10. Onboarding incomplete ─────────────────────────────────────────────
  const readiness = ctx.onboardingReadinessLevel
  if (readiness === 'not_started' || readiness === 'partial') {
    const score = readiness === 'not_started' ? SCORE_ONBOARDING_NOT_STARTED : SCORE_ONBOARDING_PARTIAL
    const missingParts = [
      !ctx.hasPlayers  ? 'players'   : '',
      !ctx.hasCoaches  ? 'coaches'   : '',
      !ctx.hasTemplates ? 'templates' : '',
      ctx.hasCurriculumGaps ? 'curriculum gaps' : '',
    ].filter(Boolean)
    priorities.push({
      id: 'onboarding_incomplete',
      label: readiness === 'not_started'
        ? 'Academy setup has not been started'
        : `Academy setup is ${readiness === 'partial' ? 'partially complete' : 'nearly complete'}`,
      category: 'onboarding',
      severity: readiness === 'not_started' ? 'high' : 'medium',
      score,
      whyItMatters: 'Incomplete setup means coaches, players, or curriculum may not be configured. Sessions and parent communications require this foundation.',
      evidence: missingParts.length > 0
        ? `Missing or incomplete: ${missingParts.join(', ')}.`
        : `Setup readiness level: ${readiness}.`,
      bestNextAction: 'Complete the remaining setup steps in Academy Setup.',
      href: '/director/onboarding',
      requiresApproval: false,
      donnaWillNotDo: 'DONNA will not complete setup steps automatically. Each step requires director confirmation on the setup screen.',
    })
  }

  // Sort by score descending — highest urgency first
  return priorities.sort((a, b) => b.score - a.score)
}

/**
 * Returns the top N priorities, sorted by score.
 * Returns an empty array if no signals are active.
 */
export function getTopAttentionPriorities(
  ctx: DirectorDonnaContext,
  limit = 5,
): DonnaAttentionPriority[] {
  return buildAttentionPriorities(ctx).slice(0, limit)
}

/**
 * Returns the highest-scoring priority, or null when the academy is clear.
 */
export function getTopPriority(ctx: DirectorDonnaContext): DonnaAttentionPriority | null {
  const all = buildAttentionPriorities(ctx)
  return all.length > 0 ? all[0] : null
}
