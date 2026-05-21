// Sprint 478 — Curriculum Inbox V1
// Curriculum idea/suggestion queue: voice-to-curriculum drafts, coach suggestions,
// director-initiated ideas — all waiting for review and approval before entering
// the official curriculum.
// Pure TypeScript — no DB calls. All items flow through proposed_actions pipeline
// before curriculum receives any change.

export type CurriculumInboxSourceType = 'voice' | 'text' | 'coach_suggestion' | 'donna_proposal'
export type CurriculumInboxStatus = 'pending_review' | 'approved' | 'rejected' | 'merged' | 'similar_exists'

export type CurriculumDomain =
  | 'technical'
  | 'tactical'
  | 'physical'
  | 'mental'
  | 'competition'
  | 'general'

export interface CurriculumInboxItem {
  id: string
  sourceType: CurriculumInboxSourceType
  idea: string
  proposedLevel: string | null
  domain: CurriculumDomain | null
  addedAt: string
  addedBy: string | null
  status: CurriculumInboxStatus
  similarityFlag: boolean
  similarItemIds: string[]
  proposedActionId: string | null
  rejectionReason: string | null
  reviewedBy: string | null
  reviewedAt: string | null
}

export interface CurriculumInboxSimilarityResult {
  itemId: string
  similarItemId: string
  similarityScore: number
  reason: string
}

export interface CurriculumInboxSummary {
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  flaggedAsSimilarCount: number
  topPendingItems: CurriculumInboxItem[]
  hasDuplicateCandidates: boolean
}

export interface CurriculumIdeaValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Build a new curriculum inbox item from raw input.
export function buildCurriculumInboxItem(params: {
  id: string
  sourceType: CurriculumInboxSourceType
  idea: string
  proposedLevel?: string | null
  domain?: CurriculumDomain | null
  addedBy?: string | null
  proposedActionId?: string | null
}): CurriculumInboxItem {
  return {
    id: params.id,
    sourceType: params.sourceType,
    idea: params.idea.trim(),
    proposedLevel: params.proposedLevel ?? null,
    domain: params.domain ?? null,
    addedAt: new Date().toISOString(),
    addedBy: params.addedBy ?? null,
    status: 'pending_review',
    similarityFlag: false,
    similarItemIds: [],
    proposedActionId: params.proposedActionId ?? null,
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
  }
}

// Deterministic similarity check — tokenizes ideas and computes overlap.
// Does NOT use AI. Returns a score 0–1 and a reason string.
export function scoreCurriculumSimilarity(
  ideaA: string,
  ideaB: string,
): CurriculumInboxSimilarityResult {
  const tokenize = (s: string): string[] =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2)

  const tokensA = new Set(tokenize(ideaA))
  const tokensB = new Set(tokenize(ideaB))

  const intersection = tokenize(ideaA).filter(t => tokensB.has(t))
  const union = new Set([...tokenize(ideaA), ...tokenize(ideaB)])

  const score = union.size === 0 ? 0 : intersection.length / union.size
  const reason = score >= 0.7
    ? 'High token overlap — likely duplicate'
    : score >= 0.4
    ? 'Moderate overlap — review for duplication'
    : 'Low overlap — likely distinct'

  return {
    itemId: '',
    similarItemId: '',
    similarityScore: parseFloat(score.toFixed(2)),
    reason,
  }
}

// Check all pending items for similarity against each other and mark flags.
export function applySimliarityFlags(
  items: CurriculumInboxItem[],
  threshold = 0.4,
): CurriculumInboxItem[] {
  const pending = items.filter(i => i.status === 'pending_review')

  return items.map(item => {
    if (item.status !== 'pending_review') return item

    const similarIds: string[] = []
    for (const other of pending) {
      if (other.id === item.id) continue
      const result = scoreCurriculumSimilarity(item.idea, other.idea)
      if (result.similarityScore >= threshold) {
        similarIds.push(other.id)
      }
    }

    return {
      ...item,
      similarityFlag: similarIds.length > 0,
      similarItemIds: similarIds,
      status: similarIds.length > 0 ? ('similar_exists' as CurriculumInboxStatus) : item.status,
    }
  })
}

// Validate a curriculum idea before creating an inbox item.
export function validateCurriculumIdea(idea: string, domain: CurriculumDomain | null): CurriculumIdeaValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!idea || idea.trim().length === 0) {
    errors.push('Idea text cannot be empty.')
  } else if (idea.trim().length < 10) {
    errors.push('Idea must be at least 10 characters.')
  } else if (idea.trim().length > 500) {
    errors.push('Idea must be under 500 characters.')
  }

  if (domain === null) {
    warnings.push('No domain specified — idea will be categorised as general.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// Rank pending items by priority (flags first, then oldest).
export function rankInboxByPriority(items: CurriculumInboxItem[]): CurriculumInboxItem[] {
  return [...items]
    .filter(i => i.status === 'pending_review' || i.status === 'similar_exists')
    .sort((a, b) => {
      // Flagged items first
      if (a.similarityFlag && !b.similarityFlag) return -1
      if (!a.similarityFlag && b.similarityFlag) return 1
      // Oldest first (review in order received)
      return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
    })
}

export function buildCurriculumInboxSummary(items: CurriculumInboxItem[]): CurriculumInboxSummary {
  const pendingCount = items.filter(i => i.status === 'pending_review' || i.status === 'similar_exists').length
  const approvedCount = items.filter(i => i.status === 'approved').length
  const rejectedCount = items.filter(i => i.status === 'rejected').length
  const flaggedAsSimilarCount = items.filter(i => i.similarityFlag).length

  return {
    pendingCount,
    approvedCount,
    rejectedCount,
    flaggedAsSimilarCount,
    topPendingItems: rankInboxByPriority(items).slice(0, 5),
    hasDuplicateCandidates: flaggedAsSimilarCount > 0,
  }
}

export function getCurriculumSourceLabel(sourceType: CurriculumInboxSourceType): string {
  const labels: Record<CurriculumInboxSourceType, string> = {
    voice: 'Voice input',
    text: 'Text input',
    coach_suggestion: 'Coach suggestion',
    donna_proposal: 'DONNA proposal',
  }
  return labels[sourceType]
}

export function getCurriculumDomainLabel(domain: CurriculumDomain | null): string {
  if (!domain) return 'General'
  const labels: Record<CurriculumDomain, string> = {
    technical: 'Technical',
    tactical: 'Tactical',
    physical: 'Physical',
    mental: 'Mental Performance',
    competition: 'Competition',
    general: 'General',
  }
  return labels[domain]
}
