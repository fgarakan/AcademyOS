// Sprint 1005 — DONNA Usage Tracking V1
// Safe log-based usage instrumentation for DONNA LLM and tool calls.
// Pure TypeScript — no DB writes, no schema changes.
// All usage is written to structured stdout via the existing logInfo() path.
//
// Privacy rules (enforced in every function):
//   NEVER LOG: raw prompts, raw LLM responses, raw tool payloads,
//              raw coach notes, raw player notes, raw session notes,
//              full UUIDs (truncate to 8 chars for log correlation only)
//
//   SAFE TO LOG: event type, model, latency, token counts, tool ID,
//                academyId, success/failure, error category (not message),
//                output type label, role label
//
// Failure handling:
//   All functions are wrapped in try/catch.
//   If logging fails, a safetyAudit note is pushed (if safetyAudit is provided).
//   DONNA's response always continues — logging failure never blocks the call.
//
// Usage:
//   logDonnaLlmUsage({ academyId, model, latencyMs, inputTokens, outputTokens, success })
//   logDonnaToolUsage({ academyId, toolId, latencyMs, success, role })
//   logDonnaFallbackUsage({ academyId, reason, role })

import { logDonnaCall, logUsageEvent } from '@/lib/usage/usageTracker'
import type { UsageEvent } from '@/lib/usage/usageTypes'

// ── ID safety helper ──────────────────────────────────────────────────────────

/**
 * Truncate a UUID or ID to an 8-character prefix for log correlation.
 * Never logs full IDs — 8 chars is sufficient for debugging without exposing raw IDs.
 */
function safeIdPrefix(id: string | null | undefined): string | undefined {
  if (!id || id.length < 8) return undefined
  return `${id.slice(0, 8)}...`
}

// ── LLM usage tracking ────────────────────────────────────────────────────────

export interface DonnaLlmUsageParams {
  /** Academy ID for cost attribution (safe — internal ID, not user-facing) */
  academyId: string | null | undefined
  /** Anthropic model used (e.g. 'claude-sonnet-4-6') */
  model: string
  /** Total latency for the LLM call in milliseconds */
  latencyMs: number
  /** Input tokens used (from Anthropic API response) */
  inputTokens?: number
  /** Output tokens generated */
  outputTokens?: number
  /** Whether the call produced a usable output */
  success: boolean
  /** Whether content was blocked by safety validation */
  hadBlockedContent?: boolean
  /** Whether this was the second turn of a multi-turn loop */
  isSecondTurn?: boolean
  /** Category reason for failure (never raw error message) */
  failureCategory?: 'api_key_missing' | 'api_error' | 'blocked_input' | 'blocked_output' | 'invalid_json' | 'schema_validation' | 'rate_limit'
  /** Safe output type label (e.g. 'answer', 'recommend_next_action') */
  outputTypeLabel?: string
  /** For safetyAudit thread if available */
  safetyAudit?: string[]
}

/**
 * Log a DONNA LLM call safely.
 * Uses the existing logDonnaCall() wrapper — writes to structured stdout.
 * Never throws. Never logs raw prompts or responses.
 */
export function logDonnaLlmUsage(params: DonnaLlmUsageParams): void {
  try {
    const academyId = params.academyId ?? 'unknown'
    logDonnaCall({
      academyId,
      userId: null, // user identity not tracked here — academyId is sufficient for cost attribution
      model: params.model,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      latencyMs: params.latencyMs,
      blocked: params.hadBlockedContent ?? !params.success,
      blockedReason: params.failureCategory === 'rate_limit' ? 'rate_limit' : undefined,
      requestId: [
        params.isSecondTurn ? 'turn2' : 'turn1',
        params.outputTypeLabel,
        params.failureCategory,
      ].filter(Boolean).join(':') || undefined,
    })
    params.safetyAudit?.push(
      `Usage: donna_intelligence_call model=${params.model} tokens=${(params.inputTokens ?? 0) + (params.outputTokens ?? 0)} latency=${params.latencyMs}ms success=${params.success}`
    )
  } catch {
    // Logging failure must not break DONNA
    params.safetyAudit?.push('Usage: logDonnaLlmUsage failed silently')
  }
}

// ── Tool usage tracking ───────────────────────────────────────────────────────

export interface DonnaToolUsageParams {
  /** Academy ID for cost attribution */
  academyId: string | null | undefined
  /** Tool ID (e.g. 'get_academy_state') */
  toolId: string
  /** Latency for the tool execution in milliseconds */
  latencyMs: number
  /** Whether the tool call succeeded (ok: true) */
  success: boolean
  /** User role for context (not personally identifying) */
  role?: string
  /** Current page route (no player/session IDs — just the route pattern) */
  routeType?: string
  /** Category reason for failure (never raw DB error) */
  failureCategory?: 'missing_id' | 'db_error' | 'partial_data' | 'not_live_tool' | 'exception'
  /** For safetyAudit thread if available */
  safetyAudit?: string[]
}

/**
 * Log a DONNA live context tool call safely.
 * Writes to structured stdout via logUsageEvent().
 * Never throws. Never logs raw tool payloads, player names, coach notes, or raw IDs.
 */
export function logDonnaToolUsage(params: DonnaToolUsageParams): void {
  try {
    const academyId = params.academyId ?? 'unknown'
    const event: UsageEvent = {
      eventType: 'donna_tool_call',
      academyId,
      userId: null,
      provider: 'anthropic', // DONNA orchestration layer (Anthropic ecosystem)
      latencyMs: params.latencyMs,
      blocked: !params.success,
      requestId: [
        params.toolId,
        params.role,
        params.routeType,
        params.failureCategory,
      ].filter(Boolean).join(':') || undefined,
    }
    logUsageEvent(event)
    params.safetyAudit?.push(
      `Usage: donna_tool_call tool=${params.toolId} success=${params.success} latency=${params.latencyMs}ms`
    )
  } catch {
    params.safetyAudit?.push('Usage: logDonnaToolUsage failed silently')
  }
}

// ── Fallback usage tracking ───────────────────────────────────────────────────

export interface DonnaFallbackUsageParams {
  /** Academy ID for context */
  academyId: string | null | undefined
  /** Category of why fallback was used */
  reason: 'api_key_missing' | 'llm_blocked' | 'validation_failed' | 'no_match' | 'tool_failed' | 'exception' | 'api_error'
  /** User role for context */
  role?: string
  /** For safetyAudit thread if available */
  safetyAudit?: string[]
}

/**
 * Log when DONNA falls back to a deterministic response.
 * Helps identify which scenarios most commonly require fallback.
 * Never throws. Never logs raw content.
 */
export function logDonnaFallbackUsage(params: DonnaFallbackUsageParams): void {
  try {
    const academyId = params.academyId ?? 'unknown'
    const event: UsageEvent = {
      eventType: 'donna_orchestration_fallback',
      academyId,
      userId: null,
      blocked: true,
      blockedReason: params.reason === 'api_key_missing' ? 'kill_switch' : undefined,
      requestId: [params.reason, params.role].filter(Boolean).join(':') || undefined,
    }
    logUsageEvent(event)
    params.safetyAudit?.push(`Usage: donna_orchestration_fallback reason=${params.reason}`)
  } catch {
    params.safetyAudit?.push('Usage: logDonnaFallbackUsage failed silently')
  }
}
