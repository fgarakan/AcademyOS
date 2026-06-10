# Academy Onboarding Seam Audit V1
**Sprint:** Mega Sprint 1685–1714  
**Date:** 2026-06-10  
**Author:** Claude Code  
**Status:** Audit only. No code changes.

---

## Purpose

Map every onboarding surface in AcademyOS, identify every seam gap between those surfaces and the rest of the system, and document what must be true for onboarding to be a 10/10 experience. This audit is the design prerequisite for building the final onboarding.

---

## Four Onboarding Surfaces (current state)

### Surface A — Academy DNA Shell (`/onboarding` and `/director/onboarding`)

**Route:** `/onboarding/page.tsx` → `OnboardingShell`  
**Entry:** `AcademyDnaLanding` at `/director/onboarding/page.tsx` → director picks a setup mode → mounts `OnboardingShell`

**10 steps:**
1. Welcome (step 0)
2. Academy Basics — name, location count, model, age groups, primary goals, program type
3. Coaching Philosophy — coaching styles
4. Coach Communication — primary/secondary communication voice
5. Session Design — session blocks
6. Player Development — curriculum starting point, focus levels, development priorities
7. Parent Communication — parent styles, visibility rules, player mission style
8. DNA Summary (`AcademyDnaReviewStep`) — review all captured values
9. DONNA Adjustment (`DonnaAdjustmentStep`) — fine-tune with DONNA
10. Final Activation (`ActivationChecklistStep`) — readiness checklist + next-step cards → "Go to Director Dashboard"

**Draft persistence:** `localStorage` (draft survives page reload)

**DB write:** One fire-and-forget write at step 10 via `saveAcademyOperatingLensAction`  
→ writes to `academies.settings.academyOperatingLens`

**What `academyOperatingLens` contains:**
```
mission, playerDevelopmentPhilosophy, coachingStyle,
developmentPriorities, curriculumPreference,
parentCommunicationStyle, coachRecapExpectations,
donnaCommunicationStyle, playerMissionStyle, setupMode
```

**What it does NOT produce:**
- No completion flags
- No player records
- No group records
- No template records
- No curriculum level records
- No coach records
- No portal visibility table writes

---

### Surface B — Legacy Director Onboarding Sub-Steps (`/director/onboarding/*`)

**Entry:** `OnboardingProgressCard` on the director dashboard → links to individual sub-steps  
**No hub page** — the hub *is* the `OnboardingProgressCard` card on the director dashboard

**7 steps tracked by boolean flags in `academies.settings`:**

| # | Flag key | Route | What it saves |
|---|---|---|---|
| 1 | `academy_identity_completed` | `/director/settings` | Identity fields (name, timezone, logo) |
| 2 | `director_interview_completed` | `/director/onboarding/interview` | `settings.director_interview` (7 free-text fields: philosophy, player_focus, development_priorities, competition_approach, parent_communication_style, coach_operating_style, ninety_day_success) |
| 3 | `curriculum_setup_completed` | `/director/onboarding/curriculum` | Curriculum starter selection (which levels to activate) |
| 4 | `level_gates_completed` | `/director/onboarding/level-gates` | Level gate/promotion rule config |
| 5 | `programs_groups_completed` | `/director/onboarding/programs-groups` | Group/program definitions |
| 6 | `coaches_permissions_completed` | `/director/onboarding/coaches-permissions` | Coach records + permission flags |
| 7 | `players_placement_completed` | `/director/onboarding/players-placement` | Player upload + initial placement |

**`OnboardingProgressCard` disappears** when all 7 flags are `true`.

---

### Surface C — Per-Player Placement Stepper (`/director/players/[playerId]/onboard`)

**Entry:** Player list or player profile → "Onboard" action  
**Scope:** Per-player, not per-academy

**6 steps:**
1. Player Profile — read-only display of player record
2. Parent / Contact — `StepParentCapture` → writes to `player_guardians`
3. Quick Placement Snapshot — `StepAssessment` → writes to `assessments` table
4. DONNA Recommendation — `StepDonnaRecommendation` → deterministic score-based group matching (no AI call)
5. Placement Review — `StepDirectorReview` → writes to `placement_recommendations` (status = approved)
6. Activate Player — `StepActivatePlayer` → calls `finalize_player_placement()` RPC

**This is the only surface that writes to core tables.** All other surfaces write to `academies.settings` (a JSONB blob).

**What `StepDonnaRecommendation` does NOT use:**
- `academyOperatingLens` (Track A output)
- `director_interview` (Track B output)
- Academy-level coaching style or development priorities

---

### Surface D — First-Run Deck (`FirstRunDeckGate`)

**Entry:** Automatic overlay on first visit to any portal (director/coach/player/parent)  
**Trigger:** `hasSeenDeck` boolean — set by `markFirstRunDeckSeenAction`

