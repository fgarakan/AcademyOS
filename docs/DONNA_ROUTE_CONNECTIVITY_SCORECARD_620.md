# Sprint 620 — DONNA Route Connectivity Scorecard

**Date:** 2026-05-22
**Sprint:** 620
**Source:** `src/lib/donna/directorCoverageRegistry.ts` + architectural audit

**Scoring per route (0–10):**

| Category | What it measures |
|---|---|
| Presence | DONNA entry point or shell is rendered on this page |
| Page-aware | DONNA knows which page/module the director is on |
| Object-aware | DONNA knows the selected player/session/level/coach being viewed |
| Can explain | DONNA can explain what the page means or what needs attention |
| Can summarize | DONNA can summarize current state |
| Can recommend | DONNA can recommend a next best action |
| Can draft | DONNA can create a proposed_actions draft from this page |
| Can route | DONNA can route an item to the review queue |
| Can apply | DONNA can apply an approved action from this page |
| Approval required | Whether approval gate is enforced before execution |
| Parent/player risk | Whether DONNA output could reach parent/player portals |

---

## Tier 1 — Fully Connected (Score ≥ 8)

### /director/review — Score: 9

| Capability | Status |
|---|---|
| DONNA presence | Yes |
| Page-aware | Yes |
| Object-aware | Yes |
| Can explain | Yes — DonnaReviewBriefPanel |
| Can summarize | Yes |
| Can recommend | Yes |
| Can draft | Yes |
| Can route | Yes |
| Can apply | Yes — approve/reject/execute wired |
| Approval required | Yes — enforced |
| Parent/player risk | No |

**What works:** Review queue is the best-connected DONNA surface. Director can see pending items, approve, reject, and apply most action types. DonnaDraftCard surfaces AI-generated rationale.

**Remaining gaps:**
- `DonnaLevelMovementApplyControls` not wired to `DonnaDraftCard` — level movement approval cannot be applied from within review queue
- Inline DONNA Q&A on each item ("Why did DONNA draft this?") not yet built
- Bulk-approve with DONNA reasoning summary not built

---

### /director/onboarding/interview — Score: 9

| Capability | Status |
|---|---|
| DONNA presence | Yes — DirectorInterviewAssistant |
| Page-aware | Yes |
| Object-aware | Yes |
| Can explain | Yes |
| Can summarize | Yes |
| Can recommend | Yes |
| Can draft | Yes |
| Can route | Yes |
| Can apply | Yes |
| Approval required | Yes |
| Parent/player risk | No |

**What works:** Director interview is fully DONNA-guided. Voice-assisted interview flow with real-time follow-up. Most complete single-page DONNA experience in the product.

**Remaining gaps:** None — this is the reference implementation.

---

### /director/donna — Score: 8

| Capability | Status |
|---|---|
| DONNA presence | Yes — DonnaDirectorShellClient |
| Page-aware | Yes |
| Object-aware | No — no selected player/session object |
| Can explain | Yes |
| Can summarize | Yes |
| Can recommend | Yes — recommendedActions from directorDonnaContext |
| Can draft | No — no draft actions wired to the DONNA hub |
| Can route | Yes — links to review queue |
| Can apply | No |
| Approval required | N/A |
| Parent/player risk | No |

**What works:** DONNA hub has live context: sessions, reviews, wrap-ups, attention flags, academy risks, recommended actions, daily brief, context summary card. Intent classifier wired. Best conversational DONNA surface in director portal.

**Remaining gaps:**
- No selected player/session context — DONNA cannot answer per-object questions from here
- No draft actions wired to the DONNA hub — "Help me build a session" must navigate away
- Intent classifier is keyword-only — many hub questions return `unknown`

---

### /director/review/[actionId] — Score: 8

| Capability | Status |
|---|---|
| DONNA presence | Yes — DonnaReviewContextPanel |
| Page-aware | Yes |
| Object-aware | Yes — full proposed_action object |
| Can explain | Yes |
| Can summarize | Yes |
| Can recommend | No |
| Can draft | No |
| Can route | No |
| Can apply | Yes |
| Approval required | Yes |
| Parent/player risk | No |

**Remaining gaps:**
- Inline DONNA Q&A ("Why was this drafted?" / "What will happen if I approve?") not built
- Related-item cross-reference missing

---

## Tier 2 — Well Connected (Score 6–7)

### /director/command-center — Score: 7

**What works:** Voice/text command intake. DirectorAssistantPanel wired. DonnaDirectorShellClient connected. Accepts structured commands and routes to createVoiceIntakeDraftAction.

**Gaps:** Free-form NLU missing — commands must match keyword patterns. No multi-turn context. Player name disambiguation not built. `submitDirectorCommandAction.ts` uses keyword routing only.

---

### /director/today — Score: 7

**What works:** TodayCommandBrief, TodayDonnaSuggestionChip, session list, attention risk loaded from directorDonnaContext. Summarize capability present.

**Gaps:** No drill-down per session or per player from today view. No draft action wired to today page.

---

### /director/players/[playerId] — Score: 7

**What works:** Rich data page — curriculum state, assessment history, coach observations, gate evidence, parent guidance. Draft actions wired: draft_parent_summary, draft_player_summary, draft_coach_brief, propose_level_movement. Multiple DONNA-initiated server actions exist.

**Gaps:**
- No inline DONNA Q&A chat shell — director cannot ask "What should I do for this player today?"
- DONNA cannot explain why a gate is blocked
- summarize_player_profile is `implemented_not_wired` — the most obvious COO action for this page
- Object-aware only via URL — DONNA context not passed to a PlayerContext provider

