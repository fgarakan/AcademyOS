// Mega Sprint 2216–2240 — DONNA Goal Completion Engine V1
// Daily Priorities Workflow Orchestrator
//
// When the director asks "What should I do today?", DONNA should not just answer.
// DONNA should identify the highest-value task, explain it, ask to begin,
// and walk the director through it step by step until complete.
//
// Orchestration sequence:
//   1. Read the COO attention report / academy health / pending queues
//   2. Select top priority by priority order (P1 blockers first)
//   3. Explain: what matters, why, what to do first
//   4. Ask: "Would you like me to walk you through it now?"
//   5. If yes: enter the relevant goal workflow
//   6. When task completes: offer next priority
//
// Priority order:
//   P1: blocker              (player_placement, onboarding_completion)
//   P2: approval             (review_queue, coach_recap_review, parent_update_review)
//   P3: curriculum_bottleneck (curriculum_improvement)
//   P4: academy_health       (academy_health_action)
//   P5: opportunity          (general guidance)
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic: same context → same output.
//   - DONNA always asks before starting a workflow. Never auto-starts.
//   - Director approval required for all mutations.

import type { GoalType, WorkflowPriority } from './donnaGoalCompletionModel'
import { getWorkflowsByPriority, detectGoalWorkflowIntent } from './donnaWorkflowRegistry'

// ── Input ──────────────────────────────────────────────────────────────────────

export interface AcademySignalContext {
  pendingPlacements:     number
  pendingReviewItems:    number
  pendingRecaps:         number
  pendingParentUpdates:  number
  onboardingIncomplete:  boolean
  curriculumBottlenecks: CurriculumBottleneckSignal[]
  healthIssues:          AcademyHealthSignal[]
}

export interface CurriculumBottleneckSignal {
  levelLabel:    string
  levelKey:      string
  stallCount:    number
  description:   string
}

export interface AcademyHealthSignal {
  kpiLabel:     string
  status:       'warning' | 'critical'
  description:  string
}

// ── Output ─────────────────────────────────────────────────────────────────────

export interface DailyPriorityItem {
  rank:           number
  goalType:       GoalType
  priority:       WorkflowPriority
  label:          string
  whatItIs:       string
  whyItMatters:   string
  whatToDoFirst:  string
  count:          number
  route:          string | null
}

export interface DailyPrioritiesOutput {
  hasPriorities:         boolean
  isAllClear:            boolean
  summaryLine:           string
  topPriority:           DailyPriorityItem | null
  allPriorities:         DailyPriorityItem[]
  openingMessage:        string
  followUpQuestion:      string
  workflowCandidate:     GoalType | null
  destination:           string | null
}

// ── Priority builders ──────────────────────────────────────────────────────────

