# Parent-Safe DONNA Guidance V1
**Date:** 2026-05-29
**Sprint:** 949
**Status:** Complete

---

## What Was Built

`src/lib/donna/donnaParentGuidance.ts` — parent-safe DONNA guidance builder connected to the unified personality module.

---

## Design

`buildParentGuidance(category, ctx)` produces a `ParentGuidanceResponse` for any of 7 categories:
- `current_focus` — what the child is working on
- `why_it_matters` — why this development area matters
- `support_at_home` — practical home support tips
- `after_practice` — what to say after practice
- `when_worried` — how to handle parental concern
- `when_to_contact` — when to reach out to the coach
- `progress_context` — how to understand advancement

All responses use `DONNA_PERSONALITY.parentSafeLanguage` for safety copy.

## Safety Invariants
- No raw coach notes in any output
- No rankings or peer comparisons
- No raw assessment scores
- No automatic communications
- All content is coach-approved summaries
- Source: `ParentSafeDonnaContext` only (childFirstName, level, focusCategory, doingWell, missionTitle)

## Personality Connection
All safety language (`noRawNotes`, `whenToContact`) comes from `donnaPersonality.ts` — single source of truth.

## Current Parent DONNA Surface
`src/app/parent/ask-donna/page.tsx` — chip-based interface. Sprint 949 library is available for future enhancement; no breaking changes to the existing chip interface.
