# DONNA Full Functionality Audit V1

**Date:** 2026-05-20
**Sprint:** 397
**Status:** Complete — Audit Only, no app code changed

---

## DONNA Vision

DONNA is the AI-powered COO layer of AcademyOS. Across all surfaces, DONNA should behave as follows:

**Director surface:** Executive assistant. Knows the academy's daily state (sessions, attendance, pending reviews, player risks). Proposes actions. Never executes without director approval. Writes all proposals to proposed_actions pipeline. Can ask DONNA to brief, triage, suggest, or draft — never to execute.

**Coach surface:** Session companion. Helps coaches capture what happened, structure observations, flag attendance exceptions, and write player notes — then submits to director review queue. One-question-at-a-time flow during wrap-up. Voice input optional. Zero paperwork feel.

**Player surface:** Mission guide. Chip-based access to context-aware coaching guidance tied to the player's active missions and curriculum level. No external AI. No raw coach data. Mission-language only.

**Parent surface:** Development interpreter. Translates coaching progress into parent-safe, encouraging language. Answers questions about the child's development with responses grounded in curriculum and approved coach language. Never shows unapproved data.

**Onboarding surface:** Academy DNA co-creator. Guides the director through DNA capture, reflects choices back in real-time, offers proposal cards for adjustments, and never saves anything without director approval.

---

## DONNA Current State

| Surface | DONNA appears | What it can do | Demo vs Real | Voice readiness | Page-aware | Approval guardrails |
|---|---|---|---|---|---|---|
| Director — onboarding | OnboardingDonnaPanel (320px sidebar) + DonnaAdjustmentDraftPanel (proposal card model) | Reflects DNA choices, offers 7 proposal templates, accepts custom requests (no-op proposal), shows proposal cards with Approve/Edit/Cancel | Demo — no external AI, keyword matching only | No voice input | Yes — reads OnboardingShell draft state | Yes — proposal card must be approved before applying |
| Director — command center | DirectorAssistantPanel | Keyword-matched responses to 7 command patterns, live DB counts (pending reviews, sessions), draft creation button | Real DB counts, deterministic responses | Browser SpeechRecognition (Chrome/Edge only) | Partially — reads live proposed_actions count | Yes — draft created in proposed_actions, never auto-executed |
| Director — daily brief | DirectorDonnaDailyBrief | Academy-day simulation, health context package, what-needs-attention engine | Partial real (uses live DB structure); demo data fills gaps | No voice | Yes — reads academy health context | Yes — no actions, read-only brief |
| Director — review queue | DonnaReviewBriefPanel, DonnaReviewQueueSurface | Context panel for each review item, COO signal badges, triage assistance | Real proposed_actions data | No voice | Yes — reads review item context | N/A — display only |
| Director — player profile | PlayerCOOContextPanel | Gap guidance, risk surface, observation visibility guardrails | Real player data | No voice | Yes — reads player IDP | No writes from this panel |
| Coach — session | CoachDonnaSessionPanel, DONNAWrapUpMobileHeader | Session context before wrap-up, wrap-up question prompting | Real session data for context | Browser SpeechRecognition + AudioRecorderButton (requires OPENAI_API_KEY) | Yes — reads session and curriculum context | Yes — wrap-up goes to proposed_actions |
| Coach — wrap-up | DonnaWrapUp (CoachWrapUpDrawer) | 6-question guided wrap-up, attendance capture, observation capture, side summary | Real data capture, writes to voice_notes + proposed_actions | Browser TTS (speechSynthesis) for question reading | Yes — reads session roster | Yes — all outputs go to review queue |
| Coach — donna page | /coach/donna | Static role-scoped DONNA page | Static — limited interactivity | No | No | N/A |
| Player — ask-donna | /player/ask-donna | 7 chip-based questions with context-aware static responses | Real player context injected server-side (mission title, category, level) | No | Yes — context injected from player IDP | N/A — no actions |
| Parent — ask-donna | /parent/ask-donna | 6 chip-based questions with parent-safe static responses | Real child context injected server-side | No | Yes — context injected from parent data | N/A — no actions |

---

## DONNA Capability Matrix

