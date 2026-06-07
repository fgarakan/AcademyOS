# DONNA Page State Synchronization — Architecture
**Sprint 934–963C — Page State Sync V1**
**Date: 2026-06-07**

---

## Core principle

**Page owns form state. DONNA emits patches. Pages apply them.**

DONNA never mutates a form field directly. DONNA never writes to the database without confirmation. DONNA never auto-saves. DONNA records an answer → returns a `PageStatePatch` → the caller dispatches `donna:page-state-patch` → the page receives the event and updates its own React state.

```
User answers DONNA
  → DonnaVoiceReadyShell calls processGoalSession()
  → processGoalSession records answer + builds PageStatePatch
  → Shell dispatches donna:page-state-patch event
  → Class template page receives event
  → Page calls setState (setTemplateName / setSelectedLevel)
  → Field updates visibly on screen
  → DONNA asks next question
```

---

## 1. PageStatePatch contract

```typescript
interface PageStatePatch {
  patchId:          string             // Unique ID for deduplication
  workflowId:       string             // Originating guided workflow
  route:            string             // Target page route
  fieldId:          string             // Page-native field identifier
  registryFieldId:  string             // Registry step fieldId (source)
  value:            string             // Director's raw answer
  displayLabel:     string             // Human label ("Template Name")
  validationStatus: 'valid' | 'invalid' | 'pending'  // Runtime: always 'pending'
  source:           'donna_goal_session'
  timestamp:        number
}
```

**`fieldId`** is what the receiving page understands — decoupled from the registry's internal `registryFieldId`. Pages never need to import from the guided completion registry.

**`validationStatus: 'pending'`** from the runtime. The page sets `'valid'` or `'invalid'` after applying the value to its own validation logic.

---

## 2. Browser event contract

```
donna:page-state-patch       // One answer → one field patch
donna:goal-session-started   // Workflow opened, Step 1 asked
donna:goal-session-completed // All steps done, draft summary shown
```

All events are dispatched on `window` with `bubbles: false`. Pages listen with `window.addEventListener`. The events do NOT bubble — the page must be mounted and listening to receive them.

### Dispatch timing

Events are dispatched inside the surface's `setTimeout(..., 400)` callback — after the DONNA message is rendered and state is updated. This ensures the page event listener receives the patch after the UI has settled.

---

## 3. Workflow field maps

The field map lives in `donnaPageStateSync.ts` and translates from the guided completion registry's `registryFieldId` to the page's `fieldId`:

```
template_builder_completion:
  template_purpose → template_name   ("Template Name")
  target_level     → level           ("Curriculum Level")
  session_duration → duration        ("Session Duration")
  session_focus    → objective       ("Session Focus")
  block_structure  → skill_block     ("Block Structure")
  key_drills       → coach_notes     ("Key Drills")

player_onboarding_completion:
  player_name       → player_name   ("Player Name")
  recommended_level → level         ("Curriculum Level")
  assigned_coach    → coach         ("Assigned Coach")
  ...

assessment_completion:
  player_name        → player_name  ("Player")
  assessment_domain  → domain       ("Assessment Domain")
  observation        → observation  ("Observation")
  ...

parent_update_completion:
  player_name   → player_name   ("Player")
  main_message  → main_message  ("Main Message")
  ...

curriculum_builder_completion:
  level_name  → level_name  ("Level Name")
  level_goal  → level_goal  ("Level Goal")
  ...

academy_setup_completion:
  academy_name → academy_name ("Academy Name")
  first_coach  → first_coach  ("First Coach")
  ...
```

Fields with no mapping entry produce `null` from `buildPageStatePatch()` — the surface skips the dispatch for that step.

---

## 4. Runtime integration

### Where patches are built

`donnaGoalSessionRuntime.ts` builds the patch inside the `goal_session_step` handler, immediately after `recordAnswer()`:

```typescript
const patch = buildPageStatePatch({
  workflowId:      existingSession.workflowId,
  route:           input.currentRoute,
  registryFieldId: currentStepDef.fieldId,
  value:           input.userMessage,
})
```

