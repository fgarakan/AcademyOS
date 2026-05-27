-- ============================================================
-- ACADEMY OS — MIGRATION 069: EXECUTE CURRICULUM OVERRIDE
--
-- Creates execute_curriculum_override(), the ONLY function that
-- applies an approved academy_curriculum_overrides row to the
-- curriculum content layer.
--
-- Architecture invariants (from CURRICULUM_INTELLIGENCE_LOOP.md
-- and ACADEMY_CURRICULUM_CLONE_ARCHITECTURE.md):
--   • DONNA proposes → director approves → this function executes.
--   • Global curriculum (academy_id IS NULL) is NEVER mutated.
--   • Academy deltas live in academy_curriculum_overrides only.
--   • Every execution is recorded in audit_logs.
--   • Only approved overrides can be executed.
--   • Only academy directors and head coaches can call this function.
--
-- V1 scope:
--   target_type = 'content_item' — add / update / remove
--   All other target_types raise a clear deferred exception.
--   Expand in future migrations as each loop is implemented.
--
-- Sprint: 900 — Curriculum Override Execution Migration V1
-- Related: MIGRATION_READINESS_CURRICULUM_TABLES_AUDIT_899.md
--          CURRICULUM_INTELLIGENCE_LOOP.md (Loops 1–3)
--          ACADEMY_CURRICULUM_CLONE_ARCHITECTURE.md
--          supabase/migrations/048_academy_curriculum_clone.sql
-- ============================================================


-- ============================================================
-- FUNCTION: execute_curriculum_override()
--
-- Signature:
--   execute_curriculum_override(
--     p_override_id UUID   -- academy_curriculum_overrides.id to execute
--     p_executor_id UUID   -- profiles.id of the director executing
--   ) RETURNS JSONB
--
-- Returns:
--   { "success": true,  "override_id": "...", "result": { ... } }
--   { "success": false, "error": "..." }
--
-- Execution path (the only valid path for curriculum mutations):
--   createCurriculumDrillDraft()          → INSERT academy_curriculum_overrides (status='pending_review')
--   Director reviews draft in UI          → UPDATE status='approved'
--   Director clicks Approve + Execute     → execute_curriculum_override() called
--   Function applies to curriculum tables → UPDATE status='applied'
--   Audit log written                     → audit_logs entry
--
-- SECURITY DEFINER: runs as function owner, bypasses RLS.
-- Academy scope and role gate are enforced EXPLICITLY using
-- p_executor_id (not auth.uid()) for SECURITY DEFINER safety.
-- ============================================================

