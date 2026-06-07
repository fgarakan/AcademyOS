# DONNA COO Readiness Audit
**Sprint 934–963 Audit — Director-Perspective Capability Assessment**
**Date: 2026-06-07**
**Auditor perspective: Director Brian — running an active tennis academy**

---

## Audit method

This audit evaluates DONNA from the perspective of a director who opens the system to get things done. Each dimension is assessed as Brian would experience it: does DONNA actually respond usefully, or does the infrastructure exist but the surface not deliver it?

Scoring is 1–10 per dimension. Total possible: 100.

---

## Dimension 1 — Proactive daily briefing

**Score: 5/10**

**What exists:**
- `donnaDailyGreeting.ts` — localStorage-based greeting fires on first DONNA open of the day. Offers "Would you like me to walk you through what needs attention?"
- `donnaDirectorBrief.ts` — `buildDirectorBrief(input: DirectorBriefInput)` generates a ranked priority list (top-3) covering pending reviews, attendance exceptions, high-risk players, advancement-eligible players, stalled players, curriculum draft backlog, coach patterns, and setup gaps.
- The brief has a full type contract: `DirectorIntelligenceBrief` with opening line, closing line, `overallHealthSignal`, `hasUrgentAction`, and `totalAttentionItems`.

**Where it breaks down:**
- Brian must open DONNA to receive the brief. It is pull, not push. There is no login-time surface, no badge, no notification, and no auto-render on the director dashboard.
- The daily greeting fires from localStorage — it resets per device, not per session. If Brian uses two machines, he may never see the first-open prompt on his second machine that day.
- `DirectorBriefInput` consumes live signals from `DirectorDonnaContext`. Whether that context is wired into the shell at runtime — and whether the signal values are populated from Supabase — is not verifiable from this audit. If signals are zero or null by default, `buildDirectorBrief` returns an `insufficient_data` health signal with no priorities.
- No audit log of brief generation. No way for Brian to know if today's brief was already given and he's asking twice.

**Gap:** Brief infrastructure is built. The surface delivery is passive. A proactive COO comes to you.

---

## Dimension 2 — "What do I need to do today?"

**Score: 7/10**

**What exists:**
- `processDonnaMessage` step 4: `detectTodayGuidanceQuestion` — catches "what do I need to do today" and related phrases, returns ranked priorities from COO orchestration state.
- `donnaWhatNextEngine` and `directorNextActionEngine` — built and referenced in the pipeline.
- The attention queue feeds into priority ranking.
- `DonnaMessageInput.pendingReviews` is a direct signal for surfacing review queue size.

**Where it breaks down:**
- The answer quality depends entirely on what is in `cooState` at the time. If the COO orchestration state is not populated from live Supabase data (pending reviews, attendance exceptions, player flags), DONNA's answer is generic.
- No verification in this audit that `cooState` is populated end-to-end in the sidebar shell. If it is null, `processDonnaMessage` step 2 skips COO control routing entirely.
- DONNA answers what it knows. It does not yet distinguish "here are all 5 things" from "here are the 3 that are overdue and 2 that can wait." Urgency ranking exists in the brief engine but is not surfaced as part of today-guidance replies unless the full brief is requested.

**Gap:** The routing is wired. The answer depends on live data flowing into context. Data flow not verified.

---

## Dimension 3 — "How is everything looking?"

**Score: 6/10**

**What exists:**
- `academyHealthContextPackage` — builds a health summary from available signals.
- `donnaCOOAnswerEngine` — generates COO-style health responses.
- `donnaDirectorBrief.ts` — `overallHealthSignal: 'critical' | 'attention_needed' | 'on_track' | 'insufficient_data'` is produced as part of the brief.
- `processDonnaMessage` step 3: continuity phrase detection can chain a health summary with a previous goal if goal memory is populated.

**Where it breaks down:**
- Same live data dependency as Dimension 2. If the context pack for Brian's current route does not include academy-wide health signals, DONNA's answer is not grounded in real data.
- "How is everything looking" requires cross-domain aggregation: attendance, players, coaches, templates, reviews. Each domain has its own signal engine. Whether they are all wired into a single queryable state at the time Brian asks is not confirmed.
- No visual health dashboard element that DONNA can point to. The brief says "3 things need attention" but cannot highlight a widget on screen without the `data-donna-focus-id` wiring being present on the dashboard.

