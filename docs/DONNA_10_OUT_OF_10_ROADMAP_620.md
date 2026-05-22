# Sprint 620 — DONNA 10/10 COO Readiness Roadmap

**Date:** 2026-05-22
**Sprint:** 620
**Current Score:** 4 / 10 (partially ready)
**Target:** 9 / 10 (premium V1)

---

## Current State → Target State

| Dimension | Current | Target | Gap |
|---|---|---|---|
| Overall COO Readiness | 4 | 9 | 5 points |
| Route Connectivity | 4 | 9 | 5 points |
| KPI Fluency | 2 | 8 | 6 points |
| Conversational Quality | 3 | 8 | 5 points |
| Review/Approval Safety | 7 | 9 | 2 points |
| Parent/Player Safety | 8 | 9 | 1 point |
| Voice Readiness | 3 | 7 | 4 points |
| Mobile Usability | 3 | 6 | 3 points |

---

## Which to prioritize first?

**Recommended priority order:** Route wiring → KPI fluency → Review center completion → Voice reliability

**Rationale:**

Route wiring must come first because most of the required library is already built — actions, context, explainers — and the bottleneck is purely UI entry points. Wiring produces immediate director value with low implementation risk.

KPI fluency is second because it is the most visible gap for a COO-level assistant. A director who cannot ask "Why is attendance low?" loses trust in DONNA immediately. `kpiExplainer.ts` is already complete — this is a wiring problem.

Review center completion (level movement apply path, fitness template gate) removes the two known approval safety gaps before a pilot director can encounter them.

Voice reliability comes after the above because it requires behavioral changes to the SpeechRecognition lifecycle, not just UI wiring, and because the text/tap interface is the primary director entry point today.

**Do NOT prioritize voice before route wiring.** A smooth voice experience on a disconnected page is worse than a working text interface on a connected page.

---

## P0 Gaps — Must Fix Before Any Director Pilot

| ID | Gap | Sprint |
|---|---|---|
| kpi_page_no_donna | /director/kpi has zero DONNA — kpiExplainer.ts not wired | 621 |
| players_directory_no_donna | /director/players has no DONNA — cannot surface at-risk players | 621 |
| main_dashboard_no_donna | /director main dashboard has no DONNA explain/recommend | 621 |
| intent_classifier_keyword_only | Intent classifier is keyword-only — 9 categories, no NLU | 624 |
| no_cross_page_context | No cross-page session memory — context resets on navigation | 625 |

---

## P1 Gaps — Must Fix Before Premium V1

| ID | Gap | Sprint |
|---|---|---|
| kpi_explain_not_wired | explain_kpi and summarize_kpi not wired to any UI | 621 |
| no_kpi_why_changed | DONNA cannot answer "why did this KPI change?" | 621 |
| signals_page_no_donna | /director/signals has no DONNA narrator | 622 |
| player_profile_no_chat_shell | Player profile has no inline DONNA Q&A chat shell | 622 |
| level_up_apply_gap | DonnaLevelMovementApplyControls not wired to DonnaDraftCard | 622 |
| fitness_template_bypasses_review | Fitness template session gen bypasses proposed_actions | 622 |
| execute_approved_gaps | execute_approved_action() covers 11/15 action types | 622 |
| coach_profile_donna_missing | donnaCoachIntelligenceAction.ts not wired to coach profile | 623 |
| placement_engine_no_donna | Placement engine has no DONNA suggestion button | 623 |
| curriculum_builder_zero_donna | Curriculum builder has zero DONNA guidance | 624 |
| voice_no_persist | Voice ends on silence — no auto-restart | 626 |
| voice_no_transcript_edit | No transcript editing — name misrecognitions corrupt commands | 626 |

---

## P2 Gaps — After Pilot Launch

| ID | Gap | Sprint |
|---|---|---|
| sessions_list_no_donna | Sessions list has no DONNA | 627 |
| donna_inline_qa_review | Review item detail has no inline DONNA Q&A | 627 |
| curriculum_level_context | Curriculum explorer missing level context pass-through | 628 |
| no_strategic_questions | No strategic question handling (bottlenecks, weekly report) | 629 |
| no_coo_weekly_report | No weekly COO report draft action | 629 |
| mobile_director_portal | Director portal not mobile-optimized | 630 |

---

## P3 Gaps — Future Expansion

| ID | Gap | Sprint |
|---|---|---|
| badge_award_missing_backend | Badge award has no backend action | TBD |
| mission_draft_missing_backend | Mission draft has no backend server action | TBD |
| drill_draft_missing_backend | Drill draft has no backend server action | TBD |
| video_visibility_missing_backend | Video visibility change has no backend | TBD |
| licensing_health_missing | Licensing health backend model does not exist | TBD |
| group_adjustment_missing | move_player_group proposed_action type not defined | TBD |

