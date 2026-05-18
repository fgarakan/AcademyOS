# DONNA Role Architecture Audit
Sprint 1002 — 2026-05-18

## Executive Summary

DONNA is a much more complete system than the Sprint 1001 gap audit assumed. Extensive DONNA infrastructure was built across Sprints 362-592+. This document maps all existing DONNA components, surfaces, and role definitions to inform the Sprint 1002-1037 build block.

---

## Existing DONNA Infrastructure

### Core Logic (`src/lib/donna/`)

| File | Purpose | Sprint |
|---|---|---|
| `donnaRoleBoundaries.ts` | Role access rules — coach/director allowed tasks and modes | Pre-1002 |
| `donnaIntentClassifier.ts` | Keyword-based intent classification — 10 categories | 592 |
| `donnaCommandRouter.ts` | Routes intent to preview/proposal handler | 591 |
| `donnaCOOAnswerEngine.ts` | Generates natural-language answers from COO context | 554 |
| `donnaContextRanking.ts` | Ranks context signals by urgency/relevance | Pre-1002 |
| `donnaNBAEngine.ts` | Next-best-action suggestion engine | Pre-1002 |
| `donnaDailyOperatingLoop.ts` | Daily brief generation logic | Pre-1002 |
| `donnaWeeklyOperatingLoop.ts` | Weekly COO report logic | Pre-1002 |
| `donnaSessionMemory.ts` | In-session memory (no persistence) | Pre-1002 |
| `donnaMultiStepFlow.ts` | Multi-step workflow state machine | Pre-1002 |
| `donnaDailyGreeting.ts` | Greeting copy by time of day | Pre-1002 |
| `donnaWrapUpQuestions.ts` | 6-question wrap-up script | Pre-1002 |
| `wrapUpConversationScript.ts` | Wrap-up question flow script | Pre-1002 |
| `wrapUpDraftAdapter.ts` | Adapts wrap-up answers to proposed_actions shape | Pre-1002 |
| `wrapUpReviewSurfaceLoader.ts` | Loads wrap-up review data | Pre-1002 |
| `conversationTypes.ts` | ConversationState, ConversationMessage types | 540 |
| `conversationMessageBuilder.ts` | Builds typed message objects | Pre-1002 |
| `donnaAcademyHealthQuestions.ts` | Health question templates | Pre-1002 |
| `academyHealthLiveStatus.ts` | Live vs demo status for health signals | Pre-1002 |
| `academyHealthSourceMap.ts` | Source labels for health fields | Pre-1002 |
| `playerAttentionRiskLoader.ts` | Player risk signal loader | Pre-1002 |
| `groupHealthLoader.ts` | Group health data loader | Pre-1002 |
| `coachSupportLoader.ts` | Coach support need loader | Pre-1002 |
| `parentTrustLoader.ts` | Parent trust/coverage loader | Pre-1002 |
| `curriculumBottleneckLoader.ts` | Curriculum gap loader | Pre-1002 |
| `weeklyCoOReportLoader.ts` | Weekly COO report loader | Pre-1002 |
| `commandBriefLiveLoader.ts` | Director command brief live data | Pre-1002 |
| `reviewQueueCOOSignal.ts` | Review queue signal for COO | Pre-1002 |
| `playerCOOContext.ts` | Player context for COO surface | Pre-1002 |
| `attendanceApplyGuardrails.ts` | Attendance apply safety rules | Pre-1002 |
| `levelReadinessGuardrails.ts` | Level movement safety rules | Pre-1002 |
| `observationVisibilityGuardrails.ts` | Observation parent-visibility rules | Pre-1002 |
| `sessionActualApplyGuardrails.ts` | Session actual apply safety rules | Pre-1002 |
| `parentDraftApprovalState.ts` | Parent draft approval state machine | Pre-1002 |
| `proposedActionApplyStatus.ts` | Apply status for proposed actions | Pre-1002 |
| `donnaDemoSeed.ts` | Demo seed data (clearly marked) | Pre-1002 |
| `brianDemoDataset.ts` | Pilot demo dataset | Pre-1002 |
| `cooDataStatus.ts` | COO field status types (live/demo/unavailable) | Pre-1002 |
| `cooDemo.ts` | COO demo data builder | Pre-1002 |
| `kpiNextBestActionMap.ts` | KPI-to-action recommendation map | Pre-1002 |
| `pilotFeedbackModel.ts` | Pilot feedback data model | Pre-1002 |
| `useConversationState.ts` | React hook for conversation state | Pre-1002 |
| `useSpeechOutput.ts` | React hook for TTS output | Pre-1002 |
| `useVoiceDictation.ts` | React hook for voice input | Pre-1002 |

