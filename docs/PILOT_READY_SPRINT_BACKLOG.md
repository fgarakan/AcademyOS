# AcademyOS Pilot-Ready Sprint Backlog V1

**Date:** 2026-05-20
**Sprint:** 397
**Status:** Complete — Audit Only, no app code changed
**Scope:** Sprint 398 onward — dependency-aware sprint plan to minimum pilot-ready and 10/10 full pilot-ready

---

## Pilot-Readiness Tiers

### Tier 0 — Must Work Before Any Demo (Blocking)
These are prerequisites. Without them, the demo fails completely.
- Director logs in, completes onboarding, saves DNA
- Coach logs in, sees today's session, submits wrap-up
- Director approves wrap-up in review queue
- Player logs in, sees IDP and missions with their real data
- Parent logs in, sees approved child snapshot

### Tier 1 — Minimum Pilot-Ready (Demo Can Run)
The demo tells the full story but some pages are rough.
- Coach wrap-up is clean one-question flow
- Player hero card is visually compelling
- Player portal has full navigation with data on each path page
- Parent portal shows Home snapshot and Development tab with real data
- Review queue shows and applies all draft types

### Tier 2 — Prototype-Parity Pilot-Ready
Every screen matches the prototype experience. Data is real. All roles feel finished.
- Coach wrap-up matches DonnaWrapUp one-question UX exactly
- Player portal matches all 10 prototype screens (including Celebration)
- Parent portal matches all 10 prototype screens (including path pages and lesson flow)
- Curriculum builder shows real level content
- DONNA surfaces customized with academy-specific copy

### Tier 3 — 10/10 Full Pilot-Ready
Everything works, nothing is stubbed, voice is production-quality, all connections are live.
- Production STT (Whisper) active
- Production TTS active
- execute_approved_action() covers all 15 types
- session_actuals table populated from approved wrap-ups
- AI note structuring active (ANTHROPIC_API_KEY set)
- No pending migrations on live DB
- All roles tested on mobile + desktop

---

## Recommended Next 20 Sprints (Sprint 398 to Sprint 417)

### Sprint 398 — Data Foundation: Migrations + Demo Player Seed V1

**Purpose:** Apply all pending migrations to live DB. Pre-seed demo player, demo academy, demo curriculum level. This is a prerequisite for every subsequent sprint.

**Files:**
- New: `docs/SPRINT_398_DATA_FOUNDATION.md` (audit doc only)
- Instruction doc for manual migration application
- Optional: seed script for demo player data

**Expected output:** All pending migrations applied. Demo player exists with full IDP. All portals show real data for demo player.

**Dependency:** None

**Pilot value:** CRITICAL — without this, nothing else works

**Risk level:** HIGH — live DB changes; apply in order; verify after each

---

### Sprint 399 — Academy DNA Final Save Wiring V1

**Purpose:** Wire the Academy DNA save so all 9 DNA field groups (academy model, age groups, coaching styles, communication voice, session blocks, development priorities, parent communication style, coaching cues, session defaults) persist to the `academies` table on final activation.

**Files:**
- `src/lib/actions/saveAcademyDnaAction.ts` (new server action)
- `src/components/onboarding/steps/ActivationChecklistStep.tsx` (wire save button)
- `src/app/director/onboarding/page.tsx` (pass save result to checklist)

**Expected output:** Director completes onboarding → DNA is saved to DB → ActivationChecklistStep shows "Academy DNA saved" confirmation.

**Dependency:** Sprint 398 (demo academy row must exist)

**Pilot value:** HIGH — director must be able to save their academy identity

**Risk level:** MEDIUM — touches onboarding shell state management

---

### Sprint 400 — Coach Wrap-Up DONNA Guided Flow V1

**Purpose:** Rebuild the coach wrap-up as a one-question-at-a-time DONNA-guided flow matching the prototype DonnaWrapUp screen. Replace the fragmented drawer approach with a dedicated wrap-up step flow.

**Files:**
- `src/app/coach/sessions/[sessionId]/wrap-up/WrapUpPageClient.tsx` (rewrite as step flow)
- `src/components/coach/DonnaWrapUpFlow.tsx` (new step-by-step component)
- `src/app/coach/sessions/[sessionId]/wrap-up/review/page.tsx` (summary confirmation)

