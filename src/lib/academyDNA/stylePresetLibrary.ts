// Mega Sprint 2771–2800 — DONNA Academy DNA Foundation V1
// Style Preset Library: six canonical coaching philosophy presets.
//
// Design rules:
//   - Pure TypeScript constants. No DB, no API, no React.
//   - Reuses existing StageCategory, rankingToWeights, DONNA_DEFAULT_RANKINGS
//     from donnaOnboardingContextPack.ts — no parallel weighting system.
//   - Each preset is a named StageCategory[] ranking per stage.
//   - Stored as academy_style_preset (string) in academies.settings.
//   - The full ranking array is computed at runtime from the library constant;
//     only the preset ID is persisted — platform owner can update preset
//     definitions without migrating existing academy data.

import {
  type StageCategory,
  type StagePriorityState,
  rankingToWeights,
} from '@/lib/donna/onboarding/donnaOnboardingContextPack'

// ── Types ─────────────────────────────────────────────────────────────────────

export type StylePresetId =
  | 'balanced'
  | 'technical_first'
  | 'game_based'
  | 'competition_first'
  | 'athletic_first'
  | 'mental_first'

export interface StylePresetDefinition {
  id:          StylePresetId
  label:       string
  tagline:     string
  description: string
  /** Per-stage category rankings — key = AgeGroup stage key */
  stageRankings: Record<string, StageCategory[]>
}

// ── Stage ranking aliases ─────────────────────────────────────────────────────
// Each row = [1st, 2nd, 3rd, 4th, 5th, 6th, 7th] priority within a stage

// Balanced preset — broad-based, no dominant category
const BAL_RED:  StageCategory[] = ['games', 'fun', 'movement', 'technique', 'mental', 'tactics', 'competition']
const BAL_ORA:  StageCategory[] = ['games', 'movement', 'technique', 'fun', 'mental', 'tactics', 'competition']
const BAL_GRN:  StageCategory[] = ['technique', 'games', 'tactics', 'movement', 'mental', 'fun', 'competition']
const BAL_YEL:  StageCategory[] = ['technique', 'tactics', 'movement', 'games', 'mental', 'competition', 'fun']
const BAL_HP:   StageCategory[] = ['tactics', 'technique', 'competition', 'movement', 'mental', 'games', 'fun']

// Technical First — technique anchors #1 at every stage
const TEC_RED:  StageCategory[] = ['technique', 'movement', 'games', 'fun', 'mental', 'tactics', 'competition']
const TEC_ORA:  StageCategory[] = ['technique', 'movement', 'games', 'tactics', 'mental', 'fun', 'competition']
const TEC_GRN:  StageCategory[] = ['technique', 'tactics', 'movement', 'games', 'mental', 'fun', 'competition']
const TEC_YEL:  StageCategory[] = ['technique', 'tactics', 'movement', 'mental', 'competition', 'games', 'fun']
const TEC_HP:   StageCategory[] = ['technique', 'tactics', 'competition', 'mental', 'movement', 'games', 'fun']

// Game-Based — games #1 for younger; transitions to tactics for older
const GAM_RED:  StageCategory[] = ['games', 'fun', 'movement', 'technique', 'mental', 'tactics', 'competition']
const GAM_ORA:  StageCategory[] = ['games', 'movement', 'fun', 'technique', 'mental', 'tactics', 'competition']
const GAM_GRN:  StageCategory[] = ['games', 'tactics', 'technique', 'movement', 'mental', 'fun', 'competition']
const GAM_YEL:  StageCategory[] = ['tactics', 'games', 'technique', 'competition', 'movement', 'mental', 'fun']
const GAM_HP:   StageCategory[] = ['tactics', 'competition', 'technique', 'mental', 'movement', 'games', 'fun']

// Competition First — direct competition emphasis at Green Ball and above
const COM_RED:  StageCategory[] = ['games', 'technique', 'movement', 'fun', 'mental', 'tactics', 'competition']
const COM_ORA:  StageCategory[] = ['technique', 'games', 'movement', 'tactics', 'mental', 'competition', 'fun']
const COM_GRN:  StageCategory[] = ['competition', 'technique', 'tactics', 'movement', 'mental', 'games', 'fun']
const COM_YEL:  StageCategory[] = ['competition', 'tactics', 'technique', 'mental', 'movement', 'games', 'fun']
const COM_HP:   StageCategory[] = ['competition', 'tactics', 'technique', 'mental', 'movement', 'games', 'fun']

