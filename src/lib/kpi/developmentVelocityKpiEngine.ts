// Development Velocity KPI Engine — Sprint 423
//
// Pure TypeScript. No DB calls. No Supabase imports. No async.
// Accepts pre-fetched plain-object arrays from the calling server action.
// Returns KpiResult[] for display in DONNA's player progress summary.
//
// KPIs implemented:
//   KPI 13 — Time in Current Level     (live)
//   KPI 12 — Development Velocity      (demo)
//
// KPI 13 is live: enrolled_at exists with a NOT NULL default; direct computation.
// KPI 12 is demo: schema complete; useful only once a player has advancement
//   history. Empty history → DONNA explains clearly rather than returning null.

import { type KpiResult, type KpiStatus } from './kpiTypes'

// ---------------------------------------------------------------------------
// Input shapes — plain objects only, no DB types imported
// ---------------------------------------------------------------------------

export interface HistoryRow {
  from_level_id: string | null
  to_level_id: string
  advanced_at: string
}

export interface DevelopmentVelocityInput {
  // From player_curriculum_states
  enrolledAt: string | null
  advancementEligible: boolean | null
  lastEvaluatedAt: string | null
  // From player_curriculum_history
  history: HistoryRow[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysBetween(isoA: string, isoB: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.abs(new Date(isoB).getTime() - new Date(isoA).getTime()) / msPerDay
}

function daysSince(isoDate: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return (Date.now() - new Date(isoDate).getTime()) / msPerDay
}

// ---------------------------------------------------------------------------
// KPI 13 — Time in Current Level
//
// Status: live
// Why: enrolled_at has a default of now() and is reliably populated when a
// curriculum state row is created. Direct arithmetic from enrolled_at to today.
// ---------------------------------------------------------------------------

export function computeTimeInLevel(enrolledAt: string | null): KpiResult {
  const status: KpiStatus = 'live'

  if (!enrolledAt) {
    return {
      kpiId: 13,
      name: 'Time in Current Level',
      status: 'insufficient_data',
      value: null,
      displayText: 'No curriculum state found — level and enrollment date are not set for this player.',
      caveat: 'Assign a curriculum level to enable time-in-level tracking.',
    }
  }

  const days = Math.round(daysSince(enrolledAt))
  const weeks = Math.round(days / 7)

  let displayText: string
  if (days < 14) {
    displayText = `${days} days at current level (under 2 weeks — recently enrolled).`
  } else if (days < 60) {
    displayText = `${days} days (${weeks} weeks) at current level.`
  } else if (days < 120) {
    displayText = `${days} days (${weeks} weeks) at current level — approaching the typical 8–12 week window for review.`
  } else {
    displayText = `${days} days (${weeks} weeks) at current level — director review recommended if advancement has not been evaluated.`
  }

  return {
    kpiId: 13,
    name: 'Time in Current Level',
    status,
    value: days,
    displayText,
  }
}

// ---------------------------------------------------------------------------
// KPI 12 — Development Velocity
//
// Status: demo
// Why: Schema is correct and complete. Velocity is meaningful only once a player
// has at least 2 advancement events. For new academies or players who have never
// advanced, history is empty — DONNA explains this rather than showing null.
// ---------------------------------------------------------------------------

export function computeDevelopmentVelocity(history: HistoryRow[]): KpiResult {
  const status: KpiStatus = 'demo'

  if (history.length === 0) {
    return {
      kpiId: 12,
      name: 'Development Velocity',
      status,
      value: null,
      displayText: 'No advancement history recorded — this player has not yet advanced through any curriculum levels.',
      caveat: 'Velocity becomes computable after the first recorded advancement. This is expected for new players.',
    }
  }

  if (history.length === 1) {
    const entry = history[0]
    return {
      kpiId: 12,
      name: 'Development Velocity',
      status,
      value: null,
      displayText: `1 advancement recorded (to ${entry.to_level_id}). Velocity requires at least 2 advancements to compute an average.`,
      caveat: 'Velocity is computed as the average days between consecutive advancements. Single-advancement players show the event only.',
    }
  }

  // Sort by advanced_at ascending to compute inter-advancement intervals
  const sorted = [...history].sort(
    (a, b) => new Date(a.advanced_at).getTime() - new Date(b.advanced_at).getTime(),
  )

  const intervals: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const days = daysBetween(sorted[i - 1].advanced_at, sorted[i].advanced_at)
    intervals.push(days)
  }

  const avgDays = Math.round(intervals.reduce((sum, d) => sum + d, 0) / intervals.length)
  const minDays = Math.round(Math.min(...intervals))
  const maxDays = Math.round(Math.max(...intervals))

  let displayText: string
  if (intervals.length === 1) {
    displayText = `${avgDays} days between the 2 recorded advancements. More data needed for a reliable average.`
  } else {
    displayText = `Average ${avgDays} days per level advancement (based on ${sorted.length} advancements). Range: ${minDays}–${maxDays} days.`
  }

  return {
    kpiId: 12,
    name: 'Development Velocity',
    status,
    value: avgDays,
    displayText,
    caveat: `Demo — based on ${sorted.length} recorded advancements. Average will stabilize as history grows.`,
  }
}

// ---------------------------------------------------------------------------
// computeDevelopmentVelocityKpis — convenience wrapper
// Returns KPI 13 and KPI 12, plus a stalled-player flag if relevant.
// ---------------------------------------------------------------------------

export function computeDevelopmentVelocityKpis(input: DevelopmentVelocityInput): KpiResult[] {
  const { enrolledAt, advancementEligible, history } = input

  const timeInLevel = computeTimeInLevel(enrolledAt)
  const velocity = computeDevelopmentVelocity(history)

  // Stalled flag: if time in level > 120 days AND not yet eligible for advancement
  const stalledFlag: KpiResult | null = (() => {
    if (!enrolledAt) return null
    const days = Math.round(daysSince(enrolledAt))
    if (days > 120 && advancementEligible === false) {
      return {
        kpiId: 23,
        name: 'Level Stall Flag',
        status: 'live' as KpiStatus,
        value: days,
        displayText: `Player has been at this level for ${days} days without becoming eligible for advancement — consider a curriculum review or evidence observation session.`,
      }
    }
    return null
  })()

  const results: KpiResult[] = [timeInLevel, velocity]
  if (stalledFlag) results.push(stalledFlag)

  return results
}

// ---------------------------------------------------------------------------
// formatDevelopmentVelocityForDonna
//
// Converts KpiResult[] to DONNA output lines.
// Always shows status tag and caveat for non-live KPIs.
// ---------------------------------------------------------------------------

export function formatDevelopmentVelocityForDonna(results: KpiResult[]): string[] {
  if (results.length === 0) return []

  const lines: string[] = ['', 'DEVELOPMENT VELOCITY:']

  for (const r of results) {
    const statusTag =
      r.status === 'live'
        ? '[live]'
        : r.status === 'partial'
        ? '[partial]'
        : r.status === 'demo'
        ? '[demo]'
        : '[insufficient data]'

    lines.push(`• ${r.name} ${statusTag}: ${r.displayText}`)
    if (r.caveat && r.status !== 'live') {
      lines.push(`  ↳ ${r.caveat}`)
    }
  }

  return lines
}
