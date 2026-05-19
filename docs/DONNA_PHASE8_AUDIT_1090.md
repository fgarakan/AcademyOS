# Sprint 1090 — DONNA Phase 8 Audit V1

## Phase 8 Scope

Sprints 1090–1101. DONNA Final Form Foundation — ensure DONNA works coherently across all four role portals as a demonstration-ready system.

---

## Existing DONNA Infrastructure

### Director DONNA — `/director/donna`

- **Page:** `src/app/director/donna/page.tsx` (337 lines) — Server Component
- **Shell client:** `src/app/director/donna/DonnaDirectorShellClient.tsx` — renders `DonnaVoiceReadyShell`
- **Context loader:** `src/lib/donna/directorDonnaContext.ts` — loads attention items, academy risks, recommended actions, pending reviews, missing wrap-ups, today's sessions
- **Navigation:** Director sidebar (`SidebarNav.tsx`) has DONNA link at position 7
- **Features:** Voice-capable shell (`DonnaVoiceReadyShell`), context summary card, attention items list with urgency colors, academy risk flags, recommended action cards, quick links grid, review queue surface
- **Status:** Fully built and wired. No missing entries.

### Coach DONNA — `/coach/donna`

- **Page:** `src/app/coach/donna/page.tsx` (320 lines) — Server Component
- **Shell client:** `src/app/coach/donna/CoachDonnaShellClient.tsx` — renders `DonnaVoiceReadyShell` with coach role
- **Context loader:** `src/lib/donna/coachDonnaContext.ts` — loads today's sessions, missing wrap-ups, pending submissions, active session
- **Navigation:** NOT in coach `BottomTabBar` (only Home, Players, Sessions). Accessible via floating `DonnaAssistantButton` or direct URL.
- **Features:** Voice-capable shell, context summary card, session status cards, recommended actions, quick action links
- **Status:** Page fully built. **Gap: no tab entry in coach layout. Coaches must discover DONNA through floating button only.**

### Player Ask DONNA — `/player/ask-donna`

- **Page:** `src/app/player/ask-donna/page.tsx` (201 lines) — Server Component
- **Client component:** `src/components/player/DonnaChat.tsx` — chip-based interaction, 'use client'
- **Navigation:** Player `BottomTabBar` tab 4 — "Ask DONNA" with `donna` (MessageCircle) icon
- **Features:** 5 chips (What should I work on? / How do I level up? / What should I practice today? / How am I doing? / I feel stuck), guardrails shield notice, helpful pages links, player auth via `profile_id`
- **Status:** Fully built. No gaps.

### Parent Ask DONNA — `/parent/ask-donna`

- **Page:** `src/app/parent/ask-donna/page.tsx` (226 lines) — Server Component
- **Client component:** `src/components/player/ParentDonnaChat.tsx` — chip-based interaction, 'use client'
- **Navigation:** Parent `BottomTabBar` tab 5 — "DONNA" with `donna` (MessageCircle) icon
- **Features:** 5 chips (Support at home / After practice / How is my child progressing? / Should I be worried? / Help with motivation), guardrails shield notice, helpful links, guardian chain auth
- **Status:** Fully built. No gaps.

---

## Component Library

`src/components/donna/` — 55+ components including:
- `DonnaVoiceReadyShell.tsx` (228 lines) — voice + chat orchestration shell
- `DonnaChatThread.tsx` (318 lines) — full chat message thread with quick actions
- `DonnaAssistantShell.tsx` (167 lines) — base role-aware shell
- `DonnaContextSummaryCard.tsx` — context source status card
- `DonnaReviewQueueSurface.tsx` — review queue integration
- `DirectorDonnaDailyBrief.tsx` — daily brief card component
- `DONNACOOIntelligencePanel.tsx` — COO intelligence panel
- `DONNAAcademyPulseCard.tsx` — academy pulse summary
- `DONNAWrapUpCoverageTracker.tsx` — wrap-up coverage status
- `CoachDonnaSessionPanel.tsx` — coach session DONNA surface
- `DONNADirectorMobileCommandBar.tsx` — mobile command bar for director

