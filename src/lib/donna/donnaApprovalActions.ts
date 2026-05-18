// Sprint 1023 — DONNA Requires Approval Actions V1
// Approval-required action proposals: level movement, parent messages, roster changes.
// These go to proposed_actions with status=pending_review and require explicit director approval.
// Director sees full context before approving. DONNA never auto-executes approval actions.
// No DB writes. Payload construction only.

// ── Approval request shape ────────────────────────────────────────────────────

export interface DonnaApprovalRequest {
  actionId: string
  targetModule: string
  targetObjectId: string | null
  actionLabel: string
  riskLevel: 'high' | 'medium' | 'low'
  payload: Record<string, unknown>
  proposedBy: string
  proposedAt: string
  directorReviewContext: DirectorReviewContext
  safetyNotes: string[]
  requiresDirectorApproval: true
  autoExecute: false
}

// ── Director review context ───────────────────────────────────────────────────

export interface DirectorReviewContext {
  headline: string
  summary: string
  whatChanges: string[]
  whatDoesNotChange: string[]
  reversible: boolean
  reversalNote: string | null
  approvalLabel: string
  rejectionLabel: string
}

// ── Level movement approval ───────────────────────────────────────────────────

export interface LevelMovementApprovalInput {
  directorUserId: string
  playerId: string
  playerName: string
  fromLevel: string
  toLevel: string
  evidence: string[]
  proposedByCoachId: string | null
  proposedByCoachName: string | null
}

export function validateLevelMovementApproval(
  input: Partial<LevelMovementApprovalInput>,
): { valid: boolean; blockedReason: string | null } {
  const missing: string[] = []

  if (!input.playerId) missing.push('playerId')
  if (!input.playerName) missing.push('playerName')
  if (!input.fromLevel) missing.push('fromLevel')
  if (!input.toLevel) missing.push('toLevel')
  if (!input.directorUserId) missing.push('directorUserId')

  if (input.fromLevel === input.toLevel) {
    return { valid: false, blockedReason: 'From and to levels are the same — no movement needed.' }
  }

  if (missing.length > 0) {
    return { valid: false, blockedReason: `Missing: ${missing.join(', ')}` }
  }

  return { valid: true, blockedReason: null }
}

export function buildLevelMovementApproval(input: LevelMovementApprovalInput): DonnaApprovalRequest {
  const evidenceSummary = input.evidence.length > 0
    ? input.evidence.join('; ')
    : 'No evidence items provided'

  return {
    actionId: 'approve_level_move',
    targetModule: 'level_review',
    targetObjectId: input.playerId,
    actionLabel: `Level move — ${input.playerName}: ${input.fromLevel} → ${input.toLevel}`,
    riskLevel: 'high',
    payload: {
      player_id: input.playerId,
      player_name: input.playerName,
      from_level: input.fromLevel,
      to_level: input.toLevel,
      evidence: input.evidence,
      proposed_by_coach_id: input.proposedByCoachId,
      proposed_by_coach_name: input.proposedByCoachName,
      requires_director_approval: true,
    },
    proposedBy: input.directorUserId,
    proposedAt: new Date().toISOString(),
    directorReviewContext: {
      headline: `Level move: ${input.playerName}`,
      summary: `Proposed move from ${input.fromLevel} to ${input.toLevel}. Evidence: ${evidenceSummary}`,
      whatChanges: [
        `${input.playerName}'s curriculum level changes from ${input.fromLevel} to ${input.toLevel}`,
        'Player will be assigned to the new level\'s session templates',
        'Coach will be notified',
      ],
      whatDoesNotChange: [
        'Player profile data and history',
        'Existing session records',
        'Parent communications (separate approval)',
      ],
      reversible: true,
      reversalNote: 'Level can be reversed by director at any time.',
      approvalLabel: `Approve move to ${input.toLevel}`,
      rejectionLabel: 'Reject — keep at current level',
    },
    safetyNotes: [
      'DONNA never moves a player\'s level automatically.',
      'This action requires explicit director approval.',
      'The move is applied only after director confirms.',
    ],
    requiresDirectorApproval: true,
    autoExecute: false,
  }
}

// ── Parent message approval ───────────────────────────────────────────────────

export interface ParentMessageApprovalInput {
  directorUserId: string
  playerId: string
  playerName: string
  parentContactName: string | null
  draftContent: string
  contentType: 'development_summary' | 'curriculum_update' | 'attendance_concern' | 'general'
  draftedByCoachId: string | null
  draftedByCoachName: string | null
}

