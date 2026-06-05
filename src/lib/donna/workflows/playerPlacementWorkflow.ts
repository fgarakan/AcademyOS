// Mega Sprint 2216–2240 — DONNA Goal Completion Engine V1
// Player Placement Workflow Orchestrator
//
// Guides the director through pending player placements one by one:
//   1. Show first pending player
//   2. Summarize recommended placement
//   3. Explain evidence (assessment, coach notes, intake)
//   4. Ask: approve / review evidence / adjust level / skip
//   5. Move to next player
//   6. End with completion summary
//
// DONNA must not silently approve. Human approval required for every placement.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic: same context → same output.
//   - finalize_player_placement() is the ONLY valid placement activation path.
//   - DONNA builds placement draft. Director approves. System executes.

import type { GoalType } from './donnaGoalCompletionModel'
import type { GoalStepRecord } from './donnaGoalCompletionModel'

// ── Input types ────────────────────────────────────────────────────────────────

export interface PendingPlacementPlayer {
  playerId:           string
  playerName:         string
  playerAge:          number | null
  currentStatus:      string
  recommendedLevel:   string
  recommendedLevelId: string | null
  recommendationBasis: string
  confidenceLabel:    'high' | 'medium' | 'low'
  evidenceSummary:    PlacementEvidence
  waitingDays:        number
}

export interface PlacementEvidence {
  assessmentScore:   number | null
  assessmentDate:    string | null
  coachNoteCount:    number
  intakeNotes:       string | null
  observationCount:  number
  lastObservationAt: string | null
}

// ── Output types ───────────────────────────────────────────────────────────────

export interface PlacementWorkflowStep {
  stepType:         'player_intro' | 'evidence_detail' | 'summary'
  donnaMessage:     string
  playerContext:    PendingPlacementPlayer | null
  userOptions:      PlacementUserOption[]
  requiresApproval: boolean
  navigationHint:   string | null
}

export interface PlacementUserOption {
  phrase:  string
  label:   string
  intent:  'approve' | 'show_evidence' | 'adjust' | 'skip' | 'next' | 'stop'
}

export interface PlacementWorkflowResult {
  stepRecord:    GoalStepRecord
  donnaResponse: string
  nextPlayer:    PendingPlacementPlayer | null
  isComplete:    boolean
  completionSummary: PlacementCompletionSummary | null
}

export interface PlacementCompletionSummary {
  totalReviewed: number
  approved:      number
  skipped:       number
  adjusted:      number
  summaryMessage: string
}

// ── Message builders ───────────────────────────────────────────────────────────

/**
 * Build the DONNA intro message for a single player placement review.
 *
 * Example output:
 * "Jake is recommended for Green Ball 2 based on assessment and coach notes.
 *  Would you like to approve, review evidence, adjust, or skip?"
 */
export function buildPlayerPlacementIntroMessage(
  player: PendingPlacementPlayer,
  playerIndex: number,
  totalPending: number,
): string {
  const confidence = player.confidenceLabel === 'high'
    ? 'High confidence'
    : player.confidenceLabel === 'medium'
    ? 'Medium confidence'
    : 'Lower confidence — review evidence recommended'

  const waitNote = player.waitingDays > 3
    ? `Waiting ${player.waitingDays} days.`
    : ''

  return [
    `**Player ${playerIndex} of ${totalPending} — ${player.playerName}**`,
    '',
    `**Recommended level:** ${player.recommendedLevel}`,
    `**Basis:** ${player.recommendationBasis}`,
    `**Confidence:** ${confidence}`,
    waitNote ? `**${waitNote}**` : '',
    '',
    'Would you like to **approve**, **review evidence**, **adjust the level**, or **skip**?',
  ].filter(Boolean).join('\n')
}

/**
 * Build the evidence detail message for a player placement.
 *
 * Example output:
 * "Here is the supporting evidence for Jake's Green Ball 2 recommendation.
 *  Assessment: 7.2/10 (2 weeks ago). 3 coach observations. Coach noted: strong rally consistency."
 */
