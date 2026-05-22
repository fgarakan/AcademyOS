# DONNA COO Score Re-Audit — Sprint 630

**Date:** 2026-05-22
**Scope:** Re-scores DONNA COO readiness after Sprints 621–629.
**Evidence basis:** Code-level audit only. No inflated scores. All claims must be verifiable in actual files.

---

## Overall COO Score

| Dimension | Sprint 620 | Sprint 630 | Change |
|---|---|---|---|
| Overall COO Readiness | 4 | 5 | +1 |
| Route Connectivity | 4 | 4 | — |
| KPI Fluency | 2 | 4 | +2 |
| Conversational Quality | 3 | 5 | +2 |
| Review/Approval Safety | 7 | 7 | — |
| Parent/Player Safety | 8 | 8 | — |
| Voice Readiness | 3 | 3 | — |
| Mobile Usability | 3 | 3 | — |

**Score scale:** 0–3 not ready · 4–6 partially ready · 7–8 pilot usable · 9 premium V1 · 10 category-defining

---

## What Improved (Sprints 621–629)

### Sprint 621 — DONNA KPI Fluency Dashboard Presence
- KPI explainer chips added to `/director/donna` hub
- `explainKpiByStatus()` from `kpiExplainer.ts` now surfaces in DONNA attention panel
- KPI coverage registry score for `/director` bumped

### Sprint 622 — DONNA KPI Explainer Response Path
- `tryAnswerKpiQuestion()` wired into `DonnaVoiceReadyShell.tsx`
- Director can now ask "Why is attendance red?", "Which KPI should I focus on?", "What is driving the drop?" from the DONNA hub chat
- KPI Fluency moves from 2 → 4. Gap: KPI page itself still has no per-metric DONNA entry point; trend attribution not wired

### Sprint 623 — DONNA Dashboard Priority Answer
- `tryAnswerDashboardPriorityQuestion()` wired into shell
- Director can now ask "What should I do first?", "What needs my attention?", "Brief me" from `/director/donna`
- Surfaced from live context: pending reviews, missing wrap-ups, high-risk players

### Sprint 624 — DONNA Players Roster Intelligence
- `tryAnswerRosterAttentionQuestion()` wired into shell
- Director can now ask "Who needs attention?", "Who is at risk?", "Who is falling behind?"
- Returns named player list ranked by attention signal (P0 gap `players_directory_no_donna` addressed)

### Sprint 625 — DONNA Cross Page Session Context
- `donnaChatSessionMemory.ts` records conversation turns cross-page
- `useConversationState.ts` preserves active chat session across navigation
- P0 gap `no_cross_page_context` addressed — context no longer resets on every page navigation

### Sprint 626 — DONNA Intent Classifier Upgrade
- Classifier expanded from 9 → 13 director intent families
- Added: `kpi_explanation`, `kpi_priority`, `dashboard_priority`, `roster_attention`, `review_queue`, `parent_summary`, `level_movement`, `assessment_or_placement`, `curriculum_builder`, `coach_note_summary`, `unsafe_visibility_request`, `ambiguous_context`
- Returns: `intent`, `confidence`, `missingContext`, `safetyClass`, `recommendedAction`
- P0 gap `intent_classifier_keyword_only` partially addressed (still regex-based, not NLU, but significantly richer)

### Sprint 627 — DONNA Clarifying Question Chat
- `directorClarificationEngine.ts` asks one focused question when `needs_review` intent has missing context
- Blocking fires for: raw coach notes to parents, cross-academy, direct mutations
- Clarification fires for: `parent_summary`, `level_movement`, `assessment_or_placement`, `curriculum_builder`, `coach_note_summary`, `ambiguous_context`

### Sprint 628 — DONNA Action Preview Chat
- `directorActionPreview.ts` shows structured preview before DONNA drafts sensitive actions
- Preview shape: `willHappen[]`, `willNotHappen[]`, `affectedObjectLabel`, `approvalRequirement`, `visibilityImpact`, `safetyClass`
- Fires for `needs_review` intents that passed clarification (i.e., enough context present)
- Director always knows what will and will not happen before any draft begins

### Sprint 629 — DONNA Top Director Route Coverage
- `/director/placement` added to page context registry
- `/director/curriculum/builder` added to page context registry
- Coverage registry updated for 4 routes (`signals`, `curriculum`, `placement`, `curriculum/builder`)
- Score inflation avoided — floating button was always present; context card now meaningful

---

## Route Connectivity Score — Detailed

**Route average score:** ~4.3/10 (26 routes)

| Tier | Count | Routes |
|---|---|---|
| Fully connected (≥8) | 4 | review, onboarding/interview, donna hub, review/[id] |
| Well connected (6-7) | 5 | command-center, today, players/[id], curriculum, sessions/[id] |
| Partially connected (3-5) | 6 | fitness/templates, dashboard, templates, level-up, players, kpi |
| Not connected / weak (≤2) | 11 | signals, placement, curriculum/builder, sessions, coaches, coaches/[id], parents, settings, pilot-readiness, curriculum/learning + more |

**Key gap:** DONNA chat (full NLU shell) is only on `/director/donna`. Floating button everywhere provides context card and draft flows but NOT conversational DONNA. A director on `/director/players` cannot ask DONNA a question without navigating away.

---

## KPI Fluency Score — Detailed

**Score: 4 (up from 2)**

