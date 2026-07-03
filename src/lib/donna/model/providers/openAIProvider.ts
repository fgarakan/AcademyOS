// Sprint 4362 — DONNA Model Adapter: OpenAI provider (real, governed).
//
// Implements the OpenAI provider behind the adapter boundary. It makes a network call
// ONLY when invoked by modelAdapter, and only when model-assist is explicitly enabled
// (FEATURE_DONNA_MODEL_ASSIST) AND an OPENAI_API_KEY is present. API-key presence alone
// does NOT enable it — the feature flag is required.
//
// Guarantees:
//   - No tools / function-calling. No actions. No mutations. Read-only text generation.
//   - Only the firewall-approved payload (systemPrompt + serialized safe context) is sent.
//   - Bounded: hard timeout (AbortController), low temperature, capped max output tokens.
//   - Throws on any failure so the adapter falls back deterministically.
//
// Design rules:
//   - Server-side only. No SDK — plain fetch to the chat completions endpoint.
//   - Reads OPENAI_API_KEY / DONNA_MODEL_ID at call time; never logs them.

import type { ModelProvider } from '@/lib/donna/model/modelTypes'
import { MODEL_CONFIG } from '@/lib/donna/model/modelTypes'
import type {
  AIGenerateParams,
  AIGenerateResult,
  AISummarizeParams,
  AIClassifyParams,
  AIClassifyResult,
} from '@/lib/ai/aiReasoningProvider'
import { isModelAssistEnabled } from '@/lib/featureFlags/featureFlags'

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions'
const NOT_SUPPORTED = 'OpenAIProvider supports generate() only in Sprint 4362.'

export class OpenAIProvider implements ModelProvider {
  readonly name = 'openai'

  /**
   * Available only when the feature flag is explicitly enabled AND a key is present.
   * The adapter checks this before calling generate(); when false, no network happens.
   */
  isAvailable(): boolean {
    return isModelAssistEnabled()
  }

  async generate(params: AIGenerateParams): Promise<AIGenerateResult> {
    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

    const model = process.env.DONNA_MODEL_ID?.trim() || MODEL_CONFIG.defaultModelId
    const start = Date.now()

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), MODEL_CONFIG.timeoutMs)

    try {
      const response = await fetch(OPENAI_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: Math.min(params.maxTokens ?? MODEL_CONFIG.maxOutputTokens, MODEL_CONFIG.maxOutputTokens),
          temperature: params.temperature ?? MODEL_CONFIG.temperature,
          // No tools, no function-calling — plain text rephrasing only.
          messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.userContent },
          ],
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`OpenAI request failed: ${response.status}`)
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>
        usage?: { prompt_tokens?: number; completion_tokens?: number }
      }
      const text = data.choices?.[0]?.message?.content?.trim() ?? ''
      if (!text) throw new Error('OpenAI returned an empty response')

      return {
        text,
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        modelUsed: model,
        latencyMs: Date.now() - start,
      }
    } finally {
      clearTimeout(timer)
    }
  }

  // This provider is text-rephrasing only in V1. summarize/classify are not used by
  // the model-assist path and are intentionally unsupported.
  async summarize(_params: AISummarizeParams): Promise<string> {
    throw new Error(NOT_SUPPORTED)
  }

  async classify(_params: AIClassifyParams): Promise<AIClassifyResult> {
    throw new Error(NOT_SUPPORTED)
  }
}
