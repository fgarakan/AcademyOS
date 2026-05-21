// Sprint 574 — New Player Onboarding Assessment Architecture V1
// Core types for the assessment and placement system.
// Pure TypeScript — no DB calls, no AI calls, no side effects.
// All assessment outputs are drafts/recommendations until director approves.

export type AssessmentEventType =
  | 'new_player_intake'
  | 'quarterly_review'
  | 'promotion_gate'
  | 'coach_initiated'
  | 'director_initiated'

export type AssessmentDraftStatus =
  | 'in_progress'
  | 'submitted_for_review'
  | 'approved'
  | 'adjusted_and_approved'
  | 'rejected'

export type AssessmentDomain =
  | 'skill'
  | 'competition'
  | 'fitness'
  | 'mental_performance'

export interface AssessmentRubricBand {
  bandId: string
  label: string
  minScore: number
  maxScore: number
  description: string
  coachNotes: string
  indicativeLevel: string | null
}

export interface AssessmentDomainScore {
  domain: AssessmentDomain
  rawScore: number
  bandId: string
  bandLabel: string
  coachNotes: string
  evidenceNotes: string
}

export interface AssessmentEventDraft {
  draftId: string
  eventType: AssessmentEventType
  playerId: string | null
  playerName: string
  assessedBy: string
  assessedDate: string
  academyId: string
  domainScores: Partial<Record<AssessmentDomain, AssessmentDomainScore>>
  overallNotes: string
  status: AssessmentDraftStatus
  createdAt: string
}

export interface AssessmentDomainWeights {
  skill: number
  competition: number
  fitness: number
  mental_performance: number
}

export const DEFAULT_DOMAIN_WEIGHTS: AssessmentDomainWeights = {
  skill: 0.40,
  competition: 0.25,
  fitness: 0.20,
  mental_performance: 0.15,
}

export const ASSESSMENT_DOMAIN_LABELS: Record<AssessmentDomain, string> = {
  skill: 'Skill & Technique',
  competition: 'Competition Readiness',
  fitness: 'Physical Capability',
  mental_performance: 'Mental Performance',
}

export const ASSESSMENT_EVENT_TYPE_LABELS: Record<AssessmentEventType, string> = {
  new_player_intake: 'New Player Intake',
  quarterly_review: 'Quarterly Review',
  promotion_gate: 'Promotion Gate',
  coach_initiated: 'Coach Initiated',
  director_initiated: 'Director Initiated',
}

export const ASSESSMENT_DRAFT_STATUS_LABELS: Record<AssessmentDraftStatus, string> = {
  in_progress: 'In Progress',
  submitted_for_review: 'Submitted for Review',
  approved: 'Approved',
  adjusted_and_approved: 'Adjusted & Approved',
  rejected: 'Rejected',
}

export function computeWeightedScore(
  domainScores: Partial<Record<AssessmentDomain, AssessmentDomainScore>>,
  weights: AssessmentDomainWeights = DEFAULT_DOMAIN_WEIGHTS,
): number | null {
  const domains: AssessmentDomain[] = ['skill', 'competition', 'fitness', 'mental_performance']
  let totalWeight = 0
  let weightedSum = 0

  for (const domain of domains) {
    const score = domainScores[domain]
    if (score != null) {
      weightedSum += score.rawScore * weights[domain]
      totalWeight += weights[domain]
    }
  }

  if (totalWeight === 0) return null
  return Math.round((weightedSum / totalWeight) * 10) / 10
}

export function isAssessmentComplete(
  draft: AssessmentEventDraft,
  requiredDomains: AssessmentDomain[] = ['skill', 'competition'],
): boolean {
  return requiredDomains.every(d => draft.domainScores[d] != null)
}

export function makeEmptyDraft(
  overrides: Partial<AssessmentEventDraft> = {},
): AssessmentEventDraft {
  return {
    draftId: `draft_${Date.now()}`,
    eventType: 'new_player_intake',
    playerId: null,
    playerName: '',
    assessedBy: '',
    assessedDate: new Date().toISOString().split('T')[0],
    academyId: '',
    domainScores: {},
    overallNotes: '',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}
