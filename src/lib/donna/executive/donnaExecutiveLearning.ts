// Mega Sprint 4201–4230 — DONNA Durable Executive Learning V1
//
// The bridge that makes a completed Executive operating session make DONNA smarter.
// It summarises the session, extracts durable learning, gates high-impact learning
// for Director approval, runs it through the EXISTING Learning Ledger hygiene
// (dedupe + contradiction), and lets later turns reuse compressed memory instead of
// re-sending a long transcript.
//
// Reuses the shipped learning layer — it does NOT duplicate it:
//   • learningEntryModel (createLearningEntry, LearningEntry, topic domains)
//   • donnaLearningDeduplicator (deduplicateBatch)
//   • donnaLearningContradictionDetector (detectContradictions)
//
// No new routing, no new OpenAI pathway, no migration. Pure TypeScript over an
// injectable persistence port (in-memory here; a `donna_working_memory` adapter is
// documented for production — that table already exists, so no schema change).

import type { ExecutiveSession } from './donnaExecutiveSession'
import type { DialogueState } from './donnaExecutiveDialogue'
import type { WorkflowState } from './donnaExecutiveActionLoop'
import {
  createLearningEntry,
  type LearningEntry,
  type LearningTopicDomain,
} from '@/lib/donna/learning/learningEntryModel'
import { deduplicateBatch, type DedupAction } from '@/lib/donna/learning/donnaLearningDeduplicator'
import {
  detectContradictions,
  type ContradictionPair,
} from '@/lib/donna/learning/donnaLearningContradictionDetector'
import type { AcademyOSConcept } from '@/lib/donna/conversation/donnaMeaningExtractor'
import type { InterpreterRole } from '@/lib/donna/conversation/donnaIntentInterpreter'

// ── Objective 1 — Session summary ───────────────────────────────────────────────

export interface ExecutiveSessionSummary {
  /** A session with no objectives, decisions, or completed actions is not worth learning from. */
  meaningful: boolean
  objectivesWorkedOn: string[]
  decisionsMade: string[]
  actionsCompleted: string[]
  pausedWork: string[]
  unresolvedQuestions: string[]
  directorPreferences: string[]
  academyPatterns: string[]
  followUpItems: string[]
  turnCount: number
}

function uniq(xs: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const x of xs) {
    const v = (x ?? '').trim()
    if (!v) continue
    const k = v.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(v)
  }
  return out
}

/**
 * Compress a completed Executive operating session into a compact, structured
 * summary. Pure: derived entirely from the session/dialogue/workflow state the
 * executive layer already produced — no transcript, no model call.
 */
export function summarizeOperatingSession(input: {
  session: ExecutiveSession
  dialogue?: DialogueState | null
  workflow?: WorkflowState | null
  /** Optional director-preference phrases observed in the conversation. */
  preferenceSignals?: string[]
}): ExecutiveSessionSummary {
  const { session, dialogue, workflow } = input

  const objectivesWorkedOn = uniq(session.todaysObjectives.map((o) => o.label))
  const decisionsMade = uniq([
    ...(dialogue?.decisionsMade ?? []),
    ...session.todaysObjectives.flatMap((o) => o.decisions),
  ])
  const actionsCompleted = uniq([
    ...session.completedObjectives.map((o) => o.label),
    ...(workflow?.completedSteps ?? []),
  ])
  const pausedWork = uniq(session.pausedObjectives.map((o) => o.label))
  const unresolvedQuestions = uniq([
    ...(dialogue?.openDecisions ?? []),
    ...(workflow?.blocker ? [workflow.blocker] : []),
  ])
  const directorPreferences = uniq([
    ...(input.preferenceSignals ?? []),
    ...(dialogue?.tradeoffs ?? []),
  ])
  // Academy patterns = the operating areas the session actually touched (the agenda
  // and timeline are the recurring footprint of how this academy works).
  const academyPatterns = uniq([
    ...session.unfinishedObjectives.map((o) => o.area),
    ...session.completedObjectives.map((o) => o.area),
  ])
  const followUpItems = uniq([
    session.nextRecommendedAction,
    ...session.pausedObjectives.map((o) => o.lastProgress),
  ])

  const meaningful =
    objectivesWorkedOn.length > 0 || decisionsMade.length > 0 || actionsCompleted.length > 0

  return {
    meaningful,
    objectivesWorkedOn,
    decisionsMade,
    actionsCompleted,
    pausedWork,
    unresolvedQuestions,
    directorPreferences,
    academyPatterns,
    followUpItems,
    turnCount: dialogue?.turnCount ?? session.timeline.length,
  }
}

