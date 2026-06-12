// DONNA Curriculum Evolution Engine V1 — Mega Sprint 1866–1895
// Gate Effectiveness Engine: evaluates whether each curriculum gate is
// appropriately calibrated and supported.
//
// Pure TypeScript — no DB calls.
//
// Gate health statuses:
//   healthy      — gate has supporting content AND players are advancing through it
//   too_hard     — gate has content support but advancement rate is very low
//   bottleneck   — many players stuck just before this gate
//   unsupported  — no content at the required level addresses this gate's domain
//   bypassed     — gate level has players but advancement is suspiciously fast (may be skipped)
//   unknown      — no player data available

import type {
  CurriculumGateSummary,
  CurriculumLevelSummary,
  PlayerLevelSummary,
  CurriculumItemSummary,
} from './curriculumIntelligenceContext'
import {
  computeEvidenceStrength,
  arePlayerOutcomesExcellent,
  type EvidenceStrength,
} from './curriculumEvidenceStrength'

// ── Types ─────────────────────────────────────────────────────────────────────

export type GateHealthStatus =
  | 'healthy'
  | 'too_hard'
  | 'bottleneck'
  | 'unsupported'
  | 'bypassed'
  | 'unknown'

export interface GateHealthRecord {
  gateId:           string
  domain:           string
  criterion:        string
  fromLevelId:      string
  fromLevelName:    string
  toLevelId:        string
  toLevelName:      string
  healthStatus:     GateHealthStatus
  evidenceStrength: EvidenceStrength
  confidence:       number
  evidence:         string[]
  recommendation:   string | null
  suppressedByOutcomes: boolean
}

export interface GateHealthReport {
  gates:          GateHealthRecord[]
  healthy:        GateHealthRecord[]
  bottlenecks:    GateHealthRecord[]
  unsupported:    GateHealthRecord[]
  unknown:        GateHealthRecord[]
  computedAt:     string
}

// ── Analysis ──────────────────────────────────────────────────────────────────

function buildLevelNameMap(levels: CurriculumLevelSummary[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const l of levels) map[l.id] = l.displayName
  return map
}

function buildItemsByLevel(items: CurriculumItemSummary[]): Record<string, CurriculumItemSummary[]> {
  const map: Record<string, CurriculumItemSummary[]> = {}
  for (const item of items) {
    if (!map[item.levelId]) map[item.levelId] = []
    map[item.levelId].push(item)
  }
  return map
}

function hasContentForDomain(items: CurriculumItemSummary[], domain: string): boolean {
  const d = domain.toLowerCase()
  return items.some(item =>
    item.title.toLowerCase().includes(d) ||
    (item.domain ?? '').toLowerCase().includes(d),
  )
}

