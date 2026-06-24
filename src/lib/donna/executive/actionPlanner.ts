// Mega Sprint 3661–3690 — DONNA Executive Conversational Readiness V1
// Part 11 — Action Planner.
//
// Separates reasoning from execution. OpenAI reasons; the Action Planner turns the
// reasoning goal + packet into an explicit PLAN of operations the existing
// AcademyOS pipeline can execute (navigation, draft updates, workflow transitions,
// approval requests). The planner itself NEVER executes and NEVER mutates — it
// only produces an inspectable plan. This keeps the core operating model intact:
// AI proposes → director approves → system executes.

import type { ExecutiveContextPacket } from './executiveContextPacket'
import type { ResolverState } from './executiveTypes'
import type { ExecutiveReasoningResult } from './executiveReasoningGateway'

export type PlannedActionKind =
  | 'respond'
  | 'navigate'
  | 'update_draft'
  | 'start_workflow'
  | 'request_approval'
  | 'record_assumption'

export interface PlannedAction {
  kind: PlannedActionKind
  /** Human description of the operation. */
  description: string
  /** Target route (navigate), workflow id (start_workflow), or draft kind (update_draft). */
  target?: string | null
  /** Whether executing this action is approval-gated. */
  requiresApproval: boolean
}

export interface ExecutiveActionPlan {
  actions: PlannedAction[]
  /** True when nothing beyond a spoken response is planned. */
  responseOnly: boolean
}

export function planActions(
  reasoning: ExecutiveReasoningResult,
  packet: ExecutiveContextPacket,
  state: ResolverState,
): ExecutiveActionPlan {
  const actions: PlannedAction[] = []

  switch (packet.reasoningGoal) {
    case 'navigate':
      if (state.navigationTarget) {
        actions.push({
          kind: 'navigate',
          description: `Navigate to ${state.navigationTarget}`,
          target: state.navigationTarget,
          requiresApproval: false,
        })
      }
      break

    case 'create':
      // Creation produces a draft for review — start the owning workflow on the page.
      actions.push({
        kind: 'start_workflow',
        description: 'Open the owning page workflow to build the draft (page-owned completion)',
        target: state.activeWorkflowId,
        requiresApproval: false,
      })
      break

    case 'revise':
      if (packet.activeDraft) {
        actions.push({
          kind: 'update_draft',
          description: `Apply revision to ${packet.activeDraft.label}`,
          target: packet.activeDraft.kind,
          requiresApproval: false,
        })
      }
      break

    case 'approve':
    case 'decide':
      actions.push({
        kind: 'request_approval',
        description: 'Surface the decision for director approval (review-gated)',
        target: null,
        requiresApproval: true,
      })
      break

    default:
      break
  }

  // Record any assumptions DONNA reasoned with, so they are auditable.
  if (state.donnaAssumptions.length) {
    actions.push({
      kind: 'record_assumption',
      description: `Recorded ${state.donnaAssumptions.length} assumption(s) used in reasoning`,
      target: null,
      requiresApproval: false,
    })
  }

  // Every turn at minimum responds.
  actions.push({
    kind: 'respond',
    description: 'Deliver the validated executive response',
    target: null,
    requiresApproval: false,
  })

  void reasoning
  const nonResponse = actions.filter(a => a.kind !== 'respond' && a.kind !== 'record_assumption')
  return { actions, responseOnly: nonResponse.length === 0 }
}
