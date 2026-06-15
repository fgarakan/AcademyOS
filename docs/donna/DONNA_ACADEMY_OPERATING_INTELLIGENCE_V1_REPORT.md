# DONNA Academy Operating Intelligence V1 — Sprint Report

**Sprint:** Mega Sprint 2801–2830  
**Date:** 2026-06-15  
**TypeScript:** CLEAN (`npx tsc --noEmit` — zero errors)  
**Certification:** 104/104 PASS  
**Status:** AWAITING COMMIT APPROVAL

---

## Mission Accomplished

Academy DNA is now operational. Two academies with the same underlying data but different DNA receive different DONNA guidance.

**Evidence from certification:**

| Same signal: 3 stalled players | 12U Foundation → | Performance 12+ → |
|---|---|---|
| Top recommendation | Parent updates pending — retention priority | 5 overdue for assessment — advancement pipeline at risk |
| Language | Engagement check, re-engagement lens | Assessment scheduling, gate criteria |
| Priority | medium | critical |
| DNA influence | "Emphasizes parent communication milestones" | "Leads morning brief with assessment overdue alerts" |

---

## Files Created (7 new files, 0 modified)

### `src/lib/academyDNA/operatingModelContext.ts`

**Part 1 — Operating Model Context**

`OperatingModelContext` — unified context bundle for DNA-aware DONNA reasoning.

Fields:
- `dnaModel` — the canonical identity template
- `stylePreset` — curriculum philosophy
- `identityProfile` — dynamic, evidence-weighted philosophy profile (built from `blueprintToDna()` when not supplied)
- `operatingModel` — deterministic standards from DNA + preset
- `curriculumPriorities` — what to teach, in what order, with what language
- `coachStandards` — what DONNA monitors coaches for
- `parentStandards` — tone, language style, gap thresholds
- `assessmentStandards` — overdue thresholds, domain weights, escalation rules
- `donnaAssumptions` — morning brief lead, KPI priorities, COO persona

`buildOperatingModelContext(input)` — deterministic builder. Same inputs → same output. No AI required.

Parent language style is now DNA-model-specific (not inferred from InferredModel):
| Model | Language Style |
|---|---|
| 12U Foundation | `educational` |
| 12+ Performance | `accountability` |
| College Placement | `recruiting` |
| Club Growth | `retention` |

---

### `src/lib/academyDNA/recommendationTrace.ts`

**Part 3 — Recommendation Trace**

`RecommendationTrace` — explainability layer for every DONNA recommendation.

Fields:
- `dataSignals[]` — `{ signal, source, strength }` — what triggered this
- `academyDNAInfluence` — which DNA tendency drove the priority level
- `operatingModelInfluence` — which standard is relevant
- `confidence` — computed from signal strength distribution
- `rationale` — one-paragraph human-readable explanation
- `suggestedAction` — the specific next action
- `riskIfIgnored` — consequence of inaction
- `riskLevel` — `critical | high | medium | low`

`buildRecommendationTrace(input)` — confidence auto-computed: high = 2+ strong signals, medium = 1+ non-weak, low = weak only.

---

### `src/lib/academyDNA/dnaRecommendationEngine.ts`

**Part 2 — DNA-Aware Recommendation Engine**

`buildDnaAwareRecommendations(ctx, signals)` — deterministic rule engine. Produces `DnaAwareRecommendation[]` sorted by priority.

Four model-specific rule sets:

**12U Foundation rules (retention lens):**
- Coach recaps missing → parent trust gap (high/medium)
- Parent updates pending → retention priority (high)
- Players stalled → engagement check first, not assessment pressure (medium)
- Attendance < 80% → retention emergency (high)
- Reassessment due → milestone celebration framing (low)

**Performance 12+ rules (accountability lens):**
- Assessment overdue → advancement pipeline at risk (critical/high)
- Players stalled → gate review required (high/medium)
- Advancement ready → decision required within 48h (high)
- Coach recaps missing → accountability gap (high/medium)

**College Placement rules (recruiting lens):**
- Players stalled → recruiting timeline at risk (critical — not high)
- Advancement ready → tournament entry review (high)
- Coach recaps missing → recruiting record gap (high)

**Club Growth rules (retention/growth lens):**
- Enrollment declining → community health intervention (critical)
- Parent updates pending → retention touchpoints (high)
- Players stalled → re-engagement first, not gate compliance (medium)
- Attendance < 75% → enrollment health signal (high)

Plus shared rules (unassigned coaches, curriculum gaps) with DNA-specific framing.

`answerCOOQuestion(type, ctx, signals, recs)` — answers all 8 COO director questions deterministically:
1. What needs attention today?
2. Why?
3. What should we do next?
4. How does this align with our academy DNA?
5. What is our biggest risk?
6. What is our biggest opportunity?
7. Are coaches aligned with our standards?
8. Are players progressing according to our model?

---

