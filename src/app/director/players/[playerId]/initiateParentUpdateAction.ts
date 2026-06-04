'use server'

// Sprint 1771 — Atomic Loop Clarity: Loop 6 fix
// Initiates a parent communication draft from the player profile.
// Creates a proposed_action (parent_communication) → director review queue.
// No parent/player exposure until director approves AND applies.
// No coach notes, assessment scores, or internal signals included.

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { sanitizeParentFacingText } from '@/lib/communications/parentSafeResponseRules'
import type { Json } from '@/lib/supabase/database.types'

export interface InitiateParentUpdateResult {
  ok: boolean
  error: string | null
  draftId: string | null
}

export async function initiateParentUpdateAction(
  playerId: string
): Promise<InitiateParentUpdateResult> {
  const fail = (error: string): InitiateParentUpdateResult =>
    ({ ok: false, error, draftId: null })

  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')
  if (!playerId) return fail('Missing player ID.')

  // 2. Resolve academy_id server-side — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.')
  const academyId = profile.academy_id

  // 3. Director or head_coach only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const memberRole = membership?.role
  if (memberRole !== 'academy_director' && memberRole !== 'head_coach') {
    return fail('You do not have permission to initiate parent updates.')
  }

  // 4. Verify player belongs to this academy
  const { data: player } = await supabase
    .from('players')
    .select('id, first_name, last_name, full_name')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return fail('Player not found or access denied.')

  const playerName = player.full_name ?? `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim()
  const firstName = player.first_name ?? 'Your child'

  // 5. Fetch curriculum level name — best-effort, degrades gracefully
  let currentLevelName: string | null = null
  let nextLevelName: string | null = null
  {
    const { data: pcsRow } = await rawDb
      .from('player_curriculum_states')
      .select('current_level_id')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .maybeSingle()

    if (pcsRow?.current_level_id) {
      const { data: levelRow } = await rawDb
        .from('curriculum_levels')
        .select('display_name, sort_order')
        .eq('id', pcsRow.current_level_id)
        .maybeSingle()
      currentLevelName = levelRow?.display_name ?? null

      if (levelRow?.sort_order != null) {
        const { data: nextLevel } = await rawDb
          .from('curriculum_levels')
          .select('display_name')
          .gt('sort_order', levelRow.sort_order)
          .order('sort_order', { ascending: true })
          .limit(1)
          .maybeSingle()
        nextLevelName = nextLevel?.display_name ?? null
      }
    }
  }

  // 6. Fetch coach language current_focus — best-effort
  let currentFocus: string | null = null
  if (currentLevelName) {
    const { data: pcsRow } = await rawDb
      .from('player_curriculum_states')
      .select('current_level_id')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .maybeSingle()
    if (pcsRow?.current_level_id) {
      const { data: clRow } = await rawDb
        .from('curriculum_coach_language')
        .select('current_focus')
        .eq('level_id', pcsRow.current_level_id)
        .limit(1)
        .maybeSingle()
      currentFocus = clRow?.current_focus ?? null
    }
  }

  // 7. Fetch development_focus from player_development_summary — best-effort
  let developmentFocus: string | null = null
  {
    const { data: summaryRow } = await rawDb
      .from('player_development_summary')
      .select('development_focus')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .maybeSingle()
    developmentFocus = summaryRow?.development_focus ?? null
  }

  // 8. Build parent-safe draft sections — no raw coach notes, no internal scores
  const focusText = currentFocus ?? developmentFocus
  const safeLevel = currentLevelName ? sanitizeParentFacingText(currentLevelName) : null
  const safeFocus = focusText ? sanitizeParentFacingText(focusText) : null
  const safeNext = nextLevelName ? sanitizeParentFacingText(nextLevelName) : null

  const draftSections = {
    working_on: safeLevel
      ? `${firstName} is currently working in the ${safeLevel} stage of the academy curriculum.${safeFocus ? ` The focus this block is: ${safeFocus}.` : ''}`
      : `${firstName} is developing their tennis skills at the academy.`,
    whats_next: safeNext
      ? `${firstName}'s next curriculum target is ${safeNext}. Progress happens through consistent practice.`
      : null,
    parent_can_do:
      `The best way to support ${firstName} is to show interest in what they are working on — ask how sessions went and let them lead the conversation.`,
    improved: null,
    needs_support: null,
  }

  // 9. Build proposed_payload matching ParentSummaryPayload shape
  const payload = {
    draft_type: 'parent_communication_v1',
    source: 'director_initiated',
    player_id: playerId,
    player_label: playerName,
    update_focus: 'Development Update',
    tone: 'supportive',
    draft_text: null,
    draft_sections: draftSections,
    has_assessment: false,
    has_priorities: false,
    advancement_eligible: null,
    warnings: [
      'Draft only. No parent communication has been sent.',
      'Review draft content before approving.',
      'Requires director approval and the Apply step before anything reaches the parent.',
    ],
  }

  // 10. Create voice_commands relay row — proposed_actions.voice_command_id is NOT NULL
  const issuerRole = memberRole as 'academy_director' | 'head_coach'
  const { data: voiceCommand, error: vcError } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: issuerRole as any,
      input_method: 'typed',
      raw_input: `Parent update draft initiated for player: ${playerId}`,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return fail(`Failed to create command record: ${vcError?.message ?? 'unknown'}`)
  }

  // 11. Create proposed_action — status pending_review, never contacts parent
  const { data: proposedAction, error: paError } = await supabase
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: 'Parent Communication Draft',
      target_module: 'parent_communication',
      target_object_id: playerId,
      target_object_type: 'player',
      proposed_payload: payload as unknown as Json,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: [
        'Draft only. No parent communication was sent.',
        'No player profiles, assessments, or coach notes were modified.',
        'Requires director approval and the Apply step before any content reaches a parent.',
      ],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    return fail(`Failed to save parent update draft: ${paError?.message ?? 'unknown'}`)
  }

  return { ok: true, error: null, draftId: proposedAction.id }
}
