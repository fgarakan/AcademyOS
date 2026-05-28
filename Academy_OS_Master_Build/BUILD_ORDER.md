# BUILD ORDER
**Academy OS V1 — Definitive Build Sequence**

---

## Guiding rule

> Foundation first. Intelligence second. Voice third. Polish last.

You cannot build an intelligent voice-driven system on weak structure. Every phase below is ordered by dependency, not by excitement.

---

## Phase 0 — Audit and Organize ✅
**Status:** COMPLETE

- [x] Repo audited (single `index.html` pitch deck)
- [x] Master build structure created
- [x] All 11 packages scaffolded
- [x] `MISSING_ITEMS_AND_DECISIONS.md` created
- [x] `ACADEMY_OS_MASTER_ORG.md` created
- [x] Functional prototype (`app.html`) created

---

## Phase 1 — Database and Supabase Setup
**Owner:** Backend Lead | **Estimated time:** 3–5 days

### Step 1.1 — Supabase project setup
- [ ] Create Supabase project
- [ ] Add env vars to `.env.local`
- [ ] Enable Row Level Security globally
- [ ] Set up storage buckets (voice notes, attachments)

### Step 1.2 — Run migrations (in order)
- [ ] `0001_core_schema.sql` — academies, users, roles, memberships
- [ ] `0002_roles_permissions_rls.sql` — RLS policies
- [ ] `0003_players_groups_profiles.sql` — player system
- [ ] `0004_assessments_placement.sql` — placement engine tables
- [ ] `0005_templates_sessions_exercises.sql` — training system
- [ ] `0006_coach_notes_observations.sql` — notes system
- [ ] `0007_voice_commands_proposed_actions.sql` — voice pipeline tables
- [ ] `0008_audit_logs_versioning.sql` — audit system
- [ ] `0009_seed_data.sql` — demo data
- [ ] `0010_functions_triggers.sql` — `finalize_player_placement()`, `execute_approved_action()`
- [ ] `0011_views_reporting.sql` — reporting views

### Step 1.3 — Verify
- [ ] Generate TypeScript types: `supabase gen types typescript --local > src/types/database.ts`
- [ ] Test RLS policies (Package 02 guide)
- [ ] Verify seed data loaded correctly

---

## Phase 2 — New Student Placement Engine
**Owner:** Full-stack Lead | **Estimated time:** 5–7 days

The highest-value V1 feature. Forces the player/group schema to be solid.

### Step 2.1 — Backend
- [ ] `finalize_player_placement()` function tested
- [ ] Placement recommendation API working
- [ ] Player activation logic working

### Step 2.2 — Frontend screens
- [ ] New Student form (create player shell)
- [ ] Placement assessment runner (4 layers: skill, competition, movement, behavioral)
- [ ] Recommendation display (track, level, group, confidence)
- [ ] Director review and approval
- [ ] Placement activation + baseline creation
- [ ] Reassessment date set

### Step 2.3 — Test
- [ ] Full placement flow end-to-end
- [ ] Override flow works
- [ ] Audit log populated correctly

---

## Phase 3 — Player Profile and Development Paths
**Owner:** Frontend Lead | **Estimated time:** 4–6 days

### Step 3.1 — Player profile view
- [ ] Profile header (name, age, level, group, track, status)
- [ ] Baseline vs. current scores (radar chart + bars)
- [ ] Development priorities (current focus areas)
- [ ] Observation history feed
- [ ] Reassessment status indicator

### Step 3.2 — Player list and group view
- [ ] Players list with filters (group, level, track, status)
- [ ] Group overview (director view)
- [ ] Reassessment pipeline (who's due)

---

## Phase 4 — Session / Template / Exercise System
**Owner:** Full-stack Lead | **Estimated time:** 6–8 days

### Step 4.1 — Exercise library
- [ ] Exercise CRUD (create, edit, view, archive)
- [ ] Category/tag filtering
- [ ] Exercise detail view

### Step 4.2 — Template builder
- [ ] Create template (name, group, track, level)
- [ ] Add blocks (warm-up, technical, tactical, fitness, cool-down)
- [ ] Add exercises to blocks
- [ ] Set block intensity and duration
- [ ] Save template

### Step 4.3 — Session creation
- [ ] Create session from template
- [ ] Override template for specific session (without changing template)
- [ ] Attendance tracking
- [ ] Session notes

### Step 4.4 — Load management
- [ ] Skill + competition + fitness intensity display
- [ ] Overload flag when all three are high

---

## Phase 5 — Coach Notes and Assessments
**Owner:** Full-stack Lead | **Estimated time:** 4–5 days

### Step 5.1 — Coach observations
- [ ] Add written observation (typed note)
- [ ] Tag strengths, weaknesses, priorities
- [ ] Mark as parent-visible or internal
- [ ] Link to session or standalone

### Step 5.2 — Assessment tool
- [ ] Structured scoring form (technical, tactical, movement, competition, behavioral)
- [ ] Sub-scores per category
- [ ] Comparison to baseline
- [ ] Save → updates player current scores

### Step 5.3 — Parent update generator
- [ ] AI-draft from accumulated notes (Claude API call)
- [ ] Coach review + edit
- [ ] Approval before sending
- [ ] Send log

---

## Phase 6 — Voice Command Proposed-Action Layer (Shell)
**Owner:** Backend + AI Lead | **Estimated time:** 5–7 days

V1 goal: typed input through voice pipeline UI (not live audio). Architecture must be correct even if voice is simulated.

### Step 6.1 — Database schema
- [ ] `voice_commands` table
- [ ] `proposed_actions` table
- [ ] `action_approvals` table
- [ ] `action_execution_logs` table
- [ ] `clarification_requests` table

### Step 6.2 — Voice command UI shell
- [ ] "Tell the OS" entry point in top nav
- [ ] Input field (type or record)
- [ ] Transcript display
- [ ] Intent detection (Claude API)
- [ ] Proposed action preview panel
- [ ] Affected objects list
- [ ] Approve / Edit / Reject buttons

### Step 6.3 — Execution engine
- [ ] `execute_approved_action()` function
- [ ] Action type handlers (create session, assign group, etc.)
- [ ] Audit log writes
- [ ] Success/failure response

---

## Phase 7 — UI Polish
**Owner:** Frontend Lead | **Estimated time:** 3–4 days

- [ ] Align all screens to Manus UI reference
- [ ] Mobile-responsive layouts for key flows
- [ ] Loading states, empty states, error states
- [ ] Confirmation dialogs
- [ ] Toast notifications
- [ ] Accessible (keyboard nav, ARIA labels)

---

## Phase 8 — Testing, QA, Deployment
**Owner:** QA + DevOps | **Estimated time:** 3–5 days

- [ ] RLS policy audit (all roles)
- [ ] Playwright E2E: placement flow, session creation, voice pipeline
- [ ] Vitest unit tests: `finalize_player_placement()`, `execute_approved_action()`
- [ ] Performance: player list with 200+ players
- [ ] Deployment to Vercel
- [ ] Custom domain
- [ ] Final QA checklist (Package 10)

---

## Dependencies Map

```
Phase 1 (Database) → Everything
Phase 2 (Placement) → Phase 3 (Profiles)
Phase 4 (Sessions) can run in parallel with Phase 3
Phase 5 (Notes) depends on Phase 3
Phase 6 (Voice) depends on Phase 2, 4, 5
Phase 7 (Polish) runs over all phases
Phase 8 (QA) is last
```
