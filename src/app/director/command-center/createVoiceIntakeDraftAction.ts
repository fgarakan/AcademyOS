'use server'

// Sprint 246 — Voice Intake to Proposed Actions V1
// Creates a voice_commands row + proposed_actions review draft from a VoiceIntakeDraft.
// No direct execution. Status is always pending_review.
// Director reviews and approves in /director/review.

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import type { VoiceIntakeDraft } from '@/lib/voice/voiceIntakeTypes'
import type { Json } from '@/lib/supabase/database.types'

interface CreateVoiceIntakeDraftResult {
  error: string | null
  draftId?: string
}

export async function createVoiceIntakeDraftAction(
  draft: VoiceIntakeDraft,
): Promise<CreateVoiceIntakeDraftResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }
  if (!draft.raw_transcript?.trim()) return { error: 'Transcript is required.' }

  // 2. Resolve academy_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  // 3. Verify role — director, head_coach, or coach
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  const allowedRoles = ['academy_director', 'head_coach', 'coach']
  if (!role || !allowedRoles.includes(role)) {
    return { error: 'You do not have permission to create voice intake drafts.' }
  }

  // 4. Create voice_commands row (required FK for proposed_actions)
  const { data: voiceCommand, error: vcError } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: role as any,
      input_method: 'typed',
      raw_input: draft.raw_transcript.trim(),
      transcript: draft.cleaned_summary || draft.raw_transcript.trim(),
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return { error: `Failed to record voice command: ${vcError?.message ?? 'unknown'}` }
  }

  // 5. Build proposed_payload — stores the full VoiceIntakeDraft
  const payload = {
    draft_type: 'voice_intake_v1',
    role: draft.role,
    context: draft.context,
    raw_transcript: draft.raw_transcript,
    cleaned_summary: draft.cleaned_summary,
    detected_intents: draft.detected_intents,
    confidence: draft.confidence,
    suggested_destinations: draft.suggested_destinations,
    recommended_primary_action: draft.recommended_primary_action,
    extracted_entities: draft.extracted_entities,
    affected_players: draft.affected_players,
    affected_groups: draft.affected_groups,
    affected_sessions: draft.affected_sessions,
    curriculum_links: draft.curriculum_links,
    gap_links: draft.gap_links,
    requires_review: draft.requires_review,
    safety_flags: draft.safety_flags,
    what_would_change: draft.what_would_change,
    what_would_not_change: draft.what_would_not_change,
  }

  // 6. Determine action label
  const primaryIntent = draft.detected_intents.find(i => i !== 'unknown') ?? 'unknown'
  const intentLabel = primaryIntent.replace(/_/g, ' ')
  const actionLabel = `Voice Intake: ${intentLabel} — ${draft.raw_transcript.trim().slice(0, 60)}${draft.raw_transcript.length > 60 ? '…' : ''}`

  // 7. Create proposed_actions row — always pending_review, action_type = 'other'
  // target_module = 'voice_intake' identifies this as a voice intake draft
  const { data: proposedAction, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: actionLabel,
      target_module: 'voice_intake',
      target_object_type: 'voice_intake_draft',
      proposed_payload: payload as unknown as Json,
      status: 'pending_review',
      risk_level: draft.safety_flags.length > 0 ? 'medium' : 'low',
      risk_notes: [
        'Voice intake draft. No data changed until director approves.',
        ...draft.safety_flags.map(f => `Safety flag: ${f}`),
      ],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    return { error: `Failed to create review draft: ${paError?.message ?? 'unknown'}` }
  }

  return { error: null, draftId: proposedAction.id }
}
