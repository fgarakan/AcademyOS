# DONNA Onboarding — Academy DNA Review Step V1

**Date:** 2026-05-19
**Sprint:** O-8

---

## Summary

Created `AcademyDnaReviewStep` (Step 6 of 7) and the shared `AcademyDnaSummaryCard` component. Full review of all draft selections with inline edit links. No DB writes.

---

## Components

### `AcademyDnaSummaryCard`

Reusable summary card used in both the review step and the DONNA panel. Accepts:
- `draft` — current OnboardingDraft
- `onEditStep?` — callback to jump to a step
- `compact?` — compact list layout (no readiness bar header)

Shows: readiness progress bar, section completion status (CheckCircle/Circle), summary text per section, edit pen icon per section.

Readiness score: 9-point scale across all key draft fields.

### `AcademyDnaReviewStep`

Step 6 of 7. Shows:
- AcademyDnaSummaryCard with readiness bar
- Full DNA detail table: Academy Identity / Coaching DNA / Session Structure / Parent + Player Experience
- Each section has grouped rows with label, pill/value display, and "Edit" link
- DONNA summary card: "DONNA is ready to build your starting system" with 5 output chips
- Proceed to Activation CTA (active when any content exists)

## Edit Navigation

`onEditStep(stepIndex)` callback passed from shell — jumps back to any step. Wired via `goToStep` in OnboardingShell.

## Safety Rules

- No DB writes
- Review is read-only — only navigation to edit steps modifies draft
- "I'll prepare..." future tense only
- "Draft only" framing preserved
