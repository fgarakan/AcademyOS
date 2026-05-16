# Review Execution Adapter Architecture — Sprint 485

**Scope:** DONNA COO Intelligence Block — Sprints 485–510
**Date:** 2026-05-16
**Purpose:** Define the execution adapter contract before any adapter is built. Map every `ReviewItemTargetModule` to its pre-conditions, post-conditions, and build readiness.

---

## Operating Model

```
Director approves proposed_action
       ↓
execute_approved_action() [protected function]
       ↓
Adapter resolves: targetModule → adapter
       ↓
Adapter pre-condition check
       ↓
Adapter writes record + audit_log
       ↓
Adapter returns ExecutionResult
```

**Non-negotiable safety rule:** No adapter may run unless both conditions are true:
1. `proposed_action.status === 'approved'`
2. `proposed_action.director_id` is set (not null)

This is enforced by `execute_approved_action()` — adapters never call this guard themselves.

---

## Core Interface

```typescript
// Input to every adapter
interface ApprovedActionInput {
  proposedActionId: string
  targetModule: ReviewItemTargetModule
  actionType: 'create_draft'
  payload: Record<string, unknown>
  approvedByDirectorId: string
  approvedAt: string
  sessionId: string
  academyId: string
}

// Output from every adapter
interface ExecutionResult {
  success: boolean
  targetModule: ReviewItemTargetModule
  proposedActionId: string
  recordId: string | null          // the created/updated record ID if applicable
  message: string
  auditLogId: string | null
  executionApplied: true           // always true on success
  rollbackAvailable: boolean
  errors: string[]
}
```

---

## Adapter Map

### 1. `attendance_exception`

**Purpose:** Create an absence or unrostered-attendee exception record for director review.

**Pre-conditions:**
- `payload.sessionId` exists and matches a known session
- `payload.exceptionType` is `'absence'` or `'unrostered_attendee'`
- `payload.playerName` is non-empty
- Session attendance window is still open (configurable — default: 48h after session)

**Post-conditions:**
- Creates record in `attendance_exceptions` (or equivalent) table
- Writes to `audit_logs` with `action_type: 'attendance_exception_created'`
- Does NOT mark official attendance — creates an exception note only

**Safety constraints:**
- Does not modify `session_attendance` official records
- Does not change player roster
- Can be reversed: `rollbackAvailable: true`

**Build readiness:** DEFERRED — requires `attendance_exceptions` table. Not built in this sprint block.

---

### 2. `session_wrap_up_v1`

**Purpose:** Write the coach's session actual summary to the session record.

**Pre-conditions:**
- `payload.sessionId` exists
- `payload.completedAsPlanned` (boolean) is present
- Session is in a state that allows wrap-up (not already finalized)

**Post-conditions:**
- Updates `daily_sessions` wrap-up fields: `completed_as_planned`, `modifications`, `coach_notes`
- Writes to `audit_logs` with `action_type: 'session_wrap_up_submitted'`

**Safety constraints:**
- Idempotent: second write with same sessionId should upsert, not duplicate
- Cannot overwrite a wrap-up that was already marked `finalized: true`
- Can be reversed within the session window: `rollbackAvailable: true`

**Build readiness:** DEFERRED — requires schema field verification and migration. Not built in this sprint block.

---

### 3. `coach_observation`

**Purpose:** Create a coach observation note on a player profile for director review.

**Pre-conditions:**
- `payload.playerName` or `payload.playerId` present
- `payload.observation` non-empty
- `payload.observationType` valid (`positive`, `needs_attention`, `neutral`)
- `payload.visibility` set

**Post-conditions:**
- Creates record in `coach_notes` table with `status: 'pending_review'`
- Does NOT write to `player_development_profile` directly
- Does NOT expose to parent
- Writes to `audit_logs` with `action_type: 'coach_observation_created'`

**Safety constraints:**
- `profileMutationApplied: false` until director promotes to profile
- Parent visibility requires a second explicit director approval
- Player level is NOT moved automatically

**Build readiness:** PARTIALLY READY — `coach_notes` table likely exists. Adapter can be built once director approval UX is in place (Sprint 489).

