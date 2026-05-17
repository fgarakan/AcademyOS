// Sprint 573 — Session Actual Apply Guardrails V1
// Safety checks preventing destructive session updates and template overwrites.
// Pure TypeScript — no DB writes, no execution.

import type {
  SessionActualDraftPayload,
} from '@/app/coach/sessions/[sessionId]/saveWrapUpDraftAction'

// ── Guardrail types ───────────────────────────────────────────────────────────

export interface SessionApplyGuardrailResult {
  canApply: boolean
  blockers: SessionApplyBlocker[]
  warnings: SessionApplyWarning[]
  requiresExtraConfirmation: boolean
}

export interface SessionApplyBlocker {
  code: string
  message: string
}

export interface SessionApplyWarning {
  code: string
  message: string
  severity: 'high' | 'medium' | 'low'
}

// ── Guardrail engine ──────────────────────────────────────────────────────────

export function checkSessionActualApplyGuardrails(
  payload: SessionActualDraftPayload,
  draftStatus: string,
  sessionAlreadyHasNotes: boolean,
): SessionApplyGuardrailResult {
  const blockers: SessionApplyBlocker[] = []
  const warnings: SessionApplyWarning[] = []

  // ── Hard blockers ──

  if (draftStatus !== 'approved') {
    blockers.push({
      code: 'NOT_APPROVED',
      message: 'This draft must be approved by a director or head coach before it can be applied.',
    })
  }

  if (!payload.session_id) {
    blockers.push({
      code: 'NO_SESSION',
      message: 'This draft is not linked to a specific session. Cannot apply.',
    })
  }

  // ── Soft warnings ──

  if (sessionAlreadyHasNotes) {
    warnings.push({
      code: 'OVERWRITES_EXISTING_NOTES',
      message: 'This session already has notes. Applying this draft will overwrite the existing notes.',
      severity: 'high',
    })
  }

  const completedBlocks = payload.block_completion.filter(b => b.status === 'completed').length
  const totalBlocks = payload.block_completion.length
  if (totalBlocks > 0 && completedBlocks === 0) {
    warnings.push({
      code: 'NO_COMPLETED_BLOCKS',
      message: 'No blocks were completed in this session. The session note will reflect zero completion.',
      severity: 'medium',
    })
  }

  const allSkipped = payload.block_completion.every(b => b.status === 'skipped')
  if (totalBlocks > 0 && allSkipped) {
    warnings.push({
      code: 'ALL_BLOCKS_SKIPPED',
      message: 'All blocks were skipped. This will be recorded as a non-executed session.',
      severity: 'medium',
    })
  }

  if (payload.warnings.length > 0) {
    warnings.push({
      code: 'DRAFT_WARNINGS',
      message: `This draft has ${payload.warnings.length} warning${payload.warnings.length === 1 ? '' : 's'} from capture. Review before applying.`,
      severity: 'medium',
    })
  }

  const highSeverity = warnings.filter(w => w.severity === 'high')
  const requiresExtraConfirmation = highSeverity.length > 0

  return {
    canApply: blockers.length === 0,
    blockers,
    warnings,
    requiresExtraConfirmation,
  }
}

// ── Template protection ───────────────────────────────────────────────────────

export const SESSION_ACTUAL_GUARDRAIL_COPY = {
  templateProtectedNote: 'Session templates are never modified by wrap-up drafts. Only the session instance record (notes) is updated.',
  irreversibleNote: 'Applying session notes cannot be automatically undone. The previous notes will be replaced.',
  approvalRequired: 'Only directors and head coaches can apply session actual drafts.',
} as const
