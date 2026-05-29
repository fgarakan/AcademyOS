# Coach DONNA God Mode Parity V1
**Date:** 2026-05-29
**Sprint:** 948
**Status:** Complete

---

## What Was Built

Two changes to bring coach DONNA toward God Mode parity:

### 1. Coach signals added to `WhatNextLiveContext`

`donnaWhatNextEngine.ts` now accepts:
- `missingWrapUps` — coach wrap-ups not yet submitted
- `todaySessions` — sessions scheduled today
- `observationDraftsToday` — observation drafts today
- `activeSessionId` — current active session

Coach priority ranking added before page element fallback:
1. `missingWrapUps > 0` → points to `coach-wrap-up-link` element
2. `todaySessions > 0` on `/coach` → points to `coach-today-sessions` element

### 2. Coach page guide branch in Shell A

`DonnaVoiceReadyShell.tsx` — new `if (plainRole === 'coach')` block added:
- `COACH_PAGE_NEXT_STEP` pattern: same coverage as director (where am I, what next, etc.)
- Calls `buildWhatNextAnswer('coach', path, coachCtx fields)` for live-data ranking
- Triggers `setDonnaFocusTarget` + `donna:highlight` when engine returns targetId
- Sets `setPendingNavOffer` when engine recommends navigation

---

## Coach Live Context Wiring

```typescript
buildWhatNextAnswer('coach', coachPath, {
  missingWrapUps: coachCtx.missingWrapUps,
  todaySessions: coachCtx.todaySessions,
  observationDraftsToday: coachCtx.observationDraftsToday,
  activeSessionId: coachCtx.activeSessionId,
})
```

---

## Coach "What Next?" Example Flows

### Coach on /coach with 2 missing wrap-ups
1. Coach: "What should I do next?"
2. Engine: `missingWrapUps = 2` → text: "You have 2 sessions missing a wrap-up…"
3. Shell A: `coach-wrap-up-link` highlighted if same page, or nav offer

### Coach on /coach with sessions today
1. Coach: "What should I do next?"
2. Engine: `todaySessions > 0` on /coach → text: "You have N sessions today…"
3. Shell A: `coach-today-sessions` highlighted with teal glow

---

## Wrap-Up Shell Preserved

`DonnaVoiceWrapUpShell.tsx` (Shell C) — completely untouched. The specialized wrap-up interview shell remains separate and correct.

---

## Registered Coach Elements

All previously registered coach elements are available for highlight:
- `coach-today-sessions` (urgent), `coach-players-section` (medium) — `/coach`
- `coach-lesson-plan` (high), `coach-run-session` (urgent), `coach-wrap-up-link` (urgent), `coach-player-watch-list` (medium) — `/coach/sessions/[id]`
- `wrapup-question-card` (urgent), `wrapup-nav-actions` (urgent) — wrap-up page
- `coach-player-list` (medium) — `/coach/players`
