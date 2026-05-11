'use server'

import { getSupabaseServer } from '@/lib/supabase/server'

export interface MarkFirstRunDeckSeenResult {
  ok: boolean
  error: string | null
}

export async function markFirstRunDeckSeenAction(): Promise<MarkFirstRunDeckSeenResult> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  // has_seen_first_run_deck is not yet in database.types.ts (Sprint 211 migration).
  // Use rawDb cast — this is the established pattern for un-typed columns.
  const rawDb = supabase as any
  const { error } = await rawDb
    .from('profiles')
    .update({
      has_seen_first_run_deck: true,
      first_run_deck_seen_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { ok: false, error: error.message ?? 'Failed to mark deck seen' }
  return { ok: true, error: null }
}
