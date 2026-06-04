# AcademyOS UX Redesign Readiness Report V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Based on:** All 6 preceding audit documents

---

## Executive Summary

AcademyOS has strong functional depth — the data models, backend queries, review queue, curriculum builder, and DONNA intelligence layer are all built and working. The product has real bones.

The UX problem is not missing features. It is **information architecture and cognitive load**. 

The app was built by accumulating screens and surfaces. Each sprint added something valuable. But those additions were never audited for redundancy, scroll depth, or DONNA/UI responsibility split. The result is a product that works, but requires too much effort to use.

The redesign does not need to rebuild functionality. It needs to:
1. Remove redundant surfaces
2. Move DONNA to the front (explain before showing)
3. Reduce scroll depth on every key page
4. Merge overlapping pages
5. Make the review queue urgency-first

---

## Top 20 UX Problems

| # | Problem | Severity | Affected Roles |
|---|---|---|---|
| 1 | Review queue sorted by data type, not urgency — director reviews wrong items first | CRITICAL | Director |
| 2 | DONNA chat interface on `/director/donna` is buried under 6 data panels | CRITICAL | Director |
| 3 | Three DONNA surfaces on `/director` dashboard before any actionable data | HIGH | Director |
| 4 | Primary action hero on dashboard is below the fold — director must scroll to find it | HIGH | Director |
| 5 | `/director` and `/director/today` are two separate pages with overlapping content | HIGH | Director |
| 6 | Player profile has no DONNA brief — director must read 5 tabs to understand a player | HIGH | Director |
| 7 | Session detail has 11 panels, most empty for typical sessions — massive scroll required | HIGH | Director |
| 8 | Session wrap-up CTA is not sticky — coaches must scroll to find it after running 8 blocks | HIGH | Coach |
| 9 | Two recap UIs on the same coach session page (Quick Note + guided Wrap-Up) | HIGH | Coach |
| 10 | 12 equal-weight KPIs on Academy Health page — no headline signal | MEDIUM | Director |
| 11 | Curriculum explorer loads full tree without orientation — no DONNA brief on entry | MEDIUM | Director |
| 12 | Parent home shows IDP before showing latest academy updates | MEDIUM | Parent |
| 13 | Player home is too data-heavy for the target 8-13 age group | MEDIUM | Player |
| 14 | DONNA is absent from player home (only accessible via /player/ask-donna sub-page) | MEDIUM | Player |
| 15 | DONNA absent from parent home (no parent-safe DONNA brief) | MEDIUM | Parent |
| 16 | Satellite pages (`/director/alerts`, `/director/attention`, `/director/ai-suggestions`) duplicate dashboard content | MEDIUM | Director |
| 17 | Two template route trees exist: `/director/class-templates/*` and `/director/templates/class/*` | MEDIUM | Director |
| 18 | `/director/command-center` (voice intake) duplicates DONNA page functionality | MEDIUM | Director |
| 19 | Coach has no DONNA brief on session page: "here's what to focus on today" | MEDIUM | Coach |
| 20 | No per-coach performance signals on `/director/coaches` list | LOW | Director |

---

## Top 20 Cognitive Load Issues

| # | Issue | Page | Load Reduction Strategy |
|---|---|---|---|
| 1 | Three DONNA surfaces repeat similar information | `/director` | Merge to 1 DONNA brief |
| 2 | 7-tile KPI strip with equal visual weight | `/director` | 3 vital signs + expand button |
| 3 | Approval cards have no DONNA pre-reading | `/director/review` | DONNA reads and summarizes each card |
| 4 | 15+ different card types in review queue | `/director/review` | Consistent card anatomy |
| 5 | Player profile requires 5 tab reads to understand player | `/director/players/[id]` | DONNA 2-sentence profile brief |
| 6 | Session detail shows 11 panels regardless of session state | `/director/sessions/[id]` | DONNA brief + collapsed empty panels |
| 7 | Curriculum tree loads with no health context first | `/director/curriculum` | DONNA gap brief on entry |
| 8 | 12 equal-weight KPIs with no headline | `/director/kpi` | 3 vital signs + detail expansion |
| 9 | DONNA page looks like a secondary dashboard | `/director/donna` | Chat-first layout |
| 10 | Quick Actions section duplicates sidebar | `/director` | Remove Quick Actions section |
| 11 | Academy Setup section visible when academy is live | `/director` | Show only if incomplete |
| 12 | Review queue has DONNA guide chips on every tab | `/director/review` | Remove tab guide chips if DONNA is pre-reading cards |
| 13 | Parent home shows IDP (6+ month curriculum document) before recent updates | `/parent` | Re-order: news first, IDP on request |
| 14 | Player home shows 7 sections before the first fold | `/player` | Mission + badge only above fold |
| 15 | Coach session page has two competing recap modes | `/coach/sessions/[id]` | One recap mode only |
| 16 | Coach signals on `/director/coaches` require drill-down | `/director/coaches` | Inline performance badges on list |
| 17 | DONNA COO brief expanded by default adds ~200px before primary action | `/director` | Collapsed by default with headline visible |
| 18 | Template creation requires knowing the curriculum level first | `/director/templates` | DONNA guides: "Choose a level → template creates itself" |
| 19 | No urgency hierarchy between items in Needs Approval tab | `/director/review` | DONNA sorts by urgency, color-codes by severity |
| 20 | No session coverage alerts on sessions list | `/director/sessions` | Add DONNA signal: "2 sessions this week have no blocks" |

