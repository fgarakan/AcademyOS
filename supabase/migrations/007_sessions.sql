-- ============================================================
-- ACADEMY OS — MIGRATION 007: SESSIONS
-- Live session instances, blocks, exercises, attendance.
-- Fix applied: session_blocks.updated_at added (was missing in package spec).
-- KEY RULE: session block reordering NEVER modifies the template.
-- ============================================================

-- ============================================================
-- SESSION STATUS ENUM
-- ============================================================
CREATE TYPE session_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- ============================================================
-- SESSIONS
-- An instance of a template on a specific date.
-- ============================================================
CREATE TABLE sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id       UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  template_id      UUID REFERENCES templates(id),
  group_id         UUID REFERENCES groups(id),
  coach_id         UUID NOT NULL REFERENCES profiles(id),
  name             TEXT,
  scheduled_date   DATE NOT NULL,
  scheduled_time   TIME,
  duration_min     INTEGER,
  location         TEXT,
  status           session_status NOT NULL DEFAULT 'planned',
  session_notes    TEXT,
  ai_pre_brief     TEXT,   -- AI-generated pre-session brief (populated async after creation)
  voice_command_id UUID,
  created_by       UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_date    ON sessions(academy_id, scheduled_date);
CREATE INDEX idx_sessions_coach   ON sessions(coach_id, scheduled_date);
CREATE INDEX idx_sessions_group   ON sessions(group_id, scheduled_date);
CREATE INDEX idx_sessions_status  ON sessions(academy_id, status, scheduled_date);

CREATE TRIGGER tr_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SESSION BLOCKS
-- Copied from template at session creation. Can be reordered or overridden.
-- updated_at added here — needed for override tracking.
-- ============================================================
CREATE TABLE session_blocks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  template_block_id UUID REFERENCES template_blocks(id),
  type              block_type NOT NULL,
  name              TEXT NOT NULL,
  duration_min      INTEGER NOT NULL CHECK (duration_min > 0),
  intensity         INTEGER CHECK (intensity BETWEEN 1 AND 5),
  order_index       INTEGER NOT NULL,  -- SESSION runtime order; differs from template if reordered
  notes             TEXT,
  is_override       BOOLEAN NOT NULL DEFAULT false,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_blocks_session ON session_blocks(session_id, order_index);

CREATE TRIGGER tr_session_blocks_updated_at
  BEFORE UPDATE ON session_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SESSION BLOCK EXERCISES
-- Exercises within a session's blocks. Overrideable from template defaults.
-- ============================================================
CREATE TABLE session_block_exercises (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id    UUID NOT NULL REFERENCES session_blocks(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  order_index INTEGER NOT NULL,
  duration_min INTEGER,
  notes       TEXT,
  completed   BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_session_block_exercises_block ON session_block_exercises(block_id);

-- ============================================================
-- SESSION ATTENDANCE
-- ============================================================
CREATE TABLE session_attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'present'
              CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes       TEXT,
  marked_by   UUID REFERENCES profiles(id),
  marked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, player_id)
);

CREATE INDEX idx_attendance_player  ON session_attendance(player_id);
CREATE INDEX idx_attendance_session ON session_attendance(session_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_blocks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_block_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see sessions"
  ON sessions FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Players see their sessions"
  ON sessions FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND EXISTS (
      SELECT 1 FROM session_attendance sa
      JOIN players p ON p.id = sa.player_id
      WHERE sa.session_id = sessions.id AND p.profile_id = auth.uid()
    )
  );

CREATE POLICY "Staff manage sessions"
  ON sessions FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff see session blocks"
  ON session_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_blocks.session_id
      AND s.academy_id = auth_academy_id()
      AND auth_is_staff()
    )
  );

CREATE POLICY "Staff manage session blocks"
  ON session_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_blocks.session_id
      AND s.academy_id = auth_academy_id()
      AND auth_is_staff()
    )
  );

CREATE POLICY "Staff see attendance"
  ON session_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_attendance.session_id
      AND s.academy_id = auth_academy_id()
      AND auth_is_staff()
    )
  );

CREATE POLICY "Staff manage attendance"
  ON session_attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_attendance.session_id
      AND s.academy_id = auth_academy_id()
      AND auth_is_staff()
    )
  );
