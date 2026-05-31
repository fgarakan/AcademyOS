// Sprint 1022 — Director Curriculum Change Approval Flow V1
// Builds the approval routing response for curriculum change proposals.
// Pure TypeScript — no DB writes, no API calls, no mutations.
//
// Purpose:
//   When a director has reviewed a curriculum draft proposal (Sprint 1020) and
//   seen its impact preview (Sprint 1021), this module builds the final response
//   that routes them to the Review Queue for approval.
//
//   This is the bridge between DONNA's suggestion layer and the existing
//   proposed_actions pipeline (Sprint 904). DONNA describes the action, shows
//   the preview, then routes to the Review Queue — it never auto-submits.
//
// Safety invariants:
//   - This module NEVER creates a proposed_action DB record
//   - It only builds the OrchestratorOutput that routes to the Review Queue
//   - The actual proposed_action creation is handled by a server action
//     (Sprint 904 pipeline) after explicit director confirmation in the Review Queue
//   - All approval routing responses are safetyLevel: 'approval_gated'
//   - DONNA never auto-approves, auto-rejects, or auto-submits anything

import type { OrchestratorOutput } from './types'
import type { CurriculumDraftProposal } from './philosophyCurriculumDraftEngine'
import type { CurriculumImpactPreview } from './curriculumImpactPreview'
import { formatImpactPreviewText } from './curriculumImpactPreview'

// ── Approval response builder ─────────────────────────────────────────────────

/**
 * Build an OrchestratorOutput that routes a curriculum change proposal to the Review Queue.
 * The output is approval_gated — director must explicitly act in the Review Queue.
 * This output never auto-submits or auto-applies anything.
 *
 * @param proposal - The curriculum draft proposal from Sprint 1020
 * @param preview - The impact preview from Sprint 1021
 * @param context - Optional context about the current page and director name
 */
export function buildCurriculumApprovalOutput(
  proposal: CurriculumDraftProposal,
  preview: CurriculumImpactPreview,
  context?: {
    firstName?: string | null
    currentPathname?: string
  },
): OrchestratorOutput {
  const greeting = context?.firstName ? `${context.firstName}, ` : ''
  const impactText = formatImpactPreviewText(preview)

  const responseText = [
    `${greeting}here is the curriculum change I'm suggesting and what it would affect:`,
    '',
    impactText,
    '',
    'If you want to proceed, this proposal needs to go through the Review Queue. Nothing changes until you explicitly approve it there.',
  ].join('\n')

  return {
    type: 'draft_proposed_action',
    text: responseText,
    safetyLevel: 'approval_gated',
    requiresConfirmation: true,
    confidence: 'medium',
    source: 'llm_inferred',
    suggestedRoute: '/director/review',
    highlightTarget: {
      targetId: 'review-queue-primary',
      label: 'Review Queue',
      route: '/director/review',
    },
  }
}

// ── Curriculum change router ──────────────────────────────────────────────────

export interface CurriculumChangeRoutingResult {
  /** The orchestrator output to show in the DONNA panel */
  output: OrchestratorOutput
  /** The proposal that was routed */
  proposal: CurriculumDraftProposal
  /** The impact preview that was shown */
  preview: CurriculumImpactPreview
  /** Whether the director was routed to the Review Queue */
  routedToReviewQueue: true
  /** Whether anything was automatically applied */
  autoApplied: false
}

/**
 * Route a curriculum change proposal to the approval flow.
 * Returns a routing result that the DONNA panel can render.
 * Always sets `autoApplied: false` — nothing ever applies automatically.
 */
export function routeCurriculumChangeToApproval(
  proposal: CurriculumDraftProposal,
  preview: CurriculumImpactPreview,
  context?: { firstName?: string | null; currentPathname?: string },
): CurriculumChangeRoutingResult {
  const output = buildCurriculumApprovalOutput(proposal, preview, context)
  return {
    output,
    proposal,
    preview,
    routedToReviewQueue: true,
    autoApplied: false,
  }
}

// ── Safety audit helper ───────────────────────────────────────────────────────

/**
 * Verify that a curriculum change routing result is safe to present.
 * Returns null if safe. Returns an error string if unsafe.
 */
export function auditCurriculumChangeRouting(
  result: CurriculumChangeRoutingResult,
): string | null {
  if (result.autoApplied !== false) {
    return 'SAFETY VIOLATION: autoApplied must be false for curriculum change routing'
  }
  if (result.output.safetyLevel !== 'approval_gated') {
    return `SAFETY VIOLATION: curriculum change output must be approval_gated, got ${result.output.safetyLevel}`
  }
  if (result.output.requiresConfirmation !== true) {
    return 'SAFETY VIOLATION: curriculum change output must requiresConfirmation: true'
  }
  if (result.output.suggestedRoute !== '/director/review') {
    return `SAFETY VIOLATION: curriculum change must route to /director/review, got ${result.output.suggestedRoute}`
  }
  if (result.proposal.safetyLevel !== 'review_only') {
    return `SAFETY VIOLATION: proposal safetyLevel must be review_only, got ${result.proposal.safetyLevel}`
  }
  return null
}
