// Sprint 1021 — DONNA Safe Read Actions V1
// Executable safe-read action handlers for DONNA.
// Safe reads surface live data — no state changes, no proposed_actions, no DB writes.
// All handlers accept pre-loaded context and return formatted answer shapes.

import type { DONNAConfidence } from '@/lib/donna/donnaCOOAnswerEngine'
import type { DonnaRole } from '@/lib/donna/donnaRoleBoundaries'
import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { CoachDonnaContext } from '@/lib/donna/coachDonnaContext'
import { getConfidencePrefix, isAnswerable } from '@/lib/donna/donnaConfidence'
import { explainKpiByStatus } from '@/lib/donna/kpiExplanations/kpiExplainer'

// ── Answer shape ──────────────────────────────────────────────────────────────

export interface DonnaSafeReadAnswer {
  actionId: string
  text: string
  confidence: DONNAConfidence
  sourceNote: string | null
  followUp: string | null
  href: string | null
  isAnswerable: boolean
}

// ── Director safe reads ───────────────────────────────────────────────────────

export function answerSummarizeToday(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const prefix = getConfidencePrefix(ctx.confidence)
  const answerable = isAnswerable(ctx.confidence)

  if (!answerable) {
    return {
      actionId: 'summarize_today',
      text: 'No session data available yet. This will populate once sessions are scheduled and coaches use the system.',
      confidence: ctx.confidence,
      sourceNote: 'No live data',
      followUp: 'Try scheduling sessions and running a session to see data here.',
      href: '/director/sessions',
      isAnswerable: false,
    }
  }

  const parts: string[] = []

  if (ctx.todaySessions === 0) {
    parts.push('No sessions scheduled for today.')
  } else {
    parts.push(`${ctx.todaySessions} session${ctx.todaySessions !== 1 ? 's' : ''} on the schedule today.`)
  }

  if (ctx.pendingReviews > 0) {
    parts.push(`${ctx.pendingReviews} item${ctx.pendingReviews !== 1 ? 's' : ''} pending your review.`)
  } else {
    parts.push('Review queue is clear.')
  }

  if (ctx.missingWrapUps > 0) {
    parts.push(`${ctx.missingWrapUps} wrap-up${ctx.missingWrapUps !== 1 ? 's' : ''} not yet submitted.`)
  }

  if (ctx.attentionItems.length > 0) {
    const highRisk = ctx.attentionItems.filter(a => a.risk === 'high').length
    if (highRisk > 0) {
      parts.push(`${highRisk} player${highRisk !== 1 ? 's' : ''} flagged for attention.`)
    }
  }

  return {
    actionId: 'summarize_today',
    text: prefix + parts.join(' '),
    confidence: ctx.confidence,
    sourceNote: ctx.isLive ? 'Live data from your academy' : 'Demo data',
    followUp: ctx.pendingReviews > 0 ? 'Want me to show the pending items?' : null,
    href: '/director/donna',
    isAnswerable: true,
  }
}

export function answerShowPendingReviews(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const prefix = getConfidencePrefix(ctx.confidence)

  if (!isAnswerable(ctx.confidence)) {
    return {
      actionId: 'show_pending_reviews',
      text: 'Review queue data is not available yet.',
      confidence: ctx.confidence,
      sourceNote: null,
      followUp: null,
      href: '/director/review',
      isAnswerable: false,
    }
  }

  if (ctx.pendingReviews === 0) {
    return {
      actionId: 'show_pending_reviews',
      text: prefix + 'Review queue is clear — nothing pending.',
      confidence: ctx.confidence,
      sourceNote: 'Live from proposed_actions',
      followUp: null,
      href: '/director/review',
      isAnswerable: true,
    }
  }

  const breakdown: string[] = []
  if (ctx.evidenceDrafts > 0) breakdown.push(`${ctx.evidenceDrafts} evidence draft${ctx.evidenceDrafts !== 1 ? 's' : ''}`)
  if (ctx.attendanceExceptions > 0) breakdown.push(`${ctx.attendanceExceptions} attendance exception${ctx.attendanceExceptions !== 1 ? 's' : ''}`)
  if (ctx.templateDrafts > 0) breakdown.push(`${ctx.templateDrafts} template draft${ctx.templateDrafts !== 1 ? 's' : ''}`)

  const breakdownText = breakdown.length > 0 ? ` (${breakdown.join(', ')})` : ''

  return {
    actionId: 'show_pending_reviews',
    text: prefix + `${ctx.pendingReviews} item${ctx.pendingReviews !== 1 ? 's' : ''} pending your review${breakdownText}.`,
    confidence: ctx.confidence,
    sourceNote: 'Live from proposed_actions',
    followUp: 'Want to go to the review queue?',
    href: '/director/review',
    isAnswerable: true,
  }
}

