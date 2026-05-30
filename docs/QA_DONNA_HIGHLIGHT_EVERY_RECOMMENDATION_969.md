# QA — DONNA Highlight Every Recommendation — Sprint 969

**Date:** 2026-05-30
**Sprint:** 969

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `src/app/director/review/page.tsx` compiles cleanly — wrapper div added without breaking types
- [ ] `src/lib/donna/directorNextActionEngine.ts` compiles cleanly — string change only

---

## Focus Target Presence Checklist

- [ ] `review-queue-primary` renders when visiting `/director/review` (always present, wraps Tabs)
- [ ] `review-queue-card` exists on `/director` dashboard (unchanged from Sprint 818)
- [ ] `academy-metrics-section` exists on `/director` dashboard (unchanged from Sprint 818)
- [ ] `curriculum-status` exists on `/director/curriculum` (unchanged from Sprint 962)
- [ ] `class-template-primary-action` exists on `/director/class-templates/[id]` (unchanged from Sprint 963)
- [ ] `template-list` exists on `/director/class-templates` (unchanged from Sprint 819)
- [ ] `session-list` exists on `/director/sessions` (confirmed Sprint 969 audit)
- [ ] `player-list` exists on `/director/players` (confirmed Sprint 969 audit — in PlayersDirectoryClient.tsx)
- [ ] `attendance-exceptions-section` still exists (conditional — unchanged from Sprint 836)

---

## Route-by-Route Highlight Checklist

### `/director` with pending reviews
- [ ] `buildDirectorNextAction({ pendingReviews: 3, pathname: '/director' })` returns `targetFocusId: 'review-queue-card'`
- [ ] Tapping chip on `/director` with pending reviews → teal glow on review-queue-card

### `/director` with no pending reviews (fallback)
- [ ] `buildDirectorNextAction({ pendingReviews: 0, pathname: '/director' })` returns `targetFocusId: 'academy-metrics-section'`
- [ ] Tapping chip on `/director` with no pending → teal glow on academy-metrics-section

### `/director/review` with pending reviews
- [ ] `buildDirectorNextAction({ pendingReviews: 2, pathname: '/director/review' })` returns `targetFocusId: 'review-queue-primary'`
- [ ] Tapping chip on `/director/review` → teal glow on the Tabs wrapper (entire review queue area)
- [ ] Highlight works regardless of which tab is active (wrap-ups, attendance, player updates, etc.)
- [ ] Highlight works even when attendance exceptions section is absent

### `/director/curriculum`
- [ ] Returns `targetFocusId: 'curriculum-status'`
- [ ] Tapping chip → teal glow on curriculum status hero card

### `/director/class-templates/[id]`
- [ ] Returns `targetFocusId: 'class-template-primary-action'`
- [ ] Tapping chip → teal glow on primary action area

### `/director/class-templates`
- [ ] Returns `targetFocusId: 'template-list'`
- [ ] Tapping chip → teal glow on template list container

### `/director/sessions`
- [ ] Returns `targetFocusId: 'session-list'`
- [ ] Tapping chip → teal glow on session list

### `/director/players`
- [ ] Returns `targetFocusId: 'player-list'`
- [ ] Tapping chip → teal glow on player list table

---

## Sprint 968 Next-Action Regression Checklist

- [ ] `buildDirectorNextAction` still returns valid `DirectorNextAction` for all routes
- [ ] `matchesWhatNextIntent` still correctly classifies "what should I do next?"
- [ ] `detectAndHandleCommand` in `DonnaAssistantButton` still calls engine on match
- [ ] `setCommandResponse` still set with engine's summary and title
- [ ] `setActiveMode('guide')` still called
- [ ] `donna:highlight` event still dispatched when `targetFocusId` present
- [ ] Fallback (no `targetFocusId`) still shows text response without crash

---

## Sprint 964 Highlight Regression Checklist

- [ ] Existing highlight chips on all routes still work
- [ ] Highlight escalation (teal → warning pulse) still works for repeated chip clicks
- [ ] `DonnaPanelPageChips` still renders on all registered routes
- [ ] `attendance-exceptions-section` chip on review page (if any) still works
- [ ] Existing `attendance-exceptions-section` conditional rendering unchanged

---

## No-Mutation / No-Send Checklist

- [ ] No data is mutated by adding `data-donna-focus-id` attribute
- [ ] No approval/rejection logic changed
- [ ] No tab behavior changed
- [ ] No data fetching changed in review page
- [ ] No proposed_actions created
- [ ] No parent/player communications sent
- [ ] No player records changed
- [ ] No Sprint 904 approve/reject path touched

---

## Protected Systems Checklist

- [ ] `attendance-exceptions-section` wrapper in review page unchanged
- [ ] Review page tab structure unchanged
- [ ] Sprint 904 approve/reject controls unchanged
- [ ] `proposed_actions` state machine unchanged
- [ ] One DONNA button remains
- [ ] No new DONNA surface added
- [ ] No new voice path added
- [ ] No database migration created
- [ ] No schema change
- [ ] No RLS change
