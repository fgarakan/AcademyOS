'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import type { StructuredDraftPayload } from '@/app/director/sessions/[sessionId]/structureRecapAction'
import { upsertPlayerDevelopmentSummary } from '@/lib/backend/notes'
import type { DevelopmentSummaryDraftPayload } from '@/app/director/players/[playerId]/draftSummaryUpdateAction'

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
// For rostered attendance: writes to session_attendance (skips unknown).
// For unrostered attendees: creates a placement_review proposed_action per
// attendee (pending_review, risk_level: medium). No player created, no
// roster change, no billing, no parent/player communication.
// All downstream changes require a separate director decision.
// ─────────────────────────────────────────────────────────────

export interface ApplyApprovedAttendanceExceptionResult {
  ok: boolean
  error: string | null
  attendanceRowsUpserted: number
  skippedUnknown: number
  unrosteredFollowUpsCreated: number
}

export async function applyApprovedAttendanceExceptionAction(
  proposedActionId: string,
): Promise<ApplyApprovedAttendanceExceptionResult> {
  const fail = (error: string): ApplyApprovedAttendanceExceptionResult =>
    ({ ok: false, error, attendanceRowsUpserted: 0, skippedUnknown: 0, unrosteredFollowUpsCreated: 0 })

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
  type UnrosteredRow = { name: string; reason: string }

  const rosteredAttendance = (payload.rostered_attendance ?? []) as RosteredRow[]
  const unrosteredAttendees = (payload.unrostered_attendees ?? []) as UnrosteredRow[]

  // Require at least one thing to process
  if (rosteredAttendance.length === 0 && unrosteredAttendees.length === 0) {
    return fail('Nothing to apply — no rostered attendance rows and no unrostered attendees in this draft.')
  }

  const toApply = rosteredAttendance.filter(r => r.proposed_status !== 'unknown')
  const skippedUnknown = rosteredAttendance.length - toApply.length

  // Apply rostered attendance rows (if any)
  let attendanceRowsUpserted = 0
  if (toApply.length > 0) {
    const playerIds = toApply.map(r => r.player_id)
    const { data: verifiedPlayers } = await supabase
      .from('players')
      .select('id')
      .in('id', playerIds)
      .eq('academy_id', academyId)
    const verifiedSet = new Set(((verifiedPlayers ?? []) as Array<{ id: string }>).map(p => p.id))
    const verifiedRows = toApply.filter(r => verifiedSet.has(r.player_id))

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
  }

  // Create placement review follow-ups for unrostered attendees.
  // Each creates a voice_commands row (required FK) + proposed_actions row (pending_review).
  // No player profile, roster entry, billing, or parent communication is created.
  let unrosteredFollowUpsCreated = 0
  const issuerRole: 'academy_director' | 'head_coach' = role === 'academy_director' ? 'academy_director' : 'head_coach'

  for (const attendee of unrosteredAttendees) {
    const name = attendee.name?.trim()
    if (!name) continue

    const { data: vcRow } = await supabase
      .from('voice_commands')
      .insert({
        academy_id: academyId,
        issuer_id: user.id,
        issuer_role: issuerRole as any,
        input_method: 'typed' as any,
        raw_input: `Placement review: ${name}`,
        transcript: `Placement review: ${name}`,
        processing_status: 'processed',
      })
      .select('id')
      .single()

    if (!vcRow) continue

    const { error: paErr } = await rawDb
      .from('proposed_actions')
      .insert({
        academy_id: academyId,
        proposed_by_id: user.id,
        voice_command_id: vcRow.id,
        action_type: 'other',
        action_label: `Placement Review — ${name}`,
        target_module: 'placement_review',
        target_object_id: sessionId,
        target_object_type: 'session',
        proposed_payload: {
          source: 'attendance_exception',
          source_proposed_action_id: proposedActionId,
          session_id: sessionId,
          attendee_name: name,
          reason: attendee.reason ?? '',
          recommended_next_step: 'Review for placement/onboarding',
          no_automatic_player_creation: true,
          warnings: [
            'No player profile has been created.',
            'No roster change has been made.',
            'No parent or player communication has been sent.',
            'Director must manually decide next steps for this individual.',
          ],
        },
        status: 'pending_review',
        risk_level: 'medium',
        risk_notes: [
          'No automatic changes made — director decision required.',
          'Individual was flagged as an unexpected attendee by the coach.',
        ],
      })

    if (!paErr) unrosteredFollowUpsCreated++
  }

  // Write audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'attendance_exception.applied',
      target_type: 'session_attendance',
      target_id: sessionId,
      payload: {
        proposed_action_id: proposedActionId,
        session_id: sessionId,
        attendance_rows_upserted: attendanceRowsUpserted,
        skipped_unknown: skippedUnknown,
        unrostered_follow_ups_created: unrosteredFollowUpsCreated,
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
      error: `Changes applied but failed to mark draft as executed: ${updateError.message}`,
      attendanceRowsUpserted,
      skippedUnknown,
      unrosteredFollowUpsCreated,
    }
  }

  return { ok: true, error: null, attendanceRowsUpserted, skippedUnknown, unrosteredFollowUpsCreated }
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

// ─────────────────────────────────────────────────────────────
// Review coach observation draft (coach_observation_draft_v1)
// Only updates proposed_actions status + reviewer tracking fields.
// Never writes to coach_observations, player profiles, parent messages,
// or any other table. Apply action is the only path to write.
// ─────────────────────────────────────────────────────────────

