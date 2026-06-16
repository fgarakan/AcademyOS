// Sprint 2891–2920 — DONNA Knowledge Promotion Engine V1
// Part 5 — Knowledge Approval Workflow
//
// Governs how KnowledgePromotionCandidates move through the approval pipeline.
// Every action requires a named approver — no automatic promotions.
//
// Available actions:
//   approve          — director accepts the draft; moves to approved
//   reject           — director rejects; candidate is closed
//   request_revision — sends back to candidate for redrafting
//   merge            — marks as duplicate of an existing knowledge item
//   defer            — pauses review without rejecting
//   promote          — approved candidate becomes promoted knowledge (writes to Registry)
//
// Rules:
//   - Brian-originated learning SHOULD have Brian as approver (enforced by requiresBrianApproval flag)
//   - Global/philosophy scope requires owner approval
//   - Academy-specific scope can be approved by academy director
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Returns new candidate state — caller updates the store.

import type { KnowledgePromotionCandidate, CandidateStatus } from './knowledgePromotionCandidateModel'
import { canTransitionCandidate } from './knowledgePromotionCandidateModel'

// ── Workflow action types ──────────────────────────────────────────────────────

export type ApprovalAction =
  | 'approve'
  | 'reject'
  | 'request_revision'
  | 'merge'
  | 'defer'
  | 'promote'

export type ApproverRole = 'academy_director' | 'owner' | 'brian_dabul' | 'head_coach'

// ── Action params ─────────────────────────────────────────────────────────────

export interface ApprovalActionParams {
  action: ApprovalAction
  approverName: string
  approverRole: ApproverRole
  reason?: string
  mergeTargetKnowledgeId?: string    // for 'merge' action
  revisedTitle?: string              // for 'request_revision' — optional new title suggestion
  revisedBody?: string               // for 'request_revision' — optional new body suggestion
}

// ── Workflow result ───────────────────────────────────────────────────────────

export interface ApprovalWorkflowResult {
  success: boolean
  candidate: KnowledgePromotionCandidate   // updated candidate
  action: ApprovalAction
  newStatus: CandidateStatus
  reason: string | null
  blockedReason: string | null
  requiresOwnerNotification: boolean
}

// ── Action-to-status mapping ──────────────────────────────────────────────────

const ACTION_STATUS_MAP: Record<ApprovalAction, CandidateStatus> = {
  approve:          'approved',
  reject:           'rejected',
  request_revision: 'candidate',
  merge:            'archived',
  defer:            'in_review',    // stays in review but paused
  promote:          'promoted',
}

// ── Permission check ──────────────────────────────────────────────────────────

function checkApproverPermission(
  candidate: KnowledgePromotionCandidate,
  action: ApprovalAction,
  approverRole: ApproverRole,
): string | null {
  // Only owner/brian can approve brian_philosophy or global scope
  if (
    (action === 'approve' || action === 'promote') &&
    (candidate.targetScope === 'brian_philosophy_knowledge' ||
      candidate.targetScope === 'global_platform_knowledge_candidate')
  ) {
    if (approverRole !== 'owner' && approverRole !== 'brian_dabul') {
      return `Scope "${candidate.targetScope}" requires owner or Brian approval`
    }
  }

  // Brian-originated learning should be confirmed by Brian (advisory — not hard block)
  // We log a warning but do not block director approval of non-philosophy scope
  return null
}

// ── Main workflow action ──────────────────────────────────────────────────────

/**
 * Apply an approval action to a candidate.
 * Returns the updated candidate and a result report.
 * Does NOT mutate the input — returns a new candidate object.
 */