**4 role-specific decks** (animated card sequence with illustrations):
- `director` deck — introduces Director role, session loop, curriculum, DONNA
- `coach` deck — introduces Coach role, wrap-up, DONNA coaching tips
- `player` deck — introduces Player experience
- `parent` deck — introduces Parent portal

**What it is:** Product orientation, not setup. No data collection. No questions asked. No completion flags beyond "seen".

**Handoff:** None. After dismissal, the user lands on their portal homepage with no guidance about what to do next.

---

## Seam Inventory

### Seam 1 — Two Setup Tracks With No Awareness of Each Other ⚠️ Critical

**Problem:** Surface A and Surface B are both called "onboarding" but are completely parallel tracks. They share zero state and do not know the other exists.

- A director who completes all 10 steps of Surface A (Academy DNA Shell) lands on the director dashboard and sees `OnboardingProgressCard` showing 0/7 steps. They just spent 15 minutes setting up and are immediately told to do 7 more things.
- A director who works through Surface B sub-steps never fills in the Academy DNA captured by Surface A. `academyOperatingLens` stays empty.
- `academy_identity_completed` (Surface B step 1) points to `/director/settings` — completely outside the onboarding flow.

**What the final onboarding needs:** One unified flow. Either merge A and B into a single 10–12 step wizard, or explicitly sequence them so A leads directly into B.

---

### Seam 2 — `/director/onboarding` Is the Wrong Page ⚠️ Critical

**Problem:** `OnboardingProgressCard` tells the director "Continue Curriculum Setup" → links to `/director/onboarding`. But `/director/onboarding/page.tsx` renders `AcademyDnaLanding` — the landing screen before the 10-step DNA shell — not a setup hub for the 7 sub-steps.

**What the director sees:** They click "Continue Curriculum Setup" and land on a screen asking them to pick a setup mode (Fast Start / Guided / Full), which has nothing to do with the curriculum sub-step they were navigating toward.

**What the final onboarding needs:** `/director/onboarding` must be the single setup hub — a page that shows overall progress, the current step, and links to all sub-steps. The `AcademyDnaLanding` should either become step 0 of a unified flow or be removed.

---

### Seam 3 — `ActivationChecklistStep` Sends to Dashboard With Unmet Setup Items ⚠️ High

**Problem:** The final step of Surface A displays a checklist that verifies DNA fields (academy name filled, coaching styles selected, etc.) and then shows a "Go to Director Dashboard" CTA. The "Continue Setup" cards point to:
- `/director/curriculum` (not gated by whether curriculum levels exist)
- `/director/class-templates/new` (not gated by whether any templates exist)
- `/director/fitness/templates/new`

When the director clicks "Go to Director Dashboard", they land on the director page which shows `TodaySetupCard` (setup mode brief) because the academy is not yet live. But the specific steps shown in `TodaySetupCard` come from `buildTodayBrief()` — not from the 7-flag Surface B system.

**Two conflicting "what to do next" systems** are running simultaneously on the director dashboard: `TodaySetupCard` and `OnboardingProgressCard`. They can show different priorities.

**What the final onboarding needs:** After Surface A completes, the system should either: (a) auto-mark equivalent Surface B steps as done based on what was captured, or (b) Surface A should replace Surface B entirely, so there is only one set of "what's left" signals.

---

### Seam 4 — DONNA Placement Recommendation Ignores Academy DNA ⚠️ High

**Problem:** `StepDonnaRecommendation` (Surface C, step 4) recommends a group based on raw assessment scores matched against available groups. It does not read:
- `academyOperatingLens.coachingStyle` — the academy's coaching philosophy
- `academyOperatingLens.developmentPriorities` — what the academy emphasizes
- `director_interview.development_priorities` — the director's own stated focus
- Any level gate rules configured in Surface B

A "high-performance" focused academy and a "recreational" focused academy get identical placement recommendations for the same assessment scores.

**What the final onboarding needs:** `StepDonnaRecommendation` should read `academyOperatingLens` (or the unified DNA output) and factor in academy philosophy when ranking groups. At minimum, the DONNA commentary in step 4 should reflect the academy's stated model.

---

### Seam 5 — First-Run Deck Has No Handoff ⚠️ Medium

**Problem:** The director deck is dismissed → user lands on the director dashboard. No guidance about what to do first. No link to setup. The deck teaches the product but does not lead into setup.

The deck also fires on the dashboard, which may already show `OnboardingProgressCard` and `TodaySetupCard`. Three simultaneous "here's what to do" systems appear on first login.

**What the final onboarding needs:** The deck's final slide should have a CTA that leads directly into the setup flow. Alternatively, the deck should be integrated as the first step of onboarding (the "orientation" before setup begins), not a separate overlay.

