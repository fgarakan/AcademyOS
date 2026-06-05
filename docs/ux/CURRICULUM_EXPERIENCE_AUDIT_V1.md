# Curriculum Experience Audit V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2101–2150
**Purpose:** Audit the complete curriculum experience through the lens of Linear, Apple, and OpenAI. Challenge every screen, workflow, label, and interaction.
**Method:** Analysis of curriculum/page.tsx (530+ lines), curriculum route tree, coverage model, bottleneck loader, DONNA curriculum modules.

---

## Current Curriculum Surface Inventory

| Route | Purpose | Entry Point |
|---|---|---|
| `/director/curriculum` | Overview, stage insight cards, level tree, health panel, DONNA context | Manual URL or breadcrumb |
| `/director/curriculum/builder` | Curriculum builder (default sidebar link) | Sidebar "Curriculum" |
| `/director/curriculum/level/[id]` | Individual level detail | Level tree click |
| `/director/curriculum/map` | Visual curriculum map | Unknown entry |
| `/director/curriculum/learning` | Learning modules preview | Unknown entry |
| `/director/curriculum/guided` | Guided curriculum assistant | Unknown entry |
| `/director/curriculum?improve=[levelKey]` | DONNA improvement context | URL hack only |
| `/director/curriculum/academy-version` | Academy version management | Unknown entry |

**Finding:** 8 curriculum sub-routes, only 1 accessible from the sidebar — and that one (`/builder`) is not the best starting point for a director trying to understand curriculum health.

---

## Workflow 1 — Understanding Curriculum Health

### What should happen

A director opens curriculum and immediately understands:
- Which levels are working well
- Which levels have problems
- What DONNA recommends fixing first

### What actually happens

1. Director clicks "Curriculum" in sidebar → lands at `/director/curriculum/builder`
2. Builder page shows a form/editor — not the health overview
3. To see health: director must navigate to `/director/curriculum` (separate URL, no obvious link)
4. Curriculum overview page renders:
   - `CurriculumBuilderWelcome` (marketing copy about curriculum)
   - `CurriculumStageInsightCard` × 5 (Red, Orange, Green, Yellow, High Performance)
   - `CurriculumLevelTree` (expandable tree of all levels)
   - `CurriculumHealthPanel` (A-F grades per level)
   - `CurriculumIntelligenceCard` (DONNA bottleneck signals)
   - "Curriculum Connections" section (4 static connection cards)
   - `DonnaCurriculumContextPanel` (DONNA improvement context, only when `?improve=` param is set)

### Friction inventory

| # | Friction | Impact |
|---|---|---|
| 1 | Health overview is not the default view — builder is | CRITICAL |
| 2 | 5 stage insight cards + level tree + health panel = three separate representations of the same data on one page | HIGH |
| 3 | `CurriculumBuilderWelcome` is marketing copy — directors don't need to be sold on curriculum, they need to use it | HIGH |
| 4 | "Curriculum Connections" section (4 static cards) occupies significant vertical space to explain how curriculum connects to players/sessions/notes/parents — this is foundational knowledge, not a daily workflow surface | MEDIUM |
| 5 | Health grades (A-F) are based on 3 of 8 dimensions — grades appear authoritative but are incomplete | HIGH |
| 6 | DONNA improvement context is only accessible via `?improve=[levelKey]` URL parameter — not discoverable | CRITICAL |
| 7 | `CurriculumIntelligenceCard` shows "top 3 concerns" with rank numbers but no clear action — what does the director do after seeing "Forehand consistency — 3 observations"? | HIGH |
| 8 | Level tree and stage insight cards coexist but serve the same navigation purpose | MEDIUM |
| 9 | No "curriculum summary in one sentence" — director must piece together health from multiple cards | HIGH |
| 10 | Coverage grades are shown on `/director/curriculum` but the player requirement data comes from different tables than the grade display — a director cannot trace a grade back to its source without technical knowledge | MEDIUM |

### What Linear would do

Linear's project health view is a single sentence: "3 of 7 milestones on track. 2 overdue. 1 blocked." Then it offers: "Show me what's blocking" → opens a filtered view.

**Applied to AcademyOS:** Curriculum landing page should be:
```
Your curriculum is 68% ready.
2 levels need attention: Orange Ball 2, Green Ball 1.
DONNA: "Orange Ball 2 has the most stalled players. Start there?"
```
One sentence. One recommendation. One action.

### What OpenAI would do

ChatGPT's landing asks: "What do you want to do?" It never makes you navigate to find your task.

**Applied to AcademyOS:** DONNA should open curriculum with: "Which level are you thinking about today?" or "I noticed Orange Ball 2 has 3 students stuck. Want me to walk you through improvements?"

---

## Workflow 2 — Improving a Curriculum Level

### What actually happens

1. Director somehow discovers the `?improve=[levelKey]` parameter (via DONNA suggestion, QA doc, or accident)
2. URL loads `/director/curriculum?improve=orange_ball_2`
3. `DonnaCurriculumContextPanel` appears with:
   - Level health summary
   - DONNA improvement suggestions (LOW/MEDIUM/HIGH confidence)
   - Evidence count (possibly 0)
   - Draft buttons for creating improvement proposals

### Friction inventory

