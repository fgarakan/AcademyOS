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
const SCORE_PLAYER_STALLS_BASE       = 62   // Sprint 913.3
const SCORE_ASSESSMENT_COVERAGE_BASE = 58   // Sprint 913.3
const SCORE_TEMPLATE_COVERAGE_BASE   = 56   // Sprint 913.3
const SCORE_MEDIUM_RISK_PLAYER_BASE  = 55
const SCORE_ADVANCEMENT_ELIGIBLE_BASE = 50
const SCORE_CURRICULUM_DRAFTS_BASE   = 40
const SCORE_CURRICULUM_GAPS_BASE     = 35
const SCORE_ONBOARDING_NOT_STARTED   = 45
const SCORE_ONBOARDING_PARTIAL       = 30

function cap(value: number, max: number): number {
  return Math.min(value, max)
}

// ── Evidence summarizer helpers (Sprint 913.4) ─────────────────────────────────
// Pure functions that extract 1–2 safe, specific detail items from context arrays.
// Privacy rules: never expose raw UUIDs, raw coach note content, or parent-sensitive
// wording. Player names are safe when already present in attentionItems/stall records.
// All helpers fall back to empty string when arrays are empty or detail unavailable.

function summarizePlayerStallEvidence(
  stalls: DirectorDonnaContext['playerProgressStalls'],
): string {
  if (stalls.length === 0) return ''
  const first = stalls[0]
  const parts: string[] = []
  if (first.playerName) parts.push(first.playerName)
  if (first.currentLevelDisplayName) parts.push(`at ${first.currentLevelDisplayName}`)
  if (first.daysAtCurrentLevel > 0) parts.push(`for ${first.daysAtCurrentLevel} days`)
  if (parts.length === 0) return ''
  return `including ${parts.join(' ')}`
}

function summarizeAssessmentGapEvidence(
  gaps: DirectorDonnaContext['assessmentCoverageGaps'],
): string {
  // assessmentCoverageGaps have no playerName — use levelDisplayName only
  if (gaps.length === 0) return ''
  const first = gaps[0]
  const level = first.levelDisplayName
  if (!level) return ''
  if (first.gapType === 'eligible_no_promotion_evidence') {
    return `including 1 advancement-eligible player at ${level} without promotion assessment`
  }
  const daysNote = first.daysSinceLastAssessment != null
    ? ` with no assessment in ${first.daysSinceLastAssessment} days`
    : ''
  return `including 1 player at ${level}${daysNote}`
}

function summarizeTemplateCoverageEvidence(
  gaps: DirectorDonnaContext['curriculumTemplateCoverageGaps'],
): string {
  if (gaps.length === 0) return ''
  const items = gaps.slice(0, 2).map(g => {
    const playerNote = g.playerCountAtLevel > 0
      ? ` (${g.playerCountAtLevel} player${g.playerCountAtLevel !== 1 ? 's' : ''})`
      : ''
    return `${g.levelDisplayName}${playerNote}`
  })
  return `including ${items.join(' and ')}`
}

function summarizeCurriculumGapEvidence(gaps: string[]): string {
  if (gaps.length === 0) return ''
  const first = gaps[0]
  const trimmed = first.length > 70 ? first.slice(0, 67) + '...' : first
  return `including: "${trimmed}"`
}

