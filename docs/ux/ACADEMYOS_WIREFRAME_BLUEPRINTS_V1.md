# AcademyOS Wireframe Blueprints V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2101–2150
**Purpose:** Wireframe-level specifications for the 6 core AcademyOS director screens. These are ideal layouts — not current state.
**Format:** ASCII wireframes + layout specification. No implementation. No code.
**Constraint:** All existing intelligence and architecture is preserved. Layout only.

---

## Reading the Wireframes

```
┌─────────────────┐   = card / container
│ TEXT            │   = text content
├─────────────────┤   = section divider
[Button]           = action button (lime = primary)
(label)            = metadata / secondary text
───────────────   = horizontal rule / separator
···              = content continues (truncated)
```

---

## Screen 1 — Director Today (Homepage Reimagined)

**Purpose:** Daily command screen. DONNA leads. Approvals are immediate. Sessions are visible.
**Target:** Director opens this and knows what to do in 10 seconds.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ☰  AcademyOS          Dabul Tennis Academy          ● DONNA    [Brian] │
│    Today · Players · Curriculum · Sessions · Academy Health   [⚙ gear] │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ DONNA                                                  Thursday, Jun 5  │
│                                                                         │
│ Good morning, Brian. Here's what needs you today:                      │
│                                                                         │
│ ① Lucas Santos's parent update is ready to review           [Review →] │
│ ② Orange Ball 2 session on Tue had no coach recap          [Follow up]  │
│ ③ 2 players are ready for level advancement                  [Advance]  │
│                                                                         │
│ "Ask me anything about your academy..."          [🎤]  [→ send]         │
└─────────────────────────────────────────────────────────────────────────┘

─── APPROVALS  ·  5 pending ─────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────────────┐
│ Coach Wrap-Up  ·  Marco Rossi  ·  12 Jun ·  Orange Ball 2             │
│ "Strong forehand session. Lucas still hesitant on slice backhand."     │
│                                               [Approve] [Reject] [···] │
├─────────────────────────────────────────────────────────────────────────┤
│ Placement  ·  Lucas Santos  ·  11 Jun                                   │
│ Recommended: Orange Ball 2                                              │
│                                               [Review]            [···] │
├─────────────────────────────────────────────────────────────────────────┤
│ + 3 more items                                          [View all →]   │
└─────────────────────────────────────────────────────────────────────────┘

─── THIS WEEK  ·  4 sessions ────────────────────────────────────────────

┌──────────────────────────────────────────┐  ┌──────────────────────────┐
│ Mon  ·  Orange Ball 2                    │  │ Wed  ·  Red Ball 1       │
│ Coach Marco  ·  9:00am  ·  Planned       │  │ Coach Ana  ·  In Progress│
└──────────────────────────────────────────┘  └──────────────────────────┘
┌──────────────────────────────────────────┐  ┌──────────────────────────┐
│ Thu  ·  Green Ball 1                     │  │ Fri  ·  Orange Ball 1   │
│ Coach Marco  ·  4:00pm  ·  Planned       │  │ Coach Ana  ·  Planned   │
└──────────────────────────────────────────┘  └──────────────────────────┘

                                          [+ New session]  [View calendar]
