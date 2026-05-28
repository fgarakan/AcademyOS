-- ============================================================
-- ACADEMY OS — MIGRATION 005: ASSESSMENTS & PLACEMENT ENGINE
-- Assessment scoring, AI recommendations, and the ONLY function
-- that can activate a player: finalize_player_placement().
-- ============================================================

-- ============================================================
-- ASSESSMENT VERSIONS
-- Rubric definitions. Academy-configurable. Default rubric seeded in 024.
-- ============================================================
CREATE TABLE assessment_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  categories    JSONB NOT NULL,
  -- Structure:
  -- {
  --   "technical":   { "label": "Technical",   "weight": 0.30, "subcategories": ["forehand","backhand","serve","return","volley","overhead"] },
  --   "tactical":    { "label": "Tactical",     "weight": 0.20, "subcategories": ["patterns","positioning","decision_making","game_style"] },
  --   "movement":    { "label": "Movement",     "weight": 0.20, "subcategories": ["speed","agility","recovery","court_coverage"] },
  --   "competition": { "label": "Competition",  "weight": 0.15, "subcategories": ["pressure_handling","consistency","match_tactics","mental_resilience"] },
  --   "behavioral":  { "label": "Behavioral",   "weight": 0.15, "subcategories": ["attitude","effort","coachability","communication"] }
  -- }
  scoring_scale JSONB NOT NULL DEFAULT '{"min": 0, "max": 10, "step": 0.5}',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ASSESSMENTS
-- A scored evaluation of a player at a point in time.
-- overall_score is computed: weighted average of 5 dimensions.
-- ============================================================
CREATE TYPE assessment_type AS ENUM (
  'intake',        -- first-time placement assessment
  'quarterly',     -- scheduled periodic assessment
  'reassessment',  -- triggered by signals (overdue or flagged)
  'promotion',     -- specifically evaluating readiness for level-up
  'ad_hoc'         -- coach-initiated, not on schedule
);

CREATE TABLE assessments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  version_id        UUID REFERENCES assessment_versions(id),
  type              assessment_type NOT NULL DEFAULT 'ad_hoc',

  -- Top-level dimension scores (0.0–10.0, 0.5 increments enforced at app layer)
  technical_score   NUMERIC(4,2) CHECK (technical_score BETWEEN 0 AND 10),
  tactical_score    NUMERIC(4,2) CHECK (tactical_score BETWEEN 0 AND 10),
  movement_score    NUMERIC(4,2) CHECK (movement_score BETWEEN 0 AND 10),
  competition_score NUMERIC(4,2) CHECK (competition_score BETWEEN 0 AND 10),
  behavioral_score  NUMERIC(4,2) CHECK (behavioral_score BETWEEN 0 AND 10),

  -- Weighted overall (T:30% Tac:20% M:20% C:15% B:15%)
  overall_score     NUMERIC(4,2) GENERATED ALWAYS AS (
    ROUND(COALESCE(
      (COALESCE(technical_score,0)   * 0.30 +
       COALESCE(tactical_score,0)    * 0.20 +
       COALESCE(movement_score,0)    * 0.20 +
       COALESCE(competition_score,0) * 0.15 +
       COALESCE(behavioral_score,0)  * 0.15),
    0), 2)
  ) STORED,

  -- Subcategory detail (flexible JSONB)
  scores_detail     JSONB,
  -- {"technical": {"forehand": 7.5, "backhand": 8.0, "serve": 6.5, ...}, ...}

  -- Narrative
  notes             TEXT,
  strengths         TEXT[],
  weaknesses        TEXT[],
  priorities        TEXT[],  -- top 3 focus areas for next period

  -- Promotion signal
  promotion_ready   BOOLEAN NOT NULL DEFAULT false,
  promotion_notes   TEXT,

  -- Metadata
  assessed_by       UUID NOT NULL REFERENCES profiles(id),
  assessed_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  session_id        UUID,
  is_baseline       BOOLEAN NOT NULL DEFAULT false,
  voice_command_id  UUID,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assessments_player ON assessments(player_id, assessed_date DESC);
CREATE INDEX idx_assessments_type   ON assessments(academy_id, type, assessed_date DESC);

CREATE TRIGGER tr_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PLACEMENT RECOMMENDATIONS
-- AI-generated. Must go through approval before activation.
-- ============================================================
CREATE TYPE placement_status AS ENUM (
  'draft',       -- assessment in progress
  'generated',   -- AI output ready, awaiting human review
  'approved',    -- director/head approved the AI recommendation
  'overridden',  -- director changed one or more fields before approving
  'rejected',    -- will not proceed
  'activated'    -- finalize_player_placement() has been called
);

