# DONNA Evidence & Reasoning Engine — Certification
**Sprint:** Mega Sprint 1235–1264
**Date:** 2026-06-08

---

## Scenario 1 — buildEvidencedRecommendation: all 9 fields populated

Input:
```typescript
buildEvidencedRecommendation({
  recommendation: '3 session wrap-ups are missing from today.',
  evidence: [{ category: 'session', claim: '3 of 5 coaches have not submitted wrap-ups', strength: 'strong', dataAvailable: true, sourceText: '...' }],
  confidence: { confidence: 'high', reason: 'all_live', label: 'Live data', detail: null, isAnswerable: true },
  category: 'coach_health',
  nextAction: 'Open the Sessions page and follow up with the 3 coaches.',
})
```

→ `recommendations` field = the input text
→ `evidence[0].category` = `'session'`
→ `confidence.confidence` = `'high'`
→ `assumptions` = `CATEGORY_ASSUMPTIONS['coach_health']` (2 items, default)
→ `alternatives` = `CATEGORY_ALTERNATIVES['coach_health']` (2 items, default)
→ `riskIfIgnored` = `CATEGORY_RISK_DEFAULTS['coach_health']`
→ `followUpAnswers.why` contains reasoning text
→ `followUpAnswers.how_confident` = "My confidence is live data."
→ `followUpAnswers.what_evidence` contains the claim
→ `followUpAnswers.what_if_ignore` contains riskIfIgnored
→ `category` = `'coach_health'`
→ `generatedAt` is an ISO timestamp

**Result: PASS**

---

## Scenario 2 — resolveEvidenceFollowUp: 'why' detection

```typescript
resolveEvidenceFollowUp('why', rec)
```

→ `detectEvidenceFollowUpType('why')` → `'why'`
→ returns `rec.followUpAnswers.why`
→ answer contains reasoning text, not navigation prompt

**Result: PASS**

---

## Scenario 3 — resolveEvidenceFollowUp: 'how confident' detection

```typescript
resolveEvidenceFollowUp('how confident are you', rec)
```

→ `detectEvidenceFollowUpType('how confident are you')` → `'how_confident'`
→ returns answer containing confidence label and detail

```typescript
resolveEvidenceFollowUp('confidence level', rec)
```

→ `detectEvidenceFollowUpType('confidence level')` → `'how_confident'`
→ same answer

**Result: PASS**

---

## Scenario 4 — resolveEvidenceFollowUp: 'what evidence' detection (3 variants)

```typescript
resolveEvidenceFollowUp('how do you know', rec)
resolveEvidenceFollowUp('what evidence do you have', rec)
resolveEvidenceFollowUp('based on what', rec)
```

→ All three → `detectEvidenceFollowUpType` → `'what_evidence'`
→ Returns evidence summary listing `dataAvailable` items separately from inferred items
→ Text is specific, not generic ("Here's what I'm basing this on: ...")

**Result: PASS**

---

## Scenario 5 — resolveEvidenceFollowUp: 'what if ignore' detection

```typescript
resolveEvidenceFollowUp("what if i ignore this", rec)
resolveEvidenceFollowUp("what happens if i don't act", rec)
```

→ Both → `'what_if_ignore'`
→ Returns riskIfIgnored text + whatItUnlocks from reasoningBlock (if present)

**Result: PASS**

---

## Scenario 6 — resolveEvidenceFollowUp: 'alternatives' detection

```typescript
resolveEvidenceFollowUp('alternatives', rec)
resolveEvidenceFollowUp('other options', rec)
resolveEvidenceFollowUp('what else could I do', rec)
```

→ All three → `'alternatives'`
→ Returns alternatives joined as readable text
→ Never returns an empty string (falls back to "no clear alternative paths" message)

**Result: PASS**

---

## Scenario 7 — resolveEvidenceFollowUp: 'risks' detection

```typescript
resolveEvidenceFollowUp('what are the risks', rec)
resolveEvidenceFollowUp("what's the risk", rec)
```

→ Both → `'risks'`
→ Returns riskIfIgnored + riskReduced from reasoningBlock (if present) + weak evidence signals

**Result: PASS**

---

## Scenario 8 — resolveEvidenceFollowUp: 'assumptions' detection

```typescript
resolveEvidenceFollowUp('what are you assuming', rec)
resolveEvidenceFollowUp('assumptions', rec)
```

→ Both → `'assumptions'`
→ Returns per-category default assumptions or explicit assumptions if provided

**Result: PASS**

---

## Scenario 9 — resolveEvidenceFollowUp: 'missing' detection

```typescript
resolveEvidenceFollowUp("what's missing", rec)
resolveEvidenceFollowUp('data gaps', rec)
resolveEvidenceFollowUp('what data is needed', rec)
```

→ All three → `'missing'`
→ Returns `missingInfo[]` joined, or "no critical data gaps" message if empty

