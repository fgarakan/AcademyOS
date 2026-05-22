# Sprint 620 — DONNA Full COO Readiness Audit V1

**Date:** 2026-05-22
**Sprint:** 620
**Auditor:** Architecture audit — no runtime changes, no migrations, no new actions.

---

## Executive Summary

DONNA has strong architectural foundations: a 37-action registry, a complete safety boundary system, a well-built review queue, and a live context aggregator. However, most of this infrastructure is not surfaced to the director. **DONNA is not yet usable as a COO-level operating assistant.** It is a capable back-end platform that has not yet been connected to the front end where directors actually work.

**The single biggest gap:** A director who opens AcademyOS and types "What should I focus on today?" from the main dashboard gets no DONNA response. A director who asks "Why is attendance low?" from the KPI dashboard gets no DONNA response. A director asking anything on 11 of 26 routes gets no DONNA response at all. The intent classifier handles 9 keyword categories — it cannot process natural language questions outside those categories.

DONNA as built is a command receiver, not a conversational COO assistant. Reaching 10/10 requires closing the gap between the library (fully built) and the UI (mostly unwired).

---

## Overall COO Readiness Score

| Dimension | Score | Assessment |
|---|---|---|
| **Overall COO Readiness** | **4 / 10** | Partially ready |
| Route Connectivity | 4 / 10 | Avg 4.1 across 26 routes; 11/26 at score 1 |
| KPI Fluency | 2 / 10 | kpiExplainer.ts exists but not wired to anything |
| Conversational Quality | 3 / 10 | Keyword-only intent, no NLU, no cross-page context |
| Review/Approval Safety | 7 / 10 | Well-built review queue; two approval path gaps |
| Parent/Player Safety | 8 / 10 | Strong library-level boundaries; testing gap |
| Voice Readiness | 3 / 10 | Stops on silence; no persist, no transcript edit |
| Mobile Usability | 3 / 10 | Desktop-only layout; DONNA shell not mobile-adapted |

**Score scale:** 0–3 = not ready · 4–6 = partially ready · 7–8 = pilot usable · 9 = premium V1 · 10 = category-defining

---

## 1. DONNA Architecture Audit

### What exists

| Component | File | Status |
|---|---|---|
| Action type taxonomy | `directorActionTypes.ts` | Complete — 8 action classes, 24 domains, 4 status types |
| Universal action registry | `directorActionRegistry.ts` | Complete — 37 actions registered |
| Policy evaluation | `directorActionPolicy.ts` | Complete — coverage scoring, visibility risk, approval queries |
| Route coverage registry | `directorCoverageRegistry.ts` | Complete — 26 routes scored with missing context/actions |
| Director context aggregator | `directorDonnaContext.ts` | Complete — loads sessions, reviews, wrap-ups, attention items, risks |
| Gateway (rate limit, kill switch) | `donnaGateway.ts` | Complete — 3-layer gate on all AI actions |
| Intent classifier | `donnaIntentClassifier.ts` | Partial — keyword-only, 9 categories |
| Role boundaries | `donnaRoleBoundaries.ts` | Partial — director/coach split only; no sub-role boundaries |
| KPI explainer | `kpiExplanations/kpiExplainer.ts` | Complete — 12 KPIs; not wired to any page |
| Action preview | `actionPreview/actionPreviewCards.ts` | Exists |
| Clarifying questions | `wrapUpClarifyingQuestions.ts`, `donnaWrapUpQuestions.ts` | Exists — wrap-up specific only |
| NBA engine | `donnaNBAEngine.ts` | Exists |
| COO answer engine | `donnaCOOAnswerEngine.ts` | Exists |
| Trust boundary validator | `donnaTrustBoundaryValidator.ts` | Exists |
| Boundary responses | `donnaBoundaryResponses.ts` | Exists |
| Session memory | `donnaSessionMemory.ts`, `donnaChatSessionMemory.ts` | Exists — in-memory only, not persistent across pages |
| Review queue queries | `approvalCenterQueries.ts`, `approvalContextBuilder.ts` | Exists |
| Multi-step flow | `donnaMultiStepFlow.ts` | Exists |
| Audit trail | `donnaAuditTrail.ts`, `donnaAuditHelpers.ts` | Exists |
| Voice dictation | `useVoiceDictation.ts` | Exists — browser SpeechRecognition; continuous=false |
| TTS output | `useSpeechOutput.ts` | Exists |

### What does NOT exist

