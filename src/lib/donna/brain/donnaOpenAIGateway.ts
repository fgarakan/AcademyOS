// Mega Sprint 3271–3300 — ONE DONNA Operating System Convergence V1
// Part 6 — The single canonical OpenAI gateway.
//
// There is ONE place DONNA talks to OpenAI: askConversationTeacher (gpt-4o-mini),
// already privacy-guarded, confidence-gated (<0.75), and key-gated with safe
// fallback. This module re-exports it under a canonical name and documents the
// contract so no second OpenAI pathway is introduced. It does NOT add a new call
// site or a new provider — it names the existing one as THE gateway.
//
// Provider map (documented, single source of truth):
//   • Live conversation reasoning + learning extraction + TTS → OpenAI (OPENAI_API_KEY)
//   • llmOrchestration tool-calling (multi-step drafts) → Anthropic (ANTHROPIC_API_KEY)
//   The director conversation pipeline uses THIS gateway (OpenAI). The orchestrator
//   remains a separate, approval-gated tool-calling path — not a second "DONNA brain".

import {
  askConversationTeacher,
  type ConversationTeacherInput,
  type ConversationTeacherOutput,
} from '@/lib/donna/conversation/donnaConversationTeacher'

// ── Contract (Part 6) ───────────────────────────────────────────────────────────

export const DONNA_OPENAI_GATEWAY_CONTRACT = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  envGate: 'OPENAI_API_KEY',
  purpose: [
    'intent understanding',
    'executive reasoning',
    'assumption quality',
    'explanation quality',
    'conversation quality',
    'completion guidance',
  ],
  guarantees: {
    neverMutatesAcademyData: true,   // output is text only; no write path
    neverBypassesPermissions: true,
    neverBypassesRealitySnapshot: true, // reality is passed in, stale/null dropped upstream
    neverBypassesApproval: true,
    neverFabricatesAcademyFacts: true,  // system prompt: "teacher, not authority"; null≠zero
    neverBecomesSecondBrain: true,      // advisory only; routing stays in the canonical router
  },
  /** Reality always wins: when reality is unavailable, DONNA states it rather than guessing. */
  realityAlwaysWins: true,
} as const

/** True when the canonical OpenAI gateway is configured (server-side only). */
export function isOpenAIGatewayConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

/**
 * The single canonical OpenAI entry for the DONNA conversation pipeline.
 * Delegates to the existing, contract-bound teacher — adds no new pathway.
 * Returns a safe fallback (never throws to the user) when the key is absent.
 */
export async function callDonnaOpenAIGateway(
  input: ConversationTeacherInput,
): Promise<ConversationTeacherOutput> {
  return askConversationTeacher(input)
}

export type { ConversationTeacherInput, ConversationTeacherOutput }
