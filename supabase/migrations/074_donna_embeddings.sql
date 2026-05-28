-- ============================================================
-- ACADEMY OS — MIGRATION 074: DONNA EMBEDDINGS (SEMANTIC MEMORY)
-- First semantic memory foundation — pgvector extension + storage.
-- V1: store and retrieve embeddings only. Generation is external.
-- Retrieval failure does not break DONNA.
-- Semantic matches are supplementary — never sole authority for
-- high-risk decisions.
--
-- Sprint: 915.2 — DONNA Semantic Memory / Embeddings V1
-- ============================================================

-- Enable pgvector (safe: IF NOT EXISTS is idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- ── donna_embeddings ──────────────────────────────────────────────────────────
CREATE TABLE donna_embeddings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,

  -- Source entity
  entity_type       TEXT NOT NULL
                    CHECK (entity_type IN (
                      'curriculum_node',
                      'coach_note_summary',
                      'player_summary',
                      'template_summary',
                      'academy_knowledge'
                    )),
  entity_id         UUID NOT NULL,   -- references the source entity (no FK — flexible)

  -- What was embedded
  source_kind       TEXT NOT NULL,   -- e.g. 'summary_text', 'template_content', 'player_progress'
  source_text_hash  TEXT,            -- SHA-256 of embedded text for staleness detection

  -- Embedding
  embedding_model   TEXT NOT NULL,   -- model that produced the vector, e.g. 'voyage-3'
  embedding_dim     INT NOT NULL,    -- vector dimension for validation
  embedding_vector  vector(1536),    -- pre-computed vector; NULL until populated

  -- Visibility
  visibility_scope  TEXT NOT NULL DEFAULT 'director'
                    CHECK (visibility_scope IN ('director', 'head_coach', 'staff', 'system')),

  -- Lifecycle
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One embedding per entity per source kind per model per academy
  UNIQUE (academy_id, entity_type, entity_id, source_kind, embedding_model)
);

-- Indexes for fast retrieval
CREATE INDEX idx_donna_emb_academy     ON donna_embeddings(academy_id);
CREATE INDEX idx_donna_emb_entity      ON donna_embeddings(entity_type, entity_id);
CREATE INDEX idx_donna_emb_type        ON donna_embeddings(academy_id, entity_type);

-- IVFFlat index for approximate nearest-neighbor search (requires data first;
-- can be created later with: CREATE INDEX ... USING ivfflat)
-- Deferred: will add in 915.x once embedding population is underway.

CREATE TRIGGER tr_donna_embeddings_updated_at
  BEFORE UPDATE ON donna_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE donna_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff insert donna embeddings"
  ON donna_embeddings FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff update donna embeddings"
  ON donna_embeddings FOR UPDATE
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors see all donna embeddings"
  ON donna_embeddings FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Staff see staff-visible embeddings"
  ON donna_embeddings FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_staff()
    AND visibility_scope IN ('director', 'head_coach', 'staff')
  );
