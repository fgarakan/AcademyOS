# Pilot Project — Phase 1 Verification Commands

**Sprint:** 4369B — Phase-1 Pilot Project Verification Command Sequence
**Status:** REFERENCE ONLY — nothing linked, connected, applied, seeded, or committed by writing this file.
**Last updated:** 2026-07-05
**Companion plan:** `docs/pilot/STAGING_PILOT_PROJECT_SETUP_PLAN.md`

---

## 1. Purpose of Phase 1

Preserve the **exact safe, read-only verification sequence** to run the moment a pilot
Supabase project ref is provided. Phase 1 proves — **before any migration is applied** —
that the target project is:

- **not** the production / live app backend, and
- a **brand-new, empty** project.

Phase 1 performs **no remote writes**: it only inspects identity and migration state. No
migration is applied, no data is seeded, and production is never contacted. Applying
migrations is a separate, explicitly-gated step (see Sections 11–12).

---

## 2. What information you MUST provide

| Item | Form | When |
|---|---|---|
| **Pilot project ref** | 20-char string (the `<PILOT_PROJECT_REF>` placeholder below) | Now, to unlock Gate G1 |
| **Confirmation it's brand-new & empty** | Your word that the dashboard project has zero application tables | With the ref |
| **DB password** | Typed **only at the interactive CLI prompt** | At `link`/`push` time — never before, never in a file |

---

## 3. What information you MUST NOT provide

- ❌ The DB password pasted into chat, the repo, `config.toml`, or any tracked/untracked file.
- ❌ The production ref `dbjjhhxdkpdreytsozlq` as a target in any command.
- ❌ Service-role key, `anon` key, or any contents of `.env.local`.
- ❌ Any connection string committed to the repo.
- ❌ Any request to "just apply migrations" without the explicit G2 approval phrase (Section 11).

---

## 4. Production / live backend ref — NEVER use as a target

```
dbjjhhxdkpdreytsozlq
```

