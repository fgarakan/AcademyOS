# Full Prototype-to-Current-System Fit Audit

**Date:** 2026-05-19
**Auditor:** Claude Code
**Prototypes:** 6 zips in `prototype-reference/`
**Current system:** AcademyOS main branch (commit `061e5af`)

---

## 1. Executive Summary

### Overall prototype fit score: 5 / 10

The prototypes are excellent UX references. They demonstrate the right flow, the right information architecture, the right interaction model, and the right emotional tone for each role. However, they are standalone Vite/Wouter apps with hardcoded fake data, no backend, no auth, no RLS, no role permissions, and no proposed_actions pipeline. They cannot be copied into AcademyOS. They must be rebuilt natively.

### Current AcademyOS fit score: 7 / 10

The current system has the right architecture, the right safety model, the right role structure, and a working backend. It is technically stronger than any prototype. However, its UI flows for coach wrap-up, onboarding scope, and the player/parent portals are either incomplete, too complex, or not aligned with the simpler prototype UX.

### Which prototype areas should become source of truth

- DONNA onboarding: step flow, OnboardingContext state model, live DNA building sidebar, DNA summary card
- Curriculum Builder: CurriculumMap overview, ChangeQueue with risk levels, ImpactPreview, GuidedReview
- Templates: TemplatesHome dashboard, CoachPreview large-block layout, DonnaSuggestions panel
- Coach Portal: CoachToday layout, DonnaWrapUp one-question-per-screen flow, WrapUpReview section summary, SubmittedSummary celebration screen
- Player Portal: MissionMap gamified path, LevelUp requirements screen, AskDonna role-scoped responses
- Parent Portal: Snapshot development card, NextSteps support guidance, RequestLesson pre-filled form, CoachSelection, Confirmation

### Which current areas should remain source of truth

- All backend logic: Supabase DB, RLS, migrations, server actions
- Auth, middleware, role routing
- proposed_actions pipeline (all mutations route through this)
- execute_approved_action() RPC
- DONNA COO layer (sprints 359-378)
- Design tokens: `#0A0A0A` base, `#C8FF00` lime, `#111111` surface, `#222222` border
- Component library: `src/components/ui/`
- All DB type aliases and backend types
- Parent-safe response rules
- Voice role guardrails
- Curriculum learning module data

### Biggest mismatch

**Onboarding scope.** The prototype onboarding is a 5-decision DNA collection flow (Academy Basics, Coaching Philosophy, Coach Communication, Session Design, Player Development). The current app has an 11-step wizard that also builds curriculum, creates templates, uploads players, and adds coaches inside onboarding. The prototype explicitly defers all post-DNA tasks to a Final Activation next-steps list. The current structure must be narrowed to DNA-only.

### Biggest opportunity

**Coach wrap-up.** The prototype DonnaWrapUp (one-question-at-a-time, progress bar, side summary panel) is dramatically simpler and more coach-friendly than the current wrap-up implementation. The current system has the right backend (proposed_actions, observations, session actual persistence) but the UX is fragmented across too many components and routes. Rebuilding the wrap-up UI against the prototype flow, on top of the existing backend, would be the highest-value sprint in the entire build.

### Biggest safety risk

**Prototype state claims.** Every prototype overclaims states: SubmittedSummary says "sent to director queue," DonnaWrapUp says answers are captured, ChangeQueue says changes are "pending approval," RequestLesson says a lesson is submitted. None of these touch a real DB. If any prototype UI component is copied verbatim, it will display "Done" or "Pending" statuses that are cosmetic only. All state display must be wired to real DB rows or must show explicit "draft" / "pending director review" states as AcademyOS requires.

---

## 2. Prototype Inventory Table

