'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function setCurriculumLevelAction(
  playerId: string,
  academyId: string,
  levelId: string,
): Promise<{ error?: string }> {
  const supabase = await getSupabaseServer()

  // Verify the calling user belongs to this academy as director or head_coach.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership?.role || !['academy_director', 'head_coach'].includes(membership.role)) {
    return { error: 'Insufficient permissions' }
  }

  // Confirm level exists and belongs to the global curriculum.
  const rawDb = supabase as any
  const { data: level, error: levelError } = await rawDb
    .from('curriculum_levels')
    .select('id, display_name')
    .eq('id', levelId)
    .single()

  if (levelError || !level) return { error: 'Curriculum level not found' }

  // Call RPC with explicit p_level_id.
  const { error: rpcError } = await supabase.rpc('assign_player_curriculum_state', {
    p_player_id: playerId,
    p_academy_id: academyId,
    p_level_id: levelId,
  } as any)

  if (rpcError) return { error: rpcError.message ?? 'Failed to assign curriculum level' }

  revalidatePath(`/director/players/${playerId}`)
  return {}
}
