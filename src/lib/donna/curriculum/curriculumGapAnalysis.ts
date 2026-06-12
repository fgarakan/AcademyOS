// DONNA Curriculum Intelligence Engine V1 — Mega Sprint 1836–1865
// Gap Analysis Engine: identifies structural gaps and imbalances in academy curriculum.
//
// Pure TypeScript — no DB calls, no mutations.
// Input: levels, gates, and academy-owned items already loaded in context.
//
// Produces CurriculumGapReport with:
//   missingAreas          — levels with no content at all
//   overrepresentedTypes  — content types with disproportionate coverage at a level
//   underrepresentedTypes — content types with zero coverage at a level that should have them
//   progressionGaps       — levels that have drills but no progressions
//   gateSupportGaps       — gates whose domain has no drill or assessment at that level
//   drillHeavyLevels      — levels where >60% of items are drills (no game balance)
//   gameHeavyLevels       — levels where >60% of items are games (no technical foundation)

import type { CurriculumLevelSummary, CurriculumGateSummary, CurriculumItemSummary } from './curriculumIntelligenceContext'

// ── Gap report types ──────────────────────────────────────────────────────────

export interface MissingAreaGap {
  levelId:   string
  levelName: string
  stage:     string
  reason:    string
}

export interface ContentTypeImbalance {
  levelId:    string
  levelName:  string
  contentType: string
  count:      number
  totalItems: number
  pct:        number
  note:       string
}

export interface ProgressionGap {
  levelId:   string
  levelName: string
  drillCount: number
  note:      string
}

export interface GateSupportGap {
  gateId:    string
  levelId:   string
  levelName: string
  domain:    string
  criterion: string
  note:      string
}

export interface CurriculumGapReport {
  missingAreas:          MissingAreaGap[]
  overrepresentedTypes:  ContentTypeImbalance[]
  underrepresentedTypes: ContentTypeImbalance[]
  progressionGaps:       ProgressionGap[]
  gateSupportGaps:       GateSupportGap[]
  drillHeavyLevels:      ContentTypeImbalance[]
  gameHeavyLevels:       ContentTypeImbalance[]
  /** Total number of issues found across all categories */
  totalGapCount: number
  /** Levels with the most critical gaps (top 3) */
  priorityLevels: string[]
  computedAt: string
}

// ── Content type groups ───────────────────────────────────────────────────────

const TECHNICAL_TYPES = new Set(['drill', 'skill', 'fitness', 'warmup', 'cooldown'])
const GAME_TYPES      = new Set(['game', 'tactical', 'tactical_game', 'situational', 'match_play_theme', 'competition'])
const ASSESSMENT_TYPES = new Set(['assessment', 'gate_evaluation'])
const PROGRESSION_TYPES = new Set(['progression', 'regression'])

// Content types that every non-empty level should have at least one of
const EXPECTED_TYPES_PER_LEVEL = ['drill', 'game', 'assessment']

// ── Helpers ───────────────────────────────────────────────────────────────────

function countByType(items: CurriculumItemSummary[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const item of items) {
    map[item.contentType] = (map[item.contentType] ?? 0) + 1
  }
  return map
}

function groupByLevel(items: CurriculumItemSummary[]): Record<string, CurriculumItemSummary[]> {
  const map: Record<string, CurriculumItemSummary[]> = {}
  for (const item of items) {
    if (!map[item.levelId]) map[item.levelId] = []
    map[item.levelId].push(item)
  }
  return map
}

// ── Analysis functions ────────────────────────────────────────────────────────

function findMissingAreas(
  levels: CurriculumLevelSummary[],
): MissingAreaGap[] {
  return levels
    .filter(l => l.isEmpty)
    .map(l => ({
      levelId:   l.id,
      levelName: l.displayName,
      stage:     l.stage,
      reason:    `${l.displayName} has no academy-owned curriculum content.`,
    }))
}

