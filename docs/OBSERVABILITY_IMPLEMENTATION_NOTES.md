# Observability Implementation Notes

> Sprint 401 — Idempotency + Observability Foundation V1
> See also: `docs/debuggability-standard.md` for the full observability contract.

This document describes what was implemented in Sprint 401, how to use the new helpers, and what comes next.

---

## What Was Added

Two new utility modules:

### `src/lib/observability/requestTrace.ts`

Provides request ID generation and safe metadata normalization.

**Exports:**
- `createRequestId(prefix?: string): string` — generates a debug-readable request ID
- `getSafeRequestMeta(input: unknown): Record<string, unknown>` — extracts allowlisted safe fields from an object
- `nowIso(): string` — returns current timestamp as ISO string

### `src/lib/observability/logger.ts`

Provides a structured JSON logger with action-scoped binding.

**Exports:**
- `logInfo(event, meta?)` — logs at info level
- `logWarn(event, meta?)` — logs at warn level
- `logError(event, meta?)` — logs at error level
- `createActionLogger(baseMeta)` — returns `{ info, warn, error }` bound with baseMeta

---

## How to Create Request IDs

```ts
import { createRequestId } from '@/lib/observability/requestTrace'

const requestId = createRequestId('my-action')
// → "my-action_20260521_a3k7f2x"
```

The prefix should identify the action type. Examples:
- `createRequestId('wrap-up-draft')` → `wrap-up-draft_20260521_abc123`
- `createRequestId('transcribe')` → `transcribe_20260521_xyz789`
- `createRequestId('req')` → `req_20260521_jkl456` (default)

Request IDs are:
- Unique enough for single-server debugging
- Readable in log output without parsing
- Not globally unique — not suitable for distributed tracing across services

---

## How to Use `createActionLogger`

```ts
import { createRequestId } from '@/lib/observability/requestTrace'
import { createActionLogger } from '@/lib/observability/logger'

// At the top of the server action or route handler:
const requestId = createRequestId('my-action')
const log = createActionLogger({ action: 'myServerAction', requestId })

// Then throughout the action:
log.info('start', { sessionId, userId: user.id, academyId })

// On success:
log.info('success', { draftId: result.id })

// On failure:
log.error('db_error', { message: error.message })

// On security/auth failure:
log.warn('auth_failed', { userId: user.id })
```

Every log call automatically includes:
- `ts` — ISO timestamp
- `level` — `info`, `warn`, or `error`
- `event` — the event name
- Everything in `baseMeta` (action, requestId)
- Everything in the per-call `meta`

---

## Safe Logging Rules

### Fields ALLOWED in log records

| Field | Example value |
|---|---|
| `requestId` | `wrap-up-draft_20260521_abc123` |
| `action` | `saveWrapUpDraftAction` |
| `sessionId` | UUID |
| `academyId` | UUID |
| `userId` | UUID |
| `draftId` | UUID |
| `voiceNoteId` | UUID |
| `role` | `coach` |
| `size` | `148392` (bytes) |
| `mimeType` | `audio/webm` |
| `count` | `3` |
| `status` | `pending_review` |
| `provider` | `openai_whisper` |
| `model` | `whisper-1` |
| `latencyMs` | `1423` |
| `message` | Error message string (DB errors, not user content) |

### Fields FORBIDDEN in log records

| Field | Why forbidden |
|---|---|
| `transcript` | Player/coach voice content — L2 data |
| `notes` / `raw_input` | Session notes — L2 data |
| `email` / `phone` | Guardian/player PII — L3 data |
| `full_name` / `legal_name` | Player PII — L3 data |
| `payload` / `proposed_payload` | Full action payloads may contain L2/L3 data |
| `token` / `key` / `secret` | Credentials — L4 data |
| `audio` | Never stored or logged |
| `parent_summary` / `student_summary` | Player development content — L2 data |

---

## Examples: Good vs. Bad Logs

### Good — structured, safe, filterable

```json
{ "ts": "2026-05-21T14:32:01Z", "level": "info", "event": "transcription_success", "action": "transcribe", "requestId": "transcribe_20260521_abc", "sessionId": "uuid", "userId": "uuid", "size": 148392, "latencyMs": 1423 }
```

```json
{ "ts": "2026-05-21T14:32:02Z", "level": "error", "event": "proposed_action_failed", "action": "saveWrapUpDraftAction", "requestId": "wrap-up-draft_20260521_xyz", "sessionId": "uuid", "message": "insert or update on table violates foreign key constraint" }
```

### Bad — unstructured, leaks context

```ts
// BAD: free-form string, no requestId, leaks content
console.log(`[wrap-up] coach ${user.id} saved draft for session ${session.name}: ${JSON.stringify(answers)}`)
```

```ts
// BAD: logs full payload including notes
console.log('proposed action', JSON.stringify(proposedAction))
```

---

## Which Paths Were Instrumented in Sprint 401

| File | What was added |
|---|---|
| `saveWrapUpDraftAction.ts` | requestId, createActionLogger, start/success/error logs |
| `saveWrapUpAttendanceExceptionAction.ts` | requestId, createActionLogger, start/success/error logs |
| `transcribe/route.ts` | requestId, createActionLogger, all request lifecycle log points |
| `structureCoachRecapAction.ts` | requestId, createActionLogger, start/already-structured/success/error logs |

---

## Known Limitations

1. **No log drain** — logs go to stdout/stderr (Vercel function logs). No centralized search or alerting yet.
2. **No request correlation across services** — the requestId is local to one server action call. If a client retries, the retry gets a new requestId with no link to the original.
3. **No performance timing on non-AI paths** — only the transcribe route measures latency. Other actions have no timing instrumentation.
4. **No client-side error capture** — client-side React errors do not produce server log entries.
5. **`getSafeRequestMeta` is not used in this sprint** — it is present for future use when normalizing arbitrary input to log-safe metadata.

---

## Next Observability Steps

Planned for Sprint 402+:

1. Add AI call logging to `structureCoachRecapAction` and DONNA intelligence paths (model, token counts, latency)
2. Add timing instrumentation to the DONNA intelligence context builder
3. Add a global React error boundary that captures client errors and sends them to a server action log endpoint
4. Add performance timing to player profile loads
5. Evaluate log drain options (Vercel Log Drain → Axiom, Datadog, or Supabase pg_cron log table)
