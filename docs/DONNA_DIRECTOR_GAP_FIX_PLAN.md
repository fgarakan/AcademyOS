# DONNA Director Gap Fix Plan

**Sprint:** 604A
**Date:** 2026-05-21
**Based on:** DONNA_DIRECTOR_CONNECTIVITY_AUDIT.md, DONNA_DIRECTOR_COVERAGE_MATRIX.md, DONNA_DIRECTOR_ACTION_REGISTRY_AUDIT.md

---

## Priority definitions

| Priority | Criteria |
|---|---|
| **P0 — Pilot blocker** | High-stakes decision page with no DONNA guidance; library already exists; gap is a wiring failure, not a build |
| **P1 — V1 essential** | Significant director workflow without DONNA; medium complexity to fix; no blocking risks if missing at pilot |
| **P2 — Enhancement** | Useful improvement; low urgency; safe to defer post-pilot |

---

## P0 — Pilot blockers (fix before first pilot session)

### P0-1: Wire `donnaLevelMovementActions.ts` to `/director/level-up`

**Gap:** `donnaLevelMovementActions.ts` exists with a correct approval gate, but there is no UI entry point on the level-up pipeline page. Directors cannot trigger a level advancement draft from the UI.

**Impact:** Level advancement is a high-stakes, irreversible decision. Directors currently have no DONNA-assisted path to propose or explain level movements.

**Fix:** Add a "Draft level advancement" action button per player row on `/director/level-up`. Wire it to `donnaLevelMovementActions.ts`. Output routes to review queue.

**Files to touch:** `src/app/director/level-up/page.tsx` or its client component
**Approval already required:** ✅ Yes (in action file)
**Sprint estimate:** 1 sprint

---

### P0-2: Wire `kpiExplainer.ts` to `/director/kpi`

**Gap:** `kpiExplainer.ts` exists in the DONNA library but is not wired to the KPI dashboard. Directors see red/amber KPIs with no DONNA explanation of cause or recommended action.

**Impact:** KPI page is the primary performance signal surface. Without DONNA, directors cannot interpret signals without manual analysis.

**Fix:** Add a DONNA explainer chip to each KPI card. Calls `kpiExplainer.ts` with the KPI name + current value. Also wire `groupKpiSummaryAction.ts` to feed computed group KPIs into DONNA context.

**Files to touch:** `src/app/director/kpi/page.tsx`, new `DonnaKpiExplainerChip` component
**Approval required:** N/A (read-only explanations)
**Sprint estimate:** 1 sprint

---

### P0-3: DONNA roster intelligence chip on `/director/players`

**Gap:** The players directory has zero DONNA presence. Directors cannot ask "who should I focus on today?" or "which players are at risk?" from the roster list.

**Impact:** Roster triage is a daily director task. Without DONNA, this requires navigating to individual profiles before understanding priority.

**Fix:** Add a `DonnaRosterIntelligencePanel` at the top of the players list. Uses `AcademyContext.attentionItems` (already loaded in `loadDirectorDonnaContext`) to surface players needing director attention, with deep links to their profiles.

**Files to touch:** `src/app/director/players/page.tsx` or its client component
**Approval required:** N/A (read-only)
**Sprint estimate:** 1 sprint

---

### P0-4: DONNA placement suggestion on `/director/placement`

**Gap:** The placement engine has no DONNA guidance. `placementDraftAction.ts` exists but no UI entry point is visible. Directors make level/group placement decisions without DONNA recommendation.

**Impact:** Placement is a high-stakes, first-impression decision. DONNA could surface recommendation based on interview assessment answers.

**Fix:** Add a DONNA suggestion step after the interview completion. Wire `placementDraftAction.ts` to a visible "Get DONNA recommendation" button. Draft routes to review queue for director approval.

**Files to touch:** `src/app/director/placement/page.tsx` or its client component
**Approval already required:** ✅ Yes (`finalize_player_placement()` is gated)
**Sprint estimate:** 2 sprints (context shape + UI wiring)

---

## P1 — V1 essential (fix before wide rollout)

### P1-1: DONNA signal narrator on `/director/signals`

**Gap:** The signals page is data-only. Directors see attendance drops, wrap-up gaps, and lesson signals with no DONNA narrative or recommended action.

**Fix:** Add a `DonnaSignalNarratorPanel` to each signal section. Calls `donnaContextActions` with signal type + affected group. Returns recommended director action for each signal type.

**Files to touch:** `src/app/director/signals/page.tsx` or client component
**Sprint estimate:** 1 sprint

---

### P1-2: DONNA inline Q&A chip on `/director/players/[playerId]`

**Gap:** Player profile has multiple DONNA draft buttons but no chat shell. Directors cannot ask "DONNA, what should I do for this player today?" inline.

**Fix:** Add `DonnaPlayerChatShell` to the player profile page. Accepts PlayerContext (already available on the page). Renders a collapsed chip that expands to a contextual Q&A surface.

**Files to touch:** `src/app/director/players/[playerId]/page.tsx`, new `DonnaPlayerChatShell` component
**Sprint estimate:** 1 sprint

---

### P1-3: Add review gate to fitness template session generation

**Gap:** `/director/fitness/templates/[templateId]` — `GenerateSessionPanel` creates sessions directly without routing through `proposed_actions`. This is a medium-risk process gap where a DONNA-generated session applies without director approval.

**Fix:** Route generated sessions through `proposed_actions` with `target_module: 'session_generation'`. Add a review card type for session generation drafts.

