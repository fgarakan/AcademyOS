// Sprint 761 — Director Dashboard KPI Wiring V1
// Sprint 762 — Director Dashboard KPI Engine Live Wiring V1
//   Added: recap_completion_rate wired via coachExecutionKpiEngine (partial).
//   Added: stalledPlayerCount from enrolled_at enriches level_readiness provenance note.
// Pure UI component — no DB calls, no Supabase imports.
// Accepts pre-computed props from the director page server component.
// Renders 4 grouped KPI sections with formal health-status framework.

import Link from 'next/link'
import { BarChart2, ChevronRight, Info } from 'lucide-react'
import {
  ACADEMY_KPI_META,
  buildKpiValue,
  getOverallAcademyHealth,
  type AcademyKpiId,
  type KpiValue,
  type KpiStatus,
} from '@/lib/kpis/academyKpiModel'

// ── Props ──────────────────────────────────────────────────────────────────────

export interface DirectorKpiHealthSectionProps {
  activePlayers: number
  advancementReadyCount: number
  curriculumExecutionPct: number   // players-with-level / activePlayers * 100 — partial proxy
  pendingWrapUpsCount: number      // pending wrap-up count — signal only, not completion rate
  improvingCount: number           // players with positive score delta
  // Sprint 762 additions
  recapCompletionPct: number | null  // from computeRecapCompletionRate() — partial (any voice_note counts)
  stalledPlayerCount: number         // players enrolled >180d, not yet advancement-eligible
}

// ── KPI group definitions (mirrors kpiDashboard.ts section structure) ─────────

interface KpiGroup {
  label: string
  kpiIds: AcademyKpiId[]
}

const KPI_GROUPS: KpiGroup[] = [
  {
    label: 'Attendance & Engagement',
    kpiIds: ['attendance_rate', 'level_readiness_queue_size', 'player_progress_velocity'],
  },
  {
    label: 'Coach Operations',
    kpiIds: ['recap_completion_rate', 'coach_followthrough_rate'],
  },
  {
    label: 'Development Health',
    kpiIds: ['curriculum_coverage', 'player_priority_coverage', 'mental_performance_coverage'],
  },
  {
    label: 'Retention & Growth',
    kpiIds: ['parent_summary_freshness', 'template_usage_rate', 'badge_progress_rate'],
  },
]

// ── Status styling ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<KpiStatus, { dot: string; num: string; bg: string; border: string; label: string }> = {
  healthy:  { dot: 'bg-status-green',  num: 'text-status-green',  bg: 'bg-status-green/5',  border: 'border-status-green/20',  label: 'Healthy' },
  warning:  { dot: 'bg-status-orange', num: 'text-status-orange', bg: 'bg-status-orange/5', border: 'border-status-orange/20', label: 'Review' },
  critical: { dot: 'bg-status-red',    num: 'text-status-red',    bg: 'bg-status-red/5',    border: 'border-status-red/20',    label: 'Critical' },
  no_data:  { dot: 'bg-text-muted',    num: 'text-text-muted',    bg: 'bg-surface-raised',  border: 'border-border',           label: 'No data' },
}

const OVERALL_STYLES: Record<KpiStatus, { text: string; badge: string }> = {
  healthy:  { text: 'text-status-green',  badge: 'bg-status-green/10 border-status-green/30 text-status-green' },
  warning:  { text: 'text-status-orange', badge: 'bg-status-orange/10 border-status-orange/30 text-status-orange' },
  critical: { text: 'text-status-red',    badge: 'bg-status-red/10 border-status-red/30 text-status-red' },
  no_data:  { text: 'text-text-muted',    badge: 'bg-surface-raised border-border text-text-muted' },
}

// ── Data provenance label ──────────────────────────────────────────────────────

type DataProvenance = 'live' | 'partial' | 'no_data'

const PROVENANCE_LABEL: Record<DataProvenance, string> = {
  live:     'live',
  partial:  'partial',
  no_data:  'no data',
}

const PROVENANCE_STYLE: Record<DataProvenance, string> = {
  live:    'text-lime/70',
  partial: 'text-text-muted',
  no_data: 'text-text-muted/50',
}

// ── KPI value builder ──────────────────────────────────────────────────────────

interface KpiEntry {
  kpiValue: KpiValue
  provenance: DataProvenance
  provenanceNote: string
}

