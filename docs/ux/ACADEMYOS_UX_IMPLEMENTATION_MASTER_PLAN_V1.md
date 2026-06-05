# AcademyOS UX Implementation Master Plan V1

**Date:** 2026-06-05
**Source:** `docs/ux/ACADEMYOS_UX_FINAL_BLUEPRINT_V1.md`
**Purpose:** Convert the blueprint into executable implementation phases with full dependency mapping, risk analysis, and strategic prioritization.
**Status:** Planning only. No code. No implementation.

---

## Dependency Map

The 8 phases are not independent. Two parallel tracks exist:

```
Phase A ──────────────────────────────────────────────┐
  │                                                     │
  ├─► Phase B ──► Phase C                              │  (Curriculum track)
  │                                                     │
  └─► Phase F ──► Phase D ──► Phase E ──► Phase G ──► Phase H
                                                        (Homepage / IA track)
```

**Track 1 — Curriculum:** A → B → C
**Track 2 — Homepage / IA:** A → F → D → E → G → H

Phase A is the gate for both tracks. Tracks may run in parallel after Phase A.

Phase D has a soft dependency on Phase F: `DirectorTodayKpiSection` (7 tiles) must have somewhere to go before it is removed from the Today page. Phase F provides that destination.

---

## Phase A — Remove Dead Code and Trust Violations

### Objective

Eliminate fabricated data, dead components, and redundant content that currently occupy screen space, create cognitive noise, and — in the case of the fake sparkline — actively mislead the director. Zero functional regression. Zero user-visible benefit beyond cleaner chrome and one corrected trust signal.

### Affected Routes

| Route | Change |
|---|---|
| `/director` | Remove Analytics collapsible (sparkline + fake chart), remove Quick Actions collapsible |
| `/director/curriculum` | Remove CurriculumBuilderWelcome, remove "Connected System" section |

### Affected Components

| Component | Action | Location |
|---|---|---|
| `DirectorTodayCommandCenter.tsx` | **Delete** — already replaced by `DirectorPrimaryActionHero`; dead code | `src/app/director/` |
| `DonnaDashboardOpenCard.tsx` | **Delete** — already replaced; dead code | `src/app/director/` |
| `AcademyHealthChartCard` (sparkline) | **Remove** from Analytics section + replace with honest message | `src/app/director/page.tsx` |
| `CurriculumBuilderWelcome` | **Remove** from curriculum page | `src/app/director/curriculum/page.tsx` |
| "Curriculum Connections" section | **Remove** — 4 static info cards | `src/app/director/curriculum/page.tsx` |
| "Quick Actions" collapsible | **Remove** — duplicates sidebar links | `src/app/director/page.tsx` |

### Affected DONNA Systems

None. Phase A does not touch any DONNA logic, reasoning, or surface components.

### Estimated Sprint Count

**1–2 sprints.** All changes are deletions or simple removals. No new components. No data queries. No routing.

### Dependencies

None. Phase A is the only phase with no prerequisites.

### What Changes

- Analytics collapsible section disappears from dashboard (replaced by single honest sentence: "Historical trend data available after 30+ days of session data.")
- Curriculum page loses orientation content (director no longer reads marketing copy about their own curriculum)
- Quick Actions accordion disappears (links were already in the sidebar)

### What Gets Removed

- `DirectorTodayCommandCenter.tsx` — file deleted
- `DonnaDashboardOpenCard.tsx` — file deleted
- `AcademyHealthChartCard` — component removed from page; honest message replaces it
- `CurriculumBuilderWelcome` — component removed from curriculum page
- "Connected System" static info section — removed from curriculum page
- "Quick Actions" collapsible section — removed from dashboard

### What Gets Renamed

Nothing. This phase is pure removal.

### What Gets Moved

Nothing. This phase is pure removal.

### What DONNA Absorbs

Nothing. Phase A does not change DONNA behavior.

### User Benefit Unlocked

**Trust restoration.** The director no longer sees a fabricated sparkline labeled "Academy Health This Week." Any director who noticed the chart was decorative will stop noticing it as a warning signal. This is the minimum required for the subsequent phases to land with trust.

Cognitive noise reduction: ~3 collapsed sections and ~2 dead components no longer occupy scroll space on two pages.

### User Impact

**Low-positive.** Two things the director never used are gone. One thing they may have glanced at (sparkline) is replaced with an honest message. Net result: less clutter, same information.

### Risk Level

**None.** Removing dead code and non-functional elements carries zero regression risk. The only user-visible change is the sparkline replacement — and that change is from fabricated data to an honest message. TypeScript check required after each deletion.

### Rollback Complexity

**Trivial.** `git revert` on the commit restores all removed components instantly.

---

## Phase B — Fix Navigation Destinations

### Objective

Ensure every sidebar link delivers what its label promises. Specifically: fix the critical destination bug where "Curriculum" navigates to the builder instead of curriculum health, and make "Improve this level" discoverable without a URL hack.

### Affected Routes

| Route | Change |
|---|---|
| `/director/curriculum` | Becomes the default landing when clicking "Curriculum" in sidebar |
| `/director/curriculum/builder` | Remains accessible via [Builder] tab on the curriculum page |
| `/director/review` | Renamed "Review & Decide" in sidebar label |

### Affected Components

