// Mega Sprint 2771–2800 — DONNA Academy DNA Foundation V1
// Academy DNA Models: the four canonical academy identity templates.
//
// Design rules:
//   - Pure TypeScript constants. No DB, no API, no React, no side effects.
//   - Extends existing InferredModel, DEFAULTS_BY_MODEL, and AcademyIdentityProfile.
//   - Academy-level concept — lives in src/lib/academyDNA/ (not src/lib/blueprint/).
//   - src/lib/blueprint/ remains player-specific (PlayerDevelopmentBlueprint).
//   - Four V1 models. Director selects one at onboarding. Stored as academy_dna_model_id
//     in academies.settings. No new DB table.

import type { InferredModel } from '@/lib/donna/onboarding/donnaOnboardingContextPack'

// ── Primary types ─────────────────────────────────────────────────────────────

export type AcademyDNAModelId =
  | '12u_foundation'
  | 'performance_12plus'
  | 'college_placement'
  | 'club_growth'

export type DNAProgramPriority =
  | 'player_advancement'
  | 'coach_accountability'
  | 'parent_communication'
  | 'curriculum_structure'
  | 'competition_readiness'
  | 'retention_growth'
  | 'enrollment_growth'
  | 'assessment_compliance'
  | 'skill_development'
  | 'college_recruiting'

export type AssessmentCadenceLabel =
  | 'monthly'
  | 'every_6_weeks'
  | 'quarterly'
  | 'event_triggered'

// ── Domain weight schema ──────────────────────────────────────────────────────

export interface CurriculumDomainEmphasis {
  technique:   number  // 0–100
  tactics:     number
  games:       number
  competition: number
  movement:    number
  mental:      number
  fun:         number
}

export interface AssessmentDomainEmphasis {
  technical: number  // weights sum to 100
  tactical:  number
  fitness:   number
  mental:    number
}

// ── Sub-model types ───────────────────────────────────────────────────────────

export interface CoachStandards {
  recapExpectation:  'every_session' | 'weekly' | 'as_needed'
  observationDepth:  'detailed' | 'standard' | 'minimal'
  autonomyLevel:     'high' | 'medium' | 'low'
  developmentFocus:  string
}

export interface ParentCommunicationStandards {
  transparency:    'minimal' | 'standard' | 'transparent'
  updateFrequency: 'weekly' | 'monthly' | 'milestone_only'
  tone:            string
  portalAccess:    'full' | 'progress_only' | 'minimal'
}

// ── Core model interface ──────────────────────────────────────────────────────

export interface AcademyDNAModel {
  id:                               AcademyDNAModelId
  name:                             string
  tagline:                          string
  goal:                             string
  bestFitAcademyType:               string
  defaultInferredModel:             InferredModel
  defaultActiveStages:              string[]
  defaultProgramPriorities:         DNAProgramPriority[]
  defaultCurriculumEmphasis:        CurriculumDomainEmphasis
  defaultAssessmentEmphasis:        AssessmentDomainEmphasis
  defaultAssessmentCadence:         AssessmentCadenceLabel
  defaultCoachStandards:            CoachStandards
  defaultParentCommunicationStandards: ParentCommunicationStandards
  defaultKPIs:                      string[]
  redFlags:                         string[]
  greenFlags:                       string[]
  donnaRecommendationTendencies:    string[]
}

// ── 12U Foundation Academy ────────────────────────────────────────────────────

const FOUNDATION_12U: AcademyDNAModel = {
  id:                   '12u_foundation',
  name:                 '12U Foundation Academy',
  tagline:              'Build the love of the game before the love of winning.',
  goal:                 'Long-term player development through fundamentals, movement, and enjoyment. Retention and enjoyment are the primary KPIs.',
  bestFitAcademyType:   'Junior development academies focused on Red Ball through Orange Ball players (ages 5–11).',
  defaultInferredModel: 'junior_development',
  defaultActiveStages:  ['red_ball', 'orange_ball'],
  defaultProgramPriorities: [
    'skill_development',
    'retention_growth',
    'parent_communication',
    'curriculum_structure',
    'coach_accountability',
  ],
  defaultCurriculumEmphasis: {
    technique:   18,
    tactics:      8,
    games:       28,
    competition:  5,
    movement:    22,
    mental:      10,
    fun:          9,
  },
  defaultAssessmentEmphasis: {
    technical: 35,
    tactical:  15,
    fitness:   30,
    mental:    20,
  },
  defaultAssessmentCadence: 'every_6_weeks',
  defaultCoachStandards: {
    recapExpectation: 'every_session',
    observationDepth: 'standard',
    autonomyLevel:    'medium',
    developmentFocus: 'Player engagement, enthusiasm, and fundamental movement patterns.',
  },
  defaultParentCommunicationStandards: {
    transparency:    'standard',
    updateFrequency: 'monthly',
    tone:            'encouraging and celebratory — parents are partners in building the love of the game',
    portalAccess:    'progress_only',
  },
  defaultKPIs: [
    'attendance_rate',
    'session_enjoyment_signals',
    'coach_wrap_up_completion',
    'level_milestone_completions',
    'player_retention_rate',
    'parent_satisfaction_signals',
  ],
  redFlags: [
    'Player dropout or disengagement',
    'Coach recap gaps exceeding 3 sessions',
    'Parent complaints about communication frequency',
    'Assessment overdue by 4+ weeks',
    'Low session attendance trend',
  ],
  greenFlags: [
    'Consistent attendance above 85%',
    'Positive coach observation notes',
    'Level milestone completions on schedule',
    'Parent-initiated positive communication',
    'Players requesting extra practice',
  ],
  donnaRecommendationTendencies: [
    'Surfaces player enjoyment and engagement signals first',
    'Flags attendance drops within 2 sessions',
    'Emphasizes parent communication milestones',
    'Recommends fun-first curriculum adjustments when assessment scores drop',
    'Prioritizes retention signals over advancement signals',
    'Morning brief leads with coach wrap-up compliance',
  ],
}

