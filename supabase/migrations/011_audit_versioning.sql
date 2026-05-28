-- ============================================================
-- ACADEMY OS — MIGRATION 011: AUDIT VERSIONING
-- Object snapshots, database changelog, and audit helper functions.
-- ============================================================

-- ============================================================
-- OBJECT SNAPSHOTS
-- Full JSONB snapshot of any object before/after a change.
-- Used for: undo UI, compliance, diff views.
-- ============================================================
CREATE TABLE object_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    UUID NOT NULL,
  object_type   TEXT NOT NULL,
  object_id     UUID NOT NULL,
  object_label  TEXT,
  snapshot      JSONB NOT NULL,
  taken_by      UUID REFERENCES profiles(id),
  taken_reason  TEXT,  -- 'pre_edit' | 'pre_delete' | 'approval' | 'manual'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_snapshots_object ON object_snapshots(object_type, object_id, created_at DESC);
CREATE INDEX idx_snapshots_academy ON object_snapshots(academy_id, created_at DESC);

-- ============================================================
-- DATABASE CHANGELOG
-- Internal migration history. One row per migration file run.
-- This is separate from Supabase's own migration tracking —
-- it's a human-readable log for auditors and the dev team.
-- ============================================================
CREATE TABLE database_changelog (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration    TEXT NOT NULL UNIQUE,
  description  TEXT,
  applied_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_by   TEXT NOT NULL DEFAULT current_user
);

-- Seed this migration's own entry
INSERT INTO database_changelog (migration, description) VALUES
  ('001_extensions',       'PostgreSQL extensions'),
  ('002_core_identity',    'Academies, profiles, roles, memberships, levels, groups'),
  ('003_rls_helpers',      'RLS helper functions and core table policies'),
  ('004_players',          'Players, guardians (with updated_at fix), group memberships, progression'),
  ('005_assessments',      'Assessment versions, assessments, placement recommendations, finalize_player_placement()'),
  ('006_exercises_templates', 'Exercise library, templates, template blocks'),
  ('007_sessions',         'Sessions, session blocks (with updated_at fix), attendance'),
  ('008_voice_pipeline',   'Voice commands, clarification requests, action_type enum (with cancel_session fix)'),
  ('009_proposed_actions', 'Proposed actions, execution logs, execute_approved_action()'),
  ('010_coach_notes',      'Coach observations, voice notes, parent updates'),
  ('011_audit_versioning', 'Object snapshots, database changelog, audit helper functions');

-- ============================================================
-- WRITE_AUDIT_LOG()
-- Convenience wrapper for inserting audit log entries.
-- Use this instead of raw INSERT to ensure consistent formatting.
-- ============================================================
CREATE OR REPLACE FUNCTION write_audit_log(
  p_academy_id       UUID,
  p_actor_id         UUID,
  p_action           TEXT,
  p_target_type      TEXT,
  p_target_id        UUID DEFAULT NULL,
  p_target_label     TEXT DEFAULT NULL,
  p_payload          JSONB DEFAULT NULL,
  p_source_type      TEXT DEFAULT 'ui',
  p_voice_command_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id   UUID;
  v_role user_role;
BEGIN
  SELECT role INTO v_role
  FROM academy_memberships
  WHERE profile_id = p_actor_id
  AND is_active = true
  ORDER BY role  -- deterministic when multiple roles
  LIMIT 1;

  INSERT INTO audit_logs (
    academy_id, actor_id, actor_role, action,
    target_type, target_id, target_label,
    payload, source_type, voice_command_id
  ) VALUES (
    p_academy_id, p_actor_id, v_role, p_action,
    p_target_type, p_target_id, p_target_label,
    p_payload, p_source_type, p_voice_command_id
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TAKE_SNAPSHOT()
-- Captures the current state of any table row as JSON.
-- ============================================================
CREATE OR REPLACE FUNCTION take_snapshot(
  p_academy_id  UUID,
  p_object_type TEXT,
  p_object_id   UUID,
  p_object_label TEXT DEFAULT NULL,
  p_taken_by    UUID DEFAULT NULL,
  p_taken_reason TEXT DEFAULT 'pre_edit'
)
RETURNS UUID AS $$
DECLARE
  v_snapshot JSONB;
  v_id       UUID;
BEGIN
  EXECUTE format('SELECT to_jsonb(t.*) FROM %I t WHERE id = $1', p_object_type)
  INTO v_snapshot
  USING p_object_id;

  IF v_snapshot IS NULL THEN
    RAISE EXCEPTION 'Object not found: % id=%', p_object_type, p_object_id;
  END IF;

  INSERT INTO object_snapshots (
    academy_id, object_type, object_id, object_label,
    snapshot, taken_by, taken_reason
  ) VALUES (
    p_academy_id, p_object_type, p_object_id, p_object_label,
    v_snapshot, p_taken_by, p_taken_reason
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE object_snapshots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_changelog  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors see snapshots"
  ON object_snapshots FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "System inserts snapshots"
  ON object_snapshots FOR INSERT
  WITH CHECK (academy_id = auth_academy_id());

CREATE POLICY "Staff see database changelog"
  ON database_changelog FOR SELECT
  USING (auth_is_staff());