export function validateParentMessageApproval(
  input: Partial<ParentMessageApprovalInput>,
): { valid: boolean; blockedReason: string | null } {
  const missing: string[] = []

  if (!input.playerId) missing.push('playerId')
  if (!input.playerName) missing.push('playerName')
  if (!input.draftContent || input.draftContent.trim().length < 20) missing.push('draftContent (minimum 20 characters)')
  if (!input.directorUserId) missing.push('directorUserId')

  if (missing.length > 0) {
    return { valid: false, blockedReason: `Missing: ${missing.join(', ')}` }
  }

  return { valid: true, blockedReason: null }
}

export function buildParentMessageApproval(input: ParentMessageApprovalInput): DonnaApprovalRequest {
  return {
    actionId: 'send_parent_message',
    targetModule: 'parent_communication',
    targetObjectId: input.playerId,
    actionLabel: `Parent update — ${input.playerName}`,
    riskLevel: 'high',
    payload: {
      player_id: input.playerId,
      player_name: input.playerName,
      parent_contact_name: input.parentContactName,
      draft_content: input.draftContent,
      content_type: input.contentType,
      drafted_by_coach_id: input.draftedByCoachId,
      drafted_by_coach_name: input.draftedByCoachName,
      requires_director_approval: true,
      send_not_built: true,
    },
    proposedBy: input.directorUserId,
    proposedAt: new Date().toISOString(),
    directorReviewContext: {
      headline: `Parent update: ${input.playerName}`,
      summary: `Draft parent communication ready for review. Type: ${input.contentType}. Parent: ${input.parentContactName ?? 'Unknown'}.`,
      whatChanges: [
        'Parent receives a communication about their child',
        'Communication is logged in academy records',
      ],
      whatDoesNotChange: [
        'Player\'s curriculum level',
        'Session schedule',
        'Player profile data',
      ],
      reversible: false,
      reversalNote: 'Once sent, parent communications cannot be unsent. Review carefully.',
      approvalLabel: 'Approve and mark ready to send',
      rejectionLabel: 'Reject — do not send',
    },
    safetyNotes: [
      'Parent send flow is not yet built — this approval marks the draft as ready but does not send.',
      'Director must approve before any parent receives this message.',
      'Do not send information about assessments or level changes without coach input.',
    ],
    requiresDirectorApproval: true,
    autoExecute: false,
  }
}

// ── Roster change approval ────────────────────────────────────────────────────

export interface RosterChangeApprovalInput {
  directorUserId: string
  playerId: string
  playerName: string
  changeType: 'group_move' | 'enroll' | 'deactivate'
  fromGroupId: string | null
  fromGroupName: string | null
  toGroupId: string | null
  toGroupName: string | null
  reason: string
}

export function buildRosterChangeApproval(input: RosterChangeApprovalInput): DonnaApprovalRequest {
  const label = input.changeType === 'group_move'
    ? `Group move — ${input.playerName}: ${input.fromGroupName ?? '?'} → ${input.toGroupName ?? '?'}`
    : input.changeType === 'enroll'
    ? `Enroll ${input.playerName}`
    : `Deactivate ${input.playerName}`

  return {
    actionId: 'roster_mutation',
    targetModule: 'move_player_group',
    targetObjectId: input.playerId,
    actionLabel: label,
    riskLevel: 'high',
    payload: {
      player_id: input.playerId,
      player_name: input.playerName,
      change_type: input.changeType,
      from_group_id: input.fromGroupId,
      from_group_name: input.fromGroupName,
      to_group_id: input.toGroupId,
      to_group_name: input.toGroupName,
      reason: input.reason,
      requires_director_approval: true,
    },
    proposedBy: input.directorUserId,
    proposedAt: new Date().toISOString(),
    directorReviewContext: {
      headline: label,
      summary: `Roster change requested. Reason: ${input.reason}`,
      whatChanges: [
        `${input.playerName}'s group assignment changes`,
        'Future sessions will reflect the new assignment',
      ],
      whatDoesNotChange: [
        'Historical session records',
        'Player profile and curriculum state',
        'Parent communications',
      ],
      reversible: true,
      reversalNote: 'Roster changes can be reversed by the director.',
      approvalLabel: 'Approve roster change',
      rejectionLabel: 'Reject',
    },
    safetyNotes: [
      'DONNA never mutates the roster automatically.',
      'Roster changes are applied only after director approval.',
    ],
    requiresDirectorApproval: true,
    autoExecute: false,
  }
}

// ── Director-facing summary builder ───────────────────────────────────────────

export function getApprovalActionSummary(request: DonnaApprovalRequest): string {
  const ctx = request.directorReviewContext
  return `${ctx.headline}: ${ctx.summary}`
}

export function getApprovalRiskBadge(riskLevel: 'high' | 'medium' | 'low'): string {
  switch (riskLevel) {
    case 'high': return 'bg-status-red/10 text-status-red border border-status-red/20'
    case 'medium': return 'bg-status-orange/10 text-status-orange border border-status-orange/20'
    case 'low': return 'bg-status-green/10 text-status-green border border-status-green/20'
  }
}
