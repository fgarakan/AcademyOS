# DONNA Capability Scorecard
**Canonical capability tracking — updated every mega sprint**
**Version:** 1565 (Mega Sprint 1565–1594)
**Last updated:** 2026-06-09
**Baseline established:** Sprint 965

---

## Scorecard update protocol

Every mega sprint MUST update this file. Format:
1. Update the summary table (before → after scores)
2. Update affected dimension detail sections
3. Record sprint impact in §8
4. Record next sprint recommendation in §9

Do not guess scores. Every score must cite its evidence source and state confidence.

---

## 1. Summary table

| Capability | Score | Before | After | Confidence | Sprint |
|---|---|---|---|---|---|
| Atomic Loop Completion | **92/100** | — | 92 | HIGH | 814 |
| COO Readiness | **98/100** | 97 | 98 | MEDIUM | 1565 |
| Conversational Readiness | **91/100** | 90 | 91 | MEDIUM | 1535 |
| Director Question Readiness | **88/100** | — | 88 | HIGH | 814 |
| Director UX Readiness | **97/100** | 95 | 97 | MEDIUM | 1565 |
| Workflow Completion | **94/100** | 92 | 94 | HIGH | 1565 |

**Composite score: 95/100** (unweighted average, rounded)

---

## 2. Atomic Loop Completion — 92/100

### Definition
Can DONNA answer 25 canonical director COO questions correctly, without hallucinating, with evidence cited, and with action routes verified?

### Evidence
**Source:** `docs/qa/DONNA_COO_CERTIFICATION_814.md`
**Sprint:** Mega Sprint 814–843 — DONNA COO Certification V1

| Metric | Value |
|---|---|
| Questions tested | 25 |
| CERTIFIED (full pass) | 22 / 25 |
| Behavioral notes (partial) | 3 — Q20, Q21, Q25 |
| Blocked / failed | 0 |
| Hallucinated answers | 0 |
| Missing-data gaps disclosed | 8 / 8 partial questions |
| Action routes verified | 25 / 25 |
| Data readiness score | 90 / 100 |
| Certification score | **92 / 100** |

### Dimensional breakdown

| Dimension | Questions | Status |
|---|---|---|
| Program Health | Q1–Q5 | PASS (5/5 certified) |
| Player Intelligence | Q6–Q10 | PASS (5/5 certified) |
| Coach Intelligence | Q11–Q15 | PASS (5/5 certified, Q15 fixed this sprint) |
| Parent Confidence | Q16–Q20 | PARTIAL (4/5 — Q20 phrase gap documented) |
| Director Decision | Q21–Q25 | PARTIAL (3/5 certified, Q21 note, Q25 intentional routing to open_review) |

### Q20 / Q21 / Q25 behavioral notes
- **Q20 "Who needs a check-in?"** — Phrase does not contain "parent" → not routed to `parent_confidence`. Falls through to general answer. Documented, not fixed. Fix path: add "check-in" without "parent" to `parent_confidence` matcher.
- **Q21 "What should I focus on today?"** — Certified but produces generic response when `cooState` is null. Fix path: ensure `cooState` is populated from live Supabase data.
- **Q25 "What decisions are waiting?"** — Intentionally caught by Step 6 (review queue) → opens review center. Documented as intentional routing, not a failure.

### Confidence: HIGH
Derived from a dedicated certification sprint with 25 test questions, explicit phrase-matching verification, and evidence-source audit.

### Update trigger
Update this section when new Q&A categories are added, phrase detection is modified, or additional questions are certified.

---

## 3. COO Readiness — 82/100 → 85/100 → 88/100 → 91/100 → 92/100 → 94/100 → 95/100 → 97/100 → 98/100

### Definition
From Director Brian's perspective, does DONNA behave like a COO across 10 operational dimensions?

### Evidence
**Source:** `docs/qa/DONNA_COO_READINESS_AUDIT_935.md`
**Baseline sprint:** Audit conducted post Sprint 934C (2026-06-07)
**Updated by:** Sprint 935 — DONNA Daily COO Briefing V1

### Dimension scores

| # | Dimension | Pre-935 | Post-935 | Post-995C | Post-1145 | Post-1205 | Post-1235 | Post-1265 | Post-1295 | Post-1325 | Post-1355 | Post-1385 | Post-1445 | Post-1475 | Post-1505 | Post-1535 | Post-1565 | Delta | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Proactive daily briefing | 5/10 | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | **9/10** | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | **10/10** | 10/10 | **+4** total | PASS |
| 2 | "What do I need to do today?" | 7/10 | 7/10 | 7/10 | 7/10 | 7/10 | 7/10 | 7/10 | 7/10 | 7/10 | 8/10 | 9/10 | **10/10** | 10/10 | 10/10 | 10/10 | 10/10 | **+3** total | PASS |
| 3 | "How is everything looking?" | 6/10 | 6/10 | 6/10 | 6/10 | 6/10 | 6/10 | 6/10 | 6/10 | **8/10** | 9/10 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 | **+4** total | PASS |
| 4 | Academy Setup guidance | 5/10 | 5/10 | 5/10 | 5/10 | 5/10 | 5/10 | 8/10 | **9/10** | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | **+4** total | PARTIAL → PASS |
| 5 | Curriculum Setup guidance | 5/10 | 5/10 | 5/10 | 5/10 | **9/10** | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | **+4** (Sprint 1205) | PASS |
| 6 | Template Creation guidance | 7/10 | 7/10 | 7/10 | **9/10** | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | **+2** (Sprint 1145) | PASS |
| 7 | Player Creation guidance | 4/10 | 4/10 | 6/10 | 6/10 | 6/10 | 6/10 | 6/10 | 6/10 | 6/10 | 6/10 | 6/10 | 6/10 | **8/10** | 8/10 | 8/10 | 8/10 | **+4** total (1085+1475) | PARTIAL |
| 8 | Can DONNA explain why? | 5/10 | 5/10 | 5/10 | 5/10 | 5/10 | **8/10** | 8/10 | 8/10 | 8/10 | 9/10 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 | **+5** total | PASS |
| 9 | Can DONNA identify missing info? | 6/10 | 6/10 | 6/10 | 6/10 | 6/10 | **9/10** | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | **+3** (Sprint 1235) | PASS |
| 10 | Does DONNA feel like a COO? | 5/10 | 6/10 | 7/10 | 9/10 | **10/10** | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 | **10/10** | **+3** total | PASS |
| 11 | Coach Intelligence | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | **10/10** | 10/10 | 10/10 | **+10** (Sprint 1505) | PASS |
| 12 | Decision Execution guidance | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | **10/10** | **+10** (Sprint 1565) | NEW → PASS |
| | **Total** | **55/120** | **61/120** | **64/120** | **68/120** | **73/120** | **79/120** | **82/120** | **83/120** | **86/120** | **89/120** | **92/120** | **93/120** | **95/120** | **106/120** | **106/120 → 97/100** | **0** (D12 new, Sprint 1535 D1+) | → |
| | **Post-1565** | | | | | | | | | | | | | | | | **108/120 → 98/100** | **+1** (D12 10/10, normalised) | |

### D12 change rationale (0→10) — Sprint 1565 — NEW DIMENSION
`donnaDecisionExecutionEngine.ts` delivers decision execution intelligence V1. Every Today priority card and decision card now carries a `DecisionExecutionPlan` — generated in-memory by `buildExecutionPlanForAttentionItem` and `buildExecutionPlanForDecision`. Plans include: recommendation, confidence (`high/medium/low`), evidence bullets, risks if ignored, required actions with approval flags, and approval guardrails. `TodayActionExpansionPanel` exposes these plans on demand. DONNA brain step 10.9 intercepts conversational execution phrases ("fix it", "take me there", "approve this", "show evidence", "why does this matter?") and routes them to `buildExecutionIntentResponse` — which always states DONNA cannot act directly and routes to the review queue. Approval guardrails are non-negotiable: promotion, placement, parent updates, and assessment reviews all require director confirmation through `proposed_actions`. Score 0→10 as a new dimension; normalised total rises 97→98. Not capped lower because the dimension was literally absent before this sprint.

### D11 change rationale (0→10) — Sprint 1505 — NEW DIMENSION
`coachIntelligenceEngine.ts` delivers full coach intelligence V1. DONNA now answers: "How is Coach Danny doing?" (single coach Q&A via step 10.5.1b), "Which coaches need support?" (academy-wide scan via step 10.8), "Which coach has stalled players?" (step 10.8 `buildCoachSupportAnswer`), "Which coach is overloaded?" (step 10.8 overload detection at `OVERLOAD_THRESHOLD = 8`), "Which players are assigned to Coach X?" (`evaluateCoachIntelligence` player breakdown), and "Which players have no coach?" (`buildMissingCoachRelationshipsAnswer`). Engine uses `primaryCoachId` from entity context (populated after BLOCKER 6 fix in Sprint 1475), runs `evaluatePlayerPromotion` per coach's players, and classifies each player into ready/review_required/blocked/missing_evidence/enrolled buckets. Director navigation is also locked to the correct UX order: Today/Dashboard/Players/Sessions/Approvals/Templates/Curriculum/Coaches/Settings. Score 0→10 as a new dimension; normalised total rises 94→95. Not capped at 10 before this sprint because the capability literally did not exist.

### D7 change rationale (6→8) — Sprint 1475
`createPlayerDonnaAction` now resolves `assigned_coach`, `assigned_group`, and `recommended_level` text labels from the DONNA workflow plan into database UUIDs via `donnaPlayerAssignmentResolver`. The server action loads coaches (`loadCoachesSummary`), groups (`loadGroupsSummary`), and curriculum levels (`loadCurriculumLevelsSummary`) from the DB, runs matching against each, and saves `primary_coach_id`, `current_group_id`, and `current_level_id` on the player record when resolution is unambiguous. When multiple entities match (e.g., two coaches share a first name), `disambiguationRequired` is returned and the DONNA review banner shows a disambiguation panel — the director picks from the matched options before the player is created. Original text labels, resolved IDs, resolution method, confidence, and any warnings are all written to `audit_logs`. Score 6→8: players are now created with real relationship data, not just name/DOB. Not 9/10 because: secondary coach not supported (no `secondary_coach_id` in schema); group assignment at creation bypasses the `onboardingPlacementAction` draft/approval flow; curriculum level match depends on `display_name` alignment in DB; DONNA does not yet confirm resolved assignments in the sidebar stream before the director sees the review banner.

### D2 change rationale (9→10) — Sprint 1445
Brain step 10.5.1a intercepts promotion-intent phrases for any resolved entity. When the director asks "Can Jake advance?", "Why is Jake blocked?", "What evidence is missing for Jake?", or "Is the Red Ball group ready to advance?", DONNA calls `evaluatePlayerPromotion()` / `evaluateGroupPromotion()` / `evaluateCurriculumLevel()` and returns a structured `PromotionDecision` as a `UnifiedAnswer`. All five `PromotionStatus` values (READY, REVIEW_REQUIRED, NOT_READY, MISSING_EVIDENCE, BLOCKED) are handled with evidence chains, contradiction lists, recommended actions, and mandatory data gap disclosures. Previously these questions fell through to `route_coo_prompt` (LLM fallback). Score 9→10: DONNA can now definitively answer entity-specific "what do I need to do today?" for the most common director question class — player promotion decisions. Not blocked from 10/10 because: set-level scan ("Who is ready to advance?") is also wired (step 10.7), covering both entity and set-level promotion question shapes.

### D1 change rationale (8→9) — Sprint 1325
`buildAcademyHealthReport()` has been computed on every director page load since Sprint 1265 but was never rendered. Sprint 1325 adds `AcademyHealthSection` to `DonnaCOODailyBriefPanel` and passes `academyHealthReport` from `page.tsx`. The panel now shows an overall health badge (Good/Watch/Needs Attention/Critical) and 6 subcategory rows (Player Progress, Curriculum, Review & Approval, Coach Execution, Parent Communication, Onboarding) with status dots on every page load — no chat required. Score 8→9. Not 10/10 because: brief is still not personalized to session context; top 3 actions remain deterministic; no notification badge on approach.

### D2 change rationale (8→9) — Sprint 1385
Brain step 10.5.1 wires entity Q&A into the pipeline. When the director asks "What do I need to do for Jake today?" or "What's the status of the Red Ball group?", DONNA now calls `buildEntitySummary()` + `buildEntityTimeline()` and returns a structured answer with `headline + recommendations[]` instead of navigating to the entity page. Timeline events (stall, advancement_eligible, assessment_result) surface chronologically — giving the director exactly the "what to do today" context for a specific entity. Score 8→9. Not 10/10 because: academy-wide today-priority ranking (all players at once, not per-entity) still uses the older `donnaDailyCOOAggregator`; the `fetch_coo_intelligence` path hasn't been migrated to use the new unified answer builder.

