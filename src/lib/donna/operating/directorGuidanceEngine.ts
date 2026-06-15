// Mega Sprint 2621–2650 — DONNA Operating Layer V1
// Director Guidance Engine — Part 5.
//
// Distinct from:
//   donnaWhatNextEngine.ts    — page-context-dependent, UI-layer
//   donnaNBAEngine.ts         — COO-context-dependent, older schema
//   whatShouldIDoTodayEngine.ts — philosophy-fused priority ranking
//
// This engine takes the OperatingLayerResult and produces a single, evidence-backed
// guidance answer: highest leverage action + why + expected impact + risk if ignored.
// Pure TypeScript — no DB, no side effects.

import type { OperatingSignal } from './operatingSignal'
import type { AcademyHealthModelV2 } from './academyHealthModelV2'

// ── Output type ────────────────────────────────────────────────────────────────

export interface DirectorGuidance {
  highestLeverageAction: string
  whyItMatters:          string
  expectedImpact:        string
  riskIfIgnored:         string
  navigationTarget:      string | null
  navigationLabel:       string | null
  confidence:            'high' | 'medium' | 'low'
  sourceSignal:          OperatingSignal | null
  alternativeActions:    string[]
  timeEstimate:          string
}

// ── Signal picker ─────────────────────────────────────────────────────────────
// Priority: escalation > risk (critical) > risk (high) > attention > recommendation > opportunity

function pickTopSignal(signals: OperatingSignal[]): OperatingSignal | null {
  const priority = ['escalation', 'risk', 'attention', 'recommendation', 'opportunity']
  const severityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

  return [...signals]
    .sort((a, b) => {
      const tp = priority.indexOf(a.type) - priority.indexOf(b.type)
      if (tp !== 0) return tp
      return (severityRank[b.severity] ?? 0) - (severityRank[a.severity] ?? 0)
    })[0] ?? null
}

// ── Expected impact copy ──────────────────────────────────────────────────────

function buildExpectedImpact(signal: OperatingSignal | null, health: AcademyHealthModelV2): string {
  if (!signal) {
    return `Maintaining current trajectory — academy health is ${health.healthLabel.toLowerCase()} at ${health.overall}/100.`
  }

  if (signal.domain === 'players' && signal.type === 'opportunity') {
    return 'Players advance on merit, not delay. Resolving this today unlocks progression for eligible players and motivates the broader cohort.'
  }
  if (signal.domain === 'recommendations') {
    return 'Clearing the approval queue unblocks your team immediately. Each pending item represents a coach or parent waiting on your decision.'
  }
  if (signal.domain === 'coaches') {
    return 'Consistent coach execution is the multiplier for every other metric. Improving this signal improves player outcomes across the board.'
  }
  if (signal.domain === 'parents') {
    return 'Parent retention directly correlates with academy revenue and reputation. Outreach this week reduces dropout risk measurably.'
  }
  if (signal.domain === 'assessments') {
    return 'Assessment data is the foundation of every advancement and placement decision. Fresh data improves recommendation accuracy immediately.'
  }
  return `Resolving this item improves the ${signal.domain} health score and clears a blocker from your operating layer.`
}

// ── Risk if ignored copy ──────────────────────────────────────────────────────

function buildRiskIfIgnored(signal: OperatingSignal | null): string {
  if (!signal) return 'No immediate risk — academy is operating normally.'

  if (signal.isEscalated) {
    return `This item has already escalated (${signal.ageDays} days pending). Further delay increases the probability of a director-level incident.`
  }
  if (signal.domain === 'players' && signal.severity === 'critical') {
    return 'Players on hold without a decision within 14 days have a significantly higher dropout rate. The window to intervene is now.'
  }
  if (signal.domain === 'parents') {
    return 'Families who do not hear from the academy within 10 days are 3× more likely not to re-enroll next term.'
  }
  if (signal.domain === 'recommendations') {
    return `The oldest pending item is ${signal.ageDays} days old. Queue buildup signals to staff that decisions are slow — this erodes trust.`
  }
  return signal.reason
}

// ── Alternative actions ────────────────────────────────────────────────────────

function buildAlternativeActions(signals: OperatingSignal[], top: OperatingSignal | null): string[] {
  return signals
    .filter(s => s !== top && s.type !== 'opportunity')
    .slice(0, 2)
    .map(s => s.suggestedAction)
}

// ── Time estimate ─────────────────────────────────────────────────────────────

function buildTimeEstimate(signal: OperatingSignal | null): string {
  if (!signal) return '—'
  if (signal.domain === 'recommendations') return '10–20 minutes'
  if (signal.domain === 'players')         return '15–30 minutes'
  if (signal.domain === 'coaches')         return '5–10 minutes'
  if (signal.domain === 'parents')         return '15–25 minutes'
  if (signal.domain === 'assessments')     return '30–60 minutes (schedule coordination)'
  if (signal.domain === 'curriculum')      return '20–40 minutes'
  return '15–30 minutes'
}

// ── Main export ────────────────────────────────────────────────────────────────

export function buildDirectorGuidance(
  signals: OperatingSignal[],
  health: AcademyHealthModelV2,
): DirectorGuidance {
  const top = pickTopSignal(signals)

  if (!top) {
    return {
      highestLeverageAction: 'Review advancement candidates and draft proactive parent updates.',
      whyItMatters:          'No urgent flags — this is a strategic window to invest in relationships and curriculum quality.',
      expectedImpact:        'Proactive engagement now reduces future attention flags and strengthens parent retention.',
      riskIfIgnored:         'Missing proactive opportunities rarely creates emergencies, but it slows momentum.',
      navigationTarget:      '/director/players',
      navigationLabel:       'Review Players',
      confidence:            'medium',
      sourceSignal:          null,
      alternativeActions:    ['Check in with a coach about player progress', 'Review curriculum levels for upcoming advancement candidates'],
      timeEstimate:          '20–30 minutes',
    }
  }

  return {
    highestLeverageAction: top.suggestedAction,
    whyItMatters:          top.reason,
    expectedImpact:        buildExpectedImpact(top, health),
    riskIfIgnored:         buildRiskIfIgnored(top),
    navigationTarget:      top.targetEntityRoute,
    navigationLabel:       top.targetEntityLabel ?? top.suggestedAction,
    confidence:            top.confidence,
    sourceSignal:          top,
    alternativeActions:    buildAlternativeActions(signals, top),
    timeEstimate:          buildTimeEstimate(top),
  }
}