---

### 4. `parent_update`

**Purpose:** Create a parent-facing message draft for director to review and send.

**Pre-conditions:**
- `payload.playerName` non-empty
- `payload.description` non-empty (min 20 chars recommended)
- `payload.urgency` set

**Post-conditions:**
- Creates record in `parent_messages` (or equivalent) with `status: 'draft'`
- Does NOT send the message
- Does NOT expose to parent portal
- Writes to `audit_logs` with `action_type: 'parent_message_draft_created'`

**Safety constraints:**
- `sendApplied: false` at all times during draft phase
- Director must explicitly trigger send — adapter never sends
- Message content is subject to director edit before send

**Build readiness:** DEFERRED — requires `parent_messages` table and parent portal integration. First touched in Sprint 486.

---

### 5. `director_follow_up`

**Purpose:** Create a director-facing internal follow-up note.

**Pre-conditions:**
- `payload.description` non-empty
- `payload.urgency` set

**Post-conditions:**
- Creates record in director follow-up queue (table TBD)
- Writes to `audit_logs` with `action_type: 'director_followup_created'`

**Safety constraints:**
- Internal only — not visible to coach, parent, or player
- Not a communication send

**Build readiness:** DEFERRED — requires director queue table. Targeted for Sprint 485+.

---

### 6. `coach_follow_up`

**Purpose:** Create a coaching-side reminder or action item.

**Pre-conditions:**
- `payload.description` non-empty

**Post-conditions:**
- Creates record in coach task queue (table TBD)
- Writes to `audit_logs`

**Safety constraints:**
- Internal to coaching staff only

**Build readiness:** DEFERRED.

---

### 7. `player_support`

**Purpose:** Create a player support referral or note.

**Pre-conditions:**
- `payload.playerName` non-empty
- `payload.description` non-empty

**Post-conditions:**
- Creates record in player support queue (table TBD)
- Writes to `audit_logs`

**Safety constraints:**
- Does NOT move player level
- Does NOT trigger parent notification without director approval

**Build readiness:** DEFERRED.

---

### 8. `admin_note`

**Purpose:** General administrative catch-all note.

**Pre-conditions:**
- `payload.description` non-empty

**Post-conditions:**
- Creates record in admin notes (table TBD)
- Writes to `audit_logs`

**Safety constraints:**
- Lowest-risk adapter — no player, parent, or session mutation

**Build readiness:** DEFERRED.

---

## Build Readiness Summary

| Module | Sprint to Build | Readiness Now |
|---|---|---|
| `attendance_exception` | 488 | DEFERRED — needs table |
| `session_wrap_up_v1` | 490 | DEFERRED — needs schema check |
| `coach_observation` | 489 | PARTIALLY READY |
| `parent_update` | 486 | DEFERRED — needs table |
| `director_follow_up` | 485+ | DEFERRED |
| `coach_follow_up` | 485+ | DEFERRED |
| `player_support` | 485+ | DEFERRED |
| `admin_note` | 485+ | DEFERRED |

**No adapter is built in Sprint 485.** This sprint establishes the contract only.

---

## What Gets Built First (Sprint 486–494)

| Sprint | Target |
|---|---|
| 486 | Parent draft approval state (UI, no send) |
| 487 | Level readiness approval state (UI, no level move) |
| 488 | Attendance exception approval state (UI, no official write) |
| 489 | Coach observation application preview (UI) |
| 490 | Session actual application preview (UI) |
| 491 | Review queue: approved vs applied separation (UI) |
| 492 | Audit trail surface placeholder (UI) |
| 493 | Execution guardrail copy system (UI copy strings) |
| 494 | Review execution regression (QA) |

---

## Invariants (never violated)

1. `execute_approved_action()` is the ONLY function that triggers any adapter.
2. No adapter runs without `status === 'approved'` AND `director_id` set.
3. Every adapter writes to `audit_logs` before returning.
4. Every `ExecutionResult` carries `executionApplied: true` on success.
5. `proposed_action.status` progresses: `pending_review` → `approved` → `applied`. Never backwards.
6. No adapter sends communications. Communication sends are a separate, explicitly gated system.
