# DONNA Operator Capability Audit V1

**Sprint:** Mega Sprint 1541–1550
**Date:** 2026-06-03
**Auditor:** Claude Code — discovery only, no code changes
**Method:** Direct code inspection of all DONNA-related files

---

## Ground Rules

- Credit is given only for implemented, wired code.
- Spec files, type definitions, and registries without runtime connections are noted as "spec only."
- "Partial" means the feature works in limited contexts only.
- "One page only" is stated explicitly.

---

## 1. DONNA Current Capability Matrix

### 1A. Conversation Intelligence

| Capability | Status | Evidence from Code | Rating 0–10 | Gap |
|---|---|---|---|---|
| Intent classification | **Functional** | `donnaGlobalIntentRouter.ts` — 30+ intents, keyword matching, deterministic | 7 | No NLU fallback for ambiguous inputs; long/complex questions classify as `freeform_question` |
| Evidence-backed answers | **Partial — /director/donna page only** | `donnaEvidenceAnswers.ts` — 11 builders (why_this_level, readiness, blockers, priorities etc.); called by `donnaGlobalCommandAction` | 6 | `donnaGlobalCommandAction` is NOT wired to main `DonnaAssistantButton` — only wired to `migration-verify/page.tsx` debug tool |
| Hardcoded answers | **Functional** | All current answers are deterministic templates — no LLM inference in evidence answers | 7 | No personalization; all answers are template fills, not adaptive |
| Missing answers | **Partial** | "What should Jamie work on next?", "What are Jamie's strengths?" builders exist but not wired to main chat loop | 4 | New builders from recent sprints not connected to `DonnaVoiceReadyShell` intent routing |

### 1B. Page Awareness

| Capability | Status | Evidence from Code | Rating 0–10 | Gap |
|---|---|---|---|---|
| Knows current page | **Functional** | `resolvePageContext(pathname)` in `DonnaAssistantButton`; `donnaPageContextEngine.ts` maps 20+ routes | 7 | Uses two separate registries (`donnaPageContextRegistry` in button, `donnaPageContextEngine` in shell) — inconsistent |
| Knows page purpose | **Functional** | `DonnaPageCapabilityMap` has `pageLabel`, `directorIntent` per route | 7 | Not all pages covered; new pages (assessments, attention) not in map |
| Knows visible sections/cards | **Spec only** | `donnaPageElementRegistry.ts` has 200+ elements; not queried by main button | 2 | Registry exists but main chat loop doesn't pull element-level context |
| Knows available actions | **Partial** | `getUIActionsForPage()` exists; used by `DonnaVoiceReadyShell` only | 4 | Not surfaced in `DonnaAssistantButton` |

### 1C. Route / Navigation Awareness

| Capability | Status | Evidence from Code | Rating 0–10 | Gap |
|---|---|---|---|---|
| Route director to pages | **Functional** | `donnaUIActionDispatcher.ts` dispatch kind `'navigate'`; `DonnaVoiceReadyShell` calls `router.push()` | 7 | Navigation only works from `/director/donna` shell, not from inline floating button |
| Open player profiles | **Partial** | `go_to_player` intent + `playerHref()` in dispatcher | 5 | No player name → UUID resolution; director must already know the player ID |
| Open assessments | **Partial** | `go_to_assessments` intent; navigates to route | 4 | Cannot open a specific player's assessment tab — navigates to list only |
| Open attention queue filters | **Partial** | `dispatchUIAction('open_attention_queue_filter')` exists; filter params typed | 5 | Filter params defined but no live filter injection on the attention queue page |
| Preserve context after navigation | **Spec only** | `DonnaFocusTarget` stores route + targetId in sessionStorage; TTL = 8 seconds | 3 | No cross-page conversation continuity; in-memory session wiped on navigation |

### 1D. UI Highlight / Focus System

