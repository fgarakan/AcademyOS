// Mega Sprint 2441–2470 — DONNA Recommendation Reasoning + Follow-Up V1
// Recommendation Explainer: converts a TypedRecommendation DB row into a
// canonical EvidencedRecommendation for use in follow-up reasoning responses.
//
// This bridges the DB-loaded recommendation data to the existing
// donnaEvidenceReasoningEngine so DONNA can answer all 9 follow-up question
// types deterministically from pre-computed evidence.
//
// Design rules:
//   - Pure TypeScript. No DB, no React, no side effects.
//   - Evidence is derived only from TypedRecommendation fields — nothing invented.
//   - EvidencedRecommendation.followUpAnswers pre-computed for all 9 types.

import {
  buildEvidencedRecommendation,
  type EvidenceItem,
  type EvidencedRecommendation,
  type EvidencedRecommendationInput,
  type COOQuestionCategory,
} from '@/lib/donna/reasoning/donnaEvidenceReasoningEngine'
import type { ConfidenceResult } from '@/lib/donna/donnaConfidence'
import type { TypedRecommendation } from './donnaRecommendationLoader'
import { lifecycleLabel } from './donnaRecommendationLifecycle'

// ── Extended recommendation explanation ───────────────────────────────────────

export interface RecommendationExplanation extends EvidencedRecommendation {
  owner:          'director' | 'head_coach' | 'coach'
  ownerLabel:     string
  reviewDate:     string | null
  expectedImpact: string
  currentStatus:  string
  isUrgent:       boolean
}

// ── Confidence from score ─────────────────────────────────────────────────────

function scoreToConfidenceResult(score: number): ConfidenceResult {
  if (score >= 0.75) {
    return { confidence: 'high',        reason: 'all_live',     label: 'High — live data',          detail: null,                                                    isAnswerable: true }
  }
  if (score >= 0.45) {
    return { confidence: 'partial',     reason: 'some_partial', label: 'Medium — partial data',     detail: 'Some data points are inferred.',                        isAnswerable: true }
  }
  return   { confidence: 'insufficient', reason: 'no_data_yet', label: 'Low — insufficient data',   detail: 'More sessions and assessments needed for high confidence.', isAnswerable: true }
}

// ── Evidence items from typed recommendation ──────────────────────────────────

function inferEvidenceCategory(type: string): EvidenceItem['category'] {
  if (/assessment/i.test(type))  return 'assessment'
  if (/attendance/i.test(type))  return 'attendance'
  if (/curriculum/i.test(type))  return 'curriculum'
  if (/approval|review/i.test(type)) return 'approval'
  if (/session|training/i.test(type)) return 'session'
  if (/placement/i.test(type))   return 'placement'
  if (/parent/i.test(type))      return 'parent'
  return 'observation'
}

function inferCOOCategory(type: string): COOQuestionCategory {
  if (/assessment/i.test(type))  return 'player_health'
  if (/curriculum/i.test(type))  return 'curriculum_gaps'
  if (/parent/i.test(type))      return 'parent_confidence'
  if (/coach/i.test(type))       return 'coach_health'
  return 'player_health'
}

function buildEvidenceItems(rec: TypedRecommendation, signals: string[] = []): EvidenceItem[] {
  const items: EvidenceItem[] = []

  if (rec.description) {
    items.push({
      category:      inferEvidenceCategory(rec.recommendationType),
      claim:         rec.description.slice(0, 120),
      sourceText:    rec.description.slice(0, 120),
      strength:      rec.confidenceScore >= 0.75 ? 'strong' : rec.confidenceScore >= 0.45 ? 'moderate' : 'weak',
      dataAvailable: true,
    })
  }

  if (rec.urgency === 'urgent' || rec.urgency === 'immediate') {
    items.push({
      category:      inferEvidenceCategory(rec.recommendationType),
      claim:         `Flagged as ${rec.urgency} — highest priority level`,
      sourceText:    `urgency: ${rec.urgency}`,
      strength:      'strong',
      dataAvailable: true,
    })
  }

  for (const signal of signals.slice(0, 2)) {
    items.push({
      category:      'observation',
      claim:         signal.replace(/\([^)]+\)$/, '').trim(),
      sourceText:    signal,
      strength:      /high|critical/i.test(signal) ? 'strong' : 'moderate',
      dataAvailable: true,
    })
  }

  if (rec.isOverdue) {
    items.push({
      category:      'approval',
      claim:         'Review date has passed — this recommendation is overdue',
      sourceText:    `review_date: ${rec.reviewDate ?? 'past'}`,
      strength:      'strong',
      dataAvailable: true,
    })
  }

  if (items.length === 0) {
    items.push({
      category:      inferEvidenceCategory(rec.recommendationType),
      claim:         `Recommendation generated with ${rec.confidenceLabel.toLowerCase()} confidence`,
      sourceText:    `confidence_score: ${rec.confidenceScore.toFixed(2)}`,
      strength:      rec.confidenceScore >= 0.75 ? 'strong' : 'moderate',
      dataAvailable: true,
    })
  }

  return items
}

// ── Main explainer ────────────────────────────────────────────────────────────

/**
 * Build a full RecommendationExplanation from a TypedRecommendation DB row.
 * Optional entitySignals (from EntityMemoryContext.recentSignals) enrich the evidence.
 */
export function explainPlayerRecommendation(
  rec: TypedRecommendation,
  entitySignals: string[] = [],
): RecommendationExplanation {
  const evidence   = buildEvidenceItems(rec, entitySignals)
  const confidence = scoreToConfidenceResult(rec.confidenceScore)
  const category   = inferCOOCategory(rec.recommendationType)

  const input: EvidencedRecommendationInput = {
    recommendation: rec.title,
    evidence,
    confidence,
    riskIfIgnored:  rec.riskIfIgnored,
    nextAction:     `Review "${rec.title}" in the Director Dashboard`,
    missingInfo:    rec.confidenceScore < 0.75 ? ['More assessments would strengthen this recommendation'] : [],
    category,
  }

  const base = buildEvidencedRecommendation(input)
  const ownerLabels: Record<string, string> = { director: 'Director', head_coach: 'Head Coach', coach: 'Coach' }

  return {
    ...base,
    owner:          rec.owner,
    ownerLabel:     ownerLabels[rec.owner] ?? 'Director',
    reviewDate:     rec.reviewDate,
    expectedImpact: rec.expectedImpact,
    currentStatus:  lifecycleLabel(rec.lifecycleStatus),
    isUrgent:       rec.isOverdue || rec.urgency === 'urgent' || rec.urgency === 'immediate',
  }
}
