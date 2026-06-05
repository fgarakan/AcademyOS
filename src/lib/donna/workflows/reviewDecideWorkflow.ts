// Mega Sprint 2216–2240 — DONNA Goal Completion Engine V1
// Review & Decide Workflow Orchestrator
//
// Guides the director through the review queue conversationally:
//   1. Count pending items
//   2. Start with highest-risk/highest-impact item
//   3. Summarize item with context
//   4. Ask: approve / edit / reject / skip
//   5. Move to next item
//   6. End with completed count and remaining count
//
// DONNA processes review work conversationally so the director never needs
// to hunt through the queue manually.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic: same context → same output.
//   - execute_approved_action() is the ONLY path for executing approved items.
//   - DONNA summarizes and presents. Director decides. System executes.

import type { GoalType } from './donnaGoalCompletionModel'

// ── Input types ────────────────────────────────────────────────────────────────

export type ReviewItemType =
  | 'placement'
  | 'wrap_up'
  | 'curriculum_change'
  | 'parent_update'
  | 'level_movement'
  | 'attendance_exception'
  | 'coach_observation'
  | 'voice_intake'

export type ReviewItemRisk = 'low' | 'medium' | 'high'

export interface ReviewQueueItem {
  actionId:         string
  itemType:         ReviewItemType
  subjectLabel:     string      // e.g. "Jake Chen — Green Ball 2 Placement"
  riskLevel:        ReviewItemRisk
  submittedBy:      string | null
  submittedAt:      string | null
  waitingDays:      number
  summary:          string
  context:          string | null
  requiresExecution: boolean
  approvalRoute:    string
}

// ── Output types ───────────────────────────────────────────────────────────────

export interface ReviewDecideStep {
  item:             ReviewQueueItem
  donnaMessage:     string
  userOptions:      ReviewUserOption[]
  requiresApproval: boolean
  navigationRoute:  string
}

export interface ReviewUserOption {
  phrase:  string
  label:   string
  intent:  'approve' | 'adjust' | 'reject' | 'skip' | 'show_evidence'
}

export interface ReviewDecideCompletion {
  totalReviewed:  number
  approved:       number
  rejected:       number
  skipped:        number
  summaryMessage: string
  nextWorkflow:   GoalType | null
}

// ── Ranking ────────────────────────────────────────────────────────────────────

const RISK_ORDER: Record<ReviewItemRisk, number> = { high: 0, medium: 1, low: 2 }
const TYPE_ORDER: Record<ReviewItemType, number> = {
  placement:           0,
  level_movement:      1,
  curriculum_change:   2,
  wrap_up:             3,
  parent_update:       4,
  attendance_exception: 5,
  coach_observation:   6,
  voice_intake:        7,
}

/**
 * Rank review queue items by risk first, then type priority, then age (oldest first).
 */
export function rankReviewItems(items: ReviewQueueItem[]): ReviewQueueItem[] {
  return [...items].sort((a, b) => {
    const riskDiff = RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]
    if (riskDiff !== 0) return riskDiff
    const typeDiff = TYPE_ORDER[a.itemType] - TYPE_ORDER[b.itemType]
    if (typeDiff !== 0) return typeDiff
    return b.waitingDays - a.waitingDays  // older first
  })
}

// ── Message builders ───────────────────────────────────────────────────────────

/**
 * Build DONNA's opening message for the review queue workflow.
 *
 * Example:
 *   "You have 7 items waiting for your decision.
 *    3 are high-risk. Oldest item is 5 days old.
 *    Let's start with the highest-impact item."
 */
export function buildReviewQueueOpening(items: ReviewQueueItem[]): string {
  if (items.length === 0) {
    return 'Your review queue is clear. No items are waiting for your decision.'
  }

  const highRisk = items.filter(i => i.riskLevel === 'high').length
  const maxWait  = Math.max(...items.map(i => i.waitingDays))
  const ranked   = rankReviewItems(items)
  const first    = ranked[0]

  const lines: string[] = [
    `You have **${items.length} item${items.length === 1 ? '' : 's'}** waiting for your decision.`,
  ]

  if (highRisk > 0) {
    lines.push(`${highRisk} ${highRisk === 1 ? 'is' : 'are'} high-risk.`)
  }

  if (maxWait > 1) {
    lines.push(`Oldest item has been waiting ${maxWait} days.`)
  }

  lines.push('')
  lines.push(`Let's start with the highest-impact item: **${first.subjectLabel}**.`)

  return lines.join('\n')
}

