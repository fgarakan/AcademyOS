// Sprint 1013 — DONNA Academy Intelligence Answering V1
// Converts raw academy state and player development retrieval data into
// COO-quality, prioritized, actionable DONNA answers.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// Purpose:
//   The raw AcademyStateSummary and PlayerDevelopmentSummary contain counts and flags.
//   This module converts them into natural language answers that:
//     - Prioritize the most urgent signal first
//     - Frame context in COO terms (health, decision, attention)
//     - Include a primary action when one is indicated
//     - Never guess — only answer from what the data shows
//     - Never expose player names, coach notes, or private identifiers
//
// Usage (from toolResultInterpreter.ts):
//   const answer = buildAcademyStateAnswer(stateSummary)
//   answer.donnaText      → the DONNA response text
//   answer.suggestedRoute → optional route to suggest
//   answer.highlightTargetId → optional UI element to highlight

import type { AcademyStateSummary } from './types'
import type { PlayerDevelopmentSummary } from './playerDevelopmentRetrieval'

// ── Answer types ──────────────────────────────────────────────────────────────

export interface AcademyIntelligenceAnswer {
  /** The DONNA response text — COO-style, prioritized, actionable */
  donnaText: string
  /** Optional primary action label (shown as suggestion, never auto-executed) */
  primaryActionLabel?: string
  /** Optional route to suggest (for "Go to X" button in response card) */
  suggestedRoute?: string
  /** Optional UI element to highlight on arrival */
  highlightTargetId?: string
  /** Route where the highlight target lives */
  highlightRoute?: string
}

// ── Health signal helpers ─────────────────────────────────────────────────────

const HEALTH_HEADLINE: Record<AcademyStateSummary['academyHealthSignal'], string> = {
  on_track: 'Your academy is on track.',
  attention_needed: 'A few things need your attention.',
  critical: 'Your academy has critical items that need your decision now.',
  unknown: 'Academy status is not fully available — here is what I can see.',
}

const HEALTH_TONE: Record<AcademyStateSummary['academyHealthSignal'], string> = {
  on_track: 'Overall, things look healthy.',
  attention_needed: '',
  critical: '',
  unknown: '',
}

// ── Academy state answer builder ──────────────────────────────────────────────

/**
 * Build a COO-quality academy intelligence answer from a live AcademyStateSummary.
 *
 * Priority order (highest urgency first):
 *   1. Pending review items (director decision required)
 *   2. Missing session recaps (operational gap)
 *   3. Players needing placement (readiness gap)
 *   4. Advancement-eligible players (opportunity)
 *   5. Session context (day-of operational context)
 *   6. Player count (baseline context)
 *
 * Never exposes player names, coach notes, or raw IDs.
 */
export function buildAcademyStateAnswer(state: AcademyStateSummary): AcademyIntelligenceAnswer {
  const lines: string[] = []
  const headline = HEALTH_HEADLINE[state.academyHealthSignal]
  lines.push(headline)

  // Priority signals in urgency order
  const signals: string[] = []

  if (state.pendingReviewCount > 0) {
    signals.push(
      state.pendingReviewCount === 1
        ? `1 item is waiting for your decision in the Review Queue.`
        : `${state.pendingReviewCount} items are waiting for your decision in the Review Queue.`,
    )
  }

  if (state.hasMissingRecaps) {
    signals.push('One or more past sessions are missing coach wrap-ups.')
  }

  if (state.hasPlayersNeedingPlacement) {
    signals.push('Some players are waiting for a curriculum placement decision.')
  }

  if (state.hasAdvancementEligiblePlayers) {
    signals.push('Some players have been flagged as advancement-eligible — a review may be appropriate.')
  }

  if (state.todaySessionCount > 0) {
    signals.push(
      state.todaySessionCount === 1
        ? '1 session is scheduled for today.'
        : `${state.todaySessionCount} sessions are scheduled for today.`,
    )
  }

  if (signals.length === 0) {
    const tone = HEALTH_TONE[state.academyHealthSignal]
    if (tone) lines.push(tone)
    if (state.activePlayers > 0) {
      lines.push(`You have ${state.activePlayers} active player${state.activePlayers !== 1 ? 's' : ''}.`)
    }
    lines.push('No immediate action required based on current signals.')
  } else {
    lines.push(signals.join(' '))
    if (state.activePlayers > 0) {
      lines.push(`Active players: ${state.activePlayers}.`)
    }
  }

  lines.push('This data is retrieved live from your academy database — nothing here is estimated.')

  // Determine primary action and route
  const hasPendingReviews = state.pendingReviewCount > 0
  const suggestedRoute = hasPendingReviews ? '/director/review' : undefined
  const highlightTargetId = hasPendingReviews ? 'review-queue-primary' : undefined
  const highlightRoute = hasPendingReviews ? '/director/review' : undefined
  const primaryActionLabel = hasPendingReviews
    ? `Review ${state.pendingReviewCount} pending item${state.pendingReviewCount !== 1 ? 's' : ''}`
    : state.hasMissingRecaps
    ? 'Check missing session recaps'
    : undefined

  return {
    donnaText: lines.join(' '),
    primaryActionLabel,
    suggestedRoute,
    highlightTargetId,
    highlightRoute,
  }
}

