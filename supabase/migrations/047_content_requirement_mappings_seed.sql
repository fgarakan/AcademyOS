-- ============================================================
-- ACADEMY OS — MIGRATION 047: CONTENT-TO-REQUIREMENT MAPPINGS SEED
-- Maps Orange Ball curriculum content items to the existing
-- Orange 1–3 curriculum track requirements seeded in migration 043.
--
-- Mapping types:
--   develops  — activity builds the competency the requirement measures
--   assesses  — activity directly generates evidence for the requirement
--   reinforces — activity touches the requirement but is not primary vehicle
--
-- Sprint: 55 — Content-to-Requirement Mapping V1
-- ============================================================

DO $$
DECLARE
  v_orange1_id    UUID;
  v_orange2_id    UUID;
  v_orange3_id    UUID;
  v_skill_id      UUID;
  v_comp_id       UUID;
  v_fit_id        UUID;

  -- Orange 1 content IDs
  v_c_ready_pos          UUID;
  v_c_coop_rally         UUID;
  v_c_recovery_bounce    UUID;
  v_c_grip_org           UUID;
  v_c_longest_rally      UUID;
  v_c_mini_set           UUID;
  v_c_target_zone        UUID;
  v_c_rally_assess       UUID;
  v_c_scoring_assess     UUID;

  -- Orange 2 content IDs
  v_c_xc_fh             UUID;
  v_c_dtl_bh            UUID;
  v_c_serve_10           UUID;
  v_c_lateral_cov        UUID;
  v_c_dir_rally          UUID;
  v_c_dir_battle         UUID;
  v_c_serve_score        UUID;
  v_c_xc_king            UUID;
  v_c_dir_assess         UUID;
  v_c_serve_assess       UUID;

  -- Orange 3 content IDs
  v_c_3shot_drill        UUID;
  v_c_pressure_rally     UUID;
  v_c_serve_placement    UUID;
  v_c_def_att            UUID;
  v_c_build_point        UUID;
  v_c_pattern_defender   UUID;
  v_c_short_ball         UUID;
  v_c_internal_match     UUID;
  v_c_3shot_obs          UUID;
  v_c_serve_obs          UUID;

  -- Orange 1 requirement IDs
  v_r_o1_prep            UUID;
  v_r_o1_grip            UUID;
  v_r_o1_rally           UUID;
  v_r_o1_dir_intent      UUID;
  v_r_o1_scoring         UUID;
  v_r_o1_routine         UUID;
  v_r_o1_reset           UUID;
  v_r_o1_athletic        UUID;
  v_r_o1_recovery        UUID;
  v_r_o1_effort          UUID;

  -- Orange 2 requirement IDs
  v_r_o2_fh_dir          UUID;
  v_r_o2_bh_dir          UUID;
  v_r_o2_serve           UUID;
  v_r_o2_footwork        UUID;
  v_r_o2_rally_dir       UUID;
  v_r_o2_tactical        UUID;
  v_r_o2_sports          UUID;
  v_r_o2_serve_game      UUID;
  v_r_o2_balance         UUID;
  v_r_o2_lateral         UUID;
  v_r_o2_session         UUID;

  -- Orange 3 requirement IDs
  v_r_o3_3shot           UUID;
  v_r_o3_pressure        UUID;
  v_r_o3_serve_intent    UUID;
  v_r_o3_def_off         UUID;
  v_r_o3_offensive_pat   UUID;
  v_r_o3_reset_match     UUID;
  v_r_o3_match_play      UUID;
  v_r_o3_opp_weak        UUID;
  v_r_o3_sprint          UUID;
  v_r_o3_stamina         UUID;
  v_r_o3_between_point   UUID;

