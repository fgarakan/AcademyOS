import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown, Minus, Users, AlertCircle, CheckCircle, Target } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardHeader, CardContent } from '@/components/ui'

type PlayerSummaryRow = {
  player_id: string | null
  full_name: string | null
  level_label: string | null
  group_name: string | null
  coach_name: string | null
  focus_areas: string[] | null
  overall_score: number | null
  score_delta: number | null
  player_status: string | null
}

function TrendIcon({ delta }: { delta: number | null }) {
  if (delta === null) return <Minus className="w-4 h-4 text-text-muted" />
  if (delta > 0) return <TrendingUp className="w-4 h-4 text-status-green" />
  if (delta < 0) return <TrendingDown className="w-4 h-4 text-status-red" />
  return <Minus className="w-4 h-4 text-text-muted" />
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-text-muted text-xs">—</span>
  const color = delta > 0 ? 'text-status-green' : delta < 0 ? 'text-status-red' : 'text-text-muted'
  return (
    <span className={`font-mono text-xs ${color}`}>
      {delta > 0 ? '+' : ''}{delta.toFixed(1)}
    </span>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent = 'default',
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
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
    <div className="bg-surface border border-border rounded-lg p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-surface-raised flex items-center justify-center">
        <Icon className={`w-5 h-5 ${accentColor}`} />
      </div>
      <div>
        <p className={`font-mono text-2xl font-bold ${accentColor}`}>{value}</p>
        <p className="text-text-muted text-xs uppercase tracking-widest mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default async function ActivePlayersPage() {
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
    .select('player_id, full_name, level_label, group_name, coach_name, focus_areas, overall_score, score_delta, player_status')
    .eq('academy_id', academyId)
    .eq('player_status', 'active')
    .order('full_name', { ascending: true })

  const activePlayers = (players ?? []) as PlayerSummaryRow[]

  const totalActive = activePlayers.length
  const withPriority = activePlayers.filter(p => p.focus_areas && p.focus_areas.length > 0).length
  const missingSummary = activePlayers.filter(p => !p.focus_areas || p.focus_areas.length === 0).length
  const needingReview = activePlayers.filter(p => p.score_delta !== null && p.score_delta < 0).length

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <p className="label-xs text-lime mb-1">PLAYERS</p>
        <h1 className="text-2xl font-bold text-text-primary">Active Players</h1>
        <p className="text-text-secondary text-sm mt-1">
          See every active player, their current level, focus, and development status.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Active" value={totalActive} icon={Users} accent="lime" />
        <SummaryCard label="With Focus Area" value={withPriority} icon={Target} accent="green" />
        <SummaryCard label="Missing Summary" value={missingSummary} icon={AlertCircle} accent={missingSummary > 0 ? 'orange' : 'default'} />
        <SummaryCard label="Needs Review" value={needingReview} icon={CheckCircle} accent={needingReview > 0 ? 'red' : 'default'} />
      </div>

      {/* Player list */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-text-primary">All Active Players</h2>
        </CardHeader>
        <CardContent>
          {activePlayers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary text-sm">No active players found.</p>
              <p className="text-text-muted text-xs mt-1">Players become active after completing placement.</p>
            </div>
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
                      <p className="text-text-muted text-xs mt-0.5">{player.level_label ?? 'No level'}</p>
                    </div>

                    {/* Group + coach */}
                    <div className="hidden md:block min-w-0 w-36 shrink-0">
                      <p className="text-text-secondary text-xs truncate">{player.group_name ?? '—'}</p>
                      <p className="text-text-muted text-xs truncate">{player.coach_name ?? 'No coach'}</p>
                    </div>

                    {/* Current focus / working on */}
                    <div className="min-w-0 flex-1">
                      {player.focus_areas && player.focus_areas.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] uppercase tracking-widest text-text-muted mr-1">Current Focus</span>
                          {player.focus_areas.slice(0, 2).map((area: string, i: number) => (
                            <span
                              key={i}
                              className="inline-block bg-surface-raised border border-border text-text-secondary text-xs px-2 py-0.5 rounded"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-text-muted text-xs italic">No focus area set</span>
                      )}
                    </div>
                  </div>

                  {/* Score + delta + arrow */}
                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    <div className="text-right hidden sm:block">
                      <p className="font-mono text-sm text-text-primary">
                        {player.overall_score !== null ? player.overall_score.toFixed(1) : '—'}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <TrendIcon delta={player.score_delta} />
                        <DeltaBadge delta={player.score_delta} />
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back to dashboard */}
      <div>
        <Link href="/director" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
