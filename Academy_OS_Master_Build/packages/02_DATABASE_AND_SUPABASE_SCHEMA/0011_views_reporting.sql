-- ============================================================
-- ACADEMY OS — MIGRATION 0011: VIEWS & REPORTING
-- Read-optimized views for the frontend and reporting.
-- All views are academy-scoped. RLS on base tables still applies.
-- ============================================================

-- ============================================================
-- v_player_summary
-- Complete player overview including current placement and scores.
-- Used in: player list, group overview, director dashboard.
-- ============================================================
CREATE OR REPLACE VIEW v_player_summary AS
SELECT
  p.id,
  p.academy_id,
  p.first_name,
  p.last_name,
  p.full_name,
  p.date_of_birth,
  DATE_PART('year', AGE(p.date_of_birth))::INTEGER AS age,
  p.gender,
  p.handedness,
  p.status,
  p.current_track,
  p.last_assessed_at,
  p.next_assessment_due,
  CASE
    WHEN p.next_assessment_due IS NULL THEN false
    WHEN p.next_assessment_due < CURRENT_DATE THEN true
    ELSE false
  END AS is_overdue,
  CASE
    WHEN p.next_assessment_due IS NULL THEN NULL
    ELSE (p.next_assessment_due - CURRENT_DATE)
  END AS days_until_assessment,

  -- Current group
  g.id        AS group_id,
  g.name      AS group_name,

  -- Current level
  al.id       AS level_id,
  al.label    AS level_label,
  al.level_number,

  -- Current scores
  pp.technical_score,
  pp.tactical_score,
  pp.movement_score,
  pp.competition_score,
  pp.behavioral_score,
  pp.overall_score,

  -- Baseline scores
  pp.baseline_technical,
  pp.baseline_tactical,
  pp.baseline_movement,
  pp.baseline_competition,
  pp.baseline_behavioral,
  pp.baseline_overall,

  -- Score deltas (current - baseline)
  ROUND(pp.technical_score   - pp.baseline_technical,   2) AS delta_technical,
  ROUND(pp.tactical_score    - pp.baseline_tactical,    2) AS delta_tactical,
  ROUND(pp.movement_score    - pp.baseline_movement,    2) AS delta_movement,
  ROUND(pp.competition_score - pp.baseline_competition, 2) AS delta_competition,
  ROUND(pp.behavioral_score  - pp.baseline_behavioral,  2) AS delta_behavioral,

  pp.promotion_ready,
  pp.focus_areas,

  -- Primary coach
  pr.display_name AS primary_coach_name,

  p.join_date,
  p.created_at

FROM players p
LEFT JOIN groups g ON g.id = p.current_group_id
LEFT JOIN academy_levels al ON al.id = p.current_level_id
LEFT JOIN player_progression pp ON pp.player_id = p.id
LEFT JOIN profiles pr ON pr.id = p.primary_coach_id
WHERE p.is_active = true;

