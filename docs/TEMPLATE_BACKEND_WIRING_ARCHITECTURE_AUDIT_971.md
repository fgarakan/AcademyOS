# Template Backend Wiring Architecture Audit
Sprint 971 — 2026-05-18

## Purpose

Design the complete backend wiring architecture for the Curriculum-Aware Template System before any migration is written. This document is the source of truth for Sprints 972–985.

No migrations are created in this sprint. This is design-and-decision only.

---

## 1. Existing UI Routes (demo-mode today)

| Route | Current State | Backend Need |
|-------|--------------|-------------|
| `/director/templates` | Static home — DONNA panel, template type cards | Read: count of class/fitness templates by status |
| `/director/templates/class` | Mock list from `DEMO_CLASS_TEMPLATES` | Read: `templates WHERE template_type = 'class'` |
| `/director/templates/class/create` | 5-step wizard — saves to `useState` only | Write: save draft → `proposed_actions` → director approval → `templates` INSERT |
| `/director/templates/class/[templateId]` | Mock data from `DEMO_CLASS_TEMPLATES` | Read: single template + blocks + curriculum connections |
| `/director/templates/fitness` | Mock list from `DEMO_FITNESS_TEMPLATES` | Read: `templates WHERE template_type = 'fitness'` |
| `/director/templates/fitness/create` | 5-step wizard — saves to `useState` only | Write: same pattern as class |
| `/director/templates/fitness/[templateId]` | Mock data from `DEMO_FITNESS_TEMPLATES` | Read: single template + blocks + exercises |
| `/director/templates/coach-preview` | Demo blocks + curriculum constants | Read: real template blocks + curriculum junction data |
| `/director/templates/impact-preview` | Static demo projections | Read: session counts, player exposure, group usage |
| `/director/templates/donna-suggestions` | Rule-based from mock data | Read: gap query over real templates vs. curriculum levels |

---

## 2. Existing Data Sources

### 2a. Existing DB Tables (relevant to templates)

**`templates`** (migration 006)
- `id`, `academy_id`, `name`, `description`, `group_id`, `track`, `level_id`, `total_duration_min`, `tags`, `is_active`, `is_default`, `created_by`, `voice_command_id`, `created_at`, `updated_at`
- **Missing:** `template_type` ('class'/'fitness'), `status` (draft/needs_review/ready), `curriculum_level_key`, `template_goal`, `pathway_focus`, `approved_by`, `archived_at`
- RLS: staff see, staff manage (too broad — directors only should approve)

**`template_blocks`** (migration 006)
- `id`, `template_id`, `type` (block_type enum), `name`, `duration_min`, `intensity`, `order_index`, `notes`
- **Missing:** `curriculum_connection` (label), `coach_watch_for` (text), `fitness_load` (for fitness blocks)
- Invariant (hardcoded in comments): order_index is default order — sessions copy and may reorder independently

**`template_block_exercises`** (migrations 006, 055, 058)
- `id`, `block_id`, `exercise_id`, `order_index`, `duration_min`, `notes`
- RLS: fully patched in migration 058 (SELECT, INSERT, UPDATE, DELETE)
- This is the **fitness pipeline**: `template_blocks` → `template_block_exercises` → `exercises`

**`curriculum_class_template_blocks`** (migration 062)
- `id`, `template_id`, `block_id`, `content_item_id`, `drill_id`, `order_index`, `notes`, `duration_min`
- CHECK constraint: exactly one of `content_item_id` or `drill_id` must be non-null
- This is the **class pipeline**: `template_blocks` → `curriculum_class_template_blocks` → `curriculum_content_items | curriculum_drills`
- RLS: staff see, directors manage
- **Key insight:** this table already exists and is the correct architecture for class template block content

**`exercises`** (migration 006)
- `id`, `academy_id`, `name`, `category`, `description`, `equipment`, `tags`, `level_range`, `track`
- Used by fitness templates via `template_block_exercises`

**`curriculum_levels`** (migration 036)
- `id`, `stage` (curriculum_stage enum), `level_number`, `display_name`
- This is the FK target for `templates.level_id` — but `level_id` is currently just `UUID REFERENCES academy_levels(id)`, NOT `curriculum_levels`. Needs clarification.

