-- ============================================================
-- ACADEMY OS — MIGRATION 042: REQUIREMENT DOMAIN SEED
-- Seeds the three global pathway domain records into
-- curriculum_requirement_domains.
--
-- Sprint 31 scope: seed only.
-- No curriculum_track_requirements rows.
-- No player_requirement_progress rows.
-- No requirement_evidence_links rows.
-- No UI changes. No player data changes.
--
-- Idempotent: ON CONFLICT (key) DO UPDATE ensures safe reruns.
-- The unique constraint on key is defined in migration 041.
-- ============================================================

INSERT INTO curriculum_requirement_domains (key, label, description, display_order, is_active)
VALUES
  (
    'skill',
    'Skill Path',
    'Technical and tactical development requirements connected to stroke skills, movement patterns, decision-making, and tennis-specific competency.',
    10,
    true
  ),
  (
    'competition',
    'Competition Path',
    'Competition-readiness requirements connected to match play, point construction, scoring situations, resilience, and tournament behavior.',
    20,
    true
  ),
  (
    'fitness',
    'Fitness Path',
    'Physical development requirements connected to movement quality, speed, agility, strength, recovery, readiness, and tennis-specific athletic capacity.',
    30,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  label         = EXCLUDED.label,
  description   = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active     = EXCLUDED.is_active,
  updated_at    = now();
