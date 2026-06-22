// Mega Sprint 3511–3540 — Director Operating Session V1 (Executive Partnership layer)
//
// THE CANONICAL EXECUTIVE PARTNERSHIP LAYER.
//
// This is NOT a greeting feature and NOT a new lifecycle. It is the one place where
// every entry point — floating widget, the /director/donna page, a typed
// "good morning", "I'm back" after lunch, or a return tomorrow — converges to
// resume the SAME executive working relationship.
//
// The Operating Session is simply the mechanism by which the partnership resumes:
//
//   Executive Partnership
//     ↓ Operating Session Started        (existing detectors — see below)
//     ↓ Restore Working Relationship     (this module — reuses the 3 stores)
//     ↓ Executive Situation Awareness    (reuses buildAcademyAttentionReport)
//     ↓ Recommended First Action         (reuses the ranked top attention item)
//     ↓ Guide To Completion              (reuses the Completion Contract downstream)
//     ↓ Continuous Partnership           (reuses Executive Presence, every turn)
//     ↓ Operating Session Closed         (existing saveLastSession on panel close)
//
// REUSE, NEVER REINVENT — this module reads the existing lifecycle stores
// (donnaDailyGreeting, donnaLastSessionStore, donnaChatSessionMemory) and the
// existing reality-grounded intelligence (RealitySnapshot → buildAcademyAttentionReport).
// It introduces no new session lifecycle, no duplicated state, no second greeting system.
//
// OPERATING PRINCIPLE (permanent AcademyOS law):
//   "DONNA maintains continuous executive partnerships, not isolated conversations."
//
// OPERATING LAW #2 (companion to Law #1 "never answer and leave"):
//   "Every interaction resumes an executive operating relationship, never a chat session."
//
// Pure where it counts: resumeExecutivePartnership() takes a context object and is
// deterministic (no DB, no LLM, no mutations). buildRestoredPartnershipContext() is
// the only window-aware helper and is SSR-guarded — the server router calls the
// composer WITHOUT it, so the partnership resume works on every surface.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'
import { buildAcademyAttentionReport } from '@/lib/donna/proactive/academyAttentionEngine'
// Existing lifecycle stores — reused, never duplicated.
import { getDailyGreetingState } from '@/lib/donna/donnaDailyGreeting'
import { loadLastSession } from '@/lib/donna/donnaLastSessionStore'
import {
  getConversationContextSummary,
  getPendingAction,
  hasPendingNavOffer,
  getPendingDrillSlotFill,
  getLastCurriculumDraftAttempt,
} from '@/lib/donna/donnaChatSessionMemory'

// ── Operating Session resume trigger ────────────────────────────────────────────
// A greeting is one possible trigger. So is "I'm back", "ready", "let's begin",
// "welcome back". None of these are ambiguous requests — every one resumes the
// partnership. Tightly anchored to avoid colliding with real intents
// (e.g. level_movement's "ready to move up", "start a session").

