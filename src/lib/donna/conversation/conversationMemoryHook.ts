// Sprint 2831–2860 — DONNA Conversational Intelligence & Learning Foundation V1
// Part 9 — Conversation Memory Hooks
//
// Detects recurring concerns from conversation history.
// Hooks into the existing donnaAcademyMemoryTypes.ts — does NOT create a new memory system.
//
// Purpose:
//   - Track recurring topics across conversation turns
//   - Surface "last month you mentioned Orange Ball enrollment concerns"
//   - Improve conversation quality through pattern awareness
//
// What makes a concern "recurring":
//   - Same concept mentioned ≥ 2 times in last 30 days
//   - Same entity referenced across multiple turns
//   - Unresolved topic that keeps coming up
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Consumes existing AcademyMemory types — does NOT define new memory types.
//   - Works with in-process conversation history — not a persistent store.
//   - Produces human-readable "memory callbacks" for DONNA to reference.

import type { AcademyOSConcept } from './donnaMeaningExtractor'
import type { InterpreterRole } from './donnaIntentInterpreter'
import type { ConversationLearningRecord } from './conversationLearningRecord'
import type { MemoryEntityLink } from '../memory/donnaAcademyMemoryTypes'

// ── Recurring concern ─────────────────────────────────────────────────────────

export interface RecurringConcern {
  concept: AcademyOSConcept
  occurrenceCount: number
  firstOccurredAt: string           // ISO timestamp
  lastOccurredAt: string            // ISO timestamp
  isResolved: boolean
  exampleStatements: string[]       // original user statements (up to 3)
  entityLink: MemoryEntityLink | null
  memoryCallbackText: string        // what DONNA says when referencing this
}

// ── Topic frequency tracker ───────────────────────────────────────────────────

export interface TopicFrequencyEntry {
  concept: AcademyOSConcept
  count: number
  sessions: string[]               // conversation session IDs
  statements: string[]
  timestamps: string[]
}

// ── Memory hook result ────────────────────────────────────────────────────────

export interface ConversationMemoryHookResult {
  recurringConcerns: RecurringConcern[]
  hasRecurringConcerns: boolean
  mostRepeatedConcept: AcademyOSConcept | null
  unresolvedTopics: RecurringConcern[]
  memoryCallbacks: string[]         // ready-to-use DONNA strings
  contextSummary: string
}

// ── Recurrence threshold ──────────────────────────────────────────────────────

const RECURRENCE_THRESHOLD = 2     // minimum occurrences to flag as recurring
const RECURRENCE_WINDOW_DAYS = 30  // window for recurrence detection

// ── Entity label extractor ────────────────────────────────────────────────────

function tryExtractEntityLabel(
  records: ConversationLearningRecord[],
  concept: AcademyOSConcept,
): MemoryEntityLink | null {
  for (const record of records) {
    if (record.interpretedTopConcept !== concept) continue
    // We only store anonymized entity — no raw IDs
    // Just check if the original statement hints at a group or player type
    const text = record.originalStatement.toLowerCase()

    if (/orange ball/i.test(text)) {
      return { entityType: 'curriculum_level', entityId: null, entityLabel: 'Orange Ball' }
    }
    if (/green ball/i.test(text)) {
      return { entityType: 'curriculum_level', entityId: null, entityLabel: 'Green Ball' }
    }
    if (/red ball/i.test(text)) {
      return { entityType: 'curriculum_level', entityId: null, entityLabel: 'Red Ball' }
    }
    if (/enrollment|group|intake/i.test(text)) {
      return { entityType: 'group', entityId: null, entityLabel: 'enrollment group' }
    }
  }
  return null
}

// ── Memory callback builder ───────────────────────────────────────────────────

function buildMemoryCallbackText(
  concern: Omit<RecurringConcern, 'memoryCallbackText'>,
): string {
  const daysSince = Math.floor(
    (Date.now() - new Date(concern.firstOccurredAt).getTime()) / (1000 * 60 * 60 * 24),
  )

  const entityPart = concern.entityLink
    ? ` about ${concern.entityLink.entityLabel}`
    : ''

  const timePart = daysSince <= 7
    ? 'earlier this week'
    : daysSince <= 14
    ? 'last week'
    : `${daysSince} days ago`

  const CONCEPT_SUMMARIES: Partial<Record<AcademyOSConcept, string>> = {
    enrollment_issue:       'enrollment concerns',
    retention_risk:         'retention risk signals',
    parent_concern:         'parent concerns',
    progression_issue:      'player progression stalls',
    engagement_issue:       'engagement issues',
    session_quality:        'session quality concerns',
    grouping_issue:         'group composition concerns',
    confidence_issue:       'player confidence concerns',
    assessment_need:        'assessment timing concerns',
    advancement_opportunity:'advancement readiness signals',
    curriculum_issue:       'curriculum fit concerns',
    coach_behavior_gap:     'coach behavior concerns',
    communication_issue:    'communication gaps',
  }

  const conceptLabel = CONCEPT_SUMMARIES[concern.concept] ?? concern.concept.replace(/_/g, ' ')

  if (concern.occurrenceCount >= 3) {
    return `You\'ve mentioned ${conceptLabel}${entityPart} ${concern.occurrenceCount} times. This may need a decision, not just another flag.`
  }

  if (!concern.isResolved) {
    return `You mentioned ${conceptLabel}${entityPart} ${timePart}. That hasn\'t been resolved — want to address it now?`
  }

  return `You discussed ${conceptLabel}${entityPart} ${timePart}.`
}

