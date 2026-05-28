# SPRINT PLAN AND TEST CHECKLIST
**Package:** 10 — Implementation Roadmap and Testing
**Version:** 1.0 | **Status:** Draft

---

## Build Order Reference

Full phase order in `BUILD_ORDER.md`. This document adds sprint breakdowns and
test criteria for each phase.

---

## Phase 1 — Database and Supabase Setup
**Estimate:** 3–5 days | **Blocks:** Everything

### Sprint tasks

- [ ] Create Supabase project and save URL/keys to `.env.local`
- [ ] Run `0001_core_schema.sql` — verify tables created
- [ ] Run `0002_roles_permissions_rls.sql` — verify helper functions exist
- [ ] Run `0003_players_groups_profiles.sql`
- [ ] Run `0004_assessments_placement.sql`
- [ ] Run `0005_templates_sessions_exercises.sql`
- [ ] Run `0006_coach_notes_observations.sql`
- [ ] Run `0007_voice_commands_proposed_actions.sql`
- [ ] Run `0008_audit_logs_versioning.sql`
- [ ] Run `0009_seed_data.sql`
- [ ] Run `0010_functions_triggers.sql`
- [ ] Run `0011_views_reporting.sql`
- [ ] Generate TypeScript types: `supabase gen types typescript --local > src/types/database.ts`
- [ ] Initialize Next.js 14 project with Supabase client
- [ ] Test login with seeded director user

### Acceptance criteria

- All 11 migrations run without error
- `finalize_player_placement()` function exists and is callable
- `execute_approved_action()` function exists and is callable
- Director can sign in; coach cannot see another academy's data (RLS test)
- TypeScript types generated and committed

---

## Phase 2 — New Student Placement Engine
**Estimate:** 5–7 days | **Blocks:** Phase 3

### Sprint tasks

- [ ] New Player form (Screens 5)
- [ ] Placement Assessment runner — 5 dimension sliders (Screen 6)
- [ ] Save assessment to DB + call Claude for recommendation
- [ ] Placement Recommendation Review screen (Screen 7)
- [ ] Approve flow → `finalize_player_placement()` called
- [ ] Override flow — fields editable, reason required
- [ ] Reject flow — with reason
- [ ] Audit log verified after activation
- [ ] Player status = 'active' after activation
- [ ] Baseline set in `player_progression`

### Acceptance criteria

- [ ] Can create a new player (pending_placement status)
- [ ] Can complete 5-dimension assessment with all subcategory sliders
- [ ] Claude returns valid JSON recommendation with all required fields
- [ ] Director can approve recommendation → player activated
- [ ] Director can override track/level/group with reason → player activated with override values
- [ ] Director can reject → status = 'rejected', player stays pending
- [ ] `audit_logs` has entry with `action = 'player.placement.finalized'`
- [ ] `player_progression` baseline_* fields are set
- [ ] Group membership history has new entry with `is_current = true`
- [ ] Seeded player "pending_placement" completes full flow

---

## Phase 3 — Player Profile and Development Paths
**Estimate:** 4–6 days

### Sprint tasks

- [ ] Player list with filters (Screen 3)
- [ ] Player profile header (Screen 4)
- [ ] Score overview — radar chart
- [ ] Score overview — bar chart with deltas
- [ ] Development priorities section
- [ ] Assessment history (timeline, expand to detail)
- [ ] Group history table
- [ ] Session attendance feed
- [ ] Coach notes feed on profile
- [ ] Reassessment status indicator (overdue / due-soon / upcoming)

### Acceptance criteria

- [ ] Player list loads and filters by group, level, track, status
- [ ] Clicking player opens profile
- [ ] Radar chart renders with correct scores and baseline overlay
- [ ] Bar chart shows delta (green / red) from baseline
- [ ] Assessment history sorted newest first, expandable
- [ ] Reassessment overdue shows red badge
- [ ] Director and coach can view same profile; player and parent cannot (RLS)

---

## Phase 4 — Session / Template / Exercise System
**Estimate:** 6–8 days

### Sprint tasks

- [ ] Exercise library list + filter (Screen 14)
- [ ] Create exercise form
- [ ] Template list (Screen 12)
- [ ] Template builder (Screen 13): blocks, block exercises, drag sort
- [ ] Session list (Screen 9)
- [ ] Create session from template
- [ ] Session detail (Screen 10): blocks, attendance
- [ ] Session editor (Screen 11): block reorder (session only), intensity override
- [ ] Load management view: intensity bars + overload flag

### Acceptance criteria

- [ ] Can create an exercise and find it in the library
- [ ] Can create a template with 3+ blocks and exercises
- [ ] Create session from template → session_blocks are independent copies of template_blocks
- [ ] Editing session block order does NOT change template_blocks.order_index
- [ ] `session_blocks.is_override = true` when intensity changed in session
- [ ] Load summary shows correct values per block type
- [ ] Overload flag appears when all three dimensions ≥ 4
- [ ] Attendance toggles save correctly

