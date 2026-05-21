// Sprint 519 — Curriculum Gap Analysis
// Identifies structural gaps across the curriculum — missing domains, missing levels,
// uneven coverage, and areas where players have no curriculum support.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { CurriculumStage } from './visualMapModel'
import type { SkillDomain } from './skillHierarchyModel'
import type { LevelCoverageScore } from './coverageModel'

export type GapCategory =
  | 'missing_level'
  | 'missing_domain_coverage'
  | 'no_player_pathway'
  | 'assessment_gap'
  | 'content_imbalance'
  | 'parent_engagement_gap'

export interface CurriculumGap {
  gapId: string
  category: GapCategory
  severity: 'critical' | 'high' | 'medium' | 'low'
  stage: CurriculumStage | null
  levelId: string | null
  levelName: string | null
  domain: SkillDomain | null
  title: string
  description: string
  recommendation: string
  affectedPlayerCount: number
}

export interface GapAnalysisReport {
  gaps: CurriculumGap[]
  totalGaps: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  byCategory: Record<GapCategory, number>
  topPriorityGaps: CurriculumGap[]
  isHealthy: boolean
}

interface GapAnalysisInput {
  levels: LevelCoverageScore[]
  expectedStages: CurriculumStage[]
  expectedDomainsPerLevel: SkillDomain[]
  domainCoverageByLevel: Record<string, SkillDomain[]>
  playerCountByLevel: Record<string, number>
  assessableByLevel: Record<string, boolean>
  parentReadyByLevel: Record<string, boolean>
}

export function buildGapAnalysisReport(input: GapAnalysisInput): GapAnalysisReport {
  const gaps: CurriculumGap[] = []
  let gapCounter = 0

  const makeId = (): string => `gap_${(++gapCounter).toString().padStart(4, '0')}`

  for (const level of input.levels) {
    const domainsCovered = input.domainCoverageByLevel[level.levelId] ?? []
    const playerCount = input.playerCountByLevel[level.levelId] ?? 0

    if (level.status === 'empty') {
      gaps.push({
        gapId: makeId(),
        category: 'missing_level',
        severity: playerCount > 0 ? 'critical' : 'high',
        stage: level.stage,
        levelId: level.levelId,
        levelName: level.levelName,
        domain: null,
        title: `${level.levelName} has no curriculum content`,
        description: `No gates, drills, or skills defined. ${playerCount > 0 ? `${playerCount} player${playerCount > 1 ? 's' : ''} at this level have no curriculum support.` : 'Level is empty.'}`,
        recommendation: 'Add at minimum: 3 gates, 3 drills, 2 skills, and coach cues.',
        affectedPlayerCount: playerCount,
      })
    }

    for (const expectedDomain of input.expectedDomainsPerLevel) {
      if (!domainsCovered.includes(expectedDomain)) {
        gaps.push({
          gapId: makeId(),
          category: 'missing_domain_coverage',
          severity: 'medium',
          stage: level.stage,
          levelId: level.levelId,
          levelName: level.levelName,
          domain: expectedDomain,
          title: `${level.levelName} missing ${expectedDomain} coverage`,
          description: `No skills or gates in the ${expectedDomain} domain for this level.`,
          recommendation: `Add at least one ${expectedDomain} skill and gate to this level.`,
          affectedPlayerCount: playerCount,
        })
      }
    }

    if (!input.assessableByLevel[level.levelId]) {
      gaps.push({
        gapId: makeId(),
        category: 'assessment_gap',
        severity: 'high',
        stage: level.stage,
        levelId: level.levelId,
        levelName: level.levelName,
        domain: null,
        title: `${level.levelName} cannot be formally assessed`,
        description: 'Missing assessment criteria or evidence requirements.',
        recommendation: 'Add assessment criteria and evidence requirements to enable structured level reviews.',
        affectedPlayerCount: playerCount,
      })
    }

    if (playerCount > 0 && !input.parentReadyByLevel[level.levelId]) {
      gaps.push({
        gapId: makeId(),
        category: 'parent_engagement_gap',
        severity: 'low',
        stage: level.stage,
        levelId: level.levelId,
        levelName: level.levelName,
        domain: null,
        title: `${level.levelName} has no parent guidance`,
        description: `${playerCount} player${playerCount > 1 ? 's' : ''} at this level — parents have no curriculum context.`,
        recommendation: 'Add parent guidance explaining what players are working on at this level.',
        affectedPlayerCount: playerCount,
      })
    }
  }

  const byCategory: Record<GapCategory, number> = {
    missing_level: 0,
    missing_domain_coverage: 0,
    no_player_pathway: 0,
    assessment_gap: 0,
    content_imbalance: 0,
    parent_engagement_gap: 0,
  }
  for (const gap of gaps) {
    byCategory[gap.category] = (byCategory[gap.category] ?? 0) + 1
  }

  const criticalCount = gaps.filter(g => g.severity === 'critical').length
  const highCount = gaps.filter(g => g.severity === 'high').length
  const mediumCount = gaps.filter(g => g.severity === 'medium').length
  const lowCount = gaps.filter(g => g.severity === 'low').length

  const topPriorityGaps = [...gaps]
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return (severityOrder[a.severity] - severityOrder[b.severity]) || b.affectedPlayerCount - a.affectedPlayerCount
    })
    .slice(0, 5)

  return {
    gaps,
    totalGaps: gaps.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    byCategory,
    topPriorityGaps,
    isHealthy: criticalCount === 0 && highCount === 0,
  }
}

export function getGapCategoryLabel(category: GapCategory): string {
  const labels: Record<GapCategory, string> = {
    missing_level: 'Missing level content',
    missing_domain_coverage: 'Missing domain coverage',
    no_player_pathway: 'No player pathway',
    assessment_gap: 'Assessment gap',
    content_imbalance: 'Content imbalance',
    parent_engagement_gap: 'Parent engagement gap',
  }
  return labels[category]
}
