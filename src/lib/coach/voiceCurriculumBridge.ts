// Sprint 484 — Coach Voice-to-Curriculum Bridge V1
// Routes coach voice/text curriculum ideas to the curriculum inbox (proposed_action pipeline).
// Validates ideas, builds the inbox item payload, never directly writes to the curriculum.
// All curriculum changes require director approval via proposed_actions.
// Pure TypeScript — no DB calls. Returns a payload for the calling server action.

import {
  buildCurriculumInboxItem,
  validateCurriculumIdea,
  type CurriculumInboxItem,
  type CurriculumInboxSourceType,
  type CurriculumDomain,
} from '@/lib/curriculum/inbox'

export type CoachCurriculumSourceType = 'voice' | 'text'

export interface CoachCurriculumSubmission {
  coachId: string
  academyId: string
  idea: string
  sourceType: CoachCurriculumSourceType
  proposedLevel: string | null
  domain: CurriculumDomain | null
  rationale: string | null
}

export interface CoachCurriculumBridgeResult {
  ok: boolean
  inboxItem: CurriculumInboxItem | null
  proposedActionPayload: CoachCurriculumActionPayload | null
  validationErrors: string[]
  validationWarnings: string[]
}

export interface CoachCurriculumActionPayload {
  inboxItem: CurriculumInboxItem
  coachRationale: string | null
  sourceType: CoachCurriculumSourceType
  submittedAt: string
  requiresDirectorApproval: true
  neverAutoApply: true
}

// Process a coach's curriculum idea submission.
// Returns a validated inbox item + proposed_action payload — does NOT write to DB.
// The calling server action must create the proposed_action after receiving this payload.
export function processCurriculumSubmission(
  submission: CoachCurriculumSubmission,
  itemId: string,
): CoachCurriculumBridgeResult {
  const validation = validateCurriculumIdea(submission.idea, submission.domain)

  if (!validation.valid) {
    return {
      ok: false,
      inboxItem: null,
      proposedActionPayload: null,
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
    }
  }

  const sourceType: CurriculumInboxSourceType =
    submission.sourceType === 'voice' ? 'voice' : 'text'

  const inboxItem = buildCurriculumInboxItem({
    id: itemId,
    sourceType: 'coach_suggestion',
    idea: submission.idea,
    proposedLevel: submission.proposedLevel,
    domain: submission.domain,
    addedBy: submission.coachId,
    proposedActionId: null,
  })

  const proposedActionPayload: CoachCurriculumActionPayload = {
    inboxItem,
    coachRationale: submission.rationale,
    sourceType,
    submittedAt: new Date().toISOString(),
    requiresDirectorApproval: true,
    neverAutoApply: true,
  }

  return {
    ok: true,
    inboxItem,
    proposedActionPayload,
    validationErrors: [],
    validationWarnings: validation.warnings,
  }
}

// Build a safe display label for a curriculum submission in the review queue.
export function buildCurriculumSubmissionLabel(submission: CoachCurriculumSubmission): string {
  const domainLabel = submission.domain
    ? ` (${submission.domain.charAt(0).toUpperCase() + submission.domain.slice(1)})`
    : ''
  const levelLabel = submission.proposedLevel ? ` — ${submission.proposedLevel}` : ''
  return `Curriculum idea${domainLabel}${levelLabel}: "${submission.idea.slice(0, 60)}${submission.idea.length > 60 ? '…' : ''}"`
}

// Validate that a coach is allowed to submit curriculum ideas (role gate).
// This is a guard — the server action must also enforce role permissions via RLS.
export function isCoachAllowedToSubmitCurriculumIdea(coachRole: string): boolean {
  return coachRole === 'coach' || coachRole === 'head_coach'
}
