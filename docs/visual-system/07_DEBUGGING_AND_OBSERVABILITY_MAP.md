# Debugging and Observability Map

**Last updated:** Sprint 402
**Audience:** Engineering, on-call
**Purpose:** Shows how to trace, debug, and understand failures in AcademyOS using the Sprint 401 observability foundation.
**Related code:** `src/lib/observability/`, `src/lib/idempotency/`
**Related docs:** `docs/debuggability-standard.md`, `docs/OBSERVABILITY_IMPLEMENTATION_NOTES.md`, `docs/IDEMPOTENCY_IMPLEMENTATION_NOTES.md`
**When to update:** When new instrumentation paths are added, when log formats change.

---

## Five-Question Incident Diagnostic

For any production incident, the log record must answer:

```mermaid
graph TD
    INC["Production Incident"] --> Q1["1. Who did what?\n(actor_id, role, action)"]
    INC --> Q2["2. To which entity?\n(entity_type, entity_id, academy_id)"]
    INC --> Q3["3. When did it happen?\n(ts, latencyMs)"]
    INC --> Q4["4. What was the state before and after?\n(payload_before, payload_after)"]
    INC --> Q5["5. Did it succeed?\n(success flag, error message)"]

    Q1 & Q2 & Q3 & Q4 & Q5 --> LOG["Answerable from logs alone?\n(Without reading source code)"]
    LOG -->|"Yes"| DIAG["Diagnosable ✓"]
    LOG -->|"No"| GAP["Instrumentation gap\n→ add to backlog"]
```

---

## Request Trace Flow

```mermaid
flowchart LR
    subgraph SERVER_ACTION["Server Action / API Route"]
        RID["createRequestId(prefix)\n→ 'wrap-up-draft_20260521_abc'"]
        LOG["createActionLogger({ action, requestId })"]
        START["log.info('start', { sessionId, userId, academyId })"]
        SUCCESS["log.info('success', { draftId })"]
        ERROR["log.error('db_error', { message })"]
        WARN["log.warn('duplicate_submission', { sessionId })"]
    end

    subgraph LOG_OUTPUT["Structured Log Output (JSON line)"]
        LO1['{"ts":"2026-05-21T14:32Z","level":"info","event":"start","action":"saveWrapUpDraftAction","requestId":"...","sessionId":"...","userId":"..."}']
    end

    RID --> LOG --> START
    START --> SUCCESS
    START --> ERROR
    START --> WARN
    SERVER_ACTION --> LOG_OUTPUT
```

---

## Instrumented Paths (Sprint 401)

| Path | Events logged |
|---|---|
| `saveWrapUpDraftAction` | start, duplicate_submission, voice_command_failed, proposed_action_failed, success |
| `saveWrapUpAttendanceExceptionAction` | auth_failed, start, duplicate_submission, voice_command_failed, proposed_action_failed, success |
| `transcribe/route.ts` | missing_session_id, auth_failed, no_academy_context, access_denied, transcription_start (size+mimeType), whisper_error (status+latency), transcription_success (latency), transcription_exception |
| `structureCoachRecapAction` | auth_failed, already_structured, start, voice_command_failed, proposed_action_failed, success |

---

## Safe vs. Forbidden Log Fields

```mermaid
graph LR
    subgraph ALLOWED["✅ Allowed in logs"]
        A1["requestId"]
        A2["action"]
        A3["sessionId (UUID)"]
        A4["academyId (UUID)"]
        A5["userId (UUID)"]
        A6["draftId (UUID)"]
        A7["role"]
        A8["size (bytes)"]
        A9["mimeType"]
        A10["latencyMs"]
        A11["error.message (DB errors)"]
        A12["status"]
    end

    subgraph FORBIDDEN["❌ Forbidden from logs"]
        F1["transcript content"]
        F2["session notes / raw_input"]
        F3["parent_summary / student_summary"]
        F4["guardian email / phone"]
        F5["player full_name / DOB"]
        F6["API keys / tokens"]
        F7["full proposed_payload"]
        F8["audio bytes"]
    end
```

---

## Debug Checklist for Failing Actions

```mermaid
flowchart TD
    FAIL["Action returning error"] --> C1["1. Find requestId in logs"]
    C1 --> C2["2. Search logs by requestId\ngrep requestId=xxx"]
    C2 --> C3["3. Find 'start' event\nConfirm sessionId, userId, academyId"]
    C3 --> C4["4. Find error event\nRead error.message"]
    C4 --> C5["5. Check audit_logs\nWas the write attempted?"]
    C5 --> C6["6. Check proposed_actions\nDid a draft row get created?"]
    C6 --> C7["7. Check voice_commands\nWas the FK created before the PA?"]
    C7 --> C8["8. Reproduce in dev\nWith service role key for full visibility"]
```

---

## Known Observability Gaps (as of Sprint 402)

| Gap | Priority | Sprint target |
|---|---|---|
| No log drain — logs in Vercel function logs only | Medium | Sprint 408+ |
| No AI call token count logging | High | Phase 2 |
| No client-side error boundary → server log | Medium | Phase 2 |
| No performance timing on non-AI server actions | Low | Phase 2 |
| KPI engine execution time not measured | High | Phase 2 |
| DONNA intelligence context build time not measured | High | Phase 2 |
