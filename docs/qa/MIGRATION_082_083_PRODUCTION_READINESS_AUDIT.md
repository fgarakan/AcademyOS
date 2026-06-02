# Migration 082–083 Production Readiness Audit

**Date:** 2026-06-02
**Auditor:** Claude Code
**Status:** PATCHED — both migrations updated, TypeScript clean

---

## Migration 082 — assessment_templates_seed.sql

### Pass / Fail

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Seed data is idempotent | ❌ FAIL → ✅ FIXED | DO block ran unconditionally — would create duplicate global template on re-run |
| 2 | No duplicate global templates | ❌ FAIL → ✅ FIXED | No unique constraint or guard prevented duplicate `is_global=true` rows |
| 3 | No duplicate sections | ❌ FAIL → ✅ FIXED | Sections tied to new template ID — would create new set on re-run |
| 4 | No duplicate skills | ❌ FAIL → ✅ FIXED | Same as sections |
| 5 | No duplicate template versions | ✅ PASS | No version inserts in 082 |
| 6 | Re-running does not create duplicate records | ❌ FAIL → ✅ FIXED | Idempotency guard added |
| 7 | UPSERT or conflict strategy is safe | ❌ FAIL → ✅ FIXED | Pure INSERT with no ON CONFLICT — replaced with existence-check guard |
| 8 | Academy clone behavior is safe | ✅ PASS | Academy clones not affected by seed re-run |
| 9 | Sort order is stable | ✅ PASS | Hard-coded integers |
| 10 | Version labels are stable | ✅ PASS | platform_version = '1.0' hard-coded |
| 11 | Partial application safe | ❌ FAIL → ✅ FIXED | Guard now skips if any global template exists |

### Fixes applied to 082

1. **Idempotency guard added** — `IF EXISTS (SELECT 1 FROM assessment_templates WHERE is_global = true)` wraps the entire DO block. If a global template already exists, the migration logs a notice and returns without inserting anything.

2. **Partial unique index added** — `CREATE UNIQUE INDEX IF NOT EXISTS idx_at_single_global ON assessment_templates(is_global) WHERE is_global = true` enforces the single-global-template rule at the DB level, preventing future duplicates even if the application layer is bypassed.

### 082 verdict: ✅ GO (after patch)

---

## Migration 083 — player_evidence_records.sql

### Pass / Fail

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | All policies are idempotent | ✅ PASS | All 7 policies have DROP POLICY IF EXISTS guards |
| 2 | All triggers are idempotent | ✅ PASS | DROP TRIGGER IF EXISTS before CREATE TRIGGER |
| 3 | All indexes use IF NOT EXISTS | ✅ PASS | All 5 indexes (including UNIQUE) use IF NOT EXISTS |
| 4 | Player Passport model is correct | ⚠️ PARTIAL → ✅ FIXED | Missing fields added (see below) |
| 5 | player_id does NOT use ON DELETE CASCADE | ❌ FAIL → ✅ FIXED | Was `NOT NULL ... ON DELETE CASCADE` — breaks anonymized retention |
| 6 | player_id is nullable | ❌ FAIL → ✅ FIXED | Was `NOT NULL` — must be nullable for exit/anonymization path |
| 7 | anonymized_player_key exists | ❌ FAIL → ✅ FIXED | Added |
| 8 | former_player_stage exists | ❌ FAIL → ✅ FIXED | Added |
| 9 | former_player_age_band exists | ❌ FAIL → ✅ FIXED | Added |
| 10 | evidence_category exists | ⚠️ MISSING → ✅ ADDED | Added as nullable TEXT (recommended, not enforced) |
| 11 | expires_at exists | ⚠️ MISSING → ✅ ADDED | Added as nullable TIMESTAMPTZ (GDPR / consent expiry) |
| 12 | evidence_weight exists | ⚠️ MISSING → ✅ ADDED | Added as NUMERIC(4,2) DEFAULT 1.0 (rollup weighting) |
| 13 | RLS protects parent/player safety | ✅ PASS | All 7 policies correct — visible_to_parent/player gate enforced |
| 14 | Parent/player cannot see internal-only evidence | ✅ PASS | RLS gates on visible_to_parent/player booleans (default false) |
| 15 | Academy retains anonymized aggregate after exit | ❌ FAIL → ✅ FIXED | ON DELETE CASCADE would delete records — now ON DELETE SET NULL |
| 16 | Portable data exportable without raw coach notes | ✅ PASS | coach_observation = internal_only/academy_owned by design |

