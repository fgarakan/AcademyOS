# DONNA Goal Session Runtime — Architecture
**Sprint 934–963B — Goal Session Runtime V1**
**Date: 2026-06-07**

---

## 1. What a Goal Session Is and When It Starts

A **Goal Session** is a directed, conversational Q&A loop that guides the director through completing a specific workflow outcome — one question at a time — ending with a draft summary queued for approval.

Goal Sessions are not chat. They are not recommendations. They are not navigation shortcuts.
A Goal Session is DONNA owning the completion of a defined outcome: not stopping until the director has a draft ready to approve.

### When a Goal Session starts

| Trigger | Mechanism | Confidence |
|---|---|---|
| Director says a trigger phrase (e.g. "add a new player", "walk me through the template builder") | `detectGuidedCompletionIntent()` in guidedCompletionRegistry | Deterministic |
| processDonnaMessage emits `start_goal_session` at medium confidence (0.55–0.71) | Director confirms the proposed workflow | Inferred |

### When a Goal Session does NOT start

- Brain knowledge question ("what is a group?") → handled by brain knowledge step
- Navigation command ("go to players") → handled by entity resolver
- Review queue query ("show me pending approvals") → handled by `open_review` action
- Any question handled with high confidence (≥ 0.80) by processDonnaMessage steps 1–12.5

---

## 2. The 5-Phase Session Lifecycle

```
Director message
      │
      ▼
┌─────────────────────────────────────────┐
│  Phase 1: DETECT                        │
│  Does this message match a guided       │
│  workflow trigger phrase?               │
│  Or is there an active session?         │
└─────────────────────────────────────────┘
      │ yes                    │ no
      ▼                        ▼
┌───────────────┐         return no_session
│ Phase 2:      │         → falls through to
│ NAVIGATE      │           processDonnaMessage
│               │
│ If target     │
│ page ≠        │
│ current page  │
│ emit          │
│ navigateTo    │
└───────────────┘
      │
      ▼
┌───────────────────────────────────────────┐
│  Phase 3: START                           │
│  startGuidedCompletion(workflowId)        │
│  buildStepMessage(workflowId, step1)      │
│  Return: goal_session_start               │
│    response = openingMessage + Step 1     │
│    navigateTo = targetRoute or null       │
└───────────────────────────────────────────┘
      │ (next director message)
      ▼
┌───────────────────────────────────────────┐
│  Phase 4: LOOP (repeated per message)     │
│                                           │
│  getCurrentGuidedCompletion()             │
│  → find current step (first unanswered)  │
│  → recordAnswer(fieldId, message)         │
│  → getNextStep()                          │
│                                           │
│  If more steps remain:                   │
│    buildAcknowledgement()                │
│    Return: goal_session_step             │
│                                           │
│  If cancel intent detected:              │
│    clearGuidedCompletion()               │
│    Return: goal_session_cancel           │
└───────────────────────────────────────────┘
      │ (all required steps answered)
      ▼
┌───────────────────────────────────────────┐
│  Phase 5: COMPLETE                        │
│  isWorkflowComplete() → true              │
│  buildCompletionSummary(workflowId,       │
│    answers, subjectLabel)                 │
│  clearGuidedCompletion()                  │
│  Return: goal_session_complete            │
│    response = formatted draft summary     │
│    draftType = workflow's draft type      │
│    spokenResponse = headline              │
└───────────────────────────────────────────┘
```

### Session status transitions (from donnaGoalCompletionModel.ts)

```
proposed → active → waiting_for_user → waiting_for_approval → completed
                 ↘ paused (director interrupted)
                 ↘ cancelled (director said stop)
                 ↘ blocked (missing required prior data)
```

---

## 3. Integration with processDonnaMessage

The Goal Session Runtime is a **peer** to processDonnaMessage, not a subordinate step.

### Call order in each surface (DonnaAssistantButton, DonnaVoiceReadyShell)

```typescript
// 1. Call goal session runtime FIRST
const goalResult = processGoalSession({
  userMessage: trimmed,
  currentRoute: pathname,
  activeGuidedWorkflowId: null,
})

// 2. If a session matched, render and return early
if (goalResult.action !== 'no_session') {
  // render goalResult.response
  // navigate to goalResult.navigateTo if set
  return
}

// 3. Only if no session matched: call processDonnaMessage
const brainResult = processDonnaMessage({ ... })
```

