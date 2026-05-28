-- ============================================================
-- ACADEMY OS — MIGRATION 0010: FUNCTIONS & TRIGGERS
-- Additional business-logic functions and automation triggers.
--
-- Core functions already defined in earlier migrations:
--   update_updated_at()          → 0001_core_schema.sql
--   finalize_player_placement()  → 0004_assessments_placement.sql
--   execute_approved_action()    → 0007_voice_commands_proposed_actions.sql
--   write_audit_log()            → 0008_audit_logs_versioning.sql
--   take_snapshot()              → 0008_audit_logs_versioning.sql
--
-- This migration adds:
--   update_player_progression_from_assessment()
--   flag_overdue_reassessments()
--   create_session_from_template()
--   updated_at triggers on tables not yet covered
-- ============================================================

-- ============================================================
-- update_player_progression_from_assessment()
-- Called when an assessment is saved.
-- Updates player_progression with new current scores.
-- Sets baseline if this is the first assessment (is_baseline=true).
-- ============================================================
CREATE OR REPLACE FUNCTION update_player_progression_from_assessment(
  p_assessment_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_assessment assessments%ROWTYPE;
BEGIN
  SELECT * INTO v_assessment FROM assessments WHERE id = p_assessment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assessment not found: %', p_assessment_id;
  END IF;

  IF v_assessment.is_baseline THEN
    -- Upsert baseline AND current scores
    INSERT INTO player_progression (
      academy_id, player_id,
      technical_score, tactical_score, movement_score, competition_score, behavioral_score, overall_score,
      baseline_technical, baseline_tactical, baseline_movement, baseline_competition, baseline_behavioral, baseline_overall,
      baseline_set_at, updated_at
    ) VALUES (
      v_assessment.academy_id, v_assessment.player_id,
      v_assessment.technical_score, v_assessment.tactical_score, v_assessment.movement_score,
      v_assessment.competition_score, v_assessment.behavioral_score, v_assessment.overall_score,
      v_assessment.technical_score, v_assessment.tactical_score, v_assessment.movement_score,
      v_assessment.competition_score, v_assessment.behavioral_score, v_assessment.overall_score,
      NOW(), NOW()
    )
    ON CONFLICT (player_id) DO UPDATE SET
      technical_score   = EXCLUDED.technical_score,
      tactical_score    = EXCLUDED.tactical_score,
      movement_score    = EXCLUDED.movement_score,
      competition_score = EXCLUDED.competition_score,
      behavioral_score  = EXCLUDED.behavioral_score,
      overall_score     = EXCLUDED.overall_score,
      baseline_technical   = EXCLUDED.baseline_technical,
      baseline_tactical    = EXCLUDED.baseline_tactical,
      baseline_movement    = EXCLUDED.baseline_movement,
      baseline_competition = EXCLUDED.baseline_competition,
      baseline_behavioral  = EXCLUDED.baseline_behavioral,
      baseline_overall     = EXCLUDED.baseline_overall,
      baseline_set_at      = EXCLUDED.baseline_set_at,
      updated_at           = NOW();
  ELSE
    -- Update current scores only, preserve baseline
    INSERT INTO player_progression (
      academy_id, player_id,
      technical_score, tactical_score, movement_score, competition_score, behavioral_score, overall_score,
      updated_at
    ) VALUES (
      v_assessment.academy_id, v_assessment.player_id,
      v_assessment.technical_score, v_assessment.tactical_score, v_assessment.movement_score,
      v_assessment.competition_score, v_assessment.behavioral_score, v_assessment.overall_score,
      NOW()
    )
    ON CONFLICT (player_id) DO UPDATE SET
      technical_score   = EXCLUDED.technical_score,
      tactical_score    = EXCLUDED.tactical_score,
      movement_score    = EXCLUDED.movement_score,
      competition_score = EXCLUDED.competition_score,
      behavioral_score  = EXCLUDED.behavioral_score,
      overall_score     = EXCLUDED.overall_score,
      updated_at        = NOW();
  END IF;

  -- Update player's last_assessed_at
  UPDATE players SET
    last_assessed_at = v_assessment.assessed_date,
    status = CASE
      WHEN status = 'reassessment_due' THEN 'active'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = v_assessment.player_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: auto-update progression on assessment save
-- ============================================================
CREATE OR REPLACE FUNCTION tr_fn_assessment_to_progression()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_player_progression_from_assessment(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_assessment_update_progression
  AFTER INSERT OR UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION tr_fn_assessment_to_progression();

-- ============================================================
-- flag_overdue_reassessments()
-- Marks players as 'reassessment_due' when their due date has passed.
-- Run as a scheduled job (e.g., nightly via pg_cron or Supabase Edge Function).
-- ============================================================
CREATE OR REPLACE FUNCTION flag_overdue_reassessments()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE players SET
    status = 'reassessment_due',
    updated_at = NOW()
  WHERE
    is_active = true
    AND status = 'active'
    AND next_assessment_due IS NOT NULL
    AND next_assessment_due < CURRENT_DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- create_session_from_template()
-- Creates a session and copies template blocks to session blocks.
-- Session blocks are independent copies — editing them does not
-- modify the source template.
-- ============================================================
CREATE OR REPLACE FUNCTION create_session_from_template(
  p_template_id   UUID,
  p_group_id      UUID,
  p_coach_id      UUID,
  p_date          DATE,
  p_academy_id    UUID,
  p_created_by    UUID,
  p_voice_command_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_block      template_blocks%ROWTYPE;
  v_new_block_id UUID;
BEGIN
  -- Create the session
  INSERT INTO sessions (
    academy_id, template_id, group_id, coach_id,
    scheduled_date, status, voice_command_id, created_by
  ) VALUES (
    p_academy_id, p_template_id, p_group_id, p_coach_id,
    p_date, 'planned', p_voice_command_id, p_created_by
  ) RETURNING id INTO v_session_id;

  -- Copy template blocks as session blocks
  FOR v_block IN
    SELECT * FROM template_blocks
    WHERE template_id = p_template_id
    ORDER BY order_index
  LOOP
    INSERT INTO session_blocks (
      session_id, template_block_id, type, name,
      duration_min, intensity, order_index, notes, is_override
    ) VALUES (
      v_session_id, v_block.id, v_block.type, v_block.name,
      v_block.duration_min, v_block.intensity, v_block.order_index,
      v_block.notes, false
    ) RETURNING id INTO v_new_block_id;

    -- Copy template block exercises to session block exercises
    INSERT INTO session_block_exercises (
      block_id, exercise_id, order_index, duration_min, notes, completed
    )
    SELECT
      v_new_block_id, exercise_id, order_index, duration_min, notes, false
    FROM template_block_exercises
    WHERE block_id = v_block.id;
  END LOOP;

  -- Write audit log
  PERFORM write_audit_log(
    p_academy_id, p_created_by,
    'session.created_from_template',
    'session', v_session_id, NULL,
    jsonb_build_object('template_id', p_template_id, 'group_id', p_group_id, 'date', p_date),
    CASE WHEN p_voice_command_id IS NOT NULL THEN 'voice' ELSE 'ui' END,
    p_voice_command_id
  );

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- UPDATED_AT TRIGGERS — tables not covered in earlier migrations
-- ============================================================
CREATE TRIGGER tr_session_blocks_updated_at
  BEFORE UPDATE ON session_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_guardians_updated_at
  BEFORE UPDATE ON guardians
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