-- ============================================================
-- v_group_summary
-- Group stats including player counts and coach assignments.
-- Used in: director dashboard, group management screen.
-- ============================================================
CREATE OR REPLACE VIEW v_group_summary AS
SELECT
  g.id,
  g.academy_id,
  g.name,
  g.track,
  g.max_players,
  g.is_active,

  -- Level
  al.label        AS level_label,
  al.level_number,

  -- Player counts
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active')              AS active_players,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'reassessment_due')    AS reassessment_due_count,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'pending_placement')   AS pending_placement_count,
  COUNT(DISTINCT p.id)                                                   AS total_players,

  -- Capacity
  CASE
    WHEN g.max_players IS NULL THEN NULL
    ELSE ROUND((COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active'))::NUMERIC / g.max_players * 100)
  END AS capacity_pct,

  -- Lead coach
  STRING_AGG(
    DISTINCT pr.display_name,
    ', ' ORDER BY pr.display_name
  ) FILTER (WHERE cga.role = 'lead') AS lead_coaches,

  g.created_at

FROM groups g
LEFT JOIN academy_levels al ON al.id = g.level_id
LEFT JOIN players p ON p.current_group_id = g.id AND p.is_active = true
LEFT JOIN coach_group_assignments cga ON cga.group_id = g.id AND cga.is_active = true
LEFT JOIN profiles pr ON pr.id = cga.coach_id
WHERE g.is_active = true
GROUP BY g.id, g.academy_id, g.name, g.track, g.max_players, g.is_active,
         al.label, al.level_number, g.created_at;

-- ============================================================
-- v_reassessment_pipeline
-- Players who are overdue or due within 14 days.
-- Used in: director dashboard, reassessment queue.
-- ============================================================
CREATE OR REPLACE VIEW v_reassessment_pipeline AS
SELECT
  p.id AS player_id,
  p.academy_id,
  p.full_name,
  p.current_track,
  p.last_assessed_at,
  p.next_assessment_due,
  (p.next_assessment_due - CURRENT_DATE) AS days_until_due,
  CASE
    WHEN p.next_assessment_due < CURRENT_DATE THEN 'overdue'
    WHEN p.next_assessment_due <= CURRENT_DATE + INTERVAL '14 days' THEN 'due_soon'
    ELSE 'upcoming'
  END AS urgency,
  g.name    AS group_name,
  pr.display_name AS coach_name
FROM players p
LEFT JOIN groups g ON g.id = p.current_group_id
LEFT JOIN profiles pr ON pr.id = p.primary_coach_id
WHERE
  p.is_active = true
  AND p.status IN ('active', 'reassessment_due')
  AND p.next_assessment_due IS NOT NULL
  AND p.next_assessment_due <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY p.next_assessment_due ASC;

-- ============================================================
-- v_session_load
-- Per-session load breakdown by type: skill, competition, fitness.
-- Flags overload when all three are intensity >= 4 in the same week.
-- Used in: session builder, load management view.
-- ============================================================
CREATE OR REPLACE VIEW v_session_load AS
SELECT
  s.id          AS session_id,
  s.academy_id,
  s.scheduled_date,
  DATE_TRUNC('week', s.scheduled_date) AS week_start,
  s.group_id,
  g.name        AS group_name,
  s.coach_id,

  -- Average intensity per block type
  AVG(sb.intensity) FILTER (WHERE sb.type IN ('technical', 'tactical'))   AS skill_intensity_avg,
  AVG(sb.intensity) FILTER (WHERE sb.type = 'competition')                AS competition_intensity_avg,
  AVG(sb.intensity) FILTER (WHERE sb.type IN ('fitness', 'movement'))     AS fitness_intensity_avg,

  -- Overload flag: all three dimensions at intensity >= 4
  CASE
    WHEN AVG(sb.intensity) FILTER (WHERE sb.type IN ('technical', 'tactical')) >= 4
     AND AVG(sb.intensity) FILTER (WHERE sb.type = 'competition')                >= 4
     AND AVG(sb.intensity) FILTER (WHERE sb.type IN ('fitness', 'movement'))     >= 4
    THEN true
    ELSE false
  END AS is_overload,

  s.status,
  s.duration_min

FROM sessions s
LEFT JOIN session_blocks sb ON sb.session_id = s.id
LEFT JOIN groups g ON g.id = s.group_id
WHERE s.status != 'cancelled'
GROUP BY s.id, s.academy_id, s.scheduled_date, s.group_id, g.name, s.coach_id, s.status, s.duration_min;

-- ============================================================
-- v_pending_proposed_actions
-- Proposed actions awaiting director review.
-- Used in: director dashboard notification panel.
-- ============================================================
CREATE OR REPLACE VIEW v_pending_proposed_actions AS
SELECT
  pa.id,
  pa.academy_id,
  pa.action_type,
  pa.action_label,
  pa.target_module,
  pa.risk_level,
  pa.affected_count,
  pa.status,
  pa.expires_at,
  pa.created_at,
  (pa.expires_at < NOW()) AS is_expired,
  pr.display_name AS proposed_by_name,
  vc.raw_input    AS original_command
FROM proposed_actions pa
LEFT JOIN profiles pr ON pr.id = pa.proposed_by_id
LEFT JOIN voice_commands vc ON vc.id = pa.voice_command_id
WHERE pa.status = 'pending_review'
ORDER BY
  CASE pa.risk_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
  pa.created_at ASC;

-- ============================================================
-- v_recent_audit_log
-- Last 200 audit events for director activity feed.
-- ============================================================
CREATE OR REPLACE VIEW v_recent_audit_log AS
SELECT
  al.id,
  al.academy_id,
  al.action,
  al.target_type,
  al.target_id,
  al.target_label,
  al.source_type,
  al.created_at,
  pr.display_name AS actor_name,
  al.actor_role
FROM audit_logs al
LEFT JOIN profiles pr ON pr.id = al.actor_id
ORDER BY al.created_at DESC
LIMIT 200;
