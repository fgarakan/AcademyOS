# DONNA Semantic Memory QA
**Sprint:** 915.2 | **Date:** 2026-05-28
**Method:** Static code analysis

---

## Migration Checks

| Check | Result |
|---|---|
| `CREATE EXTENSION IF NOT EXISTS vector` — idempotent | ✅ |
| `donna_embeddings` table created | ✅ |
| RLS enabled on `donna_embeddings` | ✅ |
| Staff INSERT policy uses `auth_academy_id()` + `auth_is_staff()` | ✅ |
| Staff UPDATE policy uses `auth_academy_id()` + `auth_is_staff()` | ✅ |
| Director SELECT policy uses `auth_academy_id()` + `auth_is_director_or_head()` | ✅ |
| Staff SELECT policy scoped by `visibility_scope` | ✅ |
| UNIQUE constraint prevents duplicate entity+source+model rows | ✅ |
| `updated_at` trigger wired | ✅ |

---

## TypeScript Checks

| Check | Result |
|---|---|
| `EMBEDDING_SOURCE_REGISTRY` exported | ✅ |
| `storeEmbedding` validates source kind via registry | ✅ |
| `storeEmbedding` validates vector dimension matches `embeddingDim` | ✅ |
| `storeEmbedding` uses upsert with onConflict | ✅ |
| `retrieveSimilarEmbeddings` returns `{ ok: true, matches: [] }` on any error | ✅ |
| `getEntityEmbeddings` never selects `embedding_vector` column | ✅ |
| All catch paths return safe fallback (no re-throw) | ✅ |
| No raw vectors in any return type | ✅ |

---

## Safety Checks

| Check | Result |
|---|---|
| No execute_curriculum_override() in semantic memory module | ✅ |
| No proposed_actions mutations | ✅ |
| Sprint 904 approve/reject paths unchanged | ✅ |
| Curriculum draft status still pending_review only | ✅ |
| No sensitive raw notes stored without visibility_scope | ✅ visibility_scope required on every row |
| No semantic match used as sole authority for high-risk actions | ✅ matches are metadata only |
| Cross-academy isolation: all queries include `academy_id` filter | ✅ |

---

## TypeScript
`npx tsc --noEmit` — 0 errors

---

## Known V1 Gaps

1. Similarity scores are placeholder `0` — no cosine distance calculation in V1 select
2. IVFFlat index deferred — can't build until embedding data exists
3. Embedding generation not included — external pipeline required
4. Context packet not wired to semantic matches yet
5. pgvector availability at runtime — `CREATE EXTENSION IF NOT EXISTS vector` may no-op
   if Supabase project does not have pgvector enabled; retrieval will return empty safely
