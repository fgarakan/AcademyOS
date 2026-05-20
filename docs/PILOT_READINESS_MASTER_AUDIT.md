# AcademyOS Pilot Readiness Master Audit V1

**Date:** 2026-05-20
**Sprint:** 397
**Status:** Complete — Audit Only, no app code changed
**Prototype sources:** donna-onboarding.zip, curriculum-builder.zip, coach-portal.zip, parent-portal.zip, player-portal.zip
**Auditor:** Claude Code

---

## Executive Summary

### Overall Pilot-Readiness Score by Surface

| Surface | Score | Blockers | Fastest Path |
|---|---|---|---|
| Director Onboarding / DNA | 7 / 10 | DONNA full-screen chat vs sidebar-only; post-DNA steps still inside onboarding wizard | Narrow wizard to DNA-only; defer post-DNA tasks to Final Activation checklist |
| Curriculum Builder | 5 / 10 | Map and ChangeQueue pages exist but show no real content; no DONNA suggestions wired to real actions; no level gate editing UI | Seed one full level; wire ChangeQueue to proposed_actions |
| Coach Portal | 5 / 10 | Wrap-up UX is fragmented across too many components; DonnaWrapUp one-question-per-screen flow not implemented; attendance capture fragile | Rebuild wrap-up around guided 6-question flow on existing backend |
| Player Portal | 6 / 10 | Nav shell done (Sprint 396); hero card and path pages need visual upgrade; Celebration page is a stub | Upgrade hero card, then mission map gamification |
| Parent Portal | 4 / 10 | Three path pages missing (Skill, Competition, Fitness); no dedicated NextSteps page; no multi-step lesson flow | Build dedicated path pages using existing parentSupportGuide data |
| DONNA (across all surfaces) | 4 / 10 | Onboarding DONNA is sidebar-only (prototype is full-screen panel); coach DONNA has no guided wrap-up flow; player/parent DONNA are chip-only; no voice output in production | Wire existing DONNA COO layer to each surface progressively |
| Backend / Data Layer | 8 / 10 | Several migrations pending live application; proposed_actions pipeline complete; execute_approved_action covers 11 of 15 types | Apply pending migrations; extend RPC to full 15 types |
| Role Safety | 9 / 10 | Parent and player safety rules are enforced at data layer; minor gaps in parent portal missing pages | Fill missing parent pages with same sanitized data adapter |
| Review Queue | 8 / 10 | All 8 tab types exist; decision controls built; apply controls built; voice intake execution not routed | Add voice intake execution routing |
| Data Flow (end-to-end) | 5 / 10 | Onboarding → DNA → Curriculum link incomplete; Curriculum → Template → Session link needs seeding; Session → Coach → Evidence → Review → Player Profile works; Player Profile → Portals works | Prioritize data flow stitching over visual polish |

**Overall pilot-readiness score: 5.5 / 10**

### Biggest Blockers (Priority Order)

1. Coach wrap-up UX is fragmented — highest abandonment risk
2. Curriculum builder shows no real content for the demo level
3. Parent portal missing three dedicated path pages
4. DONNA is sidebar-only in onboarding — prototype shows full-screen engagement
5. Celebration page is a stub — needed for demo moment
6. Player hero card less visually rich than prototype
7. Several migrations pending live application (migration risk)
8. execute_approved_action covers only 11 of 15 types
9. Parent lesson request flow is single-step not 3-step prototype flow
10. No production TTS (voice output falls back to browser speechSynthesis)

### Fastest Path to Pilot-Ready

