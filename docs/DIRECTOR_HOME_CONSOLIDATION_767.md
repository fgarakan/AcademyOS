# Sprint 767 — Director Home Consolidation: Today Command Center V1

**Date:** 2026-05-24
**Sprint:** 767
**Status:** Complete

---

## Summary

Consolidated the Director Home (`/director`) from three competing surfaces into one calm, unified experience. The primary change: `DirectorAttentionQueueHero` and `DonnaExecutiveCard` — two separate sections both showing "here's what needs your attention today" from the same underlying data — are replaced by a single `DirectorTodayCommandCenter` component that presents the priority queue in DONNA's voice. Page section count reduced from 13 to 11. Cognitive load significantly reduced.

No new DB queries. No new components beyond `DirectorTodayCommandCenter`. No schema changes. No mutations.

---

## Problem Diagnosed

Three competing surfaces on the same page answered the same question:

| Surface | Question it answered | Problem |
|---|---|---|
| `DirectorAttentionQueueHero` | "What needs your attention today?" | Attention queue items with category chips |
| `DonnaExecutiveCard` | "Here are the things that need attention today" | Same data, different framing — immediately below |
| Hero header "Today's Academy" link | Implied a different "today" view existed | `/director/today` is a separate route |

Additionally, two KPI surfaces appeared back-to-back:
- `AcademyKpiCardsSection` (8 visual KPI cards)
- `DirectorKpiHealthSection` (12 KPIs with formal threshold framework)

And Sessions This Week appeared at position #11 — far below the fold despite being the most actionable content after the priority queue.

---

## What Changed

### A — Created `DirectorTodayCommandCenter` (new component)

**File:** `src/app/director/_components/DirectorTodayCommandCenter.tsx`

Merges `DirectorAttentionQueueHero` + `DonnaExecutiveCard` into one unified surface.

- DONNA icon + "DONNA — Today's Command Center" header label
- Personalized greeting: "Name, here are N items that need your attention."
- Same attention queue items, category chips, priority borders, and numbered rows as `DirectorAttentionQueueHero`
- "Do this first" label on item #1
- DONNA safety disclaimer in footer: "DONNA flags items but takes no action without your explicit approval. All changes go through the review queue."
- "View all N items →" (overflowlink to `/director/review`) + "Ask DONNA →" (link to `/director/donna`)
- Empty state: "Today looks clear — DONNA sees no priority items right now."

Props: `queue: AttentionQueue`, `directorName?: string`, `showMax?: number` (default 5).

Data: unchanged — feeds from `buildAttentionQueue()` already computed in `page.tsx`.

### B — Removed from `page.tsx` render

| Item removed | Reason |
|---|---|
| `<DirectorAttentionQueueHero>` render | Replaced by `DirectorTodayCommandCenter` |
| `<DonnaExecutiveCard>` render | Replaced by `DirectorTodayCommandCenter` |
| `donnaItems: DonnaExecutivePriorityItem[]` array and all push calls | No longer consumed (was only used by `DonnaExecutiveCard`) |
| Import of `DonnaExecutiveCard, type DonnaExecutivePriorityItem` | No longer used |
| Import of `DirectorAttentionQueueHero` | No longer used |

### C — Added to `page.tsx`

| Item added | Reason |
|---|---|
| Import of `DirectorTodayCommandCenter` | New unified component |
| `<DirectorTodayCommandCenter queue={attentionQueue} directorName={directorDisplayName} showMax={5} />` | Replaces two separate sections |

### D — Section reordering

| Section | Before | After |
|---|---|---|
| DirectorTodayCommandCenter | — (new) | #2 (first operational section) |
| Academy Overview (KPI cards) | #4 | #3 |
| Sessions This Week | #11 | #4 (actionable — "What should I do next?") |
| Quick Actions | #12 | #5 |
| Roster Signals | #7 | #6 |
| Academy Health Signals | #8 | #7 |
| Health Chart + Live Activity | #6 | #8 (supporting, demoted) |
| Curriculum Coverage | #9 | #9 |
| First template prompt (conditional) | #10 | #10 |
| Academy KPI Health (detailed) | #5 | #11 (supporting analysis, demoted) |
| Academy Setup + Admin | #13 | #12 (unchanged, bottom) |

