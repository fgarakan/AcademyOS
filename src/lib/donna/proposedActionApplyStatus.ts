// Sprint 563 — Proposed Action Apply Status Model V1
// Defines the apply status model for all proposed actions.
// Pure TypeScript — no DB, no external sends.

// ── Apply status type ─────────────────────────────────────────────────────────

export type ProposedActionApplyStatus =
  | 'draft'               // created by voice/conversation, not yet reviewed
  | 'needs_review'        // flagged for director/head coach review
  | 'approved'            // human approved — not yet applied to official record
  | 'approved_not_applied' // approved but application was skipped or deferred
  | 'applied'             // official system change completed
  | 'rejected'            // human rejected — no action taken
  | 'blocked'             // blocked by dependency, schema, or policy
  | 'failed'              // apply was attempted but failed

// ── Status metadata ───────────────────────────────────────────────────────────

export interface ApplyStatusMeta {
  label: string
  description: string
  isTerminal: boolean      // can this status be followed by another action?
  requiresHumanAction: boolean
  colorClass: string
  dotClass: string
}

export const APPLY_STATUS_META: Record<ProposedActionApplyStatus, ApplyStatusMeta> = {
  draft: {
    label: 'Draft',
    description: 'Created by DONNA or voice capture. Awaiting review.',
    isTerminal: false,
    requiresHumanAction: false,
    colorClass: 'text-text-muted',
    dotClass: 'bg-text-muted',
  },
  needs_review: {
    label: 'Needs review',
    description: 'Flagged for director or head coach review before any action.',
    isTerminal: false,
    requiresHumanAction: true,
    colorClass: 'text-status-orange',
    dotClass: 'bg-status-orange',
  },
  approved: {
    label: 'Approved',
    description: 'Director or head coach has approved. Ready to apply.',
    isTerminal: false,
    requiresHumanAction: false,
    colorClass: 'text-status-blue',
    dotClass: 'bg-status-blue',
  },
  approved_not_applied: {
    label: 'Approved — not applied',
    description: 'Approved by a human but application to official records was deferred or skipped.',
    isTerminal: false,
    requiresHumanAction: true,
    colorClass: 'text-status-orange',
    dotClass: 'bg-status-orange',
  },
  applied: {
    label: 'Applied',
    description: 'Official system change completed successfully.',
    isTerminal: true,
    requiresHumanAction: false,
    colorClass: 'text-status-green',
    dotClass: 'bg-status-green',
  },
  rejected: {
    label: 'Rejected',
    description: 'Director or head coach rejected this action. No change made.',
    isTerminal: true,
    requiresHumanAction: false,
    colorClass: 'text-status-red',
    dotClass: 'bg-status-red',
  },
  blocked: {
    label: 'Blocked',
    description: 'Cannot be applied — blocked by a dependency, schema gap, or policy.',
    isTerminal: false,
    requiresHumanAction: true,
    colorClass: 'text-text-muted',
    dotClass: 'bg-border',
  },
  failed: {
    label: 'Failed',
    description: 'Apply was attempted but encountered an error. May be retried.',
    isTerminal: false,
    requiresHumanAction: true,
    colorClass: 'text-status-red',
    dotClass: 'bg-status-red',
  },
}

// ── Valid transitions ─────────────────────────────────────────────────────────

export const VALID_TRANSITIONS: Record<ProposedActionApplyStatus, ProposedActionApplyStatus[]> = {
  draft:                ['needs_review', 'approved', 'rejected'],
  needs_review:         ['approved', 'rejected', 'blocked'],
  approved:             ['applied', 'approved_not_applied', 'failed', 'blocked'],
  approved_not_applied: ['applied', 'rejected'],
  applied:              [],   // terminal
  rejected:             [],   // terminal
  blocked:              ['needs_review', 'draft'],
  failed:               ['approved', 'rejected'],
}

export function canTransitionTo(
  from: ProposedActionApplyStatus,
  to: ProposedActionApplyStatus,
): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isActionable(status: ProposedActionApplyStatus): boolean {
  return !APPLY_STATUS_META[status].isTerminal
}

export function requiresHumanAction(status: ProposedActionApplyStatus): boolean {
  return APPLY_STATUS_META[status].requiresHumanAction
}

export function getStatusLabel(status: ProposedActionApplyStatus): string {
  return APPLY_STATUS_META[status].label
}

export function getStatusColor(status: ProposedActionApplyStatus): string {
  return APPLY_STATUS_META[status].colorClass
}

export function getStatusDot(status: ProposedActionApplyStatus): string {
  return APPLY_STATUS_META[status].dotClass
}
