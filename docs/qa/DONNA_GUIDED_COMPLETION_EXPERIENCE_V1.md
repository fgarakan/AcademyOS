# DONNA Guided Completion Experience V1 — QA

Sprint: Mega Sprint 1821–1830
Date: 2026-06-04

## Purpose

Wire the Guided Completion Engine into the live DONNA conversation.
Director intent → DONNA guidance → step-by-step completion.

## Architecture

| Layer | Where |
|-------|-------|
| Workflow registry | `guidedCompletionRegistry.ts` — 6 workflows, trigger phrases |
| Session memory | `guidedCompletionSessionMemory.ts` — sessionStorage, TTL 4h |
| Step runner | `guidedCompletionStepRunner.ts` — message builder, summary |
| Progress card | `DonnaGuidedWorkflowCard.tsx` — rendered in DONNA panel |
| Integration | `DonnaAssistantButton.tsx` — detection + routing in `handleCommandSubmit` |

## Conversation flow

```
Director: "Walk me through the curriculum builder"
   ↓  detectGuidedCompletionIntent() → curriculum_builder_completion
   ↓  handleStartGuidedCompletion()
DONNA: "Let's build a curriculum level together. I'll ask 6 questions...
        Step 1 of 6: Which level are we building?"

Director: "Orange Ball 2"
   ↓  handleGuidedCompletionAnswer() → records answer, advances step
   ↓  buildAcknowledgement()
DONNA: "Got it — level recorded.
        Orange Ball 2
        Step 2 of 6: What is the main development goal of this level?"

...

Director: (answers all 6)
DONNA: "DONE — Curriculum Level Builder — Orange Ball 2 draft complete.
        Summary: [all answers]
        Status: Draft only — nothing saved. Approval required."
```

---

## QA Test Scenarios

### Scenario 1 — "Walk me through curriculum builder"

1. Open DONNA panel.
2. Type: "Walk me through curriculum builder"
3. **Expected:** `detectGuidedCompletionIntent()` matches → workflow starts.
4. **Expected:** Opening message appears in chat thread.
5. **Expected:** Step 1 of 6 question appears: "Which level are we building?"
6. **Expected:** `DonnaGuidedWorkflowCard` appears showing Step 1 of 6, 0% progress.
7. **Expected:** Nothing saves to DB. No mutations.

---

### Scenario 2 — Answer all 6 curriculum questions

1. Start scenario 1. Answer each question one at a time.
2. After each answer:
   - **Expected:** Acknowledgement appears in chat thread.
   - **Expected:** Next question presented.
   - **Expected:** Progress card advances (Step 2 of 6, Step 3 of 6, ...).
3. After final answer:
   - **Expected:** Completion summary generated with all 6 answers.
   - **Expected:** Summary includes "Draft only — nothing saved."
   - **Expected:** Actions listed: Review draft / Edit a field / Save draft (requires approval) / Submit for approval (requires approval).
   - **Expected:** Progress card shows "All 6 steps complete."

---

### Scenario 3 — Leave workflow midway

1. Start curriculum builder workflow. Answer 3 of 6 questions.
2. Close the DONNA panel (or navigate away).
3. **Expected:** Session state saved in sessionStorage (`donna_guided_completion_v1`).
4. **Expected:** `activeGuidedCompletion` state cleared from React (panel closed).
5. **Expected:** sessionStorage entry persists (TTL: 4 hours).

---

### Scenario 4 — Resume on panel re-open

1. Complete scenario 3 (3 answers saved, panel closed).
2. Re-open DONNA panel (click DONNA button).
3. **Expected:** `DonnaGuidedWorkflowCard` appears with 3/6 progress.
4. **Expected:** If chat thread is empty, resume message appears:
   "Welcome back. You're in the middle of Curriculum Level Builder — Orange Ball 2. Progress: 3 of 6 steps done."
5. **Expected:** Director can continue by typing next answer.
6. **Expected:** Workflow continues from where it left off.

---

### Scenario 5 — Restart workflow

1. Active guided completion is in progress (any step).
2. Director types: "Walk me through curriculum builder" again.
3. **Expected:** New workflow starts (replaces previous session in storage).
4. **Expected:** Progress resets to Step 1 of 6.
5. **Expected:** Old answers are cleared.

