// Sprint 978 — DONNA LLM Orchestration Foundation V1
// The main orchestrator that coordinates context, tools, and safety validation.
// Pure TypeScript — no DB, no API, no React, no mutations in this module.
//
// V1 architecture:
//   1. Build context packet from available signals
//   2. Run deterministic intent classification first (fast path)
//   3. If deterministic handlers resolve the intent: return without LLM
//   4. If LLM is needed: send context packet + user input to LLM
//   5. Validate LLM output against safety contract
//   6. Execute only safe, validated tool requests
//   7. Return structured response — no direct mutations
//
// V1 does NOT execute LLM calls directly.
// V1 establishes the architecture, types, and safety contract so Sprint 979+
// can wire real LLM calls safely with eval requirements already defined.
//
// Fallback behavior:
//   If LLM is unavailable or response is invalid → deterministic fallback
//   If tool request is blocked → explain why, do not execute, log to safetyAudit

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
 * V1 behavior:
 *   1. Builds context packet
 *   2. Tries deterministic fast paths
 *   3. If `useLlm` is false or no LLM is configured: returns deterministic result or fallback
 *   4. If `useLlm` is true: (stub) — logs that LLM path is not yet wired; returns fallback
 *
 * V1 does NOT make real LLM API calls. The LLM path is stubbed.
 * Sprint 979 will wire the actual Anthropic API call behind this contract.
 *
 * Safety invariants enforced regardless of path:
 *   - No auto-approve/reject
 *   - No parent/player communications
 *   - No level/roster/billing changes
 *   - All mutations go through proposed_actions pipeline
 *   - No raw private data exposed
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
      return {
        primaryOutput: deterministicResult,
        secondaryOutputs: [],
        hadBlockedAttempt: false,
        safetyAudit,
        contextSummary: ctx.compactSummary,
      }
    }
    // Deterministic output failed validation — unusual, fall through to fallback
    hadBlockedAttempt = true
  }

  // Step 3: LLM path (V1 stub — not yet wired to real API)
  if (input.useLlm) {
    // V1: LLM call is stubbed. Sprint 979 will wire the Anthropic API here.
    // The contract is: send ctx.systemPrompt + ctx.userInput, receive OrchestratorOutput.
    // All LLM outputs must pass validateLlmOutput() before returning.
    safetyAudit.push('LLM: Path selected but not yet wired (Sprint 979). Returning fallback.')
    return buildFallbackResponse(ctx, 'LLM path not yet wired in V1.')
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