| Capability | Status | Evidence from Code | Rating 0–10 | Gap |
|---|---|---|---|---|
| Highlight system exists | **Functional** | `DonnaHighlightBanner` mounted in director + coach layouts; teal glow + badge; auto-dismiss | 8 | |
| `data-donna-focus-id` targets | **Partial** | 86 targets in DOM across codebase | 5 | Attention queue: 0 targets; Assessment tab: 0 targets; Review queue: 4 targets; Player profile: 6 targets |
| DONNA can visually indicate | **Functional** | `setDonnaFocusTarget()` + `router.push()` pattern works end-to-end | 7 | Only triggered from `DonnaVoiceReadyShell` — not from `DonnaAssistantButton` |
| Focus-ready pages | **Partial** | Coach session page (5 targets), director dashboard (2), players list (4), sessions list (2) | 5 | Most director pages have sparse or zero coverage |
| Focus-not-ready pages | — | Attention queue (0), Review queue (4 but uncovered), Assessment template (0), Curriculum builder (0) | — | |

### 1E. UI Action Dispatcher

| Action Type | Status | Evidence | Rating 0–10 |
|---|---|---|---|
| `navigate` | **Functional** | `DispatchResultKind = 'navigate'`; `router.push()` called | 8 |
| `guided_operator` | **Spec only** | `donnaUIGuidedOperators.ts` has 5+ operators defined; not rendered anywhere in director UI | 2 |
| `apply_filter` | **Spec only** | `filter_ready` dispatch kind; `filterParams` typed; no page wires it up | 2 |
| `open_tab` | **Not implemented** | No tab-targeting in dispatcher; tab state is local React state, no external API | 0 |
| `open_drawer` | **Spec only** | `section_toggle` UIActionMethod exists; no component observes it | 1 |
| `highlight_element` | **Partial** | Works via `focusTarget` + `DonnaHighlightBanner`; only from shell | 5 |
| `open_modal` | **Not implemented** | No modal dispatch mechanism | 0 |
| `prefill_form` | **Not implemented** | `form_fill` UIActionMethod in registry; no form observes DONNA state | 0 |
| `prepare_draft` | **Functional (5 types)** | fitness template, coach note, player note, session, session blocks | 7 |
| `request_approval` | **Functional** | `approval_routed` kind; routes to `/director/review` | 7 |
| `execute_approved_action` | **Partial** | `execute_approved_action()` RPC covers 11/15 action types | 5 |
| `scroll_to_element` | **Functional** | `DonnaHighlightBanner` calls `scrollIntoView({ behavior: 'smooth' })` | 7 |

### 1F. Approval / Safety Layer

| Capability | Status | Evidence | Rating 0–10 | Gap |
|---|---|---|---|---|
| Actions requiring approval | **Functional** | `proposed_actions` pipeline; all DONNA drafts route here | 9 | |
| Approval UI | **Functional** | Review queue at `/director/review` with 8 tab types | 8 | |
| Draft without executing | **Functional** | All draft actions write to `proposed_actions` with `status='pending_review'` | 9 | |
| Execute after approval | **Partial** | `execute_approved_action()` covers 11/15 types; 4 types have no execution path | 6 | |
| Actions logged | **Functional** | `audit_logs` written for all major mutations | 9 | |
| Role enforcement | **Functional** | Academy_id resolved server-side; role checked on every action | 9 | |

### 1G. Workflow Memory

| Capability | Status | Evidence | Rating 0–10 | Gap |
|---|---|---|---|---|
| Remember incomplete onboarding | **Not implemented** | No onboarding state persistence between sessions | 0 | `donnaLastSessionStore` is spec-level |
| Resume assessment workflows | **Not implemented** | No cross-session state for assessment in-progress | 0 | |
| Resume placement reviews | **Not implemented** | Placement recommendations exist in DB; DONNA has no retrieval path to surface "you had a pending placement" | 0 | |
| Resume parent updates | **Not implemented** | Same — proposed_actions exist in DB but DONNA doesn't proactively surface them | 0 | |
| "Continue where we left off" | **Not implemented** | In-memory `donnaChatSessionMemory` is wiped on every page load | 0 | DB tables exist (migration 070) but the persistence layer is fire-and-forget, not used to restore conversation state |

