-- ============================================================
-- ACADEMY OS — MIGRATION 075: DONNA USAGE EVENTS
-- Persistent event store for AI and voice usage metering.
-- Complements the in-process accumulator from Sprint 1005/1006.
-- Insert-only: no UPDATE or DELETE policies (events are immutable).
-- Academy-scoped via RLS — directors can query their own academy's usage.
--
-- Sprint: 1007 — DONNA Usage Events DB Store V1
-- ============================================================

CREATE TABLE usage_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id     UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,

  -- Event classification
  event_type     TEXT        NOT NULL,
  provider       TEXT,                        -- 'anthropic' | 'openai'
  model          TEXT,                        -- e.g. 'claude-sonnet-4-6'

  -- Performance metrics
  input_tokens   INTEGER,
  output_tokens  INTEGER,
  latency_ms     INTEGER,

  -- Safety / gate status
  blocked        BOOLEAN     NOT NULL DEFAULT FALSE,
  blocked_reason TEXT,                        -- 'rate_limit' | 'kill_switch' | 'quota_exceeded'

  -- Correlation label (safe only — no raw prompts, no raw responses, no player names)
  -- Examples: 'turn1:answer', 'get_academy_state:director', 'api_key_missing:director'
  request_id     TEXT,

  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────────────────

-- Primary query: all events for an academy ordered by time
CREATE INDEX idx_usage_events_academy_time
  ON usage_events(academy_id, occurred_at DESC);

-- Type-filtered query: events of a specific type for an academy
CREATE INDEX idx_usage_events_type_time
  ON usage_events(academy_id, event_type, occurred_at DESC);

-- ── RLS — Insert-only design ───────────────────────────────────────────────────
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Server actions running in staff auth context may insert usage events
CREATE POLICY "Staff insert usage events"
  ON usage_events FOR INSERT
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_staff()
  );

-- Directors and head coaches may query usage events for their academy
CREATE POLICY "Directors see usage events"
  ON usage_events FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Note: No UPDATE or DELETE policies — usage events are immutable by design.
-- Corrections are handled by inserting a compensating event if needed.
