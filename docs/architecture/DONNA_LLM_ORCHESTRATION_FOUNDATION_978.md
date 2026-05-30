# DONNA LLM Orchestration Foundation — Sprint 978

**Date:** 2026-05-30
**Sprint:** 978
**Status:** Implemented — TypeScript clean

---

## Purpose

Sprint 978 creates the foundational architecture for DONNA LLM orchestration. This is not a generic chatbot layer — it is a structured, safety-enforced system that:

1. Builds a context packet from known safe signals
2. Runs deterministic handlers first (fast path — no LLM needed)
3. Falls back to deterministic guidance when LLM is unavailable
4. Defines the complete safety contract before any LLM API call is wired
5. Leaves a clear hook for Sprint 979 to wire the real Anthropic API call

**V1 does NOT make real LLM API calls.** The LLM path is stubbed in `orchestrator.ts` with a clear comment and a fallback response. Sprint 979 wires the real API.

---

## Files Created

| File | Description |
|---|---|
| `src/lib/donna/llmOrchestration/types.ts` | Core type definitions: roles, safety levels, tool IDs, output types, tool requests, safe response envelope |
| `src/lib/donna/llmOrchestration/contextPacket.ts` | Context packet builder — assembles safe signals and system prompt for LLM |
| `src/lib/donna/llmOrchestration/safetyContract.ts` | Allowed outputs, blocked actions, tool registry, safety validators |
| `src/lib/donna/llmOrchestration/orchestrator.ts` | Main orchestrator — deterministic fast paths, LLM stub, fallback, blocked action detector |

---

## Architecture Flow

```
Director input
    ↓
detectBlockedAction() — pre-filter
    ↓ (not blocked)
buildContextPacket() — safe signals + system prompt
    ↓
tryDeterministicHandler() — fast paths (no LLM)
    ↓ (if matched)
validateLlmOutput() — safety contract check
    ↓ (if valid)
OrchestratorResponse — returned to caller
    ↓ (if no match or LLM requested)
[V1 stub] LLM path → fallback
    ↓
buildFallbackResponse() — always safe
```

---

## V1 Allowed Outputs

| Output Type | Safety Level | Requires Confirmation | Description |
|---|---|---|---|
| `answer` | safe | No | Text answer to a question |
| `recommend_next_action` | safe | No | Deterministic next-action recommendation |
| `highlight_target` | safe | No | Visual highlight of a UI element |
| `explain_action` | safe | No | Structured action explanation |
| `draft_proposed_action` | review_only | Yes | Create proposed_action draft |
| `route_to_review` | safe | No | Suggest review queue navigation |
| `ask_clarifying_question` | safe | No | Request more context |

---

## V1 Blocked Actions

The following actions can NEVER be produced by the orchestrator in V1:

- `approve_review_item` — director must approve
- `reject_review_item` — director must reject
- `send_parent_message` — explicit director send required
- `send_player_message` — explicit director send required
- `change_player_level` — director-only action
- `change_roster` — director-only action
- `change_billing` — completely blocked
- `publish_curriculum` — goes through review queue
- `mutate_official_record_directly` — all mutations require approval
- `delete_record` — explicit director action required
- `bypass_rls` — never allowed
- `expose_raw_coach_notes` — never shown to parents/players
- `expose_internal_assessments` — never shown without approval

---

## V1 Registered Safe Tools

| Tool ID | Safety Level | Description |
|---|---|---|
| `get_pending_review_count` | safe | Returns pending review count from panel state |
| `get_next_action_recommendation` | safe | Calls buildDirectorNextAction() |
| `get_action_explanation` | safe | Calls buildActionExplanation() |
| `get_review_queue_guidance` | safe | Calls buildReviewQueueGuidance() |
| `get_page_context` | safe | Returns page label from chip registry |
| `set_highlight_target` | safe | Dispatches donna:highlight |
| `draft_proposed_action` | approval_gated | Creates proposed_action draft |
| `route_to_page` | safe | Suggests navigation |

---

## Deterministic Fast Paths

The orchestrator resolves these without any LLM call:

1. "What should I do next?" → `buildDirectorNextAction()` → `recommend_next_action`
2. Review queue guidance phrases → `buildReviewQueueGuidance()` → `answer`

All existing deterministic handlers (Sprint 971–973) remain available as fast paths.

---

## Fallback Behavior

When no deterministic handler matches and the LLM is not wired (V1):
- Returns a safe, context-aware message
- If pending reviews > 0: mentions the review queue count
- If no pending reviews: offers general help
- Never crashes, never exposes private data

---

## Sprint 979 Hook

In `orchestrator.ts`, the LLM path is clearly marked:

```typescript
// Step 3: LLM path (V1 stub — not yet wired to real API)
if (input.useLlm) {
  // V1: LLM call is stubbed. Sprint 979 will wire the Anthropic API here.
  // The contract is: send ctx.systemPrompt + ctx.userInput, receive OrchestratorOutput.
  // All LLM outputs must pass validateLlmOutput() before returning.
  safetyAudit.push('LLM: Path selected but not yet wired (Sprint 979). Returning fallback.')
  return buildFallbackResponse(ctx, 'LLM path not yet wired in V1.')
}
```

Sprint 979 replaces this stub with:
1. Call Anthropic API with `ctx.systemPrompt` + `ctx.userInput`
2. Parse structured LLM response into `OrchestratorOutput`
3. Run `validateLlmOutput()` on the response
4. Execute safe tool requests only
5. Return validated response

---

## Eval Requirements (Pre-Sprint 979)

Before wiring the real LLM call, the following must be verified:
- All 7 allowed output types produce correct results
- All 13 blocked actions are correctly detected by `detectBlockedAction()`
- All 8 tool validators correctly reject invalid params
- Fallback response never exposes private data
- Context packet never includes raw coach notes or player assessments

---

## No-Mutation / No-Migration Guarantee

- No DB calls in any orchestration module
- No schema changes
- No RLS changes
- No new DONNA surfaces
- Existing deterministic DONNA behavior unchanged
- `DonnaAssistantButton.tsx` not modified in Sprint 978
