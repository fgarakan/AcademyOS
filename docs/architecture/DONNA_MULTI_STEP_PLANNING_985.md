# DONNA Multi-Step Planning V1 — Sprint 985

**Date:** 2026-05-30
**Sprint:** 985
**Status:** Implemented — TypeScript clean

---

## Purpose

Sprint 985 gives DONNA the ability to outline complete multi-step workflow plans before the director begins, so they know what to expect and can choose to proceed.

## V1 Workflows

| ID | Title | Steps | Est. Minutes |
|---|---|---|---|
| `onboard_new_player` | Onboard New Player | 4 | 9 |
| `run_session_cycle` | Run Session Cycle | 4 | 12 |
| `review_pending_queue` | Clear Review Queue | 4 | 21 |
| `update_curriculum` | Update Curriculum | 4 | 13 |
| `create_class_template` | Create Class Template | 4 | 12 |
| `assign_coach_to_session` | Assign Coach to Session | 3 | 3 |

## Key API

- `getWorkflowPlan(id)` — returns full plan with steps
- `detectWorkflowIntent(text)` — detects which workflow the director is asking about
- `formatWorkflowPlan(plan)` — formats as DONNA response text
- `getAllWorkflowPlans()` — returns all 6 plans

## Safety Guarantees

- No plan step executes automatically
- Steps requiring approval are flagged with `requiresApproval: true`
- `requiresDirectorApprovalAt` array lists which step numbers need approval
- Plans are informational — director must take each step explicitly
