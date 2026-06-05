# AcademyOS UX Final Blueprint V1

**Date:** 2026-06-05
**Authority:** This document supersedes all prior UX audit, reimagination, and IA docs.
**Purpose:** Single source of truth. If AcademyOS were rebuilt from scratch tomorrow while preserving all existing intelligence, this is exactly what we would build.
**Status:** Blueprint only. No code. No implementation.

---

## Operating Principle

> DONNA thinks. The UI proves. The director decides.

This is not a philosophy. It is a structural rule that governs every layout decision in this document.

- **DONNA** owns: conclusions, priorities, recommendations, explanations, next-step guidance.
- **UI** owns: evidence, approvals, navigation, status, proof of DONNA's claims.
- **Director** owns: every decision. DONNA never auto-executes. UI never recommends.

---

## The Answer in One Paragraph

A director opens AcademyOS. DONNA says: "3 things need you today." The director sees those 3 things. They act on the first one. Everything else — KPIs, curriculum details, coach lists, analytics — is one tap away, organized by what the director wants to do, not by what the feature is. DONNA speaks once per page, in 2 sentences, and then is available as a floating panel for depth. The intelligence built across 2000+ sprints is the first thing visible on every screen, not the last.

---

## 1. Final Navigation Structure

### Primary Sidebar (5 items + gear)

```
Today             → /director               (daily home — DONNA brief + approvals + sessions)
Players           → /director/players        (AI-priority-sorted roster)
Curriculum        → /director/curriculum     (health view, NOT builder)
Sessions          → /director/sessions       (calendar + templates)
Academy Health    → /director/health         (KPIs + signals + coach compliance)
[⚙ gear]          → /director/settings       (coaches, templates, assessment templates, parents, onboarding)
```

### Gear Menu Contents

```
Coaches
Templates (class + session)
Assessment Templates
Parents
Settings
Onboarding
```

### What Changed From Current Navigation

| Removed From Primary | Moved To | Reason |
|---|---|---|
| Approvals | Merged into Today | Approvals ARE the daily work |
| Parent Updates | Today + DONNA proactive | DONNA surfaces these — no nav needed |
| Templates | Sessions + gear | Templates serve sessions; not a standalone daily destination |
| Coaches | Gear menu | Configuration, not daily operation |
| Assessment Template | Gear menu | Rarely touched after initial setup |
| Onboarding | Gear menu / first-run | Not a daily destination |

**Result: 12-item sidebar → 5 + gear**

---

## 2. Final Information Architecture

### Two-Zone Design

Every director page uses a two-zone model:

**Zone Left (persistent sidebar, 240px):** Navigation only. No DONNA. No data.

**Zone Right (main area, flex-1):** Intelligence first, evidence second.

The main area of every page follows this exact stack order:

1. **DONNA brief** — 1 card, 2 sentences, 1 CTA. Always first. Never skipped.
2. **Primary action surface** — the thing the director should do on this page.
3. **Evidence** — data that proves DONNA's brief. Labeled with source.
4. **Drilldowns** — collapsed by default, count badge visible, meaningful labels.

### Rule: Intelligence Before Data

DONNA's conclusion appears before the data that supports it. Always. On every page.

**Prohibited order:** KPI tiles → DONNA recommendation
**Required order:** DONNA recommendation → KPI tiles (as evidence)

---

## 3. Final Director Homepage (Today)

**Question this page answers:** What do I do right now?
**10-second test requirement:** PASS — director identifies primary action in under 10 seconds.

### Above the Fold (1280×800, no scroll)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ AcademyOS          Dabul Tennis Academy          ● DONNA    [Brian ▾]  │
│ Today · Players · Curriculum · Sessions · Academy Health   [⚙]         │
└─────────────────────────────────────────────────────────────────────────┘

ZONE 1 — Identity bar (single line, no card)
Good morning, Brian.  ·  Thursday, Jun 5          Academy Health: 87% ↑

┌─────────────────────────────────────────────────────────────────────────┐
│ DONNA                                                                   │
│                                                                         │
│ 3 wrap-ups are waiting review. Orange Ball 2 has 4 stalled players —   │
│ longest at 214 days. Start with the review queue.                      │
│                                                       [Go to Review →]  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ TODAY'S PRIORITIES                                                      │
│                                                                         │
│ ①  [●]  3 coach wrap-ups awaiting review               [Review →]      │
│ ②  [◐]  Orange Ball 2 — 4 players stalled              [Improve →]     │
│ ③  [○]  2 players pending placement                    [Place →]       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

