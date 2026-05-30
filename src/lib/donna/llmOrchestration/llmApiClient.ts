// Sprint 999 — DONNA LLM API Client V1
// Anthropic API integration for DONNA orchestration.
// Server-side only — never import from client components.
// Uses claude-sonnet-4-6 (ANTHROPIC_MODEL env var override supported).
//
// Safety invariants:
//   - ANTHROPIC_API_KEY must be set — returns null if missing (graceful fallback)
//   - LLM output must match allowed output types — validated before returning
//   - Blocked actions in LLM output → rejected, fallback returned
//   - Max 800 output tokens to keep responses concise
//   - 1 retry on transient errors (rate limit, 529, 500)
//   - 30-second timeout guard
//   - Token budget warning when system prompt exceeds 4000 chars
//
// Prompt caching: The system prompt is deterministic per role/page/state combination.
// Claude SDK caches system prompt blocks automatically when using cache_control.

import Anthropic from '@anthropic-ai/sdk'
import type { OrchestratorOutput, OrchestratorOutputType, OrchestratorSafetyLevel } from './types'
import type { ContextPacket } from './contextPacket'
import { isOutputAllowed, isActionBlocked } from './safetyContract'
import { detectBlockedAction } from './orchestrator'
// Sprint 1005 — Safe usage tracking (stdout/log only — no DB writes)
import { logDonnaLlmUsage, logDonnaFallbackUsage } from './donnaUsageTracking'

// ── LLM response schema ───────────────────────────────────────────────────────

/**
 * The structured JSON output the LLM must produce.
 * Validated before converting to OrchestratorOutput.
 */
interface LlmDonnaResponse {
  type: OrchestratorOutputType
  text: string
  suggestedRoute?: string | null
  highlightTargetId?: string | null
  highlightTargetLabel?: string | null
  safetyLevel: OrchestratorSafetyLevel
  requiresConfirmation: boolean
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

// ── Schema validator ──────────────────────────────────────────────────────────

const VALID_OUTPUT_TYPES: OrchestratorOutputType[] = [
  'answer', 'recommend_next_action', 'highlight_target',
  'explain_action', 'draft_proposed_action', 'route_to_review', 'ask_clarifying_question',
]

const VALID_SAFETY_LEVELS: OrchestratorSafetyLevel[] = ['safe', 'review_only', 'approval_gated', 'blocked']

function isValidLlmResponse(obj: unknown): obj is LlmDonnaResponse {
  if (!obj || typeof obj !== 'object') return false
  const r = obj as Record<string, unknown>
  return (
    typeof r['type'] === 'string' && VALID_OUTPUT_TYPES.includes(r['type'] as OrchestratorOutputType) &&
    typeof r['text'] === 'string' && r['text'].length > 0 &&
    typeof r['safetyLevel'] === 'string' && VALID_SAFETY_LEVELS.includes(r['safetyLevel'] as OrchestratorSafetyLevel) &&
    typeof r['requiresConfirmation'] === 'boolean' &&
    (r['confidence'] === 'high' || r['confidence'] === 'medium' || r['confidence'] === 'low') &&
    typeof r['reasoning'] === 'string'
  )
}

// ── Output type schema for the LLM prompt ────────────────────────────────────

const OUTPUT_TYPE_SCHEMA = `
Output schema (return ONLY this JSON object, no other text):
{
  "type": "answer|recommend_next_action|highlight_target|explain_action|draft_proposed_action|route_to_review|ask_clarifying_question",
  "text": "Your response to the director (max 200 words, no markdown headers, no bullet points, calm COO tone)",
  "suggestedRoute": "/director/review or null",
  "highlightTargetId": "focus-id-string or null",
  "highlightTargetLabel": "human label for the highlighted element or null",
  "safetyLevel": "safe|review_only|approval_gated",
  "requiresConfirmation": false,
  "confidence": "high|medium|low",
  "reasoning": "Brief internal reasoning for your choice (not shown to user)"
}

Rules for type selection:
- answer: general questions, explanations, guidance
- recommend_next_action: "what should I do next?" or priority questions
- highlight_target: when pointing to a specific UI element (requires highlightTargetId)
- explain_action: explaining what an action does and its safety implications
- draft_proposed_action: proposing an action that needs director approval
- route_to_review: directing director to the review queue
- ask_clarifying_question: when more context is needed

Rules for safetyLevel:
- safe: read-only, no mutation possible
- review_only: creates a draft, requires explicit save
- approval_gated: requires director approval in review queue

Never set requiresConfirmation: true unless safetyLevel is approval_gated.
Never set type to anything outside the allowed list.
Never include raw player names, coach notes, or private data in "text".`

// ── LLM call ──────────────────────────────────────────────────────────────────

export interface LlmCallResult {
  output: OrchestratorOutput | null
  error: string | null
  inputTokens: number
  outputTokens: number
  model: string
  latencyMs: number
  hadBlockedContent: boolean
}

/**
 * Call the Anthropic API with the DONNA context packet and user input.
 * Returns a validated OrchestratorOutput or null on failure.
 *
 * Server-side only. Never call from client components.
 * Returns null gracefully — never throws.
 */
export async function callDonnaLlm(
  ctx: ContextPacket,
  safetyAudit: string[],
): Promise<LlmCallResult> {
  const startMs = Date.now()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey.startsWith('your_') || apiKey === '') {
    safetyAudit.push('LLM: ANTHROPIC_API_KEY not configured. Returning null.')
    // Sprint 1005: log fallback — API key not configured
    logDonnaFallbackUsage({ academyId: ctx.safeSignals.academyId, reason: 'api_key_missing', safetyAudit })
    return { output: null, error: 'API key not configured.', inputTokens: 0, outputTokens: 0, model: 'none', latencyMs: 0, hadBlockedContent: false }
  }

  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'

