-- ============================================================
-- ACADEMY OS — MIGRATION 044: PLAYER REQUIREMENT PROGRESS BOOTSTRAP
-- Initialises player_requirement_progress rows for players whose
-- current curriculum state is Orange 1, Orange 2, or Orange 3.
--
-- Sprint: 34 — Player Requirement Progress Bootstrap V1
--
-- Source data:
--   player_curriculum_states  — identifies which level each player
--                               is currently assigned to
--   curriculum_track_requirements — global Orange Ball requirement
--                               definitions seeded in Sprint 33
--                               (migration 043)
--
-- Bootstrap behaviour:
--   One row is inserted per (player, requirement) for every active
--   global requirement at the player's current Orange Ball level.
--   All rows start with default/empty values — no evidence, no
--   confirmation, no status advancement.
--
-- Rows inserted per player:
--   Orange 1 — Rally:        10 requirements (from Sprint 33)
--   Orange 2 — Direction:    11 requirements (from Sprint 33)
--   Orange 3 — Construction: 11 requirements (from Sprint 33)
--
-- Default values for every inserted row:
--   status            = 'not_started'
--   progress_value    = NULL
--   evidence_count    = 0
--   last_evidence_at  = NULL
--   coach_confirmed_by    = NULL
--   director_confirmed_by = NULL
--   confirmed_at          = NULL
--   notes             = NULL
--   is_parent_visible = false
--   is_player_visible = false
--
-- Idempotency:
--   ON CONFLICT (player_id, requirement_id) DO NOTHING
--   Safe to re-run — duplicate rows are silently skipped.
--
-- Tables intentionally NOT touched:
--   requirement_evidence_links  — no evidence links created
--   player_curriculum_states    — not altered
--   players                     — not altered
--   player_priorities           — not altered
--   player_profiles             — not altered
--   Any UI component or server action
--
-- This migration creates no new tables, views, functions, or types.
-- Type regeneration is not required.
-- ============================================================


INSERT INTO player_requirement_progress (
  academy_id,
  player_id,
  curriculum_level_id,
  requirement_id,
  status,
  progress_value,
  evidence_count,
  last_evidence_at,
  notes,
  is_parent_visible,
  is_player_visible
)
SELECT
  pcs.academy_id,
  pcs.player_id,
  pcs.current_level_id,
  ctr.id,
  'not_started',
  NULL,
  0,
  NULL,
  NULL,
  false,
  false
FROM player_curriculum_states pcs
JOIN curriculum_levels cl
  ON cl.id = pcs.current_level_id
JOIN curriculum_track_requirements ctr
  ON ctr.curriculum_level_id = cl.id
WHERE cl.stage = 'orange_development'
  AND cl.level_number IN (1, 2, 3)
  AND ctr.academy_id IS NULL
  AND ctr.source_type = 'global_default'
  AND ctr.version = 1
  AND ctr.is_active = true
ON CONFLICT (player_id, requirement_id) DO NOTHING;
