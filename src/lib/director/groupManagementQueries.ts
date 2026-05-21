// Sprint 430 — Group Management Data Layer V1
// Typed query helpers for director group management view.
// No select('*'). Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export interface GroupSummary {
  id: string
  name: string
  levelId: string | null
  isActive: boolean
  maxPlayers: number | null
  memberCount: number
}

// Fetch all active groups for an academy with member count.
export async function fetchGroupsWithMemberCount(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<GroupSummary[]> {
  const [groupsResult, membershipResult] = await Promise.all([
    db
      .from('groups')
      .select('id, name, level_id, is_active, max_players')
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .order('name', { ascending: true }),
    db
      .from('group_memberships')
      .select('group_id')
      .eq('academy_id', academyId)
      .eq('is_current', true),
  ])

  if (groupsResult.error) return []

  const memberCounts = new Map<string, number>()
  for (const row of membershipResult.data ?? []) {
    memberCounts.set(row.group_id, (memberCounts.get(row.group_id) ?? 0) + 1)
  }

  return (groupsResult.data ?? []).map(g => ({
    id: g.id,
    name: g.name,
    levelId: g.level_id,
    isActive: g.is_active,
    maxPlayers: g.max_players,
    memberCount: memberCounts.get(g.id) ?? 0,
  }))
}

// Fetch groups that are at or over capacity.
export async function fetchOverCapacityGroups(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<GroupSummary[]> {
  const groups = await fetchGroupsWithMemberCount(db, academyId)
  return groups.filter(g => g.maxPlayers !== null && g.memberCount >= g.maxPlayers)
}

// Fetch players not assigned to any active group.
export interface UnassignedPlayerRecord {
  id: string
  first_name: string
  last_name: string
  current_level_id: string | null
}

export async function fetchUnassignedPlayers(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<UnassignedPlayerRecord[]> {
  // Get players in active group memberships
  const { data: memberships } = await db
    .from('group_memberships')
    .select('player_id')
    .eq('academy_id', academyId)
    .eq('is_current', true)

  const assignedIds = new Set((memberships ?? []).map(m => m.player_id))

  // Get all active players
  const { data: players, error } = await db
    .from('players')
    .select('id, first_name, last_name, current_level_id')
    .eq('academy_id', academyId)
    .eq('is_active', true)

  if (error) return []
  return (players ?? []).filter(p => !assignedIds.has(p.id)) as UnassignedPlayerRecord[]
}
