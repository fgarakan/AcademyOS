// Mega Sprint 3481–3510 — DONNA COO Presence V1
// The Executive Presence Contract — a CONVERGENCE layer, not a new intelligence layer.
//
// In the ONE DONNA pipeline:
//   RealitySnapshot   → truth
//   processDonnaMessage → reasoning
//   Completion Contract → behavior (never answer and leave)
//   Conversation DNA    → personality
//   Executive Presence  → THIS: guarantees the COO intelligence that ALREADY EXISTS
//                          is surfaced on every director turn, not gated behind magic phrases
//   Executive Communication Layer → presentation (polishes the voice)
//
// It runs by DEFAULT, before the Executive Communication Layer, on every director
// answer. It does NOT compute new facts, NOT re-rank, NOT build a second memory or
// reasoning engine. It consumes the EXISTING operating-partner intelligence
// (`buildAcademyAttentionReport`, which feeds the same ranked signals the COO
// engines use) plus the conversation state already on the request, and surfaces
// four COO elements when they are missing AND relevant:
//   • Executive Opinion   — "my read" on what matters most (from the top ranked signal)
//   • Executive Tradeoff  — the cost of letting it wait (from the signal's whyItMatters)
//   • Executive Memory    — continuity callback when the concern was raised earlier
//   • Proactive Follow-up — volunteering a pressing item the director didn't ask about
//
// Invariants (all enforced here):
//   - Additive only. Never changes facts, numbers, recommendations, `action`,
//     `requiresApproval`, `nextAction`, navigation, or any structured field.
//   - Relevance-gated. On a narrow, unrelated question it surfaces nothing (no
//     non-sequiturs) rather than forcing COO chatter.
//   - Idempotent. Predicates prevent double-application.
//   - Fail-safe. Any error → original result unchanged.
//   - RealitySnapshot always wins — every surfaced line is drawn from existing
//     reality fields, never invented.
//
// Pure TypeScript — no DB, no network, no React, no mutations.