CREATE OR REPLACE FUNCTION execute_curriculum_override(
  p_override_id UUID,
  p_executor_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_override    academy_curriculum_overrides%ROWTYPE;
  v_change      JSONB;
  v_result      JSONB;
  v_new_id      UUID;
  v_audit_src   TEXT;
BEGIN

  -- ── Step 1: Lock and fetch the override row ─────────────────
  SELECT * INTO v_override
  FROM academy_curriculum_overrides
  WHERE id = p_override_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Curriculum override not found: %', p_override_id;
  END IF;

  -- ── Step 2: Status guard — must be approved ─────────────────
  IF v_override.status != 'approved' THEN
    RAISE EXCEPTION
      'Override must be in approved status before execution. Current status: %',
      v_override.status;
  END IF;

  -- ── Step 3: Role + academy scope guard ──────────────────────
  -- Explicit membership check against p_executor_id (not auth.uid())
  -- for safety inside a SECURITY DEFINER function.
  IF NOT EXISTS (
    SELECT 1
    FROM academy_memberships
    WHERE profile_id = p_executor_id
      AND academy_id = v_override.academy_id
      AND role IN ('academy_director', 'head_coach')
      AND is_active = true
  ) THEN
    RAISE EXCEPTION
      'Executor % does not have director or head coach access to academy %.',
      p_executor_id, v_override.academy_id;
  END IF;

  -- ── Step 4: Global spine guard ──────────────────────────────
  -- Double-check: we must never reach a global object via an
  -- 'update' or 'remove' override. The 'add' path always creates
  -- academy-owned rows (academy_id NOT NULL). Enforced per branch.
  -- (Also enforced by branch-level academy_id checks below.)

  v_change := v_override.proposed_change;

  -- Map override source to audit_logs source_type
  -- audit_logs.source_type CHECK: 'ui' | 'voice' | 'api' | 'system'
  -- academy_curriculum_overrides.source: 'voice' | 'typed' | 'ui'
  v_audit_src := CASE v_override.source
    WHEN 'voice'  THEN 'voice'
    WHEN 'typed'  THEN 'ui'
    WHEN 'ui'     THEN 'ui'
    ELSE               'ui'
  END;

  -- ── Step 5: Dispatch by target_type + override_type ─────────

  CASE v_override.target_type

    -- ── target_type: content_item ────────────────────────────
    --
    -- Maps to curriculum_content_items:
    --   academy_id IS NULL  → global default (never mutated here)
    --   academy_id NOT NULL → academy-specific content (safe to write)
    --
    WHEN 'content_item' THEN

      CASE v_override.override_type

        -- ── add: create new academy-owned content item ────────
        --
        -- proposed_change must include:
        --   level_id       UUID   (curriculum_levels.id)
        --   content_type   TEXT   (drill / game / skill / assessment /
        --                          warmup / cooldown / fitness /
        --                          tactical / competition)
        --   title          TEXT   (required, max descriptive name)
        --
        -- Optional in proposed_change:
        --   description    TEXT
        --   pathway        TEXT   (skill / competition / fitness / mixed)
        --   duration_min   INT
        --   duration_max   INT
        --   difficulty     INT    (1–5)
        --   intensity      INT    (1–10)
        --   coach_cues     TEXT[] (JSON array)
        --   success_criteria TEXT[]
        --   progressions   TEXT[]
        --   regressions    TEXT[]
        --   court_setup    TEXT
        --
        -- Immutable: source_type = 'academy_custom', academy_id = override.academy_id
        --
        WHEN 'add' THEN

          IF v_change->>'level_id' IS NULL THEN
            RAISE EXCEPTION 'content_item add requires level_id in proposed_change.';
          END IF;
          IF v_change->>'content_type' IS NULL THEN
            RAISE EXCEPTION 'content_item add requires content_type in proposed_change.';
          END IF;
          IF v_change->>'title' IS NULL THEN
            RAISE EXCEPTION 'content_item add requires title in proposed_change.';
          END IF;

          INSERT INTO curriculum_content_items (
            academy_id,
            source_type,
            content_type,
            pathway,
            level_id,
            title,
            description,
            duration_min,
            duration_max,
            difficulty,
            intensity,
            coach_cues,
            success_criteria,
            progressions,
            regressions,
            court_setup,
            is_active,
            created_by
          ) VALUES (
            v_override.academy_id,
            'academy_custom',
            v_change->>'content_type',
            COALESCE(v_change->>'pathway', 'skill'),
            (v_change->>'level_id')::UUID,
            v_change->>'title',
            v_change->>'description',
            CASE WHEN v_change ? 'duration_min'
              THEN (v_change->>'duration_min')::INTEGER ELSE NULL END,
            CASE WHEN v_change ? 'duration_max'
              THEN (v_change->>'duration_max')::INTEGER ELSE NULL END,
            CASE WHEN v_change ? 'difficulty'
              THEN (v_change->>'difficulty')::INTEGER ELSE NULL END,
            CASE WHEN v_change ? 'intensity'
              THEN (v_change->>'intensity')::INTEGER ELSE NULL END,
            CASE WHEN v_change ? 'coach_cues'
              THEN ARRAY(SELECT jsonb_array_elements_text(v_change->'coach_cues'))
              ELSE NULL END,
            CASE WHEN v_change ? 'success_criteria'
              THEN ARRAY(SELECT jsonb_array_elements_text(v_change->'success_criteria'))
              ELSE NULL END,
            CASE WHEN v_change ? 'progressions'
              THEN ARRAY(SELECT jsonb_array_elements_text(v_change->'progressions'))
              ELSE NULL END,
            CASE WHEN v_change ? 'regressions'
              THEN ARRAY(SELECT jsonb_array_elements_text(v_change->'regressions'))
              ELSE NULL END,
            v_change->>'court_setup',
            true,
            p_executor_id
          ) RETURNING id INTO v_new_id;

          v_result := jsonb_build_object(
            'action',           'content_item.added',
            'content_item_id',  v_new_id,
            'level_id',         v_change->>'level_id',
            'content_type',     v_change->>'content_type',
            'title',            v_change->>'title'
          );

        -- ── update: modify fields on an academy-owned item ────
        --
        -- proposed_change may include any subset of:
        --   title, description, pathway, duration_min, duration_max,
        --   difficulty, intensity, coach_cues, success_criteria,
        --   progressions, regressions, court_setup
        --
        -- BLOCKED: target must be academy-owned (academy_id NOT NULL).
        -- Global content items (academy_id IS NULL) are read-only.
        --
        WHEN 'update' THEN

          IF v_override.target_id IS NULL THEN
            RAISE EXCEPTION 'content_item update requires target_id in override row.';
          END IF;

          -- Global spine protection: abort if the target is a global item
          IF NOT EXISTS (
            SELECT 1 FROM curriculum_content_items
            WHERE id = v_override.target_id
              AND academy_id = v_override.academy_id
          ) THEN
            RAISE EXCEPTION
              'content_item % is not owned by academy % or does not exist. '
              'Global curriculum items (academy_id IS NULL) cannot be mutated. '
              'Use override_type=add to create an academy-custom replacement.',
              v_override.target_id, v_override.academy_id;
          END IF;

          UPDATE curriculum_content_items SET
            title            = COALESCE(v_change->>'title', title),
            description      = COALESCE(v_change->>'description', description),
            pathway          = COALESCE(v_change->>'pathway', pathway),
            duration_min     = COALESCE(
              CASE WHEN v_change ? 'duration_min'
                THEN (v_change->>'duration_min')::INTEGER ELSE NULL END,
              duration_min
            ),
            duration_max     = COALESCE(
              CASE WHEN v_change ? 'duration_max'
                THEN (v_change->>'duration_max')::INTEGER ELSE NULL END,
              duration_max
            ),
            difficulty       = COALESCE(
              CASE WHEN v_change ? 'difficulty'
                THEN (v_change->>'difficulty')::INTEGER ELSE NULL END,
              difficulty
            ),
            intensity        = COALESCE(
              CASE WHEN v_change ? 'intensity'
                THEN (v_change->>'intensity')::INTEGER ELSE NULL END,
              intensity
            ),
            coach_cues       = COALESCE(
              CASE WHEN v_change ? 'coach_cues'
                THEN ARRAY(SELECT jsonb_array_elements_text(v_change->'coach_cues'))
                ELSE NULL END,
              coach_cues
            ),
            success_criteria = COALESCE(
              CASE WHEN v_change ? 'success_criteria'
                THEN ARRAY(SELECT jsonb_array_elements_text(v_change->'success_criteria'))
                ELSE NULL END,
              success_criteria
            ),
            progressions     = COALESCE(
              CASE WHEN v_change ? 'progressions'
                THEN ARRAY(SELECT jsonb_array_elements_text(v_change->'progressions'))
                ELSE NULL END,
              progressions
            ),
            regressions      = COALESCE(
              CASE WHEN v_change ? 'regressions'
                THEN ARRAY(SELECT jsonb_array_elements_text(v_change->'regressions'))
                ELSE NULL END,
              regressions
            ),
            court_setup      = COALESCE(v_change->>'court_setup', court_setup),
            updated_at       = NOW()
          WHERE id           = v_override.target_id
            AND academy_id   = v_override.academy_id;

          v_result := jsonb_build_object(
            'action',          'content_item.updated',
            'content_item_id', v_override.target_id
          );

        -- ── remove: soft-delete an academy-owned item ─────────
        --
        -- Sets is_active = false. The item row is preserved for
        -- audit trail. Resolution engine excludes inactive items.
        --
        -- BLOCKED: global items cannot be removed. Only academy-owned
        -- items (academy_id = override.academy_id) may be deactivated.
        -- To suppress a global item in the academy view, use
        -- override_type='emphasis_shift' (future sprint).
        --
        WHEN 'remove' THEN

          IF v_override.target_id IS NULL THEN
            RAISE EXCEPTION 'content_item remove requires target_id in override row.';
          END IF;

          -- Global spine protection
          IF NOT EXISTS (
            SELECT 1 FROM curriculum_content_items
            WHERE id = v_override.target_id
              AND academy_id = v_override.academy_id
          ) THEN
            RAISE EXCEPTION
              'content_item % is not owned by academy % or does not exist. '
              'Global curriculum items (academy_id IS NULL) cannot be removed. '
              'Only academy-custom items (created by this academy) can be deactivated.',
              v_override.target_id, v_override.academy_id;
          END IF;

          UPDATE curriculum_content_items SET
            is_active  = false,
            updated_at = NOW()
          WHERE id       = v_override.target_id
            AND academy_id = v_override.academy_id;

          v_result := jsonb_build_object(
            'action',          'content_item.deactivated',
            'content_item_id', v_override.target_id
          );

        -- ── replace / emphasis_shift: deferred ────────────────
        ELSE
          RAISE EXCEPTION
            'override_type "%" for content_item is not yet handled in V1. '
            'Supported: add, update, remove. '
            'Implement replace and emphasis_shift in a future sprint.',
            v_override.override_type;
      END CASE;

    -- ── All other target_types: deferred ────────────────────────
    --
    -- These are noted in MIGRATION_READINESS_CURRICULUM_TABLES_AUDIT_899.md
    -- as Sprint 900+ work. Raise a clear, actionable error so callers
    -- know exactly what to implement next.
    --
    WHEN 'level' THEN
      RAISE EXCEPTION
        'target_type "level" is not yet handled by execute_curriculum_override(). '
        'Implement level description overrides in a future sprint (Loop 1).';

    WHEN 'requirement' THEN
      RAISE EXCEPTION
        'target_type "requirement" is not yet handled by execute_curriculum_override(). '
        'Implement requirement overrides after the curriculum requirement tables are fully live.';

    WHEN 'mapping' THEN
      RAISE EXCEPTION
        'target_type "mapping" is not yet handled by execute_curriculum_override(). '
        'Implement content-to-requirement mapping overrides in a future sprint.';

    WHEN 'template_rule' THEN
      RAISE EXCEPTION
        'target_type "template_rule" is not yet handled by execute_curriculum_override(). '
        'Implement template rule overrides after the template-curriculum wiring sprint.';

    ELSE
      RAISE EXCEPTION
        'Unknown target_type "%". Valid values: content_item, level, requirement, mapping, template_rule.',
        v_override.target_type;
  END CASE;

  -- ── Step 6: Mark override as applied ────────────────────────
  UPDATE academy_curriculum_overrides SET
    status         = 'applied',
    applied_by     = p_executor_id,
    applied_at     = NOW(),
    applied_change = v_result,
    updated_at     = NOW()
  WHERE id = p_override_id;

  -- ── Step 7: Write audit log ──────────────────────────────────
  PERFORM write_audit_log(
    p_academy_id   => v_override.academy_id,
    p_actor_id     => p_executor_id,
    p_action       => 'curriculum_override.applied',
    p_target_type  => 'academy_curriculum_overrides',
    p_target_id    => p_override_id,
    p_payload      => jsonb_build_object(
      'target_type',   v_override.target_type,
      'override_type', v_override.override_type,
      'source',        v_override.source,
      'result',        v_result
    ),
    p_source_type  => v_audit_src
  );

  RETURN jsonb_build_object(
    'success',     true,
    'override_id', p_override_id,
    'result',      v_result
  );

-- ── Exception handler ──────────────────────────────────────────
-- Runs inside a savepoint — the INSERT below persists even if the
-- main transaction was rolled back. Matches the pattern used in
-- execute_approved_action() (migration 009).
EXCEPTION WHEN OTHERS THEN

  -- Direct INSERT into audit_logs (not via write_audit_log()) to
  -- avoid nested exception risk. actor_role left NULL — acceptable
  -- for failure records.
  INSERT INTO audit_logs (
    academy_id, actor_id, action,
    target_type, target_id,
    payload, source_type
  ) VALUES (
    COALESCE(v_override.academy_id, '00000000-0000-0000-0000-000000000000'::UUID),
    p_executor_id,
    'curriculum_override.apply_failed',
    'academy_curriculum_overrides',
    p_override_id,
    jsonb_build_object(
      'error',       SQLERRM,
      'override_id', p_override_id
    ),
    'system'
  );

  RETURN jsonb_build_object(
    'success', false,
    'error',   SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- COMMENT
-- Documents the function for Supabase Dashboard inspection.
-- ============================================================
COMMENT ON FUNCTION execute_curriculum_override(UUID, UUID) IS
  'Applies an approved academy_curriculum_overrides row to the curriculum content tables. '
  'V1 handles target_type=content_item (add/update/remove) only. '
  'SECURITY DEFINER — bypasses RLS. Academy scope and director role '
  'are enforced via explicit academy_memberships check. '
  'Global curriculum (academy_id IS NULL) is never mutated. '
  'All executions write to audit_logs. '
  'Sprint 900 — expand in future sprints for level/requirement/mapping/template_rule target types.';


-- ============================================================
-- NO RLS changes in this migration.
-- No new tables created — function only.
-- Existing RLS on academy_curriculum_overrides (migration 048)
-- and curriculum_content_items (migration 045) is unchanged.
-- ============================================================