---

## Top 10 Unnecessary Scroll Issues

| # | Issue | Page | Scroll Reduction Strategy |
|---|---|---|---|
| 1 | DONNA chat interface buried ~1500px below fold | `/director/donna` | Move chat to top — collapse panels |
| 2 | Primary action hero below the fold on dashboard | `/director` | Remove 2 DONNA surfaces — hero moves above fold |
| 3 | 11 session detail panels render even when empty | `/director/sessions/[id]` | Render only panels with content |
| 4 | Wrap-up CTA at bottom of coach session block list | `/coach/sessions/[id]` | Sticky bottom CTA bar |
| 5 | Review queue cards push action controls below fold | `/director/review` | DONNA pre-reading collapses card content |
| 6 | DONNA surfaces on players page add 300px before list | `/director/players` | Single DonnaScreenBriefStatic only |
| 7 | Curriculum tree renders all 5 stages immediately | `/director/curriculum` | Collapsed stages, expand on click |
| 8 | Parent home shows full IDP before any updates | `/parent` | Reorder: updates card first |
| 9 | Player home has 7 sections in one continuous scroll | `/player` | 2 above-fold sections, rest tabbed |
| 10 | Academy Health page shows 12 KPIs in equal-weight grid | `/director/kpi` | 3-KPI headline + expandable detail |

---

## Pages to Merge

| Merge | From | Into | Rationale |
|---|---|---|---|
| Dashboard + Today's Academy | `/director/today` | `/director` | Today's Academy *is* what the dashboard should be — a daily operational view |
| Alerts + Signals + Dashboard Alerts section | `/director/alerts`, `/director/signals` | `/director` attention area | All three show the same alerts — consolidate |
| Attention Queue + Dashboard Primary Action Hero | `/director/attention` | `/director` | Attention queue is the primary action — belongs on dashboard |
| AI Suggestions + Dashboard | `/director/ai-suggestions` | `/director` | AI suggestions are already on the dashboard |
| Command Center + DONNA page | `/director/command-center` | `/director/donna` | Command intake is exactly what DONNA does |
| Parent Updates page + Review Queue | `/director/parents` | `/director/review` (parent tab) | Parent communications are reviewed in the queue |
| Class Templates (two route trees) | `/director/class-templates/*` | `/director/templates/class/*` | Two routes serve the same purpose |

---

## Pages to Simplify

| Page | Current State | Simplification |
|---|---|---|
| `/director` | 8+ zones before first fold | 3 zones: greeting + DONNA brief + primary action |
| `/director/review` | Tabs by data type | Single urgency-sorted list + DONNA pre-reading per card |
| `/director/donna` | 6 data panels before chat | Chat-first, context panel collapsed |
| `/director/kpi` | 12 equal-weight KPIs | 3 headline KPIs + expandable detail |
| `/director/sessions/[id]` | 11 panels, most empty | DONNA brief + show only panels with content |
| `/player` | 7 sections | 2 above-fold (hero + mission) + tabbed detail |
| `/parent` | IDP first | Updates first + IDP on request |

---

## Pages DONNA Should Absorb

These pages can be replaced by DONNA interactions with a much simpler UI shell:

