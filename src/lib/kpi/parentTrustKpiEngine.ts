// Parent Trust KPI Engine — Sprint 427
//
// Pure TypeScript. No DB calls. No Supabase imports. No async.
// Accepts pre-fetched plain-object data from the calling server action.
//
// KPIs implemented:
//   KPI 21 — Parent Trust Coverage         (partial — draft creation as proxy)
//   KPI 5  — Parent Update Frequency       (insufficient_data — no send infrastructure)
//   KPI 6  — Parent Response Rate          (insufficient_data — no response tracking)
//
// KPI 21 is partial: schema complete, but uses draft creation date as a proxy
//   for parent communication. The director has drafted something — this is a
//   measure of "coverage of intent" not actual delivery. No parent sends exist.
//
// KPIs 5 and 6 are insufficient_data: parent_updates.sent_at is always null
//   until a messaging provider is wired. Response tracking does not exist.

import { type KpiResult, type KpiStatus } from './kpiTypes'

// ---------------------------------------------------------------------------
// Input shapes — plain objects only, no DB types imported
// ---------------------------------------------------------------------------

export interface ParentUpdateRow {
  created_at: string
  status: string        // 'draft' | 'approved' | 'sent' | etc.
  sent_at: string | null
}

export interface ParentTrustInput {
  playerId: string
  // All parent update drafts for this player (any status)
  playerParentUpdates: ParentUpdateRow[]
  windowDays?: number
}

// ---------------------------------------------------------------------------
// KPI 21 — Parent Trust Coverage (per-player)
//
// Status: partial
// Measures whether the director has created any parent update draft for this
// player in the last 60 days. Uses draft creation date, not delivery date.
// ---------------------------------------------------------------------------

export function computeParentTrustCoverage(input: ParentTrustInput): KpiResult {
  const { playerParentUpdates, windowDays = 60 } = input
  const status: KpiStatus = 'partial'

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - windowDays)

  const recentDrafts = playerParentUpdates.filter(
    u => new Date(u.created_at) >= cutoff,
  )

  const total = recentDrafts.length
  const mostRecent = recentDrafts
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  let displayText: string
  if (total === 0) {
    displayText = `No parent update drafts created for this player in the last ${windowDays} days. Director attention recommended.`
  } else {
    const msPerDay = 1000 * 60 * 60 * 24
    const daysSinceLatest = Math.round(
      (Date.now() - new Date(mostRecent.created_at).getTime()) / msPerDay,
    )
    displayText =
      `${total} parent update draft${total !== 1 ? 's' : ''} created in the last ${windowDays} days. ` +
      `Most recent: ${daysSinceLatest} day${daysSinceLatest !== 1 ? 's' : ''} ago (${mostRecent.status} status).`
  }

  return {
    kpiId: 21,
    name: 'Parent Trust Coverage',
    status,
    value: total,
    displayText,
    caveat:
      'Partial — measures draft creation, not delivery. Parent communication send infrastructure is not yet wired. A draft created means the director has drafted something; it has not been sent to the parent.',
  }
}

// ---------------------------------------------------------------------------
// Blocked KPI stubs — KPIs 5 and 6
// ---------------------------------------------------------------------------

export function computeParentUpdateFrequencyStub(): KpiResult {
  return {
    kpiId: 5,
    name: 'Parent Update Frequency',
    status: 'insufficient_data',
    value: null,
    displayText:
      'Parent update frequency cannot be computed — parent_updates.sent_at is null for all records. No messaging provider has been wired to this system. Drafts exist internally but have not been sent.',
    caveat:
      'Blocked by: no send infrastructure. All records have sent_at = null. Deferred to Block 3+ when a messaging provider is integrated.',
  }
}

export function computeParentResponseRateStub(): KpiResult {
  return {
    kpiId: 6,
    name: 'Parent Response Rate',
    status: 'insufficient_data',
    value: null,
    displayText:
      'Parent response rate cannot be computed — no inbound parent response tracking exists. Two blockers: (1) no send infrastructure, (2) no parent_responses table or acknowledged_at column.',
    caveat:
      'Blocked by: (1) no send infrastructure, (2) no response tracking schema. Deferred to Block 3+.',
  }
}

// ---------------------------------------------------------------------------
// formatParentTrustForDonna
//
// Converts KpiResult[] to DONNA output lines.
// KPIs 5 and 6 stubs are not surfaced in the per-player summary by default —
// only KPI 21 is shown. The stubs exist for the DONNA KPI summary engine.
// ---------------------------------------------------------------------------

export function formatParentTrustForDonna(result: KpiResult): string[] {
  const statusTag =
    result.status === 'live'
      ? '[live]'
      : result.status === 'partial'
      ? '[partial]'
      : result.status === 'demo'
      ? '[demo]'
      : '[insufficient data]'

  const lines: string[] = [
    '',
    `PARENT COMMUNICATION ${statusTag}: ${result.displayText}`,
  ]

  if (result.caveat && result.status !== 'live') {
    lines.push(`  ↳ ${result.caveat}`)
  }

  return lines
}
