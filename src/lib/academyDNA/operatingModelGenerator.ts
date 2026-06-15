// Mega Sprint 2771–2800 — DONNA Academy DNA Foundation V1
// Academy Operating Model Generator
//
// Generates the academy's operating model from:
//   AcademyDNAModel + StylePreset + governance settings
//
// The Operating Model is NOT a database record.
// It is a deterministic display surface over existing computed values.
// All inputs already exist in academies.settings — no new storage.
//
// Reuses:
//   DEFAULTS_BY_MODEL from donnaOnboardingContextPack.ts
//   PORTAL_RULES_BY_TRANSPARENCY from donnaOnboardingContextPack.ts
//   COACHING_STYLE_BY_MODEL from donnaOnboardingContextPack.ts
//   presetToAggregateWeights from stylePresetLibrary.ts
//   ACADEMY_DNA_MODELS from academyDNAModels.ts
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic: same inputs → same output. No AI required.
//   - Does NOT extend academyOperatingLens (legacy); writes to separate display.

import {
  DEFAULTS_BY_MODEL,
  PORTAL_RULES_BY_TRANSPARENCY,
  COACHING_STYLE_BY_MODEL,
  type InferredModel,
  type ParentTransparency,
  type AdvancementApproval,
  type StageCategory,
} from '@/lib/donna/onboarding/donnaOnboardingContextPack'
import type { AcademyDNAModelId } from './academyDNAModels'
import type { StylePresetId } from './stylePresetLibrary'
import { getAcademyDNAModel } from './academyDNAModels'
import { getStylePreset, presetToAggregateWeights } from './stylePresetLibrary'

// ── Output types ──────────────────────────────────────────────────────────────

export interface OperatingModelCurriculum {
  aggregateCategoryWeights: Record<StageCategory, number>
  topPriorityCategory:      StageCategory
  topPriorityLabel:         string
  coverageFocusAreas:       string[]
  perStageTopCategories:    Record<string, StageCategory>
}

export interface OperatingModelCoaches {
  recapExpectation:     string
  observationDepth:     string
  autonomyLevel:        string
  communicationFormat:  string
  developmentFocus:     string
  coachingStyleLabel:   string
  coachingStyleDesc:    string
}

export interface OperatingModelParents {
  transparency:     string
  updateFrequency:  string
  tone:             string
  portalAccess:     string
  portalVisibility: {
    domainScores:          boolean
    competitionHistory:    boolean
    donnaRecommendations:  boolean
    rawCoachNotes:         boolean
    rankings:              boolean
  }
}

export interface OperatingModelPrograms {
  assessmentCadence:   string
  playerMissionStyle:  string
  advancementGate:     string
  advancementApproval: string
}

export interface OperatingModelAssessments {
  cadence:           string
  domainWeights:     { technical: number; tactical: number; fitness: number; mental: number }
  gateStrictness:    string
  cadenceDescription: string
}

export interface OperatingModelDonna {
  recommendationTendencies: string[]
  focusAreas:               string[]
  morningBriefEmphasis:     string[]
  kpiPriorities:            string[]
}

export interface AcademyOperatingModel {
  academyDNAModelId: AcademyDNAModelId
  stylePresetId:     StylePresetId
  generatedAt:       string
  curriculum:        OperatingModelCurriculum
  coaches:           OperatingModelCoaches
  parents:           OperatingModelParents
  programs:          OperatingModelPrograms
  assessments:       OperatingModelAssessments
  donna:             OperatingModelDonna
}

// ── Input ─────────────────────────────────────────────────────────────────────

