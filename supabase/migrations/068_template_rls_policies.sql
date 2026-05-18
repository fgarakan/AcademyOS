-- ============================================================
-- ACADEMY OS -- MIGRATION 068: TEMPLATE RLS POLICY REFINEMENTS
--
-- Purpose:
--   Replace the overly broad template policies written in migration 006
--   with status-aware, role-differentiated policies that reflect the
--   Curriculum-Aware Template System lifecycle added in migration 067.
--
-- Key product rules encoded here:
--   1. Templates are internal staff-facing operational objects.
--      parent and player roles receive NO access to any template table.
--      This is enforced by absence -- no policy grants parent/player access.
--
--   2. Ready templates (status = 'ready') may be seen by all staff,
--      including coaches, for session execution purposes.
--
--   3. Draft and needs_review templates are restricted to:
--      - academy_director and head_coach (all drafts in their academy)
--      - the profile who created the draft (created_by = auth.uid())
--      Coaches cannot see other coaches' drafts.
--
--   4. Approval (status transition to 'ready') is director-controlled.
--      head_coach can update template content but cannot promote to 'ready'.
--      Enforced via WITH CHECK on the UPDATE policy.
--
--   5. Curriculum source snapshots (curriculum_stage_key, curriculum_level_key,
--      curriculum_connection, etc.) are read-only snapshots inside template rows.
--      They do not mutate curriculum tables -- this is enforced at the server
--      action layer, not RLS.
--
--   6. Hard delete is director-only. Preferred path is status = 'archived'
--      set via UPDATE. DELETE policy exists for data hygiene only.
--
-- Depends on:
--   002_core_identity.sql   -- profiles, user_role enum
--   003_rls_helpers.sql     -- auth_academy_id(), auth_is_staff(),
--                              auth_is_director_or_head(), auth_has_role()
--   006_exercises_templates.sql -- original tables + broad policies (dropped here)
--   058_template_block_exercises_rls.sql -- granular exercise policies (partially replaced)
--   062_class_template_content_junction.sql -- curriculum_class_template_blocks (unchanged)
--   067_template_schema_extension.sql -- status column on templates (MUST be applied first)
--
-- IMPORTANT:
--   Migration 067 must be applied before this migration.
--   This migration references templates.status which was added in 067.
--   If 067 has not been applied, policies that reference 'status' will fail.
--
-- Migration status: DRAFT ONLY -- not applied to any database.
-- Sprint: 973 -- Template RLS Policy Draft V1
-- ============================================================


-- ============================================================
-- SECTION 1: TEMPLATES TABLE
--
-- Current state after migration 006:
--   "Staff see templates"   FOR SELECT  -- all staff see all templates (too broad)
--   "Staff manage templates" FOR ALL    -- all staff manage all templates (too broad)
--
-- Replacement:
--   Split into granular SELECT / INSERT / UPDATE / DELETE policies.
--   Status-aware SELECT: coaches see only ready templates.
--   INSERT / UPDATE / DELETE: director and head_coach only.
--   Status-to-ready transition: director only (via WITH CHECK).
-- ============================================================

-- Remove overly broad original policies.
DROP POLICY IF EXISTS "Staff see templates"    ON templates;
DROP POLICY IF EXISTS "Staff manage templates" ON templates;

-- -- SELECT policies (multiple policies are OR'd by PostgreSQL) --

-- Directors and head_coaches can see all templates in their academy,
-- regardless of status. This enables them to manage the full lifecycle.
CREATE POLICY "Directors see all templates"
  ON templates FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Coaches can see templates that are in 'ready' status only.
-- Draft and needs_review templates are not exposed to coaches.
-- This ensures coaches only act on director-approved templates.
CREATE POLICY "Coaches see ready templates"
  ON templates FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_has_role('coach')
    AND status = 'ready'
  );

-- Creators (staff who drafted the template) can see their own templates
-- in any status. This allows a head_coach who built a draft to view it
-- before a director promotes it. Mirrors the "Proposers see own actions"
-- pattern used in proposed_actions (migration 009).
CREATE POLICY "Creators see own templates"
  ON templates FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_staff()
    AND created_by = auth.uid()
  );

-- -- INSERT policy --

