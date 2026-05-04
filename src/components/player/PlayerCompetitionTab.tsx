import { Trophy, TrendingUp, TrendingDown, Minus, Star, Calendar, Activity } from 'lucide-react'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { UtrHistoryChart, type UtrHistoryPoint } from './UtrHistoryChart'

export interface UtrProfileData {
  utr_singles: number | null
  utr_doubles: number | null
  utr_status: string | null
  win_rate_90d: number | null
  wins_90d: number | null
  losses_90d: number | null
  matches_played_90d: number | null
  matches_played_ytd: number | null
  last_match_date: string | null
  last_synced_at: string | null
}

export interface UtrMatchRow {
  id: string
  match_date: string
  opponent_name: string | null
  opponent_utr: number | null
  result: string
  score: string | null
  tournament_name: string | null
  surface: string | null
  utr_impact: number | null
}

export interface UtrInsightRow {
  id: string
  insight_type: string
  insight_text: string
  delta: number | null
  utr_current: number | null
  period_days: number | null
  calculated_at: string
}

interface Props {
  utrProfile: UtrProfileData | null
  utrHistory: UtrHistoryPoint[]
  utrMatches: UtrMatchRow[]
  utrInsights: UtrInsightRow[]
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

function deltaIcon(delta: number | null) {
  if (delta == null) return <Minus className="w-3 h-3 text-text-muted inline" />
  if (delta > 0) return <TrendingUp className="w-3 h-3 text-status-green inline" />
  if (delta < 0) return <TrendingDown className="w-3 h-3 text-status-red inline" />
  return <Minus className="w-3 h-3 text-text-muted inline" />
}

function resultBadge(result: string) {
  const isWin = result?.toLowerCase() === 'win' || result?.toLowerCase() === 'w'
  return (
    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
      isWin ? 'bg-status-green/10 text-status-green' : 'bg-status-red/10 text-status-red'
    }`}>
      {result?.toUpperCase() ?? '—'}
    </span>
  )
}

function surfaceBadge(surface: string | null) {
  if (!surface) return null
  const colors: Record<string, string> = {
    hard: 'text-status-blue',
    clay: 'text-status-orange',
    grass: 'text-status-green',
    carpet: 'text-text-muted',
  }
  const color = colors[surface.toLowerCase()] ?? 'text-text-muted'
  return <span className={`text-[10px] capitalize ${color}`}>{surface}</span>
}

export function PlayerCompetitionTab({ utrProfile, utrHistory, utrMatches, utrInsights }: Props) {
  const hasProfile = utrProfile != null
  const hasHistory = utrHistory.length > 0
  const hasMatches = utrMatches.length > 0
  const hasInsights = utrInsights.length > 0

  if (!hasProfile && !hasHistory && !hasMatches) {
    return (
      <Card>
        <EmptyState
          icon={<Trophy className="w-5 h-5" />}
          title="No competition data yet"
          description="UTR ratings, match results, and tournament records will appear here once data is recorded."
        />
      </Card>
    )
  }

  return (
    <div className="space-y-6">

      {/* UTR Profile */}
      {hasProfile && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-lime" />
              <p className="label-xs">UTR Profile</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-0">
            <MetricRow
              label="Singles UTR"
              value={
                <span className="text-lime">
                  {utrProfile.utr_singles != null ? utrProfile.utr_singles.toFixed(2) : '—'}
                </span>
              }
              sub={utrProfile.utr_status ?? undefined}
            />
            <MetricRow
              label="Doubles UTR"
              value={utrProfile.utr_doubles != null ? utrProfile.utr_doubles.toFixed(2) : '—'}
            />
            <MetricRow
              label="Win rate (90d)"
              value={
                utrProfile.win_rate_90d != null
                  ? `${(utrProfile.win_rate_90d * 100).toFixed(0)}%`
                  : '—'
              }
              sub={
                utrProfile.wins_90d != null && utrProfile.losses_90d != null
                  ? `${utrProfile.wins_90d}W · ${utrProfile.losses_90d}L`
                  : undefined
              }
            />
            <MetricRow
              label="Matches played (90d)"
              value={utrProfile.matches_played_90d ?? '—'}
            />
            <MetricRow
              label="Matches played (YTD)"
              value={utrProfile.matches_played_ytd ?? '—'}
            />
            <MetricRow
              label="Last match"
              value={formatDate(utrProfile.last_match_date)}
            />
          </CardContent>
        </Card>
      )}

      {/* UTR History Chart */}
      {hasHistory && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-lime" />
              <p className="label-xs">UTR Trend</p>
              <span className="text-[10px] text-text-muted ml-auto">
                Last {utrHistory.length} readings
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <UtrHistoryChart history={utrHistory} />
            {/* Delta row for most recent */}
            {utrHistory[0] && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-text-muted">Latest</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-semibold text-lime">
                    {utrHistory[0].utr_value.toFixed(2)}
                  </span>
                  {utrHistory[0].delta_from_previous != null && (
                    <span className={`flex items-center gap-0.5 text-[11px] font-mono ${
                      utrHistory[0].delta_from_previous > 0 ? 'text-status-green' :
                      utrHistory[0].delta_from_previous < 0 ? 'text-status-red' : 'text-text-muted'
                    }`}>
                      {deltaIcon(utrHistory[0].delta_from_previous)}
                      {utrHistory[0].delta_from_previous > 0 ? '+' : ''}
                      {utrHistory[0].delta_from_previous.toFixed(2)}
                    </span>
                  )}
                  <span className="text-[10px] text-text-muted">
                    {formatDate(utrHistory[0].captured_at)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {hasInsights && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-status-blue" />
              <p className="label-xs">UTR Insights</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {utrInsights.map(insight => (
              <div key={insight.id} className="py-2 border-b border-border last:border-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <span className="text-[10px] uppercase tracking-widest text-text-muted">
                    {insight.insight_type.replace(/_/g, ' ')}
                  </span>
                  {insight.delta != null && (
                    <span className={`flex items-center gap-0.5 text-[11px] font-mono shrink-0 ${
                      insight.delta > 0 ? 'text-status-green' :
                      insight.delta < 0 ? 'text-status-red' : 'text-text-muted'
                    }`}>
                      {deltaIcon(insight.delta)}
                      {insight.delta > 0 ? '+' : ''}{insight.delta.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-primary leading-snug">{insight.insight_text}</p>
                {insight.period_days != null && (
                  <p className="text-[10px] text-text-muted mt-0.5">{insight.period_days}d window</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Match Results */}
      {hasMatches && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-text-muted" />
              <p className="label-xs">Recent Matches</p>
              <span className="text-[10px] text-text-muted ml-auto">{utrMatches.length} records</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-0">
            {utrMatches.map(match => (
              <div key={match.id} className="py-3 border-b border-border last:border-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {resultBadge(match.result)}
                    <span className="text-xs text-text-primary font-medium">
                      {match.opponent_name ?? 'Unknown opponent'}
                    </span>
                    {match.opponent_utr != null && (
                      <span className="text-[10px] text-text-muted font-mono">
                        opp {match.opponent_utr.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted shrink-0">
                    {formatDate(match.match_date)}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {match.score && (
                    <span className="text-xs font-mono text-text-secondary">{match.score}</span>
                  )}
                  {match.tournament_name && (
                    <span className="text-[10px] text-text-muted">{match.tournament_name}</span>
                  )}
                  {surfaceBadge(match.surface)}
                  {match.utr_impact != null && (
                    <span className={`text-[10px] font-mono ml-auto ${
                      match.utr_impact > 0 ? 'text-status-green' :
                      match.utr_impact < 0 ? 'text-status-red' : 'text-text-muted'
                    }`}>
                      {match.utr_impact > 0 ? '+' : ''}{match.utr_impact.toFixed(2)} UTR
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  )
}