| Capability | Current Status | Desired Full-Power Version | Backend Needed | UI Needed | Safety Needed | Sprint Count | Priority |
|---|---|---|---|---|---|---|---|
| Welcome / onboarding guidance | PARTIAL — sidebar panel reflects DNA; not full-screen | Full-screen DONNA conversation on step 8, inline on other steps | None (reads form state) | Expand onboarding step 8 to full-screen DONNA | Low | 1 | HIGH |
| Academy DNA capture | WORKING — proposal card model with 7 templates | Real-time DNA reflection as each field is filled | None | Minor — chip trigger improvements | Low | 1 | DONE |
| DNA adjustment proposals | WORKING — proposal card with Approve/Edit/Cancel | Multi-proposal batching, undo last proposal | proposed_actions save (currently in-memory only) | Batch proposal UI | MEDIUM — must save proposals to DB | 2 | MEDIUM |
| Curriculum builder guidance | PARTIAL — CurriculumCustomizationAssistant exists; ChangeQueue exists | DONNA suggests next incomplete level, explains gate gaps, proposes drill additions | curriculum_levels, curriculum_gates | DonnaPanel in curriculum pages | HIGH — all proposals must go to proposed_actions | 3 | HIGH |
| Curriculum override drafts | PARTIAL — VoiceOverrideInputPanel exists; CurriculumOverrideDraftCard in review queue | DONNA-created curriculum change drafts routed through review queue | proposed_actions (curriculum override) | Override draft creation UI | HIGH — real impact on player levels | 2 | HIGH |
| Template creation guidance | PARTIAL — DonnaSuggestions page exists; not wired to real proposed_actions | DONNA suggests template blocks based on curriculum level; director approves | session_templates, template_blocks, proposed_actions | DonnaSuggestions wire to real DB | HIGH — template mutations affect sessions | 2 | MEDIUM |
| Session planning suggestions | NOT BUILT | DONNA suggests session template for group based on last session outcome | sessions, template_blocks, coach_observations | Director session planner DONNA panel | MEDIUM | 3 | MEDIUM |
| Coach attendance capture | WORKING — CoachWrapUpDrawer Q2 | Same — already good | session_attendance | None | LOW | DONE | DONE |
| Coach note structuring | PARTIAL — generateNoteDraftAction requires ANTHROPIC_API_KEY | AI-structured observation from voice/text → structured fields → proposed_actions | Anthropic API (requires key) | AIDraftPanel (built) | HIGH — AI output to review queue before write | 1 (env var) | HIGH |
| End-session recap | WORKING — CoachWrapUpDrawer 6-question flow | One-question-per-screen UX matching prototype DonnaWrapUp | voice_notes, proposed_actions | Rebuild wrap-up as step-by-step screen flow | MEDIUM — must not bypass review queue | 2 | HIGH |
| Evidence draft generation | PARTIAL — CoachCurriculumEvidenceDraftCard; evidence writes to player_gate_status | DONNA identifies gate evidence from wrap-up text, proposes tagging | player_gate_status, proposed_actions | Evidence draft card in review queue | HIGH — gate evidence affects level advancement | 2 | MEDIUM |
| Parent-safe summary draft | PARTIAL — AIDraftPanel writes player_development_summary with show_to_parent=false | Director reviews and approves before parent sees | player_development_summary, proposed_actions | Director-side approval panel (DevelopmentSummaryDraftCard exists) | HIGH — no parent exposure without approval | 1 | HIGH |
| Player mission recommendations | PARTIAL — player_priorities drives all mission content; no DONNA suggestion | DONNA proposes priority adjustments to director based on observation patterns | player_priorities, coach_observations, proposed_actions | Priority recommendation draft card (PriorityRecommendationDraftCard exists) | HIGH — must go through director approval | 2 | MEDIUM |
| Parent support guide | WORKING — buildParentSupportGuide() generates content | Same — already good; could add DONNA-personalized copy | parentSupportGuide lib function | None | LOW | DONE | DONE |
| Review queue triage | PARTIAL — DonnaReviewBriefPanel + COO signal badges | DONNA highlights highest-risk items, suggests approval order | proposed_actions, audit_logs, academy health | DonnaReviewQueueSurface (built) | LOW — triage is advisory only | 1 | MEDIUM |
| Voice input | PARTIAL — browser SpeechRecognition (Chrome/Edge) + AudioRecorderButton (requires OPENAI_API_KEY) | Production STT via Whisper (OPENAI_API_KEY set in env) | OpenAI Whisper API | AudioRecorderButton (built, gated) | MEDIUM — no audio stored, transcription server-side | 1 (env var) | MEDIUM |
| Voice output | PARTIAL — browser speechSynthesis (prototype only, Chrome/Edge) | Production TTS via OpenAI TTS or ElevenLabs | OpenAI TTS endpoint (/api/assistant/speak not yet built) | Stop Speaking button (built in wrap-up) | LOW — audio is outbound only | 3 | LOW |
| Page-aware help | PARTIAL — onboarding and command center are page-aware | All DONNA instances know current route, current player/session context | Context package injection | Context provider per surface | LOW | 2 | MEDIUM |
| Role-aware permissions | WORKING — roleGuardrails.ts, voiceRoleGuardrails.ts, donnaRoleBoundaries.ts | Same — already comprehensive | All permission files locked | None | LOW | DONE | DONE |
| Action execution | PARTIAL — execute_approved_action() covers 11 of 15 types | Full 15 types + new action types for curriculum, player mission, parent summary | proposed_actions RPC extension | Execution routing Sprint 250+ | HIGH — execution is irreversible | 3 | HIGH |
| Approval workflow | WORKING — proposed_actions pipeline, all decision controls built | Same — already comprehensive | proposed_actions | None | LOW | DONE | DONE |