| Component | Action | Location |
|---|---|---|
| `SidebarNav` | Update "Curriculum" href: `/curriculum/builder` → `/curriculum` | `src/app/director/` |
| `SidebarNav` | Rename "Approvals" label → "Review & Decide" | `src/app/director/` |
| Curriculum page header | Add tab strip: [Health] [Builder] [Map] | `src/app/director/curriculum/page.tsx` |
| Curriculum level cards | Add [Improve this level] button → `?improve=[levelKey]` | Per-level card components |
| `/director/today` route | Audit and reconcile with `/director` — one canonical Today | `src/app/director/` |

### Affected DONNA Systems

`CurriculumIntelligenceCard` and the `?improve=[levelKey]` context panel are already built. Phase B makes them reachable through the visible UI instead of a URL parameter. No DONNA logic changes.

### Estimated Sprint Count

**3–5 sprints.** Navigation href change is 1 sprint. Tab strip on curriculum page is 1–2 sprints. "Improve this level" button on every level card is 1–2 sprints. Label rename is sub-sprint.

### Dependencies

**Phase A recommended first.** Not strictly required, but Phase A removes orientation noise from the curriculum page, making the tab strip addition cleaner.

### What Changes

- Clicking "Curriculum" in sidebar lands on health view, not builder
- Every curriculum level card has a visible [Improve this level] button
- Curriculum page has [Health] [Builder] [Map] tab navigation
- Sidebar "Approvals" label reads "Review & Decide"
- One canonical "Today" destination (`/director`)

### What Gets Removed

Nothing removed in Phase B. This phase is additive (buttons, tabs) and corrective (hrefs, labels).

### What Gets Renamed

- Sidebar label: "Approvals" → "Review & Decide"
- Curriculum page route default: builder → health

### What Gets Moved

- Builder becomes a tab within `/director/curriculum` rather than the default destination

### What DONNA Absorbs

Nothing new. DONNA's `?improve=[levelKey]` context panel is already built — Phase B makes it reachable without knowing the URL.

### User Benefit Unlocked

**Curriculum improvement discoverability.** The single highest-severity navigation failure is resolved: a director can now reach curriculum health and trigger curriculum improvement through the visible UI. This unblocks the primary DONNA curriculum workflow. Curriculum improvement goes from "requires URL knowledge" to "requires one click."

### User Impact

**Medium-high.** The curriculum workflow transformation is the most immediately noticeable change in these early phases. A director who previously could not find curriculum health now sees it on first click. The DONNA improvement context panel becomes part of the daily workflow.

### Risk Level

**Low.** All changes are href updates, label strings, and additive UI elements. No data mutations. No component deletions. The builder remains fully accessible — it just requires one extra click.

### Rollback Complexity

**Trivial.** Href changes and label strings are 1-line reverts.

---

## Phase C — Curriculum Command Center

### Objective

Transform `/director/curriculum` from a content browser into an operational command surface. Intelligence above the fold. The most-blocked level is the hero. The director knows what to fix in 10 seconds.

### Affected Routes

| Route | Change |
|---|---|
| `/director/curriculum` | Full page layout restructure — 8 zones |
| `/director/curriculum/[levelKey]` | Level detail page gets DONNA brief + structured sections |

### Affected Components

| Component | Action | Location |
|---|---|---|
| `curriculum/page.tsx` | **Full restructure** — 8-zone layout | `src/app/director/curriculum/page.tsx` |
| `CurriculumIntelligenceCard` | **Promote** — data drives new Zone 3 hero card | promoted from position 4 to position 1 |
| `CurriculumHealthPanel` (full) | **Demote** — moved to collapsed Zone 7 drilldown | was above-fold |
| Health strip (4 dimensions) | **New component** — compact progress bars for Zone 4 | new |
| Most Blocked Level card | **New component** — Zone 3 hero with lime border, stall data | new |
| Curriculum priorities list | **New component** — Zone 5, max 3, severity-ranked | new |
| "Setup Status" checklist | **Conditional hide** — only shown if setup incomplete | existing, behavior change |
| Curriculum level tree | **Move** to collapsed Zone 7 drilldown | was above-fold |
| "Curriculum Tools" section | **Move** to collapsed Zone 8 | was primary section |
| DONNA brief card | **New** — Zone 2, curriculum decision tree | new pattern, reuses logic |

### Affected DONNA Systems

| System | Change |
|---|---|
| `buildCurriculumAttentionRanking` | Drives Zone 5 priority list ranking |
| `CurriculumIntelligenceCard` data | Drives Zone 3 hero (stall count, avg days, gate %) |
| Curriculum DONNA brief | New component implementing curriculum decision tree from blueprint |
| `?improve=[levelKey]` context panel | Already built — now triggered from Zone 3 and Zone 5 buttons |
| `topTaggedConcern` signal | Powers the "main blocker" phrase in Zone 3 and DONNA brief |

### Estimated Sprint Count

**5–8 sprints.**
- Zone 2 DONNA brief: 1 sprint
- Zone 3 Most Blocked Level card: 1–2 sprints
- Zone 4 health strip: 1 sprint
- Zone 5 priority list: 1–2 sprints
- Zones 6–8 collapsed drilldowns: 1–2 sprints
- State variants (healthy, no version, draft): 1 sprint

### Dependencies

- **Phase A required:** Removes `CurriculumBuilderWelcome` and "Connected System" before restructuring the page
- **Phase B required:** Tab strip and health default must exist before the full layout restructure

### What Changes

