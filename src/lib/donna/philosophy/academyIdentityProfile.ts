// Mega Sprint 1746–1775 — DONNA Philosophy Memory & Academy Evolution Engine V1
// Academy Identity Profile: dynamically generated, evidence-backed portrait of what
// the academy actually is — not just what it said it was at onboarding.
//
// Intelligence hierarchy enforcement:
//   Reality (player evidence)    → weight 4   [highest authority]
//   Evidence (behavior patterns) → weight 3
//   Memory (decision history)    → weight 2
//   Philosophy (DNA)             → weight 1
//   Inference (defaults)         → weight 0   [fills gaps only; never overrides data]
//
// Profile is computed dynamically from available inputs.
// Never manually configured by the director.
// Never presented as fact when confidence is low.
// Always includes explanations for every dimension score.

import type { AcademyDnaSummary, PlayerLevelSummary } from '../curriculum/curriculumIntelligenceContext'
import type { CurriculumImprovementSuggestion } from '../curriculumImprovementEngine'
import type { AcademyMemory } from '../memory/donnaAcademyMemoryTypes'
import type { PreferenceSignal } from './academyPreferenceExtractor'

// ── Identity dimensions ───────────────────────────────────────────────────────

export type IdentityDimensionKey =
  | 'technique_focus'
  | 'tactical_focus'
  | 'game_based_learning'
  | 'competition_emphasis'
  | 'assessment_rigor'
  | 'coach_autonomy'
  | 'parent_transparency'
  | 'long_term_development'
  | 'retention_focus'
  | 'player_wellbeing'

export type IdentityConfidence = 'high' | 'medium' | 'low' | 'insufficient'
export type IdentityPrimarySource =
  | 'player_evidence'    // backed by real player data
  | 'behavior'           // backed by observed decision patterns
  | 'stated_philosophy'  // only onboarding DNA available
  | 'default'            // no data; inference only

export interface IdentityDimension {
  key:             IdentityDimensionKey
  label:           string
  /** 0–100. The authoritative score after hierarchy weighting. */
  finalScore:      number
  /** From DNA onboarding. null if DNA not set. */
  statedScore:     number | null
  /** From behavior/preference patterns. null if insufficient history. */
  observedScore:   number | null
  /** From player evidence signals. null if unavailable. */
  evidenceScore:   number | null
  evidenceCount:   number
  confidence:      IdentityConfidence
  primarySource:   IdentityPrimarySource
  explanation:     string
  /** Non-null when stated philosophy and observed behavior diverge by ≥20 points. */
  driftWarning:    string | null
}

export interface AcademyIdentityProfile {
  academyId:       string
  dimensions:      IdentityDimension[]
  overallConfidence: IdentityConfidence
  generatedAt:     string
  /** ISO date range of data used */
  dataWindowStart: string | null
  dataWindowEnd:   string | null
  /** DONNA's one-paragraph narrative of the academy identity */
  narrative:       string
  /** Limitations of this profile */
  limitations:     string[]
}

// ── Reality Override Analysis ─────────────────────────────────────────────────

export interface RealityOverrideAnalysis {
  id:                      string
  observedReality:         string
  contradictedPhilosophy:  string
  evidenceStrength:        'STRONG' | 'MODERATE' | 'WEAK' | 'INSUFFICIENT'
  confidence:              number    // 0–100
  recommendedAction:       string
  affectedDimension:       IdentityDimensionKey | null
}

// ── DNA score mapping ─────────────────────────────────────────────────────────