export interface BuildOperatingModelInput {
  dnaModelId:          AcademyDNAModelId
  stylePresetId:       StylePresetId
  advancementApproval?: AdvancementApproval | string
  parentTransparency?:  ParentTransparency  | string
  activeStages?:        string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CADENCE_DESCRIPTIONS: Record<string, string> = {
  monthly:            'Assessed every 4 weeks per player — high cadence for structured academies',
  every_6_weeks:      'Assessed every 6 weeks per player — standard developmental cadence',
  quarterly:          'Assessed every 12 weeks per player — low-intensity cadence for recreational programs',
  event_triggered:    'Assessed before and after key tournaments and competitions',
  director_triggered: 'Assessed when the director or head coach determines it is appropriate',
}

const GATE_STRICTNESS_BY_APPROVAL: Record<string, string> = {
  director_only:                 'Strict — Director personal sign-off required before any level change',
  donna_flags_director_confirms: 'Structured — DONNA flags readiness, Director confirms within 48 hours',
  coach_recommends_notified:     'Balanced — Coaches recommend, Director is notified before change takes effect',
  assessment_driven:             'Automated — Level changes occur automatically when assessment thresholds are crossed',
}

function toInferredModel(s: string): InferredModel {
  const valid: InferredModel[] = ['high_performance', 'junior_development', 'recreational', 'private_coaching', 'dual_track']
  return valid.includes(s as InferredModel) ? (s as InferredModel) : 'junior_development'
}

function toParentTransparency(s: string): ParentTransparency {
  const valid: ParentTransparency[] = ['minimal', 'standard', 'transparent']
  return valid.includes(s as ParentTransparency) ? (s as ParentTransparency) : 'standard'
}

// ── Generator ─────────────────────────────────────────────────────────────────

/**
 * Build the complete AcademyOperatingModel from DNA model + style preset.
 * Deterministic — same inputs always produce the same output.
 * No AI required.
 */
export function buildAcademyOperatingModel(input: BuildOperatingModelInput): AcademyOperatingModel {
  const dnaModel  = getAcademyDNAModel(input.dnaModelId)
  const preset    = getStylePreset(input.stylePresetId)

  const activeStages       = input.activeStages ?? dnaModel.defaultActiveStages
  const inferredModel      = toInferredModel(dnaModel.defaultInferredModel)
  const parentTransparency = toParentTransparency(input.parentTransparency ?? dnaModel.defaultParentCommunicationStandards.transparency)
  const advancementApproval = input.advancementApproval ?? 'donna_flags_director_confirms'

  const modelDefaults    = DEFAULTS_BY_MODEL[inferredModel]
  const portalRules      = PORTAL_RULES_BY_TRANSPARENCY[parentTransparency]
  const coachingStyle    = COACHING_STYLE_BY_MODEL[inferredModel]
  const aggregateWeights = presetToAggregateWeights(preset, activeStages)

  // ── Curriculum ─────────────────────────────────────────────────────────────

  const sortedCategories = (Object.entries(aggregateWeights) as [StageCategory, number][])
    .sort((a, b) => b[1] - a[1])
  const topCategory = sortedCategories[0]?.[0] ?? 'technique'

  const CATEGORY_LABELS: Record<StageCategory, string> = {
    technique:   'Technique',
    tactics:     'Tactics',
    games:       'Games',
    competition: 'Competition',
    movement:    'Movement',
    mental:      'Mental',
    fun:         'Fun',
  }

  const coverageFocusAreas = sortedCategories
    .slice(0, 3)
    .map(([cat]) => CATEGORY_LABELS[cat])

  const perStageTopCategories: Record<string, StageCategory> = {}
  for (const stage of activeStages) {
    const ranking = preset.stageRankings[stage]
    if (ranking?.[0]) perStageTopCategories[stage] = ranking[0]
  }

  const curriculum: OperatingModelCurriculum = {
    aggregateCategoryWeights: aggregateWeights,
    topPriorityCategory:      topCategory,
    topPriorityLabel:         CATEGORY_LABELS[topCategory],
    coverageFocusAreas,
    perStageTopCategories,
  }

  // ── Coaches ────────────────────────────────────────────────────────────────

  const coaches: OperatingModelCoaches = {
    recapExpectation:    dnaModel.defaultCoachStandards.recapExpectation,
    observationDepth:    dnaModel.defaultCoachStandards.observationDepth,
    autonomyLevel:       dnaModel.defaultCoachStandards.autonomyLevel,
    communicationFormat: modelDefaults.coach_comm_format,
    developmentFocus:    dnaModel.defaultCoachStandards.developmentFocus,
    coachingStyleLabel:  coachingStyle.label,
    coachingStyleDesc:   coachingStyle.description,
  }

  // ── Parents ────────────────────────────────────────────────────────────────

  const parents: OperatingModelParents = {
    transparency:    parentTransparency,
    updateFrequency: dnaModel.defaultParentCommunicationStandards.updateFrequency,
    tone:            dnaModel.defaultParentCommunicationStandards.tone,
    portalAccess:    dnaModel.defaultParentCommunicationStandards.portalAccess,
    portalVisibility: {
      domainScores:         portalRules.domain_scores,
      competitionHistory:   portalRules.competition_history,
      donnaRecommendations: portalRules.donna_recommendations,
      rawCoachNotes:        portalRules.raw_coach_notes,
      rankings:             portalRules.rankings,
    },
  }

  // ── Programs ───────────────────────────────────────────────────────────────

  const programs: OperatingModelPrograms = {
    assessmentCadence:   modelDefaults.assessment_cadence,
    playerMissionStyle:  modelDefaults.player_mission_style,
    advancementGate:     GATE_STRICTNESS_BY_APPROVAL[advancementApproval as string] ?? 'Director confirms advancement decisions',
    advancementApproval: advancementApproval as string,
  }

  // ── Assessments ────────────────────────────────────────────────────────────

  const assessments: OperatingModelAssessments = {
    cadence:           dnaModel.defaultAssessmentCadence,
    domainWeights:     dnaModel.defaultAssessmentEmphasis,
    gateStrictness:    GATE_STRICTNESS_BY_APPROVAL[advancementApproval as string] ?? 'Structured',
    cadenceDescription: CADENCE_DESCRIPTIONS[dnaModel.defaultAssessmentCadence] ?? dnaModel.defaultAssessmentCadence,
  }

  // ── DONNA ──────────────────────────────────────────────────────────────────

  const donna: OperatingModelDonna = {
    recommendationTendencies: dnaModel.donnaRecommendationTendencies,
    focusAreas:               dnaModel.defaultProgramPriorities.map(p => p.replace(/_/g, ' ')),
    morningBriefEmphasis:     dnaModel.defaultKPIs.slice(0, 3),
    kpiPriorities:            dnaModel.defaultKPIs,
  }

  return {
    academyDNAModelId: input.dnaModelId,
    stylePresetId:     input.stylePresetId,
    generatedAt:       new Date().toISOString(),
    curriculum,
    coaches,
    parents,
    programs,
    assessments,
    donna,
  }
}

// ── Display summary ───────────────────────────────────────────────────────────

/**
 * Returns a human-readable one-paragraph summary of the operating model.
 * Used in the "Operating Model Review" onboarding step.
 */
export function buildOperatingModelSummary(model: AcademyOperatingModel): string {
  const dnaModel = getAcademyDNAModel(model.academyDNAModelId)
  const preset   = getStylePreset(model.stylePresetId)

  const topCategories = model.curriculum.coverageFocusAreas.join(', ')
  const cadence       = model.assessments.cadenceDescription
  const transparency  = model.parents.transparency

  return [
    `${dnaModel.name} — ${preset.label} style.`,
    `Curriculum emphasis: ${topCategories}.`,
    `Assessments: ${cadence}.`,
    `Parent transparency: ${transparency}.`,
    `Advancement: ${model.programs.advancementApproval.replace(/_/g, ' ')}.`,
    `Coach communication: ${model.coaches.communicationFormat.replace(/_/g, ' ')}.`,
  ].join(' ')
}