1. Apply all pending migrations to live DB
2. Seed one full level of curriculum content (Orange Ball 2)
3. Rebuild coach wrap-up as DONNA-guided one-question-per-screen flow
4. Upgrade player hero card and mission map to match prototype visual richness
5. Build three missing parent path pages (Skill, Competition, Fitness paths)
6. Build parent Next Steps dedicated page
7. Seed demo player (Brian's demo player) with full IDP, priorities, gates, observations
8. Run role safety and data leak audit across all portals
9. Record demo script and rehearse with real data

---

## Pilot-Ready Definition

### What Must Work (Real Data, No Demo Mode)

- Director can complete onboarding wizard end-to-end and save Academy DNA
- Director can view player list and open any player profile
- Director can view curriculum explorer with real levels
- Coach can log in, see today's sessions, and complete a wrap-up
- Wrap-up creates a proposed_action in the review queue
- Director can approve/reject wrap-up in review queue
- Player can log in and see their IDP, missions, and paths (with real data from their profile)
- Parent can log in and see their child's IDP snapshot and support guide
- All portal role-routing works: wrong role is redirected to correct portal

### What Can Be Demo-Static (Content Pre-Seeded)

- Academy DNA fields populated before demo (no live DONNA API call required)
- One demo player fully seeded (priorities, levels, gates, observations, development summary)
- One complete session template pre-seeded for the demo level
- Coach language fields populated for the demo player level
- DONNA chip responses on player/parent portals (static template-based, not live AI)

### What Must Be Real (Cannot Be Faked)

- Auth and role routing — must use real Supabase auth, not mock sessions
- proposed_actions pipeline — all mutations go through review queue
- RLS enforcement — no direct data access without auth
- Player profile data — no hardcoded fake player data in production code paths
- Parent safety filter — sanitizeParentFacingText must run on every parent-visible field

### What Must Be Manually Approved Before Display

- Any coach note going to parent — must be in player_development_summary with show_to_parent = true
- Any mission complete badge — director must mark via proposed_actions, never auto-triggered
- Any level advancement — director must confirm via finalize_player_placement() or approved action
- Any lesson request — goes to proposed_actions, not direct booking

### What Must Be Explicitly Deferred

- Parent outbound messaging (Message Academy page)
- Coach selection step in lesson flow (CoachSelection page)
- Celebration page full build (Sprint 402 minimum)
- Competition screen for director (/director/competition)
- Intelligence screen (/director/intelligence)
- Reports screen (/director/reports)
- Configuration screen (/director/configuration)
- Production TTS — demo uses browser speechSynthesis
- Production STT — demo uses browser SpeechRecognition or text input

---

## End-to-End Connection Map

| Connection | Status | Source Route/Component | Backend Table/Action | Destination Route/Component | Missing Pieces | Risk | Sprint Needed |
|---|---|---|---|---|---|---|---|
| Onboarding → Academy DNA | PARTIAL | /director/onboarding OnboardingShell | academies table | AcademyDnaLanding / director profile | Final save not wired to live academies row for all fields | MEDIUM | 398 |
| Academy DNA → Curriculum Builder | MISSING | AcademyDnaSummaryCard | academies.player_priorities / academies.coaching_philosophy | /director/curriculum | No auto-seed of curriculum from DNA; director must manually build | HIGH | 400 |
| Curriculum Builder → Level Gates | PARTIAL | /director/curriculum/builder | curriculum_levels, curriculum_gates | /director/curriculum/level/[levelId] | Gate editing UI not built; gates exist in schema but no director edit UI | HIGH | 401 |
| Curriculum Builder → Skill/Competition/Fitness Paths | PARTIAL | /director/curriculum | curriculum_coach_language | /player/skill-path, /player/competition-path | coach_language fields exist; director edit UI not built | MEDIUM | 401 |
| Curriculum → Class Template | PARTIAL | /director/curriculum/map | curriculum_class_template_blocks (migration 062, pending live) | /director/class-templates | Junction table created but migration pending; no content seeded for demo | HIGH | 398 |
| Fitness Library → Fitness Template | WORKING | /director/fitness/templates | exercises, template_blocks | Session generation | 83 exercises in DB; RLS fix migration 058 pending live | MEDIUM | Apply migration |
| Templates → Planned Sessions | WORKING | /director/sessions | sessions, session_blocks, template_blocks | /director/sessions | generateSessionFromTemplateAction works; session_block_exercises RLS fix pending | MEDIUM | Apply migration 056 |
| Planned Sessions → Coach Session View | WORKING | /director/sessions | sessions, session_blocks | /coach/sessions/[sessionId] | Coach can see sessions; template execution view exists | LOW | None |
| Coach Attendance → Player Profile | WORKING | /coach/sessions/[sessionId] CoachWrapUpDrawer | session_attendance | player attendance history | Attendance saved independently; functional | LOW | None |
| Coach Notes → Evidence Draft | PARTIAL | CoachRecapCommandPanel / CoachWrapUpDrawer | voice_notes, proposed_actions | /director/review | Two recap UIs coexist; wrap-up creates proposed_action; evidence is a separate flow | MEDIUM | 399 |
| Evidence Draft → Director Review Queue | WORKING | Director wrap-up approval | proposed_actions | /director/review | All 8 tab types exist; decision controls built | LOW | None |
| Approved Evidence → Player Profile | PARTIAL | applyWrapUpDraftAction | sessions.session_notes, audit_logs | player profile | Writes to session_notes text only; session_actuals table not yet built | MEDIUM | 403 |
| Player Profile → Player Portal | WORKING | /director/players/[playerId] | players, player_priorities, curriculum_levels, coach_observations | /player | IDP engine complete; profile_id linkage required | LOW | Profile setup |
| Player Profile → Parent Portal | WORKING | /parent | guardians, player_guardians, player_development_summary | /parent | Guardian linkage required; parentSupportGuide built; sanitization built | LOW | Profile setup |
| Player Portal Missions → Player Profile Progress | PARTIAL | /player/missions | player_priorities | player_curriculum_gate_statuses | Progress bar can show gates_passed/gates_total; gate statuses need migration repair | MEDIUM | 400 |
| Parent Lesson Request → Director/Coach Review | WORKING | PrivateLessonRequestCard | proposed_actions (target_module: parent_lesson_request) | /director/review | Writes to proposed_actions correctly; review card exists | LOW | None |
| Parent Message → Draft/Review | NOT BUILT | N/A | proposed_actions | /director/review | No parent message page; deferred V1 | LOW | Deferred |
| DONNA → Draft Actions | PARTIAL | OnboardingDonnaPanel / DonnaAdjustmentDraftPanel | proposed_actions | /director/review | Proposal card model built in onboarding; COO layer built; director-facing DONNA wired; coach/player/parent DONNA chip-only | HIGH | 398 |
| Review Queue → Approved Writes | WORKING | /director/review | proposed_actions, execute_approved_action() RPC | multiple tables | RPC covers 11 of 15 types; 4 voice types not yet routed | MEDIUM | 405 |
| Approved Writes → Audit Log | WORKING | applyWrapUpDraftAction, execute_approved_action | audit_logs | Director audit trail | All major mutations write to audit_logs | LOW | None |

---

## UI Prototype Parity Audit

### Director Onboarding / Academy DNA

| Item | Score | Notes |
|---|---|---|
| Prototype source | academyos-donna-onboarding.zip | 10 screens, Wouter router |
| Current route | /director/onboarding + OnboardingShell | 10 steps (0-9) |
| Match score | 7 / 10 | Screen count and flow match exactly |
| UI gaps | DONNA panel is sidebar 320px; prototype suggests full-screen conversational DONNA on step 8 | |
| Content/data gaps | Post-DNA steps (CurriculumBuilder, ClassTemplate, FitnessTemplate, PlayerUpload, AddCoaches) are AcademyOS additions not in prototype — may overwhelm new directors | |
| Must match identically | 10 DNA step flow, progress bar percentage mapping, DONNA milestone groups (7 groups now matching prototype), DNA Summary card layout | |
| Must intentionally differ | Accent: lime not teal. Post-DNA checklist is AcademyOS-specific. Proposal card model for DONNA adjustments is more safe than prototype's immediate-apply. | |
| Recommended sprints | 2 additional sprints: final DNA save wiring + DONNA adjustment full-screen option | |

### Curriculum Builder

| Item | Score | Notes |
|---|---|---|
| Prototype source | academy-curriculum-builder.zip | 10 pages, Wouter router |
| Current routes | /director/curriculum, /director/curriculum/map, /director/curriculum/builder, /director/curriculum/guided, /director/curriculum/level/[levelId] | |
| Match score | 5 / 10 | Routes exist; content empty; ChangeQueue wired to proposed_actions but shows no real data |
| UI gaps | CurriculumMap column layout is incomplete; GuidedReview step flow not fully built; LevelBuilder block editing minimal; ImpactPreview read-only | |
| Content/data gaps | No demo-level content seeded; curriculum_class_template_blocks junction table migration 062 pending; no coach language populated for any level | |
| Must match identically | ChangeQueue risk-level display (low/medium/high), DONNA suggestions panel, ImpactPreview downstream count display | |
| Must intentionally differ | All state must be real DB state, not fake CHANGES array. "Approve" must write to proposed_actions, not cosmetic toast. Color: lime not teal. | |
| Recommended sprints | 3 sprints: apply migrations, seed one level, wire ChangeQueue to real proposed_actions display | |

### Coach Portal

| Item | Score | Notes |
|---|---|---|
| Prototype source | academyos-coach-portal.zip | 10 pages (CoachToday, SessionPlan, TemplateExecution, PlayerWatchList, DonnaAssistant, DonnaWrapUp, AttendanceException, PlayerObservation, WrapUpReview, SubmittedSummary) |
| Current routes | /coach, /coach/sessions, /coach/sessions/[sessionId], /coach/sessions/[sessionId]/execute, /coach/sessions/[sessionId]/wrap-up, /coach/sessions/[sessionId]/wrap-up/review, /coach/players, /coach/players/[playerId], /coach/donna, /coach/voice, /coach/recap | |
| Match score | 5 / 10 | More routes in AcademyOS than prototype; backend stronger; UX more fragmented |
| UI gaps | Prototype DonnaWrapUp: one question at a time, progress bar, side summary panel accumulating answers — AcademyOS has CoachWrapUpDrawer (6 questions in a drawer, not one-at-a-time); SubmittedSummary celebration screen not implemented | |
| Content/data gaps | PlayerWatchList has real data (CoachPlayerWatchList.tsx); SessionPlan shows curriculum context when template has level; wrap-up sends to proposed_actions correctly | |
| Must match identically | One-question-per-screen wrap-up flow, progress bar, side summary panel, Submitted confirmation screen | |
| Must intentionally differ | Wrap-up must go to review queue (proposed_actions), not claim "Sent to Director" as a done state. Player names must be flagged for manual resolution. No auto-actions. | |
| Recommended sprints | 2 sprints: rebuild wrap-up UX; build SubmittedSummary screen | |

### Player Portal

| Item | Score | Notes |
|---|---|---|
| Prototype source | academyos-player-portal.zip | 10 screens |
| Current routes | /player, /player/missions, /player/missions/[priorityId], /player/skill-path, /player/competition-path, /player/fitness-path, /player/level-up, /player/practice, /player/celebration, /player/ask-donna | |
| Match score | 6 / 10 | All routes exist; nav shell complete (Sprint 396); hero card less visually rich |
| UI gaps | Hero card lacks gradient glow, level progress bar, streak display; Mission Map lacks gamified status treatment (ACTIVE/NEXT UP/LOCKED); Celebration is stub; path pages need visual upgrade | |
| Content/data gaps | All data adapters solid; gate statuses need migration repair for progress bars | |
| Must match identically | Hero card structure; Mission Map status treatment; Level Up comparison card; Skill Path sub-component chips | |
| Must intentionally differ | Accent: lime not teal. Progress bars from real gate data not fake percentages. DONNA labeled "Coach-guided responses" not "AI-Powered". | |
| Recommended sprints | 5 sprints: hero card, mission map, path pages visual upgrade, level up, celebration | |

### Parent Portal

| Item | Score | Notes |
|---|---|---|
| Prototype source | academyos-parent-portal.zip | 10 screens |
| Current routes | /parent, /parent/development, /parent/progress, /parent/wins, /parent/updates, /parent/ask-donna | |
| Match score | 4 / 10 | 6 routes vs 10 prototype screens; three dedicated path pages completely missing |
| UI gaps | No /parent/skill-path; no /parent/competition-path; no /parent/fitness-path; no /parent/next-steps; no /parent/coach-selection; no standalone /parent/request-lesson; no /parent/confirmation | |
| Content/data gaps | parentSupportGuide already built with data for NextSteps; sanitized coach language available for path pages; lesson request writes to proposed_actions | |
| Must match identically | Hero snapshot card structure; path card grid; NextSteps numbered list | |
| Must intentionally differ | All progress bars from real gate data. "On track" language not fake percentages. Lesson request goes to proposed_actions not direct booking. No outbound messaging in V1. | |
| Recommended sprints | 4 sprints: home upgrade, three path pages, NextSteps, lesson flow | |

---

## Backend / Data Audit

### Tables Available (Confirmed in Schema)

| Table | Purpose | Migration | Status |
|---|---|---|---|
| academies | Academy profile, DNA fields | 002 | Available |
| profiles | All user profiles, role, academy_id | 002 | Available |
| academy_memberships | Role membership per academy | 002 | Available |
| players | Student records, curriculum_level_id, profile_id link | 004 | Available |
| curriculum_levels | Level definitions (display_name, stage, sort_order) | 052 | Available |
| curriculum_pathways | Pathway definitions | 052 | Available |
| curriculum_goals | Goal definitions per level | 052 | Available |
| curriculum_gates | Level advancement gates | 052 | Available |
| curriculum_drills | Drill library | 052 | Available |
| curriculum_coach_language | Coach language fields per level (doing_well, working_on, current_focus, etc.) | 052 | Available |
| player_priorities | IDP active priorities per player | 004 | Available |
| player_curriculum_gate_statuses | Gate progress per player | 059 | Partial (repair migration 060 needed) |
| coach_observations | Observation records by domain | 005 | Available |
| sessions | Session records | 007 | Available |
| session_blocks | Session block records | 007 | Available |
| session_attendance | Attendance records | 007 | Available |
| voice_notes | Coach raw voice/text notes | 008 | Available |
| proposed_actions | All draft/pending actions | 009 | Available |
| audit_logs | All executed mutations | 009 | Available |
| player_development_summary | Coach-approved parent/player summaries | 010 | Available |
| guardians | Parent guardian records | Multiple | Available |
| player_guardians | Guardian-to-player linkage | Multiple | Available |
| exercises | Fitness exercise library | 006 | Available (83 exercises) |
| template_blocks | Template block definitions | 006 | Available |
| session_block_exercises | Block exercise associations | 007 | RLS fix pending (migration 056) |
| template_block_exercises | Template exercise associations | 006 | RLS fix pending (migration 058) |
| curriculum_class_template_blocks | Class template content junction | 062 | Migration pending live application |
| player_gate_status | Gate status per player | 059/060 | Partial repair pending |

### Missing Tables (Not Yet Built)

| Table | Purpose | When Needed |
|---|---|---|
| session_actuals | Normalized session outcome records | Sprint 403+ |
| coach_message_queue | Parent communications draft queue | Future |
| player_badges | Achievement/badge records | Sprint 402+ |
| lesson_bookings | Confirmed lesson booking records | Future |

### Server Actions Available

- createVoiceIntakeDraftAction — voice intake → proposed_actions
- generateNoteDraftAction — AI note structuring (requires ANTHROPIC_API_KEY)
- recordGateEvidenceAction — gate evidence → player_gate_status + audit_logs
- requestPrivateLessonAction — parent lesson request → proposed_actions
- commitPlayerImportAction — CSV import → players table
- applyWrapUpDraftAction — approved wrap-up → sessions.session_notes + audit_logs
- updateWrapUpDraftDecisionAction — approve/reject wrap-up
- rollbackCurriculumOverride — curriculum override rollback
- markFirstRunDeckSeenAction — first run flag

### Missing Server Actions

- saveAcademyDnaAction — final save of all DNA fields to academies table
- createGateForLevelAction — director creates a new gate for a level
- assignCoachLanguageAction — director assigns coach language to a level
- seedCurriculumFromDnaAction — auto-seed curriculum from DNA fields
- markMissionCompleteAction — director marks mission complete (proposed_actions pipeline)
- sendParentUpdateAction — director-approved parent communication (future)

---

## Role Safety Audit

### Director (academy_director)

| Capability | Status |
|---|---|
| Can see all players in academy | Yes — academy_id scoped queries |
| Can see raw coach notes | Yes — director only |
| Can approve/reject proposed_actions | Yes — review queue |
| Can edit curriculum | Yes — curriculum builder |
| Can see parent portal data | No direct access — separate role routing |
| Can see player portal data | Director preview mode via PreviewBanner (read-only) |
| Cannot accidentally overwrite production data in preview | Preview mode assertNotPreviewMode() guards all writes |

Gaps: Director preview mode does not explicitly warn that previewed data is the same production DB. Recommend: explicit "Preview Mode — viewing as player/parent, no writes possible" banner (already in PreviewBanner component).

### Coach (coach / head_coach)

| Capability | Status |
|---|---|
| Can see assigned players | Yes — academy_memberships + group assignments |
| Can see session details | Yes — coach session workspace |
| Cannot see other coaches' private observations | Yes — RLS scoped |
| Cannot approve proposed_actions | Correct — only directors can approve |
| Cannot see director-only fields | Yes — director-only fields not in coach queries |
| Can submit observations → proposed_actions | Yes — goes to review queue |
| Cannot directly write to player profile | Correct — all writes via proposed_actions |

Gaps: Two recap UIs coexist (CoachRecapCommandPanel + CoachWrapUpDrawer). Coach may not know which to use. Label clarity is the mitigation.

### Parent (parent)

| Capability | Status |
|---|---|
| Can only see their child's data | Yes — guardian → player_guardians → player scoping |
| Cannot see raw coach observations | Yes — sanitizeParentFacingText active |
| Cannot see internal director notes | Yes — not in any parent query |
| Cannot see other players' data | Yes — RLS |
| Cannot see rankings or comparisons | Yes — no ranking language in parent data adapters |
| Lesson requests go to review queue | Yes — proposed_actions pipeline |
| Cannot trigger AI calls | Correct — DONNA responses are static templates |

Gaps: Three missing parent path pages (skill, competition, fitness) — once built, they must use same sanitization adapter.

### Player (player)

| Capability | Status |
|---|---|
| Can only see their own IDP | Yes — profile_id linkage |
| Cannot see coach observations content | Yes — only counts shown, not content |
| Cannot see parent portal content | Yes — separate role routing |
| Cannot see other players | Yes — RLS |
| Cannot trigger mission complete | Correct — celebration requires director confirmation |
| Cannot see internal staff notes | Yes — not in player queries |

Gaps: Celebration page is a stub — once built, must only trigger on director-confirmed proposed_action.

---

## Pilot Risk Register

| # | Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|---|
| 1 | Coach abandons wrap-up because UX is too fragmented | HIGH | HIGH | Rebuild wrap-up as guided one-question flow before pilot |
| 2 | Demo player has no data, portals show empty state | HIGH | HIGH | Pre-seed demo player with full IDP, priorities, observations before pilot |
| 3 | Pending migrations not applied to live DB, causing RLS errors | HIGH | MEDIUM | Apply migrations 056, 058, 060, 061, 062 before pilot |
| 4 | Parent guardian linkage not set, parent portal shows empty | HIGH | MEDIUM | Set guardian → player_guardians mapping before pilot |
| 5 | Player profile_id not linked, player portal shows empty | HIGH | MEDIUM | Set players.profile_id → auth user ID before pilot |
| 6 | Director completes DNA but nothing persists (save not wired) | HIGH | MEDIUM | Wire final DNA save action before pilot |
| 7 | DONNA chip responses feel robotic — kills trust during demo | MEDIUM | HIGH | Customize DONNA copy for demo player's actual priorities |
| 8 | Curriculum builder shows no content — confuses director | MEDIUM | HIGH | Seed Orange Ball 2 level content before pilot |
| 9 | Celebration stub page shown to player during demo — deflates moment | MEDIUM | MEDIUM | Build or disable celebration page before pilot |
| 10 | Two coaches submit wrap-ups simultaneously — proposed_actions confuses director | MEDIUM | LOW | Review queue handles multiple — no race condition; just UI clutter |
| 11 | Browser SpeechRecognition fails on demo laptop (Chrome required) | MEDIUM | MEDIUM | Pre-test on demo browser; have text input as fallback |
| 12 | Role routing sends wrong user to wrong portal during demo | LOW | LOW | Pre-test all role logins; confirm middleware routing before demo |

---

## Pilot Sprint Backlog

### Block A — Foundation (Must-Do Before Any Pilot)

| Sprint | Purpose | Files | Dependency | Risk |
|---|---|---|---|---|
| 398 | Apply pending migrations + seed demo player | Migration docs, player seed script | None | HIGH |
| 399 | Wire final Academy DNA save action | saveAcademyDnaAction, onboarding steps | None | HIGH |

### Block B — Coach Portal (Highest-Value Fix)

| Sprint | Purpose | Files | Dependency | Risk |
|---|---|---|---|---|
| 400 | Rebuild coach wrap-up as DONNA-guided one-question flow | WrapUpGuidedFlow, DonnaWrapUp UX pattern | Block A | HIGH |
| 401 | Build SubmittedSummary confirmation screen | SubmittedSummary.tsx | Sprint 400 | MEDIUM |

### Block C — Player Portal Visual Upgrade

| Sprint | Purpose | Files | Dependency | Risk |
|---|---|---|---|---|
| 402 | Player hero card visual upgrade (gradient, progress bar, streak) | PlayerHomeHeroCard.tsx, /player/page.tsx | Block A | MEDIUM |
| 403 | Player mission map gamification (status sections, progress bars, locked treatment) | /player/missions/page.tsx | Sprint 402 | MEDIUM |
| 404 | Player path pages visual upgrade (Skill, Competition, Fitness) | skill-path, competition-path, fitness-path pages | Sprint 402 | MEDIUM |
| 405 | Player level-up and celebration (comparison card, celebration build) | level-up page, /player/celebration/page.tsx | Block A | MEDIUM |

### Block D — Parent Portal Pages

| Sprint | Purpose | Files | Dependency | Risk |
|---|---|---|---|---|
| 406 | Parent home snapshot upgrade + Next Steps page | /parent/page.tsx, /parent/next-steps/page.tsx | Block A | MEDIUM |
| 407 | Parent path pages (Skill, Competition, Fitness) | Three new parent path pages | Block A | MEDIUM |
| 408 | Parent lesson request flow (standalone + 3-step prototype flow) | /parent/request-lesson, /parent/coach-selection, /parent/confirmation | Block A | LOW |

### Block E — Curriculum Builder Real Content

| Sprint | Purpose | Files | Dependency | Risk |
|---|---|---|---|---|
| 409 | Seed one full level (Orange Ball 2): drills, gates, coach language, fitness | Migration or seed script | Block A | MEDIUM |
| 410 | Wire CurriculumMap to real content; ChangeQueue shows real proposed_actions | /director/curriculum/map/page.tsx | Sprint 409 | MEDIUM |

### Block F — DONNA Progressive Enhancement

| Sprint | Purpose | Files | Dependency | Risk |
|---|---|---|---|---|
| 411 | Director DONNA: wire daily brief to real DB data | DirectorDonnaDailyBrief, brief/route.ts | Block A | MEDIUM |
| 412 | Coach DONNA: add session-context suggestions to wrap-up flow | CoachDonnaSessionPanel | Block B | MEDIUM |

### Block G — QA and Safety Audit

| Sprint | Purpose | Files | Dependency | Risk |
|---|---|---|---|---|
| 413 | Role safety final audit — verify no data leaks across roles | All portal pages | Blocks A-F | HIGH |
| 414 | Mobile QA — all portals tested on mobile viewport | All player/parent pages | Blocks C-D | MEDIUM |
| 415 | Portal data integration QA — empty states, loading states, error boundaries | All portals | Blocks C-D | MEDIUM |

### Block H — Pilot Dress Rehearsal

| Sprint | Purpose | Files | Dependency | Risk |
|---|---|---|---|---|
| 416 | Demo script alignment — confirm all demo flows match sprint deliverables | PILOT_READINESS_MASTER_AUDIT.md update | Blocks A-G | LOW |
| 417 | Final parity re-audit — re-score all surfaces, confirm demo player data, go/no-go | Docs only | All | LOW |

---

*Generated from prototype zips extracted to /tmp only. Prototype files not staged. No code changes. No migrations. No schema changes. No package changes. No DB writes.*
