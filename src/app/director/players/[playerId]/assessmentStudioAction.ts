'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import type { AssessmentLabel, AssessmentMode, AssessmentView, ScoresDetail } from '@/lib/assessment/assessmentTemplateTypes'
import { LABEL_TO_DB_TYPE } from '@/lib/assessment/assessmentTemplateTypes'
import { deriveDomainScores } from '@/lib/assessment/assessmentComparisonEngine'
import { writeAssessmentEvidence, writeReassessmentEvidence } from '@/lib/evidence/playerEvidenceWriter'

export interface AssessmentStudioInput {
  playerId:          string
  assessmentLabel:   AssessmentLabel
  assessmentView:    AssessmentView
  mode:              AssessmentMode
  scoresDetail:      ScoresDetail
  isBaseline:        boolean
  isReassessment:    boolean
  notes:             string | null
  templateVersionId: string | null
}

export interface AssessmentStudioResult {
  ok:           boolean
  assessmentId: string | null
  isDraft:      boolean
  error:        string | null
}

export async function submitAssessmentStudioAction(
  input: AssessmentStudioInput,
): Promise<AssessmentStudioResult> {
  await assertNotPreviewMode()

  if (!input.playerId) return { ok: false, assessmentId: null, isDraft: false, error: 'Missing player ID.' }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, assessmentId: null, isDraft: false, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, assessmentId: null, isDraft: false, error: 'Academy context unavailable.' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  const canDirectInsert = role === 'academy_director' || role === 'head_coach'
  const isCoach = role === 'coach'

  if (!canDirectInsert && !isCoach) {
    return { ok: false, assessmentId: null, isDraft: false, error: 'Director, Head Coach, or Coach role required.' }
  }

  const rawDb = supabase as any

  // Verify player belongs to this academy
  const { data: playerCheck } = await rawDb
    .from('players')
    .select('id')
    .eq('id', input.playerId)
    .eq('academy_id', profile.academy_id)
    .maybeSingle()

  if (!playerCheck) return { ok: false, assessmentId: null, isDraft: false, error: 'Player not found in your academy.' }

  const today = new Date().toISOString().split('T')[0]
  const dbType = LABEL_TO_DB_TYPE[input.assessmentLabel]
  const derived = deriveDomainScores(input.scoresDetail)

  // Attach version_id to scores_detail for the record
  const enrichedDetail: ScoresDetail = {
    ...input.scoresDetail,
    template_version_id: input.templateVersionId,
  }

  if (canDirectInsert) {
    // Director / Head Coach → direct insert into assessments
    const { data: inserted, error } = await rawDb
      .from('assessments')
      .insert({
        academy_id:        profile.academy_id,
        player_id:         input.playerId,
        assessed_by:       user.id,
        assessed_date:     today,
        type:              dbType,
        is_baseline:       input.isBaseline,
        promotion_ready:   false,
        technical_score:   derived.technical_score,
        tactical_score:    derived.tactical_score,
        movement_score:    derived.movement_score,
        competition_score: derived.competition_score,
        behavioral_score:  derived.behavioral_score,
        overall_score:     derived.overall_score,
        scores_detail:     enrichedDetail as any,
        notes:             input.notes?.trim() || null,
        version_id:        input.templateVersionId,
      })
      .select('id')
      .single()

    if (error) return { ok: false, assessmentId: null, isDraft: false, error: error.message }

    try {
      await rawDb.from('audit_logs').insert({
        academy_id: profile.academy_id,
        actor_id:   user.id,
        action:     'assessment.submitted',
        target_id:  inserted.id,
        payload: {
          player_id:         input.playerId,
          assessment_type:   dbType,
          assessment_label:  input.assessmentLabel,
          assessment_view:   input.assessmentView,
          mode:              input.mode,
          overall_score:     derived.overall_score,
          is_reassessment:   input.isReassessment,
          template_version:  input.templateVersionId,
          role,
        },
      })
    } catch { /* audit log failure is non-blocking */ }

    // Write to player_evidence_records (non-blocking)
    try {
      if (input.isReassessment) {
        await writeReassessmentEvidence(supabase, {
          academyId:          profile.academy_id,
          playerId:           input.playerId,
          assessmentId:       inserted?.id ?? input.playerId,
          overallDelta:       null,
          improvedCount:      0,
          declinedCount:      0,
          curriculumLevelId:  null,
          curriculumLevelName: input.assessmentView.replace(/_/g, ' '),
          createdBy:          user.id,
        })
      } else {
        await writeAssessmentEvidence(supabase, {
          academyId:          profile.academy_id,
          playerId:           input.playerId,
          assessmentId:       inserted?.id ?? input.playerId,
          overallScore:       derived.overall_score,
          assessmentLabel:    input.assessmentLabel,
          assessmentView:     input.assessmentView,
          curriculumLevelId:  null,
          curriculumLevelName: null,
          createdBy:          user.id,
        })
      }
    } catch { /* evidence write failure is non-blocking */ }

    revalidatePath(`/director/players/${input.playerId}`)
    return { ok: true, assessmentId: inserted?.id ?? null, isDraft: false, error: null }

  } else {
    // Coach → proposed_action draft for director review
    const { data: draft, error } = await rawDb
      .from('proposed_actions')
      .insert({
        academy_id:       profile.academy_id,
        target_module:    'assessment_studio_draft',
        target_object_id: input.playerId,
        status:           'pending_review',
        proposed_payload: {
          player_id:         input.playerId,
          assessment_label:  input.assessmentLabel,
          assessment_view:   input.assessmentView,
          mode:              input.mode,
          db_type:           dbType,
          scores_detail:     enrichedDetail,
          technical_score:   derived.technical_score,
          tactical_score:    derived.tactical_score,
          movement_score:    derived.movement_score,
          competition_score: derived.competition_score,
          behavioral_score:  derived.behavioral_score,
          overall_score:     derived.overall_score,
          notes:             input.notes?.trim() || null,
          assessed_date:     today,
          submitted_by:      user.id,
          template_version:  input.templateVersionId,
          is_baseline:       input.isBaseline,
          is_reassessment:   input.isReassessment,
          role,
        },
      })
      .select('id')
      .single()

    if (error) return { ok: false, assessmentId: null, isDraft: true, error: error.message }

    try {
      await rawDb.from('audit_logs').insert({
        academy_id: profile.academy_id,
        actor_id:   user.id,
        action:     'assessment.draft_submitted',
        target_id:  draft.id,
        payload: {
          player_id:        input.playerId,
          assessment_label: input.assessmentLabel,
          overall_score:    derived.overall_score,
          is_reassessment:  input.isReassessment,
        },
      })
    } catch { /* non-blocking */ }

    revalidatePath(`/director/players/${input.playerId}`)
    return { ok: true, assessmentId: draft?.id ?? null, isDraft: true, error: null }
  }
}

