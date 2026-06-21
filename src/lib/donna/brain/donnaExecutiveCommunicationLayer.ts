// Mega Sprint 3361–3390 — ONE DONNA Executive Experience Convergence V1
// Part 3 — The canonical Executive Communication (response refinement) layer.
//
// This is the FINAL presentation layer only. It sits AFTER the canonical OpenAI
// gateway in the one pipeline:
//
//   RealitySnapshot → Canonical Router → processDonnaMessage
//     → Canonical OpenAI Gateway → Executive Communication Layer → Response
//
// It does NOT replace the pipeline, NOT add a second OpenAI pathway, and NOT
// bypass the canonical gateway. Its ONLY contact with OpenAI is the single
// `callDonnaOpenAIGateway` (gpt-4o-mini), invoked with the additive
// `executive_refinement` mode. Reality always wins.
//
// It MAY improve: natural conversation, executive tone, concise communication,
// assumptions, explanations, follow-up quality, completion guidance.
// It may NEVER: change academy facts, invent reality, mutate academy state,
// approve actions, bypass permissions, create memory, or change recommendations
// unsupported by RealitySnapshot.
//
// Fail-open contract: if refinement is unavailable, fails, times out, is
// privacy-blocked, or looks fact-altering, the ORIGINAL RealitySnapshot-grounded
// response is returned immediately. The director never notices an outage.
//
// Server-side only (the gateway needs OPENAI_API_KEY). Pure otherwise — no DB,
// no React, no mutations.

