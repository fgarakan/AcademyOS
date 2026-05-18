# Curriculum-Aware Template System Regression
Sprint 969 — 2026-05-18

## Purpose

Verify that curriculum data is consistently read (never mutated) across all template pages, that template data never overwrites curriculum constants, and that all cross-cutting behaviors introduced in Sprints 931–965 remain intact.

---

## 1. Curriculum Source of Truth Integrity

| Rule | Verification | Status |
|------|-------------|--------|
| Curriculum constants are read-only | `CURRICULUM_LEVEL_PREVIEWS`, `FITNESS_CURRICULUM_PREVIEW_BY_STAGE`, `CURRICULUM_DRILLS_BY_STAGE`, `CURRICULUM_WATCH_FORS_BY_STAGE`, `SUPPORTED_GATES_BY_STAGE`, `PLAYER_MISSIONS_BY_STAGE`, `GOALS_BY_STAGE` are all `const` objects — never assigned to or mutated in any template page. | PASS |
| Templates never write to curriculum | No template create or edit page calls a mutation that touches any curriculum table or curriculum constant. All saves go to `proposed_actions` pattern (local demo state in this sprint block). | PASS |
| DONNA never mutates curriculum | DONNA difficulty and duration flags are local React state only. No side effects beyond UI. | PASS |
| `finalize_player_placement()` not called | No template page references or calls `finalize_player_placement`. Confirmed by grep. | PASS |

---

## 2. Template-to-Curriculum Mapping Consistency

| Mapping | File | Verified |
|---------|------|---------|
| `getCurriculumStage(level)` → `BallStage` | `templateCurriculumPreview.ts` | Used in fitness create (Step 1 stage derivation) and coach-preview (curriculum context card). |
| `toBlockStageKey(stage)` → `BlockStageKey` | `templateCurriculumPreview.ts` | Used in `getCurriculumDrillsForBlock()` and `getWatchForsForBlock()`. |
| `SESSION_DURATION_BY_STAGE` | `templateCurriculumPreview.ts` | Duration defaults in template create flows match curriculum stage norms. |
| `getFitnessCurriculumPreview(stage)` | `templateCurriculumPreview.ts` | Returns `FitnessCurriculumPreview` for all 5 stages. Used in coach-preview and fitness create Step 5. |
| `LEVEL_TO_CURRICULUM_STAGE` (inline maps) | `fitness/page.tsx`, `fitness/[templateId]/page.tsx` | Beginner→"Red Ball / Orange Ball", Intermediate→"Green Ball", Advanced→"Yellow Ball", Elite→"High Performance". Consistent across both files. |
| `SUGGESTED_LABEL_TO_TYPE` | `fitness/create/page.tsx` | Maps human-readable `suggestedBlockTypes` strings from curriculum preview to `FitnessBlockType` enum values. |

---

## 3. Cross-Page Curriculum Data Rendering

| Page | Curriculum Data Shown | Source |
|------|-----------------------|--------|
| `/director/templates/fitness/create` — Step 1 | `CurriculumLevelPreview.title`, `stage`, curriculum context per level | `CURRICULUM_LEVEL_PREVIEWS` |
| `/director/templates/fitness/create` — Step 4 | `suggestedBlockTypes` as filterable chips | `FITNESS_CURRICULUM_PREVIEW_BY_STAGE[stage].suggestedBlockTypes` |
| `/director/templates/fitness/create` — Step 5 | `physicalDevelopmentNeed`, `tennisTechnicalTransfer`, `recommendedFitnessFocus`, `loadGuidance`, `ageFitNote` | `getFitnessCurriculumPreview(stage)` |
| `/director/templates/coach-preview` (fitness) | Same 5-field fitness curriculum card | `getFitnessCurriculumPreview(stage)` |
| `/director/templates/coach-preview` (class) | `getCurriculumLevelPreview(stage)`, watch-fors, drills | `templateCurriculumPreview.ts` exports |
| `/director/templates/fitness/page.tsx` | Curriculum Stage chip per template card | `LEVEL_TO_CURRICULUM_STAGE` |
| `/director/templates/fitness/[templateId]` | Curriculum Connection card | `LEVEL_TO_CURRICULUM_STAGE` |
| `/director/templates/class/[templateId]` | Curriculum Connection card | `template.curriculumConnection` (mock data) |
| `/director/templates/donna-suggestions` | Coverage Map | Derived from `DEMO_CLASS_TEMPLATES` + `DEMO_FITNESS_TEMPLATES` level sets |

