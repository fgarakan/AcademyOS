# DONNA Workflow Execution Engine — Certification
**Sprint:** Mega Sprint 1055–1084
**Date:** 2026-06-08
**Engine file:** `src/lib/donna/workflows/donnaWorkflowExecutionEngine.ts`

---

## Certification scope

This document certifies the correctness of the engine's type contracts, factory functions, and lifecycle invariants. Certification is based on static analysis and scenario walkthroughs. No runtime tests.

---

## Scenario A — Full lifecycle: player creation

**Input:**
```typescript
const detail: GoalSessionCompletedDetail = {
  workflowId: 'player_onboarding_completion',
  draftType:  'player_profile_draft',
  answers: {
    player_name:       'Jamie Torres',
    player_age:        '10',
    recommended_level: 'Orange Ball 2',
    assigned_coach:    'Coach Sarah',
    assigned_group:    'Tuesday 4pm',
    parent_contact:    'Maria Torres — maria@example.com',
  },
}
```

**Step 1: buildWorkflowExecutionPlan(detail)**
- Fetches `player_onboarding_completion` from registry: 6 required steps + 1 optional
- Builds 7 `WorkflowFieldSummary` entries
- All 6 required fields have non-empty values → `filled: true`
- `readyToSubmit: true`
- `validationErrors: []`
- `planId: "wep_<timestamp>_<n>"` — unique

**Result: PASS**

---

**Step 2: validateWorkflowDraft(plan)**
- All 6 required fields filled
- `valid: true`, `errors: []`, `missingFields: []`

**Result: PASS**

---

**Step 3: buildWorkflowDraftPayload(plan)**
- `plan.readyToSubmit === true` → proceeds
- Returns `WorkflowDraftPayload` with all answers, planId, `directorConfirmedAt: now`
- `directorConfirmedAt` is a new timestamp (not builtAt) — confirms director acted

**Result: PASS**

---

**Step 4: Server action (page-owned — not tested here)**
- Page calls `createPlayerAction(payload.answers)`
- Action returns `{ id: 'player_abc123', error: null }`

---

**Step 5: buildWorkflowVerificationResult(submitResult)**
```typescript
const submitResult: WorkflowSubmitResult = {
  ok:         true,
  entityId:   'player_abc123',
  entityType: 'player',
  redirectTo: '/director/players/player_abc123/onboard',
  error:      null,
}
```
- `ok: true` AND `entityId !== null` → `verified: true`
- `entityExists: true`
- `checkPath: '/director/players/player_abc123/onboard'`
- `failureReason: null`

**Result: PASS**

---

**Step 6: buildWorkflowCompletionSummary**
```typescript
buildWorkflowCompletionSummary(
  'player_onboarding_completion',
  verification,
  detail.answers,
)
```
- `donnaMessage` contains "Jamie Torres has been added" (uses `player_name` from answers)
- `entityPath: '/director/players/player_abc123/onboard'`
- `nextSuggestedAction: 'Complete player onboarding'`
- `nextSuggestedRoute: '/director/players'`

**Result: PASS**

---

## Scenario B — Missing required field

**Input:** `player_onboarding_completion` answers but `parent_contact` is empty string `''`

**Step 1: buildWorkflowExecutionPlan**
- `parent_contact` field: `filled: false`, `required: true`
- `readyToSubmit: false`
- `validationErrors: ['"Is there a parent to link?..." is required but has no answer.']`

**Step 2: buildWorkflowDraftPayload(plan)**
- `plan.readyToSubmit === false` → returns `null`
- Server action is NOT called

**Guarantee verified:** Director cannot submit without all required fields filled.

**Result: PASS**

---

## Scenario C — Server action fails

**Input:** `player_onboarding_completion`, all fields filled, plan built successfully

**Server action result:**
```typescript
const submitResult: WorkflowSubmitResult = {
  ok:         false,
  entityId:   null,
  entityType: 'player',
  redirectTo: null,
  error:      'Academy context unavailable',
}
```

**buildWorkflowVerificationResult:**
- `ok: false` → `verified: false`
- `entityExists: false`
- `failureReason: 'Academy context unavailable'`
- `checkPath: null`

**buildWorkflowCompletionSummary** not called — page shows error state instead.

**Result: PASS** — failure path is correctly identified without crashing.

---

## Scenario D — Unknown workflow ID

**Input:**
```typescript
const detail = {
  workflowId: 'coach_creation_completion', // not in registry
  draftType: 'coach_draft',
  answers: {},
}
```