**Gap:** Health signal generation is built. Cross-domain aggregation into one live answer is the unverified link.

---

## Dimension 4 — Academy Setup guidance

**Score: 5/10**

**What exists:**
- `guidedCompletionRegistry.ts` includes `academy_setup_completion` workflow with trigger phrases, required steps, and opening message.
- `donnaGoalSessionRuntime.ts` handles the Q&A loop once the workflow is started.
- `WORKFLOW_FIELD_MAPS` in `donnaPageStateSync.ts` defines field mappings for `academy_setup_completion` (academy_name → academy_name, first_coach → first_coach, etc.).

**Where it breaks down:**
- The academy setup page has no `onPageStatePatch` listener. DONNA can walk Brian through the questions verbally, but the answers do not fill in the form fields. Brian still has to type everything himself.
- No patch event dispatch from `DonnaAssistantButton` (the floating panel). If Brian uses the floating DONNA instead of the sidebar, goal sessions do not start and patches are never computed.
- First-run experience is the highest-stakes moment for this workflow. DONNA verbal guidance without form-filling is a weak assist at the most critical point.

**Gap:** Workflow defined. Q&A loop functional. Page wiring missing.

---

## Dimension 5 — Curriculum Setup guidance

**Score: 5/10**

**What exists:**
- `curriculum_builder_completion` workflow in the registry with steps (level_name, level_goal, age_range, skill_focus, sample_drills, advancement_criteria).
- `donnaGoalSessionRuntime.ts` handles the session.
- `WORKFLOW_FIELD_MAPS` defines field mappings for `curriculum_builder_completion`.

**Where it breaks down:**
- Curriculum builder page has no `onPageStatePatch` listener.
- Curriculum is a complex entity — level name, age range, skill focus, advancement criteria, drills. DONNA's registry covers 6 steps but the curriculum builder UI likely has additional fields not mapped.
- The `curriculum_builder_completion` workflow does not have a `draftType` tied to a save action. When the session completes, there is no `donna:goal-session-completed` handler that surfaces a draft. Brian receives a completion summary in the chat but no save path is wired.

**Gap:** Workflow defined. Page entirely unwired. No save path from DONNA session to DB.

---

## Dimension 6 — Template Creation guidance

**Score: 7/10**

**What exists:**
- `template_builder_completion` workflow — 6 steps (template_purpose, session_duration, session_focus, block_structure, key_drills, target_level).
- Page wiring built in Sprint 934C: class template create page listens for `donna:page-state-patch`.
- `template_name`, `selectedLevel`, and `selectedGoal` all update when DONNA answers the corresponding steps.
- "Set by DONNA" indicator appears on patched fields.
- `templateName` flows through to `saveClassTemplateDraftFromWizardAction` — the draft name DONNA provided is saved.
- TypeScript clean. Patch contract verified.

**Where it breaks down:**
- `session_duration`, `block_structure`, and `key_drills` are defined in the registry and the field map, but the page does not update those fields from patches (marked as "contract only, not wired" in Sprint 934C certification).
- DONNA does not auto-advance the wizard step after patching a field. Brian must still manually click through the 5 wizard steps even if DONNA has answered everything.
- After the goal session completes, the `donna:goal-session-completed` event fires, but there is no handler on the create page that translates this into a "ready to save" state or auto-scrolls Brian to the Review step.
- `DonnaAssistantButton` (floating panel) does not participate in goal sessions. Brian must use the sidebar DONNA to get page sync.

**Gap:** Best-implemented of the six workflows. Duration, blocks, and drills wiring are the next increment. Auto-advance and floating panel parity are the two structural gaps.

---

## Dimension 7 — Player Creation guidance

**Score: 4/10**

**What exists:**
- `player_onboarding_completion` workflow in the registry — 6 steps (player_name, player_age, recommended_level, assigned_coach, assigned_group, parent_contact).
- `WORKFLOW_FIELD_MAPS` defines field mappings (player_name, player_age, recommended_level → level, assigned_coach → coach, assigned_group → group, parent_contact → parent_email).
- `donnaGoalSessionRuntime.ts` handles the Q&A loop.

