'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { isPreviewMode } from '@/lib/utils/previewMode'
import type { TemplateDraft } from '@/components/assistant/templateDraftTypes'

// templates.track is the development_track enum: "skill"|"competition"|"fitness"|"combined".
// It is NOT a curriculum level field. draft.level ("Orange 2", "Red 1", etc.) must never be
// written to track — it would cause an invalid enum error. Level is preserved in the template
// name and in a tags entry ("level:Orange 2") so it is not lost.
const VALID_DEV_TRACKS = new Set(['skill', 'competition', 'fitness', 'combined'])

function safeDevTrack(value: string | null | undefined): 'skill' | 'competition' | 'fitness' | 'combined' | null {
  if (!value) return null
  return VALID_DEV_TRACKS.has(value) ? (value as 'skill' | 'competition' | 'fitness' | 'combined') : null
}

// Maps draft block categories to the valid DB block_type enum values.
// The DB enum: warm_up | technical | tactical | movement | fitness | competition | mental | cool_down | free
type DbBlockType =
  | 'warm_up'
  | 'technical'
  | 'tactical'
  | 'movement'
  | 'fitness'
  | 'competition'
  | 'mental'
  | 'cool_down'
  | 'free'

function categoryToDbBlockType(category: string): DbBlockType {
  switch (category) {
    case 'warm_up':
    case 'dynamic_warm_up':
      return 'warm_up'
    case 'rally':
    case 'technical':
      return 'technical'
    case 'point_play':
      return 'tactical'
    case 'match_play':
      return 'competition'
    case 'fitness':
      return 'fitness'
    default:
      return 'free'
  }
}

export interface SaveAssistantTemplateDraftResult {
  ok: boolean
  error: string | null
  templateId: string | null
}

export async function saveAssistantTemplateDraftAction(
  draft: TemplateDraft,
): Promise<SaveAssistantTemplateDraftResult> {
  if (await isPreviewMode()) {
    return { ok: false, error: 'Writes are disabled in preview mode.', templateId: null }
  }

  // Validate minimum required fields before hitting the DB
  if (!draft.templateName.trim()) {
    return { ok: false, error: 'Template name is required.', templateId: null }
  }
  if (!draft.level) {
    return { ok: false, error: 'Level is required.', templateId: null }
  }
  if (!draft.durationMinutes || draft.durationMinutes <= 0) {
    return { ok: false, error: 'Duration is required.', templateId: null }
  }
  if (draft.blocks.length === 0) {
    return { ok: false, error: 'At least one block is required.', templateId: null }
  }
  if (draft.status !== 'ready_for_review') {
    return {
      ok: false,
      error: 'Draft must be in review state before saving. Complete all required fields first.',
      templateId: null,
    }
  }

  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.', templateId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) {
    return { ok: false, error: 'Academy context unavailable.', templateId: null }
  }
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, error: 'Director or Head Coach access required.', templateId: null }
  }

  // rawDb cast — required because curriculum_level_id may not be in types and
  // to avoid TS2589 on the insert return shape.
  const rawDb = supabase as any

  // Step 1: Create the template shell
  // track must be a valid development_track enum value — never a level label like "Orange 2".
  // Level is preserved in the template name and tags instead.
  const levelTag = draft.level?.trim() ? `level:${draft.level.trim()}` : null

  const { data: templateRow, error: templateError } = await rawDb
    .from('templates')
    .insert({
      academy_id: academyId,
      created_by: user.id,
      name: draft.templateName.trim(),
      description: draft.goal?.trim() ?? null,
      track: null,
      total_duration_min: draft.durationMinutes,
      is_active: true,
      is_default: false,
      tags: ['source:assistant', ...(levelTag ? [levelTag] : [])],
    })
    .select('id')
    .single()

  if (templateError || !templateRow?.id) {
    return {
      ok: false,
      error: templateError?.message ?? 'Failed to create template.',
      templateId: null,
    }
  }

  const templateId: string = templateRow.id

  // Step 2: Insert template blocks (best-effort — template already exists if this fails)
  if (draft.blocks.length > 0) {
    const blockRows = draft.blocks.map((block, idx) => ({
      template_id: templateId,
      name: block.name,
      type: categoryToDbBlockType(block.category),
      duration_min: block.durationMinutes ?? 0,
      order_index: idx,
      notes: block.notes ?? null,
    }))

    await rawDb.from('template_blocks').insert(blockRows)
  }

  revalidatePath('/director/class-templates')
  return { ok: true, error: null, templateId }
}