CREATE TABLE placement_recommendations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id                  UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id                   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  assessment_id               UUID REFERENCES assessments(id),
  status                      placement_status NOT NULL DEFAULT 'draft',

  -- AI recommendation
  recommended_track           development_track,
  recommended_level_id        UUID REFERENCES academy_levels(id),
  recommended_group_id        UUID REFERENCES groups(id),
  confidence_score            NUMERIC(4,3) CHECK (confidence_score BETWEEN 0 AND 1),
  recommendation_rationale    TEXT,
  recommendation_strengths    TEXT[],
  recommendation_weaknesses   TEXT[],
  recommended_priorities      TEXT[],
  recommended_reassessment_weeks INTEGER DEFAULT 10,

  -- Human override (if status = 'overridden', one or more of these is set)
  override_track              development_track,
  override_level_id           UUID REFERENCES academy_levels(id),
  override_group_id           UUID REFERENCES groups(id),
  override_reason             TEXT,
  overridden_by               UUID REFERENCES profiles(id),
  overridden_at               TIMESTAMPTZ,

  -- Approval
  approved_by                 UUID REFERENCES profiles(id),
  approved_at                 TIMESTAMPTZ,

  -- Activation
  activated_by                UUID REFERENCES profiles(id),
  activated_at                TIMESTAMPTZ,

  voice_command_id            UUID,
  created_by                  UUID REFERENCES profiles(id),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_placements_player ON placement_recommendations(player_id);
CREATE INDEX idx_placements_status ON placement_recommendations(academy_id, status);

CREATE TRIGGER tr_placements_updated_at
  BEFORE UPDATE ON placement_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FINALIZE_PLAYER_PLACEMENT()
-- The ONLY function that transitions a player to 'active'.
-- Called after: recommendation status = 'approved' or 'overridden'.
-- Side effects: updates group_memberships, players, audit_logs.
-- ============================================================
CREATE OR REPLACE FUNCTION finalize_player_placement(
  p_recommendation_id UUID,
  p_activator_id      UUID
)
RETURNS JSONB AS $$
DECLARE
  v_rec              placement_recommendations%ROWTYPE;
  v_player           players%ROWTYPE;
  v_group_id         UUID;
  v_level_id         UUID;
  v_track            development_track;
  v_reassessment_date DATE;
BEGIN
  SELECT * INTO v_rec FROM placement_recommendations
  WHERE id = p_recommendation_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Placement recommendation not found: %', p_recommendation_id;
  END IF;

  IF v_rec.status NOT IN ('approved', 'overridden') THEN
    RAISE EXCEPTION 'Recommendation must be approved before activation. Status: %', v_rec.status;
  END IF;

  -- Override fields take precedence if set
  v_group_id := COALESCE(v_rec.override_group_id, v_rec.recommended_group_id);
  v_level_id := COALESCE(v_rec.override_level_id, v_rec.recommended_level_id);
  v_track    := COALESCE(v_rec.override_track,     v_rec.recommended_track);

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'No group set in recommendation or override';
  END IF;

  SELECT * INTO v_player FROM players WHERE id = v_rec.player_id FOR UPDATE;

  v_reassessment_date := CURRENT_DATE +
    (COALESCE(v_rec.recommended_reassessment_weeks, 10) * INTERVAL '1 week');

  -- Close existing membership
  UPDATE group_memberships SET
    is_current = false,
    left_at    = NOW(),
    reason     = 'placement_activation',
    moved_by   = p_activator_id
  WHERE player_id = v_rec.player_id AND is_current = true;

  -- Open new membership
  INSERT INTO group_memberships (academy_id, player_id, group_id, joined_at, is_current, moved_by)
  VALUES (v_rec.academy_id, v_rec.player_id, v_group_id, NOW(), true, p_activator_id);

  -- Activate player
  UPDATE players SET
    status               = 'active',
    current_group_id     = v_group_id,
    current_level_id     = v_level_id,
    current_track        = v_track,
    last_assessed_at     = CURRENT_DATE,
    next_assessment_due  = v_reassessment_date,
    updated_at           = NOW()
  WHERE id = v_rec.player_id;

  -- Mark recommendation done
  UPDATE placement_recommendations SET
    status       = 'activated',
    activated_by = p_activator_id,
    activated_at = NOW(),
    updated_at   = NOW()
  WHERE id = p_recommendation_id;

  INSERT INTO audit_logs (
    academy_id, actor_id, actor_role, action, target_type, target_id, target_label,
    payload, source_type, voice_command_id
  )
  SELECT
    v_rec.academy_id,
    p_activator_id,
    m.role,
    'player.placement.finalized',
    'player',
    v_rec.player_id,
    v_player.full_name,
    jsonb_build_object(
      'recommendation_id',  p_recommendation_id,
      'group_id',           v_group_id,
      'level_id',           v_level_id,
      'track',              v_track,
      'reassessment_due',   v_reassessment_date,
      'confidence',         v_rec.confidence_score,
      'was_overridden',     (v_rec.status = 'overridden')
    ),
    CASE WHEN v_rec.voice_command_id IS NOT NULL THEN 'voice' ELSE 'ui' END,
    v_rec.voice_command_id
  FROM academy_memberships m
  WHERE m.profile_id = p_activator_id
  LIMIT 1;

  RETURN jsonb_build_object(
    'success',           true,
    'player_id',         v_rec.player_id,
    'group_id',          v_group_id,
    'level_id',          v_level_id,
    'track',             v_track,
    'reassessment_due',  v_reassessment_date,
    'activated_at',      NOW()
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE assessment_versions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see assessment versions"
  ON assessment_versions FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors manage assessment versions"
  ON assessment_versions FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Staff see assessments"
  ON assessments FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Players see own assessments"
  ON assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = assessments.player_id AND p.profile_id = auth.uid()
    )
  );

CREATE POLICY "Coaches create and update assessments"
  ON assessments FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff see placement recommendations"
  ON placement_recommendations FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors approve placements"
  ON placement_recommendations FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());
