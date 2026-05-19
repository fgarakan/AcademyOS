# Connected Onboarding OF-FIX-2: Welcome + Academy Basics Repair

**Sprint:** OF-FIX-2
**Date:** 2026-05-19
**Status:** Complete

---

## Objective

Restore the Welcome screen and Academy Basics step closer to the prototype flow while preserving the AcademyOS design system.

---

## Changes

### WelcomeStep (`OnboardingShell.tsx`)

Added a 4-card "What DONNA builds for you" feature strip between the 5-step pills and the setup mode selector.

Cards:
- **Curriculum Builder** — Level structure, progression gates, and session plans
- **Player Pathways** — Individual development plans for every player
- **Analytics** — Session data, attendance, and performance insights
- **Parent Reports** — Privacy-safe communications, auto-drafted by DONNA

Styling: `bg-surface-raised border border-border` cards in a 2x2 grid. No new tokens.

Ambient glow, 5-step pills, and non-blocking CTA remain from OF-FIX-1.

### AcademyBasicsStep (`AcademyBasicsStep.tsx`)

**Removed:** Primary Goals section (UI only — `primaryGoals` field kept in `OnboardingDraft` and `defaultDraft` for forward compatibility).

**Updated:** Age group buttons now include an always-visible colored ball dot:

| Group | Dot color |
|---|---|
| Red Ball | `bg-status-red` |
| Orange Ball | `bg-status-orange` |
| Green Ball | `bg-status-green` |
| Yellow Ball | `bg-yellow-400` (Tailwind built-in) |
| High Performance | `bg-status-blue` (replaced undefined `status-purple`) |
| Adult | `bg-text-muted` |

All selected-state colors updated to use `selectedColor` (renamed from `color`) to match the new dot-first layout. No undefined tokens remain.

---

## What did not change

- `OnboardingDraft` type — `primaryGoals` field preserved
- Step count, step names, DONNA messages — unchanged
- `OnboardingProgressRail` — unchanged
- All navigation, skip logic, and canContinue logic — unchanged

---

## TypeScript

Clean — no errors.
