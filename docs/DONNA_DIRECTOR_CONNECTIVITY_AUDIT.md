# DONNA Director-Side Connectivity Audit V1

**Sprint:** 604A
**Date:** 2026-05-21
**Scope:** All reachable director-side routes and DONNA connectivity dimensions
**Status:** Audit complete — no features built, no code changed in app routes

---

## Audit dimensions

For each route:

| Dimension | Meaning |
|---|---|
| **DONNA presence** | Is there any DONNA UI element on the page? |
| **Page-aware** | Does DONNA know what page the director is on? |
| **Object-aware** | Does DONNA know which player/session/template is selected? |
| **Can explain** | Can DONNA explain what this page does? |
| **Can summarize** | Can DONNA summarize current state (data on screen)? |
| **Can recommend** | Can DONNA suggest next actions? |
| **Can draft** | Can DONNA produce a safe draft output? |
| **Can route** | Can DONNA route items to the review queue? |
| **Can apply** | Can DONNA apply an approved change? |
| **Approval required** | Is director approval required before DONNA applies anything? |
| **Parent/player risk** | Could DONNA expose restricted data to parents or players? |

---

## Route-by-route audit

### `/director/donna` — DONNA Hub
**Primary job:** Director DONNA command center — attention queue, risks, recommended actions, chat shell, daily brief.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ✅ Full | `DonnaDirectorShellClient`, `DonnaContextSummaryCard`, `DONNAAcademyPulseCard`, `DirectorDonnaDailyBrief`, `DonnaReviewQueueSurface` |
| Page-aware | ✅ Yes | `loadDirectorDonnaContext` loads live academy context |
| Object-aware | ⚠️ Partial | Academy-level objects (sessions, reviews, attention items) but no player/session drill-down here |
| Can explain | ✅ Yes | Context summary card + chat shell |
| Can summarize | ✅ Yes | Today's counts, pending reviews, missing wrap-ups, attention items, risks |
| Can recommend | ✅ Yes | `recommendedActions[]` + next best action links |
| Can draft | ⚠️ Partial | Chat shell can assist with thinking; structured drafting happens on specific pages |
| Can route | ✅ Yes | Review queue surface links to `/director/review` |
| Can apply | ❌ No | No apply actions on this page — director is redirected to review queue |
| Approval required | N/A | No apply actions here |
| Parent/player risk | ✅ None | Only count-level data; no raw observations |

**Missing context:** Selected player object; selected session object; curriculum coverage state
**Missing actions:** Inline approve from DONNA hub; DONNA cannot action review items directly from this page
**Risk:** Low
**Overall score:** 8/10

---

### `/director` — Main Dashboard
**Primary job:** Academy overview — KPI cards, priority queue, player alerts, session list, DONNA executive card.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ⚠️ Partial | `DonnaExecutiveCard`, `AcademyHealthBadgeWithDrawer`, `AcademyKpiCardsSection`, `DirectorDnaStatusBadge` |
| Page-aware | ⚠️ Partial | Executive card shows aggregate signals; no full context load |
| Object-aware | ❌ No | Player attention items are shown but DONNA cannot speak to individual players |
| Can explain | ❌ No | No DONNA explanation of what each KPI means |
| Can summarize | ⚠️ Partial | Executive card surfaces top signals |
| Can recommend | ⚠️ Partial | Priority queue links to review items |
| Can draft | ❌ No | No DONNA draft actions |
| Can route | ❌ No | Dashboard links to review but DONNA is not the router |
| Can apply | ❌ No | |
| Approval required | N/A | |
| Parent/player risk | ✅ None | Aggregate counts only |

**Missing context:** DONNA does not know which KPI the director is looking at; no explanation of what "urgent" means for this academy
**Missing actions:** KPI explainer chip; DONNA "what should I do first?" answer; link to DONNA hub from each section
**Risk:** Low
**Overall score:** 4/10

---

### `/director/command-center` — Command Center
**Primary job:** Voice/text command intake; command history; structured draft creation.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ✅ Full | `DirectorAssistantPanel`, `CommandCenterClient` |
| Page-aware | ✅ Yes | `loadWeeklyCoOReport` provides weekly context |
| Object-aware | ⚠️ Partial | Commands are resolved to objects via `donnaObjectResolutionActions` |
| Can explain | ⚠️ Partial | Deterministic keyword matching in V1; no free-form explanation |
| Can summarize | ✅ Yes | Weekly CoO report surface |
| Can recommend | ⚠️ Partial | Suggestion chips show canned responses |
| Can draft | ✅ Yes | Command creates `proposed_actions` drafts |
| Can route | ✅ Yes | Routes to review queue |
| Can apply | ❌ No | Execute path is in review queue, not here |
| Approval required | ✅ Yes | All commands create `pending_review` actions |
| Parent/player risk | ✅ None | Output is draft-only |

