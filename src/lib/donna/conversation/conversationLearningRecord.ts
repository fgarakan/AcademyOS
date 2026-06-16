// Sprint 2831–2860 — DONNA Conversational Intelligence & Learning Foundation V1
// Part 8 — Conversation Learning Record
//
// Captures conversation arcs for future learning.
// Stores as pending_learning — no DB, no approval workflows yet.
// This is the capture layer. Review and promotion come in a future sprint.
//
// What gets captured:
//   - Original user statement
//   - Interpreted intent
//   - Clarification asked (if any)
//   - Final understanding reached
//   - Action taken (if any)
//   - Confidence levels at each stage
//   - User role and Academy DNA context (anonymized)
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React.
//   - In-memory store only — data does not persist between sessions.
//   - No player names, no coach names, no raw notes.
//   - Learning records are anonymized — concept + signal level only.

import type { InterpreterRole } from './donnaIntentInterpreter'
import type { AcademyOSConcept } from './donnaMeaningExtractor'
import type { ConversationStage } from './donnaConversationNavigator'
import type { AcademyDNAModelId } from '../../academyDNA/academyDNAModels'

// ── Learning record ───────────────────────────────────────────────────────────

export type LearningRecordStatus = 'pending_review' | 'promoted' | 'rejected' | 'archived'

export type PatternQuality = 'high_value' | 'useful' | 'ambiguous' | 'low_value'

export interface ConversationLearningRecord {
  id: string
  capturedAt: string               // ISO timestamp

  // Input
  originalStatement: string         // the user's actual words (verbatim)
  role: InterpreterRole

  // Understanding
  interpretedTopConcept: AcademyOSConcept | null
  allConcepts: AcademyOSConcept[]
  initialConfidence: number         // 0–1 at first interpretation
  finalConfidence: number           // 0–1 after clarification (if any)

  // Process
  clarificationAsked: string | null // the clarifying question DONNA asked
  clarificationResponse: string | null // what the user said in response
  stagesVisited: ConversationStage[]

  // Outcome
  finalUnderstanding: string        // what DONNA ultimately understood
  actionTaken: string | null        // what DONNA proposed or did
  completedSuccessfully: boolean    // did the conversation reach completion?

  // Context (anonymized — no names, no IDs)
  academyDnaModelId: AcademyDNAModelId | null
  patternQuality: PatternQuality
  status: LearningRecordStatus

  // Learning signal
  wasIntentCorrect: boolean | null  // null = unknown / not evaluated yet
  wasActionAppropriate: boolean | null
  directorConfirmedIntent: boolean | null
  notes: string | null              // optional internal note
}

// ── Pending learning store ────────────────────────────────────────────────────

class PendingLearningStore {
  private records: Map<string, ConversationLearningRecord> = new Map()
  private maxRecords = 500          // cap to prevent memory growth

  add(record: ConversationLearningRecord): void {
    if (this.records.size >= this.maxRecords) {
      // Evict the oldest pending record
      const oldest = Array.from(this.records.values())
        .filter(r => r.status === 'pending_review')
        .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))[0]
      if (oldest) this.records.delete(oldest.id)
    }
    this.records.set(record.id, record)
  }

  get(id: string): ConversationLearningRecord | undefined {
    return this.records.get(id)
  }

  getAll(status?: LearningRecordStatus): ConversationLearningRecord[] {
    return Array.from(this.records.values())
      .filter(r => !status || r.status === status)
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
  }

  updateStatus(id: string, status: LearningRecordStatus): boolean {
    const record = this.records.get(id)
    if (!record) return false
    this.records.set(id, { ...record, status })
    return true
  }

  clear(): void {
    this.records.clear()
  }

  size(): number {
    return this.records.size
  }
}

// Module-level store (singleton in process memory)
export const pendingLearningStore = new PendingLearningStore()

// ── ID generator ──────────────────────────────────────────────────────────────

let _idCounter = 0
function generateLearningId(): string {
  _idCounter += 1
  return `learn-${Date.now()}-${_idCounter}`
}

// ── Pattern quality scorer ────────────────────────────────────────────────────

function scorePatternQuality(
  initialConfidence: number,
  finalConfidence: number,
  completedSuccessfully: boolean,
  clarificationAsked: string | null,
): PatternQuality {
  const confidenceLift = finalConfidence - initialConfidence

  if (completedSuccessfully && confidenceLift >= 0.3) return 'high_value'
  if (completedSuccessfully && confidenceLift >= 0.1) return 'useful'
  if (completedSuccessfully) return 'useful'
  if (clarificationAsked && confidenceLift < 0.1) return 'ambiguous'
  return 'low_value'
}

