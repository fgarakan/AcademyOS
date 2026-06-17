// Mega Sprint 2971–3000 — DONNA Live AI Conversation + Learning Router V1
// Part 5.5 — Learning Quality Score
//
// Evaluates the quality of an AI-assisted learning capture.
// Produces a 0–100 quality score that augments the standard LearningScore
// with AI-specific signals.
//
// Quality signals:
//   + OpenAI successfully interpreted (source === 'openai')                 → +25
//   + Significant confidence improvement (delta > 0.20)                     → +15
//   + Moderate confidence improvement (delta 0.05–0.20)                     → +8
//   + DNA guard passed cleanly                                               → +5
//   + No personality transforms needed (AI draft already sounded like DONNA) → +5
//   - OpenAI fell back to deterministic result (source === 'fallback')       → -20
//   - OpenAI was not called (not_called)                                     → -10
//   - Confidence degraded (delta < -0.10)                                    → -10
//   - DNA guard blocked draft                                                → -30
//   - DNA guard flagged draft (soft conflict)                                → -10
//   - Heavy personality transformation (≥ 3 transforms)                     → -5
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Score is capped 0–100 and stored in LearningEntry.metadata['ai_quality_score'].

import type { AICallSource } from '@/lib/donna/conversation/donnaAIUsageMetrics'

// ── Quality score ─────────────────────────────────────────────────────────────

export type LearningQualityLabel = 'high' | 'medium' | 'low' | 'rejected'

export interface LearningQualityScore {
  score: number
  aiWasUseful: boolean
  confidenceDelta: number
  dnaConflict: boolean
  qualityLabel: LearningQualityLabel
  signals: string[]
}

// ── Scorer ────────────────────────────────────────────────────────────────────

export function scoreLearningQuality(params: {
  brainConfidence: number
  aiSource: AICallSource
  dnaConflict: boolean
  dnaBlocked: boolean
  finalConfidence: number
  personalityTransformations: number
}): LearningQualityScore {
  const {
    brainConfidence,
    aiSource,
    dnaConflict,
    dnaBlocked,
    finalConfidence,
    personalityTransformations,
  } = params

  const signals: string[] = []
  let score = 50

  // AI usefulness
  if (aiSource === 'openai') {
    score += 25
    signals.push('openai_succeeded')
  } else if (aiSource === 'fallback') {
    score -= 20
    signals.push('openai_fallback')
  } else {
    score -= 10
    signals.push('openai_not_called')
  }

  // Confidence improvement
  const delta = finalConfidence - brainConfidence
  if (delta > 0.20) {
    score += 15
    signals.push('confidence_improved_significantly')
  } else if (delta > 0.05) {
    score += 8
    signals.push('confidence_improved_slightly')
  } else if (delta < -0.10) {
    score -= 10
    signals.push('confidence_degraded')
  }

  // DNA guard
  if (dnaBlocked) {
    score -= 30
    signals.push('dna_blocked')
  } else if (dnaConflict) {
    score -= 10
    signals.push('dna_flagged')
  } else {
    score += 5
    signals.push('dna_clear')
  }

  // Personality transform cost (heavy = AI draft was far from DONNA's voice)
  if (personalityTransformations === 0) {
    score += 5
    signals.push('no_personality_transforms')
  } else if (personalityTransformations >= 3) {
    score -= 5
    signals.push('heavy_personality_transform')
  }

  score = Math.max(0, Math.min(100, Math.round(score)))

  const qualityLabel: LearningQualityLabel =
    dnaBlocked    ? 'rejected'
    : score >= 70 ? 'high'
    : score >= 45 ? 'medium'
    :               'low'

  return {
    score,
    aiWasUseful: aiSource === 'openai',
    confidenceDelta: Math.round((finalConfidence - brainConfidence) * 100) / 100,
    dnaConflict,
    qualityLabel,
    signals,
  }
}
