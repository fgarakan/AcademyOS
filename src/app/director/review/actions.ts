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
// Review session wrap-up draft (session_wrap_up_v1)
// Only updates proposed_actions status + reviewer tracking fields.
// Never writes to sessions, session_blocks, attendance, or any other table.
// Apply action (Sprint 19) is the only path to write official session actuals.
// ─────────────────────────────────────────────────────────────

export async function updateWrapUpDraftDecisionAction(
  proposedActionId: string,
  decision: DraftDecision,
  reviewNotes?: string
): Promise<UpdateDraftDecisionResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  if (!proposedActionId) return { ok: false, error: 'Missing proposed action ID.' }
  const allowedDecisions: DraftDecision[] = ['approved', 'rejected', 'clarification_needed']
  if (!allowedDecisions.includes(decision)) return { ok: false, error: 'Invalid decision value.' }
  if (reviewNotes && reviewNotes.length > 1000) {
    return { ok: false, error: 'Review note must be 1000 characters or fewer.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
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
    return { ok: false, error: 'You do not have permission to review session wrap-up drafts.' }
  }

  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return { ok: false, error: 'Proposed action not found.' }
  if (proposedAction.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (proposedAction.target_module !== 'session_wrap_up_v1') {
    return { ok: false, error: 'This action cannot be reviewed through this interface.' }
  }
  if (proposedAction.status !== 'pending_review') {
    return { ok: false, error: 'This draft has already been reviewed.' }
  }

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
// Review evidence requirement link draft
// Only updates proposed_actions status + reviewer tracking fields.
// Never touches requirement_evidence_links, player_requirement_progress,
// coach_observations, player profiles, or any other table.
// ─────────────────────────────────────────────────────────────

export interface UpdateEvidenceRequirementDraftDecisionResult {
  ok: boolean
  error: string | null
}

export async function updateEvidenceRequirementDraftDecisionAction(
  proposedActionId: string,
  decision: DraftDecision,
  reviewNotes?: string
): Promise<UpdateEvidenceRequirementDraftDecisionResult> {
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
    return { ok: false, error: 'You do not have permission to review evidence link drafts.' }
  }

  // 5. Fetch proposed_action — verify belongs to this academy and is reviewable
  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, target_object_type, proposed_payload')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return { ok: false, error: 'Proposed action not found.' }
  if (proposedAction.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (proposedAction.target_module !== 'requirement_evidence_link') {
    return { ok: false, error: 'This action cannot be reviewed through this interface.' }
  }
  if (proposedAction.target_object_type !== 'player') {
    return { ok: false, error: 'Target type mismatch — expected player.' }
  }
  const payloadCheck = proposedAction.proposed_payload as Record<string, unknown>
  if (payloadCheck?.draft_type !== 'requirement_evidence_link_v1') {
    return { ok: false, error: 'Unsupported draft type.' }
  }
  if (proposedAction.status !== 'pending_review') {
    return { ok: false, error: 'This draft has already been reviewed.' }
  }

  // 6. Build update payload — only updates status + reviewer tracking fields
  //    Never touches requirement_evidence_links, player_requirement_progress,
  //    coach_observations, player profiles, or any other table
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
// Apply approved evidence requirement link draft
// Inserts official requirement_evidence_links rows.
// Updates player_requirement_progress evidence_count + last_evidence_at only.
// Never marks requirements met, changes player level, or touches parent/player views.
// ─────────────────────────────────────────────────────────────

export interface ApplyApprovedEvidenceRequirementDraftResult {
  ok: boolean
  error: string | null
  evidenceLinksCreated: number
  skippedDuplicates: number
}

export async function applyApprovedEvidenceRequirementDraftAction(
  proposedActionId: string
): Promise<ApplyApprovedEvidenceRequirementDraftResult> {
  const fail = (error: string): ApplyApprovedEvidenceRequirementDraftResult =>
    ({ ok: false, error, evidenceLinksCreated: 0, skippedDuplicates: 0 })

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
    return fail('You do not have permission to apply evidence link drafts.')
  }

  // 4. Fetch proposed_action — verify academy, status, module, type, and draft_type
  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, target_object_type, target_object_id, proposed_payload, voice_command_id')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return fail('Proposed action not found.')
  if (proposedAction.academy_id !== academyId) return fail('Access denied.')
  if (proposedAction.status !== 'approved') {
    return fail('Only approved evidence link drafts can be applied.')
  }
  if (proposedAction.target_module !== 'requirement_evidence_link') {
    return fail('This action cannot be applied through this interface.')
  }
  if (proposedAction.target_object_type !== 'player') {
    return fail('Target type mismatch — expected player.')
  }

  // 5. Validate payload structure and draft_type
  const payload = proposedAction.proposed_payload as Record<string, unknown>
  if (payload?.draft_type !== 'requirement_evidence_link_v1') {
    return fail('Unsupported draft type.')
  }

  const rawLinks = payload.links
  if (!Array.isArray(rawLinks) || rawLinks.length === 0) {
    return fail('This draft does not contain valid evidence links.')
  }

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

  // 7. Validate and normalize each link — reject structurally invalid entries
  type RawLink = Record<string, unknown>
  type ValidatedLink = {
    coach_observation_id: string
    requirement_progress_id: string
    requirement_id: string
    evidence_summary: string
    confidence: number | null
    weight: number | null
  }

  const validatedLinks: ValidatedLink[] = []
  for (const raw of rawLinks as RawLink[]) {
    if (typeof raw.coach_observation_id !== 'string' || !raw.coach_observation_id) continue
    if (typeof raw.requirement_progress_id !== 'string' || !raw.requirement_progress_id) continue
    if (typeof raw.requirement_id !== 'string' || !raw.requirement_id) continue
    if (raw.evidence_type !== 'coach_observation') continue

    const confidence = typeof raw.confidence === 'number' ? raw.confidence : null
    if (confidence !== null && (confidence < 0 || confidence > 1)) continue

    const weight = typeof raw.weight === 'number' ? raw.weight : null

    validatedLinks.push({
      coach_observation_id: raw.coach_observation_id as string,
      requirement_progress_id: raw.requirement_progress_id as string,
      requirement_id: raw.requirement_id as string,
      evidence_summary: typeof raw.evidence_summary === 'string' ? raw.evidence_summary : '',
      confidence,
      weight,
    })
  }

  if (validatedLinks.length === 0) {
    return fail('This draft does not contain valid evidence links.')
  }

  // 8. Verify coach_observations belong to this academy + player
  const obsIds = Array.from(new Set(validatedLinks.map(l => l.coach_observation_id)))
  const { data: verifiedObs } = await rawDb
    .from('coach_observations')
    .select('id')
    .in('id', obsIds)
    .eq('academy_id', academyId)
    .eq('player_id', playerId)

  const verifiedObsSet = new Set(
    ((verifiedObs ?? []) as Array<{ id: string }>).map(o => o.id)
  )

  // 9. Verify player_requirement_progress rows belong to this academy + player
  //    and build a map of progress_id → requirement_id for cross-validation
  const progressIds = Array.from(new Set(validatedLinks.map(l => l.requirement_progress_id)))
  const { data: verifiedProgress } = await rawDb
    .from('player_requirement_progress')
    .select('id, requirement_id')
    .in('id', progressIds)
    .eq('academy_id', academyId)
    .eq('player_id', playerId)

  const progressRequirementMap = new Map<string, string>()
  for (const p of (verifiedProgress ?? []) as Array<{ id: string; requirement_id: string }>) {
    progressRequirementMap.set(p.id, p.requirement_id)
  }

  // Filter to links that pass all three verifications:
  // — coach_observation belongs to academy + player
  // — player_requirement_progress belongs to academy + player
  // — requirement_id in the link matches the progress row's requirement_id
  const crossVerifiedLinks = validatedLinks.filter(l => {
    if (!verifiedObsSet.has(l.coach_observation_id)) return false
    const progressReqId = progressRequirementMap.get(l.requirement_progress_id)
    if (!progressReqId) return false
    return progressReqId === l.requirement_id
  })

  if (crossVerifiedLinks.length === 0) {
    return fail('No valid evidence links could be verified. Check player and observation data.')
  }

  // 10. Application-level duplicate check — no unique constraint on requirement_evidence_links
  //     Deduplicates on (academy_id, player_id, requirement_id, evidence_type, evidence_id)
  const { data: existingLinks } = await rawDb
    .from('requirement_evidence_links')
    .select('evidence_id, requirement_id')
    .eq('academy_id', academyId)
    .eq('player_id', playerId)
    .eq('evidence_type', 'coach_observation')
    .in('evidence_id', obsIds)

  const existingPairs = new Set<string>()
  for (const el of (existingLinks ?? []) as Array<{ evidence_id: string; requirement_id: string }>) {
    existingPairs.add(`${el.requirement_id}:${el.evidence_id}`)
  }

  const toInsert = crossVerifiedLinks.filter(
    l => !existingPairs.has(`${l.requirement_id}:${l.coach_observation_id}`)
  )
  const skippedDuplicates = crossVerifiedLinks.length - toInsert.length

  if (toInsert.length === 0) {
    return fail('All proposed evidence links already exist. No duplicates were created.')
  }

  // 11. Insert official requirement_evidence_links rows
  //     is_parent_safe = false for V1 — never exposed to parent/player portals
  const insertRows = toInsert.map(l => ({
    academy_id: academyId,
    player_id: playerId,
    requirement_id: l.requirement_id,
    player_requirement_progress_id: l.requirement_progress_id,
    evidence_type: 'coach_observation',
    evidence_id: l.coach_observation_id,
    evidence_summary: l.evidence_summary || null,
    confidence: l.confidence,
    weight: l.weight,
    created_by: user.id,
    is_parent_safe: false,
  }))

  const { data: insertedLinks, error: insertError } = await rawDb
    .from('requirement_evidence_links')
    .insert(insertRows)
    .select('id, player_requirement_progress_id, created_at')

  if (insertError) {
    return fail(`Failed to create evidence links: ${insertError.message}`)
  }

  type InsertedLink = { id: string; player_requirement_progress_id: string | null; created_at: string }
  const inserted = (insertedLinks ?? []) as InsertedLink[]
  const evidenceLinksCreated = inserted.length

  // 12. Update player_requirement_progress: evidence_count + last_evidence_at
  //     Recalculate from actual table count (idempotent — safe to retry)
  //     DO NOT update status — requirement confirmation is a separate workflow
  const affectedProgressIds = Array.from(
    new Set(
      inserted
        .map(l => l.player_requirement_progress_id)
        .filter((id): id is string => id !== null)
    )
  )

  for (const progressId of affectedProgressIds) {
    const { data: countRows } = await rawDb
      .from('requirement_evidence_links')
      .select('id, created_at')
      .eq('player_requirement_progress_id', progressId)
      .eq('academy_id', academyId)

    const rows = (countRows ?? []) as Array<{ id: string; created_at: string }>
    if (rows.length === 0) continue

    const actualCount = rows.length
    const lastAt = rows.reduce(
      (max, r) => (r.created_at > max ? r.created_at : max),
      rows[0].created_at
    )

    await rawDb
      .from('player_requirement_progress')
      .update({ evidence_count: actualCount, last_evidence_at: lastAt })
      .eq('id', progressId)
      .eq('academy_id', academyId)
  }

  // 13. Write audit log — action_execution_logs has no INSERT RLS, so use audit_logs
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'requirement_evidence_link.applied',
      target_type: 'requirement_evidence_link',
      target_id: playerId,
      payload: {
        proposed_action_id: proposedActionId,
        player_id: playerId,
        evidence_links_created: evidenceLinksCreated,
        skipped_duplicates: skippedDuplicates,
        progress_rows_updated: affectedProgressIds.length,
        source: 'evidence_requirement_link_draft_v1',
        applied_by: user.id,
      },
      source_type: 'ui',
      voice_command_id: proposedAction.voice_command_id ?? null,
    })

  // 14. Mark proposed_action as executed only after all writes succeed
  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'executed' })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  if (updateError) {
    return {
      ok: false,
      error: `Evidence links created but failed to mark draft as executed: ${updateError.message}`,
      evidenceLinksCreated,
      skippedDuplicates,
    }
  }

  return { ok: true, error: null, evidenceLinksCreated, skippedDuplicates }
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