**`sessions`** (migration 007)
- `id`, `academy_id`, `template_id` (FK → templates), `group_id`, `coach_id`, `scheduled_date`, `duration_min`, `status`
- Sessions already reference templates by FK — this is the integration point for template usage tracking

**`proposed_actions`** (migration 009)
- `id`, `academy_id`, `voice_command_id` (NOT NULL), `proposed_by_id`, `action_type`, `proposed_payload`, `status`
- `action_type` enum includes `create_template` and `modify_template`
- `execute_approved_action()` handles both (migration 054)
- **Critical constraint:** `voice_command_id` is NOT NULL — proposed_actions is currently voice-command-centric

### 2b. Client-Side Demo Data (to be replaced)

| File | Purpose | DB Replacement |
|------|---------|----------------|
| `src/lib/templates/templateMockData.ts` | Demo templates, blocks, DONNA suggestions | Supabase queries to `templates`, `template_blocks`, curriculum junctions |
| `src/lib/templates/templateCurriculumPreview.ts` | Curriculum preview constants | Stays as constants — curriculum is read-only |
| `src/lib/templates/fitnessExerciseAutoPopulate.ts` | Exercise suggestion bank | Stays as constants for auto-population suggestions — real saves go to `exercises` |
| `src/lib/templates/fitnessBlockTypes.ts` | Block type display config | Stays as constants |

---

## 3. Required Backend Objects

### Decision: Extend `templates` vs. new tables

**Option A — Extend `templates`:** Add `template_type`, `status`, `curriculum_level_key` columns to the existing `templates` table.

**Option B — Separate tables:** Create `class_templates` and `fitness_templates` with type-specific columns.

**Decision: Option A — extend `templates`.**

Reasons:
- `sessions.template_id` already references `templates(id)`. Splitting would require migrating that FK or dual-FK logic.
- `template_blocks`, `template_block_exercises`, and `curriculum_class_template_blocks` all reference `templates(id)`. A split would require forking all three.
- `execute_approved_action()` already creates records in `templates`. Extending is less invasive than replacing.
- Type-specific data is handled by the separate block pipelines (class: `curriculum_class_template_blocks`, fitness: `template_block_exercises`).

The distinction between class and fitness is captured by:
- `templates.template_type` ('class' | 'fitness')
- Block content: class uses `curriculum_class_template_blocks`, fitness uses `template_block_exercises`

### 3a. Proposed: ALTER `templates` (new columns)

```
template_type          TEXT NOT NULL DEFAULT 'class'
                       CHECK (template_type IN ('class', 'fitness'))
status                 TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft', 'needs_review', 'ready', 'archived'))
curriculum_stage_key   TEXT  -- 'red_foundation' | 'orange_development' | etc.
curriculum_level_key   TEXT  -- human-readable label, snapshot at creation time
template_goal          TEXT  -- the primary session goal text
pathway_focus          TEXT  -- 'Technical' | 'Tactical' | 'Physical' | NULL
fitness_load           TEXT  -- 'Light' | 'Moderate' | 'High' | NULL (fitness only)
approved_by            UUID  REFERENCES profiles(id)
approved_at            TIMESTAMPTZ
archived_at            TIMESTAMPTZ
```

Note: `templates.level_id` (existing) references `academy_levels(id)`. The new `curriculum_stage_key` will reference the stage key string directly (not a FK) to avoid coupling to curriculum_stages table and to preserve curriculum snapshot at creation time.

### 3b. Proposed: ALTER `template_blocks` (new columns)

```
curriculum_connection  TEXT   -- snapshot label at block-creation time
coach_watch_for        TEXT   -- coaching cue from curriculum
fitness_block_type     TEXT   -- 'movement'|'agility'|'speed'|'plyometrics'|'strength'|
                               -- 'coordination'|'mobility'|'recovery_cool_down' | NULL
fitness_load           TEXT   -- block-level load override (fitness templates)
```

Note: `block_type` enum already exists (`warm_up`, `technical`, `tactical`, etc.). The new `fitness_block_type` captures the finer-grained fitness categorization from the UI.

