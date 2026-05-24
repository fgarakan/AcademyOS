# Sprint 774 — Curriculum Map Premium Expandable Editable Cards V1

**Date:** 2026-05-24
**Sprint:** 774
**Goal:** Fix AIQS issues on Curriculum Map page — mobile DONNA gap, primary CTA clarity, typography.

---

## AIQS Issues Addressed

### Curriculum Map (AIQS Section 5 — 74/100)

**Problem #1: DONNA panel hidden on mobile (+5 score)**
> "DONNA panel is hidden on mobile (`hidden lg:block`) — no fallback CTA or collapsed entry point for mobile users."
>
> Fix: Added `block lg:hidden` mobile health summary card above the search — shows Ready/Needs Review/Incomplete/Custom chips + Start Guided Review link.
> Impact: +3 DONNA integration, +2 mobile (accessibility)

**Problem #2 + #3: Action button typography + primary CTA (+3 score)**
> "'Start Guided Review' and 'Jump to Level' buttons at `text-[11px]`" and "No clear primary action in the header."
>
> Fix:
> - "Start Guided Review" → `btn-lime` (lime background, dark text, primary CTA pattern)
> - "Jump to Level" → `btn-ghost` (secondary/muted pattern)
>
> Impact: +2 primary action clarity, +1 typography

**Problem #5: Subtitle typography (+1 score)**
> "Subtitle uses `text-[12px]`"
>
> Fix: `text-[12px]` → `text-sm` (14px)
> Impact: +1 typography

---

## Files Modified

| File | Change |
|---|---|
| `src/app/director/curriculum/map/page.tsx` | Mobile health summary (4 chips + CTA); subtitle text-sm; btn-lime/btn-ghost on header CTAs |

---

## Expected Score Improvement

| Category | Before | After |
|---|---|---|
| Primary action clarity | 6/10 | 8/10 |
| Typography | 7/10 | 9/10 |
| Accessibility / mobile | 6/10 | 8/10 |
| DONNA integration | 3/5 | 5/5 |

**Estimated Curriculum Map score: 74 → 84+**

---

## Mobile Health Summary Design

```
┌─────────────────────────────────────┐
│ CURRICULUM HEALTH                    │
│                                      │
│ [5 Ready] [2 Needs Review]           │
│ [1 Incomplete] [3 Custom]            │
│                                      │
│ ✦ Start Guided Review →              │
└─────────────────────────────────────┘
```

- Uses `label-xs` for the section header
- Each chip: `px-2.5 py-1 rounded-lg border text-[11px]` with inline color styles
- Count value uses `font-mono text-xs`
- CTA is a `text-xs text-lime` link (not a full button — appropriate for inline mobile link)
- Renders as `block lg:hidden` — invisible on desktop where the aside panel handles this

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
- [x] Mobile UI only — data already computed on page; chips just display `healthItems` already in scope