import {
  callDonnaOpenAIGateway,
  isOpenAIGatewayConfigured,
} from '@/lib/donna/brain/donnaOpenAIGateway'
import type { InterpreterRole } from '@/lib/donna/conversation/donnaIntentInterpreter'
import type { DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'

// ── Contract (Part 3) ────────────────────────────────────────────────────────────

export const EXECUTIVE_COMMUNICATION_CONTRACT = {
  layer: 'donnaExecutiveCommunicationLayer',
  position: 'final_presentation_layer',
  usesCanonicalGatewayOnly: true,   // only `callDonnaOpenAIGateway`; no new OpenAI client
  failOpen: true,                    // any failure → original grounded answer, immediately
  /** What OpenAI MAY refine here — presentation only. */
  mayRefine: [
    'natural_conversation',
    'executive_tone',
    'concise_communication',
    'assumptions',
    'explanations',
    'follow_up_quality',
    'completion_guidance',
  ],
  /** What this layer may NEVER do. Reality always wins. */
  mayNever: [
    'change_academy_facts',
    'invent_reality',
    'mutate_academy_state',
    'approve_actions',
    'bypass_permissions',
    'create_memory',
    'change_recommendations',
  ],
  realityAlwaysWins: true,
} as const

// ── Tunables ──────────────────────────────────────────────────────────────────

/** Hard ceiling on the refinement call. On timeout → original answer. */
const DEFAULT_REFINE_TIMEOUT_MS = 4000

/** Above this length the gateway privacy guard would block anyway; skip the call. */
const MAX_REFINABLE_CHARS = 480

/** Refined text longer than original × this (+ slack) is treated as fact-altering. */
const MAX_GROWTH_RATIO = 1.6
const GROWTH_SLACK_CHARS = 80

// ── Result shape ──────────────────────────────────────────────────────────────

export type ExecutiveRefinementSource =
  | 'openai'        // refined by the gateway
  | 'unchanged'     // gateway returned text identical to the draft
  | 'not_configured'// no OPENAI_API_KEY — fail-open
  | 'skipped'       // draft empty/too long/too short to refine — fail-open
  | 'fallback'      // gateway fell back (privacy/key/error) — fail-open
  | 'timeout'       // exceeded the timeout — fail-open
  | 'rejected'      // refined output looked fact-altering — fail-open
  | 'error'         // unexpected error — fail-open

export interface ExecutiveRefinementResult {
  /** The text to present — refined when source === 'openai', else the original draft. */
  text: string
  /** true only when OpenAI actually improved the presentation. */
  refined: boolean
  source: ExecutiveRefinementSource
  latencyMs: number
}

/**
 * The executive-tone directive, surfaced for transparency + certification.
 * (The live system prompt lives in the canonical gateway's `executive_refinement`
 * mode — this mirrors its intent; it never opens a separate pathway.)
 */
export function buildExecutiveRefinementInstruction(role: InterpreterRole): string {
  return [
    `Refine DONNA's draft for ${role} as a calm, confident, concise COO.`,
    `Improve only: ${EXECUTIVE_COMMUNICATION_CONTRACT.mayRefine.join(', ')}.`,
    `Never: ${EXECUTIVE_COMMUNICATION_CONTRACT.mayNever.join(', ')}.`,
    `Preserve every fact, number, name, recommendation, next step, and question exactly. Reality always wins.`,
  ].join(' ')
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Cheap fact-preservation guard. Refinement is presentation-only, so the rewrite
 * should be roughly the same size. A large expansion suggests added content →
 * reject and keep the original. (Conservative: protects facts without an LLM judge.)
 */
function looksFactPreserving(original: string, refined: string): boolean {
  if (!refined.trim()) return false
  const limit = Math.round(original.length * MAX_GROWTH_RATIO) + GROWTH_SLACK_CHARS
  return refined.length <= limit
}

/** Strip light markdown so the refined text is TTS-safe for spokenResponse. */
function toSpoken(s: string): string {
  return s
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/[#`>]/g, '')
    .replace(/\s+\n/g, '\n')
    .trim()
}

// ── The refinement call (fail-open, timeout-bounded) ────────────────────────────

/**
 * Refine an already-grounded answer for executive communication.
 * ALWAYS returns text — the original draft whenever refinement cannot safely apply.
 */
export async function refineExecutiveResponse(params: {
  draft: string
  role: InterpreterRole
  timeoutMs?: number
}): Promise<ExecutiveRefinementResult> {
  const draft = params.draft ?? ''
  const role = params.role
  const timeoutMs = params.timeoutMs ?? DEFAULT_REFINE_TIMEOUT_MS
  const t0 = Date.now()
  const orig = (source: ExecutiveRefinementSource): ExecutiveRefinementResult => ({
    text: draft,
    refined: false,
    source,
    latencyMs: Date.now() - t0,
  })

  // Nothing worth a network round-trip → fail-open immediately.
  if (!isOpenAIGatewayConfigured()) return orig('not_configured')
  if (!draft.trim() || draft.length > MAX_REFINABLE_CHARS || wordCount(draft) < 3) {
    return orig('skipped')
  }

  try {
    const timeout = new Promise<ExecutiveRefinementResult>((resolve) =>
      setTimeout(() => resolve(orig('timeout')), timeoutMs),
    )
    const call = (async (): Promise<ExecutiveRefinementResult> => {
      const out = await callDonnaOpenAIGateway({
        mode: 'executive_refinement',
        userText: draft,
        role,
        currentConfidence: 0, // open the gateway's "only when needed" gate for a refine pass
        maxWords: 90,
      })
      // Reality wins: anything other than a live OpenAI rewrite → keep the original.
      if (out.source !== 'openai') return orig('fallback')
      const refined = out.result.trim()
      if (!refined || refined === draft.trim()) return orig('unchanged')
      if (!looksFactPreserving(draft, refined)) return orig('rejected')
      return { text: refined, refined: true, source: 'openai', latencyMs: Date.now() - t0 }
    })()

    return await Promise.race([call, timeout])
  } catch {
    return orig('error')
  }
}

/**
 * Apply executive refinement to a finished brain result as the final presentation
 * step. Only the conversational text of an `action: 'respond'` result is touched;
 * navigation, workflows, approvals, and every structured field pass through
 * unchanged. Fail-open: on any issue the result is returned exactly as produced.
 */
export async function applyExecutiveRefinement(
  result: DonnaMessageResult,
  role: InterpreterRole = 'director',
): Promise<DonnaMessageResult> {
  if (result.action !== 'respond' || !result.response?.trim()) return result
  try {
    const refinement = await refineExecutiveResponse({ draft: result.response, role })
    if (!refinement.refined) return result
    return {
      ...result,
      response: refinement.text,
      spokenResponse: toSpoken(refinement.text),
    }
  } catch {
    return result
  }
}
