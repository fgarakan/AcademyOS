// Mega Sprint 2801–2830 — DONNA Academy Operating Intelligence V1
// DNA Coach Alignment: evaluates coach behavior against Academy DNA standards.
//
// Three functions:
//   evaluateCoachDnaAlignment()    — scores coach behavior against DNA standards
//   buildCoachAlignmentSummary()   — academy-wide coach alignment summary
//   buildCoachAlignmentRecommendation() — specific next action for misaligned coaches
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic. No AI required.
//   - Does NOT replace coachIntelligenceEngine.ts.
//     Instead: adds DNA-specific alignment check on top of existing coach intelligence.

import type { OperatingModelContext } from './operatingModelContext'

// ── Input types ───────────────────────────────────────────────────────────────

export interface CoachBehaviorSignals {
  coachId:                string
  coachName:              string
  recentRecapCount:       number    // recaps submitted in last 14 days
  expectedRecapCount:     number    // expected based on sessions in last 14 days
  hasDetailedObservations: boolean  // at least one detailed observation in last 14 days
  hasEngagementNotes:     boolean   // any enjoyment/engagement language in recent recaps
  playerStallCount:       number    // stalled players under this coach
  advancementFlaggedCount: number   // players flagged for advancement under this coach
  daysSinceLastRecap:     number | null
}

// ── Output types ──────────────────────────────────────────────────────────────

export type CoachAlignmentStatus = 'aligned' | 'partial' | 'misaligned'

export interface CoachDnaAlignmentResult {
  coachId:        string
  coachName:      string
  status:         CoachAlignmentStatus
  alignmentScore: number    // 0–100
  gaps:           string[]  // specific misalignment descriptions
  strengths:      string[]  // specific alignment confirmations
  headline:       string
  recommendation: string | null
  dnaStandard:    string    // what this DNA model requires of coaches
}

export interface AcademyCoachAlignmentSummary {
  totalCoaches:        number
  alignedCount:        number
  partialCount:        number
  misalignedCount:     number
  overallStatus:       CoachAlignmentStatus
  topGap:              string | null
  headline:            string
  coachResults:        CoachDnaAlignmentResult[]
}

// ── Alignment evaluation ──────────────────────────────────────────────────────

/**
 * Evaluate a single coach's behavior against Academy DNA standards.
 */
export function evaluateCoachDnaAlignment(
  behavior: CoachBehaviorSignals,
  ctx:      OperatingModelContext,
): CoachDnaAlignmentResult {
  const { coachStandards, dnaModelId } = ctx
  const gaps:      string[] = []
  const strengths: string[] = []

  // ── Check 1: Recap compliance ─────────────────────────────────────────────

  const recapRate = behavior.expectedRecapCount > 0
    ? behavior.recentRecapCount / behavior.expectedRecapCount
    : 1.0

  const recapThreshold = coachStandards.recapExpectation === 'every_session' ? 0.9
    : coachStandards.recapExpectation === 'weekly' ? 0.8
    : 0.7

  if (recapRate >= recapThreshold) {
    strengths.push(`Recap compliance at ${Math.round(recapRate * 100)}% — meets ${ctx.dnaModel.name} standard`)
  } else {
    gaps.push(`Recap compliance at ${Math.round(recapRate * 100)}% — below ${Math.round(recapThreshold * 100)}% standard for ${coachStandards.recapExpectation} expectation`)
  }

  // ── Check 2: Observation depth ────────────────────────────────────────────

  if (coachStandards.observationDepth === 'detailed') {
    if (behavior.hasDetailedObservations) {
      strengths.push('Detailed observations present — meets performance standard')
    } else {
      gaps.push(`No detailed observations in recent sessions — ${ctx.dnaModel.name} requires "${coachStandards.observationDepth}" depth`)
    }
  } else {
    // standard / minimal — engagement notes suffice
    if (behavior.hasEngagementNotes || behavior.hasDetailedObservations) {
      strengths.push('Observation quality meets standard for this DNA model')
    } else {
      gaps.push(`No observations of any kind in recent sessions — check-in required`)
    }
  }

  // ── Check 3: DNA-model-specific check ─────────────────────────────────────

  switch (dnaModelId) {
    case '12u_foundation': {
      if (behavior.hasEngagementNotes) {
        strengths.push('Engagement and enjoyment language present in recaps — aligned with foundation model')
      } else {
        gaps.push('No engagement or enjoyment signals in recent recaps — critical for 12U foundation model parent communication')
      }
      break
    }
    case 'performance_12plus': {
      if (behavior.advancementFlaggedCount > 0 || behavior.playerStallCount === 0) {
        strengths.push('Advancement pipeline monitoring active')
      } else if (behavior.playerStallCount > 0) {
        gaps.push(`${behavior.playerStallCount} stalled player${behavior.playerStallCount > 1 ? 's' : ''} under this coach — advancement flagging expected`)
      }
      break
    }
    case 'college_placement': {
      if (behavior.hasDetailedObservations) {
        strengths.push('Match and performance observations documented — recruiting record maintained')
      } else {
        gaps.push('No detailed performance observations — college placement academy requires match-level notes per session')
      }
      break
    }
    case 'club_growth': {
      if (behavior.hasEngagementNotes) {
        strengths.push('Community and engagement observations documented — aligned with club growth model')
      } else {
        gaps.push('No engagement or community signals in recent recaps — retention intelligence will be incomplete')
      }
      break
    }
  }

  // ── Stale recap check ─────────────────────────────────────────────────────

  if (behavior.daysSinceLastRecap !== null && behavior.daysSinceLastRecap > coachStandards.overdueRecapThresholdDays) {
    gaps.push(`Last recap ${behavior.daysSinceLastRecap} days ago — exceeds ${coachStandards.overdueRecapThresholdDays}-day threshold for this model`)
  } else if (behavior.daysSinceLastRecap !== null && behavior.daysSinceLastRecap <= coachStandards.overdueRecapThresholdDays) {
    strengths.push(`Recap submitted within expected window (${behavior.daysSinceLastRecap} days)`)
  }

  // ── Score and status ──────────────────────────────────────────────────────

  const totalChecks = gaps.length + strengths.length
  const alignmentScore = totalChecks > 0
    ? Math.round((strengths.length / totalChecks) * 100)
    : 100

  const status: CoachAlignmentStatus =
    alignmentScore >= 80 ? 'aligned'
    : alignmentScore >= 50 ? 'partial'
    : 'misaligned'

  const headline = status === 'aligned'
    ? `${behavior.coachName} is aligned with ${ctx.dnaModel.name} standards`
    : status === 'partial'
      ? `${behavior.coachName} has ${gaps.length} gap${gaps.length > 1 ? 's' : ''} vs. ${ctx.dnaModel.name} standards`
      : `${behavior.coachName} is misaligned with ${ctx.dnaModel.name} standards — follow-up needed`

  const recommendation = gaps.length > 0
    ? `Follow up with ${behavior.coachName}: ${gaps[0]}.`
    : null

  return {
    coachId:        behavior.coachId,
    coachName:      behavior.coachName,
    status,
    alignmentScore,
    gaps,
    strengths,
    headline,
    recommendation,
    dnaStandard:    coachStandards.developmentFocus,
  }
}