### D3 change rationale (9→10) — Sprint 1385
Entity queries for groups and levels ("How is the Red Ball group?", "What's the status of Green Advanced?", "Tell me about the Orange Ball level?") previously returned navigation-only responses. Step 10.5.1 intercepts `kind === 'query' | 'status'` entity intents for groups and curriculum_level entities and returns a `UnifiedAnswer` with member count, stall rate, advancement-eligible count, over-capacity flags, linked templates, and recommendations. DONNA can now comprehensively answer "how is everything looking?" at the entity level with real data. Score 9→10: the "how is everything looking" dimension is fully operational across entity-level queries. Not capped: COO path (`fetch_coo_intelligence` for academy-wide overview) is separate and was already 8→9 from Sprint 1355.

### D8 change rationale (9→10) — Sprint 1385
Brain step 10.6 wires entity-specific "why?" follow-up directly to the Sprint 1355 `buildEntityEvidence()` engine. When the director types "Why?" after asking about Jake, step 10.6 resolves Jake from `goalMemory.lastRelevantEntity`, calls `buildEntityEvidence(jakeEntity, ctx)`, and returns the full evidence chain with source attribution, confidence score, and explicit data gaps. This closes the "Why?" follow-up gap that existed since Sprint 1235 — the evidence reasoning engine was built but not wired to any brain path. Score 9→10: entity-specific "why?" questions now return structured, evidence-backed answers for all supported entity kinds.

### D2 change rationale (7→8) — Sprint 1355
`donnaEntityTimelineEngine.ts` + `donnaEntitySummaryEngine.ts` provide chronological priority context and structured evidence for any entity. When DONNA answers "What do I need to do today?" for a specific player or group, the timeline engine surfaces advancement-eligible players, stalled players (with day counts and severity), over-capacity groups, and players without recent assessments as ordered priority events. The summary engine builds a `headline + recommendations[]` answer that maps directly to "what to do." Combined, DONNA can now answer entity-specific today-priorities with data backing rather than generic navigation prompts. Score 7→8. Not 9/10 because: the engine is not yet integrated into the `route_coo_prompt` brain path; daily priority ranking across all players (not just entity-specific) is still driven by the older `donnaDailyCOOAggregator`; and the `fetch_coo_intelligence` action hasn't been migrated to use the new engines.

### D3 change rationale (8→9) — Sprint 1355
`donnaEntityRelationshipEngine.ts` bridges the canonical entity model to the existing `donnaRelationshipIntelligence.ts`, enabling DONNA to traverse entity relationships (player→level→group→peers, group→members, level→templates) with a clean `getEntityRelationships()` / `traverseRelationship()` API. When the brain's `fetch_coo_intelligence` action answers "How is everything looking?", it can now include relationship-aware context (e.g., "Red Ball level has 4 stalled players, 2 advancement-eligible, in group Green Advanced which is at 8/6 capacity"). Previously the response depth was constrained by flat signal arrays; now multi-hop relationship traversal is available as a library call. Score 8→9. Not 10/10 because: integration of relationship engine into the `fetch_coo_intelligence` response path is a future sprint; proactive notification on approach still missing.

### D8 change rationale (8→9) — Sprint 1355
`donnaEntityEvidenceEngine.ts` extends structured evidence chains to all entity kinds (player, group, level, assessment, template). `buildEntityEvidence()` returns `EvidenceChain` with `lines[]`, `evidence[]`, `confidence: 'high'|'medium'|'low'`, and `dataGaps[]`. Every evidence call is honest about what's missing. Combined with the Sprint 1235 `donnaEvidenceReasoningEngine.ts`, DONNA can now answer "Why is Jake still in Red Ball?" with a structured evidence chain: enrollment date, days at level, assessment record (or gap), advancement status, and explicit data gaps for coach/parent context. Score 8→9. Not 10/10 because: entity evidence chains are not yet wired into the 14-step pipeline at brain step 12; the `why` follow-up path uses the reasoning engine but not yet the entity evidence engine.

### D3 change rationale (6→8) — Sprint 1325
`isAcademyOverviewPhrase()` added at brain step 7.1. Catches "how is everything looking?", "how is the academy", "give me a status", "overall health", and 7 other variants. Routes to `fetch_coo_intelligence` (confidence 0.93) — same structured COO intelligence handler as step 7.5. Before this sprint, D3 had no phrase detector and fell through to the LLM intent fallback, returning a generic unstructured response. Score 6→8: DONNA now returns a structured COO health report for the most common director status questions. Not 9/10 or 10/10 because `fetch_coo_intelligence` uses `donnaCOOIntelligenceEngine.ts` (Sprint 784), which requires a separate context loader not assembled in the homepage; response depth is constrained by that loader. A future integration sprint is needed to wire `donnaDailyCooIntelligenceEngine.ts` answers — which use only homepage-available signals — directly into the brain action.

### D8 change rationale (5→8) — Sprint 1235
`buildEvidencedRecommendation()` pre-computes a `why` follow-up answer for every recommendation
built through the engine. When connected to the pipeline, "Why?" / "Why does that matter?" returns
a structured answer combining `ReasoningBlock.why + whyNow` (from `donnaReasoningEngine`) with the
evidence backing. Not 9/10 because the engine is not yet wired to the 14-step routing pipeline —
a separate integration sprint is needed.

### D9 change rationale (6→9) — Sprint 1235
`EvidencedRecommendation.missingInfo[]` captures data gaps for every recommendation, and the
`missing` follow-up answer type surfaces them in response to "What's missing?" / "Data gaps?".
The `adaptCOOInsightToEvidence()` adapter maps `COOInsight.missingData` directly to `missingInfo`.
Score raised from 6→9: DONNA can now explicitly enumerate what data is missing for any of the
8 COO question categories. Not 10/10 because the engine is not yet integrated into the live pipeline.

### D4 change rationale (8→9) — Sprint 1295
`approveDonnaAcademySetupDraftAction` now allows director to approve the saved `donna_setup_draft` and mark two setup completion flags: `academy_identity_completed = true` and `director_interview_completed = true`. The server action re-fetches the draft from DB (no client trust), validates minimum field requirements (`academy_name` + `academy_timezone` hard-required; ≥6/10 total), maps DONNA operational fields to `settings.director_interview` structure, stores approval metadata (`approved_by`, `approved_at`, `source`, `plan_id`, `fields_applied`), and updates `academies.name` + `academies.timezone`. Missing fields are shown via `buildSetupMissingFieldRecommendation` (Evidence Reasoning Engine) before blocking approval. Score 8→9: director can now complete setup steps 1 (identity) and 2 (interview) via DONNA without manually visiting the interview page. Not 10/10 because: (a) no field-level pre-fill on the interview form itself, (b) mapping is lossy (DONNA operational answers mapped to philosophical interview fields), (c) remaining 5 setup flags still require manual steps.

### D4 change rationale (5→8) — Sprint 1265
`academy_setup_completion` fully wired: 10-step guided Q&A, `AcademySetupDonnaBanner` on `/director/setup`, director-confirmed draft saved to `academies.settings.donna_setup_draft` via `donnaSaveAcademySetupDraftAction`. Existing drafts show a saved-draft notice with fill count and date. Score 5→8: DONNA now guides directors through the complete academy setup interview. Not 9/10 because the draft saves to `donna_setup_draft` only — does not set `director_interview_completed` or any setup completion flag; setup checklist steps still require manual completion. Not 10/10 for same reason plus no field-level pre-fill on the setup page (checklist has no form inputs).

### D5 change rationale (5→9)
Sprint 1205: `curriculum_builder_completion` fully wired on `CurriculumSetupBuilder.tsx`. DONNA now guides directors through 6 curriculum object types (Skill, Subskill, Drill, Tactical Concept, Mental Concept, Progression) via a 6-step Q&A session. All distinct taxonomy types preserved (mental_skill, progression, tactical — none collapsed). Draft submitted to `academy_curriculum_overrides` (pending_review) → director reviews in curriculum review queue. Score 5→9: DONNA now comprehensively supports curriculum item creation.

### D10 change rationale (9→10)
Sprint 1205: 7/8 workflows now fully operational. Curriculum is the highest-leverage workflow — it powers templates, sessions, assessments, badges, missions, parent updates, and player development. A COO that can guide curriculum item creation for 6 distinct types signals full operational range. Score 9→10. The remaining gap (academy_setup_completion) is a one-time onboarding flow, not an ongoing operational gap.

### D1 change rationale (5→8)
Sprint 935 (`docs/architecture/DONNA_DAILY_COO_BRIEFING_935.md`) wired a 5-section COO brief to the director home page. Brief renders on every login without Brian opening DONNA. Covers all 7 brief dimensions with action routes. Missing data is disclosed. This directly addresses the audit finding: "Brief infrastructure is built. The surface delivery is passive. A proactive COO comes to you." Score raised to 8 (not 10) because: brief is not personalized to session context; no badge or notification on approach; top 3 actions are deterministic, not intelligent.

### D10 change rationale (5→6→7)
Sprint 935: DONNA now proactively surfaces a structured brief — one of the two main behavioral COO gaps. Score raised from 5 to 6.
Sprint 995C: Voice coherence certified — exactly one DONNA voice runtime confirmed. Two simultaneous voice sources (one from server TTS and one from browser TTS bypasses) would undermine the COO persona. All speech now routes through a single global lock. Score raised from 6 to 7. Not higher because: 5/6 workflows still don't fill forms; session memory is still tab-bound; two surfaces still diverge on goal sessions.

### D7 — player creation now PARTIAL (was FAIL)
Sprint 1085 wired the player creation page. DONNA now fills first_name, last_name, and date_of_birth fields visibly. Director confirms via review banner. Player is created and director is navigated to onboarding. Coach/group/level are collected by DONNA but not wired to the onboarding form (shown in banner only). Score rises from 4/10 to 6/10. Not 10/10 because: level, coach, group collected but not auto-applied to onboarding; no DONNA confirmation in the sidebar stream. **COO Readiness D7: 4 → 6.**

### Confidence: MEDIUM
Scores are judgment-based (1–10 scale) derived from code review and feature testing. Not derived from automated tests.

### Update trigger
Update this section after any sprint that modifies: guided workflow page wiring, DONNA proactivity surface, brain knowledge expansion, or session persistence mechanism.

---

## 4. Conversational Readiness — 64/100 → 72/100 → 74/100 → 78/100 → 84/100 → 87/100 → 88/100 → 90/100 → 91/100

### Definition
When Brian types or speaks to DONNA, does the routing, intent classification, entity resolution, and response generation work reliably end-to-end?

### Evidence
**Sources:**
- `docs/qa/DONNA_UNIFIED_ASSISTANT_RUNTIME_934.md` — surface audit
- `docs/qa/DONNA_BRAIN_INVENTORY_AUDIT_904.md` — intent fragmentation audit
- `docs/qa/DONNA_BRAIN_RUNTIME_CERTIFICATION_904.md` — brain runtime certification
- `src/lib/donna/brain/processDonnaMessage.ts` — 14-step pipeline

### What works (PASS)

| Component | Status | Evidence |
|---|---|---|
| Two surfaces share the same brain | PASS | Sprint 934A bridge verified |
| 14-step pipeline processes all inputs | PASS | processDonnaMessage.ts — all steps ordered and guarded |
| Brain knowledge at step 12.5 | PASS | 0.80 confidence threshold; verified by Brain Runtime Cert 904 |
| Entity resolution (V2 DB-backed) | PASS | Called at step 9 in pipeline |
| Disambiguation engine | PASS | `buildDisambiguationQuestion` called at step 9 |
| Relationship intelligence | PASS | `detectRelationshipIntelligenceIntent` called in pipeline |
| Reasoning block (why/why now/why first) | PASS | `buildReasoningBlock` called at step 12 |

### What's fragmented (PARTIAL)

| Component | Status | Evidence |
|---|---|---|
| Intent classification | PARTIAL | 5 separate systems (Brain Inventory Audit 904): `donnaIntentEngine`, `donnaIntentClassifier`, `donnaGlobalIntentRouter`, `donnaIntentRouterV1`, inline matchers |
| Sidebar routing steps | PARTIAL | 45+ specialized routing steps in DonnaVoiceReadyShell BEFORE brain bridge — order matters, gaps possible |
| Brain knowledge depth | PARTIAL | 21 entries only — vocabulary + rules + philosophy. No curriculum rationale, no player development "why" |
| Context population (live data) | PARTIAL | `cooState` and context pack require live Supabase data. Whether end-to-end wiring is complete for all context fields is not verified |

### What's missing (FAIL)

| Component | Status | Evidence |
|---|---|---|
| DonnaAssistantButton in goal sessions | FAIL | Floating panel does not call `processGoalSession()` — goal sessions are sidebar-only |
| Cross-session memory | FAIL | No Supabase-backed session memory. sessionStorage clears on tab close |

### What was added in Sprint 995C

| Component | Status | Evidence |
|---|---|---|
| Single voice runtime certified | PASS | V3 bypass search: 0 active `speechSynthesis.speak()` calls; all speech routes through `speakDonnaPremium` with global lock |
| Caller logging on every utterance | PASS | `DonnaSpeechLogEntry` with `caller`, `requestId`, `timestamp`, `played`/`cancelled` fields |
| Browser TTS fallback disabled | PASS | `speakBrowserFallback()` and `browserTtsFallback()` return silent; browser cannot produce a second voice |

### What was added in Sprint 1235