function findOverrepresentedTypes(
  levels: CurriculumLevelSummary[],
  itemsByLevel: Record<string, CurriculumItemSummary[]>,
): ContentTypeImbalance[] {
  const result: ContentTypeImbalance[] = []

  for (const level of levels) {
    const items = itemsByLevel[level.id] ?? []
    if (items.length < 3) continue

    const byType = countByType(items)
    const total = items.length

    for (const [contentType, count] of Object.entries(byType)) {
      const pct = Math.round((count / total) * 100)
      if (pct >= 70 && total >= 4) {
        result.push({
          levelId:     level.id,
          levelName:   level.displayName,
          contentType,
          count,
          totalItems:  total,
          pct,
          note: `${pct}% of ${level.displayName} content is "${contentType}" — other types are missing.`,
        })
      }
    }
  }

  return result
}

function findUnderrepresentedTypes(
  levels: CurriculumLevelSummary[],
  itemsByLevel: Record<string, CurriculumItemSummary[]>,
): ContentTypeImbalance[] {
  const result: ContentTypeImbalance[] = []

  for (const level of levels) {
    if (level.isEmpty) continue
    const items = itemsByLevel[level.id] ?? []
    if (items.length === 0) continue

    const byType = countByType(items)

    for (const expected of EXPECTED_TYPES_PER_LEVEL) {
      if ((byType[expected] ?? 0) === 0) {
        result.push({
          levelId:     level.id,
          levelName:   level.displayName,
          contentType: expected,
          count:       0,
          totalItems:  items.length,
          pct:         0,
          note: `${level.displayName} has no "${expected}" content — consider adding at least one.`,
        })
      }
    }
  }

  return result
}

function findProgressionGaps(
  levels: CurriculumLevelSummary[],
  itemsByLevel: Record<string, CurriculumItemSummary[]>,
): ProgressionGap[] {
  const result: ProgressionGap[] = []

  for (const level of levels) {
    const items = itemsByLevel[level.id] ?? []
    if (items.length === 0) continue

    const drillCount = items.filter(i => TECHNICAL_TYPES.has(i.contentType)).length
    const progressionCount = items.filter(i => PROGRESSION_TYPES.has(i.contentType)).length

    if (drillCount >= 3 && progressionCount === 0) {
      result.push({
        levelId:    level.id,
        levelName:  level.displayName,
        drillCount,
        note: `${level.displayName} has ${drillCount} technical drills but no progressions — coaches cannot differentiate challenge.`,
      })
    }
  }

  return result
}

function findGateSupportGaps(
  gates: CurriculumGateSummary[],
  itemsByLevel: Record<string, CurriculumItemSummary[]>,
  levelNameMap: Record<string, string>,
): GateSupportGap[] {
  const result: GateSupportGap[] = []

  for (const gate of gates) {
    // Check the level the gate exits FROM (where the player must demonstrate the skill)
    const levelId = gate.fromLevelId
    const items = itemsByLevel[levelId] ?? []
    if (items.length === 0) continue

    const domain = gate.domain.toLowerCase()

    // Does any item at this level address this gate's domain?
    const hasSupportingContent = items.some(item => {
      const titleLower = item.title.toLowerCase()
      const domainLower = item.domain?.toLowerCase() ?? ''
      return (
        titleLower.includes(domain) ||
        domainLower.includes(domain) ||
        ASSESSMENT_TYPES.has(item.contentType) ||
        TECHNICAL_TYPES.has(item.contentType)
      )
    })

    if (!hasSupportingContent) {
      result.push({
        gateId:    gate.id,
        levelId,
        levelName: levelNameMap[levelId] ?? levelId,
        domain:    gate.domain,
        criterion: gate.criterion,
        note: `Gate "${gate.criterion}" at ${levelNameMap[levelId] ?? levelId} has no supporting drill or assessment for domain "${gate.domain}".`,
      })
    }
  }

  return result
}

