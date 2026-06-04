# Curriculum System Map Audit V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Scope:** All curriculum-related routes, components, modules, and data flows

---

## The Curriculum Operating Chain

```
curriculum_stages (DB)
↓ curriculum_levels (DB) 
↓ curriculum_gates (DB) — readiness criteria per level
↓ curriculum_drills (DB) — drills attached to levels
↓ curriculum_coach_language (DB) — coach observation language
↓ curriculum_competition_tracks (DB) — competition context
↓ curriculum_fitness_guidance (DB) — fitness specs
↓ curriculum_volume_guidance (DB) — session volume specs
↓ curriculum_content_items (DB) — content (drills, missions, badges, parent guidance...)
↓ curriculum_class_template_blocks (junction) → class templates
↓ templates → session_blocks → sessions
↓ coach delivery → session_attendance + wrap-up
↓ player_requirement_progress + player_evidence_records
↓ level_readiness_engine → director review → level advancement
↓ IDP (individual development plan) → parent/player/coach views
```

---

## 1. Curriculum Pages / Routes

### `/director/curriculum` (also accessible as `/director/curriculum/builder`)

**File:** `src/app/director/curriculum/page.tsx`
**Purpose:** Primary curriculum editor — shows 5-stage structure, level tree, health panel, and DONNA improvement context
**Role served:** `academy_director`
**Source of truth:** `curriculum_levels`, `curriculum_gates`, `curriculum_drills`, `curriculum_coach_language` via `getCurriculumExplorerData()`
**Related downstream:** templates, sessions, player profiles, IDP
**Current UX surface:**
- CONNECTIONS list (Player Profiles, Session Planning, Coach Notes, Parent/Player Progress)
- CurriculumStageInsightCard per stage (live `stage_goal` + level cards with gates)
- CurriculumLevelTree (expandable, level cards)
- CurriculumHealthPanel (coverage report A-F grade)
- CurriculumNodeDrawer (slides in when level card clicked — 12-tab editor)
- DonnaCurriculumContextPanel (activated by `?improve=[levelKey]` URL param)
- CurriculumDonnaRegistrar (registers curriculum context for DONNA)
- VoiceOverrideInputPanel (voice intake for curriculum ideas)

**DONNA integration:** DonnaCurriculumContextPanel loaded when `?improve=` param present. Uses `curriculumImprovementEngine`, `levelReadinessEngine`, `developmentPrioritiesEngine`, and `buildContextFirstSummary`.
**Gaps:** Coverage scoring excludes 5 of 8 dimensions (only gates/drills/coachCues scored — skills/assessment/missions/parentGuidance/badges excluded pending migration data). Curriculum bottleneck detection is BLOCKED (migrations 041-044 unapplied).

---

### `/director/curriculum/builder`

**File:** Multiple components: `CurriculumBuilderChangeQueue.tsx`, `CurriculumChangeQueue.tsx`
**Purpose:** Shows pending curriculum drafts (academy_curriculum_overrides with status pending_review/draft) and approval recovery notices
**Role served:** `academy_director`
**Source of truth:** `academy_curriculum_overrides` table
**DONNA integration:** None on this sub-view
**Gaps:** Approval of overrides calls `execute_curriculum_override()` RPC — this must be present in the live DB (migration 069)

---

### `/director/curriculum/academy-version`

**File:** `src/app/director/curriculum/academy-version/page.tsx`
**Purpose:** Shows curriculum override diffs — what changed from the global curriculum to the academy's version
**Role served:** `academy_director`
**Source of truth:** `academy_curriculum_versions`, `academy_curriculum_overrides`
**DONNA integration:** None
**Gaps:** Separate route from builder but related — should be a tab, not a separate page

---

### `/director/curriculum/learning`

**File:** `src/app/director/curriculum/learning/page.tsx`
**Purpose:** Director preview of curriculum learning modules by level/domain
**Role served:** `academy_director` (preview only)
**Source of truth:** `learningModules.ts` (in-memory — not persisted to DB)
**DONNA integration:** None
**Gaps:** Modules are not persisted. Players cannot see them. Director-preview only. Not connected to player portal.

---

## 2. Curriculum Library Layer (`src/lib/curriculum/`)

### `visualMapModel.ts`
**Purpose:** Type definitions for the 5-stage visual map (CurriculumStage, STAGE_COLORS, VisualMapLevelCard)
**Source of truth:** Static TypeScript constants
**DONNA integration:** Stage type used throughout DONNA curriculum modules
**Gap:** Stage enum (`Red Ball | Orange Ball | Green Ball | Yellow Ball | High Performance`) in TypeScript vs DB (`red_foundation | orange_development | ...`) — mapping required at every read boundary

---

