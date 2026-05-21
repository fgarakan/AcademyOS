// Sprint 544 — Knowledge → Curriculum Bridge
// The bridge between the Knowledge Library and the Curriculum system.
// Exposes the typed API that allows surfacing of knowledge items to curriculum views
// and creating promotion drafts — while enforcing that no auto-application happens.
// This is the final gate: knowledge only enters curriculum with director approval.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeItem } from './knowledgeTypes'
import type { CurriculumDomain } from '@/lib/curriculum/inbox'
import { buildKnowledgeCurriculumPromotionDraft, validatePromotionDraft } from './knowledgeCurriculumPromotion'

export interface KnowledgeCurriculumBridgeResult {
  success: boolean
  draftId: string | null
  errors: string[]
  warnings: string[]
  requiresDirectorApproval: true
  neverAutoApply: true
  promotionPath: string
}

export function bridgeKnowledgeToCurriculumDraft(
  item: KnowledgeItem,
  targetLevelIds: string[],
  targetDomain: CurriculumDomain,
  proposedTitle: string,
  proposedSummary: string,
  proposedCoachLanguage: string | null,
  promotedBy: string,
  promotedByRole: 'platform_owner' | 'academy_director',
): KnowledgeCurriculumBridgeResult {
  if (item.status !== 'approved_general' && item.status !== 'promoted_to_curriculum') {
    return {
      success: false,
      draftId: null,
      errors: [`Cannot promote item with status "${item.status}". Item must be approved_general first.`],
      warnings: [],
      requiresDirectorApproval: true,
      neverAutoApply: true,
      promotionPath: 'Item not eligible for promotion.',
    }
  }

  const draft = buildKnowledgeCurriculumPromotionDraft(item, {
    knowledgeItemId: item.itemId,
    targetLevelIds,
    targetDomain,
    proposedTitle,
    proposedSummary,
    proposedCoachLanguage,
    isParentVisible: false,
    isPlayerVisible: false,
    promotedBy,
    promotedByRole,
  })

  const validation = validatePromotionDraft(draft)

  if (!validation.isValid) {
    return {
      success: false,
      draftId: null,
      errors: validation.errors,
      warnings: validation.warnings,
      requiresDirectorApproval: true,
      neverAutoApply: true,
      promotionPath: 'Validation failed — draft not created.',
    }
  }

  const promotionPath = `"${item.title}" → curriculum draft "${proposedTitle}" → ${targetLevelIds.length} level${targetLevelIds.length > 1 ? 's' : ''} → director approval required`

  return {
    success: true,
    draftId: draft.draftId,
    errors: [],
    warnings: validation.warnings,
    requiresDirectorApproval: true,
    neverAutoApply: true,
    promotionPath,
  }
}

export interface KnowledgeCurriculumLevelContext {
  levelId: string
  levelName: string
  relevantItems: KnowledgeItem[]
  pendingPromotions: number
  approvedPromotions: number
}

export function buildKnowledgeCurriculumLevelContext(
  levelId: string,
  levelName: string,
  allItems: KnowledgeItem[],
): KnowledgeCurriculumLevelContext {
  const relevantItems = allItems.filter(
    item =>
      item.status === 'approved_general' &&
      (item.promotedCurriculumLevelIds.includes(levelId) ||
       item.promotedCurriculumLevelIds.length === 0),
  ).slice(0, 10)

  const pendingPromotions = allItems.filter(
    item => item.status === 'pending_review' && item.promotedCurriculumLevelIds.includes(levelId),
  ).length

  const approvedPromotions = allItems.filter(
    item => item.status === 'promoted_to_curriculum' && item.promotedCurriculumLevelIds.includes(levelId),
  ).length

  return { levelId, levelName, relevantItems, pendingPromotions, approvedPromotions }
}

export function getKnowledgeBridgeSummary(levelId: string, items: KnowledgeItem[]): string {
  const approved = items.filter(i => i.status === 'approved_general' && i.promotedCurriculumLevelIds.includes(levelId)).length
  const promoted = items.filter(i => i.status === 'promoted_to_curriculum' && i.promotedCurriculumLevelIds.includes(levelId)).length
  const pending = items.filter(i => i.status === 'pending_review' && i.promotedCurriculumLevelIds.includes(levelId)).length

  if (approved === 0 && promoted === 0 && pending === 0) return 'No knowledge items linked to this level.'
  const parts: string[] = []
  if (approved > 0) parts.push(`${approved} approved item${approved > 1 ? 's' : ''}`)
  if (promoted > 0) parts.push(`${promoted} promoted to curriculum`)
  if (pending > 0) parts.push(`${pending} pending review`)
  return parts.join(' · ')
}
