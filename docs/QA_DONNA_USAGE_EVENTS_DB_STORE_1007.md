# QA — DONNA Usage Events DB Store V1 — Sprint 1007

**Date:** 2026-05-30
**Sprint:** 1007

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `usageTracker.ts` compiles with new `writeUsageEventToDb` export
- [ ] `donnaUsageSummary.ts` compiles with optional `supabase?: SupabaseClient` parameter
- [ ] `UsageEventRow` interface compiles cleanly
- [ ] `buildDbSummary()` function compiles cleanly
- [ ] `getDonnaUsageSummary` overload with 3 params compiles

---

## Migration Checklist

- [ ] `075_donna_usage_events.sql` creates `usage_events` table
- [ ] Table has `academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE`
- [ ] Table has `event_type TEXT NOT NULL`
- [ ] Table has `blocked BOOLEAN NOT NULL DEFAULT FALSE`
- [ ] Table has `occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- [ ] Index on `(academy_id, occurred_at DESC)` exists
- [ ] Index on `(academy_id, event_type, occurred_at DESC)` exists
- [ ] RLS enabled: `ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY`
- [ ] INSERT policy: `auth_is_staff()` + `academy_id = auth_academy_id()`
- [ ] SELECT policy: `auth_is_director_or_head()` + `academy_id = auth_academy_id()`
- [ ] No UPDATE policy (events are immutable)
- [ ] No DELETE policy (events are immutable)
- [ ] No FKs to players, sessions, template_blocks, proposed_actions, curriculum_levels

---

## DB Write Function Checklist

- [ ] `writeUsageEventToDb(supabase, event)` exists as exported async function
- [ ] Writes: academy_id, event_type, provider, model, input_tokens, output_tokens, latency_ms, blocked, blocked_reason, request_id, occurred_at
- [ ] Never writes: raw prompts, raw responses, raw notes, player names, full UUIDs
- [ ] Wrapped in try/catch — never throws
- [ ] DB write failure is silently swallowed (not re-thrown to caller)
- [ ] Returns `Promise<void>`

---

## Aggregation DB Path Checklist

- [ ] `getDonnaUsageSummary(academyId, windowDays)` (2-arg form) still uses in-process path
- [ ] `getDonnaUsageSummary(academyId, windowDays, supabase)` (3-arg form) uses DB path
- [ ] DB path queries `usage_events` table with `eq('academy_id', academyId)`
- [ ] DB path filters `in('event_type', ['donna_intelligence_call', 'donna_tool_call', 'donna_orchestration_fallback'])`
- [ ] DB path filters `gte('occurred_at', windowStart)` and `lt('occurred_at', windowEndExclusive)`
- [ ] DB path returns `dataSource: 'db_backed'` on success
- [ ] DB path returns `dataSource: 'unavailable'` on error
- [ ] In-process path still returns `dataSource: 'in_process'`
- [ ] Counts are computed in TypeScript from fetched rows (no GROUP BY needed)
- [ ] `window.isInProcessOnly` is `false` on DB path, `true` on in-process path

---

## Privacy Checklist

- [ ] `writeUsageEventToDb` does NOT write raw prompts
- [ ] `writeUsageEventToDb` does NOT write raw LLM responses
- [ ] `writeUsageEventToDb` does NOT write raw tool payloads
- [ ] `writeUsageEventToDb` does NOT write player names
- [ ] `writeUsageEventToDb` does NOT write coach notes
- [ ] `writeUsageEventToDb` does NOT write session notes
- [ ] `getDonnaUsageSummary` (DB path) only selects `event_type` and `blocked`
- [ ] DB query result is aggregated to counts — no raw row data returned

---

## RLS Checklist

- [ ] INSERT policy requires `auth_is_staff()` — only authenticated staff can write
- [ ] SELECT policy requires `auth_is_director_or_head()` — only directors/head coaches read
- [ ] `academy_id` check prevents cross-academy reads
- [ ] Parent/player roles cannot read usage events
- [ ] Coach role cannot read usage events (coach != head_coach for this policy)

---

## No Raw Content Checklist

- [ ] `request_id` column only contains safe labels (e.g. 'turn1:answer', 'api_key_missing')
- [ ] No raw prompt text in any column
- [ ] No raw LLM response text in any column
- [ ] No player name in any column
- [ ] No coach observation text in any column

---

## Sprint 1006 Regression Checklist

- [ ] `getDonnaUsageSummary(academyId, 1)` (2-arg) still returns in-process counts
- [ ] `getDonnaUsageSummary(academyId, 7)` (2-arg) still returns in-process counts with note
- [ ] `DonnaUsageSummary` shape unchanged
- [ ] `DonnaUsageWindow` shape unchanged
- [ ] Existing callers of `getDonnaUsageSummary` (if any) still compile

---

## Sprint 1005 Regression Checklist

- [ ] `logDonnaLlmUsage()` still compiles and runs correctly
- [ ] `logDonnaToolUsage()` still compiles and runs correctly
- [ ] `logDonnaFallbackUsage()` still compiles and runs correctly
- [ ] `logUsageEvent()` is unchanged (still sync, in-process + stdout)
- [ ] `logDonnaCall()` is unchanged

---

## Sprint 1004–1000 Regression Checklist

- [ ] `callDonnaLlm()` still compiles
- [ ] `runLiveToolExecutionLoop()` still compiles
- [ ] `runMultiTurnToolLoop()` still compiles
- [ ] `orchestrate()` still compiles
- [ ] Sprint 978 safety contract unchanged

---

## Protected Systems Checklist

- [ ] No writes to players, sessions, template_blocks, proposed_actions, curriculum_levels
- [ ] No writes to audit_logs (usage events are separate from audit trail)
- [ ] No trigger on any existing table
- [ ] No change to any existing migration
- [ ] No schema change beyond new usage_events table
- [ ] No new DONNA surface
- [ ] One DONNA button remains
- [ ] No parent/player communication
- [ ] No fake metrics
