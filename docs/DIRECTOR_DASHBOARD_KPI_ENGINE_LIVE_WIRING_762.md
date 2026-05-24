# Sprint 762 — Director Dashboard KPI Engine Live Wiring V1

**Date:** 2026-05-24
**Sprint:** 762
**Status:** Complete

---

## Summary

Wired two KPI engines into the director home page (`/director`) to promote two KPI cards from `no_data` placeholders to real or derived values:

1. **`recap_completion_rate`** — promoted from `no_data` → `partial` (live engine output via `computeRecapCompletionRate()` from `coachExecutionKpiEngine.ts`).
2. **`level_readiness_queue_size`** — enriched with `stalledPlayerCount` (players enrolled >180 days without advancement eligibility) surfaced as a provenance note.

---

## Engines audited

| Engine file | KPIs | Wired? | Reason |
|---|---|---|---|
| `coachExecutionKpiEngine.ts` | recap completion, observation quality | **Yes (recap only)** | Needs 2 small queries; academy-wide aggregate possible |
| `attendanceKpiEngine.ts` | attendance rate, absences, streaks | No | Per-player; needs session+player cross join; too broad for home page |
| `developmentVelocityKpiEngine.ts` | time-in-level, development velocity | No | Per-player; `computeDevelopmentVelocity` uses demo status; stalledPlayerCount used instead as enrichment note |
| `curriculumCoverageKpiEngine.ts` | curriculum coverage | No | Engine needs evidence records per requirement — proxy already wired in Sprint 761 |
| `groupIntelligenceEngine.ts` | group cohesion, collective velocity | No | Requires group-level data; `/director/groups` scope |

---

## Changes made

### `src/app/director/page.tsx`

1. **Import added:**
   ```ts
   import { computeRecapCompletionRate, type RecapCheckRow } from '@/lib/kpi/coachExecutionKpiEngine'
   ```

2. **`curricStateRows` query extended** — added `enrolled_at` to the select; typed cast updated to include `enrolled_at: string | null`.

3. **`stalledPlayerCount` computed:**
   ```ts
   const now180dAgo = new Date()
   now180dAgo.setDate(now180dAgo.getDate() - 180)
   const stalledPlayerCount = typedCurricRows.filter(r =>
     r.enrolled_at !== null &&
     new Date(r.enrolled_at) <= now180dAgo &&
     r.advancement_eligible !== true,
   ).length
   ```

4. **Two recap queries added** (after `pendingWrapUpsCount` block):
   - `sessions` query — fetches `id` of all `completed` sessions in last 30 days, scoped to `academy_id`.
   - `voice_notes` query — fetches `session_id` of all voice notes scoped to `academy_id` and `in` the completed session IDs.
   - `computeRecapCompletionRate(recapChecks, 30)` called → `recapCompletionPct: number | null`.
   - `recapCompletionPct` is `null` if no completed sessions exist in the 30-day window.

5. **`DirectorKpiHealthSection` render updated** — added `recapCompletionPct={recapCompletionPct}` and `stalledPlayerCount={stalledPlayerCount}` props.

### `src/app/director/_components/DirectorKpiHealthSection.tsx`

1. **Props interface updated:**
   ```ts
   recapCompletionPct: number | null  // from computeRecapCompletionRate() — partial (any voice_note counts)
   stalledPlayerCount: number          // players enrolled >180d, not yet advancement-eligible
   ```

2. **Unused imports removed:** `computeKpiStatus`, `formatKpiValue` (were imported in Sprint 761 but not used in component — engine outputs consumed in page.tsx instead).

3. **`recap_completion_rate` entry upgraded:**
   - Value: `props.recapCompletionPct` (real engine output, not null placeholder)
   - Provenance: `partial` when value exists, `no_data` when null (no completed sessions)
   - Note: includes data model gap G8 (no `recap_type` column — any voice_note counts as recap)

4. **`level_readiness_queue_size` provenance note enriched** with stalledPlayerCount:
   ```
   From player_curriculum_states.advancement_eligible — director page query.
   Also: N player(s) enrolled >180 days without advancement.
   ```

5. **`PROVENANCE_LABEL` corrected:** `partial: 'partial'` (was `proxy` — matches footer text).

---

## KPI data status after Sprint 762

| KPI | Status | Data source |
|---|---|---|
| `level_readiness_queue_size` | **live** | `player_curriculum_states.advancement_eligible` — plus stalledPlayerCount enrichment note |
| `curriculum_coverage` | **partial (proxy)** | `playersWithLevel / activePlayers * 100` — proxy from Sprint 761 |
| `recap_completion_rate` | **partial (engine)** | `computeRecapCompletionRate()` — completed sessions (30d) + any voice_note presence |
| `attendance_rate` | no_data | Requires session_attendance rollup |
| `player_progress_velocity` | no_data | Requires 60d of evidence progression |
| `coach_followthrough_rate` | no_data | Requires priority `addressed_at` tracking |
| `player_priority_coverage` | no_data | Requires player priorities rollup |
| `mental_performance_coverage` | no_data | Requires mental performance pathway tagging |
| `parent_summary_freshness` | no_data | Requires parent summary update timestamps |
| `template_usage_rate` | no_data | Requires sessions-with-template ratio |
| `badge_progress_rate` | no_data | Badge system not yet wired |
| `mission_completion_rate` | no_data | Mission system not yet wired |

---

## Data provenance summary

| Provenance | Count | Change from Sprint 761 |
|---|---|---|
| **live** | 1 | Unchanged |
| **partial** | 2 | +1 (`recap_completion_rate` promoted) |
| **no_data** | 9 | -1 |

---

## Known caveats and data model gaps

| Gap | Detail | Impact |
|---|---|---|
| **G8** — no `recap_type` column on `voice_notes` | Any voice note counts as a recap — over-counts if notes are tagged for other purposes | `recap_completion_rate` is `partial`, not `live` |
| Session date filter uses `scheduled_date` (string) | `sessions.scheduled_date` is a date string; `gte` filter uses ISO date format (YYYY-MM-DD) | Accurate for daily granularity |
| `enrolled_at` vs. actual advancement start | `enrolled_at` from `player_curriculum_states` — treated as level-start date proxy | Directionally correct; formal velocity metric needs separate evidence timestamps |

---

## Files intentionally not staged

| File | Reason |
|---|---|
| `docs/SPRINT_398_MANUAL_SQL_EXECUTION_PACKET.md` | Pre-existing modified file, unrelated to Sprint 762 |
| `src/app/api/director/interview/realtime-session/route.ts` | Pre-existing modified file, unrelated to Sprint 762 |
| `src/components/assistant/DonnaAssistantButton.tsx` | Pre-existing DONNA operator-step changes — needs dedicated DONNA sprint |

---

## Remaining wiring gaps — Sprint 763 candidates

| Module | Gap | Blocker |
|---|---|---|
| `buildKpiDashboard()` from `kpiDashboard.ts` | Requires `KpiResult[]` with numeric IDs from all engines | Needs academy-wide aggregator action + numeric↔string KPI bridge |
| `attendanceKpiEngine.ts` | `attendance_rate`, absences, streaks | Per-player; needs broad session cross-join |
| `curriculumCoverageKpiEngine.ts` | True evidence-level coverage % | Needs curriculum requirement evidence records |
| `player_progress_velocity` | Requirements advancing per player per month | 60-day evidence history required |
| `parent_summary_freshness` | Parent summary update timestamps | Not yet computed on director home page |
