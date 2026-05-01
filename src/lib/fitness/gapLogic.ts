// Deterministic fitness gap logic — no DB access, no AI API
// Pure functions that transform assessment + attendance + observation data into gap scores.
// See docs/FITNESS_GAP_LOGIC_PLAN.md for the full specification.

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type FitnessGapCategory =
  | 'mobility'
  | 'balance'
  | 'agility'
  | 'sprint_mechanics'
  | 'strength_basics'
  | 'coordination'
  | 'recovery'
  | 'readiness'

export const ALL_GAP_CATEGORIES: FitnessGapCategory[] = [
  'mobility',
  'balance',
  'agility',
  'sprint_mechanics',
  'strength_basics',
  'coordination',
  'recovery',
  'readiness',
]

export interface AssessmentDimension {
  name: string
  score: number  // 0–100
}

export interface GapInputs {
  assessmentDimensions: AssessmentDimension[]
  missedSessionCount: number
  totalSessionCount: number
  // Exercise categories from missed sessions (e.g. ['fitness', 'movement'])
  missedExerciseCategories: string[]
  // Exercise categories from completed sessions (recently)
  completedExerciseCategories: string[]
  // Coach note tags mentioning fitness-related areas
  coachNoteTags: string[]
  overtainingSignalActive: boolean
  injuryConstraintActive: boolean
  playerAgeYears: number | null
}

export interface GapScore {
  category: FitnessGapCategory
  score: number  // 0–1
  evidence: string[]
}

export interface FitnessGapAssessment {
  computedAt: string
  inputsSummary: {
    assessmentDimensions: number
    missedSessions: number
    totalSessions: number
    coachNoteTags: number
    overtainingSignalActive: boolean
  }
  gapScores: GapScore[]
  topGaps: FitnessGapCategory[]
  recommendedIntensity: 'normal' | 'reduced' | 'recovery_only'
  safetyFlags: string[]
}

// ─────────────────────────────────────────────────────────────
// Assessment dimension → gap category mapping
// ─────────────────────────────────────────────────────────────

const DIMENSION_TO_CATEGORY: Record<string, FitnessGapCategory> = {
  mobility:         'mobility',
  flexibility:      'mobility',
  balance:          'balance',
  agility:          'agility',
  quickness:        'agility',
  sprint:           'sprint_mechanics',
  sprint_mechanics: 'sprint_mechanics',
  running:          'sprint_mechanics',
  strength:         'strength_basics',
  core:             'strength_basics',
  coordination:     'coordination',
  footwork:         'coordination',
  recovery:         'recovery',
  readiness:        'readiness',
  fatigue:          'recovery',
}

// Exercise category → gap categories that benefit from this exercise type
const EXERCISE_CAT_TO_GAPS: Record<string, FitnessGapCategory[]> = {
  warm_up:     ['mobility', 'readiness'],
  cool_down:   ['recovery', 'mobility'],
  movement:    ['agility', 'balance', 'coordination', 'sprint_mechanics'],
  fitness:     ['strength_basics', 'agility', 'sprint_mechanics'],
  technical:   ['coordination'],
  tactical:    [],
  competition: [],
  mental:      [],
}

// Coach note tag → gap categories
const TAG_TO_GAPS: Record<string, FitnessGapCategory[]> = {
  fitness:     ['strength_basics'],
  movement:    ['agility', 'balance'],
  recovery:    ['recovery'],
  strength:    ['strength_basics'],
  agility:     ['agility'],
  balance:     ['balance'],
  speed:       ['sprint_mechanics', 'agility'],
  sprint:      ['sprint_mechanics'],
  mobility:    ['mobility'],
  flexibility: ['mobility'],
  coordination:['coordination'],
  footwork:    ['coordination'],
  fatigue:     ['recovery'],
  load:        ['recovery'],
  soreness:    ['recovery'],
}

const GAP_THRESHOLD = 0.25  // scores below this are not surfaced

// ─────────────────────────────────────────────────────────────
// Core gap computation
// ─────────────────────────────────────────────────────────────

function assessmentPenalty(category: FitnessGapCategory, dims: AssessmentDimension[]): number {
  const relevant = dims.filter(d =>
    (DIMENSION_TO_CATEGORY[d.name.toLowerCase()] ?? d.name.toLowerCase()) === category
  )
  if (relevant.length === 0) return 0
  const avgScore = relevant.reduce((s, d) => s + d.score, 0) / relevant.length
  // score 0 → penalty 1, score 100 → penalty 0
  return Math.max(0, (100 - avgScore) / 100)
}