- Curriculum page above-the-fold: DONNA brief → Most Blocked Level card → health strip → priority list
- Intelligence is promoted from scroll position 4 to position 1
- The page answers "where is my curriculum struggling?" in 10 seconds
- "Improve this level" on Zone 3 and Zone 5 items

### What Gets Removed

- `CurriculumBuilderWelcome` (done in Phase A)
- "Connected System" section (done in Phase A)
- "Next Recommended Actions" hardcoded numbered list — DONNA absorbs this
- Curriculum Spine descriptive stage cards (above fold) — moved to drilldown
- Setup Status checklist (post-setup) — hidden when all items complete
- Full `CurriculumHealthPanel` above fold — compact strip replaces it; full panel in drilldown

### What Gets Renamed

- Page title: "Curriculum" → "Curriculum Command Center"

### What Gets Moved

| Element | From | To |
|---|---|---|
| `CurriculumIntelligenceCard` data | Scroll position 4 | Zone 3 hero (above fold) |
| `CurriculumHealthPanel` | Above fold | Zone 7 collapsed drilldown |
| Level tree | Above fold | Zone 7 collapsed drilldown |
| Curriculum tools | Primary section | Zone 8 collapsed bottom |
| Setup checklist | Persistent mid-page | Conditional (hidden post-setup) |

### What DONNA Absorbs

- "Next Recommended Actions" hardcoded list — DONNA brief replaces with data-driven conclusion
- Status hero "Next Recommended Action" text string — absorbed into DONNA brief decision tree
- All "this is what curriculum means" orientation copy — absorbed into DONNA conversational responses

### User Benefit Unlocked

**Curriculum improvement becomes a first-class workflow.** A director who opens curriculum now immediately sees which level is struggling, why, and what to do. Before Phase C: director must know the URL, scroll 4 sections, and guess which level needs attention. After Phase C: the answer is above the fold, with one action button, on first load.

### User Impact

**High.** This is the second-most-visited page in the director experience and was previously the most confusing. The 10-second test goes from FAIL to PASS. Curriculum improvement workflow becomes daily-accessible instead of requiring URL knowledge.

### Risk Level

**Medium.** Full page layout restructure. No data changes, no migrations, no schema changes. All intelligence modules remain unchanged — only their presentation order changes. Risk: existing directors who know the current layout must relearn it. Mitigation: the new layout is objectively simpler, so relearning time is minimal.

### Rollback Complexity

**Medium.** Page layout revert involves restoring multiple components to prior positions. A single git revert on the phase commit handles it cleanly.

---

## Phase D — Director Today Redesign

### Objective

Transform the director homepage from a 13-block dashboard wall into a 3-zone daily COO briefing. DONNA brief first. Top 3 priorities second. Approvals and sessions below the fold. The 10-second test must pass.

### Affected Routes

| Route | Change |
|---|---|
| `/director` | Full page restructure — 4 above-fold zones, 2 below-fold sections |

### Affected Components

| Component | Action | Location |
|---|---|---|
| `director/page.tsx` (1490 lines) | **Major restructure** — zones 1–6 | `src/app/director/page.tsx` |
| `DonnaAcademyCOOBriefCard` | **Replace** — collapses into single DONNA brief card | was expanded by default |
| `DirectorPrimaryActionHero` | **Replace** — new Top 3 Priorities list component | new Zone 3 |
| `DonnaScreenBriefStatic` | **Remove** — replaced by DONNA brief | duplicate signal |
| `DonnaFirstGreeting` | **Remove** — greeting moves to identity bar Zone 1 | duplicate greeting |
| "Alerts & Placement" collapsible | **Remove** — contents absorbed by DONNA brief + Zone 3 | collapsible section |
| `DirectorTodayKpiSection` (7 tiles) | **Move** to Academy Health page (Phase F) | conditional on Phase F |
| "Analytics" collapsible | **Remove** — moved to Academy Health page | collapsible section |
| "Academy Metrics" collapsible | **Remove** — moved to Academy Health page | collapsible section |
| Academy Setup section | **Remove** from dashboard — moves to onboarding route | conditional on setup complete |
| `DonnaCommandSection` | **Remove** — command input moves to floating panel | inline input bar |
| DONNA brief card | **New** — Zone 2, Today decision tree | new unified brief |
| Top 3 Priorities list | **New** — Zone 3, max 3 items, severity-ranked | new |
| Approvals banner | **New** — Zone 4, single line, conditional on queue > 0 | new |
| Sessions 2×2 grid | **Rebuild** — clean grid with + New session / View calendar | simplified |

### Affected DONNA Systems

| System | Change |
|---|---|
| `buildAttentionQueue` | Powers Zone 3 priority list (already wired — now surfaces top 3 only) |
| Today DONNA brief | New component — implements Today decision tree from blueprint |
| `DonnaAcademyCOOBriefCard` | Replaced — its data content moves into the new brief, not a separate card |
| `DonnaScreenBriefStatic` | Removed — brief is now the page's DONNA surface, not a separate card |
| `DonnaCommandSection` | Removed from page — floating panel absorbs command input |
| `constitutionBrief` pattern | Carries into the new DONNA brief as the rendering engine |

### Estimated Sprint Count

**5–8 sprints.**
- Identity bar + Zone 1 cleanup: 1 sprint
- DONNA brief card (Zone 2): 1 sprint
- Top 3 Priorities list (Zone 3): 1–2 sprints
- Approvals banner (Zone 4): 1 sprint
- Remove collapsible sections + move KPIs: 1–2 sprints (requires Phase F in parallel)
- Sessions 2×2 grid: 1 sprint
- State variants (setup, all-clear, crisis): 1 sprint

