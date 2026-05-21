# Mental Performance Path

> Sprint 494 — Mental Performance Path V1
> See also: `src/lib/curriculum/mentalPerformance.ts`

---

## Purpose

Defines the mental performance curriculum path — what mental competencies players should develop at each stage. Mental is already a `block_type` in the database. This module adds the structured competency definitions that are currently missing.

---

## Mental performance domains (7)

| Domain | Focus |
|---|---|
| focus_and_concentration | Attention management per point |
| resilience_and_recovery | Emotional reset after errors |
| competitive_mindset | Strategic adaptation in matches |
| pressure_management | Performing on key points |
| self_talk_and_confidence | Constructive inner voice |
| process_orientation | Playing toward tactics, not outcome |
| routine_and_preparation | Consistent pre-point rituals |

---

## Stage progression

| Stage | Priority Domain | Session Recommendation |
|---|---|---|
| red_foundation | focus_and_concentration | 5–10 min focus drill per session |
| orange_development | routine_and_preparation | Build routine in warm-up |
| green_performance | pressure_management | Pressure-point simulations weekly |
| yellow_competitive | competitive_mindset | Match play with structured debrief |
| high_performance | competitive_mindset | Individualised programme |

---

## Data format

Each `MentalCompetency` includes:
- `observableMarkers` — what the coach looks for
- `coachingCues` — language to use with the player
- `parentFacingLabel` — safe, encouraging parent description
- `playerFacingLabel` — motivating player description

---

## Wiring targets

- Director curriculum view — mental domain section
- Coach session block recommendations (mental block type)
- DONNA task flow: `add_curriculum_idea` — domain: mental
- Badge system: `mental_edge` badge
