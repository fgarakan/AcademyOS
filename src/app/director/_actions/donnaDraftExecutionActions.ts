'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { isPreviewMode } from '@/lib/utils/previewMode'
import type { DonnaApprovalExecutionResult } from '@/components/assistant/donnaApprovalExecutionTypes'

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

  // _resolved_player_id is set only when the director explicitly confirmed a player
  // via the object resolution panel — it is never inferred from a name guess.
  const confirmedPlayerId = (fields._resolved_player_id ?? '').trim() || null

  if (!observation) {
    return { ok: false, status: 'error', message: 'Observation is required.' }
  }

  // Build a structured transcript
  const parts = [`Observation: ${observation}`]
  if (player) parts.unshift(confirmedPlayerId ? `Player: ${player}` : `Player (name only, not yet linked): ${player}`)
  if (sessionContext) parts.push(`Session context: ${sessionContext}`)
  if (priorityLink) parts.push(`Linked priority: ${priorityLink}`)
  const transcript = parts.join('\n')

  const { error } = await supabase.from('voice_notes').insert({
    academy_id: academyId,
    author_id: userId,
    player_id: confirmedPlayerId,
    session_id: null,
    raw_input: transcript,
    transcript,
    audio_path: null,
    processing_status: 'pending_review',
  })

  if (error) {
    return { ok: false, status: 'error', message: error.message }
  }

  revalidatePath('/director/review')
  if (confirmedPlayerId) {
    revalidatePath(`/director/players/${confirmedPlayerId}`)
  }

  if (confirmedPlayerId) {
    return {
      ok: true,
      status: 'saved',
      message: `Coach note for "${player || 'this player'}" saved and linked to their player record.`,
      safetyNotes: [
        'This note is linked to the player you confirmed.',
        'It is in pending review — not visible to parents or players until approved.',
      ],
    }
  }

  return {
    ok: true,
    status: 'saved',
    message: player
      ? `Coach note for "${player}" saved as a pending-review capture.`
      : 'Coach note saved as a pending-review capture.',
    safetyNotes: [
      'This note is not yet linked to a player record.',
      'Route it to the correct player from the Review Queue — it will not be visible to parents or players until you do.',
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
  safetyNotes.push('Session blocks are not yet populated — use the session detail page to generate blocks.')

  return {
    ok: true,
    status: 'saved',
    message: `Session "${sessionName}" created as planned.`,
    createdId: sessionId,
    safetyNotes,
  }
}
