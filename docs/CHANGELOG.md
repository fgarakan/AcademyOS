# Changelog

---

## 2026-05-03 — Sprint 229: Player Individual Development Plan Model V1

**Mode:** New pure helper + doc. No DB calls. No AI. No migration. No routes changed.

### Files created
- `docs/player-development/individual-development-plan-model.md` — full spec for the IDP object, role views, safety rules, and computation sources
- `src/lib/player/individualDevelopmentPlan.ts` — pure helper exporting `IndividualDevelopmentPlan`, `IdpRoleView`, `IdpTrainingGap`, `IdpKnowledgeGap`, `buildIndividualDevelopmentPlan()`, `buildRoleSpecificIdpView()`, `getIdpSafetyNote()`

**QA results:**
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS, zero forbidden references
- `qa-command-parser.mjs` — 24/24 passed

**TypeScript:** 0 errors.

---

## 2026-05-03 — Sprint 228: Conversational OS QA + Polish V1

**Mode:** Polish and safety pass only. No schema changes. No migrations. No writes. No AI. No new routes.

**Routes audited:**
- `/director/command-center` — guardrail badges, "requires approval" labels, query-only labels, draft visibility panel, bottom guardrail note: all correct
- `/director/curriculum/learning` — "Learning Module Preview — read-only" badge, director eyebrow, no player/parent data exposure: correct
- `/director/players/[playerId]` Q&A preview — "Director preview — read-only" badge, Mission/Try this/Reflection sections: correct
- `/director/players/[playerId]` parent guidance preview — "Director preview — not sent" badge, bottom privacy note: correct
- `/director/review` StructuredDraftCard — "Will change if approved" / "Will not change automatically" panels, source recap, safety banner: correct (Sprint 225)
- `/player` — `PlayerMissionPreview` shows clean empty state, no internal data: correct
- `/parent` — `ParentSafeProgressPreview` shows clean empty state, no internal data: **fix applied** (see below)
- `/director/improvement` — "Working On" label polish, "No development focus set" empty text: correct
- `/director/players/active` — "Current Focus" label replacing "Working on:": correct

**Safety fix applied:**
- `src/app/parent/page.tsx`: Changed `isPreviewOnly={true}` → `isPreviewOnly={false}`. The `isPreviewOnly` flag shows a "Preview only" badge — correct for the director-side preview in `ParentGuidancePreviewPanel`, but wrong on the parent portal where the parent is viewing their own data. Parent portal should not display director-internal language. Empty state wording is unchanged.

**What was built:**
- `src/components/player/ParentSafeProgressPreview.tsx` — new parent-safe progress component. Accepts `doingWell`, `workingOn`, `currentFocus`, `nextStep` props. Shows clean empty state when all empty. Shows "Doing Well" / "Working On" / "Current Focus" / "Next Step" sections when data is present. No raw coach notes. No scores. No internal fields.

**No issues found in:**
- All "requires approval" and "query only" labels in command center
- All "preview only" / "not sent" labels on director-side panels
- All empty states on player and parent portal
- All privacy boundaries (no coach notes, no scores, no observations exposed to player/parent)
- Product/tool language scan: CLEAN across all Sprint 228 files

**QA results:**
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS, zero forbidden references
- `qa-command-parser.mjs` — 24/24 passed
- Product language scan (Sprint 228 files) — CLEAN

**TypeScript:** 0 errors.

### Files created
- `src/components/player/ParentSafeProgressPreview.tsx` — parent-safe progress display component for parent portal.

### Files modified
- `src/app/parent/page.tsx` — `ParentSafeProgressPreview` replaces old placeholder card; `isPreviewOnly={false}` corrected.
- `src/app/director/improvement/page.tsx` — "Working On" label and "No development focus set" empty text polish.
- `src/app/director/players/active/page.tsx` — "Current Focus" label polish.

---

## 2026-05-03 — Sprint 227: Conversational OS Documentation + Locked Principles V1

**Mode:** Docs only. No app code. No schema changes. No migrations.

**What was built:**
- `docs/conversational-os/conversational-os-master-plan.md` — new locked-principles document containing:
  - North star and core operating principle
  - Role-specific experiences (academy_director, head_coach, coach, player, parent)
  - Full command lifecycle diagram with intent type table
  - Approval model table (what requires approval)
  - Data safety model (role isolation + audit requirements)
  - Player Q&A model (safe data sources, answer intents)
  - Parent guidance model (safe fields, never-exposed fields)
  - Curriculum learning module model (fields, computation source)
  - Coach recap model (flow, outputs)
  - 10-item hard list of what must never happen automatically
  - Next build order (Sprints 229–238)
- `docs/CURRENT_BUILD_TARGET.md` — date + phase updated; Conversational OS Foundation section added marking Sprints 219–228 complete
- `docs/LOCKED_MODULES.md` — date updated; four new locked modules added (parentSafeResponseRules, learningModules, roleGuardrails, master plan); "usable but incomplete" table expanded; "not built yet" table corrected for routes that now exist
- `docs/KNOWN_LIMITATIONS.md` — date updated; new Conversational OS section added with six specific limitations (player portal empty state, parent portal empty state, no full chat UI, modules director-preview only, draft execution limited, parent guidance not yet sendable)

**QA results:**
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS, zero forbidden references
- `qa-command-parser.mjs` — 24/24 passed
- Product language scan on Sprint 227 doc files — CLEAN

**TypeScript:** 0 errors.

### Files created
- `docs/conversational-os/conversational-os-master-plan.md` — conversational OS architecture + locked principles.

### Files modified
- `docs/CURRENT_BUILD_TARGET.md` — phase update + completed foundation section.
- `docs/LOCKED_MODULES.md` — new stable modules, corrected route table.
- `docs/KNOWN_LIMITATIONS.md` — new conversational OS limitations section.

---

## 2026-05-03 — Sprint 226: Learning Modules → Player Next Mission V1

**Mode:** Pure helper update + UI display. No DB writes. No AI calls. No migrations.

**What was built:**
- `playerProgressQa.ts` — updated `PlayerProgressQaAnswer` with `mini_challenge`, `reflection_question`, `try_this` fields (nullable); `PlayerProgressQaInput` now accepts optional `learningModuleHint`; `what_to_practice` answer populates these from the hint if available; graceful fallback if no hint
- `PlayerQaPreviewPanel.tsx` — now shows "Mission", "Try this", "This week's challenge", "Reflection" sections below the answer when the `what_to_practice` intent is active
- `page.tsx` (player profile) — computes `qaLearningModuleHint` from `buildModuleForLevelDomain()` using first coach language entry; passed to `PlayerQaPreviewPanel`
- `components/player/PlayerMissionPreview.tsx` — new component for player home page showing strength, mission, next win, current level (empty state if all null)
- `app/player/page.tsx` — uses `PlayerMissionPreview` replacing old placeholder card

**TypeScript:** 0 errors.

### Files created
- `src/components/player/PlayerMissionPreview.tsx` — player-facing mission display component.

### Files modified
- `src/lib/player/playerProgressQa.ts` — `QaLearningModuleHint` type, new answer fields, learning module integration.
- `src/app/director/players/[playerId]/PlayerQaPreviewPanel.tsx` — Mission/Try this/Reflection sections.
- `src/app/director/players/[playerId]/page.tsx` — import `buildModuleForLevelDomain`, compute `qaLearningModuleHint`, pass to panel.
- `src/app/player/page.tsx` — `PlayerMissionPreview` replacing placeholder.

---

## 2026-05-03 — Sprint 225: Coach Recap Director Review Preview V1

**Mode:** Read-only display improvement. No new tables. No migrations. No writes.

**What was built:**
- `StructuredDraftCard.tsx` — improved display for session recap proposed_actions:
  - **Source Recap** section: shows truncated raw coach voice recap in italics
  - **Session Focus** section: shows `session_actual_draft.actual_focus` tags + skipped items
  - **Will change if approved** panel: lists specific records flagged (attendance, observations, parent drafts, director summary)
  - **Will not change automatically** panel: explicitly calls out curriculum levels, parent communications, advancement decisions
- Uses `CheckCircle2`, `XCircle`, `FileText`, `Activity` icons to make sections visually distinct

**TypeScript:** 0 errors.

### Files modified
- `src/app/director/review/StructuredDraftCard.tsx` — added source recap, session focus, will/won't change panels.

---

## 2026-05-03 — Sprint 224: Command Center Draft Visibility V1

**Mode:** Read-only draft display. No new tables. No migrations. No writes.

**What was built:**
- `RecentDraftsPanel` — new sub-component in `CommandCenterClient.tsx`:
  - Shows recent command-created `proposed_actions` with `target_module = 'director_command'`
  - Displays: status badge (color-coded), intent label, command text, "what would happen", "will not do" list, created time
  - Empty state if no drafts yet
  - Link to `/director/review` from each pending draft
  - Link to review queue in header
- `page.tsx` — fetches `recentDrafts` from `proposed_actions` scoped by `academy_id`; passes to `CommandCenterClient`

**TypeScript:** 0 errors.

### Files modified
- `src/app/director/command-center/CommandCenterClient.tsx` — `RecentDraft` type, `RecentDraftsPanel` component, `recentDrafts` prop wired.
- `src/app/director/command-center/page.tsx` — query for recent command drafts passed to client.

---

## 2026-05-03 — Sprint 223: Parent Guidance Preview V1

**Mode:** Director-only preview. No emails. No parent portal. No writes. No AI.

**What was built:**
- `ParentGuidancePreviewPanel.tsx` — director-side client component on Notes tab of player profile:
  - "What your child is working on" — from curriculum level + coach language current_focus (sanitized)
  - "Next target" — shown if nextLevelName exists
  - "How to support this week" — from parent_support_tip or safe fallback
  - "What to say after practice" — 3 fixed suggestions
  - "What not to over-focus on" — 3 pressure-reducing reminders
  - "Pressure-reducing note" — personalized with first name
  - Badge: "Director preview — not sent"
  - Guardrail note: "No parent communication is sent from this preview."
- All text runs through `sanitizeParentFacingText()` from `parentSafeResponseRules.ts`.
- Uses `player.first_name`, `curriculum_level`, `curriculum_coach_language.current_focus` only — no raw coach notes.

**TypeScript:** 0 errors.

### Files created
- `src/app/director/players/[playerId]/ParentGuidancePreviewPanel.tsx` — parent guidance preview client component.

### Files modified
- `src/app/director/players/[playerId]/page.tsx` — import + panel added to Notes tab.

---

## 2026-05-03 — Sprint 222: Director Command Center Guardrail Integration V1

**Mode:** Additive UI + server-side guard. No new tables. No migrations.

**What was built:**
- `CommandCenterClient.tsx` — replaced single role check with rich guardrail block:
  - "Academy Director — allowed" badge via `getRoleDisplayName` + `canRoleUseIntent`
  - "Creates review draft only — requires your approval" badge for action intents
  - "Query only — no draft created" badge for read-only intents
  - Director boundary sentence via `getSafeResponseBoundary`
  - Added 2 new example commands: group draft + director note
- `submitDirectorCommandAction.ts` — added `canRoleUseIntent` server-side guardrail before draft creation. Returns error if role is blocked (e.g. unknown role attempts action).

**TypeScript:** 0 errors.

### Files modified
- `src/app/director/command-center/CommandCenterClient.tsx` — guardrail badges + new examples.
- `src/app/director/command-center/submitDirectorCommandAction.ts` — server-side role guardrail.

---

## 2026-05-03 — Sprint 221: Role-Aware Chat Guardrails V1

**Mode:** Pure helper + spec doc + light UI integration. No DB calls. No migrations.

**What was built:**
- `roleGuardrails.ts` — 6 exported functions governing role-based command/data access:
  - `canRoleUseIntent(role, intentType)` — boolean permission check
  - `intentRequiresApproval(intentType)` — true for create_session_draft, create_group_draft, record_director_note
  - `canExposeFieldToRole(role, fieldOrCategory)` — data access gate
  - `getBlockedReason(role, intentType)` — human-readable block message
  - `getSafeResponseBoundary(role)` — one-sentence boundary description per role
  - `getRoleDisplayName(role)` — display name for role
- `role-aware-chat-guardrails.md` — full spec: permission matrix, intent map, field exposure table, parent/player privacy rules, child-safety principles, audit log requirements.
- Light integration: `PlayerQaPreviewPanel` now shows player-safe boundary note via `getSafeResponseBoundary('player')`.

**TypeScript:** 0 errors.

### Files created
- `src/lib/commands/roleGuardrails.ts` — role permission helper.
- `docs/conversational-os/role-aware-chat-guardrails.md` — guardrail spec.

### Files modified
- `src/app/director/players/[playerId]/PlayerQaPreviewPanel.tsx` — added player-safe boundary note.

---

## 2026-05-03 — Sprint 220: Curriculum Learning Modules UI V1

**Mode:** Read-only director preview. No AI. No writes. No player/parent exposure.

**What was built:**
- `/director/curriculum/learning` page — server component fetches all levels, gates, drills, coach language; calls `buildLearningModulePreviews()`; passes modules to client.
- `LearningModulesClient.tsx` — client component: stage/domain/level filters, grouped module cards, expandable detail (why it matters, key idea, watch for, try this, mini challenge, reflection, parent tip, source labels).
- Link added from `/director/curriculum` footer to `/director/curriculum/learning`.
- Badge: "Learning Module Preview — read-only".
- Stats strip: module count, level count, domain count, gates, drills.

**TypeScript:** 0 errors.

### Files created
- `src/app/director/curriculum/learning/page.tsx` — server page: auth + data fetch + module build.
- `src/app/director/curriculum/learning/LearningModulesClient.tsx` — client: filters + expandable module cards.

### Files modified
- `src/app/director/curriculum/page.tsx` — added "Learning Modules" link in footer nav.

---

## 2026-05-03 — Sprint 219: Curriculum Learning Module Model V1

**Mode:** Pure helper + spec doc. No DB calls. No UI. No side effects.

**What was built:**
- `learningModules.ts` — deterministic module builder from curriculum data. Exports:
  - `LearningModuleDomain` — 8 domain types
  - `CurriculumLearningModule` — full module shape (16 fields)
  - `buildLearningModulePreviews(input)` — generates all modules for all level+domain combos
  - `buildModuleForLevelDomain(input)` — single module for one level+domain
  - `getLearningModuleSafetyNote(role)` — role-appropriate safety note text
- `curriculum-learning-module-model.md` — spec: module structure, domain table, language rules, generation rules.
- Modules generated from: `curriculum_levels` × `curriculum_coach_language` × `curriculum_gates` × `curriculum_drills`

**TypeScript:** 0 errors.

### Files created
- `src/lib/curriculum/learningModules.ts` — pure learning module builder helper.
- `docs/curriculum/curriculum-learning-module-model.md` — module structure spec.

---

## 2026-05-03 — Sprint 218: Player Progress Q&A Preview V1

**Mode:** Read-only director preview. No AI calls. No writes. No parent/player exposure.

**What was built:**
- `playerProgressQa.ts` — pure deterministic Q&A helper. Exports:
  - `PlayerProgressQuestionIntent` — 6 intents: `current_level`, `next_level`, `level_requirements`, `what_to_practice`, `level_meaning`, `unknown`
  - `parsePlayerProgressQuestion(question)` — keyword-based intent detection
  - `buildPlayerProgressAnswer(intent, input)` — deterministic answers from curriculum level, gates, drills, coach language
  - Answer shape: `question_intent`, `title`, `answer`, `bullets`, `next_mission`, `safety_note`, `source_labels`, `blocked_reason`
- `PlayerQaPreviewPanel.tsx` — director-only client component added to the Skill Path tab. Features:
  - 4 sample question buttons: "What level am I?", "What do I need to do next?", "How do I move up?", "What should I practice?"
  - Custom question input
  - Answer card with intent label, bullets, next mission, source labels
  - "Director preview — read-only" badge
  - Guardrail note: "Uses curriculum level, gates, drills, and coach language only. Internal notes are not shown."
- `page.tsx` updated with two new sequential queries: `curriculum_drills` (top 5 by level_min_id) and `curriculum_coach_language` (all domains for current level).

**Safety:** Read-only only. No mutations. No external AI. No parent/player portal exposure. Player portal remains a stub.

**Supported questions:** current_level · next_level · level_requirements · what_to_practice · level_meaning · unknown fallback

**QA scripts:** qa-curriculum-seed-migration.mjs (38/38) · audit-curriculum-product-language.mjs (PASS) · qa-command-parser.mjs (24/24)

**Product language:** CLEAN — no Swinget, SwingCheck, The Angle, or [PROPOSED:] in sprint files.

**TypeScript:** 0 errors.

### Files created
- `src/lib/player/playerProgressQa.ts` — pure Q&A helper: intent detection + deterministic answer builder.
- `src/app/director/players/[playerId]/PlayerQaPreviewPanel.tsx` — client component: interactive Q&A preview panel with director badge.

### Files modified
- `src/app/director/players/[playerId]/page.tsx` — added drills + coach language queries; `PlayerQaPreviewPanel` added to Skill Path tab.

---

## 2026-05-03 — Sprint 217: Parent-Safe Response Rules V1

**Mode:** New utility module + spec doc. No DB calls, no UI, no side effects.

**What was built:**
- `parentSafeResponseRules.ts` — four exported functions governing parent-facing communication:
  - `canShowParentField(fieldName)` — runtime gate against a field allowlist (7 safe fields)
  - `sanitizeParentFacingText(text)` — replaces 11 harsh/clinical phrases + strips internal annotations
  - `getParentSafeToneGuidelines()` — 10 guidelines for coach-facing UI copy and future AI prompts
  - `buildParentSupportGuidanceDraft(params)` — constructs parent-safe session summary (handles absent/late/present with skill focus + sanitized observation)
- `parent-safe-response-rules.md` — full spec: field allowlist, sanitization table, tone rules, draft examples, integration points.

**Safety:** No communications sent. No parent portal changes. All output requires director/coach review before use.

**TypeScript:** 0 errors.

### Files created
- `src/lib/communications/parentSafeResponseRules.ts` — parent-safe response utility module.
- `docs/conversational-os/parent-safe-response-rules.md` — field allowlist, sanitization rules, tone guidelines, integration map.

---

## 2026-05-03 — Sprint 216: Coach Recap Command Center V1

**Mode:** Rule-based structuring. No external AI. All results require director review.

**What was built:**
- `structureCoachRecapAction` — server action on coach session page. Authenticates coach, fetches session roster, runs deterministic keyword structuring (absence/late/skill phrase detection per player), creates `voice_commands` + `proposed_actions` (target_module='session_recap_structuring', status='pending_review'), marks voice_note as 'structured'.
- `CoachRecapCommandPanel` — client component replacing `SessionRecapPanel`. Shows real-time client-side signal preview as coach types (absence/late/skill keywords). "Save Recap" → returns `voiceNoteId`. "Structure Now" button appears after save → calls structuring action → shows attendance mentions, observation count, link to /director/review.
- `saveSessionRecapAction` updated to return `voiceNoteId` via `.select('id').single()`.

**Safety:** structureCoachRecapAction checks `processing_status === 'structured'` to prevent double-structuring. All structured drafts require director approval before any records change. No player profiles, attendance records, or priorities were modified.

**TypeScript:** 0 errors.

### Files created
- `src/app/coach/sessions/[sessionId]/structureCoachRecapAction.ts` — server action: roster build → rule-based structuring → voice_commands + proposed_actions.
- `src/app/coach/sessions/[sessionId]/CoachRecapCommandPanel.tsx` — client component: real-time signal preview + save + structure flow.

### Files modified
- `src/app/coach/sessions/[sessionId]/actions.ts` — `SaveSessionRecapResult` now includes `voiceNoteId`; `saveSessionRecapAction` returns it.
- `src/app/coach/sessions/[sessionId]/page.tsx` — replaced `SessionRecapPanel` with `CoachRecapCommandPanel`; imports `structureCoachRecapAction`.

---

## 2026-05-03 — Sprint 215: Director Commands to Review Drafts V1

**Mode:** Server action. Creates proposed_actions from parsed director commands. No auto-execution.

**What was built:**
- `submitDirectorCommandAction` — parses command text using `parseAcademyCommand`, then for action intents creates `voice_commands` + `proposed_actions` rows (status: pending_review). Query-only intents return parsed result only with no DB write. Role-checked: director/head_coach only.
- `CommandCenterClient` wires up "Create Review Draft" button for action intents. Shows draft created confirmation + link to /director/review.

**Safety:** All drafts: status=pending_review. Nothing executes until director approves from /director/review. Query intents write nothing.

**TypeScript:** 0 errors.

### Files created/modified
- `src/app/director/command-center/submitDirectorCommandAction.ts` — server action: parse → voice_commands → proposed_actions.

---

## 2026-05-03 — Sprint 214: Command Intent Parser V1

**Mode:** New library module + QA script. No DB calls. No side effects.

**What was built:**
- `src/lib/commands/parseAcademyCommand.ts` — deterministic regex-based parser supporting 8 intent types: show_players_missing_curriculum_level, show_curriculum_gap_suggestions, show_advancement_eligible, create_session_draft, create_group_draft, record_director_note, ask_curriculum_level_requirements, summarize_reassessment_pipeline, unknown.
- Returns: intent_type, confidence (high/medium/low), extracted_entities (level, focus, note_text), missing_information, suggested_next_step, requires_confirmation, role_required, will_not_do.
- Curriculum level extraction via regex: matches "Orange 2", "Green 1", "High Performance 3" patterns.
- `scripts/qa-command-parser.mjs` — 24 test cases, all passing.

**TypeScript:** 0 errors. QA: 24/24 passed.

### Files created
- `src/lib/commands/parseAcademyCommand.ts` — deterministic command intent parser.
- `scripts/qa-command-parser.mjs` — 24-case QA script.

---

## 2026-05-03 — Sprint 213: Director Command Center UI V1

**Mode:** New route + UI. Read-only except for parse/draft actions.

**What was built:**
- `/director/command-center` — premium dark UI: command input textarea (⌘↵ to parse), example commands list, recent command history from voice_commands, available curriculum levels reference strip, pending draft count link to review queue.
- `CommandCenterClient` — client component: parse command → show intent/confidence/entities/what-would-happen/will-not-do; "Create Review Draft" button for action intents; confirmation link to review queue.
- Sidebar nav: "Command Center" added to Intelligence section.
- Page header: operating principle strip "Voice creates → UI confirms → Database structures → System executes."

**TypeScript:** 0 errors.

### Files created
- `src/app/director/command-center/page.tsx` — Server component; fetches recent commands, curriculum levels.
- `src/app/director/command-center/CommandCenterClient.tsx` — Client UI for command input and intent preview.

### Files modified
- `src/components/nav/SidebarNav.tsx` — Added Command Center to Intelligence section.

---

## 2026-05-03 — Sprint 212: Conversational Command Architecture Audit

**Mode:** Audit + documentation. No code changes.

**What was documented:**
- Full map of existing command-like systems: voice notes + structuring, AI suggestions, proposed_actions lifecycle, director review queue.
- proposed_actions schema: action_type DB enum, target_module string, voice_command_id FK requirement.
- Role/membership patterns: director/head_coach write paths, coach session paths, player/parent stubs.
- Parent/player portal current state (both stub-only).
- Safe V1 command intents for the command center (8 intents).
- Blocked command intents (6 categories).
- No-code next sprint plan for Sprints 213–221.
- Architecture principle confirmation: voice/text creates → proposed_actions/drafts → director approves.

**TypeScript:** 0 errors.

### Files created
- `docs/conversational-os/conversational-command-architecture-audit.md` — Full architecture audit for conversational OS foundation.

---

## 2026-05-03 — Recovery Sprint 206: Skill Path Tab Content V1

**Mode:** Tab content reorganization. No schema changes. No migrations. No mutations.

**What was built:**
- Moved `PlayerProgressionRequirements` (advancement score thresholds), `PlayerRequirementProgressReadOnly` (requirement progress with evidence), `EvidenceRequirementDrafts`, and `EvidenceRequirementDraftButton` from the Notes tab into the Skill Path tab where they belong.
- `skillPathSlot` declaration moved to after all required data fetches so all variables (`requirementProgressRows`, `evidenceByProgressId`, `confirmProgressAction`, `createEvidenceDraftAction`, `progressionScores`) are in scope.
- Skill Path tab now shows the full director view: level picker → version source → advancement → curriculum grid → gate requirements with evidence → advancement thresholds → requirement progress → evidence linking → review-based guardrail.
- `DevelopmentSummarySection` labels polished: "Current Strengths" → "Doing Well", "Things to Work On" → "Working On", "Development Focus" → "Current Focus", "Coach Summary" → "Coach Insight", "Student-Facing Preview" → "Player Preview", "Visible to student" → "Visible to player".
- Notes tab cleaned: removed curriculum-specific progression content that now lives in Skill Path tab; retains development summary, AI draft, observations feed, priorities, voice, evidence timeline.

**Safety:** UI reorganization only. No new queries. No new mutations. No schema changes.

**TypeScript:** 0 errors. QA: 38/38. Product-language: PASS.

### Files modified
- `src/app/director/players/[playerId]/page.tsx` — skillPathSlot reorganized with full content; moved from pre-fetch position to post-fetch position.
- `src/components/player/DevelopmentSummarySection.tsx` — Label polishing for director clarity.

---

## 2026-05-03 — Recovery Sprint 205: Player Profile Tab Structure V1

**Mode:** Audit + documentation. No code changes required.

**Audit result:**
- `PlayerProfileTabs` component (`_components/PlayerProfileTabs.tsx`) is complete: 5 tabs — Overview, Skill Path, Competition, Fitness / Load, Notes.
- All tabs use `<TabsList scrollable>` for mobile-safe horizontal scrolling.
- Each tab has content: Overview (player info, curriculum card, level progress, domain summary), Skill Path (level picker, assignment, advancement, progress grid, gates), Competition (premium empty state), Fitness (empty state + fitness homework recommendation), Notes (full coach notes, voice, observations, priorities, evidence).
- Tab content is injected via server component slots — no client-side coupling.
- Sprint 205 was fully implemented in earlier sprints (tab component, content, mobile support). Documentation gap only.

**TypeScript:** 0 errors (no code changes).

### Files audited (no changes)
- `src/app/director/players/[playerId]/_components/PlayerProfileTabs.tsx`
- `src/app/director/players/[playerId]/page.tsx`

---

## 2026-05-03 — Recovery Sprint 207: Session Template Curriculum Level Picker V1

**Mode:** UI wiring. No schema changes. No migrations. No auto-changes to existing templates.

**What was built:**
- Template detail page (`fitness/templates/[templateId]/page.tsx`) now fetches all 15 `curriculum_levels` and renders `CurriculumLevelSelector` for every template (fitness and class). Directors can assign a level, which saves to `templates.curriculum_level_id` via the existing `setCurriculumLevelAction`.
- Helper copy: "Assign a level to power session curriculum context and coach cues." / "Sessions generated from this template will show curriculum context for [level]."
- Empty state shown when no curriculum levels are seeded.
- Class templates list (`class-templates/page.tsx`) now shows a lime curriculum level badge when a template has a level assigned.
- `rawDb` cast hoisted to function scope in template detail page (was scoped inside an `if` block).

**Why this matters:** Director session pages already read `template.curriculum_level_id` and pass it to `SessionCurriculumContextPanel`. This sprint closes the gap — directors can now set the level without touching the DB directly.

**Safety:** Director-explicit action only. No auto-changes. No auto-population of drills. The column exists in DB (migration 045); generated types do not reflect it — rawDb used throughout.

**TypeScript:** 0 errors. QA: 38/38. Product-language: PASS.

### Files modified
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Added curriculum level fetch, rendered CurriculumLevelSelector, hoisted rawDb.
- `src/app/director/class-templates/page.tsx` — Added rawDb fetch with curriculum_level_id; shows level badge in template list rows.

---

## 2026-05-03 — Sprint 211: Curriculum Gate Evidence Tracking V1

**Mode:** New components + server action. No schema changes. No migrations. No auto-advancement.

**What was built:**
- `GateEvidenceButton.tsx` — director-only client component. "Record evidence" inline form per gate row. Submits to `proposed_actions` for review. Shows success/error state.
- `recordGateEvidenceAction.ts` — server action scoped to director/head_coach. Inserts `proposed_actions` with `action_type = 'other'` and payload `{ subtype: 'curriculum_gate_observation', gate_id, gate_criterion, evidence_text, player_id }`. Requires approval.
- `PlayerLevelRequirementsCard.tsx` — added optional `gateActions?: Record<string, ReactNode>` prop. Renders action slot below each gate row. Removed "coming next" placeholder.
- Player profile page wires `GateEvidenceButton` into each gate row via `gateActions` map.

**Safety:** Evidence goes to `proposed_actions` with `requires_approval = true`. Nothing changes until director approves. No auto-advancement triggered.

**TypeScript:** 0 errors.

### Files created
- `src/app/director/players/[playerId]/GateEvidenceButton.tsx` — Client component for inline evidence recording.
- `src/app/director/players/[playerId]/recordGateEvidenceAction.ts` — Server action for evidence draft creation.

### Files modified
- `src/components/player/PlayerLevelRequirementsCard.tsx` — Added `gateActions` prop; removed placeholder text.
- `src/app/director/players/[playerId]/page.tsx` — Imports GateEvidenceButton; passes gateActions map to requirements card.

---

## 2026-05-03 — Sprint 210: Coach Workspace Live Session Curriculum Context

**Mode:** UI enrichment. No schema changes. No migrations. Read-only curriculum data.

**What was built:**
- Coach session page now fetches `player_curriculum_states` + `curriculum_levels` for all roster players.
- `RosterPlayer` interface extended with `curriculumLevelName` and `curriculumStage`.
- Attendance roster in `CoachSessionExecutionClient` shows each player's curriculum level in stage color below their name.
- Stage colors: red (Red Foundation), amber (Orange Development), green (Green Performance), yellow (Yellow Competitive), violet (High Performance).

**Safety:** Read-only fetch. No mutations. Academy-scoped query.

**TypeScript:** 0 errors.