### 1H. Attention Queue Integration

| Capability | Status | Evidence | Rating 0–10 | Gap |
|---|---|---|---|---|
| Answer "who needs attention?" | **Functional** | `donnaAttentionRankingEngine.ts`; `buildAttentionItems()` with DONNA explanations | 7 | Works in text answer only; no live data pull |
| Navigate to queue | **Functional** | `go_to_approvals` intent; `/director/attention` route | 7 | |
| Filter by issue type | **Spec only** | `filter_ready` dispatch kind; no live filter injection | 2 | |
| Explain why player is in queue | **Functional** | `donnaExplanation` field on every `AttentionItem` | 8 | |
| Navigate to right next action | **Partial** | `href` on `AttentionItem`; `recommendedAction` text; no DONNA-directed navigation from queue item | 4 | |
| Highlight specific queue item | **Not implemented** | 0 `data-donna-focus-id` on attention queue page | 0 | |

### 1I. Player Profile Integration

| Capability | Status | Evidence | Rating 0–10 | Gap |
|---|---|---|---|---|
| "Is this player ready?" | **Partial — /director/donna page** | `buildIsReadyToMoveUpAnswer()` in `levelReadinessEngine.ts`; called from `donnaGlobalCommandAction` | 5 | Not accessible from `DonnaAssistantButton` on profile page |
| "What should they work on?" | **Partial** | `buildTopPrioritiesAnswer()` in `developmentPrioritiesEngine.ts` | 4 | Same — not wired to main button |
| "What evidence supports this?" | **Partial** | `buildEvidenceForNextLevelAnswer()` in `donnaEvidenceAnswers.ts` | 5 | Same |
| "What is missing?" | **Partial** | `buildAssessmentEvidenceMissingAnswer()` | 4 | Same |
| Highlight relevant profile section | **Partial** | 6 `data-donna-focus-id` on profile page (`player-active-priorities`, `player-evidence-hub`, `player-profile-header`, etc.) | 4 | DONNA can only highlight from `/director/donna` shell, not from profile-page inline |
| Open specific tab | **Not implemented** | Tab state is local React state; no external API for DONNA to target tabs | 0 | |

### 1J. Evidence / Readiness / Priority Integration

| Capability | Status | Evidence | Rating 0–10 | Gap |
|---|---|---|---|---|
| Access assessment evidence | **Functional** | `getPlayerEvidenceRecords()` called from `donnaGlobalCommandAction`; aggregator with fallback | 8 | Requires `player_evidence_records` table to be applied (migration 083 pending on live DB per KNOWN_LIMITATIONS) |
| Explain level readiness | **Functional** | `calculateLevelReadiness()` + `LevelReadinessCard` on Assessments tab | 7 | Full DONNA explanation only on `/director/donna` page |
| Explain development priorities | **Functional** | `calculateDevelopmentPriorities()` + `DevelopmentPrioritiesCard` | 7 | Same |
| Cite evidence records | **Functional** | `citedEvidenceIds: string[]` on every `EvidenceAnswer` | 7 | Citation IDs returned but UI doesn't render linked cards |
| Deterministic or AI-generated? | **Deterministic** | All answers are keyword-matched + template-filled; no LLM inference in evidence answers | 9 | This is a safety strength; personalization requires LLM layer |

### 1K. Draft Generation

