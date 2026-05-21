// Sprint 516 — Assessment Criteria Model
// Formal assessment gates for curriculum level advancement.
// Assessment criteria differ from session observations — they require
// structured evidence collected during a formal assessment event.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { SkillDomain } from './skillHierarchyModel'

export type AssessmentMethod =
  | 'coach_observation'
  | 'video_review'
  | 'rally_count'
  | 'skill_test'
  | 'match_play_review'
  | 'parent_interview'

export type AssessmentCriterionStatus =
  | 'not_assessed'
  | 'in_progress'
  | 'met'
  | 'deferred'

export interface AssessmentCriterion {
  criterionId: string
  levelId: string
  levelName: string
  domain: SkillDomain
  name: string
  description: string
  method: AssessmentMethod
  threshold: string
  thresholdNumeric: number | null
  isRequired: boolean
  isParentVisible: boolean
  isPlayerVisible: boolean
  linkedGateId: string | null
  displayOrder: number
  approvedAt: string | null
}

export interface PlayerAssessmentRecord {
  criterionId: string
  playerId: string
  status: AssessmentCriterionStatus
  evidenceNotes: string | null
  assessedBy: string | null
  assessedAt: string | null
  isParentSafe: boolean
}

export interface AssessmentCriteriaSummary {
  totalCriteria: number
  requiredCount: number
  optionalCount: number
  byDomain: Record<SkillDomain, number>
  byMethod: Record<AssessmentMethod, number>
  parentVisibleCount: number
  playerVisibleCount: number
  pendingApprovalCount: number
}

export function buildAssessmentCriteriaSummary(
  criteria: AssessmentCriterion[],
): AssessmentCriteriaSummary {
  const byDomain: Record<SkillDomain, number> = {
    technical: 0, tactical: 0, footwork: 0, serve_return: 0,
    rally: 0, net_play: 0, competition: 0, fitness: 0, mental: 0,
  }
  const byMethod: Record<AssessmentMethod, number> = {
    coach_observation: 0, video_review: 0, rally_count: 0,
    skill_test: 0, match_play_review: 0, parent_interview: 0,
  }

  for (const c of criteria) {
    byDomain[c.domain] = (byDomain[c.domain] ?? 0) + 1
    byMethod[c.method] = (byMethod[c.method] ?? 0) + 1
  }

  return {
    totalCriteria: criteria.length,
    requiredCount: criteria.filter(c => c.isRequired).length,
    optionalCount: criteria.filter(c => !c.isRequired).length,
    byDomain,
    byMethod,
    parentVisibleCount: criteria.filter(c => c.isParentVisible).length,
    playerVisibleCount: criteria.filter(c => c.isPlayerVisible).length,
    pendingApprovalCount: criteria.filter(c => c.approvedAt === null).length,
  }
}

export function getCriteriaForLevel(
  criteria: AssessmentCriterion[],
  levelId: string,
): AssessmentCriterion[] {
  return criteria
    .filter(c => c.levelId === levelId && c.approvedAt !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder)
}

export function getRequiredCriteria(criteria: AssessmentCriterion[]): AssessmentCriterion[] {
  return criteria.filter(c => c.isRequired && c.approvedAt !== null)
}

export function computePlayerAssessmentProgress(
  criteria: AssessmentCriterion[],
  records: PlayerAssessmentRecord[],
  levelId: string,
): { met: number; total: number; requiredMet: number; requiredTotal: number; pct: number } {
  const levelCriteria = getCriteriaForLevel(criteria, levelId)
  const recordMap = new Map<string, PlayerAssessmentRecord>()
  for (const r of records) {
    recordMap.set(r.criterionId, r)
  }

  let met = 0
  let requiredMet = 0
  for (const c of levelCriteria) {
    const record = recordMap.get(c.criterionId)
    if (record?.status === 'met') {
      met += 1
      if (c.isRequired) requiredMet += 1
    }
  }

  const requiredTotal = levelCriteria.filter(c => c.isRequired).length
  const pct = levelCriteria.length > 0 ? Math.round((met / levelCriteria.length) * 100) : 0
  return { met, total: levelCriteria.length, requiredMet, requiredTotal, pct }
}

export function getAssessmentMethodLabel(method: AssessmentMethod): string {
  const labels: Record<AssessmentMethod, string> = {
    coach_observation: 'Coach observation',
    video_review: 'Video review',
    rally_count: 'Rally count',
    skill_test: 'Skill test',
    match_play_review: 'Match play review',
    parent_interview: 'Parent interview',
  }
  return labels[method]
}
