import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown, Minus, BarChart3, AlertCircle } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'

type PlayerSummaryRow = {
  player_id: string | null
  full_name: string | null
  level_label: string | null
  group_name: string | null
  coach_name: string | null
  overall_score: number | null
  score_delta: number | null
  focus_areas: string[] | null
  player_status: string | null
}

type ImprovementStatus = 'improving' | 'flat' | 'attention'

function classifyPlayer(delta: number | null): ImprovementStatus {
  if (delta === null) return 'flat'
  if (delta > 0) return 'improving'
  if (delta < 0) return 'attention'
  return 'flat'
}

function TrendChip({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-surface-raised border border-border px-2 py-0.5 rounded">
        <Minus className="w-3 h-3" /> No data
      </span>
    )
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-status-green bg-surface-raised border border-border px-2 py-0.5 rounded font-mono">
        <TrendingUp className="w-3 h-3" /> +{delta.toFixed(1)}
      </span>
    )
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-status-red bg-surface-raised border border-border px-2 py-0.5 rounded font-mono">
        <TrendingDown className="w-3 h-3" /> {delta.toFixed(1)}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-surface-raised border border-border px-2 py-0.5 rounded font-mono">
      <Minus className="w-3 h-3" /> 0.0
    </span>
  )
}

function SummaryCard({
  label,
  value,
  sub,
  accent = 'default',
}: {
  label: string
  value: string | number
  sub?: string
  accent?: 'lime' | 'green' | 'orange' | 'red' | 'default'
}) {
  const accentColor = {
    lime: 'text-lime',
    green: 'text-status-green',
    orange: 'text-status-orange',
    red: 'text-status-red',
    default: 'text-text-primary',
  }[accent]

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className={`font-mono text-2xl font-bold ${accentColor}`}>{value}</p>
      <p className="text-text-muted text-xs uppercase tracking-widest mt-1">{label}</p>
      {sub && <p className="text-text-secondary text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default async function ImprovementPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    academyId = (profile as { academy_id: string | null } | null)?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const { data: players } = await supabase
    .from('v_player_summary')
    .select('player_id, full_name, level_label, group_name, coach_name, overall_score, score_delta, focus_areas, player_status')
    .eq('academy_id', academyId)
    .eq('player_status', 'active')
    .order('score_delta', { ascending: false, nullsFirst: false })

  const activePlayers = (players ?? []) as PlayerSummaryRow[]

  const withDelta = activePlayers.filter(p => p.score_delta !== null)
  const improving = activePlayers.filter(p => classifyPlayer(p.score_delta) === 'improving')
  const flat = activePlayers.filter(p => classifyPlayer(p.score_delta) === 'flat')
  const attention = activePlayers.filter(p => classifyPlayer(p.score_delta) === 'attention')

  const avgDelta =
    withDelta.length > 0
      ? withDelta.reduce((sum, p) => sum + (p.score_delta ?? 0), 0) / withDelta.length
      : null

  const avgDeltaDisplay = avgDelta !== null
    ? (avgDelta > 0 ? `+${avgDelta.toFixed(1)}` : avgDelta.toFixed(1))
    : '—'

  const hasData = withDelta.length > 0

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <p className="label-xs text-lime mb-1">DEVELOPMENT</p>
        <h1 className="text-2xl font-bold text-text-primary">Academy Improvement</h1>
        <p className="text-text-secondary text-sm mt-1">
          Track growth across players, groups, and levels.
        </p>
      </div>

      {/* UTR note */}
      <div className="bg-surface border border-border rounded-lg px-4 py-3 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-status-blue shrink-0 mt-0.5" />
        <p className="text-text-secondary text-sm">
          UTR-based growth can be enabled once UTR values are imported. Currently showing development score delta from player assessments.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Avg Improvement"
          value={avgDeltaDisplay}
          sub={hasData ? `Based on ${withDelta.length} players` : 'No assessment data yet'}
          accent={avgDelta !== null && avgDelta > 0 ? 'green' : avgDelta !== null && avgDelta < 0 ? 'red' : 'default'}
        />
        <SummaryCard label="Improving" value={improving.length} sub={activePlayers.length > 0 ? `of ${activePlayers.length} active` : undefined} accent="green" />
        <SummaryCard label="Flat / No Data" value={flat.length} sub={activePlayers.length > 0 ? `of ${activePlayers.length} active` : undefined} accent="default" />
        <SummaryCard label="Needs Attention" value={attention.length} sub={activePlayers.length > 0 ? `of ${activePlayers.length} active` : undefined} accent={attention.length > 0 ? 'red' : 'default'} />
      </div>

      {/* Player table */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-text-primary">Player Progress</h2>
        </CardHeader>
        <CardContent>
          {activePlayers.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="w-5 h-5" />}
              title="No active players found"
              description="Active players with at least one assessment will appear here with progress trends."
              action={
                <Link href="/director/players" className="text-xs text-lime hover:opacity-80 font-medium transition-opacity">
                  Go to Players →
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {activePlayers.map(player => (
                <Link
                  key={player.player_id}
                  href={`/director/players/${player.player_id}`}
                  className="flex items-center justify-between py-3 px-1 hover:bg-surface-raised rounded transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Name + level */}
                    <div className="min-w-0 w-40 shrink-0">
                      <p className="text-text-primary text-sm font-medium truncate">{player.full_name ?? '—'}</p>
                      <p className="text-text-muted text-xs mt-0.5">{player.level_label ?? '—'}</p>
                    </div>

                    {/* Group + coach */}
                    <div className="hidden md:block min-w-0 w-36 shrink-0">
                      <p className="text-text-secondary text-xs truncate">{player.group_name ?? '—'}</p>
                      <p className="text-text-muted text-xs truncate">{player.coach_name ?? '—'}</p>
                    </div>

                    {/* Current focus / working on */}
                    <div className="min-w-0 flex-1 hidden sm:block">
                      {player.focus_areas && player.focus_areas.length > 0 ? (
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-text-muted block mb-0.5">Working On</span>
                          <span className="text-text-secondary text-xs truncate block">
                            {player.focus_areas[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-muted text-xs italic">No development focus set</span>
                      )}
                    </div>
                  </div>

                  {/* Score + trend + arrow */}
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="text-right hidden sm:block">
                      <p className="font-mono text-sm text-text-primary">
                        {player.overall_score !== null ? player.overall_score.toFixed(1) : '—'}
                      </p>
                      <p className="text-text-muted text-xs">score</p>
                    </div>
                    <TrendChip delta={player.score_delta} />
                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Link href="/director" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
