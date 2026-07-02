-- ============================================================
-- ACADEMY OS — MIGRATION 086: GUARDIAN TENANT ISOLATION
--
-- Retires the last two tracked tenant-isolation deviations in ARCHITECTURE.md §4.2:
--
--   1. `guardians`        — RLS enabled, ZERO policies (deny-all). Already carries
--                           academy_id (migration 004). This adds academy-scoped policies.
--   2. `player_guardians` — RLS enabled, ZERO policies (deny-all) AND no academy_id
--                           column. This adds academy_id (backfilled + NOT NULL + FK),
--                           a cross-tenant integrity trigger, and academy-scoped policies.
--
-- A deny-all table does not LEAK (no reads), but it violates §4.2 ("no deny-all
-- tables") and forces parent reads through non-standard paths (§4.8). After this
-- migration both tables are first-class tenant-direct: academy_id + RLS + academy-
-- scoped policy, exactly like every other tenant-owned table.
--
-- RLS predicates are HOISTED per ARCHITECTURE.md §4.1 — `academy_id = (SELECT
-- auth_academy_id())` — so Postgres evaluates the helper once per query (InitPlan)
-- instead of once per row.
--
-- FAIL CLOSED (§2.3): the backfill aborts the entire migration if any existing
-- player↔guardian link spans two academies, rather than silently picking one side.
--
-- IDEMPOTENT + REVERSIBLE (§8.4): every statement is guarded (IF NOT EXISTS /
-- DROP ... IF EXISTS / DO-block constraint guard); re-running is a no-op. Rollback
-- script is documented at the foot of this file.
--
-- Sprint: 4356 — Guardian Tenant Isolation (deny-all retirement)
-- ============================================================

-- ============================================================
-- PART 1 — player_guardians.academy_id (column → backfill → abort guard → constraints)
-- ============================================================

-- 1a. Add the column nullable so existing rows can be backfilled before NOT NULL.
ALTER TABLE player_guardians
  ADD COLUMN IF NOT EXISTS academy_id UUID;

-- 1b. Backfill from the canonical owner: the player's academy.
UPDATE player_guardians pg
  SET academy_id = p.academy_id
  FROM players p
  WHERE p.id = pg.player_id
    AND pg.academy_id IS DISTINCT FROM p.academy_id;

-- 1c. ABORT GUARD (fail closed). Two conditions abort the whole migration:
--       (a) any link whose academy_id could not be resolved (orphan / null), and
--       (b) any link whose player and guardian belong to DIFFERENT academies.
--     A cross-tenant link is pre-existing corruption; we refuse to guess which
--     academy "wins" and stop so it is fixed by hand.
DO $$
DECLARE
  v_unresolved INTEGER;
  v_cross      INTEGER;
BEGIN
  SELECT count(*) INTO v_unresolved
  FROM player_guardians
  WHERE academy_id IS NULL;

  SELECT count(*) INTO v_cross
  FROM player_guardians pg
  JOIN players   p ON p.id = pg.player_id
  JOIN guardians g ON g.id = pg.guardian_id
  WHERE p.academy_id <> g.academy_id;

  IF v_unresolved > 0 THEN
    RAISE EXCEPTION
      'MIGRATION 086 ABORTED: % player_guardians row(s) have an unresolved academy_id (orphaned player). Fix the data, then re-run.',
      v_unresolved;
  END IF;

  IF v_cross > 0 THEN
    RAISE EXCEPTION
      'MIGRATION 086 ABORTED: % player_guardians row(s) link a player and guardian in DIFFERENT academies (cross-tenant). Resolve these links by hand, then re-run.',
      v_cross;
  END IF;
END $$;

-- 1d. Now the column is fully populated and consistent → lock it down.
ALTER TABLE player_guardians
  ALTER COLUMN academy_id SET NOT NULL;

-- 1e. Foreign key to academies (CASCADE on academy delete — matches players/guardians).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'player_guardians_academy_id_fkey'
  ) THEN
    ALTER TABLE player_guardians
      ADD CONSTRAINT player_guardians_academy_id_fkey
      FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_player_guardians_academy ON player_guardians(academy_id);

COMMENT ON COLUMN player_guardians.academy_id IS
  'Tenant key for the player↔guardian link. Always equals BOTH the player''s and the '
  'guardian''s academy_id — enforced canonically by tr_player_guardians_academy. '
  'Added in migration 086 to retire the deny-all deviation (ARCHITECTURE.md §4.2).';