export function answerAcademyRisks(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const prefix = getConfidencePrefix(ctx.confidence)

  if (!isAnswerable(ctx.confidence)) {
    return {
      actionId: 'academy_risks',
      text: 'Academy health data is not available yet.',
      confidence: ctx.confidence,
      sourceNote: null,
      followUp: null,
      href: '/director/donna',
      isAnswerable: false,
    }
  }

  if (ctx.academyRisks.length === 0) {
    return {
      actionId: 'academy_risks',
      text: prefix + 'No active risk signals — academy looks healthy.',
      confidence: ctx.confidence,
      sourceNote: ctx.isLive ? 'Live data' : 'Demo data',
      followUp: null,
      href: '/director/donna',
      isAnswerable: true,
    }
  }

  const highRisks = ctx.academyRisks.filter(r => r.urgency === 'high')
  const medRisks = ctx.academyRisks.filter(r => r.urgency === 'medium')

  const parts: string[] = []
  if (highRisks.length > 0) {
    parts.push(`${highRisks.length} high-urgency signal${highRisks.length !== 1 ? 's' : ''}: ${highRisks.map(r => r.signal.toLowerCase()).join(', ')}.`)
  }
  if (medRisks.length > 0) {
    parts.push(`${medRisks.length} medium signal${medRisks.length !== 1 ? 's' : ''}: ${medRisks.map(r => r.signal.toLowerCase()).join(', ')}.`)
  }

  return {
    actionId: 'academy_risks',
    text: prefix + parts.join(' '),
    confidence: ctx.confidence,
    sourceNote: ctx.isLive ? 'Live from sessions and proposed_actions' : 'Demo data',
    followUp: highRisks.length > 0 ? 'Want me to show what needs attention?' : null,
    href: '/director/donna',
    isAnswerable: true,
  }
}

// ── Coach safe reads ───────────────────────────────────────────────────────────

export function answerCoachSessionStatus(ctx: CoachDonnaContext): DonnaSafeReadAnswer {
  const prefix = getConfidencePrefix(ctx.confidence)

  if (!isAnswerable(ctx.confidence)) {
    return {
      actionId: 'start_session',
      text: 'No session data available. You may not have any sessions scheduled for today.',
      confidence: ctx.confidence,
      sourceNote: null,
      followUp: null,
      href: '/coach/sessions',
      isAnswerable: false,
    }
  }

  if (ctx.todaySessions === 0) {
    return {
      actionId: 'start_session',
      text: prefix + 'No sessions scheduled for you today.',
      confidence: ctx.confidence,
      sourceNote: 'Live from sessions',
      followUp: null,
      href: '/coach/sessions',
      isAnswerable: true,
    }
  }

  const parts: string[] = [
    `You have ${ctx.todaySessions} session${ctx.todaySessions !== 1 ? 's' : ''} today with ${ctx.totalPlayersToday} player${ctx.totalPlayersToday !== 1 ? 's' : ''}.`,
  ]

  if (ctx.missingWrapUps > 0) {
    parts.push(`${ctx.missingWrapUps} wrap-up${ctx.missingWrapUps !== 1 ? 's' : ''} still pending.`)
  }

  return {
    actionId: 'start_session',
    text: prefix + parts.join(' '),
    confidence: ctx.confidence,
    sourceNote: 'Live from sessions and proposed_actions',
    followUp: ctx.activeSessionId ? `Want to open ${ctx.activeSessionName ?? 'your active session'}?` : null,
    href: ctx.activeSessionId ? `/coach/sessions/${ctx.activeSessionId}/execute` : '/coach/sessions',
    isAnswerable: true,
  }
}