This is the live app backend (the running app's `NEXT_PUBLIC_SUPABASE_URL`). Its CLI link is
**deliberately disabled** at `supabase/.temp.disabled-local-validation/` and stays disabled.
It must never be linked, migrated, seeded, read, or written by this plan.

---

## 5. Pilot ref placeholder

Throughout this document:

```
<PILOT_PROJECT_REF>
```

= the new pilot project ref you provide. It must **not** equal `dbjjhhxdkpdreytsozlq`.

---

## 6. Exact read-only Phase-1 verification commands

> Every step below is read-only or a local link. **No remote write occurs anywhere in this
> block.** The production ref appears in none of these commands.

```bash
# --- Step 0: guard the ref locally (no network) ---
PILOT_REF="<PILOT_PROJECT_REF>"
PROD_REF="dbjjhhxdkpdreytsozlq"
if [ "$PILOT_REF" = "$PROD_REF" ]; then echo "ABORT — ref equals PRODUCTION"; else echo "OK — not production: $PILOT_REF"; fi

# --- Step 1: CLI present + ref maps to the pilot-named project (read-only) ---
supabase --version
supabase projects list          # confirm $PILOT_REF row shows name AcademyOS-Pilot / Dabul-Pilot-Staging, NOT bare "AcademyOS"

# --- Step 2: link locally to the PILOT only (creates a fresh supabase/.temp/) ---
supabase link --project-ref "$PILOT_REF"

# --- Step 3: prove the ACTIVE link now targets pilot, not prod ---
cat supabase/.temp/project-ref  # MUST equal $PILOT_REF and NOT dbjjhhxdkpdreytsozlq

# --- Step 4: migration status = proof of empty/new (read-only) ---
supabase migration list         # expect 001–086 LOCAL only, REMOTE column blank
```

**Note:** `supabase link` / `supabase migration list` may prompt for the DB password. Enter it
**only at the prompt** — never store it in a file.

---

## 7. Checks proving the pilot ref is NOT production

1. **Step 0 guard** — `[ "$PILOT_REF" = "$PROD_REF" ]` prints `ABORT` if they match.
2. **`supabase projects list`** — the ref must resolve to a project **named**
   `AcademyOS-Pilot` / `Dabul-Pilot-Staging`, not the bare `AcademyOS` prod project.
3. **`cat supabase/.temp/project-ref`** — the active link equals `$PILOT_REF`, never
   `dbjjhhxdkpdreytsozlq`.
4. **String audit** — `dbjjhhxdkpdreytsozlq` appears in **zero** commands.
5. **Disabled prod link untouched** — `supabase/.temp.disabled-local-validation/project-ref`
   still holds the prod ref and is never renamed back to `.temp`.

---

## 8. Checks proving the pilot project is EMPTY / new

1. **`supabase migration list`** → for **every** `001…086`, the **Remote** column is blank
   (only **Local** populated). Any remote row ⇒ **STOP** (not a fresh project).
2. **Your dashboard confirmation** — brand-new project, zero application tables.
3. *(Optional, read-only)* a `select count(*)` over `public` tables via the pooler connection
   returns 0 — only if table-level proof beyond migration state is wanted.

---

## 9. Migration-status check command

```bash
supabase migration list
```

Pre-push expectation on an empty pilot: **001–086 = Local, Remote blank.**

---

## 10. Gate G1 — pass/fail criteria

**G1 PASS requires ALL of:**

- ✅ `<PILOT_PROJECT_REF>` provided and **≠** `dbjjhhxdkpdreytsozlq`.
- ✅ `supabase projects list` maps the ref to the pilot-named project (not bare `AcademyOS`).
- ✅ `cat supabase/.temp/project-ref` == `$PILOT_REF`.
- ✅ `supabase migration list` shows **001–086 Local only, Remote blank** (empty project).
- ✅ Human confirms the project is brand-new and empty.

**G1 FAIL (STOP) if any of:**

- ❌ Ref equals the production ref.
- ❌ The ref resolves to a project named `AcademyOS` (bare) or any non-pilot name.
- ❌ Any migration already shows as applied Remote.
- ❌ The DB is not confirmed empty.

No linking-dependent or write step proceeds until G1 PASSES.

---

## 11. Gate G2 — STOP gate before applying migrations

**HARD STOP.** No `supabase db push` runs until **all** of:

- G1 has PASSED (Section 10).
- You type the explicit approval phrase:
  **"apply 001→086 to `<PILOT_PROJECT_REF>`, snapshot done."**
- Immediately before the push, `cat supabase/.temp/project-ref` is re-confirmed `== $PILOT_REF`.

Until then: no push, no seed, no remote write.

---

## 12. Phase-2 command sequence — proposed ONLY after G2 approval

```bash
# Re-confirm target one last time before any write
cat supabase/.temp/project-ref            # MUST == $PILOT_REF, != dbjjhhxdkpdreytsozlq

# Gated remote write — applies 001…084→085→086 in filename order to the PILOT
supabase db push

# Verify
supabase migration list                   # 084/085/086 now show Remote (applied)
npm run certify                           # expect 31/31 suites
```

⚠️ **Do NOT** run `npm run test:tenant-isolation` here — its npm script is hardcoded to
`--env-file=.env.local` (= **production**). The live-pilot behavioral run (setup-plan Phase 5)
must be invoked separately with **temporary shell env vars for the pilot**, never via the
`.env.local`-bound npm alias. Prepare that as its own step.

---

## 13. Safety rules (apply throughout)

- **No production.** `dbjjhhxdkpdreytsozlq` is never a target; the disabled prod link stays disabled.
- **No `.env.local`.** It stays pointed at the live backend, read-never-written. Pilot config
  lives only in a future gitignored `.env.pilot.local`.
- **No secrets in repo.** DB password entered at the CLI prompt only.
- **No connection strings committed.** Ever.
- **No migrations until approved.** Gate G2 must pass first.
- **No Dabul seed until migrations are aligned.** Seeder is gated at G3 (setup-plan Phase 7).
- **No browser validation until the dataset exists.** Gated at G4 (setup-plan Phase 8).
