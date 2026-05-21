# Supabase Pending Migrations 041–044 — Manual Execution Packet

**Generated:** 2026-05-21
**Target:** Supabase Dashboard → SQL Editor (manual execution only)
**Status:** DO NOT APPLY until you have read the risk section and resolved RISK-1 below.

---

## Pre-flight checklist (complete before opening SQL Editor)

- [ ] You are connected to the correct Supabase project (check project URL in dashboard)
- [ ] You have reviewed RISK-1 (status value mismatch) below
- [ ] You have a recent Supabase backup or can restore if needed
- [ ] Migrations 001–040 have already been applied to this database
- [ ] Migrations 036 and 037 (curriculum spine + seed) have been applied — required by 043

---

## Execution order

Run in this exact sequence. Do not skip or reorder.

| # | File | Purpose | Idempotent? |
|---|---|---|---|
| 1 | `041_requirement_domains.sql` | Creates 4 tables + 1 view + RLS | **No** — will error if tables exist |
| 2 | `042_requirement_domain_seed.sql` | Seeds 3 domain rows | Yes — ON CONFLICT DO UPDATE |
| 3 | `043_orange_ball_starter_requirements.sql` | Seeds 32 requirements for Orange 1–3 | Yes — ON CONFLICT DO NOTHING |
| 4 | `044_player_requirement_progress_bootstrap.sql` | Creates progress rows for current players | Yes — ON CONFLICT DO NOTHING |

---

## RISKS — Read before executing

---

### RISK-1 (MEDIUM — functional impact post-migration) — Status value mismatch

**This does not block the migrations from applying, but the progress bars will show 0% after migration until the TypeScript layer is fixed.**

The `player_requirement_progress.status` CHECK constraint in migration 041 allows:
```
'not_started', 'in_progress', 'evidence_needed', 'met', 'waived', 'blocked'
```

The TypeScript layer (`src/lib/player/evidenceQueries.ts` and `src/lib/player/progressIndicators.ts`) filters for:
```
'not_started'  ✓ matches DB
'in_progress'  ✓ matches DB
'achieved'     ✗ NOT a valid DB value — will always count as 0
'confirmed'    ✗ NOT a valid DB value — will always count as 0
```

**Impact:** After migration 041–044 are applied, the `/player/skill-path` progress bar, badge eligibility engine completion checks, and `buildPlayerProgressIndicators()` all use `achieved + confirmed` for the completion percentage. These will always be 0 even after coaches mark requirements as `'met'`.

**Fix required (TypeScript side, not migration side):**
In `src/lib/player/evidenceQueries.ts`, change status filter:
- `r.status === 'achieved'` → `r.status === 'met'`
- `r.status === 'confirmed'` → `r.status === 'waived'` (or remove — no direct DB equivalent)

In `src/lib/player/progressIndicators.ts`, update the matching status checks similarly.

**Recommendation:** Apply the migrations, then immediately apply the TypeScript fix in a separate sprint before showing progress bars to players.

---

### RISK-2 (LOW) — Migration 041 is not idempotent

`041_requirement_domains.sql` uses plain `CREATE TABLE` statements. If any of the 4 tables already exist (from a prior failed run or manual creation), the migration will error with `ERROR: relation "curriculum_requirement_domains" already exists`.

