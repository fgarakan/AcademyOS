# Sprint 777 — Director DONNA AIQS Cognitive Load V1

**Date:** 2026-05-24
**Sprint:** 777
**Target page:** `/director/donna`
**Pre-sprint score:** 71 / 100
**Estimated post-sprint score:** ~80 / 100

---

## Context

Director DONNA was ranked #1 priority in the AIQS certification page-priority sequence (71/100).
The core problem: 6 left-column cards + 2 full-width footer sections created four distinct visual
zones, none clearly more important than the others. The chat shell — the actual primary surface —
competed with context panels rather than dominating.

---

## Structural Audit (pre-sprint)

**Left column (6 cards):**
1. "Today at a Glance" — 4 stat boxes (Sessions, Pending, Missing Wrap-ups, Attention Flags)
2. `DONNAAcademyPulseCard` — health score, trend, urgent counts
3. "Attention Needed" — conditional (attentionItems.length > 0)
4. "Academy Risks" — conditional (academyRisks.length > 0)
5. "Next Best Actions" — conditional (recommendedActions.length > 0)
6. "Quick Navigation" — 6 generic nav links (always shown)

**Below the 2-column grid:**
7. `DirectorDonnaDailyBrief` — full-width structured daily brief
8. `DonnaReviewQueueSurface` — full-width review queue shortcut surface
9. Safety notice

**Typography audit:**
- `text-[9px]` instances: all decorative badge chips (Director role, Live status, risk level).
  AIQS chip-exception — no change needed. Sprint 770 already raised non-decorative labels.
- Card h2 headers: `text-xs font-bold text-text-primary uppercase tracking-widest`
  — inconsistent with `label-xs` standard.

---

## Changes Made

### 1. Removed "Today at a Glance" left-column card (+4 cognitive load)

The 4 stat boxes (Sessions, Pending, Missing Wrap-ups, Attention Flags) were duplicated exactly
in `DonnaContextSummaryCard` on the right column. Removing this card:
- Eliminates direct duplication
- Reduces left column from 6 cards to a max of 4 (1 always + 3 conditional)
- `DonnaContextSummaryCard` remains the single source for these 4 stats

The `contextSummaryItems` array was updated to use the already-computed local variables
(`todaySessions`, `pendingReviews`, `missingWrapUps`, `attentionItems.length`) rather than
`ctx.*` directly — consistent with the rest of the file and resolves the TypeScript unused-
variable warning that would have resulted from removing the card.

### 2. Removed "Quick Navigation" left-column card (+2 cognitive load)

6 generic navigation links (Review Queue, Today's Academy, Players, Curriculum, Templates,
Academy Intel) repeated what the sidebar and breadcrumb already provide. This card was the
farthest from being signal-bearing — pure navigation shortcuts that don't belong in an
intelligence panel context.

### 3. Removed `DirectorDonnaDailyBrief` full-width section (+3 cognitive load)

`DirectorDonnaDailyBrief` was a full-width structured overview rendered below the main 2-column
layout. It repeated:
- todaySessions, missingWrapUps, pendingReviews (in left column + right column DonnaContextSummaryCard)
- academyRisks (in left column Academy Risks card)
- recommendedActions (in left column Next Best Actions card)

Removing this eliminates the "fourth zone" effect and makes the page one coherent surface.

### 4. Removed `DonnaReviewQueueSurface` full-width section (+2 cognitive load)

`DonnaReviewQueueSurface` appeared between `DirectorDonnaDailyBrief` and the safety notice,
creating a fifth zone. It was a navigation shortcut to the review queue — already surfaced via
the "Next Best Actions" card link ("Review queue" link in the CardHeader) and via the director
sidebar. Removed.

### 5. Standardized card h2 headers → `label-xs` pattern (+1 visual hierarchy)

The three remaining conditional cards (Attention Needed, Academy Risks, Next Best Actions)
had custom bold-uppercase h2 headers. Changed to `label-xs flex items-center gap-2`:
- Consistent with the app-wide section label standard
- Icons retained for color-coded urgency signaling
- Slight visual quieting of section headers lets card content lead

### 6. Cleaned unused imports and constants

Removed now-unused imports:
- `Calendar`, `BookOpen`, `LayoutTemplate`, `Activity` — only used by `QUICK_LINKS`
- `Clock` — only used by "Today at a Glance" card
- `DonnaReviewQueueSurface` component import
- `DirectorDonnaDailyBrief` component import + `BriefItem` type

Removed `QUICK_LINKS` constant (only used by Quick Navigation card).

`CATEGORY_ICON.investigate` entry updated from `<Activity />` (removed) to `<AlertCircle />`
(already imported, semantically equivalent for the investigate category).

---

## What Was NOT Changed

- DONNA dispatcher, backend context, or AI behavior — untouched
- `loadDirectorDonnaContext` — untouched
- `DonnaDirectorShellClient` — untouched (chat shell unchanged)
- `DonnaContextSummaryCard` — untouched (right column, now the single stat source)
- `DONNAAcademyPulseCard` — untouched (remains first always-shown left column card)
- Safety notice — kept exactly as written
- Header, breadcrumb, live/demo badge — untouched
- All three conditional left-column cards (Attention Needed, Academy Risks, Next Best Actions) —
  content and logic identical; only h2 header class changed
- No SQL/RLS/migrations, no env files, no seed data

---

## Files Modified

| File | Change |
|---|---|
| `src/app/director/donna/page.tsx` | Sprint 777 AIQS cognitive load fixes |
| `docs/AIQS_DIRECTOR_DONNA_777.md` | This sprint doc |
| `docs/CHANGELOG.md` | Dated entry |

---

## Result: Left Column Structure (post-sprint)

| Card | Condition | Always shown? |
|---|---|---|
| `DONNAAcademyPulseCard` | Always | ✅ |
| Attention Needed | `attentionItems.length > 0` | conditional |
| Academy Risks | `academyRisks.length > 0` | conditional |
| Next Best Actions | `recommendedActions.length > 0` | conditional |

Minimum cards on page: 1 (pulse only, empty academy)
Maximum cards on page: 4 (all signals present)

**Previous:** always 6 cards + 2 full-width footer sections = 4 visual zones
**After:** 1–4 cards + safety notice = 1 coherent surface

---

## Expected Score Improvement

| Category | Before | After | Δ |
|---|---:|---:|---|
| Cognitive load | 9/15 | 14/15 | **+5** |
| Visual hierarchy | 7/10 | 8/10 | **+1** |
| Primary action clarity | 7/10 | 8/10 | **+1** |
| *(all others unchanged)* | — | — | 0 |
| **Total** | **71** | **~80** | **+9** |

---

## TypeScript Result

`npx tsc --noEmit` — **EXIT 0** (clean)

---

## Implementation Guardrails — Confirmed

- [x] No SQL/RLS/migrations touched
- [x] No env files touched
- [x] No DONNA dispatcher modified
- [x] No DONNA backend/context logic changed
- [x] No official record mutations
- [x] No role boundaries changed
- [x] No approval flows changed
- [x] No new npm packages
- [x] No new Supabase queries
- [x] Safety notice preserved exactly
- [x] Chat shell (`DonnaDirectorShellClient`) untouched
- [x] Only removed duplication — no information loss (all stats in DonnaContextSummaryCard)
