# Entity Versioning and Optimistic Locking Notes

> Sprint 411 — Entity Versioning + Optimistic Locking V1
> See also: `docs/IDEMPOTENCY_IMPLEMENTATION_NOTES.md`, `docs/audit-log-strategy.md`

---

## What Was Created in Sprint 411

One new file: `src/lib/versioning/entityVersioning.ts`

### Exports

- `checkOptimisticLock(params)` — compare a client's `expectedUpdatedAt` against the DB's current `updated_at`
- `optimisticLockFilter(expectedUpdatedAt)` — returns the timestamp string for use in a Supabase `.eq('updated_at', ...)` filter
- `wasOptimisticLockRejected(rowsAffected)` — returns true if a write affected 0 rows (lock was lost)
- `staleReadErrorMessage(entityLabel)` — user-visible conflict message

---

## How Optimistic Locking Works in AcademyOS

Most tables have an `updated_at` column maintained by Supabase triggers.

**Read path:** The client reads a row and stores its `updated_at` timestamp.

**Write path:** The server action includes `updated_at` in the WHERE clause:
```sql
UPDATE players SET ... WHERE id = $1 AND updated_at = $2
```

If another actor modified the row between the read and the write, the timestamp won't match, and 0 rows are updated. The caller detects this via `rowsAffected === 0` and returns a conflict error to the user.

---

## Usage Pattern

```ts
import {
  checkOptimisticLock,
  wasOptimisticLockRejected,
  staleReadErrorMessage,
} from '@/lib/versioning/entityVersioning'

// Server action — update a player record
export async function updatePlayerLevelAction(
  playerId: string,
  newLevelId: string,
  expectedUpdatedAt: string, // from the client's last read
): Promise<{ ok: boolean; error?: string }> {
  const db = await getSupabaseServer()

  const { data, error, count } = await db
    .from('players')
    .update({ current_level_id: newLevelId })
    .eq('id', playerId)
    .eq('updated_at', expectedUpdatedAt)  // optimistic lock
    .select('id')

  if (error) return { ok: false, error: error.message }
  if (wasOptimisticLockRejected(data?.length ?? 0)) {
    return { ok: false, error: staleReadErrorMessage('Player record') }
  }
  return { ok: true }
}
```

---

## When to Apply Optimistic Locking

Apply to mutations where:
1. Two actors might edit the same record simultaneously (e.g., two coaches editing the same session plan)
2. The mutation is conditional on the current state (e.g., "only change level if still at X")
3. Stale writes could corrupt important state (e.g., player placement finalization)

**Do not apply to:**
- Append-only writes (audit logs, attendance records)
- Writes where last-write-wins is acceptable (e.g., updating a coach's own notes)

---

## Conflict Resolution

When a stale-read conflict is detected:
1. Return `{ ok: false, error: staleReadErrorMessage(entityLabel) }` to the client
2. Do NOT retry automatically — the user must review the current state first
3. Log the conflict to observability: `log.warn('optimistic_lock_conflict', { playerId, expectedUpdatedAt })`

The user experience: a toast appears saying "Player record was updated by another user. Please refresh and try again."

---

## Entity Versioning (Snapshot-Based)

For audit and rollback purposes, the `take_snapshot()` PostgreSQL function captures the full row state as JSON.

This is already implemented in `supabase/migrations/011_audit_versioning.sql`.

Future sprint: wire `take_snapshot()` into the server-side audit helper so every major mutation automatically captures a before/after snapshot in `audit_logs.payload`.
