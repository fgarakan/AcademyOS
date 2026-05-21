// Sprint 419 — DONNA Input Validator V1
// Validates all inputs before they enter the DONNA pipeline or create proposed_actions.
// Pure validation — no DB calls, no side effects.
// Server-side only.

import type { Database } from '@/lib/supabase/database.types'

type ActionType = Database['public']['Enums']['action_type']
type ProposedActionStatus = Database['public']['Enums']['proposed_action_status']

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

function ok(): ValidationResult {
  return { valid: true, errors: [] }
}

function fail(errors: string[]): ValidationResult {
  return { valid: false, errors }
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

// ── Proposed action creation inputs ───────────────────────────────────────────

export interface CreateProposedActionInput {
  academyId: string
  proposedById: string
  actionType: ActionType
  actionLabel: string
  targetModule: string
  targetObjectId?: string | null
  targetObjectType?: string | null
  proposedPayload: Record<string, unknown>
  riskLevel: 'low' | 'medium' | 'high'
  voiceCommandId?: string | null
}

export function validateCreateProposedActionInput(
  input: Partial<CreateProposedActionInput>,
): ValidationResult {
  const errors: string[] = []

  if (!isUuid(input.academyId)) errors.push('academyId must be a valid UUID.')
  if (!isUuid(input.proposedById)) errors.push('proposedById must be a valid UUID.')
  if (!isNonEmptyString(input.actionType)) errors.push('actionType is required.')
  if (!isNonEmptyString(input.actionLabel)) errors.push('actionLabel is required.')
  if (!isNonEmptyString(input.targetModule)) errors.push('targetModule is required.')
  if (!input.proposedPayload || typeof input.proposedPayload !== 'object') {
    errors.push('proposedPayload must be an object.')
  }
  if (!['low', 'medium', 'high'].includes(input.riskLevel ?? '')) {
    errors.push("riskLevel must be 'low', 'medium', or 'high'.")
  }
  if (input.targetObjectId && !isUuid(input.targetObjectId)) {
    errors.push('targetObjectId must be a valid UUID if provided.')
  }
  if (input.voiceCommandId && !isUuid(input.voiceCommandId)) {
    errors.push('voiceCommandId must be a valid UUID if provided.')
  }

  return errors.length > 0 ? fail(errors) : ok()
}

// ── Approval inputs ───────────────────────────────────────────────────────────

export interface ApproveActionInput {
  actionId: string
  approverId: string
  academyId: string
  reviewerNotes?: string | null
  currentStatus: ProposedActionStatus
}

export function validateApproveActionInput(
  input: Partial<ApproveActionInput>,
): ValidationResult {
  const errors: string[] = []

  if (!isUuid(input.actionId)) errors.push('actionId must be a valid UUID.')
  if (!isUuid(input.approverId)) errors.push('approverId must be a valid UUID.')
  if (!isUuid(input.academyId)) errors.push('academyId must be a valid UUID.')
  if (input.currentStatus !== 'pending_review' && input.currentStatus !== 'clarification_needed') {
    errors.push('Action must be in pending_review or clarification_needed state to approve.')
  }

  return errors.length > 0 ? fail(errors) : ok()
}

// ── Rejection inputs ──────────────────────────────────────────────────────────

export interface RejectActionInput {
  actionId: string
  rejecterId: string
  academyId: string
  rejectionReason: string
  currentStatus: ProposedActionStatus
}

export function validateRejectActionInput(
  input: Partial<RejectActionInput>,
): ValidationResult {
  const errors: string[] = []

  if (!isUuid(input.actionId)) errors.push('actionId must be a valid UUID.')
  if (!isUuid(input.rejecterId)) errors.push('rejecterId must be a valid UUID.')
  if (!isUuid(input.academyId)) errors.push('academyId must be a valid UUID.')
  if (!isNonEmptyString(input.rejectionReason)) {
    errors.push('rejectionReason is required when rejecting an action.')
  }
  if (input.currentStatus !== 'pending_review' && input.currentStatus !== 'clarification_needed') {
    errors.push('Action must be in pending_review or clarification_needed state to reject.')
  }

  return errors.length > 0 ? fail(errors) : ok()
}

// ── Clarification inputs ──────────────────────────────────────────────────────

export interface RequestClarificationInput {
  actionId: string
  requesterId: string
  academyId: string
  clarificationNote: string
  currentStatus: ProposedActionStatus
}

export function validateRequestClarificationInput(
  input: Partial<RequestClarificationInput>,
): ValidationResult {
  const errors: string[] = []

  if (!isUuid(input.actionId)) errors.push('actionId must be a valid UUID.')
  if (!isUuid(input.requesterId)) errors.push('requesterId must be a valid UUID.')
  if (!isUuid(input.academyId)) errors.push('academyId must be a valid UUID.')
  if (!isNonEmptyString(input.clarificationNote)) {
    errors.push('clarificationNote is required.')
  }
  if (input.currentStatus !== 'pending_review') {
    errors.push('Clarification can only be requested for actions in pending_review state.')
  }

  return errors.length > 0 ? fail(errors) : ok()
}

// ── Voice input ───────────────────────────────────────────────────────────────

export interface VoiceCommandInput {
  transcript: string
  sessionId?: string | null
  academyId: string
  userId: string
}

export function validateVoiceCommandInput(
  input: Partial<VoiceCommandInput>,
): ValidationResult {
  const errors: string[] = []

  if (!isUuid(input.academyId)) errors.push('academyId must be a valid UUID.')
  if (!isUuid(input.userId)) errors.push('userId must be a valid UUID.')
  if (!isNonEmptyString(input.transcript)) errors.push('transcript is required.')
  if (input.transcript && input.transcript.trim().length > 10_000) {
    errors.push('transcript exceeds maximum length of 10,000 characters.')
  }

  return errors.length > 0 ? fail(errors) : ok()
}
