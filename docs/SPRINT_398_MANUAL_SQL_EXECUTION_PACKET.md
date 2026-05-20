# Sprint 398 — Manual SQL Execution Packet
## Supabase SQL Editor Only

**Prepared by:** Sprint 398 Data Foundation Migrations Demo Seed V1
**Project:** https://dbjjhhxdkpdreytsozlq.supabase.co
**Date:** 2026-05-20

---

## Pre-Flight Warnings — Read Before Running Anything

- Run every block in **Supabase SQL Editor** at https://supabase.com/dashboard/project/dbjjhhxdkpdreytsozlq/sql
- Confirm the correct project is open before running any SQL
- Run **one section at a time** — do not paste the entire document
- After each section, run the verification query that follows it
- **Stop immediately if any error occurs** — do not run subsequent sections
- All SQL in this document is additive (no DROP TABLE, no DELETE, no TRUNCATE)
- All schema changes use `IF NOT EXISTS` and `ON CONFLICT DO NOTHING` — safe to re-run
- The demo player seed requires real auth user UUIDs (see Section 10)

---

## Section 0 — Pre-Flight Verification

Run this first. It tells you which migrations are already applied so you can skip sections you do not need.

```sql
-- ── PRE-FLIGHT VERIFICATION ──────────────────────────────────
-- Run this entire block. Review results before proceeding.

-- 1. RLS policies on session_block_exercises
--    Expected if migration 056 was applied: 2 rows
--    Expected if migration 056 was NOT applied: 0 rows
SELECT 'session_block_exercises' AS table_name, policyname, cmd
FROM pg_policies
WHERE tablename = 'session_block_exercises'
ORDER BY cmd;

-- 2. RLS policies on template_block_exercises
--    Expected if migration 058 was applied: 4 rows
--    Expected if migration 055 applied but 058 was not: 2 rows
--    Expected if neither was applied: 0 rows
SELECT 'template_block_exercises' AS table_name, policyname, cmd
FROM pg_policies
WHERE tablename = 'template_block_exercises'
ORDER BY cmd;

-- 3. Sessions RLS recursion fix function
--    Expected if migration 066 was applied: 1 row
--    Expected if migration 066 was NOT applied: 0 rows
SELECT proname, prosecdef AS is_security_definer
FROM pg_proc
WHERE proname = 'session_belongs_to_auth_academy';

-- 4. Template review requests table
--    Expected if migration 067 was applied: 'public.template_review_requests'
--    Expected if migration 067 was NOT applied: NULL
SELECT to_regclass('public.template_review_requests') AS template_review_requests;

-- 5. Curriculum content taxonomy columns
--    Expected if migration 061 was applied: rows with column_name = 'domain', 'ball_level', etc.
--    Expected if migration 061 was NOT applied: 0 rows
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'curriculum_content_items'
  AND column_name IN ('domain', 'session_block_hint', 'ball_level', 'is_player_visible', 'is_parent_visible', 'is_coach_only')
ORDER BY column_name;

-- 6. Gate ID column on requirement_evidence_links
--    Expected if migration 060 was applied: 1 row
--    Expected if migration 060 was NOT applied: 0 rows
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'requirement_evidence_links'
  AND column_name = 'gate_id';

-- 7. Demo academy exists
--    Expected: 1 row with name 'Angles Tennis Academy'
SELECT id, name, slug FROM academies
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 8. Curriculum levels exist
--    Expected: 15 rows
SELECT count(*) AS curriculum_level_count FROM curriculum_levels;
```

**Decision guide:**
- Section 0 result → skip or apply
- `session_block_exercises` returns 0 rows → **apply Section 2 (migration 056)**
- `template_block_exercises` returns 0 rows → **apply Section 3 (migration 058)**
- `session_belongs_to_auth_academy` returns 0 rows → **apply Section 5 (migration 066)**
- `template_review_requests` returns NULL → **apply Section 6 (migration 067)** then **Section 7 (migration 068)**
- `domain` column not in curriculum_content_items → **apply Section 4 (migration 061)** before Section 4b (migration 065)
- `gate_id` not in requirement_evidence_links → **apply Section 1 (migration 060)**

---

## Section 1 — Migration 060: Gate Status Repair

**Apply if:** `gate_id` column not in `requirement_evidence_links` (Section 0 check 6 returned 0 rows)
**What it does:** Completes migration 059 which partially applied. Adds `gate_id` FK column to `requirement_evidence_links`, indexes it, and bootstraps `player_gate_status` rows for any active players already in the system.
**Idempotent:** Yes — `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ON CONFLICT DO NOTHING`

```sql
-- ── MIGRATION 060: GATE STATUS REPAIR ────────────────────────

ALTER TABLE requirement_evidence_links
  ADD COLUMN IF NOT EXISTS gate_id UUID
    REFERENCES curriculum_gates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_req_evidence_gate_id
  ON requirement_evidence_links(gate_id)
  WHERE gate_id IS NOT NULL;

INSERT INTO player_gate_status (
  academy_id,
  player_id,
  gate_id,
  gate_criterion_snapshot,
  status,
  evidence_count,
  is_player_visible,
  is_parent_visible
)
SELECT
  pcs.academy_id,
  pcs.player_id,
  cg.id                   AS gate_id,
  cg.criterion            AS gate_criterion_snapshot,
  'not_started'           AS status,
  0                       AS evidence_count,
  false                   AS is_player_visible,
  false                   AS is_parent_visible
FROM player_curriculum_states pcs
JOIN curriculum_gates cg
  ON cg.from_level_id = pcs.current_level_id
WHERE cg.is_active = true
ON CONFLICT (player_id, gate_id) DO NOTHING;
```

**Verification after Section 1:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'requirement_evidence_links' AND column_name = 'gate_id';
-- Expected: 1 row
```

---

## Section 2 — Migration 056: Session Block Exercises RLS

**Apply if:** `session_block_exercises` table shows 0 policies in Section 0 check 1
**What it does:** Adds missing RLS policies to `session_block_exercises`. Without these, `generateSessionFromTemplateAction` creates sessions and blocks but fails at step 9 (INSERT into session_block_exercises returns RLS error). Coach session execution page shows no exercises.
**Idempotent:** Note: PostgreSQL does not support `CREATE POLICY IF NOT EXISTS`. If you see "policy already exists" error, these policies are already applied — skip this section.

```sql
-- ── MIGRATION 056: SESSION BLOCK EXERCISES RLS ───────────────

