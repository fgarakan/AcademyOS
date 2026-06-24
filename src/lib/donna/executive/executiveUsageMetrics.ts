// Mega Sprint 3751–3780 — DONNA Executive Experience Convergence V1
// Part 2 — Executive usage metrics.
//
// OBJECTIVE 7 — OpenAI visibility. Summarizes the already-recorded executive
// instrumentation (the OpenAI call ring buffer + the shadow/primary turn records)
// into a single, greppable picture: how often the executive path was used, how
// often a REAL OpenAI call happened vs. a deterministic fallback, the reasoning-
// goal mix, and average context-packet size. No I/O and no new tracking — it only
// reads the in-memory logs maintained by openaiInstrumentation + executiveShadowMode.

import { getOpenAICallLog, type OpenAICallRecord } from './openaiInstrumentation'
import { getShadowRecords, type ShadowRecord } from './executiveShadowMode'
import type { ReasoningGoal } from './reasoningGoals'

export interface ExecutiveUsageMetrics {
  /** Executive turns observed (shadow + primary). */
  turns: number
  /** Gateway invocations recorded (real OpenAI + deterministic fallback). */
  gatewayCalls: number
  /** Real OpenAI calls (source === 'openai'). */
  realOpenAICalls: number
  /** Deterministic fallbacks (no key / timeout / error). */
  fallbackCalls: number
  /** realOpenAICalls / gatewayCalls — the live OpenAI invocation rate. */
  openaiInvocationRate: number
  /** Turns where the executive response (not legacy) was returned to the user. */
  executivePathUsedTurns: number
  /** Turns where the legacy fallback was returned. */
  fallbackUsedTurns: number
  /** Average estimated context-packet size (prompt tokens) across gateway calls. */
  avgContextTokens: number
  /** Average response tokens across real OpenAI calls. */
  avgResponseTokens: number
  /** Reasoning-goal distribution across gateway calls. */
  goalMix: Partial<Record<ReasoningGoal, number>>
}

const ZERO: ExecutiveUsageMetrics = {
  turns: 0,
  gatewayCalls: 0,
  realOpenAICalls: 0,
  fallbackCalls: 0,
  openaiInvocationRate: 0,
  executivePathUsedTurns: 0,
  fallbackUsedTurns: 0,
  avgContextTokens: 0,
  avgResponseTokens: 0,
  goalMix: {},
}

function summarize(calls: readonly OpenAICallRecord[], turns: readonly ShadowRecord[]): ExecutiveUsageMetrics {
  if (calls.length === 0 && turns.length === 0) return { ...ZERO }

  const real = calls.filter(c => c.source === 'openai')
  const fallback = calls.filter(c => c.source !== 'openai')

  const goalMix: Partial<Record<ReasoningGoal, number>> = {}
  for (const c of calls) goalMix[c.reasoningGoal] = (goalMix[c.reasoningGoal] ?? 0) + 1

  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0)

  return {
    turns: turns.length,
    gatewayCalls: calls.length,
    realOpenAICalls: real.length,
    fallbackCalls: fallback.length,
    openaiInvocationRate: calls.length ? real.length / calls.length : 0,
    executivePathUsedTurns: turns.filter(t => t.diagnostics.executivePathUsed).length,
    fallbackUsedTurns: turns.filter(t => t.diagnostics.fallbackUsed).length,
    avgContextTokens: avg(calls.map(c => c.contextTokens)),
    avgResponseTokens: avg(real.map(c => c.responseTokens)),
    goalMix,
  }
}

/** Summarize all executive usage recorded in this server process. */
export function summarizeExecutiveUsage(): ExecutiveUsageMetrics {
  return summarize(getOpenAICallLog(), getShadowRecords())
}

/** One-line, greppable summary for logs and certification output. */
export function formatExecutiveUsage(m: ExecutiveUsageMetrics = summarizeExecutiveUsage()): string {
  const pct = (x: number) => `${Math.round(x * 100)}%`
  const goals = Object.entries(m.goalMix).map(([g, n]) => `${g}:${n}`).join(',') || 'none'
  return (
    `[donna.executive.usage] turns=${m.turns} gatewayCalls=${m.gatewayCalls} ` +
    `realOpenAI=${m.realOpenAICalls} fallback=${m.fallbackCalls} ` +
    `invocationRate=${pct(m.openaiInvocationRate)} ` +
    `execPathUsed=${m.executivePathUsedTurns} fallbackUsed=${m.fallbackUsedTurns} ` +
    `avgCtxTokens=${m.avgContextTokens} avgRespTokens=${m.avgResponseTokens} goals={${goals}}`
  )
}
