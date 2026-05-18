// Template Repository — Sprint 974
// Read-only query functions for the templates subsystem.
// All queries are safe to call before migrations 067/068 are applied.
// Functions that reference draft-migration columns or tables fail gracefully
// and return { isSchemaMissing: true } rather than throwing.
//
// Do not add inserts, updates, or deletes here.
// All mutations go through proposed_actions or template_review_requests
// via server actions, never directly from the repository layer.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

// ── Base row types from database.types.ts (pre-migration 067 schema) ──────────

type TemplateBaseRow = Tables<'templates'>
type TemplateBlockBaseRow = Tables<'template_blocks'>
type TemplateBlockExerciseBaseRow = Tables<'template_block_exercises'>

// ── Extended types (include draft-migration 067 columns) ──────────────────────
// These fields will be present once migration 067 is applied.
// Before that they will be absent from query results — typed as optional here.

export interface TemplateRow extends TemplateBaseRow {
  template_type?: string | null
  status?: string | null
  curriculum_stage_key?: string | null
  curriculum_level_key?: string | null
  curriculum_source_label?: string | null
  template_goal?: string | null
  pathway_focus?: string | null
  approved_by?: string | null
  approved_at?: string | null
  archived_at?: string | null
}

export interface TemplateBlockRow extends TemplateBlockBaseRow {
  curriculum_connection?: string | null
  coach_watch_for?: string | null
  fitness_block_type?: string | null
  intensity_level?: string | null
  load_level?: string | null
  source_snapshot?: Record<string, unknown> | null
}

export interface TemplateBlockExerciseRow extends TemplateBlockExerciseBaseRow {
  exercise_label?: string | null
  category?: string | null
  sets_reps_duration?: string | null
  load_level?: string | null
  tennis_transfer?: string | null
  progression?: string | null
  regression?: string | null
  equipment?: string | null
  coaching_cue?: string | null
  source_snapshot?: Record<string, unknown> | null
  exercises?: { name: string | null; category: string | null } | null
}

// ── Draft-migration-only table types ─────────────────────────────────────────
// These tables exist only after migration 067 is applied.

export interface TemplateReviewRequestRow {
  id: string
  academy_id: string
  template_id: string
  template_draft: Record<string, unknown> | null
  request_type: string
  status: string
  requested_by: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  proposed_action_id: string | null
  created_at: string
  updated_at: string
}

export interface TemplateVersionHistoryRow {
  id: string
  academy_id: string
  template_id: string
  version_number: number
  change_type: string
  snapshot: Record<string, unknown> | null
  changed_by: string | null
  created_at: string
}

// ── Result wrappers ───────────────────────────────────────────────────────────

export interface RepoListResult<T> {
  data: T[]
  error: string | null
  isSchemaMissing: boolean
}

export interface RepoSingleResult<T> {
  data: T | null
  error: string | null
  isSchemaMissing: boolean
}

// ── Query options ─────────────────────────────────────────────────────────────

export interface ListTemplatesOptions {
  templateType?: 'class_template' | 'fitness_template'
  status?: string
  limit?: number
}

export interface ListReviewRequestsOptions {
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
  templateId?: string
  limit?: number
}

// ── Schema-missing detection ──────────────────────────────────────────────────
// PostgreSQL error codes returned by Supabase when schema is missing:
//   42P01 — undefined_table (relation does not exist)
//   42703 — undefined_column (column does not exist)

function detectSchemaMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as Record<string, unknown>
  if (e['code'] === '42P01' || e['code'] === '42703') return true
  const msg = typeof e['message'] === 'string' ? e['message'] as string : ''
  return msg.includes('does not exist') && (msg.includes('column') || msg.includes('relation') || msg.includes('table'))
}

// ── listTemplatesForAcademy ───────────────────────────────────────────────────
// Returns all templates for the academy, optionally filtered by type and status.
// Filters on draft-migration columns (status, template_type) are passed through
// as raw query filters. If the column does not exist yet, the error is caught
// and isSchemaMissing is returned so callers can fall back to demo data.