export async function updateObservationDraftDecisionAction(
  proposedActionId: string,
  decision: DraftDecision,
  reviewNotes?: string,
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
    return { ok: false, error: 'You do not have permission to review player observation drafts.' }
  }

  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return { ok: false, error: 'Proposed action not found.' }
  if (proposedAction.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (proposedAction.target_module !== 'coach_observation_draft_v1') {
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
// Apply approved coach observation draft (coach_observation_draft_v1)
// Creates exactly one coach_observations row from the draft payload.
// Writes audit_log. Marks proposed_action as executed.
// Never touches player levels, curriculum, parent messages, or billing.
// ─────────────────────────────────────────────────────────────

export interface ApplyApprovedObservationDraftResult {
  ok: boolean
  error: string | null
}

export async function applyApprovedObservationDraftAction(
  proposedActionId: string,
): Promise<ApplyApprovedObservationDraftResult> {
  const fail = (error: string): ApplyApprovedObservationDraftResult => ({ ok: false, error })

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
    return fail('You do not have permission to apply player observation drafts.')
  }

  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, proposed_by_id, proposed_payload, voice_command_id')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return fail('Proposed action not found.')
  if (proposedAction.academy_id !== academyId) return fail('Access denied.')
  if (proposedAction.target_module !== 'coach_observation_draft_v1') {
    return fail('This action cannot be applied through this interface.')
  }
  if (proposedAction.status !== 'approved') {
    return fail('Only approved drafts can be applied.')
  }

  const payload = proposedAction.proposed_payload as Record<string, unknown>
  if (payload?.draft_type !== 'coach_observation_draft_v1') {
    return fail('Unsupported draft type.')
  }

  const playerId = payload.player_id as string | undefined
  const sessionId = payload.session_id as string | undefined
  const note = payload.note as string | undefined
  const observationType = payload.observation_type as string | undefined

  if (!playerId || !note) return fail('Draft payload is missing required fields.')

  // Verify player belongs to this academy
  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return fail('Player not found or does not belong to this academy.')

  // Insert into coach_observations — is_private always true
  // ai_entities tracks provenance so the player profile can show a "From Wrap-Up" badge
  const { data: created, error: insertError } = await supabase
    .from('coach_observations')
    .insert({
      academy_id: academyId,
      coach_id: proposedAction.proposed_by_id,
      player_id: playerId,
      session_id: sessionId ?? null,
      observation_type: observationType ?? 'general',
      content: note,
      is_private: true,
      voice_command_id: proposedAction.voice_command_id ?? null,
      ai_entities: {
        source: 'coach_wrap_up',
        proposed_action_id: proposedActionId,
      },
    })
    .select('id')
    .single()

  if (insertError || !created) {
    return fail(`Failed to create observation: ${insertError?.message ?? 'unknown'}`)
  }

  // Write audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'coach_observation.applied',
      target_type: 'player',
      target_id: playerId,
      payload: {
        proposed_action_id: proposedActionId,
        observation_id: created.id,
        player_id: playerId,
        session_id: sessionId ?? null,
        observation_type: observationType ?? 'general',
        source: 'coach_observation_draft_v1',
        applied_by: user.id,
      },
      source_type: 'ui',
      voice_command_id: proposedAction.voice_command_id ?? null,
    })

  // Mark proposed_action as executed only after successful insert
  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'executed' })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  if (updateError) {
    return fail(`Observation created but failed to mark draft as executed: ${updateError.message}`)
  }

  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// Review development summary draft (development_summary_draft_v1)
// Only updates proposed_actions status. Never touches player_development_summary.
// ─────────────────────────────────────────────────────────────

export async function updateSummaryDraftDecisionAction(
  proposedActionId: string,
  decision: DraftDecision,
  reviewNotes?: string,
): Promise<UpdateDraftDecisionResult> {
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
  if (membership?.role !== 'academy_director' && membership?.role !== 'head_coach') {
    return { ok: false, error: 'You do not have permission to review development summary drafts.' }
  }

  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return { ok: false, error: 'Proposed action not found.' }
  if (proposedAction.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (proposedAction.target_module !== 'development_summary_draft_v1') {
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

  if (updateError) return { ok: false, error: `Failed to record decision: ${updateError.message}` }
  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// Apply approved development summary draft (development_summary_draft_v1)
// Upserts player_development_summary from payload. Writes audit_log.
// Never changes player level, curriculum, or parent/player-facing data.
// ─────────────────────────────────────────────────────────────

export interface ApplyApprovedSummaryDraftResult {
  ok: boolean
  error: string | null
}

export async function applyApprovedSummaryDraftAction(
  proposedActionId: string,
): Promise<ApplyApprovedSummaryDraftResult> {
  const fail = (error: string): ApplyApprovedSummaryDraftResult => ({ ok: false, error })

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
  if (membership?.role !== 'academy_director' && membership?.role !== 'head_coach') {
    return fail('You do not have permission to apply development summary drafts.')
  }

  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, target_object_id, proposed_payload, voice_command_id')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return fail('Proposed action not found.')
  if (proposedAction.academy_id !== academyId) return fail('Access denied.')
  if (proposedAction.target_module !== 'development_summary_draft_v1') {
    return fail('This action cannot be applied through this interface.')
  }
  if (proposedAction.status !== 'approved') return fail('Only approved drafts can be applied.')

  const payload = proposedAction.proposed_payload as DevelopmentSummaryDraftPayload
  if (payload?.draft_type !== 'development_summary_draft_v1') return fail('Unsupported draft type.')

  const playerId = proposedAction.target_object_id as string | null
  if (!playerId) return fail('Player reference missing from draft.')

  // Verify player belongs to this academy
  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return fail('Player not found or access denied.')

  // Upsert development summary — internal only, show_to_student/parent remain false
  try {
    await upsertPlayerDevelopmentSummary(supabase, {
      academy_id: academyId,
      player_id: playerId,
      created_by: user.id,
      updated_by: user.id,
      current_strengths: payload.proposed_strengths,
      things_to_work_on: payload.proposed_work_on,
      coach_summary: payload.proposed_coach_summary || null,
      show_to_student: false,
      show_to_parent: false,
      source: 'coach_observation_draft',
    })
  } catch (err) {
    return fail(`Failed to update development summary: ${(err as Error).message}`)
  }

  // Write audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'development_summary.applied',
      target_type: 'player',
      target_id: playerId,
      payload: {
        proposed_action_id: proposedActionId,
        player_id: playerId,
        source_observation_count: payload.source_observation_count,
        source: 'development_summary_draft_v1',
        applied_by: user.id,
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
    return fail(`Summary updated but failed to mark draft as executed: ${updateError.message}`)
  }

  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// Dismiss placement review draft
// Marks a placement_review follow-up as executed after director has
// noted the outcome. No player, roster, billing, or parent communication
// is created — this is a read/acknowledge action only.
// ─────────────────────────────────────────────────────────────

export interface DismissPlacementReviewResult {
  ok: boolean
  error: string | null
}

export async function dismissPlacementReviewDraftAction(
  proposedActionId: string,
): Promise<DismissPlacementReviewResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }
  if (!proposedActionId) return { ok: false, error: 'Missing proposed action ID.' }

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
    return { ok: false, error: 'You do not have permission to dismiss placement review items.' }
  }

  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, voice_command_id')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return { ok: false, error: 'Item not found.' }
  if (proposedAction.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (proposedAction.target_module !== 'placement_review') {
    return { ok: false, error: 'This item cannot be dismissed through this interface.' }
  }
  if (proposedAction.status === 'executed') {
    return { ok: false, error: 'Already marked reviewed.' }
  }

  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'executed' })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  if (updateError) {
    return { ok: false, error: `Failed to mark reviewed: ${updateError.message}` }
  }

  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'placement_review.dismissed',
      target_type: 'proposed_actions',
      target_id: proposedActionId,
      payload: { proposed_action_id: proposedActionId, dismissed_by: user.id },
      source_type: 'ui',
      voice_command_id: proposedAction.voice_command_id ?? null,
    })

  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// Start Placement Intake from a placement_review follow-up.
