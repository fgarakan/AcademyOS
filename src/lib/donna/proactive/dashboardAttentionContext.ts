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
import type { PlayerProgressStall } from '@/lib/donna/playerProgressStallDetector'

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
  // Curriculum bottleneck (Mega Sprint 1996–2005)
  mostBlockedLevelName:      string | null
  mostBlockedLevelKey:       string | null
  mostBlockedLevelStalledCount: number
  mostBlockedLevelAvgCompletion: number
  // Curriculum concern tag (Sprint 2006–2010)
  topTaggedConcern:          string | null
  // Sprint 2011–2015 — Attention Engine Data Activation
  /** age in days of oldest pending proposed_action; null when queue is empty */
  oldestPendingReviewAgeDays:        number | null
  /** derived from activePlayers + classTemplateCount + sessionsExist */
  onboardingReadinessLevel:          'not_started' | 'partial' | 'nearly_ready' | 'ready_signal' | 'unknown'
  hasPlayers:                        boolean
  hasTemplates:                      boolean
  hasCurriculumGaps:                 boolean
  /** levels with enrolled players that have no matching class template */
  curriculumTemplateCoverageGapCount: number
  /** observation count for the top tagged concern — enables ≥2 confidence gate */
  topTaggedConcernCount:             number
  /** stalled player objects with name, level, days — for evidence text */
  playerProgressStalls:              PlayerProgressStall[]
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
    curriculumDraftCount:        input.curriculumDraftCount,
    curriculumGaps,
    assessmentCoverageGaps,

    // ── Zero-default fields (conservative — no false positives) ───────────────
    mediumRiskPlayerCount:       0,
    attentionItems:              [],
    academyRisks:                [],
    recommendedActions:          [],
    recentDecisions:             [],
    templateDrafts:              0,
    curriculumOverrideDrafts:    0,
    onboardingStatus:            null,

    // ── Curriculum bottleneck (Mega Sprint 1996–2005) ─────────────────────────
    mostBlockedLevelName:         input.mostBlockedLevelName,
    mostBlockedLevelKey:          input.mostBlockedLevelKey,
    mostBlockedLevelStalledCount: input.mostBlockedLevelStalledCount,
    mostBlockedLevelAvgCompletion: input.mostBlockedLevelAvgCompletion,
    // Curriculum concern tag (Sprint 2006–2010)
    topTaggedConcern:             input.topTaggedConcern,

    // ── Sprint 2011–2015 — Attention Engine Data Activation ──────────────────
    oldestPendingReviewAgeDays:         input.oldestPendingReviewAgeDays,
    onboardingReadinessLevel:           input.onboardingReadinessLevel,
    hasPlayers:                         input.hasPlayers,
    hasCoaches:                         true,  // no coach count on dashboard path — default safe
    hasTemplates:                       input.hasTemplates,
    hasCurriculumGaps:                  input.hasCurriculumGaps,
    curriculumTemplateCoverageGapCount: input.curriculumTemplateCoverageGapCount,
    curriculumTemplateCoverageGaps:     [],    // count available; full objects require full context
    templateCoverageContextAvailable:   input.hasPlayers,
    topTaggedConcernCount:              input.topTaggedConcernCount,
    playerProgressStalls:               input.playerProgressStalls,
    playerProgressStallContextAvailable: input.playerProgressStallCount > 0,

    // ── Metadata ──────────────────────────────────────────────────────────────
    confidence:  input.isLive ? 'high' : 'insufficient',
    isLive:      input.isLive,
  } as unknown as DirectorDonnaContext
}
