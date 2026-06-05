# Director Workflow Audit V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2101–2150
**Purpose:** Map the complete director journey and identify every friction point, cognitive load spike, hidden intelligence moment, and unnecessary click.
**Method:** Source-code analysis of director/page.tsx (1490 lines), layout.tsx, SidebarNav, curriculum/page.tsx, and DONNA component inventory.

---

## Framework

Every screen is evaluated on four questions:
1. **10-second test** — Can a new director understand what to do in 10 seconds?
2. **Friction count** — How many clicks/decisions are required before value is delivered?
3. **Intelligence visibility** — Is the system's intelligence visible or hidden?
4. **Completion clarity** — Does the director know when they're done?

---

## Journey Stage 1 — First Login

### What happens today

The director logs in and hits:
1. `FirstRunDeckGate` — a gate overlay that shows a first-run deck (required completion before seeing the dashboard)
2. `DonnaFirstGreeting` — DONNA greeting on first visit
3. `DirectorContinueSetupPanel` — 7-step setup checklist (academy identity, director interview, curriculum, level gates, programs/groups, coaches, players)
4. The full director dashboard beneath, including multiple DONNA surfaces

### Friction inventory

| # | Friction | Impact |
|---|---|---|
| 1 | First-run deck overlays the entire dashboard — director cannot see the system they're setting up | HIGH |
| 2 | No "what will AcademyOS do for me" explained before asking for 7 setup steps | HIGH |
| 3 | `DonnaFirstGreeting` fires immediately but has no interaction affordance — it reads as a static header, not an AI | MEDIUM |
| 4 | 7 setup steps listed with no explanation of which is blocking (all look equally important) | HIGH |
| 5 | No completion feedback — director cannot see "you're 3/7 done" while in the middle of setup | MEDIUM |
| 6 | DONNA cannot help with setup steps — she's present but silent during the most confusing moment | HIGH |

### What Linear/Apple would do

**Linear:** Show one setup step at a time. Each step has a single call to action. Progress is shown as "1 of 4" not a list. On completion, animate to the next step. No overlay gate.

**Apple:** Skip the setup wizard entirely. Show the product working. First-time empty states guide the user into the flow naturally. DONNA should say: "Your academy is new. Let me walk you through your first 3 minutes."

### Recommendation

Replace the setup checklist with a guided 3-step onboarding flow that DONNA narrates: (1) Tell me about your academy, (2) Add your first players, (3) Your first session. Everything else can wait.

---

## Journey Stage 2 — Daily Usage (Returning Director)

### What the director sees on load

The director hits `/director` and encounters, in order:
1. `PreviewBanner` (conditional)
2. `DemoModeBanner` (conditional)
3. `DonnaCOOStatusWrapper` — a dismissible status bar at the top of every page
4. `DonnaDailyCOOBriefSurface` — a daily brief card, shown once per day, collapsible
5. `FirstRunDeckGate` wrapper (transparent for returning users)
6. `DonnaFirstGreeting` (on first visit only)
7. Setup panel OR "Academy is live" banner (conditional on setup completion)
8. `DonnaScreenBriefStatic` — a per-page DONNA brief
9. `DonnaAcademyCOOBriefCard` — **expanded by default** — DONNA's top recommendation
10. `DonnaCommandSection` — DONNA text input bar
11. `DirectorPrimaryActionHero` — the top action surface
12. `DirectorTodayKpiSection` — 7 KPI tiles
13. Collapsed sections: Sessions This Week, Quick Actions, Academy Metrics, Alerts & Placement, Analytics

The director also has:
- Floating `DonnaAssistantButton` (bottom right) — opens full DONNA panel
- `DonnaWakeWordLayer` — "Hey Donna" microphone (always-on, opt-in)
- `DonnaProactiveBriefCard` — proactive pilot guide (once per route/session)
- `DonnaHighlightBanner` — guided highlight that moves focus around the screen

### DONNA surface count on every director page: **8 active surfaces**

| Surface | Location | Dismissible? | Role |
|---|---|---|---|
| `DonnaCOOStatusWrapper` | Top bar, layout | Yes | Status message |
| `DonnaDailyCOOBriefSurface` | Below top bar, layout | Yes (daily) | Daily brief |
| `DonnaAcademyCOOBriefCard` | Page, above fold | No (expanded) | Top action |
| `DonnaCommandSection` | Page, above fold | No | Text input |
| `DonnaScreenBriefStatic` | Page, above fold | No | Page context |
| `DonnaAssistantButton` | Floating (bottom right) | No | Full panel |
| `DonnaWakeWordLayer` | Always present | Opt-in | Voice trigger |
| `DonnaProactiveBriefCard` | Overlay | Yes (per route) | Proactive guide |
| `DonnaHighlightBanner` | Overlay | Yes | Guided highlight |

