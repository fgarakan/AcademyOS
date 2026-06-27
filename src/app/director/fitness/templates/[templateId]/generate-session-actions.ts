'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import type { Database } from '@/lib/supabase/database.types'
import {
  getActiveAcademyCurriculumVersion,
  getAcademyOverridesForContext,
  buildOverrideSummaryLines,
} from '@/lib/curriculum/academyCurriculumResolution'
import { getCurriculumContentForLevel } from '@/lib/templates/curriculumTemplateLinks'

export interface GenerateSessionInput {
  templateId: string
  name: string
  scheduledDate: string
  scheduledTime?: string | null
  coachId: string
  sessionNotes?: string | null
  focusGateIds?: string[]
  /** Optional group override. Defaults to the template's group_id when omitted. */
  groupId?: string | null
}

export interface GenerateSessionResult {
  sessionId: string | null
  error: string | null
}

export async function generateSessionFromTemplateAction(
  input: GenerateSessionInput
): Promise<GenerateSessionResult> {
  try { await assertNotPreviewMode() } catch { return { sessionId: null, error: 'Writes are disabled in preview mode.' } }

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
  //    Use select('*') so curriculum_level_id is included when the column exists; absent columns are safely undefined.
  const rawDb = supabase as any
  const { data: template } = await rawDb
    .from('templates')
    .select('*')
    .eq('id', input.templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { sessionId: null, error: 'Template not found or access denied.' }

  // 3a. Resolve curriculum level name if template has one — prepended to session_notes
  let curriculumLevelName: string | null = null
  let curriculumCoachCues: string[] = []
  if (template.curriculum_level_id) {
    const { data: levelRow } = await rawDb
      .from('curriculum_levels')
      .select('display_name')
      .eq('id', template.curriculum_level_id)
      .single()
    curriculumLevelName = levelRow?.display_name ?? null

    // Fetch coach language cues for richer session context
    const contentItems = await getCurriculumContentForLevel(
      template.curriculum_level_id,
      supabase,
      ['curriculum_coach_language', 'curriculum_gates'],
    )
    const coachLangItems = contentItems
      .filter(i => i.section === 'curriculum_coach_language')
      .slice(0, 4)
      .map(i => i.content)
    if (coachLangItems.length > 0) {
      curriculumCoachCues = coachLangItems
    }
  }

  // 3b. Resolve academy curriculum version for session context header (Sprint 75)
  let academyVersionName: string | null = null
  let overrideSummaryLines: string[] = []
  if (template.curriculum_level_id) {
    const activeVersion = await getActiveAcademyCurriculumVersion(supabase, academyId)
    if (activeVersion) {
      academyVersionName = activeVersion.name
      const overrides = await getAcademyOverridesForContext({
        supabase,
        academyId,
        curriculumVersionId: activeVersion.id,
        levelId: template.curriculum_level_id,
      })
      overrideSummaryLines = buildOverrideSummaryLines(overrides)
    }
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
  // 7a. Resolve focus gates — director-selected gates for today's session context
  let focusGateLines: string[] = []
  if (input.focusGateIds && input.focusGateIds.length > 0 && template.curriculum_level_id) {
    const { data: selectedGates } = await rawDb
      .from('curriculum_gates')
      .select('id, domain, criterion, threshold')
      .in('id', input.focusGateIds)
      .eq('level_id', template.curriculum_level_id)
      .limit(10)
    const gates = (selectedGates ?? []) as Array<{ id: string; domain: string; criterion: string; threshold: string }>
    if (gates.length > 0) {
      focusGateLines.push(`[Today's Curriculum Focus — ${gates.length} gate${gates.length !== 1 ? 's' : ''}]`)
      for (const g of gates) {
        const threshold = g.threshold ? ` · Target: ${g.threshold}` : ''
        focusGateLines.push(`• [${g.domain}] ${g.criterion}${threshold}`)
      }
      focusGateLines.push('')
    }
  }

  const curriculumLines: string[] = []
  if (curriculumLevelName) {
    curriculumLines.push(`[Curriculum: ${curriculumLevelName}]`)
    if (academyVersionName) {
      curriculumLines.push(`[Academy Version: ${academyVersionName}]`)
    }
    if (overrideSummaryLines.length > 0) {
      curriculumLines.push(`[Academy Overrides: ${overrideSummaryLines.length} active]`)
      curriculumLines.push(...overrideSummaryLines)
    }
    if (curriculumCoachCues.length > 0) {
      curriculumLines.push(`[Coach Cues: ${curriculumCoachCues.join(' · ')}]`)
    }
    curriculumLines.push('')
  }
  const curriculumPrefix = [...curriculumLines, ...focusGateLines].join('\n')
  const finalSessionNotes = curriculumPrefix + (input.sessionNotes?.trim() ?? '')

  // 7b. Resolve the session's GROUP — this is the roster source for the whole coach
  //     workflow. The coach session view, attendance marking, and wrap-up all derive
  //     players LIVE from session.group_id → group_memberships (is_current=true); no
  //     player rows are snapshotted at generation time. A session with no group has no
  //     roster, so the coach cannot mark attendance or complete wrap-up. We resolve the
  //     group here (director selection first, template default second) and surface a
  //     warning to the director when no usable roster results, rather than shipping a
  //     silently empty session.
  const requestedGroupId = input.groupId ?? template.group_id ?? null
  let resolvedGroupId: string | null = null
  let rosterWarning: string | null = null
  if (requestedGroupId) {
    const { data: groupRow } = await supabase
      .from('groups')
      .select('id, is_active')
      .eq('id', requestedGroupId)
      .eq('academy_id', academyId)
      .single()
    if (!groupRow) {
      return { sessionId: null, error: 'Selected group was not found in this academy.' }
    }
    if (!groupRow.is_active) {
      return { sessionId: null, error: 'Selected group is no longer active. Choose an active group.' }
    }
    resolvedGroupId = groupRow.id
    // Confirm the group has current members — otherwise the roster is still empty.
    const { count: memberCount } = await supabase
      .from('group_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', resolvedGroupId)
      .eq('is_current', true)
      .eq('academy_id', academyId)
    if (!memberCount || memberCount === 0) {
      rosterWarning =
        'Session created, but the selected group has no current players — the coach roster ' +
        'will be empty until players are added to the group.'
    }
  } else {
    rosterWarning =
      'Session created without a group — the coach will have no player roster and cannot ' +
      'mark attendance or complete wrap-up. Assign a group to enable the full coach workflow.'
  }

  // 7c. Resolve the session header duration. Prefer the template's planned total; fall
  //     back to the sum of block durations so the header is never blank when blocks exist.
  const summedBlockDuration = templateBlocks.reduce((sum, b) => sum + (b.duration_min ?? 0), 0)
  const sessionDurationMin =
    template.total_duration_min ?? (summedBlockDuration > 0 ? summedBlockDuration : null)

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      academy_id: academyId,
      coach_id: input.coachId,
      template_id: input.templateId,
      name: input.name.trim() || template.name,
      // Carry the planned duration so the coach session header reflects it (7c).
      duration_min: sessionDurationMin,
      // Roster source for the coach workflow — resolved & validated in step 7b.
      group_id: resolvedGroupId,
      scheduled_date: input.scheduledDate,
      scheduled_time: input.scheduledTime?.trim() || null,
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

  // 9. Insert session_block_exercises — best-effort. If RLS blocks INSERT (e.g. migration 056
  //    not yet applied), the session and its blocks are still valid and returned. A warning
  //    message is surfaced to the director so they know exercises are missing.
  let exerciseWarning: string | null = null
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
      exerciseWarning =
        'Session created with blocks — exercises could not be copied. ' +
        'This is likely due to a pending database migration (056). ' +
        'Exercises will appear automatically once the migration is applied.'
      break
    }
  }

  // Resolve actor role for audit log
  const { data: actorMembership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  await writeAuditLog({
    db: supabase,
    academyId,
    actorId: user.id,
    actorRole: (actorMembership?.role as Database['public']['Enums']['user_role']) ?? null,
    action: 'session_created_from_template',
    targetType: 'sessions',
    targetId: sessionId,
    targetLabel: input.name.trim() || template.name,
    payload: {
      template_id: input.templateId,
      coach_id: input.coachId,
      group_id: resolvedGroupId,
      scheduled_date: input.scheduledDate,
      block_count: templateBlocks.length,
      exercise_warning: exerciseWarning ?? null,
      roster_warning: rosterWarning ?? null,
    },
    sourceType: 'ui',
  })

  // Surface roster + exercise warnings together. The session is still valid; these are
  // advisory so the director knows what to fix before the coach opens it.
  const combinedWarning = [rosterWarning, exerciseWarning].filter(Boolean).join(' ') || null
  return { sessionId, error: combinedWarning }
}
