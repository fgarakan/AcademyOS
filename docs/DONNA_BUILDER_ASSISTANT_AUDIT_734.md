# DONNA Builder Assistant Certification Audit — Sprint 734
**Date:** 2026-05-24  
**Auditor:** Sprint 734 audit pass (pre-implementation; no code written)  
**Purpose:** Establish honest baseline before any build work begins.  
**Target certification doc:** `docs/DONNA_BUILDER_ASSISTANT_CERTIFICATION.md`

---

## Audit Methodology

Each of the 15 required builder capabilities is evaluated against:
1. **Infrastructure** — do the types, models, and engines exist in the codebase?
2. **Wiring** — is it connected to `DonnaVoiceReadyShell.tsx` dispatch chain or equivalent DONNA entrypoint?
3. **Behavior** — does it produce correct, safe, director-friendly output from a chat prompt?

Verdicts: **PASS** (fully wired + correct behavior) | **PARTIAL** (infrastructure present but incomplete or not wired) | **FAIL** (not built)

---

## Files Read During Audit

| File | Relevance |
|---|---|
| `src/lib/donna/curriculumBuilderDonnaContext.ts` | Chip helpers; wiring status notes |
| `src/lib/curriculum/donnaCurriculumContext.ts` | DonnaCurriculumAction types, safety invariants |
| `src/lib/curriculum/curriculumDraftHelpers.ts` | CurriculumDraftProposal, buildCurriculumDraftProposal |
| `src/lib/curriculum/gapAnalysis.ts` | buildGapAnalysisReport, CurriculumGap types |
| `src/lib/curriculum/impactEstimateHelper.ts` | buildImpactEstimate, ImpactEstimate types |
| `src/lib/donna/donnaPageContextEngine.ts` | /director/curriculum and /director/curriculum/builder page maps |
| `src/lib/donna/donnaConversationalRouter.ts` | curriculum_builder routing and clarification |
| `src/lib/donna/directorClarificationEngine.ts` | buildClarifyingQuestion for curriculum_builder |
| `src/components/assistant/templateDraftParser.ts` | parseTemplateDraft, isTemplateCreationIntent, extractBlocks |
| `src/components/assistant/donnaDraftContracts.ts` | All draft contracts, saveWireStatus |
| `src/app/director/class-templates/saveAssistantTemplateDraftAction.ts` | Class template save action |
| `src/app/director/templates/TemplatesDonnaPanel.tsx` | Static panel — NOT wired to dispatch |
| `src/components/donna/DonnaVoiceReadyShell.tsx` | 12-step dispatch chain (template/curriculum NOT in chain) |
| `src/lib/curriculum/coachCueLibrary.ts` | Coach cue library (exists but not read in full) |
| `src/lib/donna/donnaChatSessionMemory.ts` | PendingNavOffer; no build-intent memory |

---

## Capability Audit — 15 Required Capabilities

### CAP 1 — Understand curriculum level structure
**Status: PARTIAL**

**What exists:**
- `donnaCurriculumContext.ts` — `DonnaCurriculumContextView` with `requiresDirectorApproval: true`, `neverAutoApply: true`
- `gapAnalysis.ts` — `CurriculumGap` types with `stage`, `levelId`, `levelName`, `domain`
- `donnaPageContextEngine.ts` — `/director/curriculum` page context with `safeContext` and `suggestedPrompts`
- `donnaMissingContextEngine.ts` Step 9 — curriculum coverage explanation when academy has data

**What is missing:**
- No DONNA chat engine in the dispatch chain that answers "What are my curriculum levels?" with actual level names or structure
- Curriculum level data (level names, stages, block counts) is NOT in `DirectorDonnaContext` — it is not passed to the client

**Gap:** Infrastructure types exist. Active chat answer does not.

---

### CAP 2 — Explain a level in director-friendly language
**Status: PARTIAL**

**What exists:**
- `donnaPageContextEngine.ts` — curriculum page dataFallback: "I can explain how the curriculum system is structured"
- `donnaConversationalRouter.ts` — `curriculum_builder` routes to `route_to_review` with clarification question
- Page context `suggestedPrompts` include generic "How does the curriculum connect to player levels?"

**What is missing:**
- No engine that takes a level name ("Orange 2", "Red 1") and returns a director-friendly explanation of what that level is, what players work on, and what the gates/skills/drills look like
- Curriculum level content is not in `DirectorDonnaContext` — a DB query would be needed to surface this

