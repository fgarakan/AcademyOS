'use server'

// Sprint 1112 — Player Development Blueprint Generation
//
// Called immediately after activatePlayerAction succeeds.
// Generates the complete development blueprint for a newly placed player:
//
//   1. Fetches placement_recommendation + assessment data + curriculum level
//   2. Runs blueprintGenerator (pure TypeScript — deterministic, no AI)
//   3. Archives any existing active blueprint for this player
//   4. Inserts new player_development_blueprints row
//   5. Creates 3 player_mission_assignments (status=pending_review — director review required)
//   6. Upserts player_development_summary with parent-safe summary
//   7. Writes audit log
//
// Safety:
//   - academyId always resolved server-side
//   - Director or head_coach only
//   - Blueprint generation is additive — failure does NOT roll back placement
//   - Missions go into pending_review (never auto-activated without director approval)
//   - Parent summary only visible after director sets show_to_parent=true
//   - Table uses rawDb (player_development_blueprints not in generated types)

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import { generateBlueprint, type BlueprintInput } from '@/lib/blueprint/blueprintGenerator'
import type { CurriculumStage } from '@/lib/blueprint/priorityEngine'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

export interface GenerateBlueprintResult {
  ok: boolean
  error: string | null
  blueprintId?: string | null
  missionIds?: string[]
  /** true when migration 078 has not been applied to the live DB */
  isSchemaMissing?: boolean
}

