# Sprint 383 — Director Setup Status Unification + Token Correction V1

**Date:** 2026-05-19
**Branch:** main

---

## Context: What Sprint 382 Did

Sprint 382 created `DirectorDnaStatusBadge` and wired it into `director/page.tsx`
so the dashboard reflects server-side DNA completion. The badge reads
`settings.academy_dna` from the already-loaded `onboardingSettings` object
and renders when `hasAcademyDna` is true.

---

## Why Sprint 383 Was Needed

Sprint 382's docs and changelog described the badge as "lime-accented," implying
AcademyOS has a lime-green brand direction. The `lime` token in the actual
tailwind config is `#11d9df` (cyan/aqua) — the primary accent color — and is
already used extensively throughout the existing dashboard components. The token
name is a legacy alias; the rendered color is cyan.

Additionally, the post-DNA task cards in `DirectorContinueSetupPanel` had no
visibility into whether tasks had been started, even though the relevant data
(players, class templates, fitness templates) is already loaded server-side in
`director/page.tsx`.

---

## Part A — Token Correction

**What was wrong:** Sprint 382 docs used "lime-accented" and "lime-tinted circle"
to describe the DNA badge. These phrases imply a lime-green design direction that
does not match the actual AcademyOS design system.

**What is correct:** The `lime` token = `#11d9df` (cyan). Using `bg-lime/5`,
`border-lime/20`, `text-lime` etc. is native AcademyOS styling — the same classes
used by `OnboardingProgressCard` and `SetupProgressChecklist`. No visual change
was needed; only doc wording was corrected.

**Files corrected:**
- `docs/SPRINT_382_DIRECTOR_DNA_STATUS_BADGE.md` — replaced "lime-tinted circle"
  with "accent-tinted circle"; replaced badge description with "AcademyOS-native
  status card using existing accent tokens"
- `docs/CHANGELOG.md` — Sprint 382 entry: replaced "lime-accented" with
  "AcademyOS-native... using existing accent tokens"

---

## Part B — Setup Section Coherence

The Academy Setup section (`!isAcademyLive` branch) already shows a coherent
story after Sprint 382. No structural changes were needed:

1. **DNA badge** — shows when `settings.academy_dna` exists. Copy: "DONNA has
   your academy foundation."
2. **Subtitle copy** — conditionally reads "Academy DNA is saved. Complete the
   remaining setup steps to go live." vs the original setup copy.
3. **OnboardingProgressCard** — tracks 7 curriculum/admin onboarding steps
   (identity, interview, curriculum, level gates, programs, coaches, players
   placement). Distinct from DNA and still useful post-DNA.
4. **SetupProgressChecklist** — operational steps (players, curriculum levels,
   templates, sessions). Dimissable. Tracks completion server-side.
5. **DirectorContinueSetupPanel** — client component reading localStorage draft;
   shows 6 post-DNA task cards with Save Academy DNA flow.

---

## Part C — Setup Task Status Map

Three task cards in `DirectorContinueSetupPanel` now reflect server-side status
using data already loaded in `director/page.tsx`. No new DB queries added.

| Task card | Data source | Chip shown when |
|---|---|---|
| Upload Players | `players.length > 0` | At least one player exists |
| Create First Class Template | `classTemplateCount > 0` | At least one class template exists |
| Create Fitness Template | `fitnessTemplateCount > 0` | At least one fitness-tagged template exists |

`fitnessTemplateCount` is derived from the already-loaded `templateCheckData`
by filtering for templates with `tags` containing `'fitness_template:true'` —
no extra query.

When `started` is true:
- The "Ready next" pill is suppressed (avoids conflict with "Started")
- A green "Started" pill appears (uses `status-green` tokens)
- The card CTA text changes from "Open" to "Continue"

Tasks without data coverage (Review Curriculum, Add Coaches, Preview Portals)
show no status chip — no fake completion.

---

## How DNA Saved State Is Read

```ts
// director/page.tsx — reuses existing academyWithSettings query
const onboardingSettings = (academyWithSettings?.settings as Record<string, unknown>) ?? {}
const hasAcademyDna =
  typeof onboardingSettings.academy_dna === 'object' &&
  onboardingSettings.academy_dna !== null
const dnaSavedAt =
  typeof onboardingSettings.academy_dna_completed_at === 'string'
    ? onboardingSettings.academy_dna_completed_at
    : null
```

`academy_dna_completed_at` is the ISO timestamp written by `saveAcademyDnaSettings`
(Sprint 381). Both keys are read-only in this sprint.

---

## Whether OnboardingProgressCard Remains

Yes. It tracks a different set of setup steps than the DNA flow (7 admin/curriculum
steps vs 10 DNA steps). It remains useful post-DNA because those 7 steps have
not been completed by the DNA flow. It is shown regardless of `hasAcademyDna`.

---

## How Continue Setup Panel Relates to DNA Badge

- **DNA badge** — server-rendered, persistent, sourced from `academies.settings`
- **Continue Setup panel** — client-rendered, sourced from localStorage draft;
  dismissable; shows the Save DNA flow + 6 post-DNA task cards

They are independent and complementary. The badge confirms DNA is durably saved;
the panel drives the next action. Both can be visible simultaneously. If the
director dismissed the panel, the badge still appears.

---

## What Remains Local/Draft Only

- The localStorage draft at `academyos_onboarding_draft_v2` is NOT deleted after
  DNA save. It remains available for the Continue Setup panel.
- `academyos_dna_writeback_complete` localStorage flag marks that the save was
  triggered this browser session.
- The director can still access the full onboarding review at
  `/director/onboarding`.

---

## Remaining Incomplete

- Add Coaches task card has no "Started" chip — no coach count is loaded in the
  page. A future sprint could load a coach membership count cheaply and pass it
  as `coachesExist` prop.
- Review Curriculum has no completion signal — the curriculum setup step in
  OnboardingProgressCard covers this (`curriculum_setup_completed` key).
- The `isAcademyLive` flag does not check `academy_dna` — by design, going live
  requires players/curriculum/templates/sessions, not just DNA.

---

## Next Sprint Recommendation

**Sprint 384 — Director Academy DNA Coach Coaches Count Pass-Through V1**

Load coach membership count (cheap query — one row from `academy_memberships`
with count) in `director/page.tsx` and pass `coachesExist` to
`DirectorContinueSetupPanel` so the Add Coaches card also shows "Started."

OR focus on the operational side and begin **Sprint 384 — Director Class Template
Builder V1** to wire the class template creation flow.

---

## TypeScript

Clean. `npx tsc --noEmit` — no errors.
