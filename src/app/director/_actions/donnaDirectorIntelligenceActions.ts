'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { isPreviewMode } from '@/lib/utils/previewMode'
import type { Json } from '@/lib/supabase/database.types'
import type { DonnaApprovalExecutionResult } from '@/components/assistant/donnaApprovalExecutionTypes'
import { buildParentSupportGuidanceDraft } from '@/lib/communications/parentSafeResponseRules'

// ---------------------------------------------------------------------------
// Auth + academy_id helper (director/head_coach only)
// ---------------------------------------------------------------------------

async function getAuthorizedContext() {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) return { ok: false as const, error: 'Academy context unavailable.' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false as const, error: 'Director or Head Coach access required.' }
  }

  return {
    ok: true as const,
    supabase,
    userId: user.id,
    academyId: profile.academy_id,
    role: role as 'academy_director' | 'head_coach',
  }
}

// ---------------------------------------------------------------------------
// saveParentUpdateDraftAction — Sprint 275
//
// Builds a parent-safe communication draft via buildParentSupportGuidanceDraft
// from the LOCKED parentSafeResponseRules module. No AI, no external API.
//
// Saves to proposed_actions (target_module: 'parent_communication').
// Security guarantees enforced here:
//   - NEVER sends the message to the parent
//   - NEVER changes show_to_parent or show_to_student
//   - NEVER exposes raw internal coach notes in the payload
//   - Requires a confirmed _resolved_player_id before writing
//   - Player context limited to first_name (safe, in PARENT_VISIBLE_FIELDS)
// ---------------------------------------------------------------------------