---

## DONNA Full-Power Architecture

### Input Layer
- Text input: all surfaces have text input fields
- Voice input (dictation): browser SpeechRecognition on coach wrap-up and director command center
- Voice input (transcription): AudioRecorderButton → /api/coach/sessions/[sessionId]/transcribe → Whisper (requires OPENAI_API_KEY)
- Chip-based triggers: player/parent ask-donna pages, onboarding proposal chips
- Form reflection: onboarding steps reflect DNA choices to DONNA sidebar in real time

### Intent Parser
- Current: keyword pattern matching (7 command patterns for director, 7 proposal templates for onboarding, static chips for player/parent)
- Target: structureVoiceIntake() handles 14 destination types deterministically; no AI NLU today
- Gap: complex or ambiguous commands produce unknown intent or fallback response

### Role/Permission Guard
- voiceRoleGuardrails.ts — explicit intent permission matrix per role (locked, stable)
- roleGuardrails.ts — guardrail functions for command center (locked, stable)
- donnaRoleBoundaries.ts — explicit never-do list per role (locked, stable)
- These three files are the enforcement layer. All DONNA surfaces call into them before any action.

### Context Provider
- Director: academyHealthContextPackage, commandBriefLiveLoader, directorDonnaContext
- Coach: coachDonnaContext, coachSupportLoader, wrapUpConversationScript
- Player: individualDevelopmentPlan (player view), playerMissionCopy
- Parent: individualDevelopmentPlan (parent view), parentSupportGuide
- Onboarding: OnboardingShell draft state (form state, no DB)

### Action Planner
- Determines whether input maps to a safe-read action, a draft-only action, or a proposed-action
- donnaSafeReadActions.ts — read actions DONNA can perform without approval
- donnaDraftOnlyActions.ts — DONNA can draft but not execute
- donnaActionTypes.ts — full type registry

### Draft Generator
- Proposal card model (onboarding): 7 templates + custom no-op
- CurriculumOverrideDraftCard: curriculum change drafts
- DevelopmentSummaryDraftCard: parent-safe summary drafts
- PriorityRecommendationDraftCard: player priority suggestion drafts
- WrapUpDraftCard: session recap drafts
- Target: all DONNA outputs produce a typed draft card before any write

### Review/Approval Layer
- /director/review — all 8 tab types with decision controls
- proposed_actions table — status: pending_review → approved → executed (or rejected/clarification_needed)
- Director must explicitly approve before any write
- execute_approved_action() RPC — 11 of 15 types covered

