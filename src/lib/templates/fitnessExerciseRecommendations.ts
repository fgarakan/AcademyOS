// Pure utility — no DB access, no AI calls.
// Builds on fitnessExerciseMatching.ts to produce ranked exercise suggestions
// with human-readable reasoning for each recommendation.

import type { FitnessBlockType } from '@/lib/fitness/fitnessBlockTypes'
import { getFitnessBlockLabel } from '@/lib/fitness/fitnessBlockTypes'
import type { ExerciseCandidate } from '@/lib/fitness/fitnessExerciseMatching'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type FitLevel = 'strong' | 'moderate' | 'weak' | 'none'

export interface ExerciseRecommendation {
  exercise: ExerciseCandidate
  score: number
  fitLevel: FitLevel
  reasons: string[]
  durationMin: number
}

export interface BlockRecommendationResult {
  blockType: FitnessBlockType
  blockLabel: string
  suggestions: ExerciseRecommendation[]
  budgetUsedMin: number
  budgetRemainingMin: number
}

// ─────────────────────────────────────────────────────────────
// Scoring constants — mirrors fitnessExerciseMatching.ts logic
// but produces traceable reason strings
// ─────────────────────────────────────────────────────────────

const MATCH_KEYWORDS: Record<FitnessBlockType, string[]> = {
  movement: [
    'dynamic', 'warm', 'warm-up', 'warmup', 'movement prep', 'footwork',
    'lateral', 'shuffle', 'skip', 'high knee', 'butt kick', 'carioca',
  ],
  agility: [
    'agility', 'ladder', 'cone', 'change of direction', 'react', 'reaction',
    'cut', 'decelerate', 't-drill', 'zig zag',
  ],
  speed: [
    'speed', 'sprint', 'acceleration', 'short sprint', 'burst', 'linear speed',
    'fly', 'fly-in', 'court sprint', 'max velocity',
  ],
  plyometrics: [
    'plyometric', 'jump', 'bound', 'hop', 'box jump', 'depth jump',
    'medicine ball', 'explosive', 'lateral bound', 'single leg jump',
  ],
  strength: [
    'strength', 'bodyweight', 'core', 'plank', 'push', 'squat', 'lunge',
    'glute', 'hip thrust', 'single leg', 'stability', 'bear crawl', 'resistance',
  ],
  coordination: [
    'coordination', 'rhythm', 'balance', 'proprioception', 'hand-eye',
    'reaction ball', 'juggle', 'tennis', 'visual', 'tracking',
  ],
  mobility: [
    'mobility', 'hip flexor', 'hip', 'shoulder', 'thoracic', 'ankle',
    'hamstring', 'quad stretch', 'pigeon', 'world greatest', 'lunge stretch',
  ],
  recovery_cool_down: [
    'cool', 'cooldown', 'cool-down', 'stretch', 'static', 'breathing',
    'recovery', 'foam', 'roll', 'relax', 'restoration',
  ],
}

const CATEGORY_MATCH: Record<FitnessBlockType, string[]> = {
  movement:           ['movement', 'warm_up'],
  agility:            ['movement', 'fitness'],
  speed:              ['fitness', 'movement'],
  plyometrics:        ['fitness'],
  strength:           ['fitness'],
  coordination:       ['fitness', 'movement'],
  mobility:           ['movement', 'fitness'],
  recovery_cool_down: ['cool_down', 'fitness'],
}

const DEFAULT_EXERCISE_DURATION = 5

function scoreWithReasons(
  ex: ExerciseCandidate,
  blockType: FitnessBlockType,
): { score: number; reasons: string[] } {
  const keywords = MATCH_KEYWORDS[blockType]
  const nameL = ex.name.toLowerCase()
  const subL = (ex.subcategory ?? '').toLowerCase()
  const tagsL = (ex.tags ?? []).map(t => t.toLowerCase())
  const reasons: string[] = []
  let score = 0

  const catMatches = CATEGORY_MATCH[blockType]
  if (catMatches.includes(ex.category)) {
    score += 2
    reasons.push(`Category "${ex.category}" matches ${getFitnessBlockLabel(blockType)} blocks`)
  }

  const matchedKeywords = new Set<string>()
  for (const kw of keywords) {
    if (nameL.includes(kw) && !matchedKeywords.has(kw)) {
      score += 3
      matchedKeywords.add(kw)
      reasons.push(`Name contains "${kw}"`)
    } else if (subL.includes(kw) && !matchedKeywords.has(kw)) {
      score += 2
      matchedKeywords.add(kw)
      reasons.push(`Subcategory contains "${kw}"`)
    } else if (tagsL.some(t => t.includes(kw)) && !matchedKeywords.has(kw)) {
      score += 1
      matchedKeywords.add(kw)
      reasons.push(`Tagged with "${kw}"`)
    }
  }

  return { score, reasons }
}

function toFitLevel(score: number): FitLevel {
  if (score >= 5) return 'strong'
  if (score >= 3) return 'moderate'
  if (score >= 1) return 'weak'
  return 'none'
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Returns ranked exercise recommendations for a fitness block type.
 * Suggestions are sorted by score (desc), then name (asc).
 * Only exercises with score > 0 are included.
 */
export function rankExercisesForBlock(
  blockType: FitnessBlockType,
  exercises: ExerciseCandidate[],
): ExerciseRecommendation[] {
  return exercises
    .map(ex => {
      const { score, reasons } = scoreWithReasons(ex, blockType)
      return {
        exercise: ex,
        score,
        fitLevel: toFitLevel(score),
        reasons,
        durationMin: ex.duration_min ?? DEFAULT_EXERCISE_DURATION,
      }
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name))
}

/**
 * Fills a block's duration budget with the best-matching exercises.
 * Returns a full recommendation result including budget accounting.
 * Exercises already in the block (by exercise_id) are excluded.
 */
export function getBlockRecommendations(
  blockType: FitnessBlockType,
  budgetMin: number,
  exercises: ExerciseCandidate[],
  excludeExerciseIds: Set<string> = new Set(),
): BlockRecommendationResult {
  const blockLabel = getFitnessBlockLabel(blockType)
  const ranked = rankExercisesForBlock(blockType, exercises).filter(
    r => !excludeExerciseIds.has(r.exercise.id)
  )

  const suggestions: ExerciseRecommendation[] = []
  let budgetUsed = 0

  for (const rec of ranked) {
    if (rec.durationMin > budgetMin - budgetUsed) continue
    suggestions.push(rec)
    budgetUsed += rec.durationMin
    if (budgetUsed >= budgetMin) break
  }

  // If nothing fit within budget, include the top match as a fallback
  if (suggestions.length === 0 && ranked.length > 0) {
    suggestions.push(ranked[0])
    budgetUsed = ranked[0].durationMin
  }

  return {
    blockType,
    blockLabel,
    suggestions,
    budgetUsedMin: budgetUsed,
    budgetRemainingMin: Math.max(0, budgetMin - budgetUsed),
  }
}