**Missing context:** Free-form NLU (V1 is deterministic pattern matching); multi-turn context; player name resolution to IDs
**Missing actions:** AI inference layer; disambiguation when multiple players match
**Risk:** Low (pattern matching limits blast radius)
**Overall score:** 7/10

---

### `/director/review` — Review Queue
**Primary job:** Director approves or rejects all DONNA-drafted items before they take effect.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ✅ Full | `DonnaReviewBriefPanel`, `DonnaDraftCard`, 12+ typed draft cards |
| Page-aware | ✅ Yes | Tabs by action type; `DonnaReviewBriefPanel` summarizes queue state |
| Object-aware | ✅ Yes | Each draft card shows source player, session, or coach |
| Can explain | ✅ Yes | Each draft card explains what DONNA proposed and why |
| Can summarize | ✅ Yes | Queue counts by type; wrap-up coverage panel |
| Can recommend | ✅ Yes | Draft cards include context and recommended decision |
| Can draft | ✅ Yes | DONNA drafts arrive here pre-generated |
| Can route | ✅ Yes | This is the routing surface |
| Can apply | ✅ Yes | Director approves → apply controls execute |
| Approval required | ✅ Yes | Director must approve each item before apply |
| Parent/player risk | ✅ Guarded | Parent-safe drafts pass through `parentSafeResponseRules` before apply |

**Missing context:** DONNA cannot answer follow-up questions about a draft item inline (director sees card but cannot ask DONNA "why did you suggest this?")
**Missing actions:** Inline DONNA Q&A on draft items; batch DONNA rationale export; bulk-approve with DONNA reasoning summary
**Risk:** Low — approval gate is solid
**Overall score:** 9/10

---

### `/director/review/[actionId]` — Review Item Detail
**Primary job:** Per-item review with full context panel.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ✅ Full | `DonnaReviewContextPanel` per item |
| Page-aware | ✅ Yes | Item type + source loaded via `ReviewItemRouter` |
| Object-aware | ✅ Yes | Player/session/coach resolved per item |
| Can explain | ✅ Yes | `DonnaReviewContextPanel` provides item context |
| Can summarize | ✅ Yes | Full item payload visible |
| Can recommend | ⚠️ Partial | Context shown; DONNA recommendation is the draft itself |
| Can draft | N/A | Draft already created; this is review surface |
| Can route | N/A | Routing happened at creation |
| Can apply | ✅ Yes | Per-item apply controls |
| Approval required | ✅ Yes | |
| Parent/player risk | ✅ Guarded | |

**Missing context:** DONNA follow-up questions; related items cross-reference
**Risk:** Low
**Overall score:** 8/10

---

### `/director/curriculum` — Curriculum Explorer
**Primary job:** View and manage the full curriculum structure, levels, drills, health status.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ⚠️ Partial | `VoiceOverrideInputPanel`, `CurriculumCustomizationAssistant`, `CurriculumHealthPanel` |
| Page-aware | ✅ Yes | Curriculum structure loaded; health panel visible |
| Object-aware | ⚠️ Partial | Level selected in tree; DONNA sees level but not requirement detail |
| Can explain | ⚠️ Partial | `CurriculumCustomizationAssistant` can respond to prompts |
| Can summarize | ⚠️ Partial | Health panel shows coverage stats |
| Can recommend | ⚠️ Partial | Voice override can suggest changes |
| Can draft | ✅ Yes | Voice override creates `proposed_actions` curriculum overrides |
| Can route | ✅ Yes | Drafts go to review queue |
| Can apply | ❌ No | Apply is in review queue |
| Approval required | ✅ Yes | |
| Parent/player risk | ✅ None | Curriculum data is director-only |

**Missing context:** DONNA does not know which level is currently expanded; requirement detail not in DONNA context; coverage gaps not surfaced to DONNA chat
**Missing actions:** "DONNA, what's weak in this level?" chip; per-drill DONNA context
**Risk:** Low
**Overall score:** 6/10

---

