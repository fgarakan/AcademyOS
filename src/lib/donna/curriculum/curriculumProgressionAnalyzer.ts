// DONNA Curriculum Evolution Engine V1 — Mega Sprint 1866–1895
// Progression Analyzer: identifies where players get stuck, where they accelerate,
// which gates work, and which skills predict success or stagnation.
//
// Pure TypeScript — no DB calls. Operates on CurriculumIntelligenceContext data.

import type {
  CurriculumLevelSummary,
  CurriculumGateSummary,
  PlayerLevelSummary,
  CurriculumItemSummary,
} from './curriculumIntelligenceContext'
import {
  computeEvidenceStrength,
  arePlayerOutcomesExcellent,
  type EvidenceStrength,
} from './curriculumEvidenceStrength'

// ── Output types ──────────────────────────────────────────────────────────────

export interface StuckPoint {
  levelId:         string
  levelName:       string
  playerCount:     number
  advancementRate: number
  evidenceStrength: EvidenceStrength
  reason:          string
  suppressedByOutcomes: boolean
}

export interface Accelerator {
  levelId:         string
  levelName:       string
  playerCount:     number
  advancementRate: number
  evidenceStrength: EvidenceStrength
  reason:          string
}

export interface GateInsight {
  gateId:          string
  domain:          string
  criterion:       string
  fromLevelId:     string
  fromLevelName:   string
  hasSupport:      boolean
  playerImpact:    number
  status:          'supported' | 'unsupported' | 'unknown'
  note:            string
}

export interface PredictiveSkill {
  domain:          string
  predicts:        'success' | 'stagnation'
  levelId:         string
  levelName:       string
  confidence:      number
  evidence:        string
}

export interface ProgressionInsights {
  stuckPoints:         StuckPoint[]
  accelerators:        Accelerator[]
  gateEffectiveness:   GateInsight[]
  predictiveSkills:    PredictiveSkill[]
  totalLevelsAnalyzed: number
  computedAt:          string
}

// ── Analysis helpers ──────────────────────────────────────────────────────────

function buildLevelNameMap(levels: CurriculumLevelSummary[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const l of levels) map[l.id] = l.displayName
  return map
}

function buildItemDomains(items: CurriculumItemSummary[]): Record<string, Set<string>> {
  const map: Record<string, Set<string>> = {}
  for (const item of items) {
    if (!map[item.levelId]) map[item.levelId] = new Set()
    if (item.domain) map[item.levelId].add(item.domain.toLowerCase())
    // Also extract domains from title keywords
    const titleWords = item.title.toLowerCase().split(/\s+/)
    for (const word of titleWords) {
      if (word.length > 4) map[item.levelId].add(word)
    }
  }
  return map
}

// ── Stuck points ──────────────────────────────────────────────────────────────

function findStuckPoints(
  levels: CurriculumLevelSummary[],
  playerByLevel: PlayerLevelSummary[],
): StuckPoint[] {
  const result: StuckPoint[] = []
  const playerMap: Record<string, PlayerLevelSummary> = {}
  for (const p of playerByLevel) playerMap[p.levelId] = p

  for (const level of levels) {
    const ps = playerMap[level.id]
    if (!ps || ps.playerCount < 2) continue

    const rate = ps.playerCount > 0
      ? ps.advancementEligibleCount / ps.playerCount
      : 0

    if (rate >= 0.3) continue  // Not stuck

    const strength = computeEvidenceStrength({
      playerCount:           ps.playerCount,
      advancementEligible:   ps.advancementEligibleCount,
      hasEvidence:           ps.hasEvidence,
      evidenceSource:        ps.evidenceSource,
      improvementSignalCount: ps.improvementSuggestions.length,
    })

    const excellent = arePlayerOutcomesExcellent({
      playerCount:          ps.playerCount,
      advancementEligible:  ps.advancementEligibleCount,
      hasEvidence:          ps.hasEvidence,
      evidenceSource:       ps.evidenceSource,
      weakDomainCount:      ps.weakDomains.length,
    })

    const reasons: string[] = []
    if (level.isSparse)      reasons.push('sparse curriculum')
    if (ps.weakDomains.length > 0) reasons.push(`weak domains: ${ps.weakDomains.join(', ')}`)
    if (ps.improvementSuggestions.length > 0) reasons.push('improvement signals from evidence')
    if (excellent)           reasons.push('despite outcomes being good — monitor only')

    result.push({
      levelId:              level.id,
      levelName:            level.displayName,
      playerCount:          ps.playerCount,
      advancementRate:      Math.round(rate * 100),
      evidenceStrength:     strength,
      reason:               reasons.join('; ') || 'low advancement rate',
      suppressedByOutcomes: excellent,
    })
  }

  return result
}

// ── Accelerators ──────────────────────────────────────────────────────────────