### Files changed
- `src/app/coach/sessions/[sessionId]/page.tsx` — Added curriculum state fetch; extended RosterPlayer interface.
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` — Added STAGE_TEXT map; renders curriculum level below player name.

---

## 2026-05-03 — Sprint 209: Placement Engine V1

**Mode:** New page + server actions. No schema changes. No migrations.

**What was built:**
- `/director/placement` — new director-only page listing all pending-placement players.
- `PlacementEngineClient.tsx` — client UI: per-player card with create-draft form (group + track + optional level + notes); review/approve existing draft; activate approved player.
- `placementDraftAction.ts` — three server actions scoped to director/head_coach: `createPlacementDraftAction` (inserts `placement_recommendations`), `approvePlacementDraftAction` (updates status to 'approved'), `activatePlayerAction` (calls `finalize_player_placement` RPC).
- Deterministic track suggestion: age < 16 → Skill, age 16+ → Competition (director can override).
- Status summary chips: "needs draft", "awaiting approval", "ready to activate".

**Safety:** `finalize_player_placement()` called only after director explicitly approves. No auto-activation. All actions validate director/head_coach membership before executing.

**TypeScript:** 0 errors.

### Files created
- `src/app/director/placement/page.tsx` — Server component; fetches pending players, groups, levels, existing recs.
- `src/app/director/placement/PlacementEngineClient.tsx` — Client UI for the full placement flow.
- `src/app/director/placement/placementDraftAction.ts` — Server actions: create, approve, activate.

---

## 2026-05-03 — Sprint 208: Director Dashboard Curriculum Intelligence

**Mode:** UI + data fetch. No schema changes. No migrations. No mutations.

**What was built:**
- Curriculum coverage section on director dashboard: players with assigned level, players missing level, curriculum gap suggestion count.
- Data fetched from `player_curriculum_states` (count per academy) and `academy_suggestions` (filtered by `suggestion_type = 'curriculum_gap'` and `status = 'pending'`).
- Missing-level count shown in orange when > 0; gap suggestions link to `/director/ai-suggestions`; player counts link to `/director/players`.

**Safety:** Read-only display. No mutations. No auto-promotion.

**TypeScript:** 0 errors.

### Files changed
- `src/app/director/page.tsx` — Added curriculum coverage data fetch and intelligence section UI.

---

## 2026-05-03 — Sprint 204: Player Curriculum Level Assignment UI

**Mode:** UI + server action. No schema changes. No migrations. No auto-promotion.

**What was built:**
- `setCurriculumLevelAction.ts` — new `'use server'` action scoped to director/head_coach; calls existing `assign_player_curriculum_state` RPC with explicit `p_level_id`; validates membership and level existence before write.
- `CurriculumLevelPickerCard.tsx` — select all 15 curriculum levels grouped by stage; Save button only enabled when selection changed; shows level preview before save; success/error state; guardrail copy: "This does not auto-promote the player."
- `page.tsx` — fetches all 15 `curriculum_levels` on load; renders `CurriculumLevelPickerCard` at top of Skill Path tab.

**Safety:** Explicit director action only. No automatic level change. No parent/player notification. No AI.

**TypeScript:** 0 errors. QA: 38/38. Product-language: PASS.

### Files changed
- `src/app/director/players/[playerId]/setCurriculumLevelAction.ts` — New server action for curriculum level assignment.
- `src/app/director/players/[playerId]/CurriculumLevelPickerCard.tsx` — New UI component for level selection.
- `src/app/director/players/[playerId]/page.tsx` — Fetches levels list; adds picker to Skill Path tab.

---

## 2026-05-03 — Sprint 203: Player Profile Responsive Layout

**Mode:** UI-only. No data changes.

**What was improved:**
- Player profile outer container: `p-6` → `p-4 sm:p-6` for smaller mobile padding.
- Added `max-w-5xl` cap to prevent runaway width on large monitors.
- Back link to `/director/players` already present in `PlayerProfileHeader`.
- Responsive `grid-cols-1 xl:grid-cols-[1fr_240px]` already in place for overview tab.

**TypeScript:** 0 errors.

### Files changed
- `src/app/director/players/[playerId]/page.tsx` — Responsive padding and max-width.

---

## 2026-05-03 — Sprint 202: Players List Curriculum Enrichment

**Mode:** UI + server data. No schema changes. No migrations.

**What was built:**
- `PlayersPage`: fetches `player_curriculum_states` + `curriculum_levels` for all active players; builds `curriculumMap` record; shows "N without curriculum level" badge in header when any players are missing.
- `PlayersDirectoryClient`: accepts `curriculumMap` prop; shows new-curriculum stage badge + level name (from migration 052 tables) when available; falls back to old `LevelBadge` from `v_player_summary`; shows "Ready to advance" badge from new `advancement_eligible` field.

**TypeScript:** 0 errors. QA: 38/38. Product-language: PASS.

### Files changed
- `src/app/director/players/page.tsx` — Added curriculum state fetch and `curriculumMap` prop.
- `src/app/director/players/_components/PlayersDirectoryClient.tsx` — New curriculum badge + `curriculumMap` prop.

---

## 2026-05-03 — Sprint 201: Curriculum Integration QA + Polish

**Mode:** Polish + docs. No schema changes. No new migrations.

**QA results:**
- `node scripts/qa-curriculum-seed-migration.mjs` — 38/38 checks passed.
- `node scripts/audit-curriculum-product-language.mjs` — PASS. Zero product/tool references. Allowed tennis phrases intact.
- `npx tsc --noEmit` — 0 errors.

**What was fixed:**
- `CurriculumExplorer`: Level list and detail panel now stack on mobile (`flex-col md:flex-row`). Left column width responsive (`w-full md:w-56`).
- `CurriculumExplorer`: `shadow-lime` (undefined class) replaced with `shadow-[0_0_8px_rgba(200,255,0,0.15)]` for selected level card glow.

**Docs updated:**
- `docs/KNOWN_LIMITATIONS.md` — Added curriculum integration section covering: level assignment has no UI, session context requires template level, drill `procedure` field not fetched, "Use in session" disabled, explorer is Director-only.

### Files changed
- `src/components/curriculum/CurriculumExplorer.tsx` — Responsive two-panel layout; fixed shadow class.
- `docs/KNOWN_LIMITATIONS.md` — Added curriculum integration limitations section.

---

## 2026-05-03 — Sprint 200: Director Curriculum Demo Flow V1

**Mode:** UI-only. No schema changes. No new migrations. No fake data inserted.

**What was built:**
- `CurriculumDemoFlowPanel` — new collapsible component on `/director/curriculum` with a 7-step demo walk-through: choose a level → read gates → browse drills → read coach language → open a player → see level requirements → open a session with curriculum context. Each step links to the relevant page. Collapsed by default.
- No fake data inserted — all CTAs link to real pages; explorer uses live seed data.
- Product-language audit: CLEAN.

**TypeScript result:** 0 errors.

### Files changed
- `src/components/curriculum/CurriculumDemoFlowPanel.tsx` — New. Collapsible 7-step demo flow panel.
- `src/app/director/curriculum/page.tsx` — Added `CurriculumDemoFlowPanel` above the "How it works" section.

---

## 2026-05-03 — Sprint 199: AI Suggestions From Curriculum Gaps V1

**Mode:** Logic + UI. No schema changes. No new migrations. No AI API calls. No npm installs.

**Audit:** Existing `academy_suggestions` table + `SuggestionCard` component + `generateAcademySuggestionsAction` already handles suggestion lifecycle with accept/deny/defer. Suggestion types include `curriculum_gap`.

**What was added to `generateAcademySuggestions.ts`:**
- `PlayerCurriculumStateInput` interface.
- `buildNoCurriculumAssignmentSuggestions()` — generates `curriculum_gap` suggestions for active players with no curriculum level assigned.
- `buildCurriculumProgressStaleSuggestions()` — generates `curriculum_gap` suggestions for players at a level for ≥60 days without review (high priority at ≥90 days).
- `AcademySuggestionDraftInputs` extended with optional `playerCurriculumStates`.
- `buildAcademySuggestionDrafts()` updated to call both new generators.

**What was added to `suggestionActions.ts`:**
- Fetches `player_curriculum_states` (current_level_id, updated_at) for all active players.
- Fetches curriculum level names for enrichment.
- Passes `playerCurriculumStates` to `buildAcademySuggestionDrafts`.
- Duplicate-prevention via existing existingSet is preserved.

**Safety:** No auto-writes. No auto-promotions. No AI calls. Suggestions are pending_review; directors accept/deny via existing review UI.

**TypeScript result:** 0 errors.

### Files changed
- `src/lib/suggestions/generateAcademySuggestions.ts` — Added curriculum gap generators and input type.
- `src/app/director/ai-suggestions/suggestionActions.ts` — Added curriculum state fetch and pass to generator.

---

## 2026-05-03 — Sprint 198: Session Planning Curriculum Context V1

**Mode:** UI-only. No schema changes. No new migrations. No npm installs.

**Audit:** Session page at `/director/sessions/[sessionId]` already had a "Curriculum Focus" card showing level name + stage + academy overrides. It already fetches `template.curriculum_level_id`.

**What was added:**
- `SessionCurriculumContextPanel` — new component showing top domains, active gates (up to 4), recommended drills (up to 3), coach language cues (up to 3 domains). "Full explorer" link to /director/curriculum. Read-only. Internal coach context only.
- `SessionNoCurriculumContextPanel` — graceful empty state when session has no curriculum level assigned.
- Session page: queries added for gates/drills/coach language for the session's curriculum level (using rawDb pattern). Both panels rendered in the session view — context panel below existing curriculum focus card; no-context panel when template has no level.

**Safety:** Read-only. No mutations. No template changes. No auto-generation.

**TypeScript result:** 0 errors.

### Files changed
- `src/components/curriculum/SessionCurriculumContextPanel.tsx` — New. Session-scoped curriculum context panel.
- `src/app/director/sessions/[sessionId]/page.tsx` — Added extended curriculum data queries and panel renders.

---

## 2026-05-03 — Sprint 197: Player Level Requirements Read-Only View V1

**Mode:** UI-only. No schema changes. No new migrations. No npm installs.

**What was built:**
- `PlayerLevelRequirementsCard` — new component showing gate-based requirements to advance from current Skill Track level. Gates grouped by domain; each row shows criterion, threshold (lime), evaluator, evidence window. Evidence tracking placeholder at bottom. Empty states for no curriculum / no gates.
- Player profile Skill Path tab: `PlayerLevelRequirementsCard` added after `CurriculumProgressGrid`.
- Player profile page: query added for gates where `from_level_id = curriculumSummary.current_level_id`, `is_active = true`, ordered by sort_order.

**Safety:** Read-only. No gate completion tracking. No auto-promotions. No fabricated progress.

**TypeScript result:** 0 errors.

### Files changed
- `src/components/player/PlayerLevelRequirementsCard.tsx` — New. Gate-based requirements to advance.
- `src/app/director/players/[playerId]/page.tsx` — Added gates query and `PlayerLevelRequirementsCard` render in Skill Path tab.

---

## 2026-05-03 — Sprint 196: Player Profile Curriculum Connection V1

**Mode:** UI-only. No schema changes. No new migrations. No npm installs.

**What was built:**
- `PlayerCurriculumCard` — new component showing Skill Track level, Competition Track level (from `player_curriculum_states.competition_track_level_id`), Fitness phase (from `player_curriculum_states.fitness_path_phase`), next target level, and "Explore" link to `/director/curriculum`. Premium empty state when no curriculum assigned.
- Player profile Overview tab sidebar: `PlayerCurriculumCard` added above existing `LevelProgressCard`.
- Player profile page: added sequential queries for `competition_track_level_id` and `fitness_path_phase` from `player_curriculum_states` using `rawDb` pattern; fetches competition track level name from `curriculum_levels`.

**Safety:** Read-only. No level assignment. No data writes. RLS enforced via academy_id + player_id scoping. rawDb cast used only for cross-table joins where TS2589 would occur.

**TypeScript result:** 0 errors.

### Files changed
- `src/components/player/PlayerCurriculumCard.tsx` — New. Curriculum track summary card.
- `src/app/director/players/[playerId]/page.tsx` — Added competition/fitness curriculum state query and `PlayerCurriculumCard` render in Overview sidebar.

---

## 2026-05-03 — Sprint 195: Coach Language Layer UX V1

**Mode:** UI-only. No schema changes. No new migrations. No AI calls.

**Changes to `CurriculumLevelDetailPanel.tsx`:**
- CoachLanguageTab: added three-view toggle — Coach View / Parent-Safe Draft / Player-Friendly Draft.
- Coach View: unchanged full language (doing_well / working_on / current_focus / next_step).
- Parent-Safe Draft: deterministic subset — "What's going well" (doing_well) + "What we're working toward" (next_step). Orange draft banner. Not published.
- Player-Friendly Draft: deterministic subset — "Your mission this level" (current_focus). Blue draft banner. Not published.
- All views read-only, clearly marked as draft/preview. Zero AI involvement.

**Product-language audit:** CLEAN.
**TypeScript result:** 0 errors.

### Files changed
- `src/components/curriculum/CurriculumLevelDetailPanel.tsx` — CoachLanguageTab upgraded with three-view toggle and draft preview banners.

---

## 2026-05-03 — Sprint 194: Curriculum Drill/Game Library UX V1

**Mode:** UI-only. No schema changes. No new migrations. No npm installs.

**Changes to `CurriculumLevelDetailPanel.tsx`:**
- DrillsTab: added session_block filter (in addition to existing domain filter) using shared `FilterPills` helper.
- DrillRow: shows full session_block name (not truncated 3-char code), all existing detail fields.
- "Use in session" disabled placeholder button on each drill row — tooltip indicates session builder is coming.
- Live count display: "Showing X of Y drills" with empty-filter messaging.
- No backend changes — `curriculumExplorer.ts` locked per AI_BACKEND_RULES.md #9.

**Product-language audit:** CLEAN.
**TypeScript result:** 0 errors.

### Files changed
- `src/components/curriculum/CurriculumLevelDetailPanel.tsx` — DrillRow and DrillsTab upgraded with session_block filter, full block label, "Use in session" placeholder.

---

## 2026-05-03 — Sprint 193: Curriculum Gates UX V1

**Mode:** UI-only. No schema changes. No new migrations. No npm installs.

**Changes to `CurriculumLevelDetailPanel.tsx`:**
- Fixed gate_type badge: now handles actual DB values — OBSERVATION, RESULT, RATE, COUNT, CHECKLIST, TIME_WINDOW — each with distinct color.
- Added `GateBadge` helper component for reusable pill styling.
- Evaluator and cadence now render as visual badge pills in each gate row.
- Threshold shown with lime monospace font for visual hierarchy.
- Gates tab header upgraded: "Level-up requirements" title, gate count, domain count, final exit gate indicator.
- "Evidence tracking coming" placeholder framing per sprint spec.

**Product-language audit:** CLEAN.
**TypeScript result:** 0 errors.

### Files changed
- `src/components/curriculum/CurriculumLevelDetailPanel.tsx` — Gate type badge map, evaluator/cadence badges, gates tab header upgrade.

---

## 2026-05-03 — Sprint 192: Curriculum Explorer Full Level Detail UX

**Mode:** UI-only. No schema changes. No new migrations. No npm installs.

**Route:** `/director/curriculum` — expanded level detail panel within existing explorer.

**Changes:**
- `CurriculumLevelDetailPanel.tsx` rewritten as `'use client'` component with full tabbed detail view.
- Four tabs per selected level: Gates | Drills | Coach Language | Fitness & Comp.
- Gates tab: all gates grouped by domain, expandable rows showing threshold/evaluator/cadence/evidence_window/recording_method/notes. HP3 final exit gate badge. Level-up requirements framing.
- Drills tab: domain filter pills, all drills with expandable rows showing setup/coaching cues/progressions/success_criteria.
- Coach Language tab: all domains, all four fields (doing well / working on / current focus / next step) in 2-col grid.
- Fitness & Comp tab: detailed Volume, Fitness, Competition cards with all available fields.
- Empty states per section when data is absent.
- Product-language audit: CLEAN.

**TypeScript result:** 0 errors.

**QA:** 38/38 curriculum seed checks pass. Product-language audit: PASS.

### Files changed
- `src/components/curriculum/CurriculumLevelDetailPanel.tsx` — Rewritten. Full tabbed detail panel replacing the previous preview-only layout.

---

## 2026-05-02 — Sprint 191: Build premium curriculum explorer

**Mode:** UI-only. No schema changes. No new migrations. No npm installs.

**Route:** `/director/curriculum` — rewrites the existing director curriculum page.

**New UI:** Premium Curriculum Explorer with:
- Summary bar: 15 levels, 57 gates, 152 drills, 120 coach language entries, product-clean badge
- Stage navigation tabs: Red / Orange / Green / Yellow / HP with level counts
- Level card list (left panel): stage-color accented, gates + drills count per level, lime glow on selection
- Level detail panel (right panel): exit gates by domain, drills preview, coach language sample, competition/fitness/volume snapshot
- Graceful degradation when migration 052 tables are not yet applied

**Data loading:** All curriculum tables loaded server-side via `getCurriculumExplorerData()`. Client component manages selection state only. No direct DB queries in client code.

**Existing features preserved:** `AcademyCurriculumVersionCard` + `VoiceOverrideInputPanel` moved to secondary section below the explorer.

**TypeScript result:** 0 errors.

**QA:** 38/38 curriculum seed checks pass. Product-language audit: PASS.

### Files changed
- `src/lib/backend/curriculumExplorer.ts` — New. Types + `getCurriculumExplorerData()` for migration 052 tables via rawDb pattern.
- `src/components/curriculum/CurriculumExplorer.tsx` — New. Client component with stage nav and level selection state.
- `src/components/curriculum/CurriculumLevelDetailPanel.tsx` — New. Detail panel: gates, drills, coach language, competition/fitness/volume.
- `src/app/director/curriculum/page.tsx` — Rewritten. Server component loads explorer data; mounts CurriculumExplorer; keeps existing version card and voice panel.

---

## 2026-05-03 — Sprint 190 Follow-up: Remove product language from curriculum seed data

**Mode:** Follow-up hotfix. No UI. No schema changes. No new tables. No npm installs.

**Migrations regenerated:** `supabase/migrations/053_curriculum_seed.sql`

**Product-language audit result:** CLEAN — all 10 seed sections pass `scripts/audit-curriculum-product-language.mjs`. Zero Swinget / Swing Check / SwingCheck / The Angle™ / `[PROPOSED:]` markers in any data field. Allowed tennis phrase `'First-volley closing the angle.'` intact.

**`[PROPOSED:]` handling:** Markers stripped from all fields; planning content retained. Applies to `curriculum_archetypes.primary_curriculum_protection` and `curriculum_failure_modes.required_response`.

**Swing Check in failure_modes:** Replaced with generic descriptions (`a standardized movement assessment`, `a video assessment protocol`).

**TypeScript result:** 0 errors.

**QA:** 38/38 checks pass. Audit script: PASS.

**Supabase rerun required:** Migration 053 uses `ON CONFLICT DO NOTHING` — already-inserted rows won't update. To apply the cleaned data, truncate `curriculum_archetypes` and `curriculum_failure_modes` before rerunning, or run targeted UPDATEs. See QA report §12b for exact SQL.

### Files changed
- `scripts/generate-curriculum-seed-sql.py` — Added `strip_product_refs()` helper; applied to all text fields in all section generators; simplified gate notes stripping to use same helper.
- `supabase/migrations/053_curriculum_seed.sql` — Regenerated; [PROPOSED:] and product names stripped from all data fields.
- `scripts/audit-curriculum-product-language.mjs` — New. Dedicated product-language audit script covering all 10 seed sections with allowed-phrase exceptions.
- `scripts/qa-curriculum-seed-migration.mjs` — Updated: [PROPOSED:] check now requires zero across all data lines.
- `docs/curriculum/curriculum-seed-import-qa.md` — Updated: sections 8, 12b, 13 reflect follow-up hotfix.

---

## 2026-05-03 — Sprint 190 Hotfix: Fix curriculum seed drill duration handling

**Mode:** Hotfix. No UI. No schema changes. No new tables.

**Migrations regenerated:** `supabase/migrations/053_curriculum_seed.sql`

**Root cause:** `DRILL_YELLOW2_COM_061` had `duration_minutes = 0`, violating migration 052 CHECK constraint `curriculum_drills_duration_minutes_check`. Generator coerced source value `0` to SQL `0` instead of `NULL`.

**Fix:** `scripts/generate-curriculum-seed-sql.py` — duration coercion changed so any value `< 1` (including 0 and blank) produces SQL `NULL`.

**Result:** 7 drills now have `duration_minutes = NULL`; 145 have a valid positive value; 0 have `duration_minutes = 0`. QA script: 38/38 checks pass. TypeScript: 0 errors.

---

## 2026-05-03 — Sprint 190: Curriculum Seed QA + Import Validation

**Mode:** QA only. No UI built. No app routes modified. No migrations created. No schema changes. No npm installs.

**Migrations created:** None.

**TypeScript result:** `npx tsc --noEmit` — 0 errors

**QA script:** `scripts/qa-curriculum-seed-migration.mjs` — 38 static checks, 0 failures.

**Live migration apply:** Could not execute — Supabase CLI not installed, no local Supabase instance, migrations 052 and 053 not yet applied to remote. Static QA substituted.

**Product-tool leakage result:** CLEAN in all core data fields. No Swinget, SwingCheck, Swing Check app, or The Angle™ references. `[PROPOSED:]` markers confirmed contained to archetypes and failure_modes sections only.

**Final readiness decision:** PASS WITH LIMITATIONS — static QA passes; live apply pending manual execution.

### Sprint 190 — Curriculum Seed QA V1
- Created `scripts/qa-curriculum-seed-migration.mjs` — Static QA script for migration 053. Parses SQL file and runs 38 checks: row counts per table, idempotency, HP3 exit gate, stage enum validity, product-tool leakage in core fields, `[PROPOSED:]` marker containment, all 15 display names, deferred table confirmation.
- Created `docs/curriculum/curriculum-seed-import-qa.md` — Full QA report. Documents static pass, live apply limitation, manual apply commands, row count SQL for post-apply verification, domain distribution audit, leakage analysis, and next sprint recommendation.

**Static row counts verified:**
- `curriculum_levels` UPDATEs: 15
- `curriculum_archetypes`: 8
- `curriculum_failure_modes`: 14
- `curriculum_gates`: 57
- `curriculum_coach_language`: 120
- `curriculum_drills`: 152 (full)
- `curriculum_drill_tags`: 614
- `curriculum_competition_track`: 15
- `curriculum_fitness_guidance`: 15
- `curriculum_volume_guidance`: 15
- `drill_gate_mappings`: 0 (intentionally empty)

---

## 2026-05-02 — Sprint 189: Curriculum Seed Migration

**Mode:** Migration only. No UI built. No app routes modified. No new tables. No schema changes. No npm installs.

**Migrations created:** `supabase/migrations/053_curriculum_seed.sql`

**TypeScript result:** `npx tsc --noEmit` — 0 errors

### Sprint 189 — Curriculum Seed Migration V1
- Created `scripts/generate-curriculum-seed-sql.py` — Python generator that reads all 7 validated xlsx source files and produces `supabase/migrations/053_curriculum_seed.sql`. Applies all normalization mappings from Sprint 188 validation report. Uses level lookup subqueries (never hardcoded UUIDs). Strips Swinget [PROPOSED:] annotation from gate notes. Parses JSONB coaching_cues from pipe-delimited source strings. Covers all 10 curriculum foundation tables.
- Created `supabase/migrations/053_curriculum_seed.sql` — Seeds all curriculum foundation tables. 10,468 lines, 528 KB. All inserts use ON CONFLICT DO NOTHING for idempotency.

**Row counts per table:**
- `curriculum_levels`: 15 display-name UPDATE statements
- `curriculum_archetypes`: 8 rows (A1–A8)
- `curriculum_failure_modes`: 14 rows (FM-01–FM-14)
- `curriculum_gates`: 57 rows (full)
- `curriculum_coach_language`: 120 rows (full — 15 stages × 8 domains)
- `curriculum_drills`: 152 rows (full)
- `curriculum_drill_tags`: 614 rows
- `curriculum_competition_track`: 15 rows (full)
- `curriculum_fitness_guidance`: 15 rows (full)
- `curriculum_volume_guidance`: 15 rows (full)
- `drill_gate_mappings`: 0 rows (intentionally deferred — strategy not confirmed)

**Product-tool grep result:** CLEAN in all data fields. Two SQL comment-only references (header and strip-note), one confirmed false positive (`'First-volley closing the angle.'` — tennis coaching term, not The Angle™ product).

---

## 2026-05-02 — Sprint 188: Curriculum Spreadsheet Validation + Normalized Seed Preview

**Mode:** Validation and preview only. No migrations created. No data inserted. No UI built. No app routes modified. No npm installs.

**Migrations created:** None. Validation precedes migration 053.

**TypeScript result:** `npx tsc --noEmit` — 0 errors

### Sprint 188 — Curriculum Spreadsheet Validation + Normalized Seed Preview V1
- Created `scripts/validate-curriculum-seed-sources.mjs` — Validation script using openpyxl (Python) for xlsx parsing. Validates 7 source files (57 sheets), 86 constraint checks: file existence, sheet presence, required columns, row counts, unique IDs, domain values, stage values, archetype tags, failure mode IDs, product-tool leakage. Outputs normalized preview JSON files and a markdown validation report.
- Created `docs/curriculum/seed-validation-report.md` — Full validation report. 86 checks passed, 0 failed, 6 warnings. All 8 tables confirmed ready for migration 053. Normalization mappings documented. Product-tool leakage clean in all core fields.
- Created `docs/curriculum/seed-preview/curriculum-gates-preview.json` — 57 gate rows with domain_raw and domain_normalized fields.
- Created `docs/curriculum/seed-preview/curriculum-drills-preview.json` — First 20 of 152 drill rows (normalized).
- Created `docs/curriculum/seed-preview/curriculum-coach-language-preview.json` — All 120 coach language entries.
- Created `docs/curriculum/seed-preview/curriculum-archetypes-preview.json` — All 8 archetype rows.
- Created `docs/curriculum/seed-preview/curriculum-failure-modes-preview.json` — All 14 failure mode rows.

**Normalization mappings required at seed time:**
- Gates domain: "Movement / Athletic" → "Movement", "Mentality / Learning Behavior" → "Mentality", "Tactical (Court Mapping)" → "Tactical"
- Gates evaluator: "Coach + Director" → "Director" (19 gates)
- Gates To: "Out (Living-as-a-Pro)" → NULL (to_level_id IS NULL, HP3 exit gate)
- Fitness phase: descriptive names → migration enum values

**Product-tool leakage result:** CLEAN in all core data fields. One informational [PROPOSED:] note in Gates Notes column (RED1__RED2__02) flagged as non-blocking warning. One false positive ("closing the angle" = tennis term) documented and excluded.

---

## 2026-05-02 — Sprints 176–185: AI Suggestion Review Engine + Director Approval Cards V1

**Mode:** AI suggestion infrastructure — deterministic generation, director review page, lifecycle actions, dashboard card. No npm installs. No external AI API. No parent/player publishing. No level mutations. No auto-applying suggestions.

**Migrations created:** `supabase/migrations/051_academy_suggestions.sql`

**TypeScript result:** `npx tsc --noEmit` — 0 errors

### Sprint 176 — AI Suggestion System Architecture Audit V1
- Created `docs/AI_SUGGESTION_REVIEW_ENGINE_ARCHITECTURE.md` — Full audit of existing review queues, adaptive suggestions, data sources. Includes recommended `academy_suggestions` table schema, suggestion types, impact preview model, accept/deny/defer lifecycle, V1 safe behaviors, audit plan, and implementation plan.

### Sprint 177 — AI Suggestions Data Model V1
- Created `supabase/migrations/051_academy_suggestions.sql` — `academy_suggestions` table with all lifecycle fields (status, priority, confidence, evidence JSONB, impact_preview JSONB, proposed_changes JSONB, will_not_change JSONB, review tracking). RLS policies for director/head_coach roles only. 3 performance indexes.
- Created `docs/ACADEMY_SUGGESTIONS_DATA_MODEL.md` — Schema documentation.

### Sprint 178 — Suggestion Generation Helpers V1
- Created `src/lib/suggestions/suggestionTypes.ts` — Type definitions: `AcademySuggestionType`, `AcademySuggestionPriority`, `AcademySuggestionConfidence`, `AcademySuggestionStatus`, `AcademySuggestionDraft`, `AcademySuggestionRow`, display label maps and CSS class maps.
- Created `src/lib/suggestions/generateAcademySuggestions.ts` — Deterministic suggestion generators (pure functions, no DB calls, no AI API): `buildPlayerFocusMissingSuggestions`, `buildPrivateLessonPendingSuggestions`, `buildParentSafeSummaryOpportunitySuggestions`, `buildLevelReadinessReviewSuggestions`, `buildReassessmentFollowupSuggestions`, `buildAcademySuggestionDrafts`.

### Sprint 179 — Suggestion Server Actions V1
- Created `src/app/director/ai-suggestions/suggestionActions.ts` — Server actions: `generateAcademySuggestionsAction` (fetch + dedup + insert), `acceptSuggestionAction`, `denySuggestionAction`, `deferSuggestionAction`, `markSuggestionAppliedAction`. All academy-scoped and role-checked. No auto-mutation on accept.

### Sprint 180 — Director AI Suggestions Dashboard Card V1
- Modified `src/app/director/page.tsx` — Added AI Suggestions card alongside Academy Alerts panel (2-column layout). Queries `academy_suggestions` for pending count and high-priority count. Updated Academy Intelligence quick action to link to `/director/ai-suggestions`.
- Modified `src/components/nav/SidebarNav.tsx` — Added "AI Suggestions" nav item under Intelligence section with Sparkles icon.

### Sprint 181 — AI Suggestions Review Page V1
- Created `src/app/director/ai-suggestions/page.tsx` — Full review page: eyebrow/title/subtitle header, "Generate Suggestions" form button, summary stat cards (Pending/High Priority/Accepted/Deferred), filter tabs by status, guardrail note ("nothing changes automatically"), SuggestionCard list with bound server actions. Empty state per status. `SummaryStatCard` local component.

### Sprint 182 — Suggestion Card Component + Impact Preview V1
- Created `src/components/suggestions/SuggestionCard.tsx` — Client component with expand/collapse, Accept/Deny/Defer actions, inline note textarea for deny/defer, `useTransition` for async state, action result messages. Positive development language throughout.
- Created `src/components/suggestions/ImpactPreviewPanel.tsx` — Presentational component showing Evidence, "If accepted" (lime panel), "Will not change" (surface-raised panel), "Recommended next step". Exports `parseSuggestionImpactPreview` helper.

### Sprint 183 — Safe Accept/Deny/Defer Workflow V1
- Implemented in `suggestionActions.ts` — Accept only marks status + returns nextStep from impact_preview. Deny/Defer store optional review_note. All actions verify academy ownership via membership check. `revalidatePath` keeps counts fresh.

### Sprint 184 — Suggestion Audit + Duplicate Prevention V1
- Duplicate prevention enforced in `generateAcademySuggestionsAction` via composite key `suggestion_type:entity_type:entity_id` checked against in-memory Set.
- `reviewed_by`, `reviewed_at`, `review_note` populated on all review actions.
- Created `docs/AI_SUGGESTION_LIFECYCLE_AND_AUDIT.md` — Lifecycle states, duplicate prevention design, accepted vs applied distinction, V1 safety rules per type, future audit_logs integration plan, RLS enforcement summary.

### Sprint 185 — AI Suggestions QA + Brian Demo Script V1
- Created `docs/AI_SUGGESTIONS_QA.md` — 21-item QA checklist covering UI rendering, generation, dedup, card interactions, accept/deny/defer, safety guardrails, TypeScript.
- Created `docs/AI_SUGGESTIONS_BRIAN_DEMO_SCRIPT.md` — 10-step demo script: dashboard card → review page → generate → expand card → evidence → impact preview → accept → deny → defer → filter tabs.
- Updated `docs/CHANGELOG.md` — this entry.

---

## 2026-05-02 — Sprints 166–175: Player + Parent Development Profile Experience V1

**Mode:** UI/UX build — development profile components, parent/player safe previews, dashboard drilldown language. No npm installs. No AI API calls. No migrations. No parent/player publishing. No level mutations.

**Migrations created:** None

**TypeScript result:** `npx tsc --noEmit` — 0 errors

### Sprint 166 — Player Profile Experience Audit V1
- Created `docs/PLAYER_PARENT_DEVELOPMENT_PROFILE_EXPERIENCE_AUDIT.md` — Full audit of current player profile data sources, visibility gaps, and component opportunities. Maps `current_strengths` → Doing Well, `things_to_work_on` → Working On, `development_focus` → Current Focus.

### Sprint 167 — Player Development Summary Card V1
- Created `src/components/player/DevelopmentProfileSummaryCard.tsx` — Internal coach-facing development summary card. Adapts `player_development_summary` + `player_priorities` into Doing Well / Working On / Current Focus / Next Step sections. Shows "Internal coach view" badge.

### Sprint 168 — Doing Well / Working On / Current Focus Sections V1
- Created `src/components/player/DevelopmentFocusSections.tsx` — Four-section presentational component (Doing Well, Working On, Current Focus, Next Step) with positive development language and color-coded icons.
- Modified `src/components/player/DevelopmentSummarySection.tsx` — Updated labels: "Current Strengths" → "Doing Well", "Things to Work On" → "Working On", "Development Focus" → "Current Focus", "Coach Summary" → "Coach Insight", "Student-Facing Preview" → "Player Preview".

### Sprint 169 — Progress Evidence + Recent Notes Timeline V1
- Created `src/components/player/ProgressEvidenceTimeline.tsx` — Timeline of coach observations with Internal/Coach note visibility pills. Truncates content at 180 chars. Shows observation type, coach name, session context.

### Sprint 170 — Coach-Facing Player Snapshot V1
- Created `src/components/player/CoachPlayerSnapshot.tsx` — Pre-session coach view: Current Focus, Doing Well, Working On, Next Priority, Recent Note with date. Answers "what to focus on with this player today."

### Sprint 171 — Parent-Safe Player Progress Preview V1
- Created `src/components/player/ParentSafeProgressPreview.tsx` — Parent portal card with "Preview only" Lock badge. Empty state: "Progress summaries will appear here after coach/director review." Never exposes raw coach notes.
- Modified `src/app/parent/page.tsx` — Replaced generic "Child's Progress" card with `ParentSafeProgressPreview`.

### Sprint 172 — Player Mission View Preview V1
- Created `src/components/player/PlayerMissionPreview.tsx` — Player portal mission card. Your Strength / Your Mission / Next Win sections. Empty state: "Your next mission will appear after your coach reviews your progress."
- Modified `src/app/player/page.tsx` — Replaced generic "Today's Mission" card with `PlayerMissionPreview`.

### Sprint 173 — Level-Up Requirements / Next Level Progress V1
- Created `src/components/player/LevelProgressCard.tsx` — Sidebar card showing current level, next target level, advancement status (CheckCircle2 / Clock), and director approval requirement.

### Sprint 174 — Dashboard Drilldown Integration V1
- Modified `src/app/director/players/[playerId]/page.tsx` — Added `DevelopmentProfileSummaryCard` to Overview tab left column; added `LevelProgressCard` to Overview sidebar; added `CoachPlayerSnapshot` at top of Notes tab; added `ProgressEvidenceTimeline` in Notes tab. Moved `rawDb`, `developmentSummary`, `activePriorities`, `progressionRequirements`, and `nextCurriculumLevel` queries before `overviewSlot`.
- Modified `src/app/director/players/active/page.tsx` — Updated "Working on:" label to "Current Focus" to match development profile language.
- Modified `src/app/director/improvement/page.tsx` — Added "Working On" label above focus area text in player rows.

### Sprint 175 — Player/Parent Development Experience QA + Demo Script V1
- Created `docs/PLAYER_PARENT_DEVELOPMENT_PROFILE_EXPERIENCE_QA.md` — 15-item QA checklist covering all components, safety guardrails, and TypeScript.
- Created `docs/PLAYER_PARENT_DEVELOPMENT_PROFILE_DEMO_SCRIPT.md` — 10-step demo sequence from Director Dashboard through parent/player previews with guardrail explanation.
- Updated `docs/CHANGELOG.md` — This entry.

---

## 2026-05-02 — Sprints 156–165: Fitness OS Template Builder + Class Template Separation V1 (Completion Pass)

**Mode:** Fitness OS product completion — utility functions, server action, and docs. No npm installs. No AI API calls. No migrations.

**Migrations created:** None

### Sprint 156 — Fitness/Class Template Separation Audit V1
- Updated `docs/FITNESS_TEMPLATE_SEPARATION_AUDIT.md` — Revised sprint reference from 136 to 156. Updated implementation plan table to map 136-145 → 156-165 with completion status.

### Sprint 157 — Class Templates Route + Navigation Separation V1
- No changes needed. `src/app/director/class-templates/page.tsx` and sidebar separation confirmed complete from Sprint 137.

### Sprint 158 — Fitness Block Taxonomy V1
- Modified `src/lib/fitness/fitnessBlockTypes.ts` — Added `isFitnessBlockType(value)` type guard export.

### Sprint 159 — Fitness Exercise Matching Engine V1
- Modified `src/lib/fitness/fitnessExerciseMatching.ts` — Added `normalizeFitnessExerciseCategory(value)` export for normalizing legacy category strings to DB enum values.
- Created `docs/FITNESS_EXERCISE_MATCHING_ENGINE.md` — Documents scoring algorithm, block→keyword mappings, fallback exercise policy, all exported functions, category normalization table, and guardrails.

### Sprint 160 — Fitness Template Data Model + Actions V1
- Modified `src/app/director/fitness/fitnessTemplateActions.ts` — Added `updateFitnessExercisePrescriptionAction` to update `duration_min` and `notes` on a template_block_exercise row without touching the global exercise library.

### Sprint 161 — Fitness Template List Page V1
- No changes needed. Page confirmed complete from Sprint 141.

### Sprint 162 — Fitness Template Detail / Block Builder V1
- No changes needed. FitnessTemplateBuilderClient, FitnessBlockCard, ExerciseRow, observation panel confirmed complete from Sprint 142.

### Sprint 163 — Fitness Exercise Switcher V1
- No changes needed. FitnessExerciseSwitcher confirmed complete from Sprint 143.

### Sprint 164 — Fitness Voice/Text Observation Drafts V1
- No changes needed. VoiceTextInput observation panel confirmed complete from Sprint 144.

### Sprint 165 — Fitness OS QA + Brian Demo Script V1
- Updated `docs/FITNESS_OS_TEMPLATE_BUILDER_QA.md` — Updated sprint reference to 165. Added QA items 17 (isFitnessBlockType validation) and 18 (normalizeFitnessExerciseCategory).
- Updated `docs/FITNESS_OS_DEMO_SCRIPT.md` — Updated sprint reference to 165.
- Modified `docs/CHANGELOG.md` — This entry.
- TypeScript: ✓ clean (exit 0)

---

## 2026-05-01 — Sprints 146–155: Director Dashboard Command Cards + Drilldowns + Private Lesson Requests V1

**Mode:** Director dashboard command layer. No npm installs. No AI API calls. No communications sent.

**Migrations created:** `supabase/migrations/050_private_lesson_requests.sql`

### Sprint 146 — Architecture Audit V1
- Created `docs/DIRECTOR_DASHBOARD_COMMAND_CARDS_ARCHITECTURE.md` — Full audit: current dashboard state, available data, command card plan, drilldown plans, private lesson request plan, alerts plan, schema gaps, implementation order.

### Sprint 147 — Dashboard Top Command Cards V1
- Modified `src/app/director/page.tsx` — Full rewrite. 5 CommandCards (Active Players/Academy Improvement/Sessions/Private Lessons/Academy Alerts), Academy Alerts middle panel, 4 QuickAction bottom tiles. rawDb pattern for private_lesson_requests.

### Sprint 148 — Active Players Drilldown V1
- Created `src/app/director/players/active/page.tsx` — Active players list with summary cards (total, with focus, missing summary, needs review), player table with focus areas and score delta, links to player profiles.

### Sprint 149 — Academy Improvement Drilldown V1
- Created `src/app/director/improvement/page.tsx` — Improvement metrics using v_player_summary.score_delta. Summary cards, player table with trend chips, UTR note, links to player profiles.

### Sprint 150 — Sessions Drilldown V1
- Created `src/app/director/sessions/overview/page.tsx` — Current week sessions with summary cards (sessions, participants, completed, missing recap), session list with coach/group/status/recap status.

### Sprint 151 — Private Lesson Requests Schema V1
- Created `supabase/migrations/050_private_lesson_requests.sql` — private_lesson_requests table with RLS (directors/head coaches only). Status: new/reviewing/assigned/scheduled/declined/completed.
- Created `docs/PRIVATE_LESSON_REQUESTS_ARCHITECTURE.md` — Schema docs, guardrails, status values, deferred parent write access.

### Sprint 152 — Private Lesson Requests Director Queue V1
- Created `src/app/director/private-lessons/page.tsx` — Director queue with summary cards, expandable request cards.
- Created `src/app/director/private-lessons/PrivateLessonRequestCard.tsx` — Client component: expand/collapse, status update, director notes.
- Created `src/app/director/private-lessons/privateLessonActions.ts` — Server actions: updatePrivateLessonStatusAction, updateDirectorNotesAction.

### Sprint 153 — Parent Portal Private Lesson Preview V1
- Modified `src/app/parent/page.tsx` — Added "Request a Private Lesson" preview card. Form fields shown but disabled. Submit button disabled. No live submission wired.

### Sprint 154 — Academy Alerts Command Center V1
- Created `src/app/director/alerts/page.tsx` — Deterministic alert aggregation (no AI). 6 alert types. Category filters. Severity-coded cards with why/action/link. Summary row.

### Sprint 155 — Positive Development Language + Dashboard QA V1
- Created `docs/DIRECTOR_DASHBOARD_COMMAND_CARDS_QA.md` — 13 QA tests covering all sprint deliverables.
- Created `docs/POSITIVE_DEVELOPMENT_LANGUAGE_GUIDE.md` — Approved language terms, parent/player examples, implementation checklist.
- TypeScript: clean (0 errors).

---

## 2026-05-01 — Sprints 136–145: Fitness OS Template Builder + Class Template Separation V1

**Mode:** Fitness OS product build — UI + server actions + library utilities. No migrations.

**Migrations created:** None

### Sprint 136 — Fitness/Class Template Separation Audit V1
- Created `docs/FITNESS_TEMPLATE_SEPARATION_AUDIT.md` — Full audit of template mixing problem, data risks, table strategy, and implementation plan for Sprints 137–145.

### Sprint 137 — Route + Navigation Separation V1
- Created `src/app/director/class-templates/page.tsx` — Read-only class templates page filtering out fitness_template:true-tagged templates.
- Modified `src/components/nav/SidebarNav.tsx` — Added "Class Templates" nav item (LayoutTemplate icon) and renamed "Fitness" → "Fitness OS".

### Sprint 138 — Fitness Block Taxonomy V1
- Created `src/lib/fitness/fitnessBlockTypes.ts` — Exports FITNESS_BLOCK_TYPES, FitnessBlockType, getFitnessBlockLabel, getFitnessBlockAccent, getFitnessBlockBorderAccent, getDbBlockType, inferFitnessBlockType, getDefaultBlockDuration, getFitnessBlockIntent, defaultFitnessTemplateBlockOrder.
- Created `docs/FITNESS_BLOCK_TAXONOMY.md` — Documents 8 fitness block types, DB mapping strategy, template type tags, and distinction from curriculum blocks.

### Sprint 139 — Fitness Exercise Pool + Default Exercise Matching V1
- Created `src/lib/fitness/fitnessExerciseMatching.ts` — Exports getDefaultExercisesForFitnessBlock, matchExerciseToFitnessBlock, getFallbackFitnessExercises, getExercisesForFitnessBlock. Deterministic keyword + category scoring, 3-exercise default, fallback placeholders never inserted into DB.

### Sprint 140 — Fitness Template Builder Data Actions V1
- Created `src/app/director/fitness/fitnessTemplateActions.ts` — Server actions: createFitnessTemplateAction, addFitnessBlockAction (auto-populates exercises), removeFitnessBlockAction, reorderFitnessBlocksAction, addExerciseToFitnessBlockAction, removeExerciseFromFitnessBlockAction, swapExerciseInFitnessBlockAction, updateFitnessBlockNotesAction. All role-checked (director/head_coach), academy-scoped, fitness-template-verified.

### Sprint 141 — Fitness Template Builder UI V1
- Modified `src/app/director/fitness/templates/page.tsx` — Full rewrite. Fitness OS command page. Filters to fitness_template:true only. Stat cards, type labels, New Fitness Template CTA, premium card list.
- Created `src/app/director/fitness/templates/new/page.tsx` — New template creation page.
- Created `src/app/director/fitness/templates/new/NewFitnessTemplateForm.tsx` — Client form: name, template type picker, description, duration. Redirects to builder on success.

### Sprint 142 — Fitness Template Detail / Block Builder V1
- Modified `src/app/director/fitness/templates/[templateId]/page.tsx` — Full rewrite. Fitness block builder for fitness templates. Non-fitness templates show a class template notice. Passes blocks and exercise library to client.
- Created `src/app/director/fitness/templates/[templateId]/fitnessBuilderTypes.ts` — Shared TypeScript interfaces: FitnessBlock, FitnessExercise, ExerciseLibraryItem.
- Created `src/app/director/fitness/templates/[templateId]/FitnessTemplateBuilderClient.tsx` — Client component: add/remove/reorder blocks, remove exercises, open switcher, observation panel with VoiceTextInput.

### Sprint 143 — Fitness Exercise Switcher V1
- Created `src/app/director/fitness/templates/[templateId]/FitnessExerciseSwitcher.tsx` — Modal: shows matching exercises first (labeled "Match"), search filter, select replacement, confirm swap. Does not touch exercise library.

### Sprint 144 — Fitness Voice Observation Drafts V1
- Observations stored in `template_blocks.notes` via `updateFitnessBlockNotesAction` (in Sprint 140 actions file).
- Observation UI in FitnessTemplateBuilderClient: MessageSquare button per block, VoiceTextInput panel, save/cancel. Internal only — no player mutation, no communications.

### Sprint 145 — Fitness OS QA + Demo Script V1
- Created `docs/FITNESS_OS_TEMPLATE_BUILDER_QA.md` — 16-item QA test list covering separation, creation, block management, exercise swaps, library safety, observations, and TypeScript.
- Created `docs/FITNESS_OS_DEMO_SCRIPT.md` — 10-step demo walkthrough from template creation through voice observations.
- Modified `docs/CHANGELOG.md` — This entry.
- TypeScript: ✓ clean (exit 0)

---

## 2026-05-01 — Sprints 126–135: Premium UI System Alignment + Manus Aesthetic Match V1

**Mode:** UI/aesthetic alignment sprint — no backend changes, no migrations.

**Migrations created:** None

### Sprint 126 — UI Audit + Design System Plan V1
- Created `docs/PREMIUM_UI_SYSTEM_AUDIT.md` — Full audit of current styling architecture, component inventory, routes requiring polish, safest update paths, design token targets.

### Sprint 127 — Global Theme Tokens + Base Surface V1
- Modified `tailwind.config.ts` — Changed primary accent `lime` token from lime green (#C8FF00) to cyan (#11d9df). Deepened background tokens to near-black Manus aesthetic. Added `status.purple` (#b56cff), `shadow.cyan`, updated all surface/border/text colors.
- Modified `src/app/globals.css` — Added comprehensive CSS variables (--bg-app, --accent-cyan, --border-subtle, etc.). Added new utility classes: `.page-eyebrow`, `.page-title`, `.page-subtitle`, `.label-xs-cyan`, `.pill-*`, `.input-base`, `.table-card`, updated `.btn-lime` (dark text, glow), `.btn-ghost`, `.btn-danger`.
- Modified `src/app/layout.tsx` — Updated themeColor to new base color.
- Created `docs/PREMIUM_UI_STYLE_GUIDE.md` — Full style guide with colors, typography, spacing, card/button/table/form/sidebar/top-bar rules.

### Sprint 128 — Shared Shell, Sidebar, and Top Bar V1
- Modified `src/components/nav/SidebarNav.tsx` — Section labels (FOUNDATION / INTELLIGENCE / SYSTEM), active nav with left accent + cyan pill, bottom user card with circular avatar, name/email, sign-out icon. Accepts `userDisplayName` and `userEmail` props.
- Modified `src/app/director/layout.tsx` — Passes `userDisplayName` and `userEmail` to SidebarNav.

### Sprint 129 — Shared UI Components Polish V1
- Modified `src/components/ui/Card.tsx` — hover uses `shadow-cyan`, CardFooter uses CSS variable border.
- Modified `src/components/ui/MetricCard.tsx` — updated variant borders, optional icon slot.
- Modified `src/components/ui/StatusBadge.tsx` — updated border opacities.
- Modified `src/components/ui/Table.tsx` — CSS variable-based dividers.
- Modified `src/components/ui/Tabs.tsx` — active state cyan, inactive hover subtle border.
- Modified `src/components/ui/Avatar.tsx` — cyan initials on dark bg.
- Modified `src/components/ui/SearchFilterBar.tsx` — premium focus ring, FilterChip updated.
- Modified `src/components/ui/EmptyState.tsx` — icon container uses cyan soft bg.
- Modified `src/components/nav/BottomTabBar.tsx` — icon glow on active, sidebar bg.

### Sprint 130 — Director Dashboard + Demo Tour Polish V1
- Modified `src/app/director/page.tsx` — Premium header with `page-eyebrow`, CTA button, Curriculum + Sessions promoted to Live modules.
- Modified `src/app/director/demo/page.tsx` — Premium eyebrow header.

### Sprint 131 — Players + Player Profile Polish V1
- Modified `src/app/director/players/page.tsx` — Premium header with eyebrow.
- Modified `src/app/director/players/_components/PlayersDirectoryClient.tsx` — `table-card` wrapper with CSS variable dividers.
- Modified `src/app/director/players/import/page.tsx` — Premium eyebrow header.
- Modified `src/app/director/players/development-intake/page.tsx` — Premium eyebrow header.
- Modified `src/app/director/players/onboarding-review/page.tsx` — Premium eyebrow header (both states).

### Sprint 132 — Curriculum + Templates + Exercise Library Polish V1
- Modified `src/app/director/curriculum/page.tsx` — Premium eyebrow header.
- Modified `src/app/director/curriculum/academy-version/page.tsx` — Premium eyebrow header.
- Modified `src/app/director/fitness/templates/page.tsx` — Premium eyebrow header, p-6 padding.
- Modified `src/app/director/fitness/templates/[templateId]/page.tsx` — Premium eyebrow header, p-6 padding.

### Sprint 133 — Sessions + Coach Workflow Polish V1
- Modified `src/app/director/sessions/page.tsx` — Premium eyebrow header, p-6 padding.
- Modified `src/app/director/sessions/[sessionId]/page.tsx` — Premium eyebrow header.
- Modified `src/app/coach/page.tsx` — Premium eyebrow header.
- Modified `src/app/coach/players/page.tsx` — Premium eyebrow header.
- Modified `src/app/coach/sessions/page.tsx` — Premium eyebrow header.
- Modified `src/app/coach/sessions/[sessionId]/page.tsx` — Premium eyebrow header.
- Modified `src/app/coach/voice/page.tsx` — Premium eyebrow header.
- Modified `src/components/voice/VoiceTextInput.tsx` — Premium textarea with rounded-xl, focus ring.

### Sprint 134 — Intelligence, Reporting, Parent Comms, Settings Polish V1
- Modified `src/app/director/review/page.tsx` — Premium eyebrow header, updated badge opacities.
- Modified `src/app/parent/page.tsx` — Premium eyebrow header.
- Modified `src/app/player/page.tsx` — Premium eyebrow header.

### Sprint 135 — Whole-App UI QA + Consistency Pass V1
- Created `docs/PREMIUM_UI_QA.md` — Routes checked, visual updates completed, known remaining polish items, mobile/responsive notes, accessibility notes.
- TypeScript: **Clean** — zero errors.

---

## 2026-05-01 — Sprints 121–125: Voice Input Demo Layer V1

**Mode:** Safe browser-native voice-to-text input layer. No autonomous voice execution. No external AI APIs. All voice input feeds existing human-review workflows. Microphone → transcript → editable text box → manual submit → existing draft pipeline.

**Migrations created:** None (voice_notes table already exists)

---

### Sprint 121 — Voice Input Architecture + Guardrails V1

**Files created:**
- `docs/VOICE_INPUT_DEMO_LAYER_ARCHITECTURE.md` — Purpose, safe voice model, supported workflows, browser Web Speech API approach, fallback typing, guardrails, privacy notes, no external AI policy, sprint path, known browser limitations.

**TypeScript:** Not applicable (docs only).

---

### Sprint 122 — Reusable VoiceTextInput Component V1

**Files created:**
- `src/components/voice/VoiceTextInput.tsx` — Reusable voice-to-text textarea component with start/stop listening, transcript append, editable text, clear button, graceful microphone error handling, browser support detection, and calm fallback for unsupported browsers.
- `docs/VOICE_TEXT_INPUT_COMPONENT.md` — Component props, behavior, implementation notes, usage example, guardrails.

**TypeScript:** Clean.

---

### Sprint 123 — Voice Curriculum Command Demo Integration V1

**Files modified:**
- `src/app/director/curriculum/VoiceOverrideInputPanel.tsx` — Replaced raw textarea with `VoiceTextInput`. Manual submit flow unchanged. Added "Speak or type. The OS creates a draft for review — nothing changes automatically." copy. No auto-submit. No AI API.

**TypeScript:** Clean.

---

### Sprint 124 — Voice Coach Recap Demo Integration V1

**Files created:**
- `src/app/director/sessions/[sessionId]/saveSessionVoiceNoteAction.ts` — Server action to save a session-level voice_note (author_id, session_id, null player_id, raw_input, status: pending). Auth, academy_id scoping, and coach role verification enforced.
- `src/app/director/sessions/[sessionId]/VoiceCoachRecapInput.tsx` — Voice-enabled coach recap input. VoiceTextInput + Save Recap button + success message. No auto-submit. No player mutations.

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Added VoiceCoachRecapInput to the COACH RECAP section (above recap history). Added conditional display for recaps list.

**TypeScript:** Clean.

---

### Sprint 125 — Voice Demo QA + Brian Script V1

**Files created:**
- `docs/VOICE_INPUT_DEMO_QA.md` — 14-item manual QA checklist covering voice support, no-voice fallback, microphone denial, transcript editing, no auto-submit, draft-only submission, no external API, no parent/player visibility, no communication, no curriculum/template/player mutation.
- `docs/BRIAN_VOICE_DEMO_SCRIPT.md` — Full demo script: sandbox setup, curriculum voice prompt, coach recap voice prompt, key talking points, what NOT to say.

**Files modified:**
- `docs/BRIAN_INTERACTIVE_DEMO_SCRIPT.md` — Added "Voice Demo Add-On" section at the end with Step A (curriculum voice) and Step B (recap voice) and core guardrail talking point.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** Clean.

---

## 2026-05-01 — Sprints 111–120: Real Demo Sandbox + Brian Interactive Tour V1

**Mode:** Real demo sandbox seeded into director's academy with `[DEMO]` prefix tagging. Interactive tour page with status, player roster, curriculum preview, session preview, adaptive suggestions preview. Full reset/delete flow with cascade safety. No migration. No parent/player visibility. No communications.

**Migrations created:** None (naming convention isolation; existing schema sufficient)

---

### Sprint 111 — Demo Sandbox Architecture + Guardrails V1

**Files created:**
- `docs/DEMO_SANDBOX_ARCHITECTURE.md` — Purpose, isolation strategy, cascade delete map, forbidden records, how demo connects to real workflows, recommended sprint path.

**TypeScript:** Not applicable (docs only).

---

### Sprint 112 — Demo Data Tagging + Reset Strategy V1

**Files created:**
- `docs/DEMO_SANDBOX_RESET_STRATEGY.md` — Naming convention tagging strategy, step-by-step delete order, safety guarantees, confirmation requirements, audit trail.

**TypeScript:** Not applicable (docs only).

---

### Sprint 113 — Demo Seed Pack V1

**Files created:**
- `src/app/director/demo/demoSandboxActions.ts` — `createOrResetDemoSandboxAction()`: seeds 6 demo players with dev profiles + priorities + group memberships + curriculum states + demo group + demo template (5 blocks) + demo session (5 blocks) + demo curriculum version + override. `resetDemoSandboxAction()`: cascade-safe delete in correct FK order. `getDemoSandboxStatusAction()`: query current sandbox state for page. All actions scoped to `[DEMO]` prefix.

**TypeScript:** Clean.

---

### Sprint 114 — Demo Reset / Delete Flow V1

**Files created:**
- `src/app/director/demo/DemoSandboxControls.tsx` — Client component with create/reset/delete buttons, confirmation checkbox, result/warning display, page reload on completion.

**TypeScript:** Clean.

---

### Sprint 115 — Brian Demo Tour Landing Page V1

**Files created:**
- `src/app/director/demo/page.tsx` — Server component; loads sandbox status; renders all demo tour sections (status, what this shows, demo flow steps, quick links).

**TypeScript:** Clean.

---

### Sprint 116 — Demo Player + Development Profile Walkthrough V1

**Files modified:**
- `src/app/director/demo/page.tsx` — Added "Sample Player Data" section with per-player cards showing strengths, needs, and priority. Links to player import, development intake, onboarding review.

---

### Sprint 117 — Demo Curriculum + Voice Customization Walkthrough V1

**Files modified:**
- `src/app/director/demo/page.tsx` — Added "Curriculum Customization Preview" section with sample director prompt, 3-step explanation, deep links to curriculum and review queue.

---

### Sprint 118 — Demo Session + Coach Intelligence Walkthrough V1

**Files modified:**
- `src/app/director/demo/page.tsx` — Added "Coach Session Preview" section with demo session status, checklist of what session page shows, link to open demo session.

---

### Sprint 119 — Demo Adaptive Suggestions Interactive Preview V1

**Files modified:**
- `src/app/director/demo/page.tsx` — Added "Adaptive Suggestions Preview" section with 3 example suggestion cards, guardrail explanation, link to demo session for real generation.

---

### Sprint 120 — Brian Interactive Demo QA + Script V1

**Files created:**
- `docs/DEMO_SANDBOX_QA.md` — 16 QA test cases covering creation, players, group, dev profiles, curriculum, template, session, suggestions, apply flow, reset, real data safety, parent/player isolation, communications.
- `docs/BRIAN_INTERACTIVE_DEMO_SCRIPT.md` — 14-step interactive demo script with exact actions, speaking points, and key properties to reinforce.

**Files modified:**
- `src/components/nav/SidebarNav.tsx` — Added "Demo Tour" link with FlaskConical icon.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** Clean (exit 0).

---

## 2026-05-01 — Sprints 101–110: Player Import + Development Profile Onboarding V1

**Mode:** CSV import with dry-run/commit flow, bulk development profile intake, onboarding review. No AI API calls. No parent/player visibility. No billing. No communications. No new migrations.

**Migrations created:** None (existing schema sufficient)

---

### Sprint 101 — Player Import Schema Audit V1

**Files created:**
- `docs/PLAYER_IMPORT_SCHEMA_AUDIT.md` — Full audit: tables and columns, safe import fields, deferred fields, duplicate detection, group/curriculum assignment approaches, risks, sprint 102–110 path.

**TypeScript:** Not applicable (docs only).

---

### Sprint 102 — Player CSV Template V1

**Files created:**
- `docs/PLAYER_IMPORT_CSV_TEMPLATE.md` — Column reference, 3 example rows, import flow diagram, known limitations, what NOT to include.
- `data/player-import/player_import_template.csv` — Ready-to-copy CSV template with example rows.

**TypeScript:** Not applicable (data/docs only).

---

### Sprint 103 — Player Import Parsing + Dry Run Utility V1

**Files created:**
- `src/lib/player-import/playerImportParser.ts` — `runPlayerImportParsing()`, `parsePlayerImportCsv()`, `normalizePlayerImportRow()`, `validatePlayerImportRows()`. Pure TS, no DB, no AI. In-upload duplicate detection, field validation, normalization.
- `docs/PLAYER_IMPORT_PARSER.md` — Function signatures, validation rules, normalization table, guardrails.

**TypeScript:** Clean.

---

### Sprint 104 — Player Import Dry Run + Commit Server Actions V1

**Files created:**
- `src/app/director/players/import/playerImportActions.ts` — `runPlayerImportDryRunAction()`: auth + academy check, parse, DB lookups for existing players/groups/levels/coaches, returns per-row dry-run results. `commitPlayerImportAction()`: re-validates, creates players, upserts dev summaries, creates priorities, assigns curriculum and groups. Writes audit_logs. Conservative duplicate handling.

**TypeScript:** Clean.

---

### Sprint 105 — Player Import UI V1

**Files created:**
- `src/app/director/players/import/page.tsx` — Route shell with back link and page header.
- `src/app/director/players/import/PlayerImportClient.tsx` — Client component: CSV column guide, textarea + file upload, Run Dry Run button, DryRunReport with expandable rows, CommitSection with confirmation checkbox, ImportResultReport with links to next steps.

**Files modified:**
- `src/app/director/players/page.tsx` — Added "Import Players" button linking to /director/players/import.

**TypeScript:** Clean.

---

### Sprint 106 — Player Import Commit Flow V1

**Files modified:**
- `src/app/director/players/import/playerImportActions.ts` — `commitPlayerImportAction()` added: guarded mutations only after director confirmation; re-runs parse inside server action; creates players, dev summaries, priorities, curriculum states, group memberships; skips on errors; writes audit_logs.

**TypeScript:** Clean.

---

### Sprint 107 — Commit UI + Import Result Report V1

**Files modified:**
- `src/app/director/players/import/PlayerImportClient.tsx` — Added CommitSection with confirmation checkbox and Commit Import button; ImportResultReport with stat pills and links to Players + Development Intake.

**TypeScript:** Clean.

---

### Sprint 108 — Bulk Strengths / Needs Entry UI V1

**Files created:**
- `src/app/director/players/development-intake/developmentIntakeActions.ts` — `updatePlayerDevelopmentIntakeAction()`: upserts `player_development_summary`, deactivates old priorities and creates new one.
- `src/app/director/players/development-intake/DevelopmentIntakeClient.tsx` — Client panel with per-player expandable intake cards (3 strengths, 3 needs, priority, notes), filter by missing data, Save per player.
- `src/app/director/players/development-intake/page.tsx` — Server component: loads active players + dev summaries + priorities, passes to client.

**TypeScript:** Clean.

---

### Sprint 109 — Curriculum + Group Assignment Review V1

**Files created:**
- `src/app/director/players/onboarding-review/page.tsx` — Server component: loads players, checks curriculum states, group memberships, dev summaries, priorities; shows readiness bar, gap checklist with fix links, per-player readiness list with icon indicators.

**TypeScript:** Clean.

---

### Sprint 110 — Academy Player Onboarding QA + Brian Data Prep Demo V1

**Files created:**
- `docs/PLAYER_IMPORT_ONBOARDING_QA.md` — 13 test cases covering empty CSV, missing fields, duplicates, existing players, unknown groups/levels, dev profile import, commit flow, parent/player isolation, communications, coach intelligence improvements.
- `docs/BRIAN_PLAYER_DATA_PREP_DEMO.md` — 10-step demo script: Brian gives names → import → dry run → commit → development intake → onboarding review → session with real adaptive suggestions.

**TypeScript:** Clean.

---

## 2026-05-01 — Sprints 91–100: Adaptive Session Planning Suggestions V1

**Mode:** Backend rule engine + server actions + review UI. No AI API calls. No parent/player visibility. No player level changes. No package installs. Migration: 049.

**Migrations created:** `049_session_adjustment_suggestions.sql`

---

### Sprint 91 — Session Modification Suggestion Architecture V1

**Files created:**
- `docs/ADAPTIVE_SESSION_PLANNING_ARCHITECTURE.md` — Full architecture: product goal, source inputs, 13 suggestion types, draft lifecycle diagram, review/apply flow, guardrails, future AI-ready path, recommended schema, sprint 92–100 path.

**TypeScript:** Not applicable (docs only).

---

### Sprint 92 — Group Needs Aggregation Utility V1

**Files created:**
- `src/lib/session-planning/groupNeedsAggregation.ts` — `getGroupNeedsForSession()`: 11 sequential Supabase queries, aggregates player strengths/needs/priorities/curriculum/attendance into `GroupNeedsResult`.
- `docs/GROUP_NEEDS_AGGREGATION.md` — Purpose, function signature, query list, return shape, graceful fallbacks, guardrails.

**TypeScript:** Clean.

---

### Sprint 93 — Template Block Modification Rule Engine V1

**Files created:**
- `src/lib/session-planning/sessionModificationRules.ts` — `generateSessionModificationSuggestions()`: 8 deterministic rules covering recovery, spacing, return readiness, direction, mixed levels, small class, evidence gaps, academy overrides. Returns max 8 `SuggestionDraft[]`.
- `docs/SESSION_MODIFICATION_RULE_ENGINE.md` — Function signature, 8 rules documented, threshold logic, output limits, guardrails.

**TypeScript:** Clean.

---

### Sprint 94 — Session Adjustment Drafts V1

**Files created:**
- `supabase/migrations/049_session_adjustment_suggestions.sql` — New table with academy RLS, indexes. Status lifecycle: `pending_review → approved/rejected/dismissed → applied`.
- `src/app/director/sessions/[sessionId]/createSessionAdjustmentSuggestionsAction.ts` — Server action: auth + academy membership check, loads session blocks and curriculum context, runs group needs aggregation and rule engine, inserts suggestions as `pending_review`, replaces prior draft batch.

**TypeScript:** Clean.

---

### Sprint 95 — Session Adjustment Review Controls V1

**Files created:**
- `src/app/director/sessions/[sessionId]/sessionAdjustmentReviewActions.ts` — `approveSuggestionAction`, `rejectSuggestionAction`, `dismissSuggestionAction` server actions with auth/academy guards.
- `src/app/director/sessions/[sessionId]/SessionAdjustmentSuggestionsPanel.tsx` — Client panel: Generate button, suggestion cards with expand/collapse, approve/reject/dismiss controls, empty states, status pills, warning display.

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Added query 12 (existing suggestions), built `existingSuggestions` with block note context, added `SUGGESTED ADJUSTMENTS` section before Coach Recap.

**TypeScript:** Clean.

---

### Sprint 96 — Apply Approved Session Adjustments V1

**Files created:**
- `src/app/director/sessions/[sessionId]/applyApprovedSessionAdjustmentAction.ts` — Server action: verifies `approved` status, appends `[Adaptive Adjustment]` to `session_blocks.notes` (or `session_notes` if no block), marks suggestion `applied`, writes `audit_logs`. Never touches `template_blocks`.

**Files modified:**
- `src/app/director/sessions/[sessionId]/SessionAdjustmentSuggestionsPanel.tsx` — Added "Apply to Session" button for approved suggestions.

**TypeScript:** Clean.

---

### Sprint 97 — Coach Briefing Shows Suggested Adjustments V1

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Coach Briefing now shows suggestion counts (pending/approved/applied) and top 3 pending suggestion previews.

**TypeScript:** Clean.

---

### Sprint 98 — Session Plan Diff View V1

**Files modified:**
- `src/app/director/sessions/[sessionId]/SessionAdjustmentSuggestionsPanel.tsx` — Expanded suggestion card now shows before/after diff: current block notes vs. proposed adaptive adjustment text.
- `src/app/director/sessions/[sessionId]/page.tsx` — Pass `target_block_current_notes` to suggestion rows for diff display.

**TypeScript:** Clean.

---

### Sprint 99 — Adaptive Session Planning QA V1

**Files created:**
- `docs/ADAPTIVE_SESSION_PLANNING_QA.md` — 10 test cases covering no-roster, missing summaries, recovery needs, return readiness, mixed levels, small class, apply behavior, template protection, player record protection, parent/player isolation. Guardrails matrix.

**TypeScript:** Clean.

---

### Sprint 100 — Brian Adaptive Session Demo V1

**Files created:**
- `docs/BRIAN_ADAPTIVE_SESSION_PLANNING_DEMO.md` — 10-step demo script: template → session → roster → generate suggestions → show cards → approve → apply → confirm session-only change → confirm template unchanged → confirm player records unchanged.

**TypeScript:** Clean.

---

## 2026-05-01 — Sprints 81–90: Premium UI + Coach Class Intelligence V1

**Mode:** UI polish, read-only coach intelligence. No AI API calls. No parent/player visibility. No player level changes. No package installs. No migrations.

**Migrations created:** None

---

### Sprint 81 — Premium UI Audit V1

**Files created:**
- `docs/PREMIUM_UI_AUDIT.md` — Audit of 6 director/coach screens: clutter risks, hierarchy problems, quick wins, reusable patterns, design rules, recommended polish path for Sprints 82–90.

**TypeScript:** Not applicable (docs only).

---

### Sprint 82 — Director Curriculum Page Premium Polish V1

**Files modified:**
- `src/app/director/curriculum/page.tsx` — Academy Version promoted to primary section; How It Works numbered guide; Global Curriculum Foundation moved to bottom grid.

**TypeScript:** Clean.

---

### Sprint 83 — Academy Version Audit Premium Polish V1

**Files modified:**
- `src/app/director/curriculum/academy-version/page.tsx` — AuditStat compact horizontal strip replaces 6-box grid; attention items use calm bordered style; AuditStat helper component added at module level.

**TypeScript:** Clean.

---

### Sprint 84 — Review Queue Premium Organization V1

**Files modified:**
- `src/app/director/review/page.tsx` — Added `p-6` container; per-category summary strip added to PageHeader showing pending/ready counts by category (Session Recaps, Priorities, Evidence, Attendance, Curriculum).

**TypeScript:** Clean.

---

### Sprint 85 — Template Builder Premium Polish V1

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Curriculum Intelligence section moved to top of page; populate from curriculum is now primary action; helpful copy about academy version/overrides added.

**TypeScript:** Clean.

---

### Sprint 86 — Coach Session View Premium Polish V1

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Curriculum Focus moved near top; planned-snapshot notice condensed to one muted line; `p-6` container added.

**TypeScript:** Clean.

---

### Sprint 87 — Class Roster Intelligence Panel V1

**Files created:**
- `src/app/director/sessions/[sessionId]/ClassRosterIntelligencePanel.tsx` — Read-only per-player panel: name, curriculum level, source (academy/global), strengths, focus areas, top priority, attendance status. Graceful fallbacks when data is absent.

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Added player intelligence queries (curriculum states, development summaries, priorities); renders ClassRosterIntelligencePanel after Group Assignment.

**TypeScript:** Clean.

---

### Sprint 88 — Player Strengths / Needs Summary Cards V1

*Integrated into Sprint 87 ClassRosterIntelligencePanel — no additional files.*

**TypeScript:** Clean.

---

### Sprint 89 — Coach Session Briefing V1

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Coach Briefing section added: deterministic synthesis of curriculum focus, class size, watch-for-today items (academy emphasis, players with needs/priorities/missing assignment), capture-after-class suggestions.

**TypeScript:** Clean.

---

### Sprint 90 — Premium Demo Readiness QA V1

**Files created:**
- `docs/PREMIUM_UI_DEMO_READINESS_QA.md` — QA checklist for all 5 screens, known limitations, remaining clutter risks, recommended future sprints.
- `docs/BRIAN_PREMIUM_UI_AND_COACH_INTELLIGENCE_DEMO.md` — Full demo script for Brian actor: 6 steps from curriculum command center through player profile.

**TypeScript:** Clean.

---

## 2026-05-01 — Sprints 71–80: Academy Curriculum Resolution + Operating Loop V1

**Mode:** Backend utility, server action enhancements, read-only UI additions, docs. No AI API calls. No parent/player visibility. No player level changes. No package installs. No migrations.

**Migrations created:** None

---

### Sprint 71 — Academy Curriculum Resolution Engine V1

**Files created:**
- `src/lib/curriculum/academyCurriculumResolution.ts` — Resolution utility: `getActiveAcademyCurriculumVersion`, `resolveAcademyCurriculumContext`, `getAcademyOverridesForContext`, `extractOverrideFocusTags`, `buildOverrideSummaryLines`. Deterministic, read-only, no mutations.
- `docs/ACADEMY_CURRICULUM_RESOLUTION_ENGINE.md` — Architecture doc: resolution rules, function signatures, security notes, V1 limitations.

**TypeScript:** Clean.

---

### Sprint 72 — Player Curriculum Assignment Review V1

**Files created:**
- `src/app/director/players/[playerId]/PlayerCurriculumAssignmentCard.tsx` — Read-only card: shows academy curriculum version source, assigned level, active override count, override summaries, warnings. Links to /director/curriculum.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — Imports `resolveAcademyCurriculumContext` and `PlayerCurriculumAssignmentCard`. Calls resolution utility per page load. Card added to skillPath slot above CurriculumProgressGrid.

**TypeScript:** Clean.

---

### Sprint 73 — Group Curriculum Assignment V1

**Files created:**
- `docs/GROUP_CURRICULUM_ASSIGNMENT_PLAN.md` — Documents that groups use `level_id → academy_levels` (not `curriculum_levels`). Gap analysis: three options (migration, join table, inference). V1: no code change, group resolution deferred.

**TypeScript:** Not applicable (docs only).

---

### Sprint 74 — Template Uses Academy Curriculum Version V1

**Files modified:**
- `src/lib/actions/curriculumContentPopulation.ts` — Imports resolution utility. Fetches active academy version + overrides after resolving curriculum level. `buildCurriculumNotes` extended with `AcademyNotesContext` param: includes `[Academy Version:]`, `[Override Focus:]`, and `ACADEMY CUSTOMIZATIONS:` sections in block notes. Content items biased toward override focus tags (focus-tagged items appear first, deterministically).

**TypeScript:** Clean.

---

### Sprint 75 — Session Generation Uses Academy Curriculum Version V1

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts` — Imports resolution utility. After resolving curriculum level name, fetches active academy version and override summaries. `session_notes` prefix now includes `[Academy Version:]` and `[Academy Overrides: N active]` lines with summaries.