```

**Layout spec:**
- Total sections: 3 (DONNA brief, Approvals, This Week)
- Primary action: highest-priority approval (approve/reject visible immediately)
- Scroll behavior: DONNA brief is sticky or top-pinned. Approvals expand to show all 5. Sessions are 2×2 grid.
- DONNA brief: collapsed to 3 action items by default. [Show more] expands.
- No sidebar items removed — sidebar unchanged structurally but reduced to 5+gear.

---

## Screen 2 — Curriculum Command Center

**Purpose:** Curriculum health at a glance. DONNA leads with the top issue. Level detail is one click.
**Target:** Director understands curriculum status in 10 seconds. Improvement is one click, not a URL hack.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Today          Curriculum                                             │
│ [Health] [Builder] [Map]                                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ DONNA                                                                   │
│                                                                         │
│ Orange Ball 2 needs attention: 3 students stuck, gate coverage 45%,    │
│ no session template linked. I've ranked the improvements below.         │
│                                                   [Improve Orange Ball 2]│
└─────────────────────────────────────────────────────────────────────────┘

─── CURRICULUM SPINE ────────────────────────────────────────────────────

  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ ● Red Ball   │  │ ● Orange Ball│  │ ● Green Ball │  │ ● Yellow Ball│
  │              │  │              │  │              │  │              │
  │ 3 levels     │  │ 3 levels     │  │ 2 levels     │  │ 1 level      │
  │ Grade: A     │  │ Grade: C ⚠️  │  │ Grade: B     │  │ Grade: —     │
  │              │  │ 3 stalled    │  │              │  │              │
  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

  Click any stage card → expands level list below

─── ORANGE BALL  (expanded) ─────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────────────┐
  │ Orange Ball 1          B    7 players  ·  0 stalled  ·  2 gates   │
  │                                                       [View] [→]   │
  ├─────────────────────────────────────────────────────────────────────┤
  │ Orange Ball 2  ⚠️      C    5 players  ·  3 stalled  ·  3 gates   │
  │                                             [Improve] [View] [→]   │
  ├─────────────────────────────────────────────────────────────────────┤
  │ Orange Ball 3          B    3 players  ·  0 stalled  ·  2 gates   │
  │                                                       [View] [→]   │
  └─────────────────────────────────────────────────────────────────────┘
```

**Level detail (click [View] on Orange Ball 2):**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Curriculum     Orange Ball 2                         Grade: C        │
│                                                                         │
│ DONNA: "The biggest issue is forehand gate coverage: only 2 of 5       │
│ enrolled players have evidence on record. I'd start by reviewing       │
│ Marcus Chen's last 3 sessions for forehand evidence."                  │
│                                                                         │
│ [Improve this level]  [View players at this level]                     │
├─────────────────────────────────────────────────────────────────────────┤
│ GATES (3)                                                               │
│ • Forehand groundstroke — threshold: 7/10 rallies   2/5 players ●○○○○ │
│ • Backhand groundstroke — threshold: 5/10 rallies   4/5 players ●●●●○ │
│ • Serve placement — threshold: 3/10 serves          3/5 players ●●●○○ │
├─────────────────────────────────────────────────────────────────────────┤
│ ENROLLED PLAYERS                              sorted by: ⚠️ Needs Attn │
│ Lucas Santos    · 8 months · no gate complete  · [View profile]        │
│ Ana Lima        · 6 months · 1 gate complete   · [View profile]        │
│ Marcus Chen     · 4 months · 2 gates complete  · [View profile]        │
│ ···                                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ LINKED TEMPLATE           None linked ⚠️                                │
│                                                   [Link a template]    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Screen 3 — Academy Health

**Purpose:** Complete health picture with honest scores, source labels, and DONNA context for each section.
**Target:** Director understands academy health in 30 seconds. Every number is explained.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Today          Academy Health                     Score: 7.2 / 10   │
│                                           Updated: Jun 5, 2026 9:00am  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ DONNA: "Review & Approval is your biggest gap today — 5 items are      │
│ more than 3 days old. That's the only section below 7.0."              │
│                                                        [Go to Approvals]│
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ ✓ CURRICULUM HEALTH                              8.5 / 10              │
│ Based on: gate coverage, drill count, coach language, track requirements│
│ • Orange Ball 2 gate coverage: 45% ⚠️                                  │
│ • All other levels: B or higher                                         │
│                                              [View curriculum] [Ask →] │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ PLAYER PROGRESS                                7.0 / 10              │
│ Based on: stall detection, advancement eligibility, reassessment status │
│ • 3 players stalled (6+ months, not advancement-eligible)               │
│ • 2 players ready for advancement                                       │
│ • 1 reassessment overdue                                                │
│                                               [View players] [Ask →]   │
├─────────────────────────────────────────────────────────────────────────┤
│ ⚠ REVIEW & APPROVAL                              6.0 / 10              │
│ Based on: pending item age, item count, queue depth                     │
│ • 5 items pending · oldest item: 4 days old                             │
│ • Target: all items reviewed within 2 days                              │
│                                                  [Review now] [Ask →]  │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ COACH EXECUTION                                8.0 / 10              │
│ Based on: recap completion rate (30 days), wrap-up coverage             │
│ • Recap rate: 82% (last 30 days)                                        │
│ • 1 session missing recap (Tuesday, Orange Ball 2)                      │
│                                               [View coaches] [Ask →]   │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ PARENT COMMUNICATION                           7.5 / 10              │
│ Based on: pending parent updates, update age, response rate             │
│ • 2 parent updates pending director approval                            │
│                                                [View updates] [Ask →]  │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ ONBOARDING                                     9.0 / 10              │
│ Based on: setup completion checklist, academy DNA, live status          │
│ • Academy is live: players, curriculum, templates, sessions active      │
│                                                  [View setup] [Ask →]  │
└─────────────────────────────────────────────────────────────────────────┘

