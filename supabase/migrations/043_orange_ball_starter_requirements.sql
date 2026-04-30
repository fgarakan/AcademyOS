-- ============================================================
-- ACADEMY OS — MIGRATION 043: ORANGE BALL STARTER REQUIREMENTS
-- Seeds curriculum_track_requirements for orange_development
-- levels 1–3 (Orange 1 — Rally, Orange 2 — Direction,
-- Orange 3 — Construction).
--
-- Source: docs/STARTER_REQUIREMENT_SEED_PACK_PLAN.md (Sprint 32)
-- Sprint: 33 — Orange Ball Starter Requirement Seed Migration
--
-- Rows seeded: 32 total
--   Orange 1 — Rally:       4 Skill + 3 Competition + 3 Fitness = 10
--   Orange 2 — Direction:   5 Skill + 3 Competition + 3 Fitness = 11
--   Orange 3 — Construction:4 Skill + 4 Competition + 3 Fitness = 11
--
-- All rows:
--   academy_id  = NULL           (global default — not academy-specific)
--   source_type = 'global_default'
--   version     = 1
--   is_active   = true
--   evidence_policy = 'coach_confirmed'
--   is_parent_visible_default = false
--   is_player_visible_default = false
--
-- NOT seeded in this migration:
--   player_requirement_progress
--   requirement_evidence_links
--   player tables
--   player_priorities
--   academy overrides
--
-- Idempotent via ON CONFLICT on partial unique index
--   idx_curriculum_track_req_global_unique:
--   (curriculum_level_id, requirement_domain_id, title, version)
--   WHERE academy_id IS NULL
-- DO NOTHING — safe to re-run.
-- ============================================================

DO $$
DECLARE
  v_orange1_id UUID;
  v_orange2_id UUID;
  v_orange3_id UUID;
  v_skill_id   UUID;
  v_comp_id    UUID;
  v_fit_id     UUID;