**Where it breaks down:**
- Player creation page (`/director/players` or `/director/placement`) has no `onPageStatePatch` listener — not wired at all.
- No `donna:goal-session-completed` handler on any player page.
- Player creation is the most frequent director action after initial setup. This is the highest-frequency unwired workflow.
- `finalize_player_placement()` is the protected activation function. DONNA's session produces a draft — but there is no pathway from the goal session completion event to submitting the placement form.
- Assigned coach and assigned group require entity references (actual coach/group IDs), not free-text strings. DONNA's session records free-text answers. The field map translates `assigned_coach → coach` (string), but the player creation form likely needs a coach ID, not a name. Resolution logic for this gap is not yet built.

**Gap:** Workflow and field map defined. Page entirely unwired. Entity ID resolution for coach/group assignment is a missing piece even beyond the wiring.

---

## Dimension 8 — Can DONNA explain why?

**Score: 5/10**

**What exists:**
- `donnaBrainRuntime.ts` — 21 brain entries: 8 vocabulary, 4 decision rules, 3 philosophy, 6 intent.
- Vocabulary covers: group, session, wrap-up, level, template, coach, player, proposed_action.
- Decision rules cover: player stall (medium/high thresholds: 90 days / 180 days), assessment overdue threshold, mutation requires approval.
- Philosophy covers: voice creates → UI confirms, AI proposes → director approves, data never invented.
- Brain bridge in `DonnaVoiceReadyShell` fires at ≥0.80 confidence. `processDonnaMessage` step 12 includes `buildReasoningBlock` for why/why now/why first.

**Where it breaks down:**
- 21 entries is a very narrow knowledge base. "Why is this player still in Orange Ball 2?" — DONNA cannot answer because there are no brain entries about curriculum level criteria, advancement requirements, or player development rationale.
- "Why does this template structure work for this level?" — not in the brain. Curriculum design rationale is entirely absent.
- "Why is this coach's wrap-up rate low?" — DONNA knows what a wrap-up is (vocabulary entry), knows the stall thresholds, but cannot reason about coach behavior patterns.
- "Why did you recommend Orange Ball 3 for this player?" — `recommended_level` is collected as a goal session step but the rationale for that recommendation is not built. DONNA accepts whatever Brian says, it does not compute the recommendation.
- Intent entries (6 of the 21) are for internal documentation only — they are not surfaced as query responses.

**Gap:** Brain covers operational vocabulary and system rules. Curriculum logic, player development rationale, and coach behavior explanation are missing domains.

---

## Dimension 9 — Can DONNA identify missing information?

**Score: 6/10**

**What exists:**
- Within active guided sessions: `isWorkflowComplete()`, `getNextStep()`, `buildStepMessage()`, `buildAcknowledgement()` — DONNA tracks which fields are answered and which are not.
- `donnaMissingQuestionEngine.ts` — `getNextMissingQuestion()`, `getMissingRequiredFieldIds()`, `isTaskDraftComplete()`, `countAnsweredRequired()`.
- `processDonnaMessage` step 9 resolves entities; step 11 checks context pack for page-specific missing field detection.
- `donnaTaskContracts.ts` — 20 task types with `requiredFields`, `optionalFields`, `questionSequence` — provides the schema for what's required in each context.

**Where it breaks down:**
- Missing information detection is strong within a guided session. Outside of a session (Brian asks a free-form question), DONNA relies on intent classification and context pack lookup, which is more fragile.
- `donnaTaskContracts.ts` covers 20 task types, but task contracts are separate from the guided completion registry (6 workflows). These two systems are not integrated — a task contract for `create_class_template` does not automatically inform the guided session for `template_builder_completion`.
- No cross-workflow awareness. If Brian is mid-way through player onboarding and has answered 3 of 6 steps, DONNA knows the remaining steps via `guidedCompletionSessionMemory`. But if Brian navigates away, closes the tab, or starts a new session, the in-progress state is lost (sessionStorage, 4h TTL).
- DONNA cannot identify missing information in existing DB records. "Which of my players are missing an assigned coach?" — no query path exists for this from the DONNA brain.

**Gap:** Strong within active guided sessions. Weak for freeform queries about existing data gaps. Session durability limits multi-session workflows.

---

## Dimension 10 — Does DONNA feel like a COO?

