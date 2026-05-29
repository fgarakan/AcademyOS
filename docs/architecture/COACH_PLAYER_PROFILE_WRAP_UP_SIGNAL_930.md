# Coach Player Profile Wrap-Up Signal — Architecture

**Sprint:** 930 | **Date:** 2026-05-29

---

## Summary

Sprint 930 adds a compact "Coach Signals" section to the coach player profile page (`/coach/players/[playerId]`), surfacing two previously invisible signals: pending observation drafts waiting for director review, and the wrap-up status of recent sessions connected to the player's group.

---

## Files changed

| File | Change |
|---|---|
| `src/app/coach/players/[playerId]/page.tsx` | Added two best-effort queries + "Coach Signals" section between CoachPlayerSnapshot and the observations list |

---

## Data sources

### Signal 1 — Pending observation drafts

- Table: `proposed_actions`
- Filter: `target_module = 'coach_observation_draft_v1'`, `target_object_id = player.id`, `status = 'pending_review'`, `academy_id = academyId`
- Returns: count only (no note content, no raw IDs)
- Pattern: `rawDb = supabase as any` — consistent with existing page pattern
- Safety: scoped by `academy_id` + specific player ID. Only count, no content.

### Signal 2 — Group session wrap-up status

- Tables: `sessions` (rawDb, group_id filter) → `loadWrapUpStatusMap` (Sprint 928)
- Filter: `group_id = firstGroupId`, `academy_id = academyId`, last 3 non-cancelled sessions
- Returns: `latestGroupWrapUpStatus`, `sessionsNeedingWrapUp`, `hasCompletedGroupSession`
- Pattern: rawDb for sessions (consistent with page), `loadWrapUpStatusMap` for status
- Safety: academy_id-scoped. `firstGroupId` is already verified against `academy_id` (steps 1 and 5).

---

## Signal display logic

```
hasSignals = pendingDraftCount > 0 || hasCompletedGroupSession

Row 1 (if pendingDraftCount > 0):
  "N observation draft(s) pending director review" — blue dot

Row 2 (if hasCompletedGroupSession):
  "Latest group wrap-up: [human label]" — colored dot (matches status)

Row 3 (if sessionsNeedingWrapUp > 1):
  "N group sessions still need a wrap-up" — orange dot

Empty state (if !hasSignals):
  "No recent signals — add observations after sessions."
```

### Human-friendly labels

| WrapUpDisplayStatus | Label |
|---|---|
| `undefined` / `not_started` | "Wrap-up needed" |
| `pending_review` | "Pending review" |
| `approved` | "Approved" |
| `executed` | "Applied" |
| `rejected` | "Needs revision" |
| `clarification_needed` | "Director has questions" |

Row 3 ("N group sessions still need a wrap-up") only appears when `sessionsNeedingWrapUp > 1` — when it's exactly 1, Row 2 already covers it ("Latest group wrap-up: Wrap-up needed").

---

## What is NOT shown

- Raw observation content or note text (content is shown only in the existing official `coach_observations` list below)
- Raw `proposed_action` IDs
- Raw DB status strings
- Wrap-up drafts from other players
- Any parent- or player-visible data

---

## Page layout after Sprint 930

1. Back link
2. Header (player name, level, stage)
3. `CoachPlayerSnapshot` (unchanged — focus, priorities, recent note)
4. **Sprint 930 — Coach Signals** ← new
5. Recent Observations (unchanged)
6. Level indicator (unchanged)

---

## Safety invariants

| Invariant | Status |
|---|---|
| No parent/player communication sent | ✅ — read-only |
| No player level movement | ✅ |
| No curriculum mutation | ✅ |
| No roster/placement change | ✅ |
| Sprint 904 approve/reject paths unchanged | ✅ — `proposed_actions` not written |
| CoachWrapUpDrawer unchanged | ✅ — not touched |
| `proposed_actions` approval pipeline unchanged | ✅ — read only |
| academy_id scoping | ✅ — both queries scoped to academyId |
| Player ID scoping (obs drafts) | ✅ — `target_object_id = player.id` |
| Raw IDs not shown in UI | ✅ — count only |
| Raw DB status names not in UI | ✅ — mapped via wrapUpSignalLabel() |
| Best-effort loading | ✅ — two separate try/catch blocks |
| Page renders without signals on failure | ✅ — all signal vars default to 0/false |

---

## Known limitations

- Signal 1 (observation drafts) queries ALL pending drafts for the player regardless of which coach submitted them. In practice, observation drafts for a player come from coaches who observed that player in sessions — scoping by `academy_id` is the foundational safety boundary.
- Signal 2 (group sessions) looks at the last 3 sessions for the player's primary group. If the player is in multiple groups, only the first group membership is used (consistent with existing group name lookup on this page).
- The "Coach Signals" card does not link directly to `/wrap-up` or the review queue — the intent is a read-only status overview, not a navigation hub. Coaches can navigate via the sessions list to take action.