**Expected output:** Coach opens wrap-up → one question at a time → progress bar → side summary panel accumulating → Submit → proposed_action created → redirect to submitted confirmation.

**Dependency:** Sprint 398

**Pilot value:** CRITICAL — coach UX is the highest abandonment risk

**Risk level:** MEDIUM — rewrites wrap-up UX on stable existing backend

---

### Sprint 401 — Coach Wrap-Up Submitted Summary Screen V1

**Purpose:** Build the SubmittedSummary screen shown after a coach submits their wrap-up. Confirmation tone: "Wrap-up submitted for director review." Shows summary of what was captured. Links back to session or coach home.

**Files:**
- `src/app/coach/sessions/[sessionId]/wrap-up/submitted/page.tsx` (new page)
- `src/components/coach/WrapUpSubmittedCard.tsx` (new component)

**Expected output:** After wrap-up submit, coach sees a clear confirmation that their wrap-up is in the director review queue. Not "Done" — "Submitted for review."

**Dependency:** Sprint 400

**Pilot value:** HIGH — prevents coach confusion about whether wrap-up was received

**Risk level:** LOW — read-only display page

---

### Sprint 402 — Player Home Hero Card Visual Upgrade V1

**Purpose:** Upgrade `/player/page.tsx` hero card to match prototype pattern: gradient border glow, current mission as large hero text, level progress bar (gates_passed / gates_total), streak counter from session_attendance, "Continue Mission" CTA button. Expand path card grid from 4 to 6 (add Level Up and Practice cards).

**Files:**
- `src/components/player/PlayerHomeHeroCard.tsx` (upgrade)
- `src/app/player/page.tsx` (expand card grid, wire streak, wire gate progress)

**Expected output:** Player home looks like prototype — mission front and center, level progress visible, all 6 path cards accessible.

**Dependency:** Sprint 398

**Pilot value:** HIGH — first screen a player sees; must be compelling

**Risk level:** MEDIUM — hero card visual upgrade, new data reads for streak and gate progress

---

### Sprint 403 — Player Mission Map Gamification V1

**Purpose:** Upgrade `/player/missions/page.tsx` to match prototype MissionMap: status section headers (Current Mission / Next Mission / Future Missions), ACTIVE/NEXT UP/FUTURE/LOCKED treatment per mission, thin progress bar per active mission, evidence text from gate requirements.

**Files:**
- `src/app/player/missions/page.tsx` (upgrade layout, add sections, add progress bar)

**Expected output:** Missions page feels gamified — clear active vs. future distinction, visual momentum, "evidence needed" text grounded in real gate data.

**Dependency:** Sprint 398, Sprint 402

**Pilot value:** HIGH — core player engagement loop

**Risk level:** LOW — additive visual upgrade on existing data

---

### Sprint 404 — Player Path Pages Visual Upgrade V1

**Purpose:** Upgrade `/player/skill-path`, `/player/competition-path`, and `/player/fitness-path` to match prototype visual richness: 2-column card grid, sub-component chips per skill area, progress bars from observation counts, current focus highlight card, SVG circle progress rings for fitness.

**Files:**
- `src/app/player/skill-path/page.tsx`
- `src/app/player/competition-path/page.tsx`
- `src/app/player/fitness-path/page.tsx`
- `src/components/player/CircleProgress.tsx` (new SVG component)

**Expected output:** All three path pages visually match prototype. Data is real observation counts.

**Dependency:** Sprint 402

**Pilot value:** HIGH — path pages are core player information screens

**Risk level:** LOW — additive visual upgrade; no new DB reads needed

---

### Sprint 405 — Player Level Up + Mission Detail Visual Upgrade V1

**Purpose:** Upgrade `/player/level-up` with side-by-side current→next level comparison card, overall progress bar (gates_passed / gates_total), gate requirement rows with done/not-done states. Upgrade `/player/missions/[priorityId]` with "Coach Watch-For" section and "Evidence Needed" progress bars.

