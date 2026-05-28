-- ============================================================
-- ACADEMY OS — MIGRATION 009: PROPOSED ACTIONS + EXECUTION
-- proposed_actions, action_execution_logs, execute_approved_action().
-- CRITICAL: execute_approved_action() is the ONLY path to execute
--           a voice command. Status must be 'approved' or 'modified'.
-- ============================================================

-- ============================================================
-- PROPOSED ACTION STATUS
-- ============================================================
CREATE TYPE proposed_action_status AS ENUM (
  'pending_review',
  'clarification_needed',
  'approved',
  'modified',     -- approved with payload changes
  'rejected',
  'executed',
  'failed',
  'expired'
);

-- ============================================================
-- PROPOSED ACTIONS
-- What the system wants to do. Requires human review before execution.
-- ============================================================
CREATE TABLE proposed_actions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id          UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  voice_command_id    UUID NOT NULL REFERENCES voice_commands(id),
  proposed_by_id      UUID NOT NULL REFERENCES profiles(id),

  -- Action specification
  action_type         action_type NOT NULL,
  action_label        TEXT NOT NULL,
  target_module       TEXT NOT NULL,
  target_object_id    UUID,
  target_object_type  TEXT,

  -- The proposed change payload
  proposed_payload    JSONB NOT NULL,
  -- Examples:
  -- create_session: {"group_id":"...","date":"2026-05-05","template_id":"...","duration_min":90,"coach_id":"..."}
  -- move_player_group: {"player_id":"...","from_group_id":"...","to_group_id":"...","reason":"promotion"}
  -- cancel_session: {"session_id":"...","reason":"weather"}

  -- Risk assessment
  risk_level          TEXT NOT NULL DEFAULT 'low'
                      CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_notes          TEXT[],
  affected_count      INTEGER,

  -- Review
  status              proposed_action_status NOT NULL DEFAULT 'pending_review',
  reviewer_notes      TEXT,
  modified_payload    JSONB,

  approved_by         UUID REFERENCES profiles(id),
  approved_at         TIMESTAMPTZ,
  rejected_by         UUID REFERENCES profiles(id),
  rejected_at         TIMESTAMPTZ,
  rejection_reason    TEXT,

  expires_at          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposed_actions_status  ON proposed_actions(academy_id, status);
CREATE INDEX idx_proposed_actions_command ON proposed_actions(voice_command_id);
CREATE INDEX idx_proposed_actions_expires ON proposed_actions(expires_at) WHERE status = 'pending_review';

CREATE TRIGGER tr_proposed_actions_updated_at
  BEFORE UPDATE ON proposed_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-expire pending actions
CREATE OR REPLACE FUNCTION expire_proposed_actions()
RETURNS void AS $$
  UPDATE proposed_actions
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending_review'
  AND expires_at < NOW();
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================
-- ACTION EXECUTION LOGS
-- Immutable record of what actually happened after execution.
-- ============================================================
CREATE TABLE action_execution_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposed_action_id  UUID NOT NULL REFERENCES proposed_actions(id),
  academy_id          UUID NOT NULL,
  executed_by         UUID REFERENCES profiles(id),
  status              TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  execution_result    JSONB,
  error_message       TEXT,
  objects_created     UUID[],
  objects_modified    UUID[],
  executed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_execution_logs_action ON action_execution_logs(proposed_action_id);

-- ============================================================
-- EXECUTE_APPROVED_ACTION()
-- The ONLY function that can execute an approved proposed action.
-- Never call this from a voice command directly.
-- Only callable after status = 'approved' or 'modified'.
-- ============================================================
CREATE OR REPLACE FUNCTION execute_approved_action(
  p_action_id   UUID,
  p_executor_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_action     proposed_actions%ROWTYPE;
  v_payload    JSONB;
  v_result     JSONB;
  v_created_ids UUID[] := '{}';
  v_session_id UUID;
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

    WHEN 'cancel_session' THEN
      UPDATE sessions SET
        status     = 'cancelled',
        updated_at = NOW()
      WHERE id = (v_payload->>'session_id')::UUID
      AND academy_id = v_action.academy_id;
      v_result := jsonb_build_object('session_id', v_payload->>'session_id', 'status', 'cancelled');

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

    WHEN 'move_player_group' THEN
      -- Close old membership
      UPDATE group_memberships SET
        is_current = false,
        left_at    = NOW(),
        reason     = COALESCE(v_payload->>'reason', 'voice_command'),
        moved_by   = p_executor_id
      WHERE player_id = (v_payload->>'player_id')::UUID AND is_current = true;
      -- Open new membership
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
        'player_id',    v_payload->>'player_id',
        'to_group_id',  v_payload->>'to_group_id'
      );

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

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE proposed_actions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_execution_logs  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors see all proposed actions"
  ON proposed_actions FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Proposers see own actions"
  ON proposed_actions FOR SELECT
  USING (proposed_by_id = auth.uid());

CREATE POLICY "Directors approve actions"
  ON proposed_actions FOR UPDATE
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Staff insert proposed actions"
  ON proposed_actions FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors see execution logs"
  ON action_execution_logs FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());
