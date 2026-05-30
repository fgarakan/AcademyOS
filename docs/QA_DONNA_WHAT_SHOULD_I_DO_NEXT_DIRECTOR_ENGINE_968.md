# QA — DONNA "What Should I Do Next?" Director Engine — Sprint 968

**Date:** 2026-05-30
**Sprint:** 968

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `directorNextActionEngine.ts` compiles cleanly — no unused imports, no `any` casts
- [ ] `donnaPageChipRegistry.ts` compiles cleanly after chip addition
- [ ] `DonnaAssistantButton.tsx` compiles cleanly after import + `detectAndHandleCommand` update
- [ ] No new type errors introduced in files not touched by this sprint

---

## Engine Checklist

- [ ] `buildDirectorNextAction({ pendingReviews: 3, pathname: '/director' })` returns `id: 'pending_review_queue'` with `targetFocusId: 'review-queue-card'`
- [ ] `buildDirectorNextAction({ pendingReviews: 0, pathname: '/director/curriculum' })` returns `id: 'curriculum_status_review'` with `targetFocusId: 'curriculum-status'`
- [ ] `buildDirectorNextAction({ pendingReviews: 0, pathname: '/director/class-templates/abc-123' })` returns `id: 'class_template_primary_action'` with `targetFocusId: 'class-template-primary-action'`
- [ ] `buildDirectorNextAction({ pendingReviews: 0, pathname: '/director/class-templates' })` returns `id: 'class_template_list'` with `targetFocusId: 'template-list'`
- [ ] `buildDirectorNextAction({ pendingReviews: 0, pathname: '/director/sessions' })` returns `id: 'sessions_attention'` with `targetFocusId: 'session-list'`
- [ ] `buildDirectorNextAction({ pendingReviews: 0, pathname: '/director/players' })` returns `id: 'player_attention'` with `targetFocusId: 'player-list'`
- [ ] `buildDirectorNextAction({ pendingReviews: 0, pathname: '/director/review' })` returns `id: 'review_queue_clear'` with `targetFocusId: undefined`
- [ ] `buildDirectorNextAction({ pathname: '/director' })` (no pendingReviews) returns fallback `id: 'dashboard_review'` with `targetFocusId: 'academy-metrics-section'`
- [ ] `buildDirectorNextAction({ pendingReviews: 1, pathname: '/director/sessions' })` still returns `id: 'pending_review_queue'` (priority 1 overrides page context)
- [ ] `buildDirectorNextAction` never throws — all code paths return a valid `DirectorNextAction`

---

## Intent Detector Checklist

- [ ] `matchesWhatNextIntent('what should I do next')` returns `true`
- [ ] `matchesWhatNextIntent('What do I do next?')` returns `true`
- [ ] `matchesWhatNextIntent('walk me through what to do')` returns `true`
- [ ] `matchesWhatNextIntent('what is the priority')` returns `true`
- [ ] `matchesWhatNextIntent("what's the priority")` returns `true`
- [ ] `matchesWhatNextIntent('what should I work on')` returns `true`
- [ ] `matchesWhatNextIntent('what needs my attention')` returns `false` (handled by daily brief path)
- [ ] `matchesWhatNextIntent('give me a brief')` returns `false` (daily brief phrase)
- [ ] `matchesWhatNextIntent('where should I start')` returns `false` (handled separately in detectAndHandleCommand)
- [ ] `matchesWhatNextIntent('hello donna')` returns `false`

---

## Chip Behavior Checklist

- [ ] "What should I do next?" chip appears in the DONNA panel when on `/director` page
- [ ] Chip has `actionType: 'prompt'` — tapping sends `'What should I do next?'` into the conversation flow
- [ ] Chip reaches `detectAndHandleCommand` → `matchesWhatNextIntent` matches → engine is called
- [ ] Chip does NOT add a new DONNA surface
- [ ] Chip does NOT add a new voice widget
- [ ] Chip does NOT add a new API call
- [ ] Existing `/director` chips preserved: "Highlight today's pulse", "Highlight review queue", "Highlight academy metrics", "Walk me through academy priorities", "What needs my attention?"
- [ ] Brief chips (Sprint 966) still trigger `onBrief` / `handleFetchDailyBrief` — not routed to the next-action engine
- [ ] "What needs my attention?" still routes to daily brief (does NOT match `matchesWhatNextIntent`)

---

## Highlight Checklist