// ─────────────────────────────────────────────────────────────
// Review attendance exception draft
// Only updates proposed_actions status + reviewer tracking fields.
// Never touches session_attendance, player profiles, billing, or parent comms.
// ─────────────────────────────────────────────────────────────

export interface UpdateAttendanceExceptionDecisionResult {
  ok: boolean
  error: string | null
}

export async function updateAttendanceExceptionDraftDecisionAction(
  proposedActionId: string,
  decision: DraftDecision,
  reviewNotes?: string,
): Promise<UpdateAttendanceExceptionDecisionResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  if (!proposedActionId) return { ok: false, error: 'Missing proposed action ID.' }
  const allowed: DraftDecision[] = ['approved', 'rejected', 'clarification_needed']
  if (!allowed.includes(decision)) return { ok: false, error: 'Invalid decision value.' }
  if (reviewNotes && reviewNotes.length > 1000) {
    return { ok: false, error: 'Review note must be 1000 characters or fewer.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
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
    return { ok: false, error: 'You do not have permission to review attendance exception drafts.' }
  }

  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, proposed_payload')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return { ok: false, error: 'Proposed action not found.' }
  if (proposedAction.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (proposedAction.target_module !== 'attendance_exception') {
    return { ok: false, error: 'This action cannot be reviewed through this interface.' }
  }
  const payloadCheck = proposedAction.proposed_payload as Record<string, unknown>
  if (payloadCheck?.draft_type !== 'attendance_exception_v1') {
    return { ok: false, error: 'Unsupported draft type.' }
  }
  if (proposedAction.status !== 'pending_review') {
    return { ok: false, error: 'This draft has already been reviewed.' }
  }

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
// Apply approved attendance exception draft
// Writes rostered player attendance to session_attendance.
// Skips proposed_status='unknown' rows.
// Never creates player profiles, adds roster members, changes billing,
// or sends parent/player communications.
// Unrostered attendees are never applied — they remain in the draft only.
// ─────────────────────────────────────────────────────────────

export interface ApplyApprovedAttendanceExceptionResult {
  ok: boolean
  error: string | null
  attendanceRowsUpserted: number
  skippedUnknown: number
}

export async function applyApprovedAttendanceExceptionAction(
  proposedActionId: string,
): Promise<ApplyApprovedAttendanceExceptionResult> {
  const fail = (error: string): ApplyApprovedAttendanceExceptionResult =>
    ({ ok: false, error, attendanceRowsUpserted: 0, skippedUnknown: 0 })

  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')
  if (!proposedActionId) return fail('Missing proposed action ID.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.')
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
    return fail('You do not have permission to apply attendance exception drafts.')
  }

  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, target_object_id, proposed_payload, voice_command_id')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return fail('Proposed action not found.')
  if (proposedAction.academy_id !== academyId) return fail('Access denied.')
  if (proposedAction.status !== 'approved') return fail('Only approved drafts can be applied.')
  if (proposedAction.target_module !== 'attendance_exception') {
    return fail('This action cannot be applied through this interface.')
  }

  const payload = proposedAction.proposed_payload as Record<string, unknown>
  if (payload?.draft_type !== 'attendance_exception_v1') {
    return fail('Unsupported draft type.')
  }

  const sessionId = proposedAction.target_object_id as string | null
  if (!sessionId) return fail('Session reference missing from draft.')

  // Verify session belongs to this academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return fail('Session not found or access denied.')

  type RosteredRow = {
    player_id: string
    player_name: string
    proposed_status: 'present' | 'absent' | 'unknown'
  }

  const rosteredAttendance = (payload.rostered_attendance ?? []) as RosteredRow[]
  const toApply = rosteredAttendance.filter(r => r.proposed_status !== 'unknown')
  const skippedUnknown = rosteredAttendance.length - toApply.length

  if (toApply.length === 0) {
    return fail('No attendance rows to apply — all players have unknown status. Review the draft and try again.')
  }

  // Batch-verify player IDs belong to this academy
  const playerIds = toApply.map(r => r.player_id)
  const { data: verifiedPlayers } = await supabase
    .from('players')
    .select('id')
    .in('id', playerIds)
    .eq('academy_id', academyId)
  const verifiedSet = new Set(((verifiedPlayers ?? []) as Array<{ id: string }>).map(p => p.id))

  const verifiedRows = toApply.filter(r => verifiedSet.has(r.player_id))
  if (verifiedRows.length === 0) {
    return fail('No players in the draft could be verified as members of this academy.')
  }

  // Upsert session_attendance rows
  // status field is a plain string — matches the existing schema
  let attendanceRowsUpserted = 0
  for (const row of verifiedRows) {
    const { error: upsertError } = await rawDb
      .from('session_attendance')
      .upsert(
        {
          session_id: sessionId,
          player_id: row.player_id,
          status: row.proposed_status,
          marked_by: user.id,
          marked_at: new Date().toISOString(),
          notes: `Applied from attendance exception draft ${proposedActionId}`,
        },
        { onConflict: 'session_id,player_id' },
      )
    if (!upsertError) attendanceRowsUpserted++
  }

  // Write audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'attendance_exception.attendance.applied',
      target_type: 'session_attendance',
      target_id: sessionId,
      payload: {
        proposed_action_id: proposedActionId,
        session_id: sessionId,
        attendance_rows_upserted: attendanceRowsUpserted,
        skipped_unknown: skippedUnknown,
        applied_by: user.id,
        source: 'attendance_exception_draft_v1',
      },
      source_type: 'ui',
      voice_command_id: proposedAction.voice_command_id ?? null,
    })

  // Mark proposed_action executed
  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'executed' })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  if (updateError) {
    return {
      ok: false,
      error: `Attendance applied but failed to mark draft as executed: ${updateError.message}`,
      attendanceRowsUpserted,
      skippedUnknown,
    }
  }

  return { ok: true, error: null, attendanceRowsUpserted, skippedUnknown }
}

