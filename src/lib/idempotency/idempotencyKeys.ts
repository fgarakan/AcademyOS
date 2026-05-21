// Sprint 401 — Idempotency + Observability Foundation V1
// Idempotency key utilities. Uses Node built-in crypto only — no new packages.
// Server-side only — never import from client components.
//
// NOTE: These utilities create in-memory idempotency keys for logging and duplicate checks.
// True database-backed idempotency (idempotency_keys table with unique constraints)
// is the next phase — see docs/IDEMPOTENCY_IMPLEMENTATION_NOTES.md.

import { createHash } from 'crypto'

// Normalize a single key part to a safe, deterministic string.
// Complex objects are hashed rather than stringified to keep keys short and avoid PII leakage.
export function normalizeIdempotencyPart(value: unknown): string {
  if (value === null || value === undefined) return '_null'
  if (typeof value === 'string') return value.replace(/\s+/g, '_').slice(0, 200)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  // Hash complex/object values — never embed raw object content in a key
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 12)
}

// Create a deterministic idempotency key from an ordered list of identifying parts.
// The result is stable for the same inputs and safe to store in logs.
// Example: createIdempotencyKey(['attendance-exception', academyId, sessionId], 'idem')
export function createIdempotencyKey(parts: Array<unknown>, prefix = 'idem'): string {
  const normalized = parts.map(normalizeIdempotencyPart).join(':')
  const hash = createHash('sha256').update(normalized).digest('hex').slice(0, 16)
  return `${prefix}_${hash}`
}

// Create a short hash of string content (e.g., audio metadata, transcript length).
// Never used to hash full transcript or audio bytes in this sprint.
// Future: hash audio bytes for deduplication — see IDEMPOTENCY_IMPLEMENTATION_NOTES.md.
export function createContentHash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 24)
}
