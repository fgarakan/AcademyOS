// Sprint 547 — Knowledge Curriculum Intelligence
// Connects knowledge library signals to curriculum coverage gaps.
// Surfaces knowledge items that could fill specific curriculum gaps.
// Director reviews all suggestions — nothing auto-fills.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeItem } from './knowledgeTypes'
import type { CurriculumGap } from '@/lib/curriculum/gapAnalysis'
import type { LevelCoverageScore } from '@/lib/curriculum/coverageModel'

export interface KnowledgeGapMatch {
  gap: CurriculumGap
  matchingItems: KnowledgeItem[]
  matchStrength: 'strong' | 'moderate' | 'weak'
  suggestedAction: string
  requiresDirectorReview: true
  neverAutoFills: true
}

export interface KnowledgeCurriculumIntelligenceReport {
  gapMatches: KnowledgeGapMatch[]
  totalGapsWithMatches: number
  totalGapsWithoutMatches: number
  highValueMatches: KnowledgeGapMatch[]
  requiresDirectorReview: true
  neverAutoFills: true
  summary: string
}

function computeMatchStrength(gap: CurriculumGap, items: KnowledgeItem[]): 'strong' | 'moderate' | 'weak' {
  if (items.length === 0) return 'weak'
  const strongItems = items.filter(item => {
    const domainMatch = gap.domain !== null && item.domain === gap.domain
    const levelMatch = gap.levelId !== null && item.promotedCurriculumLevelIds.includes(gap.levelId)
    return domainMatch || levelMatch
  })
  if (strongItems.length >= 2) return 'strong'
  if (strongItems.length >= 1 || items.length >= 2) return 'moderate'
  return 'weak'
}

function findItemsForGap(gap: CurriculumGap, items: KnowledgeItem[]): KnowledgeItem[] {
  return items.filter(item => {
    if (item.status !== 'approved_general' && item.status !== 'promoted_to_curriculum') return false

    const domainMatch = gap.domain !== null && item.domain === gap.domain
    const levelMatch = gap.levelId !== null && item.promotedCurriculumLevelIds.includes(gap.levelId)
    const tagMatch = gap.domain !== null && item.tags.includes(gap.domain)

    return domainMatch || levelMatch || tagMatch
  }).slice(0, 5)
}

export function buildKnowledgeCurriculumIntelligenceReport(
  gaps: CurriculumGap[],
  knowledgeItems: KnowledgeItem[],
): KnowledgeCurriculumIntelligenceReport {
  const gapMatches: KnowledgeGapMatch[] = []

  for (const gap of gaps) {
    const matchingItems = findItemsForGap(gap, knowledgeItems)
    const matchStrength = computeMatchStrength(gap, matchingItems)
    const suggestedAction = matchingItems.length > 0
      ? `Review ${matchingItems.length} knowledge item${matchingItems.length > 1 ? 's' : ''} that may help fill this gap — promote to curriculum draft if suitable.`
      : 'No matching knowledge items found — consider adding content via knowledge submission.'

    gapMatches.push({
      gap,
      matchingItems,
      matchStrength,
      suggestedAction,
      requiresDirectorReview: true,
      neverAutoFills: true,
    })
  }

  const totalGapsWithMatches = gapMatches.filter(m => m.matchingItems.length > 0).length
  const totalGapsWithoutMatches = gapMatches.filter(m => m.matchingItems.length === 0).length
  const highValueMatches = gapMatches.filter(m => m.matchStrength === 'strong' && m.gap.severity === 'critical').slice(0, 5)

  const summary = totalGapsWithMatches === 0
    ? 'No knowledge items found to fill curriculum gaps.'
    : `${totalGapsWithMatches} of ${gaps.length} gaps have matching knowledge items — all require director review before being used.`

  return {
    gapMatches,
    totalGapsWithMatches,
    totalGapsWithoutMatches,
    highValueMatches,
    requiresDirectorReview: true,
    neverAutoFills: true,
    summary,
  }
}

export function getGapMatchesForLevel(
  report: KnowledgeCurriculumIntelligenceReport,
  levelId: string,
): KnowledgeGapMatch[] {
  return report.gapMatches.filter(m => m.gap.levelId === levelId && m.matchingItems.length > 0)
}

export function getCoverageIntelligenceSummary(
  report: KnowledgeCurriculumIntelligenceReport,
  level: LevelCoverageScore,
): string {
  const levelMatches = getGapMatchesForLevel(report, level.levelId)
  if (levelMatches.length === 0) return `No knowledge items can help with ${level.levelName} gaps.`
  const strong = levelMatches.filter(m => m.matchStrength === 'strong').length
  return `${levelMatches.length} knowledge item match${levelMatches.length > 1 ? 'es' : ''} for ${level.levelName} (${strong} strong match${strong !== 1 ? 'es' : ''}) — director review required.`
}
