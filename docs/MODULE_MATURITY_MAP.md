# Module Maturity Map — Sprint 385

Backend readiness ratings (Level 0–10) per product module.

**Last updated:** 2026-05-15

Cross-reference: `SCREEN_BACKEND_READINESS_MAP.md` for screen-level ratings, `PROTOTYPE_SCREEN_ADOPTION_MAP.md` for screen specifications.

---

## Readiness Scale

| Level | Meaning |
|---|---|
| 0 | Concept only. No data model, no route, no action. |
| 2 | Data model exists. Tables defined, migrations applied. |
| 4 | Route scaffolded. Page exists but no real data queries. |
| 6 | Backend wired. Server actions and queries return real data. |
| 8 | DONNA capable. Context registered, task contracts wired, `proposed_actions` integrated. |
| 10 | Pilot-ready. QA pass, no demo-only data, protected actions enforced, audit log writing. |

Odd levels (1, 3, 5, 7, 9) indicate a module that is between two milestones.

---

## Auth & Identity

| Component | Level | Notes |
|---|---|---|
| Supabase Auth (email+password) | 10 | Email+password login, session cookies, role routing via middleware |
| `profiles` table + RLS | 10 | Stable. All users have profile rows. |
| Role-based middleware routing | 9 | All 5 roles route correctly. `head_coach` / `academy_director` split not yet fully distinct. |
| `platform_roles` table | 2 | Referenced in middleware. NOT in `database.types.ts`. Requires migration to formalize. |
| Player activation gate | 10 | `finalize_player_placement()` is the only activation RPC. Red line enforced. |

**Rating: 9** — Auth is stable. Platform role formalization is the only gap.

---

## Sessions Module

| Component | Level | Notes |
|---|---|---|
| `sessions` table + RLS | 10 | Stable. All session fields typed. |
| `session_blocks` table + RLS | 10 | Separate from `template_blocks` (red line enforced). |
| Sessions list route (`/director/sessions`) | 10 | Renders real data, filtered by academy. |
| Session detail route (`/director/sessions/[sessionId]`) | 8 | Route built, blocks shown. DONNA context registered Sprint 387. |
| Coach sessions route (`/coach/sessions`) | 8 | Built. Coach-gated queries. |
| Coach session workspace (`/coach/sessions/[sessionId]`) | 8 | Built. Wrap-up drawer functional. |
| `create_session` server action | 9 | Wired. Goes through `proposed_actions`. |
| `populate_session_from_template` server action | 9 | Wired. Copies template blocks. |
| `applyWrapUpDraftAction` | 8 | Built. Wrap-up applied on director approval. |
| Session detail DONNA context | 8 | Registered Sprint 387. Prompt chips added to page. |
| `/director/sessions/[sessionId]/brief` route | 0 | Plan only. No build yet. |

**Rating: 9** — Core sessions backend is complete. DONNA context for detail + coach brief route are the remaining gaps.

---

## Templates Module

| Component | Level | Notes |
|---|---|---|
| `templates` table + RLS | 10 | Stable. |
| `template_blocks` table + RLS | 10 | Stable. Separate from `session_blocks`. |
| Class template routes (`/director/class-templates/...`) | 10 | List + detail built. DONNA draft wired. |
| Fitness template routes (`/director/fitness/templates/...`) | 10 | List + detail built. DONNA draft wired. |
| `saveAssistantTemplateDraftAction` | 10 | Fixed Sprint 383.5 — `track` null guard, level in tags. |
| `saveFitnessTemplateDraftAction` | 9 | Wired. Same pattern as class template. |
| DONNA context for templates | 10 | Both list and detail routes registered. |

**Rating: 10** — Templates module is pilot-ready.

---

## Players Module

| Component | Level | Notes |
|---|---|---|
| `players` table + RLS | 10 | Central data object. Stable. |
| `academy_memberships` table + RLS | 10 | Player↔academy relationship. |
| Player profile route (`/director/players/[playerId]`) | 10 | Full profile with tabs (Skill Path, IDP, Notes, etc.). |
| Players list route (`/director/players`) | 9 | Built. Filters functional. Minor pagination TBD. |
| Player DONNA context (detail) | 10 | Registered. Task contracts wired. |
| `draft_player_note` action | 9 | Wired through `proposed_actions`. |
| `review_level_readiness` action | 9 | Wired. Proposal → `proposed_actions` → `finalize_player_placement()`. |
| `summarize_player_progress` task | 3 | Contract defined, server action stub only. |
| Level Up aggregate screen (`/director/level-up`) | 8 | Built Sprint 388. DONNA context registered. |

**Rating: 9** — Player profile is pilot-ready. Level Up aggregate view is the missing piece.

---

## Curriculum Module

| Component | Level | Notes |
|---|---|---|
| `curriculum_enrollments` table + RLS | 9 | Stable. Level assignments typed. |
| `assessments` table + RLS | 8 | Available. Used in readiness review. |
| Curriculum route (`/director/curriculum`) | 9 | Built. DONNA context registered. |
| `adjust_curriculum` action | 8 | Wired. Goes through `proposed_actions`. |
| Level movement gates (`donnaLevelMovementActions`) | 8 | Gates defined. Never auto-executes. |
| `getReassessmentPipeline()` | 8 | Available in `dashboard.ts`. Called on director dashboard. |
| `buildIndividualDevelopmentPlan()` | 8 | Available. Used in player IDP tab. |
| Level Up screen | 8 | Built Sprint 388. Route `/director/level-up` operational. |

