# Curriculum Intelligence Activation Smoke Test V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Purpose:** Verify whether each curriculum intelligence module can read/write expected data after activation.

---

## Test Method

- REST API probes against the live Supabase DB
- TypeScript compilation check (`npx tsc --noEmit`)
- Code-level analysis of module inputs/outputs

---

## Module 1: Curriculum Bottleneck Detector

**File:** `src/lib/donna/curriculumBottleneckLoader.ts`
**Data dependency:** `player_requirement_progress` + `coach_observations.tags` + `curriculum_levels`

**Before:** Returned `curriculumTablesAvailable: false`, `fieldStatus: 'blocked_by_schema'`

**After activation:**
- Reads `player_requirement_progress` grouped by `curriculum_level_id`
- Reads tagged coach concern observations (last 30 days)
- Computes per-level bottleneck signals: avgCompletionPct, stalledCount, lowestDomain
- Returns `curriculumTablesAvailable: true`

**Now active: ✓**
- Live DB confirmed: `player_requirement_progress` has 10 rows across Orange Ball levels
- TypeScript: clean after activation

**Data confidence:** `partial` (10 rows is enough to compute initial signals; confidence grows as more evidence is collected)

**Remaining gap:** No callers of `loadCurriculumBottleneck()` in the director UI yet — function is ready but not wired to a page

---

## Module 2: Curriculum Coverage Model

**File:** `src/lib/curriculum/coverageModel.ts`
**Data dependency:** counts from `getCurriculumExplorerData()` (gates, drills, coachCues)

**Status: PARTIAL (unchanged — coverage scoring still excludes 5 of 8 dimensions)**

The coverage model is operational and has always been. The issue is that `skillCount`, `assessmentCriteriaCount`, `missionCount`, `parentGuidanceCount`, and `badgeCount` are passed as 0 on the curriculum page because those counts are not queried from the DB.

Now that `player_requirement_progress` exists, skill requirement counts could be derived from `curriculum_track_requirements`. But this would require modifying `getCurriculumExplorer` (a locked backend file) or the curriculum page.

**Status:** Coverage model runs but scores reflect 3/8 dimensions only. Correct behavior — `excludeFromScoring` is set appropriately on the page.

---

## Module 3: Curriculum Health Signals

**File:** `src/lib/curriculum/levelHealthReport.ts`
**Data dependency:** `LevelCoverageScore` + player counts + gate met % + stalled player counts

**Status: ACTIVE (unchanged)**

The level health report builds from coverage scores (which exist) and player signal counts (which are derived from `player_curriculum_states.advancement_eligible` and `enrolled_at`). No change needed — this was already working.

---

## Module 4: Gate Achievement Tracking

**Files:** `src/lib/player/evidenceQueries.ts`, `src/lib/curriculum/requirementProgressAggregator.ts`
**Data dependency:** `player_requirement_progress` (migration 041)

**Now active: ✓**
- `player_requirement_progress` has 10 rows
- `evidenceQueries.ts` queries this table — can now return real data
- `requirementProgressAggregator.ts` aggregates by level — can now compute `completionPct`

**Data confidence:** `partial` — 10 bootstrap rows exist with `status='not_started'`. As coaches confirm evidence and directors approve assessments, these rows update.

---

## Module 5: Template-Curriculum Connection

**File:** `src/lib/curriculum/templateConnectionModel.ts`, `CoachSessionCurriculumPanel.tsx`
**Data dependency:** `templates.curriculum_level_id` (migration 045) + `curriculum_class_template_blocks` (migration 062)

**Now active: ✓ (DB-side)**
- `templates.curriculum_level_id`: column exists
- `curriculum_class_template_blocks`: table exists

**Still inactive: (application-side)**
- No templates have `curriculum_level_id` set (all null in demo data)
- No rows in `curriculum_class_template_blocks` — no content linked yet
- Director must manually assign curriculum level to each template
- Content must be linked to blocks via the block content picker

**Status:** Infrastructure active; director seeding required before it becomes useful.

---

## Module 6: Drill Usage Analytics

**Data dependency:** `curriculum_class_template_blocks.drill_id` — links executed blocks to drills

**Status: INFRASTRUCTURE ACTIVE, DATA ABSENT**
- `curriculum_class_template_blocks` table exists
- But 0 rows — no drill-to-template mappings created yet
- Once directors link curriculum content to template blocks, drill usage will be queryable

---

## Module 7: Player Evidence Records

**File:** `src/lib/evidence/playerEvidenceTypes.ts`, `src/lib/evidence/playerEvidenceAggregator.ts`
**Data dependency:** `player_evidence_records` (migration 083)

**Now active: ✓ (DB-side)**
- `player_evidence_records` table exists
- 0 rows — no evidence written yet
- `playerEvidenceAggregator.ts` can query this table
- TypeScript types now include the full `player_evidence_records` row type

**Status:** Infrastructure active; evidence will accumulate as assessments, observations, and sessions are processed.

---

## Module 8: DONNA Curriculum Improvement Drafts

**Files:** `src/lib/donna/curriculumImprovementEngine.ts`, `DonnaCurriculumContextPanel.tsx`
**Data dependency:** `player_evidence_records` + `player_requirement_progress`

**Status: ACTIVE BUT DATA-SPARSE**
- The improvement engine runs correctly
- Currently returns LOW confidence suggestions due to empty `player_evidence_records`
- As evidence accumulates, confidence will increase

**What works today:**
- Director navigates to `/director/curriculum?improve=orange_ball_2`
- `DonnaCurriculumContextPanel` loads
- DONNA shows improvement context with evidence count (0) and suggestions (LOW confidence based on structural gaps only)

---

## TypeScript Compilation

```
npx tsc --noEmit
```
**Result: CLEAN (0 errors)**

All modules compile correctly after:
- `database.types.ts` regeneration (added `player_evidence_records`)
- `curriculumBottleneckLoader.ts` activation (changed from blocked stub to live query)
- `donnaSourceLabels.ts` status update

---

## Summary

| Module | Status | Data Available | Notes |
|---|---|---|---|
| Curriculum bottleneck detector | ✓ Active | partial (10 rows) | Computes level signals; no UI caller yet |
| Curriculum coverage model | Partial | Yes (3/8 dims) | 5 dims excluded pending content linkage |
| Curriculum health signals | ✓ Active | Yes | Working before this sprint |
| Gate achievement tracking | ✓ Active | partial (bootstrap) | Updates as evidence is recorded |
| Template-curriculum connection | ✓ Infrastructure | None (0 links) | Director must link templates to levels |
| Drill usage analytics | ✓ Infrastructure | None (0 rows) | Content must be linked to blocks |
| Player evidence records | ✓ Infrastructure | None (0 rows) | Evidence accumulates from operations |
| DONNA curriculum improvement | ✓ Active (low conf) | Sparse | Confidence grows with evidence volume |

---

## Key Finding

**All curriculum intelligence modules are now structurally active.** The limiter is no longer schema — it is data. As the academy operates (sessions run, coaches wrap up, assessments are recorded, evidence is linked), these modules will produce increasingly confident signals.

The next step is not more infrastructure — it is:
1. Linking templates to curriculum levels (director action)
2. Linking curriculum content to template blocks (director action)
3. Recording assessments and observations to generate evidence records (operational)
4. Wiring `loadCurriculumBottleneck()` to a director-visible surface
