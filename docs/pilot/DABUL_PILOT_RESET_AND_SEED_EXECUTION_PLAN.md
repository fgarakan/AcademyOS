# Dabul Pilot — Clean Reset + Seeder Execution Plan

**Sprint:** 4372 — Clean Dabul Pilot Reset + Seeder Execution Plan
**Status:** PLAN ONLY — nothing torn down, reset, scrubbed, or seeded by writing this file. No
DB writes, no production access, no `.env.local` use, no schema/migration change.
**Last updated:** 2026-07-06
**Decision recorded:** Sprint 4371 chose **Option A — reset/rebuild clean (single-tenant Dabul)**.
**Companion docs:** `docs/pilot/DABUL_PILOT_DATASET_SPEC.md` (Sprint 4366),
`docs/pilot/STAGING_PILOT_PROJECT_SETUP_PLAN.md`,
`docs/pilot/PILOT_PROJECT_PHASE_1_VERIFICATION_COMMANDS.md`,
`docs/testing/ATOMIC_LOOP_USABILITY_TEST_PLAN.md`.

> This plan governs two later **execution** sprints (teardown, then seed), each behind an
> explicit approval phrase (Sections 6–7). Writing this document performs **no** writes.

---

## 0. Targets and hard boundaries

| Thing | Value |
|---|---|
| **Pilot project (only allowed target)** | `AcademyOS-pilot` |
| **Pilot ref** | `cctqtapzpcwuffbmapmk` |
| **Pilot DB host** | `db.cctqtapzpcwuffbmapmk.supabase.co` |
| **Production / live backend (NEVER touch)** | `dbjjhhxdkpdreytsozlq` |
| **Angles academy UUID (to be removed)** | `00000000-0000-0000-0000-000000000001` |
| **God-Mode academy UUID (must NOT collide)** | `0d3a0000-0000-4000-8000-000000000001` |
| **Proposed Dabul academy UUID (new, fixed)** | `dab00000-0000-4000-8000-000000000001` |
| **Proposed Dabul `seed_batch_id`** | `dabul_pilot_v1` |

**Absolute rules for both execution sprints:** production is never a target; the disabled
prod link stays disabled; `.env.local` is never read or written (it points at production);
all execution uses **temporary pilot shell env vars** only; no schema change; no migration
change; no new seed *system* (re-skin the existing harness); no secrets in repo or chat.

---

## 1. Current pilot DB state summary (verified read-only, Sprint 4371)

- **Migrations:** `001–086` all applied on remote; `084/085/086` confirmed applied; **0 pending.**
- **Schema:** 130 tables. **~1,528 rows across 50 tables.**
- **Only tenant present:** one academy — **"Angles Tennis Academy"** (slug `angles`, fixed
  UUID `00000000-…-000000000001`) from `supabase/migrations/024_seed_data.sql`. Classified in
  Sprint 4371 as **generic Angles dev seed** — not God-Mode, not production-like, not private.
- **Angles tenant footprint:** `players 4`, `groups 4`, `group_memberships 3`,
  `player_progression 3`, `templates 2`, `template_blocks 9`, `audit_logs 2`,
  `assessment_templates 1`, `director_configurations 1`, plus academy-scoped config
  (`academy_levels 6`, `signal_priority_weights 31`, `academy_threshold_configs 15`,
  `parent_level_descriptions 15`, …).
- **Operational surface empty:** `profiles 0` (no auth users), `sessions 0`,
  `session_blocks 0`, `proposed_actions 0`.
- **Bulk of rows = global curriculum spine reference** (`curriculum_drill_tags 614`,
  `curriculum_drills 152`, `curriculum_coach_language 120`, `curriculum_content_items 92`,
  stages/levels/gates/requirements) — seeded by migrations, **not** by the Angles tenant row.
- **Critical tagging fact:** the Angles academy is **untagged** (`is_demo_data = false`, no
  `seed_batch_id` — it predates migration `085`). The God-Mode `reset.ts` **refuses** to
  delete untagged academies, so Angles **cannot** be removed by the standard harness reset;
  it requires an explicit, pilot-guarded teardown targeting its fixed UUID (Section 3).

---

## 2. Why Option A was selected

This is Brian's **first external pilot** and the ground truth for **10-loop browser
validation** and **DONNA judgment validation**. A single-tenant Dabul world:

