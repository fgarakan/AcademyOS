# AcademyOS UX Constitution V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2101–2150
**Purpose:** Establish AcademyOS UX laws — enforceable principles that every sprint must pass before shipping.
**Authority:** These principles override feature requests, sprint velocity, and "we've always done it this way."

---

## Preamble

AcademyOS is built on a clear operating principle:

> DONNA thinks. The UI proves. The director decides.

The UX constitution enforces this principle at every layer. When a design decision is unclear, return to this document.

---

## Law 1 — One Primary Action Per Screen

Every screen has exactly one primary action — the thing the director should do next. It is the most visible element. All other actions are secondary.

**Enforcement:** If a screen has more than one lime-colored button or more than two prominent CTAs, it violates this law.

**Applies to:** Dashboard, review queue, player profile, curriculum page, any modal or drawer.

**Violation examples:**
- Dashboard today: 7 KPI tiles + DONNA brief + primary action hero + collapsible sections = no clear primary action
- Curriculum overview: stage cards + level tree + health panel + DONNA context = no clear entry point

**Compliant example:**
- Review queue item: `[Approve]` (lime, primary) + `[Reject]` (ghost) + `[Need Clarification]` (ghost) = one primary, two secondary

---

## Law 2 — Intelligence Before Data

DONNA's recommendation appears before the raw data that supports it.

A director reads: "3 players are stalled in Orange Ball 2."
THEN sees: The Orange Ball 2 level card with the coverage grade and enrollment count.

Never the reverse.

**Enforcement:** Any section that shows a count, a grade, or a metric must be preceded by a DONNA sentence explaining what that number means for the director today.

**Violation example:**
- `DirectorTodayKpiSection` shows 7 metric tiles with no DONNA context preceding them — director sees numbers without meaning.

**Compliant example:**
- Academy Health: "Review & Approval health is your biggest issue — 5 items over 3 days old." → KPI tiles below confirm with exact numbers.

---

## Law 3 — Recommendation Before Reporting

DONNA says what to do before showing why. Reports are available on demand, not by default.

**Enforcement:** No page should open with a data table or chart as the primary content without a recommendation surfaced first.

**Violation example:**
- Curriculum page opens with the level tree (data) before DONNA's recommendation about which level needs attention.

**Compliant example:**
- Curriculum page: DONNA brief → "Orange Ball 2 needs attention" → [See details] → level tree reveals with focus on Orange Ball 2.

---

## Law 4 — No Dashboard Walls

A "dashboard wall" is a page that shows more than 4 independent sections of information without a clear hierarchy. Dashboard walls cause scanning behavior and no action.

**Enforcement:** The main content area of any director page must have no more than 4 primary sections. If there are more, the extras are collapsed by default or accessed via DONNA.

**Violation example:**
- Director homepage today: DONNA brief + COO card + command section + primary hero + 7 KPI tiles + 5 collapsible sections + setup section = dashboard wall.

**Compliant example:**
- Director homepage: DONNA brief (1) + approval queue (2) + sessions this week (3) + [see everything else] link (4).

---

## Law 5 — No Unnecessary Scrolling

The director should not need to scroll to find the thing they need most. The answer is above the fold.

**Definition of "above the fold":** The viewport on a 1280×800 screen at 100% zoom without scrolling.

**Enforcement:** The primary action for the day is visible without scrolling. Supporting data (KPIs, alerts, analytics) is below the fold or collapsed.

**Violation example:**
- Director homepage: DONNA COO brief is expanded by default (pushing primary content below fold). Director must scroll past the brief to reach the action hero.

**Compliant example:**
- Director homepage: DONNA brief is collapsed to 2 lines by default ("3 things need attention today") with an expand control. Primary action is immediately visible.

---

## Law 6 — Above-the-Fold Answers Only

When a director opens a page, the answer to "what do I do here?" is answered in the first viewport.

**Enforcement:** Every page passes the 10-second test: a new user can identify the primary action within 10 seconds without assistance.

**Test method:** Show the above-the-fold screenshot to someone unfamiliar with AcademyOS. Ask: "What would you click first?" If they cannot answer in 10 seconds, the page fails.

**Failing pages (current):**
- Director homepage: FAIL
- Curriculum overview: FAIL
- Player profile: PARTIAL (first tab is visible but purpose unclear)

---

## Law 7 — DONNA Explains Before the UI Displays

When a screen contains intelligence (health grades, risk signals, attention scores, bottleneck rankings), DONNA explains the intelligence in one sentence before the UI renders it as data.

**Enforcement:** Intelligence surfaces that display without a DONNA sentence preceding them are not compliant.

**Violation example:**
- Curriculum health panel shows grades A/B/C/D/F per level without DONNA explaining which grade matters most today.

**Compliant example:**
- DONNA: "Orange Ball 2 is your lowest-grade level this month. It's affecting 3 players." → Health panel shows all levels with Orange Ball 2 visually emphasized.