function buildKpiEntries(props: DirectorKpiHealthSectionProps): Map<AcademyKpiId, KpiEntry> {
  const map = new Map<AcademyKpiId, KpiEntry>()

  // ── level_readiness_queue_size — LIVE
  // Directly computed from player_curriculum_states.advancement_eligible in page.tsx.
  // Lower is better: 0 = healthy, 1–3 = warning, >3 = critical.
  // Sprint 762: enriched with stalledPlayerCount from enrolled_at data.
  const stalledNote = props.stalledPlayerCount > 0
    ? ` Also: ${props.stalledPlayerCount} player${props.stalledPlayerCount !== 1 ? 's' : ''} enrolled >180 days without advancement.`
    : ''
  map.set('level_readiness_queue_size', {
    kpiValue: buildKpiValue('level_readiness_queue_size', props.advancementReadyCount),
    provenance: 'live',
    provenanceNote: `From player_curriculum_states.advancement_eligible — director page query.${stalledNote}`,
  })

  // ── curriculum_coverage — PARTIAL (proxy)
  // curriculumExecutionPct = playersWithLevel / activePlayers * 100.
  // True KPI: % of active curriculum requirements with at least one evidence record.
  // Proxy: % of active players assigned a curriculum level. Directionally correct.
  map.set('curriculum_coverage', {
    kpiValue: buildKpiValue('curriculum_coverage', props.activePlayers > 0 ? props.curriculumExecutionPct : null),
    provenance: 'partial',
    provenanceNote: 'Proxy: % of active players with a curriculum level assigned (true coverage requires evidence records)',
  })

  // ── recap_completion_rate — PARTIAL (Sprint 762: now engine-wired)
  // computeRecapCompletionRate() from coachExecutionKpiEngine called in page.tsx.
  // Value = % of completed sessions (last 30d) that have any voice_note.
  // Caveat: voice_notes has no recap_type column — any note counts as a recap.
  // null when no completed sessions exist in the 30-day window.
  map.set('recap_completion_rate', {
    kpiValue: buildKpiValue('recap_completion_rate', props.recapCompletionPct),
    provenance: props.recapCompletionPct !== null ? 'partial' : 'no_data',
    provenanceNote: props.recapCompletionPct !== null
      ? 'From sessions (completed, 30d) + voice_notes presence — via coachExecutionKpiEngine. Any voice_note counts (no recap_type column yet — data model gap G8).'
      : 'No completed sessions found in last 30 days — collecting data',
  })

  // ── attendance_rate — no_data
  // Needs session_attendance records + expected attendees per session.
  map.set('attendance_rate', {
    kpiValue: buildKpiValue('attendance_rate', null),
    provenance: 'no_data',
    provenanceNote: 'Requires session_attendance rollup per player — available from /director/kpi',
  })

  // ── player_progress_velocity — no_data
  // Needs average requirements advancing per player per month (60d evidence history).
  // stalledPlayerCount is surfaced on level_readiness_queue_size instead
  // (different metric — not comparable to the velocity ratio threshold).
  map.set('player_progress_velocity', {
    kpiValue: buildKpiValue('player_progress_velocity', null),
    provenance: 'no_data',
    provenanceNote: 'Requires 60 days of requirement-level evidence progression data',
  })

  // ── coach_followthrough_rate — no_data (partial in model)
  map.set('coach_followthrough_rate', {
    kpiValue: buildKpiValue('coach_followthrough_rate', null),
    provenance: 'no_data',
    provenanceNote: 'Requires priority addressed_at tracking — not yet collected',
  })

  // ── player_priority_coverage — no_data
  // Needs player priorities rollup — not on director home page.
  map.set('player_priority_coverage', {
    kpiValue: buildKpiValue('player_priority_coverage', null),
    provenance: 'no_data',
    provenanceNote: 'Requires player priorities rollup query',
  })

  // ── mental_performance_coverage — no_data (partial in model)
  map.set('mental_performance_coverage', {
    kpiValue: buildKpiValue('mental_performance_coverage', null),
    provenance: 'no_data',
    provenanceNote: 'Requires mental performance pathway tagging in curriculum',
  })

  // ── parent_summary_freshness — no_data
  map.set('parent_summary_freshness', {
    kpiValue: buildKpiValue('parent_summary_freshness', null),
    provenance: 'no_data',
    provenanceNote: 'Requires parent summary update timestamps — not yet computed on this page',
  })

  // ── template_usage_rate — no_data
  map.set('template_usage_rate', {
    kpiValue: buildKpiValue('template_usage_rate', null),
    provenance: 'no_data',
    provenanceNote: 'Requires sessions-with-template vs. total sessions ratio',
  })

  // ── badge_progress_rate — no_data (unavailable in model)
  map.set('badge_progress_rate', {
    kpiValue: buildKpiValue('badge_progress_rate', null),
    provenance: 'no_data',
    provenanceNote: 'Badge system not yet wired to live data',
  })

  // ── mission_completion_rate — no_data (unavailable in model)
  map.set('mission_completion_rate', {
    kpiValue: buildKpiValue('mission_completion_rate', null),
    provenance: 'no_data',
    provenanceNote: 'Mission system not yet wired to live data',
  })

  return map
}

