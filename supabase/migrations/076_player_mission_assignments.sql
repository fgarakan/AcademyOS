-- ============================================================
-- ACADEMY OS — MIGRATION 076: PLAYER MISSION ASSIGNMENTS
--
-- Stores director-assigned missions for players.
-- Missions can be proposed by coaches/DONNA, approved by director.
-- Sprint: Mega Sprint 1101-1110 — Atomic Loops 10/10 Certification
--
-- Status flow: draft → pending_review → active → completed | skipped | archived
-- Director direct assignment starts at 'active' (no draft/pending cycle).
-- ============================================================

CREATE TABLE IF NOT EXISTS player_mission_assignments (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id             UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id              UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- Mission content
  mission_label          TEXT        NOT NULL,
  mission_description    TEXT,

  -- Curriculum snapshot fields — text, not FKs, so missions survive restructuring
  curriculum_stage_key   TEXT,
  curriculum_level_key   TEXT,
  curriculum_source_label TEXT,

  -- Source / assignment context
  source_type            TEXT        NOT NULL DEFAULT 'director'
                         CHECK (source_type IN ('director', 'coach', 'donna', 'voice')),

  -- Back-link to proposed_actions (voice path) — no FK, event-log design
  proposed_action_id     UUID,

  -- Assignment chain
  assigned_by            UUID        REFERENCES profiles(id),
  reviewed_by            UUID        REFERENCES profiles(id),
  reviewed_at            TIMESTAMPTZ,
  review_notes           TEXT,

  -- Status lifecycle
  status                 TEXT        NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft', 'pending_review', 'active', 'completed', 'skipped', 'archived')),

  -- Period / timeframe
  period_label           TEXT,
  starts_at              DATE,
  ends_at                DATE,

  -- Evidence / completion
  completion_note        TEXT,
  completed_at           TIMESTAMPTZ,

  -- Ordering
  display_order          INTEGER     NOT NULL DEFAULT 0,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pma_player_status
  ON player_mission_assignments(player_id, status, display_order);

CREATE INDEX IF NOT EXISTS idx_pma_academy_pending
  ON player_mission_assignments(academy_id, status, created_at DESC)
  WHERE status = 'pending_review';

CREATE INDEX IF NOT EXISTS idx_pma_academy_active
  ON player_mission_assignments(academy_id, status, updated_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_pma_proposed_action
  ON player_mission_assignments(proposed_action_id)
  WHERE proposed_action_id IS NOT NULL;

CREATE TRIGGER tr_player_mission_assignments_updated_at
  BEFORE UPDATE ON player_mission_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE player_mission_assignments ENABLE ROW LEVEL SECURITY;

-- Directors and head coaches see all missions in their academy
CREATE POLICY "Directors see all mission assignments"
  ON player_mission_assignments FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Coaches see active, completed, skipped, archived missions
CREATE POLICY "Coaches see active missions"
  ON player_mission_assignments FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_staff()
    AND status IN ('active', 'completed', 'skipped', 'archived')
  );

-- Players see only their own active missions
CREATE POLICY "Players see own active missions"
  ON player_mission_assignments FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND player_id = (
      SELECT id FROM players
      WHERE profile_id = auth.uid()
        AND academy_id = auth_academy_id()
      LIMIT 1
    )
    AND status = 'active'
  );

-- Directors can insert with any status
CREATE POLICY "Directors insert mission assignments"
  ON player_mission_assignments FOR INSERT
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Coaches can only insert draft or pending_review
CREATE POLICY "Coaches insert mission drafts"
  ON player_mission_assignments FOR INSERT
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_staff()
    AND status IN ('draft', 'pending_review')
  );

-- Directors can update any mission
CREATE POLICY "Directors update mission assignments"
  ON player_mission_assignments FOR UPDATE
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  )
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Coaches can update own drafts and mark active as completed
CREATE POLICY "Coaches update own drafts and complete active"
  ON player_mission_assignments FOR UPDATE
  USING (
    academy_id = auth_academy_id()
    AND auth_is_staff()
    AND (
      (status = 'draft' AND assigned_by = auth.uid())
      OR status = 'active'
    )
  );

-- Only directors can delete
CREATE POLICY "Directors delete mission assignments"
  ON player_mission_assignments FOR DELETE
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

COMMENT ON TABLE player_mission_assignments IS
  'Player missions assigned by directors or proposed by coaches/DONNA. '
  'Director direct assignments start as active. '
  'Coach/DONNA suggestions start as draft → pending_review → active. '
  'Curriculum fields are text snapshots — no FK to curriculum tables.';
