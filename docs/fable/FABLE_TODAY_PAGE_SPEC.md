# Fable Director UX — Today Page Spec V1

**June 2026**
**Screen:** `/director` (Today)
**Principle: DONNA speaks. Director acts. One screen. One truth.**

---

## The Problem With The Current Today Page

The current Today page is architecturally correct but visually overwhelming. It has 10 distinct panels stacked vertically. A director who opens it sees:

1. A weather strip
2. A returning-director banner (conditional)
3. A hero greeting + primary action
4. Three decision cards
5. Alerts panel + Wins panel side by side
6. What Changed (expanded by default)
7. What Can Wait (collapsed)
8. 10 COO Q&A items
9. A work queue breakdown
10. An action history timeline

The system behind this is sound. The problem is that panels 6–10 compete with panels 3–5 for attention. A director doing a 90-second morning review doesn't need all ten panels. They need DONNA to orient them quickly, show them the 3 things that need a decision, and get out of the way.

**Fable answer:** Collapse panels 6–10. Surface only what the director needs to act. Everything else becomes opt-in.

---

## Fable Today Page — Target Layout

```
╔═══════════════════════════════════════════════════════════╗
║  DONNA BRIEF HERO                                         ║
║  ─────────────────────────────────────────────────────    ║
║  [situation label + severity dot]  [confidence • time]    ║
║                                                           ║
║  "Good morning, Farshad.                                  ║
║   Player progression needs your attention.                ║
║   The good news: 3 players advanced this week."           ║
║                                                           ║
║  ┌─────────────────────┐   [work queue: 5 pending ›]      ║
║  │ → Open Review Queue │                                  ║
║  └─────────────────────┘                                  ║
╚═══════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════╗
║  3 DECISIONS  ─────────────────────── DONNA decisions     ║
║  ┌─────────────────┐ ┌──────────────┐ ┌───────────────┐  ║
║  │ #1 Act now      │ │ #2 This week │ │ #3 This month │  ║
║  │ [title]         │ │ [title]      │ │ [title]       │  ║
║  │ [first step]    │ │ [first step] │ │ [first step]  │  ║
║  │ ● reliable      │ │ ● provisional│ │ ● provisional │  ║
║  │ [→ Open]        │ │ [→ Open]     │ │ [→ Open]      │  ║
║  └─────────────────┘ └──────────────┘ └───────────────┘  ║
╚═══════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════╗
║  ALERTS + MOMENTUM  ────────────────── combined strip     ║
║  ⚠ [alert headline]                       high            ║
║  ⚠ [alert headline]                       medium          ║
║  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    ║
║  ↑ [win headline]                         confirmed        ║
║  ↑ [win headline]                         provisional      ║
╚═══════════════════════════════════════════════════════════╝

▸  What changed since your last visit   [collapsed]
▸  What DONNA deferred                  [collapsed]

[returning director banner appears above hero when triggered]
[setup card replaces entire screen when academy not yet live]
```

---

## Section-by-Section Spec

### Section 1 — DONNA Brief Hero (REDESIGNED)

**Current:** Situation banner (separate strip) + Hero card (separate card)
**Fable:** One unified surface. Situation label lives inside the hero, not above it.

**Contents:**
- Top-left: situation type label + severity dot (inline, not a strip)
- Top-right: confidence badge + "updated N min ago"
- Greeting: DONNA-generated 2-3 sentence presence line (directorName + situation + one win)
- Below greeting: primary action button (e.g., "Open Review Queue")
- Below button: work queue count as a text link (e.g., "5 other actions pending →")

