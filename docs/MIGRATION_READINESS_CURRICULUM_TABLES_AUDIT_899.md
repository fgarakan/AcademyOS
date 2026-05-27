# AcademyOS Migration Readiness + Curriculum Tables Audit

**Sprint:** 899 — Migration Readiness + Curriculum Tables Audit V1
**Date:** 2026-05-27
**Scope:** Audit-only. No schema changes. No code changes. No migrations applied.
**Purpose:** Determine whether the database foundation is ready for curriculum draft server
            actions (Sprint 831 V2 wiring plan). Identify blockers, gaps, and the correct
            implementation path before any code is written.
**Related:** `CURRICULUM_INTELLIGENCE_LOOP.md`, `CURRICULUM_BUILDER_V2_WIRING_PLAN_831.md`,
             `PRE_MIGRATION_DIRTY_TREE_AUDIT_895.md`

---

## Audit Summary

| Area | Status | Notes |
|---|---|---|
| Migration count | ✅ Confirmed | 68 total (001–068), not 38 as Sprint 895 documented |
| Curriculum spine tables | ✅ Exist | Migrations 036, 037, 038 |
| Academy clone architecture | ✅ Exists | Migration 048 — correct curriculum change path |
| Curriculum content tables | ✅ Exist | Migrations 045, 046, 052, 053, 061 |
| Player gate/progress tables | ✅ Exist | Migrations 036, 059 |
| Template-curriculum bridge | ✅ Exists | Migrations 045 (FK), 062 (junction), 067 (extension) |
| Platform roles (PO access) | ✅ Exists | Migration 040 |
| **proposed_actions compatibility** | ❌ BLOCKED | 3 critical schema gaps — see Section 4 |
| **action_type enum** | ❌ BLOCKED | No curriculum action types in enum |
| **execute_approved_action()** | ❌ BLOCKED | No curriculum WHEN branches |
| **academy_curriculum_overrides** | ✅ Correct path | Has native draft/review/apply lifecycle |

**Verdict:** The curriculum table foundation is complete. The Sprint 831 V2 server action plan
cannot be implemented as written — it is incompatible with the `proposed_actions` schema.
The correct execution path is `academy_curriculum_overrides`, which already has the required
draft → pending_review → approved → applied → rolled_back lifecycle and does not depend on the
voice pipeline.

---

## Section 1 — Migration Inventory Correction

Sprint 895's `PRE_MIGRATION_DIRTY_TREE_AUDIT_895.md` documented 38 untracked migrations.
This was correct at the time — those were files in `supabase/migrations/` that appeared as
`??` in `git status` (untracked). Migrations 039–068 were already tracked in git.

**Full confirmed inventory (68 total):**

| Range | Files | Content area |
|---|---|---|
| 001–007 | 7 | Core identity, RLS helpers, players, assessments, exercises/templates, sessions |
| 008–009 | 2 | Voice pipeline (enum, voice_commands, clarification_requests, proposed_actions) |
| 010–013 | 4 | Coach notes, audit versioning, functions/triggers, reporting views |
| 014–023 | 10 | Signal layer, UTR, player outcomes, time intelligence, load aggregation, decision scoring, priorities, recommendations, learning system, moat views |
| 024–035 | 12 | Seed data, exercise intelligence, recommendation reasoning, behavioral model, predictions, coaching output, model optimization, cohort intelligence, benchmarks, director control, data flywheel, security fixes |
| 036–038 | 3 | **Curriculum spine** (stages, levels, skill domains, progressions, rules, player curriculum states; seed; mappings) |
| 039–040 | 2 | Player development summary, platform roles |
| 041–044 | 4 | Requirement domains, seed, Orange Ball starter requirements, player requirement progress bootstrap |
| 045–047 | 3 | Curriculum content library, Orange Ball content pack, content-requirement mappings seed |
| 048 | 1 | **Academy curriculum clone** (versions, overrides — the correct curriculum change pipeline) |
| 049–051 | 3 | Session adjustment suggestions, private lesson requests, academy suggestions |
| 052–053 | 2 | **Curriculum foundation tables** (gates, drills, coach language, archetypes, fitness/volume guidance, failure modes, drill_gate_mappings; seed) |
| 054 | 1 | execute_approved_action() expansion (no curriculum types added) |
| 055–058 | 4 | RLS patches (template_block_exercises ×2, session_block_exercises, session_block_status) |
| 059–060 | 2 | Player gate status foundation, gate status repair |
| 061–065 | 5 | Curriculum content taxonomy, class template content junction, Orange 1 content seed, first-run deck, mental/competitive content seed |
| 066–068 | 3 | Sessions RLS recursion fix, template schema extension, template RLS policies |

