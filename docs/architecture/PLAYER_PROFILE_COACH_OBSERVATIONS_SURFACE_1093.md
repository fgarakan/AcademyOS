# Player Profile Coach Observations Surface — Sprint 1093

**Sprint:** 1093  
**Date:** 2026-06-01  
**Status:** Complete

---

## Problem

Sprint 1092 persisted approved coach wrap-up observations into `coach_observations` (with `ai_entities.source = 'coach_wrap_up'`). The data reached the database, but the player profile did not surface those observations in a visible, labeled way.

Before Sprint 1093, a director who opened a player profile and went to the Notes tab would find:
- A snapshot with only the latest observation
- A "Notes Workflow" section where observations were embedded as "Step 2 — Structure" — framed as a tool for AI draft generation, not as a standalone readable feed

Wrap-up observations existed in the data but were invisible without hunting.

---

## Solution

Added `CoachWrapUpObservationsPanel` to the Notes tab, placed after `CoachPlayerSnapshot` and before the Development Summary card.

### What it does

- Filters `enrichedObservations` to entries where `ai_entities.source === 'coach_wrap_up'`
- Renders each observation with: content, coach name, session name/date, observation type label, tags, created date
- Labels each observation "Coach Wrap-Up" (green badge)
- Shows a count badge in the header when observations exist
- Renders an explicit empty state when no wrap-up observations exist
- Carries an "Internal" guardrail label in the header
- Is a read-only display component — no mutations, no approval controls

### No new DB queries

`enrichedObservations` is already fetched earlier in `page.tsx` (lines 820–831) with the `profiles` and `sessions` join. `CoachWrapUpObservationsPanel` receives it as a prop and filters client-side.

---

## Data flow

```
coach_observations table
  ↓ (query in page.tsx, academy_id + player_id scoped)
enrichedObservations: CoachObservationRow[]
  ↓ (prop)
CoachWrapUpObservationsPanel
  ↓ (filter: ai_entities.source === 'coach_wrap_up')
Rendered observation cards
```

---

## Notes tab layout (after Sprint 1093)

1. `CoachPlayerSnapshot` — latest observation snippet + development summary
2. **`CoachWrapUpObservationsPanel`** ← NEW — wrap-up sourced observations, labeled and prominent
3. Development Summary card
4. `NotesAIDraftSection` — full observation feed + AI draft workflow (unchanged)
5. `EditDevelopmentSummaryForm`
6. Curriculum source indicator
7. `PlayerActivePriorities`
8. `CoachObservationEvidenceSummary` — aggregate evidence summary
9. Evidence Hub section
10. Parent & player view preview

---

## Visibility guardrails

| Portal | Sees CoachWrapUpObservationsPanel | Reason |
|---|---|---|
| Director | Yes | RLS: auth_is_director_or_head(); component is in director-only route |
| Coach | No | `/director/players/[playerId]` is director-only |
| Player | No | `/player` route does not query or render coach_observations |
| Parent | No | `/parent` route does not query or render coach_observations |

`is_private = true` is shown on each observation card if set — it marks observations as internal within the director's own view. This does not change any portal visibility; all observations on the director profile are already director-internal.

---

## What is intentionally not built in this sprint

- No parent update CTA (Sprint 1095)
- No observation approval/reject controls (approval happens in director review queue)
- No changes to persistence logic (Sprint 1092 complete)
- No schema changes or migrations
- No player level mutations
- No parent/player communication
