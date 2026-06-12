'use server'

// DONNA Curriculum Intelligence Engine V1 — Mega Sprint 1716–1745
// saveCurriculumDraftAction: dispatches a CurriculumDraftObject to
// academy_curriculum_overrides (pending_review) based on intent.
//
// Intent dispatch:
//   add     → calls createCurriculumContentItemDraft() (existing proven path)
//   modify  → INSERT override_type='update' + target_id + changed fields
//   move    → INSERT override_type='update' + target_id + new level_id
//   expand  → calls createCurriculumContentItemDraft() (new item, no target)
//   replace → INSERT override_type='remove' + target_id, then create new add draft
//   remove  → INSERT override_type='remove' + target_id
//
// After a successful insert, appends a CurriculumMemoryEntry to
// academies.settings.donna_curriculum_memory[].
//
// Architecture invariants:
//   • academy_id resolved from authenticated profile — never from client
//   • Director or head_coach role required
//   • Preview mode writes blocked
//   • All writes go to academy_curriculum_overrides (status: pending_review)
//   • execute_curriculum_override() fires only after director approves

import { revalidatePath } from 'next/cache'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { getSupabaseServer } from '@/lib/supabase/server'
import {
  createCurriculumContentItemDraft,
} from '@/lib/actions/curriculumDraftActions'
import {
  mapDraftObjectToCreateInput,
  type CurriculumDraftObject,
} from '@/lib/donna/curriculum/curriculumDraftObject'
import {
  buildCurriculumMemoryEntry,
  type CurriculumMemoryEntry,
} from '@/lib/donna/curriculum/curriculumMemory'

// ── Result type ───────────────────────────────────────────────────────────────

export type SaveCurriculumDraftResult =
  | { ok: true;  draftCount: number; message: string }
  | { ok: false; error: string;      blocked: boolean }

// ── Action ────────────────────────────────────────────────────────────────────

export async function saveCurriculumDraftAction(
  draft: CurriculumDraftObject,
): Promise<SaveCurriculumDraftResult> {
  const fail = (error: string, blocked = false): SaveCurriculumDraftResult =>
    ({ ok: false, error, blocked })

  // ── Guard: preview mode ──────────────────────────────────
  try {
    await assertNotPreviewMode()
  } catch {
    return fail('Writes are disabled in preview mode.', true)
  }

  // ── Input guards ─────────────────────────────────────────
  if (!draft.intent) return fail('Draft intent is required.', true)

  const needsTarget = draft.intent === 'modify' || draft.intent === 'move' ||
                      draft.intent === 'replace' || draft.intent === 'remove'
  if (needsTarget && !draft.targetItemId) {
    return fail('Target item ID is required for this action type.', true)
  }

  const needsLevel = draft.intent === 'add' || draft.intent === 'expand'
  if (needsLevel && !draft.levelId && !draft.levelName) {
    return fail('Level is required.', true)
  }

  if ((draft.intent === 'add' || draft.intent === 'expand') && !draft.title?.trim()) {
    return fail('Item name is required.', true)
  }

  // ── Auth ─────────────────────────────────────────────────
  const supabase = await getSupabaseServer()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return fail('Not authenticated.', true)

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.', true)
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
    return fail('Only directors and head coaches can create curriculum drafts.', true)
  }

  const rawDb = supabase as any

  // ── Dispatch by intent ────────────────────────────────────

  if (draft.intent === 'add' || draft.intent === 'expand') {
    const input = mapDraftObjectToCreateInput(draft)
    const result = await createCurriculumContentItemDraft({ ...input, source: 'typed' })
    if (!result.ok) return fail(result.error, result.blocked)

    await appendMemoryEntry(rawDb, academyId, draft)
    revalidatePath('/director/curriculum/builder')
    return {
      ok: true,
      draftCount: result.pendingDraftCount,
      message: `Draft saved to your review queue (${result.pendingDraftCount} pending).`,
    }
  }

  // ── Resolve curriculum_version_id (required FK for direct inserts) ────────
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
      'No academy curriculum version found. Create one first from the Curriculum page.',
      true,
    )
  }

  const versionId = activeVersion.id as string
  let draftCount = 0

  if (draft.intent === 'remove') {
    const { error } = await rawDb
      .from('academy_curriculum_overrides')
      .insert({
        academy_id:            academyId,
        curriculum_version_id: versionId,
        target_type:           'content_item',
        target_id:             draft.targetItemId,
        override_type:         'remove',
        scope:                 'academy',
        proposed_change:       { title: draft.targetItemTitle ?? '' },
        override_reason:       draft.placementReasoning ?? null,
        source:                'typed',
        raw_input:             draft.rawInput ?? null,
        status:                'pending_review',
        created_by:            user.id,
      })
    if (error) return fail(`Failed to create removal draft: ${error.message}`, false)
    draftCount = 1
  }

  if (draft.intent === 'modify') {
    const proposedChange: Record<string, unknown> = {}
    if (draft.title)              proposedChange['title']          = draft.title
    if (draft.contentType)        proposedChange['content_type']   = draft.contentType
    if (draft.levelId)            proposedChange['level_id']       = draft.levelId
    if (draft.purpose)            proposedChange['description']    = draft.purpose
    if (draft.coachingCues.length)  proposedChange['coach_cues']   = draft.coachingCues
    if (draft.successCriteria.length) proposedChange['success_criteria'] = draft.successCriteria
    if (draft.progressions.length) proposedChange['progressions']  = draft.progressions
    if (draft.regressions.length)  proposedChange['regressions']   = draft.regressions
    if (draft.parentExplanation)  proposedChange['parent_safe_description'] = draft.parentExplanation

    const { error } = await rawDb
      .from('academy_curriculum_overrides')
      .insert({
        academy_id:            academyId,
        curriculum_version_id: versionId,
        target_type:           'content_item',
        target_id:             draft.targetItemId,
        override_type:         'update',
        scope:                 'academy',
        proposed_change:       proposedChange,
        override_reason:       draft.placementReasoning ?? null,
        source:                'typed',
        raw_input:             draft.rawInput ?? null,
        status:                'pending_review',
        created_by:            user.id,
      })
    if (error) return fail(`Failed to create modification draft: ${error.message}`, false)
    draftCount = 1
  }

  if (draft.intent === 'move') {
    if (!draft.levelId) return fail('Target level is required for move.', true)
    const { error } = await rawDb
      .from('academy_curriculum_overrides')
      .insert({
        academy_id:            academyId,
        curriculum_version_id: versionId,
        target_type:           'content_item',
        target_id:             draft.targetItemId,
        override_type:         'update',
        scope:                 'academy',
        proposed_change:       { level_id: draft.levelId },
        override_reason:       draft.placementReasoning ?? null,
        source:                'typed',
        raw_input:             draft.rawInput ?? null,
        status:                'pending_review',
        created_by:            user.id,
      })
    if (error) return fail(`Failed to create move draft: ${error.message}`, false)
    draftCount = 1
  }

  if (draft.intent === 'replace') {
    // Step 1: remove the existing item
    const { error: removeErr } = await rawDb
      .from('academy_curriculum_overrides')
      .insert({
        academy_id:            academyId,
        curriculum_version_id: versionId,
        target_type:           'content_item',
        target_id:             draft.targetItemId,
        override_type:         'remove',
        scope:                 'academy',
        proposed_change:       { title: draft.targetItemTitle ?? '' },
        override_reason:       `Replaced by: ${draft.title || 'new item'}`,
        source:                'typed',
        raw_input:             draft.rawInput ?? null,
        status:                'pending_review',
        created_by:            user.id,
      })
    if (removeErr) return fail(`Failed to create replacement removal draft: ${removeErr.message}`, false)

    // Step 2: add the replacement
    const addInput = mapDraftObjectToCreateInput({ ...draft, intent: 'add', targetItemId: undefined })
    const addResult = await createCurriculumContentItemDraft({ ...addInput, source: 'typed' })
    if (!addResult.ok) return fail(addResult.error, addResult.blocked)

    draftCount = 2
  }

  await appendMemoryEntry(rawDb, academyId, draft)
  revalidatePath('/director/curriculum/builder')

  return {
    ok: true,
    draftCount,
    message: `${draftCount} draft${draftCount !== 1 ? 's' : ''} saved to your review queue.`,
  }
}

