'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import type { StructuredDraftPayload } from '@/app/director/sessions/[sessionId]/structureRecapAction'

export type DraftDecision = 'approved' | 'rejected' | 'clarification_needed'

export interface UpdateDraftDecisionResult {
  ok: boolean
  error: string | null
}

export async function updateStructuredDraftDecisionAction(
  proposedActionId: string,
  decision: DraftDecision,
  reviewNotes?: string
): Promise<UpdateDraftDecisionResult> {
  await assertNotPreviewMode()

  // 1. Auth
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  // 2. Validate input
  if (!proposedActionId) return { ok: false, error: 'Missing proposed action ID.' }
  const allowedDecisions: DraftDecision[] = ['approved', 'rejected', 'clarification_needed']
  if (!allowedDecisions.includes(decision)) return { ok: false, error: 'Invalid decision value.' }
  if (reviewNotes && reviewNotes.length > 1000) {
    return { ok: false, error: 'Review note must be 1000 characters or fewer.' }
  }

  // 3. Resolve academy_id from authenticated profile — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  // 4. Verify active academy membership — director or head_coach only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, error: 'You do not have permission to review structured drafts.' }
  }

  // 5. Fetch proposed_action — verify belongs to this academy and is reviewable
  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return { ok: false, error: 'Proposed action not found.' }
  if (proposedAction.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (proposedAction.target_module !== 'session_recap_structuring') {
    return { ok: false, error: 'This action cannot be reviewed through this interface.' }
  }
  if (proposedAction.status !== 'pending_review') {
    return { ok: false, error: 'This draft has already been reviewed.' }
  }

  // 6. Build update payload — only updates status + reviewer tracking fields
  //    Never touches proposed_payload, player profiles, attendance, or any other table
  const now = new Date().toISOString()
  let updatePayload: Record<string, unknown>

  if (decision === 'approved') {
    updatePayload = {
      status: 'approved',
      approved_by: user.id,
      approved_at: now,
      ...(reviewNotes ? { reviewer_notes: reviewNotes } : {}),
    }
  } else if (decision === 'rejected') {
    updatePayload = {
      status: 'rejected',
      rejected_by: user.id,
      rejected_at: now,
      ...(reviewNotes ? { rejection_reason: reviewNotes, reviewer_notes: reviewNotes } : {}),
    }
  } else {
    // clarification_needed — no approved_by/rejected_by; reviewer_notes carries the context
    updatePayload = {
      status: 'clarification_needed',
      ...(reviewNotes ? { reviewer_notes: reviewNotes } : {}),
    }
  }

  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update(updatePayload)
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  if (updateError) {
    return { ok: false, error: `Failed to record decision: ${updateError.message}` }
  }

  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// Review priority recommendation draft
// Only updates proposed_actions status + reviewer tracking fields.
// Never touches player_priorities, player profiles, or any other table.
// ─────────────────────────────────────────────────────────────

export async function updatePriorityRecommendationDecisionAction(
  proposedActionId: string,
  decision: DraftDecision,
  reviewNotes?: string
): Promise<UpdateDraftDecisionResult> {
  await assertNotPreviewMode()

  // 1. Auth
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  // 2. Validate input
  if (!proposedActionId) return { ok: false, error: 'Missing proposed action ID.' }
  const allowedDecisions: DraftDecision[] = ['approved', 'rejected', 'clarification_needed']
  if (!allowedDecisions.includes(decision)) return { ok: false, error: 'Invalid decision value.' }
  if (reviewNotes && reviewNotes.length > 1000) {
    return { ok: false, error: 'Review note must be 1000 characters or fewer.' }
  }

  // 3. Resolve academy_id from authenticated profile — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  // 4. Verify active academy membership — director or head_coach only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, error: 'You do not have permission to review priority recommendation drafts.' }
  }

  // 5. Fetch proposed_action — verify belongs to this academy, correct module, and reviewable
  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return { ok: false, error: 'Proposed action not found.' }
  if (proposedAction.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (proposedAction.target_module !== 'priority_recommendation') {
    return { ok: false, error: 'This action cannot be reviewed through this interface.' }
  }
  if (proposedAction.status !== 'pending_review') {
    return { ok: false, error: 'This draft has already been reviewed.' }
  }

  // 6. Build update payload — only updates proposed_actions
  //    Never touches player_priorities, player profiles, or any other table
  const now = new Date().toISOString()
  let updatePayload: Record<string, unknown>

  if (decision === 'approved') {
    updatePayload = {
      status: 'approved',
      approved_by: user.id,
      approved_at: now,
      ...(reviewNotes ? { reviewer_notes: reviewNotes } : {}),
    }
  } else if (decision === 'rejected') {
    updatePayload = {
      status: 'rejected',
      rejected_by: user.id,
      rejected_at: now,
      ...(reviewNotes ? { rejection_reason: reviewNotes, reviewer_notes: reviewNotes } : {}),
    }
  } else {
    updatePayload = {
      status: 'clarification_needed',
      ...(reviewNotes ? { reviewer_notes: reviewNotes } : {}),
    }
  }

  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update(updatePayload)
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  if (updateError) {
    return { ok: false, error: `Failed to record decision: ${updateError.message}` }
  }

  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// Apply approved priority recommendation draft
// Creates exactly one player_priorities row from an approved draft.
// Never auto-applies pending drafts, never updates existing priorities,
// never touches player profiles, parent/player views, or communications.
// ─────────────────────────────────────────────────────────────

const VALID_PRIORITY_CATEGORIES = [
  'technical_skill',
  'tactical_skill',
  'physical_fitness',
  'competition_exposure',
  'behavioral',
  'load_management',
  'reassessment',
  'promotion_readiness',
] as const

type PriorityCategory = typeof VALID_PRIORITY_CATEGORIES[number]

export interface ApplyApprovedPriorityRecommendationResult {
  ok: boolean
  error: string | null
  priorityId: string | null
}

export async function applyApprovedPriorityRecommendationAction(
  proposedActionId: string
): Promise<ApplyApprovedPriorityRecommendationResult> {
  const fail = (error: string): ApplyApprovedPriorityRecommendationResult =>
    ({ ok: false, error, priorityId: null })

  await assertNotPreviewMode()

  // 1. Auth
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')
  if (!proposedActionId) return fail('Missing proposed action ID.')

  // 2. Resolve academy_id from authenticated profile — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.')
  const academyId = profile.academy_id

  // 3. Verify active academy membership — director or head_coach only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return fail('You do not have permission to apply priority recommendation drafts.')
  }

  // 4. Fetch proposed_action — verify academy, status, module, and type
  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, target_object_type, target_object_id, proposed_payload, voice_command_id')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return fail('Proposed action not found.')
  if (proposedAction.academy_id !== academyId) return fail('Access denied.')
  if (proposedAction.status !== 'approved') return fail('Only approved drafts can be applied.')
  if (proposedAction.target_module !== 'priority_recommendation') {
    return fail('This action cannot be applied through this interface.')
  }
  if (proposedAction.target_object_type !== 'player') {
    return fail('Target type mismatch — expected player.')
  }

  // 5. Validate payload structure and draft_type
  const payload = proposedAction.proposed_payload as Record<string, unknown>
  if (payload?.draft_type !== 'priority_recommendation_v1') {
    return fail('Unsupported draft type.')
  }

  const rec = payload.recommended_priority as Record<string, unknown> | undefined
  if (!rec) return fail('This recommendation draft is missing required priority details.')

  const title = typeof rec.title === 'string' ? rec.title.trim() : ''
  const description = typeof rec.description === 'string' ? rec.description.trim() : ''
  const category = typeof rec.category === 'string' ? rec.category : ''
  const priorityLevel = typeof rec.priority_level === 'string' ? rec.priority_level : 'medium'
  const urgency = typeof rec.urgency === 'string' ? rec.urgency : 'normal'

  if (!title) return fail('This recommendation draft is missing required priority details.')
  if (title.length > 200) return fail('Priority title is too long (max 200 characters).')
  if (description.length > 1000) return fail('Priority description is too long (max 1000 characters).')

  if (!(VALID_PRIORITY_CATEGORIES as readonly string[]).includes(category)) {
    return fail('Invalid category in recommendation draft.')
  }
  const typedCategory = category as PriorityCategory

  // 6. Verify player belongs to this academy
  const playerId = proposedAction.target_object_id as string | null
  if (!playerId) return fail('Player reference missing from draft.')

  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return fail('Player not found or access denied.')

  // 7. Fetch active priorities: duplicate check + rank computation
  const { data: existingPriorities } = await rawDb
    .from('player_priorities')
    .select('id, title, priority_rank')
    .eq('academy_id', academyId)
    .eq('player_id', playerId)
    .eq('is_active', true)

  const existing = (existingPriorities ?? []) as Array<{ id: string; title: string; priority_rank: number }>

  // Normalize title and check for exact duplicate
  const normalizedNew = title.toLowerCase().trim()
  const duplicate = existing.find(p => p.title.toLowerCase().trim() === normalizedNew)
  if (duplicate) {
    return fail(
      'An active priority with a similar title already exists for this player. No duplicate was created.'
    )
  }

  // Compute new priority_rank: max existing + 1
  const maxRank = existing.length > 0
    ? Math.max(...existing.map(p => p.priority_rank ?? 0))
    : 0
  const newRank = maxRank + 1

  // 8. Insert exactly one player_priorities row — the only write to player_priorities in this action
  const { data: createdPriority, error: insertError } = await rawDb
    .from('player_priorities')
    .insert({
      academy_id: academyId,
      player_id: playerId,
      title,
      description: description || null,
      category: typedCategory,
      is_active: true,
      priority_level: priorityLevel,
      urgency,
      priority_rank: newRank,
      status: 'active',
      confidence_score: 0.75,
      source_signal_ids: [],
    })
    .select('id')
    .single()

  if (insertError || !createdPriority) {
    return fail(`Failed to create priority: ${insertError?.message ?? 'unknown error'}`)
  }

  const priorityId = createdPriority.id as string

  // 9. Write audit log — records provenance since player_priorities has no source fields
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'priority_recommendation.priority.applied',
      target_type: 'player_priority',
      target_id: priorityId,
      payload: {
        proposed_action_id: proposedActionId,
        player_id: playerId,
        priority_title: title,
        category: typedCategory,
        priority_level: priorityLevel,
        urgency,
        priority_rank: newRank,
        source: 'priority_recommendation_draft',
        applied_by: user.id,
      },
      source_type: 'ui',
      voice_command_id: proposedAction.voice_command_id ?? null,
    })

  // 10. Mark proposed_action as executed only after successful insert
  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'executed' })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  if (updateError) {
    return {
      ok: false,
      error: `Priority created but failed to mark draft as executed: ${updateError.message}`,
      priorityId,
    }
  }

  return { ok: true, error: null, priorityId }
}

