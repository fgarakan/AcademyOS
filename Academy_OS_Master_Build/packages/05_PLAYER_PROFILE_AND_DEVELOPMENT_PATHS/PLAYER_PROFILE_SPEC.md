# PLAYER PROFILE SPEC
**Package:** 05 — Player Profile and Development Paths
**Version:** 1.0 | **Status:** Draft

---

## Overview

The player profile is the single source of truth for a player's identity, placement,
current scores, development priorities, and history within the academy.

It is the screen that coaches, directors, and (in V2) players open most often.

---

## Data Model (from Package 02)

The player profile draws from:
- `players` — identity, status, current placement (group, level, track)
- `player_progression` — current scores + baseline scores + focus areas
- `assessments` — historical scored evaluations
- `group_memberships` — movement history
- `coach_notes` — written observations
- `sessions` via `session_attendance` — session history

Primary view: `v_player_summary`

---

## Profile Sections

### 1. Profile Header

**Fields:**
- Full name
- Date of birth + current age
- Status badge: `active` | `pending_placement` | `reassessment_due` | `on_hold` | `inactive`
- Current group name
- Current level label
- Current track
- Primary coach name
- Days until next assessment (or "OVERDUE" in red)
- Join date

**Actions available from header:**
- Start reassessment (coach/director)
- Move group (director/head_coach only)
- Flag for promotion review (director/head_coach only)
- Edit profile (director only)

---

### 2. Score Overview

Two display modes toggle between each other:

**Radar chart** — shows all five dimensions as overlapping polygons:
- Current scores (solid fill)
- Baseline scores (outline)

**Bar chart** — shows each dimension with:
- Current score (filled bar)
- Baseline score (ghost bar behind)
- Delta value (+X.X in green / −X.X in red)

Dimensions shown:
1. Technical
2. Tactical
3. Movement
4. Competition
5. Behavioral

Overall score displayed below chart with delta from baseline.

---

### 3. Development Priorities

**Current focus areas** (from `player_progression.focus_areas`)
- Displayed as cards, maximum 3 visible
- Each card: focus area label, set-by coach name, set date
- Director/head_coach can update priorities

**Strengths** (from `player_progression.strengths`)
- Bulleted list, short tags

**Weaknesses** (from `player_progression.weaknesses`)
- Bulleted list, short tags

---

### 4. Promotion Readiness

If `player_progression.promotion_ready = true`:
- Banner: "Promotion ready — flagged [date] by [coach]"
- Notes shown
- Director action: "Review for promotion" button

If false: section hidden from coaches; shown to directors as "Not flagged"

---

### 5. Assessment History

Timeline of all assessments, newest first.

Each assessment entry shows:
- Assessment date
- Assessment type (intake / quarterly / reassessment / promotion / ad_hoc)
- Overall score
- Assessed by
- Expand → shows all five dimension scores + subcategory breakdown + strengths/weaknesses/priorities + notes

**New assessment** button → opens structured assessment form (Package 07)

---

### 6. Group History

Table: all group memberships, newest first

| Group | Level | Track | Joined | Left | Reason |
|---|---|---|---|---|---|
| Elite-A | Green Performance | Combined | Jan 2026 | — | (current) |
| Orange Dev | Orange Development | Skill | Sep 2025 | Jan 2026 | Promoted |

---

### 7. Session Attendance Feed

Last 20 sessions the player was enrolled in.

Each row: date, group, session name/notes, attendance status (present/absent/late/excused)

---

### 8. Coach Notes Feed

Most recent 10 coach observations visible to staff.

Each note entry shows:
- Date
- Coach name
- Note content (truncated to 2 lines, expand available)
- Visibility: Internal (staff only) or Parent-visible indicator
- Tags (strengths/weaknesses/priority)

"Add note" button → opens quick-note form (Package 07)

---

## Access Control by Role

| Section | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| Profile Header | Full | Full | Full | Read own | Read own child |
| Score Overview | Full | Full | Full | Read own | Read own child (V2) |
| Development Priorities | Edit | Edit | Read | Read own | No |
| Promotion Readiness | Full | Full | Flag only | No | No |
| Assessment History | Full | Full | Full | Read own | No |
| Group History | Full | Full | Read | Read own | No |
| Session Attendance | Full | Full | Full | Read own | No |
| Coach Notes (internal) | Full | Full | Full | No | No |
| Coach Notes (parent-visible) | Full | Full | Full | No | Read (V2) |

---

## Player List Screen

The profile is reached from the player list screen.

### Filters on player list:

- Group (dropdown)
- Level (dropdown)
- Track (skill / competition / fitness / combined)
- Status (active / reassessment_due / pending_placement / all)
- Search by name

### Columns shown in list:

| Column | Notes |
|---|---|
| Name | Links to profile |
| Group | |
| Level | |
| Track | |
| Overall Score | Current |
| Δ from Baseline | Color coded |
| Next Assessment | "Overdue" badge if past due |
| Status | Badge |

### Sort:

Default: alphabetical by last name
Also sortable: next assessment date, overall score, status

---

## Reassessment Status Indicator

Displayed in list view and profile header.

| State | Display |
|---|---|
| > 30 days away | Grey — "Due Apr 27" |
| 14–30 days away | Amber — "Due soon" |
| < 14 days away | Orange — "Due in X days" |
| Overdue | Red — "OVERDUE (X days)" |
| Not set | Grey — "No date set" |

---

## V1 Scope

- Player list with filters ✅
- Profile header ✅
- Score overview (bars) ✅
- Radar chart ✅
- Development priorities ✅
- Assessment history (read) ✅
- Group history (read) ✅
- Session attendance feed ✅
- Coach notes feed ✅

**V2 additions:**
- Player-facing read-only profile view (mobile)
- Parent-visible tab on profile
- Progress report PDF export
