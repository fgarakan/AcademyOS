'use server'

import { getSupabaseServer } from '@/lib/supabase/server'

export interface RollbackAcademyCurriculumOverrideResult {
  ok: boolean
  error: string | null
  rollbackRecordId: string | null
}

export async function rollbackAcademyCurriculumOverrideAction(
  overrideId: string,
): Promise<RollbackAcademyCurriculumOverrideResult> {
  const fail = (error: string): RollbackAcademyCurriculumOverrideResult =>
    ({ ok: false, error, rollbackRecordId: null })

  if (!overrideId) return fail('Missing override ID.')

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')

  // 2. Resolve academy_id from authenticated profile — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.')
  const academyId = profile.academy_id

  // 3. Verify active academy membership — director or head_coach only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return fail('You do not have permission to rollback curriculum overrides.')
  }

  const rawDb = supabase as any

  // 4. Fetch the override — verify ownership and status
  const { data: originalOverride } = await rawDb
    .from('academy_curriculum_overrides')
    .select('id, academy_id, curriculum_version_id, status, target_type, target_id, scope, pathway, proposed_change, applied_change, source, raw_input')
    .eq('id', overrideId)
    .single()

  if (!originalOverride) return fail('Override not found.')
  if (originalOverride.academy_id !== academyId) return fail('Access denied.')
  if (originalOverride.status !== 'applied') {
    return fail(`Only applied overrides can be rolled back. Current status: ${originalOverride.status}`)
  }

  const now = new Date().toISOString()

  // 5. Create a rollback record — preserves full audit trail
  const rollbackPayload = {
    summary: `Rollback of override ${overrideId}. Original change reversed.`,
    rolled_back_override_id: overrideId,
    original_change: originalOverride.applied_change ?? originalOverride.proposed_change,
  }

  const { data: rollbackRecord, error: rollbackInsertError } = await rawDb
    .from('academy_curriculum_overrides')
    .insert({
      academy_id: academyId,
      curriculum_version_id: originalOverride.curriculum_version_id,
      target_type: originalOverride.target_type,
      target_id: originalOverride.target_id,
      override_type: 'remove',
      scope: originalOverride.scope,
      pathway: originalOverride.pathway,
      original_snapshot: originalOverride.applied_change ?? originalOverride.proposed_change,
      proposed_change: rollbackPayload,
      applied_change: rollbackPayload,
      override_reason: `Rollback of override ${overrideId}`,
      source: originalOverride.source ?? 'ui',
      raw_input: originalOverride.raw_input,
      status: 'applied',
      created_by: user.id,
      approved_by: user.id,
      approved_at: now,
      applied_by: user.id,
      applied_at: now,
      rollback_of_override_id: overrideId,
    })
    .select('id')
    .single()

  if (rollbackInsertError || !rollbackRecord) {
    return fail(`Failed to create rollback record: ${rollbackInsertError?.message ?? 'unknown error'}`)
  }

  const rollbackRecordId = rollbackRecord.id as string

  // 6. Mark original override as rolled_back
  const { error: updateError } = await rawDb
    .from('academy_curriculum_overrides')
    .update({ status: 'rolled_back' })
    .eq('id', overrideId)
    .eq('academy_id', academyId)

  if (updateError) {
    return fail(`Rollback record created (${rollbackRecordId}) but failed to update original: ${updateError.message}`)
  }

  // 7. Write audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'curriculum_override.rolled_back',
      target_type: 'academy_curriculum_override',
      target_id: overrideId,
      payload: {
        original_override_id: overrideId,
        rollback_record_id: rollbackRecordId,
        rolled_back_by: user.id,
        rolled_back_at: now,
      },
      source_type: 'ui',
    })

  return { ok: true, error: null, rollbackRecordId }
}