| Zip | Screen / Component | Purpose | Best UX idea | Current AcademyOS equivalent | Fit | Action | Backend dependency | Safety risk |
|---|---|---|---|---|---|---|---|---|
| donna-onboarding | WelcomeScreen | DONNA intro, feature cards, 5-step pill preview | Compelling hero with step pill row; no forced mode selection | `director/onboarding/page.tsx` | 4/10 | Adapt | None (onboarding is pre-DB) | Low |
| donna-onboarding | AcademyBasicsScreen | Academy name, age groups, model | Colored age-group chips, large model cards | `AcademyBasicsStep.tsx` | 8/10 | Keep | `academies` table | Low |
| donna-onboarding | CoachingPhilosophyScreen | Up to 3 coaching styles with rank badges | One topic per screen, animated rank badges | `CoachingDnaStep.tsx` (first half) | 7/10 | Adapt | `academies.coaching_philosophy` | Low |
| donna-onboarding | CoachCommunicationScreen | Primary + secondary communication voice | Primary/Secondary buttons per card, two-level selection | `CoachingDnaStep.tsx` (second half) | 7/10 | Split to own step | `academies.communication_style` | Low |
| donna-onboarding | SessionDesignScreen | 7 session blocks + live timeline preview | Block rail timeline preview, single-focus screen | Buried in `CurriculumBuilderStep.tsx` | 5/10 | Extract to own step | `academy_settings.session_blocks` | Low |
| donna-onboarding | PlayerDevelopmentScreen | Top 5 priorities, select + drag-to-reorder | Drag-to-reorder ranked stack, split select/rank panels | Buried in `CurriculumBuilderStep.tsx` | 4/10 | Extract to own step | `academies.player_priorities` | Low |
| donna-onboarding | ParentCommunicationScreen | 7 parent styles, multi-select, DONNA summary | Calm single-topic focus, label examples | `ParentPlayerExperienceStep.tsx` placeholder | 3/10 | Build | `academies.parent_communication_style` | Medium (parent-safe rules apply) |
| donna-onboarding | DNASummaryScreen | Shareable DNA card + section rows + narrative | Shareable card visual, ranked priority badges, Edit links | `AcademyDnaReviewStep.tsx` | 6/10 | Adapt | `academies` record read | Low |
| donna-onboarding | DonnaChatScreen | Full-screen DONNA conversation with proposal cards | Full-screen conversational DONNA, not just a panel | `DonnaAdjustmentDraftPanel` (sidebar only) | 4/10 | Expand to full screen | proposed_actions | High (must go through review queue) |
| donna-onboarding | FinalActivationScreen | Celebration screen + DNA pills + next-steps grid | Celebration tone, "foundation ready" framing, next-steps as cards | `ActivationChecklistStep.tsx` | 3/10 | Adapt | `academies.onboarding_complete` | Low |
| donna-onboarding | DonnaPanel | 320px right sidebar, live DNA build, progress steps | Avatar, animated pulse dot, real-time DNA building | `OnboardingDonnaPanel.tsx` | 6/10 | Adapt | None (reads form state) | Low |
| donna-onboarding | OnboardingContext | Central state manager for 10 screens | Clean state machine with goNext/goPrev/toggleArrayItem | `OnboardingShell.tsx` + props drilling | 7/10 | Adapt state model | None | Low |
| donna-onboarding | ProgressRail | Thin 3px animated progress bar | Smooth width-transition percentage bar | `OnboardingProgressRail.tsx` (node rail) | 4/10 | Keep nodes, add progress bar on Welcome | None | Low |
| curriculum-builder | CurriculumMap | Visual overview of all pathways and levels | Pathway columns, status-colored level cards, DONNA options panel | `src/app/director/curriculum/map/page.tsx` | 5/10 | Adapt | `curriculum_levels`, `curriculum_pathways` | Low |
| curriculum-builder | GuidedReview | Level-by-level DONNA-guided review | Step-by-step with DONNA prompting next action | `src/app/director/curriculum/guided/page.tsx` | 6/10 | Adapt | curriculum tables | Low |
| curriculum-builder | LevelBuilder | Per-level drill/fitness/gate editor | Card-based block editor with DONNA suggestions | `src/app/director/curriculum/builder/page.tsx` | 5/10 | Adapt | `curriculum_levels`, `template_blocks` | Medium (mutations need proposed_actions) |
| curriculum-builder | AddDrill | Drill search + add flow | Search by category, drill card with preview | `src/app/director/curriculum/builder/add-drill/page.tsx` | 6/10 | Keep | `exercises` table | Low |
| curriculum-builder | AddFitness | Fitness exercise search + add | Same pattern as AddDrill | `src/app/director/curriculum/builder/add-fitness/page.tsx` | 6/10 | Keep | `exercises` table | Low |
| curriculum-builder | ImpactPreview | How a change ripples to templates and players | Downstream impact tree before applying | `src/app/director/curriculum/builder/impact-preview/page.tsx` | 7/10 | Adapt | `template_blocks`, `session_blocks`, players | High (must show real counts, not fake) |
| curriculum-builder | RelationshipMap | Visual map of curriculum-to-template-to-session links | Node-edge relationship visualization | Not built | 2/10 | Defer | multiple tables | Low |
| curriculum-builder | ChangeQueue | Pending changes awaiting director approval | Risk level per change, downstream impact per row, approve/edit/reject | `CurriculumBuilderChangeQueue.tsx` | 6/10 | Adapt | `proposed_actions` | High (must not show fake pending states) |
| curriculum-builder | JumpToLevel | Quick level selector with search | Fast jump without scrolling through all levels | `src/app/director/curriculum/builder/` | 4/10 | Add as overlay | `curriculum_levels` | Low |
| curriculum-builder | EmptyState | Curriculum not yet started | Clear CTA to start guided review | None | 5/10 | Adapt | None | Low |
| curriculum-builder | DonnaPanel | DONNA suggestions in curriculum context | Inline quick-action suggestions with context | `CurriculumCustomizationAssistant.tsx` | 5/10 | Adapt | proposed_actions | High |
| templates-prototype | TemplatesHome | Dashboard: stat cards, recent templates, drafts, DONNA | Stat overview + recent templates table + draft progress | `src/app/director/templates/page.tsx` | 4/10 | Adapt | `session_templates`, `template_blocks` | Low |
| templates-prototype | ClassTemplatesLibrary | List of class templates by level/status | Filter by level, status badge, usage count | `src/app/director/templates/class/page.tsx` | 5/10 | Adapt | `session_templates` | Low |
| templates-prototype | CreateClassTemplate | Create flow: name, level, blocks, review | Step-based creation with block timeline preview | `src/app/director/templates/class/create/page.tsx` | 5/10 | Adapt | `session_templates`, `template_blocks` | Medium |
| templates-prototype | ClassTemplateDetail | Template detail with blocks, usage, coach view | Block-by-block detail with edit/preview modes | `src/app/director/templates/class/[templateId]/page.tsx` | 5/10 | Adapt | same tables | Medium |
| templates-prototype | FitnessTemplatesLibrary | List of fitness templates | Same pattern as class library | `src/app/director/fitness/templates/page.tsx` | 5/10 | Adapt | fitness template tables | Low |
| templates-prototype | CreateFitnessTemplate | Fitness template creation | Same pattern as class creation | `src/app/director/fitness/templates/new/page.tsx` | 5/10 | Adapt | same tables | Medium |
| templates-prototype | FitnessTemplateDetail | Fitness template detail | Same pattern as class detail | `src/app/director/fitness/templates/[templateId]/page.tsx` | 5/10 | Adapt | same tables | Low |
| templates-prototype | CoachPreview | Large-block on-court view of template | Big readable blocks with watchFor cues, on-court font size | `src/app/director/templates/coach-preview/page.tsx` | 6/10 | Adapt | `template_blocks` | Low |
| templates-prototype | TemplateImpactPreview | How template affects players/sessions | Similar to curriculum ImpactPreview | `src/app/director/templates/impact-preview/page.tsx` | 6/10 | Adapt | `session_blocks`, players | High |
| templates-prototype | DonnaSuggestions | DONNA template suggestions | Suggestion cards with accept/edit/skip | `src/app/director/templates/donna-suggestions/page.tsx` | 5/10 | Adapt | proposed_actions | High |
| coach-portal | CoachToday | Coach daily landing: sessions, wrap-ups, player priorities, DONNA | DONNA suggestion banner at top, clean session cards, wrap-up status | `src/app/coach/page.tsx` | 5/10 | Adapt | `daily_sessions`, `session_attendance` | Low |
| coach-portal | SessionPlan | Session detail with template, players, curriculum focus | Block timeline, player list, DONNA coaching cues | `src/app/coach/sessions/[sessionId]/page.tsx` | 5/10 | Adapt | `daily_sessions`, `template_blocks` | Low |
| coach-portal | TemplateExecution | On-court execution view of session | Timer per block, checkboxes, simplified on-court view | `src/app/coach/sessions/[sessionId]/execute/page.tsx` | 5/10 | Adapt | same tables | Low |
| coach-portal | PlayerWatchList | Players needing attention across sessions | Priority flags, observation links | `CoachPlayerWatchList.tsx` | 6/10 | Adapt | `players`, coach notes | Low |
| coach-portal | DonnaAssistant | DONNA chat for coaches | Role-scoped chat, suggested prompts | `src/app/coach/donna/page.tsx` | 5/10 | Adapt | proposed_actions, roleGuardrails | High |
| coach-portal | DonnaWrapUp | One-question-at-a-time DONNA wrap-up | Single question, progress bar, side summary accumulator | `WrapUpGuidedFlow.tsx` + wrap-up pages | 4/10 | Rebuild UX on existing backend | observations, proposed_actions | High (must go to review queue) |
| coach-portal | AttendanceException | Absence/exception capture | Reason select, player select, note field | `WrapUpAttendanceInput.tsx` | 5/10 | Adapt | `session_attendance` | Medium |
| coach-portal | PlayerObservation | Quick player observation entry | Player select, focus tag, observation text, sentiment | `WrapUpPlayerObservationInput.tsx` | 6/10 | Adapt | `coach_notes`, proposed_actions | High |
| coach-portal | WrapUpReview | Multi-section review before submit | Section-by-section summary with edit options | `WrapUpReviewSummary.tsx` | 5/10 | Adapt | multiple tables | High |
| coach-portal | SubmittedSummary | Post-submission celebration screen | Celebration header, status per item (Done/Pending/Awaiting) | None built as standalone | 2/10 | Build | Read from proposed_actions status | High |
| coach-portal | PortalLayout | Coach mobile layout shell | Bottom tab navigation, clean header | `src/app/coach/layout.tsx` + `BottomTabBar.tsx` | 7/10 | Keep current, minor adapt | None | Low |
| coach-portal | AcademyOSBrand | Brand chip in header | Small brand mark at top of coach screens | None (just page titles) | 3/10 | Add as minor component | None | Low |
| player-portal | PlayerHome | My training path entry screen | Path cards (skill/competition/fitness), streak, current focus | `src/app/player/page.tsx` | 5/10 | Adapt | `players`, `individual_development_plans` | Low |
| player-portal | MissionMap | Gamified visual mission path with lock/unlock states | Lock states, progress % per mission, badge rewards | `src/app/player/missions/page.tsx` | 4/10 | Adapt | `player_priorities`, coach notes for evidence | Medium |
| player-portal | MissionDetail | Single mission with evidence, progress, reward | Evidence list, coach-confirmed indicator, reward badge | `src/app/player/missions/[priorityId]/page.tsx` | 4/10 | Adapt | same + coach notes | Medium |
| player-portal | SkillPath | Skill development progress by domain | Domain progress bars, current focus areas | `src/app/player/skill-path/page.tsx` | 5/10 | Adapt | `individual_development_plans` | Low |
| player-portal | CompetitionPath | Match results, UTR, targets | UTR trend, match log, next target | `src/app/player/competition-path/page.tsx` | 5/10 | Adapt | UTR data, match results | Low |
| player-portal | FitnessPath | Fitness load and conditioning progress | Volume trend, fatigue indicator, weekly load | `src/app/player/fitness-path/page.tsx` | 5/10 | Adapt | fitness/load data | Low |
| player-portal | LevelUp | Level-up requirements checklist | Requirements with done/not done, progress %, coach approval note | `src/app/player/level-up/page.tsx` | 5/10 | Adapt | `players.curriculum_level`, assessment gates | Medium |
| player-portal | PracticeHome | Today's practice plan | Focused drill, session tip, practice log | `src/app/player/practice/page.tsx` | 4/10 | Adapt | sessions, curriculum focus | Low |
| player-portal | Celebration | Level-up or achievement celebration | Confetti, badge reveal, next mission preview | `src/app/player/celebration/page.tsx` | 5/10 | Adapt | None (presentation only) | Low |
| player-portal | AskDonna | Player-safe DONNA chat | Role-scoped responses, quick questions, typing indicator | `src/app/player/ask-donna/page.tsx` | 4/10 | Adapt | `parentSafeResponseRules`, player IDP | High (must respect parent-safe rules for player content) |
| parent-portal | Home | Parent landing: child overview card, nav | Child name + level summary, clean navigation grid | `src/app/parent/page.tsx` | 5/10 | Adapt | `players`, guardian linkage | Medium |
| parent-portal | Snapshot | Child development progress snapshot | Level card with current/next, priorities list, coach-approved note badge | `src/app/parent/development/page.tsx` | 5/10 | Adapt | `players`, `individual_development_plans` | High (parent-safe rules) |
| parent-portal | SkillPath | Parent view of skill development | Simplified domain progress, plain language labels | `src/app/parent/progress/page.tsx` | 5/10 | Adapt | IDP data | High (parent-safe) |
| parent-portal | CompetitionPath | Parent view of match progress | UTR context, match summary, next event | Not built as separate parent route | 2/10 | Build | UTR, match results | High (parent-safe) |
| parent-portal | FitnessPath | Parent view of fitness progress | Simplified load summary, wellbeing note | Not built as separate parent route | 2/10 | Defer | fitness data | High (parent-safe) |
| parent-portal | NextSteps | How to support your child this month | Calm guidance cards: at home, at events, avoid doing | Not built | 1/10 | Build | IDP director-approved next steps | High (parent-safe, must be director-approved) |
| parent-portal | RequestLesson | Private lesson request form | Pre-filled from player data, focus area, coach preference | `PrivateLessonRequestCard.tsx` (partial) | 4/10 | Adapt | proposed_actions (request goes to review) | High (must go through review queue, not direct booking) |
| parent-portal | CoachSelection | Coach choice after lesson request | Coach cards with specialty, availability note | Not built | 1/10 | Build (after request flow) | coaches table | Medium |
| parent-portal | Confirmation | Lesson request confirmation | Clean confirmation with pending status, no false "booked" claim | Not built | 1/10 | Build | proposed_actions read | High (must say "pending review" not "booked") |
| parent-portal | Message | Parent messaging / updates | Simple message list, director-approved content only | `src/app/parent/updates/page.tsx` | 4/10 | Adapt | communications, parent-safe rules | High |