/**
 * Build DONNA's presentation of a single review item.
 */
export function buildReviewItemMessage(
  item: ReviewQueueItem,
  itemIndex: number,
  totalItems: number,
): string {
  const riskBadge =
    item.riskLevel === 'high'   ? '🔴 High risk' :
    item.riskLevel === 'medium' ? '🟡 Medium risk' :
    '🟢 Low risk'

  const typeLabel = reviewItemTypeLabel(item.itemType)
  const waitNote  = item.waitingDays > 1
    ? `Waiting ${item.waitingDays} days.`
    : 'Just submitted.'

  const lines: string[] = [
    `**Item ${itemIndex} of ${totalItems} — ${typeLabel}**`,
    `**${item.subjectLabel}**`,
    '',
    item.summary,
  ]

  if (item.context) {
    lines.push('', `_Context: ${item.context}_`)
  }

  lines.push(
    '',
    `${riskBadge} · ${waitNote}`,
    item.submittedBy ? `Submitted by: ${item.submittedBy}` : '',
    '',
    'Would you like to **approve**, **edit**, **reject**, or **skip**?',
  )

  return lines.filter(Boolean).join('\n')
}

/**
 * Build DONNA's acknowledgement after a review decision.
 */
export function buildReviewDecisionAcknowledgement(
  item: ReviewQueueItem,
  choice: 'approved' | 'rejected' | 'skipped' | 'adjusted',
  nextItem: ReviewQueueItem | null,
  completedCount: number,
  totalCount: number,
): string {
  const choiceLabel =
    choice === 'approved'  ? `**${item.subjectLabel}** approved. Queued for execution.` :
    choice === 'rejected'  ? `**${item.subjectLabel}** rejected.` :
    choice === 'adjusted'  ? `Clarification requested for **${item.subjectLabel}**.` :
    `**${item.subjectLabel}** skipped.`

  const progressNote = `Progress: ${completedCount} of ${totalCount} items decided.`

  if (!nextItem) {
    return [
      choiceLabel,
      '',
      progressNote,
      '',
      'All items reviewed. Type **"summary"** to see the session summary.',
    ].join('\n')
  }

  return [
    choiceLabel,
    '',
    progressNote,
    '',
    `Moving to: **${nextItem.subjectLabel}**.`,
  ].join('\n')
}

/**
 * Build the review & decide completion summary.
 */
export function buildReviewDecideCompletionSummary(
  approved:  number,
  rejected:  number,
  skipped:   number,
  remaining: number,
): ReviewDecideCompletion {
  const total = approved + rejected + skipped
  const nextWorkflow: GoalType | null = null  // determined by caller

  const summaryMessage = [
    '**Review & Decide — Complete**',
    '',
    approved > 0  ? `${approved} item${approved === 1 ? '' : 's'} approved — queued for execution.` : '',
    rejected > 0  ? `${rejected} item${rejected === 1 ? '' : 's'} rejected.` : '',
    skipped  > 0  ? `${skipped} item${skipped === 1 ? '' : 's'} skipped for later.` : '',
    remaining > 0 ? `${remaining} item${remaining === 1 ? '' : 's'} remain in the queue.` : '',
    '',
    approved > 0
      ? 'Approved items will execute via execute_approved_action() after processing.'
      : '',
    remaining === 0 ? 'Your review queue is clear.' : '',
  ].filter(Boolean).join('\n')

  return {
    totalReviewed: total,
    approved,
    rejected,
    skipped,
    summaryMessage,
    nextWorkflow,
  }
}

/**
 * Return the next review item after a decision, or null if the queue is empty.
 */
export function getNextReviewItem(
  rankedItems: ReviewQueueItem[],
  decidedActionIds: Set<string>,
): ReviewQueueItem | null {
  return rankedItems.find(item => !decidedActionIds.has(item.actionId)) ?? null
}

// ── Helper labels ──────────────────────────────────────────────────────────────

function reviewItemTypeLabel(type: ReviewItemType): string {
  const labels: Record<ReviewItemType, string> = {
    placement:            'Player Placement',
    wrap_up:              'Coach Wrap-Up',
    curriculum_change:    'Curriculum Change',
    parent_update:        'Parent Update',
    level_movement:       'Level Movement',
    attendance_exception: 'Attendance Exception',
    coach_observation:    'Coach Observation',
    voice_intake:         'Voice Intake',
  }
  return labels[type]
}
