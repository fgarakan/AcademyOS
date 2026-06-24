// Mega Sprint 3661–3690 — DONNA Executive Conversational Readiness V1
// Part 6 — Executive Context Packet.
//
// The formal, inspectable object DONNA sends to OpenAI in place of a naked prompt.
// It records not only WHAT context was assembled, but what was deliberately
// OMITTED and what was UNAVAILABLE — so any answer can be audited back to the
// exact state it reasoned over.

import type { ContextSourceId, Freshness } from './contextSources'
import type { ReasoningGoal } from './reasoningGoals'
import type {
  DraftRef,
  DecisionRef,
  ActionDescriptor,
  CompletionContractState,
} from './executiveTypes'

export const EXECUTIVE_CONTEXT_PACKET_VERSION = '1.0'

export interface ContextSlice {
  id: ContextSourceId
  label: string
  /** Compact, already-redacted serialized content. */
  content: string
  provenance: {
    source: string
    freshness: Freshness
    /** 0–1 confidence in this slice's accuracy/freshness. */
    confidence: number
  }
  tokensEst: number
}

export interface OmittedSlice {
  id: ContextSourceId
  reason: 'excluded_by_goal' | 'not_relevant' | 'redacted' | 'budget'
}

export interface UnavailableSlice {
  id: ContextSourceId
  reason: string
}

export interface ExecutiveContextPacket {
  version: string
  reasoningGoal: ReasoningGoal
  confidenceTarget: number
  /** Self-contained message reasoning should act on. */
  effectiveMessage: string
  isContinuation: boolean
  /** Context that made it into the packet. */
  assembled: ContextSlice[]
  /** Context intentionally left out, with why — proves minimality. */
  omitted: OmittedSlice[]
  /** Required/relevant context that could not be resolved — proves honesty. */
  unavailable: UnavailableSlice[]
  activeWorkflow: string | null
  activeDraft: DraftRef | null
  outstandingDecisions: DecisionRef[]
  availableActions: ActionDescriptor[]
  completionContract: CompletionContractState | null
  provenance: {
    sources: ContextSourceId[]
    requiredMet: boolean
  }
  budget: {
    limitTokens: number
    usedTokens: number
  }
}

/** Rough token estimate (≈4 chars/token). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Compact serialization sent to OpenAI as a structured context block. Key-value,
 * not prose, to keep it token-lean. Never includes omitted/unavailable detail —
 * those are for the audit view, not the model.
 */
export function serializePacket(packet: ExecutiveContextPacket): string {
  const lines: string[] = []
  lines.push(`REASONING_GOAL: ${packet.reasoningGoal}`)
  lines.push(`CONFIDENCE_TARGET: ${packet.confidenceTarget}`)
  if (packet.activeWorkflow) lines.push(`ACTIVE_WORKFLOW: ${packet.activeWorkflow}`)
  if (packet.activeDraft) {
    lines.push(`ACTIVE_DRAFT: ${packet.activeDraft.kind} — ${packet.activeDraft.label}`)
    lines.push(`ACTIVE_DRAFT_FIELDS: ${JSON.stringify(packet.activeDraft.fields)}`)
  }
  for (const slice of packet.assembled) {
    lines.push(`${slice.id.toUpperCase()}: ${slice.content}`)
  }
  if (packet.outstandingDecisions.length) {
    lines.push(`OUTSTANDING_DECISIONS: ${packet.outstandingDecisions.map(d => `[${d.urgency}] ${d.summary}`).join(' | ')}`)
  }
  if (packet.availableActions.length) {
    lines.push(`AVAILABLE_ACTIONS: ${packet.availableActions.map(a => a.id).join(', ')}`)
  }
  if (packet.completionContract) {
    lines.push(`COMPLETION_STATE: ${packet.completionContract.state}`)
  }
  return lines.join('\n')
}

/** Human-readable audit view — shows assembled, omitted, and unavailable context. */
export function inspectPacket(packet: ExecutiveContextPacket): string {
  const lines: string[] = []
  lines.push(`── Executive Context Packet v${packet.version} ──`)
  lines.push(`goal: ${packet.reasoningGoal} (confidence target ${packet.confidenceTarget})`)
  lines.push(`continuation: ${packet.isContinuation}`)
  lines.push(`message: "${packet.effectiveMessage}"`)
  lines.push(`budget: ${packet.budget.usedTokens}/${packet.budget.limitTokens} tokens`)
  lines.push(`required met: ${packet.provenance.requiredMet}`)
  lines.push('assembled:')
  for (const s of packet.assembled) {
    lines.push(`  • ${s.id} (${s.provenance.freshness}, conf ${s.provenance.confidence}, ~${s.tokensEst}t)`)
  }
  if (packet.omitted.length) {
    lines.push('omitted:')
    for (const o of packet.omitted) lines.push(`  − ${o.id} (${o.reason})`)
  }
  if (packet.unavailable.length) {
    lines.push('unavailable:')
    for (const u of packet.unavailable) lines.push(`  ? ${u.id} (${u.reason})`)
  }
  return lines.join('\n')
}
