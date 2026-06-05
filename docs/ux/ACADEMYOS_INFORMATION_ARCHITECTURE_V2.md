# AcademyOS Information Architecture V2

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2101–2150
**Purpose:** Ignore the current navigation. Design the ideal AcademyOS information architecture. What should a director see first, what should be hidden, what should be merged, and what should DONNA own?
**Constraint:** All existing intelligence and functionality must be preserved. IA redesign only.

---

## Design Principles Applied

1. **DONNA is the operating brain** — the UI is the evidence layer
2. **One primary surface** — a director has one "place" they think of as DONNA
3. **Intelligence first, data second** — the recommendation appears before the report
4. **Context-sensitive depth** — show only what's relevant to the current moment
5. **Navigation by intent, not by feature** — labels match what the director wants to do, not what the feature does

---

## Current IA Problems

### Problem 1: Navigation by feature, not intent

Current sidebar:
```
Today (dashboard)
Approvals (review queue)
Players (directory)
Sessions (session list)
Curriculum (→ builder, not health)
Parent Updates
Academy Health (KPI page)
Templates
Coaches
---
Assessment Template
Settings
Onboarding
```

The director's mental model is not "I need to go to the Templates section." It is "I need to prepare next week's sessions." The navigation does not match intent.

### Problem 2: Three homes for the same concept

"Academy Health" appears at:
- Sidebar item → `/director/kpi`
- Collapsed section "Academy Metrics" on dashboard
- `AcademyHealthBadgeWithDrawer` in the page header

A director building a mental model of the system cannot tell which one is authoritative.

### Problem 3: DONNA has no home

DONNA is a floating button, a status bar, a daily brief, a COO card, a command section, a screen brief, a proactive card, and a highlight banner. DONNA has no clear home — she's everywhere and nowhere.

### Problem 4: Daily operations and setup are mixed

The dashboard shows both:
- Daily operational items (sessions, approvals, player alerts)
- Setup checklist (create first template, link curriculum, etc.)

These have different audiences (daily user vs. new user), different urgency (today vs. eventually), and different time horizons. Mixing them creates cognitive load for both audiences.

---

## V2 Information Architecture

### Core Concept: Two-Zone Design

**Zone 1 — DONNA Zone (left, persistent)**
DONNA's primary interface. Always visible. This is the operating brain.

**Zone 2 — Evidence Zone (right, context-sensitive)**
The data and decisions DONNA references. Changes based on what DONNA is discussing.

This is the model used by Linear's command palette + issues panel, Superhuman's AI triage + message view, and Notion's sidebar + document area.

---

### V2 Navigation Structure

Replace the current 12-item sidebar with a 5-intent navigation:

```
── OPERATE (daily) ──────────────────────────────────────────────
  Today                → DONNA briefing + approval queue + sessions
  Players              → player roster with AI-sorted priority

── DEVELOP (curriculum + sessions) ──────────────────────────────
  Curriculum           → curriculum health (NOT builder)
  Sessions             → session calendar + templates

── MONITOR (health + insights) ──────────────────────────────────
  Academy Health       → KPI + coach compliance + signals

── MANAGE (settings + config) ───────────────────────────────────
  [gear icon]          → coaches, parents, templates, settings, assessment templates, onboarding
```

**What changed:**
- 12 items → 5 + gear menu
- "Curriculum" → curriculum health (not builder) — builder is inside Curriculum
- "Approvals" removed as top-level → merged into "Today"
- "Parent Updates" removed as top-level → DONNA surfaces these proactively, accessible from "Today"
- "Templates" removed as top-level → inside "Sessions" (templates power sessions) + inside gear menu
- "Coaches" removed as top-level → inside gear menu (configuration, not daily operation)
- "Assessment Template" removed as top-level → inside gear menu

---

### V2 Page Structures

#### Today (replaces dashboard)

```
┌─────────────────────────────────────────────────────────┐
│ DONNA BRIEF (always visible, full width)                │
│ "Good morning, Brian. 3 things need your attention:    │
│  · Lucas's parent update is ready to review            │
│  · Orange Ball 2 session ran without a recap           │
│  · 2 players are ready for level advancement"          │
│                                                         │
│ [Review parent update]  [Open recap]  [Advance players] │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ TODAY'S APPROVALS                      5 pending        │
│ Coach Wrap-Up · Marco Rossi · 12 Jun   [Approve] [Skip] │
│ Placement · Lucas Santos · 11 Jun      [Review]         │
│ Assessment · Ana Lima · 10 Jun         [Review]         │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ THIS WEEK'S SESSIONS                                    │
│ Mon · Orange Ball 2 · Marco · Planned                   │
│ Wed · Red Ball · Ana · In Progress                      │
│ Fri · Green Ball · Marco · Planned                      │
└─────────────────────────────────────────────────────────┘
```

**What's removed from Today:**
- DONNA command section (DONNA brief IS the command interface)
- DirectorTodayKpiSection (7 tiles) → moved to Academy Health
- Academy Setup section → moved to first-run onboarding flow
- Quick Actions section → actions appear contextually from DONNA brief
- Analytics section with static sparkline → moved to Academy Health
- Alerts & Placement section → surfaced by DONNA brief, not a separate section

---

#### Players (replaces directory)

```
┌─────────────────────────────────────────────────────────┐
│ DONNA: "3 players need your attention this week.       │
│ Lucas: stalled 8 months. Ana: reassessment due.        │
│ Marcus: advancement ready."                            │
│                                                         │
│ [Sort by: Needs Attention ▼]   [Search...]              │
└─────────────────────────────────────────────────────────┘

Player list — AI-sorted by urgency, not alphabetically:
• Lucas Santos — ⚠️ Stalled 8 months · Orange Ball 2     →
• Ana Lima — 🔄 Reassessment due · Green Ball 1          →
• Marcus Chen — ✓ Ready to advance · Orange Ball 1       →
• [remaining players — lower priority]                   →
```