export async function saveParentUpdateDraftAction(
  fields: Record<string, string>,
): Promise<DonnaApprovalExecutionResult> {
  if (await isPreviewMode()) {
    return { ok: false, status: 'blocked', message: 'Writes are disabled in preview mode.' }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) return { ok: false, status: 'blocked', message: ctx.error }

  const { supabase, userId, academyId, role } = ctx
  const rawDb = supabase as any

  const confirmedPlayerId = (fields._resolved_player_id ?? '').trim() || null
  if (!confirmedPlayerId) {
    return {
      ok: false,
      status: 'blocked',
      message:
        'Please confirm the player before saving this draft. Use the resolver panel to search and select a player.',
    }
  }

  const playerLabel = (fields.player ?? '').replace(/\s*✓$/, '').trim() || 'this player'
  const updateFocus = (fields.update_focus ?? '').trim()
  const tone = (fields.tone ?? '').trim()

  if (!updateFocus) {
    return { ok: false, status: 'error', message: 'Update focus is required.' }
  }

  // Fetch player's first_name — safe field (in PARENT_VISIBLE_FIELDS), scoped to academy_id
  const { data: playerRow } = await rawDb
    .from('players')
    .select('first_name, full_name')
    .eq('id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .single()

  const firstName: string =
    (playerRow?.first_name as string | null) ??
    ((playerRow?.full_name as string | null)?.split(' ')[0]) ??
    playerLabel.split(' ')[0] ??
    'the player'

  // Parse update_focus into focus keywords — max 3 terms
  const focusKeywords = updateFocus
    .split(/[,;]+/)
    .map((s: string) => s.trim())
    .filter(Boolean)
    .slice(0, 3)

  // Build parent-safe draft via LOCKED utility — no AI, no external API
  // observationText is deliberately omitted — never pass raw internal notes to parent draft
  const draftText = buildParentSupportGuidanceDraft({
    firstName,
    focusKeywords: focusKeywords.length > 0 ? focusKeywords : [updateFocus.slice(0, 80)],
  })

  const rawInput = [
    `Player: ${playerLabel}`,
    `Update focus: ${updateFocus}`,
    tone ? `Tone: ${tone}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  // Insert voice_commands row (required FK for proposed_actions)
  const { data: voiceCommand, error: vcError } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: userId,
      issuer_role: role as any,
      input_method: 'typed',
      raw_input: rawInput,
      transcript: rawInput,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return {
      ok: false,
      status: 'error',
      message: `Failed to create command record: ${vcError?.message ?? 'unknown'}`,
    }
  }

  const payload = {
    draft_type: 'parent_update_v1',
    source: 'donna_assistant',
    player_id: confirmedPlayerId,
    player_label: playerLabel,
    update_focus: updateFocus,
    tone: tone || null,
    draft_text: draftText,
    warnings: [
      'Draft only — not sent to parent.',
      'Director must explicitly approve and send from the parent communication module.',
      'show_to_parent was not changed.',
      'No player profile, level, or roster was modified.',
    ],
  }

  const { data: proposedAction, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: userId,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: `Parent Update Draft — ${playerLabel}`,
      target_module: 'parent_communication',
      target_object_id: confirmedPlayerId,
      target_object_type: 'player',
      proposed_payload: payload as unknown as Json,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: [
        'Draft only. No message was sent.',
        'Parent visibility was not changed.',
        'Director review required before any external communication.',
      ],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    return {
      ok: false,
      status: 'error',
      message: `Failed to save draft: ${paError?.message ?? 'unknown'}`,
    }
  }

  revalidatePath('/director/review')

  return {
    ok: true,
    status: 'saved',
    message: `Parent update draft for "${playerLabel}" saved for director review.`,
    createdId: proposedAction.id as string,
    safetyNotes: [
      'Draft only — no message has been sent.',
      'Parent and player see nothing until director explicitly sends from the communication module.',
      'show_to_parent was not changed.',
      'No player level or roster was modified.',
      'Review and approve this draft in the Review Queue before any external action.',
    ],
  }
}

// ---------------------------------------------------------------------------
// saveLevelReadinessDraftAction — Sprint 276
//
// Reads player_curriculum_states and the latest assessment to build a
// deterministic evidence summary. No AI, no external API.
//
// Saves to proposed_actions (target_module: 'level_review').
// Security guarantees enforced here:
//   - NEVER moves the player level
//   - NEVER updates player profile or player_curriculum_states
//   - NEVER notifies parent, player, or coach
//   - Requires a confirmed _resolved_player_id before writing
//   - Reads use rawDb scoped to academy_id throughout
// ---------------------------------------------------------------------------

export async function saveLevelReadinessDraftAction(
  fields: Record<string, string>,
): Promise<DonnaApprovalExecutionResult> {
  if (await isPreviewMode()) {
    return { ok: false, status: 'blocked', message: 'Writes are disabled in preview mode.' }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) return { ok: false, status: 'blocked', message: ctx.error }

  const { supabase, userId, academyId, role } = ctx
  const rawDb = supabase as any

  const confirmedPlayerId = (fields._resolved_player_id ?? '').trim() || null
  if (!confirmedPlayerId) {
    return {
      ok: false,
      status: 'blocked',
      message:
        'Please confirm the player before saving this review. Use the resolver panel to search and select a player.',
    }
  }

  const playerLabel = (fields.player ?? '').replace(/\s*✓$/, '').trim() || 'this player'
  const currentLevel = (fields.current_level ?? '').trim()
  const nextLevel = (fields.next_level ?? '').trim()
  const gateEvidence = (fields.gate_evidence ?? '').trim()
  const coachContext = (fields.coach_context ?? '').trim()

  if (!currentLevel || !nextLevel) {
    return {
      ok: false,
      status: 'error',
      message: 'Current level and target next level are both required.',
    }
  }

  // Read player curriculum state — sequential per AI_BACKEND_RULES
  const { data: curriculumState } = await rawDb
    .from('player_curriculum_states')
    .select('advancement_eligible, advancement_blocked_by, current_level_id')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .maybeSingle()

  // Read latest assessment — sequential
  const { data: latestAssessment } = await rawDb
    .from('assessments')
    .select('overall_score, promotion_ready, promotion_notes, strengths, priorities')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Build deterministic evidence summary — no AI
  const evidencePresent: string[] = []
  const evidenceMissing: string[] = []

  if (curriculumState?.advancement_eligible === true) {
    evidencePresent.push('Curriculum system marks this player as advancement-eligible')
  } else if (curriculumState?.advancement_eligible === false) {
    evidenceMissing.push('Curriculum system does not yet mark this player as advancement-eligible')
  } else {
    evidenceMissing.push('No curriculum state found — level assignment may not be confirmed')
  }

  if (Array.isArray(curriculumState?.advancement_blocked_by) && curriculumState.advancement_blocked_by.length > 0) {
    for (const block of curriculumState.advancement_blocked_by) {
      evidenceMissing.push(`Blocked by: ${String(block)}`)
    }
  }

  if (latestAssessment) {
    if (latestAssessment.promotion_ready === true) {
      evidencePresent.push('Latest assessment indicates promotion-ready')
    } else if (latestAssessment.promotion_ready === false) {
      evidenceMissing.push('Latest assessment does not indicate promotion-ready')
    }
    if (latestAssessment.overall_score != null) {
      evidencePresent.push(`Latest assessment overall score: ${latestAssessment.overall_score}`)
    }
    if (latestAssessment.promotion_notes) {
      evidencePresent.push(`Assessment note: ${String(latestAssessment.promotion_notes).slice(0, 200)}`)
    }
  } else {
    evidenceMissing.push('No formal assessment found — complete an assessment before advancing')
  }

  if (gateEvidence) {
    evidencePresent.push(`Director-provided gate evidence: ${gateEvidence}`)
  } else {
    evidenceMissing.push('No gate evidence provided by director')
  }

  if (coachContext) {
    evidencePresent.push(`Coach context: ${coachContext}`)
  }

  const evidenceLines = [
    ...evidencePresent.map(e => `PRESENT: ${e}`),
    ...evidenceMissing.map(e => `MISSING: ${e}`),
  ]

  const readinessSummary =
    evidenceLines.length > 0
      ? evidenceLines.join('\n')
      : 'Insufficient evidence to assess readiness — please complete a formal assessment.'

  const rawInput = [
    `Player: ${playerLabel}`,
    `Current level: ${currentLevel}`,
    `Target level: ${nextLevel}`,
    gateEvidence ? `Gate evidence: ${gateEvidence}` : null,
    coachContext ? `Coach context: ${coachContext}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  // Insert voice_commands row (required FK for proposed_actions)
  const { data: voiceCommand, error: vcError } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: userId,
      issuer_role: role as any,
      input_method: 'typed',
      raw_input: rawInput,
      transcript: rawInput,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return {
      ok: false,
      status: 'error',
      message: `Failed to create command record: ${vcError?.message ?? 'unknown'}`,
    }
  }

  const payload = {
    draft_type: 'level_readiness_v1',
    source: 'donna_assistant',
    player_id: confirmedPlayerId,
    player_label: playerLabel,
    current_level: currentLevel,
    next_level: nextLevel,
    gate_evidence: gateEvidence || null,
    coach_context: coachContext || null,
    readiness_summary: readinessSummary,
    evidence_present: evidencePresent,
    evidence_missing: evidenceMissing,
    warnings: [
      'Readiness review only — player level has NOT been changed.',
      'Director must explicitly approve advancement from this review.',
      'No parent, player, or coach has been notified.',
    ],
  }

  const { data: proposedAction, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: userId,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: `Level Readiness Review — ${playerLabel} → ${nextLevel}`,
      target_module: 'level_review',
      target_object_id: confirmedPlayerId,
      target_object_type: 'player',
      proposed_payload: payload as unknown as Json,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: [
        'Review only. Player level was NOT changed.',
        'Director must explicitly approve advancement.',
        'No notifications sent.',
      ],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    return {
      ok: false,
      status: 'error',
      message: `Failed to save draft: ${paError?.message ?? 'unknown'}`,
    }
  }

  revalidatePath('/director/review')
  revalidatePath(`/director/players/${confirmedPlayerId}`)

  return {
    ok: true,
    status: 'saved',
    message: `Level readiness review for "${playerLabel}" saved for director decision.`,
    createdId: proposedAction.id as string,
    safetyNotes: [
      `Evidence found: ${evidencePresent.length} item(s).`,
      `Evidence missing: ${evidenceMissing.length} item(s).`,
      'Player level has NOT been changed.',
      'No parent, player, or coach has been notified.',
      'Review this draft in the Review Queue and make your advancement decision there.',
    ],
  }
}

// ---------------------------------------------------------------------------
// saveCurriculumAdjustmentDraftAction — Sprint 277
//
// Saves a curriculum adjustment proposal to proposed_actions.
// Does NOT write to any curriculum table.
// No curriculum data changes until director explicitly approves.
// ---------------------------------------------------------------------------

export async function saveCurriculumAdjustmentDraftAction(
  fields: Record<string, string>,
): Promise<DonnaApprovalExecutionResult> {
  if (await isPreviewMode()) {
    return { ok: false, status: 'blocked', message: 'Writes are disabled in preview mode.' }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) return { ok: false, status: 'blocked', message: ctx.error }

  const { supabase, userId, academyId, role } = ctx
  const rawDb = supabase as any

  const adjustmentType = (fields.adjustment_type ?? '').trim()
  const targetLevel = (fields.target_level ?? '').trim()
  const proposedChange = (fields.proposed_change ?? '').trim()
  const reason = (fields.reason ?? '').trim()
  const affectedPlayers = (fields.affected_players ?? '').trim()

  if (!adjustmentType || !targetLevel || !proposedChange) {
    return {
      ok: false,
      status: 'error',
      message: 'Adjustment type, target level, and proposed change are all required.',
    }
  }

  const rawInput = [
    `Adjustment type: ${adjustmentType}`,
    `Target level: ${targetLevel}`,
    `Proposed change: ${proposedChange}`,
    reason ? `Reason: ${reason}` : null,
    affectedPlayers ? `Affected players: ${affectedPlayers}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  // Insert voice_commands row (required FK for proposed_actions)
  const { data: voiceCommand, error: vcError } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: userId,
      issuer_role: role as any,
      input_method: 'typed',
      raw_input: rawInput,
      transcript: rawInput,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return {
      ok: false,
      status: 'error',
      message: `Failed to create command record: ${vcError?.message ?? 'unknown'}`,
    }
  }

  const payload = {
    draft_type: 'curriculum_adjustment_v1',
    source: 'donna_assistant',
    adjustment_type: adjustmentType,
    target_level: targetLevel,
    proposed_change: proposedChange,
    reason: reason || null,
    affected_players: affectedPlayers || null,
    warnings: [
      'Proposal only — curriculum data has NOT been changed.',
      'Director must explicitly approve this adjustment before any curriculum table is modified.',
      'No template, player requirement, or session was modified.',
    ],
  }

  const { data: proposedAction, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: userId,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: `Curriculum Adjustment — ${adjustmentType} — ${targetLevel}`,
      target_module: 'curriculum_adjustment',
      target_object_id: null,
      target_object_type: 'curriculum',
      proposed_payload: payload as unknown as Json,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: [
        'Proposal only. No curriculum data was changed.',
        'Director review required before any adjustment is applied.',
        'No player requirements or sessions were modified.',
      ],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    return {
      ok: false,
      status: 'error',
      message: `Failed to save draft: ${paError?.message ?? 'unknown'}`,
    }
  }

  revalidatePath('/director/review')

  return {
    ok: true,
    status: 'saved',
    message: 'Curriculum adjustment proposal saved for director review.',
    createdId: proposedAction.id as string,
    safetyNotes: [
      'Proposal only — no curriculum data has been changed.',
      'No player requirements, templates, or sessions were modified.',
      'Director must explicitly approve this adjustment in the Review Queue.',
      'No coach, parent, or player has been notified.',
    ],
  }
}

// ---------------------------------------------------------------------------
// fetchPlayerProgressSummaryAction — Sprint 400
//
// Read-only server action. Reads player curriculum state, latest assessment,
// recent coach observations, and active priorities — then returns a structured
// deterministic summary for display in the DONNA panel.
//
// Security guarantees:
//   - NO proposed_actions write
//   - NO voice_commands write
//   - NO player profile mutation
//   - NO level movement
//   - NO parent/player exposure
//   - All reads are scoped to academy_id
//   - Summary is displayed only in the director-facing DONNA panel
// ---------------------------------------------------------------------------

export async function fetchPlayerProgressSummaryAction(
  fields: Record<string, string>,
): Promise<DonnaApprovalExecutionResult> {
  if (await isPreviewMode()) {
    return { ok: false, status: 'blocked', message: 'Writes are disabled in preview mode.' }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) return { ok: false, status: 'blocked', message: ctx.error }

  const { supabase, academyId } = ctx
  const rawDb = supabase as any

  const confirmedPlayerId = (fields._resolved_player_id ?? '').trim() || null
  if (!confirmedPlayerId) {
    return {
      ok: false,
      status: 'blocked',
      message:
        'Please confirm the player before generating a summary. Use the resolver panel to search and select a player.',
    }
  }

  const playerLabel = (fields.player ?? '').replace(/\s*✓$/, '').trim() || 'this player'
  const summaryFor = (fields.summary_for ?? '').trim() || 'director reference'

  // Step 1 — Player name (scoped to academy_id)
  const { data: playerRow } = await rawDb
    .from('players')
    .select('first_name, full_name')
    .eq('id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .single()

  // Step 2 — Curriculum state (scoped to academy_id)
  const { data: curriculumState } = await rawDb
    .from('player_curriculum_states')
    .select('current_level_id, advancement_eligible, advancement_blocked_by')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .maybeSingle()

  // Step 3 — Latest assessment (scoped to academy_id)
  const { data: latestAssessment } = await rawDb
    .from('assessments')
    .select('overall_score, promotion_ready, strengths, priorities')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Step 4 — Recent coach observations: last 5 (scoped to academy_id)
  const { data: observationsRaw } = await rawDb
    .from('coach_observations')
    .select('content, observation_type, created_at')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })
    .limit(5)
  const observations: any[] = observationsRaw ?? []

  // Step 5 — Active priorities: top 3 (scoped to academy_id)
  const { data: prioritiesRaw } = await rawDb
    .from('player_priorities')
    .select('title, category, status')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .eq('status', 'active')
    .limit(3)
  const priorities: any[] = prioritiesRaw ?? []

  // Build deterministic summary — no AI, no external API
  const firstName: string =
    (playerRow?.first_name as string | null) ??
    ((playerRow?.full_name as string | null)?.split(' ')[0]) ??
    playerLabel.split(' ')[0] ??
    'Player'

  const levelLabel: string = curriculumState?.current_level_id
    ? `Level ID: ${curriculumState.current_level_id}`
    : 'Level not assigned'

  const advancementStatus: string =
    curriculumState?.advancement_eligible === true
      ? 'Eligible for advancement'
      : curriculumState?.advancement_eligible === false
      ? 'Not yet eligible for advancement'
      : 'Advancement status unknown'

  const observationHighlights: string[] = observations
    .slice(0, 3)
    .map((o: any) => String(o.content ?? o.observation_type ?? '').slice(0, 150))
    .filter(Boolean)

  const prioritySummary: string[] = priorities
    .map((p: any) => String(p.title ?? p.category ?? '').slice(0, 100))
    .filter(Boolean)

  const assessmentLine: string =
    latestAssessment?.overall_score != null
      ? `Latest assessment score: ${latestAssessment.overall_score}`
      : 'No formal assessment on record'

  const summaryLines: string[] = [
    `Player: ${firstName}`,
    `Curriculum: ${levelLabel}`,
    `Advancement: ${advancementStatus}`,
    assessmentLine,
    ...(observationHighlights.length > 0 ? [`Recent observations (${observationHighlights.length}):`] : []),
    ...observationHighlights.map((o: string) => `• ${o}`),
    ...(prioritySummary.length > 0 ? ['Active priorities:'] : []),
    ...prioritySummary.map((p: string) => `• ${p}`),
  ]

  const progressSummary = summaryLines.join('\n')

  return {
    ok: true,
    status: 'saved',
    message: progressSummary,
    createdId: undefined,
    safetyNotes: [
      'Read-only summary — no data was written or changed.',
      `Summary prepared for: ${summaryFor}`,
      'Review required before sharing with parent, player, or coach.',
      'Not parent-facing until director explicitly approves communication.',
      'No player level, profile, or proposed action was modified.',
    ],
  }
}
