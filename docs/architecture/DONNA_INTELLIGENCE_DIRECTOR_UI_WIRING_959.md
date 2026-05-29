# DONNA Intelligence Director UI Wiring V1
**Date:** 2026-05-29
**Sprint:** 959

---

## Purpose

Sprint 959 wires the first DONNA intelligence module — `donnaProactiveAlerts.ts` (Sprint 958) — into the director-facing UI at `/director/donna`. This makes DONNA's intelligence layer visible and actionable to directors rather than existing only as library code.

A new read-only component `DonnaIntelligenceSignalsCard` is inserted into the left column of the DONNA director page. It renders proactive alert objects sorted by urgency and provides navigation links to the relevant director routes.

---

## Modules wired

| Module | Sprint | Status |
|---|---|---|
| `donnaProactiveAlerts.ts` (`buildProactiveAlerts`) | Sprint 958 | **Wired in V1** |
| `donnaBottleneckDetection.ts` | Sprint 952 | V2 — requires per-player data feed |
| `donnaCoachIntelligence.ts` | Sprint 953 | V2 — requires per-coach data feed |
| `donnaCurriculumIntelligence.ts` | Sprint 954 | V2 — requires session-level data feed |
| `donnaParentCommunicationIntelligence.ts` | Sprint 955 | V2 — requires per-player/parent data feed |
| `donnaRecommendationLearning.ts` | Sprint 956 | V2 — requires outcome history feed |
| `donnaEvaluationHarness.ts` | Sprint 957 | Eval tool only — not wired in any production route |

---

## UI insertion point

**Route:** `/director/donna`
**File:** `src/app/director/donna/page.tsx`
**Position:** Left column, after `DONNAAcademyPulseCard`, before the conditional Attention Items card.

The DONNA director page (`/director/donna`) is the correct intelligence hub for this insertion:
- It already loads `DirectorDonnaContext` via `loadDirectorDonnaContext`, which provides `pendingReviews` and `missingWrapUps`.
- It already renders attention items, academy risks, insight engine results, and recommended actions.
- No new database queries are needed.

The director dashboard (`/director/page.tsx`) is **not touched** — it has its own alert system and is already at high query count.

---

## Data flow

```
loadDirectorDonnaContext(db, academyId)
  → ctx.pendingReviews    (number)
  → ctx.missingWrapUps    (number)
  → ctx.isLive            (boolean)
        ↓
DonnaIntelligenceSignalsCard
  → buildProactiveAlerts({
      pendingReviews:      ctx.pendingReviews,
      sessionsWithoutWrapUp: ctx.missingWrapUps,
      // reviewOldestDaysAgo: omitted → defaults to 0 → review_aging alert does NOT fire
      // parentSummariesReady: omitted → defaults to 0 → parent_summary_ready alert does NOT fire
    })
  → DonnaProactiveAlert[]  (sorted by urgency)
        ↓
  Renders each alert: urgency chip, headline, body, safetyNote, actionRoute link
  OR renders safe empty state if no alerts
```

No mutations. No network calls. No database writes. Pure derived rendering from ctx.

---

## Read-only guarantee

`DonnaIntelligenceSignalsCard` is a pure Server Component:
- No `useState`, no `useEffect`, no client-side logic.
- No `supabase` calls inside the component.
- `buildProactiveAlerts` is a pure TypeScript function — no side effects.
- All rendered links navigate to existing director-only routes (`/director/review`, `/director/sessions`).
- No parent or player data is displayed.
- No raw IDs, raw JSON, or sensitive fields are surfaced.

---

## Alert coverage in V1

| Alert type | Fires in V1? | Data available? | Threshold |
|---|---|---|---|
| `missing_wrap_ups` | **Yes** | `ctx.missingWrapUps` ✓ | ≥ 2 sessions missing |
| `review_aging` | No | `reviewOldestDaysAgo` not in ctx | Requires new query (V2) |
| `parent_summary_ready` | No | `parentSummariesReady` not in ctx | Requires new query (V2) |

When `missingWrapUps < 2` (or `= 0`), the card renders the safe empty state: "No active intelligence signals."

---

## Empty state behavior

When `buildProactiveAlerts` returns an empty array (no thresholds met), the card shows:

> "No active intelligence signals."  
> "Signals appear when sessions are missing wrap-ups or review items age."

No fake data is introduced. No alerts are manufactured to look populated.

---

## Safety boundaries

- No parent/player communication is dispatched.
- No `proposed_actions` records are created.
- No approval gates are bypassed.
- No player level, placement, roster, billing, attendance, or curriculum changes.
- `isLive` prop controls a "Demo" badge — does not affect alert logic.
- All `actionRoute` values in alert objects are director-only routes pre-defined in `donnaProactiveAlerts.ts`.

---

## DONNA highlight target

The card wrapper carries:
```html
data-donna-focus-id="donna-intelligence-signals"
```

This allows DONNA's what-next engine and highlight system to focus on this card when relevant (e.g., when asking "what should I look at?").

---

## What remains V2

| Feature | Reason deferred |
|---|---|
| `review_aging` alert | Needs `reviewOldestDaysAgo`: age of oldest pending proposed_action (new query) |
| `parent_summary_ready` alert | Needs `parentSummariesReady`: count of approved parent-safe summaries awaiting send (new query) |
| Player bottleneck signals (Sprint 952) | Needs per-player data feed — not in ctx |
| Coach follow-through signals (Sprint 953) | Needs per-coach data feed — not in ctx |
| Curriculum execution gap signals (Sprint 954) | Needs session-level data feed — not in ctx |
| Parent communication opportunities (Sprint 955) | Needs per-player/parent data feed — not in ctx |
| Recommendation learning weight display (Sprint 956) | Needs outcome history aggregation |

V2 can extend `loadDirectorDonnaContext` to include the missing fields, then pass them as additional props to `DonnaIntelligenceSignalsCard`.

---

## Certification impact

Sprint 959 delivers the first visible connection between DONNA's intelligence library layer and the director UI. For Sprint 960 DONNA God Mode certification:

- Directors can now see proactive alerts in the DONNA page when wrap-up coverage drops.
- The intelligence surface has a DONNA highlight target.
- The signals card is low-noise by design — it only shows alerts when thresholds are genuinely met.
- V2 data feeds (review aging, parent summaries, per-player/coach intelligence) are needed to fully certify God Mode across all 7 intelligence modules.
