// Sprint 531 — Knowledge → Curriculum Promotion Path
// Handles the promotion of knowledge library items to curriculum drafts.
// DOCTRINE: Knowledge → Curriculum draft → Director approval → Curriculum record.
// External knowledge NEVER auto-becomes curriculum or parent/player-answerable.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeItem } from './knowledgeTypes'
import type { CurriculumDomain } from '@/lib/curriculum/inbox'

export interface KnowledgeCurriculumPromotionInput {
  knowledgeItemId: string
  targetLevelIds: string[]
  targetDomain: CurriculumDomain
  proposedTitle: string
  proposedSummary: string
  proposedCoachLanguage: string | null
  isParentVisible: false
  isPlayerVisible: false
  promotedBy: string
  promotedByRole: 'platform_owner' | 'academy_director'
}

export interface KnowledgeCurriculumPromotionDraft {
  draftId: string
  knowledgeItemId: string
  sourceTitle: string
  sourceDomain: string
  targetLevelIds: string[]
  targetDomain: CurriculumDomain
  proposedTitle: string
  proposedSummary: string
  proposedCoachLanguage: string | null
  status: 'draft' | 'submitted_for_approval' | 'approved' | 'rejected'
  requiresDirectorApproval: true
  neverAutoApply: true
  isParentVisible: false
  isPlayerVisible: false
  createdAt: string
  createdBy: string
  approvedAt: string | null
  approvedBy: string | null
}

export function buildKnowledgeCurriculumPromotionDraft(
  item: KnowledgeItem,
  input: KnowledgeCurriculumPromotionInput,
): KnowledgeCurriculumPromotionDraft {
  const draftId = `kcp_${item.itemId}_${Date.now()}`
  return {
    draftId,
    knowledgeItemId: item.itemId,
    sourceTitle: item.title,
    sourceDomain: item.domain,
    targetLevelIds: input.targetLevelIds,
    targetDomain: input.targetDomain,
    proposedTitle: input.proposedTitle,
    proposedSummary: input.proposedSummary,
    proposedCoachLanguage: input.proposedCoachLanguage,
    status: 'draft',
    requiresDirectorApproval: true,
    neverAutoApply: true,
    isParentVisible: false,
    isPlayerVisible: false,
    createdAt: new Date().toISOString(),
    createdBy: input.promotedBy,
    approvedAt: null,
    approvedBy: null,
  }
}

export interface PromotionValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validatePromotionDraft(
  draft: KnowledgeCurriculumPromotionDraft,
): PromotionValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (draft.targetLevelIds.length === 0) {
    errors.push('At least one target curriculum level must be selected.')
  }

  if (draft.proposedTitle.trim().length < 5) {
    errors.push('Proposed title must be at least 5 characters.')
  }

  if (draft.proposedSummary.trim().length < 20) {
    errors.push('Proposed summary must be at least 20 characters.')
  }

  if (draft.targetLevelIds.length > 5) {
    warnings.push('Promoting to more than 5 levels — consider whether this content is genuinely applicable across all of them.')
  }

  if (!draft.requiresDirectorApproval) {
    errors.push('SYSTEM: requiresDirectorApproval must be true. This is a safety violation.')
  }

  if (!draft.neverAutoApply) {
    errors.push('SYSTEM: neverAutoApply must be true. This is a safety violation.')
  }

  return { isValid: errors.length === 0, errors, warnings }
}

export function getPromotionStatusLabel(status: KnowledgeCurriculumPromotionDraft['status']): string {
  const labels: Record<KnowledgeCurriculumPromotionDraft['status'], string> = {
    draft: 'Draft',
    submitted_for_approval: 'Submitted for approval',
    approved: 'Approved',
    rejected: 'Rejected',
  }
  return labels[status]
}

export function getPromotionPathSummary(draft: KnowledgeCurriculumPromotionDraft): string {
  return `"${draft.proposedTitle}" → ${draft.targetLevelIds.length} level${draft.targetLevelIds.length > 1 ? 's' : ''} — requires director approval before becoming curriculum.`
}
