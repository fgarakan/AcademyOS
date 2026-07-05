# Staging / Pilot Supabase Project Setup Plan

**Sprint:** 4369A — Dedicated Staging/Pilot Supabase Project Setup Plan
**Status:** PLAN ONLY — nothing created, connected, applied, seeded, or committed.
**Last updated:** 2026-07-05

---

## 1. Why we need a dedicated staging/pilot Supabase project

The Brian / Dabul pilot needs to be validated against a **real cloud Supabase
instance** — migrations, RLS, triggers, Auth, and the browser app all behaving as
they will in production. We cannot do that against local Docker alone (that only
proves migration/RLS/trigger *logic*), and we **must not** do it against the live
app backend.

Therefore we stand up a **separate, non-production Supabase project** that exists
purely for pilot testing. It gives us:

- A safe place to apply migrations `001 → 086` for the first time on real cloud
  infrastructure.
- A safe place to earn a **live** tenant-isolation behavioral PASS (currently only
  proven on local Docker — see `docs/TENANT_ISOLATION_BEHAVIORAL_TEST.md`).
- A safe place to seed the controlled Dabul pilot dataset
  (`docs/pilot/DABUL_PILOT_DATASET_SPEC.md`) and run browser validation of the 10
  atomic loops — **without any risk to the live backend.**

---

## 2. The currently reachable remote DB is production-like — do NOT use it

Preflight (Sprint 4369A) confirmed the only remote Supabase project configured is:

- **Ref:** `dbjjhhxdkpdreytsozlq`
- **Name:** `AcademyOS` (no `-staging` / `-pilot` / `-preview` suffix)
- **Org:** `mecxwoclnvxmxebaszgj`
- **Region:** `aws-1-us-west-2`

Evidence it is **production-like / the live app backend**:

- `.env.local` sets `NEXT_PUBLIC_SUPABASE_URL=https://dbjjhhxdkpdreytsozlq.supabase.co`
  — the running app uses this project as its live backend.
- The Supabase CLI link to this project was **deliberately disabled** (the CLI's
  `supabase/.temp/` was renamed to `supabase/.temp.disabled-local-validation/`) to
  prevent accidental remote pushes.
- There is **no separate staging/pilot project ref** anywhere in the configuration.

**Rule: migrations `084/085/086` (and all others) must NOT be applied to
`dbjjhhxdkpdreytsozlq`.** It is treated as production. The disabled link stays
disabled and is never re-enabled by this plan.

> Note: migrations `084/085/086` are **already applied and validated on local
> Docker** (fresh `001→086` replay is clean; tenant-isolation behavioral harness
> returns **21/21 — CERTIFIED** locally). So the migration *set is proven* — what is
> missing is a safe *remote* home for it, not more local proof.

---

## 3. Recommended project name

Create the new project with a name that is unmistakably non-production. Recommended:

- **`AcademyOS-Pilot`** (preferred), or
- **`Dabul-Pilot-Staging`**

Ideally place it in a **separate organization** (or at minimum a clearly labeled
one) so it can never be confused with the live `AcademyOS` project. Region:
`us-west-2` to match the live latency profile.

---

## 4. What must be created manually in the Supabase dashboard

Claude cannot create a cloud project. **You (the human)** must, in the Supabase
dashboard:

1. Create a new project named `AcademyOS-Pilot` (or `Dabul-Pilot-Staging`).
2. Choose region `us-west-2`.
3. Set a strong database password and store it in your password manager
   (**not** in the repo, **not** in any tracked file).
4. Confirm it is a **brand-new, empty** project (zero application tables).

---

## 5. What value to provide afterward

After the project is created, provide back **one value**:

- **The new pilot project ref** (the `xxxxxxxxxxxxxxxxxxxx` string), plus confirmation
  it is brand-new and empty.

That ref becomes the single **confirmed safe / non-production target** referenced by
every subsequent step. (The DB password stays with you; the CLI will prompt for it
at push time.)

---

## 6. Phase-by-phase setup plan

Throughout, `<PILOT_REF>` = the new pilot project ref. The live ref
`dbjjhhxdkpdreytsozlq` appears in **none** of these commands.

### Phase 1 — Human creates the project (Section 4 above)
Manual, in the dashboard. Output: `<PILOT_REF>`.

### Phase 2 — Link locally to the PILOT ref (not prod)
The active link is disabled, so we link fresh to the pilot only:
```bash
supabase link --project-ref <PILOT_REF>   # creates a fresh supabase/.temp/ for the pilot
```
The prod link in `supabase/.temp.disabled-local-validation/` stays untouched and
disabled.

### Phase 3 — Apply migrations 001 → 086 (gated remote write)
Preflight first (read-only):
```bash
supabase migration list     # expect: 001–086 all "local, not remote" on the empty pilot
```
**GATE (see Section 7).** Only after explicit approval:
```bash
supabase db push            # applies 001 … 084 → 085 → 086 in filename order to the pilot
```

### Phase 4 — Verify migrations + certification
```bash
supabase migration list     # 084/085/086 now show as applied remotely on the pilot
npm run certify             # 31/31 suites
```

