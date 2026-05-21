// Sprint 472 — Director Attention Queue V1
// Builds a prioritized list of items needing the director's attention today.
// Pure TypeScript — accepts pre-fetched data, no DB calls.
// Sources: pending approvals, expiring actions, high alerts, at-risk players, curriculum gaps.

export type AttentionSource =
  | 'pending_approval'
  | 'expiring_action'
  | 'high_alert'
  | 'at_risk_player'
  | 'curriculum_gap'
  | 'over_capacity_group'
  | 'no_session_coverage'

export type AttentionPriority = 'critical' | 'high' | 'medium' | 'low'

export interface AttentionItem {
  id: string
  source: AttentionSource
  priority: AttentionPriority
  label: string
  description: string
  href: string
  expiresAt: string | null
  entityId: string | null
  entityLabel: string | null
}

export interface AttentionQueueInput {
  pendingApprovals: Array<{
    id: string
    actionLabel: string
    riskLevel: string | null
    expiresAt: string | null
    entityLabel?: string | null
  }>
  highAlerts: Array<{
    signalId: string | null
    playerId: string | null
    playerName: string | null
    title: string | null
    severity: string | null
  }>
  overCapacityGroups: Array<{
    id: string
    name: string
    memberCount: number
    maxPlayers: number | null
  }>
  curriculumGapCount: number
  noCoverageGroupCount: number
}

export interface AttentionQueue {
  items: AttentionItem[]
  criticalCount: number
  highCount: number
  totalCount: number
  isEmpty: boolean
}

const HOURS_MS = 1000 * 60 * 60

function hoursUntil(isoString: string): number {
  return (new Date(isoString).getTime() - Date.now()) / HOURS_MS
}

function riskToPriority(riskLevel: string | null): AttentionPriority {
  if (riskLevel === 'critical') return 'critical'
  if (riskLevel === 'high') return 'high'
  if (riskLevel === 'medium') return 'medium'
  return 'low'
}

function severityToPriority(severity: string | null): AttentionPriority {
  if (severity === 'critical') return 'critical'
  if (severity === 'high') return 'high'
  return 'medium'
}

const PRIORITY_ORDER: Record<AttentionPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export function buildAttentionQueue(input: AttentionQueueInput): AttentionQueue {
  const items: AttentionItem[] = []

  // Pending approvals
  for (const action of input.pendingApprovals) {
    const expiresAt = action.expiresAt ?? null
    const isExpiringSoon = expiresAt !== null && hoursUntil(expiresAt) < 24
    const basePriority = riskToPriority(action.riskLevel)
    const priority: AttentionPriority =
      isExpiringSoon && basePriority === 'low' ? 'medium' : basePriority

    items.push({
      id: `approval_${action.id}`,
      source: isExpiringSoon ? 'expiring_action' : 'pending_approval',
      priority,
      label: action.actionLabel,
      description: isExpiringSoon
        ? `Expires in ${Math.max(0, Math.floor(hoursUntil(expiresAt!))).toString()}h — review now`
        : 'Awaiting director approval',
      href: '/director/review',
      expiresAt,
      entityId: action.id,
      entityLabel: action.entityLabel ?? null,
    })
  }

  // High alerts
  for (const alert of input.highAlerts) {
    items.push({
      id: `alert_${alert.signalId ?? alert.playerId ?? Math.random().toString()}`,
      source: 'high_alert',
      priority: severityToPriority(alert.severity),
      label: alert.title ?? 'Player alert',
      description: alert.playerName ? `${alert.playerName} needs attention` : 'Review player signal',
      href: alert.playerId ? `/director/players/${alert.playerId}` : '/director/players',
      expiresAt: null,
      entityId: alert.playerId ?? null,
      entityLabel: alert.playerName ?? null,
    })
  }

  // Over-capacity groups
  for (const group of input.overCapacityGroups) {
    items.push({
      id: `capacity_${group.id}`,
      source: 'over_capacity_group',
      priority: 'medium',
      label: `${group.name} is over capacity`,
      description: `${group.memberCount.toString()} players (max ${(group.maxPlayers ?? 0).toString()}) — reassign or expand`,
      href: '/director/groups',
      expiresAt: null,
      entityId: group.id,
      entityLabel: group.name,
    })
  }

  // Curriculum gaps
  if (input.curriculumGapCount > 0) {
    items.push({
      id: 'curriculum_gaps',
      source: 'curriculum_gap',
      priority: 'low',
      label: `${input.curriculumGapCount.toString()} curriculum gap${input.curriculumGapCount > 1 ? 's' : ''} detected`,
      description: 'Groups are missing required curriculum coverage this week',
      href: '/director/curriculum',
      expiresAt: null,
      entityId: null,
      entityLabel: null,
    })
  }

  // No-coverage groups
  if (input.noCoverageGroupCount > 0) {
    items.push({
      id: 'no_session_coverage',
      source: 'no_session_coverage',
      priority: 'medium',
      label: `${input.noCoverageGroupCount.toString()} group${input.noCoverageGroupCount > 1 ? 's' : ''} without sessions this week`,
      description: 'No planned sessions found — review template assignment',
      href: '/director/sessions',
      expiresAt: null,
      entityId: null,
      entityLabel: null,
    })
  }

  const sorted = items.sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  )

  const criticalCount = sorted.filter(i => i.priority === 'critical').length
  const highCount = sorted.filter(i => i.priority === 'high').length

  return {
    items: sorted,
    criticalCount,
    highCount,
    totalCount: sorted.length,
    isEmpty: sorted.length === 0,
  }
}

export function groupAttentionByPriority(
  queue: AttentionQueue,
): Record<AttentionPriority, AttentionItem[]> {
  return {
    critical: queue.items.filter(i => i.priority === 'critical'),
    high: queue.items.filter(i => i.priority === 'high'),
    medium: queue.items.filter(i => i.priority === 'medium'),
    low: queue.items.filter(i => i.priority === 'low'),
  }
}

export function getExpiringActions(queue: AttentionQueue, withinHours = 24): AttentionItem[] {
  return queue.items.filter(i => {
    if (i.source !== 'expiring_action') return false
    if (!i.expiresAt) return false
    return hoursUntil(i.expiresAt) <= withinHours
  })
}

export function summarizeAttentionQueue(queue: AttentionQueue): string {
  if (queue.isEmpty) return 'No items need attention right now.'
  const parts: string[] = []
  if (queue.criticalCount > 0) parts.push(`${queue.criticalCount.toString()} critical`)
  if (queue.highCount > 0) parts.push(`${queue.highCount.toString()} high-priority`)
  const remaining = queue.totalCount - queue.criticalCount - queue.highCount
  if (remaining > 0) parts.push(`${remaining.toString()} other`)
  return `${parts.join(', ')} item${queue.totalCount > 1 ? 's' : ''} need${queue.totalCount === 1 ? 's' : ''} attention.`
}
