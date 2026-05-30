# DONNA Tool Execution Loop V1 — Sprint 1000

**Date:** 2026-05-30
**Sprint:** 1000
**Status:** Implemented — TypeScript clean

---

## Before Sprint 1000 (Sprint 999 Behavior)

When the LLM returned a valid `OrchestratorOutput` with a `toolRequest` field:
- The `toolRequest` was validated (type + params checked by `validateLlmOutput`)
- The `toolRequest` was **not executed** — it passed through as metadata to the caller
- `executeToolCall()` (Sprint 980) and `interpretToolResult()` (Sprint 986) existed but were never called from the orchestrator

Sprint 1000 closes this gap: the tool loop executes safe tools and interprets results into grounded DONNA responses.

---

## New Behavior After Sprint 1000

After the LLM output validates in `orchestrator.ts`, `runToolExecutionLoop()` is called:

```
LLM output validates ✓
  ↓
runToolExecutionLoop(output, ctx, safetyAudit)
  ├── No toolRequest? → return original output unchanged
  ├── validateToolRequest() fails? → return original output, log to audit
  ├── tool is approval_gated? → return approval-required response (no execution)
  ├── tool not in DIRECTLY_EXECUTABLE_TOOLS? → return original output, log to audit
  ├── executeToolCall() throws? → return original output, log to audit
  ├── toolResult.ok === false? → return original output, log to audit
  └── interpretToolResult() succeeds? → return enhanced output with tool data
```

The same loop also runs for **deterministic outputs** that carry a `toolRequest` (e.g. the next-action fast path — though in practice, deterministic tools already have data; the loop is a no-op for them unless the tool produces new context).

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/donna/llmOrchestration/toolExecutionLoop.ts` | Created — tool validation, execution, interpretation loop |
| `src/lib/donna/llmOrchestration/orchestrator.ts` | Modified — `runToolExecutionLoop` called after LLM output validates and after deterministic fast paths |

---

## V1 Allowed Tools (execute directly)

| Tool | Safety Level | What It Does |
|---|---|---|
| `get_pending_review_count` | safe | Returns current pending count from panel state |
| `get_next_action_recommendation` | safe | Calls `buildDirectorNextAction()` deterministically |
| `get_action_explanation` | safe | Calls `buildActionExplanation()` deterministically |
| `get_review_queue_guidance` | safe | Calls `buildReviewQueueGuidance()` for an intent |
| `get_page_context` | safe | Returns chip targets from `getChipsForRoute()` |
| `set_highlight_target` | safe | Returns highlight instruction (UI executes it) |
| `route_to_page` | safe | Returns internal route suggestion (no auto-navigation) |

---

## Approval-Gated Tools (never execute directly)

| Tool | Safety Level | Behavior |
|---|---|---|
| `draft_proposed_action` | approval_gated | Returns explanation that director confirmation is required; routes to `/director/review` with `review-queue-primary` highlighted |

---

## One-Tool-Per-Turn Limit

V1 executes at most one tool per user turn. No recursive loops, no agent chains, no multi-step autonomous execution. The tool loop returns after one execution (or one rejection).

---

## Tool Execution Flow

```
runToolExecutionLoop(output, ctx, safetyAudit)
  1. Check output.toolRequest — if null, return immediately (no-op)
  2. validateToolRequest(tool, params) — Sprint 978 safety contract
  3. getToolSafetyLevel(tool) — if approval_gated → buildApprovalGatedResponse
  4. isSafeToExecuteDirectly(tool) — if not in safe set → block
  5. executeToolCall(tool, params) — Sprint 980 executor
  6. interpretToolResult(toolResult) — Sprint 986 interpreter
  7. interpretationToOutput() — converts ToolInterpretation → OrchestratorOutput
```

---

## Fallback Behavior

At every step, if something goes wrong:
- The **original LLM output** is returned unchanged
- The failure is logged to `safetyAudit[]`
- `executed: false` in the `ToolLoopResult`
- `runToolExecutionLoop` never throws

---

## Safety Audit Trail

Every tool loop decision is logged to `safetyAudit[]`:
- `ToolLoop: No toolRequest on output — skipping.`
- `ToolLoop: BLOCKED — {validation.reason}`
- `ToolLoop: APPROVAL REQUIRED — tool '...' is approval_gated.`
- `ToolLoop: EXCEPTION in executeToolCall(...)`
- `ToolLoop: Tool '...' returned ok:false — ...`
- `ToolLoop: SUCCESS — tool='...' → donnaText(...) shouldHighlight=...`

---

## No-Migration Guarantee

- No schema changes
- No RLS changes
- No new DB tables or queries
- `set_highlight_target` returns an instruction — the UI layer (DonnaAssistantButton) executes the actual sessionStorage write and `donna:highlight` dispatch
- No approval_gated tools execute without director action

---

## V2 Improvements (Sprint 1001+)

1. **Multi-turn tool loop:** Execute one tool, feed result back to LLM for a refined response — two-step reasoning
2. **DB-backed tools:** Add `get_player_summary`, `get_session_list` as safe read-only DB retrieval tools (Sprint 990-993 retrieval modules)
3. **Usage tracking:** Call `logUsageEvent()` after each tool execution
4. **Tool result caching:** Cache tool results within a session to avoid redundant calls
5. **Streaming:** Stream tool results back to the panel as they complete
