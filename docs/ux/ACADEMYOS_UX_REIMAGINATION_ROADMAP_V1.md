# AcademyOS UX Reimagination Roadmap V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2101–2150
**Purpose:** Define what to remove, merge, rename, move, hide, and what DONNA should absorb. Ordered by impact and implementation safety.
**Principle:** Every change must reduce cognitive load without removing functionality.

---

## Roadmap Structure

Changes are grouped into 5 tiers:

- **Tier 0 — Immediate** (documentation/configuration, no app code risk)
- **Tier 1 — High-impact, low-risk** (remove or hide UI elements, no data change)
- **Tier 2 — Medium sprint** (rearrange content, update labels, change defaults)
- **Tier 3 — Structural** (navigation changes, IA changes, page restructuring)
- **Tier 4 — DONNA surface unification** (significant component work)

---

## What to Remove

### Tier 1 — Remove immediately (low risk)

| Element | Current Location | Remove Because |
|---|---|---|
| `CurriculumBuilderWelcome` marketing copy | `/director/curriculum` | Directors don't need to be sold on curriculum. Replaces ~200px of screen with nothing useful. |
| "Curriculum Connections" static info section | `/director/curriculum` | Foundational knowledge, not a daily workflow surface. Move to onboarding flow. |
| `DonnaScreenBriefStatic` inline card | Director pages | Superseded by DONNA brief in Today page. Creates DONNA surface clutter. |
| Static sparkline "Academy Health This Week" | Dashboard Analytics section | Fabricated from a formula, not historical data. Shown as a real chart — violates data honesty law. |
| "Quick Actions" collapsible section | Dashboard | Duplicates sidebar links. Adds nothing. |
| `DirectorTodayCommandCenter.tsx` | Dashboard (already replaced) | Already replaced by `DirectorPrimaryActionHero` — old component still exists, creating dead code. |
| `DonnaDashboardOpenCard.tsx` | Dashboard (already replaced) | Already replaced — dead code. |

### Tier 2 — Remove after consolidation (requires replacement first)

| Element | Replace With | Current Location |
|---|---|---|
| `DonnaCOOStatusWrapper` persistent bar | DONNA brief section in Today | Director layout |
| `DonnaDailyCOOBriefSurface` banner | DONNA brief section in Today | Director layout |
| `DonnaProactiveBriefCard` overlay | DONNA brief section in Today | Director layout |
| `DonnaHighlightBanner` overlay | Contextual DONNA conversation | Director layout |
| `DonnaCommandSection` inline input | Floating DONNA panel or Today brief input | Dashboard page |
| "Alerts & Placement" collapsible section | DONNA brief (surfaces urgent items) + Approvals tab | Dashboard |
| "Analytics" collapsible section | Academy Health page | Dashboard |
| "Academy Metrics" collapsible section | Academy Health page | Dashboard |

---

## What to Merge

### Tier 2 — Merge into unified surfaces

| From (multiple) | Into (single) | Impact |
|---|---|---|
| `DirectorTodayKpiSection` + `AcademyKpiCardsSection` + `DirectorKpiHealthSection` | Academy Health page → single KPI section | Removes 3 duplicated KPI surfaces |
| `DonnaAcademyCOOBriefCard` + `DonnaCommandSection` + `DonnaScreenBriefStatic` | DONNA brief (Today page) | Removes 3 DONNA surfaces from dashboard |
| "Today" sidebar item (dashboard) + "Today's Academy" Quick Action (→/director/today) | One "Today" concept | Eliminates navigational confusion between two different "today" destinations |
| Approvals (sidebar) + review queue pending items (dashboard sections) | Today page approval list | Director sees approvals where they work, not in a separate route they have to navigate to |

### Tier 3 — Merge routes (structural)

| From | Into | Rationale |
|---|---|---|
| `/director/curriculum` (overview) + `/director/curriculum/builder` (default) | `/director/curriculum` (health view, builder is a tab) | Health should be the default, builder is a secondary workflow |
| `/director/kpi` (Academy Health) + "Academy Metrics" dashboard section | `/director/health` or `/director/academy-health` | One canonical health destination |
| Templates (sidebar) + Class Templates | Inside Sessions (templates power sessions) | Templates are not standalone — they're session infrastructure |

---

## What to Rename

### Labels that violate Law 10 (label matches intent)

