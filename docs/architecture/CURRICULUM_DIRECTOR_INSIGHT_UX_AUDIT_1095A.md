# Curriculum Director Insight UX Audit — Sprint 1095A

**Date:** 2026-06-01
**Sprint:** 1095A — Audit only. No code changes. No migrations.

---

## 1. Current Curriculum Page Structure

Route: `/director/curriculum` → `src/app/director/curriculum/page.tsx`

The page renders, in order:
1. **Header**: title + subtitle
2. **CurriculumBuilderWelcome**: DONNA contextual banner
3. **Curriculum Status hero card**: status label, active spine description, primary CTA, next action text
4. **Current Spine section**: 5 hardcoded stage cards — Red Ball / Orange Ball / Green Ball / Yellow Ball / High Performance — each with a one-line purpose
5. **Empty state**: shown when `academy_curriculum_versions` has no row
6. **Setup Status checklist**: 5 items (curriculum selected, spine approved, customizations, templates connected, players connected)
7. **Coverage snapshot** (`CurriculumHealthPanel`): per-level gate/drill/cue counts
8. **Level tree** (`CurriculumLevelTree`): collapsible 5-stage tree, each expanding to levels showing `Xg · Xd · Xcl` counts and a link to the level builder

**Critical finding**: The `SPINE_STAGES` constant in `page.tsx` is **hardcoded** — it does not query `curriculum_stages.stage_goal` even though that field exists with rich goal text in the live database.

### Sub-routes
| Route | Component | Purpose |
|---|---|---|
| `/director/curriculum` | Overview + level tree | Main entry |
| `/director/curriculum/level/[levelId]` | `CurriculumLevelBuilderExperience` | Level editing (not read-only insight) |
| `/director/curriculum/builder` | Builder shell | Curriculum customization |
| `/director/curriculum/academy-version` | Override diff | Academy-specific overrides |
| `/director/curriculum/map` | Visual map | Graphical curriculum map |
| `/director/curriculum/learning` | Learning modules | Director preview of player-facing modules |
| `/director/curriculum/guided` | Guided review | Walk-through review experience |

---

## 2. Current Curriculum Data Model

### Core tables (live, confirmed from DB)

| Table | Rows | Status | Key fields |
|---|---|---|---|
| `curriculum_stages` | 5 | ✅ REAL data | `stage_goal`, `age_range_min/max`, `utr_range_min/max` |
| `curriculum_levels` | **15** | ✅ REAL data | `display_name`, `stage`, `level_number`, `advance_min_domains_complete`, `advance_min_outcomes` |
| `curriculum_gates` | **57** | ✅ REAL data | `domain`, `criterion`, `threshold`, `recording_method`, `evidence_window` |
| `curriculum_coach_language` | 5+ | ✅ (partial) | `doing_well`, `working_on`, `current_focus`, `next_step` per domain per level |
| `skill_progressions` | 1 (sparse) | ⚠️ SPARSE | `success_criteria`, `failure_patterns`, `signal_indicators` |
| `parent_level_descriptions` | 3 | ❌ PLACEHOLDER | `what_we_focus_on`, `what_success_looks_like` — all contain "Program development in progress" |
| `progression_rules` | 5 | ⚠️ PARTIAL | `min_total_outcomes`, `min_domains_mastered`, `min_weeks_at_level` |
| `academy_curriculum_versions` | 0 | ❌ EMPTY | No academy has activated a curriculum spine |

### `curriculum_stages.stage_goal` — EXISTS AND IS RICH

All 5 stages have real goal text in the database:

| Stage | Goal (live DB) |
|---|---|
| Red Foundation | "Build the athletic and technical foundation for all future tennis development. Players learn how to move, cooperate, and make first contact with the ball as a repeatable skill." |
| Orange Development | "Develop consistent stroke mechanics, basic tactical awareness, and the emotional regulation to compete in low-stakes environments." |
| Green Performance | "Refine all strokes under pressure, introduce point construction, and develop the physical capacity to train and compete at higher volume." |
| Yellow Competitive | "Compete at regional and national level. Develop tactical identity, serve as a weapon, and build the mental game to perform under pressure." |
| High Performance | "Elite training environment. Specialised physical preparation, tactical complexity, professional match preparation, and academy-to-pro transition." |

