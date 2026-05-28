-- ============================================================
-- ACADEMY OS — MIGRATION 0004: ASSESSMENTS & PLACEMENT ENGINE
-- ============================================================

-- ============================================================
-- ASSESSMENT VERSIONS
-- The scoring rubric used for assessments. Academy-configurable.
-- ============================================================
CREATE TABLE assessment_versions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL, -- e.g., "Standard V1", "Junior Rubric"
  description     TEXT,
  categories      JSONB NOT NULL, -- structured rubric definition
  scoring_scale   JSONB NOT NULL DEFAULT '{"min": 0, "max": 10, "step": 0.5}',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_default      BOOLEAN NOT NULL DEFAULT false,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default rubric structure for categories JSONB:
-- {
--   "technical": {
--     "label": "Technical",
--     "subcategories": ["forehand", "backhand", "serve", "return", "volley", "overhead"]
--   },
--   "tactical": {
--     "label": "Tactical",
--     "subcategories": ["patterns", "positioning", "decision_making", "game_style"]
--   },
--   "movement": {
--     "label": "Movement",
--     "subcategories": ["speed", "agility", "recovery", "court_coverage"]
--   },
--   "competition": {
--     "label": "Competition",
--     "subcategories": ["pressure_handling", "consistency", "match_tactics", "mental_resilience"]
--   },
--   "behavioral": {
--     "label": "Behavioral",
--     "subcategories": ["attitude", "effort", "coachability", "communication"]
--   }
-- }

-- ============================================================
-- ASSESSMENTS
-- A scored evaluation of a player at a point in time
-- ============================================================
CREATE TYPE assessment_type AS ENUM ('intake', 'quarterly', 'reassessment', 'promotion', 'ad_hoc');

CREATE TABLE assessments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  version_id        UUID REFERENCES assessment_versions(id),
  type              assessment_type NOT NULL DEFAULT 'ad_hoc',

  -- Scores (top-level averages, 0.0–10.0)
  technical_score   NUMERIC(4,2),
  tactical_score    NUMERIC(4,2),
  movement_score    NUMERIC(4,2),
  competition_score NUMERIC(4,2),
  behavioral_score  NUMERIC(4,2),
  overall_score     NUMERIC(4,2) GENERATED ALWAYS AS (
    ROUND(COALESCE(
      (technical_score * 0.30 + tactical_score * 0.20 + movement_score * 0.20 + competition_score * 0.15 + behavioral_score * 0.15),
      0
    ), 2)
  ) STORED,

  -- Detailed scores (JSONB for subcategory flexibility)
  scores_detail     JSONB, -- {"technical": {"forehand": 7.5, "backhand": 8.0, ...}, ...}

  -- Narrative
  notes             TEXT,
  strengths         TEXT[],
  weaknesses        TEXT[],
  priorities        TEXT[], -- top 3 development priorities

  -- Promotion signal
  promotion_ready   BOOLEAN NOT NULL DEFAULT false,
  promotion_notes   TEXT,

  -- Context
  assessed_by       UUID NOT NULL REFERENCES profiles(id),
  assessed_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  session_id        UUID, -- optionally linked to a session
  is_baseline       BOOLEAN NOT NULL DEFAULT false,

  -- Voice source
  voice_command_id  UUID, -- if triggered by voice pipeline

  -- Audit
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PLACEMENT RECOMMENDATIONS
-- AI-generated recommendations awaiting human approval
-- ============================================================
CREATE TYPE placement_status AS ENUM (
  'draft',           -- being built (assessment in progress)
  'generated',       -- AI recommendation ready, awaiting review
  'approved',        -- director/head coach approved
  'overridden',      -- director modified AI recommendation
  'rejected',        -- not proceeding
  'activated'        -- player placed (finalize_player_placement called)
);

CREATE TABLE placement_recommendations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id            UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id             UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  assessment_id         UUID REFERENCES assessments(id),

  -- Status
  status                placement_status NOT NULL DEFAULT 'draft',

  -- AI recommendation
  recommended_track     development_track,
  recommended_level_id  UUID REFERENCES academy_levels(id),
  recommended_group_id  UUID REFERENCES groups(id),
  confidence_score      NUMERIC(4,3) CHECK (confidence_score BETWEEN 0 AND 1),
  recommendation_rationale TEXT,
  recommendation_strengths TEXT[],
  recommendation_weaknesses TEXT[],
  recommended_priorities TEXT[],
  recommended_reassessment_weeks INTEGER DEFAULT 10,

  -- Override (human modification)
  override_track        development_track,
  override_level_id     UUID REFERENCES academy_levels(id),
  override_group_id     UUID REFERENCES groups(id),
  override_reason       TEXT,
  overridden_by         UUID REFERENCES profiles(id),
  overridden_at         TIMESTAMPTZ,

  -- Approval
  approved_by           UUID REFERENCES profiles(id),
  approved_at           TIMESTAMPTZ,

  -- Activation
  activated_by          UUID REFERENCES profiles(id),
  activated_at          TIMESTAMPTZ,

  -- Voice source
  voice_command_id      UUID,

  created_by            UUID REFERENCES profiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FINALIZE_PLAYER_PLACEMENT()