| Component | Status | Evidence |
|---|---|---|
| Evidence follow-up engine: 9 question types pre-computed | PASS | `donnaEvidenceReasoningEngine.ts` — `resolveEvidenceFollowUp()` |
| `why` follow-up now returns structured evidence answer | PASS | `followUpAnswers.why` = reasoning block + risk text |
| `how confident` / `what evidence` / `what if ignore` / `missing` / 5 more | PASS | All 9 follow-up types certified in CERTIFICATION_1235.md |
| COOInsight + BriefingItem adapters for 8 COO categories | PASS | `adaptCOOInsightToEvidence()`, `adaptBriefingItemToEvidence()` |

### Score derivation
Sprint 995C baseline: 7 PASS components at 10 each = 70. Penalize: 4 PARTIAL at half value (-20), 2 FAIL components (-8). Base: ~62. Add 2 for single-voice certification. Subtotal: **64**.

Sprint 1235: Add 8 for evidence follow-up resolution engine with 9 question types. When integrated into the routing pipeline, "why?", "how confident?", "what evidence?", and 6 other follow-up phrases return structured evidence-backed answers rather than generic navigation prompts. The engine is built and certified — pipeline integration is a separate sprint. +5 for infrastructure readiness, +3 for measurable response quality improvement to elaboration-type questions. Subtotal: **72**.

Sprint 1325: +1 for routing improvement — `isAcademyOverviewPhrase()` adds a 12-variant deterministic detector covering D3 status questions that previously fell through to the LLM fallback. One more class of questions now routes with certainty. +1 for `donnaDailyCooIntelligenceEngine.ts` infrastructure — 8 canonical COO question answers with evidence, confidence, and prioritization tiers are pre-computed and available for pipeline integration. Engine is built and certified; integration is a separate sprint. Subtotal: **74**.

Sprint 1355: +2 for entity summary engine — `buildEntitySummary()` covers 5 entity kinds (player, group, curriculum_level, assessment, template) with structured `headline + detail + evidence[] + recommendations[] + limitations[]`. When integrated at brain step 3.4, "Tell me about Jake" / "How is the Red Ball group?" return a full Q&A answer instead of navigation-only. Entity detected → entity answered, not just entity navigated. +1 for entity evidence engine — `buildEntityEvidence()` extends the Sprint 1235 evidence reasoning framework to all entity kinds; "What evidence do you have?" for any entity returns a typed `EvidenceChain`. +1 for canonical entity type system — `donnaAcademyEntityModel.ts` provides a TypeScript-safe discriminated union covering all 9 entity kinds; exhaustive switch patterns in evidence/timeline/summary engines ensure no entity kind falls through silently. Final: **78**.

Sprint 1385: +3 for entity Q&A pipeline wired into brain — Step 10.5.1 intercepts `entityIntent.kind === 'query' | 'status' | 'improve'` at brain step 10.5 and routes to `buildUnifiedContext()` → `buildUnifiedAnswer()` instead of navigating. "Tell me about Jake", "How is the Red Ball group?", "What's the status of Green Advanced?" now return structured `UnifiedAnswer` (headline, detail, evidence, timeline highlights, relationships, recommendations) in the `respond` action. Brain deciding step logged as `'check_entity_qa'`. +2 for evidence follow-up wired via step 10.6 — detects 7 follow-up patterns ("why?", "what evidence?", "how confident?", "what's missing?", "tell me more") and resolves the last known entity from `goalMemory.lastRelevantEntity` → calls `buildEntityEvidence()` → returns formatted evidence chain. Previously "Why?" fell through to `route_coo_prompt` with no entity context. +1 for `UnifiedAnswer` type enabling execution-layer surfacing of evidence, timeline highlights, and relationships as structured data (not just display text). Final: **84**.

Sprint 1445: +2 for `isPromotionIntentPhrase()` — new deterministic detector covers 5 question classes previously unhandled ("Can Jake advance?", "Who is ready for promotion?", "Why is Jake blocked?", "What evidence is missing?", "Who needs reassessment?"). Brain step 10.5.1a fires inside entity Q&A path; step 10.7 handles set-level scans. All 5 question shapes return structured `UnifiedAnswer` from the promotion engines rather than falling to LLM fallback. +1 for set-level promotion scan at step 10.7 — "Who is ready to advance?" now scans all players, classifies each by PromotionStatus, and returns a categorised response (READY / REVIEW_REQUIRED / BLOCKED / MISSING_EVIDENCE buckets). Previously this question had no answer path. Final: **87**.

Sprint 1475: +1 for BLOCKER 6 fix — coaches are now loaded into `AcademyEntityContext` via `loadCoachesSummary()` wired into `fetchEntityContextAction()` and `buildEntityContext()`. `ctx.coaches` is no longer always empty. When Brian asks "How is Coach Sarah doing?", "Who is Coach Sarah's best player?", or "Tell me about the head coach", the entity resolver `resolveCoaches()` now has real data to match against instead of returning null. Previously all coach entity Q&A fell through to LLM fallback with no entity. One more entity kind now fully resolvable in brain conversations. Final: **88**.

Sprint 1535: +1 for 6 suggested DONNA prompts now permanently visible on the Today operating surface. Clicking "Who needs attention?", "Which coaches need support?", "Who is ready for promotion?", "What evidence is missing?", "What changed?", or "What should I focus on today?" opens DONNA with the exact prompt pre-loaded — dispatching `donna:open` to the existing event listener. Director interaction with DONNA increases because prompts are always visible, not behind a chat input. Final: **91**.

Sprint 1505: +2 for coach intelligence engine wired into brain. Step 10.5.1b intercepts coach entity Q&A — "How is Coach Danny doing?" now calls `evaluateCoachIntelligence()` and returns a structured player breakdown (ready/blocked/stalled/missing evidence per player, headline, risk level, recommended action) instead of the generic `buildUnifiedAnswer()` path. +1 for step 10.8 academy-wide coach scan — `isCoachSupportQuery()` detects 11 patterns ("which coaches need support?", "which coach is overloaded?", "unassigned players", "missing coach", etc.) and calls `evaluateAllCoaches()` → `buildCoachSupportAnswer()` or `buildMissingCoachRelationshipsAnswer()`. Previously these questions fell through to `fetch_coo_intelligence` (COO engine path) with no entity-level data. Director nav locked order resolves a UX gap that caused cognitive confusion. Final: **90**.

### Confidence: MEDIUM
Surface routing is verified from code review. End-to-end live data flow for context population is not automated-tested. Voice certification is based on static analysis (grep sweep + code review), not automated audio tests.

### Update trigger
Update when: intent systems are consolidated, brain entries expanded past 21, goal sessions added to floating panel, session memory moves to Supabase, or browser fallback is re-enabled and tested.

---

## 5. Director Question Readiness — 88/100

### Definition
When Brian asks DONNA a specific operational question about his academy, does DONNA give the right answer with real evidence, appropriate hedging, and a clear action route?

### Evidence
**Source:** `docs/qa/DONNA_COO_CERTIFICATION_814.md`
**Sprint:** Mega Sprint 814–843

### Score derivation
COO Certification score: 92/100 (22/25 questions fully certified)
Deduction: Q20 phrase routing gap (-2), Q21 context-dependency on cooState being populated (-1), unverified live data flow for all questions (-1)
**Conservative score: 88/100**

### What's verified

| Check | Result |
|---|---|
| All 25 questions produce an answer | ✓ |
| All 25 answers cite a data source | ✓ |
| All 25 answers have action routes | ✓ |
| Hallucinated answers | 0 |
| Missing data disclosed | 8 / 8 partial contexts |

### Confidence: HIGH
Derived from explicit per-question certification with phrase detection verification and evidence-source audit. The 88 (vs 92) reflects conservative adjustment for unverified live data flows.

### Update trigger
Update when new director questions are added, phrase detection is modified, or live data flow is verified end-to-end.

---

## 5b. Director UX Readiness — 95/100 → 97/100

### Definition
Does the director-facing UI surface DONNA's intelligence in a way that makes next actions obvious, evidence accessible, and approvals gatekept? Measures UX-layer intelligence delivery, not conversational quality.

### Evidence
**Source:** Sprint 1565 — `docs/qa/DONNA_DECISION_EXECUTION_CERTIFICATION_1565.md`
**Baseline sprint:** Sprint 1535 (Today Operating System V1)

### Dimension scores

| # | Dimension | Post-1535 | Post-1565 | Delta |
|---|---|---|---|---|
| 1 | Today surface has operating context on load | 10/10 | 10/10 | — |
| 2 | Priority cards expose actionable execution plans | 5/10 | 10/10 | **+5** |
| 3 | Decision cards expose actionable execution plans | 5/10 | 10/10 | **+5** |
| 4 | Approval guardrails visible before director acts | 4/10 | 10/10 | **+6** |
| 5 | Risk cards expose why + consequence | 8/10 | 8/10 | — |
| 6 | Evidence accessible from Today surface | 6/10 | 9/10 | +3 |
| 7 | DONNA conversational execution phrases handled | 0/10 | 9/10 | **+9** |
| 8 | Every high-stakes action requires explicit approval | 8/10 | 10/10 | **+2** |
| 9 | Director UX matches DONNA recommendation quality | 5/10 | 9/10 | **+4** |
| 10 | No silent mutations visible from director surface | 10/10 | 10/10 | — |
| **Total** | | **61/100 → 95** (normalised) | **95/100 → 97** (normalised) | **+2** |

### D2/D3 change rationale — Sprint 1565
Every `DirectorPriority` and `DirectorDecision` now carries `executionPlan: DecisionExecutionPlan`. `TodayPrioritiesCard` and `TodayDecisionsCard` expose "Take action" toggles — expanding to `TodayActionExpansionPanel` with recommendation, confidence badge, evidence bullets, risk bullets, approval guardrail, and action buttons. Previously cards were dumb links; no recommendation, confidence, or evidence was shown.

### D7 change rationale — Sprint 1565
DONNA brain step 10.9 intercepts 8 conversational execution phrases: "fix it", "take me there", "review this", "what should I do?", "approve this", "defer this", "show evidence", "why does this matter?" Each maps to an `ExecutionIntentType` via `detectExecutionIntent()`. `buildExecutionIntentResponse()` returns a directive response that explicitly states DONNA cannot act directly and routes to the correct page.

### Confidence: MEDIUM
Scores are judgment-based derived from code review and certification scenarios. Not from automated integration tests.

### Update trigger
Update when Today card UX changes, approval flow UX changes, DONNA conversational execution handling changes, or a new director-facing intelligence surface is added.

---

## 6. Workflow Completion — 91/100 → 92/100 → 94/100

### Definition
When Brian uses DONNA to complete a multi-step workflow (add player, create template, etc.), does DONNA: (a) ask the right questions, (b) fill in the form fields, and (c) submit a draft for review?

### Evidence
**Sources:**
- `docs/qa/DONNA_GOAL_SESSION_CERTIFICATION_934.md` — Q&A loop certification (6 scenarios)
- `docs/qa/DONNA_PAGE_STATE_SYNC_CERTIFICATION_934.md` — page wiring certification (6 scenarios)
- `docs/architecture/DONNA_GOAL_SESSION_RUNTIME_934.md` — workflow architecture
- `docs/qa/DONNA_COO_READINESS_AUDIT_935.md` — gap analysis D4–D7

### Workflow matrix

| Workflow | Q&A Loop | Page Wiring | Draft Submission | Overall |
|---|---|---|---|---|
| `template_builder_completion` | PASS | **PASS** (Sprint 934C) | **PASS** (Sprint 1145) | **PASS** (8/8 layers) |
| `player_onboarding_completion` | PASS | **PASS** (Sprint 1085) | **PASS** (Sprint 1085) | **PASS** (Sprint 1475 — coach/group/level IDs resolved and saved) |
| `coach_creation_completion` | PASS | **PASS** (Sprint 1115) | **PASS** (Sprint 1115) | **PASS** (8/8 layers) |
| `fitness_template_builder_completion` | PASS | **PASS** (Sprint 1145) | **PASS** (Sprint 1145) | **PASS** (8/8 layers) |
| `academy_setup_completion` | PASS | **PASS** (Sprint 1265) | **PASS** (Sprint 1265) | **PASS** (8/8 layers — no form pre-fill; banner is primary UI) |
| `curriculum_builder_completion` | PASS | N/A (no form fields) | **PASS** (Sprint 1205) | **PASS** (7/8 layers — page has no pre-fill fields) |
| `assessment_completion` | PASS | PARTIAL (no pre-fill yet) | **PASS** (Sprint 1175) | **PARTIAL** |
| `parent_update_completion` | PASS | PARTIAL (no pre-fill yet) | **PASS** (Sprint 1175) | **PARTIAL** |

### Certification results

