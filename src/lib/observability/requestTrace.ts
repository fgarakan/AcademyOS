// Sprint 401 — Idempotency + Observability Foundation V1
// Lightweight request tracing utilities. No external dependencies.
// Server-side only — never import from client components.

// Produces a debug-readable ID that survives log filtering.
// Not globally unique — sufficient for single-request tracing and debugging.
// Upgrade to crypto.randomUUID() in a future sprint if cross-service correlation is needed.
export function createRequestId(prefix = 'req'): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 9)
  return `${prefix}_${date}_${rand}`
}

// Allowlisted keys safe to include in log records.
// Prevents accidental logging of transcript text, payloads, tokens, or PII.
const SAFE_KEYS = [
  'requestId', 'action', 'sessionId', 'academyId', 'userId', 'role',
  'size', 'mimeType', 'count', 'draftId', 'voiceNoteId', 'windowMs',
  'module', 'status', 'provider', 'model', 'latencyMs',
] as const

export function getSafeRequestMeta(input: unknown): Record<string, unknown> {
  if (input === null || input === undefined) return {}
  if (typeof input !== 'object' || Array.isArray(input)) return {}
  const obj = input as Record<string, unknown>
  const safe: Record<string, unknown> = {}
  for (const key of SAFE_KEYS) {
    if (!(key in obj) || obj[key] === undefined) continue
    const val = obj[key]
    safe[key] = typeof val === 'string' ? val.slice(0, 200) : val
  }
  return safe
}

export function nowIso(): string {
  return new Date().toISOString()
}
