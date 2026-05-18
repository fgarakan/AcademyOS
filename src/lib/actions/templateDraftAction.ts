'use server'

// Template Draft Save Action — Sprint 977
// Creates a template_review_request row (migration 067 table).
// If the table does not exist, returns a safe error rather than throwing.
//
// Rules:
// - No auto-approval. All drafts land in pending status for director review.
// - No curriculum mutation. curriculum_* fields are snapshot labels only.
// - No parent/player visibility. No external sends.
// - Director or head_coach only. Coaches are blocked.

import { getSupabaseServer } from '@/lib/supabase/server'

// ── Input type ─────────────────────────────────────────────────────────────

export interface SaveTemplateDraftInput {
  academyId: string
  templateType: 'class_template' | 'fitness_template'
  name: string
  description?: string | null
  durationMin?: number | null
  curriculumStageKey?: string | null
  curriculumLevelKey?: string | null
  curriculumSourceLabel?: string | null
  templateGoal?: string | null
  pathwayFocus?: string | null
  tags?: string[]
  // Blocks snapshot — stored as JSONB in template_draft field
  blocks?: Array<{
    type: string
    name: string
    durationMin: number
    exercises?: Array<{
      label: string
      setsRepsDuration?: string
      coachingCue?: string
    }>
  }>
}

// ── Result type ────────────────────────────────────────────────────────────

export interface SaveTemplateDraftResult {
  success: boolean
  reviewRequestId?: string
  error?: string
  isSchemaMissing?: boolean
}

// ── Role guard ─────────────────────────────────────────────────────────────
// Coaches (not director/head_coach) cannot submit template drafts.

async function assertDirectorOrHead(db: Awaited<ReturnType<typeof getSupabaseServer>>): Promise<{ userId: string; role: string } | null> {
  const rawDb = db as any
  const { data: { user } } = await db.auth.getUser()
  if (!user) return null

  const { data: profile } = await rawDb
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return null
  if (profile.role !== 'academy_director' && profile.role !== 'head_coach') return null

  return { userId: profile.id as string, role: profile.role as string }
}

// ── Main action ────────────────────────────────────────────────────────────

export async function saveTemplateDraftAction(
  input: SaveTemplateDraftInput
): Promise<SaveTemplateDraftResult> {
  // Input validation
  if (!input.academyId || !input.name?.trim()) {
    return { success: false, error: 'Academy context and template name are required.' }
  }
  if (input.templateType !== 'class_template' && input.templateType !== 'fitness_template') {
    return { success: false, error: 'Template type must be class_template or fitness_template.' }
  }

  let db: Awaited<ReturnType<typeof getSupabaseServer>>
  try {
    db = await getSupabaseServer()
  } catch {
    return { success: false, error: 'Could not connect to database.' }
  }

  // Role guard — director or head_coach only
  let authContext: { userId: string; role: string } | null
  try {
    authContext = await assertDirectorOrHead(db)
  } catch {
    return { success: false, error: 'Authentication failed.' }
  }
  if (!authContext) {
    return { success: false, error: 'Only directors and head coaches can submit template drafts.' }
  }

  const rawDb = db as any

  // Build the template_draft JSONB snapshot
  const templateDraft = {
    template_type: input.templateType,
    name: input.name.trim(),
    description: input.description ?? null,
    total_duration_min: input.durationMin ?? null,
    curriculum_stage_key: input.curriculumStageKey ?? null,
    curriculum_level_key: input.curriculumLevelKey ?? null,
    curriculum_source_label: input.curriculumSourceLabel ?? null,
    template_goal: input.templateGoal ?? null,
    pathway_focus: input.pathwayFocus ?? null,
    tags: input.tags ?? [],
    blocks: input.blocks ?? [],
    submitted_at: new Date().toISOString(),
    submitted_by_role: authContext.role,
  }

  // Insert into template_review_requests (migration 067 table)
  try {
    const { data, error } = await rawDb
      .from('template_review_requests')
      .insert({
        academy_id: input.academyId,
        template_id: null, // new template draft — no existing template row yet
        template_draft: templateDraft,
        request_type: 'create_template',
        status: 'pending',
        requested_by: authContext.userId,
      })
      .select('id')
      .single()

    if (error) {
      // Detect schema-missing error codes
      if (
        error.code === '42P01' || // table does not exist
        error.code === '42703' || // column does not exist
        (typeof error.message === 'string' && error.message.includes('does not exist'))
      ) {
        return {
          success: false,
          error: 'Template backend migration has not been applied yet. Apply migration 067 before submitting template drafts.',
          isSchemaMissing: true,
        }
      }
      return { success: false, error: error.message ?? 'Failed to save template draft.' }
    }

    return {
      success: true,
      reviewRequestId: (data as { id: string }).id,
    }
  } catch {
    return { success: false, error: 'Unexpected error saving template draft.' }
  }
}

// ── Wizard-specific action (Class Template) ────────────────────────────────
// Called from the 'use client' class create wizard.
// Resolves academyId from the session — client does not supply it.

export interface SaveClassTemplateDraftWizardInput {
  curriculumLevel: string
  templateGoal: string
  blocks: Array<{
    type: string
    title: string
    durationMin: number
    drills?: string[]
  }>
}

