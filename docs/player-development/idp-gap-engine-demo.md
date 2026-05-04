# IDP + Gap Engine Demo Script

**Sprint:** 238
**Last updated:** 2026-05-04
**Status:** V1 — covers director player profile and coach session workspace

---

## Purpose

This document walks through the IDP (Individual Development Plan) and gap engine features
for demo and QA purposes. It covers:

1. What has been built and where it lives
2. Pre-conditions — what data must exist for each scenario
3. Director demo flow — player profile Skill Path tab
4. Coach demo flow — session workspace pre-brief
5. Gap types and what triggers each one
6. Safety rules — what must never appear in player or parent views

---

## Architecture summary

```
Sprints 232–234 built three pure helpers (no DB, no AI, deterministic):

  detectTrainingGaps(input)    → IdpTrainingGap[]
  detectKnowledgeGaps(input)   → IdpKnowledgeGap[]
  buildDirectorGapGuidance()   → RoleSpecificGapGuidance  (director)
  buildCoachGapGuidance()      → RoleSpecificGapGuidance  (coach)

Sprint 238 wired these into:
  /director/players/[playerId] → Skill Path tab → GapGuidanceSummaryCard (director role)
  /coach/sessions/[sessionId]  → CoachSessionGapBriefPanel (coach role, per-player rows)
```

All gap guidance is **read-only** and **director/coach only**.
Players and parents never see gap guidance — not even indirectly.

---

## Pre-conditions for a full demo

### Scenario A — Rich gap output (multiple items)

The player needs:
1. A `player_load_aggregation` row with load data:
   - `overload_flag = true` → triggers `overload_risk` (act_now)
   - OR `sessions_7d = 0` → triggers `low_session_frequency` (act_now)
   - OR `absences_7d >= 3` → triggers `high_absence_rate` (act_now)
2. A curriculum level assigned via `player_curriculum_states`
3. Open gates in `curriculum_gates` for that level

### Scenario B — Knowledge gap only (no load data)

The player needs:
1. No `player_load_aggregation` row (or null values) → shows no training guidance (insufficient_data)
2. No curriculum level assigned → triggers `no_curriculum_level` (act_now)

### Scenario C — Clean player (empty state)

The player needs:
1. A `player_load_aggregation` row with `sessions_7d >= 2`, `overload_flag = false`, `absences_7d < 2`
2. A curriculum level with coach language, drills, and <8 open gates assigned
3. Result: `GapGuidanceSummaryCard` shows empty state — "No gap guidance at this time"

---

## Director demo flow

### 1. Navigate to a player profile

URL: `/director/players/[playerId]`

The player profile loads with 5 tabs: Overview · Skill Path · Competition · Fitness · Notes

### 2. Click the Skill Path tab

The Skill Path tab renders in order:
1. Curriculum Level Picker — shows current level, allows assignment
2. Curriculum Assignment Card — shows version source and overrides
3. **Gap Guidance card** ← new in Sprint 238
4. Advancement action card
5. Curriculum Progress Grid
6. Level Requirements (gates with evidence buttons)
7. Advancement score thresholds
8. Requirement progress
9. Evidence linking
10. Player Q&A Preview

### 3. Observe the Gap Guidance card

The card header shows: `Gap Guidance` / `Director internal — not visible to player or parent`

If gaps are detected:
- A lime-bordered box shows the **top action** (first `act_now`, or first `monitor`)
- Below it: all guidance items grouped by priority:
  - `act_now` items: red AlertTriangle icon
  - `monitor` items: orange Eye icon
  - `informational` items: blue Info icon
- Each item shows: action text, rationale, source badge (Training/Knowledge), domain badge

If no gaps detected:
- Empty state: "No gap guidance at this time"

### 4. Demo talking points

- "This is director-internal. The player never sees this."
- "Training gaps come from load data — sessions this week, attendance, overload flags."
- "Knowledge gaps come from curriculum setup — do they have a level? Gates? Coach language? Drills?"
- "Top action tells the director the single most important thing to act on."
- "All gap guidance is deterministic — the same player data always produces the same output."
- "No AI. No guessing. Just rules applied to real data."

---

## Coach demo flow

### 1. Navigate to an active session

URL: `/coach/sessions/[sessionId]`

The session must have a `group_id` with at least one current group membership.

### 2. Scroll past the execution section

The session page renders:
1. Session header
2. Snapshot notice
3. Execution client (blocks, exercises, roster/attendance)
4. **Session Pre-brief card** ← new in Sprint 237
5. Coach Recap Command Panel

### 3. Observe the Session Pre-brief card

The card header shows: `Session Pre-brief` / `Coach internal — not visible to players`

If gaps are detected for any roster player:
- One row per player with detected gaps
- Each row: player name + level label + top_action text + priority badge (Act now / Monitor)
- "+N more" if multiple items

If no gaps:
- Empty state: "No gap guidance for this session"

