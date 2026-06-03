# Curriculum Gap → Improvement Engine V1 — QA Checklist

**Sprint:** Mega Sprint 1551–1640
**Date:** 2026-06-03

---

## Engine: `analyzeCurriculumImprovements`

### Gap Detection

| # | Check | Pass/Fail |
|---|---|---|
| 1 | Engine returns `CurriculumImprovementAnalysis` with `suggestions[]` | |
| 2 | Suggestions are sorted by `confidenceScore` descending | |
| 3 | Domains with `totalSignals < 2` are filtered out (minimum threshold) | |
| 4 | Each suggestion has: recommendation, confidence, confidenceScore, evidenceCount, affectedPlayers | |
| 5 | Each suggestion has: supportingSignals, reasoning, supportingEvidence | |
| 6 | Each suggestion has: draftStarter, impactLines, wontHappenLines | |
| 7 | `analysisNote` explains suggestion count and top confidence level | |

### Confidence Scoring

| # | Check | Pass/Fail |
|---|---|---|
| 8 | `totalSignals >= 20` → confidence = `HIGH`, score ≥ 70 | |
| 9 | `totalSignals >= 8` → confidence = `MEDIUM`, score 50–75 | |
| 10 | `totalSignals < 8` → confidence = `LOW`, score < 50 | |
| 11 | Domain with both blocking evidence AND priority signals scores higher than domain with only weak records | |

### Signal Aggregation

| # | Check | Pass/Fail |
|---|---|---|
| 12 | Weak evidence records (`evidence_strength = 'weak'`) increment `weakCount` | |
| 13 | Readiness blocking evidence increments `blockingCount` | |
| 14 | Development priorities increment `priorityCount` | |
| 15 | Assessment records (`source_type = 'assessment_score'`) increment `assessmentCount` | |
| 16 | Stale evidence records (past `expires_at`) are excluded from aggregation | |

### Recommendation Format

| # | Check | Pass/Fail |
|---|---|---|
| 17 | `buildRecommendationText('technical', 'Orange Ball 2')` returns non-empty string | |
| 18 | `buildDraftStarter('technical', 'Orange Ball 2')` includes "[describe the specific skill or gate here]" placeholder | |
| 19 | `buildSupportingSignals` returns up to 5 signal lines | |
| 20 | `buildReasoning` returns multi-sentence reasoning string | |

---

## Recommendation Confidence Engine

| # | Check | Pass/Fail |
|---|---|---|
| 21 | `formatSuggestionForDonna(suggestion)` renders all required fields | |
| 22 | Output includes: Recommendation, Confidence, Confidence Score %, Evidence Count, Affected Players | |
| 23 | Output includes: Supporting Signals list, Reasoning, Supporting Evidence list | |
| 24 | DONNA response to "Why are you recommending this?" shows formatted suggestion | |
| 25 | DONNA response to "How confident are you?" shows confidence score | |
| 26 | DONNA response to "Show me the evidence" shows supporting signals | |
| 27 | DONNA response to "Show impact" shows willHappen + wontHappen | |
| 28 | DONNA response to "Draft the change" shows draftStarter text | |

---

## Curriculum Builder Operator

| # | Check | Pass/Fail |
|---|---|---|
| 29 | `buildCurriculumImproveResponse(text, analysis, summary)` returns correct type for each intent | |
| 30 | Default response type is `context_summary` when no specific intent matched | |
| 31 | "Why are you recommending this?" → type `suggestion_detail` with formatted suggestion | |
| 32 | "Draft the change" → type `draft_ready` with draftStarter text | |
| 33 | "Show impact" → type `suggestion_detail` with impact + wontHappen | |
| 34 | `buildContextFirstSummary` includes currentState, gapSummary, evidenceLine, focusQuestion | |
| 35 | `focusQuestion` ends with a question mark and invites director input | |

---

## Safety Rules

| # | Check | Pass/Fail |
|---|---|---|
| 36 | Engine generates suggestions only — no DB writes, no mutations | |
| 37 | All suggestions include wontHappenLines with "no automatic" statements | |
| 38 | `requires_director_approval: true` set on every draft payload | |
| 39 | No player names, coach names, or raw IDs appear in suggestions | |
| 40 | Evidence summaries are truncated to 80 chars to prevent data leakage |  |

---

## Director Demo Certification

| Scenario | Expected | Pass/Fail |
|---|---|---|
| "Who needs attention?" | Navigate to /director/attention + highlight items list | |
| "Show me." | Highlight attention-items-list | |
| "Take me there." | Navigate to /director/attention with correct filter | |
| "Open Jamie." | Navigate to /director/players/{id} + highlight profile header | |
| "Why is Jamie not ready?" | Navigate to profile + highlight player-readiness-card | |
| "What should Jamie work on?" | Navigate to profile + highlight player-priorities-card | |
| "Help me improve Orange Ball 2." | Navigate to /director/curriculum?improve=orange_ball_2 + show panel | |
| "Why are you recommending this?" | Show evidence breakdown with confidence + signal count | |
| "Show me the evidence." | Show supporting signals and evidence records | |
| "Draft the change." | Create proposed_action draft in review queue | |
| "Show impact." | Show willHappen + wontHappen breakdown | |
| "Prepare approval." | Navigate to /director/review + highlight review queue | |
