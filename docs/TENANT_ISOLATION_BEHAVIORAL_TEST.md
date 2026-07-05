# Tenant Isolation — Behavioral Test

**Sprint 4357.** A behavioral (runtime) companion to the static tenant-isolation
certification. Where the static cert parses the migration text, this harness proves the
cross-academy boundary **against a real Postgres/Supabase instance with RLS actually
enforced** — it seeds two academies, re-queries as each user, and asserts that no row
crosses the tenant boundary.

It is the concrete implementation of remaining deviation #3 in
`docs/CURRENT_BUILD_TARGET.md` ("Live 2-academy behavioral tenant-isolation") and of
`docs/ARCHITECTURE.md` §4.2.

---

## Status: LOCAL behavioral PASS earned (Sprint 4368)

**Result:** `TENANT ISOLATION BEHAVIORAL TEST: 21 passed, 0 failed — CERTIFIED` (exit 0).

**Where:** a **local Docker Postgres** (the `supabase start` stack, 127.0.0.1) with
migrations **001–086** applied via a fresh `supabase db reset` — reached only after
Sprint 4367A fixed the 046 `ON CONFLICT` arbiter that had been breaking fresh replay, and
Sprint 4367B fixed the harness fixtures (added the required `academies.slug`; corrected
`profiles.full_name` → `display_name`; added the required `players.date_of_birth`). The
run used temporary shell env vars sourced from `supabase status -o env`, **not** `.env.local`.

**Scope caveat — READ THIS BEFORE CITING THE PASS:** this is a **LOCAL Docker proof only.**
It verifies that the migration / RLS / trigger tenant-isolation *logic* holds when actually
executed. It does **NOT** verify a live staging or cloud database, and must not be described
as staging/cloud validation. The remaining open work is to earn the same PASS against a live
staging/cloud instance.

**One informational (non-gating) finding:** current RLS grants all same-academy staff
full-row SELECT on `guardians`, so a coach **can** read a same-academy guardian's
email/phone. This is **not** a cross-tenant leak (the cross-academy boundary held on every
case) — it is a same-academy column-level policy gap, flagged for a future sprint.

---

## Two independent implementations

Both prove the same boundaries; run either or both.

| # | File | Runtime | Mechanism |
|---|---|---|---|
| 1 | `scripts/certification/tenantIsolationBehavioralTest.ts` | Node + `supabase-js` | Seeds via the **service role**, then re-queries through an **authenticated anon client** per user, so RLS evaluates `auth.uid()` as that user. |
| 2 | `supabase/tests/tenant_isolation_behavioral.sql` | `psql`, one rolled-back transaction | Impersonates each user via `request.jwt.claims` + `SET LOCAL ROLE authenticated`, the same primitives Supabase uses at runtime. `plpgsql ASSERT` aborts on the first violation. |

The TS harness exercises the full Supabase auth path (real auth users, real JWTs); the
SQL script is dependency-free and provable directly in the database. They are deliberately
redundant — a leak that slipped past one lens is unlikely to pass both.

---

## The honesty contract (why this is not a CI gate)

This test is **deliberately NOT registered in `scripts/certificationSuites.ts`**, so it
can never masquerade as a passing gate. It needs a live database that the static suite
does not require, and a green here must be *earned* against that database — never assumed.

The TS harness reports an honest tri-state via its exit code:

| Exit | Status | Meaning |
|---|---|---|
| `0` | **PASS / CERTIFIED** | Every boundary held against a live, migrated DB. |
| `1` | **FAIL** | A cross-tenant row was visible, or an unexpected error occurred. |
| `2` | **BLOCKED** | Precondition unmet (missing env, unreachable DB, or migrations 001–086 not applied). **"Blocked" is not "passed."** |

A BLOCKED run prints exactly why and does **not** print a green certified line.

---

## Prerequisites

1. A reachable Supabase/Postgres instance with **migrations 001–086 applied** (086 is
   what gives `player_guardians` its `academy_id` — the harness probes for it and BLOCKS
   if it is absent).
2. Three env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`. The `npm run test:tenant-isolation` script reads them from
   `.env.local`. For a **local Docker** run you can instead pass them as temporary shell
   env vars sourced from `supabase status -o env` (the values for the running local stack)
   and invoke the harness directly — this is how the Sprint 4368 local PASS was earned,
   without touching `.env.local`.

> The service role is used **only** to seed and tear down fixtures. All boundary
> assertions run through authenticated non-privileged clients so RLS is genuinely in
> effect. Do not point this at a production tenant with real data you cannot afford to
> have test rows created and deleted in — although every seeded row is tagged and torn
> down (see below), prefer a dedicated/staging project.

---

## Running it

### TypeScript harness

```bash
npm run test:tenant-isolation
# = node --env-file=.env.local --import tsx scripts/certification/tenantIsolationBehavioralTest.ts
```

### SQL script

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/tenant_isolation_behavioral.sql
```

The SQL runs entirely inside one `BEGIN … ROLLBACK`, so it leaves the database exactly as
it found it. Success prints `ALL BEHAVIORAL TENANT-ISOLATION ASSERTIONS PASSED`.

---

## What it seeds

Two academies (A and B) and a full cast:

- **A:** director, coach, parent, player, guardian, within-tenant player↔guardian link.
- **B:** director, parent, player, guardian, within-tenant player↔guardian link.

Every row the TS harness creates is tagged `tenant-iso-behavioral-4357` and removed in a
`finally` block (reverse dependency order, then the auth users), so teardown is precise
even on partial failure. The SQL script needs no tag — the whole transaction is rolled
back.

---

## Cases covered

| Group | Boundary asserted |
|---|---|
| **1 · Director ↔ player** | Each director sees only their own academy's player; neither can see the other's (cross-tenant `players` leak). |
| **2 · Parent scope** | A parent cannot see the other academy's child, sees their own `player_guardians` link, and cannot see the other academy's link. |
| **3 · Coach linkage** | A coach sees the same-academy `player_guardians` link but not the other academy's, and cannot read any Academy B guardian. *Informational:* current policy grants staff full-row SELECT on same-academy guardians, so a coach **can** read email/phone — reported, not failed (there is no column-level contact restriction in the schema today; flagged as a policy gap for a future sprint). |
| **4 · Director guardian management** | A director sees only their own academy's guardians; a cross-tenant `UPDATE` (FOR ALL manage policy) affects **0 rows**. |
| **5 · `player_guardians` trigger** | A cross-academy link `INSERT` and a cross-academy repoint `UPDATE` are both **rejected** by `tr_player_guardians_academy` (fires regardless of RLS); a same-academy link `INSERT` succeeds. |

---

## Related

- `src/lib/certification/tenantIsolationCertification.ts` — static cert (parses migration
  text; **is** a CI gate, currently 424/424, 0 tracked deviations).
- `supabase/migrations/086_guardian_tenant_isolation.sql` — the migration this test
  validates (`academy_id` + RLS + academy-scoped policies + the integrity trigger).
- `docs/ARCHITECTURE.md` §4.2 — the tenant-isolation law.
- `docs/CURRENT_BUILD_TARGET.md` — remaining deviation #3.
