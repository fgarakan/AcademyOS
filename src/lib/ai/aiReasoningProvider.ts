// Mega Sprint 2771–2800 — DONNA Academy DNA Foundation V1
// AI Reasoning Provider — minimal interface for future model-agnostic AI integration.
//
// Design rules:
//   - Defines the swap point for future AI provider changes.
//   - AnthropicAIProvider is the V1 implementation using the existing Anthropic SDK.
//   - OpenAI, Gemini, or Local providers implement AIReasoningProvider when needed.
//   - Do NOT wire this into the main DONNA orchestrator (llmApiClient.ts) yet.
//     This interface is for utility AI tasks (summarize, classify, generate short text).
//   - Main DONNA conversation orchestration remains in llmApiClient.ts.
//
// Future provider integration:
//   When adding OpenAI (or any provider):
//   1. Implement AIReasoningProvider with the new SDK.
//   2. Export as e.g. OpenAIAIProvider.
//   3. Replace AnthropicAIProvider as the default or use provider selection logic.
//   4. No other files need to change — the interface is the swap point.
//
// Server-side only — never import from client components.

import Anthropic from '@anthropic-ai/sdk'

// ── Core interface ────────────────────────────────────────────────────────────

export interface AIGenerateParams {
  systemPrompt: string
  userContent:  string
  maxTokens?:   number
  /** Optional per-call sampling temperature. Providers default to their own value. */
  temperature?: number
}

export interface AIGenerateResult {
  text:         string
  inputTokens:  number
  outputTokens: number
  modelUsed:    string
  latencyMs:    number
}

export interface AISummarizeParams {
  content:    string
  maxLength?: number  // approx word count
  tone?:      'formal' | 'coaching' | 'parent_friendly' | 'concise'
}

export interface AIClassifyParams {
  content:    string
  categories: readonly string[]
  context?:   string
}

export interface AIClassifyResult {
  category:   string
  confidence: number  // 0–1
  reasoning:  string
}

/**
 * AIReasoningProvider: minimal interface for AI utility tasks.
 *
 * Implement this interface to swap AI providers without changing call sites.
 * This is the insertion point for model-agnostic AI — not the DONNA orchestrator.
 */
export interface AIReasoningProvider {
  /** Generate text from a system prompt + user content. */
  generate(params: AIGenerateParams):   Promise<AIGenerateResult>
  /** Summarize a piece of text content. */
  summarize(params: AISummarizeParams): Promise<string>
  /** Classify content into one of the provided categories. */
  classify(params: AIClassifyParams):   Promise<AIClassifyResult>
}

// ── Anthropic implementation ──────────────────────────────────────────────────

/**
 * AnthropicAIProvider: implements AIReasoningProvider using the Anthropic SDK.
 *
 * This is the V1 default implementation.
 * Server-side only. Requires ANTHROPIC_API_KEY.
 */
export class AnthropicAIProvider implements AIReasoningProvider {
  private readonly apiKey: string
  private readonly model:  string

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY ?? ''
    this.model  = process.env.ANTHROPIC_MODEL   ?? 'claude-haiku-4-5-20251001'
  }

  private get client(): Anthropic {
    if (!this.apiKey || this.apiKey.startsWith('your_') || this.apiKey === '') {
      throw new Error('AI features are not available — ANTHROPIC_API_KEY is not configured.')
    }
    return new Anthropic({ apiKey: this.apiKey })
  }

  async generate(params: AIGenerateParams): Promise<AIGenerateResult> {
    const start = Date.now()
    const response = await this.client.messages.create({
      model:      this.model,
      max_tokens: params.maxTokens ?? 512,
      system:     params.systemPrompt,
      messages:   [{ role: 'user', content: params.userContent }],
    })
    const block = response.content[0]
    const text  = block?.type === 'text' ? block.text : ''
    return {
      text,
      inputTokens:  response.usage?.input_tokens  ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      modelUsed:    this.model,
      latencyMs:    Date.now() - start,
    }
  }

  async summarize(params: AISummarizeParams): Promise<string> {
    const maxWords = params.maxLength ?? 80
    const toneInstructions: Record<string, string> = {
      formal:          'Use formal, professional language.',
      coaching:        'Use direct coaching language. Be specific and actionable.',
      parent_friendly: 'Use warm, encouraging language accessible to non-experts.',
      concise:         'Be as brief as possible. Every word must earn its place.',
    }
    const toneInstruction = toneInstructions[params.tone ?? 'concise'] ?? ''

    const result = await this.generate({
      systemPrompt: `Summarize the following content in approximately ${maxWords} words or fewer. ${toneInstruction} Return only the summary — no preamble, no explanation.`,
      userContent:  params.content,
      maxTokens:    Math.round(maxWords * 1.5),
    })
    return result.text.trim()
  }

  async classify(params: AIClassifyParams): Promise<AIClassifyResult> {
    const categoryList = params.categories.map((c, i) => `${i + 1}. ${c}`).join('\n')
    const context = params.context ? `\nContext: ${params.context}` : ''

    const result = await this.generate({
      systemPrompt: `Classify the following content into exactly one of these categories:\n${categoryList}${context}\n\nReturn JSON only: { "category": "<exact category string>", "confidence": <0.0–1.0>, "reasoning": "<one sentence>" }`,
      userContent:  params.content,
      maxTokens:    128,
    })

    try {
      const stripped = result.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
      const parsed = JSON.parse(stripped) as { category: string; confidence: number; reasoning: string }
      if (typeof parsed.category === 'string' && typeof parsed.confidence === 'number') {
        return {
          category:   parsed.category,
          confidence: Math.min(1, Math.max(0, parsed.confidence)),
          reasoning:  parsed.reasoning ?? '',
        }
      }
    } catch {
      // Fallback: use first category
    }
    return {
      category:   params.categories[0] ?? 'unknown',
      confidence: 0.1,
      reasoning:  'Classification failed — using default category.',
    }
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Returns the default AI reasoning provider.
 * When a second provider is added, update this function (or add provider selection logic).
 * All callers use this factory — no direct AnthropicAIProvider instantiation in call sites.
 */
export function createAIReasoningProvider(): AIReasoningProvider {
  return new AnthropicAIProvider()
}