### UI Components (`src/components/donna/`)

| File | Purpose |
|---|---|
| `DONNAAnswerCard.tsx` | Answer display with confidence badge + source note |
| `DONNAAnswerHistoryPanel.tsx` | Scrollable answer history |
| `DONNACOOIntelligencePanel.tsx` | Full COO intelligence dashboard panel |
| `DONNACommandPreviewCard.tsx` | Preview before any DONNA action |
| `DONNACommandConfirmation.tsx` | Confirmation UI after director approves |
| `DONNACommandClarification.tsx` | Clarification prompt UI |
| `DONNACommandRejectionBanner.tsx` | Rejection/blocked state banner |
| `DONNAConfidenceDisclosure.tsx` | Confidence disclosure component |
| `DONNAConversationStateDisplay.tsx` | Conversation state machine display |
| `DONNAEmptyStateSurface.tsx` | Empty state — no data / unavailable |
| `DONNAAcademyPulseCard.tsx` | Academy health pulse card |
| `DONNAReviewQueueSummary.tsx` | Review queue signal summary |
| `DONNASessionDebriefCard.tsx` | Session debrief card |
| `DONNAPlayerRiskSurface.tsx` | Player risk surface |
| `DONNAParentCommunicationStatus.tsx` | Parent comms blocked status |
| `DONNAParentUpdateDraftPreview.tsx` | Parent update draft preview |
| `DONNAWrapUpCoverageTracker.tsx` | Wrap-up coverage tracker |
| `DONNAWrapUpMobileHeader.tsx` | Wrap-up mobile header |
| `DONNADirectorMobileCommandBar.tsx` | Director mobile command bar |
| `DONNAVoiceInputButton.tsx` | Voice input button |
| `DONNAApprovalOutcomeExplainer.tsx` | Approval outcome explanation |
| `DONNAPilotDemoNav.tsx` | Pilot demo navigation |
| `DonnaConversationalPanel.tsx` | Chat thread UI for wrap-up conversations |
| `DonnaConversationSummary.tsx` | Conversation summary display |
| `DonnaVoiceWrapUpShell.tsx` | Voice wrap-up shell |
| `CoachSessionVoiceShell.tsx` | Coach session DONNA voice shell |
| `ExecutionAuditTrailPanel.tsx` | Audit trail panel |
| `DirectorExecutionReadinessPanel.tsx` | Director execution readiness |
| `AcademyHealthActionLinks.tsx` | Academy health action quick-links |
| `AcademyTopPrioritiesPanel.tsx` | Academy top priorities panel |
| `ReviewQueueCOOSignalBadge.tsx` | COO signal badge for review queue |
| `PlayerCOOContextPanel.tsx` | Player COO context panel |
| `AttendanceApplyPreview.tsx` | Attendance apply preview |
| `AttendanceApplyConfirmation.tsx` | Attendance apply confirmation |
| `SessionActualApplyPreview.tsx` | Session actual apply preview |
| `SessionActualApplyConfirmation.tsx` | Session actual apply confirmation |
| `LevelReadinessApplyPreview.tsx` | Level readiness preview |
| `ObservationApplyConfirmation.tsx` | Observation apply confirmation |
| `ObservationPlayerProfilePreview.tsx` | Player profile observation preview |
| `CurriculumOverrideApplyPreview.tsx` | Curriculum override preview |
| `CurriculumOverrideRollbackPreview.tsx` | Curriculum override rollback |
| `ParentDraftSendBlockedBanner.tsx` | Parent send blocked banner |
| `VoiceErrorFallback.tsx` | Voice error fallback |
| `VoiceTranscriptReview.tsx` | Voice transcript review |
| `PilotFeedbackReviewPanel.tsx` | Pilot feedback review |

