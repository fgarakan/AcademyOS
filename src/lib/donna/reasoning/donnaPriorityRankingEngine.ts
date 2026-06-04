// Sprint 1911–1960 — DONNA Reasoning + Memory Optimization V1
// Priority ranking engine.
//
// Ranks DONNA's recommended actions by:
//   - urgency (time-sensitive signals)
//   - impact (how many people/workflows are affected)
//   - dependency (what's blocked until this is done)
//   - risk (what gets worse if this is delayed)
//   - visibility (parent/player visibility implications)
//   - operations impact (how many coaching sessions are affected)
//
// Used by today guidance and COO orchestration to surface the single
// highest-value action for the director.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Scores are 0–100. Higher = higher priority.
//   - Deterministic: same input → same ranking.

import type { DirectorGoal } from '@/lib/donna/goals/donnaGoalEngine'
import type { DonnaAttentionSeverity } from '@/lib/donna/donnaAttentionRankingEngine'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PriorityRankingInput {
  goal: DirectorGoal
  severity: DonnaAttentionSeverity
  entityLabel: string | null
  /** How many people or workflows are affected */
  affectedCount: number
  /** True when parent/player visibility is affected */
  hasParentOrPlayerVisibility: boolean
  /** True when this blocks other pending workflows */
  isBlocking: boolean
  /** Days since this signal was first detected */
  daysPending: number
}

export interface RankedPriority {
  goal: DirectorGoal
  entityLabel: string | null
  /** 0–100 composite priority score */
  score: number
  scoreBreakdown: {
    urgency: number
    impact: number
    dependency: number
    risk: number
    visibility: number
    operationsImpact: number
  }
  /** Human-readable reason this item is ranked where it is */
  rankingReason: string
}

// ── Scoring constants ─────────────────────────────────────────────────────────

const SEVERITY_SCORES: Record<DonnaAttentionSeverity, number> = {
  critical: 40,
  high:     30,
  medium:   15,
  low:       5,
}

const GOAL_IMPACT_SCORES: Partial<Record<DirectorGoal, number>> = {
  review_queue_clear:          25, // unblocks many workflows
  assessment_completion:       20,
  parent_update_completion:    18,
  curriculum_completion:       15,
  player_progress_review:      12,
  readiness_review_completion: 12,
  player_onboarding_completion: 10,
  class_template_completion:    8,
  session_review_completion:    8,
  attendance_completion:        6,
  academy_setup_completion:    20,
  fitness_template_completion:  5,
  general_guidance:             2,
}

// ── Scorer ────────────────────────────────────────────────────────────────────

export function scoreAndRankPriority(input: PriorityRankingInput): RankedPriority {
  const urgency = SEVERITY_SCORES[input.severity] ?? 5
  const impact = Math.min(GOAL_IMPACT_SCORES[input.goal] ?? 5 + (input.affectedCount * 2), 25)
  const dependency = input.isBlocking ? 15 : 0
  const risk = Math.min(input.daysPending * 3, 15)
  const visibility = input.hasParentOrPlayerVisibility ? 10 : 0
  const operationsImpact = Math.min(input.affectedCount, 10)

  const score = Math.min(
    urgency + impact + dependency + risk + visibility + operationsImpact,
    100,
  )

  const rankingReason = buildRankingReason(input, { urgency, impact, dependency, risk, visibility, operationsImpact })

  return {
    goal: input.goal,
    entityLabel: input.entityLabel,
    score,
    scoreBreakdown: { urgency, impact, dependency, risk, visibility, operationsImpact },
    rankingReason,
  }
}

export function rankPriorities(inputs: PriorityRankingInput[]): RankedPriority[] {
  return inputs
    .map(scoreAndRankPriority)
    .sort((a, b) => b.score - a.score)
}

// ── Ranking reason builder ────────────────────────────────────────────────────

function buildRankingReason(
  input: PriorityRankingInput,
  scores: Record<string, number>,
): string {
  const reasons: string[] = []

  if (input.severity === 'critical') reasons.push('critical urgency')
  else if (input.severity === 'high') reasons.push('high urgency')

  if (input.isBlocking) reasons.push('blocking other workflows')
  if (input.hasParentOrPlayerVisibility) reasons.push('parent/player visibility affected')
  if (input.daysPending >= 7) reasons.push(`pending ${input.daysPending} days`)
  else if (input.daysPending >= 3) reasons.push('been pending for several days')

  if (input.affectedCount > 5) reasons.push(`affects ${input.affectedCount} people`)

  if (reasons.length === 0) {
    return 'Standard priority — no exceptional urgency factors.'
  }

  return `Ranked high because: ${reasons.join(', ')}.`
}
