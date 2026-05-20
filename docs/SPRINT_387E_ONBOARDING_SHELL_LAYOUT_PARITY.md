# Sprint 387E — Onboarding Shell Layout Parity V1

**Date:** 2026-05-20
**Sprint:** 387E
**Status:** Complete

---

## Purpose

Sprint 387D audit scored the progress mechanism at 3/10 — the biggest single parity gap between the prototype and AcademyOS. The 10-node dot rail is visually heavy, dominates vertical space, and does not match the prototype's thin 3px progress bar treatment. This sprint replaces the rail with a prototype-style progress bar and restructures the shell layout so the content column is wider and cleaner.

---

## What changed

### `src/components/onboarding/OnboardingProgressRail.tsx` — complete rewrite

**Before:** 10-node horizontal dot rail with `CheckCircle2` icons for completed steps, number labels, connector lines, and per-node step labels (`hidden lg:block`). Always visible, including on the Welcome step.

**After:** 3px gradient progress bar with label strip. Hidden on step 0 (Welcome).

- `STEP_PROGRESS` table maps each step index to a `%` width value (steps 1–7: 14% increments; steps 8–9: 96%, 100%)
- Bar background: `bg-border/40` track; fill: `bg-lime` with `boxShadow: '0 0 6px rgba(200,255,0,0.25)'`
- Transition: `width 400ms cubic-bezier(0.77, 0, 0.175, 1)` — smooth and directional
- Right cap: `borderRadius: '0 9999px 9999px 0'`
- Label strip: current step name (lime, `text-[10px] uppercase tracking-widest`) left; step counter (`Step N of 9`) right in `text-text-muted`
- Component returns `null` when `currentStep === 0` — no DOM node on Welcome

No imports removed or added. `CheckCircle2` and `lucide-react` removed (no longer needed).

### `src/components/onboarding/OnboardingShell.tsx` — layout restructure

**Before:**
```
flex-col min-h-screen bg-base
  OnboardingProgressRail            ← top-level header
  flex flex-1 overflow-hidden       ← row
    main flex-1 overflow-y-auto
      div max-w-2xl mx-auto px-6 py-8
    DONNA panel (hidden lg:block)
```

**After:**
```
flex flex-col min-h-screen bg-base
  flex flex-1 overflow-hidden       ← row (moved up, no rail at top)
    div flex-1 flex flex-col overflow-hidden min-w-0   ← Content Column
      OnboardingProgressRail        ← inside column, above main
      main flex-1 overflow-y-auto
        div max-w-3xl mx-auto px-6 py-6
    DONNA panel (hidden lg:block)
```

Changes:
- `OnboardingProgressRail` removed from top-level; placed inside the Content Column above `main`
- Content column wrapper: `flex-1 flex flex-col overflow-hidden min-w-0`
- Content area width: `max-w-2xl` → `max-w-3xl` (+128px)
- Top padding: `py-8` → `py-6` (tighter, matches prototype density)
- DONNA panel position unchanged

The `OnboardingProgressRail` returning `null` on step 0 means Welcome sees no bar — the content column is just a plain flex-col with `main` at the top.

---

## Parity improvement

| Item | Before | After |
|---|---|---|
| Progress mechanism | 10-node dot rail (always visible) | 3px gradient bar (hidden on welcome) |
| Content width | `max-w-2xl` (672px) | `max-w-3xl` (768px) |
| Top padding | `py-8` (32px top + bottom) | `py-6` (24px top + bottom) |
| Progress score | 3/10 | ~7/10 |

---

## TypeScript

Clean. `npx tsc --noEmit` passes with no errors.

---

## No other files changed

Step content components, DONNA panel, landing page, routing, and all other onboarding files are unchanged.

---

## Files changed

**Modified:**
- `src/components/onboarding/OnboardingProgressRail.tsx` — complete rewrite: 3px progress bar + label strip, hidden on step 0
- `src/components/onboarding/OnboardingShell.tsx` — layout restructure: content column wrapper, rail moved inside column, max-w-3xl, py-6
- `docs/CHANGELOG.md` — dated entry added

**Created:**
- `docs/SPRINT_387E_ONBOARDING_SHELL_LAYOUT_PARITY.md` — this document
