# SCREEN SPECS
**Package:** 08 — UI/UX Wireframes and Screen Specs
**Version:** 1.0 | **Status:** Draft

---

## Screen Inventory

| # | Screen | Role | Priority |
|---|---|---|---|
| 1 | Login | All | V1 |
| 2 | Director Dashboard | Director, Head Coach | V1 |
| 3 | Player List | Staff | V1 |
| 4 | Player Profile | Staff | V1 |
| 5 | New Player Form | Staff | V1 |
| 6 | Placement Assessment | Staff | V1 |
| 7 | Placement Recommendation Review | Director, Head Coach | V1 |
| 8 | Group Overview | Staff | V1 |
| 9 | Session List / Calendar | Staff | V1 |
| 10 | Session Detail | Staff | V1 |
| 11 | Session Editor | Staff | V1 |
| 12 | Template List | Staff | V1 |
| 13 | Template Builder | Staff | V1 |
| 14 | Exercise Library | Staff | V1 |
| 15 | Coach Note Form | Staff | V1 |
| 16 | Voice Command ("Tell the OS") | Director, Head Coach, Coach | V1 |
| 17 | Proposed Action Review | Director, Head Coach | V1 |
| 18 | Settings | Director | V1 |

---

## Screen 1: Login

**Path:** `/login`
**Layout:** Centered card on dark background.

**Elements:**
- Academy OS logo / wordmark
- Email input
- Password input
- "Sign in" button (primary)
- "Forgot password" link
- Error state: "Invalid email or password"

**Notes:**
- Supabase Auth email+password in V1
- Magic link in V2
- Redirect to Director Dashboard after auth

---

## Screen 2: Director Dashboard

**Path:** `/dashboard`
**Layout:** Desktop split pane. Left nav + main area.

**Main area sections:**

### Pending Actions panel (top priority)
- Counts badge in nav: "3 pending"
- List of proposed actions awaiting approval
- Each card: action label, risk badge, time elapsed, [Review] button
- Empty state: "No pending actions"

### Reassessment Pipeline
- Players overdue or due within 14 days
- Mini table: player name, group, days overdue/until due, [Start Assessment] button
- Max 5 shown; [View all] link

### Recent Activity Feed
- Last 10 audit log entries
- Each row: action type, target, actor, timestamp
- Color coded by source type (ui / voice / system)

### Load Management Alert
- Any sessions this week flagged as overload
- Each: session name, date, group, [Review Session] link

---

## Screen 3: Player List

**Path:** `/players`
**Layout:** Full width. Filter bar + table.

**Filter bar:**
- Group dropdown
- Level dropdown
- Track filter (pill buttons: All / Skill / Competition / Fitness / Combined)
- Status filter (All / Active / Reassessment Due / Pending Placement)
- Search input

**Table columns:** Name | Group | Level | Track | Overall Score | Δ Baseline | Next Assessment | Status

**Row click:** → Player Profile

**"Add Player" button:** → New Player Form

---

## Screen 4: Player Profile

**Path:** `/players/[id]`
**Layout:** Desktop split pane. Profile header spans full width. Two-column content below.

**Profile header:**
- Name, age, status badge
- Group | Level | Track
- Primary coach
- Assessment status (days until / overdue)
- Action buttons (role-gated): Start Reassessment | Move Group | Flag for Promotion | Edit Profile

**Left column:**
- Score Overview (radar chart + bar chart toggle)
- Development Priorities (top 3 focus areas)
- Promotion Readiness (if flagged)

**Right column:**
- Assessment History (timeline, newest first)
- Group History (table)
- Session Attendance (last 20)
- Coach Notes Feed (last 10)

**Mobile:** Each section becomes a full-width stacked card. No split.

---

## Screen 5: New Player Form

**Path:** `/players/new`
**Layout:** Single centered form.

**Fields:**
- First name (required)
- Last name (required)
- Date of birth (required)
- Gender (optional)
- Handedness (required — radio: Right / Left / Ambidextrous)
- Nationality (optional)
- Guardian: first name, last name, email, phone, relationship
- Intake notes (textarea)

**On save:**
- Player created with `status = 'pending_placement'`
- → Redirect to Placement Assessment (Screen 6)

---

## Screen 6: Placement Assessment

**Path:** `/players/[id]/placement/assess`
**Layout:** Step-by-step form. Progress indicator at top.

**Steps:**
1. Technical (6 sliders)
2. Tactical (4 sliders)
3. Movement (4 sliders)
4. Competition (4 sliders)
5. Behavioral (4 sliders)
6. Narrative (strengths, weaknesses, priorities text fields + promotion toggle)

Each slider:
- Label and description
- 0.0–10.0 in 0.5 increments
- Current value displayed as number

**Navigation:** Back / Next / Save Draft / Submit

**On Submit:**
- Assessment saved
- Claude API called for recommendation
- → Redirect to Placement Recommendation Review (Screen 7)

---

## Screen 7: Placement Recommendation Review

**Path:** `/players/[id]/placement/review`
**Layout:** Centered review card.

**Card shows:**
- Player name + assessment summary
- AI recommendation:
  - Recommended track (badge)
  - Recommended level (label)
  - Recommended group (name + current capacity)
  - Confidence score (bar + percentage)
  - Rationale (paragraph)
  - Strengths (bulleted)
  - Weaknesses (bulleted)
  - Top 3 priorities (numbered)
  - Recommended reassessment interval

**Override section (collapsed by default):**
- Override track (dropdown)
- Override level (dropdown)
- Override group (dropdown)
- Override reason (textarea — required if any field changed)

**Action buttons:**
- [Approve and Activate] — calls `finalize_player_placement()`, activates player
- [Override and Activate] — saves override fields, then activates
- [Save for Later] — saves recommendation with status `generated`, does not activate