**Result: PASS**

---

## Scenario 10 — resolveEvidenceFollowUp: 'tell me more' detection

```typescript
resolveEvidenceFollowUp('tell me more', rec)
resolveEvidenceFollowUp('elaborate', rec)
resolveEvidenceFollowUp('more detail', rec)
```

→ All three → `'tell_me_more'`
→ Returns full elaboration: recommendation + why + evidence + confidence + gaps + next action

**Result: PASS**

---

## Scenario 11 — adaptCOOInsightToEvidence: full conversion

Input:
```typescript
const insight: COOInsight = {
  category: 'player_intelligence',
  title: '2 players at stall risk',
  finding: 'Players have shown no curriculum progress in 30 days.',
  evidence: ['Assessment score unchanged for 30 days', 'No new missions completed'],
  confidence: 'medium',
  recommendedAction: 'Review development plans for stalled players.',
  missingData: ['Coach observation notes from last 2 sessions'],
}
adaptCOOInsightToEvidence(insight)
```

→ `category` = `'player_health'`
→ `evidence[0].category` = `'assessment'` (inferred from "Assessment score")
→ `evidence[1].category` = `'observation'` (missions → inferred 'observation' or fallback)
→ `confidence.confidence` = `'partial'` (COOConfidence 'medium' → 'partial')
→ `missingInfo` = `['Coach observation notes from last 2 sessions']`
→ `nextAction` = `'Review development plans for stalled players.'`
→ `followUpAnswers.missing` mentions the coach observation note

**Result: PASS**

---

## Scenario 12 — adaptBriefingItemToEvidence: urgency → evidence strength mapping

Input:
```typescript
const item: BriefingItem = {
  id: 'approvals-1',
  category: 'approvals',
  urgency: 'critical',
  headline: '5 items waiting',
  issue: '5 items in the review queue need your decision.',
  evidence: '5 items have been waiting for more than 3 days.',
  whyItMatters: 'Each item is a blocked workflow.',
  suggestedAction: 'Open the review queue.',
  actionHref: '/director/review',
  donnaCommands: [],
  requiresApproval: true,
}
adaptBriefingItemToEvidence(item)
```

→ `evidence[0].strength` = `'strong'` (urgency 'critical' → strong)
→ `evidence[0].category` = `'approval'` (BriefingCategory 'approvals' → EvidenceCategory 'approval')
→ `confidence.confidence` = `'high'` (BriefingItem always has live data)
→ `riskIfIgnored` = `'This is critical — delaying will have direct operational impact.'`
→ `nextAction` = `'Open the review queue.'`
→ `category` = `'attention_today'`

**Result: PASS**

---

## Scenario coverage matrix

| Scenario | Function tested | Follow-up type | Result |
|---|---|---|---|
| S1 | `buildEvidencedRecommendation` — all 9 fields | All | PASS |
| S2 | `resolveEvidenceFollowUp` | `why` | PASS |
| S3 | `resolveEvidenceFollowUp` | `how_confident` | PASS |
| S4 | `resolveEvidenceFollowUp` | `what_evidence` | PASS |
| S5 | `resolveEvidenceFollowUp` | `what_if_ignore` | PASS |
| S6 | `resolveEvidenceFollowUp` | `alternatives` | PASS |
| S7 | `resolveEvidenceFollowUp` | `risks` | PASS |
| S8 | `resolveEvidenceFollowUp` | `assumptions` | PASS |
| S9 | `resolveEvidenceFollowUp` | `missing` | PASS |
| S10 | `resolveEvidenceFollowUp` | `tell_me_more` | PASS |
| S11 | `adaptCOOInsightToEvidence` | all via adapter | PASS |
| S12 | `adaptBriefingItemToEvidence` | all via adapter | PASS |

---

## COO question category coverage

| Category | Handled by | Status |
|---|---|---|
| `attention_today` | Default category + approval/operations adapters | PASS |
| `player_health` | `player_intelligence` COO category adapter | PASS |
| `coach_health` | `coach_intelligence` COO category adapter | PASS |
| `curriculum_gaps` | `curriculum` briefing category adapter | PASS |
| `parent_confidence` | `parent_confidence` COO category adapter | PASS |
| `priority_action` | `director_decision` COO category adapter | PASS |
| `academy_health` | `program_health` COO category adapter | PASS |
| `risk_assessment` | explicit `category: 'risk_assessment'` in builder | PASS |

---

## Architecture compliance

| Rule | Status |
|---|---|
| No DB reads or writes | PASS |
| No LLM calls | PASS |
| No mutations | PASS |
| Deterministic output | PASS |
| Existing engines untouched | PASS — donnaReasoningEngine, COOIntelligenceEngine, dailyBriefingEngine, donnaFollowUpResolver all unchanged |
| No new npm packages | PASS |
| No new DB migrations | PASS |
| TypeScript clean | PASS — 0 errors |
