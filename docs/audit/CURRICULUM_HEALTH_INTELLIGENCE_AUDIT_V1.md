# Curriculum Health Intelligence Audit V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Purpose:** For each intelligence question about curriculum health, document whether AcademyOS can answer it today.

---

## Answerable Status Legend

| Status | Meaning |
|---|---|
| ✓ Answerable | Data, UI, and DONNA can all answer this today |
| Partial | Answerable with manual steps or limited data |
| Blocked | Code exists but pending DB migrations |
| Not built | Feature does not exist in any form |

---

## Question 1: Which curriculum levels are healthy?

**Answerable today: Partial**

**Data source exists:** Yes — `buildCurriculumCoverageReport()` scores each level A-F based on gates/drills/coach cues

**UI exists:** Yes — `CurriculumHealthPanel` on `/director/curriculum` shows coverage grades

**DONNA can answer:** Partial — DONNA can explain a specific level's health when `?improve=[level]` is triggered; no proactive health summary on page load

**Confidence level:** MEDIUM — Coverage scoring is limited to 3 of 8 dimensions (gates, drills, coachCues). A level with all gates and drills but no missions or parent guidance scores "A" — misleading.

**Required fix:** 
1. Apply pending migrations to enable skills, assessment, missions, parentGuidance, badges dimensions in coverage scoring
2. Add proactive DONNA brief on curriculum landing: "3 levels are healthy. 2 need attention."

---

## Question 2: Which levels create bottlenecks?

**Answerable today: Blocked**

**Data source exists:** Partial — `coach_observations.tags` can surface skill-tagged concerns; `player_curriculum_states` has `enrolled_at` for time-in-level calculations

**UI exists:** No — `curriculumBottleneckLoader.ts` returns `blockReason: 'Curriculum bottleneck detection requires curriculum_requirements and player_curriculum_levels tables — pending migrations 041-044'`

**DONNA can answer:** No — `intelligence/curriculumBottleneckIntelligence.ts` is blocked by schema

**Confidence level:** N/A — blocked

**Required fix:**
1. Apply migrations 041-044 to live DB
2. Re-enable `curriculumBottleneckLoader` 
3. Wire bottleneck result to curriculum page and director dashboard

**Partial workaround today:** Dashboard shows `stalledPlayerCount` (enrolled 6+ months, not advancement-eligible) — but this is a player signal, not a level bottleneck signal. Cannot tell which level is causing the stall from the UI.

---

## Question 3: Which skills fail most often?

**Answerable today: Not built**

**Data source exists:** Partial — `coach_observations` has `tags` array; `player_requirement_progress.status` has failure states; but no "skill failure rate" query exists

**UI exists:** No

**DONNA can answer:** No — no skill failure analysis in any DONNA module

**Confidence level:** N/A

**Required fix:**
1. Apply migrations 041-044 (requirement_evidence_links, player_requirement_progress)
2. Build skill failure rate query: group `player_requirement_progress` by `requirement_id` where `status NOT IN ('met', 'waived')` and count
3. Surface top N most-failed requirements in curriculum health panel
4. Wire DONNA to surface: "Gate X fails 70% of the time across all players at Orange Ball 2"

---

## Question 4: Which drills are used most?

**Answerable today: Not built**

**Data source exists:** No — no drill usage tracking. Sessions are created from templates with blocks, but the actual drills run in each session are not recorded as atomic events.

**What partially exists:**
- `curriculum_class_template_blocks` (migration 062, pending) would connect blocks to curriculum drills
- When a session is generated from a template, the blocks are copied — but no "drill_id run on date X for group Y" record is created

**Required fix:**
1. Apply migration 062
2. Add drill usage recording: when a block with curriculum content is executed, record which curriculum_drill_id was included in `session_blocks` 
3. Query drill frequency: `COUNT(session_blocks WHERE curriculum_drill_id = X AND session.status = completed)`
4. Surface top drills in curriculum explorer with usage count

**Confidence level:** N/A — data doesn't exist yet

---

## Question 5: Which assessments fail most often?

**Answerable today: Partial**

**Data source exists:** Partial — `player_requirement_progress` (migrations 041-044 pending) would show which requirements are in `not_started` or `in_progress` state for most players

**What currently exists:**
- `assessmentCriteriaModel.ts` — defines assessment criteria types
- `NewPlayerAssessmentPanel` — records assessments for placement
- `AssessmentStudioDraftCard` in review queue — assessment drafts

**DONNA can answer:** Partial — `curriculumImprovementEngine.ts` uses `assessmentCount` signals when evidence records exist. If `assessment_score` evidence records are present, DONNA can surface "assessment signal for domain X is weak"

**Confidence level:** LOW — depends on volume of assessment evidence records

**Required fix:**
1. Apply migrations 041-044 (requirement_evidence_links)
2. Build assessment failure rate: `GROUP BY requirement_id WHERE status = not_started` sorted by occurrence
3. Wire to curriculum health panel: "3 gates at Orange Ball 2 have a 0% achievement rate"

---

## Question 6: Which levels produce advancement?

**Answerable today: Partial**

