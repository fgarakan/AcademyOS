# Onboarding Flow Cognitive Load Reduction V1
**Date:** 2026-05-29
**Sprint:** 961

---

## Problems Addressed

The AcademyOS director onboarding flow had three concrete cognitive load issues before this sprint:

### 1. Progress rail showed only a bar + step name

`OnboardingProgressRail` showed a thin lime progress bar and a current step label ("Academy Basics") plus "Step 1 of 9". Directors had no way to:
- See what steps were coming after the current one
- Know what they had already completed
- Gauge how much of the flow remained

A director at step 4 of 9 could not tell whether the remaining steps would take 2 more minutes or 20 more minutes. This creates anxiety and early abandonment.

### 2. WelcomeStep contained wrong step count

The `WelcomeStep` inside `OnboardingShell.tsx` (step 0, only reachable by bypassing `AcademyDnaLanding`) displayed:

```
"5 steps — takes about 4 minutes"
```

…with a FLOW_STEPS array containing 6 items. The actual onboarding flow has 9 substantive steps (Academy Basics through Final Activation). Both numbers were wrong. This creates a broken promise when a director clicks through and sees 9 steps instead of 5.

### 3. No DONNA highlight target on primary CTA

The welcome step's primary "Start with DONNA" button had no `data-donna-focus-id`, preventing DONNA's what-next engine and highlight system from directing a director's attention to the correct CTA.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/onboarding/OnboardingProgressRail.tsx` | Upgraded from bar-only to bar + 9-step dot strip |
| `src/components/onboarding/OnboardingShell.tsx` | Fixed WelcomeStep step count; added `data-donna-focus-id` |

---

## UX Changes Made

### OnboardingProgressRail — before
```
[━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░]
ACADEMY BASICS                   Step 1 / 9
```

### OnboardingProgressRail — after
```
[━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░]
ACADEMY BASICS         Next: Coaching Philosophy   1 / 9
✓ Basics  ● Coaching  · Comms  · Sessions  · Players  · Parents  · Summary  · Adjust  · Activate
```

Director can now:
- See all 9 steps at a glance
- Know which steps are done (lime checkmark)
- Know the current step (lime ring)
- Know the next step by name ("Next: Coaching Philosophy")
- See upcoming steps as muted dots

### OnboardingShell WelcomeStep — before
```
"5 steps — takes about 4 minutes"
[Flow steps: 6 items]
```

### OnboardingShell WelcomeStep — after
```
"9 steps — takes about 10–15 minutes"
[Flow steps: 9 items, correctly matching actual steps 1–9]
```

### DONNA highlight target added
```html
<div data-donna-focus-id="onboarding-cta">
  <button>Start with DONNA</button>
  <button>Use recommended defaults</button>
</div>
```

DONNA can now highlight the primary CTA area when a director asks "what should I do next?" from the onboarding welcome step.

---

## Cognitive-Load Reduction Principles Applied

1. **Visibility of system status** — Directors always know where they are and what's coming.
2. **Correct expectations** — The stated step count matches reality.
3. **Reduced anxiety** — The dot strip removes the "how much is left?" question.
4. **AI highlight integration** — DONNA can guide directors to the right action.

---

## DONNA Guidance / Highlight Support

`data-donna-focus-id="donna-intelligence-signals"` was already added at `/director/donna` in Sprint 959. Sprint 961 adds:

- `data-donna-focus-id="onboarding-cta"` on the welcome step CTA wrapper

This allows DONNA's `buildWhatNextAnswer` engine and `donna:highlight` dispatch to focus a director's attention on "Start with DONNA" if they ask "what should I do next?" during onboarding.

---

## No-Migration Guarantee

- No database schema changes.
- No new tables, columns, or indexes.
- No `proposed_actions` interaction.
- No audit log writes.
- No official mutation behavior changes.
- All onboarding data continues to be stored as a draft in localStorage only until Final Activation.

---

## Safety Boundaries

- No parent/player communication.
- No player level movement.
- No roster/billing/attendance/curriculum mutation.
- No approval gate bypass.
- Sprint 904 approve/reject paths untouched.
- DONNA God Mode V1 systems (939–960) untouched.
- `/director/setup/page.tsx` is a separate setup flow — not touched in this sprint.

---

## What Was NOT Changed

- Individual step components (`AcademyBasicsStep.tsx`, `CoachingDnaStep.tsx`, etc.) — step number inconsistencies in their `OnboardingStepHeader` calls remain. Each hardcodes `stepNumber` and `totalSteps` independently of the rail. This is a V2 cleanup.
- `/director/setup/page.tsx` — this is a different setup path using `AnimatedOnboardingDeck` and was out of scope.
- `AcademyDnaLanding.tsx` — landing page was not modified.
- `OnboardingStepHeader.tsx` — the header component itself was not modified.
- The overall onboarding data model and draft persistence were not changed.

---

## V2 Improvements

1. **Step header number consistency** — Update each step component to derive `stepNumber` from a shared constant instead of hardcoding, so the header and progress rail always agree.
2. **Step-aware "Continue" CTA** — Change "Continue" buttons to say "Continue to [next step name] →" so directors know where they're going before clicking.
3. **Mobile step map** — The dot strip uses `overflow-x-auto` on small screens; V2 can collapse the strip to a segmented progress indicator on < 375px screens.
4. **Skip affordance** — Allow directors to skip optional steps with a visible "Skip this step" link.
5. **DONNA onboarding guidance at each step** — Wire `buildWhatNextAnswer` to surface a step-specific "what to fill in here" hint when a director asks DONNA.
