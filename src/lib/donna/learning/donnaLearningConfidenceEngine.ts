// Mega Sprint 1625–1654 — DONNA Academy Learning Engine V1
// Confidence engine: scores overall confidence for patterns, trends, and reports.
// Enforces minimum evidence thresholds. Never inflates confidence.

import type {
  LearningConfidence,
  PatternDetectionResult,
  TrendDetectionResult,
  ExtractedLesson,
} from './donnaAcademyLearningTypes'

// ── Thresholds ────────────────────────────────────────────────────────────────

const MEDIUM_MEMORY_FLOOR  = 10
const LOW_MEMORY_FLOOR     = 5
const MEDIUM_PATTERN_FLOOR = 5
const LOW_PATTERN_FLOOR    = 3

// ── Pattern confidence ────────────────────────────────────────────────────────

export function scorePatternConfidence(
  pattern: PatternDetectionResult,
  totalMemories: number,
): LearningConfidence {
  if (totalMemories < LOW_MEMORY_FLOOR)          return 'insufficient'
  if (pattern.frequency >= MEDIUM_PATTERN_FLOOR) return 'medium'
  if (pattern.frequency >= LOW_PATTERN_FLOOR)    return 'low'
  return 'insufficient'
}

// ── Trend confidence ──────────────────────────────────────────────────────────

export function scoreTrendConfidence(
  trend: TrendDetectionResult,
  totalMemories: number,
): LearningConfidence {
  if (totalMemories < LOW_MEMORY_FLOOR)        return 'insufficient'
  if (trend.direction === 'insufficient_data') return 'insufficient'
  if (totalMemories >= MEDIUM_MEMORY_FLOOR)    return 'low'
  return 'insufficient'
}

// ── Lesson confidence ─────────────────────────────────────────────────────────

export function scoreLessonConfidence(lesson: ExtractedLesson): LearningConfidence {
  // Lesson confidence propagates from its source — never exceeds 'medium'
  return lesson.confidence
}

// ── Report confidence ─────────────────────────────────────────────────────────

export function scoreReportConfidence(
  totalMemories: number,
  patternCount:  number,
  trendCount:    number,
): LearningConfidence {
  if (totalMemories < LOW_MEMORY_FLOOR) return 'insufficient'
  if (totalMemories < MEDIUM_MEMORY_FLOOR) {
    return (patternCount > 0 || trendCount > 0) ? 'low' : 'insufficient'
  }
  return (patternCount >= 2 || trendCount >= 2) ? 'medium' : 'low'
}

// ── Limitations builder ───────────────────────────────────────────────────────

export function buildLearningLimitations(
  totalMemories: number,
  patternCount:  number,
  trendCount:    number,
  lessonCount:   number,
): string[] {
  const limitations: string[] = []

  limitations.push('V1 learning is frequency-based — it counts occurrences, not outcomes.')
  limitations.push('No causal links are inferred between patterns, trends, or results.')

  if (totalMemories < LOW_MEMORY_FLOOR) {
    limitations.push(
      `Only ${totalMemories} memory record${totalMemories !== 1 ? 's' : ''} loaded — ` +
      'patterns require more history to become reliable.',
    )
  }

  if (patternCount === 0) {
    limitations.push('No patterns detected — insufficient signal volume in current memory.')
  }

  if (trendCount === 0) {
    limitations.push(
      'No trends detected — more records are needed to compare early vs. recent windows.',
    )
  }

  if (lessonCount === 0) {
    limitations.push(
      'No lessons extracted — all detected patterns and trends fell below confidence thresholds.',
    )
  }

  limitations.push('Learning accuracy improves as more decisions are recorded and reviewed.')

  return limitations
}