### Why peer, not embedded

- Avoids modifying `processDonnaMessage.ts` (brain logic stability)
- No circular dependency risk
- Session state lives in guidedCompletionSessionMemory (sessionStorage), not in brain pipeline
- processGoalSession is pure TypeScript with no side effects outside sessionStorage

### processDonnaMessage step 14 relationship

processDonnaMessage step 14 emits `start_goal_session` at medium confidence (0.55–0.71) as a **proposal**. This proposal is surfaced to the director as "I think you're trying to add a new player — is that right?"

When the director confirms, their confirmation message re-enters the runtime. If it matches a trigger phrase (e.g. "yes, add a player" → "add a new player" partial match), Phase 1 starts the session. If it doesn't match a phrase, the surface can start the session directly by calling `startGuidedCompletion(workflowId)` with the proposed workflow ID.

---

## 4. Existing Systems Coordinated

### Systems this runtime USES

| System | File | What it provides |
|---|---|---|
| `guidedCompletionRegistry` | `src/lib/donna/guidedCompletion/guidedCompletionRegistry.ts` | 6 workflow definitions; trigger phrases; step sequences; `detectGuidedCompletionIntent()` |
| `guidedCompletionSessionMemory` | `src/lib/donna/guidedCompletion/guidedCompletionSessionMemory.ts` | sessionStorage-backed session state; `startGuidedCompletion()`, `recordAnswer()`, `getCurrentGuidedCompletion()`, `clearGuidedCompletion()` |
| `guidedCompletionStepRunner` | `src/lib/donna/guidedCompletion/guidedCompletionStepRunner.ts` | Message builders: `buildStepMessage()`, `buildAcknowledgement()`, `buildCompletionSummary()`, `getNextStep()`, `isWorkflowComplete()`, `buildResumeMessage()` |
| `donnaGoalEngine` | `src/lib/donna/goals/donnaGoalEngine.ts` | `resolveTextToGoal()` for medium-confidence intent → workflow mapping |
| `confidenceScoring` | `src/lib/donna/intent/confidenceScoring.ts` | `CONFIDENCE_ACT_THRESHOLD` (0.72) for threshold checks |

### Systems this runtime does NOT use

| System | Reason |
|---|---|
| `processDonnaMessage` | Avoids circular dependency; brain handles different query types |
| `donnaBrainRuntime` | Brain answers vocabulary/rules/philosophy; not Q&A session management |
| `donnaTaskContracts` / `donnaMissingQuestionEngine` | Task contracts handle single-action drafts; guided completion registry handles multi-step workflows |
| `donnaGoalCompletionModel` | Higher-level session lifecycle model (GoalType, GoalCompletionStack); used in future integration sprints |
| Any LLM or API | Runtime is pure TypeScript; deterministic |
| Any database | Runtime uses sessionStorage only (6-hour TTL, clears on tab close) |

### System overlap to resolve in future sprints

| Overlap | Current state | Resolution path |
|---|---|---|
| `guidedCompletionSessionMemory` vs `donnaGoalCompletionModel` | Two parallel sessionStorage systems (different keys) | Future sprint: consolidate into one stack |
| `guidedCompletionRegistry` vs `donnaTaskContracts` | Two question sequence systems | Task contracts: single-action flows; Registry: multi-step guided flows — keep separate |
| `guidedCompletionRegistry` vs `donnaWorkflowRegistry` | Two workflow registries (different scopes) | Registry: guided Q&A; Workflow registry: voice/LLM workflows — keep separate |

---

## 5. The Action Envelope Contract

### GoalSessionInput

```typescript
interface GoalSessionInput {
  userMessage: string      // Raw director text
  currentRoute: string     // Active page route (e.g. '/director/players')
  activeGuidedWorkflowId: string | null  // Active workflow if known; null otherwise
}
```

### GoalSessionAction types

