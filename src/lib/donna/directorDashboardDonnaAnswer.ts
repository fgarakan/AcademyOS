// Sprint 623 — DONNA Dashboard Priority Answer Engine V1
// Pure TypeScript — no DB calls, no server actions, no mutations, no UI imports.
// Answers "what should I do first?" style questions from DirectorDonnaContext signals.
// Sprint 913.2: updated to delegate priority logic to donnaAttentionRankingEngine.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'
import { getTopPriority, getTopAttentionPriorities } from '@/lib/donna/donnaAttentionRankingEngine'
import { getTopSignalCorrelations } from '@/lib/donna/donnaSignalCorrelationEngine'

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

// Sprint 913.5 — Recommended action formatter
// Surfaces existing recommendedActions as a short prescriptive line.
// Uses label only for multi-action case (keeps text concise/TTS-friendly).
// Uses label + reason for the single-action case (adds context without verbosity).
// Returns '' when no actions exist — callers skip empty strings with .filter(Boolean).
function formatRecommendedActions(
  actions: DirectorDonnaContext['recommendedActions'],
  limit = 3,
): string {
  if (actions.length === 0) return ''
  const top = actions.slice(0, limit)
  if (top.length === 1) {
    return `Recommended: ${top[0].label} — ${top[0].reason}.`
  }
  const labels = top.map(a => a.label).join(', ')
  return `Recommended: ${labels}.`
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

// ── Priority answer builder (Sprint 913.2) ───────────────────────────────────
// Uses the attention ranking engine to produce a structured single-action answer.
// Format: Top priority → Why it matters → Evidence → Best next action → Safety note.

export function buildDashboardPriorityResponse(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const prefix = ctx.isLive ? '' : '[Demo] '
  const top = getTopPriority(ctx)

  if (!top) {
    // All-clear state
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

  const text = [
    `${prefix}Top priority: ${top.label}`,
    ``,
    `Why it matters: ${top.whyItMatters}`,
    ``,
    `Evidence: ${top.evidence}`,
    ``,
    `Best next action: ${top.bestNextAction}`,
    ``,
    top.donnaWillNotDo,
  ].join('\n')

  return {
    actionId: `dashboard_priority_${top.id}`,
    text,
    confidence: ctx.confidence,
    sourceNote: ctx.isLive ? 'Live data' : 'Demo data',
    followUp: top.href ? 'Open now' : 'Ask me more',
    href: top.href ?? null,
    isAnswerable: true,
  }
}

// ── Director Brief Summary (Sprint 913.2) ─────────────────────────────────────
// Answers "give me a brief" / "what is pending" / "academy status" with a
// ranked list from the attention ranking engine.
// Preserves the numbered list format; uses ranking engine for ordering and "why".
// Pure TypeScript — no DB calls, no mutations.

export function buildDirectorBriefSummary(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const prefix = ctx.isLive ? '' : '[Demo] '
  const ranked = getTopAttentionPriorities(ctx, 7)

  // All clear — no signals
  if (ranked.length === 0) {
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

  const top = ranked[0]

  // Build numbered list from ranked priorities (label only — keeps output concise)
  const numbered = ranked
    .map((p, i) => `${i + 1}. ${p.label}`)
    .join('\n')

  // Sprint 913.4: include enriched evidence for the top priority only.
  const evidenceLine = top.evidence ? `Evidence: ${top.evidence}` : ''

  // Sprint 913.5: include recommended actions from directorCtx when available.
  const recLine = formatRecommendedActions(ctx.recommendedActions)

  // Sprint 913.6: include top cross-signal correlation when one exists.
  // Only the #1 correlation is shown (keeps the brief scannable).
  const correlations = getTopSignalCorrelations(ctx, 1)
  const correlationLine = correlations.length > 0
    ? `Connected insight: ${correlations[0].evidence}`
    : ''

  const text = [
    `${prefix}Here's your academy status (ranked by urgency):`,
    '',
    numbered,
    '',
    evidenceLine,
    `Best next step: ${top.bestNextAction}`,
    recLine,
    correlationLine,
    '',
    'Nothing is applied until you approve it.',
  ].filter(Boolean).join('\n')

  return {
    actionId: 'director_brief',
    text,
    confidence: ctx.confidence,
    sourceNote: ctx.isLive ? 'Live data' : 'Demo data',
    followUp: top.href ? 'Open now' : 'Ask me more',
    href: top.href ?? null,
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
