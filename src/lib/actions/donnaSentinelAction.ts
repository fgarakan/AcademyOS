'use server'

// Sprint 742G — DONNA Voice Command Sentinel + Proposed Action Insert
//
// Creates a voice_commands sentinel row (required by proposed_actions FK constraint),
// then inserts a proposed_actions row for director review.
//
// This is the ONLY write path DONNA uses for action drafting. It:
//   1. Asserts not in preview mode
//   2. Gets the auth user from the server session
//   3. Looks up their academy_id and role from academy_memberships
//   4. Inserts a voice_commands sentinel row
//   5. Inserts a proposed_actions row with status = 'pending_review'
//
// The director must then approve / reject / modify the proposed action in the Review Center.
// DONNA never auto-executes. DONNA never bypasses review.

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DonnaActionDraftInput {
  rawInput: string             // The director's raw prompt — stored in voice_commands
  actionLabel: string          // Human-readable label shown in review queue
  targetModule: string         // e.g. 'player_advancement_v1', 'curriculum_change_v1'
  proposedPayload: Record<string, unknown>  // Structured data describing the action
  riskLevel?: 'low' | 'medium' | 'high'    // Default: 'low'
}

export interface DonnaActionDraftResult {
  actionId: string | null    // The proposed_action.id if successful
  error: string | null
}

// ── Server action ──────────────────────────────────────────────────────────────

export async function submitDonnaActionDraft(
  input: DonnaActionDraftInput,
): Promise<DonnaActionDraftResult> {
  try {
    await assertNotPreviewMode()

    const supabase = await getSupabaseServer()
    const rawDb = supabase as any

    // ── Get auth user ──────────────────────────────────────────────────────────
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) {
      return { actionId: null, error: 'Not authenticated' }
    }

    // ── Look up academy membership ─────────────────────────────────────────────
    // Gets academy_id and role from the user's active membership.
    // Never trusts client-passed academyId for a write operation.
    const { data: membershipRows, error: membershipError } = await rawDb
      .from('academy_memberships')
      .select('academy_id, role')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)

    if (membershipError || !membershipRows || membershipRows.length === 0) {
      return { actionId: null, error: 'No active academy membership found' }
    }

    const membership = membershipRows[0] as { academy_id: string; role: string }
    const academyId = membership.academy_id
    const issuerRole = membership.role

    // Validate role is a known user_role value
    const validRoles = ['academy_director', 'head_coach', 'coach', 'player', 'parent']
    if (!validRoles.includes(issuerRole)) {
      return { actionId: null, error: `Invalid role: ${issuerRole}` }
    }

    // ── Insert voice_commands sentinel ─────────────────────────────────────────
    // Minimal sentinel row — marks this as a typed (text) DONNA input.
    // processing_status defaults to 'processed' in DB.
    const { data: vcRows, error: vcError } = await rawDb
      .from('voice_commands')
      .insert({
        academy_id: academyId,
        issuer_id: user.id,
        issuer_role: issuerRole,
        raw_input: input.rawInput,
        input_method: 'typed',
        processing_status: 'processed',
      })
      .select('id')

    if (vcError || !vcRows || vcRows.length === 0) {
      return { actionId: null, error: `Voice command insert failed: ${vcError?.message ?? 'unknown'}` }
    }

    const voiceCommandId = (vcRows[0] as { id: string }).id

    // ── Insert proposed_actions row ────────────────────────────────────────────
    // Status defaults to 'pending_review'. Director must act in Review Center.
    const { data: paRows, error: paError } = await rawDb
      .from('proposed_actions')
      .insert({
        academy_id: academyId,
        action_label: input.actionLabel,
        action_type: 'other',
        proposed_by_id: user.id,
        proposed_payload: input.proposedPayload,
        target_module: input.targetModule,
        risk_level: input.riskLevel ?? 'low',
        voice_command_id: voiceCommandId,
        status: 'pending_review',
      })
      .select('id')

    if (paError || !paRows || paRows.length === 0) {
      return { actionId: null, error: `Proposed action insert failed: ${paError?.message ?? 'unknown'}` }
    }

    const actionId = (paRows[0] as { id: string }).id
    return { actionId, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { actionId: null, error: msg }
  }
}
