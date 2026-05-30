// Sprint 970 — DONNA Director Action Explanation Layer V1
// Standardized safety/approval language for every DirectorNextAction recommendation.
// Pure TypeScript — no DB calls, no API calls, no React, no mutations.
//
// Purpose:
//   Creates a structured explanation block that can be:
//   a) Rendered inline in the DONNA panel (V1)
//   b) Included in the LLM orchestration context packet (Sprint 978)
//   c) Used by any future DONNA surface that needs canonical safety copy
//
// This is the single source of truth for:
//   - what an action does
//   - whether it changes records
//   - whether approval is required
//   - what happens next
//   - the safety badge label
//
// Usage:
//   const explanation = buildActionExplanation(action)
//   explanation.safetyStatement // "Nothing changes until you approve or reject."
//   explanation.safetyBadge     // "Approval Required"
//   formatExplanationAsText(explanation) // full COO-style paragraph

import type { DirectorNextAction, DirectorNextActionSafetyLevel } from './directorNextActionEngine'

// ── Output shape ──────────────────────────────────────────────────────────────

/** Structured explanation for a DirectorNextAction recommendation. */
export interface DirectorActionExplanation {
  /** Short declarative sentence: what this action does. */
  whatItDoes: string
  /** Whether taking this action changes any permanent records. */
  changesRecords: boolean
  /** Whether explicit director approval is required before records change. */
  approvalRequired: boolean
  /** What happens immediately after the director clicks / acts. */
  whatHappensNext: string
  /** Canonical one-sentence safety statement. */
  safetyStatement: string
  /** Short badge label shown next to the recommendation. */
  safetyBadge: string
  /** The safety level that produced this explanation. */
  safetyLevel: DirectorNextActionSafetyLevel
}

// ── Safety-level templates ────────────────────────────────────────────────────

const SAFETY_TEMPLATES: Record<DirectorNextActionSafetyLevel, {
  changesRecords: boolean
  approvalRequired: boolean
  safetyStatement: string
  safetyBadge: string
}> = {
  safe: {
    changesRecords: false,
    approvalRequired: false,
    safetyStatement: 'This is read-only. You are viewing data — nothing can be changed from here without an explicit action.',
    safetyBadge: 'Read-only',
  },
  review_only: {
    changesRecords: false,
    approvalRequired: false,
    safetyStatement: 'You can review and navigate freely. Any change you make creates a draft that must be explicitly saved — nothing is applied automatically.',
    safetyBadge: 'Draft / No auto-save',
  },
  approval_gated: {
    changesRecords: true,
    approvalRequired: true,
    safetyStatement: 'Nothing changes until you explicitly approve or reject each item. Opening this area is always safe.',
    safetyBadge: 'Approval Required',
  },
}

// ── Action-specific "what it does" sentences ─────────────────────────────────

const WHAT_IT_DOES_MAP: Record<string, string> = {
  pending_review_queue:
    'Opens the Review Queue where pending coach notes, wrap-ups, and parent drafts wait for your decision.',
  curriculum_status_review:
    'Shows the curriculum status overview — active levels, content gaps, and any pending draft changes.',
  class_template_primary_action:
    'Opens the primary setup step for this class template — block structure, duration, and focus.',
  class_template_list:
    'Shows all class templates in your academy so you can review, edit, or create a new one.',
  sessions_attention:
    'Lists all director-visible sessions — identifies which ones need attention, a wrap-up, or review.',
  player_attention:
    'Opens the player directory — shows status, curriculum level, and attention signals for each player.',
  review_queue_clear:
    'The Review Queue is clear. Suggests reviewing the dashboard for the next highest-value task.',
  dashboard_review:
    'Opens the Academy Dashboard for an at-a-glance view of today\'s sessions, review queue, and alerts.',
}

// ── "What happens next" sentences ────────────────────────────────────────────

const WHAT_HAPPENS_NEXT_MAP: Record<string, string> = {
  pending_review_queue:
    'You see all pending items grouped by type. You can approve, reject, or flag each one for clarification — no automatic changes.',
  curriculum_status_review:
    'You see the curriculum health status. Any edits go into draft mode and must be explicitly approved before they take effect.',
  class_template_primary_action:
    'You can complete the template setup. Sessions generated from this template are created separately — no live session is affected automatically.',
  class_template_list:
    'You can open any template to review or edit it. No sessions are affected until you explicitly generate one.',
  sessions_attention:
    'You can view session details, check for missing wrap-ups, and flag sessions that need follow-up.',
  player_attention:
    'You can view each player\'s profile, curriculum level, and signals. No record changes unless you take a specific action.',
  review_queue_clear:
    'No immediate action required. The dashboard shows today\'s sessions and any emerging signals.',
  dashboard_review:
    'You see the full academy pulse — review queue count, player attention signals, and today\'s sessions in one view.',
}

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build a structured explanation for a DirectorNextAction recommendation.
 * Returns a canonical safety/approval block suitable for panel display or LLM context.
 */
export function buildActionExplanation(action: DirectorNextAction): DirectorActionExplanation {
  const template = SAFETY_TEMPLATES[action.safetyLevel]

  const whatItDoes =
    WHAT_IT_DOES_MAP[action.id] ??
    `Takes you to ${action.title} — ${action.why}`

  const whatHappensNext =
    WHAT_HAPPENS_NEXT_MAP[action.id] ??
    `You can review the ${action.title} area. ${template.safetyStatement}`

  return {
    whatItDoes,
    changesRecords: template.changesRecords,
    approvalRequired: template.approvalRequired,
    whatHappensNext,
    safetyStatement: template.safetyStatement,
    safetyBadge: template.safetyBadge,
    safetyLevel: action.safetyLevel,
  }
}

// ── Text formatter ────────────────────────────────────────────────────────────

/**
 * Format a DirectorActionExplanation as a concise COO-style text block.
 * Suitable for appending to a DONNA response or including in an LLM context packet.
 */
export function formatExplanationAsText(explanation: DirectorActionExplanation): string {
  const lines: string[] = [
    explanation.whatItDoes,
    explanation.whatHappensNext,
    explanation.safetyStatement,
  ]
  return lines.join(' ')
}

// ── Safety badge helpers ──────────────────────────────────────────────────────

/** Returns the canonical safety badge label for a given safety level. */
export function getSafetyBadge(level: DirectorNextActionSafetyLevel): string {
  return SAFETY_TEMPLATES[level].safetyBadge
}

/** Returns true when the given safety level requires explicit director approval. */
export function requiresDirectorApproval(level: DirectorNextActionSafetyLevel): boolean {
  return SAFETY_TEMPLATES[level].approvalRequired
}

/** Returns true when the given safety level can result in record changes (with approval). */
export function canChangeRecords(level: DirectorNextActionSafetyLevel): boolean {
  return SAFETY_TEMPLATES[level].changesRecords
}