// ── Objective 2 — Durable learning taxonomy + extraction ────────────────────────

export type ExecutiveLearningType =
  | 'academy_preference'
  | 'director_preference'
  | 'recurring_decision'
  | 'curriculum_choice'
  | 'workflow_tendency'
  | 'coaching_philosophy'
  | 'operating_pattern'

export interface ExecutiveLearningCandidate {
  type: ExecutiveLearningType
  topic: string
  summary: string
  evidence: string
  importance: number
  concepts: AcademyOSConcept[]
  domain: LearningTopicDomain
  /** High-impact learning requires Director approval (Objective 3). */
  highImpact: boolean
  /** Noise is dropped — never stored (Objective 2/5). */
  noise: boolean
}

// Casual, ephemeral, or content-free phrases never become durable learning.
const NOISE = /^(ok(ay)?|sure|thanks?|thank you|got it|cool|nice|great|continue|next|yes|no|hi|hello|good (morning|afternoon)|let me (check|see|look)|hold on|one sec|never ?mind)\b/i

function isNoise(text: string): boolean {
  const t = text.trim()
  if (t.length < 8) return true
  if (NOISE.test(t)) return true
  // A bare 2–3 word fragment with no operating verb is not durable.
  return t.split(/\s+/).length < 3
}

const HIGH_IMPACT_CONTENT =
  /\b(philosoph|placement|readiness|expectation|communication style|default|curriculum|develop(ment)? (model|spine)|how we (coach|develop)|always|never|standard|policy)\b/i

/**
 * Classify a free phrase into a durable-learning type (or noise). Heuristic and
 * pure — the structured summary fields already carry most of the signal, so this
 * mainly assigns a type, a topic domain, contradiction concepts, and impact.
 */
export function classifyLearningText(text: string): Omit<ExecutiveLearningCandidate, 'topic' | 'summary' | 'evidence'> {
  const t = text.toLowerCase()
  const noise = isNoise(text)

  let type: ExecutiveLearningType = 'operating_pattern'
  let domain: LearningTopicDomain = 'academy_operations'
  let concepts: AcademyOSConcept[] = []

  if (/\b(curriculum|level|spine|progression|orange|red|green|yellow)\b/.test(t)) {
    type = 'curriculum_choice'; domain = 'curriculum'; concepts = ['curriculum_issue']
  } else if (/\b(coach|coaching|philosoph|develop(ment)? model|how we (coach|develop)|on-court)\b/.test(t)) {
    type = 'coaching_philosophy'; domain = 'coaching_philosophy'; concepts = ['coach_execution_issue']
  } else if (/\b(placement|readiness|advance|move up|level up|player development)\b/.test(t)) {
    type = 'academy_preference'; domain = 'player_development'; concepts = ['readiness_issue']
  } else if (/\b(prefer|i like|i want|always|never|tone|communication|message|parent-facing|style)\b/.test(t)) {
    type = 'director_preference'; domain = 'academy_operations'; concepts = ['communication_issue']
  } else if (/\b(approve|review|publish|assign|finalize|decided|chose|standard|policy)\b/.test(t)) {
    type = 'recurring_decision'; domain = 'academy_operations'; concepts = []
  } else if (/\b(workflow|step|order|first|then|sequence|process|each (time|week))\b/.test(t)) {
    type = 'workflow_tendency'; domain = 'session_execution'; concepts = []
  }

  const highImpact =
    !noise &&
    (type === 'coaching_philosophy' ||
      type === 'curriculum_choice' ||
      type === 'director_preference' ||
      type === 'academy_preference') &&
    HIGH_IMPACT_CONTENT.test(t)

  // Importance: high-impact > recurring/curriculum > operational.
  const importance = noise ? 0 : highImpact ? 0.85 : type === 'recurring_decision' ? 0.6 : 0.45

  return { type, domain, concepts, highImpact, noise, importance }
}

/**
 * Extract durable learning candidates from a session summary. Noise is filtered;
 * only content that reflects how the academy/director actually operates survives.
 */