// Director approves a coach assessment draft and creates the official record
export interface ApproveDraftInput {
  proposedActionId: string
  editedScoresDetail?: ScoresDetail
  editedNotes?: string | null
}

export interface ApproveDraftResult {
  ok: boolean
  assessmentId: string | null
  error: string | null
}

export async function approveAssessmentDraftAction(
  input: ApproveDraftInput,
): Promise<ApproveDraftResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, assessmentId: null, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, assessmentId: null, error: 'Academy context unavailable.' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, assessmentId: null, error: 'Director or Head Coach required.' }
  }

  const rawDb = supabase as any

  // Load the proposed_action
  const { data: action } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, target_object_id, proposed_payload, status, target_module')
    .eq('id', input.proposedActionId)
    .eq('academy_id', profile.academy_id)
    .single()

  if (!action) return { ok: false, assessmentId: null, error: 'Draft not found.' }
  if (action.target_module !== 'assessment_studio_draft') return { ok: false, assessmentId: null, error: 'Not an assessment draft.' }
  if (action.status !== 'pending_review') return { ok: false, assessmentId: null, error: 'Draft is not pending review.' }

  const payload = action.proposed_payload as any
  const finalDetail: ScoresDetail = input.editedScoresDetail ?? payload.scores_detail
  const finalNotes: string | null = input.editedNotes !== undefined ? input.editedNotes : payload.notes

  // Re-derive scores in case director edited them
  const derived = deriveDomainScores(finalDetail)

  const { data: inserted, error: insertError } = await rawDb
    .from('assessments')
    .insert({
      academy_id:        profile.academy_id,
      player_id:         action.target_object_id,
      assessed_by:       payload.submitted_by ?? user.id,
      assessed_date:     payload.assessed_date ?? new Date().toISOString().split('T')[0],
      type:              payload.db_type ?? 'ad_hoc',
      is_baseline:       payload.is_baseline ?? false,
      promotion_ready:   false,
      technical_score:   derived.technical_score,
      tactical_score:    derived.tactical_score,
      movement_score:    derived.movement_score,
      competition_score: derived.competition_score,
      behavioral_score:  derived.behavioral_score,
      overall_score:     derived.overall_score,
      scores_detail:     finalDetail as any,
      notes:             finalNotes,
      version_id:        payload.template_version ?? null,
    })
    .select('id')
    .single()

  if (insertError) return { ok: false, assessmentId: null, error: insertError.message }

  // Mark proposed_action as executed
  await rawDb
    .from('proposed_actions')
    .update({ status: 'executed' })
    .eq('id', input.proposedActionId)

  try {
    await rawDb.from('audit_logs').insert({
      academy_id: profile.academy_id,
      actor_id:   user.id,
      action:     'assessment.draft_approved',
      target_id:  inserted.id,
      payload: {
        player_id:           action.target_object_id,
        proposed_action_id:  input.proposedActionId,
        overall_score:       derived.overall_score,
        director_edited:     !!input.editedScoresDetail,
        role,
      },
    })
  } catch { /* non-blocking */ }

  // Write to player_evidence_records (non-blocking)
  try {
    const isReassessment = (payload.is_reassessment as boolean | undefined) ?? false
    if (isReassessment) {
      await writeReassessmentEvidence(supabase, {
        academyId:          profile.academy_id,
        playerId:           action.target_object_id as string,
        assessmentId:       inserted?.id ?? input.proposedActionId,
        overallDelta:       null,
        improvedCount:      0,
        declinedCount:      0,
        curriculumLevelId:  null,
        curriculumLevelName: (payload.assessment_view as string | undefined)?.replace(/_/g, ' ') ?? null,
        createdBy:          user.id,
      })
    } else {
      await writeAssessmentEvidence(supabase, {
        academyId:          profile.academy_id,
        playerId:           action.target_object_id as string,
        assessmentId:       inserted?.id ?? input.proposedActionId,
        overallScore:       derived.overall_score,
        assessmentLabel:    (payload.assessment_label as string | undefined) ?? 'coach_requested',
        assessmentView:     (payload.assessment_view as string | undefined) ?? 'general',
        curriculumLevelId:  null,
        curriculumLevelName: null,
        createdBy:          user.id,
      })
    }
  } catch { /* evidence write failure is non-blocking */ }

  revalidatePath(`/director/players/${action.target_object_id}`)
  revalidatePath('/director/review')
  return { ok: true, assessmentId: inserted?.id ?? null, error: null }
}
