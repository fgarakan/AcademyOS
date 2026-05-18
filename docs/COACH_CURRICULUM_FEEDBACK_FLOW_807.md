# Sprint 807 — Coach Onboarding to Curriculum Feedback Flow V1

**Date:** 2026-05-18
**Sprint:** 807

---

## What coaches need to know about curriculum

Coaches in AcademyOS can see and use the curriculum, but they cannot directly edit it. This is intentional and should be explained during coach onboarding.

---

## What coaches can do

| Action | How |
|--------|-----|
| View drills for a level | Player profile → Sessions → drill card detail |
| See gate criteria for a level | Player profile → Assessments |
| Submit a curriculum suggestion | Session wrap-up → "Curriculum feedback" field (DONNA records it) |
| Flag a drill that isn't working | Session wrap-up voice note → DONNA flags for director review |

## What coaches cannot do

| Action | Why |
|--------|-----|
| Edit a drill directly | Curriculum integrity — all changes go through director review |
| Add a new gate | Same — all gate changes are director-approved |
| Override a gate result | Assessment results require director confirmation to override |
| Move a player to the next level | Level advancement always requires `finalize_player_placement()` triggered by director |

---

## Onboarding script for coaches

> "When you run a session, DONNA helps you log what happened. If a drill isn't working, or if you have an idea for a new exercise, you can describe it in the wrap-up note. That goes to the director, who reviews it and decides whether to queue a curriculum change."

> "You don't need to think about curriculum structure. Focus on the session. DONNA and the director handle the rest."

---

## Why this boundary exists

The coach suggestion boundary protects curriculum integrity: a single coach's session experience should inform but not override academy-wide curriculum decisions. If three coaches all report the same drill isn't working, the pattern becomes visible in the data. One session flag should not rewrite the curriculum.

This is explained to coaches via `CoachSuggestionBoundary.tsx` in the builder (director-facing) and verbally during onboarding.

---

## Coach onboarding checklist

- [ ] Coach understands they see the curriculum but don't edit it
- [ ] Coach knows how to submit a curriculum suggestion via session wrap-up
- [ ] Coach knows where to find gate criteria for a player's level
- [ ] Coach understands that level advancement is a director decision
- [ ] Coach has been shown the session wrap-up flow at least once
