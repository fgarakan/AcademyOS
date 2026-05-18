-- ============================================================
-- ACADEMY OS -- MIGRATION 067: TEMPLATE SCHEMA EXTENSION
--
-- Purpose:
--   Extend the existing template tables to support the
--   Curriculum-Aware Template System built in Sprints 935-970.
--   Add two new tables for UI-originated template lifecycle.
--
-- Tables modified:
--   templates                      -- add type, status, curriculum keys, approval fields
--   template_blocks                -- add curriculum snapshot fields, fitness fields
--   template_block_exercises       -- add snapshot fields for fitness pipeline
--   curriculum_class_template_blocks -- add curriculum snapshot fields for class pipeline
--
-- Tables created:
--   template_review_requests       -- UI-originated draft/review/approve lifecycle
--   template_version_history       -- append-only snapshot audit trail
--
-- Key invariants:
--   Templates are curriculum-derived but do NOT mutate curriculum tables.
--   Curriculum labels (stage, level, connection, etc.) are stored as TEXT
--   snapshots at creation time, not as live FKs. This protects templates
--   from breaking if curriculum structure is later reorganised.
--
--   template_review_requests handles UI-originated lifecycle transitions
--   (director saves draft, submits for review, approves).
--   proposed_actions remains the path for voice-command-originated
--   create_template / modify_template actions.
--
--   parent and player roles receive NO access to any template table.
--   Templates are internal director/coach-only objects.
--
-- Depends on:
--   002_core_identity.sql      -- update_updated_at(), profiles
--   003_rls_helpers.sql        -- auth_academy_id(), auth_is_staff(), auth_is_director_or_head()
--   006_exercises_templates.sql -- templates, template_blocks, template_block_exercises
--   062_class_template_content_junction.sql -- curriculum_class_template_blocks
--
-- Sprint: 972 -- Template Schema Migration Draft V1
-- ============================================================


-- ============================================================
-- SECTION 1: EXTEND templates
-- ============================================================

-- template_type: 'class_template' or 'fitness_template'.
-- Distinguishes class templates (curriculum_class_template_blocks pipeline)
-- from fitness templates (template_block_exercises pipeline).
-- NULL is tolerated for templates created before this migration (voice-created
-- templates via execute_approved_action). Directors should set type on review.
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS template_type TEXT
    CHECK (template_type IN ('class_template', 'fitness_template'));

-- status: lifecycle state.
-- Existing rows default to 'draft' -- directors should review and promote.
-- 'draft'        -- being built; not visible to coaches for session creation
-- 'needs_review' -- submitted for director review; locked for editing
-- 'ready'        -- director-approved; coaches can create sessions from this template
-- 'archived'     -- no longer in use; hidden from session builder; retained for history
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'needs_review', 'ready', 'archived'));

-- curriculum_stage_key: snapshot of the curriculum_stage enum value at creation time.
-- e.g. 'red_foundation', 'orange_development', 'green_performance',
--      'yellow_competitive', 'high_performance'
-- Stored as TEXT, not FK, so templates remain valid if curriculum is reorganised.
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS curriculum_stage_key TEXT;

-- curriculum_level_key: human-readable curriculum level label at creation time.
-- e.g. 'Red Ball 1', 'Orange Ball 2', 'Green Ball Performance'
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS curriculum_level_key TEXT;

-- curriculum_source_label: the full display label shown in the UI at creation time.
-- e.g. 'Red Ball / Orange Ball -- Foundation', 'Green Ball -- Performance Stage'
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS curriculum_source_label TEXT;

-- template_goal: the primary session goal as entered in the create wizard.
-- e.g. 'Rally consistency from the baseline using open stance and unit turn'
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS template_goal TEXT;

-- pathway_focus: broad focus area of the template.
-- Informational only -- does not constrain block types.
-- e.g. 'Technical', 'Tactical', 'Physical', 'Competition'
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS pathway_focus TEXT;

-- approved_by: profile id of the director who moved status to 'ready'.
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);

-- approved_at: timestamp of approval.
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- archived_at: timestamp when template was archived.
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Index on template_type + status for library queries.
CREATE INDEX IF NOT EXISTS idx_templates_type_status
  ON templates(academy_id, template_type, status);

-- Index on curriculum_stage_key for gap detection queries.
CREATE INDEX IF NOT EXISTS idx_templates_curriculum_stage
  ON templates(academy_id, curriculum_stage_key)
  WHERE curriculum_stage_key IS NOT NULL;


-- ============================================================
-- SECTION 2: EXTEND template_blocks
-- ============================================================

