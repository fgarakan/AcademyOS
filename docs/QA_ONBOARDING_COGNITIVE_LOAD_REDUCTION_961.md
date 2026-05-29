# QA — Onboarding Flow Cognitive Load Reduction V1
**Date:** 2026-05-29
**Sprint:** 961

---

## TypeScript

- [x] `npx tsc --noEmit` passes with no errors
- [x] `OnboardingProgressRail.tsx` compiles cleanly — `CheckCircle2` import resolves, all props typed
- [x] `STEPS` array is typed as `{ index: number; label: string; short: string }[]`
- [x] `STEP_PROGRESS` record covers all step indices 0–9
- [x] All conditional class joins use string arrays — no type errors
- [x] `OnboardingShell.tsx` compiles cleanly — no new types added, only copy changes and one HTML attribute

---

## Onboarding flow checklist

- [x] Progress rail renders on steps 1–9 (step 0 / welcome returns null — unchanged)
- [x] Progress bar advances correctly using `STEP_PROGRESS` — step 1 = 11%, step 9 = 100%
- [x] Current step label shown at top-left of rail (e.g. "ACADEMY BASICS")
- [x] Step counter shown at top-right (e.g. "1 / 9")
- [x] "Next: [step name]" hint shown on steps 1–8 (hidden at step 9 — no next step)
- [x] "Next:" hint hidden on small screens (`hidden sm:block`) to avoid overflow
- [x] 9-step dot strip renders correctly with all 9 steps
- [x] Completed steps (index < currentStep) show lime `CheckCircle2` icon
- [x] Current step shows lime ring dot (border-2 border-lime bg-lime/20)
- [x] Next step shows slightly more visible dot (bg-text-muted/40)
- [x] Future steps show muted dots (bg-border)
- [x] Connector lines between dots: lime/30 for completed spans, border/60 for upcoming
- [x] Short labels align with full labels (Basics = Academy Basics, etc.)
- [x] Step dot strip is scrollable on very small screens (`overflow-x-auto min-w-max`)

---

## CTA clarity checklist

- [x] WelcomeStep step count corrected from "5 steps" to "9 steps"
- [x] WelcomeStep time estimate corrected from "4 minutes" to "10–15 minutes"
- [x] WelcomeStep `FLOW_STEPS` array corrected from 6 items to 9 items matching actual steps 1–9
- [x] WelcomeStep primary button still reads "Start with DONNA" (unchanged — good label)
- [x] WelcomeStep secondary button still reads "Use recommended defaults" (unchanged)
- [x] No other CTA text was changed in this sprint

---

## Mobile / basic responsive checklist

- [x] Progress bar is full-width (unchanged from before)
- [x] Step label row uses `px-4` padding — safe at all widths
- [x] "Next:" hint hidden on mobile (`hidden sm:block`) — no layout overflow
- [x] Step dot strip uses `overflow-x-auto` — scrolls on narrow viewports without breaking layout
- [x] `min-w-max` on the dot strip inner div prevents wrapping
- [x] Short labels (max 8 chars) are compact enough for horizontal scroll
- [x] Rail height added: approximately 24px (label row) + 28px (dot strip) above baseline — acceptable

---

## DONNA highlight target checklist

- [x] `data-donna-focus-id="onboarding-cta"` added to WelcomeStep CTA wrapper div
- [x] Target wraps both "Start with DONNA" and "Use recommended defaults" buttons
- [x] Target ID follows naming convention used throughout codebase
- [x] No existing `data-donna-focus-id` values were removed or renamed
- [x] DONNA's `buildWhatNextAnswer` engine can now reference `"onboarding-cta"` as a highlight target
- [x] `donna:highlight` event can now focus the correct onboarding action element

---

## No-mutation / no-send checklist

- [x] No `supabase.from(...)` calls in any modified file
- [x] No `proposed_actions` records created
- [x] No audit log writes
- [x] No player record mutations
- [x] No curriculum record mutations
- [x] No attendance record mutations
- [x] No parent/player communication sent
- [x] No push/email/SMS dispatch
- [x] No approval gates bypassed
- [x] Onboarding draft continues to be localStorage-only until Final Activation

---

## Protected systems checklist

- [x] Sprint 904 approve/reject paths: untouched
- [x] `proposed_actions` state machine: untouched
- [x] DONNA God Mode V1 systems (939–960): untouched — `OnboardingProgressRail` and `OnboardingShell` are not part of the DONNA intelligence or routing layer
- [x] DONNA highlight/context/action systems: untouched — only a new `data-donna-focus-id` was added (additive)
- [x] Coach wrap-up loop (926–936): untouched
- [x] Parent/player communication safety: untouched
- [x] Player level movement safety: untouched
- [x] Roster/placement/billing/curriculum mutation: none
- [x] RLS/multi-tenant boundaries: not applicable — no DB calls in modified files
- [x] `/director/setup/page.tsx`: not touched — separate setup flow
- [x] `AcademyDnaLanding.tsx`: not touched
- [x] Individual step components: not touched — their step number inconsistencies remain V2
- [x] `OnboardingStepHeader.tsx`: not touched