-- The key function. Called after approval to activate a player.
-- This is the only way placement status changes to 'active'.
-- ============================================================
CREATE OR REPLACE FUNCTION finalize_player_placement(
  p_recommendation_id UUID,
  p_activator_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_rec placement_recommendations%ROWTYPE;
  v_player players%ROWTYPE;
  v_group_id UUID;
  v_level_id UUID;
  v_track development_track;
  v_reassessment_date DATE;
  v_result JSONB;
BEGIN
  -- Lock and fetch recommendation
  SELECT * INTO v_rec FROM placement_recommendations
  WHERE id = p_recommendation_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Placement recommendation not found: %', p_recommendation_id;
  END IF;

  IF v_rec.status NOT IN ('approved', 'overridden') THEN
    RAISE EXCEPTION 'Recommendation must be approved before activation. Current status: %', v_rec.status;
  END IF;

  -- Determine final values (use override if set, otherwise recommendation)
  v_group_id := COALESCE(v_rec.override_group_id, v_rec.recommended_group_id);
  v_level_id := COALESCE(v_rec.override_level_id, v_rec.recommended_level_id);
  v_track := COALESCE(v_rec.override_track, v_rec.recommended_track);

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'No group set in recommendation or override';
  END IF;

  -- Fetch player
  SELECT * INTO v_player FROM players WHERE id = v_rec.player_id FOR UPDATE;

  -- Calculate reassessment date
  v_reassessment_date := CURRENT_DATE + (COALESCE(v_rec.recommended_reassessment_weeks, 10) * INTERVAL '1 week');

  -- Deactivate existing group membership
  UPDATE group_memberships
  SET is_current = false,
      left_at = NOW(),
      reason = 'placement_activation',
      moved_by = p_activator_id
  WHERE player_id = v_rec.player_id AND is_current = true;

  -- Create new group membership
  INSERT INTO group_memberships (academy_id, player_id, group_id, joined_at, is_current, moved_by)
  VALUES (v_rec.academy_id, v_rec.player_id, v_group_id, NOW(), true, p_activator_id);

  -- Update player
  UPDATE players SET
    status = 'active',
    current_group_id = v_group_id,
    current_level_id = v_level_id,
    current_track = v_track,
    last_assessed_at = CURRENT_DATE,
    next_assessment_due = v_reassessment_date,
    updated_at = NOW()
  WHERE id = v_rec.player_id;

  -- Mark recommendation as activated
  UPDATE placement_recommendations SET
    status = 'activated',
    activated_by = p_activator_id,
    activated_at = NOW(),
    updated_at = NOW()
  WHERE id = p_recommendation_id;

  -- Create audit log
  INSERT INTO audit_logs (
    academy_id, actor_id, actor_role, action, target_type, target_id, target_label,
    payload, source_type, voice_command_id
  ) SELECT
    v_rec.academy_id,
    p_activator_id,
    m.role,
    'player.placement.finalized',
    'player',
    v_rec.player_id,
    v_player.full_name,
    jsonb_build_object(
      'recommendation_id', p_recommendation_id,
      'group_id', v_group_id,
      'level_id', v_level_id,
      'track', v_track,
      'reassessment_due', v_reassessment_date,
      'confidence', v_rec.confidence_score
    ),
    CASE WHEN v_rec.voice_command_id IS NOT NULL THEN 'voice' ELSE 'ui' END,
    v_rec.voice_command_id
  FROM academy_memberships m WHERE m.profile_id = p_activator_id LIMIT 1;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'player_id', v_rec.player_id,
    'group_id', v_group_id,
    'level_id', v_level_id,
    'track', v_track,
    'reassessment_due', v_reassessment_date,
    'activated_at', NOW()
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS FOR ASSESSMENT TABLES
-- ============================================================
ALTER TABLE assessment_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
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
  USING (EXISTS (SELECT 1 FROM players p WHERE p.id = assessments.player_id AND p.profile_id = auth.uid()));

CREATE POLICY "Coaches create assessments"
  ON assessments FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff see placement recommendations"
  ON placement_recommendations FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors approve placements"
  ON placement_recommendations FOR UPDATE
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_assessments_player ON assessments(player_id, assessed_date DESC);
CREATE INDEX idx_assessments_type ON assessments(academy_id, type, assessed_date DESC);
CREATE INDEX idx_placements_player ON placement_recommendations(player_id);
CREATE INDEX idx_placements_status ON placement_recommendations(academy_id, status);

CREATE TRIGGER tr_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_placements_updated_at BEFORE UPDATE ON placement_recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