**Mitigation:** Check the database before running:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'curriculum_requirement_domains',
  'curriculum_track_requirements',
  'player_requirement_progress',
  'requirement_evidence_links'
);
```
If any rows appear, those tables already exist. Stop — do not run 041.

---

### RISK-3 (LOW) — Migration 043 depends on live data

Migration 043 looks up `curriculum_levels` rows by `(stage='orange_development', level_number=1/2/3)`. If migration 036 was not applied, or the curriculum_levels rows do not exist for any reason, the migration will abort with a clear RAISE EXCEPTION error message. This is safe — the transaction rolls back and no partial data is written.

---

### RISK-4 (LOW) — Migration 044 may insert 0 rows

Migration 044 only inserts progress rows for players whose `player_curriculum_states.current_level_id` maps to an `orange_development` level. If no players are currently assigned to Orange 1, 2, or 3, the INSERT inserts 0 rows and the migration succeeds silently. This is expected and correct.

---

### RISK-5 (INFO) — Pre-existing TypeScript bug in portal pages (separate from migrations)

The pages `src/app/player/missions/page.tsx` and `src/app/player/skill-path/page.tsx` query `player_curriculum_states` using `.select('curriculum_level_id')` but the actual column name is `current_level_id`. This means the `currentLevelName` will always be `null` after migration (the level name header will show the fallback). This is a pre-existing query bug unrelated to migrations 041–044. It should be fixed in a separate sprint after migrations are applied.

---

## Migration 1 of 4 — `041_requirement_domains.sql`

### Purpose
Creates the schema foundation for curriculum requirement tracking:
- `curriculum_requirement_domains` — global pathway domain buckets (skill/competition/fitness)
- `curriculum_track_requirements` — named requirements per curriculum level
- `player_requirement_progress` — per-player per-requirement progress tracking
- `requirement_evidence_links` — polymorphic evidence links to requirements
- `v_player_requirement_progress_detail` — read-only joined view

### Pre-run check
```sql
-- Run this first. Expected result: 0 rows. If any rows, STOP.
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'curriculum_requirement_domains',
  'curriculum_track_requirements',
  'player_requirement_progress',
  'requirement_evidence_links'
);
```

### SQL to run
```sql
-- ============================================================
-- ACADEMY OS — MIGRATION 041: REQUIREMENT DOMAIN TABLES
-- ============================================================

