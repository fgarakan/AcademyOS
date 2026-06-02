'use server'

// Sprint 1113-1120 — Assessment Event Workflow Actions
//
// Creates and manages assessment_events (migration 079).
// Assessment events wrap the assessments table with workflow state.
//
// Flow:
//   createAssessmentEventAction → event (draft/scheduled)
//   startAssessmentEventAction → event (in_progress)
//   completeAssessmentEventAction → creates assessments row + links event (completed)
//   reviewAssessmentEventAction → compares to previous + generates blueprint recommendations (reviewed)

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import { compareAssessments, type AssessmentSnapshot } from '@/lib/blueprint/assessmentComparisonEngine'
import { generateBlueprintUpdateRecommendations } from '@/lib/blueprint/blueprintUpdateRecommendationEngine'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']
type AssessmentType = Database['public']['Enums']['assessment_type']

// ── Create Assessment Event ───────────────────────────────────────────────────

export interface CreateAssessmentEventInput {
  playerId: string
  assessmentType: string
  assessmentMode: 'quick' | 'standard' | 'deep'
  scheduledFor?: string | null
  notes?: string | null
}

export interface CreateAssessmentEventResult {
  ok: boolean
  error: string | null
  eventId?: string | null
  isSchemaMissing?: boolean
}

export async function createAssessmentEventAction(
  input: CreateAssessmentEventInput,
): Promise<CreateAssessmentEventResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable' }
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role as UserRole | undefined
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, error: 'Director or head coach role required' }
  }

  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('id', input.playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return { ok: false, error: 'Player not found in this academy' }

  const rawDb = supabase as any

  // Fetch the most recent previous assessment for comparison context
  const { data: prevAssessment } = await supabase
    .from('assessments')
    .select('id')
    .eq('player_id', input.playerId)
    .eq('academy_id', academyId)
    .order('assessed_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const status = input.scheduledFor ? 'scheduled' : 'draft'

  try {
    const { data: event, error: insertError } = await rawDb
      .from('assessment_events')
      .insert({
        academy_id:              academyId,
        player_id:               input.playerId,
        assessment_type:         input.assessmentType,
        assessment_mode:         input.assessmentMode,
        trigger_source:          'director',
        requested_by:            user.id,
        assessor_id:             user.id,
        scheduled_for:           input.scheduledFor ?? null,
        status,
        notes:                   input.notes ?? null,
        previous_assessment_id:  prevAssessment?.id ?? null,
      })
      .select('id')
      .single()

    if (insertError) {
      if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
        return { ok: false, error: 'Migration 079 not applied. Apply assessment_events migration first.', isSchemaMissing: true }
      }
      return { ok: false, error: insertError.message ?? 'Failed to create assessment event' }
    }

    await writeAuditLog({
      db: supabase,
      academyId,
      actorId: user.id,
      actorRole: role,
      action: 'assessment_event_created',
      targetType: 'assessment_events',
      targetId: event?.id as string,
      targetLabel: `${input.assessmentType} (${input.assessmentMode})`,
      payload: { player_id: input.playerId, type: input.assessmentType, mode: input.assessmentMode, status },
      sourceType: 'ui',
    })

    revalidatePath(`/director/players/${input.playerId}`)

    return { ok: true, error: null, eventId: event?.id as string }
  } catch {
    return { ok: false, error: 'Unexpected error creating assessment event' }
  }
}

// ── Complete Assessment Event ─────────────────────────────────────────────────

export interface CompleteAssessmentEventInput {
  eventId: string
  playerId: string
  scores: {
    technical_score?: number | null
    tactical_score?: number | null
    movement_score?: number | null
    competition_score?: number | null
    behavioral_score?: number | null
  }
  strengths?: string[]
  weaknesses?: string[]
  priorities?: string[]
  notes?: string | null
  promotionReady?: boolean
}

export interface CompleteAssessmentEventResult {
  ok: boolean
  error: string | null
  assessmentId?: string | null
  comparisonSummary?: string | null
  blueprintRecommendation?: string | null
}

