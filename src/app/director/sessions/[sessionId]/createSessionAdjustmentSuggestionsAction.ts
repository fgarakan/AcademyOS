'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { getGroupNeedsForSession } from '@/lib/session-planning/groupNeedsAggregation'
import { generateSessionModificationSuggestions } from '@/lib/session-planning/sessionModificationRules'
import type { CurriculumContextInput, BlockInput } from '@/lib/session-planning/sessionModificationRules'

export interface CreateSuggestionsResult {
  ok: boolean
  created: number
  warnings: string[]
  error?: string
}

export async function createSessionAdjustmentSuggestionsAction(
  sessionId: string
): Promise<CreateSuggestionsResult> {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // Resolve auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, created: 0, warnings: [], error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) return { ok: false, created: 0, warnings: [], error: 'Academy context unavailable.' }

  const academyId = profile.academy_id

  // Verify director or head coach role
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('profile_id', user.id)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .in('role', ['academy_director', 'head_coach'])
    .single()

  if (!membership) return { ok: false, created: 0, warnings: [], error: 'Access denied. Director or head coach role required.' }

  // Verify session belongs to academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id, group_id, template_id, session_notes')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()

  if (!session) return { ok: false, created: 0, warnings: [], error: 'Session not found.' }

  // Load session blocks
  const { data: blockRows } = await rawDb
    .from('session_blocks')
    .select('id, name, block_type, duration_min, notes')
    .eq('session_id', sessionId)
    .order('block_order', { ascending: true })

  const blocks: BlockInput[] = (blockRows ?? []).map((b: any) => ({
    id: b.id,
    name: b.name ?? 'Unnamed Block',
    type: b.block_type ?? 'drill',
    duration_min: b.duration_min ?? 0,
    notes: b.notes ?? null,
  }))

  // Resolve curriculum context from template
  let curriculumContext: CurriculumContextInput | null = null
  if (session.template_id) {
    const { data: templateRow } = await rawDb
      .from('templates')
      .select('curriculum_level_id')
      .eq('id', session.template_id)
      .single()

    if (templateRow?.curriculum_level_id) {
      const { data: levelRow } = await rawDb
        .from('curriculum_levels')
        .select('display_name, stage')
        .eq('id', templateRow.curriculum_level_id)
        .single()

      const { data: versionRow } = await rawDb
        .from('academy_curriculum_versions')
        .select('version_name')
        .eq('academy_id', academyId)
        .in('status', ['active', 'draft'])
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      const { data: overrideRows } = await rawDb
        .from('academy_curriculum_overrides')
        .select('override_reason')
        .eq('academy_id', academyId)
        .eq('curriculum_level_id', templateRow.curriculum_level_id)
        .eq('status', 'applied')
        .limit(10)

      curriculumContext = {
        levelName: levelRow?.display_name ?? null,
        levelStage: levelRow?.stage ?? null,
        academyVersionName: versionRow?.version_name ?? null,
        overrideSummaryLines: (overrideRows ?? []).map((r: any) => r.override_reason ?? '').filter(Boolean),
      }
    }
  }

  // Aggregate group needs
  const groupNeeds = await getGroupNeedsForSession({ supabase, academyId, sessionId })

  // Run rule engine
  const { suggestions, warnings } = generateSessionModificationSuggestions({
    session: {
      id: session.id,
      group_id: session.group_id ?? null,
      template_id: session.template_id ?? null,
      session_notes: session.session_notes ?? null,
    },
    blocks,
    groupNeeds,
    curriculumContext,
  })

  if (suggestions.length === 0) {
    return { ok: true, created: 0, warnings: [...warnings, 'No suggestions generated for this session.'] }
  }

  // Resolve target_session_block_id from hint
  const blockNameToId = new Map<string, string>()
  for (const b of blocks) blockNameToId.set(b.name, b.id)

  // Get curriculum level id from template for linking
  let curriculumLevelId: string | null = null
  if (session.template_id) {
    const { data: tRow } = await rawDb
      .from('templates')
      .select('curriculum_level_id')
      .eq('id', session.template_id)
      .single()
    curriculumLevelId = tRow?.curriculum_level_id ?? null
  }

  // Delete existing pending_review/draft suggestions for this session before inserting fresh batch
  await rawDb
    .from('session_adjustment_suggestions')
    .delete()
    .eq('session_id', sessionId)
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'draft'])

  // Insert new suggestions
  const insertRows = suggestions.map(s => ({
    academy_id: academyId,
    session_id: sessionId,
    source_template_id: session.template_id ?? null,
    group_id: session.group_id ?? null,
    curriculum_level_id: curriculumLevelId,
    target_session_block_id: s.target_block_hint ? (blockNameToId.get(s.target_block_hint) ?? null) : null,
    suggestion_type: s.suggestion_type,
    suggested_change: s.suggested_change,
    reason: s.reason,
    players_supported: s.players_supported,
    player_needs_considered: s.player_needs_considered,
    curriculum_context: s.curriculum_context,
    risk_level: s.risk_level,
    confidence: s.confidence,
    scope: 'this_session_only',
    status: 'pending_review',
    created_by: user.id,
  }))

  const { error: insertError } = await rawDb
    .from('session_adjustment_suggestions')
    .insert(insertRows)

  if (insertError) {
    return { ok: false, created: 0, warnings, error: `Failed to save suggestions: ${insertError.message}` }
  }

  return { ok: true, created: suggestions.length, warnings }
}
