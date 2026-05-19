# Sprint 380 — Director Post-DNA Continue Setup V1

**Date:** 2026-05-19
**Branch:** main

---

## Why This Sprint Exists

Sprint 379 narrowed first-run onboarding to Academy DNA Setup (10 steps). The Final Activation screen (step 10) links directors to `/director`. Without this sprint, directors land on the generic dashboard with no visible path to the post-DNA operational setup tasks (curriculum, templates, players, coaches, portals).

Sprint 380 closes that gap: a client-side panel detects the presence of a completed DNA draft in localStorage and shows a "Continue Setup" module with the six post-DNA tasks at the top of the director dashboard.

---

## How Sprint 379 Final Activation Connects to /director

- `ActivationChecklistStep.tsx` (step 10/10) contains a "Go to Director Dashboard" link: `href="/director"`
- It also shows a `POST_DNA_TASKS` grid of six action cards with the same routes used here
- The draft is persisted in localStorage under key `academyos_onboarding_draft_v2`
- This sprint reads that key on the director dashboard to detect DNA completion

---

## Component

**`src/components/director/DirectorContinueSetupPanel.tsx`**

- `'use client'` component — reads localStorage, cannot run server-side
- On mount: reads `academyos_onboarding_draft_v2` from localStorage
- If `draft.academyName` is a non-empty string, the panel becomes visible
- If `academyos_continue_setup_dismissed` key is `'true'`, the panel stays hidden
- Dismiss button: sets the dismiss key and hides the panel immediately
- Shows: "Academy DNA Ready" badge, DONNA message, 6 task cards in a responsive grid

---

## Routes Used for Each Setup Task

| Task | Route | Status |
|---|---|---|
| Review Curriculum | `/director/curriculum` | Live — page exists |
| Create First Class Template | `/director/class-templates/new` | Live — page exists |
| Create Fitness Template | `/director/fitness/templates/new` | Live — page exists |
| Upload Players | `/director/players` | Live — page exists |
| Add Coaches | `/director/coaches` | Live — page exists |
| Preview Portals | `/director` | Fallback — no dedicated preview route; uses dashboard |

All routes verified by inspecting `src/app/director/` directory tree before implementation.

---

## Local / Draft-Only Limitations

- The panel appears based purely on localStorage state — it has no DB awareness
- "Academy DNA Ready" means the local onboarding draft contains a non-empty `academyName` — not that any DB record was written
- No task is marked "complete" based on actual DB state — only "Ready next" on the first task (Review Curriculum)
- The panel dismiss is stored in localStorage (`academyos_continue_setup_dismissed`) — clearing localStorage brings it back
- No DB writes are made in this sprint

---

## Placement in Director Dashboard

The panel is inserted between the Hero Header and the DONNA Executive Attention Card. It is the first content block after the greeting, making it highly visible for first-time directors arriving from the onboarding flow. It does not appear if:
- No DNA draft exists in localStorage
- The dismiss key has been set

---

## Architecture Notes

- No schema changes. No migrations. No DB writes.
- `DirectorContinueSetupPanel` is a `'use client'` component — safe to import in the server-rendered `DirectorDashboard` page component (Next.js App Router supports this).
- localStorage key `'academyos_onboarding_draft_v2'` matches the key used in `OnboardingSaveStatus.tsx`.
- All errors in localStorage access are caught silently — the panel simply does not appear.

---

## Next Sprint Recommendation

**Sprint 381 — Director DNA Settings Write-Back V1**

When the director clicks "Activate" or completes setup, write the DNA draft fields to the `academies.settings` JSONB column via a Server Action. This makes the DNA data persistent server-side and allows the `OnboardingProgressCard` and dashboard to reflect DNA completion status without relying on localStorage.

Prerequisite: confirm the `academies.settings` schema can hold DNA fields, or add a dedicated `academy_dna` table (would require migration sign-off).

---

## TypeScript

Clean. `npx tsc --noEmit` — no errors.