CREATE TABLE curriculum_requirement_domains (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key           TEXT        NOT NULL UNIQUE CHECK (key IN ('skill', 'competition', 'fitness')),
  label         TEXT        NOT NULL,
  description   TEXT,
  display_order INTEGER     NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_curriculum_req_domains_active
  ON curriculum_requirement_domains(is_active, display_order);

ALTER TABLE curriculum_requirement_domains ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_curriculum_req_domains_updated_at
  BEFORE UPDATE ON curriculum_requirement_domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE curriculum_track_requirements (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id                UUID        REFERENCES academies(id) ON DELETE CASCADE,
  curriculum_level_id       UUID        NOT NULL REFERENCES curriculum_levels(id) ON DELETE CASCADE,
  requirement_domain_id     UUID        NOT NULL REFERENCES curriculum_requirement_domains(id) ON DELETE RESTRICT,
  title                     TEXT        NOT NULL,
  description               TEXT,
  requirement_type          TEXT        NOT NULL DEFAULT 'qualitative'
                            CHECK (requirement_type IN (
                              'qualitative', 'quantitative', 'attendance',
                              'assessment', 'evidence_count', 'coach_confirmed'
                            )),
  measurement_method        TEXT,
  target_value              NUMERIC,
  unit                      TEXT,
  pass_condition            TEXT,
  evidence_policy           TEXT        NOT NULL DEFAULT 'coach_confirmed'
                            CHECK (evidence_policy IN (
                              'coach_confirmed', 'director_confirmed', 'assessment_required',
                              'evidence_count_required', 'manual_review'
                            )),
  is_required               BOOLEAN     NOT NULL DEFAULT true,
  display_order             INTEGER     NOT NULL DEFAULT 0,
  is_parent_visible_default BOOLEAN     NOT NULL DEFAULT false,
  is_player_visible_default BOOLEAN     NOT NULL DEFAULT false,
  source_type               TEXT        NOT NULL DEFAULT 'global_default'
                            CHECK (source_type IN (
                              'global_default', 'academy_override',
                              'program_override', 'session_override'
                            )),
  source_id                 UUID,
  version                   INTEGER     NOT NULL DEFAULT 1,
  is_active                 BOOLEAN     NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_curriculum_track_req_global_unique
  ON curriculum_track_requirements (curriculum_level_id, requirement_domain_id, title, version)
  WHERE academy_id IS NULL;

CREATE UNIQUE INDEX idx_curriculum_track_req_academy_unique
  ON curriculum_track_requirements (academy_id, curriculum_level_id, requirement_domain_id, title, version)
  WHERE academy_id IS NOT NULL;

CREATE INDEX idx_curriculum_track_req_level    ON curriculum_track_requirements(curriculum_level_id);
CREATE INDEX idx_curriculum_track_req_domain   ON curriculum_track_requirements(requirement_domain_id);
CREATE INDEX idx_curriculum_track_req_academy  ON curriculum_track_requirements(academy_id);
CREATE INDEX idx_curriculum_track_req_active   ON curriculum_track_requirements(is_active, display_order);

ALTER TABLE curriculum_track_requirements ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_curriculum_track_req_updated_at
  BEFORE UPDATE ON curriculum_track_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE player_requirement_progress (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id             UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  curriculum_level_id   UUID        NOT NULL REFERENCES curriculum_levels(id) ON DELETE CASCADE,
  requirement_id        UUID        NOT NULL REFERENCES curriculum_track_requirements(id) ON DELETE CASCADE,
  status                TEXT        NOT NULL DEFAULT 'not_started'
                        CHECK (status IN (
                          'not_started', 'in_progress', 'evidence_needed',
                          'met', 'waived', 'blocked'
                        )),
  progress_value        NUMERIC,
  evidence_count        INTEGER     NOT NULL DEFAULT 0,
  last_evidence_at      TIMESTAMPTZ,
  coach_confirmed_by    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  director_confirmed_by UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  confirmed_at          TIMESTAMPTZ,
  notes                 TEXT,
  is_parent_visible     BOOLEAN     NOT NULL DEFAULT false,
  is_player_visible     BOOLEAN     NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, requirement_id)
);

CREATE INDEX idx_player_req_progress_academy  ON player_requirement_progress(academy_id);
CREATE INDEX idx_player_req_progress_player   ON player_requirement_progress(player_id);
CREATE INDEX idx_player_req_progress_level    ON player_requirement_progress(curriculum_level_id);
CREATE INDEX idx_player_req_progress_req      ON player_requirement_progress(requirement_id);
CREATE INDEX idx_player_req_progress_status   ON player_requirement_progress(status);

ALTER TABLE player_requirement_progress ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_player_req_progress_updated_at
  BEFORE UPDATE ON player_requirement_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE requirement_evidence_links (
  id                             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id                     UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id                      UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  requirement_id                 UUID        NOT NULL REFERENCES curriculum_track_requirements(id) ON DELETE CASCADE,
  player_requirement_progress_id UUID        REFERENCES player_requirement_progress(id) ON DELETE SET NULL,
  evidence_type                  TEXT        NOT NULL
                                 CHECK (evidence_type IN (
                                   'coach_observation', 'assessment', 'attendance',
                                   'session_result', 'app_homework', 'match_result',
                                   'player_priority', 'manual_note'
                                 )),
  evidence_id                    UUID        NOT NULL,
  evidence_summary               TEXT,
  confidence                     NUMERIC     CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  weight                         NUMERIC     CHECK (weight IS NULL OR weight >= 0),
  created_by                     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_parent_safe                 BOOLEAN     NOT NULL DEFAULT false
);

CREATE INDEX idx_req_evidence_academy    ON requirement_evidence_links(academy_id);
CREATE INDEX idx_req_evidence_player     ON requirement_evidence_links(player_id);
CREATE INDEX idx_req_evidence_req        ON requirement_evidence_links(requirement_id);
CREATE INDEX idx_req_evidence_progress   ON requirement_evidence_links(player_requirement_progress_id);
CREATE INDEX idx_req_evidence_type       ON requirement_evidence_links(evidence_type);
CREATE INDEX idx_req_evidence_id         ON requirement_evidence_links(evidence_id);
CREATE INDEX idx_req_evidence_created_at ON requirement_evidence_links(created_at);

ALTER TABLE requirement_evidence_links ENABLE ROW LEVEL SECURITY;


CREATE VIEW v_player_requirement_progress_detail AS
SELECT
  prp.id                    AS progress_id,
  prp.academy_id,
  prp.player_id,
  prp.curriculum_level_id,
  prp.requirement_id,
  ctr.title                 AS requirement_title,
  ctr.description           AS requirement_description,
  ctr.requirement_type,
  crd.key                   AS requirement_domain_key,
  crd.label                 AS requirement_domain_label,
  cl.display_name           AS level_display_name,
  cl.level_number,
  prp.status,
  prp.progress_value,
  prp.evidence_count,
  prp.last_evidence_at,
  ctr.is_required,
  prp.is_parent_visible,
  prp.is_player_visible,
  crd.display_order         AS domain_display_order,
  ctr.display_order         AS requirement_display_order
FROM  player_requirement_progress  prp
JOIN  curriculum_track_requirements  ctr ON ctr.id  = prp.requirement_id
JOIN  curriculum_requirement_domains crd ON crd.id  = ctr.requirement_domain_id
JOIN  curriculum_levels              cl  ON cl.id   = prp.curriculum_level_id;


CREATE POLICY "Authenticated read requirement domains"
  ON curriculum_requirement_domains FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Directors manage requirement domains"
  ON curriculum_requirement_domains FOR ALL
  USING (auth_is_director_or_head());


CREATE POLICY "Authenticated read global and own academy requirements"
  ON curriculum_track_requirements FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      academy_id IS NULL
      OR academy_id = auth_academy_id()
    )
  );

