-- ============================================================
-- ACADEMY OS — MIGRATION 0008: AUDIT LOGS & VERSIONING
-- Extended audit infrastructure, object snapshots, and changelog.
-- The audit_logs table (core) is defined in 0001_core_schema.sql.
-- This migration adds: versioning snapshots, a changelog table,
-- and helper functions for writing structured audit entries.
-- ============================================================

-- ============================================================
-- OBJECT SNAPSHOTS
-- Point-in-time serialized state of any auditable object.
-- Supports rollback inspection and compliance review.
-- ============================================================
CREATE TABLE object_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id      UUID NOT NULL,
  object_type     TEXT NOT NULL,           -- 'player', 'session', 'template', 'placement', etc.
  object_id       UUID NOT NULL,
  snapshot_data   JSONB NOT NULL,          -- full serialized state at this point in time
  snapshot_reason TEXT,                    -- 'pre_update' | 'pre_delete' | 'placement_activation' | etc.
  snapshotted_by  UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_snapshots_object ON object_snapshots(object_type, object_id, created_at DESC);
CREATE INDEX idx_snapshots_academy ON object_snapshots(academy_id, created_at DESC);

-- ============================================================
-- DATABASE CHANGELOG
-- Human-readable record of intentional schema or data changes.
-- Written manually by engineers/migrations. Not automated.
-- ============================================================
CREATE TABLE database_changelog (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version         TEXT NOT NULL,           -- e.g., '0008', '1.2.0'
  description     TEXT NOT NULL,
  change_type     TEXT NOT NULL,           -- 'schema' | 'data' | 'function' | 'policy'
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_by      TEXT,                    -- engineer name or 'migration'
  migration_file  TEXT                     -- e.g., '0008_audit_logs_versioning.sql'
);

-- ============================================================
-- HELPER: write_audit_log()
-- Convenience function for writing structured audit entries.
-- Use this from application code and other functions.
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
  v_role user_role;
  v_log_id UUID;
BEGIN
  SELECT role INTO v_role FROM academy_memberships
  WHERE profile_id = p_actor_id AND academy_id = p_academy_id AND is_active = true
  ORDER BY CASE role
    WHEN 'academy_director' THEN 1
    WHEN 'head_coach'       THEN 2
    WHEN 'coach'            THEN 3
    ELSE 4
  END
  LIMIT 1;

  INSERT INTO audit_logs (
    academy_id, actor_id, actor_role, action,
    target_type, target_id, target_label,
    payload, source_type, voice_command_id
  ) VALUES (
    p_academy_id, p_actor_id, v_role, p_action,
    p_target_type, p_target_id, p_target_label,
    p_payload, p_source_type, p_voice_command_id
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HELPER: take_snapshot()
-- Captures a serialized snapshot of an object before mutation.
-- Call before UPDATE or DELETE on any sensitive object.
-- ============================================================
CREATE OR REPLACE FUNCTION take_snapshot(
  p_academy_id   UUID,
  p_object_type  TEXT,
  p_object_id    UUID,
  p_data         JSONB,
  p_reason       TEXT DEFAULT 'pre_update',
  p_actor_id     UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
BEGIN
  INSERT INTO object_snapshots (
    academy_id, object_type, object_id,
    snapshot_data, snapshot_reason, snapshotted_by
  ) VALUES (
    p_academy_id, p_object_type, p_object_id,
    p_data, p_reason, p_actor_id
  ) RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE object_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors see snapshots"
  ON object_snapshots FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "System inserts snapshots"
  ON object_snapshots FOR INSERT
  WITH CHECK (academy_id = auth_academy_id());

CREATE POLICY "Directors see changelog"
  ON database_changelog FOR SELECT
  USING (auth_is_director_or_head());

-- ============================================================
-- SEED: changelog entry for this migration
-- ============================================================
INSERT INTO database_changelog (version, description, change_type, applied_by, migration_file)
VALUES (
  '0008',
  'Audit logs extended: object_snapshots table, database_changelog table, write_audit_log() and take_snapshot() helpers',
  'schema',
  'migration',
  '0008_audit_logs_versioning.sql'
);