---

## 3. Current System Inventory

| Route | Current purpose | Prototype improves it | Preserve route | Replace visually | Backend logic stays |
|---|---|---|---|---|---|
| `/director/onboarding` | 11-step wizard: DNA, curriculum, templates, players, coaches | Yes — narrow to DNA-only (5 decisions) | Yes | Yes — adopt prototype's one-topic-per-screen model | Yes — server actions stay |
| `/director` | Director dashboard: KPI, alerts, sessions, review queue | No — prototype has no director dashboard | Yes | No — current is stronger | Yes |
| `/director/players` | Player directory with search/filter | No direct prototype equivalent | Yes | No | Yes |
| `/director/players/[playerId]` | 5-tab player profile | No direct prototype equivalent | Yes | No | Yes |
| `/director/curriculum` | Curriculum explorer + level detail | Yes — CurriculumMap overview is better | Yes | Partial — add map overview | Yes |
| `/director/curriculum/map` | Curriculum map page | Yes — adopt prototype CurriculumMap visual | Yes | Yes | Yes |
| `/director/curriculum/builder` | Curriculum builder with change queue | Yes — prototype ChangeQueue is better | Yes | Partial | Yes |
| `/director/curriculum/guided` | DONNA-guided review | Yes — prototype GuidedReview flow is cleaner | Yes | Partial | Yes |
| `/director/templates` | Templates home | Yes — prototype TemplatesHome dashboard is better | Yes | Yes | Yes |
| `/director/templates/class` | Class templates library | Yes — prototype library has better filters | Yes | Partial | Yes |
| `/director/templates/class/[id]` | Template detail | Yes — prototype CoachPreview block view | Yes | Partial | Yes |
| `/director/templates/fitness` | Fitness templates | Same as class | Yes | Partial | Yes |
| `/director/templates/coach-preview` | Coach preview of template | Yes — prototype CoachPreview is a direct match target | Yes | Yes | Yes |
| `/director/review` | Review queue: 8 tab types | No direct prototype equivalent — current is stronger | Yes | No | Yes |
| `/director/command-center` | DONNA command center | No direct prototype equivalent | Yes | No | Yes |
| `/director/sessions` | Sessions list + detail | No direct prototype equivalent | Yes | No | Yes |
| `/coach` | Coach workspace | Yes — prototype CoachToday is better entry | Yes | Yes (adopt CoachToday layout) | Yes |
| `/coach/sessions/[id]` | Session detail + wrap-up | Yes — prototype DonnaWrapUp is much better UX | Yes | Yes — rebuild wrap-up UX | Yes |
| `/coach/sessions/[id]/wrap-up` | Coach wrap-up form | Yes — prototype one-question flow is stronger | Yes | Yes — adopt one-question-at-a-time | Yes |
| `/coach/sessions/[id]/wrap-up/review` | Wrap-up review | Yes — prototype WrapUpReview section model is better | Yes | Yes | Yes |
| `/coach/donna` | DONNA coach shell | Partial — prototype DonnaAssistant is simpler | Yes | Partial | Yes |
| `/player` | Player home | Yes — prototype PlayerHome path cards are better | Yes | Yes | Yes |
| `/player/missions` | Player missions list | Yes — prototype MissionMap gamified path is better | Yes | Yes | Yes |
| `/player/missions/[id]` | Mission detail | Yes — prototype MissionDetail is better | Yes | Yes | Yes |
| `/player/skill-path` | Skill path | Partial match | Yes | Partial | Yes |
| `/player/level-up` | Level-up requirements | Yes — prototype LevelUp requirements list is better | Yes | Yes | Yes |
| `/player/ask-donna` | DONNA for player | Yes — prototype AskDonna quick-questions + typing indicator | Yes | Yes | Yes |
| `/parent` | Parent home | Yes — prototype Home child card is cleaner | Yes | Yes | Yes |
| `/parent/development` | Development snapshot | Yes — prototype Snapshot level card is better | Yes | Yes | Yes |
| `/parent/progress` | Progress page | Partial | Yes | Partial | Yes |
| `/platform` | Platform owner | No prototype equivalent — current is correct | Yes | No | Yes |

