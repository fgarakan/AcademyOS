# Sprint 763 — Director Attention Queue Hero Wiring V1

**Date:** 2026-05-24
**Sprint:** 763
**Status:** Complete

---

## Summary

Wired `buildAttentionQueue()` from `src/lib/director/attentionQueue/index.ts` (Sprint 472) into the director home page (`/director`) as a new `DirectorAttentionQueueHero` hero section. The hero is the first content section a director sees after their name greeting and the DNA setup panel, placing "What needs my attention today?" at the top of the command center.

No new DB queries were added. All data fed to `buildAttentionQueue()` comes from queries already executed in `page.tsx`.

---

## Attention queue source used

**Library:** `src/lib/director/attentionQueue/index.ts`

| Export | Purpose |
|---|---|
| `buildAttentionQueue(input)` | Produces typed, priority-sorted `AttentionQueue` from raw operational data |
| `AttentionQueueInput` | Input type (pendingApprovals, highAlerts, overCapacityGroups, curriculumGapCount, noCoverageGroupCount) |
| `AttentionQueue` | Output type (items, criticalCount, highCount, totalCount, isEmpty) |
| `AttentionItem` | Per-item shape (id, source, priority, label, description, href, expiresAt, entityId, entityLabel) |
| `AttentionSource` | 7-value source enum |
| `AttentionPriority` | 4-value priority enum (critical / high / medium / low) |

**Priority sort:** `buildAttentionQueue()` sorts items critical → high → medium → low before returning them. The hero shows the top 3 by default.

---

## Input data mapping (no new DB queries)

| Input field | Data source in page.tsx | Notes |
|---|---|---|
| `pendingApprovals` | Derived from existing counts: `pendingWrapUpsCount`, `newRequests`, `reassessmentDue`, `pendingCount` | Aggregate items — real counts, not fabricated |
| `highAlerts` | Mapped from `priorityQueue` (from `getAcademyPriorityQueue()`, already fetched) | `urgency → severity` mapping: immediate→critical, urgent/high→high, else→medium |
| `overCapacityGroups` | `[]` empty | No group capacity query exists on this page — intentionally not fabricated |
| `curriculumGapCount` | `curricGapCount` (from `academy_suggestions` pending count) | Direct pass-through |
| `noCoverageGroupCount` | `0` | No per-group session coverage query — intentionally not fabricated |

---

## Director hero / component wired

**New component:** `src/app/director/_components/DirectorAttentionQueueHero.tsx`

**Modified route:** `src/app/director/page.tsx`

The `DirectorAttentionQueueHero` is rendered immediately after the post-DNA setup panel and immediately before the `DonnaExecutiveCard` — first in the content hierarchy below the header.

**Page order after Sprint 763:**
1. Hero greeting header
2. DirectorContinueSetupPanel (DNA setup progress)
3. **DirectorAttentionQueueHero** ← NEW (attention queue hero)
4. DonnaExecutiveCard (DONNA interpretation, secondary)
5. DonnaDashboardPresenceCTA
6. Academy Setup / Live banner
7. AcademyKpiCardsSection (8-card KPI grid)
8. DirectorKpiHealthSection (formal KPI framework)
9. Health chart + Live Activity
10. Player Activity (Priority Queue + Pending Placement)
11. Signals + Intelligence (Alerts + AI Suggestions)
12. Curriculum Coverage
13. Sessions This Week
14. Quick Actions

**Removed:** `priorityAction` computation and its `NextBestActionCard` priority banner render — subsumed by the richer attention queue hero. The "Create first class template" usage of `NextBestActionCard` is retained.

---

## Attention item categories displayed

| Category | AttentionSource | Visual |
|---|---|---|
| **Decision** | `pending_approval` | Lime chip — action required by director |
| **Decision** (urgent) | `expiring_action` | Red chip — expires within 24h |
| **Risk** | `high_alert` / `at_risk_player` | Red chip — player signal |
| **Watch** | `over_capacity_group` / `no_session_coverage` | Yellow chip — operational concern |
| **Opportunity** | `curriculum_gap` | Blue chip — curriculum improvement |
| **FYI** | (fallback) | Muted chip — informational |

Each item also displays a priority-colored left border:
- Critical → `#FF3B30` (status-red)
- High → `#FF9500` (status-orange)
- Medium → `#FACC15` (yellow)
- Low → `#333333` (neutral)

---

## Empty state behavior

When `queue.isEmpty === true` (no operational data generates any attention items), the hero shows:

