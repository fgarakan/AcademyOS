'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { isPreviewMode } from '@/lib/utils/previewMode'
import type {
  DonnaReviewItem,
  DonnaReviewQueueSummary,
  DonnaReviewQueueActionResult,
} from '@/components/assistant/donnaReviewQueueTypes'

// ---------------------------------------------------------------------------
// Auth + academy_id helper — same pattern as donnaDraftExecutionActions
// ---------------------------------------------------------------------------

async function getAuthorizedContext(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof getSupabaseServer>>; userId: string; academyId: string }
  | { ok: false; result: DonnaReviewQueueActionResult }
> {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      ok: false,
      result: { ok: false, status: 'blocked', message: 'Not authenticated.', safetyNotes: [] },
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
      result: { ok: false, status: 'blocked', message: 'Academy context unavailable.', safetyNotes: [] },
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
        safetyNotes: [],
      },
    }
  }

  return { ok: true, supabase, userId: user.id, academyId: profile.academy_id }
}

// ---------------------------------------------------------------------------
// getDonnaReviewQueueAction
//
// Reads up to 15 pending-review voice notes and up to 10 planned sessions
// with no session_blocks. Returns a DonnaReviewQueueSummary.
// Read-only — no mutations.
// ---------------------------------------------------------------------------

export async function getDonnaReviewQueueAction(): Promise<DonnaReviewQueueSummary> {
  const ctx = await getAuthorizedContext()
  if (!ctx.ok) {
    return {
      totalCount: 0,
      pendingReviewCount: 0,
      needsRoutingCount: 0,
      sessionNeedsBlocksCount: 0,
      proposedActionsCount: 0,
      items: [],
      fetchedAt: new Date().toISOString(),
    }
  }

  const { supabase, academyId } = ctx
  const rawDb = supabase as any

  // ── 1. Pending-review voice notes ────────────────────────────────────────

  const { data: rawNotes } = await rawDb
    .from('voice_notes')
    .select('id, player_id, session_id, transcript, raw_input, created_at, tags')
    .eq('academy_id', academyId)
    .eq('processing_status', 'pending_review')
    .order('created_at', { ascending: false })
    .limit(15)

  const notes: any[] = rawNotes ?? []

  // Batch-fetch player labels for linked notes
  const playerIds = Array.from(new Set(notes.map((n: any) => n.player_id).filter(Boolean)))
  let playerLabels: Record<string, string> = {}
  if (playerIds.length > 0) {
    const { data: players } = await rawDb
      .from('profiles')
      .select('id, full_name')
      .in('id', playerIds)
    if (players) {
      for (const p of players) {
        playerLabels[p.id] = p.full_name ?? 'Unknown player'
      }
    }
  }

  // Batch-fetch session labels for linked notes
  const sessionIds = Array.from(new Set(notes.map((n: any) => n.session_id).filter(Boolean)))
  let sessionLabels: Record<string, string> = {}
  if (sessionIds.length > 0) {
    const { data: sessions } = await rawDb
      .from('sessions')
      .select('id, name, scheduled_date')
      .in('id', sessionIds)
    if (sessions) {
      for (const s of sessions) {
        sessionLabels[s.id] = s.name ?? s.scheduled_date ?? 'Session'
      }
    }
  }

  const noteItems: DonnaReviewItem[] = notes.map((note: any) => {
    const isLinked = !!note.player_id
    const playerLabel = note.player_id ? (playerLabels[note.player_id] ?? null) : null
    const sessionLabel = note.session_id ? (sessionLabels[note.session_id] ?? null) : null
    const previewText = ((note.transcript ?? note.raw_input ?? '') as string).slice(0, 120)

    return {
      id: note.id,
      type: isLinked ? 'coach_note_pending_review' : 'unlinked_voice_note',
      title: isLinked
        ? `Note${playerLabel ? ` — ${playerLabel}` : ''}`
        : 'Unlinked note',
      summary: previewText || (isLinked ? 'Coach note pending director review.' : 'Voice note not yet linked to a player.'),
      status: isLinked ? 'pending_review' : 'needs_routing',
      priority: isLinked ? 'medium' : 'high',
      createdAt: note.created_at,
      playerId: note.player_id ?? null,
      playerLabel,
      sessionId: note.session_id ?? null,
      sessionLabel,
      sourceTable: 'voice_notes',
      sourceId: note.id,
      tags: Array.isArray(note.tags) ? note.tags : [],
      whyItNeedsReview: isLinked
        ? `This voice note is linked to ${playerLabel ?? 'a player'} but has not been reviewed by the director yet.`
        : 'This voice note was captured without a confirmed player. It must be routed to a player record before it can be used.',
      allowedActions: [
        'mark_reviewed',
        ...(isLinked ? [] : (['route_to_player'] as const)),
        ...(!note.session_id ? (['route_to_session'] as const) : []),
      ],
      blockedActions: ['start_populate_blocks'],
      safetyNotes: [
        'Internal only — not visible to parents or players.',
        'Mark reviewed only changes the processing status.',
        'Routing links an internal record only — does not publish the note.',
      ],
      previewText,
    }
  })

  // ── 2. Planned sessions with no blocks ───────────────────────────────────

  const { data: rawSessions } = await rawDb
    .from('sessions')
    .select('id, name, scheduled_date, created_at')
    .eq('academy_id', academyId)
    .eq('status', 'planned')
    .order('scheduled_date', { ascending: true })
    .limit(10)

  const plannedSessions: any[] = rawSessions ?? []
  const plannedSessionIds = plannedSessions.map((s: any) => s.id)

  let sessionBlockCounts: Record<string, number> = {}
  if (plannedSessionIds.length > 0) {
    const { data: blockRows } = await rawDb
      .from('session_blocks')
      .select('session_id')
      .in('session_id', plannedSessionIds)
    if (blockRows) {
      for (const row of blockRows) {
        sessionBlockCounts[row.session_id] = (sessionBlockCounts[row.session_id] ?? 0) + 1
      }
    }
  }

  const sessionItems: DonnaReviewItem[] = plannedSessions
    .filter((s: any) => (sessionBlockCounts[s.id] ?? 0) === 0)
    .map((session: any) => ({
      id: `session_needs_blocks_${session.id}`,
      type: 'session_needs_blocks' as const,
      title: session.name ?? `Session ${session.scheduled_date ?? ''}`,
      summary: `Planned session with no blocks yet. Scheduled: ${session.scheduled_date ?? 'date not set'}.`,
      status: 'pending_review' as const,
      priority: 'medium' as const,
      createdAt: session.created_at,
      playerId: null,
      playerLabel: null,
      sessionId: session.id,
      sessionLabel: session.name ?? null,
      sourceTable: 'sessions',
      sourceId: session.id,
      tags: ['session_needs_blocks'],
      whyItNeedsReview: 'This session is in planned status but has no blocks yet. Blocks define what activities will happen during the session.',
      allowedActions: ['start_populate_blocks'] as const,
      blockedActions: ['mark_reviewed', 'route_to_player', 'route_to_session'] as const,
      safetyNotes: [
        'No blocks will be populated automatically.',
        'Populate task requires your explicit approval.',
        'No coach, parent, or player is notified.',
      ],
      previewText: session.scheduled_date ?? '',
    }))

  // ── 3. Pending Donna intelligence draft proposed_actions ─────────────────

  const { data: rawProposedActions } = await rawDb
    .from('proposed_actions')
    .select('id, target_module, proposed_payload, created_at')
    .eq('academy_id', academyId)
    .in('target_module', ['parent_communication', 'level_review', 'curriculum_adjustment'])
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })
    .limit(10)

  const proposedActionRows: any[] = rawProposedActions ?? []

  const proposedActionItems: DonnaReviewItem[] = proposedActionRows.map((row: any) => {
    const payload = (row.proposed_payload as Record<string, unknown>) ?? {}
    const draftType = (payload.draft_type as string) ?? ''
    const targetModule = row.target_module as string

    let itemType: DonnaReviewItem['type']
    let title: string
    let whyItNeedsReview: string
    let previewText: string

    if (targetModule === 'parent_communication') {
      const playerLabel = (payload.player_label as string | null) ?? null
      const updateFocus = (payload.update_focus as string | null) ?? null
      itemType = 'parent_update_pending_review'
      title = `Parent Update Draft${playerLabel ? ` — ${playerLabel}` : ''}`
      whyItNeedsReview = `A parent update draft was created${playerLabel ? ` for ${playerLabel}` : ''} and is pending director review. It has not been sent and is not visible to the parent or player.`
      previewText = updateFocus ?? draftType
    } else if (targetModule === 'level_review') {
      const playerLabel = (payload.player_label as string | null) ?? null
      const currentLevel = (payload.current_level as string | null) ?? null
      const nextLevel = (payload.next_level as string | null) ?? null
      itemType = 'level_readiness_pending_review'
      title = `Level Readiness Review${playerLabel ? ` — ${playerLabel}` : ''}`
      whyItNeedsReview = `A level readiness review draft was created${playerLabel ? ` for ${playerLabel}` : ''} and is pending director review. No level change has occurred.`
      previewText =
        currentLevel && nextLevel
          ? `${currentLevel} → ${nextLevel}`
          : (currentLevel ?? draftType)
    } else {
      const proposedChange = (payload.proposed_change as string | null) ?? null
      const targetLevel = (payload.target_level as string | null) ?? null
      const adjustmentType = (payload.adjustment_type as string | null) ?? null
      itemType = 'curriculum_adjustment_pending_review'
      title = 'Curriculum Adjustment Proposal'
      whyItNeedsReview =
        'A curriculum adjustment proposal is pending director review. No curriculum data has been changed.'
      previewText = proposedChange
        ? proposedChange.slice(0, 120)
        : (targetLevel ?? adjustmentType ?? draftType)
    }

    const playerLabel =
      targetModule !== 'curriculum_adjustment'
        ? ((payload.player_label as string | null) ?? null)
        : null

    return {
      id: `proposed_action_${row.id}`,
      type: itemType,
      title,
      summary: (previewText || whyItNeedsReview).slice(0, 120),
      status: 'pending_review' as const,
      priority: 'medium' as const,
      createdAt: row.created_at,
      playerId: (payload.player_id as string | null) ?? null,
      playerLabel,
      sessionId: null,
      sessionLabel: null,
      sourceTable: 'proposed_actions',
      sourceId: row.id,
      tags: [draftType, targetModule].filter(Boolean),
      whyItNeedsReview,
      allowedActions: ['mark_reviewed_proposed_action' as const],
      blockedActions: [
        'mark_reviewed',
        'route_to_player',
        'route_to_session',
        'start_populate_blocks',
      ] as const,
      safetyNotes: [
        'Internal only — not visible to parents, players, or coaches.',
        'This decision only changes the review status — no data is applied.',
        'No communication is sent.',
      ],
      previewText: previewText.slice(0, 120),
    }
  })

  // ── 4. Assemble summary ──────────────────────────────────────────────────

  const allItems = [...noteItems, ...sessionItems, ...proposedActionItems]

  return {
    totalCount: allItems.length,
    pendingReviewCount: noteItems.filter(i => i.type === 'coach_note_pending_review').length,
    needsRoutingCount: noteItems.filter(i => i.type === 'unlinked_voice_note').length,
    sessionNeedsBlocksCount: sessionItems.length,
    proposedActionsCount: proposedActionItems.length,
    items: allItems,
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// markVoiceNoteReviewedAction
//
// Sets processing_status = 'reviewed' for a voice note owned by this academy.
// Does not alter any parent/player-visible fields or visibility flags.
// Revalidates /director/review on success.
// ---------------------------------------------------------------------------

export async function markVoiceNoteReviewedAction(
  noteId: string,
): Promise<DonnaReviewQueueActionResult> {
  if (await isPreviewMode()) {
    return { ok: false, status: 'blocked', message: 'Writes are disabled in preview mode.', safetyNotes: [] }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) return ctx.result

  const { supabase, academyId } = ctx
  const rawDb = supabase as any

  // Verify ownership before writing
  const { data: note } = await rawDb
    .from('voice_notes')
    .select('id, academy_id')
    .eq('id', noteId)
    .eq('academy_id', academyId)
    .single()

  if (!note) {
    return { ok: false, status: 'blocked', message: 'Note not found or not accessible.', safetyNotes: [] }
  }

  const { error } = await rawDb
    .from('voice_notes')
    .update({ processing_status: 'reviewed' })
    .eq('id', noteId)
    .eq('academy_id', academyId)

  if (error) {
    return { ok: false, status: 'error', message: error.message, safetyNotes: [] }
  }

  revalidatePath('/director/review')

  return {
    ok: true,
    status: 'success',
    message: 'Marked as reviewed.',
    safetyNotes: [
      'Only processing_status was changed.',
      'No parent/player-visible fields were altered.',
      'No communication was sent.',
    ],
  }
}

// ---------------------------------------------------------------------------
// routeVoiceNoteToPlayerAction
//
// Sets player_id on a voice note owned by this academy.
// Requires both the note and the player to belong to the same academy.
// Does not publish the note or notify anyone.
// Revalidates /director/review and the player page on success.
// ---------------------------------------------------------------------------

export async function routeVoiceNoteToPlayerAction(
  noteId: string,
  playerId: string,
): Promise<DonnaReviewQueueActionResult> {
  if (await isPreviewMode()) {
    return { ok: false, status: 'blocked', message: 'Writes are disabled in preview mode.', safetyNotes: [] }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) return ctx.result

  const { supabase, academyId } = ctx
  const rawDb = supabase as any

  // Verify note ownership
  const { data: note } = await rawDb
    .from('voice_notes')
    .select('id, academy_id')
    .eq('id', noteId)
    .eq('academy_id', academyId)
    .single()

  if (!note) {
    return { ok: false, status: 'blocked', message: 'Note not found or not accessible.', safetyNotes: [] }
  }

  // Verify player belongs to this academy
  const { data: playerMembership } = await supabase
    .from('academy_memberships')
    .select('profile_id')
    .eq('academy_id', academyId)
    .eq('profile_id', playerId)
    .eq('is_active', true)
    .single()

  if (!playerMembership) {
    return { ok: false, status: 'blocked', message: 'Player not found in this academy.', safetyNotes: [] }
  }

  const { error } = await rawDb
    .from('voice_notes')
    .update({ player_id: playerId })
    .eq('id', noteId)
    .eq('academy_id', academyId)

  if (error) {
    return { ok: false, status: 'error', message: error.message, safetyNotes: [] }
  }

  revalidatePath('/director/review')
  revalidatePath(`/director/players/${playerId}`)

  return {
    ok: true,
    status: 'success',
    message: 'Note linked to player.',
    safetyNotes: [
      'Routing links an internal record only.',
      'The note is not published or visible to parents or players.',
      'No communication was sent.',
    ],
  }
}

// ---------------------------------------------------------------------------
// routeVoiceNoteToSessionAction
//
// Sets session_id on a voice note owned by this academy.
// Requires both the note and the session to belong to the same academy.
// Does not publish the note or notify anyone.
// Revalidates /director/review and the session page on success.
// ---------------------------------------------------------------------------

export async function routeVoiceNoteToSessionAction(
  noteId: string,
  sessionId: string,
): Promise<DonnaReviewQueueActionResult> {
  if (await isPreviewMode()) {
    return { ok: false, status: 'blocked', message: 'Writes are disabled in preview mode.', safetyNotes: [] }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) return ctx.result

  const { supabase, academyId } = ctx
  const rawDb = supabase as any

  // Verify note ownership
  const { data: note } = await rawDb
    .from('voice_notes')
    .select('id, academy_id')
    .eq('id', noteId)
    .eq('academy_id', academyId)
    .single()

  if (!note) {
    return { ok: false, status: 'blocked', message: 'Note not found or not accessible.', safetyNotes: [] }
  }

  // Verify session belongs to this academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()

  if (!session) {
    return { ok: false, status: 'blocked', message: 'Session not found in this academy.', safetyNotes: [] }
  }

  const { error } = await rawDb
    .from('voice_notes')
    .update({ session_id: sessionId })
    .eq('id', noteId)
    .eq('academy_id', academyId)

  if (error) {
    return { ok: false, status: 'error', message: error.message, safetyNotes: [] }
  }

  revalidatePath('/director/review')
  revalidatePath(`/director/sessions/${sessionId}`)

  return {
    ok: true,
    status: 'success',
    message: 'Note linked to session.',
    safetyNotes: [
      'Routing links an internal record only.',
      'The note is not published or visible to parents or players.',
      'No communication was sent.',
    ],
  }
}