---

## 4. Unified Product Map

### /director/onboarding — Academy DNA Setup only

First-run experience. Five decisions: Academy Basics, Coaching Philosophy, Coach Communication, Session Design, Player Priorities.
Followed by DNA Summary and Final Activation (next-steps as cards, not a required checklist).
Nothing else. Curriculum build, template creation, player upload, coach setup are post-activation tasks.

### /director/curriculum — Curriculum Builder module

Entry: CurriculumMap overview (pathway columns, status badges, DONNA panel).
Flows: GuidedReview, LevelBuilder, AddDrill, AddFitness, ImpactPreview, ChangeQueue.
All mutations go through proposed_actions. ChangeQueue shows only real pending actions from DB.

### /director/templates — Class and fitness template module

Entry: TemplatesHome dashboard (stat cards, recent templates, drafts).
Flows: Class library, Create class, Class detail, Coach preview.
Same pattern for fitness. DonnaSuggestions sidebar. TemplateImpactPreview before applying.

### /coach — Coach daily execution and wrap-up

Entry: CoachToday (DONNA suggestion banner, next session card, missing wrap-ups, player priorities).
Flows: SessionPlan, TemplateExecution (on-court), DonnaWrapUp (one-question), WrapUpReview, SubmittedSummary.
PlayerWatchList, DonnaAssistant.

### /player — Missions and development view

Entry: PlayerHome (path cards with progress).
Flows: MissionMap, MissionDetail, SkillPath, CompetitionPath, FitnessPath, LevelUp, PracticeHome, Celebration, AskDonna.

### /parent — Parent-safe progress and support

Entry: Parent Home (child card, nav grid).
Flows: Snapshot, SkillPath, CompetitionPath, FitnessPath, NextSteps, RequestLesson, CoachSelection, Confirmation, Message.
All content must pass parentSafeResponseRules. All parent actions (lesson request) go to proposed_actions pending director review.

### /platform — Platform owner / multi-academy view

Not in prototypes. Current implementation stays as-is. No prototype influence.

---

## 5. What Works from the Prototypes

**DONNA-guided setup (donna-onboarding)**
One topic per screen. Context state machine with goNext/goPrev/toggleArrayItem. Live DNA building in DONNA sidebar. This is the right interaction model and must replace the current multi-topic-per-step pattern.

**Progress rail (donna-onboarding)**
Thin 3px animated percentage bar is more elegant than numbered node rail. Both can coexist: bar for progress, pill preview for orientation.

**DNA Summary as a shareable card (donna-onboarding)**
The DNASummaryScreen shows academy DNA as a branded card with ranked priorities, style badges, and narrative text. This is a key emotional moment that the current `AcademyDnaReviewStep` approximates but does not fully deliver. Must be built as a visually distinct "your academy identity" card.

**Curriculum Map visual overview (curriculum-builder)**
Pathway column layout with status-colored level cards and a "Curriculum Health" summary in the DONNA panel is immediately scannable. Current `/director/curriculum/map` exists but is not as visually organized.

**Change Queue with risk levels (curriculum-builder)**
Each pending change shows: source (DONNA/Director/Coach), level, downstream impact, and risk level (low/medium/high). The current `CurriculumBuilderChangeQueue.tsx` exists but needs this risk and impact information surfaced per row. Must be wired to real proposed_actions rows, not fake data.

