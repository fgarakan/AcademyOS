-- ============================================================
-- ACADEMY OS — MIGRATION 066: FIX SESSIONS RLS INFINITE RECURSION
--
-- Root cause (migration 007):
--   "Players see their sessions" ON sessions
--     → EXISTS (SELECT 1 FROM session_attendance sa JOIN players p …)
--   "Staff see attendance" ON session_attendance
--     → EXISTS (SELECT 1 FROM sessions s WHERE …)
--
-- When a director inserts a session and reads it back (.select('id')),
-- PostgreSQL evaluates all SELECT policies on sessions, including
-- "Players see their sessions", which subqueries session_attendance.
-- The session_attendance SELECT policy then subqueries sessions again,
-- triggering the sessions RLS check again → infinite loop.
--
-- Fix: introduce a SECURITY DEFINER helper that checks whether a
-- session belongs to the current user's academy without going through
-- sessions RLS. Recreate session_attendance policies to use it.
-- Access intent is preserved — no weakening of academy scoping.
-- ============================================================

-- Helper: does this session belong to the calling user's academy?
-- SECURITY DEFINER bypasses RLS on the internal sessions query,
-- breaking the recursion. Convention matches 003_rls_helpers.sql.
CREATE OR REPLACE FUNCTION session_belongs_to_auth_academy(p_session_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM sessions
    WHERE id = p_session_id
      AND academy_id = auth_academy_id()
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Recreate session_attendance SELECT policy — now uses SECURITY DEFINER
-- helper instead of inline sessions subquery that caused the recursion.
DROP POLICY IF EXISTS "Staff see attendance" ON session_attendance;
CREATE POLICY "Staff see attendance"
  ON session_attendance FOR SELECT
  USING (
    session_belongs_to_auth_academy(session_attendance.session_id)
    AND auth_is_staff()
  );

-- Recreate session_attendance ALL policy — same fix applied.
DROP POLICY IF EXISTS "Staff manage attendance" ON session_attendance;
CREATE POLICY "Staff manage attendance"
  ON session_attendance FOR ALL
  USING (
    session_belongs_to_auth_academy(session_attendance.session_id)
    AND auth_is_staff()
  );
