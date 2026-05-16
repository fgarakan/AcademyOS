// Execution Guardrail Copy System
// Centralized copy strings for all director review and execution guardrail messages.
// Pure constants — no logic, no DB calls, no side effects.
// Import these into review components for consistent safety messaging.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GuardrailCopySet {
  /** Short banner shown on the card — 1–2 sentences */
  banner: string
  /** Safety flag label shown near the false-literal */
  safetyFlag: string
  /** Tooltip/hover text for the safety flag chip */
  safetyFlagTooltip: string
  /** Confirmation prompt shown before the action button */
  confirmPrompt: string
  /** Post-action success note */
  successNote: string
  /** Post-action rejection note */
  rejectionNote: string
}

// ── Parent send guardrail ─────────────────────────────────────────────────────

export const PARENT_SEND_GUARDRAIL: GuardrailCopySet = {
  banner:
    'Director review required before this message is sent. Nothing has been sent to the parent.',
  safetyFlag: 'sendApplied: false',
  safetyFlagTooltip:
    'This draft has not been delivered. Approval here queues it; sending requires a second director action.',
  confirmPrompt:
    'Approve this message draft? The message will not be sent until you explicitly trigger send.',
  successNote: 'Approved — awaiting send trigger from director.',
  rejectionNote: 'Rejected — this draft will not be sent.',
}

// ── Level change guardrail ────────────────────────────────────────────────────

export const LEVEL_CHANGE_GUARDRAIL: GuardrailCopySet = {
  banner:
    "Director approval required before the player's level changes. This is a proposal only.",
  safetyFlag: 'levelChangeApplied: false',
  safetyFlagTooltip:
    'No level change has occurred. Approval here queues the change; it does not apply it immediately.',
  confirmPrompt:
    "Approve this level change? The player's level will update when you apply the change.",
  successNote: 'Approved — level change will be applied when the director triggers execution.',
  rejectionNote: "Rejected — player's level remains unchanged.",
}

// ── Attendance official write guardrail ───────────────────────────────────────

export const ATTENDANCE_WRITE_GUARDRAIL: GuardrailCopySet = {
  banner:
    'Director review required before this exception affects official attendance records. Nothing has been written.',
  safetyFlag: 'officialWriteApplied: false',
  safetyFlagTooltip:
    'Official attendance has not been modified. Approval queues the write; it does not apply it.',
  confirmPrompt:
    'Approve this attendance exception? Official records will update when you apply the change.',
  successNote: 'Approved — attendance exception queued for official record update.',
  rejectionNote: 'Rejected — attendance records remain unchanged.',
}

// ── Coach observation → profile promotion guardrail ───────────────────────────

export const OBSERVATION_PROFILE_GUARDRAIL: GuardrailCopySet = {
  banner:
    'Director approval required before this observation is added to the player profile.',
  safetyFlag: 'profileMutationApplied: false',
  safetyFlagTooltip:
    "Player profile has not been modified. Approving adds the observation to review queue; 'Add to profile' writes it.",
  confirmPrompt:
    "Approve this observation? It will appear in the review queue. Click 'Add to player profile' to write it.",
  successNote: 'Approved — observation queued for profile update.',
  rejectionNote: 'Rejected — this observation will not appear in the player profile.',
}

export const OBSERVATION_PROFILE_PROMOTE_GUARDRAIL: GuardrailCopySet = {
  banner:
    "This will write the observation to the player's permanent profile. This action is logged in the audit trail.",
  safetyFlag: 'profileMutationApplied: false',
  safetyFlagTooltip:
    "Player profile has not been modified yet. Clicking 'Add to player profile' will write the record.",
  confirmPrompt:
    "Add this observation to the player's profile? This writes to the database and is logged.",
  successNote: "Added to player's profile.",
  rejectionNote: 'Observation removed from profile queue.',
}

// ── Session record write guardrail ────────────────────────────────────────────

export const SESSION_RECORD_GUARDRAIL: GuardrailCopySet = {
  banner: 'Director approval required before session records are updated.',
  safetyFlag: 'officialWriteApplied: false',
  safetyFlagTooltip:
    'Session record has not been modified. Approval queues the write; "Approve & apply" writes immediately.',
  confirmPrompt:
    "Approve this session wrap-up? Session records will update when you confirm.",
  successNote: 'Session record updated.',
  rejectionNote: 'Rejected — session record unchanged.',
}

// ── DONNA proposal guardrail (generic) ────────────────────────────────────────

export const DONNA_PROPOSAL_GUARDRAIL: GuardrailCopySet = {
  banner:
    'DONNA proposes — the director approves — the system executes. Nothing changes without your explicit approval.',
  safetyFlag: 'executionApplied: false',
  safetyFlagTooltip:
    'This is a proposal from DONNA. It has not been applied. You must approve it before anything changes.',
  confirmPrompt: 'Approve this action? It will move to the execution queue.',
  successNote: 'Approved — queued for execution.',
  rejectionNote: 'Rejected — no action will be taken.',
}

// ── Lookup helper ─────────────────────────────────────────────────────────────

export type GuardrailCopyKey =
  | 'parent_send'
  | 'level_change'
  | 'attendance_write'
  | 'observation_profile'
  | 'observation_profile_promote'
  | 'session_record'
  | 'donna_proposal'

const GUARDRAIL_MAP: Record<GuardrailCopyKey, GuardrailCopySet> = {
  parent_send: PARENT_SEND_GUARDRAIL,
  level_change: LEVEL_CHANGE_GUARDRAIL,
  attendance_write: ATTENDANCE_WRITE_GUARDRAIL,
  observation_profile: OBSERVATION_PROFILE_GUARDRAIL,
  observation_profile_promote: OBSERVATION_PROFILE_PROMOTE_GUARDRAIL,
  session_record: SESSION_RECORD_GUARDRAIL,
  donna_proposal: DONNA_PROPOSAL_GUARDRAIL,
}

export function getGuardrailCopy(key: GuardrailCopyKey): GuardrailCopySet {
  return GUARDRAIL_MAP[key]
}