---

### Seam 6 — `academyOperatingLens` vs `academy_dna` Key Mismatch ⚠️ Medium

**Problem:** The director dashboard checks `academy_dna` to decide whether the academy has DNA:
```ts
const hasAcademyDna = typeof onboardingSettings.academy_dna === 'object' 
  && onboardingSettings.academy_dna !== null
```

But `saveAcademyOperatingLensAction` writes to `academyOperatingLens`, not `academy_dna`.

These are two different keys in `academies.settings`. After a director completes the 10-step DNA shell, `hasAcademyDna` is still `false` because the code is reading the wrong key.

**Impact:** `buildTodayBrief()` may show setup tasks even after DNA is fully captured, because `isAcademyLive` and `hasAcademyDna` are both computed incorrectly.

**What the final onboarding needs:** Either rename `academyOperatingLens` → `academy_dna`, or update the director page to read `academyOperatingLens`. The key used at write-time and read-time must match.

---

### Seam 7 — `parentVisibilityRules` and `playerMissionStyle` Never Reach the Portals ⚠️ Medium

**Problem:** The DNA shell captures:
- `parentVisibilityRules` — e.g., `{ hideRawCoachNotes: true, hideRankings: true, ... }`
- `playerMissionStyle` — e.g., `'challenge-based'`

These are stored in `academyOperatingLens`. But the parent and player portals read visibility from `parentSafeResponseRules.ts` (a hardcoded file) and from DB queries — they do not read `academyOperatingLens`.

**Impact:** Directors who carefully configure parent privacy during onboarding see no effect on the actual parent portal. The `parentVisibilityRules` captured in DNA are a dead end.

**What the final onboarding needs:** After DNA is saved, the system must translate `parentVisibilityRules` and `playerMissionStyle` into the appropriate DB records or settings keys that the portals actually read.

---

### Seam 8 — `curriculumPreference` (Surface A) Never Pre-Populates Curriculum (Surface B) ⚠️ Medium

**Problem:** In Surface A Step 6 (Player Development), the director picks a `curriculumStartingPoint` (e.g., `'itf-pathway'`, `'custom'`). This is stored in `academyOperatingLens.curriculumPreference`.

In Surface B Step 3 (`/director/onboarding/curriculum`), the director again configures curriculum structure — independently. The `CurriculumStarterForm` does not read `academyOperatingLens.curriculumPreference` to pre-fill the selection.

The director answers the same question twice in two different steps that don't know about each other.

**What the final onboarding needs:** The curriculum sub-step should read `curriculumPreference` from `academyOperatingLens` and pre-fill the form. Or the curriculum choice should only happen once.

---

### Seam 9 — No Single "Onboarding Complete" Signal ⚠️ Medium

**Problem:** There is no explicit `onboarding_complete: true` flag or event in the system. "Complete" is inferred from:
- Surface A: `ActivationChecklistStep` shows a "DNA is complete" banner (local draft state only)
- Surface B: `OnboardingProgressCard` disappears when 7 booleans are all `true`
- Director dashboard: `isAcademyLive` is computed from runtime data (`players.length > 0 && playersWithLevel > 0 && classTemplateCount > 0 && sessionsExist`)

These three "is it done?" signals can all give different answers at the same time.

**Impact:**  
- DONNA cannot give a reliable answer to "am I ready to launch?" — `donnaOnboardingGuideAnswer.ts` uses `DirectorDonnaContext` (live data counts) which is different from the completion flags
- The system cannot distinguish "we're done, this is the real dashboard" from "setup is still in progress"
- No audit trail of when onboarding was completed

**What the final onboarding needs:** A single `onboarding_completed_at: ISO timestamp` written to `academies.settings` (or a dedicated column) when all required steps are done. All "is setup done?" checks read this one source of truth.

---

### Seam 10 — No First-Login Route Enforcement ⚠️ Low

**Problem:** Middleware does not check whether a new director has completed onboarding. A brand-new director account with no data goes directly to `/director` — the full dashboard — which shows setup cards but also tries to render KPIs, attention queue, etc. with empty data.

There is no "if no academy DNA and no players → redirect to onboarding" rule.

**Impact:** Empty-state handling on the director dashboard carries all the weight of guiding new directors into setup. This works but creates cognitive load — a director sees a dashboard shaped for an active academy, mostly empty, with a setup card in the middle.

**What the final onboarding needs:** For a new director with zero data, middleware (or the director page server component) should redirect to the onboarding flow. The dashboard should only show after at least the minimum setup is complete.

---

### Seam 11 — Player Onboarding Review Queue Not Connected to Surface C ⚠️ Low

**Problem:** `/director/players/onboarding-review/page.tsx` is a separate route for reviewing player placements. But Surface C (`/director/players/[playerId]/onboard`) ends with "Activate Player" — the director already approved the placement at step 5 before activating.