⚡ 5 items need your approval                                 [Open →]
```

### Below the Fold (requires one scroll)

```
─── APPROVALS  ·  5 pending ─────────────────────────────────────────────

Coach Wrap-Up  ·  Marco Rossi  ·  12 Jun  ·  Orange Ball 2
"Strong forehand session. Lucas still hesitant on slice backhand."
                                             [Approve]  [Reject]  [···]

Placement  ·  Lucas Santos  ·  11 Jun
Recommended: Orange Ball 2
                                             [Review]              [···]

+ 3 more items                                          [View all →]

─── THIS WEEK  ·  4 sessions ────────────────────────────────────────────

Mon · Orange Ball 2 · Marco · Planned     Wed · Red Ball 1 · In Progress
Thu · Green Ball 1  · Marco · Planned     Fri · Orange Ball 1 · Planned

                                      [+ New session]  [View calendar]
```

### Page Sections: 4 Total

| # | Section | Visible by default | Notes |
|---|---|---|---|
| 1 | Identity bar | Yes | Single line, no card |
| 2 | DONNA brief | Yes | 1 card, 2 sentences, 1 CTA |
| 3 | Top 3 priorities | Yes | Max 3, severity-ranked |
| 4 | Approvals banner | Conditional | Only when queue > 0 |
| 5 | Approval items | Scroll | 2 visible, expand for all |
| 6 | Sessions this week | Scroll | 2×2 grid |

### DONNA Responsibilities on Today

- Lead with the single most important signal (decision tree below)
- Rank the 3 priorities (from attention queue engine)
- Speak in 2 sentences max — conclusion first, one supporting context sentence
- Provide one CTA only — the most important action for the day
- Disappear when the director opens the full DONNA panel

**DONNA decision tree for Today brief:**

```
1. criticalItems > 0          → "X needs immediate action."
2. pendingReviews > 3         → "N items waiting in review."
3. stalledPlayers > 0         → "N players stalled at [level] — longest at N days."
4. attentionCount > 0         → "N players need your attention this week."
5. isAcademyLive === false    → "Your academy is not fully set up."
6. else                       → "Academy running smoothly — N active players, no urgent items today."
```

### UI Responsibilities on Today

- Render the priority list (evidence of DONNA's ranking)
- Render approval items with approve/reject controls
- Render sessions this week
- Show approvals banner count badge (live from `proposed_actions`)
- Count badges on collapsed drilldowns must be real counts, never fabricated

### State Variants

**Setup state (no players, no sessions):**
- DONNA: "Start by adding players and assigning levels."
- Zone 3: Setup steps instead of priorities
- Zones 4–6: Hidden

**All-clear state:**
- DONNA: "Academy is running smoothly — N active players, N sessions this week."
- Zone 3: "No urgent items today — all clear." (one line, no buttons)
- Zone 4: Hidden

**Crisis state (multiple critical items):**
- DONNA card: `border-status-orange/30 bg-status-orange/5`
- All 3 priorities shown as high/critical severity
- Approvals banner visible

### Removed From Today

| Element | Reason |
|---|---|
| `DonnaFirstGreeting` card | Replaced by single DONNA brief |
| `DonnaScreenBriefStatic` | Replaced by single DONNA brief |
| `DonnaAcademyCOOBriefCard` (expanded by default) | Collapsed into DONNA brief |
| `DonnaCommandSection` inline input | Floating DONNA panel owns this |
| `DirectorPrimaryActionHero` | Replaced by Zone 3 priority list |
| `DirectorTodayKpiSection` (7 tiles) | Moved to Academy Health page |
| Static sparkline "Academy Health This Week" | **Removed entirely** — fabricated from formula, not real historical data |
| `AcademyAlertsPanel` | Deduplicated into Zone 3 priorities |
| `LiveActivityCard` | Duplicates sessions section |
| "Quick Actions" collapsible section | Duplicates sidebar links |
| "Analytics" collapsible section | Moved to Academy Health page |
| "Academy Metrics" collapsible section | Moved to Academy Health page |
| "Alerts & Placement" collapsible section | Items surfaced by DONNA brief + Zone 3 |
| Academy Setup section (bottom of page) | Moved to first-run onboarding; hidden post-setup |
| `DonnaCOOStatusWrapper` persistent top bar | Absorbed into Today DONNA brief |
| `DonnaDailyCOOBriefSurface` | Absorbed into Today DONNA brief |

**Cognitive load rationale:** Current above-the-fold renders ~13 distinct information blocks before one action surface. The redesign delivers the primary action in the first viewport with 3 sections. Cognitive decision overhead drops from 13 blocks to 3 zones.

---

## 4. Final Curriculum Command Center

**Question this page answers:** Where is my curriculum struggling, and what should I fix first?
**10-second test requirement:** PASS — director sees the most-blocked level without scrolling.

### Above the Fold (1280×800, no scroll)

```
← Today    CURRICULUM COMMAND CENTER
           [Health] [Builder] [Map]

