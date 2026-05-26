# Sprint 844 — Player Priority Named Approver Attribution V1

**Date:** 2026-05-26
**Sprint:** 844
**Type:** UX — named approver resolution for active priority cards (director-only)
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 843 — named approver deferred pending audit

Sprint 843 added "Approved by director · Applied [date]" to each active priority card.
The generic "director" fallback was safe but imprecise — when multiple staff members
have director/head_coach roles, the attribution doesn't identify who specifically acted.

---

## Audit Findings

### audit_logs mapping — confirmed reliable

In `src/app/director/review/actions.ts` (`applyApprovedPriorityRecommendationAction`):

```ts
const priorityId = createdPriority.id as string

await rawDb.from('audit_logs').insert({
  academy_id: academyId,
  actor_id: user.id,
  action: 'priority_recommendation.priority.applied',
  target_type: 'player_priority',
  target_id: priorityId,   // ← = player_priorities.id
  payload: {
    applied_by: user.id,
    ...
  },
  ...
})
```

Confirmed:
- `audit_logs.action = 'priority_recommendation.priority.applied'` — exact literal ✅
- `audit_logs.target_id = priorityId` — is the `player_priorities.id` just created ✅
- `audit_logs.actor_id = user.id` — is the director who clicked "Apply" ✅
- Written in the same transaction as the priority INSERT ✅
- One audit entry per priority (apply action creates exactly one priority + one audit row) ✅

The mapping `audit_logs.target_id → player_priorities.id` is **1:1 and deterministic**.
Implementation is SAFE to proceed.

### Pattern reference — gate activity log attribution

Same resolution pattern already used in `page.tsx` for gate activity log (lines ~302–325):

```ts
const actorIds = Array.from(
  new Set(rawLog.filter(r => r.actor_id).map(r => r.actor_id as string))
)
const actorNameMap = new Map<string, string>()
if (actorIds.length > 0) {
  const { data: actorProfiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', actorIds)
  for (const p of (actorProfiles ?? [])) {
    actorNameMap.set(p.id, p.display_name)
  }
}
```

Sprint 844 uses the identical pattern.

---

## Solution

### `PlayerActivePriorities.tsx` changes

1. Added `approved_by_name?: string | null` to `PlayerPriorityRow` interface (optional — backward-compatible)
2. Updated attribution display: `p.approved_by_name ?? 'director'`

### `page.tsx` changes

After the `activePriorities` declaration, added:

1. **Batched audit_logs query** — fetches `target_id, actor_id` for all active priority IDs:
   ```ts
   const { data: priorityAuditRows } = await rawDb
     .from('audit_logs')
     .select('target_id, actor_id')
     .eq('academy_id', academyId)
     .eq('action', 'priority_recommendation.priority.applied')
     .in('target_id', priorityIds)
   ```

2. **Batched profiles query** — resolves actor IDs to display names:
   ```ts
   const { data: approverProfiles } = await supabase
     .from('profiles')
     .select('id, display_name')
     .in('id', approverActorIds)
   ```

3. **`enrichedActivePriorities`** — maps `activePriorities` with resolved names:
   ```ts
   const enrichedActivePriorities: PlayerPriorityRow[] = activePriorities.map(p => ({
     ...p,
     approved_by_name: priorityApproverMap.get(p.id) ?? null,
   }))
   ```

4. **`<PlayerActivePriorities priorities={enrichedActivePriorities} />`** — renders with names

---

## Query Impact

| Query | DB calls added |
|---|---|
| `audit_logs` | 1 call — batched, only when `activePriorities.length > 0` |
| `profiles` | 1 call — batched, only when actor IDs found |
| Total | 0–2 additional calls per page render |

The audit_logs call is scoped by `academy_id` + `action` + `target_id IN [ids]` — fully indexed query, no fan-out.

---

## Attribution Display Matrix

| Condition | Display |
|---|---|
| Audit entry found, profile has `display_name` | "Approved by [Name] · Applied [date]" |
| Audit entry found, profile has no `display_name` | "Approved by director · Applied [date]" (fallback) |
| No audit entry (legacy / manually-created priority) | "Approved by director · Applied [date]" (fallback) |
| No active priorities | Existing `EmptyState` unchanged |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No `player_priorities` writes | ✅ read-only enrichment only |
| No new mutations | ✅ display change only |
| No schema changes | ✅ no migrations |
| `academy_id` scoped throughout | ✅ both audit_logs and profiles queries |
| No parent/player visibility | ✅ component is director-only |
| Graceful fallback | ✅ `null` → "director" string |
| No N+1 queries | ✅ two batched queries regardless of priority count |
| Other `activePriorities` usages unchanged | ✅ `activePriorities` used everywhere else; only `PlayerActivePriorities` receives `enrichedActivePriorities` |

---

## Files Created

### `docs/PLAYER_PRIORITY_NAMED_APPROVER_ATTRIBUTION_844.md`

This file.

---

## Files Modified

### `src/app/director/players/[playerId]/PlayerActivePriorities.tsx`

1. Added `approved_by_name?: string | null` to `PlayerPriorityRow` (optional, backward-compatible)
2. Updated attribution comment (Sprint 843/844)
3. Changed display: `Approved by {p.approved_by_name ?? 'director'}`

### `src/app/director/players/[playerId]/page.tsx`

1. After `activePriorities` declaration: added `priorityApproverMap` build block
   - Query `audit_logs` (batched, academy_id scoped)
   - Resolve `profiles.display_name` for actor IDs (batched)
   - Populate map: `priorityId → display_name`
2. Created `enrichedActivePriorities: PlayerPriorityRow[]`
3. Changed `<PlayerActivePriorities priorities={activePriorities} />` to `enrichedActivePriorities`

---

## Score Impact (estimated)

Dimension 5 — Approve → Apply Path Completeness: **8.5/10 → 9/10**

Active priorities now show the actual director/head_coach name where known.
The Sprint 843 fallback is preserved for any priority without an audit entry.

---

## Remaining Player Priority Gaps

| Gap | Source | Priority |
|---|---|---|
| DONNA attention answers link to player list, not specific flagged player | Sprint 833 | Low |
| `draftSummaryUpdateAction` only uses `is_private = true` observations | Sprint 833 | Low |
| Player DONNA chips are static — not priority-aware | Sprint 833 | Low |
| Tab trigger focus IDs (`player-notes-tab`) | Sprint 841 | Low |

---

## Recommended Sprint 845

**Sprint 845 — Player Priority Loop End-to-End Audit V1**

Full re-audit of the player priority loop (create → approve → apply → display → attribution)
across all five sprints (840–844). Score all 10 dimensions. Confirm all gaps from Sprint 833
are now closed or documented with rationale. Identify any remaining UX or trust gaps.
Produce a score comparison table: Sprint 833 scores vs Sprint 845 scores.

Risk: Audit-only sprint — no code changes unless a critical regression is found.
