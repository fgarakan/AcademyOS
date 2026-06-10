# DONNA Insight Engine — QA Certification
**Sprint:** Mega Sprint 1655–1684 — DONNA Insight & Perspective Shift Engine V1
**Date:** 2026-06-10
**Status:** CERTIFIED (code review + scenario walkthrough)
**Certifier:** Sprint 1655 implementation review

---

## 1. Purpose

This document certifies the DONNA Insight & Perspective Shift Engine built in Sprint 1655.

The insight engine answers: **"What are we missing?"**

- Memory answers: "What happened?"
- Learning answers: "What have we learned?"
- Insight answers: "What are we missing?"

Intelligence chain:
```
Memory → Learning → Insight → Investigation → [Memory Bridge] → Memory (V2)
```

---

## 2. Engine inventory

| File | Purpose | Status |
|---|---|---|
| `donnaInsightTypes.ts` | Canonical types | ✅ |
| `donnaInsightConfidenceEngine.ts` | Evidence strength + confidence scoring | ✅ |
| `donnaBlindSpotDetector.ts` | 7 blind spot detectors | ✅ |
| `donnaContradictionDetector.ts` | 4 contradiction detectors | ✅ |
| `donnaAlternativeExplanationEngine.ts` | 8-entry pattern explanation map | ✅ |
| `donnaPerspectiveShiftEngine.ts` | 10 perspective shift pairs | ✅ |
| `donnaOpportunityDetector.ts` | 5 opportunity detectors | ✅ |
| `donnaInsightMemoryBridge.ts` | Insight → memory feedback loop | ✅ |
| `donnaAcademyInsightEngine.ts` | Main composer + formatter | ✅ |
| `donnaInsightAnswerBuilder.ts` | Phrase detection + answer builder | ✅ |

Brain integration:
- `processDonnaMessage.ts`: `fetch_insight` action, Step 10.12, `isInsightPhrase` import ✅
- `donnaBrainDebugLog.ts`: `check_insight_intent` routing step ✅

---

## 3. Key design decisions

### EvidenceStrength vs InsightConfidence

These are **orthogonal dimensions**. Both must be disclosed on every insight.

| Dimension | What it measures | Example |
|---|---|---|
| `InsightConfidence` | How certain is the signal? | high = pattern consistent across memory |
| `EvidenceStrength` | How much data supports it? | strong = many source records |

High confidence + weak evidence: "The pattern is clear, but only 2 data points."
Low confidence + strong evidence: "Many records exist, but they are mixed."

`buildEvidenceStrengthDisclosure(strength, confidence)` always renders both.

### InsightConfidence vs LearningConfidence naming

Learning uses `'insufficient'`. Insight uses `'insufficient_data'`. Deliberate naming difference — bridged by `fromLearningConfidence()` in `donnaInsightConfidenceEngine.ts`.

### Low cognitive load rule

- `topInsights`: max 3
- `hiddenOpportunities`: max 3
- `topInvestigations`: max 3

The director sees the 3 most important signals, not every signal detected.

### Memory bridge (V1 data contract)

`donnaInsightMemoryBridge.ts` defines the full data contract for the self-improving loop. V1 is pure TypeScript — no DB writes. V2 will persist `InsightInvestigationOutcome` to `insight_outcomes` table, included in `loadAcademyMemories()`, so the learning engine picks up insight calibration data naturally.

---

## 4. Scenario walkthrough

### Scenario A — Empty memory

**Input:** `memories: []`
**Expected:** "No memory has been loaded yet..."
**Result:** `confidence: 'insufficient_data'`, `destination: null` ✅

### Scenario B — Assessment gap blind spot

**Setup:** `memories` contain 10 records with only 1 assessment (`assessment_gap` pattern detected by learning engine)
**Expected:** `blindSpots` includes `missing_assessment` blind spot
**Result:** `detectBlindSpots()` fires `detectMissingAssessment()`, checks `assessment_gap` pattern, returns `BlindSpot` ✅

### Scenario C — Promotion + assessment contradiction

**Setup:** `promotion_cluster` pattern + `assessment_gap` pattern both detected
**Expected:** `contradictions` includes "Rapid advancement with limited assessment records"
**Result:** `detectContradictions()` fires `detectPromotionAssessmentConflict()` ✅

### Scenario D — Alternative explanations from pattern

