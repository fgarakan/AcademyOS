# DONNA Multi-Turn Tool Loop V1 — Sprint 1001

**Date:** 2026-05-30
**Sprint:** 1001
**Status:** Implemented — TypeScript clean

---

## Before Sprint 1001 (Sprint 1000 Behavior)

After the tool loop executed:
- `runToolExecutionLoop()` returned `toolLoopResult.output` — the interpreted tool result
- The orchestrator returned this directly to the caller
- The LLM never saw the tool result — responses were based on the LLM's first-turn knowledge only

Sprint 1001 adds a controlled second LLM turn that feeds the tool result back as context.

---

## New Two-Step Reasoning Loop (Sprint 1001)

```
orchestrate(input, useLlm: true)
  ↓
[Sprint 999] callDonnaLlm(ctx) → LLM output with toolRequest
  ↓
[Sprint 1000] runToolExecutionLoop() → tool executes, result interpreted
  ↓ (toolLoopResult.executed === true)
[Sprint 1001] runMultiTurnToolLoop(originalInput, toolLoopResult, safetyAudit)
  ├── buildToolResultSummary() — compact safe summary (max 300 chars, sentence-capped)
  ├── detectBlockedAction(summary) — safety gate on tool result content
  ├── buildSecondTurnInput() — appends [user: original_question] + [donna: tool_summary] to history
  ├── buildContextPacket() — new context with conversation history
  ├── callDonnaLlm(secondCtx) — second LLM call for grounded final answer
  ├── validateSecondTurnOutput() — safety contract + blocked action check
  └── return final output | fallback to tool interpretation
```

---

## Constraints

| Constraint | Value |
|---|---|
| Max tools per user turn | 1 (Sprint 1000) |
| Max follow-up LLM calls per user turn | 1 (Sprint 1001) |
| Recursive loops | Not allowed |
| Autonomous chains | Not allowed |
| Write tools in second turn | Not allowed |
| Second turn triggered when | `toolLoopResult.executed === true && useLlm === true` |

---

## Tool Result Summary Format

`buildToolResultSummary(toolLoopResult)`:
- Takes `toolLoopResult.output.text` (already sanitized by `interpretToolResult()`)
- Caps at 300 chars at sentence boundary
- Returns empty string if tool was not executed
- Content: counts, status flags, navigation suggestions — no raw notes, no player names, no IDs

---

## Second-Turn Context Structure

The second-turn context packet has:
- **Same system prompt** as the first turn (prompt caching applies)
- **Conversation history:** `[user: original_question, donna: tool_summary]`
- **New user input:** `"Based on the context above, what is your final recommendation or answer for the director? Be concise and actionable."`

---

## Final Answer Validation Chain

1. `llmResult.hadBlockedContent` → fallback if true
2. `llmResult.output` present → proceed
3. `isOutputAllowed(output.type)` → fallback if not allowed
4. `detectBlockedAction(output.text)` → fallback if blocked content found
5. `output.safetyLevel !== 'blocked'` → fallback if safety level is blocked
6. Highlight/navigation preserved from tool loop if second turn doesn't include them

---

## Fallback Behavior

At every step, if anything fails:
- `toolLoopResult.output` (the interpreted tool result) is returned unchanged
- `secondTurnSucceeded: false` in the result
- `source: 'tool_interpretation_fallback'`
- All failures logged to `safetyAudit[]`
- `runMultiTurnToolLoop` never throws

---

## Safety Audit Trail

- `MultiTurn: Tool was not executed — skipping second turn.`
- `MultiTurn: Tool summary built (N chars). Attempting second LLM turn.`
- `MultiTurn: Tool summary contains blocked action '...' — skipping second turn.`
- `MultiTurn: Exception calling LLM for second turn: ...`
- `MultiTurn: Second turn LLM had blocked content or no output — falling back.`
- `MultiTurn: Second turn output failed validation — using tool interpretation fallback.`
- `MultiTurn: Second turn succeeded. model=... latency=...ms tokens=...+...`

---

## No-Migration Guarantee

- No schema changes
- No RLS changes
- No new DB tables or queries
- The second LLM call uses the same Anthropic API key and model as the first turn
- No new DONNA surfaces

---

## V2 Roadmap (Sprint 1002+)

1. **DB-backed context tools:** Add `get_player_summary`, `get_session_list` as safe read-only retrieval tools using Sprint 990-993 modules — give LLM real live academy data
2. **Usage tracking:** Log both LLM turns to `logUsageEvent()` for cost monitoring
3. **Streaming:** Stream second-turn tokens back to the panel as they complete
4. **Tool result caching:** Cache tool results within a session to avoid redundant calls
5. **Tool chain:** Allow the second-turn LLM to request one more tool (controlled two-step chain)
