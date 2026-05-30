# QA — Coach Assigned Sessions Dashboard — Sprint 976

**Date:** 2026-05-30
**Sprint:** 976

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `src/app/coach/page.tsx` compiles cleanly with new focus ID
- [ ] `donnaPageChipRegistry.ts` compiles cleanly with new coach chip set

---

## Focus Target Checklist

- [ ] `coach-wrapup-alert` renders on `/coach` when `pendingWrapUpCount > 0`
- [ ] `coach-wrapup-alert` not rendered when `pendingWrapUpCount === 0` (conditional — graceful)
- [ ] `coach-today-sessions` exists on `/coach` (pre-existing)
- [ ] `coach-players-section` exists on `/coach` (pre-existing)

---

## Chip Behavior Checklist

- [ ] On `/coach` page: 4 chips appear (coach-today, coach-wrapup, coach-players, coach-next)
- [ ] "Highlight today's sessions" chip → teal glow on today's sessions section
- [ ] "Highlight wrap-ups needed" chip → teal glow on wrap-up alert (when visible)
- [ ] "Highlight wrap-ups needed" chip → no crash when wrap-up alert is not visible
- [ ] "Highlight player list" chip → teal glow on players section
- [ ] "What should I do next?" chip → routes to next-action engine via existing handler

---

## Dashboard Content Checklist

- [ ] Today's sessions shown with name, time, status pill
- [ ] Wrap-up badge shown (Needs Wrap-Up / Draft Submitted / Wrap-Up Done) on completed sessions
- [ ] Wrap-up alert shown when sessions need wrap-up
- [ ] Sessions link to `/coach/sessions/[id]` detail page

---

## No-Mutation / No-Send Checklist

- [ ] No session records changed
- [ ] No coach records changed
- [ ] No parent/player communications sent
- [ ] DONNA highlights are visual-only

---

## Sprint 975 Regression Checklist

- [ ] Session detail chips (ses-detail-*) still show on `/coach/sessions/[id]` — NO (those are director chips)
- [ ] Coach session list at `/coach/sessions` shows correct sessions