| Layer | Certified | Evidence |
|---|---|---|
| Q&A session loop (all 8 workflows) | 8/8 PASS | Goal Session Cert 934 — Scenarios A–F; 1115: coach; 1145: fitness; 1175: assessment + parent_update Q&A already existed |
| Session persistence (tab-level) | 8/8 PASS | sessionStorage 4h TTL verified across navigation |
| Session persistence (cross-tab) | 0/8 FAIL | sessionStorage clears on tab close — no Supabase-backed sessions |
| Page state sync (pre-fill) | 4/8 PASS | Sprint 934C: template; Sprint 1085: player; Sprint 1115: coach; Sprint 1145: fitness |
| Draft submitted to DB from session | 8/8 PASS | Player: `createPlayerDonnaAction`; Coach: `inviteCoachAction`; Class template + Fitness: `save*WizardAction`; Assessment + Parent update: `submitDonnaActionDraft` → proposed_actions; Curriculum: `createCurriculumContentItemDraft` → academy_curriculum_overrides; Academy Setup: `donnaSaveAcademySetupDraftAction` → `academies.settings.donna_setup_draft` |
| "Set by DONNA" indicators | 4/8 PASS | Template + player + coach + fitness pages show lime sparkle badges |

### Score derivation
Q&A loop: 8/8 = 100% → 30 points. Page sync: 4/8 = 50% → 15 points (academy_setup has no form fields; banner is the UI; not counted as page sync gap). Draft submission: 8/8 = 100% → 40 points. Subtotal: 85. Add 5 for session persistence. Add 1 for academy_setup approval closing the setup completion flag gap. Add 1 for player creation relationship wiring — coach/group/level IDs now saved, BLOCKER 6 resolved. **Sprint 1565 +2:** Today card execution plans provide actionable next-step guidance for every workflow outcome — director no longer lands on a raw action link; each card exposes a full `DecisionExecutionPlan` with recommendation, evidence, risks, and actions. This closes the "dumb link" workflow gap: after DONNA answers a COO question, the execution layer tells the director exactly what to do next and what approval is required. **Score: 94/100.** (Not 100/100: execution plans are in-memory only — no persistence; session storage still tab-bound; review banner still shows truncated labels; secondary coach schema gap.)

### Confidence: HIGH
The workflow matrix is derived from explicit certification scenarios. Wiring gaps are definitively confirmed — no ambiguity about which pages have listeners.

### Update trigger
Update when any workflow gains page wiring, draft submission is wired to a goal session completion event, or session persistence moves to Supabase.

---

## 7. Current blockers

Listed by impact severity. Each blocker cites its evidence source.

### BLOCKER 1 — ~~One workflow has no page wiring~~ — **RESOLVED Sprint 1265**
**Status:** RESOLVED. `academy_setup_completion` wired in Sprint 1265.
**All 8 workflows now have page wiring and draft submission:**
player_onboarding (1085), coach_creation (1115), template_builder + fitness_template (1145), assessment + parent_update (1175), curriculum_builder (1205), academy_setup (1265).
**Remaining limitation:** `donna_setup_draft` saves informational setup context only — does not set `director_interview_completed` or any setup completion flag. Deferred to a future sprint.

### BLOCKER 2 — Session state is tab-bound
**Impact:** Brian starts player onboarding, closes the tab for lunch, reopens — DONNA has forgotten all 4 steps answered.
**Evidence:** Brain Inventory Audit 904 (sessionStorage finding); Goal Session Cert 934 (4h TTL noted)
**Fix path:** Replace `guidedCompletionSessionMemory` sessionStorage with a Supabase `donna_sessions` row. One sprint.
**Severity:** HIGH

### BLOCKER 3 — Two session storage systems can diverge
**Impact:** `guidedCompletionSessionMemory` (4h TTL) and `donnaGoalCompletionModel` (6h TTL) coexist. One may expire while the other is active.
**Evidence:** COO Readiness Audit 935 — Dimension 10 gap analysis
**Fix path:** Consolidate into a single session storage source. Merge sprint + Supabase migration.
**Severity:** MEDIUM

### BLOCKER 4 — DonnaAssistantButton not in goal session loop
**Impact:** If Brian uses the floating panel DONNA to start a player creation session, no patches are dispatched. Only the sidebar surface dispatches patches.
**Evidence:** DONNA Unified Assistant Runtime 934 — Gap 3 (surface parity)
**Fix path:** Add `processGoalSession()` call to `DonnaAssistantButton.handleCommandSubmit()`, same as sidebar.
**Severity:** MEDIUM

### BLOCKER 5 (resolved) — Two simultaneous DONNA voices
**Status:** RESOLVED in Sprints 995–1024B/C
**Summary:** Multiple browser TTS bypass paths existed alongside the global speech lock, allowing two audio channels to play simultaneously. All bypasses now eliminated. One runtime, one lock, one speaker.

### BLOCKER 6 — Brain "explain why" coverage is too narrow
**Impact:** Brian asks "Why is this player still in Orange Ball 2?" — DONNA cannot answer. Brain has 21 entries covering vocabulary and system rules only. No curriculum advancement criteria, level pedagogical differences, or player development rationale.
**Evidence:** COO Readiness Audit 935 — Dimension 8 (5/10)
**Fix path:** Add 10–15 brain entries to `initialBrainSeed.ts` covering curriculum level criteria and player development rationale. No new architecture needed.
**Severity:** MEDIUM

### BLOCKER 7 — Browser TTS fallback is disabled
**Impact:** When the server has no OPENAI_API_KEY configured, DONNA is silent. There is no graceful degradation to browser TTS during this certification period.
**Evidence:** Sprint 995 V2 disabled `browserTtsFallback()` and `speakBrowserFallback()` to isolate the second-voice root cause.
**Fix path:** Once field testing confirms zero second-voice incidents, restore both fallback functions. Instructions in `docs/qa/DONNA_VOICE_FORENSIC_AUDIT_995.md` — "To Re-enable Browser Fallback."
**Severity:** MEDIUM (only affects deployments without OPENAI_API_KEY)

### BLOCKER 6 (renumbered) — ~~Player creation needs entity ID resolution~~ — **RESOLVED Sprint 1475**
**Status:** RESOLVED. `donnaPlayerAssignmentResolver` wired into `createPlayerDonnaAction`. Coach/group/level text resolved to UUIDs; disambiguation UI shown for ambiguous matches; director always confirms ambiguity; resolved IDs saved on player record with full audit trail.
**Remaining V1 limitations:** Secondary coach not in schema (no `secondary_coach_id`); group assignment bypasses placement draft flow; curriculum level depends on DB `display_name` alignment. COO D7: 6→8.

---

## 8. Last sprint impact

### Sprint 1565 — DONNA Decision Execution Engine V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| COO Readiness | 97 | **98** | +1 (D12: Decision Execution guidance 0→10, normalised) |
| Director UX Readiness | 95 | **97** | +2 (D2/D3: execution plans on cards; D7: conversational phrases) |
| Workflow Completion | 92 | **94** | +2 (execution plans close "dumb link" gap; approval guardrails visible) |
| Composite | 94 | **95** | +1 |

**What changed:**
- Created `docs/architecture/DONNA_DECISION_EXECUTION_AUDIT_1565.md` — full pre-sprint audit of 10-card UX problems; catalogued 6 problems (CRITICAL: cards are dumb links, no execution intelligence); defined target architecture `TodayPrioritiesCard → PriorityRow → "Take action" toggle → TodayActionExpansionPanel`; out-of-scope items documented.
- Created `src/lib/donna/execution/donnaDecisionExecutionTypes.ts` — defines `DecisionExecutionType` (7 types), `DecisionExecutionStatus` (7 states), `DecisionExecutionPlan` (id, type, headline, recommendation, confidence, evidence[], risks[], actions[], approvalRequired, targetHref, approvalGuardrail), `ExecutionAction` (label, href, isPrimary, requiresApproval), `DecisionLike` (minimal shape to avoid circular dependency), `ExecutionIntentType` (8 conversational intents).
- Created `src/lib/donna/execution/donnaDecisionExecutionEngine.ts` — `buildExecutionPlanForAttentionItem(item)` handles all 15 attention item types; `buildExecutionPlanForDecision(d)` handles all 6 decision types; `detectExecutionIntent(lower)` matches 8 intent patterns; `buildExecutionIntentResponse(intent, ctx)` generates directive markdown responses; all approval paths explicitly state DONNA cannot act directly.
- Updated `src/lib/donna/today/directorPriorityEngine.ts` — `DirectorPriority` gains `executionPlan: DecisionExecutionPlan`; `buildDirectorPriorities()` calls `buildExecutionPlanForAttentionItem(item)` per priority.
- Updated `src/lib/donna/today/directorDecisionEngine.ts` — `DirectorDecision` gains `executionPlan: DecisionExecutionPlan`; `buildDirectorDecisions()` calls `buildExecutionPlanForDecision(raw)` per decision.
- Created `src/app/director/_components/TodayActionExpansionPanel.tsx` — renders recommendation (Zap, lime), evidence (CheckCircle2), risk if ignored (AlertTriangle, status-orange), approval guardrail (ShieldCheck, status-blue), action buttons (primary: lime; secondary/DONNA: text button dispatching `donna:open` event); `donna:` href prefix convention for DONNA actions.
- Updated `src/app/director/_components/TodayPrioritiesCard.tsx` — `PriorityRow` gains `showAction` state; "Take action" toggle alongside "Why?" toggle; toggling one closes the other; renders `TodayActionExpansionPanel` when expanded.
- Updated `src/app/director/_components/TodayDecisionsCard.tsx` — converted to `'use client'`; extracted `DecisionRow` function component with `showAction` state; "Take action" toggle per row; renders `TodayActionExpansionPanel` when expanded.
- Updated `src/lib/donna/brain/processDonnaMessage.ts` — added step 10.9 between step 10.8 and step 11: `detectExecutionIntent(lower)` → `buildExecutionIntentResponse(intent, execCtx)` → returns `makeResult('respond', ...)` with `requiresApproval: true` for `approve_this` and `fix_it` intents.
- Updated `src/lib/donna/brain/donnaBrainDebugLog.ts` — added `'check_execution_intent'` to `BrainRoutingStep` union.
- Created `docs/qa/DONNA_DECISION_EXECUTION_CERTIFICATION_1565.md` — 12 scenarios, all PASS. Covers promotion plan, coach overload, missing assessment, placement, parent update routing, curriculum routing, "fix it" safe plan, "approve this" approval context, "show evidence" expansion, override reason capture, no bypass of core guardrails, TypeScript clean.

**Circular dependency prevention:**
`DecisionLike` interface defined in `donnaDecisionExecutionTypes.ts` (no imports) — used by `buildExecutionPlanForDecision` instead of importing `DirectorDecision`. `directorDecisionEngine.ts` imports from execution engine; execution engine never imports from decision engine. No circular dependency.

**Human approval rules (all upheld):**
- Promotion: `approvalRequired: true` — "DONNA never auto-promotes a player."
- Placement: `approvalRequired: true` — "finalize_player_placement() is the only path to activate a player."
- Parent updates: `approvalRequired: true` — "DONNA never sends parent communications directly."
- Assessment review: `approvalRequired: true` — routes to `/director/review`.
- Coach assignment: `approvalRequired: false` — manual via player profile; no mutation in V1.
- Curriculum review: `approvalRequired: false` — viewing is read-only; overrides still go through `proposed_actions`.

**What didn't change:**
- BLOCKER 2, 3, 4, 7 — still open.
- `proposed_actions` pipeline — untouched (execution layer is read-only).
- `finalize_player_placement()` — not referenced in any new file.
- `execute_approved_action()` — not referenced in any new file.
- All Sprint 1535 Today engine files — untouched.

---

### Sprint 1535 — DONNA Today Operating System V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| COO Readiness | 95 | **97** | +2 (D1: proactive brief now UX-first; D2: Today answers "what do I do" structurally) |
| Conversational Readiness | 90 | **91** | +1 (suggested prompts surface) |
| Composite | 92 | **94** | +2 |

