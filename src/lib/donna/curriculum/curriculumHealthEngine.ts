// DONNA Curriculum Evolution Engine V1 — Mega Sprint 1866–1895
// Curriculum Health Engine: synthesizes all intelligence into a holistic
// assessment of curriculum quality.
//
// Pure TypeScript — no DB calls.
//
// IMPORTANT: No score. No grade. No 84/100. No letter grades.
// Output is strengths / weaknesses / risks / opportunities — text only.
// Quantifying curriculum health into a single number destroys nuance.
// Directors are professionals. They deserve evidence, not a scorecard.

import type {
  CurriculumLevelSummary,
  PlayerLevelSummary,
} from './curriculumIntelligenceContext'
import type { CurriculumGapReport } from './curriculumGapAnalysis'
import type { BottleneckReport } from './curriculumBottleneckDetector'
import type { GateHealthReport } from './gateEffectivenessEngine'
import type { DrillEffectivenessReport } from './curriculumEffectivenessEngine'
import type { RealityOverrideReport } from './curriculumRealityOverride'

// ── Output type ───────────────────────────────────────────────────────────────

export interface CurriculumHealth {
  strengths:     string[]
  weaknesses:    string[]
  risks:         string[]
  opportunities: string[]
  /** How confident DONNA is in this assessment (0–100) */
  confidence:    number
  /** Narrative summary for the director */
  summary:       string
  computedAt:    string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function totalPlayers(playerByLevel: PlayerLevelSummary[]): number {
  return playerByLevel.reduce((sum, p) => sum + p.playerCount, 0)
}

function levelsWithPlayers(playerByLevel: PlayerLevelSummary[]): PlayerLevelSummary[] {
  return playerByLevel.filter(p => p.playerCount > 0)
}

// ── Analysis sections ─────────────────────────────────────────────────────────

function buildStrengths(
  levels: CurriculumLevelSummary[],
  playerByLevel: PlayerLevelSummary[],
  gateReport: GateHealthReport,
  effectivenessReport: DrillEffectivenessReport,
): string[] {
  const strengths: string[] = []

  // Non-empty levels
  const populated = levels.filter(l => !l.isEmpty)
  if (populated.length > 0) {
    strengths.push(`${populated.length} of ${levels.length} curriculum levels have content`)
  }

  // Players advancing
  const advancing = playerByLevel.filter(p => p.advancementEligibleCount > 0)
  if (advancing.length > 0) {
    const total = totalPlayers(playerByLevel)
    const eligible = playerByLevel.reduce((s, p) => s + p.advancementEligibleCount, 0)
    if (total > 0 && eligible > 0) {
      strengths.push(`${eligible} of ${total} players are advancement-eligible`)
    }
  }

  // Healthy gates
  if (gateReport.healthy.length > 0) {
    strengths.push(`${gateReport.healthy.length} advancement gate${gateReport.healthy.length > 1 ? 's' : ''} are well-supported`)
  }

  // High-effectiveness drills
  if (effectivenessReport.highCount > 0) {
    strengths.push(`${effectivenessReport.highCount} curriculum item${effectivenessReport.highCount > 1 ? 's' : ''} show strong effectiveness signals`)
  }

  // Evidence-backed levels
  const evidenceBacked = playerByLevel.filter(p => p.hasEvidence && p.evidenceSource === 'evidence_records')
  if (evidenceBacked.length > 0) {
    strengths.push(`${evidenceBacked.length} level${evidenceBacked.length > 1 ? 's have' : ' has'} real evidence records — recommendations are grounded in data`)
  }

  return strengths
}

function buildWeaknesses(
  levels: CurriculumLevelSummary[],
  gapReport: CurriculumGapReport,
  bottleneckReport: BottleneckReport,
  gateReport: GateHealthReport,
): string[] {
  const weaknesses: string[] = []

  // Missing areas
  if (gapReport.missingAreas.length > 0) {
    const names = gapReport.missingAreas.slice(0, 3).map(g => g.levelName).join(', ')
    weaknesses.push(`${gapReport.missingAreas.length} level${gapReport.missingAreas.length > 1 ? 's' : ''} have no curriculum content (${names}${gapReport.missingAreas.length > 3 ? '...' : ''})`)
  }

  // Underrepresented types
  if (gapReport.underrepresentedTypes.length > 0) {
    const missing = Array.from(new Set(gapReport.underrepresentedTypes.map(g => g.contentType)))
    weaknesses.push(`"${missing.join('", "')}" content is missing from levels that should have it`)
  }

  // Progression gaps
  if (gapReport.progressionGaps.length > 0) {
    weaknesses.push(`${gapReport.progressionGaps.length} level${gapReport.progressionGaps.length > 1 ? 's have' : ' has'} drills but no progressions — coaches cannot differentiate challenge`)
  }

  // Unsupported gates
  if (gateReport.unsupported.length > 0) {
    weaknesses.push(`${gateReport.unsupported.length} advancement gate${gateReport.unsupported.length > 1 ? 's have' : ' has'} no supporting curriculum content`)
  }

  // Active bottlenecks (not suppressed by good outcomes)
  const realBottlenecks = bottleneckReport.bottlenecks.filter(b => !b.suppressedByOutcomes && b.severity !== 'low')
  if (realBottlenecks.length > 0) {
    weaknesses.push(`${realBottlenecks.length} active bottleneck${realBottlenecks.length > 1 ? 's' : ''} detected with player progression impact`)
  }

  // Drill-heavy levels
  if (gapReport.drillHeavyLevels.length > 0) {
    const names = gapReport.drillHeavyLevels.slice(0, 2).map(g => g.levelName).join(', ')
    weaknesses.push(`${gapReport.drillHeavyLevels.length} level${gapReport.drillHeavyLevels.length > 1 ? 's are' : ' is'} drill-heavy with insufficient game content (${names}${gapReport.drillHeavyLevels.length > 2 ? '...' : ''})`)
  }

  return weaknesses
}

function buildRisks(
  bottleneckReport: BottleneckReport,
  gateReport: GateHealthReport,
  overrideReport: RealityOverrideReport,
): string[] {
  const risks: string[] = []

  // Critical bottlenecks
  if (bottleneckReport.critical.length > 0) {
    risks.push(`${bottleneckReport.critical.length} critical bottleneck${bottleneckReport.critical.length > 1 ? 's are' : ' is'} affecting player progression immediately`)
  }

  // Gate bottlenecks
  if (gateReport.bottlenecks.length > 0) {
    risks.push(`${gateReport.bottlenecks.length} advancement gate${gateReport.bottlenecks.length > 1 ? 's' : ''} may be creating unnecessary barriers to progression`)
  }

  // Reality overrides
  const critical = overrideReport.overrides.filter(o => o.severity === 'critical')
  if (critical.length > 0) {
    risks.push(`${critical.length} critical reality/curriculum mismatch${critical.length > 1 ? 'es' : ''} — real outcomes contradict curriculum design`)
  }

  const high = overrideReport.overrides.filter(o => o.severity === 'high')
  if (high.length > 0) {
    risks.push(`${high.length} high-severity philosophy/reality conflict${high.length > 1 ? 's' : ''} — director review recommended`)
  }

  // Suppressed bottlenecks still worth noting as risks
  if (bottleneckReport.suppressed.length > 3) {
    risks.push(`${bottleneckReport.suppressed.length} structural gaps are currently suppressed by good player outcomes — monitor closely`)
  }

  return risks
}

function buildOpportunities(
  levels: CurriculumLevelSummary[],
  playerByLevel: PlayerLevelSummary[],
  gapReport: CurriculumGapReport,
  gateReport: GateHealthReport,
  effectivenessReport: DrillEffectivenessReport,
): string[] {
  const opportunities: string[] = []

  // Sparse levels with players = quick wins
  const sparseWithPlayers = levels.filter(l => l.isSparse).filter(l =>
    playerByLevel.some(p => p.levelId === l.id && p.playerCount > 0),
  )
  if (sparseWithPlayers.length > 0) {
    opportunities.push(`${sparseWithPlayers.length} active level${sparseWithPlayers.length > 1 ? 's are' : ' is'} sparse — a few well-targeted additions would immediately improve coach options`)
  }

  // Levels where improvement suggestions exist and have evidence
  const evidencedSuggestions = playerByLevel.filter(p =>
    p.improvementSuggestions.length > 0 && p.hasEvidence,
  )
  if (evidencedSuggestions.length > 0) {
    opportunities.push(`${evidencedSuggestions.length} level${evidencedSuggestions.length > 1 ? 's have' : ' has'} evidence-backed improvement suggestions ready to act on`)
  }

  // Bypassed gates = opportunity to strengthen assessment quality
  const bypassed = gateReport.gates.filter(g => g.healthStatus === 'bypassed')
  if (bypassed.length > 0) {
    opportunities.push(`${bypassed.length} gate${bypassed.length > 1 ? 's appear' : ' appears'} to be passed without meaningful assessment — strengthen gate criteria for better advancement quality`)
  }

  // Low-effectiveness items = candidates for improvement
  if (effectivenessReport.lowCount > 0) {
    opportunities.push(`${effectivenessReport.lowCount} curriculum item${effectivenessReport.lowCount > 1 ? 's are' : ' is'} flagged as low-effectiveness — improving or replacing them could have measurable impact`)
  }

  // Missing game content
  if (gapReport.drillHeavyLevels.length > 0) {
    opportunities.push(`Adding game-based content to drill-heavy levels would improve match-transfer and player engagement`)
  }

  return opportunities
}

function buildSummary(
  strengthCount: number,
  weaknessCount: number,
  riskCount: number,
  opportunityCount: number,
  totalPlayers: number,
): string {
  if (totalPlayers === 0) {
    return 'No active players — curriculum health cannot be fully assessed. Structural analysis only.'
  }

  const parts: string[] = []

  if (strengthCount > 0) {
    parts.push(`${strengthCount} strength${strengthCount > 1 ? 's' : ''} identified`)
  }
  if (riskCount > 0) {
    parts.push(`${riskCount} risk${riskCount > 1 ? 's' : ''} require attention`)
  }
  if (weaknessCount > 0) {
    parts.push(`${weaknessCount} weakness${weaknessCount > 1 ? 'es' : ''} to address`)
  }
  if (opportunityCount > 0) {
    parts.push(`${opportunityCount} improvement opportunit${opportunityCount > 1 ? 'ies' : 'y'} available`)
  }

  return parts.length > 0 ? parts.join('. ') + '.' : 'Curriculum analysis complete.'
}

// ── Confidence ────────────────────────────────────────────────────────────────

function computeHealthConfidence(playerByLevel: PlayerLevelSummary[]): number {
  const withPlayers = levelsWithPlayers(playerByLevel)
  if (withPlayers.length === 0) return 20

  const withEvidence = withPlayers.filter(p => p.hasEvidence)
  const withRealRecords = withPlayers.filter(p => p.evidenceSource === 'evidence_records')

  const coverage = withEvidence.length / withPlayers.length
  const quality  = withRealRecords.length / withPlayers.length

  return Math.round(30 + (coverage * 40) + (quality * 30))
}

// ── Main export ───────────────────────────────────────────────────────────────

export function evaluateCurriculumHealth(params: {
  levels:              CurriculumLevelSummary[]
  playerByLevel:       PlayerLevelSummary[]
  gapReport:           CurriculumGapReport
  bottleneckReport:    BottleneckReport
  gateReport:          GateHealthReport
  effectivenessReport: DrillEffectivenessReport
  overrideReport:      RealityOverrideReport
}): CurriculumHealth {
  const { levels, playerByLevel, gapReport, bottleneckReport, gateReport, effectivenessReport, overrideReport } = params

  const strengths     = buildStrengths(levels, playerByLevel, gateReport, effectivenessReport)
  const weaknesses    = buildWeaknesses(levels, gapReport, bottleneckReport, gateReport)
  const risks         = buildRisks(bottleneckReport, gateReport, overrideReport)
  const opportunities = buildOpportunities(levels, playerByLevel, gapReport, gateReport, effectivenessReport)
  const confidence    = computeHealthConfidence(playerByLevel)
  const total         = totalPlayers(playerByLevel)

  return {
    strengths,
    weaknesses,
    risks,
    opportunities,
    confidence,
    summary:    buildSummary(strengths.length, weaknesses.length, risks.length, opportunities.length, total),
    computedAt: new Date().toISOString(),
  }
}