function analyzeGate(
  gate: CurriculumGateSummary,
  ps: PlayerLevelSummary | undefined,
  levelItems: CurriculumItemSummary[],
  levelNameMap: Record<string, string>,
): GateHealthRecord {
  const fromLevelName = levelNameMap[gate.fromLevelId] ?? gate.fromLevelId
  const toLevelName   = levelNameMap[gate.toLevelId]   ?? gate.toLevelId
  const hasSupport    = hasContentForDomain(levelItems, gate.domain)
  const evidence: string[] = []

  // No player data
  if (!ps || ps.playerCount === 0) {
    evidence.push('No players at this level — gate health cannot be assessed')
    return {
      gateId:               gate.id,
      domain:               gate.domain,
      criterion:            gate.criterion,
      fromLevelId:          gate.fromLevelId,
      fromLevelName,
      toLevelId:            gate.toLevelId,
      toLevelName,
      healthStatus:         'unknown',
      evidenceStrength:     'insufficient',
      confidence:           0,
      evidence,
      recommendation:       null,
      suppressedByOutcomes: false,
    }
  }

  const evidenceStrength = computeEvidenceStrength({
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

  const advancementRate = ps.advancementEligibleCount / ps.playerCount

  evidence.push(`${ps.playerCount} players at ${fromLevelName}`)
  evidence.push(`${ps.advancementEligibleCount} (${Math.round(advancementRate * 100)}%) eligible to advance`)
  evidence.push(hasSupport ? `Gate domain "${gate.domain}" is supported by curriculum content` : `Gate domain "${gate.domain}" has NO supporting content`)

  let healthStatus: GateHealthStatus
  let confidence: number
  let recommendation: string | null = null

  if (!hasSupport) {
    healthStatus = 'unsupported'
    confidence   = excellent ? 40 : 75
    recommendation = excellent
      ? `Gate "${gate.criterion}" lacks direct support content, but players are advancing well. Monitor.`
      : `Add at least one drill or assessment for "${gate.domain}" domain before this gate.`
    if (excellent) evidence.push('Player outcomes are strong despite missing content')
  } else if (excellent) {
    healthStatus = 'healthy'
    confidence   = 80
    recommendation = null
    evidence.push('Players are advancing well through this gate')
  } else if (advancementRate >= 0.35) {
    healthStatus = 'healthy'
    confidence   = 65
    recommendation = null
  } else if (advancementRate < 0.1 && ps.playerCount >= 3) {
    healthStatus = 'bottleneck'
    confidence   = 75
    recommendation = `Gate "${gate.criterion}" may be creating a bottleneck — consider adding a transition progression or clarifying the criterion.`
    evidence.push(`Very low advancement rate suggests the gate threshold may be too aggressive`)
  } else if (advancementRate < 0.2) {
    healthStatus = 'too_hard'
    confidence   = 60
    recommendation = `Gate "${gate.criterion}" has a low passage rate. Review whether the criterion aligns with current curriculum content.`
  } else if (advancementRate >= 0.9 && ps.playerCount >= 5) {
    // Suspiciously high — might be too easy or being bypassed
    healthStatus = 'bypassed'
    confidence   = 40
    recommendation = `Almost all players pass this gate immediately. Verify the gate is being meaningfully assessed.`
    evidence.push('Near-100% passage rate — gate may not be functioning as intended')
  } else {
    healthStatus = 'healthy'
    confidence   = 55
  }

  return {
    gateId:               gate.id,
    domain:               gate.domain,
    criterion:            gate.criterion,
    fromLevelId:          gate.fromLevelId,
    fromLevelName,
    toLevelId:            gate.toLevelId,
    toLevelName,
    healthStatus,
    evidenceStrength,
    confidence,
    evidence,
    recommendation,
    suppressedByOutcomes: excellent && healthStatus !== 'healthy',
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function evaluateGateHealth(params: {
  gates:         CurriculumGateSummary[]
  levels:        CurriculumLevelSummary[]
  playerByLevel: PlayerLevelSummary[]
  items:         CurriculumItemSummary[]
}): GateHealthReport {
  const { gates, levels, playerByLevel, items } = params

  const levelNameMap = buildLevelNameMap(levels)
  const itemsByLevel = buildItemsByLevel(items)

  const playerMap: Record<string, PlayerLevelSummary> = {}
  for (const p of playerByLevel) playerMap[p.levelId] = p

  const gateRecords = gates.map(gate =>
    analyzeGate(
      gate,
      playerMap[gate.fromLevelId],
      itemsByLevel[gate.fromLevelId] ?? [],
      levelNameMap,
    ),
  )

  return {
    gates:       gateRecords,
    healthy:     gateRecords.filter(g => g.healthStatus === 'healthy'),
    bottlenecks: gateRecords.filter(g => g.healthStatus === 'bottleneck'),
    unsupported: gateRecords.filter(g => g.healthStatus === 'unsupported'),
    unknown:     gateRecords.filter(g => g.healthStatus === 'unknown'),
    computedAt:  new Date().toISOString(),
  }
}
