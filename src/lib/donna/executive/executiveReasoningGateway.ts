// Mega Sprint 3661–3690 — DONNA Executive Conversational Readiness V1
// Part 9 — Executive Reasoning Gateway.
//
// Turns an Executive Context Packet into a reasoning call. DONNA never sends a
// naked prompt: the serialized packet (goal + assembled context + active draft +
// decisions + actions) is the input, and the director's effective message is the
// instruction. Reuses the SINGLE canonical OpenAI gateway (askConversationTeacher
// via callDonnaOpenAIGateway) — no second OpenAI pathway is introduced.
//
// Fail-open: missing key / timeout / error → a deterministic, grounded fallback
// derived from the packet. Either way the call is instrumented, so it is always
// provable what was sent and how it was dispositioned.

import {
  callDonnaOpenAIGateway,
  isOpenAIGatewayConfigured,
} from '@/lib/donna/brain/donnaOpenAIGateway'
import type { InterpreterRole } from '@/lib/donna/conversation/donnaIntentInterpreter'
import {
  type ExecutiveContextPacket,
  serializePacket,
  estimateTokens,
} from './executiveContextPacket'
import type { ExecutiveRole } from './executiveTypes'
import {
  recordOpenAICall,
  type CallSource,
} from './openaiInstrumentation'

const MODEL = 'gpt-4o-mini'

export interface ExecutiveReasoningResult {
  /** The reasoned text (real or fallback). */
  text: string
  source: CallSource
  confidence: 'high' | 'medium' | 'low'
  /** Estimated context tokens sent (the packet size). */
  contextTokens: number
  responseTokens: number
  latencyMs: number
}

function mapRole(role: ExecutiveRole): InterpreterRole {
  switch (role) {
    case 'academy_director':
    case 'head_coach':
      return 'director'
    case 'coach':
      return 'coach'
    case 'parent':
      return 'parent'
    case 'player':
      return 'player'
  }
}

/**
 * Deterministic grounded fallback when OpenAI is unavailable. Built from the
 * packet so the answer still reflects assembled context — worst case is today's
 * grounded experience, never a hallucination.
 */
function buildFallback(packet: ExecutiveContextPacket): string {
  const goal = packet.reasoningGoal
  const top = packet.outstandingDecisions[0]
  if (packet.activeDraft && (goal === 'revise' || goal === 'create')) {
    return `I've updated the ${packet.activeDraft.label}. Review the draft before it goes to the queue.`
  }
  if (top) {
    return `Here's where we stand. The first thing I'd take on is ${top.summary}.`
  }
  return `I've reviewed the current state. Tell me what you'd like to tackle and I'll guide it to completion.`
}

export async function runExecutiveReasoning(
  packet: ExecutiveContextPacket,
  role: ExecutiveRole,
  // Mega Sprint 4051–4080 — optional dialogue directive (derived per-turn from the
  // conversation in the operating layer). Threads sustained-dialogue awareness into
  // the reasoning call; absent on a first turn or non-dialogue request.
  dialogueDirective?: string,
): Promise<ExecutiveReasoningResult> {
  const serialized = serializePacket(packet)
  // Mega Sprint 4021–4050 — executive voice directive. The packet already grounds the
  // screen, conversation, and academy, so DONNA answers first and never asks what the
  // Director is looking at. Presentation guidance only — facts come from the packet.
  const EXECUTIVE_VOICE_DIRECTIVE =
    'ANSWER AS AN EXPERIENCED COO SITTING BESIDE THE DIRECTOR. You already have the ' +
    'current page, conversation, and academy in the context above — answer directly; ' +
    'do not ask which page they are on, say "I think you\'re asking", or defer back. ' +
    'Recommend decisively, then give: why, the tradeoff, the expected outcome, and the ' +
    'exact next step. Be concise and conversational — short spoken sentences, no lists.'
  const dialogueBlock = dialogueDirective ? `\n\n${dialogueDirective}` : ''
  const userText = `${serialized}\n\n${EXECUTIVE_VOICE_DIRECTIVE}${dialogueBlock}\n\nDIRECTOR MESSAGE: ${packet.effectiveMessage}`
  const contextTokens = estimateTokens(userText)
  const started = Date.now()

  // No key → fail-open immediately, but still instrument (gateway invoked, fallback).
  if (!isOpenAIGatewayConfigured()) {
    const text = buildFallback(packet)
    const latencyMs = Date.now() - started
    recordOpenAICall({
      reasoningGoal: packet.reasoningGoal,
      model: MODEL,
      latencyMs,
      contextTokens,
      responseTokens: 0,
      contextSources: packet.assembled.length,
      confidenceTarget: packet.confidenceTarget,
      source: 'fallback',
      disposition: 'fallback',
    })
    return { text, source: 'fallback', confidence: 'low', contextTokens, responseTokens: 0, latencyMs }
  }

  try {
    const out = await callDonnaOpenAIGateway({
      mode: 'strategic_reasoning',
      userText,
      role: mapRole(role),
      currentConfidence: 0, // packet-grounded reasoning — bypass the low-confidence gate
      academyContext: packet.assembled.find(s => s.id === 'academy')?.content,
      maxWords: Math.round(packet.budget.limitTokens / 6),
      // Opt into a packet-sized volume cap: the serialized packet (context budget
      // + structural lines + active draft + message) is larger than the 500-char
      // default but is redacted + budget-bounded. ~5 chars/token over the context
      // budget, plus headroom for structure and the director message.
      contextLengthLimit: packet.budget.limitTokens * 5 + 2000,
    })
    const latencyMs = Date.now() - started
    const source: CallSource = out.source === 'openai' ? 'openai' : 'fallback'
    const text = out.result?.trim() ? out.result.trim() : buildFallback(packet)
    recordOpenAICall({
      reasoningGoal: packet.reasoningGoal,
      model: MODEL,
      latencyMs,
      contextTokens,
      responseTokens: out.usedTokens ?? 0,
      contextSources: packet.assembled.length,
      confidenceTarget: packet.confidenceTarget,
      source,
      disposition: source === 'openai' ? 'accepted' : 'fallback',
    })
    return {
      text,
      source,
      confidence: out.confidence ?? 'medium',
      contextTokens,
      responseTokens: out.usedTokens ?? 0,
      latencyMs,
    }
  } catch {
    const text = buildFallback(packet)
    const latencyMs = Date.now() - started
    recordOpenAICall({
      reasoningGoal: packet.reasoningGoal,
      model: MODEL,
      latencyMs,
      contextTokens,
      responseTokens: 0,
      contextSources: packet.assembled.length,
      confidenceTarget: packet.confidenceTarget,
      source: 'fallback',
      disposition: 'fallback',
    })
    return { text, source: 'fallback', confidence: 'low', contextTokens, responseTokens: 0, latencyMs }
  }
}
