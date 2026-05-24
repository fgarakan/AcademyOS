// Sprint 742D — DONNA Assessment Coverage Gap Detector V1
// Pure logic: cross-references playerCurriculumStateSummaries with assessmentSummaries.
// No DB calls. No side effects. No mutations. Fails safely with empty result.
// Detects:
//   1. Players with curriculum state but no assessment in last 90 days (assessment overdue)
//   2. Players with advancement_eligible=true but no promotion_ready assessment in context
//
// Limitation: only uses the loaded summaries (capped at 30 each). If the academy has
// more than 30 players or 30 assessments, some may be outside the loaded window.
// A full scan requires pagination or a dedicated aggregation query.

import type { PlayerCurriculumStateSummary, AssessmentSummary } from '@/lib/donna/extendedContextLoaders'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AssessmentGapType = 'no_recent_assessment' | 'eligible_no_promotion_evidence'

export interface AssessmentCoverageGap {
  playerId: string
  levelDisplayName: string | null
  currentLevelId: string
  gapType: AssessmentGapType
  daysSinceLastAssessment: number | null
  advancementEligible: boolean
  severity: 'high' | 'medium' | 'low'
  reason: string
  recommendedAction: string
  href: string
}

export interface AssessmentCoverageResult {
  gaps: AssessmentCoverageGap[]
  playersChecked: number
  playersWithRecentAssessment: number
  eligibleWithoutEvidence: number
  coverageAvailable: boolean
}

// ── Context shape ─────────────────────────────────────────────────────────────

interface AssessmentGapInput {
  playerCurriculumStateSummaries: PlayerCurriculumStateSummary[]
  assessmentSummaries: AssessmentSummary[]
  playerProgressContextAvailable: boolean
  assessmentContextAvailable: boolean
}

// ── Main detector ─────────────────────────────────────────────────────────────

const ASSESSMENT_OVERDUE_DAYS = 90
const TODAY = new Date()

