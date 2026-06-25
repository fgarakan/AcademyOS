// Mega Sprint 3991–4020 — DONNA Unified Executive Context Engine V1
//
// THE single place DONNA assembles the complete operating picture for a reasoning
// request. Every OpenAI invocation is grounded through this engine — no reasoning
// module assembles page, academy, workflow, history, or memory context on its own.
//
// Pipeline owned here (was previously inlined in the operating turn):
//
//   ResolverState ─▶ continuity ─▶ reasoning goal (plan) ─▶ Context Resolver
//                                                            │
//                                                            ▼
//                                          Executive Context Packet  +  ContextEngineTrace
//
// Convergence, not creation:
//   • The live boundary (buildResolverStateFromLive) remains the ONE place the live
//     pipeline turns its inputs into a ResolverState — already enriched with the
//     rich current-page block, academy truth, decisions, permissions, and actions.
//   • This engine is the ONE place that state becomes a grounded packet.
//   • runExecutiveOperatingTurn now calls assembleExecutiveContext() instead of
//     re-deriving the plan and re-resolving context itself.
//
// Design rules:
//   - Pure orchestration over already-shipped modules. No new OpenAI pathway, no DB.
//   - Fail-open inherited from the resolver/providers (assemblers never throw).
//   - The trace is developer-only and never reaches the user.

import { resolveContinuity, type ContinuityResolution } from './conversationContinuity'
import { deriveReasoningGoal, type ReasoningPlan } from './executiveReasoningLayer'
import { resolveExecutiveContext, ALWAYS_INCLUDE } from './contextResolver'
import {
  type ExecutiveContextPacket,
  serializePacket,
} from './executiveContextPacket'
import type { ContextSourceId } from './contextSources'
import type { ResolverState, CompletionContractState } from './executiveTypes'

// ── Developer trace (Objective 5) ───────────────────────────────────────────────

export interface ContextEngineTrace {
  /** Reasoning goal the plan selected. */
  reasoningGoal: string
  /** Sources actually assembled into the packet. */
  sourcesIncluded: ContextSourceId[]
  /** Sources deliberately left out (excluded / not relevant / budget / redacted). */
  sourcesSkipped: Array<{ id: ContextSourceId; reason: string }>
  /** Required/relevant sources that could not be resolved (honest, not fabricated). */
  sourcesUnavailable: Array<{ id: ContextSourceId; reason: string }>
  /** Whether every required source for the goal was met. */
  requiredMet: boolean
  /** Estimated context tokens used by the packet. */
  contextTokens: number
  /** Token budget ceiling for this turn. */
  budgetTokens: number
  /** Character size of the serialized packet sent toward OpenAI. */
  packetSizeChars: number
  /** Whether the current page was grounded into the packet (page awareness). */
  pageGrounded: boolean
  /** Whether prior conversation was grounded into the packet (continuity). */
  conversationGrounded: boolean
}

// The always-include set (Objective 4): page, academy, workflow, conversation.
// These are the sources an experienced COO standing beside the Director always has.
// Single source of truth lives in the Context Resolver (where the budget exemption
// is enforced); re-exported here under the engine's name for callers/certification.
export const ALWAYS_INCLUDE_PRIORITY: ContextSourceId[] = ALWAYS_INCLUDE

export interface AssembleOptions {
  budgetTokens?: number
  completionContract?: CompletionContractState | null
}

export interface ExecutiveContextResult {
  continuity: ContinuityResolution
  plan: ReasoningPlan
  packet: ExecutiveContextPacket
  trace: ContextEngineTrace
}

/** Build the developer trace from a resolved packet. */
export function buildContextEngineTrace(packet: ExecutiveContextPacket): ContextEngineTrace {
  const serialized = serializePacket(packet)
  const includedIds = packet.assembled.map(s => s.id)
  return {
    reasoningGoal: packet.reasoningGoal,
    sourcesIncluded: includedIds,
    sourcesSkipped: packet.omitted.map(o => ({ id: o.id, reason: o.reason })),
    sourcesUnavailable: packet.unavailable.map(u => ({ id: u.id, reason: u.reason })),
    requiredMet: packet.provenance.requiredMet,
    contextTokens: packet.budget.usedTokens,
    budgetTokens: packet.budget.limitTokens,
    packetSizeChars: serialized.length,
    pageGrounded: includedIds.includes('current_page'),
    conversationGrounded: includedIds.includes('conversation_history'),
  }
}

/**
 * THE unified context assembly. Given a complete ResolverState, returns the grounded
 * Executive Context Packet plus the reasoning plan, continuity resolution, and a
 * developer trace. This is the single entry point for grounding any OpenAI request.
 */
export function assembleExecutiveContext(
  state: ResolverState,
  opts: AssembleOptions = {},
): ExecutiveContextResult {
  // 1. Continuity — bind "it"/"that"/follow-ups to the active draft or last entity.
  const continuity = resolveContinuity(state)

  // 2. Reasoning goal — reasoning determines which context is required (not the reverse).
  const plan = deriveReasoningGoal(state, continuity)

  // 3 + 4. Context Resolver → minimum-complete Executive Context Packet.
  const packet = resolveExecutiveContext(plan, state, {
    budgetTokens: opts.budgetTokens,
    completionContract: opts.completionContract ?? null,
  })

  return {
    continuity,
    plan,
    packet,
    trace: buildContextEngineTrace(packet),
  }
}

/** One-line developer summary of a context-engine trace (developer-only logging). */
export function formatContextEngineTrace(t: ContextEngineTrace): string {
  return (
    `goal=${t.reasoningGoal} ` +
    `included=[${t.sourcesIncluded.join(',')}] ` +
    `skipped=${t.sourcesSkipped.length} unavailable=${t.sourcesUnavailable.length} ` +
    `tokens=${t.contextTokens}/${t.budgetTokens} packet=${t.packetSizeChars}c ` +
    `page=${t.pageGrounded ? 'YES' : 'NO'} convo=${t.conversationGrounded ? 'YES' : 'NO'} ` +
    `requiredMet=${t.requiredMet}`
  )
}
