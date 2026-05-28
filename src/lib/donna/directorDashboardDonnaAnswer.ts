// Sprint 623 — DONNA Dashboard Priority Answer Engine V1
// Pure TypeScript — no DB calls, no server actions, no mutations, no UI imports.
// Answers "what should I do first?" style questions from DirectorDonnaContext signals.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// ── Detection ──────────────────────────────────────────────────────────────────
// Detects "what should I do first?" and "give me a brief" style questions.
// Must NOT overlap with KPI vocabulary — those are caught by detectKpiQuestionType.
// Sprint 912.17: extended with brief/status/pending patterns.

export function detectDashboardPriorityQuestion(text: string): boolean {
  const t = text.toLowerCase().trim()
  return (
    // "what should I do first/today/now/next"
    /what (should|do|can) i (do|focus|prioritize|fix|tackle|work on|start) (first|today|now|next)?/.test(t) ||
    // "what needs my attention" / "what needs attention today"
    /what (needs?|need) (my )?attention/.test(t) ||
    // "most important" / "highest priority" / "top priority"
    /(most important|highest priority|top priority|biggest priority)/.test(t) ||
    // "how healthy is my academy"
    /how healthy (is (my|the|this) academy|is the academy|are we)/.test(t) ||
    // "academy health" standalone
    /\bacademy health\b/.test(t) ||
    // "biggest bottleneck"
    /biggest (bottleneck|issue|problem|concern)/.test(t) ||
    // "what to fix first"
    /what (to|should i) fix first/.test(t) ||
    // "what is urgent today"
    /what (is|are) (urgent|critical) (today|right now|this week)/.test(t) ||
    // "give me a summary/overview for today"
    /give me (a )?(summary|overview|briefing|rundown) (of today|for today)/.test(t) ||
    // "what should I do today"
    /what should i (do|work on|tackle|focus on) today/.test(t) ||

    // Sprint 912.17: brief/status/pending patterns
    // "give me a brief" / "director brief" / "academy brief"
    /give me (a |my |the )?(brief|briefing|status report|digest)/.test(t) ||
    /\b(director brief|daily brief|academy brief|status report)\b/.test(t) ||
    // "what is pending" / "what's pending" / "anything pending"
    /what'?s? (pending|outstanding|in (the )?queue)/.test(t) ||
    /anything (pending|outstanding|in (the )?queue)/.test(t) ||
    /show me what.{0,15}(pending|outstanding|needs attention)/.test(t) ||
    // "what should I review first"
    /what (should i|do i) review (first|today|now)/.test(t) ||
    // "academy status"
    /\bacademy status\b/.test(t) ||
    // "how is the academy doing"
    /how (is|are) (the |my |this )?academy doing/.test(t)
  )
}

// Sprint 912.17: sub-classifier — true when the question wants a SUMMARY list
// rather than a single-action priority answer. Used to route to buildDirectorBriefSummary.
function detectBriefQuestion(text: string): boolean {
  const t = text.toLowerCase().trim()
  return (
    /give me (a |my |the )?(brief|briefing|status report|digest)/.test(t) ||
    /\b(director brief|daily brief|academy brief|status report)\b/.test(t) ||
    /what'?s? (pending|outstanding|in (the )?queue)/.test(t) ||
    /anything (pending|outstanding|in (the )?queue)/.test(t) ||
    /show me what.{0,15}(pending|outstanding|needs attention)/.test(t) ||
    /\bacademy status\b/.test(t) ||
    /how (is|are) (the |my |this )?academy doing/.test(t)
  )
}

// ── COO-quality answer builder ────────────────────────────────────────────────
// Priority order: wrap-ups → at-risk players → review queue → healthy state.
// Uses available DirectorDonnaContext signals only — does not invent unseen data.

