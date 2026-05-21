# Curriculum UI QA Checklist

**Sprint:** 563 — UX Polish
**Date:** 2026-05-21
**Covers:** Sprints 554–563 (Phase 1 of Mega Sprint 554–603)

---

## Pre-test setup

- [ ] Sign in as `academy_director`
- [ ] Navigate to `/director/curriculum`
- [ ] Confirm curriculum data is present (levels, gates, drills)

---

## Sprint 554 — Dimension Breakdown

- [ ] `CurriculumHealthPanel` shows "Coverage Dimensions" section
- [ ] Green tiles for tracked dimensions: Exit Gates, Drills, Coach Language, Competition Track, Fitness Guidance, Volume Guidance
- [ ] Gray tiles for not-tracked: Skills, Assessment Criteria, Missions, Badges, Parent Guidance, Learning Modules
- [ ] Counts shown in green tiles match actual data
- [ ] Partial-score disclaimer visible above dimension grid

---

## Sprint 555 — Health Score V2

- [ ] Overall A–F grade visible at top right of health panel
- [ ] "gates · drills · language" sub-label appears under the score number
- [ ] Score is consistent with per-level breakdown
- [ ] No regression: per-level bars, critical gaps, summary counts still render

---

## Sprint 556 — Curriculum Level Tree

- [ ] "Curriculum Levels" section visible on page (above Advanced tools)
- [ ] 5 stage sections: Red Ball, Orange Ball, Green Ball, Yellow Ball, High Performance
- [ ] Each stage shows correct level count
- [ ] Each level row shows: level name + gate/drill/coach language counts
- [ ] Stages are collapsible (click header to toggle)
- [ ] All stages open by default

---

## Sprint 561 — Search + Filter

- [ ] Search bar visible above tree
- [ ] Typing filters level rows in real time
- [ ] Matching is case-insensitive
- [ ] "X of Y" count shown in stage header when filtering
- [ ] Empty search shows full tree (all stages open)
- [ ] No-match message appears when query has zero results
- [ ] Clear button (×) resets search

---

## Sprint 557 — Node Drawer

- [ ] Clicking a level row opens the node drawer
- [ ] Drawer appears from the right (desktop)
- [ ] Drawer covers full width on mobile
- [ ] Backdrop appears behind drawer
- [ ] Clicking backdrop closes drawer
- [ ] Close button (×) in drawer header closes drawer
- [ ] Drawer header shows: stage label + level name
- [ ] Drawer has 4 tabs: Content | Draft | DONNA | Preview
- [ ] "Content" tab shows `CurriculumLevelDetailPanel` (gates, drills, coach language)
- [ ] Switching levels resets drawer to "Content" tab

---

## Sprint 558 — Draft Entry Panel

- [ ] "Draft" tab in drawer renders `CurriculumDraftEntryPanel`
- [ ] Orange "Draft only" disclaimer visible
- [ ] Three content type options: Exit Gate, Drill, Coach Language
- [ ] Each option links to the correct builder route
- [ ] "Coming soon" note appears for unsupported types

---

## Sprint 559 — DONNA Node Add Card

- [ ] "DONNA" tab in drawer renders `DonnaCurriculumNodeAddCard`
- [ ] DONNA safety disclosure visible
- [ ] Text area accepts input
- [ ] "Draft with DONNA" button disabled until 6+ characters entered
- [ ] Submitting shows draft preview card with lime border
- [ ] Preview card shows original input in italics
- [ ] Orange approval reminder visible in preview
- [ ] "Open in Builder" link appears after draft
- [ ] "Reset" button clears the draft

---

## Sprint 560 — Parent/Player Preview

- [ ] "Preview" tab in drawer renders `CurriculumNodePreview`
- [ ] Toggle between "Player" and "Parent" views
- [ ] Active role button has lime background
- [ ] Player view: shows "What I'm working on", gate count, drill count
- [ ] Parent view: shows level name, stage, "what they're working on"
- [ ] Parent view disclaimer: "Parent views never show internal gate criteria..."
- [ ] No internal coach notes or gate detail in parent view

---

## Sprint 562 — Mobile/Tablet

- [ ] Level tree is readable on 375px width
- [ ] Drawer covers full width on mobile (no horizontal overflow)
- [ ] Tabs inside drawer are scrollable on narrow screens
- [ ] Search bar usable on touch devices
- [ ] Health panel dimension grid wraps to 2 columns on mobile

---

## Sprint 563 — UX Polish

- [ ] No broken layouts or overflowing text at any width
- [ ] No console errors on `/director/curriculum`
- [ ] TypeScript: `npx tsc --noEmit` exits clean
- [ ] All new components render without visible hydration errors
- [ ] Smooth fade-in transitions on drawer open

---

## Security / data safety

- [ ] No coach notes exposed in parent/player preview
- [ ] No gate criteria shown in parent preview
- [ ] No assessment scores shown in parent preview
- [ ] No unapproved curriculum drafts marked as official
- [ ] Draft entry panel links to builder (no direct DB write from this UI)
- [ ] DONNA card shows approval disclaimer prominently

---

## Known limitations (expected failures — not regressions)

- Skills, Assessment Criteria, Missions, Badges, Parent Guidance, Learning Modules show "not tracked yet" — correct
- DONNA draft is not wired to a real AI API — input is echoed back as a placeholder
- Draft entry panel links to builder, does not pre-fill the form — follow-up sprint
