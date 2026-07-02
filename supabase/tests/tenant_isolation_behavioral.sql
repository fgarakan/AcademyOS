-- ============================================================
-- ACADEMY OS — TENANT ISOLATION BEHAVIORAL VERIFICATION (SQL) — Sprint 4357
--
-- A DB-native companion to scripts/certification/tenantIsolationBehavioralTest.ts.
-- It proves the same cross-tenant boundaries directly in Postgres, independent of
-- Node/Supabase-JS, by impersonating each user via the same mechanism Supabase uses
-- at runtime: `request.jwt.claims` (read by auth.uid()) + the `authenticated` role.
--
-- HOW TO RUN (against a DB with migrations 001–086 applied):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/tenant_isolation_behavioral.sql
--
-- The whole script runs inside ONE transaction that is ROLLED BACK at the end, so it
-- leaves the database exactly as it found it. Every boundary is asserted with a
-- plpgsql ASSERT — the script ABORTS on the first violation (a real failure, never a
-- silent green). If it prints "ALL BEHAVIORAL TENANT-ISOLATION ASSERTIONS PASSED", the
-- boundary held for every case.
--
-- NOTE ON auth.uid(): Supabase's auth.uid() reads
--   nullif(current_setting('request.jwt.claims', true)::json->>'sub','')::uuid
-- so setting request.jwt.claims to '{"sub":"<user-uuid>"}' makes auth_academy_id() /
-- auth_is_staff() / auth_is_director_or_head() evaluate as that user. RLS helper
-- functions are SECURITY DEFINER, so they see the impersonated claim correctly.
-- ============================================================

BEGIN;

-- ── Seed (as the privileged migration role, RLS not yet in play) ──────────────
DO $$
DECLARE
  academy_a  UUID := gen_random_uuid();
  academy_b  UUID := gen_random_uuid();
  dir_a      UUID := gen_random_uuid();
  dir_b      UUID := gen_random_uuid();
  coach_a    UUID := gen_random_uuid();
  parent_a   UUID := gen_random_uuid();
  parent_b   UUID := gen_random_uuid();
  player_a   UUID := gen_random_uuid();
  player_b   UUID := gen_random_uuid();
  guardian_a UUID := gen_random_uuid();
  guardian_b UUID := gen_random_uuid();
  v_count    INTEGER;
  v_error    BOOLEAN;
