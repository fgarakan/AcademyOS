-- ============================================================
-- ACADEMY OS — MIGRATION 012: FUNCTIONS AND TRIGGERS
-- Automation: assessment → progression, overdue flags,
-- session-from-template creation.
-- ============================================================

-- ============================================================
-- update_player_progression_from_assessment()
-- Called automatically when an assessment is inserted or updated.
-- Upserts player_progression with latest scores.
-- If is_baseline = true, also sets the baseline_ fields.
-- ============================================================
CREATE OR REPLACE FUNCTION update_player_progression_from_assessment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Upsert the progression row
    INSERT INTO player_progression (
      academy_id, player_id,
      technical_score, tactical_score, movement_score,
      competition_score, behavioral_score, overall_score,
      focus_areas, strengths, weaknesses,
      baseline_technical, baseline_tactical, baseline_movement,
      baseline_competition, baseline_behavioral, baseline_overall,
      baseline_set_at,
      updated_at
    )
    VALUES (
      NEW.academy_id,
      NEW.player_id,
      NEW.technical_score, NEW.tactical_score, NEW.movement_score,
      NEW.competition_score, NEW.behavioral_score, NEW.overall_score,
      NEW.priorities, NEW.strengths, NEW.weaknesses,
      -- Only set baseline fields if this is a baseline assessment
      CASE WHEN NEW.is_baseline THEN NEW.technical_score   ELSE NULL END,
      CASE WHEN NEW.is_baseline THEN NEW.tactical_score    ELSE NULL END,
      CASE WHEN NEW.is_baseline THEN NEW.movement_score    ELSE NULL END,
      CASE WHEN NEW.is_baseline THEN NEW.competition_score ELSE NULL END,
      CASE WHEN NEW.is_baseline THEN NEW.behavioral_score  ELSE NULL END,
      CASE WHEN NEW.is_baseline THEN NEW.overall_score     ELSE NULL END,
      CASE WHEN NEW.is_baseline THEN NOW()                 ELSE NULL END,
      NOW()
    )
    ON CONFLICT (player_id) DO UPDATE SET
      technical_score   = EXCLUDED.technical_score,
      tactical_score    = EXCLUDED.tactical_score,
      movement_score    = EXCLUDED.movement_score,
      competition_score = EXCLUDED.competition_score,
      behavioral_score  = EXCLUDED.behavioral_score,
      overall_score     = EXCLUDED.overall_score,
      focus_areas       = COALESCE(EXCLUDED.focus_areas, player_progression.focus_areas),
      strengths         = COALESCE(EXCLUDED.strengths, player_progression.strengths),
      weaknesses        = COALESCE(EXCLUDED.weaknesses, player_progression.weaknesses),
      -- Baseline: only overwrite if this assessment IS the baseline
      baseline_technical   = CASE WHEN NEW.is_baseline THEN EXCLUDED.baseline_technical   ELSE player_progression.baseline_technical   END,
      baseline_tactical    = CASE WHEN NEW.is_baseline THEN EXCLUDED.baseline_tactical    ELSE player_progression.baseline_tactical    END,
      baseline_movement    = CASE WHEN NEW.is_baseline THEN EXCLUDED.baseline_movement    ELSE player_progression.baseline_movement    END,
      baseline_competition = CASE WHEN NEW.is_baseline THEN EXCLUDED.baseline_competition ELSE player_progression.baseline_competition END,
      baseline_behavioral  = CASE WHEN NEW.is_baseline THEN EXCLUDED.baseline_behavioral  ELSE player_progression.baseline_behavioral  END,
      baseline_overall     = CASE WHEN NEW.is_baseline THEN EXCLUDED.baseline_overall     ELSE player_progression.baseline_overall     END,
      baseline_set_at      = CASE WHEN NEW.is_baseline THEN EXCLUDED.baseline_set_at      ELSE player_progression.baseline_set_at      END,
      updated_at        = NOW();

    -- Update last_assessed_at on player
    UPDATE players SET
      last_assessed_at = NEW.assessed_date,
      updated_at       = NOW()
    WHERE id = NEW.player_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_assessment_update_progression
  AFTER INSERT OR UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_player_progression_from_assessment();

-- ============================================================
-- flag_overdue_reassessments()
-- Run nightly via pg_cron or Supabase scheduled function.
-- Updates player status to 'reassessment_due' when past deadline.
-- ============================================================
CREATE OR REPLACE FUNCTION flag_overdue_reassessments()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE players SET
    status     = 'reassessment_due',
    updated_at = NOW()
  WHERE status = 'active'
  AND is_active = true
  AND next_assessment_due IS NOT NULL
  AND next_assessment_due < CURRENT_DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO audit_logs (
    academy_id, action, target_type,
    payload, source_type
  )
  SELECT DISTINCT
    academy_id,
    'system.reassessment.flagged',
    'player',
    jsonb_build_object('count', v_count, 'flagged_at', NOW()),
    'system'
  FROM players
  WHERE status = 'reassessment_due'
  AND updated_at > NOW() - INTERVAL '1 minute';

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- create_session_from_template()
-- Copies template blocks into session_blocks.
-- Preserves template default order in order_index.
-- Called after session INSERT when template_id is set.
-- ============================================================
CREATE OR REPLACE FUNCTION create_session_from_template(
  p_session_id  UUID,
  p_template_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_block_count INTEGER := 0;
  v_block       template_blocks%ROWTYPE;
  v_session_block_id UUID;
  v_exer        template_block_exercises%ROWTYPE;
BEGIN
  FOR v_block IN
    SELECT * FROM template_blocks
    WHERE template_id = p_template_id
    ORDER BY order_index
  LOOP
    INSERT INTO session_blocks (
      session_id, template_block_id, type, name,
      duration_min, intensity, order_index, notes, is_override
    ) VALUES (
      p_session_id,
      v_block.id,
      v_block.type,
      v_block.name,
      v_block.duration_min,
      v_block.intensity,
      v_block.order_index,
      v_block.notes,
      false
    ) RETURNING id INTO v_session_block_id;

    -- Copy exercises for each block
    FOR v_exer IN
      SELECT * FROM template_block_exercises
      WHERE block_id = v_block.id
      ORDER BY order_index
    LOOP
      INSERT INTO session_block_exercises (
        block_id, exercise_id, order_index, duration_min, notes
      ) VALUES (
        v_session_block_id,
        v_exer.exercise_id,
        v_exer.order_index,
        v_exer.duration_min,
        v_exer.notes
      );
    END LOOP;

    v_block_count := v_block_count + 1;
  END LOOP;

  RETURN v_block_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-populate session blocks when template_id is set on INSERT
CREATE OR REPLACE FUNCTION auto_create_session_blocks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_id IS NOT NULL THEN
    PERFORM create_session_from_template(NEW.id, NEW.template_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_session_auto_populate_blocks
  AFTER INSERT ON sessions
  FOR EACH ROW EXECUTE FUNCTION auto_create_session_blocks();