---

### /director/curriculum — Score: 6

**What works:** Page is aware of the curriculum. Draft actions exist (draft_curriculum_item). Route to review queue wired.

**Gaps:** No DONNA presence rendered on page. DONNA does not know which level the director is currently viewing. No "What is weak in this level?" prompt chip. No per-drill DONNA context.

---

### /director/sessions/[sessionId] — Score: 6

**What works:** Session detail is object-aware (session_id known). Recommend and draft capabilities exist (session adjustments, attendance exceptions, wrap-up). Route to review queue works.

**Gaps:** No DONNA presence rendered on page — no entry chip. DONNA cannot narrate the session context. No planned-vs-actual DONNA narrative. No inline Q&A about session flags.

---

### /director/templates/class/[templateId] — Score: 6

**What works:** Class template builder has DONNA draft capability (generateLessonPlanDraftAction). Object-aware. Can apply lesson plan draft.

**Gaps:** No DONNA presence chip on page. Lesson plan apply should pass through review queue — currently applies directly (P1 approval bypass gap). No explain capability.

---

## Tier 3 — Partially Connected (Score 3–5)

### /director/fitness/templates/[templateId] — Score: 5

**What works:** Fitness template builder has draft/apply capability (populateFitnessBlocksAction, generate-session-actions).

**Gaps:** Session generation from fitness templates bypasses proposed_actions pipeline — creates sessions without director review gate (P1). No DONNA presence chip. No explain capability.

---

### /director/level-up — Score: 5

**What works:** DONNA presence exists (LevelUpDonnaCTA, DonnaLevelMovementDraftButton). Page is aware of level movement. Draft wired to donnaLevelMovementActions. Route to review queue wired.

**Gaps:** Per-player DONNA context not passed — level names must be manually entered. "Why is this player overdue?" drill-down narrative not built. Apply path (`DonnaLevelMovementApplyControls`) not wired to DonnaDraftCard in review queue.

---

### /director — Score: 4

**What works:** AcademyKpiCardsSection and DonnaExecutiveCard rendered. Some KPI data shown.

**Gaps:** No DONNA presence on page. No explain capability. DONNA cannot answer "What should I do first?" from the home screen. No page-awareness — DONNA does not know the director is on the dashboard. No KPI explainer chip.

---

### /director/templates — Score: 4

**What works:** Templates hub links to template libraries. TemplatesDonnaPanel exists.

**Gaps:** No DONNA presence rendered. No explain or summarize capability. Recommend capability exists via panel but not connected.

---

## Tier 4 — Weak (Score ≤ 2)

### /director/placement — Score: 2

**Status:** DONNA cannot suggest a placement level from assessment answers. placementDraftAction.ts exists but has no UI entry point. `propose_player_placement` is `implemented_not_wired`. Fix priority: **P0**.

---

### /director/curriculum/builder — Score: 1

**Status:** Zero DONNA presence or connectivity. Director receives no DONNA guidance on any setup step. DONNA has no visibility into the builder state. `explain_curriculum_builder_step` and `draft_curriculum_item` are both `registry_only`. Fix priority: **P1**.

---

### /director/curriculum/learning — Score: 1

**Status:** Not connected. Learning modules are director-preview only. Fix priority: none.

---

### /director/players — Score: 1

**Status:** Zero DONNA. Cannot surface at-risk players, answer "who needs attention?", or link to DONNA roster intelligence. summarize_roster_gaps is `implemented_not_wired`. Fix priority: **P0**.

---

### /director/sessions — Score: 1

**Status:** Zero DONNA. Cannot surface sessions with missing wrap-ups. Fix priority: **P2**.

---

### /director/kpi — Score: 1

**Status:** Zero DONNA. kpiExplainer.ts has been ready since Sprint 466. Neither explain_kpi nor summarize_kpi has any UI entry point on this page. Fix priority: **P0**.

---

### /director/signals — Score: 1

**Status:** Zero DONNA. Development signals appear without narration or next-action recommendation. donnaAcademyHealthQuestions.ts exists but is not connected. Fix priority: **P1**.

---

### /director/coaches — Score: 1

**Status:** Zero DONNA. No route-level intelligence. Fix priority: none.

---

### /director/coaches/[coachId] — Score: 1

**Status:** Zero DONNA. donnaCoachIntelligenceAction.ts exists but has no UI entry point on the coach profile page. Fix priority: **P1**.

---

### /director/parents — Score: 1

**Status:** Zero DONNA. Browse/link page only. Fix priority: none.

---

### /director/settings — Score: 1

**Status:** Zero DONNA. explain_academy_settings is `registry_only`. Fix priority: none.

---

### /director/pilot-readiness — Score: 1

**Status:** Zero DONNA. Checklist page only. Fix priority: none.

---

## Summary

| Metric | Value |
|---|---|
| Total routes audited | 26 |
| Average score | 4.1 / 10 |
| Routes fully connected (≥8) | 4 (15%) |
| Routes well connected (6–7) | 6 (23%) |
| Routes partially connected (3–5) | 4 (15%) |
| Routes not connected (≤2) | 12 (46%) |
| Routes with no DONNA presence | 15 (58%) |
| Routes with approval bypass gaps | 2 |
| P0 fix routes | 3 (/director, /director/players, /director/kpi) |
| P1 fix routes | 6 |
| P2 fix routes | 3 |
