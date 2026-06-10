// Mega Sprint 1625–1654 — DONNA Academy Learning Engine V1
// Learning answer builder: detects memory-learning phrases and builds structured
// DONNA responses from AcademyMemory[] via the MemoryLearningReport.
// Pure TypeScript. No DB, no React, no side effects.
//
// Distinct from learningCommandRouter.ts (Sprint 1761) which uses DirectorDonnaContext.
// These phrases target memory-sourced pattern/trend/lesson analysis.

import type { AcademyMemory } from '../memory/donnaAcademyMemoryTypes'
import type { LearningConfidence } from './donnaAcademyLearningTypes'
import {
  buildMemoryLearningReport,
  formatMemoryLearningReportAsMessage,
} from './donnaAcademyLearningEngine'

// ── Answer result ─────────────────────────────────────────────────────────────

export interface MemoryLearningAnswerResult {
  message:     string
  confidence:  LearningConfidence
  destination: string | null
}

// ── Intent signals ────────────────────────────────────────────────────────────

const MEMORY_LEARNING_PHRASES = [
  'what trends are you',
  'what trends do you',
  'what lessons',
  'lessons from our',
  'lessons from the',
  'what have you learned from',
  'learned from our decisions',
  'learned from our history',
  'what does our history',
  'what does our data',
  'what do our decisions tell',
  'learning report',
  'memory learning',
  'learning from memory',
  'pattern analysis',
  'trend analysis',
  'what patterns have you',
  'patterns you have',
  'what are the lessons',
  'what can we learn from',
  'what has your memory',
  'based on our history',
  'based on our decisions',
  'from our track record',
  'from our decision history',
  'what recurring patterns',
  'recurring pattern',
]

export function isMemoryLearningPhrase(input: string): boolean {
  const lower = input.toLowerCase().trim()
  return MEMORY_LEARNING_PHRASES.some(phrase => lower.includes(phrase))
}

// ── Answer builder ────────────────────────────────────────────────────────────

export function buildMemoryLearningAnswer(
  _question: string,
  memories:  AcademyMemory[],
): MemoryLearningAnswerResult {
  if (memories.length === 0) {
    return {
      message: [
        '**Academy Learning Report**',
        '',
        'No memory records are available to analyse yet.',
        '',
        '**Confidence:** Insufficient',
        '',
        '**Limitations:**',
        '• Learning requires at least 5 decision records to begin detecting patterns.',
        '• As you approve, reject, and modify proposed actions, DONNA builds a memory base ' +
          'from which patterns and trends can emerge.',
        '',
        '**Recommended Next Action:**',
        'Review and decide on pending items in the approval queue to begin building learning history.',
      ].join('\n'),
      confidence:  'insufficient',
      destination: '/director/review',
    }
  }

  const report  = buildMemoryLearningReport(memories)
  const message = formatMemoryLearningReportAsMessage(report)

  const primaryDestination =
    report.recommendations.length > 0
      ? (report.recommendations[0].destination ?? '/director')
      : '/director'

  return {
    message,
    confidence:  report.confidence,
    destination: primaryDestination,
  }
}