export async function listTemplatesForAcademy(
  db: DB,
  academyId: string,
  options: ListTemplatesOptions = {}
): Promise<RepoListResult<TemplateRow>> {
  const rawDb = db as any
  const { templateType, status, limit = 100 } = options

  try {
    let query = rawDb
      .from('templates')
      .select('*')
      .eq('academy_id', academyId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (templateType) {
      query = query.eq('template_type', templateType)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      if (detectSchemaMissing(error)) {
        return {
          data: [],
          error: 'Template schema extension (migration 067) is not applied. Status and type filters require it.',
          isSchemaMissing: true,
        }
      }
      return { data: [], error: error.message ?? 'Error reading templates.', isSchemaMissing: false }
    }

    return { data: (data ?? []) as TemplateRow[], error: null, isSchemaMissing: false }
  } catch {
    return { data: [], error: 'Unexpected error reading templates.', isSchemaMissing: false }
  }
}

// ── getTemplateById ───────────────────────────────────────────────────────────
// Fetches a single template by ID scoped to the academy.
// Academy scope prevents cross-tenant reads even if RLS is misconfigured.

export async function getTemplateById(
  db: DB,
  templateId: string,
  academyId: string
): Promise<RepoSingleResult<TemplateRow>> {
  const rawDb = db as any

  try {
    const { data, error } = await rawDb
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .eq('academy_id', academyId)
      .single()

    if (error) {
      if (detectSchemaMissing(error)) {
        return {
          data: null,
          error: 'Template schema extension (migration 067) is not applied.',
          isSchemaMissing: true,
        }
      }
      if ((error as any).code === 'PGRST116') {
        return { data: null, error: 'Template not found.', isSchemaMissing: false }
      }
      return { data: null, error: error.message ?? 'Error reading template.', isSchemaMissing: false }
    }

    return { data: data as TemplateRow, error: null, isSchemaMissing: false }
  } catch {
    return { data: null, error: 'Unexpected error reading template.', isSchemaMissing: false }
  }
}

// ── getTemplateBlocks ─────────────────────────────────────────────────────────
// Returns blocks for a template ordered by order_index.
// Draft-migration 067 extended columns (curriculum_connection, coach_watch_for,
// etc.) are returned when present; typed as optional on TemplateBlockRow.

export async function getTemplateBlocks(
  db: DB,
  templateId: string
): Promise<RepoListResult<TemplateBlockRow>> {
  const rawDb = db as any

  try {
    const { data, error } = await rawDb
      .from('template_blocks')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index', { ascending: true })

    if (error) {
      if (detectSchemaMissing(error)) {
        return {
          data: [],
          error: 'Template blocks schema not available.',
          isSchemaMissing: true,
        }
      }
      return { data: [], error: error.message ?? 'Error reading template blocks.', isSchemaMissing: false }
    }

    return { data: (data ?? []) as TemplateBlockRow[], error: null, isSchemaMissing: false }
  } catch {
    return { data: [], error: 'Unexpected error reading template blocks.', isSchemaMissing: false }
  }
}

// ── getTemplateBlockExercises ─────────────────────────────────────────────────
// Returns exercises for all blocks belonging to a template.
// Uses two sequential queries (block IDs first, then exercises) per the
// backend rule to avoid RLS surprises with parallel relational queries.
// Joins exercises table for name and category display fields.

export async function getTemplateBlockExercises(
  db: DB,
  templateId: string
): Promise<RepoListResult<TemplateBlockExerciseRow>> {
  const rawDb = db as any

  try {
    const { data: blocks, error: blocksError } = await rawDb
      .from('template_blocks')
      .select('id')
      .eq('template_id', templateId)

    if (blocksError) {
      if (detectSchemaMissing(blocksError)) {
        return {
          data: [],
          error: 'Template blocks schema not available.',
          isSchemaMissing: true,
        }
      }
      return { data: [], error: blocksError.message ?? 'Error reading template blocks.', isSchemaMissing: false }
    }

    if (!blocks || (blocks as Array<{ id: string }>).length === 0) {
      return { data: [], error: null, isSchemaMissing: false }
    }

    const blockIds = (blocks as Array<{ id: string }>).map((b) => b.id)

    const { data, error } = await rawDb
      .from('template_block_exercises')
      .select('*, exercises(name, category)')
      .in('block_id', blockIds)
      .order('order_index', { ascending: true })

    if (error) {
      if (detectSchemaMissing(error)) {
        return {
          data: [],
          error: 'Template block exercises schema not available.',
          isSchemaMissing: true,
        }
      }
      return { data: [], error: error.message ?? 'Error reading template block exercises.', isSchemaMissing: false }
    }

    return { data: (data ?? []) as TemplateBlockExerciseRow[], error: null, isSchemaMissing: false }
  } catch {
    return { data: [], error: 'Unexpected error reading template block exercises.', isSchemaMissing: false }
  }
}

// ── getTemplateReviewRequests ─────────────────────────────────────────────────
// Returns review requests for an academy.
// This table is created in migration 067 and does not exist before that.
// If the table is absent, returns isSchemaMissing: true — callers must
// handle this by displaying a "pending schema apply" notice rather than crashing.

export async function getTemplateReviewRequests(
  db: DB,
  academyId: string,
  options: ListReviewRequestsOptions = {}
): Promise<RepoListResult<TemplateReviewRequestRow>> {
  const rawDb = db as any
  const { status, templateId, limit = 50 } = options

  try {
    let query = rawDb
      .from('template_review_requests')
      .select('*')
      .eq('academy_id', academyId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }
    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    const { data, error } = await query

    if (error) {
      if (detectSchemaMissing(error)) {
        return {
          data: [],
          error: 'template_review_requests table does not exist. Apply migration 067 first.',
          isSchemaMissing: true,
        }
      }
      return { data: [], error: error.message ?? 'Error reading review requests.', isSchemaMissing: false }
    }

    return { data: (data ?? []) as TemplateReviewRequestRow[], error: null, isSchemaMissing: false }
  } catch {
    return { data: [], error: 'Unexpected error reading review requests.', isSchemaMissing: false }
  }
}

// ── getTemplateVersionHistory ─────────────────────────────────────────────────
// Returns version history snapshots for a template.
// This table is created in migration 067. Append-only (no UPDATE/DELETE RLS).
// Returns isSchemaMissing: true when table is absent rather than throwing.

export async function getTemplateVersionHistory(
  db: DB,
  templateId: string,
  academyId: string
): Promise<RepoListResult<TemplateVersionHistoryRow>> {
  const rawDb = db as any

  try {
    const { data, error } = await rawDb
      .from('template_version_history')
      .select('*')
      .eq('template_id', templateId)
      .eq('academy_id', academyId)
      .order('version_number', { ascending: false })

    if (error) {
      if (detectSchemaMissing(error)) {
        return {
          data: [],
          error: 'template_version_history table does not exist. Apply migration 067 first.',
          isSchemaMissing: true,
        }
      }
      return { data: [], error: error.message ?? 'Error reading version history.', isSchemaMissing: false }
    }

    return { data: (data ?? []) as TemplateVersionHistoryRow[], error: null, isSchemaMissing: false }
  } catch {
    return { data: [], error: 'Unexpected error reading template version history.', isSchemaMissing: false }
  }
}
