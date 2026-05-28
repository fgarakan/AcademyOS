-- ============================================================
-- ACADEMY OS — MIGRATION 0007: VOICE COMMANDS & PROPOSED ACTIONS
-- The voice-first nervous system.
-- CRITICAL: Voice never directly mutates core data.
-- ============================================================

-- ============================================================
-- VOICE COMMANDS
-- The raw input record (typed or spoken)
-- ============================================================
CREATE TYPE voice_input_method AS ENUM ('typed', 'audio', 'api');

CREATE TABLE voice_commands (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  issuer_id         UUID NOT NULL REFERENCES profiles(id),
  issuer_role       user_role NOT NULL,

  -- Input
  input_method      voice_input_method NOT NULL DEFAULT 'typed',
  raw_input         TEXT NOT NULL,       -- what the user typed or said
  audio_path        TEXT,                -- Supabase storage path (V2)
  transcript        TEXT,                -- Whisper output (V2) or same as raw_input (V1)

  -- Processing
  processing_status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'normalizing' | 'normalized' | 'ambiguous' | 'failed'

  -- Normalized intent (AI output)
  normalized_intent JSONB,
  -- {
  --   "intent_type": "create_session",
  --   "confidence": 0.92,
  --   "target_module": "sessions",
  --   "entities": {
  --     "group": "Orange Development",
  --     "date": "next Monday",
  --     "focus": "technical backhand"
  --   }
  -- }

  intent_confidence NUMERIC(4,3),
  requires_clarification BOOLEAN NOT NULL DEFAULT false,

  -- Context
  context_snapshot  JSONB, -- relevant state at time of command (current group, active session, etc.)

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at      TIMESTAMPTZ
);

-- ============================================================
-- CLARIFICATION REQUESTS
-- When intent is ambiguous, the system asks follow-up questions
-- ============================================================
CREATE TABLE clarification_requests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voice_command_id  UUID NOT NULL REFERENCES voice_commands(id) ON DELETE CASCADE,
  academy_id        UUID NOT NULL,

  question          TEXT NOT NULL,       -- what the system is asking
  question_type     TEXT NOT NULL,       -- 'choice' | 'confirmation' | 'input'
  options           JSONB,               -- for 'choice' type: ["Fitness only", "Full session", ...]
  required_fields   TEXT[],              -- which fields need clarification

  response          TEXT,
  responded_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROPOSED ACTIONS
-- What the system intends to do after parsing the command.
-- Must be reviewed and approved before execution.
-- ============================================================
CREATE TYPE action_type AS ENUM (
  'create_session',
  'modify_session',
  'create_template',
  'modify_template',
  'assign_group',
  'create_placement_assessment',
  'move_player_group',
  'schedule_reassessment',
  'adjust_session_intensity',
  'generate_parent_update',
  'flag_player',
  'create_player',
  'create_exercise',
  'other'
);

CREATE TYPE proposed_action_status AS ENUM (
  'pending_review',
  'clarification_needed',
  'approved',
  'modified',
  'rejected',
  'executed',
  'failed',
  'expired'
);

CREATE TABLE proposed_actions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  voice_command_id  UUID NOT NULL REFERENCES voice_commands(id),
  proposed_by_id    UUID NOT NULL REFERENCES profiles(id),

  -- Action specification
  action_type       action_type NOT NULL,
  action_label      TEXT NOT NULL,        -- human-readable: "Create session for Orange Development on Monday"
  target_module     TEXT NOT NULL,        -- 'sessions' | 'players' | 'templates' | etc.
  target_object_id  UUID,                 -- if modifying existing object
  target_object_type TEXT,

  -- The proposed payload (what would be created/changed)
  proposed_payload  JSONB NOT NULL,
  -- For create_session:
  -- {
  --   "group_id": "...",
  --   "date": "2026-05-05",
  --   "template_id": "...",
  --   "intensity_override": {"fitness": 2},
  --   "coach_id": "..."
  -- }

  -- Risk assessment
  risk_level        TEXT NOT NULL DEFAULT 'low', -- 'low' | 'medium' | 'high'
  risk_notes        TEXT[],                -- reasons for risk level
  affected_count    INTEGER,              -- number of objects affected

  -- Review
  status            proposed_action_status NOT NULL DEFAULT 'pending_review',
  reviewer_notes    TEXT,
  modified_payload  JSONB,               -- if reviewer changed the payload

  approved_by       UUID REFERENCES profiles(id),
  approved_at       TIMESTAMPTZ,
  rejected_by       UUID REFERENCES profiles(id),
  rejected_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  expires_at        TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ACTION EXECUTION LOGS
-- What actually happened after an approved action was executed
-- ============================================================
CREATE TABLE action_execution_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposed_action_id UUID NOT NULL REFERENCES proposed_actions(id),
  academy_id        UUID NOT NULL,
  executed_by       UUID REFERENCES profiles(id),

  status            TEXT NOT NULL, -- 'success' | 'partial' | 'failed'
  execution_result  JSONB,         -- what objects were created/changed
  error_message     TEXT,
  objects_created   UUID[],        -- IDs of created objects
  objects_modified  UUID[],        -- IDs of modified objects

  executed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXECUTE_APPROVED_ACTION()