CREATE POLICY "Staff see session block exercises"
  ON session_block_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM session_blocks sb
      JOIN sessions s ON s.id = sb.session_id
      WHERE sb.id = session_block_exercises.block_id
        AND s.academy_id = auth_academy_id()
        AND auth_is_staff()
    )
  );

CREATE POLICY "Staff manage session block exercises"
  ON session_block_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM session_blocks sb
      JOIN sessions s ON s.id = sb.session_id
      WHERE sb.id = session_block_exercises.block_id
        AND s.academy_id = auth_academy_id()
        AND auth_is_staff()
    )
  );
```

**Verification after Section 2:**
```sql
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'session_block_exercises'
ORDER BY cmd;
-- Expected: 2 rows
```

---

## Section 3 — Migration 058: Template Block Exercises RLS (Idempotent)

**Apply if:** `template_block_exercises` shows fewer than 4 policies in Section 0 check 2
**What it does:** Drops any existing template_block_exercises policies from migration 055 (if present) and creates 4 granular policies (SELECT / INSERT / UPDATE / DELETE). Without these, the director "Populate Blocks with Exercises" action fails.
**Idempotent:** Yes — uses `DROP POLICY IF EXISTS` guards before creating.

```sql
-- ── MIGRATION 058: TEMPLATE BLOCK EXERCISES RLS (IDEMPOTENT) ─

DROP POLICY IF EXISTS "Staff see template block exercises"    ON template_block_exercises;
DROP POLICY IF EXISTS "Staff manage template block exercises" ON template_block_exercises;
DROP POLICY IF EXISTS "Staff insert template block exercises" ON template_block_exercises;
DROP POLICY IF EXISTS "Staff update template block exercises" ON template_block_exercises;
DROP POLICY IF EXISTS "Staff delete template block exercises" ON template_block_exercises;

ALTER TABLE template_block_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see template block exercises"
  ON template_block_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_staff()
    )
  );

CREATE POLICY "Staff insert template block exercises"
  ON template_block_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_staff()
    )
  );

CREATE POLICY "Staff update template block exercises"
  ON template_block_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_staff()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_staff()
    )
  );

CREATE POLICY "Staff delete template block exercises"
  ON template_block_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_staff()
    )
  );
```

**Verification after Section 3:**
```sql
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'template_block_exercises'
ORDER BY cmd;
-- Expected: 4 rows
```

---

## Section 4 — Migration 061: Curriculum Content Taxonomy

**Apply if:** `domain` column not in `curriculum_content_items` (Section 0 check 5 returned 0 rows)
**What it does:** Adds 6 new columns to `curriculum_content_items` (domain, session_block_hint, is_player_visible, is_parent_visible, is_coach_only, ball_level). Expands the content_type CHECK constraint to include 9 new taxonomy values. Adds 7 indexes.
**Idempotent:** Yes — `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, DO block for constraint drop

**Must apply before Section 4b (migration 065).**

```sql
-- ── MIGRATION 061: CURRICULUM CONTENT TAXONOMY ───────────────

ALTER TABLE curriculum_content_items
  ADD COLUMN IF NOT EXISTS domain TEXT
    CHECK (domain IN (
      'Technical', 'Tactical', 'Movement', 'Competition',
      'Mentality', 'Fitness', 'Recovery', 'Lifestyle', 'Games', 'Assessment'
    ));

ALTER TABLE curriculum_content_items
  ADD COLUMN IF NOT EXISTS session_block_hint TEXT
    CHECK (session_block_hint IN (
      'Warm-Up', 'Focus', 'Train', 'Play', 'Game',
      'Situational', 'Match-Play', 'Assessment', 'Cool-Down'
    ));

ALTER TABLE curriculum_content_items
  ADD COLUMN IF NOT EXISTS is_player_visible BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE curriculum_content_items
  ADD COLUMN IF NOT EXISTS is_parent_visible BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE curriculum_content_items
  ADD COLUMN IF NOT EXISTS is_coach_only BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE curriculum_content_items
  ADD COLUMN IF NOT EXISTS ball_level TEXT
    CHECK (ball_level IN ('red', 'orange', 'green', 'yellow', 'any'));

-- Expand content_type CHECK constraint dynamically
DO $$
DECLARE
  v_constraint_name TEXT;
BEGIN
  SELECT conname INTO v_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.curriculum_content_items'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%content_type%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE curriculum_content_items DROP CONSTRAINT %I',
      v_constraint_name
    );
    RAISE NOTICE 'Dropped existing content_type CHECK constraint "%".', v_constraint_name;
  ELSE
    RAISE NOTICE 'No existing content_type CHECK constraint found — skipping drop.';
  END IF;
END $$;

ALTER TABLE curriculum_content_items
  ADD CONSTRAINT curriculum_content_items_content_type_check
  CHECK (content_type IN (
    'drill', 'game', 'skill', 'assessment', 'warmup', 'cooldown',
    'fitness', 'tactical', 'competition',
    'tactical_game', 'situational', 'match_play_theme', 'mental_skill',
    'competition_behavior', 'coach_cue', 'success_criteria',
    'success_criteria_item', 'progression', 'regression',
    'player_mission', 'parent_guidance', 'level_gate_support'
  ));

CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_content_type
  ON curriculum_content_items(content_type);

CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_domain
  ON curriculum_content_items(domain)
  WHERE domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_session_block_hint
  ON curriculum_content_items(session_block_hint)
  WHERE session_block_hint IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_ball_level
  ON curriculum_content_items(ball_level)
  WHERE ball_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_player_visible
  ON curriculum_content_items(is_player_visible)
  WHERE is_player_visible = true;

CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_parent_visible
  ON curriculum_content_items(is_parent_visible)
  WHERE is_parent_visible = true;

CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_lesson_plan
  ON curriculum_content_items(level_id, domain, content_type)
  WHERE is_active = true;
```

**Verification after Section 4:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'curriculum_content_items'
  AND column_name IN ('domain', 'session_block_hint', 'ball_level', 'is_player_visible', 'is_parent_visible', 'is_coach_only')