export function extractDurableLearning(summary: ExecutiveSessionSummary): ExecutiveLearningCandidate[] {
  if (!summary.meaningful) return []

  const sources: Array<{ text: string; topic: string }> = [
    ...summary.decisionsMade.map((d) => ({ text: d, topic: 'Recurring decision' })),
    ...summary.directorPreferences.map((p) => ({ text: p, topic: 'Director preference' })),
    ...summary.academyPatterns.map((p) => ({ text: p, topic: 'Academy pattern' })),
    ...summary.objectivesWorkedOn.map((o) => ({ text: o, topic: 'Objective' })),
  ]

  const out: ExecutiveLearningCandidate[] = []
  for (const s of sources) {
    const c = classifyLearningText(s.text)
    if (c.noise) continue
    out.push({
      ...c,
      topic: `${s.topic}: ${s.text}`.slice(0, 80),
      summary: s.text,
      evidence: s.text,
    })
  }
  return out
}

// ── Objective 3 — Learning approval ─────────────────────────────────────────────

/** High-impact learning (philosophy, curriculum defaults, placement, comms style) needs the Director. */
export function requiresLearningApproval(candidate: ExecutiveLearningCandidate): boolean {
  return candidate.highImpact
}

// ── Bridge to the Learning Ledger entry model ───────────────────────────────────

export interface ExecutiveLearningContext {
  academyId: string
  role: InterpreterRole
  sessionId: string
}

/**
 * Turn candidates into canonical LearningEntry rows. Low-risk operational memory is
 * auto-approved by the system (immediately usable). High-impact learning is parked in
 * `reviewing` for the Director — never auto-stored as truth.
 */
export function toLearningEntries(
  candidates: ExecutiveLearningCandidate[],
  ctx: ExecutiveLearningContext,
): LearningEntry[] {
  return candidates
    .filter((c) => !c.noise)
    .map((c) =>
      createLearningEntry({
        academyId: ctx.academyId,
        sourceType: 'system_observation',
        sourceId: ctx.sessionId,
        role: ctx.role,
        conversationId: ctx.sessionId,
        topic: c.topic,
        topicDomain: c.domain,
        concepts: c.concepts,
        summary: c.summary,
        evidence: c.evidence,
        examplePhrases: [c.evidence].slice(0, 3),
        confidence: 0.7,
        importance: c.importance,
        frequency: 1,
        sourceReliability: 0.8,
        status: c.highImpact ? 'reviewing' : 'approved',
        reviewRequired: c.highImpact,
        approvedBy: c.highImpact ? null : 'system',
        approvedAt: c.highImpact ? null : new Date().toISOString(),
        tags: [c.type],
        academyDnaModelId: null,
        metadata: { executiveLearningType: c.type, highImpact: c.highImpact },
      }),
    )
}

// ── Objective 5 — Learning hygiene (dedupe · expire · contradiction) ────────────

/** Default time-to-live per learning type. High-impact academy truth does not expire. */
export const LEARNING_TTL_DAYS: Record<ExecutiveLearningType, number> = {
  operating_pattern: 60,
  workflow_tendency: 90,
  recurring_decision: 120,
  academy_preference: 0, // 0 = never expires
  director_preference: 0,
  curriculum_choice: 0,
  coaching_philosophy: 0,
}

const DAY_MS = 24 * 60 * 60 * 1000

function entryType(e: LearningEntry): ExecutiveLearningType {
  return (e.tags[0] as ExecutiveLearningType) ?? 'operating_pattern'
}

/** Entries older than their type TTL are stale (Objective 5). TTL 0 = never. */
export function expireStale(entries: LearningEntry[], now: number): { active: LearningEntry[]; expired: string[] } {
  const active: LearningEntry[] = []
  const expired: string[] = []
  for (const e of entries) {
    const ttl = LEARNING_TTL_DAYS[entryType(e)] ?? 0
    const ageDays = (now - new Date(e.createdAt).getTime()) / DAY_MS
    if (ttl > 0 && ageDays > ttl) expired.push(e.id)
    else active.push(e)
  }
  return { active, expired }
}

export interface LearningHygieneResult {
  toStore: LearningEntry[]
  duplicates: DedupAction[]
  contradictions: ContradictionPair[]
  expired: string[]
  /** A contradiction or a high-impact capture means the Director must look. */
  requiresReview: boolean
}

/**
 * Clean a batch of new learning against what is already known:
 *   1. expire stale existing learning,
 *   2. drop incoming duplicates (of each other or of existing),
 *   3. flag contradictions with confirmed (approved) truth — and never let a casual
 *      auto-entry silently overwrite it: a contradicting auto-entry is downgraded to
 *      `reviewing` so the Director decides.
 */
