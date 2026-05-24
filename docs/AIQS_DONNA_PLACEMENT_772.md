# Sprint 772 — AIQS DONNA Placement Correction V1

**Date:** 2026-05-24
**Sprint:** 772
**Goal:** Fix DONNA placement/duplication issues identified in the AIQS audit on Player Portal and Coach Home.

---

## AIQS Issues Addressed

### Player Portal — Problem #2 (AIQS Section 13)

> "DONNA chips appear before the primary mission content — The 'Ask DONNA' section with question chips appears BEFORE `PlayerMissionPreview`. The player's mission should be the first thing they see, not a question interface."
>
> Fix: Move DONNA chips to after the mission card.
> Impact: +2 cognitive load, +2 primary action clarity, DONNA integration 4 → 5/5

**Change in `src/app/player/page.tsx`:**
- Moved the "Ask DONNA" chips block from before `PlayerMissionPreview` to immediately after it
- New order: Header → Mission Hero → Path Entry Cards → **Today's Mission** → **Ask DONNA** → No Mapping State → Live Development Plan → Wins & Streaks → Ask DONNA CTA

---

### Coach Home — Problem #1 (AIQS Section 10)

> "DONNA appears twice — as a card AND in Quick Actions — The 'DONNA Coach Assistant' card (section 7) links to `/coach/donna` with a description. The Quick Actions section also has 'Ask DONNA' linking to the same route. Two entries for the same destination."
>
> Fix: Remove the 'Ask DONNA' item from Quick Actions. The DONNA card already covers it.
> Impact: +2 cognitive load, DONNA integration 4 → 5/5

**Change in `src/app/coach/page.tsx`:**
- Removed the "Ask DONNA" col-span-2 item from the Quick Actions grid (lines 438-449)
- The DONNA Coach Assistant card at section 7 remains as the single DONNA entry point
- Quick Actions now has 2 items (My Sessions + My Players) in a clean 2-col grid

---

## Files Modified

| File | Change |
|---|---|
| `src/app/player/page.tsx` | Moved Ask DONNA chips block to after PlayerMissionPreview |
| `src/app/coach/page.tsx` | Removed duplicate Ask DONNA item from Quick Actions grid |

---

## Expected Score Improvement

| Page | Category | Before | After |
|---|---|---|---|
| Player Portal | Primary action clarity | 6/10 | 8/10 |
| Player Portal | Cognitive load | 8/15 | 10/15 |
| Player Portal | DONNA integration | 4/5 | 5/5 |
| Coach Home | Cognitive load | 10/15 | 12/15 |
| Coach Home | DONNA integration | 4/5 | 5/5 |

---

## TypeScript Result

`npx tsc --noEmit` — **EXIT 0** (verified clean)

---

## Implementation Guardrails — Confirmed

- [x] No SQL/RLS/migrations touched
- [x] No env files touched
- [x] No DONNA dispatcher modified
- [x] No official record mutations
- [x] No role boundaries changed
- [x] No approval flows changed
- [x] No new features added
- [x] Pure JSX reorder/removal — no logic, no data, no new props
