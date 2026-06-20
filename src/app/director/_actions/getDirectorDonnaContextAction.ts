'use server'

// Mega Sprint 3271–3300 — ONE DONNA Operating System Convergence V1
// Loads the full DirectorDonnaContext for the floating DONNA panel so it can run
// the same canonical router (and reach the same rich engines) as /director/donna.
//
// Rules:
//   - Director role only; RLS-scoped via academy_id from server-side auth
//   - Read-only: no mutations, no proposed_actions created
//   - Returns null on auth failure; loadDirectorDonnaContext itself falls back to a
//     clearly-labelled demo context when live data is unavailable (never fabricates)

import { getSupabaseServer } from '@/lib/supabase/server'
import { loadDirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'

export async function getDirectorDonnaContextAction(): Promise<DirectorDonnaContext | null> {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()

    if (!profile?.academy_id) return null

    return await loadDirectorDonnaContext(supabase, profile.academy_id)
  } catch {
    return null
  }
}
