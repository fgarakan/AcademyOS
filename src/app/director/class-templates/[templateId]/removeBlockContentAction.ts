'use server'

import { getSupabaseServer } from '@/lib/supabase/server'

export async function removeBlockContentAction(
  cctbId: string,
  templateId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  const academyId = profile?.academy_id
  if (!academyId) return { ok: false, error: 'Academy context unavailable' }

  const rawDb = supabase as any

  // Fetch the row and verify ownership via template_id → academy_id
  const { data: row } = await rawDb
    .from('curriculum_class_template_blocks')
    .select('id, template_id, block_id, content_item_id')
    .eq('id', cctbId)
    .eq('template_id', templateId)
    .single()
  if (!row) return { ok: false, error: 'Assigned content not found' }

  // Confirm template belongs to this academy
  const { data: template } = await rawDb
    .from('templates')
    .select('id')
    .eq('id', row.template_id)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { ok: false, error: 'Access denied' }

  const { error: deleteError } = await rawDb
    .from('curriculum_class_template_blocks')
    .delete()
    .eq('id', cctbId)
  if (deleteError) return { ok: false, error: `Delete failed: ${deleteError.message}` }

  // Audit log
  await supabase.from('audit_logs').insert({
    academy_id: academyId,
    actor_id: user.id,
    actor_role: null,
    action: 'block_content_removed',
    source_type: 'director_action',
    target_type: 'template_block',
    target_id: row.block_id,
    target_label: `block ${row.block_id} — content removed`,
    payload: { template_id: templateId, cctb_id: cctbId, content_item_id: row.content_item_id },
    voice_command_id: null,
  })

  return { ok: true }
}
