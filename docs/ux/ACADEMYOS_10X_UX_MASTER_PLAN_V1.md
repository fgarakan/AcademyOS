# AcademyOS 10X UX Master Plan V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2101–2150

---

## The Central Question

> If AcademyOS were rebuilt today by the best product team in the world, preserving all existing intelligence and architecture, what would the experience look like?

---

## The Answer in Three Sentences

DONNA opens the day with the 3 things that matter. The director decides, not navigates. Everything else is one tap away.

---

## What the Best Product Team Would Keep

The intelligence is world-class. Before changing a single pixel of UI, recognize what AcademyOS already has:

- **Attention ranking engine** that knows which player needs attention first, and why, from live database signals
- **Academy health scoring** across 6 sections with honest source attribution
- **Curriculum bottleneck detection** that identifies which level is holding back the most students
- **Proposed actions pipeline** that ensures AI never directly mutates data — always through human review
- **DONNA reasoning engine** with 16-step orchestration, ambiguity resolution, goal continuity, and COO guidance
- **Coach wrap-up intelligence** that connects session recaps to player development
- **Parent communication safety layer** that ensures no internal coach notes reach parents
- **Voice capability** with a production-ready TTS pipeline and browser fallback

This backend intelligence is what separates AcademyOS from any generic sports management tool. The best product team would not change one line of it. They would make it visible.

---

## What the Best Product Team Would Change

**They would change one thing:** The ratio of intelligence to chrome.

Today's ratio:
- 8 DONNA surfaces compete for attention
- 5+ collapsible sections obscure the work
- 12 sidebar items flatten the hierarchy
- The highest-value insight (DONNA's top action) is buried below multiple banners

The best team's ratio:
- 1 DONNA surface, always visible
- 3 sections on the daily view
- 5 sidebar items
- DONNA's top insight is the first sentence the director reads

Same intelligence. Radically less chrome.

---

## The Three Design Decisions That Change Everything

### Decision 1: DONNA speaks first

Today: Page loads → director sees data → director looks for DONNA.
Ideal: Page loads → DONNA speaks → director sees the data that supports DONNA's recommendation.

This is not a product philosophy — it is a mechanical change. Every page already has DONNA's recommendation computed. The only question is whether it appears before or after the data.

Move DONNA's recommendation to line 1. Everything else follows.

### Decision 2: Approvals are the daily work

Today's director mental model: "I go to the dashboard, then I navigate to approvals."
Ideal director mental model: "I open AcademyOS and my work is in front of me."

Approvals (coach wrap-ups, assessments, placements, parent updates) ARE the director's daily work. They should be on the first screen, not behind a navigation click.

The "Today" page is not a dashboard. It is an inbox.

### Decision 3: Curriculum health is the default view

Today: "Curriculum" in the sidebar goes to the builder. A director who wants to understand curriculum health must type a URL.
Ideal: "Curriculum" shows health. The builder is a tab.

One navigation change. Curriculum improvement becomes discoverable. The DONNA improvement workflow becomes accessible.

---

## The Full Vision

### What the director sees when they open AcademyOS

```
Good morning, Brian.

Your academy is running well — 7.2/10.

Three things need you today:
  1. Lucas Santos's parent update is ready to review
  2. Tuesday's Orange Ball 2 session has no recap
  3. Two players are ready for level advancement

[Review Lucas's update]  [Request recap]  [Advance players]
```

Three sentences. Three buttons. The director's day is structured.

Everything else — KPIs, curriculum details, coach performance, player lists — is one tap away, organized by purpose, not by feature.

### What the director experiences when they navigate

**Players:** Sorted by who needs attention, not alphabetically. DONNA brief explains the top 3. Director sees the situation immediately.

**Curriculum:** Leads with health (DONNA: "Orange Ball 2 needs attention"). Level cards show health at a glance. "Improve" is a visible button, not a URL. The builder is accessible but secondary.

**Academy Health:** One screen with 6 honest health sections. Every number has a source label. Every section has a DONNA sentence explaining what it means today. The sparkline chart is real data or absent — never fabricated.

**Review & Decide (approvals):** Items sorted by priority, not recency. DONNA pre-summarizes each: "This one needs your judgment. This one is routine." Director can batch-approve routine items. Complex items get DONNA's recommendation before the director decides.

### What DONNA experiences from the director's perspective

DONNA has one face: a brief on every page and a panel on tap.

The brief is 2-4 sentences. Always relevant to the current screen. Never repeating what the UI already shows.

The panel is a full conversation. Voice or text. Rich responses with source links. DONNA takes the first action on every workflow — drafts the parent update, ranks the approvals, suggests the curriculum improvement. The director approves, modifies, or asks for more.

DONNA never says "based on available data." She says: "Lucas has been stuck for 8 months. Here's what I'd do."

---

## Implementation Reality

The vision is achievable. The backend is already there. The path forward is:

**Sprint 1:** Remove what's broken (dead code, fabricated data, URL-gated features).
**Sprints 2-5:** Fix navigation (curriculum default, sidebar simplification, label corrections).
**Sprints 6-15:** Consolidate the dashboard (3 sections, DONNA leads, approvals are primary).
**Sprints 16-30:** Unify DONNA surfaces (1 brief per page, floating panel for depth).
**Sprints 31-40:** Polish (mobile, first-run, onboarding, DONNA personality tuning).

Total: ~40 sprints. The intelligence does not change. Only the surface does.

---

## The 10-Second Test Promise

After this roadmap is complete:

1. A new director opens AcademyOS for the first time.
2. DONNA says: "Good morning. Here are your 3 most important things today."
3. The director knows what to do.
4. Elapsed time: 8 seconds.

That is the promise. Everything in this audit is in service of that promise.

---

## What This Is Not

This is not a feature removal. Every capability built across 2000+ sprints remains. The intelligence engines, the proposed actions pipeline, the DONNA reasoning layer, the curriculum coverage model, the bottleneck detector, the health scoring system — all of it stays.

This is a surface redesign. The information is reorganized, not deleted. The workflows are simplified, not eliminated. The UI gets out of the way of the intelligence.

---

## Summary Table

| Dimension | Today | After Reimagination |
|---|---|---|
| DONNA surfaces | 8 concurrent | 1 brief + 1 floating panel |
| Dashboard sections | 8+ | 3 |
| Sidebar items | 12 | 5 + gear |
| Curriculum default view | Builder | Health |
| Curriculum improvement entry | URL hack | Visible button on every level card |
| KPI surfaces | 3 overlapping | 1 (Academy Health page) |
| 10-second test | FAIL | PASS |
| Intelligence visibility | Below fold, behind clicks | Line 1 |
| Setup on dashboard | Always visible | First-run only |
| Data honesty | Mixed (fabricated sparkline) | All data labeled with source |
| DONNA language | "LOW confidence · based on available data" | "I'd focus on Orange Ball 2 today." |

---

## Closing Principle

> The best interface for a system with world-class intelligence is the one where the intelligence is what you notice first.

AcademyOS has that intelligence. The UX reimagination is the act of making it the first thing the director sees.
