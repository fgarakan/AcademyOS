# QA — Coach Sessions Dashboard UX Polish — Sprint 1044

**Sprint:** 1044 | **Date:** 2026-05-31

---

## Removed — confirm absent

- [ ] **DONNA Coach Assistant card NOT visible** on coach home page
- [ ] **Quick Actions section NOT visible** (no "My Sessions" / "My Players" icon grid at bottom)

## Preserved — confirm present

- [ ] Wrap-up pending alert visible at top when `pendingWrapUpCount > 0`
- [ ] Quick stats row: Today / Players / Notes counts
- [ ] Daily Brief section with `CoachDailyBriefCard` when sessions exist
- [ ] Today's sessions section (`data-donna-focus-id="coach-today-sessions"`)
- [ ] Players & Notes two-column grid (`data-donna-focus-id="coach-players-section"`)
- [ ] On-Court Capture section (`CoachOnCourtActionsBar`)
- [ ] Bottom tab bar: Home, Sessions, Recap, Players, DONNA — all present
- [ ] Floating DONNA button visible (bottom right)
- [ ] DONNA bottom tab still navigates to `/coach/donna`

## Regression

- [ ] Coach home page loads without errors
- [ ] TypeScript: `npx tsc --noEmit` passes clean
