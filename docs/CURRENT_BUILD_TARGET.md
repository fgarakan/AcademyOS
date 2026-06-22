# Current Build Target

**Last updated:** 2026-06-22
**Current phase:** Director Pilot Readiness — Brian Dabul (Dabul Tennis Academy) Pilot

---

## Active target

**Latest completed: Mega Sprint 3511–3540 — Director Operating Session V1 / Executive Partnership (2026-06-22, uncommitted)**

Promoted the canonical concept to the **Executive Partnership** layer. Every way a director begins a session — floating widget, full `/director/donna` page, a typed "good morning", "I'm back" after lunch, "ready", "let's begin", a return tomorrow — converges on ONE composer (`resumeExecutivePartnership`) and resumes the same executive working relationship: situation awareness → recommended first action → guide-to-completion. The Operating Session is simply the mechanism by which the partnership resumes. Convergence over creation — no new lifecycle, no duplicated state, no second greeting system, no OpenAI pathway, no migration. Reuses the three existing lifecycle stores (`donnaDailyGreeting`, `donnaLastSessionStore`, `donnaChatSessionMemory`), RealitySnapshot, the Completion Contract, Executive Presence, and Conversation DNA.

> **Operating Principle (permanent):** "DONNA maintains continuous executive partnerships, not isolated conversations."
> **Operating Law #2:** "Every interaction resumes an executive operating relationship, never a chat session." (companion to Law #1 — "never answer and leave").

### Recent completed arc

| Sprint | Title | Theme |
|---|---|---|
| 3271–3300 | ONE DONNA OS Convergence | One canonical router, brain, gateway, RealitySnapshot, layered memory |
| 3301–3330 | Adaptive COO Operating Day | DONNA operates the day; director reduced to approve / reject / adjust / prioritize / override / ask-why / done |
| 3331–3360 | Atomic Loop Usability Test Mode | 10 atomic loops made structurally test-ready; Brian pilot test script written |
| 3361–3390 | ONE DONNA Executive Experience Convergence | Executive Communication refinement layer wired fail-open; 51/51 certified |
| 3391–3420 | ONE DONNA Guided Completion Convergence | Three completion systems converged behind one contract; "never answer and leave" guaranteed in the director pipeline |
| 3451–3480 | ONE DONNA Conversation Convergence | One Conversation DNA so every DONNA reply sounds like the same academy COO; 30/30 certified |
| 3481–3510 | DONNA COO Presence | COO intelligence (Opinion · Tradeoff · Memory · Proactive) surfaced by default on every director turn, no magic phrases; 21/21 certified |
| 3511–3540 | Director Operating Session / Executive Partnership | Every entry point resumes one executive partnership via a single composer; greeting → situation awareness → first action → guide-to-completion; 47/47 certified |

### Current truth

