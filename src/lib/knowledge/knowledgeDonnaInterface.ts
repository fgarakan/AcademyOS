// Sprint 535 — DONNA Knowledge Interface
// Defines how DONNA interacts with the knowledge library.
// DONNA can surface and organize knowledge items. DONNA cannot approve, promote, or publish.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeItem, KnowledgeDomain } from './knowledgeTypes'

export type DonnaKnowledgeAction =
  | 'surface_relevant_items'
  | 'suggest_tags'
  | 'identify_curriculum_candidates'
  | 'summarize_pending_review'
  | 'flag_duplicates'

export interface DonnaKnowledgeActionDef {
  action: DonnaKnowledgeAction
  label: string
  description: string
  canApprove: false
  canPromote: false
  canPublish: false
  requiresDirectorDecision: true
}

export const DONNA_KNOWLEDGE_ACTIONS: Record<DonnaKnowledgeAction, DonnaKnowledgeActionDef> = {
  surface_relevant_items: {
    action: 'surface_relevant_items',
    label: 'Surface relevant knowledge items',
    description: 'Show knowledge items relevant to the current context for director review.',
    canApprove: false,
    canPromote: false,
    canPublish: false,
    requiresDirectorDecision: true,
  },
  suggest_tags: {
    action: 'suggest_tags',
    label: 'Suggest tags for item',
    description: 'Suggest tags based on item content — director reviews before applying.',
    canApprove: false,
    canPromote: false,
    canPublish: false,
    requiresDirectorDecision: true,
  },
  identify_curriculum_candidates: {
    action: 'identify_curriculum_candidates',
    label: 'Identify curriculum promotion candidates',
    description: 'Surface items that may be suitable for curriculum promotion — director decides.',
    canApprove: false,
    canPromote: false,
    canPublish: false,
    requiresDirectorDecision: true,
  },
  summarize_pending_review: {
    action: 'summarize_pending_review',
    label: 'Summarize pending review queue',
    description: 'Give director an overview of what is in the review queue.',
    canApprove: false,
    canPromote: false,
    canPublish: false,
    requiresDirectorDecision: true,
  },
  flag_duplicates: {
    action: 'flag_duplicates',
    label: 'Flag potential duplicates',
    description: 'Identify items that may overlap with existing knowledge or curriculum.',
    canApprove: false,
    canPromote: false,
    canPublish: false,
    requiresDirectorDecision: true,
  },
}

export interface DonnaKnowledgeContextView {
  pendingReviewCount: number
  recentSubmissions: KnowledgeItem[]
  curriculumCandidates: KnowledgeItem[]
  availableActions: DonnaKnowledgeActionDef[]
  canApprove: false
  canPromote: false
  canPublish: false
  requiresDirectorDecision: true
  contextSummary: string
}

export function buildDonnaKnowledgeContextView(
  allItems: KnowledgeItem[],
  recentDays = 7,
): DonnaKnowledgeContextView {
  const pendingItems = allItems.filter(i => i.status === 'pending_review')
  const pendingReviewCount = pendingItems.length

  const cutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000).toISOString()
  const recentSubmissions = allItems.filter(
    i => i.status === 'pending_review' && i.submittedAt >= cutoff,
  )

  const curriculumCandidates = pendingItems.filter(i => {
    const curriculumRelevantDomains: KnowledgeDomain[] = [
      'technical', 'tactical', 'physical', 'mental', 'competition',
      'coaching_methodology', 'player_development',
    ]
    return curriculumRelevantDomains.includes(i.domain)
  })

  const summaryParts: string[] = []
  if (pendingReviewCount > 0) summaryParts.push(`${pendingReviewCount} item${pendingReviewCount > 1 ? 's' : ''} pending your review`)
  if (recentSubmissions.length > 0) summaryParts.push(`${recentSubmissions.length} submitted in the last ${recentDays} days`)
  if (curriculumCandidates.length > 0) summaryParts.push(`${curriculumCandidates.length} potential curriculum candidates`)
  const contextSummary = summaryParts.length > 0 ? summaryParts.join(' · ') : 'Knowledge library is up to date.'

  return {
    pendingReviewCount,
    recentSubmissions,
    curriculumCandidates,
    availableActions: Object.values(DONNA_KNOWLEDGE_ACTIONS),
    canApprove: false,
    canPromote: false,
    canPublish: false,
    requiresDirectorDecision: true,
    contextSummary,
  }
}

export function getDonnaKnowledgeActionDef(action: DonnaKnowledgeAction): DonnaKnowledgeActionDef {
  return DONNA_KNOWLEDGE_ACTIONS[action]
}
