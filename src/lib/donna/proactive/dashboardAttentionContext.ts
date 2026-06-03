// Sprint 1701 — Dashboard Attention Context Builder V1
// Assembles a minimal DirectorDonnaContext from values already computed
// by the director dashboard page — no additional DB queries required.
//
// Purpose: bridge between dashboard-level data (separate raw queries) and
// buildAcademyAttentionReport(), which expects a DirectorDonnaContext.
//
// Only populates the fields that buildAttentionPriorities() actually reads.
// All other fields use safe zero/empty defaults that produce no false positives.
//
// Design rules:
//   - No DB calls. Pure mapping. No side effects.
//   - Never invents signals not present in dashboard data.
//   - Intentionally conservative: unknown fields default to 0/[] (never inflated).

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'

export interface DashboardAttentionInput {
  /** coach wrap-ups missing from today's sessions */
  missingWrapUps:            number
  /** players with high-risk attendance/observation signals */
  highRiskPlayerCount:       number
  /** pending proposed_actions (wrap-ups, assessments, placements combined) */
  pendingReviews:            number
  /** attendance exceptions in proposed_actions (proxy: pendingWrapUpsCount) */
  attendanceExceptions:      number
  /** players advancement-eligible */
  advancementEligibleCount:  number
  /** players stalled > 180 days without advancement eligibility */
  playerProgressStallCount:  number
  /** curriculum gap / suggestion count */
  curriculumGapCount:        number
  /** curriculum improvement drafts pending */
  curriculumDraftCount:      number
  /** players due for reassessment */
  reassessmentDueCount:      number
  /** sessions this week (used for context in evidence strings) */
  sessionsThisWeek:          number
  /** whether the academy has live data (vs demo/empty) */
  isLive:                    boolean
}

export function buildDashboardAttentionContext(
  input: DashboardAttentionInput,
): DirectorDonnaContext {
  // Build synthetic assessment coverage gaps from reassessmentDueCount
  const assessmentCoverageGaps = input.reassessmentDueCount > 0
    ? [{
        playerId:          null as unknown as string,
        playerName:        null,
        lastAssessedAt:    null,
        daysSinceAssessed: null,
        urgency:           'overdue' as const,
        currentLevel:      null,
      }]
    : []

  // Build synthetic curriculum gaps from curricGapCount
  const curriculumGaps: string[] = input.curriculumGapCount > 0
    ? Array.from({ length: Math.min(input.curriculumGapCount, 3) }, (_, i) =>
        `Curriculum gap ${i + 1} identified`
      )
    : []

  return {
    // ── Active signal fields (mapped from dashboard) ──────────────────────────
    pendingReviews:              input.pendingReviews,
    missingWrapUps:              input.missingWrapUps,
    attendanceExceptions:        input.attendanceExceptions,
    todaySessions:               input.sessionsThisWeek,
    highRiskPlayerCount:         input.highRiskPlayerCount,
    advancementEligibleCount:    input.advancementEligibleCount,
    playerProgressStallCount:    input.playerProgressStallCount,
    playerProgressStallContextAvailable: input.playerProgressStallCount > 0,
    curriculumDraftCount:        input.curriculumDraftCount,
    curriculumGaps,
    assessmentCoverageGaps,

    // ── Zero-default fields (conservative — no false positives) ───────────────
    mediumRiskPlayerCount:       0,
    attentionItems:              [],
    academyRisks:                [],
    recommendedActions:          [],
    templateCoverageGaps:        [],
    playerProgressStalls:        [],
    recentDecisions:             [],
    oldestPendingReviewAgeDays:  null,
    templateDrafts:              0,
    curriculumOverrideDrafts:    0,
    onboardingStatus:            null,

    // ── Metadata ──────────────────────────────────────────────────────────────
    confidence:  input.isLive ? 'high' : 'insufficient',
    isLive:      input.isLive,
  } as unknown as DirectorDonnaContext
}