function summarizeAttentionItemEvidence(
  items: DirectorDonnaContext['attentionItems'],
  riskLevel: 'high' | 'medium',
): string {
  // reason field is aggregate-safe ("3 concern observations in last 30 days")
  // — not raw coach note content
  const filtered = items.filter(a => a.risk === riskLevel)
  if (filtered.length === 0) return ''
  const first = filtered[0]
  if (!first.playerName) return ''
  return `including ${first.playerName} — ${first.reason}`
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
      evidence: (() => {
        const detail = summarizeAttentionItemEvidence(ctx.attentionItems, 'high')
        const base = `${ctx.highRiskPlayerCount} player${plural ? 's' : ''} with high-risk signals from recent observations or session absences.`
        return detail ? `${base} ${detail}.` : base
      })(),
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
      evidence: (() => {
        const detail = summarizeAttentionItemEvidence(ctx.attentionItems, 'medium')
        const base = `${ctx.mediumRiskPlayerCount} player${plural ? 's' : ''} with medium-risk signals from recent observations or session absences.`
        return detail ? `${base} ${detail}.` : base
      })(),
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

  // ── Sprint 913.3: Player progress stalls ─────────────────────────────────
  // Players who have not advanced at their current curriculum level for an extended period.
  // Gated on playerProgressStallContextAvailable to avoid ranking on incomplete data.
  if (ctx.playerProgressStallCount > 0 && ctx.playerProgressStallContextAvailable) {
    const score = cap(SCORE_PLAYER_STALLS_BASE + ctx.playerProgressStallCount * 3, 78)
    const plural = ctx.playerProgressStallCount !== 1
    priorities.push({
      id: 'player_progress_stalls',
      label: `${ctx.playerProgressStallCount} player${plural ? 's' : ''} may be stalled in development`,
      category: 'player_development',
      severity: ctx.playerProgressStallCount >= 3 ? 'high' : 'medium',
      score,
      whyItMatters: 'Stalled players have been at their current curriculum level for an extended period without advancing. They may need updated evidence, a priority reset, or a coaching review before the next level decision.',
      evidence: (() => {
        const detail = summarizePlayerStallEvidence(ctx.playerProgressStalls)
        const base = `${ctx.playerProgressStallCount} player progress stall signal${plural ? 's' : ''} detected in curriculum state tracking.`
        return detail ? `${base} ${detail}.` : base
      })(),
      bestNextAction: 'Review the stalled player profiles, check recent coach notes for progress signals, and decide whether to schedule an assessment or update the development plan.',
      href: '/director/players',
      requiresApproval: false,
      donnaWillNotDo: 'DONNA will not move stalled players to a new level or modify their development records automatically.',
    })
  }

  // ── Sprint 913.3: Assessment coverage gaps ────────────────────────────────
  // Players who need assessments before level movement can be justified.
  // Gated on assessmentContextAvailable to avoid ranking on incomplete data.
  if (ctx.assessmentCoverageGapCount > 0 && ctx.assessmentContextAvailable) {
    const score = cap(SCORE_ASSESSMENT_COVERAGE_BASE + ctx.assessmentCoverageGapCount * 2, 72)
    const plural = ctx.assessmentCoverageGapCount !== 1
    const evidenceExtra = ctx.eligibleWithoutAssessmentEvidence > 0
      ? ` Including ${ctx.eligibleWithoutAssessmentEvidence} advancement-eligible player${ctx.eligibleWithoutAssessmentEvidence !== 1 ? 's' : ''} without promotion-ready assessment on record.`
      : ''
    priorities.push({
      id: 'assessment_coverage_gaps',
      label: `${ctx.assessmentCoverageGapCount} assessment coverage gap${plural ? 's' : ''} flagged`,
      category: 'curriculum',
      severity: ctx.assessmentCoverageGapCount >= 3 ? 'high' : 'medium',
      score,
      whyItMatters: 'Assessment gaps mean the academy may lack sufficient evidence to justify level movement or advancement readiness decisions. This weakens the evidence base for coaching and director choices.',
      evidence: (() => {
        const detail = summarizeAssessmentGapEvidence(ctx.assessmentCoverageGaps)
        const base = `${ctx.assessmentCoverageGapCount} assessment coverage gap${plural ? 's' : ''} detected.${evidenceExtra}`
        return detail ? `${base} ${detail}.` : base
      })(),
      bestNextAction: 'Review player assessment records. Schedule assessments for players with gaps before making level movement decisions.',
      href: '/director/players',
      requiresApproval: false,
      donnaWillNotDo: 'DONNA will not schedule assessments or modify assessment records automatically.',
    })
  }

  // ── Sprint 913.3: Curriculum-to-template coverage gaps ───────────────────
  // Curriculum levels with active players but no session template assigned.
  // Gated on templateCoverageContextAvailable to avoid ranking on incomplete data.
  if (ctx.curriculumTemplateCoverageGapCount > 0 && ctx.templateCoverageContextAvailable) {
    const score = cap(SCORE_TEMPLATE_COVERAGE_BASE + ctx.curriculumTemplateCoverageGapCount * 2, 70)
    const plural = ctx.curriculumTemplateCoverageGapCount !== 1
    priorities.push({
      id: 'curriculum_template_coverage_gaps',
      label: `${ctx.curriculumTemplateCoverageGapCount} curriculum level${plural ? 's' : ''} with active players but no session template`,
      category: 'curriculum',
      severity: ctx.curriculumTemplateCoverageGapCount >= 3 ? 'high' : 'medium',
      score,
      whyItMatters: 'When active curriculum levels have no session template, coaches cannot deliver structured sessions from a consistent plan. This weakens curriculum fidelity and consistency across the academy.',
      evidence: (() => {
        const detail = summarizeTemplateCoverageEvidence(ctx.curriculumTemplateCoverageGaps)
        const base = `${ctx.curriculumTemplateCoverageGapCount} curriculum level${plural ? 's' : ''} with enrolled players have no matching session template assigned.`
        return detail ? `${base} ${detail}.` : base
      })(),
      bestNextAction: 'Open Templates and create or assign session templates for the affected curriculum levels.',
      href: '/director/templates',
      requiresApproval: false,
      donnaWillNotDo: 'DONNA will not create or assign templates automatically. Templates require director creation and review.',
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
      evidence: (() => {
        const detail = summarizeCurriculumGapEvidence(ctx.curriculumGaps)
        const base = `${ctx.curriculumGaps.length} structural gap${plural ? 's' : ''} detected in curriculum level definitions.`
        return detail ? `${base} ${detail}.` : base
      })(),
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
