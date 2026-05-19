# Observation Apply Flow Polish — Sprint 1051

**Date:** 2026-05-19
**Sprint:** 1051 — Observation Apply Flow Polish V1
**Phase:** Phase 6 — Director Review Queue Apply Flow (Sprints 1046-1053)

---

## What changed

Polished the player observation draft review and apply flow to make it clearer what the observation is, who submitted it, and what changes when the director applies it.

### Files modified
- `src/app/director/review/WrapUpObservationDraftCard.tsx`
- `src/app/director/review/ApplyWrapUpObservationDraftControls.tsx`

---

## WrapUpObservationDraftCard changes

### DONNA-style brief line (new)
Added a one-line summary below the observation header:
- Format: `[Coach name] · noted in [session title] · [date]`
- Parts that are unavailable (no coach name, no session title) are omitted
- Gives the director immediate context about who observed what and when

### Internal-only badge
Changed the Lock badge label from "Internal only" to "Internal only — not visible to parent or player" for clarity.

### Removed incomplete reviewer_notes block
The `EnrichedObservationDraftItem` interface does not include `reviewerNotes` (that field exists on `EnrichedWrapUpDraftItem` but not here). The clarification note display was removed to avoid a type error and incorrect behavior. If reviewer notes on observations are needed in a future sprint, `EnrichedObservationDraftItem` and its enrichment in `page.tsx` would need updating.

---

## ApplyWrapUpObservationDraftControls changes

### What changes when applied (new)
Replaced generic `Info` note with a structured "What changes when applied" box:

**Will change:**
- One internal coach observation is created on the player profile
- Draft is marked as applied

**Will NOT change:**
- Observation is private — not visible to parents or players
- Does not move the player to a new curriculum level
- Does not send any parent or player communication
- Does not change the session template or curriculum

This matches the DONNA context panel language and makes the apply flow explicit and safe.

---

## Safety

- No DB writes added
- No automatic actions
- No parent sends
- No curriculum mutation
- No level movement
- Apply button and action unchanged — only the explanation box was added

---

## TypeScript

Clean (`npx tsc --noEmit` — zero errors).