// Athletic First — movement #1 or #2 at every stage
const ATH_RED:  StageCategory[] = ['movement', 'games', 'fun', 'technique', 'mental', 'tactics', 'competition']
const ATH_ORA:  StageCategory[] = ['movement', 'games', 'technique', 'fun', 'mental', 'tactics', 'competition']
const ATH_GRN:  StageCategory[] = ['movement', 'technique', 'games', 'tactics', 'mental', 'fun', 'competition']
const ATH_YEL:  StageCategory[] = ['movement', 'technique', 'tactics', 'mental', 'competition', 'games', 'fun']
const ATH_HP:   StageCategory[] = ['movement', 'tactics', 'technique', 'mental', 'competition', 'games', 'fun']

// Mental First — mental in top 3 at every stage
const MEN_RED:  StageCategory[] = ['mental', 'fun', 'games', 'movement', 'technique', 'tactics', 'competition']
const MEN_ORA:  StageCategory[] = ['mental', 'games', 'movement', 'technique', 'fun', 'tactics', 'competition']
const MEN_GRN:  StageCategory[] = ['mental', 'technique', 'games', 'tactics', 'movement', 'fun', 'competition']
const MEN_YEL:  StageCategory[] = ['mental', 'tactics', 'technique', 'movement', 'competition', 'games', 'fun']
const MEN_HP:   StageCategory[] = ['mental', 'tactics', 'technique', 'competition', 'movement', 'games', 'fun']

// ── Preset definitions ────────────────────────────────────────────────────────

const BALANCED: StylePresetDefinition = {
  id:          'balanced',
  label:       'Balanced',
  tagline:     'No single category dominates — development across all dimensions.',
  description: 'A well-rounded program where technique, games, movement, and tactical development evolve together at each stage. No single category dominates.',
  stageRankings: {
    red_ball:         BAL_RED,
    orange_ball:      BAL_ORA,
    green_ball:       BAL_GRN,
    yellow_ball:      BAL_YEL,
    high_performance: BAL_HP,
  },
}

const TECHNICAL_FIRST: StylePresetDefinition = {
  id:          'technical_first',
  label:       'Technical First',
  tagline:     'Perfect the stroke before playing the point.',
  description: 'Technical skill mastery anchors every stage. Games and tactics build on a technical foundation. Competition exposure increases only after technical competence is established.',
  stageRankings: {
    red_ball:         TEC_RED,
    orange_ball:      TEC_ORA,
    green_ball:       TEC_GRN,
    yellow_ball:      TEC_YEL,
    high_performance: TEC_HP,
  },
}

const GAME_BASED: StylePresetDefinition = {
  id:          'game_based',
  label:       'Game-Based',
  tagline:     'Play first. Skills emerge through the game.',
  description: 'Game situations drive learning at every level. Technique is taught in game context. Tactics emerge naturally. Matches LTAD game-based learning principles.',
  stageRankings: {
    red_ball:         GAM_RED,
    orange_ball:      GAM_ORA,
    green_ball:       GAM_GRN,
    yellow_ball:      GAM_YEL,
    high_performance: GAM_HP,
  },
}

const COMPETITION_FIRST: StylePresetDefinition = {
  id:          'competition_first',
  label:       'Competition First',
  tagline:     'Every drill prepares for the next match.',
  description: 'Competition mindset is introduced early and intensifies with age. Younger players build through game scenarios; older players train explicitly for match results.',
  stageRankings: {
    red_ball:         COM_RED,
    orange_ball:      COM_ORA,
    green_ball:       COM_GRN,
    yellow_ball:      COM_YEL,
    high_performance: COM_HP,
  },
}