### 3c. Proposed: `template_review_requests` (NEW table)

Rather than forcing template saves through `proposed_actions` (which requires `voice_command_id NOT NULL`), create a dedicated review table for UI-originated template draft submissions.

```sql
CREATE TABLE template_review_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  template_id     UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  requested_by    UUID NOT NULL REFERENCES profiles(id),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  reviewer_notes  TEXT,
  reviewed_by     UUID REFERENCES profiles(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Why not reuse `proposed_actions`:**
- `proposed_actions.voice_command_id` is NOT NULL — template saves from the UI wizard are not voice commands.
- Making `voice_command_id` nullable would require altering a core table with existing RLS and trigger dependencies — high blast radius.
- A dedicated `template_review_requests` table is simpler, more readable, and cleanly separable from voice-command-originated actions.
- `proposed_actions` handles voice commands. `template_review_requests` handles UI-originated template lifecycle transitions.

**When to use `proposed_actions` for templates:**
- When a voice command says "create a new class template for Red Ball players" → `proposed_actions` (action_type = 'create_template')
- UI wizard saves → `template_review_requests`
- Modification suggested by DONNA in the UI → `template_review_requests`

### 3d. Proposed: `template_version_history` (NEW table)

Immutable audit trail of template changes before and after approval.

```sql
CREATE TABLE template_version_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  academy_id      UUID NOT NULL,
  version_number  INTEGER NOT NULL,
  snapshot        JSONB NOT NULL,  -- full template + blocks payload at this version
  changed_by      UUID REFERENCES profiles(id),
  change_reason   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Append-only. Never updated. Written on: initial creation, each approved modification, archival.

### 3e. Proposed: No separate `template_usage` table (yet)

Session usage is already captured via `sessions.template_id`. A view or query `SELECT COUNT(*) FROM sessions WHERE template_id = $1` is sufficient for impact preview. Do not create a separate tracking table until aggregate query performance requires it.

---

## 4. Template Types

| Type | Value | Block Content Pipeline | Coach View |
|------|-------|------------------------|------------|
| Class | `'class'` | `curriculum_class_template_blocks` → `curriculum_content_items` or `curriculum_drills` | Technical/tactical blocks, drill focus |
| Fitness | `'fitness'` | `template_block_exercises` → `exercises` | Fitness blocks, exercise sets/reps |

Both types share the same `templates` and `template_blocks` tables. Type-specific metadata lives in the new columns and the respective block content pipelines.

---

## 5. Required Fields — `templates` (full proposed schema)

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | UUID PK | Yes | |
| `academy_id` | UUID FK → academies | Yes | RLS scope |
| `template_type` | TEXT | Yes | 'class' \| 'fitness' |
| `name` | TEXT | Yes | |
| `description` | TEXT | No | |
| `template_goal` | TEXT | No | The primary goal text from the create wizard |
| `curriculum_stage_key` | TEXT | No | Snapshot of stage key at creation ('red_foundation', etc.) |
| `curriculum_level_key` | TEXT | No | Human-readable label snapshot ('Red Ball 1', etc.) |
| `pathway_focus` | TEXT | No | 'Technical' \| 'Tactical' \| 'Physical' |
| `fitness_load` | TEXT | No | 'Light' \| 'Moderate' \| 'High' — fitness only |
| `total_duration_min` | INTEGER | No | Existing column |
| `status` | TEXT | Yes | 'draft' \| 'needs_review' \| 'ready' \| 'archived' |
| `group_id` | UUID FK → groups | No | Existing column |
| `track` | development_track | No | Existing enum column |
| `level_id` | UUID FK → academy_levels | No | Existing — keep for backward compat |
| `tags` | TEXT[] | No | Existing |
| `is_active` | BOOLEAN | Yes | Existing, default true |
| `is_default` | BOOLEAN | Yes | Existing, default false |
| `created_by` | UUID FK → profiles | No | Existing |
| `approved_by` | UUID FK → profiles | No | NEW — set on status → 'ready' |
| `approved_at` | TIMESTAMPTZ | No | NEW |
| `archived_at` | TIMESTAMPTZ | No | NEW |
| `voice_command_id` | UUID | No | Existing — only set when created via voice |
| `created_at` | TIMESTAMPTZ | Yes | Existing |
| `updated_at` | TIMESTAMPTZ | Yes | Existing |

