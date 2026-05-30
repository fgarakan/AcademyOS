// Sprint 978 — DONNA LLM Orchestration Foundation V1
// Sprint 999 — LLM API Wire-Up V1: real Anthropic API call replaces stub.
// The main orchestrator that coordinates context, tools, and safety validation.
//
// Architecture (post-Sprint 999):
//   1. Build context packet from available signals
//   2. Run deterministic fast paths first (no LLM needed, always fastest)
//   3. If deterministic handlers resolve the intent: return immediately
//   4. If useLlm: true — call Anthropic API via callDonnaLlm()
//   5. Validate LLM output against safety contract (output type, blocked actions)
//   6. Return structured OrchestratorResponse — no direct mutations
//
// Fallback behavior:
//   If ANTHROPIC_API_KEY missing → deterministic fallback (no crash)
//   If LLM returns invalid JSON → deterministic fallback
//   If LLM response contains blocked action → deterministic fallback
//   If tool request is blocked → explain why, do not execute

import type {
  OrchestratorResponse,
  OrchestratorOutput,
  OrchestratorToolRequest,
  OrchestratorOutputType,
  OrchestratorSafetyLevel,
} from './types'
import type { ContextPacket } from './contextPacket'
import { buildContextPacket } from './contextPacket'
import type { ContextPacketInput } from './contextPacket'
import {
  isToolAllowed,
  isOutputAllowed,
  isActionBlocked,
  validateToolRequest,
  ALLOWED_OUTPUTS,
} from './safetyContract'
import { buildDirectorNextAction } from '../directorNextActionEngine'
import { buildActionExplanation } from '../directorActionExplanation'
import { matchesWhatNextIntent } from '../directorNextActionEngine'
import { matchesReviewQueueGuidanceIntent, buildReviewQueueGuidance } from '../reviewQueueGuidance'
// Sprint 999 — LLM API client (server-side only, imported lazily via dynamic require when called)
import type { LlmCallResult } from './llmApiClient'
// Sprint 1000 — Tool execution loop (safe single-tool execution after LLM output validates)
// Sprint 1002 — runLiveToolExecutionLoop handles DB-backed tools (async, server-only)
import { runToolExecutionLoop, runLiveToolExecutionLoop } from './toolExecutionLoop'
// Sprint 1001 — Multi-turn tool loop (second LLM call for grounded final answer)
import { runMultiTurnToolLoop } from './multiTurnToolLoop'

// ── Orchestrator input ────────────────────────────────────────────────────────

export interface OrchestratorInput extends ContextPacketInput {
  /** Whether to use the LLM path (when false: deterministic only) */
  useLlm?: boolean
}

// ── Deterministic fast-path handlers ─────────────────────────────────────────

function tryDeterministicHandler(
  input: OrchestratorInput,
  ctx: ContextPacket,
): OrchestratorOutput | null {
  const lower = input.userInput.toLowerCase().trim()

  // Fast path 1: "What should I do next?" → Director Next Action Engine
  if (matchesWhatNextIntent(input.userInput) || lower.includes('what should i do next')) {
    const action = buildDirectorNextAction({
      pendingReviews: input.pendingReviews ?? 0,
      pathname: input.pathname,
    })
    const explanation = buildActionExplanation(action)

    return {
      type: 'recommend_next_action',
      text: action.summary,
      highlightTarget: action.targetFocusId
        ? { targetId: action.targetFocusId, label: action.title, route: action.targetRoute }
        : undefined,
      suggestedRoute: action.targetRoute,
      safetyLevel: action.safetyLevel as OrchestratorSafetyLevel,
      requiresConfirmation: action.requiresApproval,
      confidence: 'high',
      source: 'deterministic',
      toolRequest: {
        tool: 'get_next_action_recommendation',
        params: { pathname: input.pathname, pendingReviews: input.pendingReviews ?? 0 },
        reasoning: 'Director asked for next action — deterministic engine selected.',
        claimedSafety: action.safetyLevel as OrchestratorSafetyLevel,
      },
    }
  }

  // Fast path 2: Review queue guidance
  const rqIntent = matchesReviewQueueGuidanceIntent(input.userInput)
  if (rqIntent) {
    const guidance = buildReviewQueueGuidance(rqIntent)
    return {
      type: 'answer',
      text: guidance,
      safetyLevel: 'safe',
      requiresConfirmation: false,
      confidence: 'high',
      source: 'deterministic',
    }
  }

  return null
}

