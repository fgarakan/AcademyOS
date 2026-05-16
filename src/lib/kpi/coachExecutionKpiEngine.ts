// Coach Execution KPI Engine — Sprint 426
//
// Pure TypeScript. No DB calls. No Supabase imports. No async.
// Accepts pre-fetched plain-object data from the calling server action.
//
// KPIs implemented:
//   KPI 19 — Coach Observation Quality Score   (demo — per-player context)
//   KPI 4  — Coach Recap Completion Rate       (partial — voice_notes proxy)
//
// KPI 19 is demo: schema is complete; tag population and observation frequency
//   depend on coach discipline. Computed here in per-player context (quality
//   of observations recorded for this specific player).
//
// KPI 4 is partial: voice_notes does not have a recap_type column. All voice
//   notes (quick captures, full recaps, observations) go to the same table.
//   Cannot distinguish a full structured recap from a one-liner. This is an
//   approximation — sessions with any voice_note count as "recapped".

import { type KpiResult, type KpiStatus } from './kpiTypes'

// ---------------------------------------------------------------------------
// Input shapes — plain objects only, no DB types imported
// ---------------------------------------------------------------------------

export interface ObservationRow {
  content: string
  observation_type: string
  created_at: string
  tags: string[] | null
  ai_parsed: boolean
}

export interface RecapCheckRow {
  session_id: string
  has_note: boolean   // true if a voice_note exists for this session
}

// ---------------------------------------------------------------------------
// KPI 19 — Coach Observation Quality Score (per-player context)
//
// Status: demo
// Computes quality of observations recorded FOR THIS PLAYER specifically.
// Dimensions:
//   - % of observations with tags populated (max 35 pts)
//   - % of observations with ai_parsed = true (max 35 pts)
//   - Observation frequency — count in 30d (informational, max 30 pts)
// ---------------------------------------------------------------------------

export function computeObservationQuality(
  observations: ObservationRow[],
  windowDays: number = 30,
): KpiResult {
  const status: KpiStatus = 'demo'

  if (observations.length === 0) {
    return {
      kpiId: 19,
      name: 'Observation Quality Score',
      status,
      value: null,
      displayText: `No coach observations recorded for this player in the last ${windowDays} days.`,
      caveat:
        'Score requires at least one coach observation. Ask coaches to log observations after sessions.',
    }
  }

  const total = observations.length
  const taggedCount = observations.filter(o => Array.isArray(o.tags) && o.tags.length > 0).length
  const parsedCount = observations.filter(o => o.ai_parsed === true).length

  const taggedPct = Math.round((taggedCount / total) * 100)
  const parsedPct = Math.round((parsedCount / total) * 100)

  // Score: 35 pts for tagged, 35 pts for ai_parsed, 30 pts for frequency (≥3 = full)
  const tagScore = Math.round((taggedCount / total) * 35)
  const parsedScore = Math.round((parsedCount / total) * 35)
  const frequencyScore = Math.min(30, Math.round((Math.min(total, 3) / 3) * 30))
  const totalScore = tagScore + parsedScore + frequencyScore

  let qualityLabel: string
  if (totalScore >= 70) {
    qualityLabel = 'Good'
  } else if (totalScore >= 40) {
    qualityLabel = 'Moderate'
  } else {
    qualityLabel = 'Low'
  }

  const displayText =
    `${qualityLabel} — ${total} observation${total !== 1 ? 's' : ''} in last ${windowDays} days. ` +
    `${taggedPct}% tagged, ${parsedPct}% structured (ai_parsed). Score: ${totalScore}/100.`

  return {
    kpiId: 19,
    name: 'Observation Quality Score',
    status,
    value: totalScore,
    denominator: total,
    displayText,
    caveat:
      'Demo — quality score based on tag usage (35 pts), structured parse (35 pts), and frequency (30 pts). Reflects observations for this player only. Tag discipline is coach-dependent.',
  }
}

// ---------------------------------------------------------------------------
// KPI 4 — Coach Recap Completion Rate
//
// Status: partial
// Accepts a list of completed sessions in the window and whether each has
// a voice_note. Returns the completion rate as an approximation.
//
// Why partial: voice_notes has no recap_type column. Any note (quick capture,
// observation, full recap) counts as a "recap". This overstates true structured
// recap coverage. A recap_type column (gap G8) would make this accurate.
// ---------------------------------------------------------------------------

export function computeRecapCompletionRate(
  recapChecks: RecapCheckRow[],
  windowDays: number = 30,
): KpiResult {
  const status: KpiStatus = 'partial'

  if (recapChecks.length === 0) {
    return {
      kpiId: 4,
      name: 'Coach Recap Completion Rate',
      status,
      value: null,
      displayText: `No completed sessions found in the last ${windowDays} days to check for recaps.`,
      caveat:
        'Partial — session recap tracking requires completed sessions. No sessions found in window.',
    }
  }

  const total = recapChecks.length
  const withNote = recapChecks.filter(r => r.has_note).length
  const pct = Math.round((withNote / total) * 100)

  const displayText = `${withNote} of ${total} sessions have a recap note (${pct}%) in the last ${windowDays} days.`

  return {
    kpiId: 4,
    name: 'Coach Recap Completion Rate',
    status,
    value: pct,
    denominator: total,
    displayText,
    caveat:
      'Partial — any voice_note counts as a recap. Cannot distinguish a full structured recap from a quick note. Requires a recap_type column on voice_notes (data model gap G8) for precise tracking.',
  }
}

// ---------------------------------------------------------------------------
// formatCoachExecutionForDonna
//
// Converts KpiResult[] to DONNA output lines.
// Shows status tag and caveat for non-live KPIs.
// ---------------------------------------------------------------------------

export function formatCoachExecutionForDonna(results: KpiResult[]): string[] {
  if (results.length === 0) return []

  const lines: string[] = ['', 'COACHING QUALITY:']

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