// ── Capture function ──────────────────────────────────────────────────────────

/**
 * Capture a conversation arc as a learning record.
 *
 * Privacy rules:
 *   - originalStatement is stored verbatim (coach/director review this later)
 *   - No player names, coach names, or assessment scores in other fields
 *   - academyDnaModelId is safe to store (it's a model category, not identifying)
 */
export function captureConversationLearning(params: {
  originalStatement: string
  role: InterpreterRole
  interpretedTopConcept: AcademyOSConcept | null
  allConcepts: AcademyOSConcept[]
  initialConfidence: number
  finalConfidence: number
  clarificationAsked: string | null
  clarificationResponse: string | null
  stagesVisited: ConversationStage[]
  finalUnderstanding: string
  actionTaken: string | null
  completedSuccessfully: boolean
  academyDnaModelId?: AcademyDNAModelId | null
  notes?: string | null
}): ConversationLearningRecord {
  const {
    originalStatement,
    role,
    interpretedTopConcept,
    allConcepts,
    initialConfidence,
    finalConfidence,
    clarificationAsked,
    clarificationResponse,
    stagesVisited,
    finalUnderstanding,
    actionTaken,
    completedSuccessfully,
    academyDnaModelId = null,
    notes = null,
  } = params

  const record: ConversationLearningRecord = {
    id: generateLearningId(),
    capturedAt: new Date().toISOString(),
    originalStatement,
    role,
    interpretedTopConcept,
    allConcepts,
    initialConfidence,
    finalConfidence,
    clarificationAsked,
    clarificationResponse,
    stagesVisited,
    finalUnderstanding,
    actionTaken,
    completedSuccessfully,
    academyDnaModelId,
    patternQuality: scorePatternQuality(
      initialConfidence,
      finalConfidence,
      completedSuccessfully,
      clarificationAsked,
    ),
    status: 'pending_review',
    wasIntentCorrect: null,
    wasActionAppropriate: null,
    directorConfirmedIntent: null,
    notes,
  }

  pendingLearningStore.add(record)
  return record
}

// ── Retrieval ─────────────────────────────────────────────────────────────────

/**
 * Get pending learning records for review.
 */
export function getPendingLearning(
  options: {
    role?: InterpreterRole
    quality?: PatternQuality
    limit?: number
  } = {},
): ConversationLearningRecord[] {
  let records = pendingLearningStore.getAll('pending_review')

  if (options.role) {
    records = records.filter(r => r.role === options.role)
  }

  if (options.quality) {
    records = records.filter(r => r.patternQuality === options.quality)
  }

  if (options.limit) {
    records = records.slice(0, options.limit)
  }

  return records
}

// ── Learning summary ──────────────────────────────────────────────────────────

export interface LearningStoreSummary {
  totalRecords: number
  pendingReview: number
  highValue: number
  completionRate: number
  byRole: Record<InterpreterRole, number>
  topConcepts: Array<{ concept: AcademyOSConcept; count: number }>
}

/**
 * Summarize the learning store for reporting.
 */
export function getLearningStoreSummary(): LearningStoreSummary {
  const all = pendingLearningStore.getAll()

  const pendingReview = all.filter(r => r.status === 'pending_review').length
  const highValue = all.filter(r => r.patternQuality === 'high_value').length
  const completed = all.filter(r => r.completedSuccessfully).length

  const byRole: Record<InterpreterRole, number> = {
    director: 0,
    coach: 0,
    parent: 0,
    player: 0,
  }
  for (const r of all) {
    byRole[r.role] = (byRole[r.role] ?? 0) + 1
  }

  const conceptCounts = new Map<AcademyOSConcept, number>()
  for (const r of all) {
    if (r.interpretedTopConcept) {
      conceptCounts.set(r.interpretedTopConcept, (conceptCounts.get(r.interpretedTopConcept) ?? 0) + 1)
    }
  }

  const topConcepts = Array.from(conceptCounts.entries())
    .map(([concept, count]) => ({ concept, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalRecords: all.length,
    pendingReview,
    highValue,
    completionRate: all.length > 0 ? completed / all.length : 0,
    byRole,
    topConcepts,
  }
}