// ── Safety validator for LLM output ──────────────────────────────────────────

function validateLlmOutput(
  outputType: OrchestratorOutputType,
  toolRequest: OrchestratorToolRequest | undefined,
  safetyAudit: string[],
): boolean {
  // Check output type is allowed
  if (!isOutputAllowed(outputType)) {
    safetyAudit.push(`BLOCKED: Output type '${outputType}' is not in V1 allowed list.`)
    return false
  }

  // Check tool request if present
  if (toolRequest) {
    if (!isToolAllowed(toolRequest.tool)) {
      safetyAudit.push(`BLOCKED: Tool '${toolRequest.tool}' is not registered.`)
      return false
    }
    const validation = validateToolRequest(toolRequest.tool, toolRequest.params)
    if (!validation.valid) {
      safetyAudit.push(`BLOCKED: ${validation.reason}`)
      return false
    }
  }

  safetyAudit.push(`ALLOWED: Output type '${outputType}' passed safety validation.`)
  return true
}

// ── Fallback response ─────────────────────────────────────────────────────────

function buildFallbackResponse(
  ctx: ContextPacket,
  reason: string,
): OrchestratorResponse {
  const fallbackText = ctx.safeSignals.pendingReviews > 0
    ? `I have ${ctx.safeSignals.pendingReviews} items waiting in your Review Queue. Would you like me to highlight where to start?`
    : `I'm ready to help. You can ask me what to do next, explain any page, or guide you through a review queue decision.`

  return {
    primaryOutput: {
      type: 'answer',
      text: fallbackText,
      safetyLevel: 'safe',
      requiresConfirmation: false,
      confidence: 'low',
      source: 'fallback',
    },
    secondaryOutputs: [],
    hadBlockedAttempt: false,
    safetyAudit: [`FALLBACK: ${reason}`],
    contextSummary: ctx.compactSummary,
  }
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

/**
 * Main orchestrator entry point.
 *
 * Sprint 999 behavior:
 *   1. Builds V2 context packet (role, page, tools, history, academy state)
 *   2. Tries deterministic fast paths (next-action engine, review guidance)
 *   3. If deterministic handler resolves: returns immediately (no LLM needed)
 *   4. If useLlm: true — calls Anthropic API via callDonnaLlm() (dynamic import)
 *   5. Validates LLM output against safety contract (type, blocked actions, routes)
 *   6. Falls back to deterministic response if LLM fails or is blocked
 *
 * Safety invariants enforced regardless of path:
 *   - No auto-approve/reject
 *   - No parent/player communications
 *   - No level/roster/billing changes
 *   - All mutations go through proposed_actions pipeline
 *   - No raw private data exposed
 *   - Blocked action detection runs before and after LLM call
 */
export async function orchestrate(input: OrchestratorInput): Promise<OrchestratorResponse> {
  const safetyAudit: string[] = []
  let hadBlockedAttempt = false

  // Step 1: Build context packet
  const ctx = buildContextPacket(input)
  safetyAudit.push(`Context: ${ctx.compactSummary}`)

  // Step 2: Deterministic fast paths (no LLM needed)
  const deterministicResult = tryDeterministicHandler(input, ctx)
  if (deterministicResult) {
    const isValid = validateLlmOutput(
      deterministicResult.type,
      deterministicResult.toolRequest,
      safetyAudit,
    )
    if (isValid) {
      // Sprint 1000: run tool loop for deterministic outputs with toolRequest too
      const toolLoopResult = runToolExecutionLoop(deterministicResult, ctx, safetyAudit)
      return {
        primaryOutput: toolLoopResult.output,
        secondaryOutputs: [],
        hadBlockedAttempt: false,
        safetyAudit,
        contextSummary: ctx.compactSummary,
      }
    }
    // Deterministic output failed validation — unusual, fall through to fallback
    hadBlockedAttempt = true
  }

  // Step 3: LLM path — Sprint 999: real Anthropic API call.
  // Dynamic import keeps the Anthropic SDK out of the client bundle.
  // callDonnaLlm() checks API key, builds prompt, calls API, validates response.
  if (input.useLlm) {
    safetyAudit.push('LLM: Attempting Anthropic API call via callDonnaLlm.')
    try {
      // Dynamic import — only resolved on server where ANTHROPIC_API_KEY is available.
      const { callDonnaLlm } = await import('./llmApiClient')
      const llmResult: LlmCallResult = await callDonnaLlm(ctx, safetyAudit)

      if (llmResult.hadBlockedContent) {
        hadBlockedAttempt = true
        safetyAudit.push(`LLM: Blocked content detected. Falling back to deterministic response.`)
        return {
          ...buildFallbackResponse(ctx, 'LLM response contained blocked content.'),
          hadBlockedAttempt: true,
          safetyAudit,
        }
      }

      if (llmResult.output) {
        const isValid = validateLlmOutput(
          llmResult.output.type,
          llmResult.output.toolRequest,
          safetyAudit,
        )
        if (isValid) {
          safetyAudit.push(`LLM: Response validated. model=${llmResult.model} latency=${llmResult.latencyMs}ms`)

          // Sprint 1000 — Tool execution loop: execute toolRequest if present and safe.
          // Sprint 1002 — runLiveToolExecutionLoop also handles DB-backed live tools.
          // Only safe/read-only tools execute directly. approval_gated tools return an
          // explanation that director confirmation is required. Max one tool per turn.
          const toolLoopResult = await runLiveToolExecutionLoop(llmResult.output, ctx, safetyAudit)

          // Sprint 1001 — Multi-turn tool loop: if tool executed, call LLM once more
          // with the tool result as context for a grounded final answer.
          // Max one follow-up LLM call per user turn. If second turn fails, tool result used.
          if (toolLoopResult.executed) {
            const multiTurnResult = await runMultiTurnToolLoop(input, toolLoopResult, safetyAudit)
            return {
              primaryOutput: multiTurnResult.output,
              secondaryOutputs: [],
              hadBlockedAttempt,
              safetyAudit,
              contextSummary: ctx.compactSummary,
            }
          }

          return {
            primaryOutput: toolLoopResult.output,
            secondaryOutputs: [],
            hadBlockedAttempt,
            safetyAudit,
            contextSummary: ctx.compactSummary,
          }
        }
        safetyAudit.push('LLM: Response failed safety validation — falling back.')
        hadBlockedAttempt = true
      } else {
        safetyAudit.push(`LLM: No output returned (${llmResult.error ?? 'unknown reason'}) — falling back.`)
      }
    } catch (err) {
      safetyAudit.push(`LLM: Unexpected error in callDonnaLlm: ${err instanceof Error ? err.message : String(err)}`)
    }

    // LLM path failed or returned nothing — deterministic fallback
    return {
      ...buildFallbackResponse(ctx, 'LLM path failed — returning deterministic fallback.'),
      hadBlockedAttempt,
      safetyAudit,
    }
  }

  // Step 4: No deterministic handler matched + LLM not requested → fallback
  return buildFallbackResponse(ctx, 'No deterministic handler matched for this input.')
}

// ── Blocked action guard ──────────────────────────────────────────────────────

/**
 * Check if a natural-language request contains a blocked action pattern.
 * Use this as a pre-filter before passing input to orchestrate().
 * Returns the blocked action name if found, null if safe.
 */
export function detectBlockedAction(text: string): string | null {
  const lower = text.toLowerCase()
  const blockedPatterns: Array<{ pattern: RegExp; action: string }> = [
    { pattern: /approve\s+(this|the|an?)\s+(item|wrap.?up|draft|action)/i, action: 'approve_review_item' },
    { pattern: /reject\s+(this|the|an?)\s+(item|wrap.?up|draft|action)/i, action: 'reject_review_item' },
    { pattern: /send\s+(to|a message to)\s+parent/i, action: 'send_parent_message' },
    { pattern: /move\s+(the|this)?\s*player\s+(up|down)/i, action: 'change_player_level' },
    { pattern: /change\s+(the)?\s*roster/i, action: 'change_roster' },
    { pattern: /raw\s+coach\s+note/i, action: 'expose_raw_coach_notes' },
  ]
  for (const { pattern, action } of blockedPatterns) {
    if (pattern.test(lower)) {
      if (isActionBlocked(action)) return action
    }
  }
  return null
}
