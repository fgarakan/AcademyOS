# DONNA Workflow Guidance + Mission Control V1

**Sprint:** Mega Sprint 2291–2320  
**Date:** 2026-06-14  
**Type:** Implementation + Certification  
**Status:** COMPLETE — TypeScript clean, 10/10 certification

---

## Mission

Transform DONNA from a memory-aware assistant into a workflow-guiding academy COO.

The Director must be able to answer within 5 seconds:
- What am I working on?
- What have I completed?
- What is next?

---

## What Was Built

### Part 2 — Workflow State Engine

**File:** `src/lib/donna/workflow/donnaWorkflowState.ts`

17 workflow types with complete step definitions:

| Type | Steps | Notes |
|---|---|---|
| `academy_setup` | 3 | Identity → Interview → Curriculum |
| `player_onboarding` | 4 | Add → Placement → Curriculum → Session |
| `class_template_creation` | 5 | Name → Focus → Blocks → Fitness → Publish |
| `fitness_template_creation` | 4 | Name → Type → Exercises → Publish |
| `session_creation` | 4 | Template → Schedule → Coach → Confirm |
| `coach_wrap_up_review` | 3 | Open → Review → Approve |
| `player_assessment` | 3 | Open → Assess → Signals |
| `placement_review` | 3 | Open → Review → Confirm |
| `approval_review` | 3 | Open → Review → Complete |
| `curriculum_review` | 4 | Open → Review → Draft → Approve |
| `template_archive` | 2 | Impact → Confirm |
| `template_delete` | 2 | Verify Clear → Confirm |
| `fitness_template_archive` | 2 | Impact → Confirm |
| `fitness_template_delete` | 2 | Verify Clear → Confirm |
| `session_delete` | 2 | Review → Confirm |
| `coach_deactivate` | 3 | History → Reassign → Confirm |
| `player_deactivate` | 3 | History → Archive Sessions → Confirm |

**Persistence:** `donna_working_memory`, key `active_workflow_state`, scope `user`, 7-day TTL.

**Step completion signals:**
- `route_visit` — complete when Director navigates to targetRoute
- `data_present` — complete when entityRefs[dataKey] is set
- `explicit` — complete only on Director confirmation (safe-delete flows)

### Part 3 — Mission Formatter

**File:** `src/lib/donna/workflow/donnaMissionFormatter.ts`

Converts `DonnaWorkflowState` → `FormattedMission`:
- `title` — personalized from entityRefs (e.g., "Green Ball Saturday" not "Create Class Template")
- `completedItems` — human-readable director labels of completed steps
- `nextAction` — single next step label
- `progressPercent` — 0–100
- `continueRoute` — where Director should go next
- `status` — active / paused / blocked

No internal IDs, step IDs, route metadata, or workflow terminology exposed.

### Part 4 — Active Mission System

One active mission at a time. Priority: `active` > `paused`. The system starts when DONNA detects a workflow intent. Replaces nothing — runs alongside all existing DONNA systems.

### Part 5 — Today Page Integration

**File:** `src/app/director/_components/ActiveMissionCard.tsx`  
**Modified:** `src/app/director/page.tsx`

`ActiveMissionCard` appears above fold (above `DonnaCommandBrief`) when an active or paused mission exists. Shows:
- Mission title + progress bar
- Completed items with checkmarks
- Next action with circle indicator
- Continue button → `continueRoute`

Server-rendered (Link-based navigation, no client state).

### Part 6 — Workflow Guidance (DONNA Panel)

**Modified:** `src/components/assistant/DonnaAssistantButton.tsx`

- Workflow intent detected from natural language before existing routing
- One workflow at a time — starting new replaces old (after cancel)
- Cancel/pause/resume/status handled as control intents (separate from draft cancel)
- Route changes automatically advance `route_visit` steps
- Workflow state saved to DB after each state change
- `FormattedMission` injected into every orchestrator call when a workflow is active

### Part 7 — Workflow Confidence

**File:** `src/lib/donna/workflow/donnaWorkflowGuidanceEngine.ts`

| Signal | Confidence |
|---|---|
| DB loaded + route match + entity refs present | 97 |
| DB loaded + route match | 90 |
| DB loaded only | 80 |
| Route match + entity refs | 82 |
| Route match only | 75 |
| In-progress steps (history) | 73 |
| No signals | 65 |

Threshold: **70**. Below 70, step completion is blocked — `shouldAllowStepCompletion()` returns false. This prevents false progress.

### Part 8 — Safe Delete / Archive Flows