**What changes:** Player list defaults to priority sort, not alphabetical. DONNA brief explains why these players are first. Director can switch to alphabetical or filter by level.

---

#### Curriculum (replaces overview page + builder entry point)

```
┌─────────────────────────────────────────────────────────┐
│ DONNA: "Orange Ball 2 needs attention.                 │
│ 3 students stuck, gate coverage 45%, no template        │
│ linked. I've ranked the issues:"                       │
│                                                         │
│ [Improve Orange Ball 2]  [Link a template]              │
└─────────────────────────────────────────────────────────┘

Curriculum spine — 5 stage cards, horizontal scroll on mobile:
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Red     │ │ Orange  │ │ Green   │ │ Yellow  │ │ High    │
│ Ball    │ │ Ball    │ │ Ball    │ │ Ball    │ │ Perf    │
│ A       │ │ C ⚠️   │ │ B       │ │ —       │ │ —       │
│ 3 levels│ │ 3 levels│ │ 2 levels│ │ 1 level │ │ 1 level │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘

[Builder tab]  [Health tab]  [Map tab]
```

**What changes:**
- Default view is health, not builder
- DONNA leads with the most important curriculum issue
- "Improve this level" is a visible button, not a URL parameter
- Level health grades are shown inline on stage cards
- Three tabs for different workflows: Builder (create content), Health (see status), Map (visual overview)

---

#### Academy Health (replaces /director/kpi)

```
┌─────────────────────────────────────────────────────────┐
│ ACADEMY HEALTH                        Score: 7.2 / 10  │
│ Updated: 2026-06-05                                     │
│                                                         │
│ ✓ Curriculum Health       8.5    Orange Ball 2 gap      │
│ ✓ Player Progress         7.0    3 stalled players      │
│ ⚠ Review & Approval       6.0    5 items > 3 days old  │
│ ✓ Coach Execution         8.0    82% recap rate         │
│ ✓ Parent Communication    7.5    2 updates pending      │
│ ✓ Onboarding              9.0    All steps complete     │
└─────────────────────────────────────────────────────────┘

[View KPI details]  [Ask DONNA to explain]
```

**What this replaces:** The /kpi page, the "Academy Metrics" collapsible section, the `AcademyHealthBadgeWithDrawer` in the page header, and the static sparkline chart.

---

### What Gets Removed

| Current Element | Removal Reason |
|---|---|
| `DonnaCOOStatusWrapper` (persistent top bar) | Merged into DONNA brief on Today page |
| `DonnaDailyCOOBriefSurface` (dismissible banner) | DONNA brief is always visible — no separate daily surface |
| `DonnaScreenBriefStatic` (page context brief) | DONNA speaks contextually from the page brief on Today |
| `DonnaProactiveBriefCard` (per-route guide) | Replaced by in-page DONNA brief |
| `DonnaHighlightBanner` (guided overlay) | Replaced by DONNA's conversational guidance |
| "Quick Actions" collapsible section | Links already exist in sidebar |
| "Analytics" collapsible section (static sparkline) | Real analytics on Academy Health page |
| "Academy Metrics" collapsible section | Academy Health page is the home for this |
| "Alerts & Placement" collapsible section | DONNA brief surfaces urgent items |
| Sidebar "Approvals" item | Merged into Today |
| Sidebar "Parent Updates" item | DONNA surfaces proactively, accessible from Today |
| Sidebar "Templates" item | Inside Curriculum (class templates) + Sessions (session templates) + gear menu |
| Sidebar "Coaches" item | Inside gear menu (configuration) |
| Sidebar "Assessment Template" item | Inside gear menu |

**Items removed from sidebar: 5 (from 12 to 5 + gear menu)**
**Sections removed from dashboard: 5**
**DONNA surfaces collapsed: 5 → 1**

---

### What Gets Merged

| From | Into | Reason |
|---|---|---|
| `DirectorTodayKpiSection` + `AcademyKpiCardsSection` + `DirectorKpiHealthSection` | Academy Health page | 3 KPI surfaces → 1 |
| `DonnaAcademyCOOBriefCard` + `DonnaCommandSection` + `DonnaScreenBriefStatic` | DONNA brief (Today page) | 3 DONNA surfaces → 1 |
| Approval workflow + "Today" dashboard | Unified Today page | Approvals ARE the daily work |
| Template management + Curriculum builder | Inside Curriculum | Templates are curriculum artifacts |

---

### What DONNA Owns (Does Not Require Navigation)

| Task | How DONNA handles it |
|---|---|
| Daily brief | DONNA opens with it on Today page |
| Approval prioritization | DONNA sorts and explains the queue |
| Parent update drafting | DONNA drafts, director approves |
| Curriculum improvement suggestions | DONNA opens suggestion in level detail |
| Player advancement list | DONNA surfaces ready players in brief |
| Coach recap coverage | DONNA flags in brief when recap rate drops |
| Session prep brief | DONNA opens before each session day |

**Navigation required for:** deep player profile, curriculum content editing, session detail, settings, and any workflow that requires sustained editor-style interaction.

---

### V2 IA Summary

```
Primary navigation (5 items):
  Today ─────────── DONNA brief + approvals + sessions (daily home)
  Players ────────── AI-prioritized roster
  Curriculum ─────── Health view → level detail → improvement
  Sessions ────────── Calendar + templates
  Academy Health ─── KPIs + signals + coach compliance

Secondary navigation (gear menu):
  Coaches, Templates, Parents, Assessment Templates, Settings, Onboarding

DONNA surface (1, not 8):
  Inline on each page — the brief IS the interface
  Floating button remains for open-ended questions
```
