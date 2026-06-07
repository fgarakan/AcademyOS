# DONNA Page State Synchronization — Certification
**Sprint 934–963C — Page State Sync V1**
**Date: 2026-06-07**

---

## Certification scope

Verifies that the page state sync system correctly:
- Produces `PageStatePatch` objects from goal session answers
- Dispatches `donna:page-state-patch` browser events from the surface
- Updates the class template page's `templateName` and `selectedLevel` states
- Shows "Set by DONNA" indicators on patched fields
- Does not save, send, or mutate data without explicit director action
- Handles route filtering (patches only apply to matching pages)

---

## Scenario 1 — Class Template Name: DONNA fills the field

**Flow:** Director says "create a class template" → DONNA asks for template name → Director answers → template name field updates on page.

**Input:**

| Turn | Surface input | currentRoute |
|---|---|---|
| 1 | "create a class template" | `/director` |
| 2 | "Orange Ball 2 — Forehand Focus" | `/director/templates/class/create` |

**Expected at Turn 1:**
- `processGoalSession()` returns `action: goal_session_start`
- `workflowId: template_builder_completion`
- `navigateTo: /director/templates`
- `pageStatePatch: null` (no answer recorded yet)
- `donna:goal-session-started` event dispatched

**Expected at Turn 2:**
- `processGoalSession()` returns `action: goal_session_step`
- `pageStatePatch.fieldId: 'template_name'`
- `pageStatePatch.registryFieldId: 'template_purpose'`
- `pageStatePatch.value: 'Orange Ball 2 — Forehand Focus'`
- `pageStatePatch.source: 'donna_goal_session'`
- `donna:page-state-patch` event dispatched
- Page receives event → `setTemplateName('Orange Ball 2 — Forehand Focus')`
- Template name input shows "Orange Ball 2 — Forehand Focus"
- "Set by DONNA" indicator appears next to "Template Name" label

**PASS criteria:**
- [x] `patch.fieldId === 'template_name'` (not `template_purpose` — page-native ID)
- [x] `patch.registryFieldId === 'template_purpose'` (registry ID preserved for tracing)
- [x] `patch.validationStatus === 'pending'` (page validates, not runtime)
- [x] `patch.source === 'donna_goal_session'`
- [x] `donnaSyncedFields.has('template_name')` → indicator rendered
- [x] Director can edit the field freely after DONNA sets it
- [x] No save triggered — field update is display state only

---

## Scenario 2 — Class Template Level: DONNA selects the curriculum level

**Flow:** After template name (Step 1 of registry), DONNA asks for session duration (Step 2), then session focus (Step 3), block structure (Step 4), key drills (Step 5), then curriculum level (Step 6, `target_level`) → page updates `selectedLevel`.

**Note:** In the `template_builder_completion` workflow, `target_level` is Step 6 (the last required step). The level patch arrives after the first 5 steps are answered.

**Input (abbreviated — Steps 1–5 already answered):**

| Turn | Input | registryFieldId answered |
|---|---|---|
| 1 | "create a class template" | — |
| 2 | "Orange Ball 2 — Forehand Focus" | `template_purpose` → `template_name` |
| 3 | "75 minutes" | `session_duration` → `duration` |
| 4 | "Forehand consistency from the baseline" | `session_focus` → `objective` |
| 5 | "warm-up, technical, match play, cool-down" | `block_structure` → `skill_block` |
| 6 | "cone target feed, cross-court rally, down-the-line" | `key_drills` → `coach_notes` |
| 7 | "Orange Ball 2" | `target_level` → `level` |

**Expected at Turn 7:**
- `processGoalSession()` returns `action: goal_session_complete`
- `pageStatePatch.fieldId: 'level'`
- `pageStatePatch.value: 'Orange Ball 2'`
- `donna:page-state-patch` dispatched
- Page receives event → `setSelectedLevel('Orange Ball 2')`
- Level grid highlights "Orange Ball 2"
- "Set by DONNA" indicator appears next to "Choose Curriculum Level" heading
- `donna:goal-session-completed` dispatched with `draftType: 'class_template_draft'`

**PASS criteria:**
- [x] `patch.fieldId === 'level'`
- [x] `patch.registryFieldId === 'target_level'`
- [x] `donnaSyncedFields.has('level')` → indicator rendered in Step 1 heading
- [x] `selectedLevel === 'Orange Ball 2'` in page state
- [x] Curriculum preview card appears for Orange Ball 2 (existing page behavior)
- [x] No automatic save — director must click "Save as Draft" on Step 5

---

## Scenario 3 — Route filter: patch from a different workflow ignored