| Draft Type | Status | Evidence | Gap |
|---|---|---|---|
| Placement review | **Functional** | `proposed_actions` with `target_module: 'placement'`; review queue tab | |
| Level readiness review | **Spec only** | `isDirectorReviewRecommended` flag computed; no draft creation action exists | No server action writes a `level_readiness_review` proposed_action |
| Parent update | **Partial** | `saveCoachCommunicationDraftAction`; draft exists but limited fields | Not linked from DONNA evidence answers |
| Coach follow-up | **Partial** | `saveCoachNoteDraftAction` via DONNA button | Only on coach note flow; not director-initiated |
| Curriculum adjustment | **Partial** | `createCurriculumContentItemDraft` called from `DonnaVoiceReadyShell`; only for content items | Cannot adjust levels, gates, or requirements via DONNA |
| Assessment request | **Spec only** | `assessment_events` table (migration 079); no DONNA-triggered creation | |
| Fitness template | **Functional** | `saveFitnessTemplateDraftAction`; complete draft → review flow | |

---

## 2. DONNA COO+ Score

| Dimension | Score | Rationale |
|---|---|---|
| **Intelligence** | 6/10 | 30+ intents, keyword-matched, deterministic answers; no LLM personalization; evidence builders are strong but partially wired |
| **Page Awareness** | 6/10 | Two competing registries; strong coverage on some pages, zero on others (attention queue, assessments); element registry not queried |
| **Navigation** | 6/10 | Navigate works; highlight-on-arrival works; but only from `/director/donna` shell, not inline button; no player name resolution |
| **Highlighting** | 4/10 | System is real and working; 86 focus targets; but attention queue, assessment tab, review queue have minimal/zero coverage; only triggered from shell |
| **Action Execution** | 3/10 | 5 real draft types; dispatcher is spec-heavy; `open_tab`, `prefill_form`, `open_modal`, `apply_filter` not wired; guided operators not rendered |
| **Approval Safety** | 8/10 | Strongest dimension; `proposed_actions` pipeline solid; audit logs; role enforcement; no auto-execution |
| **Workflow Memory** | 1/10 | In-memory only; wipes on navigation; DB tables exist but persistence is fire-and-forget only |
| **Evidence Reasoning** | 6/10 | Engine is solid and tested; 11 answer builders; level readiness + priorities computed correctly; but accessible only on dedicated DONNA page |
| **Director UX** | 4/10 | Two competing UX patterns (inline button vs. dedicated page); button uses old architecture; DONNA page is good but director doesn't naturally go there |
| **Overall COO+ Readiness** | **5/10** | Architecture exists; safety layer is strong; but integration is fragmented, inline capability is weak, workflow memory is absent |

---

## 3. Top 20 Gaps

Ranked by: user impact × build dependency × risk × strategic importance.