- gives DONNA one unambiguous academy to operate inside (no Angles context bleed even if a
  query or dashboard aggregate is imperfectly scoped);
- makes the pilot trivially certifiable and easy to reason about;
- removes dependence on the pilot tenant-isolation behavioral test already passing (it has
  **not** run against this DB yet — Gate 3);
- discards only **throwaway generic dev seed** the dataset spec already marks "IGNORE."

Option B (scrub/re-skin Angles in place) leaves fixed `00000000-…` demo UUIDs and is hard to
prove clean. Option C (layer Dabul on top of Angles) puts two tenants in the DB **before**
tenant-isolation is behaviorally proven on the pilot — inverting the safety order.

---

## 3. What teardown removes (and what it preserves)

**Chosen teardown strategy = A1 (surgical), NOT a full `supabase db reset`.**
A full `db reset` is rejected because migration `024` would **re-seed Angles** on replay, and
it would needlessly destroy the global curriculum spine and force re-verifying all 86
migrations. Surgical teardown is smaller, reversible, and provably scoped.

### 3a. REMOVED during teardown
- The **Angles academy row** `00000000-…-000000000001`, and **all rows that reference it via
  `academy_id`** (removed by `ON DELETE CASCADE`): Angles players, groups, memberships,
  templates/template_blocks, progression, audit_logs, assessment_templates,
  director_configurations, and Angles academy-scoped config (`academy_levels`,
  `signal_priority_weights`, `academy_threshold_configs`, `parent_level_descriptions`, etc.).

### 3b. PRESERVED during teardown
- The **schema** (all 130 tables) and **all 86 applied migrations** — untouched.
- The **global curriculum spine reference** that is NOT scoped to the Angles academy_id
  (the Dabul players will map onto `RECOMMENDED_CURRICULUM_SPINE`).

### 3c. MANDATORY pre-teardown scoping check (hard gate inside the teardown sprint)
Before any delete, the execution sprint must **prove** the preserve/remove split:
1. Enumerate every FK to `academies(id)` and confirm `ON DELETE` behavior per table.
2. For each curriculum/reference table, confirm whether its rows carry
   `academy_id = <Angles UUID>` (would cascade-delete) or are global (survive).
3. Snapshot row counts of the global spine tables **before** and **after**; they must be
   **identical** post-teardown. Any drop in a table meant to be global ⇒ **STOP + rollback**.

If any curriculum table turns out to be Angles-scoped, the Dabul seeder must reseed that
scope for Dabul (do not silently lose the spine).

---

## 4. What must be preserved

- Schema + migrations `001–086` (no migration or schema change in either execution sprint).
- Global curriculum spine reference data (Section 3b/3c).
- The disabled production link file (never re-enabled).
- `.env.local` (never read/written).

---

## 5. How to prove production is NOT active before teardown (pre-flight, every write step)

```bash
# All read-only. Must ALL pass before any delete/seed.
ACTIVE=$(cat supabase/.temp/project-ref)
PILOT="cctqtapzpcwuffbmapmk"; PROD="dbjjhhxdkpdreytsozlq"
[ "$ACTIVE" = "$PILOT" ] || { echo "STOP — active link is not the pilot"; exit 1; }
[ "$ACTIVE" != "$PROD" ] || { echo "STOP — active link is PRODUCTION"; exit 1; }
# Temporary pilot env (entered manually at the shell — NEVER from .env.local):
#   echo "$NEXT_PUBLIC_SUPABASE_URL" must contain db.cctqtapzpcwuffbmapmk.supabase.co
#   and must NOT contain dbjjhhxdkpdreytsozlq
case "$NEXT_PUBLIC_SUPABASE_URL" in
  *dbjjhhxdkpdreytsozlq*) echo "STOP — env points at PRODUCTION"; exit 1;;
  *cctqtapzpcwuffbmapmk*) echo "OK — env points at pilot";;
  *) echo "STOP — env host unrecognized"; exit 1;;
esac
```
The seeder/teardown scripts must embed this same guard and **hard-abort** if it fails. The DB
password / service-role key is entered **only** at the shell prompt or as a transient shell
var for the single command — never echoed, never written to a tracked/untracked file.

---

## 6. Exact TEARDOWN approval phrase (Gate 1)

> **"teardown Angles on cctqtapzpcwuffbmapmk, Dabul pilot reset approved."**

