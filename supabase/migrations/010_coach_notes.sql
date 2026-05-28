-- ============================================================
-- ACADEMY OS — MIGRATION 010: COACH NOTES AND OBSERVATIONS
-- Structured observations, voice notes (V1: typed), parent updates.
-- ============================================================

-- ============================================================
-- COACH OBSERVATIONS
-- Structured notes linked to a player. May be per-session or ad-hoc.
-- ============================================================
CREATE TABLE coach_observations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  coach_id          UUID NOT NULL REFERENCES profiles(id),
  session_id        UUID REFERENCES sessions(id),

  -- Structured tags
  observation_type  TEXT NOT NULL DEFAULT 'general'
                    CHECK (observation_type IN (
                      'general', 'technical', 'tactical', 'movement',
                      'competition', 'behavioral', 'injury_concern', 'positive_highlight'
                    )),
  tags              TEXT[],

  -- Content
  content           TEXT NOT NULL,
  is_private        BOOLEAN NOT NULL DEFAULT false,  -- private = not visible to parents

  -- AI parsing result (populated async)
  ai_parsed         BOOLEAN NOT NULL DEFAULT false,
  ai_parsed_at      TIMESTAMPTZ,
  ai_entities       JSONB,
  -- {
  --   "dimension": "technical",
  --   "specific_skill": "forehand_topspin",
  --   "sentiment": "positive",
  --   "suggested_tags": ["consistency", "footwork"],
  --   "priority_signal": false
  -- }

  voice_command_id  UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_observations_player  ON coach_observations(player_id, created_at DESC);
CREATE INDEX idx_observations_session ON coach_observations(session_id);
CREATE INDEX idx_observations_coach   ON coach_observations(coach_id, created_at DESC);
CREATE INDEX idx_observations_type    ON coach_observations(academy_id, observation_type);

CREATE TRIGGER tr_observations_updated_at
  BEFORE UPDATE ON coach_observations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VOICE NOTES
-- Transcribed observation fragments. V1: typed. V2: Whisper.
-- Separate from coach_observations to preserve raw input before parsing.
-- ============================================================
CREATE TABLE voice_notes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES profiles(id),
  player_id         UUID REFERENCES players(id),
  session_id        UUID REFERENCES sessions(id),

  raw_input         TEXT NOT NULL,
  audio_path        TEXT,        -- V2 only
  transcript        TEXT,        -- same as raw_input in V1

  -- Processing
  processing_status TEXT NOT NULL DEFAULT 'pending'
                    CHECK (processing_status IN ('pending', 'parsed', 'failed', 'discarded')),
  parsed_observation_id UUID REFERENCES coach_observations(id),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_voice_notes_author ON voice_notes(author_id, created_at DESC);
CREATE INDEX idx_voice_notes_player ON voice_notes(player_id);

-- ============================================================
-- PARENT UPDATES
-- AI-drafted updates for parents/guardians. Must be reviewed before sending.
-- ============================================================
CREATE TYPE parent_update_status AS ENUM (
  'draft',       -- AI-generated, not yet reviewed
  'reviewed',    -- coach reviewed and edited
  'approved',    -- director approved for sending
  'sent',        -- delivered to parent(s)
  'cancelled'    -- discarded
);

CREATE TABLE parent_updates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES profiles(id),

  subject         TEXT,
  content         TEXT NOT NULL,
  content_draft   TEXT,       -- original AI draft (preserved after editing)

  status          parent_update_status NOT NULL DEFAULT 'draft',

  -- Observations that contributed to this update
  source_observation_ids UUID[],

  -- Approval
  approved_by     UUID REFERENCES profiles(id),
  approved_at     TIMESTAMPTZ,

  -- Send record
  sent_at         TIMESTAMPTZ,
  sent_to         TEXT[],     -- email addresses actually sent to
  send_method     TEXT DEFAULT 'email',

  voice_command_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parent_updates_player ON parent_updates(player_id, created_at DESC);
CREATE INDEX idx_parent_updates_status ON parent_updates(academy_id, status);

CREATE TRIGGER tr_parent_updates_updated_at
  BEFORE UPDATE ON parent_updates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE coach_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_updates     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see observations"
  ON coach_observations FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Players see own non-private observations"
  ON coach_observations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = coach_observations.player_id
      AND p.profile_id = auth.uid()
    )
    AND is_private = false
  );

CREATE POLICY "Parents see non-private observations for their children"
  ON coach_observations FOR SELECT
  USING (
    is_private = false
    AND EXISTS (
      SELECT 1 FROM player_guardians pg
      JOIN guardians g ON g.id = pg.guardian_id
      WHERE pg.player_id = coach_observations.player_id
      AND g.profile_id = auth.uid()
    )
  );

CREATE POLICY "Coaches manage observations"
  ON coach_observations FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff see voice notes"
  ON voice_notes FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff manage voice notes"
  ON voice_notes FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff see parent updates"
  ON parent_updates FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors approve parent updates"
  ON parent_updates FOR UPDATE
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Coaches create parent updates"
  ON parent_updates FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_is_staff());

-- Parents can see sent updates for their children
CREATE POLICY "Parents see sent updates for their children"
  ON parent_updates FOR SELECT
  USING (
    status = 'sent'
    AND EXISTS (
      SELECT 1 FROM player_guardians pg
      JOIN guardians g ON g.id = pg.guardian_id
      WHERE pg.player_id = parent_updates.player_id
      AND g.profile_id = auth.uid()
    )
  );
