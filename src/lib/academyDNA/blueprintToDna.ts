// Mega Sprint 2771–2800 — DONNA Academy DNA Foundation V1
// Blueprint → AcademyDnaSummary Mapper
//
// Maps AcademyDNAModelId + StylePresetId + director input
// → AcademyDnaSummary, which feeds buildAcademyIdentityProfile().
//
// This is the integration point between the new Academy DNA system and
// the existing certified philosophy engine (academyIdentityProfile.ts).
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Output type is AcademyDnaSummary (existing certified type).
//   - Do not duplicate AcademyIdentityProfile logic.
//   - Do not create AcademyDNAProfile or AcademyPhilosophyProfileV2.
//   - Blueprint provides statedScore inputs only — the philosophy engine
//     applies the full Reality → Evidence → Memory → Philosophy hierarchy.

import type { AcademyDnaSummary } from '@/lib/donna/curriculum/curriculumIntelligenceContext'
import type { AcademyDNAModelId } from './academyDNAModels'
import type { StylePresetId } from './stylePresetLibrary'
import { getAcademyDNAModel } from './academyDNAModels'
import { getStylePreset } from './stylePresetLibrary'

// ── Input ─────────────────────────────────────────────────────────────────────

export interface BlueprintToDnaInput {
  /** DNA model ID selected at onboarding */
  dnaModelId:             AcademyDNAModelId
  /** Style preset selected at onboarding */
  stylePresetId:          StylePresetId
  /** Director governance preference — overrides DNA model default when provided */
  advancementApproval?:   string
  /** Director parent transparency preference — overrides DNA model default when provided */
  parentTransparency?:    string
  /** Director technical vs tactical philosophy — overrides DNA model inference when provided */
  priorityEdge?:          string
  /** Custom active stages — overrides DNA model defaults when provided */
  activeStages?:          string[]
}

// ── DNA model → governance defaults ──────────────────────────────────────────

const DNA_DEFAULT_ADVANCEMENT: Record<AcademyDNAModelId, string> = {
  '12u_foundation':     'donna_flags_director_confirms',
  'performance_12plus': 'director_only',
  'college_placement':  'director_only',
  'club_growth':        'coach_recommends_notified',
}

const DNA_DEFAULT_TRANSPARENCY: Record<AcademyDNAModelId, string> = {
  '12u_foundation':     'standard',
  'performance_12plus': 'standard',
  'college_placement':  'transparent',
  'club_growth':        'minimal',
}

const DNA_DEFAULT_PLAYER_MIX: Record<AcademyDNAModelId, string> = {
  '12u_foundation':     'mixed',
  'performance_12plus': 'competitive_juniors',
  'college_placement':  'competitive_juniors',
  'club_growth':        'mixed',
}

const DNA_DEFAULT_FAMILY_PRIORITIES: Record<AcademyDNAModelId, string> = {
  '12u_foundation':     'development_enjoyment',
  'performance_12plus': 'results_rankings',
  'college_placement':  'results_rankings',
  'club_growth':        'fitness_fun',
}

const DNA_DEFAULT_PRIORITY_EDGE: Record<AcademyDNAModelId, string> = {
  '12u_foundation':     'coach_judgment',
  'performance_12plus': 'technical_first',
  'college_placement':  'tactical_first',
  'club_growth':        'coach_judgment',
}

// ── Mapper ────────────────────────────────────────────────────────────────────

/**
 * Map Blueprint + Style Preset + director inputs → AcademyDnaSummary.
 *
 * The returned AcademyDnaSummary can be passed directly to
 * buildAcademyIdentityProfile() to generate the philosophy profile
 * with Blueprint-informed statedScore values for all 10 dimensions.
 *
 * Note: stagePriorities maps each active stage to its relative priority rank
 * among stages (1 = highest priority focus for this academy type).
 */
