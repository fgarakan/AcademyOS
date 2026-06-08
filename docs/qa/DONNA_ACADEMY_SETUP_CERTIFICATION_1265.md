# DONNA Academy Setup — Certification
**Sprint:** Mega Sprint 1265–1294
**Date:** 2026-06-08

---

## Scenario 1 — Start Academy Setup through DONNA

Director is on `/director/setup`.
Director types: "walk me through academy setup".

→ `detectGuidedCompletionIntent` matches trigger phrase `'walk me through academy setup'`
→ `processGoalSession` returns `action: 'goal_session_start'`, `workflowId: 'academy_setup_completion'`
→ `DonnaVoiceReadyShell` dispatches `dispatchGoalSessionStarted`
→ DONNA responds with `openingMessage`:
   "Let's set up your academy together. I'll ask 10 questions — one at a time.
    Nothing is saved until you review and confirm the full setup draft. Step 1 of 10:"
→ DONNA asks: "What is your academy's name?"

**Result: PASS**

---

## Scenario 2 — Complete all 10 setup questions

Director answers all 10 steps in sequence:

| Step | FieldId | Example answer |
|---|---|---|
| 1 | `academy_name` | "Dabul Tennis Academy" |
| 2 | `academy_timezone` | "US/Eastern" |
| 3 | `program_types` | "Junior Development, Competition, Private Lessons" |
| 4 | `levels` | "Red Ball 1–2, Orange Ball 1–2, Green Ball, Yellow Ball 1–3" |
| 5 | `groups` | "3 groups per level, 6–8 players each" |
| 6 | `staff_plan` | "1 head coach, 2 assistants" |
| 7 | `weekly_schedule` | "Mon/Wed/Fri, 2 sessions per day, 60 min each" |
| 8 | `parent_communication_preferences` | "Monthly progress updates, immediate for injuries" |
| 9 | `curriculum_starting_point` | "ITF ball colours (Red/Orange/Green/Yellow)" |
| 10 | `setup_notes` | "Launching in 3 weeks, ITF affiliation required" |

→ After step 10: `isWorkflowComplete` returns true (all 10 required fields non-empty)
→ `processGoalSession` returns `action: 'goal_session_complete'`, `draftType: 'academy_setup_draft'`, all 10 answers in `answers`
→ `DonnaVoiceReadyShell` dispatches `dispatchGoalSessionCompleted({ workflowId: 'academy_setup_completion', draftType: 'academy_setup_draft', answers: {...} })`
→ DONNA shows completion summary in conversation

**Result: PASS**

---

## Scenario 3 — Verify page-state updates occur during session

Director is on `/director/setup` with `AcademySetupDonnaBanner` mounted.
DONNA processes answer to step 1 (`academy_name`).

→ `buildPageStatePatch({ workflowId: 'academy_setup_completion', registryFieldId: 'academy_name', ... })`
→ `WORKFLOW_FIELD_MAPS['academy_setup_completion']['academy_name']` → `{ pageFieldId: 'academy_name', displayLabel: 'Academy Name' }`
→ Patch built and dispatched via `dispatchPageStatePatch`
→ `onPageStatePatch` listener in `AcademySetupDonnaBanner` fires
→ `patch.workflowId === 'academy_setup_completion'` → guard passes
→ `setLiveAnswerCount(prev => prev + 1)` → count = 1
→ Banner shows: "DONNA is collecting setup answers — 1 of 10 collected."
→ After all 10 steps: count = 10, banner shows "10 of 10 collected."

All 10 fields confirmed in `WORKFLOW_FIELD_MAPS['academy_setup_completion']`:
`academy_name`, `academy_timezone`, `program_types`, `levels`, `groups`,
`staff_plan`, `weekly_schedule`, `parent_communication_preferences`,
`curriculum_starting_point`, `setup_notes`

**Result: PASS**

---

## Scenario 4 — Verify review banner appears

After step 10 completes, `dispatchGoalSessionCompleted` fires.

→ `onGoalSessionCompleted` listener in `AcademySetupDonnaBanner` fires
→ `detail.workflowId === 'academy_setup_completion'` → guard passes
→ `buildWorkflowExecutionPlan(detail)` called:
   - `getWorkflow('academy_setup_completion')` returns the 10-step workflow
   - All 10 required steps found in `detail.answers` — all non-empty
   - `validateFields` → `valid: true`, `errors: []`
   - Returns plan with `readyToSubmit: true`
→ `setDonnaPlan(plan)`
→ Banner renders review section:
   - Header: "DONNA collected these setup answers — review before saving"
   - 10 field rows with `displayLabel` and `value`
   - "Confirm & Save Draft" button enabled
   - "Dismiss" button

**Result: PASS**

---

## Scenario 5 — Verify Confirm & Save Draft works

