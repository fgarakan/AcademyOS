// Sprint 465 — Academy KPI Model V1
// Defines the academy health KPI model, calculation contracts, and availability metadata.
// No DB calls. Pure types and computation contracts. Server-side only.

// ── KPI identifiers ────────────────────────────────────────────────────────────

export type AcademyKpiId =
  | 'attendance_rate'
  | 'recap_completion_rate'
  | 'player_priority_coverage'
  | 'parent_summary_freshness'
  | 'curriculum_coverage'
  | 'template_usage_rate'
  | 'coach_followthrough_rate'
  | 'player_progress_velocity'
  | 'level_readiness_queue_size'
  | 'mission_completion_rate'
  | 'badge_progress_rate'
  | 'mental_performance_coverage'

// ── KPI metadata ──────────────────────────────────────────────────────────────

export type KpiAvailability = 'live' | 'partial' | 'unavailable'
export type KpiPolarity = 'higher_is_better' | 'lower_is_better'
export type KpiUnit = 'percent' | 'count' | 'days' | 'sessions' | 'ratio'

export interface AcademyKpiMeta {
  id: AcademyKpiId
  label: string
  description: string
  unit: KpiUnit
  polarity: KpiPolarity
  availability: KpiAvailability
  unavailableReason?: string          // why it's partial or unavailable
  thresholds: {
    healthy: number                   // value at or above (for higher_is_better) is healthy
    warning: number                   // value at or above is warning, below is critical
  }
}

export const ACADEMY_KPI_META: Record<AcademyKpiId, AcademyKpiMeta> = {
  attendance_rate: {
    id: 'attendance_rate',
    label: 'Attendance Rate',
    description: 'Percentage of expected players present across all sessions',
    unit: 'percent',
    polarity: 'higher_is_better',
    availability: 'live',
    thresholds: { healthy: 85, warning: 70 },
  },
  recap_completion_rate: {
    id: 'recap_completion_rate',
    label: 'Recap Completion',
    description: 'Percentage of completed sessions with a submitted wrap-up',
    unit: 'percent',
    polarity: 'higher_is_better',
    availability: 'live',
    thresholds: { healthy: 90, warning: 70 },
  },
  player_priority_coverage: {
    id: 'player_priority_coverage',
    label: 'Priority Coverage',
    description: 'Percentage of active players with at least one active priority',
    unit: 'percent',
    polarity: 'higher_is_better',
    availability: 'live',
    thresholds: { healthy: 80, warning: 50 },
  },
  parent_summary_freshness: {
    id: 'parent_summary_freshness',
    label: 'Parent Summary Freshness',
    description: 'Percentage of active players with a parent-approved summary updated in the last 30 days',
    unit: 'percent',
    polarity: 'higher_is_better',
    availability: 'live',
    thresholds: { healthy: 70, warning: 40 },
  },
  curriculum_coverage: {
    id: 'curriculum_coverage',
    label: 'Curriculum Coverage',
    description: 'Percentage of active curriculum requirements with at least one evidence record',
    unit: 'percent',
    polarity: 'higher_is_better',
    availability: 'live',
    thresholds: { healthy: 60, warning: 30 },
  },
  template_usage_rate: {
    id: 'template_usage_rate',
    label: 'Template Usage',
    description: 'Percentage of sessions planned using a curriculum-aligned template',
    unit: 'percent',
    polarity: 'higher_is_better',
    availability: 'live',
    thresholds: { healthy: 70, warning: 40 },
  },
  coach_followthrough_rate: {
    id: 'coach_followthrough_rate',
    label: 'Coach Follow-Through',
    description: 'Percentage of coach-created player priorities that were addressed within 4 weeks',
    unit: 'percent',
    polarity: 'higher_is_better',
    availability: 'partial',
    unavailableReason: 'Requires priority addressed_at tracking across sessions',
    thresholds: { healthy: 75, warning: 50 },
  },
  player_progress_velocity: {
    id: 'player_progress_velocity',
    label: 'Progress Velocity',
    description: 'Average number of requirements moving from in_progress to achieved per player per month',
    unit: 'ratio',
    polarity: 'higher_is_better',
    availability: 'partial',
    unavailableReason: 'Requires minimum 60 days of evidence data',
    thresholds: { healthy: 2, warning: 1 },
  },
  level_readiness_queue_size: {
    id: 'level_readiness_queue_size',
    label: 'Level Readiness Queue',
    description: 'Number of players with promotion_ready=true awaiting director decision',
    unit: 'count',
    polarity: 'lower_is_better',
    availability: 'live',
    thresholds: { healthy: 0, warning: 3 },
  },
  mission_completion_rate: {
    id: 'mission_completion_rate',
    label: 'Mission Completion',
    description: 'Percentage of assigned missions completed by players',
    unit: 'percent',
    polarity: 'higher_is_better',
    availability: 'unavailable',
    unavailableReason: 'Mission table pending Sprint 496 implementation',
    thresholds: { healthy: 60, warning: 30 },
  },
  badge_progress_rate: {
    id: 'badge_progress_rate',
    label: 'Badge Progress',
    description: 'Percentage of active players with at least one badge in progress or earned',
    unit: 'percent',
    polarity: 'higher_is_better',
    availability: 'unavailable',
    unavailableReason: 'Badge table pending Sprint 492 implementation',
    thresholds: { healthy: 50, warning: 20 },
  },
  mental_performance_coverage: {
    id: 'mental_performance_coverage',
    label: 'Mental Performance Coverage',
    description: 'Percentage of active players with at least one mental performance priority',
    unit: 'percent',
    polarity: 'higher_is_better',
    availability: 'partial',
    unavailableReason: 'Requires mental performance pathway to be tagged in curriculum',
    thresholds: { healthy: 50, warning: 20 },
  },
}

