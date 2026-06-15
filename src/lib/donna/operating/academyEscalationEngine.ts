// Mega Sprint 2621–2650 — DONNA Operating Layer V1
// Academy Escalation Engine — academy-wide escalation rules.
//
// Distinct from priorityEscalationEngine.ts (age ladder only, per-item).
// This engine applies domain-specific escalation rules across the full signal set:
//
//   Parent concern ignored 7 days → escalate to risk
//   Recommendation ignored 14 days → escalate to high risk
//   Assessment overdue 21 days → escalate to critical
//   Repeated coach concern (2+ coach signals) → escalate
//   Attendance decline → escalate when attendance + parent signals co-occur
//   Player stagnation 270+ days → escalate above normal stall
//
// Pure TypeScript — no DB, no side effects.

import type { OperatingSignal, OperatingSignalSeverity } from './operatingSignal'

// ── Escalation rule ────────────────────────────────────────────────────────────

export interface EscalationRule {
  id:               string
  description:      string
  applies:          (signal: OperatingSignal, allSignals: OperatingSignal[]) => boolean
  newSeverity:      OperatingSignalSeverity
  newType:          OperatingSignal['type']
  escalationReason: string
}

// ── Rules ─────────────────────────────────────────────────────────────────────

const ESCALATION_RULES: EscalationRule[] = [
  {
    id:          'parent_concern_7d',
    description: 'Parent concern ignored 7 days',
    applies:     (s) => s.domain === 'parents' && s.ageDays >= 7,
    newSeverity: 'high',
    newType:     'escalation',
    escalationReason: 'Parent concern unaddressed for 7+ days — withdrawal risk is elevated.',
  },
  {
    id:          'recommendation_ignored_14d',
    description: 'Recommendation ignored 14 days',
    applies:     (s) => s.domain === 'recommendations' && s.ageDays >= 14,
    newSeverity: 'high',
    newType:     'escalation',
    escalationReason: 'Approval queue unaddressed for 14+ days — team responsiveness is degraded.',
  },
  {
    id:          'assessment_overdue_21d',
    description: 'Assessment overdue 21 days',
    applies:     (s) => s.domain === 'assessments' && s.ageDays >= 21,
    newSeverity: 'critical',
    newType:     'escalation',
    escalationReason: 'Assessment overdue for 21+ days — advancement decisions cannot be made without fresh evidence.',
  },
  {
    id:          'player_stagnation_270d',
    description: 'Player stagnation 270+ days',
    applies:     (s) => s.domain === 'players' && s.id.includes('stalled') && s.ageDays >= 270,
    newSeverity: 'critical',
    newType:     'escalation',
    escalationReason: 'Player stagnation at 270+ days — this is now a retention emergency, not just a curriculum gap.',
  },
  {
    id:          'repeated_coach_concern',
    description: 'Repeated coach concern (2+ signals)',
    applies: (s, all) => {
      if (s.domain !== 'coaches') return false
      const coachSignals = all.filter(o => o.domain === 'coaches')
      return coachSignals.length >= 2
    },
    newSeverity: 'high',
    newType:     'escalation',
    escalationReason: 'Multiple coach signals co-occurring — this is a systemic coaching issue, not an isolated event.',
  },
  {
    id:          'attendance_parent_cooccurrence',
    description: 'Attendance decline co-occurring with parent concern',
    applies: (s, all) => {
      if (s.domain !== 'attendance') return false
      return all.some(o => o.domain === 'parents' && o.severity === 'high')
    },
    newSeverity: 'high',
    newType:     'escalation',
    escalationReason: 'Attendance decline and parent concern co-occurring — combined signal indicates retention risk.',
  },
]

// ── Engine ────────────────────────────────────────────────────────────────────

const SEVERITY_RANK: Record<OperatingSignalSeverity, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
}

function escalateSignal(
  signal: OperatingSignal,
  rule: EscalationRule,
): OperatingSignal {
  const higherSeverity = SEVERITY_RANK[rule.newSeverity] > SEVERITY_RANK[signal.severity]
    ? rule.newSeverity
    : signal.severity

  return {
    ...signal,
    type:       rule.newType,
    severity:   higherSeverity,
    reason:     `${rule.escalationReason} (was: ${signal.reason})`,
    isEscalated: true,
  }
}

export function applyEscalations(signals: OperatingSignal[]): OperatingSignal[] {
  return signals.map(signal => {
    let current = signal
    for (const rule of ESCALATION_RULES) {
      if (rule.applies(current, signals)) {
        current = escalateSignal(current, rule)
        break // one escalation rule per signal per pass
      }
    }
    return current
  })
}

// ── Intelligent follow-up tracker ─────────────────────────────────────────────
// Part 7: DONNA remembers unresolved items and surfaces them again.
// Uses ageDays from signals (derived from PrioritizedItem.daysSince in packet).
// No DB persistence — operates on current session snapshot.

export interface PendingFollowUp {
  signal:      OperatingSignal
  daysPending: number
  followUpText: string
  promptText:   string
}

export function buildPendingFollowUps(signals: OperatingSignal[]): PendingFollowUp[] {
  return signals
    .filter(s => s.ageDays >= 3 && (s.type === 'risk' || s.type === 'escalation' || s.type === 'attention'))
    .sort((a, b) => b.ageDays - a.ageDays)
    .slice(0, 3)
    .map(signal => {
      const days = signal.ageDays
      const urgencyNote =
        days >= 14 ? 'This has now escalated to critical.' :
        days >= 7  ? 'This is now urgent — action today.' :
        days >= 3  ? 'Still pending since the last review.' : ''

      return {
        signal,
        daysPending: days,
        followUpText: `${signal.title} — still unresolved after ${days} day${days !== 1 ? 's' : ''}.`,
        promptText:   `${urgencyNote} ${signal.suggestedAction}`,
      }
    })
}