-- ============================================================
-- PART 2 — Integrity trigger: cross-tenant links forbidden, academy_id canonical
-- ============================================================
-- BEFORE INSERT OR UPDATE on player_guardians:
--   * forbids linking a player and guardian from different academies (fail closed), and
--   * derives academy_id from the player so the column can never drift or be spoofed,
--     even if a caller supplies a wrong/omitted value.
CREATE OR REPLACE FUNCTION enforce_player_guardian_academy()
RETURNS TRIGGER AS $$
DECLARE
  v_player_academy   UUID;
  v_guardian_academy UUID;
BEGIN
  SELECT academy_id INTO v_player_academy   FROM players   WHERE id = NEW.player_id;
  SELECT academy_id INTO v_guardian_academy FROM guardians WHERE id = NEW.guardian_id;

  IF v_player_academy IS NULL THEN
    RAISE EXCEPTION 'player_guardians: player % does not exist or has no academy', NEW.player_id;
  END IF;
  IF v_guardian_academy IS NULL THEN
    RAISE EXCEPTION 'player_guardians: guardian % does not exist or has no academy', NEW.guardian_id;
  END IF;
  IF v_player_academy <> v_guardian_academy THEN
    RAISE EXCEPTION
      'player_guardians: cross-tenant link forbidden (player academy % <> guardian academy %)',
      v_player_academy, v_guardian_academy;
  END IF;

  -- Canonical source of truth: the link's academy is always the player's academy.
  NEW.academy_id := v_player_academy;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_player_guardians_academy ON player_guardians;
CREATE TRIGGER tr_player_guardians_academy
  BEFORE INSERT OR UPDATE ON player_guardians
  FOR EACH ROW EXECUTE FUNCTION enforce_player_guardian_academy();

-- ============================================================
-- PART 3 — RLS policies (hoisted, academy-scoped) — retire both deny-all tables
-- ============================================================
-- RLS is already ENABLED on both tables (migration 004). These add the missing
-- policies. DROP ... IF EXISTS makes the block idempotent.

-- ── guardians ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff see academy guardians"   ON guardians;
DROP POLICY IF EXISTS "Directors manage guardians"     ON guardians;
DROP POLICY IF EXISTS "Guardians see own record"       ON guardians;

CREATE POLICY "Staff see academy guardians"
  ON guardians FOR SELECT
  USING (academy_id = (SELECT auth_academy_id()) AND (SELECT auth_is_staff()));

CREATE POLICY "Directors manage guardians"
  ON guardians FOR ALL
  USING (academy_id = (SELECT auth_academy_id()) AND (SELECT auth_is_director_or_head()));

-- A guardian (parent) may read their own record (parent portal resolves by profile_id).
CREATE POLICY "Guardians see own record"
  ON guardians FOR SELECT
  USING (profile_id = (SELECT auth.uid()));

-- ── player_guardians ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff see academy guardian links" ON player_guardians;
DROP POLICY IF EXISTS "Directors manage guardian links"  ON player_guardians;
DROP POLICY IF EXISTS "Guardians see own links"          ON player_guardians;

CREATE POLICY "Staff see academy guardian links"
  ON player_guardians FOR SELECT
  USING (academy_id = (SELECT auth_academy_id()) AND (SELECT auth_is_staff()));

CREATE POLICY "Directors manage guardian links"
  ON player_guardians FOR ALL
  USING (academy_id = (SELECT auth_academy_id()) AND (SELECT auth_is_director_or_head()));

-- A guardian (parent) may read which players they are linked to, scoped to academy.
CREATE POLICY "Guardians see own links"
  ON player_guardians FOR SELECT
  USING (
    academy_id = (SELECT auth_academy_id())
    AND EXISTS (
      SELECT 1 FROM guardians g
      WHERE g.id = player_guardians.guardian_id
        AND g.profile_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- ROLLBACK (reversible — ARCHITECTURE.md §8.4)
-- ============================================================
--   DROP POLICY IF EXISTS "Guardians see own links"          ON player_guardians;
--   DROP POLICY IF EXISTS "Directors manage guardian links"  ON player_guardians;
--   DROP POLICY IF EXISTS "Staff see academy guardian links" ON player_guardians;
--   DROP POLICY IF EXISTS "Guardians see own record"   ON guardians;
--   DROP POLICY IF EXISTS "Directors manage guardians" ON guardians;
--   DROP POLICY IF EXISTS "Staff see academy guardians" ON guardians;
--   DROP TRIGGER IF EXISTS tr_player_guardians_academy ON player_guardians;
--   DROP FUNCTION IF EXISTS enforce_player_guardian_academy();
--   DROP INDEX IF EXISTS idx_player_guardians_academy;
--   ALTER TABLE player_guardians DROP CONSTRAINT IF EXISTS player_guardians_academy_id_fkey;
--   ALTER TABLE player_guardians DROP COLUMN IF EXISTS academy_id;
-- (Rollback returns both tables to their prior deny-all state.)
