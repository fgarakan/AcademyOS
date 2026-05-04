import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, Calendar, Dumbbell, Swords, Zap } from 'lucide-react'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'

export interface PlayerLoadData {
  sessions_7d: number | null
  sessions_28d: number | null
  duration_7d_min: number | null
  duration_28d_min: number | null
  skill_sessions_28d: number | null
  fitness_sessions_28d: number | null
  competition_sessions_28d: number | null
  overload_flag: boolean | null
  fatigue_risk_score: number | null
  fatigue_risk_label: string | null
  load_trend_7d: string | null
  absences_7d: number | null
  avg_intensity_7d: number | null
  avg_intensity_28d: number | null
  avg_perceived_load_7d: number | null
  avg_perceived_load_28d: number | null
  high_intensity_blocks_7d: number | null
  calculated_at: string | null
}

interface Props {
  load: PlayerLoadData | null
}

function trendIcon(trend: string | null) {
  if (trend === 'increasing') return <TrendingUp className="w-3.5 h-3.5 text-status-orange" />
  if (trend === 'decreasing') return <TrendingDown className="w-3.5 h-3.5 text-status-blue" />
  return <Minus className="w-3.5 h-3.5 text-text-muted" />
}

function trendLabel(trend: string | null) {
  if (trend === 'increasing') return 'Increasing'
  if (trend === 'decreasing') return 'Decreasing'
  if (trend === 'stable') return 'Stable'
  return '—'
}

function trendColor(trend: string | null) {
  if (trend === 'increasing') return 'text-status-orange'
  if (trend === 'decreasing') return 'text-status-blue'
  return 'text-text-muted'
}

function fatigueColor(label: string | null) {
  if (label === 'critical') return 'text-status-red'
  if (label === 'elevated') return 'text-status-orange'
  if (label === 'moderate') return 'text-yellow-400'
  return 'text-status-green'
}

function fatigueLabel(label: string | null) {
  if (!label) return '—'
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === 0) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function MetricRow({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-text-secondary">{label}</span>
      <div className="text-right">
        <span className="text-sm font-mono font-semibold text-text-primary">{value}</span>
        {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function PlayerLoadTab({ load }: Props) {
  if (!load) {
    return (
      <Card>
        <EmptyState
          icon={<Activity className="w-5 h-5" />}
          title="No load data"
          description="Training load data will appear here once sessions are recorded for this player."
          className="py-10"
        />
      </Card>
    )
  }

  const overload = load.overload_flag === true
  const absences = load.absences_7d ?? 0

  return (
    <div className="space-y-4">

      {/* Overload alert — only shown when flagged */}
      {overload && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-status-red/30 bg-status-red/5 text-sm text-status-red">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="text-xs leading-relaxed">
            Overload flag active — this player's recent load exceeds safe training thresholds. Review intensity and consider scheduling recovery.
          </span>
        </div>
      )}

      {/* Volume — this week + 28-day */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-muted" />
            <p className="font-semibold text-sm text-text-primary">Training Volume</p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <MetricRow
            label="Sessions this week"
            value={<span className={load.sessions_7d === 0 ? 'text-status-orange' : 'text-lime'}>{load.sessions_7d ?? 0}</span>}
          />
          <MetricRow
            label="Sessions (28 days)"
            value={load.sessions_28d ?? 0}
          />
          <MetricRow
            label="Duration this week"
            value={formatDuration(load.duration_7d_min)}
          />
          <MetricRow
            label="Duration (28 days)"
            value={formatDuration(load.duration_28d_min)}
          />
          <MetricRow
            label="Absences this week"
            value={
              <span className={absences >= 2 ? 'text-status-red' : absences === 1 ? 'text-status-orange' : 'text-text-primary'}>
                {absences}
              </span>
            }
          />
        </CardContent>
      </Card>

      {/* Domain breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-text-muted" />
            <p className="font-semibold text-sm text-text-primary">Session Domain Mix (28 days)</p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <MetricRow label="Skill sessions" value={load.skill_sessions_28d ?? 0} />
          <MetricRow label="Fitness sessions" value={load.fitness_sessions_28d ?? 0} />
          <MetricRow label="Competition sessions" value={load.competition_sessions_28d ?? 0} />
        </CardContent>
      </Card>

      {/* Intensity and fatigue */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-text-muted" />
            <p className="font-semibold text-sm text-text-primary">Intensity & Fatigue</p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {load.avg_intensity_7d !== null && (
            <MetricRow
              label="Avg intensity this week"
              value={`${load.avg_intensity_7d.toFixed(1)} / 10`}
            />
          )}
          {load.avg_intensity_28d !== null && (
            <MetricRow
              label="Avg intensity (28 days)"
              value={`${load.avg_intensity_28d.toFixed(1)} / 10`}
            />
          )}
          {load.avg_perceived_load_7d !== null && (
            <MetricRow
              label="Perceived load this week"
              value={`${load.avg_perceived_load_7d.toFixed(1)}`}
              sub="Player-reported RPE"
            />
          )}
          {load.high_intensity_blocks_7d !== null && (
            <MetricRow
              label="High-intensity blocks (7d)"
              value={load.high_intensity_blocks_7d}
            />
          )}
          <MetricRow
            label="Fatigue risk"
            value={
              <span className={fatigueColor(load.fatigue_risk_label)}>
                {fatigueLabel(load.fatigue_risk_label)}
                {load.fatigue_risk_score !== null && (
                  <span className="text-text-muted font-normal ml-1">({load.fatigue_risk_score})</span>
                )}
              </span>
            }
          />
          <MetricRow
            label="Load trend (7d)"
            value={
              <span className={`flex items-center gap-1.5 justify-end ${trendColor(load.load_trend_7d)}`}>
                {trendIcon(load.load_trend_7d)}
                {trendLabel(load.load_trend_7d)}
              </span>
            }
          />
        </CardContent>
      </Card>

      {/* Data freshness */}
      {load.calculated_at && (
        <p className="text-[10px] text-text-muted text-right">
          Load data last calculated: {formatDate(load.calculated_at)}
        </p>
      )}

    </div>
  )
}
