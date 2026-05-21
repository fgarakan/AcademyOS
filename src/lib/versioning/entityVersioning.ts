// Sprint 411 — Entity Versioning + Optimistic Locking V1
// Helpers for optimistic locking using updated_at timestamps.
// Most AcademyOS tables have an updated_at column maintained by Supabase triggers.
// Server-side only.
//
// Pattern: before writing, read the current updated_at. Include it in the update
// condition. If the row was modified by another actor, the WHERE clause matches 0
// rows and the write is rejected.
//
// See docs/ENTITY_VERSIONING_NOTES.md for usage examples and caveats.

export interface OptimisticLockParams {
  expectedUpdatedAt: string
  currentUpdatedAt: string | null | undefined
}

export interface OptimisticLockResult {
  allowed: boolean
  reason?: 'stale_read' | 'missing_current'
}

// Returns true if the current row state matches the client's last-read state.
// If the row has been modified since the client read it, returns false.
export function checkOptimisticLock(params: OptimisticLockParams): OptimisticLockResult {
  if (!params.currentUpdatedAt) {
    return { allowed: false, reason: 'missing_current' }
  }
  const expected = Date.parse(params.expectedUpdatedAt)
  const current = Date.parse(params.currentUpdatedAt)
  if (isNaN(expected) || isNaN(current)) {
    return { allowed: false, reason: 'stale_read' }
  }
  if (current > expected) {
    return { allowed: false, reason: 'stale_read' }
  }
  return { allowed: true }
}

// Returns a user-visible error message for a stale-read conflict.
export function staleReadErrorMessage(entityLabel: string): string {
  return `${entityLabel} was updated by another user. Please refresh and try again.`
}

// Builds the Supabase filter condition for an optimistic lock check.
// Usage:
//   const { data, count } = await db
//     .from('players')
//     .update({ ... })
//     .eq('id', playerId)
//     .eq('updated_at', optimisticLockFilter(expectedUpdatedAt))
//     .select('id')
//
// If count === 0, the write was rejected due to a stale read.
export function optimisticLockFilter(expectedUpdatedAt: string): string {
  return expectedUpdatedAt
}

// Returns whether a write was rejected by an optimistic lock (0 rows affected).
export function wasOptimisticLockRejected(rowsAffected: number | null): boolean {
  return rowsAffected === 0
}