**Migration 039–068 are tracked in git.** Whether they are applied to the live Supabase
database is a separate question — this audit cannot confirm live DB state without a
`/supabase-sprint` session with migration status checks.

---

## Section 2 — Curriculum Table Foundation Assessment

### 2.1 — Curriculum Spine (Migration 036)

All curriculum spine tables exist:

| Table | Purpose | Seeded |
|---|---|---|
| `curriculum_stages` | 5 stages (Pre-Starter → Advanced) | ✅ 5 rows |
| `curriculum_levels` | 15 levels (3 per stage) | ✅ 15 rows |
| `skill_domains` | 8 skill domains | ✅ 8 rows |
| `skill_progressions` | Per-domain progress per level | — |
| `parent_level_descriptions` | Parent-safe level summaries | — |
| `progression_rules` | Gates per level progression | ✅ DO loop |
| `player_curriculum_states` | Per-player level assignment | — |
| `player_domain_progress` | Per-player per-domain tracking | — |
| `player_curriculum_history` | Advancement event log | — |

**RLS:** All have RLS. `academy_id IS NULL` = global master (director read-only).
Directors can manage academy-scoped overrides only via `academy_curriculum_overrides`.

### 2.2 — Academy Curriculum Clone Architecture (Migration 048)

Both tables exist and are correctly scoped:

**`academy_curriculum_versions`**
- One active version per academy at a time
- `status`: draft / active / archived
- `version_number` for auditability

**`academy_curriculum_overrides`**
- The correct table for all academy curriculum changes
- `target_type`: level / requirement / content_item / mapping / template_rule
- `override_type`: add / update / remove / replace / emphasis_shift
- `source`: voice / typed / ui
- `status`: draft / pending_review / approved / applied / rejected / rolled_back
- `rollback_of_override_id` FK — supports full rollback
- RLS: staff read, director manage (both scoped to `auth_academy_id()`)

This table is the architecturally correct home for curriculum draft → review → apply lifecycle.
It was purpose-built for this. See Section 5 (architectural recommendation).

### 2.3 — Curriculum Content Tables

| Table | Migration | Purpose |
|---|---|---|
| `curriculum_gates` | 052 | 57 gate definitions (global) |
| `curriculum_drills` | 052 | 152 drills; `academy_id IS NULL` = global |
| `curriculum_drill_tags` | 052 | Tag associations |
| `curriculum_coach_language` | 052 | 120 coaching language entries |
| `curriculum_competition_track` | 052 | Competition progression data |
| `curriculum_fitness_guidance` | 052 | Fitness guidance per level |
| `curriculum_volume_guidance` | 052 | Volume guidelines per level |
| `curriculum_archetypes` | 052 | A1–A8 player archetypes |
| `curriculum_failure_modes` | 052 | 14 failure modes |
| `drill_gate_mappings` | 052 | Which drills evidence which gates |
| `curriculum_content_items` | 045 | Content library; `source_type` column |
| `curriculum_content_requirement_mappings` | 045 | Content-to-requirement links |

`curriculum_content_items.source_type` values: `global_default` / `academy_custom` /
`imported` / `copied` — supports Knowledge Builder promotion loop (Loop 5).

### 2.4 — Player Progress Tables

| Table | Migration | Purpose |
|---|---|---|
| `player_gate_status` | 059 | Per-player per-gate evidence tracking |
| `player_curriculum_states` | 036 | Player level assignment |
| `player_domain_progress` | 036 | Per-domain progress |
| `player_curriculum_history` | 036 | Advancement event log |