| Missing | Impact |
|---|---|
| NLU / AI intent classification | All director questions must match a keyword — strategic questions return `unknown` |
| Cross-page session context | Director loses DONNA context on every navigation |
| DONNA chat shell on any route except /director/donna | 25 of 26 routes cannot receive a text question |
| KPI trend attribution | No "why did this change?" logic exists |
| Drill / mission / badge draft server actions | 3 high-demand curriculum actions have no backend |
| Licensing health backend model | Entire licensing domain has no data source |
| Mobile-adapted DONNA UI | Director portal is desktop-only |

### Action registry coverage

| Status | Count | % |
|---|---|---|
| `implemented_and_wired` | 8 | 22% |
| `partially_implemented` | 9 | 24% |
| `implemented_not_wired` | 7 | 19% |
| `registry_only` | 11 | 30% |
| `unsafe_to_automate` | 1 | 3% |
| `blocked_by_permissions` | 1 | 3% |
| **Total** | **37** | |

**22% of actions are fully wired.** 54% have some implementation but no UI entry point. 30% are documented aspirations with no backend.

---

## 2. Director Route Audit Summary

See `docs/DONNA_ROUTE_CONNECTIVITY_SCORECARD_620.md` for per-route detail.

| Tier | Routes | Count |
|---|---|---|
| Fully connected (≥8) | /director/review, /director/onboarding/interview, /director/donna, /director/review/[actionId] | 4 |
| Well connected (6–7) | /director/command-center, /director/today, /director/players/[playerId], /director/curriculum, /director/sessions/[sessionId], /director/templates/class/[templateId] | 6 |
| Partially connected (3–5) | /director/fitness/templates/[templateId], /director/level-up, /director, /director/templates | 4 |
| Weak / not connected (≤2) | /director/placement + 11 others | 12 |

**Route average: 4.1 / 10. 42% of routes (11/26) score 1 — not connected.**

---

## 3. KPI Audit Summary

See `docs/DONNA_KPI_FLUENCY_AUDIT_620.md` for detail.

- 12 KPIs defined in `academyKpiModel.ts` and explained in `kpiExplainer.ts`
- Zero KPIs are wired to DONNA entry points on any director page
- `/director/kpi` scores 1 in the coverage registry — no DONNA presence
- The KPI dashboard shows only 2 signals (attendance, time-in-level), not the 12-KPI model
- DONNA cannot answer "why did this change?" for any KPI

---

## 4. Conversational Quality Audit Summary

See `docs/DONNA_CONVERSATIONAL_GAP_ANALYSIS_620.md` for detail.

| Question category | DONNA can handle today? |
|---|---|
| "What does this page mean?" | Partial — only on /director/donna and /director/today |
| "What should I do here?" | Partial — only on /director/donna |
| "What needs my attention today?" | Yes — on /director/donna only |
| "Explain this KPI" | No — kpiExplainer.ts not wired |
| "Why did this number change?" | No — no trend attribution logic |
| "Which players need assessment?" | No — keyword not in classifier |
| "Who is ready to level up?" | Partial — level-readiness keyword matches |
| "Who is falling behind?" | No — no "falling behind" signal |
| "Which coaches have not completed recaps?" | No — not in classifier |
| "Draft a parent update for Sarah" | Partial — name disambiguation not built |
| "How healthy is my academy?" | Partial — academy_health keyword matches; answer is generic |
| "What should I tell Brian in a weekly report?" | No — no weekly report draft action |

---

## 5. COO Readiness Audit

| COO Dimension | Score | Gap |
|---|---|---|
| Academy health awareness | 5 | directorDonnaContext loads live data but is only surfaced on /director/donna |
| KPI fluency | 2 | kpiExplainer.ts not wired; KPI page has no DONNA |
| Player development awareness | 4 | Attention items exist in context; no per-player DONNA Q&A |
| Curriculum awareness | 3 | Curriculum gaps blocked by schema; no per-level DONNA context |
| Assessment/placement awareness | 2 | placementDraftAction.ts exists; DONNA cannot reach it |
| Coach accountability awareness | 2 | donnaCoachIntelligenceAction.ts exists; coach profile has no DONNA |
| Session/attendance awareness | 5 | Sessions and wrap-ups tracked in context; session pages have no DONNA |
| Parent communication awareness | 6 | draft_parent_summary implemented and wired on player profile |
| Review queue awareness | 8 | Review queue is the best-connected part of DONNA |
| Licensing/curriculum health awareness | 1 | No backend model exists |
| Trust/safety awareness | 8 | Strong library-level enforcement |
| Recommend next best action | 5 | NBA engine exists; only surfaces on /director/donna |
| Create drafts | 5 | 8 actions wired; 18 others not reachable from UI |
| Route work for approval | 7 | Review queue works well; two path gaps |
| Explain reasoning | 3 | DonnaDraftCard shows static rationale; no inline Q&A |
| Ask clarifying questions | 4 | Exists for wrap-up and ambiguous commands; not general-purpose |
| Handle multi-step requests | 3 | donnaMultiStepFlow.ts exists; not wired to director chat |
| Avoid unsafe actions | 9 | Unsafe/blocked classes in registry; boundary responses enforced |
| Voice/persistence reliability | 3 | Ends on silence; no cross-page persistence |
| Mobile usability | 3 | Not mobile-adapted |