ORDER BY column_name;
-- Expected: 6 rows
```

---

## Section 4b — Migration 065: Mental / Competitive Content Seed

**Apply if:** You want mental/competitive curriculum content seeded for Orange 1–3
**Must apply after:** Section 4 (migration 061) — requires `domain`, `session_block_hint`, `ball_level` columns
**What it does:** Extends `session_block_hint` CHECK to include 'Mental'. Updates Orange 1 mental_skill and competition_behavior rows to `session_block_hint = 'Mental'`. Inserts 8 new mental/competitive items for Orange 2 and 8 for Orange 3.
**Idempotent:** Yes — UPDATEs to same value are no-ops; INSERTs use `ON CONFLICT DO NOTHING`

```sql
-- ── MIGRATION 065: MENTAL / COMPETITIVE CONTENT SEED ─────────

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
    RAISE WARNING 'No Orange curriculum levels found — migration 065 skipped.';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 065: O1=%, O2=%, O3=%', v_o1_id, v_o2_id, v_o3_id;

  -- Update Orange 1 mental rows
  IF v_o1_id IS NOT NULL THEN
    UPDATE curriculum_content_items
    SET session_block_hint = 'Mental', domain = 'Mentality'
    WHERE content_type = 'mental_skill' AND level_id = v_o1_id AND academy_id IS NULL;

    UPDATE curriculum_content_items
    SET session_block_hint = 'Mental', domain = 'Competition'
    WHERE content_type = 'competition_behavior' AND level_id = v_o1_id AND academy_id IS NULL;

    RAISE NOTICE 'Orange 1: updated mental_skill + competition_behavior rows';
  END IF;

  -- Insert Orange 2 mental/competitive content
  IF v_o2_id IS NOT NULL THEN
    INSERT INTO curriculum_content_items (
      academy_id, source_type, content_type, pathway, level_id,
      title, description, domain, session_block_hint, ball_level,
      is_coach_only, is_player_visible, is_parent_visible,
      coach_cues, success_criteria, progressions, regressions, duration_min
    ) VALUES
      (NULL, 'global_default', 'mental_skill', 'skill', v_o2_id,
       'Choose Your Next Target',
       'Before each point, the player commits to a specific target — not just "in." Builds the habit of starting points with a plan instead of just reacting.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Pick your target before you walk to the baseline', 'Commit to the target — hesitation creates errors', 'A clear intention beats a hard swing'],
       ARRAY['Player verbally states or signals a target before each practice point', 'Target selection consistent on 7 of 10 points'],
       ARRAY['Add a consequence: 1 point only for landing in the chosen zone', 'Target varies by score — defensive at 0-30, attacking at 30-0'],
       ARRAY['Coach chooses the target for the player to start', 'Two-target choice only — crosscourt or down the line'], 8),
      (NULL, 'global_default', 'mental_skill', 'skill', v_o2_id,
       'Between-Point Body Reset',
       'A structured between-point reset sequence: turn away from the net, take one slow breath, square shoulders, walk to position.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Turn your back to the net after every point — not just the tough ones', 'Slow the walk — urgency after a bad point is a tell', 'Your body language is information for your opponent'],
       ARRAY['Player executes full reset sequence on 8 of 10 between-point transitions', 'Body pace visibly slows within 3 seconds of a point ending'],
       ARRAY['Add a trigger action — e.g., squeeze the racket handle once before turning', 'Time the reset — should be 4–6 seconds before the next point'],
       ARRAY['Coach cues the reset verbally after each point', 'Use only after errors first — then after all points'], NULL),
      (NULL, 'global_default', 'mental_skill', 'skill', v_o2_id,
       'Pressure Point Routine',
       'Players develop a specific routine for high-pressure moments: 30-40, break point, tiebreak.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Pressure points feel different — your routine should not', 'Slow your pre-serve routine slightly, do not rush', 'One target. One breath. Serve.'],
       ARRAY['Pre-serve routine identical on pressure points and normal points', 'No extended pause or change in body language on pressure points'],
       ARRAY['Designate pressure points in practice — announce them before the point', 'Add a score consequence to intensify the pressure environment'],
       ARRAY['Practice in cooperative drills only — no consequences yet', 'Coach narrates the routine step by step before the player executes'], NULL),
      (NULL, 'global_default', 'mental_skill', 'skill', v_o2_id,
       'Recover After Frustration',
       'When a player shows negative body language after an error — coach pauses play and runs the recovery routine.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Frustration is information — what is it telling you?', 'The ball does not care how frustrated you are', 'Recover fast. The next point starts fresh.'],
       ARRAY['Visible frustration cue followed by recovery within 10 seconds', 'No second frustration event within 3 points of the first'],
       ARRAY['Player self-identifies their frustration triggers and shares with coach', 'Develop a personal reset phrase for high-frustration moments'],
       ARRAY['Coach intervenes gently — not as a reprimand, as a reminder', 'Practice only after establishing trust and rapport'], NULL),
      (NULL, 'global_default', 'mental_skill', 'skill', v_o2_id,
       'Attack / Rally / Defend / Reset Decision',
       'Players learn to read the ball, court position, and score, then choose a mode.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Short ball in the court = attack opportunity', 'Ball behind the baseline = rally or defend', 'Recognize when to be aggressive and when to be smart'],
       ARRAY['Player correctly identifies their shot mode on 6 of 10 balls', 'No forced attacking shots from defensive positions'],
       ARRAY['Add score context — what changes at 0-30 vs 30-0?', 'Three-ball pattern recognition drill — coach calls mode after each shot'],
       ARRAY['Start with two modes only: attack or rally', 'Coach calls the mode before each feed to build recognition'], 10),
      (NULL, 'global_default', 'competition_behavior', 'competition', v_o2_id,
       'Compete with Composure',
       'Trains players to maintain consistent body language and pace regardless of the score.',
       'Competition', 'Mental', 'orange', false, false, false,
       ARRAY['How you carry yourself between points tells your opponent a story', 'Walk tall — even when the score says otherwise', 'Composure is not pretending — it is choosing how to respond'],
       ARRAY['Body language consistent across all score situations', 'No visible collapse or celebration that disrupts opponent''s rhythm'],
       ARRAY['Role-play losing badly — how does the player''s body language change?', 'Designate "composure points" in practice — body language graded by the coach'],
       ARRAY['Practice composure only in non-competitive cooperative drills first', 'Coach provides feedback after points, not during'], NULL),
      (NULL, 'global_default', 'competition_behavior', 'competition', v_o2_id,
       'What Would You Do If: Bad Call',
       'A tournament scenario prompt. Coach describes a bad call situation.',
       'Competition', 'Mental', 'orange', false, false, false,
       ARRAY['Calm, direct, respectful — no argument, no apology', 'State your position once. Accept the outcome. Play the next point.', 'You control your response. Not the call.'],
       ARRAY['Player can describe a correct response protocol without prompting', 'Player demonstrates calm response in simulated scenario drill'],
       ARRAY['Simulate the situation in a practice match with a neutral observer', 'Discuss what happens when both players disagree — what is the rule?'],
       ARRAY['Discuss the scenario verbally before any on-court simulation', 'Use low-stakes cooperative play — no actual disputed calls'], NULL),
      (NULL, 'global_default', 'competition_behavior', 'competition', v_o2_id,
       'What Would You Do If: Lost the Last Two Points',
       'A competitive decision prompt. Coach pauses a practice match at a pressure moment.',
       'Competition', 'Mental', 'orange', false, false, false,
       ARRAY['Two points lost is information, not a crisis', 'Change something small — target, pace, position — not everything at once', 'Go back to what works first'],
       ARRAY['Player can articulate at least one tactical adjustment after losing two consecutive points', 'Player does not visibly panic or change multiple things at once'],
       ARRAY['Run the scenario mid-match — freeze the point and ask the question', 'Expand to: "what would you change at 0-30 in the third set?"'],
       ARRAY['Discuss verbally first — no live match pressure', 'Give the player two options to choose from instead of open-ended'], NULL)
    ON CONFLICT (level_id, content_type, title, version)
    WHERE academy_id IS NULL
    DO NOTHING;
    RAISE NOTICE 'Orange 2: inserted mental/competitive content items';
  END IF;

  -- Insert Orange 3 mental/competitive content
  IF v_o3_id IS NOT NULL THEN
    INSERT INTO curriculum_content_items (
      academy_id, source_type, content_type, pathway, level_id,
      title, description, domain, session_block_hint, ball_level,
      is_coach_only, is_player_visible, is_parent_visible,
      coach_cues, success_criteria, progressions, regressions, duration_min
    ) VALUES
      (NULL, 'global_default', 'mental_skill', 'skill', v_o3_id,
       'Start the Point with a Plan',
       'Before every point, the player commits to a serve direction and first-ball pattern.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Serve direction, first groundstroke target, pattern intention — all decided before the toss', 'Plans do not always succeed — committing to one is still correct', 'Adjust the plan after 3 points, not after every error'],
       ARRAY['Player states serve direction and first-ball target before 7 of 10 practice points', 'Player can explain the plan when asked mid-point replay'],
       ARRAY['Add opponent reading — what does their court position tell you about the plan?', 'Advance to 3-ball pattern planning'],
       ARRAY['Two-option plan only: wide or body serve, crosscourt or down-the-line response', 'Coach assigns the first plan — player commits and executes'], 8),
      (NULL, 'global_default', 'mental_skill', 'skill', v_o3_id,
       'Recognize Short Ball Opportunity',
       'Trains the trigger recognition for attacking a short ball.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Short ball = a gift — don''t waste it by rallying from the baseline', 'Move through the ball — stop-plant-swing, not a running slice', 'Close to the net after the approach — own the volley'],
       ARRAY['Player moves forward and attacks on 6 of 8 correctly identified short balls', 'No short balls missed because player chose to stay on the baseline'],
       ARRAY['Add decision cost: if the player stays back on a short ball, they lose the point', 'Run short-ball recognition only drill'],
       ARRAY['Coach feeds from mid-court so the short ball is predictable', 'Two-step approach only — no running forehand yet'], 10),
      (NULL, 'global_default', 'mental_skill', 'skill', v_o3_id,
       'End-of-Game Reflection',
       'A structured 60-second post-game reflection prompt. Coach asks three questions.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Answer honestly — not what sounds good', 'One thing to change — not everything', 'Reflection is training, not a report card'],
       ARRAY['Player answers all three questions without prompting after a simulated game', 'Answers are specific not vague'],
       ARRAY['Ask the player to predict the three answers before the game starts', 'Run the reflection immediately after the point, not at the end of the session'],
       ARRAY['Coach asks the questions — player just answers', 'Only one question to start: "What worked?"'], NULL),
      (NULL, 'global_default', 'mental_skill', 'skill', v_o3_id,
       'Handle a Momentum Shift',
       'When an opponent runs three or four consecutive points, this module trains the recognition, the pause, and the pattern reset.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Three points in a row going the wrong way is a signal — not a sentence', 'Take your full time on the change-over if one is available', 'Change one thing — pace, spin, pattern, position — not three things'],
       ARRAY['Player makes at least one identifiable tactical change after a 3-point run by opponent', 'No visible collapse in body language during momentum shift'],
       ARRAY['Simulate: coach "helps" opponent score 3 consecutive points, then observes player''s response', 'Add the requirement: player must name the change out loud before the next point'],
       ARRAY['Discuss momentum recognition verbally before any on-court simulation', 'Run only in a low-stakes practice match with no spectators'], NULL),
      (NULL, 'global_default', 'mental_skill', 'skill', v_o3_id,
       'Serve Under Pressure — Routine Anchoring',
       'On big points, players rush the pre-serve routine. This module makes the routine the anchor.',
       'Mentality', 'Mental', 'orange', false, false, false,
       ARRAY['Timed routine — same duration on game point as on the first point of the set', 'Look at the target last — not the opponent, not the court', 'One bounce, one breath, one target. Then serve.'],
       ARRAY['Pre-serve routine duration within 1 second of baseline time on high-pressure points', 'First-serve percentage not lower than 10% below normal on pressure points'],
       ARRAY['Coach announces: "This is match point" and observes routine — no other instruction', 'Add a heart-rate monitor — train routine stability at elevated heart rate'],
       ARRAY['Practice in cooperative drill only — no competitive points yet', 'Coach counts the routine aloud to help player maintain timing'], NULL),
      (NULL, 'global_default', 'competition_behavior', 'competition', v_o3_id,
       'Tournament Behavior — Warm-Up Protocol',
       'Trains players to use the pre-match warm-up professionally.',
       'Competition', 'Mental', 'orange', false, false, false,
       ARRAY['Warm-up with your opponent, not against them', 'Watch how they prefer to warm up — backhand or forehand first?', 'This is your only chance to observe them before the first point — use it'],
       ARRAY['Player cooperates fully in warm-up and does not try to win points', 'Player can identify at least one opponent preference from the warm-up'],
       ARRAY['Discuss what the player observed after a practice match warm-up', 'Add a pre-match scouting sheet'],
       ARRAY['Coach models a professional warm-up and explains each step', 'Only focus on physical readiness first'], NULL),
      (NULL, 'global_default', 'competition_behavior', 'competition', v_o3_id,
       'What Would You Do If: Opponent Is Unsporting',
       'A scenario prompt. Coach describes an opponent who is stalling, making bad calls, or showing disrespect.',
       'Competition', 'Mental', 'orange', false, false, false,
       ARRAY['You can only control yourself — not your opponent', 'Emotional reaction is what your opponent wants from you', 'Stay in your routine. That is your advantage.'],
       ARRAY['Player describes a correct, composed on-court response without coaching', 'Player does not escalate or match the opponent''s unsporting behavior in simulation'],
       ARRAY['Role-play the full scenario on court — student as player, coach as difficult opponent', 'Discuss what to do if the problem continues — call a referee, speak to the coach'],
       ARRAY['Discuss verbally only — no live simulation yet', 'Focus on two responses: stay focused, then speak calmly once if needed'], NULL),
      (NULL, 'global_default', 'competition_behavior', 'competition', v_o3_id,
       'Match Plan Execution and Adjustment',
       'Players enter a practice match with a two-part game plan.',
       'Competition', 'Mental', 'orange', false, false, false,
       ARRAY['A plan that does not work is still better than no plan', 'Adjust after 3 games — not after 3 points', 'Tell your coach what the plan was — win or lose'],
       ARRAY['Player can state the pre-match plan before the first point', 'Player makes at least one documented tactical adjustment during the match'],
       ARRAY['Add a written plan card — player fills it in before the match', 'Post-match review: compare what was planned to what actually happened'],
       ARRAY['Coach helps create the plan — player is responsible for executing', 'One-part plan only to start'], NULL)
    ON CONFLICT (level_id, content_type, title, version)
    WHERE academy_id IS NULL
    DO NOTHING;
    RAISE NOTICE 'Orange 3: inserted mental/competitive content items';
  END IF;