| Rank | Gap | Impact | Dependency | Risk | Next Required Work |
|---|---|---|---|---|---|
| 1 | **`donnaGlobalCommandAction` not wired to `DonnaAssistantButton`** | Critical | None | Low | Replace old button answer pipeline with `donnaGlobalCommandAction` call; evidence-backed answers instantly available on all pages |
| 2 | **No inline DONNA panel on director pages** | Critical | Gap 1 | Low | `DonnaVoiceReadyShell` only on `/director/donna`; no persistent inline panel on dashboard, players, assessments, attention queue |
| 3 | **`open_tab` dispatch not implemented** | High | None | Low | Player profile, assessments, curriculum tabs cannot be targeted by DONNA; requires tab state lifted to URL params or a DONNA tab event |
| 4 | **Attention queue has 0 `data-donna-focus-id` targets** | High | None | Low | DONNA cannot highlight specific attention items; add targets to queue rows |
| 5 | **Assessment tab has 0 `data-donna-focus-id` targets** | High | None | Low | Assessment form, readiness card, priorities card have no DONNA anchors |
| 6 | **`apply_filter` not wired to attention queue** | High | Gap 2 | Low | DONNA can say "show overdue assessments" but cannot actually apply the filter |
| 7 | **No level readiness review draft action** | High | None | Low | `isDirectorReviewRecommended = true` computed but no server action creates a `proposed_action` for director to approve |
| 8 | **Workflow memory is ephemeral only** | High | Migrations 070–072 | Medium | DB tables exist; persistence is fire-and-forget; "continue where we left off" not implemented; need to restore pending workflows on session start |
| 9 | **New evidence builders not in `DonnaVoiceReadyShell` routing** | High | Gap 1 | Low | `buildTopPrioritiesAnswer`, `buildPlayerStrengthsAnswer`, `buildIsReadyToMoveUpAnswer`, `buildWhyNotReadyToAdvanceAnswer` exist but not in `routeDonnaIntentV1` |
| 10 | **No player name → player ID resolution** | High | None | Medium | `go_to_player` intent navigates but DONNA cannot resolve "Jamie" → UUID; requires roster search |
| 11 | **Guided operators not rendered anywhere** | Medium | Gap 2 | Low | `donnaUIGuidedOperators.ts` has 5+ operators; no UI renders them; guided onboarding, assessment, placement flows unreachable |
| 12 | **`data-donna-focus-id` missing on review queue items** | Medium | None | Low | 4 targets on review queue but not on individual action items; DONNA cannot point to specific drafts |
| 13 | **`prefill_form` not wired** | Medium | Gap 3 | Low | No form component observes DONNA state; DONNA cannot pre-fill the assessment form with a player's prior context |
| 14 | **DONNA evidence citations not rendered as links** | Medium | Gap 1 | Low | `citedEvidenceIds` returned on every answer but UI shows them as text only, not linked to evidence records |
| 15 | **Assessment request draft action missing** | Medium | None | Low | `assessment_events` table exists (migration 079); no DONNA-triggered creation action |
| 16 | **No cross-session conversation continuity** | Medium | Migrations 070–072 | High | Every new page load starts fresh; DONNA cannot ask "do you want to continue with Jamie's assessment?" |
| 17 | **`donnaPageElementRegistry` not queried by main button** | Medium | Gap 1 | Low | 200+ elements registered; not used to surface "what should I do next?" in main button context |
| 18 | **`open_drawer`/`section_toggle` dispatch not wired** | Low | Gap 2 | Low | `section_toggle` UIActionMethod defined; no component observes it; DONNA cannot expand/collapse profile sections |
| 19 | **Parent-update draft not linked from evidence answers** | Low | None | Low | `buildParentUpdateRecommendation()` exists; no draft creation triggered from evidence layer |
| 20 | **DONNA page (`/director/donna`) not surfaced in primary navigation** | Low | None | Low | Sidebar has no link to `/director/donna`; director must know the URL; the best DONNA experience is hidden |

---

## 4. Operator Infrastructure Inventory

### Core Interaction Files

| File | Type | Status | Connected to UI? |
|---|---|---|---|
| `src/components/donna/DonnaAssistantButton.tsx` | Client component | Functional | Yes — director layout |
| `src/components/donna/DonnaVoiceReadyShell.tsx` | Client component | Functional | `/director/donna` and `/coach/donna` only |
| `src/components/donna/DonnaChatThread.tsx` | Client component | Functional | Inside shell |
| `src/components/donna/DonnaHighlightBanner.tsx` | Client component | Functional | Director + coach layouts |
| `src/app/director/donna/page.tsx` | Server page | Functional | Dedicated DONNA page |
| `src/app/director/layout.tsx` | Layout | Functional | Mounts button + highlight |

### Intent / Routing Files

| File | Type | Status |
|---|---|---|
| `src/lib/donna/donnaGlobalIntentRouter.ts` | Pure TS | Functional — 30+ intents |
| `src/lib/donna/donnaIntentClassifier.ts` | Pure TS | Functional — keyword matching |
| `src/lib/donna/donnaConversationalRouter.ts` | Pure TS | Functional |
| `src/lib/donna/donnaIntentRouterV1.ts` | Pure TS | Functional |
| `src/lib/donna/donnaCommandRouter.ts` | Pure TS | Functional |
| `src/app/director/_actions/donnaGlobalCommandAction.ts` | Server action | Functional — NOT wired to button |

