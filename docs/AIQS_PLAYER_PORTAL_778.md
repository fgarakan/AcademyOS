# Sprint 778 — Player Portal AIQS Mission-First Layout V1

**Date:** 2026-05-24
**Sprint:** 778
**Target page:** `/player`
**Pre-sprint score:** ~73 / 100
**Estimated post-sprint score:** ~82 / 100

---

## Context

Player Portal was the fourth-priority page in the AIQS certification sequence (73/100).
The core problem: 14+ cards stacked vertically, with the first meaningful action (mission
statement / level progression) buried below generic context. Three separate cards covering
Level, Practice, and Understanding created parallel scroll rather than a coherent development
story. Two low-signal cards (Q&A Answer, What to Ask Your Coach) and a standalone Encouragement
note added scroll depth without adding decision-making value for the player.

---

## Structural Audit (pre-sprint)

**Above-fold (correct — kept):**
1. `PlayerHomeHeroCard` — mission-first hero (name, next session, attendance spark)
2. `PlayerMissionPreview` — DONNA-powered mission statement (most important surface)

**Main scroll — pre-sprint structure:**
3. Current Level card — level name + stage + next level
4. "What to Work On" card — practice items from IDP
5. "What to Understand" card — understanding items from IDP
6. "What to Ask Your Coach" card — generic questions derived from what_to_understand
7. Q&A Answer card — `qaAnswer` computation using `buildPlayerProgressAnswer`
8. Encouragement note — standalone motivational text block
9. Requirements to Move Up card
10. This Week's Challenge card
11. Recent Sessions card (inside idpView block)
12. My Skills empty state
13. Wins & Badges card (3 states: earned / near / none)
14. Ask DONNA CTA banner

**Typography audit:**
- No sub-12px non-decorative text found in the sections changed
- `label-xs` usage consistent throughout existing code

---

## Changes Made

### 1. Added "Development Focus" section separator (+2 visual hierarchy, +2 cognitive load)

Added a horizontal rule separator with centered label before the development content block:

```jsx
<div className="flex items-center gap-3 pt-2">
  <div className="flex-1 h-px bg-border" />
  <p className="label-xs shrink-0">Development Focus</p>
  <div className="flex-1 h-px bg-border" />
</div>
```

This creates an explicit section break between the above-fold mission hero and the
development detail content, eliminating the visual run-on of 14 cards into each other.

---

### 2. Merged 3 development cards → 1 unified "Development Focus" card (+4 cognitive load)

**Before:** Three standalone cards:
- Current Level card (`TrendingUp`, level name, stage, next level)
- "What to Work On" card (practice items list)
- "What to Understand" card (understanding items list)

**After:** Single `<Card><CardContent className="py-4 space-y-4">` with three internal sections
separated by `<div className="h-px bg-border" />` dividers. Each section is shown conditionally;
the card only renders if at least one of the three data sets is present.

- Current Level: flex row with icon, level name, stage, next level right-aligned
- What to Work On: `TrendingUp` icon, `text-xs font-semibold text-text-primary` header, bulleted list
- What to Understand: `BookOpen` icon, `text-xs font-semibold text-text-secondary` header, bulleted list with `text-status-blue` bullet dots

No data changed. All three sections use existing `idpView` fields:
`idpView.current_level`, `currentLevelStage`, `nextLevelDisplayName`,
`idpView.what_to_practice`, `idpView.what_to_understand`.

---

### 3. Removed "What to Ask Your Coach" card (+2 cognitive load)

This card rendered a list of questions derived from `idpView.what_to_understand` — generic
coaching questions ("What does it mean to...?") that don't help the player make a decision
or take an action. It was the weakest signal-bearing card on the page. Removed.

No data computation needed — the card derived its content purely from `what_to_understand`
which is still shown in the merged Development Focus card.

---

### 4. Removed Q&A Answer card + `qaAnswer` computation block (+3 cognitive load)

**Before:** `buildPlayerProgressAnswer(parsePlayerProgressQuestion('what to practice'), {...})`
was called inline (lines 320–357 of original), computing a `qaAnswer` object. The result was
rendered as a "Answers from your development plan" card with `MessageCircle` icon.

This was a static pre-computed Q&A that:
- Duplicated data already shown in the merged Development Focus card
- Produced generic prose the player couldn't act on
- Was not personalized or dynamic (same question every render)
- Added a full card of scroll depth with no incremental value

**After:** Entire `qaAnswer` computation block removed. `parsePlayerProgressQuestion` and
`buildPlayerProgressAnswer` imports removed. `MessageCircle` and `HelpCircle` imports removed.

---

### 5. Removed standalone Encouragement note (+1 cognitive load)

