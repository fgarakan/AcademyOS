// Sprint 537 — Knowledge Audit Log
// Typed model for recording all decisions made on knowledge library items.
// All decisions are logged — no silent mutations.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeStatus } from './knowledgeTypes'

export type KnowledgeAuditEventType =
  | 'submitted'
  | 'reviewed'
  | 'approved_general'
  | 'promoted_to_curriculum'
  | 'rejected'
  | 'deferred'
  | 'tags_updated'
  | 'curriculum_draft_created'
  | 'curriculum_draft_approved'
  | 'curriculum_draft_rejected'
  | 'visibility_changed'

export interface KnowledgeAuditEvent {
  eventId: string
  itemId: string
  eventType: KnowledgeAuditEventType
  previousStatus: KnowledgeStatus | null
  newStatus: KnowledgeStatus | null
  performedBy: string
  performedByRole: 'platform_owner' | 'academy_director' | 'head_coach' | 'coach' | 'system'
  notes: string | null
  metadata: Record<string, string>
  occurredAt: string
}

export interface KnowledgeAuditLog {
  itemId: string
  events: KnowledgeAuditEvent[]
  currentStatus: KnowledgeStatus
  statusHistory: Array<{ status: KnowledgeStatus; changedAt: string; changedBy: string }>
  lastEventAt: string | null
  decisionCount: number
}

export function buildKnowledgeAuditLog(
  itemId: string,
  currentStatus: KnowledgeStatus,
  events: KnowledgeAuditEvent[],
): KnowledgeAuditLog {
  const itemEvents = events.filter(e => e.itemId === itemId).sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  )

  const statusHistory = itemEvents
    .filter(e => e.newStatus !== null)
    .map(e => ({
      status: e.newStatus as KnowledgeStatus,
      changedAt: e.occurredAt,
      changedBy: e.performedBy,
    }))

  const decisionEvents: KnowledgeAuditEventType[] = [
    'approved_general', 'promoted_to_curriculum', 'rejected', 'deferred',
    'curriculum_draft_approved', 'curriculum_draft_rejected',
  ]
  const decisionCount = itemEvents.filter(e => decisionEvents.includes(e.eventType)).length

  const lastEventAt = itemEvents.length > 0
    ? itemEvents[itemEvents.length - 1].occurredAt
    : null

  return {
    itemId,
    events: itemEvents,
    currentStatus,
    statusHistory,
    lastEventAt,
    decisionCount,
  }
}

export function createKnowledgeAuditEvent(
  itemId: string,
  eventType: KnowledgeAuditEventType,
  performedBy: string,
  performedByRole: KnowledgeAuditEvent['performedByRole'],
  previousStatus: KnowledgeStatus | null,
  newStatus: KnowledgeStatus | null,
  notes: string | null = null,
  metadata: Record<string, string> = {},
): KnowledgeAuditEvent {
  return {
    eventId: `kae_${itemId}_${Date.now()}`,
    itemId,
    eventType,
    previousStatus,
    newStatus,
    performedBy,
    performedByRole,
    notes,
    metadata,
    occurredAt: new Date().toISOString(),
  }
}

export function getAuditEventsByType(
  events: KnowledgeAuditEvent[],
  eventType: KnowledgeAuditEventType,
): KnowledgeAuditEvent[] {
  return events.filter(e => e.eventType === eventType)
}

export function getAuditEventLabel(eventType: KnowledgeAuditEventType): string {
  const labels: Record<KnowledgeAuditEventType, string> = {
    submitted: 'Submitted',
    reviewed: 'Reviewed',
    approved_general: 'Approved as general knowledge',
    promoted_to_curriculum: 'Promoted to curriculum draft',
    rejected: 'Rejected',
    deferred: 'Deferred',
    tags_updated: 'Tags updated',
    curriculum_draft_created: 'Curriculum draft created',
    curriculum_draft_approved: 'Curriculum draft approved',
    curriculum_draft_rejected: 'Curriculum draft rejected',
    visibility_changed: 'Visibility changed',
  }
  return labels[eventType]
}
