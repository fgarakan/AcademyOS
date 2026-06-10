# DONNA Academy Learning Engine — Source Audit
**Sprint:** Mega Sprint 1625–1654
**Date:** 2026-06-10
**Purpose:** Audit of all memory sources DONNA can learn from, what patterns are detectable in V1, and known gaps.

---

## What DONNA can learn from (available sources)

All learning is sourced from `AcademyMemory[]` — records reconstructed from the `proposed_actions` table by the Sprint 1595 memory engine.

| Source Type | What it records | Learning signal |
|---|---|---|
| `promotion_decision` | Player level advancement | Promotion clusters, promotion rate trends |
| `placement_decision` | Player onboarding activation | Placement velocity |
| `assessment_result` | Completed assessments | Assessment gap detection |
| `coach_assignment` | Coach ↔ player links | Coach assignment churn |
| `coach_wrap_up` | Session wrap-up reviews | Decision velocity |
| `parent_update` | Parent communication approvals | Parent update gap, cadence trends |
| `curriculum_change` | Curriculum overrides | Curriculum change bursts, rate trends |
| `director_override` | Proposals modified by director | Override frequency, override rate trends |
| `donna_recommendation` | DONNA-generated proposals | Used as baseline for override calculations |
| `proposed_action` (generic) | All other approved/rejected actions | Rejection repeat detection |

---

## What is detectable in V1

### Patterns (frequency-based, windowed)
| Pattern | Minimum required | Confidence ceiling |
|---|---|---|
| Promotion cluster | 3 promotions in 21 days | Medium (≥5) |
| Rejection repeat | 4 rejected records | Low |
| Override frequency | 3 overrides | Medium (≥5) |
| Assessment gap | <10% assessments in ≥5 records | Low |
| Curriculum change burst | 3 changes in 21 days | Low |
| Coach assignment churn | 3 assignment changes | Low |
| Parent update gap | <15% parent updates in ≥10 records | Low |
| Placement velocity | 3 placements in 21 days | Low |

### Trends (early-half vs. recent-half comparison)
| Trend | Minimum required | Confidence ceiling |
|---|---|---|
| Decision velocity | 8 total, 3 per half | Low |
| Override rate | 8 total + ≥2 overrides | Low |
| Parent update cadence | 8 total + ≥2 parent updates | Low |
| Curriculum change rate | 8 total + ≥2 curriculum changes | Low |
| Promotion rate | 8 total + ≥2 promotions | Low |

### Lessons extracted from patterns + trends
- Each detected pattern with `confidence ≥ low` produces one lesson
- Each detected trend with `direction ≠ stable` and `confidence ≥ low` produces one lesson
- Lessons have: headline, insight (1–2 sentences), monitor suggestion, confidence, limitations

### Recommendations built from lessons
- Each lesson with `confidence ≥ low` produces one recommendation
- Recommendations have: action, rationale, destination route, priority (high/medium/low)
- Sorted high → medium → low

---

## Known limitations in V1

1. **Frequency-based only** — V1 counts occurrences. It does not correlate events, infer causation, or measure outcomes.
2. **No temporal granularity** — All trend detection uses a simple early/late window split, not rolling windows or seasonality.
3. **No player-level learning** — V1 detects academy-wide patterns only. Player-specific trends are not computed.
4. **No cross-entity correlation** — No detection of which coaches, players, or curriculum levels are most involved in patterns.
5. **Minimum volume required** — Academies with <5 memory records will receive insufficient confidence across all signals.
6. **Memory window dependency** — All learning is bounded by the memory retrieval window (defaults set in Sprint 1595). Long-term patterns that span beyond the window are not detectable.
7. **No historical baseline** — V1 cannot compare current state to a "normal baseline" for this academy. All observations are absolute, not relative to the academy's own history.
8. **No rejection root-cause analysis** — Rejection repeat detection uses headline text matching. Categorisation accuracy depends on action label quality.

---

## What future versions should add

- Player-level learning signals (most-improved, stalled, needs-assessment)
- Coach-level learning (most active, under-communicating)
- Cross-entity pattern detection (coach + promotion, assessment + curriculum gap)
- Seasonal/cyclic trend detection
- Outcome tracking for approved decisions
- Academy-specific baseline comparison
- Long-window learning (90-day, annual)

---

## Brain integration point

**Step 10.11** in `processDonnaMessage.ts` — fires after Step 10.10 (memory history) and before Step 11 (goal resolution).

Detection: `isMemoryLearningPhrase(lower)` in `donnaLearningAnswerBuilder.ts`

Action returned: `fetch_learning` — caller loads `AcademyMemory[]` then invokes `buildMemoryLearningAnswer()`.
