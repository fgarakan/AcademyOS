'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export async function saveGeneralCaptureAction(
  academyId: string,
  content: string
): Promise<void> {
  await assertNotPreviewMode()
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const trimmed = content?.trim()
  if (!trimmed) throw new Error('Capture content is required')

  const { error } = await supabase
    .from('voice_notes')
    .insert({
      academy_id: academyId,
      author_id: user.id,
      player_id: null,
      session_id: null,
      raw_input: trimmed,
      transcript: trimmed,
      audio_path: null,
      processing_status: 'pending_review',
    })

  if (error) throw error

  revalidatePath('/director/review')
}

export async function dismissGeneralCaptureAction(
  captureId: string,
  academyId: string
): Promise<void> {
  await assertNotPreviewMode()
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('voice_notes')
    .update({ processing_status: 'dismissed' })
    .eq('id', captureId)
    .eq('academy_id', academyId)

  if (error) throw error

  revalidatePath('/director/review')
}