**Gap:** Generic curriculum explanations possible; level-specific explanations not built.

---

### CAP 3 — Summarize skills, drills, gates, assessments, missions, badges
**Status: PARTIAL**

**What exists:**
- `donnaCurriculumContext.ts` — `DonnaCurriculumAction` type `surface_knowledge_items` defined
- `curriculumKnowledgeView.ts` — likely contains relevant structure (not fully read; exists in lib)
- `donnaSafeReadActions.ts` — no curriculum content item summary actions registered

**What is missing:**
- No DONNA chat engine that responds to "Summarize the drills in Orange 2" or "What gates exist at this level?"
- Curriculum content item data is not in `DirectorDonnaContext`
- `surface_knowledge_items` action type is defined but has no corresponding answer function

**Gap:** Action type defined; no dispatch engine, no context data.

---

### CAP 4 — Identify missing curriculum/template information
**Status: PARTIAL**

**What exists:**
- `gapAnalysis.ts` — `buildGapAnalysisReport()` is a complete gap analysis function with severity scoring, categories, recommendations, and top-5 priority gaps
- `curriculumBuilderDonnaContext.ts` — `buildCurriculumGapChip()` generates a gap identification prompt
- `donnaMissingContextEngine.ts` Step 9 — returns curriculum coverage fallback when academy has data

**What is missing:**
- `buildGapAnalysisReport()` is not called from any DONNA chat dispatch path — it requires a `GapAnalysisInput` struct with live DB data
- `buildCurriculumGapChip()` generates a chip label/prompt string only — it does not produce a DONNA answer
- No DONNA engine in the dispatch chain that surfaces gap analysis results conversationally

**Gap:** Complete gap analysis algorithm exists; not wired to DONNA chat.

---

### CAP 5 — Draft curriculum changes as structured proposed edits
**Status: PARTIAL**

**What exists:**
- `curriculumDraftHelpers.ts` — `CurriculumDraftProposal` interface, `buildCurriculumDraftProposal()`, `CurriculumChangeType` enum
- `donnaDraftContracts.ts` — `curriculum_adjustment_draft` contract (listed as `saveWireStatus: 'wired'`)
- `src/lib/actions/curriculumDraft.ts` — `saveCurriculumDraftAction` exists

**What is missing (critical blocker):**
- `curriculumBuilderDonnaContext.ts` explicitly documents: `draft_curriculum_item` is `implemented_not_wired` — `saveCurriculumDraftAction` has a hard `voice_commands` insert dependency; `voice_command_id` must be optional before this can be safely wired
- `DonnaCurriculumNodeAddCard` UI component sets local state only — it does NOT call `saveCurriculumDraftAction`
- `draft_drill`, `draft_curriculum_mission`, `draft_curriculum_badge` are `registry_only` — no server actions exist

**Gap:** Proposal infrastructure complete; voice_commands dependency blocks dispatch wiring; sub-item draft actions not built.

---

### CAP 6 — Draft class templates from intent
**Status: PARTIAL**

**What exists:**
- `templateDraftParser.ts` — complete keyword intent parser: `parseTemplateDraft()`, `isTemplateCreationIntent()`, `extractLevel()`, `extractDuration()`, `extractBlocks()`, `allocateBlockDurations()`
- `saveAssistantTemplateDraftAction.ts` — complete server action with academy_id scoping, role check, block insertion
- `donnaDraftContracts.ts` — `class_template_draft` contract, `saveWireStatus: 'wired'`
- `TemplateDraftPanel.tsx` — standalone UI draft panel component

**What is missing (critical):**
- `DonnaVoiceReadyShell.tsx` has ZERO imports of `templateDraftParser`, `parseTemplateDraft`, or `TemplateDraftPanel`
- The dispatch chain has no step that calls `isTemplateCreationIntent()` or triggers draft creation from chat
- `TemplatesDonnaPanel.tsx` (on `/director/templates`) has a text input that calls `setInput('')` on Enter — it never dispatches to DONNA

**Gap:** Complete draft pipeline exists; NOT wired into DONNA chat dispatch. This is the closest-to-ready capability.

---

### CAP 7 — Draft fitness templates from age/level/focus
**Status: PARTIAL**

**What exists:**
- `createFitnessTemplateWithBlocksAction.ts` and `fitnessTemplateActions.ts` in `/director/fitness/`
- `donnaDraftContracts.ts` — `fitness_template_draft` contract, `saveWireStatus: 'wired'`