(Score confidence: partial — assessment and mission data not yet tracked)
```

---

## Screen 4 — DONNA Daily Brief

**Purpose:** DONNA's primary interaction surface for the day. Full conversational access.
**Target:** Director can ask anything and get an actionable answer.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Today          DONNA                        ● Live  Thu Jun 5, 2026  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ 🧠 DONNA                                            9:02 AM      │  │
│  │                                                                   │  │
│  │ Good morning, Brian. Quick summary:                               │  │
│  │                                                                   │  │
│  │ Your academy is running well — 7.2/10 overall.                   │  │
│  │                                                                   │  │
│  │ The one thing to address today: 5 review items, 2 of which       │  │
│  │ have been waiting over 3 days. I've already sorted them          │  │
│  │ by priority. The one that needs your judgment is Lucas Santos's  │  │
│  │ placement assessment — his forehand rated unusually low.         │  │
│  │                                                                   │  │
│  │ Want me to walk you through it?                                  │  │
│  │                                            [Yes, let's go]       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [How is Orange Ball doing?]   [Who's ready to advance?]   [Explain →] │
│                                                                         │
│ ────────────────────────────────────────────────────────────────────── │
│                                                                         │
│  Ask DONNA anything about your academy...                 [🎤] [→ send]│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Conversation thread example (DONNA walking through a review item):**

```
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 🧠 DONNA                                           9:03 AM     │    │
│  │                                                                 │    │
│  │ Here's Lucas Santos's placement assessment:                    │    │
│  │                                                                 │    │
│  │ Coach Marco rated his forehand 4/10. The Orange Ball 2 gate    │    │
│  │ threshold is 7/10. That's a significant gap.                   │    │
│  │                                                                 │    │
│  │ My recommendation: keep Lucas in Orange Ball 1 for another     │    │
│  │ 6 weeks. I've drafted a parent update explaining this          │    │
│  │ with a positive framing.                                        │    │
│  │                                                                 │    │
│  │ [Approve placement in OB1]   [Review parent draft]   [Reject]  │    │
│  │                                                                 │    │
│  │ Source: assessment submitted by Coach Marco, Jun 4             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
```

---

## Screen 5 — Player Profile

**Purpose:** Full player intelligence in one view. DONNA leads with what matters. Tabs for depth.
**Target:** Director sees player status, risk signals, and recommended action immediately.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Players     Lucas Santos                  ● Active  ·  Orange Ball 2 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ DONNA: "Lucas has been in Orange Ball 2 for 8 months — longer than     │
│ average for this level. His forehand gate is the blocker. 2 options:   │
│ schedule a focused assessment or move him to an intensive group."       │
│                                                                         │
│ [Schedule assessment]   [Move to intensive]   [Draft parent update]    │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────┐  ┌────────────────────────────────────────┐
│ LEVEL STATUS               │  │ GATE PROGRESS (Orange Ball 2)          │
│ Orange Ball 2 · 8 months   │  │ Forehand  ──────────── 40%  ⚠️        │
│ Time at level: HIGH ⚠️     │  │ Backhand  ──────────────── 80%  ✓     │
│ Advancement eligible: No   │  │ Serve     ─────────── 60%              │
│                            │  │ No evidence: 2 gates                   │
└────────────────────────────┘  └────────────────────────────────────────┘

─── [Overview]  [Development]  [Sessions]  [Notes]  [Parent] ───────────

─── Overview tab ────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────────────┐
│ RECENT SESSIONS (last 3)                                                │
│ Jun 4  ·  Orange Ball 2  ·  Coach Marco   ·  Attended                  │
│ May 30 ·  Orange Ball 2  ·  Coach Marco   ·  Attended                  │
│ May 27 ·  Orange Ball 2  ·  Coach Ana     ·  Absent ⚠️                 │
├─────────────────────────────────────────────────────────────────────────┤
│ FOCUS AREAS                                                              │
│ 1. Forehand groundstroke consistency                                    │
│ 2. Slice backhand introduction                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ COACH OBSERVATIONS (last 30 days)                                       │
│ "Strong serve in Tuesday's session — consistent placement."  — Marco    │
│ "Forehand inconsistent under pressure. Needs drill repetition." — Ana  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Screen 6 — Coach Profile

**Purpose:** Director's view of a coach — performance, compliance, and DONNA's assessment.
**Target:** Director sees coach health in one screen without navigating to sessions.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Coaches     Marco Rossi                   Head Coach  ·  Active      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ DONNA: "Marco is your top-performing coach this month: 92% recap rate,  │
│ strong student engagement scores. One flag: he hasn't submitted a wrap-  │
│ up for Tuesday's Orange Ball 2 session."                                │
│                                                                         │
│ [Request recap]   [Message coach]                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ PERFORMANCE  ·  Last 30 Days                                            │
│                                                                         │
│ Recap rate         92%   ████████████████████░░  vs. target 90%  ✓    │
│ Sessions completed  11   ████████████████████                          │
│ Observations filed  23   ██████████████████████████████                │
│ Missing recaps       1   ░  (Tuesday, Jun 3)                            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ RECENT SESSIONS                                [View all sessions →]   │
│ Jun 4  ·  Orange Ball 2  ·  Completed  ·  Recap submitted  ✓           │
│ Jun 3  ·  Orange Ball 2  ·  Completed  ·  No recap ⚠️                  │
│ May 30 ·  Red Ball 1     ·  Completed  ·  Recap submitted  ✓           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ ASSIGNED GROUPS                                                         │
│ Orange Ball 2  ·  5 players  ·  Mon/Wed/Fri                             │
│ Red Ball 1     ·  4 players  ·  Tue/Thu                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Mobile Considerations

All 6 screens collapse to a single-column mobile layout:

- **Today (mobile):** DONNA brief card (full width) → Approvals list → Sessions list. No sidebars. Bottom tab navigation (Today / Players / Curriculum / Health / DONNA).
- **Curriculum (mobile):** Stage cards horizontal scroll. Tap stage → level list expands. DONNA brief collapses to one line with expand control.
- **Player Profile (mobile):** Header + DONNA brief → Gate progress (horizontal progress bars) → Tab navigation (scroll). Actions in sticky bottom bar.
- **DONNA (mobile):** Full-screen chat interface. Voice input prominent. Suggestion chips as horizontal scroll.

---

## Design Tokens Applied

All wireframes use:
- Background: `#0A0A0A` (base)
- Card surface: `#111111` (surface)
- Elevated: `#1A1A1A` (surface-raised)
- Border: `#222222`
- Primary accent: `#C8FF00` (lime) for primary CTAs only
- Warning: `#FF9500` (status-orange)
- Error: `#FF3B30` (status-red)
- Success: `#30D158` (status-green)
- Text hierarchy: White → `#AAAAAA` → `#555555`
