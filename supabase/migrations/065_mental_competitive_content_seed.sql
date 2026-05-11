-- ============================================================
-- ACADEMY OS — MIGRATION 065: MENTAL / COMPETITIVE CONTENT SEED
--
-- CONSTRAINT CHANGES (applied before data DML):
--   Extends session_block_hint CHECK to include 'Mental'.
--   The domain CHECK already contains 'Mentality' — no domain change needed.
--
-- WHY:
--   Sprint 212 adds the mental/competitive phase to class template
--   lesson generation. The block_type = 'mental' already exists in
--   the DB schema and all badge/label maps, but no curriculum_content_items
--   with session_block_hint = 'Mental' existed — so the lesson plan
--   generator had nothing to route to mental blocks.
--
--   This migration does two things:
--   1. Updates existing Orange 1 mental_skill and competition_behavior rows
--      (seeded in migration 063 with session_block_hint = 'Focus' / 'Match-Play')
--      to use session_block_hint = 'Mental' so they are correctly routed
--      by the fixed hintsForBlockType('mental') function.
--   2. Inserts new mental/competitive content for Orange 2 and Orange 3,
--      covering the full range of on-court mental habits, competitive
--      decision-making, and emotional control scenarios.
--
-- CONTENT PHILOSOPHY:
--   Mental items feel like part of tennis training, not a classroom module.
--   Reset after errors, between-point routines, pressure-point habits,
--   target selection, attack/rally/defend decisions, tournament behavior.
--
-- CONTENT PLAN:
--   Orange 1 — UPDATE 7 existing rows to session_block_hint = 'Mental'
--   Orange 2 — INSERT 8 new rows (5 mental_skill + 3 competition_behavior)
--   Orange 3 — INSERT 8 new rows (5 mental_skill + 3 competition_behavior)
--
-- SAFETY:
--   UPDATEs are idempotent (WHERE session_block_hint != 'Mental' guard optional
--     but UPDATEs to the same value are a no-op anyway)
--   INSERTs use ON CONFLICT DO NOTHING — safe to re-run
--   academy_id = NULL → global platform defaults visible to all staff
--   is_player_visible = false, is_parent_visible = false on all rows
--   No player records touched. No parent portal affected.
--   No existing content deleted or overwritten.
--
-- DEPENDENCY:
--   Migration 036 (curriculum_levels table)
--   Migration 061 (domain, session_block_hint, is_player_visible, etc.)
--   Migration 063 (Orange 1 rows that we UPDATE here)
--
-- Sprint: 212 — Mental / Competitive Class Template Phase V1
-- ============================================================

-- ============================================================
-- DDL: Extend session_block_hint CHECK to include 'Mental'
-- ============================================================

ALTER TABLE curriculum_content_items
  DROP CONSTRAINT IF EXISTS curriculum_content_items_session_block_hint_check;

ALTER TABLE curriculum_content_items
  ADD CONSTRAINT curriculum_content_items_session_block_hint_check
  CHECK (session_block_hint IS NULL OR session_block_hint IN (
    'Mental', 'Warm-Up', 'Focus', 'Train', 'Play', 'Game',
    'Situational', 'Match-Play', 'Assessment', 'Cool-Down'
  ));

DO $$
DECLARE
  v_o1_id UUID;
  v_o2_id UUID;
  v_o3_id UUID;