CREATE POLICY "Directors manage academy requirements"
  ON curriculum_track_requirements FOR ALL
  USING (
    academy_id IS NOT NULL
    AND academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );


CREATE POLICY "Staff see player requirement progress"
  ON player_requirement_progress FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff manage player requirement progress"
  ON player_requirement_progress FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());


CREATE POLICY "Staff see requirement evidence links"
  ON requirement_evidence_links FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff manage requirement evidence links"
  ON requirement_evidence_links FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());
```

### Expected success result
- 4 tables created, 0 errors
- `CREATE TABLE`, `CREATE INDEX` (×12), `ALTER TABLE` (×4), `CREATE TRIGGER` (×3), `CREATE VIEW`, `CREATE POLICY` (×8)

### Stop if you see
- `ERROR: relation "curriculum_requirement_domains" already exists` — tables already exist; stop and investigate
- `ERROR: function update_updated_at_column() does not exist` — migration 036 not applied; apply 036 first
- `ERROR: function auth_is_director_or_head() does not exist` — migration 003 not applied; apply 003 first
- `ERROR: relation "curriculum_levels" does not exist` — migration 036 not applied

### Verification SQL
```sql
SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'curriculum_requirement_domains',
  'curriculum_track_requirements',
  'player_requirement_progress',
  'requirement_evidence_links'
)
ORDER BY table_name;
-- Expected: 4 rows

SELECT viewname FROM pg_views
WHERE schemaname = 'public' AND viewname = 'v_player_requirement_progress_detail';
-- Expected: 1 row

SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN (
  'curriculum_requirement_domains',
  'curriculum_track_requirements',
  'player_requirement_progress',
  'requirement_evidence_links'
)
ORDER BY tablename, policyname;
-- Expected: 8 rows (2 per table)
```

### Rollback (if needed — destructive, use only to undo a bad run)
```sql
-- Run only if you need to undo migration 041.
-- This drops all data in these tables.
DROP VIEW IF EXISTS v_player_requirement_progress_detail;
DROP TABLE IF EXISTS requirement_evidence_links CASCADE;
DROP TABLE IF EXISTS player_requirement_progress CASCADE;
DROP TABLE IF EXISTS curriculum_track_requirements CASCADE;
DROP TABLE IF EXISTS curriculum_requirement_domains CASCADE;
```

---

## Migration 2 of 4 — `042_requirement_domain_seed.sql`

### Purpose
Seeds 3 rows into `curriculum_requirement_domains`: `skill`, `competition`, `fitness`.

### SQL to run
```sql
-- ============================================================
-- ACADEMY OS — MIGRATION 042: REQUIREMENT DOMAIN SEED
-- ============================================================

