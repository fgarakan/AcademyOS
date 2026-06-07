# DONNA COO Intelligence V1

**Sprint:** Mega Sprint 784–813 — DONNA COO Intelligence V1
**Date:** 2026-06-07
**Scope:** Build unified COO intelligence layer across 5 dimensions. Certify DONNA can answer 8+ COO-level questions from existing data with evidence, confidence, and recommended action.

---

## 1. Intelligence Coverage Matrix

| # | Question | Dimension | Data Source | Coverage | Confidence |
|---|---|---|---|---|---|
| 1 | Why is Orange Ball light? | Program Health | groupCapacities (player count + max_players) | ✅ Answered | High if max_players set; Medium if unset |
| 2 | Why is Green Ball growing? | Program Health | groupCapacities + advancementEligibleCount | ✅ Answered | Medium (enrollment trend inferred) |
| 3 | Which groups are over capacity? | Program Health | currentPlayerCount > maxPlayers | ✅ Answered | High |
| 4 | Which groups are under capacity? | Program Health | currentPlayerCount ≤ 50% of maxPlayers | ✅ Answered | High if max_players set; Medium otherwise |
| 5 | Enrollment problem or positive progression? | Program Health | advancementEligibleCount + playerProgressStalls | ✅ Answered | High (both signals available) |
| 6 | Who is ready to move up? | Player Intelligence | playerCurriculumStateSummaries.advancementEligible | ✅ Answered | High |
| 7 | Who is stalled? | Player Intelligence | playerProgressStalls (90+ days at level) | ✅ Answered | High |
| 8 | Who is accelerating? | Player Intelligence | recentAssessmentCount / assessmentCount (proxy) | ⚠ Partial | Medium (no velocity signal in schema) |
| 9 | Who needs attention? | Player Intelligence | attentionItems (DirectorDonnaContext) | ✅ Answered | High |
| 10 | Who has attendance risk? | Player Intelligence | playerAttentionRiskLoader (observations + absences) | ✅ Answered | Medium (fieldStatus = partial) |
| 11 | Which coaches need support? | Coach Intelligence | coachSupportLoader.supportSignal | ✅ Answered | High |
| 12 | Which coaches are following up reliably? | Coach Intelligence | coachSupportLoader.supportSignal = on_track | ✅ Answered | High |
| 13 | Which coaches have missing notes? | Coach Intelligence | coachSupportLoader.wrapUpGap | ✅ Answered | High |
| 14 | Which coaches are driving progression? | Coach Intelligence | observationsLast30Days (proxy only) | ⚠ Partial | Low (disclosed — no direct linkage) |
| 15 | Which groups have unclear coach ownership? | Coach Intelligence | sessionsLast30Days = 0 (proxy) | ⚠ Partial | Medium (inferred, not from assignment table) |
| 16 | Which parents need an update? | Parent Confidence | attentionItems as proxy (schema limited) | ⚠ Partial | Medium |
| 17 | Which families may be at risk? | Parent Confidence | highRiskPlayerCount → family proxy | ⚠ Partial | Medium |
| 18 | Where are communication gaps? | Parent Confidence | parentActionsProposed = 0 signal | ⚠ Partial | Medium (schema gap disclosed) |
| 19 | Which parents may lack clarity? | Parent Confidence | attentionItems.reason (proxy) | ⚠ Partial | Medium |
| 20 | Who needs a check-in? | Parent Confidence | highRisk attention items | ⚠ Partial | Medium |
| 21 | What should I focus on today? | Director Decision | pendingReviews + highRiskPlayerCount + missingWrapUps | ✅ Answered | High |
| 22 | What is the biggest academy risk? | Director Decision | academyRisks (DirectorDonnaContext) | ✅ Answered | High |
| 23 | What is the biggest opportunity? | Director Decision | advancementEligibleCount + curriculumGaps | ✅ Answered | High |
| 24 | What would you do next as COO? | Director Decision | Multi-signal synthesis (buildCOOSynthesisRecommendation) | ✅ Answered | High |
| 25 | What decisions are waiting? | Director Decision | pendingReviews + oldestPendingReviewAgeDays | ✅ Answered | High |

**Coverage summary:**
- ✅ Fully answered: 17 / 25 questions
- ⚠ Partial (disclosed): 8 / 25 questions
- ✗ Blocked / not answered: 0 / 25 questions

**Definition of done met:** 17+ questions answered > 8 minimum threshold ✅

---

## 2. Data Sources Used

