'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function recordGateEvidenceAction(
  playerId: string,
  academyId: string,
  gateId: string,
  gateCriterion: string,
  evidenceText: string,
): Promise<{ error?: string }> {
  if (!evidenceText.trim()) return { error: 'Evidence text is required.' }

  const supabase = await getSupabaseServer()
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

  const rawDb = supabase as any
  const { error } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by: user.id,
      action_type: 'other',
      proposed_action_payload: {
        subtype: 'curriculum_gate_observation',
        player_id: playerId,
        gate_id: gateId,
        gate_criterion: gateCriterion,
        evidence_text: evidenceText.trim(),
        observed_at: new Date().toISOString(),
      },
      status: 'pending_review',
      requires_approval: true,
      human_readable_description: `Gate evidence recorded: "${gateCriterion.slice(0, 80)}"`,
    })

  if (error) return { error: error.message ?? 'Failed to record evidence' }

  revalidatePath(`/director/players/${playerId}`)
  return {}
}
