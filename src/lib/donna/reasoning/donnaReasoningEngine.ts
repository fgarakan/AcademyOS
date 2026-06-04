// Sprint 1911–1960 — DONNA Reasoning + Memory Optimization V1
// Why / Why now / Why first reasoning engine.
//
// DONNA should not only route — she should reason.
// Every recommendation explains:
//   - why it matters
//   - why it matters NOW
//   - why to do it FIRST
//   - what risk it reduces
//   - what it unlocks for the academy
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic: same input → same reasoning block.
//   - No invented data — only reasons derivable from the intent + goal.
//   - Reasoning is advisory framing, not instructions.

import type { DirectorIntent } from '@/lib/donna/intent/donnaIntentEngine'
import type { DirectorGoal } from '@/lib/donna/goals/donnaGoalEngine'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReasoningBlock {
  /** Why this matters to the academy. 1–2 sentences. */
  why: string
  /** Why it matters specifically right now. 1 sentence. */
  whyNow: string
  /** Why this should be done first (vs. other items). 1 sentence. */
  whyFirst: string
  /** What risk or friction this action reduces. */
  riskReduced: string
  /** What becomes possible after this is done. */
  whatItUnlocks: string
}

export interface ReasoningInput {
  intent: DirectorIntent | null
  goal: DirectorGoal | null
  entityLabel: string | null
  pendingReviews: number
}

// ── Reasoning templates ───────────────────────────────────────────────────────
// Each key maps to a reasoning block template.
// Templates use {entity} as a placeholder for the subject label.

const REASONING_MAP: Record<DirectorGoal, Omit<ReasoningBlock, 'whyNow'> & { whyNowBase: string }> = {
  curriculum_completion: {
    why: 'Curriculum definition gaps make it harder for coaches to plan sessions consistently and for DONNA to answer player progress questions accurately.',
    whyNowBase: 'Completing this level now prevents it from blocking session planning and assessments.',
    whyFirst: 'Curriculum is the foundation — without it, coaching language, assessments, and parent updates lack a shared reference.',
    riskReduced: 'Reduces inconsistency between what coaches teach and what players and parents are told to expect.',
    whatItUnlocks: 'Unlocks accurate level-readiness assessments, parent progress summaries, and session plan alignment.',
  },
  academy_setup_completion: {
    why: 'Incomplete academy setup limits what DONNA can do and what parents and players see in their portals.',
    whyNowBase: 'Setup completion is a prerequisite for onboarding coaches, creating player profiles, and activating parent access.',
    whyFirst: 'Until setup is complete, every other workflow is operating on partial information.',
    riskReduced: 'Reduces incorrect assumptions in coach briefings and parent communication.',
    whatItUnlocks: 'Unlocks full coach workspace, player portal, and parent portal functionality.',
  },
  player_onboarding_completion: {
    why: 'Players without a complete profile cannot be placed into curriculum levels, assigned to coaches, or tracked for development progress.',
    whyNowBase: 'Every week without a profile is a week without trackable development data.',
    whyFirst: "A player's profile is the anchor for all development signals, assessments, and parent visibility.",
    riskReduced: 'Prevents gaps in attendance records, development tracking, and parent communication.',
    whatItUnlocks: "Unlocks the player's curriculum path, coach assignment, and parent portal view.",
  },
  assessment_completion: {
    why: 'Structured assessments are the only objective signal DONNA has for level readiness. Without them, advancement decisions are informal.',
    whyNowBase: 'Completing this assessment now establishes a baseline for the upcoming review cycle.',
    whyFirst: 'Assessment data feeds into parent updates, level decisions, and DONNA\'s development recommendations.',
    riskReduced: "Reduces the risk of level decisions made without documented evidence.",
    whatItUnlocks: "Unlocks a documented readiness signal that DONNA and the director can reference in parent updates and advancement reviews.",
  },
  parent_update_completion: {
    why: 'Parents with no recent update are more likely to feel disconnected from their child\'s progress, and less likely to engage with the program.',
    whyNowBase: 'The longer this update waits, the less relevant it becomes to the current development phase.',
    whyFirst: 'Parent trust is built by consistent, timely communication — not just when there\'s a problem.',
    riskReduced: 'Reduces parent anxiety and reactive parent inquiries.',
    whatItUnlocks: "Unlocks parent engagement and positions the academy as proactively communicative.",
  },
  readiness_review_completion: {
    why: 'Level readiness reviews are the director\'s primary tool for ensuring players are in the right development environment.',
    whyNowBase: 'This player has accumulated enough signals to support an informed review decision.',
    whyFirst: 'Level decisions affect group composition, coach planning, and parent expectations — better to decide now than let ambiguity persist.',
    riskReduced: 'Reduces the risk of a player working in the wrong level for an extended period.',
    whatItUnlocks: 'Unlocks a clear advancement recommendation that DONNA can reference in parent updates and coaching briefs.',
  },
  player_progress_review: {
    why: 'Player development stalls when signals are not reviewed and acted on in time.',
    whyNowBase: 'This player has recent signals that have not been reviewed.',
    whyFirst: 'Early pattern detection prevents small development plateaus from becoming long-term stalls.',
    riskReduced: 'Reduces the risk of a player disengaging before the underlying issue is identified.',
    whatItUnlocks: 'Unlocks a clearer coaching focus, an updated parent summary, and a development priority for the next review cycle.',
  },
  class_template_completion: {
    why: 'Incomplete class templates leave coaches building sessions from scratch, which increases inconsistency across groups.',
    whyNowBase: 'Coaches need complete templates before their next session cycle.',
    whyFirst: 'Templates are multiplied across every coach and every session — one complete template improves dozens of sessions.',
    riskReduced: 'Reduces ad-hoc session improvisation and ensures curriculum alignment across groups.',
    whatItUnlocks: 'Unlocks consistent session delivery and easier coach onboarding.',
  },
  fitness_template_completion: {
    why: 'Fitness templates without structure make it hard to track athletic development separately from tennis skill development.',
    whyNowBase: 'Coaches are using these in upcoming sessions.',
    whyFirst: 'Fitness is often the last area to get structured — addressing it now builds a more complete program picture.',
    riskReduced: 'Reduces the risk of coaches skipping or improvising fitness blocks.',
    whatItUnlocks: 'Unlocks consistent fitness tracking across groups and a cleaner session structure.',
  },
  review_queue_clear: {
    why: 'A growing review queue delays coach input, attendance exceptions, and curriculum proposals from being actioned.',
    whyNowBase: 'Items in the review queue are waiting on director decision before anything can progress.',
    whyFirst: 'Every item in the queue is a workflow waiting to complete. Clearing the queue unblocks multiple other people.',
    riskReduced: 'Reduces coach frustration and data staleness.',
    whatItUnlocks: 'Unlocks pending coach wrap-ups, attendance corrections, and curriculum improvements.',
  },
  session_review_completion: {
    why: 'Session reviews are how the director stays connected to what actually happened on court.',
    whyNowBase: 'Session data is freshest immediately after the session — reviewing now preserves accuracy.',
    whyFirst: 'Session reviews can surface observations that need follow-up before the next session.',
    riskReduced: 'Reduces information loss between coach execution and director oversight.',
    whatItUnlocks: 'Unlocks a session record that feeds into player development tracking and coach performance awareness.',
  },
  attendance_completion: {
    why: 'Accurate attendance records are the foundation of load tracking, billing, and parent communication.',
    whyNowBase: 'Attendance records should be confirmed while the session is still fresh.',
    whyFirst: 'Attendance corrections become harder and less accurate the longer they wait.',
    riskReduced: 'Reduces discrepancies between what coaches recorded and what the official record shows.',
    whatItUnlocks: 'Unlocks accurate load data and removes attendance anomalies from the attention queue.',
  },
  general_guidance: {
    why: "You asked for guidance — I'll help you figure out the most useful next step.",
    whyNowBase: "Any forward movement is better than no movement.",
    whyFirst: 'Start with what matters most to the academy right now.',
    riskReduced: 'Reduces decision paralysis.',
    whatItUnlocks: 'Unlocks clarity on what to work on next.',
  },
}