export function answerCoachWrapUpStatus(ctx: CoachDonnaContext): DonnaSafeReadAnswer {
  const prefix = getConfidencePrefix(ctx.confidence)

  if (!isAnswerable(ctx.confidence)) {
    return {
      actionId: 'wrap_up',
      text: 'Wrap-up status not available.',
      confidence: ctx.confidence,
      sourceNote: null,
      followUp: null,
      href: '/coach/sessions',
      isAnswerable: false,
    }
  }

  if (ctx.missingWrapUps === 0) {
    return {
      actionId: 'wrap_up',
      text: prefix + 'All wrap-ups submitted for today.',
      confidence: ctx.confidence,
      sourceNote: 'Live from proposed_actions',
      followUp: null,
      href: '/coach/sessions',
      isAnswerable: true,
    }
  }

  return {
    actionId: 'wrap_up',
    text: prefix + `${ctx.missingWrapUps} wrap-up${ctx.missingWrapUps !== 1 ? 's' : ''} still pending. Director is waiting on these.`,
    confidence: ctx.confidence,
    sourceNote: 'Live from proposed_actions',
    followUp: ctx.activeSessionId ? `Want to submit the wrap-up for ${ctx.activeSessionName ?? 'your session'}?` : null,
    href: ctx.activeSessionId ? `/coach/sessions/${ctx.activeSessionId}/wrap-up` : '/coach/sessions',
    isAnswerable: true,
  }
}

// ── KPI question detection and answering (Sprint 622) ────────────────────────
// Used by DonnaVoiceReadyShell to intercept KPI questions on the /director/donna hub.
// Answers from available DirectorDonnaContext signals only — no external data fetch.

type KpiQuestionType = 'explain' | 'priority' | 'trend'

export function detectKpiQuestionType(text: string): KpiQuestionType | null {
  const t = text.toLowerCase()
  if (/why|changed|went|dropped|fell|increased|decreased|spiked|worse|better/.test(t)) return 'trend'
  if (/explain|what (is|are|does)|mean|how does|tell me about/.test(t)) return 'explain'
  if (/which|first|most|priority|focus|attention|important|urgent|should i/.test(t)) return 'priority'
  if (/kpi|metric|signal|attendance|recap|progress|velocity|coverage|completion/.test(t)) return 'explain'
  return null
}

