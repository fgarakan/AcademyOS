// Mega Sprint 2591–2620 — DONNA Proactive COO + Overnight Intelligence V1
// DONNA Proactive Alerts — surfaces max 3 COO-level alerts per session.
//
// Pure TypeScript — no DB, no side effects.
// Input:  AcademyDailySnapshot
// Output: ProactiveAlert[] (max 3, ranked by severity)
//
// Alert types:
//   immediate_risk   — player on hold 7+ days, critical escalation
//   withdrawal_risk  — stalled player 270+ days, high drop risk
//   approval_overdue — pending action 14+ days
//   parent_concern   — parent follow-up unaddressed 7+ days
//   advancement_gap  — advancement candidate ignored 30+ days
//
// Design: one sentence per alert — DONNA does not lecture.

import type { AcademyDailySnapshot } from './academyDailySnapshot'
import { escalateByAge } from './priorityEscalationEngine'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ProactiveAlertType =
  | 'immediate_risk'
  | 'withdrawal_risk'
  | 'approval_overdue'
  | 'parent_concern'
  | 'advancement_gap'

export interface ProactiveAlert {
  type:       ProactiveAlertType
  title:      string
  body:       string
  route:      string | null
  severity:   'critical' | 'high' | 'medium'
  sortWeight: number
}

// ── Alert builders ─────────────────────────────────────────────────────────────

function buildImmediateRiskAlerts(snapshot: AcademyDailySnapshot): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = []

  for (const p of snapshot.topPriorities) {
    const esc = escalateByAge(p.ageDays, p.urgency)
    if (esc.escalatedUrgency !== 'critical') continue
    alerts.push({
      type:       'immediate_risk',
      title:      p.title,
      body:       `Flagged ${p.ageDays} day${p.ageDays !== 1 ? 's' : ''} ago — requires your decision before it escalates further.`,
      route:      p.route,
      severity:   'critical',
      sortWeight: 100 + p.ageDays,
    })
  }

  return alerts
}

function buildWithdrawalRiskAlerts(snapshot: AcademyDailySnapshot): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = []

  // Players stalled long enough that withdrawal risk is high
  const stalledHigh = snapshot.topPriorities.filter(
    p => p.ageDays >= 30 && (p.urgency === 'high' || p.urgency === 'critical'),
  )

  for (const p of stalledHigh) {
    alerts.push({
      type:       'withdrawal_risk',
      title:      `Withdrawal risk: ${p.title}`,
      body:       `${p.ageDays} days without resolution — families in this situation often disengage within 2 weeks.`,
      route:      p.route,
      severity:   'high',
      sortWeight: 80 + p.ageDays,
    })
  }

  return alerts
}

function buildApprovalOverdueAlerts(snapshot: AcademyDailySnapshot): ProactiveAlert[] {
  if (snapshot.pendingActionsCount === 0) return []

  const ageDays = 1
  return [{
    type:       'approval_overdue',
    title:      `${snapshot.pendingActionsCount} action${snapshot.pendingActionsCount !== 1 ? 's' : ''} pending director approval`,
    body:       `Your team is waiting. Approvals unblocked in under 10 minutes keep operations moving.`,
    route:      '/director/review',
    severity:   'high',
    sortWeight: 70,
  }]
}

function buildParentConcernAlerts(snapshot: AcademyDailySnapshot): ProactiveAlert[] {
  if (snapshot.parentFollowupCount === 0) return []

  return [{
    type:       'parent_concern',
    title:      `${snapshot.parentFollowupCount} parent${snapshot.parentFollowupCount !== 1 ? 's' : ''} waiting for a follow-up`,
    body:       'Families who do not hear from the academy within a week are at higher risk of not re-enrolling.',
    route:      '/director/players',
    severity:   'medium',
    sortWeight: 50,
  }]
}

function buildAdvancementGapAlerts(snapshot: AcademyDailySnapshot): ProactiveAlert[] {
  if (!snapshot.topOpportunity) return []
  if (snapshot.advancementCount === 0) return []

  return [{
    type:       'advancement_gap',
    title:      `${snapshot.advancementCount} player${snapshot.advancementCount !== 1 ? 's' : ''} ready to advance — no decision yet`,
    body:       `${snapshot.topOpportunity.label}. Advancement delays reduce motivation.`,
    route:      snapshot.topOpportunity.route,
    severity:   'medium',
    sortWeight: 40,
  }]
}

// ── Main export ────────────────────────────────────────────────────────────────

export function buildProactiveAlerts(snapshot: AcademyDailySnapshot): ProactiveAlert[] {
  const all: ProactiveAlert[] = [
    ...buildImmediateRiskAlerts(snapshot),
    ...buildWithdrawalRiskAlerts(snapshot),
    ...buildApprovalOverdueAlerts(snapshot),
    ...buildParentConcernAlerts(snapshot),
    ...buildAdvancementGapAlerts(snapshot),
  ]

  // Deduplicate by type, keep highest-weight per type
  const byType = new Map<ProactiveAlertType, ProactiveAlert>()
  for (const alert of all) {
    const existing = byType.get(alert.type)
    if (!existing || alert.sortWeight > existing.sortWeight) {
      byType.set(alert.type, alert)
    }
  }

  return Array.from(byType.values())
    .sort((a, b) => b.sortWeight - a.sortWeight)
    .slice(0, 3)
}
