-- ============================================================
-- ACADEMY OS — MIGRATION 070: DONNA CONVERSATION SPINE
-- donna_conversation_sessions, donna_conversation_messages,
-- donna_working_memory
--
-- Purpose:
--   Provides durable backend storage for DONNA conversation state.
--   Enables cross-session memory, message history, and working memory.
--   Does NOT replace the existing voice_commands / proposed_actions pipeline.
--   Does NOT replace the in-process donnaChatSessionMemory singleton.
--   These tables are additive — the existing 912.x–913.x behavior is preserved.
--
-- Architecture:
--   DONNA frontend → appendDonnaConversationMessage() (helper)
--                  → upsertDonnaWorkingMemory() (helper)
--                  → buildDonnaContextPacket() (context assembly)
--
-- Sprint: 914.2 — DONNA Backend Spine V1
-- ============================================================

-- ============================================================
-- A. donna_conversation_sessions
-- One row per director conversation session with DONNA.
-- A session groups a sequence of messages with shared context.
-- ============================================================
CREATE TABLE donna_conversation_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id          UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role                user_role NOT NULL,

  -- Session context
  title               TEXT,
  active_page         TEXT,
  active_workflow     TEXT,
  current_entity_type TEXT,
  current_entity_id   UUID,

  -- Lifecycle
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'archived', 'ended')),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at     TIMESTAMPTZ,
  ended_at            TIMESTAMPTZ,

  -- Extensible metadata (page route, director context hash, etc.)
  metadata            JSONB NOT NULL DEFAULT '{}',

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donna_sessions_academy    ON donna_conversation_sessions(academy_id);
CREATE INDEX idx_donna_sessions_user       ON donna_conversation_sessions(user_id);
CREATE INDEX idx_donna_sessions_active     ON donna_conversation_sessions(academy_id, user_id, status);
CREATE INDEX idx_donna_sessions_last_msg   ON donna_conversation_sessions(last_message_at DESC NULLS LAST);

CREATE TRIGGER tr_donna_sessions_updated_at
  BEFORE UPDATE ON donna_conversation_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- B. donna_conversation_messages
-- Individual message rows within a session.
-- One row per user message and one row per DONNA response.
-- ============================================================
CREATE TABLE donna_conversation_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES donna_conversation_sessions(id) ON DELETE CASCADE,
  academy_id          UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES profiles(id),

  -- Message content
  role                TEXT NOT NULL
                      CHECK (role IN ('user', 'donna', 'system', 'tool')),
  message_text        TEXT NOT NULL,
  message_kind        TEXT NOT NULL DEFAULT 'text'
                      CHECK (message_kind IN ('text', 'voice', 'system', 'action_result', 'error')),

  -- DONNA-specific fields
  intent              TEXT,       -- intent category e.g. 'curriculum_draft', 'page_guide'
  confidence          TEXT        CHECK (confidence IN ('high', 'medium', 'low', 'partial', 'insufficient')),
  source              TEXT,       -- sourceNote from DonnaSafeReadAnswer

  -- Page and entity context at time of message
  page_path           TEXT,
  entity_type         TEXT,
  entity_id           UUID,

  -- Optional cross-references
  proposed_action_id  UUID,       -- if this message triggered a proposed_action
  event_id            UUID,       -- if this message produced an audit_log entry

  -- Extensible metadata
  metadata            JSONB NOT NULL DEFAULT '{}',

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donna_messages_session   ON donna_conversation_messages(session_id, created_at DESC);
CREATE INDEX idx_donna_messages_academy   ON donna_conversation_messages(academy_id, created_at DESC);
CREATE INDEX idx_donna_messages_user      ON donna_conversation_messages(user_id, created_at DESC);
CREATE INDEX idx_donna_messages_intent    ON donna_conversation_messages(intent) WHERE intent IS NOT NULL;

-- ============================================================
-- C. donna_working_memory
-- Durable key-value working memory scoped to a conversation session.
-- Stores active entity, workflow state, pending confirmation context.
-- Keys are unique per session — upsert semantics.
-- ============================================================
CREATE TABLE donna_working_memory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES donna_conversation_sessions(id) ON DELETE CASCADE,
  academy_id    UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  memory_key    TEXT NOT NULL,
  memory_value  JSONB NOT NULL DEFAULT '{}',

  -- Scope hint for classification (not enforced by DB)
  scope         TEXT NOT NULL DEFAULT 'session'
                CHECK (scope IN ('session', 'workflow', 'page', 'entity')),

  -- Optional TTL for transient memory (expired rows can be pruned)
  expires_at    TIMESTAMPTZ,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (session_id, memory_key)
);

CREATE INDEX idx_donna_wm_session  ON donna_working_memory(session_id);
CREATE INDEX idx_donna_wm_academy  ON donna_working_memory(academy_id, user_id);
CREATE INDEX idx_donna_wm_key      ON donna_working_memory(memory_key);
CREATE INDEX idx_donna_wm_expires  ON donna_working_memory(expires_at) WHERE expires_at IS NOT NULL;

CREATE TRIGGER tr_donna_working_memory_updated_at
  BEFORE UPDATE ON donna_working_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS — Row Level Security
-- All three tables follow the established academy_id scoping pattern.
-- Helpers: auth_academy_id(), auth_is_director_or_head(), auth_is_staff()
-- ============================================================

ALTER TABLE donna_conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE donna_conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE donna_working_memory        ENABLE ROW LEVEL SECURITY;

-- ── donna_conversation_sessions ──────────────────────────────────────────────

-- Staff can create sessions for themselves in their academy
CREATE POLICY "Staff insert own donna sessions"
  ON donna_conversation_sessions FOR INSERT
  WITH CHECK (
    academy_id = auth_academy_id()
    AND user_id = auth.uid()
    AND auth_is_staff()
  );

-- Directors/head coaches see all sessions in their academy
CREATE POLICY "Directors see all donna sessions"
  ON donna_conversation_sessions FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Staff see their own sessions
CREATE POLICY "Staff see own donna sessions"
  ON donna_conversation_sessions FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Staff update their own active sessions
CREATE POLICY "Staff update own donna sessions"
  ON donna_conversation_sessions FOR UPDATE
  USING (
    user_id = auth.uid()
    AND academy_id = auth_academy_id()
  );

-- ── donna_conversation_messages ──────────────────────────────────────────────

-- Staff can append messages to sessions in their academy
CREATE POLICY "Staff insert donna messages"
  ON donna_conversation_messages FOR INSERT
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_staff()
  );

-- Directors/head coaches see all messages in their academy
CREATE POLICY "Directors see all donna messages"
  ON donna_conversation_messages FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Staff see messages from their own sessions
CREATE POLICY "Staff see own donna messages"
  ON donna_conversation_messages FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- ── donna_working_memory ─────────────────────────────────────────────────────

-- Staff can upsert working memory for their own sessions
CREATE POLICY "Staff upsert own donna working memory"
  ON donna_working_memory FOR INSERT
  WITH CHECK (
    academy_id = auth_academy_id()
    AND user_id = auth.uid()
    AND auth_is_staff()
  );

CREATE POLICY "Staff update own donna working memory"
  ON donna_working_memory FOR UPDATE
  USING (
    user_id = auth.uid()
    AND academy_id = auth_academy_id()
  );

-- Directors see all working memory in their academy
CREATE POLICY "Directors see all donna working memory"
  ON donna_working_memory FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Staff see their own working memory
CREATE POLICY "Staff see own donna working memory"
  ON donna_working_memory FOR SELECT
  USING (
    user_id = auth.uid()
  );