function buildPriorityItems(ctx: AcademySignalContext): DailyPriorityItem[] {
  const items: DailyPriorityItem[] = []
  let rank = 1

  // P1: Blockers — player_placement
  if (ctx.pendingPlacements > 0) {
    items.push({
      rank:          rank++,
      goalType:      'player_placement',
      priority:      'blocker',
      label:         'Player Placement',
      whatItIs:      `${ctx.pendingPlacements} player${ctx.pendingPlacements === 1 ? '' : 's'} waiting for placement.`,
      whyItMatters:  'Unplaced players cannot join groups. Coaches cannot plan sessions. Parents have no development context.',
      whatToDoFirst: 'Review the first pending player and approve, adjust, or skip their recommended level.',
      count:         ctx.pendingPlacements,
      route:         '/director/review',
    })
  }

  // P1: Blockers — onboarding_completion
  if (ctx.onboardingIncomplete) {
    items.push({
      rank:          rank++,
      goalType:      'onboarding_completion',
      priority:      'blocker',
      label:         'Academy Setup Incomplete',
      whatItIs:      'Academy setup is incomplete. Coach and player access is limited.',
      whyItMatters:  'Coaches cannot see sessions. Players cannot access their portal. Parent visibility is blocked.',
      whatToDoFirst: 'Complete the next missing setup step.',
      count:         1,
      route:         '/director',
    })
  }

  // P2: Approvals — review_queue
  if (ctx.pendingReviewItems > 0) {
    items.push({
      rank:          rank++,
      goalType:      'review_queue',
      priority:      'approval',
      label:         'Review Queue',
      whatItIs:      `${ctx.pendingReviewItems} item${ctx.pendingReviewItems === 1 ? '' : 's'} waiting for your decision.`,
      whyItMatters:  'Pending items block downstream actions. Coaches wait on approvals. Players wait on placements.',
      whatToDoFirst: 'Open the highest-impact item and make a decision: approve, edit, reject, or skip.',
      count:         ctx.pendingReviewItems,
      route:         '/director/review',
    })
  }

  // P2: Approvals — coach_recap_review
  if (ctx.pendingRecaps > 0) {
    items.push({
      rank:          rank++,
      goalType:      'coach_recap_review',
      priority:      'approval',
      label:         'Coach Recaps',
      whatItIs:      `${ctx.pendingRecaps} coach recap${ctx.pendingRecaps === 1 ? '' : 's'} waiting for review.`,
      whyItMatters:  'Unreviewed recaps delay attendance records and player development notes.',
      whatToDoFirst: 'Review the most recent coach recap and approve or request clarification.',
      count:         ctx.pendingRecaps,
      route:         '/director/review',
    })
  }

  // P2: Approvals — parent_update_review
  if (ctx.pendingParentUpdates > 0) {
    items.push({
      rank:          rank++,
      goalType:      'parent_update_review',
      priority:      'approval',
      label:         'Parent Updates',
      whatItIs:      `${ctx.pendingParentUpdates} parent update draft${ctx.pendingParentUpdates === 1 ? '' : 's'} waiting for approval.`,
      whyItMatters:  'Parents are waiting for progress communication. Approved updates build family trust.',
      whatToDoFirst: 'Review the first parent update draft and approve or reject.',
      count:         ctx.pendingParentUpdates,
      route:         '/director/review',
    })
  }

  // P3: Curriculum Bottlenecks
  for (const bottleneck of ctx.curriculumBottlenecks.slice(0, 2)) {
    items.push({
      rank:          rank++,
      goalType:      'curriculum_improvement',
      priority:      'curriculum_bottleneck',
      label:         `Curriculum — ${bottleneck.levelLabel}`,
      whatItIs:      bottleneck.description,
      whyItMatters:  `${bottleneck.stallCount} player${bottleneck.stallCount === 1 ? '' : 's'} are stalling at ${bottleneck.levelLabel}. Progress is blocked by curriculum gaps.`,
      whatToDoFirst: `Review the draft improvement plan for ${bottleneck.levelLabel}.`,
      count:         bottleneck.stallCount,
      route:         `/director/curriculum?improve=${bottleneck.levelKey}`,
    })
  }

  // P4: Academy Health
  for (const health of ctx.healthIssues.slice(0, 2)) {
    items.push({
      rank:          rank++,
      goalType:      'academy_health_action',
      priority:      'academy_health',
      label:         `Academy Health — ${health.kpiLabel}`,
      whatItIs:      health.description,
      whyItMatters:  `${health.kpiLabel} is ${health.status === 'critical' ? 'critical' : 'warning'}. This affects overall academy performance.`,
      whatToDoFirst: `Review the ${health.kpiLabel} signal and decide on a corrective action.`,
      count:         1,
      route:         '/director/kpi',
    })
  }

  return items
}

// ── Message builders ───────────────────────────────────────────────────────────

function buildSummaryLine(items: DailyPriorityItem[]): string {
  if (items.length === 0) return "Your academy is in good shape today. No urgent priorities."
  const blockers  = items.filter(i => i.priority === 'blocker').length
  const approvals = items.filter(i => i.priority === 'approval').length
  const parts: string[] = []
  if (blockers > 0)  parts.push(`${blockers} blocker${blockers === 1 ? '' : 's'}`)
  if (approvals > 0) parts.push(`${approvals} approval${approvals === 1 ? '' : 's'} waiting`)
  const rest = items.length - blockers - approvals
  if (rest > 0)      parts.push(`${rest} other item${rest === 1 ? '' : 's'}`)
  return `You have ${parts.join(', ')} today.`
}