**buildWorkflowExecutionPlan(detail):**
- `getWorkflow('coach_creation_completion')` returns `null`
- Engine returns `null`
- Page receives `null` and does not show the review banner

**Result: PASS** — unknown workflows are silently ignored. No crash.

---

## Scenario E — Template creation (only workflow with existing wiring)

**Input:** `template_builder_completion` with all 6 fields answered

**buildWorkflowExecutionPlan:**
- 6 required steps + 1 optional = 7 field summaries
- All 6 required filled → `readyToSubmit: true`

**buildWorkflowCompletionSummary:**
- `donnaMessage`: "Template saved. '[template_purpose]' is now in your template library."
- `nextSuggestedAction: 'View templates'`
- `nextSuggestedRoute: '/director/class-templates'`

**Result: PASS**

---

## Scenario F — Plan ID uniqueness

**Three plans built in sequence:**
- Plan 1: `wep_<t>_1`
- Plan 2: `wep_<t>_2`
- Plan 3: `wep_<t>_3`

`_planCounter` increments monotonically across calls. No two plans share a planId within a session.

**Result: PASS**

---

## Scenario G — directorConfirmedAt timestamp

**Timing:**
- `buildWorkflowExecutionPlan` called at T=0 → `builtAt: T`
- Director reviews for 45 seconds
- `buildWorkflowDraftPayload` called at T=45s → `directorConfirmedAt: T+45s`

`directorConfirmedAt > builtAt` always — confirms that the director had time to review.

**Result: PASS**

---

## Scenario H — formatWorkflowReviewBanner output

**Input:** Template plan with all 6 fields filled

**Output:**
```
**Class Template Builder — Ready to Save**

**What is this template for? (e.g. Orange Ball 2...:** Orange Ball 2 — skills session
**How long is this session? (45 / 60 / 90 minutes):** 60
**What is the main coaching focus for this template?:** Rally consistency
**What blocks do you want?...:** warm-up, skill, games, cool-down
**What are the 2–3 key drills...?:** Feed rally, cross-court, mini-tennis games
**Which curriculum level is this template designed for?:** Orange Ball 2
```

Labels are truncated to 60 chars (ellipsis at 57). Values are raw director answers.

**Result: PASS**

---

## Invariant table

| Invariant | Code location | Status |
|---|---|---|
| Engine makes no DB calls | No import from supabase or backend | PASS |
| Engine makes no API calls | No fetch, no LLM import | PASS |
| Engine has no React imports | No useState, useEffect, JSX | PASS |
| Engine has no browser APIs | No window, document, localStorage | PASS |
| buildWorkflowDraftPayload returns null when not ready | `if (!plan.readyToSubmit) return null` | PASS |
| buildWorkflowVerificationResult requires entityId | `entityExists = ok && entityId !== null` | PASS |
| buildWorkflowExecutionPlan returns null for unknown workflow | `if (!workflow) return null` | PASS |
| planId is unique per plan | `_planCounter` increments each call | PASS |
| directorConfirmedAt is set at call time | `Date.now()` in buildWorkflowDraftPayload | PASS |

---

## Build classification

| Property | Value |
|---|---|
| New files | 1 (engine) + 2 (docs) |
| Modified files | 0 code files |
| DB migrations | None |
| RLS changes | None |
| New npm packages | None |
| Server actions | None (engine is pure TypeScript) |
| API routes | None |
| UI components | None |
| TypeScript errors | 0 |

---

## What this sprint does NOT build

- No page wiring (no `onGoalSessionCompleted` listener on any page)
- No review banner UI component
- No server action changes
- No DONNA conversation stream integration

All of those are built in subsequent sprints (1085–1114 for player creation, 1115–1144 for coach, 1145–1174 for templates).

---

## Next sprint dependency

Sprint 1085 (Player Creation Completion) will:
1. Import `buildWorkflowExecutionPlan`, `buildWorkflowDraftPayload`, `buildWorkflowVerificationResult`, `buildWorkflowCompletionSummary` from this engine
2. Add `onGoalSessionCompleted` listener to `/director/players/new/page.tsx`
3. Build a `DonnaWorkflowReviewBanner` component that renders `WorkflowExecutionPlan.fields`
4. Wire `createPlayerAction` into the `WorkflowSubmitResult` shape
5. Push `WorkflowCompletionSummary.donnaMessage` to the DONNA conversation stream