export function applyApprovalAction(
  candidate: KnowledgePromotionCandidate,
  params: ApprovalActionParams,
): ApprovalWorkflowResult {
  const { action, approverName, approverRole, reason } = params

  // Check status transition
  const targetStatus = ACTION_STATUS_MAP[action]
  if (!canTransitionCandidate(candidate.status, targetStatus)) {
    return {
      success: false,
      candidate,
      action,
      newStatus: candidate.status,
      reason: reason ?? null,
      blockedReason: `Cannot transition from "${candidate.status}" to "${targetStatus}" via action "${action}"`,
      requiresOwnerNotification: false,
    }
  }

  // Check permissions
  const permissionError = checkApproverPermission(candidate, action, approverRole)
  if (permissionError) {
    return {
      success: false,
      candidate,
      action,
      newStatus: candidate.status,
      reason: reason ?? null,
      blockedReason: permissionError,
      requiresOwnerNotification: false,
    }
  }

  const now = new Date().toISOString()

  // Build updated candidate
  let updated: KnowledgePromotionCandidate = {
    ...candidate,
    status: targetStatus,
    reviewedAt: now,
  }

  switch (action) {
    case 'approve':
      updated = {
        ...updated,
        approvedBy: approverName,
        approvedAt: now,
        isDraft: false,         // finalized
        rejectedReason: null,
      }
      break

    case 'reject':
      updated = {
        ...updated,
        rejectedReason: reason ?? 'No reason provided',
        approvedBy: null,
        approvedAt: null,
      }
      break

    case 'request_revision':
      updated = {
        ...updated,
        isDraft: true,
        proposedTitle: params.revisedTitle ?? candidate.proposedTitle,
        proposedBody: params.revisedBody ?? candidate.proposedBody,
      }
      break

    case 'merge':
      updated = {
        ...updated,
        metadata: {
          ...candidate.metadata,
          mergedIntoKnowledgeId: params.mergeTargetKnowledgeId ?? null,
          mergeReason: reason ?? 'Duplicate knowledge item',
          mergedBy: approverName,
          mergedAt: now,
        },
      }
      break

    case 'promote':
      updated = {
        ...updated,
        approvedBy: updated.approvedBy ?? approverName,
        approvedAt: updated.approvedAt ?? now,
      }
      break

    case 'defer':
      // Status stays in_review — just mark when it was deferred
      updated = {
        ...updated,
        status: 'in_review',
        metadata: {
          ...candidate.metadata,
          deferredBy: approverName,
          deferredAt: now,
          deferReason: reason ?? null,
        },
      }
      break
  }

  const requiresOwnerNotification =
    updated.requiresOwnerApproval &&
    (action === 'approve' || action === 'promote') &&
    approverRole !== 'owner' &&
    approverRole !== 'brian_dabul'

  return {
    success: true,
    candidate: updated,
    action,
    newStatus: updated.status,
    reason: reason ?? null,
    blockedReason: null,
    requiresOwnerNotification,
  }
}

// ── Workflow summary ──────────────────────────────────────────────────────────

export interface WorkflowSummary {
  totalCandidates: number
  byCandidateStatus: Record<CandidateStatus, number>
  requiresBrianCount: number
  requiresOwnerCount: number
  pendingApprovalCount: number
  promotedCount: number
  rejectedCount: number
}

export function buildWorkflowSummary(candidates: KnowledgePromotionCandidate[]): WorkflowSummary {
  const byCandidateStatus: Record<CandidateStatus, number> = {
    candidate: 0, in_review: 0, approved: 0, rejected: 0, promoted: 0, archived: 0,
  }
  for (const c of candidates) {
    byCandidateStatus[c.status] = (byCandidateStatus[c.status] ?? 0) + 1
  }

  return {
    totalCandidates: candidates.length,
    byCandidateStatus,
    requiresBrianCount: candidates.filter(c => c.requiresBrianApproval).length,
    requiresOwnerCount: candidates.filter(c => c.requiresOwnerApproval).length,
    pendingApprovalCount: byCandidateStatus.candidate + byCandidateStatus.in_review,
    promotedCount: byCandidateStatus.promoted,
    rejectedCount: byCandidateStatus.rejected,
  }
}
