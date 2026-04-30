'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'

// Structured operation types — aligned with future voice command pathway.
// Voice commands will generate the same operation types for template mutations,
// routing through the proposed_actions pipeline before reaching this save layer.
export type TemplateOperation =
  | { type: 'reorder_block'; block_id: string; new_order_index: number }
  | { type: 'reorder_exercise'; template_block_exercise_id: string; block_id: string; new_order_index: number }
  | { type: 'update_block_duration'; block_id: string; duration_min: number }
  | { type: 'update_exercise_duration'; template_block_exercise_id: string; duration_min: number | null }

export interface BlockUpdate {
  id: string
  duration_min: number
  order_index: number
}

export interface ExerciseUpdate {
  id: string       // template_block_exercises.id
  block_id: string
  duration_min: number | null
  order_index: number
}

export async function saveTemplateEditsAction(
  templateId: string,
  blocks: BlockUpdate[],
  exercises: ExerciseUpdate[]
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseServer()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // 2. Resolve academy from authenticated profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  // 3. Verify template belongs to this academy — prevents cross-academy writes
  const { data: template } = await supabase
    .from('templates')
    .select('id')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { error: 'Template not found or access denied.' }

  // 4. Verify all submitted block IDs actually belong to this template
  const submittedBlockIds = blocks.map(b => b.id)
  if (submittedBlockIds.length > 0) {
    const { data: dbBlocks } = await supabase
      .from('template_blocks')
      .select('id')
      .eq('template_id', templateId)
      .in('id', submittedBlockIds)

    const validBlockIds = new Set((dbBlocks ?? []).map(b => b.id))
    if (submittedBlockIds.some(id => !validBlockIds.has(id))) {
      return { error: 'One or more block IDs are invalid for this template.' }
    }
  }

  // 5. Verify all submitted exercise IDs belong to the submitted blocks
  const submittedExerciseIds = exercises.map(e => e.id)
  if (submittedExerciseIds.length > 0) {
    const { data: dbExercises } = await supabase
      .from('template_block_exercises')
      .select('id')
      .in('id', submittedExerciseIds)
      .in('block_id', submittedBlockIds)

    const validExerciseIds = new Set((dbExercises ?? []).map(e => e.id))
    if (submittedExerciseIds.some(id => !validExerciseIds.has(id))) {
      return { error: 'One or more exercise IDs are invalid for this template.' }
    }
  }

  // 6. Update blocks — order_index and duration_min only
  // Double-lock: .eq('id') + .eq('template_id') so RLS + app layer both enforce ownership
  for (const block of blocks) {
    const { error } = await supabase
      .from('template_blocks')
      .update({ order_index: block.order_index, duration_min: block.duration_min })
      .eq('id', block.id)
      .eq('template_id', templateId)
    if (error) return { error: `Failed to update block: ${error.message}` }
  }

  // 7. Update exercises — order_index and duration_min only
  // Double-lock: .eq('id') + .eq('block_id') so RLS + app layer both enforce ownership
  for (const ex of exercises) {
    const { error } = await supabase
      .from('template_block_exercises')
      .update({ order_index: ex.order_index, duration_min: ex.duration_min })
      .eq('id', ex.id)
      .eq('block_id', ex.block_id)
    if (error) return { error: `Failed to update exercise: ${error.message}` }
  }

  revalidatePath(`/director/fitness/templates/${templateId}`)
  return { error: null }
}