// Creates a placement_intake_candidate_v1 proposed_actions row
// (safe bridge — no player, no roster, no billing, no parent comms).
// Marks the original placement_review item as executed.
// Writes audit log.
// ─────────────────────────────────────────────────────────────

export interface StartPlacementIntakeResult {
  ok: boolean
  error: string | null
  intakeCandidateId: string | null
}

export async function startPlacementIntakeFromReviewAction(
  proposedActionId: string,
): Promise<StartPlacementIntakeResult> {
  const fail = (error: string): StartPlacementIntakeResult =>
    ({ ok: false, error, intakeCandidateId: null })

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
    return fail('You do not have permission to start placement intake.')
  }

  const rawDb = supabase as any

  const { data: item } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, target_object_id, proposed_payload, voice_command_id')
    .eq('id', proposedActionId)
    .single()

  if (!item) return fail('Placement review item not found.')
  if (item.academy_id !== academyId) return fail('Access denied.')
  if (item.target_module !== 'placement_review') {
    return fail('This item cannot be handled through this interface.')
  }
  if (item.status === 'executed') return fail('This item has already been handled.')

  const payload = item.proposed_payload as Record<string, unknown>
  const attendeeName = payload?.attendee_name as string | null
  const sessionId = item.target_object_id as string | null

  if (!attendeeName) return fail('Attendee name missing from placement review item.')

  // Create voice_commands row (required FK for proposed_actions)
  const issuerRole: 'academy_director' | 'head_coach' =
    role === 'academy_director' ? 'academy_director' : 'head_coach'
  const rawInput = `Placement intake candidate: ${attendeeName}`

  const { data: vcRow } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: issuerRole as any,
      input_method: 'typed' as any,
      raw_input: rawInput,
      transcript: rawInput,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (!vcRow) return fail('Failed to create command record.')

  // Create placement_intake_candidate proposed_action.
  // No player, no roster, no billing, no parent comms.
  const intakePayload = {
    draft_type: 'placement_intake_candidate_v1',
    source: 'placement_review',
    source_proposed_action_id: proposedActionId,
    attendee_name: attendeeName,
    session_id: sessionId,
    coach_note: payload?.reason ?? '',
    recommended_next_step: 'Start placement intake',
    no_player_created: true,
    no_roster_change: true,
    no_billing: true,
    no_parent_communication: true,
  }

  const { data: intakeAction, error: intakeError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: vcRow.id,
      action_type: 'other',
      action_label: `Placement Intake — ${attendeeName}`,
      target_module: 'placement_intake_candidate',
      target_object_id: academyId,
      target_object_type: 'academy',
      proposed_payload: intakePayload,
      status: 'pending_review',
      risk_level: 'medium',
      risk_notes: [
        'No player record created.',
        'No roster change made.',
        'No billing or parent communication created.',
        'Director must proceed through full placement intake to create an official player record.',
      ],
    })
    .select('id')
    .single()

  if (intakeError || !intakeAction) {
    return fail(`Failed to create intake candidate: ${intakeError?.message ?? 'unknown'}`)
  }

  // Mark original placement_review as executed
  const { error: execError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'executed' })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  if (execError) {
    return fail(`Failed to update placement review status: ${execError.message}`)
  }

  // Write audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'placement_review.intake_started',
      target_type: 'proposed_actions',
      target_id: proposedActionId,
      payload: {
        proposed_action_id: proposedActionId,
        intake_candidate_id: intakeAction.id,
        attendee_name: attendeeName,
        started_by: user.id,
      },
      source_type: 'ui',
      voice_command_id: item.voice_command_id ?? null,
    })

  return { ok: true, error: null, intakeCandidateId: intakeAction.id as string }
}

// ─────────────────────────────────────────────────────────────
// Mark a placement_review follow-up as Follow-Up Later.
// Sets status to clarification_needed — item stays visible in the
// follow-up section but no longer counts as an urgent pending item.
// No player, roster, billing, or parent communication is created.
// ─────────────────────────────────────────────────────────────

export interface MarkFollowUpLaterResult {
  ok: boolean
  error: string | null
}

export async function markPlacementReviewFollowUpLaterAction(
  proposedActionId: string,
): Promise<MarkFollowUpLaterResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }
  if (!proposedActionId) return { ok: false, error: 'Missing proposed action ID.' }

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
    return { ok: false, error: 'You do not have permission to update placement review items.' }
  }

  const rawDb = supabase as any

  const { data: item } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, voice_command_id')
    .eq('id', proposedActionId)
    .single()

  if (!item) return { ok: false, error: 'Item not found.' }
  if (item.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (item.target_module !== 'placement_review') {
    return { ok: false, error: 'This item cannot be updated through this interface.' }
  }
  if (item.status === 'executed') {
    return { ok: false, error: 'This item has already been handled.' }
  }

  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'clarification_needed' })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  if (updateError) {
    return { ok: false, error: `Failed to update item: ${updateError.message}` }
  }

  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'placement_review.follow_up_later',
      target_type: 'proposed_actions',
      target_id: proposedActionId,
      payload: { proposed_action_id: proposedActionId, marked_by: user.id },
      source_type: 'ui',
      voice_command_id: item.voice_command_id ?? null,
    })

  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// Dismiss a placement intake candidate.
// Sets status to 'rejected' — candidate is removed from the queue.
// No player, roster, billing, or parent communication is created.
// ─────────────────────────────────────────────────────────────

export interface DismissIntakeCandidateResult {
  ok: boolean
  error: string | null
}