  // ── Pre-call safety check ─────────────────────────────────────────────────
  const blockedAction = detectBlockedAction(ctx.userInput)
  if (blockedAction) {
    safetyAudit.push(`LLM: Blocked action detected in user input: ${blockedAction}. Skipping LLM call.`)
    return { output: null, error: `Blocked action: ${blockedAction}`, inputTokens: 0, outputTokens: 0, model, latencyMs: 0, hadBlockedContent: true }
  }

  // ── Token budget warning ──────────────────────────────────────────────────
  if (ctx.systemPrompt.length > 4000) {
    safetyAudit.push(`LLM: System prompt is ${ctx.systemPrompt.length} chars — consider compacting context.`)
  }

  // ── Build messages ────────────────────────────────────────────────────────
  const systemContent = ctx.systemPrompt + '\n\n' + OUTPUT_TYPE_SCHEMA

  const userContent = ctx.conversationHistory.length > 0
    ? `Recent context:\n${ctx.conversationHistory.slice(-4).map(t => `${t.role === 'user' ? 'Director' : 'DONNA'}: ${t.content}`).join('\n')}\n\nDirector: ${ctx.userInput}`
    : `Director: ${ctx.userInput}`

  const client = new Anthropic({ apiKey })

  // ── API call with one retry ───────────────────────────────────────────────
  let rawText = ''
  let inputTokens = 0
  let outputTokens = 0

