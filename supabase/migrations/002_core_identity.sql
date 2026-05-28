-- ============================================================
-- ACADEMY OS — MIGRATION 002: CORE IDENTITY
-- Academies, profiles, roles, memberships, levels, groups.
-- Root of the object graph. Every other table references academy_id.
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'academy_director',   -- full access; approves placements and voice actions
  'head_coach',         -- program-level; approves placements, sees all groups
  'coach',              -- group-level; manages assigned groups and players
  'player',             -- read-only: own profile, progress, upcoming sessions
  'parent'              -- read-only: child's profile and coach updates
);

CREATE TYPE development_track AS ENUM (
  'skill',          -- technique and consistency focus
  'competition',    -- tournament and match-play focus
  'fitness',        -- physical conditioning focus
  'combined'        -- dual-track (competition + skill or skill + fitness)
);

-- ============================================================
-- REUSABLE TRIGGER FUNCTION
-- Placed here because all subsequent migrations need it.
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ACADEMIES
-- Root tenant. V1 assumes one academy; V3 extends multi-tenancy.
-- ============================================================
CREATE TABLE academies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  country         TEXT,
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  settings        JSONB NOT NULL DEFAULT '{}',
  -- settings keys (not enforced at DB level):
  --   level_count: 1-10 (default 6)
  --   scoring_step: 0.5
  --   default_reassessment_weeks: 10
  --   currency: 'USD'
  --   logo_url: TEXT
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tr_academies_updated_at
  BEFORE UPDATE ON academies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PROFILES
-- Extends Supabase auth.users. One profile per auth user.
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  email           TEXT NOT NULL,
  avatar_initials TEXT GENERATED ALWAYS AS (
    upper(
      left(split_part(display_name, ' ', 1), 1) ||
      COALESCE(left(split_part(display_name, ' ', 2), 1), '')
    )
  ) STORED,
  phone           TEXT,
  locale          TEXT NOT NULL DEFAULT 'en',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_academy ON profiles(academy_id);
CREATE INDEX idx_profiles_email ON profiles USING gin(email gin_trgm_ops);

CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ACADEMY MEMBERSHIPS
-- A profile can have multiple roles (e.g., head_coach + coach).
-- ============================================================
CREATE TABLE academy_memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role            user_role NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  granted_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(academy_id, profile_id, role)
);

CREATE INDEX idx_memberships_profile ON academy_memberships(profile_id);
CREATE INDEX idx_memberships_academy_role ON academy_memberships(academy_id, role);

CREATE TRIGGER tr_memberships_updated_at
  BEFORE UPDATE ON academy_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ACADEMY LEVELS
-- Configurable per academy. Typically 4–6 levels per track.
-- ============================================================
CREATE TABLE academy_levels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  level_number    INTEGER NOT NULL CHECK (level_number BETWEEN 1 AND 10),
  label           TEXT NOT NULL,
  description     TEXT,
  min_age         INTEGER,
  max_age         INTEGER,
  track           development_track,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(academy_id, level_number, track)
);

-- ============================================================
-- GROUPS
-- Training groups. Players belong to exactly one active group.
-- ============================================================
CREATE TABLE groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  level_id        UUID REFERENCES academy_levels(id),
  track           development_track,
  max_players     INTEGER,
  min_age         INTEGER,
  max_age         INTEGER,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_groups_academy ON groups(academy_id);

CREATE TRIGGER tr_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- COACH <> GROUP ASSIGNMENTS
-- ============================================================
CREATE TABLE coach_group_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  coach_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'lead' CHECK (role IN ('lead', 'assistant')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coach_id, group_id)
);

CREATE INDEX idx_coach_assignments_coach ON coach_group_assignments(coach_id);
CREATE INDEX idx_coach_assignments_group ON coach_group_assignments(group_id);

-- ============================================================
-- AUDIT LOG
-- Immutable append-only. Every important change is logged here.
-- write_audit_log() helper defined in 011_audit_versioning.sql.
-- ============================================================
CREATE TABLE audit_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id       UUID NOT NULL,
  actor_id         UUID REFERENCES profiles(id),
  actor_role       user_role,
  action           TEXT NOT NULL,
  target_type      TEXT NOT NULL,
  target_id        UUID,
  target_label     TEXT,
  payload          JSONB,
  source_type      TEXT NOT NULL DEFAULT 'ui' CHECK (source_type IN ('ui', 'voice', 'api', 'system')),
  voice_command_id UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor    ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_target   ON audit_logs(target_type, target_id, created_at DESC);
CREATE INDEX idx_audit_academy  ON audit_logs(academy_id, created_at DESC);
CREATE INDEX idx_audit_action   ON audit_logs(academy_id, action, created_at DESC);