### `/director/curriculum/builder` — Curriculum Builder
**Primary job:** Setup builder for creating curriculum from scratch or from the starter template.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ❌ None | `CurriculumSetupBuilder` has no DONNA panel |
| Page-aware | ❌ No | |
| Object-aware | ❌ No | |
| Can explain | ❌ No | |
| Can summarize | ❌ No | |
| Can recommend | ❌ No | |
| Can draft | ❌ No | |
| Can route | ❌ No | |
| Can apply | ❌ No | |
| Approval required | N/A | |
| Parent/player risk | ✅ None | |

**Missing context:** All — DONNA has zero visibility into the builder flow
**Missing actions:** DONNA guidance through setup steps; "what should this level include?" prompts; builder draft suggestions
**Risk:** Medium — director may make curriculum decisions without DONNA context
**Overall score:** 1/10

---

### `/director/curriculum/learning` — Learning Modules
**Primary job:** Director preview of in-memory learning module content by level and domain.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ❌ None | `LearningModulesClient` has no DONNA panel |
| Page-aware | ❌ No | |
| Object-aware | ❌ No | |
| Can explain | ❌ No | |
| Can summarize | ❌ No | |
| Can recommend | ❌ No | |
| Can draft | ❌ No | |
| Can route | ❌ No | |
| Can apply | ❌ No | |
| Parent/player risk | ✅ None | Preview only; not persisted |

**Missing context:** All
**Risk:** Low (read-only preview page)
**Overall score:** 1/10

---

### `/director/players` — Players Directory
**Primary job:** Search and browse all active players; navigate to individual profiles.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ❌ None | `PlayersDirectoryClient` — search and filter only |
| Page-aware | ❌ No | |
| Object-aware | ❌ No | |
| Can explain | ❌ No | |
| Can summarize | ❌ No | |
| Can recommend | ❌ No | |
| Can draft | ❌ No | |
| Can route | ❌ No | |
| Can apply | ❌ No | |
| Parent/player risk | ✅ None | Director-only view |

**Missing context:** DONNA cannot answer "show me players at risk" or "who needs assessment" from this page
**Missing actions:** DONNA roster intelligence chip; "who should I focus on today?" answer with deep links to profiles
**Risk:** Medium — important triage surface with no DONNA presence
**Overall score:** 1/10

---

### `/director/players/[playerId]` — Player Profile
**Primary job:** Full player intelligence hub — curriculum, assessment, priorities, gate evidence, coach notes, parent guidance.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ✅ Partial | `NotesAIDraftSection`, `PriorityRecommendationDraftButton`, `EvidenceRequirementDraftButton`, `FitnessHomeworkRecommendationButton`, `DraftSummaryUpdateButton`, `ParentGuidancePreviewPanel` |
| Page-aware | ✅ Yes | Player ID in URL; page data loaded from DB |
| Object-aware | ✅ Yes | Player is the selected object; curriculum level, gates, priorities loaded |
| Can explain | ❌ No | No DONNA chat shell; cannot ask "what does this mean?" |
| Can summarize | ⚠️ Partial | `LevelReadinessSummary` shows computed readiness; not DONNA-narrated |
| Can recommend | ✅ Yes | `PriorityRecommendationDraftButton` drafts next priority via DONNA |
| Can draft | ✅ Yes | Multiple DONNA draft buttons; all route to review queue |
| Can route | ✅ Yes | Drafts go to `proposed_actions` |
| Can apply | ❌ No | Apply is in review queue |
| Approval required | ✅ Yes | All drafts require director approval |
| Parent/player risk | ✅ Guarded | Parent guidance goes through `parentSafeResponseRules`; player portal link is explicit |

**Missing context:** DONNA cannot answer inline questions about the player; no DONNA chat shell on the player profile; DONNA cannot explain why a gate is blocked
**Missing actions:** DONNA inline Q&A; "DONNA, what should I do for this player today?"
**Risk:** Low (approval gates solid)
**Overall score:** 7/10

---

### `/director/sessions` — Sessions List
**Primary job:** Browse all sessions; navigate to individual session detail.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ❌ None | List page only; no DONNA panel |
| Page-aware | ❌ No | |
| Object-aware | ❌ No | |
| Can explain | ❌ No | |
| Can summarize | ❌ No | |
| Can recommend | ❌ No | |
| Can draft | ❌ No | |
| Can route | ❌ No | |
| Can apply | ❌ No | |
| Parent/player risk | ✅ None | |