┌─────────────────────────────────────────────────────────────────────────┐
│ DONNA                                                                   │
│                                                                         │
│ Orange Ball 2 is your most blocked level — 4 players stalled for an    │
│ average of 187 days. The main blocker is cross-court groundstroke       │
│ consistency. Review the gate evidence.                                  │
│                                                   [Review Orange Ball 2]│
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ MOST BLOCKED LEVEL                                   [lime border]      │
│                                                                         │
│ Orange Ball 2                                                           │
│ 4 players stalled · Avg 187 days · 38% gate completion                 │
│                                                                         │
│ Top blocker: Consistency — Cross-Court Groundstrokes                    │
│                                                                         │
│ [Improve This Level →]                           [View All Levels]     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ CURRICULUM HEALTH                                         Score: 74%    │
│                                                                         │
│ Gates ███████████░  11/14   Drills ██████░░  6/10                      │
│ Coach Cues ████████  8/10  Coverage ████░░░  4/10                      │
│                                              [Open Health Report →]    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ CURRICULUM PRIORITIES                                                   │
│                                                                         │
│ ①  [●]  Orange Ball 2 — 4 players stalled          [Improve →]         │
│ ②  [◐]  Red Ball 1 — missing 3 coach cues          [Fix →]             │
│ ③  [○]  Green Ball — no fitness guidance           [Add →]             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Below the Fold (collapsed, count badges visible)

```
▶  Pending improvements (3)
▶  Curriculum levels (14)
▶  Curriculum tools
```

### Level Detail (on click of [Improve This Level] or [View] on a level)

```
← Curriculum     Orange Ball 2                           Grade: C

DONNA: "The biggest issue is forehand gate coverage: only 2 of 5 enrolled
players have evidence on record. I'd start by reviewing Marcus Chen's last
3 sessions for forehand evidence."

[Improve this level]   [View players at this level]

──────────────────────────────────────────────────────────
GATES (3)
• Forehand groundstroke — 7/10 rallies    2/5 players ●○○○○
• Backhand groundstroke — 5/10 rallies    4/5 players ●●●●○
• Serve placement — 3/10 serves           3/5 players ●●●○○

──────────────────────────────────────────────────────────
ENROLLED PLAYERS                         sorted by: ⚠ Needs Attn
Lucas Santos   · 8 months · no gate complete  · [View profile]
Ana Lima       · 6 months · 1 gate complete   · [View profile]
Marcus Chen    · 4 months · 2 gates complete  · [View profile]

──────────────────────────────────────────────────────────
LINKED TEMPLATE              None linked ⚠
                                              [Link a template]
```

### DONNA Responsibilities on Curriculum

- Lead with the most-blocked level name, stall count, and main blocker phrase
- If no blockers: "Curriculum is healthy — N levels active, all major gates covered."
- 2 sentences max
- One CTA: "Review [level name]"
- Never list all problems — lead with the one that matters most
- Power the priority list ranking (Zone 5)

**DONNA decision tree for Curriculum brief:**

```
1. stalledCount > 0           → "[Level] is your most blocked level — N players stalled for avg N days. The main blocker is [topTaggedConcern]."
2. attentionScore = 'needs'   → "Your curriculum has N priority gaps — [topConcern] needs attention."
3. hasCurriculumGaps, no stalls → "No players are stalled, but N curriculum gaps remain unaddressed."
4. setup incomplete           → "Your curriculum setup is N% complete."
5. else                       → "Curriculum is healthy — N levels active. All major gates and drills are covered."
```

### UI Responsibilities on Curriculum

- Render the most-blocked level card with exact data (stall count, avg days, gate %)
- Render the health strip (4 dimensions, progress bars, score)
- Render priority list (max 3, ranked)
- Render drilldowns with count badges
- "Improve This Level" button triggers `?improve=[levelKey]` — existing functionality, now discoverable on every level card

