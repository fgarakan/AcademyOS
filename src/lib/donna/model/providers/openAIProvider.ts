// Sprint 4361 — DONNA Model Adapter + Context Firewall V1
// Part 5 — OpenAI provider (SCAFFOLD ONLY — provably call-free in Sprint 4361).
//
// Defines the future OpenAI provider boundary so callers and the adapter compile
// against a stable shape. It contains NO OpenAI SDK import, NO fetch, NO api.openai.com,
// and NO network path of any kind in this sprint.
//
//   - isAvailable() returns false (hardcoded) — the adapter therefore never calls
//     generate/summarize/classify.
//   - generate/summarize/classify throw "not implemented in Sprint 4361".
//
// Sprint 4362 will implement the real, governed OpenAI call here (timeout, budget,
// retry, usage logging, kill switch) behind isModelAssistEnabled() + OPENAI_API_KEY.
//
// Design rules (enforced by modelSafetyCertification):
//   - No `fetch(`, no `import ... openai`, no `api.openai.com`, no SDK, no network.
//   - No DB, no service role, no mutation.

import type { ModelProvider } from '@/lib/donna/model/modelTypes'
import type {
  AIGenerateParams,
  AIGenerateResult,
  AISummarizeParams,
  AIClassifyParams,
  AIClassifyResult,
} from '@/lib/ai/aiReasoningProvider'

const SCAFFOLD_ONLY =
  'OpenAIProvider is scaffold-only in Sprint 4361 — no network path. Real call lands in Sprint 4362.'

export class OpenAIProvider implements ModelProvider {
  readonly name = 'openai'

  /**
   * Hardcoded false in Sprint 4361 so the adapter never calls this provider. Sprint
   * 4362 will gate this on isModelAssistEnabled() + a present OPENAI_API_KEY.
   */
  isAvailable(): boolean {
    return false
  }

  async generate(_params: AIGenerateParams): Promise<AIGenerateResult> {
    throw new Error(SCAFFOLD_ONLY)
  }

  async summarize(_params: AISummarizeParams): Promise<string> {
    throw new Error(SCAFFOLD_ONLY)
  }

  async classify(_params: AIClassifyParams): Promise<AIClassifyResult> {
    throw new Error(SCAFFOLD_ONLY)
  }
}
