import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

export interface ObservationWithPlayer {
  id: string
  player_id: string
  player_name: string
  observation_type: string
  content: string
  is_private: boolean
  created_at: string
}

export interface CoachWorkspaceSummary {
  profile: { id: string; academy_id: string; display_name: string } | null
  assignedGroups: Tables<'v_group_summary'>[]
  assignedPlayers: Tables<'v_player_summary'>[]
  recentObservations: ObservationWithPlayer[]
  todaySessions: Tables<'sessions'>[]
}

export async function getCoachWorkspaceSummary(
  db: DB,
  userId: string
): Promise<CoachWorkspaceSummary> {
  const empty: CoachWorkspaceSummary = {
    profile: null,
    assignedGroups: [],
    assignedPlayers: [],
    recentObservations: [],
    todaySessions: [],
  }

  // 1. Coach profile → academy_id + display_name
  const { data: profileRow, error: profileErr } = await db
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileErr || !profileRow) return empty

  const profile = {
    id: profileRow.id,
    academy_id: profileRow.academy_id,
    display_name: profileRow.display_name,
  }

  // 2. Active group assignments for this coach
  const { data: assignments } = await db
    .from('coach_group_assignments')
    .select('*')
    .eq('coach_id', profile.id)
    .eq('academy_id', profile.academy_id)
    .eq('is_active', true)

  const groupIds: string[] = (assignments ?? []).map(a => a.group_id)

  // 3. Group details — v_group_summary.group_id confirmed in database.types.ts
  let assignedGroups: Tables<'v_group_summary'>[] = []
  if (groupIds.length > 0) {
    const { data: groupRows } = await db
      .from('v_group_summary')
      .select('*')
      .in('group_id', groupIds)
    assignedGroups = groupRows ?? []
  }

  // 4. Assigned players — v_player_summary.group_id confirmed in database.types.ts
  let assignedPlayers: Tables<'v_player_summary'>[] = []
  if (groupIds.length > 0) {
    const { data: playerRows } = await db
      .from('v_player_summary')
      .select('*')
      .in('group_id', groupIds)
      .eq('academy_id', profile.academy_id)
      .limit(10)
    assignedPlayers = playerRows ?? []
  }

  // 5. Recent observations written by this coach (not voice_notes, not ai_drafts)
  const { data: obsRows } = await db
    .from('coach_observations')
    .select('*')
    .eq('coach_id', profile.id)
    .eq('academy_id', profile.academy_id)
    .order('created_at', { ascending: false })
    .limit(5)

  // 6. Resolve player names for those observations
  let recentObservations: ObservationWithPlayer[] = []
  const observations = obsRows ?? []
  if (observations.length > 0) {
    const uniquePlayerIds = Array.from(new Set(observations.map(o => o.player_id)))
    const { data: playerNames } = await db
      .from('players')
      .select('id, full_name')
      .in('id', uniquePlayerIds)

    const nameMap = new Map(
      (playerNames ?? []).map(p => [p.id, p.full_name])
    )

    recentObservations = observations.map(o => ({
      id: o.id,
      player_id: o.player_id,
      player_name: nameMap.get(o.player_id) ?? 'Unknown Player',
      observation_type: o.observation_type,
      content: o.content,
      is_private: o.is_private,
      created_at: o.created_at,
    }))
  }

  // 7. Today's sessions for this coach
  const todayDate = new Date().toISOString().slice(0, 10)
  const { data: sessionRows } = await db
    .from('sessions')
    .select('*')
    .eq('coach_id', profile.id)
    .eq('academy_id', profile.academy_id)
    .eq('scheduled_date', todayDate)
    .order('created_at', { ascending: true })

  return {
    profile,
    assignedGroups,
    assignedPlayers,
    recentObservations,
    todaySessions: sessionRows ?? [],
  }
}
