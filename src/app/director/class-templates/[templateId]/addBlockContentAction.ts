'use server'

import { getSupabaseServer } from '@/lib/supabase/server'

export async function addBlockContentAction(
  templateId: string,
  blockId: string,
  contentItemId: string,
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

  // Verify template belongs to this academy
  const { data: template } = await rawDb
    .from('templates')
    .select('id')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { ok: false, error: 'Template not found or access denied' }

  // Verify block belongs to this template
  const { data: block } = await supabase
    .from('template_blocks')
    .select('id')
    .eq('id', blockId)
    .eq('template_id', templateId)
    .single()
  if (!block) return { ok: false, error: 'Block not found on this template' }

  // Verify content item exists and is active global content
  const { data: contentItem } = await rawDb
    .from('curriculum_content_items')
    .select('id')
    .eq('id', contentItemId)
    .eq('is_active', true)
    .single()
  if (!contentItem) return { ok: false, error: 'Content item not found or inactive' }

  // Duplicate check: same block + content item
  const { data: existing } = await rawDb
    .from('curriculum_class_template_blocks')
    .select('id')
    .eq('block_id', blockId)
    .eq('content_item_id', contentItemId)
    .maybeSingle()
  if (existing) return { ok: false, error: 'This content item is already assigned to this block' }

  // Compute next order_index for this block
  const { data: existingRows } = await rawDb
    .from('curriculum_class_template_blocks')
    .select('order_index')
    .eq('block_id', blockId)
    .order('order_index', { ascending: false })
    .limit(1)
  const maxIndex = existingRows?.[0]?.order_index ?? 0
  const nextIndex = maxIndex + 1

  // Insert
  const { error: insertError } = await rawDb
    .from('curriculum_class_template_blocks')
    .insert({
      template_id: templateId,
      block_id: blockId,
      content_item_id: contentItemId,
      drill_id: null,
      order_index: nextIndex,
      notes: null,
      duration_min: null,
    })
  if (insertError) return { ok: false, error: `Insert failed: ${insertError.message}` }

  // Audit log
  await supabase.from('audit_logs').insert({
    academy_id: academyId,
    actor_id: user.id,
    actor_role: null,
    action: 'block_content_added',
    source_type: 'director_action',
    target_type: 'template_block',
    target_id: blockId,
    target_label: `block ${blockId} ← content ${contentItemId}`,
    payload: { template_id: templateId, content_item_id: contentItemId, order_index: nextIndex },
    voice_command_id: null,
  })

  return { ok: true }
}
