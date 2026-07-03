// Sprint 4361 — DONNA Model Adapter + Context Firewall V1
// Part 3 — Null provider (the call-free V1 default).
//
// Implements ModelProvider but is NEVER available, so the adapter always takes the
// deterministic fallback path and never calls a model. This is what makes Sprint 4361
// provably network-free: the default provider has no fetch, no SDK, no network path.
//
// Design rules:
//   - Pure TypeScript. No fetch, no SDK, no DB, no env reads, no side effects.
//   - isAvailable() is hardcoded false. generate/summarize/classify throw if ever
//     called (they are not, because the adapter checks isAvailable() first).

import type { ModelProvider } from '@/lib/donna/model/modelTypes'
import type {
  AIGenerateParams,
  AIGenerateResult,
  AISummarizeParams,
  AIClassifyParams,
  AIClassifyResult,
} from '@/lib/ai/aiReasoningProvider'

const UNAVAILABLE = 'NullProvider is not available — deterministic fallback only (Sprint 4361).'

export class NullProvider implements ModelProvider {
  readonly name = 'null'

  isAvailable(): boolean {
    return false
  }

  async generate(_params: AIGenerateParams): Promise<AIGenerateResult> {
    throw new Error(UNAVAILABLE)
  }

  async summarize(_params: AISummarizeParams): Promise<string> {
    throw new Error(UNAVAILABLE)
  }

  async classify(_params: AIClassifyParams): Promise<AIClassifyResult> {
    throw new Error(UNAVAILABLE)
  }
}
