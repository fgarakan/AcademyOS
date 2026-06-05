# Director Homepage Reimagination V1

**Date:** 2026-06-05
**Transformation:** Dashboard → Daily COO Briefing
**Core Principle:** DONNA thinks. The UI proves. The director decides.

---

## Design Philosophy

The Director Homepage is not a dashboard. It is a daily briefing surface.

A COO does not open a portal and scroll through 9 sections of data.
A COO opens their brief, sees what matters, confirms it, acts.

The homepage must answer three questions above the fold:
1. **What matters today?**
2. **Why does it matter?**
3. **What should I do first?**

If the director has to scroll to answer any of these, the page has failed.

---

## Information Hierarchy

### Zone 1 — Identity + Date (micro, non-competing)

```
[Good morning, Brian.] [Thursday, June 5]    [Academy Health: 87%]
Dabul Tennis Academy
```

- Greeting is a single line, not a card
- Date is metadata, not a headline
- Academy Health % is a status badge — one number, right-aligned
- No DONNA icon, no animation, no greeting cards
- Health badge opens a health drawer on click (drilldown, not above fold)

---

### Zone 2 — DONNA Daily Brief (one surface only)

```
┌─────────────────────────────────────────────────────────────────┐
│  DONNA                                                          │
│  "3 wrap-ups are waiting review. Orange Ball 2 has 4 stalled   │
│   players — longest at 214 days. Start with the review queue." │
│                                                                 │
│  [Go to Review Queue →]                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Rules:**
- One DONNA surface only. Not two, not four.
- 1-2 sentences maximum. DONNA does not list everything — it leads with the most important thing.
- One CTA only. DONNA recommends one action, not five.
- Urgency styling if severity is critical/high (orange border). Calm styling if normal.
- No greeting text inside this card. No "Good morning" here — that's Zone 1.
- This is not a full COO briefing card — it is a brief.

**What DONNA surface is removed:** `DonnaFirstGreeting`, `DonnaScreenBriefStatic`, `DonnaAcademyCOOBriefCard`, and `DonnaCommandSection` are all replaced by this single card.

---

### Zone 3 — Top 3 Priorities (the decision surface)

```
┌──────────────────────────────────────────────────────────────┐
│  TODAY'S PRIORITIES                                          │
│                                                              │
│  1  [●] 3 coach wrap-ups awaiting review       [Review →]   │
│  2  [◐] Orange Ball 2 — 4 players stalled      [Improve →]  │
│  3  [○] 2 players pending placement            [Place →]    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Rules:**
- Maximum 3 items. Never more.
- Each item has: severity indicator, label, single action button.
- Items are sorted by urgency (DONNA-ranked from attention queue).
- No detail text — just enough to recognize the issue and act.
- If no priorities: single line "Academy clear — no urgent items today."
- The first item's action button is lime (primary). Items 2 and 3 are ghost buttons.

**Severity indicators:**
- [●] Red = critical/immediate action needed
- [◐] Orange = needs attention today
- [○] Muted = low urgency, informational

---

### Zone 4 — Urgent Approvals Banner (conditional, only shown if count > 0)

```
┌──────────────────────────────────────────────────────────────┐
│  ⚡ 3 items need your approval                  [Open →]    │
└──────────────────────────────────────────────────────────────┘
```

**Rules:**
- Only rendered when `totalPendingReviews > 0`
- Single line, no scrolling, no card
- Links directly to `/director/review`
- Disappears when queue is empty (not "All clear" state — just gone)

---

### Zone 5 — Academy Health Snapshot (supporting, not commanding)

```
┌──────────────────────────────────────────────────────────────┐
│  ACADEMY HEALTH                                  87%  ↑      │
│                                                              │
│  Active players: 24    Sessions this week: 6                 │
│  Players improving: 18                                       │
│                                                              │
│  Top signal: 2 players on hold (reassessment overdue)        │
│  [View full health report →]                                 │
└──────────────────────────────────────────────────────────────┘
```

**Rules:**
- Health % is real data only — derived from alert counts, never fabricated
- No sparkline unless backed by real time-series data
- 3 key numbers max (active, sessions, improving)
- One top signal sentence (the worst thing for health today)
- Drilldown link opens health drawer, not a new page
- This is supporting context — not the hero

