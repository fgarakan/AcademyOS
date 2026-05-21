// Sprint 533 — Knowledge Search Model
// Role-scoped search within the knowledge library.
// Parents and players CANNOT search the knowledge library directly.
// Coaches can search approved_general items only.
// Directors can search all approved items.
// Platform owners can search everything.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeItem, KnowledgeDomain, KnowledgeStatus } from './knowledgeTypes'

export type KnowledgeSearchRole = 'platform_owner' | 'academy_director' | 'coach' | 'head_coach'

export interface KnowledgeSearchQuery {
  text: string
  domain: KnowledgeDomain | null
  tags: string[]
  curriculumLevelId: string | null
  role: KnowledgeSearchRole
  academyId: string
}

export interface KnowledgeSearchResult {
  item: KnowledgeItem
  relevanceScore: number
  matchedFields: string[]
  canPromoteToCurriculum: boolean
}

export interface KnowledgeSearchResponse {
  query: KnowledgeSearchQuery
  results: KnowledgeSearchResult[]
  totalResults: number
  hasMore: boolean
  isParentAnswerable: false
  isPlayerAnswerable: false
}

function getRoleAllowedStatuses(role: KnowledgeSearchRole): KnowledgeStatus[] {
  if (role === 'platform_owner') {
    return ['pending_review', 'approved_general', 'promoted_to_curriculum', 'deferred']
  }
  if (role === 'academy_director' || role === 'head_coach') {
    return ['approved_general', 'promoted_to_curriculum']
  }
  return ['approved_general']
}

function computeRelevanceScore(item: KnowledgeItem, query: KnowledgeSearchQuery): { score: number; matchedFields: string[] } {
  const matchedFields: string[] = []
  let score = 0
  const lowerText = query.text.toLowerCase()

  if (item.title.toLowerCase().includes(lowerText)) {
    score += 10
    matchedFields.push('title')
  }

  if (item.summary.toLowerCase().includes(lowerText)) {
    score += 6
    matchedFields.push('summary')
  }

  if (item.body && item.body.toLowerCase().includes(lowerText)) {
    score += 3
    matchedFields.push('body')
  }

  const tagMatches = item.tags.filter(t => t.toLowerCase().includes(lowerText) || lowerText.includes(t.toLowerCase()))
  if (tagMatches.length > 0) {
    score += tagMatches.length * 2
    matchedFields.push('tags')
  }

  if (query.domain !== null && item.domain === query.domain) {
    score += 4
  }

  for (const tag of query.tags) {
    if (item.tags.includes(tag)) {
      score += 3
    }
  }

  if (query.curriculumLevelId !== null && item.promotedCurriculumLevelIds.includes(query.curriculumLevelId)) {
    score += 5
    matchedFields.push('curriculum_level')
  }

  return { score, matchedFields }
}

export function searchKnowledgeLibrary(
  items: KnowledgeItem[],
  query: KnowledgeSearchQuery,
  limit = 20,
): KnowledgeSearchResponse {
  if (query.text.trim().length < 2) {
    return {
      query,
      results: [],
      totalResults: 0,
      hasMore: false,
      isParentAnswerable: false,
      isPlayerAnswerable: false,
    }
  }

  const allowedStatuses = getRoleAllowedStatuses(query.role)

  const eligibleItems = items.filter(item => {
    if (!allowedStatuses.includes(item.status)) return false
    if (item.academyId !== null && item.academyId !== query.academyId) return false
    return true
  })

  const scoredResults: KnowledgeSearchResult[] = []
  for (const item of eligibleItems) {
    const { score, matchedFields } = computeRelevanceScore(item, query)
    if (score > 0) {
      scoredResults.push({
        item,
        relevanceScore: score,
        matchedFields,
        canPromoteToCurriculum: query.role === 'platform_owner' || query.role === 'academy_director',
      })
    }
  }

  scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore)
  const totalResults = scoredResults.length
  const results = scoredResults.slice(0, limit)

  return {
    query,
    results,
    totalResults,
    hasMore: totalResults > limit,
    isParentAnswerable: false,
    isPlayerAnswerable: false,
  }
}
