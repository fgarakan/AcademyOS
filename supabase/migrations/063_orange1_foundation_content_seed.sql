-- ============================================================
-- ACADEMY OS - MIGRATION 063: ORANGE 1 FOUNDATION CONTENT SEED
-- Seeds one complete curriculum proof level: Orange 1 - Rally.
--
-- WHY:
--   Seeding one level deeply proves the lesson-plan engine and
--   gives directors a real content library to draw lesson plans
--   from. All rows are global platform defaults (academy_id NULL).
--
-- CONTENT PLAN (≈46 rows):
--   Technical drills           6  (content_type = 'drill')
--   Warmup activities          2  (content_type = 'warmup')
--   Tactical games             5  (content_type = 'tactical_game')
--   Situationals               5  (content_type = 'situational')
--   Match-play themes          4  (content_type = 'match_play_theme')
--   Mental skills              4  (content_type = 'mental_skill')
--   Competition behaviors      3  (content_type = 'competition_behavior')
--   Coach cues (internal)      5  (content_type = 'coach_cue', is_coach_only = true)
--   Success criteria           3  (content_type = 'success_criteria', is_coach_only = true)
--   Progressions               3  (content_type = 'progression')
--   Regressions                3  (content_type = 'regression')
--   Player mission             2  (content_type = 'player_mission', is_player_visible = false)
--   Parent guidance            2  (content_type = 'parent_guidance', is_parent_visible = false)
--
-- SAFETY:
--   academy_id = NULL  → global default, visible to all staff
--   ON CONFLICT DO NOTHING - idempotent re-runs safe
--   is_player_visible = false (default) on all rows
--   is_parent_visible = false (default) on all rows
--   parent/player portals remain unaffected
--
-- DEPENDENCY:
--   migration 061 must be applied (adds domain, session_block_hint,
--   ball_level, is_player_visible, is_parent_visible, is_coach_only)
--   migration 036 must be applied (curriculum_levels table must exist)
--
-- Sprint: 130 - Orange 1 Deep Curriculum Content Seed
-- ============================================================


DO $$
DECLARE
  v_level_id UUID;