**TypeScript:** Clean.

---

### Sprint 76 — Coach Session View Shows Academy-Specific Overrides V1

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Imports resolution utility. `CurriculumContext` interface extended with `academyVersionName` and `overrideSummaryLines`. CURRICULUM FOCUS section shows: academy version badge (GitBranch icon), override summaries under "Academy Customizations", "Internal coach context only" guardrail note.

**TypeScript:** Clean.

---

### Sprint 77 — Player Profile Uses Academy Curriculum Version V1

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — Requirements source indicator added in notes slot above `PlayerProgressionRequirements`: shows green/grey dot, curriculum version name or "Global curriculum defaults", active override count in lime.

**TypeScript:** Clean.

---

### Sprint 78 — Evidence Links Resolve Against Academy Curriculum V1

**Files created:**
- `docs/EVIDENCE_ACADEMY_CURRICULUM_RESOLUTION_PLAN.md` — Current state, proposed V2 resolution logic, files to modify in V2, guardrails, dependencies. Implementation deferred — safe V1 fallback documented.

**TypeScript:** Not applicable (docs only).

---

### Sprint 79 — Curriculum Version Consistency Audit V1

**Files modified:**
- `src/app/director/curriculum/academy-version/page.tsx` — Added "Curriculum Connection Audit" section: queries template count with/without curriculum level, player count with/without assignment. Shows stats grid + recommendation cards (orange warnings for gaps, green confirmation when connected).