### `skillHierarchyModel.ts`
**Purpose:** Skill and sub-skill types (9 domains: technical, tactical, footwork, serve_return, rally, net_play, competition, fitness, mental)
**Source of truth:** TypeScript model — DB tables for skills not confirmed seeded
**DONNA integration:** Domain types used in gap analysis
**Gap:** Skill data exists as a TypeScript model but `skillCount` in coverage scoring is hardcoded to 0 on the curriculum page — skill records not being queried from DB

---

### `contentTypeModel.ts`
**Purpose:** Registry of 10 content types that can be added to curriculum levels: drill, coach_cue, assessment_criterion, mission, badge, parent_guidance, learning_module, skill, sub_skill, evidence_requirement
**Key property:** All types have `requiresApproval: true`
**Downstream:** CurriculumNodeDrawer renders "+ Add" buttons using these definitions
**Gap:** The content type model references 10 types; the DB `curriculum_content_items.content_type` CHECK constraint (migration 061) supports 22 values — the additional 12 types (tactical_game, player_mission, etc.) are not in the TypeScript model

---

### `coverageModel.ts`
**Purpose:** Measures how completely a curriculum level is built out. Scores across 8 weighted dimensions.

**Coverage weights:**
| Dimension | Weight | Currently scored? |
|---|---|---|
| Gates | 25% | Yes (migration-independent) |
| Drills | 20% | Yes (migration-independent) |
| Coach Cues | 15% | Yes (migration-independent) |
| Skills | 15% | No — excluded (skillCount=0) |
| Assessment | 10% | No — excluded |
| Missions | 5% | No — excluded |
| Parent Guidance | 5% | No — excluded |
| Badges | 5% | No — excluded |

**Effective coverage scoring: 60% of the model** (only gates/drills/cues). A level with complete gates, drills, and cues scores 100/100 even if it has no missions, no parent guidance, no assessments.

**Gap:** The 5 excluded dimensions are where the player experience lives. A "complete" curriculum score currently means "teachable" not "developmentally complete."

---

### `gapAnalysis.ts`
**Purpose:** Structural gap detection — missing levels, domain imbalances, no player pathway, assessment gaps, parent engagement gaps
**Input:** LevelCoverageScore[] + expected stages/domains + player/assessment/parent data
**Output:** GapAnalysisReport with categorized gaps and affected player counts
**DONNA integration:** Gap report feeds the dashboard `curricGapCount` KPI
**Gap:** The input `domainCoverageByLevel` must be constructed from actual skill/drill domain data — if skills are untracked this gap analysis underreports

---

### `levelHealthReport.ts`
**Purpose:** Per-level health score combining coverage + player signals (at-risk count, stalled count, gate met %)
**Output:** LevelHealthReport with health status (healthy/watch/at_risk/critical), health score 0-100, signals list, primary action
**DONNA integration:** Used by curriculum page health panel
**Gap:** `gateMetPct` input requires `player_requirement_progress` data — blocked if migrations 041-044 are unapplied

---

### `templateConnectionModel.ts`
**Purpose:** Models the connection between session templates and curriculum levels. Measures whether each level has at least one primary template connected.
**Output:** CurriculumTemplateConnectionReport with disconnectedLevelCount, partiallyConnectedLevelCount
**DONNA integration:** Gap in template connection can trigger a recommendation
**Gap:** Template-to-level connection requires `templates.curriculum_level_id` — migration 045 pending live DB application

---

### `exposureTracking.ts`
**Purpose:** Derives curriculum exposure candidates from attendance + wrap-up block completion data — which players were likely exposed to which content
**Key output:** PlayerExposureCandidate with `possibleExposure` and `possibleMissedExposure` per block
**Note:** Output is candidates only — does NOT write exposure records
**Gap:** Exposure is derived (possible/likely/missed) — not confirmed. No `confirmed_exposure` record exists in the DB.

---

### `playerCurriculumIntersection.ts`
**Purpose:** Computes where each player sits in the curriculum, their signals (ready_to_advance, stalled, gate_met, gate_missed), and next level preview
**Visibility:** Signals have `isCoachVisible`, `isDirectorVisible`, `isParentVisible`, `isPlayerVisible` flags
**Gap:** Requires `player_curriculum_states.gates_met` and `advancement_eligible` data — partially blocked by pending migrations

---

### `learningModules.ts`
**Purpose:** In-memory curriculum learning modules (title, goal, why it matters, try this, mini challenge, parent support tip). Built from levels + gates + drills.
**Key:** NOT persisted to DB. Generated at request time.
**Visibility:** Parent-safe tips, player-facing language
**Gap:** Not connected to player portal. Not connected to session plan. Director-preview only.

---

### `requirementProgressAggregator.ts`
**Purpose:** Aggregates `player_requirement_progress` records by curriculum level — level-wide gate/requirement completion stats
**Gap:** Requires `player_requirement_progress` table (migration 041-044 pending)

---