### UI Action System

| File | Type | Status |
|---|---|---|
| `src/lib/donna/donnaUIActionRegistry.ts` | Pure TS | Spec + runtime types |
| `src/lib/donna/donnaUIActionDispatcher.ts` | Pure TS | Functional navigate + highlight; other actions partial |
| `src/lib/donna/donnaUIApprovalMatrix.ts` | Pure TS | Functional |
| `src/lib/donna/donnaUIGuidedOperators.ts` | Pure TS | Spec only — not rendered |
| `src/lib/donna/donnaFocusTarget.ts` | Pure TS | Functional — sessionStorage |

### Evidence / Intelligence Files (recent sprints)

| File | Type | Status |
|---|---|---|
| `src/lib/evidence/playerEvidenceAggregator.ts` | Server | Functional with fallback |
| `src/lib/evidence/playerEvidenceWriter.ts` | Server | Functional |
| `src/lib/evidence/assessmentEvidenceMapper.ts` | Pure TS | Functional |
| `src/lib/evidence/assessmentEvidenceWriter.ts` | Server | Functional |
| `src/lib/evidence/levelReadinessEngine.ts` | Pure TS | Functional |
| `src/lib/evidence/developmentPrioritiesEngine.ts` | Pure TS | Functional |
| `src/lib/evidence/donnaEvidenceAnswers.ts` | Pure TS | Functional — 11 builders |

### Draft Execution Actions

| File | Type | Status |
|---|---|---|
| `src/app/director/_actions/donnaDraftExecutionActions.ts` | Server action | 5 real draft types |
| `src/app/director/_actions/donnaGlobalCommandAction.ts` | Server action | Functional — not wired to button |
| `src/app/director/_actions/donnaOrchestratorAction.ts` | Server action | Functional |
| `src/app/director/_actions/donnaReviewQueueActions.ts` | Server action | Functional |
| `src/lib/actions/donnaSentinelAction.ts` | Server action | Functional |

### Approval / Safety

| File | Type | Status |
|---|---|---|
| `src/lib/donna/donnaApprovalGate.ts` | Pure TS | Functional |
| `src/lib/donna/donnaRoleBoundaries.ts` | Pure TS | Functional |
| `src/lib/donna/donnaBoundaryResponses.ts` | Pure TS | Functional |
| `src/lib/donna/actionExecutionGuards.ts` | Pure TS | Functional |
| `src/lib/donna/donnaUIApprovalMatrix.ts` | Pure TS | Functional |

### DB Tables (migrations applied / pending)

| Table | Migration | Status |
|---|---|---|
| `donna_conversation_sessions` | 070 | Applied |
| `donna_conversation_messages` | 070 | Applied |
| `donna_conversation_events` | 071 | Applied |
| `donna_recommendation_feedback` | 072 | Applied |
| `donna_entity_summaries` | 073 | Applied |
| `donna_embeddings` | 074 | Applied |
| `donna_usage_events` | 075 | Applied |
| `donna_placement_recommendations` | 080 | Applied |
| `player_evidence_records` | 083 | **Pending live application** |

---

## 5. Site-Wide Operator Readiness by Page

