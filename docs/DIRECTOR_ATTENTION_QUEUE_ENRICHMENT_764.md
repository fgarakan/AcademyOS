# Sprint 764 — Director Attention Queue Enrichment V1

**Date:** 2026-05-24
**Sprint:** 764
**Status:** Complete

---

## Summary

Enriched `buildAttentionQueue()` inputs in `/director` with three operational data sources that were either empty (`overCapacityGroups = []`, `noCoverageGroupCount = 0`) or aggregate-only (`pendingApprovals`) in Sprint 763. All enrichments use small, read-only, `academy_id`-scoped queries — no new schema changes, no migrations, no RLS bypass.

---

## Enrichments audited

| Input field | Sprint 763 state | Sprint 764 state |
|---|---|---|
| `pendingApprovals` | Synthetic aggregate items (count-only) | Real per-item data from `v_pending_proposed_actions` with `expires_at` + `risk_level` |
| `overCapacityGroups` | `[]` hardcoded | Live from `v_group_summary` (groups where `player_count > max_players`) |
| `noCoverageGroupCount` | `0` hardcoded | Live from `v_group_summary` × `weekSessions.group_id` cross-check |
| `highAlerts` | Mapped from `priorityQueue` (unchanged) | Unchanged |
| `curriculumGapCount` | Direct pass-through (unchanged) | Unchanged |

---

## Enrichments wired

### A — `v_pending_proposed_actions` → `pendingApprovals`

**Query:**
```ts
const { data: pendingActionsRaw } = await rawDb
  .from('v_pending_proposed_actions')
  .select('action_id, action_label, expires_at, risk_level')
  .eq('academy_id', academyId)
  .limit(10)
```

**Fields available in view:** `action_id`, `action_label`, `expires_at`, `hours_remaining`, `risk_level`, `action_type`, `status`, `proposed_by_name`, `affected_count`.

**Wired fields:** `action_id` → `id`, `action_label` → `actionLabel`, `expires_at` → `expiresAt`, `risk_level` → `riskLevel`.

**Effect:** `buildAttentionQueue()` now receives real per-item data for each pending proposed_action. The `expiring_action` source type is now activated when `expiresAt` is within 24 hours. Items with `risk_level: 'high'` / `'critical'` will appear higher in the sorted queue.

**Fallback:** If the view returns 0 rows AND `pendingWrapUpsCount > 0`, a synthetic aggregate wrap-up item is added (defensive — ensures no signal is silently dropped if the view is unexpectedly empty).

**Non-proposed-action synthetics retained:** `newRequests` (lesson requests), `reassessmentDue`, `pendingCount` (placements) — these are not in `proposed_actions` and must remain synthetic.

---

### B — `v_group_summary` → `overCapacityGroups`

**Query:**
```ts
const { data: groupSummaryRaw } = await rawDb
  .from('v_group_summary')
  .select('group_id, group_name, player_count, max_players')
  .eq('academy_id', academyId)
```

**Fields available in view:** `group_id`, `group_name`, `player_count`, `max_players`, `capacity_pct`, `lead_coach_name`, `level_label`, `overdue_reassessments`, `upcoming_assessments`, etc.

**Wired fields:** `group_id` → `id`, `group_name` → `name`, `player_count` → `memberCount`, `max_players` → `maxPlayers`.

**Filter:** Groups where `player_count > max_players` AND both fields non-null.

**Effect:** `buildAttentionQueue()` now produces `over_capacity_group` items labelled "Watch" in the hero. Previously this source produced no items.

**Fallback:** If no groups exceed capacity, `overCapacityGroups = []` (same as Sprint 763 default).

---

### C — `v_group_summary` × `weekSessions` → `noCoverageGroupCount`

**Computation (no additional query):**
```ts
const sessionGroupIds = new Set(
  (weekSessions ?? []).map(s => s.group_id).filter(Boolean) as string[],
)
const noCoverageGroupCount = groupSummaryRows.filter(
  g => g.group_id !== null && !sessionGroupIds.has(g.group_id),
).length
```