---

## 6. Parent/Player Safety Audit Summary

See `docs/DONNA_PARENT_PLAYER_SAFETY_AUDIT_620.md` for detail.

**Score: 8 / 10.** Safety architecture is strong:
- Raw coach notes blocked at library level (`parentSafeResponseRules.ts`)
- `observationVisibilityGuardrails.ts` enforces observation boundaries
- `donnaTrustBoundaryValidator.ts` validates trust scope
- `donnaBoundaryResponses.ts` provides consistent refusal language
- `block_unsafe_parent_visibility_request` is `implemented_and_wired`

**Gap:** No formal end-to-end test suite validates that coach notes never reach a parent-facing DONNA response at runtime.

---

## 7. Review/Approval Audit Summary

See `docs/DONNA_REVIEW_APPROVAL_AUDIT_620.md` for detail.

**Score: 7 / 10.** The review queue is the most-complete part of DONNA:
- Approve/reject wired
- `execute_approved_action()` covers 11/15 action types
- `DonnaDraftCard`, `DonnaReviewBriefPanel`, and `DonnaReviewContextPanel` all exist

**Gaps:**
1. `DonnaLevelMovementApplyControls` not wired to `DonnaDraftCard` in `/director/review`
2. Fitness template session generation bypasses `proposed_actions` — creates sessions directly
3. 4 action types have no `execute_approved_action()` coverage
4. No inline DONNA Q&A on review items — director cannot ask "why was this drafted?"

---

## 8. Voice Reliability Audit Summary

**Score: 3 / 10.**

| Capability | Status |
|---|---|
| Stays active until explicitly stopped | No — ends on silence (`continuous=false`) |
| Auto-restarts on silence | No |
| Shows question being asked on screen | Partial — interim transcript visible during dictation |
| Transcript editing | No |
| Name disambiguation | No |
| Cross-page context | No |
| Mobile support | Untested / not optimized |
| Chrome/Edge only | Yes — WebKit SpeechRecognition only |
| TTS output | Yes — `useSpeechOutput.ts` exists |
| Page-aware during voice | Only on /director/donna — not other routes |

---

## Prioritized Gap Summary

### P0 — Must fix before any director pilot

1. `/director/kpi` has zero DONNA — kpiExplainer.ts not wired
2. `/director/players` has zero DONNA — cannot answer "who needs attention?"
3. `/director` main dashboard scores 4 — no DONNA explain/recommend
4. Intent classifier is keyword-only — cannot process natural language
5. No cross-page session memory — context resets on navigation

### P1 — Must fix before premium V1

6. explain_kpi and summarize_kpi not wired to any UI
7. `/director/signals` has no DONNA narrator
8. Player profile has no inline DONNA Q&A chat shell
9. `DonnaLevelMovementApplyControls` not wired to review queue
10. Fitness template session generation bypasses review queue
11. `execute_approved_action()` covers 11/15 action types
12. Coach profile has `donnaCoachIntelligenceAction.ts` but no UI entry point
13. Voice session ends on silence — no auto-restart
14. No transcript editing — name misrecognitions corrupt commands
15. Curriculum builder scores 1 — zero DONNA guidance
16. No "why did this KPI change?" logic
17. Placement engine has no DONNA suggestion button

### P2 — After pilot

18. Sessions list has no DONNA
19. Review item detail has no inline Q&A
20. Curriculum explorer missing level context pass-through
21. No strategic question handling
22. No weekly COO report draft action
23. Director portal not mobile-optimized

### P3 — Future expansion

24–29. Badge, mission, drill, video, licensing, group-adjustment backends missing

---

## Recommended Sprint 621

**Priority: KPI Fluency + Main Dashboard DONNA Presence**

Wire `kpiExplainer.ts` to `/director/kpi` via a `DonnaKpiExplainerChip` component. Add a DONNA entry chip to the `/director` main dashboard ("What should I do first?"). Surface `summarize_roster_gaps` from `directorDonnaContext.attentionItems` on the players directory page.

Rationale: These three wiring tasks are the highest-impact, lowest-risk P0 gaps. The library is already built — the bottleneck is UI entry points. Closing these three gaps alone would raise the route connectivity score from 4 to approximately 5 and the KPI fluency score from 2 to 4.