**Rating: 8** — Curriculum backend is DONNA-capable. Level Up screen is the build gap.

---

## DONNA / Proposed Actions Module

| Component | Level | Notes |
|---|---|---|
| `proposed_actions` table + RLS | 10 | Core pipeline table. Stable. |
| `audit_logs` table + RLS | 10 | All major mutations write here. |
| `execute_approved_action()` RPC | 10 | Only execution path for approved actions. |
| Review queue route (`/director/review`) | 9 | Built. DONNA context registered. |
| `getDonnaReviewQueueAction` | 10 | Wired. Real-time count for badge. |
| COO commands (7) | 9 | All 7 wired. Routing stable as of Sprint 383. |
| Task contracts (15) | 8 | 11/15 wired; 4 stubs only. |
| Preference memory | 8 | Sprint 377. Reads/writes `donna_preferences` table. |
| Recommendation engine | 8 | Sprint 374–375. Client-side rule evaluation. |
| Voice input (`useDonnaRealtimeVoice`) | 8 | Sprints 297–350. TTS + STT stable. |
| Audit trail | 9 | `appendAuditEvent` instrumented in all major flows. |
| `DonnaAssistantButton.tsx` modularization | 9 | Sprint 384. Prop-driven orchestrator. 4 real extractions. |

**Rating: 9** — DONNA core is pilot-ready. 4 stub task contracts are the known gap.

---

## Communications Module

| Component | Level | Notes |
|---|---|---|
| `draft_parent_update` action | 9 | Wired. Parent-safe filter applied. Goes to `proposed_actions`. |
| `draft_coach_communication` action | 9 | Wired. Goes to `proposed_actions`. |
| `sanitizeParentFacingText` | 10 | Locked. Parent content safety enforced. |
| `parentSafeResponseRules` | 10 | Locked. Director-visible only. |
| Parent portal (`/parent`) | 8 | Built. Approved content visible. |
| Parent Communication Center (`/director/parents`) | 0 | Route does not exist. Proposed Sprint 389. |
| External email/SMS delivery | 0 | NOT built. Approved communications are staged, not delivered. |
| Private lesson requests | 5 | `requestPrivateLessonAction` in parent portal. No director-side view yet. |

**Rating: 6** — Backend for drafts and safety is fully wired. Director-side comms center and external delivery are missing.

---

## Attendance Module

| Component | Level | Notes |
|---|---|---|
| `saveAttendanceExceptionDraftAction` | 9 | Wired. Sprint 372. Proposes to `proposed_actions`. |
| `fetchRecentSessionsAction` | 9 | Wired. Sprint 383. Returns last 7 days of sessions. |
| `donnaAttendanceSessionResolution.ts` | 9 | Sprint 383. Natural language parsing, session matching. |
| Attendance exception DONNA card | 9 | Sprint 381–383. Session selection + queue for review UI. |
| Attendance exception in review queue | 9 | Visible in `/director/review` on approval. |
| Bulk attendance write | 0 | Not built. Each exception is a separate proposed_action. |

**Rating: 9** — Attendance exception flow is DONNA-capable. Bulk write is intentionally deferred.

---

## Signals Module

| Component | Level | Notes |
|---|---|---|
| Signals route (`/director/signals`) | 8 | Built. DONNA context registered. |
| `/api/donna/attention` | 8 | Built. Sprint 370. Returns attention items. |
| `/api/donna/brief` | 8 | Built. Sprint 369. Returns daily brief. |
| Recommendation engine | 8 | Sprint 374–375. Rule-based, client-side. |
| Learning feedback signals | 8 | Sprint 376. Captured on card actions. |
| Today's Academy screen | 10 | Route built Sprint 386. Sessions, stat strip, DONNA context, risk flags. |

**Rating: 8** — Today's Academy screen built. Signals APIs are wired. AI-powered attention/brief still go through DONNA panel (not server-rendered).

---

## Platform Module

| Component | Level | Notes |
|---|---|---|
| `/platform` route (scaffolded) | 4 | Exists. Middleware gate works. No real data queries. |
| `platform_roles` table | 2 | Referenced in middleware. NOT in `database.types.ts`. |
| Cross-academy aggregation queries | 0 | Not built. |
| Multi-academy RLS policy | 0 | Not defined. |
| `/platform/academies` route | 0 | Not built. Proposed Sprint 392+. |
| Platform-level DONNA | 0 | Not scoped. |

**Rating: 2** — Platform module is concept-level. Requires migration + RLS design before any build.

---

## Summary Table

| Module | Level | Sprint to reach Level 10 |
|---|---|---|
| Auth & Identity | 9 | Sprint 392+ (platform_roles migration) |
| Sessions | 9 | Sprint 390 (coach session DONNA context) |
| Templates | 10 | Done |
| Players | 9 | Sprint 393+ (summarize_player_progress stub) |
| Curriculum | 8 | Sprint 393+ (DONNA context wiring pass) |
| DONNA / Proposed Actions | 9 | Ongoing (4 stub tasks) |
| Communications | 6 | Sprint 389 (parent comms screen) + future (email delivery) |
| Attendance | 9 | No blockers — QA ongoing |
| Signals | 8 | Sprint 387+ (session detail DONNA context) |
| Platform | 2 | Sprint 392+ (migration required first) |

---

*Last updated: Sprint 388*