**Setup:** Director starts `player_onboarding_completion` workflow, which patches `fieldId: 'level'` (player's recommended curriculum level). The class template create page is also mounted in a background tab.

**Expected behavior:**
- Patch received by class template page
- `patch.route` is `/director/players` (player onboarding route)
- Page checks `if (!patch.route.includes('/templates')) return`
- Patch silently ignored — `selectedLevel` and `donnaSyncedFields` unchanged

**PASS criteria:**
- [x] Route filter prevents cross-workflow state contamination
- [x] `donnaSyncedFields` not updated for foreign patches
- [x] `selectedLevel` unchanged

---

## Scenario 4 — No sidebar storage: answers live in sessionStorage, not sidebar

**Verification:** The guided completion session state is stored in sessionStorage under `donna_guided_completion_v1`. The sidebar chat messages contain the Q&A history for display only. No answers are persisted in the sidebar's React state as form data.

**Expected behavior:**

| Storage location | What it stores | Persistent? |
|---|---|---|
| `sessionStorage['donna_guided_completion_v1']` | Active workflow answers | Until tab closes or 4h TTL |
| Sidebar `messages` state | Q&A conversation for display | Until unmount |
| Class template page React state | `templateName`, `selectedLevel` | Until page unmount |
| Database | Nothing | Only after explicit Save Draft action |

**PASS criteria:**
- [x] No form data stored inside the sidebar component state
- [x] No auto-save to Supabase during Q&A loop
- [x] `processGoalSession()` returns patches; caller dispatches — no direct DOM mutation inside runtime

---

## Scenario 5 — No save without confirmation

**Flow:** Director answers all 6 template builder steps. DONNA shows the draft completion summary. The page receives the final `goal_session_complete` patch (for `level`). Director does NOT click "Save as Draft."

**Expected state:**
- All patches applied to page state
- Draft summary shown in sidebar chat
- `donna:goal-session-completed` event fired
- `saveStatus` remains `'idle'`
- Nothing written to `template_review_requests` table
- No call to `saveClassTemplateDraftFromWizardAction`

**PASS criteria:**
- [x] `handleSaveDraft()` is only triggered by director button click
- [x] Event handler (`onPageStatePatch`) never calls `handleSaveDraft()`
- [x] `saveStatus === 'idle'` after all patches arrive without director action
- [x] Page can be navigated away from — no orphaned data

---

## Scenario 6 — Director overrides DONNA's answer

**Setup:** DONNA patches `template_name: 'Orange Ball 2 — Forehand Focus'`. Director edits the input to `'Orange Ball 2 — Net Approach'`.

**Expected behavior:**
- Input updates normally via `onChange`
- `setTemplateName('Orange Ball 2 — Net Approach')`
- `donnaSyncedFields.has('template_name')` remains `true` (indicator stays — informational)
- When director saves, `templateName = 'Orange Ball 2 — Net Approach'` is used

**PASS criteria:**
- [x] DONNA patch is treated as a suggestion — director can always override
- [x] No re-patch: DONNA does not re-write the field on subsequent messages
- [x] Indicator does not disappear on edit (it's informational, not a lock)

---

## Event contract summary

| Event | When dispatched | Payload |
|---|---|---|
| `donna:goal-session-started` | On `goal_session_start` action | `{ workflowId, route, label }` |
| `donna:page-state-patch` | On `goal_session_step` or `goal_session_complete` when patch is non-null | `PageStatePatch` |
| `donna:goal-session-completed` | On `goal_session_complete` action | `{ workflowId, draftType, answers }` |

---

## Field sync coverage (Sprint 934C)

| Field | Type | Wired | Indicator | Save wired |
|---|---|---|---|---|
| `template_name` | Text input | Yes | Yes | Yes (passed to action) |
| `level` | Selection grid | Yes | Yes | Yes (existing: `selectedLevel` → action) |
| `objective` | Selection list | Yes (setState) | No visual indicator | Yes (existing: `selectedGoal` → action) |
| `duration` | Derived from blocks | No | — | Not applicable |
| `skill_block` | Block array | No | — | Not applicable |
| `coach_notes` | Not in current form | No | — | Not applicable |

---

## Build classification

| Category | Status |
|---|---|
| `PageStatePatch` contract | Built — `donnaPageStateSync.ts` |
| Browser event contract | Built — `donnaPageSyncEvents.ts` |
| Runtime patch generation | Built — `donnaGoalSessionRuntime.ts` returns `pageStatePatch` |
| Surface dispatch | Built — `DonnaVoiceReadyShell.tsx` dispatches on goal session step |
| Class template page listener | Built — `useEffect` with `onPageStatePatch` |
| Template name field | Built — visible text input, DONNA sync indicator |
| Level field indicator | Built — "Set by DONNA" indicator in Step 1 heading |
| Template name → save action | Built — `templateName` passed to `saveClassTemplateDraftFromWizardAction` |
| TypeScript | Clean — 0 errors |

---

**Certification status:** All 6 scenarios defined and traceable to implementation. PageStatePatch contract verified. Browser event contract verified. No hidden save. No mutation without confirmation. Director always owns the final state.