**TypeScript:** Clean.

---

### Sprint 80 — Academy Curriculum Operating Loop QA + Brian Demo V1

**Files created:**
- `docs/ACADEMY_CURRICULUM_OPERATING_LOOP_QA.md` — Full QA checklist for Sprints 71–80: resolution engine, player assignment, group gap, template population, session generation, coach view, player requirements, evidence, audit, security.
- `docs/BRIAN_ACADEMY_CURRICULUM_OPERATING_LOOP_DEMO.md` — 8-step demo script: curriculum version confirm → template population with override context → session generation → session view → player profile → requirements source → audit → global master confirmation.

**Files modified:**
- `docs/CHANGELOG.md` — Sprint 71–80 entries added.

**TypeScript:** Clean.

---

## 2026-05-01 — Sprints 61–70: Academy Curriculum Clone + Voice Customization V1

**Mode:** Architecture doc, schema migration, server actions, UI components. No AI API calls. No parent/player visibility. No player level changes. No package installs.

**Migrations created:** 048

---

### Sprint 61 — Academy Curriculum Clone Architecture Plan V1

**Files created:**
- `docs/ACADEMY_CURRICULUM_CLONE_ARCHITECTURE.md` — Architecture document: global master model, academy instance model, clone strategy (reference + overrides, no physical duplication), versioning, rollback, audit strategy, risk assessment, Sprint 62–70 path.

**TypeScript:** Not applicable (docs only).

---

### Sprint 62 — Academy Curriculum Clone Schema V1

**Files created:**
- `supabase/migrations/048_academy_curriculum_clone.sql` — Creates `academy_curriculum_versions` (per-academy lightweight reference pointer) and `academy_curriculum_overrides` (structured delta records). Full RLS (staff read, director/head_coach write), indexes, updated_at triggers.

**TypeScript:** Not applicable (SQL migration only).

---

### Sprint 63 — Academy Curriculum Clone Flow V1

**Files created:**
- `src/lib/actions/academyCurriculumClone.ts` — `createAcademyCurriculumCloneAction()`: resolves academy_id from auth profile, checks for existing active version, creates academy_curriculum_versions row (version_number=1, status=active), writes audit log.
- `src/app/director/curriculum/AcademyCurriculumVersionCard.tsx` — Client component: shows active version status + override count, or "Create" button if none exists.

**Files modified:**
- `src/app/director/curriculum/page.tsx` — Added `AcademyCurriculumVersionCard` (queries academy_curriculum_versions + override count) and `VoiceOverrideInputPanel`. Added "Academy Version" to quick-nav links.

**TypeScript:** Clean.

---

### Sprint 64 — Voice Curriculum Override Draft Parser V1

**Files created:**
- `src/lib/actions/curriculumOverrideDraft.ts` — `createCurriculumOverrideDraftAction(rawInput)`: deterministic parser (no AI) for level names, pathway words, focus keywords, scope words. Creates `proposed_actions` row with `target_module = 'curriculum_override'`.
- `src/app/director/curriculum/VoiceOverrideInputPanel.tsx` — Client component: textarea input, submit to `createCurriculumOverrideDraftAction`, shows draft created confirmation.

**TypeScript:** Clean.

---

### Sprint 65 — Curriculum Override Review Queue V1

**Files created:**
- `src/app/director/review/CurriculumOverrideDraftCard.tsx` — Shows raw input, parsed level/pathway/focus/scope, proposed change summary, affected targets, warnings, clarification questions. Shows decision controls for pending, apply controls for approved.
- `src/app/director/review/CurriculumOverrideDraftDecisionControls.tsx` — Client component: approve / reject / clarification_needed buttons for curriculum override drafts.

**Files modified:**
- `src/app/director/review/actions.ts` — Added `updateCurriculumOverrideDraftDecisionAction()` and `applyApprovedCurriculumOverrideDraftAction()`.
- `src/app/director/review/page.tsx` — Added curriculum override draft fetch (step 24–27), enriched items assembly, "Curriculum Override Drafts" section, updated `PageHeader` props.

**TypeScript:** Clean.

---

### Sprint 66 — Approved Curriculum Override Application Guardrails V1

**Files created:**
- `src/app/director/review/ApplyCurriculumOverrideDraftControls.tsx` — Client component: "Apply Academy Curriculum Override" button calling `applyApprovedCurriculumOverrideDraftAction`.

**TypeScript:** Clean. (Action in actions.ts, Sprint 65.)

---

### Sprint 67 — Academy Curriculum Version + Override List V1

**Files created:**
- `src/app/director/curriculum/academy-version/page.tsx` — Read-only director view: version summary card, applied overrides list, rolled-back overrides list, guardrail copy. Uses `CurriculumOverrideDiffCard` and `RollbackOverrideButton`.

**TypeScript:** Clean.

---

### Sprint 68 — Curriculum Diff / Impact Preview V1

**Files created:**
- `src/app/director/curriculum/academy-version/CurriculumOverrideDiffCard.tsx` — Before/after comparison per override. Shows original_snapshot or "Global default", applied change summary, downstream impact preview ("Impact partially inferred"), rollback button for applied overrides.

**TypeScript:** Clean.

---

### Sprint 69 — Rollback Academy Override V1

**Files created:**
- `src/lib/actions/rollbackCurriculumOverride.ts` — `rollbackAcademyCurriculumOverrideAction(overrideId)`: verifies auth/academy/role/status, inserts rollback record (`rollback_of_override_id` set), marks original as `rolled_back`, writes audit log.
- `src/app/director/curriculum/academy-version/RollbackOverrideButton.tsx` — Client component: two-click confirm rollback flow.

**TypeScript:** Clean.

---

### Sprint 70 — Academy Curriculum Clone + Voice Customization QA / Demo V1

**Files created:**
- `docs/ACADEMY_CURRICULUM_CLONE_QA.md` — QA checklist covering all 9 workflow steps, security checks, and known V1 limitations.
- `docs/BRIAN_CURRICULUM_VOICE_CUSTOMIZATION_DEMO.md` — Full 10-step demo script from global curriculum view through rollback, with expected behavior at each step.

**TypeScript:** Clean.

---

## 2026-05-01 — Sprint 60.5: Director Curriculum Landing Page V1

**Mode:** Read-only page only. No schema changes. No migrations. No mutations. No package installs.

### Sprint 60.5 — Director Curriculum Landing Page V1

**Files created:**
- `src/app/director/curriculum/page.tsx` — Read-only landing page at `/director/curriculum`. Fixes the 404 for that route. Resolves `academy_id` from `profiles` using existing director page patterns. Shows 5 section cards: Global / Academy Curriculum Spine, Orange Ball Starter Content, Curriculum-Aware Templates, Coach Session Curriculum Context, and Next steps. Queries `curriculum_levels` (typed), `curriculum_track_requirements` (rawDb), `curriculum_content_items` (rawDb), `curriculum_content_requirement_mappings` (rawDb), and `templates.curriculum_level_id` (rawDb) — all with error checks; shows "Not available until curriculum migrations are applied." if any new-table query fails. Links to `/director/fitness/templates`, `/director/sessions`, `/director/players`, `/director/review`.

**TypeScript:** Clean.

---

## 2026-05-01 — Sprints 51–60: Curriculum Content Engine V1

**Mode:** New schema, seed data, server actions, and UI components. No AI API calls. No parent/player visibility. No player level changes. No package installs.

**Migrations created:** 045, 046, 047

---

### Sprint 51 — Curriculum Content Model Audit V1

**Files created:**
- `docs/CURRICULUM_CONTENT_MODEL_AUDIT.md` — Audit of existing curriculum spine, requirements, exercise/template schema. Documents what exists, what is missing, recommended new tables, risk assessment, and Sprint 52–60 path.

**TypeScript:** Not applicable (docs only).

---

### Sprint 52 — Drill / Game / Skill Content Schema Plan V1

**Files created:**
- `docs/CURRICULUM_CONTENT_SCHEMA_PLAN.md` — Full schema definition for `curriculum_content_items` and `curriculum_content_requirement_mappings`. Includes field list, RLS strategy, index plan, content type → block type mapping, and implementation roadmap.

**TypeScript:** Not applicable (docs only).

---

### Sprint 53 — Curriculum Content Tables / Seed Structure V1

**Files created:**
- `supabase/migrations/045_curriculum_content_library.sql` — Creates `curriculum_content_items` (drills, games, skills, assessments with coaching metadata), `curriculum_content_requirement_mappings` (content → requirement FK links), and adds `curriculum_level_id` column to `templates`. Full RLS, indexes, update_at trigger.

**TypeScript:** Not applicable (SQL migration only).

---

### Sprint 54 — Orange Ball Curriculum Content Pack V1

**Files created:**
- `supabase/migrations/046_orange_ball_content_pack.sql` — Seeds 29 global-default content items across Orange 1 (9), Orange 2 (10), Orange 3 (10). All items include success criteria, coach cues, progressions, regressions, parent-safe names.
- `docs/ORANGE_BALL_CURRICULUM_CONTENT_PACK.md` — Describes the content pack: content counts, content quality notes, block type mapping reference.

**TypeScript:** Not applicable (SQL migration + docs only).

---

### Sprint 55 — Content-to-Requirement Mapping V1

**Files created:**
- `supabase/migrations/047_content_requirement_mappings_seed.sql` — Maps 29 Orange Ball content items to 32 Orange Ball requirements using develops/assesses/reinforces mapping types. Idempotent via ON CONFLICT DO NOTHING. Guards: resolves all IDs by natural key, skips silently if any ID is missing.

**TypeScript:** Not applicable (SQL migration only).

---

### Sprint 56 — Curriculum-Aware Template Block Population V1

**Files created:**
- `src/lib/actions/curriculumContentPopulation.ts` — Server action `populateTemplateBlocksFromCurriculumAction`. Reads template's `curriculum_level_id`, fetches matching content items, writes structured curriculum notes (drills, games, cues, success criteria) to `template_blocks.notes` for each empty block. Skips blocks with existing notes. Returns per-block results.
- `src/app/director/fitness/templates/[templateId]/PopulateCurriculumBlocksButton.tsx` — Client button that calls the population action. Shows per-block detail expandable results.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Added imports for `PopulateCurriculumBlocksButton` and `CurriculumLevelSelector`.

**TypeScript:** Clean.

---

### Sprint 57 — Director Template Builder Curriculum Focus Selector V1

**Files created:**
- `src/app/director/fitness/templates/[templateId]/setCurriculumLevelAction.ts` — Server action to update `templates.curriculum_level_id`. Auth + role + academy + level ID validation. Revalidates template page path.
- `src/app/director/fitness/templates/[templateId]/CurriculumLevelSelector.tsx` — Client component with grouped dropdown (by stage), Save button, saved confirmation. Uses `useTransition` for optimistic UX.
- `docs/CURRICULUM_TEMPLATE_POPULATION_LIMITATIONS.md` — Documents 4 known V1 limitations: no exercise row insertion, rawDb cast for new column, no force-refresh, Orange Ball only.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Fetches `curriculum_level_id` and all curriculum levels. Renders `CurriculumLevelSelector` and `PopulateCurriculumBlocksButton` in a new Curriculum card above the Exercise Population section.

**TypeScript:** Clean.

---

### Sprint 58 — Generated Session Plan from Curriculum Template V1

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts` — Now fetches `curriculum_level_id` from the template alongside name. If a curriculum level exists, its name is prepended to `session.session_notes` as `[Curriculum: {levelName}]`. Block notes (already containing curriculum content from Sprint 56) are copied to session_blocks.notes unchanged — curriculum context flows automatically.

**TypeScript:** Clean.

---

### Sprint 59 — Coach Session Curriculum Context V1

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Extended template fetch to also read `curriculum_level_id`. Resolves level `display_name` and `stage`. Renders a `CURRICULUM FOCUS` section card above Group Assignment showing the level name, stage, and a note that block notes contain curriculum content for the coach.

**TypeScript:** Clean.

---

### Sprint 60 — Curriculum Content QA + Demo Readiness V1

**Files created:**
- `docs/CURRICULUM_CONTENT_ENGINE_QA.md` — QA checklist: schema checks, TypeScript check, 10-step manual walkthrough, known limitations table, expected git status.
- `docs/BRIAN_CURRICULUM_DEMO_SCRIPT.md` — 8-scene demo script for director persona. Covers: requirements → content → mappings → template level selector → block population → session generation → curriculum context panel → player progress loop.

**TypeScript:** Clean.

---

## 2026-05-01 — Claude Code Operating System Setup

**Mode:** Config/docs only. No runtime behavior changed. No schema changes. No package installs.

**Purpose:** Set up reusable Claude Code skills, subagent definitions, guardrails, and documentation to make future Academy OS sprints safer and more autonomous.

**Files created:**
- `CLAUDE.md` — appended sprint execution protocol, git hygiene rules, security guardrails, protected files list, TypeScript validation requirement, and available commands reference
- `.claude/commands/academy-sprint.md` — invokable `/academy-sprint` skill: full sprint execution workflow with inspect → plan → implement → validate → report phases
- `.claude/commands/academy-guardrails.md` — invokable `/academy-guardrails` skill: product safety checklist (data visibility, mutations, communications, RLS, scope)
- `.claude/commands/supabase-sprint.md` — invokable `/supabase-sprint` skill: Supabase-specific sprint protocol (academy_id scoping, proposed_actions pattern, migration rules, type handling)
- `.claude/commands/review-queue-workflow.md` — invokable `/review-queue-workflow` skill: standard draft → review → approve → apply pattern with code templates
- `.claude/commands/voice-workflow.md` — invokable `/voice-workflow` skill: voice-first patterns, ambiguity handling, attendance exception example
- `.claude/agents/schema-auditor.md` — read-only schema review subagent (migration necessity, academy_id scoping, RLS coverage, type alignment)
- `.claude/agents/guardrail-auditor.md` — read-only product safety review subagent (visibility leaks, auto-mutations, communications, RLS bypass, audit trail)
- `docs/CLAUDE_CODE_OPERATING_SYSTEM.md` — human-readable guide: command reference, sprint patterns, batch sprint workflow, commit strategy, stop conditions
- `docs/CLAUDE_CODE_HOOKS_PLAN.md` — documented-only hooks plan: 6 recommended hooks (TypeScript check, protected file warning, git status, package install guard, .env guard, database.types.ts guard)

**Validation:**
- `npx tsc --noEmit` — not affected (docs/config only, no source files modified)
- `git status --short` — only intentional files in scope

---

## 2026-05-01 — Sprints 43–50: Attendance Exception Workflow + Fitness Gap + Recommendation Drafts

**Mode:** New features. No schema changes. No parent/player visibility. No AI API calls.

**Architecture pattern honored throughout:** Voice creates → UI confirms → DB structures → System executes. All writes go through `proposed_actions` pipeline. All drafts start at `pending_review`.

---

### Sprint 43 — Voice Attendance Exception Drafts V1

**Files created:**
- `src/app/director/sessions/[sessionId]/attendanceExceptionDraftAction.ts`
- `src/app/director/sessions/[sessionId]/AttendanceExceptionDraftPanel.tsx`

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx`

Rule-based attendance exception parser. Detects "everyone except X" pattern, extracts absent names, flags unrostered attendees (e.g. "Jeremy showed up"). Creates `proposed_actions` draft with `target_module = 'attendance_exception'` and `status = 'pending_review'`. Session detail page shows existing drafts with status pills.

---

### Sprint 44 — Attendance Exception Director Review Queue V1

**Files created:**
- `src/app/director/review/AttendanceExceptionDraftCard.tsx`
- `src/app/director/review/AttendanceExceptionDraftDecisionControls.tsx`

**Files modified:**
- `src/app/director/review/page.tsx`

Review queue now displays attendance exception drafts in a dedicated section. Each card shows raw input, parsed rostered attendance, and unrostered attendee warnings. Decision controls (Approve / Needs Clarification / Reject) follow the same pattern as existing draft controls.

---

### Sprint 45 — Attendance Exception Decision Controls V1

**Files created:**
- `src/app/director/review/ApplyApprovedAttendanceExceptionControls.tsx`

**Files modified:**
- `src/app/director/review/actions.ts`

Added `updateAttendanceExceptionDraftDecisionAction` and `applyApprovedAttendanceExceptionAction`. Apply action upserts `session_attendance` rows for rostered players only (`on_conflict: session_id,player_id`), writes audit_log, marks draft `executed`. Unrostered attendees (e.g. Jeremy) are never applied.

---

### Sprint 46 — Fitness Template Block Exercise Population V1

**Files created:**
- `src/app/director/fitness/templates/[templateId]/populateFitnessBlocksAction.ts`
- `src/app/director/fitness/templates/[templateId]/PopulateFitnessBlocksButton.tsx`
- `docs/FITNESS_EXPOSURE_TRACKING_PLAN.md`

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx`

"Populate Blocks with Exercises" button on template detail page. Matches exercises from the exercise library to each block by category and duration budget. Already-populated blocks are skipped. Returns per-block result counts.

---

### Sprint 47 — Fitness Assessment + Attendance Gap Logic Plan V1

**Files created:**
- `src/lib/fitness/gapLogic.ts`
- `docs/FITNESS_GAP_LOGIC_PLAN.md`

Pure deterministic utility: `computeFitnessGaps(inputs: GapInputs): FitnessGapAssessment`. No DB access, no AI API. Scores 8 fitness categories from assessment dimensions, missed session exposure, completed exercise categories, and coach note tags. Respects overtraining signals and injury constraints. Top gaps capped at 3.

---

### Sprint 48 — At-Home Fitness Recommendation Drafts V1

**Files created:**
- `src/app/director/players/[playerId]/fitnessHomeworkRecommendationAction.ts`
- `src/app/director/players/[playerId]/FitnessHomeworkRecommendationButton.tsx`

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx`

Director-triggered server action that reads attendance, assessments, coach notes, and active signals, calls `computeFitnessGaps()`, and creates a `fitness_homework_recommendation_v1` proposed_actions draft. Internal only — not visible to player or parent until explicit director approval and publication.

---

### Sprint 49 — Parent/Player-Safe Fitness Homework Draft V1

**Files created:**
- `src/app/director/players/[playerId]/parentPlayerFitnessHomeworkDraftAction.ts`

Converts an approved internal fitness recommendation into a `parent_player_fitness_homework_summary_v1` draft. Uses safe category language templates (no medical terminology). Status: `pending_review` — never auto-published.

---

### Sprint 50 — Internal Development Loop QA + Demo Readiness

**Files created:**
- `docs/INTERNAL_DEVELOPMENT_LOOP_QA.md`

Full QA checklist and 7-step demo script covering the complete flow: fitness template → populate blocks → attendance exception → director review → apply → coach observations as evidence → requirement progress → fitness gap recommendation.

**Known limitations at Sprint 50:**
- Fitness recommendation drafts not yet shown in the director review queue (next sprint)
- No parent/player publication pathway yet
- Fitness exposure aggregation not pre-aggregated (computable from existing tables)
- Unrostered attendee decision UI not yet built
- Coach workspace attendance recording not yet built

**Validation:**
- `npx tsc --noEmit` — passes with 0 errors

---

## 2026-05-01 — Sprint 42: Requirement Progress Dashboard Polish + QA V1

**Mode:** Polish + QA. No new core workflow. No schema changes. No new mutations. No parent/player visibility.

**Objective:** Improve visual hierarchy, reduce redundancy, and improve scannability of the director-facing Level-Up Requirements section without changing any business logic.

**Files inspected:**
- `src/app/director/players/[playerId]/PlayerRequirementProgressReadOnly.tsx`
- `src/app/director/players/[playerId]/LevelReadinessSummary.tsx`
- `src/app/director/players/[playerId]/RequirementEvidenceDetailList.tsx`
- `src/app/director/players/[playerId]/RequirementProgressConfirmationControls.tsx`
- `src/app/director/players/[playerId]/types.ts`
- `src/app/director/players/[playerId]/page.tsx`
- `src/components/ui/index.ts`

**Files changed:**
- `src/app/director/players/[playerId]/PlayerRequirementProgressReadOnly.tsx`
- `src/app/director/players/[playerId]/LevelReadinessSummary.tsx`
- `src/app/director/players/[playerId]/RequirementProgressConfirmationControls.tsx`
- `docs/CHANGELOG.md`

**Polish applied:**

*`PlayerRequirementProgressReadOnly.tsx`*
- Removed the redundant "Displaying requirements for / [level name]" banner — `LevelReadinessSummary` already shows the current level name in its header, making the banner a visual duplicate.
- `DomainSection` header now shows `evidence_needed` and `blocked` counts alongside `met` / `in_progress` / `not_started`, all guarded behind `> 0` so clean domain headers show nothing unnecessary. Previously "0 not started" always appeared even when all requirements were met.

*`LevelReadinessSummary.tsx`*
- Removed the 4-line footer guardrail block. The top guardrail ("Internal readiness signal only…") in the same component already covers the intent. Removing the footer reduces repetition without removing the guardrail.
- Overall counts: zero-value rows now hidden except "Total requirements" and "Total evidence links" (always shown for reference). Removes visual noise on players with no blocked/evidence_needed rows.
- Domain breakdown: zero-value stats now hidden except "Total" per domain. A domain with all requirements met no longer lists every other status at 0.

*`RequirementProgressConfirmationControls.tsx`*
- Added a "Current saved: [label]" indicator that appears below the status picker only when the user has selected a different status than the current DB value. Previously, once you clicked a different status option, there was no visual reminder of what the current saved state was.

**What was not changed:**
- No server action logic touched
- No readiness label calculation changed
- No evidence application behavior changed
- No requirement confirmation behavior changed
- No parent/player visibility
- No migrations
- No new packages
- `RequirementEvidenceDetailList.tsx` — clean, no changes needed
- `types.ts` — clean, no changes needed

**Validation:**
- `npx tsc --noEmit` — passes with 0 errors

**Manual QA checklist (to verify before commit):**
1. Open `/director/players/[playerId]` → Notes tab
2. Confirm Level-Up Requirements section hierarchy: Summary → Domains → Cards → Evidence → Confirmation
3. Confirm Level Readiness Summary appears above domain groups (no duplicate level name banner above it)
4. Confirm domain headers show only non-zero counts
5. Confirm Overall counts in summary hide zero-value statuses (except totals)
6. Confirm domain breakdown stats are compact (no "Blocked: 0" rows)
7. Confirm evidence toggle still works
8. Confirm "No official evidence linked yet" shows on cards with no evidence
9. Confirm status picker shows "Current saved: X" when a different option is selected
10. Confirm no promote / level movement button exists
11. Confirm no parent/player visibility controls
12. Confirm viewing page does not mutate DB
13. Confirm Sprint 36 evidence draft button still appears
14. Confirm Sprint 40 evidence details still display when toggled

---

## 2026-05-01 — Sprint 41: Level Readiness Summary V1

**Mode:** Implementation + validation. Read-only internal summary only. No mutations. No level movement. No parent/player visibility.

**Schema fields confirmed:**

`v_player_requirement_progress_detail` (from migration 041):
- `progress_id`, `academy_id`, `player_id`, `curriculum_level_id`, `requirement_id` ✓
- `requirement_title`, `requirement_description`, `requirement_type` ✓
- `requirement_domain_key` (`skill | competition | fitness`), `requirement_domain_label` ✓
- `level_display_name`, `level_number` ✓
- `status` (`not_started | in_progress | evidence_needed | met | waived | blocked`) ✓
- `progress_value`, `evidence_count`, `last_evidence_at` ✓
- `is_required`, `is_parent_visible`, `is_player_visible` ✓
- `domain_display_order`, `requirement_display_order` ✓
- No new DB query needed — uses already-loaded `requirementProgressRows` from page.tsx ✓

**Files created:**
- `src/app/director/players/[playerId]/LevelReadinessSummary.tsx` — read-only summary component; accepts `rows: RequirementProgressRow[]` and `currentLevelName: string | null`; computes all values from client-side data, no new fetch; returns `null` when `rows.length === 0`

**Files modified:**
- `src/app/director/players/[playerId]/PlayerRequirementProgressReadOnly.tsx` — imports `LevelReadinessSummary`; renders it between the current level context banner and the domain sections (inside the `rows.length > 0` branch only)

**Summary behavior:**

*Overall counts* — computed from `requirementProgressRows`:
- total requirements, met, in progress, evidence needed, blocked, waived, not started, total evidence links

*Domain breakdown* — computed per `skill | competition | fitness` key:
- total, met, in progress, evidence needed, blocked, not started, evidence links

*Readiness label* — derived from required-row percentages, no DB write:
| Condition | Label |
|---|---|
| No rows or no required rows | Not Configured |
| 0 met and 0 total evidence | Not Started |
| < 25% required met | Building Foundation |
| 25–49% required met | Developing |
| 50–74% required met | Strong Progress |
| 75–89% required met, no blocked | Nearly Ready |
| 75–89% required met, blocked exists | Strong Progress |
| ≥ 90% required met, no blocked, no evidence_needed | Ready for Director Review |
| ≥ 90% required met, blocked or evidence_needed | Nearly Ready |

*Readiness explanation* — deterministic sentence derived from status counts and domain strength; no AI API.

*Guardrails copy* (two locations):
- Top: "Internal readiness signal only. This does not move the player up, change levels, or publish anything to parents."
- Footer: four lines confirming internal-only nature and no automatic promotion.

**What was NOT built (by design):**
- No promote button, level-up approval, or promotion workflow
- No readiness score written to DB
- No parent/player portal changes
- No AI API calls
- No new migrations
- No package installs
- No parent communication
- No automatic level movement of any kind

**Validation:**
- `npx tsc --noEmit` — passes with zero errors.

**Manual verification steps:**
1. Confirm an Orange Ball player has `player_requirement_progress` rows in Supabase.
2. Open `/director/players/[playerId]` → Notes tab → Level-Up Requirements.
3. Confirm Level Readiness Summary appears above the Skill / Competition / Fitness domain groups.
4. Confirm current level name appears in the summary header if available.
5. Confirm total requirement count in summary matches the visible requirement cards.
6. Confirm Skill / Competition / Fitness domain breakdown appears.
7. Confirm readiness label changes based on the mix of statuses (e.g. all not_started → "Not Started").
8. Confirm no promote / level movement button exists anywhere in the summary.
9. Confirm guardrail copy is visible at top and footer.
10. Confirm no DB rows change from simply viewing the summary.
11. Confirm parent/player portal views are unchanged.
12. Confirm Sprint 39 manual confirmation controls still work.
13. Confirm Sprint 40 evidence detail toggles still work.

**git add command:**
```
git add src/app/director/players/[playerId]/LevelReadinessSummary.tsx src/app/director/players/[playerId]/PlayerRequirementProgressReadOnly.tsx docs/CHANGELOG.md
```

---

## 2026-05-01 — Sprint 40: Requirement Evidence Detail View V1

**Mode:** Implementation + validation. Read-only evidence display. No mutations. No status changes. No parent/player visibility.

**Files created:**
- `src/app/director/players/[playerId]/types.ts` — `RequirementEvidenceDetailRow` interface (local type; `requirement_evidence_links` not yet in `database.types.ts`)
- `src/app/director/players/[playerId]/RequirementEvidenceDetailList.tsx` — read-only evidence display component; renders each evidence link with type badge, confidence %, created date, internal indicator, evidence summary, coach observation snippet, and creator name

**Files modified:**
- `src/app/director/players/[playerId]/PlayerRequirementProgressReadOnly.tsx` — imported `useState`, `RequirementEvidenceDetailList`, `RequirementEvidenceDetailRow`; added `evidenceByProgressId?: Record<string, RequirementEvidenceDetailRow[]>` to `Props`; threaded through `DomainSection` → `RequirementCard`; `RequirementCard` now has toggle state (`showEvidence`) and renders a collapsible Evidence section above the confirmation controls
- `src/app/director/players/[playerId]/page.tsx` — imported `RequirementEvidenceDetailRow`; after `requirementProgressRows` loads, sequentially fetches: (1) `requirement_evidence_links` scoped to `academy_id + player_id + player_requirement_progress_id IN progressIds`; (2) `coach_observations` snippets for `evidence_type = 'coach_observation'` scoped to `academy_id + player_id`; (3) creator `display_name` from `profiles`; builds `evidenceByProgressId` map with enrichments; passes to `PlayerRequirementProgressReadOnly`

**Evidence display UX:**
- Each requirement card has an "Evidence" section header below the meta row, above the confirmation controls
- If no evidence: static "No official evidence linked yet."
- If evidence exists: collapsed by default, "Show N item(s)" toggle button to expand
- Expanded view shows each evidence row: type badge, confidence %, date, internal indicator (EyeOff), evidence summary text, coach observation snippet (observation type label + date + up to 250-char content excerpt), creator name
- "Internal evidence only. Not visible to parents or players." copy shown when expanded
- If `evidence_count > 0` but rows fail to load: warning "Evidence count exists, but details could not be loaded."

