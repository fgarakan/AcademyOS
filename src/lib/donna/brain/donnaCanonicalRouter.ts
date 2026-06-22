// Mega Sprint 3271–3300 — ONE DONNA Operating System Convergence V1
// Part 1/3/4/5 — The single canonical conversation routing decision.
//
// This is NOT a new router and NOT new intelligence. It CONSOLIDATES the routing
// ladder that previously lived only inside DonnaVoiceReadyShell (/director/donna)
// into one shared function so EVERY surface — floating DONNA, sidebar, voice,
// the /director/donna shell — reaches the same engines in the same order.
//
// Reality-first ordering (Part 5):
//   RealitySnapshot/live ctx → page → safety → best existing engine → defer-to-brain
//   (the brain runs guided completion, goal completion, strategic AI, and the
//    OpenAI gateway only when deterministic intelligence is insufficient).
//
// Pure: no DB, no OpenAI call, no React, no mutations. Returns a decision; the
// caller renders it or defers to the existing brain (processDonnaMessage).

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'
import {
  detectReviewQueueQuestion,
  buildReviewQueueAnswer,
} from '@/lib/donna/donnaReviewQueueAnswer'
import {
  detectRosterAttentionQuestion,
  tryAnswerRosterAttentionQuestion,
} from '@/lib/donna/directorPlayersDonnaIntelligence'
import {
  detectFocusTodayQuestion,
  buildFocusTodayAnswer,
  buildProactiveNoticeAnswer,
  detectVagueExecutiveInput,
  buildExecutiveAssumptionAnswer,
} from '@/lib/donna/proactive/focusTodayAnswerEngine'
import { tryDirectorClarificationOrBlock } from '@/lib/donna/directorClarificationEngine'
import {
  isOperatingSessionResume,
  resumeExecutivePartnership,
} from '@/lib/donna/conversation/donnaExecutivePartnership'
import { detectGuidedCompletionIntent } from '@/lib/donna/guidedCompletion/guidedCompletionRegistry'
import {
  detectDailyBriefIntent,
  buildDailyOperatingBrief,
  detectOperatingException,
  buildExceptionResponse,
  detectDirectMutationRequest,
  buildApprovalRequiredResponse,
} from '@/lib/donna/brain/donnaOperatingDay'

// ── Result contract ───────────────────────────────────────────────────────────

export type DonnaRouterStage =
  | 'safety_block'        // unsafe/mutation request — routed to review, never executed
  | 'operating_session'   // greeting / "I'm back" / "ready" → resume the executive partnership
  | 'daily_brief'         // morning / overnight / "what changed" → proactive COO brief
  | 'exception'           // operating exception (coach/player absence, parent concern, …)
  | 'review'              // review-queue answer
  | 'players'             // player/roster attention answer
  | 'focus_today'         // "what should I do today / what matters most"
  | 'proactive'           // "what's blocking / what are you noticing"
  | 'assumption'          // vague-but-safe → executive COO assumption
  | 'guided_completion'   // "take me to completion / walk me through" → brain runs the loop
  | 'clarify'             // one focused clarifying question (only when required)
  | 'defer_to_brain'      // nothing matched → existing brain (may use OpenAI gateway)

export interface DonnaRouterResult {
  /** true when a deterministic engine produced an answer here */
  matched: boolean
  stage: DonnaRouterStage
  /** stable id of the engine that handled it (for certification + telemetry) */
  engineId: string
  /** the answer to render, or null when deferring to the brain */
  answer: DonnaSafeReadAnswer | null
  /** caller should invoke the OpenAI gateway (via the brain) only when true */
  needsOpenAI: boolean
  /** true when this path could create a draft requiring director approval */
  requiresApproval: boolean
  /** true when the answer is grounded in live academy reality (not demo/insufficient) */
  realityGrounded: boolean
}

// ── Local intent helpers (explicit director phrasings the engines don't cover) ──