**Files:**
- `src/app/player/level-up/page.tsx`
- `src/app/player/missions/[priorityId]/page.tsx`

**Expected output:** Level-up page shows clear requirements; mission detail shows evidence tracking.

**Dependency:** Sprint 398, Sprint 403

**Pilot value:** HIGH — level advancement is a key trust signal

**Risk level:** LOW — additive; no new DB reads

---

### Sprint 406 — Parent Home Snapshot Upgrade + Next Steps Page V1

**Purpose:** Upgrade parent Home hero card to match prototype snapshot pattern: left lime border, gradient bg, child name + level + progress bar + summary + 3 stats + recommended action. Reorganize home: snapshot hero → path grid (4 cards) → action cards → safety note. Create `/parent/next-steps` page from parentSupportGuide data.

**Files:**
- `src/app/parent/page.tsx` (home upgrade)
- `src/app/parent/next-steps/page.tsx` (new dedicated page)
- `src/components/player/ParentHomeHeroCard.tsx` (new or upgrade)

**Expected output:** Parent home matches prototype snapshot card; Next Steps page gives parents actionable guidance.

**Dependency:** Sprint 398

**Pilot value:** HIGH — parent portal must be compelling for Brian's demo

**Risk level:** LOW — uses existing parentSupportGuide data; no new backend

---

### Sprint 407 — Parent Path Pages V1 (Skill, Competition, Fitness)

**Purpose:** Create three missing parent path pages: `/parent/skill-path`, `/parent/competition-path`, `/parent/fitness-path`. Each uses sanitized coach language (coachLangCurrentFocus, coachLangWorkingOn, coachLangDoingWell) + parentSupportGuide data. Sections: current focus → why it matters → evidence summary → what parents should notice.

**Files:**
- `src/app/parent/skill-path/page.tsx` (new)
- `src/app/parent/competition-path/page.tsx` (new)
- `src/app/parent/fitness-path/page.tsx` (new)
- `src/app/parent/layout.tsx` (add 3 new tabs to BottomTabBar)

**Expected output:** Three new parent path pages with real sanitized data. Parent can navigate to each from home or nav.

**Dependency:** Sprint 406

**Pilot value:** HIGH — three of the ten prototype pages currently missing

**Risk level:** LOW — reuses existing sanitized data adapter; no new safety risks

---

### Sprint 408 — Parent Lesson Request Standalone Flow V1

**Purpose:** Extract `PrivateLessonRequestCard` from parent home into `/parent/request-lesson` standalone page. Add lesson type selector and preview field. Add `/parent/confirmation` page shown after submission.

**Files:**
- `src/app/parent/request-lesson/page.tsx` (new)
- `src/app/parent/confirmation/page.tsx` (new)
- `src/app/parent/page.tsx` (update home card to link to standalone page)

**Expected output:** Parent can request a lesson via dedicated page. Confirmation clearly says "Submitted for director review — not yet booked."

**Dependency:** Sprint 406

**Pilot value:** MEDIUM — inline card works; standalone is prototype-parity

**Risk level:** LOW — reuses existing requestPrivateLessonAction

---

### Sprint 409 — Curriculum Content Seed V1 (Orange Ball 2 Demo Level)

**Purpose:** Seed one complete level of curriculum content for the demo: Orange Ball 2 with coach language fields, gates (3-5 per domain), drills linked via curriculum_class_template_blocks, fitness content. This is the content that powers player path pages, parent path pages, and the curriculum builder demo.

**Files:**
- New migration or seed script (read-only audit first; separate sprint for migration)
- `docs/SPRINT_409_CURRICULUM_SEED.md` (audit doc)

**Expected output:** Director sees real content when opening curriculum builder for Orange Ball 2. Player path pages show coach language. Parent path pages show sanitized focus.

**Dependency:** Sprint 398 (migrations applied)

**Pilot value:** HIGH — curriculum content is the backbone of all player/parent displays

**Risk level:** MEDIUM — seeding must respect RLS; use service role for seed script only

---

### Sprint 410 — Curriculum Builder Real Content Wire V1