| Action | Meaning | Surface behavior |
|---|---|---|
| `no_session` | Nothing matched — caller falls through | Call processDonnaMessage normally |
| `goal_session_start` | Trigger phrase matched; session opened; Step 1 ready | Render response; navigate if `navigateTo` set |
| `goal_session_step` | Answer recorded; next question shown | Render acknowledgement + next question |
| `goal_session_complete` | All steps answered; draft summary ready | Render summary; offer approval actions |
| `goal_session_cancel` | Director cancelled; session cleared | Render cancellation confirmation |
| `goal_session_resume` | Resume intent detected on active session | Render resume message with current step |

### GoalSessionResult

```typescript
interface GoalSessionResult {
  action: GoalSessionAction
  response: string               // DONNA's message to render
  navigateTo: string | null      // Page to navigate to (null = stay on current page)
  workflowId: GuidedWorkflowId | null
  draftType: string | null       // e.g. 'player_profile_draft' on completion
  answers: Record<string, string> | null  // Collected answers so far
  completionPct: number          // 0–100
  confidence: number             // 0.95 for trigger match; 1.0 for active session
  shouldSpeak: boolean           // True for start and completion
  spokenResponse: string | null  // Short voice-ready version of response
}
```

---

## 6. What "Completion" Means and What It Produces

### Completion criteria

`isWorkflowComplete(workflowId, answers)` returns `true` when all `requiredSteps` in the workflow have a non-empty answer in the `answers` map.

Optional steps are not completion-blocking.

### What completion produces

1. **`buildCompletionSummary(workflowId, answers, subjectLabel)`** — formatted draft with:
   - Headline: `"DONE — {Workflow label} draft complete."`
   - Body: all collected answers, one per line
   - Approval note: `"Status: Draft only — nothing has been saved or sent. Your approval is required before any action takes effect."`
   - Action list: workflow-specific next steps (e.g. "Review draft", "Save draft _(requires your approval)_")

2. **`draftType`** — string identifying what kind of draft was produced:
   - `curriculum_builder_completion` → `'curriculum_level_draft'`
   - `academy_setup_completion` → `'academy_setup_draft'`
   - `player_onboarding_completion` → `'player_profile_draft'`
   - `assessment_completion` → `'assessment_draft'`
   - `parent_update_completion` → `'parent_update_draft'`
   - `template_builder_completion` → `'class_template_draft'`

3. **Session cleared**: `clearGuidedCompletion()` is called immediately. The draft summary is the only output.

4. **Voice confirmation**: `spokenResponse` = the headline (short, spoken by `speakDonnaPremium`).

5. **No automatic save, no database write, no API call.** The director sees the summary and must take explicit action to save.

### What happens after completion

The surface renders the completion summary with its action list. The director can:
- Accept and proceed to save (implementation: surface wires up action buttons to existing server actions)
- Edit a field (implementation: surface re-enters the session with the specific fieldId pre-answered)
- Dismiss (no action taken — draft is shown for reference only)

The recommended next goal (from `donnaGoalEngine`) is not surfaced in Sprint 934B. This is a gap for Sprint 934C+.

---

## System Gaps (Not Fixed in This Sprint)

| Gap | Description | Fix path |
|---|---|---|
| **Page state population** | DONNA asks questions but does not fill form fields on the page | Sprint 934C: page element registry → field wiring |
| **Completion → action wiring** | Draft summary has no buttons wired to server actions | Future sprint: action buttons in GoalSessionCompleteCard component |
| **Medium-confidence session start** | When processDonnaMessage proposes start_goal_session, director confirmation does not auto-start the session | Sprint 934C: surface handles `start_goal_session` action by calling `processGoalSession` with the proposed workflowId |
| **Paused session resume** | pauseActiveSession() exists in donnaGoalCompletionModel but is not wired to processGoalSession | Future sprint: stack consolidation |
| **"Show summary" command** | buildCompletionSummary can be called mid-session on demand | Sprint 934C: detect "show summary" intent in Phase 4 loop |

---

*Certified by: `docs/qa/DONNA_GOAL_SESSION_CERTIFICATION_934.md`*
*Runtime: `src/lib/donna/goalSessions/donnaGoalSessionRuntime.ts`*