// ── 12+ Performance Academy ───────────────────────────────────────────────────

const PERFORMANCE_12PLUS: AcademyDNAModel = {
  id:                   'performance_12plus',
  name:                 '12+ Performance Academy',
  tagline:              'Structured development. Clear standards. Competitive readiness.',
  goal:                 'Competition readiness and structured player progression with measurable standards at every level.',
  bestFitAcademyType:   'Competitive junior academies focused on Green Ball through High Performance players (ages 10+).',
  defaultInferredModel: 'high_performance',
  defaultActiveStages:  ['orange_ball', 'green_ball', 'yellow_ball', 'high_performance'],
  defaultProgramPriorities: [
    'player_advancement',
    'assessment_compliance',
    'coach_accountability',
    'competition_readiness',
    'curriculum_structure',
  ],
  defaultCurriculumEmphasis: {
    technique:   30,
    tactics:     25,
    games:       10,
    competition: 15,
    movement:    10,
    mental:       8,
    fun:          2,
  },
  defaultAssessmentEmphasis: {
    technical: 40,
    tactical:  30,
    fitness:   15,
    mental:    15,
  },
  defaultAssessmentCadence: 'monthly',
  defaultCoachStandards: {
    recapExpectation: 'every_session',
    observationDepth: 'detailed',
    autonomyLevel:    'low',
    developmentFocus: 'Technical precision, tactical execution, and competition preparation.',
  },
  defaultParentCommunicationStandards: {
    transparency:    'standard',
    updateFrequency: 'monthly',
    tone:            'outcome-focused and data-supported — parents expect clear progress evidence',
    portalAccess:    'progress_only',
  },
  defaultKPIs: [
    'assessment_completion_rate',
    'advancement_pipeline_health',
    'coach_wrap_up_rate',
    'session_quality_score',
    'competition_entry_rate',
    'level_stagnation_count',
  ],
  redFlags: [
    'Assessment overdue by more than 14 days',
    'Player stagnation exceeding 90 days at same level',
    'Coach recap completion below 80%',
    'Parent escalation about advancement decisions',
    'Competition readiness gap in top-level groups',
  ],
  greenFlags: [
    'Monthly assessment completion on schedule',
    'Clear advancement pipeline at every level',
    'Detailed coach observations per session',
    'Active competition calendar for eligible players',
    'Level gate compliance with documented rationale',
  ],
  donnaRecommendationTendencies: [
    'Leads morning brief with assessment overdue alerts',
    'Flags players stalled at same level for 60+ days',
    'Surfaces coach wrap-up gaps as accountability signals',
    'Recommends competition entries for assessment-ready players',
    'Prioritizes advancement pipeline visibility',
    'Escalates stagnation signals to director attention queue',
  ],
}

// ── College Placement Academy ─────────────────────────────────────────────────