| Source | Loader / Field | Questions Served |
|---|---|---|
| `DirectorDonnaContext` | attentionItems, academyRisks, recommendedActions, pendingReviews, missingWrapUps, advancementEligibleCount, playerCurriculumStateSummaries, playerProgressStalls, curriculumGaps, highRiskPlayerCount, oldestPendingReviewAgeDays | Q9, Q21, Q22, Q23, Q24, Q25, Q6, Q7, Q5 |
| `loadGroupHealth` | sessionsLast30Days, attendanceRate, wrapUpRate, healthSignal | Q1, Q2, Q3, Q4 |
| `group_memberships` (new query) | is_current = true → player count per group | Q1, Q2, Q3, Q4 |
| `groups.max_players` (via extendedContextLoaders.GroupSummary) | maxPlayers | Q3, Q4 |
| `loadPlayerAttentionRisk` | concern_observation, attendance_gap per player | Q10, Q16–Q20 |
| `loadCoachSupport` | wrapUpGap, observationsLast30Days, supportSignal | Q11, Q12, Q13, Q14, Q15 |
| `loadParentTrust` | totalActivePlayers, parentActionsProposed, parentActionsPending | Q16–Q20 |
| `playerCurriculumStateSummaries.advancementEligible` | Boolean per player | Q6 |
| `playerProgressStalls` (from DirectorDonnaContext) | daysAtCurrentLevel, stallSeverity | Q7 |
| `recentAssessmentCount` / `assessmentCount` | Ratio proxy for acceleration | Q8 |

---

## 3. Confidence Rules

| Signal | Confidence | Reasoning |
|---|---|---|
| `currentPlayerCount > maxPlayers` | High | Direct comparison, no inference |
| `advancementEligible = true` | High | Flag set by assessment evaluation |
| `stallSeverity = high` (180+ days) | High | Deterministic threshold |
| `supportSignal = needs_support` | High | Multi-factor coach evaluation |
| `pendingReviews > 0` | High | Direct DB count |
| `attendanceRate` | Medium | Session data partial; fieldStatus = partial |
| `playerAttentionRisk` | Medium | fieldStatus = partial for most academies |
| `observationsLast30Days` as progression proxy | Low | No coach→player advancement linkage |
| `sessionsLast30Days = 0` as ownership proxy | Medium | Absence signal, not assignment data |
| All parent questions | Low–Medium | `blocked_by_schema` disclosed first |

---

## 4. Program Health Intelligence Rules

| Rule | Signal | Outcome |
|---|---|---|
| `currentPlayerCount > maxPlayers` | Direct | Over capacity insight (High confidence) |
| `currentPlayerCount ≤ 50% × maxPlayers` | Threshold | Under capacity insight (High if max set) |
| `currentPlayerCount ≤ 2 AND sessionsLast30 > 0 AND maxPlayers = null` | Fallback | Low enrollment signal (Medium confidence) |
| `healthSignal = at_risk` | groupHealthLoader | Low engagement insight |
| `advancementEligibleCount / playerCount > 0.15` | Ratio | Progression-driven shift insight |

---

## 5. Player Risk / Readiness Rules

| Rule | Signal | Outcome |
|---|---|---|
| `advancementEligible = true` | playerCurriculumStateSummaries | Ready to advance (High) |
| `stallSeverity = high` (>180d) | playerProgressStalls | Critical stall (High) |
| `stallSeverity = medium` (90–180d) | playerProgressStalls | Moderate stall (Medium) |
| `recentAssessmentCount > 0` | assessmentCount ratio | Active cycle proxy (Medium) |
| `attentionItems.risk = high` | DirectorDonnaContext | Needs attention — high risk (High) |
| `riskLevel = high` (concerns > 2 OR absences > 3) | playerAttentionRiskLoader | Attendance risk (Medium) |

---

## 6. Coach Intelligence Rules

| Rule | Signal | Outcome |
|---|---|---|
| `supportSignal = needs_support` | coachSupportLoader | Needs director support (High) |
| `supportSignal = monitor` | coachSupportLoader | Monitor — potential support (Medium) |
| `supportSignal = on_track` | coachSupportLoader | Reliable follow-through (High) |
| `wrapUpGap > 0` | coachSupportLoader | Missing notes detected (High) |
| `observationsLast30Days > 0` | coachSupportLoader | Progression proxy (Low — disclosed) |
| `sessionsLast30Days = 0` | coachSupportLoader | Potential ownership gap (Medium) |

---

## 7. Parent Confidence Rules

| Rule | Signal | Outcome |
|---|---|---|
| `parentStatus = blocked_by_schema` | parentTrustLoader | Disclose schema block first (always) |
| `attentionItems.risk = high` | DirectorDonnaContext | Parent outreach proxy (Medium) |
| `parentActionsPending > 0` | parentTrustLoader | Pending parent actions (High) |
| `parentActionsProposed = 0 AND totalActivePlayers > 0` | parentTrustLoader | Communication gap (Medium) |
| `highRiskPlayerCount > 0` | DirectorDonnaContext | Families at risk proxy (Medium) |

**Parent schema block:** `proposed_actions` has no `applied_at`; no parent contact history table. This is disclosed in every parent insight. No hallucinated claims.

---

## 8. Director Decision Rules

| Rule | Signal | Outcome |
|---|---|---|
| `pendingReviews > 5` | DirectorDonnaContext | Top COO synthesis priority (weight 4) |
| `highRiskPlayerCount > 0` | DirectorDonnaContext | Second priority (weight 3) |
| `missingWrapUps > 3` | DirectorDonnaContext | Third priority (weight 2) |
| `advancementEligibleCount > 0` | DirectorDonnaContext | Fourth priority (weight 2) |
| `coachesNeedingSupport > 0` | coachSupportLoader | Fifth priority (weight 1) |
| `playerProgressStalls.length > 2` | DirectorDonnaContext | Sixth priority (weight 1) |
| `academyRisks[0].urgency = high` | DirectorDonnaContext | Biggest risk output |
| `advancementEligibleCount + curriculumGaps` | DirectorDonnaContext | Biggest opportunity output |

