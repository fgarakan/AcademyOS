// Sprint 417 — Proposed Action State Machine V1
// Defines valid status transitions for proposed_actions rows.
// Enforces the approval workflow as a state machine — prevents invalid transitions.
// No DB calls. Pure logic. Server-side only.

import type { Database } from '@/lib/supabase/database.types'

export type ProposedActionStatus = Database['public']['Enums']['proposed_action_status']

// All valid status values
export const PROPOSED_ACTION_STATUSES: ProposedActionStatus[] = [
  'pending_review',
  'clarification_needed',
  'approved',
  'modified',
  'rejected',
  'executed',
  'failed',
  'expired',
]

// Terminal states — no further transitions are possible
const TERMINAL_STATES: ProposedActionStatus[] = ['rejected', 'executed', 'failed', 'expired']

// Valid transitions: from state → allowed next states
const VALID_TRANSITIONS: Record<ProposedActionStatus, ProposedActionStatus[]> = {
  pending_review:       ['approved', 'rejected', 'clarification_needed', 'expired'],
  clarification_needed: ['pending_review', 'rejected'],
  approved:             ['executed', 'failed', 'modified'],
  modified:             ['approved', 'rejected'],
  rejected:             [],
  executed:             [],
  failed:               [],
  expired:              [],
}

export interface TransitionCheck {
  allowed: boolean
  reason?: string
}

// Returns whether a state transition is valid.
export function isValidTransition(
  from: ProposedActionStatus,
  to: ProposedActionStatus,
): TransitionCheck {
  if (TERMINAL_STATES.includes(from)) {
    return { allowed: false, reason: `Cannot transition from terminal state '${from}'.` }
  }
  const validNext = VALID_TRANSITIONS[from] ?? []
  if (!validNext.includes(to)) {
    return {
      allowed: false,
      reason: `Transition from '${from}' to '${to}' is not permitted.`,
    }
  }
  return { allowed: true }
}

// Returns the list of states that this action can transition to.
export function getValidNextStates(from: ProposedActionStatus): ProposedActionStatus[] {
  return VALID_TRANSITIONS[from] ?? []
}

// Returns true if this action has reached a terminal state.
export function isTerminalState(status: ProposedActionStatus): boolean {
  return TERMINAL_STATES.includes(status)
}

// Returns whether a director can approve an action in this state.
export function canDirectorApprove(status: ProposedActionStatus): boolean {
  return isValidTransition(status, 'approved').allowed
}

// Returns whether a director can reject an action in this state.
export function canDirectorReject(status: ProposedActionStatus): boolean {
  return isValidTransition(status, 'rejected').allowed
}

// Returns whether the system can execute an action in this state.
// Only 'approved' actions may be executed.
export function canExecuteAction(status: ProposedActionStatus): boolean {
  return status === 'approved'
}

// Returns whether an action is expired.
export function isExpiredAction(expiresAt: string): boolean {
  return Date.parse(expiresAt) < Date.now()
}

// Returns the appropriate status for an action that has passed its expiry date.
// Caller must check expiry before allowing approval.
export function getExpiryStatus(
  currentStatus: ProposedActionStatus,
  expiresAt: string,
): ProposedActionStatus {
  if (!isTerminalState(currentStatus) && isExpiredAction(expiresAt)) {
    return 'expired'
  }
  return currentStatus
}
