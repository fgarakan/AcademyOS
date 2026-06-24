// Mega Sprint 3661–3690 — DONNA Executive Conversational Readiness V1
// Part 8 — OpenAI instrumentation.
//
// Every executive OpenAI invocation is recorded so it can be PROVEN that OpenAI
// was called, with what reasoning goal, how much context, and how the response
// was dispositioned. In-memory ring buffer (server-process scoped) plus a
// structured console line for log aggregation. No PII — only shapes and counts.

import type { ReasoningGoal } from './reasoningGoals'

export type CallSource = 'openai' | 'fallback' | 'not_called'
export type CallDisposition = 'accepted' | 'modified' | 'rejected' | 'fallback'

export interface OpenAICallRecord {
  id: number
  reasoningGoal: ReasoningGoal
  model: string
  latencyMs: number
  /** Estimated context (prompt) tokens — the packet size. */
  contextTokens: number
  /** Tokens returned by the model (0 on fallback). */
  responseTokens: number
  /** Number of context sources assembled into the packet. */
  contextSources: number
  confidenceTarget: number
  source: CallSource
  disposition: CallDisposition
  at: number
}

const MAX_RECORDS = 200
const _log: OpenAICallRecord[] = []
let _seq = 0

export function recordOpenAICall(
  rec: Omit<OpenAICallRecord, 'id' | 'at'>,
): OpenAICallRecord {
  const full: OpenAICallRecord = { ...rec, id: ++_seq, at: Date.now() }
  _log.push(full)
  if (_log.length > MAX_RECORDS) _log.shift()
  // Structured, greppable line — proves the invocation in server logs.
  // eslint-disable-next-line no-console
  console.info(
    `[donna.openai] goal=${full.reasoningGoal} model=${full.model} ` +
    `source=${full.source} disposition=${full.disposition} ` +
    `ctxTokens=${full.contextTokens} ctxSources=${full.contextSources} ` +
    `respTokens=${full.responseTokens} latencyMs=${full.latencyMs} ` +
    `confTarget=${full.confidenceTarget}`,
  )
  return full
}

export function getOpenAICallLog(): readonly OpenAICallRecord[] {
  return _log
}

export function getLastOpenAICall(): OpenAICallRecord | null {
  return _log.length ? _log[_log.length - 1] : null
}

/** True when at least one real OpenAI call (source==='openai') has been recorded. */
export function proveOpenAIWasCalled(): boolean {
  return _log.some(r => r.source === 'openai')
}

/** True when the executive pipeline reached the gateway at all (real or fallback). */
export function gatewayWasInvoked(): boolean {
  return _log.some(r => r.source !== 'not_called')
}

/** Test/inspection helper — clears the in-memory log. */
export function clearOpenAICallLog(): void {
  _log.length = 0
}
