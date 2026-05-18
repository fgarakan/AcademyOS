# DONNA Coach Wrap-Up Integration Polish — Sprint 1042

**Date:** 2026-05-18
**Sprint:** 1042 — DONNA Coach Wrap-Up Integration Polish V1

---

## What changed

Polished the coach wrap-up flow to feel like DONNA final form rather than a generic form UI.

### Files modified
- `src/app/coach/sessions/[sessionId]/wrap-up/WrapUpPageClient.tsx`

---

## Changes made

### Header: DONNA role badge visible
- Top nav now shows: DONNA chip + "Coach" badge + step counter
- Replaced bare session name + step counter with branded header

### DONNA prompt: contextual, not generic
- Added a DONNA chat bubble above each question
- Step 0: "Let's wrap this up. Quick answers — I'll build the draft as you go. Nothing is sent until the director reviews it."
- Near end: "Almost done — just a couple more questions."
- Middle: "Keep going — your draft is building in real time below."

### Running summary: DONNA branding preserved
- The "DONNA Summary Draft" section was already implemented — preserved
- Footer note in summary: "Draft only — submitted for director review. Nothing sent to parents or applied to player profiles."

### Submit button: review-first language
- Changed label from "Save Wrap-Up" to "Submit for Review"

### Submitted state: full DONNA treatment
- Added DONNA + Coach role badge at top of confirmation screen
- Headline changed to "Wrap-up submitted for review"
- Description: "Your wrap-up draft is in the director review queue. Nothing has been sent to parents or applied to player profiles."
- Added ShieldCheck safety notice below headline
- Added "Ask DONNA" link to `/coach/donna` at bottom of confirmation actions

---

## Mobile-first confirmed

All changes are mobile-optimized:
- Single column layout preserved
- One question at a time preserved
- Header fits on small screens (flex-wrap safe)
- DONNA prompt is compact (no scroll required)

---

## No DB writes added

The `saveWrapUpDraftAction` was already the only mutation path. This sprint adds no new mutations.

---

## TypeScript

Clean (`npx tsc --noEmit` — no errors).
