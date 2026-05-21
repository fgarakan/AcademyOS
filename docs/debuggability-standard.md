# Debuggability Standard

> Part of the Trust Stack — see `trust-stack.md` for the root doctrine.
> Layer 7: Logs explain.

This document defines the observability contract for AcademyOS. A system is debuggable if any production incident can be reconstructed from its logs alone, without reading source code or querying production data directly.

---

## The Standard

Any AcademyOS production incident must be diagnosable by answering these five questions from log data alone:

1. **Who did what?** (actor_id, role, action)
2. **To which entity?** (entity_type, entity_id, academy_id)
3. **When did it happen?** (created_at, latency_ms)
4. **What was the state before and after?** (payload_before, payload_after)
5. **Did it succeed?** (success flag, error message if not)

If any of these questions cannot be answered from the logs, the instrumentation is incomplete.

---

## Error Handling Pattern

Every server action and API route must produce a structured error object — never a naked `throw` that surfaces a stack trace to the client.

```ts
// Required pattern
type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }

// Usage
async function updatePlayerPriority(input: Input): Promise<ActionResult<Priority>> {
  try {
    // ... operation
    return { data: result, error: null }
  } catch (err) {
    console.error('[updatePlayerPriority]', err)
    return { data: null, error: 'Failed to update priority. Please try again.' }
  }
}
```

Rules:
- Never return a raw PostgreSQL error message to the client.
- Always log the raw error server-side with a function tag (`[functionName]`).
- Return a user-safe message to the client.
- Distinguish between user errors (input validation failures) and system errors (unexpected exceptions).

---

## Server Action Logging Tags

Every server action must include a structured log prefix for filtering. Format:

```
[module/action] context
```

Examples:
```
[voice/structureTranscript] player=uuid-xxx academy=uuid-yyy
[players/updatePriority] player=uuid-xxx actor=uuid-yyy
[donna/proposeAction] action_type=update_player_note proposal=uuid-zzz
```

This format ensures logs are filterable by module and action type without parsing free-form text.

---

## AI Call Logging

Every call to an external AI service must be logged before the call and after, regardless of outcome. The two-phase approach ensures that a hanging API call (no response) is distinguishable from a rejected call (immediate error).

**Before call:**
```ts
console.log('[anthropic/structureNote] starting', {
  actor_id: session.profileId,
  academy_id: session.academyId,
  model: MODEL_ID,
  input_length: transcript.length,
})
```

**After call (success):**
```ts
console.log('[anthropic/structureNote] complete', {
  actor_id: session.profileId,
  input_tokens: usage.input_tokens,
  output_tokens: usage.output_tokens,
  latency_ms: Date.now() - startTime,
  success: true,
})
```

**After call (failure):**
```ts
console.error('[anthropic/structureNote] failed', {
  actor_id: session.profileId,
  error: err.message,
  latency_ms: Date.now() - startTime,
  success: false,
})
```

---

## Database Query Error Logging

Supabase client queries return `{ data, error }`. Errors must be logged when they occur, not silently ignored.

```ts
// Required pattern
const { data, error } = await db.from('players').select('*').eq('id', playerId).single()
if (error) {
  console.error('[players/fetch] DB error', { playerId, message: error.message, code: error.code })
  return { data: null, error: 'Player not found.' }
}
```

Never write:
```ts
const { data } = await db.from('players')... // discards error silently
```

---

## Proposed Action Pipeline Observability

The proposed_action pipeline has four state transitions that must each be logged:

| State transition | Log tag | Required fields |
|---|---|---|
| created | `[proposed_actions/create]` | action_type, actor_id, academy_id, proposal_id |
| approved | `[proposed_actions/approve]` | proposal_id, approver_id, action_type |
| rejected | `[proposed_actions/reject]` | proposal_id, rejector_id, action_type, reason |
| executed | `[proposed_actions/execute]` | proposal_id, executor_id, action_type, success |

Every transition also writes to `audit_logs`. The console log is the real-time signal; the audit log is the durable record.

---

## Voice Pipeline Observability

The voice pipeline has distinct phases, each requiring a log entry:

| Phase | Log tag | Required fields |
|---|---|---|
| Session opened | `[voice/sessionStart]` | session_id, actor_id, academy_id |
| Audio uploaded | `[voice/audioReceived]` | session_id, file_size_bytes |
| Transcription requested | `[voice/transcribeStart]` | session_id, model |
| Transcription complete | `[voice/transcribeComplete]` | session_id, transcript_length, latency_ms |
| Structuring requested | `[voice/structureStart]` | session_id, transcript_id, model |
| Structuring complete | `[voice/structureComplete]` | session_id, proposed_action_ids[] |
| Session closed | `[voice/sessionEnd]` | session_id, duration_ms, outcome |

Any phase that fails must produce a log entry with `success: false` and the error message.

---

## What "Silent Failure" Looks Like

These are the most dangerous patterns to avoid:

```ts
// Silent failure — error discarded
const { data } = await db.from('players')...

// Silent failure — empty catch
try { await doThing() } catch {}

// Silent failure — undefined check without log
if (!player) return null

// Silent failure — console.log that omits context
console.log('error', err) // missing actor, entity, academy
```

Each of these produces a log gap — a moment in production that cannot be reconstructed.

---

## Client-Side Error Boundaries

Every major page section must have a React error boundary or a suspense fallback that:
1. Shows the user a recoverable error state (not a blank screen).
2. Does not expose internal error details to the client.
3. Logs the error to the server via a Server Action (planned — not yet implemented).

The current state has no global client-side error boundary. Adding one is a Sprint 401 target.

---

## Performance Observability

Currently no performance timing exists in the application. The planned instrumentation points are:

| Measurement | Where | Purpose |
|---|---|---|
| DONNA intelligence request latency | Server action | Cost + SLA monitoring |
| KPI engine computation time | KPI service | Identify expensive requests |
| Database query latency for player profile loads | Server component | Detect N+1 regressions |
| Voice transcription end-to-end latency | Voice pipeline | User experience monitoring |

These will be added in the Sprint 401 observability sprint.

---

## What Debuggability Is Not

- It is not verbose logging of every SQL statement.
- It is not logging data that belongs in the audit log (use audit_logs for mutations).
- It is not logging L3 data (guardian email, phone) in console output.
- It is not adding `console.log` debugging statements and forgetting to remove them.

Logs should be structured, minimal, and purposeful. Every log line should be there because someone will read it when something goes wrong.
