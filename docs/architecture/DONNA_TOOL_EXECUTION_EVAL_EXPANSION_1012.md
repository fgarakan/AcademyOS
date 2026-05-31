# DONNA Tool Execution Eval Expansion — Sprint 1012

**Date:** 2026-05-31
**Sprint:** 1012
**Status:** Complete

---

## Context

Sprint 982 introduced the DONNA evaluation harness (`evaluationHarness.ts`) with 25 eval cases covering safety, routing, next action, guidance, context packet, tool calling, and fallback.

Sprints 1000–1011 added significant infrastructure that was not covered by the existing harness:
- Sprint 1002: `get_academy_state`, `get_player_development_summary` (live DB tools)
- Sprint 1003: `get_player_profile_summary` (player route context tool)
- Sprint 1004: `get_session_context` (session route context tool)
- Sprint 1011: God Mode panel integration (new submit fallback path)

Sprint 1012 expands the eval harness to cover this infrastructure before adding more capabilities in Sprints 1013+.

---

## Regression fixed

`context_002` (tool manifest entry count) was checking for 8 entries — the count at Sprint 982. Sprints 1002–1004 added 4 live tools, bringing the total to 12. This eval case was updated to assert 12.

Without this fix, the harness would have been reporting a false pass on a stale assertion.

---

## New eval cases added

### `tool_calling` category (2 new)

| ID | What it tests |
|---|---|
| `tool_005` | `getRegisteredTools()` returns 12 tools (regression: confirms Sprint 1002–1004 tools are in EXECUTORS) |
| `tool_006` | `route_to_page` with a valid director route returns `ok:true` |

### `context_packet` category (5 new)

| ID | What it tests |
|---|---|
| `context_004` | `hasPlayerContext === true` when `playerId` is provided to context packet |
| `context_005` | `hasPlayerContext === false` when no `playerId` (default path) |
| `context_006` | `hasSessionContext === true` when `sessionId` is provided |
| `context_007` | `academyId` stored in `safeSignals` for live tool retrieval |
| `context_008` | All 4 Sprint 1002–1004 live tools present in tool manifest |

### `live_tools` category (11 new — new category)

| ID | What it tests |
|---|---|
| `live_001` | `isLiveTool('get_academy_state')` → true |
| `live_002` | `isLiveTool('get_player_development_summary')` → true |
| `live_003` | `isLiveTool('get_player_profile_summary')` → true |
| `live_004` | `isLiveTool('get_session_context')` → true |
| `live_005` | `isLiveTool('get_pending_review_count')` → false (synchronous tool) |
| `live_006` | `get_academy_state` NOT in `DIRECTLY_EXECUTABLE_TOOLS` (must use async live executor) |
| `live_007` | `get_player_profile_summary` NOT directly executable (playerId from route context) |
| `live_008` | `get_session_context` NOT directly executable (sessionId from route context) |
| `live_009` | `executeToolCall('get_academy_state', ...)` stub returns `ok:false` with "live context" message |
| `live_010` | `executeToolCall('get_player_profile_summary', ...)` stub returns `ok:false` with "live context" message |
| `live_011` | `executeToolCall('get_session_context', ...)` stub returns `ok:false` with "live context" message |

---

## Why stubs must return informative errors

When `executeToolCall` (synchronous) is called for a live tool, it returns `ok:false` with a message containing "live context". This message is the safety signal telling any caller that it has taken the wrong path — it should use `runLiveToolExecutionLoop` from the orchestrator, not the synchronous executor. Eval cases `live_009–011` verify this message is present, not just that the call fails.

---

## Why `playerId` and `sessionId` must not be LLM-supplied

Cases `live_007` and `live_008` verify that `get_player_profile_summary` and `get_session_context` are not in `DIRECTLY_EXECUTABLE_TOOLS`. This enforces that:
1. These tools only run through `runLiveToolExecutionLoop`
2. `playerId` and `sessionId` are injected from route context (`ctx.safeSignals`), never from the LLM output
3. The LLM cannot enumerate or guess player/session IDs

---

## Total eval coverage after Sprint 1012

| Category | Before | After |
|---|---|---|
| safety | 9 | 9 |
| routing | 4 | 4 |
| next_action | 4 | 4 |
| guidance | 2 | 2 |
| context_packet | 3 | 8 (+5) |
| tool_calling | 4 | 6 (+2) |
| live_tools | 0 | 11 (+11, new category) |
| fallback | 2 | 2 |
| **Total** | **28** | **46** |

---

## What this does NOT cover

- Async live tool execution (requires DB — cannot be tested in pure TypeScript harness)
- God Mode panel render behavior (requires React component testing)
- LLM response parsing (requires live API or mocked response)
- Multi-turn tool loop (orchestrator level — out of scope for pure eval harness)

These gaps are documented in `docs/QA_DONNA_TOOL_EXECUTION_EVAL_EXPANSION_1012.md`.