function normalizeOpening(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[!.?,]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Whole-utterance matches — the message IS the opening (no other payload).
const OPENING_EXACT: ReadonlySet<string> = new Set([
  'morning', 'afternoon', 'evening',
  'hello', 'hi', 'hey', 'yo', 'hiya', 'howdy', 'hello there', 'hi there',
  'ready', 'begin', 'start',
  "i'm back", 'im back', 'i am back', 'welcome back', 'back again', "we're back", 'were back', 'back',
  "let's begin", 'lets begin', "let's go", 'lets go', "let's start", 'lets start',
  "i'm ready", 'im ready', 'ready to start', 'ready to begin',
  'start my day', 'begin my day', "let's get started", 'lets get started',
])

// Anchored matches — opening phrases that may carry a trailing name/clause
// ("good morning donna", "hey donna, what's first").
const OPENING_ANCHORED: readonly RegExp[] = [
  /^good (morning|afternoon|evening)\b/,
  /^(hey|hi|hello|yo|hiya|howdy)\b[\s,]+donna\b/,
  /^(hey|hi|hello)\s+donna\b/,
  /^good (morning|afternoon|evening)\s+donna\b/,
  /^i'?m back\b/,
  /^welcome back\b/,
  /^let'?s (begin|start|go|get started)\b/,
]

export function isOperatingSessionResume(text: string): boolean {
  const n = normalizeOpening(text)
  if (!n) return false
  if (OPENING_EXACT.has(n)) return true
  return OPENING_ANCHORED.some(r => r.test(n))
}

// ── Restored partnership context ─────────────────────────────────────────────────
// The continuity DONNA restores on resume — prior context, unresolved decisions,
// changes while away. Gathered from the EXISTING stores; no new state.

export interface RestoredPartnershipContext {
  /** First DONNA open of the calendar day (donnaDailyGreeting). */
  isFirstOpenToday: boolean
  /** Where the director last was (donnaLastSessionStore). */
  lastPageLabel: string | null
  /** An open decision from the prior session (donnaChatSessionMemory). */
  unresolvedDecision: string | null
  /** The last topic discussed (donnaChatSessionMemory). */
  lastTopic: string | null
  /** How many turns the prior in-memory session held. */
  priorTurnCount: number
  /** Director first name, for a natural salutation. */
  firstName: string | null
}

function deriveUnresolvedDecision(): string | null {
  const pending = getPendingAction()
  if (pending) return `a pending ${pending.actionType.replace(/_/g, ' ')} decision`
  if (hasPendingNavOffer()) return 'a step we started but did not finish'
  const slot = getPendingDrillSlotFill()
  if (slot) return `an unfinished ${slot.kind.replace(/_/g, ' ').replace(/ draft$/, '')} draft`
  const draft = getLastCurriculumDraftAttempt()
  if (draft) return `a ${draft.contentLabel} draft for ${draft.levelName}`
  return null
}

/**
 * Gather the restored partnership continuity from the existing stores.
 * SSR-safe — returns an empty-but-valid context on the server. Client surfaces
 * call this and pass the result to resumeExecutivePartnership().
 */
export function buildRestoredPartnershipContext(
  opts?: { academyId?: string | null; firstName?: string | null },
): RestoredPartnershipContext {
  const firstName = opts?.firstName ?? null
  let isFirstOpenToday = false
  let lastPageLabel: string | null = null
  let lastTopic: string | null = null
  let priorTurnCount = 0
  let unresolvedDecision: string | null = null

  if (typeof window !== 'undefined') {
    try { isFirstOpenToday = getDailyGreetingState(firstName).isFirstOpenToday } catch { /* fail-safe */ }
    try {
      if (opts?.academyId) {
        const s = loadLastSession(opts.academyId)
        lastPageLabel = s?.lastPageLabel ?? null
      }
    } catch { /* fail-safe */ }
    try {
      const sum = getConversationContextSummary()
      priorTurnCount = sum.turnsCount
      lastTopic = sum.lastTopic
    } catch { /* fail-safe */ }
    try { unresolvedDecision = deriveUnresolvedDecision() } catch { /* fail-safe */ }
  }

  return { isFirstOpenToday, lastPageLabel, unresolvedDecision, lastTopic, priorTurnCount, firstName }
}

// ── Time-of-day salutation (word only — the lifecycle is reused, not the word) ──

function timeOfDayGreeting(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 18) return 'Good afternoon'
  return 'Good evening'
}

// ── The canonical partnership resume ─────────────────────────────────────────────
// Returns a DonnaSafeReadAnswer — the currency every surface already renders, so
// the director cannot tell which entry point they used. Spoken prose, not a
// dashboard (Conversation DNA), so it humanizes through the executive layer.

