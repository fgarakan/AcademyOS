-- ============================================================
-- ACADEMY OS — MIGRATION 008: VOICE PIPELINE
-- voice_commands, clarification_requests, and the action type enum.
-- CRITICAL: Voice never directly mutates core data.
-- Pipeline: voice input → transcript → intent → proposed_action
--           → approval → execute_approved_action() → audit_log
-- Fix applied: cancel_session added to action_type enum (was in validator but not enum).
-- ============================================================

-- ============================================================
-- VOICE INPUT METHOD
-- ============================================================
CREATE TYPE voice_input_method AS ENUM ('typed', 'audio', 'api');
-- V1: typed only. V2: audio via Whisper. api: programmatic.

-- ============================================================
-- VOICE COMMANDS
-- The raw input record. One row per user command.
-- Processing is async; status tracks pipeline progress.
-- ============================================================
CREATE TABLE voice_commands (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id             UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  issuer_id              UUID NOT NULL REFERENCES profiles(id),
  issuer_role            user_role NOT NULL,

  -- Input
  input_method           voice_input_method NOT NULL DEFAULT 'typed',
  raw_input              TEXT NOT NULL,
  audio_path             TEXT,        -- Supabase Storage path (V2 only)
  transcript             TEXT,        -- Whisper output (V2) or same as raw_input (V1)

  -- Processing state
  processing_status      TEXT NOT NULL DEFAULT 'pending'
                         CHECK (processing_status IN (
                           'pending', 'normalizing', 'normalized', 'ambiguous', 'failed'
                         )),

  -- Normalized intent (Claude API output)
  normalized_intent      JSONB,
  -- {
  --   "intent_type": "create_session",
  --   "confidence": 0.92,
  --   "target_module": "sessions",
  --   "entities": {
  --     "group_name": "Orange Development",
  --     "date_expression": "next Monday",
  --     "focus": "technical backhand"
  --   }
  -- }

  intent_confidence      NUMERIC(4,3) CHECK (intent_confidence BETWEEN 0 AND 1),
  requires_clarification BOOLEAN NOT NULL DEFAULT false,
  context_snapshot       JSONB,  -- relevant system state at time of command

  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at           TIMESTAMPTZ
);

CREATE INDEX idx_voice_commands_issuer ON voice_commands(issuer_id, created_at DESC);
CREATE INDEX idx_voice_commands_status ON voice_commands(academy_id, processing_status);

-- ============================================================
-- CLARIFICATION REQUESTS
-- When intent confidence < 0.70, the system asks a follow-up.
-- Confidence thresholds (canonical):
--   ≥ 0.85  → proceed without flag
--   0.70–0.84 → proceed with flag (show user what was interpreted)
--   < 0.70  → clarification request
--   < 0.40  → reject (not understood)
-- ============================================================
CREATE TABLE clarification_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_command_id UUID NOT NULL REFERENCES voice_commands(id) ON DELETE CASCADE,
  academy_id       UUID NOT NULL,

  question         TEXT NOT NULL,
  question_type    TEXT NOT NULL CHECK (question_type IN ('choice', 'confirmation', 'input')),
  options          JSONB,        -- for 'choice': ["Next Monday", "This coming Monday", ...]
  required_fields  TEXT[],       -- which entities need resolution

  response         TEXT,
  responded_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clarifications_command ON clarification_requests(voice_command_id);

-- ============================================================
-- ACTION TYPE ENUM
-- All intent types that can produce a proposed_action.
-- cancel_session added here (was in proposed-action-validator.ts but missing from enum).
-- ============================================================
CREATE TYPE action_type AS ENUM (
  'create_session',
  'modify_session',
  'cancel_session',               -- added: needed for validator + medium risk classification
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

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE voice_commands       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clarification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own voice commands"
  ON voice_commands FOR SELECT
  USING (issuer_id = auth.uid() OR (academy_id = auth_academy_id() AND auth_is_director_or_head()));

CREATE POLICY "Users create voice commands"
  ON voice_commands FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND issuer_id = auth.uid());

CREATE POLICY "Staff update voice command status"
  ON voice_commands FOR UPDATE
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff see clarification requests"
  ON clarification_requests FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff manage clarification requests"
  ON clarification_requests FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());
