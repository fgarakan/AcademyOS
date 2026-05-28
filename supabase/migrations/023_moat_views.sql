-- ============================================================
-- ACADEMY OS — MIGRATION 023: MOAT VIEWS
-- Integrated views for the full Signals → Priorities → Recommendations
-- → Sessions → Outcomes → Learning loop.
-- These are the views the UI and API query directly.
-- ============================================================

-- ============================================================
-- v_player_signal_dashboard
-- All active signals for a player with context.
-- Primary view for the player detail page's signal feed.
-- ============================================================
CREATE OR REPLACE VIEW v_player_signal_dashboard AS
SELECT
  s.id                      AS signal_id,
  s.academy_id,
  s.player_id,
  p.full_name               AS player_name,
  g.name                    AS group_name,
  s.signal_type,
  s.source,
  s.domain,
  s.severity,
  s.confidence,
  s.title,
  s.description,
  s.data,
  s.recommended_action,
  s.emitted_at,
  s.expires_at,
  s.processed_by_engine,
  ds.urgency                AS player_urgency,
  ds.composite_score        AS player_decision_score
FROM player_development_signals s
JOIN players p               ON p.id = s.player_id
LEFT JOIN groups g           ON g.id = p.current_group_id
LEFT JOIN decision_scores ds ON ds.player_id = s.player_id
WHERE s.is_active = true
ORDER BY
  CASE s.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
  s.emitted_at DESC;

-- ============================================================
-- v_academy_priority_queue
-- All high-urgency players, ranked by composite decision score.
-- The director's "what to do today" view.
-- ============================================================
CREATE OR REPLACE VIEW v_academy_priority_queue AS
SELECT
  p.id                         AS player_id,
  p.academy_id,
  p.full_name,
  g.name                       AS group_name,
  pp.overall_score,
  ds.composite_score,
  ds.urgency,
  ds.signal_count,
  ds.high_severity_count,
  ds.primary_action,
  ds.is_constrained,
  ds.phase_at_score            AS current_phase,
  ds.scored_at,
  la.fatigue_risk_label,
  la.fatigue_risk_score,
  pr_count.open_priority_count,
  rec_count.pending_review_count
FROM players p
JOIN decision_scores ds          ON ds.player_id = p.id
LEFT JOIN groups g               ON g.id = p.current_group_id
LEFT JOIN player_progression pp  ON pp.player_id = p.id
LEFT JOIN player_load_aggregation la ON la.player_id = p.id
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS open_priority_count
  FROM player_priorities pp2
  WHERE pp2.player_id = p.id AND pp2.is_active = true AND pp2.status = 'open'
) pr_count ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS pending_review_count
  FROM player_recommendations rec
  WHERE rec.player_id = p.id AND rec.status = 'pending_review'
) rec_count ON true
WHERE p.is_active = true AND p.status = 'active'
ORDER BY
  CASE ds.urgency WHEN 'immediate' THEN 1 WHEN 'urgent' THEN 2 WHEN 'high' THEN 3 ELSE 4 END,
  ds.composite_score DESC;

-- ============================================================
-- v_recommendation_review_queue
-- Pending recommendations awaiting director review.
-- ============================================================
CREATE OR REPLACE VIEW v_recommendation_review_queue AS
SELECT
  rec.id                       AS recommendation_id,
  rec.academy_id,
  rec.player_id,
  p.full_name                  AS player_name,
  g.name                       AS group_name,
  rec.title,
  rec.recommendation_type,
  rec.priority_level,
  rec.urgency,
  rec.confidence_score,
  rec.expires_at,
  EXTRACT(EPOCH FROM (rec.expires_at - NOW()))/3600 AS hours_remaining,

  pri.category                 AS priority_category,
  pri.current_score,
  pri.relevant_dimension,

  ds.composite_score,
  ds.primary_action,

  la.fatigue_risk_label,

  rec.generated_at
FROM player_recommendations rec
JOIN players p                   ON p.id = rec.player_id
LEFT JOIN groups g               ON g.id = p.current_group_id
LEFT JOIN player_priorities pri  ON pri.id = rec.priority_id
LEFT JOIN decision_scores ds     ON ds.player_id = rec.player_id
LEFT JOIN player_load_aggregation la ON la.player_id = rec.player_id
WHERE rec.status = 'pending_review'
AND rec.expires_at > NOW()
ORDER BY
  CASE rec.urgency WHEN 'immediate' THEN 1 WHEN 'urgent' THEN 2 WHEN 'high' THEN 3 ELSE 4 END,
  rec.confidence_score DESC,
  rec.generated_at;