export function buildDashboardPriorityResponse(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const highRisk = ctx.attentionItems.filter(a => a.risk === 'high').length
  const medRisk = ctx.attentionItems.filter(a => a.risk === 'medium').length
  const prefix = ctx.isLive ? '' : '[Demo] '

  // ── 1. Missing coach wrap-ups ────────────────────────────────────────────────
  if (ctx.missingWrapUps > 0) {
    const plural = ctx.missingWrapUps !== 1
    const urgencyNote = ctx.missingWrapUps > 3
      ? 'This is a significant gap — multiple sessions have no coaching record today.'
      : 'Observations not captured today are gone — these cannot be recovered retroactively.'
    return {
      actionId: 'dashboard_priority',
      text: `${prefix}Start with missing coach wrap-ups. ${ctx.missingWrapUps} wrap-up${plural ? 's are' : ' is'} pending from today's sessions. ${urgencyNote} Once submitted, I can help draft parent-safe summaries or route items for your review. Nothing will be published without your approval.`,
      confidence: ctx.confidence,
      sourceNote: ctx.isLive ? 'Live from sessions' : 'Demo data',
      followUp: 'Want me to show which sessions are missing wrap-ups?',
      href: '/director/sessions',
      isAnswerable: true,
    }
  }

  // ── 2. High-risk player attention ────────────────────────────────────────────
  if (highRisk > 0) {
    const namedPlayers = ctx.attentionItems
      .filter(a => a.risk === 'high' && a.playerName)
      .slice(0, 3)
      .map(a => a.playerName as string)
    const nameNote = namedPlayers.length > 0 ? ` (${namedPlayers.join(', ')})` : ''
    const plural = highRisk !== 1
    const medNote = medRisk > 0 ? `, with ${medRisk} more at medium risk` : ''
    return {
      actionId: 'dashboard_priority',
      text: `${prefix}Focus on player attention. ${highRisk} player${plural ? 's' : ''}${nameNote} ${plural ? 'are' : 'is'} flagged as high risk${medNote}. Review their recent observations and attendance patterns. If a parent update or coaching conversation is needed, I can help draft a parent-safe summary — it goes to review before anything is sent.`,
      confidence: ctx.confidence,
      sourceNote: ctx.isLive ? 'Live from observations and attendance' : 'Demo data',
      followUp: 'Want to see the full attention list?',
      href: '/director/players',
      isAnswerable: true,
    }
  }

  // ── 3. Pending review queue ──────────────────────────────────────────────────
  if (ctx.pendingReviews > 0) {
    const plural = ctx.pendingReviews !== 1
    const breakdown: string[] = []
    if (ctx.evidenceDrafts > 0) breakdown.push(`${ctx.evidenceDrafts} evidence draft${ctx.evidenceDrafts !== 1 ? 's' : ''}`)
    if (ctx.attendanceExceptions > 0) breakdown.push(`${ctx.attendanceExceptions} attendance exception${ctx.attendanceExceptions !== 1 ? 's' : ''}`)
    if (ctx.templateDrafts > 0) breakdown.push(`${ctx.templateDrafts} template draft${ctx.templateDrafts !== 1 ? 's' : ''}`)
    const breakdownText = breakdown.length > 0 ? `, including ${breakdown.join(', ')}` : ''
    // Sprint 913.1: add staleness urgency when items are old
    const staleWarning = (ctx.oldestPendingReviewAgeDays ?? 0) >= 7
      ? ` The oldest item is ${ctx.oldestPendingReviewAgeDays} day${ctx.oldestPendingReviewAgeDays !== 1 ? 's' : ''} old — coaches may be waiting.`
      : ''
    return {
      actionId: 'dashboard_priority',
      text: `${prefix}Clear your review queue. ${ctx.pendingReviews} item${plural ? 's' : ''}${breakdownText} ${plural ? 'are' : 'is'} waiting for your decision.${staleWarning} Nothing is applied until you approve it.`,
      confidence: ctx.confidence,
      sourceNote: ctx.isLive ? 'Live from proposed_actions' : 'Demo data',
      followUp: 'Want to go to the review queue now?',
      href: '/director/review',
      isAnswerable: true,
    }
  }

  // ── 4. Healthy academy — no urgent signals ───────────────────────────────────
  const sessionNote = ctx.todaySessions > 0
    ? ` You have ${ctx.todaySessions} session${ctx.todaySessions !== 1 ? 's' : ''} scheduled today.`
    : ''
  const suggestNote = ctx.curriculumGaps.length > 0
    ? ' Curriculum gaps have been flagged — this is a good time to review them.'
    : ' Good time to review curriculum coverage or check player progress.'
  return {
    actionId: 'dashboard_priority',
    text: `${prefix}Academy looks healthy — no urgent signals right now.${sessionNote}${suggestNote} If you want, I can summarize what is in progress or look at any specific area.`,
    confidence: ctx.confidence,
    sourceNote: ctx.isLive ? 'Live data' : 'Demo data',
    followUp: 'Want me to check curriculum coverage or player progress?',
    href: '/director/donna',
    isAnswerable: true,
  }
}

// ── Director Brief Summary ────────────────────────────────────────────────────
// Sprint 912.17: answers "give me a brief" / "what is pending" / "academy status"
// with a structured numbered list of all active signals.
// Different from buildDashboardPriorityResponse (which returns ONE priority action):
// this function returns ALL pending items so the director has a complete picture.
// Pure TypeScript — no DB calls, no mutations. Uses DirectorDonnaContext only.