export async function dismissIntakeCandidateAction(
  proposedActionId: string,
): Promise<DismissIntakeCandidateResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }
  if (!proposedActionId) return { ok: false, error: 'Missing proposed action ID.' }

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
    return { ok: false, error: 'You do not have permission to dismiss intake candidates.' }
  }

  const rawDb = supabase as any

  const { data: item } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, voice_command_id')
    .eq('id', proposedActionId)
    .single()

  if (!item) return { ok: false, error: 'Intake candidate not found.' }
  if (item.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (item.target_module !== 'placement_intake_candidate') {
    return { ok: false, error: 'This item cannot be dismissed through this interface.' }
  }
  if (item.status === 'rejected' || item.status === 'executed') {
    return { ok: false, error: 'This item has already been handled.' }
  }

  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'rejected' })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  if (updateError) {
    return { ok: false, error: `Failed to dismiss candidate: ${updateError.message}` }
  }

  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'placement_intake_candidate.dismissed',
      target_type: 'proposed_actions',
      target_id: proposedActionId,
      payload: { proposed_action_id: proposedActionId, dismissed_by: user.id },
      source_type: 'ui',
      voice_command_id: item.voice_command_id ?? null,
    })

  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// Start a placement assessment draft from an intake candidate.
// Creates a proposed_actions row with target_module: 'placement_assessment_draft'.
// Marks the intake candidate as 'executed'.
// No player, roster, billing, or parent communication is created.
// ─────────────────────────────────────────────────────────────

export interface StartPlacementAssessmentResult {
  ok: boolean
  error: string | null
  assessmentDraftId: string | null
}

export async function startPlacementAssessmentDraftAction(
  intakeCandidateId: string,
): Promise<StartPlacementAssessmentResult> {
  const fail = (error: string): StartPlacementAssessmentResult =>
    ({ ok: false, error, assessmentDraftId: null })

  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')
  if (!intakeCandidateId) return fail('Missing intake candidate ID.')

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
    return fail('You do not have permission to start placement assessments.')
  }

  const rawDb = supabase as any

  const { data: candidate } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, proposed_payload, voice_command_id')
    .eq('id', intakeCandidateId)
    .single()

  if (!candidate) return fail('Intake candidate not found.')
  if (candidate.academy_id !== academyId) return fail('Access denied.')
  if (candidate.target_module !== 'placement_intake_candidate') {
    return fail('This item cannot be handled through this interface.')
  }
  if (candidate.status === 'executed' || candidate.status === 'rejected') {
    return fail('This candidate has already been handled.')
  }

  const candidatePayload = candidate.proposed_payload as Record<string, unknown>
  const attendeeName = candidatePayload?.attendee_name as string | null
  const sessionId = candidatePayload?.session_id as string | null

  if (!attendeeName) return fail('Attendee name missing from intake candidate.')

  // Create voice_commands row (required FK for proposed_actions)
  const issuerRole: 'academy_director' | 'head_coach' =
    role === 'academy_director' ? 'academy_director' : 'head_coach'
  const rawInput = `Placement assessment: ${attendeeName}`

  const { data: vcRow } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: issuerRole as any,
      input_method: 'typed' as any,
      raw_input: rawInput,
      transcript: rawInput,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (!vcRow) return fail('Failed to create command record.')

  const assessmentPayload = {
    draft_type: 'placement_assessment_draft_v1',
    source: 'placement_intake_candidate',
    source_proposed_action_id: intakeCandidateId,
    attendee_name: attendeeName,
    session_id: sessionId,
    age_band: null as string | null,
    ball_color: null as string | null,
    skill_observations: '',
    movement_observations: '',
    competitive_readiness: '',
    recommended_next_step: '',
    no_player_created: true,
    no_roster_change: true,
    no_billing: true,
    no_parent_communication: true,
  }

  const { data: assessmentAction, error: assessmentError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: vcRow.id,
      action_type: 'other',
      action_label: `Placement Assessment — ${attendeeName}`,
      target_module: 'placement_assessment_draft',
      target_object_id: academyId,
      target_object_type: 'academy',
      proposed_payload: assessmentPayload,
      status: 'pending_review',
      risk_level: 'medium',
      risk_notes: [
        'No player record created.',
        'No roster change made.',
        'No billing or parent communication created.',
        'Director must complete assessment and approve recommendation to create an official player record.',
      ],
    })
    .select('id')
    .single()

  if (assessmentError || !assessmentAction) {
    return fail(`Failed to create assessment draft: ${assessmentError?.message ?? 'unknown'}`)
  }

  // Mark intake candidate as executed
  const { error: execError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'executed' })
    .eq('id', intakeCandidateId)
    .eq('academy_id', academyId)

  if (execError) {
    return fail(`Failed to update intake candidate status: ${execError.message}`)
  }

  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'placement_intake_candidate.assessment_started',
      target_type: 'proposed_actions',
      target_id: intakeCandidateId,
      payload: {
        intake_candidate_id: intakeCandidateId,
        assessment_draft_id: assessmentAction.id,
        attendee_name: attendeeName,
        started_by: user.id,
      },
      source_type: 'ui',
      voice_command_id: candidate.voice_command_id ?? null,
    })

  return { ok: true, error: null, assessmentDraftId: assessmentAction.id as string }
}

// ─────────────────────────────────────────────────────────────
// Save updates to a placement assessment draft.
// Only updates payload fields — never creates a player or changes status.
// ─────────────────────────────────────────────────────────────

export interface SaveAssessmentDraftResult {
  ok: boolean
  error: string | null
}

export interface PlayerIdentity {
  first_name: string
  last_name: string
  date_of_birth: string  // YYYY-MM-DD
  gender: string | null  // 'male' | 'female' | 'other' | null
}

export interface AssessmentDraftFields {
  age_band: string | null
  ball_color: string | null
  skill_observations: string
  movement_observations: string
  competitive_readiness: string
  recommended_next_step: string
  player_identity: PlayerIdentity
}