export function tryAnswerKpiQuestion(
  text: string,
  ctx: DirectorDonnaContext,
): DonnaSafeReadAnswer | null {
  const questionType = detectKpiQuestionType(text)
  if (!questionType) return null

  if (questionType === 'trend') {
    return {
      actionId: 'kpi_trend',
      text: "I can explain what each KPI means and what to inspect next, but trend attribution — why a number changed — is not wired yet. To investigate: check session attendance logs, coach recap history, or filter by date range in the KPI dashboard.",
      confidence: 'partial',
      sourceNote: 'Honest limitation — session-level trend analysis pending',
      followUp: 'Want me to show current academy risk signals instead?',
      href: '/director/kpi',
      isAnswerable: true,
    }
  }

  const highRisk = ctx.attentionItems.filter(a => a.risk === 'high').length
  const medRisk = ctx.attentionItems.filter(a => a.risk === 'medium').length

  if (questionType === 'priority') {
    if (ctx.missingWrapUps > 0) {
      const { headline, recommendedNextAction } = explainKpiByStatus('recap_completion_rate', ctx.missingWrapUps > 3 ? 'critical' : 'warning')
      return {
        actionId: 'kpi_priority',
        text: `${headline}. ${ctx.missingWrapUps} wrap-up${ctx.missingWrapUps !== 1 ? 's' : ''} missing today. ${recommendedNextAction}.`,
        confidence: ctx.confidence,
        sourceNote: ctx.isLive ? 'Live from sessions' : 'Demo data',
        followUp: 'Want to see which sessions are missing wrap-ups?',
        href: '/director/sessions',
        isAnswerable: true,
      }
    }
    if (highRisk > 0) {
      const { headline, recommendedNextAction } = explainKpiByStatus('player_progress_velocity', highRisk > 2 ? 'critical' : 'warning')
      return {
        actionId: 'kpi_priority',
        text: `${headline}. ${highRisk} player${highRisk !== 1 ? 's' : ''} flagged as high risk${medRisk > 0 ? `, ${medRisk} medium risk` : ''}. ${recommendedNextAction}.`,
        confidence: ctx.confidence,
        sourceNote: ctx.isLive ? 'Live from observations and attendance' : 'Demo data',
        followUp: 'Want to see the attention list?',
        href: '/director/players',
        isAnswerable: true,
      }
    }
    if (ctx.pendingReviews > 0) {
      const { headline, recommendedNextAction } = explainKpiByStatus('level_readiness_queue_size', ctx.pendingReviews > 3 ? 'critical' : 'warning')
      return {
        actionId: 'kpi_priority',
        text: `${headline}. ${ctx.pendingReviews} item${ctx.pendingReviews !== 1 ? 's' : ''} pending your review. ${recommendedNextAction}.`,
        confidence: ctx.confidence,
        sourceNote: ctx.isLive ? 'Live from proposed_actions' : 'Demo data',
        followUp: 'Want to go to the review queue?',
        href: '/director/review',
        isAnswerable: true,
      }
    }
    const { headline } = explainKpiByStatus('attendance_rate', 'healthy')
    return {
      actionId: 'kpi_priority',
      text: `No urgent KPI signals at the moment. ${headline}. Review curriculum coverage or plan upcoming sessions.`,
      confidence: ctx.confidence,
      sourceNote: ctx.isLive ? 'Live data' : 'Demo data',
      followUp: null,
      href: '/director/kpi',
      isAnswerable: true,
    }
  }

  // questionType === 'explain'
  const { headline, whyItMatters } = explainKpiByStatus(
    ctx.missingWrapUps > 0 ? 'recap_completion_rate' : highRisk > 0 ? 'player_progress_velocity' : 'attendance_rate',
    ctx.missingWrapUps > 0 ? (ctx.missingWrapUps > 3 ? 'critical' : 'warning') : highRisk > 0 ? 'warning' : 'healthy',
  )
  return {
    actionId: 'kpi_explain',
    text: `${headline}. ${whyItMatters} Note: trend attribution (why a number changed) is not wired yet — check session data for root causes.`,
    confidence: ctx.confidence,
    sourceNote: ctx.isLive ? 'Live data' : 'Demo data',
    followUp: 'Want to see which signals need attention?',
    href: '/director/kpi',
    isAnswerable: true,
  }
}

// ── Role-aware dispatcher ─────────────────────────────────────────────────────

export function dispatchSafeReadAction(
  actionId: string,
  role: DonnaRole,
  directorCtx: DirectorDonnaContext | null,
  coachCtx: CoachDonnaContext | null,
): DonnaSafeReadAnswer | null {
  if (role === 'director' && directorCtx) {
    switch (actionId) {
      case 'summarize_today': return answerSummarizeToday(directorCtx)
      case 'show_pending_reviews': return answerShowPendingReviews(directorCtx)
      case 'academy_risks': return answerAcademyRisks(directorCtx)
    }
  }

  if (role === 'coach' && coachCtx) {
    switch (actionId) {
      case 'start_session': return answerCoachSessionStatus(coachCtx)
      case 'wrap_up': return answerCoachWrapUpStatus(coachCtx)
    }
  }

  return null
}
