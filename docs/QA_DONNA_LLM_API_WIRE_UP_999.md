# QA — DONNA LLM API Wire-Up V1 — Sprint 999

**Date:** 2026-05-30
**Sprint:** 999

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `llmApiClient.ts` compiles cleanly — all types from types.ts referenced
- [ ] `orchestrator.ts` compiles cleanly — type import for `LlmCallResult` resolves
- [ ] Dynamic import `await import('./llmApiClient')` resolves TypeScript correctly

---

## Pre-Certification Gate

- [ ] `runGodModeV2Certification()` returned `goNoGo: 'GO'` before implementation
- [ ] All 28 eval harness cases still pass after Sprint 999 changes
- [ ] All 21 red-team cases still pass after Sprint 999 changes

---

## LLM Client Checklist (requires ANTHROPIC_API_KEY)

- [ ] `callDonnaLlm(ctx, [])` with missing API key returns `output: null, error: 'API key not configured.'`
- [ ] `callDonnaLlm(ctx, [])` with valid API key returns `LlmCallResult` with `output` or `null`
- [ ] `llmResult.output.type` is in `VALID_OUTPUT_TYPES`
- [ ] `llmResult.output.text` is a non-empty string under 200 words
- [ ] `llmResult.inputTokens + llmResult.outputTokens <= 4800` (approx — 800 max output)
- [ ] `llmResult.hadBlockedContent` is `false` for safe responses
- [ ] External route suggestion is sanitized (not blocked entirely)

---

## Safety Validation Checklist

- [ ] Input with blocked action (e.g. "approve this wrap-up") returns `hadBlockedContent: true` before API call
- [ ] LLM response with blocked action in text returns `hadBlockedContent: true` after parse
- [ ] LLM response with `safetyLevel: 'blocked'` returns `output: null`
- [ ] Invalid JSON response returns `output: null, error: 'Invalid JSON response.'`
- [ ] Schema validation failure returns `output: null`
- [ ] `orchestrate({ ..., useLlm: true })` never throws — always returns `OrchestratorResponse`

---

## Orchestrator Integration Checklist

- [ ] Deterministic fast paths still resolve before LLM call:
  - [ ] "What should I do next?" → deterministic next-action (no LLM call)
  - [ ] "What should I review first?" → deterministic guidance (no LLM call)
- [ ] `orchestrate({ ..., useLlm: false })` still returns deterministic fallback
- [ ] `orchestrate({ ..., useLlm: true })` calls `callDonnaLlm()` when no deterministic match
- [ ] `safetyAudit` array contains entries from both deterministic and LLM paths

---

## Fallback Checklist

- [ ] API key missing → fallback response with context-aware text
- [ ] API returns 500 → fallback after 1 retry
- [ ] Empty API response → fallback
- [ ] Invalid JSON → fallback
- [ ] Blocked content → fallback with `hadBlockedAttempt: true`
- [ ] All fallbacks return `confidence: 'low', source: 'fallback'`

---

## Environment Setup

- [ ] `ANTHROPIC_API_KEY=sk-ant-...` added to `.env.local` to activate LLM path
- [ ] Without key: existing DONNA behavior unchanged (deterministic only)
- [ ] `ANTHROPIC_MODEL` env var override supported (defaults to `claude-sonnet-4-6`)

---

## Sprint 998 Regression

- [ ] `godModeV2Certification.ts` still compiles and runs
- [ ] `runGodModeV2Certification()` still returns `goNoGo: 'GO'`
- [ ] Sprint 978 safety contract (safetyContract.ts) unchanged
- [ ] All 7 fast-path deterministic handlers in DonnaAssistantButton unchanged