function isFocusTodayIntent(t: string): boolean {
  return (
    detectFocusTodayQuestion(t) ||
    /what should (i|we|brian) do( today)?/.test(t) ||
    /what should i focus on( first| now)?|where should i (start|begin)/.test(t) ||
    /what matters( most)?|what'?s most important/.test(t)
  )
}

function isProactiveIntent(t: string): boolean {
  return /what is blocking|what'?s blocking|blocking us|what are you noticing|what'?s going on/.test(t)
}

function isCompletionIntent(t: string): boolean {
  return (
    detectGuidedCompletionIntent(t) !== null ||
    /take me to completion|walk me through|finish this|help me finish|^done\b|^done[.!]?$/.test(t)
  )
}

function groundedFrom(answer: DonnaSafeReadAnswer, ctx: DirectorDonnaContext): boolean {
  // Reality-grounded when the academy context is live and DONNA is not on insufficient data.
  return ctx.isLive && answer.confidence !== 'insufficient'
}

// ── The one canonical routing decision ──────────────────────────────────────────

export function routeDonnaConversation(params: {
  text: string
  directorCtx: DirectorDonnaContext | null
  route?: string
}): DonnaRouterResult {
  const text = params.text.trim()
  const t = text.toLowerCase().trim()
  const ctx = params.directorCtx

  const defer = (needsOpenAI: boolean, stage: DonnaRouterStage = 'defer_to_brain'): DonnaRouterResult => ({
    matched: false,
    stage,
    engineId: stage === 'guided_completion' ? 'guidedCompletion(brain)' : 'processDonnaMessage',
    answer: null,
    needsOpenAI,
    requiresApproval: false,
    realityGrounded: false,
  })

  // ── Step 1 — Safety / permission first (Part: permission validation) ──────────
  // Direct-mutation guardrail (Sprint 3301–3330) — imperative approval-bypass requests
  // are blocked and routed to review, never executed. Drafting is allowed downstream.
  if (detectDirectMutationRequest(text)) {
    return {
      matched: true,
      stage: 'safety_block',
      engineId: 'donnaOperatingDay.approvalRequired',
      answer: buildApprovalRequiredResponse(text),
      needsOpenAI: false,
      requiresApproval: true,
      realityGrounded: false,
    }
  }

  // Blocked = unsafe or direct-mutation request. Always intercepted, never executed.
  const guard = tryDirectorClarificationOrBlock(text)
  if (guard && guard.actionId.startsWith('blocked')) {
    return {
      matched: true,
      stage: 'safety_block',
      engineId: 'directorClarificationEngine.blocked',
      answer: guard,
      needsOpenAI: false,
      requiresApproval: true,
      realityGrounded: false,
    }
  }

  // Without live context the deterministic answer engines cannot ground a reply.
  // Defer to the brain (which carries its own demo/insufficient honesty).
  if (!ctx) return defer(true)

  // ── Step 1.5 — Operating Session resume (Mega Sprint 3511–3540) ────────────────
  // A greeting / "I'm back" / "ready" / "let's begin" is never an ambiguous request —
  // it resumes the executive partnership. Highest-priority reality-grounded intent,
  // so the director never gets a clarification menu when they simply arrive. The
  // server path resumes without client continuity (restored context is gathered on
  // the client and rendered there); the partnership still opens with situation
  // awareness + a recommended first action + a guide-to-completion offer.
  if (isOperatingSessionResume(text)) {
    const answer = resumeExecutivePartnership(ctx)
    return {
      matched: true,
      stage: 'operating_session',
      engineId: 'donnaExecutivePartnership',
      answer,
      needsOpenAI: false,
      requiresApproval: false,
      realityGrounded: groundedFrom(answer, ctx),
    }
  }

  // ── Step 2 — Operating layer (Sprint 3301–3330): COO brief + exceptions ───────
  // Reuses existing engines. Reality-grounded, recommend/draft/route only.

  // Proactive COO daily brief — morning, overnight, "what changed", end-of-day.
  if (detectDailyBriefIntent(t)) {
    const answer = buildDailyOperatingBrief(ctx)
    return { matched: true, stage: 'daily_brief', engineId: 'donnaOperatingDay.dailyBrief', answer, needsOpenAI: false, requiresApproval: false, realityGrounded: groundedFrom(answer, ctx) }
  }

  // Operating exceptions — coach/player absence, parent concern, missed wrap-up, etc.
  const exceptionType = detectOperatingException(t)
  if (exceptionType) {
    const answer = buildExceptionResponse(exceptionType, ctx)
    // Parent/level/curriculum/session exceptions imply an approval-gated draft downstream.
    const requiresApproval = exceptionType === 'parent_concern' || exceptionType === 'level_up_blocker' || exceptionType === 'curriculum_gap'
    return { matched: true, stage: 'exception', engineId: `donnaOperatingDay.${exceptionType}`, answer, needsOpenAI: false, requiresApproval, realityGrounded: groundedFrom(answer, ctx) }
  }

  // ── Step 3 — Best existing intelligence engine (reality-first order) ──────────

  // Completion intent goes to the brain's guided/goal completion engine (single
  // completion engine, shared by all surfaces). Checked before assumption because
  // vague-input detection also matches "take me to completion".
  if (isCompletionIntent(t)) return defer(false, 'guided_completion')

  if (detectReviewQueueQuestion(t)) {
    const answer = buildReviewQueueAnswer(ctx)
    return { matched: true, stage: 'review', engineId: 'donnaReviewQueueAnswer', answer, needsOpenAI: false, requiresApproval: false, realityGrounded: groundedFrom(answer, ctx) }
  }

  if (detectRosterAttentionQuestion(t) || /who needs attention/.test(t)) {
    const answer = tryAnswerRosterAttentionQuestion(text, ctx)
    if (answer) return { matched: true, stage: 'players', engineId: 'directorPlayersDonnaIntelligence', answer, needsOpenAI: false, requiresApproval: false, realityGrounded: groundedFrom(answer, ctx) }
  }

  if (isFocusTodayIntent(t)) {
    const answer = buildFocusTodayAnswer(ctx)
    return { matched: true, stage: 'focus_today', engineId: 'focusTodayAnswerEngine', answer, needsOpenAI: false, requiresApproval: false, realityGrounded: groundedFrom(answer, ctx) }
  }

  if (isProactiveIntent(t)) {
    const answer = buildProactiveNoticeAnswer(ctx)
    return { matched: true, stage: 'proactive', engineId: 'focusTodayAnswerEngine.proactive', answer, needsOpenAI: false, requiresApproval: false, realityGrounded: groundedFrom(answer, ctx) }
  }

  // ── Step 3 — Executive assumption (Part 4): vague but safe → assume like a COO ─
  if (detectVagueExecutiveInput(t)) {
    const answer = buildExecutiveAssumptionAnswer(ctx, text)
    return { matched: true, stage: 'assumption', engineId: 'buildExecutiveAssumptionAnswer', answer, needsOpenAI: false, requiresApproval: false, realityGrounded: groundedFrom(answer, ctx) }
  }

  // ── Step 4 — Clarify only when required for data integrity (not generic) ──────
  if (guard && (guard.actionId.startsWith('clarify') || guard.actionId.endsWith('clarify'))) {
    return { matched: true, stage: 'clarify', engineId: 'directorClarificationEngine.clarify', answer: guard, needsOpenAI: false, requiresApproval: false, realityGrounded: false }
  }

  // ── Step 5 — Defer to the one brain (which may invoke the OpenAI gateway) ──────
  return defer(true)
}

// ── Surface-agnostic guarantee (used by the certification) ──────────────────────
// The canonical contract every entry point inherits by calling routeDonnaConversation.

export const ONE_DONNA_CONTRACT = {
  realityFirst: true,
  singleBrain: 'processDonnaMessage',
  singleOpenAIGateway: 'donnaOpenAIGateway',
  neverMutates: true,
  approvalGatedDrafts: true,
} as const
