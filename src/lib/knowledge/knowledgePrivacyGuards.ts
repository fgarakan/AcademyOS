// Sprint 534 — Knowledge Privacy Guards
// Enforces that knowledge library content never reaches parent or player views
// without explicit approval and correct visibility gating.
// Knowledge items are NEVER auto-answerable to parents or players.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeItem } from './knowledgeTypes'

export type KnowledgeConsumerRole = 'platform_owner' | 'academy_director' | 'head_coach' | 'coach' | 'parent' | 'player'

export interface KnowledgeVisibilityCheck {
  itemId: string
  role: KnowledgeConsumerRole
  isAllowed: boolean
  reason: string
  requiredApprovals: string[]
}

export interface KnowledgePrivacyAuditResult {
  itemId: string
  hasPrivacyViolation: boolean
  violations: string[]
  safeToDisplay: boolean
}

const PARENT_ACCESSIBLE_STATUSES: never[] = []
const PLAYER_ACCESSIBLE_STATUSES: never[] = []

export function checkKnowledgeVisibility(
  item: KnowledgeItem,
  role: KnowledgeConsumerRole,
): KnowledgeVisibilityCheck {
  if (role === 'parent') {
    return {
      itemId: item.itemId,
      role,
      isAllowed: false,
      reason: 'Knowledge library items are never directly accessible to parents. Content must be approved as parent guidance and attached to a curriculum level.',
      requiredApprovals: ['director_approval', 'parent_guidance_approval'],
    }
  }

  if (role === 'player') {
    return {
      itemId: item.itemId,
      role,
      isAllowed: false,
      reason: 'Knowledge library items are never directly accessible to players. Content must be approved as a learning module and attached to a curriculum level.',
      requiredApprovals: ['director_approval', 'learning_module_approval'],
    }
  }

  if (role === 'coach') {
    if (item.status === 'approved_general' || item.status === 'promoted_to_curriculum') {
      return {
        itemId: item.itemId,
        role,
        isAllowed: true,
        reason: 'Approved knowledge item — accessible to coaches.',
        requiredApprovals: [],
      }
    }
    return {
      itemId: item.itemId,
      role,
      isAllowed: false,
      reason: `Item status is "${item.status}" — coaches can only access approved_general or promoted items.`,
      requiredApprovals: ['platform_owner_or_director_approval'],
    }
  }

  if (role === 'head_coach') {
    if (item.status === 'approved_general' || item.status === 'promoted_to_curriculum') {
      return {
        itemId: item.itemId,
        role,
        isAllowed: true,
        reason: 'Approved knowledge item — accessible to head coaches.',
        requiredApprovals: [],
      }
    }
    return {
      itemId: item.itemId,
      role,
      isAllowed: false,
      reason: 'Item not yet approved.',
      requiredApprovals: ['platform_owner_or_director_approval'],
    }
  }

  if (role === 'academy_director') {
    if (item.status !== 'rejected') {
      return {
        itemId: item.itemId,
        role,
        isAllowed: true,
        reason: 'Directors can view all non-rejected knowledge items.',
        requiredApprovals: [],
      }
    }
    return {
      itemId: item.itemId,
      role,
      isAllowed: false,
      reason: 'Rejected items are not displayed.',
      requiredApprovals: [],
    }
  }

  return {
    itemId: item.itemId,
    role,
    isAllowed: true,
    reason: 'Platform owner has full access.',
    requiredApprovals: [],
  }
}

export function auditKnowledgeItemPrivacy(item: KnowledgeItem): KnowledgePrivacyAuditResult {
  const violations: string[] = []

  if (item.isParentAnswerable !== false) {
    violations.push('VIOLATION: isParentAnswerable must be false. Knowledge items are never parent-answerable.')
  }

  if (item.isPlayerAnswerable !== false) {
    violations.push('VIOLATION: isPlayerAnswerable must be false. Knowledge items are never player-answerable.')
  }

  if (item.accessLevel === 'public' && item.status === 'pending_review') {
    violations.push('WARNING: Item is marked public but still pending review.')
  }

  return {
    itemId: item.itemId,
    hasPrivacyViolation: violations.some(v => v.startsWith('VIOLATION')),
    violations,
    safeToDisplay: violations.filter(v => v.startsWith('VIOLATION')).length === 0,
  }
}

export function filterItemsForRole(
  items: KnowledgeItem[],
  role: KnowledgeConsumerRole,
): KnowledgeItem[] {
  if (role === 'parent' || role === 'player') return []

  return items.filter(item => {
    const check = checkKnowledgeVisibility(item, role)
    return check.isAllowed
  })
}

void PARENT_ACCESSIBLE_STATUSES
void PLAYER_ACCESSIBLE_STATUSES