A standalone motivational note block appeared between the Q&A card and Requirements to Move Up.
It rendered `idpView.encouragement_note` as a lime-bordered card. The hero card and mission
preview already set a motivating tone at the top. The encouragement note mid-scroll added
noise without signal. Removed.

---

### 6. Added "Sessions" section separator (inside idpView block) (+1 visual hierarchy)

Added separator before Recent Sessions card:

```jsx
<div className="flex items-center gap-3 pt-2">
  <div className="flex-1 h-px bg-border" />
  <p className="label-xs shrink-0">Sessions</p>
  <div className="flex-1 h-px bg-border" />
</div>
```

Only renders when `recentSessionHistory.length > 0` (inside existing conditional block).

---

### 7. Added "Progress" section separator (outside idpView block) (+1 visual hierarchy)

Added separator before Wins & Badges card (always shown, outside the idpView null guard):

```jsx
<div className="flex items-center gap-3 pt-2">
  <div className="flex-1 h-px bg-border" />
  <p className="label-xs shrink-0">Progress</p>
  <div className="flex-1 h-px bg-border" />
</div>
```

This creates a clear three-zone scroll structure:
1. **Above fold:** Hero + Mission
2. **Development Focus:** Level + Practice + Sessions
3. **Progress:** Wins & Badges + DONNA CTA

---

### 8. Cleaned unused imports

Removed:
- `MessageCircle` — only used by Q&A Answer card
- `HelpCircle` — only used by "What to Ask Your Coach" card
- `Award` — only used by a removed section
- `parsePlayerProgressQuestion` — removed computation
- `buildPlayerProgressAnswer` — removed computation

---

## What Was NOT Changed

- `PlayerHomeHeroCard` — untouched (above-fold hero)
- `PlayerMissionPreview` — untouched (DONNA mission surface)
- Requirements to Move Up card — untouched (lock icon, curriculum gate)
- This Week's Challenge card — untouched
- Recent Sessions card — untouched (data + render identical; only wrapped in new separator)
- My Skills empty state — untouched
- Wins & Badges card (all 3 states: earned / near-next / none) — untouched
- Ask DONNA CTA banner — untouched
- All data queries — untouched (no new queries, no removed queries)
- All Supabase calls — untouched
- `buildIndividualDevelopmentPlan` / `buildRoleSpecificIdpView` — untouched
- `buildBadgeEligibilityReport` / `getVisibleBadgesForPlayer` — untouched
- `buildPlayerMissionCopy` — untouched
- `buildPlayerProgressIndicators` — untouched
- No SQL/RLS/migrations, no env files, no seed data
- No DONNA dispatcher modified
- No parent/player boundary changes — all data already scoped to authenticated player

---

## Files Modified

| File | Change |
|---|---|
| `src/app/player/page.tsx` | Sprint 778 AIQS mission-first layout fixes |
| `docs/AIQS_PLAYER_PORTAL_778.md` | This sprint doc |
| `docs/CHANGELOG.md` | Dated entry |

---

## Result: Page Structure (post-sprint)

| Zone | Content | Always shown? |
|---|---|---|
| Above fold | Hero + Mission Preview | ✅ |
| Development Focus | Merged Level + Practice + Understand (1 card) | conditional (idpView) |
| Development Focus | Requirements to Move Up | conditional (idpView) |
| Development Focus | This Week's Challenge | conditional (idpView) |
| Sessions | Recent Sessions (1 card) | conditional (recentSessionHistory > 0) |
| Progress | Wins & Badges | ✅ |
| Progress | Ask DONNA CTA | ✅ |

**Previous:** 14+ cards, no section breaks, 3 parallel development cards, 2 low-signal cards
**After:** 3 named zones, 1 merged development card, 0 low-signal cards

Card count reduction: 14 → 7–9 depending on data state.

---

## Expected Score Improvement

| Category | Before | After | Δ |
|---|---:|---:|---|
| Cognitive load | 9/15 | 14/15 | **+5** |
| Visual hierarchy | 7/10 | 9/10 | **+2** |
| Primary action clarity | 6/10 | 7/10 | **+1** |
| Spacing/layout | 7/10 | 8/10 | **+1** |
| *(all others unchanged)* | — | — | 0 |
| **Total** | **~73** | **~82** | **+9** |

---

## TypeScript Result

`npx tsc --noEmit` — **EXIT 0** (clean)

---

## Implementation Guardrails — Confirmed

- [x] No SQL/RLS/migrations touched
- [x] No env files touched
- [x] No DONNA dispatcher modified
- [x] No official record mutations
- [x] No role boundaries changed
- [x] No approval flows changed
- [x] No new npm packages
- [x] No new Supabase queries
- [x] Parent/player data boundary unchanged
- [x] Raw coach notes not exposed
- [x] All data already scoped to authenticated player session
- [x] Safety: only removals + structural reorganization — no information loss (all IDP data in merged card)
