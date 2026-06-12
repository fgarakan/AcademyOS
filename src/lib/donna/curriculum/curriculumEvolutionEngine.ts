// DONNA Curriculum Evolution Engine V1 — Mega Sprint 1866–1895
// Master evolution orchestrator: consumes all reality signals and produces
// actionable EvolutionRecommendation[] with full explainability.
//
// Architecture:
//   CurriculumIntelligenceContext → sub-engines → EvolutionRecommendation[]
//
// No DB calls. No LLM calls. Deterministic.
// Director approval required for all changes. Nothing is automatic.

import type { CurriculumIntelligenceContext } from './curriculumIntelligenceContext'
import type { CurriculumGapReport } from './curriculumGapAnalysis'
import { detectBottlenecks, type BottleneckReport } from './curriculumBottleneckDetector'
import { analyzeProgression, type ProgressionInsights } from './curriculumProgressionAnalyzer'
import { rateDrillEffectiveness, type DrillEffectivenessReport } from './curriculumEffectivenessEngine'
import { evaluateGateHealth, type GateHealthReport } from './gateEffectivenessEngine'
import { evaluateCurriculumHealth, type CurriculumHealth } from './curriculumHealthEngine'
import { detectRealityOverrides, type RealityOverrideReport } from './curriculumRealityOverride'
import {
  computeEvidenceStrength,
  arePlayerOutcomesExcellent,
  clampRecommendationType,
  isRecommendationTypeAllowed,
  type EvidenceStrength,
  type RecommendationType,
} from './curriculumEvidenceStrength'

// ── Output types ──────────────────────────────────────────────────────────────

export interface EvolutionRecommendation {
  id:                 string
  title:              string
  reason:             string
  evidence:           string[]
  evidenceStrength:   EvidenceStrength
  recommendationType: RecommendationType
  confidence:         number
  expectedImpact:     'high' | 'medium' | 'low' | 'unknown'
  affectedLevels:     string[]
  affectedSkills:     string[]
  affectedGates:      string[]
  affectedPlayerCount: number
  recommendedAction:  string
  priority:           1 | 2 | 3
  // Full explainability — Part 9
  why:                string
  expectedBenefit:    string
  possibleRisk:       string | null
  alternativeOptions: string[]
  missingData:        string[]
}