> ✅ **Today looks clear**
> No priority items at this time. Items appear as your academy generates activity.

This is the expected state for a fresh academy with no pending wrap-ups, no priority queue players, and no curriculum gaps.

---

## Safe actions exposed

All actions are read-only navigation. No mutations, approvals, sends, deletions, or level changes.

| Safe action label | Triggered when href starts with |
|---|---|
| Open Review | `/director/review` |
| View Player | `/director/players/<id>` |
| View Players | `/director/players` (list) |
| View Sessions | `/director/sessions` |
| View Curriculum | `/director/curriculum` |
| View Groups | `/director/groups` |
| View Details | (fallback — any other route) |
| Ask DONNA → | Footer link to `/director/donna` |

The "View all N items →" footer link goes to `/director/review`.

---

## DONNA integration — safe only

- `DonnaExecutiveCard` is retained and displayed below the `DirectorAttentionQueueHero`.
- No changes to DONNA dispatch internals.
- `DonnaAssistantButton.tsx` not touched.
- `DonnaExecutiveCard` does not currently support prompt options — the sprint condition ("If DonnaExecutiveCard already supports prompts") was not met. DONNA prompt chips are a future sprint.
- "Ask DONNA →" footer link in the hero navigates to `/director/donna`.

---

## Protected files not staged

| File | Status | Reason |
|---|---|---|
| `docs/SPRINT_398_MANUAL_SQL_EXECUTION_PACKET.md` | Pre-existing modified | Unrelated to Sprint 763 |
| `src/app/api/director/interview/realtime-session/route.ts` | Pre-existing modified | Unrelated to Sprint 763 |
| `src/components/assistant/DonnaAssistantButton.tsx` | Pre-existing modified | DONNA operator-step changes; needs dedicated DONNA sprint |
| `supabase/migrations/` | Untracked | Never touched |
| `.env.*` files | Untracked | Never touched |
| `data/` CSV files | Untracked | Never touched |

---

## What was intentionally not wired

| Item | Reason |
|---|---|
| `overCapacityGroups` | No group capacity query on director home page — would require new query; not in sprint scope |
| `noCoverageGroupCount` | No per-group session coverage query — would require new query; not in sprint scope |
| `at_risk_player` items via direct query | Covered by `highAlerts` from `priorityQueue` (already fetched) |
| DONNA prompt options in `DonnaExecutiveCard` | Condition not met (no prompt support exists); future sprint |
| Expiring-action logic | No `expires_at` field available from count-based data; would need per-item query |
| `buildKpiDashboard()` wiring | Not in scope — KPI aggregator work deferred |

---

## TypeScript validation

```
npx tsc --noEmit → EXIT 0 (clean)
```

No TypeScript errors introduced or left unresolved.

---

## Remaining command center gaps

| Gap | Next sprint |
|---|---|
| `overCapacityGroups` wiring | Requires small query to `groups` with `max_players` — Sprint 764 candidate |
| `noCoverageGroupCount` wiring | Requires groups × sessions cross-check — Sprint 764 candidate |
| Expiring action per-item data | Requires proposed_actions query with `expires_at` field — Sprint 764 candidate |
| DONNA morning brief prompts | Requires prompt UI in DonnaExecutiveCard or a new MorningBriefCard — future sprint |
| `groupIntelligence.ts` wiring | `/director/groups` page — future sprint |
| `curriculumOperatingView.ts` wiring | `/director/curriculum` page — future sprint |
| `kpiDashboard.ts` full aggregator | `KpiResult[]` from all engines — future sprint |
| `attendanceKpiEngine.ts` wiring | Needs per-session attendance rollup — future sprint |

---

## Recommended Sprint 764

**Sprint 764 — Director Attention Queue Enrichment V1**

Goal: Enrich the attention queue with two additional operational sources that could not be computed from existing page data in Sprint 763:

1. **`overCapacityGroups`** — Add a small query: `groups` table scoped to `academy_id`, filtered where `member_count > max_players`. Map result to `AttentionQueueInput.overCapacityGroups`.
2. **`noCoverageGroupCount`** — Cross-reference `groups` count against `weekSessions.group_id` set to find groups with zero sessions this week.
3. **Expiring approvals** — Change the `proposed_actions` count query to a limited select (10 rows) with `id`, `action_type`, `expires_at` fields so per-item expiry logic activates in `buildAttentionQueue()`.

No schema changes, no RLS changes, no new dependencies. Three small scoped queries.
