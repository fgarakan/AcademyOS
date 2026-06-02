-- ============================================================
-- ACADEMY OS — MIGRATION 083: PLAYER EVIDENCE RECORDS
--
-- Unified evidence layer for the Player Evidence Engine.
-- Every meaningful player development event is recorded here.
-- This table is the source of truth for:
--   - DONNA explanations and readiness answers
--   - Progress rollup signals
--   - Mission and blueprint recommendations
--   - Parent-safe summary generation
--   - Player-owned portable development record
--
-- Data ownership architecture:
--   owner_scope = 'player_owned'  → parent/player can export at any time
--   owner_scope = 'academy_owned' → retained by academy, anonymized on exit
--   owner_scope = 'shared'        → exported with consent on exit
--
-- portability_status:
--   'portable'           → included in player passport on exit (with consent)
--   'internal_only'      → never exported (raw coach notes, internal overrides)
--   'anonymized_on_exit' → retained in aggregate; player_id detached on exit
--
-- This architecture ensures parents/players own their development record
-- while academies retain anonymized program analytics.
--
-- Sprint: Mega Sprint 1211-1230 — Player Evidence Engine V1
-- ============================================================

CREATE TABLE IF NOT EXISTS player_evidence_records (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id             UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- ── Evidence source ───────────────────────────────────────────────────────
  source_type           TEXT        NOT NULL
                        CHECK (source_type IN (
                          'assessment_score',
                          'reassessment_change',
                          'coach_observation',
                          'mission_assigned',
                          'mission_completed',
                          'session_attendance',
                          'session_actual',
                          'placement_decision',
                          'director_override',
                          'level_readiness_signal',
                          'parent_update_approved',
                          'competition_note',
                          'fitness_note',
                          'mental_performance_note'
                        )),

  -- Back-reference to the originating record (no FK — event-log design)
  source_id             TEXT,       -- UUID of the source row as text

  -- ── Curriculum context (snapshot — not FK, survives restructuring) ────────
  curriculum_level_id   UUID        REFERENCES curriculum_levels(id) ON DELETE SET NULL,
  curriculum_level_name TEXT,
  curriculum_requirement_id TEXT,   -- requirement UUID as text (no FK)
  curriculum_requirement_label TEXT,

  -- ── Priority context ──────────────────────────────────────────────────────
  priority_key          TEXT,       -- player_priorities.id as text (no FK)
  priority_label        TEXT,

  -- ── Pathway classification ────────────────────────────────────────────────
  pathway               TEXT
                        CHECK (pathway IN (
                          'skill', 'competition', 'fitness', 'mental_performance', 'general'
                        )),

  -- ── Evidence quality signals ──────────────────────────────────────────────
  confidence            INTEGER     NOT NULL DEFAULT 50
                        CHECK (confidence BETWEEN 0 AND 100),
  -- 'strong' ≥ 80, 'moderate' 50–79, 'weak' < 50
  evidence_strength     TEXT        NOT NULL DEFAULT 'moderate'
                        CHECK (evidence_strength IN ('strong', 'moderate', 'weak')),

  -- Human-readable summary (internal) — NEVER raw coach note text
  evidence_summary      TEXT        NOT NULL DEFAULT '',

  -- ── Role visibility ───────────────────────────────────────────────────────
  -- Bitmask implemented as individual booleans for query simplicity
  visible_to_director   BOOLEAN     NOT NULL DEFAULT true,
  visible_to_coach      BOOLEAN     NOT NULL DEFAULT true,
  visible_to_parent     BOOLEAN     NOT NULL DEFAULT false,
  visible_to_player     BOOLEAN     NOT NULL DEFAULT false,

  -- ── Data ownership and portability ───────────────────────────────────────
  -- Who owns this evidence record:
  --   'player_owned'  — assessment outcomes, level progress, missions, approved summaries
  --   'academy_owned' — raw observations, attendance patterns, operational data
  --   'shared'        — placement decisions, level placements, development priorities
  owner_scope           TEXT        NOT NULL DEFAULT 'shared'
                        CHECK (owner_scope IN ('player_owned', 'academy_owned', 'shared')),

  -- What happens to this record when the player exits:
  --   'portable'           — exported in player passport (with consent)
  --   'internal_only'      — never exported, never anonymized (audit/compliance trail)
  --   'anonymized_on_exit' — player_id detached, data retained in aggregate
  portability_status    TEXT        NOT NULL DEFAULT 'internal_only'
                        CHECK (portability_status IN ('portable', 'internal_only', 'anonymized_on_exit')),

  -- Consent tracking for cross-academy transfer or export
  consent_status        TEXT        NOT NULL DEFAULT 'not_required'
                        CHECK (consent_status IN ('pending', 'granted', 'revoked', 'not_required')),
  consent_version       TEXT,       -- e.g. 'v1.0' — for future versioned consent forms

  -- Lifecycle: set when player leaves and data is anonymized
  anonymized_at         TIMESTAMPTZ,
  transferred_at        TIMESTAMPTZ,

  -- ── Audit fields ─────────────────────────────────────────────────────────
  created_by            UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Deduplication constraint ─────────────────────────────────────────────────
-- Prevents double-writing the same source event (source_type + source_id unique per player)
CREATE UNIQUE INDEX IF NOT EXISTS idx_per_source_dedup
  ON player_evidence_records(player_id, source_type, source_id)
  WHERE source_id IS NOT NULL;

-- ─── Query indexes ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_per_player_pathway
  ON player_evidence_records(player_id, pathway, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_per_player_source_type
  ON player_evidence_records(player_id, source_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_per_academy_created
  ON player_evidence_records(academy_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_per_portable
  ON player_evidence_records(player_id, portability_status)
  WHERE portability_status = 'portable';

CREATE INDEX IF NOT EXISTS idx_per_owner_scope
  ON player_evidence_records(player_id, owner_scope);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS tr_player_evidence_records_updated_at
  ON player_evidence_records;

CREATE TRIGGER tr_player_evidence_records_updated_at
  BEFORE UPDATE ON player_evidence_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE player_evidence_records ENABLE ROW LEVEL SECURITY;

-- Directors and head coaches see all evidence in their academy
DROP POLICY IF EXISTS "Directors see all player evidence"
  ON player_evidence_records;

CREATE POLICY "Directors see all player evidence"
  ON player_evidence_records FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Coaches see visible_to_coach evidence in their academy
DROP POLICY IF EXISTS "Coaches see coach-visible evidence"
  ON player_evidence_records;

CREATE POLICY "Coaches see coach-visible evidence"
  ON player_evidence_records FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_staff()
    AND visible_to_coach = true
  );

-- Parents see only parent-safe evidence for their own children
DROP POLICY IF EXISTS "Parents see own child parent-safe evidence"
  ON player_evidence_records;

CREATE POLICY "Parents see own child parent-safe evidence"
  ON player_evidence_records FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND visible_to_parent = true
    AND player_id IN (
      SELECT pg.player_id FROM player_guardians pg
      JOIN guardians g ON g.id = pg.guardian_id
      WHERE g.profile_id = auth.uid()
        AND g.academy_id = auth_academy_id()
    )
  );

-- Players see only their own player-safe evidence
DROP POLICY IF EXISTS "Players see own player-safe evidence"
  ON player_evidence_records;

CREATE POLICY "Players see own player-safe evidence"
  ON player_evidence_records FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND visible_to_player = true
    AND player_id = (
      SELECT id FROM players
      WHERE profile_id = auth.uid()
        AND academy_id = auth_academy_id()
      LIMIT 1
    )
  );

-- Directors and head coaches can insert evidence
DROP POLICY IF EXISTS "Directors insert player evidence"
  ON player_evidence_records;

CREATE POLICY "Directors insert player evidence"
  ON player_evidence_records FOR INSERT
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Coaches can insert academy-owned evidence (observations, notes)
DROP POLICY IF EXISTS "Coaches insert coach-owned evidence"
  ON player_evidence_records;

CREATE POLICY "Coaches insert coach-owned evidence"
  ON player_evidence_records FOR INSERT
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_staff()
    AND owner_scope = 'academy_owned'
  );

