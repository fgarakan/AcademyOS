# DONNA Evidence & Reasoning Engine — Architecture
**Sprint:** Mega Sprint 1235–1264
**Date:** 2026-06-08

---

## What was built

A canonical evidence-backed recommendation model that lets DONNA defend any
recommendation with structured evidence, confidence disclosure, assumptions,
risk-if-ignored, and pre-computed answers to 9 follow-up question types.

This is reasoning infrastructure only — no UI changes, no data mutations,
no new DB tables. All existing COO and intelligence engines are unchanged.

---

## Design principles

- **Compose, never replace**: wraps `ReasoningBlock` (donnaReasoningEngine),
  `ConfidenceResult` (donnaConfidence), and existing COO/briefing outputs.
- **Deterministic**: same input → same output. No LLM calls.
- **Evidence-honest**: all claims either backed by live data or flagged `inferred`.
- **Pre-computed follow-ups**: every recommendation pre-builds answers to all 9
  follow-up question types at construction time, not at response time.

---

## Core types

### EvidenceCategory (8 categories)

| Category | What it covers |
|---|---|
| `assessment` | Assessment scores, reassessment changes |
| `observation` | Coach notes, behavioral flags |
| `attendance` | Session attendance records |
| `curriculum` | Curriculum gaps, level gate status |
| `approval` | Pending approvals, review queue |
| `session` | Session data, wrap-up completion |
| `placement` | Placement decisions, level assignments |
| `parent` | Parent communications, update cadence |

### FollowUpQuestionType (9 types)

| Type | Triggered by |
|---|---|
| `why` | "Why?", "Why does that matter?" |
| `how_confident` | "How confident are you?", "Confidence level?" |
| `what_evidence` | "How do you know?", "What evidence?", "Based on what?" |
| `what_if_ignore` | "What if I ignore this?", "What if I don't act?" |
| `alternatives` | "Alternatives?", "Other options?", "What else could I do?" |
| `risks` | "What are the risks?", "What could go wrong?" |
| `assumptions` | "What are you assuming?", "Assumptions?" |
| `missing` | "What's missing?", "Data gaps?", "What would help?" |
| `tell_me_more` | "Tell me more", "Elaborate", "More detail" |

### COOQuestionCategory (8 categories)

| Category | Maps to COO question |
|---|---|
| `attention_today` | What needs my attention today? |
| `player_health` | How are my players doing? |
| `coach_health` | How are my coaches doing? |
| `curriculum_gaps` | What curriculum gaps exist? |
| `parent_confidence` | How are parents feeling? |
| `priority_action` | What should I do first? |
| `academy_health` | How healthy is the academy? |
| `risk_assessment` | What's the risk if I ignore X? |

### EvidencedRecommendation (9 fields)

```
{
  recommendation:  string            // 1. The recommendation text
  evidence:        EvidenceItem[]    // 2. Typed evidence items
  confidence:      ConfidenceResult  // 3. Data confidence (from donnaConfidence)
  assumptions:     string[]          // 4. What DONNA is assuming
  alternatives:    string[]          // 5. Other options the director could take
  riskIfIgnored:   string            // 6. What happens if not acted on
  missingInfo:     string[]          // 7. Data gaps that would improve confidence
  nextAction:      string            // 8. Specific next step
  followUpAnswers: Record<FollowUpQuestionType, string>  // 9. Pre-computed answers
  category:        COOQuestionCategory
  generatedAt:     string
}
```

---

## Exported functions

### `buildEvidencedRecommendation(input)`

Main constructor. Accepts all 9 fields as input with per-category defaults
applied for any field not explicitly provided:

- `assumptions` — defaults to `CATEGORY_ASSUMPTIONS[category]`
- `alternatives` — defaults to `CATEGORY_ALTERNATIVES[category]`
- `riskIfIgnored` — defaults to `CATEGORY_RISK_DEFAULTS[category]`

Calls `buildFollowUpAnswers()` internally to pre-compute all 9 follow-up answers.

### `resolveEvidenceFollowUp(text, rec)`

Takes a user input string and an `EvidencedRecommendation`.
Returns the pre-computed follow-up answer string if the input matches one of
the 9 follow-up patterns, or `null` if not recognized.

Guards against false positives: inputs longer than 14 words are not processed.

### `detectEvidenceFollowUpType(text)`

Pattern-matching function that normalizes the input and tests it against all
9 follow-up pattern groups. Returns the matched `FollowUpQuestionType` or `null`.

### `adaptCOOInsightToEvidence(insight)`

