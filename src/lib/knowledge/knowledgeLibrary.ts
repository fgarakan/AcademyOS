// Sprint 529 — Knowledge Library View Model
// View model helpers for the Global Knowledge Library browser.
// All items require platform owner or director review before use.
// Items are NEVER auto-answerable to parent/player.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type {
  KnowledgeItem,
  KnowledgeDomain,
  KnowledgeSourceType,
  KnowledgeStatus,
  KnowledgeAccessLevel,
  KnowledgeLibrarySummary,
} from './knowledgeTypes'

export interface KnowledgeLibraryFilters {
  domain: KnowledgeDomain | null
  status: KnowledgeStatus | null
  sourceType: KnowledgeSourceType | null
  accessLevel: KnowledgeAccessLevel | null
  searchQuery: string | null
  academyId: string | null
}

export interface KnowledgeLibraryView {
  items: KnowledgeItem[]
  totalItems: number
  filters: KnowledgeLibraryFilters
  summary: KnowledgeLibrarySummary
  hasPendingReview: boolean
  pendingReviewCount: number
}

export function buildKnowledgeLibrarySummary(items: KnowledgeItem[]): KnowledgeLibrarySummary {
  const byDomain: Record<KnowledgeDomain, number> = {
    technical: 0, tactical: 0, physical: 0, mental: 0, competition: 0,
    nutrition: 0, recovery: 0, coaching_methodology: 0, player_development: 0,
    parent_education: 0, sports_science: 0,
  }
  const bySourceType: Record<KnowledgeSourceType, number> = {
    research_paper: 0, coaching_manual: 0, itf_guideline: 0, usta_resource: 0,
    academy_internal: 0, coach_submission: 0, director_submission: 0, platform_curated: 0,
  }

  for (const item of items) {
    byDomain[item.domain] = (byDomain[item.domain] ?? 0) + 1
    bySourceType[item.sourceType] = (bySourceType[item.sourceType] ?? 0) + 1
  }

  return {
    totalItems: items.length,
    pendingReviewCount: items.filter(i => i.status === 'pending_review').length,
    approvedGeneralCount: items.filter(i => i.status === 'approved_general').length,
    promotedToCurriculumCount: items.filter(i => i.status === 'promoted_to_curriculum').length,
    rejectedCount: items.filter(i => i.status === 'rejected').length,
    deferredCount: items.filter(i => i.status === 'deferred').length,
    byDomain,
    bySourceType,
  }
}

export function filterKnowledgeLibrary(
  items: KnowledgeItem[],
  filters: KnowledgeLibraryFilters,
): KnowledgeItem[] {
  let result = items

  if (filters.domain !== null) {
    result = result.filter(i => i.domain === filters.domain)
  }

  if (filters.status !== null) {
    result = result.filter(i => i.status === filters.status)
  }

  if (filters.sourceType !== null) {
    result = result.filter(i => i.sourceType === filters.sourceType)
  }

  if (filters.accessLevel !== null) {
    result = result.filter(i => i.accessLevel === filters.accessLevel)
  }

  if (filters.academyId !== null) {
    result = result.filter(i => i.academyId === null || i.academyId === filters.academyId)
  }

  if (filters.searchQuery !== null && filters.searchQuery.trim().length > 0) {
    const query = filters.searchQuery.toLowerCase()
    result = result.filter(i =>
      i.title.toLowerCase().includes(query) ||
      i.summary.toLowerCase().includes(query) ||
      i.tags.some(t => t.toLowerCase().includes(query)),
    )
  }

  return result
}

export function buildKnowledgeLibraryView(
  items: KnowledgeItem[],
  filters: KnowledgeLibraryFilters,
): KnowledgeLibraryView {
  const filteredItems = filterKnowledgeLibrary(items, filters)
  const summary = buildKnowledgeLibrarySummary(items)

  return {
    items: filteredItems,
    totalItems: filteredItems.length,
    filters,
    summary,
    hasPendingReview: summary.pendingReviewCount > 0,
    pendingReviewCount: summary.pendingReviewCount,
  }
}

export function getItemsForCurriculumLevel(
  items: KnowledgeItem[],
  levelId: string,
): KnowledgeItem[] {
  return items.filter(i => i.promotedCurriculumLevelIds.includes(levelId))
}

export function getPendingReviewItems(items: KnowledgeItem[]): KnowledgeItem[] {
  return items.filter(i => i.status === 'pending_review')
}

export function getApprovedGeneralItems(items: KnowledgeItem[]): KnowledgeItem[] {
  return items.filter(i => i.status === 'approved_general')
}

export function sortItemsByDate(items: KnowledgeItem[]): KnowledgeItem[] {
  return [...items].sort((a, b) =>
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )
}
