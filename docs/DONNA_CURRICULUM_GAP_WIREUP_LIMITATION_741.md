# DONNA Curriculum Gap Wire-Up — Sprint 741 Limitation Doc

**Date:** 2026-05-24  
**Sprint:** 741 — DONNA Live Curriculum Gap Wire-Up V1  
**Status:** Partial live wiring — structural gaps wired, player-progress gaps blocked

---

## What Was Wired (Live as of Sprint 741)

### Structural Curriculum Gap Detection

**File:** `src/lib/donna/curriculumStructuralGapLoader.ts`  
**Wired into:** `src/lib/donna/directorDonnaContext.ts` — section 7  
**Function:** `loadCurriculumStructuralGaps(db, academyId) → string[]`

**Gap types now computable:**

| Gap type | Source tables | Scope |
|---|---|---|
| Level with no advancement gates | `curriculum_levels` + `curriculum_gates.from_level_id` | Global (shared curriculum spine) |
| Level with no drills | `curriculum_levels` + `curriculum_drills.level_min_id` | Global drills (academy_id = null) + academy drills (academy_id = this academy) |
| Level with neither gates nor drills | Both above | Global + academy |

**Example gap strings DONNA can now surface:**
- `"Orange 2 — no advancement gates defined (5 drills exist)"`
- `"Red 1 — no drills or advancement gates defined"`
- `"HP 3 — no drills defined (2 gates exist)"`

**Field status behavior:**
- `'live'` — structural query ran and returned one or more gaps
- `'partial'` — structural query ran and returned no gaps (all levels have content, or RLS silently returned empty)
- `'insufficient_data'` — query threw an unexpected error

---

## What Remains Blocked (Not Wired)

### 1. Player-Progress Gaps

**Block reason:** Requires `player_requirement_progress` and `curriculum_requirements` tables — these are part of migrations 041–044 which are not yet applied to the live database.

**Blocked gap types:**
- Players stalled at a level with no recent gate evidence
- Skills with no passing evidence for any enrolled player
- Gate threshold not met for N players after M sessions
- Level where advancement_eligible is true but director has not acted

**Required migrations to unblock:**
1. `supabase/migrations/041_requirement_domains.sql` — creates `requirement_evidence_links` and related tables
2. `supabase/migrations/042_requirement_domain_seed.sql`
3. `supabase/migrations/043_orange_ball_starter_requirements.sql`
4. `supabase/migrations/044_player_requirement_progress_bootstrap.sql`
5. `supabase/migrations/060_gate_status_repair.sql`

**File documenting the blocked bottleneck loader:**
`src/lib/donna/curriculumBottleneckLoader.ts` — returns `blocked_by_schema` until these migrations are applied.

---

### 2. Template-to-Level Gaps

**Block reason:** `templates.curriculum_level_id` column does not exist on the live database. Migration 045 adds it but has not been applied.

**Blocked gap type:**
- "Level X has players and gates but no class templates assigned"

**Required migration to unblock:**
- `supabase/migrations/045_curriculum_level_id_on_templates.sql`

After applying, run `supabase gen types typescript` to regenerate `database.types.ts`.

---

### 3. Parent/Player-Safe Description Gaps

**Block reason:** `curriculum_content_items.parent_safe_description` is optional (nullable). Checking for null values requires the content items migration (061) to be applied to the live database first so the column actually exists.

**Blocked gap type:**
- "Content item X has no parent-safe description"

**Required migration to unblock:**
- `supabase/migrations/061_curriculum_content_taxonomy.sql`

---

## What DONNA Can Honestly Answer After Sprint 741

When the director asks gap questions:

| Prompt | DONNA behavior |
|---|---|
| "What is missing from my curriculum?" | Returns structural gaps (no gates / no drills per level) if any; routes to Curriculum page |
| "Which levels have no gates?" | Covered by structural gap scan |
| "Which levels have no drills?" | Covered by structural gap scan |
| "Are there gaps in my curriculum?" | Returns live structural gaps if available |
| "What should I fix first in curriculum?" | Routes to Curriculum Builder with gap context |
| "Do any levels have no templates?" | Honest: "template-to-level links are not yet queryable — go to Curriculum Builder" |
| "Which players are stalled?" | Honest: "player-progress gap analysis requires migrations 041-044" |

---

## Architecture Notes

### Why `curriculum_levels` and `curriculum_gates` have no `academy_id`

These tables represent the **global shared curriculum spine** — the standard ITF / AcademyOS level progression framework. All academies use the same underlying 12-level structure. Academy-specific customizations are stored in:
- `academy_curriculum_overrides` (overrides per academy)
- `curriculum_drills` (academy_id nullable — null = global, non-null = academy-specific)
- `curriculum_content_items` (academy_id nullable — same pattern)

This means structural gaps (no gates, no drills) are partially global signals:
- A level with no gates is a global curriculum gap (affects all academies)
- A level with no academy drills is an academy-specific gap (this academy hasn't added content)

### RLS behavior

`curriculum_levels` and `curriculum_gates` are readable by any authenticated staff member (no academy_id filter). `curriculum_drills` is readable when academy_id matches or is null. The loader wraps all queries in `try/catch` — if RLS blocks for any reason, it returns `[]` safely.

---

## Recommended Future Sprint

**Sprint 7XX — DONNA Player-Progress Gap Wiring V1**

Pre-requisites:
1. Apply migrations 041–044 + 060 to live Supabase database
2. Regenerate `database.types.ts`

Then:
- Add `loadPlayerProgressGaps(db, academyId) → string[]` to a new loader
- Wire into `directorDonnaContext.ts` section 7 alongside structural gaps
- DONNA can then say: "3 players in Orange 2 have met all gate evidence but haven't advanced yet"