### 2.5 — Template-Curriculum Bridge

Three layers of template-curriculum connection exist:

| Layer | Migration | What it does |
|---|---|---|
| `templates.curriculum_level_id` FK | 045 | Assigns a template to a curriculum level (Loop 6 connection) |
| `curriculum_class_template_blocks` | 062 | Junction: template blocks ↔ curriculum content items / drills |
| `template_schema_extension` | 067 | Adds `template_type`, `status`, curriculum snapshot fields; creates `template_review_requests` and `template_version_history` |

**Migration 067 note:** `template_review_requests` handles UI-originated template lifecycle
(director saves draft, submits for review, approves). This is distinct from `proposed_actions`
which handles voice-command-originated `create_template` / `modify_template` actions. This
is the correct separation.

### 2.6 — Platform Roles (Migration 040)

`platform_roles` table exists with `role IN ('platform_owner', 'platform_admin')`. Users at
this level operate above the academy and can view all tenants. This supports the knowledge
builder and promotion flow (Loops 4–5) where a platform owner reviews ingested knowledge.

---

## Section 3 — action_type Enum Gap

The `action_type` enum is defined in migration 008. Its current values:

```sql
CREATE TYPE action_type AS ENUM (
  'create_session',
  'modify_session',
  'cancel_session',
  'create_template',
  'modify_template',
  'assign_group',
  'create_placement_assessment',
  'move_player_group',
  'schedule_reassessment',
  'adjust_session_intensity',
  'generate_parent_update',
  'flag_player',
  'create_player',
  'create_exercise',
  'other'
);
```

**Gap:** No curriculum action types are in this enum. Values needed for V2 wiring:
- `curriculum_add_drill`
- `curriculum_add_gate`
- `curriculum_add_fitness`
- `curriculum_update_drill`
- `curriculum_remove_drill`

Adding values to a PostgreSQL enum requires `ALTER TYPE ... ADD VALUE` — this is a DDL
migration. It cannot be done in application code. This is a **migration blocker**.

However — if the curriculum change pipeline uses `academy_curriculum_overrides` directly
(the recommended path — see Section 5), none of these enum values are needed. The
`academy_curriculum_overrides.source` field handles origin (voice / typed / ui) without
requiring an `action_type` enum value.

---

## Section 4 — proposed_actions Schema Incompatibility

The Sprint 831 V2 wiring plan defines `createCurriculumDrillDraft()` to INSERT into
`proposed_actions`. Three incompatibilities were found by reading migration 009:

### Gap 1 — voice_command_id NOT NULL (CRITICAL)

```sql
-- Migration 009 schema:
voice_command_id UUID NOT NULL REFERENCES voice_commands(id)
```

The Sprint 831 plan does not pass `voice_command_id` to the server action. A direct
INSERT into `proposed_actions` without a valid `voice_command_id` will fail with a
`NOT NULL constraint violation` at runtime. No workaround is possible without either:
- Making `voice_command_id` nullable (migration required), OR
- Creating a placeholder `voice_commands` row first (architecturally wrong — these are
  not voice commands)

**This is a hard blocker for using `proposed_actions` as the curriculum draft path.**

### Gap 2 — Field Name Mismatch

| Location | Field name |
|---|---|
| Migration 009 schema | `proposed_by_id` |
| Sprint 831 plan code | `proposed_by` |

The server action as written references a column that does not exist. This will produce
a Supabase error (`column "proposed_by" does not exist`).

### Gap 3 — execute_approved_action() Missing Curriculum Handlers

Migration 054 expanded `execute_approved_action()` with additional action types:
modify_session, create_template, modify_template, create_placement_assessment,
adjust_session_intensity, flag_player.

Neither migration 054 nor any other migration adds curriculum action handlers.
The ELSE branch of `execute_approved_action()`:

```sql
ELSE
  RAISE EXCEPTION 'Unsupported action type: %', p_action_type;
```

Any `curriculum_add_drill` action_type (if it existed in the enum) would immediately
raise this exception. **Approving a curriculum draft via proposed_actions would crash
the execution function.**

