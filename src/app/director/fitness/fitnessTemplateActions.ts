'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { isPreviewMode } from '@/lib/utils/previewMode'
import {
  getFitnessBlockLabel,
  getDbBlockType,
  getDefaultBlockDuration,
} from '@/lib/fitness/fitnessBlockTypes'
import type { FitnessBlockType } from '@/lib/fitness/fitnessBlockTypes'
import { getDefaultExercisesForFitnessBlock } from '@/lib/fitness/fitnessExerciseMatching'
import type { ExerciseCandidate } from '@/lib/fitness/fitnessExerciseMatching'

// ─────────────────────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────────────────────

async function resolveAcademyAndRole(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof getSupabaseServer>>; userId: string; academyId: string }
  | { ok: false; error: string }
> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, error: 'Director or Head Coach access required.' }
  }

  return { ok: true, supabase, userId: user.id, academyId: profile.academy_id }
}

// ─────────────────────────────────────────────────────────────
// createFitnessTemplateAction
// ─────────────────────────────────────────────────────────────

export type FitnessTemplateType =
  | 'standard'
  | 'pre_tournament'
  | 'post_tournament'
  | 'high_intensity'
  | 'low_load'
  | 'assessment'
  | 'recovery'

export interface CreateFitnessTemplateInput {
  name: string
  templateType: FitnessTemplateType
  description?: string
  totalDurationMin?: number
}

export interface CreateFitnessTemplateResult {
  ok: boolean
  error: string | null
  templateId: string | null
}

export async function createFitnessTemplateAction(
  input: CreateFitnessTemplateInput,
): Promise<CreateFitnessTemplateResult> {
  if (await isPreviewMode()) {
    return { ok: false, error: 'Writes are disabled in preview mode.', templateId: null }
  }
  const auth = await resolveAcademyAndRole()
  if (!auth.ok) return { ok: false, error: auth.error, templateId: null }
  const { supabase, userId, academyId } = auth

  const rawDb = supabase as any
  const { data, error } = await rawDb
    .from('templates')
    .insert({
      academy_id: academyId,
      created_by: userId,
      name: input.name,
      description: input.description ?? null,
      track: 'fitness',
      total_duration_min: input.totalDurationMin ?? null,
      is_active: true,
      is_default: false,
      tags: ['fitness_template:true', `template_type:${input.templateType}`],
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message, templateId: null }

  revalidatePath('/director/fitness/templates')
  return { ok: true, error: null, templateId: data.id }
}

// ─────────────────────────────────────────────────────────────
// addFitnessBlockAction
// ─────────────────────────────────────────────────────────────

export interface AddFitnessBlockResult {
  ok: boolean
  error: string | null
  blockId: string | null
}

export async function addFitnessBlockAction(
  templateId: string,
  blockType: FitnessBlockType,
  populateExercises = true,
): Promise<AddFitnessBlockResult> {
  const auth = await resolveAcademyAndRole()
  if (!auth.ok) return { ok: false, error: auth.error, blockId: null }
  const { supabase, academyId } = auth

  // Verify template is a fitness template in this academy
  const rawDb = supabase as any
  const { data: template } = await rawDb
    .from('templates')
    .select('id, tags')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { ok: false, error: 'Template not found or access denied.', blockId: null }
  const tags: string[] = template.tags ?? []
  if (!tags.includes('fitness_template:true')) {
    return { ok: false, error: 'This template is not a fitness template.', blockId: null }
  }

  // Determine next order_index
  const { data: existingBlocks } = await supabase
    .from('template_blocks')
    .select('order_index')
    .eq('template_id', templateId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextIndex = existingBlocks && existingBlocks.length > 0
    ? (existingBlocks[0].order_index + 1)
    : 0

  const dbBlockType = getDbBlockType(blockType)
  const blockName = getFitnessBlockLabel(blockType)
  const durationMin = getDefaultBlockDuration(blockType)

  const { data: newBlock, error: blockError } = await rawDb
    .from('template_blocks')
    .insert({
      template_id: templateId,
      name: blockName,
      type: dbBlockType,
      duration_min: durationMin,
      order_index: nextIndex,
    })
    .select('id')
    .single()

  if (blockError) return { ok: false, error: blockError.message, blockId: null }
  const blockId: string = newBlock.id

  // Auto-populate 3 matching exercises if requested
  if (populateExercises) {
    const { data: exercises } = await supabase
      .from('exercises')
      .select('id, name, category, subcategory, duration_min, tags')
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .order('name')

    const candidates: ExerciseCandidate[] = (exercises ?? []).map(ex => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      subcategory: ex.subcategory,
      duration_min: ex.duration_min,
      tags: ex.tags,
    }))

    const matched = getDefaultExercisesForFitnessBlock(blockType, candidates, 3)

    for (let i = 0; i < matched.length; i++) {
      await rawDb
        .from('template_block_exercises')
        .insert({
          block_id: blockId,
          exercise_id: matched[i].id,
          order_index: i,
          duration_min: matched[i].duration_min ?? null,
        })
    }
  }

  revalidatePath(`/director/fitness/templates/${templateId}`)
  return { ok: true, error: null, blockId }
}

