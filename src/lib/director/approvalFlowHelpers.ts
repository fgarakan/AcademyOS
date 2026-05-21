// Sprint 474 — Director Approval Flow Helpers V1
// Priority scoring, urgency ranking, and grouping for the director review queue.
// Pure TypeScript — no DB calls. Operates on proposed_action row data.
// Companion to approvalActions.ts (which does mutation) — this handles presentation logic.

export type ApprovalRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ApprovalStatus = 'pending_review' | 'approved' | 'rejected' | 'needs_clarification' | 'expired'

export interface PendingApprovalSummary {
  id: string
  actionType: string
  actionLabel: string
  riskLevel: ApprovalRiskLevel | null
  status: ApprovalStatus
  createdAt: string
  expiresAt: string | null
  requestedBy: string | null
  reviewerNotes: string | null
}

export interface ApprovalUrgencyScore {
  actionId: string
  urgencyScore: number
  urgencyLabel: 'urgent' | 'time_sensitive' | 'normal' | 'low'
  hoursRemaining: number | null
  reason: string
}

export interface ApprovalGroup {
  actionType: string
  label: string
  riskLevel: ApprovalRiskLevel | null
  items: PendingApprovalSummary[]
  maxUrgency: 'urgent' | 'time_sensitive' | 'normal' | 'low'
}

const RISK_WEIGHT: Record<string, number> = {
  critical: 1000,
  high: 100,
  medium: 10,
  low: 1,
}

const HOURS_MS = 1000 * 60 * 60

function hoursUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  return (new Date(expiresAt).getTime() - Date.now()) / HOURS_MS
}

function expiryUrgencyBonus(hoursRemaining: number | null): number {
  if (hoursRemaining === null) return 0
  if (hoursRemaining < 2) return 5000
  if (hoursRemaining < 6) return 2000
  if (hoursRemaining < 24) return 500
  if (hoursRemaining < 72) return 100
  return 0
}

export function scoreActionUrgency(action: PendingApprovalSummary): ApprovalUrgencyScore {
  const hoursRemaining = hoursUntilExpiry(action.expiresAt)
  const riskWeight = RISK_WEIGHT[action.riskLevel ?? 'low'] ?? 1
  const expiryBonus = expiryUrgencyBonus(hoursRemaining)
  const urgencyScore = riskWeight + expiryBonus

  let urgencyLabel: 'urgent' | 'time_sensitive' | 'normal' | 'low'
  let reason: string

  if (hoursRemaining !== null && hoursRemaining < 6) {
    urgencyLabel = 'urgent'
    reason = `Expires in ${Math.max(0, Math.floor(hoursRemaining)).toString()}h`
  } else if (action.riskLevel === 'critical' || action.riskLevel === 'high') {
    urgencyLabel = 'urgent'
    reason = `High-risk action: ${action.riskLevel}`
  } else if (hoursRemaining !== null && hoursRemaining < 24) {
    urgencyLabel = 'time_sensitive'
    reason = `Expires in ${Math.floor(hoursRemaining).toString()}h`
  } else if (action.riskLevel === 'medium') {
    urgencyLabel = 'normal'
    reason = 'Medium-risk action'
  } else {
    urgencyLabel = 'low'
    reason = 'Standard review'
  }

  return { actionId: action.id, urgencyScore, urgencyLabel, hoursRemaining, reason }
}

export function sortByUrgency(actions: PendingApprovalSummary[]): PendingApprovalSummary[] {
  return [...actions].sort((a, b) => {
    const scoreA = scoreActionUrgency(a).urgencyScore
    const scoreB = scoreActionUrgency(b).urgencyScore
    return scoreB - scoreA
  })
}

export function groupActionsByType(
  actions: PendingApprovalSummary[],
): ApprovalGroup[] {
  const groupMap = new Map<string, PendingApprovalSummary[]>()
  for (const action of actions) {
    const existing = groupMap.get(action.actionType) ?? []
    existing.push(action)
    groupMap.set(action.actionType, existing)
  }

  const groups: ApprovalGroup[] = Array.from(groupMap.keys()).map((actionType: string) => {
    const items = groupMap.get(actionType) ?? []
    const urgencyScores = items.map((i: PendingApprovalSummary) => scoreActionUrgency(i).urgencyLabel)
    const maxUrgency: 'urgent' | 'time_sensitive' | 'normal' | 'low' =
      urgencyScores.includes('urgent') ? 'urgent' :
      urgencyScores.includes('time_sensitive') ? 'time_sensitive' :
      urgencyScores.includes('normal') ? 'normal' : 'low'

    const riskLevels = items
      .map((i: PendingApprovalSummary) => i.riskLevel)
      .filter((r: ApprovalRiskLevel | null): r is ApprovalRiskLevel => r !== null)
    const topRisk: ApprovalRiskLevel | null =
      riskLevels.includes('critical') ? 'critical' :
      riskLevels.includes('high') ? 'high' :
      riskLevels.includes('medium') ? 'medium' :
      riskLevels.includes('low') ? 'low' : null

    return {
      actionType,
      label: formatActionTypeLabel(actionType),
      riskLevel: topRisk,
      items: sortByUrgency(items),
      maxUrgency,
    }
  })

  return groups.sort((a, b) => {
    const urgencyOrder = { urgent: 0, time_sensitive: 1, normal: 2, low: 3 }
    return urgencyOrder[a.maxUrgency] - urgencyOrder[b.maxUrgency]
  })
}

export function getOverdueActions(actions: PendingApprovalSummary[]): PendingApprovalSummary[] {
  return actions.filter(a => {
    if (!a.expiresAt) return false
    return new Date(a.expiresAt).getTime() < Date.now()
  })
}

export function getActionsExpiringSoon(
  actions: PendingApprovalSummary[],
  withinHours = 24,
): PendingApprovalSummary[] {
  return actions.filter(a => {
    const h = hoursUntilExpiry(a.expiresAt)
    if (h === null) return false
    return h > 0 && h <= withinHours
  })
}

export function summarizeApprovalQueue(actions: PendingApprovalSummary[]): string {
  if (actions.length === 0) return 'Review queue is clear.'
  const overdue = getOverdueActions(actions).length
  const expiringSoon = getActionsExpiringSoon(actions, 24).length
  const parts: string[] = [`${actions.length.toString()} pending`]
  if (overdue > 0) parts.push(`${overdue.toString()} overdue`)
  if (expiringSoon > 0) parts.push(`${expiringSoon.toString()} expiring today`)
  return parts.join(' · ')
}

function formatActionTypeLabel(actionType: string): string {
  const labels: Record<string, string> = {
    move_player_group: 'Move Player to Group',
    create_placement_assessment: 'Placement Assessment',
    generate_parent_update: 'Parent Update',
    flag_player: 'Flag Player',
    modify_session: 'Modify Session',
    modify_template: 'Modify Template',
    create_session: 'Create Session',
    schedule_reassessment: 'Schedule Reassessment',
    assign_group: 'Assign Group',
    create_template: 'Create Template',
    create_player: 'Create Player',
    create_exercise: 'Create Exercise',
    cancel_session: 'Cancel Session',
    adjust_session_intensity: 'Adjust Intensity',
    other: 'Other Action',
  }
  return labels[actionType] ?? actionType
}
