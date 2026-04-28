# Current Build Target

**Last updated:** 2026-04-28
**Current phase:** Phase 1 — Director-facing player operating spine

---

## Active target

**Director-facing player operating spine.**

The goal is to give the director a complete, working view of every player in the academy —
from the list, through the profile, to curriculum tracking and advancement evaluation.
Everything the director needs to operate the academy day-to-day.

---

## Build order

### Step 1 — Players List `/director/players` ← NEXT
Build the player list page so the director can navigate to player profiles.

What to build:
- Fetch from `v_player_summary` via `getPlayerSummaries()`
- Display player name, level badge, track, group name, status badge, reassessment indicator
- Search by name (client-side filter)
- Filter by status (active / pending / on-hold)
- Click row → navigate to `/director/players/[playerId]`
- Empty state for no players
- Loading skeleton

Files to create:
- `src/app/director/players/page.tsx` (replace stub)
- New components only if no suitable UI component already exists

Do not create new backend files — `getPlayerSummaries()` in `src/lib/backend/players.ts` is ready.

---

### Step 2 — Player Profile responsive layout
Fix the 3-column fixed-width layout at `/director/players/[playerId]/page.tsx`.

Current problem: `grid-cols-[260px_1fr_260px]` breaks below ~900px.

Fix:
- Collapse to single column on mobile
- Back link should point to `/director/players`, not `/director`

---

### Step 3 — Player Profile tab structure
Add tab navigation to the Player Profile page.

Tabs (in order per spec):
1. Overview (summary of all tabs — build last within this step)
2. Curriculum (already partially built — move into tab)
3. Skill Path (assessments, radar chart)
4. Competition (UTR history, match results)
5. Signals + Priorities
6. Recommendations
7. Outcomes (timeline)
8. Load + Fitness
9. Notes + Comms

Use `<Tabs>` from `src/components/ui`.

---

### Step 4 — Missing Player Profile tab content
Build each tab section one at a time.

Data is available in:
- `src/lib/backend/players.ts` — signals, priorities, recommendations, progress snapshots
- `src/lib/backend/assessments.ts` — assessment history
- `src/lib/backend/utr.ts` — UTR history, insights
- `src/lib/backend/intelligence.ts` — behavior profiles, predictions, coaching messages

---

### Step 5 — Director Dashboard `/director`
Build the command center. Assemble from components that exist after steps 1–4.

Cards to build (per BUILD_ORDER.md Phase 4 spec):
- Academy Vital Signs (4 metric cards)
- Priority Queue
- Alerts
- Curriculum Coverage chart
- Coach Activity
- Recommendation Queue
- Cohort Insights

Data: `src/lib/backend/dashboard.ts` is ready.

---

### Step 6 — Placement Engine
New student onboarding flow.

Flow: New Player form → 5-dimension Assessment → AI Recommendation review → Approve/Override/Reject → Activate

Backend: `src/lib/backend/assessments.ts` has `createAssessment()` and `finalizePlacement()`.

---

### Step 7 — Templates and Sessions
Session template library and session builder.

Backend: `src/lib/backend/sessions.ts` is ready.

---

### Step 8 — Coach Workspace
Coach home, live session runner, outcome recording.

Route: `/coach` (currently stub)

---

### Step 9 — Voice Command Center
Build only after `execute_approved_action()` RPC covers all 14 action types.

See `docs/KNOWN_LIMITATIONS.md` for details.

---

## What is NOT the current target

- Coach workspace
- Player portal
- Parent portal
- Voice Command UI
- Reports
- Competition calendar
- Configuration screens

Do not build these until the director player spine is complete.

---

## How to confirm the current target before starting

Read this file. The active step is Step 1 unless this file has been updated to say otherwise.
