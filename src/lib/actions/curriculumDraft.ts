'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'

export type CurriculumDraftResult =
  | { ok: true; draftId: string }
  | { ok: false; error: string; blocked: boolean }

export async function saveCurriculumDraftAction(input: {
  levelId: string
  levelName: string
  changeType: 'add_drill' | 'add_gate' | 'add_fitness' | 'add_mission' | 'rewrite_level'
  description: string
  domain?: string
}): Promise<CurriculumDraftResult> {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as unknown as {
    from: (t: string) => {
      insert: (d: unknown) => { select: (s: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } }
    }
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { ok: false, error: 'Not authenticated', blocked: true }

  const { data: profile } = await supabase.from('profiles').select('academy_id').eq('id', user.id).single()
  if (!profile?.academy_id) return { ok: false, error: 'No academy context', blocked: true }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (membership?.role !== 'academy_director' && membership?.role !== 'head_coach') {
    return { ok: false, error: 'Only directors and head coaches can draft curriculum changes', blocked: true }
  }

  const actionLabel = `Curriculum Draft — ${input.changeType.replace(/_/g, ' ')} · ${input.levelName}`

  const { data: voiceCommand, error: vcError } = await rawDb
    .from('voice_commands')
    .insert({
      academy_id: profile.academy_id,
      issuer_id: user.id,
      issuer_role: membership.role,
      input_method: 'typed',
      raw_input: input.description,
      transcript: input.description,
      processing_status: 'processed',
      normalized_intent: { source: 'curriculum_builder', change_type: input.changeType, level_id: input.levelId } as unknown as Json,
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return {
      ok: false,
      error: `Blocked: could not create command record — ${vcError?.message ?? 'unknown'}. Schema may need voice_command_id to be optional for curriculum drafts.`,
      blocked: true,
    }
  }

  const payload = {
    source: 'curriculum_builder',
    change_type: input.changeType,
    level_id: input.levelId,
    level_name: input.levelName,
    description: input.description,
    domain: input.domain ?? null,
    drafted_by_role: membership.role,
  }

  const { data: proposedAction, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: profile.academy_id,
      proposed_by_id: user.id,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: actionLabel,
      target_module: 'curriculum_builder',
      target_object_id: input.levelId,
      target_object_type: 'curriculum_level',
      proposed_payload: payload as unknown as Json,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: ['Curriculum draft from builder. No curriculum data is mutated until director approves.'],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    return {
      ok: false,
      error: `Blocked: proposed_actions insert failed — ${paError?.message ?? 'unknown'}`,
      blocked: true,
    }
  }

  return { ok: true, draftId: proposedAction.id }
}
