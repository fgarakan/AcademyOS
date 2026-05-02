-- ============================================================
-- ACADEMY OS — MIGRATION 052: CURRICULUM FOUNDATION TABLES
-- Additive table definitions for the product-agnostic curriculum
-- spine. No seed data in this migration. No existing tables
-- altered except safe ADD COLUMN IF NOT EXISTS additions to
-- player_curriculum_states and players.
--
-- Tables created:
--   curriculum_gates              — 57 evidence-based gate criteria
--   curriculum_drills             — 152 drill definitions (16-field schema)
--   curriculum_drill_tags         — normalised drill tags (~227 entries)
--   curriculum_coach_language     — 120 coaching language entries (15×8×4)
--   curriculum_competition_track  — 15-stage Competition Track
--   curriculum_fitness_guidance   — 15-stage fitness progression
--   curriculum_volume_guidance    — 15-stage volume guidance
--   curriculum_archetypes         — 8 player archetypes (A1–A8)
--   curriculum_failure_modes      — 14 failure modes (engineering backlog)
--   drill_gate_mappings           — drill → gate many-to-many join
--
-- Columns added (ADD COLUMN IF NOT EXISTS):
--   player_curriculum_states.competition_track_level_id
--   player_curriculum_states.fitness_path_phase
--   players.archetype_tag
--   players.archetype_secondary_tag
--   players.recreation_flag
--   players.healthy_plateau_state
--   players.return_to_play_state
--   players.entry_age
--
-- Product-agnostic by design. No Angles product tool references.
-- No enums created or altered. No existing tables dropped or renamed.
-- Source of truth: docs/curriculum/angles-master-spine.md
-- Exclusion decision: docs/curriculum/product-tool-exclusion-decision.md
--
-- Sprint: 186 — Curriculum Foundation Tables V1
-- ============================================================


-- ============================================================
-- TABLE: curriculum_gates
-- 57 evidence-based gate criteria covering 15 transitions
-- (14 in-curriculum + 1 HP3 exit).
-- gate_id uses the structured format FROM__TO__NN (e.g. RED1__RED2__01).
-- from_level_id / to_level_id are FKs to curriculum_levels.
-- to_level_id is NULL only for the HP 3 exit gate (no next level).
-- All rows are global platform data — no academy_id column.
-- Academies customise gates via academy_curriculum_overrides.
-- Source: AOS_Curriculum_Gates.xlsx — Gate Library sheet.
-- ============================================================

