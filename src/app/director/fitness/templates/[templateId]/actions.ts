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

  // 4. Reject empty or missing IDs before any DB verification
  if (blocks.some(b => !b.id)) return { error: 'Block payload contains empty IDs.' }
  if (exercises.some(e => !e.id || !e.block_id)) return { error: 'Exercise payload contains empty IDs.' }

  // 5. Reject duplicate block IDs in submitted payload
  const submittedBlockIds = blocks.map(b => b.id)
  if (new Set(submittedBlockIds).size !== submittedBlockIds.length) {
    return { error: 'Duplicate block IDs in submitted payload.' }
  }

  // 6. Reject duplicate exercise IDs in submitted payload
  const submittedExerciseIds = exercises.map(e => e.id)
  if (new Set(submittedExerciseIds).size !== submittedExerciseIds.length) {
    return { error: 'Duplicate exercise IDs in submitted payload.' }
  }

  // 7. Reject negative duration values
  if (blocks.some(b => b.duration_min < 0)) {
    return { error: 'Block duration must be 0 or greater.' }
  }
  if (exercises.some(e => e.duration_min !== null && e.duration_min < 0)) {
    return { error: 'Exercise duration must be 0 or greater.' }
  }

  // 8. Verify all submitted block IDs actually belong to this template
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

  // 9. Verify all submitted exercise IDs belong to the submitted blocks,
  //    AND that the submitted block_id matches the actual DB block_id.
  //    Without the block_id match check, a wrong submitted block_id would pass
  //    verification but cause the DB update to silently match no rows (data loss).
  if (submittedExerciseIds.length > 0) {
    const { data: dbExercises } = await supabase
      .from('template_block_exercises')
      .select('id, block_id')
      .in('id', submittedExerciseIds)
      .in('block_id', submittedBlockIds)

    const dbExerciseMap = new Map((dbExercises ?? []).map(e => [e.id, e.block_id]))

    for (const ex of exercises) {
      if (!dbExerciseMap.has(ex.id)) {
        return { error: 'One or more exercise IDs are invalid for this template.' }
      }
      if (dbExerciseMap.get(ex.id) !== ex.block_id) {
        return { error: 'Exercise block assignment does not match template structure.' }
      }
    }
  }

  // 10. Normalize order_index — sort by submitted order_index, reassign as clean 0-based
  //     sequential integers. Ensures no gaps, no duplicates, and no negative values in DB
  //     regardless of what the client submitted. Critical for future voice command compatibility
  //     where order may arrive out of sequence.
  const normalizedBlocks = [...blocks]
    .sort((a, b) => a.order_index - b.order_index)
    .map((b, i) => ({ ...b, order_index: i }))

  // Group exercises by block_id, normalize within each block independently
  const exercisesByBlock: Record<string, ExerciseUpdate[]> = {}
  for (const ex of exercises) {
    if (!exercisesByBlock[ex.block_id]) exercisesByBlock[ex.block_id] = []
    exercisesByBlock[ex.block_id].push(ex)
  }
  const normalizedExercises: ExerciseUpdate[] = []
  for (const blockId of Object.keys(exercisesByBlock)) {
    const sorted = exercisesByBlock[blockId].sort(
      (a: ExerciseUpdate, b: ExerciseUpdate) => a.order_index - b.order_index
    )
    sorted.forEach((ex: ExerciseUpdate, i: number) => normalizedExercises.push({ ...ex, order_index: i }))
  }

  // 11. Update blocks — order_index and duration_min only
  // Double-lock: .eq('id') + .eq('template_id') so RLS + app layer both enforce ownership.
  // Does not touch: name, type, notes, intensity, created_at, or template identity fields.
  for (const block of normalizedBlocks) {
    const { error } = await supabase
      .from('template_blocks')
      .update({ order_index: block.order_index, duration_min: block.duration_min })
      .eq('id', block.id)
      .eq('template_id', templateId)
    if (error) return { error: `Failed to update block: ${error.message}` }
  }

  // 12. Update exercises — order_index and duration_min only
  // Double-lock: .eq('id') + .eq('block_id') so RLS + app layer both enforce ownership.
  // Does not touch: exercise_id, notes, or block assignment.
  for (const ex of normalizedExercises) {
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