**What is missing:**
- No `fitnessDraftParser.ts` equivalent to `templateDraftParser.ts` — no keyword extraction for fitness intent (age group, intensity, tennis transfer focus, aerobic vs. anaerobic)
- No DONNA chat dispatch step for fitness template creation
- Fitness template blocks differ from class template blocks and need their own extraction logic

**Gap:** DB action exists, contract defined; no intent parser, not wired into DONNA.

---

### CAP 8 — Explain downstream impact before changes
**Status: PARTIAL**

**What exists:**
- `impactEstimateHelper.ts` — `buildImpactEstimate()` with `ImpactEstimate` shape: `playersAffected`, `levelsAffected`, `estimatedRolloutWeeks`, `changeType`
- `CurriculumImpactPreviewPanel` component at `/director/curriculum/builder/impact-preview`
- Change types supported: `add_drill`, `add_gate`, `add_fitness`, `modify_gate`, `remove_drill`, `add_mission`, `rewrite_level`

**What is missing:**
- No DONNA chat engine that calls `buildImpactEstimate()` and surfaces the result conversationally
- Director asking "What would happen if I removed this drill?" gets no structured impact answer
- `buildImpactEstimate()` requires `ImpactEstimateInput` with live level/drill objects — a data bridge is needed

**Gap:** Impact calculation algorithm complete; no DONNA conversational surface.

---

### CAP 9 — Ask one clarification when needed
**Status: PASS** ✓

**Evidence:**
- `directorClarificationEngine.ts` — `buildClarifyingQuestion()` for `curriculum_builder` intent: `"Which level or group should this belong to?"`
- `donnaConversationalRouter.ts` — clarification: `"Are you reviewing the existing curriculum structure or creating a new template?"`
- `tryDirectorClarificationOrBlock()` is wired in the dispatch chain (step 7 of 12)
- One question at a time. Does not ask when context is already provided.

---

### CAP 10 — Remember pending build/edit intent
**Status: PARTIAL**

**What exists:**
- `donnaChatSessionMemory.ts` — `PendingNavOffer` interface: `{ href, label, contextText }`; `setPendingNavOffer()`, `consumePendingNavOffer()`, `hasPendingNavOffer()`
- Session state stores last Q&A context for yes/no navigation confirmation

**What is missing:**
- No `PendingBuildIntent` mechanism — if director says "I want to draft a drill for Orange 2" and DONNA clarifies, the "Orange 2" context is not stored for the follow-up turn
- Build intent (level, duration, block type, session goal) is not persisted across the clarification → answer cycle
- Template draft state (the `TemplateDraft` object) has no session-level home in DONNA's memory

**Gap:** Nav offer memory exists; multi-turn build intent memory not built.

---

### CAP 11 — Route edits to review/approval
**Status: PASS** ✓

**Evidence:**
- `donnaConversationalRouter.ts` — `SAFE_DRAFT_INTENTS` set includes `curriculum_builder`; `route_to_review` mode triggers "I'll prepare a draft and route it to the Review Center for your approval before anything takes effect"
- `donnaDraftContracts.ts` — all draft types have `approvalRequired: true`
- `buildBlockedRequestAnswer()` in clarification engine explicitly blocks direct mutations and offers review routing
- `proposed_actions` pipeline is the sole path for mutations (architecture red line)

---

### CAP 12 — Never silently mutate official records
**Status: PASS** ✓

**Evidence:**
- Architecture red line enforced across all DONNA dispatch steps
- `buildBlockedRequestAnswer()` explicitly blocks: `move.*player.*now`, `promote.*now`, `publish.*now`, `apply.*now`
- No DONNA engine writes directly to any table — all mutation paths require `proposed_actions` or explicit save action triggered by the director
- `DonnaCurriculumNodeAddCard` sets local state only (does NOT call server action)
- `DonnaVoiceReadyShell.tsx` dispatch chain is read-only throughout

---

### CAP 13 — Suggest session adjustments based on actual players
**Status: FAIL** ✗

**What exists:**
- `template_recommendation_draft` contract in `donnaDraftContracts.ts` (`saveWireStatus: 'not_wired_yet'`)
- `templateConnectionModel.ts` in curriculum lib (connection between templates and curriculum)

**What is missing:**
- No `sessionAdjustmentDonnaAnswer.ts` or equivalent engine
- No DONNA dispatch step that looks at a group's player mix and suggests template modifications
- No player-group intersection query feeding into DONNA context for session adjustment
- `DirectorDonnaContext` does not include group composition or current session data

