// DEMO_ONLY: Sprint 399 portal foundation validation.
// These IDs match the demo seed data applied in Sprint 398.
// Do not use in production logic or expose to non-director roles.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

export const DEMO_ACADEMY_ID = '00000000-0000-0000-0000-000000000001'
export const DEMO_PLAYER_ID = '00000000-0000-0003-0000-000000000001'
export const DEMO_GUARDIAN_ID = '00000000-0000-0007-0000-000000000001'

export type DemoPlayerRow = Tables<'players'>
export type DemoLevelRow = Tables<'academy_levels'>
export type DemoPriorityRow = Tables<'player_priorities'>
export type DemoSummaryRow = Tables<'player_development_summary'>
export type DemoGuardianRow = Tables<'guardians'>

export interface DemoPortalFoundation {
  player: {
    id: string
    fullName: string | null
    isActive: boolean
  }
  level: {
    id: string
    label: string
  } | null
  priorities: {
    id: string
    title: string
    category: string | null
    rank: number | null
    urgency: string | null
    status: string | null
  }[]
  developmentSummary: {
    id: string
    showToStudent: boolean
    showToParent: boolean
    source: string | null
    studentFriendlySummary: string | null
    parentSummary: string | null
    thingsToWorkOn: string[] | null
    currentStrengths: string[] | null
  } | null
  guardian: {
    id: string
    profileId: string | null
    profileDisplayName: string | null
    email: string | null
    name: string | null
  } | null
}

export interface DemoPortalFoundationResult {
  data: DemoPortalFoundation | null
  error: string | null
}

export async function getDemoPortalFoundation(db: DB): Promise<DemoPortalFoundationResult> {
  const rawDb = db as any

  // 1. Player
  const { data: player, error: playerError } = await rawDb
    .from('players')
    .select('id, full_name, is_active, current_level_id')
    .eq('id', DEMO_PLAYER_ID)
    .eq('academy_id', DEMO_ACADEMY_ID)
    .single()

  if (playerError || !player) {
    return { data: null, error: playerError?.message ?? 'Demo player not found.' }
  }

  // 2. Academy level
  let level: DemoPortalFoundation['level'] = null
  if (player.current_level_id) {
    const { data: levelRow } = await rawDb
      .from('academy_levels')
      .select('id, label')
      .eq('id', player.current_level_id)
      .eq('academy_id', DEMO_ACADEMY_ID)
      .single()

    if (levelRow) {
      level = { id: levelRow.id, label: levelRow.label }
    }
  }

  // 3. Priorities — column is priority_rank (rank is a reserved PostgreSQL keyword)
  const { data: priorityRows } = await rawDb
    .from('player_priorities')
    .select('id, title, category, priority_rank, urgency, status')
    .eq('player_id', DEMO_PLAYER_ID)
    .eq('academy_id', DEMO_ACADEMY_ID)
    .order('priority_rank', { ascending: true })

  const priorities: DemoPortalFoundation['priorities'] = (priorityRows ?? []).map(
    (r: any) => ({
      id: r.id,
      title: r.title,
      category: r.category ?? null,
      rank: r.priority_rank ?? null,
      urgency: r.urgency ?? null,
      status: r.status ?? null,
    })
  )

  // 4. Development summary
  const { data: summaryRow } = await rawDb
    .from('player_development_summary')
    .select(
      'id, show_to_student, show_to_parent, source, student_friendly_summary, parent_summary, things_to_work_on, current_strengths'
    )
    .eq('player_id', DEMO_PLAYER_ID)
    .eq('academy_id', DEMO_ACADEMY_ID)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const developmentSummary: DemoPortalFoundation['developmentSummary'] = summaryRow
    ? {
        id: summaryRow.id,
        showToStudent: summaryRow.show_to_student,
        showToParent: summaryRow.show_to_parent,
        source: summaryRow.source ?? null,
        studentFriendlySummary: summaryRow.student_friendly_summary ?? null,
        parentSummary: summaryRow.parent_summary ?? null,
        thingsToWorkOn: Array.isArray(summaryRow.things_to_work_on)
          ? summaryRow.things_to_work_on
          : null,
        currentStrengths: Array.isArray(summaryRow.current_strengths)
          ? summaryRow.current_strengths
          : null,
      }
    : null

  // 5. Guardian — look up any guardian linked to the demo player
  // guardians table has first_name/last_name columns, not name
  const { data: pgRow } = await rawDb
    .from('player_guardians')
    .select('guardian_id')
    .eq('player_id', DEMO_PLAYER_ID)
    .limit(1)
    .single()

  let guardian: DemoPortalFoundation['guardian'] = null
  if (pgRow?.guardian_id) {
    const { data: guardianRow } = await rawDb
      .from('guardians')
      .select('id, profile_id, email, first_name, last_name')
      .eq('id', pgRow.guardian_id)
      .single()

    if (guardianRow) {
      let profileDisplayName: string | null = null
      if (guardianRow.profile_id) {
        const { data: profileRow } = await rawDb
          .from('profiles')
          .select('display_name')
          .eq('id', guardianRow.profile_id)
          .single()
        profileDisplayName = profileRow?.display_name ?? null
      }

      const name = [guardianRow.first_name, guardianRow.last_name]
        .filter(Boolean)
        .join(' ') || null

      guardian = {
        id: guardianRow.id,
        profileId: guardianRow.profile_id ?? null,
        profileDisplayName,
        email: guardianRow.email ?? null,
        name,
      }
    }
  }

  return {
    data: {
      player: {
        id: player.id,
        fullName: player.full_name ?? null,
        isActive: player.is_active,
      },
      level,
      priorities,
      developmentSummary,
      guardian,
    },
    error: null,
  }
}
