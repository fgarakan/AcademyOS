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
import { buildConversationDNAInstruction } from '@/lib/donna/conversation/donnaConversationDNA'

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

// ── Pilot Mode policy (Executive Communication Policy) ──────────────────────────
//
// During the Director Pilot, OpenAI executive refinement runs BY DEFAULT on every
// ELIGIBLE DONNA response. Eligibility is the conjunction of the five rules below;
// any failure of the refinement (error / timeout / unsafe / fact-altering output)
// returns the original RealitySnapshot-grounded response. Reality always wins.

export const EXECUTIVE_COMMUNICATION_POLICY = {
  policy: 'executive_communication_policy',
  pilotMode: {
    enabled: true,
    /** During Pilot Mode, refinement runs by default on every eligible response. */
    refineByDefault: true,
  },
  /** A response is eligible for refinement only when ALL of these hold. */
  eligibility: [
    'action_is_respond',
    'response_short_enough_to_refine_safely',
    'response_is_not_a_mutation',
    'response_is_not_already_blocked_for_safety',
    'realitysnapshot_grounded_answer_already_exists',
  ],
  /** What OpenAI MAY improve — presentation only. */
  mayImprove: [
    'natural_tone',
    'executive_confidence',
    'clarity',
    'concise_wording',
    'assumption_quality',
    'next_step_guidance',
    'completion_language',
  ],
  /** What OpenAI may NEVER do. */
  mayNever: [
    'change_facts',
    'add_facts',
    'change_recommendations',
    'bypass_approval',
    'mutate_data',
    'create_memory',
    'invent_reality',
  ],
  /** On failure / timeout / unsafe / fact-changing output. */
  onFailure: 'return_original_grounded_response',
  realityAlwaysWins: true,
} as const

/**
 * The effective default: during Pilot Mode, refinement is ON for every eligible
 * response. Callers may override per-call via `applyExecutiveRefinement(..., { pilotMode })`.
 */
export const PILOT_MODE_REFINEMENT_DEFAULT_ON: boolean =
  EXECUTIVE_COMMUNICATION_POLICY.pilotMode.enabled &&
  EXECUTIVE_COMMUNICATION_POLICY.pilotMode.refineByDefault

// ── Tunables ──────────────────────────────────────────────────────────────────

/** Hard ceiling on the refinement call. On timeout → original answer. */
const DEFAULT_REFINE_TIMEOUT_MS = 4000

/**
 * Length ceiling for refinement. Raised (Sprint 3451–3480) so long, structured
 * answers — the ones that most need humanizing — become eligible. The gateway's
 * privacy guard length limit is mode-aware for `executive_refinement` (the draft
 * is DONNA's own already-grounded, already-safe output), so this no longer has to
 * stay under the old 500-char user-input cap. The fact-preservation guard
 * (number multiset + growth ratio) still protects every fact regardless of length.
 */
const MAX_REFINABLE_CHARS = 900

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
    // Conversation DNA (Sprint 3451–3480) — the canonical identity the refinement applies.
    buildConversationDNAInstruction(role),
    `Improve only: ${EXECUTIVE_COMMUNICATION_CONTRACT.mayRefine.join(', ')}.`,
    `Never: ${EXECUTIVE_COMMUNICATION_CONTRACT.mayNever.join(', ')}.`,
    `Preserve every fact, number, name, recommendation, next step, and question exactly. Reality always wins.`,
  ].join(' ')
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

/** Numbers are facts (counts, percentages, dates, ages). Extracted for the guard. */
function extractNumbers(s: string): string[] {
  return (s.match(/\d+(?:\.\d+)?/g) ?? []).slice().sort()
}

/**
 * Cheap fact-preservation guard. Refinement is presentation-only, so the rewrite
 * should be roughly the same size AND must carry the exact same numeric facts.
 * A large expansion suggests added content; any change to the set of numbers
 * suggests a changed/added fact → reject and keep the original. (Conservative:
 * protects facts without an LLM judge.)
 */