It is unclear what the onboarding-review queue is for, or how players land in it vs. being onboarded via Surface C.

**What the final onboarding needs:** Clarify whether Surface C is the primary player onboarding path (it should be) and whether `onboarding-review` is a secondary review path for bulk imports or auto-created players. These two paths should be explicitly labeled and linked.

---

## What V1 Final Onboarding Needs — Summary

To reach a 10/10 onboarding, the following must be true:

| # | Requirement | Closes Seam |
|---|---|---|
| 1 | One unified setup flow — Surface A and B merged or explicitly sequenced | 1, 2, 3 |
| 2 | Single `onboarding_completed_at` field in `academies.settings` | 9 |
| 3 | Fix `academy_dna` vs `academyOperatingLens` key mismatch | 6 |
| 4 | `parentVisibilityRules` written to portal-readable location after DNA save | 7 |
| 5 | `curriculumPreference` pre-fills curriculum sub-step | 8 |
| 6 | `StepDonnaRecommendation` reads `academyOperatingLens` for group ranking | 4 |
| 7 | First-run deck ends with a CTA into setup | 5 |
| 8 | New director with zero data routes to onboarding, not dashboard | 10 |
| 9 | Onboarding-review queue vs Surface C player activation — explicitly labeled | 11 |

---

## Onboarding Completeness Score (Current State)

| Dimension | Score | Notes |
|---|---|---|
| Surface coherence (one flow or clearly sequenced flows) | 3/10 | 4 surfaces, 2 parallel tracks, conflicting hub routing |
| Data flow (what's captured → where it's used) | 3/10 | `academyOperatingLens` written but mostly not read |
| Director experience (cognitive load, clarity) | 4/10 | DNA shell is high quality; integration into system is broken |
| DONNA integration (uses onboarding data) | 2/10 | `donnaOnboardingGuideAnswer` is good but reads wrong signals |
| Player onboarding (Surface C) | 7/10 | Best-built surface; seam to academy DNA is the main gap |
| First-run orientation (deck) | 6/10 | Well-designed; no handoff to setup |
| **Overall** | **4/10** | Each surface is individually reasonable; they don't form a system |

---

## Build Order for Final Onboarding (Design Recommendation)

This audit does not prescribe implementation, but the seam analysis suggests this order minimizes rework:

1. **Fix Seam 6 first** — resolve `academy_dna` vs `academyOperatingLens` key mismatch. This is a 5-line fix with zero UX impact, but it unblocks correct "is setup done?" detection everywhere.

2. **Add `onboarding_completed_at`** to `academies.settings` — gives the system a single source of truth for completion state.

3. **Design unified flow** — decide: merge Surface A + B into one 12-step wizard, or make Surface A explicitly feed into Surface B with state carried over. Do not build until this design decision is made.

4. **Wire `parentVisibilityRules`** — after DNA save, translate into DB-readable location. High director trust impact.

5. **Wire `curriculumPreference`** into curriculum sub-step pre-fill.

6. **Update `StepDonnaRecommendation`** to read `academyOperatingLens`.

7. **First-run deck handoff** — last slide CTA → setup flow.

8. **Middleware / new-director routing** — last, after setup flow is stable.

---

## Files Audited (no changes made)

| File | Purpose |
|---|---|
| `src/app/onboarding/page.tsx` | Surface A route shell |
| `src/app/director/onboarding/page.tsx` | Surface A landing (AcademyDnaLanding) |
| `src/components/onboarding/AcademyDnaLanding.tsx` | Setup mode selector |
| `src/components/onboarding/OnboardingShell.tsx` | 10-step DNA wizard |
| `src/components/onboarding/steps/ActivationChecklistStep.tsx` | Final step of Surface A |
| `src/lib/actions/saveAcademyOperatingLensAction.ts` | Surface A DB write |
| `src/app/director/OnboardingProgressCard.tsx` | Surface B progress tracker (embedded in dashboard) |
| `src/app/director/onboarding/interview/page.tsx` | Surface B step 2 |
| `src/app/director/onboarding/*/updateXxxAction.ts` (5 files) | Surface B DB writes |
| `src/app/director/players/[playerId]/onboard/page.tsx` | Surface C route shell |
| `src/app/director/players/[playerId]/onboard/OnboardingStepperClient.tsx` | Surface C 6-step stepper |
| `src/components/onboarding/FirstRunDeckGate.tsx` | Surface D first-run overlay |
| `src/lib/donna/donnaOnboardingGuideAnswer.ts` | DONNA onboarding guidance engine |
| `src/middleware.ts` | Auth + role routing (no onboarding gate) |
| `src/app/director/page.tsx` | Director dashboard (`hasAcademyDna` signal) |
