# AcademyOS Scroll Audit V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Purpose:** Measure scroll depth and information density for every major page.

---

## Scoring Scale

| Score | Meaning |
|---|---|
| 0 | No scroll needed — all key information and the primary action are above the fold |
| 1 | Small scroll acceptable — 1-2 card heights to reach full context |
| 2 | Moderate scroll — 3-4 card heights; secondary actions require scrolling |
| 3 | Excessive scroll — director must scroll to find what they came for |
| 4 | Dashboard wall — so much content that the director will miss items |
| 5 | User overwhelmed — content cannot be processed in a single visit |

**Above the fold definition (desktop):** ~720px viewport height, minus 60px for nav = ~660px of usable content.
**Above the fold definition (mobile):** ~680px viewport height, minus 56px BottomTabBar = ~624px of usable content.

---

## Director Pages

### `/director` — Dashboard

**Scroll score: 4 (dashboard wall)**

**What is above the fold (~660px):**
- Hero header: greeting + date + academy name + 3 link chips + Academy Health badge (~120px)
- DonnaFirstGreeting card (~80px)
- DonnaScreenBriefStatic (~60px)
- DonnaAcademyCOOBriefCard expanded (~200px)
- Part of DonnaCommandSection (~80px)

**Total above fold:** ~540px used by DONNA surfaces alone. The first actual data card (Primary Action Hero) is below the fold.

**What requires scrolling:**
- DirectorPrimaryActionHero (primary call to action) — requires ~80px scroll
- DirectorTodayKpiSection (7 KPI tiles) — requires ~300px scroll
- Collapsible sections (Sessions, Quick Actions, Metrics, Alerts, Analytics, Setup) — hundreds of pixels more

**Time-to-first-action estimate:** 8-15 seconds (must scroll to find the primary action)

**Unnecessary vertical stacking:**
- 3 DONNA surfaces stacked vertically (greeting → brief → COO brief → command section)
- Could be 1 surface with the same information

**Above-the-fold decisions:** 0 (no actionable content above fold — DONNA surfaces are context, not decisions)

**Content DONNA should summarize instead of showing:**
- The 7 KPI tiles → DONNA: "3 items need attention today"
- The Academy Health badge details → DONNA: "Academy health is 72%"
- The alert breakdown → DONNA: "You have 2 urgent alerts"

**Recommendation:** Director should see their primary action within 1 scroll or zero scrolls. Move Primary Action Hero to the top. Collapse all DONNA to 1 surface.

---

### `/director/today` — Today's Academy

**Scroll score: 1 (small scroll acceptable)**