export function buildPlacementEvidenceMessage(
  player: PendingPlacementPlayer,
): string {
  const evidence = player.evidenceSummary
  const lines: string[] = [
    `**Evidence for ${player.playerName} — ${player.recommendedLevel}**`,
    '',
  ]

  if (evidence.assessmentScore !== null) {
    const dateStr = evidence.assessmentDate ? ` (${evidence.assessmentDate})` : ''
    lines.push(`**Assessment score:** ${evidence.assessmentScore}/10${dateStr}`)
  } else {
    lines.push('**Assessment score:** Not available')
  }

  if (evidence.observationCount > 0) {
    const obsDate = evidence.lastObservationAt ? ` — last on ${evidence.lastObservationAt}` : ''
    lines.push(`**Coach observations:** ${evidence.observationCount}${obsDate}`)
  } else {
    lines.push('**Coach observations:** None recorded')
  }

  if (evidence.coachNoteCount > 0) {
    lines.push(`**Coach notes:** ${evidence.coachNoteCount} note${evidence.coachNoteCount === 1 ? '' : 's'}`)
  }

  if (evidence.intakeNotes) {
    lines.push(`**Intake notes:** ${evidence.intakeNotes}`)
  }

  lines.push('')
  lines.push('Does this evidence support the recommendation? Would you like to **approve**, **adjust the level**, or **skip**?')

  return lines.join('\n')
}

/**
 * Build DONNA's message after a placement decision.
 *
 * @param player         The player just decided on
 * @param choice         Director's decision
 * @param nextPlayer     Next player to review (or null if done)
 * @param completedCount Count of placements decided so far
 * @param totalCount     Total pending placements
 */
export function buildPlacementDecisionAcknowledgement(
  player: PendingPlacementPlayer,
  choice: 'approved' | 'adjusted' | 'skipped',
  nextPlayer: PendingPlacementPlayer | null,
  completedCount: number,
  totalCount: number,
): string {
  const choiceLabel =
    choice === 'approved' ? `Placement approved for **${player.playerName}** at **${player.recommendedLevel}**. Queued for execution.` :
    choice === 'adjusted' ? `Adjustment recorded for **${player.playerName}**. Draft sent to Review & Decide.` :
    `**${player.playerName}** skipped.`

  const progressNote = `Progress: ${completedCount} of ${totalCount} players reviewed.`

  if (!nextPlayer) {
    return [
      choiceLabel,
      '',
      progressNote,
      '',
      'All players reviewed. Type **"summary"** to see the placement session summary.',
    ].join('\n')
  }

  return [
    choiceLabel,
    '',
    progressNote,
    '',
    `Moving to **${nextPlayer.playerName}**.`,
  ].join('\n')
}

/**
 * Build the placement session completion summary.
 */
export function buildPlacementCompletionSummary(
  stepHistory: GoalStepRecord[],
  players: PendingPlacementPlayer[],
): PlacementCompletionSummary {
  const approved  = stepHistory.filter(s => s.directorChoice === 'approved').length
  const adjusted  = stepHistory.filter(s => s.directorChoice === 'adjusted').length
  const skipped   = stepHistory.filter(s => s.directorChoice === 'skipped').length
  const total     = stepHistory.length

  const summaryMessage = [
    '**Player Placement — Complete**',
    '',
    `${approved} placement${approved === 1 ? '' : 's'} approved${adjusted > 0 ? `, ${adjusted} adjusted` : ''}.`,
    skipped > 0 ? `${skipped} player${skipped === 1 ? '' : 's'} skipped — available for next session.` : '',
    '',
    approved > 0
      ? 'Approved placements are queued for execution. They will be activated after director confirmation in the Review Center.'
      : '',
    '',
    'What would you like to do next?',
  ].filter(Boolean).join('\n')

  return { totalReviewed: total, approved, skipped, adjusted, summaryMessage }
}

/**
 * Build the initial DONNA opening message for the placement workflow.
 *
 * @param pendingCount  Number of players waiting for placement
 * @param firstPlayer   First player to review (or null if list is empty)
 */
export function buildPlacementWorkflowOpening(
  pendingCount: number,
  firstPlayer: PendingPlacementPlayer | null,
): string {
  if (pendingCount === 0 || !firstPlayer) {
    return 'There are no players currently waiting for placement. Your placement queue is clear.'
  }

  const countLine = pendingCount === 1
    ? 'There is 1 player waiting for placement.'
    : `There are ${pendingCount} players waiting for placement.`

  const blockingNote = pendingCount > 2
    ? 'This is blocking coach planning and parent onboarding.'
    : 'Unplaced players cannot join groups or access the player portal.'

  return [
    countLine,
    blockingNote,
    '',
    `Let's start with **${firstPlayer.playerName}**.`,
  ].join('\n')
}

/**
 * Determine the next recommended workflow after placement is complete.
 */
export function getPlacementNextWorkflow(
  pendingReviewItems: number,
): GoalType | null {
  if (pendingReviewItems > 0) return 'review_queue'
  return null
}