**Coach observation snippet:**
- Fetched from `coach_observations` table scoped to `academy_id + player_id`
- Matched by `evidence_id` (soft FK from `requirement_evidence_links.evidence_id`)
- Shows `observation_type`, `created_at`, and up to 250 chars of `content`
- Not exposed to parent/player views — staff portal only

**Data fetching:**
- Server-side in `page.tsx` (server component)
- Sequential queries per `AI_BACKEND_RULES.md` rule 5
- `rawDb = supabase as any` cast used — `requirement_evidence_links` not yet in `database.types.ts`
- No service role. All queries go through authenticated session with RLS enforced.

**Security:**
- `academy_id` resolved from authenticated session profile — never from client input
- Evidence links queried with `academy_id + player_id` double-scope
- Observation snippets queried with same `academy_id + player_id` scope
- Cross-academy data not accessible

**Sprint 39 confirmation controls:**
- Untouched. Status picker, note textarea, Confirm Status button, and `router.refresh()` all continue to work.

**What was NOT built (by design):**
- No evidence creation, editing, deletion, or unlinking
- No automatic requirement status updates from evidence
- No level-up readiness scoring or promotion workflow
- No parent/player portal views
- No `is_parent_safe` toggle
- No AI API calls
- No new migrations
- No package installs
- No parent communication

**Validation:**
- `npx tsc --noEmit` — passes with zero errors.

**Manual verification steps:**
1. Confirm migrations 041–044 applied to live DB
2. Confirm at least one Orange Ball player has `player_requirement_progress` rows
3. Confirm at least one requirement has official `requirement_evidence_links` from Sprint 38
4. Open `/director/players/[playerId]` → Notes tab → Level-Up Requirements
5. Confirm requirements with `evidence_count > 0` show "Show N item(s)" toggle
6. Click toggle — confirm evidence details expand: summary, type, confidence, date, internal indicator
7. If evidence_type = `coach_observation`, confirm observation snippet appears
8. Confirm requirements with no evidence show "No official evidence linked yet."
9. Click "Hide" — confirm evidence collapses
10. Confirm status confirmation controls (Sprint 39) still work
11. Confirm `requirement_evidence_links` rows are unchanged
12. Confirm `player_requirement_progress.evidence_count` / `status` unchanged from viewing
13. Confirm parent/player views unchanged

---

## 2026-05-01 — Sprint 39: Requirement Progress Confirmation Workflow V1

**Mode:** Implementation + validation. Manual confirmation only. No automatic status inference. No level movement. No parent/player visibility.

**Files created:**
- `src/app/director/players/[playerId]/requirementProgressConfirmationAction.ts` — `confirmRequirementProgressStatusAction` server action (security chain, status validation, confirmer field logic, audit log)
- `src/app/director/players/[playerId]/RequirementProgressConfirmationControls.tsx` — client component: status picker buttons, optional note textarea, guardrail copy, save button with pending state, success/error feedback, `router.refresh()` on success

**Files modified:**
- `src/app/director/players/[playerId]/PlayerRequirementProgressReadOnly.tsx` — added `ConfirmAction` type alias, added `confirmAction?` prop to `Props`; threaded `confirmAction` through `DomainSection` → `RequirementCard`; `RequirementCard` renders `RequirementProgressConfirmationControls` when `confirmAction` is present
- `src/app/director/players/[playerId]/page.tsx` — imported `confirmRequirementProgressStatusAction`; bound it with `params.playerId` via `.bind()`; passed as `confirmAction` to `PlayerRequirementProgressReadOnly`

**Server action — `confirmRequirementProgressStatusAction`:**
- Signature: `confirmRequirementProgressStatusAction(playerId, progressId, newStatus, note?)`
- `playerId` bound from server component; `progressId`, `newStatus`, `note` supplied by client
- Security chain: `assertNotPreviewMode` → auth → resolve `academy_id` from `profiles` → verify active membership (director/head_coach only) → verify player belongs to academy → fetch `player_requirement_progress` → verify `academy_id` + `player_id` match → validate `newStatus` ∈ allowed values → validate note ≤ 1000 chars
- Database writes: updates `player_requirement_progress` (status, notes if provided, confirmer fields); writes `audit_logs`
- No service role. No RLS bypass. All writes go through the anon client with active RLS.

**Confirmer field logic:**
- `newStatus = 'met'` + role `academy_director` → `director_confirmed_by = user.id`, `confirmed_at = now()`
- `newStatus = 'met'` + role `head_coach` → `coach_confirmed_by = user.id`, `confirmed_at = now()`
- Moving FROM `met` to any other status → clears `confirmed_at`, `director_confirmed_by`, `coach_confirmed_by`
- Neither old nor new status is `met` → confirmer fields left unchanged

**Notes handling:**
- If `note` provided → `notes = note.trim()` (empty string → `null`)
- If `note` not provided → existing notes preserved (field excluded from update payload)

**Audit log:**
- Action: `requirement_progress.status_confirmed`
- Target type: `player_requirement_progress`
- Payload: `player_id`, `old_status`, `new_status`, `note_present`, `evidence_count`, `role`, `confirmed_by`

**Evidence display:**
- Existing `evidence_count` and `last_evidence_at` already shown in each requirement row
- Detailed expandable evidence display deferred to Sprint 40

**What was NOT built (by design):**
- No automatic status change based on `evidence_count`
- No level-up recommendation
- No player level or profile field mutations
- No player priorities mutation
- No parent/player portal views or `is_parent_visible`/`is_player_visible` controls
- No parent communication
- No AI API calls
- No new migrations
- No package installs
- No batch confirmation
- No drag-and-drop

**Validation:**
- `npx tsc --noEmit` — passes with zero errors.

**Manual verification steps:**
1. Confirm migrations 041–044 applied to live DB
2. Confirm an Orange Ball player has `player_requirement_progress` rows
3. Open `/director/players/[playerId]` → Notes tab → Level-Up Requirements section
4. Each requirement card now shows status picker buttons + note field + guardrail copy
5. Change one status from `not_started` to `in_progress` → click "Confirm Status"
6. Confirm success message "Status confirmed." and page refreshes
7. Confirm `player_requirement_progress.status` updated in DB
8. Confirm `player_requirement_progress.evidence_count` did NOT change
9. Confirm `requirement_evidence_links` did NOT change
10. Confirm player level did NOT change
11. Change one status to `met` → confirm `confirmed_at` + confirmer field set in DB
12. Check `audit_logs` for `requirement_progress.status_confirmed` entry
13. Confirm parent/player views unchanged

---

## 2026-05-01 — Sprint 38: Approved Evidence Link Application Guardrails

**Mode:** Implementation + validation. Guarded application only. No requirement status mutation. No automatic progress confirmation.

**Files created:**
- `src/app/director/review/ApplyEvidenceRequirementDraftControls.tsx` — client component: "Create Official Evidence Links" button with guardrail copy; calls `applyApprovedEvidenceRequirementDraftAction`; pending + success + error states; refreshes router on success

**Files modified:**
- `src/app/director/review/actions.ts` — added `applyApprovedEvidenceRequirementDraftAction` server action (full security chain, duplicate check, inserts, progress update, audit log, proposed_actions → executed)
- `src/app/director/review/EvidenceRequirementDraftCard.tsx` — approved drafts now render `ApplyEvidenceRequirementDraftControls` instead of static lime banner; pending drafts still show `EvidenceRequirementDraftDecisionControls`; status banner is now conditional (lime for approved, orange for pending)
- `src/app/director/review/page.tsx` — added `evidenceApprovedCount` to `PageHeader` props and `totalReadyToApply`; updated section label from "Ready for Future Evidence Application" to "Approved — Ready to Apply"; updated badge text from "approved" to "ready to apply"

**Apply action — `applyApprovedEvidenceRequirementDraftAction`:**
- Security chain: `assertNotPreviewMode` → auth → resolve `academy_id` from profile → verify active membership (director/head_coach) → fetch `proposed_action` → verify `academy_id`, `status = approved`, `target_module = requirement_evidence_link`, `target_object_type = player`, `draft_type = requirement_evidence_link_v1` → verify player belongs to same academy
- Payload validation: validates each link has `coach_observation_id`, `requirement_progress_id`, `requirement_id`, `evidence_type = coach_observation`; confidence between 0–1 if present
- Cross-verification: fetches `coach_observations` and `player_requirement_progress` — verifies both belong to same academy + player; verifies `requirement_id` in link matches the progress row's `requirement_id`
- Duplicate protection: application-level check on `(academy_id, player_id, requirement_id, evidence_type, evidence_id)` — no unique constraint on `requirement_evidence_links`; skips duplicates silently; returns error if all are duplicates

**Database write strategy:**
- Inserts `requirement_evidence_links` rows for non-duplicate links
  - `evidence_type = 'coach_observation'`, `evidence_id = coach_observation_id`, `is_parent_safe = false`
- Updates `player_requirement_progress` for each affected progress row:
  - `evidence_count` = actual SELECT COUNT(*) from `requirement_evidence_links` (idempotent — safe to retry)
  - `last_evidence_at` = max `created_at` among all evidence links for that progress row
  - `status` is NOT changed — requirement confirmation is a separate future workflow
- Writes to `audit_logs` (action: `requirement_evidence_link.applied`) — `action_execution_logs` has no INSERT RLS
- Marks `proposed_actions.status = executed` after all writes succeed

**UI behavior:**
- Button label: "Create Official Evidence Links"
- Pending state: "Creating evidence links…"
- Success: "Official evidence links created." + `router.refresh()`
- After refresh: executed drafts drop from queue (query filters `status IN (pending_review, approved)`)
- Error states: "Only approved evidence link drafts can be applied." / "This draft does not contain valid evidence links." / "All proposed evidence links already exist. No duplicates were created."

**What was NOT built (by design):**
- No mark requirements met
- No mark requirement in_progress
- No change to `player_requirement_progress.status`
- No level-up recommendation
- No player level or profile field mutations
- No parent/player portal views or communication
- No AI API calls
- No migrations
- No package installs
- No batch apply-all

**Validation:**
- `npx tsc --noEmit` — passes with zero errors.

**Manual verification steps:**
1. Confirm at least one `proposed_actions` row with `target_module = requirement_evidence_link`, `status = approved`, `draft_type = requirement_evidence_link_v1`
2. Open `/director/review`
3. Confirm approved evidence draft shows "Create Official Evidence Links" button with guardrail copy
4. Click "Create Official Evidence Links"
5. Confirm success message "Official evidence links created."
6. Confirm `requirement_evidence_links` rows exist: `evidence_type = coach_observation`, `evidence_id = coach_observation_id` from payload, `requirement_id` matches payload, `player_requirement_progress_id` matches payload, `is_parent_safe = false`
7. Confirm `player_requirement_progress.evidence_count` updated
8. Confirm `player_requirement_progress.last_evidence_at` updated
9. Confirm `player_requirement_progress.status` did NOT change
10. Confirm player level did NOT change
11. Confirm `coach_observations` did NOT change
12. Confirm parent/player views did NOT change
13. Confirm `proposed_actions.status = executed`
14. Try applying same draft again or navigate back — confirm duplicates are blocked/skipped safely
15. Confirm session recap and priority recommendation sections still work correctly

---

## 2026-05-01 — Sprint 37: Evidence Requirement Draft Review Queue V1

**Mode:** Review visibility and decision controls only. No official evidence-link application. No requirement progress mutation.

**Files created:**
- `src/app/director/review/EvidenceRequirementDraftDecisionControls.tsx` — client component: approve / needs clarification / reject buttons; calls `updateEvidenceRequirementDraftDecisionAction`; optional decision note (max 1000 chars); refreshes router on success
- `src/app/director/review/EvidenceRequirementDraftCard.tsx` — display card: player name, proposer, created date, status, proposed link count, domain breakdown (skill / competition / fitness), first 5 requirement titles with domain tag + confidence %, evidence summaries; draft-only warnings; View Player Profile link; decision controls for pending drafts; approved banner for approved drafts

**Files modified:**
- `src/app/director/review/page.tsx` — added evidence link draft fetch (steps 14–18); player name batch lookup; proposer batch lookup; enriched item assembly; "Evidence Link Drafts" section with pending + optional approved subsection; updated `PageHeader` to include `evidencePendingCount` in total pending badge

**Review queue behavior:**
- New "Evidence Link Drafts" section appears after the existing Priority Recommendation Drafts section on `/director/review`
- Fetches `proposed_actions` where `target_module = requirement_evidence_link`, `status IN (pending_review, approved)`, `academy_id = current academy`
- Post-fetch filter: `proposed_payload.draft_type = requirement_evidence_link_v1`
- Pending drafts shown in main subsection with decision controls
- Approved drafts shown in "Approved — Ready for Future Evidence Application" subsection; no apply button
- Empty state shown when no pending or approved evidence link drafts exist

**Decision behavior:**
- `updateEvidenceRequirementDraftDecisionAction` (already in `actions.ts` from Sprint 36) handles approve / reject / clarification_needed
- Updates only `proposed_actions.status` + reviewer tracking fields (`approved_by`, `approved_at`, `rejected_by`, `rejected_at`, `reviewer_notes`, `rejection_reason`)
- Verifies: authenticated user, academy membership (director or head_coach), `academy_id` match, `target_module = requirement_evidence_link`, `target_object_type = player`, `draft_type = requirement_evidence_link_v1`, `status = pending_review`

**Database read/write strategy:**
- Reads: `proposed_actions`, `players` (name lookup), `profiles` (proposer name lookup) — all scoped to `academy_id`
- Writes: `proposed_actions` reviewer fields only
- No writes to: `requirement_evidence_links`, `player_requirement_progress`, `coach_observations`, player profiles, or any other table

**Security checks:**
- `assertNotPreviewMode()`
- Authenticated Supabase server client (no service role)
- `academy_id` resolved from authenticated profile — never trusts client input
- Active academy membership verified (`academy_director` or `head_coach` only)
- `proposed_actions.academy_id` verified against session academy
- `target_module`, `target_object_type`, `draft_type` verified before any update
- `status = pending_review` required — already-reviewed drafts blocked

**What was NOT built (by design):**
- No "Apply Evidence Links" button
- No inserts into `requirement_evidence_links`
- No updates to `player_requirement_progress` (evidence_count, last_evidence_at, status)
- No coach_observations mutations
- No player level or profile field mutations
- No parent/player portal views
- No AI API calls
- No migrations
- No package installs

**Validation:**
- `npx tsc --noEmit` — passes with zero errors.

**Manual verification steps:**
1. Confirm at least one `proposed_actions` row exists with `target_module = requirement_evidence_link`, `status = pending_review`, `draft_type = requirement_evidence_link_v1`
2. Open `/director/review`
3. Confirm "Evidence Link Drafts" section appears below Priority Recommendation Drafts
4. Confirm card shows player name, link count, requirement titles, domain breakdown, draft-only warnings
5. Click "View Player Profile" — confirm navigates to `/director/players/[playerId]`
6. Click "Needs Clarification" or "Approve" — confirm `proposed_actions.status` updates only
7. Confirm `requirement_evidence_links`, `player_requirement_progress`, `coach_observations` unchanged
8. Confirm existing session recap and priority review sections still work correctly

---

## 2026-04-30 — Sprint 36: Evidence-to-Requirement Link Drafts V1

**Mode:** Draft creation only. No mutations to evidence tables. No requirement status updates. No parent/player views.

**Files created:**
- `src/app/director/players/[playerId]/evidenceRequirementDraftAction.ts` — server action: auth chain → fetch observations → fetch requirement progress → deterministic keyword matching → insert one batch `proposed_actions` row
- `src/app/director/players/[playerId]/EvidenceRequirementDraftButton.tsx` — client button component, same pattern as `PriorityRecommendationDraftButton`
- `src/app/director/players/[playerId]/EvidenceRequirementDrafts.tsx` — read-only display of pending evidence link drafts on the player profile

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — imports for 3 new files; query for existing evidence link drafts; action binding; `EvidenceRequirementDrafts` + `EvidenceRequirementDraftButton` card added to notesSlot after `PlayerRequirementProgressReadOnly`

**What was built:**
- "Create Evidence Link Drafts" button in a new "Evidence Linking" card in the Notes tab of the director player profile.
- Deterministic keyword matching — no AI API call. Uses three domain keyword families (`skill`, `competition`, `fitness`) plus tokenized requirement title/description words.
- Matching logic: tokenizes observation tags and content; computes keyword overlap with requirement keyword sets; requires ≥1 matching keyword; confidence = 0.3 + (match_count / 10) × 0.6, capped at 0.9.
- Caps output to 10 proposed links per click; deduplicates per (observation, requirement) pair.
- Duplicate prevention: checks for existing `pending_review` draft with same `target_module` + `target_object_id` before creating a new batch.
- Empty/safe states: returns descriptive messages for no observations, no requirement rows, and no matches found.
- One batch `proposed_actions` row per click — reduces review clutter vs. per-link rows.
- Proposed payload shape: `draft_type = requirement_evidence_link_v1`, `source = coach_observation_requirement_matching`, `links[]` with `coach_observation_id`, `requirement_progress_id`, `requirement_id`, `requirement_title`, `requirement_domain_key`, `evidence_summary`, `match_reason`, `confidence`, `is_parent_safe = false`.
- Existing pending/approved evidence link drafts displayed above the button in "Evidence Link Drafts" section — shows link count, domain breakdown, first 5 requirement titles, and draft-only warning.

**Security chain:**
- `assertNotPreviewMode()`
- Authenticated Supabase server client (no service role)
- `academy_id` resolved from authenticated profile — never trusts client input
- Active academy membership verified (`academy_director` or `head_coach` only)
- Player verified as belonging to this academy
- All queries scoped to `academy_id` + `player_id`
- No RLS bypass

**proposed_actions write strategy:**
- `target_module = requirement_evidence_link`
- `target_object_type = player`
- `target_object_id = player.id`
- `status = pending_review`
- `action_type = other`
- `voice_command_id` created via `voice_commands` relay row insert (NOT NULL constraint requires it)

**What was NOT built (by design):**
- No inserts into `requirement_evidence_links`
- No updates to `player_requirement_progress` (evidence_count, status, last_evidence_at)
- No updates to `coach_observations`
- No requirement confirmation workflow
- No "mark met" or "mark in progress" controls
- No parent/player portal views
- No review queue integration (deferred to next sprint)
- No AI API calls
- No new migrations
- No new packages

**Validation:**
- `npx tsc --noEmit` — passes with zero errors.

**Type regeneration note:**
`database.types.ts` does not yet include `v_player_requirement_progress_detail`. Local types used in the action file are consistent with the view definition in migration 041.

---

## 2026-04-30 — Sprint 35: Player Requirement Progress Read-Only UI

**Mode:** Read-only UI only. No mutations. No confirmation workflow. No evidence linking.

**Files changed:**
- `src/app/director/players/[playerId]/PlayerRequirementProgressReadOnly.tsx` — created
- `src/app/director/players/[playerId]/page.tsx` — query + component integration

**What was built:**
- New `PlayerRequirementProgressReadOnly` component added to the Notes tab of the director player profile.
- Queries `v_player_requirement_progress_detail` filtered by `academy_id` + `player_id`, ordered by `domain_display_order` then `requirement_display_order`.
- Groups requirement rows into three domain sections: Skill Path, Competition Path, Fitness Path.
- Each requirement card shows: title, description, status badge, required/optional badge, evidence count, requirement type, last evidence date (if any), and internal-only visibility indicator.
- Status labels: Not Started, In Progress, Evidence Needed, Met, Waived, Blocked.
- Domain section headers show per-status counts (met / in progress / not started).
- Current level context displayed when rows exist.
- Read-only disclaimer at section top.
- Empty state when no rows exist, differentiated for Orange Ball vs. other levels.
- Empty state when no curriculum assigned.

**Security:**
- Uses authenticated Supabase server client (no service role).
- Resolves `academy_id` from authenticated profile.
- Queries scoped strictly to `academy_id = current academy` and `player_id = current player`.
- RLS on `player_requirement_progress` and `curriculum_track_requirements` enforces academy scoping at DB level.

**Data fetch strategy:**
- Server-side query in `page.tsx` using existing `rawDb` cast pattern (avoids TS2589).
- Local `RequirementProgressRow` interface defined in the component file — used because `v_player_requirement_progress_detail` is not yet in `database.types.ts`.
- `isOrangeBallPlayer` derived from `curriculumSummary?.stage === 'orange_development'`.

**Type handling:**
- `v_player_requirement_progress_detail` is NOT in `database.types.ts`.
- Local TypeScript interface `RequirementProgressRow` used instead.
- `database.types.ts` was NOT manually edited.
- After applying migrations 041–044 to live DB, run `supabase gen types typescript` to regenerate types and remove the local interface.

**What was NOT built (by design):**
- No status update controls, no "mark met" button, no checkboxes.
- No evidence linking controls.
- No parent/player portal views.
- No level-up recommendation or promotion button.
- No AI summary.
- No scoring logic.
- No confirmation workflow.
- No new migrations.
- No new packages.

**Validation:**
- `npx tsc --noEmit` — passes with zero errors.

**Type regeneration note:**
`database.types.ts` does not yet include `v_player_requirement_progress_detail`, `player_requirement_progress`, `requirement_evidence_links`, `curriculum_requirement_domains`, or `curriculum_track_requirements`. These were added in migration 041. After applying migrations 041–044 to the live database, regenerate types with:
```
supabase gen types typescript --project-id <project-id> > src/lib/supabase/database.types.ts
```
Once types are regenerated, the local `RequirementProgressRow` interface in `PlayerRequirementProgressReadOnly.tsx` can be replaced with the generated `Tables<'v_player_requirement_progress_detail'>` type.

---

## 2026-04-30 — Sprint 34: Player Requirement Progress Bootstrap V1

**Mode:** Migration only. No UI. No scoring. No evidence linking. No player data changes.

**Migration file created:** `supabase/migrations/044_player_requirement_progress_bootstrap.sql`

**Purpose:**
Initialises empty `player_requirement_progress` rows for all players whose current curriculum state (`player_curriculum_states.current_level_id`) is assigned to one of the three Orange Ball levels seeded in Sprint 33.

**Orange Ball levels targeted:**
- Orange 1 — Rally (`orange_development`, level_number=1)
- Orange 2 — Direction (`orange_development`, level_number=2)
- Orange 3 — Construction (`orange_development`, level_number=3)

**Bootstrap logic:**
One row is inserted per (player, requirement) by joining:
- `player_curriculum_states` → identifies each player's current level
- `curriculum_levels` → filters to `stage = 'orange_development'` and `level_number IN (1, 2, 3)`
- `curriculum_track_requirements` → selects only active global defaults (`academy_id IS NULL`, `source_type = 'global_default'`, `version = 1`, `is_active = true`)

**Rows created per player (based on Sprint 33 seed):**
| Orange Ball Level | Requirements per player |
|---|---|
| Orange 1 — Rally | 10 |
| Orange 2 — Direction | 11 |
| Orange 3 — Construction | 11 |

**Default values for every inserted row:**
- `status = 'not_started'`
- `progress_value = NULL`
- `evidence_count = 0`
- `last_evidence_at = NULL`
- `coach_confirmed_by = NULL`
- `director_confirmed_by = NULL`
- `confirmed_at = NULL`
- `notes = NULL`
- `is_parent_visible = false`
- `is_player_visible = false`

**Idempotency strategy:**
`ON CONFLICT (player_id, requirement_id) DO NOTHING`
Targets the UNIQUE constraint on `player_requirement_progress(player_id, requirement_id)` defined in migration 041. Safe to re-run — duplicate inserts silently skipped.

**Tables intentionally untouched (Sprint 34 scope):**
- `requirement_evidence_links` — no evidence links created
- `player_curriculum_states` — not altered; only read as the population source
- `players` — unchanged
- `player_priorities` — unchanged
- All UI components — unchanged
- All server actions — unchanged
- All backend files — unchanged

**No new tables, views, functions, types, or indexes created.**

**Type regeneration status:** Migration does not add new tables or columns. `database.types.ts` shape is unchanged from Sprint 30. After applying to live DB, run:
```
supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/database.types.ts
```

**TypeScript check:** Skipped — no source files changed. Migration and changelog only.

**Validation:**
- SQL syntax reviewed manually ✓
- All column names cross-checked against migration 041 (`player_requirement_progress`) and migration 036 (`player_curriculum_states`, `curriculum_levels`) ✓
- `stage = 'orange_development'` matches the `curriculum_stage` enum defined in migration 036 ✓
- `source_type = 'global_default'` satisfies CHECK constraint in migration 041 ✓
- `status = 'not_started'` satisfies CHECK constraint in migration 041 ✓
- `ON CONFLICT (player_id, requirement_id)` matches UNIQUE constraint in migration 041 ✓
- No player data created, inferred, or modified ✓
- No scoring logic ✓
- No evidence links ✓
- No parent/player visibility enabled ✓

**Manual verification queries (run after migration is applied):**

```sql
-- 1. Confirm Orange Ball levels exist
SELECT display_name, level_number, sort_order
FROM curriculum_levels
WHERE stage = 'orange_development'
ORDER BY sort_order;

-- 2. Confirm Orange Ball requirement definitions
SELECT cl.display_name, COUNT(*) AS requirement_count
FROM curriculum_track_requirements ctr
JOIN curriculum_levels cl ON cl.id = ctr.curriculum_level_id
WHERE cl.stage = 'orange_development'
  AND cl.level_number IN (1,2,3)
  AND ctr.academy_id IS NULL
  AND ctr.source_type = 'global_default'
GROUP BY cl.display_name
ORDER BY cl.display_name;

-- 3. Confirm player progress rows exist only for Orange curriculum players
SELECT cl.display_name, COUNT(*) AS progress_rows
FROM player_requirement_progress prp
JOIN curriculum_levels cl ON cl.id = prp.curriculum_level_id
WHERE cl.stage = 'orange_development'
GROUP BY cl.display_name
ORDER BY cl.display_name;

-- 4. Confirm all new rows default correctly
SELECT status, evidence_count, is_parent_visible, is_player_visible, COUNT(*)
FROM player_requirement_progress
GROUP BY status, evidence_count, is_parent_visible, is_player_visible;
-- Expected: status=not_started, evidence_count=0, is_parent_visible=false, is_player_visible=false

-- 5. Confirm no evidence links created
SELECT COUNT(*) FROM requirement_evidence_links;

-- 6. Confirm no player level changes (compare before/after)
SELECT player_id, current_level_id FROM player_curriculum_states;
```

---

## 2026-04-30 — Sprint 33: Orange Ball Starter Requirement Seed Migration

**Mode:** Seed migration only. No UI. No player data changes. No player progress bootstrap.

**Migration file created:** `supabase/migrations/043_orange_ball_starter_requirements.sql`

**Orange Ball levels targeted:**
- Orange 1 — Rally (`orange_development`, level_number=1, sort_order=4)
- Orange 2 — Direction (`orange_development`, level_number=2, sort_order=5)
- Orange 3 — Construction (`orange_development`, level_number=3, sort_order=6)

**Rows seeded into `curriculum_track_requirements` (32 total):**

| Level | Skill | Competition | Fitness | Total |
|---|---|---|---|---|
| Orange 1 — Rally | 4 | 3 | 3 | 10 |
| Orange 2 — Direction | 5 | 3 | 3 | 11 |
| Orange 3 — Construction | 4 | 4 | 3 | 11 |
| **Total** | **13** | **10** | **9** | **32** |

**Row field conventions for all 32 rows:**
- `academy_id = NULL` — global default, not academy-specific
- `source_type = 'global_default'`
- `version = 1`
- `is_active = true`
- `evidence_policy = 'coach_confirmed'` — no automatic progression
- `is_parent_visible_default = false`
- `is_player_visible_default = false`

**requirement_type breakdown:**
- `'qualitative'` — 28 rows (all observation-based requirements)
- `'attendance'` — 4 rows: Effort and readiness (O1 Fit), Session-length effort (O2 Fit), Internal match play participation (O3 Comp), Full session stamina (O3 Fit)

**Attendance-type rows with numeric targets:**
| Title | target_value | unit |
|---|---|---|
| Effort and readiness (O1) | 8 | sessions |
| Session-length effort (O2) | 8 | sessions |
| Internal match play participation (O3) | 2 | matches |
| Full session stamina (O3) | 8 | sessions |

**is_required=false rows (8 of 32):**
- Orange 1: Basic directional intent (Skill), Effort and readiness (Fitness)
- Orange 2: Rally under directional constraint (Skill), Serve reliability in game context (Competition), Session-length effort (Fitness)
- Orange 3: Shot transition — defence to offence (Skill), Opponent weakness awareness (Competition), Between-point recovery routine (Fitness)

**Idempotency strategy:**
`ON CONFLICT (curriculum_level_id, requirement_domain_id, title, version) WHERE academy_id IS NULL DO NOTHING`
Targets the partial unique index `idx_curriculum_track_req_global_unique` defined in migration 041. Safe to re-run — duplicate inserts silently skipped.

**Guard clauses:** Migration raises `RAISE EXCEPTION` if any Orange Ball level or domain lookup returns NULL, preventing silent partial seeding.

**Tables intentionally untouched (Sprint 33 scope):**
- `player_requirement_progress` — no rows created
- `requirement_evidence_links` — no rows created
- `player` tables — unchanged
- `player_priorities` — unchanged
- All UI components — unchanged
- All server actions — unchanged
- All backend files — unchanged

**Type regeneration status:** Migration not yet applied to live DB. `database.types.ts` not updated — this migration adds no new tables or columns; type shape is unchanged from Sprint 30. After applying, run:
```
supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/database.types.ts
```

**TypeScript check:** Skipped — no source files changed. Migration and changelog only.

**Validation:**
- SQL syntax reviewed manually ✓
- `requirement_type` values (`'qualitative'`, `'attendance'`) satisfy CHECK constraint in migration 041 ✓
- `evidence_policy` value (`'coach_confirmed'`) satisfies CHECK constraint in migration 041 ✓
- `source_type` value (`'global_default'`) satisfies CHECK constraint in migration 041 ✓
- ON CONFLICT predicate matches `idx_curriculum_track_req_global_unique` partial index exactly ✓
- `academy_id = NULL` on all rows — no academy-scoped data created ✓
- Single-quote escaping verified for apostrophe characters in pass_condition and description fields ✓
- Row count verified: 10 + 11 + 11 = 32 ✓

**Manual verification steps (after applying migration):**
1. Confirm requirement domains exist:
   `SELECT key, label FROM curriculum_requirement_domains ORDER BY display_order;`
2. Confirm Orange Ball levels exist:
   `SELECT display_name, level_number, sort_order FROM curriculum_levels WHERE display_name ILIKE '%Orange%' ORDER BY sort_order;`
3. Confirm seeded requirement count:
   `SELECT COUNT(*) FROM curriculum_track_requirements WHERE academy_id IS NULL AND source_type = 'global_default' AND version = 1;`
   — Expected: 32
4. Confirm Orange Ball rows by level/domain:
   ```sql
   SELECT cl.display_name, crd.key, COUNT(*)
   FROM curriculum_track_requirements ctr
   JOIN curriculum_levels cl ON cl.id = ctr.curriculum_level_id
   JOIN curriculum_requirement_domains crd ON crd.id = ctr.requirement_domain_id
   WHERE cl.display_name ILIKE '%Orange%'
   GROUP BY cl.display_name, crd.key
   ORDER BY cl.display_name, crd.key;
   ```
   — Expected: Orange 1 (competition=3, fitness=3, skill=4), Orange 2 (competition=3, fitness=3, skill=5), Orange 3 (competition=4, fitness=3, skill=4)
5. Confirm no player progress rows were created:
   `SELECT COUNT(*) FROM player_requirement_progress;`
   — Expected: 0 (or unchanged from pre-migration count)
6. Confirm no evidence links were created:
   `SELECT COUNT(*) FROM requirement_evidence_links;`
   — Expected: 0 (or unchanged)
7. Confirm no academy-specific rows were created:
   `SELECT COUNT(*) FROM curriculum_track_requirements WHERE academy_id IS NOT NULL;`
   — Expected: 0 (or unchanged)

**Files changed:**
- `supabase/migrations/043_orange_ball_starter_requirements.sql` — created (240 lines)
- `docs/CHANGELOG.md` — this entry

**git add command (do not commit until approved):**
```
git add supabase/migrations/043_orange_ball_starter_requirements.sql docs/CHANGELOG.md
```

---

## 2026-04-30 — Sprint 32: Starter Requirement Seed Pack Planning

**Mode:** Planning and documentation only. No migration. No seed SQL. No UI. No player data changes.

**Planning document created:** `docs/STARTER_REQUIREMENT_SEED_PACK_PLAN.md`

**Schema inspection confirmed:**
- `curriculum_levels` contains 15 rows across 5 stages
- Orange Ball levels confirmed: `Orange 1 — Rally`, `Orange 2 — Direction`, `Orange 3 — Construction`
- `curriculum_requirement_domains` contains 3 seeded rows: `skill`, `competition`, `fitness`
- `curriculum_track_requirements` schema confirmed with all required columns: `requirement_type`, `measurement_method`, `target_value`, `unit`, `pass_condition`, `evidence_policy`, `is_required`, `display_order`, `is_parent_visible_default`, `is_player_visible_default`, `source_type`, `version`, `is_active`
- `player_requirement_progress` and `requirement_evidence_links` exist with correct shape

**Scope decision:** Option A — Orange Ball 1–3 only (approximately 27–45 requirement rows across 3 levels × 3 domains).

**Starter requirement language drafted for:**
- Orange 1 — Rally: 4 Skill, 3 Competition, 3 Fitness requirements (10 total)
- Orange 2 — Direction: 5 Skill, 3 Competition, 3 Fitness requirements (11 total)
- Orange 3 — Construction: 4 Skill, 4 Competition, 3 Fitness requirements (11 total)

