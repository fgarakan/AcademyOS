# QA — DONNA Proactive Alerts V1
**Date:** 2026-05-29
**Sprint:** 958

---

## TypeScript

- [x] `npx tsc --noEmit` passes with no errors
- [x] `donnaProactiveAlerts.ts` compiles cleanly
- [x] `ProactiveAlertType` union — 5 values: `review_aging`, `missing_wrap_ups`, `repeated_player_concern`, `parent_summary_ready`, `unresolved_clarification`
- [x] `AlertUrgency` union — 4 values: `critical`, `high`, `medium`, `low`
- [x] `DonnaProactiveAlert` interface is correctly typed — all fields present
- [x] `buildReviewAgingAlert` return type satisfies `DonnaProactiveAlert`
- [x] `buildMissingWrapUpsAlert` return type satisfies `DonnaProactiveAlert`
- [x] `buildParentSummaryReadyAlert` return type satisfies `DonnaProactiveAlert`
- [x] `buildProactiveAlerts` input intersection type is valid — `DirectorBriefInput & { reviewOldestDaysAgo?, sessionsWithoutWrapUp?, parentSummariesReady? }`
- [x] `buildProactiveAlerts` return type is `DonnaProactiveAlert[]`
- [x] `ORDER` record in sort callback covers all 4 `AlertUrgency` values — exhaustive

---

## Import resolution

- [x] `DirectorBriefInput` — type import from `./donnaDirectorBrief`, exported interface at line 69; includes `pendingReviews?: number` ✓
- [x] `getSafetyMessage` — value import from `./donnaPersonality`, exported function at line 169 ✓
- [x] `getSafetyMessage('approvalRequired')` — key `approvalRequired` present at line 132 ✓
- [x] `getSafetyMessage('noAutoSend')` — key `noAutoSend` present at line 136 ✓
- [x] No imports from `supabase`, `database.types.ts`, or any backend module
- [x] No imports that introduce network or side-effect dependencies

---

## Alert coverage

- [x] `review_aging` — `buildReviewAgingAlert(pendingCount, oldestDaysAgo)` exported and callable
- [x] `missing_wrap_ups` — `buildMissingWrapUpsAlert(sessionsWithoutWrapUp)` exported and callable
- [x] `parent_summary_ready` — `buildParentSummaryReadyAlert(playerCount)` exported and callable
- [x] `repeated_player_concern` — type declared, no V1 builder (intentionally deferred to V2, documented in architecture doc)
- [x] `unresolved_clarification` — type declared, no V1 builder (intentionally deferred to V2, documented in architecture doc)
- [x] `buildProactiveAlerts` suite combines all 3 V1 builders with threshold guards and urgency sort
- [x] Urgency sort order is correct: critical (0) → high (1) → medium (2) → low (3)
- [x] Thresholds: `review_aging` fires only when `pending > 0 && oldest > 3`; `missing_wrap_ups` fires only when `>= 2`; `parent_summary_ready` fires when `> 0`

---

## No-mutation checklist

- [x] No `supabase.from(...)` calls anywhere in the module
- [x] No `INSERT`, `UPDATE`, `DELETE`, or `UPSERT` operations
- [x] No server actions invoked
- [x] No `proposed_actions` records created
- [x] No `audit_log` writes
- [x] No player record mutations
- [x] No curriculum record mutations
- [x] No attendance record mutations
- [x] No billing mutations
- [x] Pure functions — same inputs produce same alert structure (only `id` differs due to `Date.now()`)

---

## No-push / no-email checklist

- [x] No `fetch()`, `axios`, or any HTTP call in the module
- [x] No push notification dispatch
- [x] No email dispatch
- [x] No SMS dispatch
- [x] No background job enqueued
- [x] No scheduled task created
- [x] `actionRoute` is a plain string navigation hint — not a redirect trigger, not a server action
- [x] Alert objects are plain TypeScript return values — nothing is transmitted

---

## No parent/player communication checklist

- [x] No parent-facing content created or dispatched
- [x] No player-facing content created or dispatched
- [x] `parent_summary_ready` alert is director-only — it signals that summaries exist for director review, not that summaries are sent
- [x] All `actionRoute` values point to director-only routes (`/director/review`, `/director/sessions`)
- [x] `body` copy for `parent_summary_ready` explicitly states "Nothing is sent automatically — your approval is required"
- [x] `safetyNote` for `parent_summary_ready` is `getSafetyMessage('noAutoSend')` — reinforces no-auto-send guarantee

---

## Safety / refusal checklist

- [x] `review_aging` alert includes `getSafetyMessage('approvalRequired')` — director knows items do not take effect until approved
- [x] `parent_summary_ready` alert includes `getSafetyMessage('noAutoSend')` — director knows nothing is sent automatically
- [x] `dismissible: true` on all alerts — director can dismiss any alert
- [x] No alert bypasses the `proposed_actions` state machine
- [x] No alert bypasses approval gates
- [x] No alert triggers player level movement
- [x] No alert mutates roster, billing, attendance, or curriculum
- [x] No sensitive data (raw coach notes, internal director comments, raw IDs beyond route paths, raw JSON) in any alert field

---

## Protected systems checklist

- [x] Sprint 904 approve/reject paths: untouched — no `proposed_actions` interaction
- [x] `proposed_actions` state machine: untouched — no reads or writes
- [x] DONNA God Mode context/highlight/action systems: untouched
- [x] DONNA what-next engine: untouched — separate module
- [x] DONNA director brief (`donnaDirectorBrief.ts`): type import only — not modified
- [x] DONNA safe action router: untouched
- [x] DONNA memory policy: untouched
- [x] Recommendation Feedback Learning (Sprint 956): untouched — dismiss/snooze tracking is the UI layer's responsibility
- [x] DONNA Evaluation Harness (Sprint 957): untouched — separate module
- [x] Coach wrap-up loop (Sprints 926–936): untouched
- [x] Parent/player communication safety: enforced — no communication dispatch, director-only routes
- [x] Player level movement safety: untouched
- [x] Roster/placement/billing/attendance/curriculum mutation: none
- [x] Curriculum draft pending_review behavior: untouched
- [x] RLS/multi-tenant boundaries: not applicable — module makes no DB calls
