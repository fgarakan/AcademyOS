// DONNA Curriculum Evolution Engine V1 — Mega Sprint 1866–1895
// Drill Effectiveness Engine: rates curriculum items by whether they are
// likely contributing to player advancement.
//
// Pure TypeScript — no DB calls.
// Effectiveness is inferred from structural and player signals — not usage logs.
// V1 uses proxy signals; V2 can wire actual session usage data.
//
// Rating rules:
//   high    — item is in a level with strong advancement signals and no weak domains
//   medium  — item is in a level with moderate signals or mixed evidence
//   low     — item is in a drill-heavy level with no player progression, OR
//              it's in a level where this content type is overrepresented
//   unknown — level has no players or no evidence

import type {
  CurriculumLevelSummary,
  PlayerLevelSummary,
  CurriculumItemSummary,
} from './curriculumIntelligenceContext'
import type { CurriculumGapReport } from './curriculumGapAnalysis'
import {
  arePlayerOutcomesExcellent,
  type EvidenceStrength,
} from './curriculumEvidenceStrength'

// ── Types ─────────────────────────────────────────────────────────────────────

export type EffectivenessRating = 'high' | 'medium' | 'low' | 'unknown'

export interface DrillEffectivenessRecord {
  itemId:          string
  title:           string
  contentType:     string
  levelId:         string
  levelName:       string
  rating:          EffectivenessRating
  evidenceStrength: EvidenceStrength
  signals:         string[]
}

export interface DrillEffectivenessReport {
  items:           DrillEffectivenessRecord[]
  highCount:       number
  mediumCount:     number
  lowCount:        number
  unknownCount:    number
  computedAt:      string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DRILL_TYPES = new Set(['drill', 'skill', 'fitness', 'warmup', 'cooldown'])
const GAME_TYPES  = new Set(['game', 'tactical', 'tactical_game', 'situational', 'match_play_theme'])

// ── Rating logic ──────────────────────────────────────────────────────────────

function rateItem(
  item: CurriculumItemSummary,
  level: CurriculumLevelSummary,
  ps: PlayerLevelSummary | undefined,
  gapReport: CurriculumGapReport,
): { rating: EffectivenessRating; evidenceStrength: EvidenceStrength; signals: string[] } {
  const signals: string[] = []

  // No players → unknown
  if (!ps || ps.playerCount === 0) {
    signals.push('No players at this level — effectiveness cannot be measured')
    return { rating: 'unknown', evidenceStrength: 'insufficient', signals }
  }

  // No evidence → unknown
  if (!ps.hasEvidence || ps.evidenceSource === 'none') {
    signals.push('No evidence data available for this level')
    return { rating: 'unknown', evidenceStrength: 'insufficient', signals }
  }

  const evidenceStrength: EvidenceStrength =
    ps.evidenceSource === 'evidence_records' && ps.playerCount >= 5 ? 'high' :
    ps.evidenceSource === 'evidence_records' && ps.playerCount >= 2 ? 'medium' :
    ps.hasEvidence ? 'low' : 'insufficient'

  const excellent = arePlayerOutcomesExcellent({
    playerCount:          ps.playerCount,
    advancementEligible:  ps.advancementEligibleCount,
    hasEvidence:          ps.hasEvidence,
    evidenceSource:       ps.evidenceSource,
    weakDomainCount:      ps.weakDomains.length,
  })

  const advancementRate = ps.advancementEligibleCount / ps.playerCount

  // Check if this item type is overrepresented at this level (from gap report)
  const isOverrepresented = gapReport.overrepresentedTypes.some(
    g => g.levelId === level.id && g.contentType === item.contentType,
  )

  const isDrillHeavyLevel = gapReport.drillHeavyLevels.some(g => g.levelId === level.id)

  // High: excellent outcomes at this level
  if (excellent) {
    signals.push(`${Math.round(advancementRate * 100)}% advancement rate at ${level.displayName}`)
    signals.push('No weak domains flagged')
    signals.push('Evidence from actual player records')
    return { rating: 'high', evidenceStrength, signals }
  }

  // Low: overrepresented type in a struggling level
  if (isOverrepresented && advancementRate < 0.2) {
    signals.push(`"${item.contentType}" is overrepresented at ${level.displayName} (${Math.round(advancementRate * 100)}% advancement)`)
    signals.push('Adding more of this type is unlikely to help')
    return { rating: 'low', evidenceStrength, signals }
  }

  // Low: drill in a drill-heavy level with weak advancement
  if (isDrillHeavyLevel && DRILL_TYPES.has(item.contentType) && advancementRate < 0.25) {
    signals.push(`${level.displayName} is drill-heavy — additional drills may not improve outcomes`)
    return { rating: 'low', evidenceStrength, signals }
  }

  // Check weak domain alignment
  if (ps.weakDomains.length > 0) {
    const itemDomain = item.domain?.toLowerCase() ?? ''
    const titleLower  = item.title.toLowerCase()
    const addressesWeakDomain = ps.weakDomains.some(d =>
      itemDomain.includes(d.toLowerCase()) || titleLower.includes(d.toLowerCase()),
    )

    if (addressesWeakDomain) {
      signals.push(`Item addresses weak domain "${item.domain ?? item.title}"`)
      signals.push(`Weak domains detected: ${ps.weakDomains.join(', ')}`)
      return { rating: 'medium', evidenceStrength, signals }
    }

    signals.push(`Weak domains at this level: ${ps.weakDomains.join(', ')}`)
    signals.push('Item does not address known weak domains')
  }

  // Game content in a game-starved level — medium positive signal
  if (
    GAME_TYPES.has(item.contentType) &&
    gapReport.drillHeavyLevels.some(g => g.levelId === level.id)
  ) {
    signals.push('Game content in a drill-heavy level — high potential value')
    return { rating: 'medium', evidenceStrength, signals }
  }

  // Default: moderate evidence, moderate advancement
  if (advancementRate >= 0.2) {
    signals.push(`${Math.round(advancementRate * 100)}% advancement rate`)
    return { rating: 'medium', evidenceStrength, signals }
  }

  signals.push(`Low advancement rate (${Math.round(advancementRate * 100)}%) — effectiveness unclear`)
  return { rating: 'low', evidenceStrength, signals }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function rateDrillEffectiveness(params: {
  levels:        CurriculumLevelSummary[]
  playerByLevel: PlayerLevelSummary[]
  items:         CurriculumItemSummary[]
  gapReport:     CurriculumGapReport
}): DrillEffectivenessReport {
  const { levels, playerByLevel, items, gapReport } = params

  const levelMap: Record<string, CurriculumLevelSummary> = {}
  for (const l of levels) levelMap[l.id] = l

  const playerMap: Record<string, PlayerLevelSummary> = {}
  for (const p of playerByLevel) playerMap[p.levelId] = p

  const records: DrillEffectivenessRecord[] = []

  for (const item of items) {
    const level = levelMap[item.levelId]
    if (!level) continue

    const { rating, evidenceStrength, signals } = rateItem(item, level, playerMap[item.levelId], gapReport)

    records.push({
      itemId:           item.id,
      title:            item.title,
      contentType:      item.contentType,
      levelId:          item.levelId,
      levelName:        item.levelName,
      rating,
      evidenceStrength,
      signals,
    })
  }

  return {
    items:        records,
    highCount:    records.filter(r => r.rating === 'high').length,
    mediumCount:  records.filter(r => r.rating === 'medium').length,
    lowCount:     records.filter(r => r.rating === 'low').length,
    unknownCount: records.filter(r => r.rating === 'unknown').length,
    computedAt:   new Date().toISOString(),
  }
}
