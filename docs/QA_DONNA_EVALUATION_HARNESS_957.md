# QA — DONNA Evaluation Harness V1
**Date:** 2026-05-29
**Sprint:** 957

---

## TypeScript

- [x] `npx tsc --noEmit` passes with no errors (clean before and after routing fix)
- [x] `donnaEvaluationHarness.ts` compiles cleanly
- [x] `DonnaEvalCase`, `EvalResult` interfaces are correctly typed
- [x] `DONNA_EVAL_CASES` is typed as `readonly DonnaEvalCase[]`
- [x] Role casts (`role as 'director' | 'coach'`) are safe — `DonnaContextRole` includes both values
- [x] `runEvalCase` return type `EvalResult` is satisfied by all code paths
- [x] `runAllEvals` return type `EvalResult[]` is correct

---

## Import resolution

- [x] `WhatNextLiveContext` — type import from `./donnaWhatNextEngine`, exported interface at line 35 ✓
- [x] `DirectorBriefInput` — type import from `./donnaDirectorBrief`, exported interface at line 69 ✓
- [x] `buildWhatNextAnswer` — value import from `./donnaWhatNextEngine`, exported function at line 86 ✓
- [x] `buildDirectorBrief` — value import from `./donnaDirectorBrief`, exported function at line 83 ✓
- [x] `routeDonnaAction` — value import from `./donnaSafeActionRouter`, exported function at line 57 ✓
- [x] No imports from `supabase`, `database.types.ts`, or any backend module
- [x] No imports that introduce network or side-effect dependencies

---

## Eval coverage

- [x] Director what-next: `director_review_queue_what_next` — asserts `targetId` and `containsText`
- [x] Director brief: `director_brief_with_pending` — asserts top priority `targetId` and `containsText`
- [x] Coach what-next: `coach_missing_wrapup` — asserts `targetId` and `containsText`
- [x] Tool routing blocked (director): `blocked_send_parent_message` — asserts `canExecute: false`
- [x] Tool routing allowed (coach): `draft_coach_note_allowed` — asserts `canExecute: true`
- [x] Tool routing role-blocked (coach): `draft_parent_summary_coach_blocked` — asserts `canExecute: false`
- [x] All 6 cases are reachable — tool routing cases are checked before what-next condition (routing fix applied)
- [x] No case produces a fake pass result due to unreachable assertions

---

## Routing fix verification

- [x] `toolId` detection is now the **first** check in `runEvalCase` — executes before what-next condition
- [x] `blocked_send_parent_message` correctly reaches `routeDonnaAction('send_parent_message_direct', ...)` — no longer captured by what-next branch
- [x] `draft_coach_note_allowed` correctly reaches `routeDonnaAction('draft_coach_note', ...)` — no longer captured by what-next branch
- [x] `draft_parent_summary_coach_blocked` correctly reaches `routeDonnaAction('draft_parent_summary', ...)` — no longer captured by what-next branch
- [x] What-next cases (`director_review_queue_what_next`, `coach_missing_wrapup`) still route correctly — they have no tool keyword in their messages

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
- [x] `buildWhatNextAnswer`, `buildDirectorBrief`, `routeDonnaAction` are all read-only deterministic functions — confirmed

---

## No-unsafe-action checklist

- [x] `routeDonnaAction('send_parent_message_direct', ...)` is called — returns `canExecute: false`, no message is sent
- [x] The harness inspects the routing decision object only — it does not call any execution function
- [x] No `execute_approved_action()` calls
- [x] No `proposed_actions` state transitions triggered
- [x] No approval gates bypassed
- [x] No player level movement triggered
- [x] No roster, billing, attendance, or curriculum changes
- [x] Eval runner returns a plain `EvalResult` — it does not act on the decision it inspects

---

## Safety / refusal checklist

- [x] `blocked_send_parent_message` eval asserts that sending a parent message directly returns `canExecute: false`
- [x] `draft_parent_summary_coach_blocked` eval asserts coach cannot perform a director-only action
- [x] Safety refusal cases correctly reach `routeDonnaAction` after the routing fix
- [x] No parent or player communication is triggered by running the eval harness

---

## Highlight target checklist

- [x] `director_review_queue_what_next` asserts `targetId: 'pending-review-list'`
- [x] `coach_missing_wrapup` asserts `targetId: 'coach-wrap-up-link'`
- [x] `director_brief_with_pending` asserts `targetId: 'review-queue-card'` on top priority
- [x] Runner checks `answer.targetId` and `topPriority?.targetId` — not invented values
- [x] `expected.href` field is defined on the interface but no V1 case asserts it — no fake assertions

---

## Protected systems checklist

- [x] Sprint 904 approve/reject paths: untouched — no `proposed_actions` interaction
- [x] `proposed_actions` state machine: untouched — no reads or writes
- [x] DONNA God Mode context/highlight/action systems: untouched — harness calls engines read-only
- [x] DONNA what-next engine (`donnaWhatNextEngine.ts`): called read-only, not modified
- [x] DONNA director brief (`donnaDirectorBrief.ts`): called read-only, not modified
- [x] DONNA safe action router (`donnaSafeActionRouter.ts`): called read-only, not modified
- [x] DONNA memory policy: untouched
- [x] Recommendation Feedback Learning (Sprint 956): untouched — separate module
- [x] Coach wrap-up loop (Sprints 926–936): untouched
- [x] Parent/player communication safety: enforced — `send_parent_message_direct` is asserted blocked
- [x] Player level movement safety: untouched — no level logic
- [x] Roster/placement/billing/attendance/curriculum mutation: none
- [x] RLS/multi-tenant boundaries: not applicable — module makes no DB calls

---

## Future-sprint files excluded checklist

- [x] `src/lib/donna/donnaProactiveAlerts.ts` (Sprint 958) — not staged, not committed
