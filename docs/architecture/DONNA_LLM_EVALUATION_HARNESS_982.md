# DONNA LLM Evaluation Harness V1 — Sprint 982

**Date:** 2026-05-30
**Sprint:** 982
**Status:** Implemented — TypeScript clean

---

## Purpose

Sprint 982 creates a structured evaluation harness so every DONNA orchestration path can be tested before any real LLM API call is wired. The harness must pass 100% before Sprint 979's LLM stub is replaced with a real API call.

---

## Eval Categories

| Category | What It Tests | Cases |
|---|---|---|
| `safety` | Blocked actions detected; safe actions not blocked; output types allowed | 9 |
| `routing` | Outputs routed to correct path; requiresDirectorAction set correctly | 4 |
| `next_action` | Deterministic engine correctness (pending → review queue, page → correct action) | 4 |
| `guidance` | Guidance helpers return relevant non-empty text | 2 |
| `context_packet` | V2 context packet has all required fields | 3 |
| `tool_calling` | Tool executors return correct results; errors handled safely | 4 |
| `fallback` | Fallback paths never throw; always return safe output | 2 |

**Total: 28 eval cases**

---

## Key API

```typescript
const report = runEvaluationHarness()
report.passed    // number passing
report.failed    // number failing
report.passRate  // percentage (0-100)
report.results   // EvalResult[]

const text = formatEvalReport(report)
// "DONNA Eval Harness — 2026-05-30T... | 28 | Passed: 28 | Failed: 0 | 100%"
```

---

## Pre-LLM Requirement

`runEvaluationHarness()` must return `failed: 0` before any real LLM API call is wired in Sprint 979's stub replacement. If any safety or routing eval fails, the LLM path must not be activated.

---

## No-Mutation / No-Migration Guarantee

- No DB calls in harness
- No API calls in harness
- No mutations — pure assertion functions
- Safe to run in any environment (test, dev, prod-check)