`patch` is included in `GoalSessionResult.pageStatePatch`. The runtime never dispatches it.

### Where patches are dispatched

`DonnaVoiceReadyShell.tsx` receives the result and dispatches:

```typescript
if (goalResult.pageStatePatch) {
  dispatchPageStatePatch(goalResult.pageStatePatch)
}
```

This happens inside the `setTimeout(..., 400)` block after rendering the DONNA message — after the UI has settled.

### Runtime purity

`processGoalSession()` has zero browser API side effects. It reads from `sessionStorage` (via `guidedCompletionSessionMemory`) and returns data. The caller owns dispatch.

---

## 5. First target workflow — Class Template Creation

**Route:** `/director/templates/class/create`
**Trigger phrases:** "build a class template", "template builder", "help me create a class template"
**Page:** `src/app/director/templates/class/create/page.tsx`

### Field wiring (Sprint 934C)

| Registry fieldId | Page fieldId | Page state | Visibly patched |
|---|---|---|---|
| `template_purpose` | `template_name` | `templateName` (string) | Yes — text input at top |
| `target_level` | `level` | `selectedLevel` (string) | Yes — level grid + indicator |
| `session_focus` | `objective` | `selectedGoal` (string) | Yes — sets goal state |
| `session_duration` | `duration` | (not wired — future) | Contract only |
| `block_structure` | `skill_block` | (not wired — future) | Contract only |
| `key_drills` | `coach_notes` | (not wired — future) | Contract only |

### DONNA sync indicator

When a field is patched by DONNA, a small indicator appears next to the field label:
```
✦ Set by DONNA
```
This indicator uses `donnaSyncedFields: Set<string>` state on the page. Once set, it persists until the page unmounts (not cleared on manual edit — director can still override the value freely).

### Page event listener

```typescript
useEffect(() => {
  return onPageStatePatch(patch => {
    if (!patch.route.includes('/templates')) return
    setDonnaSyncedFields(prev => new Set(prev).add(patch.fieldId))
    switch (patch.fieldId) {
      case 'template_name': setTemplateName(patch.value); break
      case 'level':         setSelectedLevel(patch.value); break
      case 'objective':     setSelectedGoal(patch.value); break
    }
  })
}, [])
```

The route filter (`patch.route.includes('/templates')`) prevents patches from another workflow leaking into this page.

---

## 6. Approval and safety guarantees

| Rule | Implementation |
|---|---|
| No hidden save | `handleSaveDraft()` is only called by director button click — never from event handler |
| No mutation without confirmation | Page state updates are display-only; DB write requires explicit save action |
| Director can override any patched field | All patched values go into React state — the director edits them freely |
| DONNA sync indicator is informational only | `donnaSyncedFields` tracks display state only, not validation |
| No auto-advance on patch | Page step does not auto-advance when level is patched — director controls navigation |

---

## System gaps (not fixed in Sprint 934C)

| Gap | Description | Fix path |
|---|---|---|
| `duration` not wired | Session duration is the sum of block durations — not a direct string input | Sprint 934D: wire to a standalone duration selector |
| `skill_block` / `block_structure` not wired | Block structure is a `Block[]` array, not a string | Sprint 934D: parse DONNA's answer into block array |
| Auto-advance step | After DONNA patches `level`, the page could auto-advance to Step 2 | Sprint 934D: detect step advancement in patch handler |
| DonnaAssistantButton not wired | Goal session sync only fires from DonnaVoiceReadyShell sidebar | Sprint 934D: add processGoalSession to DonnaAssistantButton |
| Other pages | Player onboarding, assessment, parent update pages not yet listening | Sprint 934D+ per workflow |

---

*Runtime: `src/lib/donna/goalSessions/donnaGoalSessionRuntime.ts`*
*Sync contract: `src/lib/donna/pageSync/donnaPageStateSync.ts`*
*Events: `src/lib/donna/pageSync/donnaPageSyncEvents.ts`*
*Target page: `src/app/director/templates/class/create/page.tsx`*