### State Variants

**Healthy state:** Zone 3 shows "All levels progressing normally — no stalled players." No lime border.

**No curriculum version:** Zone 2 brief guides setup. Zone 3 = "Start Curriculum Setup →" full-width button. Zones 4–5 hidden.

**Draft in progress:** Zone 2 surfaces draft status. Zone 3 = "Review Draft →" as primary CTA.

### Removed From Curriculum

| Element | Reason |
|---|---|
| `CurriculumBuilderWelcome` | Orientation content. Director doesn't need to be sold on curriculum daily. |
| "Connected System" section (4 info cards) | Static orientation. Belongs in onboarding, not daily operations. |
| "Next Recommended Actions" numbered list | Hardcoded text. DONNA absorbs recommendations. |
| Curriculum Spine descriptive stage cards | Description, not intelligence. Moved to drilldown. |
| Setup Status checklist (post-setup) | Completed checklist is noise. Hidden when all items complete. |
| Full `CurriculumHealthPanel` above fold | Replaced by compact health strip. Full panel in drilldown. |
| "Curriculum Tools" as first-class section | Collapsed to bottom Zone 8. |
| `CurriculumBuilderWelcome` DONNA greeting | Replaced by single focused DONNA brief. |

**Cognitive load rationale:** Current curriculum page buries intelligence at scroll position 4. The Command Center delivers the most-blocked level, its health data, and a ranked priority list all above the fold — before any scrolling. The director knows what to fix in under 10 seconds.

---

## 5. Final DONNA Experience

### One Surface Per Page. Always.

A director has exactly one way to interact with DONNA at any given moment:

- **One inline brief per page** (2 sentences, 1 CTA — not interactive)
- **One floating DONNA button** (bottom right — opens full panel)

These two together are the DONNA experience. No other DONNA elements are active.

### DONNA Inline Brief Rules

Every director page has exactly one DONNA brief card. No exceptions.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ DONNA                                                                   │
│                                                                         │
│ [Conclusion sentence — what matters most on this screen right now.]    │
│ [Support sentence — why, or what comes next.]                          │
│                                                      [One CTA →]       │
└─────────────────────────────────────────────────────────────────────────┘
```

**Rules:**
- 2 sentences maximum
- 1 CTA maximum
- Always appears before any data section on the page
- Never greets ("Good morning") — greetings are in the identity bar only
- Never lists everything — concludes, then supports
- Never uses "based on available data" — if data is thin, DONNA says so in human language: "Only 2 sessions recorded this month — signals may not be representative yet."
- Never shows badges like "LOW confidence" — confidence context is a sentence

### DONNA Floating Panel Rules

Accessible from the persistent floating button on every director page.

- Full conversation interface
- Voice input prominent (mic button)
- Suggestion chips (3 max, contextual to current page)
- Conversation history behind "View history" — not shown by default
- Source attribution shown inline: "Source: assessment submitted by Coach Marco, Jun 4"
- Actions available: approve/reject/navigate — all through the review pipeline

### DONNA Language Rules

| Prohibited | Required |
|---|---|
| "Based on available data..." | State the finding, qualify only if data is thin |
| "LOW confidence" badge | "Only 2 sessions recorded this month — signals may not be representative." |
| "I was unable to determine..." | "More session data needed before I can recommend this." |
| Listing 5+ items | One conclusion, one supporting fact |
| "Here are three things you could do" | "Do X. If that doesn't resolve it, ask me about Y." |
| "I'll adjust the threshold" | DONNA never claims to execute — always proposes |

### DONNA Domain Boundaries

**DONNA owns (speaks to):**
- Summarizing: collapses many signals into one sentence
- Prioritizing: ranks competing signals into one ordered action
- Explaining: says WHY a signal exists (with enough evidence to be specific)
- Recommending: says what to do next (one action, not a list)
- Guiding: says what comes after the current action

**UI owns (DONNA does not speak to):**
- Approval buttons and confirmation states
- Navigation links and route changes
- Status indicators (active, pending, on hold)
- Raw data tables and lists
- Audit trail records

### Removed DONNA Surfaces

| Removed | Replacement |
|---|---|
| `DonnaCOOStatusWrapper` persistent bar | Absorbed into Today DONNA brief |
| `DonnaDailyCOOBriefSurface` dismissible banner | Absorbed into Today DONNA brief |
| `DonnaAcademyCOOBriefCard` expanded by default | Absorbed into Today DONNA brief |
| `DonnaScreenBriefStatic` per-page context | Replaced by page-scoped inline brief |
| `DonnaProactiveBriefCard` overlay | Absorbed into Today DONNA brief |
| `DonnaHighlightBanner` guided overlay | Absorbed into DONNA conversational flow |
| `DonnaCommandSection` inline input bar | Floating DONNA panel owns this |
| `DonnaFirstGreeting` | Greeting is Zone 1 identity bar; DONNA brief is Zone 2 |

**Net result: 8 concurrent DONNA surfaces → 1 brief + 1 floating panel**

---

## 6. Final Academy Health Experience

**Question this page answers:** How is my academy actually doing?
**Target:** Director understands full academy health in 30 seconds. Every number is explained and sourced.

### Above the Fold

```
← Today    ACADEMY HEALTH                         Score: 7.2 / 10
                                    Updated: Jun 5, 2026  9:00am