**Template CoachPreview large-block layout (templates-prototype)**
The prototype CoachPreview shows each block with a large readable name, duration, focus, drills list, and "watch for" cue — designed for on-court tablet use. This is a direct improvement target for the current coach-preview route.

**CoachToday with DONNA suggestion banner (coach-portal)**
The prototype entry screen puts a DONNA suggestion banner at the top, followed by the next session card, missing wrap-ups, and player priorities. This is exactly the right entry point for a coach starting their day. Current `/coach` page has the data but not this visual hierarchy.

**DonnaWrapUp one-question-at-a-time (coach-portal)**
Six questions shown one at a time. Progress bar at top. Side summary panel builds as answers come in. Each question has a hint and placeholder. Some questions have a "Log as exception" or "Add player observation" branch. This is the right interaction model. Current wrap-up is multi-field forms. Must rebuild wrap-up UX to match this model, on top of the existing observations and proposed_actions backend.

**WrapUpReview section summary (coach-portal)**
Before submit, shows each section (Attendance, Session Actual, Player Observations, Curriculum Evidence, Director Items, Parent Drafts, Next Session) with status and edit option. Current `WrapUpReviewSummary.tsx` exists but visual design is weaker. Adapt to prototype section model.

**SubmittedSummary celebration screen (coach-portal)**
After wrap-up submit, shows a success header + per-item status (Done/Pending/Awaiting). This is missing entirely from the current system. Must be built. Critical: each status item must reflect real DB state, not hardcoded "Done."

**MissionMap gamified path (player-portal)**
Missions displayed as a vertical path with lock/unlock states, progress percentages, evidence notes, and badge rewards. Current player missions page exists but lacks the gamified visual path. High-value adaptation.

**LevelUp requirements screen (player-portal)**
Shows each gate requirement with a done/not-done indicator, detail text, and a progress percentage. Current `/player/level-up` exists. Adapt to this exact visual model wired to real assessment gate data.

**AskDonna quick questions + typing indicator (player-portal)**
Pre-populated quick-question buttons remove blank-screen friction. Typing indicator creates conversational feel. Both are low-effort, high-value UX additions.

**Parent Snapshot development card (parent-portal)**
Shows current level, next level, priorities list, and a coach-approved note badge. The "coach-approved" badge is important — it signals to parents that what they are seeing has been reviewed. Must be present and wired to real approval state.

**NextSteps parent support guidance (parent-portal)**
Shows calm, simple guidance for the parent: what to do at home, what to do at matches, what not to do. This is not in the current parent portal. Must be built from director-approved IDP next-steps. Never AI-generated without director review.

**RequestLesson pre-filled form (parent-portal)**
Form pre-fills player name and current development focus. Reduces form friction. Lesson request goes to proposed_actions for director review. Confirmation screen must say "pending review" not "booked."

---

## 6. What Does Not Work from the Prototypes

**Standalone routing (wouter)**
All six prototypes use Vite + Wouter standalone apps. Routes like `/donna-wrapup`, `/submitted-summary`, `/skill-path` are standalone. These must never be copied into AcademyOS. All routing must be Next.js App Router under the correct role-scoped parent route.

**Copied UI kits**
All prototypes ship a full copy of a Radix-based UI kit in `components/ui/`. Do not copy these. AcademyOS already has `src/components/ui/` with its own component library and design tokens. Use those.

**Fake/static state**
Every prototype uses hardcoded data files (e.g., `curriculumData.ts`, `lib/data.ts`) or inline arrays with fake player names, fake levels, fake template names. None of this data comes from a DB. Any copied UI that renders these fake values must be completely rewired to real DB queries before it can appear in AcademyOS.

**No backend safety**
Prototypes have no server actions, no RLS, no proposed_actions, no audit_logs. They simulate completion states (submitted, applied, sent, booked) with client-side navigation. Every prototype action that implies a state change must be replaced with either a real DB write through the proposed_actions pipeline or a draft state that is explicit about pending review.

**No role permissions**
Prototypes have no auth. Any user can see any page. AcademyOS middleware enforces role routing. Never add a route that is accessible without the correct role check.

**Overclaiming states**
SubmittedSummary says "sent to director queue" — this must only show if a real proposed_action row exists.
DonnaWrapUp says answers are "captured" — must only show if a real DB write succeeded.
ChangeQueue says changes are "pending approval" — must only show real proposed_actions rows from DB.
RequestLesson Confirmation must say "pending director review" not "lesson booked."

**Duplicate layouts**
Each prototype has its own layout shell (OnboardingLayout, AppLayout, PortalLayout) using their own CSS variables. These must not be adopted. Use the existing AcademyOS layouts: `director/layout.tsx` with `SidebarNav`, `coach/layout.tsx` with `BottomTabBar`, and role-specific mobile layouts for player/parent.

**oklch() color space**
Prototypes use `oklch()` colors throughout. AcademyOS uses named design tokens (`--base`, `--surface`, `--lime`, etc.) defined in `tailwind.config.ts` and `globals.css`. Do not introduce oklch() values into AcademyOS. Map all prototype colors to the nearest AcademyOS token:
- Prototype teal `#00C9A7` → `text-lime` / `border-lime` (AcademyOS uses `#C8FF00` lime, not teal — preserve this)
- Prototype dark `#0A0F0E` → `bg-base` (`#0A0A0A`)
- Prototype surface `#111A18` → `bg-surface` (`#111111`)
- Prototype border `rgba(0,201,167,0.08)` → `border-border` (`#222222`)

**Custom font stacks**
Prototypes use Syne, Space Grotesk, Barlow Condensed fonts. AcademyOS uses Inter (sans) and JetBrains Mono (mono). Do not import or reference prototype font stacks.

**No RLS or security awareness**
Prototypes never check `academy_id`. Never check guardian linkage. Never enforce that a parent can only see their child. All these checks must be present in AcademyOS server components and server actions.

---

## 7. Recommended Final Structure

