'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'

export type CoachSuggestionResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

export async function submitCoachCurriculumSuggestion(input: {
  levelId: string
  levelName: string
  suggestionText: string
}): Promise<CoachSuggestionResult> {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as unknown as {
    from: (t: string) => {
      insert: (d: unknown) => { select: (s: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } }
    }
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('academy_id').eq('id', user.id).single()
  if (!profile?.academy_id) return { ok: false, error: 'No academy context' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  // Coaches can suggest; directors and head coaches use the full builder instead
  const allowedRoles = ['coach', 'head_coach', 'academy_director']
  if (!membership?.role || !allowedRoles.includes(membership.role)) {
    return { ok: false, error: 'Only coaches can submit curriculum suggestions via this form' }
  }

  const { data: vc, error: vcError } = await rawDb
    .from('voice_commands')
    .insert({
      academy_id: profile.academy_id,
      issuer_id: user.id,
      issuer_role: membership.role,
      input_method: 'typed',
      raw_input: input.suggestionText,
      transcript: input.suggestionText,
      processing_status: 'processed',
      normalized_intent: {
        source: 'coach_curriculum_suggestion',
        level_id: input.levelId,
      } as unknown as Json,
    })
    .select('id')
    .single()

  if (vcError || !vc) {
    return { ok: false, error: `Could not record suggestion — ${vcError?.message ?? 'unknown'}` }
  }

  const { data: pa, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: profile.academy_id,
      proposed_by_id: user.id,
      voice_command_id: vc.id,
      action_type: 'other',
      action_label: `Coach suggestion — ${input.levelName}`,
      target_module: 'curriculum_builder',
      target_object_id: input.levelId,
      target_object_type: 'curriculum_level',
      proposed_payload: {
        source: 'coach_curriculum_suggestion',
        level_id: input.levelId,
        level_name: input.levelName,
        suggestion: input.suggestionText,
        submitted_by_role: membership.role,
      } as unknown as Json,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: ['Coach suggestion — requires director review before any curriculum change is drafted.'],
    })
    .select('id')
    .single()

  if (paError || !pa) {
    return { ok: false, error: `Could not queue suggestion — ${paError?.message ?? 'unknown'}` }
  }

  return { ok: true, id: pa.id }
}