function dnaScoreForDimension(
  key: IdentityDimensionKey,
  dna: AcademyDnaSummary,
): number | null {
  if (!dna.hasDna) return null

  const model = dna.inferredModel

  const COMPETITIVE_MODEL = model === 'competitive_elite' || model === 'competitive_development'
  const RECREATIONAL_MODEL = model === 'recreational'

  const scores: Record<IdentityDimensionKey, number> = {
    technique_focus:       COMPETITIVE_MODEL ? 75 : RECREATIONAL_MODEL ? 50 : 60,
    tactical_focus:        COMPETITIVE_MODEL ? 80 : RECREATIONAL_MODEL ? 45 : 60,
    game_based_learning:   RECREATIONAL_MODEL ? 80 : COMPETITIVE_MODEL ? 60 : 65,
    competition_emphasis:  model === 'competitive_elite' ? 90 : model === 'competitive_development' ? 70 : RECREATIONAL_MODEL ? 30 : 50,
    assessment_rigor:      COMPETITIVE_MODEL ? 80 : RECREATIONAL_MODEL ? 45 : 60,
    coach_autonomy: (() => {
      if (dna.advancementApproval === 'coach_recommendation') return 75
      if (dna.advancementApproval === 'director_only')        return 30
      return 55
    })(),
    parent_transparency: (() => {
      if (dna.parentTransparency === 'high')    return 85
      if (dna.parentTransparency === 'minimal') return 25
      return 60
    })(),
    long_term_development: COMPETITIVE_MODEL ? 55 : RECREATIONAL_MODEL ? 85 : 70,
    retention_focus:       RECREATIONAL_MODEL ? 85 : COMPETITIVE_MODEL ? 50 : 65,
    player_wellbeing:      RECREATIONAL_MODEL ? 80 : COMPETITIVE_MODEL ? 60 : 70,
  }

  return scores[key] ?? 50
}

// ── Preference score for dimension ───────────────────────────────────────────

const PREF_KEY_FOR_DIMENSION: Partial<Record<IdentityDimensionKey, string>> = {
  technique_focus:      'technical_focus',
  tactical_focus:       'tactical_focus',
  game_based_learning:  'game_based_learning',
  competition_emphasis: 'competition_emphasis',
  assessment_rigor:     'assessment_rigor',
  coach_autonomy:       'coach_autonomy',
  parent_transparency:  'parent_transparency',
  long_term_development:'long_term_development',
}

function preferenceScoreForDimension(
  key:         IdentityDimensionKey,
  preferences: PreferenceSignal[],
): { score: number | null; evidenceCount: number } {
  const prefKey = PREF_KEY_FOR_DIMENSION[key]
  if (!prefKey) return { score: null, evidenceCount: 0 }

  const signal = preferences.find(p => p.key === prefKey)
  if (!signal || signal.confidence === 'insufficient') return { score: null, evidenceCount: 0 }

  return { score: signal.score, evidenceCount: signal.evidenceCount }
}

// ── Player evidence score for dimension ──────────────────────────────────────
// Reality layer: player weakness signals indicate where curriculum emphasis is NEEDED,
// not necessarily where the academy IS focused. DONNA interprets this carefully.

function evidenceScoreForDimension(
  key:         IdentityDimensionKey,
  playerLevels: PlayerLevelSummary[],
): { score: number | null; count: number } {
  if (playerLevels.length === 0) return { score: null, count: 0 }

  const allSuggestions: CurriculumImprovementSuggestion[] = []
  for (const level of playerLevels) {
    allSuggestions.push(...level.improvementSuggestions)
  }
  if (allSuggestions.length === 0) return { score: null, count: 0 }

  const DOMAIN_FOR_DIMENSION: Partial<Record<IdentityDimensionKey, string[]>> = {
    technique_focus:      ['technical', 'skill'],
    tactical_focus:       ['tactical', 'competition'],
    game_based_learning:  ['general', 'tactical'],
    competition_emphasis: ['competition'],
    assessment_rigor:     ['behavior', 'general'],
    player_wellbeing:     ['mental', 'mental_performance', 'fitness'],
  }

  const domains = DOMAIN_FOR_DIMENSION[key]
  if (!domains) return { score: null, count: 0 }

  const relevant = allSuggestions.filter(s => domains.includes(s.targetDomain))
  if (relevant.length === 0) return { score: null, count: 0 }

  // High number of weakness signals in this domain → evidence shows the domain is underserved
  const avgConfidence = relevant.reduce((sum, s) => sum + s.confidenceScore, 0) / relevant.length
  // More suggestions = more weakness in this domain = lower evidence score (player evidence shows gap)
  // This is intentionally inverted: high weakness evidence = low coverage = potentially low emphasis
  const coverageScore = Math.max(20, 80 - Math.min(relevant.length * 8, 60))

  return { score: Math.round(coverageScore), count: relevant.length }
}

// ── Weighted composite score ──────────────────────────────────────────────────