**Purpose:** Wire CurriculumMap page to show real level status from DB (not hardcoded). Wire ChangeQueue tab to show real proposed_actions with curriculum_override action_type. Wire LevelBuilder to link blocks to real curriculum_class_template_blocks rows.

**Files:**
- `src/app/director/curriculum/map/page.tsx` (wire to real data)
- `src/app/director/curriculum/page.tsx` (ChangeQueue tab: show real proposed_actions)
- `src/app/director/curriculum/builder/page.tsx` (wire to real junction table)

**Expected output:** Director sees real level statuses in curriculum map. DONNA-proposed curriculum changes show in ChangeQueue as real proposed_actions rows.

**Dependency:** Sprint 409

**Pilot value:** HIGH — curriculum builder must show real content for demo

**Risk level:** MEDIUM — curriculum queries are complex; guard against empty state

---

### Sprint 411 — Director DONNA Daily Brief Live Data V1

**Purpose:** Wire DirectorDonnaDailyBrief to live DB data: real session counts for today, real pending_review count from proposed_actions, real player risk flags from coach_observations, real attention list. Replace simulation data with live queries.

**Files:**
- `src/app/api/donna/brief/route.ts` (wire to live DB)
- `src/lib/donna/commandBriefLiveLoader.ts` (extend live queries)
- `src/components/donna/DirectorDonnaDailyBrief.tsx` (connect real data)

**Expected output:** Director brief shows real today's sessions, real pending reviews, real player risks.

**Dependency:** Sprint 398

**Pilot value:** HIGH — daily brief is the director's first signal every morning

**Risk level:** MEDIUM — live DB queries must be fast; guard against slow joins

---

### Sprint 412 — Coach DONNA Session Context Panel V1

**Purpose:** Wire CoachDonnaSessionPanel to show curriculum context for the current session (active level, coach language focus, player priorities from the session roster). Add DONNA suggestion before session start ("Today's focus: crosscourt depth — try constraint game setup").

**Files:**
- `src/components/donna/CoachDonnaSessionPanel.tsx` (upgrade with real data)
- `src/app/coach/sessions/[sessionId]/page.tsx` (pass curriculum context to DONNA panel)

**Expected output:** Coach sees DONNA context before starting session — relevant, not generic.

**Dependency:** Sprint 398, Sprint 409

**Pilot value:** HIGH — coaches need a reason to use DONNA before wrap-up too

**Risk level:** LOW — read-only display panel

---

### Sprint 413 — Review Queue RPC Extension V1 (11 → 15 types)

**Purpose:** Extend execute_approved_action() RPC to cover the remaining 4 voice intake action types. Document coverage plan completion.

**Files:**
- `supabase/migrations/069_execute_approved_action_v2.sql` (new migration)
- `docs/conversational-os/approved-action-execution-coverage-plan.md` (update)

**Expected output:** All 15 action types fully covered. Approving any proposed_action type produces a visible DB write.

**Dependency:** Sprint 398

**Pilot value:** HIGH — review queue is only valuable if approvals produce real results

**Risk level:** HIGH — live DB RPC change; test each new action type

---

### Sprint 414 — Role Safety Final Audit V1

**Purpose:** Audit every portal page for data leaks across roles. Confirm: parent cannot see raw coach data; player cannot see parent data; coach cannot see director-only fields; preview mode writes are blocked; DONNA never shows unapproved data.

**Files:**
- `docs/SPRINT_414_ROLE_SAFETY_AUDIT.md` (new audit doc)

**Expected output:** Signed-off role safety checklist. Any gaps documented for Sprint 415 fix.

**Dependency:** Sprints 400-412

**Pilot value:** CRITICAL — safety is non-negotiable for a real pilot

**Risk level:** LOW — audit only

---

### Sprint 415 — Mobile QA V1

**Purpose:** Test all player and parent pages on mobile viewport (375px width). Fix nav overlap, card overflow, DONNA chip wrapping, BottomTabBar safe area for 5-tab parent nav. Test coach pages on iPad (768px).

**Files:**
- Multiple player/parent page and component files (mobile fixes only)

**Expected output:** All portals render cleanly on mobile. No overlapping elements. Nav accessible on small screens.

