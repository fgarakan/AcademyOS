# Safe Execution Adapter Architecture Audit — Sprint 562

**Date:** 2026-05-17
**Sprint:** 562 — Safe Execution Adapter Architecture Audit V1

---

## Purpose

This document maps which draft/review items can eventually become official records and defines what adapter is required for each path. No execution occurs until each adapter is explicitly built, tested, and approved.

---

## Adapter Map

### 1. Wrap-Up Draft → Official Session Record

| Field | Current Status | Adapter Required | Blocker |
|---|---|---|---|
| Session summary text | Draft in `proposed_actions` | `applyWrapUpDraftAction` (partially built) | None — path exists |
| Attendance notation | Draft text only | Attendance write adapter | Schema: `session_attendance` needs player rows |
| Block completion notes | Draft text only | Session block update adapter | Schema: `session_blocks.actual_notes` column |
| Standout observations | Draft text → `coach_observations` | Observation write adapter | Schema exists; adapter needed |
| Follow-up notes | Draft text → `proposed_actions` | Review queue entry | No blocker |

**Adapter safety level:** MEDIUM — requires director review before apply

### 2. Coach Observation Draft → Player Profile Note

| Field | Current Status | Adapter Required | Blocker |
|---|---|---|---|
| Observation text | Draft in `proposed_actions` | `applyObservationDraftAction` | None — schema exists |
| Observation type (concern/positive) | In draft | Same adapter | None |
| Player link | In draft | Same adapter | None |
| Parent-visible flag | Draft only | Separate parent publication adapter | External send not yet built |

**Adapter safety level:** LOW — observation is internal until parent-visible flag set

### 3. Attendance Exception Draft → Official Attendance Record

| Field | Current Status | Adapter Required | Blocker |
|---|---|---|---|
| Exception type | Draft in `proposed_actions` | Attendance exception apply adapter | Requires session_attendance row |
| Player | In draft | Same | None |
| Absence reason | In draft | Same | None |

**Adapter safety level:** HIGH — attendance is official record; requires director explicit approval

### 4. Parent Update Draft → Sent Communication

| Field | Current Status | Adapter Required | Blocker |
|---|---|---|---|
| Draft text | Draft in `proposed_actions` | Parent communication send adapter | External send not built |
| Director approval | Internal state | Internal approval workflow (built) | None |
| Actual send | BLOCKED | Send adapter | External comms integration not built |

**Adapter safety level:** CRITICAL — external send; blocked intentionally until integration is approved

### 5. Level Readiness Flag → Player Level Change

| Field | Current Status | Adapter Required | Blocker |
|---|---|---|---|
| Readiness assessment | Draft in `proposed_actions` | Level change adapter | Requires `finalize_player_placement` pattern |
| Director approval | Required | Director review + approval | None |
| Actual level change | BLOCKED | Uses `finalize_player_placement()` | Protected function — never bypassed |

**Adapter safety level:** CRITICAL — protected. Only `finalize_player_placement()` can change level.

### 6. Curriculum Override Draft → Curriculum Record

| Field | Current Status | Adapter Required | Blocker |
|---|---|---|---|
| Override target | Draft in `proposed_actions` | Curriculum override apply adapter | Template immutability rules apply |
| Director approval | Required | Director review | None |
| Rollback | Not built | Rollback adapter | Needed before any apply |

**Adapter safety level:** HIGH — curriculum templates are protected; session-level only changes allowed

---

## Execution Safety Hierarchy

```
CRITICAL (never without explicit human approval + protected function):
  → Level movement (finalize_player_placement only)
  → Parent send (external integration required)

HIGH (director approval required before apply):
  → Attendance exception writes
  → Curriculum override applies

MEDIUM (director review + approval before apply):
  → Wrap-up drafts → session records
  → Coach observation → player profile

LOW (head coach or director can apply):
  → Internal notes
  → Follow-up flagging (no external effect)
```

---

## What Is NOT an Adapter Problem

- DONNA conversation messages → in-memory only, no adapter needed
- Voice transcripts → in-memory only, no adapter needed
- COO answer engine outputs → read-only, no adapter needed
- NBA rankings → read-only, no adapter needed
- Review queue signals → display only, no adapter needed

---

## Adapter Build Priority (for future sprints)

1. `applyWrapUpDraftAction` — partially built in Sprint 532; needs completion
2. `applyObservationDraftAction` — schema ready; adapter not built
3. Attendance exception apply adapter — schema exists; adapter not built
4. Level readiness → `finalize_player_placement` routing — protected; needs director approval flow
5. Parent send adapter — BLOCKED until external integration approved
6. Curriculum override apply adapter — BLOCKED until rollback preview built
