// Mega Sprint 3301–3330 — DONNA Adaptive COO Operating Day V1
// Operating BEHAVIOR over existing engines — NOT new intelligence.
//
// Three thin, deterministic operating capabilities, all reusing the existing
// attention/reality engines and the review-first / approval-gated model:
//   • buildDailyOperatingBrief — the proactive COO daily brief (Part 3)
//   • exception detection + playbooks — exception-based operating model (Part 4)
//   • scoreDirectorInputBurden — the Director Input Burden Score (Part 2)
//
// Nothing here mutates. Every operational recommendation is recommend/draft/route
// only, and names the human approval step (Part 5).

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'
import { buildAcademyAttentionReport } from '@/lib/donna/proactive/academyAttentionEngine'

// ── Part 3 — Proactive COO daily brief (reuses the attention engine) ─────────────

export function detectDailyBriefIntent(text: string): boolean {
  const t = text.toLowerCase().trim()
  return (
    /good morning|^morning\b|hello donna.*morning/.test(t) ||
    /what happened overnight|overnight|catch me up|brief me|morning brief|daily brief/.test(t) ||
    /what changed (today|overnight)|what'?s changed today/.test(t) ||
    /anything else before i leave|anything (else )?i should know before/.test(t) ||
    /what'?s the (status|state) (of|today)/.test(t)
  )
}

/**
 * The COO daily brief, in the required operating format:
 *   1. Top priority  2. Why it matters  3. Blocking issue
 *   4. Recommended first action  5. Approval needed (if any)
 * Built entirely from the existing academy attention report — no new intelligence,
 * no fabricated facts (honest empty/insufficient states preserved).
 */
export function buildDailyOperatingBrief(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const report = buildAcademyAttentionReport(ctx)
  const prefix = ctx.isLive ? '' : '[Demo] '

  if (report.isEmpty) {
    return {
      actionId: 'operating_brief_clear',
      text: `${prefix}Morning brief: nothing urgent is blocking you. The academy is operating normally. Good time to review curriculum coverage or check player progress.`,
      confidence: ctx.confidence,
      sourceNote: report.sourceNote,
      followUp: 'Review curriculum coverage',
      href: '/director/donna',
      isAnswerable: true,
    }
  }

  const top = report.topAction!
  const blocking = report.hasApprovalItems
    ? 'Decisions are waiting on you.'
    : `${top.whyItMatters.split('.')[0]}.`

  const lines = [
    `${prefix}Here's your operating brief.`,
    '',
    `1. Top priority: ${top.label}.`,
    `2. Why it matters: ${top.whyItMatters.split('.')[0]}.`,
    `3. Blocking issue: ${blocking}`,
    `4. Recommended first action: ${top.bestNextAction}`,
    `5. Approval needed: ${top.requiresApproval ? 'Yes — director approval required before anything changes.' : 'No approval needed to review.'}`,
    report.totalCount > 1 ? '' : '',
    report.totalCount > 1 ? `${report.totalCount - 1} more item${report.totalCount - 1 !== 1 ? 's' : ''} can wait until you've cleared this.` : '',
  ].filter(Boolean)

  return {
    actionId: 'operating_brief',
    text: lines.join('\n'),
    confidence: ctx.confidence,
    sourceNote: report.sourceNote,
    followUp: top.href ? 'Take me there' : 'Walk me through it',
    href: top.href ?? null,
    isAnswerable: true,
  }
}

// ── Part 4 — Exception-based operating model ─────────────────────────────────────

export type OperatingExceptionType =
  | 'coach_absence'
  | 'player_absence'
  | 'parent_concern'
  | 'missed_wrap_up'
  | 'level_up_blocker'
  | 'curriculum_gap'
  | 'session_issue'

