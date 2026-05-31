// Sprint 1014 — DONNA Player Development Question Answering V1
// Converts a live PlayerProfileSummary into a COO-quality, prioritized DONNA answer.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// Purpose:
//   The raw PlayerProfileSummary contains director-safe flags for a single player.
//   This module converts them into a COO-style answer that:
//     - Leads with the most actionable signal
//     - Frames context in terms of what the director should consider
//     - Never exposes player names, coach notes, or assessment scores
//     - Always ends with a safety note ("nothing changes until you act")
//
// Usage (from toolResultInterpreter.ts):
//   const answer = buildPlayerProfileAnswer(profileSummary)
//   answer.donnaText      → the DONNA response text
//   answer.suggestedRoute → optional route recommendation
//   answer.highlightTargetId → optional UI element to highlight

import type { PlayerProfileSummary } from './playerProfileRetrieval'

// ── Answer type ───────────────────────────────────────────────────────────────

export interface PlayerProfileAnswer {
  /** COO-style DONNA response text */
  donnaText: string
  /** Optional primary action label */
  primaryActionLabel?: string
  /** Optional route suggestion */
  suggestedRoute?: string
  /** Optional UI element to highlight on the player profile page */
  highlightTargetId?: string
}

// ── Status labels ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  active: 'active',
  pending_placement: 'pending curriculum placement',
  on_hold: 'on hold',
  inactive: 'inactive',
}

function formatStatus(status: string | null): string {
  if (!status) return 'unknown status'
  return STATUS_LABEL[status] ?? status.replace(/_/g, ' ')
}

// ── Answer builder ────────────────────────────────────────────────────────────

/**
 * Build a COO-quality DONNA answer from a live PlayerProfileSummary.
 *
 * Priority order:
 *   1. Assessment overdue → most urgent — director attention needed now
 *   2. Advancement eligible → action signal — review window may be closing
 *   3. Player status (if not 'active') → structural signal
 *   4. Active priority count → development focus context
 *   5. Recent session activity → engagement context
 *   6. Evidence count → development evidence context
 *   7. Current level → baseline context
 *
 * Never returns player names, coach notes, assessment scores, or raw IDs.
 */
export function buildPlayerProfileAnswer(profile: PlayerProfileSummary): PlayerProfileAnswer {
  const lines: string[] = []
  const signals: string[] = []
  let primaryActionLabel: string | undefined
  let suggestedRoute: string | undefined
  let highlightTargetId: string | undefined

  // Level context as the opening baseline
  if (profile.currentLevelLabel) {
    lines.push(`This player is at level ${profile.currentLevelLabel}.`)
  } else {
    lines.push('This player does not have a curriculum level assigned yet.')
    primaryActionLabel = 'Assign curriculum level'
    suggestedRoute = undefined // player profile already open
    highlightTargetId = 'player-skill-path'
  }

  // Status (only surface if not plain active)
  if (profile.playerStatus && profile.playerStatus !== 'active') {
    signals.push(`Player status: ${formatStatus(profile.playerStatus)}.`)
  }

  // Priority 1: assessment overdue
  if (profile.assessmentOverdue) {
    signals.push('An assessment is overdue for this player — scheduling one is recommended.')
    if (!primaryActionLabel) {
      primaryActionLabel = 'Schedule assessment'
      highlightTargetId = 'player-assessment-tab'
    }
  }

  // Priority 2: advancement eligible
  if (profile.advancementEligible) {
    signals.push('This player has been flagged as advancement-eligible. An advancement review may be appropriate.')
    if (!primaryActionLabel) {
      primaryActionLabel = 'Review advancement eligibility'
      highlightTargetId = 'player-skill-path'
    }
  }

  // Priority 3: priorities
  if (profile.activePriorityCount > 0) {
    signals.push(
      profile.activePriorityCount === 1
        ? '1 active development priority is set.'
        : `${profile.activePriorityCount} active development priorities are set.`,
    )
  } else {
    signals.push('No active development priorities are set.')
  }

  // Priority 4: recent session activity
  if (profile.recentSessionCount === 0) {
    signals.push('No sessions recorded in the last 30 days.')
  } else {
    signals.push(
      profile.recentSessionCount === 1
        ? '1 session recorded in the last 30 days.'
        : `${profile.recentSessionCount} sessions recorded in the last 30 days.`,
    )
  }

  // Priority 5: evidence
  if (profile.evidenceCount > 0) {
    signals.push(
      profile.evidenceCount === 1
        ? '1 development evidence record on file.'
        : `${profile.evidenceCount} development evidence records on file.`,
    )
  }

  if (signals.length > 0) lines.push(signals.join(' '))

  lines.push('This is a read-only summary. Nothing about this player changes until you take an explicit action.')

  return {
    donnaText: lines.join(' '),
    primaryActionLabel,
    suggestedRoute,
    highlightTargetId,
  }
}