**Finding:** DONNA paradox. 8 DONNA surfaces create MORE confusion than 1. The director cannot tell which surface is "the real DONNA." Multiple surfaces compete for the same screen real estate with overlapping purpose (DonnaCOOStatusWrapper vs. DonnaDailyCOOBriefSurface vs. DonnaAcademyCOOBriefCard vs. DonnaScreenBriefStatic).

### Friction inventory — daily dashboard

| # | Friction | Impact |
|---|---|---|
| 1 | Director must parse 8 DONNA surfaces before reaching action content | CRITICAL |
| 2 | `DonnaAcademyCOOBriefCard` is EXPANDED BY DEFAULT — pushes all action content below fold | CRITICAL |
| 3 | `DirectorTodayKpiSection` (7 tiles) duplicates information already shown in `DirectorPrimaryActionHero` and the DONNA brief | HIGH |
| 4 | All collapsible sections are CLOSED — director cannot see sessions, quick actions, or metrics without expanding | HIGH |
| 5 | "Quick Actions" (collapsed) contains links already available in the sidebar | MEDIUM |
| 6 | "Analytics" section contains a static sparkline chart derived from alert counts, not real historical data — labeled "Academy Health This Week" but is fabricated | HIGH |
| 7 | "Academy Health" appears in 3 places: sidebar link (→/kpi), collapsed "Academy Metrics" section, and AcademyHealthBadgeWithDrawer in the page header | MEDIUM |
| 8 | Sidebar "Curriculum" → links to `/director/curriculum/builder`, not curriculum home — unexpected destination | HIGH |
| 9 | "Today" in sidebar and "View Today's Academy" Quick Action link to different routes (/director vs /director/today) | MEDIUM |
| 10 | Setup section appears at the BOTTOM of the page after all operational content — new directors can't find it | MEDIUM |

### Cognitive load analysis

Above the fold (before any scrolling), the director sees:
- 2 DONNA brief surfaces
- 1 DONNA command bar
- 1 DONNA COO brief card (expanded)
- 1 primary action hero
- 7 KPI tiles

That is **~13 distinct information blocks** before a single collapsed section opens. A director cannot determine which of these is "the thing to act on."

**10-second test result: FAIL.** A new director cannot determine what to do in 10 seconds. The screen is high-information but low-clarity.

---

## Journey Stage 3 — Approval Workflow (Daily)

### What happens today

Director navigates to `/director/review` (sidebar: "Approvals") to review coach wrap-ups, assessments, placements, and voice intakes.

**Issues identified (from code comments and component naming):**
1. "Approvals" label does not match "Review Queue" labeling throughout the codebase — `VoiceIntakeDraftCard`, `StructuredDraftCard`, `WrapUpDraftDecisionControls` are all in the "review" folder
2. The sidebar pending count badge is accurate (live from `proposed_actions`) but the count covers all types — directors don't know the split
3. DONNA on the review queue page is the generic floating button, not a specialized queue-scoped DONNA surface

### Friction inventory

| # | Friction | Impact |
|---|---|---|
| 1 | Director cannot tell from the sidebar badge whether the 5 pending items are wrap-ups, placements, or assessments | MEDIUM |
| 2 | Approve/Reject/Clarify controls exist but applying an approved item requires a separate second button — two-step process with no clear reason why | MEDIUM |
| 3 | DONNA has no role in the review queue — an intelligent system that proposes actions has no intelligence at the point of approval | HIGH |

---

## Journey Stage 4 — Weekly Review (Player Health)

### What happens today

Director navigates to `/director/players` to view the roster, then `/director/players/[playerId]` for individual profiles.

**Players list features:** Search, status filter, curriculum badge.

**Player profile features (known):** Tab layout, curriculum, advancement, Q&A preview, parent guidance preview.

### Friction inventory

| # | Friction | Impact |
|---|---|---|
| 1 | Player list is a flat directory — no priority sorting (e.g. "show players who need attention first") | HIGH |
| 2 | No "flag for review" mechanism visible in the list — director must click into profile to see the issue | MEDIUM |
| 3 | Player profile has many tabs — director must know which tab has the relevant information | MEDIUM |
| 4 | DONNA intelligence about a player (risk signals, stall detection, advancement readiness) is not surfaced on the player list | HIGH |