import type { DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import {
  buildAcademyAttentionReport,
  type AcademyAttentionItem,
} from '@/lib/donna/proactive/academyAttentionEngine'
import type { ConversationNavigatorState } from '@/lib/donna/conversation/donnaConversationNavigator'

// ── Context the contract consumes (all already on the live request) ──────────────

export interface ExecutivePresenceContext {
  /** The canonical reality bundle that feeds all operating intelligence. */
  directorCtx?: DirectorDonnaContext | null
  /** Navigator state from the prior turn (for continuity/memory). */
  navigatorState?: ConversationNavigatorState | null
  /** Recent conversation turns (for recurring-concern continuity). */
  conversationHistory?: Array<{ role: 'user' | 'donna'; content: string }> | null
  /** The director's current message (for relevance gating). */
  userMessage?: string
}

// ── Predicates (also used by the certification) ─────────────────────────────────

const OPINION_RE =
  /\b(my read|my take|here'?s my (read|take)|i'?d (prioriti|focus|start|recommend|advise)|the (one|single|biggest) thing|bottom line|if you do one thing|the priority right now)\b/i

const TRADEOFF_RE =
  /\b(tradeoff|trade-off|if (you|it|we) (wait|defer|ignore|leave|don'?t)|the (risk|cost) (is|of)|otherwise|at stake|opportunity cost|left unaddressed)\b/i

/** True when the answer already carries an executive opinion / stance. */
export function hasExecutiveOpinion(text: string): boolean {
  return OPINION_RE.test(text)
}

/** True when the answer already explains a tradeoff / cost of inaction. */
export function hasTradeoff(text: string): boolean {
  return TRADEOFF_RE.test(text)
}

// ── Small text helpers ──────────────────────────────────────────────────────────

function stripTrailingPunct(s: string): string {
  return s.trim().replace(/[.!?]+$/, '').trim()
}

function ensureSentence(s: string): string {
  const t = s.trim()
  if (!t) return ''
  return /[.!?]$/.test(t) ? t : `${t}.`
}

function stripMarkdown(s: string): string {
  return s.replace(/\*\*/g, '').replace(/__/g, '').replace(/[#`>]/g, '').trim()
}

function keywords(label: string): string[] {
  return label.toLowerCase().split(/[^a-z]+/).filter(w => w.length > 4)
}

/** Does the answer already reference the top attention item? */
function mentionsTopItem(text: string, top: AcademyAttentionItem): boolean {
  const hay = text.toLowerCase()
  if (hay.includes(top.categoryLabel.toLowerCase())) return true
  return keywords(top.label).some(w => hay.includes(w))
}

// ── Relevance gate (avoids non-sequiturs on narrow, unrelated questions) ─────────

const BROAD_OPERATIONAL_RE =
  /\b(what should i|what do i|what'?s next|whats next|priorit|focus|urgent|biggest|riskiest|risk|worry|worried|wrong|needs? attention|who needs|how (are|is) (we|things|the academy)|how'?s the academy|status|state of|today|this (week|morning)|catch me up|anything (i|else)|on fire|noticing|what changed|what'?s new)\b/i

/**
 * Executive presence is surfaced only when it is RELEVANT:
 *   - the turn is a broad operational question, OR
 *   - the answer/question already relates to the top attention item.
 * Otherwise the contract is a no-op (no forced COO chatter).
 */
export function isExecutivePresenceRelevant(
  userMessage: string,
  response: string,
  top: AcademyAttentionItem,
): boolean {
  if (BROAD_OPERATIONAL_RE.test(userMessage)) return true
  const hay = `${userMessage} ${response}`.toLowerCase()
  if (hay.includes(top.categoryLabel.toLowerCase())) return true
  return keywords(top.label).some(w => hay.includes(w))
}

// ── Eligibility (mirror the Executive Communication Layer's safety posture) ──────

function isSafetyBlocked(result: DonnaMessageResult): boolean {
  if (result.nextAction?.route === '/director/review' && result.requiresApproval) return true
  return /\b(review queue|requires approval|not allowed|can'?t do that|blocked for safety)\b/i.test(
    result.response ?? '',
  )
}

/** A response is eligible for presence enrichment when it is a plain grounded answer. */
export function isExecutivePresenceEligible(result: DonnaMessageResult): boolean {
  if (result.action !== 'respond') return false
  if (!(result.response ?? '').trim()) return false
  if (result.requiresApproval === true) return false
  if (isSafetyBlocked(result)) return false
  return true
}

// ── Memory / continuity (consumes existing conversation state — no new store) ────

function buildMemoryCallback(
  ctx: ExecutivePresenceContext,
  responseText: string,
  top: AcademyAttentionItem,
): string | null {
  const history = ctx.conversationHistory ?? []
  const priorUserTurns = history.filter(h => h.role === 'user')
  if (priorUserTurns.length === 0) return null

  // Continuity is only worth surfacing when the current top concern was already
  // raised earlier in THIS conversation and the answer doesn't already say so.
  const kws = keywords(top.label)
  const raisedEarlier = priorUserTurns.some(t => {
    const lower = t.content.toLowerCase()
    return kws.some(w => lower.includes(w)) || lower.includes(top.categoryLabel.toLowerCase())
  })
  if (!raisedEarlier) return null
  if (/\b(earlier|before|last time|again|still|as i mentioned|you mentioned|we (talked|discussed))\b/i.test(responseText)) {
    return null
  }
  return 'You raised this earlier — worth closing the loop now.'
}

// ── The contract ────────────────────────────────────────────────────────────────

/**
 * Surface the existing COO intelligence on a finished, grounded answer. Runs by
 * default before the Executive Communication Layer. Additive, relevance-gated,
 * idempotent, and fail-safe — returns the original result whenever enrichment
 * cannot safely or relevantly apply.
 */
export function enforceExecutivePresence(
  result: DonnaMessageResult,
  ctx: ExecutivePresenceContext,
): DonnaMessageResult {
  try {
    if (!isExecutivePresenceEligible(result)) return result
    const directorCtx = ctx.directorCtx
    if (!directorCtx) return result

    const report = buildAcademyAttentionReport(directorCtx)
    if (report.isEmpty || !report.topAction) return result
    const top = report.topAction

    const base = result.response.trim()
    const userMessage = ctx.userMessage ?? ''
    if (!isExecutivePresenceRelevant(userMessage, base, top)) return result

    const additions: string[] = []

    // 1) Executive Opinion — "my read" on what matters most.
    let addedOpinion = false
    if (!hasExecutiveOpinion(base)) {
      additions.push(ensureSentence(`My read: the priority right now is ${stripTrailingPunct(top.label)}`))
      addedOpinion = true
    }

    // 2) Executive Tradeoff — the cost of letting it wait (from existing reality).
    if (!hasTradeoff(base) && top.whyItMatters?.trim()) {
      additions.push(ensureSentence(`The tradeoff if it waits: ${stripTrailingPunct(top.whyItMatters)}`))
    }

    // 3) Proactive Follow-up — only when we didn't already lead with the priority,
    //    it's pressing, and the answer never mentioned it (volunteer, don't repeat).
    if (
      !addedOpinion &&
      (top.severity === 'critical' || top.severity === 'high') &&
      !mentionsTopItem(base, top)
    ) {
      additions.push(ensureSentence(`Before anything else, this needs you: ${stripTrailingPunct(top.label)}`))
    }

    // 4) Executive Memory — continuity callback when the concern recurs.
    const memory = buildMemoryCallback(ctx, base, top)

    if (additions.length === 0 && !memory) return result

    const prefix = memory ? `${ensureSentence(memory)} ` : ''
    const suffix = additions.length ? ` ${additions.join(' ')}` : ''
    const enriched = `${prefix}${base}${suffix}`.trim()
    if (enriched === base) return result

    // Additive only — every structured field (action, recommendation, approval,
    // navigation, nextAction, confidence) passes through untouched.
    return {
      ...result,
      response: enriched,
      spokenResponse: stripMarkdown(enriched),
    }
  } catch {
    return result
  }
}