| Current Label | Location | New Label | Reason |
|---|---|---|---|
| "Today" (sidebar) | Sidebar → `/director` | "Today" or "Home" | Acceptable — but make it clear it's the daily home, not a date-specific view |
| "Approvals" (sidebar) | Sidebar → `/director/review` | "Review & Decide" | "Approvals" implies rubber-stamping. "Review & Decide" matches the mental act. |
| "Academy Health" (sidebar) | Sidebar → `/director/kpi` | "Academy Health" | Acceptable — already clear |
| "Curriculum" (sidebar) | Sidebar → `/director/curriculum/builder` | "Curriculum" → `/director/curriculum` | The label is fine; the destination is wrong |
| "Parent Updates" (sidebar) | Sidebar → `/director/parents` | Remove from sidebar; DONNA handles proactively | Proactive delivery removes navigation need |
| "Templates" (sidebar) | Sidebar → `/director/templates` | Move inside Curriculum + Sessions | Templates belong to the workflows they serve |
| "Coaches" (sidebar) | Sidebar → `/director/coaches` | Move to gear menu | Configuration-level access, not daily operation |
| "Assessment Template" (sidebar) | Secondary section | Move to gear menu | Rarely touched after initial setup |
| "Onboarding" (sidebar) | Secondary section → `/director/onboarding` | Move to gear menu or progress bar | Onboarding is not a daily destination |
| `DonnaDailyCOOBriefSurface` | Component name | "DONNA Brief" in UI | COO is internal terminology |
| "AI Suggestions" | Dashboard card | "DONNA Recommendations" | Consistent with brand; director knows who made the suggestions |
| "Intelligence" (internal) | codebase | Keep as is | Internal, not shown in UI |
| `LOW confidence` badge | DONNA responses | "Early signal — data growing" | Human language over technical badge |

---

## What to Move

### Tier 2 — Move elements without removing them

| Element | Current Location | Move To | Reason |
|---|---|---|---|
| Academy Setup section | Bottom of dashboard | First-run onboarding flow (not on dashboard at all) | Setup is not a daily workflow — it belongs in the first-run experience |
| `DirectorContinueSetupPanel` | Dashboard (conditional) | Onboarding page or first-run deck | Same as above |
| `DirectorDnaStatusBadge` | Dashboard | Academy Health page or gear menu | Setup badge is configuration, not operations |
| "First class template" prompt | Dashboard | DONNA's onboarding guidance | DONNA should mention this, not a static card |
| "Curriculum Coverage" metrics (3 tiles) | Dashboard Analytics | Academy Health → Curriculum Health section | Curriculum coverage is health data |
| `AcademyHealthChartCard` (static sparkline) | Dashboard Analytics | Remove (violates data honesty — fabricated data) | Cannot keep a fabricated chart |
| `LiveActivityCard` | Dashboard Analytics | Today page → sessions section | "Live Activity" is operational — it belongs on Today |

---

## What to Hide

### Behind DONNA / On-demand only

| Element | Condition for showing |
|---|---|
| KPI trend charts | Only when director asks "show me the trend for X" |
| Curriculum dimension breakdown (all 8 dimensions) | Only on explicit "explain this grade" click |
| Source labels (`player_requirement_progress`) | Only when director asks "where does this come from?" |
| Confidence level metadata | Show once on first DONNA interaction; then hide by default |
| Individual alert items in "Alert Breakdown" | Behind "Show details" on Academy Health section |
| DONNA conversation history | Behind "View history" — not shown by default |

---

## What DONNA Should Absorb

These are currently static UI elements that DONNA can deliver conversationally:

| Current Element | What DONNA Absorbs |
|---|---|
| "Curriculum Connections" info cards | DONNA explains curriculum connections when a director asks "why does curriculum matter for sessions?" |
| Setup checklist onboarding | DONNA guides through setup one step at a time, narrating each |
| KPI explainer panel (DonnaKpiExplainerPanel) | DONNA answers "what does this KPI mean?" inline |
| Level insight copy (directorGoal, exitPlayerProfile, focusAreas) | DONNA surfaces this when a level is discussed |
| "No pending suggestions" empty state | DONNA says "Your academy is clear this week — no recommendations yet. I'll update as sessions run." |
| "No pending placements" empty state | DONNA says "All students are placed. New students will appear here when they join." |
| Quick Action descriptions | DONNA routes the director to the right place conversationally |