END $$;
```

**Verification after Section 4b:**
```sql
SELECT content_type, count(*) FROM curriculum_content_items
WHERE content_type IN ('mental_skill', 'competition_behavior')
  AND academy_id IS NULL
GROUP BY content_type
ORDER BY content_type;
-- Expected: both rows with count > 0
```

---

## Section 5 — Migration 066: Sessions RLS Recursion Fix

**Apply if:** `session_belongs_to_auth_academy` function does not exist (Section 0 check 3 returned 0 rows)
**What it does:** Creates `session_belongs_to_auth_academy()` SECURITY DEFINER function. Drops and recreates `session_attendance` RLS policies to use it, breaking the circular reference between sessions and session_attendance RLS that caused infinite recursion on director session creation.
**Idempotent:** Yes — `CREATE OR REPLACE FUNCTION`, `DROP POLICY IF EXISTS`

```sql
-- ── MIGRATION 066: SESSIONS RLS RECURSION FIX ────────────────

CREATE OR REPLACE FUNCTION session_belongs_to_auth_academy(p_session_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM sessions
    WHERE id = p_session_id
      AND academy_id = auth_academy_id()
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "Staff see attendance"    ON session_attendance;
DROP POLICY IF EXISTS "Staff manage attendance" ON session_attendance;

CREATE POLICY "Staff see attendance"
  ON session_attendance FOR SELECT
  USING (
    session_belongs_to_auth_academy(session_attendance.session_id)
    AND auth_is_staff()
  );

CREATE POLICY "Staff manage attendance"
  ON session_attendance FOR ALL
  USING (
    session_belongs_to_auth_academy(session_attendance.session_id)
    AND auth_is_staff()
  );
```

**Verification after Section 5:**
```sql
SELECT proname, prosecdef AS is_security_definer
FROM pg_proc WHERE proname = 'session_belongs_to_auth_academy';
-- Expected: 1 row, is_security_definer = true

SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'session_attendance' ORDER BY cmd;
-- Expected: 2 rows
```

---

## Section 6 — Migration 067: Template Schema Extension

**Apply if:** `template_review_requests` table does not exist (Section 0 check 4 returned NULL)
**What it does:** Adds 8 columns to `templates`, 6 columns to `template_blocks`, 10 columns to `template_block_exercises`, 5 columns to `curriculum_class_template_blocks`. Creates `template_review_requests` and `template_version_history` tables with RLS.
**Idempotent:** Yes — `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`
**Note:** Migration 068 MUST be applied after this section.

```sql
-- ── MIGRATION 067: TEMPLATE SCHEMA EXTENSION ─────────────────

-- SECTION 1: EXTEND templates
ALTER TABLE templates ADD COLUMN IF NOT EXISTS template_type TEXT
  CHECK (template_type IN ('class_template', 'fitness_template'));

ALTER TABLE templates ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'needs_review', 'ready', 'archived'));

