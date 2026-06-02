# Curriculum Builder Cognitive Load Audit

**Sprint:** Mega Sprint 1231-1245
**Date:** 2026-06-02

---

## Screens audited

| Screen | Route | Primary job | Primary action |
|---|---|---|---|
| Builder landing | `/director/curriculum/builder` | Entry + orientation | Start Guided Review |
| Level builder | `/director/curriculum/level/[id]` | Edit a specific level | Propose a Change |
| Level builder shell | (inside level builder) | View all level content | Navigate tabs |
| DONNA panel | (sidebar on level builder) | Guide editing | Type a request |

---

## Builder Landing Page — Findings

**Scroll depth:** 3+ screens to reach bottom  
**Buttons visible above fold:** 6 (Start Guided Review, Review Incomplete, Jump to Level, Ask DONNA, Advanced Settings, Ask DONNA for Priorities)  
**DONNA prominence:** Present but competing with 3 informational sections below it

| Finding | Severity | Type |
|---|---|---|
| "How It Works" tutorial takes 1/3 of visible screen — not operational content | High | Cognitive noise |
| "Master Curriculum Overview" — 5 pathway cards are informational, not actionable | High | Cognitive noise |
| Keyboard shortcuts section — low-value, adds scroll depth | Medium | Clutter |
| 6 action buttons compete equally — no clear primary vs secondary hierarchy | High | Competing CTAs |
| No "What needs attention" DONNA brief — director has no state awareness on landing | High | Missing information |
| "Curriculum Command Center" breadcrumb label is vague | Low | Label |

**Fix:** Collapse "How It Works" and "Master Curriculum Overview" behind `<details>` elements. Remove keyboard shortcuts section. This trims ~400px of vertical clutter and makes DONNA + pending modifications the first actionable content.

---

## Level Builder Page — Findings

**Scroll depth:** "Propose a Change" panel is ~3-4 screens below the fold  
**Buttons above the Propose a Change panel:** 10–17 (5 cards × 2 buttons each, plus nav)  
**DONNA prominence on mobile:** Not present in main column; action chips only in sidebar

| Finding | Severity | Type |
|---|---|---|
| "Propose a Change" (PRIMARY action) is buried below 5 section cards | Critical | Action visibility |
| 3 info cards (Level Goal, Development Intent, Evidence) are read-only context — not actionable | High | Cognitive noise |
| Mobile DONNA card is informational only (no chips or input) | High | Missing action |
| Each section card has identical "Ask DONNA" + "Add" buttons — 10 repetitive small buttons | High | Button clutter |
| 5-section grid shows "Player Missions" always as "Empty" — creates false alarm | Medium | Noise |
| No health snapshot visible near the top — director doesn't know level status at a glance | Medium | Missing information |
| "Detailed Content View" subtitle "(tab view: drills, gates, fitness...)" is UI implementation detail | Low | Label |
| "Review Queue" mentioned in draft banner — should say "Pending Modifications" | Low | Label |

**Fix:**
- Move "Propose a Change" panel ABOVE the 5-section grid
- Collapse 3 info cards behind `<details>` (collapsed by default)
- Add health snapshot (N of 4 sections have content) above the grid
- Add inline mobile DONNA chip strip (quick action row)
- Reduce section card buttons to single "Ask DONNA to improve" action
- Replace "Review Queue" → "Pending Modifications" in draft banner

---

## DONNA Panel — Findings

| Finding | Severity | Type |
|---|---|---|
| Text input is at the BOTTOM — below all action chips and health status | High | Action visibility |
| On a long level with many action chips, director has to scroll inside the panel to reach the input | High | Hidden action |
| Placeholder "Ask DONNA anything…" is too generic — should be intent-specific | Medium | Label |
| "AI Curriculum Assistant · Ready" — good |  | ✓ OK |
| Action chips are well-designed | | ✓ OK |

**Fix:** Move text input to the TOP of the DONNA panel, above action chips. Update placeholder text per mode.

---

## Label replacement map

| Before | After | Where |
|---|---|---|
| "Review Queue" (in draft mode banners) | "Pending Modifications" | Level builder banners |
| "Advanced Editor" | (already renamed "Detailed Content View") | Level builder |
| "Detailed Content View" subtitle | "Drills, gates, fitness, and coach language" | Level builder |
| "Curriculum Command Center" | "Curriculum" | Builder landing breadcrumb |

---

## 5-second comprehension test

**Before fixes:**
- Builder landing: "Where am I? What do I do first?" — unclear (6 competing actions)
- Level builder: "Where is Propose a Change?" — requires scrolling past 5 cards

**After fixes:**
- Builder landing: DONNA hero → pending modifications → 3 quick actions — clear
- Level builder: DONNA chips + "Propose a Change" visible before scroll → clear

---

## Files changed

| File | Changes |
|---|---|
| `CurriculumSetupBuilder.tsx` | Collapse How It Works + Overview; remove keyboard shortcuts; label fix |
| `CurriculumLevelBuilderExperience.tsx` | Move Propose a Change up; collapse info cards; health snapshot; mobile chips; label fix |
| `CurriculumDonnaPanel.tsx` | Move input to top; update placeholder |
| `CurriculumLevelBuilderGrid.tsx` | Reduce per-card button clutter |