No delete runs until this exact phrase is given AND the Section 5 pre-flight passes AND the
Section 3c scoping check is green (dry-run row-count preview shown first).

## 7. Exact SEED approval phrase (Gate 2)

> **"seed Dabul dabul_pilot_v1 on cctqtapzpcwuffbmapmk, seed approved."**

No seed runs until this exact phrase is given AND teardown is verified complete (Section 14)
AND the Section 5 pre-flight passes again immediately before the seed.

---

## 8. Dabul dataset shape (all fictional/safe; final values in `DABUL_PILOT_DATASET_SPEC.md` §8)

| Element | Shape | Safety |
|---|---|---|
| **Dabul pilot academy** | "Dabul Tennis Academy", slug `dabul-pilot`, UUID `dab00000-…-001`, `is_demo_data=true`, `seed_batch_id='dabul_pilot_v1'` | Fixed fake UUID; tagged |
| **Director** | Brian Dabul (director profile) | Fake auth user, fake `*.dabulpilot.test` email |
| **Fake coaches** | 2–3 coaches (head coach + coaches) | Fake auth users, fake emails |
| **Fake players** | 10–12 archetype-driven (ready-to-promote, stagnating, missing-assessment, declining-attendance, parent-concern, new-intake) | Fictional names (may mine `brianDemoDataset.ts` names), no real minors |
| **Fake parent/guardian placeholders** | ~8 guardians linked to players | Fake names; non-routable `*.dabulpilot.test`; **no real emails/phones** |
| **Curriculum baseline** | Dabul academy levels + mapping onto `RECOMMENDED_CURRICULUM_SPINE` | Reuses global spine |
| **Templates** | A few class/session templates (`template_blocks`, never merged with `session_blocks`) | Fake |
| **Sessions** | Scheduled + past sessions to exercise creation/execution | Fake |
| **Coach assignments** | Coaches assigned to sessions/groups | Fake |
| **Coach wrap-ups** | Wrap-up records with observations | Fake |
| **Assessments** | Assessment templates + a few completed assessments | Fake |
| **Approvals** | A few `proposed_actions` in review states (pending/approved) | Fake; flows through the real review pipeline |
| **Parent-safe views** | Data shaped so parent/player portals render safely | No cross-role leakage |
| **DONNA safe prompts** | Scripted prompts DONNA should answer confidently from data | Grounded |
| **DONNA unsafe prompts** | Scripted prompts DONNA should refuse / route to review / hedge | Proves boundaries |

**Fixed identity constants the seeder will define (new, non-colliding):**
`DABUL_PILOT_ACADEMY_ID = 'dab00000-0000-4000-8000-000000000001'`, `SEED_BATCH_ID = 'dabul_pilot_v1'`.

---

## 9. How the dataset covers all 10 atomic loops

Source of truth: `docs/testing/ATOMIC_LOOP_USABILITY_TEST_PLAN.md`.

| Loop | Dataset element that exercises it |
|---|---|
| 1 — Academy Setup | Dabul academy + director + academy config/levels |
| 2 — Curriculum Setup | Dabul levels mapped onto the curriculum spine + baseline |
| 3 — Class Template Setup | Seeded templates + `template_blocks` |
| 4 — Session Creation | Seeded scheduled sessions (and empty slots to create new) |
| 5 — Coach Assignment & Session Readiness | Coach↔session/group assignments |
| 6 — Coach Session Execution | Sessions with `session_blocks` ready to run |
| 7 — Coach Wrap-Up | Seeded + createable coach wrap-ups/observations |
| 8 — Player Development & Evidence | Player progression, signals, assessments, evidence |
| 9 — Director Review & Approval | `proposed_actions` in pending/approved states |
| 10 — Parent & Player-Safe Clarity | Parent/guardian links + parent-safe portal data |
| DONNA "say it naturally" pass | Safe + unsafe prompt scripts (Section 8) per loop |

The seeder must leave at least one **createable** path per loop (e.g. an empty session slot)
so browser validation exercises creation, not just reading pre-seeded rows.

---

## 10. How the dataset stays fake/safe (explicit confirmations)

5. **All Dabul pilot data is fake/safe** — fixed fake UUIDs, fictional names, `*.dabulpilot.test`
   non-routable emails, tagged `is_demo_data=true` + `seed_batch_id='dabul_pilot_v1'`.
6. **No real minors' private data** — players are archetype-driven fictional profiles; no real
   birthdates/identities of actual children.
