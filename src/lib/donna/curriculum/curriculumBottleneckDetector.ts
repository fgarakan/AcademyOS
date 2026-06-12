// DONNA Curriculum Evolution Engine V1 — Mega Sprint 1866–1895
// Bottleneck Detector: identifies where the curriculum is creating friction
// for player progression.
//
// Pure TypeScript — no DB calls. Operates on CurriculumIntelligenceContext data.
//
// Five bottleneck types:
//   level_stuck       — many players, few advancing, sparse curriculum
//   gate_stuck        — gate has no supporting content at its required level
//   no_progression    — drills exist but no progressions to differentiate challenge
//   concept_skip      — gate requires domain with no upstream content
//   underused_level   — level has rich curriculum but zero or few players

import type {
  CurriculumLevelSummary,
  CurriculumGateSummary,
  PlayerLevelSummary,
  CurriculumItemSummary,
} from './curriculumIntelligenceContext'
import { computeEvidenceStrength, arePlayerOutcomesExcellent, type EvidenceStrength } from './curriculumEvidenceStrength'

// ── Types ─────────────────────────────────────────────────────────────────────

export type BottleneckType =
  | 'level_stuck'
  | 'gate_stuck'
  | 'no_progression'
  | 'concept_skip'
  | 'underused_level'

export type BottleneckSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface CurriculumBottleneck {
  id:              string
  type:            BottleneckType
  title:           string
  severity:        BottleneckSeverity
  evidenceStrength: EvidenceStrength
  confidence:      number  // 0–100
  evidence:        string[]
  affectedCount:   number
  levelId:         string | null
  gateId:          string | null
  contentItemId:   string | null
  /** True when excellent player outcomes suppress this bottleneck to monitoring-only */
  suppressedByOutcomes: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeId(type: BottleneckType, suffix: string): string {
  return `bn_${type}_${suffix}`
}

function gateItemsByLevel(items: CurriculumItemSummary[]): Record<string, CurriculumItemSummary[]> {
  const map: Record<string, CurriculumItemSummary[]> = {}
  for (const item of items) {
    if (!map[item.levelId]) map[item.levelId] = []
    map[item.levelId].push(item)
  }
  return map
}

const DRILL_TYPES = new Set(['drill', 'skill', 'fitness', 'warmup'])
const PROGRESSION_TYPES = new Set(['progression', 'regression'])

// ── Detectors ─────────────────────────────────────────────────────────────────

function detectLevelStuck(
  levels: CurriculumLevelSummary[],
  playerByLevel: PlayerLevelSummary[],
): CurriculumBottleneck[] {
  const result: CurriculumBottleneck[] = []
  const playerMap: Record<string, PlayerLevelSummary> = {}
  for (const p of playerByLevel) playerMap[p.levelId] = p

  for (const level of levels) {
    const ps = playerMap[level.id]
    if (!ps || ps.playerCount === 0) continue

    const stuckRatio = ps.advancementEligibleCount / ps.playerCount
    if (stuckRatio >= 0.3) continue  // 30%+ eligible = not stuck

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

    const confidence = excellent ? 20 :
      ps.playerCount >= 10 ? 80 :
      ps.playerCount >= 5  ? 65 : 45

    const severity: BottleneckSeverity =
      excellent            ? 'low' :
      ps.playerCount >= 10 ? 'critical' :
      ps.playerCount >= 5  ? 'high' : 'medium'

    const evidence: string[] = [
      `${ps.playerCount} players at ${level.displayName}`,
      `Only ${ps.advancementEligibleCount} (${Math.round(stuckRatio * 100)}%) eligible to advance`,
    ]
    if (level.isSparse) evidence.push(`Level curriculum is sparse (< 3 items)`)
    if (ps.weakDomains.length > 0) evidence.push(`Weak domains flagged: ${ps.weakDomains.join(', ')}`)
    if (excellent) evidence.push(`Player outcomes are strong — bottleneck may be structural theory, not real`)

    result.push({
      id:                   makeId('level_stuck', level.id),
      type:                 'level_stuck',
      title:                `Players stuck at ${level.displayName}`,
      severity,
      evidenceStrength,
      confidence,
      evidence,
      affectedCount:        ps.playerCount,
      levelId:              level.id,
      gateId:               null,
      contentItemId:        null,
      suppressedByOutcomes: excellent,
    })
  }

  return result
}

function detectGateStuck(
  gates: CurriculumGateSummary[],
  playerByLevel: PlayerLevelSummary[],
  itemsByLevel: Record<string, CurriculumItemSummary[]>,
): CurriculumBottleneck[] {
  const result: CurriculumBottleneck[] = []
  const playerMap: Record<string, PlayerLevelSummary> = {}
  for (const p of playerByLevel) playerMap[p.levelId] = p

  for (const gate of gates) {
    const ps = playerMap[gate.fromLevelId]
    if (!ps || ps.playerCount === 0) continue

    const levelItems = itemsByLevel[gate.fromLevelId] ?? []
    const domain = gate.domain.toLowerCase()

    const hasGateSupport = levelItems.some(item =>
      item.title.toLowerCase().includes(domain) ||
      (item.domain ?? '').toLowerCase().includes(domain),
    )

    if (hasGateSupport) continue

    const stuckRatio = ps.advancementEligibleCount / ps.playerCount
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

    result.push({
      id:                   makeId('gate_stuck', gate.id),
      type:                 'gate_stuck',
      title:                `Gate "${gate.criterion}" has no supporting content`,
      severity:             excellent ? 'low' : stuckRatio < 0.15 ? 'high' : 'medium',
      evidenceStrength,
      confidence:           excellent ? 25 : 70,
      evidence: [
        `Gate domain: "${gate.domain}"`,
        `No drills or assessments at ${ps.levelName} address this domain`,
        `${ps.playerCount} players must pass this gate to advance`,
        ...(excellent ? [`Player outcomes at this level are strong`] : []),
      ],
      affectedCount:        ps.playerCount,
      levelId:              gate.fromLevelId,
      gateId:               gate.id,
      contentItemId:        null,
      suppressedByOutcomes: excellent,
    })
  }

  return result
}

function detectNoProgression(
  levels: CurriculumLevelSummary[],
  playerByLevel: PlayerLevelSummary[],
  itemsByLevel: Record<string, CurriculumItemSummary[]>,
): CurriculumBottleneck[] {
  const result: CurriculumBottleneck[] = []
  const playerMap: Record<string, PlayerLevelSummary> = {}
  for (const p of playerByLevel) playerMap[p.levelId] = p

  for (const level of levels) {
    const items = itemsByLevel[level.id] ?? []
    if (items.length === 0) continue

    const drillCount = items.filter(i => DRILL_TYPES.has(i.contentType)).length
    const progressionCount = items.filter(i => PROGRESSION_TYPES.has(i.contentType)).length

    if (drillCount < 3 || progressionCount > 0) continue

    const ps = playerMap[level.id]
    const playerCount = ps?.playerCount ?? 0

    const evidenceStrength = ps ? computeEvidenceStrength({
      playerCount,
      advancementEligible:   ps.advancementEligibleCount,
      hasEvidence:           ps.hasEvidence,
      evidenceSource:        ps.evidenceSource,
      improvementSignalCount: ps.improvementSuggestions.length,
    }) : 'insufficient'

    const excellent = ps ? arePlayerOutcomesExcellent({
      playerCount,
      advancementEligible:  ps.advancementEligibleCount,
      hasEvidence:          ps.hasEvidence,
      evidenceSource:       ps.evidenceSource,
      weakDomainCount:      ps.weakDomains.length,
    }) : false

    result.push({
      id:                   makeId('no_progression', level.id),
      type:                 'no_progression',
      title:                `${level.displayName} lacks progressions`,
      severity:             excellent ? 'low' : playerCount >= 5 ? 'medium' : 'low',
      evidenceStrength,
      confidence:           excellent ? 20 : 60,
      evidence: [
        `${drillCount} technical drills at ${level.displayName}`,
        `0 progressions or regressions — coaches cannot differentiate challenge`,
        ...(playerCount > 0 ? [`${playerCount} players at this level`] : []),
        ...(excellent ? [`Player advancement rate is healthy — structural gap may not be a real problem`] : []),
      ],
      affectedCount:        playerCount,
      levelId:              level.id,
      gateId:               null,
      contentItemId:        null,
      suppressedByOutcomes: excellent,
    })
  }

  return result
}

function detectConceptSkip(
  gates: CurriculumGateSummary[],
  levels: CurriculumLevelSummary[],
  itemsByLevel: Record<string, CurriculumItemSummary[]>,
): CurriculumBottleneck[] {
  const result: CurriculumBottleneck[] = []
  const levelMap: Record<string, CurriculumLevelSummary> = {}
  for (const l of levels) levelMap[l.id] = l

  for (const gate of gates) {
    const fromLevel = levelMap[gate.fromLevelId]
    if (!fromLevel) continue

    // Look for the level BEFORE fromLevel (by sortOrder)
    const prerequisiteLevel = levels
      .filter(l => l.sortOrder < fromLevel.sortOrder)
      .sort((a, b) => b.sortOrder - a.sortOrder)[0]

    if (!prerequisiteLevel) continue

    const prereqItems = itemsByLevel[prerequisiteLevel.id] ?? []
    const domain = gate.domain.toLowerCase()

    const hasPrereqContent = prereqItems.some(item =>
      item.title.toLowerCase().includes(domain) ||
      (item.domain ?? '').toLowerCase().includes(domain),
    )

    // Only flag if the concept appears at the gate level's requirement but NOT in the level before
    if (hasPrereqContent) continue

    const fromItems = itemsByLevel[gate.fromLevelId] ?? []
    const hasFromContent = fromItems.some(item =>
      item.title.toLowerCase().includes(domain) ||
      (item.domain ?? '').toLowerCase().includes(domain),
    )

    if (hasFromContent) continue  // Domain exists at gate level — concept not skipped

    result.push({
      id:                   makeId('concept_skip', gate.id),
      type:                 'concept_skip',
      title:                `"${gate.domain}" concept missing before gate`,
      severity:             'medium',
      evidenceStrength:     'low',
      confidence:           50,
      evidence: [
        `Gate "${gate.criterion}" requires "${gate.domain}"`,
        `No content for this domain found at ${fromLevel.displayName} or ${prerequisiteLevel.displayName}`,
        `Players may encounter this gate without prior exposure`,
      ],
      affectedCount:        0,
      levelId:              gate.fromLevelId,
      gateId:               gate.id,
      contentItemId:        null,
      suppressedByOutcomes: false,
    })
  }

  return result
}

function detectUnderusedLevels(
  levels: CurriculumLevelSummary[],
  playerByLevel: PlayerLevelSummary[],
): CurriculumBottleneck[] {
  const result: CurriculumBottleneck[] = []
  const playerMap: Record<string, PlayerLevelSummary> = {}
  for (const p of playerByLevel) playerMap[p.levelId] = p

  for (const level of levels) {
    if (level.isEmpty || level.itemCount < 5) continue

    const ps = playerMap[level.id]
    const playerCount = ps?.playerCount ?? 0
    if (playerCount > 0) continue  // Level is being used

    result.push({
      id:                   makeId('underused_level', level.id),
      type:                 'underused_level',
      title:                `${level.displayName} has rich content but no active players`,
      severity:             'low',
      evidenceStrength:     'insufficient',
      confidence:           40,
      evidence: [
        `${level.itemCount} curriculum items at ${level.displayName}`,
        `0 players currently assigned to this level`,
        `Content investment with no active use`,
      ],
      affectedCount:        0,
      levelId:              level.id,
      gateId:               null,
      contentItemId:        null,
      suppressedByOutcomes: false,
    })
  }

  return result
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface BottleneckReport {
  bottlenecks:    CurriculumBottleneck[]
  critical:       CurriculumBottleneck[]
  suppressed:     CurriculumBottleneck[]
  totalCount:     number
  affectedLevels: string[]
  computedAt:     string
}

export function detectBottlenecks(params: {
  levels:       CurriculumLevelSummary[]
  gates:        CurriculumGateSummary[]
  playerByLevel: PlayerLevelSummary[]
  items:        CurriculumItemSummary[]
}): BottleneckReport {
  const { levels, gates, playerByLevel, items } = params
  const itemsByLevel = gateItemsByLevel(items)

  const all: CurriculumBottleneck[] = [
    ...detectLevelStuck(levels, playerByLevel),
    ...detectGateStuck(gates, playerByLevel, itemsByLevel),
    ...detectNoProgression(levels, playerByLevel, itemsByLevel),
    ...detectConceptSkip(gates, levels, itemsByLevel),
    ...detectUnderusedLevels(levels, playerByLevel),
  ]

  all.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  const critical   = all.filter(b => b.severity === 'critical')
  const suppressed = all.filter(b => b.suppressedByOutcomes)
  const affectedLevels = Array.from(new Set(all.map(b => b.levelId).filter(Boolean) as string[]))

  return {
    bottlenecks: all,
    critical,
    suppressed,
    totalCount:  all.length,
    affectedLevels,
    computedAt:  new Date().toISOString(),
  }
}