---

## Recommended Next 10 Sprints

### Sprint 621 — DONNA KPI Fluency + Main Dashboard Wiring V1

**Priority: P0**

Create `DonnaKpiExplainerChip` on `/director/kpi` — calls `explainKpi()` from `kpiExplainer.ts`. Wire `summarize_kpi` (`groupKpiSummaryAction.ts`) to a summary panel on the KPI page. Add a DONNA presence chip ("What should I do first?") to the `/director` main dashboard — loads `recommendedActions` from `directorDonnaContext`. Add a DONNA roster chip to `/director/players` — calls `summarize_roster_gaps` and surfaces `attentionItems`. Add basic "why did this change?" logic for `attendance_rate`.

**Outcome:** Route connectivity 4 → 5. KPI fluency 2 → 4. Main dashboard P0 gap closed.

---

### Sprint 622 — DONNA Review Queue Completion + Approval Safety V1

**Priority: P1**

Wire `DonnaLevelMovementApplyControls` to `DonnaDraftCard` in `/director/review`. Add a review gate to fitness template session generation (proposed_action row instead of direct session creation). Fix the 4 missing `execute_approved_action()` action types. Add DONNA chip to `/director/signals` calling `donnaAcademyHealthQuestions.ts`.

**Outcome:** Review/approval safety 7 → 8. Two known approval bypass gaps closed.

---

### Sprint 623 — Player Profile DONNA Chat Shell + Coach Intelligence V1

**Priority: P1**

Add inline DONNA Q&A chat shell to `/director/players/[playerId]`. Wire `summarize_player_profile` to the player profile page. Wire `donnaCoachIntelligenceAction.ts` to `/director/coaches/[coachId]`. Add DONNA placement suggestion button to `/director/placement` (expose `placementDraftAction.ts`).

**Outcome:** Route connectivity 5 → 6. Player profile and coach profile P1 gaps closed.

---

### Sprint 624 — DONNA Curriculum Builder Guidance V1 + Intent Expansion

**Priority: P1**

Add step-by-step DONNA guidance to `/director/curriculum/builder`. Wire `explain_curriculum_builder_step` for each builder step. Expand intent classifier to cover 5 additional categories: `kpi_question`, `player_status`, `curriculum_question`, `session_creation`, `coach_status`. Optionally add a lightweight NLU layer using the existing Anthropic API (feature-flag gated).

**Outcome:** Curriculum builder P1 gap closed. Intent classifier 9 → 14 categories. Conversational quality 3 → 4.

---

### Sprint 625 — DONNA Cross-Page Context Persistence V1

**Priority: P0**

Build a lightweight cross-page DONNA session state (URL-param or sessionStorage backed). DONNA remembers the last-viewed player, session, and curriculum level across navigation. Enables "tell me more about that player" after navigating from `/director/players` to `/director/players/[playerId]`.

**Outcome:** Conversational quality 4 → 5. P0 session persistence gap closed.

---

### Sprint 626 — Voice Reliability V1

**Priority: P1**

Set `continuous=true` on the SpeechRecognition instance. Add auto-restart on silence timeout. Add transcript editing UI — allow director to tap on a word to correct it before submitting. Add player name disambiguation: show top 3 name matches when a recognized name is ambiguous. Wire voice into `/director/players` DONNA chip.

**Outcome:** Voice readiness 3 → 5.

---

### Sprint 627 — Sessions List DONNA + Review Item Inline Q&A

**Priority: P2**

Add DONNA intelligence chip to `/director/sessions` — surfaces sessions missing wrap-ups. Wire `donnaIntelligenceDraftReviewActions.ts` to the inline Q&A on `/director/review/[actionId]`. Director can now ask "Why was this drafted?" from within the review item.

**Outcome:** Sessions list connected. Review item inline Q&A P2 gap closed.

---

### Sprint 628 — KPI Trend Attribution + Curriculum Level Context

**Priority: P2**

Build per-KPI trend attribution for `recap_completion_rate`, `player_priority_coverage`, and `player_progress_velocity`. Add level context pass-through when director expands a level on `/director/curriculum`. Wire `identify_curriculum_gaps` to the expanded level view.

**Outcome:** KPI fluency 4 → 6. Curriculum level context P2 gap closed.

---

### Sprint 629 — DONNA Strategic Questions + Weekly COO Report Draft

**Priority: P2**

Wire `weeklyCoOReportLoader.ts` to a "Weekly Report" DONNA action. Add handling for strategic prompts: "What are the biggest bottlenecks?", "What should I fix first?", "How healthy is my academy?" using `academyHealthContextPackage.ts` and `donnaCOOAnswerEngine.ts`.