function buildOpeningMessage(top: DailyPriorityItem | null, totalCount: number): string {
  if (!top) {
    return "Your academy is in good shape today. Everything is up to date — no urgent priorities."
  }

  return [
    "Here is what matters most today.",
    '',
    `**Priority 1 — ${top.label}**`,
    top.whatItIs,
    '',
    `**Why it matters:** ${top.whyItMatters}`,
    '',
    `**What to do first:** ${top.whatToDoFirst}`,
    '',
    totalCount > 1
      ? `There ${totalCount - 1 === 1 ? 'is' : 'are'} ${totalCount - 1} more item${totalCount - 1 === 1 ? '' : 's'} after this one.`
      : '',
  ].filter(line => line !== '').join('\n')
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Build the full daily priorities output from academy signal context.
 *
 * This is the authoritative source for DONNA's "What should I do today?" response.
 * It selects the highest-priority item, builds the opening message, and
 * identifies the workflow DONNA should offer to start.
 */
export function buildDailyPrioritiesOutput(ctx: AcademySignalContext): DailyPrioritiesOutput {
  const allPriorities = buildPriorityItems(ctx)
  const topPriority   = allPriorities[0] ?? null

  const isAllClear    = allPriorities.length === 0
  const summaryLine   = buildSummaryLine(allPriorities)
  const openingMessage = buildOpeningMessage(topPriority, allPriorities.length)

  const followUpQuestion = topPriority
    ? `Would you like me to walk you through **${topPriority.label}** now?`
    : "Is there something specific you would like to work on today?"

  return {
    hasPriorities:    !isAllClear,
    isAllClear,
    summaryLine,
    topPriority,
    allPriorities,
    openingMessage,
    followUpQuestion,
    workflowCandidate: topPriority?.goalType ?? null,
    destination:       topPriority?.route ?? null,
  }
}

/**
 * Build the DONNA message for the transition to the next priority
 * after one workflow has been completed.
 *
 * @param completedLabel  Human label of the workflow just finished
 * @param next            Next priority item (or null if done)
 */
export function buildNextPriorityTransitionMessage(
  completedLabel: string,
  next: DailyPriorityItem | null,
): string {
  if (!next) {
    return [
      `**${completedLabel} — complete.**`,
      '',
      "You've worked through all of today's priorities. Your academy is up to date.",
    ].join('\n')
  }

  return [
    `**${completedLabel} — complete.**`,
    '',
    `Your next priority is **${next.label}**.`,
    '',
    next.whatItIs,
    '',
    `**Why it matters:** ${next.whyItMatters}`,
    '',
    `Would you like me to walk you through **${next.label}** now?`,
  ].join('\n')
}

/**
 * Returns a one-sentence daily status for DONNA's opening brief.
 */
export function buildDailyStatusLine(ctx: AcademySignalContext): string {
  const items = buildPriorityItems(ctx)
  return buildSummaryLine(items)
}

/**
 * Detects if the user's message is a "what should I do today?" intent.
 */
export function isDailyPrioritiesIntent(text: string): boolean {
  const workflow = detectGoalWorkflowIntent(text)
  return workflow?.id === 'daily_priorities'
}

/**
 * Re-rank priorities after one has been completed or skipped.
 * Removes the completed item and returns the remaining ordered list.
 */
export function reRankAfterCompletion(
  allPriorities: DailyPriorityItem[],
  completedGoalType: GoalType,
): DailyPriorityItem[] {
  return allPriorities
    .filter(p => p.goalType !== completedGoalType)
    .map((p, i) => ({ ...p, rank: i + 1 }))
}

/**
 * Build a session summary message from completed workflow goals.
 *
 * @param completedGoals  Goal types completed in this session
 * @param remainingGoals  Goal types not yet addressed
 */
export function buildSessionSummary(
  completedGoals: GoalType[],
  remainingGoals: GoalType[],
): string {
  const workflows = getWorkflowsByPriority()
  const completedLabels = completedGoals.map(
    g => workflows.find(w => w.id === g)?.label ?? g,
  )
  const remainingLabels = remainingGoals.map(
    g => workflows.find(w => w.id === g)?.label ?? g,
  )

  const lines: string[] = ['**Today\'s session summary**', '']

  if (completedLabels.length > 0) {
    lines.push('**Completed:**')
    completedLabels.forEach(l => lines.push(`✓ ${l}`))
    lines.push('')
  }

  if (remainingLabels.length > 0) {
    lines.push('**Remaining for later:**')
    remainingLabels.forEach(l => lines.push(`- ${l}`))
  } else {
    lines.push("All priorities addressed. Academy is up to date.")
  }

  return lines.join('\n')
}