7. **No real parent/guardian emails or phone numbers** — placeholders only, non-routable domain.
8. **No production data** — production `dbjjhhxdkpdreytsozlq` is never read, copied, or contacted.
9. **All execution uses temporary pilot shell env vars only** — `NEXT_PUBLIC_SUPABASE_URL` +
   `SUPABASE_SERVICE_ROLE_KEY` for the pilot, passed transiently to the single command.
10. **`.env.local` is never used** — the `demo:seed`/`demo:reset` npm aliases (hardwired to
    `--env-file=.env.local` = production) are **forbidden**; Dabul runs invoke the scripts
    directly with pilot shell env.

---

## 11. How the God-Mode harness will be reused / re-skinned (no new seed system)

Reuse the existing machinery verbatim; change only **identity/content**:
- **Reuse:** `scripts/demo/seed.ts`, `scripts/demo/reset.ts`, `scripts/demo/demoClient.ts`
  (`getDemoServiceClient` reads `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from
  `process.env` — so pilot shell env "just works" without `.env.local`),
  `scripts/demo/deriveDemoSignals.ts`, and migration `085`'s `is_demo_data` +
  `seed_batch_id` tagging + `isDemoResettable` guard + `academy_id` cascade teardown.
- **Re-skin (new dataset module, mirrors the God-Mode module's exported shape):**
  `scripts/demo/dabulPilotV1.ts` exporting `DABUL_PILOT_ACADEMY_ID`, `SEED_BATCH_ID =
  'dabul_pilot_v1'`, `isDabulResettable`, and the Dabul dataset object (academy, coaches,
  players, guardians, templates, sessions, assessments, approvals) — the God-Mode file
  `demoAcademyGodModeV1.ts` is the template, copied and re-skinned to Dabul identity/content.
- **Selection:** `seed.ts`/`reset.ts` choose the Dabul dataset via an explicit argument/env
  flag (e.g. `DEMO_DATASET=dabul_pilot_v1`) rather than editing God-Mode constants — so
  God-Mode and Dabul coexist as separate batches and never collide.

This is a **re-skin**, not a new system: same seed/reset/client code, new dataset + constants.

---

## 12. What must NOT be duplicated

- Do **not** build a new seed engine, new reset engine, or new service client — reuse
  `seed.ts`/`reset.ts`/`demoClient.ts`.
- Do **not** duplicate the curriculum spine — Dabul maps onto the existing global spine.
- Do **not** duplicate the tagging/teardown mechanism — reuse migration `085` columns +
  `isDemoResettable` pattern.
- Do **not** reuse the God-Mode `seed_batch_id`/UUID — Dabul gets its own (Section 0).
- Do **not** revive the retired seeds (`brianDemoDataset.ts` — names only; the mislabeled
  `supabase/seeds/brian_dabul_demo_seed.sql` "Monteiro" file — stays retired).

---

> **Update (Sprint 4373 — seeder BUILT, Gate-2 ready):** the re-skinned seeder now exists and
> is certified offline (38/38). New: `scripts/demo/dabulPilotV1.ts` (Dabul dataset,
> `DABUL_PILOT_ACADEMY_ID = dab00000-…-001`, `seed_batch_id = dabul_pilot_v1`, pinned ref
> `cctqtapzpcwuffbmapmk`, `*.dabulpilot.test`), `scripts/demo/datasets.ts` (registry +
> `assertSafeTarget` prod guard), and `dabulPilotSeederCertification.ts`. `seed.ts`/`reset.ts`
> are parameterized via `DEMO_DATASET`; run with **`npm run dabul:seed:pilot -- --confirm`**
> under **temporary pilot shell env** (no `.env.local`). The teardown (Section 3) is already
> DONE — the pilot is clean (0 academies). Remaining: execute the seed behind the Gate-2 phrase.

## 13. Files that will likely change in the later seeder EXECUTION sprint (not now)

- **New:** `scripts/demo/dabulPilotV1.ts` (Dabul dataset + constants).
- **Modified (parameterize to select dataset):** `scripts/demo/seed.ts`, `scripts/demo/reset.ts`.
- **Possibly new:** a one-off, pilot-guarded **Angles teardown** helper (targets the fixed
  Angles UUID `00000000-…-001`, which the tag-guarded `reset.ts` will not touch) — e.g.
  `scripts/demo/tearDownAnglesPilot.ts`, with the Section 5 guard embedded.
- **Possibly modified:** `package.json` (add pilot-safe scripts that do **not** use
  `--env-file=.env.local`) — only if approved; the aliasing hazard must be removed, not copied.
- **Docs:** `docs/CHANGELOG.md`, and status updates to `CURRENT_BUILD_TARGET.md`.
- **No** schema/migration/`.env`/`database.types.ts` changes.

---

## 14. Validation plan AFTER teardown

1. Re-run Section 5 pre-flight (still pilot, not prod).
2. `academies` contains **0** rows with the Angles UUID (and no Dabul row yet).
3. Global curriculum spine row counts **unchanged** vs the pre-teardown snapshot (Section 3c).
4. No orphaned rows referencing the deleted Angles academy_id (cascade complete).
5. `profiles/sessions/proposed_actions` remain empty. Record counts in the changelog.

## 15. Validation plan AFTER seed

1. Re-run Section 5 pre-flight.
2. Exactly **one** academy: Dabul `dab00000-…-001`, tagged `is_demo_data=true`,
   `seed_batch_id='dabul_pilot_v1'`; **no Angles**, **no God-Mode** academy present.
3. Row counts match the intended Dabul dataset (director 1, coaches 2–3, players 10–12,
   guardians ~8, templates/sessions/assessments/approvals as specified).
4. Spot-check each of the 10 loops has its seed element AND a createable path.
5. `npm run certify` (read-only cert suites) still green (expect 31/31). Record results.

## 16. Tenant-isolation behavioral plan — PILOT ONLY (Gate 3)

- Run the behavioral harness (`scripts/certification/tenantIsolationBehavioralTest.ts` /
  `supabase/tests/tenant_isolation_behavioral.sql`) against the **pilot** using **temporary
  pilot shell env vars**.
- ⚠️ Do **NOT** use `npm run test:tenant-isolation` — its script is hardwired to
  `--env-file=.env.local` (= production). Invoke the harness directly with pilot env.
- Expected: PASS (single-tenant Dabul makes cross-tenant leakage checks strict). Record the
  result; the known informational same-academy guardian-contact finding is not a blocker.

## 17. Browser validation readiness criteria (Gate 4)

Ready only when: teardown verified (14) + seed verified (15) + Gate 3 PASS + at least one
Dabul director/coach/parent login works. Then run
`docs/testing/BRIAN_DABUL_PILOT_TEST_SCRIPT.md` across the 10 loops. Browser automation is
**out of scope** for these sprints — validation is manual/guided.

---

## 18. Rollback / recovery plan

- **Teardown fails or over-deletes:** teardown runs as a single transaction where possible;
  if the post-teardown spine snapshot (14.3) differs, **do not proceed to seed**. Recovery:
  because the spine is migration-seeded, `supabase db reset` + `db push` (pilot only)
  rebuilds schema + spine + Angles from scratch, returning to the known Sprint-4371 state to
  retry. (This re-introduces Angles — acceptable as a *recovery* baseline, then re-teardown.)
- **Seed fails midway:** the Dabul academy is tagged, so the tag-guarded Dabul `reset`
  (`isDabulResettable` + `academy_id` cascade) cleanly removes the partial Dabul tenant; fix
  and re-seed. No manual row surgery.
- **Any pre-flight guard trips:** hard-abort, no writes, report, stop.
- Production is never a rollback target and is never touched in any path.

## 19. Explicit STOP gates before every write step

1. **Gate 1 — Teardown:** phrase (Section 6) + pre-flight (5) + scoping check green (3c) +
   dry-run preview shown. STOP until all four.
2. **Gate 2 — Seed:** phrase (Section 7) + teardown verified (14) + pre-flight (5) again.
   STOP until all three.
3. **Gate 3 — Tenant-isolation behavioral (pilot only):** run after seed verified; PASS
   required before browser validation.
4. **Gate 4 — Browser validation:** only after Gates 1–3 pass and a Dabul login works.

Nothing writes to the DB, and no execution sprint begins, without the matching gate above.

---

## Honest scope of THIS sprint (4372)

Documentation only. No teardown, no reset, no scrub, no seed, no DB write, no production
access, no `.env.local` read/write, no schema/migration change, no browser automation, no new
seed system, no secrets. The pilot DB remains in its verified Sprint-4371 state.
