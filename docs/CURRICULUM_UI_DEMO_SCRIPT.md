# Curriculum UI Demo Script

**Sprint:** 563 — UX Polish
**Date:** 2026-05-21
**Audience:** Academy directors, pilots, internal reviews

---

## Setup

1. Sign in as `academy_director` (or use demo account)
2. Navigate to `/director/curriculum`

---

## Act 1 — Curriculum Health Overview (~2 min)

**Goal:** Show the director a live coverage snapshot of their curriculum.

**Steps:**
1. Open `/director/curriculum`
2. Point to the **Curriculum Health** card
3. Say: *"This panel shows how complete your curriculum is right now — we grade it A through F based on what's connected."*
4. Point to the A–F grade and score: *"Right now we're grading on exit gates, drills, and coach language. The score tells you at a glance whether each level has what coaches need."*
5. Scroll to the **Coverage Dimensions** grid:
   *"Green tiles are dimensions we're already tracking. Gray tiles are dimensions we'll track once they're connected — skills, missions, badges."*
6. Point to per-level bars: *"Each level gets its own grade. Clicking into a level lets you drill down."*

---

## Act 2 — Level Tree Navigation (~2 min)

**Goal:** Show the tree view and how to find a specific level.

**Steps:**
1. Scroll to the **Curriculum Levels** section
2. Say: *"Here's a live tree of every level in your curriculum, grouped by stage."*
3. Type "orange" into the search bar: *"Search finds levels in real time — useful when you have 15+ levels and need to jump to a specific one."*
4. Clear the search
5. Collapse "Red Ball" stage by clicking its header: *"Stages are collapsible so you can focus on what matters."*
6. Click any level row to open the drawer

---

## Act 3 — Node Drawer — Content Tab (~2 min)

**Goal:** Show rich level content without leaving the page.

**Steps:**
1. With the drawer open, point to the Content tab
2. Say: *"Every level has its exit gates, drills, and coach language — all in one place."*
3. Scroll through the gates list, expand one gate: *"Gates are expandable — directors can review the exact evidence window and recording method."*
4. Click "Drills" tab and show a drill: *"Drills are tied to this level. Coaches see these in their session planner."*
5. Click "Coach Language" tab: *"This is what coaches say when giving feedback — standardised across the academy."*

---

## Act 4 — Drafting New Content (~2 min)

**Goal:** Show how a director drafts a change without committing anything.

**Steps:**
1. In the drawer, click the **Draft** tab
2. Say: *"When you spot a gap, you can start a draft right here."*
3. Point to the orange disclaimer: *"Nothing becomes official until you approve it in the Review Queue."*
4. Click "Draft new Drill": *"This takes you to the builder, pre-scoped to this level."*
5. Navigate back with browser back button

---

## Act 5 — DONNA Draft Flow (~2 min)

**Goal:** Show voice/text-driven curriculum drafting with DONNA.

**Steps:**
1. Open the drawer again, click the **DONNA** tab
2. Say: *"If you'd rather describe what you want than fill out a form, tell DONNA."*
3. Type: *"Add a gate for consistent crosscourt rally at 70% success over 10 shots"*
4. Click "Draft with DONNA"
5. Show the draft card: *"DONNA structures your input into a draft proposal — with a clear approval reminder."*
6. Say: *"The draft goes to the Review Queue — nothing is applied until you say so."*

---

## Act 6 — Parent/Player Preview (~1 min)

**Goal:** Show the role-based preview feature for building trust.

**Steps:**
1. In the drawer, click the **Preview** tab
2. Say: *"As director, you can preview exactly what players and parents see for this level."*
3. Toggle between Player and Parent views
4. Say: *"Parent view never shows gate criteria, coaching scores, or internal notes — only safe, encouraging content."*

---

## Closing (~30 sec)

*"Every piece of curriculum content is connected: from this tree, to the player's development profile, to the coach's session plan. The director stays in control — AI suggests, you approve."*

---

## Demo environment notes

- DONNA draft in Sprint 563 echoes input back as a placeholder — not wired to AI API yet
- Draft entry links to builder, does not pre-fill form — follow-up sprint
- Knowledge modules (skills, missions, badges) show "not tracked yet" — expected
