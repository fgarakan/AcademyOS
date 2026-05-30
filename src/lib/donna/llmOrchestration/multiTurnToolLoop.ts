// Sprint 1001 — DONNA Multi-Turn Tool Loop V1
// Safe two-step LLM + tool reasoning loop.
// Server-side only — uses dynamic import for Anthropic SDK.
//
// V1 flow:
//   Step 1 (Sprint 999): LLM produces an output, optionally with a toolRequest.
//   Step 2 (Sprint 1000): Tool executes safely, result interpreted.
//   Step 3 (Sprint 1001): Tool result fed back to LLM as context for a grounded final answer.
//
// Constraints:
//   - Max one tool call per user turn (enforced by Sprint 1000)
//   - Max one follow-up LLM call per user turn (enforced here)
//   - No recursive loops, no agent chains, no autonomous execution
//   - If second LLM call fails, interpreted tool result is returned unchanged
//   - All decisions logged to safetyAudit[]
//   - Never throws
//
// Tool result safety:
//   - Tool result summary uses only safe counts, labels, and instructions
//   - No raw player names, coach notes, or private data in summary
//   - detectBlockedAction() checked on summary before feeding to LLM
//
// Usage:
//   const finalOutput = await runMultiTurnToolLoop(input, ctx, toolLoopResult, safetyAudit)
//   // finalOutput.text: grounded answer incorporating tool data
//   // finalOutput.source: 'llm_inferred' (second turn) or 'deterministic' (fallback)

import type { OrchestratorOutput } from './types'
import type { ContextPacketInput } from './contextPacket'
import { buildContextPacket, appendUserTurn, appendDonnaTurn } from './contextPacket'
import type { ToolLoopResult } from './toolExecutionLoop'
import type { LlmCallResult } from './llmApiClient'
import { detectBlockedAction } from './orchestrator'
import { isOutputAllowed } from './safetyContract'

// ── Tool result summary builder ───────────────────────────────────────────────

const MAX_SUMMARY_CHARS = 300

/**
 * Build a compact, safe tool result summary for the second LLM turn.
 * Uses the tool interpretation's `donnaText` — already sanitized and safe.
 * Caps at 300 chars to keep the second-turn context concise.
 * Never includes raw notes, player names, or private data.
 */
export function buildToolResultSummary(toolLoopResult: ToolLoopResult): string {
  if (!toolLoopResult.executed) return ''

  const text = toolLoopResult.output.text
  if (!text || text.length === 0) return ''

  // Cap at MAX_SUMMARY_CHARS at a sentence boundary
  if (text.length <= MAX_SUMMARY_CHARS) return text

  const candidate = text.slice(0, MAX_SUMMARY_CHARS)
  const sentenceEnd = Math.max(candidate.lastIndexOf('. '), candidate.lastIndexOf('? '), candidate.lastIndexOf('! '))
  if (sentenceEnd > 80) return text.slice(0, sentenceEnd + 1)

  return candidate.slice(0, MAX_SUMMARY_CHARS - 1) + '…'
}

// ── Second-turn context builder ───────────────────────────────────────────────

const SECOND_TURN_REFINEMENT_PROMPT =
  'Based on the context above, what is your final recommendation or answer for the director? Be concise and actionable.'

/**
 * Build the context packet input for the second LLM turn.
 * Adds the original question and tool result as conversation history.
 * The new user input asks for a final grounded answer.
 */
export function buildSecondTurnInput(
  originalInput: ContextPacketInput,
  toolResultSummary: string,
): ContextPacketInput {
  const existingHistory = originalInput.conversationHistory ?? []

  // Add: [user: original question] → [donna: tool result summary] → [user: refinement prompt]
  const historyWithQuestion = appendUserTurn(existingHistory, originalInput.userInput)
  const historyWithTool = appendDonnaTurn(historyWithQuestion, toolResultSummary, 'answer')

  return {
    ...originalInput,
    userInput: SECOND_TURN_REFINEMENT_PROMPT,
    conversationHistory: historyWithTool,
  }
}

// ── Second-turn result ────────────────────────────────────────────────────────

export interface MultiTurnLoopResult {
  /** The final output (second-turn LLM or fallback to tool interpretation) */
  output: OrchestratorOutput
  /** Whether the second LLM call succeeded */
  secondTurnSucceeded: boolean
  /** What drove the final output */
  source: 'second_llm_turn' | 'tool_interpretation_fallback'
  /** Audit summary */
  auditEntry: string
}

// ── Safety validator for second-turn output ───────────────────────────────────

