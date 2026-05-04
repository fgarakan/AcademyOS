-- ============================================================
-- ACADEMY OS — MIGRATION 054: EXPAND EXECUTE_APPROVED_ACTION COVERAGE
-- Adds 6 new WHEN clauses to execute_approved_action():
--   modify_session, create_template, modify_template,
--   create_placement_assessment, adjust_session_intensity, flag_player
--
-- Excluded (rationale in approved-action-execution-coverage-plan.md):
--   generate_parent_update — no parent comms table
--   create_player          — too many required NOT NULL fields for safe voice mapping
--   create_exercise        — exercise library schema needs separate sprint
--   other                  — catch-all, no execution semantics
--
-- CRITICAL: execute_approved_action() is the ONLY path to execute
--           a voice command. Architecture red line — never bypass.
-- ============================================================

CREATE OR REPLACE FUNCTION execute_approved_action(
  p_action_id   UUID,
  p_executor_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_action       proposed_actions%ROWTYPE;
  v_payload      JSONB;
  v_result       JSONB;
  v_created_ids  UUID[] := '{}';
  v_session_id   UUID;
  v_template_id  UUID;
  v_assessment_id UUID;
BEGIN
  SELECT * INTO v_action FROM proposed_actions
  WHERE id = p_action_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposed action not found: %', p_action_id;
  END IF;

  IF v_action.status NOT IN ('approved', 'modified') THEN
    RAISE EXCEPTION 'Action must be approved before execution. Status: %', v_action.status;
  END IF;

  IF v_action.expires_at < NOW() THEN
    UPDATE proposed_actions SET status = 'expired', updated_at = NOW() WHERE id = p_action_id;
    RAISE EXCEPTION 'Action expired at %', v_action.expires_at;
  END IF;

  v_payload := COALESCE(v_action.modified_payload, v_action.proposed_payload);

  CASE v_action.action_type

    -- ── Existing: create_session ───────────────────────────────
    WHEN 'create_session' THEN
      INSERT INTO sessions (
        academy_id, template_id, group_id, coach_id,
        scheduled_date, duration_min, status, voice_command_id
      ) VALUES (
        v_action.academy_id,
        (v_payload->>'template_id')::UUID,
        (v_payload->>'group_id')::UUID,
        (v_payload->>'coach_id')::UUID,
        (v_payload->>'date')::DATE,
        (v_payload->>'duration_min')::INTEGER,
        'planned',
        v_action.voice_command_id
      ) RETURNING id INTO v_session_id;
      v_created_ids := array_append(v_created_ids, v_session_id);
      v_result := jsonb_build_object('session_id', v_session_id);

    -- ── Existing: cancel_session ───────────────────────────────
    WHEN 'cancel_session' THEN
      UPDATE sessions SET
        status     = 'cancelled',
        updated_at = NOW()
      WHERE id = (v_payload->>'session_id')::UUID
      AND academy_id = v_action.academy_id;
      v_result := jsonb_build_object(
        'session_id', v_payload->>'session_id',
        'status', 'cancelled'
      );

    -- ── Existing: assign_group ────────────────────────────────
    WHEN 'assign_group' THEN
      UPDATE players SET
        current_group_id = (v_payload->>'group_id')::UUID,
        updated_at       = NOW()
      WHERE id = (v_payload->>'player_id')::UUID
      AND academy_id = v_action.academy_id;
      v_result := jsonb_build_object(
        'player_id', v_payload->>'player_id',
        'group_id',  v_payload->>'group_id'
      );

    -- ── Existing: move_player_group ───────────────────────────
    WHEN 'move_player_group' THEN
      UPDATE group_memberships SET
        is_current = false,
        left_at    = NOW(),
        reason     = COALESCE(v_payload->>'reason', 'voice_command'),
        moved_by   = p_executor_id
      WHERE player_id = (v_payload->>'player_id')::UUID AND is_current = true;
      INSERT INTO group_memberships (
        academy_id, player_id, group_id, joined_at, is_current, moved_by
      ) VALUES (
        v_action.academy_id,
        (v_payload->>'player_id')::UUID,
        (v_payload->>'to_group_id')::UUID,
        NOW(), true, p_executor_id
      );
      UPDATE players SET
        current_group_id = (v_payload->>'to_group_id')::UUID,
        updated_at       = NOW()
      WHERE id = (v_payload->>'player_id')::UUID
      AND academy_id = v_action.academy_id;
      v_result := jsonb_build_object(
        'player_id',   v_payload->>'player_id',
        'to_group_id', v_payload->>'to_group_id'
      );

    -- ── Existing: schedule_reassessment ───────────────────────
    WHEN 'schedule_reassessment' THEN
      UPDATE players SET
        next_assessment_due = (v_payload->>'date')::DATE,
        updated_at          = NOW()
      WHERE id = (v_payload->>'player_id')::UUID
      AND academy_id = v_action.academy_id;
      v_result := jsonb_build_object(
        'player_id', v_payload->>'player_id',
        'date',      v_payload->>'date'
      );

    -- ── New: modify_session ───────────────────────────────────
    -- Payload: { session_id, date?, duration_min?, coach_id?, template_id? }
    WHEN 'modify_session' THEN
      UPDATE sessions SET
        scheduled_date = COALESCE(
          CASE WHEN v_payload ? 'date' THEN (v_payload->>'date')::DATE ELSE NULL END,
          scheduled_date
        ),
        duration_min   = COALESCE(
          CASE WHEN v_payload ? 'duration_min' THEN (v_payload->>'duration_min')::INTEGER ELSE NULL END,
          duration_min
        ),
        coach_id       = COALESCE(
          CASE WHEN v_payload ? 'coach_id' THEN (v_payload->>'coach_id')::UUID ELSE NULL END,
          coach_id
        ),
        template_id    = COALESCE(
          CASE WHEN v_payload ? 'template_id' THEN (v_payload->>'template_id')::UUID ELSE NULL END,
          template_id
        ),
        updated_at     = NOW()
      WHERE id = (v_payload->>'session_id')::UUID
      AND academy_id = v_action.academy_id;
      v_result := jsonb_build_object(
        'session_id', v_payload->>'session_id',
        'updated',    true
      );

    -- ── New: create_template ──────────────────────────────────
    -- Payload: { name, group_id?, track?, total_duration_min?, description? }
    WHEN 'create_template' THEN
      INSERT INTO templates (
        academy_id,
        name,
        group_id,
        track,
        total_duration_min,
        description,
        voice_command_id,
        created_by
      ) VALUES (
        v_action.academy_id,
        v_payload->>'name',
        CASE WHEN v_payload ? 'group_id' THEN (v_payload->>'group_id')::UUID ELSE NULL END,
        CASE WHEN v_payload ? 'track' THEN (v_payload->>'track')::development_track ELSE NULL END,
        CASE WHEN v_payload ? 'total_duration_min' THEN (v_payload->>'total_duration_min')::INTEGER ELSE NULL END,
        CASE WHEN v_payload ? 'description' THEN v_payload->>'description' ELSE NULL END,
        v_action.voice_command_id,
        p_executor_id
      ) RETURNING id INTO v_template_id;
      v_created_ids := array_append(v_created_ids, v_template_id);
      v_result := jsonb_build_object('template_id', v_template_id);

    -- ── New: modify_template ──────────────────────────────────
    -- Payload: { template_id, name?, description?, track?, total_duration_min? }
    WHEN 'modify_template' THEN
      UPDATE templates SET
        name               = COALESCE(
          CASE WHEN v_payload ? 'name' THEN v_payload->>'name' ELSE NULL END,
          name
        ),
        description        = COALESCE(
          CASE WHEN v_payload ? 'description' THEN v_payload->>'description' ELSE NULL END,
          description
        ),
        track              = COALESCE(
          CASE WHEN v_payload ? 'track' THEN (v_payload->>'track')::development_track ELSE NULL END,
          track
        ),
        total_duration_min = COALESCE(
          CASE WHEN v_payload ? 'total_duration_min' THEN (v_payload->>'total_duration_min')::INTEGER ELSE NULL END,
          total_duration_min
        ),
        updated_at         = NOW()
      WHERE id = (v_payload->>'template_id')::UUID
      AND academy_id = v_action.academy_id;
      v_result := jsonb_build_object(
        'template_id', v_payload->>'template_id',
        'updated',     true
      );

    -- ── New: create_placement_assessment ─────────────────────
    -- Payload: { player_id, assessed_date?, notes? }
    -- Creates a blank intake assessment. Scores are filled in during the session.
    WHEN 'create_placement_assessment' THEN
      INSERT INTO assessments (
        academy_id,
        player_id,
        type,
        assessed_by,
        assessed_date,
        notes,
        is_baseline,
        voice_command_id
      ) VALUES (
        v_action.academy_id,
        (v_payload->>'player_id')::UUID,
        'intake',
        p_executor_id,
        COALESCE(
          CASE WHEN v_payload ? 'assessed_date' THEN (v_payload->>'assessed_date')::DATE ELSE NULL END,
          CURRENT_DATE
        ),
        CASE WHEN v_payload ? 'notes' THEN v_payload->>'notes' ELSE NULL END,
        true,
        v_action.voice_command_id
      ) RETURNING id INTO v_assessment_id;
      -- Move player status to placement_in_progress
      UPDATE players SET
        status     = 'placement_in_progress',
        updated_at = NOW()
      WHERE id = (v_payload->>'player_id')::UUID
      AND academy_id = v_action.academy_id
      AND status = 'pending_placement';
      v_created_ids := array_append(v_created_ids, v_assessment_id);
      v_result := jsonb_build_object(
        'assessment_id', v_assessment_id,
        'player_id',     v_payload->>'player_id'
      );

    -- ── New: adjust_session_intensity ─────────────────────────
    -- Payload: { session_id, intensity }  (intensity 1–5)
    WHEN 'adjust_session_intensity' THEN
      UPDATE session_blocks SET
        intensity  = (v_payload->>'intensity')::INTEGER,
        updated_at = NOW()
      WHERE session_id = (v_payload->>'session_id')::UUID;
      v_result := jsonb_build_object(
        'session_id', v_payload->>'session_id',
        'intensity',  (v_payload->>'intensity')::INTEGER
      );

    -- ── New: flag_player ──────────────────────────────────────
    -- Payload: { player_id, reason? }
    -- Sets the promotion flag on player_progression so the director/coach
    -- knows this player needs review. Does not change player status.
    WHEN 'flag_player' THEN
      UPDATE player_progression SET
        promotion_flagged_at = NOW(),
        promotion_flagged_by = p_executor_id
      WHERE player_id = (v_payload->>'player_id')::UUID;
      v_result := jsonb_build_object(
        'player_id', v_payload->>'player_id',
        'flagged_at', NOW()
      );

    ELSE
      RAISE EXCEPTION 'Unsupported action type for execution: %', v_action.action_type;
  END CASE;

  -- Mark executed
  UPDATE proposed_actions SET
    status     = 'executed',
    updated_at = NOW()
  WHERE id = p_action_id;

  -- Execution log
  INSERT INTO action_execution_logs (
    proposed_action_id, academy_id, executed_by,
    status, execution_result, objects_created, executed_at
  ) VALUES (
    p_action_id, v_action.academy_id, p_executor_id,
    'success', v_result, v_created_ids, NOW()
  );

  -- Audit log
  INSERT INTO audit_logs (
    academy_id, actor_id, action, target_type, target_id,
    payload, source_type, voice_command_id
  ) VALUES (
    v_action.academy_id,
    p_executor_id,
    'voice.action.executed',
    v_action.target_module,
    v_action.target_object_id,
    jsonb_build_object(
      'action_type', v_action.action_type,
      'result',      v_result
    ),
    'voice',
    v_action.voice_command_id
  );

  RETURN jsonb_build_object('success', true, 'action_id', p_action_id, 'result', v_result);

EXCEPTION WHEN OTHERS THEN
  INSERT INTO action_execution_logs (
    proposed_action_id, academy_id, executed_by,
    status, error_message, executed_at
  ) VALUES (
    p_action_id,
    COALESCE(v_action.academy_id, '00000000-0000-0000-0000-000000000000'::UUID),
    p_executor_id,
    'failed', SQLERRM, NOW()
  );
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
