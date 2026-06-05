# DONNA Goal Completion Approval Boundaries V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2216–2240 — DONNA Goal Completion Engine V1

---

## Core Rule

> DONNA may recommend, draft, guide, and summarize.
> DONNA may NOT silently approve, silently publish, or silently modify official records.
> Human approval is required for all mutations.

---

## Safe Actions (DONNA can do without approval)

These actions are read-only or produce drafts that are not persisted until the
director explicitly approves them in the Review Center.

| Action | Where Used |
|---|---|
| Navigate to a relevant page | All workflows |
| Open a player profile | Player Placement |
| Summarize a review item | Review & Decide |
| Show evidence for a recommendation | Player Placement, Curriculum |
| Explain why an item is the top priority | Daily Priorities |
| Build a draft recommendation | Curriculum Improvement |
| Prepare an approval draft in session memory | All workflows |
| Mark a workflow step complete in session state | All workflows |
| Suggest drills from the curriculum library | Curriculum Improvement |
| Count pending items | Review & Decide, Recaps |
| Rank items by risk/impact | Review & Decide |
| Identify most blocked curriculum level | Curriculum Improvement |
| Identify top priority from attention queue | Daily Priorities |

---

## Requires Human Approval (DONNA must stop and ask)

These actions modify official records or trigger downstream execution.
DONNA presents the action and waits for the director to say "approve" or equivalent.

| Action | Approval Path | Note |
|---|---|---|
| Approve player placement | `finalize_player_placement()` | Only path to activate a player |
| Change player curriculum level | `assignCurriculumAction()` | Director action only |
| Approve review queue item | `execute_approved_action()` | Only execution path for approved items |
| Reject review queue item | Update `proposed_actions.status` | Records director decision |
| Apply curriculum change | Review & Decide → approval | High-risk → Review & Decide queue |
| Publish parent communication | Review & Decide → approval | Nothing sent without director sign-off |
| Approve coach recap | `updateWrapUpDraftDecisionAction()` | Applies session notes + attendance |
| Add curriculum drill | Review & Decide → approval | Draft only until approved |
| Edit curriculum requirement | Review & Decide → approval | Draft only until approved |
| Move player to new level | Director explicit action | Never automatic |
| Delete any official record | Director explicit action | Not available in guided mode |

---

## Workflow-Specific Boundaries

### Daily Priorities Workflow
- DONNA may: identify priorities, explain them, navigate, start sub-workflows
- DONNA may NOT: auto-start any approval-gated action without asking
- Boundary phrase: "Would you like me to walk you through it now?"

### Player Placement Workflow
- DONNA may: show pending players, summarize recommendation, show evidence
- DONNA may NOT: call `finalize_player_placement()` without director saying "approve"
- Boundary phrase: "Would you like to approve, review evidence, adjust, or skip?"

### Curriculum Improvement Workflow
- DONNA may: identify bottlenecks, build draft plans, navigate to curriculum
- DONNA may NOT: save curriculum changes, publish to coaches, change gates
- Boundary phrase: "Would you like to approve this draft, adjust, or defer?"
- High-risk changes (gate edits, requirement changes): go to Review & Decide queue

### Review & Decide Workflow
- DONNA may: count items, rank by risk, summarize, navigate to review queue
- DONNA may NOT: call `execute_approved_action()` without director saying "approve"
- Boundary phrase: "Would you like to approve, edit, reject, or skip?"

### Onboarding Completion Workflow
- DONNA may: identify incomplete steps, navigate, explain why each step matters
- DONNA may NOT: save any configuration, activate accounts
- Boundary phrase: "Would you like to complete this step now?"

### Academy Health Action Workflow
- DONNA may: identify KPI signals, explain health issues, navigate to KPI dashboard
- DONNA may NOT: change configuration, modify assignments
- Boundary phrase: "Would you like to investigate and take action?"

---

## Enforcement Points

All approval boundaries are enforced at two levels:

**1. DONNA Response Layer**
DONNA always asks a question at approval-gated steps. The question is one of:
- "Would you like to approve?"
- "Would you like me to walk you through it?"
- "Does this look right to approve?"

DONNA does NOT call approval actions speculatively.

**2. Server Action Layer**
Every approval-gated action goes through:
- `proposed_actions` table with `status = 'pending_review'`
- `execute_approved_action()` RPC for execution
- `audit_logs` write for all mutations

No DONNA workflow bypasses these layers.

---

## Navigation Continuity and Approval State

When DONNA navigates to a new page during a workflow:
- The `GoalCompletionSession` state is preserved in sessionStorage
- The approval boundary is NOT reset — DONNA resumes at the same step
- The director does not need to re-confirm what they were doing
- If the director navigates away manually (not via DONNA), session state is preserved
  for up to 6 hours (TTL of `GoalCompletionStack`)

---

## Paused Workflow Boundaries

When a workflow is paused (director said "not now" or a new workflow interrupted):
- The paused session's pending approval state is preserved
- The director can resume and the boundary question is asked again
- Paused approval drafts are NOT auto-executed while paused
- Maximum paused sessions: unlimited in the stack (LIFO order)