-- ============================================================
-- v_session_recommendation_feed
-- Suggested sessions for coaches to schedule, with exercise context.
-- ============================================================
CREATE OR REPLACE VIEW v_session_recommendation_feed AS
SELECT
  sr.id                        AS session_rec_id,
  sr.academy_id,
  sr.player_id,
  p.full_name                  AS player_name,
  g.name                       AS group_name,
  sr.title,
  sr.session_type,
  sr.target_date,
  sr.target_duration_min,
  sr.target_intensity,
  sr.focus_block_types,
  sr.focus_exercise_tags,
  sr.rationale,
  sr.coaching_cues,
  sr.status,
  t.name                       AS suggested_template_name,
  t.id                         AS suggested_template_id,
  rec.urgency                  AS recommendation_urgency,
  rec.priority_level,
  rec.title                    AS recommendation_title
FROM session_recommendations sr
JOIN player_recommendations rec ON rec.id = sr.recommendation_id
JOIN players p                  ON p.id = sr.player_id
LEFT JOIN groups g              ON g.id = p.current_group_id
LEFT JOIN templates t           ON t.id = sr.suggested_template_id
WHERE sr.status = 'suggested'
AND rec.status IN ('approved', 'modified')
ORDER BY
  CASE rec.urgency WHEN 'immediate' THEN 1 WHEN 'urgent' THEN 2 ELSE 3 END,
  sr.target_date;

-- ============================================================
-- v_player_development_loop
-- Full loop view per player: signals → priority → recommendation → outcome.
-- One row per active recommendation.
-- ============================================================
CREATE OR REPLACE VIEW v_player_development_loop AS
SELECT
  rec.id                         AS recommendation_id,
  rec.academy_id,
  rec.player_id,
  p.full_name                    AS player_name,
  g.name                         AS group_name,

  -- Signal layer
  ds.signal_count,
  ds.composite_score,
  ds.urgency,

  -- Priority layer
  pri.category                   AS priority_category,
  pri.title                      AS priority_title,
  pri.priority_rank,
  pri.priority_level,

  -- Recommendation layer
  rec.title                      AS recommendation_title,
  rec.recommendation_type,
  rec.status                     AS recommendation_status,
  rec.confidence_score,
  rec.expires_at,

  -- Session layer
  sr.title                       AS session_rec_title,
  sr.session_type,
  sr.target_date,
  sr.status                      AS session_rec_status,
  sr.executed_session_id,

  -- Outcome layer
  po.performance_rating,
  po.plan_achieved,

  -- Learning layer
  ov.override_type,
  ov.outcome_verdict,

  rec.generated_at

FROM player_recommendations rec
JOIN players p                     ON p.id = rec.player_id
LEFT JOIN groups g                 ON g.id = p.current_group_id
LEFT JOIN player_priorities pri    ON pri.id = rec.priority_id
LEFT JOIN decision_scores ds       ON ds.player_id = rec.player_id
LEFT JOIN session_recommendations sr ON sr.recommendation_id = rec.id
LEFT JOIN player_outcomes po       ON po.id = sr.outcome_id
LEFT JOIN recommendation_overrides ov ON ov.recommendation_id = rec.id
WHERE rec.status NOT IN ('expired')
ORDER BY rec.generated_at DESC;

-- ============================================================
-- v_learning_system_summary
-- Aggregate view of override outcomes for directors.
-- Shows accuracy of the decision engine over time.
-- ============================================================
CREATE OR REPLACE VIEW v_learning_system_summary AS
SELECT
  ov.academy_id,
  ov.original_rec_type,
  COUNT(*)                                           AS total_overrides,
  COUNT(*) FILTER (WHERE ov.outcome_verdict = 'better')      AS better_outcomes,
  COUNT(*) FILTER (WHERE ov.outcome_verdict = 'neutral')     AS neutral_outcomes,
  COUNT(*) FILTER (WHERE ov.outcome_verdict = 'worse')       AS worse_outcomes,
  COUNT(*) FILTER (WHERE ov.outcome_verdict = 'inconclusive') AS inconclusive,
  ROUND(
    COUNT(*) FILTER (WHERE ov.outcome_verdict = 'better')::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE ov.outcome_evaluated = true), 0) * 100, 1
  )                                                  AS pct_override_better,
  ROUND(AVG(ov.outcome_score_delta), 3)              AS avg_score_delta,
  MAX(ov.overridden_at)                              AS last_override_at
FROM recommendation_overrides ov
WHERE ov.outcome_evaluated = true
GROUP BY ov.academy_id, ov.original_rec_type
ORDER BY total_overrides DESC;

-- ============================================================
-- v_player_time_series_recent
-- Last 12 data points per metric per player.
-- Feeds the trend charts in the player detail page.
-- ============================================================
CREATE OR REPLACE VIEW v_player_time_series_recent AS
SELECT
  ts.player_id,
  ts.academy_id,
  ts.metric,
  ts.recorded_date,
  ts.value,
  ts.source_type,
  ROW_NUMBER() OVER (PARTITION BY ts.player_id, ts.metric ORDER BY ts.recorded_date DESC) AS recency_rank
FROM player_time_series ts
WHERE ts.recorded_date >= CURRENT_DATE - 365;
