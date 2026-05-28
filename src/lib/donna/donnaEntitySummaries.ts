// Sprint 914.12 — DONNA Entity Summary Spine V1
// Compact durable summaries for fast DONNA context retrieval.
// Summaries are deterministic — no AI generation in V1.
// Retrieval failure never breaks DONNA.

import type { DB } from '@/lib/types/db'

// ── Types ──────────────────────────────────────────────────────────────────────

export type EntitySummaryType = 'academy' | 'player' | 'group' | 'curriculum_level' | 'template' | 'session'
export type SummaryKind = 'operating' | 'health' | 'curriculum' | 'progress' | 'risk'

export interface UpsertEntitySummaryInput {
  academyId: string
  entityType: EntitySummaryType
  entityId: string
  summaryKind?: SummaryKind
  summaryText?: string | null
  summaryJson?: Record<string, unknown>
  confidence?: 'high' | 'medium' | 'low' | 'partial' | null
  visibilityScope?: 'director' | 'head_coach' | 'staff' | 'system'
  sourceEventIds?: string[]
}

export interface DonnaEntitySummary {
  id: string
  academyId: string
  entityType: string
  entityId: string
  summaryKind: string
  summaryText: string | null
  summaryJson: Record<string, unknown>
  confidence: string | null
  visibilityScope: string
  lastRefreshedAt: string
  updatedAt: string
}

// ── upsertEntitySummary ────────────────────────────────────────────────────────

export async function upsertEntitySummary(
  db: DB,
  input: UpsertEntitySummaryInput,
): Promise<{ ok: boolean; summaryId?: string; error?: string }> {
  try {
    const now = new Date().toISOString()
    const { data, error } = await (db as any)
      .from('donna_entity_summaries')
      .upsert(
        {
          academy_id:       input.academyId,
          entity_type:      input.entityType,
          entity_id:        input.entityId,
          summary_kind:     input.summaryKind ?? 'operating',
          summary_text:     input.summaryText ?? null,
          summary_json:     input.summaryJson ?? {},
          confidence:       input.confidence ?? null,
          visibility_scope: input.visibilityScope ?? 'director',
          source_event_ids: input.sourceEventIds ?? null,
          last_refreshed_at: now,
          updated_at:       now,
        },
        { onConflict: 'academy_id,entity_type,entity_id,summary_kind' },
      )
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }
    return { ok: true, summaryId: data?.id as string | undefined }
  } catch {
    return { ok: false, error: 'Unexpected error upserting entity summary.' }
  }
}

// ── getEntitySummary ───────────────────────────────────────────────────────────

export async function getEntitySummary(
  db: DB,
  options: {
    academyId: string
    entityType: EntitySummaryType
    entityId: string
    summaryKind?: SummaryKind
  },
): Promise<{ ok: boolean; data?: DonnaEntitySummary | null; error?: string }> {
  try {
    let query = (db as any)
      .from('donna_entity_summaries')
      .select('*')
      .eq('academy_id', options.academyId)
      .eq('entity_type', options.entityType)
      .eq('entity_id', options.entityId)

    if (options.summaryKind) {
      query = query.eq('summary_kind', options.summaryKind)
    }

    const { data, error } = await query.maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!data) return { ok: true, data: null }
    return { ok: true, data: mapSummary(data) }
  } catch {
    return { ok: false, error: 'Unexpected error reading entity summary.' }
  }
}

// ── getRelevantEntitySummaries ────────────────────────────────────────────────

export async function getRelevantEntitySummaries(
  db: DB,
  options: {
    academyId: string
    entityType?: EntitySummaryType | null
    entityIds?: string[]
    summaryKind?: SummaryKind | null
    limit?: number
  },
): Promise<{ ok: boolean; data?: DonnaEntitySummary[]; error?: string }> {
  try {
    let query = (db as any)
      .from('donna_entity_summaries')
      .select('*')
      .eq('academy_id', options.academyId)
      .order('last_refreshed_at', { ascending: false })
      .limit(options.limit ?? 10)

    if (options.entityType) query = query.eq('entity_type', options.entityType)
    if (options.summaryKind) query = query.eq('summary_kind', options.summaryKind)
    if (options.entityIds?.length) query = query.in('entity_id', options.entityIds)

    const { data, error } = await query
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: ((data as any[]) ?? []).map(mapSummary) }
  } catch {
    return { ok: false, error: 'Unexpected error reading entity summaries.' }
  }
}

// ── Row mapper ────────────────────────────────────────────────────────────────

function mapSummary(row: any): DonnaEntitySummary {
  return {
    id:               row.id,
    academyId:        row.academy_id,
    entityType:       row.entity_type,
    entityId:         row.entity_id,
    summaryKind:      row.summary_kind,
    summaryText:      row.summary_text ?? null,
    summaryJson:      (row.summary_json as Record<string, unknown>) ?? {},
    confidence:       row.confidence ?? null,
    visibilityScope:  row.visibility_scope,
    lastRefreshedAt:  row.last_refreshed_at,
    updatedAt:        row.updated_at,
  }
}