**Key design decisions:**
- All starter rows: `source_type = 'global_default'`, `academy_id = NULL`, `version = 1`, `is_active = true`
- All starter rows: `evidence_policy = 'coach_confirmed'` — no automatic promotion
- All starter rows: `is_parent_visible_default = false`, `is_player_visible_default = false`
- `requirement_type` leans `'qualitative'`; attendance-based requirements use `'attendance'`
- Human approval required before Sprint 33 seeds these rows

**Tables intentionally untouched (Sprint 32 scope):**
- `curriculum_track_requirements` — no rows seeded; language plan only
- `player_requirement_progress` — no rows created
- `requirement_evidence_links` — no rows created
- All player tables, player profile, player priorities — unchanged
- All UI components — unchanged
- All supabase migrations — unchanged

**Recommended next sprints:**
- Sprint 33 — Orange Ball Starter Requirement Seed Migration (pending human approval)
- Sprint 34 — Player Requirement Progress Bootstrap V1
- Sprint 35 — Player Requirement Progress Read-Only UI
- Sprint 36 — Evidence-to-Requirement Link Drafts V1
- Sprint 37 — Requirement Confirmation Workflow V1

**TypeScript check:** Skipped — no source files changed.

**Migration created:** None.

**Files changed:**
- `docs/STARTER_REQUIREMENT_SEED_PACK_PLAN.md` — created
- `docs/CHANGELOG.md` — this entry

---

## 2026-04-30 — Sprint 31: Requirement Domain Seed Pack V1

**Mode:** Seed migration only. No UI. No player data changes. No track requirement content.

**Migration file created:** `supabase/migrations/042_requirement_domain_seed.sql`

**Rows seeded into `curriculum_requirement_domains` (3):**

| key | label | display_order | is_active |
|---|---|---|---|
| `skill` | Skill Path | 10 | true |
| `competition` | Competition Path | 20 | true |
| `fitness` | Fitness Path | 30 | true |

**Idempotency strategy:** `ON CONFLICT (key) DO UPDATE SET` — reruns update label, description, display_order, is_active, updated_at. Safe to apply multiple times.

**Tables seeded:** `curriculum_requirement_domains` only.

**Tables intentionally untouched (Sprint 31 scope):**
- `curriculum_track_requirements` — no requirement rows seeded; no level-specific content built
- `player_requirement_progress` — no player rows created
- `requirement_evidence_links` — no evidence rows created
- All player tables, player profile, player priorities — unchanged
- All UI components — unchanged
- All app server actions — unchanged

**Type regeneration status:** Migration not applied to live DB yet. `database.types.ts` not updated (seed-only migration adds no new columns or tables; type shape is unchanged from Sprint 30). Run `supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts` after applying both migrations 041 and 042.

**TypeScript check:** Skipped — no source files changed. Migration and changelog only.

**Validation:**
- SQL syntax reviewed manually — `ON CONFLICT (key)` targets the `UNIQUE` constraint defined in migration 041 ✓
- CHECK constraint (`key IN ('skill', 'competition', 'fitness')`) satisfied by all three rows ✓
- `display_order` values (10, 20, 30) are non-overlapping integers ✓
- `is_active = true` for all three rows ✓
- No RLS bypass required — migration runs as database owner ✓

**Manual verification steps (after applying migration):**
1. `SELECT key, label, display_order, is_active FROM curriculum_requirement_domains ORDER BY display_order;`
2. Confirm exactly 3 rows: `skill / competition / fitness`
3. Confirm labels: `Skill Path / Competition Path / Fitness Path`
4. Confirm display_order: `10 / 20 / 30`
5. Confirm `is_active = true` for all three
6. `SELECT COUNT(*) FROM curriculum_track_requirements;` — should be 0
7. `SELECT COUNT(*) FROM player_requirement_progress;` — should be 0
8. `SELECT COUNT(*) FROM requirement_evidence_links;` — should be 0

**Files changed:**
- `supabase/migrations/042_requirement_domain_seed.sql` — created (44 lines)
- `docs/CHANGELOG.md` — this entry

---

## 2026-04-30 — Sprint 30: Requirement Domain Tables Migration

**Mode:** Schema migration only. No seed data. No UI. No app behavior changes.

**Migration file created:** `supabase/migrations/041_requirement_domains.sql`

**Tables created (4):**

- `curriculum_requirement_domains` — Global reference table. Defines the three pathway domain buckets (skill, competition, fitness). `key` column has CHECK constraint. No `academy_id`. 3 rows will be seeded in Sprint 31.
- `curriculum_track_requirements` — Named requirements per curriculum level and pathway domain. Supports global defaults (`academy_id IS NULL`) and academy-specific overrides/additions (`academy_id IS NOT NULL`). Partial unique indexes used to handle NULL uniqueness correctly.
- `player_requirement_progress` — Per-player per-requirement status tracking. `UNIQUE(player_id, requirement_id)`. Preserves history across level advances.
- `requirement_evidence_links` — Polymorphic evidence-to-requirement links. `evidence_id` is a soft FK (application-enforced). Immutable once created (no `updated_at`).

**View created (1):**

- `v_player_requirement_progress_detail` — Read-only join of all four tables. Exposes `requirement_domain_key`, `requirement_domain_label`, `level_display_name`, `level_number`, `status`, `evidence_count`, and display order fields for the player profile curriculum UI. RLS enforced on underlying tables.

**RLS summary:**

| Table | Read | Write |
|---|---|---|
| `curriculum_requirement_domains` | All authenticated | Directors/heads only (`auth_is_director_or_head()`) |
| `curriculum_track_requirements` | All authenticated (global rows) + own academy rows | Directors/heads for own academy rows only; global rows not writable from app |
| `player_requirement_progress` | Academy staff (`auth_is_staff()`) | Academy staff only |
| `requirement_evidence_links` | Academy staff | Academy staff only |

**Parent/player access deferred to Sprint 32.**

**updated_at triggers:**
- `trg_curriculum_req_domains_updated_at` — uses `update_updated_at_column()` (defined in migration 036)
- `trg_curriculum_track_req_updated_at` — same function
- `trg_player_req_progress_updated_at` — same function
- `requirement_evidence_links` — no trigger; evidence links are immutable once created

**Unique constraint approach for `curriculum_track_requirements`:**
Standard `UNIQUE (academy_id, ...)` cannot enforce uniqueness for global rows because `NULL != NULL` in PostgreSQL. Two partial unique indexes are used instead:
- `idx_curriculum_track_req_global_unique` — unique on `(curriculum_level_id, requirement_domain_id, title, version)` WHERE `academy_id IS NULL`
- `idx_curriculum_track_req_academy_unique` — unique on `(academy_id, curriculum_level_id, requirement_domain_id, title, version)` WHERE `academy_id IS NOT NULL`

**No seed data.** Domain rows (skill, competition, fitness) deferred to Sprint 31.

**No UI changes.** `progression_rules` and `v_curriculum_level_requirements` are untouched.

**Type regeneration status:** Migration not applied to live DB yet. `database.types.ts` not updated. Run `supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts` after applying migration.

**TypeScript check:** Clean (`npx tsc --noEmit` — no source files changed; no errors).

**Files changed:**
- `supabase/migrations/041_requirement_domains.sql` — created (320 lines)
- `docs/CHANGELOG.md` — this entry

---

## 2026-04-30 — Sprint 29: Curriculum Requirement Domains Schema Plan

**Mode:** Schema inspection + planning only. No migrations. No implementation.

**Schema inspected:**
- `curriculum_stages`, `curriculum_levels`, `skill_progressions`, `skill_domains` — global, no academy_id, no per-track breakdown
- `progression_rules` — general level-up criteria, no academy override, no source/version tracking
- `v_curriculum_level_requirements` — VIEW (not a table), flat criteria, no track differentiation
- `player_curriculum_states` — academy_id present, single-level state, no per-track state
- `player_domain_progress` — tracks mastery for 8 Skill path domains only, no competition/fitness equivalent
- `player_progression` — flat aggregate scores (technical/tactical/competition/movement), not per-requirement
- `player_priorities` — category enum adjacent to tracks but not curriculum-linked
- `assessments`, `coach_observations`, `session_attendance`, `player_outcomes` — valid future evidence sources, no FK to any curriculum requirement
- `development_track` enum (`skill | competition | fitness | combined`) confirmed to exist but NOT wired into curriculum tables
- App homework / external evidence tables — confirmed absent from all 40 migrations

**Gap confirmed:**
- No per-pathway (Skill / Competition / Fitness) requirement rows
- No named requirement table (only aggregate thresholds in `progression_rules`)
- No player progress tracking per named requirement
- No requirement-to-evidence linkage
- No academy override mechanism for requirements
- No parent/player visibility flags on requirements
- No versioning on requirement definitions

**Plan created:** `docs/CURRICULUM_REQUIREMENT_DOMAINS_PLAN.md`

**Proposed new tables:**
- `curriculum_requirement_domains` — 3 pathway domains (skill, competition, fitness)
- `curriculum_track_requirements` — named requirements per level per domain, with academy override support
- `player_requirement_progress` — per-player per-requirement status tracking
- `requirement_evidence_links` — links coach observations, assessments, attendance, outcomes to requirements

**Recommended migration sequence:** Sprint 30 (domain + requirement tables) → Sprint 31 (seed data) → Sprint 32 (progress view + UI) → Sprint 33 (evidence linking) → Sprint 34 (confirmation workflow)

**No migrations created. No implementation. No source files changed.**

**TypeScript check skipped** — no source files changed; check not required per sprint rules.

**Files changed:**
- `docs/CURRICULUM_REQUIREMENT_DOMAINS_PLAN.md` — created (planning document)
- `docs/CHANGELOG.md` — this entry

---

## 2026-04-30 — Sprint 28: Player Progression Requirements Read-Only V1

**Schema fields confirmed:**
- `players.current_level_id` → references `academy_levels` (academy-specific levels)
- `player_curriculum_states.current_level_id` → references `curriculum_levels` (global curriculum spine)
- `v_player_curriculum_detail` (already fetched as `domainRows`) has `current_level_id`, `current_level_name`, `stage`, `stage_name`, `advancement_eligible` — no extra query needed for current level display
- `v_curriculum_level_requirements` view: has `level_id`, `sort_order`, `level_number`, `stage_name`, `min_assessment_score`, `min_domains_mastered`, `min_total_outcomes`, `min_weeks_at_level`, `requires_director_approval`, `requires_final_assessment`, `blocking_signal_types` — authenticated read confirmed
- `curriculum_levels`: global, authenticated read, used for next-level derivation by `sort_order`
- `progression_rules`: authenticated read, LEFT JOINed into `v_curriculum_level_requirements` — NULLs expected if rules not yet seeded for a level
- `player_progression` (joined in `getPlayerById`): has `technical_score`, `tactical_score`, `competition_score`, `movement_score` — used as current development score context
- `development_track` enum (`skill | competition | fitness | combined`) does NOT appear on `v_curriculum_level_requirements` — per-track requirements are NOT in schema; grouping by Skill/Competition/Fitness not supported yet

**Schema decision:**
Requirements exist as GENERAL level criteria (not per-track). Skill/Competition/Fitness grouping is schema-absent. Component shows general advancement criteria with a note that per-track breakdown comes in a future curriculum sprint. Track scores from `player_progression` displayed as context.

**Files created:**
- `src/app/director/players/[playerId]/PlayerProgressionRequirements.tsx` — read-only component; shows current curriculum level, next target level (if derivable), general advancement criteria, current development scores; no controls; no mutations

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — added `PlayerProgressionRequirements` import; added 2 sequential rawDb queries (v_curriculum_level_requirements + curriculum_levels); added `progressionScores` from already-fetched player_progression; renders `PlayerProgressionRequirements` in Notes tab above `PlayerActivePriorities`
- `docs/CHANGELOG.md` — this entry

**Data queries added (page.tsx):**
1. `rawDb.from('v_curriculum_level_requirements').select(...).eq('level_id', curriculumSummary.current_level_id).limit(1)` — gets advancement criteria + sort_order
2. `rawDb.from('curriculum_levels').select(...).gt('sort_order', ...).order('sort_order').limit(1)` — derives next curriculum level
- Both queries are conditional on `curriculumSummary?.current_level_id` being non-null
- `progressionScores = (player as any).player_progression?.[0]` — no new DB query (already joined)

**Display behavior:**
- Section appears in Notes tab, above Active Priorities
- If no curriculum state: "No curriculum level has been assigned to this player yet."
- Current level: shows `current_level_name` + `stage_name` from `domainRows[0]`
- Next target: shows next `curriculum_levels` row by sort_order, or "Next target level has not been configured yet."
- Advancement eligibility: lime banner if eligible, muted banner if not
- Advancement criteria: table rows for each non-null requirement, or "not configured yet" message
- Blocking signals: orange pills if any `blocking_signal_types` set
- Track scores: 2×2 or 4-column grid of technical/tactical/competition/movement scores (hidden if all null)
- Disclaimer: "Read-only development guidance. This does not move the player up, change priorities, or publish anything to parents."

**Security checks:**
- Uses authenticated Supabase server client (no service role)
- `academy_id` resolved from server-side profile (existing pattern)
- Player verified in existing code (`getPlayerById` throws → `notFound()`)
- `curriculum_levels` and `v_curriculum_level_requirements` queries use player's `current_level_id`, not cross-academy data
- No player, priority, observation, or proposed_action mutations

**What was not built:**
- No parent portal progression view
- No player portal progression view
- No level-up scoring or automatic promotion recommendation
- No level update button or move-up workflow
- No per-track (Skill/Competition/Fitness) requirement rows — schema does not support yet
- No migrations

**Validation:**
- `npx tsc --noEmit` — passes, zero errors

---

## 2026-04-30 — Sprint 27: Approved Priority Recommendation Application Guardrails

**Schema fields confirmed:**
- `proposed_actions.status` enum includes `approved` and `executed` — both confirmed present
- `proposed_actions.target_object_type` — string, confirmed `player` for priority recommendation drafts
- `proposed_actions.voice_command_id` — NOT NULL, passed through to audit_logs
- `player_priorities` required insert fields: `academy_id`, `player_id`, `title`, `category` (priority_category enum)
- `player_priorities.is_active` — boolean, default true; the player profile page filters by this field only
- `player_priorities` has no provenance fields (`source_proposed_action_id`, `generated_by`) — provenance recorded in `audit_logs.payload`
- `player_priorities` RLS: `"Staff manage priorities" FOR ALL` — covers INSERT for authenticated staff
- `audit_logs` INSERT confirmed working (same pattern as sprint 21 recap action)
- No database-level uniqueness constraint on `player_priorities` title — duplicate check is application-level

**Files created:**
- `src/app/director/review/ApplyPriorityRecommendationControls.tsx` — client component; "Create Active Priority" button; guardrail copy; calls `applyApprovedPriorityRecommendationAction`; success/error states; `router.refresh()` on success

**Files modified:**
- `src/app/director/review/actions.ts` — added `applyApprovedPriorityRecommendationAction`; full security chain (auth → academy_id → membership → proposed_action verify → payload validate → player verify → duplicate check → insert player_priorities → audit_log → mark executed); no service role; no RLS bypass
- `src/app/director/review/PriorityRecommendationDraftCard.tsx` — dynamic status label (pending vs approved); different banner color for approved; conditionally renders `ApplyPriorityRecommendationControls` for approved drafts, `PriorityDraftDecisionControls` for pending
- `src/app/director/review/page.tsx` — priority draft query changed from `eq('status', 'pending_review')` to `in('status', ['pending_review', 'approved'])`; pending/approved splits computed; "Approved — Ready to Apply" section added for priority drafts; `PageHeader` updated with `priorityApprovedCount`; total ready-to-apply badge in page header now includes both session recap and priority approved counts

**Files read only:**
- `src/app/director/players/[playerId]/PlayerActivePriorities.tsx`, `priorityRecommendationAction.ts`, `page.tsx`
- `supabase/migrations/020_player_priorities.sql`
- `src/lib/supabase/database.types.ts`
- `docs/CHANGELOG.md`, `docs/AI_BACKEND_RULES.md`, `docs/CURRENT_BUILD_TARGET.md`, `docs/LOCKED_MODULES.md`, `docs/KNOWN_LIMITATIONS.md`, `docs/MODULE_BUILD_PROCESS.md`

**Apply behavior:**
- Button appears only on approved priority recommendation drafts
- Clicking "Create Active Priority" calls `applyApprovedPriorityRecommendationAction(proposedActionId)`
- Inserts one `player_priorities` row: `is_active=true`, `status='active'`, title/description/category/priority_level/urgency from `proposed_payload.recommended_priority`, `priority_rank=max_existing+1`
- Writes `audit_logs` row with full provenance (proposed_action_id, player_id, applied_by, source)
- Updates `proposed_actions.status = 'executed'` only after successful insert
- `router.refresh()` causes the applied draft to disappear from the queue (executed status excluded from query)
- Active priority appears on `/director/players/[playerId]` Active Priorities section

**Duplicate handling:**
- Fetches active player priorities before insert
- Normalizes title (lowercase trim) and checks for exact match
- Returns: "An active priority with a similar title already exists for this player. No duplicate was created."
- No insert attempted if duplicate found

**Security checks:**
- `assertNotPreviewMode`
- Auth user required
- `academy_id` resolved from server-side profile — never from client
- Active academy membership verified — `academy_director` or `head_coach` only
- `proposed_action.academy_id` verified against authenticated `academy_id`
- `status === 'approved'` required
- `target_module === 'priority_recommendation'` required
- `target_object_type === 'player'` required
- `draft_type === 'priority_recommendation_v1'` required
- Title non-empty, ≤ 200 chars
- Description ≤ 1000 chars
- Category validated against full `priority_category` enum list
- Player membership in academy verified by separate query

**What was NOT built:**
- No batch apply
- No auto-apply after approval
- No priority editing, completion, or deletion
- No parent/player-facing priority view
- No level-up logic
- No progression score
- No duplicate resolution UI
- No drag-and-drop rank reordering
- No notification or communication drafts
- No migrations
- No package installs
- No AI API

**TypeScript:** clean

---

## 2026-04-30 — Sprint 26: Priority Recommendation Review Queue V1

**Schema fields confirmed:**
- `proposed_actions.target_module` — string, used to filter `priority_recommendation`
- `proposed_actions.status` — `proposed_action_status` enum includes `pending_review`, `approved`, `rejected`, `clarification_needed`
- `proposed_actions.target_object_id` — player UUID for priority recommendation drafts
- `proposed_actions.proposed_by_id` — UUID ref to `profiles.id`
- `players.first_name`, `players.last_name`, `players.full_name` — name fields for player lookup
- `profiles.display_name` — proposer display name

**Files created:**
- `src/app/director/review/PriorityDraftDecisionControls.tsx` — client component; approve/reject/clarification controls; calls `updatePriorityRecommendationDecisionAction`; governance copy: "Approval marks this recommendation as ready for a future priority-creation step. It does not create an active priority yet."
- `src/app/director/review/PriorityRecommendationDraftCard.tsx` — card component; shows player name, created date, proposer, recommended priority title, category, priority level, urgency, evidence tags, observation count, overlap warning, draft-only banner, View Player Profile link

**Files modified:**
- `src/app/director/review/actions.ts` — added `updatePriorityRecommendationDecisionAction`; guards `target_module === 'priority_recommendation'`; same security chain as existing session recap action; never touches `player_priorities`
- `src/app/director/review/page.tsx` — added priority recommendation section: queries `proposed_actions` by `target_module = priority_recommendation` + `status = pending_review`; batch-fetches player names and proposer names; renders `PriorityRecommendationDraftCard` per draft; session recap section unchanged; added `Target` icon to `PageHeader` pending count

**Files read only:**
- `src/app/director/review/StructuredDraftCard.tsx`, `DraftDecisionControls.tsx`, `ApplyApprovedDraftControls.tsx`
- `src/app/director/players/[playerId]/PriorityRecommendationDrafts.tsx`, `priorityRecommendationAction.ts`
- `src/lib/supabase/database.types.ts`

**What was NOT built:**
- No `player_priorities` insert/update
- No apply/activate button for priority recommendations
- No active priority creation
- No parent/player-facing view
- No migrations
- No package installs

**TypeScript:** clean

---

## 2026-04-30 — Sprint 25: Priority Recommendation Drafts from Evidence V1

**Schema fields confirmed:**

**`proposed_actions`:**
- `voice_command_id: string` — NOT NULL in Insert → voice_commands relay row required ✓
- `action_type`: `Enums['action_type']` — `'other'` is valid ✓
- `status`: `Enums['proposed_action_status']` — `'pending_review'` is valid ✓
- `target_module: string` — free text, `'priority_recommendation'` is safe ✓
- `target_object_type: string | null` — free text, `'player'` is safe ✓
- `target_object_id: string | null` — holds player UUID ✓
- `proposed_payload: Json` — stores full recommendation payload ✓
- `action_label: string` — required, set to `"Priority Recommendation Draft"` ✓

**`voice_commands` (relay row):**
- Required FK (proposed_actions.voice_command_id is NOT NULL) → relay row created as in Sprint 18 ✓
- `input_method: 'typed' | 'audio' | 'api'` → `'typed'` used ✓
- `issuer_role`: `user_role` enum — `academy_director` and `head_coach` both valid ✓

**`player_priorities.category`:** `priority_category` enum: `technical_skill | tactical_skill | physical_fitness | competition_exposure | behavioral | load_management | reassessment | promotion_readiness` — matches sprint tag mapping exactly ✓

**`priority_category` enum vs tag mapping:** Confirmed identical. Tag→category map built from sprint spec. Tiebreaker order: technical_skill > behavioral > tactical_skill > physical_fitness > competition_exposure > load_management > reassessment > promotion_readiness.

**Recommendation logic (deterministic, no AI):**
- Tags from all coach_observations (limit 50) are counted across the whole observation set
- Tag → category vote map applied using sprint's keyword mapping
- Highest category by vote count wins; tiebreaker by priority order
- If no tag votes: observation types used as fallback via second map
- Top 2 tags → recommended title via category-specific phrase template
- Active priority overlap: checked by scanning active priority titles for shared top tags
- Overlap warning stored in payload when found
- All logic in-process; no external API; no AI

**`proposed_payload` shape:** `draft_type: 'priority_recommendation_v1'`, `source: 'player_evidence_summary'`, `recommended_priority: { title, description, category, priority_level: 'medium', urgency: 'normal', suggested_status: 'recommended', requires_review: true }`, `evidence: { observation_count, top_tags, top_observation_types, from_recap_count, session_linked_count, most_recent_observation_at }`, `active_priority_overlap_warning`, `warnings: ['Draft only...', 'Requires director approval...']`

**Files created:**
- `src/app/director/players/[playerId]/priorityRecommendationAction.ts` — server action `createPriorityRecommendationDraftAction(playerId)`. Security chain: assertNotPreviewMode → auth → academy_id from profile → active academy_director/head_coach membership → player ownership (verified against academy_id) → fetch coach_observations (rawDb, limit 50) → guard: no observations → error early → fetch active player_priorities (rawDb) → generate deterministic recommendation → build payload → create voice_commands relay row → insert proposed_actions (target_module='priority_recommendation', target_object_type='player', status='pending_review', action_type='other'). Never writes player_priorities, player profile fields, coach_observations, attendance, or parent views.
- `src/app/director/players/[playerId]/PriorityRecommendationDraftButton.tsx` — `'use client'` component. "Create Priority Recommendation Draft" button with Sparkles icon. `useTransition` for pending state. "Creates a draft recommendation from internal evidence. It does not update active priorities." copy. Green success message / red error message after action completes.
- `src/app/director/players/[playerId]/PriorityRecommendationDrafts.tsx` — read-only display of existing priority recommendation drafts for this player. Shows: "Draft Only · Not Applied" badge, status label (Pending Review / Approved / Needs Clarification), recommended title, category badge, evidence tags, overlap warning (AlertTriangle icon), created date. Returns null when no drafts. No approve/apply controls.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — 3 additions: (1) imports for 3 new files; (2) query for existing recommendation drafts (proposed_actions where target_module='priority_recommendation' + target_object_id=playerId + status in [pending_review, approved, clarification_needed], limit 5); (3) bound action `createDraftAction = createPriorityRecommendationDraftAction.bind(null, params.playerId)`; (4) in notesSlot: `<PriorityRecommendationDrafts>` and `<PriorityRecommendationDraftButton>` inserted between Evidence Summary and Internal Coach Observations feed.
- `docs/CHANGELOG.md` — this entry

**Security checks:**
- `assertNotPreviewMode()` — writes blocked in preview
- Auth required (no user → early return)
- `academy_id` resolved from authenticated profile — never trusted from client
- `academy_director` or `head_coach` active membership required
- Player verified as belonging to academy before any processing
- No observations → early error return (button disabled by error message)
- `rawDb` cast only for JSONB-heavy queries (coach_observations, player_priorities, proposed_actions fetch)
- Typed client for voice_commands and proposed_actions inserts
- No service role; no RLS bypass
- `proposed_actions` insert always includes `.eq('academy_id', academyId)` scoping

**Not built (intentional scope boundary):**
- No direct player_priorities insert/update
- No priority editing, completion, or deletion
- No approve/apply recommendation button
- No parent/player-facing priority view
- No review queue integration (priority recommendation drafts do not appear in /director/review — that queue filters target_module='session_recap_structuring' only)
- No level-up logic
- No progression score
- No profile mutation
- No parent-safe message generation
- No AI API integration
- No migrations
- No package installs

**Validation:** `npx tsc --noEmit` — no errors.

**Manual verification steps:**
1. Ensure a player has coach_observations rows with tags.
2. Open /director/players/[playerId] → Notes tab.
3. Confirm "Priority Recommendation" card is visible with "Create Priority Recommendation Draft" button.
4. Confirm copy reads: "Creates a draft recommendation from internal evidence. It does not update active priorities."
5. Click "Create Priority Recommendation Draft".
6. Confirm green success message: "Priority recommendation draft created for review."
7. Refresh page — confirm "Priority Recommendation Drafts" card appears with the new draft.
8. Confirm draft shows: "Draft Only · Not Applied" badge, "Pending Review" status, recommended title, category badge, evidence tags.
9. In Supabase: confirm proposed_actions row exists with target_module='priority_recommendation', target_object_type='player', target_object_id=player.id, status='pending_review', proposed_payload.draft_type='priority_recommendation_v1'.
10. Confirm player_priorities was NOT modified.
11. Confirm player profile fields were NOT modified.
12. Confirm coach_observations were NOT modified.
13. Confirm parent/player views were NOT modified.
14. Open /director/review — confirm NO priority recommendation draft appears there (review queue filters session_recap_structuring only).
15. If player has no observations, confirm button shows error: "No coach observations found..."

---

## 2026-04-30 — Sprint 24: Player Active Priorities Read-Only V1

**Schema fields confirmed — `player_priorities`:**
- `id`, `academy_id`, `player_id` ✓
- `title` (string) — priority text ✓
- `description` (string | null) — notes ✓
- `category` (`priority_category` enum: technical_skill, tactical_skill, physical_fitness, competition_exposure, behavioral, load_management, reassessment, promotion_readiness) ✓
- `status` (string) — plain string ✓
- `is_active` (boolean) — active filter ✓
- `priority_level` (string) — high / medium / low ✓
- `priority_rank` (number) — display order ✓
- `urgency` (string) ✓
- `generated_at`, `updated_at` (string) — dates ✓

**Query strategy:**
- Scoped by `academy_id` + `player_id`, filtered `is_active = true`, ordered by `priority_rank ASC`
- `rawDb` cast (same pattern as enriched observations) to avoid TS2589

**Files changed:**
- `src/app/director/players/[playerId]/PlayerActivePriorities.tsx` — new read-only component
- `src/app/director/players/[playerId]/page.tsx` — import + query + inserted above evidence summary in Notes tab
- `docs/CHANGELOG.md`

**Implementation:**
- Active Priorities section in the Notes tab above Development Evidence Summary
- Priority cards: title, category badge, priority_level, urgency badge, status badge, description, generated_at / updated_at
- Ordered by `priority_rank`
- Empty state: "No active priorities have been set for this player yet. Future sprints will allow director-approved priorities to be created from evidence."
- Disclaimer: "Priorities are shown for visibility only. Observations and evidence summaries do not automatically change priorities yet."

**Security:**
- Authenticated server client only — no service role
- `academy_id` resolved from authenticated profile
- Priorities queried only where `academy_id` + `player_id` match — no cross-academy exposure
- Read-only — no add/edit/delete/complete controls

**Not built (intentional scope boundary):**
- No priority creation, editing, completion, or deletion
- No AI-generated priority recommendations
- No automatic priority updates from observations
- No parent/player-facing priority display
- No level-up logic
- No migrations

**Validation:** `npx tsc --noEmit` — no errors.

---

## 2026-04-30 — Sprint 23: Player Profile Evidence Summary V1

**Schema fields confirmed:**

**coach_observations** — all fields already confirmed in Sprint 22; reused for summary:
- `observation_type`: string — grouped and counted to produce top types ✓
- `tags`: string[] | null — flattened and counted across all observations for top themes ✓
- `is_private`: boolean — counted for "Internal" metric ✓
- `ai_entities`: JSONB — `ai_entities.source === 'session_recap_draft'` counted for "From Recap" metric ✓
- `created_at`: string — first item (newest-first sort) used for "Most recent observation" ✓
- `sessions` join present — non-null sessions counted for "Session-linked" metric ✓

**What can be summarized without AI:**
- Observations by type ✓
- Tags by frequency ✓
- Internal count, From Recap count, Session-linked count ✓
- Last observation date ✓
- Recap ratio text note ✓

**Files changed:**
- `src/app/director/players/[playerId]/CoachObservationEvidenceSummary.tsx` — new component; deterministic evidence summary
- `src/app/director/players/[playerId]/page.tsx` — import + inserted summary above observations feed
- `docs/CHANGELOG.md`

**Implementation:**
- Zero additional DB queries — reuses `enrichedObservations` already fetched in `page.tsx`
- Metric grid: Total, Internal, From Recap, Session-linked
- Most recent observation date shown
- Top observation types (up to 3) with counts
- Top tags/themes (up to 5) with counts
- Deterministic recap-ratio note ("Most recent evidence comes from structured coach recaps" if ≥50% from recap)
- Disclaimer: "Internal evidence summary. This does not change player level, priorities, or parent-facing communication."
- Empty state: "No evidence summary yet. Applied coach observations will create the first evidence signals."

**Security:**
- Read-only — no mutations
- No additional queries; uses same `academy_id + player_id` scoped data
- No parent/player visibility

**What was NOT built:**
- No parent-facing or player-facing summaries
- No level-up / progression logic
- No automatic priorities
- No AI summarization
- No chart library
- No profile field mutations
- No observation approval workflow
- No migrations

**TypeScript:** `npx tsc --noEmit` — zero errors

**Validation (manual):**
1. Navigate to `/director/players/[playerId]` → Notes tab
2. Confirm Evidence Summary card appears above Internal Coach Observations
3. Confirm total, Internal, From Recap, Session-linked counts are visible
4. Confirm top observation types and top tags appear if observations exist
5. Confirm disclaimer copy is present
6. Confirm empty state shows when no observations exist
7. Confirm no player profile fields, priorities, or parent/player views changed

---

## 2026-04-30 — Sprint 22: Coach Observations Player Profile Feed V1

**Schema fields confirmed:**

**coach_observations**
- `id`, `academy_id`, `player_id`, `coach_id`, `session_id` ✓
- `content`, `observation_type`, `tags`, `is_private` ✓
- `ai_entities: JSONB` — includes `{ source: 'session_recap_draft', ... }` for recap-originated rows ✓
- `voice_command_id`, `created_at`, `updated_at` ✓
- Can query by `academy_id + player_id` ✓; RLS: `academy_id = auth_academy_id() AND auth_is_staff()` ✓

**profiles** — `display_name` available via `coach_observations_coach_id_fkey` join ✓

**sessions** — `name`, `scheduled_date` available via `coach_observations_session_id_fkey` join ✓

**Files changed:**
- `src/app/director/players/[playerId]/CoachObservationsFeed.tsx` — new component; enriched read-only feed
- `src/app/director/players/[playerId]/page.tsx` — replaced `getCoachObservations` + `CoachObservationTimeline` with enriched inline query + `CoachObservationsFeed`
- `docs/CHANGELOG.md`

**Implementation:**
- Enriched query uses `rawDb = supabase as any` (TS2589 avoidance for multi-join select)
- Query scoped to `academy_id + player_id`; RLS provides belt-and-suspenders academy isolation
- Join: `profiles!coach_observations_coach_id_fkey(display_name)` for coach name
- Join: `sessions!coach_observations_session_id_fkey(name, scheduled_date)` for session context
- Sorted newest-first, limit 20
- "Internal" badge when `is_private = true`
- "From Recap" badge when `ai_entities.source = 'session_recap_draft'`
- Tags displayed as chips
- Coach name + session name/date shown as provenance
- "Internal development evidence. Not parent-facing yet." label on section
- Empty state: "No coach observations have been applied to this player yet. Approved session recap drafts will appear here after they are applied."

**What was NOT built:**
- No parent-facing or player-facing feed
- No level-up / progression logic
- No profile mutation
- No priority update
- No observation editing, deletion, or approval
- No AI summarization
- No batch actions
- No migrations
- No package installs

**TypeScript check:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-04-30 — Sprint 21: Approved Draft Application Plan + Guardrails

**Schema fields confirmed before coding:**