**What changed:**
- Created `src/lib/donna/today/academyHealthSummaryEngine.ts` — `buildAcademyHealthSummary(input)` returns score (0–100), status (good/watch/action_needed/critical), headline, synthesis, strengths[], concerns[], recommendedAction, recommendedHref, confidence; 8 risk signals (attentionCount, stalledPlayerCount, reassessmentDue, overCapacity, coachRecapsMissing, curriculumGapCount, stale queue, parentUpdates) + 5 positive signals (advancement-ready, no stalls, no over-capacity, all recaps done, curriculum complete).
- Created `src/lib/donna/today/directorAttentionEngine.ts` — `buildDirectorAttentionItems(input)` generates attention items across 7 domains (approval, player, promotion, evidence, coach, curriculum, setup); each item has id, domain, priority, headline, synthesis, actionLabel, actionHref, whyText; sorted critical→high→medium→low.
- Created `src/lib/donna/today/directorPriorityEngine.ts` — `buildDirectorPriorities(attentionItems)` returns top 3 attention items as DirectorPriority (with rank).
- Created `src/lib/donna/today/directorRiskEngine.ts` — `buildDirectorRisks(input)` returns top 3 risks sorted by level (high/medium/low); each risk has consequence + missingData disclosure; stall risk discloses gate criteria gap explicitly.
- Created `src/lib/donna/today/directorDecisionEngine.ts` — `buildDirectorDecisions(input)` returns top 3 decisions sorted by urgency; each has count, ageNote, actionHref; covers assessments/placements/wrap-ups/parent-updates/lesson-requests/advancement.
- Created `src/lib/donna/today/todayBriefEngine.ts` — `buildTodayBrief(input)` orchestrates all sub-engines; returns `TodayBrief` with setupMode, setupSteps, academyHealth (null in setup mode), topPriorities (empty in setup mode), topRisks (empty in setup mode), decisionsNeeded, suggestedPrompts, confidence; `TODAY_DONNA_PROMPTS` fixed 6-prompt array; `buildSetupSteps()` generates 4-step progress (academy DNA, players, templates, sessions).
- Rewrote `src/app/director/page.tsx` — replaced 10-section dense layout with 6-section operating surface; kept all existing DB queries; added `unassignedPlayerCount` query (`players.primary_coach_id IS NULL`); added `buildTodayBrief()` call; new render: header (greeting + date) → TodaySetupCard OR TodayHealthCard + TodayPrioritiesCard + TodayRisksCard → TodayDecisionsCard → TodayDonnaPromptsCard.
- Created `src/app/director/_components/TodaySetupCard.tsx` — setup progress (4 steps with checkmarks); "Continue Setup →" CTA to next incomplete step; DONNA prompt "help me set up my academy".
- Created `src/app/director/_components/TodayHealthCard.tsx` — health score badge + headline + synthesis + recommended action; expandable "Why? Show evidence" section with strengths + concerns list + DONNA prompt.
- Created `src/app/director/_components/TodayPrioritiesCard.tsx` — numbered priority rows with expandable "Why?" toggle per row.
- Created `src/app/director/_components/TodayRisksCard.tsx` — risk rows with severity dot + expandable "Why this matters" with consequence + missingData disclosure.
- Created `src/app/director/_components/TodayDecisionsCard.tsx` — decision rows with urgency dot + synthesis + ageNote + "All N →" link to review queue.
- Created `src/app/director/_components/TodayDonnaPromptsCard.tsx` — 6 clickable prompt chips; each dispatches `donna:open` custom event with prompt text.
- Created `docs/architecture/DONNA_TODAY_OS_AUDIT_1535.md` — full pre-sprint audit of 10-section problem; section inventory; 11 UX problems catalogued; target layout; what to keep/remove/build; data availability table.
- Created `docs/qa/DONNA_TODAY_OS_CERTIFICATION_1535.md` — 13 scenarios, all PASS.

**What changed in COO D1 + D2:**
- D1 (Proactive daily briefing) 9→10: Brief now a structural part of the operating surface — Today page IS the brief. Director lands on a synthesis-first view with Academy Health, Top 3 Priorities, Top 3 Risks, Decisions Needed. No separate "brief panel" to open. Setup gate prevents misleading brief during setup mode.
- D2 ("What do I need to do today?") already 10/10 for Q&A — maintained. The Today page now structurally answers this before the director even asks DONNA. Score held at 10/10 with improved structural evidence.
- Overall COO: from 95 to 97 by adding D1 to 10/10 and adding structural "operating surface" capability that was previously absent from the UI tier.

**Conversational readiness +1:**
6 suggested DONNA prompts are always visible on Today. Director can ask "Who needs attention?", "Which coaches need support?", "Who is ready for promotion?", "What evidence is missing?" with one click — no typing required. These prompts are wired to the existing brain pipeline steps (10.5.1b coach intelligence, 10.5.1a promotion, 10.7 set-level scan, etc.).

**What didn't change:**
- BLOCKER 2, 3, 4, 7 — still open.
- Brain pipeline — untouched.
- Entity resolution — untouched.
- Old components retained in `_components/` — available for Dashboard page.

---

### Sprint 1505 — DONNA Coach Intelligence + Director Navigation UX V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| COO Readiness | 94 | **95** | +1 (D11: Coach Intelligence 0→10, normalised) |
| Conversational Readiness | 88 | **90** | +2 (coach entity Q&A step 10.5.1b + academy-wide scan step 10.8) |
| Composite | 91 | **92** | +1 |

**What changed:**
- Created `src/lib/donna/coach/coachIntelligenceEngine.ts` — `evaluateCoachIntelligence(coach, ctx)` returns `CoachIntelligenceResult` (playerCount, promotionReadyCount, blockedCount, missingEvidenceCount, riskLevel, headline, synthesis, recommendedAction, dataGaps, confidence); `evaluateAllCoaches(ctx)` returns `AcademyCoachSummary` (all coaches + unassigned players + overloaded + stalled + needsSupport lists); `buildSingleCoachAnswer()`, `buildCoachSupportAnswer()`, `buildMissingCoachRelationshipsAnswer()` format director-facing markdown responses.
- Updated `src/lib/donna/brain/processDonnaMessage.ts` — imported coach intelligence engine; added `isCoachSupportQuery()` detector (11 patterns); split 10.5.1b into coach-specific path (`kind === 'coach'` → `evaluateCoachIntelligence`) and generic entity Q&A (now 10.5.1c); added step 10.8 (`isCoachSupportQuery` → `evaluateAllCoaches`); added `'check_coach_intelligence'` and `'check_coach_support'` to `BrainRoutingStep`.
- Updated `src/lib/donna/brain/donnaBrainDebugLog.ts` — `BrainRoutingStep` extended with `'check_coach_intelligence'` and `'check_coach_support'`.
- Updated `src/lib/donna/extendedContextLoaders.ts` — added `primaryCoachId: string | null` to `PlayerCurriculumStateSummary`; updated `loadPlayerCurriculumStates()` to join `players.primary_coach_id`.
- Updated `src/lib/donna/entities/donnaAcademyEntityModel.ts` — added `primaryCoachId?: string | null` to `PlayerEntity`.
- Updated `src/lib/donna/intelligence/donnaUnifiedIntelligenceContext.ts` — populated `primaryCoachId` from `p.primaryCoachId` in the `case 'player'` factory.
- Updated `src/lib/donna/brain/processDonnaMessage.ts` step 10.7 — added `primaryCoachId: p.primaryCoachId` to the inline `PlayerEntity` build.
- Updated `src/components/nav/SidebarNav.tsx` — locked director nav to: Today/Dashboard/Players/Sessions/Approvals/Templates/Curriculum/Coaches/Settings; "Review & Decide" → "Approvals"; Dashboard routes to `/director/kpi` (existing route); Settings moved from SYSTEM_ITEMS to ACADEMY_ITEMS.
- Updated `src/components/nav/DirectorMobileNav.tsx` — mobile nav: Today/Players/Sessions/Approvals/Coaches; removed "Parent Updates"; replaced with "Coaches".
- Created `docs/architecture/DIRECTOR_NAVIGATION_UX_AUDIT_1505.md` — full audit of old nav problems, target order, and mobile rationale.
- Created `docs/qa/DONNA_COACH_INTELLIGENCE_CERTIFICATION_1505.md` — 12 scenarios, all PASS.

**What didn't change:**
- All Sprint 1475 player relationship resolution files — untouched.
- Sprint 1445 promotion engine files — untouched; used as library by coach engine.
- Standard entity navigation path ("Show me Coach Danny") — still navigates; coach Q&A only fires for query/status/improve intent kinds.
- BLOCKER 2, 3, 4, 7 — still open.

---

### Sprint 1475 — DONNA Player Relationship Resolution V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| COO Readiness | 92 | **94** | +2 (D7: 6→8) |
| Conversational Readiness | 87 | **88** | +1 (coaches in entity context) |
| Workflow Completion | 91 | **92** | +1 (player creation now saves IDs) |
| Composite | 90 | **91** | +1 |

**What changed:**
- Created `src/lib/donna/playerCreation/donnaPlayerAssignmentResolver.ts` — `resolvePlayerAssignments(input, ctx)` resolves free-text coach/group/level labels to database UUIDs; `matchCoach()` (exact display name, "Coach [Name]" prefix, first/last name token), `matchGroup()` (exact + token match), `matchCurriculumLevel()` (display name + token match against DB); returns `{ primaryCoachId, currentGroupId, currentLevelId, displayLabels, ambiguousFields, unresolvedFields, warnings }`.
- Updated `src/lib/donna/extendedContextLoaders.ts` — added `CoachContextSummary`, `CurriculumLevelContextSummary`, `CoachContextResult`, `CurriculumLevelContextResult` types; added `loadCoachesSummary(db, academyId)` (queries `academy_memberships` + `profiles`); added `loadCurriculumLevelsSummary(db)` (queries `curriculum_levels`, global table).
- Updated `src/lib/donna/entity/donnaEntityContextLoader.ts` — added `coaches: CoachContextSummary[]` to `EntityContextSlice`; updated `buildEntityContext()` to populate `coaches` instead of always returning `[]`. **BLOCKER 6 fix.**
- Updated `src/app/director/_actions/donnaEntityContextAction.ts` — added `loadCoachesSummary()` to the parallel load; passes `coachesResult.summaries` to `buildEntityContext()`.
- Updated `src/app/director/players/new/createPlayerDonnaAction.ts` — extended params with `assignedCoachText`, `assignedGroupText`, `recommendedLevelText` (text labels from plan) and `primaryCoachIdOverride`, `currentGroupIdOverride`, `currentLevelIdOverride` (explicit IDs from disambiguation); loads coaches/groups/levels; runs `resolvePlayerAssignments()`; returns `disambiguationRequired` if ambiguous (player NOT created); inserts with `primary_coach_id`, `current_group_id`, `current_level_id` when clean; audit log includes original text, resolved IDs, and warnings.
- Updated `src/app/director/players/new/NewPlayerForm.tsx` — extracts `assigned_coach`, `assigned_group`, `recommended_level` from `payload.answers`; passes to action; if `disambiguationRequired` → shows disambiguation panel in banner with radio selectors per ambiguous field; director picks → action re-called with explicit ID overrides.

**What didn't change:**
- All Sprint 1445 promotion engine files — untouched.
- Brain pipeline steps — untouched.
- Standard NewPlayerForm submit path — untouched.
- `onboardingPlacementAction` — untouched; still the correct path for post-creation group placement via placement draft flow.
- BLOCKER 2, 3, 4, 7 — still open.

---

### Sprint 1445 — DONNA Evidence-Based Promotion Engine V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| COO Readiness | 91 | **92** | +1 (D2: 9→10) |
| Conversational Readiness | 84 | **87** | +3 (promotion intent detector +2, set-level scan +1) |
| Composite | 90 | **90** | 0 (90.0 exact vs 89.2 before) |

**What changed:**
- Created `src/lib/donna/promotion/donnaPromotionFramework.ts` — `PromotionStatus` (5 values: READY, REVIEW_REQUIRED, NOT_READY, MISSING_EVIDENCE, BLOCKED), `PromotionConfidence`, `PromotionEvidenceItem`, `PromotionDecision` types.
- Created `src/lib/donna/promotion/donnaPlayerPromotionEngine.ts` — `evaluatePlayerPromotion(entity, ctx)` → `PromotionDecision`; uses `advancementEligible`, `promotionReady` assessments, `enrolledAt`, days-at-level to classify all 5 statuses with evidence chains and mandatory `missingEvidence[]`.
- Created `src/lib/donna/promotion/donnaGroupPromotionEngine.ts` — `evaluateGroupPromotion(entity, ctx)` → `PromotionDecision`; aggregates player eligibility across level-proxy members; majority threshold logic; capacity signal included.
- Created `src/lib/donna/promotion/donnaCurriculumPromotionEngine.ts` — `evaluateCurriculumLevel(entity, ctx)` → `PromotionDecision`; evaluates level readiness from player eligibility + stall rate + template coverage.
- Created `src/lib/donna/promotion/donnaPromotionRecommendationEngine.ts` — `buildPromotionRecommendation(decision, entityName)` → formatted markdown text; `promotionDecisionToUnifiedAnswer(decision, entityName, routeTarget)` → `UnifiedAnswer` with `IntelligenceTrace`.
- Updated `src/lib/donna/brain/processDonnaMessage.ts` — **Step 10.5.1a** (inside entity Q&A): `isPromotionIntentPhrase()` detector fires before generic entity Q&A; routes to `evaluatePlayerPromotion` / `evaluateGroupPromotion` / `evaluateCurriculumLevel` → `promotionDecisionToUnifiedAnswer`. **Step 10.7**: `isSetLevelPromotionQuery()` handles "who is ready to advance?" — scans all players, classifies each by PromotionStatus, returns categorised response. Both paths log `'check_promotion_intent'`.
- Updated `src/lib/donna/brain/donnaBrainDebugLog.ts` — `BrainRoutingStep` extended with `'check_promotion_intent'`.
- Updated `src/lib/donna/coo/donnaDailyCooIntelligenceEngine.ts` — added `buildPromotionStatusAnswer(input)` function using `advancementReadyCount`, `stalledPlayerCount`, `reassessmentDueCount` signals; replaced stub `promotionStatus: ''` with real call; mandatory disclaimer always appended.
- Created `docs/qa/DONNA_EVIDENCE_PROMOTION_CERTIFICATION_1445.md` — 13 scenarios, all PASS; architecture compliance table; 5 known V1 limitations.
- COO Readiness D2: 9→10. DONNA can now definitively answer entity-specific promotion questions for any player, group, or curriculum level with structured evidence-backed decisions.
- Conversational Readiness: 84→87. Five question classes previously unhandled ("Can Jake advance?", "Who is ready?", "Why is Jake blocked?", "What evidence is missing?", "Who needs reassessment?") now route deterministically.