| Page | DONNA Absorption Strategy |
|---|---|
| `/director/command-center` | DONNA page with voice intake as the primary interaction |
| `/director/signals` | DONNA brief on dashboard: "3 signals this week — [list]" |
| `/director/ai-suggestions` | DONNA surfaces suggestions in the review queue and dashboard brief |
| `/director/alerts` | DONNA brief on dashboard: "2 urgent alerts — [list]" |
| `/director/attention` | DONNA attention queue drives the dashboard primary action hero |

---

## Pages Needing Full Redesign

| Page | Why Full Redesign | Key Principle |
|---|---|---|
| `/director` | UX accumulation — 8 zones, 3 DONNA surfaces, wrong hierarchy | DONNA-first, action-first |
| `/director/donna` | Wrong mental model — looks like a dashboard, is a chat interface | Chat-first |
| `/director/review` | Data-type tabs defeat urgency-first decision-making | Urgency-first, DONNA pre-reads |
| `/director/sessions/[id]` | 11 panels regardless of state | Show only what's relevant to this session's current state |
| `/player` | Too much data for target age group | Mission-first, celebration-focused |

---

## Recommended Next Sprint

**Sprint 1971–1980: Dashboard Redesign V1**

Goal: Redesign `/director` to be DONNA-first and action-first.

Steps:
1. Merge 3 DONNA surfaces into 1 (remove DonnaFirstGreeting and DonnaCommandSection from dashboard — keep DonnaAcademyCOOBriefCard, collapsed by default)
2. Move DonnAScreenBriefStatic above the COO card
3. Move DirectorPrimaryActionHero to position 2 (just below DONNA brief)
4. Move DirectorTodayKpiSection to position 3
5. Collapse all collapsible sections by default (already partially done)
6. Remove Quick Actions section (duplicates sidebar)
7. Show Academy Setup section only when incomplete
8. Result: Director sees DONNA brief + action button + 7 KPI tiles above the fold

This sprint makes the dashboard usable before any other redesign work.

**Sprint 1981–1990: Review Queue Redesign V1**

Goal: Urgency-first review queue.

Steps:
1. Replace 4 tabs (by data type) with a single sorted list (by urgency + age)
2. Add DONNA 1-line summary + recommendation to each card
3. Add batch-approve option for routine items (director explicitly selects + confirms)
4. Keep the 4 data-type filters as optional sidebar filters (not default view)

---

## Implementation Sequence

| Phase | Sprints | Focus | Blocking? |
|---|---|---|---|
| 1 | 1971–1980 | Dashboard redesign: merge DONNA surfaces, elevate action hero | No migrations needed |
| 2 | 1981–1990 | Review queue redesign: urgency-first, DONNA pre-reading | No migrations needed |
| 3 | 1991–2000 | DONNA page redesign: chat-first layout | No migrations needed |
| 4 | 2001–2010 | Session detail simplification: hide empty panels | No migrations needed |
| 5 | 2011–2020 | Player home redesign: mission-first | No migrations needed |
| 6 | 2021–2030 | Parent home redesign: updates-first | No migrations needed |
| 7 | 2031–2040 | Coach session sticky CTA + single recap mode | No migrations needed |
| 8 | 2041–2050 | Page merges: remove satellite pages, unify template routes | Routing changes |

All phases are pure TypeScript/TSX changes — no database migrations required for any of these redesigns. The data exists; the architecture is sound. This is a UI/UX restructure.

---

## Acceptance Criteria for Redesign Readiness

Before declaring each phase complete:

- [ ] Director can understand what matters in ≤10 seconds
- [ ] Primary action is above the fold on the dashboard
- [ ] DONNA has one surface per page (not 2-3)
- [ ] Review queue shows items sorted by urgency
- [ ] DONNA page leads with the chat interface
- [ ] Player home shows mission as the first element
- [ ] Parent home shows latest update as the first element
- [ ] Coach wrap-up CTA is sticky and always accessible
- [ ] No empty panels visible on session detail page
- [ ] Satellite pages merged or removed

---

## What Not to Change

The following are working well and should not be touched in the redesign:

- The sidebar navigation (9 items in correct priority order — Sprint 1060 result)
- The review queue's card components and approval controls (correct UI, wrong organization)
- The player profile tab architecture (5 tabs is appropriate for player depth)
- The coach session execution view (block-by-block is well-designed)
- The curriculum node drawer (correct UX for drill editing)
- The template creation flow
- The badge and mission systems (player engagement layer is good)
- The parent safety rules and sanitization layer
- All backend queries and RLS policies
- All database types and migrations
