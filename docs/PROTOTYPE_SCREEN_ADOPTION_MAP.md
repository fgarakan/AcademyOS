# Prototype Screen Adoption Map — Sprint 385

Maps the 8 Manus prototype operating screens into the current AcademyOS product.
Audit only — no screens are built in this sprint.

**Last updated:** 2026-05-15

---

## How to read this document

Each screen entry answers:
- What is it for, and who uses it?
- What route does it get?
- Does a route exist today?
- What does it show, and where does the data come from?
- What can DONNA read, propose, and protect?
- What must NOT be built yet?

Backend readiness ratings are in `SCREEN_BACKEND_READINESS_MAP.md`.
DONNA capability details are in `DONNA_SCREEN_CAPABILITY_MAP.md`.

---

## Screen 1 — Director Command Center

**Product purpose:**
The director's primary voice + text command surface. Issues directives, drafts actions, monitors the review queue, surfaces COO-layer intelligence. This is the "dispatch center" for the whole academy.

**User role:** `academy_director`

**Proposed route:** `/director/command-center` *(already exists)*

**Existing route:** `/director/command-center` — built in Sprint 219–228. Contains legacy `DirectorAssistantPanel` with keyword-matching voice. Predates the DONNA COO layer.

**Desktop layout model:**
- Two-column: left = command history + quick actions; right = DONNA panel (overlay or docked)
- Full DONNA panel with all COO commands accessible
- Review queue badge visible in header

**Mobile layout model:**
- Single column. DONNA panel opens as full-screen overlay.
- Command history collapses to latest card.

**Data shown:**
- Current review queue count (from `getDonnaReviewQueueAction`)
- Recent DONNA commands + responses (in-session memory only, no DB persistence)
- Attention items (from `/api/donna/attention`)
- Daily brief summary (from `/api/donna/brief`)
- Active draft status if any

**Current backend source:**
- `getDonnaReviewQueueAction` → `proposed_actions` table (Supabase)
- `/api/donna/attention` → `sessions`, `players`, `proposed_actions`
- `/api/donna/brief` → `sessions`, `players`, `templates`
- DONNA panel already wired into all `/director/**` pages

**Placeholder/demo-safe data if backend missing:**
- Hardcoded review queue count (0 or mock)
- Static attention items from `DEMO_ATTENTION_ITEMS` constant
- Brief text from `DEMO_BRIEF_COPY` constant

**DONNA readable context:**
- `donnaPageContextRegistry` entry exists for `/director/command-center`
- Screen name: "Command Center"
- DONNA knows: approval actions, quick links to sessions/templates/players

**DONNA commands supported:**
- All 7 COO commands (attendance exception, daily brief, attention, parent update, coach brief, review queue, recommendations)
- All 15 DonnaTaskId contracts
- Voice TTS output

**DONNA draftable actions:**
- All wired tasks: `create_class_template`, `create_fitness_template`, `capture_coach_note`, `create_session`, `populate_session_from_template`, `draft_parent_update`, `draft_player_note`, `review_level_readiness`, `handle_attendance_exception`, `adjust_curriculum`, `draft_coach_communication`

**Protected actions:**
- All draft approval routes to `proposed_actions` → director must approve before `execute_approved_action()`
- Communication drafts go through parent-safe filter before any send

**Approval boundaries:**
- Nothing executes until director clicks approve
- All creates/updates go through review queue

**Audit/event needs:**
- `appendAuditEvent` calls already exist in DONNA panel for all major actions
- `audit_logs` table write on every execute

**QA checklist:**
- [ ] DONNA panel opens on command-center route
- [ ] All 7 COO commands route correctly
- [ ] Review queue count badge visible
- [ ] Draft creation flows end with Save button (not auto-save)
- [ ] No external sends triggered without approval

**Dependencies:**
- DONNA modularization (Sprint 384) — complete
- `proposed_actions` pipeline — complete
- `execute_approved_action()` — complete for 11/15 action types

**What must NOT be built yet:**
- No automatic execution of commands
- No live AI NLU beyond current deterministic routing
- No external email/SMS sends from this screen

---

## Screen 2 — DONNA Executive Panel Upgrade

**Product purpose:**
DONNA is not a separate screen — it is the persistent executive assistant panel that appears on every director-facing route. The "upgrade" in the prototype refers to the full COO command set, voice output, and modularized architecture completed in Sprints 359–384. No new route is required.

