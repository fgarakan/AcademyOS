# DONNA Operating Partner Architecture Audit — Sprint 1775A

**Date:** 2026-06-11
**Sprint:** 1775A
**Status:** COMPLETE — 97/97 assertions pass

---

## Purpose

Sprint 1775A establishes the architecture boundary between the DONNA Philosophy Memory layer (Sprints 1746–1775) and the DONNA Operating Partner (Sprint 1776–1805).

The Operating Partner is DONNA's strategic intelligence layer: it fuses philosophy signals with live operational data to produce a synthesised, prioritised brief for the director. Sprint 1775A defines every contract, constraint, and boundary the Operating Partner must respect. Sprint 1776–1805 implements the actual engine.

---

## Files Created

| File | Lines | Role |
|---|---|---|
| `operatingPartnerPhilosophyContract.ts` | 166 | Philosophy boundary surface — only types Sprint 1776–1805 may consume |
| `operatingPartnerOperationalContract.ts` | 124 | Operational domain state — all 6 domains with dataAvailable + missingData |
| `operatingPartnerInputContract.ts` | 48 | Combined input payload — philosophy + operations + completeness score |
| `operatingPartnerOutputContract.ts` | 143 | Output types — brief, priorities, alerts, wins, situation assessment |
| `buildOperatingPartnerInputs.ts` | 320 | Input builders — filters, collapses, and normalises inputs |
| `academySituationAssessment.ts` | 413 | Deterministic situation classifier — 10 situation types, no DB calls |
| `operatingPartnerContractCertification.ts` | ~340 | Certification suite — 97 assertions, 12 groups |

**Total:** 1,554 lines of pure TypeScript. No DB calls. No LLM calls. No mutations. Deterministic.

---

## Intelligence Hierarchy

The Operating Partner inherits the philosophy layer's intelligence hierarchy and must respect it in every output:

```
Reality (player evidence)
  > Evidence (behavioral patterns from decisions)
  > Memory (decision history — accepted decisions only in V1)
  > Philosophy (DNA from onboarding)
  > Inference (DONNA's best guess with available data)
```

Lower layers never override higher layers. If player evidence contradicts stated philosophy, the evidence wins and the contradiction is surfaced.

---

## Architecture Boundaries

### What Sprint 1775A delivers

- Complete type contracts for all inputs and outputs
- Input builders that filter, normalise, and collapse raw philosophy signals
- Deterministic situation classifier
- Certification suite verifying all invariants

### What Sprint 1775A does NOT implement

These belong to Sprint 1776–1805:

| Capability | Reason deferred |
|---|---|
| `buildDirectorOperatingBrief()` | Core OP engine — needs all input contracts to be stable first |
| `buildDailyBrief()` | Depends on brief engine |
| `buildAttentionScore()` | Domain-level urgency scoring — depends on brief priorities |
| `rankRecommendations()` / `rankOperatingPriorities()` | Ranking requires all signal types to be loaded |
| DB queries for operational inputs | Needs Supabase session; deferred to OP implementation |

The certification verifies that none of these functions exist in Sprint 1775A code.

---

## Contract Invariants

### Philosophy boundary rules

Sprint 1776–1805 must **not** import directly from `src/lib/donna/philosophy/`. All philosophy types are available exclusively through `operatingPartnerPhilosophyContract.ts`, assembled by `buildOperatingPartnerPhilosophyInputs()`.

Explicitly forbidden in Sprint 1776–1805 code:

| Forbidden import | Reason |
|---|---|
| `PhilosophyMemoryEntry[]` | Raw signals — use `PreferenceInput` instead |
| `DecisionPatternRecord[]` | Raw records — use `DecisionPatternInput` instead |
| `EvolutionAnswer[]` | 10 evolution questions collapsed to 3-field synthesis |
| `PreferenceSignal` (full shape) | Filtered/normalised form only |
| `AcademyEvolutionTimeline.phases[]` | Recent 90-day slice only |
| `'curriculum_expansion'` preference key | Noise — excluded from all OP inputs |
| `direction === 'unknown'` | Stripped — `null` passed instead |
| `confidence 'low' \| 'insufficient'` | Collapsed to `'provisional'` |

### Confidence collapse

At the Operating Partner boundary, the 4-level philosophy confidence is collapsed to 2 levels:

| Philosophy confidence | Operating Partner confidence |
|---|---|
| `'high'` | `'reliable'` |
| `'medium'` | `'reliable'` |
| `'low'` | `'provisional'` |
| `'insufficient'` | `'provisional'` (signal excluded from preferences) |

`'insufficient'` preference signals are excluded entirely (not even passed as provisional). Only the identity layer includes insufficient-confidence signals collapsed to provisional.

### Operational domain contract

Every domain in `OperatingPartnerOperationalInputs` must:

- Expose `dataAvailable: boolean` — true only when real data was loaded
- Expose `missingData: string[]` — specific fields that could not be loaded
- Default to `dataAvailable: false` and `missingData: ['Data not yet loaded']` until populated

