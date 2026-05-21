// Sprint 522 — Level Health Report
// Per-level health view combining coverage, gap, and player signal data.
// Gives the director a single "health score" per level with explanation.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { CurriculumStage } from './visualMapModel'
import type { CoverageStatus, LevelCoverageScore } from './coverageModel'

export type LevelHealthStatus = 'healthy' | 'watch' | 'at_risk' | 'critical'

export interface LevelHealthSignal {
  signal: string
  type: 'positive' | 'warning' | 'critical'
}

export interface LevelHealthReport {
  levelId: string
  levelName: string
  stage: CurriculumStage
  healthStatus: LevelHealthStatus
  healthScore: number
  coverageScore: number
  coverageStatus: CoverageStatus
  playerCount: number
  atRiskPlayerCount: number
  stalledPlayerCount: number
  gateMetPct: number
  signals: LevelHealthSignal[]
  primaryAction: string | null
  primaryActionHref: string | null
}

export interface LevelHealthInput {
  coverage: LevelCoverageScore
  playerCount: number
  atRiskPlayerCount: number
  stalledPlayerCount: number
  gateMetPct: number
  pendingApprovals: number
  lastReviewedDaysAgo: number | null
}

export function buildLevelHealthReport(input: LevelHealthInput): LevelHealthReport {
  const { coverage, playerCount, atRiskPlayerCount, stalledPlayerCount, gateMetPct, pendingApprovals, lastReviewedDaysAgo } = input

  const signals: LevelHealthSignal[] = []
  let healthScore = coverage.scoreOutOf100

  if (atRiskPlayerCount > 0) {
    signals.push({
      signal: `${atRiskPlayerCount} player${atRiskPlayerCount > 1 ? 's' : ''} at risk`,
      type: 'critical',
    })
    healthScore -= atRiskPlayerCount * 10
  }

  if (stalledPlayerCount > 0) {
    signals.push({
      signal: `${stalledPlayerCount} player${stalledPlayerCount > 1 ? 's' : ''} stalled`,
      type: 'warning',
    })
    healthScore -= stalledPlayerCount * 5
  }

  if (pendingApprovals > 0) {
    signals.push({
      signal: `${pendingApprovals} pending approval${pendingApprovals > 1 ? 's' : ''}`,
      type: 'warning',
    })
    healthScore -= pendingApprovals * 3
  }

  if (lastReviewedDaysAgo !== null && lastReviewedDaysAgo > 90) {
    signals.push({
      signal: `Not reviewed in ${lastReviewedDaysAgo} days`,
      type: 'warning',
    })
    healthScore -= 5
  }

  if (gateMetPct > 70) {
    signals.push({ signal: `${gateMetPct}% gates met across players`, type: 'positive' })
  }

  if (coverage.status === 'complete') {
    signals.push({ signal: 'Curriculum content complete', type: 'positive' })
    healthScore += 5
  }

  healthScore = Math.max(0, Math.min(100, healthScore))

  const healthStatus: LevelHealthStatus =
    healthScore >= 80 ? 'healthy' :
    healthScore >= 60 ? 'watch' :
    healthScore >= 35 ? 'at_risk' :
    'critical'

  let primaryAction: string | null = null
  let primaryActionHref: string | null = null

  if (healthStatus === 'critical' || healthStatus === 'at_risk') {
    if (atRiskPlayerCount > 0) {
      primaryAction = 'Review at-risk players'
      primaryActionHref = '/director/players'
    } else if (coverage.status === 'empty' || coverage.status === 'minimal') {
      primaryAction = 'Add curriculum content'
      primaryActionHref = '/director/curriculum/builder'
    }
  } else if (pendingApprovals > 0) {
    primaryAction = 'Review pending approvals'
    primaryActionHref = '/director/review'
  }

  return {
    levelId: coverage.levelId,
    levelName: coverage.levelName,
    stage: coverage.stage,
    healthStatus,
    healthScore,
    coverageScore: coverage.scoreOutOf100,
    coverageStatus: coverage.status,
    playerCount,
    atRiskPlayerCount,
    stalledPlayerCount,
    gateMetPct,
    signals,
    primaryAction,
    primaryActionHref,
  }
}

export function getLevelHealthStatusLabel(status: LevelHealthStatus): string {
  const labels: Record<LevelHealthStatus, string> = {
    healthy: 'Healthy',
    watch: 'Watch',
    at_risk: 'At risk',
    critical: 'Critical',
  }
  return labels[status]
}

export function sortLevelsByHealth(levels: LevelHealthReport[]): LevelHealthReport[] {
  const order: Record<LevelHealthStatus, number> = {
    critical: 0, at_risk: 1, watch: 2, healthy: 3,
  }
  return [...levels].sort((a, b) => order[a.healthStatus] - order[b.healthStatus] || a.healthScore - b.healthScore)
}
