// Mega Sprint 1655–1684 — DONNA Insight & Perspective Shift Engine V1
// Insight answer builder — phrase detection + response construction.
// Analogous to donnaLearningAnswerBuilder.ts (Sprint 1625).
//
// isInsightPhrase()  — detects intent to request insight analysis
// buildInsightAnswer() — builds the full DONNA response

import type { AcademyMemory } from '../memory/donnaAcademyMemoryTypes'
import type { MemoryLearningReport } from '../learning/donnaAcademyLearningTypes'
import type { InsightConfidence } from './donnaInsightTypes'
import { buildMemoryLearningReport } from '../learning/donnaAcademyLearningEngine'
import {
  buildAcademyInsightReport,
  formatAcademyInsightReportAsMessage,
} from './donnaAcademyInsightEngine'

// ── Answer result ──────────────────────────────────────────────────────────────

export interface InsightAnswerResult {
  message:     string
  confidence:  InsightConfidence
  destination: string | null
}

// ── Phrase detection ───────────────────────────────────────────────────────────
// These phrases are intentionally distinct from learningCommandRouter.ts
// and donnaLearningAnswerBuilder.ts to avoid routing collisions.
//
// Learning phrases focus on "what have we learned" / "patterns" / "trends".
// Insight phrases focus on "what are we missing" / "blind spots" / "gaps".

const INSIGHT_PHRASES: string[] = [
  'what are we missing',
  'what am i missing',
  'blind spots',
  'blind spot',
  "what aren't we seeing",
  'what are we not seeing',
  'what are we overlooking',
  'what are we ignoring',
  'hidden patterns',
  'hidden opportunity',
  'hidden opportunities',
  'perspective shift',
  'alternative explanation',
  'alternative explanations',
  'contradictions in our data',
  'contradictions in the data',
  'what contradicts',
  'what conflicts',
  'insight report',
  'give me an insight',
  'give me insights',
  'insight analysis',
  'what should i investigate',
  'what should we investigate',
  'investigate',
  'deeper analysis',
  'deeper insight',
  "what's hidden",
  "what is hidden",
]

export function isInsightPhrase(input: string): boolean {
  const lower = input.toLowerCase().trim()
  return INSIGHT_PHRASES.some(phrase => lower.includes(phrase))
}

// ── Destination routing ────────────────────────────────────────────────────────
// Insight outputs map to the academy intelligence hub.
// V2 will route to /director/insights for a dedicated insight view.

function routeInsight(confidence: InsightConfidence): string | null {
  if (confidence === 'insufficient_data') return null
  return '/director'
}

// ── Main answer builder ────────────────────────────────────────────────────────
// Accepts memories and optionally a pre-built learning report.
// If no report is provided, one is built inline.

export function buildInsightAnswer(
  _question: string,
  memories:  AcademyMemory[],
  learningReport?: MemoryLearningReport,
): InsightAnswerResult {
  if (memories.length === 0) {
    return {
      message:     "No memory has been loaded yet. Once the academy has recorded decisions, I can identify what might be missing.",
      confidence:  'insufficient_data',
      destination: null,
    }
  }

  const report    = learningReport ?? buildMemoryLearningReport(memories)
  const insight   = buildAcademyInsightReport(memories, report)
  const message   = formatAcademyInsightReportAsMessage(insight)

  return {
    message,
    confidence:  insight.confidence,
    destination: routeInsight(insight.confidence),
  }
}
