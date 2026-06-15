// Mega Sprint 2801–2830 — DONNA Academy Operating Intelligence V1
// DNA Today Influence: applies Academy DNA to existing Today page attention items.
//
// Does NOT replace directorAttentionEngine or directorRiskEngine.
// Instead: wraps their outputs with DNA-aware priority adjustments and additions.
//
// Three operations:
//   1. applyDnaTodayInfluence() — reorders existing DirectorAttentionItem[] based on DNA
//   2. buildDnaAttentionAdditions() — adds DNA-specific attention items not in the generic engine
//   3. buildDnaOpportunities() — surfaces DNA-specific opportunities
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic. No AI required.
//   - All modifications are additive — original items are never deleted.

import type {
  DirectorAttentionItem,
  AttentionPriority,
  AttentionDomain,
} from '@/lib/donna/today/directorAttentionEngine'
import type { OperatingModelContext } from './operatingModelContext'
import type { AcademySignals } from './dnaRecommendationEngine'

// ── Output types ──────────────────────────────────────────────────────────────

export interface DnaTodayContext {
  /** Existing attention items, reordered by DNA priority weights */
  dnaPrioritisedItems:  DirectorAttentionItem[]
  /** DNA-specific items added to the attention queue */
  dnaAdditions:         DirectorAttentionItem[]
  /** DNA-specific opportunities (positive signals, not alerts) */
  dnaOpportunities:     DnaOpportunity[]
  /** Summary of how DNA affected today's priorities */
  dnaInfluenceSummary:  string
}

export interface DnaOpportunity {
  id:          string
  headline:    string
  description: string
  actionLabel: string
  actionHref:  string
  dnaSource:   string  // which DNA tendency or KPI triggered this
}

// ── Priority domain weights per DNA model ─────────────────────────────────────
// Higher weight = boosted to top of attention queue for this model.

type DomainWeight = Partial<Record<AttentionDomain, number>>

const DNA_DOMAIN_WEIGHTS: Record<string, DomainWeight> = {
  '12u_foundation': {
    coach:      10,  // coach recaps = parent comms = retention
    approval:    8,  // parent updates approval especially
    player:      6,
    promotion:   2,  // advancement is low priority for foundation
    curriculum:  3,
  },
  'performance_12plus': {
    evidence:    10,  // assessment compliance = highest priority
    player:       9,  // stalls and advancement-ready = urgent
    coach:        8,  // detailed recaps required
    approval:     7,
    promotion:    9,  // advancement pipeline = core KPI
    curriculum:   5,
  },
  'college_placement': {
    player:      10,  // UTR and stagnation = critical
    evidence:    10,  // assessment compliance for recruiting
    coach:        9,  // match notes = recruiting record
    promotion:    9,  // competition readiness
    approval:     7,
    curriculum:   4,
  },
  'club_growth': {
    approval:    10,  // parent updates = retention touchpoints
    coach:        7,  // engagement observations
    player:       6,
    promotion:    3,  // advancement not primary KPI
    evidence:     4,
    curriculum:   3,
  },
}

// ── 1. Reorder existing items by DNA priority weights ─────────────────────────

/**
 * Reorder existing DirectorAttentionItem[] according to DNA domain priority weights.
 * Items with domains weighted higher for this DNA model are sorted to the top.
 * Within the same weight, original priority order is preserved.
 */
export function applyDnaTodayInfluence(
  items: DirectorAttentionItem[],
  ctx: OperatingModelContext,
): DirectorAttentionItem[] {
  const weights = DNA_DOMAIN_WEIGHTS[ctx.dnaModelId] ?? {}
  const basePriorityOrder: Record<AttentionPriority, number> = {
    critical: 100,
    high:      50,
    medium:    25,
    low:       10,
  }

  return [...items].sort((a, b) => {
    const aScore = basePriorityOrder[a.priority] + (weights[a.domain] ?? 0)
    const bScore = basePriorityOrder[b.priority] + (weights[b.domain] ?? 0)
    return bScore - aScore
  })
}

// ── 2. DNA-specific attention additions ───────────────────────────────────────

/**
 * Generate attention items specific to this DNA model that the generic
 * directorAttentionEngine does not produce.
 */
