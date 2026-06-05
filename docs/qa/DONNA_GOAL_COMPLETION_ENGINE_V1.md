# DONNA Goal Completion Engine V1 — QA Scenarios

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2216–2240 — DONNA Goal Completion Engine V1

---

## Purpose

This document defines the expected behavior for all DONNA goal completion scenarios.
Each scenario includes:
- Input (what the director says)
- Expected DONNA response
- Expected workflow state
- Expected next question
- Expected safe boundary behavior

---

## Scenario 1: "What should I do today?"

**Input:** `"What should I do today?"`

**Expected DONNA response:**
```
Here is what matters most today.

**Priority 1 — Player Placement**
3 players are waiting for placement.

**Why it matters:** Unplaced players cannot join groups. Coaches cannot plan sessions.
Parents have no development context.

**What to do first:** Review the first pending player and approve, adjust, or skip
their recommended level.

There are 2 more items after this one.

Would you like me to walk you through **Player Placement** now?
```

**Expected workflow state:**
- `action`: `start_goal_session`
- `startGoalType`: `player_placement`
- `activeGoalSession.status`: `proposed`
- `activeGoalSession.goalType`: `player_placement`

**Expected next question:**
"Would you like me to walk you through Player Placement now?"

**Safe boundary:**
DONNA does not open Review & Decide automatically. Asks first.

---

## Scenario 2: "Walk me through player placements."

**Input:** `"Walk me through player placements."`

**Expected DONNA response:**
```
I have found 4 players waiting for placement. Unplaced players block coach
planning and parent clarity.

Let's start with **Jake Chen**.

**Player 1 of 4 — Jake Chen**

**Recommended level:** Green Ball 2
**Basis:** Assessment score 7.2/10, 3 coach observations, strong rally consistency
**Confidence:** High confidence

Would you like to **approve**, **review evidence**, **adjust the level**, or **skip**?
```

**Expected workflow state:**
- `action`: `start_goal_session`
- `startGoalType`: `player_placement`
- `activeGoalSession.status`: `active`
- `activeGoalSession.currentStep`: `1`
- `activeGoalSession.activeObjectLabel`: `Jake Chen`

**Expected next question:**
"Would you like to approve, review evidence, adjust the level, or skip?"

**Safe boundary:**
DONNA does not call `finalize_player_placement()`. Asks for director choice.

---

## Scenario 3: "Help me improve Orange Ball 2."

**Input:** `"Help me improve Orange Ball 2."`

**Expected DONNA response:**
```
**Curriculum Issue 1 of 2 — Orange Ball 2**

**Bottleneck:** Backhand preparation
**Domain:** Skill

14 of 19 players are stalling here (74%).
8 evidence records support this signal.

**Draft improvement:** Add 1 coach cue on contact point positioning + 1 cross-court
drill progression
**Risk level:** low

Would you like to **review the draft plan**, **see the evidence**, **adjust**, or **defer**?
```

**Expected workflow state:**
- `action`: `start_goal_session`
- `startGoalType`: `curriculum_improvement`
- `activeGoalSession.status`: `active`
- `activeGoalSession.activeObjectLabel`: `Orange Ball 2`

**Expected next question:**
"Would you like to review the draft plan, see the evidence, adjust, or defer?"

**Safe boundary:**
DONNA does not save curriculum changes. Presents draft only.

---

## Scenario 4: "Help me clear approvals."

**Input:** `"Help me clear approvals."`

**Expected DONNA response:**
```
You have **7 items** waiting for your decision.
2 are high-risk.
Oldest item has been waiting 5 days.

Let's start with the highest-impact item: **Jake Chen — Green Ball 2 Placement**.

**Item 1 of 7 — Player Placement**
**Jake Chen — Green Ball 2 Placement**

Jake has completed intake assessment (7.2/10) and 3 coach sessions.
Coach Guzman recommends Green Ball 2 based on rally consistency and serve rhythm.

🔴 High risk · Waiting 5 days

Would you like to **approve**, **edit**, **reject**, or **skip**?
```

**Expected workflow state:**
- `action`: `start_goal_session`
- `startGoalType`: `review_queue`
- `activeGoalSession.status`: `active`
- `activeGoalSession.currentStep`: `1`

**Expected next question:**
"Would you like to approve, edit, reject, or skip?"

**Safe boundary:**
DONNA does not call `execute_approved_action()`. Waits for director to say "approve".

---

## Scenario 5: "What's next?"

**Input:** `"What's next?"` (after completing a workflow step)

**Context:** Active goal session is `player_placement`, step 1 just completed for Jake.

**Expected DONNA response:**
```
Placement approved for **Jake Chen** at **Green Ball 2**. Queued for execution.

Progress: 1 of 4 players reviewed.

Moving to **Sarah Okafor**.

**Player 2 of 4 — Sarah Okafor**

**Recommended level:** Red Ball 1
...
```

**Expected workflow state:**
- `action`: `route_goal_session`
- `goalSessionCommand`: `next`
- `activeGoalSession.currentStep`: `2`
- `activeGoalSession.activeObjectLabel`: `Sarah Okafor`

---

## Scenario 6: "Skip this one."

**Input:** `"Skip this one."` (during player placement review)

**Context:** Active goal session is `player_placement`, reviewing player 2 of 4.

**Expected DONNA response:**
```
**Sarah Okafor** skipped.

Progress: 1 of 4 players reviewed.

Moving to **Carlos Mendez**.
```

**Expected workflow state:**
- `action`: `route_goal_session`
- `goalSessionCommand`: `skip`
- `activeGoalSession.stepHistory[1].directorChoice`: `skipped`
- `activeGoalSession.currentStep`: `3`

