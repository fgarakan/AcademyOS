// Sprint 2861–2890 — DONNA Learning Ledger V1
// Learning Entry Model — canonical data type for all ledger entries.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - This is the single shared type used by every engine in the learning layer.
//   - Do not duplicate fields from ConversationLearningRecord — bridge only.
//   - Status transitions are one-way: captured → reviewing → approved/rejected → promoted/archived.

import type { AcademyOSConcept } from '../conversation/donnaMeaningExtractor'
import type { InterpreterRole } from '../conversation/donnaIntentInterpreter'
import type { AcademyDNAModelId } from '../../academyDNA/academyDNAModels'

// ── Status ────────────────────────────────────────────────────────────────────

export type LearningStatus =
  | 'captured'    // just arrived from a conversation or voice input
  | 'reviewing'   // surfaced in the review queue — awaiting decision
  | 'approved'    // director or owner explicitly approved
  | 'rejected'    // director or owner rejected — will not influence intelligence
  | 'promoted'    // approved + promoted to Academy Knowledge — now influences intelligence
  | 'archived'    // no longer active; kept for audit trail only

// ── Source ────────────────────────────────────────────────────────────────────

export type LearningSourceType =
  | 'conversation'          // captured from ConversationLearningRecord
  | 'director_voice'        // director voice note input
  | 'coach_observation'     // coach on-court observation
  | 'parent_feedback'       // parent-submitted concern or feedback
  | 'player_input'          // player self-report
  | 'system_observation'    // automated signal from AcademyOS (attendance, assessment gap, etc.)
  | 'brian_direct'          // owner/academy founder explicitly teaching DONNA

// ── Topic domains ─────────────────────────────────────────────────────────────

export type LearningTopicDomain =
  | 'curriculum'
  | 'player_development'
  | 'coaching_philosophy'
  | 'academy_operations'
  | 'parent_relations'
  | 'player_psychology'
  | 'competitive_readiness'
  | 'group_management'
  | 'session_execution'
  | 'enrollment'
  | 'general'

// ── Learning entry ────────────────────────────────────────────────────────────

export interface LearningEntry {
  id: string
  academyId: string
  createdAt: string                   // ISO timestamp

  // Source
  sourceType: LearningSourceType
  sourceId: string                    // conversation ID, session ID, voice note ID, etc.
  role: InterpreterRole
  conversationId: string | null

  // Content
  topic: string                       // human-readable topic label
  topicDomain: LearningTopicDomain
  concepts: AcademyOSConcept[]        // AcademyOS concepts this learning touches
  summary: string                     // one-sentence summary of what was learned
  evidence: string                    // original statement(s) supporting this learning
  examplePhrases: string[]            // up to 3 verbatim phrases that triggered this

  // Scoring
  confidence: number                  // 0–1 extraction confidence
  importance: number                  // 0–1 estimated importance to academy intelligence
  frequency: number                   // how many times this learning has appeared
  sourceReliability: number           // 0–1 reliability of the source
  learningScore: number               // 0–100 composite score

  // Status
  status: LearningStatus
  reviewRequired: boolean
  approvedBy: string | null           // director name or 'system'
  approvedAt: string | null           // ISO timestamp

  // Promotion
  promotionEligible: boolean          // score + status qualify for Knowledge promotion
  promotedAt: string | null           // ISO timestamp when promoted

  // Clustering
  clusterId: string | null            // which cluster this entry belongs to
  isDuplicate: boolean                // flagged by deduplication engine
  canonicalEntryId: string | null     // if duplicate: the canonical entry this maps to

  // Organization
  tags: string[]

  // Context
  academyDnaModelId: AcademyDNAModelId | null

  // Metadata
  metadata: Record<string, unknown>
}

// ── Valid status transitions ───────────────────────────────────────────────────

export const VALID_STATUS_TRANSITIONS: Record<LearningStatus, LearningStatus[]> = {
  captured:  ['reviewing', 'rejected', 'archived'],
  reviewing: ['approved', 'rejected', 'archived'],
  approved:  ['promoted', 'archived'],
  rejected:  ['archived'],
  promoted:  ['archived'],
  archived:  [],          // terminal state
}

export function canTransition(from: LearningStatus, to: LearningStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from].includes(to)
}

// ── Learning score thresholds ─────────────────────────────────────────────────

export const SCORE_THRESHOLDS = {
  promotionMinScore:   70,  // minimum learningScore to be promotion-eligible
  reviewPriority:      60,  // surface in review queue immediately
  highImportance:      0.7, // importance threshold for "important" label
  frequencyThreshold:  3,   // 3+ occurrences = recurring pattern
} as const

// ── Factory ───────────────────────────────────────────────────────────────────

let _entryCounter = 0

export function generateEntryId(prefix = 'le'): string {
  _entryCounter += 1
  return `${prefix}-${Date.now()}-${_entryCounter}`
}

export function createLearningEntry(
  partial: Omit<LearningEntry, 'id' | 'createdAt' | 'learningScore' | 'promotionEligible' | 'isDuplicate' | 'canonicalEntryId' | 'clusterId' | 'promotedAt'>,
): LearningEntry {
  const entry: LearningEntry = {
    ...partial,
    id: generateEntryId(),
    createdAt: new Date().toISOString(),
    learningScore: 0,        // scored by DonnaLearningScoringEngine after creation
    promotionEligible: false, // set after scoring
    isDuplicate: false,
    canonicalEntryId: null,
    clusterId: null,
    promotedAt: null,
  }
  return entry
}