function findDrillHeavyLevels(
  levels: CurriculumLevelSummary[],
  itemsByLevel: Record<string, CurriculumItemSummary[]>,
): ContentTypeImbalance[] {
  const result: ContentTypeImbalance[] = []

  for (const level of levels) {
    const items = itemsByLevel[level.id] ?? []
    if (items.length < 4) continue

    const drillCount = items.filter(i => TECHNICAL_TYPES.has(i.contentType)).length
    const gameCount  = items.filter(i => GAME_TYPES.has(i.contentType)).length
    const total = items.length
    const drillPct = Math.round((drillCount / total) * 100)

    const gamePct = Math.round((gameCount / total) * 100)
    if (drillPct >= 60 && gamePct < 20) {
      result.push({
        levelId:     level.id,
        levelName:   level.displayName,
        contentType: 'drill',
        count:       drillCount,
        totalItems:  total,
        pct:         drillPct,
        note: `${level.displayName} is drill-heavy (${drillPct}% drills, ${gamePct}% game-based) — coaches have limited game-transfer options.`,
      })
    }
  }

  return result
}

function findGameHeavyLevels(
  levels: CurriculumLevelSummary[],
  itemsByLevel: Record<string, CurriculumItemSummary[]>,
): ContentTypeImbalance[] {
  const result: ContentTypeImbalance[] = []

  for (const level of levels) {
    const items = itemsByLevel[level.id] ?? []
    if (items.length < 4) continue

    const drillCount = items.filter(i => TECHNICAL_TYPES.has(i.contentType)).length
    const gameCount  = items.filter(i => GAME_TYPES.has(i.contentType)).length
    const total = items.length
    const gamePct = Math.round((gameCount / total) * 100)

    if (gamePct >= 60 && drillCount === 0) {
      result.push({
        levelId:     level.id,
        levelName:   level.displayName,
        contentType: 'game',
        count:       gameCount,
        totalItems:  total,
        pct:         gamePct,
        note: `${level.displayName} is game-heavy (${gamePct}%) with no technical drills — lacks technical foundation for development.`,
      })
    }
  }

  return result
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildCurriculumGapReport(
  levels: CurriculumLevelSummary[],
  gates: CurriculumGateSummary[],
  items: CurriculumItemSummary[],
): CurriculumGapReport {
  const itemsByLevel = groupByLevel(items)
  const levelNameMap: Record<string, string> = {}
  for (const l of levels) levelNameMap[l.id] = l.displayName

  const missingAreas          = findMissingAreas(levels)
  const overrepresentedTypes  = findOverrepresentedTypes(levels, itemsByLevel)
  const underrepresentedTypes = findUnderrepresentedTypes(levels, itemsByLevel)
  const progressionGaps       = findProgressionGaps(levels, itemsByLevel)
  const gateSupportGaps       = findGateSupportGaps(gates, itemsByLevel, levelNameMap)
  const drillHeavyLevels      = findDrillHeavyLevels(levels, itemsByLevel)
  const gameHeavyLevels       = findGameHeavyLevels(levels, itemsByLevel)

  const totalGapCount =
    missingAreas.length +
    overrepresentedTypes.length +
    underrepresentedTypes.length +
    progressionGaps.length +
    gateSupportGaps.length +
    drillHeavyLevels.length +
    gameHeavyLevels.length

  // Rank levels by gap count (most issues first)
  const gapCountByLevel: Record<string, number> = {}
  const bump = (id: string) => { gapCountByLevel[id] = (gapCountByLevel[id] ?? 0) + 1 }
  missingAreas.forEach(g => bump(g.levelId))
  overrepresentedTypes.forEach(g => bump(g.levelId))
  underrepresentedTypes.forEach(g => bump(g.levelId))
  progressionGaps.forEach(g => bump(g.levelId))
  gateSupportGaps.forEach(g => bump(g.levelId))
  drillHeavyLevels.forEach(g => bump(g.levelId))
  gameHeavyLevels.forEach(g => bump(g.levelId))

  const priorityLevels = Object.entries(gapCountByLevel)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([levelId]) => levelNameMap[levelId] ?? levelId)

  return {
    missingAreas,
    overrepresentedTypes,
    underrepresentedTypes,
    progressionGaps,
    gateSupportGaps,
    drillHeavyLevels,
    gameHeavyLevels,
    totalGapCount,
    priorityLevels,
    computedAt: new Date().toISOString(),
  }
}
