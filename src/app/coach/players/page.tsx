import { getSupabaseServer } from '@/lib/supabase/server'
import { getCoachWorkspaceSummary } from '@/lib/backend/coachWorkspace'
import { CoachPlayersClient } from './CoachPlayersClient'

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

  const players = assignedPlayers.map(p => ({
    player_id: p.player_id ?? null,
    full_name: p.full_name ?? null,
    group_name: p.group_name ?? null,
    level_label: p.level_label ?? null,
    level_number: p.level_number ?? null,
    focus_areas: p.focus_areas ?? null,
    last_assessed_at: p.last_assessed_at ?? null,
    player_status: p.player_status ?? null,
  }))

  return <CoachPlayersClient players={players} />
}