BEGIN

  -- --------------------------------------------------------
  -- Step 1: Resolve Orange Ball level IDs by (stage, level_number).
  -- Never look up by display_name — protects against future
  -- display name edits.
  -- --------------------------------------------------------
  SELECT id INTO v_orange1_id
    FROM curriculum_levels
    WHERE stage = 'orange_development' AND level_number = 1;

  SELECT id INTO v_orange2_id
    FROM curriculum_levels
    WHERE stage = 'orange_development' AND level_number = 2;

  SELECT id INTO v_orange3_id
    FROM curriculum_levels
    WHERE stage = 'orange_development' AND level_number = 3;

  -- --------------------------------------------------------
  -- Step 2: Resolve domain IDs by key.
  -- --------------------------------------------------------
  SELECT id INTO v_skill_id
    FROM curriculum_requirement_domains WHERE key = 'skill';

  SELECT id INTO v_comp_id
    FROM curriculum_requirement_domains WHERE key = 'competition';

  SELECT id INTO v_fit_id
    FROM curriculum_requirement_domains WHERE key = 'fitness';

  -- Guard: abort loudly if any expected row is missing.
  IF v_orange1_id IS NULL THEN
    RAISE EXCEPTION 'curriculum_levels row not found: stage=orange_development level_number=1';
  END IF;
  IF v_orange2_id IS NULL THEN
    RAISE EXCEPTION 'curriculum_levels row not found: stage=orange_development level_number=2';
  END IF;
  IF v_orange3_id IS NULL THEN
    RAISE EXCEPTION 'curriculum_levels row not found: stage=orange_development level_number=3';
  END IF;
  IF v_skill_id IS NULL THEN
    RAISE EXCEPTION 'curriculum_requirement_domains row not found: key=skill';
  END IF;
  IF v_comp_id IS NULL THEN
    RAISE EXCEPTION 'curriculum_requirement_domains row not found: key=competition';
  END IF;
  IF v_fit_id IS NULL THEN
    RAISE EXCEPTION 'curriculum_requirement_domains row not found: key=fitness';
  END IF;


  -- ============================================================
  -- ORANGE 1 — RALLY (stage=orange_development, level_number=1)
  -- Skill: display_order 100, 110, 120, 130
  -- Competition: 200, 210, 220
  -- Fitness: 300, 310, 320
  -- ============================================================

  INSERT INTO curriculum_track_requirements (
    academy_id, curriculum_level_id, requirement_domain_id,
    title, description,
    requirement_type, measurement_method,
    target_value, unit, pass_condition, evidence_policy,
    is_required, display_order,
    is_parent_visible_default, is_player_visible_default,
    source_type, version, is_active
  ) VALUES
    -- Skill 1
    (
      NULL, v_orange1_id, v_skill_id,
      'Preparation and ready position',
      'Player demonstrates a consistent split step and ready stance before each shot, with racket in front and weight balanced. This is the foundation every stroke is built on.',
      'qualitative', 'coach_observation',
      NULL, NULL,
      'Coach confirms the player uses a ready stance before at least 7 out of 10 observed shots across two sessions',
      'coach_confirmed', true, 100, false, false,
      'global_default', 1, true
    ),
    -- Skill 2
    (
      NULL, v_orange1_id, v_skill_id,
      'Grip organisation',
      'Player can organise their grip appropriately for forehand and backhand strokes without assistance. Grip adjustment between wings is visible and deliberate.',
      'qualitative', 'coach_observation',
      NULL, NULL,
      'Coach confirms the player self-corrects grip without prompting in at least one full session',
      'coach_confirmed', true, 110, false, false,
      'global_default', 1, true
    ),
    -- Skill 3
    (
      NULL, v_orange1_id, v_skill_id,
      'Rally consistency',
      'Player can sustain a baseline-to-baseline cooperative rally of 5 or more balls. The focus is on getting the ball back, not winners.',
      'qualitative', 'session_observation',
      NULL, NULL,
      'Coach confirms the player demonstrates 5+ ball rally control across at least two separate session drills',
      'coach_confirmed', true, 120, false, false,
      'global_default', 1, true
    ),
    -- Skill 4 (is_required=false)
    (
      NULL, v_orange1_id, v_skill_id,
      'Basic directional intent',
      'Player can direct the ball to a general target zone (e.g., crosscourt vs down-the-line) when given a clear instruction before the drill.',
      'qualitative', 'session_observation',
      NULL, NULL,
      'Coach confirms the player executes the requested direction with visible intent on at least half of drill attempts',
      'coach_confirmed', false, 130, false, false,
      'global_default', 1, true
    ),
    -- Competition 1
    (
      NULL, v_orange1_id, v_comp_id,
      'Scoring awareness',
      'Player can score a game and a set correctly without coach prompting. This is the baseline for participating in any match format.',
      'qualitative', 'match_play_observation',
      NULL, NULL,
      'Coach confirms the player self-scores accurately through a full set without corrections needed',
      'coach_confirmed', true, 200, false, false,
      'global_default', 1, true
    ),
    -- Competition 2
    (
      NULL, v_orange1_id, v_comp_id,
      'Point-start routine',
      'Player uses a consistent pre-point ritual (e.g., bounce the ball before serving, take a breath before returning). Routines help players reset and stay focused.',
      'qualitative', 'session_observation',
      NULL, NULL,
      'Coach confirms player demonstrates a visible pre-point routine in at least two observed competitive drills',
      'coach_confirmed', true, 210, false, false,
      'global_default', 1, true
    ),
    -- Competition 3
    (
      NULL, v_orange1_id, v_comp_id,
      'Reset after errors',
      'Player shows a brief reset behaviour after an unforced error (e.g., bounce racket strings, take a breath, move feet) rather than extended frustration.',
      'qualitative', 'match_play_observation',
      NULL, NULL,
      'Coach confirms player demonstrates a reset behaviour independently in at least one observed match play session',
      'coach_confirmed', true, 220, false, false,
      'global_default', 1, true
    ),
    -- Fitness 1
    (
      NULL, v_orange1_id, v_fit_id,
      'Athletic ready position',
      'Player maintains an athletic stance at the baseline between points — feet active, weight forward, racket ready. This indicates physical readiness and attentiveness.',
      'qualitative', 'session_observation',
      NULL, NULL,
      'Coach confirms the player holds an active athletic stance between points in at least one full session',
      'coach_confirmed', true, 300, false, false,
      'global_default', 1, true
    ),
    -- Fitness 2
    (
      NULL, v_orange1_id, v_fit_id,
      'Recovery after each shot',
      'Player returns toward a recovery position after each shot rather than standing and watching the ball. Consistent recovery underpins all future movement patterns.',
      'qualitative', 'session_observation',
      NULL, NULL,
      'Coach confirms the player makes a visible recovery move after shots across two consecutive sessions',
      'coach_confirmed', true, 310, false, false,
      'global_default', 1, true
    ),
    -- Fitness 3 (attendance type; target_value=8 sessions; is_required=false)
    (
      NULL, v_orange1_id, v_fit_id,
      'Effort and readiness',
      'Player arrives to sessions ready to participate, completes warm-up, and maintains visible effort throughout. Consistent effort at this stage is more important than results.',
      'attendance', 'attendance_review',
      8, 'sessions',
      'Player completes 8 of 10 consecutive sessions with full participation as noted by coach',
      'coach_confirmed', false, 320, false, false,
      'global_default', 1, true
    )
  ON CONFLICT (curriculum_level_id, requirement_domain_id, title, version)
    WHERE academy_id IS NULL DO NOTHING;


  -- ============================================================
  -- ORANGE 2 — DIRECTION (stage=orange_development, level_number=2)
  -- Skill: display_order 100, 110, 120, 130, 140
  -- Competition: 200, 210, 220
  -- Fitness: 300, 310, 320
  -- ============================================================

  INSERT INTO curriculum_track_requirements (
    academy_id, curriculum_level_id, requirement_domain_id,
    title, description,
    requirement_type, measurement_method,
    target_value, unit, pass_condition, evidence_policy,
    is_required, display_order,
    is_parent_visible_default, is_player_visible_default,
    source_type, version, is_active
  ) VALUES
    -- Skill 1
    (
      NULL, v_orange2_id, v_skill_id,
      'Directional forehand',
      'Player can consistently direct a forehand crosscourt or down-the-line on request. Directional control shows the stroke is becoming intentional rather than reactive.',
      'qualitative', 'session_observation',
      NULL, NULL,
      'Coach confirms the player successfully directs the forehand to the requested zone at least 6 out of 10 attempts across two sessions',
      'coach_confirmed', true, 100, false, false,
      'global_default', 1, true
    ),
    -- Skill 2
    (
      NULL, v_orange2_id, v_skill_id,
      'Directional backhand',
      'Player can consistently direct a backhand crosscourt or down-the-line on request. Both wings should have basic directional capability at this level.',
      'qualitative', 'session_observation',
      NULL, NULL,
      'Coach confirms the player successfully directs the backhand to the requested zone at least 5 out of 10 attempts across two sessions',
      'coach_confirmed', true, 110, false, false,
      'global_default', 1, true
    ),
    -- Skill 3
    (
      NULL, v_orange2_id, v_skill_id,
      'Serve into the service box',
      'Player can execute a serve that lands in the correct service box reliably. Placement is secondary to reliability at Orange 2.',
      'qualitative', 'session_observation',
      NULL, NULL,
      'Coach confirms the player lands 6 of 10 first serves in-court across two consecutive serving sessions',
      'coach_confirmed', true, 120, false, false,
      'global_default', 1, true
    ),
    -- Skill 4
    (
      NULL, v_orange2_id, v_skill_id,
      'Footwork into the shot',
      'Player moves toward the ball using recognisable footwork (not just reaching) and recovers toward baseline position after contact.',
      'qualitative', 'session_observation',
      NULL, NULL,
      'Coach confirms the player demonstrates approach footwork and recovery in at least one full session',
      'coach_confirmed', true, 130, false, false,
      'global_default', 1, true
    ),
    -- Skill 5 (is_required=false)
    (
      NULL, v_orange2_id, v_skill_id,
      'Rally under directional constraint',
      'Player can maintain a 5+ ball rally while attempting to direct the ball crosscourt. Combining consistency with direction is the key Orange 2 skill integration.',
      'qualitative', 'session_observation',
      NULL, NULL,
      'Coach confirms the player demonstrates directional rally control in at least two drill sets',
      'coach_confirmed', false, 140, false, false,
      'global_default', 1, true
    ),
    -- Competition 1
    (
      NULL, v_orange2_id, v_comp_id,
      'Basic tactical pattern',
      'Player uses at least one repeatable pattern intentionally during point play (e.g., rally crosscourt then attack down-the-line). Patterns show tactical awareness is developing.',
      'qualitative', 'match_play_observation',
      NULL, NULL,
      'Coach confirms the player has demonstrated a recognisable tactical pattern across at least two observed point-play sessions',
      'coach_confirmed', true, 200, false, false,
      'global_default', 1, true
    ),
    -- Competition 2
    (
      NULL, v_orange2_id, v_comp_id,
      'Sportsmanship in match play',
      'Player demonstrates appropriate behaviour during competitive drills and match play — accepts calls, encourages opponents, and maintains composure.',
      'qualitative', 'match_play_observation',
      NULL, NULL,
      'Coach confirms the player has met the academy''s sportsmanship standard across all observed match play at Orange 2',
      'coach_confirmed', true, 210, false, false,
      'global_default', 1, true
    ),
    -- Competition 3 (is_required=false)
    (
      NULL, v_orange2_id, v_comp_id,
      'Serve reliability in game context',
      'Player can put at least 2 of 3 first serves in-court during a real game situation (not just drill isolation). Serve reliability in competition is different from drill performance.',
      'qualitative', 'match_play_observation',
      NULL, NULL,
      'Coach confirms the player demonstrates serve reliability during at least one game set or tiebreak',
      'coach_confirmed', false, 220, false, false,
      'global_default', 1, true
    ),
    -- Fitness 1
    (
      NULL, v_orange2_id, v_fit_id,
      'Balance at finish position',
      'Player demonstrates balance at the end of each stroke (not falling off to one side) before making the recovery move. Balance at finish is a prerequisite for consistent directional control.',
      'qualitative', 'session_observation',
      NULL, NULL,
      'Coach confirms the player finishes strokes in balance at least 7 of 10 observed contacts across two sessions',
      'coach_confirmed', true, 300, false, false,
      'global_default', 1, true
    ),
    -- Fitness 2
    (
      NULL, v_orange2_id, v_fit_id,
      'Lateral coverage',
      'Player can reach wide balls using lateral footwork rather than reaching across the body. Lateral mobility at Orange 2 shows developing court coverage.',
      'qualitative', 'fitness_observation',
      NULL, NULL,
      'Coach confirms the player uses lateral footwork to reach wide balls in at least one movement-focused session',
      'coach_confirmed', true, 310, false, false,
      'global_default', 1, true
    ),
    -- Fitness 3 (attendance type; target_value=8 sessions; is_required=false)
    (
      NULL, v_orange2_id, v_fit_id,
      'Session-length effort',
      'Player maintains visible effort and participates fully across the complete duration of a standard session. Physical stamina at Orange 2 should support 60–75 minute sessions.',
      'attendance', 'attendance_review',
      8, 'sessions',
      'Coach confirms the player maintains full participation across 8 of 10 consecutive sessions',
      'coach_confirmed', false, 320, false, false,
      'global_default', 1, true
    )
  ON CONFLICT (curriculum_level_id, requirement_domain_id, title, version)
    WHERE academy_id IS NULL DO NOTHING;


  -- ============================================================
  -- ORANGE 3 — CONSTRUCTION (stage=orange_development, level_number=3)
  -- Skill: display_order 100, 110, 120, 130
  -- Competition: 200, 210, 220, 230
  -- Fitness: 300, 310, 320
  -- ============================================================

  INSERT INTO curriculum_track_requirements (
    academy_id, curriculum_level_id, requirement_domain_id,
    title, description,
    requirement_type, measurement_method,
    target_value, unit, pass_condition, evidence_policy,
    is_required, display_order,
    is_parent_visible_default, is_player_visible_default,
    source_type, version, is_active
  ) VALUES
    -- Skill 1
    (
      NULL, v_orange3_id, v_skill_id,
      'Three-shot pattern execution',
      'Player can execute a deliberate 3-shot sequence (e.g., serve to ad court, return to middle, forehand attack crosscourt) with visible intent in competitive drills.',
      'qualitative', 'session_observation',
      NULL, NULL,
      'Coach confirms the player demonstrates at least one 3-shot pattern intentionally across two observed sessions',
      'coach_confirmed', true, 100, false, false,
      'global_default', 1, true
    ),
    -- Skill 2
    (
      NULL, v_orange3_id, v_skill_id,
      'Technique under pressure',
      'Player maintains their stroke mechanics during competitive drills and tiebreak situations, not just in cooperative rallies.',
      'qualitative', 'match_play_observation',
      NULL, NULL,
      'Coach confirms the player''s technique is consistent between cooperative and competitive contexts across three sessions',
      'coach_confirmed', true, 110, false, false,
      'global_default', 1, true
    ),
    -- Skill 3
    (
      NULL, v_orange3_id, v_skill_id,
      'Serve placement intention',
      'Player can aim their first serve to either the deuce or ad-court service box with visible intention — not just serving in.',
      'qualitative', 'session_observation',
      NULL, NULL,
      'Coach confirms the player successfully serves to the requested side at least 5 of 10 times across two serving sessions',
      'coach_confirmed', true, 120, false, false,
      'global_default', 1, true
    ),
    -- Skill 4 (is_required=false)
    (
      NULL, v_orange3_id, v_skill_id,
      'Shot transition — defence to offence',
      'Player can recover from a defensive position (wide or behind baseline) and transition back to a neutral or attacking position on the next shot.',
      'qualitative', 'session_observation',
      NULL, NULL,
      'Coach confirms the player makes a successful defensive-to-offensive transition in at least two competitive drill sequences',
      'coach_confirmed', false, 130, false, false,
      'global_default', 1, true
    ),
    -- Competition 1
    (
      NULL, v_orange3_id, v_comp_id,
      'Offensive pattern in match play',
      'Player uses at least one offensive pattern consistently during match play — not just in drill conditions. The pattern must be recognisable and intentional.',
      'qualitative', 'match_play_observation',
      NULL, NULL,
      'Coach confirms the player demonstrates an offensive pattern in at least two observed match play sessions',
      'coach_confirmed', true, 200, false, false,
      'global_default', 1, true
    ),
    -- Competition 2
    (
      NULL, v_orange3_id, v_comp_id,
      'Reset under match pressure',
      'Player applies a reset routine (breath, bounce, ready) after errors during real match situations, not just when cued by a coach.',
      'qualitative', 'match_play_observation',
      NULL, NULL,
      'Coach confirms the player self-applies the reset routine during match play in at least two sessions',
      'coach_confirmed', true, 210, false, false,
      'global_default', 1, true
    ),
    -- Competition 3 (attendance type; target_value=2 matches; is_required=true)
    (
      NULL, v_orange3_id, v_comp_id,
      'Internal match play participation',
      'Player has participated in internal challenge matches or equivalent competitive formats at the academy. Match exposure at Orange 3 is essential for progression.',
      'attendance', 'attendance_review',
      2, 'matches',
      'Player has completed at least 2 internal match play sessions or challenge match events during the Orange 3 level period',
      'coach_confirmed', true, 220, false, false,
      'global_default', 1, true
    ),
    -- Competition 4 (is_required=false)
    (
      NULL, v_orange3_id, v_comp_id,
      'Opponent weakness awareness',
      'Player can identify and attempt to exploit an opponent''s weaker side (e.g., consistently targeting the backhand) during match play. This indicates basic tactical reading.',
      'qualitative', 'match_play_observation',
      NULL, NULL,
      'Coach confirms the player has demonstrated a deliberate exploitation attempt in at least one observed match',
      'coach_confirmed', false, 230, false, false,
      'global_default', 1, true
    ),
    -- Fitness 1
    (
      NULL, v_orange3_id, v_fit_id,
      'Sprint mechanics',
      'Player demonstrates basic sprint mechanics for court coverage — first step explosiveness, change of direction without stumbling, deceleration before contact.',
      'qualitative', 'fitness_observation',
      NULL, NULL,
      'Coach confirms the player demonstrates functional sprint mechanics in at least one movement-focused session',
      'coach_confirmed', true, 300, false, false,
      'global_default', 1, true
    ),
    -- Fitness 2 (attendance type; target_value=8 sessions; is_required=true)
    (
      NULL, v_orange3_id, v_fit_id,
      'Full session stamina',
      'Player can maintain effort and quality across a 90-minute session without significant drop-off in the final third. Orange 3 players are approaching Green, which requires higher volume.',
      'attendance', 'attendance_review',
      8, 'sessions',
      'Coach confirms the player maintains full-session effort across 8 of 10 consecutive sessions',
      'coach_confirmed', true, 310, false, false,
      'global_default', 1, true
    ),
    -- Fitness 3 (is_required=false)
    (
      NULL, v_orange3_id, v_fit_id,
      'Between-point recovery routine',
      'Player uses the time between points appropriately — towel/drink if available, takes a breath, repositions feet, takes the right amount of time.',
      'qualitative', 'match_play_observation',
      NULL, NULL,
      'Coach confirms the player has a visible between-point routine in at least one competitive session',
      'coach_confirmed', false, 320, false, false,
      'global_default', 1, true
    )
  ON CONFLICT (curriculum_level_id, requirement_domain_id, title, version)
    WHERE academy_id IS NULL DO NOTHING;

END $$;
