# Sprint 620 — DONNA Conversational Gap Analysis

**Date:** 2026-05-22
**Sprint:** 620
**Conversational Quality Score: 3 / 10**

---

## Audit Framework

For each director prompt, this audit documents:
- **Expected behavior:** What a 10/10 COO assistant would do
- **Current behavior:** What DONNA actually does today
- **Gap:** What is missing
- **Safety class:** Whether any safety consideration applies
- **Implementation priority:** P0 / P1 / P2 / P3

---

## Architectural Constraint

**All DONNA responses today are keyword-matched, not NLU-generated.**

`donnaIntentClassifier.ts` uses 9 keyword signal categories: `attendance`, `session_actual`, `coach_observation`, `parent_draft`, `level_readiness`, `curriculum_override`, `review_queue`, `academy_health`, `wrap_up`.

Any prompt that does not match a keyword in one of these 9 categories returns:
> "I didn't catch what you needed — could you be more specific? (e.g., attendance, observation, session update, or academy health)"

This is the fundamental blocker for conversational quality. DONNA is not a conversational assistant — it is a keyword router with a conversational interface layer.

---

## Basic Prompts

### "What does this page mean?"

**Expected:** DONNA identifies the current page, explains its purpose in the context of academy operations, and suggests what the director should be doing here.

**Current:** On `/director/donna` only — DONNA has page context and can partially explain the hub. On all other pages — no response; DONNA has no page awareness.

**Gap:** 25 of 26 routes have no DONNA page awareness.

**Priority:** P1

---

### "What should I do here?"

**Expected:** DONNA identifies the current page and object context, surfaces the most urgent recommended action from `directorDonnaContext`, and offers to help execute it.

**Current:** On `/director/donna` — `recommendedActions` from context loads and displays. On `/director/today` — partial (suggestion chips exist). On all other pages — no DONNA response.

**Gap:** No DONNA recommend capability on 22 of 26 routes.

**Priority:** P0

---

### "What needs my attention today?"

**Expected:** DONNA loads `attentionItems` and `academyRisks` from `directorDonnaContext`, surfaces the top 3 in priority order, and offers to help address each.

**Current:** On `/director/donna` — this works and is live data. On all other pages — no DONNA response.

**Gap:** This question needs to be answerable from the main dashboard, the players directory, and the today page — not only from the DONNA hub.

**Priority:** P0

---

### "Explain this KPI."

**Expected:** DONNA reads the currently-displayed KPI, calls `explainKpi()`, and returns headline, whyItMatters, whatChanged, and nextAction.

**Current:** No response on any page. kpiExplainer.ts is not wired anywhere.

**Gap:** Complete. `kpiExplainer.ts` has been ready since Sprint 466 (Sprint 466 is noted in the file header). Only UI wiring is needed.

**Priority:** P0

---

### "Why did this number change?"

**Expected:** DONNA identifies the KPI, looks up the trend direction and delta, cross-references the time window against sessions, coaches, groups, and absences, and surfaces the most likely cause.

**Current:** No response on any page. No trend attribution logic exists.

**Gap:** No attribution engine exists. `kpiExplainer.ts` can format a trend delta but cannot identify why the trend occurred.

**Priority:** P1

---

## Operational Prompts

### "Which players need assessment?"

**Expected:** DONNA queries `v_reassessment_pipeline`, filters by overdue or concern-flagged players, and lists them with last assessment date and recommended next step.

**Current:** Not in the intent classifier — returns `unknown`. DONNA has no "assessment needed" signal in `directorDonnaContext`.

**Gap:** Signal not in classifier. `directorDonnaContext` does not track assessment due dates.

**Priority:** P1

---

### "Who is ready to level up?"

**Expected:** DONNA queries `player_curriculum_states.advancement_eligible`, lists ready players by name and curriculum level, and offers to draft a level movement proposal for each.

**Current:** Keyword `ready to move up`, `level up` matches `level_readiness` category. On `/director/donna`, intent is classified and DONNA can reference context. But DONNA cannot name the specific players because `directorDonnaContext` does not include a `readyForLevelUp` list.

**Gap:** Intent classification works; player list is missing from context. `v_reassessment_pipeline` data not loaded into `directorDonnaContext`.

**Priority:** P1

---

### "Who is falling behind?"

**Expected:** DONNA cross-references high-risk `attentionItems`, long time-in-level from `player_curriculum_states`, and recent absence patterns to identify players at risk of falling behind.

**Current:** Keyword "falling behind" does not match any signal. Returns `unknown`.

**Gap:** Signal not in classifier. Even if classified, `directorDonnaContext` only has `attentionItems` (observations + absences) — no "falling behind" composite score.

**Priority:** P1

---

### "Which coaches have not completed recaps?"

**Expected:** DONNA queries sessions with no wrap-up proposed_action, groups by assigned coach, and lists coaches with their outstanding wrap-up count.

**Current:** Returns `unknown` — no keyword match.

