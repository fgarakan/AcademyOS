// Fitness exercise matching — pure utility, no DB access, no AI.
// Maps fitness block types to exercise candidates from the exercise library.

import type { FitnessBlockType } from './fitnessBlockTypes'

export interface ExerciseCandidate {
  id: string
  name: string
  category: string
  subcategory: string | null
  duration_min: number | null
  tags: string[] | null
}

export interface FallbackExercise {
  name: string
  category: string
  isFallback: true
}

export type ExerciseOption = ExerciseCandidate | FallbackExercise

// Keyword sets for matching exercise names/subcategories to fitness block types
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

// Category-based primary matching (exercise.category field)
const CATEGORY_MATCH: Record<FitnessBlockType, string[]> = {
  movement:          ['movement', 'warm_up'],
  agility:           ['movement', 'fitness'],
  speed:             ['fitness', 'movement'],
  plyometrics:       ['fitness'],
  strength:          ['fitness'],
  coordination:      ['fitness', 'movement'],
  mobility:          ['movement', 'fitness'],
  recovery_cool_down: ['cool_down', 'fitness'],
}

function scoreExercise(ex: ExerciseCandidate, blockType: FitnessBlockType): number {
  const keywords = MATCH_KEYWORDS[blockType]
  const nameL = ex.name.toLowerCase()
  const subL = (ex.subcategory ?? '').toLowerCase()
  const tagsL = (ex.tags ?? []).map(t => t.toLowerCase())

  let score = 0

  // Category match gives a base score
  const catMatches = CATEGORY_MATCH[blockType]
  if (catMatches.includes(ex.category)) score += 2

  // Keyword matches in name or subcategory
  for (const kw of keywords) {
    if (nameL.includes(kw)) score += 3
    if (subL.includes(kw)) score += 2
    if (tagsL.some(t => t.includes(kw))) score += 1
  }

  return score
}

// Returns up to `count` best-matching exercises from availableExercises for the given blockType.
// Deterministic: sorted by score descending, then alphabetically by name for ties.
export function getDefaultExercisesForFitnessBlock(
  blockType: FitnessBlockType,
  availableExercises: ExerciseCandidate[],
  count = 3,
): ExerciseCandidate[] {
  const scored = availableExercises
    .map(ex => ({ ex, score: scoreExercise(ex, blockType) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || a.ex.name.localeCompare(b.ex.name))

  return scored.slice(0, count).map(s => s.ex)
}

// Returns true if the exercise is a reasonable match for the given block type
export function matchExerciseToFitnessBlock(
  exercise: ExerciseCandidate,
  blockType: FitnessBlockType,
): boolean {
  return scoreExercise(exercise, blockType) > 0
}

// Fallback exercises to display when no real DB exercises match (draft/display only — never inserted into DB)
const FALLBACK_EXERCISES: Record<FitnessBlockType, string[]> = {
  movement: [
    'Dynamic Warm-Up',
    'Movement Preparation Circuit',
    'Footwork Pattern Drill',
  ],
  agility: [
    'Ladder Footwork Drill',
    'Cone Change-of-Direction',
    'Reaction Agility Drill',
  ],
  speed: [
    'Acceleration Run (10m)',
    'Sprint Mechanics Drill',
    'Short Court Sprint',
  ],
  plyometrics: [
    'Box Jump',
    'Lateral Bound',
    'Explosive Med Ball Toss',
  ],
  strength: [
    'Bodyweight Squat Series',
    'Core Stability Plank Circuit',
    'Single-Leg Balance Squat',
  ],
  coordination: [
    'Reaction Ball Drill',
    'Balance and Tracking Task',
    'Rhythm Coordination Circuit',
  ],
  mobility: [
    'Hip Flexor Mobility Flow',
    'Shoulder Mobility Circuit',
    'Ankle Mobility Drill',
  ],
  recovery_cool_down: [
    'Static Stretch Sequence',
    'Diaphragmatic Breathing',
    'Foam Roll Recovery',
  ],
}

export function getFallbackFitnessExercises(blockType: FitnessBlockType): FallbackExercise[] {
  return FALLBACK_EXERCISES[blockType].map(name => ({
    name,
    category: 'fitness',
    isFallback: true as const,
  }))
}

// Returns real exercises if available, falls back to display-only placeholders.
// Fallback exercises are marked with isFallback:true and must NOT be inserted into the DB.
export function getExercisesForFitnessBlock(
  blockType: FitnessBlockType,
  availableExercises: ExerciseCandidate[],
  count = 3,
): ExerciseOption[] {
  const real = getDefaultExercisesForFitnessBlock(blockType, availableExercises, count)
  if (real.length >= count) return real
  const remaining = count - real.length
  const fallbacks = getFallbackFitnessExercises(blockType).slice(0, remaining)
  return [...real, ...fallbacks]
}

// Normalize raw exercise category strings to standard DB enum values.
// Handles common free-text or legacy category values from imports.
export function normalizeFitnessExerciseCategory(value: string): string {
  const v = value.toLowerCase().trim()
  if (v === 'warm up' || v === 'warm-up' || v === 'warm_up') return 'warm_up'
  if (v === 'cool down' || v === 'cool-down' || v === 'cool_down' || v === 'cooldown') return 'cool_down'
  if (v === 'movement' || v === 'move') return 'movement'
  if (v === 'fitness' || v === 'physical' || v === 'conditioning') return 'fitness'
  if (v === 'technical' || v === 'technique') return 'technical'
  if (v === 'tactical' || v === 'tactics') return 'tactical'
  if (v === 'competition' || v === 'competitive') return 'competition'
  if (v === 'mental' || v === 'psychological') return 'mental'
  return value
}
