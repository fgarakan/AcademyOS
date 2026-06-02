'use server'

// DONNA Post-Assessment Placement Recommendation Action
//
// Called after assessment completion (from completeAssessmentEventAction or directly).
// Generates a structured placement recommendation using the placementRecommendationEngine,
// inserts it into donna_placement_recommendations, and creates a proposed_actions
// row so it appears in the director's review queue.
//
// Safety:
//   - academyId always server-resolved
//   - Director or head_coach only
//   - No placement is made — recommendation only
//   - proposed_actions row routes to director review queue

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import {
  generatePlacementRecommendation,
  type PlacementContext,
  type AssessmentScoreInput,
  type LevelOption,
  type GroupOption,
} from '@/lib/blueprint/placementRecommendationEngine'
import type { Database } from '@/lib/supabase/database.types'
import type { CurriculumStage } from '@/lib/blueprint/placementRecommendationEngine'

type UserRole = Database['public']['Enums']['user_role']

export interface DonnaPlacementRecommendationInput {
  playerId: string
  assessmentId?: string | null
}

export interface DonnaPlacementRecommendationResult {
  ok: boolean
  error: string | null
  recommendationId?: string | null
  proposedActionId?: string | null
  isSchemaMissing?: boolean
}

export async function donnaPlacementRecommendationAction(
  input: DonnaPlacementRecommendationInput,
): Promise<DonnaPlacementRecommendationResult> {
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
    .select('id, first_name, last_name, date_of_birth, full_name')
    .eq('id', input.playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return { ok: false, error: 'Player not found in this academy' }

  const rawDb = supabase as any

  // 1. Fetch assessment scores
  let scores: AssessmentScoreInput = {
    technical_score: null, tactical_score: null,
    movement_score: null, competition_score: null, behavioral_score: null,
  }

  if (input.assessmentId) {
    const { data: assessment } = await supabase
      .from('assessments')
      .select('technical_score, tactical_score, movement_score, competition_score, behavioral_score')
      .eq('id', input.assessmentId)
      .eq('academy_id', academyId)
      .single()
    if (assessment) {
      scores = {
        technical_score:   assessment.technical_score,
        tactical_score:    assessment.tactical_score,
        movement_score:    assessment.movement_score,
        competition_score: assessment.competition_score,
        behavioral_score:  assessment.behavioral_score,
      }
    }
  } else {
    // Use most recent assessment
    const { data: latestAssessment } = await supabase
      .from('assessments')
      .select('id, technical_score, tactical_score, movement_score, competition_score, behavioral_score')
      .eq('player_id', input.playerId)
      .eq('academy_id', academyId)
      .order('assessed_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (latestAssessment) {
      input.assessmentId = latestAssessment.id
      scores = {
        technical_score:   latestAssessment.technical_score,
        tactical_score:    latestAssessment.tactical_score,
        movement_score:    latestAssessment.movement_score,
        competition_score: latestAssessment.competition_score,
        behavioral_score:  latestAssessment.behavioral_score,
      }
    }
  }

  // 2. Compute player age
  let playerAgeYears: number | null = null
  if (player.date_of_birth) {
    const dob = new Date(player.date_of_birth)
    const today = new Date()
    playerAgeYears = today.getFullYear() - dob.getFullYear() -
      (today.getMonth() < dob.getMonth() ||
       (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) ? 1 : 0)
  }

  // 3. Fetch current curriculum state
  let currentLevelId: string | null = null
  let currentLevelName: string | null = null
  let currentStage: string | null = null
  let gatesMet = 0
  let gatesTotal = 0

  const { data: csRows } = await rawDb
    .from('player_curriculum_states')
    .select('current_level_id')
    .eq('player_id', input.playerId)
    .eq('academy_id', academyId)
    .limit(1)

  currentLevelId = csRows?.[0]?.current_level_id ?? null

  if (currentLevelId) {
    const { data: lvl } = await supabase
      .from('curriculum_levels')
      .select('display_name, stage')
      .eq('id', currentLevelId)
      .single()
    currentLevelName = lvl?.display_name ?? null
    currentStage     = lvl?.stage ?? null

    // Gates — count from player_gate_status if available
    try {
      const { count: met } = await rawDb
        .from('player_gate_status')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', input.playerId)
        .eq('academy_id', academyId)
        .in('status', ['evidence_threshold_met', 'confirmed'])
      const { count: total } = await rawDb
        .from('curriculum_gates')
        .select('*', { count: 'exact', head: true })
        .eq('level_id', currentLevelId)
      gatesMet   = (met as number | null) ?? 0
      gatesTotal = (total as number | null) ?? 0
    } catch { /* table may not exist */ }
  }

  // 4. Fetch available levels and groups
  const { data: levelsData } = await supabase
    .from('curriculum_levels')
    .select('id, display_name, stage, level_number, sort_order')
    .order('sort_order', { ascending: true })

  const levels: LevelOption[] = ((levelsData ?? []) as LevelOption[])

  const { data: groupsData } = await supabase
    .from('groups')
    .select('id, name, track, level_id, min_age, max_age, max_players')
    .eq('academy_id', academyId)
    .eq('is_active', true)

  const groups: GroupOption[] = ((groupsData ?? []) as GroupOption[])

  // 5. Run the recommendation engine
  const context: PlacementContext = {
    playerAgeYears,
    currentLevelId,
    currentLevelName,
    currentStage,
    gatesMet,
    gatesTotal,
    availableLevels: levels,
    availableGroups: groups,
  }

  const recommendation = generatePlacementRecommendation(scores, context)

  // 6. Insert donna_placement_recommendations row
  let recommendationId: string | null = null
  try {
    const { data: recRow, error: insertError } = await rawDb
      .from('donna_placement_recommendations')
      .insert({
        academy_id:                   academyId,
        player_id:                    input.playerId,
        assessment_id:                input.assessmentId ?? null,
        input_technical_score:        scores.technical_score,
        input_tactical_score:         scores.tactical_score,
        input_movement_score:         scores.movement_score,
        input_competition_score:      scores.competition_score,
        input_behavioral_score:       scores.behavioral_score,
        input_overall_avg:            recommendation.computedOverallAvg,
        input_player_age_years:       playerAgeYears,
        input_current_level_id:       currentLevelId,
        input_current_level_name:     currentLevelName,
        input_current_stage:          currentStage,
        input_gates_met:              gatesMet,
        input_gates_total:            gatesTotal,
        recommended_stage:            recommendation.recommendedStage,
        recommended_level_id:         recommendation.recommendedLevelId,
        recommended_level_name:       recommendation.recommendedLevelName,
        recommended_group_id:         recommendation.recommendedGroupId,
        recommended_group_name:       recommendation.recommendedGroupName,
        confidence_score:             recommendation.confidenceScore,
        confidence_tier:              recommendation.confidenceTier,
        top_reasons:                  recommendation.topReasons,
        limiting_factors:             recommendation.limitingFactors,
        risk_notes:                   recommendation.riskNotes,
        alternative_placements:       recommendation.alternativePlacements,
        donna_explanation:            recommendation.donnaExplanation,
        evidence_used:                recommendation.evidenceUsed,
        check_after_4_to_6_weeks:     recommendation.checkAfter4to6Weeks,
        recommended_reassessment_weeks: recommendation.recommendedReassessmentWeeks,
        status:                       'pending_director_review',
        generated_by:                 user.id,
      })
      .select('id')
      .single()

    if (insertError) {
      if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
        return { ok: false, error: 'Migration 080 not applied. Apply donna_placement_recommendations migration first.', isSchemaMissing: true }
      }
      return { ok: false, error: insertError.message ?? 'Failed to save placement recommendation' }
    }

    recommendationId = recRow?.id as string | null
  } catch {
    return { ok: false, error: 'Unexpected error creating placement recommendation' }
  }

  // 7. Create proposed_actions row → appears in review queue
  let proposedActionId: string | null = null
  try {
    const { data: paRow } = await rawDb
      .from('proposed_actions')
      .insert({
        academy_id:       academyId,
        actor_id:         user.id,
        player_id:        input.playerId,
        target_module:    'donna_placement_recommendation',
        status:           'pending_review',
        proposed_payload: {
          recommendation_id:      recommendationId,
          recommended_level_name: recommendation.recommendedLevelName,
          recommended_group_name: recommendation.recommendedGroupName,
          confidence_score:       recommendation.confidenceScore,
          confidence_tier:        recommendation.confidenceTier,
          top_reasons:            recommendation.topReasons.slice(0, 2),
          assessment_id:          input.assessmentId,
          player_name:            player.full_name ?? `${player.first_name} ${player.last_name}`,
        },
      })
      .select('id')
      .single()
    proposedActionId = paRow?.id as string | null

    // Link proposed_action back to recommendation
    if (proposedActionId && recommendationId) {
      await rawDb
        .from('donna_placement_recommendations')
        .update({ proposed_action_id: proposedActionId })
        .eq('id', recommendationId)
    }
  } catch { /* proposed_actions write failure is non-fatal */ }

  // 8. Audit log
  await writeAuditLog({
    db: supabase,
    academyId,
    actorId: user.id,
    actorRole: role,
    action: 'donna_placement_recommendation_generated',
    targetType: 'donna_placement_recommendations',
    targetId: recommendationId,
    targetLabel: player.full_name ?? `${player.first_name} ${player.last_name}`,
    payload: {
      recommendation_id:   recommendationId,
      proposed_action_id:  proposedActionId,
      assessment_id:       input.assessmentId,
      recommended_level:   recommendation.recommendedLevelName,
      recommended_group:   recommendation.recommendedGroupName,
      confidence:          recommendation.confidenceScore,
      confidence_tier:     recommendation.confidenceTier,
    },
    sourceType: 'ui',
  })

  revalidatePath(`/director/players/${input.playerId}`)
  revalidatePath('/director/review')

  return { ok: true, error: null, recommendationId, proposedActionId }
}