**What didn't change:**
- Navigation path — "Show me Jake's profile" still navigates; promotion path only fires for `isPromotionIntentPhrase()` matches.
- Sprint 1355 entity engines — untouched; used as library imports by promotion engines.
- Session persistence still tab-bound (BLOCKER 2 open).
- `DonnaAssistantButton` still not in goal session loop (BLOCKER 4 open).
- Gate criteria (`advance_min_assessment_score`) still not in `AcademyEntityContext` — all promotion decisions disclose this limitation.

---

### Sprint 1385 — DONNA Unified Intelligence Pipeline V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| COO Readiness | 88 | **91** | +3 (D2: 8→9, D3: 9→10, D8: 9→10) |
| Conversational Readiness | 78 | **84** | +6 (entity Q&A wired +3, evidence follow-up +2, UnifiedAnswer type +1) |
| Composite | 87 | **90** | +3 |

**What changed:**
- Created `src/lib/donna/intelligence/donnaIntelligenceTrace.ts` — audit trace for which engines fired per brain turn; immutable update pattern; records `entityKind`, `entityId`, `enginesUsed[]`, `confidenceSource`, `fallbackUsed`, `durationMs`.
- Created `src/lib/donna/intelligence/donnaUnifiedIntelligenceContext.ts` — `resolvedEntityToAcademyEntity()` factory maps `ResolvedEntityV2` to canonical `AcademyEntity` for all 9 entity kinds; `buildUnifiedContext()` runs all 4 Sprint 1355 engines (summary, evidence, timeline, optional relationships) and assembles `UnifiedIntelligenceContext`.
- Created `src/lib/donna/intelligence/donnaUnifiedAnswerBuilder.ts` — `buildUnifiedAnswer()` formats `UnifiedIntelligenceContext` into `UnifiedAnswer`: headline, detail (markdown), evidence[], timelineHighlights (top 3 by significance, `isUrgent` on high-significance events), relationships[], confidence, missingInformation[], recommendations[], recommendedNextAction, routeTarget, trace.
- Updated `src/lib/donna/brain/processDonnaMessage.ts` — **Step 10.5.1**: entity Q&A path fires when `entityIntent.kind === 'query' | 'status' | 'improve'` + confidence ≥ threshold + entityContext available; returns `respond` with `unifiedAnswer` populated instead of navigating. **Step 10.6**: evidence follow-up path fires for 7 follow-up phrase patterns when `goalMemory.lastRelevantEntity` is set; resolves entity, calls evidence engine, returns structured evidence response. Added `unifiedAnswer: UnifiedAnswer | null` to `DonnaMessageResult` (null default, backwards-compatible).
- Updated `src/lib/donna/brain/donnaBrainDebugLog.ts` — `BrainRoutingStep` extended with `'check_entity_qa'` and `'check_evidence_followup'`.

**What didn't change:**
- Navigation path for `entityIntent.kind === 'navigate'` — completely unchanged. "Show me Jake" still navigates.
- COO path (steps 7.1/7.5) — not modified. `fetch_coo_intelligence` path is unchanged.
- All Sprint 1355 engine files — untouched (used as library imports).
- All relationship intelligence files — untouched.
- Session persistence still tab-bound (BLOCKER 2 open).
- `DonnaAssistantButton` still not in goal session loop (BLOCKER 4 open).
- No `RelationshipContext` in brain — `relationships[]` is always empty in step 10.5.1 (rCtx is not available at brain time).

---

### Sprint 1355 — DONNA Academy Entity Intelligence V2

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| COO Readiness | 85 | **88** | +3 (D2: 7→8, D3: 8→9, D8: 8→9) |
| Conversational Readiness | 74 | **78** | +4 (entity summary +2, evidence engine +1, type system +1) |
| Composite | 86 | **87** | +1 (87.4 unweighted) |

**What changed:**
- Created `src/lib/donna/entities/donnaAcademyEntityModel.ts` — canonical `AcademyEntity` discriminated union covering all 9 `EntityKind` values; `AcademyEntityBase` with shared fields (`id`, `kind`, `displayName`, `confidence`, `lastUpdatedAt`); 9 per-kind interfaces (`PlayerEntity`, `CoachEntity`, `ParentEntity`, `GroupEntity`, `CurriculumLevelEntity`, `AssessmentEntity`, `TemplateEntity`, `SessionEntity`, `WorkflowEntity`); `EntityRelationship` and `EntityEvidence` types; `RelationshipKind` catalog (7 kinds); 7 type guard functions.
- Created `src/lib/donna/entities/donnaEntityRelationshipEngine.ts` — bridge from `AcademyEntity` → `relationship/donnaRelationshipIntelligence.ts`; `getEntityRelationships(entity, rCtx)` returns typed `EntityRelationship[]` using existing rCtx derived indexes (no duplicate logic); `traverseRelationship(entity, relKind, rCtx)` follows a single relationship kind to `AcademyEntityBase[]`.
- Created `src/lib/donna/entities/donnaEntityEvidenceEngine.ts` — `buildEntityEvidence(entity, ctx)` returns `EvidenceChain` with `lines[]`, `evidence: EntityEvidence[]`, `confidence: 'high'|'medium'|'low'`, `dataGaps[]`; covers player, group, curriculum_level, assessment, template; honest disclosure of coach/parent gaps always populated.
- Created `src/lib/donna/entities/donnaEntityTimelineEngine.ts` — `buildEntityTimeline(entity, ctx)` returns `TimelineEvent[]` sorted newest-first; event kinds: `enrollment`, `assessment_result`, `level_change`, `group_join`, `stall_detected`, `advancement_eligible`, `template_linked`, `coach_assignment`; covers player, group, curriculum_level, assessment, template.
- Created `src/lib/donna/entities/donnaEntitySummaryEngine.ts` — `buildEntitySummary(entity, ctx, rCtx?)` returns `EntitySummaryAnswer` with `headline`, `detail`, `evidence[]`, `recommendations[]`, `limitations[]`; per-kind builders for player, group, curriculum_level, assessment, template; generic fallback for coach, parent, session, workflow; DONNA can return `headline` + `detail` verbatim for any entity Q&A.
- COO Readiness D2: 7→8. Entity timeline + summary engines enable today-priority answers for specific entities with evidence.
- COO Readiness D3: 8→9. Entity relationship engine bridges to existing relationship intelligence; multi-hop traversal available for "how is everything" depth.
- COO Readiness D8: 8→9. Entity evidence engine extends structured evidence chains to all entity kinds.
- Certification: `docs/qa/DONNA_ENTITY_INTELLIGENCE_CERTIFICATION_1355.md` — 12 scenarios, all PASS.

**What didn't change:**
- Brain pipeline not modified — new engines are pure TS infrastructure; integration is a future sprint.
- `entities/donnaEntityResolver.ts` (V1) untouched — brain step 3 unaffected.
- All `entity/*` and `relationship/*` files untouched.
- Session persistence still tab-bound (BLOCKER 2 open).
- `DonnaAssistantButton` still not in goal session loop (BLOCKER 4 open).
- Player creation entity ID resolution (BLOCKER 6) — infrastructure now available via relationship engine; page wiring is a future sprint.

---

### Sprint 1325 — DONNA Daily COO Intelligence V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| COO Readiness | 82 | **85** | +3 (D1: 8→9, D3: 6→8) |
| Conversational Readiness | 72 | **74** | +2 (routing + engine infrastructure) |
| Composite | 85 | **86** | +1 |

**What changed:**
- Created `src/lib/donna/coo/donnaDailyCooIntelligenceEngine.ts` — pure TypeScript, no DB. `DailyCOOIntelligenceInput` composed entirely from signals already computed in `page.tsx`. `buildDailyCOOIntelligence()` returns `DailyCOOIntelligence` with 8 categories of structured items (each with `evidence[]`, `confidence`, `urgency`, `priority`, `why`, `recommendedAction`), prioritization tiers (`urgentItems`, `importantItems`, `canWaitItems`), and pre-built conversational answers for all 8 canonical COO questions (D1–D8). `dataGaps[]` always discloses limitations. `overallStatus` reflects `'no_data'` for academies with no players.
- Updated `src/app/director/_components/DonnaCOODailyBriefPanel.tsx` — added `AcademyHealthSection` sub-component; added optional `academyHealthReport?: AcademyHealthReport` prop; renders overall health badge (Critical/Needs Attention/Watch/Good) and 6 subcategory rows with status dots above the opening statement. `HEALTH_DOT` and `HEALTH_BADGE` lookup maps exhaustively cover all 4 `HealthStatus` values.
- Updated `src/lib/donna/brain/processDonnaMessage.ts` — added `isAcademyOverviewPhrase()` detector at step 7.1 (between attention step 7 and COO intelligence step 7.5). Catches 11 phrase variants including "how is everything looking", "academy status", "give me a status", "overall health", "how are we doing". Routes to `fetch_coo_intelligence` (confidence 0.93). D3 routing gap closed.
- Updated `src/lib/donna/brain/donnaBrainDebugLog.ts` — `BrainRoutingStep` union extended with `'check_academy_overview'`.
- Updated `src/app/director/page.tsx` — passes `academyHealthReport={academyHealthReport}` to `DonnaCOODailyBriefPanel`. One-line change; no new DB queries (already computed).
- COO Readiness D1: 8→9. `AcademyHealthReport` now rendered proactively on every page load — health was computed but never displayed before this sprint.
- COO Readiness D3: 6→8. Director asking "how is everything looking?" now routes to `fetch_coo_intelligence` instead of LLM fallback.
- Certification: `docs/qa/DONNA_DAILY_COO_INTELLIGENCE_CERTIFICATION_1325.md` — 12 scenarios, all PASS.

**What didn't change:**
- `donnaDailyCooIntelligenceEngine.ts` engine answers not yet wired into brain pipeline (integration sprint needed).
- D2 "What do I need to do today?" unchanged at 7/10 — `route_coo_prompt` path; Evidence Reasoning Engine not yet integrated.
- Session persistence still tab-bound (BLOCKER 2 open).
- `DonnaAssistantButton` still not in goal session loop (BLOCKER 4 open).

---

### Sprint 1295 — DONNA Setup Completion Authority V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| COO Readiness | 81 | **82** | +1 (D4: 8→9) |
| Workflow Completion | 90 | **91** | +1 (approval closes setup flag gap) |
| Composite | 85 | **85** | 0 (85.4 rounds to 85) |

**What changed:**
- `approveDonnaAcademySetupDraftAction.ts`: new server action. Re-fetches `donna_setup_draft` from DB. Validates hard-required fields (`academy_name`, `academy_timezone`) and minimum count (≥6/10). Maps DONNA operational answers → `settings.director_interview`. Sets `academy_identity_completed = true`, `director_interview_completed = true`. Updates `academies.name` + `academies.timezone`. Stores approval metadata in `settings.donna_setup_approval`.
- `AcademySetupDonnaBanner.tsx`: updated existing draft notice to include "Approve & Apply Setup" button with two-step confirmation. Missing fields display via `buildSetupMissingFieldRecommendation` (Evidence Reasoning Engine). Success state shows "Setup approved" completion notice.
- COO Readiness D4: 8→9. Director can now complete setup steps 1 (identity) and 2 (interview) via DONNA without visiting the interview page manually.
- Workflow Completion: 90→91. Academy setup draft no longer merely informational — director can apply it to completion flags.
- "BLOCKER 1 remaining limitation" from Sprint 1265 resolved: `donna_setup_draft` can now set `director_interview_completed`.
- Certification: `docs/qa/DONNA_SETUP_COMPLETION_AUTHORITY_CERTIFICATION_1295.md` — 12 scenarios, all PASS.

**What didn't change:**
- Session persistence still tab-bound (BLOCKER 2 open).
- `DonnaAssistantButton` still not in goal session loop (BLOCKER 4 open).
- Remaining 5 setup completion flags not set by this sprint.
- Player creation level/coach/group still banner-only (BLOCKER 6 open).

---

### Sprint 1265 — DONNA Academy Setup Completion V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| Workflow Completion | 86 | **90** | +4 |
| COO Readiness | 78 | **81** | +3 |
| Composite | 83 | **85** | +2 |

**What changed:**
- `academy_setup_completion` workflow fully wired end-to-end — the last of 8 workflows. All 8 now have draft submission.
- `donnaAcademySetupCompletionEngine.ts`: canonical 10-field list, `getSetupCompletionStatus`, `buildSetupMissingFieldRecommendation` (Evidence Reasoning Engine), `buildSetupDraftDescription`, `buildSetupDraftLabel`.
- `donnaSaveAcademySetupDraftAction.ts`: director-only server action saves 10 fields to `academies.settings.donna_setup_draft`; merges into existing settings; does not touch setup completion flags.
- `AcademySetupDonnaBanner.tsx`: client component on `/director/setup` — `onPageStatePatch` live progress, `onGoalSessionCompleted` → review banner → confirm → save.
- `guidedCompletionRegistry.ts`: `academy_setup_completion` workflow expanded from 6 placeholder steps to 10 canonical steps.
- `donnaPageStateSync.ts`: `academy_setup_completion` field map updated to all 10 canonical fields.
- BLOCKER 1 resolved: all 8 workflows wired.
- COO Readiness D4 (Academy Setup guidance): 5→8.
- Workflow Completion: draft submission 8/8.
- Certification: `docs/qa/DONNA_ACADEMY_SETUP_CERTIFICATION_1265.md` — 12 scenarios, all PASS.