### Summary: proposed_actions Is Not the Correct Path

`proposed_actions` was designed for voice commands. Its `voice_command_id NOT NULL`
constraint is an architectural invariant, not an oversight. Curriculum changes should
not be retrofitted into this pipeline.

---

## Section 5 — Architectural Recommendation: Use academy_curriculum_overrides

`academy_curriculum_overrides` (migration 048) was purpose-built for exactly this use case.

**Why it is the correct path:**

| Criterion | academy_curriculum_overrides | proposed_actions |
|---|---|---|
| Requires voice_command_id | ❌ No | ✅ NOT NULL — hard blocker |
| Native draft lifecycle | ✅ draft → pending_review → approved → applied | ✅ pending_review → approved → executed |
| Rollback support | ✅ rollback_of_override_id FK | ❌ No rollback |
| Source tracking | ✅ source: voice / typed / ui | ✅ via voice_command_id |
| Academy-scoped RLS | ✅ auth_academy_id() | ✅ auth_academy_id() |
| Designed for curriculum | ✅ Yes — curriculum only | ❌ Voice commands (all types) |
| Audit trail | Requires adding audit_log entry on apply | ✅ Built into execute_approved_action() |

**Missing piece:** `academy_curriculum_overrides` has no execution function equivalent
to `execute_approved_action()`. A migration adding `execute_curriculum_override()`
is needed before the apply step can work. This function would:
1. Read the override row (source_type: add/update/remove/replace/emphasis_shift)
2. Apply to the appropriate curriculum table (level / drill / gate / content_item)
3. Write an `audit_logs` entry
4. Set override status to `applied`

This is a sprint milestone, not a blocker for drafting and review functionality.

---

## Section 6 — Loop-by-Loop Readiness Assessment

### Loop 1 — Curriculum Spine Creation/Edit

| Requirement | Status |
|---|---|
| Curriculum level navigation (≤ 2 taps) | 🟡 UI shells exist; no live DB wiring |
| Level detail shows drills, gates, cues in one view | 🟡 Component shells exist |
| Edit produces draft, not silent save | 🟡 Draft path exists (`academy_curriculum_overrides`) but not wired |
| Academy override vs. global distinguishable | ✅ Schema supports it (`academy_id IS NULL` = global) |
| Audit trail on apply | 🟡 Needs `execute_curriculum_override()` function |

**Blocker:** Write wiring to `academy_curriculum_overrides` not yet implemented.

### Loop 2 — DONNA Natural-Language Curriculum Edit

| Requirement | Status |
|---|---|
| DONNA recognizes curriculum edit intent | ✅ `voiceCurriculumClassifier.ts` exists |
| DONNA constructs structured draft | 🟡 `DonnaAddDrillDraft.tsx` exists; local state only |
| Draft goes to review before write | 🟡 Path exists; not wired |
| Server action for drill draft | ❌ Not implemented; Sprint 831 plan is schema-incompatible |

**Blocker:** Server action must target `academy_curriculum_overrides`, not `proposed_actions`.

### Loop 3 — Interface Curriculum Edit

| Requirement | Status |
|---|---|
| Editable field affordances | 🟡 Component shells exist |
| Saving creates draft (not direct mutation) | 🟡 Correct table exists; not wired |
| `CurriculumChangeQueue.tsx` shows pending changes | 🟡 Component exists; query not wired |
| Pending changes queryable | ✅ `academy_curriculum_overrides WHERE status = 'pending_review'` |

**Blocker:** Write and query wiring not implemented.

### Loop 4 — Knowledge Builder Ingestion

| Requirement | Status |
|---|---|
| Knowledge inbox module | ✅ `src/lib/curriculum/inbox/` exists (Sprint 503) |
| Voice classification | ✅ `voiceCurriculumClassifier.ts` |
| Knowledge Builder UI route | ❓ Architecture question — route not confirmed |
| Platform owner access model | ✅ Migration 040 `platform_roles` table |

**Blocker:** UI route for knowledge inbox not confirmed (open architecture question).

### Loop 5 — Knowledge-to-Curriculum Promotion