ALTER TABLE templates ADD COLUMN IF NOT EXISTS curriculum_stage_key TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS curriculum_level_key TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS curriculum_source_label TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS template_goal TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS pathway_focus TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE templates ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_templates_type_status
  ON templates(academy_id, template_type, status);

CREATE INDEX IF NOT EXISTS idx_templates_curriculum_stage
  ON templates(academy_id, curriculum_stage_key)
  WHERE curriculum_stage_key IS NOT NULL;

-- SECTION 2: EXTEND template_blocks
ALTER TABLE template_blocks ADD COLUMN IF NOT EXISTS curriculum_connection TEXT;
ALTER TABLE template_blocks ADD COLUMN IF NOT EXISTS coach_watch_for TEXT;
ALTER TABLE template_blocks ADD COLUMN IF NOT EXISTS fitness_block_type TEXT;
ALTER TABLE template_blocks ADD COLUMN IF NOT EXISTS intensity_level TEXT;
ALTER TABLE template_blocks ADD COLUMN IF NOT EXISTS load_level TEXT;
ALTER TABLE template_blocks ADD COLUMN IF NOT EXISTS source_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB;

-- SECTION 3: EXTEND template_block_exercises
ALTER TABLE template_block_exercises ADD COLUMN IF NOT EXISTS exercise_label TEXT;
ALTER TABLE template_block_exercises ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE template_block_exercises ADD COLUMN IF NOT EXISTS sets_reps_duration TEXT;
ALTER TABLE template_block_exercises ADD COLUMN IF NOT EXISTS load_level TEXT;
ALTER TABLE template_block_exercises ADD COLUMN IF NOT EXISTS tennis_transfer TEXT;
ALTER TABLE template_block_exercises ADD COLUMN IF NOT EXISTS progression TEXT;
ALTER TABLE template_block_exercises ADD COLUMN IF NOT EXISTS regression TEXT;
ALTER TABLE template_block_exercises ADD COLUMN IF NOT EXISTS equipment TEXT;
ALTER TABLE template_block_exercises ADD COLUMN IF NOT EXISTS coaching_cue TEXT;
ALTER TABLE template_block_exercises ADD COLUMN IF NOT EXISTS source_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB;