**Removed from main flow (merged into unified component):**
- `DirectorAttentionQueueHero` (section #2 before)
- `DonnaExecutiveCard` (section #3 before)

Net: 13 sections → 11 sections (2 merged into 1, remaining reordered).

---

## Preserved on Disk

These components are NOT deleted. They are simply no longer rendered on `/director`.

| File | Status |
|---|---|
| `src/app/director/_components/DirectorAttentionQueueHero.tsx` | Preserved — not rendered on /director |
| `src/app/director/_components/DonnaExecutiveCard.tsx` | Preserved — not rendered on /director |

Both remain available for reuse on other pages or future sprints.

---

## Page Hierarchy After Sprint 767

The page now answers the four questions in order:

| # | Section | Question answered |
|---|---|---|
| 1 | Hero Header + Health Badge | Who am I? What is the date? Academy health at a glance. |
| 2 | DirectorTodayCommandCenter | **What needs my attention today? What does DONNA recommend?** |
| 3 | Academy Overview (8-card KPIs) | **What is the academy health snapshot?** |
| 4 | Sessions This Week | **What should I do next?** (on-court actions) |
| 5 | Quick Actions | **What should I do next?** (navigation hub) |
| 6 | Roster Signals | Which players need attention or placement? |
| 7 | Academy Health Signals | What are the alert and suggestion signals? |
| 8 | Health Chart + Live Activity | Supporting trend data |
| 9 | Curriculum Coverage | Curriculum assignment status |
| 10 | First template prompt | Conditional setup nudge |
| 11 | Academy KPI Health (detailed) | Deep KPI analysis (supporting, not primary) |
| 12 | Academy Setup + Admin | One-time setup — revisit anytime |

---

## Cognitive Load Improvements

| Before | After |
|---|---|
| Two priority lists at the top showing the same data | One unified command center in DONNA's voice |
| Director reads "Today's Priorities" then "Donna — Executive Layer" | Director reads one surface: done |
| Two KPI sections back-to-back (#4 + #5) | KPI snapshot visible, detailed analysis demoted |
| Sessions This Week buried at position #11 | Sessions at position #4 — immediately actionable |
| Competing framing (attention queue hero vs. DONNA card) | DONNA narrates the priority queue — one voice |

---

## Safety Guardrails Preserved

- No new DB queries added — all data already computed in `page.tsx`
- No mutations — `DirectorTodayCommandCenter` is a pure read-only UI component
- No `proposed_actions` writes, no `execute_approved_action` calls
- No parent/player data exposed
- No DONNA dispatcher internals modified
- No SQL/RLS/migrations touched
- Role safety unchanged — `/director` is behind director middleware
- `donnaItems` removal: pure in-memory array, no DB side effects; all underlying variables remain in use

---

## TypeScript Validation

```
npx tsc --noEmit → EXIT 0 (clean)
```

No errors introduced or left unresolved.

---

## Protected Files Not Staged

| File | Status | Reason |
|---|---|---|
| `docs/SPRINT_398_MANUAL_SQL_EXECUTION_PACKET.md` | Pre-existing modified | Unrelated to Sprint 767 |
| `src/app/api/director/interview/realtime-session/route.ts` | Pre-existing modified | Unrelated to Sprint 767 |
| `src/components/assistant/DonnaAssistantButton.tsx` | Pre-existing modified | DONNA operator-step changes — needs dedicated sprint |
| `.qa-voice-intake-temp.mts` | Temp file | Never touched |
| `supabase/migrations/*` | Untracked | Never touched |
| `data/*`, `Academy_OS_Master_Build/*` | Untracked | Never touched |

---

## Recommended Sprint 768

**Sprint 768 — Director Home Today Command Center QA + Demo Script V1**

Goal: Manual QA pass on the consolidated Director Home (Sprint 767). Verify:
- `DirectorTodayCommandCenter` renders correctly with live data and empty state
- No duplicate priority lists visible
- Sessions This Week is immediately visible below KPI snapshot
- `DirectorKpiHealthSection` is accessible but not in primary view
- DONNA safety disclaimer footer is present
- All links are safe (read-only navigation only)
- TypeScript: clean

Output: QA doc + 5-minute demo script update + final decision: DEMO-READY / NEEDS WORK.

Documentation only unless a blocker is found.
