// Sprint 548 — Knowledge Answerability Model
// Defines whether and how knowledge can be used to answer questions from different roles.
// DOCTRINE: Knowledge Library items are NEVER directly parent/player-answerable.
// Knowledge must be promoted → curriculum → learning module (player) or parent guidance (parent).
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeItem } from './knowledgeTypes'

export type AnswerabilityRole = 'director' | 'coach' | 'head_coach' | 'parent' | 'player'

export type AnswerabilityStatus =
  | 'answerable_directly'
  | 'answerable_after_approval'
  | 'not_answerable'
  | 'blocked'

export interface AnswerabilityCheck {
  itemId: string
  role: AnswerabilityRole
  status: AnswerabilityStatus
  reason: string
  promotionPathRequired: string | null
  isParentAnswerable: false
  isPlayerAnswerable: false
}

export interface AnswerabilityReport {
  itemId: string
  checks: Record<AnswerabilityRole, AnswerabilityCheck>
  summary: string
  hasAnyDirectAnswerability: boolean
  requiresApprovalForAll: true
}

export function checkAnswerability(
  item: KnowledgeItem,
  role: AnswerabilityRole,
): AnswerabilityCheck {
  if (role === 'parent') {
    return {
      itemId: item.itemId,
      role,
      status: 'blocked',
      reason: 'Knowledge Library items are never directly answerable to parents. Content must be approved as parent guidance attached to a curriculum level.',
      promotionPathRequired: 'Knowledge → approved_general → promoted_to_curriculum → parent guidance approval → curriculum level → parent portal',
      isParentAnswerable: false,
      isPlayerAnswerable: false,
    }
  }

  if (role === 'player') {
    return {
      itemId: item.itemId,
      role,
      status: 'blocked',
      reason: 'Knowledge Library items are never directly answerable to players. Content must be approved as a learning module attached to a curriculum level.',
      promotionPathRequired: 'Knowledge → approved_general → promoted_to_curriculum → learning module approval → curriculum level → player portal',
      isParentAnswerable: false,
      isPlayerAnswerable: false,
    }
  }

  if (item.status === 'pending_review' || item.status === 'rejected') {
    return {
      itemId: item.itemId,
      role,
      status: 'not_answerable',
      reason: `Item status is "${item.status}" — not yet available to ${role}.`,
      promotionPathRequired: null,
      isParentAnswerable: false,
      isPlayerAnswerable: false,
    }
  }

  if (role === 'coach' && item.accessLevel === 'director_only') {
    return {
      itemId: item.itemId,
      role,
      status: 'not_answerable',
      reason: 'This item is director-only and not accessible to coaches.',
      promotionPathRequired: null,
      isParentAnswerable: false,
      isPlayerAnswerable: false,
    }
  }

  return {
    itemId: item.itemId,
    role,
    status: 'answerable_directly',
    reason: `${role.charAt(0).toUpperCase() + role.slice(1)} can reference this approved knowledge item.`,
    promotionPathRequired: null,
    isParentAnswerable: false,
    isPlayerAnswerable: false,
  }
}

export function buildAnswerabilityReport(item: KnowledgeItem): AnswerabilityReport {
  const roles: AnswerabilityRole[] = ['director', 'head_coach', 'coach', 'parent', 'player']
  const checks: Record<AnswerabilityRole, AnswerabilityCheck> = {
    director: checkAnswerability(item, 'director'),
    head_coach: checkAnswerability(item, 'head_coach'),
    coach: checkAnswerability(item, 'coach'),
    parent: checkAnswerability(item, 'parent'),
    player: checkAnswerability(item, 'player'),
  }

  const directAnswerable = roles.filter(r => checks[r].status === 'answerable_directly')
  const hasAnyDirectAnswerability = directAnswerable.length > 0

  const summaryParts: string[] = []
  if (directAnswerable.length > 0) {
    summaryParts.push(`Directly accessible to: ${directAnswerable.join(', ')}`)
  }
  summaryParts.push('Blocked for parent and player — promotion path required.')

  return {
    itemId: item.itemId,
    checks,
    summary: summaryParts.join('. '),
    hasAnyDirectAnswerability,
    requiresApprovalForAll: true,
  }
}

export function getAnswerabilityStatusLabel(status: AnswerabilityStatus): string {
  const labels: Record<AnswerabilityStatus, string> = {
    answerable_directly: 'Accessible',
    answerable_after_approval: 'Accessible after approval',
    not_answerable: 'Not accessible',
    blocked: 'Blocked',
  }
  return labels[status]
}
