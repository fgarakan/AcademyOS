'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { generateBlueprintAction } from './generateBlueprintAction'

async function getDirectorOrHeadCoach(supabase: Awaited<ReturnType<typeof getSupabaseServer>>, academyId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  if (!membership?.role || !['academy_director', 'head_coach'].includes(membership.role)) return null
  return user
}

export async function createPlacementDraftAction(
  playerId: string,
  academyId: string,
  groupId: string,
  track: string,
  levelId: string | null,
  rationale: string,
): Promise<{ error?: string; id?: string }> {
  const supabase = await getSupabaseServer()
  const user = await getDirectorOrHeadCoach(supabase, academyId)
  if (!user) return { error: 'Insufficient permissions' }

  const rawDb = supabase as any
  const { data, error } = await rawDb
    .from('placement_recommendations')
    .insert({
      academy_id: academyId,
      player_id: playerId,
      status: 'generated',
      recommended_group_id: groupId,
      recommended_track: track,
      recommended_level_id: levelId || null,
      recommendation_rationale: rationale || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message ?? 'Failed to create placement draft' }

  revalidatePath('/director/placement')
  revalidatePath(`/director/players/${playerId}`)
  return { id: data.id }
}

export async function approvePlacementDraftAction(
  recId: string,
  academyId: string,
): Promise<{ error?: string }> {
  const supabase = await getSupabaseServer()
  const user = await getDirectorOrHeadCoach(supabase, academyId)
  if (!user) return { error: 'Insufficient permissions' }

  const rawDb = supabase as any

  // Confirm the recommendation belongs to this academy and is in a reviewable state
  const { data: rec } = await rawDb
    .from('placement_recommendations')
    .select('id, status, player_id')
    .eq('id', recId)
    .eq('academy_id', academyId)
    .single()

  if (!rec) return { error: 'Recommendation not found' }
  if (!['generated', 'draft'].includes(rec.status)) {
    return { error: `Cannot approve a recommendation with status: ${rec.status}` }
  }

  const { error } = await rawDb
    .from('placement_recommendations')
    .update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() })
    .eq('id', recId)
    .eq('academy_id', academyId)

  if (error) return { error: error.message ?? 'Failed to approve recommendation' }

  revalidatePath('/director/placement')
  revalidatePath(`/director/players/${rec.player_id}`)
  return {}
}

export async function activatePlayerAction(
  recId: string,
  academyId: string,
): Promise<{ error?: string; playerId?: string }> {
  const supabase = await getSupabaseServer()
  const user = await getDirectorOrHeadCoach(supabase, academyId)
  if (!user) return { error: 'Insufficient permissions' }

  const rawDb = supabase as any

  // Confirm the recommendation is approved
  const { data: rec } = await rawDb
    .from('placement_recommendations')
    .select('id, status, player_id')
    .eq('id', recId)
    .eq('academy_id', academyId)
    .single()

  if (!rec) return { error: 'Recommendation not found' }
  if (rec.status !== 'approved') return { error: 'Recommendation must be approved before activation' }

  const { error } = await supabase.rpc('finalize_player_placement', {
    p_recommendation_id: recId,
    p_activator_id: user.id,
  } as any)

  if (error) return { error: error.message ?? 'Failed to activate player' }

  // Generate development blueprint immediately after activation.
  // Fire-and-forget: blueprint failure does NOT roll back placement.
  // Blueprint includes priorities, 30-day plan, missions (pending_review), coach brief, parent summary.
  void generateBlueprintAction(rec.player_id, academyId)

  revalidatePath('/director/placement')
  revalidatePath(`/director/players/${rec.player_id}`)
  revalidatePath('/director/players')
  return { playerId: rec.player_id }
}
