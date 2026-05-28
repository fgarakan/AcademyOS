-- ============================================================
-- ACADEMY OS — MIGRATION 0001: CORE SCHEMA
-- Extensions, academies, users, roles, memberships
-- Run this first. All other migrations depend on it.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search

-- ============================================================
-- ACADEMIES
-- Root tenant object. Every other record belongs to an academy.
-- academy_id is on EVERY table for future multi-tenancy.
-- ============================================================
CREATE TABLE academies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE, -- used in URLs
  country         TEXT,
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  settings        JSONB NOT NULL DEFAULT '{}', -- level names, scoring scale, etc.
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USER PROFILES
-- Extends Supabase Auth users. One profile per auth user.
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  email           TEXT NOT NULL,
  avatar_initials TEXT GENERATED ALWAYS AS (
    upper(left(split_part(display_name, ' ', 1), 1) ||
    COALESCE(left(split_part(display_name, ' ', 2), 1), ''))
  ) STORED,
  phone           TEXT,
  locale          TEXT NOT NULL DEFAULT 'en',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROLES
-- System roles. Not per-academy custom roles — these are fixed.
-- ============================================================
CREATE TYPE user_role AS ENUM (
  'academy_director',   -- top-level: sees everything, manages configuration
  'head_coach',         -- program-level: approves placements, sees all groups
  'coach',              -- group-level: manages their assigned groups/players
  'player',             -- read-only: their own profile, progress, sessions
  'parent'              -- read-only: their child's profile and updates
);

-- ============================================================
-- ACADEMY MEMBERSHIPS
-- Links a profile to a role within an academy.
-- A user can have multiple roles (e.g., head_coach + coach).
-- ============================================================
CREATE TABLE academy_memberships (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role            user_role NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  granted_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(academy_id, profile_id, role)
);

-- ============================================================
-- TRACKS
-- The three developmental tracks. Fixed taxonomy.
-- ============================================================
CREATE TYPE development_track AS ENUM ('skill', 'competition', 'fitness', 'combined');

-- ============================================================
-- LEVELS
-- Academy-configurable levels (1–10 scale, labels set in academy settings)
-- ============================================================
CREATE TABLE academy_levels (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  level_number    INTEGER NOT NULL CHECK (level_number BETWEEN 1 AND 10),
  label           TEXT NOT NULL, -- e.g., "Orange Development", "Elite Green"
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
-- Training groups within an academy. Players belong to groups.
-- ============================================================
CREATE TABLE groups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL, -- e.g., "Elite-A", "Orange Development"
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

-- ============================================================
-- COACH <> GROUP ASSIGNMENTS
-- Which coaches are responsible for which groups
-- ============================================================
CREATE TABLE coach_group_assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  coach_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'lead', -- 'lead' | 'assistant'
  is_active       BOOLEAN NOT NULL DEFAULT true,
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coach_id, group_id)
);

-- ============================================================
-- AUDIT LOG (core)
-- Every important change in the system is recorded here.
-- ============================================================
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id      UUID NOT NULL,
  actor_id        UUID REFERENCES profiles(id),
  actor_role      user_role,
  action          TEXT NOT NULL, -- e.g., 'player.placement.finalized'
  target_type     TEXT NOT NULL, -- e.g., 'player', 'session', 'template'
  target_id       UUID,
  target_label    TEXT,          -- human-readable identifier
  payload         JSONB,         -- what changed (before/after)
  source_type     TEXT NOT NULL DEFAULT 'ui', -- 'ui' | 'voice' | 'api' | 'system'
  voice_command_id UUID,         -- linked if action came from voice
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_academy ON profiles(academy_id);
CREATE INDEX idx_memberships_profile ON academy_memberships(profile_id);
CREATE INDEX idx_memberships_academy_role ON academy_memberships(academy_id, role);
CREATE INDEX idx_groups_academy ON groups(academy_id);
CREATE INDEX idx_coach_assignments_coach ON coach_group_assignments(coach_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id, created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER (reusable)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_academies_updated_at BEFORE UPDATE ON academies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_memberships_updated_at BEFORE UPDATE ON academy_memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at();