export async function completeAssessmentEventAction(
  input: CompleteAssessmentEventInput,
): Promise<CompleteAssessmentEventResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable' }
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role as UserRole | undefined
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, error: 'Director or head coach role required' }
  }

  const rawDb = supabase as any

  // Fetch the assessment event — verify ownership
  const { data: event } = await rawDb
    .from('assessment_events')
    .select('id, status, assessment_type, assessment_mode, previous_assessment_id, player_id')
    .eq('id', input.eventId)
    .eq('academy_id', academyId)
    .single()

  if (!event) return { ok: false, error: 'Assessment event not found' }
  if (!['draft', 'scheduled', 'in_progress'].includes(event.status as string)) {
    return { ok: false, error: `Cannot complete an event in status '${event.status as string}'` }
  }

  const now = new Date().toISOString()
  const today = now.split('T')[0]

  // Create the scored assessment record
  const { data: newAssessment, error: assessmentError } = await supabase
    .from('assessments')
    .insert({
      academy_id:        academyId,
      player_id:         input.playerId,
      assessed_by:       user.id,
      assessed_date:     today,
      type:              (event.assessment_type as AssessmentType) ?? 'ad_hoc',
      is_baseline:       false,
      technical_score:   input.scores.technical_score ?? null,
      tactical_score:    input.scores.tactical_score ?? null,
      movement_score:    input.scores.movement_score ?? null,
      competition_score: input.scores.competition_score ?? null,
      behavioral_score:  input.scores.behavioral_score ?? null,
      strengths:         input.strengths ?? null,
      weaknesses:        input.weaknesses ?? null,
      priorities:        input.priorities ?? null,
      notes:             input.notes ?? null,
      promotion_ready:   input.promotionReady ?? false,
    })
    .select('id, overall_score')
    .single()

  if (assessmentError || !newAssessment) {
    return { ok: false, error: assessmentError?.message ?? 'Failed to create assessment record' }
  }

  // Run comparison if previous assessment exists
  let comparisonSummary: string | null = null
  let blueprintRecommendation: string | null = null

  if (event.previous_assessment_id) {
    const { data: prevAssessment } = await supabase
      .from('assessments')
      .select('id, assessed_date, technical_score, tactical_score, movement_score, competition_score, behavioral_score, overall_score, strengths, weaknesses, priorities')
      .eq('id', event.previous_assessment_id as string)
      .single()

    if (prevAssessment) {
      const prevSnapshot: AssessmentSnapshot = {
        id:                prevAssessment.id,
        assessed_date:     prevAssessment.assessed_date,
        technical_score:   prevAssessment.technical_score,
        tactical_score:    prevAssessment.tactical_score,
        movement_score:    prevAssessment.movement_score,
        competition_score: prevAssessment.competition_score,
        behavioral_score:  prevAssessment.behavioral_score,
        overall_score:     prevAssessment.overall_score,
        strengths:         prevAssessment.strengths,
        weaknesses:        prevAssessment.weaknesses,
        priorities:        prevAssessment.priorities,
      }

      const currentSnapshot: AssessmentSnapshot = {
        id:                newAssessment.id,
        assessed_date:     today,
        technical_score:   input.scores.technical_score ?? null,
        tactical_score:    input.scores.tactical_score ?? null,
        movement_score:    input.scores.movement_score ?? null,
        competition_score: input.scores.competition_score ?? null,
        behavioral_score:  input.scores.behavioral_score ?? null,
        overall_score:     newAssessment.overall_score,
        strengths:         input.strengths ?? null,
        weaknesses:        input.weaknesses ?? null,
        priorities:        input.priorities ?? null,
      }

      const comparison = compareAssessments(prevSnapshot, currentSnapshot)
      const updateRecs = generateBlueprintUpdateRecommendations(comparison)

      comparisonSummary = comparison.summaryText
      blueprintRecommendation = updateRecs.primaryAction
    }
  }

  // Update assessment event to completed
  await rawDb
    .from('assessment_events')
    .update({
      status:                      'completed',
      completed_at:                now,
      assessment_id:               newAssessment.id,
      blueprint_recommendation:    blueprintRecommendation,
    })
    .eq('id', input.eventId)
    .eq('academy_id', academyId)

  await writeAuditLog({
    db: supabase,
    academyId,
    actorId: user.id,
    actorRole: role,
    action: 'assessment_event_completed',
    targetType: 'assessment_events',
    targetId: input.eventId,
    payload: {
      assessment_id:           newAssessment.id,
      player_id:               input.playerId,
      blueprint_recommendation: blueprintRecommendation,
      has_comparison:          !!comparisonSummary,
    },
    sourceType: 'ui',
  })

  revalidatePath(`/director/players/${input.playerId}`)

  return {
    ok: true,
    error: null,
    assessmentId: newAssessment.id,
    comparisonSummary,
    blueprintRecommendation,
  }
}
