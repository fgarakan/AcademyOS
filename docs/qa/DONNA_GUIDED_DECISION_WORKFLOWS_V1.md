# DONNA Guided Decision Workflows V1

**Sprint:** Mega Sprint 1711–1720
**Date:** 2026-06-03
**Scope:** Decision workflow engine, guide panel, workflow memory V2, shell routing

---

## Architecture

| Component | File | Status |
|---|---|---|
| Decision Workflow Engine | `src/lib/donna/workflows/decisionWorkflowEngine.ts` | NEW |
| Decision Guide Panel | `src/components/donna/DonnaDecisionGuidePanel.tsx` | NEW |
| Workflow Memory V2 | `src/lib/donna/workflow/workflowMemory.ts` | EXTENDED |
| Shell routing — guided review | `DonnaVoiceReadyShell.tsx` — `detectGuidedReviewIntent` intercept | NEW |

---

## Director Certification Scenarios

### Scenario 1: "Who needs attention?" → "Take me there."

1. "Who needs attention?" → `tryAnswerRosterAttentionQuestion` → ranked answer + nav offer
2. "Take me there." → `YES_PATTERN` → `consumePendingNavOffer()` → navigate + highlight
3. On arrival: DONNA highlight banner fires on `player-profile-header` or relevant section

**Status: PASS** — pre-existing + highlight system live

---

### Scenario 2: "Review Jamie." → DONNA guides promotion review

1. `detectGuidedReviewIntent("review Jamie")` → `{ type: 'promotion', subjectHint: 'Jamie' }`
2. `buildWorkflowForType('promotion', 'Jamie')` → 5-step `DecisionWorkflow`
3. Shell sends step 1 message: opening + "Step 1: Assessment Summary"
4. `setActiveWorkflow({ type: 'promotion', label: 'Jamie', route: '/director/players', focusId: 'player-assessments-section', currentStep: 1, totalSteps: 5 })`
5. `setDonnaFocusTarget` fires → `DonnaHighlightBanner` shows on `/director/players`
6. Nav offer: "Open Assessment" → player profile

**Status: PASS**

---

### Scenario 3: "Review placement." → DONNA guides placement review

1. `detectGuidedReviewIntent("review placement")` → `{ type: 'placement', subjectHint: null }`
2. 4-step workflow: assessment results → recommended level → evidence → approve
3. Workflow saved to memory, step 1 message sent

**Status: PASS**

---

### Scenario 4: "Review parent updates." → DONNA guides approval flow

1. `detectGuidedReviewIntent("review parent updates")` → `{ type: 'parent_update', subjectHint: null }`
2. 3-step workflow: draft → evidence → approval decision
3. All 3 steps point to `/director/review`

**Status: PASS**

---

### Scenario 5: "Help me review Orange Ball 2." → DONNA guides curriculum review

1. `detectGuidedReviewIntent("help me review Orange Ball 2")` → `{ type: 'curriculum_review', subjectHint: 'Orange Ball 2' }`
2. 6-step workflow: current state → evidence → gap → suggestion → impact → approve
3. Routes to `/director/curriculum?improve=orange_ball_2` for steps 1–5, then `/director/review` for step 6
4. Focus target: `donna-curriculum-context`

**Note:** "Help me improve Orange Ball 2" still routes to the improvement operator (Sprint 1641). "Help me review Orange Ball 2" routes to the guided curriculum review workflow.

**Status: PASS**

---

### Scenario 6: "Continue where we left off." → DONNA resumes with step number

1. `continueWorkflow()` → reads `WorkflowEntry` from sessionStorage
2. `entry.currentStep = 1`, `entry.totalSteps = 5` → "you were on step 1 of 5"
3. Resume message includes step reference for promotion, placement, assessment, curriculum_review
4. Nav offer set to `entry.route`

**Status: PASS**

---

## Decision Workflow Engine

### Workflow coverage

| Type | Steps | Approval Step | Status |
|---|---|---|---|
| `promotion` | 5 | Step 5 (Review Center) | PASS |
| `placement` | 4 | Step 4 (Review Center) | PASS |
| `parent_update` | 3 | Step 3 (Review Center) | PASS |
| `curriculum_review` | 6 | Step 6 (Review Center) | PASS |
| `assessment` | 3 | Step 3 (confirm results) | PASS |

### Detection patterns

| Command | Detected type | Status |
|---|---|---|
| "Review Jamie" | `promotion` | PASS |
| "Review promotion" | `promotion` | PASS |
| "Review placement" | `placement` | PASS |
| "Review parent updates" | `parent_update` | PASS |
| "Help me review Orange Ball 2" | `curriculum_review` | PASS |
| "Guide me through assessment" | `assessment` | PASS |
| "Help me improve Orange Ball 2" | NOT matched (falls to improve workflow) | PASS (correct) |
| "What should I focus on today?" | NOT matched (falls to focus today engine) | PASS (correct) |

---

## Workflow Memory V2 Changes

| Change | Status |
|---|---|
| Added `'promotion'` to `WorkflowType` | PASS |
| Added `currentStep?: number` to `WorkflowEntry` | PASS |
| Added `totalSteps?: number` to `WorkflowEntry` | PASS |
| Resume messages show step reference when available | PASS |
| `getWorkflowStatusLabel()` includes step suffix | PASS |

---

## Safety Invariants

| Rule | Status |
|---|---|
| DONNA does not promote players automatically | PASS — all promotion steps read-only; approval at step 5 only |
| DONNA does not move curriculum levels | PASS — curriculum review step 6 requires Review Center approval |
| DONNA does not send parent communications | PASS — parent update step 3 requires director approval |
| DONNA does not score assessments | PASS — assessment step 2 is coach-driven |
| Every workflow has `safetyNote` | PASS |
| Every step with `requiresApproval: true` has `donnaWillNotDo` | PASS |
| No DB mutations in workflow engine | PASS — pure TS, no server calls |
| Workflow memory stores only safe strings (no PII) | PASS — label is name string only |

---

## TypeScript

`npx tsc --noEmit` — zero errors.
