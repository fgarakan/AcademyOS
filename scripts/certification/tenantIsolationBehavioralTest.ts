// ============================================================
// ACADEMY OS — TENANT ISOLATION BEHAVIORAL TEST (Sprint 4357)
//
// Proves tenant isolation BEHAVIORALLY — i.e. against a real Postgres/Supabase
// instance with RLS enforced — not just statically against the migration text
// (that is `tenantIsolationCertification.ts`, which still gates CI).
//
// It seeds two academies + a full cast of users/data (service role), then re-queries
// AS each user through an authenticated anon client so RLS actually applies, and
// asserts the cross-tenant boundary holds. Everything it created is torn down.
//
// HONESTY CONTRACT (Sprint 4357):
//   * If the Supabase behavioral environment is NOT available (missing env / no
//     reachable DB / migrations not applied), this exits with BLOCKED status and a
//     NON-ZERO code. It NEVER prints a green "certified" line it did not earn, and it
//     is deliberately NOT registered in scripts/certificationSuites.ts, so it can
//     never masquerade as a passing CI gate.
//   * A cross-tenant leak → FAIL (exit 1).
//   * All boundaries hold → PASS (exit 0).
//   * Precondition unmet → BLOCKED (exit 2). "Blocked" is not "passed".
//
// RUN:  npm run test:tenant-isolation
//   (which is: node --env-file=.env.local --import tsx scripts/certification/tenantIsolationBehavioralTest.ts)
// REQUIRES: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// and a database with migrations 001–086 applied. See
// docs/TENANT_ISOLATION_BEHAVIORAL_TEST.md.
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ── Exit codes (honest tri-state) ─────────────────────────────────────────────
const EXIT_PASS = 0
const EXIT_FAIL = 1
const EXIT_BLOCKED = 2

// A stable, unmistakable tag so teardown only ever touches rows THIS harness made.
const SEED_TAG = 'tenant-iso-behavioral-4357'
const PW = 'Behavioral-Test-4357!' // throwaway password for seeded auth users

// ── tiny assertion log ────────────────────────────────────────────────────────
let passed = 0
let failed = 0
const failures: string[] = []
const infos: string[] = []

function check(label: string, ok: boolean): void {
  if (ok) {
    passed++
    process.stdout.write(`   ✓ ${label}\n`)
  } else {
    failed++
    failures.push(label)
    process.stdout.write(`   ✗ ${label}\n`)
  }
}

/** Informational observation — reported, never gates pass/fail. */
function info(label: string, detail: string): void {
  infos.push(`${label} — ${detail}`)
  process.stdout.write(`   • ${label} — ${detail}\n`)
}

function section(title: string): void {
  process.stdout.write(`\n── ${title} ──\n`)
}

function blocked(reason: string): never {
  process.stdout.write('\n============================================================\n')
  process.stdout.write('TENANT ISOLATION BEHAVIORAL TEST: BLOCKED (not certified)\n')
  process.stdout.write(`Reason: ${reason}\n`)
  process.stdout.write(
    'Behavioral tenant isolation was NOT verified. This is NOT a pass. Provision a\n' +
      'Supabase/Postgres instance with migrations 001–086 applied and the three env\n' +
      'vars set, then re-run. See docs/TENANT_ISOLATION_BEHAVIORAL_TEST.md.\n',
  )
  process.stdout.write('============================================================\n')
  process.exit(EXIT_BLOCKED)
}

// ── helpers ─────────────────────────────────────────────────────────────────

