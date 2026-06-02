# Curriculum Builder Simple Screen Standard

**Sprint:** Mega Sprint 1231-1245
**Last updated:** 2026-06-02

---

## Core principle

> Deep curriculum system. Simple builder screen. DONNA handles complexity.

A director should understand **where they are, what the page does, and what to do next** within 5 seconds.

---

## Screen structure rules

### Builder landing page (`/director/curriculum/builder`)

**Must show above fold:**
1. DONNA hero (primary orientation + entry point)
2. Pending Modifications (if any — via CurriculumBuilderChangeQueue)
3. 3–4 primary action buttons

**Must be collapsed by default:**
- "How it works" tutorial content
- Curriculum map / pathway overview
- Keyboard shortcuts

**Rationale:** Tutorial content is only useful the first time. Operational directors should see state (pending mods) and actions, not tutorial material every visit.

### Level builder page (`/director/curriculum/level/[id]`)

**Default visible (max 5 major sections):**
1. Level name + stage + navigation strip
2. Draft safety note (compact, 1 line)
3. Health snapshot (N of 4 sections have content — color coded)
4. **Propose a Change** — primary action, above the section grid
5. Section grid (5 cards, each with single "Ask DONNA to improve" action)

**Collapsed by default:**
- Level context (goal, development intent, evidence)
- Full Content Details (drills/gates/fitness/competition/coach language)

**Rationale:** "Propose a Change" is the primary action. It was buried below 5 section cards. Moving it above ensures the director reaches the main action without scrolling.

### DONNA panel (sidebar on level builder)

**Input position:** Top of panel — immediately reachable on open
**Action chips:** Below the input — for discovery, not the primary path
**Placeholder:** Contextual — "What would you like to improve in this level?" on level pages

**Rationale:** The input box was at the bottom, requiring scroll inside the panel. Moving it to the top makes DONNA immediately actionable.

---

## Maximum visible elements

| Location | Max above fold |
|---|---|
| Builder landing | 6 elements (DONNA card + pending mods + 3 action buttons) |
| Level builder main column | 5 sections before scroll |
| Level builder sidebar | DONNA panel + change queue (max-height constrained) |
| Section cards | 1 action button each |
| Mobile | Same structure, change queue below draft panel |

---

## Progressive disclosure pattern

Items that go behind `<details>` (collapsed by default):
- Tutorial content (How it works)
- Reference content (pathway overview, curriculum map)
- Historical context (level goal, intent, evidence)
- Detailed content (all drills/gates/fitness/competition tabs)
- Advanced settings

Items that stay visible:
- Current state (pending modifications, health snapshot)
- Primary action (Propose a Change)
- DONNA prompt
- Navigation (prev/next level)

---

## Label standards

| Use this | Not this | Context |
|---|---|---|
| Pending Modifications | Review Queue | Builder UI, status banners |
| Full Content Details | Advanced Editor, Detailed Content View | Level builder collapse label |
| Curriculum | Curriculum Command Center | Breadcrumb label |
| Drills, gates, fitness… | tab view: drills, gates, fitness… | Subtitle text |

---

## Button count targets

| Screen | Target | Before fix | After fix |
|---|---|---|---|
| Level builder above primary action | < 5 | 10–17 | 3 (nav + draft) |
| Per section card | 1 | 2 | 1 |
| Builder landing | ≤ 4 primary | 6 | 4 |

---

## Mobile rules

1. DONNA chip strip visible inline (above draft panel)
2. Pending modifications visible below draft panel
3. No two-column dependency — sidebar is fully mirrored inline
4. Primary action (Propose a Change) reachable without sidebar scroll
5. Tap targets: all interactive elements ≥ 36px height

---

## Do not

- Do not remove curriculum logic or approval rules
- Do not hide the pending modifications queue
- Do not hide the section grid (it shows content health)
- Do not collapse the health snapshot — it gives at-a-glance status
- Do not make "Propose a Change" a secondary action
