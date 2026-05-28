-- ============================================================
-- ACADEMY OS — MIGRATION 073: DONNA ENTITY SUMMARIES
-- Compact durable summaries for fast, reliable DONNA context.
-- Summaries are deterministic — no AI generation.
-- Source data must exist before summaries are written.
-- Summary retrieval failure does not break DONNA.
--
-- Sprint: 914.12 — DONNA Entity Summary Spine V1
-- ============================================================

CREATE TABLE donna_entity_summaries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,

  -- Entity identification
  entity_type       TEXT NOT NULL
                    CHECK (entity_type IN ('academy', 'player', 'group', 'curriculum_level', 'template', 'session')),
  entity_id         UUID NOT NULL,   -- references the entity (no FK — flexible cross-table)

  -- Summary content
  summary_kind      TEXT NOT NULL DEFAULT 'operating'
                    CHECK (summary_kind IN ('operating', 'health', 'curriculum', 'progress', 'risk')),
  summary_text      TEXT,            -- safe, human-readable summary (no raw notes/PII)
  summary_json      JSONB NOT NULL DEFAULT '{}',  -- structured summary data

  -- Provenance
  source_event_ids  UUID[],          -- optional references to donna_events that triggered refresh
  confidence        TEXT CHECK (confidence IN ('high', 'medium', 'low', 'partial')),
  visibility_scope  TEXT NOT NULL DEFAULT 'director'
                    CHECK (visibility_scope IN ('director', 'head_coach', 'staff', 'system')),

  -- Lifecycle
  last_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One summary per entity per kind per academy
  UNIQUE (academy_id, entity_type, entity_id, summary_kind)
);

CREATE INDEX idx_donna_es_academy    ON donna_entity_summaries(academy_id);
CREATE INDEX idx_donna_es_entity     ON donna_entity_summaries(entity_type, entity_id);
CREATE INDEX idx_donna_es_refresh    ON donna_entity_summaries(last_refreshed_at DESC);
CREATE INDEX idx_donna_es_kind       ON donna_entity_summaries(academy_id, entity_type, summary_kind);

CREATE TRIGGER tr_donna_entity_summaries_updated_at
  BEFORE UPDATE ON donna_entity_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE donna_entity_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff insert or update donna entity summaries"
  ON donna_entity_summaries FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff update donna entity summaries"
  ON donna_entity_summaries FOR UPDATE
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors see all donna entity summaries"
  ON donna_entity_summaries FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Staff see staff-visible summaries"
  ON donna_entity_summaries FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_staff()
    AND visibility_scope IN ('director', 'head_coach', 'staff')
  );