-- Only directors and head_coaches can create new templates.
-- Coaches do not INSERT directly -- if coach-created drafts are needed
-- in the future, a SECURITY DEFINER server action should be used instead
-- of relaxing this RLS policy. This keeps template creation under
-- director/head program oversight.
-- Note: execute_approved_action() runs as SECURITY DEFINER and bypasses RLS,
-- so voice-command-created templates (action_type='create_template') still work.
CREATE POLICY "Directors insert templates"
  ON templates FOR INSERT
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- -- UPDATE policy --

-- Directors and head_coaches can update templates in their academy.
-- USING: which existing rows can be targeted (any template in the academy).
-- WITH CHECK: what the updated row must look like.
--   If the updated status is 'ready', the user must be an academy_director.
--   head_coach can update content (name, goal, blocks) but cannot approve.
-- This enforces: approval (status -> 'ready') is director-controlled.
CREATE POLICY "Directors update templates"
  ON templates FOR UPDATE
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  )
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
    -- If the new status is 'ready', only academy_director may commit that change.
    -- head_coach can update all other fields without restriction.
    AND (
      status != 'ready'
      OR auth_has_role('academy_director')
    )
  );

-- -- DELETE policy --

-- Only academy_director can hard-delete a template.
-- The preferred path for retiring a template is status = 'archived' via UPDATE.
-- Hard delete is available for data hygiene (e.g. duplicates, test data).
CREATE POLICY "Directors delete templates"
  ON templates FOR DELETE
  USING (
    academy_id = auth_academy_id()
    AND auth_has_role('academy_director')
  );


-- ============================================================
-- SECTION 2: TEMPLATE_BLOCKS TABLE
--
-- Current state after migration 006:
--   "Staff see template blocks"    FOR SELECT -- all staff, no status filter
--   "Staff manage template blocks" FOR ALL    -- all staff manage (too broad)
--
-- Replacement:
--   Keep the SELECT policy for staff -- status-awareness cascades automatically
--   from the templates RLS changes in Section 1. When a coach queries
--   template_blocks, the inner subquery on templates returns only ready
--   templates (due to templates RLS), so coaches implicitly see only blocks
--   for ready templates without an explicit status check here.
--
--   Replace the FOR ALL manage policy with a director/head-only manage policy.
-- ============================================================

-- Remove the overly broad manage policy.
-- The SELECT policy "Staff see template blocks" is KEPT unchanged --
-- status-awareness inherits from templates RLS automatically.
DROP POLICY IF EXISTS "Staff manage template blocks" ON template_blocks;

-- Directors and head_coaches can create, edit, and delete template blocks.
-- Coaches do not manage template structure -- they execute sessions.
-- The join to templates ensures blocks can only be managed within the
-- caller's academy (no cross-academy manipulation).
CREATE POLICY "Directors manage template blocks"
  ON template_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM templates t
      WHERE t.id = template_blocks.template_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_director_or_head()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates t
      WHERE t.id = template_blocks.template_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_director_or_head()
    )
  );


-- ============================================================
-- SECTION 3: TEMPLATE_BLOCK_EXERCISES TABLE
--
-- Current state after migration 058 (supersedes 055):
--   "Staff see template block exercises"    FOR SELECT  -- all staff
--   "Staff insert template block exercises" FOR INSERT  -- all staff (too broad)
--   "Staff update template block exercises" FOR UPDATE  -- all staff (too broad)
--   "Staff delete template block exercises" FOR DELETE  -- all staff (too broad)
--
-- Replacement:
--   Keep SELECT as-is -- status cascades from templates through template_blocks.
--   Replace INSERT / UPDATE / DELETE with director/head-only variants.
-- ============================================================

-- Remove overly broad mutation policies.
-- SELECT ("Staff see template block exercises") is KEPT unchanged.
DROP POLICY IF EXISTS "Staff insert template block exercises" ON template_block_exercises;
DROP POLICY IF EXISTS "Staff update template block exercises" ON template_block_exercises;
DROP POLICY IF EXISTS "Staff delete template block exercises" ON template_block_exercises;

-- Directors and head_coaches can INSERT exercises into template blocks.
-- The join chain (template_block_exercises -> template_blocks -> templates)
-- scopes access to blocks within the caller's academy only.
CREATE POLICY "Directors insert template block exercises"
  ON template_block_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_director_or_head()
    )
  );

-- Directors and head_coaches can UPDATE exercises within template blocks.
CREATE POLICY "Directors update template block exercises"
  ON template_block_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_director_or_head()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_director_or_head()
    )
  );