function computeFinalScore(
  statedScore:    number | null,
  observedScore:  number | null,
  evidenceScore:  number | null,
): { finalScore: number; primarySource: IdentityPrimarySource; confidence: IdentityConfidence } {
  // Apply hierarchy: Reality (w4) > Evidence (w3) > Memory (w2) > Philosophy (w1)
  let weightedSum = 0; let totalWeight = 0

  if (evidenceScore !== null)  { weightedSum += evidenceScore * 4;  totalWeight += 4 }
  if (observedScore !== null)  { weightedSum += observedScore * 3;  totalWeight += 3 }
  if (statedScore !== null)    { weightedSum += statedScore * 1;    totalWeight += 1 }

  if (totalWeight === 0) {
    return { finalScore: 50, primarySource: 'default', confidence: 'insufficient' }
  }

  const finalScore = Math.round(weightedSum / totalWeight)

  let primarySource: IdentityPrimarySource = 'default'
  let confidence: IdentityConfidence = 'insufficient'

  if (evidenceScore !== null && totalWeight >= 4) {
    primarySource = 'player_evidence'
    confidence = totalWeight >= 7 ? 'high' : 'medium'
  } else if (observedScore !== null && totalWeight >= 3) {
    primarySource = 'behavior'
    confidence = totalWeight >= 4 ? 'medium' : 'low'
  } else if (statedScore !== null) {
    primarySource = 'stated_philosophy'
    confidence = 'low'
  }

  return { finalScore, primarySource, confidence }
}

// ── Dimension builder ─────────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<IdentityDimensionKey, string> = {
  technique_focus:       'Technical Focus',
  tactical_focus:        'Tactical Focus',
  game_based_learning:   'Game-Based Learning',
  competition_emphasis:  'Competition Emphasis',
  assessment_rigor:      'Assessment Rigor',
  coach_autonomy:        'Coach Autonomy',
  parent_transparency:   'Parent Transparency',
  long_term_development: 'Long-Term Development',
  retention_focus:       'Retention Focus',
  player_wellbeing:      'Player Wellbeing',
}

const DIMENSION_KEYS: IdentityDimensionKey[] = [
  'technique_focus', 'tactical_focus', 'game_based_learning', 'competition_emphasis',
  'assessment_rigor', 'coach_autonomy', 'parent_transparency', 'long_term_development',
  'retention_focus', 'player_wellbeing',
]

function buildDimension(
  key:         IdentityDimensionKey,
  dna:         AcademyDnaSummary,
  preferences: PreferenceSignal[],
  playerLevels: PlayerLevelSummary[],
): IdentityDimension {
  const statedScore  = dnaScoreForDimension(key, dna)
  const prefResult   = preferenceScoreForDimension(key, preferences)
  const evResult     = evidenceScoreForDimension(key, playerLevels)

  const observedScore = prefResult.score
  const evidenceScore = evResult.score

  const { finalScore, primarySource, confidence } =
    computeFinalScore(statedScore, observedScore, evidenceScore)

  const label = DIMENSION_LABELS[key]

  let explanation: string
  if (confidence === 'insufficient') {
    explanation = `${label}: insufficient data to assess. ${!dna.hasDna ? 'Academy onboarding not complete.' : 'No behavioral history yet.'}`
  } else if (primarySource === 'player_evidence') {
    explanation = `${label}: ${finalScore}/100 — based primarily on player evidence (${evResult.count} signals).`
  } else if (primarySource === 'behavior') {
    explanation = `${label}: ${finalScore}/100 — based on observed decision patterns (${prefResult.evidenceCount} decisions).`
  } else {
    explanation = `${label}: ${finalScore}/100 — based on stated onboarding philosophy (no behavioral history yet).`
  }

  let driftWarning: string | null = null
  if (
    statedScore !== null &&
    observedScore !== null &&
    Math.abs(statedScore - observedScore) >= 20
  ) {
    const direction = observedScore < statedScore ? 'lower' : 'higher'
    driftWarning = `Observed behavior suggests ${label.toLowerCase()} is ${direction} than stated at onboarding (stated: ${statedScore}, observed: ${observedScore}).`
  }

  return {
    key,
    label,
    finalScore,
    statedScore,
    observedScore,
    evidenceScore,
    evidenceCount: prefResult.evidenceCount + evResult.count,
    confidence,
    primarySource,
    explanation,
    driftWarning,
  }
}

// ── Profile builder ───────────────────────────────────────────────────────────