CREATE TABLE IF NOT EXISTS curriculum_gates (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_id           TEXT        NOT NULL UNIQUE,
  from_level_id     UUID        NOT NULL REFERENCES curriculum_levels(id) ON DELETE RESTRICT,
  to_level_id       UUID        REFERENCES curriculum_levels(id) ON DELETE RESTRICT,
  domain            TEXT        NOT NULL
                    CHECK (domain IN (
                      'Technical', 'Tactical', 'Movement',
                      'Competition', 'Mentality', 'Fitness Support'
                    )),
  criterion         TEXT        NOT NULL,
  gate_type         TEXT        NOT NULL
                    CHECK (gate_type IN (
                      'RATE', 'COUNT', 'OBSERVATION',
                      'TIME_WINDOW', 'CHECKLIST', 'RESULT'
                    )),
  threshold         TEXT        NOT NULL,
  recording_method  TEXT        NOT NULL,
  evidence_window   TEXT        NOT NULL,
  evaluator         TEXT        NOT NULL
                    CHECK (evaluator IN ('Coach', 'Director', 'S&C')),
  cadence           TEXT        NOT NULL,
  notes             TEXT,
  sort_order        INTEGER     NOT NULL DEFAULT 0,
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_gates_from_level
  ON curriculum_gates(from_level_id);

CREATE INDEX IF NOT EXISTS idx_curriculum_gates_to_level
  ON curriculum_gates(to_level_id)
  WHERE to_level_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_gates_domain
  ON curriculum_gates(domain);

CREATE INDEX IF NOT EXISTS idx_curriculum_gates_active
  ON curriculum_gates(is_active, sort_order)
  WHERE is_active = true;

ALTER TABLE curriculum_gates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read curriculum gates"
  ON curriculum_gates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Directors manage curriculum gates"
  ON curriculum_gates FOR ALL
  USING (auth_is_director_or_head());


-- ============================================================
-- TABLE: curriculum_drills
-- 152 drill definitions from AOS_Curriculum_Drills.xlsx.
-- drill_id uses the structured format DRILL_<STAGE>_<DOMAIN3>_<NUM>.
-- level_min_id / level_max_id bound the appropriate stage range.
-- coaching_cues is JSONB with four keys:
--   doing_well, working_on, current_focus, next_step
-- academy_id IS NULL  → global platform drill
-- academy_id NOT NULL → academy-specific addition
-- Source: AOS_Curriculum_Drills.xlsx — Drill Library sheet.
-- ============================================================

CREATE TABLE IF NOT EXISTS curriculum_drills (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_id            TEXT        NOT NULL UNIQUE,
  academy_id          UUID        REFERENCES academies(id) ON DELETE CASCADE,
  name                TEXT        NOT NULL,
  level_min_id        UUID        REFERENCES curriculum_levels(id) ON DELETE SET NULL,
  level_max_id        UUID        REFERENCES curriculum_levels(id) ON DELETE SET NULL,
  domain              TEXT        NOT NULL
                      CHECK (domain IN (
                        'Technical', 'Tactical', 'Movement',
                        'Competition', 'Mentality', 'Fitness'
                      )),
  session_block       TEXT        NOT NULL
                      CHECK (session_block IN (
                        'Warm-Up', 'Focus', 'Train', 'Play', 'Game'
                      )),
  objective           TEXT        NOT NULL,
  setup               TEXT,
  procedure           TEXT,
  coaching_cues       JSONB,
  progression_easier  TEXT,
  progression_harder  TEXT,
  success_criteria    TEXT,
  duration_minutes    INTEGER     CHECK (duration_minutes > 0),
  players_needed      INTEGER     CHECK (players_needed > 0),
  source_type         TEXT        NOT NULL DEFAULT 'global_default'
                      CHECK (source_type IN (
                        'global_default', 'academy_custom', 'imported'
                      )),
  is_active           BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Global drills: drill_id is unique where academy_id IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_curriculum_drills_global_unique
  ON curriculum_drills(drill_id)
  WHERE academy_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_drills_level_min
  ON curriculum_drills(level_min_id)
  WHERE level_min_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_drills_level_max
  ON curriculum_drills(level_max_id)
  WHERE level_max_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_drills_domain
  ON curriculum_drills(domain);

CREATE INDEX IF NOT EXISTS idx_curriculum_drills_session_block
  ON curriculum_drills(session_block);

CREATE INDEX IF NOT EXISTS idx_curriculum_drills_academy
  ON curriculum_drills(academy_id)
  WHERE academy_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_drills_active
  ON curriculum_drills(is_active)
  WHERE is_active = true;

CREATE TRIGGER trg_curriculum_drills_updated_at
  BEFORE UPDATE ON curriculum_drills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE curriculum_drills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read global drills"
  ON curriculum_drills FOR SELECT
  USING (auth.uid() IS NOT NULL AND academy_id IS NULL);

CREATE POLICY "Academy staff read academy drills"
  ON curriculum_drills FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors manage academy drills"
  ON curriculum_drills FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());


-- ============================================================
-- TABLE: curriculum_drill_tags
-- Normalised tag rows linked to curriculum_drills.
-- One row per tag per drill. Tags come from the Tags Index sheet.
-- Source: AOS_Curriculum_Drills.xlsx — Tags Index sheet.
-- ============================================================

CREATE TABLE IF NOT EXISTS curriculum_drill_tags (
  id        UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_id  UUID  NOT NULL REFERENCES curriculum_drills(id) ON DELETE CASCADE,
  tag       TEXT  NOT NULL,
  UNIQUE (drill_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_curriculum_drill_tags_drill
  ON curriculum_drill_tags(drill_id);

CREATE INDEX IF NOT EXISTS idx_curriculum_drill_tags_tag
  ON curriculum_drill_tags(tag);

ALTER TABLE curriculum_drill_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read drill tags"
  ON curriculum_drill_tags FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Directors manage drill tags"
  ON curriculum_drill_tags FOR ALL
  USING (auth_is_director_or_head());


-- ============================================================
-- TABLE: curriculum_coach_language
-- 120 coaching language entries: 15 levels × 8 domains × 4 phrases.
-- Phrases: Doing Well / Working On / Current Focus / Next Step.
-- level_id FK links to curriculum_levels (15 rows).
-- UNIQUE (level_id, domain) enforces one entry per cell.
-- All entries are global platform data — no academy_id column.
-- Academies customise language via academy_curriculum_overrides.
-- Source: AOS_Curriculum_CoachLanguage.xlsx — Coach Language (Long) sheet.
-- ============================================================

CREATE TABLE IF NOT EXISTS curriculum_coach_language (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id        UUID        NOT NULL REFERENCES curriculum_levels(id) ON DELETE CASCADE,
  domain          TEXT        NOT NULL
                  CHECK (domain IN (
                    'Technical', 'Tactical', 'Movement', 'Competition',
                    'Mentality', 'Fitness', 'Recovery', 'Lifestyle'
                  )),
  doing_well      TEXT        NOT NULL,
  working_on      TEXT        NOT NULL,
  current_focus   TEXT        NOT NULL,
  next_step       TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (level_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_curriculum_coach_language_level
  ON curriculum_coach_language(level_id);

CREATE INDEX IF NOT EXISTS idx_curriculum_coach_language_domain
  ON curriculum_coach_language(domain);

ALTER TABLE curriculum_coach_language ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read coach language"
  ON curriculum_coach_language FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Directors manage coach language"
  ON curriculum_coach_language FOR ALL
  USING (auth_is_director_or_head());


-- ============================================================
-- TABLE: curriculum_competition_track
-- 15-stage Competition Track: match format, scoring system,
-- opponent pool, tournament cadence, competition behaviors,
-- win/loss target, parent role, coach role, transition signal.
-- federation_note flags USTA-specific content requiring
-- substitution for non-US academies.
-- One row per curriculum level. Global reference data.
-- Source: AOS_Curriculum_Competition.xlsx — Competition Progression sheet.
-- ============================================================

CREATE TABLE IF NOT EXISTS curriculum_competition_track (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id              UUID        NOT NULL UNIQUE REFERENCES curriculum_levels(id) ON DELETE CASCADE,
  match_format          TEXT,
  scoring_system        TEXT,
  point_density         TEXT,
  opponent_pool         TEXT,
  tournament_cadence    TEXT,
  win_loss_target       TEXT,
  competition_behaviors TEXT,
  parent_role           TEXT,
  coach_role            TEXT,
  transition_signal     TEXT,
  federation_note       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_competition_track_level
  ON curriculum_competition_track(level_id);

ALTER TABLE curriculum_competition_track ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read competition track"
  ON curriculum_competition_track FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Directors manage competition track"
  ON curriculum_competition_track FOR ALL
  USING (auth_is_director_or_head());


-- ============================================================
-- TABLE: curriculum_fitness_guidance
-- 15-stage fitness progression: phase, energy systems, strength
-- band, key fitness tests, off-court volume targets.
-- fitness_phase maps to the four-phase model:
--   physical_literacy   → Red 1–3
--   athletic_foundation → Orange 1–3
--   sport_performance   → Green 1–3
--   high_performance    → Yellow 1 – HP 3
-- One row per curriculum level. Global reference data.
-- Source: AOS_Curriculum_Fitness.xlsx — Fitness Progression sheet.
-- ============================================================

CREATE TABLE IF NOT EXISTS curriculum_fitness_guidance (
  id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id                        UUID        NOT NULL UNIQUE REFERENCES curriculum_levels(id) ON DELETE CASCADE,
  fitness_phase                   TEXT        NOT NULL
                                  CHECK (fitness_phase IN (
                                    'physical_literacy', 'athletic_foundation',
                                    'sport_performance', 'high_performance'
                                  )),
  primary_energy_system           TEXT,
  strength_band                   TEXT,
  key_fitness_tests               TEXT[],
  off_court_sessions_per_week_min INTEGER,
  off_court_sessions_per_week_max INTEGER,
  coaching_notes                  TEXT,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_fitness_guidance_level
  ON curriculum_fitness_guidance(level_id);

CREATE INDEX IF NOT EXISTS idx_curriculum_fitness_guidance_phase
  ON curriculum_fitness_guidance(fitness_phase);

ALTER TABLE curriculum_fitness_guidance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read fitness guidance"
  ON curriculum_fitness_guidance FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Directors manage fitness guidance"
  ON curriculum_fitness_guidance FOR ALL
  USING (auth_is_director_or_head());


-- ============================================================
-- TABLE: curriculum_volume_guidance
-- 15-stage weekly volume guidance: hours, sessions, session
-- duration, stage duration, reassessment cadence, ACR target,
-- deload cadence, and overload flags.
--
-- acr_target_range is stored as TEXT (e.g. '0.8-1.2') until the
-- ACR definition is confirmed. Almost certainly Acute:Chronic
-- Workload Ratio — see docs/curriculum/angles-curriculum-synthesis.md
-- Section 14.1 for the open item. Do not build any load management
-- algorithm against this field until confirmed.
--
-- One row per curriculum level. Global reference data.
-- Source: AOS_Curriculum_Volume.xlsx — Volume Progression sheet.
-- ============================================================

CREATE TABLE IF NOT EXISTS curriculum_volume_guidance (
  id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id                        UUID        NOT NULL UNIQUE REFERENCES curriculum_levels(id) ON DELETE CASCADE,
  weekly_hours_min                NUMERIC(4,1),
  weekly_hours_max                NUMERIC(4,1),
  sessions_per_week_min           INTEGER,
  sessions_per_week_max           INTEGER,
  session_duration_min_minutes    INTEGER,
  session_duration_max_minutes    INTEGER,
  typical_stage_months_min        INTEGER,
  typical_stage_months_max        INTEGER,
  reassessment_cadence_weeks      INTEGER,
  acr_target_range                TEXT,
  deload_cadence                  TEXT,
  overload_flags                  TEXT[],
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_volume_guidance_level
  ON curriculum_volume_guidance(level_id);

ALTER TABLE curriculum_volume_guidance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read volume guidance"
  ON curriculum_volume_guidance FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Directors manage volume guidance"
  ON curriculum_volume_guidance FOR ALL
  USING (auth_is_director_or_head());


-- ============================================================
-- TABLE: curriculum_archetypes
-- 8 player archetypes (A1–A8) from AOS_Curriculum_StressTest.xlsx.
-- Informational reference data — surfaced in director and coach UI
-- to provide context. Not restrictive: archetype informs coaching
-- decisions but does not gate progression or change rules.
-- Global reference only — no academy_id column.
-- Source: AOS_Curriculum_StressTest.xlsx — Archetypes sheet.
-- ============================================================

CREATE TABLE IF NOT EXISTS curriculum_archetypes (
  id                          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tag                         TEXT  NOT NULL UNIQUE
                              CHECK (tag IN (
                                'A1', 'A2', 'A3', 'A4',
                                'A5', 'A6', 'A7', 'A8'
                              )),
  name                        TEXT  NOT NULL,
  entry_stage                 TEXT,
  description                 TEXT,
  primary_curriculum_protection TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE curriculum_archetypes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read archetypes"
  ON curriculum_archetypes FOR SELECT
  USING (auth.uid() IS NOT NULL);


-- ============================================================
-- TABLE: curriculum_failure_modes
-- 14 failure modes from AOS_Curriculum_StressTest.xlsx.
-- Treated as an engineering requirements backlog, not runtime data.
-- Severity distribution: 4 CRITICAL, 6 HIGH, 4 MEDIUM.
-- is_addressed tracks whether required_response has been
-- implemented in the application (updated manually via dashboard).
-- Global reference — no academy_id column.
-- Source: AOS_Curriculum_StressTest.xlsx — Failure Modes sheet.
-- ============================================================

CREATE TABLE IF NOT EXISTS curriculum_failure_modes (
  id                  UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  failure_mode_id     TEXT  NOT NULL UNIQUE,
  severity            TEXT  NOT NULL
                      CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  affected_stage      TEXT,
  affected_archetype  TEXT,
  risk_description    TEXT  NOT NULL,
  required_response   TEXT  NOT NULL,
  affected_components TEXT[],
  is_addressed        BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_failure_modes_severity
  ON curriculum_failure_modes(severity);

CREATE INDEX IF NOT EXISTS idx_curriculum_failure_modes_unaddressed
  ON curriculum_failure_modes(is_addressed)
  WHERE is_addressed = false;

ALTER TABLE curriculum_failure_modes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read failure modes"
  ON curriculum_failure_modes FOR SELECT
  USING (auth.uid() IS NOT NULL);


-- ============================================================
-- TABLE: drill_gate_mappings
-- Many-to-many join between curriculum_drills and curriculum_gates.
-- mapping_type values:
--   develops   — primary vehicle for building the gated competency
--   assesses   — activity directly generates gate evidence
--   reinforces — activity touches the gate criterion but is not primary
-- Initially empty. Populated per the mapping strategy confirmed
-- in Sprint 88 (manual curation, AI-assisted, or Phase 1 deferral).
-- ============================================================

CREATE TABLE IF NOT EXISTS drill_gate_mappings (
  id            UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_id      UUID  NOT NULL REFERENCES curriculum_drills(id) ON DELETE CASCADE,
  gate_id       UUID  NOT NULL REFERENCES curriculum_gates(id) ON DELETE CASCADE,
  mapping_type  TEXT  NOT NULL DEFAULT 'develops'
                CHECK (mapping_type IN ('develops', 'assesses', 'reinforces')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (drill_id, gate_id)
);

CREATE INDEX IF NOT EXISTS idx_drill_gate_mappings_drill
  ON drill_gate_mappings(drill_id);

CREATE INDEX IF NOT EXISTS idx_drill_gate_mappings_gate
  ON drill_gate_mappings(gate_id);

ALTER TABLE drill_gate_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read drill gate mappings"
  ON drill_gate_mappings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Directors manage drill gate mappings"
  ON drill_gate_mappings FOR ALL
  USING (auth_is_director_or_head());


-- ============================================================
-- PLAYER CURRICULUM STATE EXTENSIONS
-- Additive columns for Competition Track position and Fitness
-- Path phase. ADD COLUMN IF NOT EXISTS — safe to re-run.
--
-- competition_track_level_id: the player's current Competition
--   Track position. NULL until explicitly set by a director.
--   Advances independently from the Skill Track (current_level_id).
--
-- fitness_path_phase: the player's current Fitness Path phase.
--   Derived from Skill Track band but tracked separately per
--   FM-11 (return-to-play state can decouple the two).
-- ============================================================

ALTER TABLE player_curriculum_states
  ADD COLUMN IF NOT EXISTS competition_track_level_id UUID
    REFERENCES curriculum_levels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fitness_path_phase TEXT
    CHECK (fitness_path_phase IN (
      'physical_literacy', 'athletic_foundation',
      'sport_performance', 'high_performance'
    ));

CREATE INDEX IF NOT EXISTS idx_player_curriculum_states_comp_track
  ON player_curriculum_states(competition_track_level_id)
  WHERE competition_track_level_id IS NOT NULL;


-- ============================================================
-- PLAYER RECORD EXTENSIONS
-- Additive columns for archetypes, protection flags, and entry age.
-- All nullable or boolean with safe false defaults.
-- ADD COLUMN IF NOT EXISTS — safe to re-run. No existing rows affected.
--
-- FM references:
--   archetype_tag / archetype_secondary_tag → FM-14 (all archetypes)
--   recreation_flag                          → FM-06 (recreation players)
--   healthy_plateau_state                    → FM-07 (intentional plateau)
--   return_to_play_state                     → FM-11 (injury return)
--   entry_age                                → FM-02 (label suppression > 12)
-- ============================================================

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS archetype_tag TEXT
    CHECK (archetype_tag IN (
      'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'
    )),
  ADD COLUMN IF NOT EXISTS archetype_secondary_tag TEXT
    CHECK (archetype_secondary_tag IN (
      'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'
    )),
  ADD COLUMN IF NOT EXISTS recreation_flag        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS healthy_plateau_state  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS return_to_play_state   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS entry_age              INTEGER;

CREATE INDEX IF NOT EXISTS idx_players_archetype_tag
  ON players(archetype_tag)
  WHERE archetype_tag IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_players_recreation_flag
  ON players(recreation_flag)
  WHERE recreation_flag = true;

CREATE INDEX IF NOT EXISTS idx_players_return_to_play
  ON players(return_to_play_state)
  WHERE return_to_play_state = true;

-- ============================================================
-- DONE
-- ============================================================