**Gap:** Not built. No infrastructure, no dispatch, no context data.

---

### CAP 14 — Give coaches context-specific execution suggestions
**Status: PARTIAL**

**What exists:**
- `coachCueLibrary.ts` in `src/lib/curriculum/` — coach cue library (exists)
- `donnaCurriculumContext.ts` — `suggest_coach_cues` action type defined
- Coach context (`CoachDonnaContext`) is available in `DonnaVoiceReadyShell.tsx`

**What is missing:**
- No DONNA chat engine that surfaces coach cues from the library based on a drill/level/session query
- `suggest_coach_cues` action type exists in type definitions but has no corresponding answer function in the dispatch chain
- Coach-facing DONNA (when `role === 'coach'`) has no builder-specific dispatch — only the general safe-read and router fallback fire

**Gap:** Cue library exists; no DONNA dispatch engine maps chat prompts to coach cue responses.

---

### CAP 15 — Keep all parent/player-facing language safe
**Status: PASS** ✓

**Evidence:**
- `donnaVisibilityGuardrail.ts` in `src/components/assistant/` enforces visibility rules
- `buildBlockedRequestAnswer()` explicitly blocks raw coach note exposure to parents
- Boundary check engine fires before all other dispatch steps
- `donnaDraftContracts.ts` — `parent_update_draft` shows_to_parent guard: "Director only until explicitly approved and sent — parent never sees draft"

---

## Score Summary

| # | Capability | Verdict | Points |
|---|---|---|---|
| 1 | Understand curriculum level structure | PARTIAL | 3.3 |
| 2 | Explain a level in director-friendly language | PARTIAL | 3.3 |
| 3 | Summarize skills, drills, gates, assessments, missions, badges | PARTIAL | 3.3 |
| 4 | Identify missing curriculum/template information | PARTIAL | 3.3 |
| 5 | Draft curriculum changes as structured proposed edits | PARTIAL | 3.3 |
| 6 | Draft class templates from intent | PARTIAL | 3.3 |
| 7 | Draft fitness templates from age/level/focus | PARTIAL | 3.3 |
| 8 | Explain downstream impact before changes | PARTIAL | 3.3 |
| 9 | Ask one clarification when needed | **PASS** | 6.7 |
| 10 | Remember pending build/edit intent | PARTIAL | 3.3 |
| 11 | Route edits to review/approval | **PASS** | 6.7 |
| 12 | Never silently mutate official records | **PASS** | 6.7 |
| 13 | Suggest session adjustments based on actual players | **FAIL** | 0 |
| 14 | Give coaches context-specific execution suggestions | PARTIAL | 3.3 |
| 15 | Keep all parent/player-facing language safe | **PASS** | 6.7 |

**PASS: 4 | PARTIAL: 10 | FAIL: 1**

**Score: 60 / 100**

**Verdict: NOT CERTIFIED — Specific blockers identified below**

---

## Blockers to Certification

### Blocker A — Template drafting not wired (CAP 6, CAP 7)
- `templateDraftParser.ts` is complete and production-ready
- `saveAssistantTemplateDraftAction.ts` is complete and wired to DB
- But NEITHER is in `DonnaVoiceReadyShell.tsx` dispatch chain
- `TemplatesDonnaPanel.tsx` text input does nothing on send
- Fix: Wire `isTemplateCreationIntent` → `parseTemplateDraft` → `TemplateDraftPanel` into DONNA dispatch (Sprint 735)
- Fitness template requires new `fitnessDraftParser.ts` before wiring (Sprint 736)

### Blocker B — Curriculum explanation not in dispatch (CAP 1, CAP 2, CAP 3, CAP 4)
- Gap analysis algorithm exists; curriculum level data is not in `DirectorDonnaContext`
- No DONNA engine explains level structure or summarizes content items from chat
- Fix: Build `curriculumLevelDonnaAnswer.ts` with static knowledge of level structure; wire into dispatch (Sprint 737)

### Blocker C — Impact explanation not surfaced (CAP 8)
- `buildImpactEstimate()` is complete and tested
- No DONNA chat path calls it or formats the result for a director
- Fix: Build `curriculumImpactDonnaAnswer.ts` that surfaces impact estimates conversationally (Sprint 738)