### Fixes applied to 083

1. **`player_id` changed to nullable with `ON DELETE SET NULL`**
   - Before: `player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE`
   - After: `player_id UUID REFERENCES players(id) ON DELETE SET NULL`
   - Rationale: `ON DELETE CASCADE` would silently destroy all evidence when a player row is deleted. For `anonymized_on_exit` records, the data must survive with `player_id = NULL` for aggregate analytics.

2. **`anonymized_player_key TEXT` added** — stable pseudonymous identifier set at exit time, enabling aggregate analysis after `player_id` is nulled.

3. **`former_player_stage TEXT` added** — curriculum stage snapshot preserved for aggregate program analytics ("how many orange ball students progressed to green ball?").

4. **`former_player_age_band TEXT` added** — age band snapshot for demographic aggregate analytics.

5. **`evidence_category TEXT` added** (nullable) — orthogonal category classification beyond `source_type` and `pathway`. Expected values: `assessment | observation | milestone | administrative | program_analytics`.

6. **`expires_at TIMESTAMPTZ` added** (nullable) — supports GDPR right-to-erasure workflows and consent-limited data. Application layer checks this field; not enforced at DB level in V1.

7. **`evidence_weight NUMERIC(4,2) DEFAULT 1.0` added** — relative weight for rollup calculations. Director-approved assessments can carry higher weight than quick observations.

8. **`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` guards added** — ensures the migration is safe to run on environments where the table was previously created without these columns. Six `ADD COLUMN IF NOT EXISTS` statements cover all new fields.

9. **FK repair block added** — `DROP CONSTRAINT IF EXISTS player_evidence_records_player_id_fkey` + `ADD CONSTRAINT ... ON DELETE SET NULL` handles environments where the table was already created with the wrong FK behavior.

### 083 verdict: ✅ GO (after patch)

---

## TypeScript changes

| File | Change |
|---|---|
| `src/lib/evidence/playerEvidenceTypes.ts` | `player_id: string | null`, added `evidence_category`, `evidence_weight`, `anonymized_player_key`, `former_player_stage`, `former_player_age_band`, `expires_at` to `EvidenceRecord` |
| `src/lib/evidence/playerEvidenceAggregator.ts` | Updated both fallback record shapes with new fields |
| `src/lib/evidence/pilotTestHarness.ts` | Updated all 7 test fixture records with new fields |

TypeScript: clean.

---

## Production checklist before applying

- [ ] Apply migration 081 (assessment template tables)
- [ ] Apply migration 082 (seed — idempotent after patch)
- [ ] Apply migration 083 (evidence records — patched)
- [ ] Verify: `SELECT COUNT(*) FROM assessment_templates WHERE is_global = true` = 1
- [ ] Verify: `SELECT COUNT(*) FROM assessment_template_sections` = 7
- [ ] Verify: `SELECT COUNT(*) FROM assessment_template_skills` = 55 (approx)
- [ ] Verify: `player_evidence_records` table exists
- [ ] Verify: `player_id` column is nullable (`SELECT is_nullable FROM information_schema.columns WHERE table_name = 'player_evidence_records' AND column_name = 'player_id'` = 'YES')
- [ ] Verify: `anonymized_player_key` column exists
- [ ] Verify: `former_player_stage` column exists
- [ ] Verify: `former_player_age_band` column exists
- [ ] Verify: `evidence_weight` column exists

---

## Deferred (not blocking production)

- Academy exit/anonymization UI (sets `player_id = NULL`, populates `anonymized_player_key`, sets `former_player_stage`/`former_player_age_band`)
- Player Passport export UI
- Consent management UI for `consent_status` / `consent_version`
- `expires_at` enforcement (application layer check)
- `evidence_category` population in evidence writer (nullable, not yet populated)
