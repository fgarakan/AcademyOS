// Sprint 4361–4362 — DONNA Model Adapter (the one governed client).
//
// The single governed entry point between DONNA and any external model. It:
//   1. Runs the context firewall gate (refuses unsafe context).
//   2. Selects a provider (injected in tests; NullProvider when model-assist is off;
//      OpenAIProvider when FEATURE_DONNA_MODEL_ASSIST + OPENAI_API_KEY are present).
//   3. If no provider is available → deterministic fallback (no model call).
//   4. Otherwise calls the provider for a PLAIN-TEXT rephrasing of the deterministic
//      guidance, validates it, and returns it tagged source:'model_assisted'. On ANY
//      failure (error, timeout, invalid/unsafe output) → deterministic fallback.
//
// The model only ever rewrites prose. Every structured/safety field (loopId,
// requiresApproval, visibilityWarning, safeNextActions, suggestedRoute) is copied from
// the deterministic input — the model cannot invent state.
//
// Design rules:
//   - No DB, no service role, no mutation. Imports no Supabase client, no proposed_actions.
//   - Never throws to the caller; always resolves to a ModelAdapterResult.

import {
  type ModelSafeContext,
  type ModelAdapterResult,
  type ModelConfidence,
  type ModelProvider,
  DONNA_MODEL_SYSTEM_PROMPT_V1,
  MODEL_CONFIG,
} from '@/lib/donna/model/modelTypes'
import { assertModelSafeContext, serializeModelContext } from '@/lib/donna/model/contextFirewall'
import { validateModelMessage } from '@/lib/donna/model/responseValidator'
import { NullProvider } from '@/lib/donna/model/providers/nullProvider'
import { OpenAIProvider } from '@/lib/donna/model/providers/openAIProvider'
import { isModelAssistEnabled } from '@/lib/featureFlags/featureFlags'

/** The deterministic answer the caller already computed (e.g. from formatLoopAnswer). */
export interface DeterministicFallback {
  message: string
  confidence?: ModelConfidence
  loopId?: number
  safeNextActions?: string[]
  requiresApproval?: boolean
  visibilityWarning?: string
  suggestedRoute?: string
}

export interface RunModelAssistInput {
  context: ModelSafeContext
  deterministicFallback: DeterministicFallback
}

export interface RunModelAssistOptions {
  /** Inject a provider (tests). Default selects via createModelProvider(). */
  provider?: ModelProvider
}

/**
 * Provider selection. Returns a provider that is never available unless model-assist is
 * explicitly enabled (flag + key). API-key presence alone does not enable it.
 */
export function createModelProvider(): ModelProvider {
  if (isModelAssistEnabled()) {
    return new OpenAIProvider()
  }
  return new NullProvider()
}

export async function runModelAssist(
  input: RunModelAssistInput,
  opts: RunModelAssistOptions = {},
): Promise<ModelAdapterResult> {
  const fb = input.deterministicFallback
  const role = input.context.userRole

  const buildResult = (
    over: Partial<ModelAdapterResult>,
  ): ModelAdapterResult => ({
    message: over.message ?? fb.message,
    confidence: over.confidence ?? fb.confidence ?? 'high',
    source: over.source ?? 'deterministic',
    loopId: fb.loopId,
    safeNextActions: fb.safeNextActions,
    requiresApproval: fb.requiresApproval ?? false,
    visibilityWarning: fb.visibilityWarning,
    suggestedRoute: fb.suggestedRoute,
    blockedReason: over.blockedReason,
    debug: over.debug,
  })

  const fallback = (blockedReason: string, provider: string, latencyMs?: number): ModelAdapterResult =>
    buildResult({
      source: 'deterministic',
      blockedReason,
      debug: { provider, usedFallback: true, latencyMs },
    })

  // 1. Firewall gate — never proceed with an unsafe context.
  const assertion = assertModelSafeContext(input.context)
  if (!assertion.ok) {
    return fallback(`firewall_block: ${assertion.violations.join(', ')}`, 'null')
  }

  // 2. Provider selection (injected in tests).
  const provider = opts.provider ?? createModelProvider()

  // 3. Unavailable → deterministic fallback. No model call.
  if (!provider.isAvailable()) {
    return fallback('model_unavailable', provider.name)
  }

  // 4. Governed model call — PLAIN-TEXT rephrasing of the deterministic guidance.
  const started = Date.now()
  try {
    const userContent =
      `${serializeModelContext(input.context)}\n\n` +
      `GUIDANCE TO REPHRASE (keep every fact; return one natural plain-text paragraph):\n${fb.message}`

    const result = await provider.generate({
      systemPrompt: DONNA_MODEL_SYSTEM_PROMPT_V1,
      userContent,
      maxTokens: MODEL_CONFIG.maxOutputTokens,
    })
    const latencyMs = Date.now() - started

    const validation = validateModelMessage(result.text, role)
    if (!validation.ok) {
      return fallback(`invalid_response: ${validation.reason}`, provider.name, latencyMs)
    }

    return buildResult({
      message: result.text.trim(),
      source: 'model_assisted',
      confidence: 'medium',
      debug: { provider: provider.name, usedFallback: false, latencyMs },
    })
  } catch {
    return fallback('model_error', provider.name, Date.now() - started)
  }
}
