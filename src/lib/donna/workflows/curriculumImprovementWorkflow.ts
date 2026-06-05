// Mega Sprint 2216–2240 — DONNA Goal Completion Engine V1
// Curriculum Improvement Workflow Orchestrator
//
// Guides the director through curriculum improvements level by level:
//   1. Identify most blocked level (by player stall rate + gate completion)
//   2. Explain the bottleneck
//   3. Show evidence (stall data, observations, gap analysis)
//   4. Ask: review improvement plan / edit requirement / add drill / add cue / defer
//   5. Create draft changes only — never mutate official curriculum directly
//   6. Send high-risk edits to Review & Decide queue
//
// Example DONNA message:
//   "Orange Ball 2 is blocked by backhand preparation.
//    I recommend adding one coach cue and one drill progression.
//    Would you like to review the draft improvement plan?"
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic: same context → same output.
//   - DONNA drafts only. Director approves. Curriculum changes go through Review & Decide.
//   - No automatic curriculum mutations under any circumstance.

import type { GoalType } from './donnaGoalCompletionModel'

// ── Input types ────────────────────────────────────────────────────────────────

export interface CurriculumLevelBottleneck {
  levelKey:           string
  levelLabel:         string
  stalledPlayerCount: number
  totalPlayerCount:   number
  stallRate:          number          // 0–1
  primaryBottleneck:  string          // e.g. "backhand preparation"
  bottleneckDomain:   CurriculumDomain
  evidenceCount:      number
  gateCompletionRate: number          // 0–1
  lastAssessmentDate: string | null
  coachObservations:  string[]
}

export type CurriculumDomain = 'skill' | 'fitness' | 'mental' | 'competition'

export interface CurriculumImprovementDraft {
  levelKey:          string
  levelLabel:        string
  changeType:        CurriculumChangeType
  changeDescription: string
  affectedPlayers:   number
  riskLevel:         'low' | 'medium' | 'high'
  requiresApproval:  boolean
  draftSummary:      string
}

export type CurriculumChangeType =
  | 'add_drill'
  | 'add_coach_cue'
  | 'edit_requirement'
  | 'add_assessment_gate'
  | 'reorder_progression'
  | 'adjust_level_goal'

// ── Output types ───────────────────────────────────────────────────────────────

export interface CurriculumBottleneckMessage {
  donnaMessage:     string
  bottleneck:       CurriculumLevelBottleneck
  improvementDraft: CurriculumImprovementDraft
  userOptions:      CurriculumUserOption[]
  navigationRoute:  string
}

export interface CurriculumUserOption {
  phrase:  string
  label:   string
  intent:  'review' | 'show_evidence' | 'approve' | 'adjust' | 'defer' | 'skip'
}

export interface CurriculumImprovementCompletion {
  totalLevelsReviewed: number
  draftsCreated:       number
  deferred:            number
  summaryMessage:      string
  nextWorkflow:        GoalType | null
}

// ── Message builders ───────────────────────────────────────────────────────────

/**
 * Build the DONNA message presenting the most blocked curriculum level.
 *
 * Example:
 *   "Orange Ball 2 is blocked by backhand preparation.
 *    17 of 24 players are stalling at this level.
 *    I recommend adding one coach cue and one drill progression.
 *    Would you like to review the draft improvement plan?"
 */
export function buildBottleneckIntroMessage(
  bottleneck: CurriculumLevelBottleneck,
  draft: CurriculumImprovementDraft,
  levelIndex: number,
  totalLevels: number,
): string {
  const stallPct = Math.round(bottleneck.stallRate * 100)

  return [
    `**Curriculum Issue ${levelIndex} of ${totalLevels} — ${bottleneck.levelLabel}**`,
    '',
    `**Bottleneck:** ${bottleneck.primaryBottleneck}`,
    `**Domain:** ${domainLabel(bottleneck.bottleneckDomain)}`,
    '',
    `${bottleneck.stalledPlayerCount} of ${bottleneck.totalPlayerCount} players are stalling here (${stallPct}%).`,
    bottleneck.evidenceCount > 0
      ? `${bottleneck.evidenceCount} evidence record${bottleneck.evidenceCount === 1 ? '' : 's'} support this signal.`
      : 'Limited evidence — coach observations are the primary signal.',
    '',
    `**Draft improvement:** ${draft.changeDescription}`,
    `**Risk level:** ${draft.riskLevel}`,
    '',
    'Would you like to **review the draft plan**, **see the evidence**, **adjust**, or **defer**?',
  ].join('\n')
}

/**
 * Build the evidence detail message for a curriculum bottleneck.
 */
export function buildBottleneckEvidenceMessage(
  bottleneck: CurriculumLevelBottleneck,
): string {
  const lines: string[] = [
    `**Evidence — ${bottleneck.levelLabel} — ${bottleneck.primaryBottleneck}**`,
    '',
  ]

  const stallPct = Math.round(bottleneck.stallRate * 100)
  lines.push(`**Player stall rate:** ${stallPct}% (${bottleneck.stalledPlayerCount} of ${bottleneck.totalPlayerCount} players)`)
  lines.push(`**Gate completion rate:** ${Math.round(bottleneck.gateCompletionRate * 100)}%`)

  if (bottleneck.lastAssessmentDate) {
    lines.push(`**Last assessment:** ${bottleneck.lastAssessmentDate}`)
  }

  if (bottleneck.evidenceCount > 0) {
    lines.push(`**Evidence records:** ${bottleneck.evidenceCount}`)
  }

  if (bottleneck.coachObservations.length > 0) {
    lines.push('')
    lines.push('**Coach observations:**')
    bottleneck.coachObservations.slice(0, 3).forEach(obs => lines.push(`— ${obs}`))
  }

  lines.push('')
  lines.push('Would you like to **approve the draft plan**, **adjust a requirement**, or **defer**?')

  return lines.join('\n')
}

