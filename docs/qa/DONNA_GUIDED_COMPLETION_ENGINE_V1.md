# DONNA Guided Completion Engine V1 — QA

Sprint: Mega Sprint 1811–1820
Date: 2026-06-04

## Purpose

DONNA turns director intent into completed workflows.
Not just answering questions — guiding step-by-step toward a known end goal.

Core philosophy: DONNA = Operating Brain. UI = Proof Layer. Director = Final Decision-Maker.

---

## Engine modules

| Module | Purpose |
|--------|---------|
| `guidedCompletionRegistry.ts` | 6 workflow definitions, trigger detection |
| `pageQuestionExtractor.ts` | Per-route question maps for each workflow |
| `guidedCompletionSessionMemory.ts` | sessionStorage session state tracker |
| `guidedCompletionStepRunner.ts` | Message builder, acknowledgement, completion summary |

---

## Supported workflows

| Workflow ID | Trigger examples | Required steps |
|-------------|-----------------|----------------|
| `curriculum_builder_completion` | "Walk me through curriculum builder" | 6 |
| `academy_setup_completion` | "Help me finish academy setup" | 6 |
| `player_onboarding_completion` | "Guide me through adding a player" | 6 |
| `assessment_completion` | "Help me complete this assessment" | 6 |
| `parent_update_completion` | "Create a parent update with me" | 5 |
| `template_builder_completion` | "Walk me through template builder" | 6 |

---

## Design rules

| Rule | How enforced |
|------|-------------|
| One question at a time | `getNextStep()` returns the first unanswered required step |
| No skipping required steps | `getNextStep()` enforces sequential order |
| Resumable | `buildResumeMessage()` + sessionStorage TTL = 4 hours |
| No mutations without approval | All approval-gated actions named explicitly; summary includes approval note |
| Evidence-safe | No counts or signals invented; engine only formats director answers |
| Draft-only completion | `buildCompletionSummary()` always includes "Draft only — nothing saved" note |

---

## QA Test Scenarios

### Scenario 1 — "Walk me through the curriculum builder"

**Input:** `"Walk me through curriculum builder"`

**Expected:** `detectGuidedCompletionIntent(text)` returns `curriculum_builder_completion` workflow.

**Expected opening message:**
```
Let's build a curriculum level together. I'll ask you 6 questions — one at a time.
Nothing saves until you review and approve the draft.

Step 1 of 6
Which level are we building? (e.g. Orange Ball 2, Red 1, Green Ball)
```

**Director answers:** "Orange Ball 2"

**Expected acknowledgement:**
- Confirmation that answer is recorded
- Subject label updated to "Orange Ball 2"
- Step 2 of 6 question presented: "What is the main development goal of this level?"

**After all 6 steps answered:**
- `isWorkflowComplete()` returns `true`
- `buildCompletionSummary()` produces a formatted draft with all 6 answers
- Draft includes: "Status: Draft only — nothing has been saved or sent."
- Actions listed: Review draft / Edit a field / Save draft / Submit for approval

---

### Scenario 2 — "Help me finish academy setup"

**Input:** `"Help me finish academy setup"`

**Expected:** `detectGuidedCompletionIntent(text)` returns `academy_setup_completion`.

**Expected flow:**
1. Academy name
2. Development philosophy
3. Curriculum structure
4. Active level count
5. Parent portal enabled?
6. First coach

**After all 6 steps:**
- Completion summary shows all 6 answers
- "Confirm and save" action marked `requiresApproval: true`
- Nothing is saved until director confirms in the UI

---

### Scenario 3 — "Guide me through adding a player"

**Input:** `"Guide me through adding a player"`

**Expected:** `detectGuidedCompletionIntent(text)` returns `player_onboarding_completion`.

**Expected flow:**
1. Player full name
2. Age
3. Recommended curriculum level
4. Assigned coach
5. Assigned group
6. Parent contact (name/email or "no parent yet")

**Critical guardrails:**
- "Create player profile" action is `requiresApproval: true`
- `finalize_player_placement()` is NOT called by this engine — director must confirm in UI
- No player record is created until explicit director action

---

### Scenario 4 — "Help me complete this assessment"

**Input:** `"Help me complete this assessment"`

**Expected:** `detectGuidedCompletionIntent(text)` returns `assessment_completion`.

**Expected flow:**
1. Which player?
2. Which domain? (Skill / Fitness / Mental / Competition)
3. What did you observe? (free text)
4. Performance rating (1–10)
5. Development recommendation
6. Safe for parent? (yes / not yet)

**After all 6 steps:**
- Assessment draft summary produced
- "Submit for review" is `requiresApproval: true`
- Nothing is saved or shared with parent until director approves

---

### Scenario 5 — "Create a parent update with me"

**Input:** `"Create a parent update with me"`

**Expected:** `detectGuidedCompletionIntent(text)` returns `parent_update_completion`.

**Expected flow:**
1. Which player?
2. Main message for parent
3. Specific positive progress
4. Home support tip
5. Internal flag for director (not sent to parent)

