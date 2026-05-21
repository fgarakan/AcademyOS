// Sprint 526 — Curriculum Health Dashboard
// Aggregates coverage, gap, level health, and player-curriculum intersection data
// into a single director-facing curriculum health view.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { CurriculumCoverageReport } from './coverageModel'
import type { GapAnalysisReport } from './gapAnalysis'
import type { LevelHealthReport } from './levelHealthReport'
import type { CurriculumTemplateConnectionReport } from './templateConnectionModel'

export type CurriculumHealthGrade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface CurriculumHealthDashboard {
  grade: CurriculumHealthGrade
  scoreOutOf100: number
  coverageScore: number
  gapScore: number
  playerSignalScore: number
  templateScore: number
  topActions: CurriculumHealthAction[]
  statusLine: string
  isReadyForPilot: boolean
  pilotBlockers: string[]
}

export interface CurriculumHealthAction {
  priority: 'critical' | 'high' | 'medium' | 'low'
  label: string
  description: string
  href: string | null
}

export interface CurriculumHealthDashboardInput {
  coverageReport: CurriculumCoverageReport
  gapReport: GapAnalysisReport
  levelHealthReports: LevelHealthReport[]
  templateConnectionReport: CurriculumTemplateConnectionReport
}

export function buildCurriculumHealthDashboard(
  input: CurriculumHealthDashboardInput,
): CurriculumHealthDashboard {
  const { coverageReport, gapReport, levelHealthReports, templateConnectionReport } = input

  const coverageScore = coverageReport.overallScoreOutOf100

  const gapPenalty = Math.min(50, gapReport.criticalCount * 15 + gapReport.highCount * 7 + gapReport.mediumCount * 2)
  const gapScore = Math.max(0, 100 - gapPenalty)

  const criticalLevels = levelHealthReports.filter(l => l.healthStatus === 'critical').length
  const atRiskLevels = levelHealthReports.filter(l => l.healthStatus === 'at_risk').length
  const signalPenalty = Math.min(50, criticalLevels * 20 + atRiskLevels * 8)
  const playerSignalScore = Math.max(0, 100 - signalPenalty)

  const totalLevels = templateConnectionReport.levels.length
  const connectedLevels = templateConnectionReport.fullyConnectedLevelCount
  const templateScore = totalLevels > 0 ? Math.round((connectedLevels / totalLevels) * 100) : 0

  const scoreOutOf100 = Math.round(
    coverageScore * 0.35 + gapScore * 0.25 + playerSignalScore * 0.25 + templateScore * 0.15,
  )

  const grade: CurriculumHealthGrade =
    scoreOutOf100 >= 90 ? 'A' :
    scoreOutOf100 >= 75 ? 'B' :
    scoreOutOf100 >= 60 ? 'C' :
    scoreOutOf100 >= 45 ? 'D' :
    'F'

  const topActions: CurriculumHealthAction[] = []

  if (gapReport.criticalCount > 0) {
    topActions.push({
      priority: 'critical',
      label: `Fix ${gapReport.criticalCount} critical curriculum gap${gapReport.criticalCount > 1 ? 's' : ''}`,
      description: gapReport.topPriorityGaps[0]?.description ?? 'Critical gaps in curriculum structure.',
      href: '/director/curriculum/builder',
    })
  }

  if (criticalLevels > 0) {
    topActions.push({
      priority: 'critical',
      label: `${criticalLevels} level${criticalLevels > 1 ? 's' : ''} in critical health`,
      description: 'Players at these levels have no curriculum support.',
      href: '/director/curriculum',
    })
  }

  if (templateConnectionReport.disconnectedLevelCount > 0) {
    topActions.push({
      priority: 'high',
      label: `Connect templates to ${templateConnectionReport.disconnectedLevelCount} level${templateConnectionReport.disconnectedLevelCount > 1 ? 's' : ''}`,
      description: 'Coaches need session templates to deliver curriculum at these levels.',
      href: '/director/class-templates',
    })
  }

  const pilotBlockers: string[] = []
  if (coverageReport.emptyLevels > 0) pilotBlockers.push(`${coverageReport.emptyLevels} empty levels`)
  if (gapReport.criticalCount > 0) pilotBlockers.push(`${gapReport.criticalCount} critical gaps`)
  if (criticalLevels > 0) pilotBlockers.push(`${criticalLevels} critical-health levels`)
  if (templateConnectionReport.disconnectedLevelCount > Math.floor(totalLevels * 0.5)) {
    pilotBlockers.push('More than half of levels have no templates')
  }

  const isReadyForPilot = pilotBlockers.length === 0

  const statusLine = isReadyForPilot
    ? `Curriculum is pilot-ready. Grade: ${grade} (${scoreOutOf100}/100).`
    : `Curriculum needs attention before pilot. Grade: ${grade} (${scoreOutOf100}/100). ${pilotBlockers.join(', ')}.`

  return {
    grade,
    scoreOutOf100,
    coverageScore,
    gapScore,
    playerSignalScore,
    templateScore,
    topActions,
    statusLine,
    isReadyForPilot,
    pilotBlockers,
  }
}

export function getCurriculumHealthGradeLabel(grade: CurriculumHealthGrade): string {
  const labels: Record<CurriculumHealthGrade, string> = {
    A: 'Excellent',
    B: 'Good',
    C: 'Needs work',
    D: 'At risk',
    F: 'Critical',
  }
  return labels[grade]
}