-- Directors can update (e.g. anonymize on exit, update consent)
DROP POLICY IF EXISTS "Directors update player evidence"
  ON player_evidence_records;

CREATE POLICY "Directors update player evidence"
  ON player_evidence_records FOR UPDATE
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  )
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

COMMENT ON TABLE player_evidence_records IS
  'Unified player development evidence. Source of truth for DONNA explanations, '
  'readiness signals, progress rollup, mission and blueprint recommendations, '
  'and parent-safe summaries. '
  'Supports player-owned portable development record (player passport). '
  'owner_scope and portability_status determine what transfers when a player exits.';

COMMENT ON COLUMN player_evidence_records.owner_scope IS
  'player_owned: assessment outcomes, progress, approved summaries — parent can export. '
  'academy_owned: raw observations, attendance, operational data — retained by academy. '
  'shared: placement decisions, priorities — exported with consent.';

COMMENT ON COLUMN player_evidence_records.portability_status IS
  'portable: included in player passport on exit. '
  'internal_only: never exported (raw coach notes, internal overrides). '
  'anonymized_on_exit: player_id detached; data retained for program analytics.';

COMMENT ON COLUMN player_evidence_records.evidence_summary IS
  'Human-readable internal summary. NEVER contains raw coach observation text. '
  'Safe to use in DONNA explanations. Not automatically parent/player visible.';