const ATHLETIC_FIRST: StylePresetDefinition = {
  id:          'athletic_first',
  label:       'Athletic First',
  tagline:     'Build the athlete. The tennis will follow.',
  description: 'Movement, coordination, and physical development anchor the program. Athletic development leads at every stage. Tennis skills develop on top of a strong physical base.',
  stageRankings: {
    red_ball:         ATH_RED,
    orange_ball:      ATH_ORA,
    green_ball:       ATH_GRN,
    yellow_ball:      ATH_YEL,
    high_performance: ATH_HP,
  },
}

const MENTAL_FIRST: StylePresetDefinition = {
  id:          'mental_first',
  label:       'Mental First',
  tagline:     'Composure, resilience, and focus — at every age.',
  description: 'Mental performance is a top-3 priority at every stage. Composure, resilience, and competitive mindset are explicitly taught alongside technical and tactical skills.',
  stageRankings: {
    red_ball:         MEN_RED,
    orange_ball:      MEN_ORA,
    green_ball:       MEN_GRN,
    yellow_ball:      MEN_YEL,
    high_performance: MEN_HP,
  },
}

// ── Library ───────────────────────────────────────────────────────────────────

export const STYLE_PRESETS: Record<StylePresetId, StylePresetDefinition> = {
  balanced:          BALANCED,
  technical_first:   TECHNICAL_FIRST,
  game_based:        GAME_BASED,
  competition_first: COMPETITION_FIRST,
  athletic_first:    ATHLETIC_FIRST,
  mental_first:      MENTAL_FIRST,
}

export const STYLE_PRESET_IDS: StylePresetId[] = [
  'balanced',
  'technical_first',
  'game_based',
  'competition_first',
  'athletic_first',
  'mental_first',
]

export function getStylePreset(id: StylePresetId): StylePresetDefinition {
  return STYLE_PRESETS[id]
}

export function getStylePresetSafe(id: string): StylePresetDefinition | null {
  return (STYLE_PRESETS as Record<string, StylePresetDefinition>)[id] ?? null
}

// ── Conversion helpers ────────────────────────────────────────────────────────

/**
 * Convert a style preset's per-stage rankings into StagePriorityState records.
 * Reuses existing rankingToWeights() from donnaOnboardingContextPack.ts.
 */
export function presetToStagePriorities(
  preset: StylePresetDefinition,
  activeStages: string[],
): Record<string, StagePriorityState> {
  const result: Record<string, StagePriorityState> = {}
  for (const stage of activeStages) {
    const ranking = preset.stageRankings[stage]
    if (!ranking) continue
    result[stage] = {
      ranking,
      weights:          rankingToWeights(ranking),
      manuallyAdjusted: false,
      confirmed:        true,
    }
  }
  return result
}

/**
 * Compute aggregate curriculum weights across all active stages for a preset.
 * Returns weights summing to 100 per category, averaged across stages.
 */
export function presetToAggregateWeights(
  preset: StylePresetDefinition,
  activeStages: string[],
): Record<StageCategory, number> {
  const totals: Partial<Record<StageCategory, number>> = {}
  let stageCount = 0

  for (const stage of activeStages) {
    const ranking = preset.stageRankings[stage]
    if (!ranking) continue
    const weights = rankingToWeights(ranking)
    stageCount++
    for (const [cat, w] of Object.entries(weights) as [StageCategory, number][]) {
      totals[cat] = (totals[cat] ?? 0) + w
    }
  }

  if (stageCount === 0) {
    return { technique: 14, tactics: 14, games: 14, competition: 14, movement: 14, mental: 15, fun: 15 }
  }

  const averages: Partial<Record<StageCategory, number>> = {}
  for (const [cat, total] of Object.entries(totals) as [StageCategory, number][]) {
    averages[cat] = Math.round(total / stageCount)
  }

  // Normalize to exactly 100
  const sum = Object.values(averages).reduce((a, b) => a + b, 0)
  if (sum !== 100 && sum > 0) {
    const topKey = (Object.keys(averages) as StageCategory[])
      .sort((a, b) => (averages[b] ?? 0) - (averages[a] ?? 0))[0]
    if (topKey) averages[topKey] = (averages[topKey] ?? 0) + (100 - sum)
  }

  return averages as Record<StageCategory, number>
}
