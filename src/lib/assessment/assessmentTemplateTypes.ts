// Assessment Template System — core types
// All assessment forms render from DB template, never from hardcoded arrays.

// ─── View (rendering context) ─────────────────────────────────────────────────

export type AssessmentView =
  | 'general'
  | 'red_ball'
  | 'orange_ball'
  | 'green_dot'
  | 'yellow_ball'
  | 'high_performance'

export const ASSESSMENT_VIEW_LABELS: Record<AssessmentView, string> = {
  general:          'General Intake',
  red_ball:         'Red Ball',
  orange_ball:      'Orange Ball',
  green_dot:        'Green Dot',
  yellow_ball:      'Yellow Ball',
  high_performance: 'High Performance',
}

export const ASSESSMENT_VIEW_ORDER: AssessmentView[] = [
  'general', 'red_ball', 'orange_ball', 'green_dot', 'yellow_ball', 'high_performance',
]

// Maps curriculum stage string → suggested assessment view
export function autoSuggestView(stage: string | null): AssessmentView {
  if (!stage) return 'general'
  const s = stage.toLowerCase()
  if (s.includes('red'))              return 'red_ball'
  if (s.includes('orange'))           return 'orange_ball'
  if (s.includes('green'))            return 'green_dot'
  if (s.includes('yellow'))           return 'yellow_ball'
  if (s.includes('high') || s.includes('performance') || s.includes('hp')) return 'high_performance'
  return 'general'
}

// ─── Mode ─────────────────────────────────────────────────────────────────────

export type AssessmentMode = 'quick' | 'standard' | 'deep'

export const ASSESSMENT_MODE_LABELS: Record<AssessmentMode, string> = {
  quick:    'Quick',
  standard: 'Standard',
  deep:     'Deep',
}

export const ASSESSMENT_MODE_DESCRIPTIONS: Record<AssessmentMode, string> = {
  quick:    'Key indicators only — 5 min',
  standard: 'Section overview + expandable skills — 15 min',
  deep:     'All sections, all skills fully scored — 30 min',
}

// ─── Assessment labels (UX types) → DB enum ──────────────────────────────────

export type AssessmentLabel =
  | 'onboarding_placement'
  | 'monthly_development_check'
  | 'quarterly_progress_review'
  | 'level_readiness_review'
  | 'competition_readiness_review'
  | 'coach_requested'
  | 'director_requested'
  | 'donna_recommended'

export const ASSESSMENT_LABEL_DISPLAY: Record<AssessmentLabel, string> = {
  onboarding_placement:       'Onboarding Placement',
  monthly_development_check:  'Monthly Development Check',
  quarterly_progress_review:  'Quarterly Progress Review',
  level_readiness_review:     'Level Readiness Review',
  competition_readiness_review: 'Competition Readiness Review',
  coach_requested:            'Coach Requested',
  director_requested:         'Director Requested',
  donna_recommended:          'DONNA Recommended',
}

// Maps UX label to the DB assessment_type enum (5 values)
export const LABEL_TO_DB_TYPE: Record<AssessmentLabel, string> = {
  onboarding_placement:         'intake',
  monthly_development_check:    'ad_hoc',
  quarterly_progress_review:    'quarterly',
  level_readiness_review:       'promotion',
  competition_readiness_review: 'ad_hoc',
  coach_requested:              'ad_hoc',
  director_requested:           'ad_hoc',
  donna_recommended:            'ad_hoc',
}

export const ASSESSMENT_LABEL_ORDER: AssessmentLabel[] = [
  'onboarding_placement',
  'monthly_development_check',
  'quarterly_progress_review',
  'level_readiness_review',
  'competition_readiness_review',
  'coach_requested',
  'director_requested',
  'donna_recommended',
]

// ─── Template DB row shapes ───────────────────────────────────────────────────

export interface TemplateRow {
  id: string
  academy_id: string | null
  name: string
  is_global: boolean
  platform_version: string
  description: string | null
}