| Page | Rating | `data-donna-focus-id` Targets | Can DONNA Navigate? | Can DONNA Explain? | Can DONNA Act? |
|---|---|---|---|---|---|
| Dashboard `/director` | **Partial** | 2 | Yes | Yes (KPIs, queue) | View only |
| Attention Queue `/director/attention` | **Partial** | 0 | Yes | Yes (DONNA explanations on items) | Cannot filter/highlight |
| Players List `/director/players` | **Partial** | 4 | Yes | Partial | View only |
| Player Profile `/director/players/[id]` | **Partial** | 6 | Yes | Yes (from /donna page) | Cannot open tabs |
| Assessments Tab | **Not Ready** | 0 | No (tab, not route) | Partial (via cards) | Cannot target form |
| Curriculum `/director/curriculum` | **Partial** | 7 | Yes | Yes (level, content) | Draft content items only |
| Assessment Templates | **Not Ready** | 0 | Yes | No | No |
| Sessions `/director/sessions` | **Partial** | 2 | Yes | Partial | Draft sessions |
| Review Center `/director/review` | **Partial** | 4 | Yes | Partial | Approve/reject via UI |
| Parent Updates | **Not Ready** | 0 | Partial | No | Draft only |
| Settings | **Not Ready** | 0 | No | No | No |
| DONNA Page `/director/donna` | **Operator Ready** | 3 | Yes | Yes — full evidence | Yes — all draft types |

---

## 6. Next Sprint Recommendation

### Mega Sprint 1551–1580 — Site-Wide DONNA UI Operator V1

**Goal:** Connect the DONNA intelligence layer to every director page as a persistent, context-aware operator. Replace fragmented dual-architecture with a single wired system.

**Architecture decision:**

Replace the `DonnaAssistantButton`'s private answer pipeline with a call to `donnaGlobalCommandAction`. Add an inline DONNA panel (collapsed by default) to every major director page. Wire `open_tab` by moving tab state to URL params. Add `data-donna-focus-id` to attention queue and assessment pages.

**Files to create:**

- `src/components/donna/DonnaInlinePanel.tsx` — Collapsed/expanded client panel component; renders on every director page via layout or per-page; uses `donnaGlobalCommandAction`; shows suggestions, chat thread, highlight triggers
- `src/lib/donna/donnaTabNavigator.ts` — Pure TS: maps intent → tab name; dispatches `donna:open-tab` custom event; pairs with URL-param tab state
- `src/app/director/_actions/donnaLevelReadinessDraftAction.ts` — Creates `proposed_action` row for level readiness review; surfaces in review queue
- `src/lib/donna/donnaPlayerNameResolver.ts` — Pure TS: resolves first names against academy roster; maps "Jamie" → first match UUID; returns `{ resolved: true, playerId, displayName }` or `{ resolved: false, suggestions }`

**Files to modify:**

- `src/components/assistant/DonnaAssistantButton.tsx` — Replace private answer pipeline with `donnaGlobalCommandAction`; wire new evidence builders to intent router
- `src/components/donna/DonnaVoiceReadyShell.tsx` — Add `buildTopPrioritiesAnswer`, `buildIsReadyToMoveUpAnswer`, `buildPlayerStrengthsAnswer`, `buildWhyNotReadyToAdvanceAnswer` to intent routing map
- `src/app/director/attention/AttentionQueueClient.tsx` — Add `data-donna-focus-id` to each item row; format `id="attention-item-${item.id}"`
- `src/app/director/players/[playerId]/_components/AssessmentsTab.tsx` — Add `data-donna-focus-id` to assessment form wrapper, readiness card, priorities card
- `src/app/director/players/[playerId]/_components/PlayerProfileTabs.tsx` — Emit `donna:open-tab` event on tab clicks; listen for same event from DONNA dispatcher

**Acceptance criteria:**

- Director can ask "Is Jamie ready to advance?" from the player profile page and receive an evidence-backed answer with citation — not just from `/director/donna`
- Director can ask "Show me players who need attention" and DONNA applies the filter on the attention queue — not just navigates to it
- Director can ask "What should I focus on?" and DONNA highlights the top attention queue item with a teal glow
- `donnaGlobalCommandAction` is the single answer pipeline for all director intents
- New evidence builders (`buildTopPrioritiesAnswer`, `buildIsReadyToMoveUpAnswer`) are reachable from all DONNA entry points
- Level readiness review creates a `proposed_action` draft for director approval
- TypeScript clean
- No parent/player data exposed
