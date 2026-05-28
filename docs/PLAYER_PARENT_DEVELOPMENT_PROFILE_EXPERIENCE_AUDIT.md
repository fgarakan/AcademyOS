# Player + Parent Development Profile Experience Audit

**Sprint:** 166  
**Date:** 2026-05-02  
**Status:** Audit complete — implementation plan below for Sprints 167–175

---

## Current Player Profile Structure

### Route: `/director/players/[playerId]`

**Tabs (implemented):**
1. **Overview** — Player Info card, Coach Focus summary (curriculum domain counts, advancement eligibility)
2. **Skill Path** — Curriculum assignment, advancement evaluation, curriculum progress grid
3. **Competition** — Empty state (coming soon)
4. **Fitness / Load** — Empty state + at-home homework draft button
5. **Notes** — Development summary, AI draft panel, edit form, progression requirements, requirement progress, coach observations feed, add observation/voice note forms

**Key finding:** Development story (Doing Well / Working On / Current Focus) is buried in the Notes tab. The Overview tab shows curriculum counts but not the human development narrative. Directors and coaches have to navigate away from the first screen to understand what a player is working on.

---

## Available Data Sources

| Data Source | Table / View | Key Fields | Status |
|---|---|---|---|
| Development Summary | `player_development_summary` | `current_strengths[]`, `things_to_work_on[]`, `development_focus`, `coach_summary`, `student_friendly_summary`, `parent_summary`, `show_to_student`, `show_to_parent` | Exists, used in Notes tab |
| Player Priorities | `player_priorities` | `title`, `description`, `category`, `priority_level`, `priority_rank` | Exists, used in Notes tab |
| Coach Observations | `coach_observations` | `content`, `observation_type`, `is_private`, `created_at`, `coach_id` | Exists, used in Notes tab |
| Curriculum Summary | `v_player_curriculum_summary` | `current_level_name`, `stage`, `advancement_eligible`, `advancement_blocked_by` | Exists, used in all tabs |
| Progression Requirements | `v_curriculum_level_requirements` | `min_assessment_score`, `requires_director_approval`, `blocking_signal_types` | Exists, used in Notes tab |
| Player Summary | `v_player_summary` | `focus_areas`, `overall_score`, `score_delta`, `level_label` | Exists, used in drilldowns |

---

## Current Parent/Player Visibility

**Parent portal (`/parent`):**
- Shows generic empty state cards
- No player-specific data connected
- `parent_summary` field exists in DB but not surfaced
- `show_to_parent` flag exists but not respected in UI
- Private lesson request preview (disabled)