export interface TemplateSectionRow {
  id: string
  template_id: string
  section_key: string
  display_name: string
  sort_order: number
  is_visible: boolean
  is_custom: boolean
  pathway_category: string | null
  level_applicability: string[]
  coach_guidance: string | null
  parent_safe_label: string | null
  player_safe_label: string | null
}

export interface TemplateSkillRow {
  id: string
  section_id: string
  template_id: string
  skill_key: string
  display_name: string
  sort_order: number
  is_visible: boolean
  is_custom: boolean
  is_required: boolean
  appears_in_quick: boolean
  appears_in_standard: boolean
  appears_in_deep: boolean
  scoring_scale: '1_10' | '1_5' | 'pass_fail'
  level_applicability: string[]
  pathway_category: string | null
  coach_guidance: string | null
  parent_safe_label: string | null
  player_safe_label: string | null
}

export interface TemplateVersionRow {
  id: string
  template_id: string
  academy_id: string | null
  version_num: number
  snapshot: unknown
  change_note: string | null
  created_by: string | null
  created_at: string
}

// ─── Normalized form config (output of template loader) ──────────────────────

export interface FormSkill {
  id: string
  skill_key: string
  display_name: string
  sort_order: number
  is_required: boolean
  scoring_scale: '1_10' | '1_5' | 'pass_fail'
  coach_guidance: string | null
}

export interface FormSection {
  id: string
  section_key: string
  display_name: string
  sort_order: number
  pathway_category: string | null
  coach_guidance: string | null
  skills: FormSkill[]
}

export interface AssessmentFormConfig {
  templateId: string
  templateVersionId: string | null
  templateName: string
  view: AssessmentView
  mode: AssessmentMode
  sections: FormSection[]
  isAcademyTemplate: boolean
}

// ─── ScoresDetail — stored in assessments.scores_detail (JSON) ───────────────

export interface SkillScore {
  score: number | null
  not_assessed: boolean
}

export interface SectionScore {
  section_score: number | null
  not_assessed: boolean
  notes: string | null
  skills: Record<string, SkillScore>
}

export interface ScoresDetail {
  assessment_label: AssessmentLabel
  assessment_view: AssessmentView
  mode: AssessmentMode
  template_id: string
  template_version_id: string | null
  sections: Record<string, SectionScore>
  voice_notes: string | null
}

// ─── Comparison types ─────────────────────────────────────────────────────────

export type DeltaStatus = 'improved' | 'declined' | 'unchanged' | 'new' | 'not_assessed'

export interface DomainDelta {
  domain: string
  label: string
  current: number | null
  previous: number | null
  delta: number | null
  status: DeltaStatus
}

export interface SkillDelta {
  section_key: string
  skill_key: string
  label: string
  current: number | null
  previous: number | null
  delta: number | null
  status: DeltaStatus
}

export type BlueprintRecommendation =
  | 'keep_blueprint'
  | 'update_blueprint'
  | 'assign_mission'
  | 'archive_mission'
  | 'trigger_level_readiness_review'
  | 'generate_parent_draft'

export const BLUEPRINT_RECOMMENDATION_LABELS: Record<BlueprintRecommendation, string> = {
  keep_blueprint:                  'Keep current blueprint',
  update_blueprint:                'Update blueprint',
  assign_mission:                  'Assign targeted mission',
  archive_mission:                 'Archive completed mission',
  trigger_level_readiness_review:  'Trigger level readiness review',
  generate_parent_draft:           'Generate parent-safe update draft',
}

export interface AssessmentComparison {
  domainDeltas: DomainDelta[]
  topImprovements: SkillDelta[]
  topDeclines: SkillDelta[]
  overallDelta: number | null
  overallStatus: DeltaStatus
  recommendations: BlueprintRecommendation[]
  recommendationReasons: string[]
}

// ─── Previous assessment shape (passed to form for reassessment) ──────────────

export interface PreviousAssessmentData {
  id: string
  assessed_date: string
  overall_score: number | null
  technical_score: number | null
  tactical_score: number | null
  movement_score: number | null
  competition_score: number | null
  behavioral_score: number | null
  scores_detail: ScoresDetail | null
}
