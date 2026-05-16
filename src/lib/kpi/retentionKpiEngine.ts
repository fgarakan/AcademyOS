// Retention and Dropout KPI Engine — Sprint 429
//
// Pure TypeScript. No DB calls. No Supabase imports. No async.
//
// KPIs implemented:
//   KPI 8  — Dropout Rate by Level         (insufficient_data — no deactivated_at)
//   KPI 15 — At-Risk Players Flag          (derived from developmentHealthKpiEngine)
//
// Also exports: per-player dropout risk assessment from is_active status.
//
// KPI 8 is insufficient_data: players.is_active is boolean, but there is no
//   deactivated_at timestamp. Cannot calculate a rate over time without knowing
//   WHEN a player became inactive. updated_at is an unreliable proxy.
//   Blocked by data model gap G1.
//
// At-Risk flag: DONNA can flag a player as "at risk of dropout" when the
//   development health score is At Risk AND the player has been inactive
//   in attendance for 2+ weeks. This is a read-only risk signal — no action.

import { type KpiResult, type KpiStatus } from './kpiTypes'

// ---------------------------------------------------------------------------
// Input shapes — plain objects only, no DB types imported
// ---------------------------------------------------------------------------

export interface PlayerStatusRow {
  player_id: string
  is_active: boolean
  status: string        // 'active' | 'inactive' | 'prospect' | etc.
  current_level_id: string | null
  updated_at: string | null
}

export interface DropoutRiskInput {
  playerId: string
  isActive: boolean
  missedStreak: number | null        // from attendanceKpiEngine result
  developmentHealthScore: number | null  // from developmentHealthKpiEngine result (0–100)
  daysSinceLastObservation: number | null
}

// ---------------------------------------------------------------------------
// KPI 8 stub — Dropout Rate by Level
//
// Status: insufficient_data
// Cannot be computed without players.deactivated_at (gap G1).
// ---------------------------------------------------------------------------

export function computeDropoutRateStub(): KpiResult {
  return {
    kpiId: 8,
    name: 'Dropout Rate by Level',
    status: 'insufficient_data',
    value: null,
    displayText:
      'Dropout rate by level cannot be computed — the players table has no deactivated_at timestamp. Only current is_active status is stored, not when a player became inactive.',
    caveat:
      'Blocked by data model gap G1: players.deactivated_at (nullable timestamp) is missing. Requires a migration — stop and confirm with Farshad before adding.',
  }
}

// ---------------------------------------------------------------------------
// Per-Player Dropout Risk Assessment
//
// Status: partial
// Composite risk flag: at risk of dropout when development health is high
//   AND missed sessions are recent. This is a soft flag — not an official KPI.
// ---------------------------------------------------------------------------

export function computeDropoutRisk(input: DropoutRiskInput): KpiResult {
  const status: KpiStatus = 'partial'
  const { isActive, missedStreak, developmentHealthScore } = input

  if (!isActive) {
    return {
      kpiId: 8,
      name: 'Dropout Risk Signal',
      status,
      value: null,
      displayText: 'This player is currently marked inactive.',
      caveat: 'Inactive status is a binary flag. Exact dropout date unknown (data model gap G1).',
    }
  }

  let riskScore = 0
  const factors: string[] = []

  if (developmentHealthScore !== null && developmentHealthScore >= 50) {
    riskScore += 40
    factors.push(`Development health at risk (score ${developmentHealthScore}/100)`)
  } else if (developmentHealthScore !== null && developmentHealthScore >= 25) {
    riskScore += 15
    factors.push(`Development health in Watch zone (score ${developmentHealthScore}/100)`)
  }

  if (missedStreak !== null && missedStreak >= 3) {
    riskScore += 35
    factors.push(`${missedStreak} consecutive missed sessions`)
  } else if (missedStreak !== null && missedStreak >= 2) {
    riskScore += 15
    factors.push(`${missedStreak} consecutive missed sessions`)
  }

  const label = riskScore >= 50 ? 'High dropout risk' : riskScore >= 25 ? 'Moderate dropout risk' : 'Low dropout risk'
  const displayText =
    factors.length > 0
      ? `${label}. Signals: ${factors.join('; ')}.`
      : `${label} — no significant dropout indicators detected.`

  return {
    kpiId: 8,
    name: 'Dropout Risk Signal',
    status,
    value: riskScore,
    displayText,
    caveat:
      'Partial — risk signal derived from development health and attendance streak. Not a formal KPI. No deactivated_at timestamp exists (gap G1) so historical dropout rate cannot be computed.',
  }
}

// ---------------------------------------------------------------------------
// formatRetentionForDonna
// ---------------------------------------------------------------------------

export function formatRetentionForDonna(result: KpiResult): string[] {
  if (result.value === null || result.status === 'insufficient_data') return []

  const statusTag = result.status === 'partial' ? '[partial]' : '[demo]'
  const lines: string[] = [
    '',
    `DROPOUT RISK ${statusTag}: ${result.displayText}`,
  ]
  if (result.caveat) {
    lines.push(`  ↳ ${result.caveat}`)
  }
  return lines
}