export function applyLearningHygiene(input: {
  incoming: LearningEntry[]
  existing: LearningEntry[]
  now: number
}): LearningHygieneResult {
  const { active: existingActive, expired } = expireStale(input.existing, input.now)
  const confirmed = existingActive.filter((e) => e.status === 'approved' || e.status === 'promoted')

  // 1) Contradiction-vs-truth FIRST. An incoming entry that opposes confirmed truth
  // is a contradiction, not a duplicate — it must never be silently dropped by the
  // text deduplicator (near-identical wording + opposite sentiment looks "similar").
  const contradictions: ContradictionPair[] = []
  const contradictingIds = new Set<string>()
  for (const entry of input.incoming) {
    const report = detectContradictions(entry, confirmed)
    if (report.totalFound > 0) {
      contradictions.push(...report.pairs)
      contradictingIds.add(entry.id)
    }
  }

  // 2) Dedup only the NON-contradicting incoming against the active corpus.
  const safeIncoming = input.incoming.filter((e) => !contradictingIds.has(e.id))
  const dedupActions = deduplicateBatch([...existingActive, ...safeIncoming])
  const incomingIds = new Set(input.incoming.map((e) => e.id))
  const duplicates = dedupActions.filter((a) => incomingIds.has(a.duplicateId))
  const dupIds = new Set(duplicates.map((a) => a.duplicateId))

  // 3) Assemble. Contradicting auto-entries are downgraded to `reviewing` so a casual
  // capture can never overwrite confirmed academy truth; duplicates are dropped.
  const toStore: LearningEntry[] = []
  for (const entry of input.incoming) {
    if (dupIds.has(entry.id)) continue
    if (contradictingIds.has(entry.id) && entry.status === 'approved' && entry.approvedBy === 'system') {
      toStore.push({ ...entry, status: 'reviewing', reviewRequired: true, approvedBy: null, approvedAt: null })
      continue
    }
    toStore.push(entry)
  }

  const requiresReview = contradictions.length > 0 || toStore.some((e) => e.reviewRequired)
  return { toStore, duplicates, contradictions, expired, requiresReview }
}

// ── Objective 4 — Context reuse + token efficiency ──────────────────────────────

function approxTokens(chars: number): number {
  return Math.ceil(chars / 4)
}

function relevanceScore(request: string, e: LearningEntry): number {
  const req = request.toLowerCase()
  const words = Array.from(new Set(req.split(/\W+/).filter((w) => w.length > 3)))
  const hay = `${e.topic} ${e.summary} ${e.tags.join(' ')}`.toLowerCase()
  let overlap = 0
  for (const w of words) if (hay.includes(w)) overlap += 1
  return overlap * 1.5 + e.importance
}

/**
 * Retrieve the durable learning relevant to a new request (Objective 4). Only
 * usable learning is considered (approved / promoted / system-captured). Ranked by
 * keyword overlap + importance, capped so the context stays compressed.
 */
