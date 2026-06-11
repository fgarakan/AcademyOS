// Sprint 1776–1805 — DONNA Academy Operating Partner V1
// Academy Opportunity Engine: detects positive signals and converts them into
// OperatingWin[] (max 3) for the DirectorOperatingBrief.
//
// Wins are the POSITIVE counterpart to priorities. They surface what is working
// so the director can reinforce it — not just react to problems.
//
// Intelligence hierarchy applies: reality > evidence > memory > philosophy.
// A win confirmed by player evidence outranks one inferred from philosophy preferences.

import type { OperatingWin } from './operatingPartnerOutputContract'
import type { OperatingPartnerInputs } from './operatingPartnerInputContract'

// ── Opportunity type (internal) ────────────────────────────────────────────────

interface AcademyOpportunity {
  id:         string
  score:      number   // higher = show first; 0–100
  win:        OperatingWin
}

// ── Opportunity detectors ──────────────────────────────────────────────────────

function detectPlayerOpportunities(inputs: OperatingPartnerInputs): AcademyOpportunity[] {
  const { players } = inputs.operations
  if (!players.dataAvailable) return []

  const opportunities: AcademyOpportunity[] = []
  const total = Math.max(players.totalPlayerCount, 1)

  // Strong advancement momentum
  if (players.advancementEligibleCount >= 3) {
    const rate = Math.round((players.advancementEligibleCount / total) * 100)
    opportunities.push({
      id: 'player-advancement-momentum',
      score: 70 + Math.min(20, players.advancementEligibleCount * 2),
      win: {
        rank: 0,
        headline: `${players.advancementEligibleCount} players ready to advance (${rate}% advancement rate)`,
        domain: 'players',
        evidence: `${players.advancementEligibleCount} of ${players.totalPlayerCount} active players have met level criteria — a strong positive signal for curriculum effectiveness.`,
        confidence: players.hasAssessmentData ? 'reliable' : 'provisional',
      },
    })
  }

  // Low stall rate
  const stallRate = players.stallCount / total
  if (stallRate < 0.1 && players.totalPlayerCount >= 5) {
    opportunities.push({
      id: 'player-low-stall',
      score: 60,
      win: {
        rank: 0,
        headline: `Stall rate is low: only ${players.stallCount} of ${players.totalPlayerCount} players stalled`,
        domain: 'players',
        evidence: `${Math.round((1 - stallRate) * 100)}% of players are progressing — above-average development flow.`,
        confidence: players.hasStallData ? 'reliable' : 'provisional',
      },
    })
  }

  return opportunities
}

function detectCoachOpportunities(inputs: OperatingPartnerInputs): AcademyOpportunity[] {
  const { coaches } = inputs.operations
  if (!coaches.dataAvailable) return []

  const opportunities: AcademyOpportunity[] = []

  // High wrap-up rate
  if (coaches.hasWrapUpData && coaches.recentWrapUpSubmissionRate >= 0.85) {
    opportunities.push({
      id: 'coach-high-wrapup-rate',
      score: 75,
      win: {
        rank: 0,
        headline: `Coach recap rate: ${Math.round(coaches.recentWrapUpSubmissionRate * 100)}% — strong intelligence flow`,
        domain: 'coaches',
        evidence: `${Math.round(coaches.recentWrapUpSubmissionRate * 100)}% of sessions have coach recaps submitted. DONNA has reliable signal coverage.`,
        confidence: 'reliable',
      },
    })
  }

  // No inconsistent execution
  if (coaches.hasExecutionData && coaches.inconsistentExecutionCount === 0 && coaches.totalCoachCount >= 2) {
    opportunities.push({
      id: 'coach-consistent-execution',
      score: 65,
      win: {
        rank: 0,
        headline: 'All coaches executing curriculum consistently',
        domain: 'coaches',
        evidence: `${coaches.totalCoachCount} coaches — zero delivery inconsistencies detected in recent sessions.`,
        confidence: 'reliable',
      },
    })
  }

  // No stagnant-player coaches
  if (coaches.stagnantPlayerByCoachCount === 0 && coaches.totalCoachCount >= 2 && coaches.missingWrapUpCount === 0) {
    opportunities.push({
      id: 'coach-no-stagnant-load',
      score: 60,
      win: {
        rank: 0,
        headline: 'No coach is carrying multiple stalled players',
        domain: 'coaches',
        evidence: 'No coaches identified with 2+ stalled player assignments — load is balanced and coaching is effective.',
        confidence: coaches.hasExecutionData ? 'reliable' : 'provisional',
      },
    })
  }

  return opportunities
}

