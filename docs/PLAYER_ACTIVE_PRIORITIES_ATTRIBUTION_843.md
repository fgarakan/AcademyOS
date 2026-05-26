# Sprint 843 — PlayerActivePriorities Attribution Display V1

**Date:** 2026-05-26
**Sprint:** 843
**Type:** UX — attribution metadata on active priority cards (director-only)
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 833 — Low priority gap

`PlayerActivePriorities` displayed active priorities with title, category, urgency, status,
and a "Set [date]" line. No attribution was shown — the director could not tell:

- Who approved/applied the priority
- That the priority went through the official review queue pipeline

This weakened director trust. A priority appeared with no decision history, making it
look like it could have been generated automatically rather than explicitly approved.

---

## Audit Findings

### `player_priorities` fields in query (page.tsx)

```ts
.select('id, title, description, category, status, priority_level, priority_rank, urgency, generated_at, updated_at')
```

### `approved_by` — NOT available on `player_priorities`

`applyApprovedPriorityRecommendationAction` (review/actions.ts, lines 460–474) inserts
to `player_priorities` with no `approved_by` field. Attribution is stored in:

1. `proposed_actions.approved_by` — director who approved the draft
2. `audit_logs.payload.applied_by` — director who clicked "Apply"

Resolving a display name requires joining `audit_logs` → looking up `profiles.display_name`
by `audit_logs.actor_id`. This is a 2-table join with per-priority queries — complex, would
require changing query shape and adding a name resolution loop similar to gate activity log
or assessment history patterns. Out of scope for V1.

**Safe fallback chosen:** "Approved by director"

This is accurate: the apply action requires `role === 'academy_director' || role === 'head_coach'`.
The displayed text is guaranteed to be factually correct — only a director or head coach can
apply a priority recommendation.

### `created_at` vs `generated_at`

`generated_at` is already in the query and `PlayerPriorityRow` interface. The apply action
does NOT explicitly set `generated_at` in the INSERT — no explicit value in the insert payload.
The DB auto-populates it via a default (`now()` on INSERT). Therefore:

```
generated_at ≈ INSERT timestamp ≈ when priority was applied
```

This makes `generated_at` a valid proxy for "Applied on". No query change needed.
`page.tsx` was not modified.

---

## Solution

One file modified: `src/app/director/players/[playerId]/PlayerActivePriorities.tsx`.

### Before

```tsx
{/* Date */}
<p className="text-[11px] text-text-muted">
  Set {formatDate(p.generated_at)}
  {p.updated_at !== p.generated_at && ` · Updated ${formatDate(p.updated_at)}`}
</p>
```

### After

```tsx
{/* Attribution — Sprint 843 */}
<p className="text-[11px] text-text-muted">
  Approved by director · Applied {formatDate(p.generated_at)}
</p>
{p.updated_at !== p.generated_at && (
  <p className="text-[11px] text-text-muted">Updated {formatDate(p.updated_at)}</p>
)}
```

---

## Attribution Display Matrix

| Condition | Display |
|---|---|
| `generated_at` present (always true — non-null string) | "Approved by director · Applied [date]" |
| `updated_at === generated_at` | "Approved by director · Applied [date]" only |
| `updated_at !== generated_at` | "Approved by director · Applied [date]" + "Updated [date]" |
| No active priorities | Existing `EmptyState` unchanged |

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `page.tsx` query | No query shape change — `generated_at` already selected |
| `PlayerPriorityRow` interface | No new fields required |
| `applyApprovedPriorityRecommendationAction` | Not touched — write path preserved |
| `proposed_actions` | Not touched |
| Schema | No changes |
| RLS | No changes |
| Parent/player visibility | Component is director-only, no change |
| `approved_by` name resolution | Deferred to Sprint 844 if needed — V1 uses "director" fallback |

---

## V2 Path (if attribution name is needed later)

If a named attribution is required in the future:

1. Add `id` to the query (already present)
2. After fetching `activePriorities`, query `audit_logs` for
   `action = 'priority_recommendation.priority.applied'` and `target_id IN [priority IDs]`
3. Collect `actor_id` values, resolve display names from `profiles` table
4. Build a `Map<priorityId, displayName>` and pass it to `PlayerActivePriorities`

This is the same pattern used for gate activity log attribution (already implemented in `page.tsx`).
Pattern reference: `page.tsx` lines 302–325 (gate audit log actor resolution).

---

## Files Created

### `docs/PLAYER_ACTIVE_PRIORITIES_ATTRIBUTION_843.md`

This file.

---

## Files Modified

### `src/app/director/players/[playerId]/PlayerActivePriorities.tsx`

1. Replaced "Set [date]" line with "Approved by director · Applied [date]"
2. Extracted "Updated [date]" into a conditional separate line (previously inline in same string)

---

## Score Impact (estimated)

Dimension 5 — Approve → Apply Path Completeness: **8/10 → 8.5/10**

Active priority cards now show official decision provenance.
The director can see the priority was director-approved and applied.

---

## Remaining Player Priority Gaps

| Gap | Source | Priority |
|---|---|---|
| DONNA attention answers link to player list, not specific flagged player profile | Sprint 833 | Low |
| `draftSummaryUpdateAction` only uses `is_private = true` observations | Sprint 833 | Low |
| Player DONNA chips are static — not priority-aware | Sprint 833 | Low |
| Tab trigger focus IDs (`player-notes-tab`) | Sprint 841 | Low |
| Attribution shows "director" not named approver — named resolution requires audit_logs join | Sprint 843 | Low |

---

## Recommended Sprint 844

**Sprint 844 — Player Priority Attribution Named Approver V1**

Extend `page.tsx` to resolve the director's display name for each active priority from
`audit_logs` (action = `priority_recommendation.priority.applied`) and pass it to
`PlayerActivePriorities`. Display "Approved by [name]" instead of "Approved by director".

Pattern is identical to gate activity log actor resolution (lines 302–325 of `page.tsx`).

Risk: Low — read-only data path. Director-only. Named approver is visible only to other
directors/head coaches.

**Alternatively** — given the low user impact of named attribution on an internal tool,
this gap may be deferred in favor of higher-value work.