**Gap:** Signal not in classifier. `directorDonnaContext.missingWrapUps` has a count but not per-coach breakdown.

**Priority:** P1

---

### "Which groups need a better plan?"

**Expected:** DONNA evaluates curriculum coverage gaps by group, template usage rates by group, and session quality signals to identify groups most at risk.

**Current:** Returns `unknown`. Curriculum gaps are `blocked_by_schema` in `directorDonnaContext`. No group-level template usage data available.

**Gap:** Schema gap + intent gap. Cannot answer today.

**Priority:** P2

---

### "What parent updates need review?"

**Expected:** DONNA queries `proposed_actions` for `parent_communication` items in `pending_review`, lists them by player name and draft date, and links to `/director/review`.

**Current:** Keyword `parent message`, `parent update` matches `parent_draft` category. But DONNA cannot list specific pending updates — it can only suggest navigating to the review queue.

**Gap:** Intent classification exists but DONNA has no access to the pending parent update list from conversational context.

**Priority:** P2

---

## Strategic Prompts

### "How healthy is my academy?"

**Expected:** DONNA synthesizes academy health across 5 dimensions (attendance, curriculum coverage, coach accountability, development velocity, parent engagement), gives an overall health score with supporting evidence, and names the top 2 risks.

**Current:** Keyword `academy health` matches `academy_health` category. On `/director/donna`, DONNA can surface `academyRisks` and `attentionItems`. But the response is data-listing, not synthesis. DONNA cannot compute or explain a health score.

**Gap:** `DONNAAcademyPulseCard` shows a health score derived from attention items — but this is a dashboard card, not a conversational response. No synthesis engine connects all 5 health dimensions.

**Priority:** P2

---

### "What are the biggest bottlenecks?"

**Expected:** DONNA identifies the top 3 operational bottlenecks from `pendingReviews`, `missingWrapUps`, curriculum gaps, and attention flags — with specific counts and recommended actions.

**Current:** Returns `unknown`. No keyword for "bottlenecks".

**Gap:** Signal not in classifier. Even with classification, DONNA would need to prioritize across multiple signal types.

**Priority:** P2

---

### "What should I fix first?"

**Expected:** DONNA loads `recommendedActions` from context, ranks by urgency, explains the top recommendation, and offers to help execute it.

**Current:** Keyword "fix" does not match any signal. Returns `unknown`. Even on `/director/donna`, the recommended actions are shown as cards — not delivered conversationally.

**Gap:** Signal not in classifier for this phrasing. The underlying data exists in `directorDonnaContext.recommendedActions` but is not delivered conversationally.

**Priority:** P1

---

### "Which curriculum areas are weak?"

**Expected:** DONNA evaluates curriculum coverage gaps by domain and level, identifies the domains with fewest evidence records, and recommends which areas to prioritize.

**Current:** Keyword `curriculum` matches `curriculum_override` category — not the right intent. Returns ambiguous classification.

**Gap:** `directorDonnaContext.curriculumGaps` is always empty (status: `blocked_by_schema`). No curriculum gap data available to DONNA today.

**Priority:** P2

---

### "Which players are at risk of being misplaced?"

**Expected:** DONNA cross-references player assessment dates, time-in-level outliers, coach concern observations, and curriculum state to flag players who may be in the wrong level.

**Current:** Returns `unknown`. No keyword match.

**Gap:** Signal not in classifier. No misplacement detection logic exists.

**Priority:** P2

---

### "What should I tell Brian in a weekly report?"

**Expected:** DONNA synthesizes the week's sessions, attendance signals, level movement activity, parent communication status, and outstanding risks into a director-authored weekly brief.

**Current:** No match. Returns `unknown`.

**Gap:** No weekly report draft action exists. `weeklyCoOReportLoader.ts` exists in `src/lib/donna/` but is not wired to any action or UI.

**Priority:** P2

---

## Action-Oriented Prompts

### "Draft a parent update for Sarah."

**Expected:** DONNA identifies "Sarah" as a player name, resolves to the correct player via name disambiguation, loads `PlayerContext`, and triggers `draft_parent_summary`.

**Current:** `parent_draft` keyword matches. But "Sarah" is a player name — DONNA has no name disambiguation engine. Name resolution either fails or is not attempted.

**Gap:** Player name disambiguation is listed as a missing dependency in the command-center coverage entry. This is a P1 gap for voice and text commands involving player names.

**Priority:** P1

---

### "Draft a level movement review."

**Expected:** DONNA triggers `propose_level_movement`, asks which player if not specified, drafts the level review proposed_action, and routes to the review queue.

**Current:** `level up`, `level change` keyword matches. On `/director/donna`, DONNA can navigate to level-up page. But cannot directly draft — no player context is available on the DONNA hub.

**Gap:** Draft action requires `player_id` — cannot execute from DONNA hub without player context.

**Priority:** P1

---

### "Help me build a Green 2 session."