### Dependencies

- **Phase A required:** Dead code removed before restructure
- **Phase B recommended:** Navigation destinations correct before changing the home
- **Phase F strongly recommended first:** `DirectorTodayKpiSection` must have a destination (Academy Health page) before it can be removed from Today. If Phase F is not done first, the KPI tiles must remain temporarily during Phase D and be removed in a follow-up.

### What Changes

- Director homepage above-the-fold: identity bar → DONNA brief → Top 3 priorities → approvals banner
- 13 competing information blocks → 3 zones
- Approvals visible on the home screen without navigating to a separate route
- Sessions visible in one short scroll
- DONNA speaks first; priorities follow

### What Gets Removed

- `DonnaFirstGreeting` card
- `DonnaScreenBriefStatic` inline card
- `DonnaAcademyCOOBriefCard` (expanded by default) — replaced by brief
- `DonnaCommandSection` inline input
- `DirectorPrimaryActionHero` — replaced by Zone 3
- `DirectorTodayKpiSection` — moved to Academy Health
- Static sparkline (done in Phase A)
- `AcademyAlertsPanel` — deduplicated into Zone 3
- `LiveActivityCard` — sessions grid replaces it
- "Quick Actions" collapsible (done in Phase A)
- "Analytics" collapsible — moved to Academy Health
- "Academy Metrics" collapsible — moved to Academy Health
- "Alerts & Placement" collapsible — absorbed by DONNA brief + Zone 3
- Academy Setup section — moved to onboarding (hidden post-setup)

### What Gets Renamed

- Page effective title: implied "Today" — identity bar replaces H1 dashboard title
- Priorities section label: "TODAY'S PRIORITIES" (new section header)

### What Gets Moved

| Element | From | To |
|---|---|---|
| KPI tiles (7) | Dashboard | Academy Health page (Phase F) |
| Analytics content | Dashboard collapsible | Academy Health page |
| Academy Metrics | Dashboard collapsible | Academy Health page |
| Academy Setup | Dashboard (bottom) | Onboarding route / gear menu |
| Command input | Inline `DonnaCommandSection` | Floating DONNA panel |

### What DONNA Absorbs

- Prioritization: `buildAttentionQueue` ranking → exposed as Zone 3 list (not hidden in a hero card)
- Urgency framing: "Alerts & Placement" collapse → DONNA brief surfaces critical items directly
- Setup guidance: Academy Setup section → DONNA brief handles "setup state" variant
- Quick action suggestions: "Quick Actions" accordion → DONNA's conversational responses handle routing

### User Benefit Unlocked

**Daily homepage 10-second test goes from FAIL to PASS.** Every director session begins here. After Phase D, a director opens AcademyOS and immediately knows: the most important thing, the top 3 priorities, and whether there are pending approvals — all without scrolling or decoding competing signals. This is the highest-frequency change in the entire roadmap.

### User Impact

**Critical.** This is the most-visited page in the director experience, opened at the start of every session. Reducing cognitive overhead from 13 blocks to 3 zones changes the felt experience of using AcademyOS entirely. The product feels decisive instead of overwhelming.

### Risk Level

**Medium-High.** The director homepage is a 1490-line Server Component with 20+ imports and live database queries. The restructure does not change queries or data — only presentation order — but the page is mission-critical and the changes are substantial. Risk: removing components that some directors or pilot users have built mental models around. Mitigation: Phase A and B clean up non-functional chrome first; Phase D restructures a cleaner surface.

### Rollback Complexity

**Complex.** Phase D restructures the most complex page in the codebase. A clean `git revert` on the phase commit is the rollback path, but it is a large commit with significant component-level changes. Mitigation: commit each zone as a separate sprint so rollback scope is minimal per step.

---

## Phase E — Sidebar Simplification

### Objective

Reduce the primary sidebar from 12 items to 5 + gear. No functionality removed — all moved items remain accessible via the gear dropdown. This change reduces daily visual cognitive load and clarifies the navigation intent model.

### Affected Routes

| Route | Change |
|---|---|
| `/director/coaches` | Moves to gear menu (no route change) |
| `/director/templates` | Moves to gear menu (no route change) |
| `/director/assessment-templates` | Moves to gear menu (no route change) |
| `/director/parents` | Moves to gear menu (no route change) |
| `/director/onboarding` | Moves to gear menu (no route change) |

### Affected Components

| Component | Action | Location |
|---|---|---|
| `SidebarNav` | Remove 5 items from primary list | `src/app/director/` |
| `GearMenu` | **New component** — dropdown with all moved items | new |
| `SidebarNav` | Add gear icon with dropdown trigger | `src/app/director/` |
| "Parent Updates" sidebar item | **Remove** from primary nav | DONNA handles proactively |

### Affected DONNA Systems

None directly. Removing "Parent Updates" from the sidebar means DONNA's proactive surfacing of parent update drafts on Today becomes the only discovery path — which is the correct model.

### Estimated Sprint Count

**3–5 sprints.**
- Build gear menu dropdown: 1–2 sprints
- Remove items from SidebarNav and add to gear: 1 sprint
- QA all moved routes still accessible: 1 sprint
- Handle "Parent Updates" — ensure DONNA brief + Today approvals cover this case: 1 sprint

