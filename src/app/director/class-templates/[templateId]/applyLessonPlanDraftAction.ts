'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import type { LessonPlanDraft } from './generateLessonPlanDraftAction'

export async function applyLessonPlanDraftAction(
  templateId: string,
  draft: LessonPlanDraft,
): Promise<{ success?: boolean; totalApplied?: number; error?: string }> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  const academyId = profile?.academy_id
  if (!academyId) return { error: 'Academy context unavailable' }

  const rawDb = supabase as any

  // Confirm template belongs to this academy before any writes
  const { data: template } = await rawDb
    .from('templates')
    .select('id, name')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { error: 'Template not found or access denied' }

  // Verify draft templateId matches
  if (draft.templateId !== templateId) return { error: 'Draft does not match this template' }

  // Delete all existing curriculum_class_template_blocks for this template
  const { error: deleteError } = await rawDb
    .from('curriculum_class_template_blocks')
    .delete()
    .eq('template_id', templateId)
  if (deleteError) return { error: `Failed to clear existing plan: ${deleteError.message}` }

  // Build insert rows — content items only (no drills in generated drafts)
  const rows: Array<{
    template_id: string
    block_id: string
    content_item_id: string
    drill_id: null
    order_index: number
    notes: null
    duration_min: number | null
  }> = []

  for (const block of draft.blocks) {
    block.contentItems.forEach((item, j) => {
      rows.push({
        template_id: templateId,
        block_id: block.blockId,
        content_item_id: item.contentItemId,
        drill_id: null,
        order_index: j + 1,
        notes: null,
        duration_min: item.durationMin,
      })
    })
  }

  if (rows.length === 0) return { error: 'Draft has no content items to apply' }

  const { error: insertError } = await rawDb
    .from('curriculum_class_template_blocks')
    .insert(rows)
  if (insertError) return { error: `Failed to apply lesson plan: ${insertError.message}` }

  // Audit log
  await supabase.from('audit_logs').insert({
    academy_id: academyId,
    actor_id: user.id,
    actor_role: null,
    action: 'lesson_plan_applied',
    source_type: 'director_action',
    target_type: 'template',
    target_id: templateId,
    target_label: `${template.name} — ${draft.levelName}`,
    payload: {
      level_id: draft.levelId,
      level_name: draft.levelName,
      total_items: draft.totalItems,
      block_count: draft.blocks.length,
    },
    voice_command_id: null,
  })

  return { success: true, totalApplied: rows.length }
}
