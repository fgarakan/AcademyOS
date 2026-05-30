# DONNA Tool Calling Contract V2 — Sprint 980

**Date:** 2026-05-30
**Sprint:** 980
**Status:** Implemented — TypeScript clean

---

## What Was Built

Sprint 980 creates the full typed tool calling contract for all 8 V1 registered tools. Each tool now has:
- Typed input params interface
- Typed `ToolCallResult` output
- Executor function (deterministic or stub)
- Audit entry
- Safety validation

---

## File Created

**`src/lib/donna/llmOrchestration/toolCallingContract.ts`**

Exports:
- `ToolCallResult` — standardized result type for all tool calls
- Input interfaces per tool (8 total)
- `executeToolCall(tool, params)` — main dispatcher, never throws
- `getRegisteredTools()` — returns all registered tool IDs

---

## Tool Executor Summary

| Tool | Executor Type | Requires Confirmation | Notes |
|---|---|---|---|
| `get_pending_review_count` | Deterministic (panel state) | No | Returns current count directly |
| `get_next_action_recommendation` | Deterministic (engine) | Conditional | Uses `buildDirectorNextAction` |
| `get_action_explanation` | Deterministic (engine) | Conditional | Uses `buildActionExplanation` |
| `get_review_queue_guidance` | Deterministic (engine) | No | Uses `buildReviewQueueGuidance` |
| `get_page_context` | Deterministic (chip registry) | No | Uses `getChipsForRoute` |
| `set_highlight_target` | UI instruction (no DB) | No | Returns instruction — UI executes |
| `draft_proposed_action` | Stub (Sprint 987 wires real write) | Yes | Always requires confirmation |
| `route_to_page` | UI suggestion | No | Only allows internal routes |

---

## Safety Guarantees

- `executeToolCall` never throws — always returns `ToolCallResult`
- `draft_proposed_action` always sets `requiresConfirmation: true`
- `route_to_page` blocks external URLs
- All audit entries logged in `ToolCallResult.auditEntry`

---

## V2 Gaps (Future Sprints)

- `draft_proposed_action` executor is a stub — Sprint 987 wires real write
- No DB-backed retrieval tools yet — Sprint 990-993 add those
