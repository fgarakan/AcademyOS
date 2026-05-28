-- ============================================================
-- ACADEMY OS — MIGRATION 013: REPORTING VIEWS
-- Read-only views for dashboards and reports.
-- All views are scoped by the RLS of their base tables.
-- ============================================================

-- ============================================================
-- v_player_summary
-- One row per player with current group, level, progression, coach.
-- ============================================================
CREATE OR REPLACE VIEW v_player_summary AS
SELECT
  p.id                                  AS player_id,
  p.academy_id,
  p.full_name,
  p.date_of_birth,
  EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER AS age,
  p.gender,
  p.status                              AS player_status,
  p.current_track,
  p.last_assessed_at,
  p.next_assessment_due,
  CASE
    WHEN p.next_assessment_due IS NULL THEN 'no_schedule'
    WHEN p.next_assessment_due < CURRENT_DATE THEN 'overdue'
    WHEN p.next_assessment_due <= CURRENT_DATE + 14 THEN 'due_soon'
    ELSE 'on_track'
  END                                   AS assessment_status,

  g.name                                AS group_name,
  g.id                                  AS group_id,
  al.label                              AS level_label,
  al.level_number,

  pp.overall_score,
  pp.technical_score,
  pp.tactical_score,
  pp.movement_score,
  pp.competition_score,
  pp.behavioral_score,
  pp.overall_score - pp.baseline_overall AS score_delta,
  pp.promotion_ready,
  pp.focus_areas,

  pr.display_name                       AS coach_name,
  pr.id                                 AS coach_id

FROM players p
LEFT JOIN groups g         ON g.id = p.current_group_id
LEFT JOIN academy_levels al ON al.id = p.current_level_id
LEFT JOIN player_progression pp ON pp.player_id = p.id
LEFT JOIN profiles pr      ON pr.id = p.primary_coach_id
WHERE p.is_active = true;

-- ============================================================
-- v_group_summary
-- Group-level stats: capacity, player counts, load averages.
-- ============================================================
CREATE OR REPLACE VIEW v_group_summary AS
SELECT
  g.id               AS group_id,
  g.academy_id,
  g.name             AS group_name,
  g.track,
  al.label           AS level_label,
  g.max_players,

  COUNT(p.id)        AS player_count,
  CASE
    WHEN g.max_players IS NULL OR g.max_players = 0 THEN NULL
    ELSE ROUND(COUNT(p.id)::NUMERIC / g.max_players * 100, 1)
  END                AS capacity_pct,

  COUNT(p.id) FILTER (WHERE p.status = 'reassessment_due') AS overdue_reassessments,
  COUNT(p.id) FILTER (WHERE p.next_assessment_due <= CURRENT_DATE + 14 AND p.status = 'active') AS upcoming_assessments,

  ROUND(AVG(pp.overall_score), 2) AS avg_overall_score,

  lc.display_name    AS lead_coach_name,
  lc.id              AS lead_coach_id

FROM groups g
LEFT JOIN academy_levels al ON al.id = g.level_id
LEFT JOIN players p         ON p.current_group_id = g.id AND p.is_active = true
LEFT JOIN player_progression pp ON pp.player_id = p.id
LEFT JOIN coach_group_assignments cga ON cga.group_id = g.id AND cga.role = 'lead' AND cga.is_active = true
LEFT JOIN profiles lc       ON lc.id = cga.coach_id
WHERE g.is_active = true
GROUP BY g.id, g.academy_id, g.name, g.track, al.label, g.max_players, lc.display_name, lc.id;

-- ============================================================
-- v_reassessment_pipeline
-- All players with an assessment status, sorted by urgency.
-- ============================================================
CREATE OR REPLACE VIEW v_reassessment_pipeline AS
SELECT
  p.id                AS player_id,
  p.academy_id,
  p.full_name,
  p.current_track,
  g.name              AS group_name,
  p.next_assessment_due,
  p.last_assessed_at,
  CURRENT_DATE - p.next_assessment_due AS days_overdue,
  CASE
    WHEN p.next_assessment_due < CURRENT_DATE        THEN 'overdue'
    WHEN p.next_assessment_due <= CURRENT_DATE + 14  THEN 'due_soon'
    WHEN p.next_assessment_due <= CURRENT_DATE + 30  THEN 'upcoming'
    ELSE 'future'
  END                 AS urgency,
  pp.overall_score,
  pr.display_name     AS coach_name