### 4. Demo talking points

- "Before the coach starts the session, they can see what each player needs today."
- "If a player is overloaded, the coach knows to reduce intensity before starting."
- "If a player has missed sessions, the coach knows to note the gap in their recap."
- "This is session-level — only players in this session's group appear."
- "Coach guidance is different from director guidance — same gaps, different language."

---

## Gap type reference

### Training gaps (from `player_load_aggregation`)

| gap_type | Trigger | Director action | Coach action |
|---|---|---|---|
| `overload_risk` (high) | `overload_flag = true` or fatigue score critical | Reduce intensity; schedule recovery | Reduce intensity today |
| `overload_risk` (medium) | Fatigue score elevated | Monitor load next 2–3 sessions | Choose recovery-friendly drills |
| `low_session_frequency` (high) | `sessions_7d = 0` | Review attendance; contact family | Note gap; confirm next session |
| `low_session_frequency` (medium) | `sessions_7d = 1` | Review schedule | Reinforce attendance |
| `high_absence_rate` (high) | `absences_7d >= 3` | Contact family; review pattern | Flag to director |
| `high_absence_rate` (medium) | `absences_7d = 2` | Monitor | Note in recap |
| `domain_imbalance` (Fitness) | `fitness_sessions_28d = 0` | Add fitness session | Include conditioning block |
| `domain_imbalance` (Competition) | `competition_sessions_28d = 0` | Schedule match-play | Add competitive element |
| `undertraining` | `duration_28d_min < 240` | Review scheduling | Prioritize highest-impact gates |
| `gate_evidence_exposure` | Many open gates + low sessions | Increase session frequency | Target open gates in drills |
| `load_declining` | `load_trend_7d = 'decreasing'` | Confirm if planned | Check player energy |
| `insufficient_data` | No `player_load_aggregation` row | *(no guidance shown)* | *(no guidance shown)* |

### Knowledge gaps (from curriculum configuration)

| gap_type | Trigger | Director action | Coach action |
|---|---|---|---|
| `no_curriculum_level` | No `player_curriculum_states` row | Assign a level immediately (act_now) | Ask director to assign (act_now) |
| `insufficient_data` | Level assigned but no gates/drills/language | Complete curriculum configuration | Check with director |
| `no_coach_language` | Level has no `curriculum_coach_language` rows | Add coaching cues | Use general principles |
| `no_drills_available` | Level has no `curriculum_drills` rows | Add drills in curriculum builder | Source or adapt drills |
| `domain_gap_cluster` | >70% of open gates in one domain | Review gate distribution | Introduce varied domain work |
| `many_open_gates` | >7 open gates | Prioritize top 2–3 with coach | Focus on 2–3 gates per session |
| `no_module_domain_match` | No learning module domain matches open gates | Add aligned learning module | Suggest to director |

---

## Priority tiers

| Priority | Color | When |
|---|---|---|
| `act_now` | Red (AlertTriangle) | Immediate attention — development or safety risk |
| `monitor` | Orange (Eye) | Watch closely — not yet critical |
| `informational` | Blue (Info) | Useful context — act when convenient |

`top_action` = first `act_now` item, or first `monitor` if no `act_now` exists.

---

## Safety rules — enforced in code

1. `GapGuidanceSummaryCard` is rendered only in director-authenticated routes.
2. `CoachSessionGapBriefPanel` is rendered only in coach-authenticated routes.
3. Neither component appears in `/player/*` or `/parent/*` routes.
4. Gap guidance never triggers automatic actions — director or coach must act manually.
5. No player or parent-facing language appears in gap guidance text.
6. `insufficient_data` training gaps produce no guidance items — null is valid output.
7. `top_action` is informational only — no automatic execution path exists.

---

## File locations

| What | Where |
|---|---|
| Training gap detection | `src/lib/gaps/trainingGapDetection.ts` |
| Knowledge gap detection | `src/lib/gaps/knowledgeGapDetection.ts` |
| Role-specific gap guidance | `src/lib/gaps/roleSpecificGapGuidance.ts` |
| Director gap card | `src/components/player/GapGuidanceSummaryCard.tsx` |
| Director player profile | `src/app/director/players/[playerId]/page.tsx` |
| Coach session gap panel | `src/app/coach/sessions/[sessionId]/CoachSessionGapBriefPanel.tsx` |
| Coach session page | `src/app/coach/sessions/[sessionId]/page.tsx` |

---

## Known limitations (V1)

- `available_drill_count` in the director profile uses `qaTopDrills.length` (capped at 5) — sufficient for 0 vs >0 detection
- No loading skeleton on `CoachSessionGapBriefPanel` — panel blocks page render while fetching; acceptable for V1
- Gap guidance does not update in real time — requires page reload after a load aggregation update
- `generate_parent_update`, `create_player`, `create_exercise` gap actions have no execution path yet (see Sprint 236 coverage plan)