**What is above the fold:**
- Back link
- Header (Operating View / Today's Academy / date)
- Pending wrap-ups notice (when present)
- 4-stat strip (Sessions Today / Completed / Pending Review / Risk Flags)
- Start of Today's Sessions list

**Above-the-fold decisions:** 1 — the stat strip shows the key numbers immediately. Pending wrap-up notice appears prominently when present.

**What requires scrolling:**
- Full session list (if more than 2-3 sessions)
- DONNA Priority Brief (right column on desktop — visible without scroll on desktop, requires scroll on mobile)
- Player Attention Risk (right column)
- DONNA suggestion chips
- Risk flags card
- Quick actions

**Unnecessary vertical stacking:**
- DONNA suggestion chips (6 chips stacked vertically) — could be a horizontal chip row
- Quick actions links (4 items stacked) — could be collapsed

**Content DONNA should summarize instead of showing:**
- 6 DONNA suggestion chips → 1 "Ask DONNA" button that opens the suggestion chips on tap

**Recommendation:** This page is well-designed. Move DONNA suggestion chips to a collapsed section. This page should BE the dashboard landing.

---

### `/director/review` — Approvals

**Scroll score: 3 (excessive scroll)**

**What is above the fold:**
- Back link
- Page header
- DONNA Review Brief panel (when items exist) — ~150px
- DONNA Command Section — ~80px
- Tab bar (4 tabs) — ~48px
- DONNA Review Tab Guide (per-tab chips) — ~80px
- First card in the active tab

**What requires scrolling:**
- All cards except the first
- The actual decision controls (approve/reject) on each card — often below fold for tall cards
- Multiple cards in sequence

**Above-the-fold decisions:** 0 — the first card is partially visible but the approve/reject buttons are typically below fold.

**Unnecessary vertical stacking:**
- DONNA Review Brief + DONNA Command Section before the tab content = ~230px of DONNA overhead that pushes all cards down
- Each card has a header → context → decision controls structure — the context section can be very tall for wrap-up recaps

**Information density:**
- Wrap-up cards show: session name, coach, date, block-by-block summary, attendance summary, will/won't change, raw transcript excerpt. Very dense.
- Voice intake cards show: intent, confidence, entity extracts, raw transcript, risk flags. Very dense.

**Content DONNA should summarize instead of showing:**
- Per-card details → DONNA: "This wrap-up covers 45-minute Orange 2 session. Coach flagged 2 players. Recommendation: approve."
- The decision should be 1 click, not reading a full card.

**Recommendation:** DONNA should pre-read each card and give a 1-line summary + recommendation. Director confirms or overrides. This removes the need to scroll through long card content.

---

### `/director/players` — Players Directory

**Scroll score: 2 (moderate scroll)**

**What is above the fold:**
- DONNA Players Presence CTA
- DONNA Screen Brief
- DONNA Command Section
- Action buttons (Import / Add / Development Intake)
- Search bar
- First few rows of the players list

**Above-the-fold decisions:** 1 — search bar is above fold. First players visible.

**What requires scrolling:**
- Rest of the player list
- Players with critical status flags (sorted to top, but still may require scroll for 20+ player rosters)

**Unnecessary vertical stacking:**
- 3 DONNA surfaces = ~300px of DONNA content before the actual list
- A 30-player roster requires significant scrolling

**Content DONNA should summarize instead of showing:**
- DonnaPlayersPresenceCTA → DONNA brief does this more concisely

**Recommendation:** Collapse DONNA to DonnaScreenBriefStatic only (~60px). This brings the player list ~200px higher.

---

### `/director/players/[playerId]` — Player Profile

**Scroll score: 2-3 (moderate to excessive, tab-dependent)**

**What is above the fold:**
- Player header (name, level, status, avatar)
- Tab bar (5 tabs)
- Start of Overview tab content

**Per-tab scroll depth:**

**Overview tab:**
- Shows IDP preview, curriculum state, key metrics — moderate scroll
- Score: 2

**Skill Path tab:**
- Shows level info, gates, drills, Q&A preview — high scroll
- Score: 3

**Competition tab:**
- Shows UTR, competition history, assessment data — high scroll if populated
- Score: 2-3

**Fitness/Load tab:**
- Attendance sparkline, fitness context — low scroll
- Score: 1

**Notes tab:**
- Voice notes, coach observations — scrolls with history
- Score: 2

**Above-the-fold decisions:**
- None on landing. Director must read the Overview to understand what action is needed.
- The most important fact about the player (current risk / urgency) is not surfaced prominently.

**Content DONNA should summarize instead of showing:**
- Everything in the Overview tab → DONNA 2-sentence brief
- Gate evidence counts → DONNA: "Player needs 3 more observed backhands before gate clears"
- Assessment history → DONNA: "Last assessed 4 months ago — overdue"

---

### `/director/sessions/[sessionId]` — Session Detail

**Scroll score: 4 (dashboard wall)**

**What is above the fold:**
- Session header (name, date, status, coach)
- DirectorSessionStatusCTA
- Start of first content panel

**Panels visible after scrolling:**
1. Session Block Curriculum Content
2. Session Actual Display
3. Recap Summary
4. Structured Draft View
5. Attendance Exception Draft Panel
6. Class Roster Intelligence Panel
7. Group Assignment Panel
8. Session Adjustment Suggestions
9. Planned vs Actual Diff Panel
10. Session Exposure Summary Panel
11. Session Coach Brief CTA

**Above-the-fold decisions:** 1 — status CTA. Everything else requires scroll.

**Unnecessary vertical stacking:**
- Most panels will be empty for most sessions (no recap, no exceptions, no adjustment suggestions). Yet they all render as visible sections with headers, creating ghost sections the director scrolls past.

**Content DONNA should summarize instead of showing:**
- "Session is completed. Wrap-up submitted by Coach Maria. 1 attendance exception flagged. No curriculum drift. All blocks executed."
- This replaces 9 of the 11 panels for a typical completed session.

**Recommendation:** Massive simplification opportunity. Show DONNA brief + status + 1-2 active panels. Everything else hidden unless DONNA or director calls it.

---

### `/director/curriculum` — Curriculum

**Scroll score: 3 (excessive scroll)**

**What is above the fold:**
- Header
- DONNA curriculum context panel
- Start of level tree (may show 1-2 stages)

**What requires scrolling:**
- All 5 curriculum stages (Red → Orange → Green → Yellow → High Performance)
- Each stage has 3-5 levels
- Each level expands to show content types, drills, gaps
- Health panel
- Voice override panel

**Above-the-fold decisions:** 0 — director must scroll to find a specific level or gap.

**Information density:** VERY HIGH
- Level tree renders the full curriculum structure simultaneously
- Each drill node has 10+ fields visible in the drawer
- The gap analysis and health panel add another layer of summary data

**Recommendation:** Curriculum needs a landing state that shows: (1) DONNA brief on gaps, (2) Stage health overview (5 dots), (3) drill-down on demand. Not the full tree on load.

---

### `/director/kpi` — Academy Health

**Scroll score: 3 (excessive scroll)**

**What is above the fold:**
- Page header
- Start of KPI grid

**What requires scrolling:**
- 12 KPI tiles across multiple rows
- DONNA explainer for each KPI (appears on interaction)
- Attendance trend data
- Development velocity data

**Above-the-fold decisions:** 0 — the tiles are informational, not decision-triggering

**Content DONNA should summarize instead of showing:**
- 12 KPI tiles → DONNA: "Academy score: 78%. The 2 metrics pulling it down are Wrap-Up Rate (42%) and Players Without Level (12%). [Drill into these]."
- Everything else is supporting data

---

### `/director/donna` — DONNA Page

**Scroll score: 4 (dashboard wall)**

**What is above the fold:**
- Page header
- Attention items card (first few items)

**The DONNA chat interface (DonnaDirectorShellClient) position:**
- After attention items → after risks → after recommended actions → after context summary → after entity summaries → after intelligence signals card
- Estimated pixel depth: 1200-1800px below the fold on a typical viewport

**Above-the-fold decisions:** 0 (attention items are informational)

**This is the most critical scroll problem in the entire app.** DONNA's primary value is the ability to talk to it. That interface is buried at the bottom of a page that looks like a dashboard. A director who wants to ask DONNA a question must scroll past 6 data panels to find the input.

**Recommendation:** The chat shell must be the first interactive element on the page. Context panels (attention, risks) should be collapsed drawers that DONNA references inline.

---

## Coach Pages

### `/coach` — Coach Home

**Scroll score: 2 (moderate scroll)**

**What is above the fold:**
- DONNA brief
- On-court actions bar
- Daily brief card
- Start of session list

**Content requiring scroll:**
- Full session list (if many sessions)
- Recent observations section

**Above-the-fold decisions:** 1 — the first session (today's most relevant) should be visible and tappable.

**Recommendation:** Good mobile design. Keep DONNA brief short. If no sessions today, show an empty state with next session date.

---

### `/coach/sessions/[sessionId]` — Session (Execution View)

**Scroll score: 2-3 (moderate to excessive)**

**What is above the fold:**
- Session header
- First 2-3 blocks in the execution list

**Content requiring scroll:**
- All blocks after the first 2-3
- Curriculum context panel (below blocks)
- Gap brief panel
- Wrap-up drawer trigger button

**The wrap-up trigger is at the bottom of a long block list.** A coach who has run 8-10 blocks must scroll past all of them to reach the "Start Wrap-Up" action.

**Recommendation:** Sticky "Start Wrap-Up" CTA at the bottom of the viewport when the session is in progress. Should not require scrolling to find.

---

## Player Pages

### `/player` — Player Home

**Scroll score: 3 (excessive scroll for target audience)**

**What is above the fold (mobile):**
- PlayerHomeHeroCard (level + progress ring + name)
- Start of first section

**What requires scrolling:**
- Assigned missions
- Mission preview
- Development focus
- Attendance sparkline
- Recent session history
- Badge report / next badge to earn

**Target audience:** Players aged 8-18. The above-fold should be 1 thing: "Here is your mission today."

**Content DONNA should summarize instead of showing:**
- Progress ring + level + sparkline → "You're making progress! You've been to 8 sessions this month."
- Everything else → drill-down pages

**Recommendation:** Player home should be: hero card (level + mission) + one CTA (View All Missions). Full stop. Maximum 2 elements before scroll.

---

### `/parent` — Parent Home

**Scroll score: 3 (excessive for a parent checking in)**

**What is above the fold (mobile):**
- Child switcher (if multi-child)
- Start of IDP parent view

**What requires scrolling:**
- Full development plan
- Progress preview
- Attendance stats
- Parent support guide
- Lesson request card
- Updates section

**A parent checking in to see how their child is doing must scroll through their child's development plan, progress indicators, attendance history, and support guidance before reaching any updates from the academy.**

**Recommendation:** Parent home should answer "How is my child doing?" in the first card, then show the most recent update from the academy. Everything else is a tap away.

---

## Summary: Scroll Scores

| Page | Score | Primary Issue |
|---|---|---|
| `/director` | 4 | DONNA surfaces push primary action below fold |
| `/director/today` | 1 | Well-designed — minor improvement possible |
| `/director/review` | 3 | DONNA overhead pushes cards below fold |
| `/director/players` | 2 | 3 DONNA surfaces add ~300px before list |
| `/director/players/[id]` | 2-3 | Tab content varies; no DONNA brief to orient |
| `/director/sessions/[id]` | 4 | 11 panels, most empty, all visible |
| `/director/curriculum` | 3 | Full tree loads immediately without orientation |
| `/director/kpi` | 3 | 12 tiles, no headline |
| `/director/donna` | 4 | Chat interface buried under 6 data panels |
| `/coach` | 2 | Good mobile design |
| `/coach/sessions/[id]` | 2-3 | Wrap-up CTA buried below block list |
| `/player` | 3 | Too many sections for young users |
| `/parent` | 3 | Updates buried under development plan |

**Pages that need immediate scroll reduction:**
1. `/director/donna` — CRITICAL (chat buried)
2. `/director` — HIGH (no action above fold)
3. `/director/sessions/[id]` — HIGH (11 panels)
4. `/director/review` — HIGH (DONNA overhead)
5. `/player` — HIGH (wrong UX for target age)
