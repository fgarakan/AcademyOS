// Sprint 528 — Knowledge Library Types
// Core types for the Global Knowledge Library.
// DOCTRINE: External knowledge → Knowledge Library → Platform owner reviews →
//   [Approve as general knowledge] OR [Promote to curriculum draft]
//   → Curriculum draft → director approval → curriculum record
// Knowledge NEVER auto-becomes curriculum or parent/player-answerable.
// DONNA can organize but not publish.
// Pure TypeScript — no DB calls, no AI, no side effects.

export type KnowledgeSourceType =
  | 'research_paper'
  | 'coaching_manual'
  | 'itf_guideline'
  | 'usta_resource'
  | 'academy_internal'
  | 'coach_submission'
  | 'director_submission'
  | 'platform_curated'

export type KnowledgeDomain =
  | 'technical'
  | 'tactical'
  | 'physical'
  | 'mental'
  | 'competition'
  | 'nutrition'
  | 'recovery'
  | 'coaching_methodology'
  | 'player_development'
  | 'parent_education'
  | 'sports_science'

export type KnowledgeStatus =
  | 'pending_review'
  | 'approved_general'
  | 'promoted_to_curriculum'
  | 'rejected'
  | 'deferred'

export type KnowledgeAccessLevel =
  | 'platform_only'
  | 'director_only'
  | 'coach_and_above'
  | 'public'

export interface KnowledgeItem {
  itemId: string
  title: string
  summary: string
  body: string | null
  sourceType: KnowledgeSourceType
  sourceUrl: string | null
  sourceAuthor: string | null
  sourceCitationYear: number | null
  domain: KnowledgeDomain
  tags: string[]
  status: KnowledgeStatus
  accessLevel: KnowledgeAccessLevel
  isParentAnswerable: false
  isPlayerAnswerable: false
  isCurriculumPromoted: boolean
  promotedCurriculumLevelIds: string[]
  submittedAt: string
  submittedBy: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  reviewNotes: string | null
  academyId: string | null
}

export interface KnowledgeReviewDecision {
  itemId: string
  decision: 'approve_general' | 'promote_to_curriculum' | 'reject' | 'defer'
  reviewerRole: 'platform_owner' | 'academy_director'
  reviewNotes: string | null
  targetCurriculumLevelIds: string[]
  requiresDirectorApproval: true
  neverAutoApply: true
  decidedAt: string
  decidedBy: string
}

export interface KnowledgeLibrarySummary {
  totalItems: number
  pendingReviewCount: number
  approvedGeneralCount: number
  promotedToCurriculumCount: number
  rejectedCount: number
  deferredCount: number
  byDomain: Record<KnowledgeDomain, number>
  bySourceType: Record<KnowledgeSourceType, number>
}

export function getKnowledgeStatusLabel(status: KnowledgeStatus): string {
  const labels: Record<KnowledgeStatus, string> = {
    pending_review: 'Pending review',
    approved_general: 'Approved — general knowledge',
    promoted_to_curriculum: 'Promoted to curriculum',
    rejected: 'Rejected',
    deferred: 'Deferred',
  }
  return labels[status]
}

export function getKnowledgeDomainLabel(domain: KnowledgeDomain): string {
  const labels: Record<KnowledgeDomain, string> = {
    technical: 'Technical',
    tactical: 'Tactical',
    physical: 'Physical / Athletic',
    mental: 'Mental Performance',
    competition: 'Competition',
    nutrition: 'Nutrition',
    recovery: 'Recovery',
    coaching_methodology: 'Coaching Methodology',
    player_development: 'Player Development',
    parent_education: 'Parent Education',
    sports_science: 'Sports Science',
  }
  return labels[domain]
}

export function getKnowledgeSourceTypeLabel(sourceType: KnowledgeSourceType): string {
  const labels: Record<KnowledgeSourceType, string> = {
    research_paper: 'Research paper',
    coaching_manual: 'Coaching manual',
    itf_guideline: 'ITF guideline',
    usta_resource: 'USTA resource',
    academy_internal: 'Academy internal',
    coach_submission: 'Coach submission',
    director_submission: 'Director submission',
    platform_curated: 'Platform curated',
  }
  return labels[sourceType]
}