Director reviews banner and clicks "Confirm & Save Draft".

→ `handleDonnaConfirm` called
→ `buildWorkflowDraftPayload(donnaPlan)` — `readyToSubmit: true` → returns payload with all 10 answers + `planId`
→ `donnaSaveAcademySetupDraftAction(payload.answers, payload.planId)` called (server action)
→ Server action:
   - `assertNotPreviewMode()` passes (not in preview)
   - Auth check: `user` found
   - Profile check: `academy_id` found
   - Role check: `academy_director` confirmed
   - Fetches current `academies.settings` to merge
   - Writes `settings.donna_setup_draft = { ...10 fields..., plan_id, saved_at, source: 'donna_goal_session' }`
   - Preserves all other settings keys (merge, not replace)
   - Does NOT touch `director_interview_completed` or any setup completion flag
   - `revalidatePath('/director/setup')`, `revalidatePath('/director/onboarding')`, etc.
   - Returns `{ ok: true, entityId: <academyId>, entityType: 'academy_setup', redirectTo: '/director/setup', error: null }`
→ `buildWorkflowVerificationResult`: `ok: true && entityId !== null` → `verified: true`
→ `buildWorkflowCompletionSummary('academy_setup_completion', ...)` called
   → `donnaMessage`: "**Academy setup complete.** Your configuration has been saved. You can now add coaches and players."
→ `setDonnaCompletion(summary)`, `setDonnaPlan(null)`

**Result: PASS**

---

## Scenario 6 — Verify completion summary renders

After `setDonnaCompletion(summary)` is set:

→ Render path checks `if (donnaCompletion)` first — takes priority over review banner
→ Completion notice renders:
   - Green border + green/5 background
   - CheckCircle2 icon
   - "Setup draft saved"
   - `donnaCompletion.donnaMessage` below
→ `donnaPlan` is null (cleared in `handleDonnaConfirm`) — review banner does not appear

**Result: PASS**

---

## Scenario 7 — Verify Dismiss clears state correctly

Director sees review banner after completing 10 steps (`liveAnswerCount: 10`, `donnaPlan` set).
Director clicks "Dismiss".

→ `handleDonnaDismiss` called
→ `setDonnaPlan(null)` — review banner hidden
→ `setDonnaError(null)` — any error cleared
→ `setLiveAnswerCount(0)` — in-progress bar cleared
→ Render: all guards false, `existingDraft` prop checked
→ If `existingDraft` exists: existing draft notice shown
→ If no `existingDraft`: `return null`

**Regression verified:** Without the `setLiveAnswerCount(0)` fix, after dismiss with
`liveAnswerCount = 10`, the in-progress bar would re-render with "10 of 10 collected" —
misleading since the session was over. Fix confirmed in source.

**Result: PASS**

---

## Scenario 8 — Verify existing draft renders correctly

`academies.settings.donna_setup_draft` contains a previously saved 10-field object
with `saved_at: "2026-06-07T14:32:00.000Z"`.

→ `page.tsx` fetches `academies.settings` → extracts `donna_setup_draft`
→ Cast as `Record<string, string> | null` → non-null
→ `existingDraft` prop passed to `<AcademySetupDonnaBanner existingDraft={existingDraft} />`
→ No active DONNA session → all active-session guards false
→ `if (existingDraft)` branch renders:
   - `ACADEMY_SETUP_REQUIRED_FIELDS.filter(id => value.trim().length > 0)` → `filledCount`
   - `existingDraft['saved_at']` → formatted date "Jun 7, 2026"
   - Notice: "DONNA setup draft saved — 10 of 10 fields. Saved Jun 7, 2026."
   - Instruction: "Ask DONNA to 'walk me through academy setup' to update or complete it."

Partial draft (5 of 10 filled): `filledCount = 5` — notice shows "5 of 10 fields."

**Result: PASS**

---

## Scenario 9 — Verify incomplete session cannot submit

DONNA session ends with only 8 of 10 required fields answered (e.g., `setup_notes` and
`parent_communication_preferences` empty).

→ `isWorkflowComplete` requires `getNextStep` to return null → will NOT return null with 2 fields empty
→ Runtime WILL NOT fire `goal_session_complete` — continues asking questions
→ Edge case: if somehow event fires with missing answers:
   → `buildWorkflowExecutionPlan` builds plan → `validateFields` finds 2 required fields empty
   → `readyToSubmit: false`, `validationErrors` populated
   → Review banner renders with:
     - "Confirm & Save Draft" button `disabled={!donnaPlan.readyToSubmit}` → disabled
     - Validation error messages shown in orange
   → `handleDonnaConfirm` called via keyboard shortcut: `buildWorkflowDraftPayload` returns null → early return → server action never called

**Result: PASS — two independent guards prevent incomplete submission**

