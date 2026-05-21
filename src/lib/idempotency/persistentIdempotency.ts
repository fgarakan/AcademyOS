// Sprint 412 — Persistent Idempotency Design V1
// Types and patterns for DB-backed idempotency keys.
// No migration is included — this is a design contract for Sprint 420+.
//
// The in-process helpers in actionGuards.ts provide best-effort duplicate detection
// on a single serverless instance. This module defines the interface for the
// durable implementation that will use a Supabase table.
//
// Proposed table schema (Sprint 420+ migration):
//
//   CREATE TABLE idempotency_keys (
//     key         text PRIMARY KEY,
//     academy_id  uuid NOT NULL REFERENCES academies(id),
//     action      text NOT NULL,
//     result      jsonb,
//     created_at  timestamptz DEFAULT now(),
//     expires_at  timestamptz NOT NULL,
//     CONSTRAINT idempotency_keys_academy_fk CHECK (academy_id IS NOT NULL)
//   );
//   CREATE INDEX ON idempotency_keys (expires_at);
//   -- RLS: same academy only
//
// Server-side only.

export interface IdempotencyRecord {
  key: string
  academyId: string
  action: string
  result: unknown | null
  createdAt: string
  expiresAt: string
}

export type IdempotencyCheckResult =
  | { status: 'new' }
  | { status: 'duplicate'; record: IdempotencyRecord }
  | { status: 'error'; reason: string }

// Default TTL for idempotency keys: 24 hours.
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000

// Builds the expiry timestamp for a new idempotency key.
export function buildIdempotencyExpiry(ttlMs = IDEMPOTENCY_TTL_MS): string {
  return new Date(Date.now() + ttlMs).toISOString()
}

// Stub: when the idempotency_keys table exists, replace this with a real DB lookup.
// For now, always returns 'new' (no durable store available).
// This stub exists so callers can be written against the final interface today.
export async function checkIdempotencyKey(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _key: string,
): Promise<IdempotencyCheckResult> {
  return { status: 'new' }
}

// Stub: when the idempotency_keys table exists, replace this with a real DB insert.
export async function recordIdempotencyKey(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _record: Omit<IdempotencyRecord, 'createdAt'>,
): Promise<void> {
  // No-op until Sprint 420+ migration lands.
}

// Returns a user-visible message for a duplicate request.
export function duplicateIdempotencyMessage(): string {
  return 'This request was already processed. If you expected a new result, please try again after 24 hours.'
}