export async function saveAssessmentDraftAction(
  assessmentDraftId: string,
  fields: AssessmentDraftFields,
): Promise<SaveAssessmentDraftResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }
  if (!assessmentDraftId) return { ok: false, error: 'Missing assessment draft ID.' }

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
    return { ok: false, error: 'You do not have permission to edit assessment drafts.' }
  }

  const rawDb = supabase as any

  const { data: item } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, proposed_payload')
    .eq('id', assessmentDraftId)
    .single()

  if (!item) return { ok: false, error: 'Assessment draft not found.' }
  if (item.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (item.target_module !== 'placement_assessment_draft') {
    return { ok: false, error: 'This item cannot be edited through this interface.' }
  }
  if (item.status !== 'pending_review') {
    return { ok: false, error: 'Only pending assessment drafts can be edited.' }
  }

  const existingPayload = item.proposed_payload as Record<string, unknown>
  const updatedPayload = {
    ...existingPayload,
    age_band: fields.age_band,
    ball_color: fields.ball_color,
    skill_observations: fields.skill_observations.trim(),
    movement_observations: fields.movement_observations.trim(),
    competitive_readiness: fields.competitive_readiness.trim(),
    recommended_next_step: fields.recommended_next_step.trim(),
    player_identity: {
      first_name: fields.player_identity.first_name.trim(),
      last_name: fields.player_identity.last_name.trim(),
      date_of_birth: fields.player_identity.date_of_birth.trim(),
      gender: fields.player_identity.gender ?? null,
    },
  }

  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update({ proposed_payload: updatedPayload })
    .eq('id', assessmentDraftId)
    .eq('academy_id', academyId)

  if (updateError) {
    return { ok: false, error: `Failed to save assessment: ${updateError.message}` }
  }

  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// Generate a placement recommendation draft from a completed assessment.
// Deterministic derivation — no AI, no external API calls.
// Creates a proposed_actions row with target_module: 'placement_recommendation_draft'.
// Marks the assessment draft as 'executed'.
// No player, roster, billing, or parent communication is created.
// ─────────────────────────────────────────────────────────────

export interface GeneratePlacementRecommendationResult {
  ok: boolean
  error: string | null
  recommendationDraftId: string | null
}

function deriveCurrentLevel(ballColor: string | null): string {
  switch (ballColor?.toLowerCase()) {
    case 'red': return 'Beginner'
    case 'orange': return 'Intermediate'
    case 'green': return 'Advanced Intermediate'
    case 'yellow': return 'Advanced'
    default: return 'Unknown'
  }
}

function deriveStartingPathway(ballColor: string | null, ageBand: string | null): string {
  const isYouth = ageBand ? /^[6-9]|^1[0-4]/.test(ageBand) : false
  switch (ballColor?.toLowerCase()) {
    case 'red': return isYouth ? 'Youth Beginner' : 'Adult Beginner'
    case 'orange': return isYouth ? 'Youth Development' : 'Adult Development'
    case 'green': return isYouth ? 'Youth Competitive' : 'Adult Competitive'
    case 'yellow': return isYouth ? 'Junior Elite' : 'Adult Performance'
    default: return 'To Be Determined'
  }
}

function deriveFirstSkillPriority(skillObs: string): string {
  const text = skillObs.toLowerCase()
  if (/\bforehand\b/.test(text)) return 'Forehand groundstroke'
  if (/\bbackhand\b/.test(text)) return 'Backhand groundstroke'
  if (/\bserve\b|\bserving\b/.test(text)) return 'Serve mechanics'
  if (/\bmovement\b|\bfootwork\b/.test(text)) return 'Movement and footwork'
  if (/\bvolley\b/.test(text)) return 'Net play / volleys'
  if (/\breturn\b/.test(text)) return 'Return of serve'
  return 'General stroke development'
}

function deriveSuggestedGroupType(competitiveReadiness: string): string {
  const text = competitiveReadiness.toLowerCase()
  if (/\bprivate\b|\bone-on-one\b/.test(text)) return 'Private (1:1)'
  if (/\bsemi-private\b|\bsmall group\b/.test(text)) return 'Semi-private (2-3)'
  return 'Group training'
}

function deriveConfidence(
  ageBand: string | null,
  ballColor: string | null,
  skillObs: string,
  movementObs: string,
  competitiveReadiness: string,
  recommendedNext: string,
): 'low' | 'medium' | 'high' {
  const filled = [ageBand, ballColor, skillObs, movementObs, competitiveReadiness, recommendedNext]
    .filter(v => v && v.trim().length > 0).length
  if (filled <= 2) return 'low'
  if (filled <= 4) return 'medium'
  return 'high'
}

export async function generatePlacementRecommendationDraftAction(
  assessmentDraftId: string,
): Promise<GeneratePlacementRecommendationResult> {
  const fail = (error: string): GeneratePlacementRecommendationResult =>
    ({ ok: false, error, recommendationDraftId: null })

  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')
  if (!assessmentDraftId) return fail('Missing assessment draft ID.')

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
    return fail('You do not have permission to generate placement recommendations.')
  }

  const rawDb = supabase as any

  const { data: assessment } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, proposed_payload, voice_command_id')
    .eq('id', assessmentDraftId)
    .single()

  if (!assessment) return fail('Assessment draft not found.')
  if (assessment.academy_id !== academyId) return fail('Access denied.')
  if (assessment.target_module !== 'placement_assessment_draft') {
    return fail('This item cannot be handled through this interface.')
  }
  if (assessment.status !== 'pending_review') {
    return fail('Only pending assessment drafts can be used to generate a recommendation.')
  }

  const ap = assessment.proposed_payload as Record<string, unknown>
  const attendeeName = ap?.attendee_name as string | null
  const sessionId = ap?.session_id as string | null
  const ageBand = ap?.age_band as string | null
  const ballColor = ap?.ball_color as string | null
  const skillObs = (ap?.skill_observations as string) ?? ''
  const movementObs = (ap?.movement_observations as string) ?? ''
  const competitiveReadiness = (ap?.competitive_readiness as string) ?? ''
  const recommendedNext = (ap?.recommended_next_step as string) ?? ''

  if (!attendeeName) return fail('Attendee name missing from assessment draft.')

  // Validate required player identity fields before generating recommendation
  const rawIdentity = ap?.player_identity as Record<string, unknown> | undefined
  const firstName = (rawIdentity?.first_name as string | undefined)?.trim() ?? ''
  const lastName = (rawIdentity?.last_name as string | undefined)?.trim() ?? ''
  const dateOfBirth = (rawIdentity?.date_of_birth as string | undefined)?.trim() ?? ''

  if (!firstName || !lastName || !dateOfBirth) {
    return fail('First name, last name, and date of birth are required before generating a placement recommendation.')
  }

  const playerIdentity: PlayerIdentity = {
    first_name: firstName,
    last_name: lastName,
    date_of_birth: dateOfBirth,
    gender: (rawIdentity?.gender as string | null) ?? null,
  }

  // Deterministic derivation — no AI, no external calls
  const currentLevel = deriveCurrentLevel(ballColor)
  const startingPathway = deriveStartingPathway(ballColor, ageBand)
  const firstSkillPriority = deriveFirstSkillPriority(skillObs)
  const suggestedGroupType = deriveSuggestedGroupType(competitiveReadiness)
  const confidence = deriveConfidence(ageBand, ballColor, skillObs, movementObs, competitiveReadiness, recommendedNext)

  // Create voice_commands row (required FK)
  const issuerRole: 'academy_director' | 'head_coach' =
    role === 'academy_director' ? 'academy_director' : 'head_coach'
  const rawInput = `Placement recommendation: ${attendeeName}`

  const { data: vcRow } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: issuerRole as any,
      input_method: 'typed' as any,
      raw_input: rawInput,
      transcript: rawInput,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (!vcRow) return fail('Failed to create command record.')

  const recommendationPayload = {
    draft_type: 'placement_recommendation_draft_v1',
    source: 'placement_assessment_draft',
    source_proposed_action_id: assessmentDraftId,
    attendee_name: attendeeName,
    session_id: sessionId,
    player_identity: playerIdentity,
    current_level: currentLevel,
    starting_pathway: startingPathway,
    suggested_group_type: suggestedGroupType,
    first_skill_priority: firstSkillPriority,
    recommended_group_id: null as string | null,
    recommended_group_name: null as string | null,
    confidence,
    director_override_notes: '',
    assessment_summary: {
      age_band: ageBand,
      ball_color: ballColor,
      skill_observations: skillObs,
      movement_observations: movementObs,
      competitive_readiness: competitiveReadiness,
      recommended_next_step: recommendedNext,
    },
    no_player_created: true,
    no_roster_change: true,
    no_billing: true,
    no_parent_communication: true,
  }

  const { data: recAction, error: recError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: vcRow.id,
      action_type: 'other',
      action_label: `Placement Recommendation — ${attendeeName}`,
      target_module: 'placement_recommendation_draft',
      target_object_id: academyId,
      target_object_type: 'academy',
      proposed_payload: recommendationPayload,
      status: 'pending_review',
      risk_level: 'high',
      risk_notes: [
        'This recommendation is the final step before player creation.',
        'No player record created until director explicitly approves this recommendation.',
        'Director must review and approve before any roster, billing, or parent communication is initiated.',
      ],
    })
    .select('id')
    .single()

  if (recError || !recAction) {
    return fail(`Failed to create recommendation draft: ${recError?.message ?? 'unknown'}`)
  }

  // Mark assessment as executed
  const { error: execError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'executed' })
    .eq('id', assessmentDraftId)
    .eq('academy_id', academyId)

  if (execError) {
    return fail(`Failed to update assessment status: ${execError.message}`)
  }

  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'placement_assessment_draft.recommendation_generated',
      target_type: 'proposed_actions',
      target_id: assessmentDraftId,
      payload: {
        assessment_draft_id: assessmentDraftId,
        recommendation_draft_id: recAction.id,
        attendee_name: attendeeName,
        confidence,
        generated_by: user.id,
      },
      source_type: 'ui',
      voice_command_id: assessment.voice_command_id ?? null,
    })

  return { ok: true, error: null, recommendationDraftId: recAction.id as string }
}

