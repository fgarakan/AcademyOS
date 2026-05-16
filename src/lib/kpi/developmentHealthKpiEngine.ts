// Development Health KPI Engine — Sprint 422
//
// Pure TypeScript. No DB calls. No Supabase imports. No async.
// Accepts pre-fetched plain-object data from the calling server action.
// Returns a DevelopmentHealthResult with label, risk score, and DONNA output.
//
// Composite of signals:
//   KPI 15 — Player Attention Risk Score (renamed Development Health for director clarity)
//   Inputs: attendance rate, missed streak, time in level, coach observation recency,
//           active high-severity signals, parent update recency.
//
// Status: partial — two inputs use proxies:
//   1. Missed streak may infer absences from group roster (Sprint 421 caveat)
//   2. Parent update recency uses draft creation date, not actual delivery date

import { type KpiResult, type KpiStatus } from './kpiTypes'

// ---------------------------------------------------------------------------
// Input shape — plain objects only, no DB types imported
// ---------------------------------------------------------------------------

export interface DevelopmentHealthInput {
  playerId: string
  // From Sprint 421 attendance KPI results — pass .value from each result
  attendanceRatePct: number | null       // KPI 1 value (0–100); null if no sessions
  missedStreak: number | null            // KPI 2 value; null if no sessions
  recentAbsenceCount: number | null      // KPI 3 value; null if no records
  // From player_curriculum_states
  enrolledAt: string | null              // ISO date; null if no curriculum state
  advancementEligible: boolean | null    // null if no curriculum state
  // From coach_observations (most recent record's created_at)
  lastObservationAt: string | null       // ISO date; null if no observations on record
  // From player_development_signals
  hasActiveHighSeveritySignal: boolean
  activeSignalTitles: string[]
  // From parent_updates (most recent draft's created_at)
  lastParentUpdateAt: string | null      // ISO date; null if no drafts
}

// ---------------------------------------------------------------------------
// Output shape
// ---------------------------------------------------------------------------

export type DevelopmentHealthLabel = 'Healthy' | 'Watch' | 'At Risk' | 'Insufficient Data'