**Missing context:** DONNA cannot surface "sessions with missing wrap-ups" or "sessions with no coach assigned"
**Risk:** Low
**Overall score:** 1/10

---

### `/director/sessions/[sessionId]` — Session Detail
**Primary job:** View session plan, attendance, wrap-up, coach notes; generate adjustments.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ✅ Partial | `StructureRecapButton`, `VoiceCoachRecapInput`, `SessionAdjustmentSuggestionsPanel`, `AttendanceExceptionDraftPanel` |
| Page-aware | ✅ Yes | Session ID loaded; session data in context |
| Object-aware | ✅ Yes | Session is the selected object; coach, group, players in context |
| Can explain | ❌ No | No DONNA chat; cannot ask "why is this session flagged?" |
| Can summarize | ⚠️ Partial | `SessionRecapSummary` shows recap; not DONNA-narrated |
| Can recommend | ✅ Yes | `SessionAdjustmentSuggestionsPanel` generates DONNA suggestions |
| Can draft | ✅ Yes | Recap structuring, attendance exception, adjustment suggestions |
| Can route | ✅ Yes | Drafts routed to review queue |
| Can apply | ⚠️ Partial | `applyApprovedSessionAdjustmentAction` applies approved adjustments |
| Approval required | ✅ Yes | Adjustments require approval before apply |
| Parent/player risk | ✅ Guarded | No parent/player data in session detail |

**Missing context:** DONNA cannot explain the session's curriculum context; no DONNA narrative on planned vs. actual comparison
**Risk:** Low
**Overall score:** 6/10

---

### `/director/templates` — Templates Hub
**Primary job:** Navigate to class template and fitness template libraries; DONNA template suggestions.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ✅ Partial | `TemplatesDonnaPanel` |
| Page-aware | ✅ Yes | Hub page with DONNA panel |
| Object-aware | ❌ No | No specific template selected |
| Can explain | ⚠️ Partial | DONNA panel describes templates generally |
| Can summarize | ❌ No | |
| Can recommend | ✅ Yes | `/director/templates/donna-suggestions` page |
| Can draft | ❌ No | |
| Can route | ❌ No | |
| Can apply | ❌ No | |
| Parent/player risk | ✅ None | |

**Risk:** Low
**Overall score:** 4/10

---

### `/director/templates/class/[templateId]` — Class Template Builder
**Primary job:** Build class templates with curriculum blocks, drills, and lesson plans.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ✅ Partial | `LessonPlanDraftPanel`, `ClassTemplateBuilderStepper` |
| Page-aware | ✅ Yes | Template ID loaded |
| Object-aware | ✅ Yes | Template object and curriculum level in context |
| Can explain | ❌ No | |
| Can summarize | ❌ No | |
| Can recommend | ⚠️ Partial | Lesson plan draft suggests content |
| Can draft | ✅ Yes | `generateLessonPlanDraftAction`, `applyLessonPlanDraftAction` |
| Can route | ⚠️ Partial | Lesson plan apply goes directly; some items to review queue |
| Can apply | ✅ Yes | `applyLessonPlanDraftAction` |
| Approval required | ⚠️ Partial | Lesson plan draft can apply directly; needs review for player-facing |
| Parent/player risk | ✅ None | Template is director-only |

**Risk:** Low-medium — lesson plan apply path should always pass through review queue
**Overall score:** 6/10

---

### `/director/fitness/templates/[templateId]` — Fitness Template Builder
**Primary job:** Build fitness templates with exercise blocks.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ⚠️ Partial | `FitnessTemplateBuilderClient`, `GenerateSessionPanel` |
| Page-aware | ✅ Yes | Template ID loaded |
| Object-aware | ✅ Yes | Template in context |
| Can explain | ❌ No | |
| Can summarize | ❌ No | |
| Can recommend | ⚠️ Partial | `PopulateFitnessBlocksButton` auto-populates blocks |
| Can draft | ✅ Yes | Session generation creates draft sessions |
| Can route | ⚠️ Partial | Generate session goes to `sessions` table directly |
| Can apply | ✅ Yes | Direct session generation (not through review queue) |
| Approval required | ❌ No | Session generation is direct — no review gate for templates |
| Parent/player risk | ✅ None | Templates are director-only |

**Risk:** Medium — direct session generation bypasses review queue
**Overall score:** 5/10

---