// ── KPI row card ───────────────────────────────────────────────────────────────

function KpiRowCard({
  entry,
  kpiId,
}: {
  entry: KpiEntry
  kpiId: AcademyKpiId
}) {
  const meta = ACADEMY_KPI_META[kpiId]
  const { kpiValue, provenance } = entry
  const s = STATUS_STYLES[kpiValue.status]

  return (
    <div className={`${s.bg} border ${s.border} rounded-xl p-3 flex flex-col gap-1.5`}>
      {/* Top row: status dot + label + provenance */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted truncate">
            {meta.label}
          </span>
        </div>
        <span className={`text-[9px] font-medium uppercase tracking-wider shrink-0 ${PROVENANCE_STYLE[provenance]}`}>
          {PROVENANCE_LABEL[provenance]}
        </span>
      </div>

      {/* Value */}
      {kpiValue.status === 'no_data' ? (
        <p className="text-[11px] text-text-muted italic leading-snug">
          Collecting data
        </p>
      ) : (
        <p className={`font-mono font-bold text-xl leading-none ${s.num}`}>
          {kpiValue.formattedValue}
        </p>
      )}

      {/* Description */}
      <p className="text-[10px] text-text-muted leading-snug line-clamp-2">
        {meta.description}
      </p>
    </div>
  )
}

// ── Overall health badge ───────────────────────────────────────────────────────

function OverallHealthBadge({ status }: { status: KpiStatus }) {
  const s = OVERALL_STYLES[status]
  const label: Record<KpiStatus, string> = {
    healthy:  'All tracked KPIs healthy',
    warning:  'Some KPIs below target',
    critical: 'KPIs need attention',
    no_data:  'Ready for live data',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${s.badge}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label[status]}
    </span>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

export function DirectorKpiHealthSection(props: DirectorKpiHealthSectionProps) {
  const kpiEntries = buildKpiEntries(props)

  // Collect KpiValue[] for overall health (only values that have data)
  const allEntries = Array.from(kpiEntries.values())
  const allValues: KpiValue[] = allEntries
    .filter(e => e.kpiValue.status !== 'no_data')
    .map(e => e.kpiValue)

  const overallHealth: KpiStatus = allValues.length > 0
    ? getOverallAcademyHealth(allValues)
    : 'no_data'

  // Count by provenance across all KPIs
  const liveCount = allEntries.filter(e => e.provenance === 'live').length
  const partialCount = allEntries.filter(e => e.provenance === 'partial').length
  const noDataCount = allEntries.filter(e => e.provenance === 'no_data').length

  return (
    <div>
      {/* Section header */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-text-muted" />
            <p className="label-xs">Academy KPI Health</p>
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">
            Formal health-status framework using defined thresholds.
            {liveCount > 0 && ` ${liveCount} live.`}
            {partialCount > 0 && ` ${partialCount} partial.`}
            {noDataCount > 0 && ` ${noDataCount} collecting data.`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <OverallHealthBadge status={overallHealth} />
          <Link
            href="/director/kpi"
            className="text-xs text-lime hover:opacity-80 font-medium flex items-center gap-0.5"
          >
            Full analysis
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* KPI groups */}
      <div className="space-y-5">
        {KPI_GROUPS.map(group => {
          const groupEntries = group.kpiIds
            .map(id => ({ id, entry: kpiEntries.get(id) }))
            .filter((x): x is { id: AcademyKpiId; entry: KpiEntry } => !!x.entry)

          return (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
                {group.label}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {groupEntries.map(({ id, entry }) => (
                  <KpiRowCard key={id} kpiId={id} entry={entry} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Honesty footer */}
      <div className="flex items-start gap-2 mt-4 px-3 py-2.5 rounded-lg bg-surface-raised border border-border">
        <Info className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-snug">
          <span className="font-semibold text-text-secondary">Data sources: </span>
          <span className="text-lime/80">live</span> — direct DB query on this page.{' '}
          <span className="text-text-secondary">partial</span> — engine-derived or proxy (directionally correct, includes known caveat).{' '}
          <span className="opacity-60">Collecting data</span> — KPI engine not yet wired; visit{' '}
          <Link href="/director/kpi" className="underline underline-offset-2 hover:text-lime">
            KPI Dashboard
          </Link>{' '}
          for per-player signals.
        </p>
      </div>
    </div>
  )
}