-- SECTION 4: EXTEND curriculum_class_template_blocks
ALTER TABLE curriculum_class_template_blocks ADD COLUMN IF NOT EXISTS curriculum_level_key TEXT;
ALTER TABLE curriculum_class_template_blocks ADD COLUMN IF NOT EXISTS assessment_gate_label TEXT;
ALTER TABLE curriculum_class_template_blocks ADD COLUMN IF NOT EXISTS player_mission_label TEXT;
ALTER TABLE curriculum_class_template_blocks ADD COLUMN IF NOT EXISTS coach_watch_for TEXT;
ALTER TABLE curriculum_class_template_blocks ADD COLUMN IF NOT EXISTS source_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB;

-- SECTION 5: CREATE template_review_requests
CREATE TABLE IF NOT EXISTS template_review_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  template_id     UUID        REFERENCES templates(id) ON DELETE CASCADE,
  template_draft  JSONB       NOT NULL DEFAULT '{}'::JSONB,
  request_type    TEXT        NOT NULL
    CHECK (request_type IN ('create_template', 'update_template', 'archive_template', 'duplicate_template')),
  status          TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_by    UUID        REFERENCES profiles(id),
  reviewed_by     UUID        REFERENCES profiles(id),
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,
  proposed_action_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trr_academy_status  ON template_review_requests(academy_id, status);
CREATE INDEX IF NOT EXISTS idx_trr_template_id     ON template_review_requests(template_id);
CREATE INDEX IF NOT EXISTS idx_trr_requested_by    ON template_review_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_trr_reviewed_by     ON template_review_requests(reviewed_by) WHERE reviewed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trr_created_at      ON template_review_requests(academy_id, created_at DESC);

CREATE TRIGGER tr_template_review_requests_updated_at
  BEFORE UPDATE ON template_review_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE template_review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors see template review requests"
  ON template_review_requests FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Directors submit template review requests"
  ON template_review_requests FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Directors review template requests"
  ON template_review_requests FOR UPDATE
  USING (academy_id = auth_academy_id() AND auth_has_role('academy_director'));

-- SECTION 6: CREATE template_version_history
CREATE TABLE IF NOT EXISTS template_version_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  template_id     UUID        NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  version_number  INTEGER     NOT NULL,
  change_type     TEXT        NOT NULL,
  snapshot        JSONB       NOT NULL DEFAULT '{}'::JSONB,
  changed_by      UUID        REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_template_version UNIQUE (template_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_tvh_academy_template ON template_version_history(academy_id, template_id);
CREATE INDEX IF NOT EXISTS idx_tvh_created_at       ON template_version_history(template_id, created_at DESC);

ALTER TABLE template_version_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors see template version history"
  ON template_version_history FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Directors insert template version history"
  ON template_version_history FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_has_role('academy_director'));
```

**Verification after Section 6:**
```sql
SELECT to_regclass('public.template_review_requests')  AS template_review_requests;
SELECT to_regclass('public.template_version_history')  AS template_version_history;
SELECT column_name FROM information_schema.columns
WHERE table_name = 'templates' AND column_name = 'status';
-- All three: should return non-null values
```

---

## Section 7 — Migration 068: Template RLS Policy Refinements

**Apply if:** Migration 067 was just applied (or already was applied)
**Must apply after:** Section 6 (migration 067) — references `templates.status` added in 067
**What it does:** Replaces the broad "Staff see templates" / "Staff manage templates" policies from migration 006 with status-aware, role-differentiated policies. Coaches see only `status = 'ready'` templates. Only directors can approve (transition to `ready`). Replaces broad template_block_exercises mutation policies with director/head-only versions.
**Idempotent:** Yes — uses `DROP POLICY IF EXISTS` throughout

```sql
-- ── MIGRATION 068: TEMPLATE RLS POLICY REFINEMENTS ───────────

-- SECTION 1: templates
DROP POLICY IF EXISTS "Staff see templates"    ON templates;
DROP POLICY IF EXISTS "Staff manage templates" ON templates;

CREATE POLICY "Directors see all templates"
  ON templates FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Coaches see ready templates"
  ON templates FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_has_role('coach') AND status = 'ready');

CREATE POLICY "Creators see own templates"
  ON templates FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff() AND created_by = auth.uid());

CREATE POLICY "Directors insert templates"
  ON templates FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Directors update templates"
  ON templates FOR UPDATE
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head())
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
    AND (status != 'ready' OR auth_has_role('academy_director'))
  );

CREATE POLICY "Directors delete templates"
  ON templates FOR DELETE
  USING (academy_id = auth_academy_id() AND auth_has_role('academy_director'));

-- SECTION 2: template_blocks
DROP POLICY IF EXISTS "Staff manage template blocks" ON template_blocks;

CREATE POLICY "Directors manage template blocks"
  ON template_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM templates t
      WHERE t.id = template_blocks.template_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_director_or_head()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates t
      WHERE t.id = template_blocks.template_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_director_or_head()
    )
  );

-- SECTION 3: template_block_exercises
DROP POLICY IF EXISTS "Staff insert template block exercises" ON template_block_exercises;
DROP POLICY IF EXISTS "Staff update template block exercises" ON template_block_exercises;
DROP POLICY IF EXISTS "Staff delete template block exercises" ON template_block_exercises;

