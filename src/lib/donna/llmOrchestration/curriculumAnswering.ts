// Sprint 1015 — DONNA Curriculum Question Answering V1
// Converts a live CurriculumContextSummary into a COO-quality, prioritized DONNA answer.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// Purpose:
//   When a director asks about curriculum status ("do we have curriculum changes pending?",
//   "how many levels does our curriculum have?", "is there anything in curriculum review?"),
//   this module converts the live CurriculumContextSummary into a clear director-facing answer.
//
// Safety invariants:
//   - No raw curriculum content returned (no learning objectives, no drill descriptions)
//   - Counts and structure flags only
//   - Pending curriculum drafts → route to Review Queue (approval required, not auto-applied)
//   - Never exposes player names, coach notes, or sensitive curriculum rationale
//   - Never claims curriculum changes are applied — always routes through approval

import type { CurriculumContextSummary } from './curriculumContextRetrieval'

// ── Answer type ───────────────────────────────────────────────────────────────

export interface CurriculumIntelligenceAnswer {
  /** COO-style DONNA response text */
  donnaText: string
  /** Optional primary action label */
  primaryActionLabel?: string
  /** Optional route suggestion */
  suggestedRoute?: string
  /** Optional UI element to highlight */
  highlightTargetId?: string
  /** Route where the highlight target lives */
  highlightRoute?: string
}

// ── Answer builder ────────────────────────────────────────────────────────────

/**
 * Build a COO-quality DONNA answer from a live CurriculumContextSummary.
 *
 * Priority order:
 *   1. Pending curriculum change drafts → action required (approval gate)
 *   2. Levels without content (V2 — currently always 0)
 *   3. Total level count → baseline structural context
 *
 * Never returns raw curriculum content (learning objectives, drill text, etc.)
 * Pending drafts → route to Review Queue, not auto-applied.
 */
export function buildCurriculumContextAnswer(
  summary: CurriculumContextSummary,
): CurriculumIntelligenceAnswer {
  const lines: string[] = []
  let primaryActionLabel: string | undefined
  let suggestedRoute: string | undefined
  let highlightTargetId: string | undefined
  let highlightRoute: string | undefined

  // Pending drafts — primary signal (approval required)
  if (summary.hasCurriculumDraft && summary.pendingCurriculumDrafts > 0) {
    lines.push(
      summary.pendingCurriculumDrafts === 1
        ? '1 curriculum change draft is waiting for your review in the Review Queue.'
        : `${summary.pendingCurriculumDrafts} curriculum change drafts are waiting for your review in the Review Queue.`,
    )
    lines.push('These are proposed changes only — nothing is applied until you approve each one.')
    primaryActionLabel = `Review ${summary.pendingCurriculumDrafts} curriculum draft${summary.pendingCurriculumDrafts !== 1 ? 's' : ''}`
    suggestedRoute = '/director/review'
    highlightTargetId = 'review-queue-primary'
    highlightRoute = '/director/review'
  } else {
    lines.push('No curriculum change drafts are pending in the Review Queue.')
  }

  // Level count — structural context
  if (summary.totalLevels > 0) {
    lines.push(
      `Your curriculum has ${summary.totalLevels} level${summary.totalLevels !== 1 ? 's' : ''} defined.`,
    )
  } else {
    lines.push('No curriculum levels have been defined yet.')
    if (!primaryActionLabel) {
      primaryActionLabel = 'Set up curriculum levels'
      suggestedRoute = '/director/curriculum'
      highlightTargetId = undefined
    }
  }

  // Levels without content (V2 field — currently always 0 until content join is wired)
  if (summary.levelsWithoutContent > 0) {
    lines.push(
      `${summary.levelsWithoutContent} level${summary.levelsWithoutContent !== 1 ? 's have' : ' has'} no content assigned.`,
    )
    if (!primaryActionLabel) {
      primaryActionLabel = 'Add content to empty levels'
      suggestedRoute = '/director/curriculum'
    }
  }

  lines.push('This is a read-only curriculum overview. Nothing changes until you take an explicit action.')

  return {
    donnaText: lines.join(' '),
    primaryActionLabel,
    suggestedRoute,
    highlightTargetId,
    highlightRoute,
  }
}
