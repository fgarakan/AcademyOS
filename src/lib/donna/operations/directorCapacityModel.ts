// Sprint 1776–1805 — DONNA Academy Operating Partner V1
// Director Capacity Model: estimates cognitive cost of each priority and enforces a
// 100-unit attention budget.
//
// DESIGN INTENT: Directors have finite attention. Filling the queue with 10 priorities
// is worse than 2 clear priorities. This model ensures DONNA never gives the director
// more than they can act on in a single session.
//
// Budget = 100 attention units per session.
// Items are processed in priority order (already sorted). Items that would exceed the
// budget are deferred — not discarded, listed in DirectorCapacityBudget.deferredPriorities.

import type { OperatingPriority } from './operatingPartnerOutputContract'

// ── Capacity types ─────────────────────────────────────────────────────────────

export interface CapacityAllocation {
  priorityTitle:  string
  capacityCost:   number                         // 0–100 attention units
  timeEstimate:   string
  cognitiveLoad:  'light' | 'moderate' | 'heavy'
}

export interface DirectorCapacityBudget {
  totalCapacity:      number  // always 100
  allocations:        CapacityAllocation[]
  allocatedCapacity:  number  // sum of costs for allocated items
  remainingCapacity:  number  // totalCapacity - allocatedCapacity
  isOverBudget:       false   // structurally never true — enforced by buildCapacityBudget
  deferredPriorities: string[] // titles of priorities that did not fit within budget
}

// ── Cost estimation ────────────────────────────────────────────────────────────
// Formula: base(urgency) × impact_multiplier + approval_cost + confidence_cost

export function estimateCapacityCost(priority: OperatingPriority): number {
  const urgencyBase: Record<string, number> = {
    immediate:  25,
    this_week:  15,
    this_month:  8,
  }

  const impactMultiplier: Record<string, number> = {
    high:   1.3,
    medium: 1.0,
    low:    0.7,
  }

  const base = urgencyBase[priority.urgency] ?? 15
  const mult = impactMultiplier[priority.expectedImpact] ?? 1.0
  const approvalCost    = priority.approvalRequired ? 10 : 0
  const confidenceCost  = priority.confidence === 'provisional' ? 5 : 0

  return Math.round(base * mult) + approvalCost + confidenceCost
}

// ── Budget builder ─────────────────────────────────────────────────────────────
// Takes priorities in priority order (rank 1 first).
// Allocates items in order until budget would be exceeded.

export function buildCapacityBudget(
  sortedPriorities: OperatingPriority[],
): DirectorCapacityBudget {
  const totalCapacity  = 100
  const allocations:   CapacityAllocation[] = []
  const deferredTitles: string[] = []
  let allocated = 0

  for (const p of sortedPriorities) {
    const cost = estimateCapacityCost(p)
    if (allocated + cost <= totalCapacity) {
      allocated += cost
      allocations.push({
        priorityTitle: p.title,
        capacityCost:  cost,
        timeEstimate:  p.timeEstimate,
        cognitiveLoad: cost >= 35 ? 'heavy' : cost >= 20 ? 'moderate' : 'light',
      })
    } else {
      deferredTitles.push(p.title)
    }
  }

  return {
    totalCapacity,
    allocations,
    allocatedCapacity:  allocated,
    remainingCapacity:  totalCapacity - allocated,
    isOverBudget:       false,
    deferredPriorities: deferredTitles,
  }
}