### `/director/today` — Today's Academy
**Primary job:** Today's sessions, player attention risk, command brief, DONNA suggestion chips.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ✅ Good | `TodayCommandBrief`, `TodayDonnaSuggestionChip`, `loadCommandBriefLive`, `loadPlayerAttentionRisk` |
| Page-aware | ✅ Yes | Today's date; live session and attention data |
| Object-aware | ⚠️ Partial | Session list shown; player attention shown; not drill-down connected |
| Can explain | ⚠️ Partial | Command brief provides narrative context |
| Can summarize | ✅ Yes | Live command brief with today's snapshot |
| Can recommend | ✅ Yes | DONNA suggestion chips with next actions |
| Can draft | ❌ No | No draft actions from today page |
| Can route | ⚠️ Partial | Links to review queue |
| Can apply | ❌ No | |
| Approval required | N/A | |
| Parent/player risk | ✅ None | Counts and summaries only |

**Risk:** Low
**Overall score:** 7/10

---

### `/director/kpi` — KPI Dashboard
**Primary job:** Academy KPI breakdown — attendance rates, development velocity.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ❌ None | KPI engine outputs only; no DONNA panel |
| Page-aware | ❌ No | |
| Object-aware | ❌ No | |
| Can explain | ❌ No | No explanation of what each KPI means or why it's red |
| Can summarize | ❌ No | |
| Can recommend | ❌ No | |
| Can draft | ❌ No | |
| Can route | ❌ No | |
| Can apply | ❌ No | |
| Parent/player risk | ✅ None | |

**Missing context:** DONNA `kpiExplainer.ts` exists in the library but is not wired to this page
**Missing actions:** KPI explanation chips; "what's driving this KPI?" DONNA response; recommended action from KPI state
**Risk:** Low (read-only page)
**Overall score:** 1/10

---

### `/director/signals` — Development Signals
**Primary job:** Surface attendance concerns, wrap-up signals, lesson signals across the academy.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ❌ None | Signals page is data-only |
| Page-aware | ❌ No | |
| Object-aware | ❌ No | |
| Can explain | ❌ No | |
| Can summarize | ❌ No | |
| Can recommend | ❌ No | |
| Can draft | ❌ No | |
| Can route | ❌ No | |
| Can apply | ❌ No | |
| Parent/player risk | ✅ None | Director-only |

**Missing context:** DONNA cannot narrate what the signals mean or what action to take
**Risk:** Medium — high-value triage surface with no DONNA presence
**Overall score:** 1/10

---

### `/director/level-up` — Level Advancement Pipeline
**Primary job:** View players ready or overdue for advancement; trigger assessment pipeline.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ⚠️ Partial | `LevelUpDonnaCTA`, `DonnaOpenChip` |
| Page-aware | ✅ Yes | Pipeline data loaded |
| Object-aware | ❌ No | List view; not player-specific |
| Can explain | ❌ No | |
| Can summarize | ❌ No | |
| Can recommend | ⚠️ Partial | DONNA CTA chip links to DONNA hub |
| Can draft | ❌ No | |
| Can route | ❌ No | |
| Can apply | ❌ No | `donnaLevelMovementActions.ts` exists but not wired here |
| Approval required | N/A | |
| Parent/player risk | ✅ None | |

**Missing context:** DONNA cannot explain why a player is overdue; `donnaLevelMovementActions.ts` is not surfaced
**Risk:** Medium — level movement is high-stakes; DONNA library exists but is not connected to the UI
**Overall score:** 3/10

---

### `/director/placement` — Placement Engine
**Primary job:** Place new/pending players into groups and curriculum levels.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ❌ None | `PlacementEngineClient` has no DONNA panel |
| Page-aware | ❌ No | |
| Object-aware | ❌ No | |
| Can explain | ❌ No | |
| Can summarize | ❌ No | |
| Can recommend | ❌ No | |
| Can draft | ❌ No | `placementDraftAction.ts` creates placement drafts but no DONNA entry point visible |
| Can route | ⚠️ Partial | Placement drafts routed to review queue when triggered |
| Can apply | ❌ No | |
| Approval required | ✅ Yes | `finalize_player_placement()` is gated |
| Parent/player risk | ✅ None | |

**Missing context:** DONNA cannot suggest a level/group based on assessment data; no DONNA explanatory context for the director
**Risk:** Medium — high-stakes decisions with no DONNA guidance
**Overall score:** 2/10

---