const COLLEGE_PLACEMENT: AcademyDNAModel = {
  id:                   'college_placement',
  name:                 'College Placement Academy',
  tagline:              'Every session builds a recruiting profile.',
  goal:                 'College recruiting pipeline development — combining match-ready performance with academic eligibility and recruiting visibility.',
  bestFitAcademyType:   'Elite junior academies focused on Yellow Ball through High Performance players (ages 14+).',
  defaultInferredModel: 'high_performance',
  defaultActiveStages:  ['yellow_ball', 'high_performance'],
  defaultProgramPriorities: [
    'college_recruiting',
    'competition_readiness',
    'player_advancement',
    'assessment_compliance',
    'skill_development',
  ],
  defaultCurriculumEmphasis: {
    technique:   20,
    tactics:     30,
    games:        5,
    competition: 30,
    movement:     5,
    mental:       9,
    fun:          1,
  },
  defaultAssessmentEmphasis: {
    technical: 25,
    tactical:  35,
    fitness:   20,
    mental:    20,
  },
  defaultAssessmentCadence: 'event_triggered',
  defaultCoachStandards: {
    recapExpectation: 'every_session',
    observationDepth: 'detailed',
    autonomyLevel:    'low',
    developmentFocus: 'Match tactics, mental performance, and competitive results for recruiting profile.',
  },
  defaultParentCommunicationStandards: {
    transparency:    'transparent',
    updateFrequency: 'weekly',
    tone:            'results-focused and recruiting-aware — parents are active partners in the recruiting process',
    portalAccess:    'full',
  },
  defaultKPIs: [
    'utr_trend',
    'competition_win_rate',
    'recruiting_contact_count',
    'assessment_compliance_rate',
    'match_play_volume',
    'tournament_entry_rate',
  ],
  redFlags: [
    'UTR stagnation or decline over 60 days',
    'Missed competition entry windows',
    'No recruiting contacts in 30 days for eligible players',
    'Coach not documenting match performance observations',
    'Assessment overdue before key tournament',
  ],
  greenFlags: [
    'UTR trend positive for 3+ months',
    'Active competition schedule with documented results',
    'College coach contacts increasing',
    'Strong mental performance notes from coach',
    'Player requesting extra match play',
  ],
  donnaRecommendationTendencies: [
    'Leads with UTR trends and tournament windows',
    'Flags recruiting timeline milestones',
    'Surfaces competition readiness assessments proactively',
    'Recommends match play volume adjustments based on assessment',
    'Tracks college contact pipeline',
    'Escalates UTR stagnation to director immediately',
  ],
}

// ── Club Growth Academy ───────────────────────────────────────────────────────

const CLUB_GROWTH: AcademyDNAModel = {
  id:                   'club_growth',
  name:                 'Club Growth Academy',
  tagline:              'Great experience. Strong community. Players who stay.',
  goal:                 'Player retention, community building, and sustainable enrollment growth through exceptional player and family experience.',
  bestFitAcademyType:   'Mixed-level academies serving recreational and developmental players across all age groups.',
  defaultInferredModel: 'dual_track',
  defaultActiveStages:  ['red_ball', 'orange_ball', 'green_ball', 'yellow_ball'],
  defaultProgramPriorities: [
    'retention_growth',
    'enrollment_growth',
    'parent_communication',
    'skill_development',
    'coach_accountability',
  ],
  defaultCurriculumEmphasis: {
    technique:   14,
    tactics:      9,
    games:       30,
    competition:  6,
    movement:    16,
    mental:       9,
    fun:         16,
  },
  defaultAssessmentEmphasis: {
    technical: 30,
    tactical:  20,
    fitness:   25,
    mental:    25,
  },
  defaultAssessmentCadence: 'quarterly',
  defaultCoachStandards: {
    recapExpectation: 'weekly',
    observationDepth: 'standard',
    autonomyLevel:    'high',
    developmentFocus: 'Player enjoyment, engagement, and confidence-building across all levels.',
  },
  defaultParentCommunicationStandards: {
    transparency:    'minimal',
    updateFrequency: 'milestone_only',
    tone:            'warm and welcoming — emphasize the community and progress milestones',
    portalAccess:    'minimal',
  },
  defaultKPIs: [
    'player_retention_rate',
    'enrollment_growth_rate',
    'parent_satisfaction_score',
    'referral_rate',
    'session_completion_rate',
    'player_milestone_completions',
  ],
  redFlags: [
    'Enrollment decline over 30 days',
    'Player dropout spike',
    'Parent complaints about communication or experience',
    'Coach recap pattern showing low engagement notes',
    'No new enrollments in 30 days',
  ],
  greenFlags: [
    'High retention rate (85%+)',
    'Referral-driven new enrollments',
    'Positive parent communication initiated',
    'Player milestone celebrations visible',
    'Coach notes reflecting high player energy',
  ],
  donnaRecommendationTendencies: [
    'Leads morning brief with retention and enrollment signals',
    'Flags player dropout risk patterns early',
    'Surfaces parent engagement opportunities',
    'Emphasizes community and milestone celebration moments',
    'Recommends communication touchpoints before parents go quiet',
    'Deprioritizes competition signals unless explicitly requested',
  ],
}

// ── Library ───────────────────────────────────────────────────────────────────

export const ACADEMY_DNA_MODELS: Record<AcademyDNAModelId, AcademyDNAModel> = {
  '12u_foundation':    FOUNDATION_12U,
  'performance_12plus': PERFORMANCE_12PLUS,
  'college_placement': COLLEGE_PLACEMENT,
  'club_growth':       CLUB_GROWTH,
}

export function getAcademyDNAModel(id: AcademyDNAModelId): AcademyDNAModel {
  return ACADEMY_DNA_MODELS[id]
}

export function getAcademyDNAModelSafe(id: string): AcademyDNAModel | null {
  return (ACADEMY_DNA_MODELS as Record<string, AcademyDNAModel>)[id] ?? null
}

export const ACADEMY_DNA_MODEL_IDS: AcademyDNAModelId[] = [
  '12u_foundation',
  'performance_12plus',
  'college_placement',
  'club_growth',
]