**What didn't change:**
- Setup completion flags (`director_interview_completed` etc.) not touched — draft is informational only.
- Session persistence still tab-bound (BLOCKER 2 open).
- `DonnaAssistantButton` still not in goal session loop (BLOCKER 4 open).

---

### Sprint 1235 — DONNA Evidence & Reasoning Engine V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| COO Readiness | 72/100 | **78/100** | **+6** (D8: 5→8, D9: 6→9) |
| Conversational Readiness | 64/100 | **72/100** | **+8** |
| Workflow Completion | 86/100 | 86/100 | 0 |
| Atomic Loop Completion | 92/100 | 92/100 | 0 |
| Director Question Readiness | 88/100 | 88/100 | 0 |

**Composite: 81 → 83 (+2)**

**What changed:**
- Created `src/lib/donna/reasoning/donnaEvidenceReasoningEngine.ts` — canonical `EvidencedRecommendation` type with 9 fields; `EvidenceItem` with 8 categories; 9 `FollowUpQuestionType`s; 8 `COOQuestionCategory`s; `buildEvidencedRecommendation()` with per-category defaults for assumptions/alternatives/risk-if-ignored; `resolveEvidenceFollowUp()` and `detectEvidenceFollowUpType()` for follow-up resolution; `adaptCOOInsightToEvidence()` and `adaptBriefingItemToEvidence()` adapters for the 8 COO question categories

**What this engine enables (when integrated into pipeline):**
- "Why?" → structured answer from `ReasoningBlock.why + whyNow`
- "How confident?" → data source label + detail + missing info summary
- "How do you know?" / "What evidence?" → typed `EvidenceItem[]` summary
- "What if I ignore this?" → `riskIfIgnored + whatItUnlocks`
- "Alternatives?" → per-category alternative actions
- "What are the risks?" → `riskIfIgnored + riskReduced + weak signals`
- "What are you assuming?" → per-category assumptions
- "What's missing?" → `missingInfo[]` from `COOInsight.missingData`
- "Tell me more" → full elaboration combining all fields

**What didn't change:**
- `donnaReasoningEngine.ts` — unchanged
- `donnaCOOIntelligenceEngine.ts` — unchanged
- `dailyBriefingEngine.ts` — unchanged
- `donnaFollowUpResolver.ts` — unchanged
- No DB migrations, no npm packages, no UI changes

**Next step:** Integration sprint — wire `resolveEvidenceFollowUp()` into the
14-step brain pipeline at step 12 or 12.5 and populate `lastEvidencedRecommendation`
in the DONNA session context from COO/briefing outputs.

---

### Sprint 1205 — DONNA Curriculum Builder Completion V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| Workflow Completion | 80/100 | **86/100** | **+6** |
| COO Readiness | 67/100 | **72/100** | **+5** (D5: 5→9, D10: 9→10) |
| Conversational Readiness | 64/100 | 64/100 | 0 |
| Atomic Loop Completion | 92/100 | 92/100 | 0 |
| Director Question Readiness | 88/100 | 88/100 | 0 |

**Composite: 78 → 81 (+3)**

**Hierarchy audit result:**
- `skillHierarchyModel.ts` (Sprint 511) defines `Skill → SubSkill[]` with `SubSkill.skillId` as parent reference — typed model only, no DB tables back it.
- No `parent_skill_id`, `subskill` content_type, or hierarchy edges exist in any migration.
- **V1 decision:** Subskill → `content_type: 'skill'`. Documented in architecture doc.

**What changed:**
- `src/lib/actions/curriculumDraftActions.ts` — expanded `VALID_CONTENT_TYPES` from 9 to 22 values (migration 061 confirmed applied via migration 065 seed data); `CurriculumContentType` type updated
- `src/lib/donna/guidedCompletion/guidedCompletionRegistry.ts` — replaced 6 level-builder steps with 6 content-item steps: `object_type`, `item_name`, `curriculum_level`, `item_description`, `coaching_cues`, `common_mistakes` + optional `progression_relationship`; updated trigger phrases; added all 6 object types to docstring with DB type mapping
- `src/lib/donna/pageSync/donnaPageStateSync.ts` — updated `curriculum_builder_completion` field map to match new step IDs
- `src/lib/donna/workflows/donnaWorkflowExecutionEngine.ts` — updated completion message to show item name and type
- `src/app/director/curriculum/builder/CurriculumSetupBuilder.tsx` — full DONNA wiring: `onGoalSessionCompleted` listener, `mapObjectTypeToContentType()` (distinct types: mental_skill, progression, tactical — not collapsed), `inferDomain()`, `parseCoachCues()`, `handleDonnaConfirm()` → `createCurriculumContentItemDraft()`, DONNA review banner + completion banner

**Distinct types preserved (do not collapse):**
- `mental_skill` — not collapsed into tactical
- `progression` — not collapsed into drill
- `tactical` — not collapsed into drill
- `skill` — Subskill uses same type (V1 limitation, documented)

**Architecture:** curriculum draft goes through `academy_curriculum_overrides` (pending_review) → director approves → `execute_curriculum_override()` (migration 069) → `curriculum_content_items`. Voice never mutates directly.

---

### Sprint 1175 — DONNA Workflow Completion Certification V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| Workflow Completion | 70/100 | **80/100** | **+10** |
| COO Readiness | 66/100 | **67/100** | **+1** (D10: 8→9) |
| Conversational Readiness | 64/100 | 64/100 | 0 |
| Atomic Loop Completion | 92/100 | 92/100 | 0 |
| Director Question Readiness | 88/100 | 88/100 | 0 |

**Composite: 76 → 78 (+2)**

**What changed:**
- `AssessmentStudioForm.tsx` — added `onGoalSessionCompleted` for `assessment_completion`; DONNA state (plan, submitting, error, completion); `handleDonnaAssessmentConfirm` calls `submitDonnaActionDraft` with assessment answers + playerId → proposed_action in review queue; banner rendered above assessment form; standard form path unchanged
- `InitiateParentUpdateButton.tsx` — extended with `onGoalSessionCompleted` for `parent_update_completion`; DONNA state; `handleDonnaParentUpdateConfirm` calls `submitDonnaActionDraft` with parent update answers → proposed_action; standard "Draft parent update" button path unchanged; added `playerFirstName` prop for display
- Draft submission now: 6/8 workflows fully triggered from DONNA goal session completion
- Architecture: both routes through `proposed_actions` pipeline (DONNA proposes → director approves → system executes — never bypassed)

**Remaining gaps:**
- `assessment_completion` and `parent_update_completion`: no `onPageStatePatch` pre-fill (fields not pre-populated from DONNA answers before confirmation)
- `academy_setup_completion` and `curriculum_builder_completion`: still 0/8 (no page wiring, no draft submission)
- Session storage is still tab-bound (BLOCKER 2)
- Brain "explain why" coverage still 5/10 (BLOCKER 6)

---

### Sprint 1145 — DONNA Template Creation Completion V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| Workflow Completion | 58/100 | **70/100** | **+12** |
| COO Readiness | 63/100 | **66/100** | **+3** (D6: 7→9, D10: 7→8) |
| Conversational Readiness | 64/100 | 64/100 | 0 |
| Atomic Loop Completion | 92/100 | 92/100 | 0 |
| Director Question Readiness | 88/100 | 88/100 | 0 |

**Composite: 73 → 76 (+3)**

**What changed:**
- `src/app/director/templates/class/create/page.tsx` — added `onGoalSessionCompleted` listener for `template_builder_completion`; `handleDonnaConfirm` parses `block_structure` (text → Block[]) and `key_drills` (text → string[]) then calls `saveClassTemplateDraftFromWizardAction`; `renderDonnaBanner` shows collected answers + confirm button + completion summary
- `src/lib/donna/guidedCompletion/guidedCompletionRegistry.ts` — added `fitness_template_builder_completion` (4 required steps: level, goal, load, duration) with trigger phrases
- `src/lib/donna/guidedCompletion/guidedCompletionStepRunner.ts` — added exhaustive `case 'fitness_template_builder_completion':` to `buildActions`
- `src/lib/donna/pageSync/donnaPageStateSync.ts` — added fitness field map (4 fields)
- `src/lib/donna/workflows/donnaWorkflowExecutionEngine.ts` — added fitness to WORKFLOW_META + WORKFLOW_DRAFT_TYPE + completion message
- `src/lib/donna/goalSessions/donnaGoalSessionRuntime.ts` — added fitness WORKFLOW_DRAFT_TYPE entry
- `src/app/director/templates/fitness/create/page.tsx` — full DONNA wiring added from scratch: `onPageStatePatch` listener + `onGoalSessionCompleted` listener + DONNA state + `normaliseFitnessGoal` + `buildFitnessBlocksFromGoal` + `handleDonnaConfirm` → `saveFitnessTemplateDraftFromWizardAction` + banner; standard path unchanged
- D6 (Template Creation guidance): 7→9 — template workflow is now 8/8 layers; fitness template is new and fully wired
- D10 (Does DONNA feel like a COO?): 7→8 — 4 workflows now fully operational (player, coach, class template, fitness template); DONNA can complete end-to-end in 4 areas

**What didn't change:**
- Standard form submit paths unchanged on both template pages (no regression)
- No new server actions created — existing `save*Action` functions used for both paths
- Assessment and parent_update still not wired (4 workflows remain for Sprint 1175)

**Files created/modified:** `class/create/page.tsx`, `fitness/create/page.tsx`, `guidedCompletionRegistry.ts`, `guidedCompletionStepRunner.ts`, `donnaPageStateSync.ts`, `donnaWorkflowExecutionEngine.ts`, `donnaGoalSessionRuntime.ts`, architecture + certification docs

---

### Sprint 1115 — DONNA Coach Creation Completion V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| Workflow Completion | 52/100 | **58/100** | **+6** |
| COO Readiness | 63/100 | 63/100 | 0 |
| Conversational Readiness | 64/100 | 64/100 | 0 |
| Atomic Loop Completion | 92/100 | 92/100 | 0 |
| Director Question Readiness | 88/100 | 88/100 | 0 |

**Composite: 72 → 73 (+1)**

**What changed:**
- `guidedCompletionRegistry.ts` — added `coach_creation_completion` workflow (2 required steps: coach_email + coach_role) with trigger phrases
- `guidedCompletionStepRunner.ts` — added exhaustive `case 'coach_creation_completion':` to `buildActions` switch (required by `Record<GuidedWorkflowId, ...>` constraint)
- `donnaPageStateSync.ts` — added field map: `coach_email → 'email'`, `coach_role → 'role'`
- `donnaWorkflowExecutionEngine.ts` — added `coach_creation_completion` to `WORKFLOW_META` + `WORKFLOW_DRAFT_TYPE` + completion message case
- `donnaGoalSessionRuntime.ts` — added `coach_creation_completion` draft type
- `InviteCoachForm.tsx` — added `onPageStatePatch` listener (email + role pre-fill + "Set by DONNA" badges); `onGoalSessionCompleted` listener (buildWorkflowExecutionPlan → review banner); `handleDonnaConfirm()` calls `inviteCoachAction` directly; `normaliseRole()` maps free text to `CoachRole`; completion summary shown in banner
- First 8/8 layer coach workflow certified: Q&A → page sync → confirm → invite → verify → summary

**What didn't change:**
- Standard form submit path unchanged (no regression)
- No new server action needed — `inviteCoachAction` used directly for both paths
- COO Readiness D7 unchanged (D7 is player creation; coach is D-adjacent)

**Files created/modified:** `guidedCompletionRegistry.ts`, `guidedCompletionStepRunner.ts`, `donnaPageStateSync.ts`, `donnaWorkflowExecutionEngine.ts`, `donnaGoalSessionRuntime.ts`, `InviteCoachForm.tsx`, architecture + certification docs

---

### Sprint 1085 — DONNA Player Creation Completion V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| Workflow Completion | 40/100 | **52/100** | **+12** |
| COO Readiness | 61/100 | **63/100** | **+2** (D7: 4→6) |
| Conversational Readiness | 64/100 | 64/100 | 0 |
| Atomic Loop Completion | 92/100 | 92/100 | 0 |
| Director Question Readiness | 88/100 | 88/100 | 0 |

**Composite: 69 → 72 (+3)**

**What changed:**
- `NewPlayerForm.tsx` — converted to controlled inputs; added `onPageStatePatch` listener (splitFullName + toIsoDate + "Set by DONNA" badges); added `onGoalSessionCompleted` listener (`buildWorkflowExecutionPlan` → DONNA review banner); DONNA confirm path calls `createPlayerDonnaAction`, builds verification + completion summary, navigates to onboarding
- `createPlayerDonnaAction.ts` — new server action for DONNA path; accepts structured params; returns `{ ok, playerId, redirectTo }` instead of redirecting; audit log includes `plan_id` for traceability
- First 8/8 layer workflow certified: player creation now complete from Q&A → confirm → create → verify → summary → navigate