// ── Memory helper ─────────────────────────────────────────────────────────────

async function appendMemoryEntry(
  rawDb: any,
  academyId: string,
  draft: CurriculumDraftObject,
): Promise<void> {
  try {
    const entry = buildCurriculumMemoryEntry({
      intent:            draft.intent,
      levelId:           draft.levelId,
      levelName:         draft.levelName,
      itemId:            draft.targetItemId,
      itemTitle:         draft.targetItemTitle ?? draft.title,
      contentType:       draft.contentType,
      changeDescription: buildChangeDescription(draft),
      reason:            draft.placementReasoning,
    })

    // Read current memory, append, write back
    const { data: academy } = await rawDb
      .from('academies')
      .select('settings')
      .eq('id', academyId)
      .single()

    const settings = (academy?.settings as Record<string, unknown>) ?? {}
    const existing: CurriculumMemoryEntry[] = Array.isArray(settings.donna_curriculum_memory)
      ? (settings.donna_curriculum_memory as CurriculumMemoryEntry[])
      : []

    // Cap at 50 entries — drop oldest
    const updated = [...existing, entry].slice(-50)

    await rawDb
      .from('academies')
      .update({ settings: { ...settings, donna_curriculum_memory: updated } })
      .eq('id', academyId)
  } catch {
    // Memory write failure is non-fatal — do not surface to user
  }
}

function buildChangeDescription(draft: CurriculumDraftObject): string {
  switch (draft.intent) {
    case 'add':     return `Added ${draft.contentType}: "${draft.title}" at ${draft.levelName ?? draft.levelId}`
    case 'modify':  return `Modified "${draft.targetItemTitle ?? draft.targetItemId}"`
    case 'move':    return `Moved "${draft.targetItemTitle ?? draft.targetItemId}" to ${draft.levelName ?? draft.levelId}`
    case 'expand':  return `Added variation of "${draft.title}" at ${draft.levelName ?? draft.levelId}`
    case 'replace': return `Replaced "${draft.targetItemTitle ?? draft.targetItemId}" with "${draft.title}"`
    case 'remove':  return `Removed "${draft.targetItemTitle ?? draft.targetItemId}"`
  }
}
