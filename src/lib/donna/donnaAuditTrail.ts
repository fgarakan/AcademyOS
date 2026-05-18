// Sprint 1028 — DONNA Action Audit Trail V1
// Audit trail shapes and builders for DONNA actions.
// Generates audit_log INSERT payloads — does NOT write to DB.
// Callers pass these payloads to the actual audit log server action.
// All major DONNA mutations must produce an audit entry.

import type { DonnaApprovalRequest } from '@/lib/donna/donnaApprovalActions'
import type { DonnaDraftPayload } from '@/lib/donna/donnaDraftOnlyActions'

// ── Audit log insert shape (matches audit_logs table) ─────────────────────────

export interface DonnaAuditEntry {
  academy_id: string
  action: string
  actor_id: string | null
  actor_role: 'academy_director' | 'head_coach' | 'coach' | 'player' | 'parent' | null
  source_type: 'donna'
  target_type: string
  target_id: string | null
  target_label: string | null
  payload: Record<string, unknown>
}

// ── Event types ───────────────────────────────────────────────────────────────

export type DonnaAuditEvent =
  | 'donna.draft_submitted'
  | 'donna.draft_approved'
  | 'donna.draft_rejected'
  | 'donna.approval_submitted'
  | 'donna.approval_approved'
  | 'donna.approval_rejected'
  | 'donna.safe_read_executed'
  | 'donna.action_blocked'
  | 'donna.context_loaded'

// ── Draft submitted ───────────────────────────────────────────────────────────

export interface DraftSubmitAuditParams {
  academyId: string
  draft: DonnaDraftPayload
  actorRole: DonnaAuditEntry['actor_role']
}

export function buildDraftSubmitAuditEntry(params: DraftSubmitAuditParams): DonnaAuditEntry {
  return {
    academy_id: params.academyId,
    action: 'donna.draft_submitted',
    actor_id: params.draft.submittedBy,
    actor_role: params.actorRole,
    source_type: 'donna',
    target_type: params.draft.targetModule,
    target_id: params.draft.targetObjectId,
    target_label: params.draft.actionLabel,
    payload: {
      action_id: params.draft.actionId,
      target_module: params.draft.targetModule,
      submitted_at: params.draft.submittedAt,
      requires_director_review: params.draft.requiresDirectorReview,
      safety_notes: params.draft.safetyNotes,
    },
  }
}

// ── Draft approved / rejected ─────────────────────────────────────────────────

export interface DraftDecisionAuditParams {
  academyId: string
  draft: DonnaDraftPayload
  directorId: string
  decision: 'approved' | 'rejected'
  directorNotes: string | null
  rejectionReason: string | null
}

export function buildDraftDecisionAuditEntry(params: DraftDecisionAuditParams): DonnaAuditEntry {
  const action: DonnaAuditEvent =
    params.decision === 'approved' ? 'donna.draft_approved' : 'donna.draft_rejected'

  return {
    academy_id: params.academyId,
    action,
    actor_id: params.directorId,
    actor_role: 'academy_director',
    source_type: 'donna',
    target_type: params.draft.targetModule,
    target_id: params.draft.targetObjectId,
    target_label: params.draft.actionLabel,
    payload: {
      action_id: params.draft.actionId,
      decision: params.decision,
      director_notes: params.directorNotes,
      rejection_reason: params.rejectionReason,
      original_submitted_by: params.draft.submittedBy,
      original_submitted_at: params.draft.submittedAt,
    },
  }
}

// ── Approval request submitted ────────────────────────────────────────────────

export interface ApprovalSubmitAuditParams {
  academyId: string
  request: DonnaApprovalRequest
  actorRole: DonnaAuditEntry['actor_role']
}

export function buildApprovalSubmitAuditEntry(params: ApprovalSubmitAuditParams): DonnaAuditEntry {
  return {
    academy_id: params.academyId,
    action: 'donna.approval_submitted',
    actor_id: params.request.proposedBy,
    actor_role: params.actorRole,
    source_type: 'donna',
    target_type: params.request.targetModule,
    target_id: params.request.targetObjectId,
    target_label: params.request.actionLabel,
    payload: {
      action_id: params.request.actionId,
      risk_level: params.request.riskLevel,
      requires_director_approval: params.request.requiresDirectorApproval,
      auto_execute: params.request.autoExecute,
      proposed_at: params.request.proposedAt,
    },
  }
}

// ── Approval decision ─────────────────────────────────────────────────────────

export interface ApprovalDecisionAuditParams {
  academyId: string
  request: DonnaApprovalRequest
  directorId: string
  decision: 'approved' | 'rejected'
  directorNotes: string | null
  rejectionReason: string | null
}

export function buildApprovalDecisionAuditEntry(params: ApprovalDecisionAuditParams): DonnaAuditEntry {
  const action: DonnaAuditEvent =
    params.decision === 'approved' ? 'donna.approval_approved' : 'donna.approval_rejected'

  return {
    academy_id: params.academyId,
    action,
    actor_id: params.directorId,
    actor_role: 'academy_director',
    source_type: 'donna',
    target_type: params.request.targetModule,
    target_id: params.request.targetObjectId,
    target_label: params.request.actionLabel,
    payload: {
      action_id: params.request.actionId,
      risk_level: params.request.riskLevel,
      decision: params.decision,
      director_notes: params.directorNotes,
      rejection_reason: params.rejectionReason,
      original_proposed_by: params.request.proposedBy,
      original_proposed_at: params.request.proposedAt,
    },
  }
}

// ── Action blocked ────────────────────────────────────────────────────────────

export interface ActionBlockedAuditParams {
  academyId: string
  actionId: string
  actorId: string
  actorRole: DonnaAuditEntry['actor_role']
  blockedReason: string
}

export function buildActionBlockedAuditEntry(params: ActionBlockedAuditParams): DonnaAuditEntry {
  return {
    academy_id: params.academyId,
    action: 'donna.action_blocked',
    actor_id: params.actorId,
    actor_role: params.actorRole,
    source_type: 'donna',
    target_type: 'donna_action',
    target_id: null,
    target_label: params.actionId,
    payload: {
      action_id: params.actionId,
      blocked_reason: params.blockedReason,
    },
  }
}

// ── Audit entry validator ─────────────────────────────────────────────────────

export function validateAuditEntry(entry: DonnaAuditEntry): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!entry.academy_id) errors.push('academy_id is required')
  if (!entry.action) errors.push('action is required')
  if (!entry.target_type) errors.push('target_type is required')
  if (entry.source_type !== 'donna') errors.push('source_type must be "donna"')

  return { valid: errors.length === 0, errors }
}

// ── Audit trail summary ───────────────────────────────────────────────────────

export function getAuditEventLabel(event: DonnaAuditEvent): string {
  const labels: Record<DonnaAuditEvent, string> = {
    'donna.draft_submitted': 'Draft submitted for review',
    'donna.draft_approved': 'Draft approved by director',
    'donna.draft_rejected': 'Draft rejected by director',
    'donna.approval_submitted': 'Approval request submitted',
    'donna.approval_approved': 'Approval granted by director',
    'donna.approval_rejected': 'Approval rejected by director',
    'donna.safe_read_executed': 'Safe read executed',
    'donna.action_blocked': 'Action blocked by role boundary',
    'donna.context_loaded': 'Context loaded',
  }
  return labels[event]
}
