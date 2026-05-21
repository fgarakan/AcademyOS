// Sprint 475 — Director Curriculum Operating View V1
// Builds the director's weekly curriculum operating view:
// what is being taught, by which groups, how compliant the delivery is.
// Pure TypeScript — no DB calls. Accepts pre-fetched compliance and group data.

import type { TemplateComplianceResult } from './templateComplianceChecker'
import type { GroupSummary } from './groupManagementQueries'

export type CurriculumDeliveryStatus = 'on_track' | 'partial' | 'not_started' | 'no_template'

export interface GroupCurriculumStatus {
  groupId: string
  groupName: string
  templateName: string | null
  deliveryStatus: CurriculumDeliveryStatus
  alignmentPct: number | null
  issueCount: number
  sessionCountThisWeek: number
  recommendedAction: string | null
}

export interface PendingCurriculumChange {
  actionId: string
  description: string
  proposedBy: string | null
  riskLevel: string | null
  href: string
}

export interface CurriculumOperatingView {
  weekLabel: string
  groupStatuses: GroupCurriculumStatus[]
  onTrackCount: number
  partialCount: number
  notStartedCount: number
  noTemplateCount: number
  pendingChanges: PendingCurriculumChange[]
  overallCompliance: 'healthy' | 'partial' | 'critical' | 'no_data'
  summaryLine: string
}

export interface CurriculumOperatingViewInput {
  groups: GroupSummary[]
  complianceByTemplateId: Map<string, TemplateComplianceResult>
  groupTemplateMap: Map<string, { templateId: string; templateName: string } | null>
  sessionCountByGroupId: Map<string, number>
  pendingCurriculumActions: Array<{
    id: string
    actionLabel: string
    requestedBy: string | null
    riskLevel: string | null
  }>
  weekLabel?: string
}

function statusFromCompliance(
  complianceResult: TemplateComplianceResult | null | undefined,
  sessionCount: number,
): CurriculumDeliveryStatus {
  if (!complianceResult) return 'no_template'
  if (sessionCount === 0) return 'not_started'
  if (complianceResult.alignmentPct >= 80) return 'on_track'
  return 'partial'
}

function recommendedAction(status: CurriculumDeliveryStatus, groupName: string): string | null {
  if (status === 'no_template') return `Assign a session template to ${groupName}`
  if (status === 'not_started') return `Schedule sessions for ${groupName} this week`
  if (status === 'partial') return `Review curriculum alignment for ${groupName} templates`
  return null
}

export function buildCurriculumOperatingView(input: CurriculumOperatingViewInput): CurriculumOperatingView {
  const weekLabel = input.weekLabel ?? getCurrentWeekLabel()

  const groupStatuses: GroupCurriculumStatus[] = input.groups.map(group => {
    const templateInfo = input.groupTemplateMap.get(group.id) ?? null
    const compliance = templateInfo
      ? (input.complianceByTemplateId.get(templateInfo.templateId) ?? null)
      : null
    const sessionCount = input.sessionCountByGroupId.get(group.id) ?? 0
    const status = statusFromCompliance(compliance, sessionCount)

    return {
      groupId: group.id,
      groupName: group.name,
      templateName: templateInfo?.templateName ?? null,
      deliveryStatus: status,
      alignmentPct: compliance?.alignmentPct ?? null,
      issueCount: compliance?.issues.length ?? 0,
      sessionCountThisWeek: sessionCount,
      recommendedAction: recommendedAction(status, group.name),
    }
  })

  const onTrackCount = groupStatuses.filter(g => g.deliveryStatus === 'on_track').length
  const partialCount = groupStatuses.filter(g => g.deliveryStatus === 'partial').length
  const notStartedCount = groupStatuses.filter(g => g.deliveryStatus === 'not_started').length
  const noTemplateCount = groupStatuses.filter(g => g.deliveryStatus === 'no_template').length

  const pendingChanges: PendingCurriculumChange[] = input.pendingCurriculumActions.map(a => ({
    actionId: a.id,
    description: a.actionLabel,
    proposedBy: a.requestedBy,
    riskLevel: a.riskLevel,
    href: '/director/review',
  }))

  const overallCompliance: 'healthy' | 'partial' | 'critical' | 'no_data' =
    groupStatuses.length === 0 ? 'no_data' :
    noTemplateCount + notStartedCount > groupStatuses.length / 2 ? 'critical' :
    onTrackCount >= groupStatuses.length * 0.8 ? 'healthy' : 'partial'

  return {
    weekLabel,
    groupStatuses,
    onTrackCount,
    partialCount,
    notStartedCount,
    noTemplateCount,
    pendingChanges,
    overallCompliance,
    summaryLine: buildComplianceSummaryLine(onTrackCount, partialCount, notStartedCount, noTemplateCount),
  }
}

function buildComplianceSummaryLine(
  onTrack: number,
  partial: number,
  notStarted: number,
  noTemplate: number,
): string {
  const total = onTrack + partial + notStarted + noTemplate
  if (total === 0) return 'No groups found.'
  if (onTrack === total) return 'All groups are on track with curriculum delivery.'
  const issues: string[] = []
  if (noTemplate > 0) issues.push(`${noTemplate.toString()} without a template`)
  if (notStarted > 0) issues.push(`${notStarted.toString()} not started`)
  if (partial > 0) issues.push(`${partial.toString()} partially aligned`)
  return `${onTrack.toString()} of ${total.toString()} groups on track — ${issues.join(', ')}.`
}

function getCurrentWeekLabel(): string {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `Week of ${fmt(monday)} – ${fmt(sunday)}`
}

export function getCurriculumStatusLabel(status: CurriculumDeliveryStatus): string {
  const labels: Record<CurriculumDeliveryStatus, string> = {
    on_track: 'On track',
    partial: 'Partially aligned',
    not_started: 'Not started',
    no_template: 'No template',
  }
  return labels[status]
}
