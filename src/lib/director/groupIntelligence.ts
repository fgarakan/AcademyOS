// Sprint 477 — Director Group Intelligence V1
// Aggregates attendance, development, and capacity signals per group.
// Pure TypeScript — no DB calls. Input is pre-fetched arrays.
// Surfaces per-group risk ratings and recommended director actions.

import type { GroupSummary } from './groupManagementQueries'

export type GroupSignalStatus = 'healthy' | 'at_risk' | 'critical' | 'no_data'

export interface GroupAttendanceSignal {
  groupId: string
  attendanceRatePct: number | null
  missedStreak: number
  sessionCount: number
}

export interface GroupDevelopmentSignal {
  groupId: string
  playersWithAssessmentPct: number | null
  playersAtRiskCount: number
  averageProgressScore: number | null
}

export interface GroupIntelligenceSignal {
  group: GroupSummary
  attendanceStatus: GroupSignalStatus
  developmentStatus: GroupSignalStatus
  capacityStatus: GroupSignalStatus
  overallStatus: GroupSignalStatus
  riskScore: number
  signals: string[]
  recommendedAction: string | null
  href: string
}

export interface GroupIntelligenceReport {
  groupSignals: GroupIntelligenceSignal[]
  criticalGroups: GroupIntelligenceSignal[]
  atRiskGroups: GroupIntelligenceSignal[]
  healthyGroups: GroupIntelligenceSignal[]
  noDataGroups: GroupIntelligenceSignal[]
  overallAcademyStatus: GroupSignalStatus
  summaryLine: string
}

function attendanceStatus(attendanceRatePct: number | null): GroupSignalStatus {
  if (attendanceRatePct === null) return 'no_data'
  if (attendanceRatePct >= 80) return 'healthy'
  if (attendanceRatePct >= 65) return 'at_risk'
  return 'critical'
}

function developmentStatus(signal: GroupDevelopmentSignal): GroupSignalStatus {
  if (signal.playersWithAssessmentPct === null) return 'no_data'
  if (signal.playersAtRiskCount > 2) return 'critical'
  if (signal.playersWithAssessmentPct < 50) return 'at_risk'
  if (signal.playersAtRiskCount > 0) return 'at_risk'
  return 'healthy'
}

function capacityStatus(group: GroupSummary): GroupSignalStatus {
  if (group.maxPlayers === null) return 'no_data'
  const utilizationPct = (group.memberCount / group.maxPlayers) * 100
  if (utilizationPct > 100) return 'critical'
  if (utilizationPct >= 90) return 'at_risk'
  return 'healthy'
}

const STATUS_RISK: Record<GroupSignalStatus, number> = {
  critical: 100,
  at_risk: 30,
  healthy: 0,
  no_data: 5,
}

function computeOverallStatus(statuses: GroupSignalStatus[]): GroupSignalStatus {
  if (statuses.includes('critical')) return 'critical'
  if (statuses.includes('at_risk')) return 'at_risk'
  if (statuses.every(s => s === 'no_data')) return 'no_data'
  return 'healthy'
}

function buildSignals(
  group: GroupSummary,
  attendance: GroupAttendanceSignal | null,
  development: GroupDevelopmentSignal | null,
): string[] {
  const signals: string[] = []

  if (group.maxPlayers !== null && group.memberCount > group.maxPlayers) {
    signals.push(`Over capacity (${group.memberCount.toString()}/${group.maxPlayers.toString()} players)`)
  }

  if (attendance) {
    if (attendance.attendanceRatePct !== null && attendance.attendanceRatePct < 65) {
      signals.push(`Low attendance: ${Math.round(attendance.attendanceRatePct).toString()}%`)
    }
    if (attendance.missedStreak > 1) {
      signals.push(`${attendance.missedStreak.toString()} players with consecutive absences`)
    }
  }

  if (development) {
    if (development.playersAtRiskCount > 0) {
      signals.push(`${development.playersAtRiskCount.toString()} player${development.playersAtRiskCount > 1 ? 's' : ''} at development risk`)
    }
    if (development.playersWithAssessmentPct !== null && development.playersWithAssessmentPct < 50) {
      signals.push(`Under 50% of players have recent assessments`)
    }
  }

  return signals
}

