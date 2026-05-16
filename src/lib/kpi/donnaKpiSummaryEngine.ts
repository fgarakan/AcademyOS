// DONNA KPI Summary Engine — Sprint 431
//
// Pure TypeScript. No DB calls. No Supabase imports. No async.
//
// Aggregates per-player KPI results into a structured PlayerKpiSummary object.
// Produces a single DONNA-readable text block from all KPI engine outputs.
//
// This is an orchestration layer — it takes already-computed KpiResult objects
// from the individual engines and organises them into a coherent summary.
// No new data is fetched here.

import { type KpiResult } from './kpiTypes'

// ---------------------------------------------------------------------------
// PlayerKpiSummary — structured aggregate of all per-player KPI results
// ---------------------------------------------------------------------------

export interface PlayerKpiSummary {
  playerId: string
  generatedAt: string                    // ISO timestamp
  attendance: KpiResult[]               // KPIs 1, 2, 3, 9
  developmentHealth: KpiResult | null   // KPI 15
  developmentVelocity: KpiResult[]      // KPIs 12, 13 + stalled flag
  evidenceCoverage: KpiResult[]         // KPIs 14, 22
  sessionYield: KpiResult | null        // KPI 25
  coachExecution: KpiResult[]           // KPI 19 (per-player)
  parentTrust: KpiResult | null         // KPI 21
  dropoutRisk: KpiResult | null         // per-player dropout risk signal
  liveCount: number
  partialCount: number
  demoCount: number
  insufficientCount: number
  totalKpis: number
}

// ---------------------------------------------------------------------------
// buildPlayerKpiSummary
// ---------------------------------------------------------------------------

export function buildPlayerKpiSummary(params: {
  playerId: string
  attendanceResults: KpiResult[]
  developmentHealthResult: KpiResult | null
  velocityResults: KpiResult[]
  evidenceResults: KpiResult[]
  sessionYieldResult: KpiResult | null
  coachExecutionResults: KpiResult[]
  parentTrustResult: KpiResult | null
  dropoutRiskResult: KpiResult | null
}): PlayerKpiSummary {
  const allResults: KpiResult[] = [
    ...params.attendanceResults,
    ...(params.developmentHealthResult ? [params.developmentHealthResult] : []),
    ...params.velocityResults,
    ...params.evidenceResults,
    ...(params.sessionYieldResult ? [params.sessionYieldResult] : []),
    ...params.coachExecutionResults,
    ...(params.parentTrustResult ? [params.parentTrustResult] : []),
    ...(params.dropoutRiskResult ? [params.dropoutRiskResult] : []),
  ]

  const liveCount = allResults.filter(r => r.status === 'live').length
  const partialCount = allResults.filter(r => r.status === 'partial').length
  const demoCount = allResults.filter(r => r.status === 'demo').length
  const insufficientCount = allResults.filter(r => r.status === 'insufficient_data').length

  return {
    playerId: params.playerId,
    generatedAt: new Date().toISOString(),
    attendance: params.attendanceResults,
    developmentHealth: params.developmentHealthResult,
    developmentVelocity: params.velocityResults,
    evidenceCoverage: params.evidenceResults,
    sessionYield: params.sessionYieldResult,
    coachExecution: params.coachExecutionResults,
    parentTrust: params.parentTrustResult,
    dropoutRisk: params.dropoutRiskResult,
    liveCount,
    partialCount,
    demoCount,
    insufficientCount,
    totalKpis: allResults.length,
  }
}

// ---------------------------------------------------------------------------
// formatKpiSummaryForDonna
//
// Produces a terse DONNA-readable header line summarising the data quality
// across all KPIs for this player. Appended at the top of the DONNA output
// so the director knows upfront what is live vs. estimated vs. unavailable.
// ---------------------------------------------------------------------------

export function formatKpiSummaryForDonna(summary: PlayerKpiSummary): string[] {
  const { liveCount, partialCount, demoCount, insufficientCount, totalKpis } = summary

  const qualityParts: string[] = []
  if (liveCount > 0) qualityParts.push(`${liveCount} live`)
  if (partialCount > 0) qualityParts.push(`${partialCount} partial`)
  if (demoCount > 0) qualityParts.push(`${demoCount} demo`)
  if (insufficientCount > 0) qualityParts.push(`${insufficientCount} data gaps`)

  const qualityLine =
    qualityParts.length > 0
      ? `KPI coverage: ${totalKpis} signals — ${qualityParts.join(', ')}.`
      : `KPI coverage: ${totalKpis} signals computed.`

  return ['', qualityLine]
}