### `/director/coaches` — Coaches Directory
**Primary job:** Browse coaches and their assignments.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ❌ None | |
| Page-aware | ❌ No | |
| Object-aware | ❌ No | |
| All dimensions | ❌ No | No DONNA presence |
| Parent/player risk | ✅ None | |

**Risk:** Low
**Overall score:** 1/10

---

### `/director/coaches/[coachId]` — Coach Profile
**Primary job:** View coach assignment, session history, and wrap-up compliance.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ❌ None | No DONNA panel |
| Page-aware | ❌ No | |
| Object-aware | ❌ No | |
| All dimensions | ❌ No | |
| Parent/player risk | ✅ None | |

**Missing context:** DONNA can load coach context via `donnaContextActions` (`coach_profile` type) but this is not wired
**Risk:** Low
**Overall score:** 1/10

---

### `/director/parents` — Parents List
**Primary job:** Browse parent/guardian accounts and linking status.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ❌ None | |
| All dimensions | ❌ No | |
| Parent/player risk | ✅ None | Director view only |

**Risk:** Low
**Overall score:** 1/10

---

### `/director/settings` — Academy Settings
**Primary job:** Update academy name, preferences.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ❌ None | `AcademySettingsForm` only |
| All dimensions | ❌ No | |
| Parent/player risk | ✅ None | |

**Risk:** Low — settings do not need DONNA
**Overall score:** 1/10

---

### `/director/onboarding/interview` — Director Interview
**Primary job:** DONNA-guided director interview to capture academy philosophy and preferences.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ✅ Full | `DirectorInterviewAssistant`, voice-ready with `useRealtimeInterviewVoice` |
| Page-aware | ✅ Yes | Interview step context loaded |
| Object-aware | ✅ Yes | Director profile is the object |
| Can explain | ✅ Yes | Interview script drives the experience |
| Can summarize | ✅ Yes | Answers summarized per step |
| Can recommend | ✅ Yes | Next steps guided |
| Can draft | ✅ Yes | Interview answers feed into curriculum setup |
| Can route | ✅ Yes | Interview routes to next onboarding step |
| Can apply | ⚠️ Partial | Director confirms each step |
| Approval required | ✅ Yes | Director confirms each answer |
| Parent/player risk | ✅ None | Onboarding data is director-only |

**Risk:** Low
**Overall score:** 9/10

---

### `/director/pilot-readiness` — Pilot Readiness Dashboard
**Primary job:** 30-item pilot launch checklist.

| Dimension | Status | Notes |
|---|---|---|
| DONNA presence | ❌ None | Checklist only |
| All dimensions | ❌ No | |
| Parent/player risk | ✅ None | |

**Risk:** Low
**Overall score:** 1/10

---

## Summary scores

| Route | Score | Tier |
|---|---|---|
| `/director/donna` | 8/10 | Fully connected |
| `/director/review` | 9/10 | Fully connected |
| `/director/review/[actionId]` | 8/10 | Fully connected |
| `/director/onboarding/interview` | 9/10 | Fully connected |
| `/director/command-center` | 7/10 | Well connected |
| `/director/today` | 7/10 | Well connected |
| `/director/players/[playerId]` | 7/10 | Well connected |
| `/director/curriculum` | 6/10 | Partially connected |
| `/director/sessions/[sessionId]` | 6/10 | Partially connected |
| `/director/templates/class/[templateId]` | 6/10 | Partially connected |
| `/director/templates` | 4/10 | Partially connected |
| `/director` (dashboard) | 4/10 | Partially connected |
| `/director/level-up` | 3/10 | Weak |
| `/director/placement` | 2/10 | Weak |
| `/director/fitness/templates/[templateId]` | 5/10 | Partially connected |
| `/director/curriculum/builder` | 1/10 | Not connected |
| `/director/curriculum/learning` | 1/10 | Not connected |
| `/director/players` | 1/10 | Not connected |
| `/director/sessions` | 1/10 | Not connected |
| `/director/kpi` | 1/10 | Not connected |
| `/director/signals` | 1/10 | Not connected |
| `/director/coaches` | 1/10 | Not connected |
| `/director/coaches/[coachId]` | 1/10 | Not connected |
| `/director/parents` | 1/10 | Not connected |
| `/director/settings` | 1/10 | Not connected |
| `/director/pilot-readiness` | 1/10 | Not connected |

**Academy-wide DONNA connection score: 4.4/10 (average across 26 audited routes)**