---

## Law 8 — One DONNA Surface Per Role Per Session

A director has exactly one way to interact with DONNA at any given moment. Multiple DONNA surfaces running simultaneously violate the operating model.

**Enforcement:** At any point in the director experience, only one DONNA interaction surface is active. All others are collapsed, dismissed, or removed.

**Current violation count:** 8 concurrent DONNA surfaces on any director page.

**Compliant model:**
- One floating DONNA button (always available)
- When DONNA speaks on a page, it's via the floating panel, not via an inline card AND a status bar AND a command section simultaneously.

**Exception:** The page-level DONNA brief (Law 2) is not a "surface" — it's an inline recommendation, not an interactive element. It does not conflict with the floating DONNA button.

---

## Law 9 — No Invisible Entry Points

A director must be able to discover every core workflow through the visible UI. No feature requires knowing a URL parameter, a hidden query string, or an undocumented route.

**Enforcement:** If a feature requires knowing a specific URL to access, it fails this law.

**Violation example:**
- Curriculum improvement context: accessible only via `?improve=[levelKey]` URL parameter. Not discoverable from any button, link, or DONNA suggestion within the UI.

**Compliant example:**
- Each curriculum level card has an [Improve this level] button that opens the improvement panel directly.

---

## Law 10 — Labels Match Intent

Navigation labels match what the director wants to DO, not what the feature IS.

**Enforcement:** Every label is tested with the question: "Would a director use this word when describing their intent?" If not, the label is wrong.

**Violation examples:**
- "Approvals" (describes the feature) vs. "Review & Decide" (describes the intent)
- "Academy Health" (describes the feature) vs. "How is my academy doing?" (describes the intent)
- "Curriculum" (describes the object) vs. "Player Development" (describes the director's goal)

**Compliant examples:**
- "Today" — matches the director's mental model of "what am I doing today?"
- "Players" — matches "I want to look at my players"
- "Sessions" — matches "I want to look at sessions"

---

## Law 11 — Data Honesty

Every piece of data shown must accurately represent its source, confidence level, and completeness — in plain language.

**Enforcement:** Any health grade, score, or intelligence signal that is based on incomplete data must say so in human language, not as a badge.

**Violation examples:**
- Curriculum health grade "A" based on 3 of 8 dimensions — shown without qualification
- `academyHealthPct` computed as a formula derived from alert counts, shown as "Academy Health This Week" with a sparkline that is static/fabricated

**Compliant examples:**
- "Curriculum health based on gates, drills, and coach language. Assessment and mission data not yet available."
- "Academy health: 7.2/10. Based on 6 signals. Score will improve as more sessions and evidence are recorded."

---

## Law 12 — DONNA Takes the First Action

For any workflow that produces a document, draft, or decision, DONNA creates the first draft. The director's job is to approve, modify, or reject — never to start from blank.

**Enforcement:** Any workflow that requires a director to create a blank document, write the first sentence, or make a decision without a DONNA recommendation is non-compliant.

**Workflows that must have DONNA-first drafts:**
- Parent updates
- Player development plans
- Curriculum improvement proposals
- Coach feedback summaries
- Assessment review decisions (DONNA recommends approve/request clarification)

---

## Enforcement Process

Before shipping any sprint that touches director-facing UX:

1. **Law 1 check:** List every CTA on the screen. Is there exactly one primary?
2. **Law 4 check:** Count primary sections. Are there 4 or fewer?
3. **Law 5 check:** Screenshot above the fold. Is the primary action visible?
4. **Law 6 check:** 10-second test. Can a new user identify the next action?
5. **Law 7 check:** Does every intelligence surface have a DONNA sentence before it?
6. **Law 8 check:** How many DONNA surfaces are active? Must be ≤ 1 interactive.
7. **Law 9 check:** Is every feature accessible from the visible UI?
8. **Law 10 check:** Do labels match intent?
9. **Law 11 check:** Is all data labeled with its source and confidence?
10. **Law 12 check:** Does DONNA draft first?

---

## Anti-Patterns to Avoid

| Anti-Pattern | Description | Law Violated |
|---|---|---|
| Dashboard wall | More than 4 sections without hierarchy | Law 4 |
| DONNA clutter | Multiple concurrent DONNA surfaces | Law 8 |
| URL-gated features | Core workflows behind URL parameters | Law 9 |
| Metric without meaning | KPI shown without recommendation | Law 2 |
| Director starts from blank | Form without DONNA draft | Law 12 |
| Data before recommendation | Chart before DONNA sentence | Law 3 |
| False precision | Incomplete score shown as complete | Law 11 |
| Label mismatch | Feature name instead of director intent | Law 10 |
| Above-fold scroll | Primary action requires scrolling | Law 5 |
| Competing primary actions | Two lime buttons on one screen | Law 1 |