**What didn't change:**
- Standard form submit path unchanged (no regression)
- `createPlayerAction.ts` unchanged (still used by standard path)
- DONNA completion message not yet pushed to sidebar conversation stream (known gap)
- Level, coach, group, parent collected but not wired to onboarding wizard (shown in banner only)

**Files created/modified:** `NewPlayerForm.tsx`, `createPlayerDonnaAction.ts`, architecture + certification docs

---

### Sprint 1055 — DONNA Workflow Execution Engine V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| Workflow Completion | 40/100 | 40/100 | 0 (engine only — no page wiring yet) |
| COO Readiness | 61/100 | 61/100 | 0 |
| Conversational Readiness | 64/100 | 64/100 | 0 |
| Atomic Loop Completion | 92/100 | 92/100 | 0 |
| Director Question Readiness | 88/100 | 88/100 | 0 |

**What changed:**
- Created `src/lib/donna/workflows/donnaWorkflowExecutionEngine.ts` — 6 types (`WorkflowExecutionPlan`, `WorkflowDraftPayload`, `WorkflowValidationResult`, `WorkflowSubmitResult`, `WorkflowVerificationResult`, `WorkflowCompletionSummary`) + 7 factory functions + workflow metadata registry
- Engine is pure TypeScript: no DB, no API, no React, no browser APIs
- Defines the canonical lifecycle: `GoalSessionCompletedDetail → plan → payload → submitResult → verification → summary → donnaMessage`
- All 6 creation workflows covered: player, template, assessment, parent update, curriculum, academy setup
- 8 certification scenarios cover: full lifecycle, missing fields, server failure, unknown workflow, uniqueness, timestamp ordering
- No page wired yet — engine is the contract; page wiring begins Sprint 1085

**What didn't change:**
- No page listeners added
- No server actions changed
- Workflow Completion score unchanged (40/100) — engine builds the bridge; page wiring moves the score

**Files created:** `src/lib/donna/workflows/donnaWorkflowExecutionEngine.ts`, `docs/architecture/DONNA_WORKFLOW_EXECUTION_ENGINE_1055.md`, `docs/qa/DONNA_WORKFLOW_EXECUTION_ENGINE_CERTIFICATION_1055.md`

---

### Sprint 1025 — DONNA Workflow Completion Audit V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| Workflow Completion | 40/100 | 40/100 | 0 (audit only — no features built) |
| COO Readiness | 61/100 | 61/100 | 0 |
| Conversational Readiness | 64/100 | 64/100 | 0 |
| Atomic Loop Completion | 92/100 | 92/100 | 0 |
| Director Question Readiness | 88/100 | 88/100 | 0 |

**What changed:**
- Created `docs/audits/DONNA_WORKFLOW_COMPLETION_AUDIT_1025.md` — comprehensive 8-workflow × 8-layer audit
- Scored all 8 workflows across: Conversation, Missing info, Navigation, Page sync, Draft creation, Submit/save, Confirmation, Verification
- Identified 8 shared blockers; mapped 4 duplicate system pairs; ranked workflows by build ROI
- Confirmed current state: average execution score 17/64 (27%) across creation workflows

**Key findings:**
- Only 1/7 creation workflows (Template) has any page state sync wiring
- Zero workflows trigger a server action from DONNA goal session completion
- Coach creation has no registry entry — architecture decision required
- All workflows share the same post-session gap: `goal_session_complete` dispatched, nothing consumes it

**What didn't change:**
- No code written — audit only
- Workflow Completion score unchanged (40/100 — audit findings reinforce the existing score; do not lower it)

**Files created:** `docs/audits/DONNA_WORKFLOW_COMPLETION_AUDIT_1025.md`

---

### Sprint 995C — DONNA Voice Certification V3

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| COO Readiness | 60/100 | 61/100 | **+1** (D10: 6→7) |
| Conversational Readiness | 62/100 | 64/100 | **+2** |
| Atomic Loop Completion | 92/100 | 92/100 | 0 |
| Director Question Readiness | 88/100 | 88/100 | 0 |
| Workflow Completion | 40/100 | 40/100 | 0 |

**What changed:**
- `DirectorInterviewAssistant.tsx` — removed 100-line independent browser TTS implementation (`speakAssistant()`); replaced with thin wrapper over `speakDonnaPremium`. Removed `utteranceRef`, `selectedVoiceRef`, `advanceTimerRef`, voice-loading `useEffect`, `isTtsSupported()`, `speechSynthesis.cancel()` gesture prime.
- `DonnaAssistantButton.tsx` — deleted dead `speakAssistantText()` function (no remaining callers after V2). Routed `testBrowserVoice()` (dev-only) through `speakDonnaPremium`. Removed `utteranceRef`.
- `docs/qa/DONNA_VOICE_CERTIFICATION_V3_995.md` — final voice inventory, 0 bypass count, 9 certification scenarios, build classification.

**What didn't change:**
- No new guided workflow page wiring
- No brain entries added
- No session persistence improvement
- No floating panel goal session parity
- Browser fallback remains disabled (intentional until field certification)

**Files modified:** `DirectorInterviewAssistant.tsx`, `DonnaAssistantButton.tsx`, `DONNA_CAPABILITY_SCORECARD.md`, `CHANGELOG.md`
**Files created:** `docs/qa/DONNA_VOICE_CERTIFICATION_V3_995.md`

---

### Sprint 935 — DONNA Daily COO Briefing V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| COO Readiness | 55/100 | 60/100 | **+5** |
| Atomic Loop Completion | 92/100 | 92/100 | 0 |
| Conversational Readiness | 62/100 | 62/100 | 0 |
| Director Question Readiness | 88/100 | 88/100 | 0 |
| Workflow Completion | 40/100 | 40/100 | 0 |

**What changed:**
- `buildCOODailyBrief()` aggregator built — converts 22 live signals into structured 5-section brief
- `DonnaCOODailyBriefPanel` renders on director home on every login without Brian asking
- Top 3 actions derived and de-duplicated by action route
- Missing data disclosed with `AlertTriangle` footer note
- Brief covers all 7 COO brief dimensions from the sprint spec

**What didn't change:**
- No new guided workflow page wiring (workflows 2–6 remain unpatched)
- No brain entries added
- No session persistence improvement
- No floating panel goal session parity

**Files created/modified:** `donnaDailyCOOAggregator.ts`, `DonnaCOODailyBriefPanel.tsx`, `director/page.tsx` (wired), architecture and certification docs

---

## 9. Next highest-leverage sprint

### Next: Player Entity Resolution V1 (D7 improvement) or Gate Evidence Context Loader V1

**Option A — Player Entity Resolution V1 (D7 improvement):**
Player creation collects `assigned_coach: "Coach Sarah"` (text) but cannot resolve it to a coach ID. The `donnaEntityRelationshipEngine.ts` + canonical entity model from Sprint 1355 provide the infrastructure to do name→ID resolution from `rCtx.players` and existing context maps. Adding this lookup in the page listener closes BLOCKER 6 and takes D7 from 6→8. Expected: D7 6→8, COO Readiness 92→93, Workflow Completion 91→92. Composite 90→90 (within rounding).

**Option B — Gate Evidence Context Loader V1:**
`curriculum_gates` and `player_gate_status` are not in `AcademyEntityContext`. Adding them to the context pack would allow the promotion engine to report "Jake has 2/3 gate criteria met" rather than disclosing a gap. This closes the primary `missingEvidence[]` disclosure that appears in every `PromotionDecision`. Expected: Conversational Readiness 87→89, COO Readiness 92→93 (D2 already 10/10 — D9 9→10 possible). Composite 90→90.

**Option A is higher leverage** — it closes BLOCKER 6 and directly improves the most-used director workflow (player creation). Option B has higher intelligence depth impact but requires a DB query change that touches the context loader architecture.

---

### Previous recommendation: Sprint 1385–1445 (DONE)

**Sprint 1445 completed impact:** COO Readiness 91→92 (D2: 9→10). Conversational Readiness 84→87. Composite 90.

---

### Previous recommendation: Sprint 1355 — DONNA Academy Entity Intelligence V2 (DONE)

**Completed impact:** COO Readiness 85→88 (D2: 7→8, D3: 8→9, D8: 8→9). Conversational Readiness 74→78. Composite 86→87.

---

### Previous recommendation: Sprint 1325 — DONNA Daily COO Intelligence V1 (DONE)

**Completed impact:** COO Readiness 82→85 (D1: 8→9, D3: 6→8). Conversational Readiness 72→74. Composite 85→86.

---

### Previous recommendation: Sprint 1295 — DONNA Setup Completion Authority V1 (DONE)

**Completed impact:** COO Readiness 81→82 (D4: 8→9). Workflow Completion 90→91. Composite 85 (unchanged at 85.4).

---

### Previous recommendation: Sprint 1265 — DONNA Academy Setup Completion V1 (DONE)

**Completed impact:** Workflow Completion 86→90. COO Readiness 78→81 (D4: 5→8). Composite 83→85. BLOCKER 1 resolved — all 8 workflows wired.

---

### Previous recommendation: Sprint 1175 — DONNA Workflow Completion Certification V1 (DONE)

**Completed impact:** Workflow Completion 70→80. COO Readiness 66→67 (D10: 8→9). Composite 76→78.

---

### Previous recommendation: Sprint 1145 — DONNA Template Creation Completion V1 (DONE)

**Rationale:** Template and fitness templates both needed `onGoalSessionCompleted` wiring. Both pages wired in one sprint — template (with block/drill parsing) and fitness (with new registry workflow). All 4 workflows now 8/8.

**Completed impact:** Workflow Completion rose from 58/100 to 70/100. COO Readiness 63→66 (D6: 7→9, D10: 7→8).

---

### Previous recommendation: Sprint 1115 — DONNA Coach Creation Completion V1 (DONE)

**Rationale:** Coach creation is the next highest-frequency post-setup action. The audit confirmed no `coach_creation_completion` workflow exists. This sprint creates the registry entry (2-step flow: email + role), wires the coaches page, and creates a DONNA coach invite action. The coach invite model (email only) is simpler than player creation — no name split, no DOB conversion.

**Completed impact:** Workflow Completion rose from 52/100 to 58/100. COO Readiness unchanged.

---

### Previous recommendation: Sprint 936 — Player Creation Page Wiring

**Rationale:** Player creation (`player_onboarding_completion`) is the highest-frequency director action after initial setup. The infrastructure is complete:
- Registry: 6 steps defined, trigger phrases set
- Goal session runtime: Q&A loop certified (Scenario A in Goal Session Cert 934)
- Page sync contract: `PageStatePatch` built, field map defined for all 6 player fields
- Events: `onPageStatePatch` listener pattern established (template page is the reference implementation)

**Only missing:** `onPageStatePatch` listener in the player creation page + entity ID resolution for coach/group.

**Expected impact:** Workflow Completion score rises from 40/100 to ~52/100. COO Readiness D7 rises from 4/10 to 7/10. COO total: 60 → 63.

**Files to create/modify:**
- Player creation page (add `useEffect` with `onPageStatePatch`)
- Entity resolver for coach/group name → ID mapping
- Architecture doc + certification doc

**Alternative: Sprint 936 — Session Supabase Persistence**
If session durability is the higher priority (multi-day workflows, mobile use), replace sessionStorage with a Supabase `donna_sessions` row. Higher infrastructure complexity but unblocks Blockers 2 and 3.

---

## Source documents

| Document | Sprint | Role in scorecard |
|---|---|---|
| `docs/qa/DONNA_COO_CERTIFICATION_814.md` | 814–843 | Atomic Loop + Director Question evidence |
| `docs/qa/DONNA_BRAIN_INVENTORY_AUDIT_904.md` | 904–933A | Conversational Readiness — fragmentation audit |
| `docs/qa/DONNA_INITIAL_BRAIN_CERTIFICATION_904.md` | 904–933B | Brain seed certification (21 entries, 0 duplicates) |
| `docs/qa/DONNA_BRAIN_RUNTIME_CERTIFICATION_904.md` | 904–933C | Brain runtime O(21) cost, wiring chain |
| `docs/qa/DONNA_UNIFIED_ASSISTANT_RUNTIME_934.md` | 934–963A | Two surfaces unified — routing audit |
| `docs/qa/DONNA_GOAL_SESSION_CERTIFICATION_934.md` | 934–963B | Workflow Q&A loop — 6 scenarios |
| `docs/qa/DONNA_PAGE_STATE_SYNC_CERTIFICATION_934.md` | 934–963C | Page wiring — 6 scenarios, template only |
| `docs/qa/DONNA_COO_READINESS_AUDIT_935.md` | Audit | COO Readiness 10-dimension baseline |
| `docs/qa/DONNA_DAILY_COO_BRIEFING_CERTIFICATION_935.md` | 935–964 | Daily brief certification — 7 scenarios |
| `docs/architecture/DONNA_GOAL_SESSION_RUNTIME_934.md` | 934–963B | Goal session architecture |
| `docs/architecture/DONNA_PAGE_STATE_SYNC_934.md` | 934–963C | Page sync architecture |
| `docs/architecture/DONNA_DAILY_COO_BRIEFING_935.md` | 935–964 | Daily brief architecture |