---

## 6. Required Fields — `template_blocks` (full proposed schema)

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | UUID PK | Yes | |
| `template_id` | UUID FK → templates | Yes | |
| `type` | block_type enum | Yes | Existing enum: warm_up, technical, tactical, etc. |
| `name` | TEXT | Yes | |
| `duration_min` | INTEGER | Yes | |
| `intensity` | INTEGER 1–5 | No | Existing |
| `order_index` | INTEGER | Yes | Default order — sessions must not modify |
| `notes` | TEXT | No | |
| `curriculum_connection` | TEXT | No | NEW — snapshot label at block-creation time |
| `coach_watch_for` | TEXT | No | NEW — coaching cue snapshot |
| `fitness_block_type` | TEXT | No | NEW — finer fitness categorization |
| `fitness_load` | TEXT | No | NEW — block-level load (fitness only) |
| `created_at` | TIMESTAMPTZ | Yes | |

---

## 7. Required Fields — Template Items

### Class Template Items (`curriculum_class_template_blocks` — already exists)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `template_id` | UUID FK → templates | Redundant with block→template chain but indexed |
| `block_id` | UUID FK → template_blocks | |
| `content_item_id` | UUID FK → curriculum_content_items | Mutually exclusive with drill_id |
| `drill_id` | UUID FK → curriculum_drills | Mutually exclusive with content_item_id |
| `order_index` | INTEGER | Position within block |
| `notes` | TEXT | |
| `duration_min` | INTEGER | |

Missing fields to add via ALTER (Sprint 972):
- `skill_focus` TEXT — snapshot of the skill domain at connection time
- `assessment_gate_link` TEXT — snapshot of associated gate label if applicable
- `player_mission_link` TEXT — snapshot of player mission text if applicable

### Fitness Template Items (`template_block_exercises` — already exists)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `block_id` | UUID FK → template_blocks | |
| `exercise_id` | UUID FK → exercises | |
| `order_index` | INTEGER | |
| `duration_min` | INTEGER | |
| `notes` | TEXT | |

Missing fields to add via ALTER (Sprint 972):
- `sets` TEXT — e.g. '3'
- `reps` TEXT — e.g. '8 each side'
- `load_note` TEXT — specific load instruction for this exercise in context
- `tennis_transfer` TEXT — snapshot at time of template creation
- `progression` TEXT — snapshot from exercise progression map
- `regression` TEXT — snapshot from exercise regression map
- `equipment` TEXT[] — from exercises.equipment, snapshotted

---

## 8. Review / Approval Model

```
[Director creates wizard draft]
         |
         v
  templates (status='draft')
  template_review_requests (status='pending')
         |
         v
  [Director opens Review Queue]
  [Reviews template + blocks]
         |
     approve / reject
         |
    (approved)
         v
  templates.status = 'ready'
  templates.approved_by = director_id
  templates.approved_at = NOW()
  template_review_requests.status = 'approved'
  template_version_history INSERT (version snapshot)
         |
         v
  [Coaches can now create sessions from this template]
         |
         v
  sessions.template_id = template.id
```

**Invariants that must be preserved:**
- DONNA suggestions and difficulty/duration flags are local UI state — they do NOT write to `template_review_requests` until the director explicitly clicks "Submit for Review"
- A template with `status = 'draft'` or `status = 'needs_review'` cannot be used to create a session
- Only `status = 'ready'` templates appear in coach session creation
- Director is the only role that can set `status = 'ready'` (enforced by RLS)
- Curriculum constants are never mutated — `curriculum_stage_key` and `curriculum_level_key` are snapshots written at template creation, not live FKs that break if curriculum is restructured
- Every status transition writes to `audit_logs`

---

## 9. RLS / Security Requirements

### `templates`

