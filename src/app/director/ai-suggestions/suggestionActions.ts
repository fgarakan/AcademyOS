'use server'

// Sprint 179: Suggestion lifecycle server actions
// All actions are academy-scoped + role-checked.
// Nothing auto-applies — accept only marks status and provides a redirect link.

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getReassessmentPipeline } from '@/lib/backend/dashboard'
import {
  buildAcademySuggestionDrafts,
  type PlayerSummaryInput,
  type PrivateLessonRequestInput,
  type DevelopmentSummaryInput,
  type ReassessmentPipelineInput,
  type PlayerCurriculumStateInput,
} from '@/lib/suggestions/generateAcademySuggestions'

// ── Auth helper ───────────────────────────────────────────────────────────────

async function requireDirectorContext(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof getSupabaseServer>>; userId: string; academyId: string }
  | { ok: false; error: string }
> {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  const academyId = profile?.academy_id
  if (!academyId) return { ok: false, error: 'Academy context unavailable' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership?.role || !['academy_director', 'head_coach'].includes(membership.role)) {
    return { ok: false, error: 'Insufficient permissions' }
  }

  return { ok: true, supabase, userId: user.id, academyId }
}

// ── Generate Suggestions ──────────────────────────────────────────────────────

export async function generateAcademySuggestionsAction(): Promise<{ created?: number; error?: string }> {
  const ctx = await requireDirectorContext()
  if (!ctx.ok) return { error: ctx.error }

  const { supabase, userId, academyId } = ctx
  const rawDb = supabase as any

  // Fetch active players
  const { data: playerData } = await rawDb
    .from('v_player_summary')
    .select('player_id, full_name, focus_areas, overall_score, player_status, advancement_eligible')
    .eq('academy_id', academyId)
    .eq('player_status', 'active')
  const players: PlayerSummaryInput[] = playerData ?? []

  // Fetch new private lesson requests
  const { data: plrData } = await rawDb
    .from('private_lesson_requests')
    .select('id, player_id, status, preferred_days, preferred_times, goal')
    .eq('academy_id', academyId)
    .eq('status', 'new')
  const privateLessonRequests: PrivateLessonRequestInput[] = plrData ?? []

  // Fetch development summaries that lack parent-safe content
  const { data: summaryData } = await rawDb
    .from('player_development_summary')
    .select('player_id, development_focus, student_friendly_summary, current_strengths, things_to_work_on')
    .eq('academy_id', academyId)
  const rawSummaries = (summaryData ?? []) as Array<{
    player_id: string
    development_focus: string | null
    student_friendly_summary: string | null
    current_strengths: string[]
    things_to_work_on: string[]
  }>

  // Enrich summaries with player names
  const summaryPlayerIds = rawSummaries.map(s => s.player_id).filter(Boolean)
  const playerNameMap = new Map<string, string>()
  if (summaryPlayerIds.length > 0) {
    const { data: summaryPlayers } = await supabase
      .from('players')
      .select('id, full_name, first_name, last_name')
      .in('id', summaryPlayerIds)
      .eq('academy_id', academyId)
    for (const p of (summaryPlayers ?? [])) {
      playerNameMap.set(p.id, p.full_name ?? `${p.first_name} ${p.last_name}`.trim())
    }
  }

  const developmentSummaries: DevelopmentSummaryInput[] = rawSummaries.map(s => ({
    ...s,
    player_name: playerNameMap.get(s.player_id) ?? null,
  }))

  // Fetch reassessment pipeline
  const rawReassessmentPipeline = await getReassessmentPipeline(supabase, academyId)
  const reassessmentPipeline: ReassessmentPipelineInput[] = rawReassessmentPipeline.map(r => ({
    player_id: r.player_id ?? null,
    full_name: r.full_name ?? null,
    urgency: r.urgency ?? null,
  }))

  // Enrich private lesson requests with player names
  const plrPlayerIds = privateLessonRequests.map(r => r.player_id).filter((id): id is string => id !== null)
  if (plrPlayerIds.length > 0) {
    const { data: plrPlayers } = await supabase
      .from('players')
      .select('id, full_name, first_name, last_name')
      .in('id', plrPlayerIds)
      .eq('academy_id', academyId)
    for (const p of (plrPlayers ?? [])) {
      const name = p.full_name ?? `${p.first_name} ${p.last_name}`.trim()
      playerNameMap.set(p.id, name)
    }
    for (const r of privateLessonRequests) {
      if (r.player_id) r.player_name = playerNameMap.get(r.player_id) ?? null
    }
  }

  // Fetch existing pending suggestions for duplicate prevention
  const { data: existingData } = await rawDb
    .from('academy_suggestions')
    .select('suggestion_type, entity_type, entity_id')
    .eq('academy_id', academyId)
    .eq('status', 'pending')
  const existingSet = new Set<string>(
    (existingData ?? []).map((e: { suggestion_type: string; entity_type: string | null; entity_id: string | null }) =>
      `${e.suggestion_type}:${e.entity_type ?? ''}:${e.entity_id ?? ''}`
    )
  )

  // Fetch curriculum states for active players (Sprint 199: curriculum gap signals)
  // rawDb cast avoids TS2589 on multi-join; RLS enforces academy scoping.
  const playerIds = players.map(p => p.player_id).filter((id): id is string => id !== null)
  const playerCurriculumStates: PlayerCurriculumStateInput[] = []

  if (playerIds.length > 0) {
    const { data: pcsData } = await rawDb
      .from('player_curriculum_states')
      .select('player_id, current_level_id, updated_at')
      .eq('academy_id', academyId)
      .in('player_id', playerIds)

    const { data: levelRows } = pcsData && pcsData.length > 0
      ? await rawDb
          .from('curriculum_levels')
          .select('id, display_name')
          .in('id', pcsData.map((s: { current_level_id: string | null }) => s.current_level_id).filter(Boolean))
      : { data: [] }

    const levelNameMap = new Map<string, string>(
      (levelRows ?? []).map((l: { id: string; display_name: string }) => [l.id, l.display_name])
    )

    const pcsMap = new Map<string, { current_level_id: string | null; updated_at: string | null }>(
      (pcsData ?? []).map((s: { player_id: string; current_level_id: string | null; updated_at: string | null }) =>
        [s.player_id, { current_level_id: s.current_level_id, updated_at: s.updated_at }]
      )
    )

    const now = Date.now()
    for (const playerId of playerIds) {
      const pcs = pcsMap.get(playerId)
      const playerName = playerNameMap.get(playerId) ?? null
      const currentLevelId = pcs?.current_level_id ?? null
      const updatedAt = pcs?.updated_at ?? null
      const daysSinceUpdate = updatedAt
        ? Math.floor((now - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null

      playerCurriculumStates.push({
        player_id: playerId,
        player_name: playerName,
        current_level_id: currentLevelId,
        current_level_name: currentLevelId ? (levelNameMap.get(currentLevelId) ?? null) : null,
        days_since_update: currentLevelId ? daysSinceUpdate : null,
      })
    }

    // Active players with no curriculum state row at all
    for (const playerId of playerIds) {
      if (!pcsMap.has(playerId)) {
        playerCurriculumStates.push({
          player_id: playerId,
          player_name: playerNameMap.get(playerId) ?? null,
          current_level_id: null,
          current_level_name: null,
          days_since_update: null,
        })
      }
    }
  }

  // Generate drafts
  const drafts = buildAcademySuggestionDrafts({
    players,
    privateLessonRequests,
    developmentSummaries,
    reassessmentPipeline,
    playerCurriculumStates,
  })

  // Insert non-duplicate suggestions
  let created = 0
  for (const draft of drafts) {
    const key = `${draft.suggestion_type}:${draft.entity_type ?? ''}:${draft.entity_id ?? ''}`
    if (existingSet.has(key)) continue

    const { error: insertError } = await rawDb
      .from('academy_suggestions')
      .insert({
        academy_id: academyId,
        suggestion_type: draft.suggestion_type,
        title: draft.title,
        summary: draft.summary,
        priority: draft.priority,
        confidence: draft.confidence,
        entity_type: draft.entity_type,
        entity_id: draft.entity_id,
        evidence: draft.evidence,
        impact_preview: draft.impact_preview,
        proposed_changes: draft.proposed_changes,
        will_not_change: draft.will_not_change,
        source: 'system',
        status: 'pending',
        created_by: userId,
      })

    if (!insertError) {
      created++
      existingSet.add(key)
    }
  }

  revalidatePath('/director/ai-suggestions')
  revalidatePath('/director')
  return { created }
}

// ── Accept ────────────────────────────────────────────────────────────────────

export async function acceptSuggestionAction(suggestionId: string): Promise<{ error?: string; nextStep?: string }> {
  const ctx = await requireDirectorContext()
  if (!ctx.ok) return { error: ctx.error }

  const { supabase, userId } = ctx
  const rawDb = supabase as any

  // Verify this suggestion belongs to the user's academy
  const { data: suggestion } = await rawDb
    .from('academy_suggestions')
    .select('academy_id, suggestion_type, entity_id, impact_preview')
    .eq('id', suggestionId)
    .single()

  if (!suggestion) return { error: 'Suggestion not found' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', suggestion.academy_id)
    .eq('profile_id', userId)
    .eq('is_active', true)
    .single()

  if (!membership?.role || !['academy_director', 'head_coach'].includes(membership.role)) {
    return { error: 'Insufficient permissions' }
  }

  const { error } = await rawDb
    .from('academy_suggestions')
    .update({
      status: 'accepted',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', suggestionId)

  if (error) return { error: 'Failed to accept suggestion' }

  revalidatePath('/director/ai-suggestions')
  revalidatePath('/director')

  const nextStep = (suggestion.impact_preview as { next_step?: string })?.next_step ?? undefined
  return { nextStep }
}

// ── Deny ──────────────────────────────────────────────────────────────────────

export async function denySuggestionAction(suggestionId: string, note?: string): Promise<{ error?: string }> {
  const ctx = await requireDirectorContext()
  if (!ctx.ok) return { error: ctx.error }

  const { supabase, userId } = ctx
  const rawDb = supabase as any

  const { data: suggestion } = await rawDb
    .from('academy_suggestions')
    .select('academy_id')
    .eq('id', suggestionId)
    .single()

  if (!suggestion) return { error: 'Suggestion not found' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', suggestion.academy_id)
    .eq('profile_id', userId)
    .eq('is_active', true)
    .single()

  if (!membership?.role || !['academy_director', 'head_coach'].includes(membership.role)) {
    return { error: 'Insufficient permissions' }
  }

  const { error } = await rawDb
    .from('academy_suggestions')
    .update({
      status: 'denied',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_note: note ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', suggestionId)

  if (error) return { error: 'Failed to deny suggestion' }

  revalidatePath('/director/ai-suggestions')
  revalidatePath('/director')
  return {}
}

// ── Defer ─────────────────────────────────────────────────────────────────────

export async function deferSuggestionAction(suggestionId: string, note?: string): Promise<{ error?: string }> {
  const ctx = await requireDirectorContext()
  if (!ctx.ok) return { error: ctx.error }

  const { supabase, userId } = ctx
  const rawDb = supabase as any

  const { data: suggestion } = await rawDb
    .from('academy_suggestions')
    .select('academy_id')
    .eq('id', suggestionId)
    .single()

  if (!suggestion) return { error: 'Suggestion not found' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', suggestion.academy_id)
    .eq('profile_id', userId)
    .eq('is_active', true)
    .single()

  if (!membership?.role || !['academy_director', 'head_coach'].includes(membership.role)) {
    return { error: 'Insufficient permissions' }
  }

  const { error } = await rawDb
    .from('academy_suggestions')
    .update({
      status: 'deferred',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_note: note ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', suggestionId)

  if (error) return { error: 'Failed to defer suggestion' }

  revalidatePath('/director/ai-suggestions')
  revalidatePath('/director')
  return {}
}

// ── Mark Applied (future — records that downstream action was taken) ───────────

export async function markSuggestionAppliedAction(suggestionId: string): Promise<{ error?: string }> {
  const ctx = await requireDirectorContext()
  if (!ctx.ok) return { error: ctx.error }

  const { supabase, userId } = ctx
  const rawDb = supabase as any

  const { data: suggestion } = await rawDb
    .from('academy_suggestions')
    .select('academy_id, status')
    .eq('id', suggestionId)
    .single()

  if (!suggestion) return { error: 'Suggestion not found' }
  if (suggestion.status !== 'accepted') return { error: 'Suggestion must be accepted before marking applied' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', suggestion.academy_id)
    .eq('profile_id', userId)
    .eq('is_active', true)
    .single()

  if (!membership?.role || !['academy_director', 'head_coach'].includes(membership.role)) {
    return { error: 'Insufficient permissions' }
  }

  const { error } = await rawDb
    .from('academy_suggestions')
    .update({
      status: 'applied',
      updated_at: new Date().toISOString(),
    })
    .eq('id', suggestionId)

  if (error) return { error: 'Failed to mark suggestion as applied' }

  revalidatePath('/director/ai-suggestions')
  return {}
}
