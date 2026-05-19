# DONNA Onboarding — Activation Checklist Step V1

**Date:** 2026-05-19
**Sprint:** O-10

---

## Summary

Created `ActivationChecklistStep` (Step 7 of 7 — the final step). 8 checklist items with readiness checks against the live draft, real route links, and a conditional Activate button. No DB writes. Replaced `PlaceholderStep` for the final step and removed the now-unused `PlaceholderStep` function from the shell.

---

## Checklist Items (8)

| Item | Required | Route |
|---|---|---|
| Academy identity configured | Yes | /director |
| Coaching DNA defined | Yes | /director |
| Default session structure set | No | /director |
| Parent experience configured | No | /parent |
| Parent privacy rules active (3+ of 5) | Yes | /director |
| Player mission style set | No | /player |
| Add your first player | No | /director/players |
| Schedule your first session | No | /director/sessions |

"Add first player" and "Schedule first session" always show as not ready (future capability — no live data check yet).

## UX Patterns

- AcademyDnaSummaryCard in compact mode at top
- CheckCircle2 (lime) / Circle (muted) per item
- "Required" orange badge on incomplete required items
- "Ready" lime badge on complete items
- Route link with ExternalLink icon on each row
- Progress counter: X/8 complete
- Activation status card: shows readiness message or remaining required count
- "Activate Starting System" button: active (lime) when all required items ready, disabled (muted border) when not
- "Complete required items first" label shown when blocked

## Safety Rules

- No DB writes
- Activate button is disabled until all required checks pass
- Footer: "Nothing has been saved or applied yet."
- Activation button wired to no-op (DB write implementation deferred to post-onboarding sprint)
