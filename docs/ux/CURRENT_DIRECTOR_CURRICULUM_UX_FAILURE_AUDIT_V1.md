# Current Director + Curriculum UX Failure Audit V1

**Date:** 2026-06-05
**Scope:** `/director` (homepage) + `/director/curriculum`
**Method:** Full source audit of `src/app/director/page.tsx` and `src/app/director/curriculum/page.tsx`
**Purpose:** Identify the specific UX failures before redesigning.

---

## Director Homepage — Failure Inventory

### F1 — Four competing DONNA surfaces stacked above the fold

The page renders four separate DONNA UI elements before the director sees any actionable data:

1. `DonnaFirstGreeting` — greeting with summary counts
2. `DonnaScreenBriefStatic` — 1-sentence brief with CTA
3. `DonnaAcademyCOOBriefCard` — full COO attention report (expanded by default)
4. `DonnaCommandSection` — command input

**Problem:** Each says a version of "here is what matters today." They do not build on each other — they compete. The director reads the same signal four times in different words. This destroys trust and creates confusion about which DONNA surface is authoritative.

**Category:** DONNA/UI overlap, cognitive load, dashboard wall

---

### F2 — `pendingWrapUpsCount` rendered five times on one page

The number of pending wrap-ups appears in:
- `DonnaFirstGreeting` (pendingWrapUps)
- `DonnaScreenBriefStatic` (constitutionBrief)
- `DirectorPrimaryActionHero` (pendingReviewCount)
- `DirectorTodayKpiSection` (attendanceExceptions, coachRecapsMissing)
- `AcademyAlertsPanel` (pendingWrapUpsCount)

**Problem:** The director cannot trust any individual surface. "Which 3 is the right 3?" They learn to ignore repeated signals, which is exactly opposite of urgency.

**Category:** Duplicated cards, cognitive load

---

### F3 — Actionable content is hidden behind closed accordions

Everything the director would actually act on is inside a `CollapsibleSection` that starts closed:

- Sessions This Week (closed)
- Quick Actions (closed)
- Academy Metrics (closed)
- Alerts & Placement (closed)
- Analytics (closed)

The page above the fold shows only: greeting text + 4 DONNA surfaces + 1 primary hero card. All the data requires clicking to expand. But the director doesn't know what's behind each accordion without opening it.

**Problem:** The director's attention has to scan 9 zones to understand what matters. The accordion pattern hides signal behind interaction.

**Category:** Unnecessary scrolling, unclear primary actions, intelligence hidden as data

---

### F4 — Quick Actions buried in a collapsible section