BEGIN

 -- ============================================================
 -- STEP 1: Resolve Orange 1 level ID
 -- Uses the display_name pattern from migration 036:
 --   Orange 1 - Rally (stage = 'orange_development', level_number = 1)
 -- Falls back to any orange-1 match for resilience.
 -- ============================================================
  SELECT id INTO v_level_id
  FROM curriculum_levels
  WHERE stage = 'orange_development' AND level_number = 1
  ORDER BY sort_order ASC
  LIMIT 1;

  IF v_level_id IS NULL THEN
   -- Fallback: display_name pattern match
    SELECT id INTO v_level_id
    FROM curriculum_levels
    WHERE display_name ILIKE '%Orange%1%'
    ORDER BY sort_order ASC
    LIMIT 1;
  END IF;

  IF v_level_id IS NULL THEN
    RAISE WARNING 'Orange 1 curriculum level not found - seeding skipped. Apply migration 036 first.';
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding Orange 1 content for level_id: %', v_level_id;

 -- ============================================================
 -- STEP 2: INSERT - all rows are global (academy_id NULL)
 -- ON CONFLICT targets the unique index on
 --   (level_id, content_type, title, version) WHERE academy_id IS NULL
 -- so re-runs are safe.
 -- ============================================================

  INSERT INTO curriculum_content_items (
    academy_id,
    source_type,
    content_type,
    pathway,
    level_id,
    title,
    description,
    domain,
    session_block_hint,
    ball_level,
    is_coach_only,
    is_player_visible,
    is_parent_visible,
    coach_cues,
    success_criteria,
    progressions,
    regressions,
    duration_min
  )
  VALUES

   -- ========================================================
   -- WARMUP (2 rows)
   -- ========================================================

    (NULL, 'global_default', 'warmup', 'skill', v_level_id,
     'Dynamic Footwork Warm-Up',
     'Split steps, lateral shuffles, and cross-steps around the service box. Gets players physically and mentally ready to rally.',
     'Movement', 'Warm-Up', 'orange', false, false, false,
     ARRAY['Land on the balls of your feet', 'Keep your knees soft'],
     ARRAY['All players complete 3 full circuits without stopping'],
     ARRAY['Add racket carry during movement', 'Add directional call from coach'],
     ARRAY['Slow jog in place', 'Stationary hip circles'],
     8),

    (NULL, 'global_default', 'warmup', 'skill', v_level_id,
     'Mini-Tennis Cooperative Warm-Up',
     'Both players start inside the service line and rally cooperatively, gradually moving back to the baseline as confidence builds.',
     'Technical', 'Warm-Up', 'orange', false, false, false,
     ARRAY['Short swings only', 'Let the ball come to you'],
     ARRAY['10+ consecutive cooperative rallies from mini-court'],
     ARRAY['Add directional targets', 'Move back to full court'],
     ARRAY['Drop feed from coach to get rally started', 'Stay in the kitchen'],
     8),

   -- ========================================================
   -- TECHNICAL DRILLS (6 rows)
   -- ========================================================

    (NULL, 'global_default', 'drill', 'skill', v_level_id,
     'Forehand Groundstroke Foundation',
     'Build a consistent, full-swing forehand from the baseline. Coach feeds from the service box. Focus on unit turn, swing path, and high finish.',
     'Technical', 'Focus', 'orange', false, false, false,
     ARRAY['Racket back early - before the ball bounces', 'Swing low to high', 'Finish over the opposite shoulder', 'Hold the finish for one second'],
     ARRAY['7 of 10 forehands land in target zone', 'Consistent high finish on each swing', 'No pushing - full swing each time'],
     ARRAY['Add directional target cones', 'Rally cross-court with partner'],
     ARRAY['Coach drops the ball for player to hit', 'Short court from service line'],
     12),

    (NULL, 'global_default', 'drill', 'skill', v_level_id,
     'Backhand Rally Consistency',
     'Two-handed backhand rally drill from the baseline. Focus on contact point in front of body, low-to-high swing, and consistent direction.',
     'Technical', 'Focus', 'orange', false, false, false,
     ARRAY['Both hands firm at contact', 'Contact point in front of lead hip', 'Follow through across the body'],
     ARRAY['6 of 10 backhands land inside the singles sideline', 'Consistent contact in front of the body'],
     ARRAY['Add cross-court to down-the-line variation', 'Increase pace'],
     ARRAY['Hand toss feed', 'Half-swing rehearsal without ball'],
     10),

    (NULL, 'global_default', 'drill', 'skill', v_level_id,
     'Split-Step and First Step',
     'Coach alternates feeds to forehand and backhand side. Player must split step on each feed before moving. Develops anticipation and first-step quickness.',
     'Movement', 'Focus', 'orange', false, false, false,
     ARRAY['Split step just as the coach makes contact', 'Push off the outside foot', 'Load early before you swing'],
     ARRAY['Consistent split step on every ball', 'First step in correct direction on 8 of 10 feeds'],
     ARRAY['Increase feed pace', 'Add wider angles'],
     ARRAY['Coach gives verbal cue before each feed', 'Reduce feed angle'],
     10),

    (NULL, 'global_default', 'drill', 'skill', v_level_id,
     'Serve Introduction - Toss and Swing',
     'Flat serve practice from the deuce box. Phase 1: toss only. Phase 2: swing through with minimal pace. Phase 3: full serve with placement focus.',
     'Technical', 'Focus', 'orange', false, false, false,
     ARRAY['Toss at 1 o''clock - not behind the head', 'Trophy position - arm fully extended', 'Brush up through the ball'],
     ARRAY['Toss lands inside a hula hoop placed on court', '5 of 10 first serves land in service box'],
     ARRAY['Add pace control - slow to fast', 'Serve to specific targets'],
     ARRAY['Throw a ball over the net without a racket', 'Use a shorter foam ball to practice toss'],
     12),

    (NULL, 'global_default', 'drill', 'skill', v_level_id,
     'Volley Introduction at the Net',
     'Coach feeds balls to player standing at the net. Player uses short punching motion to direct volleys. No full swing - contact in front of body.',
     'Technical', 'Focus', 'orange', false, false, false,
     ARRAY['Grip firm at contact', 'Step into the volley - no swinging', 'Watch the ball all the way to the strings'],
     ARRAY['5 of 8 volleys land in the service box', 'Compact swing - no backswing'],
     ARRAY['Add movement to net from baseline', 'Crosscourt volley direction'],
     ARRAY['Ball fed from closer range', 'Catch-and-hold drill before hitting'],
     8),

    (NULL, 'global_default', 'drill', 'skill', v_level_id,
     'Baseline Rally Cross-Court',
     'Sustained cross-court rally. Both players commit to keeping the ball cross-court for as long as possible. Develops consistency and directional intention.',
     'Technical', 'Train', 'orange', false, false, false,
     ARRAY['Aim for the middle of the cross-court target zone', 'Reset position after each shot', 'Call the shot before hitting in training'],
     ARRAY['15-ball rally cross-court without error', 'Direction maintained on 8 of 10 shots'],
     ARRAY['Add down-the-line change-up', 'Add score: 1 point per 5-ball rally'],
     ARRAY['Coach feeds to start each rally', 'Reduce to half-court'],
     12),

   -- ========================================================
   -- TACTICAL GAMES (5 rows)
   -- ========================================================

    (NULL, 'global_default', 'tactical_game', 'skill', v_level_id,
     'Target Zone Rally Game',
     'Two zones marked by cones on each side. Players earn 2 points for landing in the deep target zone, 1 point anywhere in. First to 10 wins.',
     'Tactical', 'Play', 'orange', false, false, false,
     ARRAY['Pick your target before you swing', 'Aim deep - short balls are free points for your opponent'],
     ARRAY['Player consistently aims for depth zone', 'Rallies of 5+ shots before a target attempt'],
     ARRAY['Shrink the target zone', 'Add directional zones (cross-court vs. down-the-line)'],
     ARRAY['Larger target zones', 'Coach feeds to start every point'],
     15),

    (NULL, 'global_default', 'tactical_game', 'skill', v_level_id,
     'Three-Ball Rally Keep-Alive',
     'Points only count if each player hits at least 3 shots before the point ends. Rewards patience over forced winners.',
     'Tactical', 'Play', 'orange', false, false, false,
     ARRAY['Never try to win on the first or second ball', 'Build - don''t bang'],
     ARRAY['Most rallies reach 3+ shots before a winner', 'Player waits for the right moment to attack'],
     ARRAY['Increase minimum rally length to 5', 'Add directional rule'],
     ARRAY['Coach feeds to reset after errors', 'Allow 1 free point per game'],
     15),

    (NULL, 'global_default', 'tactical_game', 'skill', v_level_id,
     'Open Court Finder',
     'One player defends from the center, one player tries to move them off the center with direction. Teaches court geometry at orange ball pace.',
     'Tactical', 'Play', 'orange', false, false, false,
     ARRAY['Don''t go for the line - go for the space', 'Watch where your opponent is standing before you swing'],
     ARRAY['Attacker wins 5 points by moving defender more than 2 meters', 'Defender successfully resets to center after each ball'],
     ARRAY['Add serve and return to start each point', 'Wider court boundaries'],
     ARRAY['Start with coach feeding attacker', 'Smaller court'],
     12),

    (NULL, 'global_default', 'tactical_game', 'mixed', v_level_id,
     'Serve and First Ball Game',
     'Server gets a point if first shot after return lands in the target zone. Returner gets a point if they neutralize the serve. Trains early aggression.',
     'Tactical', 'Game', 'orange', false, false, false,
     ARRAY['Commit to the serve - don''t take pace off at the last second', 'Return with direction - not just back over the net'],
     ARRAY['Server wins first ball 40%+ of the time', 'Returner creates neutral or offensive positions on returns'],
     ARRAY['Add approach shot for server', 'Play full points after first exchange'],
     ARRAY['Use second serve only', 'Coach feeds return instead of serve'],
     15),

    (NULL, 'global_default', 'tactical_game', 'skill', v_level_id,
     'Cross-Court vs. Down-the-Line Switch',
     'Players rally cross-court until the coach calls "switch" - both players must go down the line on the next shot. Trains directional change.',
     'Tactical', 'Train', 'orange', false, false, false,
     ARRAY['Wait for the open moment to change direction', 'Set up the change with one extra cross-court ball'],
     ARRAY['Successful directional change on 6 of 10 "switch" calls', 'No unforced errors on the change ball'],
     ARRAY['Player self-initiates the switch based on court position', 'Add score: point for successful switches'],
     ARRAY['No switch - pure cross-court consistency', 'Coach gives extra time after "switch" call'],
     12),

   -- ========================================================
   -- SITUATIONALS (5 rows)
   -- ========================================================

    (NULL, 'global_default', 'situational', 'skill', v_level_id,
     'Short Ball Response',
     'Coach randomly feeds a short ball mid-rally. Player must recognize it and attack - move forward, hit with pace or angle, then recover.',
     'Tactical', 'Situational', 'orange', false, false, false,
     ARRAY['Read the short ball early - start moving before it bounces', 'Contact at the peak of the bounce', 'Recover to center after attacking'],
     ARRAY['Player attacks 7 of 10 short balls', 'No passive push returns on short balls'],
     ARRAY['Add net finish after attacking short ball', 'Increase pace of attack shot'],
     ARRAY['Coach feeds short ball directly - no rally first', 'Use larger target zone for attack shot'],
     10),

    (NULL, 'global_default', 'situational', 'skill', v_level_id,
     'Wide Ball Recovery',
     'Coach feeds wide balls to pull player off the court. Player must hit defensively and recover to center before the next ball.',
     'Tactical', 'Situational', 'orange', false, false, false,
     ARRAY['Get behind the ball - don''t reach', 'Hit high and deep to buy recovery time', 'Sprint back to center after contact'],
     ARRAY['Player recovers to within 1 meter of center before next ball', 'High defensive shot keeps ball in on 7 of 10 wide balls'],
     ARRAY['Increase angle of wide feed', 'Add consecutive wide balls'],
     ARRAY['Coach feeds from closer - less angle', 'Slow feed pace'],
     10),

    (NULL, 'global_default', 'situational', 'skill', v_level_id,
     'High Ball Decision',
     'Coach feeds high-bouncing balls from mid-court. Player must decide: hit overhead, step back and drive, or defend. Trains decision-making under pressure.',
     'Tactical', 'Situational', 'orange', false, false, false,
     ARRAY['Track the ball all the way up - don''t rush', 'Step back early if the ball is going to bounce above your shoulder', 'Choose overhead only when comfortably in position'],
     ARRAY['Correct shot selection on 6 of 10 high balls', 'No rushed overhead errors from bad position'],
     ARRAY['Add movement to get under the ball', 'Mix of high and low feeds - player must read'],
     ARRAY['Feed ball from close range at moderate height', 'Call the shot type before each feed'],
     10),

    (NULL, 'global_default', 'situational', 'skill', v_level_id,
     'First Ball After Serve',
     'Player serves, then must react to coach-fed return. Trains the transition from serving to rallying mode. Focus on staying ready after the serve.',
     'Tactical', 'Situational', 'orange', false, false, false,
     ARRAY['Stay on your toes after the serve - don''t admire it', 'Move to your ready position as soon as the serve lands', 'React to where the return is going'],
     ARRAY['Player in position before coach-fed return in 8 of 10 repetitions', 'Positive first ball response - not just surviving'],
     ARRAY['Return fed faster or to different zones', 'Play out the full point'],
     ARRAY['Coach feeds easy returns to forehand only', 'Slow serve then simple forehand return feed'],
     10),

    (NULL, 'global_default', 'situational', 'skill', v_level_id,
     'Defensive Reset Situation',
     'Player is put in a difficult defensive position by three consecutive wide or deep feeds. Must hang in and find one neutral ball to reset the point.',
     'Tactical', 'Situational', 'orange', false, false, false,
     ARRAY['High and deep is your friend when defending', 'Get the ball back - don''t try to win from defense', 'One ball at a time - reset focus after each difficult shot'],
     ARRAY['Player successfully hits 3 defensive balls and produces one neutral shot', 'No unforced errors during defensive sequence'],
     ARRAY['Extend the defensive sequence to 5 balls', 'Add a neutral ball target the player must hit'],
     ARRAY['Feed only one difficult ball then allow recovery', 'Feed pace reduced'],
     10),

   -- ========================================================
   -- MATCH-PLAY THEMES (4 rows)
   -- ========================================================

    (NULL, 'global_default', 'match_play_theme', 'competition', v_level_id,
     'Stay in the Rally',
     'Today''s match focus: win points through patience and consistency, not power. The player who keeps the ball in play the longest tends to win at this level.',
     'Competition', 'Match-Play', 'orange', false, false, false,
     ARRAY['If you don''t know what to do - go cross-court and deep', 'Take the extra shot - don''t go for the hero ball'],
     ARRAY['Unforced error count below 10 per set', 'Average rally length above 4 shots'],
     ARRAY['Add specific rally-length goal per game', 'Track unforced vs. forced errors post-match'],
     ARRAY['Reduce to points only - no full games yet', 'Start with cooperative rally before competition mode'],
     NULL),

    (NULL, 'global_default', 'match_play_theme', 'competition', v_level_id,
     'Control Before Power',
     'Match focus: hit with direction and depth before adding pace. Teaches players to build the point before attacking.',
     'Competition', 'Match-Play', 'orange', false, false, false,
     ARRAY['Pick your spot before you swing', 'Depth first - then direction - then pace', 'One decision per shot: cross-court or down-the-line'],
     ARRAY['Player demonstrates directional intent on 6 of 10 groundstrokes', 'Only attacks when clearly in an offensive position'],
     ARRAY['Add winner targets on the court', 'Introduce first-strike forehand concept'],
     ARRAY['No direction rule - just keep it in', 'Cooperative rally before match play'],
     NULL),

    (NULL, 'global_default', 'match_play_theme', 'competition', v_level_id,
     'Error Recovery Theme',
     'Today''s focus: how you respond to your own errors. Practice the reset routine between points. Stay on task after mistakes.',
     'Mentality', 'Match-Play', 'orange', false, false, false,
     ARRAY['What happened last point does not affect this point', 'One breath, one word, back to ready', 'Reset your body first - your mind will follow'],
     ARRAY['Player uses a visible reset routine between every point', 'No extended negative reactions - quick return to ready position'],
     ARRAY['Add a post-game reflection: "how many times did I reset well?"', 'Simulate pressure situations'],
     ARRAY['Coach models the reset routine before match play', 'Only track positive resets - no scoring pressure'],
     NULL),

    (NULL, 'global_default', 'match_play_theme', 'competition', v_level_id,
     'First Serve Commitment',
     'Match focus: serve with a target in mind every time. No safe pats - commit to a directional first serve with pace appropriate for the level.',
     'Technical', 'Match-Play', 'orange', false, false, false,
     ARRAY['Pick your target before the toss', 'Swing through - don''t steer the serve', 'A missed first serve is information - adjust for the second'],
     ARRAY['First serve percentage above 50%', 'Serve lands in the intended half of the service box on 6 of 10 first serves'],
     ARRAY['Add serve+1 - must hit the next ball offensively after the serve', 'Serve to specific zones: T, body, wide'],
     ARRAY['Second serve only match - remove pressure of faults', 'Use a larger target zone for first serve'],
     NULL),

   -- ========================================================
   -- MENTAL SKILLS (4 rows)
   -- ========================================================

    (NULL, 'global_default', 'mental_skill', 'skill', v_level_id,
     'Reset After a Point',
     'Teaches players a structured between-point reset routine: walk to the fence, one deliberate breath, one word of choice, walk to position.',
     'Mentality', 'Focus', 'orange', false, false, false,
     ARRAY['Every player needs a reset word - pick one that works for you', 'Physical reset first: turn away, breathe, then turn back', 'You can feel frustrated - just don''t stay frustrated'],
     ARRAY['Player demonstrates reset routine on 8 of 10 between-point transitions', 'Duration of negative reaction under 5 seconds'],
     ARRAY['Add journaling: rate reset quality after each practice', 'Use reset routine in competitive matches'],
     ARRAY['Coach models the routine 3 times before asking player to use it', 'Use reset only after errors - not after winners yet'],
     NULL),

    (NULL, 'global_default', 'mental_skill', 'skill', v_level_id,
     'Breath Control Between Points',
     'Introduce diaphragmatic breathing as a between-point regulation tool. One long exhale through the mouth clears adrenaline and resets focus.',
     'Mentality', 'Focus', 'orange', false, false, false,
     ARRAY['Breathe out through the mouth - not in', 'Slow the exhale - at least 3 seconds out', 'Your body follows your breath'],
     ARRAY['Player uses breath between points on 7 of 10 transitions without prompting', 'Visible slowing of body pace after breath'],
     ARRAY['Pair with a reset word', 'Use before serve as pre-point routine'],
     ARRAY['Coach cues each breath - "breathe now"', 'Practice only in low-pressure cooperative rallying'],
     NULL),

    (NULL, 'global_default', 'mental_skill', 'skill', v_level_id,
     'Positive Self-Talk Routine',
     'Players choose one positive phrase to use after an error. Builds internal dialogue habits early. Examples: "Next ball", "I''ve got this", "Reset".',
     'Mentality', 'Focus', 'orange', false, false, false,
     ARRAY['The phrase must be short - one to three words only', 'Say it quietly - it''s for you, not the crowd', 'Use it every time - not just when it feels right'],
     ARRAY['Player selects and uses a consistent self-talk phrase in practice', 'No negative self-talk outbursts during session'],
     ARRAY['Player shares phrase with coach and explains why they chose it', 'Use phrase before points, not just after errors'],
     ARRAY['Coach offers a starter list of phrases', 'Practice in cooperative drill first'],
     NULL),

    (NULL, 'global_default', 'mental_skill', 'skill', v_level_id,
     'Pre-Serve Routine',
     'Build a repeatable pre-serve routine: bounce the ball 3 times, breathe, visualize the target, serve. Trains focus and reduces double faults from nervousness.',
     'Mentality', 'Focus', 'orange', false, false, false,
     ARRAY['Same routine every serve - don''t rush it', 'See the target before you toss', 'Confidence comes from routine - not from the score'],
     ARRAY['Player uses identical pre-serve routine on every serve attempt', 'No double-fault sequences - errors are solo, not patterns'],
     ARRAY['Add a trigger word just before the toss', 'Time the routine - should be 5–8 seconds'],
     ARRAY['Coach counts the routine out loud to help establish timing', 'Only 2-ball bounce version - keep it simple'],
     NULL),

   -- ========================================================
   -- COMPETITION BEHAVIORS (3 rows)
   -- ========================================================

    (NULL, 'global_default', 'competition_behavior', 'competition', v_level_id,
     'Call Lines Confidently and Honestly',
     'Teaches players that line calls are a core part of the game. Calls should be made clearly, quickly, and without hesitation. A ball that cannot be called out is in.',
     'Competition', 'Match-Play', 'orange', false, false, false,
     ARRAY['If you''re not sure - it''s in', 'Call the ball, not the player', 'Say "out" clearly, loud enough for your opponent to hear'],
     ARRAY['All line calls made without hesitation within 2 seconds of the ball landing', 'No disputed calls more than once per set'],
     ARRAY['Practice calling in simulated points with a third-party observer', 'Discuss what to do if you disagree with a call'],
     ARRAY['Coach makes calls for both players in the first practice match', 'Use bright court cones to reduce ambiguity'],
     NULL),

    (NULL, 'global_default', 'competition_behavior', 'competition', v_level_id,
     'Accept Results with Composure',
     'Teaches players that how you respond to the score is part of your tennis character. Win or lose, a handshake and a kind word is the standard.',
     'Competition', 'Match-Play', 'orange', false, false, false,
     ARRAY['The player who handles losing well is harder to beat the next time', 'What you say after the match matters as much as what you do during it', 'Shake hands with eye contact - mean it'],
     ARRAY['Player shakes hands after every match point regardless of outcome', 'No racket throwing, court storming, or negative comments about opponents'],
     ARRAY['Role-play winning and losing scenarios in practice', 'Discuss what great losing looks like'],
     ARRAY['Coach debriefs immediately after match - before emotions settle', 'Use only cooperative drills before introducing competitive scoring'],
     NULL),

    (NULL, 'global_default', 'competition_behavior', 'competition', v_level_id,
     'Stay On Task During Change-Overs',
     'Teaches players to use the 90-second change-over productively: hydrate, towel off, breathe, pick one tactical thought for the next game.',
     'Competition', 'Match-Play', 'orange', false, false, false,
     ARRAY['The change-over is your reset - use it', 'Drink water even if you don''t feel thirsty', 'One thought for the next game - nothing more'],
     ARRAY['Player sits down, hydrates, and uses change-over time on all change-overs', 'No extended conversations or distraction during change-overs'],
     ARRAY['Player writes one word on a card to remind them of their game plan', 'Discuss change-over strategy as a coach briefing topic'],
     ARRAY['Coach leads first change-over - models the routine', 'Timed change-overs only in practice - 60 seconds max'],
     NULL),

   -- ========================================================
   -- COACH CUES (5 rows - internal, is_coach_only = true)
   -- ========================================================

    (NULL, 'global_default', 'coach_cue', 'skill', v_level_id,
     'Early Racket Preparation Cue',
     'Use when player is late on groundstrokes. Cue should be delivered before the feed, not after the error.',
     'Technical', 'Focus', 'orange', true, false, false,
     ARRAY['Racket back before the ball crosses the net', 'Prepare - don''t react'],
     ARRAY['Player demonstrates unit turn before ball bounces on 8 of 10 feeds'],
     NULL, NULL, NULL),

    (NULL, 'global_default', 'coach_cue', 'skill', v_level_id,
     'High Finish Cue',
     'Use when player is truncating the follow-through. The high finish reinforces low-to-high swing path and topspin production.',
     'Technical', 'Focus', 'orange', true, false, false,
     ARRAY['Finish over the shoulder - camera at the top', 'Hold the finish - freeze it'],
     ARRAY['Visible high finish on every groundstroke in the drill'],
     NULL, NULL, NULL),

    (NULL, 'global_default', 'coach_cue', 'skill', v_level_id,
     'Watch the Ball to the Strings Cue',
     'Use when player is looking up too early - either to see where the ball went or to check the opponent. Eyes should stay down through contact.',
     'Technical', 'Focus', 'orange', true, false, false,
     ARRAY['See the ball on the strings', 'Head stays down through contact'],
     ARRAY['Player head stays still through contact on 7 of 10 shots'],
     NULL, NULL, NULL),

    (NULL, 'global_default', 'coach_cue', 'skill', v_level_id,
     'Step Into the Ball Cue',
     'Use when player is hitting while backing up or with weight on the back foot. The step into the ball drives through-contact power.',
     'Movement', 'Focus', 'orange', true, false, false,
     ARRAY['Step toward the ball as you swing - not away from it', 'Lead with your front foot'],
     ARRAY['Player weight on front foot at contact on 7 of 10 shots'],
     NULL, NULL, NULL),

    (NULL, 'global_default', 'coach_cue', 'skill', v_level_id,
     'Ready Position Cue',
     'Use when player is not recovering to center or is standing flat-footed. Should be delivered between shots, not during the swing.',
     'Movement', 'Train', 'orange', true, false, false,
     ARRAY['Feet moving - never flat', 'Recover to center, not to the shot'],
     ARRAY['Player bouncing and in ready position before every coach feed'],
     NULL, NULL, NULL),

   -- ========================================================
   -- SUCCESS CRITERIA (3 rows - internal, is_coach_only = true)
   -- ========================================================

    (NULL, 'global_default', 'success_criteria', 'skill', v_level_id,
     'Rally Length Benchmark - Orange 1',
     'Internal coach benchmark for rally consistency at the Orange 1 stage. Use to assess readiness to advance rally-based drills.',
     'Technical', 'Assessment', 'orange', true, false, false,
     NULL,
     ARRAY['10-ball cross-court rally without error in 3 of 5 attempts', '5-ball rally with direction control in 7 of 10 attempts'],
     NULL, NULL, NULL),

    (NULL, 'global_default', 'success_criteria', 'skill', v_level_id,
     'Serve In-Rate Benchmark - Orange 1',
     'Internal coach benchmark for serve consistency at the Orange 1 stage.',
     'Technical', 'Assessment', 'orange', true, false, false,
     NULL,
     ARRAY['5 of 10 first serves in the correct service box', 'No double-fault sequences (2+ in a row) in a practice set'],
     NULL, NULL, NULL),

    (NULL, 'global_default', 'success_criteria', 'competition', v_level_id,
     'Match Composure Benchmark - Orange 1',
     'Internal coach benchmark for on-court emotional regulation and competition behavior at Orange 1.',
     'Mentality', 'Assessment', 'orange', true, false, false,
     NULL,
     ARRAY['Uses reset routine after every error in practice matches', 'No racket abuse, outbursts, or score disputes lasting more than 30 seconds', 'Completes handshake after every practice match'],
     NULL, NULL, NULL),

   -- ========================================================
   -- PROGRESSIONS (3 rows)
   -- ========================================================

    (NULL, 'global_default', 'progression', 'skill', v_level_id,
     'Topspin Forehand Introduction',
     'For players who have mastered the foundational forehand swing. Introduces low-to-high brush and wrist snap to produce topspin.',
     'Technical', 'Focus', 'orange', false, false, false,
     ARRAY['Brush up the back of the ball - not through it', 'Snap the wrist at contact'],
     ARRAY['Visible topspin rotation on 6 of 10 forehands', 'Ball clears the net with at least 1 meter margin and drops in'],
     NULL, NULL, 12),

    (NULL, 'global_default', 'progression', 'skill', v_level_id,
     'Approach Shot and Net Finish',
     'For players ready to incorporate net play into their game. Player hits an approach shot on a short ball, advances to the net, and finishes with a volley.',
     'Tactical', 'Train', 'orange', false, false, false,
     ARRAY['Approach down the line', 'Close the net after the approach - don''t stop at the service line'],
     ARRAY['Player successfully closes to net in 6 of 10 short-ball situations', 'Finishes point at net in 4 of 10'],
     NULL, NULL, 12),

    (NULL, 'global_default', 'progression', 'competition', v_level_id,
     'Serve and First Ball Attack',
     'For players with a consistent serve. Player must follow every serve with an aggressive first ball - not just a safe return.',
     'Tactical', 'Game', 'orange', false, false, false,
     ARRAY['The serve is your first weapon - use it to set up the next shot', 'Commit to a plan before you serve: wide or T?'],
     ARRAY['Player serves with directional intention and follows with an offensive first ball in 5 of 10 points'],
     NULL, NULL, 12),

   -- ========================================================
   -- REGRESSIONS (3 rows)
   -- ========================================================

    (NULL, 'global_default', 'regression', 'skill', v_level_id,
     'Drop Feed Forehand',
     'For players struggling with timing on live-ball feeds. Coach drops the ball from waist height and player drives it from the bounce.',
     'Technical', 'Focus', 'orange', false, false, false,
     ARRAY['Wait for the ball to come up - don''t rush in', 'Full swing - even on a drop feed'],
     ARRAY['Consistent full swing on every drop feed', '7 of 10 land in target zone'],
     NULL, NULL, 8),

    (NULL, 'global_default', 'regression', 'skill', v_level_id,
     'Short Court Mini Rally',
     'Both players rally from inside the service line with half-speed swings. Reduces pace and court size to build contact consistency before full court.',
     'Technical', 'Warm-Up', 'orange', false, false, false,
     ARRAY['Same swing shape - just shorter court', 'Don''t push - still swing through'],
     ARRAY['15 consecutive mini-court rallies without error'],
     NULL, NULL, 8),

    (NULL, 'global_default', 'regression', 'skill', v_level_id,
     'Hand Feed Rally',
     'Coach hand-feeds balls slowly at waist height. Player practices swing mechanics and contact point without timing pressure.',
     'Technical', 'Focus', 'orange', false, false, false,
     ARRAY['Same technique on hand-feed as on rally', 'Use this to fix mechanics - then go back to rally'],
     ARRAY['Full swing with correct finish on every hand-feed ball'],
     NULL, NULL, 8),

   -- ========================================================
   -- PLAYER MISSION (2 rows)
   -- Future use - is_player_visible = false, not exposed to portal
   -- ========================================================

    (NULL, 'global_default', 'player_mission', 'skill', v_level_id,
     'Orange 1 Rally Mission',
     'Your job at this stage is to keep the ball in play longer than your opponent. Every ball you hit back is a small win.',
     'Technical', 'Focus', 'orange', false, false, false,
     NULL,
     ARRAY['10-ball rally in training', 'Direction control on groundstrokes'],
     NULL, NULL, NULL),

    (NULL, 'global_default', 'player_mission', 'competition', v_level_id,
     'Orange 1 Competition Challenge',
     'In every practice match, focus on using your reset routine after errors. Your mental game is as important as your tennis game.',
     'Mentality', 'Match-Play', 'orange', false, false, false,
     NULL,
     ARRAY['Reset routine used after every error', 'No racket or line dispute incidents'],
     NULL, NULL, NULL),

   -- ========================================================
   -- PARENT GUIDANCE (2 rows)
   -- Future use - is_parent_visible = false, not exposed to portal
   -- ========================================================

    (NULL, 'global_default', 'parent_guidance', 'skill', v_level_id,
     'Orange 1 Rally Phase Parent Guide',
     'At this stage your child is learning to rally consistently with an orange ball. The most important thing you can do is encourage effort over results.',
     'Mentality', 'Focus', 'orange', false, false, false,
     NULL,
     ARRAY['Child talks positively about practice', 'Child is excited to come back'],
     NULL, NULL, NULL),

    (NULL, 'global_default', 'parent_guidance', 'competition', v_level_id,
     'Orange 1 Competition Introduction Parent Guide',
     'Your child has started playing practice matches. Wins and losses matter less than learning to compete. Ask about rallies and routines - not the score.',
     'Competition', 'Match-Play', 'orange', false, false, false,
     NULL,
     ARRAY['Child can name one thing they did well in a match', 'Child can describe one thing they want to improve'],
     NULL, NULL, NULL)

  ON CONFLICT (level_id, content_type, title, version) WHERE academy_id IS NULL
  DO NOTHING;

  RAISE NOTICE 'Orange 1 content seed complete.';

END;
$$;


-- ============================================================
-- VERIFICATION QUERY
-- Run after applying to confirm rows were inserted.
-- ============================================================
-- SELECT content_type, COUNT(*) AS row_count
-- FROM curriculum_content_items
-- WHERE level_id = (
--   SELECT id FROM curriculum_levels
--   WHERE stage = 'orange_development' AND level_number = 1
--   LIMIT 1
-- )
-- AND academy_id IS NULL
-- GROUP BY content_type
-- ORDER BY content_type;