### Dependencies

- **Phase D required:** "Approvals" must be merged into Today before removing it from the sidebar as a concept. If Approvals isn't visible on Today, removing it from the sidebar creates a navigation dead-end.
- **Phase F recommended:** Academy Health should be the canonical destination before sidebar item order is finalized.

### What Changes

- Sidebar shows: Today, Players, Curriculum, Sessions, Academy Health, [⚙ gear]
- Gear menu holds: Coaches, Templates, Assessment Templates, Parents, Settings, Onboarding
- Sidebar cognitive load drops from 12 items to 6

### What Gets Removed

From primary sidebar:
- Approvals (merged into Today via Phase D)
- Parent Updates
- Templates
- Coaches
- Assessment Template
- Onboarding

### What Gets Renamed

Nothing. Items move from sidebar to gear; their labels are unchanged.

### What Gets Moved

All 6 removed sidebar items move into the gear dropdown menu. No routes change.

### What DONNA Absorbs

- Parent Updates: DONNA proactively surfaces parent update drafts in the Today brief. The director no longer needs a dedicated sidebar navigation item — DONNA brings the work to them.

### User Benefit Unlocked

**Navigation intent clarity.** A director glancing at the sidebar sees exactly 5 daily-relevant destinations. Configuration (coaches, templates, settings) is one click away but out of the daily sightline. The sidebar stops looking like an admin panel and starts looking like a COO's daily menu.

### User Impact

**Medium.** Sidebar simplification is noticeable but not transformative on its own. Its value compounds with Phase D and Phase C — once the homepage and curriculum are improved, the sidebar is the last remaining source of navigational complexity. Together, they complete the IA transformation.

### Risk Level

**Medium.** Removing sidebar items is a behavioral change. Directors who navigate by muscle memory to "Coaches" or "Templates" in the sidebar will need to learn the gear menu. Mitigation: gear icon is always visible and persistent; moved items are exactly where expected under gear.

### Rollback Complexity

**Easy.** Adding sidebar items back from gear requires restoring `SidebarNav` entries — a small, targeted revert.

---

## Phase F — Academy Health Consolidation

### Objective

Create one canonical Academy Health page that consolidates three overlapping KPI surfaces into a single honest, sourced, explained health view. Every score shows its basis. Every section has a DONNA explanation and a drilldown link.

### Affected Routes

| Route | Change |
|---|---|
| `/director/health` | Create (or confirm) as canonical Academy Health route |
| `/director/kpi` | Redirect to `/director/health` or merge |

### Affected Components

| Component | Action | Location |
|---|---|---|
| Academy Health page | **Restructure** — 6-section layout with source labels, confidence caveat, per-section DONNA links | `src/app/director/health/page.tsx` |
| `DirectorTodayKpiSection` (7 tiles) | **Move** here from Today page | removed from `director/page.tsx` |
| `AcademyKpiCardsSection` | **Merge** into Academy Health page | deduplicated |
| `DirectorKpiHealthSection` | **Merge** into Academy Health page | deduplicated |
| `AcademyHealthBadgeWithDrawer` | **Demote** — badge in identity bar remains; drawer is no longer the canonical health surface | still in header as shortcut |
| Source labels | **Add** to every score section | new |
| Confidence caveat | **Add** when data dimensions are partial | new |
| Per-section "Ask DONNA →" links | **Add** — opens floating panel scoped to section | new wiring |

### Affected DONNA Systems

| System | Change |
|---|---|
| `buildAcademyHealthReport` | Already built — becomes the data source for all 6 sections |
| Per-section DONNA scoping | New: "Ask DONNA →" on each section pre-populates DONNA panel with section context |
| DONNA brief for Academy Health | New — follows standard brief pattern, leads with lowest-scoring section |

### Estimated Sprint Count

**3–5 sprints.**
- Confirm/create `/director/health` route with 6-section layout: 1–2 sprints
- Add source labels and confidence caveat: 1 sprint
- Wire per-section "Ask DONNA →" to floating panel: 1–2 sprints
- Remove `DirectorTodayKpiSection` from Today (coordinates with Phase D): 1 sprint

### Dependencies

- **Phase A recommended:** Dead code cleaned before consolidation
- **Phase D soft dependency:** This phase should run before or in parallel with Phase D, because Phase D needs to remove `DirectorTodayKpiSection` from Today — which requires Phase F to be the receiving destination.

### What Changes

- One canonical health destination at `/director/health`
- All KPI data lands on one page, not three competing surfaces
- Every score labeled with its data basis in plain language
- Score confidence caveat shown when data is incomplete
- Each section has a direct DONNA conversation entry point

### What Gets Removed

- `AcademyKpiCardsSection` as a separate surface — absorbed
- `DirectorKpiHealthSection` as a separate surface — absorbed
- `DirectorTodayKpiSection` (7 tiles) from Today page — moved here
- Sparkline on Academy Health (done in Phase A)
- `/director/kpi` as distinct destination — redirects to `/director/health`

### What Gets Renamed

- Route: `/director/kpi` → `/director/health` (redirect kept for backward compat)
- Page title: "Academy Health" (unchanged, but now the only canonical surface)

### What Gets Moved

| Element | From | To |
|---|---|---|
| 7 KPI tiles | Director Today page | Academy Health page |
| "Academy Metrics" content | Dashboard collapsible | Academy Health page |
| "Analytics" content | Dashboard collapsible | Academy Health page |

