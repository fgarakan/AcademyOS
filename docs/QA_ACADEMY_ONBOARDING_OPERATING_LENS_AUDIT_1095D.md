# QA: Academy Onboarding Operating Lens Audit
**Sprint:** 1095D
**Date:** 2026-06-01
**Result:** AUDIT COMPLETE — No runtime changes

---

## Checklist

| # | Check | Result |
|---|---|---|
| 1 | Current onboarding flow structure documented | PASS |
| 2 | Current onboarding questions documented (both systems) | PASS |
| 3 | What onboarding stores today (DB vs localStorage) | PASS |
| 4 | What DONNA can access after onboarding | PASS |
| 5 | Academy mission/philosophy gaps documented | PASS |
| 6 | Development philosophy gaps documented | PASS |
| 7 | Curriculum lens gaps documented | PASS |
| 8 | Coach lens gaps documented | PASS |
| 9 | Parent lens gaps documented | PASS |
| 10 | Player lens gaps documented | PASS |
| 11 | DONNA personality/speaking-style gaps documented | PASS |
| 12 | Safety/approval rule gaps documented | PASS |
| 13 | Onboarding-to-Curriculum Insight View connection documented | PASS |
| 14 | Cognitive load problems identified | PASS |
| 15 | Missing fields listed with priority | PASS |
| 16 | Schema-free vs. schema-required options separated | PASS |
| 17 | Next implementation sprint recommended | PASS |
| 18 | What not to build documented | PASS |
| 19 | No code changes made | PASS |
| 20 | No schema changes made | PASS |
| 21 | No runtime behavior changes | PASS |
| 22 | TypeScript not applicable (no code changes) | N/A |

---

## Critical Finding Confirmed

**The 10-step DNA Shell (`OnboardingShell`) saves exclusively to `localStorage`. No server action writes DNA answers to the database.**

This was confirmed by reading:
- `src/components/onboarding/OnboardingSaveStatus.tsx` — localStorage write on every draft change, no DB call
- `src/components/onboarding/steps/ActivationChecklistStep.tsx` — sends director to `/director` with no DB save call
- Search for `saveAcademyDna`, `academy_dna`, `coachingStyle`, `developmentPriority`, `sessionBlock` in `/director/onboarding/` — no server action found for these fields
- The only server actions in `src/app/director/onboarding/` are for the OLD sub-route steps (interview, curriculum, level-gates, coaches-permissions, programs-groups, players-placement)

---

## DONNA Context Confirmed Incomplete

`buildAcademyProfileFromLiveData()` in `donnaAcademyProfileContext.ts` assembles DONNA's academy context. Its `getAcademyProfileSummaryText()` output contains:
- Academy name and country ✓
- Director name ✓
- Player and coach counts ✓
- Curriculum version ✓
- Ball levels ✓
- Parent communication tone ✓

It does NOT contain:
- Coaching styles ✗
- Development priorities (ranked) ✗
- Session design preferences ✗
- Academy model type ✗
- Parent communication style (structured) ✗
- Anything from the 10-step DNA Shell ✗

---

## Philosophy Profile Confirmed as Derived-Only

`academyPhilosophyProfile.ts` defines `AcademyPhilosophyProfile` with `developmentEmphasis`, `contentDomainPriorities`, etc. The `buildDefaultPhilosophyProfile()` function derives this purely from `totalLevels` — it never reads director interview answers or DNA Shell selections. The `source` is always `'derived'`, never `'director_defined'`.

---

## Recommended Sprint Confirmed Safe

Sprint 1095E (Academy DNA Persistence Bridge) requires:
- 1 new server action (`saveAcademyDnaAction.ts`)
- Updates to 3 existing TypeScript files (no new tables, no migrations)
- No RLS changes
- No permission changes
- No parent/player data exposure

This is the minimum viable fix to make DONNA aware of the academy's operating philosophy.

---

## Audit Files Created

- `docs/architecture/ACADEMY_ONBOARDING_OPERATING_LENS_AUDIT_1095D.md`
- `docs/QA_ACADEMY_ONBOARDING_OPERATING_LENS_AUDIT_1095D.md`

---

## No TypeScript Validation Needed

No `.ts` or `.tsx` files were created or modified in this sprint.
`npx tsc --noEmit` not required — audit-only sprint, documentation only.