// ── Player development answer builder ────────────────────────────────────────

/**
 * Build a COO-quality player development intelligence answer.
 *
 * Priority order:
 *   1. Players needing placement (blocking signal)
 *   2. Advancement-eligible players (action signal)
 *   3. Assessment overdue (attention signal)
 *   4. Players without curriculum level (gap signal)
 *   5. Total active players + level coverage (baseline context)
 *
 * Never exposes player names or individual player IDs.
 */
export function buildPlayerDevelopmentAnswer(dev: PlayerDevelopmentSummary): AcademyIntelligenceAnswer {
  const lines: string[] = []
  const signals: string[] = []

  if (dev.playersNeedingPlacement > 0) {
    signals.push(
      dev.playersNeedingPlacement === 1
        ? '1 player is waiting for a curriculum placement decision.'
        : `${dev.playersNeedingPlacement} players are waiting for curriculum placement decisions.`,
    )
  }

  if (dev.advancementEligibleCount > 0) {
    signals.push(
      dev.advancementEligibleCount === 1
        ? '1 player has been flagged as advancement-eligible.'
        : `${dev.advancementEligibleCount} players have been flagged as advancement-eligible.`,
    )
  }

  const overdue = dev.attentionFlags.assessmentOverdue
  if (overdue > 0) {
    signals.push(
      overdue === 1
        ? '1 player has an overdue assessment.'
        : `${overdue} players have overdue assessments.`,
    )
  }

  if (dev.playersWithoutCurriculumLevel > 0) {
    signals.push(
      `${dev.playersWithoutCurriculumLevel} player${dev.playersWithoutCurriculumLevel !== 1 ? 's have' : ' has'} no curriculum level assigned.`,
    )
  }

  // Headline
  if (signals.length > 0) {
    lines.push('Here is your live player development picture:')
    lines.push(signals.join(' '))
  } else {
    lines.push('Your player development signals look healthy.')
  }

  // Baseline context
  if (dev.totalActivePlayers > 0) {
    const coverage = dev.playersWithCurriculumLevel
    lines.push(
      `Total active players: ${dev.totalActivePlayers}. ${coverage} of them have a curriculum level assigned.`,
    )
  }

  lines.push('These counts come directly from your academy database. Nothing changes until you take an explicit action.')

  // Determine primary action
  const hasPlacementNeeded = dev.playersNeedingPlacement > 0
  const hasAdvancement = dev.advancementEligibleCount > 0
  const suggestedRoute = hasPlacementNeeded || hasAdvancement ? '/director/players' : undefined
  const highlightTargetId = suggestedRoute ? 'player-list' : undefined
  const primaryActionLabel = hasPlacementNeeded
    ? `Review ${dev.playersNeedingPlacement} player${dev.playersNeedingPlacement !== 1 ? 's' : ''} needing placement`
    : hasAdvancement
    ? `Review ${dev.advancementEligibleCount} advancement-eligible player${dev.advancementEligibleCount !== 1 ? 's' : ''}`
    : undefined

  return {
    donnaText: lines.join(' '),
    primaryActionLabel,
    suggestedRoute,
    highlightTargetId,
    highlightRoute: suggestedRoute,
  }
}