### What DONNA Absorbs

- KPI trend explanation: previously a static sparkline or tile label; now DONNA explains the trend for each section when asked via "Ask DONNA →"
- "What does this metric mean?": previously required opening `DonnaKpiExplainerPanel`; now DONNA answers conversationally via the per-section panel

### User Benefit Unlocked

**One honest health surface.** The director stops encountering health data in three places with three different levels of context. Academy Health becomes a trusted destination: complete, sourced, and DONNA-explained. The identity bar health badge shortcuts here. The Today page references it. The curriculum page references it. All roads lead to one place.

### User Impact

**Medium-High.** Reduces confusion about "which health surface is the real one." More importantly, the honest sourcing ("Based on: gate coverage, drill count...") and confidence caveats rebuild trust in the system's data claims — which is foundational for DONNA to be trusted.

### Risk Level

**Low-Medium.** This is primarily additive (source labels, confidence caveats, DONNA wiring) and consolidative (merging three surfaces into one). The underlying data doesn't change. The main risk is route consolidation (`/kpi` → `/health`) breaking any deep-links or bookmarks.

### Rollback Complexity

**Medium.** Route redirect must be reverted; KPI tiles must be returned to Today. A phased approach (add source labels first, consolidate routes second) reduces rollback scope.

---

## Phase G — DONNA Surface Unification

### Objective

Remove all 6 legacy DONNA surfaces from the director layout and pages, leaving exactly 2 active surfaces on any director page: one inline brief and one floating button. End the DONNA paradox — DONNA speaks once and is trusted; currently she speaks 8 times and is ignored.

### Affected Routes

All director routes — this phase modifies the director layout, which wraps every page.

### Affected Components

| Component | Action | Location |
|---|---|---|
| `DonnaCOOStatusWrapper` | **Remove** from director layout | `src/app/director/layout.tsx` |
| `DonnaDailyCOOBriefSurface` | **Remove** from director layout | `src/app/director/layout.tsx` |
| `DonnaProactiveBriefCard` | **Remove** from director pages | per-page |
| `DonnaHighlightBanner` | **Remove** from director pages | per-page |
| `DonnaCommandSection` | **Remove** from dashboard page (done in Phase D) | already removed by Phase D |
| `DonnaAssistantButton` (floating) | **Verify** as sole persistent DONNA surface | `src/app/director/layout.tsx` |
| `DonnaWakeWordLayer` | **Verify** opt-in only; no visual chrome when inactive | `src/app/director/layout.tsx` |
| Per-page DONNA brief | **Add** to all remaining director pages that lack one | per-page |

### Affected DONNA Systems

| System | Change |
|---|---|
| `DonnaCOOStatusWrapper` | Removed — no replacement; Today brief absorbs this role |
| `DonnaDailyCOOBriefSurface` | Removed — Today brief absorbs this role |
| `DonnaProactiveBriefCard` | Removed — Today brief absorbs this role |
| `DonnaHighlightBanner` | Removed — DONNA conversational guidance absorbs this |
| DONNA brief content | Must be authored for each remaining page (Players, Review, player detail, coach profiles, etc.) |
| Floating `DonnaAssistantButton` | Sole persistent interactive DONNA surface — must work correctly on every page |

### Estimated Sprint Count

**10–15 sprints.**
- Remove `DonnaCOOStatusWrapper` + `DonnaDailyCOOBriefSurface` from layout: 1–2 sprints
- Remove `DonnaProactiveBriefCard`: 1 sprint
- Remove `DonnaHighlightBanner`: 1 sprint
- Audit and verify `DonnaAssistantButton` works correctly as sole surface: 1–2 sprints
- Author and implement per-page DONNA briefs for all remaining pages: 5–8 sprints (1 per major page)

**Pages requiring new DONNA briefs:** Players list, Player profile, Review & Decide queue, Sessions, Academy Health (Phase F), Coach profile, individual session page. Each brief requires: decision tree, CTA, state variants.

### Dependencies

- **Phase D required:** Today page DONNA brief must be built as the model before layout-level DONNA surfaces are removed
- **Phase C required:** Curriculum DONNA brief must be stable before removing layout DONNA surfaces
- **Phase F recommended:** Academy Health DONNA brief should exist before layout surfaces are removed
- **Phase E recommended:** Sidebar finalized before authoring per-page briefs (some briefs reference navigation items)

### What Changes

- Every director page has exactly 1 inline DONNA brief and 1 floating button
- Layout loses the persistent top bar and daily banner
- Per-page briefs are context-specific, not generic layout-level messages
- Directors build one mental model of DONNA: brief + button, always

### What Gets Removed

- `DonnaCOOStatusWrapper` — layout-level persistent bar
- `DonnaDailyCOOBriefSurface` — layout-level daily banner
- `DonnaProactiveBriefCard` — per-route overlay
- `DonnaHighlightBanner` — guided focus overlay

### What Gets Renamed

Nothing. Components are removed, not renamed.

### What Gets Moved

Nothing. Surfaces are removed; their content is absorbed into existing Today and per-page briefs.

### What DONNA Absorbs

- All `DonnaCOOStatusWrapper` status messages — absorbed into per-page briefs
- All `DonnaDailyCOOBriefSurface` daily brief content — absorbed into Today DONNA brief
- All `DonnaProactiveBriefCard` proactive guidance — absorbed into Today DONNA brief and per-page briefs
- All `DonnaHighlightBanner` focus guidance — absorbed into DONNA conversational flow (director asks, DONNA guides)