Adapter: `COOInsight` → `EvidencedRecommendation`.
- `evidence: string[]` → `EvidenceItem[]` (category inferred from text content)
- `missingData?: string[]` → `missingInfo`
- `COOConfidence` → `ConfidenceResult`
- `recommendedAction` → `nextAction`

### `adaptBriefingItemToEvidence(item)`

Adapter: `BriefingItem` → `EvidencedRecommendation`.
- `evidence: string` → single `EvidenceItem`
- Urgency (`critical`/`high`/`medium`/`informational`) → evidence strength
- `BriefingCategory` → `COOQuestionCategory`
- `suggestedAction` → `nextAction`

---

## Composition diagram

```
DirectorQuestion / DONNA follow-up
          │
          ▼
resolveEvidenceFollowUp(text, rec)
          │
          ├── detectEvidenceFollowUpType(text)
          │         │
          │    9 follow-up patterns
          │
          └── rec.followUpAnswers[type]
                    │
              Pre-computed at build time
              ─────────────────────────
              buildEvidencedRecommendation({
                recommendation,
                evidence,         ← EvidenceItem[] (typed)
                confidence,       ← ConfidenceResult (donnaConfidence)
                assumptions,      ← per-category defaults or explicit
                alternatives,     ← per-category defaults or explicit
                riskIfIgnored,    ← per-category defaults or explicit
                missingInfo,      ← from COOInsight.missingData or explicit
                nextAction,
                reasoningBlock?,  ← ReasoningBlock from donnaReasoningEngine
                category,
              })
                    │
                    ├── adaptCOOInsightToEvidence(insight)
                    │     COOInsight → EvidencedRecommendation
                    │
                    └── adaptBriefingItemToEvidence(item)
                          BriefingItem → EvidencedRecommendation
```

---

## Follow-up answer construction

Each of the 9 follow-up answers is built from a different subset of the input fields:

| Follow-up | Built from |
|---|---|
| `why` | `reasoningBlock?.why + whyNow` or `riskIfIgnored` |
| `how_confident` | `confidence.label + detail + missingInfo[0..1]` |
| `what_evidence` | `evidence[].claim` split by `dataAvailable` |
| `what_if_ignore` | `riskIfIgnored + reasoningBlock?.whatItUnlocks` |
| `alternatives` | `alternatives[]` joined |
| `risks` | `riskIfIgnored + reasoningBlock?.riskReduced + weak evidence signals` |
| `assumptions` | `assumptions[]` joined |
| `missing` | `missingInfo[]` joined |
| `tell_me_more` | Full elaboration: recommendation + why + evidence + confidence + gaps + next action |

---

## Per-category defaults

Each `COOQuestionCategory` has default `assumptions`, `alternatives`, and
`riskIfIgnored` values. These are applied when `buildEvidencedRecommendation`
is called without explicit values for those fields (typical when adapting
from a `COOInsight` or `BriefingItem`).

Defaults are defined in `CATEGORY_ASSUMPTIONS`, `CATEGORY_ALTERNATIVES`,
and `CATEGORY_RISK_DEFAULTS` constants in the engine file.

---

## Integration pattern (next sprint)

The engine is infrastructure — it does not call any existing engine.
Integration into the DONNA routing pipeline is a separate sprint:

1. Call `adaptCOOInsightToEvidence(insight)` after `donnaCOOIntelligenceEngine`
   produces insights — store the `EvidencedRecommendation` in the DONNA session context.
2. In the 14-step brain pipeline at step 12 or 12.5, before returning a response:
   call `resolveEvidenceFollowUp(userInput, lastRec)`.
3. If a match is found, return the follow-up answer directly — no LLM needed.
4. If no match, continue to the normal COO router.

---

## Architecture constraints preserved

- No DB reads, no DB writes — pure TypeScript, deterministic.
- No LLM calls — all answers are constructed from input fields.
- No mutations — `EvidencedRecommendation` is a plain object.
- No new npm packages.
- No new DB migrations.
- `donnaReasoningEngine.ts` unchanged.
- `donnaCOOIntelligenceEngine.ts` unchanged.
- `dailyBriefingEngine.ts` unchanged.
- `donnaFollowUpResolver.ts` unchanged.

---

## Files changed

| File | Change |
|---|---|
| `src/lib/donna/reasoning/donnaEvidenceReasoningEngine.ts` | Created — canonical `EvidencedRecommendation` type, 9 follow-up types, 8 evidence categories, 8 COO question categories, `buildEvidencedRecommendation()`, `resolveEvidenceFollowUp()`, `detectEvidenceFollowUpType()`, `adaptCOOInsightToEvidence()`, `adaptBriefingItemToEvidence()` |