The primary navigation shortcuts (Players, Sessions, Today's Academy, Signals) are inside a closed accordion at the bottom of the action stack. A director who wants to navigate to Players has to expand a "Quick Actions" accordion to get there.

**Problem:** Navigation should never be hidden. Quick actions should be first-class surface elements.

**Category:** Unclear primary actions, unnecessary scrolling

---

### F5 — Academy Health sparkline uses fabricated data

`AcademyHealthChartCard` generates 7 "static data points representing the week — derived from healthPct for visual coherence." This is explicitly fake. The sparkline is not based on real historical health data — it's a visual decoration shaped around today's single value.

**Problem:** A director who trusts the sparkline is trusting invented data. This is a trust violation. Displaying fabricated trends as real trends violates the AcademyOS trust standard.

**Category:** Intelligence hidden as data, misleading UI, trust violation

---

### F6 — "Academy Setup" section placed last

For a new academy (no players, no templates, no sessions), setup is the most important thing on the page. But the Academy Setup section (`DirectorContinueSetupPanel`) is the last section — after 5 accordion sections, after the hero, after all DONNA surfaces.

**Problem:** A new director opens the app and sees a full page of DONNA cards, KPI tiles, and empty accordions — before reaching the one section that tells them what to do next.

**Category:** Unclear primary actions, wrong hierarchy

---

### F7 — Vague section labels

- "Alerts & Placement" — what does this mean? Placement of what?
- "Analytics" — a director doesn't think of themselves as doing analytics
- "Academy Metrics" — also generic; doesn't tell you what you'll find
- "Live Activity" — implies real-time but shows mostly static data

**Problem:** The director must open each section to discover its contents. Good labels communicate value without requiring the open action.

**Category:** Vague labels, cognitive load

---

### F8 — Director Primary Action Hero competes with DONNA COO Brief

Both `DirectorPrimaryActionHero` and `DonnaAcademyCOOBriefCard` claim to show "the most important thing right now." The hero shows attentionQueue + pendingReviewCount. The COO brief shows cooAttentionReport. These are computed from the same signals but presented as separate surfaces.

**Problem:** Two "primary action" surfaces means neither is truly primary. A director cannot tell which one to act on first.

**Category:** DONNA/UI overlap, unclear primary actions

---

### F9 — KPI section is buried below intelligence layer

`DirectorTodayKpiSection` (7 KPI tiles) appears after all 4 DONNA surfaces and the primary action hero. KPIs should contextualize the day, but they're so far down the page that most directors won't see them during a quick check-in.

**Problem:** The KPIs that explain WHY something is wrong appear below the CTA that asks you to fix it. You're asked to act before understanding.

**Category:** Information architecture, cognitive load

---

### F10 — "AI Suggestions" in the Alerts section

The AI Suggestions card (showing `pendingSuggestionsCount`) lives inside the collapsed "Alerts & Placement" accordion, next to the AcademyAlertsPanel. The director who expands "Alerts" is looking for urgent signals, not AI suggestions.

**Problem:** Mixing DONNA-generated suggestions with alerts conflates urgency signals with speculative recommendations. AI suggestions belong in a distinct flow.

**Category:** DONNA/UI overlap, unclear primary actions

---

### F11 — No above-fold answer to "what should I do first?"

Despite 9 content zones, the page never cleanly answers: "What is the single most important thing to do right now?"

The `constitutionBrief` attempts this, but it's one small sentence in a 1-sentence box — surrounded by competing DONNA surfaces that also claim primacy.

**Problem:** The operating principle "DONNA thinks, UI proves, director decides" is reversed. The UI is providing many weak signals instead of one strong decision surface.

**Category:** Unclear primary actions, cognitive load

---

## Curriculum Page — Failure Inventory

### C1 — Title says "Curriculum" twice

The eyebrow label AND the h1 both read "Curriculum." Neither adds context.

**Problem:** Doubles the visual weight of a generic label. Should communicate what this page does, not just name it.

**Category:** Vague labels

---

### C2 — CurriculumIntelligenceCard is buried at position 4

The most valuable piece of content on the page — the most blocked level, stall count, and improvement action — appears at scroll position 4:

1. Header
2. DONNA welcome (CurriculumBuilderWelcome)
3. Status hero card
4. **CurriculumIntelligenceCard** ← the intelligence

**Problem:** The director must scroll past orientation content and a status card before seeing the one intelligence item that tells them what the curriculum actually needs.

**Category:** Intelligence hidden as data, unnecessary scrolling

---

### C3 — Status hero card doesn't surface problems

The status hero shows "Starter spine active — [version name]" and a "Next Recommended Action" text string. This is a green state indicator, not a problem surface.

**Problem:** On a healthy day, the status hero is a green dot with version info. The director who opens the curriculum page wants to know what's wrong — not that everything is fine. The intelligence is one scroll below.

**Category:** Intelligence hidden as data, vague labels

---

### C4 — Setup Status checklist persists post-setup

The 5-item checklist ("Curriculum starter selected, Level structure approved...") is prominent mid-page. Once all 5 items are checked, this section has no operational value. It's a setup artifact that never leaves.

**Problem:** A mature academy director sees a checklist of completed items on every visit. This is noise. Completed setup should be invisible or collapsed into a single "Setup complete" badge.

**Category:** Duplicated cards, cognitive load

---

### C5 — "Connected System" section is orientation content, not operational

4 cards explain what curriculum connects to: Players, Sessions, Coach Notes, Parent Progress. This is orientation content — useful in onboarding, not on a daily operations page.

**Problem:** A director who uses the curriculum page regularly doesn't need to be told that curriculum connects to players. This section never changes. It's static orientation masquerading as a page section.

**Category:** Unnecessary content, cognitive load

---

### C6 — "Next Recommended Actions" is a numbered list, not DONNA

3 text items like "Review level gates — confirm evidence requirements match your academy standards." These are instructional guidance strings — hardcoded, not derived from data.

**Problem:** DONNA should own recommendations. Hardcoded text recommendations are either obvious (everyone knows to review gates) or stale (they don't change based on actual academy state).

**Category:** DONNA/UI overlap, intelligence hidden as data

---

### C7 — Curriculum Spine section is reference material above the fold

5 stage cards (Red Ball through High Performance) with description text occupy a large section of vertical space. They describe what each stage is for — not what's happening at each stage now.

**Problem:** The director already knows what Red Ball and Orange Ball are. What they need to know is: which stage is struggling? Which level has stalled players? Descriptive reference content belongs in a drilldown, not above intelligence.

**Category:** Intelligence hidden as data, unnecessary scrolling

---

### C8 — Curriculum Health Panel is positioned mid-page

`CurriculumHealthPanel` (coverage report: gates, drills, coach cues, competition track, fitness, volume) appears after: header, DONNA welcome, status hero, intelligence card, and setup checklist.

**Problem:** Curriculum health is the primary signal for what needs improvement. It should be in the first visible zone.

**Category:** Intelligence hidden as data, wrong hierarchy

---

### C9 — "Curriculum Tools" navigation buried at the bottom

4 navigation links (Builder, Map, Guided Review, Learning Modules) are the final section. The director who wants to open the Builder must scroll to the very bottom.

**Problem:** Primary navigation should be near the top, not the bottom. Burying the Builder link means every visit starts with a scroll.

**Category:** Unclear primary actions, unnecessary scrolling

---

### C10 — DONNA welcome duplicates the status hero

`CurriculumBuilderWelcome` renders a DONNA greeting that explains the curriculum page. The status hero immediately below also explains curriculum status. Two onboarding-style elements compete for the top.

**Problem:** New users see orientation twice. Returning users see orientation on every visit.

**Category:** DONNA/UI overlap, duplicated cards

---

### C11 — No single above-fold answer to "where is my curriculum struggling?"

The page does not answer this question until scroll position 4 (CurriculumIntelligenceCard). Above that: title, DONNA welcome, status card, and setup checklist. None of these surfaces the curriculum problem.

**Problem:** The operating principle for curriculum — "DONNA tells you what's broken, UI proves it, director fixes it" — is not implemented. The broken level is hidden behind orientation content.

**Category:** Intelligence hidden as data, unclear primary actions

---

## Severity Summary

| ID | Failure | Severity |
|----|---------|----------|
| F1 | Four competing DONNA surfaces | Critical |
| F2 | pendingWrapUpsCount rendered 5× | High |
| F3 | Actions hidden behind closed accordions | Critical |
| F4 | Quick Actions in collapsed section | High |
| F5 | Fake sparkline data | High |
| F6 | Setup section placed last | Medium |
| F7 | Vague section labels | Medium |
| F8 | Two "primary action" surfaces | High |
| F9 | KPIs buried below DONNA | Medium |
| F10 | AI Suggestions inside Alerts | Medium |
| F11 | No clear "what to do first" | Critical |
| C1 | Title says Curriculum twice | Low |
| C2 | Intelligence buried at position 4 | Critical |
| C3 | Status hero hides problems | High |
| C4 | Setup checklist persists post-setup | Medium |
| C5 | Connected System is orientation content | Medium |
| C6 | Hardcoded recommendations instead of DONNA | High |
| C7 | Spine reference cards above intelligence | High |
| C8 | Health panel mid-page | Critical |
| C9 | Tools navigation at the bottom | High |
| C10 | DONNA welcome + status hero duplicate | Medium |
| C11 | No above-fold answer to "where is it struggling?" | Critical |