```
Academy DNA Setup (first-run)
  -> 5-screen DNA collection
  -> DNA Summary card
  -> Final Activation (next-steps grid)

Director Post-Activation Setup
  -> Curriculum Builder
     -> CurriculumMap overview
     -> GuidedReview
     -> LevelBuilder (AddDrill, AddFitness, ImpactPreview)
     -> ChangeQueue (proposed_actions from DB)
  -> Templates
     -> TemplatesHome dashboard
     -> Class library, Create, Detail
     -> Fitness library, Create, Detail
     -> CoachPreview
     -> DonnaSuggestions
  -> DONNA Review Queue (existing, keep as-is)

Coach Execution (daily)
  -> CoachToday (DONNA banner, next session, wrap-up status)
  -> SessionPlan -> TemplateExecution
  -> DonnaWrapUp (one-question, 6 questions)
  -> WrapUpReview (section summary)
  -> SubmittedSummary (real DB status)

Director Review / Evidence
  -> Review Queue (existing, keep)
  -> Player profile tabs (existing, keep)
  -> Sessions evidence view (existing, keep)

Player Missions
  -> PlayerHome (path cards)
  -> MissionMap (gamified, lock/unlock)
  -> MissionDetail (evidence, progress)
  -> SkillPath, CompetitionPath, FitnessPath
  -> LevelUp (requirements checklist)
  -> PracticeHome, Celebration
  -> AskDonna (role-scoped, quick questions)

Parent-Safe Progress
  -> Parent Home (child card)
  -> Snapshot (level card, priorities, coach-approved badge)
  -> SkillPath, CompetitionPath, FitnessPath (simplified)
  -> NextSteps (director-approved support guidance)

Lesson Request / Support
  -> RequestLesson (pre-filled form -> proposed_actions)
  -> CoachSelection
  -> Confirmation ("pending review")
  -> Message (director-approved content)

DONNA Insights
  -> Director: command-center, daily brief, recommendations (existing, keep)
  -> Coach: DonnaAssistant role-scoped
  -> Player: AskDonna player-scoped
  -> Parent: (no direct DONNA — all through director-reviewed content)
```

---

## 8. Academy DNA Setup Decision

**Confirmed: First-run onboarding must be Academy DNA Setup only.**

The five decisions:
1. Academy Basics (name, age groups, model)
2. Coaching Philosophy (up to 3 styles, ranked)
3. Coach Communication (primary + secondary voice)
4. Session Design (session block defaults + timeline preview)
5. Player Development (top 5 priorities, ranked)

These five decisions define the Academy DNA. They require no DB migrations. They write to the `academies` table fields that already exist. They can be completed in 10-15 minutes.

The following are **not** part of DNA Setup onboarding and must be deferred to post-activation tasks surfaced in the Final Activation next-steps grid:
- Full curriculum build (becomes post-DNA setup task)
- Class template creation (becomes post-DNA setup task)
- Fitness template creation (becomes post-DNA setup task)
- Player upload / placement engine (separate workflow)
- Coach setup and permissions (separate workflow)
- Portal preview for coaches/players/parents (separate workflow)

The current onboarding steps 3 (CurriculumBuilderStep) and 4 (FirstClassTemplateStep) must be removed from the onboarding flow. They become cards in the Final Activation next-steps grid that link to `/director/curriculum/builder` and `/director/templates`.

Steps 5-9 in the current flow (FitnessTemplate, PlayerUpload, AddCoaches, PortalPreview, ActivationChecklist) must also be removed from onboarding. They become post-activation tasks in the director dashboard.

---

## 9. Module-by-Module Recommendation

### Onboarding

**Keep from prototype:** One-topic-per-screen model, OnboardingContext state machine, live DNA building in DONNA sidebar, DNA Summary card visual, Final Activation as celebration + next-steps grid.

**Keep from current:** Server actions that write to `academies` table, `OnboardingShell` layout shell, `OnboardingProgressRail` (adapt to add thin bar), `OnboardingDonnaPanel` (adapt to add better DONNA identity mark), draft-only safety model.

**Replace:** Remove CurriculumBuilderStep, FirstClassTemplateStep, FitnessTemplateStep, PlayerUploadStep, CoachesPermissionsStep, PortalPreviewStep, ActivationChecklistStep from onboarding flow. These become post-DNA tasks.

**Defer:** DONNA Chat as full-screen conversation during onboarding (requires AI integration). For now, DNA Summary + panel messaging is sufficient.

**Safety notes:** Onboarding writes to `academies` table. RLS must ensure only the academy_director for this academy can write. No parent, coach, or player data is touched during DNA setup.

**Next implementation sprint:** Sprint 379 — Academy DNA Setup Scope Repair: remove non-DNA steps from onboarding flow, rebuild WelcomeScreen against prototype hero, add step pill preview, update Final Activation to celebration card.

---

### Curriculum

**Keep from prototype:** CurriculumMap pathway column layout, ChangeQueue risk-level and downstream-impact per row, ImpactPreview downstream tree, GuidedReview DONNA-guided step flow, JumpToLevel overlay.

**Keep from current:** All DB queries against real `curriculum_levels`, `curriculum_pathways`, `template_blocks`. `CurriculumBuilderChangeQueue.tsx` backbone. `CurriculumCustomizationAssistant.tsx` DONNA integration. All proposed_actions wiring.

**Replace:** ChangeQueue must show only real proposed_actions rows from DB (no fake CHANGES array). ImpactPreview must show real downstream counts. CurriculumMap must render real pathway/level data.

**Defer:** RelationshipMap (node-edge graph) — complex, not essential for V1.

**Safety notes:** All curriculum mutations must create proposed_actions rows with status `pending_review`. No direct writes to curriculum tables from the builder UI without director approval. ChangeQueue must never show fake pending states.

**Next implementation sprint:** Sprint 382 — Curriculum Map Visual Rebuild.

---

### Templates

**Keep from prototype:** TemplatesHome stat card dashboard, CoachPreview large-block on-court layout, DonnaSuggestions panel pattern.

**Keep from current:** All template DB queries, template builder stepper, block picker, `session_templates` and `template_blocks` schema.

**Replace:** Templates home must show real stat cards (counts from DB, not hardcoded). CoachPreview must render real template blocks from DB. DonnaSuggestions must show real proposed_actions suggestions.

**Defer:** TemplateImpactPreview downstream tree (high complexity, build after curriculum impact preview is stable).

**Safety notes:** Template creation writes to `session_templates` and `template_blocks`. Must include `academy_id`. Must have RLS. DONNA template suggestions go through proposed_actions.

**Next implementation sprint:** Sprint 385 — Templates Home Dashboard Rebuild.

---

### Coach Portal

**Keep from prototype:** CoachToday DONNA banner layout, DonnaWrapUp one-question-at-a-time UX, WrapUpReview section-by-section summary, SubmittedSummary celebration + status screen, PlayerWatchList priority flag pattern.

**Keep from current:** All coach backend: `coachWorkspace.ts`, session attendance, observations, proposed_actions pipeline, wrap-up persistence, `BottomTabBar` navigation.

**Replace:** Rebuild `/coach` page to match CoachToday layout. Rebuild wrap-up UI to one-question-at-a-time flow. Add SubmittedSummary screen reading real proposed_actions statuses.

**Defer:** AcademyOSBrand chip component (cosmetic, low priority).