┌─────────────────────────────────────────────────────────────────────────┐
│ DONNA                                                                   │
│                                                                         │
│ Review & Approval is your biggest gap today — 5 items are more than    │
│ 3 days old. That's the only section below 7.0.                         │
│                                                    [Go to Approvals →]  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Health Sections (all visible on one scroll)

```
✓  CURRICULUM HEALTH                               8.5 / 10
   Based on: gate coverage, drill count, coach language, track requirements
   • Orange Ball 2 gate coverage: 45% ⚠
   • All other levels: B or higher
                                       [View curriculum]  [Ask DONNA →]

✓  PLAYER PROGRESS                                 7.0 / 10
   Based on: stall detection, advancement eligibility, reassessment status
   • 3 players stalled (6+ months, not advancement-eligible)
   • 2 players ready for advancement
   • 1 reassessment overdue
                                          [View players]  [Ask DONNA →]

⚠  REVIEW & APPROVAL                               6.0 / 10
   Based on: pending item age, item count, queue depth
   • 5 items pending · oldest: 4 days old
   • Target: all items reviewed within 2 days
                                         [Review now]     [Ask DONNA →]

✓  COACH EXECUTION                                 8.0 / 10
   Based on: recap completion rate (30 days), wrap-up coverage
   • Recap rate: 82% (last 30 days)
   • 1 session missing recap (Tuesday, Orange Ball 2)
                                         [View coaches]   [Ask DONNA →]

✓  PARENT COMMUNICATION                            7.5 / 10
   Based on: pending parent updates, update age, response rate
   • 2 parent updates pending director approval
                                         [View updates]   [Ask DONNA →]

✓  ONBOARDING                                      9.0 / 10
   Based on: setup completion checklist, academy DNA, live status
   • Academy is live: players, curriculum, templates, sessions active
                                          [View setup]    [Ask DONNA →]

(Score confidence: partial — assessment and mission data not yet tracked)
```

### Data Honesty Rules on Academy Health

- Every score shows its basis in plain language ("Based on: gate coverage, drill count...")
- Score confidence caveat shown when data dimensions are incomplete
- No sparkline chart unless backed by real time-series data (30+ days of sessions minimum)
- No fabricated trend charts
- "Ask DONNA →" on each section opens the floating DONNA panel scoped to that section

### What This Page Replaces

- `/director/kpi` route
- "Academy Metrics" collapsed dashboard section
- "Analytics" collapsed dashboard section
- `AcademyHealthBadgeWithDrawer` as the canonical health surface (badge remains in identity bar as shortcut; this page is the canonical home)
- `DirectorTodayKpiSection` (7 KPI tiles)
- `AcademyKpiCardsSection`
- `DirectorKpiHealthSection`

---

## 7. Final Players Page

**Question this page answers:** Which players need my attention today?

### Above the Fold

```
PLAYERS

┌─────────────────────────────────────────────────────────────────────────┐
│ DONNA                                                                   │
│                                                                         │
│ 3 players need your attention this week. Lucas has been stalled for     │
│ 8 months. Ana's reassessment is overdue.                               │
│                                                   [View Lucas →]        │
└─────────────────────────────────────────────────────────────────────────┘

[Sort: Needs Attention ▼]   [Search...]   [Filter by level]

• Lucas Santos  ——  ⚠ Stalled 8 months · Orange Ball 2        [→]
• Ana Lima      ——  🔄 Reassessment due · Green Ball 1         [→]
• Marcus Chen   ——  ✓ Ready to advance · Orange Ball 1         [→]
────────────────────────────────────────────────────────────────────
  [remaining players — lower priority, standard listing]
```

