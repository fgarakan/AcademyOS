'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { isPreviewMode } from '@/lib/utils/previewMode'
import type { DonnaApprovalExecutionResult } from '@/components/assistant/donnaApprovalExecutionTypes'
import {
  buildCoachBrief,
  type CoachBriefInput,
} from '@/components/assistant/donnaCoachBriefBuilder'
import {
  structureDonnaNote,
} from '@/components/assistant/donnaNoteStructuring'

// ---------------------------------------------------------------------------
// Auth + academy_id helper — shared by both actions
// ---------------------------------------------------------------------------

async function getAuthorizedContext(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof getSupabaseServer>>; userId: string; academyId: string }
  | { ok: false; result: DonnaApprovalExecutionResult }
> {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      ok: false,
      result: { ok: false, status: 'blocked', message: 'Not authenticated.' },
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) {
    return {
      ok: false,
      result: { ok: false, status: 'blocked', message: 'Academy context unavailable.' },
    }
  }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return {
      ok: false,
      result: {
        ok: false,
        status: 'blocked',
        message: 'Director or Head Coach access required.',
      },
    }
  }

  return { ok: true, supabase, userId: user.id, academyId: profile.academy_id }
}

// ---------------------------------------------------------------------------
// saveFitnessTemplateDraftAction
//
// Saves a fitness template draft to templates + template_blocks.
// Tagged fitness_template:true, source:assistant, intensity:<value>.
// track: null — target_level_or_group is stored in name/description instead.
// Revalidates /director/fitness on success.
// ---------------------------------------------------------------------------

export async function saveFitnessTemplateDraftAction(
  fields: Record<string, string>,
): Promise<DonnaApprovalExecutionResult> {
  if (await isPreviewMode()) {
    return { ok: false, status: 'blocked', message: 'Writes are disabled in preview mode.' }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) return ctx.result

  const { supabase, userId, academyId } = ctx

  const goal = (fields.training_goal ?? '').trim()
  const group = (fields.target_level_or_group ?? '').trim()
  const duration = parseInt(fields.duration ?? '0', 10)
  const blockCategories = (fields.block_categories ?? '').trim()
  const intensity = (fields.intensity ?? 'moderate').trim().toLowerCase()
  const transfer = (fields.tennis_transfer_focus ?? '').trim()

  if (!goal || !group) {
    return {
      ok: false,
      status: 'error',
      message: 'Training goal and target group are required.',
    }
  }

  const templateName = `${goal} — ${group}`.slice(0, 200)
  const description = transfer || blockCategories || null

  // rawDb cast — tags array and track: null may cause TS2589 without it
  const rawDb = supabase as any

  const { data: templateRow, error: templateError } = await rawDb
    .from('templates')
    .insert({
      academy_id: academyId,
      created_by: userId,
      name: templateName,
      description,
      track: null,
      total_duration_min: Number.isFinite(duration) && duration > 0 ? duration : null,
      is_active: true,
      is_default: false,
      tags: ['fitness_template:true', 'source:assistant', `intensity:${intensity}`],
    })
    .select('id')
    .single()

  if (templateError || !templateRow?.id) {
    return {
      ok: false,
      status: 'error',
      message: templateError?.message ?? 'Failed to create fitness template.',
    }
  }

  const templateId: string = templateRow.id

  // Insert one block per category listed — best-effort (template already committed)
  if (blockCategories) {
    const cats = blockCategories.split(/[,;]+/).map((c: string) => c.trim()).filter(Boolean)
    if (cats.length > 0) {
      const blockRows = cats.map((cat: string, idx: number) => ({
        template_id: templateId,
        name: cat,
        type: 'fitness' as const,
        duration_min: duration > 0 && cats.length > 0 ? Math.floor(duration / cats.length) : 0,
        order_index: idx,
        notes: idx === cats.length - 1 && transfer ? `Tennis transfer: ${transfer}` : null,
      }))
      await rawDb.from('template_blocks').insert(blockRows)
    }
  }

  revalidatePath('/director/fitness')
  revalidatePath('/director/class-templates')

  return {
    ok: true,
    status: 'saved',
    message: `Fitness template "${templateName}" saved.`,
    createdId: templateId,
    safetyNotes: [
      'This template is now available in your template library.',
      'No session has been created — you can schedule one separately.',
    ],
  }
}

