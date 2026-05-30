# QA — DONNA Multi-Turn Tool Loop V1 — Sprint 1001

**Date:** 2026-05-30
**Sprint:** 1001

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `multiTurnToolLoop.ts` compiles cleanly — all imports from orchestration modules resolve
- [ ] `orchestrator.ts` compiles cleanly with `runMultiTurnToolLoop` import and await call

---

## Second-Turn LLM Checklist (requires ANTHROPIC_API_KEY)

- [ ] When tool executes and `useLlm: true`:
  - [ ] `runMultiTurnToolLoop` is called
  - [ ] `buildToolResultSummary` returns non-empty string from tool output
  - [ ] `buildSecondTurnInput` adds user+donna turns to conversation history
  - [ ] Second LLM call made with `buildContextPacket(secondTurnInput)`
  - [ ] Final output has `source: 'llm_inferred'`
- [ ] When tool did NOT execute (`toolLoopResult.executed === false`):
  - [ ] `runMultiTurnToolLoop` returns `source: 'tool_interpretation_fallback'` immediately

---

## Tool Result Summary Checklist

- [ ] `buildToolResultSummary({ executed: false, ... })` returns `''`
- [ ] `buildToolResultSummary({ executed: true, output: { text: 'short' }, ... })` returns `'short'`
- [ ] Long text (>300 chars) is truncated at sentence boundary
- [ ] Summary does not contain raw player names, coach notes, or private data

---

## Second-Turn Context Checklist

- [ ] `buildSecondTurnInput` has `userInput: 'Based on the context above...'`
- [ ] `buildSecondTurnInput` conversation history includes 2 new turns (user + donna)
- [ ] Original `conversationHistory` is preserved and extended (not replaced)
- [ ] `buildContextPacket(secondTurnInput)` produces valid `ContextPacket`

---

## Fallback Checklist

- [ ] Tool not executed → `secondTurnSucceeded: false`, original tool output returned
- [ ] Tool summary blocked → `secondTurnSucceeded: false`, fallback
- [ ] `callDonnaLlm` throws → `secondTurnSucceeded: false`, fallback
- [ ] Second LLM has `hadBlockedContent: true` → `secondTurnSucceeded: false`, fallback
- [ ] Second LLM output fails validation → `secondTurnSucceeded: false`, fallback
- [ ] All failures logged to `safetyAudit[]`
- [ ] `runMultiTurnToolLoop` never throws

---

## Blocked Output Checklist

- [ ] Second turn with blocked action in text → validation fails, fallback used
- [ ] Second turn with `safetyLevel: 'blocked'` → validation fails, fallback used
- [ ] Second turn with disallowed output type → validation fails, fallback used

---

## Approval-Gated Behavior Checklist

- [ ] `draft_proposed_action` still blocked from Sprint 1000 (never reaches second turn)
- [ ] Approval-gated response from Sprint 1000 is preserved in fallback
- [ ] No DB write from multi-turn loop
- [ ] No `proposed_action` created without director confirmation

---

## No-Mutation / No-Send Checklist

- [ ] No DB write from second LLM call
- [ ] No parent/player message sent
- [ ] No player level changed
- [ ] No roster, billing, curriculum, session, template, or player record mutated
- [ ] Tool result summary contains no raw notes, no player names, no private data
- [ ] `detectBlockedAction(toolSummary)` prevents unsafe content reaching second LLM

---

## Sprint 1000 Regression Checklist

- [ ] `runToolExecutionLoop` unchanged — still executes safe tools
- [ ] `isSafeToExecuteDirectly` unchanged
- [ ] Sprint 1000 `ToolLoopResult` type unchanged
- [ ] Deterministic fast paths return directly (no second turn for deterministic outputs)

---

## Sprint 999 Regression Checklist

- [ ] `callDonnaLlm` unchanged — same signature, same safety checks
- [ ] First-turn LLM call still works when `useLlm: true`
- [ ] API key check still gates the LLM path
- [ ] Dynamic import pattern preserved

---

## Red-Team / Eval Regression Checklist

- [ ] `runEvaluationHarness()` still returns `failed: 0` (28 cases)
- [ ] `runRedTeamSafetyQA()` still returns `failed: 0` (21 cases)
- [ ] `runGodModeV2Certification()` still returns `goNoGo: 'GO'` (12 checks)
- [ ] Sprint 978 `safetyContract.ts` unchanged
- [ ] Sprint 904 approve/reject paths untouched

---

## Protected Systems Checklist

- [ ] `orchestrator.ts` multi-turn addition is isolated to LLM path only
- [ ] Sprint 998 `godModeV2Certification.ts` still compiles
- [ ] Sprint 997 `redTeamSafetyQA.ts` still compiles
- [ ] Sprint 982 `evaluationHarness.ts` still compiles
- [ ] One DONNA button remains
- [ ] No new DONNA surface
- [ ] No new voice path
- [ ] No schema changes
- [ ] No RLS changes
