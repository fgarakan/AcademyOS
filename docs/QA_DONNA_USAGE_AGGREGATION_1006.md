# QA — DONNA Usage Aggregation V1 — Sprint 1006

**Date:** 2026-05-30
**Sprint:** 1006

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `donnaUsageSummary.ts` compiles cleanly — imports from usageTracker.ts resolve
- [ ] `DonnaUsageSummary` shape compiles cleanly
- [ ] `DonnaUsageWindow` compiles cleanly
- [ ] `DonnaToolUsageSummary` compiles cleanly (byToolId: undefined is valid)
- [ ] `DonnaFallbackSummary` compiles cleanly (byReason: undefined is valid)
- [ ] `getDonnaUsageSummary()` return type matches `Promise<DonnaUsageSummary>`

---

## Aggregation Behavior Checklist

- [ ] `getDonnaUsageSummary(academyId, 1)` returns today's in-process counts without error
- [ ] `getDonnaUsageSummary(academyId, 7)` returns today's in-process counts with note about multi-day limitation
- [ ] `llmCallCount` reads from `getInProcessDailyCount(academyId, 'donna_intelligence_call')`
- [ ] `toolCallCount` reads from `getInProcessDailyCount(academyId, 'donna_tool_call')`
- [ ] `fallbackCount` reads from `getInProcessDailyCount(academyId, 'donna_orchestration_fallback')`
- [ ] `dataSource` is `'in_process'` on normal path
- [ ] `dataSource` is `'unavailable'` on error path
- [ ] `window.isInProcessOnly` is `true` in V1
- [ ] `window.note` contains honest limitation description
- [ ] `tools.byToolId` is `undefined` (not null, not empty object)
- [ ] `fallbacks.byReason` is `undefined` (not null, not empty object)
- [ ] `windowDays` is clamped to [1, 90]

---

## Privacy Checklist

- [ ] `getDonnaUsageSummary()` does NOT return raw prompts
- [ ] `getDonnaUsageSummary()` does NOT return raw LLM responses
- [ ] `getDonnaUsageSummary()` does NOT return raw tool payloads
- [ ] `getDonnaUsageSummary()` does NOT return coach notes
- [ ] `getDonnaUsageSummary()` does NOT return player notes
- [ ] `getDonnaUsageSummary()` does NOT return session notes
- [ ] `getDonnaUsageSummary()` does NOT return player names
- [ ] `getDonnaUsageSummary()` does NOT return full UUIDs
- [ ] Summary fields are counts and labels only

---

## No Raw Prompts Checklist

- [ ] `donnaUsageSummary.ts` has no `systemPrompt` reference
- [ ] `donnaUsageSummary.ts` has no `userInput` reference
- [ ] `donnaUsageSummary.ts` has no `ctx` parameter or context packet reference
- [ ] No prompt text appears in any summary field

---

## No Raw Responses Checklist

- [ ] `donnaUsageSummary.ts` does NOT import from `llmApiClient.ts`
- [ ] `donnaUsageSummary.ts` does NOT import from `orchestrator.ts`
- [ ] No LLM output text appears in any summary field
- [ ] No tool result data appears in any summary field

---

## No Raw Notes Checklist

- [ ] No coach observation text in any summary field
- [ ] No session notes in any summary field
- [ ] No player development notes in any summary field
- [ ] No wrap-up draft text in any summary field

---

## No Raw IDs Checklist

- [ ] No full playerId in any summary field
- [ ] No full sessionId in any summary field
- [ ] No full userId in any summary field
- [ ] academyId used only for accumulator key lookup — not exposed in output beyond `DonnaUsageSummary.academyId` (internal attribution)

---

## Fallback / Error Checklist

- [ ] `getDonnaUsageSummary('')` returns unavailable summary (invalid academyId)
- [ ] `getDonnaUsageSummary(academyId, 0)` returns summary with windowDays clamped to 1
- [ ] `getDonnaUsageSummary(academyId, 100)` returns summary with windowDays clamped to 90
- [ ] If `getInProcessDailyCount` throws unexpectedly — try/catch catches it, returns unavailable summary
- [ ] Unavailable summary has `dataSource: 'unavailable'`
- [ ] Unavailable summary has honest note about why data is unavailable
- [ ] DONNA behavior is NOT affected by aggregation errors

---

## Sprint 1005 Regression Checklist

- [ ] `logDonnaLlmUsage()` still compiles and runs correctly
- [ ] `logDonnaToolUsage()` still compiles and runs correctly
- [ ] `logDonnaFallbackUsage()` still compiles and runs correctly
- [ ] `usageTypes.ts` still has `donna_tool_call` and `donna_orchestration_fallback` event types
- [ ] `llmApiClient.ts` usage tracking calls still compile

---

## Sprint 1004 Regression Checklist

- [ ] `get_session_context` tool still executes correctly
- [ ] `sessionContextRetrieval.ts` still compiles
- [ ] `toolExecutionLoop.ts` still compiles (Sprint 1005 tool logging intact)

---

## Sprint 1003 Regression Checklist

- [ ] `get_player_profile_summary` tool still executes correctly
- [ ] `playerProfileRetrieval.ts` still compiles

---

## Sprint 1002 Regression Checklist

- [ ] `get_academy_state` still executes correctly
- [ ] `get_player_development_summary` still executes correctly
- [ ] `liveContextToolExecutor.ts` still compiles

---

## Sprint 1001 Regression Checklist

- [ ] `runMultiTurnToolLoop` still compiles and executes
- [ ] Second LLM turn still receives tool result as context

---

## Sprint 1000 Regression Checklist

- [ ] `runToolExecutionLoop` still compiles
- [ ] `runLiveToolExecutionLoop` still compiles
- [ ] Approval-gated path unchanged

---

## Sprint 999 Regression Checklist

- [ ] `callDonnaLlm()` still compiles
- [ ] `callDonnaLlm()` still returns null gracefully when API key missing

---

## Sprint 998 Regression Checklist

- [ ] `runGodModeV2Certification()` still returns `goNoGo: 'GO'`

---

## Protected Systems Checklist

- [ ] No DB writes added in Sprint 1006
- [ ] No schema changes
- [ ] No RLS changes
- [ ] No new DONNA surface
- [ ] One DONNA button remains
- [ ] No migrations created
- [ ] No billing or cost-charging logic added
- [ ] No parent/player communication added
- [ ] No fake metrics in summary
