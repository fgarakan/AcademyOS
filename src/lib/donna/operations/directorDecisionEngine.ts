// Director Decision Engine — Mega Sprint 1961–1990
// Pure aggregation of existing engine outputs into decision-framed context.
// No new intelligence. No new AI calls. No new tables.

import type { TodayPriority, TodayPriorityResult } from './whatShouldIDoTodayEngine'
import type { DirectorOperatingBrief, PriorityDomain } from './operatingPartnerOutputContract'
import type { WhatChangedResult, DonnaActionTarget, AcademyChange } from './academyChangeEngine'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DecisionUrgency = 'critical' | 'high' | 'medium' | 'low'

export interface DirectorDecision {
  rank:             number
  title:            string
  decisionPrompt:   string
  firstStep:        string
  domain:           PriorityDomain
  urgency:          DecisionUrgency
  confidence:       'reliable' | 'provisional'
  evidenceUsed:     string[]
  actionHref:       string
  approvalRequired: boolean
}

export interface ReturningDirectorSummary {
  whatChanged:            AcademyChange[]
  whatImproved:           Array<{ headline: string; evidence: string }>
  whatMattersNow:         string
  recommendedFirstAction: { label: string; href: string }
}

export interface DirectorDecisionContext {
  decisions:                DirectorDecision[]
  returningDirectorMode:    boolean
  daysSinceLastVisit:       number | null
  returningDirectorSummary: ReturningDirectorSummary | null
  dataConfidence:           'reliable' | 'provisional'
  generatedAt:              string
  canBrief:                 boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RETURNING_THRESHOLD_DAYS = 14

// ── Urgency mapping ───────────────────────────────────────────────────────────

function mapUrgency(priority: TodayPriority): DecisionUrgency {
  switch (priority.urgency) {
    case 'immediate':   return 'critical'
    case 'this_week':   return 'high'
    case 'this_month':  return 'medium'
    default:            return 'low'
  }
}

// ── Decision prompt ───────────────────────────────────────────────────────────

function toDecisionPrompt(priority: TodayPriority): string {
  const { urgency, domain } = priority
  if (urgency === 'immediate')    return 'Act now or escalate?'
  if (domain === 'players')       return 'Review now or defer to next session?'
  if (domain === 'coaches')       return 'Follow up now or schedule a check-in?'
  if (domain === 'curriculum')    return 'Approve the change or investigate further?'
  if (domain === 'parents')       return 'Send an update or schedule a conversation?'
  if (domain === 'system')        return 'Complete setup or continue without it?'
  return 'Take action now or defer?'
}

// ── Action href resolution ────────────────────────────────────────────────────

function resolveActionHref(priority: TodayPriority, targets: DonnaActionTarget[]): string {
  const match = targets.find((_, i) => i === priority.rank - 1)
  return match?.route ?? '/director'
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function buildDirectorDecisionContext(params: {
  todayResult:        TodayPriorityResult
  brief:              DirectorOperatingBrief
  whatChanged:        WhatChangedResult
  actionTargets:      DonnaActionTarget[]
  daysSinceLastVisit: number | null
}): DirectorDecisionContext {
  const { todayResult, brief, whatChanged, actionTargets, daysSinceLastVisit } = params

  const returningDirectorMode =
    daysSinceLastVisit !== null && daysSinceLastVisit >= RETURNING_THRESHOLD_DAYS

  const decisions: DirectorDecision[] = todayResult.priorities.map(p => ({
    rank:             p.rank,
    title:            p.title,
    decisionPrompt:   toDecisionPrompt(p),
    firstStep:        p.firstStep,
    domain:           p.domain,
    urgency:          mapUrgency(p),
    confidence:       p.confidence,
    evidenceUsed:     p.evidenceUsed,
    actionHref:       resolveActionHref(p, actionTargets),
    approvalRequired: p.approvalRequired,
  }))

  const returningDirectorSummary: ReturningDirectorSummary | null = returningDirectorMode
    ? {
        whatChanged: whatChanged.changes,
        whatImproved: brief.wins.map(w => ({
          headline: w.headline,
          evidence: w.evidence,
        })),
        whatMattersNow:
          decisions[0]?.title ??
          'Review your approval queue for items that accumulated while you were away.',
        recommendedFirstAction: decisions[0]
          ? { label: decisions[0].firstStep, href: decisions[0].actionHref }
          : { label: 'Review Approvals', href: '/director/review' },
      }
    : null

  return {
    decisions,
    returningDirectorMode,
    daysSinceLastVisit,
    returningDirectorSummary,
    dataConfidence:  brief.confidence,
    generatedAt:     todayResult.generatedAt,
    canBrief:        !todayResult.cannotBrief,
  }
}