**This data is not displayed anywhere in the current UI.**

---

## 3. Whether Red/Orange/Green/Yellow/HP exist as stages

✅ Yes. All 5 stages are in the DB as the `curriculum_stage` enum:
`red_foundation | orange_development | green_performance | yellow_competitive | high_performance`

---

## 4. Whether Red 1, Red 2, Red 3 style sub-levels exist

✅ Yes. **15 levels exist** with the pattern `{stage}.{level_number}`:

| Stage | Levels in DB |
|---|---|
| red_foundation | Red 1 — Foundation · Red 2 — Intermediate · Red 3 — Matchplay |
| orange_development | Orange 1 — Foundation · Orange 2 — Intermediate · Orange 3 — Matchplay |
| green_performance | Green 1 — Foundation · Green 2 — Intermediate · Green 3 — Matchplay |
| yellow_competitive | Yellow 1 — Foundation · Yellow 2 — Intermediate · Yellow 3 — Matchplay |
| high_performance | High Performance 1 — Foundation · HP 2 — Intermediate · HP 3 — Matchplay |

The sub-level naming pattern is: 1 = Foundation, 2 = Intermediate, 3 = Matchplay.

---

## 5. Whether level goals exist in data

**Partially.** Stage-level goals exist (`curriculum_stages.stage_goal`).

**Individual level goals do NOT exist** in `curriculum_levels`. The table has no `level_description`, `level_goal`, or `purpose` text column — only numeric advancement thresholds.

However, `curriculumLevelDonnaAnswer.ts` contains a static `LEVEL_DESCRIPTIONS` dict with rich text descriptions for all 12 standard levels (Red 1-3, Orange 1-3, Yellow 1-3, HP 1-3). These are DONNA's internal knowledge, not surfaced in the director UI.

---

## 6. Whether exit player profiles exist in data

**No.** No field in any table describes "what the player should look like when exiting this level."

`parent_level_descriptions.what_success_looks_like` exists as a schema field but contains only placeholder text: "Player progressing through structured curriculum" — not real exit profile content.

`curriculum_gates.criterion` implicitly defines exit conditions per domain, but they are not aggregated into a readable "exit player profile" view.

DONNA's `LEVEL_DESCRIPTIONS` static text mentions exit conditions informally (e.g., "Assessment at Red 3 level determines readiness for orange ball play").

---

## 7. Whether exit standards / readiness gates exist

✅ **57 gates exist** in `curriculum_gates`, 4 per level (with 1 exception: HP 3 has 1 gate).

Each gate has:
- `domain` (Movement, Technical, Mentality, etc.)
- `criterion` (e.g., "Demonstrates basic catching and throwing competency")
- `threshold` (e.g., "7/10 rallies")
- `recording_method`, `evidence_window`, `evaluator`, `cadence`

⚠️ `progression_rules` has only 5 rows (not 15) — not fully seeded per level.

`curriculum_levels.advance_min_domains_complete` and `advance_min_outcomes` provide numeric thresholds for advancement, but are not human-readable.

---

## 8. Whether skills/drills/templates are connected to levels

| Connection | Status |
|---|---|
| Drills → levels | Exists (`curriculum_drills.level_min_id`, `level_max_id`). Sparse seeding. |
| Coach language → levels | Exists (`curriculum_coach_language.level_id`). Partially seeded. |
| Skill progressions → levels | Schema exists. **Extremely sparse** (1 row in live DB). |
| Templates → levels | `templates.curriculum_level_id` column exists but **migration 045 is pending** on live DB — not functional. |
| Class templates → curriculum | `curriculum_class_template_blocks` table via migration 062 — **not applied to live DB**. |

---

## 9. Whether DONNA can currently explain curriculum goals

**Partially.**

