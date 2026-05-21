// Sprint 579 — DONNA Voice-to-Assessment Structuring V1
// Converts free-form voice input strings into structured assessment draft fields.
// DRAFT ONLY — no AI API calls. Pattern matching against known rubric keywords.
// Pure TypeScript — no DB calls, no external calls, no side effects.

import type { AssessmentDomain, AssessmentDomainScore } from './index'
import { SKILL_RUBRIC_BANDS } from './skillRubric'
import { COMPETITION_RUBRIC_BANDS } from './competitionRubric'
import { FITNESS_RUBRIC_BANDS } from './fitnessRubric'
import { MENTAL_RUBRIC_BANDS } from './mentalPerformanceRubric'
import type { AssessmentRubricBand } from './index'

export interface VoiceAssessmentDraft {
  rawInput: string
  detectedDomain: AssessmentDomain | null
  extractedScore: number | null
  extractedBand: AssessmentRubricBand | null
  extractedNotes: string
  confidence: 'high' | 'medium' | 'low'
  requiresReview: boolean
  donnaComment: string
}

const DOMAIN_KEYWORDS: Record<AssessmentDomain, string[]> = {
  skill: [
    'forehand', 'backhand', 'serve', 'volley', 'stroke', 'technique', 'groundstroke',
    'return', 'rally', 'footwork', 'net', 'overhead', 'spin', 'topspin', 'slice',
  ],
  competition: [
    'match', 'tournament', 'competition', 'game', 'point', 'set', 'score', 'competing',
    'opponent', 'pressure point', 'tiebreak', 'winning', 'losing', 'competing',
  ],
  fitness: [
    'movement', 'speed', 'endurance', 'energy', 'tired', 'quick', 'slow', 'fit',
    'running', 'recovery', 'balance', 'coordination', 'agility', 'power', 'pace',
  ],
  mental_performance: [
    'focus', 'attitude', 'frustration', 'resilience', 'composure', 'mental', 'routine',
    'confident', 'nervous', 'pressure', 'reset', 'emotional', 'self-talk', 'behaviour',
  ],
}

const SCORE_KEYWORDS: Array<{ words: string[]; score: number }> = [
  { words: ['excellent', 'outstanding', 'exceptional', 'elite'], score: 9 },
  { words: ['very good', 'strong', 'advanced', 'high level'], score: 8 },
  { words: ['good', 'solid', 'consistent', 'reliable'], score: 7 },
  { words: ['above average', 'developing well', 'improving', 'progressing'], score: 6 },
  { words: ['average', 'moderate', 'adequate', 'okay', 'ok'], score: 5 },
  { words: ['below average', 'emerging', 'early stage'], score: 4 },
  { words: ['beginner', 'new', 'basic', 'foundational', 'limited'], score: 3 },
  { words: ['very limited', 'no experience', 'just starting'], score: 2 },
  { words: ['none', 'not applicable', 'n/a'], score: 1 },
]

function detectDomain(input: string): { domain: AssessmentDomain | null; confidence: 'high' | 'medium' | 'low' } {
  const lower = input.toLowerCase()
  const scores: Record<AssessmentDomain, number> = {
    skill: 0, competition: 0, fitness: 0, mental_performance: 0,
  }

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as [AssessmentDomain, string[]][]) {
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[domain] += 1
    }
  }

  const sorted = (Object.entries(scores) as [AssessmentDomain, number][]).sort((a, b) => b[1] - a[1])
  const [topDomain, topScore] = sorted[0]
  const [, secondScore] = sorted[1]

  if (topScore === 0) return { domain: null, confidence: 'low' }
  if (topScore >= 3 && topScore > secondScore * 2) return { domain: topDomain, confidence: 'high' }
  if (topScore >= 2) return { domain: topDomain, confidence: 'medium' }
  return { domain: topDomain, confidence: 'low' }
}

function extractScore(input: string): number | null {
  const lower = input.toLowerCase()

  // Explicit numeric pattern e.g. "7/10" or "score of 6"
  const numericMatch = lower.match(/\b([1-9]|10)\s*(?:\/\s*10|out of 10)?\b/)
  if (numericMatch) {
    const n = parseInt(numericMatch[1], 10)
    if (n >= 1 && n <= 10) return n
  }

  for (const { words, score } of SCORE_KEYWORDS) {
    if (words.some(w => lower.includes(w))) return score
  }

  return null
}

function getBandForDomainAndScore(
  domain: AssessmentDomain,
  score: number,
): AssessmentRubricBand | null {
  const bandMap: Record<AssessmentDomain, typeof SKILL_RUBRIC_BANDS> = {
    skill: SKILL_RUBRIC_BANDS,
    competition: COMPETITION_RUBRIC_BANDS,
    fitness: FITNESS_RUBRIC_BANDS,
    mental_performance: MENTAL_RUBRIC_BANDS,
  }
  const bands = bandMap[domain]
  return bands.find(b => score >= b.minScore && score <= b.maxScore) ?? null
}

export function structureVoiceAssessmentInput(rawInput: string): VoiceAssessmentDraft {
  const { domain, confidence } = detectDomain(rawInput)
  const score = extractScore(rawInput)
  const band = domain && score ? getBandForDomainAndScore(domain, score) : null

  const requiresReview = confidence === 'low' || score === null || domain === null

  let donnaComment = ''
  if (!domain) {
    donnaComment = 'I couldn\'t identify which assessment area this covers. Please specify skill, competition, fitness, or mental performance.'
  } else if (score === null) {
    donnaComment = `I've noted this as a ${domain} observation, but couldn't extract a score. Please review and add a score before submitting.`
  } else if (confidence === 'low') {
    donnaComment = `I've structured this as a ${domain} note with score ${score}/10, but I\'m not confident. Please check before saving.`
  } else {
    donnaComment = `Structured as a ${domain} observation — score ${score}/10 (${band?.label ?? 'unclassified'}). Review and confirm.`
  }

  return {
    rawInput,
    detectedDomain: domain,
    extractedScore: score,
    extractedBand: band,
    extractedNotes: rawInput.trim(),
    confidence,
    requiresReview,
    donnaComment,
  }
}

export function voiceDraftToAssessmentDomainScore(
  draft: VoiceAssessmentDraft,
): AssessmentDomainScore | null {
  if (!draft.detectedDomain || draft.extractedScore === null) return null

  return {
    domain: draft.detectedDomain,
    rawScore: draft.extractedScore,
    bandId: draft.extractedBand?.bandId ?? '',
    bandLabel: draft.extractedBand?.label ?? '',
    coachNotes: draft.extractedBand?.coachNotes ?? '',
    evidenceNotes: draft.extractedNotes,
  }
}
