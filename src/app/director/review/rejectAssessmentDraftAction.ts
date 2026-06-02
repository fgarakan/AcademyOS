'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function rejectDraftAction(id: string): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any
  const { error } = await rawDb
    .from('proposed_actions')
    .update({ status: 'rejected' })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/director/review')
  return { ok: true, error: null }
}
