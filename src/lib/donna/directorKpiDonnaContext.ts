// Sprint 621 — DONNA KPI + Dashboard + Players context string builders
// Sprint 622 — DonnaInlineAnswer type + pre-computed answer builders
// Pure TypeScript — no DB calls, no server imports, no mutations.
// Accepts pre-computed values from server components and returns formatted DONNA prompt strings.

import { explainKpiByStatus } from '@/lib/donna/kpiExplanations/kpiExplainer'
import type { AcademyKpiId } from '@/lib/kpis/academyKpiModel'

// ── Shared answer type ────────────────────────────────────────────────────────

export type DonnaInlineAnswer = {
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  label?: string
}

export interface KpiPageDonnaContext {
  activePlayers: number
  advancementReady: number
  atRiskCount: number
}

export function buildKpiPageDonnaPrompt(ctx: KpiPageDonnaContext, question: string): string {
  const signals = [
    `Active players: ${ctx.activePlayers}`,
    `Advancement ready: ${ctx.advancementReady}`,
    `Attention signals: ${ctx.atRiskCount} (absences or long level tenure)`,
  ].join('. ')
  return `Use the visible dashboard context and available academy signals. ${signals}. ${question}`
}

export interface DashboardDonnaContext {
  pendingWrapUps: number
  attentionCount: number
  pendingCount: number
  newRequests: number
  advancementReady: number
}

export function buildDashboardDonnaPrompt(ctx: DashboardDonnaContext): string {
  const parts: string[] = []
  if (ctx.pendingWrapUps > 0)
    parts.push(`${ctx.pendingWrapUps} coach wrap-up${ctx.pendingWrapUps !== 1 ? 's' : ''} missing`)
  if (ctx.attentionCount > 0)
    parts.push(`${ctx.attentionCount} player${ctx.attentionCount !== 1 ? 's' : ''} flagged for attention`)
  if (ctx.pendingCount > 0)
    parts.push(`${ctx.pendingCount} player${ctx.pendingCount !== 1 ? 's' : ''} awaiting placement`)
  if (ctx.newRequests > 0)
    parts.push(`${ctx.newRequests} new parent request${ctx.newRequests !== 1 ? 's' : ''}`)
  if (ctx.advancementReady > 0)
    parts.push(`${ctx.advancementReady} player${ctx.advancementReady !== 1 ? 's' : ''} ready to advance`)
  const context = parts.length > 0 ? parts.join('. ') : 'No urgent signals detected'
  return `Use the visible dashboard context and available academy signals. ${context}. What should I do first today?`
}

export interface PlayersPageDonnaContext {
  activePlayers: number
  missingCurriculumCount: number
  advancementReadyCount: number
  namedSignals?: Array<{ name: string; reason: string }>
  assessmentDueCount?: number
}

export function buildPlayersPageDonnaPrompt(ctx: PlayersPageDonnaContext): string {
  const parts: string[] = [`Active players: ${ctx.activePlayers}`]
  if (ctx.missingCurriculumCount > 0)
    parts.push(`${ctx.missingCurriculumCount} without a curriculum level`)
  if (ctx.advancementReadyCount > 0)
    parts.push(`${ctx.advancementReadyCount} ready to advance`)
  return `Use the visible dashboard context and available academy signals. ${parts.join('. ')}. Who needs my attention? Which players are at risk or overdue for review?`
}

// ── Pre-computed inline answer builders (Sprint 622) ─────────────────────────
// These build typed DonnaInlineAnswer objects at chip render time.
// Passed as donnaAnswer in donna:open event — consumed immediately by DonnaAssistantButton.

export function buildKpiExplainAnswer(ctx: KpiPageDonnaContext): DonnaInlineAnswer {
  const kpiId: AcademyKpiId = ctx.atRiskCount > 0 ? 'player_progress_velocity' : 'attendance_rate'
  const status: 'healthy' | 'warning' | 'critical' =
    ctx.atRiskCount > 3 ? 'critical' : ctx.atRiskCount > 0 ? 'warning' : 'healthy'
  const { headline, whyItMatters, recommendedNextAction } = explainKpiByStatus(kpiId, status)
  const signals = [
    `${ctx.activePlayers} active players`,
    ctx.advancementReady > 0 ? `${ctx.advancementReady} ready to advance` : null,
    ctx.atRiskCount > 0 ? `${ctx.atRiskCount} flagged for attention` : null,
  ].filter(Boolean).join(', ')
  return {
    message: `${headline}. ${whyItMatters} Signals: ${signals}. Recommended: ${recommendedNextAction}. Note: trend attribution (why a number changed) is not wired yet — check session data for root causes.`,
    type: status === 'critical' ? 'warning' : status === 'warning' ? 'info' : 'success',
    label: 'KPI Explanation',
  }
}

