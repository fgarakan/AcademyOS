# DAILY BUILD PROMPT
**Package:** 09 — AI Workflow and Claude Prompts
**Version:** 1.0 | **Status:** Active

Use this file as a copy-paste reference for starting each Claude Code session.

---

## Session Startup (every session, no exceptions)

```
Read the following files before we start:

1. Academy_OS_Master_Build/ACADEMY_OS_MASTER_ORG.md
2. Academy_OS_Master_Build/MISSING_ITEMS_AND_DECISIONS.md
3. Academy_OS_Master_Build/BUILD_ORDER.md

Then tell me:
- What phase we are in
- Top 3 open decisions blocking V1
- What you recommend working on today

Do not start building until I confirm.
```

---

## Phase 1 — Database Setup

```
Task: Run Phase 1 database setup for Academy OS.

Reference: packages/02_DATABASE_AND_SUPABASE_SCHEMA/SUPABASE_SETUP_GUIDE.md

Steps:
1. Create Supabase project (if not done)
2. Add env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
3. Run migrations in order: 0001 → 0002 → 0003 → 0004 → 0005 → 0006 → 0007 → 0008 → 0009 → 0010 → 0011
4. Run seed data: 0009_seed_data.sql
5. Generate TypeScript types: supabase gen types typescript --local > src/types/database.ts
6. Test RLS: confirm academy_director sees all, coach sees only their group

Do not skip migration order. Do not modify migrations once run — write new ones.
```

---

## Phase 2 — Placement Engine

```
Task: Build the new student placement engine.

Reference:
- packages/04_NEW_STUDENT_PLACEMENT_ENGINE/NEW_STUDENT_PLACEMENT_ENGINE_SPEC.md
- packages/04_NEW_STUDENT_PLACEMENT_ENGINE/PLACEMENT_ASSESSMENT_RUBRIC.md
- packages/04_NEW_STUDENT_PLACEMENT_ENGINE/RECOMMENDATION_LOGIC.md
- packages/08_UI_UX_WIREFRAMES_AND_SCREEN_SPECS/SCREEN_SPECS.md (Screens 5, 6, 7)

UI reference: https://angles-os-mbgpiq3v.manus.space/

Step I want to build today: [New Player Form / Assessment Runner / Recommendation Review]

Rules:
- Human approval required before finalize_player_placement() is called
- AI recommendation never auto-activates
- Override requires written reason
- Audit log must be written on activation
- Match Manus dark design

Show me your implementation plan before writing code.
```

---

## Phase 3 — Player Profile

```
Task: Build the player profile and player list screens.

Reference:
- packages/05_PLAYER_PROFILE_AND_DEVELOPMENT_PATHS/PLAYER_PROFILE_SPEC.md
- packages/08_UI_UX_WIREFRAMES_AND_SCREEN_SPECS/SCREEN_SPECS.md (Screens 3, 4)
- Database view: v_player_summary (defined in 0011_views_reporting.sql)

UI reference: https://angles-os-mbgpiq3v.manus.space/

Step I want to build today: [Player List / Profile Header / Score Charts / Assessment History]

Rules:
- Use v_player_summary view for list queries
- RLS must filter by academy_id via Supabase client
- Radar chart and bar chart toggle
- Reassessment overdue indicator
- Role-gated actions in profile header
```

---

## Phase 4 — Session / Template System

```
Task: Build the session and template system.

Reference:
- packages/06_SESSION_TEMPLATE_EXERCISE_SYSTEM/SESSION_TEMPLATE_EXERCISE_SPEC.md
- packages/08_UI_UX_WIREFRAMES_AND_SCREEN_SPECS/SCREEN_SPECS.md (Screens 9–14)

CRITICAL RULE:
Template default order ≠ session runtime order.
Editing a session block must NOT modify the source template.
session_blocks.is_override = true when changed from template.

Step I want to build today: [Exercise Library / Template Builder / Session Creation / Session Editor]

UI reference: https://angles-os-mbgpiq3v.manus.space/

Show implementation plan before writing code.
```

---

## Phase 5 — Coach Notes

```
Task: Build the coach notes and assessments system.

Reference:
- packages/07_COACH_NOTES_AND_ASSESSMENTS/COACH_NOTES_SPEC.md
- packages/08_UI_UX_WIREFRAMES_AND_SCREEN_SPECS/SCREEN_SPECS.md (Screen 15)

Rules:
- Internal notes and parent updates are separate objects
- Parent updates require: AI draft → coach review → director approval → send
- Never send AI draft directly to parents
- Parent update uses Claude API (see AI_PARENT_UPDATE_PROMPT.md)

Step I want to build today: [Observation Form / Assessment Form / Parent Update Generator]
```

---

## Phase 6 — Voice Command Shell

```
Task: Build the voice command shell (V1 — typed input only).

Reference:
- packages/03_VOICE_FIRST_ARCHITECTURE/VOICE_COMMAND_LIFECYCLE.md
- packages/03_VOICE_FIRST_ARCHITECTURE/VOICE_TO_STRUCTURED_ACTION_SPEC.md
- packages/03_VOICE_FIRST_ARCHITECTURE/PROPOSED_ACTIONS_SYSTEM.md
- packages/08_UI_UX_WIREFRAMES_AND_SCREEN_SPECS/SCREEN_SPECS.md (Screens 16, 17)

V1 rules:
- input_method = 'typed' (no audio in V1)
- All stages of pipeline still run: input → intent → payload → proposed action → approval → execution
- Never skip the proposed_actions table
- execute_approved_action() is the only execution path

Claude API integration:
- Use claude-sonnet-4-6 for intent normalization
- Pass academy context snapshot with every command
- See packages/09_AI_WORKFLOW_AND_CLAUDE_PROMPTS/ for prompts

Step I want to build today: [Voice input UI / Intent normalization / Proposed action creation / Approval panel]
```

---

## Schema Review

```
Review this SQL migration for Academy OS.

Check for:
1. Missing academy_id column (required on every table)
2. Missing RLS (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
3. Missing audit log on key mutations
4. Missing updated_at trigger
5. Direct mutation that should go through proposed_actions
6. Missing voice_command_id on tables that could be voice-triggered
7. Foreign key constraints correct
8. Indexes on academy_id, created_at DESC, frequently filtered columns

Reference: packages/02_DATABASE_AND_SUPABASE_SCHEMA/ for patterns.

Flag issues. Do not fix silently. Wait for approval before changing.
```

---

## UI Review

```
Review this screen/component against Academy OS design standards.

Check for:
1. Color palette matches DESIGN_SYSTEM.md (dark, --bg-surface, --accent-blue, etc.)
2. Status badges present where status is shown
3. Loading, empty, and error states defined
4. Reassessment overdue indicator visible where applicable
5. Risk level color coding on proposed actions
6. "Tell the OS" entry point accessible from nav
7. Mobile layout specified for this screen
8. Role-gated actions check (director vs. coach access)
9. CTA buttons are clear and consistently placed

Reference: packages/08_UI_UX_WIREFRAMES_AND_SCREEN_SPECS/

Flag deviations. Do not fix silently.
```

---

## End-of-Session Checklist

```
Before ending this session:

1. Did any schema change? → Update DATABASE_CHANGELOG.md
2. Did any package spec change? → Update that package README (status field)
3. Are there new open decisions? → Add to MISSING_ITEMS_AND_DECISIONS.md
4. Did any architecture rule almost get violated? → Note it in NO_DRIFT_RULES.md
5. What is the next task? → Note it so the next session can start there

Confirm all five before signing off.
```
