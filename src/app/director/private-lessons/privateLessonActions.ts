'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type PLRStatus = 'new' | 'reviewing' | 'assigned' | 'scheduled' | 'declined' | 'completed'

async function resolveDirectorContext() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const rawDb = supabase as any
  const { data: membership } = await rawDb
    .from('academy_memberships')
    .select('academy_id, role')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) throw new Error('No active academy membership')
  if (!['academy_director', 'head_coach'].includes(membership.role)) {
    throw new Error('Insufficient permissions')
  }

  return { supabase, rawDb, academyId: membership.academy_id as string }
}

export async function updatePrivateLessonStatusAction(
  requestId: string,
  status: PLRStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const { rawDb, academyId } = await resolveDirectorContext()

    const { error } = await rawDb
      .from('private_lesson_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('academy_id', academyId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/director/private-lessons')
    revalidatePath('/director')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateDirectorNotesAction(
  requestId: string,
  directorNotes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { rawDb, academyId } = await resolveDirectorContext()

    const { error } = await rawDb
      .from('private_lesson_requests')
      .update({ director_notes: directorNotes, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('academy_id', academyId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/director/private-lessons')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