**Post-activation:** Success banner + link to Player Profile.

---

## Screen 8: Group Overview

**Path:** `/groups`
**Layout:** Card grid (desktop). Stacked list (mobile).

**Group card shows:**
- Group name
- Level label
- Track badge
- Active players / max players
- Capacity progress bar
- Reassessment due count (amber if > 0)
- Lead coaches
- [View Group] button

**Group detail (click):**
- Player list filtered to this group
- Group stats (average scores, overdue count)
- Assigned sessions this week

---

## Screen 9: Session List / Calendar

**Path:** `/sessions`
**Layout:** Toggle between list view and weekly calendar view.

**List view:** Table — Date | Group | Coach | Status | Duration | Load flags

**Calendar view:** Week view grid. Sessions as blocks in day columns. Color by group.

**"Create Session" button:** → Session creation flow (choose from template or from scratch)

**Click session:** → Session Detail (Screen 10)

---

## Screen 10: Session Detail

**Path:** `/sessions/[id]`
**Layout:** Header + blocks list + attendance.

**Header:** Session name, date, time, group, coach, status badge, duration

**Block list:** Ordered session blocks. Each block: type icon, name, duration, intensity bar, exercises list (expand).

**Load summary:** Three intensity bars (skill / competition / fitness). Overload warning if applicable.

**Attendance section:** Player checklist with present/absent/late/excused toggles.

**Actions:** [Edit Session] | [Mark Complete] | [Cancel Session]

---

## Screen 11: Session Editor

**Path:** `/sessions/[id]/edit`
**Layout:** Full-width drag-sortable block editor.

**Block list:** Draggable rows. Each block inline-editable: duration, intensity, notes.

**Add block button:** Block type picker → name + duration + intensity → insert.

**Exercise list per block:** Expandable. Drag-sortable within block. Add from exercise library.

**Load summary:** Live-updating as blocks change.

**Save:** [Save Changes] — returns to Session Detail. Template never modified.

---

## Screen 12: Template List

**Path:** `/templates`
**Layout:** Card grid or table.

**Each template:** Name | Group target | Track | Total duration | # blocks | [Edit] [Use]

**"Create Template" button:** → Template Builder

---

## Screen 13: Template Builder

**Path:** `/templates/new` or `/templates/[id]/edit`
**Layout:** Sidebar (template metadata) + main (block editor).

Same block editor UI as Session Editor, but changes here affect all future sessions created from this template.

**Metadata sidebar:** Name, description, group target, track, level, tags, is_default toggle.

---

## Screen 14: Exercise Library

**Path:** `/exercises`
**Layout:** Filter sidebar + card grid.

**Filters:** Category, track, level range, tag

**Exercise card:** Name, category badge, duration, track badge

**Exercise detail (click/modal):** Full description, instructions, coaching points, tags

**"Add Exercise" button:** → Exercise creation form

---

## Screen 15: Coach Note Form

**Appears as:** Slide-in panel (desktop) / full screen (mobile)

**Fields:**
- Note text (textarea — required)
- Player (pre-filled if from player profile)
- Linked session (optional)
- Visibility (Internal / Parent-visible toggle)
- Category (select)
- Sentiment (select)
- Tags (multi-select)

**Save:** Panel closes. Note appears at top of observations feed.

---

## Screen 16: Voice Command ("Tell the OS")

**Entry point:** Top nav button, visible to director / head_coach / coach.

**Layout:** Modal overlay or dedicated slide-in panel.

**V1 — Text input:**
```
┌──────────────────��───────────────────────┐
│  TELL THE OS                             │
│  ──────────────────────────────────────  │
│  [                                    ]  │
│  e.g., "Build next week's orange-ball    │
│         technical block."                │
│                                          │
│  Context: Orange Dev  |  Week of May 4   │
│                                          │
│  [SEND]                                  │
└──────────────────────────────────────────┘
```

**Processing state:** Animated indicator "Parsing command…"

**On success:** → Proposed Action Review (Screen 17)

**On clarification needed:** Follow-up questions shown in the same panel.

**V2:** Microphone button + audio waveform display.

---

## Screen 17: Proposed Action Review

**Appears as:** Slide-in panel (desktop) / full screen (mobile)
**Also accessible from:** Dashboard pending actions list

```
┌──────────────────────────────────────────┐
│  PROPOSED ACTION                         │
│  ──────────────────────────────────────  │
│  Action:  Create session                 │
│           Orange Development             │
│           Monday May 4, 2026 · 90 min    │
│                                          │
│  Template: Green Technical Block         │
│  Coach:    Marco Santos                  │
│  Intensity: Fitness ↓ (2/5)              │
│                                          │
│  Affects:   8 players                    │
│  Risk:      ⬤ LOW                        │
│                                          │
│  Original command:                       │
│  "Make Thursday lighter for oranges"     │
│                                          │
│  Expires in: 23h 42m                     │
│                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ APPROVE  │ │   EDIT   │ │  REJECT  │ │
│  └──────────┘ └──────────┘ └──────────┘ │
└──────────────────────────────────────────┘
```

**Edit mode:** Payload fields become editable inputs. Override reason required.

**Reject:** Reason field appears (required). [Confirm Reject] button.

---

## Screen 18: Settings

**Path:** `/settings`
**Access:** Director only.

**Sections:**
- Academy profile (name, timezone, logo)
- Levels (configure level labels and numbers)
- Groups (create, edit, archive)
- Roles and access (manage staff accounts)
- Assessment settings (scoring scale, reassessment interval defaults)
- Notification preferences

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 768px | Stacked, bottom nav, full-screen flows |
| Tablet | 768–1024px | Reduced split panes, collapsible nav |
| Desktop | > 1024px | Full split-pane layouts |