export interface CurriculumEvolutionReport {
  recommendations:     EvolutionRecommendation[]
  topRecommendations:  EvolutionRecommendation[]  // priority 1 only
  bottleneckReport:    BottleneckReport
  progressionInsights: ProgressionInsights
  effectivenessReport: DrillEffectivenessReport
  gateReport:          GateHealthReport
  healthReport:        CurriculumHealth
  overrideReport:      RealityOverrideReport
  totalPlayerCount:    number
  dataConfidence:      number
  computedAt:          string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let _idCounter = 0
function makeRecId(suffix: string): string {
  return `er_${++_idCounter}_${suffix.replace(/[^a-z0-9]/gi, '_').slice(0, 20)}`
}

function capConfidence(base: number, strength: EvidenceStrength): number {
  const caps: Record<EvidenceStrength, number> = {
    high:         95,
    medium:       75,
    low:          55,
    insufficient: 35,
  }
  return Math.min(base, caps[strength])
}

// ── Recommendation builders ───────────────────────────────────────────────────

function fromBottlenecks(
  bottleneckReport: BottleneckReport,
  ctx: CurriculumIntelligenceContext,
): EvolutionRecommendation[] {
  const recs: EvolutionRecommendation[] = []

  for (const bn of bottleneckReport.bottlenecks) {
    if (bn.evidenceStrength === 'insufficient' && !bn.suppressedByOutcomes) {
      // Only INVESTIGATE for no-evidence bottlenecks
      const type = clampRecommendationType(bn.evidenceStrength, 'INVESTIGATE')
      recs.push({
        id:                 makeRecId(bn.id),
        title:              bn.title,
        reason:             `${bn.type.replace(/_/g, ' ')} detected`,
        evidence:           bn.evidence,
        evidenceStrength:   bn.evidenceStrength,
        recommendationType: type,
        confidence:         capConfidence(bn.confidence, bn.evidenceStrength),
        expectedImpact:     'unknown',
        affectedLevels:     bn.levelId ? [bn.levelId] : [],
        affectedSkills:     [],
        affectedGates:      bn.gateId ? [bn.gateId] : [],
        affectedPlayerCount: bn.affectedCount,
        recommendedAction:  'Investigate this level further before making curriculum changes.',
        priority:           3,
        why:                `A potential ${bn.type.replace(/_/g, ' ')} was detected but there is insufficient player data to confirm.`,
        expectedBenefit:    'Better understanding of the issue before action.',
        possibleRisk:       null,
        alternativeOptions: ['Monitor without action until more data is available'],
        missingData:        ['Player evidence records', 'Advancement outcome history'],
      })
      continue
    }

    // Suppressed by excellent outcomes → MONITOR only
    if (bn.suppressedByOutcomes) {
      recs.push({
        id:                 makeRecId(bn.id + '_sup'),
        title:              `Monitor: ${bn.title} (outcomes are currently good)`,
        reason:             'Structural gap detected but player outcomes are strong',
        evidence:           bn.evidence,
        evidenceStrength:   bn.evidenceStrength,
        recommendationType: 'MONITOR',
        confidence:         capConfidence(20, bn.evidenceStrength),
        expectedImpact:     'low',
        affectedLevels:     bn.levelId ? [bn.levelId] : [],
        affectedSkills:     [],
        affectedGates:      bn.gateId ? [bn.gateId] : [],
        affectedPlayerCount: bn.affectedCount,
        recommendedAction:  'No immediate action needed. Monitor as player numbers grow.',
        priority:           3,
        why:                'Reality (player outcomes) contradicts the structural signal. Reality wins — no action recommended.',
        expectedBenefit:    'Avoids unnecessary curriculum change when players are succeeding.',
        possibleRisk:       'If outcomes deteriorate, this signal should be re-evaluated.',
        alternativeOptions: ['Take no action', 'Re-review when player count changes significantly'],
        missingData:        [],
      })
      continue
    }

    // Real bottleneck
    const desiredType: RecommendationType =
      bn.type === 'no_progression'   ? 'CREATE' :
      bn.type === 'gate_stuck'       ? 'CREATE' :
      bn.type === 'level_stuck'      ? 'IMPROVE' :
      bn.type === 'concept_skip'     ? 'CREATE' :
      bn.type === 'underused_level'  ? 'INVESTIGATE' : 'INVESTIGATE'

    const type = clampRecommendationType(bn.evidenceStrength, desiredType)

    const priority: 1 | 2 | 3 =
      bn.severity === 'critical' ? 1 :
      bn.severity === 'high'     ? 1 :
      bn.severity === 'medium'   ? 2 : 3

    const impact: EvolutionRecommendation['expectedImpact'] =
      bn.affectedCount >= 10 ? 'high' :
      bn.affectedCount >= 4  ? 'medium' : 'low'

    recs.push({
      id:                 makeRecId(bn.id),
      title:              bn.title,
      reason:             `${bn.severity} severity ${bn.type.replace(/_/g, ' ')}`,
      evidence:           bn.evidence,
      evidenceStrength:   bn.evidenceStrength,
      recommendationType: type,
      confidence:         capConfidence(bn.confidence, bn.evidenceStrength),
      expectedImpact:     impact,
      affectedLevels:     bn.levelId ? [bn.levelId] : [],
      affectedSkills:     [],
      affectedGates:      bn.gateId ? [bn.gateId] : [],
      affectedPlayerCount: bn.affectedCount,
      recommendedAction:  type === 'CREATE' ? 'Add targeted content to address this gap.'
                        : type === 'IMPROVE' ? 'Improve existing content to better support player progression.'
                        : 'Investigate further before making changes.',
      priority,
      why:                bn.evidence.join('. '),
      expectedBenefit:    impact === 'high' ? 'Directly unblocks advancement for a large group of players.'
                        : impact === 'medium' ? 'Improves progression pathways for several players.'
                        : 'Incrementally improves curriculum structure.',
      possibleRisk:       'Adding content to fix a structural gap may not address root causes if player readiness issues exist outside the curriculum.',
      alternativeOptions: ['Monitor without action', 'Ask coaches for qualitative feedback first'],
      missingData:        bn.evidenceStrength === 'low' ? ['More player evidence records needed for higher confidence'] : [],
    })
  }

  return recs
}

function fromGapReport(
  gapReport: CurriculumGapReport,
  ctx: CurriculumIntelligenceContext,
): EvolutionRecommendation[] {
  const recs: EvolutionRecommendation[] = []

  const playerMap: Record<string, { count: number; excellent: boolean }> = {}
  for (const ps of ctx.playerByLevel) {
    playerMap[ps.levelId] = {
      count: ps.playerCount,
      excellent: arePlayerOutcomesExcellent({
        playerCount:          ps.playerCount,
        advancementEligible:  ps.advancementEligibleCount,
        hasEvidence:          ps.hasEvidence,
        evidenceSource:       ps.evidenceSource,
        weakDomainCount:      ps.weakDomains.length,
      }),
    }
  }

  // Missing areas with active players
  for (const gap of gapReport.missingAreas) {
    const pd = playerMap[gap.levelId] ?? { count: 0, excellent: false }
    if (pd.count === 0) continue

    const strength: EvidenceStrength = 'low'
    const type = clampRecommendationType(strength, 'CREATE')

    recs.push({
      id:                 makeRecId(`gap_missing_${gap.levelId}`),
      title:              `${gap.levelName} needs curriculum content`,
      reason:             `${pd.count} players at a level with zero curriculum content`,
      evidence:           [gap.reason, `${pd.count} active players have no curriculum support`],
      evidenceStrength:   strength,
      recommendationType: type,
      confidence:         capConfidence(70, strength),
      expectedImpact:     pd.count >= 10 ? 'high' : 'medium',
      affectedLevels:     [gap.levelId],
      affectedSkills:     [],
      affectedGates:      [],
      affectedPlayerCount: pd.count,
      recommendedAction:  `Create foundational curriculum content for ${gap.levelName}.`,
      priority:           pd.count >= 5 ? 1 : 2,
      why:                `${pd.count} players are at a level with no coaching resources. Coaches have nothing to use.`,
      expectedBenefit:    'Gives coaches structured content to deliver. Improves curriculum consistency.',
      possibleRisk:       'Creating curriculum from scratch without coach input may produce content that does not match actual coaching style.',
      alternativeOptions: ['Ask head coach to contribute initial content', 'Adapt content from an adjacent level'],
      missingData:        ['Coach feedback on what is currently being taught informally'],
    })
  }

  // Drill-heavy levels — but not if outcomes are excellent (false positive prevention)
  for (const gap of gapReport.drillHeavyLevels) {
    const pd = playerMap[gap.levelId] ?? { count: 0, excellent: false }

    if (pd.excellent) {
      recs.push({
        id:                 makeRecId(`gap_drillheavy_sup_${gap.levelId}`),
        title:              `Monitor: ${gap.levelName} is drill-heavy (outcomes currently good)`,
        reason:             'Structural imbalance detected — reality suppresses action',
        evidence:           [gap.note, ...(pd.count > 0 ? [`${pd.count} players with strong advancement signals`] : [])],
        evidenceStrength:   'medium',
        recommendationType: 'MONITOR',
        confidence:         25,
        expectedImpact:     'low',
        affectedLevels:     [gap.levelId],
        affectedSkills:     [],
        affectedGates:      [],
        affectedPlayerCount: pd.count,
        recommendedAction:  'No action needed. Player outcomes are healthy.',
        priority:           3,
        why:                'Structural analysis says drill-heavy, but player outcomes are excellent. Reality wins.',
        expectedBenefit:    'Avoids unnecessary curriculum churn when players are succeeding.',
        possibleRisk:       'If player outcomes change, this should be re-evaluated.',
        alternativeOptions: ['Take no action'],
        missingData:        [],
      })
      continue
    }

    const strength: EvidenceStrength = pd.count > 0 ? 'low' : 'insufficient'
    const type = clampRecommendationType(strength, 'CREATE')

    recs.push({
      id:                 makeRecId(`gap_drillheavy_${gap.levelId}`),
      title:              `${gap.levelName} needs game-based content`,
      reason:             `${gap.pct}% of content is drills with <20% game content`,
      evidence:           [gap.note],
      evidenceStrength:   strength,
      recommendationType: type,
      confidence:         capConfidence(55, strength),
      expectedImpact:     'medium',
      affectedLevels:     [gap.levelId],
      affectedSkills:     [],
      affectedGates:      [],
      affectedPlayerCount: pd.count,
      recommendedAction:  `Add at least one game-based activity at ${gap.levelName} to balance drill work with match transfer.`,
      priority:           2,
      why:                gap.note,
      expectedBenefit:    'Improves match transfer and player engagement with the curriculum.',
      possibleRisk:       'Game content without sufficient drill foundation may not produce intended outcomes.',
      alternativeOptions: ['Add a tactical game', 'Add a match-play theme'],
      missingData:        pd.count === 0 ? ['Player data to validate this structural concern'] : [],
    })
  }

  return recs
}

function fromRealityOverrides(
  overrideReport: RealityOverrideReport,
): EvolutionRecommendation[] {
  return overrideReport.overrides.map(override => {
    const strength: EvidenceStrength =
      override.severity === 'critical' ? 'medium' :
      override.severity === 'high'     ? 'low' : 'low'

    const desiredType: RecommendationType =
      override.type === 'gate_failure'          ? 'INVESTIGATE' :
      override.type === 'advancement_failure'   ? 'INVESTIGATE' :
      override.type === 'curriculum_mismatch'   ? (override.severity === 'critical' ? 'IMPROVE' : 'INVESTIGATE') :
      override.type === 'philosophy_contradiction' ? 'INVESTIGATE' :
      override.type === 'underuse_signal'       ? 'INVESTIGATE' : 'INVESTIGATE'

    const type = clampRecommendationType(strength, desiredType)

    return {
      id:                 makeRecId(`ro_${override.id}`),
      title:              override.title,
      reason:             `Reality contradicts ${override.type.replace(/_/g, ' ')}`,
      evidence:           override.evidence,
      evidenceStrength:   strength,
      recommendationType: type,
      confidence:         capConfidence(override.confidence, strength),
      expectedImpact:     override.severity === 'critical' ? 'high' : override.severity === 'high' ? 'medium' : 'low',
      affectedLevels:     override.affectedLevelId ? [override.affectedLevelId] : [],
      affectedSkills:     [],
      affectedGates:      override.affectedGateId ? [override.affectedGateId] : [],
      affectedPlayerCount: 0,
      recommendedAction:  override.recommendation,
      priority:           override.severity === 'critical' ? 1 : override.severity === 'high' ? 1 : 2,
      why:                `${override.philosophyStates}. However: ${override.realityShows}. Reality always wins.`,
      expectedBenefit:    'Aligns curriculum and philosophy with what is actually happening in the academy.',
      possibleRisk:       'Investigating reality overrides may surface deeper structural issues that require significant change.',
      alternativeOptions: ['Accept the contradiction and monitor', 'Seek coach input before acting'],
      missingData:        [],
    }
  })
}

function fromGateHealth(gateReport: GateHealthReport): EvolutionRecommendation[] {
  const recs: EvolutionRecommendation[] = []

  for (const gate of [...gateReport.bottlenecks, ...gateReport.unsupported]) {
    if (!gate.recommendation) continue

    const strength: EvidenceStrength = gate.suppressedByOutcomes ? 'medium' : gate.evidenceStrength
    const desired: RecommendationType = gate.healthStatus === 'unsupported' ? 'CREATE' : 'INVESTIGATE'
    const type = clampRecommendationType(strength, desired)

    recs.push({
      id:                 makeRecId(`gate_${gate.gateId}`),
      title:              `Gate health issue: ${gate.criterion}`,
      reason:             `Gate status: ${gate.healthStatus.replace(/_/g, ' ')}`,
      evidence:           gate.evidence,
      evidenceStrength:   strength,
      recommendationType: type,
      confidence:         capConfidence(gate.confidence, strength),
      expectedImpact:     gate.healthStatus === 'bottleneck' ? 'high' : 'medium',
      affectedLevels:     [gate.fromLevelId],
      affectedSkills:     [gate.domain],
      affectedGates:      [gate.gateId],
      affectedPlayerCount: 0,
      recommendedAction:  gate.recommendation ?? '',
      priority:           gate.healthStatus === 'bottleneck' ? 1 : 2,
      why:                `Gate "${gate.criterion}" (${gate.fromLevelName} → ${gate.toLevelName}) status: ${gate.healthStatus.replace(/_/g, ' ')}.`,
      expectedBenefit:    'Improves gate calibration and ensures advancement criteria are fair and achievable.',
      possibleRisk:       'Changing gate criteria may allow players to advance before they are truly ready.',
      alternativeOptions: ['Adjust gate criterion wording', 'Add a pre-gate checkpoint assessment'],
      missingData:        gate.evidenceStrength === 'insufficient' ? ['Player gate outcome history'] : [],
    })
  }

  return recs
}

// ── Deduplication ─────────────────────────────────────────────────────────────

function deduplicateRecs(recs: EvolutionRecommendation[]): EvolutionRecommendation[] {
  const seen = new Set<string>()
  return recs.filter(r => {
    const key = `${r.affectedLevels.sort().join(',')}_${r.recommendationType}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Main export ───────────────────────────────────────────────────────────────

export function runCurriculumEvolution(ctx: CurriculumIntelligenceContext): CurriculumEvolutionReport {
  _idCounter = 0

  const bottleneckReport    = detectBottlenecks({ levels: ctx.levels, gates: ctx.gates, playerByLevel: ctx.playerByLevel, items: ctx.curriculumItems })
  const progressionInsights = analyzeProgression({ levels: ctx.levels, gates: ctx.gates, playerByLevel: ctx.playerByLevel, items: ctx.curriculumItems })
  const effectivenessReport = rateDrillEffectiveness({ levels: ctx.levels, playerByLevel: ctx.playerByLevel, items: ctx.curriculumItems, gapReport: ctx.gapReport })
  const gateReport          = evaluateGateHealth({ gates: ctx.gates, levels: ctx.levels, playerByLevel: ctx.playerByLevel, items: ctx.curriculumItems })
  const overrideReport      = detectRealityOverrides({ dna: ctx.academyDna, levels: ctx.levels, gates: ctx.gates, playerByLevel: ctx.playerByLevel, items: ctx.curriculumItems, gapReport: ctx.gapReport, gateReport })
  const healthReport        = evaluateCurriculumHealth({ levels: ctx.levels, playerByLevel: ctx.playerByLevel, gapReport: ctx.gapReport, bottleneckReport, gateReport, effectivenessReport, overrideReport })

  const raw: EvolutionRecommendation[] = [
    ...fromBottlenecks(bottleneckReport, ctx),
    ...fromGapReport(ctx.gapReport, ctx),
    ...fromRealityOverrides(overrideReport),
    ...fromGateHealth(gateReport),
  ]

  const deduped = deduplicateRecs(raw)
  deduped.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return b.confidence - a.confidence
  })

  const totalPlayerCount = ctx.playerByLevel.reduce((s, p) => s + p.playerCount, 0)

  return {
    recommendations:     deduped,
    topRecommendations:  deduped.filter(r => r.priority === 1),
    bottleneckReport,
    progressionInsights,
    effectivenessReport,
    gateReport,
    healthReport,
    overrideReport,
    totalPlayerCount,
    dataConfidence:      healthReport.confidence,
    computedAt:          new Date().toISOString(),
  }
}