### User Benefit Unlocked

**DONNA paradox resolved.** The director stops seeing 8 competing DONNA messages and starts seeing 1. DONNA becomes trustworthy because she is singular. "What does DONNA think?" is now answerable: "the brief at the top of this page, and whatever she says when I open the panel." This is the phase that makes DONNA feel like a COO instead of a chatbot-spam machine.

### User Impact

**High — but delayed.** The benefit compounds over time as directors build trust in DONNA's singular voice. On day 1 of this phase shipping, directors notice less clutter. Over 2–4 weeks, they start acting on DONNA's brief instead of ignoring it.

### Risk Level

**High.** Layout-level changes affect every director page simultaneously. Removing DONNA surfaces that some directors may rely on is behavioral change, not just visual change. The per-page brief authoring is significant content work — a brief that is poorly written erodes trust. TypeScript check required after each surface removal to confirm no type errors propagate across the layout.

### Rollback Complexity

**Complex.** Layout-level removals affect every page. Restoring removed surfaces requires reverting layout changes across multiple commits. Mitigation: commit each surface removal separately; use feature flags or conditional rendering if a rollback needs to be targeted to one surface.

---

## Phase H — Mobile and Polish

### Objective

Implement mobile-first director experience: bottom tab nav, single-column layouts, sticky bottom bars on action pages, and DONNA full-screen chat on mobile. Complete with a first-run onboarding flow narrated by DONNA.

### Affected Routes

| Route | Change |
|---|---|
| All director routes | Mobile responsive layout with bottom tab bar |
| `/director/onboarding` | First-run flow redesigned — DONNA narrates 3 steps |

### Affected Components

| Component | Action | Location |
|---|---|---|
| `BottomTabBar` | **Build or extend** — Today / Players / Curriculum / Health / DONNA | `src/components/` |
| Director layout | **Add** bottom tab nav for mobile breakpoints | `src/app/director/layout.tsx` |
| Action pages (player profile, wrap-up, level detail) | **Add** sticky bottom bar for mobile primary actions | per-page |
| Curriculum stage cards | **Add** horizontal scroll with indicator on mobile | curriculum page |
| DONNA mobile surface | **Build** — full-screen chat on DONNA tab | mobile-specific |
| First-run onboarding | **Rebuild** — 3-step DONNA-narrated flow | `/director/onboarding` |
| All 6 core pages | **Verify** above-fold mobile requirements per blueprint | per-page audit |

### Affected DONNA Systems

| System | Change |
|---|---|
| DONNA mobile chat | Full-screen interface on the DONNA tab; voice input prominent |
| First-run onboarding narration | DONNA walks through: "Tell me about your academy → Add first players → Your first session" |

### Estimated Sprint Count

**5–10 sprints.**
- Bottom tab bar + mobile layout switch: 2–3 sprints
- Mobile above-fold audit and fixes per page: 2–3 sprints
- Sticky bottom bars on action pages: 1–2 sprints
- DONNA mobile full-screen chat: 1–2 sprints
- First-run onboarding redesign: 1–2 sprints

### Dependencies

**All prior phases recommended complete.** Mobile work built on top of unstable page structures creates compounding debt. Phases C, D, E, F should be complete before mobile layout work.

### What Changes

- Mobile director experience: bottom tab nav instead of sidebar
- All 6 core pages pass above-fold mobile requirement
- Primary actions on action pages accessible without scrolling on mobile
- First-run experience: DONNA guides new directors through 3 steps

### What Gets Removed

- Setup checklist from dashboard (moved to first-run onboarding flow)
- `DirectorContinueSetupPanel` from dashboard — replaced by first-run flow

### What Gets Renamed

Nothing in Phase H.

### What Gets Moved

- Academy setup guidance: dashboard section → first-run onboarding flow narrated by DONNA
- Mobile nav: sidebar collapse → bottom tab bar

### What DONNA Absorbs

- First-run setup guidance: the 7-step setup checklist on the dashboard → DONNA narrates "Your academy is new. Let me walk you through your first 3 minutes: Tell me about your academy. Add your first players. Set up your first session."

### User Benefit Unlocked

**Mobile usability.** If Brian Dabul (pilot director) uses AcademyOS on mobile, Phase H is the difference between "barely usable" and "designed for this." First-run experience transforms from "overwhelming 7-step checklist" to "DONNA walks you through 3 steps."

### User Impact

**Medium for desktop-primary users. High for mobile-primary users.** The pilot context (Brian Dabul, tennis academy director) may involve mobile usage on-court. First-run onboarding improvement benefits all new directors.

### Risk Level

**Low-Medium.** Mobile-specific CSS and layout changes do not affect desktop behavior when implemented with proper breakpoints. First-run flow is an additive route change. Sticky bars are additive.

### Rollback Complexity

**Easy.** Responsive changes are isolated. First-run flow revert is a single route restore.

---

## Strategic Analysis

### Safest Starting Phase

**Phase A.**

Zero user-visible regression risk. Removes dead code and a fabricated data chart. No behavior changes except replacing a fake sparkline with an honest message — which is a correctness fix, not a UX change. Can be committed in 1–2 sprints with complete confidence.

Phase A is also the gate for both implementation tracks. Doing it first unblocks all subsequent phases simultaneously.

---

### Highest ROI Phase