// ── Pending-review urgency phrases ─────────────────────────────────────────────

function buildPendingReviewUrgencyNote(pendingReviews: number): string {
  if (pendingReviews === 0) return ''
  if (pendingReviews === 1) return ' There is also 1 item in the review queue waiting for your decision.'
  if (pendingReviews <= 3) return ` There are also ${pendingReviews} items in the review queue that need your attention.`
  return ` The review queue has ${pendingReviews} pending items — clearing it will unblock multiple workflows.`
}

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build a reasoning block for a given intent + goal + entity context.
 * Returns null when the goal is 'general_guidance' and no entity is present
 * (no useful reasoning can be built without more context).
 */
export function buildReasoningBlock(input: ReasoningInput): ReasoningBlock | null {
  if (!input.goal) return null

  const template = REASONING_MAP[input.goal]
  if (!template) return null

  const entity = input.entityLabel ? ` for ${input.entityLabel}` : ''
  const urgencyNote = buildPendingReviewUrgencyNote(input.pendingReviews)

  const whyNow = `${template.whyNowBase}${urgencyNote}`

  return {
    why: template.why,
    whyNow,
    whyFirst: template.whyFirst,
    riskReduced: template.riskReduced,
    whatItUnlocks: template.whatItUnlocks + (entity ? ` (${input.entityLabel})` : ''),
  }
}

/**
 * Format a reasoning block as a concise 1–2 sentence "why this matters" string.
 * Used in ChatGPT-like response format (Answer → **Reason:** → Next → Follow-up).
 */
export function formatReasoningForResponse(block: ReasoningBlock): string {
  return `${block.why} ${block.whyNow}`
}