**Data sources:**
- `groupSummaryRows` — from Query A above (already fetched)
- `weekSessions` — already fetched by existing sessions query (has `group_id`)

**No additional DB query needed** — cross-check performed in-memory.

**Effect:** `buildAttentionQueue()` now produces `no_session_coverage` items labelled "Watch" when groups have no sessions scheduled this week.

**Caveats:**
- A group with `group_id = null` on any session is not counted (safe — nulls are excluded from the Set)
- If an academy has no groups, `noCoverageGroupCount = 0` (correct)
- Sessions without a `group_id` are excluded from coverage check (session coverage = explicitly group-assigned sessions)

---

## Enrichments deferred and why

| Enrichment | Status | Reason |
|---|---|---|
| `hours_remaining` from view | Deferred | `buildAttentionQueue()` uses `hoursUntil(expiresAt)` directly — `hours_remaining` is redundant; the `expires_at` field enables the same logic |
| `affected_count` from view | Deferred | Not part of `AttentionQueueInput` interface; future enhancement to show "3 players affected" |
| `issuer_role` from view | Deferred | Not needed for priority computation |
| Group capacity `capacity_pct` from view | Deferred | `player_count > max_players` is the correct threshold for the "Watch" flag; `capacity_pct` would only add false positives below 100% |

---

## Query / data provenance summary

| Input | Source | Type | New? |
|---|---|---|---|
| `pendingApprovals` (real items) | `v_pending_proposed_actions` | Live DB view, `limit(10)` | ✓ New (Sprint 764) |
| `overCapacityGroups` | `v_group_summary` | Live DB view | ✓ New (Sprint 764) |
| `noCoverageGroupCount` | `v_group_summary` × `weekSessions` in-memory | Derived (no extra query) | ✓ New (Sprint 764) |
| `highAlerts` | `v_academy_priority_queue` (priorityQueue) | Live DB view | Unchanged |
| `curriculumGapCount` | `academy_suggestions` (curricGapCount) | Live DB count | Unchanged |

---

## Empty / fallback behavior

| Condition | Behavior |
|---|---|
| `v_pending_proposed_actions` returns 0 rows AND `pendingWrapUpsCount > 0` | Synthetic fallback wrap-up item added to `pendingApprovals` |
| `v_pending_proposed_actions` returns 0 rows AND `pendingWrapUpsCount = 0` | `pendingApprovals` has only non-action synthetics (lesson requests, reassessment, placement) |
| `v_group_summary` returns no groups over capacity | `overCapacityGroups = []` — no Watch items |
| All groups have sessions this week | `noCoverageGroupCount = 0` — no no-coverage Watch items |
| `buildAttentionQueue()` receives all zeros | `queue.isEmpty = true` — hero shows "Today looks clear" |

---

## TypeScript validation

```
npx tsc --noEmit → EXIT 0 (clean)
```

---

## Protected files not staged

| File | Status | Reason |
|---|---|---|
| `docs/SPRINT_398_MANUAL_SQL_EXECUTION_PACKET.md` | Pre-existing modified | Unrelated to Sprint 764 |
| `src/app/api/director/interview/realtime-session/route.ts` | Pre-existing modified | Unrelated to Sprint 764 |
| `src/components/assistant/DonnaAssistantButton.tsx` | Pre-existing modified | DONNA operator-step changes — needs dedicated sprint |
| `.qa-voice-intake-temp.mts` | Temp file | Never touched |

---

## Remaining command center gaps

| Gap | Notes |
|---|---|
| `action_label` in view may be null | Fallback to 'Pending action requiring review' — see code |
| Group coverage: sessions without `group_id` excluded | Ungrouped sessions won't show as coverage |
| `overCapacityGroups` route is `/director/groups` which is not yet built | Route exists in nav but page doesn't exist — link still valid as navigation target |
| DONNA prompt chips in DonnaExecutiveCard | Future sprint — condition not yet met |
| Broader KPI aggregation | Deferred — not in this sprint scope |