-- curriculum_connection: snapshot label of the curriculum connection at block
-- creation time. e.g. 'Level 1 -- Foundational Groundstrokes'
-- Stored as TEXT snapshot, not FK.
ALTER TABLE template_blocks
  ADD COLUMN IF NOT EXISTS curriculum_connection TEXT;

-- coach_watch_for: coaching cue pulled from curriculum at block creation time.
-- e.g. 'Watch for early racquet preparation and forward weight transfer'
-- Stored as TEXT snapshot.
ALTER TABLE template_blocks
  ADD COLUMN IF NOT EXISTS coach_watch_for TEXT;

-- fitness_block_type: fine-grained fitness block categorisation.
-- Used only when the parent template has template_type = 'fitness_template'.
-- Separate from the existing 'type' column (block_type enum) which captures
-- the broad block role (warm_up, fitness, cool_down, etc.).
-- e.g. 'movement', 'agility', 'speed', 'plyometrics', 'strength',
--      'coordination', 'mobility', 'recovery_cool_down'
ALTER TABLE template_blocks
  ADD COLUMN IF NOT EXISTS fitness_block_type TEXT;

-- intensity_level: human-readable intensity descriptor.
-- Coexists with the existing numeric 'intensity' column (1-5).
-- e.g. 'Light', 'Moderate', 'High'
-- Used primarily for fitness templates where load language matters.
ALTER TABLE template_blocks
  ADD COLUMN IF NOT EXISTS intensity_level TEXT;

-- load_level: load descriptor for fitness blocks.
-- e.g. 'Light', 'Moderate', 'High'
ALTER TABLE template_blocks
  ADD COLUMN IF NOT EXISTS load_level TEXT;

-- source_snapshot: optional full snapshot of block source data (curriculum
-- preview fields, fitness exercise bank entry, etc.) captured at creation.
-- Allows reconstruction of what the director saw when building this block.
ALTER TABLE template_blocks
  ADD COLUMN IF NOT EXISTS source_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB;

-- Note: order_index already exists on template_blocks (migration 006).
-- Its semantics are immutable: sessions copy this order and may reorder
-- independently. Never modify a template's order_index after session creation.


-- ============================================================
-- SECTION 3: EXTEND template_block_exercises
-- (Fitness template pipeline: template_blocks -> template_block_exercises -> exercises)
-- ============================================================

-- exercise_label: snapshot of exercises.name at time of template creation.
-- If the exercise record is later renamed or deleted, the template retains
-- the name it was created with.
ALTER TABLE template_block_exercises
  ADD COLUMN IF NOT EXISTS exercise_label TEXT;

-- category: snapshot of exercises.category (exercise_category enum value as text)
-- at time of template creation.
ALTER TABLE template_block_exercises
  ADD COLUMN IF NOT EXISTS category TEXT;

-- sets_reps_duration: combined descriptor captured from the fitness exercise bank.
-- e.g. '3 sets x 8 reps', '4 x 60s', '3 sets x 10 each side'
-- Stored as a single text field to avoid over-normalising transient exercise data.
ALTER TABLE template_block_exercises
  ADD COLUMN IF NOT EXISTS sets_reps_duration TEXT;

-- load_level: load instruction for this exercise in context.
-- May differ from the block-level load_level if exercises vary within a block.
ALTER TABLE template_block_exercises
  ADD COLUMN IF NOT EXISTS load_level TEXT;

-- tennis_transfer: snapshot of the tennis_transfer label from the exercise bank.
-- e.g. 'Split-step reaction', 'First step to the ball', 'Serve power'
ALTER TABLE template_block_exercises
  ADD COLUMN IF NOT EXISTS tennis_transfer TEXT;

-- progression: snapshot from the exercise progression map.
-- e.g. 'Single-leg variation', 'Add resistance band'
ALTER TABLE template_block_exercises
  ADD COLUMN IF NOT EXISTS progression TEXT;

-- regression: snapshot from the exercise regression map.
-- e.g. 'Reduce range of motion', 'Bodyweight only'
ALTER TABLE template_block_exercises
  ADD COLUMN IF NOT EXISTS regression TEXT;

-- equipment: snapshot of equipment requirements for this exercise in context.
-- Plain TEXT here (not TEXT[]) to keep the schema simple at this stage.
-- e.g. 'Resistance band, cone markers'
ALTER TABLE template_block_exercises
  ADD COLUMN IF NOT EXISTS equipment TEXT;

-- coaching_cue: brief cue for the coach during execution.
-- e.g. 'Focus on outside foot plant', 'Knee tracks over second toe'
ALTER TABLE template_block_exercises
  ADD COLUMN IF NOT EXISTS coaching_cue TEXT;

