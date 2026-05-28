-- Migration 038: Curriculum Mappings + Views
-- Stable replacement version

-- ──────────────────────────────────────────────
-- CLEAN EXISTING OBJECTS
-- ──────────────────────────────────────────────

DROP VIEW IF EXISTS v_curriculum_overview;
DROP VIEW IF EXISTS v_player_curriculum_detail;
DROP VIEW IF EXISTS v_curriculum_level_requirements;

DROP FUNCTION IF EXISTS get_default_curriculum_level();
DROP FUNCTION IF EXISTS assign_player_curriculum_state(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS evaluate_player_curriculum_advancement(UUID, UUID);

-- ──────────────────────────────────────────────
-- VIEW: v_curriculum_overview
-- Director dashboard-safe curriculum view
-- NOTE: display_name uses player_id text to avoid relying on nonexistent players.display_name
-- ──────────────────────────────────────────────

CREATE OR REPLACE VIEW v_curriculum_overview AS
SELECT
  pcs.id AS curriculum_state_id,
  pcs.player_id,
  pcs.academy_id,
  pcs.player_id::text AS display_name,
  pcs.current_level_id,
  cl.display_name AS level_name,
  cl.level_number,
  cl.stage,
  cs.display_name AS stage_name,
  cs.sort_order AS stage_sort_order,
  cl.sort_order AS level_sort_order,
  pcs.advancement_eligible,
  pcs.advancement_blocked_by,
  pcs.last_evaluated_at,
  pcs.created_at,
  pcs.updated_at
FROM player_curriculum_states pcs
JOIN curriculum_levels cl
  ON pcs.current_level_id = cl.id
JOIN curriculum_stages cs
  ON cl.stage = cs.stage;

-- ──────────────────────────────────────────────
-- VIEW: v_player_curriculum_detail
-- Player profile curriculum detail
-- ──────────────────────────────────────────────

CREATE OR REPLACE VIEW v_player_curriculum_detail AS
SELECT
  pcs.player_id,
  pcs.academy_id,
  pcs.current_level_id,
  cl.display_name AS current_level_name,
  cl.stage,
  cs.display_name AS stage_name,
  pcs.advancement_eligible,
  pcs.advancement_blocked_by,
  pcs.last_evaluated_at,
  pdp.domain,
  pdp.status,
  pdp.outcome_count,
  pdp.positive_outcome_count,
  pdp.mastered_at,
  pdp.regression_detected_at,
  sp.description AS progression_description,
  sp.success_criteria,
  sp.failure_patterns,
  sp.signal_indicators,
  sp.outcome_confirmations,
  sp.domain_weight,
  sp.mastery_outcome_threshold
FROM player_curriculum_states pcs
JOIN curriculum_levels cl
  ON pcs.current_level_id = cl.id
JOIN curriculum_stages cs
  ON cl.stage = cs.stage
LEFT JOIN player_domain_progress pdp
  ON pdp.player_id = pcs.player_id
 AND pdp.academy_id = pcs.academy_id
 AND pdp.level_id = pcs.current_level_id
LEFT JOIN skill_progressions sp
  ON sp.level_id = pcs.current_level_id
 AND sp.domain = pdp.domain;

-- ──────────────────────────────────────────────
-- VIEW: v_curriculum_level_requirements
-- Advancement rules by level
-- ──────────────────────────────────────────────

CREATE OR REPLACE VIEW v_curriculum_level_requirements AS
SELECT
  cl.id AS level_id,
  cl.stage,
  cs.display_name AS stage_name,
  cl.level_number,
  cl.display_name AS level_name,
  cl.sort_order,
  pr.min_total_outcomes,
  pr.min_domains_mastered,
  pr.min_assessment_score,
  pr.blocking_signal_types,
  pr.min_weeks_at_level,
  pr.requires_final_assessment,
  pr.requires_director_approval
FROM curriculum_levels cl
JOIN curriculum_stages cs
  ON cl.stage = cs.stage
LEFT JOIN progression_rules pr
  ON pr.level_id = cl.id;

-- ──────────────────────────────────────────────
-- FUNCTION: get_default_curriculum_level
-- Returns Red 1 / first curriculum level
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_default_curriculum_level()
RETURNS UUID AS $$
DECLARE
  v_level_id UUID;
BEGIN
  SELECT id
  INTO v_level_id
  FROM curriculum_levels
  ORDER BY sort_order ASC
  LIMIT 1;

  RETURN v_level_id;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────
-- FUNCTION: assign_player_curriculum_state
-- Creates or updates player curriculum placement
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION assign_player_curriculum_state(
  p_player_id UUID,
  p_academy_id UUID,
  p_level_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_level_id UUID;
  v_state_id UUID;
BEGIN
  v_level_id := COALESCE(p_level_id, get_default_curriculum_level());

  INSERT INTO player_curriculum_states (
    player_id,
    academy_id,
    current_level_id,
    enrolled_at,
    advancement_eligible,
    notes
  )
  VALUES (
    p_player_id,
    p_academy_id,
    v_level_id,
    now(),
    false,
    'Initial curriculum placement'
  )
  ON CONFLICT (player_id, academy_id)
  DO UPDATE SET
    current_level_id = EXCLUDED.current_level_id,
    last_evaluated_at = now(),
    advancement_eligible = false,
    updated_at = now()
  RETURNING id INTO v_state_id;

  INSERT INTO player_domain_progress (
    player_id,
    academy_id,
    level_id,
    domain,
    status
  )
  SELECT
    p_player_id,
    p_academy_id,
    v_level_id,
    sd.domain,
    'not_started'
  FROM skill_domains sd
  ON CONFLICT (player_id, level_id, domain)
  DO NOTHING;

  RETURN v_state_id;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────
-- FUNCTION: evaluate_player_curriculum_advancement
-- Lightweight rules-based advancement check
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION evaluate_player_curriculum_advancement(
  p_player_id UUID,
  p_academy_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_level_id UUID;
  v_min_domains INT;
  v_domains_mastered INT;
  v_is_eligible BOOLEAN;
BEGIN
  SELECT current_level_id
  INTO v_level_id
  FROM player_curriculum_states
  WHERE player_id = p_player_id
    AND academy_id = p_academy_id;

  IF v_level_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT COALESCE(min_domains_mastered, 5)
  INTO v_min_domains
  FROM progression_rules
  WHERE level_id = v_level_id;

  SELECT COUNT(*)
  INTO v_domains_mastered
  FROM player_domain_progress
  WHERE player_id = p_player_id
    AND academy_id = p_academy_id
    AND level_id = v_level_id
    AND status = 'complete';

  v_is_eligible := v_domains_mastered >= COALESCE(v_min_domains, 5);

  UPDATE player_curriculum_states
  SET
    advancement_eligible = v_is_eligible,
    last_evaluated_at = now(),
    updated_at = now()
  WHERE player_id = p_player_id
    AND academy_id = p_academy_id;

  RETURN v_is_eligible;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────
-- DONE
-- ──────────────────────────────────────────────