CREATE POLICY "Directors insert template block exercises"
  ON template_block_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_director_or_head()
    )
  );

CREATE POLICY "Directors update template block exercises"
  ON template_block_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_director_or_head()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_director_or_head()
    )
  );

CREATE POLICY "Directors delete template block exercises"
  ON template_block_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_director_or_head()
    )
  );
```

**Verification after Section 7:**
```sql
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'templates'
ORDER BY cmd, policyname;
-- Expected: 6 rows (Directors see all, Coaches see ready, Creators see own,
--           Directors insert, Directors update, Directors delete)

SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'template_block_exercises'
ORDER BY cmd;
-- Expected: 4 rows (See + Insert + Update + Delete)
```

---

## Section 8 — Demo Player Seed (Part A: Profile Rows)

**Prerequisite:** Create 4 auth users in Supabase Dashboard → Authentication → Users BEFORE running this section.
Required emails (or your own preferred pilots):
- `director@angles-pilot.test`
- `coach@angles-pilot.test`
- `player@angles-pilot.test`
- `parent@angles-pilot.test`

After creating each user, copy their UUID from the Authentication page.
Then replace the four placeholder UUIDs below before running.

```sql
-- ── DEMO SEED PART A: PROFILE ROWS ───────────────────────────
-- REPLACE THESE 4 UUIDs with real Supabase Auth user UUIDs before running.

DO $$
DECLARE
  v_director_uuid UUID := '<REPLACE_WITH_DIRECTOR_AUTH_UUID>';
  v_coach_uuid    UUID := '<REPLACE_WITH_COACH_AUTH_UUID>';
  v_player_uuid   UUID := '<REPLACE_WITH_PLAYER_AUTH_UUID>';
  v_parent_uuid   UUID := '<REPLACE_WITH_PARENT_AUTH_UUID>';
BEGIN
  INSERT INTO profiles (id, email, role, academy_id, full_name, has_seen_first_run_deck)
  VALUES
    (v_director_uuid, 'director@angles-pilot.test', 'academy_director',
     '00000000-0000-0000-0000-000000000001', 'Demo Director', true),
    (v_coach_uuid,    'coach@angles-pilot.test',    'coach',
     '00000000-0000-0000-0000-000000000001', 'Demo Coach', true),
    (v_player_uuid,   'player@angles-pilot.test',   'player',
     '00000000-0000-0000-0000-000000000001', 'Alex Chen', false),
    (v_parent_uuid,   'parent@angles-pilot.test',   'parent',
     '00000000-0000-0000-0000-000000000001', 'Demo Parent', false)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Profile rows inserted (or already existed).';
END $$;
```

**Verification:**
```sql
SELECT id, role, full_name FROM profiles
WHERE academy_id = '00000000-0000-0000-0000-000000000001'
ORDER BY role;
-- Expected: 4 rows
```

---

## Section 9 — Demo Player Seed (Part B: Domain Rows)

**Prerequisite:** Section 8 must have completed successfully. Replace `<REPLACE_WITH_PLAYER_AUTH_UUID>` and `<REPLACE_WITH_PARENT_AUTH_UUID>` with the same UUIDs used in Section 8.

```sql
-- ── DEMO SEED PART B: DOMAIN ROWS ────────────────────────────
-- REPLACE THE TWO UUIDs below with the same values used in Section 8.

DO $$
DECLARE
  v_player_uuid   UUID := '<REPLACE_WITH_PLAYER_AUTH_UUID>';
  v_parent_uuid   UUID := '<REPLACE_WITH_PARENT_AUTH_UUID>';
  v_coach_uuid    UUID := '<REPLACE_WITH_COACH_AUTH_UUID>';
  v_o1_level_id   UUID;
BEGIN
  -- Resolve Orange 1 level ID
  SELECT id INTO v_o1_level_id
  FROM curriculum_levels
  WHERE stage = 'orange_development' AND level_number = 1
  LIMIT 1;

  IF v_o1_level_id IS NULL THEN
    RAISE EXCEPTION 'Orange 1 curriculum level not found. Apply migration 036 first.';
  END IF;

  RAISE NOTICE 'Orange 1 level ID: %', v_o1_level_id;

  -- 1. Demo player row
  INSERT INTO players (
    id, academy_id, profile_id, first_name, last_name, full_name,
    date_of_birth, is_active, curriculum_level_id
  ) VALUES (
    '00000000-0000-0003-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    v_player_uuid,
    'Alex', 'Chen', 'Alex Chen',
    '2014-03-15', true,
    v_o1_level_id
  ) ON CONFLICT (id) DO NOTHING;

  -- 2. Coach profile
  INSERT INTO coach_profiles (
    id, academy_id, profile_id, full_name, bio, is_active
  ) VALUES (
    '00000000-0000-0007-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    v_coach_uuid,
    'Demo Coach', 'Orange ball and green ball specialist. 8 years coaching experience.', true
  ) ON CONFLICT (id) DO NOTHING;

  -- 3. Player priorities (active missions)
  INSERT INTO player_priorities (
    id, academy_id, player_id, title, description,
    category, urgency, priority_rank, is_active, show_to_student, show_to_parent
  ) VALUES
    (
      '00000000-0000-0004-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0003-0000-000000000001',
      'Develop consistent forehand follow-through',
      'Focus on completing the swing with the racket finishing high across the left shoulder. The swing is stopping short — causing inconsistent pace and direction.',
      'technical', 'critical', 1, true, true, false
    ),
    (
      '00000000-0000-0004-0000-000000000002',
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0003-0000-000000000001',
      'Rally consistency — 5+ ball exchanges',
      'Build the habit of staying in the rally rather than going for winners too early. Target: 5 or more controlled ball exchanges in practice.',
      'tactical', 'high', 2, true, true, false
    ),
    (
      '00000000-0000-0004-0000-000000000003',
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0003-0000-000000000001',
      'Court movement — split-step timing',
      'Practice split-stepping as the opponent is about to strike. Currently moving after the ball has already left their racket, which is too late.',
      'fitness', 'medium', 3, true, true, false
    )
  ON CONFLICT (id) DO NOTHING;

  -- 4. Player development summary
  INSERT INTO player_development_summary (
    id, academy_id, player_id, current_level_id,
    summary_text, coach_notes_internal, parent_visible_summary,
    what_to_work_on, how_parent_can_help, what_player_needs,
    show_to_student, show_to_parent, source, created_by
  ) VALUES (
    '00000000-0000-0005-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0003-0000-000000000001',
    v_o1_level_id,
    'Alex is showing solid foundations at the Orange 1 level. Forehand technique needs refinement before progressing to Orange 2. Rally consistency is improving session by session.',
    'Coach internal: Watch the grip tension under pressure — tends to white-knuckle on important points. Not shared with parent.',
    'Alex is working hard and making real progress. The main focus right now is building a reliable forehand and staying composed during long rallies.',
    'Consistent forehand follow-through and 5+ ball rally control are the top priorities this phase.',
    'Encourage practice at home — even 10 minutes of wall rallying makes a difference. Ask about the split-step before matches.',
    'Positive reinforcement when staying calm in long rallies. Alex responds well to specific praise rather than general encouragement.',
    true, true, 'director', NULL
  ) ON CONFLICT (id) DO NOTHING;

  -- 5. Parent/guardian relationship (only insert if player_guardians table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'player_guardians' AND table_schema = 'public'
  ) THEN
    INSERT INTO player_guardians (
      id, academy_id, player_id, guardian_profile_id,
      relationship_type, is_primary, can_receive_updates
    ) VALUES (
      '00000000-0000-0006-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0003-0000-000000000001',
      v_parent_uuid,
      'parent', true, true
    ) ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'player_guardians row inserted.';
  ELSE
    RAISE NOTICE 'player_guardians table does not exist — skipping guardian link.';
  END IF;

  RAISE NOTICE 'Demo player seed complete. Player ID: 00000000-0000-0003-0000-000000000001';
