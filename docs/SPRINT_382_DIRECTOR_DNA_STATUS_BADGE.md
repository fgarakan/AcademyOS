# Sprint 382 — Director DNA Status Badge V1

**Date:** 2026-05-19
**Branch:** main

---

## Goal

Make the Director Dashboard server-side aware of Academy DNA completion. When
`settings.academy_dna` exists in the academy's JSONB settings column, show a
"Academy DNA on file" status badge inside the Academy Setup section — bridging
the localStorage-based save panel with the server-rendered dashboard.

Read-only sprint. No DB writes, no migrations, no schema changes.

---

## Detection Logic

Added after the existing `onboardingSettings` derivation in `director/page.tsx`:

```ts
const hasAcademyDna =
  typeof onboardingSettings.academy_dna === 'object' &&
  onboardingSettings.academy_dna !== null

const dnaSavedAt =
  typeof onboardingSettings.academy_dna_completed_at === 'string'
    ? onboardingSettings.academy_dna_completed_at
    : null
```

`onboardingSettings` is already read from `academies.settings` — no extra DB
query needed. `academy_dna_completed_at` is the companion ISO timestamp written
by `saveAcademyDnaSettings` in Sprint 381.

---

## Component Created

**`src/app/director/_components/DirectorDnaStatusBadge.tsx`**

Pure server component (no `'use client'`). Placed in `_components/` to match
the existing folder convention for director-route-scoped components.

Props:
- `savedAt?: string | null` — ISO timestamp; formatted as `d MMM yyyy` (en-GB)

Renders a `rounded-xl bg-lime/5 border border-lime/20` card with:
- CheckCircle2 icon in a lime-tinted circle
- "Academy DNA on file" heading + "Saved" pill + optional date
- DONNA attribution line (Sparkles icon): "DONNA has your academy foundation. Saved to academy settings."
- "Next: curriculum, templates, players, coaches."
- Link to `/director/onboarding` — "Review onboarding →"

---

## Placement in director/page.tsx

Inside the `!isAcademyLive` branch, between the section label and
`OnboardingProgressCard`:

```tsx
{hasAcademyDna && <DirectorDnaStatusBadge savedAt={dnaSavedAt} />}
```

The subtitle copy is also conditional:

```tsx
{hasAcademyDna
  ? 'Academy DNA is saved. Complete the remaining setup steps to go live.'
  : 'Complete these steps first. Academy OS uses this information to guide curriculum, placement, sessions, and coach workflows.'}
```

`OnboardingProgressCard` and `SetupProgressChecklist` remain unchanged — the
badge is additive only.

---

## What Is Not Changed

- `isAcademyLive` calculation — still checks players/curriculum/templates/sessions
- `DirectorContinueSetupPanel` — still reads from localStorage and drives the save flow
- No localStorage deletion
- No additional DB queries

---

## TypeScript

Clean. `npx tsc --noEmit` — no errors.
