# DONNA Semantic Memory / Embeddings
**Sprint:** 915.2 | **Date:** 2026-05-28

---

## Purpose

Provide a first semantic memory foundation — infrastructure to store and retrieve
pre-computed embedding vectors. V1 is storage + retrieval only. Embedding generation
is external to the DB layer.

---

## Components

### Migration: `074_donna_embeddings.sql`
- `CREATE EXTENSION IF NOT EXISTS vector` (pgvector, idempotent)
- `donna_embeddings` table — stores pre-computed vectors with metadata
- RLS: academy-scoped via `auth_academy_id()`, `auth_is_staff()`, `auth_is_director_or_head()`
- UNIQUE constraint: `(academy_id, entity_type, entity_id, source_kind, embedding_model)` — upsert-safe

### TypeScript: `src/lib/donna/donnaSemanticMemory.ts`
- `EMBEDDING_SOURCE_REGISTRY` — defines valid entity+source combinations
- `storeEmbedding()` — upsert pre-computed vector; validates source kind and dimension
- `retrieveSimilarEmbeddings()` — cosine distance search via pgvector `<=>` operator
- `getEntityEmbeddings()` — returns embedding metadata (never returns raw vectors)

---

## Entity Types

| Entity Type | Source Kinds |
|---|---|
| `curriculum_node` | `summary_text`, `template_content` |
| `coach_note_summary` | `summary_text` |
| `player_summary` | `summary_text`, `player_progress` |
| `template_summary` | `summary_text`, `template_content` |
| `academy_knowledge` | `summary_text`, `academy_knowledge` |

---

## Embedding Dimensions

V1 table uses `vector(1536)` — compatible with OpenAI ada-002, Voyage-3-large.
Actual dimension used by embedding model must match `embedding_dim` field.
Stored alongside `embedding_model` name for provenance.

---

## Safety Boundaries

| Rule | Status |
|---|---|
| Raw vectors never returned to callers or UI | ✅ `getEntityEmbeddings` selects metadata only |
| Raw sensitive notes not embedded without visibility policy | ✅ `visibility_scope` required on every row |
| Semantic matches supplementary, not sole authority | ✅ Documented in code; retrieval returns metadata only |
| All operations academy-scoped | ✅ `academy_id` on every query, RLS enforced in DB |
| Retrieval failure returns empty matches | ✅ All catch paths return `{ ok: true, matches: [] }` |
| No cross-academy data | ✅ `auth_academy_id()` in every RLS policy |

---

## V1 Limitations

1. `retrieveSimilarEmbeddings` similarity scores are V1 placeholders (0) — proper
   cosine similarity scores require a DB function or RPC call (V2)
2. IVFFlat index deferred — requires embedding data to exist first (V2)
3. Embedding generation not in V1 — external process must call `storeEmbedding()`
4. Context packet not yet wired to semantic matches — wiring deferred to V2

---

## V2 Scope
- DB function for cosine similarity scoring (returns 0–1 float)
- IVFFlat index for large-scale ANN search
- Embedding generation pipeline (Voyage/Claude API)
- Context packet optional semantic match inclusion
- Visibility policy enforcement during generation
