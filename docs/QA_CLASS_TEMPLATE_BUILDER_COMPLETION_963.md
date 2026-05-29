# QA — Class Template Builder Completion V1
**Date:** 2026-05-29
**Sprint:** 963

---

## TypeScript

- [x] `npx tsc --noEmit` passes with no errors
- [x] `page.tsx` compiles cleanly — `Sparkles` import added from `lucide-react`
- [x] `STEP_LABELS` array correctly typed as `string[]` — index access is safe
- [x] `emptyBlocksCount` derived from `blockList.filter(...)` — correct type
- [x] `recommendedStep` is a `number` — ternary resolves to 1, 3, or 5
- [x] `ClassTemplateBuilderStepper.tsx` compiles cleanly
- [x] Step 3 wrapper div + inner div structure is valid JSX (no comment between `return (` and `<div>`)
- [x] Step 5 wrapper div around `LessonPlanDraftPanel` is valid JSX
- [x] `blockPurposeCopy` used in Step 2 — function already in scope in the same file
- [x] All `data-donna-focus-id` attributes are plain HTML strings — no type issues

---

## Class template flow checklist

- [x] Template Readiness card renders above the stepper
- [x] Block count shows correctly from `blockList.length`
- [x] Activity count shows correctly from `totalCurriculumItems`
- [x] Curriculum level shows `currentLevelName` when set, "Not set" in orange when not set
- [x] Duration shows when `template.total_duration_min` is not null
- [x] Recommended step is 1 when no curriculum level set
- [x] Recommended step is 3 when curriculum level set but no content
- [x] Recommended step is 5 when curriculum level set and content exists with no empty blocks
- [x] All 5 stepper steps remain accessible via `StepperNav`
- [x] Bottom navigation (prev/next) unchanged

---

## Block editor checklist

- [x] Step 2 shows updated explanatory note pointing to Step 3 for editing
- [x] Step 2 shows V2 boundary note explaining block-section add/remove/reorder is future
- [x] Step 2 V2 note explicitly states template default order is separate from live session runtime adjustments
- [x] Step 2 block rows show `blockPurposeCopy()` text on ≥ sm screens (`hidden sm:block`)
- [x] Step 2 block purpose copy is hidden on mobile — no overflow risk
- [x] Step 2 block list wrapper has `data-donna-focus-id="class-template-block-list"`
- [x] Step 3 (Build Blocks) behavior unchanged — `BlockContentPickerCard` add/remove works as before
- [x] Step 3 has outer wrapper `data-donna-focus-id="class-template-primary-action"`
- [x] Step 3 inner `data-donna-focus-id="template-blocks-section"` preserved
- [x] Step 5 `LessonPlanDraftPanel` wrapped in `data-donna-focus-id="class-template-review-draft"`
- [x] Step 5 `GenerateSessionFromTemplateButton` inside `template-generate-session` unchanged

---

## Proposed actions safety checklist

- [x] No new `proposed_actions` records created by Sprint 963 code
- [x] `addBlockContentAction` behavior unchanged — direct DB mutation preserved as-is
- [x] `removeBlockContentAction` behavior unchanged — direct DB mutation preserved as-is
- [x] `setCurriculumLevelAction` behavior unchanged
- [x] `applyLessonPlanDraftAction` behavior unchanged
- [x] `generateLessonPlanDraftAction` behavior unchanged
- [x] No new `proposed_actions` action types introduced
- [x] Sprint 904 approve/reject paths: untouched
- [x] `proposed_actions` state machine: untouched

---

## CTA clarity checklist

- [x] Template Readiness "Recommended" chip clearly labels the suggested step
- [x] Step 2 note says "Go to Build Blocks (Step 3)" — actionable direction
- [x] Step 2 V2 note does not imply block-section editing is available
- [x] Step 3 note unchanged — "Remove anything that does not fit" still accurate
- [x] Step 5 summary card and workflow guide unchanged

---

## DONNA highlight target checklist

- [x] `data-donna-focus-id="class-template-header"` on page header div
- [x] `data-donna-focus-id="class-template-block-list"` on Step 2 block list wrapper
- [x] `data-donna-focus-id="class-template-primary-action"` on Step 3 outer wrapper
- [x] `data-donna-focus-id="class-template-review-draft"` on Step 5 LessonPlanDraftPanel wrapper
- [x] All pre-existing focus IDs preserved: `template-level-picker`, `template-blocks-section`, `template-generate-session`, `template-stepper`
- [x] No existing focus IDs renamed or removed
- [x] All new target IDs use `class-template-` prefix — consistent naming convention

---

## Mobile / basic responsive checklist

- [x] Template Readiness card uses `flex-col sm:flex-row` — stacks on mobile, side-by-side on desktop
- [x] Readiness stat items use `flex-wrap` — safe on narrow screens
- [x] Step 2 purpose copy hidden on mobile (`hidden sm:block`) — no overflow risk
- [x] V2 boundary note wraps naturally — no fixed widths
- [x] Step 3 wrapper div adds no styling — no layout impact
- [x] Step 5 wrapper div adds no styling — no layout impact

---

## No-mutation / no-send checklist

- [x] Template Readiness card is a pure Server Component display — no DB writes
- [x] All added `data-donna-focus-id` attributes are passive HTML attributes — no mutations
- [x] Block purpose copy text in Step 2 is read-only — no mutations
- [x] V2 boundary note is display-only — no mutations
- [x] No parent/player communication sent
- [x] No push/email/SMS dispatch
- [x] No player level movement
- [x] No roster/billing/attendance/curriculum/session mutations

---

## Protected systems checklist

- [x] Sprint 904 approve/reject paths: untouched
- [x] `proposed_actions` state machine: untouched
- [x] DONNA God Mode V1 systems (939–960): untouched — only additive attributes and display elements
- [x] Sprint 961 onboarding UX: untouched
- [x] Sprint 962 curriculum builder UX: untouched
- [x] Coach wrap-up loop (926–936): untouched
- [x] Class template data model: unchanged — no schema changes
- [x] Template default order (`template_blocks.order_index`): not modified; V2 note correctly distinguishes from session runtime
- [x] Global/academy curriculum permission model: unchanged
- [x] Parent/player communication safety: untouched
- [x] Player level movement safety: untouched
- [x] Roster/placement/billing safety: untouched
- [x] RLS/multi-tenant boundaries: unchanged — `addBlockContentAction` and `removeBlockContentAction` RLS checks are unmodified
- [x] All other class template routes: untouched