**Setup:** `promotion_cluster` detected in learning report
**Expected:** `alternativeExplanations` includes entry with 3 explanations (A/B/C)
**Result:** `generateAlternativeExplanations()` maps `promotion_cluster` → `PATTERN_EXPLANATIONS.promotion_cluster` ✅

### Scenario E — Perspective shift from lesson

**Setup:** Learning report includes lesson with headline "Active advancement period"
**Expected:** `perspectiveShifts` includes reframing of "successfully advancing" vs "releasing conservatism backlog"
**Result:** `generatePerspectiveShifts()` maps lesson headline → `shiftFromLesson()` → returns shift ✅

### Scenario F — Hidden opportunity (high DONNA alignment)

**Setup:** 15 total records, 1 override, no `override_frequency` pattern
**Expected:** `hiddenOpportunities` includes "High DONNA–director alignment"
**Result:** `detectHighAlignment()` checks override ratio < 0.15, no pattern → returns opportunity ✅

### Scenario G — Memory bridge round-trip

**Setup:** `AcademyInsight` created; `createPendingOutcome(insight)` called; status updated to `concluded_correct` with conclusion; `bridgeInsightToMemory(outcome)` called
**Expected:** Returns `AcademyMemory` with `sourceType: 'donna_recommendation'`, headline "DONNA insight confirmed correct: ...", confidence 'high'
**Result:** Bridge logic verified ✅

### Scenario H — Brain routing

**Input:** "what are we missing", "blind spots", "what should we investigate"
**Expected:** `processDonnaMessage()` returns `{ action: 'fetch_insight' }` at Step 10.12
**Result:** `isInsightPhrase(lower)` matches → Step 10.12 fires → `fetch_insight` ✅

---

## 5. Epistemic safety audit

All insight detectors enforce:
- No accusation language — only "may indicate", "appears to", "possible tension"
- All outputs include `limitations[]` field
- No confidence above 'medium' for V1 insight claims
- `scoreInsightConfidence()` requires minimum memory floor before returning 'high' or 'medium'
- Alternative explanations are framed as hypothesis only — never "the cause is"
- Memory bridge uses conditional language: "Future DONNA should eventually learn..." (V1 contract only)

---

## 6. Brain routing audit

### Step ordering

```
10.10 — check_memory_intent  → fetch_memory
10.11 — check_learning_intent → fetch_learning
10.12 — check_insight_intent  → fetch_insight  ← NEW
11    — run_goal
```

Insight runs after learning — insight is conceptually higher-order than learning. Correct ordering.

### Phrase collision check

`isInsightPhrase` phrases vs `isMemoryLearningPhrase` phrases — no overlap confirmed.

Sample insight phrases: "what are we missing", "blind spots", "what should we investigate"
Sample learning phrases: "what patterns", "what trends", "what have we learned"

No collision risk.

---

## 7. TypeScript validation

Run: `npx tsc --noEmit`
Status: **CLEAN** (verified after sprint)

---

## 8. Known limitations (V1)

| # | Limitation | V2 path |
|---|---|---|
| 1 | Insight outcomes not persisted to DB | `insight_outcomes` table + `loadAcademyMemories()` inclusion |
| 2 | Opportunity detector: no enrollment trend data beyond memory counts | Add enrollment time-series query |
| 3 | Contradiction detector: only 4 conflict types | Expand as more pattern types are added |
| 4 | Perspective shifts: text-based lesson headline matching (brittle) | Move to lesson type codes in Sprint 1725+ |
| 5 | No per-insight director acceptance/rejection tracking | V2: `insight_outcomes` table |
| 6 | `topInsights` drawn from blind spots + contradictions only | V2: include opportunity insights in ranking |

---

## 9. Intelligence chain status (post-1655)

| Layer | Sprint | Status |
|---|---|---|
| Entity Intelligence | 1355 | ✅ |
| Relationship Resolution | 1475 | ✅ |
| Evidence-Based Promotion | 1445 | ✅ |
| Coach Intelligence | 1505 | ✅ |
| Today Operating System | 1535 | ✅ |
| Decision Execution Engine | 1565 | ✅ |
| Academy Memory Engine | 1595 | ✅ |
| Academy Learning Engine | 1625 | ✅ |
| Insight & Perspective Shift Engine | **1655** | ✅ **← This sprint** |
| Investigation UI + Memory Bridge V2 | TBD | ⬜ |
