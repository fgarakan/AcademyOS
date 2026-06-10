// Mega Sprint 1625–1654 — DONNA Academy Learning Engine V1
// Academy learning engine (memory-based): orchestrates the full pipeline.
// Input:  AcademyMemory[] (from Sprint 1595 memory engine)
// Output: MemoryLearningReport — Patterns · Trends · Lessons · Recommendations · Confidence · Limitations
//
// This is the NEW memory-based engine (donna-prefixed).
// The existing academyLearningEngine.ts (Sprint 1761) uses DirectorDonnaContext and is NOT replaced.

import type { AcademyMemory } from '../memory/donnaAcademyMemoryTypes'
import type { MemoryLearningReport, LearningConfidence } from './donnaAcademyLearningTypes'
import { extractLearningSignals } from './donnaLearningSignalExtractor'
import { detectPatterns } from './donnaPatternDetectionEngine'
import { detectTrends } from './donnaTrendDetectionEngine'
import { extractLessons, buildRecommendations } from './donnaLessonExtractionEngine'
import { scoreReportConfidence, buildLearningLimitations } from './donnaLearningConfidenceEngine'

// ── Report builder ────────────────────────────────────────────────────────────

export function buildMemoryLearningReport(memories: AcademyMemory[]): MemoryLearningReport {
  const signals         = extractLearningSignals(memories)
  const patterns        = detectPatterns(signals, memories)
  const trends          = detectTrends(memories)
  const lessons         = extractLessons(patterns, trends)
  const recommendations = buildRecommendations(lessons)
  const confidence      = scoreReportConfidence(memories.length, patterns.length, trends.length)
  const limitations     = buildLearningLimitations(memories.length, patterns.length, trends.length, lessons.length)

  return {
    generatedAt:           new Date().toISOString(),
    totalMemoriesAnalyzed: memories.length,
    patterns,
    trends,
    lessons,
    recommendations,
    confidence,
    limitations,
    dataDepth: confidence,
  }
}

// ── Report formatter ──────────────────────────────────────────────────────────

export function formatMemoryLearningReportAsMessage(report: MemoryLearningReport): string {
  const lines: string[] = []

  lines.push('**Academy Learning Report**')
  lines.push(`*Based on ${report.totalMemoriesAnalyzed} memory record${report.totalMemoriesAnalyzed !== 1 ? 's' : ''}.*`)
  lines.push('')

  // Patterns
  lines.push('**Patterns**')
  if (report.patterns.length === 0) {
    lines.push('• No recurring patterns detected in current memory.')
  } else {
    for (const p of report.patterns) {
      lines.push(`• ${p.headline} *(${cap(p.confidence)})*`)
    }
  }
  lines.push('')

  // Trends
  lines.push('**Trends**')
  if (report.trends.length === 0) {
    lines.push('• No directional trends detected — more memory records needed.')
  } else {
    for (const t of report.trends) {
      const arrow = t.direction === 'increasing' ? '↑'
                  : t.direction === 'decreasing' ? '↓'
                  : t.direction === 'stable'     ? '→'
                  : '—'
      lines.push(`• ${arrow} ${t.headline} *(${cap(t.confidence)})*`)
    }
  }
  lines.push('')

  // Lessons
  lines.push('**Lessons**')
  if (report.lessons.length === 0) {
    lines.push('• No lessons extracted yet — patterns and trends need more history to produce reliable insights.')
  } else {
    for (const l of report.lessons) {
      lines.push(`• **${l.headline}:** ${l.insight}`)
      if (l.monitorSuggestion) {
        lines.push(`  *Watch:* ${l.monitorSuggestion}`)
      }
    }
  }
  lines.push('')

  // Recommendations
  lines.push('**Recommendations**')
  if (report.recommendations.length === 0) {
    lines.push('• No recommendations yet — more history is needed.')
  } else {
    for (const r of report.recommendations) {
      const flag = r.priority === 'high' ? '↑' : r.priority === 'medium' ? '→' : '↓'
      lines.push(`• ${flag} ${r.action}`)
    }
  }
  lines.push('')

  // Confidence
  lines.push('**Confidence**')
  lines.push(buildConfidenceStatement(report.confidence, report.totalMemoriesAnalyzed))
  lines.push('')

  // Limitations
  lines.push('**Limitations**')
  for (const l of report.limitations) {
    lines.push(`• ${l}`)
  }

  return lines.join('\n')
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function buildConfidenceStatement(confidence: LearningConfidence, totalMemories: number): string {
  switch (confidence) {
    case 'high':
      return 'High — substantial memory history. Patterns and trends are well-supported.'
    case 'medium':
      return `Medium — ${totalMemories} memory records loaded. Patterns and trends are emerging but should be monitored.`
    case 'low':
      return `Low — ${totalMemories} memory records loaded. Early signals only. Treat all observations with caution.`
    case 'insufficient':
    default:
      return `Insufficient — ${totalMemories} memory record${totalMemories !== 1 ? 's' : ''} loaded. A minimum of 5 records is needed for pattern detection.`
  }
}