**Score: 5/10**

**What exists:**
- Intelligence layer is substantial: intent classification, entity resolution, relationship graph, disambiguation engine, goal memory, COO orchestration state, attention queue, director brief, reasoning block, context pack, brain knowledge — all built.
- Daily greeting personalizes by name and time of day.
- COO framing in `donnaDirectorBrief.ts` is correct: priorities ranked by urgency, "why it matters" and "recommended action" on each.
- `buildReasoningBlock` adds why/why now/why first reasoning to responses — COO-quality structure.

**Where it breaks down:**
- DONNA is entirely reactive. A real COO walks into your office in the morning. DONNA waits to be summoned.
- Five of six guided workflows produce no page updates. Brian says "help me create a player" and DONNA talks him through the steps — but the form stays blank. A COO who dictates to a secretary who then types nothing is not useful.
- Two separate session storage systems (`guidedCompletionSessionMemory` 4h and `donnaGoalCompletionModel` 6h) can produce inconsistent state. If one expires before the other, DONNA may think a session is active or complete when it is not.
- The sidebar (`DonnaVoiceReadyShell`) and floating panel (`DonnaAssistantButton`) share the brain but not goal sessions. Brian cannot start a session on the floating panel and have it continue in the sidebar.
- No memory across sessions (beyond sessionStorage TTL). Brian answers DONNA's questions, closes the tab, and DONNA has forgotten everything. A COO remembers what was discussed.

**Gap:** COO intelligence is built. COO behavior — proactive, persistent, form-filling, memory-retaining — is not.

---

## Overall score

| # | Dimension | Score |
|---|---|---|
| 1 | Proactive daily briefing | 5/10 |
| 2 | "What do I need to do today?" | 7/10 |
| 3 | "How is everything looking?" | 6/10 |
| 4 | Academy Setup guidance | 5/10 |
| 5 | Curriculum Setup guidance | 5/10 |
| 6 | Template Creation guidance | 7/10 |
| 7 | Player Creation guidance | 4/10 |
| 8 | Can DONNA explain why? | 5/10 |
| 9 | Can DONNA identify missing information? | 6/10 |
| 10 | Does DONNA feel like a COO? | 5/10 |
| | **Total** | **55/100** |

---

## Biggest gaps (ranked by director impact)

**Gap 1: Five of six guided workflows produce no page updates.**
DONNA guides Brian verbally through player onboarding, academy setup, curriculum creation, assessment, and parent updates — but none of those pages update their form fields. Only the class template create page receives patches. Brian has to type every answer himself after DONNA has already collected it. This breaks the "voice creates → UI confirms" operating model for 83% of workflows.

**Gap 2: DONNA is reactive, not proactive.**
The daily brief, attention queue, and priority ranking engines are all built. But they wait for Brian to open DONNA and ask. A real COO would surface critical items at login, badge unread priorities, or push a notification when something needs attention. Without proactive surface, the brief is only as good as Brian's habit of asking.

**Gap 3: Session state is tab-bound and short-lived.**
`guidedCompletionSessionMemory` uses sessionStorage with a 4h TTL. Closing the tab, restarting the browser, or switching devices clears all in-progress goal session state. Player onboarding across a lunch break is broken. Multi-day curriculum builds are impossible. A Supabase-backed `donna_sessions` row would fix this.

**Gap 4: Two parallel session storage systems with no integration.**
`guidedCompletionSessionMemory` (guided completion, 4h TTL) and `donnaGoalCompletionModel` (goal completion stack, 6h TTL) are independent. A session started in one is invisible to the other. The sidebar shell appears to use the guided completion memory; some paths in `processDonnaMessage` reference the goal completion model. Divergence means Brian can have two partially-completed session representations simultaneously.

**Gap 5: Brain "explain why" coverage is too narrow.**
21 entries cover vocabulary and system rules — correct, but insufficient for a COO. Brian's most common "why" questions are about player development (why is this player in this level?), curriculum design (why does this template structure work?), and coach performance (why is this coach's wrap-up rate low?). None of these are in the brain. DONNA cannot give reasoning on the most important operational decisions.

---

## Top 5 leverage improvements