**Player portal (`/player`):**
- Shows generic empty state cards (Today's Mission, My Skills, Wins & Streaks)
- No player-specific data connected
- `student_friendly_summary` field exists in DB but not surfaced
- `show_to_student` flag exists but not respected in UI

---

## Where Development Language Comes From

### "Doing Well"
- Source: `player_development_summary.current_strengths` (array)
- Fallback: most recent `coach_observations` with `observation_type = 'positive_highlight'`
- Display: up to 3 bullet items

### "Working On"
- Source: `player_development_summary.things_to_work_on` (array)
- Fallback: top `player_priorities.title` items
- Display: up to 3 bullet items

### "Current Focus"
- Source: `player_development_summary.development_focus` (string)
- Fallback: `v_player_summary.focus_areas[0]`
- Display: single paragraph

### "Next Step"
- Source: `player_priorities` sorted by `priority_rank`, first active item
- Fallback: `player_development_summary.development_focus`
- Display: single line / short paragraph

### "Progress Evidence"
- Source: `coach_observations` (most recent 10, visibility-filtered)
- Each item has: type, date, coach name, session context, is_private flag
- Display: timeline of items with visibility pills (Internal / Parent-safe / Approved)

### "Level Progress"
- Source: `v_player_curriculum_summary` (current level, stage, advancement eligibility)
- Source: `v_curriculum_level_requirements` (what is needed to advance)
- Source: `curriculum_levels` (next level name)
- Display: current level → next level, requirements list, "Requires director approval" label

---

## Current Label Issues in DevelopmentSummarySection

| Current Label | Should Be | Status |
|---|---|---|
| Current Strengths | Doing Well | NEEDS UPDATE |
| Things to Work On | Working On | UPDATE recommended |
| Development Focus | Current Focus | UPDATE recommended |
| Coach Summary | Coach Insight (Internal) | Minor update |
| Student-Facing Preview | Player Preview | Minor update |

---

## Parent-Safe Preview Plan

**Guardrails:**
- `parent_summary` field from `player_development_summary` is the parent-safe text
- `show_to_parent = false` means show preview label only, not a live update
- Never show raw `coach_observations.content` to parents
- Never show `is_private = true` notes to parents

**Display plan:**
- "Doing Well": derived from `parent_summary` or sanitized `current_strengths` if `show_to_parent` is true
- "Working On": derived from `parent_summary` or sanitized `things_to_work_on`
- Preview label: "Parent-safe preview — not yet sent to parent"
- Empty state: "Progress summaries will appear here after coach/director review."

---

## Player Mission Preview Plan

**Guardrails:**
- `student_friendly_summary` field is the player-safe text
- `show_to_student = false` means preview only
- Never show raw coach observations or internal notes to players

**Display plan:**
- "Your Strength": derived from `student_friendly_summary` or first `current_strengths` item
- "Your Mission": derived from `development_focus` if safe, or empty
- "Next Win": derived from top priority title if appropriate
- Empty state: "Your next mission will appear after your coach reviews your progress."

---

## Coach Snapshot Plan

**Purpose:** Coaches see this before a session to instantly understand: "What should I focus on with this player today?"

**Content:**
- Current Focus (development_focus)
- Doing Well (top 1-2 strengths)
- Working On (top 1-2 items)
- Next Priority (from player_priorities rank 1)
- Most Recent Note (latest coach_observation content preview)

---

## Schema Gaps

| Gap | Impact | Resolution |
|---|---|---|
| No `next_step` field on development_summary | Use player_priorities rank 1 as next step | No migration needed |
| `parent_summary` rarely filled | Parent preview shows empty state | No migration, just empty state handling |
| `student_friendly_summary` rarely filled | Player preview shows empty state | No migration |
| Parent portal has no player context | Can't show personalized data | Accept: show structure + preview label only |
| Player portal has no player context | Can't show personalized data | Accept: show structure + preview label only |

---

## Guardrails

- `show_to_parent` must be `true` before showing real content to parent portal (not yet built)
- `show_to_student` must be `true` before showing real content to player portal (not yet built)
- `is_private = true` observations never exposed to parent/player
- Raw `coach_summary` never exposed to parent/player
- Raw `coach_observations.content` never exposed to parent/player
- No automatic level movement
- No automatic communication
- No AI calls in this sprint

---

## Implementation Plan for Sprints 167–175

| Sprint | Component / File | Description |
|---|---|---|
| 167 | `DevelopmentProfileSummaryCard` + player profile Overview | Add development story card to Overview tab |
| 168 | `DevelopmentFocusSections` + `DevelopmentSummarySection` label update | Four-section Doing Well/Working On/Focus/Next Step |
| 169 | `ProgressEvidenceTimeline` + player profile Notes | Timeline of evidence with visibility pills |
| 170 | `CoachPlayerSnapshot` + player profile Overview/coach views | Coach "what to focus on" card |
| 171 | `ParentSafeProgressPreview` + parent portal | Parent-safe preview with guardrails |
| 172 | `PlayerMissionPreview` + player portal | Player mission view with empty/preview state |
| 173 | `LevelProgressCard` + player profile Overview | Level progress with requirements |
| 174 | Dashboard drilldowns (active, improvement) | Consistent dev language in player rows |
| 175 | QA doc + demo script + CHANGELOG | Completion validation |