END $$;
```

---

## Section 10 — Post-Execution Full Verification

Run this after all applicable sections complete successfully.

```sql
-- ── FULL POST-EXECUTION VERIFICATION ─────────────────────────

-- 1. RLS policies — session_block_exercises
SELECT 'session_block_exercises' AS table_name, count(*) AS policy_count
FROM pg_policies WHERE tablename = 'session_block_exercises';
-- Expected: 2

-- 2. RLS policies — template_block_exercises
SELECT 'template_block_exercises' AS table_name, count(*) AS policy_count
FROM pg_policies WHERE tablename = 'template_block_exercises';
-- Expected: 4

-- 3. Sessions RLS fix
SELECT proname FROM pg_proc WHERE proname = 'session_belongs_to_auth_academy';
-- Expected: 1 row

-- 4. Template review tables
SELECT to_regclass('public.template_review_requests') AS trr,
       to_regclass('public.template_version_history')  AS tvh;
-- Expected: both non-null

-- 5. Curriculum content taxonomy columns
SELECT count(*) AS taxonomy_columns
FROM information_schema.columns
WHERE table_name = 'curriculum_content_items'
  AND column_name IN ('domain','session_block_hint','ball_level','is_player_visible','is_parent_visible','is_coach_only');
-- Expected: 6

-- 6. Template status column
SELECT column_name FROM information_schema.columns
WHERE table_name = 'templates' AND column_name = 'status';
-- Expected: 1 row

-- 7. Mental/competitive content seed
SELECT content_type, count(*) AS rows
FROM curriculum_content_items
WHERE content_type IN ('mental_skill', 'competition_behavior') AND academy_id IS NULL
GROUP BY content_type;
-- Expected: both content_types with rows > 0

-- 8. Demo player
SELECT p.full_name, p.is_active, cl.display_name AS level
FROM players p
JOIN curriculum_levels cl ON cl.id = p.curriculum_level_id
WHERE p.id = '00000000-0000-0003-0000-000000000001';
-- Expected: 1 row — Alex Chen, Orange 1 - Rally

-- 9. Demo player priorities
SELECT title, category, priority_rank
FROM player_priorities
WHERE player_id = '00000000-0000-0003-0000-000000000001'
ORDER BY priority_rank;
-- Expected: 3 rows

-- 10. Demo development summary
SELECT show_to_student, show_to_parent, source
FROM player_development_summary
WHERE player_id = '00000000-0000-0003-0000-000000000001';
-- Expected: 1 row, show_to_student=true, show_to_parent=true

-- 11. Player portal auth linkage
SELECT p.full_name, pr.role, pr.email
FROM players p
JOIN profiles pr ON pr.id = p.profile_id
WHERE p.id = '00000000-0000-0003-0000-000000000001';
-- Expected: 1 row — Alex Chen, player role

-- 12. Parent portal auth linkage
SELECT pg.relationship_type, pr.role, pr.email
FROM player_guardians pg
JOIN profiles pr ON pr.id = pg.guardian_profile_id
WHERE pg.player_id = '00000000-0000-0003-0000-000000000001';
-- Expected: 1 row — parent relationship
-- (If player_guardians does not exist, skip this check)
```

---

## After All Sections Are Applied

### Regenerate database.types.ts

The TypeScript types file is stale and does not include tables from migrations 065–068. After applying the above sections:

**Option A — Supabase CLI (if installed later):**
```bash
npx supabase gen types typescript --project-id dbjjhhxdkpdreytsozlq > src/lib/supabase/database.types.ts
npx tsc --noEmit
```

**Option B — Supabase Dashboard:**
Dashboard → Settings → API → Copy TypeScript types → paste into `src/lib/supabase/database.types.ts`

### Run TypeScript check
```bash
npx tsc --noEmit
```
Expected: clean. If new type errors appear, they will be in server actions that reference the new columns — those are separate sprint work.

---

## Execution Log (fill in as you go)

| Section | Applied | Result | Notes |
|---|---|---|---|
| Section 0 — Pre-flight | | | |
| Section 1 — Migration 060 | | | |
| Section 2 — Migration 056 | | | |
| Section 3 — Migration 058 | | | |
| Section 4 — Migration 061 | | | |
| Section 4b — Migration 065 | | | |
| Section 5 — Migration 066 | | | |
| Section 6 — Migration 067 | | | |
| Section 7 — Migration 068 | | | |
| Section 8 — Profile rows seed | | | |
| Section 9 — Domain rows seed | | | |
| Section 10 — Full verification | | | |
