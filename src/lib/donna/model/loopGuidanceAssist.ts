// Sprint 4364 — DONNA Model-Assisted Loop Guidance (runtime activation helper).
//
// The single, flag-gated seam that lets a server action swap the general executive
// refinement for the firewalled, loop-specific model-assist on loop-guidance questions.
// Returns null when model-assist does not apply, so the caller uses its existing path.
//
// SWAP, NOT ADD: the caller runs EITHER this helper OR applyExecutiveRefinement for a
// given turn — never both — so there is no duplicate OpenAI call.
//
// Off by default. When the flag is disabled or the message is not a loop-guidance
// question, this returns null immediately (no model call, no work). Deterministic
// fallback is always the passed-in result's grounded answer.
//
// Design rules:
//   - No DB, no mutation, no direct provider call. Routes only through runModelAssist.
//   - The model rephrases prose only; structured/safety fields stay deterministic.

import type { DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
import type { DonnaResponseRole } from '@/lib/donna/brain/donnaRoleResponsePolicy'
import type { LivePageState } from '@/lib/donna/operating/livePageState'
import {
  classifyLoopQuestion,
  getLoopKnowledgeForRoute,
} from '@/lib/donna/loopKnowledgeResolver'
import { buildModelSafeContext } from '@/lib/donna/model/contextFirewall'
import { runModelAssist } from '@/lib/donna/model/modelAdapter'
import { isModelAssistEnabled } from '@/lib/featureFlags/featureFlags'
import type { ModelProvider } from '@/lib/donna/model/modelTypes'

export interface LoopGuidanceAssistInput {
  userMessage: string
  role: DonnaResponseRole
  route: string
  livePageState?: LivePageState | null
}

export interface LoopGuidanceAssistOptions {
  /** Inject a provider (tests only). Default selection is used otherwise. */
  provider?: ModelProvider
}

/**
 * Applicable only when model-assist is enabled AND the message is a loop-guidance
 * question on a canonical-loop route. Pure gate — no model call, no env read beyond
 * the flag check.
 */
export function isLoopGuidanceAssistApplicable(input: LoopGuidanceAssistInput): boolean {
  if (!isModelAssistEnabled()) return false
  if (classifyLoopQuestion(input.userMessage) === null) return false
  if (getLoopKnowledgeForRoute(input.route) === null) return false
  return true
}

/**
 * Rephrase a loop-guidance answer via the governed model adapter — or return null so
 * the caller keeps its existing (executive-refinement) path.
 *
 * `deterministicResult` is the brain's grounded answer; its `response` is the fallback
 * the model rephrases. Every structured/safety field on the returned result is copied
 * from `deterministicResult` — the model changes only the prose.
 */
export async function maybeModelAssistLoopGuidance(
  input: LoopGuidanceAssistInput,
  deterministicResult: DonnaMessageResult,
  opts: LoopGuidanceAssistOptions = {},
): Promise<DonnaMessageResult | null> {
  if (!isLoopGuidanceAssistApplicable(input)) return null

  const loop = getLoopKnowledgeForRoute(input.route)
  if (!loop) return null

  const context = buildModelSafeContext({
    role: input.role,
    route: input.route,
    userQuestion: input.userMessage,
    liveState: input.livePageState ?? null,
  })

  const assisted = await runModelAssist(
    {
      context,
      deterministicFallback: {
        message: deterministicResult.response,
        loopId: loop.id,
        requiresApproval: deterministicResult.requiresApproval,
        safeNextActions: loop.safeNextActions.slice(0, 5),
        visibilityWarning: loop.parentPlayerVisibilityRules.note,
      },
    },
    { provider: opts.provider },
  )

  // Prose-only swap: replace the text, preserve every other field of the grounded
  // result (action, requiresApproval, navigateTo, pageIntelligence, etc.).
  return {
    ...deterministicResult,
    response: assisted.message,
    spokenResponse: assisted.message,
  }
}