**What disappears from the hero:**
- The "Defer" button (too much escape hatch in the primary surface)
- The ExplainWhyModal trigger (move to decisions, not hero)
- The "deferred" collapsed state (if deferred, show nothing — don't show a "deferred" card)

**Implementation:** Merge `AcademySituationBanner` + `DonnaDailyBriefHero` into a single rearchitected component `DonnaCommandBrief` (or redesign `DonnaDailyBriefHero` to absorb the situation strip).

**Data:** No new data. Reads `situation`, `brief`, `directorName`, `primaryPriority`, `primaryTarget`, `workQueueSummary`.

---

### Section 2 — Director Decisions (KEEP, minor polish)

**Current:** 3 cards in a vertical stack on desktop, full width each
**Fable:** 3 cards in a horizontal grid (3 columns on lg+, stack on mobile)

**Changes:**
- Layout: `grid grid-cols-1 lg:grid-cols-3 gap-4` instead of stacked
- Each card: reduce internal padding (p-4 → p-3)
- Decision prompt: remove (generic prompts add no value — see Noise Report)
- Evidence section: collapse to icon + count instead of expanded list
- Confidence dot: keep (it is signal, not noise)
- Route button: rename "→ Open" instead of "Review" (shorter, clearer)

**No data change.** `DirectorDecisionCenter` receives the same `decisions` prop.

---

### Section 3 — Alerts + Momentum (COMPRESSED)

**Current:** Two equal-weight Card panels side by side
**Fable:** One Card, two sections separated by a hairline. No panel headers. Just the rows.

**Layout:**
```
┌─────────────────────────────────────┐
│ ⚠  [alert headline]       critical   │  ← alert row
│ ⓘ  [alert headline]       medium     │  ← alert row
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ ↑  [win headline]         confirmed  │  ← win row
│ ↑  [win headline]         provisional│  ← win row
└─────────────────────────────────────┘
```

**Implementation:** New shared component `DonnaAlertsAndMomentum` that takes `alerts` + `wins`, renders both sections inline. Replaces `TopThreeAlertsPanel` + `TopThreeWinsPanel` on Today page only. Those components stay alive for potential use elsewhere.

**No data change.**

---

### Section 4 — What Changed (COLLAPSED BY DEFAULT)

**Current:** Expanded by default, full card with header
**Fable:** Collapsed by default. Header row only visible. Click to expand.

**Change:** In `WhatChangedPanel`, invert `useState(true)` to `useState(false)`.

**One-line change. No data change.**

---

### Section 5 — What Can Wait (KEEP AS-IS)

Already collapsed by default. No change needed.

---

### Section 6 — DonnaCOOPanel (COMPRESS V1 / MOVE V2)

**V1 (this sprint):** Keep on page but compress.
- Default collapsed (shows only the panel header "DONNA — 10 Questions")
- Director opens accordion items individually
- No structural change

**V2 (future sprint after `/director/donna` page exists):** Remove from Today entirely. Link from hero to DONNA page.

**V1 change:** Add a collapsed-by-default wrapper around `DonnaCOOPanel`.

---

### Section 7 — DonnaWorkQueue (MOVE TO HERO)

**Current:** A full card panel below DonnaCOOPanel
**Fable:** The count lives as a text link in the hero. The panel is removed from Today.

```
[→ Open Review Queue]   5 other actions pending →
```

The work queue summary `byDomain` breakdown is not needed on Today. Directors click through to the domain pages. What they need to know is: there is pending work. The count is enough.

**No data change.** `buildWorkQueueSummary` still runs. `summary.totalPending` is surfaced in the hero. The `<DonnaWorkQueue>` card component is removed from Today.

---

### Section 8 — DonnaActionTimeline (REMOVE FROM TODAY)

**Current:** History feed at the bottom of Today
**Fable:** Not on Today. History is not a daily-action surface.

**Future:** Move to `/director/review` sidebar or a new `/director/activity` page.

**V1:** Remove the `<DonnaActionTimeline>` render from Today `page.tsx`. The component file stays. No data change.

---

### Returning Director Banner

No change to logic. The banner appears above the hero when triggered. Visual treatment stays.

---

## Data Requirements

**No new data queries for Fable Today V1.** All data already computed:
- `situation` — from `classifyAcademySituation`
- `brief` — from `buildDirectorDailyBrief`
- `decisionContext.decisions` — from `buildDirectorDecisionContext`
- `brief.alerts` — from `buildDirectorDailyBrief`
- `brief.wins` — from `buildDirectorDailyBrief`
- `whatChanged` — from `buildWhatChangedResult`
- `waitDecisions` — from `buildWaitDecisions`
- `workQueueSummary.totalPending` — from `buildWorkQueueSummary`

No new props. No new server actions. No migrations.

---

## Files To Touch In Fable Today V1

| File | Change |
|---|---|
| `src/app/director/page.tsx` | Remove `<DonnaActionTimeline>` and `<DonnaWorkQueue>` renders. Pass `workQueueSummary.totalPending` into hero. |
| `src/app/director/_components/DonnaDailyBriefHero.tsx` | Absorb situation into greeting. Add work queue count link. Remove defer button. |
| `src/app/director/_components/AcademySituationBanner.tsx` | Remove from page.tsx (its data moves into hero). Keep file for potential other uses. |
| `src/app/director/_components/DirectorDecisionCenter.tsx` | Change layout from stack to 3-col grid. Remove decision prompt. Compress padding. |
| `src/app/director/_components/WhatChangedPanel.tsx` | `useState(false)` default. |
| `src/app/director/page.tsx` | Wrap `<DonnaCOOPanel>` in collapsed container. |
| `src/app/director/_components/DonnaAlertsAndMomentum.tsx` | **NEW** — combined alerts + wins panel. |

**Files explicitly NOT touched:**
- Any component not listed above
- Any page outside `/director` route
- Any data fetching or engine logic
- Any migrations or database files

---

## Success Criteria For Fable Today V1

1. A director opening the page sees: greeting → 3 decisions → compact alerts/wins. That's it above the fold.
2. All secondary content (what changed, what waits, COO panel) requires a deliberate expand.
3. DonnaActionTimeline is gone from Today.
4. DonnaWorkQueue card is gone from Today; count is in hero.
5. Situation banner is gone as a separate strip; situation lives in the hero.
6. TypeScript: clean (0 errors).
7. No data regressions: all existing engine outputs still computed and passed.
