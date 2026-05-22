// Sprint 623 — DONNA Dashboard Priority Answer Engine V1
// Pure TypeScript — no DB calls, no server actions, no mutations, no UI imports.
// Answers "what should I do first?" style questions from DirectorDonnaContext signals.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// ── Detection ──────────────────────────────────────────────────────────────────
// Detects "what should I do first?" style dashboard priority questions.
// Must NOT overlap with KPI vocabulary — those are caught by detectKpiQuestionType.

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
    /what should i (do|work on|tackle|focus on) today/.test(t)
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
    return {
      actionId: 'dashboard_priority',
      text: `${prefix}Clear your review queue. ${ctx.pendingReviews} item${plural ? 's' : ''}${breakdownText} ${plural ? 'are' : 'is'} waiting for your decision. Coaches and players are waiting on these before their work can move forward. I can walk you through each one — nothing is applied until you approve it.`,
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

// ── Combined detector + answerer ───────────────────────────────────────────────

export function tryAnswerDashboardPriorityQuestion(
  text: string,
  ctx: DirectorDonnaContext,
): DonnaSafeReadAnswer | null {
  if (!detectDashboardPriorityQuestion(text)) return null
  return buildDashboardPriorityResponse(ctx)
}
