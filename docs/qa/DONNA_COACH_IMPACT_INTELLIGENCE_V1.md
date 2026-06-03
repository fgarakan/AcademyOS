# DONNA Coach Impact Intelligence V1 — QA Certification

Sprint 1744

---

## Critical data limitation

Individual coach names are NOT in `DirectorDonnaContext`. Only academy-level signals are available:

- `missingWrapUps` / `todaySessions` — wrap-up coverage rate
- `recentAssessmentCount` / `assessmentCount` — assessment cadence
- `coachCount` — number of active coaches

**Per-coach breakdown is not possible with current context data.**

---

## Framing standard

All coach signals are framed as:
- **Support** — "coaches may need support"
- **Academy optimization** — "academy wrap-up coverage"
- **Development consistency** — "assessment cadence"

Never:
- "Coach X is underperforming"
- "Coach Y is failing to submit"
- Any blame or punitive language

---

## Scenarios

### 1. "Which coaches are progressing players fastest?"

**Honest answer:** Per-coach attribution requires data not currently loaded. Academy-level signals provided instead.

**Output includes:**
- Wrap-up coverage rate for today
- Assessment cadence (recent vs total)
- Advancement-eligible players without assessment evidence
- Explicit limitation: "Individual coach names are not in the current context"

### 2. Wrap-up coverage — all submitted

Severity: `positive`. "All X sessions wrapped up today."

### 3. Wrap-up coverage — missing

Severity: `warning` (1-2 missing) or `critical` (3+).
Message: "X of Y sessions missing wrap-ups — follow up in the Sessions list."
No coach name attribution.

### 4. Assessment cadence — no recent

Severity: `warning`. "No assessments in the last 30 days."
Recommendation: "Ask coaches to submit assessments for advancement-eligible players."

---

## Safety invariants

- No per-coach blame
- No punitive framing
- Confidence: High when todaySessions > 0 and assessmentContextAvailable, Medium otherwise
- Limitation explicitly stated: "Individual coach names are not in the current context"
