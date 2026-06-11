// Sprint 1776–1805 — DONNA Academy Operating Partner V1
// Tradeoff Engine: for each selected priority, explains what was deferred and why.
//
// The tradeoff is computed at selection time, not post-hoc. Every selected priority
// carries a TradeoffAnalysis so the director understands what they are NOT doing today.

import type { OperatingPriority } from './operatingPartnerOutputContract'
import type { AcademySituationAssessment } from './operatingPartnerOutputContract'

// ── Tradeoff type ──────────────────────────────────────────────────────────────

export interface TradeoffAnalysis {
  chosenAction:        string     // title of the selected priority
  deferredActions:     string[]   // titles of items explicitly being postponed
  tradeoffExplanation: string     // why this choice over the alternatives
  opportunityCost:     string     // what is lost by not acting on deferred items now
  canDeferUntil:       string | null  // how long deferral is safe: 'next_session', 'next_week', 'next_month', null=urgent
}

// ── Builder ────────────────────────────────────────────────────────────────────

export function buildTradeoffAnalysis(
  chosen:    OperatingPriority,
  deferred:  OperatingPriority[],   // all items NOT selected
  situation: AcademySituationAssessment,
): TradeoffAnalysis {
  const deferredTitles = deferred.map(p => p.title)

  const tradeoffExplanation = buildExplanation(chosen, deferred, situation)
  const opportunityCost     = buildOpportunityCost(deferred)
  const canDeferUntil       = estimateDeferralWindow(deferred)

  return {
    chosenAction:        chosen.title,
    deferredActions:     deferredTitles,
    tradeoffExplanation,
    opportunityCost,
    canDeferUntil,
  }
}

// ── Internal helpers ───────────────────────────────────────────────────────────

function buildExplanation(
  chosen:    OperatingPriority,
  deferred:  OperatingPriority[],
  situation: AcademySituationAssessment,
): string {
  if (deferred.length === 0) {
    return `${chosen.title} is the only actionable item for the current situation (${situation.situationType.replace(/_/g, ' ')}). No tradeoff required.`
  }

  const urgencyRank: Record<string, number> = { immediate: 3, this_week: 2, this_month: 1 }
  const impactRank:  Record<string, number> = { high: 3, medium: 2, low: 1 }

  const chosenScore = (urgencyRank[chosen.urgency] ?? 0) * 2 + (impactRank[chosen.expectedImpact] ?? 0)
  const nextBest    = deferred[0]
  const nextScore   = (urgencyRank[nextBest?.urgency ?? 'this_month'] ?? 0) * 2 + (impactRank[nextBest?.expectedImpact ?? 'low'] ?? 0)

  if (chosen.confidence === 'reliable' && (nextBest?.confidence ?? 'provisional') === 'provisional') {
    return `${chosen.title} is supported by reliable evidence (score ${chosenScore}), while deferred items are provisional. Evidence strength tips the balance.`
  }

  if (chosenScore > nextScore) {
    return `${chosen.title} scores higher on urgency+impact (${chosenScore} vs ${nextScore} for next best). Situation type (${situation.situationType.replace(/_/g, ' ')}) confirms this domain is the bottleneck.`
  }

  return `${chosen.title} addresses the primary situation (${situation.situationType.replace(/_/g, ' ')}). ${deferred.length} item(s) deferred — not dismissed, just sequenced after this.`
}

function buildOpportunityCost(deferred: OperatingPriority[]): string {
  if (deferred.length === 0) return 'No opportunity cost — nothing was deferred.'

  const immediateDeferred = deferred.filter(p => p.urgency === 'immediate')
  const highImpactDeferred = deferred.filter(p => p.expectedImpact === 'high')

  if (immediateDeferred.length > 0) {
    return `${immediateDeferred.length} immediate-urgency item(s) are deferred. Each additional day increases the cost: ${immediateDeferred.map(p => p.title).join('; ')}.`
  }

  if (highImpactDeferred.length > 0) {
    return `${highImpactDeferred.length} high-impact item(s) are deferred. These should be addressed this week: ${highImpactDeferred.map(p => p.title).join('; ')}.`
  }

  return `${deferred.length} lower-urgency item(s) deferred. No critical cost to deferral this week, but revisit next session.`
}

function estimateDeferralWindow(deferred: OperatingPriority[]): string | null {
  if (deferred.length === 0) return null

  const hasImmediate = deferred.some(p => p.urgency === 'immediate')
  if (hasImmediate) return null   // cannot safely defer

  const hasThisWeek = deferred.some(p => p.urgency === 'this_week')
  if (hasThisWeek) return 'next_session'

  return 'next_week'
}
