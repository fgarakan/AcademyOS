# QA — Sprint 1089: DONNA Retrieval Budget Caps V1

**Date:** 2026-06-01
**Sprint:** 1089

---

## Test 1 — File exists and compiles

| # | Check | Expected | Pass? |
|---|---|---|---|
| 1.1 | `donnaRetrievalBudget.ts` exists | File present | |
| 1.2 | `npx tsc --noEmit` | Zero new errors | |
| 1.3 | Exports `DonnaRetrievalMode` type | `'default' \| 'deep'` | |
| 1.4 | Exports `DonnaRetrievalSource` type | 7 values | |
| 1.5 | Exports `DonnaRetrievalBudget` interface | 8 fields | |
| 1.6 | Exports `DonnaRetrievalBudgetUsage` interface | 11 fields inc. withinBudget | |
| 1.7 | Exports `DONNA_DEFAULT_RETRIEVAL_BUDGET` | Present | |
| 1.8 | Exports `DONNA_DEEP_RETRIEVAL_BUDGET` | Present | |
| 1.9 | Exports `getDonnaRetrievalBudget` | Present | |
| 1.10 | Exports `clampRetrievedItems` | Present | |
| 1.11 | Exports `buildRetrievalBudgetUsage` | Present | |
| 1.12 | Exports `summarizeRetrievalBudgetUsage` | Present | |
| 1.13 | Exports `assertWithinRetrievalBudget` | Present | |

---

## Test 2 — Default budget values

| # | Field | Expected value | Pass? |
|---|---|---|---|
| 2.1 | `DONNA_DEFAULT_RETRIEVAL_BUDGET.productMemoryRules` | `3` | |
| 2.2 | `DONNA_DEFAULT_RETRIEVAL_BUDGET.curriculumNodes` | `5` | |
| 2.3 | `DONNA_DEFAULT_RETRIEVAL_BUDGET.knowledgeItems` | `3` | |
| 2.4 | `DONNA_DEFAULT_RETRIEVAL_BUDGET.playerEvidenceItems` | `5` | |
| 2.5 | `DONNA_DEFAULT_RETRIEVAL_BUDGET.coachNotes` | `3` | |
| 2.6 | `DONNA_DEFAULT_RETRIEVAL_BUDGET.sessionSummaries` | `3` | |
| 2.7 | `DONNA_DEFAULT_RETRIEVAL_BUDGET.parentCommunicationRules` | `2` | |
| 2.8 | `DONNA_DEFAULT_RETRIEVAL_BUDGET.totalContextItems` | `12` | |

---

## Test 3 — Deep Mode budget values

| # | Field | Expected value | Pass? |
|---|---|---|---|
| 3.1 | `DONNA_DEEP_RETRIEVAL_BUDGET.productMemoryRules` | `6` | |
| 3.2 | `DONNA_DEEP_RETRIEVAL_BUDGET.curriculumNodes` | `12` | |
| 3.3 | `DONNA_DEEP_RETRIEVAL_BUDGET.knowledgeItems` | `8` | |
| 3.4 | `DONNA_DEEP_RETRIEVAL_BUDGET.playerEvidenceItems` | `15` | |
| 3.5 | `DONNA_DEEP_RETRIEVAL_BUDGET.coachNotes` | `10` | |
| 3.6 | `DONNA_DEEP_RETRIEVAL_BUDGET.sessionSummaries` | `8` | |
| 3.7 | `DONNA_DEEP_RETRIEVAL_BUDGET.parentCommunicationRules` | `4` | |
| 3.8 | `DONNA_DEEP_RETRIEVAL_BUDGET.totalContextItems` | `40` | |

---

## Test 4 — getDonnaRetrievalBudget helper

| # | Input | Expected | Pass? |
|---|---|---|---|
| 4.1 | `getDonnaRetrievalBudget('default')` | `=== DONNA_DEFAULT_RETRIEVAL_BUDGET` | |
| 4.2 | `getDonnaRetrievalBudget('deep')` | `=== DONNA_DEEP_RETRIEVAL_BUDGET` | |

---

## Test 5 — clampRetrievedItems helper