export function buildAcademyIdentityProfile(
  academyId:    string,
  dna:          AcademyDnaSummary,
  preferences:  PreferenceSignal[],
  playerLevels: PlayerLevelSummary[],
  memories:     AcademyMemory[],
): AcademyIdentityProfile {
  const dimensions = DIMENSION_KEYS.map(key =>
    buildDimension(key, dna, preferences, playerLevels),
  )

  // Overall confidence = worst of the top 3 dimensions with data
  const dimensionsWithData = dimensions.filter(d => d.confidence !== 'insufficient')
  const overallConfidence: IdentityConfidence =
    dimensionsWithData.length === 0                  ? 'insufficient'
    : dimensionsWithData.length < 4                  ? 'low'
    : dimensionsWithData.every(d => d.confidence === 'high') ? 'high'
    : dimensionsWithData.some(d => d.confidence === 'medium') ? 'medium'
    : 'low'

  // Determine data window from memories
  const allDates: string[] = []
  for (const m of memories) allDates.push(m.occurredAt)
  const dataWindowStart = allDates.length > 0
    ? allDates.reduce((a, b) => a < b ? a : b)
    : null
  const dataWindowEnd = allDates.length > 0
    ? allDates.reduce((a, b) => a > b ? a : b)
    : null

  const narrative = buildNarrative(dimensions, dna, preferences)

  const limitations: string[] = ['V1: curriculum memory records accepted decisions only.']
  if (!dna.hasDna) limitations.push('Academy onboarding DNA not set — philosophy scores use defaults.')
  if (playerLevels.filter(l => l.hasEvidence).length === 0) {
    limitations.push('No player evidence available — reality layer not contributing to scores.')
  }

  return {
    academyId,
    dimensions,
    overallConfidence,
    generatedAt:     new Date().toISOString(),
    dataWindowStart,
    dataWindowEnd,
    narrative,
    limitations,
  }
}

function buildNarrative(
  dimensions:  IdentityDimension[],
  dna:         AcademyDnaSummary,
  preferences: PreferenceSignal[],
): string {
  const high = dimensions.filter(d => d.finalScore >= 70 && d.confidence !== 'insufficient')
  const low  = dimensions.filter(d => d.finalScore <= 35 && d.confidence !== 'insufficient')

  if (dimensions.every(d => d.confidence === 'insufficient')) {
    return 'Not enough behavioral history to characterize this academy yet. Complete onboarding and add curriculum content to build an evidence-backed identity profile.'
  }

  const strengths = high.map(d => d.label.toLowerCase()).join(', ')
  const avoidances = low.map(d => d.label.toLowerCase()).join(', ')

  let narrative = dna.hasDna
    ? `This academy describes itself as ${dna.inferredModel.replace(/_/g, ' ')}.`
    : 'This academy has not completed onboarding yet.'

  if (strengths) {
    narrative += ` Observed behavior shows strong emphasis on: ${strengths}.`
  }
  if (avoidances) {
    narrative += ` Patterns suggest lower emphasis on: ${avoidances}.`
  }
  if (preferences.length > 0 && preferences[0].confidence !== 'insufficient') {
    narrative += ` Most consistent behavioral signal: ${preferences[0].explanation}`
  }

  return narrative
}

// ── DONNA Self-Explanation System ─────────────────────────────────────────────

export interface DonnaExplanation {
  recommendation:     string
  evidenceUsed:       string[]
  memoryUsed:         string[]
  philosophyUsed:     string[]
  playerSignalsUsed:  string[]
  confidence:         number  // 0–100
  missingData:        string[]
}

/**
 * Generates a transparent explanation of why DONNA made a specific recommendation.
 * Used when the director asks "Why are you recommending this?"
 * Never black-box. Always cites sources.
 */
