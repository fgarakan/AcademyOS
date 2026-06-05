# DONNA Goal Completion Gap Audit V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2216–2240 — DONNA Goal Completion Engine V1

---

## Purpose

This audit identifies where DONNA currently stops at recommendations instead of
guiding the director to completion. Each scenario below documents the current
(broken) behavior, the gap, and the target (corrected) behavior.

---

## Audit Scenarios

### 1. "What should I do today?"

**Current behavior:**
DONNA reads the attention queue and returns a list of priorities with routes.
She stops after presenting the list.

**Gap:**
- Does not ask "Would you like me to walk you through it?"
- Does not enter guided completion mode when director says yes
- Does not move to the next priority when the first is done
- No state is maintained after the response

**Target behavior:**
1. DONNA identifies top priority by priority order (P1 blockers first)
2. Explains what it is, why it matters, what to do first
3. Asks: "Would you like me to walk you through it now?"
4. If yes → starts the relevant goal workflow
5. When workflow completes → presents next priority with same structure
6. Continues until all priorities reviewed or director says stop

---

### 2. "Help me with curriculum."

**Current behavior:**
DONNA explains the curriculum structure or identifies bottlenecks.
Response ends with a link to `/director/curriculum`.

**Gap:**
- Stops at explanation
- No offer to walk through improvement steps
- No draft improvement plan presented
- Director must navigate and discover the issue themselves

**Target behavior:**
1. DONNA identifies most blocked level by player stall rate
2. Presents: what the bottleneck is, why it matters, evidence count
3. Asks: "Would you like to review the draft improvement plan?"
4. Presents draft (add drill / add coach cue / edit requirement)
5. Asks: approve / adjust / defer
6. Moves to next blocked level after decision

---

### 3. "Walk me through player placement."

**Current behavior:**
DONNA opens the review queue or navigates to `/director/review`.
No per-player guided flow exists.

**Gap:**
- No player-by-player guided flow
- Director must locate each player manually
- No conversational approve/skip/review-evidence options
- No summary of what was decided

**Target behavior:**
1. DONNA presents first pending player with recommended level
2. Explains evidence: assessment score, coach observations, intake notes
3. Asks: approve / review evidence / adjust level / skip
4. Records decision and presents next player
5. Completion summary: how many approved, skipped, adjusted

---

### 4. "Help me finish approvals."

**Current behavior:**
DONNA opens the review queue at `/director/review`.
No conversational processing of items.

**Gap:**
- Director is dropped into the queue UI without guidance
- No item-by-item conversational flow
- No prioritization of items (high-risk first)
- No acknowledgement after each decision

**Target behavior:**
1. DONNA counts pending items, notes high-risk count
2. Presents highest-risk/oldest item first
3. Summarizes item with context
4. Asks: approve / edit / reject / skip
5. Acknowledges decision and presents next item
6. Ends with: X decided, Y remaining

---

### 5. "Improve this level."

**Current behavior:**
DONNA explains what the level is and what might need improvement.
Stops at explanation.

**Gap:**
- No evidence-based bottleneck identification
- No draft improvement plan
- No approval-safe action to take

**Target behavior:**
1. DONNA identifies the specific bottleneck (domain, skill area)
2. Shows evidence: player stall rate, gate completion rate, observations
3. Presents draft improvement plan (change type, description, affected players)
4. Asks: approve draft / adjust / defer
5. If approved: draft goes to Review & Decide

---

### 6. "Finish onboarding."

**Current behavior:**
DONNA explains the setup steps or navigates to the onboarding page.
No step-by-step guide exists.

**Gap:**
- No identification of which steps are actually incomplete
- No per-step conversational flow
- Director must figure out what is missing manually

**Target behavior:**
1. DONNA identifies incomplete onboarding steps
2. Presents first incomplete step with why it matters
3. Asks: complete now / skip / defer
4. Navigates to the relevant page when director says yes
5. Returns to next step after completion

---

## Common Failure Patterns

| Pattern | Frequency | Impact |
|---|---|---|
| Answers but does not continue | Every response | Director loses momentum |
| Recommends but does not guide | Every priority response | Friction at action boundary |
| Gives a link instead of a workflow | Review queue, curriculum | Forces manual navigation |
| Lacks next-step state | All flows | Director must restart context |
| Loses context after navigation | All flows | Workflow abandoned on page change |
| Fails to ask completion questions | Daily brief, attention | No trigger for guided mode |

---

## Root Cause

The existing DONNA brain (`processDonnaMessage.ts`) routes to `respond` after
generating a high-confidence answer. There is no "post-response continuation" layer.
DONNA has no mechanism to ask a follow-up question and then interpret the director's
reply in the context of that question.

The existing `COOOrchestrationMemory` tracks priority state but does not support
per-workflow step tracking or short-phrase command recognition inside a workflow.

---

## Resolution

The DONNA Goal Completion Engine V1 (this sprint) adds:
1. `GoalCompletionSession` model — per-workflow state in sessionStorage
2. `GoalCompletionStack` — active + paused workflow support
3. `donnaWorkflowRegistry.ts` — 8 goal workflows with steps, questions, options
4. Individual orchestrators — dailyPriorities, playerPlacement, curriculumImprovement, reviewDecide
5. `processDonnaMessage.ts` Step 0a/0b — active session routing + goal intent detection
6. Short-phrase resolver — interprets "yes", "skip", "approve", "show evidence", "stop"
7. Navigation continuity — `updateSessionRoute()` preserves state on page change
