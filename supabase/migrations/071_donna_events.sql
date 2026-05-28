-- ============================================================
-- ACADEMY OS — MIGRATION 071: DONNA EVENTS
-- Durable event ledger for DONNA operating decisions.
-- Immutable: events are INSERT-only (no UPDATE/DELETE policies).
-- All events are academy-scoped via RLS.
--
-- Purpose:
--   Record what DONNA decided, proposed, blocked, or logged so
--   operating decisions can be audited, analyzed, and used for
--   recommendation quality feedback.
--
-- Sprint: 914.6 — DONNA Event Ledger V1
-- ============================================================

CREATE TABLE donna_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id       UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  actor_id         UUID REFERENCES profiles(id),
  actor_role       TEXT,             -- user_role value or 'system'
  session_id       UUID REFERENCES donna_conversation_sessions(id) ON DELETE SET NULL,
  message_id       UUID REFERENCES donna_conversation_messages(id) ON DELETE SET NULL,
  entity_type      TEXT,             -- 'player' | 'session' | 'curriculum_level' | etc.
  entity_id        UUID,             -- optional entity reference (no FK — flexible)
  event_type       TEXT NOT NULL,    -- see event type list below
  visibility_scope TEXT NOT NULL DEFAULT 'director'
                   CHECK (visibility_scope IN ('director', 'head_coach', 'staff', 'system')),
  confidence       TEXT             CHECK (confidence IN ('high', 'medium', 'low', 'partial')),
  source           TEXT,             -- e.g. 'donna_god_mode', 'context_packet', 'user_input'
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Documented event types (enforced by app layer, not CHECK to allow extension) ──
-- donna_session_started      — a DONNA conversation session was opened
-- donna_message_persisted    — a user or DONNA message was saved
-- user_intent_detected       — intent was classified from user input
-- context_packet_generated   — context packet was assembled for a message
-- recommendation_generated   — DONNA produced a ranked/prioritized recommendation
-- confirmation_requested     — DONNA asked director to confirm an action
-- confirmation_accepted      — director confirmed a DONNA proposal
-- confirmation_cancelled     — director cancelled a DONNA proposal
-- curriculum_draft_created   — a pending_review curriculum override was created
-- review_item_created        — a proposed_action was created for review
-- action_blocked             — DONNA blocked an unsafe action attempt
-- approval_required          — DONNA required approval before proceeding
-- recommendation_accepted    — director acted on a recommendation
-- recommendation_rejected    — director declined a recommendation
-- recommendation_modified    — director modified a recommendation before acting

CREATE INDEX idx_donna_events_academy      ON donna_events(academy_id, created_at DESC);
CREATE INDEX idx_donna_events_session      ON donna_events(session_id, created_at DESC) WHERE session_id IS NOT NULL;
CREATE INDEX idx_donna_events_event_type   ON donna_events(event_type, created_at DESC);
CREATE INDEX idx_donna_events_actor        ON donna_events(actor_id, created_at DESC) WHERE actor_id IS NOT NULL;

-- ── RLS — Insert-only design ─────────────────────────────────────────────────────
ALTER TABLE donna_events ENABLE ROW LEVEL SECURITY;

-- Staff can insert events in their academy
CREATE POLICY "Staff insert donna events"
  ON donna_events FOR INSERT
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_staff()
  );

-- Directors see all events in their academy
CREATE POLICY "Directors see all donna events"
  ON donna_events FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Staff see events from their own sessions
CREATE POLICY "Staff see own donna events"
  ON donna_events FOR SELECT
  USING (
    actor_id = auth.uid()
  );

-- Note: No UPDATE or DELETE policies — events are immutable by design