export function retrieveRelevantLearning(input: {
  request: string
  store: LearningEntry[]
  max?: number
}): LearningEntry[] {
  const usable = input.store.filter(
    (e) => e.status === 'approved' || e.status === 'promoted',
  )
  return usable
    .map((e) => ({ e, s: relevanceScore(input.request, e) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, input.max ?? 6)
    .map((x) => x.e)
}

/**
 * Map durable learning into the Executive Context Packet's existing `relevant_memory`
 * slot (MemoryRecord = { content, tags }). Tags carry the learning type, domain, and
 * salient keywords so the resolver's relevance pass surfaces only what matches the
 * request — reusing the shipped memory source, not a new packet field.
 */
export function learningToMemoryRecords(entries: LearningEntry[]): Array<{ content: string; tags: string[] }> {
  return entries.map((e) => {
    const keywords = Array.from(
      new Set(`${e.topic} ${e.summary}`.toLowerCase().split(/\W+/).filter((w) => w.length > 3)),
    )
    return {
      content: e.summary,
      tags: Array.from(new Set([(e.tags[0] ?? 'operating_pattern'), e.topicDomain, ...keywords])),
    }
  })
}

/** A compact, spoken-style learning context — what DONNA reuses instead of a transcript. */
export function buildCompressedLearningContext(entries: LearningEntry[]): string {
  if (entries.length === 0) return ''
  return ['What I already know about how you operate:', ...entries.map((e) => `- ${e.summary}`)].join('\n')
}

export interface TokenSavings {
  transcriptTokens: number
  compressedTokens: number
  tokensSaved: number
  pctSaved: number
}

/**
 * Estimate the token saving from reusing compressed learning instead of replaying a
 * full transcript (Objective 4). Never negative — when compression does not help,
 * savings are zero.
 */
export function estimateTokenSavings(input: {
  retrieved: LearningEntry[]
  fullTranscriptChars: number
}): TokenSavings {
  const transcriptTokens = approxTokens(input.fullTranscriptChars)
  const compressedTokens = approxTokens(buildCompressedLearningContext(input.retrieved).length)
  const tokensSaved = Math.max(0, transcriptTokens - compressedTokens)
  const pctSaved = transcriptTokens > 0 ? Math.round((tokensSaved / transcriptTokens) * 100) : 0
  return { transcriptTokens, compressedTokens, tokensSaved, pctSaved }
}

// ── Objective 6 — Developer diagnostics ─────────────────────────────────────────

export interface ExecutiveLearningDiagnostics {
  sessionMeaningful: boolean
  learningCaptured: number
  learningSkipped: number
  approvalRequired: number
  memoryReused: number
  tokenSavingsEst: number
  contradictionDetected: number
}

export function formatExecutiveLearningDiagnostics(d: ExecutiveLearningDiagnostics): string {
  return (
    `[donna.learning] meaningful=${d.sessionMeaningful ? 'YES' : 'NO'} ` +
    `captured=${d.learningCaptured} skipped=${d.learningSkipped} ` +
    `approvalRequired=${d.approvalRequired} reused=${d.memoryReused} ` +
    `tokensSaved=${d.tokenSavingsEst} contradictions=${d.contradictionDetected}`
  )
}

// ── Persistence port (no migration; documented adapter) ─────────────────────────
//
// Production wiring (not in this sprint): a `DonnaWorkingMemoryLearningStore` can
// implement this against the EXISTING `donna_working_memory` table (already RLS-
// protected) — load by academyId, save the hygiene `toStore` batch. No schema
// change. Kept as a port so the learning logic is provable without a database.

export interface ExecutiveLearningStore {
  load(academyId: string): LearningEntry[]
  save(academyId: string, entries: LearningEntry[]): void
}

export class InMemoryExecutiveLearningStore implements ExecutiveLearningStore {
  private byAcademy = new Map<string, LearningEntry[]>()
  load(academyId: string): LearningEntry[] {
    return this.byAcademy.get(academyId) ?? []
  }
  save(academyId: string, entries: LearningEntry[]): void {
    const prev = this.byAcademy.get(academyId) ?? []
    this.byAcademy.set(academyId, [...prev, ...entries])
  }
}

// ── End-to-end: learn from one completed operating session ──────────────────────

export interface LearnFromSessionResult {
  summary: ExecutiveSessionSummary
  candidates: ExecutiveLearningCandidate[]
  hygiene: LearningHygieneResult
  diagnostics: ExecutiveLearningDiagnostics
}

/**
 * The full Objective 1→3+5+6 pipeline for a completed session. Pure — the caller
 * decides whether to persist `hygiene.toStore` via an ExecutiveLearningStore.
 */
export function learnFromOperatingSession(input: {
  session: ExecutiveSession
  dialogue?: DialogueState | null
  workflow?: WorkflowState | null
  preferenceSignals?: string[]
  ctx: ExecutiveLearningContext
  existing: LearningEntry[]
  now: number
}): LearnFromSessionResult {
  const summary = summarizeOperatingSession(input)
  const candidates = extractDurableLearning(summary)
  const entries = toLearningEntries(candidates, input.ctx)
  const hygiene = applyLearningHygiene({ incoming: entries, existing: input.existing, now: input.now })

  const diagnostics: ExecutiveLearningDiagnostics = {
    sessionMeaningful: summary.meaningful,
    learningCaptured: hygiene.toStore.length,
    learningSkipped: candidates.filter((c) => c.noise).length + hygiene.duplicates.length,
    approvalRequired: hygiene.toStore.filter((e) => e.reviewRequired).length,
    memoryReused: 0,
    tokenSavingsEst: 0,
    contradictionDetected: hygiene.contradictions.length,
  }

  return { summary, candidates, hygiene, diagnostics }
}