`curriculumLevelDonnaAnswer.ts` (`isCurriculumLevelQuestion` + `buildLevelExplanationAnswer`):
- ✅ DONNA can answer "Explain Red 2" or "What is Orange 1?" with detailed static text
- ✅ DONNA knows the 4-stage, 12-level structure
- ✅ DONNA can explain what gates, skills, drills, assessments, missions, badges are
- ❌ DONNA does NOT use live `curriculum_stages.stage_goal` — uses static strings
- ❌ DONNA does NOT surface live gate criterion text for a specific level
- ❌ No dedicated "DONNA, what should a Red 1 exit player look like?" answer that aggregates live gate data

DONNA's curriculum answering is static-knowledge-based. It does not read from the `curriculum_stages` or `curriculum_levels` tables in real-time.

---

## 10. Real vs placeholder/demo data

| Data | Status |
|---|---|
| `curriculum_stages.stage_goal` | ✅ REAL — rich goal text for all 5 stages |
| `curriculum_levels` | ✅ REAL — 15 levels with thresholds |
| `curriculum_gates` | ✅ REAL — 57 gates across all 15 levels |
| `curriculum_coach_language` | ⚠️ PARTIAL — Red 1 confirmed, other levels unknown |
| `curriculum_drills` | ⚠️ PARTIAL — Red 1 confirmed, sparse |
| `skill_progressions` | ❌ SPARSE — 1 row only |
| `parent_level_descriptions` | ❌ PLACEHOLDER — "Program development in progress" for all |
| `progression_rules` | ⚠️ PARTIAL — 5 rows only |
| `academy_curriculum_versions` | ❌ EMPTY — no academy has activated a version |

---

## 11. Current permission model

### Three-layer permission structure

```
Platform Owner (AcademyOS)
  ├── Owns global curriculum spine
  ├── Seeded into curriculum_stages, curriculum_levels, curriculum_gates, etc.
  └── No academy can edit global spine data

Academy (Director)
  ├── Can clone global spine → academy_curriculum_versions
  ├── Can propose overrides → academy_curriculum_overrides
  ├── Overrides go through review queue before applying
  └── CurriculumEditPermissionGuard enforces this at component level

Director UI
  ├── Can VIEW all levels, gates, drills (global)
  ├── Can PROPOSE changes via the builder (pending review)
  └── Can ACTIVATE/APPLY changes after director review
```

### Visibility boundaries
- `parent_level_descriptions` → parent-facing copy, should NOT be shown as director insight
- `is_parent_visible` and `is_player_visible` flags on gate records
- Coach language is director/coach-facing only
- `curriculum_gates` are director-visible; player-facing depends on `is_player_visible_default` in `curriculum_track_requirements`

### Risk: no active version
Currently `academy_curriculum_versions` is empty. The UI correctly shows "No curriculum spine active" for the QA test director. This means the "Curriculum Status" page handles this case but the level tree still shows the global spine levels, which could be confusing — the director sees levels but cannot yet connect players to them.

---

## 12. Current UX problems and cognitive load issues

### Problem 1: Hardcoded stage descriptions instead of DB data
The "Current Spine" section shows 5 hardcoded stage cards with shorter purpose text. The `curriculum_stages.stage_goal` field has richer, more accurate descriptions that are NOT displayed.

### Problem 2: Level tree shows counts, not meaning
`CurriculumLevelTree` shows: `Red 1 — Foundation | 4g · 12d · 3cl`
A director cannot answer: "What is Red 1 trying to achieve?" from this view.

### Problem 3: No high-level → sub-level → detail flow
The page lists all 15 levels equally. A director who wants to understand "Red Ball" cannot:
- Get a stage-level summary with goal
- Then break it down into Red 1 / Red 2 / Red 3 with per-level goals
- Then drill into gates/drills for a specific sub-level

### Problem 4: Level detail page goes directly to builder
`/director/curriculum/level/[levelId]` renders `CurriculumLevelBuilderExperience` — a complex editing interface. There is no "read-only insight" view for a director who just wants to understand a level.