// ─────────────────────────────────────────────────────────────
// removeFitnessBlockAction
// ─────────────────────────────────────────────────────────────

export async function removeFitnessBlockAction(
  templateId: string,
  blockId: string,
): Promise<{ ok: boolean; error: string | null }> {
  const auth = await resolveAcademyAndRole()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, academyId } = auth

  // Verify template ownership
  const rawDb = supabase as any
  const { data: template } = await rawDb
    .from('templates')
    .select('id, tags')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { ok: false, error: 'Template not found or access denied.' }
  const tags: string[] = template.tags ?? []
  if (!tags.includes('fitness_template:true')) {
    return { ok: false, error: 'This template is not a fitness template.' }
  }

  // Delete block exercises first (cascade safety)
  await rawDb.from('template_block_exercises').delete().eq('block_id', blockId)

  // Delete the block — also verify it belongs to this template
  const { error } = await supabase
    .from('template_blocks')
    .delete()
    .eq('id', blockId)
    .eq('template_id', templateId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/director/fitness/templates/${templateId}`)
  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// reorderFitnessBlocksAction
// ─────────────────────────────────────────────────────────────

export interface BlockOrderEntry {
  id: string
  order_index: number
}

export async function reorderFitnessBlocksAction(
  templateId: string,
  blocks: BlockOrderEntry[],
): Promise<{ ok: boolean; error: string | null }> {
  const auth = await resolveAcademyAndRole()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, academyId } = auth

  const rawDb = supabase as any
  const { data: template } = await rawDb
    .from('templates')
    .select('id, tags')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { ok: false, error: 'Template not found or access denied.' }
  const tags: string[] = template.tags ?? []
  if (!tags.includes('fitness_template:true')) {
    return { ok: false, error: 'This template is not a fitness template.' }
  }

  // Normalize and apply
  const normalized = [...blocks]
    .sort((a, b) => a.order_index - b.order_index)
    .map((b, i) => ({ ...b, order_index: i }))

  for (const block of normalized) {
    const { error } = await supabase
      .from('template_blocks')
      .update({ order_index: block.order_index })
      .eq('id', block.id)
      .eq('template_id', templateId)
    if (error) return { ok: false, error: error.message }
  }

  revalidatePath(`/director/fitness/templates/${templateId}`)
  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// addExerciseToFitnessBlockAction
// ─────────────────────────────────────────────────────────────

export async function addExerciseToFitnessBlockAction(
  templateId: string,
  blockId: string,
  exerciseId: string,
  durationMin?: number | null,
): Promise<{ ok: boolean; error: string | null }> {
  const auth = await resolveAcademyAndRole()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, academyId } = auth

  const rawDb = supabase as any

  // Verify template is a fitness template in this academy
  const { data: template } = await rawDb
    .from('templates')
    .select('id, tags')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { ok: false, error: 'Template not found or access denied.' }
  const tags: string[] = template.tags ?? []
  if (!tags.includes('fitness_template:true')) {
    return { ok: false, error: 'This template is not a fitness template.' }
  }

  // Verify block belongs to this template
  const { data: block } = await supabase
    .from('template_blocks')
    .select('id')
    .eq('id', blockId)
    .eq('template_id', templateId)
    .single()
  if (!block) return { ok: false, error: 'Block not found.' }

  // Get next order_index
  const { data: existing } = await rawDb
    .from('template_block_exercises')
    .select('order_index')
    .eq('block_id', blockId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0

  const { error } = await rawDb
    .from('template_block_exercises')
    .insert({
      block_id: blockId,
      exercise_id: exerciseId,
      order_index: nextIndex,
      duration_min: durationMin ?? null,
    })

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/director/fitness/templates/${templateId}`)
  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// removeExerciseFromFitnessBlockAction
