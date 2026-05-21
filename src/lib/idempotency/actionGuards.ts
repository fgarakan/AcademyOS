// Sprint 401 — Idempotency + Observability Foundation V1
// Lightweight validation and duplicate-submission guard helpers.
// No external validation libraries — no new dependencies.
// Server-side only — never import from client components.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Validates that a value is a non-empty string. Throws with the field name on failure.
export function assertNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} must be a non-empty string.`)
  }
  return value.trim()
}

// Validates that a value looks like a UUID. Throws with the field name on failure.
export function assertUuidLike(value: unknown, fieldName: string): string {
  const str = assertNonEmptyString(value, fieldName)
  if (!UUID_RE.test(str)) {
    throw new Error(`${fieldName} must be a valid UUID.`)
  }
  return str
}

// Returns true if a previous write occurred within windowMs of now.
// Used for best-effort duplicate-submission detection when no DB unique constraint exists.
// Returns false if previousUpdatedAt is null/undefined/unparseable (safe default: allow).
export function isDuplicateSubmissionWindow(
  previousUpdatedAt?: string | null,
  windowMs = 10_000,
): boolean {
  if (!previousUpdatedAt) return false
  const prev = Date.parse(previousUpdatedAt)
  if (isNaN(prev)) return false
  return Date.now() - prev < windowMs
}

// Returns a consistent, user-visible message for duplicate submission rejections.
export function createDuplicateSubmissionMessage(actionName: string): string {
  return `A ${actionName} was just submitted. Please wait a moment before trying again.`
}
