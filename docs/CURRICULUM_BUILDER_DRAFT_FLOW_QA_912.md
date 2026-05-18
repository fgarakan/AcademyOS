# Curriculum Builder Draft Review Queue Flow QA
Sprint 912 — 2026-05-18

## Purpose

Document which parts of the curriculum builder draft flow are real (wired to backend), local-only (simulated in UI state), shell-only (component exists but is disconnected), or blocked (requires schema/backend work not yet done).

---

## Add Drill Page (`/director/curriculum/builder/add-drill`)

| Element | Status | Notes |
|---|---|---|
| Textarea input | Real (local state) | User types prompt |
| Example prompt click-to-use | Real (local state) | Populates textarea |
| Generate draft button | Local-only simulation | `setSubmitted(true)` — no API call |
| Draft card display | Local-only | Static template content, not AI-generated |
| Save Draft button | Shell | Button visible; no `proposed_actions` write |
| Edit Draft button | Shell | No editor UI yet |
| Preview Impact button | Real navigation | Routes to `/director/curriculum/builder/impact-preview` |
| Cancel button | Real | Resets local state |

**Real backend path (blocked):** A real implementation would write to `proposed_actions` with `source: 'curriculum_builder'` and `change_type: 'add_drill'`. The `CurriculumBuilderDraftCard` in `/director/review` is ready to receive this payload once the write is wired.

---

## Add Fitness Page (`/director/curriculum/builder/add-fitness`)

| Element | Status | Notes |
|---|---|---|
| Textarea input | Real (local state) | |
| Example prompt click-to-use | Real (local state) | |
| Generate draft button | Local-only simulation | `setSubmitted(true)` — no API call |
| Draft card display | Local-only | Static template, not AI-generated |
| Save Draft button | Shell | No `proposed_actions` write |
| Edit Draft button | Shell | No editor UI |
| Add to Another Level button | Shell | No level selector yet |
| Cancel button | Real | Resets state |

---

## Impact Preview (`/director/curriculum/builder/impact-preview` and `/director/curriculum/level/[levelId]/impact`)

| Element | Status | Notes |
|---|---|---|
| Change summary card | Local-only | Static content (Wide Ball Recovery Builder) |
| Impact counters | Local-only | Counts from static `IMPACT_ITEMS` array |
| Impact rows | Local-only | Static display-only content |
| Safety note | Real copy | Correctly states nothing is applied |
| Apply to this level only | Disabled shell | Button present, disabled, "Goes to Review Queue" badge |
| Apply to all groups | Disabled shell | Same |
| Apply academy-wide | Disabled shell | Same |
| Save as Draft | Local-only | Toggles `draftSaved` state; no DB write |
| Cancel | Real navigation | Returns to add-drill page |

---

## Level Builder DONNA Actions

| Element | Status | Notes |
|---|---|---|
| "Ask DONNA" buttons per section | Real (UI panel open) | Opens `DonnaAddDrillDraft`, `DonnaAddAssessmentGateDraft`, or `DonnaAddFitnessExerciseDraft` |
| `DonnaAddDrillDraft` textarea + submit | Local-only | `setSubmitted(true)` — no backend write |
| `DonnaAddAssessmentGateDraft` | Local-only | Same pattern |
| `DonnaAddFitnessExerciseDraft` | Local-only | Same pattern |
| DONNA right panel activeAction | Real (UI state) | Highlights correct chip based on active panel |

---

## Review Queue Integration Status

`/director/review/CurriculumBuilderDraftCard.tsx` exists with:
- Full `CurriculumBuilderDraftPayload` interface: `source`, `change_type`, `level_id`, `level_name`, `description`, `domain`, `drafted_by_role`
- Approve/reject actions via `updateStructuredDraftDecisionAction`
- UI ready to receive real drafts

**The review queue card is ready.** What is missing is the write path from the builder UI into `proposed_actions`.

---

## What Is Blocked

All real draft creation requires:
1. A server action that writes to `proposed_actions` with `payload` matching `CurriculumBuilderDraftPayload`
2. The write must be academy-scoped and role-gated
3. This is explicitly blocked by sprint rules: "No proposed_actions changes unless explicitly approved"

---

## Recommended Next Step (Post-Sprint 915)

Sprint 916+ should include a single server action:
```
async function createCurriculumDraft(payload: CurriculumBuilderDraftPayload): Promise<void>
```
That writes to `proposed_actions` and triggers the review queue card. This would make all "Save Draft" buttons real.
