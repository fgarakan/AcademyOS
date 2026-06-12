// Sprint 1806–1835 — DONNA Command Center & Operating Experience V1
// Academy Change Engine: UI-adapter layer that derives Director-facing decision models
// from existing Operating Partner outputs.
//
// THIS FILE DOES NOT CONTAIN NEW INTELLIGENCE.
// It transforms and exposes data already computed by the Operating Partner engines.
//
// Exports:
//   DonnaWaitDecision     — a priority DONNA is intentionally deferring
//   DonnaIgnoreDecision   — a signal DONNA is not surfacing to the director
//   DonnaActionTarget     — specific route + label for "Take Me There"
//   AcademyChange         — one change event for "What Changed Since Last Visit"
//   WhatChangedResult     — max 5 changes ranked by impact

import type {
  OperatingPriority,
  OperatingAlert,
  OperatingWin,
  SituationDomain,
} from './operatingPartnerOutputContract'
import type { OperatingAttentionSignal } from './academyAttentionEngine'
import type { TodayPriority, TodayPriorityResult } from './whatShouldIDoTodayEngine'

// ── Decision models ────────────────────────────────────────────────────────────

export interface DonnaWaitDecision {
  item:           string            // what is being deferred
  reasonDeferred: string            // why DONNA is deferring this now
  tradeoff:       string            // what is sacrificed by deferring
  reviewDays:     number            // days until DONNA should re-evaluate
  domain:         SituationDomain
}

export interface DonnaIgnoreDecision {
  signal:           string
  reason:           string
  confidence:       'reliable' | 'provisional'
  reviewWindowDays: number
  domain:           SituationDomain
}

// ── Action target ──────────────────────────────────────────────────────────────
// Every priority must point to a specific target — not a generic page.

export type ActionTargetEntityType =
  | 'players'
  | 'assessment'
  | 'curriculum'
  | 'coach'
  | 'approval'
  | 'session'
  | 'parent_issue'
  | 'review_queue'

export interface DonnaActionTarget {
  label:        string              // "Review Stalled Players" — specific, not "Players"
  route:        string              // e.g. '/director/players?filter=stalled'
  routeContext: string              // "Stalled Player Review"
  entityType:   ActionTargetEntityType
}

// ── What Changed ───────────────────────────────────────────────────────────────

export type ChangeType = 'positive' | 'negative' | 'attention'

export interface AcademyChange {
  headline:    string          // "2 Players Are Advancement-Eligible"
  detail:      string          // supporting context
  domain:      SituationDomain
  impactScore: number          // 0–100 for ranking; higher = show first
  changeType:  ChangeType
  route?:      string          // optional deep link
}

export interface WhatChangedResult {
  changes:    AcademyChange[]  // max 5, ranked by impactScore desc
  periodDays: number           // how far back to look
  hasChanges: boolean
}

// ── Wait decisions ─────────────────────────────────────────────────────────────

export function buildWaitDecisions(
  todayResult: TodayPriorityResult,
): DonnaWaitDecision[] {
  const decisions: DonnaWaitDecision[] = []

  // Source 1: items deferred by capacity budget
  for (const title of todayResult.budget.deferredPriorities) {
    decisions.push({
      item:           title,
      reasonDeferred: 'Today\'s capacity is allocated to higher-urgency items. This is next in queue.',
      tradeoff:       'This item is safe to defer for one session. Revisit at next review.',
      reviewDays:     1,
      domain:         'cross_domain',
    })
  }

  // Source 2: explicit tradeoffs from priority 1 (what was consciously deferred for it)
  const p1 = todayResult.priorities[0]
  if (p1) {
    const deferral = p1.tradeoff
    for (const deferred of deferral.deferredActions.slice(0, 3)) {
      if (!decisions.some(d => d.item === deferred)) {
        const reviewDays = deferral.canDeferUntil === null ? 1
          : deferral.canDeferUntil === 'next_session' ? 1
          : deferral.canDeferUntil === 'next_week' ? 7
          : 14
        decisions.push({
          item:           deferred,
          reasonDeferred: deferral.tradeoffExplanation,
          tradeoff:       deferral.opportunityCost,
          reviewDays,
          domain:         p1.domain,
        })
      }
    }
  }

  return decisions.slice(0, 5)
}

// ── Ignore decisions ───────────────────────────────────────────────────────────

export function buildIgnoreDecisions(
  signals: OperatingAttentionSignal[],
  whatToIgnore: string[],
): DonnaIgnoreDecision[] {
  const decisions: DonnaIgnoreDecision[] = []

  // Source 1: low-severity attention signals that don't warrant director action
  for (const signal of signals) {
    if (signal.severity === 'low' || signal.confidence === 'provisional') {
      decisions.push({
        signal:           signal.headline,
        reason:           signal.confidence === 'provisional'
          ? 'Evidence is insufficient to recommend action. DONNA is monitoring this signal.'
          : 'Low severity — this does not require director attention today.',
        confidence:       signal.confidence,
        reviewWindowDays: signal.severity === 'low' ? 7 : 14,
        domain:           signal.domain,
      })
    }
  }

  // Source 2: explicit "what to ignore" strings from today result
  for (const item of whatToIgnore) {
    if (!decisions.some(d => d.signal === item)) {
      decisions.push({
        signal:           item,
        reason:           'DONNA has deprioritised this for today based on the current situation.',
        confidence:       'reliable',
        reviewWindowDays: 7,
        domain:           'cross_domain',
      })
    }
  }

  return decisions.slice(0, 5)
}