export function detectOperatingException(text: string): OperatingExceptionType | null {
  const t = text.toLowerCase().trim()
  if (/coach (called in sick|is sick|is out|can'?t make it|is absent|is unavailable|no.?show)|sick coach|cover (a|the|today'?s) (class|session)/.test(t)) return 'coach_absence'
  if (/players? (are|is)? ?absent|absent players?|\d+ players? (are )?(absent|missing|out)|player.*didn'?t show|no.?show players?/.test(t)) return 'player_absence'
  if (/parent is (upset|angry|unhappy|frustrated|concerned)|upset parent|parent (called|complained|is complaining)|parent concern/.test(t)) return 'parent_concern'
  if (/missed wrap.?up|no wrap.?up|wrap.?up (is )?missing|coach didn'?t (submit|do) (the )?wrap.?up|outstanding wrap.?up/.test(t)) return 'missed_wrap_up'
  if (/level.?up (blocker|blocked|stuck)|can'?t advance|advancement (is )?blocked|blocked from advancing/.test(t)) return 'level_up_blocker'
  if (/curriculum gap|missing curriculum|empty (curriculum )?level|no curriculum/.test(t)) return 'curriculum_gap'
  if (/session (issue|problem|conflict|cancelled|overbooked)/.test(t)) return 'session_issue'
  return null
}

interface ExceptionPlaybook {
  what: string
  why: string
  next: string
  approver: string
  complete: string
  followUp: string
  href: string
}

// Deterministic playbooks — recommend/draft/route only. No fabricated specifics
// (no invented names/counts); each names the human approval step (Part 5).
const PLAYBOOKS: Record<OperatingExceptionType, ExceptionPlaybook> = {
  coach_absence: {
    what: 'A coach is unavailable today.',
    why: "Affected sessions need cover so players aren't left without coaching.",
    next: "I can surface today's sessions for that coach and draft a cover/reassignment for your approval.",
    approver: 'You — coach assignments are director-approved.',
    complete: 'Open Sessions, confirm the affected sessions, and approve the cover.',
    followUp: "Show today's sessions",
    href: '/director/sessions',
  },
  player_absence: {
    what: 'One or more players are absent today.',
    why: 'Absences affect attendance records and can be an early disengagement signal.',
    next: 'I can draft attendance exceptions for your review — nothing is written to official attendance until you approve.',
    approver: 'You — official attendance is director-confirmed.',
    complete: 'Review and confirm the attendance exceptions in the review queue.',
    followUp: 'Review attendance exceptions',
    href: '/director/review',
  },
  parent_concern: {
    what: 'A parent has raised a concern.',
    why: 'Parent trust and retention are at stake — early, transparent contact prevents escalation.',
    next: "I can draft a parent-safe update for your review. I won't send anything to the family.",
    approver: 'You — all parent communication is director-approved.',
    complete: 'Review and approve the parent update draft before it is sent.',
    followUp: 'Draft a parent update',
    href: '/director/review',
  },
  missed_wrap_up: {
    what: 'A session wrap-up is outstanding.',
    why: "Wrap-ups are DONNA's primary development signal — a missing one is a blind spot.",
    next: 'I can flag the coaches with missing wrap-ups so you can follow up.',
    approver: 'No approval needed to review; the coach submits the wrap-up.',
    complete: 'Open Sessions and follow up with the coaches who still owe wrap-ups.',
    followUp: 'Show missing wrap-ups',
    href: '/director/sessions',
  },
  level_up_blocker: {
    what: 'A level-up candidate is blocked.',
    why: 'Delayed advancement stalls player motivation and creates level capacity bottlenecks.',
    next: 'I can show the blocker (missing evidence or assessment) and draft the level-move proposal for your approval.',
    approver: 'You — level movement is director-approved through the review queue.',
    complete: 'Review the level-up candidate and approve or hold the move.',
    followUp: 'Review level-up candidates',
    href: '/director/level-up',
  },
  curriculum_gap: {
    what: 'A curriculum gap is affecting players.',
    why: 'Empty or weak levels leave advancing players without a development path.',
    next: 'I can show the gap and draft a curriculum change for your review in the builder.',
    approver: 'You — curriculum changes are director-approved drafts.',
    complete: 'Open the curriculum builder and approve the drafted change.',
    followUp: 'Open curriculum builder',
    href: '/director/curriculum/builder',
  },
  session_issue: {
    what: "There is an issue with today's session plan.",
    why: 'Session problems degrade delivery quality and frustrate players and parents.',
    next: 'I can surface the affected session and draft an adjustment for your review.',
    approver: 'You — session changes are director-confirmed.',
    complete: 'Open Sessions, review the affected session, and approve the adjustment.',
    followUp: "Show today's sessions",
    href: '/director/sessions',
  },
}

export function buildExceptionResponse(
  type: OperatingExceptionType,
  ctx: DirectorDonnaContext,
): DonnaSafeReadAnswer {
  const p = PLAYBOOKS[type]
  const prefix = ctx.isLive ? '' : '[Demo] '
  const text = [
    `${prefix}${p.what}`,
    `Why it matters: ${p.why}`,
    `What happens next: ${p.next}`,
    `Who approves: ${p.approver}`,
    `How to complete: ${p.complete}`,
  ].join('\n')

  return {
    actionId: `operating_exception_${type}`,
    text,
    confidence: ctx.confidence,
    sourceNote: ctx.isLive ? 'Operating exception — live academy context' : 'Operating exception — demo context',
    followUp: p.followUp,
    href: p.href,
    isAnswerable: true,
  }
}

// ── Part 5 — Direct-mutation guardrail ───────────────────────────────────────────
// Hard block for imperative, approval-bypassing requests. DONNA may recommend/draft/
// route these, but NEVER execute them without explicit director approval. Catches
// phrasings the intent classifier alone misses. Drafting ("draft a parent update",
// "adjust the session plan") is NOT blocked — only direct execution is.

export function detectDirectMutationRequest(text: string): boolean {
  const t = text.toLowerCase().trim()
  return (
    /\b(send|email|text|deliver)\b.*\b(parent|family|families|mother|father|guardian)\b/.test(t) ||
    /\bnotify\b.*\b(famil|parent|guardian)/.test(t) ||
    /\bapprove\b.*\b(promotion|advancement|level|move|player|it|this)\b/.test(t) ||
    /\b(promote|advance|move|bump|change|set)\b.*\b(up|level|to (orange|green|red|white|blue|yellow|bronze|silver|gold))\b/.test(t) ||
    /\bpublish\b.*\b(curriculum|level|change|it)\b/.test(t) ||
    /\bassign\b.*\bcoach\b/.test(t) ||
    /\b(overwrite|delete|remove)\b.*\b(session|template|curriculum|player)\b/.test(t)
  )
}

export function buildApprovalRequiredResponse(_text: string): DonnaSafeReadAnswer {
  return {
    actionId: 'operating_approval_required',
    text: "I can't do that directly. Actions like sending to families, approving promotions, changing levels, assigning coaches, and publishing curriculum require your explicit approval. I can draft it and route it to your review queue instead.",
    confidence: 'high',
    sourceNote: 'Safety rule: operational mutations require director approval',
    followUp: 'Draft it for review',
    href: '/director/review',
    isAnswerable: true,
  }
}

// ── Part 2 — Director Input Burden Score ─────────────────────────────────────────

export interface BurdenTurn {
  // Assist signals (DONNA carried the load)
  recommendationWithNextAction: boolean
  completionOffered: boolean
  handledWithoutDirectorSearch: boolean  // matched a deterministic engine or routed to the one brain
  // Burden signals (director had to do more)
  clarificationAsked: boolean
  genericAdvice: boolean                 // generic dead-end, NOT a routed defer
  askedDirectorToFind: boolean
}

export interface DirectorInputBurdenScore {
  turns: number
  clarifications: number
  genericAdvice: number
  asksDirectorToFind: number
  recommendationsWithNextAction: number
  completionOffers: number
  handledWithoutDirectorSearch: number
  /** 0–100; higher = lower director input burden (DONNA carried more of the load) */
  score: number
  verdict: 'low_input' | 'moderate_input' | 'high_input'
}

export function scoreDirectorInputBurden(turns: BurdenTurn[]): DirectorInputBurdenScore {
  const clarifications = turns.filter(t => t.clarificationAsked).length
  const genericAdvice = turns.filter(t => t.genericAdvice).length
  const asksDirectorToFind = turns.filter(t => t.askedDirectorToFind).length
  const recommendationsWithNextAction = turns.filter(t => t.recommendationWithNextAction).length
  const completionOffers = turns.filter(t => t.completionOffered).length
  const handledWithoutDirectorSearch = turns.filter(t => t.handledWithoutDirectorSearch).length

  const burden = clarifications + genericAdvice + asksDirectorToFind
  const assist = recommendationsWithNextAction + completionOffers
  const denom = burden + assist
  const score = denom === 0 ? 100 : Math.round((100 * assist) / denom)

  const verdict: DirectorInputBurdenScore['verdict'] =
    score >= 80 ? 'low_input' : score >= 55 ? 'moderate_input' : 'high_input'

  return {
    turns: turns.length,
    clarifications,
    genericAdvice,
    asksDirectorToFind,
    recommendationsWithNextAction,
    completionOffers,
    handledWithoutDirectorSearch,
    score,
    verdict,
  }
}