### Blocker D — Build intent memory not built (CAP 10)
- Nav offer memory exists (`PendingNavOffer`) but does not store multi-turn build context
- Director cannot say "I want to draft a drill for Orange 2" → get clarification → have DONNA remember "Orange 2"
- Fix: Add `pendingBuildIntent` to `DonnaChatSessionState` in Sprint 738 alongside impact

### Blocker E — voice_commands dependency blocks curriculum draft wiring (CAP 5)
- `saveCurriculumDraftAction` requires `voice_command_id` from `voice_commands` table
- `DonnaCurriculumNodeAddCard` is a UI-only mock
- Fix: Make `voice_command_id` optional in the curriculum draft action OR bypass the voice_commands insert for director-initiated drafts (Sprint 739)

### Blocker F — Session adjustment not built (CAP 13)
- No engine, no context data, no dispatch step
- Requires: group player composition in `DirectorDonnaContext`, `sessionAdjustmentDonnaAnswer.ts`, dispatch wiring
- Fix: Sprint 739 — build and wire session adjustment suggestions

### Blocker G — Coach cue dispatch not built (CAP 14)
- `coachCueLibrary.ts` exists; no DONNA dispatch engine bridges it to chat
- Fix: Sprint 739 — build `coachCueDonnaAnswer.ts` and wire for both director and coach roles

---

## Recommended Sprint Sequence

| Sprint | Goal | Capabilities Addressed |
|---|---|---|
| **735** | Wire class template drafting into DONNA dispatch | CAP 6 → PASS |
| **736** | Build fitnessDraftParser + wire fitness template drafting | CAP 7 → PASS |
| **737** | Curriculum level explanation + gap identification dispatch | CAP 1, 2, 3, 4 → PASS |
| **738** | Impact explanation + build intent session memory | CAP 8, 10 → PASS |
| **739** | Session adjustment + coach cue dispatch + curriculum draft unblock | CAP 5, 13, 14 → PASS |
| **740** | Full 15-capability regression → certification doc | All 15 → final verdict |

**Expected final score after Sprint 739:** 15 PASS / 0 PARTIAL / 0 FAIL → **100/100 → CERTIFIED BUILDER ASSISTANT**

---

## Architecture Notes for Sprint Planners

1. **Template drafting dispatch (Sprint 735):** The `TemplateDraft` object should live in component state (not session memory) because it is built turn-by-turn from clarification answers. The dispatch step should detect `isTemplateCreationIntent()`, call `parseTemplateDraft()`, and render `TemplateDraftPanel` inline in the chat or as a modal. On "Save Template", call `saveAssistantTemplateDraftAction`.

2. **Fitness template parser (Sprint 736):** The parser needs at minimum: intensity extraction (high/medium/low), age group extraction (u10/u12/u14/u16/adult), tennis transfer focus (speed/endurance/agility/power), and duration. Block categories: agility, speed, endurance, strength, tennis_transfer, cool_down.

3. **Curriculum level context (Sprint 737):** Level content (level names, stages, gate counts, drill counts) is best served as static knowledge embedded in the DONNA answer engine rather than a DB query — avoids adding new queries to the client context. If levels are academy-specific and require DB data, a thin server fetch can supply them to `DirectorDonnaContext`.

4. **voice_commands dependency (Sprint 739):** The cleanest fix is to make `voice_command_id nullable` in the curriculum draft insert, using `null` for director-initiated drafts and a real ID only for voice-captured ones. This does not require a migration if the column is already nullable — verify in `database.types.ts` before the sprint.

5. **Session adjustment (Sprint 739):** Requires adding `groupPlayerLevels: Record<string, string[]>` or similar to `DirectorDonnaContext`. This is a light read of `group_memberships JOIN player_curriculum_states`. Scope to the active session day to avoid loading all group data.

---

## Certification Pre-Conditions (must be true before Sprint 740)

- [ ] Sprint 735 committed and TypeScript clean
- [ ] Sprint 736 committed and TypeScript clean
- [ ] Sprint 737 committed and TypeScript clean
- [ ] Sprint 738 committed and TypeScript clean
- [ ] Sprint 739 committed and TypeScript clean
- [ ] All 15 capabilities pass live regression prompts in Sprint 740
- [ ] No inflation — scores reflect actual behavior, not intent
- [ ] No hidden mutations — all draft paths verified through review queue

---

*Audit complete. No code was written or modified in this sprint. Score: 60/100. Verdict: NOT CERTIFIED. Proceed to Sprint 735.*
