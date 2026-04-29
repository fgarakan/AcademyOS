-- ============================================================
-- ACADEMY OS — MIGRATION 039: PLAYER DEVELOPMENT SUMMARY
-- Curated per-player summary: strengths, priorities, focus,
-- coach notes. Visibility gated — internal by default.
-- ============================================================

CREATE TABLE player_development_summary (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id              UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id               UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_by              UUID NOT NULL REFERENCES profiles(id),
  updated_by              UUID REFERENCES profiles(id),

  current_strengths       TEXT[] NOT NULL DEFAULT '{}',
  things_to_work_on       TEXT[] NOT NULL DEFAULT '{}',
  development_focus       TEXT,
  coach_summary           TEXT,
  student_friendly_summary TEXT,
  parent_summary          TEXT,

  -- Visibility gates — internal by default
  show_to_student         BOOLEAN NOT NULL DEFAULT false,
  show_to_parent          BOOLEAN NOT NULL DEFAULT false,

  -- Source of this summary
  source                  TEXT NOT NULL DEFAULT 'manual'
                          CHECK (source IN ('manual', 'voice_draft', 'ai_draft')),

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (player_id)
);

CREATE INDEX idx_dev_summary_player  ON player_development_summary(player_id);
CREATE INDEX idx_dev_summary_academy ON player_development_summary(academy_id);

CREATE TRIGGER tr_dev_summary_updated_at
  BEFORE UPDATE ON player_development_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE player_development_summary ENABLE ROW LEVEL SECURITY;

-- Staff (directors and coaches) can read all summaries in their academy
CREATE POLICY "Staff read development summaries"
  ON player_development_summary FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

-- Staff can insert/update/delete summaries in their academy
CREATE POLICY "Staff write development summaries"
  ON player_development_summary FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());

-- Players can only read their own summary when show_to_student is true
CREATE POLICY "Players see own summary if enabled"
  ON player_development_summary FOR SELECT
  USING (
    show_to_student = true
    AND EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_development_summary.player_id
        AND p.profile_id = auth.uid()
    )
  );

-- Parents can only read their child's summary when show_to_parent is true
CREATE POLICY "Parents see child summary if enabled"
  ON player_development_summary FOR SELECT
  USING (
    show_to_parent = true
    AND EXISTS (
      SELECT 1 FROM player_guardians pg
      JOIN guardians g ON g.id = pg.guardian_id
      WHERE pg.player_id = player_development_summary.player_id
        AND g.profile_id = auth.uid()
    )
  );
