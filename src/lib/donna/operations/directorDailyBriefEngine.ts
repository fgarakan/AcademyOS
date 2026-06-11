// Sprint 1776–1805 — DONNA Academy Operating Partner V1
// Director Daily Brief Engine: final orchestrator that combines all OP layer outputs
// into a single DirectorOperatingBrief.
//
// HARD LIMITS ENFORCED HERE (output contract):
//   - max 3 priorities
//   - max 3 alerts
//   - max 3 wins
//   - exactly 1 primaryAction
//
// TodayPriority extends OperatingPriority — stripping back to OperatingPriority
// for the brief contract is valid (TodayPriority IS an OperatingPriority).

import type {
  DirectorOperatingBrief,
  OperatingPriority,
  OperatingAlert,
  OperatingWin,
  AcademySituationAssessment,
  SituationSeverity,
} from './operatingPartnerOutputContract'
import type { OperatingPartnerInputs }   from './operatingPartnerInputContract'
import type { OperatingAttentionReport } from './academyAttentionEngine'
import type { TodayPriorityResult }      from './whatShouldIDoTodayEngine'

// ── Alert builder ──────────────────────────────────────────────────────────────
// Converts the top attention signals into OperatingAlert[] (max 3).
// Only critical/high signals become alerts; medium/low are filtered out to
// keep the alert section urgent and actionable.

const SEVERITY_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

function buildAlerts(
  signals: OperatingAttentionReport,
  max:     number = 3,
): OperatingAlert[] {
  return signals.signals
    .filter(s => s.dataAvailable && (s.severity === 'critical' || s.severity === 'high'))
    .sort((a, b) => (SEVERITY_ORDER[b.severity] ?? 0) - (SEVERITY_ORDER[a.severity] ?? 0))
    .slice(0, max)
    .map((s, i) => ({
      rank:              i + 1,
      headline:          s.headline,
      domain:            s.domain,
      severity:          s.severity as SituationSeverity,
      evidence:          s.evidence,
      recommendedAction: s.recommendedDirection,
      confidence:        s.confidence,
    }))
}

// ── Brief confidence ───────────────────────────────────────────────────────────

function deriveBriefConfidence(
  inputs:      OperatingPartnerInputs,
  todayResult: TodayPriorityResult,
): 'reliable' | 'provisional' {
  if (inputs.missingCriticalInputs.length > 0) return 'provisional'
  if (inputs.inputCompletenessScore < 50)      return 'provisional'
  if (todayResult.priorities.some(p => p.confidence === 'provisional')) return 'provisional'
  return 'reliable'
}

// ── What to ignore ─────────────────────────────────────────────────────────────

function buildWhatToIgnoreString(todayResult: TodayPriorityResult): string {
  if (todayResult.whatToIgnore.length === 0) {
    return 'Nothing is being explicitly deprioritised today.'
  }
  return todayResult.whatToIgnore[0]
}

// ── Investigation brief ────────────────────────────────────────────────────────
// Returned when TodayPriorityResult.cannotBrief === true.

function buildCannotBriefOutput(
  inputs:      OperatingPartnerInputs,
  situation:   AcademySituationAssessment,
  todayResult: TodayPriorityResult,
): DirectorOperatingBrief {
  const investigationAction: OperatingPriority = {
    rank:             1,
    title:            'Gather missing data before DONNA can advise',
    domain:           'system',
    urgency:          'immediate',
    expectedImpact:   'medium',
    confidence:       'provisional',
    timeEstimate:     '15 minutes',
    firstStep:        inputs.missingCriticalInputs.length > 0
                        ? `Load the following critical data: ${inputs.missingCriticalInputs.join(', ')}.`
                        : 'Complete academy onboarding to unlock operational intelligence.',
    approvalRequired: false,
    evidenceUsed:     [`Completeness score: ${inputs.inputCompletenessScore}/100`],
    missingData:      inputs.missingCriticalInputs,
    reason:           todayResult.cannotBriefReason ?? 'Insufficient data to generate a brief.',
  }

  return {
    priorities:    [investigationAction],
    alerts:        [],
    wins:          [],
    primaryAction: investigationAction,
    whatToIgnore:  'All strategic actions — insufficient data to identify priorities.',
    generatedAt:   new Date().toISOString(),
    confidence:    'provisional',
    isComplete:    false,
  }
}

// ── Main entry point ───────────────────────────────────────────────────────────

export function buildDirectorDailyBrief(
  inputs:      OperatingPartnerInputs,
  situation:   AcademySituationAssessment,
  signals:     OperatingAttentionReport,
  todayResult: TodayPriorityResult,
  wins:        OperatingWin[],
): DirectorOperatingBrief {
  if (todayResult.cannotBrief) {
    return buildCannotBriefOutput(inputs, situation, todayResult)
  }

  // Strip TodayPriority extra fields — TodayPriority extends OperatingPriority,
  // so this assignment is type-safe. The brief contract exposes OperatingPriority only.
  const priorities: OperatingPriority[] = todayResult.priorities.slice(0, 3).map(p => ({
    rank:             p.rank,
    title:            p.title,
    domain:           p.domain,
    urgency:          p.urgency,
    expectedImpact:   p.expectedImpact,
    confidence:       p.confidence,
    timeEstimate:     p.timeEstimate,
    firstStep:        p.firstStep,
    approvalRequired: p.approvalRequired,
    evidenceUsed:     p.evidenceUsed,
    missingData:      p.missingData,
    reason:           p.reason,
  }))

  const primaryAction = priorities[0]
  if (!primaryAction) return buildCannotBriefOutput(inputs, situation, todayResult)

  const alerts = buildAlerts(signals, 3)
  const topWins = wins.slice(0, 3)

  const confidence = deriveBriefConfidence(inputs, todayResult)
  const isComplete = inputs.missingCriticalInputs.length === 0 && inputs.inputCompletenessScore >= 50

  return {
    priorities,
    alerts,
    wins:          topWins,
    primaryAction,
    whatToIgnore:  buildWhatToIgnoreString(todayResult),
    generatedAt:   new Date().toISOString(),
    confidence,
    isComplete,
  }
}