// ─────────────────────────────────────────────────────────────
// Apply approved structured draft
// Only creates coach_observations from player_observation_drafts.
// Does NOT touch attendance, parent messages, player priorities,
// player profiles, or any table other than coach_observations,
// audit_logs, and proposed_actions.status.
// ─────────────────────────────────────────────────────────────

export interface ApplyApprovedDraftResult {
  ok: boolean
  error: string | null
  observationsCreated: number
  skippedCount: number
}

export async function applyApprovedStructuredDraftAction(
  proposedActionId: string
): Promise<ApplyApprovedDraftResult> {
  const empty = (error: string): ApplyApprovedDraftResult =>
    ({ ok: false, error, observationsCreated: 0, skippedCount: 0 })

  await assertNotPreviewMode()

  // 1. Auth
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return empty('Not authenticated.')
  if (!proposedActionId) return empty('Missing proposed action ID.')

  // 2. Resolve academy_id from authenticated profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return empty('Academy context unavailable.')
  const academyId = profile.academy_id

  // 3. Verify active academy membership — director or head_coach only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return empty('You do not have permission to apply structured drafts.')
  }

  // 4. Fetch proposed_action — verify academy, status, and module
  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, target_object_id, proposed_payload, voice_command_id')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return empty('Proposed action not found.')
  if (proposedAction.academy_id !== academyId) return empty('Access denied.')
  if (proposedAction.target_module !== 'session_recap_structuring') {
    return empty('This action cannot be applied through this interface.')
  }
  if (proposedAction.status !== 'approved') {
    return empty('Only approved drafts can be applied.')
  }

  // 5. Verify draft_type
  const payload = proposedAction.proposed_payload as StructuredDraftPayload
  if (payload?.draft_type !== 'session_recap_structuring_v1') {
    return empty('Unsupported draft type.')
  }

  // 6. Fetch session — verify academy and get coach_id (required for coach_observations)
  const sessionId = proposedAction.target_object_id as string | null
  if (!sessionId) return empty('Session reference missing from draft.')

  const { data: session } = await supabase
    .from('sessions')
    .select('id, coach_id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return empty('Session not found or access denied.')
  const coachId = session.coach_id

  // 7. Build name → player_id map from detected_players (first occurrence wins)
  const playerIdByName = new Map<string, string>()
  for (const dp of payload.detected_players) {
    if (dp.player_id && dp.name && !playerIdByName.has(dp.name)) {
      playerIdByName.set(dp.name, dp.player_id)
    }
  }

  // 8. Match observations to confirmed player_ids; skip unmatched or empty sentinel
  type PendingObs = { player_name: string; player_id: string; observation: string; possible_focus: string[] }
  const toInsert: PendingObs[] = []
  let skippedCount = 0

  for (const obs of payload.player_observation_drafts) {
    const playerId = playerIdByName.get(obs.player_name)
    if (!playerId) { skippedCount++; continue }
    if (!obs.observation || obs.observation.trim() === 'No specific observations extracted.') {
      skippedCount++; continue
    }
    toInsert.push({ player_name: obs.player_name, player_id: playerId, observation: obs.observation, possible_focus: obs.possible_focus })
  }

  if (toInsert.length === 0) {
    return {
      ok: false,
      error: 'No qualifying observations to apply. All were missing confirmed player IDs or had no content.',
      observationsCreated: 0,
      skippedCount,
    }
  }

  // 9. Batch verify all matched player_ids belong to this academy (defense-in-depth)
  const uniquePlayerIds = Array.from(new Set(toInsert.map(o => o.player_id)))
  const { data: verifiedPlayers } = await supabase
    .from('players')
    .select('id')
    .in('id', uniquePlayerIds)
    .eq('academy_id', academyId)
  const verifiedSet = new Set((verifiedPlayers ?? []).map(p => p.id))

  const finalInserts = toInsert.filter(o => verifiedSet.has(o.player_id))
  skippedCount += toInsert.length - finalInserts.length

  if (finalInserts.length === 0) {
    return {
      ok: false,
      error: 'No observations could be applied — detected players could not be verified as members of this academy.',
      observationsCreated: 0,
      skippedCount,
    }
  }

  // 10. Sequential inserts into coach_observations — never attendance, profiles, priorities, or parent messages
  const createdIds: string[] = []
  for (const obs of finalInserts) {
    const { data: created, error: insertError } = await supabase
      .from('coach_observations')
      .insert({
        academy_id: academyId,
        player_id: obs.player_id,
        coach_id: coachId,
        session_id: sessionId,
        content: obs.observation,
        observation_type: 'general',
        is_private: true,
        tags: obs.possible_focus.length > 0 ? obs.possible_focus : null,
        voice_command_id: proposedAction.voice_command_id ?? null,
        ai_entities: {
          source: 'session_recap_draft',
          proposed_action_id: proposedActionId,
          requires_review: true,
        },
      })
      .select('id')
      .single()

    if (insertError || !created) {
      return {
        ok: false,
        error: `Observation insert failed for "${obs.player_name}": ${insertError?.message ?? 'unknown'}. Draft NOT marked as executed. ${createdIds.length > 0 ? `${createdIds.length} prior observation(s) were inserted and will need manual cleanup.` : ''}`,
        observationsCreated: 0,
        skippedCount,
      }
    }
    createdIds.push(created.id)
  }

  // 11. Write audit log — action_execution_logs has no INSERT RLS policy so we use audit_logs
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'session_recap.observations.applied',
      target_type: 'session_recap_structuring',
      target_id: sessionId,
      payload: {
        proposed_action_id: proposedActionId,
        observations_created: createdIds.length,
        skipped_count: skippedCount,
        observation_ids: createdIds,
      },
      source_type: 'ui',
      voice_command_id: proposedAction.voice_command_id ?? null,
    })

  // 12. Mark proposed_action as executed only after all observations were successfully created
  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'executed' })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  if (updateError) {
    return {
      ok: false,
      error: `Observations created but failed to mark draft as executed: ${updateError.message}`,
      observationsCreated: createdIds.length,
      skippedCount,
    }
  }

  return { ok: true, error: null, observationsCreated: createdIds.length, skippedCount }
}
