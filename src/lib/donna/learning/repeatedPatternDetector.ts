// Sprint 1761 — DONNA Learning Foundations V1
// Repeated pattern detection — identifies recurring signals across player attention,
// curriculum gaps, advancement eligibility, and assessment coverage.
// No causal claims. Pattern observation only. No outcome inference.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { LearningSignal, LearningConfidence } from './academyLearningEngine'

// ── Helpers ───────────────────────────────────────────────────────────────────

function confidenceFromCount(n: number): LearningConfidence {
  if (n >= 10) return 'medium'
  if (n >= 3)  return 'low'
  return 'insufficient'
}

// ── Repeated pattern signals ──────────────────────────────────────────────────

/** Builds repeated pattern signals from available context. */
export function buildRepeatedPatternSignals(ctx: DirectorDonnaContext): LearningSignal[] {
  const signals: LearningSignal[] = []

  // ── Curriculum gap cluster ────────────────────────────────────────────────

  if (ctx.curriculumGaps.length >= 2) {
    signals.push({
      id: 'curriculum_gap_cluster',
      category: 'curriculum_learning',
      title: 'Curriculum Coverage Gaps — Pattern Observed',
      summary: `${ctx.curriculumGaps.length} curriculum gap areas detected in current data.`,
      observedPattern: `${ctx.curriculumGaps.length} curriculum coverage gaps appear in current academy data. Whether these are recurring across weeks or newly detected cannot be determined without historical snapshots — V1 does not track gap history.`,
      supportingEvidence: ctx.curriculumGaps.slice(0, 3),
      affectedPlayers: [],
      affectedLevels: [],
      relatedDecisions: [],
      recommendation: 'These gaps should be monitored over time. V1 cannot confirm whether they are worsening, stable, or newly appeared.',
      confidence: confidenceFromCount(ctx.curriculumGaps.length),
      limitations: [
        'V1 does not track historical gap state — cannot confirm recurrence vs. new gaps.',
        'Gap severity is not ranked in this signal.',
        'No causal link between curriculum gaps and player outcomes is inferred.',
        'Do not interpret gap presence as evidence of curriculum failure.',
      ],
      nextAction: 'Review curriculum gap report in the curriculum explorer.',
      destination: '/director/curriculum',
    })
  }

  // ── High-risk player attention cluster ────────────────────────────────────

  const highRisk = ctx.attentionItems.filter(i => i.risk === 'high')
  if (highRisk.length >= 2) {
    const playerNames = highRisk
      .filter(i => i.playerName)
      .map(i => i.playerName as string)
      .slice(0, 3)

    signals.push({
      id: 'player_attention_high_risk_cluster',
      category: 'progression_learning',
      title: 'Multiple High-Risk Attention Items — Pattern Should Be Monitored',
      summary: `${highRisk.length} high-risk attention items currently active.`,
      observedPattern: `${highRisk.length} players appear in the high-risk attention queue. This pattern should be monitored. V1 cannot determine whether these are persistent risks or newly surfaced signals.`,
      supportingEvidence: [
        `${highRisk.length} high-risk items in attention queue`,
        ...(playerNames.length > 0 ? [`Players flagged: ${playerNames.join(', ')}`] : []),
      ],
      affectedPlayers: playerNames,
      affectedLevels: [],
      relatedDecisions: [],
      recommendation: 'High-risk attention items should be reviewed. Needs more history to confirm whether these players are persistently at risk.',
      confidence: confidenceFromCount(highRisk.length),
      limitations: [
        'V1 cannot confirm whether these players have been flagged repeatedly or for the first time.',
        'Risk signals reflect current session data — not longitudinal trend data.',
        'No inference made about cause of high-risk status.',
        'High-risk does not imply the academy is responsible.',
      ],
      nextAction: 'Review high-risk player profiles in the director dashboard.',
      destination: '/director',
    })
  }

  // ── Advancement eligibility cluster ──────────────────────────────────────

  if (ctx.advancementEligibleCount >= 2) {
    signals.push({
      id: 'advancement_eligibility_cluster',
      category: 'progression_learning',
      title: 'Advancement-Eligible Players — Snapshot Observation',
      summary: `${ctx.advancementEligibleCount} players currently appear advancement-eligible.`,
      observedPattern: `${ctx.advancementEligibleCount} players are currently flagged as advancement-eligible in curriculum states. This is a snapshot observation — no causal link to specific curriculum changes, coach actions, or assessments is inferred.`,
      supportingEvidence: [
        `${ctx.advancementEligibleCount} players marked advancement-eligible`,
        `${ctx.playerCurriculumStateCount} total curriculum states loaded`,
      ],
      affectedPlayers: [],
      affectedLevels: [],
      relatedDecisions: [],
      recommendation: 'Advancement eligibility should be confirmed through formal assessment before any level change proposal.',
      confidence: ctx.advancementEligibleCount >= 3 ? 'low' : 'insufficient',
      limitations: [
        'Eligibility is based on curriculum state data only — formal assessment required before any advancement.',
        'V1 cannot determine whether these players became eligible recently or have been eligible for some time.',
        'No causal link to any curriculum change, coach action, or parent communication is inferred.',
        'This signal must not be used to bypass the finalize_player_placement() pathway.',
      ],
      nextAction: 'Review advancement-eligible players in the player directory and initiate formal assessment if appropriate.',
      destination: '/director/players',
    })
  }

  // ── Player progress stall cluster ─────────────────────────────────────────

  if (ctx.playerProgressStallCount >= 2) {
    const stallNames = ctx.playerProgressStalls
      .slice(0, 3)
      .map(s => s.playerName)

    signals.push({
      id: 'player_progress_stall_cluster',
      category: 'progression_learning',
      title: 'Multiple Progress Stalls — Pattern Should Be Monitored',
      summary: `${ctx.playerProgressStallCount} player progress stalls detected in current data.`,
      observedPattern: `${ctx.playerProgressStallCount} players appear to have progress stalls in current data. This pattern should be monitored. V1 makes no causal inference about why stalls occurred.`,
      supportingEvidence: [
        `${ctx.playerProgressStallCount} progress stall signals`,
        ...(stallNames.length > 0 ? [`Players: ${stallNames.join(', ')}`] : []),
      ],
      affectedPlayers: stallNames,
      affectedLevels: [],
      relatedDecisions: [],
      recommendation: 'Stalled players may benefit from observation and assessment review. Needs more history to confirm whether stalls are persistent.',
      confidence: confidenceFromCount(ctx.playerProgressStallCount),
      limitations: [
        'V1 cannot determine the duration of stalls.',
        'Stall detection is based on a current snapshot — historical trend not available.',
        'No causal link to coaching patterns, curriculum gaps, or attendance is inferred.',
        'Stall may reflect healthy consolidation, not regression.',
      ],
      nextAction: 'Review stalled player profiles and consider initiating an assessment review.',
      destination: '/director/players',
    })
  }

  // ── Assessment coverage gap cluster ──────────────────────────────────────

  if (ctx.assessmentCoverageGapCount >= 2) {
    signals.push({
      id: 'assessment_coverage_gap_cluster',
      category: 'assessment_learning',
      title: 'Assessment Coverage Gaps — Pattern Observed',
      summary: `${ctx.assessmentCoverageGapCount} assessment coverage gaps detected.`,
      observedPattern: `${ctx.assessmentCoverageGapCount} players have assessment coverage gaps. ${ctx.eligibleWithoutAssessmentEvidence} of these are advancement-eligible but lack assessment evidence. This appears associated — no causal inference is made.`,
      supportingEvidence: [
        `${ctx.assessmentCoverageGapCount} assessment coverage gaps`,
        `${ctx.eligibleWithoutAssessmentEvidence} advancement-eligible players without assessment evidence`,
      ],
      affectedPlayers: [],
      affectedLevels: [],
      relatedDecisions: [],
      recommendation: 'Assessment coverage should be improved before advancement decisions are proposed. This signal should be monitored over time.',
      confidence: confidenceFromCount(ctx.assessmentCoverageGapCount),
      limitations: [
        'V1 cannot determine whether gaps are due to missing assessments or missing evidence records.',
        'No causal link to player outcomes is inferred.',
        'Needs more history to confirm whether this is a recurring gap.',
        'Assessment completion does not imply advancement readiness.',
      ],
      nextAction: 'Review assessment coverage in the curriculum explorer and schedule missing assessments.',
      destination: '/director/curriculum',
    })
  }

  return signals
}