export async function saveClassTemplateDraftFromWizardAction(
  input: SaveClassTemplateDraftWizardInput
): Promise<SaveTemplateDraftResult> {
  if (!input.curriculumLevel?.trim()) {
    return { success: false, error: 'Curriculum level is required.' }
  }

  let db: Awaited<ReturnType<typeof getSupabaseServer>>
  try {
    db = await getSupabaseServer()
  } catch {
    return { success: false, error: 'Could not connect to database.' }
  }

  const rawDb = db as any

  let userId: string
  let academyId: string
  let userRole: string
  try {
    const { data: { user } } = await db.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: profile } = await rawDb
      .from('profiles')
      .select('id, role, academy_id')
      .eq('id', user.id)
      .single()

    if (!profile) return { success: false, error: 'Profile not found.' }
    if (profile.role !== 'academy_director' && profile.role !== 'head_coach') {
      return { success: false, error: 'Only directors and head coaches can submit template drafts.' }
    }
    if (!profile.academy_id) return { success: false, error: 'No academy found for this account.' }

    userId = profile.id as string
    academyId = profile.academy_id as string
    userRole = profile.role as string
  } catch {
    return { success: false, error: 'Authentication failed.' }
  }

  const templateDraft = {
    template_type: 'class_template',
    name: `${input.curriculumLevel} — Class Template`,
    description: input.templateGoal || null,
    total_duration_min: input.blocks.reduce((sum, b) => sum + b.durationMin, 0) || null,
    curriculum_level_key: input.curriculumLevel,
    curriculum_source_label: input.curriculumLevel,
    template_goal: input.templateGoal || null,
    tags: ['class_template'],
    blocks: input.blocks.map(b => ({
      type: b.type,
      name: b.title,
      durationMin: b.durationMin,
      exercises: (b.drills ?? []).map((d: string) => ({ label: d })),
    })),
    submitted_at: new Date().toISOString(),
    submitted_by_role: userRole,
  }

  try {
    const { data, error } = await rawDb
      .from('template_review_requests')
      .insert({
        academy_id: academyId,
        template_id: null,
        template_draft: templateDraft,
        request_type: 'create_template',
        status: 'pending',
        requested_by: userId,
      })
      .select('id')
      .single()

    if (error) {
      if (
        error.code === '42P01' ||
        error.code === '42703' ||
        (typeof error.message === 'string' && error.message.includes('does not exist'))
      ) {
        return {
          success: false,
          error: 'Template backend is not connected yet. Your draft is ready but cannot be saved until the migration is applied.',
          isSchemaMissing: true,
        }
      }
      return { success: false, error: error.message ?? 'Failed to save template draft.' }
    }

    return { success: true, reviewRequestId: (data as { id: string }).id }
  } catch {
    return { success: false, error: 'Unexpected error saving template draft.' }
  }
}

// ── Update action (existing template) ─────────────────────────────────────
// Creates an update request for a template that already exists in the DB.
// Director review required before changes are applied to the live template row.

export interface UpdateTemplateDraftInput extends SaveTemplateDraftInput {
  templateId: string
}

export async function updateTemplateDraftAction(
  input: UpdateTemplateDraftInput
): Promise<SaveTemplateDraftResult> {
  if (!input.templateId) {
    return { success: false, error: 'Template ID is required for update requests.' }
  }

  let db: Awaited<ReturnType<typeof getSupabaseServer>>
  try {
    db = await getSupabaseServer()
  } catch {
    return { success: false, error: 'Could not connect to database.' }
  }

  let authContext: { userId: string; role: string } | null
  try {
    authContext = await assertDirectorOrHead(db)
  } catch {
    return { success: false, error: 'Authentication failed.' }
  }
  if (!authContext) {
    return { success: false, error: 'Only directors and head coaches can submit template update requests.' }
  }

  const rawDb = db as any

  const templateDraft = {
    template_type: input.templateType,
    name: input.name.trim(),
    description: input.description ?? null,
    total_duration_min: input.durationMin ?? null,
    curriculum_stage_key: input.curriculumStageKey ?? null,
    curriculum_level_key: input.curriculumLevelKey ?? null,
    curriculum_source_label: input.curriculumSourceLabel ?? null,
    template_goal: input.templateGoal ?? null,
    pathway_focus: input.pathwayFocus ?? null,
    tags: input.tags ?? [],
    blocks: input.blocks ?? [],
    submitted_at: new Date().toISOString(),
    submitted_by_role: authContext.role,
  }

  try {
    const { data, error } = await rawDb
      .from('template_review_requests')
      .insert({
        academy_id: input.academyId,
        template_id: input.templateId,
        template_draft: templateDraft,
        request_type: 'update_template',
        status: 'pending',
        requested_by: authContext.userId,
      })
      .select('id')
      .single()

    if (error) {
      if (
        error.code === '42P01' ||
        error.code === '42703' ||
        (typeof error.message === 'string' && error.message.includes('does not exist'))
      ) {
        return {
          success: false,
          error: 'Template backend migration has not been applied yet.',
          isSchemaMissing: true,
        }
      }
      return { success: false, error: error.message ?? 'Failed to save update draft.' }
    }

    return {
      success: true,
      reviewRequestId: (data as { id: string }).id,
    }
  } catch {
    return { success: false, error: 'Unexpected error saving template update draft.' }
  }
}