export function detectAssessmentCoverageGaps(
  ctx: AssessmentGapInput,
): AssessmentCoverageResult {
  if (!ctx.playerProgressContextAvailable) {
    return { gaps: [], playersChecked: 0, playersWithRecentAssessment: 0, eligibleWithoutEvidence: 0, coverageAvailable: false }
  }

  const cutoffDate = new Date(TODAY.getTime() - ASSESSMENT_OVERDUE_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  // ── Build assessment index: playerId → most recent assessment ──────────────

  const latestAssessmentByPlayer = new Map<string, AssessmentSummary>()
  const promotionReadyByPlayer = new Map<string, boolean>()

  for (const a of ctx.assessmentSummaries) {
    const existing = latestAssessmentByPlayer.get(a.playerId)
    if (!existing || a.assessedDate > existing.assessedDate) {
      latestAssessmentByPlayer.set(a.playerId, a)
    }
    if (a.promotionReady) {
      promotionReadyByPlayer.set(a.playerId, true)
    }
  }

  // ── Detect gaps ────────────────────────────────────────────────────────────

  const gaps: AssessmentCoverageGap[] = []
  let playersWithRecentAssessment = 0
  let eligibleWithoutEvidence = 0

  for (const state of ctx.playerCurriculumStateSummaries) {
    const latestAssessment = latestAssessmentByPlayer.get(state.playerId)
    const isPromotionReady = promotionReadyByPlayer.get(state.playerId) ?? false

    // Compute days since last assessment
    let daysSinceLastAssessment: number | null = null
    let hasRecentAssessment = false

    if (latestAssessment) {
      const diffMs = TODAY.getTime() - new Date(latestAssessment.assessedDate).getTime()
      daysSinceLastAssessment = Math.floor(diffMs / (24 * 60 * 60 * 1000))
      hasRecentAssessment = latestAssessment.assessedDate >= cutoffDate
    }

    if (hasRecentAssessment) {
      playersWithRecentAssessment++
    }

    // Gap 1: No assessment at all, or assessment overdue (>90 days)
    if (!ctx.assessmentContextAvailable) {
      // Assessment data not loaded — can't assess coverage
      continue
    }

    if (!latestAssessment || !hasRecentAssessment) {
      const daysText = daysSinceLastAssessment !== null
        ? `${daysSinceLastAssessment} days ago`
        : 'never'

      const severity = state.advancementEligible ? 'high' : daysSinceLastAssessment === null ? 'high' : 'medium'

      gaps.push({
        playerId: state.playerId,
        levelDisplayName: state.currentLevelDisplayName,
        currentLevelId: state.currentLevelId,
        gapType: 'no_recent_assessment',
        daysSinceLastAssessment,
        advancementEligible: state.advancementEligible,
        severity,
        reason: latestAssessment
          ? `Player at ${state.currentLevelDisplayName ?? 'this level'} — last assessed ${daysText}, overdue for 90-day review.`
          : `Player at ${state.currentLevelDisplayName ?? 'this level'} — no assessment on record.`,
        recommendedAction: 'Schedule a formal assessment to document current skill level and confirm curriculum position.',
        href: '/director/players',
      })
    }

    // Gap 2: Advancement-eligible but no promotion_ready evidence
    if (state.advancementEligible && !isPromotionReady) {
      eligibleWithoutEvidence++
      gaps.push({
        playerId: state.playerId,
        levelDisplayName: state.currentLevelDisplayName,
        currentLevelId: state.currentLevelId,
        gapType: 'eligible_no_promotion_evidence',
        daysSinceLastAssessment,
        advancementEligible: true,
        severity: 'high',
        reason: `Player at ${state.currentLevelDisplayName ?? 'this level'} is marked advancement-eligible but has no promotion-ready assessment on record.`,
        recommendedAction: 'Run a formal assessment with promotion_ready=true to document readiness before approving level movement.',
        href: '/director/players',
      })
    }
  }

  // Deduplicate: a player can appear in both gap types — keep both (they are distinct issues)
  // Sort: high → medium → low, then by gap type (eligible_no_promotion_evidence first)
  const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 }
  const TYPE_ORDER: Record<AssessmentGapType, number> = { eligible_no_promotion_evidence: 0, no_recent_assessment: 1 }
  gaps.sort((a, b) => {
    const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    if (severityDiff !== 0) return severityDiff
    return TYPE_ORDER[a.gapType] - TYPE_ORDER[b.gapType]
  })

  return {
    gaps,
    playersChecked: ctx.playerCurriculumStateSummaries.length,
    playersWithRecentAssessment,
    eligibleWithoutEvidence,
    coverageAvailable: ctx.assessmentContextAvailable,
  }
}

// ── Summary helper ─────────────────────────────────────────────────────────────

export function summarizeAssessmentGaps(result: AssessmentCoverageResult): string {
  if (!result.coverageAvailable) {
    return 'Assessment coverage analysis requires both player curriculum states and assessment data to be loaded.'
  }

  if (result.gaps.length === 0) {
    return `All ${result.playersChecked} players in context have been assessed in the last ${ASSESSMENT_OVERDUE_DAYS} days. Assessment coverage looks current.`
  }

  const highGaps = result.gaps.filter(g => g.severity === 'high')
  const eligibleNoEvidence = result.gaps.filter(g => g.gapType === 'eligible_no_promotion_evidence')

  const lines: string[] = []

  if (eligibleNoEvidence.length > 0) {
    lines.push(`🔴 ${eligibleNoEvidence.length} advancement-eligible player${eligibleNoEvidence.length !== 1 ? 's' : ''} have no promotion-ready assessment — level movement cannot be safely approved without one.`)
  }

  const overdueGaps = result.gaps.filter(g => g.gapType === 'no_recent_assessment').slice(0, 4)
  for (const g of overdueGaps) {
    const badge = g.severity === 'high' ? '🔴' : '🟡'
    const daysText = g.daysSinceLastAssessment !== null ? `${g.daysSinceLastAssessment}d ago` : 'never assessed'
    lines.push(`${badge} ${g.levelDisplayName ?? 'Player'} — ${daysText}`)
  }

  const intro = highGaps.length > 0
    ? `${result.gaps.length} assessment gap${result.gaps.length !== 1 ? 's' : ''} detected (${highGaps.length} high priority):`
    : `${result.gaps.length} assessment gap${result.gaps.length !== 1 ? 's' : ''} detected:`

  return [intro, '', ...lines].join('\n').trim()
}
