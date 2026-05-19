# DONNA Onboarding — Session + Curriculum Defaults Step V1

**Date:** 2026-05-19
**Sprint:** O-6

---

## Summary

Created `SessionCurriculumDefaultsStep` (Step 4 of 7) covering session building blocks and player development priorities. No DB writes.

---

## Data Captured

| Field | Type | Constraint |
|---|---|---|
| Session Blocks | Multi-select cards | Any number, ordered by selection |
| Development Priorities | Pill multi-select | Up to 5, ranked by selection order |

## Session Building Blocks (7)

Technique Blocks / Live Ball Heavy / Constraint Games / Point Play Progression / Stations + Rotations / Assessment Moments / Fitness Integrated

Each block shows: name, description, duration. Fixed blocks (Warm-Up 10min, Reflection 5min) always appear in timeline.

## Development Priorities (10)

Technical Foundation / Tactical IQ / Movement Quality / Competitive Toughness / Emotional Regulation / Consistency + Rally Tolerance / Aggressive Identity / All-Court Development / Serve + Return Priority / Independence + Ownership

## UX Patterns

- Session block cards with selection state (lime top bar, checkmark badge)
- Live timeline preview: proportional flex widths by duration, duration labels below
- Total session duration counter in mono text
- DONNA confirmation after any block selection: "I'll prepare your default session structure with..."
- Priority pills with rank numbers (1-5) on selection
- Priority rank display panel with X remove buttons
- DONNA confirmation after 3+ priorities: context on downstream impact
- Continue always enabled (no required fields)

## Safety Rules

- No DB writes
- "I'll prepare..." (future tense) not "Applied" or "Updated"
