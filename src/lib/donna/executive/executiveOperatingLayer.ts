// Mega Sprint 3661–3690 — DONNA Executive Conversational Readiness V1
// Part 12 — Executive Operating Layer (composition root).
//
// The single pipeline that makes DONNA reason with complete context instead of
// isolated prompts:
//
//   User → Intent/Continuity → Executive Reasoning (goal) → Context Resolver →
//   Executive Context Packet → OpenAI (instrumented) → Response Validator →
//   Action Planner → Completion Contract → result for the UI
//
// Additive and flag-gated: the live director pipeline opts in via
// isExecutiveReasoningEnabled() (env DONNA_EXECUTIVE_REASONING). When off, the
// existing pipeline is untouched. When on, this layer runs and is fail-open at
// every stage — worst case is a deterministic grounded answer (today's
// experience), never a thrown turn or a hallucination.

import { resolveContinuity } from './conversationContinuity'
import { deriveReasoningGoal, type ReasoningPlan } from './executiveReasoningLayer'
import { resolveExecutiveContext } from './contextResolver'
import {
  type ExecutiveContextPacket,
  inspectPacket,
} from './executiveContextPacket'
import { runExecutiveReasoning, type ExecutiveReasoningResult } from './executiveReasoningGateway'
import { validateExecutiveResponse, type ValidationResult } from './responseValidator'
import { planActions, type ExecutiveActionPlan } from './actionPlanner'
import { resolveExecutiveMode } from './executiveShadowMode'
import type { ResolverState, CompletionContractState } from './executiveTypes'

export interface ExecutiveTurnResult {
  plan: ReasoningPlan
  packet: ExecutiveContextPacket
  reasoning: ExecutiveReasoningResult
  validation: ValidationResult
  actionPlan: ExecutiveActionPlan
  /** Final, validated, completion-guaranteed text for the UI. */
  finalResponse: string
  nextAction: string
  /** Human-readable packet audit. */
  packetInspection: string
}

export interface RunOptions {
  budgetTokens?: number
  completionContract?: CompletionContractState | null
}

/**
 * Whether the live director pipeline should route executive-first (router Step 1.6
 * + brain Step 2.5 → live_ai_assist → executive pipeline).
 *
 * Single source of truth: resolveExecutiveMode() (the tri-state DONNA_EXECUTIVE_REASONING
 * flag). Executive-first routing engages ONLY in `primary`:
 *   • off     → dormant (legacy path)
 *   • shadow  → routing stays legacy (user always sees legacy); the executive layer
 *               runs in parallel inside the action layer for diagnostics only
 *   • primary → executive-first routing + executive response when it validates
 * `1`/`true` are backward-compatible aliases for `primary` (mapped by resolveExecutiveMode).
 */
export function isExecutiveReasoningEnabled(): boolean {
  return resolveExecutiveMode() === 'primary'
}

function deriveCompletion(
  packet: ExecutiveContextPacket,
  provided: CompletionContractState | null | undefined,
): CompletionContractState {
  if (provided) return provided
  // Synthesize a completion state from the goal so the turn always moves forward.
  if (packet.reasoningGoal === 'approve' || packet.reasoningGoal === 'decide') {
    return { state: 'APPROVAL', nextAction: 'Review and approve when you’re ready.' }
  }
  if (packet.reasoningGoal === 'create' || packet.reasoningGoal === 'revise') {
    return { state: 'FOLLOW_UP', nextAction: 'Want me to refine it further, or send it for review?' }
  }
  if (packet.outstandingDecisions.length) {
    return { state: 'FOLLOW_UP', nextAction: `Shall I take on ${packet.outstandingDecisions[0].summary}?` }
  }
  return { state: 'COMPLETE', nextAction: 'Tell me what you’d like to tackle next.' }
}

export async function runExecutiveOperatingTurn(
  state: ResolverState,
  opts: RunOptions = {},
): Promise<ExecutiveTurnResult> {
  // 1. Continuity — bind "it"/"that"/follow-ups to the active draft or last entity.
  const continuity = resolveContinuity(state)

  // 2. Executive reasoning — choose the goal (reasoning determines context).
  const plan = deriveReasoningGoal(state, continuity)

  // 3 + 4. Context Resolver → Executive Context Packet (minimum complete).
  let packet = resolveExecutiveContext(plan, state, {
    budgetTokens: opts.budgetTokens,
    completionContract: opts.completionContract ?? null,
  })

  // Completion state is derived once the packet exists, then folded back in.
  const completion = deriveCompletion(packet, opts.completionContract)
  packet = { ...packet, completionContract: completion }

  // 5. OpenAI reasoning over the packet (instrumented, fail-open).
  const reasoning = await runExecutiveReasoning(packet, state.role)

  // 6. Response validation — only validated text reaches the UI.
  const validation = validateExecutiveResponse(reasoning.text, packet, state)

  // 7. Action planning — reasoning is separated from execution.
  const actionPlan = planActions(reasoning, packet, state)

  // 8. Completion contract — guarantee a forward step.
  const finalResponse = validation.disposition === 'rejected'
    ? `Here's where we stand. ${completion.nextAction}`
    : validation.finalText

  return {
    plan,
    packet,
    reasoning,
    validation,
    actionPlan,
    finalResponse,
    nextAction: completion.nextAction ?? 'Tell me what you’d like to tackle next.',
    packetInspection: inspectPacket(packet),
  }
}