| Operation | Policy | Roles |
|-----------|--------|-------|
| SELECT (status='ready') | `academy_id = auth_academy_id()` | All staff (director, head_coach, coach) |
| SELECT (status='draft'/'needs_review') | `academy_id = auth_academy_id() AND (created_by = auth.uid() OR auth_is_director_or_head())` | Director, head_coach, creator |
| INSERT | `academy_id = auth_academy_id() AND auth_is_director_or_head()` | Director, head_coach |
| UPDATE (status change to 'ready') | `academy_id = auth_academy_id() AND auth_has_role('academy_director')` | Director only |
| UPDATE (other fields on draft) | `academy_id = auth_academy_id() AND auth_is_director_or_head()` | Director, head_coach |
| DELETE / archive | `academy_id = auth_academy_id() AND auth_has_role('academy_director')` | Director only |
| SELECT (parent/player) | DENIED — templates are internal | Never exposed to parent/player roles |

### `template_review_requests`

| Operation | Policy |
|-----------|--------|
| SELECT | `academy_id = auth_academy_id() AND auth_is_director_or_head()` |
| INSERT | `academy_id = auth_academy_id() AND auth_is_director_or_head()` |
| UPDATE (review) | `academy_id = auth_academy_id() AND auth_has_role('academy_director')` |

### `template_version_history`

| Operation | Policy |
|-----------|--------|
| SELECT | `academy_id = auth_academy_id() AND auth_is_director_or_head()` |
| INSERT | Via server action only — not direct client insert |
| UPDATE/DELETE | DENIED — append-only |

### `curriculum_class_template_blocks`

Existing RLS (migration 062):
- Staff see: OK
- Directors manage: OK
- Add: coaches should see (for read) on templates they are assigned to

### `template_block_exercises`

Existing RLS (migration 058): fully patched. No changes needed.

---

## 10. Integration Points

### Sessions
- `sessions.template_id` → `templates.id` (FK already exists)
- Session creation: only `status = 'ready'` templates offered in session builder
- When a session is created from a template, `session_blocks` are copied from `template_blocks` (preserving `order_index`). Session-level reordering never touches the template.
- Block exercises copied: `session_block_exercises` from `template_block_exercises`. Class blocks use `curriculum_class_template_blocks` content, not exercises — a separate copy mechanism is needed for class template content at session instantiation.

### Coach Session Execution
- Coach reads `session_blocks` (copied from template). Template is not re-read at session time.
- Coach wrap-up writes to `session_block_exercises` notes / completion status — does not write back to template.

### Player Profile Exposure History
- `sessions` already records `group_id` + `template_id` + `scheduled_date`. This is sufficient for building a player's template exposure history via `session_attendance`.
- No new tables needed at this stage.

### Parent / Player Summaries
- Templates are never directly exposed to parent or player roles.
- Parent summaries reference session types (from `sessions.name` or template name), not template details.
- Player summaries may reference curriculum stage and goal text — these come from curriculum constants, not from the template record.

### Academy Health
- Template coverage (how many ready templates per stage/level) feeds the Director Dashboard health metrics.
- Gap detection query: `SELECT curriculum_stage_key, COUNT(*) FROM templates WHERE status='ready' GROUP BY curriculum_stage_key` vs. expected coverage.
- DONNA suggestions in `donna-suggestions` page should be replaced with this real gap query.

### DONNA Recommendations
- DONNA's difficulty/duration flagging in the panel (Sprints 962–963) writes to local React state now.
- In production: DONNA flags write to `template_review_requests` with a `change_type` field ('difficulty_adjustment', 'duration_adjustment') and status 'pending'.
- Director reviews DONNA-flagged requests in the Review Queue alongside director-initiated reviews.

---

## 11. Migration Plan

