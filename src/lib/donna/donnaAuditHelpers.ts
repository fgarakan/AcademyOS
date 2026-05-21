// Sprint 421 — DONNA Audit Trail Helpers V1
// Typed wrappers around writeAuditLog() for DONNA-specific events.
// Every proposed_action lifecycle event should use these helpers for consistent audit trails.
// Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/database.types'
import { writeAuditLog } from '@/lib/audit/auditLogger'

type UserRole = Database['public']['Enums']['user_role']

interface BaseAuditContext {
  db: SupabaseClient<Database>
  academyId: string
  actorId: string
  actorRole: UserRole
  requestId?: string
}

// Log that a proposed_action was created by DONNA or a user voice command.
export async function logProposedActionCreated(
  ctx: BaseAuditContext & {
    actionId: string
    actionLabel: string
    actionType: string
    targetModule: string
    targetObjectId?: string | null
    riskLevel: string
    voiceCommandId?: string | null
  },
): Promise<void> {
  await writeAuditLog({
    db: ctx.db,
    academyId: ctx.academyId,
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    action: 'proposed_action.created',
    targetType: 'proposed_action',
    targetId: ctx.actionId,
    targetLabel: ctx.actionLabel,
    payload: {
      actionType: ctx.actionType,
      targetModule: ctx.targetModule,
      targetObjectId: ctx.targetObjectId ?? null,
      riskLevel: ctx.riskLevel,
      voiceCommandId: ctx.voiceCommandId ?? null,
    } as Json,
    sourceType: ctx.voiceCommandId ? 'voice' : 'ui',
    voiceCommandId: ctx.voiceCommandId ?? null,
    requestId: ctx.requestId,
  })
}

// Log that a director approved a proposed_action.
export async function logActionApproved(
  ctx: BaseAuditContext & {
    actionId: string
    actionLabel: string
    reviewerNotes?: string | null
  },
): Promise<void> {
  await writeAuditLog({
    db: ctx.db,
    academyId: ctx.academyId,
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    action: 'proposed_action.approved',
    targetType: 'proposed_action',
    targetId: ctx.actionId,
    targetLabel: ctx.actionLabel,
    payload: { reviewerNotes: ctx.reviewerNotes ?? null } as Json,
    sourceType: 'ui',
    requestId: ctx.requestId,
  })
}

// Log that a director rejected a proposed_action.
export async function logActionRejected(
  ctx: BaseAuditContext & {
    actionId: string
    actionLabel: string
    rejectionReason: string
  },
): Promise<void> {
  await writeAuditLog({
    db: ctx.db,
    academyId: ctx.academyId,
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    action: 'proposed_action.rejected',
    targetType: 'proposed_action',
    targetId: ctx.actionId,
    targetLabel: ctx.actionLabel,
    payload: { rejectionReason: ctx.rejectionReason } as Json,
    sourceType: 'ui',
    requestId: ctx.requestId,
  })
}

// Log that execute_approved_action() completed successfully.
export async function logActionExecuted(
  ctx: BaseAuditContext & {
    actionId: string
    actionLabel: string
    actionType: string
    latencyMs?: number
  },
): Promise<void> {
  await writeAuditLog({
    db: ctx.db,
    academyId: ctx.academyId,
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    action: 'proposed_action.executed',
    targetType: 'proposed_action',
    targetId: ctx.actionId,
    targetLabel: ctx.actionLabel,
    payload: {
      actionType: ctx.actionType,
      latencyMs: ctx.latencyMs ?? null,
    } as Json,
    sourceType: 'system',
    requestId: ctx.requestId,
  })
}

// Log that execute_approved_action() failed.
export async function logActionExecutionFailed(
  ctx: BaseAuditContext & {
    actionId: string
    actionLabel: string
    errorMessage: string
  },
): Promise<void> {
  await writeAuditLog({
    db: ctx.db,
    academyId: ctx.academyId,
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    action: 'proposed_action.execution_failed',
    targetType: 'proposed_action',
    targetId: ctx.actionId,
    targetLabel: ctx.actionLabel,
    payload: { errorMessage: ctx.errorMessage } as Json,
    sourceType: 'system',
    requestId: ctx.requestId,
  })
}

// Log that a director requested clarification on an action.
export async function logClarificationRequested(
  ctx: BaseAuditContext & {
    actionId: string
    actionLabel: string
    clarificationNote: string
  },
): Promise<void> {
  await writeAuditLog({
    db: ctx.db,
    academyId: ctx.academyId,
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    action: 'proposed_action.clarification_requested',
    targetType: 'proposed_action',
    targetId: ctx.actionId,
    targetLabel: ctx.actionLabel,
    payload: { clarificationNote: ctx.clarificationNote } as Json,
    sourceType: 'ui',
    requestId: ctx.requestId,
  })
}
