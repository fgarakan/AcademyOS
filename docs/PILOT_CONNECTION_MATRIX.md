# AcademyOS Pilot Connection Matrix V1

**Date:** 2026-05-20
**Sprint:** 397
**Status:** Complete — Audit Only, no app code changed

This document maps every major data flow connection in AcademyOS end-to-end.
Each row covers source, destination, current implementation, missing pieces, and pilot requirement.

---

## Connection Map

| # | Connection | Source | Destination | Current Implementation | Missing Backend | Missing UI | Missing Safety | Pilot Requirement | Sprint Dependency | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Onboarding → Academy DNA | /director/onboarding OnboardingShell (steps 0-9) | academies table | DNA fields collected in form state (sessionStorage draft). DonnaAdjustmentDraftPanel proposal card model. Step 9 ActivationChecklistStep has "Begin Setup" CTA. | saveAcademyDnaAction not fully wired to persist all DNA fields to academies row on final save | Final save button shows success but may not fully persist all 9 DNA field groups to live DB | Low — onboarding writes to academy record, not player data | MUST WORK — director must be able to complete DNA and have it saved | Sprint 398 | P0 |
| 2 | Academy DNA → Curriculum Builder | academies record (player_priorities, coaching_philosophy, session_blocks, parent_communication_style) | /director/curriculum, curriculum_levels, curriculum_coach_language | No auto-seed. Director must manually navigate to /director/curriculum and build. DNA fields visible in review step but not auto-seeded to curriculum. | seedCurriculumFromDnaAction (not built) | Auto-seed prompt in ActivationChecklistStep | Low — suggestion only, not automatic mutation | NICE-TO-HAVE — demo can pre-seed curriculum manually | Sprint 400+ | P2 |
| 3 | Curriculum Builder → Level Gates | /director/curriculum/builder, /director/curriculum/level/[levelId] | curriculum_gates, player_curriculum_gate_statuses | Gates defined in schema (migration 052). Gate statuses table (059/060 partial). Director can view gate list. No director gate edit UI. | Level gate edit action; gate threshold parser for evidence_threshold_met transition | Director gate editor in level detail page | MEDIUM — gate edits affect player level-up criteria | SHOULD WORK — director needs to view gates; edit can be deferred | Sprint 401 | P1 |
| 4 | Curriculum Builder → Coach Language | /director/curriculum/level/[levelId] | curriculum_coach_language | Coach language table exists (migration 052). CurriculumExplorer reads coach language fields. No director edit UI for coach language fields. | assignCoachLanguageAction | Coach language editor in level detail | LOW — content safety; coach language is curriculum staff only | NICE-TO-HAVE — can be pre-seeded for demo | Sprint 401 | P2 |
| 5 | Curriculum → Class Template | /director/curriculum, /director/class-templates | curriculum_class_template_blocks, session_templates, template_blocks | Junction table created (migration 062) but pending live application. Class template detail reads exercises, not curriculum content. | Migration 062 applied to live DB; seed content for Orange Ball 2 | Class template content display (Sprint 131 planned) | LOW | SHOULD WORK — at least show block list without curriculum link | Apply migration 062 | P1 |
| 6 | Curriculum → Skill/Competition/Fitness Paths (Player) | curriculum_coach_language, player_priorities | /player/skill-path, /player/competition-path, /player/fitness-path | Path pages exist. They read coach_observations counts by domain and curriculum level. Coach language fields available. Visual upgrade sprints 400-401 planned. | None — data already available | Visual upgrade (progress bars, sub-component chips, focus cards) | LOW — counts only shown, no observation content | MUST WORK — player should see path pages with real observation counts | Sprint 402-404 | P1 |
| 7 | Fitness Library → Fitness Template | /director/fitness/templates, exercises table | session_blocks, template_blocks | 83 exercises confirmed in DB. Fitness template builder reads exercises. template_block_exercises RLS fix (migration 058) pending live. Exercise picker functional. | Migration 058 applied to live DB | None | LOW | MUST WORK — fitness template must be usable for demo session | Apply migration 058 | P1 |
| 8 | Templates → Planned Sessions | /director/sessions (generate session) | sessions, session_blocks, session_block_exercises | generateSessionFromTemplateAction works. Session created from template. session_block_exercises RLS fix (migration 056) pending — exercises show orange warning until applied. | Migration 056 applied to live DB | None — session list already shows new session | LOW | MUST WORK — director must be able to generate sessions from templates | Apply migration 056 | P1 |
| 9 | Planned Sessions → Coach Session View | sessions, session_blocks | /coach/sessions/[sessionId] | Coach can see sessions assigned to their groups. Session detail shows template, blocks, curriculum context. CoachSessionExecutionClient handles on-court view. | None | None | LOW | MUST WORK | None | DONE |
| 10 | Coach Attendance → Player Profile | /coach/sessions/[sessionId] CoachWrapUpDrawer attendance section | session_attendance | Save Attendance button writes to session_attendance independently of wrap-up recap. Functional. Attendance history shows in player profile Overview tab. | None | None | LOW | MUST WORK | None | DONE |
| 11 | Coach Notes → Evidence Draft | CoachRecapCommandPanel (Quick Note), CoachWrapUpDrawer (Guided Wrap-Up) | voice_notes, proposed_actions | Both recaps write to voice_notes + proposed_actions (status: pending_review). Wrap-up creates structured draft. Quick note creates raw text entry. Two UI paths coexist. | None — pipeline is complete | Simplify to one primary wrap-up flow (DonnaWrapUp pattern) | MEDIUM — two UIs creates coach confusion | MUST WORK — at least one clean path to draft creation | Sprint 400 | P0 |
| 12 | Evidence Draft → Director Review Queue | proposed_actions (status: pending_review) | /director/review | All 8 review tab types exist. StructuredDraftCard shows wrap-up recap. WrapUpDraftCard shows structured draft. Decision controls (Approve/Reject/Clarify) built. Apply controls built. | None | None | LOW | MUST WORK | None | DONE |
| 13 | Approved Evidence → Player Profile | applyWrapUpDraftAction (after director approval) | sessions.session_notes, audit_logs | Writes to sessions.session_notes (text) and audit_logs. No normalized session_actuals table yet. Player profile shows audit trail items. | session_actuals table (future) | None — text note visible in session detail | LOW — text-only write is safe and reversible | MUST WORK — approval flow must produce visible result | None | DONE |
| 14 | Coach Observations → Player Evidence | CoachWrapUpDrawer player observation section | coach_observations, player_gate_status | Observation capture in wrap-up writes to coach_observations. recordGateEvidenceAction writes to player_gate_status + audit_logs. Gate statuses table partially repaired (migration 060 pending). | Migration 060 applied; migrations 041-044 applied | Gate evidence display in level-up page | HIGH — gate evidence affects level advancement criteria | SHOULD WORK — observation capture must work; gate display can show placeholder | Apply migrations 041-044 then 060 | P1 |
| 15 | Player Profile → Player Portal | players, player_priorities, curriculum_levels, coach_observations, curriculum_coach_language | /player | individualDevelopmentPlan.ts (pure function, no DB calls). Player layout reads profile_id → player → curriculum_level. IDP engine complete. Portal shows live data. | profile_id linkage on player record must be set manually by director | None — all pages exist | LOW — player sees only their own IDP | MUST WORK — profile_id must be set before demo | Director setup task | P0 |
| 16 | Player Profile → Parent Portal | players, player_priorities, player_development_summary (show_to_parent=true), curriculum_coach_language | /parent | individualDevelopmentPlan.ts (parent view). parentSupportGuide.ts. sanitizeParentFacingText active on all parent-visible strings. Guardian → player_guardians → player linkage must be set. | guardian → player_guardians linkage must be set; player_development_summary row with show_to_parent=true must exist | Three missing parent path pages | HIGH — parent sees only approved, sanitized data | MUST WORK — guardian linkage + one approved summary before demo | Director setup task | P0 |
| 17 | Player Portal Missions → Player Profile Progress | /player/missions, /player/missions/[priorityId] | player_priorities, player_curriculum_gate_statuses | Missions page reads player_priorities. Mission detail reads gate progress. Gate status table partially repaired. Progress bars can show gates_passed / gates_total. | Migration 060 full repair needed for gate statuses | Visual upgrade — progress bars on mission cards | LOW — progress bar shows placeholder if gate data absent | SHOULD WORK — priority cards must render; progress bar can show 0/N if no gates | Apply migration 060 | P1 |
| 18 | Parent Lesson Request → Director/Coach Review | /parent PrivateLessonRequestCard | proposed_actions (target_module: parent_lesson_request) | requestPrivateLessonAction writes to proposed_actions with correct module and pending_review status. Director review queue shows lesson request tab. | None | Standalone /parent/request-lesson page (Sprint 408) | LOW — request is advisory, no scheduling | MUST WORK — request writes to proposed_actions | None (existing inline card works) | DONE |
| 19 | Parent Message → Draft/Review | N/A | proposed_actions | Not built. Updates page (/parent/updates) shows inbound approved summaries, not outbound messages. | Outbound message action (deferred) | /parent/message page (deferred) | MEDIUM — message must go to review, not direct send | NOT REQUIRED for pilot V1 | Deferred | P3 |
| 20 | DONNA → Draft Actions | All DONNA surfaces | proposed_actions | Onboarding: proposal card in-memory (not yet wired to DB save). Director: createVoiceIntakeDraftAction. Coach: wrap-up → proposed_actions. Player/Parent: chip-based static responses (no actions). | saveAcademyDnaProposalAction (onboarding DNA proposals should save to proposed_actions) | All DONNA action surfaces | HIGH — all DONNA actions must go through review queue | MUST WORK — at minimum director and coach DONNA actions reach review queue | Sprint 398 | P0 |
| 21 | Review Queue → Approved Writes | /director/review proposed_actions (status: approved) | Multiple downstream tables via execute_approved_action() | execute_approved_action() RPC covers 11 of 15 action types. 4 voice intake types not routed. Apply controls built for each review card type. | Extend RPC to cover remaining 4 voice intake types | None | HIGH — execution is irreversible | MUST WORK for wrap-up, observation, attendance, development summary types | Sprint 405 (RPC extension) | P1 |
| 22 | Approved Writes → Audit Log | execute_approved_action(), applyWrapUpDraftAction, etc. | audit_logs | All major mutations write to audit_logs. ExecutionAuditTrailPanel displays history. | None | None | LOW | MUST WORK | None | DONE |