// ── KPI value shape ───────────────────────────────────────────────────────────

export type KpiStatus = 'healthy' | 'warning' | 'critical' | 'no_data'

export interface KpiValue {
  id: AcademyKpiId
  value: number | null
  status: KpiStatus
  formattedValue: string
  trend?: 'up' | 'down' | 'stable' | null
  trendDelta?: number | null
}

// ── KPI status computation (pure) ─────────────────────────────────────────────

export function computeKpiStatus(id: AcademyKpiId, value: number | null): KpiStatus {
  if (value === null) return 'no_data'
  const meta = ACADEMY_KPI_META[id]
  if (meta.polarity === 'higher_is_better') {
    if (value >= meta.thresholds.healthy) return 'healthy'
    if (value >= meta.thresholds.warning) return 'warning'
    return 'critical'
  } else {
    if (value <= meta.thresholds.healthy) return 'healthy'
    if (value <= meta.thresholds.warning) return 'warning'
    return 'critical'
  }
}

export function formatKpiValue(id: AcademyKpiId, value: number | null): string {
  if (value === null) return '—'
  const meta = ACADEMY_KPI_META[id]
  if (meta.unit === 'percent') return `${Math.round(value)}%`
  if (meta.unit === 'ratio') return value.toFixed(1)
  if (meta.unit === 'count') return String(Math.round(value))
  return String(value)
}

export function buildKpiValue(
  id: AcademyKpiId,
  value: number | null,
  trend?: { delta: number; direction: 'up' | 'down' | 'stable' } | null,
): KpiValue {
  return {
    id,
    value,
    status: computeKpiStatus(id, value),
    formattedValue: formatKpiValue(id, value),
    trend: trend?.direction ?? null,
    trendDelta: trend?.delta ?? null,
  }
}

// Returns KPIs that are available (live or partial) for the current build state.
export function getAvailableKpis(): AcademyKpiId[] {
  return (Object.keys(ACADEMY_KPI_META) as AcademyKpiId[]).filter(
    id => ACADEMY_KPI_META[id].availability !== 'unavailable',
  )
}

// Returns a summary status across all available KPIs.
export function getOverallAcademyHealth(values: KpiValue[]): KpiStatus {
  if (values.some(v => v.status === 'critical')) return 'critical'
  if (values.some(v => v.status === 'warning')) return 'warning'
  if (values.every(v => v.status === 'healthy')) return 'healthy'
  return 'no_data'
}