-- Directors and head_coaches can DELETE exercises from template blocks.
CREATE POLICY "Directors delete template block exercises"
  ON template_block_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_director_or_head()
    )
  );


-- ============================================================
-- SECTION 4: CURRICULUM_CLASS_TEMPLATE_BLOCKS TABLE
--
-- Current state after migration 062:
--   "Staff see curriculum class template blocks"    FOR SELECT  -- all staff
--   "Directors manage curriculum class template blocks" FOR ALL -- director/head
--
-- Assessment:
--   These policies are already correctly scoped.
--   "Directors manage" already restricts mutations to auth_is_director_or_head().
--   "Staff see" allows coaches to read class template block guidance --
--   appropriate for session execution context.
--   Status-awareness cascades automatically: the SELECT subquery filters
--   template_id through templates RLS, so coaches see only blocks for
--   ready class templates.
--
-- No policy changes needed. Documented here for completeness.
-- ============================================================

-- No DROP or CREATE statements for curriculum_class_template_blocks.
-- Existing policies from migration 062 remain in effect:
--   "Staff see curriculum class template blocks"          -- coach read: OK
--   "Directors manage curriculum class template blocks"   -- director/head write: OK


-- ============================================================
-- SECTION 5: TEMPLATE_REVIEW_REQUESTS TABLE
--
-- Current state after migration 067:
--   "Directors see template review requests"   FOR SELECT -- director/head
--   "Directors submit template review requests" FOR INSERT -- director/head
--   "Directors review template requests"       FOR UPDATE -- director only
--
-- Assessment:
--   These policies are already correctly scoped per the product rule:
--   director approves, head_coach may submit, no coach/parent/player access.
--
-- No policy changes needed. Documented here for completeness.
-- ============================================================

-- No DROP or CREATE statements for template_review_requests.
-- Existing policies from migration 067 remain in effect.


-- ============================================================
-- SECTION 6: TEMPLATE_VERSION_HISTORY TABLE
--
-- Current state after migration 067:
--   "Directors see template version history"    FOR SELECT -- director/head
--   "Directors insert template version history" FOR INSERT -- director only
--   No UPDATE or DELETE policies (append-only enforcement by absence).
--
-- Assessment:
--   Correctly scoped and intentionally append-only.
--
-- No policy changes needed. Documented here for completeness.
-- ============================================================

-- No DROP or CREATE statements for template_version_history.
-- Existing policies from migration 067 remain in effect.


-- ============================================================
-- SECTION 7: POLICY INVENTORY AFTER THIS MIGRATION
--
-- templates:
--   SELECT "Directors see all templates"  -- director, head_coach: all statuses
--   SELECT "Coaches see ready templates"  -- coach: status='ready' only
--   SELECT "Creators see own templates"   -- any staff: own created_by rows
--   INSERT "Directors insert templates"   -- director, head_coach
--   UPDATE "Directors update templates"   -- director, head_coach; status='ready' director-only via WITH CHECK
--   DELETE "Directors delete templates"   -- director only
--
-- template_blocks:
--   SELECT "Staff see template blocks"    -- all staff (status cascades from templates)
--   ALL    "Directors manage template blocks" -- director, head_coach
--
-- template_block_exercises:
--   SELECT "Staff see template block exercises"    -- all staff (status cascades)
--   INSERT "Directors insert template block exercises" -- director, head_coach
--   UPDATE "Directors update template block exercises" -- director, head_coach
--   DELETE "Directors delete template block exercises" -- director, head_coach
--
-- curriculum_class_template_blocks:
--   SELECT "Staff see curriculum class template blocks"        -- all staff (status cascades)
--   ALL    "Directors manage curriculum class template blocks" -- director, head_coach
--
-- template_review_requests (from 067, unchanged):
--   SELECT "Directors see template review requests"   -- director, head_coach
--   INSERT "Directors submit template review requests" -- director, head_coach
--   UPDATE "Directors review template requests"       -- director only
--
-- template_version_history (from 067, unchanged):
--   SELECT "Directors see template version history"    -- director, head_coach
--   INSERT "Directors insert template version history" -- director only
--   (no UPDATE, no DELETE -- append-only)
--
-- parent / player: NO access to any template table.
-- coach: SELECT on ready templates and own-created-by rows only.
--        No INSERT / UPDATE / DELETE on any template table directly.
-- ============================================================