---

### Scenario 6 — Cancel workflow

1. Active guided completion is in progress.
2. Director types: "cancel" or "cancel workflow".
3. **Expected:** Workflow cancelled. Progress card disappears.
4. **Expected:** Message: "Workflow cancelled. Start a new one whenever you're ready."
5. **Expected:** `clearGuidedCompletion()` removes sessionStorage entry.
6. **Expected:** Director can start a new workflow immediately.

---

### Scenario 7 — Complete assessment workflow

1. Type: "Help me complete this assessment"
2. **Expected:** `assessment_completion` workflow starts.
3. Answer all 6 questions:
   - Player name
   - Assessment domain (Skill / Fitness / Mental / Competition)
   - Observation (free text)
   - Performance rating (1–10)
   - Development recommendation
   - Safe for parent? (yes / not yet)
4. **Expected:** Completion summary generated.
5. **Expected:** "Submit for review" action marked `requiresApproval: true`.
6. **Expected:** Nothing saved or shared until director acts on UI buttons.

---

### Scenario 8 — Complete parent update workflow (approval gate)

1. Type: "Create a parent update with me"
2. **Expected:** `parent_update_completion` workflow starts.
3. Answer all 5 questions (including internal flag step).
4. **Expected:** Completion summary shows all answers.
5. **Expected:** Step 5 ("Any concerns to flag?") is explicitly noted as "internal only — not included in parent message."
6. **Expected:** "Submit for approval" action is `requiresApproval: true`.
7. **Expected:** No communication sent to parent. No record mutated.

---

### Scenario 9 — Persistent voice conversation + guided workflow

1. Enable "Hey Donna" wake word (DonnaWakeWordLayer).
2. Say: "Hey Donna" → DONNA wakes into persistent session.
3. Say: "Walk me through curriculum builder."
4. **Expected:** Workflow detects via `handleCommandSubmit` (voice route hits same handler).
5. **Expected:** First question appears in DONNA panel.
6. Say next answer without "Hey Donna" wake phrase.
7. **Expected:** Answer routes through guided completion correctly.
8. **Expected:** Session stays active across voice turns.

---

### Scenario 10 — TypeScript and guardrails check

- `npx tsc --noEmit` passes with no errors.
- No DB writes triggered by engine.
- No server actions called during Q&A phase.
- No approval-gated actions auto-executed.
- `DonnaGuidedWorkflowCard` renders without errors.
- Existing `DonnaAssistantButton` modes (guide, explain, create_template, guided_task) unaffected.

---

## Supported trigger phrases (tested)

| Phrase | Workflow |
|--------|---------|
| "Walk me through curriculum builder" | curriculum_builder_completion |
| "Help me build curriculum" | curriculum_builder_completion |
| "Help me finish academy setup" | academy_setup_completion |
| "Complete my setup" | academy_setup_completion |
| "Guide me through adding a player" | player_onboarding_completion |
| "Help me add a player" | player_onboarding_completion |
| "Help me complete this assessment" | assessment_completion |
| "Walk me through assessment" | assessment_completion |
| "Create a parent update with me" | parent_update_completion |
| "Draft a parent update" | parent_update_completion |
| "Walk me through template builder" | template_builder_completion |
| "Help me build a template" | template_builder_completion |

---

## Acceptance Checklist

- [ ] Guided completion detection active in `handleCommandSubmit`
- [ ] Workflow starts automatically on trigger phrase
- [ ] First question appears immediately in chat thread
- [ ] Director answers advance the workflow step by step
- [ ] Progress card (`DonnaGuidedWorkflowCard`) visible and accurate
- [ ] Required questions cannot be skipped
- [ ] Completion summary generated with all answers + approval note
- [ ] Cancel command clears workflow
- [ ] Resume offer shown on panel re-open when workflow is in progress
- [ ] Works via voice conversation (persistent session)
- [ ] Existing `DonnaAssistantButton` modes unaffected
- [ ] No DB calls during guided Q&A phase
- [ ] Approval guardrails preserved
- [ ] TypeScript clean