**User role:** `academy_director` (panel visible), `head_coach` / `coach` (limited COO commands in future)

**Proposed route:** No dedicated route. Rendered as `DonnaAssistantButton` on all `/director/**` pages.

**Existing state:**
- `src/components/assistant/DonnaAssistantButton.tsx` — 3,346 lines after Sprint 384 modularization
- Extracted modules: `DonnaVoiceLayer`, `DonnaWorkflowCards`, `DonnaDeveloperTools`, `DonnaAttendanceLayer`
- Documentation stubs: `DonnaPanelShell`, `DonnaCommandDispatcher`, `DonnaDraftLayer`, `DonnaReviewLayer`, `DonnaInputBar`
- Modularization map: `docs/DONNA_MODULARIZATION_MAP.md`

**Desktop layout model:**
- Fixed right-side panel (`w-80` to `w-96`) sliding in from the right
- Trigger: floating lime button (`button[aria-label="Ask Donna"]`) — bottom-right corner
- Panel header: DONNA name, review queue badge, close button
- Scrollable content: voice card, workflow cards, mode buttons, quick actions

**Mobile layout model:**
- Full-width bottom sheet or full-screen overlay
- Same component, responsive width adapts

**What the upgrade delivers (already complete):**
- Voice input + TTS output (Sprints 297–310, 350)
- Conversation controller with draft lifecycle (Sprints 315–322)
- COO command routing — 7 commands (Sprints 369–383)
- Developer Tools panel with diagnostics (Sprint 350)
- Recommendation engine (Sprints 374–375)
- Preference memory (Sprint 377)
- Audit trail (Sprint 361)
- Attendance exception draft + session resolution (Sprints 372, 381, 383)
- Sprint 384 modularization for parallel agent development

**DONNA context per screen:**
Registered contexts in `donnaPageContextRegistry`:
- `/director` → Dashboard
- `/director/command-center` → Command Center
- `/director/review` → Review Queue
- `/director/curriculum` → Curriculum
- `/director/class-templates` → Class Templates
- `/director/fitness/templates` → Fitness Templates
- `/director/sessions` → Sessions
- `/director/players/[playerId]` → Player Profile
- `/director/players` → Players
- `/director/signals` → Signals
- All others → Academy OS (fallback)

**Contexts NOT yet registered (need Sprint 386+):**
- `/director/today` → Today's Academy
- `/director/level-up` → Level Up
- `/director/parents` → Parent Communications
- `/coach/recap` → Coach Recap
- `/coach/sessions/[sessionId]` → Session Workspace

**What must NOT be built yet:**
- No automatic execution on voice phrase
- DONNA never sends emails/SMS directly
- DONNA never writes to production data without director approval

---

## Screen 3 — Today's Academy

**Product purpose:**
A purpose-built "today view" for the director — a single screen that shows everything happening today: sessions running, coaches on duty, players needing attention, review queue count, and DONNA's daily brief. Replaces the general dashboard as the morning anchor screen.

**User role:** `academy_director`

**Proposed route:** `/director/today` *(does not exist — new screen)*

**Existing route:** `/director` (Dashboard) is the closest equivalent. It shows sessions, priority queue, alerts, and improvement signals but is not optimized for the "today" mental model.