// ─────────────────────────────────────────────────────────────
// Review curriculum override draft
// Only updates proposed_actions status + reviewer tracking fields.
// Never touches curriculum tables, academy_curriculum_overrides,
// or any other table.
// ─────────────────────────────────────────────────────────────

export interface UpdateCurriculumOverrideDraftDecisionResult {
  ok: boolean
  error: string | null
}

export async function updateCurriculumOverrideDraftDecisionAction(
  proposedActionId: string,
  decision: DraftDecision,
  reviewNotes?: string,
): Promise<UpdateCurriculumOverrideDraftDecisionResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  if (!proposedActionId) return { ok: false, error: 'Missing proposed action ID.' }
  const allowed: DraftDecision[] = ['approved', 'rejected', 'clarification_needed']
  if (!allowed.includes(decision)) return { ok: false, error: 'Invalid decision value.' }
  if (reviewNotes && reviewNotes.length > 1000) {
    return { ok: false, error: 'Review note must be 1000 characters or fewer.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
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
    return { ok: false, error: 'You do not have permission to review curriculum override drafts.' }
  }

  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, proposed_payload')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return { ok: false, error: 'Proposed action not found.' }
  if (proposedAction.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (proposedAction.target_module !== 'curriculum_override') {
    return { ok: false, error: 'This action cannot be reviewed through this interface.' }
  }
  const payloadCheck = proposedAction.proposed_payload as Record<string, unknown>
  if (payloadCheck?.draft_type !== 'curriculum_override_v1') {
    return { ok: false, error: 'Unsupported draft type.' }
  }
  if (proposedAction.status !== 'pending_review') {
    return { ok: false, error: 'This draft has already been reviewed.' }
  }

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
// Review voice intake draft
// Only updates proposed_actions status + reviewer tracking fields.
// No execute step for voice_intake in V1 — approving records director's
// review decision. Downstream execution is handled by future sprints.
// ─────────────────────────────────────────────────────────────

export interface UpdateVoiceIntakeDraftDecisionResult {
  ok: boolean
  error: string | null
}

export async function updateVoiceIntakeDraftDecisionAction(
  proposedActionId: string,
  decision: DraftDecision,
  reviewNotes?: string,
): Promise<UpdateVoiceIntakeDraftDecisionResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  if (!proposedActionId) return { ok: false, error: 'Missing proposed action ID.' }
  const allowed: DraftDecision[] = ['approved', 'rejected', 'clarification_needed']
  if (!allowed.includes(decision)) return { ok: false, error: 'Invalid decision value.' }
  if (reviewNotes && reviewNotes.length > 1000) {
    return { ok: false, error: 'Review note must be 1000 characters or fewer.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
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
    return { ok: false, error: 'You do not have permission to review voice intake drafts.' }
  }

  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, proposed_payload')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return { ok: false, error: 'Proposed action not found.' }
  if (proposedAction.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (proposedAction.target_module !== 'voice_intake') {
    return { ok: false, error: 'This action cannot be reviewed through this interface.' }
  }
  const payloadCheck = proposedAction.proposed_payload as Record<string, unknown>
  if (payloadCheck?.draft_type !== 'voice_intake_v1') {
    return { ok: false, error: 'Unsupported draft type.' }
  }
  if (proposedAction.status !== 'pending_review') {
    return { ok: false, error: 'This draft has already been reviewed.' }
  }

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
// Apply approved curriculum override draft
// Creates exactly one academy_curriculum_overrides row from an
// approved curriculum_override_v1 proposed_action.
// Never edits global curriculum tables, player profiles,
// templates, or parent/player views.
// ─────────────────────────────────────────────────────────────

export interface ApplyApprovedCurriculumOverrideDraftResult {
  ok: boolean
  error: string | null
  overrideId: string | null
}

export async function applyApprovedCurriculumOverrideDraftAction(
  proposedActionId: string,
): Promise<ApplyApprovedCurriculumOverrideDraftResult> {
  const fail = (error: string): ApplyApprovedCurriculumOverrideDraftResult =>
    ({ ok: false, error, overrideId: null })

  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')
  if (!proposedActionId) return fail('Missing proposed action ID.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.')
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
    return fail('You do not have permission to apply curriculum override drafts.')
  }

  const rawDb = supabase as any

  // Fetch and validate proposed_action
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, target_object_type, target_object_id, proposed_payload, approved_by, approved_at, voice_command_id')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return fail('Proposed action not found.')
  if (proposedAction.academy_id !== academyId) return fail('Access denied.')
  if (proposedAction.status !== 'approved') return fail('Only approved drafts can be applied.')
  if (proposedAction.target_module !== 'curriculum_override') {
    return fail('This action cannot be applied through this interface.')
  }
  if (proposedAction.target_object_type !== 'academy_curriculum_version') {
    return fail('Target type mismatch — expected academy_curriculum_version.')
  }

  const payload = proposedAction.proposed_payload as Record<string, unknown>
  if (payload?.draft_type !== 'curriculum_override_v1') {
    return fail('Unsupported draft type.')
  }

  // Verify the academy curriculum version exists and belongs to this academy
  const curriculumVersionId = proposedAction.target_object_id as string | null
  if (!curriculumVersionId) return fail('Curriculum version reference missing from draft.')

  const { data: version } = await rawDb
    .from('academy_curriculum_versions')
    .select('id, status')
    .eq('id', curriculumVersionId)
    .eq('academy_id', academyId)
    .single()

  if (!version) return fail('Academy curriculum version not found or access denied.')

  // Extract parsed fields from payload
  const parsedLevel = typeof payload.parsed_level === 'string' ? payload.parsed_level : null
  const parsedPathway = typeof payload.parsed_pathway === 'string' ? payload.parsed_pathway : null
  const parsedFocus = Array.isArray(payload.parsed_focus) ? payload.parsed_focus : []
  const parsedScope = typeof payload.parsed_scope === 'string' ? payload.parsed_scope : 'academy'
  const rawInput = typeof payload.raw_input === 'string' ? payload.raw_input : null
  const proposedChangeSummary = typeof payload.proposed_change_summary === 'string' ? payload.proposed_change_summary : ''

  // Determine override_type: emphasis_shift for content focus changes
  const overrideType = parsedFocus.length > 0 ? 'emphasis_shift' : 'update'

  // Determine scope value — validate against allowed values
  const allowedScopes = ['academy', 'level', 'group', 'program', 'session'] as const
  type ScopeType = typeof allowedScopes[number]
  const safeScope: ScopeType = (allowedScopes as readonly string[]).includes(parsedScope ?? '')
    ? (parsedScope as ScopeType)
    : 'academy'

  // Validate pathway value
  const allowedPathways = ['skill', 'competition', 'fitness', 'mixed'] as const
  type PathwayType = typeof allowedPathways[number]
  const safePathway: PathwayType | null = parsedPathway && (allowedPathways as readonly string[]).includes(parsedPathway)
    ? (parsedPathway as PathwayType)
    : null

  // Build proposed_change JSONB
  const proposedChange = {
    parsed_level: parsedLevel,
    parsed_focus: parsedFocus,
    parsed_scope: parsedScope,
    summary: proposedChangeSummary,
    source_draft_id: proposedActionId,
  }

  const now = new Date().toISOString()

  // Insert academy_curriculum_overrides row
  const { data: created, error: insertError } = await rawDb
    .from('academy_curriculum_overrides')
    .insert({
      academy_id: academyId,
      curriculum_version_id: curriculumVersionId,
      target_type: 'level',
      target_id: null,
      override_type: overrideType,
      scope: safeScope,
      pathway: safePathway,
      original_snapshot: null,
      proposed_change: proposedChange,
      applied_change: proposedChange,
      override_reason: proposedChangeSummary,
      source: 'voice',
      raw_input: rawInput,
      status: 'applied',
      created_by: user.id,
      approved_by: proposedAction.approved_by ?? user.id,
      approved_at: proposedAction.approved_at ?? now,
      applied_by: user.id,
      applied_at: now,
    })
    .select('id')
    .single()

  if (insertError || !created) {
    return fail(`Failed to create override record: ${insertError?.message ?? 'unknown error'}`)
  }

  const overrideId = created.id as string

  // Write audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'curriculum_override.applied',
      target_type: 'academy_curriculum_override',
      target_id: overrideId,
      payload: {
        proposed_action_id: proposedActionId,
        curriculum_version_id: curriculumVersionId,
        override_id: overrideId,
        override_type: overrideType,
        scope: safeScope,
        parsed_level: parsedLevel,
        parsed_focus: parsedFocus,
        applied_by: user.id,
        source: 'curriculum_override_draft_v1',
      },
      source_type: 'ui',
      voice_command_id: proposedAction.voice_command_id ?? null,
    })

  // Mark proposed_action as executed
  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'executed' })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  if (updateError) {
    return {
      ok: false,
      error: `Override created but failed to mark draft as executed: ${updateError.message}`,
      overrideId,
    }
  }

  return { ok: true, error: null, overrideId }
}
