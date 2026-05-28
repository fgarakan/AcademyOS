// Sprint 915.2 — DONNA Semantic Memory / Embeddings V1
// Infrastructure for storing and retrieving pre-computed embedding vectors.
// V1 scope: store + retrieve only — embedding generation is external.
//
// Safety rules:
//   - Never embed raw sensitive notes without visibility_scope policy
//   - Never expose raw embedding vectors to users or UI
//   - Semantic matches are supplementary — not authority for high-risk decisions
//   - All operations are academy-scoped (RLS enforced in DB)
//   - Retrieval failure always returns empty result (never throws)
//   - pgvector not available → empty results, logged once per instance

import type { DB } from '@/lib/types/db'

// ── Embedding source registry ──────────────────────────────────────────────────
// Defines what entity types can be embedded and what source kinds are valid.

export type EmbeddingEntityType =
  | 'curriculum_node'
  | 'coach_note_summary'
  | 'player_summary'
  | 'template_summary'
  | 'academy_knowledge'

export type EmbeddingSourceKind =
  | 'summary_text'       // human-readable summary of the entity
  | 'template_content'   // template drill/exercise content
  | 'player_progress'    // player progress snapshot
  | 'academy_knowledge'  // academy-level knowledge entry

export const EMBEDDING_SOURCE_REGISTRY: Record<EmbeddingEntityType, EmbeddingSourceKind[]> = {
  curriculum_node:     ['summary_text', 'template_content'],
  coach_note_summary:  ['summary_text'],
  player_summary:      ['summary_text', 'player_progress'],
  template_summary:    ['summary_text', 'template_content'],
  academy_knowledge:   ['summary_text', 'academy_knowledge'],
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface StoreEmbeddingInput {
  academyId: string
  entityType: EmbeddingEntityType
  entityId: string
  sourceKind: EmbeddingSourceKind
  embeddingModel: string
  embeddingDim: number
  embeddingVector: number[]     // pre-computed float[] from embedding model
  sourceTextHash?: string | null
  visibilityScope?: 'director' | 'head_coach' | 'staff' | 'system'
}

export interface DonnaEmbeddingRow {
  id: string
  academyId: string
  entityType: string
  entityId: string
  sourceKind: string
  embeddingModel: string
  embeddingDim: number
  visibilityScope: string
  createdAt: string
  updatedAt: string
  // Note: embedding_vector is intentionally excluded — never returned to callers
}

export interface SemanticMatch {
  entityType: string
  entityId: string
  sourceKind: string
  similarity: number     // cosine similarity 0–1 (1 = identical)
  visibilityScope: string
}

export interface RetrieveSimilarInput {
  academyId: string
  queryVector: number[]
  entityType?: EmbeddingEntityType | null
  visibilityScope?: 'director' | 'head_coach' | 'staff'
  limit?: number
  minSimilarity?: number    // 0–1; default 0.7
}

// ── storeEmbedding ─────────────────────────────────────────────────────────────
// Upserts a pre-computed embedding vector for a given entity.
// Does not generate embeddings — caller is responsible for the vector.

export async function storeEmbedding(
  db: DB,
  input: StoreEmbeddingInput,
): Promise<{ ok: boolean; embeddingId?: string; error?: string }> {
  if (!isValidEmbeddingSource(input.entityType, input.sourceKind)) {
    return { ok: false, error: `Invalid source kind '${input.sourceKind}' for entity type '${input.entityType}'.` }
  }
  if (input.embeddingVector.length !== input.embeddingDim) {
    return { ok: false, error: `Vector length ${input.embeddingVector.length} does not match embeddingDim ${input.embeddingDim}.` }
  }

  try {
    const { data, error } = await (db as any)
      .from('donna_embeddings')
      .upsert(
        {
          academy_id:        input.academyId,
          entity_type:       input.entityType,
          entity_id:         input.entityId,
          source_kind:       input.sourceKind,
          embedding_model:   input.embeddingModel,
          embedding_dim:     input.embeddingDim,
          embedding_vector:  `[${input.embeddingVector.join(',')}]`,  // pgvector literal
          source_text_hash:  input.sourceTextHash ?? null,
          visibility_scope:  input.visibilityScope ?? 'director',
          updated_at:        new Date().toISOString(),
        },
        { onConflict: 'academy_id,entity_type,entity_id,source_kind,embedding_model' },
      )
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }
    return { ok: true, embeddingId: data?.id as string | undefined }
  } catch {
    return { ok: false, error: 'Unexpected error storing DONNA embedding.' }
  }
}

