'use server'

import { getSupabaseServer } from '@/lib/supabase/server'

interface ReviewResult {
  ok: boolean
  error?: string
}

async function resolveAcademyDirectorOrCoach(supabase: any): Promise<{ userId: string; academyId: string } | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return null

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('profile_id', user.id)
    .eq('academy_id', profile.academy_id)
    .eq('is_active', true)
    .in('role', ['academy_director', 'head_coach'])
    .single()
  if (!membership) return null

  return { userId: user.id, academyId: profile.academy_id }
}

export async function approveSuggestionAction(suggestionId: string): Promise<ReviewResult> {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any
  const auth = await resolveAcademyDirectorOrCoach(supabase)
  if (!auth) return { ok: false, error: 'Access denied.' }

  const { error } = await rawDb
    .from('session_adjustment_suggestions')
    .update({ status: 'approved', approved_by: auth.userId, approved_at: new Date().toISOString() })
    .eq('id', suggestionId)
    .eq('academy_id', auth.academyId)
    .in('status', ['pending_review'])

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function rejectSuggestionAction(suggestionId: string): Promise<ReviewResult> {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any
  const auth = await resolveAcademyDirectorOrCoach(supabase)
  if (!auth) return { ok: false, error: 'Access denied.' }

  const { error } = await rawDb
    .from('session_adjustment_suggestions')
    .update({ status: 'rejected' })
    .eq('id', suggestionId)
    .eq('academy_id', auth.academyId)
    .in('status', ['pending_review', 'approved'])

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function dismissSuggestionAction(suggestionId: string): Promise<ReviewResult> {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any
  const auth = await resolveAcademyDirectorOrCoach(supabase)
  if (!auth) return { ok: false, error: 'Access denied.' }

  const { error } = await rawDb
    .from('session_adjustment_suggestions')
    .update({ status: 'dismissed' })
    .eq('id', suggestionId)
    .eq('academy_id', auth.academyId)
    .not('status', 'eq', 'applied')

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
