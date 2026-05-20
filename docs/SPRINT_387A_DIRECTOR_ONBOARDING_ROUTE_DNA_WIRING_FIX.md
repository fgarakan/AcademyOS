# Sprint 387A — Director Onboarding Route DNA Wiring Fix

**Date:** 2026-05-20
**Sprint:** 387A
**Status:** Complete

---

## Root cause

`/director/onboarding` was rendering a legacy 12-step checklist page (`AcademyOnboardingPage`). This checklist was the wrong first screen. The Academy DNA setup flow (`OnboardingShell`, 10 steps) already existed at `/onboarding` but was not accessible from the primary director entry point. Directors visiting `/director/onboarding` saw a numbered checklist rather than the intended DONNA-guided onboarding experience.

---

## What route was wrong

`src/app/director/onboarding/page.tsx` was a server component rendering the old checklist. It had no connection to the `OnboardingShell` 10-step DNA setup. Clicking "Start Guided Setup" in the checklist linked to `/director/onboarding/interview` (a standalone form), not the connected DONNA flow.

---

## How /director/onboarding now works

1. `/director/onboarding` renders `AcademyDnaLanding` (a new client component).
2. `AcademyDnaLanding` shows the prototype-style landing screen:
   - Top pill: "AcademyOS — Director Onboarding"
   - Headline: "Let's build your academy operating system."
   - Subtitle: DONNA's role in building the OS
   - "DONNA will create" pills (6 items)
   - Setup mode cards (6 modes — 3 supported, 3 deferred)
   - Right DONNA panel with conversation area, input, and quick chips
3. When the director clicks a supported mode (Guided Setup, Fast Start, or Full Setup) and clicks "Begin Setup", local state sets `showShell = true`.
4. `AcademyDnaLanding` renders `OnboardingShell` in place — the full 10-step Academy DNA setup begins at step 0 (Welcome step).

---

## How the prototype landing was implemented

`src/components/onboarding/AcademyDnaLanding.tsx` is a pure client component with no DB queries and no mutations. It uses:
- `useState` for `selectedMode`, `showShell`, `inputValue`, `donnaDraftNote`
- AcademyOS design tokens: `bg-lime/8`, `border-lime/20`, `text-lime`, `bg-surface`, `border-border`, `text-text-muted`, etc.
- Existing Lucide icons: `Sparkles`, `ArrowRight`, `Zap`, `Lock`
- `OnboardingShell` imported from `./OnboardingShell` — no modifications to the shell

DONNA panel notes are local state only. The "Ask" button records a draft preference string in state and shows it in the conversation area with a clear "Draft only" label. No AI call, no DB write, no mutation.

---

## How the user enters the 10-step DNA setup

Supported setup modes: **Fast Start**, **Guided Setup**, **Full Setup**

When any of these is selected and "Begin Setup" is clicked:
- `setShowShell(true)` is called
- `AcademyDnaLanding` renders `<OnboardingShell />` in place
- `OnboardingShell` begins at step 0 (Welcome step) with setup mode selector
- Director proceeds through steps 1–9: Academy Basics → Coaching Philosophy → Coach Communication → Session Design → Player Development → Parent Communication → DNA Summary → DONNA Adjustment → Final Activation

Deferred modes: **Import Existing Academy**, **Consultant Setup**, **Multi-Location Setup**
- These render a clear deferred copy message and are visually disabled (Lock icon, 50% opacity)
- Clicking "Begin Setup" is not possible when a deferred mode is selected

---

## Where the old checklist went

The old checklist (`AcademyOnboardingPage` server component) was moved to:

`src/app/director/setup/page.tsx` → `/director/setup`

- Import path for `AnimatedOnboardingDeck` updated: `'./AnimatedOnboardingDeck'` → `'../onboarding/AnimatedOnboardingDeck'`
- Page title updated to "Academy Setup Checklist"
- Info note added linking back to `/director/onboarding` for the DONNA-guided flow
- All checklist functionality preserved: step status, progress bar, group sections, advanced section

---

## What remains local/draft only

- DONNA panel preferences in `AcademyDnaLanding` — local state, never persisted
- `OnboardingShell` draft — localStorage only (`academy_dna_onboarding_draft`), not applied until Final Activation step
- No DB writes occur in the landing screen or OnboardingShell until the director explicitly completes the Activation Checklist step

---

## Files changed

**Created:**
- `src/components/onboarding/AcademyDnaLanding.tsx` — prototype landing screen client component
- `src/app/director/setup/page.tsx` — old checklist preserved here
- `docs/SPRINT_387A_DIRECTOR_ONBOARDING_ROUTE_DNA_WIRING_FIX.md` — this document

**Modified:**
- `src/app/director/onboarding/page.tsx` — now renders `<AcademyDnaLanding />` only
- `docs/CHANGELOG.md` — dated entry added

---

## TypeScript

Clean. `npx tsc --noEmit` passes with no errors.

---

## Next sprint recommendation

**Sprint 387B — AcademyDnaLanding Setup Mode Pre-selection Wire-through**

When director selects a mode in `AcademyDnaLanding` and clicks "Begin Setup", pass the selected mode into `OnboardingShell` as `initialSetupMode` so the Welcome step (step 0) is pre-populated and the director can click "Start with DONNA" immediately without re-selecting the mode.

Requires:
- Add optional `initialSetupMode?: string` and `initialStep?: number` props to `OnboardingShell`
- `AcademyDnaLanding` passes `selectedMode` and `initialStep={1}` to skip the Welcome step entirely
- No migrations, no schema changes

This is low-risk and completes the landing-to-shell transition with zero redundancy.