BEGIN
  -- Academies
  INSERT INTO academies (id, name) VALUES
    (academy_a, 'tenant-iso-sql-A'),
    (academy_b, 'tenant-iso-sql-B');

  -- Profiles (academy_id drives auth_academy_id()). Auth users are simulated by the
  -- profile ids; we do not need rows in auth.users because auth.uid() reads the claim.
  INSERT INTO profiles (id, academy_id, email, full_name) VALUES
    (dir_a,    academy_a, 'sql-dirA@example.test',    'sql dirA'),
    (dir_b,    academy_b, 'sql-dirB@example.test',    'sql dirB'),
    (coach_a,  academy_a, 'sql-coachA@example.test',  'sql coachA'),
    (parent_a, academy_a, 'sql-parentA@example.test', 'sql parentA'),
    (parent_b, academy_b, 'sql-parentB@example.test', 'sql parentB');

  -- Memberships (role drives auth_is_staff/auth_is_director_or_head). Parents: none.
  INSERT INTO academy_memberships (academy_id, profile_id, role, is_active) VALUES
    (academy_a, dir_a,   'academy_director', true),
    (academy_b, dir_b,   'academy_director', true),
    (academy_a, coach_a, 'coach',            true);

  -- Players
  INSERT INTO players (id, academy_id, first_name, last_name) VALUES
    (player_a, academy_a, 'tenant-iso-sql', 'playerA'),
    (player_b, academy_b, 'tenant-iso-sql', 'playerB');

  -- Guardians (linked to parents via profile_id, with contact detail)
  INSERT INTO guardians (id, academy_id, profile_id, first_name, last_name, email, phone) VALUES
    (guardian_a, academy_a, parent_a, 'tenant-iso-sql', 'guardianA', 'gA@example.test', '+10000000001'),
    (guardian_b, academy_b, parent_b, 'tenant-iso-sql', 'guardianB', 'gB@example.test', '+10000000002');

  -- Within-tenant links (trigger derives academy_id from the player)
  INSERT INTO player_guardians (player_id, guardian_id) VALUES
    (player_a, guardian_a),
    (player_b, guardian_b);

  -- Impersonation happens as the `authenticated` role so RLS is enforced.
  -- We stay SECURITY-safe: set the claim, run as authenticated, assert, reset role.

  -- ══ CASE 1: directors cannot cross the player boundary ══
  PERFORM set_config('request.jwt.claims', json_build_object('sub', dir_a)::text, true);
  SET LOCAL ROLE authenticated;
    SELECT count(*) INTO v_count FROM players WHERE id = player_a;
    ASSERT v_count = 1, 'CASE1: dirA should see Player A';
    SELECT count(*) INTO v_count FROM players WHERE id = player_b;
    ASSERT v_count = 0, 'CASE1: dirA must NOT see Player B (cross-tenant leak)';
  RESET ROLE;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', dir_b)::text, true);
  SET LOCAL ROLE authenticated;
    SELECT count(*) INTO v_count FROM players WHERE id = player_b;
    ASSERT v_count = 1, 'CASE1: dirB should see Player B';
    SELECT count(*) INTO v_count FROM players WHERE id = player_a;
    ASSERT v_count = 0, 'CASE1: dirB must NOT see Player A (cross-tenant leak)';
  RESET ROLE;

  -- ══ CASE 2: parents see only their linked child / own academy ══
  PERFORM set_config('request.jwt.claims', json_build_object('sub', parent_a)::text, true);
  SET LOCAL ROLE authenticated;
    SELECT count(*) INTO v_count FROM players WHERE id = player_b;
    ASSERT v_count = 0, 'CASE2: parentA must NOT see Player B';
    SELECT count(*) INTO v_count FROM player_guardians WHERE guardian_id = guardian_a;
    ASSERT v_count = 1, 'CASE2: parentA should see own link';
    SELECT count(*) INTO v_count FROM player_guardians WHERE guardian_id = guardian_b;
    ASSERT v_count = 0, 'CASE2: parentA must NOT see the other academy link';
  RESET ROLE;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', parent_b)::text, true);
  SET LOCAL ROLE authenticated;
    SELECT count(*) INTO v_count FROM players WHERE id = player_a;
    ASSERT v_count = 0, 'CASE2: parentB must NOT see Player A';
  RESET ROLE;

  -- ══ CASE 3: coach linkage visibility + contact detail (informational) ══
  PERFORM set_config('request.jwt.claims', json_build_object('sub', coach_a)::text, true);
  SET LOCAL ROLE authenticated;
    SELECT count(*) INTO v_count FROM player_guardians WHERE guardian_id = guardian_a;
    ASSERT v_count = 1, 'CASE3: coachA should see the Academy A link';
    SELECT count(*) INTO v_count FROM player_guardians WHERE guardian_id = guardian_b;
    ASSERT v_count = 0, 'CASE3: coachA must NOT see the Academy B link';
    SELECT count(*) INTO v_count FROM guardians WHERE id = guardian_b;
    ASSERT v_count = 0, 'CASE3: coachA must NOT see any Academy B guardian (cross-tenant)';
    -- INFORMATIONAL: current policy grants staff full-row SELECT on same-academy
    -- guardians, so a coach CAN read email/phone. This is reported, not failed —
    -- there is no column-level contact restriction in the schema today.
    SELECT count(*) INTO v_count
      FROM guardians WHERE id = guardian_a AND email IS NOT NULL;
    RAISE NOTICE 'INFO CASE3: coachA sees same-academy guardian contact rows = % (0 would mean a column restriction exists; 1 = current behavior, a documented policy gap)', v_count;
  RESET ROLE;

  -- ══ CASE 4: directors confined to own-academy guardians ══
  PERFORM set_config('request.jwt.claims', json_build_object('sub', dir_a)::text, true);
  SET LOCAL ROLE authenticated;
    SELECT count(*) INTO v_count FROM guardians WHERE id = guardian_a;
    ASSERT v_count = 1, 'CASE4: dirA should see Academy A guardian';
    SELECT count(*) INTO v_count FROM guardians WHERE id = guardian_b;
    ASSERT v_count = 0, 'CASE4: dirA must NOT see Academy B guardian';
    -- FOR ALL manage is confined: updating B's guardian touches 0 rows.
    WITH upd AS (
      UPDATE guardians SET phone = '+19999999999' WHERE id = guardian_b RETURNING id
    )
    SELECT count(*) INTO v_count FROM upd;
    ASSERT v_count = 0, 'CASE4: dirA UPDATE of Academy B guardian must affect 0 rows';
  RESET ROLE;

  -- ══ CASE 5: player_guardians links cannot cross academies (trigger) ══
  -- The trigger fires regardless of role; run as the privileged role and expect a raise.
  v_error := false;
  BEGIN
    INSERT INTO player_guardians (player_id, guardian_id) VALUES (player_a, guardian_b);
  EXCEPTION WHEN OTHERS THEN
    v_error := true;
  END;
  ASSERT v_error, 'CASE5: cross-academy link INSERT must be REJECTED by the trigger';

  v_error := false;
  BEGIN
    UPDATE player_guardians SET guardian_id = guardian_b
      WHERE player_id = player_a AND guardian_id = guardian_a;
  EXCEPTION WHEN OTHERS THEN
    v_error := true;
  END;
  ASSERT v_error, 'CASE5: cross-academy link UPDATE must be REJECTED by the trigger';

  -- Same-academy link succeeds (new guardian in A).
  DECLARE
    guardian_a2 UUID := gen_random_uuid();
  BEGIN
    INSERT INTO guardians (id, academy_id, profile_id, first_name, last_name)
      VALUES (guardian_a2, academy_a, parent_a, 'tenant-iso-sql', 'guardianA2');
    INSERT INTO player_guardians (player_id, guardian_id) VALUES (player_a, guardian_a2);
    SELECT count(*) INTO v_count
      FROM player_guardians WHERE player_id = player_a AND guardian_id = guardian_a2;
    ASSERT v_count = 1, 'CASE5: same-academy link INSERT must SUCCEED';
  END;

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'ALL BEHAVIORAL TENANT-ISOLATION ASSERTIONS PASSED';
  RAISE NOTICE '============================================================';
END $$;

-- Leave the database exactly as we found it.
ROLLBACK;