**Phase D — Director Today Redesign.**

ROI calculation:
- **Frequency:** The director homepage is opened at the start of every session, every day. No other page has this frequency multiplier.
- **Current state:** 10-second test FAIL. 13 competing information blocks. Primary action buried below fold.
- **Post-phase state:** 10-second test PASS. 3 zones. Primary action above fold.
- **Sprint cost:** 5–8 sprints.
- **Compounding benefit:** Every session becomes more productive. Every DONNA interaction starts from a position of clarity instead of confusion.

Close second: **Phase C** — because curriculum improvement has been the single most-friction workflow for the director, and the change from FAIL to PASS on the curriculum 10-second test is highly visible. But the frequency multiplier of the homepage makes Phase D the winner on pure ROI.

---

### Highest Risk Phase

**Phase G — DONNA Surface Unification.**

Risk factors:
1. **Scope:** Layout-level changes affect every director page simultaneously
2. **Behavioral change:** Removes surfaces that some directors have built interaction habits around
3. **Content dependency:** Requires per-page DONNA briefs for 7+ pages — if any brief is poorly authored, trust erodes
4. **Dependency depth:** Requires Phases A, C, D, F to be stable first
5. **Recovery:** Complex rollback if multiple layout changes are bundled

Phase G has the highest upside (resolves the DONNA paradox) and the highest downside (if executed poorly, directors trust DONNA less, not more). It should not be rushed.

---

### Phase That Should Happen First Regardless of ROI

**Phase A.**

Reason: Phase A removes fabricated data. The fake sparkline (labeled "Academy Health This Week," generated from a formula, not historical data) is a trust violation. Any phase built on top of that trust violation inherits it.

More practically: Phase A is the gate for both implementation tracks. It can be executed in 1–2 sprints with no risk. Skipping it means subsequent phases are built on a codebase that still contains dead components and fake data — both of which create noise during development and QA.

The principle: fix the foundation before building the house.

---

## The One-Phase Question

**If only one phase could be completed in the next 30 sprints, which creates the largest user experience improvement?**

### Answer: Phase D — Director Today Redesign

#### But it requires Phase F first (2–3 sprints prerequisite)

The full answer is: **Phase A (1–2 sprints) + Phase F (3–5 sprints) + Phase D (5–8 sprints) = 9–15 sprints total.** This is achievable in 30 sprints with significant margin.

#### Why Phase D

**1. Frequency multiplier is unmatched.**
The director homepage is opened every single session. Every other page is opened occasionally. Improving a page used 100% of the time beats improving a page used 20% of the time, even if the latter has a higher per-visit improvement.

**2. The delta is the largest in the codebase.**
Going from 13 competing information blocks and a FAIL 10-second test to 3 zones and a PASS 10-second test is the largest single-page cognitive load reduction in the roadmap. No other phase has this magnitude of change on a single screen.

**3. It surfaces the existing intelligence immediately.**
`buildAttentionQueue` already runs. DONNA's top action is already computed. The attention ranking engine already knows what the director should do first. Phase D makes this visible on line 1, not buried below 9 content zones. The intelligence becomes the product.

**4. It sets the pattern for all subsequent phases.**
The DONNA brief card built for Phase D is the template for Phase C (curriculum), Phase F (academy health), and Phase G (all remaining pages). Phase D is not just a homepage fix — it's the proof of concept for the entire DONNA-first design system.

#### Why not Phase C

Phase C (Curriculum Command Center) is the highest-impact change for the **curriculum workflow** and delivers the most visible "demo moment" — a director opening the curriculum page and immediately seeing which level is struggling. If the primary goal in the next 30 sprints is **pilot demo readiness** for Brian Dabul, Phase C + Phase B may create a more compelling demo than Phase D.

But if the goal is **daily operational improvement** for an active academy, Phase D wins: every session, not just curriculum sessions.

#### The 30-sprint recommendation

```
Sprints 1–2:   Phase A (dead code + fake sparkline)
Sprints 3–5:   Phase B (navigation destinations)
Sprints 6–10:  Phase F (Academy Health consolidation)
Sprints 11–18: Phase D (Director Today redesign)
Sprints 19–26: Phase C (Curriculum Command Center)
Sprints 27–30: Phase E begin (sidebar simplification)
```

This delivers: clean foundation → correct navigation → honest health → daily homepage transformation → curriculum command center → sidebar clarity. All within 30 sprints. The 10-second test passes on both Today and Curriculum. DONNA is trusted. The director's most important pages are transformed.

Phases G (DONNA unification) and H (mobile polish) extend beyond 30 sprints — but by that point, the core director experience already reflects the blueprint's operating principle.

---

## Acceptance Checklist Summary

| Phase | Acceptance Gate |
|---|---|
| A | No TypeScript errors. Static sparkline replaced with honest message. Dead files deleted. |
| B | "Curriculum" in sidebar lands on health view. "Improve this level" on every level card. |
| C | Curriculum 10-second test PASS. Most Blocked Level above fold. DONNA brief first. |
| D | Today 10-second test PASS. ≤ 4 sections above fold. DONNA brief is first element. |
| E | Sidebar ≤ 6 items. All moved items accessible via gear. |
| F | One canonical health URL. Every score has source label. Confidence caveat present. |
| G | DONNA surface count ≤ 2 per page. All 8 legacy surfaces removed. |
| H | Mobile bottom tab nav. All 6 core pages pass mobile above-fold requirement. |