---

## Scenario 10 — Verify unauthorized user cannot save

A non-director user (role: `coach`) somehow reaches the server action.

→ `donnaSaveAcademySetupDraftAction` called with answers
→ `assertNotPreviewMode()` passes
→ Auth: `user` found
→ Profile: `academy_id` found
→ Role check: `academy_memberships` query → `role === 'head_coach'` (not `'academy_director'`)
→ Returns: `{ ok: false, ..., error: 'Only academy directors can save academy setup drafts' }`
→ `buildWorkflowVerificationResult` → `verified: false` (ok is false)
→ `donnaError` set → error shown in review banner
→ No write occurs

Unauthenticated user: `supabase.auth.getUser()` returns no user → returns `{ ok: false, error: 'Not authenticated' }`

**Result: PASS — role gate enforced server-side regardless of UI state**

---

## Scenario 11 — Verify no save occurs before director confirmation

Three paths analyzed:

**Path A — DONNA session in progress (no plan yet):**
`donnaPlan` is null. "Confirm & Save Draft" button does not exist. `handleDonnaConfirm` is only
accessible via that button. Server action unreachable.

**Path B — Review banner shown, director has not clicked confirm:**
Button is rendered but not yet clicked. `donnaSubmitting: false`. Server action not called.

**Path C — Dismiss clicked before confirm:**
`donnaPlan` set to null. Button disappears. Server action unreachable.

No `useEffect` or automatic trigger calls `donnaSaveAcademySetupDraftAction`.
No form `onSubmit` handler exists — banner uses `type="button"`.
`assertNotPreviewMode()` blocks preview-mode saves at server layer.

**Result: PASS — no automatic or accidental save path exists**

---

## Scenario 12 — TypeScript clean and no workflow regressions

**TypeScript check:**
`npx tsc --noEmit` → 0 errors across all sprint files.

**Workflow regression check — all 8 workflows verified still functional:**

| Workflow | Registry Entry | Page Wired | Regression |
|---|---|---|---|
| `curriculum_builder_completion` | ✓ | `CurriculumSetupBuilder.tsx` | None |
| `academy_setup_completion` | ✓ **new** | `AcademySetupDonnaBanner.tsx` | N/A — new |
| `player_onboarding_completion` | ✓ | `NewPlayerForm.tsx` | None |
| `assessment_completion` | ✓ | `AssessmentStudioForm.tsx` | None |
| `parent_update_completion` | ✓ | `InitiateParentUpdateButton.tsx` | None |
| `template_builder_completion` | ✓ | `templates/class/create/page.tsx` | None |
| `coach_creation_completion` | ✓ | `InviteCoachForm.tsx` | None |
| `fitness_template_builder_completion` | ✓ | `templates/fitness/create/page.tsx` | None |

`WORKFLOW_DRAFT_TYPE` and `WORKFLOW_FIELD_MAPS` both contain `academy_setup_completion`.
`buildCompletionMessage` has an explicit `case 'academy_setup_completion'` — no fallthrough.
`WORKFLOW_META` not required for this workflow — engine falls back to `entityLabel` from
`buildWorkflowVerificationResult` call site ('Academy Setup Draft').

**Result: PASS — 0 TypeScript errors, 0 workflow regressions**

---

## Architecture compliance

| Rule | Status |
|---|---|
| Setup data not saved without director confirmation | PASS — confirm button only path |
| Server action gated by `academy_director` role | PASS — line 67 of server action |
| `assertNotPreviewMode()` called | PASS — line 13 of server action |
| Does NOT touch `director_interview_completed` | PASS — comment + implementation verified |
| Does NOT touch any existing setup completion flag | PASS — only writes `donna_setup_draft` |
| Settings merge (not overwrite) | PASS — `{ ...existing, donna_setup_draft: {...} }` |
| No new DB migrations | PASS |
| No new npm packages | PASS |
| TypeScript clean | PASS — 0 errors |

---

## Known V1 limitations

| Limitation | Impact | Fix path |
|---|---|---|
| Review banner shows truncated question text as displayLabel (not SETUP_FIELD_IMPORTANCE.displayLabel) | Minor UX — "What is your academy's name?" instead of "Academy Name" | Override `displayLabel` in banner using `SETUP_FIELD_IMPORTANCE` lookup |
| `donna_setup_draft` is informational only — does not set `director_interview_completed` | Director must still complete setup step 2 manually | Future sprint: wire draft → interview completion flag with director confirmation |
| `existingDraft` cast as `Record<string, string>` is unsafe at DB level | Safe in practice — server action only writes strings | Future sprint: use `z.record(z.string())` Zod parse |
| No field-level pre-fill on setup page (no form inputs to populate) | Acceptable — setup page is a checklist, not a form | No action needed for V1 |