-- source_snapshot: full snapshot of the exercise bank entry used when this
-- exercise was added to the template block.
ALTER TABLE template_block_exercises
  ADD COLUMN IF NOT EXISTS source_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB;


-- ============================================================
-- SECTION 4: EXTEND curriculum_class_template_blocks
-- (Class template pipeline: template_blocks -> curriculum_class_template_blocks
--  -> curriculum_content_items | curriculum_drills)
-- Created in migration 062. This section adds curriculum snapshot fields.
-- ============================================================

-- curriculum_level_key: snapshot of the curriculum level label at block
-- connection time. Mirrors templates.curriculum_level_key but at block granularity
-- in case blocks connect to different curriculum sub-levels.
ALTER TABLE curriculum_class_template_blocks
  ADD COLUMN IF NOT EXISTS curriculum_level_key TEXT;

-- assessment_gate_label: snapshot label of any assessment gate associated with
-- this block's curriculum connection. e.g. 'Level 1 Gate -- Serve Readiness'
ALTER TABLE curriculum_class_template_blocks
  ADD COLUMN IF NOT EXISTS assessment_gate_label TEXT;

-- player_mission_label: snapshot of the player mission statement from the
-- curriculum level connected to this block.
-- e.g. 'I can sustain 5 consecutive rallies from the baseline'
ALTER TABLE curriculum_class_template_blocks
  ADD COLUMN IF NOT EXISTS player_mission_label TEXT;

-- coach_watch_for: coaching cue pulled from curriculum at block connection time.
-- Block-level snapshot, separate from template_blocks.coach_watch_for which
-- is a higher-level cue for the whole block.
ALTER TABLE curriculum_class_template_blocks
  ADD COLUMN IF NOT EXISTS coach_watch_for TEXT;

-- source_snapshot: full snapshot of the curriculum data used when this content
-- connection was made. Includes watch-fors, drills, gate state at connection time.
ALTER TABLE curriculum_class_template_blocks
  ADD COLUMN IF NOT EXISTS source_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB;


-- ============================================================
-- SECTION 5: CREATE template_review_requests
--
-- Handles UI-originated template lifecycle transitions:
--   director creates draft -> submits for review -> director approves/rejects
--
-- NOT for voice-command-originated template actions.
-- Voice commands use proposed_actions (action_type = 'create_template' /
-- 'modify_template') which require a voice_command_id.
--
-- template_draft stores the full wizard payload at submission time so the
-- reviewing director sees exactly what was proposed, even if the underlying
-- template record changes between submission and review.
-- ============================================================

CREATE TABLE IF NOT EXISTS template_review_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  template_id     UUID        REFERENCES templates(id) ON DELETE CASCADE,

  -- Full wizard payload captured at submission time.
  -- Allows director to review what was proposed without reading the live template.
  template_draft  JSONB       NOT NULL DEFAULT '{}'::JSONB,

  -- Type of change being requested.
  -- 'create_template'    -- new template entering review for the first time
  -- 'update_template'    -- modification to an existing ready template
  -- 'archive_template'   -- request to archive an active template
  -- 'duplicate_template' -- request to create a copy of an existing template
  request_type    TEXT        NOT NULL
    CHECK (request_type IN ('create_template', 'update_template', 'archive_template', 'duplicate_template')),

  -- Lifecycle status of this review request.
  -- 'pending'   -- awaiting director review
  -- 'approved'  -- director approved; template status updated to 'ready'
  -- 'rejected'  -- director rejected; template remains in 'draft' or 'needs_review'
  -- 'cancelled' -- requestor withdrew the request before review
  status          TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),

  requested_by    UUID        REFERENCES profiles(id),
  reviewed_by     UUID        REFERENCES profiles(id),
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,

  -- optional back-link to a voice-command proposed action if this review
  -- was triggered by a voice command that then went through the UI wizard.
  proposed_action_id UUID,   -- no FK constraint -- proposed_actions may not be wired yet

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns.
CREATE INDEX IF NOT EXISTS idx_trr_academy_status
  ON template_review_requests(academy_id, status);

CREATE INDEX IF NOT EXISTS idx_trr_template_id
  ON template_review_requests(template_id);

CREATE INDEX IF NOT EXISTS idx_trr_requested_by
  ON template_review_requests(requested_by);

CREATE INDEX IF NOT EXISTS idx_trr_reviewed_by
  ON template_review_requests(reviewed_by)
  WHERE reviewed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trr_created_at
  ON template_review_requests(academy_id, created_at DESC);