export function blueprintToDna(input: BlueprintToDnaInput): AcademyDnaSummary {
  const model  = getAcademyDNAModel(input.dnaModelId)
  const preset = getStylePreset(input.stylePresetId)

  const activeStages = input.activeStages ?? model.defaultActiveStages

  // Stage priority map: each active stage → rank position (1 = most important)
  // Rank is determined by the academy's default stage ordering.
  const stagePriorities: Record<string, number> = {}
  activeStages.forEach((stage, idx) => {
    stagePriorities[stage] = idx + 1
  })

  // Also embed per-stage top category rank position for DONNA context
  // (top category = rank 1 within that stage's preset ranking)
  for (const stage of activeStages) {
    const ranking = preset.stageRankings[stage]
    if (ranking) {
      stagePriorities[`${stage}_top_category`] = 1  // rank position of top category
    }
  }

  return {
    inferredModel:      model.defaultInferredModel,
    playerMix:          DNA_DEFAULT_PLAYER_MIX[input.dnaModelId],
    familyPriorities:   DNA_DEFAULT_FAMILY_PRIORITIES[input.dnaModelId],
    stagePriorities,
    priorityEdge:       input.priorityEdge       ?? DNA_DEFAULT_PRIORITY_EDGE[input.dnaModelId],
    advancementApproval: input.advancementApproval ?? DNA_DEFAULT_ADVANCEMENT[input.dnaModelId],
    parentTransparency: input.parentTransparency  ?? DNA_DEFAULT_TRANSPARENCY[input.dnaModelId],
    hasDna:             true,
  }
}

// ── Settings keys ─────────────────────────────────────────────────────────────
// Keys written to academies.settings JSON. No new DB columns. No migration.

export const ACADEMY_DNA_SETTINGS_KEYS = {
  DNA_MODEL_ID:       'academy_dna_model_id',
  STYLE_PRESET_ID:    'academy_style_preset',
  DIFFERENTIATOR:     'academy_differentiator',
  COMPLETED_AT:       'dna_onboarding_completed_at',
  ONBOARDING_METHOD:  'onboarding_method',
} as const

export type AcademyDNASettingsKey = typeof ACADEMY_DNA_SETTINGS_KEYS[keyof typeof ACADEMY_DNA_SETTINGS_KEYS]

/**
 * Read Blueprint DNA settings from the raw academies.settings object.
 * Returns null when DNA onboarding has not been completed.
 */
export function loadBlueprintSettings(rawSettings: Record<string, unknown>): {
  dnaModelId:      AcademyDNAModelId | null
  stylePresetId:   StylePresetId | null
  differentiator:  string | null
  completedAt:     string | null
  method:          string | null
} {
  return {
    dnaModelId:     (rawSettings[ACADEMY_DNA_SETTINGS_KEYS.DNA_MODEL_ID]   as AcademyDNAModelId | undefined) ?? null,
    stylePresetId:  (rawSettings[ACADEMY_DNA_SETTINGS_KEYS.STYLE_PRESET_ID] as StylePresetId | undefined)    ?? null,
    differentiator: (rawSettings[ACADEMY_DNA_SETTINGS_KEYS.DIFFERENTIATOR]   as string | undefined)           ?? null,
    completedAt:    (rawSettings[ACADEMY_DNA_SETTINGS_KEYS.COMPLETED_AT]      as string | undefined)          ?? null,
    method:         (rawSettings[ACADEMY_DNA_SETTINGS_KEYS.ONBOARDING_METHOD] as string | undefined)          ?? null,
  }
}

/**
 * Attempt to load and convert Blueprint settings to AcademyDnaSummary.
 * Returns null if Blueprint onboarding not completed.
 */
export function loadDnaFromSettings(
  rawSettings: Record<string, unknown>,
  options?: Pick<BlueprintToDnaInput, 'advancementApproval' | 'parentTransparency' | 'priorityEdge' | 'activeStages'>,
): AcademyDnaSummary | null {
  const s = loadBlueprintSettings(rawSettings)
  if (!s.dnaModelId || !s.stylePresetId) return null
  return blueprintToDna({
    dnaModelId:    s.dnaModelId,
    stylePresetId: s.stylePresetId,
    ...options,
  })
}
