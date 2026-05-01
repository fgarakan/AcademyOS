'use server'

import { getSupabaseServer } from '@/lib/supabase/server'

export interface ApplyResult {
  ok: boolean
  appliedToBlockId?: string
  appliedToSession?: boolean
  error?: string
}

export async function applyApprovedSessionAdjustmentAction(suggestionId: string): Promise<ApplyResult> {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // Resolve auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

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
    .eq('profile_id', user.id)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .in('role', ['academy_director', 'head_coach'])
    .single()
  if (!membership) return { ok: false, error: 'Access denied.' }

  // Load the suggestion — must be approved and belong to this academy
  const { data: suggestion } = await rawDb
    .from('session_adjustment_suggestions')
    .select('id, session_id, target_session_block_id, suggested_change, suggestion_type, status')
    .eq('id', suggestionId)
    .eq('academy_id', academyId)
    .eq('status', 'approved')
    .single()

  if (!suggestion) return { ok: false, error: 'Suggestion not found or not in approved status.' }

  // Verify session belongs to this academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id, session_notes')
    .eq('id', suggestion.session_id)
    .eq('academy_id', academyId)
    .single()
  if (!session) return { ok: false, error: 'Session not found.' }

  const adjustmentLabel = `\n\n[Adaptive Adjustment — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}]\n${suggestion.suggested_change}`

  if (suggestion.target_session_block_id) {
    // Verify target is a session_block (not a template_block) by confirming session_id linkage
    const { data: block } = await rawDb
      .from('session_blocks')
      .select('id, notes, session_id')
      .eq('id', suggestion.target_session_block_id)
      .eq('session_id', session.id)
      .single()

    if (!block) {
      // Fall back to session notes if block not found
      const currentNotes = session.session_notes ?? ''
      const { error: sessionUpdateError } = await supabase
        .from('sessions')
        .update({ session_notes: currentNotes + adjustmentLabel })
        .eq('id', session.id)
        .eq('academy_id', academyId)

      if (sessionUpdateError) return { ok: false, error: sessionUpdateError.message }
    } else {
      const currentNotes = block.notes ?? ''
      const { error: blockUpdateError } = await rawDb
        .from('session_blocks')
        .update({ notes: currentNotes + adjustmentLabel })
        .eq('id', block.id)
        .eq('session_id', session.id)

      if (blockUpdateError) return { ok: false, error: blockUpdateError.message }

      // Mark suggestion applied
      await rawDb
        .from('session_adjustment_suggestions')
        .update({ status: 'applied', applied_by: user.id, applied_at: new Date().toISOString() })
        .eq('id', suggestionId)

      // Audit log
      await rawDb
        .from('audit_logs')
        .insert({
          academy_id: academyId,
          actor_id: user.id,
          action: 'apply_session_adjustment',
          target_type: 'session_block',
          target_id: block.id,
          details: { suggestion_id: suggestionId, suggestion_type: suggestion.suggestion_type },
        })

      return { ok: true, appliedToBlockId: block.id }
    }
  } else {
    // No target block — append to session notes
    const currentNotes = session.session_notes ?? ''
    const { error: sessionUpdateError } = await supabase
      .from('sessions')
      .update({ session_notes: currentNotes + adjustmentLabel })
      .eq('id', session.id)
      .eq('academy_id', academyId)

    if (sessionUpdateError) return { ok: false, error: sessionUpdateError.message }
  }

  // Mark suggestion applied
  await rawDb
    .from('session_adjustment_suggestions')
    .update({ status: 'applied', applied_by: user.id, applied_at: new Date().toISOString() })
    .eq('id', suggestionId)

  // Audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'apply_session_adjustment',
      target_type: 'session',
      target_id: session.id,
      details: { suggestion_id: suggestionId, suggestion_type: suggestion.suggestion_type },
    })

  return { ok: true, appliedToSession: true }
}