- **ONE DONNA pipeline is converged** — every entry point (floating widget, expanded `/director/donna`, coach, voice, page panels, both live server actions) runs the same pipeline: one canonical router (`donnaCanonicalRouter`), one brain (`processDonnaMessage`), one OpenAI gateway (`donnaOpenAIGateway`).
- **OpenAI Executive Communication is live** — `donnaExecutiveCommunicationLayer.ts` runs as a presentation-only, fact-preserving final step in both director conversation actions. Fail-open: no API key / timeout / error → original grounded answer (worst case = today's experience).
- **Completion Contract is live in the director pipeline** — `enforceCompletionContract` (`src/lib/donna/completion/`) runs between the brain and the Executive layer in both the live and strategic director actions. It converges the three completion systems (Form Guided, Goal Session, Page Execution Guidance) behind one canonical contract. Additive and fail-safe: it only ever fills a missing `nextAction`/`followUpQuestion` when the state is not COMPLETE, never altering response, recommendations, `requiresApproval`, `action`, confidence, navigation, or safety.
- **Conversation DNA is live** — one canonical voice contract (`donnaConversationDNA.ts`) applied through the Executive Communication Layer, so every DONNA reply sounds like the same experienced academy COO (first-person, 5-beat rhythm Acknowledge→Interpret→Recommend→Explain→Guide). Fact-preserving and fail-open; 30/30 certified.
- **Executive Presence is live by default** — `enforceExecutivePresence` (`donnaExecutivePresenceContract.ts`) runs between the Completion Contract and the Executive Communication Layer on every director turn. Pipeline: processDonnaMessage → completion → executive presence → executive refinement → director. Additive, relevance-gated, idempotent, fail-safe; never alters facts, recommendations, `action`, `requiresApproval`, navigation, or any structured field. 21/21 certified.
- **COO intelligence is surfaced without magic phrases** — Opinion · Tradeoff · Memory · Proactive are now presented by default on every relevant turn, no longer gated behind prompts like "what should I do today" / "give me COO insights". The intelligence was already built; this convergence layer just surfaces it.
- **Every interaction resumes an executive partnership** — Operating Law #2. A greeting / "I'm back" / "ready" / "let's begin" / first-open-of-day / return-after-inactivity is never a chat start; it resumes the same working relationship via one canonical composer (`resumeExecutivePartnership`, `src/lib/donna/conversation/donnaExecutivePartnership.ts`) across the floating widget, the `/director/donna` page, and the server pipeline. Reuses the three existing lifecycle stores — no new lifecycle, no duplicated state, no second greeting system.
- **DONNA should never answer and leave** — Operating Law #1. The completion contract makes "no dangling conversations" a structural guarantee (`resolveCompletionTurn` is total over intent × contract), not a per-prompt hope.
- **RealitySnapshot remains the source of truth** — refinement, completion, and presence are presentation/guidance-only and may never alter facts, reality, or recommendations.
- **10 atomic loops are structurally test-ready** — route · primary action · DONNA guidance · completion path · approval guardrails · no fake completion, all certified (60/60).
- **Next priority is real usability testing, not new architecture** — the spine is converged and certified; the gap now is real-world usability validation, not new engines, routers, pathways, or conversation layers.

**Next recommended action:** Run an internal guided-completion test pass across all 10 atomic loops (`docs/testing/ATOMIC_LOOP_USABILITY_TEST_PLAN.md`), then run the Brian Dabul pilot (`docs/testing/BRIAN_DABUL_PILOT_TEST_SCRIPT.md`). No migrations pending.

> Note: the historical sections below (Mega Sprint 554–603 and earlier) are retained for reference. They predate the 3000-series convergence work and do not describe the current target. Trust this header and `docs/CHANGELOG.md`.

---

## Director Pilot Readiness — Brian Dabul (Dabul Tennis Academy)

**Status: SHIP-READY for hands-on pilot testing. The active work is real-world usability validation, not new architecture.**

### Why the spine is done
- ONE DONNA pipeline converged across every entry point — one canonical router (`donnaCanonicalRouter`), one brain (`processDonnaMessage`), one OpenAI gateway (`donnaOpenAIGateway`), one `realitySnapshot`, layered memory.
- Executive Communication refinement runs by default in Pilot Mode, fail-open and fact-preserving — worst case (no key / timeout / error / fact-altering rewrite) falls back to today's grounded answer.
- RealitySnapshot is the authoritative source of truth — refinement is presentation-only.

### Certification (all green)
| Certification | Result |
|---|---|
| `pilotModeExecutiveRefinementCertification` | 36/36 |
| `oneDonnaExecutiveConversationCertification` | 51/51 |
| `atomicLoopUsabilityCertification` (10 loops) | 60/60 |
| `oneDonnaOperatingSystem` | 45/45 |
| `adaptiveCOOOperatingDay` | 144/144 |
| `donnaExecutiveExperience` | 87/87 |

Only known red: `philosophyCertification` 36/37 — pre-existing, unrelated (imports none of the converged files).

### Pilot test artifacts (use these to run the pilot)
- `docs/testing/ATOMIC_LOOP_USABILITY_TEST_PLAN.md` — per-loop manual steps, pass/fail, severity, DONNA-quality + cognitive-load scoring.
- `docs/testing/BRIAN_DABUL_PILOT_TEST_SCRIPT.md` — plain-English pilot walkthrough for Brian.
- `docs/testing/ATOMIC_LOOP_TEST_READINESS_REPORT.md` — readiness, blockers, limitations, recommendation (**test now**).

### Known limitations (deferred — not pilot blockers)
- No dedicated coach-reassignment screen.
- Exception specificity is coarse in places.
- Durable learning persistence is not yet wired.
- `OPENAI_API_KEY` unset → safe fallback (grounded answer, no refinement).
- DONNA answers > ~480 chars skip executive refinement (size-bounded guard).

### Next recommended action
1. Run an internal guided-completion pass across all 10 atomic loops (`ATOMIC_LOOP_USABILITY_TEST_PLAN.md`).
2. Run the Brian Dabul pilot (`BRIAN_DABUL_PILOT_TEST_SCRIPT.md`).
No migrations pending.

---

## Mega Sprint 503–552 — COMPLETE

| Phase | Commits | Sprints | Content |
|---|---|---|---|
| Phase 1 (503–517) | `534b070` | 15 | Curriculum Experience Core — command center, visual map, expandable tree, node drawer, content types, DONNA context, drill/skill/mission/badge/parent guidance/coach cue/assessment/evidence models |
| Phase 2 (518–527) | `217605f` | 10 | Curriculum Coverage Intelligence — coverage model, gap analysis, domain balance, stage progression, level health, requirement progress aggregator, template connections, player intersection, health dashboard, recommendations |
| Phase 3 (528–537) | `0698af0` | 10 | Global Knowledge Library — types, library view, review queue, promotion path, tagging, search, privacy guards, DONNA interface, similarity detector, audit log |
| Phase 4 (538–545) | `0b52d74` | 8 | Knowledge Ingestion Classification — ingestion types, classifier, voice ingestion, structured import, source validator, ingestion dashboard, curriculum bridge, ingestion report |
| Phase 5 (546–552) | `5da73cb` | 7 | Knowledge Retrieval Intelligence — retrieval model, curriculum intelligence, answerability model, knowledge QA, knowledge index, curriculum knowledge panel view, mega-sprint QA harness |

All phases: pure TypeScript — no migrations, no RLS changes, no new dependencies.

---

## Mega Sprint 452–502 — COMPLETE

| Phase | Commits | Sprints | Content |
|---|---|---|---|
| Phase 1 (452–461) | `0ceca70` | 10 | Responsive UX — shell configs, nav, mobile/desktop patterns, empty states, state patterns, quick actions |
| Phase 2 (462–471) | `9c4b79b` | 10 | DONNA COO — conversation core, academy knowledge, director briefing, KPI model + explainer, task flows, search, action preview, preferences, voice+text unification |
| Phase 3 (472–481) | `40a855a` | 10 | Director Command Center — attention queue, KPI dashboard, approval flow helpers, curriculum operating view, template library helpers, group intelligence, curriculum inbox |
| Phase 4 (482–491) | `c6f804c` | 10 | Coach/Parent/Player Portals — coach KPI summary, portal assembly, voice-to-curriculum bridge, parent portal summary, comms prefs, player portal experience, progress indicators, visibility controls |
| Phase 5 (492–502) | `b0b0f73` | 11 | Badges + Mental + Curriculum + V1 Launch — badge model, eligibility engine, mental performance path, mission model + engine, voice curriculum classifier, curriculum draft helpers, V1 demo QA, pilot launch package |

All phases: pure TypeScript — no migrations, no RLS changes, no new dependencies.

---

## What is now available (new modules — library layer only)

### Responsive UX Layer (`src/lib/ux/`)
- `responsiveShell.ts` — BREAKPOINTS, ShellConfig, SHELL_CONFIGS, getShellVariantForRole
- `navConfigs.ts` — typed nav items for all 4 roles
- `mobilePatterns.ts` — TAP_TARGET, BottomSheetConfig, FAB_CONFIGS, STICKY_ACTION_BAR
- `desktopPatterns.ts` — DESKTOP_LAYOUT, SIDE_DRAWER, DONNA_PANEL, ACTIVITY_FEED
- `emptyStateConfigs.ts` — 17 empty state configs across 4 roles
- `statePatterns.ts` — 28 typed loading/error/success states
- `quickActions.ts` — 12 typed quick actions with role gates

### DONNA COO Layer (`src/lib/donna/`, `src/lib/kpis/`)
- `conversation/index.ts` — ConversationState, DONNA_ROLE_BLOCKS, trust stack, boundary builders
- `academyKnowledge/index.ts` — 14 knowledge areas with sensitivity/visibility gates
- `briefings/directorBriefing.ts` — 7-section daily briefing builder
- `kpiExplanations/kpiExplainer.ts` — healthy/warning/critical templates for all 12 KPIs
- `taskFlows/index.ts` — 10 multi-turn task flows
- `search/academySearch.ts` — role-scoped multi-area search
- `actionPreview/actionPreviewCards.ts` — preview cards with risk level
- `preferences/academyPreferences.ts` — academy-level preferences + applyCustomTerminology
- `kpis/academyKpiModel.ts` — 12 KPI definitions with metadata and thresholds

### Director Command Center Layer (`src/lib/director/`)
- `attentionQueue/index.ts` — prioritised director attention queue
- `kpiDashboard.ts` — KPI dashboard view model builder
- `approvalFlowHelpers.ts` — urgency scoring and grouping for review queue
- `curriculumOperatingView.ts` — weekly curriculum delivery view
- `templateLibraryHelpers.ts` — template filtering, compliance rollup
- `groupIntelligence.ts` — group risk signals and recommendations

### Curriculum Intelligence (`src/lib/curriculum/`)
- `inbox/index.ts` — voice-to-curriculum idea queue with similarity detection
- `mentalPerformance.ts` — mental competency definitions for all 5 curriculum stages
- `curriculumDraftHelpers.ts` — curriculum change proposal builder

### Coach Portal Layer (`src/lib/coach/`)
- `coachKpiSummary.ts` — coach-level KPI rollup
- `coachPortalAssembly.ts` — coach mobile portal view model
- `voiceCurriculumBridge.ts` — coach voice/text → curriculum inbox → director approval

### Parent Portal Layer (`src/lib/parent/`)
- `parentPortalSummary.ts` — parent-safe portal view model builder
- `parentCommunicationPreferences.ts` — communication preference types + validation

### Player Portal Layer (`src/lib/player/`)
- `playerPortalExperience.ts` — player-facing experience view model
- `progressIndicators.ts` — completion %, level bands, milestones, motivation line
- `visibilityControls.ts` — centralised content visibility gates for parent/player
- `missionModel.ts` — 10 player mission definitions
- `missionEngine.ts` — mission eligibility + recommendation engine

### Badge System (`src/lib/badges/`)
- `badgeModel.ts` — 10 badge definitions with rarity, criteria, visibility
- `badgeEligibilityEngine.ts` — badge status computed from player progress

### Voice (`src/lib/voice/`)
- `voiceCurriculumClassifier.ts` — deterministic curriculum intent classifier

### Demo / Pilot (`src/lib/demo/`)
- `v1DemoQa.ts` — 22-check V1 demo quality harness
- `pilotLaunchPackage.ts` — 30-item pilot launch checklist

---

## UI wiring status (historical reference — superseded by the pilot-readiness section above)

> This table predates the 3000-series convergence and is no longer the active work plan. It is kept only as a wiring map. Verified status as of 2026-06-05 (`docs/qa/BUILD_TARGET_STALENESS_AUDIT_V1.md`):

| Module | Wires to | Status |
|---|---|---|
| `attentionQueue/` | `/director` hero section | **WIRED** — live in `src/app/director/page.tsx` |
| `kpiDashboard.ts` | `/director` KPI grid | **WIRED** — live in `src/app/director/page.tsx` |
| `groupIntelligence.ts` | `/director/groups` | Not wired — no `/director/groups` route exists |
| `curriculumOperatingView.ts` | `/director/curriculum` | Unverified — route exists, wiring depth unknown |
| `coachPortalAssembly.ts` | `/coach` home page | Unverified |
| `parentPortalSummary.ts` | `/parent` page | Unverified |
| `playerPortalExperience.ts` | `/player` page | Unverified |
| `badgeEligibilityEngine.ts` | `/player` + `/director/players/[id]` | Unverified |
| `missionEngine.ts` | `/player` home card | Unverified |
| `curriculum/inbox/` | `/director/review` curriculum tab | Unverified |

---

## Build order — historical state (all complete)

### Player Profile — COMPLETE (Sprints 100–250)
All 5 tabs complete: Overview · Skill Path · Competition · Fitness/Load · Notes

### Director Dashboard — COMPLETE
Academy Vital Signs, Priority Queue, Alerts, Sessions, Review Queue, DONNA panel

### Coach Workspace — COMPLETE (Sprints 237–249+)
Coach home, sessions, session detail, wrap-up, recap review

### Player Portal — COMPLETE (library layer)
`/player` renders with IDP and Q&A. Experience view model now available via `playerPortalExperience.ts`.

### Parent Portal — COMPLETE (library layer)
`/parent` renders with parent-safe IDP. Summary view model now available via `parentPortalSummary.ts`.

### Voice Intake OS — COMPLETE (Sprints 240–249)
Input → structuring → routing → review queue → safety guardrails

### DONNA COO Foundation — COMPLETE (Sprints 359–378)
Approval contract, role permissions, execution adapter, parent-safe rules, recommendation engine

### Coach Session Recap Intelligence — COMPLETE (Sprints 437–446)
Attendance queries, block execution, voice notes, observation tracker, wrap-up flow

### Player Evidence + Demo Readiness — COMPLETE (Sprints 447–451)
Evidence queries, development profile queries, player/parent portal queries, demo checker

---

## How to confirm the current target before starting

Read this file's header and the **Director Pilot Readiness** section above, then `docs/CHANGELOG.md`. The active work is **hands-on pilot usability testing** of the 10 atomic loops — not new architecture and not the historical UI-wiring plan below. Start from `docs/testing/ATOMIC_LOOP_USABILITY_TEST_PLAN.md`. No migrations pending.