export function buildDnaAttentionAdditions(
  ctx:     OperatingModelContext,
  signals: AcademySignals,
): DirectorAttentionItem[] {
  const items: DirectorAttentionItem[] = []

  switch (ctx.dnaModelId) {

    case '12u_foundation': {
      // Attendance below DNA green-flag threshold (85%)
      if (signals.averageAttendanceRate !== null && signals.averageAttendanceRate < 0.85) {
        const pct = Math.round(signals.averageAttendanceRate * 100)
        items.push({
          id:          'dna-foundation-attendance',
          domain:      'player',
          priority:    signals.averageAttendanceRate < 0.75 ? 'high' : 'medium',
          headline:    `Attendance at ${pct}% — below 85% green-flag threshold for this model`,
          synthesis:   'Foundation academy DNA green flag requires 85%+ attendance. This is the primary retention signal.',
          actionLabel: 'Review attendance',
          actionHref:  '/director/sessions',
          whyText:     'For a 12U foundation academy, attendance is the leading retention indicator. Below 85% is a warning; below 75% is an emergency.',
        })
      }
      // Parent update cadence check
      if (signals.parentUpdatesPending >= 2) {
        items.push({
          id:          'dna-foundation-parent-cadence',
          domain:      'approval',
          priority:    'high',
          headline:    'Parent update backlog — communication cadence at risk',
          synthesis:   'Foundation academy model expects monthly parent communication. A backlog of 2+ updates breaks the trust cycle.',
          actionLabel: 'Clear parent queue',
          actionHref:  '/director/review',
          whyText:     'Parent communication frequency is a KPI for this DNA model. Backlogs of parent updates directly threaten retention.',
        })
      }
      break
    }

    case 'performance_12plus': {
      // Assessment gap for any level with active players
      if (signals.daysSinceLastAssessment !== null && signals.daysSinceLastAssessment > ctx.assessmentStandards.overdueThresholdDays) {
        items.push({
          id:          'dna-perf-assessment-gap',
          domain:      'evidence',
          priority:    'critical',
          headline:    `Assessment data is ${signals.daysSinceLastAssessment} days old — advancement decisions compromised`,
          synthesis:   `Performance academy cadence is ${ctx.assessmentStandards.cadenceLabel}. This gap means advancement decisions are being made without current evidence.`,
          actionLabel: 'Schedule assessments',
          actionHref:  '/director/review',
          whyText:     'Performance academy DNA requires monthly assessment compliance. Gaps here undermine the entire advancement pipeline.',
        })
      }
      break
    }

    case 'college_placement': {
      // Stagnation = immediate escalation for college model
      if (signals.stalledPlayerCount > 0) {
        items.push({
          id:          'dna-college-stagnation',
          domain:      'player',
          priority:    'critical',
          headline:    `${signals.stalledPlayerCount} player${signals.stalledPlayerCount > 1 ? 's' : ''} stagnating — recruiting timeline risk`,
          synthesis:   'College placement DNA escalates stagnation to critical immediately. Recruiting windows are time-bound and cannot be recovered.',
          actionLabel: 'Review recruiting pipeline',
          actionHref:  '/director/players',
          whyText:     'College placement DNA red flag: "UTR stagnation or decline over 60 days." Stagnation is a recruiting emergency, not a development note.',
        })
      }
      break
    }

    case 'club_growth': {
      // Enrollment decline = top signal
      if (signals.enrollmentTrend === 'declining') {
        items.push({
          id:          'dna-club-enrollment',
          domain:      'player',
          priority:    'critical',
          headline:    'Enrollment declining — community health at risk',
          synthesis:   'Club growth DNA red flag: "Enrollment decline over 30 days." Enrollment is the primary health metric for this model.',
          actionLabel: 'Review enrollment',
          actionHref:  '/director/players',
          whyText:     'A declining enrollment trend in a club growth academy is the most critical signal. Community health deteriorates quickly once the trend begins.',
        })
      }
      // Communication gap for retention
      if (signals.parentUpdatesPending === 0 && signals.activePlayers > 5) {
        // Check if we should be proactively communicating (positive opportunity, not alert)
        // No alert needed here — handled in opportunities
      }
      break
    }
  }

  return items
}

// ── 3. DNA-specific opportunities ─────────────────────────────────────────────

/**
 * Surface positive signals and DNA-specific opportunities.
 * Opportunities are things the director should do proactively, not reactively.
 */
