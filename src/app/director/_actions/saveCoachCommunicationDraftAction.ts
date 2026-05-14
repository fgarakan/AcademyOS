'use server'

// Sprint 282 — Save Coach Communication Draft Action
//
// Saves a coach communication draft to proposed_actions (target_module: 'coach_communication').
//
// Safety contract:
//   - NEVER sends the message to the coach.
//   - NEVER notifies any coach, player, or parent.
//   - No messaging infrastructure exists — this is an internal draft only.
//   - Director or head_coach only. Academy_id scoped. Preview mode blocked.
//   - Two-step write: voice_commands FK row first, then proposed_actions.

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { isPreviewMode } from '@/lib/utils/previewMode'
import type { DonnaApprovalExecutionResult } from '@/components/assistant/donnaApprovalExecutionTypes'

// ---------------------------------------------------------------------------
// Auth helper
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
    return { ok: false as const, error: 'Director or Head Coach access required.' }
  }

  return { ok: true as const, supabase, userId: user.id, academyId, role }
}

// ---------------------------------------------------------------------------
// saveCoachCommunicationDraftAction
// ---------------------------------------------------------------------------

export async function saveCoachCommunicationDraftAction(
  fields: Record<string, string>,
): Promise<DonnaApprovalExecutionResult> {
  if (await isPreviewMode()) {
    return { ok: false, status: 'blocked', message: 'Writes are disabled in preview mode.' }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) return { ok: false, status: 'blocked', message: ctx.error }

  const { supabase, userId, academyId, role } = ctx
  const rawDb = supabase as any

  const coachLabel = (fields.coach ?? '').replace(/\s*✓$/, '').trim()
  const messageFocus = (fields.message_focus ?? '').trim()
  const context = (fields.context ?? '').trim()
  const followUp = (fields.follow_up ?? '').trim()

  if (!coachLabel) {
    return { ok: false, status: 'error', message: 'Coach is required.' }
  }
  if (!messageFocus) {
    return { ok: false, status: 'error', message: 'Message focus is required.' }
  }

  const rawInput = [
    `Coach: ${coachLabel}`,
    `Message focus: ${messageFocus}`,
    context ? `Context: ${context}` : null,
    followUp ? `Follow-up: ${followUp}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  // Step 1: Insert voice_commands row (required FK for proposed_actions)
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
    draft_type: 'coach_communication_v1',
    source: 'donna_assistant',
    coach_label: coachLabel,
    message_focus: messageFocus,
    context: context || null,
    follow_up: followUp || null,
    warnings: [
      'Draft only — not sent to coach.',
      'No messaging infrastructure exists in this system.',
      'Director must handle sending separately outside this system.',
      'No player, parent, or coach was notified.',
    ],
  }

  // Step 2: Insert proposed_actions row
  const { data: proposedAction, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: userId,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: `Coach Communication Draft — ${coachLabel}`,
      target_module: 'coach_communication',
      target_object_type: 'coach',
      proposed_payload: payload,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: [
        'Draft only. No message was sent.',
        'No coach, player, or parent was notified.',
        'Director review required.',
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
    message: `Coach communication draft for "${coachLabel}" saved to Review Queue. The coach has not been notified — no messaging infrastructure exists.`,
    createdId: proposedAction.id as string,
    safetyNotes: [
      'Draft only — the coach received nothing.',
      'No messaging, email, or notification was triggered.',
      'Review and close this draft in the Review Queue.',
    ],
  }
}
