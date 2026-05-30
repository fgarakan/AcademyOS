# Architecture — DONNA Usage Aggregation V1 — Sprint 1006

**Date:** 2026-05-30
**Sprint:** 1006
**Depends on:** Sprint 1005 (DONNA Usage Tracking V1)

---

## State before Sprint 1006

Sprint 1005 created three log-based usage tracking functions in `donnaUsageTracking.ts`:

| Function | When called | What it logs |
|---|---|---|
| `logDonnaLlmUsage()` | After each successful Anthropic API call | model, latency, token counts, output type label |
| `logDonnaToolUsage()` | After each live tool call (success or failure) | tool ID, latency, success flag, role |
| `logDonnaFallbackUsage()` | When DONNA falls back to deterministic response | reason category, role |

All three write to:
1. **Structured stdout** via `logInfo('usage_event', ...)` in `usageTracker.ts`
2. **In-process accumulator** — a module-level `Map<string, number>` keyed by `academyId:eventType:date`

The in-process accumulator is per-serverless-instance. It is not shared across instances and resets on cold start.

---

## Aggregation strategy

Sprint 1006 reads from the existing in-process accumulator via `getInProcessDailyCount(academyId, eventType)`.

This gives honest today-only counts for the current serverless instance.

**No DB queries are made. No schema changes are required. No migrations are needed.**

---

## Whether usage events are currently queryable

| Source | Queryable? | Persistent? | Shared across instances? |
|---|---|---|---|
| Structured stdout (logInfo) | No — log ingestion not configured | No | Depends on log aggregator |
| In-process Map (inProcessTotals) | Yes — via getInProcessDailyCount() | No — resets on cold start | No |
| Database usage_events table | Does not exist yet | — | — |

Sprint 1006 uses the in-process Map. Historical windows and per-tool breakdowns require a DB-backed store (V2+).

---

## Summary shape

```typescript
DonnaUsageSummary {
  academyId: string
  window: DonnaUsageWindow {
    windowDays: number       // requested days (1–90)
    windowStart: string      // ISO date (approximate — V1 only has today)
    windowEnd: string        // ISO date (today UTC)
    isInProcessOnly: boolean // always true in V1
    note: string             // honest limitation description
  }
  llmCallCount: number       // donna_intelligence_call events today
  toolCallCount: number      // donna_tool_call events today
  fallbackCount: number      // donna_orchestration_fallback events today
  tools: DonnaToolUsageSummary {
    totalToolCalls: number
    byToolId: undefined      // V2+: per-tool breakdown
  }
  fallbacks: DonnaFallbackSummary {
    totalFallbacks: number
    byReason: undefined      // V2+: per-reason breakdown
  }
  dataSource: 'in_process' | 'db_backed' | 'unavailable'
}
```

---

## Safe fields (exposed in summary)

- Event type counts (`llmCallCount`, `toolCallCount`, `fallbackCount`)
- Window metadata (dates, days, source label, note)
- Data source label (`in_process`)
- Total tool call count (aggregate only — no per-tool breakdown in V1)
- Total fallback count (aggregate only — no per-reason breakdown in V1)

---

## Blocked fields (never in summary)

- Raw prompts
- Raw LLM responses
- Raw tool payloads
- Raw coach notes, player notes, session notes
- Player names
- Full UUIDs
- Raw DB error messages
- Success/failure breakdown (not stored separately in in-process accumulator — V2+)
- Per-tool-ID counts (not stored by tool ID in in-process accumulator — V2+)
- Per-reason counts (not stored by reason in in-process accumulator — V2+)

---

## No raw event payload guarantee

`getDonnaUsageSummary()` only calls `getInProcessDailyCount(academyId, eventType)`, which returns a plain integer count from the in-process Map. No raw event objects are accessed, iterated, or returned.

---

## No-migration guarantee

Sprint 1006 creates one new TypeScript file (`donnaUsageSummary.ts`). No database migrations, no RLS changes, no new tables, no schema modifications of any kind.

---

## Optional UI decision

**UI indicator deferred.**

Audit finding: `DonnaPanelShell.tsx` is a stub component (Sprint 384). The DONNA panel is embedded inside `DonnaAssistantButton.tsx`, which manages 25+ state values and several side effects. Adding a usage indicator footer requires modifying this complex component, which is out of scope for Sprint 1006.

Decision: The aggregation contract and types are created in Sprint 1006. A director-only usage indicator can be added in a dedicated UI sprint once a safe injection point is identified.

---

## V2 roadmap

| Sprint | Change |
|---|---|
| Sprint 1007 | Add `usage_events` DB table with RLS, write usage events to DB, upgrade `getDonnaUsageSummary` to query DB |
| Sprint 1008 | Add per-tool-ID bucketing (requestId parsing or separate column) |
| Sprint 1009 | Add per-failure-reason bucketing for fallback events |
| Sprint 1010 | Director-only usage indicator in a safe panel location (after panel refactor) |
| Sprint 1011+ | Platform-owner multi-academy usage dashboard |

---

## Files created / modified

| File | Change |
|---|---|
| `src/lib/donna/llmOrchestration/donnaUsageSummary.ts` | New — aggregation types + getDonnaUsageSummary() |
| `docs/CHANGELOG.md` | Updated with Sprint 1006 entry |
| `docs/QA_DONNA_USAGE_AGGREGATION_1006.md` | New — QA checklist |