**Safety notes:** DonnaWrapUp answers must go through proposed_actions, not direct DB writes. SubmittedSummary statuses must be read from real proposed_actions rows, not hardcoded. Coach cannot see other coaches' observations or students outside their assigned groups.

**Next implementation sprint:** Sprint 388 — Coach Today Layout Rebuild.

---

### Player Portal

**Keep from prototype:** MissionMap gamified path with lock/unlock states, MissionDetail evidence list, LevelUp requirements checklist with gate progress, AskDonna quick questions and typing indicator, Celebration screen.

**Keep from current:** Player portal backend: IDP data, `playerProgressQa.ts`, player role middleware, `BottomTabBar` navigation.

**Replace:** PlayerHome to match path card layout. Missions page to match MissionMap gamified path. Level-up page to match requirements checklist wired to real assessment gates.

**Defer:** PracticeHome (requires session planning integration), Celebration confetti animation (cosmetic).

**Safety notes:** Player portal must only show the player's own data. `profile_id` linkage must be verified on every DB query. AskDonna responses must be role-scoped and must not reveal coach-internal notes or director-only data.

**Next implementation sprint:** Sprint 392 — Player Portal Home + MissionMap Rebuild.

---

### Parent Portal

**Keep from prototype:** Snapshot level card with current/next level and coach-approved badge, NextSteps support guidance cards, RequestLesson pre-filled form, CoachSelection, Confirmation "pending review."

**Keep from current:** Parent-safe response rules, guardian linkage enforcement, parent role middleware, parentSafeResponseRules.ts.

**Replace:** Parent home to match child card layout. Development page to match Snapshot card. Add NextSteps page with director-approved guidance. Build RequestLesson -> CoachSelection -> Confirmation flow through proposed_actions.

**Defer:** FitnessPath parent view (build after coach fitness tracking is stable), Message thread view.

**Safety notes:** Every parent-facing data point must pass `parentSafeResponseRules`. The "coach-approved" badge on Snapshot must reflect a real `show_to_parent: true` flag on the player development summary. Lesson request confirmation must never say "booked" — must say "sent for review." Parent cannot initiate lesson request to bypass the director review queue.

**Next implementation sprint:** Sprint 396 — Parent Portal Home + Snapshot Rebuild.

---

### Platform

**Keep from prototype:** No prototype for platform — current is the reference.

**Keep from current:** Platform owner portal, multi-academy preview mode, demo sandbox controls.

**Replace:** Nothing at this time.

**Defer:** Platform portal is not on the Brian pilot path.

**Safety notes:** Platform owner views must never leak into academy director views. Demo mode data must never contaminate live data. All platform_owner gates are already in the middleware — do not relax them.

**Next implementation sprint:** None in near-term sprint plan.

---

### DONNA

**Keep from prototype:** DonnaWrapUp conversational one-question model, DonnaAssistant role-scoped quick prompts, AskDonna typing indicator and quick questions, CurriculumMap DONNA options panel.

**Keep from current:** All of sprints 359-378 (DONNA COO Foundation Layer). proposed_actions pipeline. execute_approved_action() RPC. Role guardrails. Parent-safe content filter. Message review panel. Daily brief. What Needs Attention Engine.

**Replace:** DONNA UI entry points (DonnaOpenChip, DonnaPanelShell) should adopt prototype's cleaner conversational entry. DONNA in wrap-up should follow one-question model.

**Defer:** Full AI/STT voice integration (current text-only implementation is correct for V1).

**Safety notes:** DONNA must never directly mutate data. All DONNA outputs go through proposed_actions or draft layer. DONNA must never imply certainty from insufficient data. DONNA outputs must show confidence and data source. Role guardrails must be checked before any DONNA response.

---

## 10. Build Sequence Recommendation (Sprints 379 - 428)

### Phase A: Onboarding Repair and Route Alignment

| Sprint | Action | Files |
|---|---|---|
| 379 | Academy DNA Setup Scope Repair — remove non-DNA steps, rebuild Welcome, update Final Activation to next-steps grid | `onboarding/page.tsx`, `OnboardingShell.tsx`, step components |
| 380 | Coaching DNA step split — separate CoachingPhilosophyStep and CoachCommunicationStep | `CoachingDnaStep.tsx` split into two |
| 381 | Session Design + Player Priorities extraction — give each its own screen | Extract from `CurriculumBuilderStep.tsx` |
| 382 | DNA Summary visual rebuild — shareable card format, ranked badges, narrative | `AcademyDnaReviewStep.tsx` |
| 383 | Final Activation celebration rebuild — emotional tone, next-steps as action cards | `ActivationChecklistStep.tsx` |

### Phase B: Curriculum Module

| Sprint | Action | Files |
|---|---|---|
| 384 | Curriculum Map visual rebuild — pathway columns, status cards, DONNA options | `curriculum/map/page.tsx`, new CurriculumPathwayColumn component |
| 385 | Change Queue risk level and impact display — real proposed_actions rows, risk badges, downstream counts | `CurriculumBuilderChangeQueue.tsx` |
| 386 | Guided Review DONNA step flow — one-level-at-a-time, DONNA prompt per level | `curriculum/guided/page.tsx` |
| 387 | Impact Preview downstream tree — real counts from DB for templates and players | `curriculum/builder/impact-preview/page.tsx` |
| 388 | Jump To Level overlay | New component, curriculum builder integration |

### Phase C: Template Module

| Sprint | Action | Files |
|---|---|---|
| 389 | Templates Home dashboard rebuild — real stat cards from DB, recent templates, draft progress | `director/templates/page.tsx` |
| 390 | CoachPreview large-block on-court layout — adapt prototype blocks to real template_blocks data | `director/templates/coach-preview/page.tsx` |
| 391 | Template Impact Preview — downstream session and player count | `director/templates/impact-preview/page.tsx` |
| 392 | DONNA Suggestions panel — real proposed_actions suggestions in templates context | `director/templates/donna-suggestions/page.tsx` |

### Phase D: Coach Portal

| Sprint | Action | Files |
|---|---|---|
| 393 | Coach Today layout rebuild — DONNA suggestion banner, next session card, wrap-up status | `src/app/coach/page.tsx` |
| 394 | DonnaWrapUp one-question UX rebuild — 6 questions, progress bar, side summary panel | Rebuild `WrapUpGuidedFlow.tsx` against prototype model |
| 395 | WrapUpReview section summary rebuild — section-by-section with edit links | `WrapUpReviewSummary.tsx` |
| 396 | SubmittedSummary celebration screen — new screen, reads real proposed_actions statuses | New `src/app/coach/sessions/[sessionId]/wrap-up/submitted/page.tsx` |
| 397 | PlayerWatchList priority flag pattern — adapt to prototype layout | `CoachPlayerWatchList.tsx` |
| 398 | Coach wrap-up QA — end-to-end wrap-up test with real data | QA sprint, no new files |