| Requirement | Status |
|---|---|
| Promotion generates curriculum draft | 🟡 Path exists via `academy_curriculum_overrides` |
| Source type tracking | ✅ `curriculum_content_items.source_type = 'imported'` |
| Audit chain: ingestion → promotion → approval → application | 🟡 Schema supports; not wired |
| Promotion UI | ❓ Architecture question — director portal vs. platform-owner console |

**Blocker:** Architecture question on console location unresolved.

### Loop 6 — Curriculum-to-Session/Template

| Requirement | Status |
|---|---|
| `curriculum_level_id` FK on templates | ✅ Migration 045 |
| `curriculum_class_template_blocks` junction | ✅ Migration 062 |
| Template status lifecycle | ✅ Migration 067 (`template_review_requests`) |
| Template re-queries curriculum on load | ❓ Open architecture question — cached vs. live |
| Coach brief updated via DONNA on session load | 🟡 Depends on query wiring |

**Architecture question:** Does the template builder re-query curriculum on load, or is the
drill list cached at creation time? If cached, a `curriculum_class_template_blocks` row
written at template creation is stale after a curriculum change. The schema supports live
re-query (the FK is to the level, not a snapshot), but the application query must do the join.

### Loop 7 — Coach Feedback-to-Curriculum Improvement

| Requirement | Status |
|---|---|
| Coach can flag a curriculum concern | 🟡 Feedback boundary defined; flag UI not built |
| DONNA captures structured flag | ✅ `voiceCurriculumClassifier.ts` classifies intent |
| Multi-coach signal aggregation | ❓ Architecture question — surface not defined |
| Director sees aggregated signals | ❓ Architecture question — where? |

**Blocker:** Signal aggregation surface is an open architecture question.

---

## Section 7 — Permission Model Readiness

### Global vs. Academy Curriculum Boundary

| Rule | Schema enforcement |
|---|---|
| Global spine (`academy_id IS NULL`) is read-only for directors | ✅ RLS: directors manage only academy-scoped rows |
| Academy deltas live in `academy_curriculum_overrides` | ✅ Table scoped to `auth_academy_id()` |
| Global master written only by platform/migration | ✅ RLS excludes director role for global inserts |
| Resolution engine reads global + academy delta at query time | ✅ `academyCurriculumResolution.ts` |

### Platform Owner Boundary

| Rule | Schema enforcement |
|---|---|
| Platform owner sees all academies | ✅ Migration 040 + additive SELECT policy on academies |
| Platform owner can promote knowledge | ✅ `platform_roles` grants above-academy access |
| Platform owner cannot silently mutate academy curriculum | ✅ `proposed_actions` / override pipeline enforces review step |

### Coach/Parent Safety

| Rule | Schema enforcement |
|---|---|
| `coach_only` content not exposed to parents | ✅ `curriculum_content_items` has role visibility flags (migration 061) |
| Parent/player routes are separate portals | ✅ Role hierarchy enforced in middleware |
| `player_gate_status` scoped to staff | ✅ RLS in migration 059 |

---

## Section 8 — Critical Path to V2 Implementation

**Correct implementation path (replacing Sprint 831 plan):**

### Step A — Migration (Sprint 900)

One migration needed before any server action can be written:

```sql
-- execute_curriculum_override()
-- Applies an approved academy_curriculum_overrides row to the curriculum.
-- Must handle: add / update / remove / replace / emphasis_shift
-- Must write to audit_logs on apply.
-- Must NOT mutate global spine (academy_id IS NULL rows).
```

No enum changes needed if using `academy_curriculum_overrides` (avoids `action_type` enum gap).
No changes to `proposed_actions` schema needed.

### Step B — Server Actions (Sprint 901)

Implement server actions targeting `academy_curriculum_overrides`:

```typescript
// src/lib/actions/curriculumDraftActions.ts
export async function createCurriculumDrillDraft(input: {
  levelId: string
  description: string
  academyId: string
  source: 'voice' | 'typed' | 'ui'
}) {
  // INSERT into academy_curriculum_overrides
  // target_type: 'content_item'
  // override_type: 'add'
  // status: 'pending_review'
  // source: input.source
  // No voice_command_id dependency
}
```

