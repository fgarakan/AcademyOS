// Mega Sprint 1535–1564 — DONNA Today Operating System V1
// Mega Sprint 1565–1594 — DONNA Decision Execution Engine V1 (execution plan added)
// Director decisions engine — decisions waiting on the director.
// Top 3 only. Each must be something the director must approve/decide.
// Each decision now carries a DecisionExecutionPlan for actionable expansion.
// Pure TypeScript — no DB, no React, no side effects.

import { buildExecutionPlanForDecision } from '@/lib/donna/execution/donnaDecisionExecutionEngine'
import type { DecisionExecutionPlan } from '@/lib/donna/execution/donnaDecisionExecutionTypes'

export interface DirectorDecision {
  id:            string
  headline:      string
  synthesis:     string
  count:         number
  actionLabel:   string
  actionHref:    string
  urgency:       'high' | 'medium' | 'low'
  ageNote:       string | null   // e.g. "oldest is 12 days old"
  executionPlan: DecisionExecutionPlan
}

export interface DecisionInput {
  assessmentsNeedingReview:   number
  activePlacementReviews:     number
  pendingWrapUpsCount:        number
  parentUpdatesPending:       number
  newRequests:                number
  advancementReadyCount:      number
  oldestPendingReviewAgeDays: number | null
}

export function buildDirectorDecisions(input: DecisionInput): DirectorDecision[] {
  const decisions: DirectorDecision[] = []

  const ageNote = input.oldestPendingReviewAgeDays !== null && input.oldestPendingReviewAgeDays > 3
    ? `Oldest is ${input.oldestPendingReviewAgeDays} day${input.oldestPendingReviewAgeDays !== 1 ? 's' : ''} old`
    : null

  if (input.assessmentsNeedingReview > 0) {
    const raw = {
      id:         'assessments-decision',
      headline:   `${input.assessmentsNeedingReview} assessment${input.assessmentsNeedingReview > 1 ? 's' : ''} need your approval`,
      synthesis:  'Assessment results cannot be recorded until you approve them.',
      count:      input.assessmentsNeedingReview,
      actionLabel: 'Review assessments',
      actionHref:  '/director/review',
      urgency:     'high' as const,
      ageNote,
    }
    decisions.push({ ...raw, executionPlan: buildExecutionPlanForDecision(raw) })
  }

  if (input.activePlacementReviews > 0) {
    const raw = {
      id:         'placements-decision',
      headline:   `${input.activePlacementReviews} player${input.activePlacementReviews > 1 ? 's' : ''} await${input.activePlacementReviews === 1 ? 's' : ''} placement approval`,
      synthesis:  'New players cannot join groups or receive curriculum until placement is confirmed.',
      count:      input.activePlacementReviews,
      actionLabel: 'Review placements',
      actionHref:  '/director/review',
      urgency:     'high' as const,
      ageNote,
    }
    decisions.push({ ...raw, executionPlan: buildExecutionPlanForDecision(raw) })
  }

  if (input.advancementReadyCount > 0) {
    const raw = {
      id:         'advancement-decision',
      headline:   `${input.advancementReadyCount} player${input.advancementReadyCount > 1 ? 's are' : ' is'} ready to advance`,
      synthesis:  'These players meet all tracked gate criteria. Your confirmation moves them to the next level.',
      count:      input.advancementReadyCount,
      actionLabel: 'Review advancement',
      actionHref:  '/director/players',
      urgency:     'medium' as const,
      ageNote:     null,
    }
    decisions.push({ ...raw, executionPlan: buildExecutionPlanForDecision(raw) })
  }

  if (input.pendingWrapUpsCount > 0) {
    const raw = {
      id:         'wrapups-decision',
      headline:   `${input.pendingWrapUpsCount} coach recap${input.pendingWrapUpsCount > 1 ? 's' : ''} need review`,
      synthesis:  'Coach session recaps with attendance exceptions or concerns need director sign-off.',
      count:      input.pendingWrapUpsCount,
      actionLabel: 'Review recaps',
      actionHref:  '/director/review',
      urgency:     'medium' as const,
      ageNote,
    }
    decisions.push({ ...raw, executionPlan: buildExecutionPlanForDecision(raw) })
  }

  if (input.parentUpdatesPending > 0) {
    const raw = {
      id:         'parent-updates-decision',
      headline:   `${input.parentUpdatesPending} parent update${input.parentUpdatesPending > 1 ? 's' : ''} need approval`,
      synthesis:  'Parent communication drafts are ready — approve them to send progress updates.',
      count:      input.parentUpdatesPending,
      actionLabel: 'Approve updates',
      actionHref:  '/director/review',
      urgency:     'medium' as const,
      ageNote:     null,
    }
    decisions.push({ ...raw, executionPlan: buildExecutionPlanForDecision(raw) })
  }

  if (input.newRequests > 0) {
    const raw = {
      id:         'lesson-requests-decision',
      headline:   `${input.newRequests} lesson request${input.newRequests > 1 ? 's' : ''} to review`,
      synthesis:  'Private lesson requests are waiting for your response.',
      count:      input.newRequests,
      actionLabel: 'Review requests',
      actionHref:  '/director/review',
      urgency:     'low' as const,
      ageNote:     null,
    }
    decisions.push({ ...raw, executionPlan: buildExecutionPlanForDecision(raw) })
  }

  // Sort by urgency and return top 3
  const order = { high: 0, medium: 1, low: 2 }
  return decisions.sort((a, b) => order[a.urgency] - order[b.urgency]).slice(0, 3)
}
