// Sprint 1022 — DONNA Draft Only Actions V1
// Payload builders and validators for draft-only DONNA actions.
// Draft-only actions create proposed_actions with status=pending_review.
// Nothing executes immediately. All drafts require director review.
// No DB writes. Pure payload construction and validation.

import type { DonnaRole } from '@/lib/donna/donnaRoleBoundaries'

// ── Draft payload shapes ───────────────────────────────────────────────────────

export interface DonnaDraftPayload {
  actionId: string
  targetModule: string
  targetObjectId: string | null
  actionLabel: string
  payload: Record<string, unknown>
  safetyNotes: string[]
  requiresDirectorReview: true
  submittedBy: string
  submittedAt: string
}

// ── Validation result ─────────────────────────────────────────────────────────

export interface DraftValidationResult {
  valid: boolean
  missingFields: string[]
  warnings: string[]
  blockedReason: string | null
}

// ── Observation draft ─────────────────────────────────────────────────────────

export interface ObservationDraftInput {
  coachUserId: string
  playerId: string
  playerName: string
  sessionId: string | null
  observationType: 'positive' | 'concern' | 'neutral'
  content: string
  tags: string[]
}

export function validateObservationDraft(input: Partial<ObservationDraftInput>): DraftValidationResult {
  const missing: string[] = []
  const warnings: string[] = []

  if (!input.coachUserId) missing.push('coachUserId')
  if (!input.playerId) missing.push('playerId')
  if (!input.content || input.content.trim().length < 10) missing.push('content (minimum 10 characters)')
  if (!input.observationType) missing.push('observationType')

  if (input.content && input.content.length > 500) {
    warnings.push('Note is long — DONNA will truncate to 500 characters for the draft.')
  }

  if (input.observationType === 'concern' && (!input.tags || input.tags.length === 0)) {
    warnings.push('Concern observations are more useful when tagged with a skill area.')
  }

  return {
    valid: missing.length === 0,
    missingFields: missing,
    warnings,
    blockedReason: missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : null,
  }
}

export function buildObservationDraftPayload(input: ObservationDraftInput): DonnaDraftPayload {
  return {
    actionId: 'capture_note',
    targetModule: 'player_observation',
    targetObjectId: input.playerId,
    actionLabel: `Player observation — ${input.playerName} (${input.observationType})`,
    payload: {
      player_id: input.playerId,
      player_name: input.playerName,
      session_id: input.sessionId,
      observation_type: input.observationType,
      content: input.content.slice(0, 500),
      tags: input.tags,
      drafted_by_donna: true,
    },
    safetyNotes: [
      'This observation is a draft — not visible to the player or parent until director approves.',
      'Director must review and approve before this affects any player record.',
    ],
    requiresDirectorReview: true,
    submittedBy: input.coachUserId,
    submittedAt: new Date().toISOString(),
  }
}

// ── Wrap-up draft ─────────────────────────────────────────────────────────────

export interface WrapUpDraftInput {
  coachUserId: string
  sessionId: string
  sessionName: string
  answers: Record<string, string>
  isComplete: boolean
  answeredCount: number
  totalQuestions: number
}

export function validateWrapUpDraft(input: Partial<WrapUpDraftInput>): DraftValidationResult {
  const missing: string[] = []
  const warnings: string[] = []

  if (!input.coachUserId) missing.push('coachUserId')
  if (!input.sessionId) missing.push('sessionId')
  if (!input.answers || Object.keys(input.answers).length === 0) missing.push('answers (at least one answer required)')

  if (input.answeredCount !== undefined && input.totalQuestions !== undefined) {
    if (input.answeredCount < input.totalQuestions) {
      warnings.push(`Only ${input.answeredCount} of ${input.totalQuestions} questions answered — partial wrap-up.`)
    }
  }

  return {
    valid: missing.length === 0,
    missingFields: missing,
    warnings,
    blockedReason: missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : null,
  }
}

export function buildWrapUpDraftPayload(input: WrapUpDraftInput): DonnaDraftPayload {
  return {
    actionId: 'wrap_up',
    targetModule: 'session_wrap_up_v1',
    targetObjectId: input.sessionId,
    actionLabel: `Session wrap-up — ${input.sessionName}`,
    payload: {
      session_id: input.sessionId,
      session_name: input.sessionName,
      answers: input.answers,
      is_complete: input.isComplete,
      answered_count: input.answeredCount,
      total_questions: input.totalQuestions,
      drafted_by_donna: true,
    },
    safetyNotes: [
      'Wrap-up is a draft — director reviews before any player records are updated.',
      'DONNA does not auto-apply wrap-up content to player profiles.',
    ],
    requiresDirectorReview: true,
    submittedBy: input.coachUserId,
    submittedAt: new Date().toISOString(),
  }
}

// ── Session modification draft ────────────────────────────────────────────────

export interface SessionModDraftInput {
  coachUserId: string
  sessionId: string
  sessionName: string
  modifications: Array<{
    field: string
    from: unknown
    to: unknown
    reason: string
  }>
}

export function validateSessionModDraft(input: Partial<SessionModDraftInput>): DraftValidationResult {
  const missing: string[] = []

  if (!input.coachUserId) missing.push('coachUserId')
  if (!input.sessionId) missing.push('sessionId')
  if (!input.modifications || input.modifications.length === 0) missing.push('modifications')

  return {
    valid: missing.length === 0,
    missingFields: missing,
    warnings: [],
    blockedReason: missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : null,
  }
}

export function buildSessionModDraftPayload(input: SessionModDraftInput): DonnaDraftPayload {
  return {
    actionId: 'adjust_session',
    targetModule: 'modify_session',
    targetObjectId: input.sessionId,
    actionLabel: `Session modification — ${input.sessionName}`,
    payload: {
      session_id: input.sessionId,
      session_name: input.sessionName,
      modifications: input.modifications,
      drafted_by_donna: true,
    },
    safetyNotes: [
      'Session modification is a draft — director reviews before any changes are applied.',
      'Active session structure is not changed until director approves.',
    ],
    requiresDirectorReview: true,
    submittedBy: input.coachUserId,
    submittedAt: new Date().toISOString(),
  }
}

// ── Role gate ─────────────────────────────────────────────────────────────────

const DRAFT_ACTIONS_BY_ROLE: Record<DonnaRole, string[]> = {
  director: ['capture_note', 'wrap_up', 'adjust_session'],
  coach: ['capture_note', 'wrap_up', 'adjust_session'],
}

export function isDraftActionAllowedForRole(actionId: string, role: DonnaRole): boolean {
  return DRAFT_ACTIONS_BY_ROLE[role]?.includes(actionId) ?? false
}

// ── Draft summary label ───────────────────────────────────────────────────────

export function getDraftActionLabel(actionId: string): string {
  switch (actionId) {
    case 'capture_note': return 'Player observation draft'
    case 'wrap_up': return 'Session wrap-up draft'
    case 'adjust_session': return 'Session modification draft'
    default: return 'Draft'
  }
}

export function getDraftSafetyFooter(): string {
  return 'This draft will be sent to the director for review. Nothing changes until approved.'
}