---

## Implementation Order

### Phase A — Remove dead code (Tier 0-1, zero user impact)

1. Delete `DirectorTodayCommandCenter.tsx` (already replaced — dead code)
2. Delete `DonnaDashboardOpenCard.tsx` (already replaced — dead code)
3. Remove `CurriculumBuilderWelcome` component from curriculum page
4. Remove "Curriculum Connections" static section from curriculum page
5. Remove static sparkline `AcademyHealthChartCard` — replace with honest message: "Historical trend chart coming — requires 30+ days of session data."
6. Remove "Quick Actions" collapsible section from dashboard

**Risk:** None. Removing dead code and non-functional elements.
**TypeScript check:** Required after each file change.

### Phase B — Fix navigation destination (Tier 1, minimal risk)

7. Update SidebarNav "Curriculum" href from `/director/curriculum/builder` to `/director/curriculum`
8. Update curriculum page to show health view by default, with [Builder] and [Map] tab links
9. Add "Improve this level" button to every curriculum level card (links to `?improve=[levelKey]` — existing functionality, now discoverable)

**Risk:** Low. Navigation changes only. Curriculum page restructure is additive.

### Phase C — Reduce dashboard density (Tier 2, moderate)

10. Collapse DONNA COO brief card by default (currently expanded). Show 3-line summary. Expand on click.
11. Remove "Alerts & Placement" section from dashboard (items are surfaced in the primary action hero and review queue)
12. Move "Academy Metrics" collapsible to Academy Health page
13. Move "Analytics" collapsible to Academy Health page
14. Move setup/onboarding section to gear menu / onboarding route (not on dashboard at all)

**Risk:** Medium. Dashboard changes affect daily director experience. QA with real usage session before shipping.

### Phase D — Sidebar simplification (Tier 3, structural)

15. Move "Coaches" to gear menu
16. Move "Templates" — main template entry point moves to inside Curriculum (class templates) and Sessions (session templates)
17. Move "Assessment Template" to gear menu
18. Move "Onboarding" to gear menu or progress indicator
19. Consolidate "Parent Updates" — surface via Today approvals + DONNA proactive

**Risk:** Medium. Sidebar changes affect navigation patterns. Directors may need orientation to the new structure.

### Phase E — DONNA surface unification (Tier 4, significant)

20. Consolidate `DonnaCOOStatusWrapper` + `DonnaDailyCOOBriefSurface` + `DonnaAcademyCOOBriefCard` + `DonnaScreenBriefStatic` into a single in-page DONNA brief block (Today page only, not layout-level)
21. Remove `DonnaProactiveBriefCard` (overlay) — content absorbed into Today brief
22. Remove `DonnaHighlightBanner` — guidance absorbed into DONNA conversational flow
23. Keep `DonnaAssistantButton` (floating) + `DonnaWakeWordLayer` — these are the primary access points

**Risk:** High. DONNA surface changes are visible and behavioral. Requires careful QA.

---

## Sprint Estimates

| Phase | Description | Estimated Sprints | Risk |
|---|---|---|---|
| A | Remove dead code + non-functional elements | 1-2 | None |
| B | Fix navigation + curriculum entry points | 3-5 | Low |
| C | Dashboard density reduction | 5-8 | Medium |
| D | Sidebar simplification + IA restructure | 5-10 | Medium |
| E | DONNA surface unification | 10-15 | High |

**Total estimated sprints:** 24-40

---

## Acceptance Criteria for "UX Reimagination Complete"

- [ ] Director Today page has ≤ 4 primary sections (Laws 4, 5)
- [ ] DONNA brief is the first element on Today page (Law 2)
- [ ] Curriculum health is the default curriculum view (Law 9)
- [ ] "Improve this level" button exists on every level card (Law 9)
- [ ] Sidebar has ≤ 6 items (5 + gear) (IA V2)
- [ ] DONNA surfaces count: ≤ 2 active per page (floating button + page brief) (Law 8)
- [ ] Static sparkline removed (data honesty, Law 11)
- [ ] No confidence badges in UI (Law 7 / DONNA audit)
- [ ] Setup checklist not on main dashboard (Law 4)
- [ ] 10-second test passes on Today and Curriculum pages (Law 6)
