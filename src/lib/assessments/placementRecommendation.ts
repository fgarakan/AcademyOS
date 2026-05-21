// Sprint 580 — Placement Recommendation Engine V1
// Pure computation — takes domain scores and returns a recommended curriculum level band.
// No DB calls. No AI calls. No official player placement writes.
// All outputs are draft recommendations requiring director approval.

import type { AssessmentEventDraft, AssessmentDomainScore, AssessmentDomain } from './index'
import { computeWeightedScore } from './index'
import { getSkillBandForScore } from './skillRubric'
import { getCompetitionBandForScore } from './competitionRubric'
import { getFitnessBandForScore } from './fitnessRubric'
import { getMentalBandForScore } from './mentalPerformanceRubric'

export type RecommendedStage =
  | 'red_foundation'
  | 'orange_development'
  | 'green_performance'
  | 'yellow_competitive'
  | 'high_performance'

export type PlacementConfidence = 'strong' | 'moderate' | 'weak'

export interface PlacementRecommendationDraft {
  draftId: string
  assessmentDraftId: string
  playerName: string
  weightedScore: number | null
  recommendedStage: RecommendedStage | null
  stageBandLabel: string
  domainSummary: DomainSummaryLine[]
  strengths: string[]
  areasForAttention: string[]
  confidence: PlacementConfidence
  directorNote: string
  generatedAt: string
  isDirectorApprovalRequired: boolean
}

export interface DomainSummaryLine {
  domain: AssessmentDomain
  score: number
  bandLabel: string
  indicativeLevel: string | null
}

const STAGE_SCORE_MAP: Array<{ min: number; max: number; stage: RecommendedStage; label: string }> = [
  { min: 1, max: 2.9, stage: 'red_foundation', label: 'Red Ball — Foundation' },
  { min: 3, max: 4.9, stage: 'orange_development', label: 'Orange Ball — Development' },
  { min: 5, max: 6.9, stage: 'green_performance', label: 'Green Ball — Performance' },
  { min: 7, max: 8.4, stage: 'yellow_competitive', label: 'Yellow Ball — Competitive' },
  { min: 8.5, max: 10, stage: 'high_performance', label: 'High Performance' },
]

function getStageForScore(score: number): { stage: RecommendedStage; label: string } | null {
  return STAGE_SCORE_MAP.find(s => score >= s.min && score <= s.max) ?? null
}

function getDomainBandLabel(domain: AssessmentDomain, score: number): string {
  switch (domain) {
    case 'skill': return getSkillBandForScore(score)?.label ?? ''
    case 'competition': return getCompetitionBandForScore(score)?.label ?? ''
    case 'fitness': return getFitnessBandForScore(score)?.label ?? ''
    case 'mental_performance': return getMentalBandForScore(score)?.label ?? ''
  }
}

function getDomainIndicativeLevel(domain: AssessmentDomain, score: number): string | null {
  switch (domain) {
    case 'skill': return getSkillBandForScore(score)?.indicativeLevel ?? null
    case 'competition': return getCompetitionBandForScore(score)?.indicativeLevel ?? null
    case 'fitness': return getFitnessBandForScore(score)?.indicativeLevel ?? null
    case 'mental_performance': return getMentalBandForScore(score)?.indicativeLevel ?? null
  }
}

function computeConfidence(
  domainScores: Partial<Record<AssessmentDomain, AssessmentDomainScore>>,
  weightedScore: number | null,
): PlacementConfidence {
  const completed = Object.keys(domainScores).length
  if (completed < 2 || weightedScore === null) return 'weak'

  const scores = Object.values(domainScores).map(s => s.rawScore)
  const spread = Math.max(...scores) - Math.min(...scores)

  if (completed >= 4 && spread <= 2) return 'strong'
  if (completed >= 3 && spread <= 3) return 'moderate'
  return 'weak'
}

function generateStrengths(domainScores: Partial<Record<AssessmentDomain, AssessmentDomainScore>>): string[] {
  const strengths: string[] = []
  for (const [domain, score] of Object.entries(domainScores) as [AssessmentDomain, AssessmentDomainScore][]) {
    if (score.rawScore >= 7) {
      strengths.push(`${score.bandLabel} in ${domain.replace(/_/g, ' ')}`)
    }
  }
  return strengths
}

function generateAreasForAttention(domainScores: Partial<Record<AssessmentDomain, AssessmentDomainScore>>): string[] {
  const areas: string[] = []
  for (const [domain, score] of Object.entries(domainScores) as [AssessmentDomain, AssessmentDomainScore][]) {
    if (score.rawScore <= 4) {
      areas.push(`${score.bandLabel} in ${domain.replace(/_/g, ' ')} — see coach notes`)
    }
  }
  return areas
}

function buildDirectorNote(
  confidence: PlacementConfidence,
  completedDomains: number,
  recommendedStage: RecommendedStage | null,
): string {
  if (completedDomains < 2) {
    return 'Assessment is incomplete. At least skill and competition domains are required before generating a placement recommendation.'
  }
  if (confidence === 'weak') {
    return 'Scores vary significantly across domains. Director review is especially important — consider whether the weighted score reflects the player\'s actual level.'
  }
  if (confidence === 'moderate') {
    return `Recommendation: ${recommendedStage?.replace(/_/g, ' ') ?? 'undetermined'}. Moderate confidence — review domain notes before approving.`
  }
  return `Strong recommendation: ${recommendedStage?.replace(/_/g, ' ') ?? 'undetermined'}. All domains assessed with consistent results. Director confirmation required before activation.`
}

export function generatePlacementRecommendation(
  draft: AssessmentEventDraft,
): PlacementRecommendationDraft {
  const weightedScore = computeWeightedScore(draft.domainScores)
  const stageResult = weightedScore !== null ? getStageForScore(weightedScore) : null

  const domainSummary: DomainSummaryLine[] = (
    Object.entries(draft.domainScores) as [AssessmentDomain, AssessmentDomainScore][]
  ).map(([domain, score]) => ({
    domain,
    score: score.rawScore,
    bandLabel: getDomainBandLabel(domain, score.rawScore),
    indicativeLevel: getDomainIndicativeLevel(domain, score.rawScore),
  }))

  const confidence = computeConfidence(draft.domainScores, weightedScore)
  const strengths = generateStrengths(draft.domainScores)
  const areasForAttention = generateAreasForAttention(draft.domainScores)
  const directorNote = buildDirectorNote(confidence, domainSummary.length, stageResult?.stage ?? null)

  return {
    draftId: `placement_${Date.now()}`,
    assessmentDraftId: draft.draftId,
    playerName: draft.playerName,
    weightedScore,
    recommendedStage: stageResult?.stage ?? null,
    stageBandLabel: stageResult?.label ?? 'Undetermined — insufficient data',
    domainSummary,
    strengths,
    areasForAttention,
    confidence,
    directorNote,
    generatedAt: new Date().toISOString(),
    isDirectorApprovalRequired: true,
  }
}

export function getPlacementConfidenceLabel(confidence: PlacementConfidence): string {
  const labels: Record<PlacementConfidence, string> = {
    strong: 'Strong confidence',
    moderate: 'Moderate confidence',
    weak: 'Low confidence — more data needed',
  }
  return labels[confidence]
}

export function getStageLabel(stage: RecommendedStage): string {
  const labels: Record<RecommendedStage, string> = {
    red_foundation: 'Red Ball — Foundation',
    orange_development: 'Orange Ball — Development',
    green_performance: 'Green Ball — Performance',
    yellow_competitive: 'Yellow Ball — Competitive',
    high_performance: 'High Performance',
  }
  return labels[stage]
}
