import { Users } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  EmptyState,
  SectionHeader,
} from '@/components/ui'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getCoachWorkspaceSummary } from '@/lib/backend/coachWorkspace'

function playerInitials(fullName: string | null): string {
  if (!fullName) return '?'
  const parts = fullName.trim().split(' ')
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase() || '?'
}

export default async function CoachPlayersPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let assignedPlayers: Awaited<ReturnType<typeof getCoachWorkspaceSummary>>['assignedPlayers'] = []

  if (user) {
    try {
      const summary = await getCoachWorkspaceSummary(supabase, user.id)
      assignedPlayers = summary.assignedPlayers
    } catch {
      // query failed — empty state renders
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <p className="page-eyebrow">Your Players</p>
        <h1 className="page-title">My Players</h1>
        <p className="text-text-muted text-sm mt-1">
          Players assigned to your groups will appear here.
        </p>
      </div>

      {/* ── Player list ──────────────────────────────────────── */}
      <div>
        <SectionHeader title="ASSIGNED PLAYERS" />
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-text-muted" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">My Players</p>
                  <p className="text-text-muted text-xs">Filtered to your assigned groups</p>
                </div>
              </div>
              {assignedPlayers.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-surface-raised text-text-muted border border-border shrink-0">
                  {assignedPlayers.length}{' '}
                  {assignedPlayers.length === 1 ? 'player' : 'players'}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {assignedPlayers.length > 0 ? (
              <ul className="space-y-3">
                {assignedPlayers.map((p, i) => {
                  const initials = playerInitials(p.full_name)
                  const detail = (
                    [p.group_name, p.level_label].filter(Boolean) as string[]
                  ).join(' · ')
                  return (
                    <li
                      key={p.player_id ?? i}
                      className="flex items-center gap-3 py-2 border-b border-border last:border-0 last:pb-0"
                    >
                      <div className="w-10 h-10 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-text-secondary">
                          {initials}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {p.full_name ?? '—'}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          {detail || '—'}
                        </p>
                      </div>
                      {p.player_status && (
                        <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          p.player_status === 'active'
                            ? 'bg-status-green/10 text-status-green border-status-green/30'
                            : p.player_status === 'pending_placement'
                            ? 'bg-status-orange/10 text-status-orange border-status-orange/30'
                            : 'bg-surface-raised text-text-muted border-border'
                        }`}>
                          {p.player_status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<Users className="w-5 h-5" />}
                title="No players assigned yet"
                description="Players will appear here once you are assigned to a group in the platform."
                className="py-10"
              />
            )}
          </CardContent>
          <CardFooter>
            <p className="text-text-muted text-xs">
              Full player profiles, notes, and development tracking coming soon.
            </p>
          </CardFooter>
        </Card>
      </div>

    </div>
  )
}
