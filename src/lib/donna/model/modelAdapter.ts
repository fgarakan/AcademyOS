// Sprint 4361 — DONNA Model Adapter + Context Firewall V1
// Part 4 — Model Adapter (the one governed client).
//
// The single governed entry point between DONNA and any external model. It:
//   1. Runs the context firewall gate (refuses unsafe context).
//   2. Selects a provider (NullProvider by default; OpenAIProvider scaffold when the
//      model-assist flag + key are present — still unavailable in Sprint 4361).
//   3. If no provider is available (ALWAYS in Sprint 4361) → returns the deterministic
//      fallback. The provider's generate() is NEVER called in this sprint.
//
// Sprint 4361 scope: build + certify. Not wired into processDonnaMessage. No network.
//
// Design rules:
//   - Pure orchestration. No DB, no fetch, no SDK, no service role, no mutation.
//   - Imports NO Supabase client and NO proposed_actions — structurally cannot mutate.
//   - Never throws to the caller; always resolves to a ModelAdapterResult.

import {
  type ModelSafeContext,
  type ModelAdapterResult,
  type ModelConfidence,
  type ModelProvider,
} from '@/lib/donna/model/modelTypes'
import { assertModelSafeContext } from '@/lib/donna/model/contextFirewall'
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

/**
 * Provider selection. Sprint 4361: returns a provider that is never available, so no
 * model is ever called. Sprint 4362+ makes OpenAIProvider available when enabled.
 */
export function createModelProvider(): ModelProvider {
  if (isModelAssistEnabled()) {
    // Scaffold in Sprint 4361 — isAvailable() still returns false (no network path).
    return new OpenAIProvider()
  }
  return new NullProvider()
}

/**
 * Run model-assisted reasoning through the governed boundary. In Sprint 4361 this
 * always returns the deterministic fallback tagged source:'deterministic'. The
 * structure supports a future governed provider call (Sprint 4362) without changing
 * callers.
 */
export async function runModelAssist(input: RunModelAssistInput): Promise<ModelAdapterResult> {
  const fb = input.deterministicFallback

  const buildFallback = (blockedReason: string, provider: string): ModelAdapterResult => ({
    message: fb.message,
    confidence: fb.confidence ?? 'high',
    source: 'deterministic',
    loopId: fb.loopId,
    safeNextActions: fb.safeNextActions,
    requiresApproval: fb.requiresApproval ?? false,
    visibilityWarning: fb.visibilityWarning,
    suggestedRoute: fb.suggestedRoute,
    blockedReason,
    debug: { provider, usedFallback: true },
  })

  // 1. Firewall gate — never proceed with an unsafe context.
  const assertion = assertModelSafeContext(input.context)
  if (!assertion.ok) {
    return buildFallback(`firewall_block: ${assertion.violations.join(', ')}`, 'null')
  }

  // 2. Provider selection.
  const provider = createModelProvider()

  // 3. Unavailable (ALWAYS in Sprint 4361) → deterministic fallback. No model call.
  if (!provider.isAvailable()) {
    return buildFallback('model_unavailable', provider.name)
  }

  // 4. Sprint 4362+: governed provider call (timeout/budget/retry/usage-log) goes here.
  //    Not reachable in Sprint 4361 — provider.generate() is never invoked in this file.
  return buildFallback('model_path_not_enabled', provider.name)
}
