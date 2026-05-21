// Sprint 424 — Approval Context Builder V1
// Builds the director review context shown in the approval center UI.
// Converts raw proposed_action data into a structured, human-readable review package.
// No DB calls. Pure transformation. Server-side only.

import type { Database } from '@/lib/supabase/database.types'
import { isExpiredAction } from './proposedActionStateMachine'

type ProposedAction = Database['public']['Tables']['proposed_actions']['Row']
type ActionType = Database['public']['Enums']['action_type']

export interface DirectorReviewPackage {
  actionId: string
  actionLabel: string
  actionType: ActionType
  riskLevel: 'low' | 'medium' | 'high'
  riskBadge: 'low' | 'medium' | 'high'
  targetModule: string
  targetObjectId: string | null
  status: Database['public']['Enums']['proposed_action_status']
  isExpired: boolean
  expiresAt: string
  createdAt: string
  canApprove: boolean
  canReject: boolean
  canRequestClarification: boolean
  reviewHints: string[]
  riskNotes: string[]
  proposedPayload: Database['public']['Tables']['proposed_actions']['Row']['proposed_payload']
  modifiedPayload: Database['public']['Tables']['proposed_actions']['Row']['modified_payload'] | null
}

// Risk level label for UI display
const RISK_LABELS: Record<string, 'low' | 'medium' | 'high'> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
}

// Action-type-specific review hints for directors
const ACTION_TYPE_HINTS: Partial<Record<ActionType, string[]>> = {
  move_player_group: [
    'Check that the player meets the requirements for the new group.',
    'Confirm with the receiving coach that there is capacity.',
  ],
  generate_parent_update: [
    'Review the draft for accuracy and appropriate tone.',
    'Confirm no sensitive clinical information is included.',
  ],
  modify_session: [
    'Check that the session change is consistent with the weekly plan.',
  ],
  assign_group: [
    'Confirm player enrollment status is active.',
  ],
  create_placement_assessment: [
    'Verify the player has not already been assessed this cycle.',
  ],
}

// Build a director review package from a raw proposed_action row.
export function buildDirectorReviewPackage(action: ProposedAction): DirectorReviewPackage {
  const expired = isExpiredAction(action.expires_at)
  const riskLevel = RISK_LABELS[action.risk_level] ?? 'medium'

  const canApprove = !expired && action.status === 'pending_review'
  const canReject = !expired && (action.status === 'pending_review' || action.status === 'clarification_needed')
  const canRequestClarification = !expired && action.status === 'pending_review'

  const hints = ACTION_TYPE_HINTS[action.action_type] ?? []
  if (expired) hints.unshift('This action has expired and can no longer be approved.')
  if (riskLevel === 'high') hints.unshift('High-risk action — review carefully before approving.')

  return {
    actionId: action.id,
    actionLabel: action.action_label,
    actionType: action.action_type,
    riskLevel,
    riskBadge: riskLevel,
    targetModule: action.target_module,
    targetObjectId: action.target_object_id,
    status: action.status,
    isExpired: expired,
    expiresAt: action.expires_at,
    createdAt: action.created_at,
    canApprove,
    canReject,
    canRequestClarification,
    reviewHints: hints,
    riskNotes: action.risk_notes ?? [],
    proposedPayload: action.proposed_payload,
    modifiedPayload: action.modified_payload,
  }
}

// Build review packages for a list of actions, sorted by risk (high first) then age.
export function buildDirectorReviewQueue(actions: ProposedAction[]): DirectorReviewPackage[] {
  const packages = actions.map(buildDirectorReviewPackage)

  const riskOrder = { high: 0, medium: 1, low: 2 }
  return packages.sort((a, b) => {
    const riskDiff = (riskOrder[a.riskLevel] ?? 1) - (riskOrder[b.riskLevel] ?? 1)
    if (riskDiff !== 0) return riskDiff
    return Date.parse(a.createdAt) - Date.parse(b.createdAt)
  })
}

// Returns a one-line summary of an action for notification purposes.
export function buildActionSummaryLine(action: ProposedAction): string {
  return `[${action.risk_level.toUpperCase()}] ${action.action_label} — ${action.target_module}`
}