### Assistant Components (`src/components/assistant/`)

| File | Purpose | Sprint |
|---|---|---|
| `DonnaPanelShell.tsx` | Panel shell — NOTE: intentionally empty (Sprint 384); state coupling prevents extraction | 384 |
| `DonnaAssistantButton.tsx` | Full DONNA button + panel; 25+ state values | Pre-1002 |
| `DonnaInputBar.tsx` | DONNA text input bar | Pre-1002 |
| `DonnaDraftLayer.tsx` | Draft state overlay | Pre-1002 |
| `DonnaReviewLayer.tsx` | Review state layer | Pre-1002 |
| `DonnaReviewQueuePanel.tsx` | Review queue panel | Pre-1002 |
| `DonnaDailyBriefCard.tsx` | Daily brief card | Pre-1002 |
| `DonnaCommandBriefIntegration.tsx` | Command brief integration | Pre-1002 |
| `DonnaCOOWeeklyReport.tsx` | COO weekly report | Pre-1002 |
| `DonnaRecommendationCard.tsx` | Recommendation card | Pre-1002 |
| `DonnaObjectResolverPanel.tsx` | Entity resolution panel | Pre-1002 |
| `DonnaMessageReviewPanel.tsx` | Message review panel | Pre-1002 |
| `DonnaCommunicationDraftCard.tsx` | Communication draft card | Pre-1002 |
| `DonnaVersionHistoryPanel.tsx` | Version history | Pre-1002 |
| `DonnaAttendanceLayer.tsx` | Attendance layer | Pre-1002 |
| `DonnaAttendanceExceptionCard.tsx` | Attendance exception card | Pre-1002 |
| `DonnaAttentionCard.tsx` | What Needs Attention card | Pre-1002 |
| `donnaPermissionGuard.ts` | Runtime permission guard | Pre-1002 |
| `donnaRolePermissions.ts` | Role permission matrix | 363 |
| `donnaApprovalContract.ts` | Approval request/record types | 362 |
| `donnaProtectedActionRegistry.ts` | Protected action registry | 364 |
| `donnaProtectedActionRouter.ts` | Protected action router | Pre-1002 |
| `donnaApprovalExecutionTypes.ts` | Approval execution types | Pre-1002 |
| `donnaAuditTrail.ts` | Audit trail management | Pre-1002 |
| `donnaContextTypes.ts` | DONNA context types | Pre-1002 |
| `donnaDraftContracts.ts` | Draft contract types | Pre-1002 |
| `donnaDraftPersistence.ts` | Draft sessionStorage persistence | Pre-1002 |
| `donnaDraftRuntime.ts` | Draft state runtime | Pre-1002 |
| `donnaExecutionAdapter.ts` | Execution adapter for approved actions | Pre-1002 |
| `donnaWorkflowRegistry.ts` | Workflow registry | Pre-1002 |
| `donnaWorkflowCardActions.ts` | Workflow card action handlers | Pre-1002 |

### Director DONNA Surfaces

| Route/File | Purpose | Status |
|---|---|---|
| `/director/donna-coo-demo` | Full COO Intelligence demo with 7 panels | Complete — demo-labeled |
| `/director/today` | Today's brief with DONNA suggestions | Complete |
| `/director/command-center` | Director command center with DONNA | Complete |
| `/director/review` | Review queue with DONNA draft cards | Complete |
| `/director/level-up` | Level readiness with DONNA CTA | Complete |
| `src/app/director/_components/DonnaExecutiveCard.tsx` | Executive card in director layout | Complete |