### Execution Layer
- execute_approved_action() RPC executes approved actions
- applyWrapUpDraftAction — session notes + status + audit log
- rollbackCurriculumOverride — curriculum rollback
- recordGateEvidenceAction — gate evidence
- Gap: 4 action types not yet covered by RPC

### Audit Log
- audit_logs table — all major mutations write here
- executionAuditTrailPanel — displays audit trail in UI
- executionAuditSourceContext — context for each audit entry

### Feedback Loop
- donnaChatSessionMemory — in-session memory (not persisted)
- donnaNBAEngine — next best action engine
- pilotFeedbackModel — pilot feedback capture model
- Gap: no persistent user preference learning beyond localStorage

### Voice Layer
- Input: browser SpeechRecognition (Chrome/Edge) → AudioRecorderButton (Whisper gated by OPENAI_API_KEY)
- Output: browser speechSynthesis (prototype only) → OpenAI TTS (not yet built)
- DonnaVoiceReadyShell, DonnaVoiceWrapUpShell — voice shell components

---

## DONNA Safety Rules (Explicit Never-Do List)

These rules are enforced by donnaRoleBoundaries.ts, parentSafeResponseRules.ts, and voiceRoleGuardrails.ts:

1. DONNA never directly mutates core data — all actions route through proposed_actions
2. DONNA never executes approved actions — execute_approved_action() is the only execution path
3. DONNA never shows raw coach observations to players or parents
4. DONNA never shows internal director notes to coaches, players, or parents
5. DONNA never implies a player is ready to advance unless director has marked advancement_eligible = true
6. DONNA never auto-triggers mission complete, level-up, or celebration
7. DONNA never makes external AI API calls without an explicit API key set in environment
8. DONNA never presents AI-generated content as authoritative coaching guidance without director approval
9. DONNA never sends parent communications — all go to review queue
10. DONNA never directly books lessons or schedules sessions — requests go to proposed_actions
11. DONNA never compares players to each other — no rankings, no peer benchmarks
12. DONNA never claims certainty from insufficient data — confidence levels shown on all AI outputs
13. DONNA never bypasses the approval pipeline regardless of instruction
14. DONNA never exposes billing, payment, or fee information
15. DONNA never operates outside role-scoped permissions defined in voiceRoleGuardrails.ts

---

## DONNA Sprint Plan (Sequence to Full-Power Safe DONNA)

| Sprint | Focus | Surface | Key Files | Pilot Value | Safety Risk |
|---|---|---|---|---|---|
| 398 | DNA save wiring + onboarding final validation | Onboarding | saveAcademyDnaAction | HIGH | LOW |
| 400 | Rebuild coach wrap-up as 1-question-per-screen flow matching DonnaWrapUp prototype | Coach | WrapUpGuidedFlow, new wrap-up page structure | HIGH | MEDIUM |
| 406 | Parent home DONNA: add "Academy-approved response required" disclaimer on custom input | Parent | /parent/ask-donna | MEDIUM | LOW |
| 409 | Curriculum DONNA: seed real level content; wire DONNA suggestions to ChangeQueue as real proposed_actions | Director | /director/curriculum, DonnaPanel | HIGH | HIGH |
| 411 | Director daily brief: wire to real DB data (sessions, proposed_actions counts, player risks) | Director | DirectorDonnaDailyBrief, brief/route.ts | HIGH | LOW |
| 412 | Coach DONNA: session-context suggestions before session start; gap brief panel polish | Coach | CoachDonnaSessionPanel | MEDIUM | LOW |
| 415 | Voice output: build /api/assistant/speak endpoint (OpenAI TTS); wire to wrap-up question reading | Coach | /app/api/assistant/speak | LOW | LOW |
| 416 | Player DONNA: add voice input option to ask-donna page (browser SpeechRecognition) | Player | /player/ask-donna | MEDIUM | LOW |
| Future | Production AI intent parser: replace keyword matching with Claude API intent classification | All | structureVoiceIntake, donnaIntentClassifier | HIGH | HIGH |

Total sprints to DONNA full-power (safe, role-aware, approval-gated): approximately 20 additional sprints beyond Sprint 417.

---

*Generated from prototype zips extracted to /tmp only. No code changes. No migrations. No schema changes. No package changes. No DB writes.*