**Critical guardrails:**
- Step 5 ("Any concerns to flag to the director?") is explicitly noted as "internal only — not included in parent message"
- "Submit for approval" is `requiresApproval: true`
- Nothing is sent to parent until director approves
- `parentSafeResponseRules.ts` guardrails apply at send time (future integration sprint)

---

### Scenario 6 — Page context awareness

1. Director is on `/director/curriculum`.
2. Workflow `curriculum_builder_completion` is active.
3. Call `getPageQuestions('curriculum_builder_completion', '/director/curriculum')`.

**Expected:** Returns the 3 foundational questions (level_name, level_goal, required_skills) appropriate for the curriculum listing page.

4. Director navigates to `/director/curriculum/builder`.
5. Call `getPageQuestions('curriculum_builder_completion', '/director/curriculum/builder')`.

**Expected:** Returns all 6 questions (full builder context).

---

### Scenario 7 — Resume workflow in progress

1. Director starts `curriculum_builder_completion`, answers steps 1–3.
2. Director navigates away.
3. Director returns.
4. Call `getCurrentGuidedCompletion()`.

**Expected:** Returns state with `currentStepIndex: 4`, `completionPct: 50`, `answers` containing 3 answers.

5. Call `buildResumeMessage('curriculum_builder_completion', answers, 'Orange Ball 2')`.

**Expected output:**
```
Welcome back. You're in the middle of Curriculum Level Builder — Orange Ball 2.
Progress: 3 of 6 steps done.

Picking up where you left off:
Step 4 of 6
What drills or activities best develop these skills at this level?
```

---

### Scenario 8 — Completion summary format

After all 6 steps of `curriculum_builder_completion`:

**Expected `buildCompletionSummary()` output:**
```
DONE — Curriculum Level Builder — Orange Ball 2 draft complete.

Summary:
- Level: Orange Ball 2
- Level goal: Build rally consistency under movement pressure
- Required skills: serve rhythm, rally tolerance, recovery position
- Supporting drills: cross-court rally, serve + 1, shadow movement
- Assessment method: 10-ball rally at 70% + serve target test
- Parent/player description: At this level, players develop the ability to...

Status: Draft only — nothing has been saved or sent. Your approval is required before any action takes effect.

What would you like to do?
• Review draft
• Edit a field
• Save draft (requires your approval)
• Submit for approval (requires your approval)
```

---

### Scenario 9 — No mutations without approval

Verify across all 6 workflows:
- `safeActions` contain only: collect answers, build draft, explain, show progress
- `approvalGatedActions` contain: save to DB, publish, send to parent, create records
- `buildCompletionSummary()` always includes `approvalNote` in output
- No workflow step triggers a server action or DB write

---

### Scenario 10 — Trigger phrase variations

Test that `detectGuidedCompletionIntent()` matches:

| Input | Expected workflow |
|-------|------------------|
| "walk me through curriculum builder" | `curriculum_builder_completion` |
| "help me build curriculum" | `curriculum_builder_completion` |
| "help me finish academy setup" | `academy_setup_completion` |
| "complete my setup" | `academy_setup_completion` |
| "guide me through adding a player" | `player_onboarding_completion` |
| "help me add a player" | `player_onboarding_completion` |
| "help me complete this assessment" | `assessment_completion` |
| "walk me through assessment" | `assessment_completion` |
| "create a parent update with me" | `parent_update_completion` |
| "draft a parent update" | `parent_update_completion` |
| "walk me through template builder" | `template_builder_completion` |
| "help me build a template" | `template_builder_completion` |
| "random unrelated question" | `null` (no match) |

---

## Deferred (future integration sprint)

| Feature | Reason deferred |
|---------|----------------|
| Wiring into `DonnaAssistantButton` chat thread | File is 4000+ lines; requires dedicated integration sprint |
| Actual DB writes from completion summary | Requires server action wiring; engine is read-only for now |
| Parent safe rule validation at draft time | `parentSafeResponseRules.ts` applies at send time |
| DOM-based page question extraction | Static maps are sufficient for V1; DOM extraction adds risk |
| Voice-driven step answers | Requires voice input integration |

---

## Acceptance Checklist

- [ ] `detectGuidedCompletionIntent()` matches all 12 trigger phrases
- [ ] `getNextStep()` returns the first unanswered required step, never skips
- [ ] `buildStepMessage()` produces well-formatted step messages with progress label
- [ ] `buildAcknowledgement()` confirms answer and presents next step
- [ ] `buildCompletionSummary()` produces full draft with approval note
- [ ] `buildResumeMessage()` correctly reflects prior progress
- [ ] `recordAnswer()` updates session state and advances step index
- [ ] `getCurrentGuidedCompletion()` returns active session or null
- [ ] `isWorkflowComplete()` returns true only when all required fields answered
- [ ] All approval-gated actions are named and never auto-executed
- [ ] TypeScript: clean (`npx tsc --noEmit`)
- [ ] No DB calls, no server actions, no mutations in any module
