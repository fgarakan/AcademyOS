# Templates Route Navigation QA

**Sprint:** 932
**Date:** 2026-05-18
**Status:** QA complete — all routes confirmed

---

## Routes created in this sprint block

| Route | File | Type | Status |
|---|---|---|---|
| `/director/templates` | `src/app/director/templates/page.tsx` | Server Component | Exists — Sprint 920/921 |
| `/director/templates/class` | `src/app/director/templates/class/page.tsx` | Server Component | Exists — Sprint 923 |
| `/director/templates/class/create` | `src/app/director/templates/class/create/page.tsx` | Client Component | Exists — Sprint 925 |
| `/director/templates/class/[templateId]` | `src/app/director/templates/class/[templateId]/page.tsx` | Server Component | Exists — Sprint 926 |
| `/director/templates/fitness` | `src/app/director/templates/fitness/page.tsx` | Server Component | Exists — Sprint 924 |
| `/director/templates/fitness/create` | `src/app/director/templates/fitness/create/page.tsx` | Client Component | Exists — Sprint 927 |
| `/director/templates/fitness/[templateId]` | `src/app/director/templates/fitness/[templateId]/page.tsx` | Server Component | Exists — Sprint 928 |
| `/director/templates/coach-preview` | `src/app/director/templates/coach-preview/page.tsx` | Server Component | Exists — Sprint 929 |
| `/director/templates/impact-preview` | `src/app/director/templates/impact-preview/page.tsx` | Server Component | Exists — Sprint 930 |
| `/director/templates/donna-suggestions` | `src/app/director/templates/donna-suggestions/page.tsx` | Client Component | Exists — Sprint 931 |

**All 10 routes confirmed via `find src/app/director/templates -name page.tsx`.**

---

## Navigation links audit

### From `/director/templates` (home)

| Link | Destination | Status |
|---|---|---|
| Create Class Template | `/director/templates/class/create` | Correct |
| Create Fitness Template | `/director/templates/fitness/create` | Correct |
| Review Existing Templates | `/director/templates/class` | Correct |
| Ask DONNA to Suggest | `/director/templates/donna-suggestions` | Correct |
| Open Class Templates button | `/director/templates/class` | Correct |
| Open Fitness Templates button | `/director/templates/fitness` | Correct |

### DONNA panel quick actions

| Mode | All links updated | Status |
|---|---|---|
| home | `/director/templates/class/create`, `/director/templates/fitness/create`, `/director/templates/class`, `/director/templates/donna-suggestions` | Correct |
| class_library | create, suggestions, impact-preview, coach-preview | Correct |
| fitness_library | create, suggestions, impact-preview, coach-preview | Correct |
| class_create | class, suggestions, coach-preview | Correct |
| fitness_create | fitness, suggestions, impact-preview | Correct |
| class_detail | class, coach-preview, impact-preview, suggestions | Correct |
| fitness_detail | fitness, coach-preview, impact-preview | Correct |
| coach_preview | class, fitness, impact-preview | Correct |
| impact | class, fitness, coach-preview | Correct |
| suggestions | class/create, fitness/create, class, fitness | Correct |

### Cross-page navigation

| From | To | Method | Status |
|---|---|---|---|
| Class library | Home | Breadcrumb | Correct |
| Class library → detail | `/director/templates/class/[id]` | Card link | Correct |
| Fitness library | Home | Breadcrumb | Correct |
| Fitness library → detail | `/director/templates/fitness/[id]` | Card link | Correct |
| Class detail | Coach preview | Draft safety panel | Correct |
| Class detail | Impact preview | Draft safety panel | Correct |
| Fitness detail | Coach preview | Draft safety panel | Correct |
| Fitness detail | Impact preview | Draft safety panel | Correct |
| Impact preview | Review queue | `/director/review` | Correct |
| Impact preview | Fitness template | `/director/templates/fitness/ft-001` | Correct |
| Coach preview | Impact preview | Footer nav | Correct |
| Fitness library | Class library | Cross-link | Correct |

---

## TypeScript

All files pass `npx tsc --noEmit`. No errors introduced by this sprint block.

---

## Known limitations

- All template route pages use mock/demo data only.
- `[templateId]` detail pages fall back to the first mock template if an unknown ID is provided.
- Create flows (`class/create`, `fitness/create`) are local state only — no server actions wired.
- "Save as Draft" alerts demo-only message, does not persist.
- "Create Draft" in DONNA suggestions is local state, not persisted.
- "Dismiss" in DONNA suggestions is local state, not persisted.
- Impact preview scope actions alert demo-only message.
- Coach preview DONNA quick actions are display-only.
- Filter buttons in library pages are display-only (no client-side filtering yet).

---

## Old routes (pre-sprint block)

The following routes existed before this block and still work. They are not deprecated — they have real backend connectivity:

| Old route | File | Notes |
|---|---|---|
| `/director/class-templates` | `src/app/director/class-templates/page.tsx` | Real DB — keep |
| `/director/class-templates/new` | `src/app/director/class-templates/new/page.tsx` | Real creation form |
| `/director/class-templates/[id]` | `src/app/director/class-templates/[templateId]/page.tsx` | Real detail editor |
| `/director/fitness/templates` | `src/app/director/fitness/templates/page.tsx` | Real DB — keep |
| `/director/fitness/templates/new` | `src/app/director/fitness/templates/new/page.tsx` | Real creation form |
| `/director/fitness/templates/[id]` | `src/app/director/fitness/templates/[templateId]/page.tsx` | Real detail editor |

The new `/director/templates/` hierarchy is the new UX layer. When backend wiring is added to the new routes, the old routes can be deprecated.

---

## Next recommended sprint

**Sprint 933 — Templates Mobile Desktop Polish V1**: Address overflow, max-width, touch targets, and DONNA panel behavior across all new routes.
