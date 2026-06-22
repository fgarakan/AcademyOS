// Sprint 1691 — DONNA "What should I focus on today?" Answer Engine V1
// Produces the exact 5-field response the sprint specifies:
//   1. Highest leverage action
//   2. Reason (why it matters)
//   3. Evidence (what data says so)
//   4. Destination (where to go)
//   5. Approval requirement (what director must decide)
// Plus 2–3 supporting items in a scannable list.
// Honest all-clear state when no signals are active.
//
// Pure TypeScript — no DB calls, no LLM, no mutations, no side effects.
// Returns DonnaSafeReadAnswer for shell routing compatibility.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'
import { buildAcademyAttentionReport } from '@/lib/donna/proactive/academyAttentionEngine'

// ─── Detection ─────────────────────────────────────────────────────────────────
// Specific to "focus today" intent — tighter than detectDashboardPriorityQuestion.
// Fires BEFORE the general dashboard priority handler in the shell.

export function detectFocusTodayQuestion(text: string): boolean {
  const t = text.toLowerCase().trim()
  return (
    /what should i focus on today/.test(t) ||
    /what('?s| is) (my |the )?focus (today|for today|this morning|this afternoon)/.test(t) ||
    /where should i (start|focus) today/.test(t) ||
    /what('?s| is) (the )?highest (leverage|priority|impact) (action|thing|item) (today|right now)/.test(t) ||
    /what (are you|have you been) noticing/.test(t) ||
    /what should i know (about |today|right now)?/.test(t) ||
    /what('?s| is) new (today|this morning|in the academy)?/.test(t) ||
    /any (new )?signals (today|this morning)?/.test(t) ||
    /what('?s| is) (most |the most )?urgent (today|right now)?/.test(t)
  )
}

// ─── 5-field response builder ──────────────────────────────────────────────────

export function buildFocusTodayAnswer(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const report = buildAcademyAttentionReport(ctx)
  const prefix = ctx.isLive ? '' : '[Demo] '

  // ── All-clear state ────────────────────────────────────────────────────────
  if (report.isEmpty) {
    const sessionNote = ctx.todaySessions > 0
      ? ` You have ${ctx.todaySessions} session${ctx.todaySessions !== 1 ? 's' : ''} today.`
      : ''
    const opportunityNote = (ctx.curriculumGaps?.length ?? 0) > 0
      ? ' Curriculum gaps are available to review — a good use of clear time.'
      : ' Good time to review curriculum coverage or check in on player progress.'

    return {
      actionId:    'focus_today_clear',
      text:        `${prefix}No urgent signals right now — academy is operating normally.${sessionNote}${opportunityNote}`,
      confidence:  ctx.confidence,
      sourceNote:  report.sourceNote,
      followUp:    'Ask me to review curriculum or check player progress',
      href:        '/director/donna',
      isAnswerable: true,
    }
  }

  const top = report.topAction!

  // ── Build the 5-field structured response ─────────────────────────────────
  // Spoken prose, not a dashboard (Sprint 3451–3480) — the old bold-numbered
  // scaffolding both read robotically and defeated the executive-layer fact guard
  // (the "1./2./3." digits counted as facts). This reads as one COO speaking and
  // is now eligible for executive refinement.
  const lines: string[] = [
    `${prefix}Here's where I'd focus today: ${top.label}.`,
    `Why it matters: ${top.whyItMatters}`,
    `What the data shows: ${top.evidence}`,
    top.href
      ? `When you're ready, I'll take you to ${top.bestNextAction}.`
      : `Next: ${top.bestNextAction}`,
    top.requiresApproval
      ? `This one needs your approval — ${top.donnaWillNotDo}`
      : `You can review this yourself — no approval needed. ${top.donnaWillNotDo}`,
  ]

  // ── Supporting items (max 3, excluding top) ────────────────────────────────
  const supporting = report.allItems.slice(1, 4)
  if (supporting.length > 0) {
    const also = supporting.map(item => item.label).join('; ')
    const more = report.totalCount > 4
      ? `, plus ${report.totalCount - 4} more in your attention queue`
      : ''
    lines.push(`Also worth a look: ${also}${more}.`)
  }

  return {
    actionId:    `focus_today_${top.id}`,
    text:        lines.join('\n'),
    confidence:  ctx.confidence,
    sourceNote:  report.sourceNote,
    followUp:    top.href ? `Take me to: ${top.bestNextAction.split('.')[0]}` : 'Ask me for more detail',
    href:        top.href ?? null,
    isAnswerable: true,
  }
}

// ─── Proactive notice answer (for "What are you noticing?" / "What's new?") ───

export function buildProactiveNoticeAnswer(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const report = buildAcademyAttentionReport(ctx)
  const prefix = ctx.isLive ? '' : '[Demo] '

  if (report.isEmpty) {
    return {
      actionId:    'proactive_notice_clear',
      text:        `${prefix}Nothing new to flag — academy looks healthy right now. No unusual signals in the last review cycle.`,
      confidence:  ctx.confidence,
      sourceNote:  report.sourceNote,
      followUp:    'Ask me what to focus on or review curriculum coverage',
      href:        '/director/donna',
      isAnswerable: true,
    }
  }

  const itemLines = report.allItems.slice(0, 5).map(
    item => `${item.label} — ${item.whyItMatters.split('.')[0]}`
  )

  const text = [
    `${prefix}Here's what I'm noticing across your academy: ${itemLines.join('; ')}.`,
    report.hasApprovalItems
      ? 'A few of these need your approval before anything changes.'
      : 'None of these need your approval yet — review them at your own pace.',
  ].join(' ')

  return {
    actionId:    'proactive_notice',
    text,
    confidence:  ctx.confidence,
    sourceNote:  report.sourceNote,
    followUp:    report.topAction?.href ? `Take me to the top item` : 'Ask me about any item',
    href:        report.topAction?.href ?? null,
    isAnswerable: true,
  }
}

// ─── Executive assumption layer (Sprint 3211–3240) ───────────────────────────────
// Part 2 — when the director is vague but the request is safe, DONNA makes the best
// COO assumption instead of asking a clarification question. Reality-aware, ends with
// a recommended action and a completion offer. No fabricated facts — uses live counts
// and the honest demo prefix.

export function detectVagueExecutiveInput(text: string): boolean {
  const t = text.toLowerCase().trim()
  return (
    /this (seems|is|feels) (off|wrong)|something('?s| is| feels| seems)? (off|wrong)|seems (off|wrong)|looks (off|wrong)|feels (off|wrong)/.test(t) ||
    /i don'?t know( what to do( next)?)?|not sure what to do|where do i (start|begin)/.test(t) ||
    /i'?m confused|^confused|i'?m lost/.test(t) ||
    /what am i missing|what'?s missing/.test(t) ||
    /^help[.!]?$|^i need help|^help me\b/.test(t) ||
    /what would (an? )?(elite |great )?coo do|what would (brian|an? executive) do/.test(t) ||
    /help me finish( this)?|take me to completion|walk me through( it| this)?|take me there/.test(t) ||
    /what'?s next|whats next/.test(t) ||
    /explain (this|that|it) simply|in simple terms|simply put/.test(t)
  )
}

export function buildExecutiveAssumptionAnswer(
  ctx: DirectorDonnaContext,
  _text: string,
): DonnaSafeReadAnswer {
  const report = buildAcademyAttentionReport(ctx)
  const prefix = ctx.isLive ? '' : '[Demo] '

  if (report.isEmpty) {
    return {
      actionId:    'exec_assumption_clear',
      text:        `${prefix}I'll read this like a COO: nothing is blocking you right now. The academy is operating normally. Good time to review curriculum coverage or check player progress.`,
      confidence:  ctx.confidence,
      sourceNote:  report.sourceNote,
      followUp:    'Review curriculum coverage',
      href:        '/director/donna',
      isAnswerable: true,
    }
  }

  const top = report.topAction!
  const blocker = report.hasApprovalItems
    ? 'The blocker is decisions waiting on you.'
    : `The blocker is ${top.whyItMatters.split('.')[0].toLowerCase()}.`

  const lines: string[] = [
    `${prefix}I'll prioritize this like a COO — what's urgent, what blocks progress, and what affects players first.`,
    '',
    `Start here: ${top.label}.`,
    `This matters because ${top.whyItMatters.split('.')[0].toLowerCase()}.`,
    blocker,
    `Evidence: ${top.evidence}`,
    top.href
      ? `I can take you there and walk you through it.`
      : `I can walk you through it.`,
  ]

  return {
    actionId:    `exec_assumption_${top.id}`,
    text:        lines.join('\n'),
    confidence:  ctx.confidence,
    sourceNote:  report.sourceNote,
    followUp:    top.href ? 'Take me to completion' : 'Walk me through it',
    href:        top.href ?? null,
    isAnswerable: true,
  }
}