BEGIN

  -- ============================================================
  -- STEP 1: Resolve level IDs
  -- ============================================================

  SELECT id INTO v_o1_id FROM curriculum_levels
  WHERE stage = 'orange_development' AND level_number = 1
  ORDER BY sort_order ASC LIMIT 1;
  IF v_o1_id IS NULL THEN
    SELECT id INTO v_o1_id FROM curriculum_levels
    WHERE display_name ILIKE '%Orange%1%' ORDER BY sort_order ASC LIMIT 1;
  END IF;

  SELECT id INTO v_o2_id FROM curriculum_levels
  WHERE stage = 'orange_development' AND level_number = 2
  ORDER BY sort_order ASC LIMIT 1;
  IF v_o2_id IS NULL THEN
    SELECT id INTO v_o2_id FROM curriculum_levels
    WHERE display_name ILIKE '%Orange%2%' ORDER BY sort_order ASC LIMIT 1;
  END IF;

  SELECT id INTO v_o3_id FROM curriculum_levels
  WHERE stage = 'orange_development' AND level_number = 3
  ORDER BY sort_order ASC LIMIT 1;
  IF v_o3_id IS NULL THEN
    SELECT id INTO v_o3_id FROM curriculum_levels
    WHERE display_name ILIKE '%Orange%3%' ORDER BY sort_order ASC LIMIT 1;
  END IF;

  IF v_o1_id IS NULL AND v_o2_id IS NULL AND v_o3_id IS NULL THEN
    RAISE WARNING 'No Orange curriculum levels found — migration 065 skipped. Apply migration 036 first.';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 065: O1=%, O2=%, O3=%', v_o1_id, v_o2_id, v_o3_id;

  -- ============================================================
  -- STEP 2: UPDATE existing Orange 1 mental_skill and
  -- competition_behavior rows to session_block_hint = 'Mental'.
  --
  -- Migration 063 seeded these with 'Focus' and 'Match-Play',
  -- which routed them to technical and competition blocks.
  -- They belong in mental blocks, so we fix the hint here.
  -- ============================================================

  IF v_o1_id IS NOT NULL THEN

    UPDATE curriculum_content_items
    SET
      session_block_hint = 'Mental',
      domain             = 'Mentality'
    WHERE
      content_type = 'mental_skill'
      AND level_id = v_o1_id
      AND academy_id IS NULL;

    UPDATE curriculum_content_items
    SET
      session_block_hint = 'Mental',
      domain             = 'Competition'
    WHERE
      content_type = 'competition_behavior'
      AND level_id = v_o1_id
      AND academy_id IS NULL;

    RAISE NOTICE 'Orange 1: updated mental_skill + competition_behavior rows to session_block_hint = Mental';

  END IF;

  -- ============================================================
  -- STEP 3: INSERT new Orange 2 mental / competitive content
  -- ============================================================

  IF v_o2_id IS NOT NULL THEN

    INSERT INTO curriculum_content_items (
      academy_id, source_type, content_type, pathway, level_id,
      title, description, domain, session_block_hint, ball_level,
      is_coach_only, is_player_visible, is_parent_visible,
      coach_cues, success_criteria, progressions, regressions, duration_min
    ) VALUES

      -- MENTAL SKILLS (5 rows) -----------------------------------

      (NULL, 'global_default', 'mental_skill', 'skill', v_o2_id,
       'Choose Your Next Target',
       'Before each point, the player commits to a specific target — not just "in." Builds the habit of starting points with a plan instead of just reacting.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Pick your target before you walk to the baseline', 'Commit to the target — hesitation creates errors', 'A clear intention beats a hard swing'],
       ARRAY['Player verbally states or signals a target before each practice point', 'Target selection consistent on 7 of 10 points'],
       ARRAY['Add a consequence: 1 point only for landing in the chosen zone', 'Target varies by score — defensive at 0-30, attacking at 30-0'],
       ARRAY['Coach chooses the target for the player to start', 'Two-target choice only — crosscourt or down the line'],
       8),

      (NULL, 'global_default', 'mental_skill', 'skill', v_o2_id,
       'Between-Point Body Reset',
       'A structured between-point reset sequence: turn away from the net, take one slow breath, square shoulders, walk to position. Resets the nervous system before the next point.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Turn your back to the net after every point — not just the tough ones', 'Slow the walk — urgency after a bad point is a tell', 'Your body language is information for your opponent'],
       ARRAY['Player executes full reset sequence on 8 of 10 between-point transitions', 'Body pace visibly slows within 3 seconds of a point ending'],
       ARRAY['Add a trigger action — e.g., squeeze the racket handle once before turning', 'Time the reset — should be 4–6 seconds before the next point'],
       ARRAY['Coach cues the reset verbally after each point', 'Use only after errors first — then after all points'],
       NULL),

      (NULL, 'global_default', 'mental_skill', 'skill', v_o2_id,
       'Pressure Point Routine',
       'Players develop a specific routine for high-pressure moments: 30-40, break point, tiebreak. The routine is identical to normal points — no hesitation, no extra bounces.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Pressure points feel different — your routine should not', 'Slow your pre-serve routine slightly, do not rush', 'One target. One breath. Serve.'],
       ARRAY['Pre-serve routine identical on pressure points and normal points', 'No extended pause or change in body language on pressure points'],
       ARRAY['Designate pressure points in practice — announce them before the point', 'Add a score consequence to intensify the pressure environment'],
       ARRAY['Practice in cooperative drills only — no consequences yet', 'Coach narrates the routine step by step before the player executes'],
       NULL),

      (NULL, 'global_default', 'mental_skill', 'skill', v_o2_id,
       'Recover After Frustration',
       'When a player shows negative body language after an error — racket slam, slouch, audible frustration — coach pauses play and runs the recovery routine. Brief, practical, private.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Frustration is information — what is it telling you?', 'The ball does not care how frustrated you are', 'Recover fast. The next point starts fresh.'],
       ARRAY['Visible frustration cue (racket, body language, voice) followed by recovery within 10 seconds', 'No second frustration event within 3 points of the first'],
       ARRAY['Player self-identifies their frustration triggers and shares with coach', 'Develop a personal reset phrase for high-frustration moments'],
       ARRAY['Coach intervenes gently — not as a reprimand, as a reminder', 'Practice only after establishing trust and rapport'],
       NULL),

      (NULL, 'global_default', 'mental_skill', 'skill', v_o2_id,
       'Attack / Rally / Defend / Reset Decision',
       'Players learn to read the ball, court position, and score, then choose a mode: attack a short ball, rally neutrally, defend a deep ball, or reset a tough position.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Short ball in the court = attack opportunity', 'Ball behind the baseline = rally or defend', 'Recognize when to be aggressive and when to be smart'],
       ARRAY['Player correctly identifies their shot mode on 6 of 10 balls', 'No forced attacking shots from defensive positions'],
       ARRAY['Add score context — what changes at 0-30 vs 30-0?', 'Three-ball pattern recognition drill — coach calls mode after each shot'],
       ARRAY['Start with two modes only: attack or rally', 'Coach calls the mode before each feed to build recognition'],
       10),

      -- COMPETITION BEHAVIORS (3 rows) --------------------------

      (NULL, 'global_default', 'competition_behavior', 'competition', v_o2_id,
       'Compete with Composure',
       'Trains players to maintain consistent body language and pace regardless of the score. Composure under pressure is a competitive skill that can be practiced, not just a personality trait.',
       'Competition', 'Mental', 'orange', false, false, false,
       ARRAY['How you carry yourself between points tells your opponent a story', 'Walk tall — even when the score says otherwise', 'Composure is not pretending — it is choosing how to respond'],
       ARRAY['Body language consistent across all score situations', 'No visible collapse or celebration that disrupts opponent''s rhythm'],
       ARRAY['Role-play losing badly — how does the player''s body language change?', 'Designate "composure points" in practice — body language graded by the coach'],
       ARRAY['Practice composure only in non-competitive cooperative drills first', 'Coach provides feedback after points, not during'],
       NULL),

      (NULL, 'global_default', 'competition_behavior', 'competition', v_o2_id,
       'What Would You Do If: Bad Call',
       'A tournament scenario prompt. Coach describes a bad call situation and asks the player to walk through how they would respond on court. Trains the decision before the emotion.',
       'Competition', 'Mental', 'orange', false, false, false,
       ARRAY['Calm, direct, respectful — no argument, no apology', 'State your position once. Accept the outcome. Play the next point.', 'You control your response. Not the call.'],
       ARRAY['Player can describe a correct response protocol without prompting', 'Player demonstrates calm response in simulated scenario drill'],
       ARRAY['Simulate the situation in a practice match with a neutral observer', 'Discuss what happens when both players disagree — what is the rule?'],
       ARRAY['Discuss the scenario verbally before any on-court simulation', 'Use low-stakes cooperative play — no actual disputed calls'],
       NULL),

      (NULL, 'global_default', 'competition_behavior', 'competition', v_o2_id,
       'What Would You Do If: Lost the Last Two Points',
       'A competitive decision prompt. Coach pauses a practice match at a pressure moment and asks: "You just lost the last two points — what do you do next?" Builds mental planning habits.',
       'Competition', 'Mental', 'orange', false, false, false,
       ARRAY['Two points lost is information, not a crisis', 'Change something small — target, pace, position — not everything at once', 'Go back to what works first'],
       ARRAY['Player can articulate at least one tactical adjustment after losing two consecutive points', 'Player does not visibly panic or change multiple things at once'],
       ARRAY['Run the scenario mid-match — freeze the point and ask the question', 'Expand to: "what would you change at 0-30 in the third set?"'],
       ARRAY['Discuss verbally first — no live match pressure', 'Give the player two options to choose from instead of open-ended'],
       NULL)

    ON CONFLICT (level_id, content_type, title, version)
    WHERE academy_id IS NULL
    DO NOTHING;

    RAISE NOTICE 'Orange 2: inserted 8 mental/competitive content items';

  END IF;

  -- ============================================================
  -- STEP 4: INSERT new Orange 3 mental / competitive content
  -- ============================================================

  IF v_o3_id IS NOT NULL THEN

    INSERT INTO curriculum_content_items (
      academy_id, source_type, content_type, pathway, level_id,
      title, description, domain, session_block_hint, ball_level,
      is_coach_only, is_player_visible, is_parent_visible,
      coach_cues, success_criteria, progressions, regressions, duration_min
    ) VALUES

      -- MENTAL SKILLS (5 rows) -----------------------------------

      (NULL, 'global_default', 'mental_skill', 'skill', v_o3_id,
       'Start the Point with a Plan',
       'Before every point, the player commits to a serve direction and first-ball pattern — not just a direction, but a 2-ball intention. Trains tactical thinking as a habitual pre-point process.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Serve direction, first groundstroke target, pattern intention — all decided before the toss', 'Plans do not always succeed — committing to one is still correct', 'Adjust the plan after 3 points, not after every error'],
       ARRAY['Player states serve direction and first-ball target before 7 of 10 practice points', 'Player can explain the plan when asked mid-point replay'],
       ARRAY['Add opponent reading — what does their court position tell you about the plan?', 'Advance to 3-ball pattern planning'],
       ARRAY['Two-option plan only: wide or body serve, crosscourt or down-the-line response', 'Coach assigns the first plan — player commits and executes'],
       8),

      (NULL, 'global_default', 'mental_skill', 'skill', v_o3_id,
       'Recognize Short Ball Opportunity',
       'Trains the trigger recognition for attacking a short ball. Player learns the cue (ball lands inside the service line), the decision (attack), and the execution path (approach, close, volley or pass).',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Short ball = a gift — don''t waste it by rallying from the baseline', 'Move through the ball — stop-plant-swing, not a running slice', 'Close to the net after the approach — own the volley'],
       ARRAY['Player moves forward and attacks on 6 of 8 correctly identified short balls', 'No short balls missed because player chose to stay on the baseline'],
       ARRAY['Add decision cost: if the player stays back on a short ball, they lose the point', 'Run short-ball recognition only drill: coach feeds mix of short and deep, player calls "attack" or "rally"'],
       ARRAY['Coach feeds from mid-court so the short ball is predictable', 'Two-step approach only — no running forehand yet'],
       10),

      (NULL, 'global_default', 'mental_skill', 'skill', v_o3_id,
       'End-of-Game Reflection',
       'A structured 60-second post-game reflection prompt. Coach asks three questions: What worked? What gave you trouble? One thing to do differently next game. Builds self-awareness and coachability.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Answer honestly — not what sounds good', 'One thing to change — not everything', 'Reflection is training, not a report card'],
       ARRAY['Player answers all three questions without prompting after a simulated game', 'Answers are specific (a shot, a pattern, a situation) not vague ("I played badly")'],
       ARRAY['Ask the player to predict the three answers before the game starts', 'Run the reflection immediately after the point, not at the end of the session'],
       ARRAY['Coach asks the questions — player just answers', 'Only one question to start: "What worked?"'],
       NULL),

      (NULL, 'global_default', 'mental_skill', 'skill', v_o3_id,
       'Handle a Momentum Shift',
       'When an opponent runs three or four consecutive points, the player has a momentum problem. This module trains the recognition, the pause, and the pattern reset before it becomes a collapse.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Three points in a row going the wrong way is a signal — not a sentence', 'Take your full time on the change-over if one is available', 'Change one thing — pace, spin, pattern, position — not three things'],
       ARRAY['Player makes at least one identifiable tactical change after a 3-point run by opponent', 'No visible collapse in body language during momentum shift'],
       ARRAY['Simulate: coach "helps" opponent score 3 consecutive points, then observes player''s response', 'Add the requirement: player must name the change out loud before the next point'],
       ARRAY['Discuss momentum recognition verbally before any on-court simulation', 'Run only in a low-stakes practice match with no spectators'],
       NULL),

      (NULL, 'global_default', 'mental_skill', 'skill', v_o3_id,
       'Serve Under Pressure — Routine Anchoring',
       'On big points, players rush the pre-serve routine. This module makes the routine the anchor. Identical routine regardless of score trains the nervous system to treat all points as normal.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Timed routine — same duration on game point as on the first point of the set', 'Look at the target last — not the opponent, not the court', 'One bounce, one breath, one target. Then serve.'],
       ARRAY['Pre-serve routine duration within 1 second of baseline time on high-pressure points', 'First-serve percentage not lower than 10% below normal on pressure points'],
       ARRAY['Coach announces: "This is match point" and observes routine — no other instruction', 'Add a heart-rate monitor — train routine stability at elevated heart rate'],
       ARRAY['Practice in cooperative drill only — no competitive points yet', 'Coach counts the routine aloud to help player maintain timing'],
       NULL),

      -- COMPETITION BEHAVIORS (3 rows) --------------------------

      (NULL, 'global_default', 'competition_behavior', 'competition', v_o3_id,
       'Tournament Behavior — Warm-Up Protocol',
       'Trains players to use the pre-match warm-up professionally: cooperate, observe the opponent, establish rhythm. Not a showcase — an information-gathering session and a physical preparation.',
       'Competition', 'Mental', 'orange', false, false, false,
       ARRAY['Warm-up with your opponent, not against them', 'Watch how they prefer to warm up — backhand or forehand first? Net shots?', 'This is your only chance to observe them before the first point — use it'],
       ARRAY['Player cooperates fully in warm-up and does not try to win points', 'Player can identify at least one opponent preference from the warm-up'],
       ARRAY['Discuss what the player observed after a practice match warm-up', 'Add a pre-match scouting sheet — two columns: their strength, their habit'],
       ARRAY['Coach models a professional warm-up and explains each step', 'Only focus on physical readiness first — observation is a secondary skill'],
       NULL),

      (NULL, 'global_default', 'competition_behavior', 'competition', v_o3_id,
       'What Would You Do If: Opponent Is Unsporting',
       'A scenario prompt. Coach describes an opponent who is stalling, making bad calls, or showing disrespect. Player walks through the correct response — control the controllables, stay in the match.',
       'Competition', 'Mental', 'orange', false, false, false,
       ARRAY['You can only control yourself — not your opponent', 'Emotional reaction is what your opponent wants from you', 'Stay in your routine. That is your advantage.'],
       ARRAY['Player describes a correct, composed on-court response without coaching', 'Player does not escalate or match the opponent''s unsporting behavior in simulation'],
       ARRAY['Role-play the full scenario on court — student as player, coach as difficult opponent', 'Discuss what to do if the problem continues — call a referee, speak to the coach'],
       ARRAY['Discuss verbally only — no live simulation yet', 'Focus on two responses: stay focused, then speak calmly once if needed'],
       NULL),

      (NULL, 'global_default', 'competition_behavior', 'competition', v_o3_id,
       'Match Plan Execution and Adjustment',
       'Players enter a practice match with a two-part game plan: primary pattern (what they do when neutral) and an adjustment trigger (what changes if the plan is not working after 3 games).',
       'Competition', 'Mental', 'orange', false, false, false,
       ARRAY['A plan that does not work is still better than no plan', 'Adjust after 3 games — not after 3 points', 'Tell your coach what the plan was — win or lose'],
       ARRAY['Player can state the pre-match plan before the first point', 'Player makes at least one documented tactical adjustment during the match'],
       ARRAY['Add a written plan card — player fills it in before the match', 'Post-match review: compare what was planned to what actually happened'],
       ARRAY['Coach helps create the plan — player is responsible for executing', 'One-part plan only to start: "I will serve wide on deuce side and attack the short ball"'],
       NULL)

    ON CONFLICT (level_id, content_type, title, version)
    WHERE academy_id IS NULL
    DO NOTHING;

    RAISE NOTICE 'Orange 3: inserted 8 mental/competitive content items';

  END IF;

END $$;