**Dependency:** Sprints 402-408

**Pilot value:** HIGH — Brian's demo may use mobile devices

**Risk level:** LOW — CSS-only fixes; no logic changes

---

### Sprint 416 — Portal Data Integration QA V1

**Purpose:** Audit all portal pages for empty states, loading states, and error boundaries when data is missing. Confirm: missing curriculum level shows graceful empty state; missing priorities shows "no active missions" not crash; missing coach language shows "content coming soon" not blank; missing guardian linkage shows helpful message.

**Files:**
- Multiple portal pages (empty state improvements)

**Expected output:** No portal page crashes on missing data. All empty states are helpful, not confusing.

**Dependency:** Sprints 402-410

**Pilot value:** HIGH — demo will encounter some empty states

**Risk level:** LOW — defensive error handling only

---

### Sprint 417 — Final Pilot Dress Rehearsal Audit V1

**Purpose:** Re-run the full pilot readiness audit. Re-score all 10 surfaces. Confirm demo player data is complete. Confirm all role logins work. Confirm all pending migrations are applied. Write go/no-go decision document for Brian's pilot.

**Files:**
- `docs/SPRINT_417_PILOT_GO_NOGO.md` (new audit doc)
- `docs/PILOT_READINESS_MASTER_AUDIT.md` (update scores)

**Expected output:** Go/no-go document with final scores and explicit list of any remaining gaps that are acceptable for pilot vs. must-fix.

**Dependency:** All previous sprints

**Pilot value:** CRITICAL — ensures nothing is missed before Brian sees the product

**Risk level:** LOW — audit only

---

## Path Summary

### Minimum Pilot-Ready Path (Fastest to Real-Data Demo)

**Sprints 398-402, 406, 409, 411** = 8 sprints

This gives:
- Real data in all portals
- Clean coach wrap-up flow
- Compelling player hero card
- Parent home with snapshot
- Real curriculum content for one level
- Director daily brief with live data

**Estimated: 8 sprints from Sprint 398**

### 10/10 Full Pilot-Ready Path

**All 20 sprints (398-417)** plus:
- Production STT (OPENAI_API_KEY set + Whisper endpoint active)
- Production TTS endpoint built
- session_actuals table (Sprint 403+ future sprint)
- AI note structuring (ANTHROPIC_API_KEY set)
- Coach selection page for lesson flow

**Estimated: 20 sprints for visual + data parity, plus 5-8 additional sprints for voice and advanced DONNA**

**Total to 10/10: approximately 25-28 sprints from Sprint 398**

---

## Deferred / Non-Pilot Items

These items are explicitly deferred from pilot scope. They must not block the pilot timeline.

| Item | Reason for Deferral | When to Build |
|---|---|---|
| Parent outbound messaging (/parent/message) | Not in prototype scope for V1; adds complexity | Post-pilot Phase 2 |
| Coach selection page (/parent/coach-selection) | Prototype has it; safety risk of implying real booking | Post-pilot Phase 2 |
| Competition screen (/director/competition) | Not built; not in pilot demo flow | Phase 3 |
| Intelligence screen (/director/intelligence) | Not built; not in pilot demo flow | Phase 3 |
| Reports screen (/director/reports) | Not built; Phase 5 | Phase 5 |
| Configuration screen (/director/configuration) | Not built; Phase 4+ | Phase 4 |
| Production TTS | Browser speechSynthesis works for demo | Post-pilot V2 |
| Production STT (Whisper) | Browser SpeechRecognition works for demo; text input fallback | Post-pilot V2 |
| session_actuals normalized table | Text-only session notes work for pilot | Sprint 403+ |
| AI intent parser (Claude API) | Keyword matching works for pilot scope | Post-pilot Phase 2 |
| Automated tests (Vitest + Playwright) | TypeScript is the only safety net | Post-pilot |
| Multi-academy support | Single academy for pilot | Phase 4+ |
| Billing / payment | Explicitly excluded | Never in pilot |

---

*Generated from prototype zips extracted to /tmp only. No code changes. No migrations. No schema changes. No package changes. No DB writes.*
