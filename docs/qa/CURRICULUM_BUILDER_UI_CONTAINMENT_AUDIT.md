# Curriculum Builder UI Containment Audit

**Sprint:** Curriculum Builder UI Containment Audit
**Date:** 2026-06-02
**Auditor:** Claude Code

---

## Surfaces audited

| Surface | Route | Files examined |
|---|---|---|
| Builder landing page | `/director/curriculum/builder` | `builder/page.tsx`, `CurriculumSetupBuilder.tsx` |
| Level builder | `/director/curriculum/level/[levelId]` | `CurriculumLevelBuilderExperience.tsx`, `CurriculumLevelPage` |
| Change queue | Both | `CurriculumBuilderChangeQueue.tsx`, `CurriculumChangeQueue.tsx` |
| Draft input panel | Level builder | `CurriculumChangeDraftPanel.tsx` |
| Voice override panel | Curriculum page | `VoiceOverrideInputPanel.tsx` |

---

## Findings

### Issue 1 — CRITICAL: Mobile change queue invisible
**Component:** `CurriculumLevelBuilderExperience`
**Problem:** `changeQueue` RSC slot is inside `<aside className="hidden lg:block">`. On any screen narrower than `lg` (1024px) the entire pending modifications queue is hidden. Directors on tablets or mobile see no pending drafts.
**Fix:** Added a `block lg:hidden` mobile section rendering the `changeQueue` directly in the main content column, immediately after "Propose a Change". Wrapped in `max-h-[480px] overflow-y-auto` to prevent unbounded growth.

### Issue 2 — HIGH: Desktop change queue had no max-height
**Component:** `CurriculumLevelBuilderExperience`
**Problem:** The sidebar change queue had no height constraint. With many pending drafts, the sidebar would grow taller than the viewport, pushing content below the fold.
**Fix:** Wrapped desktop change queue in `max-h-[calc(100vh-280px)] overflow-y-auto`.

### Issue 3 — HIGH: No pending modifications visible on builder landing page
**Component:** `builder/page.tsx`
**Problem:** The `/director/curriculum/builder` landing page rendered `CurriculumSetupBuilder` only. If there were pending drafts, the director had no way to see them without navigating to a level page.
**Fix:** Added `<CurriculumBuilderChangeQueue />` wrapped in `<Suspense fallback={null}>` above the setup builder. Renders nothing when queue is empty.

### Issue 4 — MEDIUM: After draft submission, no scroll path to the new queue item
**Component:** `CurriculumChangeDraftPanel`
**Problem:** After a successful draft creation, the success state showed a "Go to Review Queue" link (navigates away) but no way to scroll to the pending items panel on the same page.
**Fix:** Added "View Pending Modifications" button in the success state that `scrollIntoView({ behavior: 'smooth' })` to `#curriculum-change-queue`. Both desktop sidebar and mobile section share this anchor ID.

### Issue 5 — MEDIUM: Change queue showed empty state on builder landing; no visual indicator of pending count
**Component:** `CurriculumBuilderChangeQueue`
**Problem:** When items existed, there was no visible count badge. When queue was empty, the component rendered an empty-state UI on the builder landing page unnecessarily.
**Fix:** Added `items.length` count badge ("N to review") in the header. When both `items` and `recoveryItems` are empty, the component returns `null` — builder landing stays clean.

### Issue 6 — LOW: Desktop sidebar used `hidden lg:block` → `flex-col` mismatch
**Component:** `CurriculumLevelBuilderExperience`
**Problem:** `aside.hidden lg:block` + `space-y-4` works, but the sticky/scroll behavior is cleaner with `lg:flex lg:flex-col gap-4`.
**Fix:** Changed to `hidden lg:flex lg:flex-col` with `gap-4`.

---

## Not broken (no fix needed)

- `VoiceOverrideInputPanel` — contained in a `<Card>`, success/error states inline, no containment issue
- `CurriculumChangeQueue` approve/reject controls — fully visible within each item card
- `CurriculumChangeDraftPanel` form — contained within a rounded card, textarea rows are bounded
- `CurriculumDonnaPanel` — contained in sidebar, not a modification surface

---

## QA verification checklist

### Mobile (< 1024px viewport)

- [ ] Navigate to `/director/curriculum/level/[any-level-id]`
- [ ] Submit a draft via "Propose a Change"
- [ ] Pending Modifications section appears below the draft panel
- [ ] Approve/reject buttons visible without horizontal scroll
- [ ] `max-h-[480px]` scroll appears when > ~5 items

### Desktop (≥ 1024px)

- [ ] Navigate to `/director/curriculum/level/[any-level-id]`
- [ ] Right sidebar shows DONNA panel + pending mods queue
- [ ] Sidebar does not grow taller than viewport when many drafts exist
- [ ] Overflow scroll appears within sidebar queue

### Builder landing page

- [ ] Navigate to `/director/curriculum/builder`
- [ ] When there are pending drafts: "Pending Modifications" section visible above the builder
- [ ] Count badge shows number of items
- [ ] When queue is empty: section is hidden (no empty-state UI)

### After draft creation

- [ ] Submit a draft on level builder page
- [ ] "View Pending Modifications" button appears in success state
- [ ] Clicking it smooth-scrolls to `#curriculum-change-queue`
- [ ] Queue shows the newly created draft
- [ ] "Open Review Queue" still works as before

### TypeScript

- [ ] `npx tsc --noEmit` clean