### Phase E: Player Portal

| Sprint | Action | Files |
|---|---|---|
| 399 | PlayerHome path card layout — skill/competition/fitness card grid with real IDP data | `src/app/player/page.tsx` |
| 400 | MissionMap gamified path — lock/unlock states from real priorities and evidence | `src/app/player/missions/page.tsx` |
| 401 | MissionDetail evidence and progress — real coach notes linked as evidence | `src/app/player/missions/[priorityId]/page.tsx` |
| 402 | LevelUp requirements checklist — real assessment gates from DB | `src/app/player/level-up/page.tsx` |
| 403 | AskDonna quick questions + typing indicator | `src/app/player/ask-donna/page.tsx` |
| 404 | Celebration screen polish | `src/app/player/celebration/page.tsx` |

### Phase F: Parent Portal

| Sprint | Action | Files |
|---|---|---|
| 405 | Parent Home child card layout — level summary, nav grid, guardian linkage check | `src/app/parent/page.tsx` |
| 406 | Snapshot development card — level current/next, priorities, coach-approved badge | `src/app/parent/development/page.tsx` |
| 407 | NextSteps parent support guidance — director-approved next steps from IDP | New `src/app/parent/next-steps/page.tsx` |
| 408 | RequestLesson form rebuild — pre-filled from player IDP, to proposed_actions | `PrivateLessonRequestCard.tsx` + new request page |
| 409 | CoachSelection + Confirmation screens — pending review status, never "booked" | New pages in `/parent/request/` |
| 410 | Parent portal QA — end-to-end parent-safe rules check | QA sprint |

### Phase G: Brian Demo Mode Readiness

| Sprint | Action | Files |
|---|---|---|
| 411 | Demo mode seed data audit — confirm all demo data paths are clearly marked | `DemoSandboxControls.tsx`, demo page |
| 412 | Demo script alignment — Brian pilot path covers DNA setup, curriculum map, wrap-up, player portal | Demo script doc update |
| 413 | Brian pilot QA — test all five core paths with real Dabul Tennis Academy data | QA sprint |

### Phase H: DONNA Voice/Assistant Consistency

| Sprint | Action | Files |
|---|---|---|
| 414 | DONNA entry point consistency — DonnaPanelShell, DonnaOpenChip adopt prototype conversational entry | `DonnaPanelShell.tsx`, `DonnaOpenChip.tsx` |
| 415 | Curriculum DONNA options panel — DONNA quick actions in CurriculumMap sidebar | `CurriculumCustomizationAssistant.tsx` |
| 416 | Templates DONNA panel — DONNA in TemplatesHome context | `TemplatesDonnaPanel.tsx` |
| 417 | DONNA confidence and source labels audit — all DONNA outputs show data source and confidence | Cross-cutting audit sprint |

### Phase I: Final QA

| Sprint | Action | Files |
|---|---|---|
| 418 | TypeScript clean pass — noEmit across all sprint changes | All modified files |
| 419 | RLS audit — every new route verified for academy_id and role checks | Security audit |
| 420 | Mobile responsive audit — coach, player, parent portals on small screen | Visual audit |
| 421 | Parent-safe rules regression — all parent-facing content verified | parentSafeResponseRules.ts |
| 422 | End-to-end acceptance test — director login, DNA setup, curriculum, template, coach wrap-up, player view, parent view | Full flow test |

---

## 11. Final Recommendation

### Should we continue OF-FIX-4?

**No.** OF-FIX-4 would extend the current 11-step onboarding further. The onboarding scope problem is confirmed by this audit. The correct next sprint is Sprint 379 — Academy DNA Setup Scope Repair — which narrows onboarding to 5 decisions and removes the non-DNA steps entirely.

### Should we pivot to Academy DNA setup first?

**Yes.** Sprint 379 is the correct next sprint. The onboarding is the first thing a new director sees and defines their mental model of the entire product. Getting it right — focused, fast, emotionally compelling — is more important than any downstream module. Six sprints (379-383) are sufficient to complete the DNA setup flow correctly.

### Should prototypes become the UI source of truth?

**Yes for UX/flow/information architecture. No for code, CSS, or design tokens.**

Prototypes define: what screens exist, what information is on each screen, how the user moves through them, and what emotional tone is appropriate.
Current AcademyOS defines: how those screens are built, how data is fetched, how mutations are guarded, what tokens are used, and what components are available.
These two sources do not conflict — they are complementary. Use both.

### What is the next exact sprint?

**Sprint 379 — Academy DNA Setup Scope Repair V1**

Scope:
1. Remove `CurriculumBuilderStep`, `FirstClassTemplateStep` from onboarding step array in `OnboardingShell.tsx`
2. Remove steps 5-9 (FitnessTemplate, PlayerUpload, AddCoaches, PortalPreview, ActivationChecklist) from the onboarding route structure — they become post-activation cards
3. Rebuild `WelcomeScreen` equivalent in `onboarding/page.tsx` with hero section and 5-step pill preview (no forced mode selection)
4. Rebuild `ActivationChecklistStep` as a celebration card with next-steps grid (not a required checklist)
5. Update `OnboardingProgressRail` to show only 5 meaningful steps (not 11)
6. No migrations. No schema changes. No package installs.

---

## Appendix: Prototype Tech Stack Summary

| Prototype | Framework | Router | CSS | Design tokens | Data source | Auth |
|---|---|---|---|---|---|---|
| donna-onboarding | Vite + React | Wouter | Tailwind + inline styles | oklch teal `#00C9A7` | In-memory (OnboardingContext) | None |
| curriculum-builder | Vite + React | Wouter | Tailwind + inline styles | oklch teal | Static `curriculumData.ts` | None |
| templates-prototype | Vite + React | Wouter | Tailwind + inline styles | oklch teal | Inline arrays | None |
| coach-portal | Vite + React | Wouter | Tailwind + inline styles | oklch teal | Inline arrays | None |
| player-portal | Vite + React | Wouter | Tailwind + inline styles | oklch teal | Inline arrays | None |
| parent-portal | Vite + React | Wouter | Tailwind + inline styles | oklch teal | `lib/data.ts` | None |
| **AcademyOS** | **Next.js 14 App Router** | **App Router** | **Tailwind + design tokens** | **lime `#C8FF00`** | **Supabase DB + RLS** | **Supabase Auth + middleware** |

None of the prototype code should be copied into AcademyOS. Prototypes are UX references only.