`src/lib/donna/` — 80+ lib files including:
- `directorDonnaContext.ts` — director context loader
- `coachDonnaContext.ts` — coach context loader
- `donnaIntentClassifier.ts` — intent classification
- `donnaNBAEngine.ts` — next-best-action engine
- `donnaSuggestedQuestions.ts` — role-based suggested questions
- `donnaSafeReadActions.ts` — safe read action dispatcher
- `donnaBoundaryResponses.ts` — boundary response builder
- `donnaRoleBoundaries.ts` — role permission boundaries
- `donnaChatSessionMemory.ts` — in-session chat memory
- `useVoiceDictation.ts` — voice dictation hook
- `useSpeechOutput.ts` — speech output hook

---

## Gap Analysis

| Gap | Impact | Priority |
|---|---|---|
| Coach DONNA has no tab in BottomTabBar | Coaches discover DONNA only via floating button | High |
| Coach DONNA session prep context could be richer | Session brief is functional but sparse | Medium |
| Director DONNA daily brief card not surfaced prominently | `DirectorDonnaDailyBrief` component exists but may not be wired | Medium |
| Player DONNA has only 5 chips — limited coverage | Players with edge-case questions get no guidance | Low |
| Parent DONNA has only 5 chips — limited coverage | Parents with specific questions get no guidance | Low |
| No DONNA demo flow document | Demo requires a coherent narrative across roles | Medium |
| Cross-role DONNA navigation not cross-linked | No way to see how DONNA differs by role | Low |

---

## Phase 8 Sprint Plan

| Sprint | Deliverable | Files |
|---|---|---|
| 1090 | DONNA Phase 8 Audit V1 (this sprint) | `docs/DONNA_PHASE8_AUDIT_1090.md` |
| 1091 | Coach DONNA Tab Entry V1 — add DONNA as 4th tab in coach layout | `src/app/coach/layout.tsx` |
| 1092 | Coach DONNA Session Brief Polish V1 — richer session context cards | `src/app/coach/donna/page.tsx` |
| 1093 | Director DONNA Daily Brief Integration V1 — wire `DirectorDonnaDailyBrief` into the director DONNA page | `src/app/director/donna/page.tsx` |
| 1094 | Director DONNA Recommended Actions Polish V1 — improve action card layout and urgency display | `src/app/director/donna/page.tsx` |
| 1095 | Player DONNA Chip Expansion V1 — add 3 more chips (preparation, mindset, after match) | `src/app/player/ask-donna/page.tsx` |
| 1096 | Parent DONNA Chip Expansion V1 — add 3 more chips (about practices, when to talk to coach, celebrate wins) | `src/app/parent/ask-donna/page.tsx` |
| 1097 | DONNA Guardrail Consistency Pass V1 — verify guardrail notices are correct and consistent across all 4 roles | Audit only — doc output |
| 1098 | Director DONNA Academy Pulse Card V1 — wire `DONNAAcademyPulseCard` into director DONNA page | `src/app/director/donna/page.tsx` |
| 1099 | Coach DONNA Wrap-Up Coverage Tracker V1 — wire `DONNAWrapUpCoverageTracker` into coach DONNA page | `src/app/coach/donna/page.tsx` |
| 1100 | DONNA Demo Flow V1 — narrative demo document covering all 4 roles | `docs/DONNA_DEMO_FLOW_1100.md` |
| 1101 | DONNA Final QA V1 — safety audit, navigation audit, role boundary verification | `docs/DONNA_FINAL_QA_1101.md` |

---

## Safety Baseline (current state)

| Rule | Director DONNA | Coach DONNA | Player Ask DONNA | Parent Ask DONNA |
|---|---|---|---|---|
| No raw coach observation content | PASS — context uses counts/types only | PASS | PASS | PASS |
| No rankings displayed | PASS | PASS | PASS | PASS |
| No UTR display | PASS | PASS | PASS | PASS |
| No player comparisons | PASS | PASS | PASS | PASS |
| No external AI API calls | PASS — deterministic | PASS — deterministic | PASS — static chips | PASS — static chips |
| Role auth gate | PASS — academy_id + profile | PASS — academy_id + profile | PASS — profile_id → players | PASS — guardian chain |
| Guardrails notice | n/a (staff role) | n/a (staff role) | PASS — Shield notice | PASS — Shield notice |
| No automatic actions | PASS — read-only page | PASS — read-only page | PASS | PASS |

---

## TypeScript

Clean — no files modified this sprint.