FROM players p
LEFT JOIN groups g             ON g.id = p.current_group_id
LEFT JOIN player_progression pp ON pp.player_id = p.id
LEFT JOIN profiles pr          ON pr.id = p.primary_coach_id
WHERE p.is_active = true
AND p.next_assessment_due IS NOT NULL
ORDER BY
  CASE
    WHEN p.next_assessment_due < CURRENT_DATE THEN 1
    WHEN p.next_assessment_due <= CURRENT_DATE + 14 THEN 2
    ELSE 3
  END,
  p.next_assessment_due;

-- ============================================================
-- v_session_load
-- Per-session load breakdown with overload flag.
-- Overload = all three domain averages >= 4.
-- ============================================================
CREATE OR REPLACE VIEW v_session_load AS
SELECT
  s.id              AS session_id,
  s.academy_id,
  s.scheduled_date,
  s.group_id,
  g.name            AS group_name,
  s.coach_id,
  pr.display_name   AS coach_name,
  s.status,

  ROUND(AVG(sb.intensity) FILTER (WHERE sb.type IN ('technical', 'tactical')), 2) AS skill_avg_intensity,
  ROUND(AVG(sb.intensity) FILTER (WHERE sb.type = 'competition'), 2)              AS competition_avg_intensity,
  ROUND(AVG(sb.intensity) FILTER (WHERE sb.type IN ('fitness', 'movement')), 2)   AS fitness_avg_intensity,
  ROUND(AVG(sb.intensity), 2)                                                      AS overall_avg_intensity,

  (
    COALESCE(AVG(sb.intensity) FILTER (WHERE sb.type IN ('technical', 'tactical')), 0) >= 4
    AND COALESCE(AVG(sb.intensity) FILTER (WHERE sb.type = 'competition'), 0) >= 4
    AND COALESCE(AVG(sb.intensity) FILTER (WHERE sb.type IN ('fitness', 'movement')), 0) >= 4
  ) AS is_overload,

  COUNT(sb.id)      AS block_count,
  SUM(sb.duration_min) AS total_duration_min

FROM sessions s
LEFT JOIN session_blocks sb ON sb.session_id = s.id
LEFT JOIN groups g          ON g.id = s.group_id
LEFT JOIN profiles pr       ON pr.id = s.coach_id
WHERE s.status != 'cancelled'
GROUP BY s.id, s.academy_id, s.scheduled_date, s.group_id, g.name, s.coach_id, pr.display_name, s.status;

-- ============================================================
-- v_pending_proposed_actions
-- Proposed actions awaiting director review.
-- ============================================================
CREATE OR REPLACE VIEW v_pending_proposed_actions AS
SELECT
  pa.id            AS action_id,
  pa.academy_id,
  pa.action_type,
  pa.action_label,
  pa.risk_level,
  pa.affected_count,
  pa.status,
  pa.expires_at,
  EXTRACT(EPOCH FROM (pa.expires_at - NOW()))/3600 AS hours_remaining,

  pr.display_name  AS proposed_by_name,
  pa.created_at,

  vc.raw_input     AS original_voice_input,
  vc.issuer_role

FROM proposed_actions pa
JOIN profiles pr       ON pr.id = pa.proposed_by_id
JOIN voice_commands vc ON vc.id = pa.voice_command_id
WHERE pa.status = 'pending_review'
AND pa.expires_at > NOW()
ORDER BY
  CASE pa.risk_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
  pa.created_at;

-- ============================================================
-- v_recent_audit_log
-- Last 200 entries across all action types.
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
  al.actor_role,
  al.payload
FROM audit_logs al
LEFT JOIN profiles pr ON pr.id = al.actor_id
ORDER BY al.created_at DESC
LIMIT 200;
