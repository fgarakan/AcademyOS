// Sprint 912.19 — DONNA Review Queue Intelligence V1
// Answers review-queue questions using DirectorDonnaContext breakdown fields.
// Fires BEFORE the page guide intercept so "what needs review?" always gets
// a data-driven answer rather than a page-contextual one.
//
// Data source: DirectorDonnaContext (live from proposed_actions at page render).
// Curriculum override drafts (academy_curriculum_overrides) are NOT in directorCtx —
// their absence is documented in the response rather than fabricated.
//
// Pure TypeScript — no DB calls, no mutations, no server actions.
// DONNA never approves, rejects, or applies anything in this flow.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// ── Detection ──────────────────────────────────────────────────────────────────
// These patterns are distinct from PAGE_APPROVAL (which fires for page-guide
// context) and from detectDashboardPriorityQuestion (which handles "what to do
// first" priority questions). This set targets explicit queue-data requests.

export function detectReviewQueueQuestion(text: string): boolean {
  const t = text.toLowerCase().trim()
  return (
    // "what is in the review queue" / "review queue summary/breakdown"
    /\bwhat('?s| is| are) in (the )?review queue\b/.test(t) ||
    /\breview queue (summary|breakdown|status|detail|items?)\b/.test(t) ||
    /\bwhat.{0,15}review queue\b/.test(t) ||
    // "what curriculum drafts are waiting"
    /\bwhat curriculum drafts? (are )?(waiting|pending)\b/.test(t) ||
    /\bcurriculum (drafts?|changes?) (waiting|pending|in (the )?queue)\b/.test(t) ||
    // "what decisions/approvals are waiting on me"
    /\bwhat.{0,20}(decisions?|approvals?|items?) (are )?(waiting|pending) (on|for) me\b/.test(t) ||
    /\bwhat.{0,20}waiting (on|for) (my|director|the) (approval|review|decision)\b/.test(t) ||
    // "summarize pending reviews" / "breakdown of pending items"
    /\bsummarize (pending |the )?reviews?\b/.test(t) ||
    /\bpending (reviews?|approvals?) (summary|breakdown|detail|items?)\b/.test(t) ||
    /\bbreakdown of (pending|review) items?\b/.test(t) ||
    // "what is risky in the queue"
    /\bwhat.{0,15}(risky|high.?risk|critical|riskiest) (in (the )?queue|pending (items?|reviews?))\b/.test(t) ||
    // "what needs review" — overrides page-guide for data-based answer
    /\bwhat needs (review|approval)\b/.test(t)
  )
}

// ── Response builder ───────────────────────────────────────────────────────────

export function buildReviewQueueAnswer(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const prefix = ctx.isLive ? '' : '[Demo] '

  // ── Empty queue ─────────────────────────────────────────────────────────────
  if (ctx.pendingReviews === 0) {
    // Sprint 913.1: even if proposed_actions is clear, show curriculum drafts if any
    const cdNote = ctx.curriculumDraftCount > 0
      ? ` ${ctx.curriculumDraftCount} curriculum draft${ctx.curriculumDraftCount !== 1 ? 's' : ''} are waiting in the Curriculum Builder — review them there.`
      : ' Curriculum drafts from DONNA voice commands are tracked separately on the Curriculum Builder page.'
    return {
      actionId: 'review_queue_empty',
      text: `${prefix}Your Review Queue is clear right now — no pending items in proposed_actions.${cdNote}`,
      confidence: ctx.confidence,
      sourceNote: ctx.isLive ? 'Live from proposed_actions' : 'Demo data',
      followUp: 'Check Curriculum Builder',
      href: '/director/curriculum/builder',
      isAnswerable: true,
    }
  }

  // ── Build category breakdown ────────────────────────────────────────────────
  // evidenceDrafts, attendanceExceptions, templateDrafts are from directorCtx.
  // Remaining items (including submitted wrap-ups, player proposals, etc.) are
  // grouped as "other" — their exact types are visible in the Review Center.
  const knownCount = ctx.evidenceDrafts + ctx.attendanceExceptions + ctx.templateDrafts
  const otherCount = Math.max(0, ctx.pendingReviews - knownCount)

  const breakdown: string[] = []
  if (ctx.evidenceDrafts > 0) {
    breakdown.push(`${ctx.evidenceDrafts} evidence draft${ctx.evidenceDrafts !== 1 ? 's' : ''}`)
  }
  if (ctx.attendanceExceptions > 0) {
    breakdown.push(`${ctx.attendanceExceptions} attendance exception${ctx.attendanceExceptions !== 1 ? 's' : ''}`)
  }
  if (ctx.templateDrafts > 0) {
    breakdown.push(`${ctx.templateDrafts} template draft${ctx.templateDrafts !== 1 ? 's' : ''}`)
  }
  if (otherCount > 0) {
    breakdown.push(`${otherCount} other item${otherCount !== 1 ? 's' : ''} (may include coach wrap-ups or player proposals)`)
  }

  const breakdownText = breakdown.length > 0
    ? `: ${breakdown.join(', ')}`
    : ''

  // Sprint 913.1: add curriculum drafts to the text when available
  const cdBreakdown = ctx.curriculumDraftCount > 0
    ? ` Plus ${ctx.curriculumDraftCount} curriculum draft${ctx.curriculumDraftCount !== 1 ? 's' : ''} in the Curriculum Builder queue.`
    : ' Curriculum drafts from DONNA voice commands are in a separate queue on the Curriculum Builder page.'

  // Sprint 913.1: staleness warning
  const staleWarning = (ctx.oldestPendingReviewAgeDays ?? 0) >= 7
    ? ` Oldest item is ${ctx.oldestPendingReviewAgeDays} day${ctx.oldestPendingReviewAgeDays !== 1 ? 's' : ''} old — coaches may be waiting on decisions.`
    : ''

  // ── Prioritization guidance ─────────────────────────────────────────────────
  let priorityNote = ''
  if (ctx.attendanceExceptions > 0) {
    priorityNote = ' Attendance exceptions may affect parent records — review these carefully.'
  } else if (ctx.evidenceDrafts > 0) {
    priorityNote = ' Evidence drafts affect player advancement readiness — worth reviewing before advancement decisions.'
  }

  const safetyNote = ' DONNA will not approve, reject, or apply any item — your explicit action in the Review Center is required.'

  const text =
    `${prefix}Review Queue: ${ctx.pendingReviews} item${ctx.pendingReviews !== 1 ? 's' : ''} pending${breakdownText}.${staleWarning}${priorityNote}` +
    cdBreakdown +
    safetyNote

  return {
    actionId: 'review_queue_breakdown',
    text,
    confidence: ctx.confidence,
    sourceNote: ctx.isLive ? 'Live from proposed_actions' : 'Demo data',
    followUp: 'Open Review Queue',
    href: '/director/review',
    isAnswerable: true,
  }
}
