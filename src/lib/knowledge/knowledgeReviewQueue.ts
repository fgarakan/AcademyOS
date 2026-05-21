// Sprint 530 — Knowledge Review Queue
// Queue of knowledge items waiting for platform owner or director review.
// All decisions require human approval — no auto-promotion, no auto-rejection.
// DONNA can surface items but cannot make decisions.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeItem, KnowledgeReviewDecision } from './knowledgeTypes'

export type ReviewQueueSortOrder = 'newest' | 'oldest' | 'by_domain' | 'by_source'

export interface ReviewQueueItem {
  item: KnowledgeItem
  daysInQueue: number
  isUrgent: boolean
  suggestedDecision: 'approve_general' | 'promote_to_curriculum' | null
  suggestedDecisionReason: string | null
  canPromoteToCurriculum: boolean
  availableActions: ReviewAction[]
}

export interface ReviewAction {
  action: 'approve_general' | 'promote_to_curriculum' | 'reject' | 'defer'
  label: string
  description: string
  requiresDirectorApproval: true
  neverAutoApply: true
}

export const REVIEW_ACTIONS: ReviewAction[] = [
  {
    action: 'approve_general',
    label: 'Approve as general knowledge',
    description: 'Add to knowledge library. Available to directors and coaches. Not promoted to curriculum.',
    requiresDirectorApproval: true,
    neverAutoApply: true,
  },
  {
    action: 'promote_to_curriculum',
    label: 'Promote to curriculum draft',
    description: 'Create a curriculum draft proposal for director review. Requires separate curriculum approval.',
    requiresDirectorApproval: true,
    neverAutoApply: true,
  },
  {
    action: 'reject',
    label: 'Reject',
    description: 'Remove from review queue. Item is not added to library or curriculum.',
    requiresDirectorApproval: true,
    neverAutoApply: true,
  },
  {
    action: 'defer',
    label: 'Defer',
    description: 'Return to queue for later review.',
    requiresDirectorApproval: true,
    neverAutoApply: true,
  },
]

export interface KnowledgeReviewQueueView {
  items: ReviewQueueItem[]
  totalCount: number
  urgentCount: number
  oldestItemDays: number | null
  requiresDirectorApproval: true
  neverAutoApply: true
}

function computeDaysInQueue(submittedAt: string): number {
  const submitted = new Date(submittedAt).getTime()
  const now = Date.now()
  return Math.floor((now - submitted) / (1000 * 60 * 60 * 24))
}

function inferSuggestedDecision(item: KnowledgeItem): {
  decision: 'approve_general' | 'promote_to_curriculum' | null
  reason: string | null
} {
  if (item.sourceType === 'itf_guideline' || item.sourceType === 'usta_resource') {
    return {
      decision: 'promote_to_curriculum',
      reason: 'Official governing body guideline — likely relevant to curriculum.',
    }
  }
  if (item.sourceType === 'research_paper') {
    return {
      decision: 'approve_general',
      reason: 'Research content — approve as general knowledge for coaches to reference.',
    }
  }
  return { decision: null, reason: null }
}

export function buildReviewQueueItem(item: KnowledgeItem): ReviewQueueItem {
  const daysInQueue = computeDaysInQueue(item.submittedAt)
  const isUrgent = daysInQueue > 14
  const { decision: suggestedDecision, reason: suggestedDecisionReason } = inferSuggestedDecision(item)
  const canPromoteToCurriculum =
    item.domain !== 'nutrition' && item.domain !== 'parent_education'

  return {
    item,
    daysInQueue,
    isUrgent,
    suggestedDecision,
    suggestedDecisionReason,
    canPromoteToCurriculum,
    availableActions: canPromoteToCurriculum
      ? REVIEW_ACTIONS
      : REVIEW_ACTIONS.filter(a => a.action !== 'promote_to_curriculum'),
  }
}

export function buildKnowledgeReviewQueueView(
  items: KnowledgeItem[],
  sortOrder: ReviewQueueSortOrder = 'newest',
): KnowledgeReviewQueueView {
  const pendingItems = items.filter(i => i.status === 'pending_review')

  const queueItems = pendingItems.map(buildReviewQueueItem)

  let sorted: ReviewQueueItem[]
  if (sortOrder === 'oldest') {
    sorted = [...queueItems].sort((a, b) => b.daysInQueue - a.daysInQueue)
  } else if (sortOrder === 'by_domain') {
    sorted = [...queueItems].sort((a, b) => a.item.domain.localeCompare(b.item.domain))
  } else if (sortOrder === 'by_source') {
    sorted = [...queueItems].sort((a, b) => a.item.sourceType.localeCompare(b.item.sourceType))
  } else {
    sorted = [...queueItems].sort((a, b) => a.daysInQueue - b.daysInQueue)
  }

  const urgentCount = sorted.filter(i => i.isUrgent).length
  const oldestItemDays = queueItems.length > 0
    ? Math.max(...queueItems.map(i => i.daysInQueue))
    : null

  return {
    items: sorted,
    totalCount: sorted.length,
    urgentCount,
    oldestItemDays,
    requiresDirectorApproval: true,
    neverAutoApply: true,
  }
}

export function buildKnowledgeReviewDecision(
  itemId: string,
  action: 'approve_general' | 'promote_to_curriculum' | 'reject' | 'defer',
  reviewerRole: 'platform_owner' | 'academy_director',
  reviewNotes: string | null,
  decidedBy: string,
  targetCurriculumLevelIds: string[] = [],
): KnowledgeReviewDecision {
  return {
    itemId,
    decision: action,
    reviewerRole,
    reviewNotes,
    targetCurriculumLevelIds,
    requiresDirectorApproval: true,
    neverAutoApply: true,
    decidedAt: new Date().toISOString(),
    decidedBy,
  }
}