INSERT INTO curriculum_requirement_domains (key, label, description, display_order, is_active)
VALUES
  (
    'skill',
    'Skill Path',
    'Technical and tactical development requirements connected to stroke skills, movement patterns, decision-making, and tennis-specific competency.',
    10,
    true
  ),
  (
    'competition',
    'Competition Path',
    'Competition-readiness requirements connected to match play, point construction, scoring situations, resilience, and tournament behavior.',
    20,
    true
  ),
  (
    'fitness',
    'Fitness Path',
    'Physical development requirements connected to movement quality, speed, agility, strength, recovery, readiness, and tennis-specific athletic capacity.',
    30,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  label         = EXCLUDED.label,
  description   = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active     = EXCLUDED.is_active,
  updated_at    = now();
```

### Expected success result
- `INSERT 0 3` (first run) or `UPDATE 3` (re-run — idempotent)

### Stop if you see
- `ERROR: relation "curriculum_requirement_domains" does not exist` — migration 041 not applied yet
- `ERROR: insert or update on table "curriculum_requirement_domains" violates check constraint` — key value is not in ('skill','competition','fitness'); the SQL above is correct, so this would mean the file was edited

### Verification SQL
```sql
SELECT key, label, display_order FROM curriculum_requirement_domains ORDER BY display_order;
-- Expected: 3 rows: skill (10), competition (20), fitness (30)
```

---

## Migration 3 of 4 — `043_orange_ball_starter_requirements.sql`

### Purpose
Seeds 32 curriculum requirement definitions for Orange Ball levels:
- Orange 1 — Rally: 4 skill + 3 competition + 3 fitness = 10 requirements
- Orange 2 — Direction: 5 skill + 3 competition + 3 fitness = 11 requirements
- Orange 3 — Construction: 4 skill + 4 competition + 3 fitness = 11 requirements

All are global defaults (`academy_id = NULL`). Idempotent via ON CONFLICT DO NOTHING.

### SQL to run
Paste the full contents of `supabase/migrations/043_orange_ball_starter_requirements.sql`.

> The file is 510 lines. Copy the entire file contents and paste into the SQL Editor as-is. Do not edit.

### Expected success result
- `DO` (PL/pgSQL block executed without exception)
- No RAISE EXCEPTION triggered (means all level and domain IDs resolved)

### Stop if you see
- `ERROR: curriculum_levels row not found: stage=orange_development level_number=1` — migration 036 not applied; apply 036 first
- `ERROR: curriculum_requirement_domains row not found: key=skill` — migration 042 not applied; run 042 first
- Any other RAISE EXCEPTION — means a dependency row is missing; investigate before proceeding

### Verification SQL
```sql
SELECT
  cl.display_name AS level,
  crd.key AS domain,
  COUNT(*) AS requirement_count
FROM curriculum_track_requirements ctr
JOIN curriculum_levels cl ON cl.id = ctr.curriculum_level_id
JOIN curriculum_requirement_domains crd ON crd.id = ctr.requirement_domain_id
WHERE ctr.academy_id IS NULL
  AND cl.stage = 'orange_development'
GROUP BY cl.display_name, cl.level_number, crd.key, crd.display_order
ORDER BY cl.level_number, crd.display_order;
-- Expected 9 rows:
-- Orange 1 — Rally:       skill=4, competition=3, fitness=3
-- Orange 2 — Direction:   skill=5, competition=3, fitness=3
-- Orange 3 — Construction:skill=4, competition=4, fitness=3

SELECT COUNT(*) FROM curriculum_track_requirements WHERE academy_id IS NULL AND is_active = true;
-- Expected: 32
```

---

## Migration 4 of 4 — `044_player_requirement_progress_bootstrap.sql`

### Purpose
Creates `player_requirement_progress` rows for players currently assigned to Orange 1, 2, or 3. All rows start with `status = 'not_started'`. If no players are on Orange Ball levels, 0 rows are inserted and the migration succeeds silently.

### SQL to run
```sql
-- ============================================================
-- ACADEMY OS — MIGRATION 044: PLAYER REQUIREMENT PROGRESS BOOTSTRAP
-- ============================================================

INSERT INTO player_requirement_progress (
  academy_id,
  player_id,
  curriculum_level_id,
  requirement_id,
  status,
  progress_value,
  evidence_count,
  last_evidence_at,
  notes,
  is_parent_visible,
  is_player_visible
)
SELECT
  pcs.academy_id,
  pcs.player_id,
  pcs.current_level_id,
  ctr.id,
  'not_started',
  NULL,
  0,
  NULL,
  NULL,
  false,
  false
FROM player_curriculum_states pcs
JOIN curriculum_levels cl
  ON cl.id = pcs.current_level_id
JOIN curriculum_track_requirements ctr
  ON ctr.curriculum_level_id = cl.id
WHERE cl.stage = 'orange_development'
  AND cl.level_number IN (1, 2, 3)
  AND ctr.academy_id IS NULL
  AND ctr.source_type = 'global_default'
  AND ctr.version = 1
  AND ctr.is_active = true
ON CONFLICT (player_id, requirement_id) DO NOTHING;
```

### Expected success result
- `INSERT 0 N` where N = (number of Orange Ball players) × (requirements per their level)
- `INSERT 0 0` if no players are currently on Orange Ball levels — this is valid

### Stop if you see
- `ERROR: column pcs.current_level_id does not exist` — unexpected; `player_curriculum_states` schema may be different from expected
- `ERROR: null value in column "academy_id"` — a `player_curriculum_states` row has null academy_id; investigate data quality
- Any FK violation — a `curriculum_track_requirements` row has a NULL or invalid ID; investigate

### Verification SQL
```sql
-- Count bootstrapped rows by level
SELECT
  cl.display_name AS level,
  COUNT(DISTINCT prp.player_id) AS player_count,
  COUNT(*) AS progress_rows
FROM player_requirement_progress prp
JOIN curriculum_levels cl ON cl.id = prp.curriculum_level_id
WHERE cl.stage = 'orange_development'
GROUP BY cl.display_name, cl.level_number
ORDER BY cl.level_number;
-- Each player on Orange 1 contributes 10 rows, Orange 2 = 11 rows, Orange 3 = 11 rows.

SELECT status, COUNT(*) FROM player_requirement_progress GROUP BY status;
-- Expected: all rows have status = 'not_started'
```

---

## Final verification SQL (run after all 4 migrations complete)

```sql
-- 1. All 4 tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'curriculum_requirement_domains',
  'curriculum_track_requirements',
  'player_requirement_progress',
  'requirement_evidence_links'
)
ORDER BY table_name;
-- Expected: 4 rows

