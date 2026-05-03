import { UserPlus } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import {
  PlacementEngineClient,
  type PendingPlayer,
  type PlacementRec,
  type GroupOption,
  type LevelOption,
} from './PlacementEngineClient'

export default async function PlacementPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">No session. Please sign in.</p>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  const academyId: string | null = profile?.academy_id ?? null
  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable.</p>
      </div>
    )
  }

  const rawDb = supabase as any

  // Pending players
  const { data: playerRows } = await rawDb
    .from('players')
    .select('id, full_name, date_of_birth, status')
    .eq('academy_id', academyId)
    .in('status', ['pending_placement', 'placement_in_progress', 'pending_approval'])
    .order('created_at', { ascending: true })

  const pendingPlayers = (playerRows ?? []) as Array<{
    id: string
    full_name: string | null
    date_of_birth: string | null
    status: string | null
  }>

  const pendingIds = pendingPlayers.map(p => p.id)

  // Existing placement recommendations for these players
  const recMap: Record<string, PlacementRec> = {}
  if (pendingIds.length > 0) {
    const { data: recRows } = await rawDb
      .from('placement_recommendations')
      .select(`
        id, status, player_id,
        recommended_group_id, recommended_track, recommended_level_id,
        recommendation_rationale,
        groups:recommended_group_id ( name ),
        academy_levels:recommended_level_id ( label )
      `)
      .eq('academy_id', academyId)
      .in('player_id', pendingIds)
      .in('status', ['draft', 'generated', 'approved'])
      .order('created_at', { ascending: false })

    for (const r of (recRows ?? [])) {
      // Keep only the most recent non-activated rec per player
      if (!recMap[r.player_id]) {
        recMap[r.player_id] = {
          id: r.id,
          status: r.status,
          recommended_group_id: r.recommended_group_id,
          recommended_track: r.recommended_track,
          recommended_level_id: r.recommended_level_id,
          recommendation_rationale: r.recommendation_rationale,
          group_name: r.groups?.name ?? null,
          level_label: r.academy_levels?.label ?? null,
        }
      }
    }
  }

  const players: PendingPlayer[] = pendingPlayers.map(p => ({
    id: p.id,
    full_name: p.full_name,
    date_of_birth: p.date_of_birth,
    player_status: p.status,
    existing_rec: recMap[p.id] ?? null,
  }))

  // Groups for selection
  const { data: groupRows } = await supabase
    .from('groups')
    .select('id, name, track')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  const groups: GroupOption[] = (groupRows ?? []).map(g => ({
    id: g.id,
    name: g.name,
    track: g.track ?? null,
  }))

  // Academy levels for selection (old system)
  const { data: levelRows } = await rawDb
    .from('academy_levels')
    .select('id, label, track')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const levels: LevelOption[] = (levelRows ?? []).map((l: { id: string; label: string; track: string | null }) => ({
    id: l.id,
    label: l.label,
    track: l.track ?? null,
  }))

  const readyToActivate = players.filter(p => p.existing_rec?.status === 'approved').length
  const awaitingReview = players.filter(p => p.existing_rec?.status === 'generated').length
  const noDraft = players.filter(p => !p.existing_rec).length

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <p className="page-eyebrow">Director</p>
        <div className="flex items-center gap-3 mt-1">
          <UserPlus className="w-5 h-5 text-lime" />
          <h1 className="page-title text-2xl">Placement Engine</h1>
          {players.length > 0 && (
            <span className="font-mono text-lime font-bold text-xl">{players.length}</span>
          )}
        </div>
        <p className="page-subtitle mt-1">Review and activate pending players.</p>
      </div>

      {/* Status summary */}
      {players.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {noDraft > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-surface-raised border border-border text-text-muted">
              {noDraft} needs draft
            </span>
          )}
          {awaitingReview > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-lime/10 border border-lime/20 text-lime">
              {awaitingReview} awaiting approval
            </span>
          )}
          {readyToActivate > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-status-green/10 border border-status-green/30 text-status-green">
              {readyToActivate} ready to activate
            </span>
          )}
        </div>
      )}

      <PlacementEngineClient
        players={players}
        academyId={academyId}
        groups={groups}
        levels={levels}
      />

    </div>
  )
}