export function buildDnaOpportunities(
  ctx:     OperatingModelContext,
  signals: AcademySignals,
): DnaOpportunity[] {
  const ops: DnaOpportunity[] = []

  // Universal opportunity: advancement-ready players (DNA-specific framing)
  if (signals.advancementReadyCount > 0) {
    const framing: Record<string, string> = {
      '12u_foundation':    'These players have reached a milestone worth celebrating with families.',
      'performance_12plus': 'Timely advancement keeps the competitive pipeline moving. Act within 48 hours.',
      'college_placement': 'Advancement-ready players should be entered in the next available tournament.',
      'club_growth':       'Advancement milestones are community celebration moments — share these with families.',
    }
    ops.push({
      id:          'opp-advancement-ready',
      headline:    `${signals.advancementReadyCount} player${signals.advancementReadyCount > 1 ? 's are' : ' is'} ready to advance`,
      description: framing[ctx.dnaModelId] ?? 'Consider reviewing advancement for these players.',
      actionLabel: 'Review advancement',
      actionHref:  '/director/players',
      dnaSource:   `DNA model: ${ctx.dnaModel.name}. Green flag: ${ctx.dnaModel.greenFlags[2] ?? 'advancement milestone reached'}.`,
    })
  }

  // Model-specific opportunities
  switch (ctx.dnaModelId) {
    case '12u_foundation': {
      if (signals.averageAttendanceRate !== null && signals.averageAttendanceRate >= 0.85) {
        ops.push({
          id:          'opp-foundation-attendance-strong',
          headline:    'Attendance is strong — good time for a parent celebration update',
          description: 'Attendance above 85% is a green flag for this model. Consider sending a positive parent communication this week to reinforce the community.',
          actionLabel: 'Draft parent update',
          actionHref:  '/director/review',
          dnaSource:   'DNA green flag: "Consistent attendance above 85%." DNA tendency: "Emphasizes parent communication milestones."',
        })
      }
      break
    }
    case 'performance_12plus': {
      if (signals.stalledPlayerCount === 0 && signals.reassessmentDueCount === 0 && signals.activePlayers > 0) {
        ops.push({
          id:          'opp-perf-pipeline-clean',
          headline:    'Advancement pipeline is clear — consider scheduling competition entries',
          description: 'No stalls and no overdue assessments is a performance academy green flag. This is the right time to schedule upcoming competition entries for eligible players.',
          actionLabel: 'Review sessions',
          actionHref:  '/director/sessions',
          dnaSource:   'DNA green flag: "Clear advancement pipeline at every level." DNA tendency: "Recommends competition entries for assessment-ready players."',
        })
      }
      break
    }
    case 'club_growth': {
      if (signals.enrollmentTrend === 'growing') {
        ops.push({
          id:          'opp-club-enrollment-growing',
          headline:    'Enrollment is growing — reinforce what is working',
          description: 'Growing enrollment is the primary green flag for this DNA model. Identify which groups or coaches are driving growth and replicate that across the academy.',
          actionLabel: 'View players',
          actionHref:  '/director/players',
          dnaSource:   'DNA KPI: "enrollment_growth_rate." DNA green flag: "Referral-driven new enrollments."',
        })
      }
      break
    }
    default:
      break
  }

  return ops
}

// ── Combined today context builder ────────────────────────────────────────────

/**
 * Build the complete DNA-influenced Today context.
 * Combines reordered existing items, DNA additions, and DNA opportunities.
 */
export function buildDnaTodayContext(
  existingItems: DirectorAttentionItem[],
  ctx:           OperatingModelContext,
  signals:       AcademySignals,
): DnaTodayContext {
  const dnaPrioritisedItems = applyDnaTodayInfluence(existingItems, ctx)
  const dnaAdditions        = buildDnaAttentionAdditions(ctx, signals)
  const dnaOpportunities    = buildDnaOpportunities(ctx, signals)

  const additions = dnaAdditions.length
  const topDomain = ctx.donnaAssumptions.morningBriefLead[0] ?? ctx.dnaModel.defaultKPIs[0] ?? 'operations'

  const influenceSummary = [
    `DNA model: ${ctx.dnaModel.name}.`,
    `Today priorities weighted by: ${topDomain}.`,
    additions > 0 ? `${additions} DNA-specific alert${additions > 1 ? 's' : ''} added.` : 'No additional DNA-specific alerts today.',
    dnaOpportunities.length > 0 ? `${dnaOpportunities.length} opportunity signal${dnaOpportunities.length > 1 ? 's' : ''} identified.` : '',
  ].filter(Boolean).join(' ')

  return {
    dnaPrioritisedItems,
    dnaAdditions,
    dnaOpportunities,
    dnaInfluenceSummary: influenceSummary,
  }
}