### Problem 5: DONNA knows more than the UI shows
DONNA can describe any level in rich natural language, including gates, exit conditions, and what coaches focus on. This knowledge is siloed inside DONNA's static dict and not surfaced in the curriculum page or level tree.

### Problem 6: Stage cards are uniform — no visual weight
All 5 stage cards look identical. A director building for a specific cohort (e.g., all Red Ball players) cannot quickly identify which stage is most relevant.

### Problem 7: Exit player profile — nowhere
No view in the app shows "What does a player look like when they're ready to leave Red 1?" The gate criteria text exists in the DB but is not presented as a readable exit profile.

### Problem 8: "What must the player have before exiting?" not answerable without drilling
A director must navigate to the builder, select a level, and manually scan gate rows. There is no summary view of readiness requirements in plain English.

---

## 13. What data is missing for a 10/10 director insight view

| Missing item | Schema gap | Data gap |
|---|---|---|
| `curriculum_levels.level_description` (text) | ❌ Column missing | N/A |
| `curriculum_levels.exit_player_profile` (text) | ❌ Column missing | N/A |
| `skill_progressions` — all 15 levels seeded | None | ❌ Only 1 row |
| `parent_level_descriptions` — real content | None | ❌ Placeholder |
| `progression_rules` — all 15 levels seeded | None | ⚠️ 5 rows |
| Templates connected to levels | Migration 045 pending | N/A |
| `curriculum_class_template_blocks` (Migration 062 pending) | N/A | N/A |

---

## 14. What can be solved with UI/fallback mapping now (no schema changes)

### Available without schema changes:
1. **Replace hardcoded stage descriptions** with live `curriculum_stages.stage_goal` — a single query change in `page.tsx`
2. **Add stage-level insight header** to `CurriculumLevelTree` — pull `stage_goal` per stage group
3. **Create `CURRICULUM_LEVEL_INSIGHT_MAP`** — a typed TypeScript constant (like `LEVEL_DESCRIPTIONS` in `curriculumLevelDonnaAnswer.ts`) providing per-level: goal, exit profile text, key focus areas, readiness signal — no DB, no migrations
4. **Add "Level Profile" read-only panel** — shown before the builder; renders: level goal (from map), gates in plain English (from DB `curriculum_gates`), readiness thresholds (from DB `curriculum_levels.advance_min_*`)
5. **Add collapse-to-stage pattern** — default view shows 5 stage summaries; click stage to expand sub-levels; click sub-level to see detail
6. **Wire DONNA curriculum explanations** into the level detail view — when viewing Red 1, show DONNA's existing static description

### The `CURRICULUM_LEVEL_INSIGHT_MAP` approach

A typed constant keyed by level `stage+number` providing:
```typescript
interface LevelInsight {
  goal: string                    // what this level is building toward
  exitPlayerProfile: string       // what the player looks like when ready to leave
  keyFocusAreas: string[]         // 3-4 coaching priorities at this level
  readinessSignals: string[]      // human-readable version of gate thresholds
  prevLevel: string | null        // e.g. "Red 1"
  nextLevel: string | null        // e.g. "Red 3"
  stageContext: string            // where this fits in the stage arc
}
```

This can be created purely in TypeScript (like `LEVEL_DESCRIPTIONS` already exists in `curriculumLevelDonnaAnswer.ts`), then later replaced with database content when `curriculum_levels.level_description` is added and seeded.

---

## 15. What requires future schema/data work

| Item | Why needed | Estimated effort |
|---|---|---|
| `curriculum_levels.level_description` TEXT column | Store level goals per-level in DB | 1 migration |
| `curriculum_levels.exit_player_profile` TEXT column | Store exit profile per-level | 1 migration (can combine with above) |
| Seed `skill_progressions` for all 15 levels | Enable skill-by-skill readiness views | Data seeding only |
| Fix `parent_level_descriptions` — real content | Parent portal and director "parent view" | Content + data seeding |
| Apply migration 045 (`templates.curriculum_level_id`) | Template-curriculum connections | Apply pending migration |
| Apply migration 062 (`curriculum_class_template_blocks`) | Class template curriculum content | Apply pending migration |

