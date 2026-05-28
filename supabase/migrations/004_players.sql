-- ============================================================
-- ACADEMY OS — MIGRATION 004: PLAYERS
-- Players, guardians, group memberships, player progression.
-- Fix applied: guardians.updated_at added (was missing in package spec).
-- ============================================================

-- ============================================================
-- PLAYER STATUS ENUM
-- ============================================================
CREATE TYPE player_status AS ENUM (
  'pending_placement',      -- just enrolled, no assessment yet
  'placement_in_progress',  -- assessment session underway
  'pending_approval',       -- AI recommendation generated, awaiting director
  'active',                 -- placed in a group, training
  'reassessment_due',       -- past next_assessment_due date
  'on_hold',                -- injury, travel, temporary pause
  'inactive'                -- left the program
);

-- ============================================================
-- PLAYERS
-- ============================================================
CREATE TABLE players (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id                UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  profile_id                UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Identity
  first_name                TEXT NOT NULL,
  last_name                 TEXT NOT NULL,
  full_name                 TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  date_of_birth             DATE NOT NULL,
  gender                    TEXT CHECK (gender IN ('male', 'female', 'other', NULL)),
  handedness                TEXT CHECK (handedness IN ('right', 'left', 'ambidextrous', NULL)),
  nationality               TEXT,
  notes                     TEXT,

  -- Status
  status                    player_status NOT NULL DEFAULT 'pending_placement',
  is_active                 BOOLEAN NOT NULL DEFAULT true,

  -- Current placement (denormalized for query performance)
  current_group_id          UUID REFERENCES groups(id),
  current_level_id          UUID REFERENCES academy_levels(id),
  current_track             development_track,
  primary_coach_id          UUID REFERENCES profiles(id),

  -- Reassessment schedule
  last_assessed_at          DATE,
  next_assessment_due       DATE,
  assessment_interval_weeks INTEGER NOT NULL DEFAULT 10,

  -- Intake
  join_date                 DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by                UUID REFERENCES profiles(id),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_academy        ON players(academy_id);
CREATE INDEX idx_players_status         ON players(academy_id, status);
CREATE INDEX idx_players_group          ON players(current_group_id);
CREATE INDEX idx_players_coach          ON players(primary_coach_id);
CREATE INDEX idx_players_assessment_due ON players(next_assessment_due) WHERE is_active = true;
CREATE INDEX idx_players_fullname_trgm  ON players USING gin(full_name gin_trgm_ops);

CREATE TRIGGER tr_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- GUARDIANS
-- updated_at added here — was omitted in early spec, needed for triggers.
-- ============================================================
CREATE TABLE guardians (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  profile_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  relationship    TEXT NOT NULL DEFAULT 'parent' CHECK (relationship IN ('parent', 'guardian', 'other')),
  is_primary      BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tr_guardians_updated_at
  BEFORE UPDATE ON guardians
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PLAYER <> GUARDIAN LINK
-- ============================================================
CREATE TABLE player_guardians (
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
  PRIMARY KEY (player_id, guardian_id)
);

-- ============================================================
-- GROUP MEMBERSHIPS
-- Full history of which player was in which group.
-- Exactly one row per player can have is_current = true.
-- ============================================================
CREATE TABLE group_memberships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id  UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at     TIMESTAMPTZ,
  reason      TEXT,
  moved_by    UUID REFERENCES profiles(id),
  is_current  BOOLEAN NOT NULL DEFAULT true
);

-- Partial unique index: only one active membership per player
CREATE UNIQUE INDEX idx_active_group_membership ON group_memberships(player_id) WHERE is_current = true;
CREATE INDEX idx_group_memberships_player ON group_memberships(player_id);
CREATE INDEX idx_group_memberships_group  ON group_memberships(group_id) WHERE is_current = true;

-- ============================================================
-- PLAYER PROGRESSION
-- Current developmental snapshot. One row per player.
-- Updated automatically via trigger on assessments (012_functions_triggers.sql).
-- ============================================================
CREATE TABLE player_progression (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id           UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id            UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE UNIQUE,

  -- Current scores (0.0–10.0 in 0.5 steps)
  technical_score      NUMERIC(4,2),
  tactical_score       NUMERIC(4,2),
  movement_score       NUMERIC(4,2),
  competition_score    NUMERIC(4,2),
  behavioral_score     NUMERIC(4,2),
  overall_score        NUMERIC(4,2),

  -- Baseline (set at initial placement, never updated)
  baseline_technical   NUMERIC(4,2),
  baseline_tactical    NUMERIC(4,2),
  baseline_movement    NUMERIC(4,2),
  baseline_competition NUMERIC(4,2),
  baseline_behavioral  NUMERIC(4,2),
  baseline_overall     NUMERIC(4,2),
  baseline_set_at      TIMESTAMPTZ,

  -- Development focus (coach-identified)
  focus_areas          TEXT[],
  strengths            TEXT[],
  weaknesses           TEXT[],
  tags                 TEXT[],

  -- Promotion readiness
  promotion_ready      BOOLEAN NOT NULL DEFAULT false,
  promotion_notes      TEXT,
  promotion_flagged_at TIMESTAMPTZ,
  promotion_flagged_by UUID REFERENCES profiles(id),

  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_player_progression_player ON player_progression(player_id);

CREATE TRIGGER tr_progression_updated_at
  BEFORE UPDATE ON player_progression
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE players            ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians          ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_guardians   ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_progression ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see academy players"
  ON players FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Players see own record"
  ON players FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Parents see their children"
  ON players FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND EXISTS (
      SELECT 1 FROM player_guardians pg
      JOIN guardians g ON g.id = pg.guardian_id
      WHERE pg.player_id = players.id
      AND g.profile_id = auth.uid()
    )
  );

CREATE POLICY "Staff manage players"
  ON players FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff see group memberships"
  ON group_memberships FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors manage group memberships"
  ON group_memberships FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Staff see player progression"
  ON player_progression FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Players see own progression"
  ON player_progression FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE players.id = player_progression.player_id
      AND players.profile_id = auth.uid()
    )
  );
