'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { parseAcademyCommand, type ParsedCommandResult } from '@/lib/commands/parseAcademyCommand'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { canRoleUseIntent, type SupportedRole } from '@/lib/commands/roleGuardrails'
import type { Json } from '@/lib/supabase/database.types'

type SubmitMode = 'parse_only' | 'create_draft'

interface SubmitResult {
  error: string | null
  parsed?: ParsedCommandResult
  draftId?: string
}

export async function submitDirectorCommandAction(
  commandText: string,
  mode: SubmitMode,
): Promise<SubmitResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }
  if (!commandText?.trim()) return { error: 'Command text is required.' }

  // 2. Resolve academy_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  // 3. Verify role — director or head_coach only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { error: 'You do not have permission to submit commands.' }
  }

  // 4. Parse the command — deterministic, no external AI
  const parsed = parseAcademyCommand(commandText.trim())

  // 4a. Role guardrail check — verify this role may use the parsed intent
  const guardrailRole: SupportedRole =
    role === 'academy_director' ? 'academy_director' : 'head_coach'
  if (!canRoleUseIntent(guardrailRole, parsed.intent_type)) {
    return {
      error: `The ${guardrailRole} role does not have permission to use the "${parsed.intent_type}" command.`,
    }
  }

  if (mode === 'parse_only') {
    return { error: null, parsed }
  }

  // 5. For 'create_draft' mode: create voice_commands + proposed_actions rows
  // Only create drafts for non-query action intents
  const queryOnlyIntents = [
    'show_players_missing_curriculum_level',
    'show_curriculum_gap_suggestions',
    'show_advancement_eligible',
    'ask_curriculum_level_requirements',
    'summarize_reassessment_pipeline',
    'unknown',
  ]

  if (queryOnlyIntents.includes(parsed.intent_type)) {
    return {
      error: 'This command is a query — no draft is needed. Results appear above.',
      parsed,
    }
  }

  // Map command intent to action_type DB enum value
  const ACTION_TYPE_MAP: Record<string, string> = {
    create_session_draft: 'create_session',
    create_group_draft: 'other',
    record_director_note: 'other',
  }

  const actionType = ACTION_TYPE_MAP[parsed.intent_type] ?? 'other'
  const targetModule = 'director_command'

  // 6. Create voice_commands row (required FK for proposed_actions)
  const issuerRole: 'academy_director' | 'head_coach' =
    role === 'academy_director' ? 'academy_director' : 'head_coach'

  const { data: voiceCommand, error: vcError } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: issuerRole as any,
      input_method: 'typed',
      raw_input: commandText.trim(),
      transcript: commandText.trim(),
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return { error: `Failed to record command: ${vcError?.message ?? 'unknown'}` }
  }

  // 7. Build payload
  const payload = {
    draft_type: 'director_command_v1',
    command_text: commandText.trim(),
    intent_type: parsed.intent_type,
    confidence: parsed.confidence,
    extracted_entities: parsed.extracted_entities,
    missing_information: parsed.missing_information,
    suggested_next_step: parsed.suggested_next_step,
    will_not_do: parsed.will_not_do,
    requires_confirmation: parsed.requires_confirmation,
  }

  // 8. Create proposed_actions row — status: pending_review, not auto-executed
  const { data: proposedAction, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: voiceCommand.id,
      action_type: actionType,
      action_label: `Director Command: ${commandText.trim().slice(0, 80)}`,
      target_module: targetModule,
      target_object_type: 'command',
      proposed_payload: payload as unknown as Json,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: ['Director command draft. Nothing executed until approved.'],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    return { error: `Failed to create draft: ${paError?.message ?? 'unknown'}` }
  }

  return { error: null, parsed, draftId: proposedAction.id }
}
