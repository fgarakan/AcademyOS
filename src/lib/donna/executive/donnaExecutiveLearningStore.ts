// Mega Sprint 4231–4260 — Executive Learning Context Wiring V1
//
// The durable persistence adapter for Executive Learning: load/save against the
// `donna_executive_learning` table (migration 084). This is the production
// implementation of the `ExecutiveLearningStore` idea — the in-memory store from the
// previous sprint remains for tests. No second memory system: this is the durable
// home for Learning Ledger entries; donna_working_memory stays session-scoped.
//
// Server-side only (needs an authenticated Supabase client; RLS scopes every row to
// the academy). Cast-typed (`as any`) because the table is new and not yet in the
// generated database.types.ts — no edit to that protected file. Fail-open: a read
// error yields [], a write error yields 0; reasoning never breaks because learning
// could not load.

import type { LearningEntry } from '@/lib/donna/learning/learningEntryModel'
import type { ExecutiveLearningType } from './donnaExecutiveLearning'

const TABLE = 'donna_executive_learning'

// Row ⇄ LearningEntry mapping. Only the fields the durable table carries; the rest of
// the LearningEntry shape is reconstructed with safe defaults for retrieval/hygiene.
interface DurableRow {
  id: string
  academy_id: string
  learning_type: string
  topic_domain: string
  topic: string
  summary: string
  evidence: string | null
  concepts: string[] | null
  tags: string[] | null
  importance: number | null
  confidence: number | null
  status: string
  review_required: boolean
  high_impact: boolean
  approved_by: string | null
  approved_at: string | null
  source_type: string
  source_session_id: string | null
  expires_at: string | null
  created_at: string
}

function rowToEntry(r: DurableRow): LearningEntry {
  return {
    id: r.id,
    academyId: r.academy_id,
    createdAt: r.created_at,
    sourceType: (r.source_type as LearningEntry['sourceType']) ?? 'system_observation',
    sourceId: r.source_session_id ?? r.id,
    role: 'director',
    conversationId: r.source_session_id ?? null,
    topic: r.topic,
    topicDomain: r.topic_domain as LearningEntry['topicDomain'],
    concepts: (r.concepts ?? []) as LearningEntry['concepts'],
    summary: r.summary,
    evidence: r.evidence ?? r.summary,
    examplePhrases: [],
    confidence: r.confidence ?? 0.7,
    importance: r.importance ?? 0.5,
    frequency: 1,
    sourceReliability: 0.8,
    learningScore: 0,
    status: r.status as LearningEntry['status'],
    reviewRequired: r.review_required,
    approvedBy: r.approved_by,
    approvedAt: r.approved_at,
    promotionEligible: false,
    promotedAt: null,
    clusterId: null,
    isDuplicate: false,
    canonicalEntryId: null,
    tags: r.tags ?? [],
    academyDnaModelId: null,
    metadata: { high_impact: r.high_impact },
  }
}

function entryToRow(academyId: string, e: LearningEntry): Record<string, unknown> {
  const learningType = (e.tags[0] as ExecutiveLearningType) ?? 'operating_pattern'
  return {
    academy_id: academyId,
    learning_type: learningType,
    topic_domain: e.topicDomain,
    topic: e.topic,
    summary: e.summary,
    evidence: e.evidence,
    concepts: e.concepts,
    tags: e.tags,
    importance: e.importance,
    confidence: e.confidence,
    status: e.status,
    review_required: e.reviewRequired,
    high_impact: Boolean((e.metadata as Record<string, unknown>)?.highImpact),
    approved_by: e.approvedBy,
    approved_at: e.approvedAt,
    source_type: e.sourceType,
    source_session_id: e.sourceId,
    expires_at: null,
  }
}

/**
 * Load the academy's durable learning (RLS scopes to the caller's academy). Only
 * usable + pending learning is returned — archived/rejected stay out of reasoning.
 * Fail-open: any error → [].
 */
export async function loadDurableLearning(
  supabase: unknown,
  academyId: string,
  limit = 200,
): Promise<LearningEntry[]> {
  try {
    const db = supabase as any
    const { data, error } = await db
      .from(TABLE)
      .select('*')
      .eq('academy_id', academyId)
      .in('status', ['approved', 'promoted', 'reviewing', 'captured'])
      .order('importance', { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return (data as DurableRow[]).map(rowToEntry)
  } catch {
    return []
  }
}

/**
 * Persist a batch of durable learning entries (the hygiene `toStore` set). Director
 * write only (RLS). Fail-open: returns the number of rows it believes it inserted, 0
 * on error — capture failure never interrupts the conversation.
 */
export async function saveDurableLearning(
  supabase: unknown,
  academyId: string,
  entries: LearningEntry[],
): Promise<number> {
  if (entries.length === 0) return 0
  try {
    const db = supabase as any
    const rows = entries.map((e) => entryToRow(academyId, e))
    const { error } = await db.from(TABLE).insert(rows)
    if (error) return 0
    return rows.length
  } catch {
    return 0
  }
}
