// Sprint 473 — Director KPI Dashboard Builder V1
// Connects the kpi/ computation engines to a director-facing dashboard view model.
// Pure TypeScript — accepts pre-computed KpiResult[], returns dashboard rows.
// No DB calls. No Supabase imports.

import type { KpiResult } from '@/lib/kpi/kpiTypes'

export type KpiDashboardStatus = 'healthy' | 'warning' | 'critical' | 'no_data'

export interface KpiDashboardRow {
  kpiId: number
  name: string
  status: KpiDashboardStatus
  value: number | null
  displayText: string
  caveat: string | null
  isAvailable: boolean
  trendLabel: string | null
}

export interface KpiDashboardSection {
  label: string
  rows: KpiDashboardRow[]
}

export interface KpiDashboard {
  sections: KpiDashboardSection[]
  overallHealth: KpiDashboardStatus
  healthSummary: string
  criticalCount: number
  warningCount: number
  healthyCount: number
  unavailableCount: number
  generatedAt: string
}

// KPI groupings for the director dashboard
const KPI_SECTIONS: Array<{ label: string; kpiIds: number[] }> = [
  { label: 'Attendance & Engagement', kpiIds: [1, 2, 3, 9] },
  { label: 'Coach Operations', kpiIds: [4, 5] },
  { label: 'Development Health', kpiIds: [6, 7, 10] },
  { label: 'Retention & Growth', kpiIds: [8, 11, 12] },
]

function kpiResultToStatus(result: KpiResult): KpiDashboardStatus {
  if (result.status === 'insufficient_data') return 'no_data'
  if (result.value === null) return 'no_data'
  // Availability is at the KPI engine level; no threshold logic here — engines own it
  if (result.status === 'live') return 'healthy'
  if (result.status === 'partial') return 'warning'
  if (result.status === 'demo') return 'warning'
  return 'no_data'
}

function trendLabel(value: number | null, previous: number | null): string | null {
  if (value === null || previous === null) return null
  const delta = value - previous
  if (Math.abs(delta) < 0.5) return 'stable'
  return delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)
}

export function buildKpiDashboardRow(
  result: KpiResult,
  previousValue?: number | null,
): KpiDashboardRow {
  const status = kpiResultToStatus(result)
  return {
    kpiId: result.kpiId,
    name: result.name,
    status,
    value: result.value,
    displayText: result.displayText,
    caveat: result.caveat ?? null,
    isAvailable: result.status !== 'insufficient_data',
    trendLabel: trendLabel(result.value, previousValue ?? null),
  }
}

export function buildKpiDashboard(
  results: KpiResult[],
  previousValues?: Record<number, number>,
): KpiDashboard {
  const resultMap = new Map<number, KpiResult>()
  for (const r of results) {
    resultMap.set(r.kpiId, r)
  }

  const sections: KpiDashboardSection[] = KPI_SECTIONS.map(section => ({
    label: section.label,
    rows: section.kpiIds
      .map(id => {
        const r = resultMap.get(id)
        if (!r) return null
        return buildKpiDashboardRow(r, previousValues?.[id] ?? null)
      })
      .filter((row): row is KpiDashboardRow => row !== null),
  })).filter(s => s.rows.length > 0)

  // Rows not in any section (future KPIs)
  const assignedIds = new Set(KPI_SECTIONS.flatMap(s => s.kpiIds))
  const unassigned = results
    .filter(r => !assignedIds.has(r.kpiId))
    .map(r => buildKpiDashboardRow(r))

  if (unassigned.length > 0) {
    sections.push({ label: 'Other KPIs', rows: unassigned })
  }

  const allRows = sections.flatMap(s => s.rows)
  const criticalCount = allRows.filter(r => r.status === 'critical').length
  const warningCount = allRows.filter(r => r.status === 'warning').length
  const healthyCount = allRows.filter(r => r.status === 'healthy').length
  const unavailableCount = allRows.filter(r => !r.isAvailable).length

  const overallHealth: KpiDashboardStatus =
    criticalCount > 0 ? 'critical' :
    warningCount > 0 ? 'warning' :
    healthyCount > 0 ? 'healthy' : 'no_data'

  return {
    sections,
    overallHealth,
    healthSummary: buildHealthSummary(criticalCount, warningCount, healthyCount, unavailableCount),
    criticalCount,
    warningCount,
    healthyCount,
    unavailableCount,
    generatedAt: new Date().toISOString(),
  }
}

function buildHealthSummary(
  criticalCount: number,
  warningCount: number,
  healthyCount: number,
  unavailableCount: number,
): string {
  if (criticalCount > 0) {
    return `${criticalCount.toString()} KPI${criticalCount > 1 ? 's' : ''} critical — immediate attention needed.`
  }
  if (warningCount > 0) {
    return `${warningCount.toString()} KPI${warningCount > 1 ? 's' : ''} below target — review this week.`
  }
  if (healthyCount > 0) {
    return `All tracked KPIs are healthy.`
  }
  return `KPI data is not yet available for this academy.`
}

export function getTopKpiConcerns(dashboard: KpiDashboard, limit = 3): KpiDashboardRow[] {
  const ranked = dashboard.sections
    .flatMap(s => s.rows)
    .filter(r => r.status === 'critical' || r.status === 'warning')
    .sort((a, b) => {
      if (a.status === 'critical' && b.status !== 'critical') return -1
      if (b.status === 'critical' && a.status !== 'critical') return 1
      return 0
    })
  return ranked.slice(0, limit)
}

export function formatKpiSummaryLine(row: KpiDashboardRow): string {
  const trend = row.trendLabel ? ` (${row.trendLabel})` : ''
  const caveatNote = row.caveat ? ` — note: ${row.caveat}` : ''
  return `${row.name}: ${row.displayText}${trend}${caveatNote}`
}