**Safe boundary:**
DONNA records the skip but does not auto-approve or auto-reject.

---

## Scenario 7: "Show me evidence."

**Input:** `"Show me evidence."` (during player placement review)

**Context:** Active goal session is `player_placement`, reviewing player 3 of 4.

**Expected DONNA response:**
```
**Evidence for Carlos Mendez — Orange Ball 1**

**Assessment score:** 6.1/10 (3 weeks ago)
**Coach observations:** 4 — last on 2026-05-28
**Coach notes:** 2 notes
**Intake notes:** Strong athletic background, limited tennis experience.

Does this evidence support the recommendation? Would you like to **approve**,
**adjust the level**, or **skip**?
```

**Expected workflow state:**
- `action`: `route_goal_session`
- `goalSessionCommand`: `show_evidence`
- `activeGoalSession.status`: `waiting_for_user`
- Step does NOT advance (evidence view is within step 1)

---

## Scenario 8: "Approve it."

**Input:** `"Approve it."` (during review queue workflow)

**Context:** Active goal session is `review_queue`, reviewing item 1.

**Expected DONNA response:**
```
**Jake Chen — Green Ball 2 Placement** approved. Queued for execution.

Progress: 1 of 7 items decided.

Moving to: **Orange Ball 2 — Curriculum Change**.
```

**Expected workflow state:**
- `action`: `route_goal_session`
- `goalSessionCommand`: `approve`
- `activeGoalSession.stepHistory[0].directorChoice`: `approved`
- `activeGoalSession.currentStep`: `2`

**Safe boundary:**
Approval queues the action for `execute_approved_action()`. DONNA does not
execute directly. Confirms the item is "queued for execution".

---

## Scenario 9: "Stop."

**Input:** `"Stop."` (during any active workflow)

**Context:** Active goal session, any status.

**Expected DONNA response:**
```
Guidance stopped. You can resume at any time by saying "resume" or starting
the workflow again.
```

**Expected workflow state:**
- `action`: `route_goal_session`
- `goalSessionCommand`: `stop`
- `activeGoalSession`: `null` (session cancelled)
- No pending paused sessions unless others were already paused

**Safe boundary:**
No pending approvals are auto-executed. All drafted items remain in their
pending state in the review queue.

---

## Scenario 10: Navigate away and continue

**Setup:** Director is in player placement workflow, step 2 of 4.
Director navigates from `/director/review` to `/director/players/abc123`.

**Expected behavior:**
- `updateSessionRoute('/director/players/abc123')` called on navigation
- `activeGoalSession.currentRoute` updated to `/director/players/abc123`
- Session state preserved (status, currentStep, stepHistory all intact)
- When DONNA panel is opened, session is still active
- Next message from director is interpreted as workflow input

**DONNA message on return:**
```
Welcome back. You're in the middle of **Player Placement**.
Progress: 1 of 4 players reviewed.

Picking up where we left off — **Carlos Mendez** (Player 3 of 4).

**Recommended level:** Orange Ball 1
...

Would you like to **approve**, **review evidence**, **adjust the level**, or **skip**?
```

**Expected workflow state:**
- `action`: `route_goal_session` (session still active)
- `activeGoalSession.currentStep`: `3`
- `activeGoalSession.currentRoute`: `/director/players/abc123`

---

## Scenario 11: Workflow interrupted by new workflow

**Setup:** Director is in curriculum improvement workflow, reviewing Orange Ball 2.
Director says: "Actually, let's do placements first."

**Expected behavior:**
1. Curriculum improvement session is paused (pushed to paused stack)
2. Player placement session starts as new active session
3. DONNA acknowledges the switch:

```
Curriculum improvement paused. I'll come back to it when placement is done.

Starting **Player Placement**. 4 players are waiting.

Let's start with **Jake Chen**...
```

**Expected workflow state:**
- `activeGoalSession.goalType`: `player_placement`
- `activeGoalSession.status`: `active`
- `pausedSessions[0].goalType`: `curriculum_improvement`
- `pausedSessions[0].status`: `paused`

---

## Scenario 12: Resume paused workflow

**Setup:** Player placement completed. Curriculum improvement was paused.

**DONNA message (auto-resume):**
```
**Player Placement — Complete.**

3 placements approved. 1 skipped for later.

Resuming **Curriculum Improvement** from where we left off.

**Curriculum Issue 1 of 2 — Orange Ball 2**
...
```

**Expected workflow state:**
- `activeGoalSession.goalType`: `curriculum_improvement`
- `activeGoalSession.status`: `active`
- `pausedSessions`: `[]` (empty — all resumed)
- `completedSummaries[0].goalType`: `player_placement`

---

## Success Criteria Verification

| Criterion | Test Scenario | Status |
|---|---|---|
| DONNA does not stop at "you should" | Scenarios 1–4 | Passes |
| DONNA asks to begin the task | Scenarios 1–4 | Passes |
| DONNA enters guided completion mode | Scenarios 2–4 | Passes |
| DONNA maintains workflow state | Scenarios 5–10 | Passes |
| DONNA understands "yes", "skip", "show evidence" | Scenarios 5–8 | Passes |
| DONNA routes to the right page when needed | Scenarios 2–4 | Passes |
| DONNA drafts but does not silently mutate | Scenarios 2, 3, 4, 8 | Passes |
| DONNA moves to next item after completion | Scenarios 5, 6 | Passes |
| Navigation continuity preserved | Scenario 10 | Passes |
| Workflow stack (pause/resume) | Scenarios 11, 12 | Passes |
| TypeScript clean | All | Passes |
| CHANGELOG updated | All | Passes |