// ─────────────────────────────────────────────────────────────
// Approve a placement recommendation draft (no overrides).
// Sets status to 'approved'. No player is created here.
// Player creation (Sprint 168) is a separate explicit director action.
// ─────────────────────────────────────────────────────────────

export interface ApproveRecommendationResult {
  ok: boolean
  error: string | null
}

export async function approveRecommendationDraftAction(
  recommendationDraftId: string,
  selectedGroupId: string,
  selectedGroupName: string,
): Promise<ApproveRecommendationResult> {
  await assertNotPreviewMode()

  if (!selectedGroupId?.trim()) return { ok: false, error: 'Select a valid group before approving this recommendation.' }
  if (!selectedGroupName?.trim()) return { ok: false, error: 'Group name is missing.' }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }
  if (!recommendationDraftId) return { ok: false, error: 'Missing recommendation draft ID.' }

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
    return { ok: false, error: 'You do not have permission to approve placement recommendations.' }
  }

  const rawDb = supabase as any

  const { data: item } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, proposed_payload, voice_command_id')
    .eq('id', recommendationDraftId)
    .single()

  if (!item) return { ok: false, error: 'Recommendation draft not found.' }
  if (item.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (item.target_module !== 'placement_recommendation_draft') {
    return { ok: false, error: 'This item cannot be approved through this interface.' }
  }
  if (item.status !== 'pending_review') {
    return { ok: false, error: 'Only pending recommendation drafts can be approved.' }
  }

  // Validate player identity in payload
  const existingPayload = item.proposed_payload as Record<string, unknown>
  const rawIdentity = existingPayload?.player_identity as Record<string, unknown> | undefined
  if (!rawIdentity?.first_name || !rawIdentity?.last_name || !rawIdentity?.date_of_birth) {
    return { ok: false, error: 'Player identity (first name, last name, date of birth) must be saved on the assessment before approving.' }
  }

  // Server-side: verify the selected group belongs to this academy
  const { data: verifiedGroup } = await supabase
    .from('groups')
    .select('id, name')
    .eq('id', selectedGroupId)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .single()

  if (!verifiedGroup) {
    return { ok: false, error: 'Selected group does not belong to this academy or is inactive.' }
  }

  // Merge group into payload before approving
  const approvedPayload = {
    ...existingPayload,
    recommended_group_id: verifiedGroup.id,
    recommended_group_name: verifiedGroup.name,
  }

  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'approved', proposed_payload: approvedPayload })
    .eq('id', recommendationDraftId)
    .eq('academy_id', academyId)

  if (updateError) {
    return { ok: false, error: `Failed to approve recommendation: ${updateError.message}` }
  }

  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'placement_recommendation_draft.approved',
      target_type: 'proposed_actions',
      target_id: recommendationDraftId,
      payload: {
        recommendation_draft_id: recommendationDraftId,
        attendee_name: existingPayload?.attendee_name,
        recommended_group_id: verifiedGroup.id,
        recommended_group_name: verifiedGroup.name,
        approved_by: user.id,
      },
      source_type: 'ui',
      voice_command_id: item.voice_command_id ?? null,
    })

  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// Reject a placement recommendation draft.
// Sets status to 'rejected'. No player is created.
// ─────────────────────────────────────────────────────────────