### `src/lib/academyDNA/dnaTodayInfluence.ts`

**Part 4 — Today Page Integration**

Does NOT replace `directorAttentionEngine.ts`. Wraps its outputs with DNA-aware adjustments.

Three operations:

`applyDnaTodayInfluence(items, ctx)` — reorders existing `DirectorAttentionItem[]` by DNA domain priority weights. Each DNA model has a domain weight map (e.g., 12U Foundation weights `coach` domain +10, `promotion` domain +2). Items are re-sorted by `basePriorityScore + domainWeight`.

`buildDnaAttentionAdditions(ctx, signals)` — adds DNA-specific attention items the generic engine doesn't produce:
- Foundation: attendance < 85% threshold alert; parent update backlog
- Performance: assessment gap alert (uses DNA overdue threshold, not generic)
- College: stagnation escalated to `critical` immediately
- Club Growth: enrollment decline escalated to `critical`

`buildDnaOpportunities(ctx, signals)` — surfaces positive signals per DNA model:
- Foundation: attendance strong → parent celebration update opportunity
- Performance: clean pipeline → schedule competition entries
- Club Growth: enrollment growing → identify and replicate what's working
- All: advancement-ready players with DNA-specific framing

`buildDnaTodayContext(existingItems, ctx, signals)` — combined builder returning `DnaTodayContext`.

---

### `src/lib/academyDNA/dnaCurriculumBias.ts`

**Part 5 — Curriculum Intelligence**

`buildDnaCurriculumBias(ctx)` — returns `DnaCurriculumBias`:
- `primaryCategory` + weight
- `secondaryCategories[]`
- `deEmphasisedCategories[]` (Foundation/Club Growth: competition; Performance/College: fun)
- `curriculumFocusStatement` — human-readable DNA-derived instruction
- `lessonSelectionGuidance`
- `progressionFraming` — "long-term development" vs "competitive readiness"
- `templatePreference` — model-specific template selection guidance

`evaluateCurriculumAlignment(levels, ctx)` — checks curriculum structure against DNA standards. Minimum coverage thresholds differ by model (Foundation: 2 items/level; Performance: 4 items/level; College: 3; Club: 2).

`buildCurriculumPriorityRec(ctx, alignment)` — single highest-priority curriculum action given DNA context.

---

### `src/lib/academyDNA/dnaCoachAlignment.ts`

**Part 6 — Coach Intelligence**

`evaluateCoachDnaAlignment(behavior, ctx)` — evaluates one coach against DNA standards.

Checks (all DNA-model-specific):
1. Recap compliance rate vs. model threshold (every_session: 90%, weekly: 80%, as_needed: 70%)
2. Observation depth vs. model expectation (detailed required for performance/college)
3. Model-specific check:
   - Foundation: engagement/enjoyment language required
   - Performance: advancement flagging for stalled players
   - College: detailed match performance observations required
   - Club Growth: community/engagement observations required
4. Stale recap check vs. model-specific overdue threshold

Returns `CoachDnaAlignmentResult` with `status: 'aligned' | 'partial' | 'misaligned'`, `alignmentScore` (0–100), `gaps[]`, `strengths[]`, `headline`, `recommendation`.

`buildCoachAlignmentSummary(results, ctx)` — academy-wide summary.

`buildCoachAlignmentRecommendation(summary, ctx)` — single most important coach action for director.

---

### `src/lib/academyDNA/dnaParentCommsStyle.ts`

**Part 7 — Parent Communication Intelligence**

`buildDnaParentCommsGuidance(ctx)` — returns `DnaParentCommsGuidance`:

| Model | Opening | Progress Language | Challenge Language |
|---|---|---|---|
| 12U Foundation | Warm/celebratory | Skills mastered, no comparisons | "Next exciting challenge" — no deficit language |
| Performance 12+ | Data-first | Assessment scores, specific criteria | Name the gap + plan to close it |
| College Placement | Results + recruiting | UTR trend, match record, coach notes | Gap in recruiting terms + timeline |
| Club Growth | Community welcome | Milestones, community participation | Light, motivational, never discouraging |

`buildParentCommOpportunityGuidance(type, ctx, playerName)` — guidance for 5 opportunity types: `milestone`, `assessment_complete`, `advancement`, `engagement_positive`, `outreach`.

---

### `src/lib/academyDNA/dnaOperatingIntelligenceCertification.ts`

**Parts 8 & 9 — Certification Suite**

Run with: `npx tsx src/lib/academyDNA/dnaOperatingIntelligenceCertification.ts`

**Scenario A (12U Foundation + Game-Based):** Verifies education-heavy recommendations, parent communication as top priority, long-term development language, warm parent comms, engagement-focused coach standards, milestone-framed assessments.

**Scenario B (12+ Performance + Competition First):** Verifies assessment overdue as top priority, accountability language, detailed coach observations required, advancement pipeline urgency.

