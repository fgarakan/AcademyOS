// Group Health and Fit KPI Engine — Sprint 428
//
// Pure TypeScript. No DB calls. No Supabase imports. No async.
// Accepts pre-fetched plain-object data from the calling server action.
//
// KPIs implemented:
//   KPI 16 — Group Health Score             (demo — composite of group-level signals)
//   KPI 7  — Player Retention by Group      (demo — requires group_memberships history)
//
// These are GROUP-level KPIs. They are not surfaced in the per-player
// fetchPlayerProgressSummaryAction — they belong in a future group summary
// action. This engine file is a complete, tested utility ready for wiring.
//
// KPI 16 is demo: all inputs exist in schema; score computed at application
//   layer from attendance, recap completion, observations per player, session
//   frequency, and signal flags.
//
// KPI 7 is demo: group_memberships has joined_at and left_at (null = active).
//   Retention = players still active / players who were in group 90 days ago.

import { type KpiResult, type KpiStatus } from './kpiTypes'
import { formatRateDisplay } from './kpiTypes'

// ---------------------------------------------------------------------------
// Input shapes — plain objects only, no DB types imported
// ---------------------------------------------------------------------------

export interface GroupMembershipRow {
  player_id: string
  joined_at: string
  left_at: string | null
  is_current: boolean
}

export interface GroupHealthInput {
  groupId: string
  groupName?: string
  // Attendance rate across all players in the group (average, 0–100)
  averageAttendanceRatePct: number | null
  // % of players with at least one observation in last 14 days
  observationCoveragePct: number | null
  // Recap completion rate for sessions in last 30 days (0–100)
  recapCompletionRatePct: number | null
  // Number of sessions in last 30 days vs. expected (ratio 0–1)
  sessionFrequencyRatio: number | null
  // % of players without an active high-severity signal
  noHighSeveritySignalPct: number | null
  // Count of at-risk players (from development health engine)
  atRiskPlayerCount: number
  totalPlayerCount: number
  windowDays?: number
}

export interface GroupRetentionInput {
  groupId: string
  groupName?: string
  memberships: GroupMembershipRow[]
  windowDays?: number  // lookback window for "was in group N days ago"
}

// ---------------------------------------------------------------------------
// KPI 16 — Group Health Score
//
// Status: demo
// Composite health score (0–100). Higher = healthier group.
// Component weights:
//   Attendance rate:             30 pts
//   Observation coverage:        25 pts
//   Recap completion:            20 pts
//   Session frequency:           15 pts
//   No high-severity signals:    10 pts
// ---------------------------------------------------------------------------

export function computeGroupHealth(input: GroupHealthInput): KpiResult {
  const status: KpiStatus = 'demo'
  const {
    averageAttendanceRatePct,
    observationCoveragePct,
    recapCompletionRatePct,
    sessionFrequencyRatio,
    noHighSeveritySignalPct,
    atRiskPlayerCount,
    totalPlayerCount,
    windowDays = 30,
    groupName,
  } = input

  let inputsAvailable = 0
  let totalScore = 0
  const components: string[] = []

  if (averageAttendanceRatePct !== null) {
    inputsAvailable++
    const pts = Math.round((averageAttendanceRatePct / 100) * 30)
    totalScore += pts
    components.push(`Attendance: ${Math.round(averageAttendanceRatePct)}% (${pts}/30 pts)`)
  }

  if (observationCoveragePct !== null) {
    inputsAvailable++
    const pts = Math.round((observationCoveragePct / 100) * 25)
    totalScore += pts
    components.push(`Observation coverage: ${Math.round(observationCoveragePct)}% (${pts}/25 pts)`)
  }

  if (recapCompletionRatePct !== null) {
    inputsAvailable++
    const pts = Math.round((recapCompletionRatePct / 100) * 20)
    totalScore += pts
    components.push(`Recap completion: ${Math.round(recapCompletionRatePct)}% (${pts}/20 pts)`)
  }

  if (sessionFrequencyRatio !== null) {
    inputsAvailable++
    const ratio = Math.min(1, sessionFrequencyRatio)
    const pts = Math.round(ratio * 15)
    totalScore += pts
    components.push(`Session frequency: ${Math.round(ratio * 100)}% of expected (${pts}/15 pts)`)
  }

  if (noHighSeveritySignalPct !== null) {
    inputsAvailable++
    const pts = Math.round((noHighSeveritySignalPct / 100) * 10)
    totalScore += pts
    components.push(`No high-severity signals: ${Math.round(noHighSeveritySignalPct)}% of players (${pts}/10 pts)`)
  }

  if (inputsAvailable < 2) {
    return {
      kpiId: 16,
      name: 'Group Health Score',
      status: 'insufficient_data',
      value: null,
      displayText: `Not enough data to compute group health score for ${groupName ?? 'this group'}. Record attendance, observations, and sessions to enable this KPI.`,
      caveat: 'Requires at least 2 of: attendance data, observations, recaps, session frequency.',
    }
  }

  const label = totalScore >= 70 ? 'Healthy' : totalScore >= 45 ? 'Moderate' : 'Needs Attention'
  const atRiskNote =
    atRiskPlayerCount > 0
      ? ` ${atRiskPlayerCount} of ${totalPlayerCount} player${totalPlayerCount !== 1 ? 's' : ''} are at risk.`
      : ''

  const displayText = `${label} — score ${totalScore}/100 (last ${windowDays} days).${atRiskNote}`

  return {
    kpiId: 16,
    name: 'Group Health Score',
    status,
    value: totalScore,
    displayText,
    caveat:
      'Demo — composite score from attendance, observation coverage, recap completion, session frequency, and signal flags. All inputs are data-density dependent.',
  }
}

// ---------------------------------------------------------------------------
// KPI 7 — Player Retention by Group
//
// Status: demo
// Retention = players still active / players who were in group N days ago.
// Uses group_memberships.left_at = null as "still active".
// ---------------------------------------------------------------------------

export function computeGroupRetention(input: GroupRetentionInput): KpiResult {
  const status: KpiStatus = 'demo'
  const { memberships, windowDays = 90, groupName } = input

  if (memberships.length === 0) {
    return {
      kpiId: 7,
      name: 'Player Retention by Group',
      status,
      value: null,
      displayText: `No membership history found for ${groupName ?? 'this group'}.`,
      caveat: 'Retention requires group_memberships records with joined_at dates.',
    }
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - windowDays)

  // Players who were in the group N days ago (joined before cutoff)
  const wasInGroup = memberships.filter(m => new Date(m.joined_at) < cutoff)

  if (wasInGroup.length === 0) {
    return {
      kpiId: 7,
      name: 'Player Retention by Group',
      status,
      value: null,
      displayText: `No players were in ${groupName ?? 'this group'} more than ${windowDays} days ago — retention not yet computable.`,
      caveat: 'Retention window requires players with joined_at older than the window.',
    }
  }

  // Of those, how many are still active (left_at = null OR is_current = true)
  const stillActive = wasInGroup.filter(m => m.left_at === null || m.is_current === true).length
  const total = wasInGroup.length

  return {
    kpiId: 7,
    name: 'Player Retention by Group',
    status,
    value: Math.round((stillActive / total) * 100),
    denominator: total,
    displayText: formatRateDisplay(stillActive, total, 'players retained', `${windowDays}-day window`),
    caveat:
      'Demo — retention uses group_memberships.left_at = null as proxy for "still active." Players who transferred to another group may show as retained.',
  }
}