export interface DevelopmentHealthResult {
  kpiResult: KpiResult
  healthLabel: DevelopmentHealthLabel
  riskScore: number
  riskContributions: string[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysSince(isoDate: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return (Date.now() - new Date(isoDate).getTime()) / msPerDay
}

// ---------------------------------------------------------------------------
// computeDevelopmentHealth
//
// Produces a composite 0–100 risk score. Lower = healthier.
// Label thresholds: Healthy (0–24) / Watch (25–49) / At Risk (50+).
// Returns Insufficient Data when fewer than 2 non-null inputs are available.
// ---------------------------------------------------------------------------

export function computeDevelopmentHealth(input: DevelopmentHealthInput): DevelopmentHealthResult {
  const contributions: string[] = []
  let riskScore = 0
  let inputsAvailable = 0

  // --- Attendance Rate (KPI 1) ---
  if (input.attendanceRatePct !== null) {
    inputsAvailable++
    if (input.attendanceRatePct < 70) {
      riskScore += 30
      contributions.push(`Attendance ${input.attendanceRatePct}% — below 70% threshold`)
    } else if (input.attendanceRatePct < 85) {
      riskScore += 10
      contributions.push(`Attendance ${input.attendanceRatePct}% — below 85% threshold`)
    }
  }

  // --- Missed Streak (KPI 2) ---
  if (input.missedStreak !== null) {
    inputsAvailable++
    if (input.missedStreak >= 3) {
      riskScore += 25
      contributions.push(`${input.missedStreak} consecutive sessions missed`)
    } else if (input.missedStreak >= 2) {
      riskScore += 15
      contributions.push(`${input.missedStreak} consecutive sessions missed`)
    }
  }

  // --- Recent Absences (KPI 3) — additional weight on top of streak ---
  if (input.recentAbsenceCount !== null && input.recentAbsenceCount >= 2) {
    riskScore += 10
    // No inputsAvailable++ — this is derived from same data as attendance rate
  }

  // --- Time in Current Level ---
  if (input.enrolledAt) {
    inputsAvailable++
    const days = Math.round(daysSince(input.enrolledAt))
    if (days > 180) {
      riskScore += 20
      contributions.push(`In current level for ${days} days — exceeds 180-day threshold`)
    } else if (days > 120) {
      riskScore += 10
      contributions.push(`In current level for ${days} days — exceeds 120-day threshold`)
    }
  }

  // --- Coach Observation Gap ---
  if (input.lastObservationAt) {
    inputsAvailable++
    const days = Math.round(daysSince(input.lastObservationAt))
    if (days > 21) {
      riskScore += 25
      contributions.push(`No coach observation in ${days} days — exceeds 21-day threshold`)
    } else if (days > 14) {
      riskScore += 15
      contributions.push(`No coach observation in ${days} days — exceeds 14-day threshold`)
    }
  } else {
    inputsAvailable++
    riskScore += 20
    contributions.push('No coach observations on record')
  }

  // --- Active High-Severity Signal ---
  if (input.hasActiveHighSeveritySignal) {
    inputsAvailable++
    riskScore += 20
    if (input.activeSignalTitles.length > 0) {
      contributions.push(`Active high-severity signal: "${input.activeSignalTitles[0]}"`)
    } else {
      contributions.push('Active high-severity development signal')
    }
  }

  // --- Parent Update Gap ---
  if (input.lastParentUpdateAt) {
    inputsAvailable++
    const days = Math.round(daysSince(input.lastParentUpdateAt))
    if (days > 60) {
      riskScore += 10
      contributions.push(`No parent update draft in ${days} days`)
    }
  }

  // --- Advancement block (soft signal, no score contribution) ---
  if (input.advancementEligible === false) {
    contributions.push('Not yet eligible for advancement per curriculum state')
  }

  // --- Determine composite status and label ---
  if (inputsAvailable < 2) {
    return {
      kpiResult: {
        kpiId: 15,
        name: 'Player Development Health',
        status: 'insufficient_data',
        value: null,
        displayText:
          'Not enough data signals to compute development health. Log coach observations, assign a curriculum level, and record attendance to enable this KPI.',
        caveat:
          'Requires at least attendance records, coach observations, or curriculum state to produce a meaningful assessment.',
      },
      healthLabel: 'Insufficient Data',
      riskScore: 0,
      riskContributions: [],
    }
  }

  const status: KpiStatus = 'partial'
  const clampedScore = Math.min(100, riskScore)

  let healthLabel: DevelopmentHealthLabel
  let displayText: string

  if (clampedScore < 25) {
    healthLabel = 'Healthy'
    displayText = `Development health: Healthy — no significant risk factors (risk score ${clampedScore}/100).`
  } else if (clampedScore < 50) {
    healthLabel = 'Watch'
    displayText = `Development health: Watch — monitor closely (risk score ${clampedScore}/100).`
  } else {
    healthLabel = 'At Risk'
    displayText = `Development health: At Risk — director attention recommended (risk score ${clampedScore}/100).`
  }

  return {
    kpiResult: {
      kpiId: 15,
      name: 'Player Development Health',
      status,
      value: clampedScore,
      displayText,
      caveat:
        'Partial — composite of attendance, curriculum time, coaching coverage, active signals, and parent update recency. Missed streak uses group roster proxy; parent update uses draft creation date, not delivery confirmation.',
    },
    healthLabel,
    riskScore: clampedScore,
    riskContributions: contributions,
  }
}

// ---------------------------------------------------------------------------
// formatDevelopmentHealthForDonna
//
// Converts DevelopmentHealthResult to string lines for DONNA output.
// Always shows health label, risk score, contributing factors, and caveat.
// Component breakdown is shown so the director can inspect the inputs.
// ---------------------------------------------------------------------------

export function formatDevelopmentHealthForDonna(result: DevelopmentHealthResult): string[] {
  const { kpiResult, healthLabel, riskScore, riskContributions } = result

  if (kpiResult.status === 'insufficient_data') {
    return [
      '',
      'DEVELOPMENT HEALTH [insufficient data]:',
      `• ${kpiResult.displayText}`,
    ]
  }

  const statusTag = kpiResult.status === 'partial' ? '[partial]' : '[demo]'
  const lines: string[] = [
    '',
    `DEVELOPMENT HEALTH ${statusTag}: ${healthLabel} — risk score ${riskScore}/100`,
  ]

  if (riskContributions.length > 0) {
    lines.push('Risk factors:')
    for (const factor of riskContributions) {
      lines.push(`  • ${factor}`)
    }
  } else {
    lines.push('  No risk factors identified from available data.')
  }

  if (kpiResult.caveat) {
    lines.push(`  ↳ ${kpiResult.caveat}`)
  }

  return lines
}