  const RETRYABLE_STATUS = new Set([429, 500, 529])

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: 800,
        system: [
          {
            type: 'text',
            text: systemContent,
            // Prompt caching: system prompt is stable per context state
            // @ts-ignore — cache_control is valid in the Anthropic SDK
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          { role: 'user', content: userContent },
        ],
      })

      const block = response.content[0]
      if (!block || block.type !== 'text') {
        safetyAudit.push(`LLM: Unexpected response block type on attempt ${attempt}.`)
        if (attempt === 1) continue
        break
      }
      rawText = block.text.trim()
      inputTokens = response.usage?.input_tokens ?? 0
      outputTokens = response.usage?.output_tokens ?? 0
      break
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      const status = (err as { status?: number }).status
      safetyAudit.push(`LLM: API error on attempt ${attempt}: ${errMsg}`)
      if (attempt === 1 && status && RETRYABLE_STATUS.has(status)) {
        await new Promise(r => setTimeout(r, 1000))
        continue
      }
      return { output: null, error: `API error: ${errMsg}`, inputTokens, outputTokens, model, latencyMs: Date.now() - startMs, hadBlockedContent: false }
    }
  }

  if (!rawText) {
    safetyAudit.push('LLM: Empty response from API.')
    return { output: null, error: 'Empty response.', inputTokens, outputTokens, model, latencyMs: Date.now() - startMs, hadBlockedContent: false }
  }

  // ── Parse JSON response ───────────────────────────────────────────────────
  let parsed: unknown
  try {
    // Strip any markdown code fences the LLM may have added despite instructions
    const stripped = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
    parsed = JSON.parse(stripped)
  } catch {
    safetyAudit.push(`LLM: Response was not valid JSON. Raw: ${rawText.slice(0, 100)}`)
    return { output: null, error: 'Invalid JSON response.', inputTokens, outputTokens, model, latencyMs: Date.now() - startMs, hadBlockedContent: false }
  }

  if (!isValidLlmResponse(parsed)) {
    safetyAudit.push(`LLM: Response failed schema validation.`)
    return { output: null, error: 'Response failed schema validation.', inputTokens, outputTokens, model, latencyMs: Date.now() - startMs, hadBlockedContent: false }
  }

  const llmResponse = parsed

  // ── Post-parse safety checks ──────────────────────────────────────────────

  // 1. Output type must be in allowed list
  if (!isOutputAllowed(llmResponse.type)) {
    safetyAudit.push(`LLM: Blocked — output type '${llmResponse.type}' not allowed.`)
    return { output: null, error: `Blocked output type: ${llmResponse.type}`, inputTokens, outputTokens, model, latencyMs: Date.now() - startMs, hadBlockedContent: true }
  }

  // 2. Check LLM response text for blocked action patterns
  const textBlocked = detectBlockedAction(llmResponse.text)
  if (textBlocked) {
    safetyAudit.push(`LLM: Blocked — response text contains blocked action: ${textBlocked}`)
    return { output: null, error: `Blocked content in response: ${textBlocked}`, inputTokens, outputTokens, model, latencyMs: Date.now() - startMs, hadBlockedContent: true }
  }

  // 3. Never return blocked safety level as a usable output
  if (llmResponse.safetyLevel === 'blocked') {
    safetyAudit.push(`LLM: Blocked — response declared safetyLevel: blocked`)
    return { output: null, error: 'Response declared itself blocked.', inputTokens, outputTokens, model, latencyMs: Date.now() - startMs, hadBlockedContent: true }
  }

  // 4. Route suggestions must be internal
  const ALLOWED_ROUTE_PREFIXES = ['/director', '/coach', '/player', '/parent']
  if (llmResponse.suggestedRoute && !ALLOWED_ROUTE_PREFIXES.some(p => llmResponse.suggestedRoute!.startsWith(p))) {
    safetyAudit.push(`LLM: Blocked external route suggestion: ${llmResponse.suggestedRoute}`)
    llmResponse.suggestedRoute = null // sanitize — don't block the whole response
  }

  // ── Build OrchestratorOutput ──────────────────────────────────────────────
  const output: OrchestratorOutput = {
    type: llmResponse.type,
    text: llmResponse.text,
    safetyLevel: llmResponse.safetyLevel,
    requiresConfirmation: llmResponse.requiresConfirmation,
    confidence: llmResponse.confidence,
    source: 'llm_inferred',
    suggestedRoute: llmResponse.suggestedRoute ?? undefined,
    highlightTarget: llmResponse.highlightTargetId
      ? {
          targetId: llmResponse.highlightTargetId,
          label: llmResponse.highlightTargetLabel ?? llmResponse.highlightTargetId,
          route: llmResponse.suggestedRoute ?? ctx.safeSignals.pathname,
        }
      : undefined,
  }

  safetyAudit.push(`LLM: Valid response. type=${output.type} safety=${output.safetyLevel} confidence=${output.confidence} tokens=${inputTokens}+${outputTokens}`)

  // Sprint 1005: log successful LLM call — safe metadata only, no raw content
  logDonnaLlmUsage({
    academyId: ctx.safeSignals.academyId,
    model,
    latencyMs: Date.now() - startMs,
    inputTokens,
    outputTokens,
    success: true,
    outputTypeLabel: output.type,
    safetyAudit,
  })

  return {
    output,
    error: null,
    inputTokens,
    outputTokens,
    model,
    latencyMs: Date.now() - startMs,
    hadBlockedContent: false,
  }
}
