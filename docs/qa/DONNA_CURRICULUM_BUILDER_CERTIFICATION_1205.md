# DONNA Curriculum Builder — Certification
**Sprint:** Mega Sprint 1205–1234
**Date:** 2026-06-08

---

## Scenario 1 — Skill draft via DONNA

Director is on `/director/curriculum/builder`.
DONNA collects: object_type="Skill", item_name="Cross-court forehand rally",
curriculum_level="Orange Ball 2", item_description="...", coaching_cues="...",
common_mistakes="...".

→ `onGoalSessionCompleted` fires in `CurriculumSetupBuilder`
→ `buildWorkflowExecutionPlan` → 6/6 required → `readyToSubmit: true`
→ DONNA review banner appears
→ Director clicks "Confirm & Save Curriculum Draft"
→ `mapObjectTypeToContentType("Skill")` → `'skill'`
→ `createCurriculumContentItemDraft({ contentType: 'skill', ... })`
← `{ ok: true, draftId: 'ov_xxx' }`
→ completion banner: "Skill "Cross-court forehand rally" drafted for Orange Ball 2."

**Result: PASS**

---

## Scenario 2 — Subskill draft via DONNA

DONNA collects: object_type="Subskill", item_name="Hip rotation at contact",
curriculum_level="Orange Ball 1".

→ `mapObjectTypeToContentType("Subskill")` → `'skill'`
→ Draft created as `content_type: 'skill'`
→ `overrideReason` captures "object type: Subskill" for director context
→ Completion banner shown

**Result: PASS — V1 limitation documented (no DB hierarchy yet)**

---

## Scenario 3 — Drill draft via DONNA

DONNA collects: object_type="Drill", item_name="Mini rally to target",
curriculum_level="Red Ball 2", coaching_cues="Watch the ball, Step in early".

→ `mapObjectTypeToContentType("Drill")` → `'drill'`
→ `parseCoachCues("Watch the ball, Step in early")` → `['Watch the ball', 'Step in early']`
→ `createCurriculumContentItemDraft({ contentType: 'drill', coachCues: [...] })`

**Result: PASS**

---

## Scenario 4 — Tactical Concept draft via DONNA (distinct type preserved)

DONNA collects: object_type="Tactical Concept", item_name="Open court attack",
curriculum_level="Yellow Ball 1".

→ `mapObjectTypeToContentType("Tactical Concept")` → `'tactical'`
→ `inferDomain("Tactical Concept")` → `'Tactical'`
→ Draft created as `content_type: 'tactical'` — NOT collapsed into 'drill'

**Result: PASS — tactical preserved as distinct type**

---

## Scenario 5 — Mental Concept draft via DONNA (distinct type preserved)

DONNA collects: object_type="Mental Concept", item_name="Reset after double fault",
curriculum_level="Orange Ball 3".

→ `mapObjectTypeToContentType("Mental Concept")` → `'mental_skill'`
→ `inferDomain("Mental Concept")` → `'Mentality'`
→ Draft created as `content_type: 'mental_skill'` — NOT collapsed into 'tactical'

**Result: PASS — mental_skill preserved as distinct type**

---

## Scenario 6 — Progression draft via DONNA (distinct type preserved)

DONNA collects: object_type="Progression", item_name="Cross-court rally under pressure",
curriculum_level="Orange Ball 2", progression_relationship="Easier: rally to target".

→ `mapObjectTypeToContentType("Progression")` → `'progression'`
→ `progressions` field: `['Easier: rally to target']`
→ Draft created as `content_type: 'progression'` — NOT collapsed into 'drill'

**Result: PASS — progression preserved as distinct type**

---

## Scenario 7 — Standard curriculum builder path (no DONNA, no regression)

Director navigates to `/director/curriculum/builder` without triggering DONNA.
`donnaPlan` is null — no review banner shown.
Standard buttons (Start Guided Review, Jump to Level, etc.) all function normally.

**Result: PASS — no regression**

---

## Scenario 8 — DONNA dismiss / cancel

Director sees DONNA review banner, clicks "Dismiss".
`donnaPlan` set to null, `donnaError` cleared.
Standard builder UI restored. No draft created.

**Result: PASS**

---

## Scenario 9 — Missing level name (levelName not resolved)

DONNA answer for `curriculum_level` doesn't match any DB level name.
`createCurriculumContentItemDraft` returns:
`{ ok: false, error: 'Could not find a curriculum level named "..."', blocked: true }`.
`buildWorkflowVerificationResult` → `verified: false`.
`donnaError` set → error shown in review banner.
Director can dismiss and try again.

**Result: PASS — graceful error, no crash**

---

## Scenario 10 — Invalid content type guard

If a future code change somehow passes an invalid string through
`mapObjectTypeToContentType`, `createCurriculumContentItemDraft` rejects it:
`VALID_CONTENT_TYPES` guard triggers → `{ ok: false, error: 'Invalid contentType...' }`.

**Result: PASS — type safety enforced at action layer**

---

## Scenario 11 — Incomplete DONNA session (readyToSubmit: false)

DONNA session completed with fewer than 6 required answers.
`buildWorkflowExecutionPlan` → `readyToSubmit: false`.
"Confirm" button disabled (`disabled={!donnaPlan.readyToSubmit}`).
Director cannot submit incomplete draft.

**Result: PASS**

---

## Scenario 12 — Completion banner → create another

Director sees completion banner after successful draft.
Clicks "Create another item" → `setDonnaCompletion(null)`.
Builder UI restored. DONNA can be triggered again for a new item.

**Result: PASS**

---

## Type coverage matrix

| Object type | DB content_type | Collapsed? | Certified |
|---|---|---|---|
| Skill | `skill` | No | PASS (S1) |
| Subskill | `skill` | V1 — no DB hierarchy | PASS with note (S2) |
| Drill | `drill` | No | PASS (S3) |
| Tactical Concept | `tactical` | No | PASS (S4) |
| Mental Concept | `mental_skill` | No — distinct | PASS (S5) |
| Progression | `progression` | No — distinct | PASS (S6) |

---

## Architecture compliance

| Rule | Status |
|---|---|
| Voice never mutates curriculum directly | PASS — goes through `academy_curriculum_overrides` |
| All draft writes to `audit_logs` | PASS — handled by `createCurriculumContentItemDraft` |
| Director confirmation required | PASS — review banner + Confirm button |
| Global curriculum untouched at draft time | PASS — `academy_id` resolved from auth |
| No new DB migrations | PASS |
| No new npm packages | PASS |
| TypeScript clean | PASS — 0 errors |