function buildRecommendedAction(overallStatus: GroupSignalStatus, signals: string[]): string | null {
  if (overallStatus === 'healthy') return null
  if (overallStatus === 'critical') {
    if (signals.some(s => s.includes('capacity'))) return 'Reassign players or expand group capacity'
    if (signals.some(s => s.includes('attendance'))) return 'Review attendance and contact at-risk families'
    return 'Review group immediately — critical signals detected'
  }
  if (overallStatus === 'at_risk') {
    if (signals.some(s => s.includes('assessment'))) return 'Schedule assessments for players in this group'
    if (signals.some(s => s.includes('attendance'))) return 'Monitor attendance closely this week'
    return 'Review group performance — warning signals detected'
  }
  return null
}

export function buildGroupIntelligenceSignal(
  group: GroupSummary,
  attendanceSignal: GroupAttendanceSignal | null,
  developmentSignal: GroupDevelopmentSignal | null,
): GroupIntelligenceSignal {
  const attStatus = attendanceStatus(attendanceSignal?.attendanceRatePct ?? null)
  const devStatus = developmentSignal ? developmentStatus(developmentSignal) : ('no_data' as GroupSignalStatus)
  const capStatus = capacityStatus(group)

  const statuses: GroupSignalStatus[] = [attStatus, devStatus, capStatus]
  const overallStatus = computeOverallStatus(statuses)

  const riskScore = statuses.reduce((sum, s) => sum + STATUS_RISK[s], 0)
  const signals = buildSignals(group, attendanceSignal, developmentSignal)
  const recommendedAction = buildRecommendedAction(overallStatus, signals)

  return {
    group,
    attendanceStatus: attStatus,
    developmentStatus: devStatus,
    capacityStatus: capStatus,
    overallStatus,
    riskScore,
    signals,
    recommendedAction,
    href: `/director/groups/${group.id}`,
  }
}

export function buildGroupIntelligenceReport(
  groups: GroupSummary[],
  attendanceSignals: GroupAttendanceSignal[],
  developmentSignals: GroupDevelopmentSignal[],
): GroupIntelligenceReport {
  const attendanceMap = new Map<string, GroupAttendanceSignal>()
  for (const s of attendanceSignals) attendanceMap.set(s.groupId, s)

  const developmentMap = new Map<string, GroupDevelopmentSignal>()
  for (const s of developmentSignals) developmentMap.set(s.groupId, s)

  const groupSignals = groups
    .map(g =>
      buildGroupIntelligenceSignal(
        g,
        attendanceMap.get(g.id) ?? null,
        developmentMap.get(g.id) ?? null,
      ),
    )
    .sort((a, b) => b.riskScore - a.riskScore)

  const criticalGroups = groupSignals.filter(g => g.overallStatus === 'critical')
  const atRiskGroups = groupSignals.filter(g => g.overallStatus === 'at_risk')
  const healthyGroups = groupSignals.filter(g => g.overallStatus === 'healthy')
  const noDataGroups = groupSignals.filter(g => g.overallStatus === 'no_data')

  const overallAcademyStatus: GroupSignalStatus =
    criticalGroups.length > 0 ? 'critical' :
    atRiskGroups.length > 0 ? 'at_risk' :
    healthyGroups.length > 0 ? 'healthy' : 'no_data'

  return {
    groupSignals,
    criticalGroups,
    atRiskGroups,
    healthyGroups,
    noDataGroups,
    overallAcademyStatus,
    summaryLine: buildGroupSummaryLine(criticalGroups.length, atRiskGroups.length, healthyGroups.length),
  }
}

function buildGroupSummaryLine(critical: number, atRisk: number, healthy: number): string {
  const total = critical + atRisk + healthy
  if (total === 0) return 'No group data available.'
  if (critical === 0 && atRisk === 0) return `All ${healthy.toString()} groups are healthy.`
  const parts: string[] = []
  if (critical > 0) parts.push(`${critical.toString()} critical`)
  if (atRisk > 0) parts.push(`${atRisk.toString()} at risk`)
  if (healthy > 0) parts.push(`${healthy.toString()} healthy`)
  return parts.join(' · ')
}

export function rankGroupsByRisk(signals: GroupIntelligenceSignal[]): GroupIntelligenceSignal[] {
  return [...signals].sort((a, b) => b.riskScore - a.riskScore)
}