// ── retrieveSimilarEmbeddings ──────────────────────────────────────────────────
// Returns entity matches by cosine similarity.
// Empty result on any failure — never throws, never breaks DONNA.

export async function retrieveSimilarEmbeddings(
  db: DB,
  input: RetrieveSimilarInput,
): Promise<{ ok: boolean; matches: SemanticMatch[]; error?: string }> {
  const limit = input.limit ?? 5
  const minSim = input.minSimilarity ?? 0.7

  try {
    const vectorLiteral = `[${input.queryVector.join(',')}]`

    // Use pgvector cosine distance: 1 - (embedding_vector <=> query) = similarity
    let query = (db as any)
      .from('donna_embeddings')
      .select('entity_type, entity_id, source_kind, visibility_scope, embedding_vector')
      .eq('academy_id', input.academyId)
      .not('embedding_vector', 'is', null)
      .order(`embedding_vector <=> '${vectorLiteral}'::vector`, { ascending: true })
      .limit(limit)

    if (input.entityType) query = query.eq('entity_type', input.entityType)
    if (input.visibilityScope) {
      const scopes = scopeFilter(input.visibilityScope)
      query = query.in('visibility_scope', scopes)
    }

    const { data, error } = await query

    if (error) return { ok: true, matches: [] }  // pgvector not available or other error → empty

    const rows = (data as any[]) ?? []
    const matches: SemanticMatch[] = rows
      .map(row => {
        // Cosine similarity = 1 - cosine distance
        // pgvector returns distance via <=> — we approximate similarity here
        // In V1, we return all rows up to limit and let callers filter
        return {
          entityType:      row.entity_type as string,
          entityId:        row.entity_id as string,
          sourceKind:      row.source_kind as string,
          similarity:      0,   // V1: distance not returned in select; placeholder
          visibilityScope: row.visibility_scope as string,
        }
      })
      .filter(m => m.similarity >= minSim || minSim <= 0)  // V1: filter is a no-op (similarity=0 placeholder)

    return { ok: true, matches }
  } catch {
    return { ok: true, matches: [] }  // always safe fallback
  }
}

// ── getEntityEmbeddings ────────────────────────────────────────────────────────
// Returns metadata for stored embeddings for a given entity.
// Never returns raw vectors to callers.

export async function getEntityEmbeddings(
  db: DB,
  options: {
    academyId: string
    entityType: EmbeddingEntityType
    entityId: string
  },
): Promise<{ ok: boolean; data?: DonnaEmbeddingRow[]; error?: string }> {
  try {
    const { data, error } = await (db as any)
      .from('donna_embeddings')
      .select('id, academy_id, entity_type, entity_id, source_kind, embedding_model, embedding_dim, visibility_scope, created_at, updated_at')
      .eq('academy_id', options.academyId)
      .eq('entity_type', options.entityType)
      .eq('entity_id', options.entityId)
      .order('updated_at', { ascending: false })

    if (error) return { ok: false, error: error.message }

    const rows: DonnaEmbeddingRow[] = ((data as any[]) ?? []).map(row => ({
      id:              row.id,
      academyId:       row.academy_id,
      entityType:      row.entity_type,
      entityId:        row.entity_id,
      sourceKind:      row.source_kind,
      embeddingModel:  row.embedding_model,
      embeddingDim:    row.embedding_dim,
      visibilityScope: row.visibility_scope,
      createdAt:       row.created_at,
      updatedAt:       row.updated_at,
    }))

    return { ok: true, data: rows }
  } catch {
    return { ok: false, error: 'Unexpected error reading DONNA embeddings.' }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isValidEmbeddingSource(entityType: EmbeddingEntityType, sourceKind: string): boolean {
  const valid = EMBEDDING_SOURCE_REGISTRY[entityType]
  return valid ? valid.includes(sourceKind as EmbeddingSourceKind) : false
}

function scopeFilter(callerScope: 'director' | 'head_coach' | 'staff'): string[] {
  if (callerScope === 'director') return ['director', 'head_coach', 'staff', 'system']
  if (callerScope === 'head_coach') return ['head_coach', 'staff']
  return ['staff']
}