// ---------------------------------------------------------------------------
// saveCoachNoteDraftAction
//
// Saves a coach note as a voice_note with player_id: null and
// processing_status: 'pending_review'. The director routes it to a specific
// player from the review queue — no unsafe name-to-UUID resolution is done here.
// Revalidates /director/review on success.
// ---------------------------------------------------------------------------

export async function saveCoachNoteDraftAction(
  fields: Record<string, string>,
): Promise<DonnaApprovalExecutionResult> {
  if (await isPreviewMode()) {
    return { ok: false, status: 'blocked', message: 'Writes are disabled in preview mode.' }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) return ctx.result

  const { supabase, userId, academyId } = ctx

  const player = (fields.player ?? '').trim()
  const observation = (fields.observation ?? '').trim()
  const sessionContext = (fields.session_context ?? '').trim()
  const priorityLink = (fields.priority_link ?? '').trim()

  // _resolved_player_id and _resolved_session_id are set only when the director
  // explicitly confirmed the object via the resolution panel — never inferred.
  const confirmedPlayerId = (fields._resolved_player_id ?? '').trim() || null
  const confirmedSessionId = (fields._resolved_session_id ?? '').trim() || null

  if (!observation) {
    return { ok: false, status: 'error', message: 'Observation is required.' }
  }

  // Deterministic note structuring — no AI, no API
  const structured = structureDonnaNote({
    observation,
    player: confirmedPlayerId ? player : null,
    session: confirmedSessionId ? sessionContext : null,
    priority_link: priorityLink || null,
  })

  // Build a structured transcript
  const parts = [`Observation: ${observation}`]
  if (player) parts.unshift(confirmedPlayerId ? `Player: ${player}` : `Player (name only, not yet linked): ${player}`)
  if (sessionContext) parts.push(`Session context: ${sessionContext}`)
  if (priorityLink) parts.push(`Linked priority: ${priorityLink}`)
  const transcript = parts.join('\n')

  const rawDb = supabase as any

  const { error } = await rawDb.from('voice_notes').insert({
    academy_id: academyId,
    author_id: userId,
    player_id: confirmedPlayerId,
    session_id: confirmedSessionId,
    raw_input: transcript,
    transcript,
    audio_path: null,
    processing_status: 'pending_review',
    tags: structured.suggestedTags,
  })

  if (error) {
    return { ok: false, status: 'error', message: error.message }
  }

  revalidatePath('/director/review')
  if (confirmedPlayerId) {
    revalidatePath(`/director/players/${confirmedPlayerId}`)
  }

  const baseMessage = confirmedPlayerId
    ? `Coach note for "${player || 'this player'}" saved and linked to their player record.`
    : player
      ? `Coach note for "${player}" saved as a pending-review capture.`
      : 'Coach note saved as a pending-review capture.'

  const safetyNotes = [
    'Internal only — not visible to parents or players.',
    ...structured.safetyNotes.filter(n => !n.startsWith('Internal only')),
  ]
  if (!confirmedPlayerId) {
    safetyNotes.push('Not yet linked to a player record — route it from the Review Queue.')
  }
  if (confirmedSessionId) {
    safetyNotes.push('Linked to the session you confirmed.')
  }

  return { ok: true, status: 'saved', message: baseMessage, safetyNotes }
}

// ---------------------------------------------------------------------------
// savePlayerNoteDraftAction
//
// Saves a player development note to player_development_summary.
// Requires a confirmed _resolved_player_id — never saves without a linked player.
// Only writes: coach_summary, development_focus, source.
// NEVER touches: show_to_parent, show_to_student, current_strengths,
//   things_to_work_on, parent_summary, student_friendly_summary.
// Uses SELECT + conditional INSERT/UPDATE to protect existing visibility flags.
// Revalidates the player page on success.
// ---------------------------------------------------------------------------