The Operating Partner must hedge all outputs when `dataAvailable` is false for any domain. It must never infer the state of a domain that is marked unavailable.

Critical domains (player and curriculum) returning `dataAvailable: false` must surface `missingCriticalInputs` in the combined input and suppress recommendations that depend on those domains.

### Output contract limits

These limits exist because more than 3 items of any type creates cognitive overload. The director acts on fewer items, not more.

| Output | Hard limit |
|---|---|
| `DirectorOperatingBrief.priorities` | Maximum 3 |
| `DirectorOperatingBrief.alerts` | Maximum 3 |
| `DirectorOperatingBrief.wins` | Maximum 3 |
| `DirectorOperatingBrief.primaryAction` | Exactly 1 |

Sprint 1776–1805 must enforce these limits when building briefs. The certification suite provides `validateBriefLimits()` as the reference validator.

---

## Situation Assessment

`classifyAcademySituation()` produces exactly one `AcademySituationAssessment` from philosophy + operational inputs. Classification is deterministic — the same input always produces the same output.

### Non-negotiable: DONNA must not assume every player problem is a curriculum problem

The classifier distinguishes:

| Situation type | Trigger conditions |
|---|---|
| `unclear_cause_requires_review` | Incomplete onboarding OR critical data missing OR ≥3 domains unavailable |
| `communication_gap` | Stale approval queue (≥7 days) OR parent communication gap |
| `coach_execution_gap` | Missing wrap-ups (≥2) AND high stall rate (≥20%) |
| `player_progression_bottleneck` | Player-evidenced curriculum bottleneck AND stall |
| `curriculum_gap` | Empty levels OR (weak levels AND missing gates) |
| `assessment_debt` | Advancement backlog AND readiness blockers |
| `parent_retention_risk` | Retention risk signal (parent + stall combined) |
| `philosophy_drift` | Drift severity HIGH |
| `business_capacity_issue` | Capacity overload OR enrollment decline |
| `opportunity_to_double_down` | Advancement momentum AND strong preferences — OR no urgent signals |

Rules are ordered by specificity. The first match wins. Each rule fires only when its specific conditions are met — not as a catch-all.

---

## Completeness Score

`OperatingPartnerInputs.inputCompletenessScore` (0–100) reflects how much real data was loaded:

| Score | Interpretation |
|---|---|
| 80–100 | Full brief — all domains available, confidence reliable |
| 50–79 | Partial brief — some domains missing; flag gaps |
| 20–49 | Minimal brief — major domains absent; brief is speculative |
| 0–19 | Cannot brief — insufficient data |

Philosophy layer contributes up to 40 points. Each of 6 operational domains contributes 10 points.

---

## Certification Results

Run: `npx tsx src/lib/donna/operations/operatingPartnerContractCertification.ts`

```
RESULT: 97 passed, 0 failed

All assertions pass — Sprint 1775A contract is sound.
```

| Group | Assertions | Result |
|---|---|---|
| 1. Philosophy inputs exclude raw internals | 14 | PASS |
| 2. curriculum_expansion excluded | 3 | PASS |
| 3. Unknown direction stripped to null | 2 | PASS |
| 4. Confidence collapsed appropriately | 8 | PASS |
| 5. Operational inputs expose dataAvailable + missingData | 32 | PASS |
| 6. Output contract limits enforced | 8 | PASS |
| 7. Situation assessment distinguishes required types | 5 | PASS |
| 8. No operating implementation | 5 | PASS |
| 9. No daily brief implementation | 5 | PASS |
| 10. No attention engine implementation | 6 | PASS |
| 11. No recommendation ranking implementation | 8 | PASS |
| 12. TypeScript clean | 1 | PASS |
| **Total** | **97** | **PASS** |

TypeScript check: `npx tsc --noEmit` — no errors.

---

## What Sprint 1776–1805 Receives

Sprint 1776–1805 receives a single typed payload: `OperatingPartnerInputs`.

```typescript
interface OperatingPartnerInputs {
  academyId:              string
  generatedAt:            string
  philosophy:             OperatingPartnerPhilosophyInputs  // cleaned, collapsed, filtered
  operations:             OperatingPartnerOperationalInputs // 6 domains with availability flags
  dataWindowDays:         number
  inputCompletenessScore: number    // 0–100
  missingCriticalInputs:  string[]  // empty = safe to produce full brief
}
```

Sprint 1776–1805 must:
1. Accept `OperatingPartnerInputs` as its primary input — never build parallel input structures
2. Call `classifyAcademySituation()` from `academySituationAssessment.ts` for situation classification
3. Enforce the output contract limits (max 3 priorities / alerts / wins; exactly 1 primaryAction)
4. Hedge all outputs when `missingCriticalInputs` is non-empty
5. Never import directly from `src/lib/donna/philosophy/`
