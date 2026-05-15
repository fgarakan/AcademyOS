// Sprint 362 — Donna Approval Request Contract V1
// Pure types + utilities. No React, no API calls, no DB writes.
// Defines the typed shape of what Donna submits for director approval.

import type { DonnaDraftState } from './donnaDraftRuntime'
import { summarizeDraft } from './donnaDraftRuntime'

// ── Types ──────────────────────────────────────────────────────────────────────

export type DonnaApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired'

export interface DonnaApprovalRequest {
  /** Client-generated unique ID */
  id: string
  createdAt: string         // ISO
  workflowId: string | null
  taskId: string
  /** Human-readable one-sentence summary */
  summary: string
  /** All field key/value pairs collected during the draft */
  fields: Record<string, string>
  /** Who initiated the request (director userId or role label) */
  requestedBy: string
  /** Minimum role required to approve */
  requiresRole: string
  urgency: 'high' | 'normal' | 'low'
  /** Full snapshot of the draft at submission time */
  draftSnapshot: DonnaDraftState
}

export interface DonnaApprovalRecord {
  request: DonnaApprovalRequest
  status: DonnaApprovalStatus
  reviewedAt?: string
  reviewedBy?: string
  notes?: string
}

// ── Utilities ──────────────────────────────────────────────────────────────────

let _idCounter = 0
function generateId(): string {
  _idCounter += 1
  return `approval_${Date.now()}_${_idCounter}`
}

/**
 * Create an approval request from a completed draft.
 * The draft should be in `ready_for_review` phase before calling this.
 */
export function createApprovalRequest(
  draft: DonnaDraftState,
  requestedBy: string,
): DonnaApprovalRequest {
  const summary = summarizeDraft(draft)

  // Build a human-readable summary from field lines
  const fieldSummaryParts = summary.fieldLines
    .map(({ label, value }) => `${label}: ${value}`)
    .join('; ')
  const taskLabel = summary.taskLabel
  const humanSummary = fieldSummaryParts
    ? `${taskLabel} — ${fieldSummaryParts}`
    : taskLabel

  // Flatten fields from DraftFieldEntry to plain string map
  const fields: Record<string, string> = {}
  for (const [key, entry] of Object.entries(draft.fields)) {
    fields[key] = entry.value
  }

  return {
    id: generateId(),
    createdAt: new Date().toISOString(),
    workflowId: draft.workflowId,
    taskId: draft.taskId,
    summary: humanSummary,
    fields,
    requestedBy,
    requiresRole: 'academy_director',
    urgency: 'normal',
    draftSnapshot: { ...draft },
  }
}

/**
 * Format an approval request as a human-readable string for display.
 */
export function formatApprovalSummary(request: DonnaApprovalRequest): string {
  const lines: string[] = [
    `Task: ${request.taskId.replace(/_/g, ' ')}`,
    `Summary: ${request.summary}`,
    `Requested by: ${request.requestedBy}`,
    `Requires: ${request.requiresRole}`,
    `Urgency: ${request.urgency}`,
    `Created: ${new Date(request.createdAt).toLocaleString()}`,
  ]
  return lines.join('\n')
}