| Sprint | Title | Migration | Scope |
|--------|-------|-----------|-------|
| 972 | Template Schema Migration Draft V1 | `067_template_schema_extension.sql` | ALTER `templates` (template_type, status, curriculum_stage_key, template_goal, approved_by, approved_at, archived_at). ALTER `template_blocks` (curriculum_connection, coach_watch_for, fitness_block_type, fitness_load). ALTER `curriculum_class_template_blocks` (skill_focus, assessment_gate_link, player_mission_link). ALTER `template_block_exercises` (sets, reps, load_note, tennis_transfer, progression, regression). CREATE `template_review_requests`. CREATE `template_version_history`. |
| 973 | Template RLS Policy Draft V1 | `068_template_rls_policies.sql` | Updated RLS for `templates` (status-aware, director-only approve), `template_review_requests`, `template_version_history`. Patch `curriculum_class_template_blocks` coach SELECT. |
| 974 | Template Repository Read Layer V1 | No migration | Server-side query functions: `getTemplateById()`, `getClassTemplates()`, `getFitnessTemplates()` reading from real DB. Replace mock data in list and detail pages. |
| 975 | Template Save Draft Server Action V1 | No migration | Server Action: `saveTemplateDraft()` — INSERT into `templates` (status='draft') + `template_blocks` + content junctions. Returns template ID. Wires class/fitness create wizard Step 5 "Save as Draft". |
| 976 | Template Review Queue Handoff V1 | No migration | Server Action: `submitTemplateForReview()` — updates `templates.status` to 'needs_review', INSERTs into `template_review_requests`. Wires "Submit for Review" button in draft safety panel. |
| 977 | Template Approval Application V1 | No migration | Server Action: `approveTemplate()` — director-only. Sets `templates.status = 'ready'`, `approved_by`, `approved_at`. Updates `template_review_requests.status = 'approved'`. Writes to `template_version_history` and `audit_logs`. |
| 978 | Template Detail Live Data Wiring V1 | No migration | Replace mock data in `class/[templateId]` and `fitness/[templateId]` with live DB reads. |
| 979 | Class Template Create Save Wiring V1 | No migration | Wire class template create wizard to `saveTemplateDraft()`. Map wizard state → template + template_blocks + curriculum_class_template_blocks. |
| 980 | Fitness Template Create Save Wiring V1 | No migration | Wire fitness create wizard to `saveTemplateDraft()`. Map wizard state → template + template_blocks + template_block_exercises. |
| 981 | Coach Preview Live Template Wiring V1 | No migration | Replace coach-preview page mock blocks with real `session_blocks`-style read from template blocks + curriculum/exercise content. |
| 982 | Template Version History V1 | No migration | Implement version snapshot writes on every approved status change. Read version history in detail page "History" tab (if added). |
| 983 | Template Usage Tracking V1 | No migration | Implement impact preview metrics using real `sessions WHERE template_id = $1` count, `session_attendance` player count. Replace static demo projections. |
| 984 | Template Backend QA V1 | No migration | QA doc: verify all flows with real DB. Confirm RLS prevents coach from seeing draft templates. Confirm parent/player cannot access templates. Confirm session creation only offers ready templates. |
| 985 | Template Backend Completion Audit V1 | No migration | Full audit: all templates features live vs. mock, migration state, open risks, handoff notes for session builder integration. |

---

## 12. Risks and Decisions Needed

### Risk 1: `proposed_actions` vs. `template_review_requests`

**Decision above:** Use `template_review_requests` for UI-originated template lifecycle transitions. Use `proposed_actions` only for voice-originated template commands (`action_type = 'create_template'`).

**Open question:** Should `template_review_requests` be linked back to `proposed_actions` via an optional FK for cases where voice creates a template draft that then enters the review queue? Recommendation: yes — add `proposed_action_id UUID REFERENCES proposed_actions(id)` as a nullable column on `template_review_requests` in Sprint 972.

### Risk 2: Snapshot labels vs. FK-only

**Decision above:** Store `curriculum_stage_key` and `curriculum_level_key` as TEXT snapshots in `templates`, not FKs. Store `curriculum_connection`, `coach_watch_for`, `skill_focus`, `assessment_gate_link`, `player_mission_link`, `tennis_transfer`, `progression`, `regression` as TEXT snapshots in blocks/items.

**Why:** Curriculum constants will evolve. A template created for "Red Ball 2 — Foundation Groundstrokes" must continue to document that connection even if curriculum is later restructured. FK references would break silently if curriculum levels are renumbered.