**Outcome:** Conversational quality 5 → 6. COO weekly report draft available.

---

### Sprint 630 — Mobile Director DONNA Shell V1

**Priority: P2**

Create a mobile-adapted DONNA shell for director portal — collapsible from a floating action button. Ensure `/director/donna` renders correctly on mobile. Add basic mobile layout support to the director sidebar (hamburger menu).

**Outcome:** Mobile usability 3 → 5.

---

## Recommended Next 25 Sprints (Outline)

| Sprint | Focus | Priority |
|---|---|---|
| 621 | KPI fluency + main dashboard wiring | P0 |
| 622 | Review queue completion + approval safety | P1 |
| 623 | Player profile chat shell + coach intelligence | P1 |
| 624 | Curriculum builder guidance + intent expansion | P1 |
| 625 | Cross-page context persistence | P0 |
| 626 | Voice reliability | P1 |
| 627 | Sessions list DONNA + review item inline Q&A | P2 |
| 628 | KPI trend attribution + curriculum level context | P2 |
| 629 | Strategic questions + weekly COO report | P2 |
| 630 | Mobile director DONNA shell | P2 |
| 631 | Drill draft backend + DONNA drill creation flow | P3 |
| 632 | Mission draft backend + player mission DONNA actions | P3 |
| 633 | Badge award pipeline + badgeEligibilityEngine wiring | P3 |
| 634 | Roster intelligence — group adjustment recommendation | P3 |
| 635 | Parent DONNA integration scoping (safety-gated) | P1 |
| 636 | Parent DONNA V1 — parent portal DONNA chip (read-only) | P1 |
| 637 | proposed_actions.donna_rationale migration + inline rationale | P2 |
| 638 | Video visibility pipeline + media DONNA actions | P3 |
| 639 | Licensing health backend model + explain_licensing_health | P3 |
| 640 | DONNA multi-step conversation flows (guided coaching plan) | P2 |
| 641 | Player misplacement detection engine | P2 |
| 642 | Coach accountability dashboard + DONNA integration | P2 |
| 643 | DONNA audit trail UI — director can see what DONNA did and why | P2 |
| 644 | Global knowledge visibility + platform-owner role | P3 |
| 645 | DONNA performance testing + rate limit calibration for pilot | P1 |

---

## Exact Recommended Sprint 621

**Sprint 621 — DONNA KPI Fluency + Dashboard Presence V1**

**Files to create:**
- `src/components/donna/DonnaKpiExplainerPanel.tsx` — renders `explainKpi()` output inline on /director/kpi
- `src/components/donna/DonnaKpiSummaryPanel.tsx` — renders academy-level KPI summary from groupKpiSummaryAction
- `src/components/donna/DonnaDashboardPresenceChip.tsx` — "What should I do first?" entry chip for /director page
- `src/components/donna/DonnaPlayersPresenceChip.tsx` — "Who needs attention?" chip for /director/players

**Files to modify:**
- `src/app/director/kpi/page.tsx` — add DonnaKpiExplainerPanel and DonnaKpiSummaryPanel
- `src/app/director/page.tsx` — add DonnaDashboardPresenceChip
- `src/app/director/players/page.tsx` — add DonnaPlayersPresenceChip

**What NOT to do in Sprint 621:**
- Do not build NLU or change the intent classifier
- Do not add new server actions
- Do not modify proposed_actions pipeline
- Do not touch parent/player portals
- Do not build voice features

**Why this sprint first:** Three P0 routes (KPI, main dashboard, players) are blocked by missing UI chips only — the library is ready. This is the highest-impact, lowest-risk sprint available.

---

## Score Trajectory

| Sprint | Est. Overall Score | Key milestone |
|---|---|---|
| 620 (current) | 4 | Audit baseline |
| 621 | 4–5 | KPI page + main dashboard wired |
| 622 | 5 | Review queue + approval safety closed |
| 623 | 5–6 | Player profile + coach + placement |
| 624 | 6 | Curriculum builder + intent expansion |
| 625 | 6 | Cross-page context persistence |
| 626 | 6–7 | Voice reliability |
| 627–629 | 7 | P2 gaps closed; pilot-usable |
| 630–635 | 7–8 | Mobile + parent DONNA scoping |
| 636–645 | 8–9 | Full premium V1 feature set |

**Reaching 9/10 (premium V1)** requires all P0 and P1 gaps closed plus voice reliability at ≥6 and mobile usability at ≥5. Estimated timeline: 15–20 focused sprints from current state.

**Reaching 10/10 (category-defining)** additionally requires NLU/AI inference layer, full multi-step conversation handling, proactive DONNA suggestions, and a mobile-first redesign of the director portal. This is a product generation goal, not a sprint goal.