export async function savePlayerNoteDraftAction(
  fields: Record<string, string>,
): Promise<DonnaApprovalExecutionResult> {
  if (await isPreviewMode()) {
    return { ok: false, status: 'blocked', message: 'Writes are disabled in preview mode.' }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) return ctx.result

  const { supabase, userId, academyId } = ctx

  // Confirmed player ID is required — never infer from a name string
  const confirmedPlayerId = (fields._resolved_player_id ?? '').trim() || null
  if (!confirmedPlayerId) {
    return {
      ok: false,
      status: 'blocked',
      message: 'Please confirm the player before saving this note. Use the resolver panel to search and select a player.',
    }
  }

  const playerLabel = (fields.player ?? '').replace(/\s*✓$/, '').trim() || 'this player'
  const noteFocus = (fields.note_focus ?? '').trim()
  const curriculumLink = (fields.curriculum_link ?? '').trim()

  if (!noteFocus) {
    return { ok: false, status: 'error', message: 'Note focus is required.' }
  }

  const developmentFocus = noteFocus.slice(0, 500)
  const coachSummary = curriculumLink
    ? `${noteFocus}\n\nCurriculum link: ${curriculumLink}`.slice(0, 2000)
    : noteFocus.slice(0, 2000)

  const rawDb = supabase as any

  // SELECT to check if a row already exists for this player in this academy
  const { data: existingRow } = await rawDb
    .from('player_development_summary')
    .select('id')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .maybeSingle()

  if (existingRow?.id) {
    // UPDATE — touch only safe internal fields; never modify visibility flags
    const { error: updateError } = await rawDb
      .from('player_development_summary')
      .update({
        coach_summary: coachSummary,
        development_focus: developmentFocus,
        source: 'donna_assistant',
      })
      .eq('id', existingRow.id)
      .eq('academy_id', academyId)

    if (updateError) {
      return { ok: false, status: 'error', message: updateError.message }
    }
  } else {
    // INSERT — set show_to_parent and show_to_student explicitly to false
    const { error: insertError } = await rawDb
      .from('player_development_summary')
      .insert({
        academy_id: academyId,
        player_id: confirmedPlayerId,
        created_by: userId,
        coach_summary: coachSummary,
        development_focus: developmentFocus,
        source: 'donna_assistant',
        show_to_parent: false,
        show_to_student: false,
      })

    if (insertError) {
      return { ok: false, status: 'error', message: insertError.message }
    }
  }

  revalidatePath(`/director/players/${confirmedPlayerId}`)

  return {
    ok: true,
    status: 'saved',
    message: `Player note for "${playerLabel}" saved to their development record.`,
    safetyNotes: [
      'Internal only — not visible to parents or players.',
      'Does not update player level.',
      'Does not send any communication.',
      'show_to_parent and show_to_student were not changed — director must explicitly enable visibility.',
      'Director review may still be required.',
    ],
  }
}

// ---------------------------------------------------------------------------
// saveSessionDraftAction
//
// Saves a planned session shell (status: 'planned').
// Requires a confirmed coach_id — sessions.coach_id is NOT NULL.
// Uses confirmed group/template IDs when available; both are optional in the DB.
// Does NOT copy template_blocks — session is a shell only; blocks are populated
// from the session detail page after creation.
// Does NOT publish, notify, or create attendance records.
// Revalidates /director/sessions on success.
// ---------------------------------------------------------------------------