export function buildDirectorBriefSummary(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const prefix = ctx.isLive ? '' : '[Demo] '
  // Sprint 913.1: use pre-computed risk counts from context instead of recomputing
  const highRisk = ctx.highRiskPlayerCount
  const medRisk  = ctx.mediumRiskPlayerCount

  const items: string[] = []

  // Priority order matches buildDashboardPriorityResponse so the brief is consistent
  if (ctx.missingWrapUps > 0) {
    items.push(`${ctx.missingWrapUps} missing coach wrap-up${ctx.missingWrapUps !== 1 ? 's' : ''} from today`)
  }
  if (highRisk > 0) {
    items.push(`${highRisk} player${highRisk !== 1 ? 's' : ''} flagged high-risk`)
  } else if (medRisk > 0) {
    items.push(`${medRisk} player${medRisk !== 1 ? 's' : ''} flagged medium-risk`)
  }
  if (ctx.pendingReviews > 0) {
    // Sprint 913.1: note staleness if oldest item is ≥7 days
    const staleNote = (ctx.oldestPendingReviewAgeDays ?? 0) >= 7
      ? ` (oldest is ${ctx.oldestPendingReviewAgeDays} day${ctx.oldestPendingReviewAgeDays !== 1 ? 's' : ''} old)`
      : ''
    items.push(`${ctx.pendingReviews} item${ctx.pendingReviews !== 1 ? 's' : ''} in the Review Queue${staleNote}`)
  }
  if (ctx.todaySessions > 0) {
    items.push(`${ctx.todaySessions} session${ctx.todaySessions !== 1 ? 's' : ''} scheduled today`)
  }
  if (ctx.advancementEligibleCount > 0) {
    items.push(`${ctx.advancementEligibleCount} player${ctx.advancementEligibleCount !== 1 ? 's' : ''} ready to advance`)
  }
  if (ctx.curriculumGaps.length > 0) {
    items.push(`${ctx.curriculumGaps.length} curriculum gap${ctx.curriculumGaps.length !== 1 ? 's' : ''} flagged`)
  }
  // Sprint 913.1: curriculum drafts from DONNA voice commands (separate queue)
  if (ctx.curriculumDraftCount > 0) {
    items.push(`${ctx.curriculumDraftCount} curriculum draft${ctx.curriculumDraftCount !== 1 ? 's' : ''} waiting in Curriculum Builder`)
  }

  // All clear — no signals
  if (items.length === 0) {
    const sessionNote = ctx.todaySessions > 0
      ? ` ${ctx.todaySessions} session${ctx.todaySessions !== 1 ? 's' : ''} today.`
      : ''
    return {
      actionId: 'director_brief',
      text: `${prefix}Academy looks clear — nothing urgent right now.${sessionNote} Good time to review curriculum coverage or check in on player progress.`,
      confidence: ctx.confidence,
      sourceNote: ctx.isLive ? 'Live data' : 'Demo data',
      followUp: 'Ask me what to focus on',
      href: '/director/donna',
      isAnswerable: true,
    }
  }

  // Determine the single most urgent next step
  let nextStep: string
  let nextHref: string
  let followUpLabel: string
  if (ctx.missingWrapUps > 0) {
    nextStep = 'Check missing wrap-ups — coaching observations from today cannot be recovered later.'
    nextHref = '/director/sessions'
    followUpLabel = 'Show sessions'
  } else if (highRisk > 0) {
    nextStep = `Review the ${highRisk} high-risk player${highRisk !== 1 ? 's' : ''} — check recent observations and attendance.`
    nextHref = '/director/players'
    followUpLabel = 'View players'
  } else if (ctx.pendingReviews > 0) {
    nextStep = 'Clear your Review Queue — coaches and players are waiting on your decisions.'
    nextHref = '/director/review'
    followUpLabel = 'Open Review Queue'
  } else {
    nextStep = 'Review player progress or curriculum coverage.'
    nextHref = '/director/donna'
    followUpLabel = 'Ask me more'
  }

  const numbered = items.map((item, i) => `${i + 1}. ${item}.`).join('\n')

  return {
    actionId: 'director_brief',
    text: `${prefix}Here's your academy status:\n\n${numbered}\n\nBest next step: ${nextStep}\n\nNothing is applied until you approve it.`,
    confidence: ctx.confidence,
    sourceNote: ctx.isLive ? 'Live data' : 'Demo data',
    followUp: followUpLabel,
    href: nextHref,
    isAnswerable: true,
  }
}

// ── Combined detector + answerer ───────────────────────────────────────────────

export function tryAnswerDashboardPriorityQuestion(
  text: string,
  ctx: DirectorDonnaContext,
): DonnaSafeReadAnswer | null {
  if (!detectDashboardPriorityQuestion(text)) return null
  // Sprint 912.17: route brief/status questions to the summary format;
  // priority questions ("what should I do first?") use the single-action format.
  if (detectBriefQuestion(text)) return buildDirectorBriefSummary(ctx)
  return buildDashboardPriorityResponse(ctx)
}
