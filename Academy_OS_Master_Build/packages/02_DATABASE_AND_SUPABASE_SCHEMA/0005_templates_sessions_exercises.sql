-- ============================================================
-- ACADEMY OS — MIGRATION 0005: TEMPLATES, SESSIONS, EXERCISES
-- The training system. Templates define structure; sessions are instances.
-- KEY RULE: template default order ≠ session runtime order
-- ============================================================

-- ============================================================
-- EXERCISE LIBRARY
-- ============================================================
CREATE TYPE exercise_category AS ENUM ('technical', 'tactical', 'movement', 'fitness', 'competition', 'mental', 'warm_up', 'cool_down');

CREATE TABLE exercises (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        exercise_category NOT NULL,
  subcategory     TEXT,  -- e.g., 'forehand', 'serve', 'net_play'
  description     TEXT,
  instructions    TEXT,
  coaching_points TEXT,  -- what to watch for and correct
  duration_min    INTEGER, -- typical duration in minutes
  equipment       TEXT[],
  tags            TEXT[],
  level_range     JSONB, -- {"min": 1, "max": 6}
  track           development_track, -- NULL means all tracks
  video_url       TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BLOCK TYPES
-- A block is a segment within a session (warm-up, technical, etc.)
-- ============================================================
CREATE TYPE block_type AS ENUM ('warm_up', 'technical', 'tactical', 'movement', 'fitness', 'competition', 'mental', 'cool_down', 'free');

-- ============================================================
-- TEMPLATES
-- Reusable session blueprints. Owned by the academy.
-- ============================================================
CREATE TABLE templates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  group_id        UUID REFERENCES groups(id),
  track           development_track,
  level_id        UUID REFERENCES academy_levels(id),
  total_duration_min INTEGER,
  tags            TEXT[],
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_default      BOOLEAN NOT NULL DEFAULT false, -- the starting template for new sessions in this group
  created_by      UUID REFERENCES profiles(id),
  voice_command_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TEMPLATE BLOCKS
-- The default block structure within a template.
-- IMPORTANT: This is the TEMPLATE default order.
-- Live sessions can override this without changing the template.
-- ============================================================
CREATE TABLE template_blocks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id     UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  type            block_type NOT NULL,
  name            TEXT NOT NULL,
  duration_min    INTEGER NOT NULL,
  intensity       INTEGER CHECK (intensity BETWEEN 1 AND 5), -- 1=low, 5=maximum
  order_index     INTEGER NOT NULL, -- TEMPLATE default order (immutable during sessions)
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TEMPLATE BLOCK EXERCISES
-- Exercises assigned to template blocks
-- ============================================================
CREATE TABLE template_block_exercises (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_id        UUID NOT NULL REFERENCES template_blocks(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises(id),
  order_index     INTEGER NOT NULL,
  duration_min    INTEGER,
  notes           TEXT
);

-- ============================================================
-- SESSIONS
-- A live instance of a template on a specific date.
-- Sessions do NOT modify templates.
-- ============================================================
CREATE TYPE session_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  template_id     UUID REFERENCES templates(id),
  group_id        UUID REFERENCES groups(id),
  coach_id        UUID NOT NULL REFERENCES profiles(id),
  name            TEXT,
  scheduled_date  DATE NOT NULL,
  scheduled_time  TIME,
  duration_min    INTEGER,
  location        TEXT,
  status          session_status NOT NULL DEFAULT 'planned',
  session_notes   TEXT,          -- coach's overall session notes
  ai_pre_brief    TEXT,          -- AI-generated pre-session brief
  voice_command_id UUID,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SESSION BLOCKS
-- The ACTUAL block structure for a session.
-- Copied from template at creation, then overrideable.
-- Changing session blocks does NOT change the template.
-- ============================================================
CREATE TABLE session_blocks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  template_block_id UUID REFERENCES template_blocks(id), -- original template block
  type            block_type NOT NULL,
  name            TEXT NOT NULL,
  duration_min    INTEGER NOT NULL,
  intensity       INTEGER CHECK (intensity BETWEEN 1 AND 5),
  order_index     INTEGER NOT NULL, -- SESSION runtime order (can differ from template)
  notes           TEXT,
  is_override     BOOLEAN NOT NULL DEFAULT false -- true if different from template
);

-- ============================================================
-- SESSION BLOCK EXERCISES
-- Exercises within a session's blocks. Overrideable from template.
-- ============================================================
CREATE TABLE session_block_exercises (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_id        UUID NOT NULL REFERENCES session_blocks(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises(id),
  order_index     INTEGER NOT NULL,
  duration_min    INTEGER,
  notes           TEXT,
  completed       BOOLEAN NOT NULL DEFAULT false
);

-- ============================================================
-- SESSION ATTENDANCE
-- Which players attended which sessions
-- ============================================================
CREATE TABLE session_attendance (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'present', -- 'present' | 'absent' | 'late' | 'excused'
  notes           TEXT,
  marked_by       UUID REFERENCES profiles(id),
  marked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, player_id)
);

-- ============================================================
-- LOAD MANAGEMENT VIEW
-- Detects overload when skill + competition + fitness are all high intensity
-- (Defined in migration 0011 — views)
-- ============================================================

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_block_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_block_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All staff see exercises"
  ON exercises FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff manage exercises"
  ON exercises FOR ALL USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff see templates"
  ON templates FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff manage templates"
  ON templates FOR ALL USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff see sessions"
  ON sessions FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Players see their sessions"
  ON sessions FOR SELECT USING (
    academy_id = auth_academy_id()
    AND EXISTS (
      SELECT 1 FROM session_attendance sa
      JOIN players p ON p.id = sa.player_id
      WHERE sa.session_id = sessions.id AND p.profile_id = auth.uid()
    )
  );

CREATE POLICY "Coaches manage sessions"
  ON sessions FOR ALL USING (academy_id = auth_academy_id() AND auth_is_staff());

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_exercises_academy ON exercises(academy_id, category);
CREATE INDEX idx_templates_academy ON templates(academy_id, group_id);
CREATE INDEX idx_sessions_date ON sessions(academy_id, scheduled_date);
CREATE INDEX idx_sessions_coach ON sessions(coach_id, scheduled_date);
CREATE INDEX idx_sessions_group ON sessions(group_id, scheduled_date);
CREATE INDEX idx_attendance_player ON session_attendance(player_id);
CREATE INDEX idx_attendance_session ON session_attendance(session_id);

CREATE TRIGGER tr_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