// ── Academy-wide summary ──────────────────────────────────────────────────────

/**
 * Build an academy-wide coach alignment summary from individual coach results.
 */
export function buildCoachAlignmentSummary(
  coachResults: CoachDnaAlignmentResult[],
  ctx:          OperatingModelContext,
): AcademyCoachAlignmentSummary {
  const aligned    = coachResults.filter(r => r.status === 'aligned')
  const partial    = coachResults.filter(r => r.status === 'partial')
  const misaligned = coachResults.filter(r => r.status === 'misaligned')

  const overallStatus: CoachAlignmentStatus =
    misaligned.length > 0 ? 'misaligned'
    : partial.length > 0  ? 'partial'
    : 'aligned'

  const allGaps = coachResults.flatMap(r => r.gaps)
  const gapFreq: Record<string, number> = {}
  for (const gap of allGaps) {
    const key = gap.slice(0, 40)  // group by first 40 chars
    gapFreq[key] = (gapFreq[key] ?? 0) + 1
  }
  const topGapEntry = Object.entries(gapFreq).sort((a, b) => b[1] - a[1])[0]
  const topGap = topGapEntry ? `Most common gap: "${topGapEntry[0]}..." (${topGapEntry[1]} coach${topGapEntry[1] > 1 ? 'es' : ''})` : null

  const headline = overallStatus === 'aligned'
    ? `All ${coachResults.length} coach${coachResults.length > 1 ? 'es are' : ' is'} aligned with ${ctx.dnaModel.name} standards`
    : overallStatus === 'partial'
      ? `${partial.length} of ${coachResults.length} coach${coachResults.length > 1 ? 'es have' : ' has'} partial gaps — follow-up recommended`
      : `${misaligned.length} coach${misaligned.length > 1 ? 'es are' : ' is'} misaligned with ${ctx.dnaModel.name} standards — action required`

  return {
    totalCoaches:    coachResults.length,
    alignedCount:    aligned.length,
    partialCount:    partial.length,
    misalignedCount: misaligned.length,
    overallStatus,
    topGap,
    headline,
    coachResults,
  }
}

// ── Recommendation ────────────────────────────────────────────────────────────

/**
 * Build the single most important coach alignment recommendation for the director.
 */
export function buildCoachAlignmentRecommendation(
  summary: AcademyCoachAlignmentSummary,
  ctx:     OperatingModelContext,
): { headline: string; detail: string; actionHref: string } | null {
  if (summary.overallStatus === 'aligned') return null

  const worstCoach = summary.coachResults
    .filter(r => r.status === 'misaligned')
    .sort((a, b) => a.alignmentScore - b.alignmentScore)[0]
    ?? summary.coachResults
      .filter(r => r.status === 'partial')
      .sort((a, b) => a.alignmentScore - b.alignmentScore)[0]

  if (!worstCoach) return null

  return {
    headline: worstCoach.headline,
    detail:   worstCoach.recommendation ?? `Review ${worstCoach.coachName}'s recent sessions against ${ctx.dnaModel.name} standards.`,
    actionHref: '/director/sessions',
  }
}