export async function generateBlueprintAction(
  playerId: string,
  academyId: string,
): Promise<GenerateBlueprintResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  // 2. Verify academyId matches server-side profile (never trust client param directly)
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id || profile.academy_id !== academyId) {
    return { ok: false, error: 'Academy context mismatch' }
  }

  // 3. Role check
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

  // 4. Fetch player
  const { data: player } = await supabase
    .from('players')
    .select('id, first_name, last_name, full_name, status')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()

  if (!player) return { ok: false, error: 'Player not found in this academy' }

  // 5. Fetch most recent placement_recommendation (activated status)
  const { data: placement } = await rawDb
    .from('placement_recommendations')
    .select('id, assessment_id, recommended_level_id, recommendation_strengths, recommendation_weaknesses, recommended_priorities, recommendation_rationale')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .eq('status', 'activated')
    .order('activated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // 6. Fetch assessment (from placement or latest baseline)
  let assessment: {
    id: string
    technical_score: number | null
    tactical_score: number | null
    movement_score: number | null
    competition_score: number | null
    behavioral_score: number | null
    overall_score: number | null
    strengths: string[] | null
    weaknesses: string[] | null
    priorities: string[] | null
  } | null = null

  const assessmentId = placement?.assessment_id ?? null
  if (assessmentId) {
    const { data: a } = await supabase
      .from('assessments')
      .select('id, technical_score, tactical_score, movement_score, competition_score, behavioral_score, overall_score, strengths, weaknesses, priorities')
      .eq('id', assessmentId)
      .eq('academy_id', academyId)
      .single()
    assessment = a
  }

  // Fallback: use latest baseline assessment if no placement assessment
  if (!assessment) {
    const { data: a } = await supabase
      .from('assessments')
      .select('id, technical_score, tactical_score, movement_score, competition_score, behavioral_score, overall_score, strengths, weaknesses, priorities')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .eq('is_baseline', true)
      .order('assessed_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    assessment = a
  }

  // 7. Fetch curriculum level
  let levelName = 'Orange Ball 1'
  let levelStage: CurriculumStage = 'orange_development'
  let levelId: string | null = placement?.recommended_level_id ?? null

  if (levelId) {
    const { data: level } = await supabase
      .from('curriculum_levels')
      .select('id, display_name, stage')
      .eq('id', levelId)
      .single()
    if (level) {
      levelName  = level.display_name
      levelStage = level.stage as CurriculumStage
    }
  }

  // 8. Assemble strengths and gaps from assessment + placement
  const strengths = (
    assessment?.strengths ??
    placement?.recommendation_strengths ??
    []
  ) as string[]

  const gaps = (
    assessment?.weaknesses ??
    placement?.recommendation_weaknesses ??
    []
  ) as string[]

  // 9. Build blueprint input
  const blueprintInput: BlueprintInput = {
    playerId,
    academyId,
    playerFirstName:            player.first_name,
    playerLastName:             player.last_name,
    curriculumLevelId:          levelId,
    curriculumLevelName:        levelName,
    curriculumStageKey:         levelStage,
    assessmentId:               assessment?.id ?? null,
    scores: {
      technical_score:   assessment?.technical_score ?? null,
      tactical_score:    assessment?.tactical_score ?? null,
      movement_score:    assessment?.movement_score ?? null,
      competition_score: assessment?.competition_score ?? null,
      behavioral_score:  assessment?.behavioral_score ?? null,
    },
    strengths,
    gaps,
    placementRecommendationId: placement?.id ?? null,
    placementRationale:        placement?.recommendation_rationale ?? null,
    generatedByUserId:         user.id,
  }

  // 10. Generate blueprint (pure TypeScript, deterministic)
  const blueprint = generateBlueprint(blueprintInput)

  // 11. Archive any existing active blueprint for this player
  try {
    await rawDb
      .from('player_development_blueprints')
      .update({ status: 'superseded', superseded_at: new Date().toISOString() })
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .eq('status', 'active')
  } catch {
    // Blueprint table may not exist yet — proceed gracefully
  }

  // 12. Insert new blueprint row
  let blueprintId: string | null = null
  try {
    const { data: newBlueprint, error: blueprintError } = await rawDb
      .from('player_development_blueprints')
      .insert({
        academy_id:                    academyId,
        player_id:                     playerId,
        assessment_id:                 assessment?.id ?? null,
        placement_recommendation_id:   placement?.id ?? null,
        curriculum_level_id:           levelId,
        curriculum_level_name:         levelName,
        curriculum_stage_key:          levelStage,
        technical_score:               assessment?.technical_score ?? null,
        tactical_score:                assessment?.tactical_score ?? null,
        movement_score:                assessment?.movement_score ?? null,
        competition_score:             assessment?.competition_score ?? null,
        behavioral_score:              assessment?.behavioral_score ?? null,
        overall_score:                 assessment?.overall_score ?? null,
        strengths,
        gaps,
        skill_priorities:              blueprint.priorities.skill,
        competition_priorities:        blueprint.priorities.competition,
        fitness_priorities:            blueprint.priorities.fitness,
        mental_priorities:             blueprint.priorities.mental,
        thirty_day_plan:               blueprint.thirtyDayPlan,
        coach_brief:                   blueprint.coachBrief,
        coach_focus_areas:             blueprint.coachFocusAreas,
        parent_summary:                blueprint.parentSummary,
        parent_development_focus:      blueprint.parentDevelopmentFocus,
        parent_next_steps:             blueprint.parentNextSteps,
        parent_thirty_day_preview:     blueprint.parentThirtyDayPreview,
        donna_brief:                   blueprint.donnaBrief,
        status:                        'active',
        generated_by:                  user.id,
      })
      .select('id')
      .single()

    if (blueprintError) {
      if (
        blueprintError.code === '42P01' ||
        (typeof blueprintError.message === 'string' && blueprintError.message.includes('does not exist'))
      ) {
        return { ok: false, error: 'Migration 078 not applied. Blueprint table does not exist yet.', isSchemaMissing: true }
      }
      return { ok: false, error: blueprintError.message ?? 'Failed to insert blueprint' }
    }

    blueprintId = newBlueprint?.id as string | null
  } catch {
    return { ok: false, error: 'Unexpected error creating blueprint' }
  }

  // 13. Create 3 initial missions (status=pending_review — director review required)
  const missionIds: string[] = []
  for (const mission of blueprint.initialMissions) {
    try {
      const { data: missionRow, error: missionError } = await rawDb
        .from('player_mission_assignments')
        .insert({
          academy_id:              academyId,
          player_id:               playerId,
          mission_label:           mission.missionLabel,
          mission_description:     mission.description,
          curriculum_level_key:    mission.curriculumLevelKey,
          source_type:             'director',
          assigned_by:             user.id,
          status:                  'pending_review',
          period_label:            'First 30 Days',
          display_order:           blueprint.initialMissions.indexOf(mission),
        })
        .select('id')
        .single()

      if (!missionError && missionRow?.id) {
        missionIds.push(missionRow.id as string)
      }
    } catch {
      // Mission table may not exist — non-fatal, proceed
    }
  }

  // 14. Upsert player_development_summary with parent-safe content
  //     show_to_parent remains false — director must explicitly enable
  try {
    const { data: existingSummary } = await supabase
      .from('player_development_summary')
      .select('id')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .maybeSingle()

    if (existingSummary?.id) {
      await supabase
        .from('player_development_summary')
        .update({
          current_strengths:         strengths.slice(0, 5),
          things_to_work_on:         gaps.slice(0, 5),
          development_focus:         blueprint.thirtyDayPlan.skillFocus,
          coach_summary:             blueprint.coachBrief,
          parent_summary:            blueprint.parentSummary,
          student_friendly_summary:  blueprint.parentThirtyDayPreview,
          show_to_parent:            false,
          show_to_student:           false,
          source:                    'blueprint_generation',
          updated_by:                user.id,
        })
        .eq('id', existingSummary.id)
    } else {
      await supabase
        .from('player_development_summary')
        .insert({
          academy_id:                academyId,
          player_id:                 playerId,
          created_by:                user.id,
          current_strengths:         strengths.slice(0, 5),
          things_to_work_on:         gaps.slice(0, 5),
          development_focus:         blueprint.thirtyDayPlan.skillFocus,
          coach_summary:             blueprint.coachBrief,
          parent_summary:            blueprint.parentSummary,
          student_friendly_summary:  blueprint.parentThirtyDayPreview,
          show_to_parent:            false,
          show_to_student:           false,
          source:                    'blueprint_generation',
        })
    }
  } catch {
    // player_development_summary write failure is non-fatal
  }

  // 15. Write audit log
  await writeAuditLog({
    db: supabase,
    academyId,
    actorId:     user.id,
    actorRole:   role,
    action:      'player_blueprint_generated',
    targetType:  'player_development_blueprints',
    targetId:    blueprintId,
    targetLabel: player.full_name ?? `${player.first_name} ${player.last_name}`,
    payload: {
      blueprint_id:              blueprintId,
      player_id:                 playerId,
      curriculum_level:          levelName,
      curriculum_stage:          levelStage,
      missions_created:          missionIds.length,
      missions_pending_review:   missionIds,
      top_skill_priority:        blueprint.priorities.skill[0]?.label,
      top_competition_priority:  blueprint.priorities.competition[0]?.label,
      top_fitness_priority:      blueprint.priorities.fitness[0]?.label,
      top_mental_priority:       blueprint.priorities.mental[0]?.label,
      assessment_id:             assessment?.id ?? null,
    },
    sourceType: 'ui',
  })

  revalidatePath(`/director/players/${playerId}`)
  revalidatePath('/director/players')
  revalidatePath('/director/review')

  return { ok: true, error: null, blueprintId, missionIds }
}