`getSafeDeleteGuidance(workflowType, usageCount)` returns:
- `recommendation`: `archive` or `delete`
- `message`: Director-facing guidance with session count
- `requiresHistory`: whether history must be reviewed before confirmation
- `confirmLabel`: button text

Rules:
- Templates used in sessions → `archive` strongly recommended
- Templates with no history → safe `delete` allowed
- Coaches/players → always `archive` (history preserved)
- Sessions → cancel only (history preserved)

### Part 10 — Certification

**File:** `src/lib/donna/workflow/donnaWorkflowCertification.ts`  
**Report:** This document

---

## Certification Results

| Scenario | Title | Pass/Fail |
|---|---|---|
| S1 | Class Template: Start, Leave, Return, Resume | ✅ PASS |
| S2 | Fitness Template: Resume Correctly | ✅ PASS |
| S3 | Player Onboarding: Missing Assessment, One Question | ✅ PASS |
| S4 | Curriculum Review: Resume Correctly | ✅ PASS |
| S5 | Approval Review: Complete Workflow | ✅ PASS |
| S6 | Delete Unused Template: Confirmation Required | ✅ PASS |
| S7 | Archive Used Template: Archive Recommended | ✅ PASS |
| S8 | Deactivate Coach: History Preserved | ✅ PASS |
| S9 | Today Page Mission Card: Shows Correct Mission | ✅ PASS |
| S10 | Workflow Confidence: Prevents False Completion | ✅ PASS |

**Score: 10/10**  
**Recommendation: APPROVE**

---

## Files Created

| File | Purpose |
|---|---|
| `src/lib/donna/workflow/donnaWorkflowState.ts` | 17 workflow types, step definitions, state builders |
| `src/lib/donna/workflow/donnaWorkflowGuidanceEngine.ts` | Intent detection, route advancement, confidence, questions |
| `src/lib/donna/workflow/donnaMissionFormatter.ts` | State → Director language converter |
| `src/lib/donna/workflow/donnaWorkflowCertification.ts` | 10 static certification scenarios |
| `src/app/director/_components/ActiveMissionCard.tsx` | Mission card for Today page |
| `docs/donna/DONNA_WORKFLOW_GUIDANCE_REPORT.md` | This report |

## Files Modified

| File | Change |
|---|---|
| `src/lib/actions/donnaMemoryActions.ts` | + `saveWorkflowStateAction`, `loadWorkflowStateAction`, `clearWorkflowStateAction` |
| `src/lib/donna/llmOrchestration/contextPacket.ts` | + `activeWorkflowGuidance` field; + `## Active Mission` section in prompt |
| `src/app/director/_actions/donnaOrchestratorAction.ts` | + `activeWorkflowGuidance` to input type + orchestrate() passthrough |
| `src/components/assistant/DonnaAssistantButton.tsx` | + workflow state ref, load on panel open, pathname advancement, orchestrator injection, control intent handling, workflow start detection |
| `src/app/director/page.tsx` | + donna_working_memory query for active mission; + `ActiveMissionCard` render above fold |

---

## No Migrations

All workflow state stored in existing `donna_working_memory` table (key: `active_workflow_state`). No new DB tables or columns.

---

## Design Guardrails Respected

- No fake workflow progress — confidence scoring blocks auto-advancement below 70
- No invented completion — all step completions require either route visit, data presence, or explicit confirmation
- No autonomous execution — all actions require Director decision
- No new route trees — Today page card uses Link to existing routes
- No redesign — surgical additions to existing files
- One question at a time — `getMissingDataQuestion()` returns null or exactly one string
- One active workflow — starting a new one requires cancelling the old one

---

## TypeScript

```
npx tsc --noEmit
# exit 0 — no errors
```

---

## Fixes Applied Before Certification

1. **S2 fix — Intent collision**: `fitness_template_creation` patterns now checked before `class_template_creation`. Class template patterns tightened to require explicit `class` or `session` keyword.

2. **S3 fix — Question availability**: `getMissingDataQuestion` now returns questions for `route_visit` steps when a question is defined, not just `data_present` steps. For `data_present` steps, still skips when data is already in `entityRefs`.

---

## COMMIT STATUS: APPROVED

All criteria met:
- Certification Score ≥ 9/10 ✅ (10/10)
- All critical scenarios pass ✅ (10/10)
- Active Mission works ✅ (S1, S2, S9)
- Today Page integration works ✅ (S9)
- Workflow resume works ✅ (S1, S2, S4)
- Safe delete/archive flows work ✅ (S6, S7, S8)
- TypeScript clean ✅
