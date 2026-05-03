import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/lib/supabase/database.types'

export type CurriculumLevel = Tables<'curriculum_levels'>

export type CurriculumGate = {
  id: string
  gate_id: string
  from_level_id: string
  to_level_id: string | null
  domain: string
  criterion: string
  gate_type: string
  threshold: string
  recording_method: string
  evidence_window: string
  evaluator: string
  cadence: string
  notes: string | null
  sort_order: number
  is_active: boolean
}

export type CurriculumDrill = {
  id: string
  drill_id: string
  academy_id: string | null
  name: string
  level_min_id: string | null
  level_max_id: string | null
  domain: string
  session_block: string
  objective: string
  setup: string | null
  coaching_cues: Record<string, string> | null
  progression_easier: string | null
  progression_harder: string | null
  success_criteria: string | null
  duration_minutes: number | null
  players_needed: number | null
  source_type: string
  is_active: boolean
}

export type CurriculumCoachLanguage = {
  id: string
  level_id: string
  domain: string
  doing_well: string
  working_on: string
  current_focus: string
  next_step: string
}

export type CurriculumCompetitionTrack = {
  id: string
  level_id: string
  match_format: string | null
  scoring_system: string | null
  opponent_pool: string | null
  tournament_cadence: string | null
  win_loss_target: string | null
  competition_behaviors: string | null
  parent_role: string | null
  coach_role: string | null
  transition_signal: string | null
}

export type CurriculumFitnessGuidance = {
  id: string
  level_id: string
  fitness_phase: string
  primary_energy_system: string | null
  strength_band: string | null
  off_court_sessions_per_week_min: number | null
  off_court_sessions_per_week_max: number | null
  coaching_notes: string | null
}

export type CurriculumVolumeGuidance = {
  id: string
  level_id: string
  weekly_hours_min: number | null
  weekly_hours_max: number | null
  sessions_per_week_min: number | null
  sessions_per_week_max: number | null
  session_duration_min_minutes: number | null
  session_duration_max_minutes: number | null
  typical_stage_months_min: number | null
  typical_stage_months_max: number | null
  reassessment_cadence_weeks: number | null
  acr_target_range: string | null
}

export type CurriculumExplorerData = {
  levels: CurriculumLevel[]
  gates: CurriculumGate[]
  drills: CurriculumDrill[]
  coachLanguage: CurriculumCoachLanguage[]
  competitionTrack: CurriculumCompetitionTrack[]
  fitnessGuidance: CurriculumFitnessGuidance[]
  volumeGuidance: CurriculumVolumeGuidance[]
  tablesAvailable: boolean
}

type DB = SupabaseClient<Database>

export async function getCurriculumExplorerData(db: DB): Promise<CurriculumExplorerData> {
  const rawDb = db as any

  const { data: levels } = await db
    .from('curriculum_levels')
    .select('*')
    .order('sort_order', { ascending: true })

  const [
    { data: gates, error: gatesError },
    { data: drills, error: drillsError },
    { data: coachLanguage, error: clError },
    { data: competitionTrack, error: ctError },
    { data: fitnessGuidance, error: fgError },
    { data: volumeGuidance, error: vgError },
  ] = await Promise.all([
    rawDb
      .from('curriculum_gates')
      .select('id,gate_id,from_level_id,to_level_id,domain,criterion,gate_type,threshold,recording_method,evidence_window,evaluator,cadence,notes,sort_order,is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    rawDb
      .from('curriculum_drills')
      .select('id,drill_id,academy_id,name,level_min_id,level_max_id,domain,session_block,objective,setup,coaching_cues,progression_easier,progression_harder,success_criteria,duration_minutes,players_needed,source_type,is_active')
      .eq('is_active', true)
      .is('academy_id', null)
      .order('drill_id', { ascending: true }),
    rawDb
      .from('curriculum_coach_language')
      .select('id,level_id,domain,doing_well,working_on,current_focus,next_step')
      .order('domain', { ascending: true }),
    rawDb
      .from('curriculum_competition_track')
      .select('id,level_id,match_format,scoring_system,opponent_pool,tournament_cadence,win_loss_target,competition_behaviors,parent_role,coach_role,transition_signal'),
    rawDb
      .from('curriculum_fitness_guidance')
      .select('id,level_id,fitness_phase,primary_energy_system,strength_band,off_court_sessions_per_week_min,off_court_sessions_per_week_max,coaching_notes'),
    rawDb
      .from('curriculum_volume_guidance')
      .select('id,level_id,weekly_hours_min,weekly_hours_max,sessions_per_week_min,sessions_per_week_max,session_duration_min_minutes,session_duration_max_minutes,typical_stage_months_min,typical_stage_months_max,reassessment_cadence_weeks,acr_target_range'),
  ])

  const tablesAvailable = !gatesError && !drillsError && !clError && !ctError && !fgError && !vgError

  return {
    levels: levels ?? [],
    gates: tablesAvailable ? (gates ?? []) : [],
    drills: tablesAvailable ? (drills ?? []) : [],
    coachLanguage: tablesAvailable ? (coachLanguage ?? []) : [],
    competitionTrack: tablesAvailable ? (competitionTrack ?? []) : [],
    fitnessGuidance: tablesAvailable ? (fitnessGuidance ?? []) : [],
    volumeGuidance: tablesAvailable ? (volumeGuidance ?? []) : [],
    tablesAvailable,
  }
}
