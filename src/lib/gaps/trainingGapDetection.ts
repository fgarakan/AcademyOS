// Training Gap Detection — Sprint 232
// Pure deterministic helper. No DB calls. No AI. No side effects. No writes.
// Detects training exposure gaps from player load and attendance data.
// Caller fetches player_load_aggregation data and passes it in.
// Output: IdpTrainingGap[] — consumed by buildIndividualDevelopmentPlan().

import type { IdpTrainingGap, IdpGapSeverity } from '@/lib/player/individualDevelopmentPlan'

// ── Input type ──────────────────────────────────────────────────────────────────

export interface TrainingGapInput {
  player_id: string
  // From player_load_aggregation
  sessions_7d?: number | null
  sessions_28d?: number | null
  duration_28d_min?: number | null
  skill_sessions_28d?: number | null
  fitness_sessions_28d?: number | null
  competition_sessions_28d?: number | null
  overload_flag?: boolean | null
  fatigue_risk_score?: number | null
  fatigue_risk_label?: string | null
  load_trend_7d?: string | null
  absences_7d?: number | null
  // Curriculum context
  current_level?: string | null
  current_stage?: string | null
  // Gate context
  open_gate_count?: number
}

// ── Severity sort order ─────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<IdpGapSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
  insufficient_data: 3,
}

// ── Main detector ───────────────────────────────────────────────────────────────

export function detectTrainingGaps(input: TrainingGapInput): IdpTrainingGap[] {
  const {
    sessions_7d,
    sessions_28d,
    duration_28d_min,
    fitness_sessions_28d,
    competition_sessions_28d,
    overload_flag,
    fatigue_risk_score,
    fatigue_risk_label,
    load_trend_7d,
    absences_7d,
    current_stage,
    open_gate_count,
  } = input

  // If no load data at all, return a single insufficient_data indicator
  if (
    sessions_7d == null &&
    sessions_28d == null &&
    duration_28d_min == null
  ) {
    return [
      {
        gap_type: 'insufficient_data',
        domain: null,
        description: 'No training load data is available for this player yet.',
        severity: 'insufficient_data',
        role_note:
          'No load aggregation data found. Session attendance and load tracking required before gap detection is meaningful.',
      },
    ]
  }

  const gaps: IdpTrainingGap[] = []

  // ── Overload risk ────────────────────────────────────────────────────────────
  if (overload_flag === true) {
    const label = fatigue_risk_label ?? 'elevated'
    gaps.push({
      gap_type: 'overload_risk',
      domain: 'Fitness',
      description: `Training load is flagged as ${label}. Recovery and intensity management needed.`,
      severity: 'high',
      role_note: `Overload flag active. Fatigue risk: ${label}. Reduce high-intensity blocks this week and prioritize recovery.`,
    })
  } else if (fatigue_risk_score != null && fatigue_risk_score >= 0.6) {
    gaps.push({
      gap_type: 'overload_risk',
      domain: 'Fitness',
      description: 'Training load is trending toward overload. Monitor intensity closely.',
      severity: 'medium',
      role_note: `Fatigue risk score: ${Math.round(fatigue_risk_score * 100)}%. Watch session intensity in the next 2–3 sessions.`,
    })
  }

  // ── Low session frequency ────────────────────────────────────────────────────
  if (sessions_7d != null) {
    if (sessions_7d === 0) {
      gaps.push({
        gap_type: 'low_session_frequency',
        domain: null,
        description: 'No sessions recorded in the last 7 days.',
        severity: 'high',
        role_note: 'Zero sessions this week. Verify attendance data and check for unexcused absences.',
      })
    } else if (sessions_7d === 1) {
      gaps.push({
        gap_type: 'low_session_frequency',
        domain: null,
        description: 'Only one session recorded in the last 7 days.',
        severity: 'medium',
        role_note: 'Single session this week. Expected frequency for active development is 2–3 sessions/week.',
      })
    }
  }

  // ── High absence rate ────────────────────────────────────────────────────────
  if (absences_7d != null) {
    if (absences_7d >= 3) {
      gaps.push({
        gap_type: 'high_absence_rate',
        domain: null,
        description: `${absences_7d} absences recorded in the last 7 days.`,
        severity: 'high',
        role_note: `${absences_7d} absences this week. Review attendance pattern and contact family if it continues.`,
      })
    } else if (absences_7d === 2) {
      gaps.push({
        gap_type: 'high_absence_rate',
        domain: null,
        description: '2 absences recorded in the last 7 days.',
        severity: 'medium',
        role_note: '2 absences this week. Monitor for a continuing pattern.',
      })
    }
  }

  // ── Domain imbalance — fitness ───────────────────────────────────────────────
  if (
    fitness_sessions_28d != null &&
    sessions_28d != null &&
    sessions_28d >= 4 &&
    fitness_sessions_28d === 0
  ) {
    const stage = current_stage?.toLowerCase() ?? ''
    const isHighPerformance =
      stage.includes('performance') || stage.includes('competition')

    gaps.push({
      gap_type: 'domain_imbalance',
      domain: 'Fitness',
      description: 'No fitness sessions in the last 28 days.',
      severity: isHighPerformance ? 'medium' : 'low',
      role_note: isHighPerformance
        ? 'Zero fitness sessions in 28 days at this level. Add at least one fitness-focused session per week.'
        : 'No fitness sessions in 28 days. Consider introducing fitness elements.',
    })
  }

  // ── Domain imbalance — competition ───────────────────────────────────────────
  if (
    competition_sessions_28d != null &&
    sessions_28d != null &&
    sessions_28d >= 8 &&
    competition_sessions_28d === 0
  ) {
    gaps.push({
      gap_type: 'domain_imbalance',
      domain: 'Competition',
      description: 'No competition sessions recorded in the last 28 days.',
      severity: 'low',
      role_note: 'No competition context in 28 days. Add match-play or competitive drill scenarios.',
    })
  }

  // ── Undertraining — very low total duration ──────────────────────────────────
  if (
    duration_28d_min != null &&
    sessions_28d != null &&
    sessions_28d > 0 &&
    duration_28d_min < 120
  ) {
    gaps.push({
      gap_type: 'undertraining',
      domain: null,
      description: `Total training time in the last 28 days is very low (${duration_28d_min} min).`,
      severity: 'medium',
      role_note: `Only ${duration_28d_min} min of training recorded in 28 days. Expected minimum for active development is ~240 min.`,
    })
  }

  // ── Gate evidence exposure — many open gates, low sessions ──────────────────
  if (
    open_gate_count != null &&
    open_gate_count >= 3 &&
    sessions_28d != null &&
    sessions_28d <= 4
  ) {
    gaps.push({
      gap_type: 'gate_evidence_exposure',
      domain: null,
      description: `${open_gate_count} open advancement gates with limited recent training exposure.`,
      severity: 'medium',
      role_note: `${open_gate_count} gates remain open with only ${sessions_28d} sessions in 28 days. Insufficient exposure to demonstrate gate criteria.`,
    })
  }

  // ── Declining load trend (only if no other gaps detected) ───────────────────
  if (load_trend_7d === 'declining' && gaps.length === 0) {
    gaps.push({
      gap_type: 'load_declining',
      domain: null,
      description: 'Training load is on a declining trend this week.',
      severity: 'low',
      role_note: 'Load declining vs. previous week. Check if intentional (taper week) or unplanned reduction.',
    })
  }

  // Sort: high → medium → low → insufficient_data
  gaps.sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3),
  )

  return gaps
}