// ── Main hook ─────────────────────────────────────────────────────────────────

/**
 * Detect recurring concerns from a list of recent conversation learning records.
 *
 * @param records — recent conversation records (last 30 days)
 * @param role — the current user's role
 * @param windowDays — how many days to look back
 */
export function detectRecurringConcerns(
  records: ConversationLearningRecord[],
  role: InterpreterRole,
  windowDays = RECURRENCE_WINDOW_DAYS,
): ConversationMemoryHookResult {
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()

  const relevant = records.filter(r =>
    r.role === role &&
    r.capturedAt >= cutoff &&
    r.interpretedTopConcept !== null,
  )

  // Group by concept
  const conceptGroups = new Map<AcademyOSConcept, ConversationLearningRecord[]>()
  for (const record of relevant) {
    const concept = record.interpretedTopConcept!
    const existing = conceptGroups.get(concept) ?? []
    existing.push(record)
    conceptGroups.set(concept, existing)
  }

  // Build recurring concerns for concepts above threshold
  const recurringConcerns: RecurringConcern[] = []

  for (const concept of Array.from(conceptGroups.keys())) {
    const group = conceptGroups.get(concept)!
    if (group.length < RECURRENCE_THRESHOLD) continue

    const sorted = group.sort((a: ConversationLearningRecord, b: ConversationLearningRecord) => a.capturedAt.localeCompare(b.capturedAt))
    const isResolved = group.every((r: ConversationLearningRecord) => r.completedSuccessfully)
    const entityLink = tryExtractEntityLabel(group, concept)
    const exampleStatements = sorted
      .map((r: ConversationLearningRecord) => r.originalStatement)
      .slice(0, 3)

    const concernBase: Omit<RecurringConcern, 'memoryCallbackText'> = {
      concept,
      occurrenceCount: group.length,
      firstOccurredAt: sorted[0].capturedAt,
      lastOccurredAt: sorted[sorted.length - 1].capturedAt,
      isResolved,
      exampleStatements,
      entityLink,
    }

    recurringConcerns.push({
      ...concernBase,
      memoryCallbackText: buildMemoryCallbackText(concernBase),
    })
  }

  // Sort by occurrence count descending
  recurringConcerns.sort((a, b) => b.occurrenceCount - a.occurrenceCount)

  const unresolvedTopics = recurringConcerns.filter(c => !c.isResolved)
  const mostRepeatedConcept = recurringConcerns[0]?.concept ?? null
  const memoryCallbacks = recurringConcerns.map(c => c.memoryCallbackText)

  const contextSummary = recurringConcerns.length === 0
    ? 'No recurring concerns detected in recent conversations.'
    : `${recurringConcerns.length} recurring concern(s) detected. ${unresolvedTopics.length} unresolved.`

  return {
    recurringConcerns,
    hasRecurringConcerns: recurringConcerns.length > 0,
    mostRepeatedConcept,
    unresolvedTopics,
    memoryCallbacks,
    contextSummary,
  }
}

// ── Memory-aware context builder ──────────────────────────────────────────────

/**
 * Build a DONNA context string that references prior conversation patterns.
 * Designed to be injected into the context packet for LLM calls.
 */
export function buildMemoryAwareContext(
  hookResult: ConversationMemoryHookResult,
  currentInput: string,
): string {
  if (!hookResult.hasRecurringConcerns) return ''

  const parts: string[] = []

  // If the current input matches a recurring concern, surface it directly
  const currentLower = currentInput.toLowerCase()
  for (const concern of hookResult.recurringConcerns) {
    const conceptWord = concern.concept.replace(/_/g, ' ')
    if (currentLower.includes(conceptWord.split('_')[0])) {
      parts.push(concern.memoryCallbackText)
      break
    }
  }

  // Add unresolved topic count if relevant
  if (hookResult.unresolvedTopics.length > 0 && parts.length === 0) {
    const top = hookResult.unresolvedTopics[0]
    parts.push(top.memoryCallbackText)
  }

  return parts.join(' ')
}

// ── Unresolved topic summary ──────────────────────────────────────────────────

/**
 * Returns a formatted summary of unresolved recurring topics for DONNA to surface.
 */
export function buildUnresolvedTopicSummary(
  hookResult: ConversationMemoryHookResult,
): string | null {
  if (hookResult.unresolvedTopics.length === 0) return null

  const topicLines = hookResult.unresolvedTopics
    .slice(0, 3)
    .map(t => `- ${t.memoryCallbackText}`)
    .join('\n')

  return `Recurring topics not yet resolved:\n${topicLines}`
}