| # | Friction | Impact |
|---|---|---|
| 1 | Entry point is a URL parameter — invisible to any director who doesn't know it exists | CRITICAL |
| 2 | No "Improve this level" button exists on any curriculum card or level detail page | CRITICAL |
| 3 | Improvement proposals go into two different queues: `proposed_actions` OR `academy_curriculum_overrides` — no UI indicates which queue received the draft | HIGH |
| 4 | Low confidence suggestions ("No player evidence yet") are shown prominently with the same visual weight as high-confidence suggestions | HIGH |
| 5 | Director cannot see: "if I accept this suggestion, what changes?" | HIGH |

---

## Workflow 3 — Template-Curriculum Connection

### What actually happens

Templates link to curriculum levels via `templates.curriculum_level_id`. This is director-managed.

1. Director navigates to `/director/templates` or `/director/class-templates/[templateId]`
2. Finds the curriculum level assignment field
3. Sets the level

Without this, `CoachSessionCurriculumPanel` shows nothing during sessions.

### Friction inventory

| # | Friction | Impact |
|---|---|---|
| 1 | Template-curriculum connection is invisible from the curriculum page — there's no "3 of 8 templates unlinked" signal | HIGH |
| 2 | A director who hasn't set up template-curriculum links doesn't know the coach experience is broken | HIGH |
| 3 | The curriculum intelligence card on the homepage shows template coverage gaps but doesn't link to the fix | MEDIUM |

---

## Workflow 4 — Level Advancement

### What actually happens

1. Director navigates to a player profile, Skill Path tab
2. Sees advancement readiness signal
3. Can assign/change curriculum level via `CurriculumLevelPickerCard`
4. Advancement must be an explicit director action

### What's hidden

- `advancementReadyCount` is computed and shown as a KPI on the dashboard — but clicking it goes to `/director/players` (the full player list), not a filtered "advancement ready" view
- Player advancement history is not visible on the curriculum level page — a director cannot see "who has been through Orange Ball 2 and what happened to them"

### Friction inventory

| # | Friction | Impact |
|---|---|---|
| 1 | Advancement-ready players are a number on the dashboard but not a list anywhere | HIGH |
| 2 | No "advance player" action from the curriculum level view — must go to player profile | HIGH |
| 3 | Level exit criteria (gates) are defined in the curriculum but the director has no "gate completion progress" view across all players at that level | HIGH |

---

## Comparative Analysis

### What would Linear do with curriculum?

**Linear's project structure:** Milestones → Issues → Sub-issues. Everything is treelike. Status is always visible. You can see "project health" in a single line item.

**For AcademyOS:**
- Curriculum levels are like projects
- Gates are like milestone criteria
- Players are like issue assignees
- Level advancement is like milestone completion
- DONNA is like Linear's AI issue suggestion

Linear would show: A kanban-style level board. Each level card shows: enrolled count, stuck count, average days at level, health grade. One-click to see who's stuck and why.

### What would Apple do with curriculum?

**Apple's UX principle:** Reduce to the essential. Remove until it breaks. What's left is the product.

Apple would ask: What does a director NEED to see about curriculum?
- Answer: "Are my students progressing?"
- Secondary: "What should I change?"

Everything else is detail. Apple would build a single screen: curriculum health in 5 numbers (one per stage), then DONNA below with today's recommendation.

### What would OpenAI do with curriculum?

**OpenAI's product principle:** The AI is the interface.

For curriculum, DONNA would be the primary interface:
- "How is Orange Ball doing?" → DONNA answers with health data
- "Who's stuck?" → DONNA lists stalled players
- "What should I change first?" → DONNA gives a ranked recommendation
- The director approves, rejects, or asks for more context

The "page" is just the evidence DONNA uses to reason.

---

## Top 10 Curriculum UX Problems

| # | Problem | Severity | Root Cause |
|---|---|---|---|
| 1 | Curriculum improvement is invisible — requires URL hack | CRITICAL | No improvement entry point in UI |
| 2 | Sidebar "Curriculum" goes to builder, not health | CRITICAL | Wrong default destination |
| 3 | Health grades are based on 3/8 dimensions but look complete | HIGH | Coverage model limitation + no transparency |
| 4 | Three representations of the same hierarchy on one page | HIGH | No IA decision about primary view |
| 5 | DONNA intelligence is present but requires user to find it | HIGH | Intelligence not surfaced by default |
| 6 | Template-curriculum gaps invisible from curriculum view | HIGH | No cross-surface signal linking |
| 7 | Advancement-ready count is a number, not a list | HIGH | KPI tile links to wrong destination |
| 8 | No "improve this level" button anywhere | HIGH | Feature access requires URL knowledge |
| 9 | Improvement queue routes (proposed_actions vs overrides) invisible | MEDIUM | Two pipelines with no UI distinction |
| 10 | Marketing copy (CurriculumBuilderWelcome) on operational page | MEDIUM | Page not designed for daily use |

---

## Recommended Curriculum Experience

### Single-sentence principle
**A director should see curriculum health, then act on it, without navigating.**

### New curriculum flow
```
/director/curriculum (default destination for sidebar)
  ↓
DONNA brief: "Orange Ball 2 needs attention. 3 players stuck, gate coverage 45%."
  ↓
[5 level cards — health grade, enrolled count, stuck count, last action]
  ↓
Click any level card → level detail with:
  - DONNA recommendation (preloaded, no URL hack)
  - Players at this level (list, not count)
  - Gate completion breakdown
  - [Improve this level] button → opens DONNA improvement panel
  - [Advance players] button → opens advancement list
  ↓
Improvement panel:
  - DONNA suggestion ranked 1/2/3
  - Each suggestion has: what changes, confidence level, evidence count
  - [Create improvement draft] → single action, single queue
```
