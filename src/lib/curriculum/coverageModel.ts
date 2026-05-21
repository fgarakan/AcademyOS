// Sprint 518 — Curriculum Coverage Model
// Typed model for measuring how completely a curriculum level is built out.
// Coverage = does the level have the minimum content needed to be teachable?
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { CurriculumStage } from './visualMapModel'

export type CoverageStatus = 'complete' | 'partial' | 'minimal' | 'empty'

export interface LevelCoverageInput {
  levelId: string
  levelName: string
  stage: CurriculumStage
  gateCount: number
  drillCount: number
  coachCueCount: number
  skillCount: number
  assessmentCriteriaCount: number
  evidenceRequirementCount: number
  missionCount: number
  badgeCount: number
  parentGuidanceCount: number
  learningModuleCount: number
}

export interface LevelCoverageScore {
  levelId: string
  levelName: string
  stage: CurriculumStage
  status: CoverageStatus
  scoreOutOf100: number
  gapCount: number
  gaps: CoverageGap[]
  isTeachable: boolean
  isAssessable: boolean
  isParentReady: boolean
  isPlayerReady: boolean
}

export interface CoverageGap {
  area: string
  severity: 'critical' | 'recommended' | 'optional'
  description: string
  fixHint: string
}

export interface CurriculumCoverageReport {
  levels: LevelCoverageScore[]
  totalLevels: number
  completeLevels: number
  partialLevels: number
  minimalLevels: number
  emptyLevels: number
  overallStatus: CoverageStatus
  overallScoreOutOf100: number
  criticalGapCount: number
  topGaps: CoverageGap[]
}

const COVERAGE_WEIGHTS = {
  gates: 25,
  drills: 20,
  coachCues: 15,
  skills: 15,
  assessment: 10,
  missions: 5,
  parentGuidance: 5,
  badges: 5,
}

function computeLevelCoverage(input: LevelCoverageInput): LevelCoverageScore {
  const gaps: CoverageGap[] = []

  let score = 0
  if (input.gateCount >= 3) score += COVERAGE_WEIGHTS.gates
  else if (input.gateCount >= 1) score += Math.round(COVERAGE_WEIGHTS.gates * 0.5)

  if (input.drillCount >= 3) score += COVERAGE_WEIGHTS.drills
  else if (input.drillCount >= 1) score += Math.round(COVERAGE_WEIGHTS.drills * 0.5)

  if (input.coachCueCount >= 2) score += COVERAGE_WEIGHTS.coachCues
  else if (input.coachCueCount >= 1) score += Math.round(COVERAGE_WEIGHTS.coachCues * 0.5)

  if (input.skillCount >= 2) score += COVERAGE_WEIGHTS.skills
  else if (input.skillCount >= 1) score += Math.round(COVERAGE_WEIGHTS.skills * 0.5)

  if (input.assessmentCriteriaCount >= 1 && input.evidenceRequirementCount >= 1) {
    score += COVERAGE_WEIGHTS.assessment
  } else if (input.assessmentCriteriaCount >= 1 || input.evidenceRequirementCount >= 1) {
    score += Math.round(COVERAGE_WEIGHTS.assessment * 0.5)
  }

  if (input.missionCount >= 1) score += COVERAGE_WEIGHTS.missions
  if (input.parentGuidanceCount >= 1) score += COVERAGE_WEIGHTS.parentGuidance
  if (input.badgeCount >= 1) score += COVERAGE_WEIGHTS.badges

  if (input.gateCount === 0) {
    gaps.push({
      area: 'Gates',
      severity: 'critical',
      description: 'No advancement gates defined.',
      fixHint: 'Add at least 3 gate criteria to make this level assessable.',
    })
  } else if (input.gateCount < 3) {
    gaps.push({
      area: 'Gates',
      severity: 'recommended',
      description: `Only ${input.gateCount} gate${input.gateCount > 1 ? 's' : ''} defined — 3 or more recommended.`,
      fixHint: 'Add more gates to give coaches a complete picture of level mastery.',
    })
  }

  if (input.drillCount === 0) {
    gaps.push({
      area: 'Drills',
      severity: 'critical',
      description: 'No drills attached.',
      fixHint: 'Attach at least 3 drills so coaches have concrete session content.',
    })
  }

  if (input.coachCueCount === 0) {
    gaps.push({
      area: 'Coach Cues',
      severity: 'recommended',
      description: 'No coach cues defined.',
      fixHint: 'Add observation prompts to help coaches see the right things.',
    })
  }

  if (input.assessmentCriteriaCount === 0) {
    gaps.push({
      area: 'Assessment',
      severity: 'recommended',
      description: 'No assessment criteria defined.',
      fixHint: 'Add formal assessment criteria to enable structured level reviews.',
    })
  }

  if (input.parentGuidanceCount === 0) {
    gaps.push({
      area: 'Parent Guidance',
      severity: 'optional',
      description: 'No parent guidance content.',
      fixHint: 'Add parent-facing explanation to improve family engagement.',
    })
  }

  const status: CoverageStatus =
    score >= 90 ? 'complete' :
    score >= 55 ? 'partial' :
    score >= 20 ? 'minimal' :
    'empty'

  return {
    levelId: input.levelId,
    levelName: input.levelName,
    stage: input.stage,
    status,
    scoreOutOf100: score,
    gapCount: gaps.length,
    gaps,
    isTeachable: input.gateCount >= 1 && input.drillCount >= 1,
    isAssessable: input.assessmentCriteriaCount >= 1 && input.evidenceRequirementCount >= 1,
    isParentReady: input.parentGuidanceCount >= 1,
    isPlayerReady: input.missionCount >= 1 || input.badgeCount >= 1,
  }
}

export function buildCurriculumCoverageReport(
  levelInputs: LevelCoverageInput[],
): CurriculumCoverageReport {
  const levels = levelInputs.map(computeLevelCoverage)

  const completeLevels = levels.filter(l => l.status === 'complete').length
  const partialLevels = levels.filter(l => l.status === 'partial').length
  const minimalLevels = levels.filter(l => l.status === 'minimal').length
  const emptyLevels = levels.filter(l => l.status === 'empty').length

  const overallScore = levels.length > 0
    ? Math.round(levels.reduce((sum, l) => sum + l.scoreOutOf100, 0) / levels.length)
    : 0

  const overallStatus: CoverageStatus =
    overallScore >= 90 ? 'complete' :
    overallScore >= 55 ? 'partial' :
    overallScore >= 20 ? 'minimal' :
    'empty'

  const allGaps = levels.flatMap(l => l.gaps)
  const criticalGapCount = allGaps.filter(g => g.severity === 'critical').length
  const topGaps = allGaps.filter(g => g.severity === 'critical').slice(0, 5)

  return {
    levels,
    totalLevels: levels.length,
    completeLevels,
    partialLevels,
    minimalLevels,
    emptyLevels,
    overallStatus,
    overallScoreOutOf100: overallScore,
    criticalGapCount,
    topGaps,
  }
}

export function getCoverageStatusLabel(status: CoverageStatus): string {
  const labels: Record<CoverageStatus, string> = {
    complete: 'Complete',
    partial: 'Partial',
    minimal: 'Minimal',
    empty: 'Empty',
  }
  return labels[status]
}

export function getLevelsNeedingAttention(report: CurriculumCoverageReport): LevelCoverageScore[] {
  return report.levels.filter(l => l.status === 'empty' || l.status === 'minimal' || l.gaps.some(g => g.severity === 'critical')).sort((a, b) => a.scoreOutOf100 - b.scoreOutOf100)
}
