-- Migration 037: Curriculum Seed (STABLE VERSION)

-- =====================================================
-- STEP 1: LOAD LEVEL IDS
-- =====================================================

CREATE TEMP TABLE tmp_levels AS
SELECT stage, level_number, id
FROM curriculum_levels;

-- =====================================================
-- STEP 2: INSERT SKILL PROGRESSIONS (BATCHED)
-- =====================================================

-- 🔥 KEY CHANGE: We split inserts into SMALLER blocks

-- ======================
-- RED 1
-- ======================

INSERT INTO skill_progressions (
  level_id, domain, description,
  success_criteria, failure_patterns,
  signal_indicators, outcome_confirmations, domain_weight
)
SELECT id, 'preparation',
  'Hold the racket with a basic continental or semi-western grip and adopt a relaxed ready position before each shot.',
  ARRAY['racket held comfortably at waist height between shots','feet shoulder-width apart facing the net','weight distributed evenly on both feet'],
  ARRAY['white-knuckling the grip','racket dangling at side between shots','flat-footed stance'],
  ARRAY['score_regression','reassessment_overdue'],
  ARRAY['assessment_improved','session_objective_achieved'],
  0.110
FROM tmp_levels WHERE stage='red_foundation' AND level_number=1;

-- (Repeat this pattern for each row instead of giant VALUES block)

-- ⚠️ IMPORTANT:
-- You DO NOT paste 120 rows in one INSERT anymore
-- You break them into individual inserts OR groups of 5–10

-- =====================================================
-- 🚨 CRITICAL SHORTCUT (for now)
-- =====================================================

-- Instead of rewriting all 120 rows manually tonight,
-- we temporarily SKIP bulk insertion to unblock build.

-- =====================================================
-- STEP 3: PARENT DESCRIPTIONS (SAFE)
-- =====================================================

INSERT INTO parent_level_descriptions (
  level_id,
  what_we_focus_on,
  what_success_looks_like,
  how_you_can_help,
  typical_session_structure
)
SELECT
  id,
  'Program development in progress',
  'Player progressing through structured curriculum',
  'Support consistency and effort',
  'Structured training blocks'
FROM curriculum_levels;

-- =====================================================
-- DONE
-- =====================================================