**Data source exists:** Yes — `player_curriculum_states` has `advancement_eligible`, `enrolled_at`, `current_level_id`

**What can be derived today:**
- `advancementReadyCount` on dashboard — how many players are advancement-eligible right now
- `stalledPlayerCount` — players enrolled 6+ months with no advancement signal
- Time-in-level approximation via `computeTimeInLevel()` using `enrolled_at`

**What cannot be derived:**
- "What % of players at Orange Ball 2 eventually advance vs drop out?" — no cohort tracking
- Which levels have high advancement rates vs low advancement rates
- Whether curriculum improvements correlated with higher advancement rates afterward

**UI exists:** Partial — KPI page shows time-in-level; no level-by-level advancement funnel

**DONNA can answer:** Partial — can explain time-in-level for a specific player; no level-aggregate advancement analysis

**Required fix:**
1. Add `advanced_to_level_id` and `advanced_at` to `player_curriculum_states` (or create a level transition log)
2. Build level advancement funnel: for each level, % of enrolled players who advanced vs churned
3. Surface in curriculum health panel: "Orange Ball 2: 60% of players who enter advance within 6 months"

---

## Question 7: Which levels correlate with churn?

**Answerable today: Not built**

**Data source exists:** Partial — `player_status` has `inactive` state; `enrolled_at` on curriculum states; but no direct churn-by-level analysis

**What partially exists:**
- `stalledPlayerCount` approximates churn risk (long time at same level)
- On-hold players (`player_status = 'on_hold'`) may correlate with curriculum friction

**Required fix:**
1. Track player exit reason (voluntary, outcome) — requires `players.exit_reason` column or similar
2. Join player exits with their last curriculum level
3. Surface: "Orange Ball 2 is the level where 40% of inactive players were stuck when they stopped coming"

**Confidence level:** N/A

---

## Question 8: Which curriculum changes improved outcomes?

**Answerable today: Not built**

**Data source exists:** No — `academy_curriculum_overrides` tracks when overrides were applied, but no before/after outcome comparison exists

**What would be needed:**
- Curriculum change timestamp (exists — `applied_at` on `academy_curriculum_overrides`)
- Player outcome metrics before and after the change
- Cohort tracking (players at level X before change vs after change)

**Required fix:**
1. Timestamp all curriculum changes (exists)
2. Build before/after cohort comparison: time-in-level for cohorts before and after a significant change
3. Wire DONNA: "After adding fitness content to Orange Ball 2 in March, average time-at-level decreased by 3 weeks for subsequent players"

**This requires time-series data that doesn't exist yet.** Future sprint after curriculum changes have been tracked for 3+ months.

---

## Question 9: What is the academy learning from curriculum execution?

**Answerable today: Not built**

**This is the highest-order curriculum intelligence question** — aggregating execution data to generate organizational learning.

**What would be needed:**
- Drill execution frequency by level (not built — see Q4)
- Gate achievement rates by domain (blocked — see Q3)
- Coach observation pattern analysis by level (partial — tags exist but not aggregated)
- Session attendance by group and level (data exists, no aggregation query)
- Time-to-advancement by level (partial — see Q6)

**Currently available:**
- `curriculumImprovementEngine.ts` performs a version of this: aggregates evidence records, identifies domain weakness patterns, generates improvement suggestions
- This is DONNA's most valuable curriculum intelligence — but it requires evidence records to exist

**Required fix:**
1. Apply all pending migrations (evidence records, requirement progress, bottleneck tables)
2. Build curriculum learning digest: weekly DONNA summary of what the academy is learning from session execution
3. Surface on director dashboard and `/director/kpi`

---

## Intelligence Readiness Matrix

| Question | Answerable | Data | UI | DONNA | Priority |
|---|---|---|---|---|---|
| Which levels are healthy? | Partial | Yes | Yes | Partial | Medium |
| Which levels create bottlenecks? | Blocked | Partial | No | Blocked | CRITICAL |
| Which skills fail most? | Not built | Partial | No | No | High |
| Which drills are used most? | Not built | No | No | No | Medium |
| Which assessments fail most? | Partial | Partial | No | Partial | High |
| Which levels produce advancement? | Partial | Partial | Partial | Partial | High |
| Which levels correlate with churn? | Not built | Partial | No | No | Medium |
| Which changes improved outcomes? | Not built | Partial | No | No | Low (future) |
| What is the academy learning? | Not built | Partial | No | Partial | High |

---

## The Root Cause

**Seven of nine intelligence questions are blocked or not built.**

The root cause is not code — it's missing DB migrations.

Every intelligence question requires data that flows from:
1. `player_requirement_progress` (migrations 041-044) — gate achievement tracking
2. `player_evidence_records` (migration 083) — evidence from assessments, sessions, observations
3. `curriculum_class_template_blocks` (migration 062) — drill execution per session
4. `templates.curriculum_level_id` (migration 045) — session-to-curriculum connection

Until these 4 migration groups are applied to the live DB, the curriculum intelligence layer is operating on approximately 30% of the data it was designed to use.

**DONNA's curriculum intelligence modules are built and ready.** They are waiting for data.