-- updated_at trigger (reuse canonical function from migration 002).
CREATE TRIGGER tr_template_review_requests_updated_at
  BEFORE UPDATE ON template_review_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE template_review_requests ENABLE ROW LEVEL SECURITY;

-- Directors and head coaches can view all review requests within their academy.
CREATE POLICY "Directors see template review requests"
  ON template_review_requests FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

-- Directors and head coaches can submit review requests (create drafts).
CREATE POLICY "Directors submit template review requests"
  ON template_review_requests FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_is_director_or_head());

-- Only directors (not head_coach) can approve or reject review requests.
-- This enforces the core product rule: Director approves, system executes.
CREATE POLICY "Directors review template requests"
  ON template_review_requests FOR UPDATE
  USING (academy_id = auth_academy_id() AND auth_has_role('academy_director'));


-- ============================================================
-- SECTION 6: CREATE template_version_history
--
-- Append-only audit trail of template state at each lifecycle event.
-- One row is written per event: initial creation, each approved modification,
-- archival.
--
-- The snapshot JSONB captures the full template + blocks payload as seen by
-- the director at the time of approval. Coarse-grained but sufficient for
-- audit and rollback consultation.
--
-- No UPDATE or DELETE policies are added -- this table is intentionally
-- append-only. Server actions must enforce this at the application layer.
-- ============================================================

CREATE TABLE IF NOT EXISTS template_version_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  template_id     UUID        NOT NULL REFERENCES templates(id) ON DELETE CASCADE,

  -- Monotonically increasing version number per template.
  -- Version 1 = initial approved creation.
  version_number  INTEGER     NOT NULL,

  -- What triggered this version snapshot.
  -- e.g. 'initial_approval', 'modification_approved', 'archived',
  --      'restored_from_archive', 'blocks_updated'
  change_type     TEXT        NOT NULL,

  -- Full JSON snapshot of the template and its blocks at this version.
  -- Schema: { template: {...}, blocks: [{...}], items: [{...}] }
  snapshot        JSONB       NOT NULL DEFAULT '{}'::JSONB,

  changed_by      UUID        REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Uniqueness: each template has exactly one row per version number.
  CONSTRAINT uq_template_version UNIQUE (template_id, version_number)
);

-- Indexes for audit queries.
CREATE INDEX IF NOT EXISTS idx_tvh_academy_template
  ON template_version_history(academy_id, template_id);

CREATE INDEX IF NOT EXISTS idx_tvh_created_at
  ON template_version_history(template_id, created_at DESC);

-- RLS
ALTER TABLE template_version_history ENABLE ROW LEVEL SECURITY;

-- Directors and head coaches can view version history within their academy.
CREATE POLICY "Directors see template version history"
  ON template_version_history FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

-- INSERT restricted to directors -- server actions that approve templates
-- write version snapshots. Head coaches cannot directly insert version history.
-- Note: in production this will be replaced with a SECURITY DEFINER function
-- so application code never calls INSERT directly. For now, director-only.
CREATE POLICY "Directors insert template version history"
  ON template_version_history FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_has_role('academy_director'));

-- No UPDATE policy -- version history is append-only.
-- No DELETE policy -- version history is permanent.


-- ============================================================
-- SECTION 7: COMMENT ON new columns
-- ============================================================

COMMENT ON COLUMN templates.template_type IS
  'Distinguishes class templates (curriculum drill pipeline) from '
  'fitness templates (exercise library pipeline). NULL tolerated for '
  'voice-created templates predating this migration.';

COMMENT ON COLUMN templates.status IS
  'Template lifecycle: draft -> needs_review -> ready (or archived). '
  'Only ready templates are offered to coaches for session creation. '
  'Status transitions are controlled by template_review_requests.';

COMMENT ON COLUMN templates.curriculum_stage_key IS
  'Snapshot of the curriculum_stage enum key at creation time. '
  'Not a FK -- stored as text to survive curriculum restructuring.';

COMMENT ON COLUMN templates.curriculum_level_key IS
  'Human-readable curriculum level label snapshot at creation time.';

COMMENT ON COLUMN templates.approved_by IS
  'Profile ID of the director who approved this template (set status = ready). '
  'NULL until first approval.';

COMMENT ON TABLE template_review_requests IS
  'UI-originated template lifecycle requests. Separate from proposed_actions '
  'which handles voice-command-originated create_template / modify_template. '
  'No parent or player access.';

COMMENT ON TABLE template_version_history IS
  'Append-only audit trail of template state at each approved lifecycle event. '
  'One snapshot per approval or archival. No UPDATE or DELETE policies -- '
  'immutable once written.';
