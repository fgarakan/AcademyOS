// Sprint 2861–2890 — DONNA Learning Ledger V1
// Part 13 — Learning Memory Bridge
//
// Bridges ConversationLearningRecord → DonnaLearningLedger.
// When a conversation ends and a LearningRecord is available,
// this bridge converts it into a LearningEntry and adds it to the Ledger.
//
// This is the only pathway for conversation-derived learnings to enter the Ledger.
// All other sources (director_voice, brian_direct, etc.) use createLearningEntry() directly.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Does not call OpenAI — enrichment is a separate step.
//   - Returns the created LearningEntry; caller decides whether to add to Ledger.

import type { ConversationLearningRecord } from '../conversation/conversationLearningRecord'
import type { LearningEntry, LearningSourceType } from './learningEntryModel'
import { createLearningEntry } from './learningEntryModel'
import type { InterpreterRole } from '../conversation/donnaIntentInterpreter'
import { calculateSourceReliability } from './donnaSourceReliabilityEngine'
import { applyScoreToEntry } from './donnaLearningScoringEngine'
import type { AcademyOSConcept } from '../conversation/donnaMeaningExtractor'
import type { LearningTopicDomain } from './learningEntryModel'

// ── Role-to-source mapping ────────────────────────────────────────────────────

function roleToSourceType(role: InterpreterRole): LearningSourceType {
  switch (role) {
    case 'director': return 'director_voice'
    case 'coach':    return 'coach_observation'
    case 'parent':   return 'parent_feedback'
    case 'player':   return 'player_input'
    default:         return 'conversation'
  }
}

// ── Bridge result ─────────────────────────────────────────────────────────────

export interface BridgeResult {
  entry: LearningEntry
  wasEnriched: boolean     // whether any fields were filled from the record vs defaults
  warnings: string[]
}

// ── Main bridge function ──────────────────────────────────────────────────────

/**
 * Convert a ConversationLearningRecord into a LearningEntry.
 * Does NOT add to Ledger — caller handles that.
 */
export function bridgeConversationRecord(
  record: ConversationLearningRecord,
  options: {
    academyId?: string
    actorName?: string
  } = {},
): BridgeResult {
  const warnings: string[] = []

  const role: InterpreterRole = record.role
  const sourceType = roleToSourceType(role)
  const reliability = calculateSourceReliability(sourceType, role, options.actorName)

  // Concepts come from allConcepts + interpretedTopConcept
  const conceptSet = new Set<AcademyOSConcept>()
  if (record.interpretedTopConcept) conceptSet.add(record.interpretedTopConcept)
  for (const c of record.allConcepts) conceptSet.add(c)
  const concepts = Array.from(conceptSet)

  if (concepts.length === 0) {
    warnings.push('No concepts extracted from conversation record')
  }

  // Derive topic from interpretedTopConcept or finalUnderstanding
  const topic = record.interpretedTopConcept
    ? record.interpretedTopConcept.replace(/_/g, ' ')
    : record.finalUnderstanding.slice(0, 80)

  const topicDomain = deriveTopicDomain(concepts, record.interpretedTopConcept)

  // Example phrases from original statement
  const examplePhrases: string[] = []
  if (record.originalStatement) {
    examplePhrases.push(record.originalStatement.slice(0, 120))
  }
  if (record.clarificationResponse) {
    examplePhrases.push(record.clarificationResponse.slice(0, 120))
  }

  // Use finalConfidence as primary confidence signal
  const confidence = record.finalConfidence > 0 ? record.finalConfidence : record.initialConfidence

  // Importance: high-value patterns and completed conversations get higher importance
  let importance = 0.50
  if (record.patternQuality === 'high_value') importance = 0.80
  else if (record.patternQuality === 'useful') importance = 0.65
  else if (record.patternQuality === 'ambiguous') importance = 0.35
  else if (record.patternQuality === 'low_value') importance = 0.20

  if (!record.completedSuccessfully) importance *= 0.75

  const partial: Parameters<typeof createLearningEntry>[0] = {
    academyId: options.academyId ?? 'academy-default',
    sourceType,
    sourceId: record.id,
    role,
    conversationId: record.id,
    topic,
    topicDomain,
    concepts,
    summary: record.finalUnderstanding,
    evidence: record.originalStatement,
    examplePhrases,
    confidence,
    importance: Math.min(importance, 1.0),
    frequency: 1,
    sourceReliability: reliability.finalReliability,
    status: 'captured',
    reviewRequired: true,
    approvedBy: null,
    approvedAt: null,
    tags: [],
    academyDnaModelId: record.academyDnaModelId ?? null,
    metadata: {
      bridgedFrom: 'ConversationLearningRecord',
      patternQuality: record.patternQuality,
      completedSuccessfully: record.completedSuccessfully,
      clarificationAsked: record.clarificationAsked,
      stagesVisited: record.stagesVisited,
    },
  }

  let entry = createLearningEntry(partial)
  entry = applyScoreToEntry(entry)

  return {
    entry,
    wasEnriched: concepts.length > 0 && record.finalUnderstanding.length > 20,
    warnings,
  }
}

// ── Topic domain inference ────────────────────────────────────────────────────

function deriveTopicDomain(
  concepts: AcademyOSConcept[],
  topConcept: AcademyOSConcept | null,
): LearningTopicDomain {
  const curriculum = ['curriculum_issue', 'session_quality', 'grouping_issue', 'advancement_opportunity']
  const playerDev = ['progression_issue', 'engagement_issue', 'effort_issue', 'focus_issue']
  const psych = ['confidence_issue', 'mental_performance']
  const parentRelations = ['parent_communication', 'parent_satisfaction', 'expectation_issue', 'retention_risk']
  const enrollment = ['enrollment_issue', 'enrollment_opportunity']
  const sessions = ['attendance_issue']
  const competitive = ['competitive_readiness', 'tactical_concern']

  const has = (list: string[]) => concepts.some(c => list.includes(c))

  if (has(enrollment)) return 'enrollment'
  if (has(parentRelations)) return 'parent_relations'
  if (has(competitive)) return 'competitive_readiness'
  if (has(psych)) return 'player_psychology'
  if (has(playerDev)) return 'player_development'
  if (has(curriculum)) return 'curriculum'
  if (has(sessions)) return 'session_execution'

  if (topConcept) {
    const name = topConcept.toLowerCase()
    if (name.includes('curriculum') || name.includes('drill')) return 'curriculum'
    if (name.includes('player') || name.includes('develop')) return 'player_development'
    if (name.includes('parent')) return 'parent_relations'
    if (name.includes('group') || name.includes('session')) return 'group_management'
    if (name.includes('enroll')) return 'enrollment'
    if (name.includes('coach')) return 'coaching_philosophy'
  }

  return 'general'
}
