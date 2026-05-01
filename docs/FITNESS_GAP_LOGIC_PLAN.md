# Fitness Gap Logic Plan

**Status:** Plan only — Sprint 47. No player dashboard or live UI yet.
**Last updated:** 2026-05-01

---

## Objective

Define how fitness assessments, attendance, completed session blocks, and coach notes combine into at-home fitness gaps — and from those gaps, into targeted at-home fitness recommendations.

---

## Inputs

### 1. Fitness assessments
- Source: `player_assessments` table, `assessment_type = 'intake' | 'quarterly' | 'reassessment'`
- Relevant dimensions (from assessment `dimensions` JSON):
  - `mobility` — flexibility and range of motion
  - `balance` — static and dynamic balance
  - `agility` — directional changes and quickness
  - `sprint_mechanics` — running form and acceleration
  - `strength_basics` — bodyweight strength control
  - `coordination` — hand-eye and footwork coordination
  - `recovery` — readiness and fatigue indicators
  - `readiness` — current session readiness score
- A low score on a dimension signals a gap.

### 2. Attendance (via attendance_exception drafts + session_attendance)
- Source: `session_attendance` table, `status = 'absent'`
- If a player missed a session that contained fitness blocks, they missed planned fitness exposure.
- Missed blocks → unaddressed fitness categories from that session.

### 3. Completed fitness blocks (session exposure)
- Source: `session_block_exercises`, joined through sessions the player attended
- `session_block_exercises.completed = true` → this exercise was done
- `completed = false` → the block ran but this exercise was skipped
- Exercise category → fitness gap category mapping (see below)

### 4. Missed exposure (attendance gap)
- Sessions where `session_attendance.status = 'absent'` → all exercises in that session are "missed"
- Aggregate missed exercise categories → exposure gap

### 5. Fitness coach notes
- Source: `coach_observations`, `observation_type = 'general' | 'movement' | 'behavioral'`
- Tags: `fitness`, `movement`, `recovery`, `strength`, `agility`, `balance`, `speed`, etc.
- Recent coach observations (last 30 days) with fitness-related tags increase gap signal

### 6. Readiness / recovery flags
- Source: `player_development_signals`, `signal_type` containing `load_overload_detected` or `overtraining_risk`
- If active → reduce recommendation intensity; prioritize recovery

---

## Gap categories

| Category | Maps to | Exercise categories |
|---|---|---|
| `mobility` | Low mobility assessment score or missed mobility blocks | warm_up, cool_down, movement |
| `balance` | Low balance score | movement, fitness |
| `agility` | Low agility score or missed movement blocks | movement, fitness |
| `sprint_mechanics` | Low sprint score | movement, fitness |
| `strength_basics` | Low strength score or missed fitness blocks | fitness |
| `coordination` | Low coordination score or missed technical blocks | technical, movement |
| `recovery` | Active overtraining signal or low readiness | cool_down |
| `readiness` | Low readiness score in last assessment | any (reduced intensity) |

---

## Deterministic recommendation logic

### Step 1 — Score each gap category

```
gap_score(category) =
  assessment_penalty(category)     -- low score → higher penalty
  + missed_sessions_penalty        -- # of missed sessions with relevant blocks
  + coach_note_signal              -- # of coach notes mentioning category
  - recent_completed_exercise_bonus -- exercises in this category completed recently
```

All values are normalized 0–1. Gap score 0 = no gap; 1 = severe gap.

### Step 2 — Prioritize gaps

- Sort categories by gap_score descending
- Drop categories below threshold (0.3)
- Cap at 3 categories per recommendation to keep it actionable

### Step 3 — Select exercises

- For each priority category, select 2–3 at-home exercises:
  - No equipment required (or minimal: bands, bodyweight)
  - Appropriate for player age/level
  - Drawn from exercise library with `load_type = 'bodyweight'` or `equipment = []`
- Fall back to generic descriptions if no exercise library match

### Step 4 — Weekly dosage

- Default: 3× per week, 15–20 min per session
- Reduce to 2× if readiness/recovery flags are active
- Never prescribe daily if overtraining signal is active

### Step 5 — Safety notes

- Players under 12: no strength exercises with external load
- Players with active injury constraint: skip strength and agility; recommend mobility only
- Always include "stop if pain or discomfort" language

---

## Output shape (feeds Sprint 48)

```typescript
interface FitnessGapAssessment {
  player_id: string
  computed_at: string
  inputs_used: {
    assessment_date: string | null
    sessions_reviewed: number
    missed_sessions: number
    coach_notes_reviewed: number
    overtraining_signal_active: boolean
  }
  gap_categories: Array<{
    category: string
    gap_score: number        // 0–1
    evidence: string[]       // human-readable reasons
  }>
  top_gaps: string[]         // ordered by gap_score descending, max 3
  recommended_intensity: 'normal' | 'reduced' | 'recovery_only'
  safety_flags: string[]
}
```

---

## What is not yet implemented

- Actual aggregation queries (will be in Sprint 48 server action)
- Player dashboard display (Sprint 49+)
- Parent-safe language generation (Sprint 49)
- Medical/rehab prescriptions (out of scope — see safety notes)

---

## Implementation notes

- All logic is deterministic — no AI API calls
- Gap scores are advisory — all recommendations go through proposed_actions draft pipeline
- No recommendation is published to player/parent until director approves
- The system never prescribes medical treatment or rehab
