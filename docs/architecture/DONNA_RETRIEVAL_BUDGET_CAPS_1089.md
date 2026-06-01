# Sprint 1089 — DONNA Retrieval Budget Caps V1

**Date:** 2026-06-01
**Sprint:** 1089

---

## Problem

As DONNA's intelligence layer becomes more connected — product memory (Sprint 1078), curriculum nodes, knowledge builder (Sprint 1017), player evidence, coach notes, session history, parent communication rules — retrieval can become expensive, slow, and noisy unless capped by default. Without explicit caps, any future integration could silently over-retrieve and inflate token costs, latency, and context noise.

---

## Existing Retrieval Sources (pre-1089)

| Source | Wired | Existing cap |
|---|---|---|
| `get_academy_state` | Yes (tool executor) | None needed — count queries only |
| `get_player_development_summary` | Yes (tool executor) | None needed — count queries only |
| `get_player_profile_summary` | Yes (tool executor) | 1 item by design |
| `get_session_context` | Yes (tool executor) | 1 item by design |
| `get_curriculum_context` | Yes (tool executor) | Count queries only |
| `get_knowledge_content` | Yes (tool executor) | `limit: 5` hardcoded in DB query |
| Product memory rules | Not wired | No cap defined |
| Curriculum nodes/drills | Not wired | No cap defined |
| Player evidence items | Not wired | No cap defined |
| Coach notes | Not wired | No cap defined |
| Session summaries plural | Not wired | No cap defined |
| Parent communication rules | Not wired | No cap defined |

---

## New: DonnaRetrievalBudget Policy

### File

`src/lib/donna/donnaRetrievalBudget.ts`

Pure TypeScript — no DB, no API. Safe to import from any context.

### Types

```typescript
export type DonnaRetrievalMode = 'default' | 'deep'

export type DonnaRetrievalSource =
  | 'productMemoryRules' | 'curriculumNodes' | 'knowledgeItems'
  | 'playerEvidenceItems' | 'coachNotes' | 'sessionSummaries'
  | 'parentCommunicationRules'

export interface DonnaRetrievalBudget {
  productMemoryRules: number   curriculumNodes: number
  knowledgeItems: number       playerEvidenceItems: number
  coachNotes: number           sessionSummaries: number
  parentCommunicationRules: number    totalContextItems: number
}

export interface DonnaRetrievalBudgetUsage {
  // ... per-source counts ...
  totalContextItems: number
  mode: DonnaRetrievalMode
  withinBudget: boolean
  overBudgetSources: DonnaRetrievalSource[]
}
```

### Budget Constants

| Source | Default | Deep Mode |
|---|---|---|
| `productMemoryRules` | **3** | 6 |
| `curriculumNodes` | **5** | 12 |
| `knowledgeItems` | **3** | 8 |
| `playerEvidenceItems` | **5** | 15 |
| `coachNotes` | **3** | 10 |
| `sessionSummaries` | **3** | 8 |
| `parentCommunicationRules` | **2** | 4 |
| `totalContextItems` | **12** | 40 |

### Helpers

```typescript
getDonnaRetrievalBudget(mode)          // returns budget object for mode
clampRetrievedItems(items, source, mode) // slices to cap for that source+mode
buildRetrievalBudgetUsage(counts, mode)  // computes usage with withinBudget + overBudgetSources
summarizeRetrievalBudgetUsage(usage)     // compact string for audit logs
assertWithinRetrievalBudget(usage, mode) // returns boolean — never throws
```

---

## Sprint 1089 Wiring: Knowledge Content Tool

`liveContextToolExecutor.ts` — `execGetKnowledgeContent`:

```typescript
// Before (hardcoded limit only in DB query):
const ranked = rankKnowledgeByPageAffinity(filtered, '/director')
const responseText = buildKnowledgeResponse(ranked, query)
data: { entries: ranked.map(...) }

// After (budget policy enforced at LLM injection boundary):
const capped = clampRetrievedItems(ranked, 'knowledgeItems', 'default')
const responseText = buildKnowledgeResponse(capped, query)
data: { entries: capped.map(...) }
```

The DB query still uses `limit: 5` (allows ranking headroom). The `clampRetrievedItems` cap of **3** (default mode) is applied at the point items enter the LLM context — the enforcement boundary that matters.

---

## Usage Rules for Future Retrieval Systems

Every future DONNA retrieval integration **MUST** follow these rules:

1. **Call `clampRetrievedItems(items, source, 'default')` before injecting items into any LLM prompt.**
2. **Only use `'deep'` mode after confirmed explicit director authorization** (Sprint 1086 gate or Sprint 1090 Sandbox disclosure).
3. **Product memory** — retrieve by category (`getApprovedProductMemoryByCategory`), never inject the full `SEED_PRODUCT_MEMORY` array.
4. **Curriculum nodes** — prioritize current level, active pathway, page-context.
5. **Player evidence** — prioritize recent, approved, most-relevant items.
6. **Coach notes** — summarize before injection; never raw text.
7. **Knowledge items** — platform-owner-approved entries only (enforced by `knowledgeBuilderBridge`).
8. **After clamping**, call `buildRetrievalBudgetUsage` and include `summarizeRetrievalBudgetUsage(usage)` in the `safetyAudit` array for observability.

---

## What Is NOT Wired in This Sprint

- Product memory injection into orchestrator prompts
- Curriculum node retrieval tool
- Player evidence retrieval tool
- Coach notes retrieval tool
- Session summaries plural tool
- Parent communication rules injection

All of these are future sprint concerns. The budget policy file is the contract they must follow when built.