BEGIN

  -- ────────────────────────────────────────────────────────────
  -- 1. Resolve level IDs
  -- ────────────────────────────────────────────────────────────
  SELECT id INTO v_orange1_id FROM curriculum_levels WHERE stage = 'orange_development' AND level_number = 1;
  SELECT id INTO v_orange2_id FROM curriculum_levels WHERE stage = 'orange_development' AND level_number = 2;
  SELECT id INTO v_orange3_id FROM curriculum_levels WHERE stage = 'orange_development' AND level_number = 3;

  -- ────────────────────────────────────────────────────────────
  -- 2. Resolve domain IDs
  -- ────────────────────────────────────────────────────────────
  SELECT id INTO v_skill_id FROM curriculum_requirement_domains WHERE key = 'skill';
  SELECT id INTO v_comp_id  FROM curriculum_requirement_domains WHERE key = 'competition';
  SELECT id INTO v_fit_id   FROM curriculum_requirement_domains WHERE key = 'fitness';

  -- ────────────────────────────────────────────────────────────
  -- 3. Resolve Orange 1 content IDs by (level_id, content_type, title)
  -- ────────────────────────────────────────────────────────────
  SELECT id INTO v_c_ready_pos       FROM curriculum_content_items WHERE level_id = v_orange1_id AND title = 'Ready Position and Split Step'                  AND academy_id IS NULL;
  SELECT id INTO v_c_coop_rally      FROM curriculum_content_items WHERE level_id = v_orange1_id AND title = 'Cooperative Crosscourt Baseline Rally'           AND academy_id IS NULL;
  SELECT id INTO v_c_recovery_bounce FROM curriculum_content_items WHERE level_id = v_orange1_id AND title = 'Recovery Bounce After Every Shot'               AND academy_id IS NULL;
  SELECT id INTO v_c_grip_org        FROM curriculum_content_items WHERE level_id = v_orange1_id AND title = 'Grip Organisation FH to BH Switch'              AND academy_id IS NULL;
  SELECT id INTO v_c_longest_rally   FROM curriculum_content_items WHERE level_id = v_orange1_id AND title = 'Longest Rally Challenge'                        AND academy_id IS NULL;
  SELECT id INTO v_c_mini_set        FROM curriculum_content_items WHERE level_id = v_orange1_id AND title = 'Mini-Set with Scoring Practice'                 AND academy_id IS NULL;
  SELECT id INTO v_c_target_zone     FROM curriculum_content_items WHERE level_id = v_orange1_id AND title = 'Target Zone Rally Game'                         AND academy_id IS NULL;
  SELECT id INTO v_c_rally_assess    FROM curriculum_content_items WHERE level_id = v_orange1_id AND title = '5-Ball Rally Consistency Assessment'            AND academy_id IS NULL;
  SELECT id INTO v_c_scoring_assess  FROM curriculum_content_items WHERE level_id = v_orange1_id AND title = 'Scoring Knowledge Assessment'                   AND academy_id IS NULL;

  -- ────────────────────────────────────────────────────────────
  -- 4. Resolve Orange 2 content IDs
  -- ────────────────────────────────────────────────────────────
  SELECT id INTO v_c_xc_fh      FROM curriculum_content_items WHERE level_id = v_orange2_id AND title = 'Crosscourt Forehand Direction Drill'                 AND academy_id IS NULL;
  SELECT id INTO v_c_dtl_bh     FROM curriculum_content_items WHERE level_id = v_orange2_id AND title = 'Down-the-Line Backhand Direction Drill'              AND academy_id IS NULL;
  SELECT id INTO v_c_serve_10   FROM curriculum_content_items WHERE level_id = v_orange2_id AND title = 'Serve Into the Box — 10 Serves'                      AND academy_id IS NULL;
  SELECT id INTO v_c_lateral_cov FROM curriculum_content_items WHERE level_id = v_orange2_id AND title = 'Lateral Coverage and Wide Ball Recovery'            AND academy_id IS NULL;
  SELECT id INTO v_c_dir_rally  FROM curriculum_content_items WHERE level_id = v_orange2_id AND title = 'Directional Rally Under Constraint'                  AND academy_id IS NULL;
  SELECT id INTO v_c_dir_battle FROM curriculum_content_items WHERE level_id = v_orange2_id AND title = 'Direction Battle Points'                             AND academy_id IS NULL;
  SELECT id INTO v_c_serve_score FROM curriculum_content_items WHERE level_id = v_orange2_id AND title = 'Serve-Score Game'                                   AND academy_id IS NULL;
  SELECT id INTO v_c_xc_king    FROM curriculum_content_items WHERE level_id = v_orange2_id AND title = 'Crosscourt King / Queen'                             AND academy_id IS NULL;
  SELECT id INTO v_c_dir_assess FROM curriculum_content_items WHERE level_id = v_orange2_id AND title = 'Directional Control Assessment'                      AND academy_id IS NULL;
  SELECT id INTO v_c_serve_assess FROM curriculum_content_items WHERE level_id = v_orange2_id AND title = 'Serve Reliability Assessment'                      AND academy_id IS NULL;

  -- ────────────────────────────────────────────────────────────
  -- 5. Resolve Orange 3 content IDs
  -- ────────────────────────────────────────────────────────────
  SELECT id INTO v_c_3shot_drill     FROM curriculum_content_items WHERE level_id = v_orange3_id AND title = 'Three-Shot Pattern Drill'                       AND academy_id IS NULL;
  SELECT id INTO v_c_pressure_rally  FROM curriculum_content_items WHERE level_id = v_orange3_id AND title = 'Technique Under Pressure Rally'                 AND academy_id IS NULL;
  SELECT id INTO v_c_serve_placement FROM curriculum_content_items WHERE level_id = v_orange3_id AND title = 'Serve Placement Targets — Deuce and Ad'         AND academy_id IS NULL;
  SELECT id INTO v_c_def_att         FROM curriculum_content_items WHERE level_id = v_orange3_id AND title = 'Defence to Attack Transition Drill'             AND academy_id IS NULL;
  SELECT id INTO v_c_build_point     FROM curriculum_content_items WHERE level_id = v_orange3_id AND title = 'Build the Point Game'                           AND academy_id IS NULL;
  SELECT id INTO v_c_pattern_defender FROM curriculum_content_items WHERE level_id = v_orange3_id AND title = 'Offensive Pattern vs Baseline Defender'        AND academy_id IS NULL;
  SELECT id INTO v_c_short_ball      FROM curriculum_content_items WHERE level_id = v_orange3_id AND title = 'Short Ball Attack Game'                         AND academy_id IS NULL;
  SELECT id INTO v_c_internal_match  FROM curriculum_content_items WHERE level_id = v_orange3_id AND title = 'Internal Challenge Match — Orange 3 Format'     AND academy_id IS NULL;
  SELECT id INTO v_c_3shot_obs       FROM curriculum_content_items WHERE level_id = v_orange3_id AND title = 'Three-Shot Pattern Observation'                 AND academy_id IS NULL;
  SELECT id INTO v_c_serve_obs       FROM curriculum_content_items WHERE level_id = v_orange3_id AND title = 'Serve Placement Observation'                    AND academy_id IS NULL;

  -- ────────────────────────────────────────────────────────────
  -- 6. Resolve Orange 1 requirement IDs by (level_id, domain_id, title)
  -- ────────────────────────────────────────────────────────────
  SELECT id INTO v_r_o1_prep     FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange1_id AND requirement_domain_id = v_skill_id AND title = 'Preparation and ready position' AND academy_id IS NULL;
  SELECT id INTO v_r_o1_grip     FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange1_id AND requirement_domain_id = v_skill_id AND title = 'Grip organisation'               AND academy_id IS NULL;
  SELECT id INTO v_r_o1_rally    FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange1_id AND requirement_domain_id = v_skill_id AND title = 'Rally consistency'               AND academy_id IS NULL;
  SELECT id INTO v_r_o1_dir_intent FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange1_id AND requirement_domain_id = v_skill_id AND title = 'Basic directional intent'    AND academy_id IS NULL;
  SELECT id INTO v_r_o1_scoring  FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange1_id AND requirement_domain_id = v_comp_id  AND title = 'Scoring awareness'             AND academy_id IS NULL;
  SELECT id INTO v_r_o1_routine  FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange1_id AND requirement_domain_id = v_comp_id  AND title = 'Point-start routine'           AND academy_id IS NULL;
  SELECT id INTO v_r_o1_reset    FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange1_id AND requirement_domain_id = v_comp_id  AND title = 'Reset after errors'            AND academy_id IS NULL;
  SELECT id INTO v_r_o1_athletic FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange1_id AND requirement_domain_id = v_fit_id   AND title = 'Athletic ready position'       AND academy_id IS NULL;
  SELECT id INTO v_r_o1_recovery FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange1_id AND requirement_domain_id = v_fit_id   AND title = 'Recovery after each shot'      AND academy_id IS NULL;
  SELECT id INTO v_r_o1_effort   FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange1_id AND requirement_domain_id = v_fit_id   AND title = 'Effort and readiness'          AND academy_id IS NULL;

  -- ────────────────────────────────────────────────────────────
  -- 7. Resolve Orange 2 requirement IDs
  -- ────────────────────────────────────────────────────────────
  SELECT id INTO v_r_o2_fh_dir   FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange2_id AND requirement_domain_id = v_skill_id AND title = 'Directional forehand'             AND academy_id IS NULL;
  SELECT id INTO v_r_o2_bh_dir   FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange2_id AND requirement_domain_id = v_skill_id AND title = 'Directional backhand'             AND academy_id IS NULL;
  SELECT id INTO v_r_o2_serve    FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange2_id AND requirement_domain_id = v_skill_id AND title = 'Serve into the service box'       AND academy_id IS NULL;
  SELECT id INTO v_r_o2_footwork FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange2_id AND requirement_domain_id = v_skill_id AND title = 'Footwork into the shot'           AND academy_id IS NULL;
  SELECT id INTO v_r_o2_rally_dir FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange2_id AND requirement_domain_id = v_skill_id AND title = 'Rally under directional constraint' AND academy_id IS NULL;
  SELECT id INTO v_r_o2_tactical FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange2_id AND requirement_domain_id = v_comp_id  AND title = 'Basic tactical pattern'           AND academy_id IS NULL;
  SELECT id INTO v_r_o2_sports   FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange2_id AND requirement_domain_id = v_comp_id  AND title = 'Sportsmanship in match play'      AND academy_id IS NULL;
  SELECT id INTO v_r_o2_serve_game FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange2_id AND requirement_domain_id = v_comp_id AND title = 'Serve reliability in game context' AND academy_id IS NULL;
  SELECT id INTO v_r_o2_balance  FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange2_id AND requirement_domain_id = v_fit_id   AND title = 'Balance at finish position'       AND academy_id IS NULL;
  SELECT id INTO v_r_o2_lateral  FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange2_id AND requirement_domain_id = v_fit_id   AND title = 'Lateral coverage'                 AND academy_id IS NULL;
  SELECT id INTO v_r_o2_session  FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange2_id AND requirement_domain_id = v_fit_id   AND title = 'Session-length effort'            AND academy_id IS NULL;

  -- ────────────────────────────────────────────────────────────
  -- 8. Resolve Orange 3 requirement IDs
  -- ────────────────────────────────────────────────────────────
  SELECT id INTO v_r_o3_3shot        FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange3_id AND requirement_domain_id = v_skill_id AND title = 'Three-shot pattern execution'  AND academy_id IS NULL;
  SELECT id INTO v_r_o3_pressure     FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange3_id AND requirement_domain_id = v_skill_id AND title = 'Technique under pressure'     AND academy_id IS NULL;
  SELECT id INTO v_r_o3_serve_intent FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange3_id AND requirement_domain_id = v_skill_id AND title = 'Serve placement intention'    AND academy_id IS NULL;
  SELECT id INTO v_r_o3_def_off      FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange3_id AND requirement_domain_id = v_skill_id AND title = 'Shot transition — defence to offence' AND academy_id IS NULL;
  SELECT id INTO v_r_o3_offensive_pat FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange3_id AND requirement_domain_id = v_comp_id AND title = 'Offensive pattern in match play' AND academy_id IS NULL;
  SELECT id INTO v_r_o3_reset_match  FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange3_id AND requirement_domain_id = v_comp_id AND title = 'Reset under match pressure'    AND academy_id IS NULL;
  SELECT id INTO v_r_o3_match_play   FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange3_id AND requirement_domain_id = v_comp_id AND title = 'Internal match play participation' AND academy_id IS NULL;
  SELECT id INTO v_r_o3_opp_weak     FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange3_id AND requirement_domain_id = v_comp_id AND title = 'Opponent weakness awareness'   AND academy_id IS NULL;
  SELECT id INTO v_r_o3_sprint       FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange3_id AND requirement_domain_id = v_fit_id  AND title = 'Sprint mechanics'              AND academy_id IS NULL;
  SELECT id INTO v_r_o3_stamina      FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange3_id AND requirement_domain_id = v_fit_id  AND title = 'Full session stamina'          AND academy_id IS NULL;
  SELECT id INTO v_r_o3_between_point FROM curriculum_track_requirements WHERE curriculum_level_id = v_orange3_id AND requirement_domain_id = v_fit_id AND title = 'Between-point recovery routine' AND academy_id IS NULL;


  -- ============================================================
  -- INSERT MAPPINGS
  -- All inserts are ON CONFLICT DO NOTHING — safe to re-run.
  -- ============================================================


  -- ── ORANGE 1 MAPPINGS ──

  -- Ready Position and Split Step → prep + athletic ready + recovery
  IF v_c_ready_pos IS NOT NULL AND v_r_o1_prep IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_ready_pos, v_r_o1_prep, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_ready_pos IS NOT NULL AND v_r_o1_athletic IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_ready_pos, v_r_o1_athletic, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- Cooperative Crosscourt Baseline Rally → rally consistency
  IF v_c_coop_rally IS NOT NULL AND v_r_o1_rally IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_coop_rally, v_r_o1_rally, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_coop_rally IS NOT NULL AND v_r_o1_dir_intent IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_coop_rally, v_r_o1_dir_intent, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- Recovery Bounce → recovery + athletic ready + effort
  IF v_c_recovery_bounce IS NOT NULL AND v_r_o1_recovery IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_recovery_bounce, v_r_o1_recovery, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_recovery_bounce IS NOT NULL AND v_r_o1_athletic IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_recovery_bounce, v_r_o1_athletic, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_recovery_bounce IS NOT NULL AND v_r_o1_effort IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_recovery_bounce, v_r_o1_effort, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- Grip Organisation → grip requirement
  IF v_c_grip_org IS NOT NULL AND v_r_o1_grip IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_grip_org, v_r_o1_grip, 'develops') ON CONFLICT DO NOTHING;
  END IF;

  -- Longest Rally Challenge → rally consistency
  IF v_c_longest_rally IS NOT NULL AND v_r_o1_rally IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_longest_rally, v_r_o1_rally, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_longest_rally IS NOT NULL AND v_r_o1_effort IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_longest_rally, v_r_o1_effort, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- Mini-Set with Scoring Practice → scoring + routine + reset
  IF v_c_mini_set IS NOT NULL AND v_r_o1_scoring IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_mini_set, v_r_o1_scoring, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_mini_set IS NOT NULL AND v_r_o1_routine IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_mini_set, v_r_o1_routine, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_mini_set IS NOT NULL AND v_r_o1_reset IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_mini_set, v_r_o1_reset, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- Target Zone Rally Game → directional intent + rally consistency
  IF v_c_target_zone IS NOT NULL AND v_r_o1_dir_intent IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_target_zone, v_r_o1_dir_intent, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_target_zone IS NOT NULL AND v_r_o1_rally IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_target_zone, v_r_o1_rally, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- 5-Ball Rally Assessment → assesses rally consistency
  IF v_c_rally_assess IS NOT NULL AND v_r_o1_rally IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_rally_assess, v_r_o1_rally, 'assesses') ON CONFLICT DO NOTHING;
  END IF;

  -- Scoring Knowledge Assessment → assesses scoring + routine
  IF v_c_scoring_assess IS NOT NULL AND v_r_o1_scoring IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_scoring_assess, v_r_o1_scoring, 'assesses') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_scoring_assess IS NOT NULL AND v_r_o1_routine IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_scoring_assess, v_r_o1_routine, 'assesses') ON CONFLICT DO NOTHING;
  END IF;


  -- ── ORANGE 2 MAPPINGS ──

  -- Crosscourt FH Direction Drill → FH dir + footwork
  IF v_c_xc_fh IS NOT NULL AND v_r_o2_fh_dir IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_xc_fh, v_r_o2_fh_dir, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_xc_fh IS NOT NULL AND v_r_o2_balance IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_xc_fh, v_r_o2_balance, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- DTL BH Direction Drill → BH dir + footwork + balance
  IF v_c_dtl_bh IS NOT NULL AND v_r_o2_bh_dir IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_dtl_bh, v_r_o2_bh_dir, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_dtl_bh IS NOT NULL AND v_r_o2_footwork IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_dtl_bh, v_r_o2_footwork, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- Serve 10 → serve reliability
  IF v_c_serve_10 IS NOT NULL AND v_r_o2_serve IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_serve_10, v_r_o2_serve, 'develops') ON CONFLICT DO NOTHING;
  END IF;

  -- Lateral Coverage → lateral + footwork
  IF v_c_lateral_cov IS NOT NULL AND v_r_o2_lateral IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_lateral_cov, v_r_o2_lateral, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_lateral_cov IS NOT NULL AND v_r_o2_footwork IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_lateral_cov, v_r_o2_footwork, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- Directional Rally Under Constraint → rally dir constraint
  IF v_c_dir_rally IS NOT NULL AND v_r_o2_rally_dir IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_dir_rally, v_r_o2_rally_dir, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_dir_rally IS NOT NULL AND v_r_o2_fh_dir IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_dir_rally, v_r_o2_fh_dir, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- Direction Battle Points → tactical pattern + FH dir
  IF v_c_dir_battle IS NOT NULL AND v_r_o2_tactical IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_dir_battle, v_r_o2_tactical, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_dir_battle IS NOT NULL AND v_r_o2_fh_dir IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_dir_battle, v_r_o2_fh_dir, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- Serve-Score Game → serve game reliability + sportsmanship
  IF v_c_serve_score IS NOT NULL AND v_r_o2_serve_game IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_serve_score, v_r_o2_serve_game, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_serve_score IS NOT NULL AND v_r_o2_sports IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_serve_score, v_r_o2_sports, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- Crosscourt King/Queen → tactical pattern + FH dir
  IF v_c_xc_king IS NOT NULL AND v_r_o2_tactical IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_xc_king, v_r_o2_tactical, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_xc_king IS NOT NULL AND v_r_o2_fh_dir IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_xc_king, v_r_o2_fh_dir, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- Directional Control Assessment → assesses FH dir + BH dir
  IF v_c_dir_assess IS NOT NULL AND v_r_o2_fh_dir IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_dir_assess, v_r_o2_fh_dir, 'assesses') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_dir_assess IS NOT NULL AND v_r_o2_bh_dir IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_dir_assess, v_r_o2_bh_dir, 'assesses') ON CONFLICT DO NOTHING;
  END IF;

  -- Serve Reliability Assessment → assesses serve
  IF v_c_serve_assess IS NOT NULL AND v_r_o2_serve IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_serve_assess, v_r_o2_serve, 'assesses') ON CONFLICT DO NOTHING;
  END IF;


  -- ── ORANGE 3 MAPPINGS ──

  -- 3-Shot Pattern Drill → 3-shot requirement
  IF v_c_3shot_drill IS NOT NULL AND v_r_o3_3shot IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_3shot_drill, v_r_o3_3shot, 'develops') ON CONFLICT DO NOTHING;
  END IF;

  -- Technique Under Pressure Rally → pressure technique
  IF v_c_pressure_rally IS NOT NULL AND v_r_o3_pressure IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_pressure_rally, v_r_o3_pressure, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_pressure_rally IS NOT NULL AND v_r_o3_3shot IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_pressure_rally, v_r_o3_3shot, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- Serve Placement Targets → serve intent
  IF v_c_serve_placement IS NOT NULL AND v_r_o3_serve_intent IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_serve_placement, v_r_o3_serve_intent, 'develops') ON CONFLICT DO NOTHING;
  END IF;

  -- Defence to Attack Transition → def-off
  IF v_c_def_att IS NOT NULL AND v_r_o3_def_off IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_def_att, v_r_o3_def_off, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_def_att IS NOT NULL AND v_r_o3_sprint IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_def_att, v_r_o3_sprint, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- Build the Point Game → 3-shot + offensive pattern
  IF v_c_build_point IS NOT NULL AND v_r_o3_3shot IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_build_point, v_r_o3_3shot, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_build_point IS NOT NULL AND v_r_o3_offensive_pat IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_build_point, v_r_o3_offensive_pat, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_build_point IS NOT NULL AND v_r_o3_pressure IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_build_point, v_r_o3_pressure, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- Offensive Pattern vs Defender → offensive pattern + opp weakness
  IF v_c_pattern_defender IS NOT NULL AND v_r_o3_offensive_pat IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_pattern_defender, v_r_o3_offensive_pat, 'develops') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_pattern_defender IS NOT NULL AND v_r_o3_opp_weak IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_pattern_defender, v_r_o3_opp_weak, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;

  -- Short Ball Attack Game → def-off + sprint + stamina
  IF v_c_short_ball IS NOT NULL AND v_r_o3_def_off IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_short_ball, v_r_o3_def_off, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_short_ball IS NOT NULL AND v_r_o3_sprint IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_short_ball, v_r_o3_sprint, 'develops') ON CONFLICT DO NOTHING;
  END IF;

  -- Internal Challenge Match → match play + reset + pressure + opp weakness + between-point routine + stamina
  IF v_c_internal_match IS NOT NULL AND v_r_o3_match_play IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_internal_match, v_r_o3_match_play, 'assesses') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_internal_match IS NOT NULL AND v_r_o3_reset_match IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_internal_match, v_r_o3_reset_match, 'assesses') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_internal_match IS NOT NULL AND v_r_o3_pressure IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_internal_match, v_r_o3_pressure, 'assesses') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_internal_match IS NOT NULL AND v_r_o3_opp_weak IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_internal_match, v_r_o3_opp_weak, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_internal_match IS NOT NULL AND v_r_o3_between_point IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_internal_match, v_r_o3_between_point, 'assesses') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_internal_match IS NOT NULL AND v_r_o3_stamina IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_internal_match, v_r_o3_stamina, 'reinforces') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_internal_match IS NOT NULL AND v_r_o3_offensive_pat IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_internal_match, v_r_o3_offensive_pat, 'assesses') ON CONFLICT DO NOTHING;
  END IF;

  -- 3-Shot Pattern Observation → assesses 3-shot
  IF v_c_3shot_obs IS NOT NULL AND v_r_o3_3shot IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_3shot_obs, v_r_o3_3shot, 'assesses') ON CONFLICT DO NOTHING;
  END IF;
  IF v_c_3shot_obs IS NOT NULL AND v_r_o3_offensive_pat IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_3shot_obs, v_r_o3_offensive_pat, 'assesses') ON CONFLICT DO NOTHING;
  END IF;

  -- Serve Placement Observation → assesses serve intent
  IF v_c_serve_obs IS NOT NULL AND v_r_o3_serve_intent IS NOT NULL THEN
    INSERT INTO curriculum_content_requirement_mappings (content_id, requirement_id, mapping_type)
    VALUES (v_c_serve_obs, v_r_o3_serve_intent, 'assesses') ON CONFLICT DO NOTHING;
  END IF;

END $$;