---

## Pending Migration Risk Table

| Migration | Purpose | Status | Pilot Impact if Not Applied |
|---|---|---|---|
| 041 | requirement_domains tables | Not applied to live DB | Gate evidence system broken |
| 042 | requirement_domain_seed | Not applied to live DB | Gate domain data missing |
| 043 | orange_ball_starter_requirements | Not applied to live DB | No seed requirements for Orange Ball |
| 044 | player_requirement_progress_bootstrap | Not applied to live DB | No bootstrap rows for players |
| 056 | session_block_exercises RLS | Pending live | Session exercises show orange warning; functional but ugly |
| 058 | template_block_exercises RLS | Pending live | Fitness template exercise insert fails |
| 060 | gate_status_repair | Pending live | Gate evidence counts not visible; player level-up page shows 0/N |
| 061 | curriculum_content_taxonomy | Pending live | New curriculum content types cannot be inserted |
| 062 | class_template_content_junction | Pending live | Class templates cannot link to curriculum content |

**Recommendation:** Apply all pending migrations in order before any pilot session. Start with 041-044 (dependency chain), then 056, 058, 060, 061, 062.

---

## Pre-Pilot Data Setup Checklist

These are manual setup tasks, not code sprints. Must be completed before Brian's pilot session.

- [ ] Apply pending migrations 041, 042, 043, 044, 056, 058, 060, 061, 062 to live Supabase
- [ ] Create demo director account; assign to demo academy
- [ ] Create demo coach account; assign to demo academy
- [ ] Create demo player account; link profile_id to player record
- [ ] Create demo parent account; link guardian → player_guardians → player
- [ ] Complete director onboarding wizard; save Academy DNA
- [ ] Seed Orange Ball 2 level: coach language, gates, drills
- [ ] Create one class template for Orange Ball 2 group
- [ ] Create one fitness template
- [ ] Assign demo player to Orange Ball 2 curriculum level
- [ ] Add demo player priorities (2-3 active priorities)
- [ ] Add demo coach observations for demo player (at least 3-5 per domain)
- [ ] Create one player_development_summary row with show_to_parent=true for demo player
- [ ] Verify player portal shows IDP for demo player login
- [ ] Verify parent portal shows approved snapshot for demo parent login
- [ ] Create one session; assign coach; assign demo player group
- [ ] Test coach wrap-up → review queue → director approval flow end-to-end

---

*Generated from prototype zips extracted to /tmp only. No code changes. No migrations. No schema changes. No package changes. No DB writes.*