### Sorting

- Default: **Priority sort** (DONNA-ranked by attention score)
- Options: Alphabetical, by level, by status
- Priority sort label: "Needs Attention" — matches director intent

### Player Profile Page (abbreviated — existing implementation extended)

Above fold on player profile:
```
DONNA: "Lucas has been in Orange Ball 2 for 8 months. His forehand gate
is the blocker. 2 options: schedule a focused assessment or move him to
an intensive group."

[Schedule assessment]   [Move to intensive]   [Draft parent update]
```

Then: Level status card + gate progress bars (both visible above fold on desktop)
Then: Tab navigation — Overview · Development · Sessions · Notes · Parent

---

## 8. Final Naming Conventions

### Navigation Labels

| Current Label | Final Label | Reason |
|---|---|---|
| Today | Today | Acceptable — matches daily mental model |
| Approvals | Removed from primary nav | Merged into Today |
| Players | Players | Acceptable |
| Curriculum | Curriculum → `/director/curriculum` (health, not builder) | Destination fixed |
| Sessions | Sessions | Acceptable |
| Academy Health | Academy Health | Acceptable — clear |
| Parent Updates | Removed from primary nav | DONNA surfaces proactively |
| Templates | Inside Sessions + gear | Templates serve sessions |
| Coaches | Gear menu | Configuration |
| Assessment Template | Gear menu | Configuration |
| Onboarding | Gear menu | Post-setup |

### Page Titles

| Page | Title |
|---|---|
| `/director` | "Today" (or just the greeting line — no H1 needed) |
| `/director/curriculum` | "Curriculum Command Center" |
| `/director/health` | "Academy Health" |
| `/director/review` | "Review & Decide" |
| `/director/players` | "Players" |

### Section Labels (replace vague labels)