---

## 9. Remaining Data Gaps

| Gap | Impact | Resolution Path |
|---|---|---|
| `parentTrustLoader` blocked by schema (no `applied_at`, no parent contact history) | Parent confidence questions are partial; no per-family history | Future migration: add `applied_at` to proposed_actions + parent contact log table |
| Per-player improvement velocity not tracked | "Accelerating" questions use assessment recency proxy (Medium confidence) | Future: add velocity field to `player_curriculum_states` |
| Coach-to-player advancement linkage not available | "Coaching driving progression" is Low confidence (observation proxy) | Future: link approved advancements to coach sessions |
| `groups` table has no explicit coach ownership column | Coach ownership gap inferred from session absence | Future: add primary_coach_id to groups table |
| `max_players` is null for some groups | Under-capacity analysis is partial for those groups | Director action: set max_players in group settings |

---

## 10. DONNA COO Readiness Score

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  DONNA COO INTELLIGENCE — READINESS SCORE V1                                 │
│                                                                              │
│  Questions answerable from existing data: 17 / 25 (68%)                     │
│  Questions partially answerable (disclosed): 8 / 25 (32%)                   │
│  Questions blocked/unanswerable: 0 / 25 (0%)                                │
│                                                                              │
│  Data availability score (readinessScore):                                   │
│    Group health data available:          +15 pts                             │
│    Player curriculum states available:  +20 pts                             │
│    Coach support data available:        +20 pts                             │
│    Player attention risk available:     +15 pts                             │
│    Parent coverage: blocked_by_schema:   +0 pts                             │
│    Review queue count available:        +10 pts                             │
│    Attention items available:           +10 pts                             │
│    ─────────────────────────────────────────                                │
│    TOTAL (max 100):                      90 pts                              │
│                                                                              │
│  Data availability: 90/100                                                   │
│  Question coverage: 68% fully answered, 32% partial                         │
│  Hallucination risk: None — all gaps disclosed                               │
│                                                                              │
│  COO Readiness: READY FOR PILOT (8+ questions met; 17 fully covered)        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Architecture Invariants Preserved

| Rule | Status |
|---|---|
| No DB mutations in intelligence engine or server action | ✅ Read-only only |
| RLS-scoped: all queries include `academy_id` | ✅ Verified |
| Director and head_coach roles only | ✅ Role gate enforced |
| No LLM for core calculations | ✅ Pure deterministic TypeScript |
| Parent confidence not invented | ✅ Schema block disclosed first; no hallucinated contact history |
| Low-confidence signals disclosed, not suppressed | ✅ missingData[] field populated for all partial insights |
| No fake data | ✅ All numbers from live loaders |

---

## 12. Files Created / Modified This Sprint

| File | Change |
|---|---|
| `src/lib/donna/coo/donnaCOOIntelligenceEngine.ts` | Created — pure TS engine; 5 dimension builders; COOInsight + COOIntelligenceReport types; readiness score; no DB |
| `src/app/director/_actions/donnaCOOIntelligenceAction.ts` | Created — server action; loads all loaders in parallel; assembles GroupCapacity[]; calls intelligence engine; returns formatted answer by category |
| `src/lib/donna/brain/processDonnaMessage.ts` | Modified — added `fetch_coo_intelligence` to DonnaMessageAction; added `isCOOIntelligencePhrase()`; added Step 7.5 detection before LLM fallback |
| `src/lib/donna/brain/donnaBrainDebugLog.ts` | Modified — added `check_coo_intelligence` to BrainRoutingStep union |
| `src/components/assistant/DonnaAssistantButton.tsx` | Modified — imported `runDonnaCOOIntelligenceAction`; added `handleFetchCOOIntelligence()`; added `case 'fetch_coo_intelligence'` to brain switch |

---

## 13. Internal Pilot Recommendation

**Status: READY — with disclosed limitations**

DONNA can answer 17 of 25 COO questions with evidence, confidence, and recommended action from existing data. The remaining 8 questions are answered partially with gaps clearly disclosed — no hallucinated claims, no suppressed data gaps.

**Pilot go-ahead criteria met:**
- ✅ 8+ COO questions fully covered (17 achieved)
- ✅ All 5 COO dimensions represented
- ✅ Every answer includes evidence[]
- ✅ Every answer includes confidence level
- ✅ Every answer includes recommendedAction
- ✅ Missing data disclosed via missingData[]
- ✅ No fake intelligence
- ✅ TypeScript clean
- ✅ Read-only, RLS-scoped, role-gated

**Known limitations for pilot:**
- Parent intelligence is partial (schema gap). Communicate this to pilot directors.
- Coach progression signals are low confidence. Do not present observation count as a performance metric.
- "Which groups are under capacity?" requires max_players to be set in group settings.
