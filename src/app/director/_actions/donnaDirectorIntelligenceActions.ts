'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { isPreviewMode } from '@/lib/utils/previewMode'
import type { Json } from '@/lib/supabase/database.types'
import type { DonnaApprovalExecutionResult } from '@/components/assistant/donnaApprovalExecutionTypes'
import { buildParentSupportGuidanceDraft, sanitizeParentFacingText } from '@/lib/communications/parentSafeResponseRules'
import {
  computeAttendanceKpis,
  formatAttendanceKpisForDonna,
  type AttendanceRow,
  type SessionRow,
} from '@/lib/kpi/attendanceKpiEngine'
import {
  computeDevelopmentHealth,
  formatDevelopmentHealthForDonna,
  type DevelopmentHealthInput,
} from '@/lib/kpi/developmentHealthKpiEngine'
import {
  computeDevelopmentVelocityKpis,
  formatDevelopmentVelocityForDonna,
  type HistoryRow,
  type DevelopmentVelocityInput,
} from '@/lib/kpi/developmentVelocityKpiEngine'
import {
  computeEvidenceCoverageKpis,
  formatEvidenceCoverageForDonna,
  type GateRow,
  type GateStatusRow,
  type EvidenceCoverageInput,
} from '@/lib/kpi/evidenceCoverageKpiEngine'
import {
  computeSessionYield,
  formatSessionYieldForDonna,
  type YieldInput,
} from '@/lib/kpi/curriculumCoverageKpiEngine'
import {
  computeObservationQuality,
  computeRecapCompletionRate,
  formatCoachExecutionForDonna,
  type ObservationRow as CoachObsRow,
  type RecapCheckRow,
} from '@/lib/kpi/coachExecutionKpiEngine'
import {
  computeParentTrustCoverage,
  formatParentTrustForDonna,
  type ParentUpdateRow,
  type ParentTrustInput,
} from '@/lib/kpi/parentTrustKpiEngine'
import {
  computeDropoutRisk,
  formatRetentionForDonna,
  type DropoutRiskInput,
} from '@/lib/kpi/retentionKpiEngine'

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

  // Parse update_focus into focus keywords — max 3 terms (kept for short-form fallback)
  const focusKeywords = updateFocus
    .split(/[,;]+/)
    .map((s: string) => s.trim())
    .filter(Boolean)
    .slice(0, 3)

  // Step A — Curriculum level (for "what's next" context)
  const { data: curriculumState } = await rawDb
    .from('player_curriculum_states')
    .select('current_level_id, advancement_eligible')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .maybeSingle()

  // Step B — Active priorities (what the player is working on)
  // Columns: title, description, status, is_active, priority_rank, category
  const { data: priorities } = await rawDb
    .from('player_priorities')
    .select('title, description, status, priority_rank, category')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .eq('status', 'active')
    .order('priority_rank', { ascending: true })
    .limit(2)

  // Step C — Latest assessment (strengths and priorities — both string[] | null)
  const { data: latestAssessment } = await rawDb
    .from('assessments')
    .select('strengths, priorities, overall_score, promotion_notes')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Step D — Recent non-private coach observation (sanitized — internal text never exposed raw)
  const { data: recentObservations } = await rawDb
    .from('coach_observations')
    .select('content, observation_type')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .eq('is_private', false)
    .order('created_at', { ascending: false })
    .limit(1)

  // ── Section 1: Working on (from active priorities, sanitized) ───────────────
  const workingOnItems = ((priorities ?? []) as Array<{ title: string; description: string | null }>)
    .map((p) => {
      const text = String(p.title ?? p.description ?? '').slice(0, 120)
      return sanitizeParentFacingText(text)
    })
    .filter(Boolean)

  const workingOn =
    workingOnItems.length > 0
      ? `${firstName} is currently focused on: ${workingOnItems.join(', ')}.`
      : `${firstName} is continuing to develop their tennis skills across key technical areas.`

  // ── Section 2: What improved (from assessment strengths, sanitized) ──────────
  const strengthsRaw = Array.isArray(latestAssessment?.strengths)
    ? (latestAssessment.strengths as string[]).map((s) => String(s)).slice(0, 2)
    : latestAssessment?.strengths
      ? [String(latestAssessment.strengths).slice(0, 200)]
      : []

  const improved =
    strengthsRaw.length > 0
      ? `Recent assessment highlights include: ${strengthsRaw.map((s) => sanitizeParentFacingText(s)).filter(Boolean).join('; ')}.`
      : 'Progress is steady — we continue to track improvement across training sessions.'

  // ── Section 3: Needs continued support (from assessment priorities, sanitized)
  const assessmentPrioritiesRaw = Array.isArray(latestAssessment?.priorities)
    ? (latestAssessment.priorities as string[]).slice(0, 1).join(', ')
    : latestAssessment?.priorities
      ? String(latestAssessment.priorities).slice(0, 200)
      : null

  const needsSupport = assessmentPrioritiesRaw
    ? `Areas to continue working on: ${sanitizeParentFacingText(assessmentPrioritiesRaw)}.`
    : `${firstName} is working through the natural challenges of their current level — continued practice and patience will help.`

  // ── Section 4: How parent can help ──────────────────────────────────────────
  const parentCanDo =
    workingOnItems.length > 0
      ? `You can support ${firstName} by encouraging regular practice of ${workingOnItems[0] ?? 'their current focus'}. Ask them about their sessions — curiosity and encouragement go a long way.`
      : `You can support ${firstName} by encouraging them to talk about what they're working on in training. Your enthusiasm makes a real difference.`

  // ── Section 5: What's next (from curriculum advancement eligibility) ─────────
  const advancementEligible = curriculumState?.advancement_eligible === true
  const whatsNext = advancementEligible
    ? `${firstName} is approaching readiness for advancement — we will review together before any changes are made.`
    : `${firstName} is continuing to build their skills at their current level. We will assess progress at the next scheduled review.`

  // ── Build structured 5-section draft text ────────────────────────────────────
  const structuredDraftText = [
    `Parent Update — ${firstName}`,
    '',
    `WHAT ${firstName.toUpperCase()} IS WORKING ON:`,
    workingOn,
    '',
    'WHAT HAS IMPROVED:',
    improved,
    '',
    'WHAT NEEDS CONTINUED SUPPORT:',
    needsSupport,
    '',
    'HOW YOU CAN HELP:',
    parentCanDo,
    '',
    "WHAT'S NEXT:",
    whatsNext,
  ].join('\n')

  // Short-form draft kept for reference (unused in primary payload)
  void buildParentSupportGuidanceDraft({
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
    draft_type: 'parent_update_v2',
    source: 'donna_assistant',
    player_id: confirmedPlayerId,
    player_label: playerLabel,
    update_focus: updateFocus,
    tone: tone || null,
    draft_text: structuredDraftText,
    draft_sections: {
      working_on: workingOn,
      improved,
      needs_support: needsSupport,
      parent_can_do: parentCanDo,
      whats_next: whatsNext,
    },
    has_assessment: !!latestAssessment,
    has_priorities: ((priorities as unknown[]) ?? []).length > 0,
    advancement_eligible: curriculumState?.advancement_eligible ?? null,
    warnings: [
      'Draft only — not sent to parent.',
      'Director must explicitly approve and send from the parent communication module.',
      'No raw internal coach notes were included in this draft.',
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
      "Structured in 5 sections: working on, improved, needs support, parent can do, what's next.",
      `Only public (non-private) coach observations used — ${((recentObservations as unknown[]) ?? []).length} observation(s) referenced.`,
      'All content passed through the parent-safe sanitizer — internal jargon and raw scores excluded.',
      'No parent or player visibility was changed.',
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

  // Step 1 — Player name + group (scoped to academy_id)
  // is_active added Sprint 429 for dropout risk KPI
  const { data: playerRow } = await rawDb
    .from('players')
    .select('first_name, full_name, current_group_id, is_active')
    .eq('id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .single()

  // Step 2 — Curriculum state (scoped to academy_id)
  // enrolled_at added Sprint 422 for time-in-level health KPI
  // last_evaluated_at added Sprint 423 for velocity KPI context
  const { data: curriculumState } = await rawDb
    .from('player_curriculum_states')
    .select('current_level_id, advancement_eligible, advancement_blocked_by, enrolled_at, last_evaluated_at')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .maybeSingle()

  // Step 2b — Resolve curriculum level display name (Sprint 459)
  let curriculumLevelName: string | null = null
  if (curriculumState?.current_level_id) {
    const { data: levelRow } = await rawDb
      .from('curriculum_levels')
      .select('display_name, stage')
      .eq('id', curriculumState.current_level_id)
      .maybeSingle()
    if (levelRow?.display_name) {
      curriculumLevelName = String(levelRow.display_name)
      if (levelRow.stage) {
        curriculumLevelName += ` (${levelRow.stage})`
      }
    }
  }

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
  // tags and ai_parsed added Sprint 426 for observation quality KPI
  const { data: observationsRaw } = await rawDb
    .from('coach_observations')
    .select('content, observation_type, created_at, tags, ai_parsed')
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

  // Step 6 — Attendance KPIs: last 30 days, scoped via sessions.academy_id
  // session_attendance has no academy_id — must join through sessions.
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

  const { data: playerAttendanceRaw } = await rawDb
    .from('session_attendance')
    .select('player_id, session_id, status, marked_at, sessions!inner(academy_id)')
    .eq('player_id', confirmedPlayerId)
    .eq('sessions.academy_id', academyId)
    .gte('marked_at', thirtyDaysAgoStr)
  const playerAttendance: AttendanceRow[] = (playerAttendanceRaw ?? []).map((a: any) => ({
    player_id: String(a.player_id),
    session_id: String(a.session_id),
    status: String(a.status ?? ''),
    marked_at: String(a.marked_at ?? ''),
  }))

  // Group sessions (last 30 days) — player's current group defines the expected roster
  const playerGroupId: string | null =
    typeof playerRow?.current_group_id === 'string' ? playerRow.current_group_id : null
  let groupSessions: SessionRow[] = []
  if (playerGroupId) {
    const { data: groupSessionsRaw } = await rawDb
      .from('sessions')
      .select('id, scheduled_date, group_id')
      .eq('academy_id', academyId)
      .eq('group_id', playerGroupId)
      .gte('scheduled_date', thirtyDaysAgoStr)
      .order('scheduled_date', { ascending: false })
    groupSessions = (groupSessionsRaw ?? []).map((s: any) => ({
      id: String(s.id),
      scheduled_date: String(s.scheduled_date),
      group_id: s.group_id ? String(s.group_id) : null,
    }))
  }

  // Follow-up proposed_actions for KPI 9 (parent_communication or attendance_exception modules)
  const { data: followUpsRaw } = await rawDb
    .from('proposed_actions')
    .select('created_at')
    .eq('academy_id', academyId)
    .eq('target_object_id', confirmedPlayerId)
    .in('target_module', ['parent_communication', 'attendance_exception'])
    .gte('created_at', thirtyDaysAgoStr)
  const followUpDates: string[] = (followUpsRaw ?? []).map((f: any) => String(f.created_at ?? ''))

  const attendanceKpiResults = computeAttendanceKpis({
    playerId: confirmedPlayerId,
    playerAttendance,
    groupSessions,
    followUpCreatedAtDates: followUpDates,
    windowDays: 30,
  })
  const attendanceLines = formatAttendanceKpisForDonna(attendanceKpiResults)

  // Step 7 — Development Health KPI inputs (Sprint 422)
  // Fetch active high-severity signals + most recent parent update draft
  const { data: activeSignalsRaw } = await rawDb
    .from('player_development_signals')
    .select('title, severity')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .eq('severity', 'high')
    .limit(5)
  const activeSignalTitles: string[] = (activeSignalsRaw ?? []).map((s: any) => String(s.title ?? ''))

  // Fetch all parent updates in last 60 days for parent trust KPI (Sprint 427)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  const { data: parentUpdatesRaw } = await rawDb
    .from('parent_updates')
    .select('created_at, status, sent_at')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .gte('created_at', sixtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
  const parentUpdateRows: ParentUpdateRow[] = (parentUpdatesRaw ?? []).map((u: any) => ({
    created_at: String(u.created_at ?? ''),
    status: String(u.status ?? ''),
    sent_at: u.sent_at ? String(u.sent_at) : null,
  }))
  const lastParentUpdateAt: string | null =
    parentUpdateRows.length > 0 ? parentUpdateRows[0].created_at : null

  const lastObservationAt: string | null =
    observations.length > 0 && observations[0]?.created_at
      ? String(observations[0].created_at)
      : null

  const healthInput: DevelopmentHealthInput = {
    playerId: confirmedPlayerId,
    attendanceRatePct: attendanceKpiResults[0]?.value ?? null,
    missedStreak: attendanceKpiResults[1]?.value ?? null,
    recentAbsenceCount: attendanceKpiResults[2]?.value ?? null,
    enrolledAt: curriculumState?.enrolled_at ? String(curriculumState.enrolled_at) : null,
    advancementEligible: curriculumState?.advancement_eligible ?? null,
    lastObservationAt,
    hasActiveHighSeveritySignal: activeSignalTitles.length > 0,
    activeSignalTitles,
    lastParentUpdateAt,
  }
  const developmentHealthResult = computeDevelopmentHealth(healthInput)
  const developmentHealthLines = formatDevelopmentHealthForDonna(developmentHealthResult)

  // Step 8 — Development Velocity KPIs: time in level + advancement history (Sprint 423)
  const { data: curriculumHistoryRaw } = await rawDb
    .from('player_curriculum_history')
    .select('from_level_id, to_level_id, advanced_at')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .order('advanced_at', { ascending: true })
  const curriculumHistory: HistoryRow[] = (curriculumHistoryRaw ?? []).map((h: any) => ({
    from_level_id: h.from_level_id ? String(h.from_level_id) : null,
    to_level_id: String(h.to_level_id ?? ''),
    advanced_at: String(h.advanced_at ?? ''),
  }))

  const velocityInput: DevelopmentVelocityInput = {
    enrolledAt: curriculumState?.enrolled_at ? String(curriculumState.enrolled_at) : null,
    advancementEligible: curriculumState?.advancement_eligible ?? null,
    lastEvaluatedAt: curriculumState?.last_evaluated_at ? String(curriculumState.last_evaluated_at) : null,
    history: curriculumHistory,
  }
  const velocityKpiResults = computeDevelopmentVelocityKpis(velocityInput)
  const velocityLines = formatDevelopmentVelocityForDonna(velocityKpiResults)

  // Step 9 — Evidence Coverage KPIs: curriculum gates + player gate status (Sprint 424)
  // curriculum_gates queried by from_level_id = player's current level
  // player_gate_status queried by player_id + academy_id
  // If no gates exist (migrations 041–044 not applied to live DB), returns insufficient_data honestly
  const currentLevelId: string | null =
    curriculumState?.current_level_id ? String(curriculumState.current_level_id) : null

  let levelGates: GateRow[] = []
  if (currentLevelId) {
    const { data: levelGatesRaw } = await rawDb
      .from('curriculum_gates')
      .select('gate_id, criterion, domain, is_active')
      .eq('from_level_id', currentLevelId)
    levelGates = (levelGatesRaw ?? []).map((g: any) => ({
      gate_id: String(g.gate_id ?? ''),
      criterion: String(g.criterion ?? ''),
      domain: String(g.domain ?? ''),
      is_active: Boolean(g.is_active),
    }))
  }

  const { data: playerGateStatusesRaw } = await rawDb
    .from('player_gate_status')
    .select('gate_id, evidence_count, status, last_evidence_at')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
  const playerGateStatuses: GateStatusRow[] = (playerGateStatusesRaw ?? []).map((s: any) => ({
    gate_id: String(s.gate_id ?? ''),
    evidence_count: Number(s.evidence_count ?? 0),
    status: String(s.status ?? ''),
    last_evidence_at: s.last_evidence_at ? String(s.last_evidence_at) : null,
  }))

  const evidenceInput: EvidenceCoverageInput = {
    playerId: confirmedPlayerId,
    currentLevelId,
    levelGates,
    playerGateStatuses,
    advancementEligible: curriculumState?.advancement_eligible ?? null,
    lastEvaluatedAt: curriculumState?.last_evaluated_at ? String(curriculumState.last_evaluated_at) : null,
  }
  const evidenceKpiResults = computeEvidenceCoverageKpis(evidenceInput)
  const evidenceLines = formatEvidenceCoverageForDonna(evidenceKpiResults)

  // Step 10 — Session Development Yield (KPI 25, Sprint 425)
  // Fetch observation session_ids for this player in the last 30 days to compute
  // what fraction of attended sessions had a coach observation recorded.
  const { data: observationSessionsRaw } = await rawDb
    .from('coach_observations')
    .select('session_id')
    .eq('player_id', confirmedPlayerId)
    .eq('academy_id', academyId)
    .gte('created_at', thirtyDaysAgoStr)
    .not('session_id', 'is', null)
  const observedSessionIds: string[] = (observationSessionsRaw ?? [])
    .map((o: any) => String(o.session_id ?? ''))
    .filter(Boolean)

  const ATTENDED_STATUSES_SET = new Set(['present', 'attended', 'late'])
  const attendedSessionIds: string[] = playerAttendance
    .filter(a => ATTENDED_STATUSES_SET.has(a.status.toLowerCase()))
    .map(a => a.session_id)

  const yieldInput: YieldInput = {
    playerId: confirmedPlayerId,
    attendedSessionIds,
    observedSessionIds,
    windowDays: 30,
  }
  const sessionYieldResult = computeSessionYield(yieldInput)
  const sessionYieldLines = formatSessionYieldForDonna(sessionYieldResult)

  // Step 11 — Coach Observation Quality (KPI 19, Sprint 426)
  // Derived from observations already fetched in Step 4 — no additional DB query needed.
  const coachObsRows: CoachObsRow[] = observations.map((o: any) => ({
    content: String(o.content ?? ''),
    observation_type: String(o.observation_type ?? ''),
    created_at: String(o.created_at ?? ''),
    tags: Array.isArray(o.tags) ? (o.tags as string[]) : null,
    ai_parsed: Boolean(o.ai_parsed),
  }))
  const observationQualityResult = computeObservationQuality(coachObsRows, 30)
  const coachExecutionLines = formatCoachExecutionForDonna([observationQualityResult])

  // Step 12 — Parent Trust Coverage (KPI 21, Sprint 427)
  // Uses parent_updates fetched in Step 7 (expanded to 60-day window with status field).
  const parentTrustInput: ParentTrustInput = {
    playerId: confirmedPlayerId,
    playerParentUpdates: parentUpdateRows,
    windowDays: 60,
  }
  const parentTrustResult = computeParentTrustCoverage(parentTrustInput)
  const parentTrustLines = formatParentTrustForDonna(parentTrustResult)

  // Step 13 — Dropout Risk Signal (Sprint 429)
  // Derived from development health score + missed streak — no extra DB query.
  const dropoutRiskInput: DropoutRiskInput = {
    playerId: confirmedPlayerId,
    isActive: playerRow?.is_active !== false,  // default true if null
    missedStreak: attendanceKpiResults[1]?.value ?? null,
    developmentHealthScore: developmentHealthResult.riskScore,
    daysSinceLastObservation: lastObservationAt
      ? Math.round((Date.now() - new Date(lastObservationAt).getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }
  const dropoutRiskResult = computeDropoutRisk(dropoutRiskInput)
  const retentionLines = formatRetentionForDonna(dropoutRiskResult)

  // Step 14 — Coach Recap Completion Rate (KPI 4, Sprint 449)
  // Checks which of the player's group sessions in the last 30 days have a voice_note (recap proxy).
  // voice_notes are scoped to academy_id; session_id links note to session.
  let recapCompletionLines: string[] = []
  if (groupSessions.length > 0) {
    const groupSessionIds = groupSessions.map(s => s.id)
    const { data: voiceNoteSessionIds } = await rawDb
      .from('voice_notes')
      .select('session_id')
      .eq('academy_id', academyId)
      .in('session_id', groupSessionIds)
      .not('session_id', 'is', null)
    const recapSessionSet = new Set<string>(
      ((voiceNoteSessionIds ?? []) as Array<{ session_id: string | null }>)
        .map(r => r.session_id)
        .filter((id): id is string => id !== null)
    )
    const recapCheckRows: RecapCheckRow[] = groupSessionIds.map(id => ({
      session_id: id,
      has_note: recapSessionSet.has(id),
    }))
    const recapCompletionResult = computeRecapCompletionRate(recapCheckRows, 30)
    recapCompletionLines = formatCoachExecutionForDonna([recapCompletionResult])
  }

  // Build deterministic summary — no AI, no external API
  const firstName: string =
    (playerRow?.first_name as string | null) ??
    ((playerRow?.full_name as string | null)?.split(' ')[0]) ??
    playerLabel.split(' ')[0] ??
    'Player'

  const levelLabel: string = curriculumLevelName
    ? `Level: ${curriculumLevelName}`
    : curriculumState?.current_level_id
    ? `Level assigned (name unavailable)`
    : 'Level not assigned'

  // Compute time-in-level days from enrolled_at (Sprint 460)
  const daysInLevel: number | null = curriculumState?.enrolled_at
    ? Math.floor((Date.now() - new Date(String(curriculumState.enrolled_at)).getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Build advancement status with blockers and time context (Sprint 460)
  let advancementStatus: string
  if (!curriculumState) {
    advancementStatus = 'Advancement status unknown — no curriculum state found.'
  } else if (curriculumState.advancement_eligible === true) {
    const timePart = daysInLevel !== null ? ` (${daysInLevel} days at this level)` : ''
    advancementStatus = `Eligible for advancement${timePart}.`
  } else if (curriculumState.advancement_eligible === false) {
    const blockers = curriculumState.advancement_blocked_by
    let blockerText = ''
    if (Array.isArray(blockers) && blockers.length > 0) {
      blockerText = ` Blocked by: ${(blockers as string[]).slice(0, 3).join(', ')}.`
    } else if (typeof blockers === 'string' && blockers) {
      blockerText = ` Blocked by: ${blockers}.`
    }
    const timePart = daysInLevel !== null ? ` ${daysInLevel} days at this level.` : ''
    advancementStatus = `Not yet eligible for advancement.${blockerText}${timePart}`
  } else {
    advancementStatus = 'Advancement eligibility not evaluated.'
  }

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

  const dataGaps: string[] = []
  if (!curriculumState) dataGaps.push('Curriculum state not set — assign a curriculum level to enable advancement tracking.')
  if (!latestAssessment) dataGaps.push('No assessment on record — an assessment is needed to evaluate readiness.')
  if (observations.length === 0) dataGaps.push('No recent coach observations — ask coaches to log observations after sessions.')
  if (priorities.length === 0) dataGaps.push('No active priorities set — add player priorities to guide coaching focus.')

  const summaryLines: string[] = [
    `Player: ${firstName}`,
    `Curriculum: ${levelLabel}`,
    `Advancement: ${advancementStatus}`,
    assessmentLine,
    ...(observationHighlights.length > 0 ? [`Recent observations (${observationHighlights.length}):`] : []),
    ...observationHighlights.map((o: string) => `• ${o}`),
    ...(prioritySummary.length > 0 ? ['Active priorities:'] : []),
    ...prioritySummary.map((p: string) => `• ${p}`),
    ...attendanceLines,
    ...developmentHealthLines,
    ...velocityLines,
    ...evidenceLines,
    ...sessionYieldLines,
    ...coachExecutionLines,
    ...recapCompletionLines,
    ...parentTrustLines,
    ...(dataGaps.length > 0 ? ['', 'DATA GAPS:'] : []),
    ...dataGaps.map((g: string) => `⚠ ${g}`),
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

// ---------------------------------------------------------------------------
// fetchSessionBriefAction — Sprint 401
//
// Reads session, session_blocks, coach profile, and group — returns a
// structured pre-session brief as plain text in the DONNA panel.
// Zero DB writes. Zero migrations. All reads scoped to academy_id.
// ---------------------------------------------------------------------------

export async function fetchSessionBriefAction(
  fields: Record<string, string>,
): Promise<DonnaApprovalExecutionResult> {
  if (await isPreviewMode()) {
    return { ok: false, status: 'blocked', message: 'Writes are disabled in preview mode.' }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) return { ok: false, status: 'blocked', message: ctx.error }

  const { supabase, academyId } = ctx
  const rawDb = supabase as any

  const confirmedSessionId = (fields._resolved_session_id ?? '').trim() || null
  if (!confirmedSessionId) {
    return {
      ok: false,
      status: 'blocked',
      message:
        'Please confirm the session before generating a brief. Use the resolver panel to search and select a session.',
    }
  }

  const focusNotes = (fields.focus_notes ?? '').trim()

  // Step 1 — Read session
  const { data: session } = await rawDb
    .from('sessions')
    .select('id, name, scheduled_date, status, coach_id, group_id, session_notes')
    .eq('id', confirmedSessionId)
    .eq('academy_id', academyId)
    .maybeSingle()

  if (!session) {
    return {
      ok: false,
      status: 'error',
      message: 'Session not found or you do not have access to this session.',
    }
  }

  // Step 2 — Read session blocks
  const { data: blocks } = await rawDb
    .from('session_blocks')
    .select('name, duration_min, order_index, type')
    .eq('session_id', confirmedSessionId)
    .order('order_index', { ascending: true })

  // Step 3 — Read coach name (if coach_id present)
  let coachName = 'Coach not assigned'
  if (session.coach_id) {
    const { data: coachProfile } = await rawDb
      .from('profiles')
      .select('full_name, first_name')
      .eq('id', session.coach_id)
      .maybeSingle()
    if (coachProfile) {
      coachName = coachProfile.full_name ?? coachProfile.first_name ?? coachName
    }
  }

  // Step 4 — Read group name (if group_id present)
  let groupName = 'Group not assigned'
  if (session.group_id) {
    const { data: group } = await rawDb
      .from('groups')
      .select('name')
      .eq('id', session.group_id)
      .maybeSingle()
    if (group?.name) groupName = String(group.name)
  }

  // Build structured brief — no AI, no external API
  const sessionTitle = session.name ?? `Session on ${session.scheduled_date ?? 'Unknown date'}`
  const blockLines =
    Array.isArray(blocks) && blocks.length > 0
      ? blocks.map((b: any) => {
          const dur = b.duration_min ? ` (${b.duration_min}min)` : ''
          const type = b.type ? ` [${b.type}]` : ''
          return `• ${String(b.name ?? 'Unnamed block')}${dur}${type}`
        })
      : ['• No blocks assigned to this session yet']

  const sessionDataGaps: string[] = []
  if (coachName === 'Coach not assigned') sessionDataGaps.push('No coach assigned — assign a coach to this session before sharing a brief.')
  if (!Array.isArray(blocks) || blocks.length === 0) sessionDataGaps.push('No session blocks planned — add blocks from a template before the brief is meaningful.')
  if (groupName === 'Group not assigned') sessionDataGaps.push('No group assigned — a player group is needed to give the coach attendance context.')

  const briefLines = [
    `SESSION: ${sessionTitle}`,
    `DATE: ${session.scheduled_date ?? 'Not scheduled'}`,
    `COACH: ${coachName}`,
    `GROUP: ${groupName}`,
    `STATUS: ${session.status ?? 'planned'}`,
    '',
    'PLANNED BLOCKS:',
    ...blockLines,
    '',
    focusNotes
      ? `FOCUS / EMPHASIS: ${focusNotes}`
      : 'FOCUS / EMPHASIS: Not specified — deliver session plan as designed.',
    '',
    'PLAYER WATCH-FORS: Review individual player priorities before the session. Flag any returning players or attendance concerns.',
    '',
    session.session_notes
      ? `SESSION NOTES: ${String(session.session_notes).slice(0, 300)}`
      : 'SESSION NOTES: None added.',
    ...(sessionDataGaps.length > 0 ? ['', 'PREPARATION NEEDED:'] : []),
    ...sessionDataGaps.map((g: string) => `⚠ ${g}`),
  ]

  const briefText = briefLines.join('\n')

  return {
    ok: true,
    status: 'saved',
    message: briefText,
    createdId: undefined,
    safetyNotes: [
      'Read-only session brief — no session data was modified.',
      'This brief has not been sent to the coach.',
      'Review required before sharing with coach or anyone else.',
      'No proposed action was created. No official record was changed.',
      'To formally send this brief, use the Coach Communication draft flow.',
    ],
  }
}