**Leverage 1: Wire player creation page to patch listener.**
`player_onboarding_completion` is the highest-frequency director workflow. The registry, goal session runtime, page sync contract, and field map are all in place. The only missing piece is a `useEffect(() => onPageStatePatch(...), [])` in the player creation page, plus entity ID resolution for coach and group assignments (converting free-text names to DB IDs). This single sprint delivers the highest-frequency DONNA use case.

**Leverage 2: Surface the director brief on login without requiring Brian to ask.**
Add a `DonnaLoginBrief` component to the director dashboard layout that renders when `isFirstOpenToday` is true and `DirectorBriefInput` signals are non-zero. No new engines needed — `buildDirectorBrief` is already built. This converts the most-built capability from pull to push and makes DONNA feel like a COO from the moment Brian logs in.

**Leverage 3: Replace sessionStorage with Supabase-backed session rows.**
Create a `donna_sessions` table (workflow_id, academy_id, director_id, answers JSONB, status, created_at, expires_at). Replace `guidedCompletionSessionMemory` reads/writes with server actions. Merge both session systems into one. Sessions survive tab close, device switch, and overnight breaks. This also allows DONNA to resume a session Brian started yesterday: "You were working on player onboarding for Marcus. Want to continue?"

**Leverage 4: Wire academy setup page to patch listener.**
First-run experience is the highest-stakes moment. If DONNA can fill in the academy name, first coach, and initial configuration as Brian describes it, the onboarding moment becomes the product's strongest demonstration of the operating model. The field map is already defined. The page just needs a listener.

**Leverage 5: Add 10–15 brain entries covering player development rationale and curriculum level logic.**
Add entries for: level advancement criteria (what signals trigger advancement), level regression criteria (when to move a player down), assessment frequency expectations (why monthly vs. quarterly), Orange/Red/Green ball pedagogical differences, and coach wrap-up purpose (why it matters for player progress tracking). These 10–15 entries cover 80% of "why" questions Brian actually asks. The brain runtime is already built — adding entries requires only editing `initialBrainSeed.ts`.

---

## Recommended next sprint

**Sprint 935 — Player Creation Page Wiring**

**Why this sprint:**
Player creation is the most frequent director action after initial setup. The infrastructure is complete:
- `player_onboarding_completion` workflow is in the registry (6 steps defined).
- `donnaGoalSessionRuntime.ts` handles the Q&A loop and returns `PageStatePatch` objects.
- `donnaPageStateSync.ts` has the field map for all 6 player fields.
- `donnaPageSyncEvents.ts` has the event contract and dispatch helpers.

The only missing piece is the target page (`/director/placement` or the player create form) adding a `useEffect` that calls `onPageStatePatch` and maps the 6 fields to page state — exactly what Sprint 934C did for the class template page.

**Deliverables:**
1. `onPageStatePatch` listener in the player creation page, with route filter `patch.route.includes('/players')`.
2. Map `player_name`, `player_age`, `level`, `coach`, `group`, `parent_email` to the appropriate page state setters.
3. "Set by DONNA" indicators on each patched field (matching class template pattern).
4. Entity ID resolution for `coach` and `group` — if the page uses IDs (not names), add a lookup step that converts DONNA's text answer to the correct ID.
5. Architecture doc: `docs/architecture/DONNA_PLAYER_PAGE_SYNC_935.md`.
6. Certification doc: `docs/qa/DONNA_PLAYER_PAGE_SYNC_CERTIFICATION_935.md`.

**Rules:** No new intelligence. No new brain entries. No new registry workflows. No UI redesign. Wire existing infrastructure to existing page.

---

*Source files audited: `donnaBrainRuntime.ts`, `processDonnaMessage.ts`, `donnaGoalSessionRuntime.ts`, `donnaDailyGreeting.ts`, `donnaDirectorBrief.ts`, `guidedCompletionRegistry.ts`, `guidedCompletionSessionMemory.ts`, `guidedCompletionStepRunner.ts`, `donnaPageStateSync.ts`, `donnaPageSyncEvents.ts`, `DonnaVoiceReadyShell.tsx`, `donnaTaskContracts.ts`, `donnaGoalEngine.ts`, `donnaMissingQuestionEngine.ts`, `donnaGoalCompletionModel.ts`, `templateDraftAction.ts`, `src/app/director/templates/class/create/page.tsx`.*