**proposed_actions**
- `status` enum: `pending_review | clarification_needed | approved | modified | rejected | executed | failed | expired` — `executed` and `failed` both valid ✓
- `approved_by: string | null`, `approved_at: string | null` — set by Sprint 20 ✓
- `proposed_payload: Json` — never modified by this action ✓
- NO `executed_by`/`executed_at` directly on `proposed_actions` — those live in `action_execution_logs` ✓

**action_execution_logs**
- Has `executed_by`, `executed_at`, `status` (`success|partial|failed`), `execution_result`, `objects_created`, `error_message` ✓
- **No INSERT RLS policy** — cannot write from application code without service role ✗ → writes go to `audit_logs` instead

**coach_observations**
- `academy_id: string` (required) ✓
- `player_id: string` (required, NOT NULL) ✓
- `coach_id: string` (required, NOT NULL) — uses `session.coach_id` ✓
- `session_id: string | null` ✓
- `content: string` (required) ✓
- `is_private: boolean` — default `false`; application sets `true` ✓
- `observation_type: string` — strict CHECK constraint: `general | technical | tactical | movement | competition | behavioral | injury_concern | positive_highlight` — application uses `'general'` ✓
- `tags: string[] | null` — application passes `possible_focus` keywords ✓
- `voice_command_id: UUID | null` — no FK constraint; application passes proposed_action's voice_command_id ✓
- `ai_entities: JSONB | null` — application stores `{ source, proposed_action_id, requires_review: true }` for provenance ✓

**sessions**
- `coach_id: string` (NOT NULL) — always available ✓

**audit_logs**
- INSERT RLS policy: `CHECK (academy_id = auth_academy_id())` — writeable from app code ✓

**Key structural constraint:**
`PlayerObservationDraft` has `player_name` but NOT `player_id`. Player IDs come from `detected_players[].player_id` (matched by name). Only observations where `player_name === detected_player.name` are applied; others are skipped.

---

**Application Plan:**

| Payload section | Disposition | Target table | Risk | Confirmation |
|---|---|---|---|---|
| `detected_players` | Supporting data only (for player_id resolution) | — | Low | Already approved |
| `attendance_mentions` | Defer | None | High | Requires attendance-specific confirmation |
| `session_actual_draft` | Defer | None | Medium | No session_actuals table exists yet |
| `player_observation_drafts` | **Apply now** (confirmed player_id only) | `coach_observations` | Low | Director approval sufficient |
| `director_summary_draft` | Defer | None | Medium | No single official target table |
| `parent_safe_draft_candidates` | Never auto-apply | None | High | Requires parent-safe approval + delivery pipeline |
| `warnings` | Informational only | — | — | — |

---

**Files created:**
- `src/app/director/review/ApplyApprovedDraftControls.tsx` — `'use client'` component. Scope guardrail copy (required per spec): "Apply only creates internal coach observations from approved player observation drafts. It does not update attendance, parent messages, player priorities, player levels, or profiles." Apply button (lime, `PlayCircle` icon). Success message with observation count. Error display with rollback note. `useTransition` for pending state.

**Files modified:**
- `src/app/director/review/actions.ts` — added `ApplyApprovedDraftResult` interface and `applyApprovedStructuredDraftAction` server action. Security chain: assertNotPreviewMode → auth → academy_id from profile → active director/head_coach membership → fetch proposed_action (rawDb) → verify academy_id + status=approved + target_module=session_recap_structuring → verify draft_type=session_recap_structuring_v1 → fetch session (verify academy_id, get coach_id) → build name→player_id map from detected_players → match observation drafts to player_ids (skip unmatched, skip sentinel text) → batch verify player_ids against academy → sequential inserts into coach_observations (is_private=true, observation_type='general', tags=possible_focus, ai_entities with source provenance) → write audit_logs → update proposed_actions.status='executed' only after all inserts succeed. Never touches attendance, parent messages, player priorities, player profiles, or templates.
- `src/app/director/review/StructuredDraftCard.tsx` — imported `ApplyApprovedDraftControls`; dynamic status label in header (`approved — ready to apply` vs `pending review`); conditionally renders `ApplyApprovedDraftControls` when `draft.status === 'approved'`, `DraftDecisionControls` otherwise.
- `src/app/director/review/page.tsx` — expanded query to `.in('status', ['pending_review', 'approved'])`; splits enriched drafts into `pendingDrafts` + `approvedDrafts`; renders "Approved — Ready to Apply" section above pending section; `PageHeader` now shows both pending count (orange) and approved count (lime); empty state only applies to pending section.
- `docs/CHANGELOG.md` — this entry

**Application write sequence (only on full success):**
1. Insert `coach_observations` rows sequentially (one per qualifying observation)
2. Insert into `audit_logs` (action: `session_recap.observations.applied`)
3. Update `proposed_actions.status = 'executed'`
If any observation insert fails: stop, do not write audit_logs, do not mark executed, return error.

**Why action_execution_logs was NOT used:**
Migration 009 creates `action_execution_logs` with only a SELECT policy for directors. There is no INSERT policy. Writes from application code would be blocked by RLS. The `execute_approved_action()` SECURITY DEFINER function writes to it, but we are not calling that RPC (it handles voice action_types, not session_recap_structuring). `audit_logs` has a working INSERT policy and is used instead.

**Observation fields applied:**
- `content` ← `obs.observation`
- `observation_type` ← `'general'` (only safe value within CHECK constraint for recap-originated notes)
- `is_private` ← `true` (staff-only internal observation)
- `tags` ← `obs.possible_focus` (keyword array from structuring)
- `session_id` ← `proposedAction.target_object_id` (the source session)
- `coach_id` ← `session.coach_id` (the coach who ran the session)
- `voice_command_id` ← `proposedAction.voice_command_id` (source voice command)
- `ai_entities` ← `{ source: 'session_recap_draft', proposed_action_id, requires_review: true }`

**What was NOT built:**
- attendance_mentions → session_attendance (high risk, needs separate confirmation flow)
- session_actual_draft → sessions or session_actuals (no session_actuals table exists)
- director_summary_draft → any table (no clear target)
- parent_safe_draft_candidates → parent_messages or parent_updates (requires parent-safe approval + delivery)
- player priority updates from draft
- player level/progression updates
- batch apply
- auto-apply after approval
- edit observations before applying
- AI API integration

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure a `proposed_actions` row exists with `target_module = 'session_recap_structuring'` and `status = 'approved'`.
2. Open `/director/review`.
3. Confirm "Approved — Ready to Apply" section appears above pending section.
4. Confirm header shows both "N pending" (orange) and "N ready to apply" (lime) badges.
5. Confirm approved draft card shows "approved — ready to apply" status label.
6. Confirm guardrail copy is visible: "Apply only creates internal coach observations…"
7. Click "Apply Approved Draft".
8. Confirm green success message with observation count.
9. Confirm approved section disappears from page (status became `executed`).
10. In Supabase: confirm `coach_observations` rows were created with `is_private = true`, `observation_type = 'general'`, correct `session_id`, `coach_id`, `player_id`.
11. Confirm `ai_entities` on each observation contains `source: 'session_recap_draft'` and `proposed_action_id`.
12. Confirm `proposed_actions.status = 'executed'` for the applied draft.
13. Confirm `audit_logs` row exists with `action = 'session_recap.observations.applied'`.
14. Confirm `session_attendance` was NOT modified.
15. Confirm player profiles were NOT modified.
16. Confirm player priorities were NOT modified.
17. Confirm `parent_updates` was NOT modified.
18. Confirm templates were NOT modified.

---

## 2026-04-30 — Sprint 20: Structured Draft Decision Controls V1

**Schema fields confirmed before coding:**
- `proposed_actions.status` — `Enums['proposed_action_status']` — `approved`, `rejected`, `clarification_needed` all valid ✓
- `proposed_actions.approved_by: string | null` — used for `approved` decision (no `reviewed_by_id` field; schema separates approved_by and rejected_by) ✓
- `proposed_actions.approved_at: string | null` — used for `approved` decision ✓
- `proposed_actions.rejected_by: string | null` — used for `rejected` decision ✓
- `proposed_actions.rejected_at: string | null` — used for `rejected` decision ✓
- `proposed_actions.rejection_reason: string | null` — used for `rejected` decision notes ✓
- `proposed_actions.reviewer_notes: string | null` — used for all decisions (note: field is `reviewer_notes`, not `review_notes`; no `reviewed_at` column exists) ✓
- `proposed_actions.proposed_payload` — never modified by this action ✓
- No `reviewed_by_id` or `reviewed_at` columns exist; `approved_by`/`rejected_by` are the reviewer tracking fields ✓
- No migrations needed ✓

**Files created:**
- `src/app/director/review/actions.ts` — server action `updateStructuredDraftDecisionAction`. Security chain: assertNotPreviewMode → auth → academy_id from profile → active academy membership (academy_director or head_coach only) → fetch proposed_action by ID → verify academy_id match → verify target_module = session_recap_structuring → verify status = pending_review → validate decision value → validate reviewer_notes max 1000 chars → update proposed_actions (status + reviewer tracking fields only). Never modifies proposed_payload, player profiles, attendance, parent messages, coach_observations, player priorities, or any table other than proposed_actions.
- `src/app/director/review/DraftDecisionControls.tsx` — `'use client'` component. Three decision buttons: Approve for Application (green), Needs Clarification (orange), Reject Draft (red). Optional decision note textarea (max 1000 chars, char counter appears at 800+). Governance banner: "Approving does not apply changes yet. It only marks this draft as ready for a future application step." On success: green confirmation banner + `router.refresh()` to remove card from pending queue. Error display if action fails. `useTransition` for pending state; buttons disabled while pending.

**Files modified:**
- `src/app/director/review/StructuredDraftCard.tsx` — imported `DraftDecisionControls`; added `<DraftDecisionControls proposedActionId={draft.id} />` at the bottom of CardContent, after the parent-safe candidate count.
- `docs/CHANGELOG.md` — this entry

**Decision → DB write strategy:**
| Decision | Columns written |
|---|---|
| `approved` | `status='approved'`, `approved_by=user.id`, `approved_at=now()`, `reviewer_notes` (if provided) |
| `rejected` | `status='rejected'`, `rejected_by=user.id`, `rejected_at=now()`, `rejection_reason` (if provided), `reviewer_notes` (if provided) |
| `clarification_needed` | `status='clarification_needed'`, `reviewer_notes` (if provided) |

No other columns touched. `proposed_payload` never modified. Only `proposed_actions` written.

**Security checks:**
- `assertNotPreviewMode()` — writes blocked in preview
- Auth required (no user → early return)
- `academy_id` resolved from authenticated profile — never trusted from client
- `academy_director` or `head_coach` active membership required
- Proposed action verified to exist and belong to same academy
- `target_module` verified = `session_recap_structuring`
- `status` verified = `pending_review` before allowing decision (idempotency guard)
- `decision` value validated against allowed enum
- `reviewer_notes` validated max 1000 chars
- No service role; no RLS bypass
- Double `.eq('academy_id', academyId)` on the update call

**After decision:**
- Card disappears from `/director/review` on next render (query filters `status = pending_review`)
- `router.refresh()` triggers server re-render immediately
- Empty state appears if no pending drafts remain

**What was NOT built:**
- Apply approved drafts to player profiles
- Apply approved drafts to attendance
- Create parent messages
- Create coach_observations from draft
- Update player priorities from draft
- Director intelligence feed writes
- Batch approve / batch reject
- Edit draft content
- Clarification workflow messaging
- Rejected draft history page
- Parent-safe message creation or sending
- Notifications
- AI API integration
- Voice transcription
- Audio upload

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure at least one `proposed_actions` row exists with `target_module = 'session_recap_structuring'` and `status = 'pending_review'`.
2. Open `/director/review`.
3. Confirm each draft card shows decision controls: Approve for Application, Needs Clarification, Reject Draft.
4. Confirm governance banner is visible: "Approving does not apply changes yet…"
5. Add a decision note in the textarea.
6. Click "Needs Clarification" on one draft.
7. Confirm green "Decision recorded. Refreshing queue…" appears.
8. Confirm the card disappears from the queue after refresh.
9. In Supabase: confirm `proposed_actions.status = 'clarification_needed'` and `reviewer_notes` saved.
10. Click "Approve for Application" on another draft.
11. Confirm card disappears. In Supabase: confirm `status = 'approved'`, `approved_by = user.id`, `approved_at` set.
12. Confirm `proposed_payload` was NOT modified.
13. Confirm no player profile, attendance, coach_observation, parent message, or player priority rows changed.
14. Confirm no template rows changed.
15. If all cards reviewed, confirm empty state appears.

---

## 2026-04-30 — Sprint 19: Structured Draft Review Queue V1

**Schema fields confirmed before coding:**
- `proposed_actions.id` — `string` ✓
- `proposed_actions.academy_id` — `string` ✓
- `proposed_actions.status` — `Enums['proposed_action_status']` — `'pending_review'` is a valid value ✓
- `proposed_actions.target_module` — `string` — filterable to `'session_recap_structuring'` ✓
- `proposed_actions.target_object_id` — `string | null` — holds session UUID ✓
- `proposed_actions.target_object_type` — `string | null` — `'session'` (informational only) ✓
- `proposed_actions.proposed_payload` — `Json` — holds `StructuredDraftPayload`; `draft_type` checked after fetch ✓
- `proposed_actions.created_at` — `string` ✓
- `proposed_actions.proposed_by_id` — `string` — FK to profiles ✓
- `proposed_actions.voice_command_id` — `string` (NOT NULL FK — Sprint 18 creates voice_commands row) ✓
- `sessions.id`, `sessions.name`, `sessions.scheduled_date` — confirmed ✓
- `profiles.id`, `profiles.display_name` — confirmed (no `full_name` on profiles) ✓
- `academy_memberships.profile_id`, `academy_memberships.role` (`user_role` enum), `academy_memberships.is_active` — confirmed ✓
- `user_role` enum: `academy_director | head_coach | coach | player | parent` ✓
- `proposed_action_status` enum: `pending_review | clarification_needed | approved | modified | rejected | executed | failed | expired` ✓
- No migrations needed — all required tables and columns exist ✓

**Files created:**
- `src/app/director/review/page.tsx` — Server Component. Security chain: auth → academy_id from profile → active membership check (academy_director or head_coach) → query proposed_actions by academy_id + status=pending_review + target_module=session_recap_structuring → post-fetch filter to draft_type=session_recap_structuring_v1 → batch-fetch session names/dates → batch-fetch proposer display_names → render StructuredDraftCard list. Empty state if no pending drafts. Never mutates any table.
- `src/app/director/review/StructuredDraftCard.tsx` — Server Component card. Exports `EnrichedDraftItem` interface and `StructuredDraftCard` component. Displays: draft label, session name/date, proposer name, created timestamp, safety banner, 4-count summary grid (detected players / attendance mentions / observation drafts / parent-safe drafts), director summary preview (3-line clamp), detected player chips, attendance mention rows with status colors, player observation previews (2-line clamp), parent-safe candidate count with note, link to source session detail.

**Files modified:**
- `src/components/nav/SidebarNav.tsx` — added `ClipboardList` import and `Review Queue` → `/director/review` nav item between Sessions and Competition in primary nav.
- `docs/CHANGELOG.md` — this entry

**Review queue behavior:**
1. Director opens `/director/review`
2. Auth and academy_director/head_coach membership verified server-side
3. All proposed_actions with status=pending_review and target_module=session_recap_structuring for this academy are fetched
4. Each card shows: session context (name, date), proposer name, created timestamp, draft count summary, director summary preview, detected players, attendance mentions, observation drafts preview, parent-safe draft count
5. "View Session" link on each card navigates to `/director/sessions/[sessionId]` for full session detail
6. Empty state message if no pending drafts exist yet
7. Sidebar nav shows "Review Queue" link with ClipboardList icon between Sessions and Competition

**Database read strategy:**
- Sequential queries per AI_BACKEND_RULES.md rule 5
- `rawDb = supabase as any` for proposed_actions query (avoids TS2589 — same pattern as session detail page)
- proposed_actions scoped to academy_id + status + target_module in DB query
- draft_type filter applied in memory after fetch (JSON field — not DB-filterable)
- Session info batch-fetched by target_object_id IN clause
- Proposer names batch-fetched by proposed_by_id IN clause
- All session/profile reads verified against academy_id (sessions: .eq('academy_id', academyId))

**Security checks:**
- Auth required (no user → early return)
- academy_id resolved from authenticated profile — never trusted from client
- academy_director or head_coach active membership verified before any data is shown
- proposed_actions query always includes .eq('academy_id', academyId) — no cross-academy reads
- sessions batch-fetch also filtered by .eq('academy_id', academyId)
- No service role; no RLS bypass

**What was not built:**
- Approve/apply draft button
- Reject/dismiss draft
- Edit draft
- Player profile updates from draft
- Attendance mutation from draft
- Parent-safe message creation or sending
- Coach observation creation
- Player priority updates
- Director intelligence feed writes
- Batch actions on multiple drafts
- Draft notifications or badges in real-time
- Analytics on draft processing rates
- AI API integration
- Voice transcription
- Audio upload

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure Sprint 18 has created at least one proposed_actions row with status=pending_review.
2. Open `/director/review`.
3. Confirm pending structured drafts appear as cards.
4. Confirm each card shows session name, session date, proposer name, 4-count grid, director summary preview, and safety banner.
5. Click "View Session" link — confirm navigates to `/director/sessions/[sessionId]`.
6. Confirm `/director/sessions/[sessionId]` still shows its own structured draft view (unchanged).
7. Confirm no player profiles changed.
8. Confirm no attendance changed.
9. Confirm no parent messages were created.
10. Confirm no proposed_actions status changed (still pending_review).
11. Confirm "Review Queue" link appears in sidebar nav between Sessions and Competition.
12. Confirm empty state message appears if no pending drafts exist.

---

## 2026-04-30 — Sprint 17: Coach Session Recap MVP

**Schema fields confirmed before coding:**
- `voice_notes` table (migration 010) — confirmed suitable for session-level recap:
  - `session_id UUID REFERENCES sessions(id)` — nullable, links recap to session ✓
  - `author_id UUID REFERENCES profiles(id)` — coach who wrote it ✓
  - `academy_id UUID NOT NULL` — multi-tenant boundary ✓
  - `raw_input TEXT NOT NULL` — stores typed recap text ✓
  - `transcript TEXT` — same as raw_input for V1 typed input ✓
  - `player_id UUID` — nullable; NULL = session-level (not player-specific) ✓
  - `processing_status TEXT DEFAULT 'pending'` — `'pending'` = raw, awaiting AI structuring ✓
  - `audio_path TEXT` — NULL for V1; field exists for V2 voice integration ✓
  - `parsed_observation_id UUID` — NULL until AI structures the recap (next sprint) ✓
  - RLS: `auth_is_staff()` covers coaches, head_coaches, directors ✓
- `coach_observations` — NOT used: `player_id NOT NULL` makes it unsuitable for session-level recaps (requires a specific player); used for per-player observations post-AI-parsing
- `sessions.session_notes` — NOT used: already used for execution notes during the session; different semantic
- No migration needed — `voice_notes` already exists and supports session_id + player_id=NULL pattern

**Files created:**
- `src/app/coach/sessions/[sessionId]/SessionRecapPanel.tsx` — `'use client'` component. Shows lightweight session context (session name, exercises completed count, attendance summary). Textarea with placeholder example. Character count (0/5,000). Voice-ready copy: "Voice capture will be added later. For now, type the recap the same way you would say it after class." Save Recap button (disabled when empty, useTransition for pending state). Success message on save: "Recap saved. Next sprint will structure this into attendance context, session actuals, player observations, and director updates for review." Error display with AlertCircle icon.
- `src/app/director/sessions/[sessionId]/SessionRecapSummary.tsx` — Server-renderable display component. Accepts `RecapEntry[]`. Empty state: "No coach recap recorded yet." Warning banner: "Raw coach recap — not yet AI-structured or parent-safe." Renders each recap with timestamp and whitespace-preserved text. Most recent first (sorted by caller).

**Files modified:**
- `src/app/coach/sessions/[sessionId]/actions.ts` — Added `SaveSessionRecapInput`, `SaveSessionRecapResult` interfaces and `saveSessionRecapAction` server action. Security chain: assertNotPreviewMode → auth → academy_id from profile → session ownership verified (academy_id match) → coach access check (session.coach_id === user or active membership in [coach, head_coach, academy_director]) → validate recap text (non-empty, max 5,000 chars) → insert voice_notes row (player_id=null, processing_status='pending', transcript=raw_input). Never updates templates, player profiles, player priorities, parent messages, or proposed_actions.
- `src/app/coach/sessions/[sessionId]/page.tsx` — Added step 6: fetch most recent session-level voice_note (player_id IS NULL, ordered by created_at DESC, limit 1, maybeSingle) to pre-populate recap textarea. Compute context: totalExercises, completedCount (from DB state), attendanceSummary ("N/M present" or null). Render `<SessionRecapPanel>` after the execution blocks section (always visible regardless of whether session has blocks).
- `src/app/director/sessions/[sessionId]/page.tsx` — Added step 9: fetch voice_notes for this session (player_id IS NULL, ordered by created_at DESC, limit 5). Added "COACH RECAP" section at the bottom of the page (after ROSTER & ATTENDANCE) with `<SessionRecapSummary>`. Read-only for director.
- `docs/CHANGELOG.md` — this entry

**Coach recap behavior:**
1. Open `/coach/sessions/[sessionId]`
2. Scroll to SESSION RECAP section (below execution blocks and attendance)
3. Session context shows: session name, exercises completed, attendance summary
4. Textarea pre-populated with most recent saved recap (empty on first visit)
5. Type recap text → Save Recap → success message with AI-structuring future hint
6. Refresh → textarea pre-populated with most recently saved recap

**Director recap visibility:**
1. Open `/director/sessions/[sessionId]`
2. Scroll to COACH RECAP section (below ROSTER & ATTENDANCE)
3. If coach has saved recaps: orange warning banner + recap text with timestamps (most recent first)
4. If no recap yet: "No coach recap recorded yet." empty state

**Database write strategy:**
- Each "Save Recap" inserts a NEW row in `voice_notes` (natural history of recap iterations)
- On page load: most recent recap pre-populates the textarea (fetch by session_id + player_id IS NULL + ORDER BY created_at DESC LIMIT 1)
- Director shows up to 5 most recent recaps
- Only table written: `voice_notes`
- Columns set: `academy_id`, `author_id`, `session_id`, `raw_input`, `transcript` (same as raw_input), `processing_status: 'pending'`
- `player_id` omitted (null) — session-level, not player-specific
- `audio_path` omitted (null) — V1 typed only
- `parsed_observation_id` omitted (null) — set later by AI structuring sprint

**Security checks:**
- `assertNotPreviewMode()` — writes blocked in preview
- Auth required
- `academy_id` resolved from authenticated profile (never trusted from client)
- Session verified against academy_id before write
- Coach access: session.coach_id === user.id OR active membership in [coach, head_coach, academy_director]
- Recap text validated server-side: non-empty, max 5,000 characters
- No RLS bypass; no service role

**What was not built:**
- AI extraction or structuring of recap text
- Player-specific parsed observations from recap
- Parent-safe summaries
- Director intelligence feed updates
- Player profile or player priority updates
- Automatic group recommendations
- Coach incentive/score dashboard
- Voice transcription integration (ElevenLabs, Whisper, browser recording)
- File/audio upload
- Author name display on director recap view (deferred — would require profiles join)

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure a generated session exists.
2. Open `/coach/sessions/[sessionId]`.
3. Scroll to SESSION RECAP section at the bottom.
4. Confirm voice-ready copy is visible.
5. Type: "Sarah was absent. Maria was present. We skipped the speed block and spent extra time on forehand grip and preparation. Maria improved when cued to set the racket earlier."
6. Click Save Recap — confirm green success message with next-sprint note.
7. Refresh page — confirm recap text persists in textarea.
8. Open `/director/sessions/[sessionId]`.
9. Scroll to COACH RECAP section — confirm raw recap appears with orange warning banner and timestamp.
10. Confirm no player profile, parent message, template, player priority, or proposed_action rows were created.

---

## 2026-04-30 — Sprint 16: Session Group Assignment V1

**Schema fields confirmed before coding:**
- `sessions.group_id` — `string | null`, present in Row/Insert/Update ✓ — supports update
- `sessions.academy_id` — `string` ✓
- `groups.id`, `groups.name`, `groups.academy_id`, `groups.is_active: boolean` ✓ — filterable by academy_id and is_active
- `group_memberships.group_id`, `group_memberships.player_id`, `group_memberships.is_current`, `group_memberships.academy_id` ✓ — membership counts readable
- `academy_memberships.role` — enum `academy_director | head_coach | coach | player | parent` ✓
- No migrations needed — all required fields existed from Sprint 15

**Files created:**
- `src/app/director/sessions/[sessionId]/actions.ts` — `assignGroupToSessionAction` server action. Security chain: assertNotPreviewMode → auth → academy_id from profile → academy_director/head_coach membership required → session ownership verified → group verified (same academy, is_active=true) → update sessions.group_id only. Never touches templates, group_memberships, players, attendance, or player profiles.
- `src/app/director/sessions/[sessionId]/GroupAssignmentPanel.tsx` — `'use client'` component. Shows current group if assigned, dropdown of active groups with member counts, Save Group Assignment button. Disabled until a different group is selected. Success/error inline feedback. Empty state if no active groups.

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — added `GroupAssignmentPanel` import; added sequential queries for active groups (by academy_id + is_active) and their member counts (batch, single query); inserted GROUP ASSIGNMENT section (SectionHeader + Card + GroupAssignmentPanel) between session meta and blocks; updated empty-state copy for no-group roster to reference the assignment panel above.
- `src/app/director/sessions/page.tsx` — added `group_id` to session select; added batch group name fetch (step 5); updated session card to show group name or "No group" label.
- `docs/CHANGELOG.md` — this entry

**Director group assignment behavior:**
1. Open `/director/sessions/[sessionId]`
2. GROUP ASSIGNMENT section appears with dropdown of active groups (each shows member count)
3. If already assigned, current group name shown above dropdown
4. Select a group → Save Group Assignment button activates
5. On save: success message "Group assigned. Refresh to see the updated roster."
6. After refresh: ROSTER & ATTENDANCE section populates from group_memberships

**Database write strategy:**
- Single `UPDATE sessions SET group_id = ? WHERE id = ? AND academy_id = ?`
- Only column updated: `sessions.group_id`
- No other tables written

**Security checks:**
- `assertNotPreviewMode()` — writes blocked in preview
- Auth required
- `academy_id` resolved from authenticated profile (never trusted from client)
- Caller must be `academy_director` or `head_coach` in this academy (active membership)
- Session verified against academy_id before write
- Group verified against same academy_id and is_active=true before write
- No RLS bypass; no service role

**What was not built:**
- Group builder / group creation UI
- Group scheduling
- Manual player-to-session assignment (no group)
- Attendance analytics
- Player profile updates from attendance
- Voice group assignment
- Automatic group recommendations
- CSV import

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure a generated session exists.
2. Open `/director/sessions/[sessionId]` — GROUP ASSIGNMENT section appears.
3. Confirm current group state shown (or blank if unassigned).
4. Select an active group from dropdown.
5. Click Save Group Assignment — success message appears.
6. Refresh page — group assignment persisted; ROSTER & ATTENDANCE shows players if group has current members.
7. Open `/coach/sessions/[sessionId]` — Attendance card shows group roster.
8. Mark attendance and save — confirm no templates, player profiles, or group membership rows changed.
9. Check `/director/sessions` list — group name (or "No group") shown on each session card.

---

## 2026-04-30 — Sprint 15: Session Attendance + Player Roster V1

**Schema findings confirmed before coding:**
- `session_attendance` ✓ — `id, session_id, player_id, status TEXT CHECK ('present','absent','late','excused'), notes, marked_by, marked_at`, `UNIQUE(session_id, player_id)`, RLS via sessions.academy_id join
- `sessions.group_id` ✓ — nullable; currently null for template-generated sessions
- `group_memberships` ✓ — `player_id, group_id, is_current (bool), academy_id`
- `groups` ✓ — `id, name, academy_id, is_active`
- `players` ✓ — `id, full_name, first_name, last_name, academy_id`
- No TS enum for attendance status — string union `'present' | 'absent' | 'late' | 'excused'` used
- No migrations needed

**Roster source logic:**
- `session.group_id` set → roster from `group_memberships WHERE group_id=X AND is_current=true AND academy_id=X` → joined with `players`
- `session.group_id` null → empty roster with explanation (template-generated sessions do not assign a group yet)

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — added `group_id` to session select; sequential roster fetch (groups → group_memberships → players → session_attendance); read-only Roster & Attendance section: group name, present/absent/late/excused/unrecorded counts, per-player AttendancePill; empty states for no group_id or no members
- `src/app/coach/sessions/[sessionId]/page.tsx` — added `group_id` to session select; exported `RosterPlayer` interface; sequential roster fetch (group_memberships → players → session_attendance); roster + existing attendance passed to CoachSessionExecutionClient; imported saveAttendanceAction
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` — added `roster: RosterPlayer[]` and `saveAttendanceAction` props; attendance state (`attendanceMap` keyed by player_id, initialized from currentStatus); `isAttendancePending` / `attendanceResult` states; `markAttendance()` handler; `handleSaveAttendance()` handler (filters unset players, calls saveAttendanceAction); Attendance card rendered above execution blocks with per-player P/A/L/E buttons, result feedback; `attendanceActiveClass()` helper
- `src/app/coach/sessions/[sessionId]/actions.ts` — added `AttendanceUpdate`, `SaveAttendanceInput`, `SaveAttendanceResult` interfaces; added `saveAttendanceAction` function
- `docs/CHANGELOG.md` — this entry

**Security chain (saveAttendanceAction):**
- `assertNotPreviewMode()` guard
- Auth required
- `academy_id` resolved from authenticated profile (never trusted from client)
- Session must belong to coach's academy
- Coach access: either `session.coach_id === user.id` or active academy membership with allowed role
- `session.group_id` fetched from DB (never from client input)
- Valid player IDs fetched from `group_memberships` (is_current=true, matching group_id + academy_id)
- All submitted player IDs verified against valid set before any write
- Statuses server-validated against `('present','absent','late','excused')` (DB CHECK also enforces)
- Sequential upserts (per AI_BACKEND_RULES #5) — `UNIQUE(session_id, player_id)` ensures safe insert/update
- Only `session_attendance` updated — templates, player profiles, development priorities never touched

**What was not built (deferred):**
- Player-to-session manual assignment without a group (requires group_id or dedicated session_players table)
- Group builder / group scheduling
- Player profile development updates from attendance
- Voice recap, AI note structuring
- Parent messages
- Attendance analytics dashboard
- CSV import

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure a generated session exists.
2. Open `/director/sessions/[sessionId]` — Roster & Attendance section appears at bottom. If session has no group, shows "No group assigned" empty state.
3. If session has group_id: group name, present/absent/late/excused counts, and per-player pills render.
4. Open `/coach/sessions/[sessionId]` — Attendance card appears above exercise blocks with P/A/L/E buttons per player (or empty state if no group).
5. Mark one player Present, one Absent, one Late — click Save Attendance. Confirm green success banner.
6. Refresh page — attendance persists. Director view reflects changes.
7. Confirm no template table rows changed (check templates, template_blocks, template_block_exercises).
8. Confirm no player development profile updates were made.

---

## 2026-04-30 — Sprint 14: Director Session Viewer + Coach Session Execution V1

**Schema findings confirmed before coding:**
- `sessions`: status enum `planned | in_progress | completed | cancelled` ✓, `session_notes` ✓
- `session_blocks`: no completion/status field — block-level partial/skipped deferred, UI copy added
- `session_block_exercises`: `completed` (boolean) ✓, `notes` ✓

**Files created:**
- `src/app/director/sessions/page.tsx` — Director sessions list. Fetches sessions for academy (newest first). Sequential batch queries: profiles for coach display names, templates for template names, session_blocks for block counts. Cards link to detail page. Empty state if no sessions.
- `src/app/director/sessions/[sessionId]/page.tsx` — Read-only director session detail. Shows: session name/date/time/duration, coach, status, source template, session notes, progress (completed exercises / total), ordered session blocks with ordered exercises, completion dots, exercise notes. rawDb cast for nested select (session_block_exercises → exercises). Cross-academy guard: session verified against academy_id. Planned-snapshot notice banner.
- `src/app/coach/sessions/[sessionId]/page.tsx` — Coach session execution server page. Fetches session (academy_id verified), template name, ordered blocks, ordered exercises with names (rawDb cast). Passes data to CoachSessionExecutionClient.
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` — Client component. Exercise checkboxes (completed toggle), per-exercise notes textareas, session status selector (4 statuses), session notes textarea, Save Execution button with useTransition. Progress counter (N / total). Inline block-level deferral notice. Success/error result display.
- `src/app/coach/sessions/[sessionId]/actions.ts` — Server action `saveSessionExecutionAction`. Security chain: assertNotPreviewMode → auth → academy_id from profile → session ownership via academy_id → coach access check (session.coach_id === user or active membership in [coach, head_coach, academy_director]) → session status+notes update → session_blocks fetch to build valid block ID set → session_block_exercises fetch to build valid exercise ID set → reject any submitted exercise ID not in set → sequential per-exercise updates (completed, notes). Never touches template tables.

**Files modified:**
- `src/app/coach/sessions/page.tsx` — Added `Link` import and `formatDate`; sessions in Today section now link to `/coach/sessions/[id]`; added Upcoming section (sessions after today, ordered ascending, limit 10); extracted `SessionRow` component.
- `docs/CHANGELOG.md` — this entry

