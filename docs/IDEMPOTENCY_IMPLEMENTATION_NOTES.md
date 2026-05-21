# Idempotency Implementation Notes

> Sprint 401 — Idempotency + Observability Foundation V1
> See also: `docs/ai-action-safety.md` for the AI action safety contract.

This document describes idempotency in AcademyOS: what was implemented, where best-effort duplicate protection was added, and where true database-backed idempotency is still needed.

---

## What Idempotency Means in AcademyOS

An operation is idempotent if calling it twice with the same inputs produces the same result as calling it once. In AcademyOS, idempotency matters most for:

1. **Proposed action creation** — a double-click or network retry must not create two draft rows for the same user action
2. **Voice transcript structuring** — a transcript must not produce two proposed_action rows
3. **Attendance exceptions** — a coach must not accidentally submit two exception reports for the same session
4. **AI calls** — a retried DONNA request must not produce a second proposed_action when the first succeeded

---

## What Was Added in Sprint 401

### `src/lib/idempotency/idempotencyKeys.ts`

Provides deterministic key generation using Node built-in `crypto`.

**Exports:**
- `normalizeIdempotencyPart(value)` — converts any value to a safe, deterministic string fragment
- `createIdempotencyKey(parts[], prefix?)` — builds a stable, hashed key from ordered parts
- `createContentHash(input)` — short SHA-256 hash of a string

**Usage:**
```ts
import { createIdempotencyKey } from '@/lib/idempotency/idempotencyKeys'

const key = createIdempotencyKey(
  ['attendance-exception', academyId, sessionId, userId],
  'idem'
)
// → "idem_a3f8c2b1e4d5f678" (stable for same inputs)
```

These keys are currently used for logging only. They are not yet stored in the database.

### `src/lib/idempotency/actionGuards.ts`

Provides validation and duplicate-window helpers.

**Exports:**
- `assertNonEmptyString(value, fieldName)` — throws with field name if value is not a non-empty string
- `assertUuidLike(value, fieldName)` — throws with field name if value is not UUID-shaped
- `isDuplicateSubmissionWindow(previousUpdatedAt?, windowMs?)` — returns true if a previous write was within `windowMs` of now
- `createDuplicateSubmissionMessage(actionName)` — returns a consistent user-visible message for duplicate rejections

---

## Where Best-Effort Duplicate Protection Was Added

### `saveWrapUpDraftAction.ts` — 30-second window

Before creating any database rows, the action queries `proposed_actions` for a recent row matching:
- `academy_id` = current academy
- `proposed_by_id` = current user
- `target_module` = `'session_wrap_up_v1'`
- `target_object_id` = sessionId
- `created_at` >= now − 30 seconds

If found, the action returns a user-visible rejection message and creates no new rows. This prevents double-click submission without requiring a database unique constraint.

**Limitation:** A 30-second window means a coach who genuinely needs to re-submit (e.g., corrected a mistake) must wait 30 seconds. This is intentional — wrap-up drafts are low-frequency, director-reviewed actions.

### `saveWrapUpAttendanceExceptionAction.ts` — 15-second window

Same pattern with a 15-second window, matching on `target_module = 'attendance_exception'`. Shorter window because coaches may legitimately re-submit attendance exceptions for a session across different unrostered attendees.

### `structureCoachRecapAction.ts` — `processing_status` guard (pre-existing)

This action already had the correct idempotency mechanism: it checks `voice_notes.processing_status === 'structured'` before proceeding. If the voice note was already structured, it returns a rejection immediately without creating a second proposed_action row. Sprint 401 added logging around this guard to make it visible in the log stream.

This is the strongest form of idempotency currently in the codebase — the guard is based on durable database state, not a time window.

---

## Where True DB-Backed Idempotency Is Still Needed

The Sprint 401 time-window guards are best-effort. They do not protect against:
- Concurrent requests from two browser tabs
- Network-layer retries that arrive after the window expires
- Server restarts that clear in-memory state

True idempotency requires database-level enforcement. The following are the recommended next steps.

### Recommended Future Table: `idempotency_keys`

```sql
CREATE TABLE idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  key text NOT NULL,
  result_payload jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  UNIQUE (academy_id, key)
);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
```

Usage pattern:
1. Before executing a write, INSERT the idempotency key with `ON CONFLICT DO NOTHING`.
2. If 0 rows inserted, the key already exists — return the stored `result_payload`.
3. If 1 row inserted, proceed with the write and UPDATE `result_payload` on completion.

This eliminates all race conditions that the time-window approach cannot prevent.

### Recommended Future Constraints

#### `proposed_actions` — duplicate voice note guard

If `voice_command_id` maps 1:1 to a `proposed_actions` row, add:
```sql
ALTER TABLE proposed_actions ADD CONSTRAINT proposed_actions_voice_command_id_key UNIQUE (voice_command_id);
```
This prevents two proposed_actions from sharing the same voice_command origin, closing the idempotency gap in `structureCoachRecapAction` for concurrent requests.

#### Attendance exception uniqueness

The `proposed_actions` table does not currently have a constraint preventing two identical attendance exceptions for the same session. A future partial unique index would close this:
```sql
CREATE UNIQUE INDEX proposed_actions_attendance_exc_pending_idx
  ON proposed_actions (academy_id, proposed_by_id, target_module, target_object_id)
  WHERE status = 'pending_review' AND target_module = 'attendance_exception';
```
This prevents duplicate pending exceptions for the same session/user, while allowing re-submission after the original is approved or rejected.

#### Template edit optimistic locking

Template and session_block edits should use `updated_at`-based optimistic locking:
```sql
-- Server action would: UPDATE ... SET ... WHERE id = $1 AND updated_at = $2
-- If 0 rows updated → conflict (another update happened first)
```
This pattern is not yet implemented. The `isDuplicateSubmissionWindow` helper in `actionGuards.ts` supports this pattern once it is wired up.

#### Voice/audio hash deduplication

The transcribe route currently has no protection against submitting the same audio file twice. Future protection:
1. Hash the audio bytes (SHA-256) on receipt
2. Check the hash against a recent `voice_transcripts` record for the same session
3. Return the existing transcript if matched

The `createContentHash` utility in `idempotencyKeys.ts` is ready for this purpose. The implementation is blocked on defining the audio hash column in `voice_transcripts`.

---

## What Was Intentionally Not Implemented in Sprint 401

| Feature | Reason not implemented |
|---|---|
| `idempotency_keys` table | Migration not in scope for this sprint |
| `proposed_actions.voice_command_id` unique constraint | Migration not in scope |
| Attendance exception partial unique index | Migration not in scope |
| Audio content hash deduplication | Requires `voice_transcripts` schema change |
| Template optimistic locking | Requires wiring across all template edit actions |
| Rate limiting | Separate sprint (Sprint 402) |
| Background job queue for retry logic | Separate sprint (Sprint 404+) |

All of the above are documented here so the next sprint can pick them up with full context.

---

## Summary: Current vs. Planned Idempotency State

| Path | Current protection | Strength | Planned upgrade |
|---|---|---|---|
| `saveWrapUpDraftAction` | 30s time-window query | Weak (race-prone) | `idempotency_keys` table |
| `saveWrapUpAttendanceExceptionAction` | 15s time-window query | Weak (race-prone) | Partial unique index on proposed_actions |
| `structureCoachRecapAction` | `processing_status='structured'` DB guard | Strong | `voice_command_id` unique constraint |
| `transcribe` route | None (audio is stateless) | None | Audio content hash deduplication |
| DONNA proposed_action creation | None | None | `idempotency_keys` table |
| Template edits | None | None | `updated_at` optimistic locking |
