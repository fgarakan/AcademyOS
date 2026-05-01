-- ============================================================
-- ACADEMY OS — MIGRATION 046: ORANGE BALL CURRICULUM CONTENT PACK
-- Seeds global-default curriculum content items for Orange 1,
-- Orange 2, and Orange 3 levels.
--
-- Content counts:
--   Orange 1 — Rally:       4 drills/skills + 3 games + 2 assessments = 9
--   Orange 2 — Direction:   5 drills/skills + 3 games + 2 assessments = 10
--   Orange 3 — Construction:4 drills/skills + 4 games + 2 assessments = 10
--
-- Idempotent via partial unique index on (level_id, content_type, title, version)
-- WHERE academy_id IS NULL — safe to re-run.
--
-- Sprint: 54 — Orange Ball Curriculum Content Pack V1
-- ============================================================

DO $$
DECLARE
  v_orange1_id  UUID;
  v_orange2_id  UUID;
  v_orange3_id  UUID;
BEGIN

  -- ────────────────────────────────────────────────────────
  -- Resolve level IDs by (stage, level_number)
  -- Never hardcode UUIDs.
  -- ────────────────────────────────────────────────────────

  SELECT id INTO v_orange1_id
    FROM curriculum_levels WHERE stage = 'orange_development' AND level_number = 1;

  SELECT id INTO v_orange2_id
    FROM curriculum_levels WHERE stage = 'orange_development' AND level_number = 2;

  SELECT id INTO v_orange3_id
    FROM curriculum_levels WHERE stage = 'orange_development' AND level_number = 3;

  IF v_orange1_id IS NULL THEN
    RAISE EXCEPTION 'curriculum_levels row not found: orange_development level 1';
  END IF;
  IF v_orange2_id IS NULL THEN
    RAISE EXCEPTION 'curriculum_levels row not found: orange_development level 2';
  END IF;
  IF v_orange3_id IS NULL THEN
    RAISE EXCEPTION 'curriculum_levels row not found: orange_development level 3';
  END IF;


  -- ============================================================
  -- ORANGE 1 — RALLY
  -- Focus: ready position, grip, cooperative rally, recovery
  -- ============================================================

  -- ── DRILLS / SKILLS ──

  INSERT INTO curriculum_content_items (
    academy_id, source_type, content_type, pathway, level_id,
    title, description,
    player_count_min, player_count_max, duration_min, duration_max,
    court_setup, equipment,
    intensity, difficulty,
    success_criteria, progressions, regressions,
    coach_cues, constraints,
    is_assessment_moment,
    parent_safe_name, parent_safe_description,
    version, is_active
  ) VALUES

  -- O1-D1
  (NULL, 'global_default', 'skill', 'skill', v_orange1_id,
   'Ready Position and Split Step',
   'Player practises the ready stance and split step before every ball. Coach feeds balls at varied pace. Player must show split step before moving to each ball.',
   2, 6, 8, 12,
   'Half court or service box area', ARRAY['cones', 'balls'],
   3, 2,
   ARRAY['Player shows a visible split step on at least 7 of 10 fed balls', 'Weight stays balanced and forward in ready stance', 'Racket stays in front at chest height between shots'],
   ARRAY['Increase feed pace so player must react faster', 'Feed to alternating sides without warning', 'Add recovery step after each shot'],
   ARRAY['Slow the feed pace', 'Use hand-feed from close range so player can see the split step timing clearly', 'Use verbal cue "split!" before each feed'],
   ARRAY['Split step as the ball leaves my hand', 'Stay on your toes, weight forward', 'Racket ready before you move'],
   ARRAY[]::TEXT[],
   false,
   'Get Ready Drill',
   'A drill where the player practises being ready and balanced before each shot.',
   1, true),

  -- O1-D2
  (NULL, 'global_default', 'drill', 'skill', v_orange1_id,
   'Cooperative Crosscourt Baseline Rally',
   'Two players rally crosscourt cooperatively from the baseline. Goal is to build rally length without errors. Coach counts rallies aloud and records best rally of the set.',
   2, 2, 10, 15,
   'Full baseline to baseline crosscourt', ARRAY['balls', 'cones for target zone'],
   4, 2,
   ARRAY['Sustain a 5+ ball crosscourt rally consistently across multiple attempts', 'Ball clears net by at least 1 foot', 'Both players recover toward centre between shots'],
   ARRAY['Increase target: 10-ball rally', 'Add a direction constraint (keep it crosscourt)', 'Reduce target zone width with cones'],
   ARRAY['Use a shorter court (service line to service line)', 'Use a foam ball or softer ball for easier timing', 'Lower the net with a net strap'],
   ARRAY['Hit it soft and safe over the net', 'Aim for the middle of the crosscourt half', 'Recover after every shot — do not watch the ball'],
   ARRAY['Must land in the crosscourt half', 'No winners — just cooperate']::TEXT[],
   false,
   'Crosscourt Rally',
   'A rally exercise where players try to keep the ball going as long as possible together.',
   1, true),

  -- O1-D3
  (NULL, 'global_default', 'drill', 'fitness', v_orange1_id,
   'Recovery Bounce After Every Shot',
   'After each shot in a rally or drill, the player must take a visible recovery bounce or shuffle step toward the centre mark before the next ball arrives. Coach highlights and praises every recovery step.',
   2, 4, 8, 10,
   'Baseline area', ARRAY['balls'],
   3, 1,
   ARRAY['Player makes a visible recovery move after at least 8 of 10 shots', 'Recovery starts within one second of contact', 'Player is positioned near centre before next ball lands'],
   ARRAY['Player calls out "recover!" after each shot to self-cue', 'Feed more frequently to increase pressure', 'Add a cone at the centre mark — player must touch it after each shot'],
   ARRAY['Rally cooperatively from slower feed', 'Coach points explicitly after each shot to remind player to move'],
   ARRAY['Hit it and move — every single time', 'Bounce on the spot to reset your feet', 'Get back to the middle before the next ball'],
   ARRAY[]::TEXT[],
   false,
   'Move After Every Shot',
   'A drill that builds the habit of moving after every shot to stay in good court position.',
   1, true),

  -- O1-D4
  (NULL, 'global_default', 'skill', 'skill', v_orange1_id,
   'Grip Organisation FH to BH Switch',
   'Player holds racket in forehand grip. Coach signals "forehand" or "backhand". Player adjusts grip appropriately before making any shot. Can be done shadow (no ball) or with slow feed.',
   2, 6, 6, 10,
   'Any surface — can be done without a court', ARRAY['rackets'],
   2, 2,
   ARRAY['Player adjusts grip visibly without looking down at the racket', 'Grip change complete before racket is raised to backswing', 'No prompting needed from coach'],
   ARRAY['Add ball feed after the signal — player must change grip AND hit', 'Speed up the signal timing', 'Combine with split step (split → signal → change grip → move)'],
   ARRAY['Allow player to look at the racket briefly', 'Use verbal signals instead of hand signals', 'Do shadow only with no feed pressure'],
   ARRAY['Shake hands with the racket for forehand', 'Slide two fingers for backhand', 'Change the grip before you swing — not during'],
   ARRAY[]::TEXT[],
   false,
   'Grip Switching Drill',
   'A practice activity where the player learns to adjust their grip correctly for different shots.',
   1, true),

  -- ── GAMES ──

  -- O1-G1
  (NULL, 'global_default', 'game', 'mixed', v_orange1_id,
   'Longest Rally Challenge',
   'Both players cooperate to reach the longest possible rally from the baseline. Coach counts and records. Players celebrate every new personal best. Can be played as a group challenge (everyone tries to beat the group record).',
   2, 6, 10, 15,
   'Full crosscourt baseline', ARRAY['balls'],
   3, 1,
   ARRAY['Players achieve a 5+ ball rally', 'Players celebrate effort not just the number', 'Both players recover and stay focused through the rally'],
   ARRAY['Set a group record target and try to beat it across the session', 'Add one direction constraint: must land in a designated zone', 'Player who breaks the rally does 5 recovery bounces as a fun reset'],
   ARRAY['Use a shorter court or slower ball', 'Both players start from service line not baseline', 'Count from 1 on each shot together'],
   ARRAY['Every ball back is a win — not every winner', 'Stay calm — do not rush', 'Communicate with your partner: "I see it", "I have it"'],
   ARRAY['Cooperative — no winners allowed', 'Count aloud together']::TEXT[],
   false,
   'Longest Rally Game',
   'A fun challenge where two players work together to see how many times they can hit the ball back and forth.',
   1, true),

  -- O1-G2
  (NULL, 'global_default', 'game', 'competition', v_orange1_id,
   'Mini-Set with Scoring Practice',
   'Play a short set (first to 4 games or tiebreak to 7) where the coach emphasises correct scoring throughout. Coach asks players to call the score before each point. If score is wrong, coach corrects without penalty and play continues.',
   2, 2, 15, 20,
   'Orange court (if available) or half of a standard court', ARRAY['balls'],
   4, 2,
   ARRAY['Player can call the score correctly before at least 8 of 10 points', 'Player corrects own scoring mistakes without coach prompting by end of set', 'Player demonstrates basic pre-point routine (bounce, breath, or similar)'],
   ARRAY['Play a full set without any scoring assistance', 'Add a tiebreak and verify player knows the format', 'Player must call the complete score before each serve'],
   ARRAY['Use a simplified format: first to 4 points in a game (no deuce)', 'Coach calls the score and player repeats it', 'Reduce to a 5-point tiebreak'],
   ARRAY['Say the score before every serve — both players', 'Remember: server calls first', 'A mistake on the score is fine — just correct it and keep going'],
   ARRAY['Serve must land in the correct service box', 'Both players must agree on the score before each point']::TEXT[],
   true,
   'Scoring Practice Game',
   'A short tennis game where both players practise calling the score correctly.',
   1, true),

  -- O1-G3
  (NULL, 'global_default', 'game', 'mixed', v_orange1_id,
   'Target Zone Rally Game',
   'Players rally cooperatively with the goal of landing in designated target zones (marked with cones). When a player lands in the zone, they score a point. Game to 5 cooperative zone points — not competitive.',
   2, 4, 10, 15,
   'Half court with 2–4 cones marking target zones', ARRAY['balls', 'cones'],
   3, 2,
   ARRAY['At least 3 of 10 shots land in the target zone', 'Player aims deliberately rather than just returning', 'Both players communicate about where they are hitting'],
   ARRAY['Shrink the target zone', 'Add a direction constraint: must hit crosscourt target zone', 'Keep a running tally and try to beat the last round'],
   ARRAY['Enlarge the target zone significantly', 'Use the deuce or ad court half as the entire target zone', 'Feed from hand to give easy balls to aim at'],
   ARRAY['Aim for the back corner of the zone', 'Think before you hit — where are you going?', 'Get your feet in position before you swing'],
   ARRAY['Target zone must be in the crosscourt half', 'No overhead smashes']::TEXT[],
   false,
   'Target Zone Rally',
   'A drill game where players aim for specific areas of the court while keeping the rally going.',
   1, true),

  -- ── ASSESSMENTS ──

  -- O1-A1
  (NULL, 'global_default', 'assessment', 'skill', v_orange1_id,
   '5-Ball Rally Consistency Assessment',
   'Coach feeds 10 balls at moderate pace from across the net. Player attempts to sustain each ball in a cooperative rally. Assessment passes if player achieves a 5+ ball rally on at least 2 of 10 attempts.',
   2, 2, 8, 10,
   'Baseline rally — full width', ARRAY['balls'],
   3, 2,
   ARRAY['Player achieves 5+ ball rally on at least 2 of 10 assessed attempts', 'Contact is made with the racket face, not the frame', 'Ball clears net every shot in the successful rally'],
   ARRAY[]::TEXT[],
   ARRAY[]::TEXT[],
   ARRAY['Watch the ball all the way to the racket', 'Swing smooth and low-to-high', 'Do not rush — let the ball come to you'],
   ARRAY[]::TEXT[],
   true,
   'Rally Assessment',
   'A short assessment where the player tries to keep the ball going several times in a row.',
   1, true),

  -- O1-A2
  (NULL, 'global_default', 'assessment', 'competition', v_orange1_id,
   'Scoring Knowledge Assessment',
   'Coach plays a 4-game mini-set with the player and asks them to call the score before every point. Coach notes whether player self-corrects scoring without prompting. No penalty for errors — assessment is observational.',
   2, 2, 10, 12,
   'Orange court or standard court service boxes', ARRAY['balls'],
   3, 1,
   ARRAY['Player can call the game score correctly before at least 8 of 10 points', 'Player self-corrects when they call the wrong score at least once', 'Player shows a brief pre-point routine (does not rush serve or return)'],
   ARRAY[]::TEXT[],
   ARRAY[]::TEXT[],
   ARRAY['Say the score before every serve', 'If you are not sure — ask', 'A routine before each point helps you concentrate'],
   ARRAY[]::TEXT[],
   true,
   'Scoring Check',
   'A short check where the coach watches whether the player can call the score correctly during a real game.',
   1, true)

  ON CONFLICT ON CONSTRAINT idx_curriculum_content_items_global_unique DO NOTHING;


  -- ============================================================
  -- ORANGE 2 — DIRECTION
  -- Focus: crosscourt/DTL direction, serve reliability, footwork
  -- ============================================================

  INSERT INTO curriculum_content_items (
    academy_id, source_type, content_type, pathway, level_id,
    title, description,
    player_count_min, player_count_max, duration_min, duration_max,
    court_setup, equipment,
    intensity, difficulty,
    success_criteria, progressions, regressions,
    coach_cues, constraints,
    is_assessment_moment,
    parent_safe_name, parent_safe_description,
    version, is_active
  ) VALUES

  -- O2-D1
  (NULL, 'global_default', 'drill', 'skill', v_orange2_id,
   'Crosscourt Forehand Direction Drill',
   'Coach feeds 10 balls to the player''s forehand side. Player directs each shot crosscourt to a marked target zone. Coach counts successes. Players aim for 6 of 10 in zone.',
   2, 4, 10, 12,
   'Baseline forehand corner with crosscourt target zone marked with cones', ARRAY['balls', 'cones'],
   4, 3,
   ARRAY['6 of 10 forehand shots land in the crosscourt target zone', 'Player sets up with proper stance before each contact', 'Contact point is in front of the body'],
   ARRAY['Add a rally: player must keep the directional rally going for 3 shots', 'Reduce target zone width', 'Feed from different positions to force footwork'],
   ARRAY['Enlarge target zone to full crosscourt half', 'Feed from short distance (standing at service line)', 'Allow player to walk into each shot without footwork'],
   ARRAY['Lead with your shoulder to direct the shot', 'Contact point in front — not beside you', 'Finish high toward the target zone'],
   ARRAY['Ball must cross the singles sideline to count', 'No down-the-line shots during this drill']::TEXT[],
   false,
   'Crosscourt Forehand Drill',
   'A drill where the player practises hitting their forehand to the diagonal side of the court.',
   1, true),

  -- O2-D2
  (NULL, 'global_default', 'drill', 'skill', v_orange2_id,
   'Down-the-Line Backhand Direction Drill',
   'Coach feeds 10 balls to the player''s backhand side. Player directs each shot down-the-line. Target zone is the DTL singles corridor. Coach counts successes. Players aim for 5 of 10 in zone.',
   2, 4, 10, 12,
   'Baseline backhand corner with DTL target zone marked', ARRAY['balls', 'cones'],
   4, 3,
   ARRAY['5 of 10 backhand shots land in the down-the-line target zone', 'Player rotates shoulders to direct the shot', 'Minimal hesitation between decision and swing'],
   ARRAY['Add a directional rally: alternate crosscourt and DTL shots', 'Feed more difficult wide balls to force footwork', 'Reduce target zone width'],
   ARRAY['Enlarge the zone to the full DTL half', 'Feed from close range with hand', 'Allow two-hand or one-hand backhand — player chooses'],
   ARRAY['Turn your shoulders early to load', 'Keep the racket face open for DTL direction', 'Push through the shot to the DTL corner'],
   ARRAY['Ball must land in the DTL singles corridor', 'Count only shots that clear the net cleanly']::TEXT[],
   false,
   'Down-the-Line Backhand Drill',
   'A drill where the player practises hitting their backhand down the side of the court.',
   1, true),

  -- O2-D3
  (NULL, 'global_default', 'drill', 'skill', v_orange2_id,
   'Serve Into the Box — 10 Serves',
   'Player serves 10 balls to the correct service box (alternating deuce and ad). Coach counts in-court serves. Passing standard is 6 of 10 in-court. Focus is reliability, not speed or placement.',
   2, 4, 10, 15,
   'Standard serve court (deuce and ad)', ARRAY['balls'],
   3, 3,
   ARRAY['6 of 10 serves land in the correct service box', 'Ball toss is consistent and in front of the body', 'Player uses full arm swing — no pat-a-cake serve'],
   ARRAY['Increase target: 8 of 10 in court', 'Add a placement constraint: serve to T or wide', 'Add second serve pressure: if first serve is out, second must go in'],
   ARRAY['Move player closer to the service line (shorter court)', 'Allow underhand serve first to build confidence', 'Lower the net with a strap and raise target from there'],
   ARRAY['Toss in front and slightly to your racket side', 'Reach up to the highest point — not out to the side', 'Accelerate through contact, do not slow down'],
   ARRAY['Only first serves count for this drill', 'Must be in correct deuce or ad box']::TEXT[],
   false,
   '10 Serves Practice',
   'A serving drill where the player tries to get as many serves into the correct box as possible.',
   1, true),

  -- O2-D4
  (NULL, 'global_default', 'drill', 'fitness', v_orange2_id,
   'Lateral Coverage and Wide Ball Recovery',
   'Coach feeds balls wide to both sides forcing lateral movement. Player must reach each ball using side-shuffle or crossover footwork (not reaching across the body). 10 feeds, 5 each side.',
   2, 4, 10, 12,
   'Baseline with wide targets on both sides', ARRAY['balls', 'cones'],
   6, 2,
   ARRAY['Player uses lateral footwork (shuffle or crossover) on at least 7 of 10 wide balls', 'Player reaches the ball and makes contact (does not let it pass)', 'Recovery step follows each contact'],
   ARRAY['Feed wider balls that require full crossover runs', 'Increase feed pace', 'Add a centre cone — player must touch it after each wide ball recovery'],
   ARRAY['Feed just outside the comfort zone (not fully wide)', 'Give a verbal cue "left!" or "right!" before each feed', 'Allow player to take extra steps if needed'],
   ARRAY['Side-step, do not cross your legs until you need to sprint', 'Get your feet to the ball — reach only as a last resort', 'After contact — recover immediately'],
   ARRAY[]::TEXT[],
   false,
   'Wide Ball Chase Drill',
   'A movement drill where the player practises running wide to reach balls and recovering back.',
   1, true),

  -- O2-D5
  (NULL, 'global_default', 'drill', 'skill', v_orange2_id,
   'Directional Rally Under Constraint',
   'Two players rally cooperatively keeping the ball crosscourt for a target of 5+ shots. If ball goes down-the-line or out of the crosscourt zone, the rally resets. Coach counts completed constrained rallies.',
   2, 2, 10, 12,
   'Full crosscourt baseline', ARRAY['balls'],
   4, 3,
   ARRAY['Players sustain a 5-ball crosscourt constrained rally at least twice in the set', 'Both players direct intentionally — not just hoping it goes crosscourt', 'Both players recover to base position after each shot'],
   ARRAY['Increase to 8-ball target', 'Add a second constraint: at least 1 metre from the sideline', 'Both players play competitively but must keep direction constraint'],
   ARRAY['Allow one DTL miss per rally before resetting', 'Use a shorter court', 'Reduce to 3-ball crosscourt target'],
   ARRAY['Aim every shot — decide before you swing', 'Recover to the centre — not to the ball you just hit', 'Talk to your partner: tell them where you are going'],
   ARRAY['Ball must land in the crosscourt half to continue the rally', 'Ball going down-the-line resets to 0']::TEXT[],
   false,
   'Direction Rally Challenge',
   'A rally exercise where both players have to keep the ball going in one direction.',
   1, true),

  -- ── GAMES ──

  -- O2-G1
  (NULL, 'global_default', 'game', 'competition', v_orange2_id,
   'Direction Battle Points',
   'Play points where the director designates a direction constraint for each point (e.g., "this point is crosscourt only"). Player earns a bonus point if they successfully use the direction. Regular scoring applies.',
   2, 2, 15, 20,
   'Full singles court (or orange court)', ARRAY['balls'],
   5, 3,
   ARRAY['Player earns at least 3 of 10 bonus direction points in the game', 'Player attempts the direction on each designated point (even if unsuccessful)', 'Player demonstrates a recognisable tactical choice before playing each point'],
   ARRAY['Make all points directional (no free-choice points)', 'Add a second constraint: must hit at least 2 balls before changing direction', 'Give player the direction choice — they must communicate it before serving'],
   ARRAY['Give player a very open target (any crosscourt shot counts)', 'Signal the direction constraint immediately before the point — no time pressure', 'Allow player to win point any way — direction only earns bonus'],
   ARRAY['Decide your direction before the point starts', 'If in doubt, keep it crosscourt', 'Do not change direction mid-point — commit'],
   ARRAY['Direction constraint applies to third ball onwards (first two are free)']::TEXT[],
   false,
   'Direction Challenge Game',
   'A game where the player earns extra points by hitting the ball in the right direction.',
   1, true),

  -- O2-G2
  (NULL, 'global_default', 'game', 'competition', v_orange2_id,
   'Serve-Score Game',
   'Short competitive game starting every point with a serve. Player serves both deuce and ad court. Game tracks how many first serves land in during real game conditions (not just isolated drill). Also tracks whether serve errors are corrected on second serve.',
   2, 2, 15, 20,
   'Full court', ARRAY['balls'],
   5, 3,
   ARRAY['Player lands at least 2 of 3 first serves in-court per game', 'Player never double-faults more than twice in a 4-game set', 'Player shows visible routine before serving'],
   ARRAY['Track first serve percentage game by game and share with player', 'Add a placement challenge: server calls T or wide before each serve', 'Play a full set tiebreak — serve matters more under pressure'],
   ARRAY['Give the player 2 first serves for each point (no second serve pressure)', 'Play from service line (shorter distance) if needed', 'Focus only on getting serve in — not placement or pace'],
   ARRAY['Take your time before the serve — no rush', 'Use your routine: bounce the ball, take a breath', 'Second serve must be reliable — slow it down'],
   ARRAY['Regular competitive scoring', 'No serve clock — but player must serve within 10 seconds of the coach''s signal']::TEXT[],
   false,
   'Serve Practice Game',
   'A short game where players pay special attention to how often their serve goes in.',
   1, true),

  -- O2-G3
  (NULL, 'global_default', 'game', 'mixed', v_orange2_id,
   'Crosscourt King / Queen',
   'Competitive game to 11 points where all scoring shots must land crosscourt to earn a point. A down-the-line winner earns 0. Coach tracks crosscourt points separately. Both players have equal constraint.',
   2, 4, 15, 20,
   'Full singles court', ARRAY['balls'],
   5, 3,
   ARRAY['Player earns at least 4 crosscourt scoring points in the game', 'Player demonstrates recognisable directional intent on attacking shots', 'Player recovers to the centre after directional shots'],
   ARRAY['King/Queen of the court format: rotate in a new player each game', 'Add a second scoring zone for reward (bonus for landing in designated target)', 'Introduce an error penalty: DTL shot earns opponent a point'],
   ARRAY['Allow one DTL winner per game', 'Play to 7 instead of 11', 'Cooperative version: both players cooperate to earn points together'],
   ARRAY['Crosscourt is the percentage shot — use it', 'Open up the angle on crosscourt attacks', 'Move your opponent wide then attack the open court'],
   ARRAY['Scoring shot must land crosscourt to count', 'DTL winners are valid but do not score']::TEXT[],
   false,
   'Crosscourt Challenge Game',
   'A fun game where players score extra points by hitting the ball across the court.',
   1, true),

  -- ── ASSESSMENTS ──

  -- O2-A1
  (NULL, 'global_default', 'assessment', 'skill', v_orange2_id,
   'Directional Control Assessment',
   'Coach feeds 10 balls to each wing (20 total). Player directs each shot to the called zone (crosscourt or DTL). Coach counts successful direction attempts. FH target: 6/10 crosscourt. BH target: 5/10 DTL.',
   2, 2, 12, 15,
   'Full baseline, alternate forehand and backhand feeds', ARRAY['balls', 'cones'],
   3, 3,
   ARRAY['6 of 10 forehand shots land in the crosscourt target', '5 of 10 backhand shots land in the down-the-line target', 'Player demonstrates deliberate directional intent — not just aiming generally'],
   ARRAY[]::TEXT[],
   ARRAY[]::TEXT[],
   ARRAY['Aim at a specific cone — not just a general direction', 'Set up your feet first, then swing', 'Where your shoulder faces — that is where the ball goes'],
   ARRAY[]::TEXT[],
   true,
   'Direction Accuracy Assessment',
   'A check where the player shows that they can hit the ball where they intend to.',
   1, true),

  -- O2-A2
  (NULL, 'global_default', 'assessment', 'skill', v_orange2_id,
   'Serve Reliability Assessment',
   'Player serves 10 balls to the deuce box and 10 to the ad box (20 total first serves). Coach counts in-court serves for each side. Target: 6 of 10 to each box. Observation focuses on consistency, not pace.',
   2, 2, 10, 12,
   'Standard serve court', ARRAY['balls'],
   3, 2,
   ARRAY['6 of 10 first serves land in the deuce service box', '6 of 10 first serves land in the ad service box', 'Ball toss is in front and consistent across all 20 attempts'],
   ARRAY[]::TEXT[],
   ARRAY[]::TEXT[],
   ARRAY['Same toss every time', 'Reach for the highest point', 'Swing through — do not slow down at contact'],
   ARRAY[]::TEXT[],
   true,
   'Serving Assessment',
   'A check where the player shows how many times they can get their serve into the right box.',
   1, true)

  ON CONFLICT ON CONSTRAINT idx_curriculum_content_items_global_unique DO NOTHING;


  -- ============================================================
  -- ORANGE 3 — CONSTRUCTION
  -- Focus: 3-shot patterns, pressure technique, serve placement,
  --        defence-to-offence, point construction
  -- ============================================================

  INSERT INTO curriculum_content_items (
    academy_id, source_type, content_type, pathway, level_id,
    title, description,
    player_count_min, player_count_max, duration_min, duration_max,
    court_setup, equipment,
    intensity, difficulty,
    success_criteria, progressions, regressions,
    coach_cues, constraints,
    is_assessment_moment,
    parent_safe_name, parent_safe_description,
    version, is_active
  ) VALUES

  -- O3-D1
  (NULL, 'global_default', 'drill', 'skill', v_orange3_id,
   'Three-Shot Pattern Drill',
   'Coach sets up a specific 3-shot pattern and player executes it repeatedly. Example pattern: serve to deuce T → return to middle → forehand attack crosscourt. Player executes the pattern 10 times. Coach notes intent and execution.',
   2, 4, 12, 15,
   'Full court — deuce side serve and return', ARRAY['balls', 'cones for target zones'],
   5, 4,
   ARRAY['Player completes the full 3-shot sequence with visible intent on at least 5 of 10 attempts', 'Each shot in the sequence is directed to a recognisable zone (not random)', 'Player recovers after shot 3 ready for the next sequence'],
   ARRAY['Add a 4th shot to the pattern', 'Play the pattern against a real opponent who responds to each shot', 'Vary the starting serve position (deuce, ad) and adjust pattern accordingly'],
   ARRAY['Reduce to 2-shot pattern first', 'Coach feeds shots 2 and 3 instead of using a live hitter', 'Walk through the pattern slowly before hitting'],
   ARRAY['Know all three shots before you start the point', 'Shot 1 is the setup, shot 2 is the setup, shot 3 is the opportunity', 'If the pattern breaks down — recover and reset for the next point'],
   ARRAY['Must use the designated pattern for each point', 'If shot 1 or 2 goes wrong, reset and try again next point']::TEXT[],
   false,
   '3-Shot Pattern Drill',
   'A drill where the player practises using a planned sequence of three shots.',
   1, true),

  -- O3-D2
  (NULL, 'global_default', 'drill', 'skill', v_orange3_id,
   'Technique Under Pressure Rally',
   'Player rallies cooperatively at Orange 3 rally tempo (faster than Orange 1/2). After 5 balls, coach introduces a competitive point. Player must maintain technique through the transition from cooperative to competitive. Coach watches for technique breakdown.',
   2, 2, 12, 15,
   'Full baseline rally', ARRAY['balls'],
   6, 4,
   ARRAY['Player maintains consistent stroke shape through at least 5 of 8 cooperative-to-competitive transitions', 'No visible mechanics breakdown on the first competitive ball', 'Player recovers position after competitive exchange'],
   ARRAY['Reduce cooperative warm-up to 3 balls before transition', 'Add explicit competitive pressure: winner of the competitive exchange earns a point', 'Rally from slightly inside the baseline to create more time pressure'],
   ARRAY['Increase the cooperative warm-up to 8–10 balls', 'No winner on the competitive ball — just observe if technique holds', 'Coach gives a verbal "now" cue before going competitive'],
   ARRAY['Technique stays the same when the ball speeds up', 'Keep your backswing — do not punch or block under pressure', 'Stay tall — do not lean forward and rush'],
   ARRAY['First 5 balls cooperative', 'Points are live from ball 6 onwards']::TEXT[],
   false,
   'Pressure Rally Drill',
   'A rally drill that switches from cooperative hitting to real competition, testing if the player can keep their technique.',
   1, true),

  -- O3-D3
  (NULL, 'global_default', 'drill', 'skill', v_orange3_id,
   'Serve Placement Targets — Deuce and Ad',
   'Player serves 10 balls to the deuce court and 10 to the ad court. For each side, the target is either the T or the wide target (coach rotates which). Player calls their intended target before serving. Coach records intention vs result.',
   2, 4, 12, 15,
   'Full serve court — deuce and ad', ARRAY['balls', 'cones for T and wide targets'],
   4, 4,
   ARRAY['Player calls correct target before each serve (intention)', 'At least 5 of 10 serves land in the called target zone for each side', 'Ball toss remains consistent across placement attempts'],
   ARRAY['Add live pressure: opponent returns serves and the rally continues', 'Increase to 8 of 10 target hits for advancement', 'Player chooses their own target combination (not coach-assigned)'],
   ARRAY['Allow player to aim for the general box (not specific T/wide)', 'Slow the serve to place with control', 'Player calls target after looking at it, then serves'],
   ARRAY['Ball toss is the same regardless of where you are aiming', 'Use your body rotation to move the placement — not your arm', 'Call the target out loud — commit before you serve'],
   ARRAY['Player must call target before serving', 'No second serves — first serve only for this drill']::TEXT[],
   false,
   'Serve Placement Drill',
   'A practice activity where the player picks a target area and tries to serve to it.',
   1, true),

  -- O3-D4
  (NULL, 'global_default', 'drill', 'mixed', v_orange3_id,
   'Defence to Attack Transition Drill',
   'Coach feeds a wide, deep defensive ball. Player retrieves it defensively (slice, lob, or high-clearance). Coach then feeds a shorter ball. Player must attack the short ball and finish the point. Repeats 10 times.',
   2, 4, 12, 15,
   'Full court — baseline and mid-court areas', ARRAY['balls', 'cones for target on short ball'],
   6, 4,
   ARRAY['Player retrieves the wide defensive ball and gets it back in-court on at least 7 of 10 attempts', 'Player recognises and moves to the short ball on at least 6 of 10 sequences', 'Player attacks the short ball with visible offensive intent at least 4 of 10 times'],
   ARRAY['Feed a faster defensive ball requiring more urgency', 'Vary where the short ball is placed (forehand, backhand, middle)', 'Live play: feeder responds naturally and player must read the short ball in a rally'],
   ARRAY['Make the defensive ball easier (feed wide but not too deep)', 'Feed the short ball before the player finishes the defensive shot', 'Allow player to stand closer to centre after the defensive shot'],
   ARRAY['First ball: just get it back — survival shot', 'Read the next ball early — start moving when the ball bounces not when it hits your racket', 'Attack the short ball to the open court — do not go to the covered corner'],
   ARRAY['Defensive ball must be returned in-court to continue', 'Short ball attack must be to the open court side']::TEXT[],
   false,
   'Defend Then Attack Drill',
   'A drill where the player practises getting out of trouble and then taking control of the point.',
   1, true),

  -- ── GAMES ──

  -- O3-G1
  (NULL, 'global_default', 'game', 'competition', v_orange3_id,
   'Build the Point Game',
   'Points are only scored if the winner used a recognisable 3-shot pattern to construct the point. Sudden winners (1-shot rally enders) score 0. Coach monitors patterns and confirms scoring. Both players play competitively.',
   2, 2, 15, 20,
   'Full singles court', ARRAY['balls'],
   6, 4,
   ARRAY['Player earns at least 4 of 10 points via a recognisable 3-shot pattern', 'Player demonstrates tactical patience — does not rush to end points early', 'Player recovers after each shot in the pattern'],
   ARRAY['Require a named pattern (player declares it before serving)', 'Increase to 5-shot minimum for full score', 'Track patterns per game and chart progress over a session'],
   ARRAY['Allow 2-shot constructions to score (lower bar)', 'Play cooperatively first to practice patterns, then switch to competitive', 'Coach names the pattern before each point for both players'],
   ARRAY['Be patient — patterns take more than one shot', 'Shot 1 creates the opening, shot 2 exploits it, shot 3 closes it', 'Do not go for the winner too early'],
   ARRAY['Sudden winner = no score, must play the point again', 'If player wins in 1 or 2 shots — 0 score, new point']::TEXT[],
   false,
   'Build the Point Game',
   'A game where players earn points by using a planned sequence of shots to win each rally.',
   1, true),

  -- O3-G2
  (NULL, 'global_default', 'game', 'competition', v_orange3_id,
   'Offensive Pattern vs Baseline Defender',
   'Attacker uses their designated offensive pattern to try to win points against a baseline defender. Defender tries to disrupt the pattern and extend the rally. Rotate roles every 5 points. Coach tracks patterns used and success rate.',
   2, 4, 15, 20,
   'Full singles court', ARRAY['balls'],
   6, 4,
   ARRAY['Attacker successfully completes the pattern on at least 3 of 10 attacking sequences', 'Defender disrupts at least 2 patterns by recovering wide balls', 'Both players demonstrate positional awareness (where to be on the court)'],
   ARRAY['Add a 3rd player as a neutral ball feeder to feed the starting ball', 'Require attacker to use a different pattern each rotation', 'Play tiebreak format: first to 7, alternate attack/defend roles every 4 points'],
   ARRAY['Reduce to 2-shot patterns for the attacker', 'Allow attacker to communicate the pattern to the defender before the point (shared awareness)'],
   ARRAY['Attack the corner the defender is NOT covering', 'Keep the pattern alive even when the defender reaches one shot', 'If the pattern breaks — defend and look for the next opportunity'],
   ARRAY['Attacker serves and immediately implements their pattern', 'Defender may not come to net']::TEXT[],
   false,
   'Pattern Attack Game',
   'A game where one player practises using planned shot sequences while the other tries to stop them.',
   1, true),

  -- O3-G3
  (NULL, 'global_default', 'game', 'mixed', v_orange3_id,
   'Short Ball Attack Game',
   'Both players rally from the baseline. When either player gets a ball above the net or landing in the service box, they must attack it. Coach signals "attack!" to help players recognise the opportunity. Players earn bonus points for successful attacks.',
   2, 4, 15, 20,
   'Full singles court', ARRAY['balls'],
   6, 4,
   ARRAY['Player recognises and moves forward on at least 4 of 10 identified short balls', 'Player attacks the short ball with an approach or winner — not a defensive push', 'Player follows the attack to a net position on at least 3 of 10 approaches'],
   ARRAY['Remove coach "attack!" signal — player must self-identify', 'Add a net finish requirement: after attacking, player must win from net', 'Coach signals "attack!" before the ball lands so player must anticipate'],
   ARRAY['Coach signals "attack!" after the ball bounces', 'Attack must only go to an open court — wide target allowed', 'Allow player to only approach, not finish, from the net'],
   ARRAY['Short ball = move forward, do not stay on baseline', 'Step into the short ball — do not back up', 'After the approach — split step and get ready at net'],
   ARRAY['Short ball attack must go to open court', 'Defensive push on a short ball = 0 bonus points']::TEXT[],
   false,
   'Short Ball Attack Game',
   'A game where players learn to recognise balls they can attack and move forward on them.',
   1, true),

  -- O3-G4
  (NULL, 'global_default', 'game', 'competition', v_orange3_id,
   'Internal Challenge Match — Orange 3 Format',
   'A mini internal match (first to win 2 sets of 4 games each, tiebreak at 3-all) between two Orange 3 players. Coach observes patterns, resets, technique under pressure, and sportsmanship. Assessment notes taken for multiple requirements.',
   2, 2, 30, 45,
   'Full singles court', ARRAY['balls'],
   7, 4,
   ARRAY['Player demonstrates at least one recognisable offensive pattern during the match', 'Player applies a reset routine (breath, bounce, ready) after at least 3 errors', 'Player maintains technique (no total breakdown) through the third game of each set'],
   ARRAY['Play a full practice set (first to 6 with tiebreak)', 'Add a pre-match tactical brief: each player declares one pattern they will use', 'Coach identifies one pattern to watch for each player and reports back after'],
   ARRAY['Play a 7-point tiebreak format only (lower pressure)', 'Coach interjects with coaching after each game (not during points)', 'Play doubles format with 2v2 to reduce individual pressure'],
   ARRAY['Use your pre-point routine on every single point', 'Play your patterns — not just the ball that comes to you', 'After a mistake: breathe, bounce the racket strings, reset — every time'],
   ARRAY['Standard Rules of Tennis apply', 'Players call their own lines', 'Coach observes only — no tactical input during points']::TEXT[],
   true,
   'Internal Match',
   'A practice match where two players compete and the coach watches how they play.',
   1, true),

  -- ── ASSESSMENTS ──

  -- O3-A1
  (NULL, 'global_default', 'assessment', 'skill', v_orange3_id,
   'Three-Shot Pattern Observation',
   'Coach observes the player across 2 sessions and specifically watches for evidence of deliberate 3-shot sequences. Coach notes when patterns are attempted vs when they succeed. Not a formal isolated drill — contextual observation during drills and games.',
   2, 6, 20, 30,
   'Any drill or game context', ARRAY['balls'],
   5, 4,
   ARRAY['Player demonstrates at least one intentional 3-shot pattern across two observed sessions', 'Pattern is recognisable (has a logical sequence, not random)', 'Player attempts the pattern again after a failed first attempt'],
   ARRAY[]::TEXT[],
   ARRAY[]::TEXT[],
   ARRAY['Think about your plan before each point', 'Every point should have a "shot 1, shot 2, shot 3" intention', 'Share your pattern with your coach before the drill starts'],
   ARRAY[]::TEXT[],
   true,
   'Pattern Observation Check',
   'A check where the coach watches the player across two practices to see if they use planned shot sequences.',
   1, true),

  -- O3-A2
  (NULL, 'global_default', 'assessment', 'skill', v_orange3_id,
   'Serve Placement Observation',
   'Across two serving sessions, coach observes whether player shows consistent intent to serve to a designated side (deuce T or wide; ad T or wide). Requires player to call their target before each serve. Assessment checks both intent and execution.',
   2, 2, 12, 15,
   'Standard serve court', ARRAY['balls', 'cones for T and wide'],
   3, 3,
   ARRAY['Player calls their target before at least 8 of 10 serves', 'At least 5 of 10 called serves land in the called zone', 'Ball toss remains consistent regardless of intended placement'],
   ARRAY[]::TEXT[],
   ARRAY[]::TEXT[],
   ARRAY['Say the target before you toss — commit first', 'Same toss, same swing — direction comes from rotation', 'Track your score: how often do you go where you intended?'],
   ARRAY[]::TEXT[],
   true,
   'Serve Placement Check',
   'A check where the coach observes whether the player can serve to the area they intend.',
   1, true)

  ON CONFLICT ON CONSTRAINT idx_curriculum_content_items_global_unique DO NOTHING;

END $$;