**Gap:** No single `/director/donna` page as a main DONNA entry point.

### Coach DONNA Surfaces

| Route/File | Purpose | Status |
|---|---|---|
| `/coach/sessions/[sessionId]/wrap-up` | 6-question DONNA wrap-up | Complete |
| `CoachSessionVoiceShell.tsx` | Voice shell in session | Complete |
| `DonnaConversationalPanel.tsx` | Chat-style wrap-up UI (Sprint 542) | Complete — not wired to /coach route yet |
| `DonnaWrapUpPrompt.tsx` | Wrap-up prompt component | Complete |

**Gap:** No dedicated Coach DONNA sidebar/panel. DONNA appears in wrap-up only.

---

## Role Permission Matrix (Current State)

| Role | Can Ask | Can See | Can Draft | Can Approve | Cannot Do |
|---|---|---|---|---|---|
| `academy_director` | All categories | All signals | All draft types | All action categories | Nothing blocked |
| `head_coach` | curriculum, scheduling, reporting | Own sessions, own players | Coach notes, session actuals | curriculum, scheduling, reporting | billing, player management, parent comms |
| `coach` | reporting only (limited) | Own sessions only | Coach notes, wrap-up answers | reporting only | All except capture_coach_note, draft_player_note |
| `player` | (future) | Own IDP only | Nothing | Nothing | Everything |
| `parent` | (future) | Approved summaries only | Nothing | Nothing | Everything |

Defined in: `src/components/assistant/donnaRolePermissions.ts` (Sprint 363), `src/lib/donna/donnaRoleBoundaries.ts`

---

## Safe Capabilities Right Now

| Capability | Status | File |
|---|---|---|
| Answer COO health questions | Live/demo | `donnaCOOAnswerEngine.ts` |
| Intent classification | Live (deterministic) | `donnaIntentClassifier.ts` |
| Route command to preview | Live | `donnaCommandRouter.ts` |
| Draft wrap-up → proposed_actions | Live | `wrapUpDraftAdapter.ts` + `saveWrapUpDraftAction.ts` |
| Role permission guard | Live | `donnaPermissionGuard.ts`, `donnaRolePermissions.ts` |
| Protected action block | Live | `donnaProtectedActionRegistry.ts` |
| Session memory (in-session) | Live | `donnaSessionMemory.ts` |
| Attendance apply preview | Live (preview only) | `AttendanceApplyPreview.tsx` |
| Level readiness surface | Live (signal only) | `LevelReadinessApplyPreview.tsx` |
| Parent-safe draft blocked banner | Live | `ParentDraftSendBlockedBanner.tsx` |
| Audit trail UI | Live (demo data) | `ExecutionAuditTrailPanel.tsx` |

## Requires Backend Later

| Capability | Blocker |
|---|---|
| Real-time academy health from DB | Live queries not wired to COO panels |
| Curriculum gap detection from live DB | `curriculumBottleneckLoader.ts` uses demo data |
| Real coach wrap-up coverage count | Needs live proposed_actions query |
| Parent draft send queue | No director send flow yet |

## Deferred (Parent / Player / Platform-Owner DONNA)

- Parent DONNA: future — no portal architecture yet
- Player DONNA: future — player portal in early state
- Platform-owner DONNA: future — multi-tenant layer deferred

---

## Sprint 1002-1037 Build Strategy

Given the extensive existing DONNA infrastructure, the 1002-1037 block should:
1. **Connect** existing DONNA components to new surfaces (director donna page, coach session panel)
2. **Consolidate** action/context helpers that are scattered across `src/components/assistant/` and `src/lib/donna/`
3. **Add** thin new files for genuinely missing capabilities (DonnaAssistantShell, donnaQuickActions, DonnaChatThread)
4. **Document** what exists to prevent duplication in future sessions
5. **Never** duplicate existing infrastructure
