# Architecture — DONNA Live Orchestrator Server Action V1 — Sprint 1010

**Date:** 2026-05-30
**Sprint:** 1010
**Depends on:** Sprint 978/999 (orchestrate()), Sprint 1007 (writeUsageEventToDb), Sprint 1009 (guided actions)

---

## Purpose

Sprint 1010 creates `donnaOrchestratorAction.ts` — the server action bridge between the DONNA panel UI and the Sprint 978+ LLM orchestrator.

Before Sprint 1010, `orchestrate()` had no caller from the app layer. It existed only as a library function. Sprint 1010 creates the secure server-side entry point that:
1. Validates and sanitizes client input
2. Resolves `academyId` and `role` from server-side auth
3. Calls `orchestrate()` with the merged, safe input
4. Writes a usage event to the DB (fire-and-forget)
5. Returns a safe `DonnaOrchestratorResult` to the client — never exposing internal audit trails

---

## Security boundaries

| Field | Source | Why |
|---|---|---|
| `academyId` | Server-side auth only | Never trust client — prevents cross-academy attacks |
| `role` | Server-side auth only | Never trust client — prevents role escalation |
| `userInput` | Client (validated: non-empty, max 800 chars) | Director's message |
| `pathname` | Client (validated: must start with /) | Current page context |
| `playerId` | Client (optional) | Used only for scoped DB read — RLS enforces actual access |
| `sessionId` | Client (optional) | Used only for scoped DB read — RLS enforces actual access |
| `safetyAudit` | Internal only | Never returned to client |
| `contextSummary` | Internal only | Never returned to client |

---

## Input type (DonnaOrchestratorInput)

Accepted from client:
- `userInput: string` — max 800 chars, non-empty
- `pathname: string` — must start with /
- `pageLabel?: string`
- `firstName?: string | null`
- `pendingReviews?: number`
- `conversationHistory?: ConversationTurn[]`
- `playerId?: string | null`
- `sessionId?: string | null`
- `useLlm?: boolean` — defaults to true

NOT accepted: `academyId`, `role` — resolved from auth

---

## Result type (DonnaOrchestratorResult)

Returned to client:
- `ok: boolean`
- `output?: OrchestratorOutput` — the primary orchestrator output (when ok: true)
- `hadBlockedAttempt: boolean`
- `error?: string` — safe message only (when ok: false)

NOT returned: `safetyAudit`, `contextSummary`, raw DB errors, stack traces

---

## Usage event DB write

After orchestration, writes a `donna_intelligence_call` event to `usage_events` via `writeUsageEventToDb()`:
- `eventType: 'donna_intelligence_call'`
- `academyId` from auth
- `userId` from auth
- `blocked: hadBlockedAttempt`
- `requestId: '{outputType}:{source}'` — e.g. 'answer:llm_inferred'
- `provider: 'anthropic'`

The write is fire-and-forget (`void`) — never blocks the response to the client.

---

## Error behavior

| Scenario | Result |
|---|---|
| Input validation fails | `{ ok: false, error: 'safe message' }` |
| Auth fails | `{ ok: false, error: 'Not authenticated.' }` |
| Non-director role | `{ ok: false, error: 'Director or Head Coach access required.' }` |
| orchestrate() throws | `{ ok: false, error: 'DONNA is temporarily unavailable.' }` |
| Usage DB write fails | Silently swallowed — response already returned |

---

## What Sprint 1011 adds

Sprint 1010 creates the server action. Sprint 1011 (DONNA Panel God Mode Integration) wires it into `DonnaAssistantButton` so the DONNA panel calls `runDonnaOrchestratorAction()` and renders the result via `DonnaResponseCard`.

---

## Files created

| File | Change |
|---|---|
| `src/app/director/_actions/donnaOrchestratorAction.ts` | New — server action |
| `docs/architecture/DONNA_LIVE_ORCHESTRATOR_SERVER_ACTION_1010.md` | New — this doc |
| `docs/QA_DONNA_LIVE_ORCHESTRATOR_SERVER_ACTION_1010.md` | New — QA checklist |
| `docs/CHANGELOG.md` | Updated |