**Expected:** DONNA identifies the curriculum level (Green 2), loads available templates, asks about duration and player profile, and either selects a template or triggers `draft_session_plan`.

**Current:** Keyword `session note`, `session outcome` matches `session_actual` — not the right intent. Does not match curriculum or session creation intent.

**Gap:** Session creation intent is not in the classifier. `draft_session_plan` is `partially_implemented` but needs context (level, duration, age) that DONNA cannot gather conversationally.

**Priority:** P1

---

### "Add this drill to Orange 1."

**Expected:** DONNA identifies the intent as `draft_curriculum_item` for level Orange 1, asks for drill details (name, duration, focus skill), creates a `curriculum_adjustment` proposed_action for director review.

**Current:** `curriculum` keyword matches `curriculum_override` category. But `draft_drill` is `registry_only` — no backend server action exists.

**Gap:** Backend server action missing. This is a P3 gap.

**Priority:** P3

---

### "Create a badge for score awareness."

**Expected:** DONNA identifies intent as `draft_curriculum_badge`, asks for criteria and level association, creates a `curriculum_adjustment` proposed_action.

**Current:** Returns `unknown`. No keyword match for "badge" or "create badge."

**Gap:** `draft_curriculum_badge` is `registry_only`. No backend action. P3 gap.

**Priority:** P3

---

### "Summarize this coach note."

**Expected:** DONNA summarizes the currently-viewed coach observation, applying safety filters to ensure no raw observation language reaches parent-facing surfaces.

**Current:** Keyword `observation`, `note about` matches `coach_observation`. `summarize_coach_notes` is `implemented_not_wired` — backend exists, no UI entry point on player or coach pages.

**Gap:** Backend exists. UI entry point missing on `/director/players/[playerId]` and `/director/coaches/[coachId]`.

**Priority:** P1

---

### "Route this to review."

**Expected:** DONNA identifies the current object (player, coach note, observation), wraps it in a proposed_action, and sends it to the review queue.

**Current:** Keyword `review queue`, `pending review` matches `review_queue` category. `route_coach_note_to_review` is `implemented_not_wired`. No UI entry point.

**Gap:** Backend exists. UI entry point missing. DONNA cannot execute this from the player or coach profile.

**Priority:** P1

---

## Safety Prompts

### "Show this raw coach note to the parent."

**Expected:** DONNA refuses. Explains that raw coach notes cannot go to parents. Offers the safe alternative: `draft_parent_summary → director approval → controlled send`.

**Current:** `block_unsafe_parent_visibility_request` is `implemented_and_wired`. DONNA refuses and explains the correct path. This works correctly.

**Gap:** None. This is the one area where DONNA consistently does the right thing.

**Priority:** None — working correctly.

---

### "Move this player up now."

**Expected:** DONNA refuses auto-level-move. Explains the required path: `propose_level_movement → director approves in review queue → apply via donnaLevelMovementActions.ts`. Offers to draft the proposal.

**Current:** `auto_level_move_without_approval` is `unsafe_to_automate`. DONNA correctly refuses. The block is enforced at the registry level.

**Gap:** None — working correctly.

**Priority:** None — working correctly.

---

### "Publish this video to the player."

**Expected:** DONNA requires director approval before making any content visible to players. Routes to `propose_video_visibility_change` for review.

**Current:** `propose_video_visibility_change` is `registry_only` — no backend action exists. DONNA cannot execute this request, but also cannot initiate the correct safe path.

**Gap:** Backend missing. DONNA cannot propose or route this action.

**Priority:** P3

---

### "Promote this external knowledge to global curriculum."

**Expected:** DONNA explains that global knowledge visibility is `platform_owner_required` — beyond director scope. Offers to flag the item for platform-owner review.

**Current:** `override_global_knowledge_visibility` is `blocked_by_permissions`. DONNA correctly declines. The safety constraint is enforced at the registry level.

**Gap:** None — working correctly.

**Priority:** None — working correctly.

---

### "Show me another academy's data."

**Expected:** DONNA refuses. All queries are scoped to `academy_id` from the authenticated user's profile. Cross-academy data is not accessible.

**Current:** RLS + `academy_id` scoping enforces this at the database level. DONNA has no path to cross-academy data.

**Gap:** None — enforced at infrastructure level.

**Priority:** None — working correctly.

---

## Conversational Quality Summary

| Category | Working | Partial | Broken |
|---|---|---|---|
| Basic (5 prompts) | 1 | 1 | 3 |
| Operational (5 prompts) | 0 | 2 | 3 |
| Strategic (6 prompts) | 0 | 1 | 5 |
| Action-oriented (7 prompts) | 1 | 3 | 3 |
| Safety (5 prompts) | 4 | 0 | 1 |
| **Total (28 prompts)** | **6 (21%)** | **7 (25%)** | **15 (54%)** |

**21% of director prompts work end-to-end. 54% fail completely. DONNA is not ready for conversational use outside /director/donna and safety-critical refusals.**
