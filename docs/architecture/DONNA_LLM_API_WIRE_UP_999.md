# DONNA LLM API Wire-Up V1 — Sprint 999

**Date:** 2026-05-30
**Sprint:** 999
**Status:** Implemented — TypeScript clean

---

## Summary

Sprint 999 replaces the Sprint 978 LLM stub with a real, validated Anthropic API call. The deterministic fast paths (Sprints 968–973) continue to run first. The LLM is only called when no deterministic handler matches and `useLlm: true` is passed.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/donna/llmOrchestration/llmApiClient.ts` | Created — Anthropic API client with safety validation |
| `src/lib/donna/llmOrchestration/orchestrator.ts` | Modified — stub replaced with real `callDonnaLlm()` call |

---

## Architecture

```
orchestrate(input)
  ↓
buildContextPacket()         — V2 context (role, page, tools, history, state)
  ↓
tryDeterministicHandler()    — Fast paths: next-action, review guidance (no LLM)
  ↓ (if matched)
return deterministic result  — Always fastest path
  ↓ (if no match and useLlm: true)
detectBlockedAction()        — Pre-call safety gate
  ↓ (if safe)
callDonnaLlm(ctx)            — Anthropic API call (dynamic import, server-only)
  ├── API key check          — Returns null if ANTHROPIC_API_KEY missing
  ├── Build system prompt    — ctx.systemPrompt + OUTPUT_TYPE_SCHEMA
  ├── Call claude-sonnet-4-6 — max_tokens: 800, prompt caching on system prompt
  ├── Parse JSON response    — Strip markdown fences if present
  ├── Schema validate        — isValidLlmResponse()
  ├── Post-parse safety      — Output type check, blocked action in text, route whitelist
  └── Return LlmCallResult   — output | null, hadBlockedContent, tokens, latency
  ↓
validateLlmOutput()          — Sprint 978 safety contract check
  ↓ (if valid)
return LLM OrchestratorResponse
  ↓ (if failed at any step)
buildFallbackResponse()      — Always safe, never crashes
```

---

## LLM Response Schema

The LLM must return this JSON exactly:

```json
{
  "type": "answer|recommend_next_action|highlight_target|explain_action|draft_proposed_action|route_to_review|ask_clarifying_question",
  "text": "Director-facing response (max 200 words, no markdown headers, calm COO tone)",
  "suggestedRoute": "/director/review or null",
  "highlightTargetId": "data-donna-focus-id value or null",
  "highlightTargetLabel": "human label or null",
  "safetyLevel": "safe|review_only|approval_gated",
  "requiresConfirmation": false,
  "confidence": "high|medium|low",
  "reasoning": "Internal reasoning (shown in audit trail only)"
}
```

---

## Safety Layers (in order)

1. **Pre-call:** `detectBlockedAction(userInput)` — blocks if input contains unsafe patterns
2. **API key gate:** Returns null immediately if `ANTHROPIC_API_KEY` not configured
3. **JSON validation:** `isValidLlmResponse()` — rejects malformed responses
4. **Output type gate:** `isOutputAllowed(type)` — rejects types not in V1 allowed list
5. **Response text gate:** `detectBlockedAction(text)` — blocks if LLM response contains unsafe patterns
6. **Safety level gate:** Rejects `safetyLevel: 'blocked'`
7. **Route whitelist:** External routes sanitized (not blocked — route suggestion removed)
8. **Safety contract:** `validateLlmOutput()` — Sprint 978 contract check
9. **Fallback:** Any failure at any step returns `buildFallbackResponse()` — never throws

---

## Model and Token Guardrails

| Setting | Value |
|---|---|
| Model | `claude-sonnet-4-6` (override via `ANTHROPIC_MODEL` env) |
| Max output tokens | 800 |
| Prompt caching | System prompt uses `cache_control: ephemeral` |
| Retry | 1 retry on 429/500/529 with 1s delay |
| Large prompt warning | Logged when system prompt > 4000 chars |
| User input cap | 500 chars (from Sprint 979 context packet) |
| Conversation history | Last 4 turns included in user message |

---

## Deterministic Fast Paths (unchanged, always run first)

1. `matchesWhatNextIntent()` + `buildDirectorNextAction()` — no LLM needed
2. `matchesReviewQueueGuidanceIntent()` + `buildReviewQueueGuidance()` — no LLM needed
3. All Sprint 968–973 guidance handlers in `DonnaAssistantButton.detectAndHandleCommand` — no LLM needed

The LLM is only called for inputs that pass all deterministic handlers without a match.

---

## Fallback Behavior

When any error occurs (API key missing, network error, invalid JSON, blocked content, failed validation):
- `buildFallbackResponse()` is called — always returns a safe, informative response
- Never throws from `orchestrate()`
- `hadBlockedAttempt: true` when content was blocked
- All failures logged to `safetyAudit[]`

---

## No-Migration Guarantee

- No schema changes
- No RLS changes
- No new DB tables
- No new DONNA surfaces
- `ANTHROPIC_API_KEY` must be set in `.env.local` to activate LLM path
- Without the key, the orchestrator falls back gracefully — existing DONNA behavior unchanged

---

## V2 Improvements (Sprint 1000+)

- Add tool execution: when LLM requests a tool, call `executeToolCall()` and feed result back
- Add multi-turn: wire `conversationPersistence.ts` to save turns after each orchestration
- Add usage tracking: call `logUsageEvent()` after each LLM call
- Add streaming: use `client.messages.stream()` for token-by-token response display
- Wire `useLlm: true` in `DonnaAssistantButton` for director prompts that miss deterministic handlers