-- 2. 3 domain rows
SELECT key, label FROM curriculum_requirement_domains ORDER BY display_order;
-- Expected: skill, competition, fitness

-- 3. 32 global requirements
SELECT COUNT(*) AS req_count
FROM curriculum_track_requirements
WHERE academy_id IS NULL AND is_active = true;
-- Expected: 32

-- 4. RLS is enabled on all 4 tables
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN (
  'curriculum_requirement_domains',
  'curriculum_track_requirements',
  'player_requirement_progress',
  'requirement_evidence_links'
)
ORDER BY relname;
-- Expected: relrowsecurity = true for all 4

-- 5. 8 RLS policies exist
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN (
  'curriculum_requirement_domains',
  'curriculum_track_requirements',
  'player_requirement_progress',
  'requirement_evidence_links'
)
ORDER BY tablename, policyname;
-- Expected: 8 rows

-- 6. View exists
SELECT viewname FROM pg_views
WHERE schemaname = 'public' AND viewname = 'v_player_requirement_progress_detail';
-- Expected: 1 row

-- 7. Progress row count (informational)
SELECT COUNT(*) AS total_progress_rows FROM player_requirement_progress;
-- Expected: >= 0 (0 is valid if no Orange Ball players)
```

---

## Post-migration follow-up (do not do this now — separate sprint)

After migrations are applied, two TypeScript bugs need fixing:

### Follow-up 1 — Status value mismatch (RISK-1)

**File:** `src/lib/player/evidenceQueries.ts`

Change in `summarizeRequirementProgress()`:
```typescript
// Before:
else if (r.status === 'achieved') summary.achieved++
else if (r.status === 'confirmed') summary.confirmed++

// After:
else if (r.status === 'met') summary.achieved++
else if (r.status === 'waived') summary.confirmed++
```

**File:** `src/lib/player/progressIndicators.ts`

Change matching status checks from `'achieved'`/`'confirmed'` to `'met'`/`'waived'`.

### Follow-up 2 — Wrong column name in portal pages (RISK-5)

**Files:** `src/app/player/missions/page.tsx`, `src/app/player/skill-path/page.tsx`

Change:
```typescript
.select('curriculum_level_id')  // wrong
// to:
.select('current_level_id')     // correct column in player_curriculum_states
```
And update the corresponding `.curriculum_level_id` accessor to `.current_level_id`.

---

## Summary

| Migration | Safe to apply? | Destructive? | Idempotent? | Blocker? |
|---|---|---|---|---|
| 041 | Yes | No | No | None — but see pre-run check |
| 042 | Yes | No | Yes | None |
| 043 | Yes | No | Yes | Requires 036 data + 042 data |
| 044 | Yes | No | Yes | Requires 041 + 043 data |

**Overall recommendation:** Safe to apply manually in order. No data loss risk. No RLS weakening. Apply 041 → 042 → 043 → 044. Then schedule the TypeScript follow-up sprint for RISK-1 and RISK-5 before showing progress bars to players.
