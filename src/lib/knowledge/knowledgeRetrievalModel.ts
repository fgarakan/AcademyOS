// Sprint 546 — Knowledge Retrieval Model
// Typed model for retrieving knowledge items in curriculum context.
// Retrieval is context-aware (level, domain, role) — never crosses privacy boundaries.
// Retrieved items go to director for review, not directly to coaches/parents/players.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeItem, KnowledgeDomain } from './knowledgeTypes'
import type { CurriculumStage } from '@/lib/curriculum/visualMapModel'

export type RetrievalContext =
  | 'director_curriculum_view'
  | 'director_level_builder'
  | 'director_review_queue'
  | 'coach_session_prep'
  | 'donna_context_surface'

export interface KnowledgeRetrievalRequest {
  context: RetrievalContext
  levelId: string | null
  stage: CurriculumStage | null
  domain: KnowledgeDomain | null
  tags: string[]
  requestedByRole: 'platform_owner' | 'academy_director' | 'head_coach' | 'coach'
  academyId: string
  limit: number
}

export interface KnowledgeRetrievalResult {
  request: KnowledgeRetrievalRequest
  items: KnowledgeItem[]
  totalFound: number
  isParentVisible: false
  isPlayerVisible: false
  contextLabel: string
  retrievalSummary: string
}

const CONTEXT_LABELS: Record<RetrievalContext, string> = {
  director_curriculum_view: 'Curriculum view — knowledge panel',
  director_level_builder: 'Level builder — relevant knowledge',
  director_review_queue: 'Review queue — knowledge context',
  coach_session_prep: 'Session prep — reference material',
  donna_context_surface: 'DONNA context surface',
}

function isItemEligibleForContext(item: KnowledgeItem, context: RetrievalContext, role: KnowledgeRetrievalRequest['requestedByRole']): boolean {
  if (item.status !== 'approved_general' && item.status !== 'promoted_to_curriculum') return false

  if (context === 'coach_session_prep' && role === 'coach') {
    return item.accessLevel !== 'platform_only' && item.accessLevel !== 'director_only'
  }

  if (role === 'academy_director' || role === 'head_coach' || role === 'platform_owner') {
    return true
  }

  return item.accessLevel === 'public' || item.accessLevel === 'coach_and_above'
}

function scoreItemForContext(item: KnowledgeItem, request: KnowledgeRetrievalRequest): number {
  let score = 0

  if (request.domain !== null && item.domain === request.domain) score += 5

  if (request.stage !== null) {
    const stageTagMap: Record<CurriculumStage, string> = {
      'Red Ball': 'red_ball',
      'Orange Ball': 'orange_ball',
      'Green Ball': 'green_ball',
      'Yellow Ball': 'yellow_ball',
      'High Performance': 'high_performance',
    }
    const stageTag = stageTagMap[request.stage]
    if (item.tags.includes(stageTag)) score += 4
  }

  if (request.levelId !== null && item.promotedCurriculumLevelIds.includes(request.levelId)) {
    score += 8
  }

  for (const tag of request.tags) {
    if (item.tags.includes(tag)) score += 2
  }

  if (item.sourceType === 'itf_guideline' || item.sourceType === 'usta_resource') score += 2

  return score
}

export function retrieveKnowledgeItems(
  items: KnowledgeItem[],
  request: KnowledgeRetrievalRequest,
): KnowledgeRetrievalResult {
  const eligible = items.filter(item =>
    isItemEligibleForContext(item, request.context, request.requestedByRole) &&
    (item.academyId === null || item.academyId === request.academyId),
  )

  const scored = eligible.map(item => ({
    item,
    score: scoreItemForContext(item, request),
  })).filter(r => r.score > 0).sort((a, b) => b.score - a.score)

  const resultItems = scored.slice(0, request.limit).map(r => r.item)
  const totalFound = scored.length

  const contextLabel = CONTEXT_LABELS[request.context]
  const retrievalSummary = totalFound === 0
    ? 'No relevant knowledge items found.'
    : `${totalFound} item${totalFound > 1 ? 's' : ''} found — showing top ${resultItems.length}.`

  return {
    request,
    items: resultItems,
    totalFound,
    isParentVisible: false,
    isPlayerVisible: false,
    contextLabel,
    retrievalSummary,
  }
}