---

## Journey Stage 5 — Curriculum Improvement (Monthly)

### What happens today

Director navigates to:
1. Sidebar "Curriculum" → `/director/curriculum/builder` (goes to builder, not intelligence view)
2. OR manually types `/director/curriculum` to reach the overview/intelligence view
3. OR clicks `?improve=[levelKey]` query parameter to open DONNA curriculum context

### Friction inventory

| # | Friction | Impact |
|---|---|---|
| 1 | No "improve curriculum" entry point is visible in normal navigation — requires knowing the `?improve=` URL parameter trick | CRITICAL |
| 2 | "Curriculum" in sidebar goes to the builder, not the health/intelligence view — curriculum improvement is effectively hidden | HIGH |
| 3 | Coverage scoring only covers 3/8 dimensions (gates, drills, coachCues) — displayed as health grades A/B/C/D/F which a director may trust as complete | HIGH |
| 4 | DONNA bottleneck intelligence exists and is active but has no prominent "what is DONNA seeing?" surface on the curriculum page | HIGH |
| 5 | Curriculum health and curriculum builder are on different routes with no cross-linking | MEDIUM |

---

## Journey Stage 6 — Coach Management

### What happens today

Director navigates to `/director/coaches`. Coach profiles link back to sessions and wrap-ups.

### Friction inventory

| # | Friction | Impact |
|---|---|---|
| 1 | No DONNA intelligence about coach performance surfaced on coaches list | HIGH |
| 2 | Coach compliance (recap rate, attendance accuracy) is computed via `computeRecapCompletionRate` but not surfaced as a visible KPI on the coaches page | HIGH |
| 3 | No "flag underperforming coach" → DONNA suggestion path | MEDIUM |

---

## Journey Stage 7 — Parent Communication

### What happens today

Director navigates to `/director/parents` (sidebar: "Parent Updates"). Parent communication drafts are created via the `proposed_actions` pipeline.

### Friction inventory

| # | Friction | Impact |
|---|---|---|
| 1 | Parent communication and review queue approvals are separate sidebar items — a parent update draft created from a player profile ends up in the review queue, not the parent updates section | MEDIUM |
| 2 | No DONNA-generated parent update template — director must write from scratch | HIGH |
| 3 | Parent safe/unsafe content rules (`parentSafeResponseRules.ts`) exist but are invisible to the director — they don't know why certain content is blocked | MEDIUM |

---

## Summary Friction Matrix

| Journey Stage | Friction Count | Highest Severity | 10-sec Test |
|---|---|---|---|
| First Login | 6 | HIGH | FAIL |
| Daily Dashboard | 10 | CRITICAL | FAIL |
| Approval Workflow | 3 | HIGH | PARTIAL |
| Weekly Player Review | 4 | HIGH | PARTIAL |
| Curriculum Improvement | 5 | CRITICAL | FAIL |
| Coach Management | 3 | HIGH | FAIL |
| Parent Communication | 3 | HIGH | PARTIAL |

**Total friction items: 34**
**Critical: 3 | High: 17 | Medium: 14**

---

## Root Cause Summary

Three root causes produce the majority of friction:

**1. DONNA is everywhere but owns nothing.**
8 separate DONNA surfaces compete for attention. No surface is "the main one." The director cannot build a mental model of how to interact with DONNA because the surface keeps changing.

**2. Intelligence is buried below operational content.**
The system has rich intelligence (bottleneck detection, attention ranking, stall detection, KPI trends) but leads with operational widgets (sessions this week, alerts). The most valuable thing AcademyOS can tell a director is the first thing DONNA knows — and it's below the fold.

**3. Navigation sends you to the wrong place.**
"Curriculum" → builder (not intelligence). "Today" → dashboard (different from /director/today). "Academy Health" → three different routes. A new director cannot navigate by intent — they must learn the hidden destinations.

---

## Recommended Priorities

1. **Reduce DONNA surfaces to 1.** One primary DONNA interface. All other surfaces are eliminated or absorbed.
2. **Put intelligence above the fold.** DONNA's top insight is the headline. Data is below.
3. **Fix navigation intent mismatches.** Every sidebar link must go to the most useful destination for that intent.
4. **Make curriculum improvement discoverable.** It cannot require a URL hack.
5. **Merge duplicated KPI surfaces.** `DirectorTodayKpiSection` + `AcademyKpiCardsSection` + `DirectorKpiHealthSection` are three surfaces showing overlapping data. One is enough.