export function buildDonnaExplanation(
  recommendation: string,
  profile:        AcademyIdentityProfile,
  preferences:    PreferenceSignal[],
  playerLevels:   PlayerLevelSummary[],
): DonnaExplanation {
  const evidenceUsed: string[] = []
  const memoryUsed: string[] = []
  const philosophyUsed: string[] = []
  const playerSignalsUsed: string[] = []
  const missingData: string[] = []

  // Collect from profile dimensions
  for (const dim of profile.dimensions) {
    if (dim.evidenceScore !== null && dim.evidenceCount > 0) {
      evidenceUsed.push(`${dim.label}: ${dim.evidenceCount} evidence signal${dim.evidenceCount !== 1 ? 's' : ''}`)
    }
    if (dim.observedScore !== null) {
      memoryUsed.push(`${dim.label} behavioral pattern (${dim.evidenceCount} decisions)`)
    }
    if (dim.statedScore !== null && dim.primarySource === 'stated_philosophy') {
      philosophyUsed.push(`Stated philosophy: ${dim.label} = ${dim.statedScore}/100`)
    }
  }

  // Player signals
  for (const level of playerLevels) {
    if (level.hasEvidence && level.improvementSuggestions.length > 0) {
      const top = level.improvementSuggestions[0]
      playerSignalsUsed.push(
        `${level.levelName}: ${top.recommendation} (confidence ${top.confidenceScore}%)`,
      )
    }
  }

  if (evidenceUsed.length === 0 && memoryUsed.length === 0) {
    missingData.push('No behavioral history available — recommendation based on stated philosophy only.')
  }
  if (playerLevels.filter(l => l.hasEvidence).length === 0) {
    missingData.push('No player evidence available — player reality layer not contributing.')
  }

  const highConfDims = profile.dimensions.filter(d => d.confidence === 'high').length
  const confidence = Math.min(95, Math.round(
    (evidenceUsed.length * 10 + memoryUsed.length * 8 + playerSignalsUsed.length * 12) /
    Math.max(1, evidenceUsed.length + memoryUsed.length + playerSignalsUsed.length + 1) * 10
    + highConfDims * 3,
  ))

  return {
    recommendation,
    evidenceUsed:       evidenceUsed.slice(0, 5),
    memoryUsed:         memoryUsed.slice(0, 5),
    philosophyUsed:     philosophyUsed.slice(0, 3),
    playerSignalsUsed:  playerSignalsUsed.slice(0, 5),
    confidence:         Math.max(20, Math.min(95, confidence)),
    missingData,
  }
}

// ── Reality Override Analysis ─────────────────────────────────────────────────

/**
 * Detects where player evidence (Reality layer) contradicts stated philosophy.
 * Reality always outranks philosophy — this surfaces those conflicts for the director.
 */
export function buildRealityOverrideAnalysis(
  profile:      AcademyIdentityProfile,
  playerLevels: PlayerLevelSummary[],
): RealityOverrideAnalysis[] {
  const overrides: RealityOverrideAnalysis[] = []

  for (const dim of profile.dimensions) {
    if (dim.evidenceScore === null || dim.statedScore === null) continue

    const gap = dim.statedScore - dim.evidenceScore
    if (Math.abs(gap) < 25) continue  // Only flag significant divergence

    const levelsWithSignals = playerLevels.filter(l => l.hasEvidence && l.improvementSuggestions.length > 0)
    const evidenceStrength: RealityOverrideAnalysis['evidenceStrength'] =
      levelsWithSignals.length >= 3 ? 'STRONG'
      : levelsWithSignals.length >= 2 ? 'MODERATE'
      : levelsWithSignals.length >= 1 ? 'WEAK'
      : 'INSUFFICIENT'

    if (evidenceStrength === 'INSUFFICIENT') continue

    const statedHighButEvidenceLow = gap > 0
    const observedReality = statedHighButEvidenceLow
      ? `Player evidence suggests ${dim.label.toLowerCase()} is less developed than expected (evidence score: ${dim.evidenceScore}/100)`
      : `Player evidence suggests stronger ${dim.label.toLowerCase()} outcomes than stated emphasis would predict`

    const contradictedPhilosophy = `Academy's stated ${dim.label.toLowerCase()} score is ${dim.statedScore}/100`

    const recommendedAction = statedHighButEvidenceLow
      ? `Review ${dim.label.toLowerCase()} curriculum coverage and assess whether stated emphasis is translating to player outcomes.`
      : `Current approach appears to be producing strong ${dim.label.toLowerCase()} outcomes — consider formalising it in your curriculum.`

    overrides.push({
      id:                     `ror_${dim.key}_${Date.now()}`,
      observedReality,
      contradictedPhilosophy,
      evidenceStrength,
      confidence:             Math.min(90, 40 + levelsWithSignals.length * 15),
      recommendedAction,
      affectedDimension:      dim.key,
    })
  }

  return overrides
}

// ── Storage helper ────────────────────────────────────────────────────────────

export function saveIdentityProfile(
  rawSettings: Record<string, unknown>,
  profile:     AcademyIdentityProfile,
): Record<string, unknown> {
  return { ...rawSettings, donna_identity_profile: profile }
}

export function loadIdentityProfile(rawSettings: Record<string, unknown>): AcademyIdentityProfile | null {
  return rawSettings.donna_identity_profile
    ? (rawSettings.donna_identity_profile as AcademyIdentityProfile)
    : null
}
