'use server'

/**
 * Curriculum Draft Server Actions — Sprint 901
 *
 * Creates pending_review rows in academy_curriculum_overrides.
 * This is the DRAFT step of the curriculum change pipeline:
 *
 *   createCurriculumContentItemDraft()        ← this file
 *       → INSERT academy_curriculum_overrides (status = 'pending_review')
 *   Director reviews draft in CurriculumChangeQueue
 *       → UPDATE status = 'approved'
 *   Director approves → execute_curriculum_override()  ← Sprint 900 DB function
 *       → curriculum_content_items mutated
 *       → status = 'applied'
 *       → audit_logs entry written
 *
 * Architecture invariants enforced here:
 *   • Writes ONLY to academy_curriculum_overrides — never to curriculum tables directly.
 *   • Never uses proposed_actions (schema incompatible — voice_command_id NOT NULL).
 *   • Academy_id is always resolved from the authenticated profile — never from client.
 *   • Director or head_coach role required.
 *   • Global curriculum (academy_id IS NULL) is never touched at draft time.
 *   • Preview mode writes are blocked.
 *
 * Related:
 *   supabase/migrations/048_academy_curriculum_clone.sql  — table schema
 *   supabase/migrations/069_execute_curriculum_override.sql — execution function
 *   docs/MIGRATION_READINESS_CURRICULUM_TABLES_AUDIT_899.md — architecture decision
 *   docs/CURRICULUM_INTELLIGENCE_LOOP.md — Loop 2 (DONNA NL edit) and Loop 3 (Interface edit)
 */

import { revalidatePath } from 'next/cache'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { getSupabaseServer } from '@/lib/supabase/server'

// ============================================================
// Content type constants
// ============================================================

/**
 * Valid content_type values for curriculum_content_items.
 * Source: curriculum_content_items CHECK constraint, migration 045.
 * Migration 061 expands this to 22 values — update this list after
 * migration 061 is confirmed applied to the live database.
 */
const VALID_CONTENT_TYPES = [
  'drill',
  'game',
  'skill',
  'assessment',
  'warmup',
  'cooldown',
  'fitness',
  'tactical',
  'competition',
] as const

export type CurriculumContentType = (typeof VALID_CONTENT_TYPES)[number]

/**
 * Valid pathway values.
 * Source: academy_curriculum_overrides.pathway and curriculum_content_items.pathway CHECK.
 */
const VALID_PATHWAYS = ['skill', 'competition', 'fitness', 'mixed'] as const

export type CurriculumPathway = (typeof VALID_PATHWAYS)[number]

/**
 * Source of the draft — determines audit trail source_type.
 * Matches academy_curriculum_overrides.source CHECK: 'voice' | 'typed' | 'ui'.
 */
const VALID_SOURCES = ['voice', 'typed', 'ui'] as const

export type CurriculumDraftSource = (typeof VALID_SOURCES)[number]

// ============================================================
// Input / result types
// ============================================================

export interface CreateContentItemDraftInput {
  /**
   * curriculum_levels.id — which level this content item belongs to.
   * Required unless levelName is provided (Sprint 912.8: DONNA voice path).
   */
  levelId?: string

  /**
   * Fallback when levelId is not known at call time (Sprint 912.8).
   * The server action resolves to an id via curriculum_levels.display_name ILIKE.
   * Provide this OR levelId — not both. If both are given, levelId takes precedence.
   */
  levelName?: string

  /**
   * Content type.
   * 'drill' | 'game' | 'skill' | 'assessment' | 'warmup' |
   * 'cooldown' | 'fitness' | 'tactical' | 'competition'
   * Use 'drill' for tennis drills, 'fitness' for physical exercises,
   * 'assessment' for gate assessments.
   */
  contentType: CurriculumContentType

  /** Display name shown in the review queue and curriculum explorer. */
  title: string

  /** Optional: free-text description of the content item. */
  description?: string

  /**
   * Curriculum pathway (default: 'skill').
   * 'skill' | 'competition' | 'fitness' | 'mixed'
   */
  pathway?: CurriculumPathway

  /** Estimated duration range in minutes. */
  durationMin?: number
  durationMax?: number

  /**
   * Difficulty 1–5.
   * 1 = beginner, 5 = advanced.
   */
  difficulty?: number

  /**
   * Intensity 1–10.
   * Used for fitness and movement content.
   */
  intensity?: number

  /** Coach-facing cues for delivering this content. */
  coachCues?: string[]

  /** Observable success criteria for this content item. */
  successCriteria?: string[]

  /** Harder progressions once the player masters the base version. */
  progressions?: string[]

  /** Easier regressions if the player is struggling. */
  regressions?: string[]

  /** Court setup description (e.g. "Cross-court half-court, 2 feeders"). */
  courtSetup?: string

  /**
   * Where the draft originated.
   * 'voice' — from DONNA voice/text input
   * 'typed' — from DONNA typed input
   * 'ui'    — from direct interface editor
   * Default: 'ui'
   */
  source?: CurriculumDraftSource

