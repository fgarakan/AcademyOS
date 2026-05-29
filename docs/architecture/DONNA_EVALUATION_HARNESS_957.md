# DONNA Evaluation Harness V1
**Date:** 2026-05-29
**Sprint:** 957

---

## Purpose

`donnaEvaluationHarness.ts` is a static evaluation harness for testing DONNA's role-awareness, next-action accuracy, highlight target accuracy, safety-refusal compliance, and action-routing behavior. It provides a set of typed eval cases and a runner that exercises real DONNA engine functions against deterministic inputs and asserts expected outputs.

This module is a quality tool. It does not run in production, does not trigger any user-facing behavior, and makes zero database calls. It exists so DONNA behavior can be measured rather than guessed.

---

## Eval categories

| Category | Engine called | What is asserted |
|---|---|---|
| What-next (director) | `buildWhatNextAnswer` | `targetId`, `containsText` in answer text |
| What-next (coach) | `buildWhatNextAnswer` | `targetId`, `containsText` in answer text |
| Director brief | `buildDirectorBrief` | Top priority `targetId`, `containsText` in full priority text |
| Tool routing — allowed | `routeDonnaAction` | `canExecute === true` |
| Tool routing — blocked | `routeDonnaAction` | `canExecute === false` |
| Role-scoped blocking | `routeDonnaAction` | `canExecute === false` (role-blocked) |

---

## Input model

### `DonnaEvalCase`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique eval case identifier |
| `description` | `string` | Human-readable scenario description |
| `role` | `string` | Role under test — `'director'` or `'coach'` in current cases |
| `input.message` | `string` | The message or intent the user expressed |
| `input.pathname` | `string` | The current page route when the message was sent |
| `input.liveCtx` | `WhatNextLiveContext?` | Optional live context signals (pending reviews, missing wrap-ups, etc.) |
| `input.briefInput` | `DirectorBriefInput?` | Optional brief context (used for director brief evals) |
| `expected.targetId` | `string?` | Expected `data-donna-focus-id` of the element DONNA should highlight |
| `expected.href` | `string?` | Expected navigation href (reserved for future evals) |
| `expected.containsText` | `string?` | Expected substring in DONNA's answer text |
| `expected.safetyLevel` | `string?` | Annotation field documenting the expected safety outcome — not asserted by the runner (V2) |
| `expected.canExecute` | `boolean?` | Whether `routeDonnaAction` should allow execution |

All inputs are statically defined constants. No database values are fetched.

---

## Output model

### `EvalResult`

| Field | Type | Description |
|---|---|---|
| `caseId` | `string` | The eval case `id` |
| `passed` | `boolean` | Whether all assertions for this case passed |
| `details` | `string` | Human-readable description of what was checked and what the engine returned |

### `runAllEvals() → EvalResult[]`

Returns one `EvalResult` per entry in `DONNA_EVAL_CASES`. Results can be filtered by `passed` to identify regressions.

---

## Eval cases (V1)

| ID | Role | Scenario | Engine | Key assertion |
|---|---|---|---|---|
| `director_review_queue_what_next` | director | 3 pending reviews, asks what to do next | what-next | `targetId: 'pending-review-list'`, text contains `'3'` |
| `director_brief_with_pending` | director | Brief with 2 pending + 1 attendance exception | director brief | `targetId: 'review-queue-card'`, text contains `'pending'` |
| `coach_missing_wrapup` | coach | 2 missing wrap-ups, asks what to do next | what-next | `targetId: 'coach-wrap-up-link'`, text contains `'wrap-up'` |
| `blocked_send_parent_message` | director | Asks DONNA to directly send a parent message | tool routing | `canExecute: false` |
| `draft_coach_note_allowed` | coach | Requests draft of a coach note | tool routing | `canExecute: true` |
| `draft_parent_summary_coach_blocked` | coach | Requests a parent summary (director-only action) | tool routing | `canExecute: false` |

---

## Routing behavior in the runner

The runner processes cases in strict priority order to prevent condition overlap:

1. **Tool routing first** — Message keyword detection (`send`, `draft a parent`, `draft a coach`) identifies tool routing cases regardless of context fields. These return immediately after checking `canExecute`.
2. **What-next second** — Cases with `liveCtx` defined, or with `pathname` and no `briefInput`, are routed to `buildWhatNextAnswer`.
3. **Brief third** — Cases with `briefInput` are routed to `buildDirectorBrief`.
4. **Fallback** — Unrecognised shapes return `passed: true` with a details note.

**Why tool routing must be first:** Cases with a `pathname` and no `briefInput` match the what-next condition even when they are tool routing cases. Putting tool routing first prevents fake pass results — a case with `expected.canExecute: false` that accidentally routed to what-next would pass without ever checking the safety assertion.

---

## Scoring behavior

- No scoring aggregation is built into V1. `runAllEvals()` returns a flat array.
- Callers may compute pass rate as `results.filter(r => r.passed).length / results.length`.
- `details` strings include the actual engine output for debugging failed cases.
- A case with no applicable assertions returns `passed: true` and notes "No assertions applicable" — these are placeholders, not validated evals.

---

## Safety checks

- The harness calls `routeDonnaAction` with tool IDs that include `send_parent_message_direct`. The router returns `canExecute: false` for this tool — **no message is sent**. The harness only inspects the routing decision object.
- `buildWhatNextAnswer` and `buildDirectorBrief` are read-only, deterministic functions. They return answer objects — no mutations.
- No `proposed_actions` records are created during eval runs.
- No `audit_log` entries are written.

---

## What is measured vs not measured

**Measured in V1:**
- Director what-next highlight target accuracy
- Coach what-next highlight target accuracy
- Director brief priority surfacing (top priority targetId and text)
- Tool routing canExecute decisions (allow vs block)
- Role-scoped blocking (coach cannot perform director-only actions)

**Not measured in V1 (V2 path):**
- `safetyLevel` field in expected — defined on the case struct but not asserted by the runner
- Parent and player role what-next cases
- Multi-turn conversation flows
- Edge cases with all liveCtx signals simultaneously active
- Platform owner role cases
- Regression detection across sprints (no CI integration)

---

## No mutation guarantee

This module:
- Makes zero database calls.
- Creates zero `proposed_actions` records.
- Writes zero `audit_log` entries.
- Sends zero communications.
- Does not touch player, curriculum, attendance, or billing records.
- Does not modify any DONNA state or session memory.

All functions called (`buildWhatNextAnswer`, `buildDirectorBrief`, `routeDonnaAction`) are themselves read-only and deterministic.

---

## V2 path

Future sprints may:
- Add assertion support for `safetyLevel` by mapping `RoutingOutcome` values to human-readable safety level labels.
- Add parent and player role eval cases.
- Add a `scorecard()` helper that returns overall pass rate, per-category breakdown, and regression delta.
- Add CI integration so evals run on every push and block merges when safety cases regress.
- Add fixture snapshots so eval outputs can be compared to a known-good baseline.
