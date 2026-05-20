# Sprint 387B — Onboarding Begin Setup Skip Welcome

**Date:** 2026-05-20
**Sprint:** 387B
**Status:** Complete

---

## Why Sprint 387B exists

Sprint 387A wired the prototype-style `AcademyDnaLanding` as the entry screen for `/director/onboarding`. When a director selected a setup mode and clicked "Begin Setup", `OnboardingShell` rendered in-place — but started at step 0 (the Welcome step). The Welcome step is a redundant setup mode selector that the director already completed on the landing screen.

Sprint 387B removes the redundancy: clicking "Begin Setup" on the landing now drops the director directly into Academy Basics (step 1).

---

## How Begin Setup now enters Academy Basics

`AcademyDnaLanding` now passes two props when rendering `OnboardingShell`:

```tsx
<OnboardingShell initialStep={1} initialSetupMode={selectedMode ?? ''} />
```

- `initialStep={1}` — `OnboardingShell` initializes `currentStep` state to 1 (Academy Basics) instead of 0 (Welcome)
- `initialSetupMode={selectedMode}` — `OnboardingShell` initializes `draft.setupMode` with the mode the director selected on the landing

The `OnboardingProgressRail` correctly reflects this: when `currentStep=1`, step 0 (Welcome) renders as "complete" (lime check mark) because `i=0 < currentStep=1`. This gives an accurate visual representation — the welcome/mode-selection step was completed on the landing.

---

## Which props were added

`OnboardingShell` now accepts an optional `OnboardingShellProps` interface:

```ts
interface OnboardingShellProps {
  initialStep?: number
  initialSetupMode?: string
}
```

Both props default to their previous behavior (`initialStep = 0`, `initialSetupMode = ''`), so the existing public `/onboarding` route is completely unaffected.

The `draft` state is initialized with a lazy initializer:

```ts
const [draft, setDraft] = useState<OnboardingDraft>(() =>
  initialSetupMode ? { ...defaultDraft, setupMode: initialSetupMode } : defaultDraft
)
```

---

## Setup mode context badge

When the shell starts at step 1 with a pre-selected mode, a small context badge appears above the Academy Basics content:

```
[ Guided Setup selected ]
```

The badge uses `bg-surface-raised border-border text-text-muted` — unobtrusive, one line, no layout churn. It shows on steps 1–9 whenever `draft.setupMode` is non-empty.

---

## Whether /onboarding behavior changed

No. `OnboardingShell` called with no props (as in `/app/onboarding/page.tsx`) defaults to `initialStep=0` and `initialSetupMode=''` — identical to the previous behavior. The Welcome step still renders first on the public `/onboarding` route. The resume banner still appears at step 0 when a saved draft exists.

---

## What remains local/draft only

- Setup mode selection and all `OnboardingShell` step data remain local `useState` + localStorage only
- Nothing is written to the database until the director reaches and confirms the Activation Checklist step
- The mode context badge is display-only — it does not write or mutate anything

---

## Files changed

**Modified:**
- `src/components/onboarding/OnboardingShell.tsx` — added `OnboardingShellProps`, `initialStep` and `initialSetupMode` props, lazy draft initializer, mode context badge
- `src/components/onboarding/AcademyDnaLanding.tsx` — passes `initialStep={1}` and `initialSetupMode={selectedMode ?? ''}` when rendering the shell
- `docs/CHANGELOG.md` — dated entry added

**Created:**
- `docs/SPRINT_387B_ONBOARDING_BEGIN_SETUP_SKIP_WELCOME.md` — this document

---

## TypeScript

Clean. `npx tsc --noEmit` passes with no errors.

---

## Next sprint recommendation

**Sprint 388 — Director Onboarding DNA Activation Write-Back Audit**

Verify that the existing `ActivationChecklistStep` (step 9) correctly writes Academy DNA data to the database via the `saveAcademyDnaAction` (or equivalent server action). Confirm:
- The action is scoped to the director's academy
- It writes to the correct columns (via existing backend, no new migrations)
- The `director_interview_completed` settings flag is correctly set after activation
- The post-DNA redirect goes to `/director` with the correct success state

This closes the loop between the new DONNA-guided landing flow and the actual data persistence that makes the DNA setup permanent.