### Step C — UI Wiring (Sprint 902)

Wire existing component shells to server actions:
- `DonnaAddDrillDraft.tsx` → `createCurriculumDrillDraft()`
- `DonnaAddFitnessExerciseDraft.tsx` → `createCurriculumFitnessExerciseDraft()`
- `DonnaAddAssessmentGateDraft.tsx` → `createCurriculumGateDraft()`

### Step D — Review Queue (Sprint 903)

Wire `CurriculumChangeQueue.tsx` to live query:

```sql
SELECT * FROM academy_curriculum_overrides
WHERE academy_id = auth_academy_id()
  AND status = 'pending_review'
ORDER BY created_at DESC;
```

### Step E — Approve/Execute (Sprint 904)

Wire approval action → `execute_curriculum_override()`.
Confirm loop: approve → execute → status = 'applied' → audit_log entry.

---

## Section 9 — Recommended Next 5 Sprints

| Sprint | Name | Type | Blocker it resolves |
|---|---|---|---|
| **900** | Curriculum Override Execution Migration V1 | Migration | `execute_curriculum_override()` function; required before any apply action |
| **901** | Curriculum Draft Server Actions V1 | Implementation | `createCurriculumDrillDraft()`, `createCurriculumFitnessExerciseDraft()`, `createCurriculumGateDraft()` targeting `academy_curriculum_overrides` |
| **902** | DONNA Curriculum Draft UI Wire V1 | Implementation | Wire `DonnaAddDrillDraft.tsx` + siblings to server actions |
| **903** | Curriculum Change Queue Live Query V1 | Implementation | Wire `CurriculumChangeQueue.tsx` to live `pending_review` query |
| **904** | Curriculum Override Approve-Execute Loop V1 | Implementation | Director approve → execute → audit trail; closes Loop 1 + Loop 2 |

**Note:** Sprint 900 requires `/supabase-sprint` — it is a schema-mutating migration.
Sprints 901–904 are standard `/academy-sprint` implementation sprints.

---

## Section 10 — Open Architecture Questions (Blocking Loops 4, 5, 6, 7)

These questions must be answered before the corresponding loops can be implemented.
Do not implement until each is resolved in an explicit sprint plan.

| Loop | Question | Decision needed |
|---|---|---|
| Loop 4 | Knowledge Builder UI route? (`/director/curriculum/knowledge`?) | Product decision — confirm route before building |
| Loop 5 | Promotion flow: director portal or separate platform-owner console? | Determines RLS scope and who sees what |
| Loop 6 | Template block list: re-query curriculum on load, or cached at creation? | If cached, ripple is not automatic — needs a "refresh from curriculum" action |
| Loop 7 | Director signal surface: section in review queue, curriculum builder overlay, or new surface? | Determines component location and routing |

---

## Appendix — Migration Files Read in This Audit

| Migration | Content |
|---|---|
| `008_voice_pipeline.sql` | action_type enum definition (no curriculum types) |
| `009_proposed_actions.sql` | proposed_actions schema; execute_approved_action() V1 |
| `036_curriculum_spine.sql` | curriculum stages, levels, skill domains, progression rules, player states |
| `040_platform_roles.sql` | platform_owner / platform_admin roles |
| `045_curriculum_content_library.sql` | curriculum_content_items, templates.curriculum_level_id FK |
| `048_academy_curriculum_clone.sql` | academy_curriculum_versions, academy_curriculum_overrides |
| `052_curriculum_foundation_tables.sql` | curriculum_gates, curriculum_drills, curriculum_coach_language, archetypes, failure_modes |
| `054_execute_approved_action_expansion.sql` | Expanded execute_approved_action() — no curriculum types |
| `059_player_gate_status.sql` | player_gate_status per-player per-gate tracking |
| `061_curriculum_content_taxonomy.sql` | curriculum_content_items domain + visibility flags |
| `062_class_template_content_junction.sql` | curriculum_class_template_blocks junction |
| `067_template_schema_extension.sql` | template_type, status, template_review_requests, template_version_history |