**Security chain (coach actions):**
- `assertNotPreviewMode()` guard
- Auth required
- `academy_id` resolved from authenticated profile (never trusted from client)
- Session must belong to coach's academy
- Coach access: either `session.coach_id === user.id` or active academy membership with allowed role
- Exercise IDs validated against this session's blocks before any update
- Sequential updates — no Promise.all
- Only session-layer tables updated: `sessions`, `session_block_exercises`
- `template_blocks`, `template_block_exercises`, `templates` never touched

**What was not built (deferred):**
- Block-level partial/skipped status (not in schema — UI copy added)
- Attendance, player roster, group scheduling
- Voice recap, AI note structuring
- Parent messages
- Exercise swapping / session override reordering
- Session generation from curriculum spine
- Director write on session detail

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Generate a session from a fitness template if none exist.
2. Open `/director/sessions` — session appears in list with date, coach, template name, block count.
3. Click session → `/director/sessions/[sessionId]` — blocks and exercises display in order; completion dots shown; planned-snapshot notice visible.
4. Open `/coach/sessions` — today's session appears with → link; upcoming section shows future sessions.
5. Click session → `/coach/sessions/[sessionId]` — blocks and exercises with checkboxes; session status buttons; notes textareas; Save Execution button.
6. Check one exercise, add a note, change status to in_progress, click Save Execution.
7. Refresh page — confirm changes persisted.
8. Open `/director/sessions/[sessionId]` — confirm execution changes reflected (dot filled, note shown).
9. Open the source fitness template → confirm template blocks unchanged.

---

Records completed build milestones in chronological order.
Update this file at the end of every completed module.

---

## 2026-04-30 — Sprint 13: Generate Session from Template

Added "Generate Session" to the fitness template detail page. Directors can now turn an official fitness template into a planned session snapshot. The master template is never mutated.

**Files created:**
- `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts` — Server action `generateSessionFromTemplateAction`. Security chain: assertNotPreviewMode → auth → academy_id → template ownership → coach membership validation → template blocks fetch → reject if no blocks → template exercises fetch → insert session row (status=planned, template_id preserved) → insert session_blocks sequentially (template_block_id preserved for source tracking, is_override=false) → collect inserted block IDs → insert session_block_exercises sequentially. Returns `{ sessionId, error }`. Never touches templates/template_blocks/template_block_exercises.
- `src/app/director/fitness/templates/[templateId]/GenerateSessionPanel.tsx` — Client component. States: closed → form → generating → success/error. Form fields: session name (defaults from template name), session date (required), coach select (academy head_coach/coach profiles; falls back to director with label if none), optional notes. Success state shows generated session ID and explains that `/director/sessions` detail view is a future sprint. Error state shows inline message with AlertCircle icon.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Fetches active coaches (two sequential queries: `academy_memberships` filtered by role in [coach, head_coach] → `profiles` for display_name); adds `display_name` to initial profile select; renders `<GenerateSessionPanel>` between `<PageHeader>` and `<TemplateMeta>`.
- `docs/CHANGELOG.md` — this entry

**Snapshot strategy:**
- `sessions.template_id` → source template reference preserved
- `session_blocks.template_block_id` → source template block reference preserved
- Block order, exercise order, durations, names all copied at generation time
- Future template edits do not affect already-generated sessions (snapshot is independent)

**Security constraints:**
- `assertNotPreviewMode()` guard on server action
- Auth required; academy_id resolved from authenticated profile
- Template ownership verified via `academy_id` match before any read
- Coach validated as active academy member (director's own profile passes this check)
- Blocks must exist before generation is allowed
- Sequential inserts — no Promise.all (per AI_BACKEND_RULES #5)
- No service role; no RLS bypass; no template table mutations

**Not built (deferred):**
- `/director/sessions` route and session detail view
- Coach execution / live session runner
- Attendance, player roster, group scheduling
- Session overrides / coach-layer changes
- Voice recap, AI note structuring, parent messages
- Session completion recording

**TypeScript:** clean (`npx tsc --noEmit` — no output)

---

## 2026-04-30 — Sprint 12: Fitness Template Builder Save Verification + Edit Hardening

Hardened the Sprint 11 Fitness Template Builder. No new product features — reliability and security fixes only.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/actions.ts` — Six hardening additions:
  (1) Reject empty/missing IDs before any DB query.
  (2) Reject duplicate block IDs in submitted payload.
  (3) Reject duplicate exercise IDs in submitted payload.
  (4) Reject negative duration values at server level (client also validates, now double-checked).
  (5) Fix exercise block_id verification — now fetches `id, block_id` from DB and verifies each submitted exercise's `block_id` matches the actual DB record. Previous check only verified the exercise existed in *any* submitted block; a wrong submitted `block_id` would pass verification but cause the DB update to silently match no rows (silent data loss).
  (6) Add server-side `order_index` normalization — sort blocks and exercises (per block) by submitted `order_index`, then reassign as clean 0-based sequential integers. Ensures no gaps, no duplicates, no negative values written to DB regardless of client input. Critical for future voice command compatibility.
- `src/app/director/fitness/templates/[templateId]/TemplateEditor.tsx` — Three hardening additions:
  (1) `saveSuccess` state — shows "Template saved" with check icon after successful save, auto-clears after 3 seconds.
  (2) Master template warning — edit mode now shows: "Director edits update the official template. Coach changes during live sessions will be handled as session overrides and will not affect this master template." This is architecturally important to distinguish master-template writes from future coach session overrides.
  (3) `confirmedBlocks` and `editBlocks` initialized with `deepCopyBlocks` (lazy initializer) so they never share object references with `initialBlocks` props from the server.

**Constraints confirmed:**
- No migrations
- No npm install
- No service role
- No RLS bypass
- No new product features (no drag/drop, create, delete, publish, voice, session generation)
- TypeScript: clean (`npx tsc --noEmit` passes with no output)

---

## 2026-04-30 — Sprint 11: Fitness Template Builder V1 (Director Edit Mode)

Added director-only edit mode to the fitness template detail page. Directors can now reorder blocks, reorder exercises within blocks, and edit durations — all from the existing read-only viewer at `/director/fitness/templates/[templateId]`.

**Files created:**
- `src/app/director/fitness/templates/[templateId]/actions.ts` — Server action `saveTemplateEditsAction` with 5-step security chain (auth → academy_id → template ownership → block ID validation → exercise ID validation). Defines `TemplateOperation` type union aligned with future voice command pathway (`reorder_block`, `reorder_exercise`, `update_block_duration`, `update_exercise_duration`). Sequential per-row updates with double-lock `.eq('id') + .eq('template_id'/'block_id')`.
- `src/app/director/fitness/templates/[templateId]/TemplateEditor.tsx` — `'use client'` component managing read/edit mode toggle. Up/down chevron buttons for block and exercise reordering (no drag/drop — no library installed). Editable `<input type="number">` for `block.duration_min` (required) and `exercise.duration_min` (nullable). Save/Cancel controls with `useTransition` for pending state. Array position → `order_index` on save.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Builds `EditableBlock[]` shape from fetched data; renders `<TemplateEditor>` instead of static block cards; removed "Read-only" lock badge (mode indicator now lives in TemplateEditor).

**Constraints confirmed:**
- No migrations created
- No packages installed
- No service role used
- No RLS bypass
- No create/delete/publish/duplicate
- No voice UI
- TypeScript: clean (`npx tsc --noEmit` passes with no output)

## 2026-04-29 — Coach Workspace Navigation V1

Added safe, demo-ready shell pages for the three missing coach nav routes. Bottom nav is now fully navigable.

**Files created:**
- `src/app/coach/players/page.tsx` — async Server Component; calls `getCoachWorkspaceSummary`; renders assigned players only (filtered via `coach_group_assignments`); initials avatar + `full_name` + `group_name · level_label` + `player_status` badge; `EmptyState` fallback; no edit actions; no links to player profiles
- `src/app/coach/sessions/page.tsx` — async Server Component; calls `getCoachWorkspaceSummary`; renders today's sessions with name, `scheduled_time`, and status badge; `EmptyState` fallback; coming-soon footer (Session plans · Attendance · Group check-in)
- `src/app/coach/voice/page.tsx` — sync static Server Component; no Supabase imports; hero card + three disabled coming-soon tiles (Record Voice Note, Structure into Observation, Review Before Saving) + coach-review safety note; no `voice_notes` queried

**No files modified** beyond this changelog.

**Constraints confirmed:**
- No migrations created
- No schema changes
- No database.types.ts changes
- No middleware changes
- No preview mode logic changes
- No platform actions changed
- No server actions changed
- No backend helper changes (`coachWorkspace.ts` untouched)
- No layout changes (`coach/layout.tsx` untouched)
- No BottomTabBar changes
- No player or parent portal changes
- No service role / `getSupabaseAdmin` used
- No write actions added
- No `voice_notes` queried
- No AI drafts queried
- No fake data — real queries with `EmptyState` fallbacks; voice page is fully static
- `player_status` used (not `status`) — verified against `v_player_summary` in `database.types.ts`
- PreviewBanner inherited automatically from `coach/layout.tsx` on all three new routes
- BottomTabBar highlights correctly: Players/Sessions/Voice use `startsWith`, Home uses `exact: true`

TypeScript: clean.

**Manual test steps:**
1. `npm run dev`
2. Log in as platform user → `/platform`
3. Click "Preview as Coach" on any academy card → `/coach` loads with PreviewBanner
4. Click "Players" tab → `/coach/players` loads; Players tab highlighted; player list or empty state; no 404
5. Click "Sessions" tab → `/coach/sessions` loads; Sessions tab highlighted; today's sessions or empty state; no 404
6. Click "Voice" tab → `/coach/voice` loads; Voice tab highlighted; hero card + 3 tiles + safety note; no 404
7. Click "Home" tab → `/coach` loads; only Home tab highlighted (exact match)
8. Click "Exit Preview" → `/platform`
9. No runtime errors on any route

---

## 2026-04-29 — Platform Preview Mode Infrastructure (Phase 1B)

Enables platform users (platform_owner / platform_admin) to enter a read-only preview of any academy's portal UI, scoped to a chosen role. Writes are blocked in preview. Normal academy users are completely unaffected.

**Files created:**
- `src/lib/utils/previewMode.ts` — `PreviewRole` type, `PreviewContext` interface, `PREVIEW_COOKIE` constant; `parsePreviewCookie()` (pure, safe for Edge/middleware); `getPreviewContext()`, `isPreviewMode()`, `assertNotPreviewMode()` (Server Component / Server Action use only, via dynamic `import('next/headers')` to avoid Edge Runtime issues)
- `src/lib/actions/platform.ts` — `enterPreviewModeAction(academyId, role)`: authenticates user, verifies platform_roles row, validates role, reads academy name, sets httpOnly `ao_preview` cookie (sameSite strict, 8-hour maxAge, secure in production), redirects to correct portal; `exitPreviewModeAction()`: deletes cookie, redirects to /platform
- `src/components/platform/PreviewBanner.tsx` — async Server Component; reads preview context via `getPreviewContext()`; renders lime-accented banner with role, academy name, "Writes are disabled in preview." note, and Exit Preview form button; returns null when not in preview

**Files modified:**
- `src/middleware.ts` — platform user routing refactored: /platform still always accessible; root `/` still redirects to /platform; portal routes (director/coach/player/parent) now require a valid `ao_preview` cookie with matching role — no matching cookie → redirect to /platform; non-platform users are completely unaffected (their path is structurally separated and unchanged)
- `src/app/platform/page.tsx` — each academy card now has a "Preview Portal" section with 4 buttons (Director / Coach / Player / Parent); each button binds `enterPreviewModeAction` with the academy ID and role; "Preview Mode" removed from coming-soon module cards
- `src/app/director/layout.tsx` — `<PreviewBanner />` added above `{children}` inside `<main>`
- `src/app/coach/layout.tsx` — `<PreviewBanner />` added above `{children}` inside `<main>`
- `src/app/player/layout.tsx` — removed `'use client'` (layout has no hooks; BottomTabBar carries its own `'use client'`); `<PreviewBanner />` added above `{children}`
- `src/app/parent/layout.tsx` — `<PreviewBanner />` added above `{children}` inside `<main>`
- `src/lib/actions/notes.ts` — `await assertNotPreviewMode()` added as first line of `addObservationAction`, `updateDevelopmentSummaryAction`, `addVoiceNoteAction`; `generateNoteDraftAction` is NOT guarded (no DB write)
- `src/lib/actions/curriculum.ts` — `await assertNotPreviewMode()` added as first line of `assignCurriculumAction`, `evaluateAdvancementAction`
- `src/components/nav/PlatformNav.tsx` — "Preview Mode" removed from `COMING_SOON_ITEMS` (preview is now live in academy cards)

**Constraints confirmed:**
- No migrations created
- No schema changes
- No service role / `getSupabaseAdmin()` used
- `ao_preview` cookie only benefits platform users (middleware ignores it for non-platform users)
- Writes blocked in preview: `assertNotPreviewMode()` guards all 5 mutating server actions
- Normal director/coach/player/parent users are completely unchanged
- No coach/player/parent shell improvements built
- No fake data created
- No academy_memberships created or modified
- No database roles changed
- No RLS bypassed
- Cross-academy live data preview deferred (RLS still uses profiles.academy_id)

**Preview mode scope (Phase 1B):**
Preview shows the portal shell and any data the authenticated platform user's own Supabase session can read via normal RLS. It does not bypass RLS or show cross-academy private data. Full cross-academy data preview is deferred to a future approved RLS migration.

TypeScript: clean.

**Manual test steps:**
1. Log in as platform user → land on /platform
2. On an academy card, click "Director" → `ao_preview` cookie set → redirected to /director with PreviewBanner visible
3. Attempt "Assign Curriculum" or "Add Observation" → should throw "Writes are disabled in preview mode."
4. Click "Exit Preview" → cookie deleted → redirected to /platform
5. Repeat with Coach / Player / Parent roles — each shows correct PreviewBanner
6. Log in as a normal academy_director → /platform should redirect to /director; `ao_preview` cookie (if present) has no effect
7. As platform user with no preview cookie, manually visit /director → redirected to /platform

---

## 2026-04-29 — Multi-Tenant Access Foundation Phase 1A: Platform Role + Shell

Established the minimum safe platform-owner foundation. Angles / platform owner can now log in, be routed to `/platform`, and view all academy tenants read-only.

**Files created:**
- `supabase/migrations/040_platform_roles.sql` — `platform_roles` table (user_id → platform_owner | platform_admin); RLS: users see own active row only; additive SELECT policy on `academies` so platform users can list all tenants via anon key (no service role needed)
- `src/lib/backend/platform.ts` — two backend helpers: `getPlatformRole(db, userId)`, `getAllAcademies(db)`; rawDb cast for platform_roles (not yet in database.types.ts)
- `src/components/nav/PlatformNav.tsx` — fixed sidebar for /platform routes; shows "Angles Platform" brand + role badge; primary nav (Tenants); coming-soon items (Tenant Management, Consultant Access, Preview Mode, Billing, Global Templates); sign-out button
- `src/app/platform/layout.tsx` — Server Component; verifies platform role (redirects to /login if not found); renders PlatformNav + main content
- `src/app/platform/page.tsx` — Server Component; shows Platform Command Center header with role badge; academy tenant cards (name, slug, country, timezone, is_active badge, created date); coming-soon module cards; no player data, no private data

**Files modified:**
- `src/middleware.ts` — checks platform_roles BEFORE academy_memberships; /platform routes allow only platform users (others redirected to their academy home); root `/` redirects platform users to /platform; non-platform routes with no matching academy role redirect platform users back to /platform (e.g. a platform_owner also with academy_director membership can still access /director)
- `src/app/login/LoginForm.tsx` — checks platform_roles after successful auth; platform users immediately routed to /platform before academy membership check runs
- `docs/CHANGELOG.md` — this entry

**Constraints confirmed:**
- No preview mode built
- No consultant access built
- No write guards added (deferred to Phase 1B)
- No service role / `getSupabaseAdmin()` used in /platform routes — anon key + RLS only
- No player data, coach notes, voice notes, AI drafts, or private observations shown
- No modifications to profiles.academy_id, academy_memberships, database.types.ts, or any locked modules
- No schema changes beyond migration 040
- Existing /director, /coach, /player, /parent routing unchanged

**To activate:**
1. Apply migration 040 in Supabase Dashboard (SQL Editor)
2. Manually INSERT a row into `platform_roles` for the platform owner's auth.users UUID
3. Run `supabase gen types typescript` to update database.types.ts after migration

TypeScript: clean.

---

## 2026-04-28 — Guardrail and source-of-truth layer

Created the permanent Claude Code guardrail system before further feature work.

**Files created:**
- `CLAUDE.md` — root-level Claude session instructions, design system reference, architecture red lines
- `docs/AI_BACKEND_RULES.md` — backend safety rules (10 rules, backend file status table)
- `docs/CURRENT_BUILD_TARGET.md` — current build phase and step-by-step build order
- `docs/LOCKED_MODULES.md` — locked / in-progress / not-built module registry
- `docs/KNOWN_LIMITATIONS.md` — documented gaps, missing features, stale docs warnings
- `docs/MODULE_BUILD_PROCESS.md` — 8-step process for every future build task
- `docs/CHANGELOG.md` — this file

**No app functionality changed.**
**No backend files changed.**
**No frontend files changed.**

---

## 2026-04-27 — Backend stable, TypeScript clean

All backend files in `src/lib/backend/` compile without TypeScript errors.

Covered:
- `director.ts` — player profile data, recommendation overrides
- `players.ts` — player list, signals, priorities, recommendations, progress snapshots
- `curriculum.ts` — domain progress, assignment RPC, advancement evaluation RPC
- `assessments.ts` — create assessment, placement recommendations, finalize placement
- `sessions.ts` — session CRUD, session recommendations, attendance, outcomes
- `dashboard.ts` — priority queue, group summaries, reassessment pipeline
- `intelligence.ts` — behavior profiles, predictions, coaching messages
- `utr.ts` — UTR recording, history, insights
- `voice.ts` — voice command submission, proposed action approval/rejection/execution

TypeScript: clean.

---

## 2026-04-27 — Initial role-based app shell

Framework, auth, and layout shells committed.

- Next.js 14 App Router initialized
- Supabase Auth with email+password
- Middleware role routing: director → `/director`, coach → `/coach`, player → `/player`, parent → `/parent`
- Director sidebar layout (`SidebarNav`)
- Coach/Player/Parent bottom tab layout (`BottomTabBar`)
- Login page (`/login`) fully functional
- Signout API route (`/api/auth/signout`)
- Tailwind design system configured (dark base, lime accent)
- UI component library created: Card, MetricCard, ActionCard, StatusBadge, LevelBadge, ProgressBar, Avatar, EmptyState, LoadingSkeleton, SectionHeader, Modal, Tabs, Table, SearchFilterBar, DomainRing

---

## 2026-04-27 — Player Profile v0

First real feature page built at `/director/players/[playerId]`.

What works:
- Player header: name, initials avatar, level badge, advancement status, last evaluated date
- Curriculum grid: 8-domain skill progress (status, mastery %, blocked-by list)
- Player info sidebar: status, join date, DOB, notes
- Coach Focus sidebar: advancement evaluation button, domain summary counts, blocked-by list
- Assign curriculum Server Action
- Evaluate advancement Server Action
- Loading skeleton (`loading.tsx`)
- Empty state when no curriculum is assigned

Data: all real Supabase queries (no mock data).

Known gaps logged in `docs/KNOWN_LIMITATIONS.md`:
- No tab structure yet
- 3-column fixed layout not mobile-safe
- Back link points to stub dashboard (will fix after Players List is built)

TypeScript: clean.

---

## 2026-04-28 — Players List

Built the player directory at `/director/players` (Step 1 of Phase 1).

**Files created:**
- `src/app/director/players/page.tsx` — Server Component; fetches academy_id from profiles, calls `getPlayerSummaries()`, renders page header and client component
- `src/app/director/players/_components/PlayersDirectoryClient.tsx` — Client Component; search by name, filter by status (All / Active / Reassessment Due / On Hold / Pending), player rows with Avatar, StatusBadge, LevelBadge, last assessed date, next due date with overdue indicator, promotion-ready chip
- `src/app/director/players/loading.tsx` — Next.js skeleton; 8 SkeletonRows inside a Card

**No backend files changed.**
**No locked files changed.**
TypeScript: clean.

---

## 2026-04-28 — Player Profile responsive layout (Step 2)

Fixed the broken 3-column fixed layout at `/director/players/[playerId]`.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — replaced `grid-cols-[260px_1fr_260px]` with responsive `grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_240px]`; added `lg:col-span-2 xl:col-span-1` to Coach Focus column so it spans full width at `lg` and returns to a single column at `xl`; added `p-6` to page wrapper
- `src/components/player/PlayerProfileHeader.tsx` — fixed back link from `/director` → `/director/players`, label from `Dashboard` → `All Players`

**No backend files changed.**
**No locked files changed.**
TypeScript: clean.

---

## 2026-04-28 — Director layout sidebar offset fix

Fixed content rendering underneath the fixed sidebar on all `/director` routes.

**Files modified:**
- `src/app/director/layout.tsx` — added `ml-60` to `<main>` so content is offset 240px right, matching the fixed sidebar width. Single global fix; no per-page hacks needed.

**No backend files changed.**
**No locked files changed.**
**No player profile data logic changed.**
TypeScript: clean.

---

## 2026-04-28 — Director Dashboard V1

Built the command center at `/director` (Step 5 of Phase 1, built ahead of Steps 3–4 by explicit request).

**Files modified:**
- `src/app/director/page.tsx` — replaced 6-line stub with full Server Component dashboard

**Data fetched (sequential per AI_BACKEND_RULES):**
- `profiles` → `academy_id`
- `academies` → `name` (for header)
- `getPlayerSummaries()` → all 4 snapshot metrics + pending placement list
- `getAcademyPriorityQueue({ limit: 5 })` → priority panel

**Sections built:**
- Header: academy name label + "Command Center" H1 + today's date
- Snapshot metrics: Total Players / Active / Pending Placement / Needs Attention (all real data)
- Priority Queue card: top 5 priority items with urgency badge + primary action; empty state if none
- Pending Placement card: up to 5 pending players with status badge; empty state if none
- Module cards: Players (live, links to `/director/players`) + 5× Coming Soon (Curriculum, Sessions, Intelligence, Reports, Configuration)

**No backend files changed.**
**No locked files changed.**
**No fake numbers — all metrics derived from real Supabase queries.**
TypeScript: clean.

---

## 2026-04-29 — Player Profile tab structure (Step 3)

Added 5-tab workspace to the Player Profile at `/director/players/[playerId]`.

**Files created:**
- `src/app/director/players/[playerId]/_components/PlayerProfileTabs.tsx` — minimal Client Component; accepts 5 `ReactNode` slots; renders `Tabs` with `scrollable` TabsList and one `TabsContent` per tab

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — refactored layout from 3-column grid into 5 named slot variables passed to `PlayerProfileTabs`

**Tab breakdown:**
1. Overview — Player Info card + Coach Focus summary (domain counts, advancement status); no action button
2. Skill Path — EvaluateAdvancementButton + advancement eligible/blocked-by logic + CurriculumProgressGrid or PlayerCurriculumEmptyState
3. Competition — premium `EmptyState` placeholder; no fake data
4. Fitness / Load — premium `EmptyState` placeholder; no fake data
5. Notes — premium `EmptyState` placeholder; no fake data; prepares for Coach Notes + Voice Notes

**Architecture notes:**
- `page.tsx` remains a Server Component; all data fetching unchanged
- Server actions (`assignAction`, `evaluateAction`) remain bound in the Server Component and passed to child Client Components via slot content — no function references cross the Server → `PlayerProfileTabs` boundary
- Icons (`Trophy`, `Activity`, `MessageSquare`) are imported and rendered in `page.tsx` (Server Component) as part of slot JSX; no icon function references passed as props
- `TabsList scrollable` prop handles horizontal tab overflow on narrow viewports

**No backend files changed.**
**No Supabase files changed.**
**No locked modules changed.**
**No fake data added.**
TypeScript: clean.

---

## 2026-04-29 — Coach Notes Foundation (Phase 1)

Built the real Notes tab for coach-facing player development notes.

**Files created:**
- `supabase/migrations/039_player_development_summary.sql` — new `player_development_summary` table; full RLS (staff read/write, players/parents gated behind show_to_student/show_to_parent flags which default false)
- `src/lib/backend/notes.ts` — four backend helpers: `getCoachObservations`, `createCoachObservation`, `getPlayerDevelopmentSummary`, `upsertPlayerDevelopmentSummary`; uses `rawDb = db as any` for the new table (types will resolve after migration + `supabase gen types`)
- `src/lib/actions/notes.ts` — two server actions: `addObservationAction`, `updateDevelopmentSummaryAction`; authenticated, validated, revalidates player profile path
- `src/components/player/CoachObservationTimeline.tsx` — renders coach_observations for a player in reverse-chronological order; Internal badge when is_private; empty state
- `src/components/player/DevelopmentSummarySection.tsx` — read-only display of development summary; shows strengths, priorities, development focus, coach summary, student-facing preview with visibility labels
- `src/components/player/AddObservationForm.tsx` — client form; observation_type dropdown (all 8 existing values), content textarea, is_private toggle (defaults true/internal)
- `src/components/player/EditDevelopmentSummaryForm.tsx` — client form; newline-separated strengths/work-ons converted to arrays; visibility toggles rendered but disabled (future sprint gate)

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — replaced Notes tab placeholder with real UI; sequential data fetching for observations and development summary; bound server actions for forms

**Constraints confirmed:**
- No voice features built
- No AI structuring built
- No fake or hardcoded notes
- Coach-only notes not exposed to player or parent routes (RLS + show_to_student/show_to_parent default false)
- coach_observations schema untouched
- voice_notes schema untouched
- parent_updates schema untouched
- No locked modules modified

**Migration note:** Migration `039` must be applied and `supabase gen types typescript` run before deploying. The `player_development_summary` backend helpers use `rawDb = db as any` until types are regenerated.

TypeScript: clean.

---

## 2026-04-29 — Voice Note Capture MVP (transcript-first)

Added transcript-first voice note capture to the Notes tab.

**Files created:**
- `src/components/player/AddVoiceNoteForm.tsx` — client form; textarea for transcript (with device dictation microcopy), observation_type dropdown, is_private toggle (default true); follows AddObservationForm pattern with useTransition

**Files modified:**
- `src/lib/backend/notes.ts` — added `createVoiceNoteWithObservation()`: three sequential queries — insert voice_notes (processing_status=pending), insert coach_observations, update voice_notes.parsed_observation_id + processing_status=parsed
- `src/lib/actions/notes.ts` — added `addVoiceNoteAction()`: authenticates user, validates transcript and observation_type, calls createVoiceNoteWithObservation, revalidatePath
- `src/app/director/players/[playerId]/page.tsx` — imported AddVoiceNoteForm and addVoiceNoteAction; bound server action; added AddVoiceNoteForm below AddObservationForm in notesSlot

**Architecture constraints confirmed:**
- No migration created — voice_notes already existed in migration 010 and database.types.ts
- No schema changes — voice_notes, coach_observations, player_development_summary untouched
- No browser recording, audio upload, Supabase Storage, transcription, or AI structuring
- No voice command execution or proposed_actions pipeline
- Voice notes are staff-only (existing RLS); resulting observations default is_private=true
- No player or parent exposure

**Data flow:** transcript → voice_notes row (processing_status=parsed) → coach_observations row via parsed_observation_id → appears in CoachObservationTimeline immediately

TypeScript: clean.

---

## 2026-04-29 — AI Note Structuring MVP

Added coach-reviewed AI draft generation for player development summaries.

**Files created:**
- `src/lib/ai/structureCoachNote.ts` — Anthropic SDK call; `AIDraftResult` type; system prompt enforcing tennis coaching tone; JSON validation; safe error on missing API key
- `src/components/player/AIDraftPanel.tsx` — client component; note textarea; "Draft with AI" button with loading state; editable draft fields (strengths, work-ons, focus, coach summary, student summary); confidence badge; warnings display; overwrite warning with explicit confirmation gate when existing summary has content; "Apply Draft to Summary" form submission

**Files modified:**
- `src/lib/actions/notes.ts` — added `generateNoteDraftAction()` server action; authenticated; returns `GenerateDraftResult` (ok+draft or error string); does not write to database
- `src/app/director/players/[playerId]/page.tsx` — imported `AIDraftPanel`, `generateNoteDraftAction`; inserted `AIDraftPanel` in Notes tab between `DevelopmentSummarySection` and `EditDevelopmentSummaryForm`
- `package.json` / `package-lock.json` — added `@anthropic-ai/sdk`

**Constraints confirmed:**
- No migration created
- No schema changes (player_development_summary, coach_observations, voice_notes untouched)
- No AI output auto-saved — coach must click "Apply Draft to Summary"
- show_to_student and show_to_parent hardcoded false in apply form
- source set to 'ai_draft' on apply
- API key never exposed to client — call is server-side only
- Overwrite protection: if existing summary has content, a warning block appears and coach must click confirm before the apply form is shown
- Player and parent routes not modified
- No fake or hardcoded AI responses

TypeScript: clean.

---

## 2026-04-29 — Coach / Player / Parent Shell V1

Premium shell pages for all three non-director portals. Shell-only — no data queries, no private data exposure, no fake data.

**Files modified:**
- `src/app/coach/page.tsx` — Coach Hub shell: header with current date, Today's Sessions card (EmptyState + coming-soon footer), My Players + Recent Notes in sm:grid-cols-2 with "Soon" badges, 4 disabled Quick Action tiles (opacity-50 / cursor-not-allowed), On the Roadmap pills
- `src/app/player/page.tsx` — Player Home shell: "YOUR JOURNEY" header, motivating tagline, Today's Mission (lime accent), My Skills, Wins & Streaks, Messages cards (all EmptyState), Coming Soon pill row
- `src/app/parent/page.tsx` — Parent Home shell: "FAMILY PORTAL" header, Child's Progress (lime accent), Latest Coach Update, Session Consistency, Support at Home (static safe copy — no data), Messages & Updates cards

**Constraints confirmed:**
- No new files created
- No migrations
- No schema changes
- No database.types.ts changes
- No middleware changes
- No preview mode logic changes
- No platform action changes
- No server action changes
- No backend helper changes
- No layout changes
- No BottomTabBar changes
- No Supabase queries — all three pages are plain sync Server Components
- No async added to any page
- No private coach notes, AI drafts, voice transcripts, or internal summaries exposed to player or parent
- No fake data — all cards use EmptyState or safe static copy
- PreviewBanner continues rendering from layouts (untouched)

TypeScript: clean.

**Manual test steps:**
1. Log in as platform user → /platform loads
2. Click "Preview as Coach" on any academy card
   → /coach loads with PreviewBanner visible
   → Coach Hub header + today's date visible
   → Today's Sessions, My Players, Recent Notes, Quick Actions, Roadmap all visible
   → Bottom nav: Home / Players / Sessions / Voice — all render
   → No runtime errors
3. Click "Exit Preview" → /platform
4. Click "Preview as Player" on any academy card
   → /player loads with PreviewBanner visible
   → Player Home header + tagline visible
   → Today's Mission, My Skills, Wins & Streaks, Messages cards visible
   → Coming Soon pills visible
   → Bottom nav: Home / Progress / Wins / Messages — all render
   → No coach observations, notes, AI drafts, or voice transcripts visible
   → No runtime errors
5. Click "Exit Preview" → /platform
6. Click "Preview as Parent" on any academy card
   → /parent loads with PreviewBanner visible
   → Parent Home header visible
   → Child's Progress, Latest Coach Update, Session Consistency, Support at Home, Messages & Updates visible
   → No gamified player language, no coach observations, no internal notes
   → No runtime errors
7. Click "Exit Preview" → /platform

---

## 2026-04-29 — Coach Workspace Real Data V1

Replaced the static Coach Hub shell with real Supabase data. No fake data, no new schema, no service role usage.

**Files created:**
- `src/lib/backend/coachWorkspace.ts` — `getCoachWorkspaceSummary(db, userId)`: sequential RLS-respecting queries; fetches coach profile → active group assignments → assigned groups (v_group_summary) → assigned players (v_player_summary filtered by group IDs) → recent coach_observations (by coach, not voice_notes) → player name resolution → today's sessions. Returns typed `CoachWorkspaceSummary` with graceful empty fallback.

**Files modified:**
- `src/app/coach/page.tsx` — converted from static shell to async Server Component; calls `getCoachWorkspaceSummary`; Today's Sessions renders real session rows with status badge; My Players renders up to 5 assigned players with initials avatar and group/level detail; Recent Notes renders up to 5 recent coach_observations with type label, Internal badge, and truncated content; all sections fall back to `EmptyState` when no data.

**Constraints confirmed:**
- No migrations created
- No schema changes
- No database.types.ts changes
- No middleware changes
- No preview mode logic changes
- No platform actions changed
- No server actions changed
- No player page, parent page, or layout changes
- No BottomTabBar changes
- No service role / getSupabaseAdmin used
- No write actions added
- No voice_notes queried
- No AI drafts queried
- No fake data
- RLS not broadened
- Unassigned players not shown — players filtered only through coach's assigned group IDs via coach_group_assignments

TypeScript: clean.

**Manual test steps:**
1. `npm run dev`
2. Log in as platform user → /platform
3. Click "Preview as Coach" on an academy card
   → /coach loads with PreviewBanner visible
   → Today's Sessions: real sessions or empty state
   → My Players: real assigned players or empty state
   → Recent Notes: real coach_observations or empty state
4. Click "Exit Preview" → /platform

---

## Next build target

**Player Profile tab content** — fill Step 4 tabs with real backend data

See `docs/CURRENT_BUILD_TARGET.md` Step 4 for full specification.
