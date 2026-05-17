// Sprint 579 — Parent Draft Internal Approval State V1
// Internal approval state model for parent drafts (development summaries, parent-safe observations).
// Separates internal approval from external send. No external sends.
// Pure TypeScript — no DB writes in this module.

// ── State types ───────────────────────────────────────────────────────────────

export type ParentDraftInternalState =
  | 'draft'                 // created, not yet reviewed
  | 'under_review'          // director is reviewing
  | 'approved_internal'     // approved — visible in parent portal only, no send yet
  | 'approved_for_send'     // approved AND ready to send (when integration exists)
  | 'send_blocked'          // approved but external send integration not available
  | 'rejected'              // director rejected — no action
  | 'archived'              // no longer active; not sent

// ── State metadata ────────────────────────────────────────────────────────────

export interface ParentDraftStateMeta {
  label: string
  description: string
  isVisible: boolean           // visible in parent portal?
  isSendReady: boolean         // ready for external send?
  sendBlockedReason: string | null
  colorClass: string
}

export const PARENT_DRAFT_STATE_META: Record<ParentDraftInternalState, ParentDraftStateMeta> = {
  draft: {
    label: 'Draft',
    description: 'Created. Awaiting director review.',
    isVisible: false,
    isSendReady: false,
    sendBlockedReason: 'Not yet reviewed',
    colorClass: 'text-text-muted',
  },
  under_review: {
    label: 'Under review',
    description: 'Director is reviewing this parent update.',
    isVisible: false,
    isSendReady: false,
    sendBlockedReason: 'Pending approval',
    colorClass: 'text-status-orange',
  },
  approved_internal: {
    label: 'Approved — portal only',
    description: 'Director approved. Visible in parent portal if parent logs in. No notification sent.',
    isVisible: true,
    isSendReady: false,
    sendBlockedReason: 'External send not configured',
    colorClass: 'text-status-green',
  },
  approved_for_send: {
    label: 'Approved for send',
    description: 'Director approved and marked ready for external send when integration is available.',
    isVisible: true,
    isSendReady: true,
    sendBlockedReason: null,
    colorClass: 'text-status-green',
  },
  send_blocked: {
    label: 'Send blocked',
    description: 'Approved but external send integration is not configured for this academy.',
    isVisible: true,
    isSendReady: false,
    sendBlockedReason: 'External send integration not available',
    colorClass: 'text-status-orange',
  },
  rejected: {
    label: 'Rejected',
    description: 'Director rejected this parent update. No action taken.',
    isVisible: false,
    isSendReady: false,
    sendBlockedReason: null,
    colorClass: 'text-status-red',
  },
  archived: {
    label: 'Archived',
    description: 'This parent update is no longer active.',
    isVisible: false,
    isSendReady: false,
    sendBlockedReason: null,
    colorClass: 'text-text-muted',
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getParentDraftStateLabel(state: ParentDraftInternalState): string {
  return PARENT_DRAFT_STATE_META[state].label
}

export function isParentPortalVisible(state: ParentDraftInternalState): boolean {
  return PARENT_DRAFT_STATE_META[state].isVisible
}

export function isSendReadyState(state: ParentDraftInternalState): boolean {
  return PARENT_DRAFT_STATE_META[state].isSendReady
}

export function getSendBlockedReason(state: ParentDraftInternalState): string | null {
  return PARENT_DRAFT_STATE_META[state].sendBlockedReason
}

// ── State from proposed_actions status ────────────────────────────────────────

export function deriveParentDraftState(
  proposedActionStatus: string,
  sendIntegrationAvailable: boolean,
): ParentDraftInternalState {
  switch (proposedActionStatus) {
    case 'pending_review': return 'under_review'
    case 'rejected':       return 'rejected'
    case 'approved':
      return sendIntegrationAvailable ? 'approved_for_send' : 'send_blocked'
    case 'applied':
      return 'approved_internal'
    default:
      return 'draft'
  }
}
