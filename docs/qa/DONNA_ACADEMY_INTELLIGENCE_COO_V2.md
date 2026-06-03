# DONNA Academy Intelligence COO V2 — QA Certification

Sprint 1741–1760

---

## What changed

DONNA can now answer strategic intelligence questions about the academy using data already loaded in `DirectorDonnaContext`. All intelligence responses follow the structured format:

**Observation → Confidence → Evidence → Limitations → Recommendation**

No DB calls. No hallucinated metrics. No fake trends.

---

## Response format standard (enforced across all modules)

Every intelligence answer must include:

| Field | What it contains |
|---|---|
| **Observation** | What the data shows — facts only |
| **Confidence** | High / Medium / Low |
| **Evidence** | Specific data points used |
| **Limitations** | What data was unavailable |
| **Recommendation** | One clear action for the director |

---

## Intelligence modules

| Module | File | Answers |
|---|---|---|
| Progression | `progressionIntelligence.ts` | Who is ready? Who is stalled? Which levels moving fastest? |
| Curriculum Bottleneck | `curriculumBottleneckIntelligence.ts` | Which levels are bottlenecks? Which curriculum needs improvement? |
| Coach Impact | `coachImpactIntelligence.ts` | Wrap-up coverage, assessment cadence, academy-level signals |
| Retention | `retentionIntelligence.ts` | Retention risk proxies — stalls, attendance, level clustering |
| What Changed | `whatChangedIntelligence.ts` | Recent decisions, assessment trends, curriculum activity |
| Academy Health Brief | `academyHealthBrief.ts` | Strategic synthesis — main opportunity + first action |
| Full Report | `academyIntelligenceEngine.ts` | All modules combined, sorted by severity |

---

## Command routing

All commands detected in `DonnaVoiceReadyShell.tsx` via `detectIntelligenceQuestion()`:

| Command | Intent | Module |
|---|---|---|
| "What is the academy learning?" | `academy_learning` | Full intelligence report |
| "Which players are ready to move up?" | `who_is_ready` | Progression |
| "Who is stalled?" | `who_is_stalled` | Progression |
| "Player progression overview" | `progression` | Progression |
| "Which levels are bottlenecks?" | `curriculum_bottleneck` | Curriculum Bottleneck |
| "Which coaches are progressing players fastest?" | `coach_impact` | Coach Impact |
| "Why are players leaving?" | `retention` | Retention |
| "What changed this month?" | `what_changed` | What Changed |
| "Academy health brief" | `health_brief` | Health Brief |
| "What should we improve next?" | `improve_next` | Health Brief (top recommendation) |

---

## Data sources used

| Signal | Source field |
|---|---|
| Ready to advance | `playerCurriculumStateSummaries[].advancementEligible` |
| Stalled players | `playerProgressStalls[]` |
| Assessment gaps | `assessmentCoverageGaps[]` |
| Level bottleneck proxy | `playerProgressStalls` + `curriculumTemplateCoverageGaps` + `curriculumGaps` |
| Template coverage | `curriculumTemplateCoverageGaps[]` |
| Coach wrap-up rate | `missingWrapUps` / `todaySessions` |
| Assessment cadence | `recentAssessmentCount` / `assessmentCount` |
| Retention proxies | `playerProgressStalls` + `attendanceExceptions` |
| Recent activity | `recentDecisions[]` |
| Health brief | All of the above |

---

## Known data limitations (always disclosed)

| Limitation | Impact |
|---|---|
| `playerCurriculumStateSummaries` capped at 30 | Intelligence uses only loaded players — full academy may differ |
| No individual coach names in ctx | Coach impact is academy-level only, no per-coach breakdown |
| No departure records in ctx | Retention signals are proxy-only (stalls + attendance) |
| No historical snapshots | "What changed" uses recent decisions, not month-over-month comparison |
| Assessment summaries capped at 30 | Assessment health covers loaded summaries only |

---

## Safety invariants

- No DB calls — all analysis runs on already-loaded context
- No mutations — read-only intelligence generation
- No hallucinated metrics — every number traces to a specific ctx field
- No blame language — coach signals framed as support/optimization
- Confidence always stated — never implies certainty without data
- Limitations always disclosed — never hides data gaps
