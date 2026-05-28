-- ============================================================
-- ACADEMY OS — MIGRATION 0006: COACH NOTES & OBSERVATIONS
-- ============================================================

-- ============================================================
-- OBSERVATION NOTE TYPES
-- ============================================================
CREATE TYPE note_visibility AS ENUM ('internal', 'parent_visible', 'player_visible', 'all');
CREATE TYPE note_source AS ENUM ('written', 'voice_transcript', 'voice_ai_parsed', 'assessment', 'session');

-- ============================================================
-- COACH OBSERVATIONS
-- The primary observation record. Written or voice-originated.
-- ============================================================
CREATE TABLE coach_observations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  coach_id          UUID NOT NULL REFERENCES profiles(id),
  session_id        UUID REFERENCES sessions(id), -- optional session link

  -- Content
  raw_text          TEXT NOT NULL,     -- original text (or voice transcript)
  ai_parsed_text    TEXT,              -- AI-cleaned/structured version
  parent_version    TEXT,              -- AI-generated parent-safe version (different from raw)

  -- Source
  source            note_source NOT NULL DEFAULT 'written',
  voice_note_id     UUID,              -- linked if voice-originated

  -- Classification
  visibility        note_visibility NOT NULL DEFAULT 'internal',
  category          TEXT,              -- 'technical' | 'tactical' | 'movement' | 'competition' | 'behavioral' | 'general'
  sentiment         TEXT,              -- 'positive' | 'concern' | 'neutral' | 'flag'

  -- Tags
  strengths_tags    TEXT[],            -- ['backhand_consistency', 'movement']
  weakness_tags     TEXT[],            -- ['serve_mechanics', 'net_approach']
  priority_tags     TEXT[],            -- development priorities identified

  -- AI insights
  ai_insights       JSONB,             -- structured extraction from AI
  -- {
  --   "strengths": ["..."],
  --   "concerns": ["..."],
  --   "priorities": ["..."],
  --   "suggested_exercises": ["exercise_id"],
  --   "promotion_signal": false,
  --   "reassessment_signal": false
  -- }

  -- Parent update tracking
  included_in_update_id UUID,          -- if used in a parent update

  voice_command_id  UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VOICE NOTES
-- Raw audio recordings before transcription. Placeholder for V2.
-- In V1: stores typed notes that go through the same pipeline.
-- ============================================================
CREATE TABLE voice_notes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  coach_id          UUID NOT NULL REFERENCES profiles(id),
  player_id         UUID REFERENCES players(id),     -- optional (can be group-level)
  session_id        UUID REFERENCES sessions(id),

  -- Audio (V2)
  audio_storage_path TEXT,          -- Supabase storage path
  audio_duration_sec INTEGER,

  -- Transcript
  transcript        TEXT,
  transcript_source TEXT DEFAULT 'manual', -- 'manual' | 'whisper' | 'other'
  transcript_confidence NUMERIC(4,3),

  -- Processing
  processing_status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'transcribing' | 'transcribed' | 'parsing' | 'parsed' | 'distributed' | 'failed'

  parsed_at         TIMESTAMPTZ,
  distributed_at    TIMESTAMPTZ,
  distribution_log  JSONB, -- which systems were updated
  -- {
  --   "player_profile": true,
  --   "assessment_engine": true,
  --   "session_system": true,
  --   "parent_comms": false,
  --   "director_dashboard": true,
  --   "ai_context_store": true,
  --   "exercise_library": true,
  --   "onboarding_engine": false
  -- }

  -- Generated observation
  observation_id    UUID REFERENCES coach_observations(id),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PARENT UPDATES
-- AI-drafted updates for parents. Must be coach-approved before sending.
-- ============================================================
CREATE TYPE update_status AS ENUM ('draft', 'pending_approval', 'approved', 'sent', 'archived');

CREATE TABLE parent_updates (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  coach_id          UUID NOT NULL REFERENCES profiles(id),

  -- Content
  subject           TEXT NOT NULL,
  ai_draft          TEXT NOT NULL,    -- original AI draft
  coach_version     TEXT,             -- coach edits
  final_text        TEXT,             -- what was actually sent

  -- Status
  status            update_status NOT NULL DEFAULT 'draft',
  approved_by       UUID REFERENCES profiles(id),
  approved_at       TIMESTAMPTZ,
  sent_at           TIMESTAMPTZ,
  sent_to           TEXT,             -- email/channel

  -- Sources used to generate this update
  source_observation_ids UUID[],
  source_assessment_ids  UUID[],
  period_start      DATE,
  period_end        DATE,

  -- Tone guidance used for generation
  tone_instructions TEXT,

  voice_command_id  UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE coach_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_updates ENABLE ROW LEVEL SECURITY;

-- Staff see all internal observations in their academy
CREATE POLICY "Staff see all observations"
  ON coach_observations FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

-- Players see their own parent-visible or player-visible observations
CREATE POLICY "Players see own visible observations"
  ON coach_observations FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
    AND visibility IN ('player_visible', 'all')
  );

-- Parents see parent-visible observations of their children
CREATE POLICY "Parents see children observations"
  ON coach_observations FOR SELECT
  USING (
    visibility IN ('parent_visible', 'all')
    AND player_id IN (
      SELECT pg.player_id FROM player_guardians pg
      JOIN guardians g ON g.id = pg.guardian_id
      WHERE g.profile_id = auth.uid()
    )
  );

-- Coaches create observations
CREATE POLICY "Coaches create observations"
  ON coach_observations FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_is_staff() AND coach_id = auth.uid());

-- Coaches update their own observations
CREATE POLICY "Coaches update own observations"
  ON coach_observations FOR UPDATE
  USING (coach_id = auth.uid() AND academy_id = auth_academy_id());

-- Voice notes: staff only
CREATE POLICY "Staff manage voice notes"
  ON voice_notes FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());

-- Parent updates: staff see all, parents see sent
CREATE POLICY "Staff manage parent updates"
  ON parent_updates FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Parents see sent updates for their children"
  ON parent_updates FOR SELECT
  USING (
    status = 'sent'
    AND player_id IN (
      SELECT pg.player_id FROM player_guardians pg
      JOIN guardians g ON g.id = pg.guardian_id
      WHERE g.profile_id = auth.uid()
    )
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_observations_player ON coach_observations(player_id, created_at DESC);
CREATE INDEX idx_observations_coach ON coach_observations(coach_id, created_at DESC);
CREATE INDEX idx_observations_visibility ON coach_observations(academy_id, visibility);
CREATE INDEX idx_voice_notes_coach ON voice_notes(coach_id, created_at DESC);
CREATE INDEX idx_voice_notes_status ON voice_notes(academy_id, processing_status);
CREATE INDEX idx_parent_updates_player ON parent_updates(player_id, created_at DESC);
CREATE INDEX idx_parent_updates_status ON parent_updates(academy_id, status);

CREATE TRIGGER tr_observations_updated_at BEFORE UPDATE ON coach_observations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_parent_updates_updated_at BEFORE UPDATE ON parent_updates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
