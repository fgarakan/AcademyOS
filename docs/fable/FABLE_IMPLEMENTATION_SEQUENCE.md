# Fable Director UX — Implementation Sequence V1

**June 2026**
**Scope: Tier 1 only (Today Page). Tier 2 not planned here.**

---

## Guiding Constraint

Each sprint leaves the director experience better than it found it. No sprint should require two sprints to recover from. Every change is independently shippable.

This means:
- Sprint A can ship without Sprint B being complete
- Sprint B does not depend on Sprint A being reverted
- TypeScript must be clean after every sprint
- No regressions in data or approval flows

---

## Sprint Sequence

### Sprint 2051–2080 — Fable Today Page V1: DONNA Brief + Decisions

**Mission:** The hero and decisions become the primary surface. Everything else disappears or collapses.

**Files to create:**
- `src/app/director/_components/DonnaCommandBrief.tsx` — unified hero that absorbs `AcademySituationBanner`. Contains: situation label, severity dot, greeting, primary action CTA, work queue count link.
- `src/app/director/_components/DonnaAlertsAndMomentum.tsx` — single card: 3 alerts (top) + divider + 3 wins (bottom). No separate panel headers.

**Files to modify:**
- `src/app/director/page.tsx`:
  - Remove `AcademySituationBanner` import and render
  - Remove `DonnaWorkQueue` import and render
  - Remove `DonnaActionTimeline` import and render
  - Add `DonnaCommandBrief` (replaces both banner + hero)
  - Replace `TopThreeAlertsPanel` + `TopThreeWinsPanel` with `DonnaAlertsAndMomentum`
  - Pass `workQueueSummary.totalPending` to `DonnaCommandBrief`
- `src/app/director/_components/DirectorDecisionCenter.tsx`:
  - Layout: stack → 3-col grid (`grid grid-cols-1 lg:grid-cols-3 gap-4`)
  - Remove `decisionPrompt` field from each card
  - Compress padding: `p-4` → `p-3` internally
  - Route button label: "Open" instead of "Review"
- `src/app/director/_components/WhatChangedPanel.tsx`:
  - `useState(true)` → `useState(false)` (collapsed by default)
- `src/app/director/page.tsx`:
  - Wrap `<DonnaCOOPanel>` in a collapsible container (collapsed by default)

**Files not touched:**
- `DonnaWorkQueue.tsx` (kept for other uses, removed from Today render)
- `DonnaActionTimeline.tsx` (kept for future /activity page)
- `AcademySituationBanner.tsx` (kept in case other pages need it)
- `TopThreeAlertsPanel.tsx` / `TopThreeWinsPanel.tsx` (kept for Tier 2 pages)
- All engine and data files

**Migration:** None
**New tables:** None
**Risks:**
- `DonnaCommandBrief` must carry all data that both `AcademySituationBanner` and `DonnaDailyBriefHero` currently receive. Prop interface must include: `situation`, `brief`, `directorName`, `primaryPriority`, `primaryTarget`, `workQueuePendingCount`.
- `DirectorDecisionCenter` layout change from stack to 3-col must be responsive-tested. Mobile must still stack.
- `DonnaCOOPanel` collapsed wrapper: use a standard Disclosure/button pattern, no new dependencies.

**Validation:**
- TypeScript clean
- All existing certifications still pass
- Review queue still works (unrelated to this sprint)
- `buildWorkQueueSummary` still runs (just not rendered as a card)

**Commit message:** `Sprint 2051–2080 — Fable Today Page V1: DONNA Brief + Decisions`

---

### Sprint 2081–2100 — Fable Today Page V2: Legacy Cleanup

**Mission:** Remove dead components from `_components/`. No UI change. Pure cleanup.

**Files to delete:** ~30 legacy components listed as DELETE in FABLE_COMPONENT_INVENTORY.md.

**Process:**
1. For each DELETE-marked component: confirm it has zero imports across the codebase (`grep -r "ComponentName" src/`)
2. Delete confirmed-unimported files
3. Run `npx tsc --noEmit`
4. Run `git status` to confirm only deleted files in diff

**Files to audit before deleting:**
- `DirectorKpiHealthSection` — check if `/director/kpi` imports it
- `DonnaSignalMeta` — check if any signals page imports it
- `buildMorningBriefNarrative.ts` — check if anything imports this helper

**Migration:** None
**New tables:** None
**Risks:** Low. All components are already not imported from primary pages. Confirm with grep before deleting each.

**Commit message:** `Sprint 2081–2100 — Fable Today Page V2: Dead Component Cleanup`

---

### Sprint 2101–2120 — Fable Review Queue V1 (Tier 2 begins)

**Not yet planned in detail.** Requires:
- Audit of `/director/review/page.tsx`
- Audit of `DonnaReviewBriefPanel` and related review components
- Fable spec for the approval surface

This sprint begins only after Tier 1 (Sprints 2051–2100) ships and director feedback confirms the Today page is correct.

---

## What Does NOT Get Planned Here

The following are intentionally deferred:

| Topic | Reason for deferral |
|---|---|
| `/director/donna` COO conversation page | Requires a new route. Out of scope for Today page sprints. |
| `/director/activity` action history page | Requires a new route. |
| Snapshot-based "What Changed" delta | Intelligence sprint, not UX sprint. |
| Philosophy inputs wiring | Separate data sprint. |
| Mobile layout audit | Follows desktop stabilization. |
| Player detail Fable pass | Tier 2. |
| Curriculum Fable pass | Tier 3. |

---

## Fable Completion Criteria

A screen is "Fable complete" when:
1. Director can state the screen's one job in one sentence
2. DONNA's output is the first thing the director sees (not a grid of widgets)
3. No panel that is always empty or always redundant remains visible
4. TypeScript is clean
5. All certifications pass
6. A director using the screen for 90 seconds knows exactly what to do next

---

## Relationship To Data Pipeline Sprints

Fable UX sprints and data pipeline sprints (like 2021–2050) are parallel tracks. They do not depend on each other. A data sprint can improve signal quality without touching UI. A Fable sprint can improve visual clarity without touching signal logic.

**Never combine a data sprint with a Fable UX sprint.** They have different risk profiles, different validation requirements, and different rollback strategies.