function validateSecondTurnOutput(output: OrchestratorOutput, safetyAudit: string[]): boolean {
  if (!isOutputAllowed(output.type)) {
    safetyAudit.push(`MultiTurn: Second turn output type '${output.type}' not allowed.`)
    return false
  }
  const blocked = detectBlockedAction(output.text)
  if (blocked) {
    safetyAudit.push(`MultiTurn: Second turn text contains blocked action: ${blocked}`)
    return false
  }
  if (output.safetyLevel === 'blocked') {
    safetyAudit.push('MultiTurn: Second turn declared safetyLevel: blocked')
    return false
  }
  return true
}

// ── Main multi-turn loop ──────────────────────────────────────────────────────

/**
 * Execute the multi-turn tool loop:
 *   1. Validate tool result is safe to feed to LLM
 *   2. Build second-turn context (original question + tool summary as history)
 *   3. Call LLM for a grounded final answer (dynamic import — server only)
 *   4. Validate second-turn output through safety contract
 *   5. Return final output or fallback to interpreted tool result
 *
 * Never throws. Always returns a valid MultiTurnLoopResult.
 * Max one follow-up LLM call per user turn.
 */
export async function runMultiTurnToolLoop(
  originalInput: ContextPacketInput,
  toolLoopResult: ToolLoopResult,
  safetyAudit: string[],
): Promise<MultiTurnLoopResult> {
  const fallbackOutput: MultiTurnLoopResult = {
    output: toolLoopResult.output,
    secondTurnSucceeded: false,
    source: 'tool_interpretation_fallback',
    auditEntry: 'fallback:tool_interpretation',
  }

  // Skip if tool was not actually executed
  if (!toolLoopResult.executed) {
    safetyAudit.push('MultiTurn: Tool was not executed — skipping second turn.')
    return fallbackOutput
  }

  // Step 1: Build and validate tool result summary
  const toolSummary = buildToolResultSummary(toolLoopResult)
  if (!toolSummary) {
    safetyAudit.push('MultiTurn: Tool result summary is empty — skipping second turn.')
    return fallbackOutput
  }

  // Safety check: tool summary must not contain blocked content
  const summaryBlocked = detectBlockedAction(toolSummary)
  if (summaryBlocked) {
    safetyAudit.push(`MultiTurn: Tool summary contains blocked action '${summaryBlocked}' — skipping second turn.`)
    return fallbackOutput
  }

  safetyAudit.push(`MultiTurn: Tool summary built (${toolSummary.length} chars). Attempting second LLM turn.`)

  // Step 2: Build second-turn context
  const secondTurnInput = buildSecondTurnInput(originalInput, toolSummary)
  const secondCtx = buildContextPacket(secondTurnInput)

  // Step 3: Call LLM for grounded final answer (dynamic import — server only)
  let llmResult: LlmCallResult
  try {
    const { callDonnaLlm } = await import('./llmApiClient')
    llmResult = await callDonnaLlm(secondCtx, safetyAudit)
  } catch (err) {
    safetyAudit.push(`MultiTurn: Exception calling LLM for second turn: ${err instanceof Error ? err.message : String(err)}`)
    return { ...fallbackOutput, auditEntry: 'exception:second_llm_call' }
  }

  // Step 4: Check for blocked content in second-turn result
  if (llmResult.hadBlockedContent || !llmResult.output) {
    safetyAudit.push(`MultiTurn: Second turn LLM had blocked content or no output — falling back. error=${llmResult.error ?? 'none'}`)
    return { ...fallbackOutput, auditEntry: 'blocked_or_empty:second_turn' }
  }

  // Step 5: Validate second-turn output through safety contract
  const isValid = validateSecondTurnOutput(llmResult.output, safetyAudit)
  if (!isValid) {
    safetyAudit.push('MultiTurn: Second turn output failed validation — using tool interpretation fallback.')
    return { ...fallbackOutput, auditEntry: 'validation_failed:second_turn' }
  }

  // Preserve highlight/navigation from tool loop result if second turn doesn't have them
  const finalOutput: OrchestratorOutput = {
    ...llmResult.output,
    highlightTarget: llmResult.output.highlightTarget ?? toolLoopResult.output.highlightTarget,
    suggestedRoute: llmResult.output.suggestedRoute ?? toolLoopResult.output.suggestedRoute,
  }

  safetyAudit.push(
    `MultiTurn: Second turn succeeded. model=${llmResult.model} ` +
    `latency=${llmResult.latencyMs}ms tokens=${llmResult.inputTokens}+${llmResult.outputTokens}`
  )

  return {
    output: finalOutput,
    secondTurnSucceeded: true,
    source: 'second_llm_turn',
    auditEntry: `second_turn:${llmResult.model}`,
  }
}
