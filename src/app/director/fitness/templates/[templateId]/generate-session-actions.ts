'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface GenerateSessionInput {
  templateId: string
  name: string
  scheduledDate: string
  coachId: string
  sessionNotes?: string | null
}

export interface GenerateSessionResult {
  sessionId: string | null
  error: string | null
}

export async function generateSessionFromTemplateAction(
  input: GenerateSessionInput
): Promise<GenerateSessionResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { sessionId: null, error: 'Not authenticated.' }

  // 2. Resolve academy_id from authenticated profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { sessionId: null, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  // 3. Verify template belongs to this academy — prevents cross-academy writes
  //    Also fetch curriculum_level_id (added in migration 045, not in database.types.ts)
  const rawDb = supabase as any
  const { data: template } = await rawDb
    .from('templates')
    .select('id, name, curriculum_level_id')
    .eq('id', input.templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { sessionId: null, error: 'Template not found or access denied.' }

  // 3a. Resolve curriculum level name if template has one — prepended to session_notes
  let curriculumLevelName: string | null = null
  if (template.curriculum_level_id) {
    const { data: levelRow } = await rawDb
      .from('curriculum_levels')
      .select('display_name')
      .eq('id', template.curriculum_level_id)
      .single()
    curriculumLevelName = levelRow?.display_name ?? null
  }

  // 4. Validate coach is an active member of this academy
  //    Director's own profile passes this check (they are also a member)
  const { data: coachMembership } = await supabase
    .from('academy_memberships')
    .select('profile_id')
    .eq('academy_id', academyId)
    .eq('profile_id', input.coachId)
    .eq('is_active', true)
    .single()
  if (!coachMembership) return { sessionId: null, error: 'Selected coach is not a valid active member of this academy.' }

  // 5. Fetch template_blocks — snapshot at generation time, ordered by display order
  const { data: templateBlocks, error: blocksError } = await supabase
    .from('template_blocks')
    .select('id, name, type, duration_min, order_index, intensity, notes')
    .eq('template_id', input.templateId)
    .order('order_index')

  if (blocksError) return { sessionId: null, error: `Failed to fetch template blocks: ${blocksError.message}` }
  if (!templateBlocks || templateBlocks.length === 0) {
    return { sessionId: null, error: 'This template has no blocks. Add blocks to the template before generating a session.' }
  }

  // 6. Fetch template_block_exercises for all blocks
  const blockIds = templateBlocks.map(b => b.id)
  const { data: templateExercises, error: exError } = await supabase
    .from('template_block_exercises')
    .select('id, block_id, exercise_id, order_index, duration_min, notes')
    .in('block_id', blockIds)
    .order('order_index')

  if (exError) return { sessionId: null, error: `Failed to fetch template exercises: ${exError.message}` }

  // 7. Insert planned session row
  //    template_id preserved so the session knows its source template.
  //    status='planned' — this is a planned lesson plan snapshot, not a live session.
  //    Coach changes happen on session_blocks/session_block_exercises only, never here.
  //    Curriculum level name is prepended to session_notes so the coach can see
  //    the curriculum focus without needing to query the template separately.
  const curriculumPrefix = curriculumLevelName
    ? `[Curriculum: ${curriculumLevelName}]\n\n`
    : ''
  const finalSessionNotes = curriculumPrefix + (input.sessionNotes?.trim() ?? '')
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      academy_id: academyId,
      coach_id: input.coachId,
      template_id: input.templateId,
      name: input.name.trim() || template.name,
      scheduled_date: input.scheduledDate,
      session_notes: finalSessionNotes.trim() || null,
      status: 'planned',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (sessionError || !session) {
    return { sessionId: null, error: `Failed to create session: ${sessionError?.message ?? 'Unknown error'}` }
  }

  const sessionId = session.id

  // 8. Insert session_blocks — one per template block, sequential to respect RLS
  //    template_block_id preserves the source reference so session and template stay linked.
  //    is_override=false: these are the initial planned values, not coach overrides yet.
  //    Future coach changes will update these rows (is_override=true) without touching templates.
  const templateBlockToSessionBlock = new Map<string, string>()

  for (const block of templateBlocks) {
    const { data: insertedBlock, error: blockError } = await supabase
      .from('session_blocks')
      .insert({
        session_id: sessionId,
        template_block_id: block.id,
        name: block.name,
        type: block.type,
        duration_min: block.duration_min,
        order_index: block.order_index,
        intensity: block.intensity,
        notes: block.notes,
        is_override: false,
      })
      .select('id')
      .single()

    if (blockError || !insertedBlock) {
      return { sessionId: null, error: `Failed to create session block "${block.name}": ${blockError?.message ?? 'Unknown error'}` }
    }

    templateBlockToSessionBlock.set(block.id, insertedBlock.id)
  }

  // 9. Insert session_block_exercises — one per template exercise, sequential
  //    exercise_id copied directly — same exercise library record.
  //    completed=false: exercises start as not completed in a planned session.
  for (const ex of (templateExercises ?? [])) {
    const sessionBlockId = templateBlockToSessionBlock.get(ex.block_id)
    if (!sessionBlockId) continue

    const { error: exInsertError } = await supabase
      .from('session_block_exercises')
      .insert({
        block_id: sessionBlockId,
        exercise_id: ex.exercise_id,
        order_index: ex.order_index,
        duration_min: ex.duration_min,
        notes: ex.notes,
        completed: false,
      })

    if (exInsertError) {
      return { sessionId: null, error: `Failed to create session exercise: ${exInsertError.message}` }
    }
  }

  return { sessionId, error: null }
}