function detectCurriculumOpportunities(inputs: OperatingPartnerInputs): AcademyOpportunity[] {
  const { curriculum } = inputs.operations
  if (!curriculum.dataAvailable) return []

  const opportunities: AcademyOpportunity[] = []

  // No empty levels
  if (curriculum.emptyLevelCount === 0 && curriculum.hasCurriculumData) {
    opportunities.push({
      id: 'curriculum-no-empty-levels',
      score: 70,
      win: {
        rank: 0,
        headline: 'Curriculum fully populated — no empty levels',
        domain: 'curriculum',
        evidence: 'Every active curriculum level has academy-owned content. Players advancing through levels have a complete development path.',
        confidence: 'reliable',
      },
    })
  }

  // No missing gates
  if (curriculum.missingGateCount === 0 && curriculum.hasGateData) {
    opportunities.push({
      id: 'curriculum-gates-complete',
      score: 65,
      win: {
        rank: 0,
        headline: 'Advancement gates defined for all levels',
        domain: 'curriculum',
        evidence: 'All levels have defined advancement criteria. Coaches can objectively assess player readiness.',
        confidence: 'reliable',
      },
    })
  }

  // Player-evidenced bottlenecks cleared
  if (curriculum.playerBackedBottleneckCount === 0 && curriculum.hasPlayerEvidenceData) {
    opportunities.push({
      id: 'curriculum-no-player-bottlenecks',
      score: 80,
      win: {
        rank: 0,
        headline: 'No player-evidenced curriculum bottlenecks',
        domain: 'curriculum',
        evidence: 'Player evidence records show no levels blocking advancement. Curriculum is supporting player flow.',
        confidence: 'reliable',
      },
    })
  }

  return opportunities
}

function detectParentOpportunities(inputs: OperatingPartnerInputs): AcademyOpportunity[] {
  const { parents } = inputs.operations
  if (!parents.dataAvailable) return []

  const opportunities: AcademyOpportunity[] = []

  // No retention risk
  if (parents.retentionRiskCount === 0 && parents.hasRetentionData && parents.totalParentCount >= 3) {
    opportunities.push({
      id: 'parents-no-retention-risk',
      score: 75,
      win: {
        rank: 0,
        headline: 'No parent retention risk detected',
        domain: 'parents',
        evidence: `${parents.totalParentCount} families — zero at-risk families identified. Parent satisfaction signal is positive.`,
        confidence: 'reliable',
      },
    })
  }

  // Low communication gap
  if (parents.hasCommunicationData && parents.communicationGapCount === 0 && parents.totalParentCount >= 3) {
    opportunities.push({
      id: 'parents-communication-current',
      score: 65,
      win: {
        rank: 0,
        headline: 'All families have current updates',
        domain: 'parents',
        evidence: 'No parents identified in communication gap — the academy is meeting its transparency commitment.',
        confidence: 'reliable',
      },
    })
  }

  return opportunities
}

function detectPhilosophyOpportunities(inputs: OperatingPartnerInputs): AcademyOpportunity[] {
  const opportunities: AcademyOpportunity[] = []
  const { drift, preferences, overrides } = inputs.philosophy

  // No drift
  if (!drift.driftDetected) {
    opportunities.push({
      id: 'philosophy-no-drift',
      score: 60,
      win: {
        rank: 0,
        headline: 'Academy DNA is consistent — no philosophy drift detected',
        domain: 'philosophy',
        evidence: 'Recent curriculum decisions and coach actions are aligned with stated academy identity.',
        confidence: drift.confidence,
      },
    })
  }

  // Strong clear preference
  const strongPref = preferences.topPreferences.find(p => p.score >= 80 && p.confidence === 'reliable')
  if (strongPref) {
    opportunities.push({
      id: 'philosophy-strong-identity-signal',
      score: 65,
      win: {
        rank: 0,
        headline: `Strong identity signal: "${strongPref.label}"`,
        domain: 'philosophy',
        evidence: `Academy preference score ${strongPref.score}/100 with reliable confidence. This identity signal is clear and reinforced by decision history.`,
        confidence: 'reliable',
      },
    })
  }

  // Reality confirms philosophy
  if (overrides.length === 0 && inputs.missingCriticalInputs.length === 0) {
    opportunities.push({
      id: 'philosophy-reality-confirmed',
      score: 55,
      win: {
        rank: 0,
        headline: 'Player evidence confirms stated philosophy — no contradictions',
        domain: 'philosophy',
        evidence: 'No reality-philosophy contradictions detected. What the academy says it does and what it actually does are aligned.',
        confidence: 'reliable',
      },
    })
  }

  return opportunities
}

// ── Main entry points ──────────────────────────────────────────────────────────

export function detectAllOpportunities(inputs: OperatingPartnerInputs): AcademyOpportunity[] {
  return [
    ...detectPlayerOpportunities(inputs),
    ...detectCoachOpportunities(inputs),
    ...detectCurriculumOpportunities(inputs),
    ...detectParentOpportunities(inputs),
    ...detectPhilosophyOpportunities(inputs),
  ].sort((a, b) => b.score - a.score)
}

export function buildTopWins(inputs: OperatingPartnerInputs): OperatingWin[] {
  const all = detectAllOpportunities(inputs)
  return all.slice(0, 3).map((opp, i) => ({ ...opp.win, rank: i + 1 }))
}