---

## 16. Recommended Sprint 1095B implementation plan

### Goal: Director-first Curriculum Insight View

**File scope** (no locked files touched):
- `src/app/director/curriculum/page.tsx` — use live `curriculum_stages.stage_goal`; add stage-centric layout
- New: `src/lib/curriculum/levelInsightMap.ts` — typed static `CURRICULUM_LEVEL_INSIGHT_MAP` (15 entries)
- `src/app/director/curriculum/_components/CurriculumLevelTree.tsx` — show insight on level rows
- Optional: New `src/app/director/curriculum/_components/StageSummaryCard.tsx` — replaces hardcoded stage cards

### Sprint 1095B layout concept

```
Director opens Curriculum
  ↓
Stage summary bar (5 clickable stage cards, each showing stage_goal from DB)
  ↓
Click "Red Ball" →
  Expands to Red Ball overview: goal, age range, UTR range (all from DB)
  Then 3 sub-level rows: Red 1, Red 2, Red 3
  Each row: level name + sub-level context (Foundation/Intermediate/Matchplay)
              + 1-line goal from insight map
              + gate count from DB
  ↓
Click "Red 2 — Intermediate" →
  Level detail panel:
  - Goal: (from insight map)
  - Exit player profile: (from insight map)
  - Advancement thresholds: (from DB advance_min_*)
  - Gates in plain English: (from DB curriculum_gates)
  - DONNA explanation: (from existing LEVEL_DESCRIPTIONS)
  - Link: Open in Builder (existing CTA)
```

### Key constraints for Sprint 1095B
- Do NOT change permission model
- Do NOT add direct writes from this new view
- Do NOT show `parent_level_descriptions` as director insight (it's parent-facing copy)
- Do NOT call new API endpoints — read from `getCurriculumExplorerData` which already fetches levels, gates, drills, coachLanguage
- The `CURRICULUM_LEVEL_INSIGHT_MAP` should be pure TypeScript, no DB, no AI
- Query `curriculum_stages` table for `stage_goal`, `age_range`, `utr_range` — this is a simple new query

### Migration needed: None for 1095B

---

## 17. What should NOT be built yet

| Feature | Why not yet |
|---|---|
| `curriculum_levels.level_description` schema migration | Not needed for 1095B — static map covers it |
| Edit mode for level goals in the director view | Requires schema + permissions review |
| Exit player profile editor | Requires schema |
| Template-level connection UI | Migration 045 still pending on live DB |
| Parent-facing level descriptions | Placeholder data, not safe to show |
| Skill progression seeding UI | Backend-only, separate sprint |
| Player-facing curriculum detail | Player portal not ready for this depth |
| Real-time DONNA enrichment from curriculum DB | Requires DONNA live DB query wiring sprint |

---

## Specific audit questions answered

| Question | Answer |
|---|---|
| Where would "Red Ball goal" come from today? | `curriculum_stages.stage_goal` (exists, rich, NOT displayed in UI) |
| Where would "Red Ball exit player profile" come from today? | DONNA's static `LEVEL_DESCRIPTIONS` for Red 3 (hardcoded, not in DB) |
| Where would "Red 1 exit skills" come from today? | `curriculum_gates` (domain + criterion per level) — exists but not in a readable view |
| Where would "Red 2 readiness gates" come from today? | `curriculum_gates WHERE from_level_id = Red2_id` — 4 gates exist per level |
| Where would "Red 3 before moving to Orange" come from today? | `stageProgressionModel.STAGE_GATES` (static) + `curriculum_gates` for Red 3 |
| Does the system support high-level → breakdown → details? | Not currently. `CurriculumLevelTree` shows all 15 levels flat. |
| Can this be built without schema changes using a typed insight mapping? | ✅ Yes. See `CURRICULUM_LEVEL_INSIGHT_MAP` approach. |
| Is there any risk of confusing global and academy curriculum? | Moderate risk. No academy has an active version. Global levels display but are labelled as "starter spine." Sprint 1095B must preserve this labelling. |
