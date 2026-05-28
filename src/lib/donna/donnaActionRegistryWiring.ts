// Sprint 914.9 — DONNA Action Registry Wiring V1
// Connects God Mode to the existing directorActionRegistry without allowing unsafe execution.
// Provides getAllowedDonnaActionsForContext() for safe action metadata lookup.
//
// V1 scope: only allows read-only and safe-draft actions.
// High-risk actions are metadata-only with requiresApproval = true.
// Curriculum draft creation remains on its proven existing path.

import { DIRECTOR_DONNA_ACTIONS } from '@/lib/donna/directorActionRegistry'
import type { DirectorDonnaAction } from '@/lib/donna/directorActionTypes'

// ── Safe action classes that can be surfaced to DONNA context ─────────────────
// 'answer_only' and 'draft_only' are surfaced. All others require approval.
const SAFE_FOR_CONTEXT: Set<string> = new Set(['answer_only', 'draft_only'])

// ── Restricted domains for extra caution ──────────────────────────────────────
const HIGH_RISK_DOMAINS: Set<string> = new Set([
  'level_movement',
  'parent_summaries',
  'player_summaries',
  'licensing_health',
  'academy_settings',
  'groups_rosters',
  'parent_player_visibility',
])

// ── Output type ───────────────────────────────────────────────────────────────

export interface DonnaAllowedAction {
  id: string
  displayName: string
  domain: string
  actionClass: string
  routes: string[]
  requiresApproval: boolean
  isReadOnly: boolean
  implementationStatus: string
}

// ── Allowed action IDs for the V1 safe set ────────────────────────────────────
// Only these specific actions are surfaced in the context packet V1.
const V1_SAFE_ACTION_IDS = new Set([
  'explain_director_dashboard',
  'explain_kpi',
  'explain_review_queue',
  'explain_curriculum_level',
  'explain_current_page',
  'summarize_current_page',
  'recommend_next_task',
  'navigate_to_page',
  'explain_curriculum_builder',
  // Curriculum draft proposal (already safe via existing path)
  'propose_curriculum_change',
  'create_drill_draft',
  'create_gate_draft',
  'create_skill_draft',
])

// ── Main function ──────────────────────────────────────────────────────────────

/**
 * Returns allowed DONNA action metadata for the current director context.
 * V1 scope: read-only + safe draft actions only.
 * High-risk actions return requiresApproval = true.
 * Does NOT execute any action — metadata only.
 */
export function getAllowedDonnaActionsForContext(
  options: {
    pathname?: string | null
    /** If true, only return read-only 'answer_only' actions */
    readOnlyOnly?: boolean
  } = {},
): DonnaAllowedAction[] {
  const results: DonnaAllowedAction[] = []

  for (const action of DIRECTOR_DONNA_ACTIONS) {
    // Skip unsafe or blocked actions
    if (action.actionClass === 'unsafe' || action.actionClass === 'blocked') continue

    // V1: only surface known safe action IDs
    const isInV1SafeSet = V1_SAFE_ACTION_IDS.has(action.id)
    if (!isInV1SafeSet && !SAFE_FOR_CONTEXT.has(action.actionClass)) continue

    // Read-only filter
    if (options.readOnlyOnly && action.actionClass !== 'answer_only') continue

    // Route filter — if pathname provided, prefer matching routes
    const matchesRoute = !options.pathname || action.routes.length === 0 ||
      action.routes.some(r => options.pathname!.startsWith(r))
    if (!matchesRoute) continue

    const isHighRisk = HIGH_RISK_DOMAINS.has(action.domain)
    const requiresApproval =
      isHighRisk ||
      action.actionClass === 'director_approval_required' ||
      action.actionClass === 'review_required'

    results.push({
      id:                   action.id,
      displayName:          action.displayName,
      domain:               action.domain,
      actionClass:          action.actionClass,
      routes:               action.routes,
      requiresApproval,
      isReadOnly:           action.actionClass === 'answer_only',
      implementationStatus: action.implementationStatus,
    })
  }

  return results
}

/**
 * Returns the action IDs as a string array for inclusion in context packet.
 * Suitable for `allowedActions` field in DonnaContextPacket.
 */
export function getAllowedActionIds(options: {
  pathname?: string | null
  readOnlyOnly?: boolean
} = {}): string[] {
  return getAllowedDonnaActionsForContext(options).map(a => a.id)
}