// ─────────────────────────────────────────────────────────────

export async function removeExerciseFromFitnessBlockAction(
  templateId: string,
  blockId: string,
  templateBlockExerciseId: string,
): Promise<{ ok: boolean; error: string | null }> {
  const auth = await resolveAcademyAndRole()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, academyId } = auth

  const rawDb = supabase as any

  // Verify template
  const { data: template } = await rawDb
    .from('templates')
    .select('id, tags')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { ok: false, error: 'Template not found or access denied.' }
  const tags: string[] = template.tags ?? []
  if (!tags.includes('fitness_template:true')) {
    return { ok: false, error: 'This template is not a fitness template.' }
  }

  // Delete the specific template_block_exercise row — double-lock with block_id
  const { error } = await rawDb
    .from('template_block_exercises')
    .delete()
    .eq('id', templateBlockExerciseId)
    .eq('block_id', blockId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/director/fitness/templates/${templateId}`)
  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// swapExerciseInFitnessBlockAction
// ─────────────────────────────────────────────────────────────

export async function swapExerciseInFitnessBlockAction(
  templateId: string,
  blockId: string,
  templateBlockExerciseId: string,
  newExerciseId: string,
): Promise<{ ok: boolean; error: string | null }> {
  const auth = await resolveAcademyAndRole()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, academyId } = auth

  const rawDb = supabase as any

  // Verify template
  const { data: template } = await rawDb
    .from('templates')
    .select('id, tags')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { ok: false, error: 'Template not found or access denied.' }
  const tags: string[] = template.tags ?? []
  if (!tags.includes('fitness_template:true')) {
    return { ok: false, error: 'This template is not a fitness template.' }
  }

  // Update exercise_id only — preserves order_index and duration_min
  const { error } = await rawDb
    .from('template_block_exercises')
    .update({ exercise_id: newExerciseId })
    .eq('id', templateBlockExerciseId)
    .eq('block_id', blockId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/director/fitness/templates/${templateId}`)
  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// updateFitnessExercisePrescriptionAction
// Updates duration_min and/or notes on a template_block_exercise row.
// Does not alter the global exercise library item.
// ─────────────────────────────────────────────────────────────

export async function updateFitnessExercisePrescriptionAction(
  templateId: string,
  blockId: string,
  templateBlockExerciseId: string,
  prescription: { durationMin?: number | null; notes?: string | null },
): Promise<{ ok: boolean; error: string | null }> {
  const auth = await resolveAcademyAndRole()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, academyId } = auth

  const rawDb = supabase as any

  const { data: template } = await rawDb
    .from('templates')
    .select('id, tags')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { ok: false, error: 'Template not found or access denied.' }
  const tags: string[] = template.tags ?? []
  if (!tags.includes('fitness_template:true')) {
    return { ok: false, error: 'This template is not a fitness template.' }
  }

  const updatePayload: Record<string, unknown> = {}
  if (prescription.durationMin !== undefined) updatePayload.duration_min = prescription.durationMin
  if (prescription.notes !== undefined) updatePayload.notes = prescription.notes?.trim() || null

  if (Object.keys(updatePayload).length === 0) return { ok: true, error: null }

  const { error } = await rawDb
    .from('template_block_exercises')
    .update(updatePayload)
    .eq('id', templateBlockExerciseId)
    .eq('block_id', blockId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/director/fitness/templates/${templateId}`)
  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// updateFitnessBlockNotesAction
// Stores director/coach observations in template_blocks.notes
// ─────────────────────────────────────────────────────────────

export async function updateFitnessBlockNotesAction(
  templateId: string,
  blockId: string,
  notes: string,
): Promise<{ ok: boolean; error: string | null }> {
  const auth = await resolveAcademyAndRole()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, academyId } = auth

  const rawDb = supabase as any

  // Verify template
  const { data: template } = await rawDb
    .from('templates')
    .select('id, tags')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { ok: false, error: 'Template not found or access denied.' }
  const tags: string[] = template.tags ?? []
  if (!tags.includes('fitness_template:true')) {
    return { ok: false, error: 'This template is not a fitness template.' }
  }

  const { error } = await supabase
    .from('template_blocks')
    .update({ notes: notes.trim() || null })
    .eq('id', blockId)
    .eq('template_id', templateId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/director/fitness/templates/${templateId}`)
  return { ok: true, error: null }
}
