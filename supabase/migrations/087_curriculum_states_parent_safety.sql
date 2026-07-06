-- ============================================================
-- ACADEMY OS — MIGRATION 087: CURRICULUM STATES PARENT-SAFETY RLS FIX
--
-- Sprint 4377. Fixes a within-tenant parent-safety leak on
-- player_curriculum_states discovered during Sprint 4376 parent-identity
-- behavioral testing.
--
-- THE LEAK (from migration 036):
--   CREATE POLICY "System manages player curriculum states"
--     ON player_curriculum_states FOR ALL
--     USING (academy_id = auth_academy_id());
--   auth_academy_id() resolves for ANY authenticated profile in the academy —
--   including a parent — so a parent matched this FOR ALL policy and could
--   SELECT (and INSERT/UPDATE/DELETE) EVERY player's curriculum state in their
--   academy, not just their own child's. Not cross-tenant (academy-scoped), but
--   cross-player within a tenant. Postgres RLS is permissive-OR, so this broad
--   policy widened access beyond the intended staff/self/parent boundaries.
--
-- THE FIX (minimal, scoped to this one table):
--   1. Replace the FOR ALL policy with a STAFF-guarded management policy
--      (adds auth_is_staff() + a symmetric WITH CHECK). Service-role and
--      SECURITY DEFINER functions bypass RLS, so system-managed writes are
--      unaffected; only accidental client-side non-staff access is removed.
--   2. Add a narrow parent SELECT policy limited to the guardian's LINKED
--      player(s), mirroring the already-certified players "Parents see their
--      children" policy — so the parent portal can show a parent their own
--      child's curriculum state, and nothing else.
--
-- Unchanged: "Players see own curriculum state" (self SELECT) and
-- "Staff see player curriculum states" (staff SELECT) remain as-is.
-- ============================================================

-- 1. Remove the over-broad FOR ALL policy and replace with a staff-guarded one.
DROP POLICY IF EXISTS "System manages player curriculum states" ON player_curriculum_states;

CREATE POLICY "Staff manage player curriculum states"
  ON player_curriculum_states FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff())
  WITH CHECK (academy_id = auth_academy_id() AND auth_is_staff());

-- 2. Parents may READ only their linked child's curriculum state (parent-safe scope).
DROP POLICY IF EXISTS "Parents see linked child curriculum state" ON player_curriculum_states;

CREATE POLICY "Parents see linked child curriculum state"
  ON player_curriculum_states FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND EXISTS (
      SELECT 1 FROM player_guardians pg
      JOIN guardians g ON g.id = pg.guardian_id
      WHERE pg.player_id = player_curriculum_states.player_id
        AND g.profile_id = auth.uid()
    )
  );