- 12 KPI templates in `kpiExplainer.ts` — now wired into DONNA chat responses (Sprints 621-622)
- Director can ask: "Explain attendance rate", "Which KPI is most urgent?", "Why is recap completion low?"
- DONNA answers from available context, not live KPI data feed
- **Gap (P1):** KPI trend attribution still not wired — "why did attendance drop this week?" returns honest limitation response
- **Gap (P1):** `/director/kpi` page has no per-KPI DONNA chip — must navigate to `/director/donna` to ask KPI questions

---

## Conversational Quality Score — Detailed

**Score: 5 (up from 3)**

DONNA can now handle:
- KPI explanation and priority questions (Sprints 621-622)
- "What should I do first?" / dashboard priority (Sprint 623)
- Roster attention questions with named players (Sprint 624)
- One clarifying question when context is missing (Sprint 627)
- Action preview before any sensitive draft (Sprint 628)
- Cross-page session memory (Sprint 625)

DONNA cannot yet handle:
- Curriculum health questions ("what's weak in Orange 2?")
- Coach-specific strategic questions ("how is Brian doing?")
- Multi-step conversations (beyond one clarification)
- Strategic planning ("what should I focus on this month?")
- Complex entity resolution across sessions

---

## Review/Approval Safety Score — Detailed

**Score: 7 (unchanged)**

Strengths:
- `proposed_actions` pipeline is the architectural foundation
- approve/reject are wired and tested
- `execute_approved_action()` covers 11/15 action types
- Action preview (Sprint 628) shows what will/will not happen before drafting
- Clarification and blocking layer (Sprints 627-628) prevent raw mutations from chat

Remaining gaps:
- `DonnaLevelMovementApplyControls` not wired to `DonnaDraftCard` in review queue (P1)
- Fitness template session generation bypasses `proposed_actions` (P1)
- 4 action types have no apply path after director approval (P1)

---

## Parent/Player Safety Score — Detailed

**Score: 8 (unchanged)**

Strengths:
- `parentSafeResponseRules.ts` enforces raw note blocking at library level
- `observationVisibilityGuardrails.ts` gates observation visibility
- `donnaBoundaryResponses.ts` intercepts boundary violations
- `block_unsafe_parent_visibility_request` implemented and wired
- Sprint 627 blocking fires for raw coach notes to parents in chat

Gap: No formal end-to-end test suite verifies these rules under all inputs. Runtime enforcement is code-level only.

---

## Voice Readiness Score — Detailed

**Score: 3 (unchanged)**

- Browser `SpeechRecognition` (Chrome/Edge only)
- `continuous=false` — ends on silence
- No auto-restart when recognition ends unexpectedly
- No transcript editing UI
- No name correction memory
- No "ready to listen" preload state
- No mobile voice layout

**Sprints 641-650 planned for this block.**

---

## Mobile Usability Score — Detailed

**Score: 3 (unchanged)**

- Director portal uses fixed sidebar (`w-60`) — not mobile-optimized
- DONNA shell on `/director/donna` is `560px` fixed height
- No bottom tab bar for director role
- Mobile phone cannot effectively access DONNA COO features

**Sprints 661-664 planned for mobile polish.**

---

## P0 Gaps — Status After Sprint 630

| Gap | Status |
|---|---|
| KPI page has no DONNA presence | Addressed (Sprints 621-622) — chat answers KPI questions |
| Players directory has no DONNA | Addressed (Sprint 624) — roster attention answered with named players |
| Main dashboard has no DONNA answer | Addressed (Sprint 623) — dashboard priority answers wired |
| Intent classifier keyword-only (9 families) | Partially addressed (Sprint 626) — 13 families, still regex-based |
| No cross-page context | Addressed (Sprint 625) — session memory persists across navigation |

**Remaining P0 gaps: 0** (all addressed or partially addressed)

---

## Remaining P1 Gaps

| Gap | Sprint Plan |
|---|---|
| /director/players/[playerId] has no inline DONNA chat shell | Sprint 631+ (review center priority first) |
| DonnaLevelMovementApplyControls not wired to review queue | Sprint 634 |
| Fitness template generation bypasses proposed_actions | Sprint 636 scope |
| execute_approved_action() missing 4 action types | Sprint 634-636 |
| /director/coaches/[coachId] has no DONNA entry point | Sprint 659 |
| Voice ends on silence (continuous=false) | Sprint 641 |
| No transcript editing UI | Sprint 644 |
| KPI trend attribution not wired | Deferred to P2 |
| /director/curriculum/builder only page-context level | Sprint 629 addressed presence; full builder DONNA is P2 |

---

## Next Recommended Sprints

**Sprint 631 — Universal Review Center Command View**
The review center is the most important approval surface. Filters, risk labels, and visibility impact must be visible before the apply paths (Sprints 634-636) can be built.

**Sprint 632-640 — Review Center + Approval Execution**
Level movement apply, parent summary review, curriculum draft review, badge/mission, video visibility, knowledge promotion, audit trail.

---

## Honest Readiness Statement

DONNA is **pilot-approaching** as a director intelligence assistant. The conversational foundation is solid — KPI explainer, dashboard priority, roster attention, clarification, action previews, and cross-page memory all work. The intent classifier covers 13 intent families and correctly blocks unsafe requests.

What DONNA is NOT yet:
- A full conversational COO — it answers specific question types, not open-ended strategic questions
- Mobile-ready for director use
- Voice-reliable (ends on silence, no name correction)
- Connected through the full review/apply pipeline for all action types

AcademyOS is **not yet ready for premium V1 controlled testing** but is ready for **internal director walkthrough** of the DONNA conversational path on `/director/donna`.