**Tradeoff:** Snapshot labels become stale if curriculum is meaningfully reorganized. Solution: `template_version_history` allows a director to re-snapshot if needed.

### Risk 3: Curriculum changes after templates are created

**Policy:** Templates never automatically update to reflect curriculum changes. A new `template_version_history` entry is required to record any deliberate re-alignment. DONNA should detect when a template's `curriculum_stage_key` no longer matches the current curriculum coverage level for its connected players and surface this as a gap suggestion.

### Risk 4: Template versioning granularity

**Decision above:** Version history is coarse — one snapshot per approved change, not diff-level. A full `JSONB` snapshot of template + blocks is written to `template_version_history`. This is sufficient for audit and rollback consultation, and avoids the complexity of field-level diffs.

### Risk 5: Template edits overwriting curriculum

**Guardrail:** Templates store curriculum labels as snapshots. They do not write back to `curriculum_stages`, `curriculum_levels`, `curriculum_content_items`, `curriculum_drills`, or any related curriculum table. This is enforced at the server action level: `saveTemplateDraft()` only touches `templates`, `template_blocks`, `curriculum_class_template_blocks`, `template_block_exercises`. RLS on curriculum tables ensures no template server action has write access to curriculum objects.

### Risk 6: Class vs. fitness abstraction

**Decision above:** Do not force a shared abstraction. Class and fitness templates share the same `templates` and `template_blocks` tables (via `template_type`), but their block content is completely separate:
- Class blocks → `curriculum_class_template_blocks` → curriculum content/drills
- Fitness blocks → `template_block_exercises` → exercises

This is the correct minimal abstraction. A future shared "item" abstraction would require collapsing two fundamentally different content types (curriculum-driven drills vs. exercise-library entries) — this would increase complexity without reducing it.

**Practical consequence:** `getTemplateBlocks(templateId, type)` returns different join results depending on `template_type`. The read layer (Sprint 974) must handle this branching cleanly.

### Risk 7: `templates.level_id` vs. `curriculum_stage_key`

**Current state:** `templates.level_id` references `academy_levels(id)`. Academy levels and curriculum levels/stages are related but may not be identical — different academies may have different level naming conventions.

**Proposed approach:** Keep `level_id` (backward compat) and add `curriculum_stage_key` (the canonical AcademyOS curriculum stage). Over time, phase out `level_id` in favor of `curriculum_stage_key` for curriculum-aware features.

### Risk 8: `proposed_actions` expiry

`proposed_actions` expires after 24 hours. Template review requests should NOT expire — a template can legitimately sit in `needs_review` state for days. This is another reason `template_review_requests` is the right table for template lifecycle, not `proposed_actions`.

---

## 13. Audit Summary — What Exists vs. What Must Be Built

| Component | Exists | Needs Change |
|-----------|--------|-------------|
| `templates` table | Yes | ALTER: add 7 new columns |
| `template_blocks` table | Yes | ALTER: add 4 new columns |
| `template_block_exercises` table | Yes | ALTER: add 7 new columns (sets, reps, load_note, tennis_transfer, progression, regression, equipment) |
| `curriculum_class_template_blocks` table | Yes | ALTER: add 3 new columns (skill_focus, assessment_gate_link, player_mission_link) |
| `template_review_requests` table | No | CREATE (Sprint 972) |
| `template_version_history` table | No | CREATE (Sprint 972) |
| `execute_approved_action()` for `create_template` | Yes | May extend to set new columns |
| `execute_approved_action()` for `modify_template` | Yes | May extend |
| RLS on `templates` (status-aware) | Partial (too broad) | Update in Sprint 973 |
| RLS on `template_review_requests` | No | Sprint 973 |
| RLS on `template_version_history` | No | Sprint 973 |
| Server actions for template save/submit/approve | No | Sprints 975–977 |
| Live DB reads in template list/detail pages | No | Sprint 974, 978 |
| Gap detection from real DB | No | Sprint 983 |
| Impact preview from real session data | No | Sprint 983 |

---

## TypeScript: CLEAN
## Migrations: NONE (audit-only sprint)
## Next sprint: 972 — Template Schema Migration Draft V1
