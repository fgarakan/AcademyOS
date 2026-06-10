// Mega Sprint 1625–1654 — DONNA Academy Learning Engine V1
// Types for memory-based learning: signals, patterns, trends, lessons, recommendations.
// Input: AcademyMemory[] (from Sprint 1595 memory engine)
// Output: MemoryLearningReport — Patterns · Trends · Lessons · Recommendations · Confidence · Limitations
//
// Distinct from academyLearningEngine.ts (Sprint 1761) which operates on DirectorDonnaContext.

import type { MemoryEntityLink } from '../memory/donnaAcademyMemoryTypes'
import type { AcademyMemory } from '../memory/donnaAcademyMemoryTypes'

// ── Signal type ───────────────────────────────────────────────────────────────

export type SignalType =
  | 'promotion_decision'
  | 'placement_decision'
  | 'assessment_result'
  | 'coach_assignment'
  | 'coach_wrap_up'
  | 'parent_update'
  | 'curriculum_change'
  | 'director_override'
  | 'donna_recommendation'
  | 'proposed_action'

// ── Pattern type ──────────────────────────────────────────────────────────────

export type PatternType =
  | 'promotion_cluster'
  | 'rejection_repeat'
  | 'override_frequency'
  | 'assessment_gap'
  | 'curriculum_change_burst'
  | 'coach_assignment_churn'
  | 'parent_update_gap'
  | 'placement_velocity'

// ── Trend type ────────────────────────────────────────────────────────────────

export type TrendType =
  | 'decision_velocity'
  | 'override_rate'
  | 'parent_update_cadence'
  | 'curriculum_change_rate'
  | 'promotion_rate'

export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'insufficient_data'

// ── Learning confidence ───────────────────────────────────────────────────────

export type LearningConfidence = 'high' | 'medium' | 'low' | 'insufficient'

// ── Learning signal ───────────────────────────────────────────────────────────

export interface MemoryLearningSignal {
  id:              string
  signalType:      SignalType
  headline:        string
  evidence:        string[]
  confidence:      LearningConfidence
  sourceMemoryIds: string[]
  occurredAt:      string
  entityLinks:     MemoryEntityLink[]
  importance:      AcademyMemory['importance']
}

// ── Pattern detection result ──────────────────────────────────────────────────

export interface PatternDetectionResult {
  id:              string
  patternType:     PatternType
  headline:        string
  observation:     string       // neutral, factual statement
  evidence:        string[]
  frequency:       number       // count of observations that form this pattern
  sourceMemoryIds: string[]
  confidence:      LearningConfidence
  monitorFlag:     boolean
}

// ── Trend detection result ────────────────────────────────────────────────────

export interface TrendDetectionResult {
  id:              string
  trendType:       TrendType
  headline:        string
  direction:       TrendDirection
  observation:     string
  evidence:        string[]
  sourceMemoryIds: string[]
  confidence:      LearningConfidence
}

// ── Extracted lesson ──────────────────────────────────────────────────────────

export interface ExtractedLesson {
  id:                string
  sourcePatternId:   string | null
  sourceTrendId:     string | null
  headline:          string             // concise director-facing label
  insight:           string             // what this means for the director (1–2 sentences)
  monitorSuggestion: string | null      // what to watch for next
  confidence:        LearningConfidence
  limitations:       string[]
}

// ── Director recommendation ───────────────────────────────────────────────────

export interface DirectorRecommendation {
  id:               string
  sourceLessonId:   string
  action:           string              // concrete suggested action
  rationale:        string              // observation-based; no causal claims
  destination:      string | null       // route to navigate to
  priority:         'high' | 'medium' | 'low'
  requiresApproval: boolean
}

// ── Memory learning report ────────────────────────────────────────────────────

export interface MemoryLearningReport {
  generatedAt:           string
  totalMemoriesAnalyzed: number
  patterns:              PatternDetectionResult[]
  trends:                TrendDetectionResult[]
  lessons:               ExtractedLesson[]
  recommendations:       DirectorRecommendation[]
  confidence:            LearningConfidence
  limitations:           string[]
  dataDepth:             LearningConfidence  // alias for confidence; used by formatters
}