export function resumeExecutivePartnership(
  ctx: DirectorDonnaContext,
  restored?: RestoredPartnershipContext | null,
): DonnaSafeReadAnswer {
  const report = buildAcademyAttentionReport(ctx)
  const prefix = ctx.isLive ? '' : '[Demo] '
  const name = restored?.firstName ? `, ${restored.firstName}` : ''
  const salutation = `${timeOfDayGreeting()}${name}`

  // Restore the working relationship — prior context + unresolved decisions.
  const continuity: string[] = []
  if (restored?.lastPageLabel) {
    continuity.push(`When we left off you were on the ${restored.lastPageLabel}.`)
  }
  if (restored?.unresolvedDecision) {
    continuity.push(`You still have ${restored.unresolvedDecision} open from last time.`)
  }
  const isResuming = continuity.length > 0

  // Lead always confirms DONNA has already been working — never "starting a chat".
  const lead = isResuming
    ? `${prefix}${salutation} — picking up where we left off. I've already reviewed what changed while you were away.`
    : `${prefix}${salutation}. I've already reviewed today's academy.`

  // ── All-clear partnership state ────────────────────────────────────────────
  if (report.isEmpty) {
    const sessionNote = ctx.todaySessions > 0
      ? ` You have ${ctx.todaySessions} session${ctx.todaySessions !== 1 ? 's' : ''} on today.`
      : ''
    const lines = [
      lead,
      ...continuity,
      `Overall we're in good shape — nothing urgent is waiting on you.${sessionNote}`,
      `A clear morning is a good time to review curriculum coverage or check in on player progress — tell me which and I'll walk you through it to the finish.`,
    ]
    return {
      actionId: 'operating_session_clear',
      text: lines.join('\n'),
      confidence: ctx.confidence,
      sourceNote: report.sourceNote,
      followUp: 'Walk me through what to review',
      href: '/director/donna',
      isAnswerable: true,
    }
  }

  // ── Situation awareness + recommended first action ─────────────────────────
  const top = report.topAction!
  const lines: string[] = [
    lead,
    ...continuity,
    `Here's where we stand: ${report.healthSummary}`,
    `The first thing I'd take on is ${top.label}.`,
    `Why it matters: ${top.whyItMatters}`,
    `What the data shows: ${top.evidence}`,
    top.href
      ? `When you're ready, I'll take you to ${top.bestNextAction} and stay with you until it's done.`
      : `Next: ${top.bestNextAction} — and I'll stay with you until it's done.`,
    top.requiresApproval
      ? `This one needs your approval — ${top.donnaWillNotDo}`
      : `You can handle this directly — no approval needed. ${top.donnaWillNotDo}`,
  ]

  // Supporting items (max 3, excluding the top).
  const supporting = report.allItems.slice(1, 4)
  if (supporting.length > 0) {
    const also = supporting.map(item => item.label).join('; ')
    const more = report.totalCount > 4
      ? `, plus ${report.totalCount - 4} more on our radar`
      : ''
    lines.push(`Also worth your eye: ${also}${more}.`)
  }

  return {
    actionId: `operating_session_${top.id}`,
    text: lines.join('\n'),
    confidence: ctx.confidence,
    sourceNote: report.sourceNote,
    followUp: top.href ? `Take me to: ${top.bestNextAction.split('.')[0]}` : 'Walk me through it',
    href: top.href ?? null,
    isAnswerable: true,
  }
}

// ── Certification predicates ─────────────────────────────────────────────────────

const CLARIFICATION_LANGUAGE: readonly RegExp[] = [
  /what would you like(?: to (?:do|know))?/i,
  /how can i help/i,
  /i want to make sure i understand/i,
  /would you like (?:me )?to/i,
  /could you be more specific/i,
  /what would you like to know or do/i,
  /can you clarify/i,
  /did you mean\b/i,
]

/** The opening confirms DONNA has already done the work — never a fresh chat. */
export function hasReviewedConfirmation(text: string): boolean {
  return /i'?ve already reviewed|already reviewed|already (?:gone through|checked)|picking up where we left off/i.test(text)
}

/** The opening never asks the director how DONNA can help. */
export function hasNoClarificationLanguage(text: string): boolean {
  return !CLARIFICATION_LANGUAGE.some(r => r.test(text))
}

/** The resume names a recommended first action (or a clear-state review offer). */
export function hasRecommendedFirstAction(answer: DonnaSafeReadAnswer): boolean {
  return (
    /the first thing i'?d take on|here'?s where we stand|a clear morning is a good time/i.test(answer.text) &&
    !!answer.followUp && answer.followUp.trim().length > 0
  )
}

/** The resume offers to guide the director to completion. */
export function offersGuideToCompletion(answer: DonnaSafeReadAnswer): boolean {
  return (
    /until it'?s done|walk you through|walk me through|when you'?re ready, i'?ll|stay with you/i.test(answer.text) &&
    !!answer.followUp && answer.followUp.trim().length > 0
  )
}

/** When continuity exists, the resume restores the relationship (not a new chat). */
export function restoresRelationship(text: string): boolean {
  return /where we left off|while you were away|you still have|picking up/i.test(text)
}