| # | Input | Expected | Pass? |
|---|---|---|---|
| 5.1 | 5 knowledge items, source='knowledgeItems', mode='default' | Returns first 3 | |
| 5.2 | 2 knowledge items, source='knowledgeItems', mode='default' | Returns all 2 (≤ cap) | |
| 5.3 | 10 curriculum nodes, source='curriculumNodes', mode='default' | Returns first 5 | |
| 5.4 | 10 knowledge items, source='knowledgeItems', mode='deep' | Returns first 8 | |
| 5.5 | 0 items | Returns empty array | |
| 5.6 | Exactly at cap: 3 knowledge items, default | Returns all 3 | |
| 5.7 | 5 productMemory rules, mode='default' | Returns first 3 | |
| 5.8 | 5 productMemory rules, mode='deep' | Returns all 5 (≤ 6 cap) | |

---

## Test 6 — buildRetrievalBudgetUsage helper

| # | Input | Expected | Pass? |
|---|---|---|---|
| 6.1 | `{ knowledgeItems: 3 }`, mode=`'default'` | `withinBudget: true`, `totalContextItems: 3`, `overBudgetSources: []` | |
| 6.2 | `{ knowledgeItems: 4 }`, mode=`'default'` | `withinBudget: false`, `overBudgetSources: ['knowledgeItems']` | |
| 6.3 | All sources at 0, mode=`'default'` | `withinBudget: true`, `totalContextItems: 0` | |
| 6.4 | `{ knowledgeItems: 3, curriculumNodes: 10 }`, mode=`'default'` | Over budget on curriculumNodes | |
| 6.5 | `totalContextItems` computed as sum | Equals sum of all source counts | |

---

## Test 7 — summarizeRetrievalBudgetUsage helper

| # | Check | Expected | Pass? |
|---|---|---|---|
| 7.1 | Output contains `mode:default` | Yes | |
| 7.2 | Output contains `knowledge:3/3` for 3 items in default mode | Yes | |
| 7.3 | Output contains `withinBudget:true` when within budget | Yes | |
| 7.4 | Output contains `OVER_BUDGET:knowledgeItems` when over budget | Yes | |
| 7.5 | Output is a single non-empty string | Yes | |
| 7.6 | No raw content in output — counts only | Yes | |

---

## Test 8 — assertWithinRetrievalBudget helper

| # | Input | Expected | Pass? |
|---|---|---|---|
| 8.1 | Usage within budget, mode='default' | `true` | |
| 8.2 | Usage over budget on knowledge, mode='default' | `false` | |
| 8.3 | Usage mode='deep' but asserting 'default' | `false` (mode mismatch) | |
| 8.4 | Never throws — always returns boolean | No exception | |

---

## Test 9 — Knowledge content tool wiring

| # | Check | Expected | Pass? |
|---|---|---|---|
| 9.1 | `liveContextToolExecutor.ts` imports `clampRetrievedItems` | Present | |
| 9.2 | `ranked` → `capped` via `clampRetrievedItems(ranked, 'knowledgeItems', 'default')` | Present | |
| 9.3 | `buildKnowledgeResponse` uses `capped` not `ranked` | Yes | |
| 9.4 | `data.entries` uses `capped` not `ranked` | Yes | |
| 9.5 | `auditEntry` shows `results=${capped.length}` | Yes | |
| 9.6 | 5 knowledge entries from DB → max 3 injected into LLM context | Clamped to 3 | |
| 9.7 | 2 knowledge entries from DB → all 2 returned (≤ cap) | Unchanged | |

---

## Test 10 — Regression checks

| # | Check | Expected | Pass? |
|---|---|---|---|
| 10.1 | God Mode still works | Unchanged | |
| 10.2 | Sprint 1086 Deep Mode gate intact | Unchanged | |
| 10.3 | Sprint 1090 Brian Alpha Sandbox intact | Unchanged | |
| 10.4 | Sprint 1080 token logging intact | Unchanged | |
| 10.5 | Sprint 1081 tool manifest filtering intact | Unchanged | |
| 10.6 | `donnaProductMemory.ts` unchanged (not wired) | Not modified | |
| 10.7 | TypeScript: `npx tsc --noEmit` | Zero new errors | |

---

## Acceptance Criteria Summary

- [ ] `DONNA_DEFAULT_RETRIEVAL_BUDGET` has all 8 fields with correct values
- [ ] `DONNA_DEEP_RETRIEVAL_BUDGET` has all 8 fields with correct values
- [ ] `clampRetrievedItems` correctly slices to cap
- [ ] `buildRetrievalBudgetUsage` correctly identifies over-budget sources
- [ ] Knowledge content tool uses `clampRetrievedItems` (3 items max in default mode)
- [ ] No existing DONNA behavior changed beyond tighter knowledge item cap
- [ ] TypeScript passes