| Current Label | Final Label |
|---|---|
| "Approvals" (sidebar) | "Review & Decide" |
| "Analytics" (collapsed section) | Removed → Academy Health page |
| "Academy Metrics" (collapsed section) | Removed → Academy Health page |
| "Alerts & Placement" (collapsed section) | Removed → DONNA brief + Zone 3 |
| "Quick Actions" (collapsed section) | Removed → sidebar already has these |
| "AI Suggestions" | "DONNA Recommendations" |
| "LOW confidence" badge | Human language: "Early signal — data growing" |
| DonnaDailyCOOBriefSurface | "DONNA" (in UI; internal name doesn't matter) |

### Drilldown Labels (must include counts)

| Pattern | Example |
|---|---|
| Sessions this week (N) | "Sessions this week (4)" |
| Players needing attention (N) | "Players needing attention (2)" |
| Curriculum gaps (N) | "Curriculum gaps (3)" |
| Pending improvements (N) | "Pending improvements (3)" |
| Curriculum levels (N) | "Curriculum levels (14)" |

Zero-count sections are **hidden entirely** — not shown as "(0)".

---

## 9. Final Mobile Rules

### Navigation: Bottom Tab Bar

```
[Today]  [Players]  [Curriculum]  [Health]  [DONNA]
```

No sidebar on mobile. Five tabs only.

### Layout: Single Column, Full Width

- All content: single column, `max-w-2xl mx-auto p-4`
- No split panes on mobile
- No horizontal scroll (except stage cards on curriculum — explicit horizontal scroll with scroll indicator)

### Above the Fold on Mobile (375px viewport)

**Today mobile:** DONNA brief card (full width) → must be visible without scroll.
**Curriculum mobile:** DONNA brief (collapsed to 1 line with expand control) + Most Blocked Level card → visible without scroll.
**Player Profile mobile:** DONNA brief → Level status → Gate progress bars (horizontal). Actions in sticky bottom bar.

### DONNA on Mobile

Full-screen chat interface. Voice input button prominent. Suggestion chips in horizontal scroll. No inline brief card — tap the DONNA tab to access.

### Touch Targets

All interactive elements minimum 44×44px. Approve/Reject buttons minimum 80px wide with 8px gap between them.

### Sticky Bottom Bar on Action Pages

Player profile, level detail, and wrap-up review pages use a sticky bottom bar for primary actions on mobile. No actions are hidden below the fold on mobile.

---

## 10. Final Zero-Scroll Rules

### Definition

"Above the fold" = visible on a 1280×800 desktop viewport at 100% zoom without scrolling.
"Above the fold mobile" = visible on a 375×667 viewport without scrolling.

### Desktop Requirements by Page

| Page | Must be above fold |
|---|---|
| Today | Identity bar + DONNA brief + Top 3 priorities + Approvals banner |
| Curriculum Command Center | Page identity + DONNA brief + Most Blocked Level card + Health strip + at least 2 priority items |
| Academy Health | Page identity + DONNA brief + at least 3 health sections |
| Players | DONNA brief + first 3-4 priority players |
| Player Profile | DONNA brief + Level status card + Gate progress |

### Mobile Requirements by Page

| Page | Must be above fold (375px) |
|---|---|
| Today | Identity bar + DONNA brief + Top 3 priorities |
| Curriculum | DONNA brief (collapsed 1 line) + Most Blocked Level card |
| Player Profile | DONNA brief + Level status |

### What May Require Scrolling (this is acceptable)

- Academy Health section 4–6 on desktop
- Approval item list on Today (showing 2 above fold, rest on scroll)
- Sessions grid on Today
- Level detail gates, players, linked template
- Any drilldown content

### Scroll Prohibitions

- DONNA brief must never require scrolling to reach on any page
- Primary CTA (the one lime button) must never require scrolling on desktop
- The most important number on the page (health score, stall count, pending count) must never require scrolling

---

## 11. Final Implementation Order

This is the exact sequence. Do not jump phases.

### Phase A — Remove Dead Code and Trust Violations (1–2 sprints, zero user-visible risk)

1. Delete `DirectorTodayCommandCenter.tsx` — already replaced, dead code
2. Delete `DonnaDashboardOpenCard.tsx` — already replaced, dead code
3. Remove `CurriculumBuilderWelcome` component from curriculum page
4. Remove "Curriculum Connections" static section from curriculum page
5. Remove static sparkline `AcademyHealthChartCard` — replace with honest message: "Historical trend chart available after 30+ days of session data."
6. Remove "Quick Actions" collapsible section from dashboard

**Acceptance:** No TypeScript errors. No visible UX change to director (these are dead/minor elements).

---

### Phase B — Fix Navigation Destinations (3–5 sprints, low risk)

7. Update SidebarNav "Curriculum" href: `/director/curriculum/builder` → `/director/curriculum`
8. Update curriculum page default view to health (not builder) — builder accessible via [Builder] tab
9. Add [Improve this level] button to every curriculum level card → links to `?improve=[levelKey]`
10. Rename sidebar "Approvals" → "Review & Decide"
11. Fix `/director/today` vs `/director` navigational confusion — one canonical "Today" destination

**Acceptance:** 10-second test on curriculum page passes. Sidebar destinations match their labels.

---

### Phase C — Curriculum Command Center (5–8 sprints, medium)

12. Replace curriculum page layout with Command Center structure (Zones 1–8)
13. Promote `CurriculumIntelligenceCard` data to hero Zone 3 (Most Blocked Level card)
14. Replace full `CurriculumHealthPanel` above fold with compact health strip (Zone 4)
15. Build top curriculum priorities list (Zone 5) from `buildCurriculumAttentionRanking`
16. Move level tree to Zone 7 (collapsed drilldown)
17. Move curriculum tools to Zone 8 (collapsed, bottom)
18. Hide setup checklist when all items complete

**Acceptance:** Above-fold shows DONNA brief + Most Blocked Level + health strip + 2+ priorities without scrolling. 10-second test passes.

---

### Phase D — Director Today Redesign (5–8 sprints, medium)

19. Replace `DonnaAcademyCOOBriefCard` (expanded) with single DONNA brief card (2 sentences, 1 CTA)
20. Replace `DirectorPrimaryActionHero` with Top 3 Priorities list (Zone 3)
21. Remove `DonnaScreenBriefStatic` inline card
22. Remove "Alerts & Placement" collapsible section
23. Move `DirectorTodayKpiSection` to Academy Health page
24. Move "Analytics" and "Academy Metrics" sections to Academy Health page
25. Move Academy Setup section to gear menu / onboarding route (hidden post-setup)
26. Build Zone 4 approvals banner (conditional, single line)
27. Clean sessions section to 2×2 grid with new session / calendar links

**Acceptance:** Director Today passes 10-second test. Above fold: identity bar + DONNA brief + priorities + approvals banner. DONNA surface count on page: 1.

---

### Phase E — Sidebar Simplification (3–5 sprints, medium)

28. Move "Coaches" to gear menu
29. Move "Assessment Template" to gear menu
30. Move "Onboarding" to gear menu
31. Consolidate "Parent Updates" — surface via Today approvals + DONNA proactive; remove from primary sidebar
32. Move "Templates" inside Sessions and Curriculum (remove as standalone primary item)
33. Build gear menu dropdown with all moved items

**Acceptance:** Sidebar has ≤ 6 items (5 + gear). No functionality removed — all items accessible via gear menu.

---

### Phase F — Academy Health Consolidation (3–5 sprints, medium)

34. Create or confirm `/director/health` as canonical Academy Health route
35. Consolidate `DirectorTodayKpiSection` + `AcademyKpiCardsSection` + `DirectorKpiHealthSection` into single Academy Health page
36. Add source labels to every score section
37. Add score confidence caveat when data is partial
38. Wire `[Ask DONNA →]` per section to open floating panel scoped to section
39. Remove `AcademyHealthBadgeWithDrawer` as full surface — retain identity bar badge only

**Acceptance:** One canonical health destination. All KPI surfaces consolidated. Every score has source label.

---

### Phase G — DONNA Surface Unification (10–15 sprints, high)

40. Remove `DonnaCOOStatusWrapper` from director layout
41. Remove `DonnaDailyCOOBriefSurface` from director layout
42. Remove `DonnaProactiveBriefCard` overlay
43. Remove `DonnaHighlightBanner` overlay
44. `DonnaCommandSection` removed from dashboard — command input lives in floating panel only
45. Verify `DonnaAssistantButton` (floating) is the sole persistent DONNA surface
46. Verify `DonnaWakeWordLayer` is opt-in and does not add visual chrome
47. Ensure each page has exactly one in-page DONNA brief block

**Acceptance:** DONNA surface count ≤ 2 on any director page (inline brief + floating button). All 8 legacy surfaces removed or absorbed.

---

### Phase H — Mobile + Polish (5–10 sprints)

48. Build bottom tab nav for mobile (Today / Players / Curriculum / Health / DONNA)
49. Verify all 6 core pages pass above-fold mobile requirement
50. Add sticky bottom bars for action pages on mobile
51. Stage card horizontal scroll on curriculum mobile
52. DONNA full-screen chat on mobile DONNA tab
53. First-run onboarding flow narrated by DONNA (replaces setup checklist on dashboard)

---

## Implementation Acceptance Checklist

All items must be true before "UX Reimagination Complete" is declared:

- [ ] Director Today has ≤ 4 primary sections above fold
- [ ] DONNA brief is the first element on every director page
- [ ] Curriculum health is the default curriculum view
- [ ] "Improve this level" button exists on every level card (no URL hack required)
- [ ] Sidebar has ≤ 6 items (5 + gear)
- [ ] DONNA surfaces: ≤ 2 active per page (inline brief + floating button)
- [ ] Static sparkline removed entirely
- [ ] No "LOW confidence" or "based on available data" language in DONNA
- [ ] Setup checklist not on main dashboard
- [ ] Director Today 10-second test: PASS
- [ ] Curriculum Command Center 10-second test: PASS
- [ ] Every score on Academy Health has a source label
- [ ] Score confidence caveat shown when data is partial
- [ ] Zero pending wrap-ups count appears once (not 5 times) on dashboard
- [ ] No fabricated data presented as real data
- [ ] Mobile bottom tab nav implemented
- [ ] All 6 core pages pass mobile above-fold requirement

---

## What This Blueprint Does Not Change

Every capability built across 2000+ sprints is preserved:

- Attention ranking engine and all its signals
- Academy health scoring (6 sections, honest sourcing)
- Curriculum bottleneck detection
- Proposed actions pipeline (AI proposes → director approves → system records → system executes)
- DONNA reasoning engine (16-step orchestration, goal continuity, COO guidance)
- Coach wrap-up intelligence
- Parent communication safety layer
- Voice capability and TTS pipeline
- All 83 confirmed live migrations
- `database.types.ts` (no changes)
- All `src/lib/` intelligence modules

This is a surface redesign. The information is reorganized. The workflows are simplified. The UI gets out of the way of the intelligence.

---

## Closing Rule

> The best interface for a system with world-class intelligence is the one where the intelligence is what you notice first.

Every sprint that touches director UX must answer: does this change make DONNA's intelligence more or less visible? If less visible, do not ship it.