---

### Zone 6 — Optional Drilldowns (collapsed, intelligent labels)

Collapsed by default. Labels communicate what's inside:

```
▶  Sessions this week (6)
▶  Players needing attention (2)
▶  Curriculum gaps (3)
▶  Recent coach recaps
```

**Rules:**
- Section titles include the count so director knows whether to open
- Empty sections (count = 0) are hidden entirely, not shown as "0"
- Opening a section shows a lightweight list, not a full sub-dashboard
- Academy Setup appears here only if setup is incomplete — not post-setup

---

## Above the Fold — Exact Requirement

At 1280px desktop viewport, these zones must all be visible without scroll:
- Zone 1 (identity bar)
- Zone 2 (DONNA brief)
- Zone 3 (top 3 priorities)
- Zone 4 (approvals banner, if applicable)

Zones 5 and 6 may require a short scroll. That is acceptable — they are supporting context.

On mobile (375px): Zone 1 + Zone 2 + Zone 3 must be visible without scroll.

---

## What Is Removed

| Removed | Reason |
|---------|--------|
| `DonnaFirstGreeting` | Replaced by single Zone 2 DONNA brief |
| `DonnaScreenBriefStatic` | Replaced by single Zone 2 DONNA brief |
| `DonnaAcademyCOOBriefCard` (expanded) | Collapsed into Zone 2 brief |
| `DonnaCommandSection` | Moved to DONNA page or persistent button |
| `DirectorPrimaryActionHero` | Replaced by Zone 3 priorities list |
| `DirectorTodayKpiSection` | Moved to drilldown or Academy Health zone |
| Academy Health sparkline (fake data) | Removed entirely until real time-series exists |
| `AcademyAlertsPanel` duplication | Deduplicated into Zone 3 priorities |
| `LiveActivityCard` | Removed — duplicates Session drilldown |

---

## What Is Preserved

| Preserved | Where |
|-----------|-------|
| Academy Health % | Zone 5 snapshot + identity bar badge |
| Pending review queue link | Zone 4 banner |
| Attention queue signals | Zone 3 priorities (deduplicated to 3) |
| Session this week | Zone 6 drilldown |
| Players needing attention | Zone 6 drilldown |
| Quick navigation | Zone 6 drilldowns (not a collapsed accordion of cards) |
| Academy Setup | Zone 6 drilldown (hidden when setup complete) |

---

## DONNA Brief — Content Rules

The DONNA brief (Zone 2) should follow this decision tree:

1. If `criticalItems > 0`: Lead with the most critical item. "X needs immediate action."
2. Else if `pendingReviews > 3`: Lead with review queue. "N items waiting in review."
3. Else if `stalledPlayers > 0`: Lead with curriculum stall. "N players stalled at [level]."
4. Else if `attentionCount > 0`: Lead with player attention. "N players need attention."
5. Else if `isAcademyLive === false`: Lead with setup. "Your academy is not fully set up."
6. Else: "Academy running smoothly — N active players, no urgent items today."

One sentence from this tree. Then one supporting sentence of context. Then one CTA.

---

## State Variants

### Setup State (no players yet)
DONNA Brief: "Start by adding players and assigning levels — then DONNA can surface what needs attention."
Zone 3: Shows setup steps instead of priorities.
Zone 4: Hidden.
Zone 5: Hidden.

### All Clear State (no priorities)
DONNA Brief: "Academy is running smoothly. N active players, N sessions this week."
Zone 3: "No urgent items today — all clear." (single line, no buttons)
Zone 4: Hidden.

### Crisis State (multiple critical items)
DONNA Brief: Leads with most critical item, urgency styling (orange border/background).
Zone 3: All 3 items shown as high/critical severity.
Zone 4: Approvals banner visible.
Zone 5: Health snapshot shows warning color.

---

## Design Token Rules

- Zone 2 card background: `surface` with `border-border` (calm) or `border-status-orange/30` (urgent)
- Zone 3 item row: transparent background, hover `surface-raised`
- Zone 4 banner: `border-status-orange/20 bg-status-orange/5`
- Zone 5 health: text-lime for health %, color-coded by threshold
- All section collapse controls: show count badge, no chevron animation required