function findAccelerators(
  levels: CurriculumLevelSummary[],
  playerByLevel: PlayerLevelSummary[],
): Accelerator[] {
  const result: Accelerator[] = []
  const playerMap: Record<string, PlayerLevelSummary> = {}
  for (const p of playerByLevel) playerMap[p.levelId] = p

  for (const level of levels) {
    const ps = playerMap[level.id]
    if (!ps || ps.playerCount < 2) continue

    const rate = ps.advancementEligibleCount / ps.playerCount
    if (rate < 0.5) continue  // 50%+ eligible = accelerated level

    const strength = computeEvidenceStrength({
      playerCount:           ps.playerCount,
      advancementEligible:   ps.advancementEligibleCount,
      hasEvidence:           ps.hasEvidence,
      evidenceSource:        ps.evidenceSource,
      improvementSignalCount: ps.improvementSuggestions.length,
    })

    const reasons: string[] = []
    if (!level.isSparse)     reasons.push('well-stocked curriculum')
    if (ps.weakDomains.length === 0) reasons.push('no weak domains flagged')
    if (ps.hasEvidence)      reasons.push('evidence-backed advancement signals')

    result.push({
      levelId:          level.id,
      levelName:        level.displayName,
      playerCount:      ps.playerCount,
      advancementRate:  Math.round(rate * 100),
      evidenceStrength: strength,
      reason:           reasons.join('; ') || 'high advancement rate',
    })
  }

  return result
}

// ── Gate effectiveness ────────────────────────────────────────────────────────

function analyzeGateEffectiveness(
  gates: CurriculumGateSummary[],
  playerByLevel: PlayerLevelSummary[],
  items: CurriculumItemSummary[],
  levelNameMap: Record<string, string>,
): GateInsight[] {
  const result: GateInsight[] = []
  const playerMap: Record<string, PlayerLevelSummary> = {}
  for (const p of playerByLevel) playerMap[p.levelId] = p

  const itemsByLevel: Record<string, CurriculumItemSummary[]> = {}
  for (const item of items) {
    if (!itemsByLevel[item.levelId]) itemsByLevel[item.levelId] = []
    itemsByLevel[item.levelId].push(item)
  }

  for (const gate of gates) {
    const ps = playerMap[gate.fromLevelId]
    const levelItems = itemsByLevel[gate.fromLevelId] ?? []
    const domain = gate.domain.toLowerCase()

    const hasSupport = levelItems.some(item =>
      item.title.toLowerCase().includes(domain) ||
      (item.domain ?? '').toLowerCase().includes(domain),
    )

    const playerImpact = ps?.playerCount ?? 0
    let status: GateInsight['status'] = 'unknown'
    let note = ''

    if (!ps || ps.playerCount === 0) {
      status = 'unknown'
      note = 'No players at this level — gate impact cannot be assessed'
    } else if (hasSupport) {
      status = 'supported'
      note = `Gate domain "${gate.domain}" is covered by curriculum content at ${levelNameMap[gate.fromLevelId] ?? gate.fromLevelId}`
    } else {
      status = 'unsupported'
      note = `Gate domain "${gate.domain}" has no supporting content — players must meet this criterion without curriculum preparation`
    }

    result.push({
      gateId:        gate.id,
      domain:        gate.domain,
      criterion:     gate.criterion,
      fromLevelId:   gate.fromLevelId,
      fromLevelName: levelNameMap[gate.fromLevelId] ?? gate.fromLevelId,
      hasSupport,
      playerImpact,
      status,
      note,
    })
  }

  return result
}

// ── Predictive skills ─────────────────────────────────────────────────────────

function findPredictiveSkills(
  playerByLevel: PlayerLevelSummary[],
  levelNameMap: Record<string, string>,
): PredictiveSkill[] {
  const result: PredictiveSkill[] = []

  for (const ps of playerByLevel) {
    if (ps.playerCount === 0) continue

    const advancementRate = ps.advancementEligibleCount / ps.playerCount

    // Weak domains at levels with low advancement = stagnation predictors
    for (const domain of ps.weakDomains) {
      result.push({
        domain,
        predicts:   'stagnation',
        levelId:    ps.levelId,
        levelName:  levelNameMap[ps.levelId] ?? ps.levelId,
        confidence: ps.hasEvidence && ps.evidenceSource === 'evidence_records' ? 70 : 40,
        evidence:   `Weak "${domain}" domain at ${levelNameMap[ps.levelId] ?? ps.levelId} with ${Math.round(advancementRate * 100)}% advancement rate`,
      })
    }

    // Levels with high advancement rate + evidence = success pathway signals
    if (advancementRate >= 0.6 && ps.hasEvidence && ps.improvementSuggestions.length === 0) {
      result.push({
        domain:     'all domains',
        predicts:   'success',
        levelId:    ps.levelId,
        levelName:  levelNameMap[ps.levelId] ?? ps.levelId,
        confidence: 65,
        evidence:   `${Math.round(advancementRate * 100)}% advancement rate with no weak domains at ${levelNameMap[ps.levelId] ?? ps.levelId}`,
      })
    }
  }

  return result
}

// ── Main export ───────────────────────────────────────────────────────────────

export function analyzeProgression(params: {
  levels:        CurriculumLevelSummary[]
  gates:         CurriculumGateSummary[]
  playerByLevel: PlayerLevelSummary[]
  items:         CurriculumItemSummary[]
}): ProgressionInsights {
  const { levels, gates, playerByLevel, items } = params
  const levelNameMap = buildLevelNameMap(levels)

  return {
    stuckPoints:         findStuckPoints(levels, playerByLevel),
    accelerators:        findAccelerators(levels, playerByLevel),
    gateEffectiveness:   analyzeGateEffectiveness(gates, playerByLevel, items, levelNameMap),
    predictiveSkills:    findPredictiveSkills(playerByLevel, levelNameMap),
    totalLevelsAnalyzed: levels.length,
    computedAt:          new Date().toISOString(),
  }
}