/** Converts common date expressions to ISO YYYY-MM-DD, or returns null on failure. */
function parseDateToIso(dateText: string): string | null {
  if (!dateText) return null
  const text = dateText.trim().toLowerCase()
  const now = new Date()

  if (text === 'today') {
    return now.toISOString().split('T')[0]
  }
  if (text === 'tomorrow') {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  // Next occurrence of a named weekday
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayIdx = weekdays.findIndex(w => text.includes(w))
  if (dayIdx !== -1) {
    const d = new Date(now)
    const currentDay = d.getDay()
    let daysAhead = dayIdx - currentDay
    if (daysAhead <= 0) daysAhead += 7
    d.setDate(d.getDate() + daysAhead)
    return d.toISOString().split('T')[0]
  }

  // Already ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text

  // Fallback: JS Date parse (handles "May 19", "19 May 2026", etc.)
  const parsed = new Date(dateText)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  return null
}

export async function saveSessionDraftAction(
  fields: Record<string, string>,
): Promise<DonnaApprovalExecutionResult> {
  if (await isPreviewMode()) {
    return { ok: false, status: 'blocked', message: 'Writes are disabled in preview mode.' }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) return ctx.result

  const { supabase, userId, academyId } = ctx

  // sessions.coach_id is NOT NULL — confirmed ID is required before saving
  const coachId = (fields._resolved_coach_id ?? '').trim() || null
  if (!coachId) {
    return {
      ok: false,
      status: 'blocked',
      message:
        'Please confirm the coach before saving this session. Use the resolver panel to search and select a coach.',
    }
  }

  // scheduled_date is NOT NULL — must parse successfully
  const rawDate = (fields.date ?? '').trim()
  const scheduledDate = parseDateToIso(rawDate)
  if (!scheduledDate) {
    return {
      ok: false,
      status: 'blocked',
      message:
        'Could not parse the session date. Please provide a clearer date (e.g. "Tuesday May 20" or "2026-05-20").',
    }
  }

  // Optional resolved IDs — safe to omit; schema allows null
  const groupId = (fields._resolved_group_id ?? '').trim() || null
  const templateId = (fields._resolved_class_template_id ?? '').trim() || null

  // Derive display labels (strip confirmation tick if present)
  const coachLabel = (fields.coach ?? '').replace(/\s*✓$/, '').trim()
  const groupLabel = (fields.group ?? '').replace(/\s*✓$/, '').trim()
  const templateLabel = (fields.template ?? '').replace(/\s*✓$/, '').trim()
  const sessionGoal = (fields.session_goal ?? '').trim() || null

  // Auto-generate session name from available resolved info
  const nameParts: string[] = []
  if (templateLabel) nameParts.push(templateLabel)
  else if (groupLabel) nameParts.push(groupLabel)
  else if (coachLabel) nameParts.push(coachLabel)
  nameParts.push(scheduledDate)
  const sessionName = nameParts.join(' — ').slice(0, 200) || 'Session Draft'

  // rawDb cast — avoids TS2589 on insert with nullable columns
  const rawDb = supabase as any

  const { data: sessionRow, error: sessionError } = await rawDb
    .from('sessions')
    .insert({
      academy_id: academyId,
      created_by: userId,
      coach_id: coachId,
      group_id: groupId,
      template_id: templateId,
      name: sessionName,
      scheduled_date: scheduledDate,
      scheduled_time: null,
      status: 'planned',
      session_notes: sessionGoal,
      duration_min: null,
    })
    .select('id')
    .single()

  if (sessionError || !sessionRow?.id) {
    return {
      ok: false,
      status: 'error',
      message: sessionError?.message ?? 'Failed to create session.',
    }
  }

  const sessionId: string = sessionRow.id

  revalidatePath('/director/sessions')

  const safetyNotes: string[] = [
    'This is an internal planned session only.',
    'No coaches, parents, or players have been notified.',
    'No attendance records have been created.',
  ]
  if (!groupId) safetyNotes.push('No group was confirmed — assign one from the session detail page.')
  if (!templateId) safetyNotes.push('No template was confirmed — assign one from the session detail page.')
  safetyNotes.push('Session blocks are not yet populated — use "Populate Session Blocks" in the Academy Assistant to add them.')

  return {
    ok: true,
    status: 'saved',
    message: `Session "${sessionName}" created as planned.`,
    createdId: sessionId,
    safetyNotes,
  }
}

// ---------------------------------------------------------------------------
// populateSessionBlocksAction
//
// Copies template_blocks → session_blocks for an existing planned session.
// Requires a confirmed session_id. Uses the session's own template_id unless
// _resolved_class_template_id is provided as an override.
// Duplicate guard: blocks are refused if the session already has any blocks.
// Returns a local-only coach brief in the `details` field — never stored, never sent.
// Revalidates /director/sessions and the session detail page on success.
// ---------------------------------------------------------------------------

export async function populateSessionBlocksAction(
  fields: Record<string, string>,
): Promise<DonnaApprovalExecutionResult> {
  if (await isPreviewMode()) {
    return { ok: false, status: 'blocked', message: 'Writes are disabled in preview mode.' }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) return ctx.result

  const { supabase, academyId } = ctx

  const sessionId = (fields._resolved_session_id ?? '').trim() || null
  if (!sessionId) {
    return {
      ok: false,
      status: 'blocked',
      message: 'Please confirm the session before populating blocks. Use the resolver panel to search and select a session.',
    }
  }

  const rawDb = supabase as any

  // Fetch the session row
  const { data: session, error: sessionFetchError } = await rawDb
    .from('sessions')
    .select('id, name, scheduled_date, status, template_id, session_notes')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()

  if (sessionFetchError || !session) {
    return { ok: false, status: 'error', message: 'Session not found or not accessible.' }
  }

  // Duplicate guard: refuse if session already has blocks
  const { count: existingBlockCount } = await rawDb
    .from('session_blocks')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  if (existingBlockCount && existingBlockCount > 0) {
    return {
      ok: false,
      status: 'blocked',
      message: `This session already has ${existingBlockCount} block${existingBlockCount === 1 ? '' : 's'}. Remove existing blocks before repopulating.`,
    }
  }

  // Determine template: explicit override from resolver, else session's own template_id
  const templateId =
    (fields._resolved_class_template_id ?? '').trim() || session.template_id || null

  if (!templateId) {
    return {
      ok: false,
      status: 'blocked',
      message: 'No template is linked to this session. Link a template first, or confirm one using the resolver panel.',
    }
  }

  // Fetch the template name
  const { data: template, error: templateFetchError } = await rawDb
    .from('templates')
    .select('id, name')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()

  if (templateFetchError || !template) {
    return { ok: false, status: 'error', message: 'Template not found or not accessible.' }
  }

  // Fetch template blocks
  const { data: templateBlocks, error: blocksError } = await rawDb
    .from('template_blocks')
    .select('id, name, type, duration_min, order_index, intensity, notes')
    .eq('template_id', templateId)
    .order('order_index', { ascending: true })

  if (blocksError) {
    return {
      ok: false,
      status: 'error',
      message: blocksError.message ?? 'Failed to fetch template blocks.',
    }
  }

  if (!templateBlocks || templateBlocks.length === 0) {
    return {
      ok: false,
      status: 'blocked',
      message: `The template "${template.name}" has no blocks. Add blocks to the template before populating.`,
    }
  }

  // Copy template_blocks → session_blocks
  const sessionBlockRows = (templateBlocks as any[]).map((tb: any) => ({
    session_id: sessionId,
    template_block_id: tb.id,
    name: tb.name,
    type: tb.type,
    duration_min: tb.duration_min,
    order_index: tb.order_index,
    intensity: tb.intensity ?? null,
    notes: tb.notes ?? null,
    is_override: false,
  }))

  const { error: insertError } = await rawDb.from('session_blocks').insert(sessionBlockRows)

  if (insertError) {
    return {
      ok: false,
      status: 'error',
      message: insertError.message ?? 'Failed to insert session blocks.',
    }
  }

  revalidatePath('/director/sessions')
  revalidatePath(`/director/sessions/${sessionId}`)

  // Build local-only coach brief (never stored, never sent)
  const coachBriefFocus = (fields.coach_brief_focus ?? '').trim() || null
  const modifications = (fields.modifications ?? '').trim() || null

  const briefInput: CoachBriefInput = {
    sessionName: session.name ?? (fields.session ?? '').replace(/\s*✓$/, '').trim() ?? 'Session',
    scheduledDate: session.scheduled_date ?? '',
    templateName: template.name,
    blocks: (templateBlocks as any[]).map((tb: any) => ({
      name: tb.name,
      type: tb.type,
      duration_min: tb.duration_min,
      order_index: tb.order_index,
      notes: tb.notes ?? null,
    })),
    sessionFocus: session.session_notes ?? coachBriefFocus ?? null,
    coachNotes: coachBriefFocus,
    modifications,
  }

  const coachBriefText = buildCoachBrief(briefInput)

  const blockCount = templateBlocks.length

  return {
    ok: true,
    status: 'saved',
    message: `${blockCount} block${blockCount === 1 ? '' : 's'} from "${template.name}" added to the session.`,
    createdId: sessionId,
    details: coachBriefText,
    safetyNotes: [
      'Session blocks have been copied from the template.',
      'No coach, parent, or player has been notified.',
      'The coach brief below is a local draft only — not sent or stored.',
      'Review and edit the session before sending any communications.',
    ],
  }
}