### Phase 5 — Tenant-isolation behavioral validation against the pilot
Run the behavioral harness pointed at the **pilot** connection, using temporary shell
env vars for the pilot — **never** `.env.local`:
```bash
npm run test:tenant-isolation   # target = pilot → live-cloud behavioral PASS
```

### Phase 6 — Pilot env wiring (new file, never overwrite .env.local)
Create a **new, gitignored** `.env.pilot.local` holding the pilot URL + keys. This is
how the app / browser validation targets the pilot without repointing dev off live.
`.gitignore` already covers `.env.*.local`.

### Phase 7 — Dabul seeder (separate future sprint)
Only after Phases 3–5 are green: re-skin the existing God-Mode seed harness to Dabul
per `docs/pilot/DABUL_PILOT_DATASET_SPEC.md` and run it against the **pilot** DB.

### Phase 8 — Browser validation (separate future sprint)
Only after the Dabul dataset is seeded: run the 10 atomic loops
(`docs/testing/ATOMIC_LOOP_USABILITY_TEST_PLAN.md`,
`docs/testing/BRIAN_DABUL_PILOT_TEST_SCRIPT.md`) against the pilot via
`.env.pilot.local`.

---

## 7. Approval gates — where work must STOP

| Gate | Before doing… | Requires |
|---|---|---|
| **G1** | Any linking / remote command | `<PILOT_REF>` provided + confirmed brand-new empty project |
| **G2** | `supabase db push` (Phase 3) | Explicit: **"apply 001→086 to `<PILOT_REF>`, snapshot done"** (a fresh project is empty, so a snapshot is optional; the CLI-echoed ref will be confirmed to match `<PILOT_REF>` before running) |
| **G3** | Dabul seeder (Phase 7) | Phases 3–5 green + explicit approval |
| **G4** | Browser validation (Phase 8) | Dabul dataset seeded + explicit approval |

Each gate is a hard stop. No remote write happens without the matching approval.

---

## 8. How migrations 001 → 086 will be applied (only after the pilot is confirmed)

- Only after **G1** (ref confirmed) and **G2** (explicit push approval).
- Via `supabase db push`, which applies pending migrations in **filename order**, so
  the canonical sequence — including `084 → 085 → 086` — is preserved automatically.
- The CLI-echoed target ref is confirmed to equal `<PILOT_REF>` before the push runs.
- The live ref `dbjjhhxdkpdreytsozlq` is never a target.

---

## 9. How migrations 084 → 085 → 086 will be verified

- `supabase migration list` after the push — confirm `084`, `085`, `086` all show as
  applied **remotely** on the pilot.
- `npm run certify` — 31/31 certification suites.
- Object-level spot check that the 084/085/086 objects exist (mirrors the local
  verification done in Sprint 4367A).

---

## 10. How tenant-isolation behavioral validation runs against the pilot

- `npm run test:tenant-isolation` (harness:
  `scripts/certification/tenantIsolationBehavioralTest.ts`, SQL companion
  `supabase/tests/tenant_isolation_behavioral.sql`), pointed at the **pilot**
  connection via temporary shell env vars — **not** `.env.local`.
- Target result: **21/21 — CERTIFIED** against the live-cloud pilot, which closes the
  outstanding "live staging/cloud behavioral PASS pending" deviation (deviation #3 in
  `docs/CURRENT_BUILD_TARGET.md`). Until then, only the **local Docker** PASS is
  claimed.

---

## 11. How the Dabul seeder runs (only after the pilot DB is aligned)

- Runs **only** after Phases 3–5 are green (migrations applied + certified + tenant
  isolation PASS on the pilot).
- Re-skins the existing God-Mode seed harness to Dabul per
  `docs/pilot/DABUL_PILOT_DATASET_SPEC.md` — **no new seed system is built.**
- Targets the **pilot** DB only. This is a separate future sprint (proposed 4370),
  gated at **G3**.

---

## 12. How browser validation runs (only after the Dabul dataset is safely seeded)

- Runs **only** after the Dabul dataset is seeded on the pilot (Phase 7 complete).
- Uses `.env.pilot.local` so the app points at the pilot, never at the live backend.
- Executes the 10 atomic loops via the existing pilot test artifacts. Separate future
  sprint (proposed 4371), gated at **G4**.

---

## 13. Explicit safety warning

- **No production DB.** The live backend `dbjjhhxdkpdreytsozlq` is never linked,
  connected to, read, migrated, or seeded by this plan.
- **No `.env.local` changes.** It stays pointed at the live backend and is
  read-never-written. Pilot config lives only in a new, gitignored `.env.pilot.local`.
- **No live app backend use.** The pilot is the only remote target; its ref is the
  only ref in every command.
- **The disabled prod link stays disabled** (`supabase/.temp.disabled-local-validation/`
  is never re-enabled).

---

## 14. Exact next human action

**Create the pilot Supabase project manually** in the dashboard
(name `AcademyOS-Pilot` or `Dabul-Pilot-Staging`, region `us-west-2`, strong DB
password stored outside the repo, confirmed brand-new and empty), then **provide the
new pilot project ref** back to Claude.

Nothing else proceeds until that ref is provided and Gate **G1** is satisfied.