-- The only function that can execute approved proposed actions.
-- Never call directly from voice input — only after approval.
-- ============================================================
CREATE OR REPLACE FUNCTION execute_approved_action(
  p_action_id UUID,
  p_executor_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_action proposed_actions%ROWTYPE;
  v_payload JSONB;
  v_result JSONB;
  v_created_ids UUID[] := '{}';
BEGIN
  -- Fetch and validate action
  SELECT * INTO v_action FROM proposed_actions
  WHERE id = p_action_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposed action not found: %', p_action_id;
  END IF;

  IF v_action.status NOT IN ('approved', 'modified') THEN
    RAISE EXCEPTION 'Action must be approved before execution. Status: %', v_action.status;
  END IF;

  IF v_action.expires_at < NOW() THEN
    UPDATE proposed_actions SET status = 'expired' WHERE id = p_action_id;
    RAISE EXCEPTION 'Action has expired';
  END IF;

  -- Use modified payload if set, else original
  v_payload := COALESCE(v_action.modified_payload, v_action.proposed_payload);

  -- Route to appropriate handler
  CASE v_action.action_type

    WHEN 'create_session' THEN
      DECLARE v_session_id UUID;
      BEGIN
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
      END;

    WHEN 'assign_group' THEN
      -- Update player group (simplified — full logic in finalize_player_placement)
      UPDATE players SET
        current_group_id = (v_payload->>'group_id')::UUID,
        updated_at = NOW()
      WHERE id = (v_payload->>'player_id')::UUID
      AND academy_id = v_action.academy_id;
      v_result := jsonb_build_object('player_id', v_payload->>'player_id', 'group_id', v_payload->>'group_id');

    WHEN 'schedule_reassessment' THEN
      UPDATE players SET
        next_assessment_due = (v_payload->>'date')::DATE,
        updated_at = NOW()
      WHERE id = (v_payload->>'player_id')::UUID
      AND academy_id = v_action.academy_id;
      v_result := jsonb_build_object('player_id', v_payload->>'player_id', 'date', v_payload->>'date');

    ELSE
      RAISE EXCEPTION 'Unsupported action type: %', v_action.action_type;
  END CASE;

  -- Mark action as executed
  UPDATE proposed_actions SET status = 'executed', updated_at = NOW() WHERE id = p_action_id;

  -- Write execution log
  INSERT INTO action_execution_logs (
    proposed_action_id, academy_id, executed_by,
    status, execution_result, objects_created, executed_at
  ) VALUES (
    p_action_id, v_action.academy_id, p_executor_id,
    'success', v_result, v_created_ids, NOW()
  );

  -- Write audit log
  INSERT INTO audit_logs (
    academy_id, actor_id, action, target_type, target_id,
    payload, source_type, voice_command_id
  ) VALUES (
    v_action.academy_id, p_executor_id,
    'voice.action.executed',
    v_action.target_module, v_action.target_object_id,
    jsonb_build_object('action_type', v_action.action_type, 'result', v_result),
    'voice', v_action.voice_command_id
  );

  RETURN jsonb_build_object('success', true, 'action_id', p_action_id, 'result', v_result);

EXCEPTION WHEN OTHERS THEN
  -- Log failure
  INSERT INTO action_execution_logs (
    proposed_action_id, academy_id, executed_by,
    status, error_message, executed_at
  ) VALUES (
    p_action_id, v_action.academy_id, p_executor_id,
    'failed', SQLERRM, NOW()
  );
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE clarification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposed_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_execution_logs ENABLE ROW LEVEL SECURITY;

-- Voice commands: users see their own, directors see all
CREATE POLICY "Users see own voice commands"
  ON voice_commands FOR SELECT
  USING (issuer_id = auth.uid() OR (academy_id = auth_academy_id() AND auth_is_director_or_head()));

CREATE POLICY "Users create voice commands"
  ON voice_commands FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND issuer_id = auth.uid());

-- Proposed actions: directors see all, proposers see own
CREATE POLICY "Directors see all proposed actions"
  ON proposed_actions FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Proposers see own actions"
  ON proposed_actions FOR SELECT
  USING (proposed_by_id = auth.uid());

-- Only directors can approve actions
CREATE POLICY "Directors approve actions"
  ON proposed_actions FOR UPDATE
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

-- Execution logs: directors see all
CREATE POLICY "Directors see execution logs"
  ON action_execution_logs FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_voice_commands_issuer ON voice_commands(issuer_id, created_at DESC);
CREATE INDEX idx_voice_commands_status ON voice_commands(academy_id, processing_status);
CREATE INDEX idx_proposed_actions_status ON proposed_actions(academy_id, status);
CREATE INDEX idx_proposed_actions_command ON proposed_actions(voice_command_id);
CREATE INDEX idx_execution_logs_action ON action_execution_logs(proposed_action_id);

CREATE TRIGGER tr_proposed_actions_updated_at BEFORE UPDATE ON proposed_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