  /** Optional director-provided reason for the change. */
  overrideReason?: string

  /**
   * Optional raw input text (DONNA voice transcript or typed text
   * before it was structured into this input object).
   */
  rawInput?: string
}

export type CreateContentItemDraftResult =
  | { ok: true; draftId: string; pendingDraftCount: number }
  | { ok: false; error: string; blocked: boolean }

// ============================================================
// createCurriculumContentItemDraft
//
// Creates a pending_review override row for a new curriculum
// content item (drill, fitness exercise, assessment, etc.).
//
// Replaces the Sprint 831 proposal to use proposed_actions.
// The proposed_actions path is blocked by voice_command_id NOT NULL
// and missing curriculum action_type enum values — documented in
// docs/MIGRATION_READINESS_CURRICULUM_TABLES_AUDIT_899.md Section 4.
//
// This single action covers the three use cases from Sprint 831:
//   createCurriculumDrillDraft()         → contentType: 'drill'
//   createCurriculumFitnessExerciseDraft() → contentType: 'fitness'
//   createCurriculumAssessmentGateDraft() → contentType: 'assessment'
//
// Sprint: 901 — Curriculum Draft Server Actions V1
// ============================================================

export async function createCurriculumContentItemDraft(
  input: CreateContentItemDraftInput,
): Promise<CreateContentItemDraftResult> {
  const fail = (error: string, blocked = false): CreateContentItemDraftResult =>
    ({ ok: false, error, blocked })

  // ── Guard: preview mode ──────────────────────────────────
  try {
    await assertNotPreviewMode()
  } catch {
    return fail('Writes are disabled in preview mode.', true)
  }

  // ── Guard: required fields ───────────────────────────────
  if (!input.levelId?.trim() && !input.levelName?.trim()) {
    return fail('levelId or levelName is required.', true)
  }
  if (!input.contentType) {
    return fail('contentType is required.', true)
  }
  if (!(VALID_CONTENT_TYPES as readonly string[]).includes(input.contentType)) {
    return fail(
      `Invalid contentType "${input.contentType}". ` +
        `Valid values: ${VALID_CONTENT_TYPES.join(', ')}.`,
      true,
    )
  }
  if (!input.title?.trim()) {
    return fail('title is required.', true)
  }
  if (input.title.length > 200) {
    return fail('title must be 200 characters or fewer.', true)
  }

  const pathway: CurriculumPathway = input.pathway ?? 'skill'
  if (!(VALID_PATHWAYS as readonly string[]).includes(pathway)) {
    return fail(
      `Invalid pathway "${pathway}". Valid values: ${VALID_PATHWAYS.join(', ')}.`,
      true,
    )
  }

  const source: CurriculumDraftSource = input.source ?? 'ui'

  // Numeric bounds: loose guards. DB CHECK constraints enforce strict bounds.
  if (input.difficulty != null && (input.difficulty < 1 || input.difficulty > 5)) {
    return fail('difficulty must be between 1 and 5.', true)
  }
  if (input.intensity != null && (input.intensity < 1 || input.intensity > 10)) {
    return fail('intensity must be between 1 and 10.', true)
  }

  // ── Auth ─────────────────────────────────────────────────
  const supabase = await getSupabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return fail('Not authenticated.', true)

  // ── Resolve academy_id from authenticated profile ─────────
  // Never trust academy_id from the client — always read from the DB.
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.', true)
  const academyId = profile.academy_id

  // ── Role check: director or head_coach only ───────────────
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return fail(
      'Only directors and head coaches can create curriculum drafts.',
      true,
    )
  }

  // ── Resolve levelId from levelName if needed (Sprint 912.8) ─────────────
  // levelId takes precedence when provided. When absent, resolve by display_name.
  // curriculum_levels is global (no academy_id) — any authenticated director can read it.
  let resolvedLevelId = input.levelId?.trim() ?? ''
  if (!resolvedLevelId && input.levelName?.trim()) {
    // Prefix wildcard so "Orange 2" matches "Orange 2 — Direction" in the DB.
    // maybeSingle() returns null on no match (clean fail) and errors on multiple
    // matches (e.g. bare "Orange"), which also surfaces as a clean fail via !levelRow.
    const { data: levelRow } = await supabase
      .from('curriculum_levels')
      .select('id')
      .ilike('display_name', `${input.levelName.trim()}%`)
      .maybeSingle()
    if (!levelRow) {
      return fail(
        `Could not find a curriculum level named "${input.levelName}". ` +
          'Check the level name (e.g., "Orange 2", "Yellow 1") and try again.',
        true,
      )
    }
    resolvedLevelId = levelRow.id as string
  }

  const rawDb = supabase as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          in: (col: string, vals: string[]) => {
            order: (col: string, opts: { ascending: boolean }) => {
              limit: (n: number) => {
                single: () => Promise<{
                  data: { id: string } | null
                  error: { message: string } | null
                }>
              }
            }
          }
        }
      }
      insert: (row: Record<string, unknown>) => {
        select: (cols: string) => {
          single: () => Promise<{
            data: { id: string } | null
            error: { message: string } | null
          }>
        }
      }
    }
  }

  // ── Resolve active curriculum version (required FK) ───────
  // academy_curriculum_overrides.curriculum_version_id is NOT NULL.
  // Accept both 'active' and 'draft' to handle academies that have
  // not yet activated their curriculum version (prefer most recent).
  const { data: activeVersion } = await rawDb
    .from('academy_curriculum_versions')
    .select('id')
    .eq('academy_id', academyId)
    .in('status', ['active', 'draft'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!activeVersion) {
    return fail(
      'No academy curriculum version found. ' +
        'Create one first from the Curriculum page.',
      true,
    )
  }

  // ── Build proposed_change JSONB ────────────────────────────
  // These field names match exactly what execute_curriculum_override()
  // reads in its content_item/add branch (migration 069).
  const proposedChange: Record<string, unknown> = {
    level_id:     resolvedLevelId,
    content_type: input.contentType,
    title:        input.title.trim(),
    pathway,
  }

  if (input.description?.trim())
    proposedChange['description'] = input.description.trim()
  if (input.durationMin != null)
    proposedChange['duration_min'] = input.durationMin
  if (input.durationMax != null)
    proposedChange['duration_max'] = input.durationMax
  if (input.difficulty != null)
    proposedChange['difficulty'] = input.difficulty
  if (input.intensity != null)
    proposedChange['intensity'] = input.intensity
  if (input.coachCues?.length)
    proposedChange['coach_cues'] = input.coachCues
  if (input.successCriteria?.length)
    proposedChange['success_criteria'] = input.successCriteria
  if (input.progressions?.length)
    proposedChange['progressions'] = input.progressions
  if (input.regressions?.length)
    proposedChange['regressions'] = input.regressions
  if (input.courtSetup?.trim())
    proposedChange['court_setup'] = input.courtSetup.trim()

  // ── INSERT into academy_curriculum_overrides ──────────────
  // target_id is NULL for 'add' — there is no existing item being modified.
  // The new item will be created by execute_curriculum_override() on approval.
  const { data: created, error: insertError } = await rawDb
    .from('academy_curriculum_overrides')
    .insert({
      academy_id:            academyId,
      curriculum_version_id: activeVersion.id,
      target_type:           'content_item',
      target_id:             null,
      override_type:         'add',
      scope:                 'academy',
      pathway,
      proposed_change:       proposedChange,
      override_reason:       input.overrideReason ?? null,
      source,
      raw_input:             input.rawInput ?? null,
      status:                'pending_review',
      created_by:            user.id,
    })
    .select('id')
    .single()

  if (insertError || !created) {
    return fail(
      `Failed to create curriculum draft: ${insertError?.message ?? 'unknown error'}`,
      false,
    )
  }

  const draftId = created.id as string

  // ── Revalidate curriculum routes ──────────────────────────
  // Marks server-side cache stale so the next full page load reflects
  // the new draft in CurriculumBuilderChangeQueue.
  // Matches pattern from curriculumOverrideApprovalActions.ts.
  // DONNA panels should also call router.refresh() for immediate
  // client-side update — see GAP-1 in QA_CURRICULUM_DRAFT_PIPELINE_908.md.
  revalidatePath('/director/curriculum')
  revalidatePath('/director/curriculum/builder')

  // ── Write audit log ────────────────────────────────────────
  // Failure here is non-fatal — the draft is already created.
  // The audit INSERT is best-effort at draft time; execute_curriculum_override()
  // writes its own definitive audit entry on approval + execution.
  const auditSourceType = source === 'voice' ? 'voice' : 'ui'
  await (supabase as any)
    .from('audit_logs')
    .insert({
      academy_id:  academyId,
      actor_id:    user.id,
      action:      'curriculum_override.draft.created',
      target_type: 'academy_curriculum_overrides',
      target_id:   draftId,
      payload: {
        target_type:   'content_item',
        override_type: 'add',
        content_type:  input.contentType,
        level_id:      resolvedLevelId,
        title:         input.title.trim(),
        source,
        draft_id:      draftId,
      },
      source_type: auditSourceType,
    })

  // Sprint 912.13: query current pending draft count for DONNA post-creation messaging.
  // Runs after the INSERT so the newly created row is included in the count.
  // Non-fatal: defaults to 1 (the draft just created) if the query fails.
  let pendingDraftCount = 1
  try {
    const { count } = await (supabase as any)
      .from('academy_curriculum_overrides')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .in('status', ['pending_review', 'draft'])
    if (typeof count === 'number') pendingDraftCount = count
  } catch {
    // non-fatal — count defaults to 1
  }

  return { ok: true, draftId, pendingDraftCount }
}