/**
 * Build the improvement plan detail message.
 */
export function buildImprovementDraftMessage(
  draft: CurriculumImprovementDraft,
  bottleneck: CurriculumLevelBottleneck,
): string {
  return [
    `**Draft Improvement Plan — ${bottleneck.levelLabel}**`,
    '',
    `**Change type:** ${changeTypeLabel(draft.changeType)}`,
    `**What changes:** ${draft.changeDescription}`,
    '',
    `**Affected players:** ${draft.affectedPlayers}`,
    `**Risk level:** ${draft.riskLevel}`,
    '',
    draft.riskLevel === 'high'
      ? '⚠️ This change is high-risk and will require Review & Decide approval before it takes effect.'
      : 'This is a low-risk draft change. It will go to Review & Decide for your final approval.',
    '',
    '**Status:** Draft only — nothing changes until you approve in Review & Decide.',
    '',
    'Would you like to **approve this draft**, **adjust**, or **defer**?',
  ].join('\n')
}

/**
 * Build the acknowledgement after a director decision on a level.
 */
export function buildImprovementDecisionAcknowledgement(
  levelLabel: string,
  choice: 'approved' | 'adjusted' | 'deferred' | 'skipped',
  nextBottleneck: CurriculumLevelBottleneck | null,
  completedCount: number,
  totalCount: number,
): string {
  const choiceLabel =
    choice === 'approved'  ? `Draft improvement approved for **${levelLabel}**. Sent to Review & Decide.` :
    choice === 'adjusted'  ? `Adjustment noted for **${levelLabel}**. Draft updated in Review & Decide.` :
    choice === 'deferred'  ? `**${levelLabel}** deferred for later.` :
    `**${levelLabel}** skipped.`

  const progressNote = `Progress: ${completedCount} of ${totalCount} levels reviewed.`

  if (!nextBottleneck) {
    return [
      choiceLabel,
      '',
      progressNote,
      '',
      'All levels reviewed. Type **"summary"** to see the curriculum session summary.',
    ].join('\n')
  }

  return [
    choiceLabel,
    '',
    progressNote,
    '',
    `Moving to **${nextBottleneck.levelLabel}**.`,
  ].join('\n')
}

/**
 * Build the workflow opening message.
 */
export function buildCurriculumImprovementOpening(
  bottlenecks: CurriculumLevelBottleneck[],
  mostBlocked: CurriculumLevelBottleneck | null,
): string {
  if (bottlenecks.length === 0 || !mostBlocked) {
    return 'Your curriculum is performing well. No active bottlenecks detected at this time.'
  }

  const countLine = bottlenecks.length === 1
    ? 'I have identified 1 curriculum level with an active bottleneck.'
    : `I have identified ${bottlenecks.length} curriculum levels with active bottlenecks.`

  const stallPct = Math.round(mostBlocked.stallRate * 100)

  return [
    countLine,
    '',
    `The most blocked level is **${mostBlocked.levelLabel}** — ${mostBlocked.primaryBottleneck}.`,
    `${stallPct}% of players are stalling here.`,
    '',
    "Let's start there.",
  ].join('\n')
}

/**
 * Build the completion summary for the curriculum improvement workflow.
 */
export function buildCurriculumImprovementSummary(
  reviewed: number,
  approved: number,
  deferred: number,
  pendingReviewItems: number,
): CurriculumImprovementCompletion {
  const nextWorkflow: GoalType | null = pendingReviewItems > 0 ? 'review_queue' : null

  const summaryMessage = [
    '**Curriculum Improvement — Complete**',
    '',
    approved > 0
      ? `${approved} draft improvement plan${approved === 1 ? '' : 's'} sent to Review & Decide.`
      : '',
    deferred > 0
      ? `${deferred} level${deferred === 1 ? '' : 's'} deferred for later.`
      : '',
    '',
    approved > 0
      ? 'Draft improvements are queued in Review & Decide. Nothing is published until you approve.'
      : '',
    '',
    nextWorkflow
      ? 'Your Review & Decide queue has items waiting. Would you like to work through those now?'
      : 'All curriculum work is up to date.',
  ].filter(Boolean).join('\n')

  return {
    totalLevelsReviewed: reviewed,
    draftsCreated:       approved,
    deferred,
    summaryMessage,
    nextWorkflow,
  }
}

// ── Helper labels ──────────────────────────────────────────────────────────────

function domainLabel(domain: CurriculumDomain): string {
  const labels: Record<CurriculumDomain, string> = {
    skill:       'Skill',
    fitness:     'Fitness',
    mental:      'Mental',
    competition: 'Competition',
  }
  return labels[domain]
}

function changeTypeLabel(type: CurriculumChangeType): string {
  const labels: Record<CurriculumChangeType, string> = {
    add_drill:            'Add drill',
    add_coach_cue:        'Add coach cue',
    edit_requirement:     'Edit requirement',
    add_assessment_gate:  'Add assessment gate',
    reorder_progression:  'Reorder progression',
    adjust_level_goal:    'Adjust level goal',
  }
  return labels[type]
}