### `curriculumDraftHelpers.ts`
**Purpose:** Builds `CurriculumDraftProposal` from a `CurriculumInboxItem`. Infers change type, risk level. Always `requiresDirectorApproval: true`.
**Downstream:** Review queue → `CurriculumBuilderDraftCard` for director decision

---

### `inbox/index.ts`
**Purpose:** Curriculum idea/suggestion queue — voice, text, coach suggestions, DONNA proposals. All flow through `proposed_actions` pipeline before entering curriculum.
**Source types:** `voice | text | coach_suggestion | donna_proposal`
**Status values:** `pending_review | approved | rejected | merged | similar_exists`

---

### `donnaCurriculumContext.ts`
**Purpose:** DONNA's typed interface for a curriculum level — available actions, open drafts, knowledge items, gap count, voice ideas. Enforces `canPublish: false`, `canAutoApply: false`, `requiresDirectorApproval: true`, `neverAutoApply: true`.
**DONNA actions available:** draft_change_proposal, summarize_level_gaps, surface_knowledge_items, suggest_drill_attachments, suggest_coach_cues, suggest_parent_guidance

---

## 3. Curriculum Backend (`src/lib/backend/curriculumExplorer.ts`)

**Purpose:** Locked backend query that fetches all curriculum data for the explorer: levels, gates, drills, coachLanguage, competitionTracks, fitnessGuidance, volumeGuidance
**Key types:**
- `CurriculumLevel` — levels table row
- `CurriculumGate` — gates with domain, criterion, threshold, recording_method, evaluator, cadence
- `CurriculumDrill` — drills with objective, setup, coaching_cues, progressions, success_criteria
- `CurriculumCoachLanguage` — doing_well, working_on, current_focus, next_step per level

**Gap:** `procedure` field on `curriculum_drills` not fetched (locked file)

---

## 4. Templates (Curriculum → Template Connection)

### `/director/templates` + `/director/class-templates`
**Files:** `src/app/director/templates/page.tsx`, `src/app/director/class-templates/[templateId]/page.tsx`
**Purpose:** Create and manage class and fitness session templates
**Curriculum connection:**
- `templates.curriculum_level_id` (migration 045 — pending live DB)
- `curriculum_class_template_blocks` junction table (migration 062 — pending live DB)
- `BlockContentPickerCard` — picks curriculum content items for template blocks

**Gap (critical):** Templates are not fully connected to curriculum levels in the live DB. `curriculum_level_id` column and `curriculum_class_template_blocks` table both require pending migrations. Until applied, session curriculum context for coaches is absent.

---

## 5. Sessions (Template → Session)

### Session blocks and curriculum content
**How curriculum flows into sessions:**
1. Template created with curriculum_level_id assigned
2. `generateSessionFromTemplateAction` creates session + session_blocks from template_blocks
3. `CoachSessionCurriculumPanel` queries `curriculum_class_template_blocks` → `curriculum_content_items` + `curriculum_drills` for each session block
4. Coach sees curriculum content per block during session execution

**Gap:** `session_block_exercises` has missing RLS (migration 056 pending). Exercise data won't appear until migration applied.

---

## 6. Player Evidence System (`src/lib/evidence/`)

### `playerEvidenceTypes.ts`
**Source types (13):** assessment_score, reassessment_change, coach_observation, mission_assigned, mission_completed, session_attendance, session_actual, placement_decision, director_override, level_readiness_signal, parent_update_approved, competition_note, fitness_note, mental_performance_note
**Evidence pathways (5):** skill, competition, fitness, mental_performance, general
**Ownership model:** player_owned / academy_owned / shared
**Portability:** portable / internal_only / anonymized_on_exit

### `levelReadinessEngine.ts`
**Purpose:** Takes evidence records → produces ReadinessStatus (ready/close/not_ready/insufficient_evidence) with confidence, supporting/blocking evidence, DONNA explanation, recommended next action
**Required categories for "ready":** 3 of 5 (skill, competition, movement, mental_performance, behavior) — skill and competition must be strong
**Output:** `isDirectorReviewRecommended: boolean` — never auto-promotes

### `developmentPrioritiesEngine.ts`
**Purpose:** Identifies development priorities from evidence patterns. Feeds into `curriculumImprovementEngine`.

### `playerEvidenceAggregator.ts`
**Purpose:** Queries `player_evidence_records` for a player/level combination

### `evidenceParentTranslator.ts`
**Purpose:** Translates evidence records to parent-safe language

---

## 7. Player-Facing Curriculum (`src/lib/player/`)

### `individualDevelopmentPlan.ts`
**Purpose:** Role-specific IDP views. Director sees full picture. Coach sees training focus. Player sees mission-based goals. Parent sees empathetic, safe summary.
**Role views:** IdpDirectorView, IdpCoachView, IdpPlayerView, IdpParentView
**Downstream:** Player portal home, parent portal home, coach session view