export interface RejectRecommendationResult {
  ok: boolean
  error: string | null
}

export async function rejectRecommendationDraftAction(
  recommendationDraftId: string,
): Promise<RejectRecommendationResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }
  if (!recommendationDraftId) return { ok: false, error: 'Missing recommendation draft ID.' }

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
    return { ok: false, error: 'You do not have permission to reject placement recommendations.' }
  }

  const rawDb = supabase as any

  const { data: item } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, proposed_payload, voice_command_id')
    .eq('id', recommendationDraftId)
    .single()

  if (!item) return { ok: false, error: 'Recommendation draft not found.' }
  if (item.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (item.target_module !== 'placement_recommendation_draft') {
    return { ok: false, error: 'This item cannot be rejected through this interface.' }
  }
  if (item.status !== 'pending_review') {
    return { ok: false, error: 'Only pending recommendation drafts can be rejected.' }
  }

  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'rejected' })
    .eq('id', recommendationDraftId)
    .eq('academy_id', academyId)

  if (updateError) {
    return { ok: false, error: `Failed to reject recommendation: ${updateError.message}` }
  }

  const payload = item.proposed_payload as Record<string, unknown>
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'placement_recommendation_draft.rejected',
      target_type: 'proposed_actions',
      target_id: recommendationDraftId,
      payload: {
        recommendation_draft_id: recommendationDraftId,
        attendee_name: payload?.attendee_name,
        rejected_by: user.id,
      },
      source_type: 'ui',
      voice_command_id: item.voice_command_id ?? null,
    })

  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// Override and approve a placement recommendation draft.
// Updates payload fields with director overrides and sets status to 'approved'.
// No player is created here — player creation is a separate explicit step.
// ─────────────────────────────────────────────────────────────

export interface OverrideRecommendationResult {
  ok: boolean
  error: string | null
}

export interface RecommendationOverrideFields {
  current_level: string
  starting_pathway: string
  suggested_group_type: string
  first_skill_priority: string
  director_override_notes: string
  recommended_group_id: string
  recommended_group_name: string
}

export async function overrideRecommendationDraftAction(
  recommendationDraftId: string,
  overrides: RecommendationOverrideFields,
): Promise<OverrideRecommendationResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }
  if (!recommendationDraftId) return { ok: false, error: 'Missing recommendation draft ID.' }

  if (!overrides.current_level?.trim()) return { ok: false, error: 'Current level is required.' }
  if (!overrides.starting_pathway?.trim()) return { ok: false, error: 'Starting pathway is required.' }
  if (!overrides.recommended_group_id?.trim()) return { ok: false, error: 'Select a valid group before applying this override.' }

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
    return { ok: false, error: 'You do not have permission to override placement recommendations.' }
  }

  // Server-side: verify the selected group belongs to this academy
  const { data: verifiedGroup } = await supabase
    .from('groups')
    .select('id, name')
    .eq('id', overrides.recommended_group_id)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .single()

  if (!verifiedGroup) {
    return { ok: false, error: 'Selected group does not belong to this academy or is inactive.' }
  }

  const rawDb = supabase as any

  const { data: item } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, proposed_payload, voice_command_id')
    .eq('id', recommendationDraftId)
    .single()

  if (!item) return { ok: false, error: 'Recommendation draft not found.' }
  if (item.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (item.target_module !== 'placement_recommendation_draft') {
    return { ok: false, error: 'This item cannot be overridden through this interface.' }
  }
  if (item.status !== 'pending_review') {
    return { ok: false, error: 'Only pending recommendation drafts can be overridden.' }
  }

  const existingPayload = item.proposed_payload as Record<string, unknown>
  const updatedPayload = {
    ...existingPayload,
    current_level: overrides.current_level.trim(),
    starting_pathway: overrides.starting_pathway.trim(),
    suggested_group_type: overrides.suggested_group_type.trim(),
    first_skill_priority: overrides.first_skill_priority.trim(),
    director_override_notes: overrides.director_override_notes.trim(),
    recommended_group_id: verifiedGroup.id,
    recommended_group_name: verifiedGroup.name,
    director_overridden: true,
    // player_identity is preserved via ...existingPayload spread above
  }

  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'approved', proposed_payload: updatedPayload })
    .eq('id', recommendationDraftId)
    .eq('academy_id', academyId)

  if (updateError) {
    return { ok: false, error: `Failed to apply override: ${updateError.message}` }
  }

  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'placement_recommendation_draft.overridden_and_approved',
      target_type: 'proposed_actions',
      target_id: recommendationDraftId,
      payload: {
        recommendation_draft_id: recommendationDraftId,
        attendee_name: existingPayload?.attendee_name,
        overrides,
        overridden_by: user.id,
      },
      source_type: 'ui',
      voice_command_id: item.voice_command_id ?? null,
    })

  return { ok: true, error: null }
}

// ── Sprint 168 — Player Profile Creation ────────────────────────────────────

export interface CreatePlayerResult {
  ok: boolean
  error: string | null
  playerId: string | null
  placementRecommendationId: string | null
}

function mapConfidenceScore(confidence: string | undefined): number | null {
  if (confidence === 'high') return 0.8
  if (confidence === 'medium') return 0.5
  if (confidence === 'low') return 0.2
  return null
}

