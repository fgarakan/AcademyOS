# Sprint 804 — DONNA Dashboard Integration V1

**Date:** 2026-05-25
**Sprint:** 804
**Type:** UX integration — DONNA inline entry card on Director Dashboard
**Files changed:** 2 source + 2 docs
**Migrations:** None
**DB mutations:** None
**TypeScript:** Clean

---

## Why this sprint

Sprint 799 audit blocker:

> **"No inline DONNA context on dashboard"** — dashboard and DONNA panel are two isolated surfaces. The director must already know to open the panel; nothing on the dashboard prompts them or shows DONNA's awareness of the current state.

Sprint 804 closes this with a one-click DONNA entry card on the dashboard.

---

## Changes

### New component: `DonnaDashboardOpenCard.tsx`

A client component that sits between the Hero Header and `DirectorTodayCommandCenter`. It:

1. Shows the total alert count (derived from `totalAlerts` — same signal already computed in the page)
2. Provides a single clear call-to-action: "Ask DONNA →"
3. On click, dispatches `donna:open` with `{ prompt: 'What do I need to do today?' }` — the same event used by `TodayDonnaSuggestionChip`, `LevelUpDonnaCTA`, etc.
4. DONNA panel opens pre-seeded with the daily brief question — no extra interaction required

**Signal copy:**
- When `attentionCount > 0`: "X items may need your attention today"
- When `attentionCount === 0`: "DONNA is ready — ask what needs your attention"

**Visual:**
- Dark lime-tinted card (consistent with DONNA surfaces across the app)
- Sparkles icon + lime "Ask DONNA →" chip
- Hover: chip opacity increases, icon scales slightly

**No DB calls.** `attentionCount` is computed from data already fetched for the dashboard page. No new queries.

---

### Integration in `page.tsx`

```tsx
{/* Sprint 804: DONNA inline entry card */}
<DonnaDashboardOpenCard
  attentionCount={totalAlerts}
  firstName={directorDisplayName.split(' ')[0]}
/>

{/* Sprint 767: Today Command Center */}
<DirectorTodayCommandCenter ... />
```

Position: between Hero Header and `DirectorTodayCommandCenter`. The card creates the path; the command center is the destination.

---

## Before/after: dashboard DONNA integration

| Before Sprint 804 | After Sprint 804 |
|---|---|
| Dashboard and DONNA panel are isolated | DONNA entry card is on the dashboard |
| Director must know to open DONNA panel | Obvious one-click path from dashboard |
| No signal that DONNA is aware of the current state | Alert count surfaced inline |
| No pre-seeded question on panel open (from dashboard) | "What do I need to do today?" pre-loaded |

---

## Event contract

Uses the existing `donna:open` CustomEvent:

```ts
window.dispatchEvent(new CustomEvent('donna:open', {
  detail: { prompt: 'What do I need to do today?' }
}))
```

`DonnaAssistantButton` listens for this event (line ~1051), opens the panel, and seeds the typed text. This is the same mechanism used by 5+ other components across the director area.

---

## Safety guardrails checklist

| Guard | Status |
|---|---|
| No DB mutation | ✅ Client-only component |
| No new DB queries | ✅ `totalAlerts` already computed in page |
| No auto-submit | ✅ Panel opens with pre-seeded text; user must submit |
| No approval bypass | ✅ DONNA panel handles approval as normal |
| Uses existing `donna:open` event contract | ✅ Same as TodayDonnaSuggestionChip, LevelUpDonnaCTA, etc. |
| No new packages | ✅ None |
| TypeScript clean | ✅ `npx tsc --noEmit` — no errors |

---

## Estimated score lift after Sprint 804

| Dimension | Sprint 799 audit | Sprint 804 estimate |
|---|---|---|
| Dashboard Cognitive Load | 40/100 (Sprint 799) → ~58/100 (Sprint 803) | ~65/100 |
| DONNA–Dashboard integration | 0/10 | ~7/10 |

**Key gain:** The director now has an explicit, visible DONNA entry point on the dashboard — not just an icon in the sidebar. The card creates trust ("DONNA is aware") and reduces friction ("I don't have to figure out what to type").

---

## Recommended Sprint 805

**Suggested:** Final 10/10 Certification

Run a full re-audit of:
- DONNA side panel (target: 85+/100)
- DONNA persistence (target: 85+/100)
- Command understanding (target: 85+/100)
- Dashboard cognitive load (target: 80+/100)
- Weighted composite (target: 85+/100)

Compare Sprint 799 baseline scores to post-Sprint 804 state. If any dimension is below 80, identify the remaining blockers and plan a follow-up sprint.