export function buildKpiPriorityAnswer(ctx: KpiPageDonnaContext): DonnaInlineAnswer {
  if (ctx.atRiskCount > 0) {
    const status: 'healthy' | 'warning' | 'critical' = ctx.atRiskCount > 3 ? 'critical' : 'warning'
    const { headline, recommendedNextAction } = explainKpiByStatus('player_progress_velocity', status)
    return {
      message: `${ctx.atRiskCount} player${ctx.atRiskCount !== 1 ? 's' : ''} flagged for attention — ${headline.toLowerCase()}. ${recommendedNextAction}.`,
      type: ctx.atRiskCount > 3 ? 'warning' : 'info',
      label: 'First priority',
    }
  }
  if (ctx.advancementReady > 0) {
    const { headline, recommendedNextAction } = explainKpiByStatus('level_readiness_queue_size', 'warning')
    return {
      message: `${ctx.advancementReady} player${ctx.advancementReady !== 1 ? 's' : ''} ready to advance — ${headline.toLowerCase()}. ${recommendedNextAction}.`,
      type: 'info',
      label: 'First priority',
    }
  }
  const { headline, whyItMatters } = explainKpiByStatus('attendance_rate', 'healthy')
  return {
    message: `No urgent KPI signals. ${headline}. ${whyItMatters}`,
    type: 'success',
    label: 'KPI Status',
  }
}

export function buildDashboardPriorityAnswer(ctx: DashboardDonnaContext): DonnaInlineAnswer {
  if (ctx.pendingWrapUps > 0) {
    return {
      message: `Start with coach wrap-ups: ${ctx.pendingWrapUps} wrap-up${ctx.pendingWrapUps !== 1 ? 's' : ''} not yet submitted. Missing wrap-ups mean lost coaching observations that cannot be recovered.`,
      type: 'warning',
      label: 'First priority',
    }
  }
  if (ctx.attentionCount > 0) {
    return {
      message: `${ctx.attentionCount} player${ctx.attentionCount !== 1 ? 's' : ''} flagged for attention. Review their progress and check if priorities need updating.`,
      type: 'info',
      label: 'First priority',
    }
  }
  if (ctx.pendingCount > 0) {
    return {
      message: `${ctx.pendingCount} player${ctx.pendingCount !== 1 ? 's' : ''} awaiting placement. Complete placement to assign them to groups and levels.`,
      type: 'info',
      label: 'First priority',
    }
  }
  if (ctx.newRequests > 0) {
    return {
      message: `${ctx.newRequests} new parent request${ctx.newRequests !== 1 ? 's' : ''} pending. Review and respond to keep families engaged.`,
      type: 'info',
      label: 'First priority',
    }
  }
  if (ctx.advancementReady > 0) {
    return {
      message: `${ctx.advancementReady} player${ctx.advancementReady !== 1 ? 's' : ''} ready to advance. Review their level readiness before approving movement.`,
      type: 'success',
      label: 'Next action',
    }
  }
  return {
    message: 'No urgent signals today. Academy looks healthy — good time to review curriculum coverage or plan upcoming sessions.',
    type: 'success',
    label: 'Status',
  }
}

export function buildRosterAttentionAnswer(ctx: PlayersPageDonnaContext): DonnaInlineAnswer {
  const parts: string[] = []
  if (ctx.missingCurriculumCount > 0)
    parts.push(`${ctx.missingCurriculumCount} player${ctx.missingCurriculumCount !== 1 ? 's' : ''} without a curriculum level`)
  if (ctx.advancementReadyCount > 0)
    parts.push(`${ctx.advancementReadyCount} player${ctx.advancementReadyCount !== 1 ? 's' : ''} ready to advance`)
  if (ctx.assessmentDueCount && ctx.assessmentDueCount > 0)
    parts.push(`${ctx.assessmentDueCount} player${ctx.assessmentDueCount !== 1 ? 's' : ''} with overdue assessment`)

  if (parts.length === 0) {
    return {
      message: `All ${ctx.activePlayers} players have curriculum levels assigned. No urgent roster signals detected.`,
      type: 'success',
      label: 'Roster status',
    }
  }

  const namedNote = ctx.namedSignals && ctx.namedSignals.length > 0
    ? ` Key players: ${ctx.namedSignals.slice(0, 3).map(s => `${s.name} (${s.reason})`).join(', ')}.`
    : ''

  return {
    message: parts.join('. ') + '.' + namedNote,
    type: ctx.missingCurriculumCount > 0 ? 'warning' : 'info',
    label: 'Roster attention',
  }
}
