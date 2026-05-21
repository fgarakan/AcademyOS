// Sprint 527 — Coverage Recommendations
// Generates actionable recommendations for improving curriculum coverage.
// Recommendations are always for director review — never auto-applied.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { CurriculumStage } from './visualMapModel'
import type { CoverageGap, LevelCoverageScore } from './coverageModel'
import type { CurriculumGap } from './gapAnalysis'

export type RecommendationSource = 'coverage_gap' | 'analysis_gap' | 'template_gap' | 'player_signal'

export interface CurriculumRecommendation {
  recommendationId: string
  source: RecommendationSource
  priority: 'critical' | 'high' | 'medium' | 'low'
  levelId: string | null
  levelName: string | null
  stage: CurriculumStage | null
  title: string
  rationale: string
  suggestedAction: string
  requiresDirectorApproval: true
  neverAutoApply: true
  estimatedImpact: 'high' | 'medium' | 'low'
  affectedPlayerCount: number
}

export interface CoverageRecommendationReport {
  recommendations: CurriculumRecommendation[]
  totalCount: number
  criticalCount: number
  topRecommendations: CurriculumRecommendation[]
  requiresDirectorApproval: true
  neverAutoApply: true
}

function coverageGapToRecommendation(
  gap: CoverageGap,
  level: LevelCoverageScore,
  index: number,
  playerCount: number,
): CurriculumRecommendation {
  return {
    recommendationId: `rec_cov_${level.levelId}_${index}`,
    source: 'coverage_gap',
    priority: gap.severity === 'critical' ? 'critical' : gap.severity === 'recommended' ? 'high' : 'medium',
    levelId: level.levelId,
    levelName: level.levelName,
    stage: level.stage,
    title: `${level.levelName}: ${gap.area} gap`,
    rationale: gap.description,
    suggestedAction: gap.fixHint,
    requiresDirectorApproval: true,
    neverAutoApply: true,
    estimatedImpact: gap.severity === 'critical' ? 'high' : gap.severity === 'recommended' ? 'medium' : 'low',
    affectedPlayerCount: playerCount,
  }
}

function analysisGapToRecommendation(
  gap: CurriculumGap,
): CurriculumRecommendation {
  return {
    recommendationId: `rec_gap_${gap.gapId}`,
    source: 'analysis_gap',
    priority: gap.severity === 'critical' ? 'critical' : gap.severity === 'high' ? 'high' : gap.severity === 'medium' ? 'medium' : 'low',
    levelId: gap.levelId,
    levelName: gap.levelName,
    stage: gap.stage,
    title: gap.title,
    rationale: gap.description,
    suggestedAction: gap.recommendation,
    requiresDirectorApproval: true,
    neverAutoApply: true,
    estimatedImpact: gap.affectedPlayerCount > 5 ? 'high' : gap.affectedPlayerCount > 0 ? 'medium' : 'low',
    affectedPlayerCount: gap.affectedPlayerCount,
  }
}

export function buildCoverageRecommendationReport(
  levels: LevelCoverageScore[],
  analysisGaps: CurriculumGap[],
  playerCountByLevel: Record<string, number>,
): CoverageRecommendationReport {
  const recommendations: CurriculumRecommendation[] = []

  for (const level of levels) {
    const playerCount = playerCountByLevel[level.levelId] ?? 0
    level.gaps.forEach((gap, i) => {
      recommendations.push(coverageGapToRecommendation(gap, level, i, playerCount))
    })
  }

  for (const gap of analysisGaps) {
    const isDuplicate = recommendations.some(
      r => r.levelId === gap.levelId && r.rationale === gap.description,
    )
    if (!isDuplicate) {
      recommendations.push(analysisGapToRecommendation(gap))
    }
  }

  const sorted = [...recommendations].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 }
    return (order[a.priority] - order[b.priority]) || b.affectedPlayerCount - a.affectedPlayerCount
  })

  const criticalCount = sorted.filter(r => r.priority === 'critical').length
  const topRecommendations = sorted.slice(0, 5)

  return {
    recommendations: sorted,
    totalCount: sorted.length,
    criticalCount,
    topRecommendations,
    requiresDirectorApproval: true,
    neverAutoApply: true,
  }
}

export function filterRecommendationsByPriority(
  report: CoverageRecommendationReport,
  priority: 'critical' | 'high' | 'medium' | 'low',
): CurriculumRecommendation[] {
  return report.recommendations.filter(r => r.priority === priority)
}

export function filterRecommendationsByLevel(
  report: CoverageRecommendationReport,
  levelId: string,
): CurriculumRecommendation[] {
  return report.recommendations.filter(r => r.levelId === levelId)
}