---

## Phase 5 — Coach Notes and Assessments
**Estimate:** 4–5 days

### Sprint tasks

- [ ] Coach observation form (slide-in panel, Screen 15)
- [ ] Visibility toggle (internal / parent-visible)
- [ ] Tags: strengths, weaknesses, priority
- [ ] Structured reassessment form (5 dimensions)
- [ ] `update_player_progression_from_assessment()` called on save
- [ ] Parent update generator (Claude API)
- [ ] Parent update approval flow
- [ ] Parent update send log

### Acceptance criteria

- [ ] Coach can add internal observation to player profile
- [ ] Parent-visible observations are marked correctly
- [ ] Structured assessment saves all sub-scores
- [ ] `player_progression` scores update after assessment save
- [ ] Parent update draft is generated from only `parent_visible` observations
- [ ] Draft requires coach edit before director approval
- [ ] `parent_updates.status` flows: draft → pending_approval → approved → sent
- [ ] Sent update is immutable (no edit after sent)

---

## Phase 6 — Voice Command Shell (V1)
**Estimate:** 5–7 days

### Sprint tasks

- [ ] "Tell the OS" button in top nav, accessible to staff
- [ ] Text input form (Screen 16)
- [ ] Intent normalization via Claude API
- [ ] Entity resolution (group names → UUIDs, dates → ISO)
- [ ] Payload validation
- [ ] `proposed_actions` row creation
- [ ] Proposed action review panel (Screen 17)
- [ ] Approve → `execute_approved_action()` called
- [ ] Edit flow → modified_payload saved
- [ ] Reject flow → reason required
- [ ] Expiry handling (24 hours)
- [ ] Pending actions badge on director dashboard

### Acceptance criteria

- [ ] Coach types command → proposed action created with correct intent
- [ ] Ambiguous command → clarification request shown
- [ ] Director sees proposed action in dashboard and panel
- [ ] Approve → action executed → object created/modified → audit log written
- [ ] Edit → modified_payload used in execution (not original)
- [ ] Reject → no objects changed
- [ ] Expired action cannot be executed
- [ ] `voice_commands.input_method = 'typed'` for all V1 commands
- [ ] `action_execution_logs` entry created after execution

---

## Phase 7 — UI Polish
**Estimate:** 3–4 days

### Checklist

- [ ] All screens match Manus reference: dark, premium, minimal
- [ ] Color variables from DESIGN_SYSTEM.md applied consistently
- [ ] Loading states (skeletons) on all list views
- [ ] Empty states with CTA on all lists
- [ ] Error states on all forms
- [ ] Toast notifications for save / error / success
- [ ] Mobile layouts: player profile, placement flow, voice input, attendance
- [ ] Accessible: keyboard navigation, ARIA labels on interactive elements
- [ ] Reassessment overdue badge visible in list and profile

---

## Phase 8 — Testing, QA, Deployment
**Estimate:** 3–5 days

### RLS Audit

For each role, verify:

| Test | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| Can see another academy's players | NO | NO | NO | NO | NO |
| Can see all players in own academy | YES | YES | YES | NO | NO |
| Can approve proposed action | YES | YES | NO | NO | NO |
| Can call finalize_player_placement | YES | YES | NO | NO | NO |
| Can see internal coach notes | YES | YES | YES | NO | NO |
| Can see parent-visible notes | YES | YES | YES | NO | NO |

### Playwright E2E Test Scenarios

- [ ] Full placement flow: new player → assessment → recommendation → approve → profile shows active
- [ ] Voice command flow: type command → proposed action → approve → session created
- [ ] Session creation from template → edit block → verify template unchanged
- [ ] Assessment save → player_progression updated → delta shown in profile
- [ ] Parent update: generate → edit → approve → mark sent

### Performance Tests

- [ ] Player list with 200+ players loads in < 2 seconds
- [ ] Placement recommendation generates in < 5 seconds (Claude API)
- [ ] Voice command intent normalization completes in < 3 seconds

### Deployment

- [ ] Vercel project created
- [ ] Env vars set in Vercel (not hardcoded)
- [ ] Custom domain configured (optional V1)
- [ ] Supabase project on paid plan if going to production
- [ ] Final QA pass: all Phase 2–7 acceptance criteria re-verified

---

## DATABASE_CHANGELOG.md Maintenance

After every schema change, add a row to `packages/02_DATABASE_AND_SUPABASE_SCHEMA/DATABASE_CHANGELOG.md`:

```markdown
| Date | Migration | Description | Author |
| 2026-05-01 | 0012_... | Added X column to Y table | dev |
```

Never modify a migration that has already been run on any environment.
Write a new migration instead.
