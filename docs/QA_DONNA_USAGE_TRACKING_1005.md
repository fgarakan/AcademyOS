# QA — DONNA Usage Tracking V1 — Sprint 1005

**Date:** 2026-05-30
**Sprint:** 1005

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `usageTypes.ts` compiles with 2 new `UsageEventType` values
- [ ] `donnaUsageTracking.ts` compiles cleanly — imports from usageTracker.ts resolve
- [ ] `llmApiClient.ts` compiles cleanly with new import and calls
- [ ] `toolExecutionLoop.ts` compiles cleanly with new import and calls

---

## LLM Logging Checklist

- [ ] `logDonnaLlmUsage({ academyId, model, latencyMs, inputTokens, outputTokens, success: true })` executes without error
- [ ] `logDonnaFallbackUsage({ academyId, reason: 'api_key_missing' })` executes without error
- [ ] After successful `callDonnaLlm`, `safetyAudit` includes `'Usage: donna_intelligence_call'` entry
- [ ] When API key missing, `safetyAudit` includes `'Usage: donna_orchestration_fallback'` entry
- [ ] LLM logging is called AFTER the response is ready — not before
- [ ] LLM logging uses `ctx.safeSignals.academyId` (never raw user input)

---

## Tool Logging Checklist

- [ ] After successful `executeLiveTool`, `logDonnaToolUsage` is called with `success: true`
- [ ] After failed `executeLiveTool` (`ok: false`), `logDonnaToolUsage` is called with `success: false`
- [ ] `logDonnaToolUsage` receives `academyId` from `ctx.safeSignals.academyId`
- [ ] `logDonnaToolUsage` receives `role` from `ctx.safeSignals.role`
- [ ] Tool logging in `safetyAudit` shows `'Usage: donna_tool_call'` entry

---

## Privacy Checklist

- [ ] `logDonnaLlmUsage` does NOT log `ctx.userInput`
- [ ] `logDonnaLlmUsage` does NOT log `ctx.systemPrompt`
- [ ] `logDonnaLlmUsage` does NOT log `output.text`
- [ ] `logDonnaToolUsage` does NOT log `liveResult.data`
- [ ] `logDonnaToolUsage` does NOT log raw params
- [ ] `logDonnaFallbackUsage` does NOT log fallback response text
- [ ] No player names in any usage log
- [ ] No coach notes in any usage log
- [ ] No session notes in any usage log

---

## No Raw Prompts Checklist

- [ ] `donnaUsageTracking.ts` has no `ctx.systemPrompt` reference
- [ ] `donnaUsageTracking.ts` has no `ctx.userInput` reference
- [ ] `logDonnaLlmUsage` params do not include prompt text fields
- [ ] `UsageEvent.requestId` used only for metadata labels (not raw content)

---

## No Raw IDs Checklist

- [ ] `safeIdPrefix()` truncates IDs to 8 chars — not called in Sprint 1005 V1 (full academyId is internal, not user-facing)
- [ ] No raw `playerId` in usage logs
- [ ] No raw `sessionId` in usage logs
- [ ] `academyId` used as internal attribution ID (not exposed to public)

---

## Logging Failure Checklist

- [ ] `logDonnaLlmUsage` wrapped in try/catch — never throws
- [ ] `logDonnaToolUsage` wrapped in try/catch — never throws
- [ ] `logDonnaFallbackUsage` wrapped in try/catch — never throws
- [ ] If `logInfo` throws (unlikely): DONNA response continues unaffected
- [ ] `safetyAudit` receives note if logging fails silently

---

## Live Context Regression Checklist

- [ ] `get_academy_state` still executes correctly (tool loop unchanged)
- [ ] `get_player_development_summary` still works
- [ ] `get_player_profile_summary` still works
- [ ] `get_session_context` still works
- [ ] Usage logging is additive — does not affect tool result

---

## Multi-Turn Loop Regression Checklist

- [ ] `runMultiTurnToolLoop` still works after Sprint 1005 changes
- [ ] Second LLM turn still receives tool result as context
- [ ] Sprint 1001 behavior preserved

---

## Red-Team / Eval Regression Checklist

- [ ] `runEvaluationHarness()` still returns `failed: 0` (28 cases)
- [ ] `runRedTeamSafetyQA()` still returns `failed: 0` (21 cases)
- [ ] `runGodModeV2Certification()` still returns `goNoGo: 'GO'`

---

## Protected Systems Checklist

- [ ] Sprint 904 approve/reject paths untouched
- [ ] No DB writes added
- [ ] No schema changes
- [ ] No RLS changes
- [ ] One DONNA button remains
- [ ] No new DONNA surface