function missedExposurePenalty(category: FitnessGapCategory, missedCats: string[], totalSessions: number): number {
  if (totalSessions === 0) return 0
  const relevantGaps = EXERCISE_CAT_TO_GAPS
  let missedCount = 0
  for (const [exCat, gapCats] of Object.entries(relevantGaps)) {
    if (gapCats.includes(category) && missedCats.includes(exCat)) missedCount++
  }
  return Math.min(1, missedCount / 3)
}

function completedBonus(category: FitnessGapCategory, completedCats: string[]): number {
  const relevantGaps = EXERCISE_CAT_TO_GAPS
  let completedCount = 0
  for (const [exCat, gapCats] of Object.entries(relevantGaps)) {
    if (gapCats.includes(category) && completedCats.includes(exCat)) completedCount++
  }
  return Math.min(0.3, completedCount * 0.1)
}

function coachNoteSignal(category: FitnessGapCategory, tags: string[]): number {
  let count = 0
  for (const tag of tags) {
    const gapCats = TAG_TO_GAPS[tag.toLowerCase()]
    if (gapCats?.includes(category)) count++
  }
  return Math.min(0.4, count * 0.1)
}

export function computeFitnessGaps(inputs: GapInputs): FitnessGapAssessment {
  const gapScores: GapScore[] = []

  for (const category of ALL_GAP_CATEGORIES) {
    const evidence: string[] = []

    const aPenalty = assessmentPenalty(category, inputs.assessmentDimensions)
    if (aPenalty > 0.1) {
      evidence.push(`Assessment score indicates ${category.replace('_', ' ')} gap (penalty: ${(aPenalty * 100).toFixed(0)}%)`)
    }

    const mPenalty = missedExposurePenalty(category, inputs.missedExerciseCategories, inputs.totalSessionCount)
    if (mPenalty > 0) {
      evidence.push(`${inputs.missedSessionCount} missed session(s) with relevant ${category.replace('_', ' ')} exercises`)
    }

    const cBonus = completedBonus(category, inputs.completedExerciseCategories)
    if (cBonus > 0) {
      evidence.push(`Recent completed exercises partially address ${category.replace('_', ' ')}`)
    }

    const nSignal = coachNoteSignal(category, inputs.coachNoteTags)
    if (nSignal > 0) {
      evidence.push(`Coach notes mention ${category.replace('_', ' ')}-related themes`)
    }

    const rawScore = aPenalty + mPenalty + nSignal - cBonus
    const score = Math.max(0, Math.min(1, rawScore))

    if (score >= GAP_THRESHOLD || evidence.length > 0) {
      gapScores.push({ category, score, evidence })
    }
  }

  // Sort by score descending
  gapScores.sort((a, b) => b.score - a.score)

  const topGaps = gapScores
    .filter(g => g.score >= GAP_THRESHOLD)
    .slice(0, 3)
    .map(g => g.category)

  // Determine intensity
  let recommendedIntensity: 'normal' | 'reduced' | 'recovery_only' = 'normal'
  if (inputs.overtainingSignalActive) {
    recommendedIntensity = 'recovery_only'
  } else if (inputs.injuryConstraintActive) {
    recommendedIntensity = 'reduced'
  } else if (inputs.missedSessionCount > 3 || gapScores.some(g => g.category === 'recovery' && g.score > 0.5)) {
    recommendedIntensity = 'reduced'
  }

  // Safety flags
  const safetyFlags: string[] = []
  if (inputs.playerAgeYears !== null && inputs.playerAgeYears < 12) {
    safetyFlags.push('Player is under 12 — no external load strength exercises.')
  }
  if (inputs.injuryConstraintActive) {
    safetyFlags.push('Active injury constraint — skip strength and agility; prioritize mobility.')
  }
  if (inputs.overtainingSignalActive) {
    safetyFlags.push('Overtraining signal active — recovery exercises only. No high-intensity work.')
  }
  safetyFlags.push('Always stop if experiencing pain or discomfort.')

  return {
    computedAt: new Date().toISOString(),
    inputsSummary: {
      assessmentDimensions: inputs.assessmentDimensions.length,
      missedSessions: inputs.missedSessionCount,
      totalSessions: inputs.totalSessionCount,
      coachNoteTags: inputs.coachNoteTags.length,
      overtainingSignalActive: inputs.overtainingSignalActive,
    },
    gapScores,
    topGaps,
    recommendedIntensity,
    safetyFlags,
  }
}