**Desktop layout model:**
- Three zones: left column (today's session list), center (attention + daily brief card), right column (DONNA panel — already persistent)
- Fixed sidebar (`w-60`) + flex-1 main area (matches director layout)
- Header: `"Today — [day, date]"` with review queue badge

**Mobile layout model:**
- Stacked sections: date header → session cards → attention → brief → DONNA trigger
- Swipe-to-open DONNA from bottom trigger

**Data shown:**
- Today's sessions: from `sessions` table filtered by `scheduled_date = today`, including coach name, group, template name, status
- Sessions missing blocks: from `session_blocks` — sessions with no blocks populated
- Players needing attention: from attention engine (`/api/donna/attention`)
- Daily brief: from `/api/donna/brief`
- Pending review count: from `getDonnaReviewQueueAction`
- Recommendations: from `evaluateRecommendations` (client-side)

**Current backend source:**
- `sessions` table (Supabase) — all session data available
- `profiles` + `academy_memberships` — coach names
- `templates` — template names
- `session_blocks` — block population check
- `/api/donna/attention` — attention engine (built, Sprint 370)
- `/api/donna/brief` — daily brief API (built, Sprint 369)
- `proposed_actions` — review queue count

**Placeholder/demo-safe data if backend missing:**
- Static mock sessions array with date = today
- Static attention items: `[{ type: 'session_missing_blocks', ... }]`
- Brief text: `"Three sessions today. Two players are due for assessment. One coach brief is pending."`

**DONNA readable context:**
- New entry needed in `donnaPageContextRegistry` for `/director/today`
- Screen name: "Today's Academy"
- DONNA intro: "I can see today's sessions, pending reviews, and what needs your attention."

**DONNA commands supported:**
- "What needs my attention today?" → attention engine
- "Give me my daily brief." → brief API
- "What needs approval?" → review queue
- "Log an attendance exception" → attendance draft
- All 7 COO commands

**DONNA draftable actions:**
- Attendance exception draft
- Coach brief draft
- Session creation draft

**Protected actions:**
- Session status changes require approval
- Attendance records require approval
- No automatic session status update

**Approval boundaries:**
- All mutations: DONNA proposes → director approves → `execute_approved_action()`

**Audit/event needs:**
- Page view event when director loads Today screen (future)
- All DONNA actions already audit-logged

**QA checklist:**
- [ ] Page loads with today's sessions
- [ ] Sessions missing blocks flagged
- [ ] Brief card loads from API (or graceful empty state)
- [ ] Attention items load from API (or graceful empty state)
- [ ] DONNA panel opens with correct context
- [ ] No stale data from yesterday

**Dependencies:**
- Sessions backend (available)
- `/api/donna/attention` (available)
- `/api/donna/brief` (available)
- DONNA context registry entry (new, needed before build)
- Director layout (available)

**What must NOT be built yet:**
- No automatic session start/stop from this screen
- No bulk attendance write from this screen
- Multi-academy "today" aggregation (separate platform screen)

---

## Screen 4 — Sessions / Director Plan / Coach Brief

**Product purpose:**
Three closely related views:
1. **Sessions list** — all upcoming and past sessions for the academy
2. **Director Plan view** — session detail: template, blocks, assigned coach, group, goals
3. **Coach Brief** — director-drafted brief for the coach running a specific session

**User roles:** `academy_director` (all three); `head_coach` / `coach` (brief view only on their sessions)

**Proposed routes:**
- `/director/sessions` — sessions list *(exists)*
- `/director/sessions/[sessionId]` — session detail / director plan *(exists)*
- `/director/sessions/[sessionId]/brief` — coach brief for a session *(new — do not build yet)*
- `/coach/sessions` — coach sessions list *(exists)*
- `/coach/sessions/[sessionId]` — coach session workspace *(exists)*

**Existing routes:**
- `/director/sessions` — built. Shows session list with status, date, coach, template. Full read-only.
- `/director/sessions/[sessionId]` — built. Shows session detail with blocks.
- `/coach/sessions` — built. Coach-facing sessions with status.
- `/coach/sessions/[sessionId]` — built. Session workspace with wrap-up recording.

**Desktop layout model (director):**
- Fixed sidebar + flex-1 content
- Sessions list: table/card view with filters (date range, status, coach, group)
- Session detail: left = session metadata + blocks; right = DONNA panel (persistent)

**Mobile layout model (coach):**
- Card-based session list with swipe actions
- Session detail: full-width cards stacked (blocks, observations, wrap-up form)

**Data shown:**
- Session list: `sessions` table — id, name, scheduled_date, status, coach_id, template_id, group_id
- Session detail: session metadata + `session_blocks` (block list, order, categories)
- Coach name: joined from `profiles`
- Template name: joined from `templates`
- Group: from `groups` or `academy_memberships`
- Coach brief: DONNA draft → `proposed_actions` → approved → sent via coach-facing view

**Current backend source:**
- `sessions` + `session_blocks` + `templates` + `profiles` — all available, fully typed

**Placeholder/demo-safe data if backend missing:**
- Seed sessions from Airtable import (`data/airtable-import/Daily Sessions-Grid view.csv`)
- Mock blocks array with default categories

**DONNA readable context:**
- `/director/sessions` registered in `donnaPageContextRegistry` (screenName: "Sessions")
- `/director/sessions/[sessionId]` — NOT yet registered (needs entry)
- `/coach/sessions/[sessionId]` — NOT yet registered (needs entry)

**DONNA commands supported (session list):**
- "Create a session for [group] on [date]" → `create_session` task
- "Populate blocks for [session]" → `populate_session_from_template` task
- "What needs approval?" → review queue

**DONNA commands supported (session detail):**
- "Draft a coach brief for this session" → `draft_coach_communication` task
- "Add a block to this session" → `populate_session_from_template` task
- "Capture a note about [player]" → `capture_coach_note` task

**DONNA draftable actions:**
- `create_session` — wired (Sprint 270)
- `populate_session_from_template` — wired (Sprint 271)
- `draft_coach_communication` — wired (Sprint 282)
- `capture_coach_note` — wired (Sprint 270)

**Protected actions:**
- Session creation requires director approval
- Block assignment requires director approval
- Coach brief send requires director approval

**Approval boundaries:**
- All session mutations: `proposed_actions` → review queue → `execute_approved_action()`
- Coach brief: drafted by DONNA → director reviews → coach sees in session workspace

**Audit/event needs:**
- Session create/update: `audit_logs` write on execute
- Coach brief: proposed_action row + executed row

**QA checklist:**
- [ ] Sessions list loads with correct sessions for academy
- [ ] Session detail shows blocks populated vs empty
- [ ] DONNA "create a session" flow produces proposed_action (not immediate write)
- [ ] DONNA "draft a coach brief" flow works on session detail
- [ ] Coach brief visible in coach-facing session workspace after approval
- [ ] No direct writes without approval

**Dependencies:**
- Sessions backend — available
- `populate_session_from_template` server action — available
- `draft_coach_communication` server action — available
- DONNA context entry for session detail (new, needed before Sprint 386)

**What must NOT be built yet:**
- `/director/sessions/[sessionId]/brief` dedicated route — plan only
- Automated session generation from weekly schedule — future
- Coach-to-director brief feedback loop — future

---

## Screen 5 — Coach Recap Flow

**Product purpose:**
A guided post-session flow for coaches. Immediately after a session ends, the coach documents: what happened, who attended, what observations matter, what to tell the director. The recap creates a structured wrap-up that enters the director's review queue.

**User roles:** `coach`, `head_coach`

**Proposed routes:**
- `/coach/sessions/[sessionId]` — session workspace (wrap-up tab) *(exists)*
- `/coach/recap` — dedicated post-session recap shortcut *(proposed new — do not build yet)*

**Existing route:** `/coach/sessions/[sessionId]` — built with `CoachSessionWorkspace`, `CoachWrapUpDrawer`. Wrap-up recording works. Approval queue integration built.

**Desktop layout model:**
- Minimal: single centered column (`max-w-2xl`), no sidebar
- Step 1: attendance (who showed, who missed)
- Step 2: observations (1–3 key player notes, freeform)
- Step 3: session outcome (what worked, what to change)
- Step 4: coach note to director (optional private note)
- Step 5: submit → enters review queue as `session_wrap_up` proposed_action

**Mobile layout model:**
- Identical — optimized for phone, thumb-reachable controls
- Large tap targets, voice input option

**Data shown:**
- Session: from `sessions` table (name, date, group, template)
- Roster: from `academy_memberships` or groups (players in group)
- Prior wrap-up state: from `proposed_actions` (resume if partially saved)
- Player names for observation autocomplete: from `players` table

**Current backend source:**
- `sessions` table — available
- `players` + `academy_memberships` — available
- `proposed_actions` — wrap-up draft persistence
- `saveAttendanceExceptionDraftAction` — attendance exception path available

**Placeholder/demo-safe data if backend missing:**
- Demo roster from `DEMO_PLAYERS` constant (5 players)
- Pre-filled template: `{ attended: ['Player A', 'Player B'], ...}`

**DONNA readable context:**
- `/coach/sessions/[sessionId]` NOT yet in `donnaPageContextRegistry`
- Needs entry: screen name "Session Workspace", DONNA intro targeting wrap-up shortcuts
- DONNA not currently visible in coach routes (DonnaAssistantButton is `academy_director`-gated)

**DONNA commands supported (future — coach DONNA not yet built):**
- "Capture a note about Sarah" → `capture_coach_note` task
- "Everyone was here except Lucas" → attendance exception draft
- "Submit my recap" → wrap-up draft submit

**DONNA draftable actions:**
- `capture_coach_note` — wired
- `handle_attendance_exception` — wired (Sprint 383)

**Protected actions:**
- Wrap-up submission → `proposed_actions` only, never directly mutates session record
- Player observation write → goes to `coach_notes` (not directly visible to parent) — requires director review for parent-facing version

**Approval boundaries:**
- Wrap-up: coach submits → `proposed_actions` row → director approves → `applyWrapUpDraftAction` runs
- Parent-facing notes: separate parent-safe filter before any parent visibility

**Audit/event needs:**
- `audit_logs` write when wrap-up is applied

**QA checklist:**
- [ ] Coach can load session and see roster
- [ ] Coach can enter observations
- [ ] Submit creates proposed_action (not direct write)
- [ ] Director can see wrap-up in review queue
- [ ] Director approval triggers `applyWrapUpDraftAction`
- [ ] No player data exposed to wrong coach

**Dependencies:**
- Coach session workspace (available)
- `applyWrapUpDraftAction` (available)
- `proposed_actions` pipeline (available)
- DONNA for coach portal: not yet built — do not add to this sprint

**What must NOT be built yet:**
- `/coach/recap` dedicated route — plan only
- Coach DONNA panel — future sprint
- Voice-only recap mode — future sprint

---

## Screen 6 — Level Up / Readiness Review

**Product purpose:**
A dedicated screen showing which players are ready for level advancement — their current level, assessment scores, coach notes, and whether the readiness gates are met. The director approves level changes from here.

**User role:** `academy_director`, `head_coach`

**Proposed route:** `/director/level-up` *(does not exist — new screen)*

**Existing route:**
- `/director/players/[playerId]` → Skill Path tab — per-player readiness view (built)
- `/director/review` → review queue includes level movement items
- No aggregate "all players ready for level up" screen exists

**Desktop layout model:**
- Fixed sidebar + flex-1 content
- Filter row: by level, by group, by readiness status
- Player cards in grid/list: current level, assessed level, gate status, coach note excerpt, "Review" CTA
- DONNA panel persistent on right

**Mobile layout model:**
- Stacked player cards
- Filter as horizontal scroll chips
- Tap player → slide-in detail sheet

**Data shown:**
- Players ready for advancement: `players` table filtered by `level_assessment_status = 'ready_for_review'` or equivalent signal
- Current level from `curriculum_enrollments` or `players.current_level`
- Readiness gates from placement/assessment data (`assessments` table)
- Coach notes excerpt from `coach_notes` table
- IDP progress from `buildIndividualDevelopmentPlan`

**Current backend source:**
- `players` table — available
- `assessments` table — available
- `coach_notes` table — available
- `getReassessmentPipeline()` from `src/lib/backend/dashboard.ts` — already called on director dashboard
- Level gate configuration from `donnaLevelMovementActions.ts`

**Placeholder/demo-safe data if backend missing:**
- Demo players from `getPlayerSummaries` with hardcoded `readiness_for_advancement: true`
- 3 mock players: "Orange 1 → Orange 2 ready", "Yellow → Orange 1 borderline", "Red → Yellow pending"

**DONNA readable context:**
- No `donnaPageContextRegistry` entry exists for `/director/level-up` — needs new entry
- Screen name: "Level Up Review"
- DONNA intro: "I can see which players are ready for advancement and help you review their readiness."

**DONNA commands supported:**
- "Review level readiness for [player]" → `review_level_readiness` task
- "What does Donna recommend?" → recommendation engine (curriculum category)
- "Show players ready for level up" → filter command

**DONNA draftable actions:**
- `review_level_readiness` — task contract exists (Sprint 366), wired action available
- `summarize_player_progress` — task contract exists

**Protected actions:**
- Level movement: DONNA NEVER automatically advances a player's level
- `finalize_player_placement()` is the only RPC that activates/levels a player
- All level change proposals go to `proposed_actions` → director explicit approval

**Approval boundaries:**
- Level advancement: `review_level_readiness` draft → director approves → `execute_approved_action()` → `finalize_player_placement()`
- This boundary is an architecture red line — never bypass

**Audit/event needs:**
- `audit_logs` write on every level change execution
- Assessment event log on readiness gate evaluation

**QA checklist:**
- [ ] Players with readiness signals surface correctly
- [ ] Gate status shown (met / not met / borderline)
- [ ] DONNA "review level readiness for Lucas" starts correct task
- [ ] Level change proposal goes to proposed_actions (not direct write)
- [ ] `finalize_player_placement()` is the only execution path

**Dependencies:**
- `getReassessmentPipeline()` — available
- `donnaLevelMovementActions` — available (Sprint 383.x)
- `assessments` table — available
- Player profile Skill Path tab (available as sub-view)
- DONNA context entry (new, needed before Sprint 386)

**What must NOT be built yet:**
- Automatic level advancement on passing assessment score
- Bulk level change without per-player approval
- Coach-initiated level change (director/head_coach only)

---

## Screen 7 — Parent Communication Center

**Product purpose:**
A director-side screen for managing all parent-facing communications: drafted updates, approved messages, pending parent questions, and private lesson requests. Everything the director might send to or hear from parents, in one place.

**User role:** `academy_director`, `head_coach`

**Proposed route:** `/director/parents` *(does not exist — new screen)*

**Existing routes:**
- `/parent` — parent portal (parent-side view, built)
- DONNA `draft_parent_update` task available from any director screen
- `/director/review` → review queue includes parent update proposals
- Private lesson requests are in `/parent` (requestPrivateLessonAction)

**Desktop layout model:**
- Fixed sidebar + flex-1 content
- Left column: list of pending/sent communications (filter: pending / approved / sent)
- Right column: communication detail + DONNA draft panel
- DONNA panel persistent

**Mobile layout model:**
- Tab bar: Drafts | Approved | Private Lessons | Settings
- Communication cards stacked
- DONNA trigger bottom-right

**Data shown:**
- Pending parent updates: `proposed_actions` filtered by `action_type = 'parent_update'`
- Approved/sent communications: same table, status = `executed`
- Private lesson requests: from `private_lesson_requests` table (if exists) or via signals
- Parent-safe content preview: sanitized through `parentSafeResponseRules`
- Player names + groups: from `players` + `academy_memberships`

**Current backend source:**
- `proposed_actions` table — available (all parent updates stored here)
- `draft_parent_update` server action — available (Sprint 275)
- `saveParentUpdateDraftAction` — available
- `parentSafeResponseRules` — locked/stable
- `sanitizeParentFacingText` — available

**Placeholder/demo-safe data if backend missing:**
- 2 mock pending updates: "Sophia — Weekly progress note (draft)", "Lucas — Attendance concern (pending approval)"
- Static approved example: "Alex — Level advancement notification"

**DONNA readable context:**
- No `donnaPageContextRegistry` entry for `/director/parents` — needs new entry
- Screen name: "Parent Communications"
- DONNA intro: "I can draft parent updates, check what's pending approval, and surface private lesson requests."

**DONNA commands supported:**
- "Draft a parent update for [player]" → `draft_parent_update` task
- "What needs approval?" → review queue (filtered to parent items)
- "Show pending parent communications" → navigation

**DONNA draftable actions:**
- `draft_parent_update` — wired (Sprint 275)
- `draft_coach_communication` — wired (Sprint 282)

**Protected actions:**
- Parent communications NEVER send automatically
- All drafts must pass parent-safe content filter before director sees them
- Director must explicitly approve before any communication reaches parents

**Approval boundaries:**
- Parent update: DONNA drafts → parent-safe filter → director reviews in this screen → approves → `execute_approved_action()`
- Private lesson: parent requests → director sees here → approves or declines

**Audit/event needs:**
- `audit_logs` write on communication approval and execution
- Parent-safe filter event log (which content was flagged, what was changed)

**QA checklist:**
- [ ] Pending parent communications shown from proposed_actions
- [ ] Parent-safe filter applied to all draft previews
- [ ] DONNA draft flow creates proposed_action (not direct write/send)
- [ ] Approved communication not automatically sent (requires external delivery step)
- [ ] Private lesson requests visible

**Dependencies:**
- `proposed_actions` pipeline — available
- `draft_parent_update` action — available
- `parentSafeResponseRules` — available
- Player data — available
- External communication delivery (email/SMS) — NOT YET BUILT (see Known Limitations)

**What must NOT be built yet:**
- Automated email/SMS delivery from this screen
- Parent reply tracking
- Bulk communications
- Parent portal messaging (two-way)

---

## Screen 8 — Multi-Academy Portal

**Product purpose:**
A separate high-permission portal for platform owners who manage multiple academies. Shows aggregate academy health, allows switching between academy contexts, manages coach/director assignments across academies, and surfaces cross-academy patterns.

**User role:** `platform_owner` (separate from `academy_director`) — requires `platform_roles` table row

**Proposed routes:**
- `/platform` *(exists — scaffolded)*
- `/platform/academies` *(proposed new)*
- `/platform/academies/[academyId]` *(proposed new)*
- `/owner/multi-academy` *(alternative route — defer to `/platform`)*

**Existing route:** `/platform` — scaffolded `layout.tsx` and `page.tsx` exist. Middleware already gates `/platform` to users with a `platform_roles` row. The page content is minimal (placeholder only).

**Desktop layout model:**
- Full-width layout (no academy-specific sidebar)
- Top nav: Academy OS platform logo + platform user name
- Left: academy list (sortable by size, status, last active)
- Center: selected academy summary card
- Right: platform-level DONNA panel (if any)

**Mobile layout model:**
- Single column: academy list → tap → detail screen
- No persistent DONNA panel on mobile for this view

**Data shown:**
- Academy list: from `academies` or `organizations` table (separate from `academy_memberships`)
- Per-academy health: player counts, session counts, pending review items
- Coach assignments: cross-academy staff map
- Level distribution: aggregate curriculum distribution across all academies

**Current backend source:**
- `platform_roles` table — referenced in middleware but NOT in `database.types.ts` (requires migration to formalize)
- `/platform` route — scaffolded, no real data queries
- No `organizations` or cross-academy aggregation tables exist yet

**Placeholder/demo-safe data if backend missing:**
- Static academy list: `[{ name: "Angles Tennis Academy", city: "London", players: 47, status: "active" }]`
- Hardcoded health metrics: `{ sessions_this_week: 12, pending_reviews: 3, attention_items: 2 }`

**DONNA readable context:**
- No `donnaPageContextRegistry` entry for `/platform` — needs new entry
- Screen name: "Platform Portal"
- Limited DONNA capability at platform level — scope needs definition

**DONNA commands supported:**
- TBD — platform-level commands not yet specified
- Minimal: "Show me [academy name]" → navigate to academy detail

**DONNA draftable actions:**
- None defined at platform level — deferred to Sprint 390+

**Protected actions:**
- Cross-academy data access requires `platform_roles` check (middleware enforces this)
- Platform user CANNOT impersonate academy director (separate permissions)
- Academy-specific mutations require being inside that academy's context

**Approval boundaries:**
- Platform-level config changes: TBD
- All academy-specific mutations still go through academy's `proposed_actions` pipeline

**Audit/event needs:**
- Platform-level audit log (separate from per-academy `audit_logs`) — not yet built

**QA checklist:**
- [ ] `/platform` route only accessible to `platform_roles` users
- [ ] Non-platform users redirected correctly (middleware already handles this)
- [ ] Academy list renders (even if demo data)
- [ ] No cross-academy data leakage (RLS must cover)

**Dependencies:**
- `platform_roles` table — referenced in middleware, NOT formalized in types
- Cross-academy aggregation queries — not built
- Multi-academy RLS policy — not defined
- `platform_roles` migration required before real build

**What must NOT be built yet:**
- Cross-academy bulk operations
- Platform-level DONNA commands
- Academy creation/deletion from this portal
- Any feature that bypasses per-academy RLS

---

## Sprint Order Recommendation (Sprint 386+)

See `SCREEN_BACKEND_READINESS_MAP.md` for backend readiness ratings.

**Recommended sequence:**

| Sprint | Screen | Deliverable |
|---|---|---|
| 386 | Today's Academy | `/director/today` — sessions, brief card, attention items, DONNA context entry |
| 387 | Sessions Detail + DONNA context | DONNA context entry for session detail; coach brief draft from session screen |
| 388 | Level Up / Readiness Review | `/director/level-up` — readiness list, DONNA context entry, `review_level_readiness` flow |
| 389 | Parent Communication Center | `/director/parents` — pending parent updates, DONNA draft flow, parent-safe preview |
| 390 | Coach Recap polish | `/coach/recap` route shortcut; DONNA context for coach session workspace |
| 391 | Command Center refresh | Upgrade `/director/command-center` to reflect modularized DONNA; remove legacy `DirectorAssistantPanel` |
| 392+ | Multi-Academy Portal | `/platform/academies` — requires platform_roles migration first |

**Rationale:**
- Screens 3 (Today) and 6 (Level Up) have the highest readiness and require no migrations.
- Screen 7 (Parent Center) requires no new backend — just a new route that queries existing `proposed_actions`.
- Screen 8 (Multi-Academy) requires a migration and cross-academy RLS work — build last.

---

*Last updated: Sprint 385*
