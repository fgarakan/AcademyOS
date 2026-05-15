// Sprint 382 — Donna Workflow Card Actions V1
// Safe action model for all Donna workflow card CTAs.
// All Sprint 382 actions are non-mutating. No real execution adapters run here.

// ── Safety levels ─────────────────────────────────────────────────────────────

export type WorkflowCardActionSafetyLevel = 'safe' | 'review_required' | 'blocked'

// ── Action descriptor ─────────────────────────────────────────────────────────

export interface WorkflowCardAction {
  id: string
  label: string
  description: string
  safetyLevel: WorkflowCardActionSafetyLevel
  requiresApproval: boolean
  mutatesData: boolean
  targetRoute?: string
  disabledReason?: string
}

// ── Action catalog ─────────────────────────────────────────────────────────────

export const WORKFLOW_CARD_ACTIONS: Record<string, WorkflowCardAction> = {
  open_review_queue: {
    id: 'open_review_queue',
    label: 'Open review queue',
    description: 'Opens the Donna review queue panel inside the assistant',
    safetyLevel: 'safe',
    requiresApproval: false,
    mutatesData: false,
    targetRoute: '/director/review',
  },
  open_draft_review: {
    id: 'open_draft_review',
    label: 'Review on screen',
    description: 'Shows the communication draft for director review — no send action',
    safetyLevel: 'safe',
    requiresApproval: false,
    mutatesData: false,
  },
  continue_draft: {
    id: 'continue_draft',
    label: 'Continue filling',
    description: 'Continue providing missing information for the active draft',
    safetyLevel: 'safe',
    requiresApproval: false,
    mutatesData: false,
  },
  discard_draft: {
    id: 'discard_draft',
    label: 'Discard',
    description: 'Discard the current draft — no data is written',
    safetyLevel: 'safe',
    requiresApproval: false,
    mutatesData: false,
  },
  view_attention_why: {
    id: 'view_attention_why',
    label: 'Ask Donna why',
    description: 'Show why this item needs attention, available evidence, and suggested action',
    safetyLevel: 'safe',
    requiresApproval: false,
    mutatesData: false,
  },
  view_recommendation_evidence: {
    id: 'view_recommendation_evidence',
    label: 'Show evidence',
    description: 'Show the signals and rationale behind this recommendation',
    safetyLevel: 'safe',
    requiresApproval: false,
    mutatesData: false,
  },
  prepare_coach_briefs: {
    id: 'prepare_coach_briefs',
    label: 'Prepare coach briefs',
    description: 'Open the coach brief workflow to draft briefs for today',
    safetyLevel: 'safe',
    requiresApproval: false,
    mutatesData: false,
  },
  revise_warmer: {
    id: 'revise_warmer',
    label: 'Make warmer',
    description: 'Ask Donna to revise the message to sound warmer and more personal',
    safetyLevel: 'safe',
    requiresApproval: false,
    mutatesData: false,
  },
  revise_shorter: {
    id: 'revise_shorter',
    label: 'Make shorter',
    description: 'Ask Donna to produce a shorter version of the message',
    safetyLevel: 'safe',
    requiresApproval: false,
    mutatesData: false,
  },
  queue_for_review_placeholder: {
    id: 'queue_for_review_placeholder',
    label: 'Queue for review',
    description: 'Placeholder — requires session ID resolution before this can be safely queued',
    safetyLevel: 'review_required',
    requiresApproval: true,
    mutatesData: true,
    disabledReason: 'Session ID must be confirmed before this draft can be queued for official review.',
  },
  approval_required_send: {
    id: 'approval_required_send',
    label: 'Approve and send',
    description: 'Blocked — Donna cannot send messages directly',
    safetyLevel: 'blocked',
    requiresApproval: true,
    mutatesData: true,
    disabledReason: 'Donna cannot send messages. The director must review and send from the communications module.',
  },
}

// ── Dev Tools tracking ────────────────────────────────────────────────────────

export interface LastCardActionRecord {
  id: string
  label: string
  safetyLevel: WorkflowCardActionSafetyLevel
  requiresApproval: boolean
  mutatesData: boolean
  targetRoute?: string
  blockedReason?: string
  firedAt: string
}

export function makeLastCardAction(actionId: string): LastCardActionRecord | null {
  const a = WORKFLOW_CARD_ACTIONS[actionId]
  if (!a) return null
  return {
    id: a.id,
    label: a.label,
    safetyLevel: a.safetyLevel,
    requiresApproval: a.requiresApproval,
    mutatesData: a.mutatesData,
    targetRoute: a.targetRoute,
    blockedReason: a.disabledReason,
    firedAt: new Date().toISOString(),
  }
}