export async function createPlayerFromApprovedRecommendationAction(
  recommendationDraftId: string,
): Promise<CreatePlayerResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { ok: false, error: 'Not authenticated', playerId: null, placementRecommendationId: null }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (profileError || !profile?.academy_id) return { ok: false, error: 'Profile not found', playerId: null, placementRecommendationId: null }

  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const memberRole = membership?.role
  if (memberRole !== 'academy_director' && memberRole !== 'head_coach') {
    return { ok: false, error: 'Permission denied', playerId: null, placementRecommendationId: null }
  }

  // Fetch the proposed_action row
  const { data: item, error: fetchError } = await rawDb
    .from('proposed_actions')
    .select('*')
    .eq('id', recommendationDraftId)
    .eq('academy_id', academyId)
    .single()
  if (fetchError || !item) return { ok: false, error: 'Recommendation draft not found', playerId: null, placementRecommendationId: null }

  if (item.status === 'executed') {
    return { ok: false, error: 'This placement has already been finalized.', playerId: null, placementRecommendationId: null }
  }
  if (item.status !== 'approved') {
    return { ok: false, error: 'Recommendation must be approved before creating a player.', playerId: null, placementRecommendationId: null }
  }

  const payload = item.proposed_payload as any

  // Idempotency guard — if player was already created, return its ID
  if (payload?.created_player_id) {
    return {
      ok: false,
      error: 'A player record was already created from this recommendation. If activation failed, contact support.',
      playerId: payload.created_player_id,
      placementRecommendationId: null,
    }
  }

  // Validate identity fields
  const identity = payload?.player_identity as { first_name?: string; last_name?: string; date_of_birth?: string; gender?: string | null } | undefined
  const firstName = identity?.first_name?.trim() ?? ''
  const lastName = identity?.last_name?.trim() ?? ''
  const dateOfBirth = identity?.date_of_birth?.trim() ?? ''
  const gender = identity?.gender ?? null

  if (!firstName || !lastName) {
    return { ok: false, error: 'First name and last name are required in the assessment. Save the assessment draft with identity fields before creating a player.', playerId: null, placementRecommendationId: null }
  }
  if (!dateOfBirth) {
    return { ok: false, error: 'Date of birth is required (players.date_of_birth is NOT NULL). Save the assessment draft with a date of birth before creating a player.', playerId: null, placementRecommendationId: null }
  }
  if (isNaN(Date.parse(dateOfBirth))) {
    return { ok: false, error: 'Date of birth is not a valid date.', playerId: null, placementRecommendationId: null }
  }

  const recommendedGroupId = payload?.recommended_group_id as string | null
  if (!recommendedGroupId) {
    return { ok: false, error: 'A group must be selected on the recommendation before creating a player.', playerId: null, placementRecommendationId: null }
  }

  // Server-verify group belongs to this academy and is active
  const { data: verifiedGroup, error: groupError } = await supabase
    .from('groups')
    .select('id, name')
    .eq('id', recommendedGroupId)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .single()
  if (groupError || !verifiedGroup) {
    return { ok: false, error: 'Selected group not found or is no longer active.', playerId: null, placementRecommendationId: null }
  }

  // Create the player record
  const { data: newPlayer, error: playerError } = await supabase
    .from('players')
    .insert({
      academy_id: academyId,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      gender: gender as 'male' | 'female' | 'other' | null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (playerError || !newPlayer) {
    return { ok: false, error: `Failed to create player: ${playerError?.message ?? 'unknown error'}`, playerId: null, placementRecommendationId: null }
  }

  const playerId = newPlayer.id

  // Idempotency stamp — write player ID to payload immediately before any further steps
  await rawDb
    .from('proposed_actions')
    .update({
      proposed_payload: {
        ...payload,
        created_player_id: playerId,
        placement_creation_started_at: new Date().toISOString(),
        placement_creation_started_by: user.id,
      },
    })
    .eq('id', recommendationDraftId)
    .eq('academy_id', academyId)

  // Build recommendation rationale from payload fields
  const rationaleLines: string[] = []
  if (payload?.current_level) rationaleLines.push(`Level: ${payload.current_level}`)
  if (payload?.starting_pathway) rationaleLines.push(`Pathway: ${payload.starting_pathway}`)
  if (payload?.first_skill_priority) rationaleLines.push(`Skill priority: ${payload.first_skill_priority}`)
  if (payload?.suggested_group_type) rationaleLines.push(`Group type: ${payload.suggested_group_type}`)
  if (payload?.skill_observations) rationaleLines.push(`Skills: ${payload.skill_observations}`)
  if (payload?.movement_observations) rationaleLines.push(`Movement: ${payload.movement_observations}`)
  if (payload?.competitive_readiness) rationaleLines.push(`Competitive readiness: ${payload.competitive_readiness}`)
  const recommendationRationale = rationaleLines.join(' | ') || null

  // Create placement_recommendations row
  const { data: placementRec, error: placementError } = await supabase
    .from('placement_recommendations')
    .insert({
      academy_id: academyId,
      player_id: playerId,
      recommended_group_id: verifiedGroup.id,
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      created_by: user.id,
      confidence_score: mapConfidenceScore(payload?.confidence),
      recommendation_rationale: recommendationRationale,
    })
    .select('id')
    .single()

  if (placementError || !placementRec) {
    return { ok: false, error: `Failed to create placement recommendation: ${placementError?.message ?? 'unknown error'}. Player record was created (ID: ${playerId}) but not activated. Contact support.`, playerId, placementRecommendationId: null }
  }

  const placementRecId = placementRec.id

  // Call finalize_player_placement — the ONLY function that activates a player
  const { data: rpcData, error: rpcError } = await supabase.rpc('finalize_player_placement', {
    p_recommendation_id: placementRecId,
    p_activator_id: user.id,
  })

  if (rpcError) {
    return { ok: false, error: `Placement finalization failed: ${rpcError.message}. Player record was created (ID: ${playerId}) but not activated. Contact support.`, playerId, placementRecommendationId: placementRecId }
  }

  const rpcResult = rpcData as { success: boolean; error?: string; player_id?: string }
  if (!rpcResult?.success) {
    return { ok: false, error: `Placement finalization failed: ${rpcResult?.error ?? 'unknown error'}. Player record was created (ID: ${playerId}) but not activated. Contact support.`, playerId, placementRecommendationId: placementRecId }
  }

  // Mark proposed_action as executed
  const now = new Date().toISOString()
  await rawDb
    .from('proposed_actions')
    .update({
      status: 'executed',
      proposed_payload: {
        ...payload,
        created_player_id: playerId,
        placement_creation_started_at: payload.placement_creation_started_at ?? now,
        placement_creation_started_by: payload.placement_creation_started_by ?? user.id,
        finalized_at: now,
        finalized_by: user.id,
        no_parent_portal_created: true,
        no_billing_created: true,
        no_parent_communication_sent: true,
      },
    })
    .eq('id', recommendationDraftId)
    .eq('academy_id', academyId)

  // Audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'placement_recommendation.player_created',
      target_type: 'players',
      target_id: playerId,
      payload: {
        recommendation_draft_id: recommendationDraftId,
        placement_recommendation_id: placementRecId,
        player_id: playerId,
        attendee_name: payload?.attendee_name,
        group_id: verifiedGroup.id,
        group_name: verifiedGroup.name,
        activated_by: user.id,
      },
      source_type: 'ui',
      voice_command_id: item.voice_command_id ?? null,
    })

  return { ok: true, error: null, playerId, placementRecommendationId: placementRecId }
}