// ── Action targets ─────────────────────────────────────────────────────────────

const DOMAIN_ROUTE_MAP: Record<SituationDomain, { route: string; entityType: ActionTargetEntityType }> = {
  players:      { route: '/director/players',              entityType: 'players' },
  coaches:      { route: '/director/review?tab=wrap-ups',  entityType: 'review_queue' },
  curriculum:   { route: '/director/curriculum',           entityType: 'curriculum' },
  parents:      { route: '/director/review?tab=parents',   entityType: 'parent_issue' },
  business:     { route: '/director/players',              entityType: 'players' },
  system:       { route: '/director/review',               entityType: 'approval' },
  philosophy:   { route: '/director/review',               entityType: 'review_queue' },
  cross_domain: { route: '/director/review',               entityType: 'review_queue' },
}

function buildActionLabel(priority: OperatingPriority): string {
  const title = priority.title
  const domain = priority.domain

  if (domain === 'players' && title.toLowerCase().includes('stall')) return 'Review Stalled Players'
  if (domain === 'players' && title.toLowerCase().includes('advance')) return 'Review Advancement Queue'
  if (domain === 'players' && title.toLowerCase().includes('evidence')) return 'Review Evidence Blockers'
  if (domain === 'players' && title.toLowerCase().includes('assessment')) return 'Open Assessment Queue'
  if (domain === 'curriculum' && title.toLowerCase().includes('bottleneck')) return 'Open Curriculum Builder'
  if (domain === 'curriculum' && title.toLowerCase().includes('empty')) return 'Build Level Content'
  if (domain === 'curriculum' && title.toLowerCase().includes('gate')) return 'Define Advancement Gates'
  if (domain === 'curriculum' && title.toLowerCase().includes('weak')) return 'Strengthen Weak Levels'
  if (domain === 'coaches') return 'Review Coach Recaps'
  if (domain === 'parents') return 'Review Parent Updates'
  if (domain === 'system') return 'Review Approval Queue'
  if (domain === 'philosophy') return 'Review Academy DNA'
  if (domain === 'business') return 'Review Capacity'
  if (domain === 'cross_domain') return 'Review Pending Items'

  // Extract the first meaningful verb phrase from the title
  const words = title.split(' ').slice(0, 4).join(' ')
  return words.length > 0 ? words : 'Open Review'
}

export function buildActionTarget(priority: OperatingPriority): DonnaActionTarget {
  const { route, entityType } = DOMAIN_ROUTE_MAP[priority.domain] ?? DOMAIN_ROUTE_MAP.system

  // Add filter params for stall detection
  const finalRoute = priority.domain === 'players' && priority.title.toLowerCase().includes('stall')
    ? `${route}?filter=stalled`
    : route

  return {
    label:        buildActionLabel(priority),
    route:        finalRoute,
    routeContext: priority.firstStep.split('.')[0] ?? priority.firstStep,
    entityType,
  }
}

export function buildActionTargets(priorities: OperatingPriority[]): DonnaActionTarget[] {
  return priorities.map(buildActionTarget)
}

// ── What Changed Since Last Visit ──────────────────────────────────────────────

export function buildWhatChangedResult(
  priorities: TodayPriority[],
  alerts:     OperatingAlert[],
  wins:       OperatingWin[],
  periodDays: number,
): WhatChangedResult {
  const changes: AcademyChange[] = []

  // Positive changes from wins
  for (const win of wins) {
    changes.push({
      headline:    win.headline,
      detail:      win.evidence,
      domain:      win.domain,
      impactScore: 80,
      changeType:  'positive',
      route:       DOMAIN_ROUTE_MAP[win.domain]?.route,
    })
  }

  // Attention changes from top priorities
  for (const p of priorities) {
    const evidence = p.evidenceUsed[0] ?? p.title
    changes.push({
      headline:    `${p.title}`,
      detail:      p.whyToday,
      domain:      p.domain,
      impactScore: p.urgency === 'immediate' ? 75 : p.urgency === 'this_week' ? 55 : 35,
      changeType:  'attention',
      route:       DOMAIN_ROUTE_MAP[p.domain]?.route,
    })
    // Suppress the evidence variable to avoid unused lint warning
    void evidence
  }

  // Negative changes from alerts
  for (const alert of alerts) {
    if (alert.severity === 'critical' || alert.severity === 'high') {
      changes.push({
        headline:    alert.headline,
        detail:      alert.evidence,
        domain:      alert.domain,
        impactScore: alert.severity === 'critical' ? 70 : 60,
        changeType:  'negative',
        route:       DOMAIN_ROUTE_MAP[alert.domain]?.route,
      })
    }
  }

  // Rank by impactScore desc, deduplicate by headline, take top 5
  const ranked = changes
    .sort((a, b) => b.impactScore - a.impactScore)
    .filter((c, i, arr) => arr.findIndex(x => x.headline === c.headline) === i)
    .slice(0, 5)

  return {
    changes:    ranked,
    periodDays,
    hasChanges: ranked.length > 0,
  }
}