**Scenario C (Same data, different DNA):** Verifies:
- Foundation top rec ≠ Performance top rec (parent-updates vs assessment-overdue)
- Club Growth top rec ≠ Performance top rec
- COO "attention" answer differs between models
- College stagnation = `critical`; Foundation stagnation = `medium`
- All 4 parent language styles correct (educational / accountability / recruiting / retention)
- Full trace explainability for every recommendation

**COO Question Certification (8 questions):** All 8 director questions answerable from DNA context + signals:
- Attention: "5 players overdue for assessment — advancement pipeline at risk"
- Why: "In a performance academy, assessment compliance is non-negotiable..."
- Next: "Schedule assessments immediately..."
- DNA alignment: "12+ Performance Academy: DNA tendency: Leads morning brief with assessment overdue alerts..."
- Biggest risk: Named + consequence
- Biggest opportunity: "4 players are ready to advance — acting now builds momentum"
- Coach alignment: Named recap count + standard + specific gap
- Player progression: Named stall count + model-appropriate framing

---

## Architecture — Duplicate System Audit

| Risk | Decision |
|---|---|
| New recommendation engine duplicates proposed_actions | Resolved — `DnaAwareRecommendation` is operating intelligence, not DB-backed approvals |
| New priority system duplicates directorAttentionEngine | Resolved — `dnaTodayInfluence.ts` wraps (not replaces) existing outputs |
| New philosophy system | Resolved — `identityProfile` uses existing `buildAcademyIdentityProfile()` |
| New curriculum system | Resolved — `dnaCurriculumBias.ts` overlays on existing curriculum types |
| New coach system | Resolved — `dnaCoachAlignment.ts` supplements existing `coachIntelligenceEngine.ts` |
| New parent comm system | Resolved — `dnaParentCommsStyle.ts` adds DNA framing to existing `donnaParentCommunicationIntelligence.ts` |

**Duplicate systems created: 0**

---

## File Manifest

### Created
- `src/lib/academyDNA/operatingModelContext.ts`
- `src/lib/academyDNA/recommendationTrace.ts`
- `src/lib/academyDNA/dnaRecommendationEngine.ts`
- `src/lib/academyDNA/dnaTodayInfluence.ts`
- `src/lib/academyDNA/dnaCurriculumBias.ts`
- `src/lib/academyDNA/dnaCoachAlignment.ts`
- `src/lib/academyDNA/dnaParentCommsStyle.ts`
- `src/lib/academyDNA/dnaOperatingIntelligenceCertification.ts`
- `docs/donna/DONNA_ACADEMY_OPERATING_INTELLIGENCE_V1_REPORT.md` ← this file

### Modified
- None

### Not touched
- `src/lib/donna/today/directorAttentionEngine.ts`
- `src/lib/donna/today/directorRiskEngine.ts`
- `src/lib/donna/coach/coachIntelligenceEngine.ts`
- `src/lib/donna/donnaParentCommunicationIntelligence.ts`
- `src/lib/donna/llmOrchestration/llmApiClient.ts`
- `src/lib/donna/llmOrchestration/contextPacket.ts`
- `supabase/migrations/`
- `database.types.ts`

---

## Remaining Gaps (Future Sprints)

| Gap | Priority | Sprint |
|---|---|---|
| Wire `buildOperatingModelContext()` into `buildContextPacket()` for live DONNA use | HIGH | 2831–2860 |
| Director DNA setup onboarding UI (6-step flow with Academy DNA selection) | HIGH | 2831–2860 |
| `academies.settings` DB storage for `academy_dna_model_id` + `academy_style_preset` | HIGH | 2831–2860 |
| Wire `buildDnaTodayContext()` into today page server action | MEDIUM | 2831–2860 |
| Wire `buildDnaAwareRecommendations()` into director dashboard | MEDIUM | 2831–2860 |
| Brian Dabul pilot: DNA selection + operating model review | MEDIUM | 2026-06-22 |
| Context firewall: enforce max 6,000 char hard limit in `callDonnaLlm()` | HIGH | Next safety sprint |

---

## Recommended Next Sprint

**Sprint 2831–2860: DONNA Academy DNA Wiring + Director Onboarding UI V1**

1. Build Academy DNA onboarding flow (6 steps: DNA model selection → Style preset → Operating model review → Governance settings → DONNA assumptions preview → Confirm)
2. Save `academy_dna_model_id` + `academy_style_preset` to `academies.settings`
3. Wire `loadDnaFromSettings()` + `buildOperatingModelContext()` into `buildContextPacket()`
4. Wire `buildDnaAwareRecommendations()` into Today page director brief
5. Brian Dabul pilot validation

---

*End of DONNA Academy Operating Intelligence V1 Sprint Report*  
*Sprint 2801–2830 — TypeScript: CLEAN — Certification: 104/104 PASS — Awaiting commit approval*
