# DONNA Usage Tracking V1 — Sprint 1005

**Date:** 2026-05-30
**Sprint:** 1005
**Status:** Implemented — TypeScript clean

---

## Before Sprint 1005

Sprints 999–1004 built DONNA's LLM orchestration, tool execution, multi-turn loop, and four live context tools. No usage observability existed — every LLM call and tool call was invisible to the platform.

Sprint 1005 adds safe log-based instrumentation for all DONNA LLM and live context tool activity.

---

## Architecture

All usage is written to **structured stdout** via the existing `logInfo()` path (Sprint 407 `usageTracker.ts`). No new DB writes. No new tables. The interface is stable — future sprints can replace `logUsageEvent()` with a DB-backed write without changing callers.

```
callDonnaLlm(ctx, safetyAudit)
  → API call succeeds
  → logDonnaLlmUsage({ academyId, model, tokens, latency, outputType })
  → stdout: { eventType: 'donna_intelligence_call', model, inputTokens, outputTokens, ... }

callDonnaLlm(ctx, safetyAudit)
  → API key missing
  → logDonnaFallbackUsage({ academyId, reason: 'api_key_missing' })
  → stdout: { eventType: 'donna_orchestration_fallback', ... }

runLiveToolExecutionLoop(output, ctx, safetyAudit)
  → executeLiveTool('get_academy_state', ...) succeeds
  → logDonnaToolUsage({ academyId, toolId, success: true, role, latencyMs })
  → stdout: { eventType: 'donna_tool_call', ... }
```

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/usage/usageTypes.ts` | Added `donna_tool_call` and `donna_orchestration_fallback` to `UsageEventType` |
| `src/lib/donna/llmOrchestration/donnaUsageTracking.ts` | Created — safe usage tracking helpers |
| `src/lib/donna/llmOrchestration/llmApiClient.ts` | Added import + `logDonnaLlmUsage` on success + `logDonnaFallbackUsage` on API key missing |
| `src/lib/donna/llmOrchestration/toolExecutionLoop.ts` | Added import + `logDonnaToolUsage` after each live tool result |

---

## LLM Usage Tracking

### When logged
- **Success:** After `callDonnaLlm` returns a valid `OrchestratorOutput`
- **API key missing:** Immediately when `ANTHROPIC_API_KEY` is not set

### Safe fields logged
- `eventType: 'donna_intelligence_call'`
- `academyId` — for cost attribution
- `model` — e.g. "claude-sonnet-4-6"
- `inputTokens`, `outputTokens`
- `latencyMs`
- `outputTypeLabel` — e.g. "answer", "recommend_next_action"
- `blocked: false` (success) or `blocked: true` (fallback)

---

## Tool Usage Tracking

### When logged
- **Success:** After `executeLiveTool` returns `ok: true` in `runLiveToolExecutionLoop`
- **Failure:** After `executeLiveTool` returns `ok: false`

### Safe fields logged
- `eventType: 'donna_tool_call'`
- `academyId`
- `toolId` — e.g. "get_academy_state", "get_session_context"
- `role` — "academy_director" or "coach"
- `success` — boolean
- `failureCategory` — "db_error", "missing_id", "exception"

---

## Fallback Usage Tracking

### When logged
- API key missing
- Deterministic fallback triggered

### Safe fields logged
- `eventType: 'donna_orchestration_fallback'`
- `academyId`
- `reason` — "api_key_missing", "llm_blocked", "validation_failed", "tool_failed"

---

## Privacy Rules (Enforced in Every Function)

### Never logged
- Raw prompts or system prompt content
- Raw LLM responses
- Raw tool payloads
- Raw coach notes, player notes, or session notes
- Full player UUIDs or session UUIDs (truncated to 8 chars for correlation only)
- Player names, coach names, or other PII
- Assessment scores or behavioral flags

### Safe to log
- Event type labels
- Model names
- Token counts (not content)
- Latency milliseconds
- Tool ID labels
- Academy ID (internal, non-public)
- Role labels ("academy_director", "coach")
- Success/failure booleans
- Error category labels (not raw error messages)

---

## Logging Failure Behavior

All three tracking functions (`logDonnaLlmUsage`, `logDonnaToolUsage`, `logDonnaFallbackUsage`) are wrapped in `try/catch`. If logging fails:
- A note is pushed to `safetyAudit[]` if available
- DONNA's response continues without interruption
- No exception propagates to the caller

---

## No-Migration Guarantee

- No new database tables
- No schema changes
- No RLS changes
- Uses existing `logUsageEvent()` path (Sprint 407 `usageTracker.ts`)
- Future DB-backed usage tracking can replace `logUsageEvent()` without changing any caller

---

## V2 Roadmap (Sprint 1006+)

1. **Cost dashboard:** Wire usage events to a `usage_events` DB table (requires migration approval) — enables per-academy cost monitoring
2. **Retry tracking:** Log retry count and which attempt succeeded
3. **Second-turn tracking:** Flag `isSecondTurn: true` in multi-turn calls to separate cost attribution
4. **Tool latency:** Capture accurate latency per live tool call (currently 0 — DB timing requires wrapping at query level)
5. **Rate limit detection:** Track `donna_tool_call` frequency to detect abuse before rate limits hit