**Files to touch:** `src/app/director/fitness/templates/[templateId]/page.tsx` or its actions
**Sprint estimate:** 2 sprints (proposed_actions type + review card)

---

### P1-4: DONNA "what should I do first?" on main dashboard

**Gap:** The main dashboard has a partial DONNA presence (`DonnaExecutiveCard`) but cannot answer "what should I do first?" or explain what each KPI means.

**Fix:** Add a `DonnaFirstActionChip` to the dashboard. Calls `loadDirectorDonnaContext()` (already available) and summarizes the top 3 actions as clickable chips linking to the relevant routes.

**Files to touch:** `src/app/director/page.tsx` or its client components
**Sprint estimate:** 1 sprint

---

### P1-5: DONNA curriculum builder guidance for `/director/curriculum/builder`

**Gap:** The curriculum builder has zero DONNA presence. Directors setting up a new curriculum have no DONNA context, suggestions, or guardrails.

**Fix:** Add a DONNA guidance panel to each builder step. For each step, DONNA provides a brief explanation of what the director is configuring and what best-practice choices look like.

**Files to touch:** `src/components/curriculum/CurriculumSetupBuilder` (or its step subcomponents)
**Sprint estimate:** 2 sprints

---

### P1-6: DONNA coach intelligence wiring for `/director/coaches/[coachId]`

**Gap:** `donnaCoachIntelligenceAction.ts` exists but no UI entry point on coach profile pages. Directors reviewing a coach's wrap-up compliance or session history cannot ask DONNA for a summary.

**Fix:** Add a `DonnaCoachIntelligencePanel` to the coach profile page. Calls `donnaCoachIntelligenceAction.ts` with the coachId. Returns wrap-up compliance summary, session coverage, and recommended director follow-up.

**Files to touch:** `src/app/director/coaches/[coachId]/page.tsx`
**Sprint estimate:** 1 sprint

---

## P2 — Enhancements (post-pilot improvements)

### P2-1: Inline DONNA Q&A on review draft cards

**Gap:** Directors reviewing a draft card cannot ask DONNA "why did you suggest this?" The rationale is embedded in the card but not interactive.

**Fix:** Add a collapsed DONNA Q&A chip to each draft card that can display the stored DONNA rationale and allow follow-up questions.

**Requires:** `proposed_actions.donna_rationale` field (schema addition) — needs migration
**Sprint estimate:** 2 sprints (migration + UI)

---

### P2-2: DONNA sessions list intelligence panel

**Gap:** The sessions list has no DONNA presence. Directors cannot ask "which sessions have missing wrap-ups?"

**Fix:** Add a `DonnaSessionsIntelligenceChip` to the sessions list header. Surfaces sessions with missing wrap-ups, unconfirmed attendance, and sessions from this week with no coach assigned.

**Sprint estimate:** 1 sprint

---

### P2-3: DONNA curriculum level deep context (requirement drill-down)

**Gap:** On `/director/curriculum`, DONNA does not know which level is expanded or its requirement detail.

**Fix:** Pass selected `levelId` to `CurriculumCustomizationAssistant` on level expand. Wire `donnaContextActions` `curriculum_level` type to the selected level.

**Sprint estimate:** 1 sprint

---

## Recommended next 10 DONNA fix sprints

| Sprint | Label | Priority | Complexity |
|---|---|---|---|
| **Sprint 605** | Wire `donnaLevelMovementActions.ts` to `/director/level-up` UI | P0 | Low |
| **Sprint 606** | Wire `kpiExplainer.ts` + KPI chip on `/director/kpi` | P0 | Low |
| **Sprint 607** | DONNA roster intelligence panel on `/director/players` | P0 | Low |
| **Sprint 608** | DONNA "what should I do first?" chip on main dashboard | P1 | Low |
| **Sprint 609** | DONNA signal narrator on `/director/signals` | P1 | Low |
| **Sprint 610** | DONNA inline Q&A chip on `/director/players/[playerId]` | P1 | Medium |
| **Sprint 611** | DONNA coach intelligence panel on `/director/coaches/[coachId]` | P1 | Low |
| **Sprint 612** | Add review gate to fitness template session generation | P1 | Medium |
| **Sprint 613** | DONNA placement suggestion wiring | P0 | High |
| **Sprint 614** | DONNA curriculum builder step guidance | P1 | Medium |

---

## Risk summary

| Risk | Severity | Route | Status |
|---|---|---|---|
| Level advancement library not surfaced to director | **High** | `/director/level-up` | P0 — fix before pilot |
| Fitness template sessions bypass review queue | **Medium** | `/director/fitness/templates/[id]` | P1 |
| Placement decisions without DONNA guidance | **Medium** | `/director/placement` | P0 |
| No DONNA on KPI page | **Medium** | `/director/kpi` | P0 |
| No DONNA on roster page | **Medium** | `/director/players` | P0 |
| No DONNA on signals page | **Medium** | `/director/signals` | P1 |
| Coach intelligence action not wired | **Low** | `/director/coaches/[coachId]` | P2 |
| No DONNA in curriculum builder | **Low** | `/director/curriculum/builder` | P1 |

---

## What does not need DONNA

The following routes are correctly DONNA-free and should not have DONNA added:

- `/director/settings` — Academy settings form; no coaching decisions
- `/director/parents` — Parent linking; no coaching decisions
- `/director/pilot-readiness` — Checklist; no DONNA actions appropriate
- `/director/curriculum/learning` — Read-only preview; no director decisions

Adding DONNA to these routes would create noise without value.
