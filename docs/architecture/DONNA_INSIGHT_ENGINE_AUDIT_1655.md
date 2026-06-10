# DONNA Insight & Perspective Shift Engine — Source Audit
**Sprint:** Mega Sprint 1655–1684
**Date:** 2026-06-10
**Purpose:** Audit of all DONNA intelligence layers; what is known, what is learned, what cannot yet be inferred; insight categories possible in V1.

---

## What DONNA knows (Memory Engine — Sprint 1595)

Source: `AcademyMemory[]` reconstructed from `proposed_actions` table.

| Knowledge area | Source | What it tells DONNA |
|---|---|---|
| Promotion decisions | `promotion_decision` records | When promotions happened, for whom |
| Placement decisions | `placement_decision` records | When players were activated |
| Assessment results | `assessment_result` records | When assessments were completed |
| Coach assignments | `coach_assignment` records | Who coaches whom |
| Coach wrap-ups | `coach_wrap_up` records | Session-level activity |
| Parent communications | `parent_update` records | Parent update cadence |
| Curriculum changes | `curriculum_change` records | What curriculum changed and when |
| Director overrides | `director_override` records | When DONNA proposals were modified |
| DONNA recommendations | `donna_recommendation` records | What DONNA proposed |

**What DONNA does NOT know from memory:**
- Whether any decision produced a good or bad outcome
- The director's reasoning for overrides (unless notes were added)
- Whether a pattern is deliberate vs. accidental
- Player-level longitudinal outcomes
- Coach perception or satisfaction

---

## What DONNA learns (Learning Engine — Sprint 1625)

Source: `MemoryLearningReport` from `buildMemoryLearningReport(memories)`.

| Learning capability | What it produces |
|---|---|
| Pattern detection (8 types) | Recurring frequency clusters in the decision record |
| Trend detection (5 types) | Early vs. recent window direction changes |
| Lesson extraction | Director-facing interpretations of patterns/trends |
| Recommendations | Concrete suggested actions with priority |
| Confidence scoring | Low/medium/insufficient thresholds enforced |
| Limitations | Explicit disclosures of what cannot be inferred |

**What learning cannot do:**
- Confirm that a pattern is a problem (only that it recurs)
- Connect a pattern to an outcome
- Detect player-level or coach-level patterns
- Detect patterns older than the loaded memory window

---

## What DONNA can now infer (Insight Layer — Sprint 1655)

The insight layer asks: **"What are we missing?"**

| Insight category | Detection source | Possible in V1? |
|---|---|---|
| Blind spots | Patterns from learning report | Yes |
| Contradictions | Cross-pattern tension detection | Yes (limited) |
| Alternative explanations | Pattern → multi-hypothesis generation | Yes |
| Perspective shifts | Lesson → reframing | Yes |
| Hidden opportunities | Positive signals in memory | Yes |
| Investigation needed | Insufficient data areas | Yes |
| Recurring problems | Multi-pattern overlap | Yes |

---

## Insight categories — possible in V1 vs. requires future data

### Possible in V1

| Category | Based on |
|---|---|
| Blind spot: missing assessment | `assessment_gap` pattern from learning |
| Blind spot: parent communication gap | `parent_update_gap` pattern |
| Blind spot: ignored recommendation | `override_frequency` pattern |
| Blind spot: coach overload | `coach_assignment_churn` pattern |
| Blind spot: promotion blocker | promotions >> assessments count |
| Blind spot: placement issue | placements >> coach assignments count |
| Blind spot: unresolved bottleneck | high-priority learning recommendations present |
| Contradiction: rapid promotion + assessment gap | cross-pattern |
| Contradiction: repeat rejection + same pattern recurring | cross-pattern |
| Contradiction: curriculum change + no parent updates | cross-pattern |
| Alternative explanation: promotion slowdown | 3 explanations from pattern |
| Alternative explanation: override frequency | 3 explanations from pattern |
| Alternative explanation: curriculum change burst | 3 explanations |
| Perspective shift: advancement period | flip from learning lesson |
| Perspective shift: assessment volume | flip from learning lesson |
| Hidden opportunity: advancement momentum | positive promotion_cluster |
| Hidden opportunity: enrollment growth | positive placement_velocity |
| Hidden opportunity: DONNA alignment | low override rate |
| Hidden opportunity: assessment discipline | high assessment ratio |

### Requires future data (V2+)

| Category | What's needed |
|---|---|
| Player-level blind spots | Per-player decision history (requires entity-scoped memory) |
| Coach-level blind spots | Per-coach assessment + wrap-up longitudinal view |
| Outcome validation | Whether approved decisions produced positive results (requires outcome tracking table) |
| Investigation confirmation | Whether DONNA's insight was investigated and concluded (V2 memory bridge) |
| Baseline comparison | Whether current patterns are unusual vs. this academy's history |
| Seasonal patterns | Rolling window beyond current memory load |

---

## Evidence strength vs. confidence — design decision

Two distinct disclosures are required for every insight:

| Dimension | Question it answers | Example — high + weak |
|---|---|---|
| **Confidence** | "How certain are we this insight is real?" | Clear pattern but only 2 data points |
| **Evidence strength** | "How much data supports this insight?" | Large dataset but mixed signals |

These are orthogonal. A high-confidence insight can have weak evidence (consistent but sparse). A low-confidence insight can have strong evidence (lots of noisy, conflicting data).

---

## Intelligence chain after Sprint 1655

```
Entity Intelligence
→ Relationship Intelligence
→ Promotion Intelligence
→ Coach Intelligence
→ Today Operating System
→ Decision Execution
→ Memory (Sprint 1595) — "What happened?"
→ Learning (Sprint 1625) — "What have we learned?"
→ Insight (Sprint 1655) — "What are we missing?"
→ Investigation → Memory (Sprint 1655 bridge) — closes the loop
```

---

## Insight memory feedback loop (Sprint 1655 addition)

The `donnaInsightMemoryBridge.ts` defines the data contract for converting insight outcomes into future memory:

```
Insight detected
→ Director investigates (manual action)
→ Outcome recorded: confirmed / refuted / inconclusive / partially_confirmed
→ InsightMemoryCandidate created
→ Submitted to proposed_actions pipeline
→ Stored as future AcademyMemory
→ Available for next learning cycle
```

V1: data structures defined. DB persistence wired in V2.