- [ ] When `action.targetFocusId` is present: `setDonnaFocusTarget` is called with correct `route`, `targetId`, `label`, `highlightStyle: 'teal-glow'`
- [ ] When `action.targetFocusId` is present: `donna:highlight` CustomEvent is dispatched
- [ ] When `action.targetFocusId` is undefined: no `setDonnaFocusTarget` call, no event dispatch — no crash
- [ ] Teal glow appears on `review-queue-card` when director is on `/director` with pending reviews
- [ ] Teal glow appears on `academy-metrics-section` when director is on `/director` with no pending items
- [ ] Teal glow appears on `curriculum-status` when director is on `/director/curriculum`
- [ ] Teal glow appears on `session-list` when director is on `/director/sessions`
- [ ] Highlight expires after 8 seconds (standard `setDonnaFocusTarget` expiry behavior)
- [ ] Highlight escalation (Sprint 964 pulse dot) is independent — not broken by new dispatch

---

## Fallback Checklist

- [ ] Engine returns a valid `DirectorNextAction` for unknown routes (no crash)
- [ ] Fallback summary is shown in panel without highlight when `targetFocusId` is undefined
- [ ] Panel does not show a blank or error state when no live signal is available
- [ ] `commandResponse` is always set with a non-empty `message` and `label`

---

## Safety / No-Mutation Checklist

- [ ] No data is mutated by calling `buildDirectorNextAction`
- [ ] No `proposed_action` is created
- [ ] No player record is changed
- [ ] No parent or player communication is sent
- [ ] No level movement is triggered
- [ ] No session is modified
- [ ] No curriculum is changed
- [ ] No approval gate is bypassed
- [ ] `setDonnaFocusTarget` only writes to `sessionStorage` — no DB write
- [ ] `donna:highlight` event only triggers visual glow — no DB write
- [ ] Director must manually navigate to `targetRoute` — no auto-navigation

---

## Sprint 964 Regression Checklist (Page Chips + Highlight)

- [ ] All existing Sprint 964 highlight chips still work on all registered routes
- [ ] Highlight escalation (teal → warning pulse) still works for repeated chip clicks
- [ ] `DonnaPanelPageChips` still renders correctly on all registered routes
- [ ] `getChipsForRoute` returns correct chips for all routes (prefix + exact matching unchanged)
- [ ] Sprint 964 chips on `/director/curriculum`, `/director/class-templates/[id]`, etc. still present

---

## Sprint 965 Regression Checklist (Voice Persona)

- [ ] `speakDonna` / `speakWithServerTts` path unchanged — not touched by Sprint 968
- [ ] `DonnaVoiceLayer` unchanged
- [ ] Voice greeting on panel open unchanged
- [ ] `donnaVoiceConfig.ts` unchanged
- [ ] `donnaServerTtsClient.ts` unchanged
- [ ] No new voice path added

---

## Sprint 966 Regression Checklist (Brief Chips)

- [ ] Brief chips ("Walk me through academy priorities", "What needs my attention?") still trigger `onBrief`
- [ ] `handleFetchDailyBrief` behavior unchanged
- [ ] `DonnaDailyBriefCard` renders correctly
- [ ] `/api/donna/brief` route unchanged
- [ ] Brief chip `actionType: 'brief'` handling in `DonnaPanelPageChips` unchanged

---

## Sprint 967 Regression Checklist (Daily Brief V2)

- [ ] `buildDirectorDailyBriefing` unchanged
- [ ] `adaptBriefingToDailyBrief` unchanged
- [ ] `DonnaDailyBriefCard` headline rendering unchanged
- [ ] `directorBriefingAdapter.ts` unchanged
- [ ] `/api/donna/brief` route returns correct `DailyBrief` shape
- [ ] `matchesDailyBriefIntent` still correctly classifies daily brief phrases
- [ ] "What needs my attention?" still routes to daily brief — NOT to next-action engine

---

## Sprint 904 Regression Checklist (Approve/Reject)

- [ ] `proposed_actions` state machine unchanged
- [ ] Approve button behavior unchanged
- [ ] Reject button behavior unchanged
- [ ] `execute_approved_action()` RPC unchanged
- [ ] Review queue approve/reject controls unchanged
- [ ] No new proposed_actions are created by Sprint 968

---

## Protected Systems Checklist

- [ ] No new DONNA button added
- [ ] No new DONNA panel added
- [ ] No new voice widget added
- [ ] No new TTS path added
- [ ] No database migration created
- [ ] No schema change
- [ ] No RLS change
- [ ] No permission change
- [ ] One DONNA button remains (`DonnaAssistantButton`)
- [ ] `DonnaWorkflowCards` unchanged
- [ ] `DonnaDailyBriefCard` unchanged
- [ ] `DonnaHighlightBanner` unchanged
- [ ] DONNA God Mode V1 systems unchanged
- [ ] Director dashboard routes unchanged
- [ ] Review center unchanged
- [ ] Coach wrap-up loop unchanged
- [ ] Player/parent communication safety unchanged
- [ ] Player level movement safety unchanged
- [ ] `src/middleware.ts` unchanged
- [ ] `.env.local` unchanged
- [ ] `src/lib/supabase/database.types.ts` unchanged
