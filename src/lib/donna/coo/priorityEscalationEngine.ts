// Mega Sprint 2591–2620 — DONNA Proactive COO + Overnight Intelligence V1
// Priority Escalation Engine — age-based urgency escalation.
//
// Pure TypeScript — no DB, no side effects.
//
// Escalation ladder:
//   Day  1: Recommended  (low)
//   Day  3: Important    (medium)
//   Day  7: Urgent       (high)
//   Day 14: Critical     (critical)
//
// Used by: DonnaProactiveAlerts, COOHeroBanner

import type { PrioritizedItem } from '@/lib/donna/academy/academyIntelligenceEngine'
import type { SnapshotPriority } from './academyDailySnapshot'

// ── Urgency ladder ─────────────────────────────────────────────────────────────

export type EscalatedUrgency = 'recommended' | 'important' | 'urgent' | 'critical'

export interface EscalationResult {
  originalUrgency:  string
  escalatedUrgency: EscalatedUrgency
  escalationLabel:  string
  ageDays:          number
  didEscalate:      boolean
}

export function escalateByAge(ageDays: number, baseUrgency: string): EscalationResult {
  let escalated: EscalatedUrgency = 'recommended'

  if (ageDays >= 14)      escalated = 'critical'
  else if (ageDays >= 7)  escalated = 'urgent'
  else if (ageDays >= 3)  escalated = 'important'

  // Never downgrade an already high base urgency
  const urgencyRank: Record<string, number> = {
    immediate:   3,
    urgent:      3,
    critical:    3,
    high:        2,
    medium:      1,
    low:         0,
    recommended: 0,
  }
  const escalatedRank: Record<EscalatedUrgency, number> = {
    critical:    3,
    urgent:      2,
    important:   1,
    recommended: 0,
  }

  const baseRank = urgencyRank[baseUrgency] ?? 0
  const ageRank  = escalatedRank[escalated]

  if (baseRank >= ageRank) {
    // Base urgency is already higher — map to escalated equivalent
    if (baseRank >= 3) escalated = 'critical'
    else if (baseRank === 2) escalated = 'urgent'
    else if (baseRank === 1) escalated = 'important'
  }

  const labels: Record<EscalatedUrgency, string> = {
    recommended: 'Recommended',
    important:   'Important',
    urgent:      'Urgent',
    critical:    'Critical',
  }

  const didEscalate = escalatedRank[escalated] > (urgencyRank[baseUrgency] ?? 0)

  return {
    originalUrgency:  baseUrgency,
    escalatedUrgency: escalated,
    escalationLabel:  labels[escalated],
    ageDays,
    didEscalate,
  }
}

// ── Batch escalation ───────────────────────────────────────────────────────────

export interface EscalatedItem {
  item:       PrioritizedItem
  escalation: EscalationResult
}

export function escalateAttentionQueue(items: PrioritizedItem[]): EscalatedItem[] {
  return items.map(item => ({
    item,
    escalation: escalateByAge(item.daysSince, item.urgency),
  }))
}

// ── Escalation for snapshot priorities ────────────────────────────────────────

export function escalateSnapshotPriority(p: SnapshotPriority): EscalationResult {
  return escalateByAge(p.ageDays, p.urgency)
}

// ── Badge color hint ──────────────────────────────────────────────────────────

export function escalationBadgeClass(escalated: EscalatedUrgency): string {
  if (escalated === 'critical')    return 'text-status-red border-status-red'
  if (escalated === 'urgent')      return 'text-status-orange border-status-orange'
  if (escalated === 'important')   return 'text-status-blue border-status-blue'
  return 'text-text-muted border-border'
}
