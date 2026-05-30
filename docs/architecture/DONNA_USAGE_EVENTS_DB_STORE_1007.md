# Architecture — DONNA Usage Events DB Store V1 — Sprint 1007

**Date:** 2026-05-30
**Sprint:** 1007
**Depends on:** Sprint 1006 (DONNA Usage Aggregation V1)

---

## Problem

Sprint 1005 logs usage events to structured stdout and an in-process Map.
Sprint 1006 exposes those counts via `getDonnaUsageSummary()`.

The in-process store has three hard limits:
1. Resets on every cold start (serverless)
2. Not shared across instances (parallel requests → split counts)
3. Only has today's counts (no historical window)

Before internal pilot expansion, the platform owner and director need reliable multi-day usage visibility — not ephemeral per-instance counts.

---

## Solution

Sprint 1007 adds:
1. A persistent `usage_events` DB table (migration 075)
2. `writeUsageEventToDb(supabase, event)` — additive DB write alongside existing stdout log
3. DB query path in `getDonnaUsageSummary(academyId, windowDays, supabase?)` — when a client is provided, returns `dataSource: 'db_backed'`

---

## Migration 075: usage_events table

```sql
usage_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid()
  academy_id     UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE
  event_type     TEXT NOT NULL
  provider       TEXT               -- 'anthropic' | 'openai'
  model          TEXT               -- 'claude-sonnet-4-6' etc.
  input_tokens   INTEGER
  output_tokens  INTEGER
  latency_ms     INTEGER
  blocked        BOOLEAN NOT NULL DEFAULT FALSE
  blocked_reason TEXT               -- 'rate_limit' | 'kill_switch' | 'quota_exceeded'
  request_id     TEXT               -- safe correlation label (no raw content)
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

Indexes:
- `(academy_id, occurred_at DESC)` — primary time-range query
- `(academy_id, event_type, occurred_at DESC)` — type-filtered queries

RLS:
- INSERT: `auth_is_staff()` — server actions running with staff auth context
- SELECT: `auth_is_director_or_head()` — directors/head coaches query their academy's usage
- No UPDATE or DELETE — events are immutable by design

---

## writeUsageEventToDb

`writeUsageEventToDb(supabase: SupabaseClient, event: UsageEvent): Promise<void>`

- Additive write — runs alongside existing `logUsageEvent()` (in-process + stdout)
- Accepts a Supabase client (dependency injection — no module-level client creation)
- Maps `UsageEvent` fields to `usage_events` row
- Never throws — DB write failure is silently swallowed
- Called from Sprint 1010 server action after orchestrator returns

**Safe fields written:**
`event_type`, `academy_id`, `provider`, `model`, `input_tokens`, `output_tokens`, `latency_ms`, `blocked`, `blocked_reason`, `request_id`, `occurred_at`

**Never written:**
raw prompts, raw LLM responses, raw tool payloads, raw notes, player names, full UUIDs

---

## getDonnaUsageSummary upgrade

New signature: `getDonnaUsageSummary(academyId, windowDays, supabase?)`

| supabase param | Behavior |
|---|---|
| Provided | Queries `usage_events` table. `dataSource: 'db_backed'`. Covers full window. |
| Absent | Reads in-process accumulator. `dataSource: 'in_process'`. Today only. |
| DB query fails | Returns `dataSource: 'unavailable'` sentinel. Never throws. |

DB query: fetches `event_type + blocked` columns for matching academy/window/event-types.
Counting is done in TypeScript — no GROUP BY needed, safe for typical academy usage volumes.

---

## Wiring plan

Sprint 1007 creates the infrastructure. Actual wiring of `writeUsageEventToDb` into the DONNA call stack happens in Sprint 1010 (DONNA Live Orchestrator Server Action), when:
1. The server action has a Supabase client
2. After getting the orchestrator response, calls `writeUsageEventToDb(supabase, event)` for each tracked call
3. `getDonnaUsageSummary(academyId, 7, supabase)` can then return real 7-day counts

---

## No-migration side-effect guarantee

`usage_events` has:
- No FKs to `players`, `sessions`, `template_blocks`, `curriculum_levels`, `proposed_actions`
- Only FK: `academy_id → academies(id) ON DELETE CASCADE` (same as all other tables)
- No triggers on other tables
- No shared sequences or constraints

This migration is fully isolated from all non-usage systems.

---

## Files created / modified

| File | Change |
|---|---|
| `supabase/migrations/075_donna_usage_events.sql` | New — usage_events table + RLS |
| `src/lib/usage/usageTracker.ts` | Modified — adds writeUsageEventToDb() |
| `src/lib/donna/llmOrchestration/donnaUsageSummary.ts` | Modified — adds optional Supabase DB query path |
| `docs/CHANGELOG.md` | Updated |
| `docs/QA_DONNA_USAGE_EVENTS_DB_STORE_1007.md` | New — QA checklist |
