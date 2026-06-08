# DONNA Curriculum Builder Completion — Architecture
**Sprint:** Mega Sprint 1205–1234
**Date:** 2026-06-08

---

## What was built

DONNA can now create curriculum item drafts end-to-end using the existing
workflow execution architecture. Director confirms a DONNA-collected draft →
`createCurriculumContentItemDraft` → `academy_curriculum_overrides`
(status: `pending_review`) → director reviews and approves via the existing
curriculum review queue.

---

## Supported object types

| DONNA label | DB `content_type` | DB `domain` | Notes |
|---|---|---|---|
| Skill | `skill` | `Technical` | |
| Subskill | `skill` | `Technical` | V1 limitation — see §Subskill hierarchy below |
| Drill | `drill` | (from description) | |
| Tactical Concept | `tactical` | `Tactical` | Distinct type — not collapsed into drill |
| Mental Concept | `mental_skill` | `Mentality` | Distinct type — not collapsed into tactical |
| Progression | `progression` | (from parent) | Distinct type — not collapsed into drill |

---

## Subskill hierarchy — V1 limitation

`src/lib/curriculum/skillHierarchyModel.ts` (Sprint 511) defines a typed
`Skill → SubSkill[]` hierarchy with `SubSkill.skillId` as the parent reference.

**No DB tables back this model.** No `skills` or `sub_skills` tables exist
in any applied migration. No `parent_skill_id` column in `curriculum_content_items`.

**V1 decision:** Subskill → `content_type: 'skill'`. The `description` field
captures the parent skill relationship in free text (collected by DONNA).

**Future work:** When `skills` and `sub_skills` tables are created, wire
`SubSkill.skillId` to a real DB FK and update the DONNA workflow to collect
`parent_skill_id`.

---

## Content type taxonomy source

Migration 061 (`061_curriculum_content_taxonomy.sql`) expanded `content_type`
from 9 to 22 values. Migration 065 seeds `mental_skill` rows, confirming 061
is applied.

`VALID_CONTENT_TYPES` in `src/lib/actions/curriculumDraftActions.ts` updated
in this sprint to reflect the full 22-value list.

---

## Object type mapping function

`mapObjectTypeToContentType(raw: string): CurriculumContentType`

Located in `CurriculumSetupBuilder.tsx`. Keyword-matches DONNA's free-text
answer against the 6 supported types. `inferDomain(raw)` infers the
`domain` column value for skills, skills, and tactical items.

| Raw input pattern | → content_type |
|---|---|
| mental / mindset / focus / emotion | `mental_skill` |
| progression / pathway | `progression` |
| tactical / tactic / strategy | `tactical` |
| drill / activity / exercise | `drill` |
| skill / subskill / sub-skill / technique | `skill` |
| (none match) | `drill` (default) |

---

## Data flow

```
Director speaks/types → DONNA Q&A loop (6 steps)
                      → donna:goal-session-completed event
                      → onGoalSessionCompleted in CurriculumSetupBuilder
                      → buildWorkflowExecutionPlan
                      → DONNA review banner shown
Director clicks Confirm
                      → handleDonnaConfirm()
                      → mapObjectTypeToContentType()
                      → createCurriculumContentItemDraft({
                            contentType, title, levelName,
                            description, coachCues, regressions,
                            progressions, source: 'voice', rawInput
                          })
                      → INSERT academy_curriculum_overrides (pending_review)
                      → audit_logs entry written
                      → buildWorkflowVerificationResult
                      → buildWorkflowCompletionSummary
                      → completion banner shown
Director navigates to review queue
                      → approves override
                      → execute_curriculum_override() (migration 069)
                      → curriculum_content_items mutated
                      → status: 'applied'
```

---

## DONNA workflow steps

| # | stepId | question summary | maps to action field |
|---|---|---|---|
| 1 | `object_type` | What type? (Skill/Subskill/Drill/Tactical/Mental/Progression) | `contentType` |
| 2 | `item_name` | Name of this item | `title` |
| 3 | `curriculum_level` | Which level? (e.g. Orange Ball 2) | `levelName` |
| 4 | `item_description` | Describe in 2–3 sentences | `description` |
| 5 | `coaching_cues` | 2–3 coaching cues | `coachCues[]` |
| 6 | `common_mistakes` | Common errors coaches watch for | `regressions[]` |
| 7* | `progression_relationship` | Harder/easier variant (optional) | `progressions[]` |

\* optional step

---

## Architecture constraints preserved

- Voice never mutates curriculum directly — all changes go through
  `academy_curriculum_overrides` (pending_review) before reaching
  `curriculum_content_items`.
- Global curriculum (`academy_id IS NULL`) is never touched at draft time.
- All draft writes include an `audit_logs` entry (handled by
  `createCurriculumContentItemDraft`).
- Director approval required before `execute_curriculum_override()` runs.
- `VALID_CONTENT_TYPES` validated at action layer before DB insert.

---

## Files changed

| File | Change |
|---|---|
| `src/lib/actions/curriculumDraftActions.ts` | Added 13 migration 061 types to `VALID_CONTENT_TYPES` |
| `src/lib/donna/guidedCompletion/guidedCompletionRegistry.ts` | Replaced 6 level-builder steps with 6 content-item steps |
| `src/lib/donna/pageSync/donnaPageStateSync.ts` | Updated field map to match new step IDs |
| `src/app/director/curriculum/builder/CurriculumSetupBuilder.tsx` | Full DONNA wiring: event listener, type mapper, confirm handler, review + completion banners |
| `src/lib/donna/workflows/donnaWorkflowExecutionEngine.ts` | Updated completion message to show item name and type |