/** A signed-in anon client for one user, so RLS evaluates auth.uid() as that user. */
async function signInAs(
  url: string,
  anonKey: string,
  email: string,
  password: string,
): Promise<SupabaseClient> {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`)
  return client
}

/** Count rows visible to `client` for `table` filtered by an id column = id. */
async function visibleById(
  client: SupabaseClient,
  table: string,
  idCol: string,
  id: string,
): Promise<number> {
  const { data, error } = await client.from(table).select('*').eq(idCol, id)
  // RLS never errors on SELECT — it returns fewer/zero rows. A genuine error
  // (network, bad table) should surface, not be silently counted as 0.
  if (error) throw new Error(`select ${table} failed: ${error.message}`)
  return data?.length ?? 0
}

async function main(): Promise<void> {
  process.stdout.write('\nACADEMY OS — TENANT ISOLATION BEHAVIORAL TEST (Sprint 4357)\n')

  // ── PRECONDITION 1: env present ──────────────────────────────────────────
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) {
    const missing = [
      !url && 'NEXT_PUBLIC_SUPABASE_URL',
      !anonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      !serviceKey && 'SUPABASE_SERVICE_ROLE_KEY',
    ]
      .filter(Boolean)
      .join(', ')
    blocked(
      `missing required env var(s): ${missing}. No behavioral environment to test against.`,
    )
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── PRECONDITION 2: DB reachable + migrations applied ─────────────────────
  // Probe a table that only exists AFTER migration 086 hardening (player_guardians
  // gained academy_id). If the probe fails, the DB isn't ready for a behavioral test.
  {
    const { error } = await admin.from('player_guardians').select('academy_id').limit(1)
    if (error) {
      blocked(
        `cannot reach player_guardians.academy_id (${error.message}). The DB is ` +
          'unreachable or migrations 001–086 are not applied.',
      )
    }
  }

  // Track what we create so teardown is precise even on partial failure.
  const created = {
    userIds: [] as string[],
    academyIds: [] as string[],
  }

  try {
    section('Setup — two academies, users, players, guardians, links (service role)')

    // Academies A and B.
    const { data: acA, error: acAErr } = await admin
      .from('academies')
      .insert({ name: `${SEED_TAG}-A` })
      .select('id')
      .single()
    const { data: acB, error: acBErr } = await admin
      .from('academies')
      .insert({ name: `${SEED_TAG}-B` })
      .select('id')
      .single()
    if (acAErr || acBErr || !acA || !acB) {
      throw new Error(`academy insert failed: ${acAErr?.message ?? ''} ${acBErr?.message ?? ''}`)
    }
    const academyA = acA.id as string
    const academyB = acB.id as string
    created.academyIds.push(academyA, academyB)
    check('created Academy A and Academy B', true)

    // Users: director A, director B, coach A, parent A, parent B.
    // profiles.academy_id drives auth_academy_id(); academy_memberships.role drives
    // auth_is_staff()/auth_is_director_or_head(). Parents get NO membership (not staff).
    const makeUser = async (
      tag: string,
      academyId: string,
      role: 'academy_director' | 'coach' | null,
    ): Promise<{ id: string; email: string }> => {
      const email = `${SEED_TAG}-${tag}@example.test`
      const { data: u, error: uErr } = await admin.auth.admin.createUser({
        email,
        password: PW,
        email_confirm: true,
      })
      if (uErr || !u.user) throw new Error(`createUser ${tag} failed: ${uErr?.message}`)
      const id = u.user.id
      created.userIds.push(id)

      // profiles row may be auto-created by a trigger; upsert to be safe and to set academy_id.
      const { error: pErr } = await admin
        .from('profiles')
        .upsert({ id, academy_id: academyId, email, full_name: `${SEED_TAG} ${tag}` })
      if (pErr) throw new Error(`profile upsert ${tag} failed: ${pErr.message}`)

      if (role) {
        const { error: mErr } = await admin
          .from('academy_memberships')
          .insert({ academy_id: academyId, profile_id: id, role, is_active: true })
        if (mErr) throw new Error(`membership ${tag} failed: ${mErr.message}`)
      }
      return { id, email }
    }

    const dirA = await makeUser('dirA', academyA, 'academy_director')
    const dirB = await makeUser('dirB', academyB, 'academy_director')
    const coachA = await makeUser('coachA', academyA, 'coach')
    const parentA = await makeUser('parentA', academyA, null)
    const parentB = await makeUser('parentB', academyB, null)
    check('created dirA, dirB, coachA, parentA, parentB', true)

    // Players (tenant-direct via academy_id).
    const makePlayer = async (tag: string, academyId: string): Promise<string> => {
      const { data, error } = await admin
        .from('players')
        .insert({ academy_id: academyId, first_name: SEED_TAG, last_name: tag })
        .select('id')
        .single()
      if (error || !data) throw new Error(`player ${tag} failed: ${error?.message}`)
      return data.id as string
    }
    const playerA = await makePlayer('playerA', academyA)
    const playerB = await makePlayer('playerB', academyB)

    // Guardians, linked to the parent auth users via profile_id.
    const makeGuardian = async (
      tag: string,
      academyId: string,
      profileId: string,
    ): Promise<string> => {
      const { data, error } = await admin
        .from('guardians')
        .insert({
          academy_id: academyId,
          profile_id: profileId,
          first_name: SEED_TAG,
          last_name: tag,
          email: `${SEED_TAG}-${tag}-contact@example.test`,
          phone: '+10000000000',
        })
        .select('id')
        .single()
      if (error || !data) throw new Error(`guardian ${tag} failed: ${error?.message}`)
      return data.id as string
    }
    const guardianA = await makeGuardian('guardianA', academyA, parentA.id)
    const guardianB = await makeGuardian('guardianB', academyB, parentB.id)

    // player_guardians links — each WITHIN its own academy. The 086 trigger derives
    // academy_id from the player, so we don't pass it.
    {
      const { error: lErr } = await admin
        .from('player_guardians')
        .insert({ player_id: playerA, guardian_id: guardianA })
      if (lErr) throw new Error(`link A failed: ${lErr.message}`)
      const { error: lErr2 } = await admin
        .from('player_guardians')
        .insert({ player_id: playerB, guardian_id: guardianB })
      if (lErr2) throw new Error(`link B failed: ${lErr2.message}`)
    }
    check('created playerA/B, guardianA/B, within-tenant links A/B', true)

    // ── Authenticated clients (RLS applies) ─────────────────────────────────
    const asDirA = await signInAs(url, anonKey, dirA.email, PW)
    const asDirB = await signInAs(url, anonKey, dirB.email, PW)
    const asCoachA = await signInAs(url, anonKey, coachA.email, PW)
    const asParentA = await signInAs(url, anonKey, parentA.email, PW)
    const asParentB = await signInAs(url, anonKey, parentB.email, PW)

    // ── CASE GROUP 1: directors cannot cross the player boundary ─────────────
    section('1 · Director ↔ player cross-tenant boundary')
    check('dirA CAN see Player A (own academy)', (await visibleById(asDirA, 'players', 'id', playerA)) === 1)
    check('dirA CANNOT see Player B (other academy)', (await visibleById(asDirA, 'players', 'id', playerB)) === 0)
    check('dirB CAN see Player B (own academy)', (await visibleById(asDirB, 'players', 'id', playerB)) === 1)
    check('dirB CANNOT see Player A (other academy)', (await visibleById(asDirB, 'players', 'id', playerA)) === 0)

    // ── CASE GROUP 2: parents see only their linked child ────────────────────
    section('2 · Parent sees only their linked child')
    check('parentA CANNOT see Player B (other academy child)', (await visibleById(asParentA, 'players', 'id', playerB)) === 0)
    check('parentB CANNOT see Player A (other academy child)', (await visibleById(asParentB, 'players', 'id', playerA)) === 0)
    // Parent sees their own link, not the other academy's link.
    check('parentA sees own guardian link (link A)', (await visibleById(asParentA, 'player_guardians', 'guardian_id', guardianA)) === 1)
    check('parentA CANNOT see the other academy link (link B)', (await visibleById(asParentA, 'player_guardians', 'guardian_id', guardianB)) === 0)

    // ── CASE GROUP 3: coach can see linkage; contact visibility observed ─────
    section('3 · Coach linkage visibility + guardian contact detail (informational)')
    check('coachA CAN see the player↔guardian link in Academy A', (await visibleById(asCoachA, 'player_guardians', 'guardian_id', guardianA)) === 1)
    check('coachA CANNOT see the Academy B link', (await visibleById(asCoachA, 'player_guardians', 'guardian_id', guardianB)) === 0)
    // Contact detail: current 086 policy grants ALL staff row-level SELECT on guardians,
    // with NO column-level restriction. So a coach CAN read email/phone. We assert the
    // ACTUAL behavior and flag it — we do NOT fake a restriction that the schema lacks.
    {
      const { data: gRow, error: gErr } = await asCoachA
        .from('guardians')
        .select('id,email,phone')
        .eq('id', guardianA)
        .maybeSingle()
      if (gErr) throw new Error(`coach guardian read failed: ${gErr.message}`)
      const sawContact = !!(gRow && (gRow.email || gRow.phone))
      if (sawContact) {
        info(
          'coach CAN read guardian email/phone in own academy',
          'current RLS gives all staff full-row SELECT on guardians (no column-level ' +
            'contact restriction). Not a leak (same-academy), but a policy gap — see ' +
            'recommended next sprint.',
        )
      } else {
        info('coach did NOT receive guardian contact fields', 'a column-level restriction appears to be in place')
      }
    }
    // Cross-tenant contact is a hard boundary and MUST hold regardless.
    check('coachA CANNOT read Academy B guardian at all', (await visibleById(asCoachA, 'guardians', 'id', guardianB)) === 0)

    // ── CASE GROUP 4: directors confined to their academy's guardians ────────
    section('4 · Director guardian management confined to own academy')
    check('dirA CAN see Academy A guardian', (await visibleById(asDirA, 'guardians', 'id', guardianA)) === 1)
    check('dirA CANNOT see Academy B guardian', (await visibleById(asDirA, 'guardians', 'id', guardianB)) === 0)
    check('dirB CANNOT see Academy A guardian', (await visibleById(asDirB, 'guardians', 'id', guardianA)) === 0)
    // Manage (FOR ALL) is confined: dirA updating B's guardian affects 0 rows (RLS filters it out).
    {
      const { data: upd } = await asDirA
        .from('guardians')
        .update({ phone: '+19999999999' })
        .eq('id', guardianB)
        .select('id')
      check('dirA UPDATE of Academy B guardian affects 0 rows', (upd?.length ?? 0) === 0)
    }

    // ── CASE GROUP 5: player_guardians links cannot cross academies ──────────
    section('5 · player_guardians links cannot cross academy boundaries (trigger)')
    // Cross-tenant INSERT must be rejected by tr_player_guardians_academy — even under
    // service role, because the trigger fires regardless of RLS.
    {
      const { error } = await admin
        .from('player_guardians')
        .insert({ player_id: playerA, guardian_id: guardianB })
      check('cross-academy link INSERT is REJECTED (trigger raises)', !!error)
    }
    // Cross-tenant UPDATE (repoint an existing link's guardian to the other academy) rejected.
    {
      const { error } = await admin
        .from('player_guardians')
        .update({ guardian_id: guardianB })
        .eq('player_id', playerA)
        .eq('guardian_id', guardianA)
      check('cross-academy link UPDATE is REJECTED (trigger raises)', !!error)
    }
    // Same-academy INSERT succeeds — create a second guardian in A and link it.
    {
      const guardianA2 = await makeGuardian('guardianA2', academyA, parentA.id)
      const { error } = await admin
        .from('player_guardians')
        .insert({ player_id: playerA, guardian_id: guardianA2 })
      check('same-academy link INSERT SUCCEEDS', !error)
    }
  } finally {
    // ── Teardown — precise, service role. Reverse dependency order. ──────────
    section('Teardown — removing seeded rows + auth users')
    for (const ac of created.academyIds) {
      // academies CASCADE to players/guardians/player_guardians/memberships/profiles(FK).
      await admin.from('player_guardians').delete().eq('academy_id', ac)
      await admin.from('guardians').delete().eq('academy_id', ac)
      await admin.from('players').delete().eq('academy_id', ac)
      await admin.from('academy_memberships').delete().eq('academy_id', ac)
      await admin.from('academies').delete().eq('id', ac)
    }
    for (const uid of created.userIds) {
      await admin.from('profiles').delete().eq('id', uid)
      await admin.auth.admin.deleteUser(uid).catch(() => {})
    }
    process.stdout.write('   ✓ teardown complete\n')
  }

  // ── Verdict ────────────────────────────────────────────────────────────────
  process.stdout.write('\n============================================================\n')
  if (failed === 0) {
    process.stdout.write(`TENANT ISOLATION BEHAVIORAL TEST: ${passed} passed, 0 failed — CERTIFIED\n`)
  } else {
    process.stdout.write(`TENANT ISOLATION BEHAVIORAL TEST: ${passed} passed, ${failed} FAILED\n`)
    failures.forEach((f) => process.stdout.write(`  ✗ ${f}\n`))
  }
  if (infos.length) {
    process.stdout.write(`\nInformational (${infos.length}) — not gating:\n`)
    infos.forEach((i) => process.stdout.write(`  • ${i}\n`))
  }
  process.stdout.write('============================================================\n')
  process.exit(failed === 0 ? EXIT_PASS : EXIT_FAIL)
}

main().catch((err) => {
  // An unexpected throw during setup/assert is a real problem, not a pass.
  process.stdout.write('\n============================================================\n')
  process.stdout.write('TENANT ISOLATION BEHAVIORAL TEST: ERROR (not certified)\n')
  process.stdout.write(`${err instanceof Error ? err.stack ?? err.message : String(err)}\n`)
  process.stdout.write('============================================================\n')
  process.exit(EXIT_FAIL)
})