All: **PASS** — curriculum data displayed but never mutated.

---

## 4. DONNA Panel Cross-Mode Regression

| Mode | Prompt | Gaps Section | Difficulty | Duration | Guardrail | Quick Actions |
|------|--------|--------------|------------|----------|-----------|---------------|
| `home` | Static | — | — | — | — | 4 actions |
| `class_library` | Static | Class Gaps (2 items) | — | — | — | 4 actions |
| `fitness_library` | Static | Fitness Gaps (2 items, purple) | — | — | — | 4 actions |
| `class_create` | Static | Class Gaps (2 items) | — | — | — | 3 actions |
| `fitness_create` | Static | Fitness Gaps (2 items, purple) | — | — | — | 3 actions |
| `class_detail` | Contextual (templateName) | — | Easier/Harder buttons | ±15min, capped ±30 | ShieldCheck banner | 4 actions (context hrefs) |
| `fitness_detail` | Contextual (templateName) | — | Easier/Harder buttons | ±15min, capped ±30 | ShieldCheck banner | 3 actions (context hrefs) |
| `coach_preview` | Contextual if templateName | — | — | — | — | 3 actions |
| `impact` | Contextual if templateName | — | — | — | — | 3 actions |
| `suggestions` | Static | — | — | — | — | 4 actions |

All modes: **PASS**

---

## 5. Type Safety Regression

| Check | Command | Expected |
|-------|---------|----------|
| Full TypeScript check | `npx tsc --noEmit` | 0 errors |
| `DonnaContext` used correctly | Context object passed from Server Components to Client Component | Only serializable values (string, number, undefined) |
| `BallStage` values used correctly | Only valid union values in `getFitnessCurriculumPreview()` calls | No raw strings outside the union |
| `FitnessBlockType` used correctly | Only valid values in `getExercisesForBlock()` calls | Typed through `FITNESS_BLOCK_TYPES` array |

All: **PASS**

---

## 6. No Unauthorized Side Effects Regression

| Rule | Checked In | Status |
|------|-----------|--------|
| No `supabase.from(...).insert(...)` in any template page | `src/app/director/templates/**` | PASS — no DB writes |
| No `supabase.from(...).update(...)` in any template page | `src/app/director/templates/**` | PASS |
| No `proposed_actions` mutation | All template pages | PASS — demo only |
| No external sends (email, push, SMS) | All template pages | PASS |
| No automatic level movement | All template pages | PASS |
| No `.env.local` referenced in template code | Template pages | PASS |

---

## 7. URL Param Chain Integrity

Verify that context flows from detail → coach-preview / impact-preview correctly.

| Origin | Destination | Params Passed | Received Correctly |
|--------|-------------|---------------|-------------------|
| `class/[templateId]` "Preview" button | `coach-preview?level=...&type=class` | `level`, `type` | PASS |
| `class/[templateId]` "Impact Preview" button | `impact-preview?name=...&level=...&type=class` | `name`, `level`, `type` | PASS |
| `fitness/[templateId]` "Preview" button | `coach-preview?level=...&goal=...&type=fitness` | `level`, `goal`, `type` | PASS |
| `fitness/[templateId]` "Impact Preview" button | `impact-preview?name=...&level=...&type=fitness` | `name`, `level`, `type` | PASS |
| DONNA `class_detail` "Preview as coach" action | `coach-preview?level=...&type=class` | Dynamically built from `context` | PASS |
| DONNA `fitness_detail` "See projected impact" action | `impact-preview?name=...&level=...&type=fitness` | Dynamically built from `context` | PASS |

---

## Summary

All regression checks pass. The curriculum-aware template system from Sprints 931–965 maintains:
- Read-only curriculum access across all template pages
- Consistent DONNA panel behavior per mode
- No unauthorized DB writes or external sends
- Full TypeScript cleanliness
- URL param context chain from detail → preview → impact pages
