// Sprint 427 — Director Approval Actions V1
// Server-side helpers for approve/reject/clarify in the approval center.
// These are the typed data-layer functions — server actions call them after auth checks.
// Every mutation validates state machine transitions and writes audit log.
// Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import {
  validateApproveActionInput,
  validateRejectActionInput,
  validateRequestClarificationInput,
} from '@/lib/donna/donnaInputValidator'
import {
  isValidTransition,
  isExpiredAction,
} from '@/lib/donna/proposedActionStateMachine'
import {
  logActionApproved,
  logActionRejected,
  logClarificationRequested,
} from '@/lib/donna/donnaAuditHelpers'
import { runExecutionGuards } from '@/lib/donna/actionExecutionGuards'
import type { ExecutionContext } from '@/lib/donna/actionExecutionGuards'

type UserRole = Database['public']['Enums']['user_role']

export interface DirectorActionResult {
  ok: boolean
  error?: string
  actionId?: string
}

// Approve a proposed_action. Does NOT execute it — execution requires a separate call.
export async function approveProposedAction(
  db: SupabaseClient<Database>,
  params: {
    actionId: string
    approverId: string
    approverRole: UserRole
    academyId: string
    reviewerNotes?: string | null
    requestId?: string
  },
): Promise<DirectorActionResult> {
  const rawDb = db as ReturnType<typeof db.from> extends never ? never : typeof db

  // Validate input
  const { data: currentAction, error: fetchError } = await (rawDb as typeof db)
    .from('proposed_actions')
    .select('id, status, expires_at, action_label, risk_level')
    .eq('id', params.actionId)
    .eq('academy_id', params.academyId)
    .single()

  if (fetchError || !currentAction) {
    return { ok: false, error: 'Action not found or access denied.' }
  }

  const validation = validateApproveActionInput({
    actionId: params.actionId,
    approverId: params.approverId,
    academyId: params.academyId,
    currentStatus: currentAction.status,
  })
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join(' ') }
  }

  // Check expiry
  if (isExpiredAction(currentAction.expires_at)) {
    return { ok: false, error: 'This action has expired and can no longer be approved.' }
  }

  // Check state machine transition
  const transition = isValidTransition(currentAction.status, 'approved')
  if (!transition.allowed) {
    return { ok: false, error: transition.reason ?? 'Invalid state transition.' }
  }

  // Apply the approval
  const { error: updateError } = await (rawDb as typeof db)
    .from('proposed_actions')
    .update({
      status: 'approved',
      approved_by: params.approverId,
      approved_at: new Date().toISOString(),
      reviewer_notes: params.reviewerNotes ?? null,
    })
    .eq('id', params.actionId)
    .eq('academy_id', params.academyId)
    .eq('status', currentAction.status)

  if (updateError) {
    return { ok: false, error: 'Failed to approve action. Please try again.' }
  }

  // Write audit log (non-blocking)
  void logActionApproved({
    db,
    academyId: params.academyId,
    actorId: params.approverId,
    actorRole: params.approverRole,
    actionId: params.actionId,
    actionLabel: currentAction.action_label,
    reviewerNotes: params.reviewerNotes,
    requestId: params.requestId,
  })

  return { ok: true, actionId: params.actionId }
}

// Reject a proposed_action. Requires a rejection reason.
export async function rejectProposedAction(
  db: SupabaseClient<Database>,
  params: {
    actionId: string
    rejecterId: string
    rejecterRole: UserRole
    academyId: string
    rejectionReason: string
    requestId?: string
  },
): Promise<DirectorActionResult> {
  const rawDb = db as ReturnType<typeof db.from> extends never ? never : typeof db

  const { data: currentAction, error: fetchError } = await (rawDb as typeof db)
    .from('proposed_actions')
    .select('id, status, action_label, risk_level')
    .eq('id', params.actionId)
    .eq('academy_id', params.academyId)
    .single()

  if (fetchError || !currentAction) {
    return { ok: false, error: 'Action not found or access denied.' }
  }

  const validation = validateRejectActionInput({
    actionId: params.actionId,
    rejecterId: params.rejecterId,
    academyId: params.academyId,
    rejectionReason: params.rejectionReason,
    currentStatus: currentAction.status,
  })
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join(' ') }
  }

  const transition = isValidTransition(currentAction.status, 'rejected')
  if (!transition.allowed) {
    return { ok: false, error: transition.reason ?? 'Invalid state transition.' }
  }

  const { error: updateError } = await (rawDb as typeof db)
    .from('proposed_actions')
    .update({
      status: 'rejected',
      rejected_by: params.rejecterId,
      rejected_at: new Date().toISOString(),
      rejection_reason: params.rejectionReason,
    })
    .eq('id', params.actionId)
    .eq('academy_id', params.academyId)
    .eq('status', currentAction.status)

  if (updateError) {
    return { ok: false, error: 'Failed to reject action. Please try again.' }
  }

  void logActionRejected({
    db,
    academyId: params.academyId,
    actorId: params.rejecterId,
    actorRole: params.rejecterRole,
    actionId: params.actionId,
    actionLabel: currentAction.action_label,
    rejectionReason: params.rejectionReason,
    requestId: params.requestId,
  })

  return { ok: true, actionId: params.actionId }
}

// Request clarification on a pending proposed_action.
export async function requestClarificationOnAction(
  db: SupabaseClient<Database>,
  params: {
    actionId: string
    requesterId: string
    requesterRole: UserRole
    academyId: string
    clarificationNote: string
    requestId?: string
  },
): Promise<DirectorActionResult> {
  const rawDb = db as ReturnType<typeof db.from> extends never ? never : typeof db

  const { data: currentAction, error: fetchError } = await (rawDb as typeof db)
    .from('proposed_actions')
    .select('id, status, action_label')
    .eq('id', params.actionId)
    .eq('academy_id', params.academyId)
    .single()

  if (fetchError || !currentAction) {
    return { ok: false, error: 'Action not found or access denied.' }
  }

  const validation = validateRequestClarificationInput({
    actionId: params.actionId,
    requesterId: params.requesterId,
    academyId: params.academyId,
    clarificationNote: params.clarificationNote,
    currentStatus: currentAction.status,
  })
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join(' ') }
  }

  const transition = isValidTransition(currentAction.status, 'clarification_needed')
  if (!transition.allowed) {
    return { ok: false, error: transition.reason ?? 'Invalid state transition.' }
  }

  const { error: updateError } = await (rawDb as typeof db)
    .from('proposed_actions')
    .update({
      status: 'clarification_needed',
      reviewer_notes: params.clarificationNote,
    })
    .eq('id', params.actionId)
    .eq('academy_id', params.academyId)
    .eq('status', 'pending_review')

  if (updateError) {
    return { ok: false, error: 'Failed to update action. Please try again.' }
  }

  void logClarificationRequested({
    db,
    academyId: params.academyId,
    actorId: params.requesterId,
    actorRole: params.requesterRole,
    actionId: params.actionId,
    actionLabel: currentAction.action_label,
    clarificationNote: params.clarificationNote,
    requestId: params.requestId,
  })

  return { ok: true, actionId: params.actionId }
}

// Validate that a director can execute an approved action before calling execute_approved_action().
export function validateExecutionContext(
  action: Database['public']['Tables']['proposed_actions']['Row'],
  ctx: ExecutionContext,
): DirectorActionResult {
  const guardResult = runExecutionGuards(action, ctx)
  if (!guardResult.canExecute) {
    return { ok: false, error: guardResult.blockedReason ?? 'Cannot execute this action.' }
  }
  return { ok: true, actionId: action.id }
}
