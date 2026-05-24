# Sprint 773 — Coach Home Today Console AIQS Rebuild V1

**Date:** 2026-05-24
**Sprint:** 773
**Goal:** Fix Coach Home duplication and eyebrow label issues identified in the AIQS audit.

---

## AIQS Issues Addressed

### Coach Home — Problem #2 (AIQS Section 10)

> "TODAY session card duplicates the Next Session card — The 'Next Session' card above the stats strip shows the next session. The 'TODAY' section below the stats shows all today's sessions (which includes the same session). On a day with one session, the coach sees the same session twice."
>
> Fix: Remove the standalone 'Next Session' card. The 'TODAY' section should highlight the first session with a 'NEXT' badge instead.
> Impact: +3 cognitive load

**Change in `src/app/coach/page.tsx`:**
- Removed the standalone "Next Session" card (was lines 107-146) — a full card IIFE block that duplicated the first session in TODAY
- In the TODAY `<CardContent>`, now computes `nextId` (first incomplete/non-cancelled session) and renders a lime "NEXT" chip on that row
- Removed unused `Clock` and `PlayCircle` imports (only used in the removed card)

---

### Coach Home — Problem #4 (AIQS Section 10)

> "'Your Workspace' eyebrow label is generic — The page-eyebrow above the greeting says 'Your Workspace' which is not distinctive."
>
> Fix: Change to "Coach Hub"
> Impact: +1 purpose clarity

**Change in `src/app/coach/page.tsx`:**
- `page-eyebrow`: `'Your Workspace'` → `'Coach Hub'`

---

## Files Modified

| File | Change |
|---|---|
| `src/app/coach/page.tsx` | Removed standalone Next Session card; added NEXT badge to TODAY list; eyebrow → "Coach Hub"; removed Clock/PlayCircle imports |

---

## Expected Score Improvement

| Page | Category | Before | After |
|---|---|---|---|
| Coach Home | Cognitive load | 10/15 | 13/15 |
| Coach Home | Purpose clarity | 8/10 | 9/10 |

**Estimated Coach Home score: 77 → 83+**

---

## Implementation Notes

- `NEXT` badge uses the `text-[9px] px-1.5 py-0.5 rounded border` pattern — AIQS exempt (decorative chip)
- `nextId` computation: `todaySessions.find(s => s.status !== 'completed' && s.status !== 'cancelled') ?? todaySessions[0]` — same logic as the removed standalone card
- Badge renders inline with session name in a flex row, truncation preserved via `truncate` on the name `<p>` and `shrink-0` on the badge
- No data logic changed — same session list, same queries

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
- [x] Removed duplicate UI card — no data or logic changes