### `missionModel.ts`
**Purpose:** 12 mission definitions tied to curriculum progress. Missions are short-term motivating goals (1-4 weeks).
**Stored:** `players.player_mission_label` column — no separate table
**Player-visible:** Yes. Parent-visible: Yes (selected missions).

### `missionEngine.ts`
**Purpose:** Determines eligible missions for a player from their state. Returns ranked recommendations.

### `progressIndicators.ts`
**Purpose:** Completion %, level bands, milestones, motivation line for the player portal progress view

### `visibilityControls.ts`
**Purpose:** Centralised content visibility gates — what parents and players can see. References `isParentVisible` and `isPlayerVisible` flags throughout curriculum.

---

## 8. Badge System (`src/lib/badges/`)

### `badgeModel.ts`
**Purpose:** 10 badge definitions (first_step, consistent_player, level_complete, domain_champion, attendance_streak, assessment_ready, wrap_up_champion, mental_edge, curriculum_explorer, promotion_ready)
**Note:** No DB table for badges — state computed from `player_requirement_progress`
**Gap:** Badge state is computed at read time — no `badge_awards` table persists earned badges

### `badgeEligibilityEngine.ts`
**Purpose:** Computes badge status (earned/in_progress/locked) from player progress. Returns BadgeAward[] per player.

---

## 9. DONNA Curriculum Intelligence (`src/lib/donna/curriculum*`)

| File | Purpose | Status |
|---|---|---|
| `curriculumImprovementEngine.ts` | Evidence → ranked improvement suggestions | Functional |
| `curriculumBuilderOperator.ts` | Context-first summary builder + level pattern extraction | Functional |
| `curriculumBuilderGuidance.ts` | Guided curriculum creation conversation | Functional |
| `curriculumBuilderDonnaContext.ts` | DONNA context for the builder view | Functional |
| `curriculumBottleneckLoader.ts` | Blocked — returns `curriculumTablesAvailable: false` | BLOCKED (migrations 041-044) |
| `curriculumStructuralGapLoader.ts` | Structural gap detection | Functional |
| `curriculumTemplateCoverageGapDetector.ts` | Finds levels with no connected templates | Functional |
| `curriculumLevelDonnaAnswer.ts` | DONNA answers about specific levels | Functional |
| `curriculumDraftProposalDonnaAnswer.ts` | DONNA explains draft proposals | Functional |
| `curriculumImpactDonnaAnswer.ts` | DONNA explains impact of a curriculum change | Functional |
| `intelligence/curriculumBottleneckIntelligence.ts` | Intelligence module for bottleneck detection | Blocked by schema |
| `llmOrchestration/curriculumAnswering.ts` | LLM-based curriculum Q&A | Functional |
| `llmOrchestration/curriculumChangeApprovalFlow.ts` | Approval workflow conversation | Functional |
| `llmOrchestration/curriculumContextRetrieval.ts` | Context retrieval for curriculum questions | Functional |
| `llmOrchestration/curriculumImpactPreview.ts` | Impact preview for curriculum changes | Functional |
| `llmOrchestration/curriculumStrategyConversation.ts` | Strategy conversation with director | Functional |

---

## 10. Approval Pipeline

All curriculum changes flow through:

```
Director/Coach idea
↓ CurriculumInboxItem (proposed_action payload)
↓ proposed_actions table (status: pending_review)
↓ Director Review Queue (/director/review → curriculum_session tab)
↓ CurriculumBuilderDraftCard / CoachCurriculumSuggestionCard / CurriculumAdjustmentReviewCard
↓ Director approves → execute_curriculum_override() RPC (migration 069)
↓ academy_curriculum_overrides updated (status: applied)
```

**What does NOT exist:** Automatic execution of approved curriculum changes. Approving a curriculum draft marks the proposed_action as approved — the override must still be applied via the builder.

---

## 11. Critical Schema Gaps (Pending Migrations)

| Migration | What it enables | Impact |
|---|---|---|
| 041-044 | `requirement_evidence_links`, `curriculum_track_requirements`, `player_requirement_progress`, `curriculum_requirement_domains` | Bottleneck detection, gate progress, requirement aggregation — all BLOCKED |
| 045 | `templates.curriculum_level_id` | Template-to-curriculum connection blocked |
| 056 | `session_block_exercises` RLS | Exercise data won't appear in sessions |
| 061 | `curriculum_content_items` taxonomy columns (domain, session_block_hint, is_player_visible) | Extended content types blocked |
| 062 | `curriculum_class_template_blocks` | Class template curriculum content blocked |
| 069 | `execute_curriculum_override()` RPC | Curriculum override execution blocked |
| 083 | `player_evidence_records` | Full evidence engine blocked if not applied |

**All these migrations are pending live DB application.** The code is written and ready.