export function isRefinementFactPreserving(original: string, refined: string): boolean {
  if (!refined.trim()) return false
  const limit = Math.round(original.length * MAX_GROWTH_RATIO) + GROWTH_SLACK_CHARS
  if (refined.length > limit) return false
  // Numbers are facts — the refined text must contain exactly the same multiset.
  const a = extractNumbers(original)
  const b = extractNumbers(refined)
  if (a.length !== b.length) return false
  return a.every((n, i) => n === b[i])
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
      if (!isRefinementFactPreserving(draft, refined)) return orig('rejected')
      return { text: refined, refined: true, source: 'openai', latencyMs: Date.now() - t0 }
    })()

    return await Promise.race([call, timeout])
  } catch {
    return orig('error')
  }
}

// ── Eligibility (Executive Communication Policy) ────────────────────────────────

export type RefinementSkipReason =
  | 'not_respond_action'    // action is not `respond`
  | 'no_grounded_answer'    // no RealitySnapshot-grounded answer exists yet
  | 'safety_blocked'        // response is already blocked for safety
  | 'mutation'              // response is a mutation / approval-gated action
  | 'too_long'              // not short enough to refine safely
  | 'too_short'             // too short to refine meaningfully

export interface RefinementEligibility {
  eligible: boolean
  /** Present only when `eligible === false`. */
  reason?: RefinementSkipReason
}

/**
 * A response that is approval-gated AND points at the review queue is treated as
 * an already-safety-blocked response (the brain has parked it for director review).
 */
function isSafetyBlocked(result: DonnaMessageResult): boolean {
  if (!result.requiresApproval) return false
  if (result.nextAction?.route === '/director/review') return true
  return /\b(review queue|requires approval|not allowed|can'?t do that|blocked for safety)\b/i.test(
    result.response ?? '',
  )
}

/**
 * Executive Communication Policy eligibility. A response is eligible for OpenAI
 * refinement only when ALL of these hold:
 *   1. action is `respond`
 *   2. a RealitySnapshot-grounded answer already exists (non-empty response)
 *   3. the response is not already blocked for safety
 *   4. the response is not a mutation / approval-gated action
 *   5. the response is short enough to refine safely
 * Order matters: safety and mutation are checked before length so they always
 * report their own reason.
 */
export function isExecutiveRefinementEligible(result: DonnaMessageResult): RefinementEligibility {
  if (result.action !== 'respond') return { eligible: false, reason: 'not_respond_action' }
  const text = result.response?.trim() ?? ''
  if (!text) return { eligible: false, reason: 'no_grounded_answer' }
  if (isSafetyBlocked(result)) return { eligible: false, reason: 'safety_blocked' }
  if (result.requiresApproval === true) return { eligible: false, reason: 'mutation' }
  if (text.length > MAX_REFINABLE_CHARS) return { eligible: false, reason: 'too_long' }
  if (wordCount(text) < 3) return { eligible: false, reason: 'too_short' }
  return { eligible: true }
}

/**
 * Apply executive refinement to a finished brain result as the final presentation
 * step. During Pilot Mode this runs by default on every ELIGIBLE response
 * (see `isExecutiveRefinementEligible`). Only the conversational text of an
 * eligible `action: 'respond'` result is touched; navigation, workflows,
 * approvals, mutations, safety blocks, and every structured field pass through
 * unchanged. Fail-open: on any issue the original grounded result is returned.
 *
 * `opts.refine` is injectable for certification; production uses the real
 * fail-open `refineExecutiveResponse`.
 */
export async function applyExecutiveRefinement(
  result: DonnaMessageResult,
  role: InterpreterRole = 'director',
  opts?: {
    /** Defaults to the Pilot Mode policy (ON). Set false to disable for a call. */
    pilotMode?: boolean
    /** Injectable refiner for certification; defaults to the live fail-open refiner. */
    refine?: typeof refineExecutiveResponse
  },
): Promise<DonnaMessageResult> {
  const pilotMode = opts?.pilotMode ?? PILOT_MODE_REFINEMENT_DEFAULT_ON
  if (!pilotMode) return result
  if (!isExecutiveRefinementEligible(result).eligible) return result
  const refine = opts?.refine ?? refineExecutiveResponse
  try {
    const refinement = await refine({ draft: result.response, role })
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
