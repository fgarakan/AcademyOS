// Sprint 435–436 — Director OS Summary Builder V1
// Assembles the full director command center summary from individual data sources.
// This is the top-level data aggregator for the Director dashboard.
// Callers fetch each piece in parallel and pass here for assembly.
// No DB calls — pure aggregation. Server-side only.

import type { SessionCoverageSummary } from './directorDashboardQueries'
import type { PlayerRosterSummary } from './directorDashboardQueries'
import type { HighRiskActionSummary } from './directorDashboardQueries'
import type { SessionTimelineEntry } from './sessionTimelineQueries'
import type { GroupSummary } from './groupManagementQueries'

export interface DirectorOsStatus {
  label: string
  value: string | number
  status: 'ok' | 'warn' | 'alert' | 'muted'
}

export interface DirectorOsSummary {
  generatedAt: string
  academyId: string
  overallStatus: 'all-clear' | 'attention-needed' | 'urgent'
  statusItems: DirectorOsStatus[]
  pendingReviewCount: number
  clarificationNeededCount: number
  highRiskActions: HighRiskActionSummary[]
  todaySessions: SessionTimelineEntry[]
  sessionCoverage: SessionCoverageSummary
  rosterSummary: PlayerRosterSummary
  groupSummaries: GroupSummary[]
  alertCount: number
}

export interface DirectorOsInput {
  academyId: string
  pendingActionCount: { pendingActions: number; clarificationNeeded: number }
  highRiskActions: HighRiskActionSummary[]
  todaySessions: SessionTimelineEntry[]
  sessionCoverage: SessionCoverageSummary
  rosterSummary: PlayerRosterSummary
  groupSummaries: GroupSummary[]
  alertCount: number
}

// Build the Director OS summary. Call after fetching all input data in parallel.
export function buildDirectorOsSummary(input: DirectorOsInput): DirectorOsSummary {
  const statusItems: DirectorOsStatus[] = []

  // Pending review count
  statusItems.push({
    label: 'Pending review',
    value: input.pendingActionCount.pendingActions,
    status: input.pendingActionCount.pendingActions > 5 ? 'alert' :
            input.pendingActionCount.pendingActions > 0 ? 'warn' : 'ok',
  })

  // Clarification needed
  if (input.pendingActionCount.clarificationNeeded > 0) {
    statusItems.push({
      label: 'Awaiting clarification',
      value: input.pendingActionCount.clarificationNeeded,
      status: 'warn',
    })
  }

  // Session wrap-up coverage
  const coveragePct = input.sessionCoverage.totalToday > 0
    ? Math.round((input.sessionCoverage.withWrapUp / input.sessionCoverage.totalToday) * 100)
    : 100
  statusItems.push({
    label: "Today's wrap-up coverage",
    value: `${coveragePct}%`,
    status: coveragePct < 50 ? 'alert' : coveragePct < 80 ? 'warn' : 'ok',
  })

  // Active players
  statusItems.push({
    label: 'Active players',
    value: input.rosterSummary.active,
    status: 'muted',
  })

  // High-risk alerts
  if (input.alertCount > 0) {
    statusItems.push({
      label: 'Player alerts',
      value: input.alertCount,
      status: input.alertCount > 5 ? 'alert' : 'warn',
    })
  }

  // Compute overall status
  const hasUrgent = statusItems.some(s => s.status === 'alert')
  const hasWarning = statusItems.some(s => s.status === 'warn')
  const overallStatus =
    hasUrgent ? 'urgent' :
    hasWarning ? 'attention-needed' :
    'all-clear'

  return {
    generatedAt: new Date().toISOString(),
    academyId: input.academyId,
    overallStatus,
    statusItems,
    pendingReviewCount: input.pendingActionCount.pendingActions,
    clarificationNeededCount: input.pendingActionCount.clarificationNeeded,
    highRiskActions: input.highRiskActions,
    todaySessions: input.todaySessions,
    sessionCoverage: input.sessionCoverage,
    rosterSummary: input.rosterSummary,
    groupSummaries: input.groupSummaries,
    alertCount: input.alertCount,
  }
}

// Returns a one-line status headline for the Director command bar.
export function getDirectorStatusHeadline(summary: DirectorOsSummary): string {
  if (summary.overallStatus === 'all-clear') return 'Academy is on track — no urgent items.'
  if (summary.overallStatus === 'urgent') {
    const urgentItems = summary.statusItems.filter(s => s.status === 'alert')
    return `Urgent: ${urgentItems.map(i => i.label).join(', ')}`
  }
  const warnItems = summary.statusItems.filter(s => s.status === 'warn')
  return `Attention needed: ${warnItems.map(i => i.label).join(', ')}`
}
