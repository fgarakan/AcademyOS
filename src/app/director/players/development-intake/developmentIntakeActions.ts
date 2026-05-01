'use server'

import { getSupabaseServer } from '@/lib/supabase/server'

export interface DevelopmentIntakeValues {
  strengths: string[]
  needs: string[]
  currentPriority: string | null
  coachNotes: string | null
}

export interface IntakeUpdateResult {
  ok: boolean
  error?: string
}

async function resolveDirectorOrCoach(supabase: any): Promise<
  { userId: string; academyId: string } | { error: string }
> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { error: 'Academy context unavailable.' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('profile_id', user.id)
    .eq('academy_id', profile.academy_id)
    .eq('is_active', true)
    .in('role', ['academy_director', 'head_coach', 'coach'])
    .single()
  if (!membership) return { error: 'Access denied.' }

  return { userId: user.id, academyId: profile.academy_id }
}

export async function updatePlayerDevelopmentIntakeAction(
  playerId: string,
  values: DevelopmentIntakeValues
): Promise<IntakeUpdateResult> {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any
  const ctx = await resolveDirectorOrCoach(supabase)
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const { userId, academyId } = ctx

  // Verify player belongs to this academy
  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return { ok: false, error: 'Player not found.' }

  // Upsert development summary
  const cleanStrengths = values.strengths.map(s => s.trim()).filter(s => s.length > 0).slice(0, 3)
  const cleanNeeds = values.needs.map(n => n.trim()).filter(n => n.length > 0).slice(0, 3)
  const devFocus = cleanNeeds.length > 0 ? cleanNeeds[0] : null

  const { error: devErr } = await rawDb
    .from('player_development_summary')
    .upsert({
      player_id: playerId,
      academy_id: academyId,
      created_by: userId,
      updated_by: userId,
      current_strengths: cleanStrengths,
      things_to_work_on: cleanNeeds,
      development_focus: devFocus,
      coach_summary: values.coachNotes ?? null,
      show_to_student: false,
      show_to_parent: false,
      source: 'manual',
    }, { onConflict: 'player_id' })

  if (devErr) return { ok: false, error: devErr.message }

  // Handle priority: deactivate existing active priorities, create new one
  if (values.currentPriority) {
    await rawDb
      .from('player_priorities')
      .update({ is_active: false, status: 'addressed' })
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .eq('is_active', true)

    await rawDb
      .from('player_priorities')
      .insert({
        player_id: playerId,
        academy_id: academyId,
        category: 'technical_skill',
        title: values.currentPriority.slice(0, 200),
        priority_rank: 1,
        is_active: true,
        status: 'open',
      })
  }

  return { ok: true }
}
