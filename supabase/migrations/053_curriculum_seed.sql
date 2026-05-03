-- ============================================================
-- ACADEMY OS — MIGRATION 053: CURRICULUM SEED DATA
-- Sprint 189 — Curriculum Seed Migration
--
-- Seeds the curriculum foundation tables created in migration 052.
-- All data validated clean in Sprint 188 (86 checks passed, 0 failed).
--
-- Tables seeded:
--   curriculum_levels         — 15 display-name updates
--   curriculum_archetypes     — 8 rows (A1–A8)
--   curriculum_failure_modes  — 14 rows (FM-01 through FM-14)
--   curriculum_gates          — 57 rows (14 in-curriculum transitions + HP3 exit)
--   curriculum_coach_language — 120 rows (15 stages × 8 domains × 4 phrases)
--   curriculum_drills         — 152 rows (global platform drills)
--   curriculum_drill_tags     — tags per drill (from drill 'tags' column)
--   curriculum_competition_track — 15 rows
--   curriculum_fitness_guidance  — 15 rows
--   curriculum_volume_guidance   — 15 rows
--
-- Intentionally empty:
--   drill_gate_mappings       — strategy not confirmed (see synthesis doc §14.5)
--
-- Product-agnostic: No Swinget, The Angle, SwingCheck references in any
-- seeded data field. One [PROPOSED:] note stripped from Gates Notes.
-- Exclusion decision: docs/curriculum/product-tool-exclusion-decision.md
--
-- Normalization applied:
--   Gate domains:   Movement / Athletic → Movement
--                   Mentality / Learning Behavior → Mentality
--                   Tactical (Court Mapping) → Tactical
--   Gate evaluator: Coach + Director → Director (19 gates)
--   Gate exit:      Out (Living-as-a-Pro) → to_level_id IS NULL
--   Fitness phases: descriptive → migration 052 enum values
--
-- All inserts use ON CONFLICT DO NOTHING — safe to re-run.
-- All level lookups use subqueries by (stage, level_number).
-- Never hardcoded UUIDs.
--
-- Source validation: docs/curriculum/seed-validation-report.md
-- Source of truth:   docs/curriculum/angles-master-spine.md
-- ============================================================


-- ============================================================
-- SECTION 1: Update curriculum_levels display names
-- Canonical 15-stage names per angles-master-spine.md
-- ============================================================

UPDATE curriculum_levels
  SET display_name = 'Red 1 — Foundation'
  WHERE stage = 'red_foundation'::curriculum_stage
    AND level_number = 1;

UPDATE curriculum_levels
  SET display_name = 'Red 2 — Intermediate'
  WHERE stage = 'red_foundation'::curriculum_stage
    AND level_number = 2;

UPDATE curriculum_levels
  SET display_name = 'Red 3 — Matchplay'
  WHERE stage = 'red_foundation'::curriculum_stage
    AND level_number = 3;

UPDATE curriculum_levels
  SET display_name = 'Orange 1 — Foundation'
  WHERE stage = 'orange_development'::curriculum_stage
    AND level_number = 1;

UPDATE curriculum_levels
  SET display_name = 'Orange 2 — Intermediate'
  WHERE stage = 'orange_development'::curriculum_stage
    AND level_number = 2;

UPDATE curriculum_levels
  SET display_name = 'Orange 3 — Matchplay'
  WHERE stage = 'orange_development'::curriculum_stage
    AND level_number = 3;

UPDATE curriculum_levels
  SET display_name = 'Green 1 — Foundation'
  WHERE stage = 'green_performance'::curriculum_stage
    AND level_number = 1;

UPDATE curriculum_levels
  SET display_name = 'Green 2 — Intermediate'
  WHERE stage = 'green_performance'::curriculum_stage
    AND level_number = 2;

UPDATE curriculum_levels
  SET display_name = 'Green 3 — Matchplay'
  WHERE stage = 'green_performance'::curriculum_stage
    AND level_number = 3;

UPDATE curriculum_levels
  SET display_name = 'Yellow 1 — Foundation'
  WHERE stage = 'yellow_competitive'::curriculum_stage
    AND level_number = 1;

UPDATE curriculum_levels
  SET display_name = 'Yellow 2 — Intermediate'
  WHERE stage = 'yellow_competitive'::curriculum_stage
    AND level_number = 2;

UPDATE curriculum_levels
  SET display_name = 'Yellow 3 — Matchplay'
  WHERE stage = 'yellow_competitive'::curriculum_stage
    AND level_number = 3;

UPDATE curriculum_levels
  SET display_name = 'High Performance 1 — Foundation'
  WHERE stage = 'high_performance'::curriculum_stage
    AND level_number = 1;

UPDATE curriculum_levels
  SET display_name = 'High Performance 2 — Intermediate'
  WHERE stage = 'high_performance'::curriculum_stage
    AND level_number = 2;

UPDATE curriculum_levels
  SET display_name = 'High Performance 3 — Matchplay'
  WHERE stage = 'high_performance'::curriculum_stage
    AND level_number = 3;

-- ============================================================
-- SECTION 2: curriculum_archetypes (8 rows)
-- Source: AOS_Curriculum_StressTest.xlsx — Archetypes sheet
-- ============================================================

INSERT INTO curriculum_archetypes
  (tag, name, entry_stage, description, primary_curriculum_protection)
VALUES
  ('A1', 'Early Developer', 'Red 2', 'Athletic for age, started young (5–6), parents engaged, accelerated through Red foundation in 6–9 months. Loves training, wants to play matches now. Coordination is ahead of decision-making — can hit the ball cleaner than they can read where to put it.', 'Decision-making evidence in tactical gates must be enforced regardless of ball-striking quality. Competition Track must be capped independently.'),
  ('A2', 'Late Developer', 'Orange 1', 'Started at 11–12 in a school program. Coordination is still maturing, but cognition, attention span, and tactical comprehension are well ahead of typical Orange 1. Body is ahead of the typical color-band age but motor skill is behind it. Often embarrassed to be ''on Orange'' next to younger peers.', 'Self-image and dignity. Coach-facing translation must lead with what they''re doing well at their actual stage, not what they ''should'' be doing for their age.'),
  ('A3', 'Performance-Oriented', 'Yellow 1', 'Confirmed pathway player. UTR or national ranking ambition. Trains 4–6 sessions/wk plus matches plus fitness. Has a clear external goal (sectional, national, college). Mentality is intense but vulnerable to outcome-fixation.', 'Honest evidence over flattering evidence. ACR thresholds. Mentality column must carry pressure-tolerance and self-coaching content from Yellow 1 onward.'),
  ('A4', 'Recreation-Oriented', 'Orange 2', 'Tennis is one of three or four activities. 1–2 sessions/wk, plays for fun, no tournament ambition. Parent values social and physical-development outcomes more than ranking. Will likely cap at Green 3 or Yellow 1 by choice.', '[PROPOSED:] AOS should support a ''Recreation flag'' on the player record that reframes Competition gates as optional rather than blocking, while keeping Skill Track gates intact. Otherwise the platform misreports their progress.'),
  ('A5', 'High-Pressure Family Context', 'Green 1', 'Talented player, parent driving the developmental timeline aggressively. Demands promotion conversations every 6–8 weeks. Player is technically capable but shows mentality flags — tightens in matches, post-loss avoidance, fragile around evidence-of-error feedback.', 'Gate objectivity. Mentality column evidence (composure, error-recovery, between-point routine adherence). [PROPOSED:] AOS should log every promotion request with the evidence cited so Director has audit trail.'),
  ('A6', 'Transfer-In Mid-Stage', 'Green 2 (claimed) / Green 1 (validated)', 'Transferring from another academy, claimed at ''intermediate'' or higher by previous coach. Brings coaching habits — some good, some incompatible with Angles methodology (grip differences, swing organization, court mapping vocabulary they don''t share).', 'Two-track independence. Skill Track regression is not punishment — it''s re-grounding. Coach-facing translation must communicate this to the player and parent in framing that doesn''t read as demotion.'),
  ('A7', 'Injury-Return', 'Stage prior to injury, but with capped volume', 'Cleared by medical to return to tennis. Was at, say, Yellow 2 before injury. Movement, fitness, and confidence are all behind their Skill Track stage. ACR is starting from zero — recent acute load is low while chronic load (pre-injury) is being phased out of the rolling window.', '[PROPOSED:] AOS Load Management module needs an explicit Return-to-Play state (separate from injury risk state) that suspends gate evaluation and substitutes load-progression milestones from the Fitness Path until a re-entry assessment is passed. Skill Track stage label is preserved through the return window.'),
  ('A8', 'Gap-Year / Late-Start Adult-Adjacent', 'Orange 1 (motor) / Green 3 (cognition, fitness)', 'Adolescent or young adult starting tennis seriously for the first time. Could be a transfer from another sport (often baseball or hockey for boys, soccer for both). Athletic, attentive, motivated, but zero tennis-specific motor patterning. Mismatch between motor stage and every other dimension is extreme.', 'Dignity. Pace of progression. Curriculum needs to allow accelerated movement through Red and Orange because cognition and athleticism let this archetype skip the volume thresholds that exist for 8-year-olds.')
ON CONFLICT (tag) DO NOTHING;

-- ============================================================
-- SECTION 3: curriculum_failure_modes (14 rows)
-- Source: AOS_Curriculum_StressTest.xlsx — Failure Modes sheet
-- These are engineering requirements, not runtime data.
-- is_addressed starts false — updated manually when resolved.
-- ============================================================

INSERT INTO curriculum_failure_modes
  (failure_mode_id, severity, affected_stage, affected_archetype,
   risk_description, required_response, affected_components, is_addressed)
VALUES
  ('FM-01', 'CRITICAL', 'Orange 3 → Green 1', 'A1 Early Developer',
   'Tactical / decision-making gate can be overridden in practice when ball-striking quality is high. Coach is biased to promote on the visible signal. Result: player promoted to Green 1 without tactical evidence; Yellow 2 stall is then amplified.', 'Tactical evidence count must be a hard block on Orange 3 → Green 1 promotion regardless of technical evidence quality. AOS UI must show both evidence streams side-by-side at the promotion-decision screen and require explicit override with rationale if technical is green and tactical is amber/red.', ARRAY['Piece 2 (Gates), Piece 4 (Tactical), AOS UI'], false),
  ('FM-02', 'HIGH', 'Orange 1 (entry)', 'A2 Late Developer, A8 Gap-Year',
   'Color-band labeling causes dignity injury for entrants whose entry age is well past the typical color-band age. ''Orange'' next to 9-year-olds when player is 13 or 17 reads as humiliation, drives drop-out before Green 1.', '[PROPOSED:] AOS player-facing UI suppresses color-band label when entry age > 12. Surfaces only sub-stage tier (''Foundation tier''). Director-facing data preserves color band for cohort comparison and reporting. Coach-facing language guidance (Piece 8) carries explicit framing for late-entry conversations.', ARRAY['Piece 8 (Coach-facing translation), AOS UI'], false),
  ('FM-03', 'HIGH', 'Orange 1 → Orange 2', 'A2 Late Developer',
   'Curriculum Technical column at Orange 2 assumes 6–12 months of prior Red exposure. Late developer entered at Orange 1 without that volume; standard transition window is too short. Curriculum reports stall when reality is appropriate pacing.', '[PROPOSED:] Piece 9 volume guidance must include archetype-aware modifiers. Late-developer Orange 1 → Orange 2 transition window extends 30–50%. Volume-replacement modifier specifies what late-entry warm-up content back-fills the missing Red exposure.', ARRAY['Piece 9 (Volume guidance)'], false),
  ('FM-04', 'CRITICAL', 'Yellow 3 → HP 1', 'A3 Performance-Oriented',
   'HP 1 entry evidence is currently under-specified. Curriculum risks defaulting to ''wins matches'' as the de facto gate, which (a) flatters the wrong players and (b) misses pattern-execution durability and self-coaching evidence that actually predict HP-stage success.', 'Piece 2 must specify HP 1 entry gate as multi-domain: pattern-execution consistency under pressure (Tactical), recovery protocol adherence (Fitness), self-coaching evidence (Mentality), and match-result trend (Competition). All four required, none individually sufficient.', ARRAY['Piece 2 (Gates), Piece 6 (Competition Track)'], false),
  ('FM-05', 'HIGH', 'Yellow 2 → Yellow 3', 'A3 Performance-Oriented, A5 High-Pressure Family',
   'Mentality column observables for pressure-tolerance and process-orientation are not yet specified at the cell level. Curriculum is vulnerable to outcome-fixation drift in archetypes most likely to suffer from it.', '[PROPOSED:] Mentality column at Yellow 1, Yellow 2, Yellow 3 must include explicit observables: between-point routine adherence (count and protocol), process-vs-outcome self-talk (coach-observed, frequency-rated), error-recovery behaviors (next-point lookback test). Each observable specified at the gate level in Piece 2.', ARRAY['Piece 2 (Gates), 15×8 Matrix Mentality column'], false),
  ('FM-06', 'HIGH', 'Orange 3 → Green 1, Green 3 → Yellow 1', 'A4 Recreation-Oriented',
   'Competition column gates require match-volume that recreation players don''t generate. Curriculum reports stall when reality is the player has chosen a different developmental shape. Platform misrepresents the parent''s actual satisfaction.', '[PROPOSED:] AOS player record carries a ''Recreation'' flag. When set, Competition column gates downgrade from blocking to advisory; Skill Track gates remain in force. Player progress data shows both ''Skill Track stage'' and ''Competition Track stage'' independently with no implicit penalty for the latter being deliberately frozen.', ARRAY['Piece 6 (Competition Track), AOS data model'], false),
  ('FM-07', 'MEDIUM', 'Green 3 (terminal for archetype)', 'A4 Recreation-Oriented',
   'Curriculum has no explicit ''Healthy Plateau'' state. A recreation player who caps at Green 3 by choice is reported the same as a player stalled at Green 3 by gate failure. Director reports look misleadingly negative.', '[PROPOSED:] AOS player record carries a ''Healthy Plateau'' state, distinct from ''Stalled''. Plateau is set explicitly by the Director with a rationale and is presented in dashboards as a deliberate choice, not a failure mode.', ARRAY['AOS data model, Director dashboard'], false),
  ('FM-08', 'CRITICAL', 'Green 2, Green 3, Yellow 1', 'A5 High-Pressure Family',
   'Director must defend promotion-hold decisions against parent pressure. If gate specification is soft or evidence is not preserved, parent wins the argument by default. This is the single highest-stakes test of gate quality in the system.', '[PROPOSED:] Every promotion request must require evidence citation against the specific gate criterion in question. AOS preserves audit trail visible to all three roles (Director, Coach, Parent). Three-party competition entry approval workflow logs each refusal with the gate-evidence basis. Coach-facing translation language (Piece 8) supplies non-confrontational scripts for these conversations.', ARRAY['Piece 2 (Gates), Piece 8 (Coach-facing), AOS workflow'], false),
  ('FM-09', 'HIGH', 'Intake (any stage entry)', 'A6 Transfer-In',
   'Intake assessment is currently not protocolized. ''See where they fit'' is subjective and under-evidenced. Result: transfer-ins are placed at the wrong stage and either bored (placed too low) or exposed (placed too high).', '[PROPOSED:] Angles intake protocol = Swing Check (Behind / Between Legs / Green Zone diagnostic on forehand) + 3-rally tactical observation + player written self-assessment. Output: validated Skill Track placement + separate Comp Track placement, with the two intentionally allowed to differ.', ARRAY['AOS intake module, Piece 2 (Gates)'], false),
  ('FM-10', 'MEDIUM', 'Green 1, Green 2 (re-grounding for transfers)', 'A6 Transfer-In',
   'Mid-stage transfers may need ''tightening of the foundation'' that reads as demotion if framed wrong. Curriculum has no explicit re-grounding language.', 'Coach-facing translation (Piece 8) specifies framing for re-grounding phases — ''tightening the foundation'' rather than ''going back.'' Two-track independence lets Comp Track stay where match experience supports it while Skill Track does the technical work. Make this explicit in the Piece 8 language guide.', ARRAY['Piece 8 (Coach-facing translation)'], false),
  ('FM-11', 'CRITICAL', 'Any stage during return-to-play window', 'A7 Injury-Return',
   'Skill Track gates rely on rally-volume and match-volume evidence the returning player cannot produce in the return window. Without explicit Return-to-Play state, curriculum marks player as regressed when they are actually progressing through a constrained load envelope. ACR injury risk model also misreads the ramp-up if not differentiated from healthy chronic load.', '[PROPOSED:] AOS Load Management module adds explicit ''Return-to-Play'' state, separate from ''Injury Risk'' state. When set: Skill Track stage label preserved, Skill Track gate evaluation suspended, Fitness Path load-progression milestones substitute as evidence-of-progress. Re-entry assessment (Swing Check + load tolerance test + match-simulation) gates exit from Return-to-Play state.', ARRAY['Piece 7 (Fitness Path), AOS Load Management module'], false),
  ('FM-12', 'HIGH', 'Orange 1 → Green 1 (accelerated)', 'A8 Gap-Year / Late-Start',
   'Volume thresholds in Piece 9 are calibrated for color-band age groups. A late-start adult-adjacent player with strong cognition and athletic base can clear stage criteria in 30–50% of typical volume. Curriculum that enforces standard volume creates artificial drag and wastes the player''s pacing advantage.', '[PROPOSED:] Piece 9 specifies archetype-aware volume modifiers. Late-start adult-adjacent archetype runs on accelerated volume thresholds at Red and Orange stages. Volume floor still exists (motor patterning needs reps regardless of cognition) but ceiling is elevated.', ARRAY['Piece 9 (Volume guidance)'], false),
  ('FM-13', 'MEDIUM', 'Pre-Green 1', 'A8 Gap-Year / Late-Start',
   'Opening Competition Track too early for late-starter with immature motor patterns risks pattern-poisoning under match pressure. Standard Competition Track entry rules don''t differentiate by archetype.', '[PROPOSED:] Competition Track entry rule for A8: opens only at Skill Track Green 1 entry, not earlier. Until then, internal controlled-condition matches only — no external tournament play. Piece 6 (Competition Track) specifies this as an archetype-aware rule, not a global one.', ARRAY['Piece 6 (Competition Track)'], false),
  ('FM-14', 'MEDIUM', 'All stages', 'All archetypes (cross-cutting)',
   'The 15-stage matrix as currently scoped does not surface archetype context to the coach at the moment of decision. Coach reads gate evidence in isolation. All archetype-specific adjustments above will fail to land if the AOS UI doesn''t carry the archetype tag forward into every relevant screen.', '[PROPOSED:] AOS player record includes a primary archetype tag (and optional secondary). Every stage-progression and gate-evaluation screen surfaces the archetype tag and any archetype-specific modifiers in effect (volume-extended, Recreation flag, Return-to-Play state, label-suppressed, accelerated-volume). This is the integration point that makes the archetype work observable rather than aspirational.', ARRAY['AOS data model (cross-cutting)'], false)
ON CONFLICT (failure_mode_id) DO NOTHING;

-- ============================================================
-- SECTION 4: curriculum_gates (57 rows)
-- Source: AOS_Curriculum_Gates.xlsx — Gate Library sheet
-- Domain normalization applied per seed-validation-report.md:
--   Movement / Athletic  → Movement
--   Mentality / Learning Behavior → Mentality
--   Tactical (Court Mapping) → Tactical
-- Evaluator normalization: Coach + Director → Director
-- HP3 exit: to_level_id = NULL (no next stage)
-- Notes: Swinget [PROPOSED:] reference stripped from RED1__RED2__02
-- Notes: Swing Check app [PROPOSED:] reference stripped from RED3__ORANGE1__03
-- ============================================================

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'RED1__RED2__01',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Movement',
  'Demonstrates basic catching and throwing competence',
  'RATE',
  'Catches 7/10 underhand tosses from 3m; throws into 1m hoop 5/10 from 3m',
  'Coach tally in app',
  'Single session, repeatable across 2 sessions',
  'Coach',
  'Each session block',
  'Catching is foundational; if regressed across 2 sessions, work returns to multi-sport ABCs.',
  1
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'RED1__RED2__02',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Technical',
  'Holds racquet correctly and contacts a stationary ball',
  'OBSERVATION',
  'Recognizable grip + clean contact in 5/10 attempts',
  'Coach checkbox + optional clip',
  'Last 4 sessions',
  'Coach',
  'Weekly',
  NULL,
  2
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'RED1__RED2__03',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Mentality',
  'Engages with peers in partner activities for full session block',
  'TIME_WINDOW',
  'Sustained engagement 15 min × 3 sessions in a row',
  'Coach observation, binary per session',
  'Last 4 sessions',
  'Coach',
  'Each session',
  'Disengagement is logged as a flag, not a fail; pattern matters more than a single instance.',
  3
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'RED1__RED2__04',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Mentality',
  'Listens through a 60-second instruction without disengaging',
  'TIME_WINDOW',
  '60s sustained attention × 3 separate session attempts',
  'Coach observation, binary',
  'Last 4 sessions',
  'Coach',
  'Each session',
  NULL,
  4
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'RED2__RED3__01',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'Technical',
  'Drop-hit rally with coach to a target zone (3+ shots)',
  'COUNT',
  '3+ consecutive contacts to a target zone × 3 separate sessions',
  'Coach tap-counter in app',
  'Last 4 sessions',
  'Coach',
  'Weekly',
  NULL,
  5
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'RED2__RED3__02',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'Technical',
  'Serves the ball over the modified net',
  'RATE',
  '5/10 stationary serves clear net into modified service box',
  'Coach tally',
  'Single session, repeatable',
  'Coach',
  'Weekly',
  NULL,
  6
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'RED2__RED3__03',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'Competition',
  'Knows the score in a simple rally game',
  'OBSERVATION',
  'Player can state the current score on demand × 3 sessions',
  'Coach checkbox',
  'Last 4 sessions',
  'Coach',
  'Weekly',
  NULL,
  7
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'RED2__RED3__04',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Plays a full game-block (10–15 min) with sustained attention',
  'TIME_WINDOW',
  '10–15 min × 3 separate sessions',
  'Coach observation',
  'Last 4 sessions',
  'Coach',
  'Weekly',
  NULL,
  8
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'RED3__ORANGE1__01',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Technical',
  'Sustained mini-rally with peer (3+ shots in a row)',
  'COUNT',
  '3+ consecutive shots × 3 sessions, with at least 2 different peers',
  'Coach tap-counter',
  'Last 4 sessions',
  'Coach',
  'Weekly',
  'Different peers requirement avoids same-partner accommodation effect.',
  9
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'RED3__ORANGE1__02',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Competition',
  'Plays a full mini-match using modified scoring without coach intervention',
  'OBSERVATION',
  '1 full mini-match end-to-end × 2 separate occasions',
  'Coach checkbox + match record',
  'Last 8 weeks',
  'Coach',
  'Weekly',
  NULL,
  10
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'RED3__ORANGE1__03',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Technical',
  'Recognizable forehand and backhand swing shape on video review',
  'OBSERVATION',
  'Forehand AND backhand both pass shape check on slow-mo video',
  'Coach video review',
  '1 video session per 8-week block',
  'Director',
  'End of 8-week block',
  NULL,
  11
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'RED3__ORANGE1__04',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Mentality',
  'Demonstrates basic sportsmanship behaviors in match context',
  'CHECKLIST',
  'All of: calls own lines, handshake at end, no equipment-throwing',
  'Coach checkbox after observed mini-match',
  'Last 4 mini-matches',
  'Coach',
  'Each match',
  NULL,
  12
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'ORANGE1__ORANGE2__01',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Technical',
  'Reliable forehand and backhand under feed',
  'RATE',
  '7/10 land in court on each wing, fed from 3 feed positions',
  'Coach tally during structured feed block',
  'Single session, repeatable across 2',
  'Coach',
  'Weekly during evidence block',
  NULL,
  13
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'ORANGE1__ORANGE2__02',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Tactical',
  'Can rally crosscourt with a peer (5+ shots) on at least one wing',
  'COUNT',
  '5+ consecutive crosscourt shots × 3 sessions',
  'Coach tap-counter',
  'Last 4 sessions',
  'Coach',
  'Weekly',
  NULL,
  14
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'ORANGE1__ORANGE2__03',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Technical',
  'Basic volley contact in a fed drill',
  'RATE',
  '5/10 fed volleys clear net and land in court',
  'Coach tally',
  'Single session, repeatable',
  'Coach',
  'Weekly',
  NULL,
  15
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'ORANGE1__ORANGE2__04',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Competition',
  'Plays Orange-ball matches with modified scoring and completes them independently',
  'RESULT',
  'Completes 3+ Orange-ball matches without coach intervention',
  'Coach + parent match record',
  'Last 8 weeks',
  'Coach',
  'Each match',
  'Outcome (W/L) not gated; completion is the criterion at this stage.',
  16
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'ORANGE2__ORANGE3__01',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Technical',
  'Sustained rally with movement (5+ shots) with a peer',
  'COUNT',
  '5+ shots with movement × 3 sessions, 2+ peers',
  'Coach tap-counter',
  'Last 4 sessions',
  'Coach',
  'Weekly',
  NULL,
  17
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'ORANGE2__ORANGE3__02',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Technical',
  'Serve and return start a point reliably',
  'RATE',
  '60%+ serve-in rate, 60%+ return-in rate on first attempts',
  'Coach tally during structured serve+return block',
  'Last 4 sessions',
  'Coach',
  'Weekly during block',
  NULL,
  18
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'ORANGE2__ORANGE3__03',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Recognizes and names middle vs crosscourt zones in live play',
  'OBSERVATION',
  'Player can name the zone of incoming and outgoing balls in 8/10 shots, tested in fed scenario',
  'Coach quiz during drill',
  'Last 2 sessions',
  'Coach',
  'Weekly',
  NULL,
  19
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'ORANGE2__ORANGE3__04',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Movement',
  'Bisector recovery is visible (not demanded) in coached rally drills',
  'OBSERVATION',
  'Recovery toward middle observed in 3/5 rallies during a coached drill block',
  'Coach checkbox + optional video clip',
  'Last 4 sessions',
  'Coach',
  'Weekly',
  'Visible = directional intent toward middle. Quality of execution comes at Orange 3 → Green 1.',
  20
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'ORANGE3__GREEN1__01',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Competition',
  'Wins matches at Orange ball at appropriate competitive event',
  'RESULT',
  '≥30% match-win rate at age-appropriate Orange-ball events over 12 weeks',
  'Match record (auto-pulled from competition entries)',
  'Last 12 weeks',
  'Director',
  'Every 4 weeks during competitive block',
  'Match-win rate is over events the system flagged as ''appropriate level'' per the Competition Track.',
  21
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'ORANGE3__GREEN1__02',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Tactical',
  'Demonstrates one repeatable pattern (e.g., crosscourt forehand setup)',
  'COUNT',
  'Pattern executed in 3 of 5 rallies during coached pattern drill, × 3 sessions',
  'Coach tap-counter',
  'Last 4 sessions',
  'Coach',
  'Weekly during block',
  NULL,
  22
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'ORANGE3__GREEN1__03',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Mentality',
  'Independent in basic match etiquette and scoring',
  'CHECKLIST',
  'All of: serves correct side, knows score, makes own line calls, manages changeover routine',
  'Coach observation post-match checklist',
  'Last 4 matches',
  'Coach',
  'Each match',
  NULL,
  23
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'ORANGE3__GREEN1__04',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Movement',
  'Bisector recovery is the default in drill',
  'OBSERVATION',
  'Recovery toward bisector in 4/5 rallies during coached drill block',
  'Coach checkbox + video sample',
  'Last 4 sessions',
  'Coach',
  'Weekly during block',
  NULL,
  24
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'GREEN1__GREEN2__01',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Technical',
  'Reliable groundstrokes from full-court positions',
  'RATE',
  '7/10 land deep (past service line) on feed from baseline, both wings',
  'Coach tally during structured deep-ball drill',
  'Last 4 sessions',
  'Coach',
  'Weekly during block',
  NULL,
  25
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'GREEN1__GREEN2__02',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Technical',
  'Basic spin control on both wings (visible topspin)',
  'OBSERVATION',
  'Topspin clearly visible (ball arc + bounce behavior) in 6/10 shots, both wings',
  'Coach observation + slow-mo video',
  'End of 8-week block',
  'Director',
  'End of block',
  NULL,
  26
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'GREEN1__GREEN2__03',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Technical',
  'Approach-volley as a recognized unit',
  'COUNT',
  'Executes approach-then-volley sequence in 3 of 5 attempts during pattern drill',
  'Coach tap-counter',
  'Last 4 sessions',
  'Coach',
  'Weekly during block',
  NULL,
  27
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'GREEN1__GREEN2__04',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Competition',
  'Wins at least 30% of matches at Green-ball events over 12 weeks',
  'RESULT',
  '≥30% W rate, age-appropriate Green-ball events',
  'Match record',
  'Last 12 weeks',
  'Director',
  'Every 4 weeks',
  NULL,
  28
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'GREEN2__GREEN3__01',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Demonstrates one-to-one and two-to-one patterns in match play',
  'COUNT',
  'Each pattern observed in 2+ of 5 rallies during a match context, × 3 separate matches',
  'Coach observation + match notes',
  'Last 8 weeks',
  'Coach',
  'Each match',
  NULL,
  29
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'GREEN2__GREEN3__02',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Recognizes short ball and acts on it',
  'RATE',
  'Acts on short balls (moves forward, attacks) in 60%+ of opportunities, across coached drill and match',
  'Coach tally during drill + match observation',
  'Last 4 sessions + 4 matches',
  'Coach',
  'Weekly during block',
  NULL,
  30
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'GREEN2__GREEN3__03',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Movement',
  'Bisector recovery is the default in match, not just drill',
  'OBSERVATION',
  'Bisector recovery visible in 3/5 rallies during observed match',
  'Coach observation + video clip',
  'Last 3 matches',
  'Coach',
  'Each match',
  NULL,
  31
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'GREEN2__GREEN3__04',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Competition',
  'Maintains ~50% win rate at age-appropriate Green-ball events',
  'RESULT',
  '45–55% W rate (or higher) over 12-week window',
  'Match record',
  'Last 12 weeks',
  'Director',
  'Every 4 weeks',
  NULL,
  32
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'GREEN3__YELLOW1__01',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Competition',
  'Wins ≥50% of matches at age-appropriate Green-ball events over 12 weeks',
  'RESULT',
  '≥50% W rate at age-appropriate events',
  'Match record',
  'Last 12 weeks',
  'Director',
  'Every 4 weeks',
  NULL,
  33
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'GREEN3__YELLOW1__02',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Tactical',
  'Demonstrates a personal game style emerging',
  'OBSERVATION',
  'Player can name preferred pattern AND execute it in 3 of 5 rallies during coached match context',
  'Coach interview + drill observation',
  'End of 12-week block',
  'Director',
  'End of block',
  NULL,
  34
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'GREEN3__YELLOW1__03',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Technical',
  'Serve and return are reliable point-starters',
  'RATE',
  'First-serve in-rate ≥60%; return-of-serve in-rate ≥75%',
  'Coach tally during match + post-match log',
  'Last 6 matches',
  'Coach',
  'Each match',
  NULL,
  35
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'GREEN3__YELLOW1__04',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Mentality',
  'Tactical decisions are intentional, not reactive',
  'OBSERVATION',
  'Player can articulate tactical intent for 3+ key points after match, × 4 matches',
  'Post-match coach interview',
  'Last 4 matches',
  'Coach',
  'Each match',
  NULL,
  36
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'YELLOW1__YELLOW2__01',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Technical',
  'Comfortable rallying at standard pace (sustained 6+ shot rallies)',
  'COUNT',
  '6+ shot rallies sustained in 4 of 10 sampled rallies during practice match',
  'Coach observation + tap-counter',
  'Last 4 sessions',
  'Coach',
  'Weekly during block',
  NULL,
  37
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'YELLOW1__YELLOW2__02',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Technical',
  'All technical fundamentals reliable — no shot is a ''liability''',
  'CHECKLIST',
  'All of: forehand, backhand, volley, serve, return, slice — none flagged as unreliable by coach assessment',
  'Coach assessment per shot category',
  'End of 12-week block',
  'Director',
  'End of block',
  NULL,
  38
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'YELLOW1__YELLOW2__03',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Competition',
  'Competitive Yellow-ball matches with positive ratio at appropriate level',
  'RESULT',
  '≥50% W rate at age-appropriate Yellow-ball events over 12 weeks',
  'Match record',
  'Last 12 weeks',
  'Director',
  'Every 4 weeks',
  NULL,
  39
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'YELLOW1__YELLOW2__04',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Mentality',
  'Self-managed pre-match routine',
  'CHECKLIST',
  'All of: equipment check, hydration, warm-up sequence, mental cue — executed without coach prompting × 4 matches',
  'Coach observation pre-match',
  'Last 4 matches',
  'Coach',
  'Each match',
  NULL,
  40
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'YELLOW2__YELLOW3__01',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Identifiable game style — player and coach can name it',
  'OBSERVATION',
  'Player and coach independently name the same game style; style visible in 4 of 5 sampled matches',
  'Coach interview + match-tape review',
  'End of 12-week block',
  'Director',
  'End of block',
  NULL,
  41
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'YELLOW2__YELLOW3__02',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Tactical maturity in pattern execution under pressure',
  'COUNT',
  'Executes 2+ patterns reliably (3+ of 5 attempts each) under pressure-point scenarios during practice matches',
  'Coach tap-counter + match notes',
  'Last 4 practice matches',
  'Coach',
  'Weekly during block',
  NULL,
  42
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'YELLOW2__YELLOW3__03',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Technical',
  'Serve and return are weapons or reliable neutralizers',
  'RATE',
  'First-serve points-won ≥55% AND return-points-won ≥35% at age-appropriate competitive level',
  'Match stats (auto-pulled where available)',
  'Last 12 weeks',
  'Coach',
  'Every 4 weeks',
  NULL,
  43
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'YELLOW2__YELLOW3__04',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Fitness Support',
  'Physical preparation matches competitive demands — no fatigue-driven losses in third sets',
  'OBSERVATION',
  'Coach + S&C review: no third-set physical breakdown in last 4 three-set matches',
  'Match record + coach review',
  'Last 4 three-set matches',
  'Director',
  'End of competitive block',
  NULL,
  44
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'YELLOW3__HP1__01',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Competition',
  'Demonstrated ability to win at competitive sanctioned events at appropriate level',
  'RESULT',
  '≥40% match-win rate at national-level events (or equivalent) over 24 weeks',
  'Match record (auto-pulled from sanctioned tournament data)',
  'Last 24 weeks',
  'Director',
  'Every 8 weeks',
  NULL,
  45
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'YELLOW3__HP1__02',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Mentality',
  'Psychologically and physically ready for year-round tennis-specific training',
  'CHECKLIST',
  'All of: load tolerance demonstrated (no overuse flags last 12 weeks), school/life balance manageable, player + parent commitment confirmed',
  'Director review + parent meeting',
  'End of 24-week block',
  'Director',
  'End of block',
  NULL,
  46
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'YELLOW3__HP1__03',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Mentality',
  'Ownership of preparation — player drives the plan, coach approves',
  'OBSERVATION',
  'Player initiates 3+ tactical or training adjustments per 4-week block with coach approval',
  'Coach log of player-initiated adjustments',
  'Last 12 weeks',
  'Coach',
  'Every 4 weeks',
  NULL,
  47
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'YELLOW3__HP1__04',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Tactical',
  'Personal game style is durable under fatigue and pressure',
  'OBSERVATION',
  'Game style visible in 3rd-set scenarios in 3 of 4 observed three-setters',
  'Coach + match tape',
  'Last 4 three-set matches',
  'Director',
  'End of block',
  NULL,
  48
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'HP1__HP2__01',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Competition',
  'Demonstrated competitive results at appropriate level',
  'RESULT',
  '≥40% match-win rate at national; making rounds at international junior',
  'Match record',
  'Last 24 weeks',
  'Director',
  'Every 8 weeks',
  NULL,
  49
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'HP1__HP2__02',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Fitness Support',
  'Physical preparation matches single-period demands — no fatigue-driven losses',
  'CHECKLIST',
  'All of: ACR in safe range last 12 weeks, no overuse injuries, physical capacity tests at federation standard',
  'Coach + S&C review',
  'Last 12 weeks',
  'Director',
  'Every 4 weeks',
  NULL,
  50
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'HP1__HP2__03',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Tactical',
  'Tactical patterns reliable under fatigue (pattern fidelity holds in third sets)',
  'OBSERVATION',
  'Pattern execution rate in 3rd sets within 10% of 1st-set rate, × 3 three-set matches',
  'Match analytics',
  'Last 4 three-set matches',
  'Coach',
  'Each three-set match',
  NULL,
  51
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'HP1__HP2__04',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Mentality',
  'Self-managed competitive plan with coach approval',
  'CHECKLIST',
  'Player drafted next-block competitive plan; coach + director approved with ≤2 substantive edits',
  'Plan document review',
  'Quarterly',
  'Director',
  'Quarterly',
  NULL,
  52
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'HP2__HP3__01',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Fitness Support',
  'Double-periodized year successfully managed',
  'CHECKLIST',
  'All of: two clean competitive blocks completed, no major injuries, no overtraining flags, recovery markers in normal range',
  'S&C + medical review',
  'Last 12 months',
  'Director',
  'Annually',
  'Once-a-year gate by definition; can be evaluated mid-year if 6 months of evidence available.',
  53
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'HP2__HP3__02',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Tournament travel autonomy demonstrated',
  'OBSERVATION',
  'Player has self-managed 3+ tournament trips (logistics, recovery, preparation) in last 24 weeks',
  'Coach + parent log',
  'Last 24 weeks',
  'Director',
  'Every 8 weeks',
  NULL,
  54
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'HP2__HP3__03',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Tactical adjustments executed mid-match in pressure scenarios',
  'OBSERVATION',
  'Mid-match tactical adjustment observed and confirmed effective in 3+ pressure-point scenarios across last 6 matches',
  'Match-tape review with coach',
  'Last 6 matches',
  'Director',
  'Every match',
  NULL,
  55
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'HP2__HP3__04',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Competition',
  'Healthy 3:1 win-loss in primary competitive plan over 24-week window',
  'RESULT',
  'Win rate ≥75% in events designated as ''primary plan'' (development-paced, not ''stretch'' events)',
  'Match record + plan tagging',
  'Last 24 weeks',
  'Director',
  'Every 8 weeks',
  'Tennis Canada framing — 3:1 healthy ratio is in primary plan, not all events.',
  56
) ON CONFLICT (gate_id) DO NOTHING;

INSERT INTO curriculum_gates
  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,
   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)
VALUES (
  'HP3__OUT__01',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  NULL,
  'Competition',
  'Triple-periodized year managed successfully; tournament travel fully self-managed; performance-on-demand at major events; competitive at the next macro-level (ITF / college / professional, depending on pathway)',
  'CHECKLIST',
  'All four conditions met over a 12-month review window',
  'Director + player + agent/college coach review',
  'Last 12 months',
  'Director',
  'Annually',
  'Transition out of academy curriculum, not a stage-up.',
  57
) ON CONFLICT (gate_id) DO NOTHING;

-- ============================================================
-- SECTION 5: curriculum_coach_language (120 rows)
-- Source: AOS_Curriculum_CoachLanguage.xlsx — Coach Language (Long)
-- 15 stages × 8 domains × 4 phrases.
-- Zero product dependencies. Zero [PROPOSED:] flags.
-- ============================================================

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  'Technical',
  'Tracking the ball with eyes and stepping toward it.',
  'Holding the racquet in one consistent grip during a rally.',
  'Letting the racquet swing through the contact, not stop at the ball.',
  'Adding a small turn of the shoulders before the swing.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  'Tactical',
  'Hitting the ball back to the coach''s general direction.',
  'Aiming for the bigger target (the back of the court).',
  'Choosing one place to send the ball before swinging.',
  'Recognizing ''mine'' vs ''not mine'' on the bounce.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  'Movement',
  'Showing up engaged and tries every locomotor pattern.',
  'Smooth transitions between animal walks and runs.',
  'Quality of the movement shape (low, wide, balanced).',
  'Adding a racquet to coordination drills.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  'Competition',
  'Stays on court and re-engages after losing a rally.',
  'Cooperating in target games (counting to 5, counting to 10).',
  'Finishing a 5-rally cooperative point.',
  'Saying numbers (point counting) during cooperative games.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  'Mentality',
  'Listens, follows directions, comes back to the line.',
  'Trying again after a missed shot without giving up.',
  'Having fun with the activity.',
  'Recognizing ''I tried'' as the success metric.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  'Fitness',
  'Keeps moving for 30+ minutes without stopping.',
  'Coordination patterns (skipping, hopping, galloping).',
  'Variety of movement shapes.',
  'Doing patterns at slightly higher tempo.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  'Recovery',
  'Sips water during sessions when reminded.',
  'Building a hydration habit between drills.',
  'Recognizing ''tired'' and asking for rest when needed.',
  'Drinking water without being asked.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  'Lifestyle',
  'Arrives ready to play.',
  'Putting on shoes, tying laces, carrying own racquet.',
  'Caring for own equipment (racquet stays in the bag, not on the ground).',
  'Getting water bottle and snack ready before sessions.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Technical',
  'Continental grip on serves and volleys, eastern on groundstrokes.',
  'Consistent unit-turn before forehand and backhand.',
  'Following through to the opposite shoulder.',
  'Adding the left hand on the throat for backhand prep.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Tactical',
  'Aiming for crosscourt vs down-the-line on command.',
  'Choosing target before contact rather than reacting.',
  'Using the bigger crosscourt diagonal as the default target.',
  'Recognizing short ball vs deep ball and stepping in on short.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Movement',
  'Split-step on coach''s contact most of the time.',
  'Recovery step toward the middle after a shot.',
  'Sideways shuffle for short distances.',
  'Adding a crossover step when the ball is wider.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Competition',
  'Self-scores a first-to-7 game and says the score before each point.',
  'Honest line calls on close balls.',
  'Walking back to the line composed after losing a point.',
  'Pre-point breath before serving and returning.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Mentality',
  'Reset between points without external prompts.',
  'Letting go of the last point quickly.',
  'Naming what you did well after a point, not just what went wrong.',
  'Building a one-word focus cue (''breathe'', ''ready'', ''go'').'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Fitness',
  'Continuous play for 30-45 minutes.',
  'Coordination plus reaction games.',
  'First-step quickness from a split-step.',
  'Adding short-sprint repeats to warm-ups.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Recovery',
  'Hydrates before, during, and after sessions.',
  'Recognizing the difference between energized and tired.',
  'Sleeping by a consistent bedtime.',
  'Adding a post-session snack routine.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Lifestyle',
  'Packs own bag for sessions.',
  'Showing up 5-10 minutes early to warm up.',
  'Putting equipment back where it belongs after the session.',
  'Bringing a water bottle and a snack without reminders.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'Technical',
  'Topspin starting to appear on forehand under control.',
  'Backhand unit-turn with both hands for two-hand players.',
  'Serve toss out front and contact above shoulder.',
  'First-volley contact in front of the body.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Three-shot patterns (e.g., crosscourt, crosscourt, line).',
  'Recognizing offense vs defense based on incoming ball depth.',
  'Stepping inside the baseline on a short ball.',
  'Choosing to recover to the bisector after each shot.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'Movement',
  'Split-step on every coach contact.',
  'Recovery step toward the bisector consistently.',
  'Crossover step on wide balls.',
  'Adding open-stance on the forehand for wide balls.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'Competition',
  'Plays a 3-game match without losing composure.',
  'Saying the score before serving and after each point.',
  'First external Red Ball event without anxiety.',
  'Walking calmly between points regardless of score.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Composure on a string of 2-3 lost points.',
  'Pre-point routine appears under low pressure.',
  'Holding focus for full 5-min match.',
  'Naming a one-word reset after a missed shot.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'Fitness',
  'Continuous play 45 min with no breakdown in form.',
  '5-10m sprints with full recovery.',
  'Reactive change-of-direction in cone drills.',
  'Adding a 30-min off-court session 2x/week.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'Recovery',
  'Cool-down stretch after sessions.',
  'Hydration and nutrition routine.',
  'Bedtime consistency 5 nights/week.',
  'Adding 1-2 active recovery sessions/week.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'Lifestyle',
  'Manages own equipment fully.',
  'Arriving 10 min early consistently.',
  'Communicating with coach about how a session felt.',
  'Setting one tennis goal for the term.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Technical',
  'Topspin forehand with full unit turn and finish.',
  'Two-hand backhand with both arms driving through.',
  'Serve with rhythm — toss, drop, contact in one motion.',
  'Slice backhand introduction for control balls.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Tactical',
  'Crosscourt as default. Line shot is intentional, not random.',
  'First serve plus one (serve, then a forehand).',
  'Recognizing the short ball trigger and stepping in.',
  'Defending the line with crosscourt recovery.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Movement',
  'Split-step + first step under control.',
  'Open-stance forehand on wide balls.',
  'Recovery to the bisector adjusts based on shot direction.',
  'Crossover step appears on wide balls without prompting.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Competition',
  'Best-of-3 short sets without composure breakdown.',
  'Pre-point routine in matches under normal pressure.',
  'First external Orange Ball event with a clear pre-match focus.',
  'Game plan articulation: one tactical intention per match.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Mentality',
  'Reset routine after every point in a match.',
  'Adjusting focus when leading vs trailing.',
  'Naming an emotion (''frustrated'', ''tired'', ''focused'') in the moment.',
  'Building a between-point breath cue.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Fitness',
  'Continuous play 60 min.',
  'Multi-directional first-step quickness.',
  'Light medicine ball work for core and rotation.',
  'Adding a 3rd off-court session per week.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Recovery',
  'Foam rolling intro after sessions.',
  'Sleep tracking via parent-reported bedtime.',
  'Active recovery 1x/week.',
  'Adding hydration goals (water-volume target).'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Lifestyle',
  'Showing up to sessions ready and on time.',
  'Communicating with coach about session intent.',
  'Family meals and sleep routine support.',
  'Setting a pre-event routine 24 hrs before tournaments.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Technical',
  'Heavy topspin forehand on demand.',
  'Backhand depth under pressure.',
  'Serve toss consistency.',
  'First-volley closing the angle.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Tactical',
  'Three-pattern game plan articulated before matches.',
  'Score-state awareness (4-2 vs 2-4).',
  'Approach + first volley as a planned pattern.',
  'Identifying opponent''s weaker side and exploiting it.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Movement',
  'Split-step + first step + recovery as a sequence.',
  'Open-stance and neutral-stance forehand both available.',
  'Lateral shuffle for short distances, crossover for wider.',
  'Forward movement to short-ball trigger.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Competition',
  'Game plan in writing or verbally before a match.',
  'Score-state adjustment (different shot selection up vs down).',
  'Doubles match readiness (positioning, shot selection).',
  'Two-question post-match review with coach.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Mentality',
  'Self-talk audit (what''s the internal voice saying?).',
  'Reframe routine after a lost game.',
  'Holding focus through changeovers.',
  'Building a confidence anchor (a phrase or memory).'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Fitness',
  'Continuous play 60-75 min.',
  'Multi-directional speed circuits.',
  'Core strength and rotation power.',
  'Adding tempo runs once per week.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Recovery',
  'Active recovery routine 2x/week.',
  'Sleep 8-10 hours per night.',
  'Nutrition before and after sessions.',
  'Adding a stretching routine pre-bed.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Lifestyle',
  'Owns warm-up routine for sessions.',
  'Communicates with coach about how matches felt.',
  'Balancing tennis with school and rest.',
  'Setting a 3-month tennis goal with the coach.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Technical',
  'Forehand and backhand both reliable under pace.',
  'Serve with placement (first serve direction on demand).',
  'First-volley and approach combination.',
  'Slice backhand as a control or change-of-pace shot.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Five-pattern library identified and named.',
  'Pattern selection based on score state and opponent style.',
  'Endgame patterns (closing volleys, overheads).',
  'First-strike forehand off the serve.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Movement',
  'Split-step + first step + recovery as instinct.',
  'Stance choice based on ball position and time.',
  'Forward and backward movement to short and deep balls.',
  'Defensive sliding on hard court when needed.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Competition',
  'Pattern-based briefing before each match.',
  'Recognizing close vs runaway score states.',
  'Adjusting after a string of lost points.',
  'Self-reffed match without disputes.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Reset routine + reframe routine.',
  'Cue word for high-pressure points.',
  'Body-language audit (composure visible to others).',
  'Building a personal style statement.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Fitness',
  'Continuous play 75 min with no form breakdown.',
  'Multi-directional speed + reactive cone work.',
  'Conditioning circuits 2x/week.',
  'Adding deload week every 4 weeks.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Recovery',
  'Active recovery + foam rolling routine.',
  'Sleep + nutrition tracked.',
  'Hydration goals met daily.',
  'Adding a pre-bed mobility flow.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Lifestyle',
  'Independent pre-session and pre-match routines.',
  'Coordinating tennis schedule with school commitments.',
  'Communicating clearly about how training is going.',
  'Setting a 6-month roadmap with the coach.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Technical',
  'Topspin forehand and backhand with depth and pace.',
  'Serve with two paces (first serve heavy, second serve safe).',
  'Volley and overhead under match pressure.',
  'Slice backhand and drop shot for variety.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Tactical',
  'Three-pattern game plan executed in matches.',
  'First-strike forehand identified and used.',
  'Approach + volley pattern available.',
  'Defending and counter-attacking from stretched positions.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Movement',
  'Split-step + recovery + footwork sequences instinctive.',
  'Defensive sliding and recovery.',
  'Forward to net + recovery back to baseline.',
  'Cross-court running forehand on the run.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Competition',
  'Owns pre-match warm-up routine (15 min).',
  'Three-pattern game plan in own words.',
  'Match-tiebreak pressure handling.',
  'Body-language reset after a lost game.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Mentality',
  'Pre-match focus routine standardized.',
  'Cue word holds under pressure points.',
  'Body-language reset after lost games.',
  'Building a ''one-point focus'' habit on big points.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Fitness',
  'Continuous play 90 min.',
  'First-step quickness + reactive sprints.',
  'Light strength block (bodyweight + bands + light dumbbells).',
  'Adding a 4th off-court session per week.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Recovery',
  'Active recovery 2x/week + foam rolling daily.',
  'Sleep 8-10 hours, nutrition tracked.',
  'Hydration + electrolytes during sessions.',
  'Adding a contrast bath or ice routine.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Lifestyle',
  'Independent across warm-up, match-prep, and review.',
  'Communicating with coach about training intent.',
  'Balancing school, tennis, and rest.',
  'Setting yearly goals with coach and family.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Technical',
  'Full-set scoring tolerance — strokes hold up across 6-game sets.',
  'Serve with placement and pace.',
  'Volley + overhead reliable under match pressure.',
  'Slice and drop shot used tactically.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Tactical',
  'First-strike + construction patterns both available.',
  'Score-state adjustments mid-match.',
  'Approach + volley + recovery sequence.',
  'Reading opponent patterns in real time.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Movement',
  'Defensive sliding + recovery + counter-attack.',
  'Forward to net + closing angle + recovery.',
  'Lateral shuffles and crossover steps both as tools.',
  'Plyometric work appearing in conditioning.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Competition',
  'Mid-match strategy adjustment when down a break.',
  'Body-language reset between every point.',
  'Multi-day tournament across a weekend.',
  'Sectional-level event with full pre-match preparation.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Mentality',
  'Self-talk audit and adjustment.',
  'Periodization awareness (peak weeks vs train weeks).',
  'Mid-match reframe after losing a set.',
  'Adding a visualization routine pre-event.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Fitness',
  'Continuous play 90-120 min.',
  'Strength block with light dumbbells and bands.',
  'Sport-specific intervals on court.',
  'Adding a 5th off-court session per week.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Recovery',
  'Active recovery + foam rolling + soft tissue work.',
  'Sleep tracking with pre-bed routine.',
  'Nutrition timing around sessions.',
  'Adding a recovery audit (1-10 score) daily.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Lifestyle',
  'Independent in tournament prep and review.',
  'Communication with coach is two-way (not just receiving).',
  'School coordination with travel calendar.',
  'Setting 12-month vision with coach.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Technical',
  'Strokes hold up across 3 best-of-3 matches in a weekend.',
  'Serve with placement, pace, and spin variation.',
  'Volley, overhead, and approach all available under pressure.',
  'Drop shot and slice used at right moments.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Five-pattern library matched to game style.',
  'Style identification (counterpuncher, aggressive baseliner, all-court).',
  'Endgame patterns (closing volleys, defensive lobs).',
  'Win/loss patterns by opponent style tracked.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Movement',
  'Plyometric work integrated into conditioning.',
  'Defensive + counter-attack + neutralizing transitions.',
  'Forward to net + closing volley + recovery.',
  'Movement quality holds across long matches.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Competition',
  'Tournament weekend with full plan, in-event log, and review.',
  'National-qualifier event experience.',
  'Recognizing which game-styles are problems and bringing them to training.',
  'Sectional ranking established.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Cue word + reset + reframe as a system.',
  'Style statement (a 1-sentence identity).',
  'Mid-match recovery from a 2-set deficit (in best-of-3 third-set scenarios).',
  'Adding pre-event visualization routine.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Fitness',
  'Continuous play 90+ min across multiple matches.',
  'Strength block with light dumbbells, kettlebells, bands.',
  'Sport-specific intervals + plyometrics.',
  'Adding double periodization (two annual peaks).'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Recovery',
  'Active recovery + soft tissue + sleep tracking + nutrition.',
  'Recovery routine standardized post-session and post-match.',
  'Sleep 8-10 hrs nightly with pre-bed routine.',
  'Adding HRV or load tracking if available.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Lifestyle',
  'Tournament logistics (check-in, schedule, food) handled independently.',
  'Communication with coach about training and competition.',
  'School-tennis-rest balance owned.',
  'Setting 18-month roadmap with coach.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Technical',
  'Yellow-ball pace and weight adapted to.',
  'Heavy and flat shape calibrated.',
  'Serve plus one with first-strike forehand.',
  'Volley, overhead, and approach reliable under match pressure.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Tactical',
  'First-strike + construction + counter-attack patterns all available.',
  'Pre-match scouting (when info available).',
  'Score-state and recovery patterns identified.',
  'Style refinement (clearer about own identity).'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Movement',
  'Defensive + counter + offensive transitions all instinctive.',
  'Plyometric maintenance with sprint training.',
  'Forward to net under match pressure.',
  'Movement quality holds at yellow-ball pace.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Competition',
  'Pre-match scouting routine.',
  'Game plan written one-page format.',
  'Recovery between same-day matches.',
  'Level 5 national event with documented review.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Mentality',
  'One-point focus on big points.',
  'Periodization awareness across the year.',
  'Recovery routine pre-bed and post-event.',
  'Adding journaling or daily log.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Fitness',
  'Strength block with barbell work under qualified S&C.',
  'Sport-specific intervals at match pace.',
  'Plyometrics and sled work.',
  'Adding double periodization aligned with calendar.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Recovery',
  'Sleep 8-10 hrs + recovery audit + nutrition tracking.',
  'Soft tissue work + active recovery 2-3x/week.',
  'Hydration and electrolyte routine.',
  'Adding contrast or ice baths post-event.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Lifestyle',
  'Independent across travel, food, and routine.',
  'Communicates with coach about wins, losses, and patterns.',
  'School flexibility for travel.',
  'Setting 2-year vision with coach and family.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Technical',
  'Strokes hold up at full yellow-ball pace.',
  'Heavy/flat calibration on demand.',
  'Serve plus one + recovery as a sequence.',
  'Drop shot disguise and tactical layers.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Tactical',
  'Five-pattern library expanded with style nuances.',
  'Periodization mapping to tournament calendar.',
  'First-strike forehand variations.',
  'Game-style recognition (counterpuncher, aggressive baseliner, all-court, big-server).'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Movement',
  'Movement holds across multi-day events.',
  'Sprint work + plyometrics + reactive footwork.',
  'Defensive sliding + counter-attack + recovery.',
  'Forward movement to net with closing angle.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Competition',
  'National Level 4 event with documented plan and review.',
  'Multi-match same-day recovery.',
  'Periodization across competition cycles.',
  'Sectional or regional ranking.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Mentality',
  'Self-talk audit + reframe + cue word.',
  'Pre-event visualization routine.',
  'Mid-match reframe after a set deficit.',
  'Building a personal mental skills routine.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Fitness',
  'Strength block + power development + Olympic lift derivatives.',
  'Sport-specific intervals + plyometrics + sled work.',
  'Sport-specific aerobic ceiling work.',
  'Adding triple periodization for top-tier events.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Recovery',
  'Sleep + nutrition + recovery audit standardized.',
  'Soft tissue + active recovery + sleep tracking.',
  'Travel-specific recovery protocols.',
  'Adding HRV monitoring if available.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Lifestyle',
  'Tournament logistics fully owned.',
  'Coach communication is daily during peaks.',
  'School online or hybrid where needed.',
  'Setting a 3-year vision with family.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Technical',
  'Strokes hold up under national-level match pressure.',
  'Pace + spin + placement on demand.',
  'Style fully visible across matches.',
  'Tactical layer in shot selection.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Game-style identified and refined.',
  'Pre-match scouting standardized.',
  'Adjustment routine when down or up significantly.',
  'Pattern execution under pressure.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Movement',
  'Movement holds across 3-5 day events.',
  'Sprint + plyometric + reactive footwork integrated.',
  'Defensive + offensive transitions seamless.',
  'Pro-style movement quality emerging.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Competition',
  'National Level 3 event with full pre/in/post-event plan.',
  'Multi-day tournament management.',
  'ITF junior event experience (if HP-bound).',
  'National ranking established.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Mental skills routine standardized.',
  'Identity statement holds under pressure.',
  'Recovery from a loss within 24 hours.',
  'Setting performance + outcome goals separately.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Fitness',
  'Power development + Olympic lift derivatives at moderate load.',
  'Sport-specific intervals at match pace.',
  'Plyometric maintenance.',
  'Adding individualized programming.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Recovery',
  'Recovery system: sleep + nutrition + soft tissue + active recovery + HRV.',
  'Travel-specific protocols.',
  'Pre-event taper routine.',
  'Adding individualized recovery markers.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Lifestyle',
  'Tournament travel and logistics fully independent.',
  'Coach communication is daily during competition cycles.',
  'School arrangements support tennis schedule.',
  'Career path conversation begins (pro vs college).'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Technical',
  'Strokes at international junior level.',
  'Pace, spin, placement, disguise integrated.',
  'Style + signature shots clearly identified.',
  'Specialty shots (spin variation, drop shots) as differentiators.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Tactical',
  'Game-style + 5-pattern library + opponent scouting.',
  'Match construction over hours.',
  'Pre-match plan + in-match adjustments.',
  'International-level tactical awareness.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Movement',
  'Pro-style movement quality.',
  'Sprint + plyometric + reactive footwork.',
  'Multi-surface adaptation (hard, clay, grass).',
  'Movement holds across a 5-day event.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Competition',
  'ITF G4-G5 event with full pre/in/post-event plan.',
  'Pro-style routines pre-match.',
  'Self-scouting and opponent scouting.',
  'Career planning conversations.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Mentality',
  'Mental skills routine pro-level.',
  'Identity statement + style + signature signature.',
  'Recovery from setbacks (loss, injury, travel).',
  'Performance-on-demand routine.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Fitness',
  'Pro-style off-court program individualized.',
  'Strength + power + speed + endurance integrated.',
  'Triple periodization with ITF calendar.',
  'Individualized markers and load monitoring.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Recovery',
  'Recovery is a system (sleep + nutrition + soft tissue + breath + HRV).',
  'Travel-specific protocols.',
  'Pre-event taper standardized.',
  'Individualized recovery markers tracked.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Lifestyle',
  'Pro-style daily routines.',
  'School online or hybrid.',
  'Family role shifts to support, not logistics.',
  'Pro vs college path conversation in motion.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Technical',
  'Strokes at junior international top-100 level.',
  'Signature shots clearly differentiate the player.',
  'Surface adaptation reliable.',
  'Specialty shots refined.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Tactical',
  'Match construction over best-of-3 to best-of-5.',
  'Opponent scouting and self-scouting routine.',
  'Pre-match plan + in-match + post-match cycle.',
  'International-level tactical IQ.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Movement',
  'Pro-style movement maintained across a tournament.',
  'Multi-surface and multi-style adaptation.',
  'Sprint + plyometric maintenance.',
  'Movement holds at junior-slam level.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Competition',
  'ITF G3 event with full plan and review.',
  'Junior slam exposure.',
  'Self-scouting + opponent scouting routine.',
  'Junior top-100 ranking targeted.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Mentality',
  'Mental skills routine maintained on the road.',
  'Identity + style + recovery routine.',
  'Performance-on-demand at slams.',
  'Career planning is active.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Fitness',
  'Pro-style program with travel-period adjustments.',
  'Triple periodization with calendar awareness.',
  'Individualized programming.',
  'Adding pro-tour preview blocks.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Recovery',
  'Travel-specific recovery system.',
  'Sleep + nutrition + soft tissue + breath + HRV.',
  'Pre-event taper standardized.',
  'Recovery is part of the daily plan, not an afterthought.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Lifestyle',
  'Travel coach or coach team established.',
  'Pro-style daily routines on the road.',
  'Family role is emotional support.',
  'Career commitment (pro path or college path) clarifying.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Technical',
  'Strokes at junior slam main draw level.',
  'Differentiating signature shots.',
  'Surface adaptation across hard, clay, grass.',
  'Pro-tour stroke integrity emerging.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Pro-style match construction.',
  'Pro-tour level scouting and adjustment.',
  'Best-of-5 match management at slams.',
  'Pro-tour tactical layer.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Movement',
  'Pro-tour movement quality.',
  'Multi-surface + multi-style adaptation.',
  'Sprint + plyometric + maintenance program.',
  'Movement at pro level for futures and challenger events.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Competition',
  'Junior slam main draw or pro-futures event with full plan and review.',
  'Pro-style preparation and recovery.',
  'Career planning (pro path or college path) decided.',
  'Pro-tour or top-program college transition.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Pro-style mental skills routine.',
  'Identity + style + recovery integrated.',
  'Career commitment in place.',
  'Pro-tour mindset emerging.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Fitness',
  'Pro-tour S&C program.',
  'Sport-specific work coordinated with on-court training.',
  'Pro-tour calendar awareness.',
  'Adding tour-coach handoff.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Recovery',
  'Pro-tour recovery system.',
  'Sleep + nutrition + soft tissue + breath + HRV + load monitoring.',
  'Travel-specific protocols at pro level.',
  'Recovery is professionalized.'
) ON CONFLICT (level_id, domain) DO NOTHING;

INSERT INTO curriculum_coach_language
  (level_id, domain, doing_well, working_on, current_focus, next_step)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Lifestyle',
  'Pro-style daily routines fully established.',
  'Travel coach or tour coach in place.',
  'Career path (pro or college) committed to.',
  'Pro-tour or top-program college transition.'
) ON CONFLICT (level_id, domain) DO NOTHING;

-- ============================================================
-- SECTION 6a: curriculum_drills (152 rows)
-- Source: AOS_Curriculum_Drills.xlsx — Drill Library sheet
-- Full 152 rows — validated clean in Sprint 188.
-- coaching_cues stored as JSONB (parsed from pipe-delimited source).
-- academy_id IS NULL for all rows → global platform drills.
-- ============================================================

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED1_MOV_001',
  NULL,
  'Animal Walks Warm-Up',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Movement',
  'Warm-Up',
  'Build coordination and athletic vocabulary through varied locomotor patterns.',
  'Open court area or doubles alley. No equipment required. 4-12 players.',
  '1. Coach calls an animal: bear crawl, crab walk, frog jump, lizard, kangaroo. | 2. Players cross from baseline to net using that pattern. | 3. Coach changes the animal each crossing. | 4. Add directional changes (sideways bear crawl, backward crab) on the return.',
  '{"doing_well": "Player engages with each new pattern without resistance.", "working_on": "Smooth transitions between patterns.", "current_focus": "Quality of the locomotor shape.", "next_step": "Add a tennis cue — racquet held in one hand during easier patterns."}'::jsonb,
  'Reduce to 2-3 patterns; demonstrate alongside the player.',
  'Add a partner-mirror version where the trailing player must copy the leader''s pattern in real time.',
  'Player executes 4+ different patterns recognizably across one warm-up.',
  8,
  4,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED1_MOV_002',
  NULL,
  'Catch and Throw Stations',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Movement',
  'Train',
  'Develop hand-eye coordination as a foundation for racquet skills.',
  'Three stations on the service line: tennis-ball toss to wall (bounce-catch), partner underhand toss, hoop targets at 3m.',
  '1. Group rotates through stations, 2 minutes each. | 2. Station 1: bounce ball off wall, catch on one bounce. | 3. Station 2: partner tosses underhand, catch with two hands. | 4. Station 3: throw underhand into 1m hoop from 3m. | 5. After three rotations, increase distance or remove a hand.',
  '{"doing_well": "Eyes track the ball through the catch.", "working_on": "Soft hands on the catch — give with the ball.", "current_focus": "Same body position to throw and to receive.", "next_step": "Replace one station with a soft-paddle catch."}'::jsonb,
  'Move targets closer; use larger ball; allow two hands and two bounces.',
  'Switch to one-handed catch; introduce a moving hoop or moving partner.',
  'Player catches 7/10 and throws into target 5/10 from 3m.',
  12,
  6,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED1_TEC_003',
  NULL,
  'Bounce-Hit-Catch Solo',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Technical',
  'Focus',
  'Introduce racquet contact through a self-paced bounce-hit-catch sequence.',
  'Service box, foam or red ball, modified racquet (19-21 inch).',
  '1. Player drops the ball with non-dominant hand. | 2. After one bounce, taps it gently upward off the strings. | 3. Catches the ball in the non-dominant hand. | 4. Repeat for 60 seconds, count successful sequences. | 5. Coach watches for racquet held with full grip throughout.',
  '{"doing_well": "Player completes a full bounce-hit-catch loop.", "working_on": "Soft tap, not a swing.", "current_focus": "Watching the ball all the way to the strings.", "next_step": "Replace the catch with a second tap."}'::jsonb,
  'Use a balloon or beanbag in place of ball; coach holds racquet with player.',
  'Two consecutive taps before the catch; alternating forehand and backhand face.',
  'Player completes 5 consecutive bounce-hit-catch sequences without dropping the racquet.',
  6,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED1_COM_004',
  NULL,
  'Rally Game King of the Court Modified',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Competition',
  'Game',
  'First exposure to a rally-based winner format with peer interaction.',
  'Half court, foam or red ball, drop-hit start. 4-8 players.',
  '1. One player is ''King'' on one side. | 2. Challenger drop-hits to King; rally up to 3 shots. | 3. If rally reaches 3 shots, both players win a star. | 4. If rally breaks before 3, neither wins. | 5. Rotate challenger every point. | 6. After 8 minutes, count stars.',
  '{"doing_well": "Players cheer for the rally, not their own win.", "working_on": "Saying the score out loud each point.", "current_focus": "Aiming the ball back into the court, not down the line.", "next_step": "Extend rally requirement to 4 shots."}'::jsonb,
  'Coach feeds the first ball; reduce target rally to 2 shots.',
  'King keeps spot only by winning the rally; shorter spot tenure.',
  'Player participates in 5+ point cycles with appropriate behavior.',
  10,
  4,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED1_MEN_005',
  NULL,
  'Listening Line',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Mentality',
  'Warm-Up',
  'Build sustained-attention capacity and instruction-following.',
  'Service line, players in a line facing coach.',
  '1. Coach gives a 3-step instruction (e.g., ''walk to the net, touch it, jog back''). | 2. Players execute in order. | 3. Add a fourth step in the next round. | 4. Track which players need a re-explain.',
  '{"doing_well": "Player waits for the full instruction before moving.", "working_on": "Eyes on coach during the instruction.", "current_focus": "Remembering the order.", "next_step": "5-step sequence including a tennis-skill step."}'::jsonb,
  '2-step instructions; coach demonstrates alongside.',
  '5-step sequence with a sport-skill step embedded; partner-relay version.',
  'Player executes 3-step instruction correctly on 3 of 5 attempts.',
  5,
  4,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED2_TEC_006',
  NULL,
  'Drop-Hit Rally to Coach',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'Technical',
  'Focus',
  'Build a controlled rally start from a self-feed.',
  'Half court, red ball, modified racquet, coach standing at opposite service line.',
  '1. Player drop-hits to coach. | 2. Coach returns softly. | 3. Player hits second ball back over net. | 4. Goal: 3 contacts in a row. | 5. Reset after each break, track best run.',
  '{"doing_well": "Player resets calmly after a miss.", "working_on": "Drop the ball, don''t bounce it.", "current_focus": "Contact in front of the body.", "next_step": "Move to a 4-shot target."}'::jsonb,
  'Coach hand-feeds; allow two bounces; smaller court.',
  'Player must alternate forehand and backhand; introduce a target zone.',
  'Player sustains a 3-shot drop-hit rally on 3 separate attempts.',
  8,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED2_TEC_007',
  NULL,
  'Target Zone Tap-Down',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Technical',
  'Train',
  'Introduce ''where the ball goes'' as a concept through visible target zones.',
  'Half court, two large hoops (or cone-marked zones) on the service line, drop-hit feed, red ball.',
  '1. Coach designates Zone A (deuce) or Zone B (ad). | 2. Player drop-hits and tries to land in the called zone. | 3. 10 attempts, count zone-hits. | 4. Switch to coach-fed balls after 5 minutes. | 5. Final round: coach calls zone after the bounce.',
  '{"doing_well": "Player looks at the target before swinging.", "working_on": "Swing toward the zone, not at the ball.", "current_focus": "Using the racquet face direction.", "next_step": "Same drill with a moving start."}'::jsonb,
  'Larger zones; static feed; closer to the net.',
  'Smaller zones; full-court depth target; live feed sequence of 5 in a row.',
  'Player lands 5/10 in called zone from a fed ball.',
  10,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED2_MOV_008',
  NULL,
  'Side-Shuffle Recovery',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Movement',
  'Warm-Up',
  'Introduce lateral movement and the idea of returning to a ready position.',
  'Service box, two cones on the singles sidelines marking lateral edges.',
  '1. Player starts at center service line. | 2. Coach calls left or right. | 3. Player side-shuffles to the called cone. | 4. Side-shuffles back to center, ready position. | 5. Repeat 8 reps; switch to coach-pointing without voice cue.',
  '{"doing_well": "Player stays low through the shuffle.", "working_on": "Stop at center, don''t drift past.", "current_focus": "Ready position with racquet up after each rep.", "next_step": "Add a fed ball at the cone — touch and recover."}'::jsonb,
  'Smaller distance; walk-tempo; coach demonstrates alongside.',
  'Add fed ball at the lateral cone; introduce diagonal shuffle.',
  'Player reaches the called cone and returns to center on 6 of 8 reps with a stable ready position.',
  6,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED2_COM_009',
  NULL,
  'First-to-Five Rally Points',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'Competition',
  'Game',
  'Modified-scoring competition that rewards rally length, not winners.',
  'Half court, red ball, two players, drop-hit start.',
  '1. Players rally; first player to drop the ball after 3+ shots loses the point. | 2. If rally breaks before 3 shots, replay. | 3. First to 5 points wins. | 4. Track who calls the score correctly each point.',
  '{"doing_well": "Players keep score out loud.", "working_on": "Don''t celebrate the opponent''s miss — celebrate the rally.", "current_focus": "Calm reset after each point.", "next_step": "Extend rally requirement to 5 shots."}'::jsonb,
  'Coach starts the rally with a feed; reduce rally requirement to 2.',
  'Add a target zone the rally must hit in shots 1-3.',
  'Player completes a full first-to-5 game with correct score-keeping.',
  12,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED2_MEN_010',
  NULL,
  'What Did You Notice',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Mentality',
  'Train',
  'Build a basic self-observation habit after a rally.',
  'Any drill context. No additional equipment.',
  '1. After a 5-shot rally or a fed sequence, coach asks: ''What did you notice?'' | 2. Player gives one observation about their own play. | 3. Coach asks: ''What''s one thing you''ll try next?'' | 4. Player names one focus. | 5. Run for 4-6 cycles within a session.',
  '{"doing_well": "Player gives a specific, not generic, answer.", "working_on": "Naming what THEY did, not what the coach saw.", "current_focus": "Connecting the observation to the next attempt.", "next_step": "Player initiates the reflection unprompted."}'::jsonb,
  'Coach offers two observation options to choose between.',
  'Player runs the cycle on a peer''s rally; introduce written log.',
  'Player gives a specific self-observation in 4 of 6 prompts.',
  5,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED3_COM_011',
  NULL,
  'Modified Mini-Match',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Competition',
  'Game',
  'Full-arc mini-match exposure with modified scoring and full self-management.',
  'Half court, red or orange ball, two players, no coach intervention during play.',
  '1. Players agree on first server. | 2. Best of 7 points wins (or first to 4). | 3. Players call own scores, lines, faults. | 4. Coach watches without intervening. | 5. Debrief at the end.',
  '{"doing_well": "Player calls own faults honestly.", "working_on": "Score called before each point.", "current_focus": "Restart routine between points.", "next_step": "Add a 1-set format with switch sides at odd games."}'::jsonb,
  'Coach acts as silent line judge; reduce to first to 3.',
  'Add changeovers; track first-strike percentage; introduce a tiebreaker.',
  'Player completes a full mini-match end-to-end with correct scoring on 2 separate occasions.',
  15,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED3_TEC_012',
  NULL,
  'Forehand Backhand Recognition',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Technical',
  'Focus',
  'Reinforce automatic side-recognition: ball on this side = this stroke.',
  'Half court, coach hand-feeds from opposite service line, red ball.',
  '1. Coach feeds 10 balls in random sequence to forehand and backhand. | 2. Player calls ''forehand'' or ''backhand'' at the bounce. | 3. Player executes the stroke into the court. | 4. Track recognition accuracy and stroke quality separately. | 5. After 10, switch to silent recognition (no call).',
  '{"doing_well": "Player calls before the contact, not at it.", "working_on": "Pivot to the side immediately on recognition.", "current_focus": "Recognizable shape on each wing.", "next_step": "Same drill with shorter prep window."}'::jsonb,
  'Larger separation between feeds; player calls before feed; reduce ball speed.',
  'Increase feed pace; alternate with surprise inside-out feed; reduce reaction time.',
  'Player calls and executes correct stroke on 8 of 10 mixed feeds.',
  8,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED3_MOV_013',
  NULL,
  'Recovery Run-Touch-Return',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Movement',
  'Train',
  'Build the recovery habit between shots.',
  'Half court, two cones marking recovery point at center service line, red ball, coach feeds.',
  '1. Coach feeds wide to forehand. | 2. Player hits and immediately runs back to center cone, touches it. | 3. Coach feeds wide to backhand. | 4. Player hits and recovers to center. | 5. 8 reps continuous, count missed recoveries.',
  '{"doing_well": "Player initiates recovery before the ball lands on the other side.", "working_on": "Touch the cone fully — don''t just look at it.", "current_focus": "Stable ready position after the touch.", "next_step": "Same drill with bisector recovery zone instead of fixed cone."}'::jsonb,
  'Walk-tempo; eliminate one wing; closer cone.',
  'Three-direction feed (wide-wide-middle); add a follow-up groundstroke after recovery.',
  'Player recovers to cone on 6 of 8 reps with stable ready position.',
  8,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED3_MEN_014',
  NULL,
  'Sportsmanship Checklist',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Mentality',
  'Game',
  'Make match-day behaviors explicit and visible.',
  'Mini-match context. Coach has a paper or app checklist.',
  '1. Before match: coach reviews 5 behaviors — call own lines, no equipment-throwing, handshake, score-call, restart routine. | 2. During match: coach checks each behavior as observed. | 3. After match: review checklist with player. | 4. Player self-rates each behavior.',
  '{"doing_well": "Player owns the call when uncertain.", "working_on": "Same volume of voice on the score after a missed shot as after a winner.", "current_focus": "Restart routine — bounce, breathe, ready.", "next_step": "Self-checklist after the next match without prompting."}'::jsonb,
  'Reduce to 3 behaviors; coach demonstrates each one beforehand.',
  'Player audits a peer''s checklist; introduce body-language item.',
  'All 5 checklist items observed in a single match.',
  20,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE1_TEC_015',
  NULL,
  'Crosscourt Forehand Cooperation',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Technical',
  'Focus',
  'First sustained crosscourt rally as a named target zone.',
  'Three-quarter court, orange ball, two players in deuce-deuce diagonal.',
  '1. Players drop-hit to start, both crosscourt forehand. | 2. Cooperative — goal is rally length, not winning. | 3. Count consecutive crosscourt shots. | 4. Reset after each break. | 5. Both players track best run together.',
  '{"doing_well": "Both players celebrate the rally.", "working_on": "Aim for the inside of the singles sideline, not the line itself.", "current_focus": "Take the ball at the same point in the bounce each time.", "next_step": "Increase target rally to 8."}'::jsonb,
  'Reduce target to 3; coach feeds the start; player on serve side starts with two-handed forehand if needed.',
  'Add a target zone in the crosscourt corner; one player adds spin.',
  'Player sustains 5-shot crosscourt rally on 3 separate attempts.',
  12,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE1_TEC_016',
  NULL,
  'Crosscourt Backhand Cooperation',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Technical',
  'Focus',
  'Mirror of the crosscourt forehand drill on the backhand wing.',
  'Three-quarter court, orange ball, two players in ad-ad diagonal.',
  '1. Players drop-hit, both crosscourt backhand. | 2. Cooperative; track rally count. | 3. Reset after break. | 4. After 5 minutes, switch to live feed start.',
  '{"doing_well": "Player commits to the backhand pivot before the ball arrives.", "working_on": "Two hands on the backhand if needed for stability.", "current_focus": "Same contact point relative to body each shot.", "next_step": "Increase target to 8."}'::jsonb,
  'Reduce target to 3; coach feeds; allow one bounce extra.',
  'Add target zone; player must alternate one slice every 5 shots.',
  'Player sustains 5-shot crosscourt backhand rally on 3 separate attempts.',
  12,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE1_TAC_017',
  NULL,
  'Direction Change Game',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Tactical',
  'Train',
  'Introduce direction-change as a tactical decision.',
  'Three-quarter court, orange ball, two players, two coned target zones (deuce corner, ad corner).',
  '1. Player A rallies crosscourt forehand. | 2. On a coach call, A changes direction down the line. | 3. B plays the new ball back crosscourt to A''s backhand. | 4. Reset after 6 shots. | 5. Roles switch each rally.',
  '{"doing_well": "Direction change happens on a clean ball, not a desperation ball.", "working_on": "Don''t tell B what''s coming — change with the swing.", "current_focus": "Recover after the change to defend B''s reply.", "next_step": "A initiates the change without coach call."}'::jsonb,
  'Coach calls ''change'' verbally with hand signal; reduce rally before change to 3.',
  'B can change direction back; introduce a second change in the same rally.',
  'Player executes a clean direction change to a target zone in 4 of 6 attempts.',
  10,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE1_COM_018',
  NULL,
  'Round-Robin Mini-Tournament',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Competition',
  'Game',
  'Multi-opponent competition exposure in a single session.',
  'Three-quarter court, orange ball, 4-6 players, brackets posted.',
  '1. Each player plays a 4-point match against each opponent. | 2. Track wins and points-won. | 3. Standings posted at session end. | 4. Coach watches but does not intervene. | 5. Debrief winners and one improvement each.',
  '{"doing_well": "Player adapts to different opponent styles.", "working_on": "Same energy in match 4 as match 1.", "current_focus": "Restart routine between points.", "next_step": "Reflect on which opponent was hardest and why."}'::jsonb,
  'Coach feeds the first ball each point; reduce to 3-point matches.',
  'Add a tiebreaker in tied matches; introduce a ''best opponent'' vote.',
  'Player completes all matches with stable behavior across the round-robin.',
  30,
  4,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE1_MOV_019',
  NULL,
  'Split-Step Reaction',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Movement',
  'Warm-Up',
  'Build the split-step habit on opponent contact.',
  'Three-quarter court, orange ball, coach feeds from opposite baseline.',
  '1. Player at center baseline, ready position. | 2. Coach mimes a swing, then feeds. | 3. Player split-steps on coach''s contact moment. | 4. Player moves to ball after split. | 5. 12 reps, video the last 4 for review.',
  '{"doing_well": "Split lands as the coach contacts.", "working_on": "Land on the balls of the feet, not flat.", "current_focus": "Soft knees — split is a coiling not a stomp.", "next_step": "Split + first explosive step combined."}'::jsonb,
  'Coach calls ''split'' verbally on contact; slower mimed swing; reduce reps.',
  'Coach varies feed direction; introduce surprise no-feed; add fed second ball.',
  'Player splits on contact in 8 of 12 reps as judged from video.',
  8,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE1_MEN_020',
  NULL,
  'Three Goals for the Session',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Mentality',
  'Warm-Up',
  'Habit of session-level intent.',
  'Any session start. Whiteboard or app input.',
  '1. Player names 3 goals for the session — one technical, one tactical, one mentality. | 2. Coach refines if needed. | 3. Goals are written down or entered in app. | 4. Mid-session, coach asks player to rate progress 1-5 on each. | 5. End of session, final rating + one-line reflection.',
  '{"doing_well": "Goals are specific, not ''play better''.", "working_on": "Tying the goal to a measurable.", "current_focus": "Honest mid-session rating.", "next_step": "Player carries one goal forward to next session."}'::jsonb,
  'Coach offers 2 options per category to pick from.',
  'Player writes goals before arriving; reflects in writing for 3 sessions in a row.',
  'Player names 3 specific goals and gives mid- and end-session ratings.',
  5,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE2_TAC_021',
  NULL,
  'Bisector Recovery Introduction',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Focus',
  'Introduce the bisector concept — recovery to bisect opponent''s possible reply angles.',
  'Three-quarter court, orange ball, two players, chalked bisector arc.',
  '1. Player A hits crosscourt forehand from deuce corner. | 2. Player A recovers — not to center, but to the bisector point of the opponent''s reply angles. | 3. Bisector marked with chalk for first 5 minutes. | 4. After 5 minutes, marker removed; player self-locates. | 5. 10 rallies, coach scores recovery position 1-3 each.',
  '{"doing_well": "Player recovers diagonally, not laterally.", "working_on": "Recovery starts before the ball lands on the opponent''s side.", "current_focus": "Bisector is dynamic — moves with each shot.", "next_step": "Bisector recovery after a down-the-line change."}'::jsonb,
  'Static feed; cone marks the bisector for entire drill; reduce to 4 rallies.',
  'Live rally; opponent can attack any zone; introduce 2-shot pattern before recovery is judged.',
  'Player recovers to within 1m of the bisector on 6 of 10 rallies.',
  12,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE2_TEC_022',
  NULL,
  'Inside-Out Forehand Introduction',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Technical',
  'Focus',
  'First introduction to the inside-out forehand — using the forehand from the backhand corner.',
  'Three-quarter court, orange ball, coach feeds from opposite baseline.',
  '1. Coach feeds to player''s backhand corner. | 2. Player runs around the backhand and hits forehand crosscourt to opponent''s backhand zone. | 3. 8 reps from feed. | 4. Then live rally with coach where the inside-out forehand is the trigger.',
  '{"doing_well": "Player commits to the run-around early.", "working_on": "Open stance — don''t try to plant.", "current_focus": "Cross-step recovery after the inside-out.", "next_step": "Add the inside-out as a 3-shot pattern starter."}'::jsonb,
  'Slower feed; coach calls ''around'' in advance; reduce reps to 4.',
  'Live rally; opponent can attack the deuce corner that opens after the run-around.',
  'Player executes inside-out forehand cleanly on 5 of 8 fed reps.',
  10,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE2_TAC_023',
  NULL,
  'Short Angle Crosscourt',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Train',
  'Introduce short-angle as a court-mapping zone distinct from deep crosscourt.',
  'Three-quarter court, orange ball, target hoop in short crosscourt zone (inside service line, outside singles sideline).',
  '1. Coach feeds short crosscourt ball. | 2. Player must hit short angle back into the marked target zone. | 3. 10 fed reps. | 4. Then live with coach: short ball triggers short angle reply. | 5. Track hits in target.',
  '{"doing_well": "Player recognizes short-ball cue early.", "working_on": "Open the racquet face for the short angle.", "current_focus": "Net clearance is high — angle, not pace.", "next_step": "Short angle as a closing shot before approach."}'::jsonb,
  'Larger target hoop; closer feed; reduce reps.',
  'Smaller target; opponent can defend with lob; chain into approach shot.',
  'Player lands 5 of 10 in target hoop from feed.',
  10,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE2_COM_024',
  NULL,
  'Three-Match Day',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Competition',
  'Game',
  'Build endurance and reset capacity across multiple matches in one session.',
  'Three-quarter court, orange ball, 4-6 players, bracket posted.',
  '1. Each player plays 3 short matches (4 games each). | 2. 5-min break between matches. | 3. Coach tracks first-strike percentage and unforced error count per match. | 4. End-of-day debrief includes pattern across the three matches. | 5. Player names one technical insight from the three matches combined.',
  '{"doing_well": "Player resets between matches with a clear routine.", "working_on": "Don''t carry match 1 emotion into match 2.", "current_focus": "Stable first-strike behavior across matches.", "next_step": "Self-track unforced error count."}'::jsonb,
  'Reduce to 2 matches; coach allows mid-match coaching.',
  'Add a fourth knockout match for top finishers; introduce shot-direction stat.',
  'Player completes all 3 matches with consistent behavior and one self-named insight.',
  45,
  4,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE2_TEC_025',
  NULL,
  'Slice Backhand Introduction',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Technical',
  'Focus',
  'First slice backhand as a defensive option.',
  'Three-quarter court, orange ball, coach feeds.',
  '1. Coach feeds high to backhand. | 2. Player hits slice backhand — racquet face slightly open, high-to-low contact. | 3. 10 fed reps with target deep crosscourt. | 4. Live rally where slice is the only allowed backhand for first 5 rallies. | 5. After, player chooses slice or topspin contextually.',
  '{"doing_well": "Player keeps the racquet face stable through contact.", "working_on": "Don''t chop down — slice is forward through the ball.", "current_focus": "Use it as a defense, not a default.", "next_step": "Slice approach to net as a follow-up."}'::jsonb,
  'Coach demonstrates with player; static feed; allow two-handed grip transition help.',
  'Slice into a target zone; introduce slice approach with volley follow-up.',
  'Player hits 5 of 10 slice backhands cleanly into court from feed.',
  10,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE2_MEN_026',
  NULL,
  'Reset Routine Between Points',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Game',
  'Make the between-point reset a deliberate, repeatable sequence.',
  'Match-play context.',
  '1. Player and coach co-design a 4-step routine: turn away, breathe, cue word, ready. | 2. Player practices routine after every point — won, lost, or replayed. | 3. Coach tracks adherence each point. | 4. Mid-match check: rate own routine adherence. | 5. End of match: review routine consistency.',
  '{"doing_well": "Routine is the same after a winner as after an error.", "working_on": "Same duration each time — no rushing after a winner.", "current_focus": "Cue word triggers physical readiness.", "next_step": "Player owns the routine without prompts for full match."}'::jsonb,
  'Reduce routine to 2 steps; coach reminds verbally each point.',
  'Add a ''reset trigger'' on game change; player coaches a peer through their routine.',
  'Player adheres to routine on 80% of points across a full set.',
  20,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE3_TAC_027',
  NULL,
  'Three-Shot Pattern — 1+2+Recover',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Tactical',
  'Focus',
  'Introduce repeatable patterns: serve/return + first-strike + recovery.',
  'Three-quarter court, orange ball, two players.',
  '1. Player A serves crosscourt; B returns crosscourt. | 2. A''s first-strike: redirect down the line OR play heavy crosscourt. | 3. A recovers to bisector. | 4. Rally continues live. | 5. Run 8 patterns from each side, debrief which choice was used and why.',
  '{"doing_well": "Pattern is decided pre-point, not improvised.", "working_on": "Recovery starts on the strike, not after the bounce.", "current_focus": "Same shape on the first-strike whether redirect or heavy crosscourt.", "next_step": "Add a second pattern option triggered by ball depth."}'::jsonb,
  'Coach feeds the return; reduce to 4 patterns; static recovery point.',
  'Add an opponent who can attack the recovery; chain into a 5-shot pattern.',
  'Player executes the chosen 3-shot pattern cleanly in 5 of 8 attempts.',
  15,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE3_COM_028',
  NULL,
  'Sanctioned-Format Match Simulation',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Competition',
  'Game',
  'Replicate a sanctioned event format including warm-up, rules, and timekeeping.',
  'Three-quarter court, orange ball, two players, official scorecard.',
  '1. 5-minute formal warm-up. | 2. Best of 3 short sets, no-ad scoring. | 3. Coin toss for serve. | 4. Players manage scorecards and time. | 5. Coach observes only.',
  '{"doing_well": "Warm-up is purposeful, not casual.", "working_on": "Score is called clearly before each point.", "current_focus": "Time between points is consistent.", "next_step": "Run the format without coach present."}'::jsonb,
  'Coach acts as line judge; first to 4 instead of best of 3 sets.',
  'Add a 10-point tiebreak in lieu of third set; introduce changeover protocol.',
  'Player completes the format end-to-end with correct scoring and timing.',
  35,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE3_TEC_029',
  NULL,
  'First Serve Plus First Strike',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Technical',
  'Focus',
  'Link the serve directly to a first-strike forehand.',
  'Three-quarter court, orange ball, server with bucket of balls.',
  '1. Server hits a flat first serve to deuce side. | 2. Coach hand-feeds the return (or live partner returns crosscourt). | 3. Server''s third shot is forehand inside-out or down-the-line. | 4. 10 reps deuce, 10 reps ad. | 5. Track which combination produced the cleanest pattern.',
  '{"doing_well": "Server steps in for the third ball — not waiting deep.", "working_on": "Same swing on the third ball as on a baseline forehand.", "current_focus": "Decision tree is pre-loaded.", "next_step": "Add a fourth-ball pattern."}'::jsonb,
  'Coach hand-feeds at slow pace; reduce to 5 reps each side.',
  'Live opponent who can defend or counter-attack; introduce 1+3+5 pattern.',
  'Player executes serve + first-strike pattern cleanly on 6 of 10 reps each side.',
  12,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE3_MOV_030',
  NULL,
  'Cross-Step Recovery Wide Forehand',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Movement',
  'Train',
  'Add cross-step recovery technique to wide-ball patterns.',
  'Three-quarter court, orange ball, coach feeds wide.',
  '1. Coach feeds wide to forehand. | 2. Player hits crosscourt; immediately cross-steps to recover toward bisector. | 3. Coach feeds second ball into the now-open backhand zone. | 4. Player must reach and hit. | 5. 8 reps; track recoveries that allow the second ball to be played in court.',
  '{"doing_well": "Cross-step is one explosive step, not a shuffle.", "working_on": "Trail leg leads the recovery direction.", "current_focus": "Stay low through the cross-step.", "next_step": "Combine cross-step recovery with split-step on opponent contact."}'::jsonb,
  'Slower second ball; closer recovery target; reduce to 4 reps.',
  'Three-ball sequence wide-wide-middle; introduce open-stance forehand on the wide ball.',
  'Player recovers and plays the second ball cleanly in 5 of 8 reps.',
  10,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE3_MEN_031',
  NULL,
  'Match-Day Routine Map',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Mentality',
  'Warm-Up',
  'Standardize the pre-match routine — arrival, warm-up, match-prep cues.',
  'Pre-match context. Player has a printed or app-based routine card.',
  '1. Player follows a fixed 30-min pre-match routine. | 2. Routine includes hydration, dynamic warm-up, hitting warm-up, mental cue, equipment check. | 3. Coach observes adherence. | 4. Player rates routine effectiveness post-match. | 5. Routine is iterated across 3-5 matches.',
  '{"doing_well": "Routine is followed in order.", "working_on": "Same routine on travel match as home match.", "current_focus": "Mental cue activated as last step.", "next_step": "Player owns the iteration after match 5."}'::jsonb,
  'Reduce to 4-step routine; coach prompts each step.',
  'Player runs the routine without coach; introduces self-rating; designs travel-day variant.',
  'Player completes the routine pre-match without prompts on 3 separate matches.',
  30,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN1_TEC_032',
  NULL,
  'Crosscourt Heavy Topspin Rally',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Technical',
  'Focus',
  'Sustained crosscourt rally with topspin emerging as a deliberate shape.',
  'Full court, green ball, two players in deuce-deuce diagonal.',
  '1. Players rally crosscourt forehand only. | 2. Goal: 10-shot rally with visible topspin shape. | 3. Reset on every break. | 4. After 5 minutes switch to crosscourt backhand. | 5. Track best run on each wing.',
  '{"doing_well": "Players hold the diagonal even on shorter balls.", "working_on": "Brush up the back of the ball, not flatten across.", "current_focus": "Same height of clearance every shot.", "next_step": "Add a 30%-pace and 80%-pace variation on coach call."}'::jsonb,
  'Reduce target to 6; allow flatter shape; closer rally distance.',
  'Add depth target — must land beyond service line; introduce a heavy ball every 3rd shot.',
  'Player sustains a 10-shot crosscourt rally with topspin shape on each wing.',
  15,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN1_TEC_033',
  NULL,
  'Down-the-Line Change with Recovery',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Technical',
  'Focus',
  'Direction change down the line followed by recovery to defend the crosscourt return.',
  'Full court, green ball, two players.',
  '1. A and B rally crosscourt forehand. | 2. On rally count 4, A changes direction down the line. | 3. B replies crosscourt to A''s backhand. | 4. A defends the backhand reply, neutralizes back to a crosscourt rally. | 5. 6 sequences each side, debrief which direction changes worked.',
  '{"doing_well": "Direction change is on a clean, controllable ball.", "working_on": "Recovery starts on the strike, not after.", "current_focus": "Backhand neutralizing shot — high net clearance, deep crosscourt.", "next_step": "A initiates direction change on a self-call without coach trigger."}'::jsonb,
  'Coach calls ''change'' verbally; static crosscourt before change; reduce sequences.',
  'B can attack the down-the-line change; chain into a 6-shot pattern with a second change.',
  'Player executes change + recovery + neutralizing shot cleanly in 4 of 6 sequences.',
  15,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN1_TAC_034',
  NULL,
  'Five-Shot Pattern — Plus Two',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Tactical',
  'Focus',
  'Build the pattern beyond first-strike to a deliberate second strike.',
  'Full court, green ball, two players.',
  '1. Server hits serve to deuce wide. | 2. Returner returns crosscourt. | 3. Server plays first-strike forehand crosscourt heavy. | 4. Returner replies (live). | 5. Server''s fifth ball: redirect down the line OR finish short angle. | 6. 8 patterns each side.',
  '{"doing_well": "Pattern is decided through first 3 shots, finish is reactive.", "working_on": "First-strike is a setup, not the kill.", "current_focus": "Recognize finish opportunity on the fifth ball.", "next_step": "Add a sixth-ball recovery and contingency."}'::jsonb,
  'Coach hand-feeds the return; reduce to 4 patterns; finish is fixed (no choice).',
  'Live return from B; B can attack the first-strike; introduce 7-shot pattern.',
  'Player executes 5-shot pattern with appropriate fifth-ball decision in 5 of 8 attempts.',
  18,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN1_TEC_035',
  NULL,
  'Volley Block Series',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Technical',
  'Train',
  'Build basic volley contact at net.',
  'Full court, green ball, coach feeds.',
  '1. Player at service line, racquet up. | 2. Coach feeds 10 forehand volleys, then 10 backhand. | 3. Player blocks with short, firm contact — no swing. | 4. Reps 11-20: alternate wings. | 5. Reps 21-30: live coach drives requiring step-in.',
  '{"doing_well": "Player meets the ball in front, not beside.", "working_on": "Strings face the target throughout.", "current_focus": "No follow-through — block, don''t punch.", "next_step": "Add a moving step into each volley."}'::jsonb,
  'Slower feed; closer to net; fewer reps per wing.',
  'Faster feeds; live partner driving; introduce drop-volley.',
  'Player blocks 7 of 10 volleys cleanly into court on each wing.',
  12,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN1_COM_036',
  NULL,
  'Tiebreak Set Format',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Competition',
  'Game',
  'Introduce the standard tiebreak format and changeover discipline.',
  'Full court, green ball, two players.',
  '1. Best of 1 short set (first to 4 games), tiebreak at 3-3. | 2. Standard 7-point tiebreak with side-changes every 6 points. | 3. Players manage their own scoring. | 4. Coach watches without intervening. | 5. Debrief tiebreak management specifically.',
  '{"doing_well": "Player keeps tempo through pressure points.", "working_on": "Same routine at 5-5 as at 0-0.", "current_focus": "Side-change is a reset opportunity.", "next_step": "Track first-strike percentage in tiebreak vs in regular games."}'::jsonb,
  'Reduce to first-to-5 tiebreak; coach offers tactical reminder at side-change.',
  'Add a Champions-Tiebreak (first to 10) variant; introduce match-tiebreak at 1-1 sets.',
  'Player completes a tiebreak with correct score-keeping and changeovers.',
  20,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN1_MOV_037',
  NULL,
  'Closed-to-Open Stance Recovery',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Movement',
  'Train',
  'Build the open-stance forehand recovery shape.',
  'Full court, green ball, coach feeds.',
  '1. Coach feeds wide forehand — player hits open stance. | 2. Player cross-steps with the back leg to recover. | 3. Coach feeds middle ball — player closes into a more neutral stance. | 4. Coach feeds wide again — open stance + cross-step. | 5. 12 alternations.',
  '{"doing_well": "Stance choice matches ball position.", "working_on": "Open stance is balanced, not collapsing back.", "current_focus": "Cross-step happens on the strike, not after.", "next_step": "Add a third stance variant — semi-open on a deeper ball."}'::jsonb,
  'Slower feed pace; eliminate one stance variant; reduce reps.',
  'Three-stance variation including running forehand; live opponent.',
  'Player executes correct stance match-up on 9 of 12 fed reps.',
  10,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN1_MEN_038',
  NULL,
  'Change of Score, Change of Plan',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Mentality',
  'Game',
  'Build score-aware tactical adjustment.',
  'Match-play context.',
  '1. Player and coach pre-game define 3 score-states: leading, tied, behind. | 2. For each state, player names one tactical priority (e.g., ''leading: serve big, hold lead'' / ''behind: extend rallies, force errors''). | 3. During match, coach asks at side-changes: ''What state are you in? What''s the priority?'' | 4. Post-match: review which state-priority pairings worked. | 5. Iterate the framework over 3 matches.',
  '{"doing_well": "Player names state-priority unprompted by mid-match.", "working_on": "Don''t change priority too quickly — a single bad point doesn''t shift state.", "current_focus": "Calm execution within a chosen state.", "next_step": "Introduce a fourth state — under threat (deuce on serve down)."}'::jsonb,
  'Reduce to 2 states (leading / behind); coach offers priorities.',
  'Add ''momentum shift'' state; player coaches a peer through their states.',
  'Player articulates current state and priority unprompted at 3 changeovers.',
  20,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN2_TAC_039',
  NULL,
  'Short-Ball Trigger Drill',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Focus',
  'Lock in the short-ball recognition + attack response.',
  'Full court, green ball, two players.',
  '1. B hits a short crosscourt to A. | 2. A must attack — either down-the-line drive or short-angle finish. | 3. B defends if possible. | 4. Reset every 6 shots. | 5. 8 short-ball triggers each side, track which option chosen.',
  '{"doing_well": "Player recognizes short ball at the bounce, not after.", "working_on": "Move forward through the ball — don''t wait on it.", "current_focus": "Two clean options pre-loaded — choose based on opponent position.", "next_step": "Add an approach-and-volley option as third choice."}'::jsonb,
  'Coach feeds the short ball; B is passive; reduce options to one (always down-the-line).',
  'Live rally where short ball can come at any time; introduce a counter-defense from B.',
  'Player attacks short ball with appropriate option in 6 of 8 triggers.',
  15,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN2_TEC_040',
  NULL,
  'Approach Shot to Volley Combination',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Technical',
  'Focus',
  'Link the approach shot with a finishing volley.',
  'Full court, green ball, coach feeds.',
  '1. Coach feeds short ball mid-court. | 2. Player hits approach down-the-line, follows in. | 3. Coach feeds passing-shot reply. | 4. Player volleys for the finish. | 5. 10 sequences total.',
  '{"doing_well": "Approach shot has high net clearance + deep target.", "working_on": "First step in is on the strike, not after.", "current_focus": "Volley position is split-step on coach contact, not before.", "next_step": "Add a backhand approach variant."}'::jsonb,
  'Coach feeds slower passing shot; reduce sequences; static volley position.',
  'Live partner with full passing-shot options; introduce drop-volley finish.',
  'Player completes approach + volley sequence successfully on 6 of 10.',
  14,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN2_TAC_041',
  NULL,
  'Endgame Pattern Recognition',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Focus',
  'Build awareness of endgame zones — short angle, drop, lob, line — as finishing tools.',
  'Full court, green ball, two players.',
  '1. Players rally; whichever player draws the opponent inside the baseline must use an endgame option. | 2. Endgame options: short angle, drop shot, lob over a closing opponent, line winner. | 3. 10 rallies, track which endgame was used and the result. | 4. Debrief — which option matched which opponent position.',
  '{"doing_well": "Endgame is chosen, not stumbled into.", "working_on": "Endgame option is consistent with opponent''s defensive position.", "current_focus": "Same execution shape regardless of which endgame chosen.", "next_step": "Introduce ''endgame-into-recovery'' for opponents who get the ball back."}'::jsonb,
  'Coach calls endgame option pre-rally; reduce options to 2.',
  'Player must use a different endgame each of 4 consecutive rallies; introduce endgame failure recovery.',
  'Player chooses appropriate endgame and executes on 6 of 10.',
  15,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN2_TEC_042',
  NULL,
  'Second Serve Kick or Slice',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Technical',
  'Focus',
  'Introduce kick or slice variation on the second serve.',
  'Full court, green ball, server bucket.',
  '1. Server hits 10 second serves with kick (topspin) shape. | 2. Then 10 with slice shape. | 3. Then 20 alternating, server''s choice based on pre-call zone. | 4. Returner can stay or attack. | 5. Track first-serve-style returners'' adjustment to the variation.',
  '{"doing_well": "Visible difference in shape between the two variants.", "working_on": "Same pre-toss routine for both.", "current_focus": "Net clearance is consistent — variation is on the bounce, not the trajectory.", "next_step": "Add the variant choice based on returner position."}'::jsonb,
  'Coach demonstrates each variant; reduce to one variant per session; closer service line.',
  'Add a third variant (flat second); introduce serve-plus-one based on which variant was used.',
  'Player executes both kick and slice variants with visible difference in shape on 6 of 10 each.',
  15,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN2_COM_043',
  NULL,
  'Three-Set Match Format',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Competition',
  'Game',
  'Full three-set match with no-ad scoring.',
  'Full court, green ball, two players.',
  '1. Best of 3 short sets (first to 4 games each), tiebreak at 3-3. | 2. No-ad scoring. | 3. Standard side-change protocol. | 4. Coach watches only. | 5. Post-match: 5-minute structured debrief.',
  '{"doing_well": "Player manages tempo across sets.", "working_on": "Same routine at 0-0 set 3 as at 0-0 set 1.", "current_focus": "Set transitions are reset opportunities.", "next_step": "Track set-by-set first-strike percentage."}'::jsonb,
  'Reduce to best of 3 with first-to-3; coach allows mid-match coaching.',
  'Full ad scoring; introduce match-tiebreak at 1-1 sets; add changeover stat tracking.',
  'Player completes three-set match with stable behavior and one self-named tactical insight.',
  60,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN2_MOV_044',
  NULL,
  'Bisector Recovery on Direction Change',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Movement',
  'Train',
  'Apply bisector recovery specifically to direction-change patterns.',
  'Full court, green ball, two players.',
  '1. A and B rally crosscourt; A changes down the line on rally count 4. | 2. A''s recovery is to the new bisector — closer to the line side, not back to center. | 3. B plays the next ball. | 4. A neutralizes with a high crosscourt. | 5. 8 sequences, coach scores recovery position.',
  '{"doing_well": "Recovery shifts toward the line after the change.", "working_on": "Bisector is calculated from the new opponent angles, not the old.", "current_focus": "Stay engaged through the recovery — no glide.", "next_step": "Bisector recovery on a 2-shot direction-change combo."}'::jsonb,
  'Static crosscourt before change; coach calls ''change'' verbally; reduce sequences.',
  'Live attack from B; introduce 2-change pattern with two bisector recoveries.',
  'Player recovers to new bisector cleanly in 5 of 8 sequences.',
  12,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN2_MEN_045',
  NULL,
  'Body-Language Audit',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Game',
  'Make body language a tracked, coachable variable.',
  'Match-play context. Coach has video or observation rubric.',
  '1. Pre-match: define 3 body-language indicators — shoulders, walk between points, racquet handling. | 2. Coach scores each on 1-3 scale per game. | 3. Mid-match: player rates own body language. | 4. Post-match: compare coach vs self ratings, watch sample video clips. | 5. Identify one body-language goal for next match.',
  '{"doing_well": "Body language is consistent regardless of score.", "working_on": "Walk between points is forward, head up.", "current_focus": "Racquet handling — never thrown, never dragged.", "next_step": "Choose one body-language cue to drive next match."}'::jsonb,
  'Reduce to 1 indicator; coach gives mid-match cue.',
  'Add a fourth indicator (breathing); player audits a peer''s body language.',
  'Coach and self ratings align on 7 of 9 game-by-indicator scores.',
  30,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN3_TAC_046',
  NULL,
  'Personal Style Pattern Library',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Tactical',
  'Focus',
  'Identify and rehearse the player''s preferred 3 patterns.',
  'Full court, green or yellow ball, two players.',
  '1. Player and coach review last 3 matches and identify 3 winning patterns. | 2. Each pattern is rehearsed live for 8 reps. | 3. Player names the trigger condition for each pattern. | 4. Match-play context: player must use each pattern at least once per set. | 5. Post-session: player updates personal pattern library.',
  '{"doing_well": "Pattern triggers are observable cues, not vague feelings.", "working_on": "Pattern execution is the same in rehearsal as in match.", "current_focus": "Default pattern when uncertain.", "next_step": "Identify a counter-pattern for when opponent disrupts."}'::jsonb,
  'Reduce to 1 pattern; coach proposes from observation.',
  'Player builds 5-pattern library; introduces a contingency for each.',
  'Player names 3 personal patterns with triggers and uses each in match.',
  30,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN3_TEC_047',
  NULL,
  'Backhand Down-the-Line Setup',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Technical',
  'Focus',
  'Build the backhand down-the-line as a finishing pattern.',
  'Full court, green or yellow ball, coach feeds.',
  '1. Coach feeds short crosscourt to backhand. | 2. Player hits backhand down-the-line. | 3. Coach feeds passing-shot reply or no reply. | 4. Player volleys finish if at net, baseline finish otherwise. | 5. 12 sequences. | 6. Live phase: B can defend.',
  '{"doing_well": "Player commits to the line shot — no last-second redirect.", "working_on": "Same swing path on backhand DTL as on backhand crosscourt.", "current_focus": "Recovery shifts toward the line after the strike.", "next_step": "Add inside-out backhand from the deuce corner."}'::jsonb,
  'Coach feeds to backhand with extra time; static finish; reduce sequences.',
  'Live rally where short backhand can come at any moment; introduce backhand DTL into approach.',
  'Player executes backhand DTL into target zone on 7 of 12 fed reps.',
  14,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN3_COM_048',
  NULL,
  'Multi-Day Tournament Simulation',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Competition',
  'Game',
  'Simulate a 3-day tournament with travel + match + recovery cycle.',
  'Full court, green ball, 4-8 players. Multi-session over consecutive days.',
  '1. Day 1: round-robin pool play (3 matches). | 2. Day 2: knockout based on Day 1 results. | 3. Day 3: finals + consolation matches. | 4. Each day includes pre-match warm-up, match, recovery protocol. | 5. Post-tournament: review match-by-match performance arc.',
  '{"doing_well": "Recovery between matches is treated as performance.", "working_on": "Same warm-up quality on Day 3 as Day 1.", "current_focus": "Restart routine doesn''t degrade with fatigue.", "next_step": "Track sleep + nutrition + match outcomes across the 3 days."}'::jsonb,
  'Reduce to 2-day format; allow longer breaks; coach gives mid-tournament feedback.',
  'Add a 4th day; introduce match scouting between days; player runs own warm-up.',
  'Player completes 3-day arc with stable performance and one cross-day insight.',
  180,
  4,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN3_TAC_049',
  NULL,
  'Opponent Pattern Recognition',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Tactical',
  'Train',
  'Build the habit of identifying opponent patterns within a match.',
  'Match-play context with a peer or in scrimmage.',
  '1. Pre-match: player commits to identifying 2 opponent patterns by end of set 1. | 2. At set 1 end, player names the patterns observed. | 3. Set 2: player tactically counters the identified patterns. | 4. Post-match: review whether counter-tactics were effective. | 5. Iterate over 3-5 matches.',
  '{"doing_well": "Patterns are specific (e.g., ''opponent always slices second backhand'') not generic.", "working_on": "Counter-tactic is a single change, not a full overhaul.", "current_focus": "Don''t abandon counter-tactic too quickly.", "next_step": "Identify 3 patterns in set 1; counter top 1."}'::jsonb,
  'Coach helps identify patterns at set 1 end; reduce to 1 pattern.',
  'Player must identify 3 patterns + 1 tendency; introduce in-match adjustment between games.',
  'Player names 2 specific opponent patterns and applies counter-tactic in set 2.',
  45,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN3_MEN_050',
  NULL,
  'Pressure-Point Routine',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Mentality',
  'Game',
  'Standardize behavior at break-points, set-points, and match-points.',
  'Match-play context.',
  '1. Player pre-defines a pressure-point routine — slower walk, deeper breath, cue word. | 2. Coach tracks routine adherence at each pressure point. | 3. Player rates own routine post-match. | 4. Identify drift points — where pressure breaks the routine. | 5. Iterate over 3 matches.',
  '{"doing_well": "Same routine at 30-40 as at 0-15.", "working_on": "Don''t shorten routine after consecutive saved break points.", "current_focus": "Cue word is the trigger, not the score.", "next_step": "Routine becomes automatic — no conscious adherence needed."}'::jsonb,
  'Reduce routine to 2 elements; coach gives a verbal cue at each pressure point.',
  'Player coaches a peer through their pressure-point routine; introduces routine for converting break.',
  'Routine adhered to at 8 of 10 pressure points across a match.',
  30,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW1_TEC_051',
  NULL,
  'Standard Ball Adaptation Rally',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Technical',
  'Focus',
  'Adapt stroke production to standard yellow ball pace and bounce.',
  'Full court, yellow ball, two players.',
  '1. Cooperative crosscourt rally — count contacts. | 2. Goal: 15 shots in a row both wings. | 3. Reset on every break. | 4. After 8 minutes, switch to crosscourt backhand. | 5. Track best run.',
  '{"doing_well": "Players adjust contact point higher to match yellow-ball bounce.", "working_on": "Don''t shorten the swing for the bigger bounce — meet it cleanly.", "current_focus": "Same shape, deeper depth.", "next_step": "Add a depth target — beyond service line on every shot."}'::jsonb,
  'Use a slower yellow-ball variant; closer rally distance; reduce target to 8.',
  'Add depth target; introduce neutralizing high ball every 4th shot; live opponent attack.',
  'Player sustains 15-shot crosscourt rally on each wing.',
  20,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW1_TEC_052',
  NULL,
  'Heavy Ball vs Flat Ball Calibration',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Technical',
  'Train',
  'Build the ability to shape the ball deliberately heavy or flat.',
  'Full court, yellow ball, coach feeds + live player.',
  '1. Coach calls ''heavy'' or ''flat'' before each fed ball. | 2. Player executes accordingly. | 3. 20 fed reps, mixed. | 4. Then live rally where coach calls the shape mid-rally. | 5. Track which shape is more reliable under pressure.',
  '{"doing_well": "Visible shape difference between heavy and flat.", "working_on": "Same swing speed, different brush.", "current_focus": "Heavy ball = high net clearance + deep landing.", "next_step": "Player chooses shape based on opponent court position."}'::jsonb,
  'Reduce to one shape per drill; coach demonstrates each; static feed.',
  'Add a third option (flat-but-deep); player must signal shape choice before contact.',
  'Player executes called shape correctly on 14 of 20 reps.',
  15,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW1_TAC_053',
  NULL,
  'Serve Plus One Plus Recovery',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Tactical',
  'Focus',
  'Standard serve-plus-one pattern with structured recovery to bisector.',
  'Full court, yellow ball, server bucket + live partner.',
  '1. Server hits first serve to a target zone. | 2. Returner returns. | 3. Server''s third ball is a forehand inside-out OR down-the-line. | 4. Server recovers to new bisector. | 5. Live continues. | 6. 8 patterns each side.',
  '{"doing_well": "Recovery is initiated on the strike, complete by the time returner replies.", "working_on": "Same plus-one shape regardless of return depth.", "current_focus": "Bisector after a redirect shifts toward the line side.", "next_step": "Add a contingency pattern when returner attacks the plus-one."}'::jsonb,
  'Coach hand-feeds the return; reduce to 4 patterns; static recovery.',
  'Live counter-attack from B; chain into 5-shot or 7-shot pattern.',
  'Player executes serve-plus-one + bisector recovery in 6 of 8 attempts.',
  18,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW1_COM_054',
  NULL,
  'Yellow-Ball Tournament',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Competition',
  'Game',
  'First sanctioned yellow-ball tournament simulation.',
  'Full court, yellow ball, official tournament format.',
  '1. Best of 3 sets, ad scoring, full set length (6 games + 2-game lead). | 2. 10-min warm-up. | 3. Match-tiebreak at 1-1 sets. | 4. Players manage scoring + timing. | 5. Coach as silent observer.',
  '{"doing_well": "Player adapts to the longer ad-scoring format.", "working_on": "Same level of focus at 5-5 as at 0-0.", "current_focus": "Pressure points handled with routine.", "next_step": "Track set-by-set tactical adjustments."}'::jsonb,
  'Reduce to short sets; allow no-ad scoring on selected games.',
  'Full ad scoring full match; introduce 5-set format option.',
  'Player completes a yellow-ball match end-to-end with stable scoring discipline.',
  90,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW1_MOV_055',
  NULL,
  'Tennis-Specific Footwork Ladder',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Movement',
  'Warm-Up',
  'Build tennis-specific footwork patterns through ladder work.',
  'Agility ladder, racquet held throughout.',
  '1. Two-foot in / two-foot out down the ladder. | 2. Lateral cross-step. | 3. Split-step at each rung. | 4. Add a fed ball at the end of the ladder. | 5. 6 patterns total, each x2.',
  '{"doing_well": "Foot quickness without racquet drop.", "working_on": "Stay tall through the ladder, not crouched.", "current_focus": "Last step before the fed ball is a split.", "next_step": "Add direction-change at the midpoint of the ladder."}'::jsonb,
  'Reduce patterns to 3; remove racquet for first round.',
  'Add a back-pedal pattern; introduce two-ladder agility chain.',
  'Player executes 5 of 6 patterns cleanly with racquet held.',
  10,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW1_FIT_056',
  NULL,
  'Tennis-Specific Power Output',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Fitness',
  'Train',
  'Develop on-court power output through tennis-specific movement.',
  'Court space, medicine ball, tennis racquet.',
  '1. Med-ball rotational throws — 3x8 each side. | 2. Box jumps — 3x6. | 3. Lateral bounds — 3x6 each side. | 4. Combine: med-ball rotation into a sprint to net + simulated volley. | 5. 4 rounds.',
  '{"doing_well": "Power output is consistent across rounds.", "working_on": "Quality over quantity — no breakdown of form.", "current_focus": "Sequence the chain — legs to hips to shoulders.", "next_step": "Add a tennis-specific chain (recovery + first-strike)."}'::jsonb,
  'Reduce med-ball weight; reduce reps; eliminate box jumps.',
  'Increase med-ball weight; introduce time-pressure for sprint phase.',
  'Player completes 4 rounds with consistent power output and clean form.',
  20,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW1_MEN_057',
  NULL,
  'Match-Goal Hierarchy',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Mentality',
  'Warm-Up',
  'Build a 3-tier match-goal structure: process, pattern, outcome.',
  'Pre-match context.',
  '1. Player names 3 process goals (e.g., ''split-step every point''). | 2. Player names 2 pattern goals (e.g., ''use serve-plus-one in 80% of service points''). | 3. Player names 1 outcome goal (''win the match''). | 4. Player rates each tier post-match. | 5. Outcome goal is rated last and lowest weight.',
  '{"doing_well": "Process goals are observable and binary.", "working_on": "Pattern goals are tied to a measurable.", "current_focus": "Outcome doesn''t override process.", "next_step": "Player iterates the framework over 5 matches."}'::jsonb,
  'Reduce to 2 process + 1 outcome; coach proposes goals.',
  'Add 2 mentality goals; introduce week-level goal review.',
  'Player names goals at correct tier and rates each post-match.',
  10,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW2_TAC_058',
  NULL,
  'Single-Periodized Year Block Map',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Focus',
  'Build awareness of where the player is in their training-competition periodization.',
  'Off-court / on-court hybrid. Whiteboard or app input.',
  '1. Player and coach map the 12-month calendar into preparation, competition, transition phases. | 2. Identify peak tournament weeks. | 3. Identify high-volume training weeks. | 4. Player names what training emphasis matches each phase. | 5. Phase awareness is reviewed monthly.',
  '{"doing_well": "Player understands why volume varies.", "working_on": "Don''t peak-train in transition phase.", "current_focus": "Competition phase = sharpening, not building.", "next_step": "Player flags upcoming phase transition unprompted."}'::jsonb,
  'Coach builds the calendar; reduce to 6-month view.',
  'Player owns the calendar; introduces double-periodization variant.',
  'Player articulates current phase, next phase, and training emphasis appropriately.',
  30,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW2_TEC_059',
  NULL,
  'First-Strike Forehand Variations',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Technical',
  'Focus',
  'Build the forehand first-strike with multiple shape variations on demand.',
  'Full court, yellow ball, server + returner + coach.',
  '1. Server pattern: serve out wide, returner returns crosscourt. | 2. First-strike forehand options: a) heavy crosscourt b) flat crosscourt c) inside-out d) down-the-line. | 3. Coach calls option pre-rally. | 4. Server executes called option. | 5. 16 patterns total, 4 of each.',
  '{"doing_well": "Visible shape difference between heavy and flat.", "working_on": "Same setup regardless of called option.", "current_focus": "Recovery shifts based on chosen option.", "next_step": "Server chooses option based on returner''s return position."}'::jsonb,
  'Reduce to 2 options; static feed; coach demonstrates each.',
  'Player chooses option without call; introduce a contingency for when returner attacks.',
  'Player executes called first-strike option correctly in 12 of 16.',
  20,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW2_TAC_060',
  NULL,
  'Pattern Library Expansion to Five',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Focus',
  'Build out the personal pattern library to 5 patterns with explicit triggers.',
  'Full court, yellow ball, two players.',
  '1. Player and coach identify 5 patterns from match data. | 2. Each pattern is rehearsed live for 6 reps. | 3. Each pattern has a trigger condition specified. | 4. Match context: each pattern must be used at least once. | 5. Track effectiveness per pattern.',
  '{"doing_well": "Patterns are differentiated by trigger, not just shot direction.", "working_on": "Pattern execution is the same in rehearsal as in match.", "current_focus": "Default fallback pattern is the most reliable.", "next_step": "Add a ''when patterns aren''t working'' contingency."}'::jsonb,
  'Reduce library to 3; coach proposes from observation.',
  'Build to 7 patterns; introduce surface-specific variants.',
  'Player names 5 patterns with triggers and uses each in match context.',
  45,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW2_COM_061',
  NULL,
  '3:1 Win-Loss Match Structure',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Competition',
  'Game',
  'Schedule matches at appropriate competitive level for 3:1 wins-to-losses target.',
  'Match scheduling protocol over a 6-week block.',
  '1. Coach builds match schedule mixing peer-level, easier, and harder opponents. | 2. Target 3:1 wins-to-losses overall. | 3. Track results week by week. | 4. Adjust schedule if W:L drifts off target. | 5. Post-block: review pattern of opposition vs results.',
  '{"doing_well": "Schedule produces appropriate stretch.", "working_on": "Don''t avoid harder matches; don''t pad with easy.", "current_focus": "Each match is a learning unit, not just a result.", "next_step": "Player participates in scheduling decisions."}'::jsonb,
  'Coach manages schedule fully; reduce block to 4 weeks.',
  'Player co-builds schedule; introduce scouting layer for harder opponents.',
  'Block ends within 2.5:1 to 3.5:1 W:L window.',
  NULL,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW2_TEC_062',
  NULL,
  'Drop Shot Disguise',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Technical',
  'Train',
  'Build a drop shot that looks like a regular groundstroke.',
  'Full court, yellow ball, coach feeds.',
  '1. Coach feeds short ball. | 2. Player executes drop shot with same setup as a regular groundstroke. | 3. 10 fed drops. | 4. Live phase: B can defend. | 5. Track which drops were read by B.',
  '{"doing_well": "Setup is identical to a regular groundstroke until the last instant.", "working_on": "Soft hands at contact, not a chop.", "current_focus": "Net clearance is low, but bounce is short and dies.", "next_step": "Drop into a follow-up — anticipate B''s reply."}'::jsonb,
  'Coach feeds slower; reduce to 5 reps; static finish.',
  'Live opponent who anticipates; introduce drop-into-volley pattern.',
  'Player executes 6 of 10 drop shots that land short and aren''t read.',
  12,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW2_FIT_063',
  NULL,
  'Endurance Session — Tennis-Specific',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Fitness',
  'Train',
  'Build tennis-specific aerobic endurance through extended on-court work.',
  'Full court, yellow ball, coach feeds.',
  '1. 10-min continuous fed-ball drill — coach maintains feed pace, player rallies + recovers. | 2. 3-min active recovery. | 3. Repeat 4 rounds. | 4. Heart rate monitored. | 5. Last round: maintain quality despite fatigue.',
  '{"doing_well": "Quality holds through round 4.", "working_on": "Recovery breath, not chest breath.", "current_focus": "Same shape on shot at minute 9 as minute 1.", "next_step": "Add a competitive layer — score points across rounds."}'::jsonb,
  'Reduce rounds to 2; longer recovery; lighter feed pace.',
  '5 rounds; introduce reduced recovery; add post-session strength block.',
  'Player completes 4 rounds with shot quality above 70% baseline.',
  45,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW2_MEN_064',
  NULL,
  'Self-Talk Audit',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Game',
  'Build self-talk awareness and reframe.',
  'Match-play context with audio recording (if available) or post-match recall.',
  '1. Player notes self-talk after each lost point — written or recorded. | 2. Post-match: review patterns. | 3. Identify negative self-talk cues. | 4. Reframe each into a forward-looking process cue. | 5. Apply reframe in next match.',
  '{"doing_well": "Self-talk is observed without judgment.", "working_on": "Reframe is short and actionable.", "current_focus": "Forward-looking, not blame-based.", "next_step": "Player reframes in real time during match."}'::jsonb,
  'Coach records self-talk for player; reduce to 5 instances per match.',
  'Player coaches a peer through their self-talk audit; introduces between-points reframe.',
  'Player identifies 3 self-talk patterns and reframes each into process cue.',
  30,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW3_TAC_065',
  NULL,
  'Style-Variation Capacity',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Tactical',
  'Focus',
  'Build the ability to play 2 distinct styles depending on opponent.',
  'Full court, yellow ball, two opponents (or coach simulating).',
  '1. Player identifies primary style (e.g., aggressive baseliner) and counter-style (e.g., grinder). | 2. Set 1: play primary style. | 3. Set 2: play counter-style. | 4. Coach scores style adherence. | 5. Post-match: identify when each style worked best.',
  '{"doing_well": "Style switch is deliberate — not just defensive when losing.", "working_on": "Counter-style commits to all 4 game-state behaviors.", "current_focus": "Style choice tied to opponent profile, not own mood.", "next_step": "Mid-match style switch within the same opponent."}'::jsonb,
  'Reduce to 1 style; coach selects style for player.',
  'Add a 3rd style; introduce style-switch trigger condition.',
  'Player adheres to chosen style on 8 of 10 game segments.',
  60,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW3_COM_066',
  NULL,
  'National-Level Tournament Prep Block',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Competition',
  'Game',
  'Multi-week tournament prep with peaking protocol.',
  'Off-court + on-court + match scheduling. 4-6 week block.',
  '1. Week 1-2: high-volume training. | 2. Week 3: simulation matches at target intensity. | 3. Week 4: taper + sharpening. | 4. Week 5: tournament. | 5. Week 6: review + recovery.',
  '{"doing_well": "Player respects the taper.", "working_on": "Simulation matches at full intensity, not pacing.", "current_focus": "Tournament week is execution, not building.", "next_step": "Player owns one week of the protocol."}'::jsonb,
  'Reduce to 3-week block; coach manages all phases.',
  'Add scouting phase; introduce 8-week double-tournament prep.',
  'Player completes the block with peak-week match performance at planned level.',
  NULL,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW3_TEC_067',
  NULL,
  'Personal-Style Stroke Refinement',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Technical',
  'Focus',
  'Refine 2 personal-style strokes to a higher repeatable standard.',
  'Full court, yellow ball, coach + video analysis.',
  '1. Player identifies 2 strokes that anchor personal style. | 2. Video baseline established. | 3. 20 reps each, focused on 1-2 cue points per stroke. | 4. Re-video at end of session. | 5. Compare baseline to end-session.',
  '{"doing_well": "Stroke is recognizable as the player''s own.", "working_on": "Refinement does not erase signature.", "current_focus": "Cue points are observable in slow-mo.", "next_step": "Apply refined stroke in match context."}'::jsonb,
  'Reduce to 1 stroke; coach identifies cues; static feed.',
  'Add a third stroke; introduce live-context refinement.',
  'Visible improvement in stroke shape on video review.',
  30,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW3_MEN_068',
  NULL,
  'Performance Identity Statement',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Mentality',
  'Warm-Up',
  'Build a written performance identity that anchors competitive behavior.',
  'Off-court reflection. Written or app input.',
  '1. Player writes a 1-sentence statement: ''I am the kind of player who...''. | 2. Statement is referenced pre-match. | 3. Player rates statement-adherence post-match. | 4. Iterate the statement over 5-10 matches. | 5. Final form is anchored.',
  '{"doing_well": "Statement is specific and process-based.", "working_on": "Statement survives a tough loss without rewrite.", "current_focus": "Behavior matches the statement under pressure.", "next_step": "Statement guides choice in tactical moments."}'::jsonb,
  'Coach proposes draft statements; reduce iteration cycles.',
  'Player builds 3-statement identity (player / competitor / teammate).',
  'Statement is articulated and referenced across 5 matches.',
  20,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW3_TAC_069',
  NULL,
  'Set-Down Recovery Tactics',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Tactical',
  'Game',
  'Build tactical recovery patterns when down a set or break.',
  'Match-play context, simulated set-down scenarios.',
  '1. Set 1: simulate being down 3-5 in set 1 (start at that score). | 2. Player must execute a recovery game-plan. | 3. Coach scores recovery-tactic adherence. | 4. Run 4 simulations across the session. | 5. Identify which recovery tactic worked.',
  '{"doing_well": "Recovery tactic is committed to, not abandoned.", "working_on": "Don''t try too much — one or two adjustments.", "current_focus": "Same energy at 3-5 down as 0-0.", "next_step": "Recovery from set down (1-set deficit)."}'::jsonb,
  'Reduce to 4-4 deficit; coach pre-defines tactic.',
  'Match-tiebreak deficit recovery; introduce 0-2 sets recovery scenario.',
  'Player executes recovery tactic consistently in 3 of 4 simulations.',
  45,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP1_TEC_070',
  NULL,
  'Spin-Pace Mix Calibration',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Technical',
  'Focus',
  'Build calibrated spin-pace adjustments within a rally.',
  'Full court, yellow ball, two players + coach.',
  '1. Player rallies crosscourt — coach calls ''spin'', ''pace'', or ''mix'' every 4 shots. | 2. Player adjusts shape on the next ball. | 3. 30-shot rally minimum per call type. | 4. Track which adjustments held. | 5. Post-rally: name the cue point that triggered each.',
  '{"doing_well": "Visible adjustment within 1 shot of the call.", "working_on": "Adjustment is one variable at a time.", "current_focus": "Same recovery shape regardless of spin/pace choice.", "next_step": "Player self-calls based on opponent positioning."}'::jsonb,
  'Reduce calls to 1 type per rally; longer rally cycles.',
  'Player calls own adjustments based on rally state; introduce 4-variable matrix.',
  'Player executes called adjustment cleanly on 6 of 8 calls.',
  20,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP1_TAC_071',
  NULL,
  'Opponent-Modeling Pre-Match',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Tactical',
  'Warm-Up',
  'Build a structured opponent-modeling protocol before the match.',
  'Pre-match. Notebook or app input. Video of opponent if available.',
  '1. Player reviews opponent video / scouting notes. | 2. Identifies 3 opponent strengths, 3 weaknesses, 2 patterns. | 3. Builds 3-pattern game-plan against this opponent. | 4. Names primary tactic + 2 contingencies. | 5. Reviews game-plan post-match for accuracy.',
  '{"doing_well": "Game-plan is specific and actionable.", "working_on": "Don''t over-plan — 3 patterns is enough.", "current_focus": "Contingencies are pre-loaded, not invented mid-match.", "next_step": "Player builds plan without coach input."}'::jsonb,
  'Coach builds the plan; player executes; reduce to 1 pattern.',
  'Add a serve-pattern + return-pattern split; introduce surface-specific overlays.',
  'Player articulates a 3-pattern game-plan with named contingencies pre-match.',
  45,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP1_FIT_072',
  NULL,
  'Daily Tennis-Specific Strength Block',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Fitness',
  'Train',
  'Tennis-specific strength session integrated with on-court work.',
  'Gym + on-court space. Med ball, dumbbells, bands.',
  '1. Lower body: split squats 3x6, lateral lunges 3x6 each side. | 2. Rotational power: med-ball rotational throws 3x6 each side. | 3. Upper body pull: cable rows 3x8, band external rotations 3x10. | 4. Core: anti-rotation press 3x8 each side. | 5. Finish on-court: 5-min hitting block to reset movement pattern.',
  '{"doing_well": "Form holds across all sets.", "working_on": "Lateral movement pattern transfers to court.", "current_focus": "Anti-rotation core stabilizes serve and groundstrokes.", "next_step": "Add reactive component to lower-body work."}'::jsonb,
  'Reduce sets to 2; lighter loads; coach demonstrates each.',
  'Add plyometric layer; introduce single-leg variants; reduce rest.',
  'Player completes block with consistent form and integrates on-court reset.',
  60,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP1_COM_073',
  NULL,
  'International-Level Match Simulation',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Competition',
  'Game',
  'Match simulation under conditions matching international tournaments.',
  'Full court, yellow ball, two players + officials.',
  '1. Best of 3 sets, full ad scoring. | 2. Officials line-judge + chair. | 3. Pre-match warm-up with official rules. | 4. Player must adapt to officiating conditions. | 5. Post-match: tactical + behavioral debrief.',
  '{"doing_well": "Player engages officiating procedures appropriately.", "working_on": "Same focus regardless of officiating quality.", "current_focus": "Pace of play matches official tempo.", "next_step": "Player runs the warm-up sequence without coach input."}'::jsonb,
  'Reduce to short sets; coach acts as chair.',
  'Add post-match press-style debrief; introduce best-of-5 format.',
  'Player completes simulated match within official tempo and procedures.',
  120,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP1_MEN_074',
  NULL,
  'Daily Performance Review Habit',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Mentality',
  'Warm-Up',
  'Build a daily review habit that connects performance to next-day adjustments.',
  'Daily protocol. Notebook or app input.',
  '1. End of day: player rates session 1-10 across 4 axes (technical, tactical, mentality, energy). | 2. Names one win, one drift, one adjustment for tomorrow. | 3. Reviews previous day''s adjustment for follow-through. | 4. Weekly: pattern review across 7 days. | 5. Monthly: macro-review.',
  '{"doing_well": "Review is specific, not vague.", "working_on": "Adjustment is observable and binary.", "current_focus": "Yesterday''s adjustment shows up in today''s rating.", "next_step": "Player runs the review unprompted for 4 weeks."}'::jsonb,
  'Coach prompts at end of session; reduce to 2 axes.',
  'Add a peer-review layer; introduce video-based review.',
  'Daily review entries for 14 consecutive days with adjustment follow-through.',
  10,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP2_TEC_075',
  NULL,
  'Defense-to-Offense Transition',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Technical',
  'Focus',
  'Build the ability to flip from defense to offense within a single rally.',
  'Full court, yellow ball, coach + opponent.',
  '1. Player starts in defensive position (deep behind baseline, on the run). | 2. Hits 2 defensive shots. | 3. On the third ball, must transition to offense. | 4. Coach scores the transition shot for offensive intent. | 5. 8 sequences each side.',
  '{"doing_well": "Transition shot has visible commitment.", "working_on": "Don''t transition prematurely on a defensive ball.", "current_focus": "Body position shifts forward on the transition.", "next_step": "Add a 2-shot transition sequence."}'::jsonb,
  'Coach feeds the transition trigger; reduce sequences; static defense pattern.',
  'Live opponent who can re-defend; introduce transition-into-net pattern.',
  'Player executes clean defense-to-offense transition in 5 of 8 sequences.',
  20,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP2_TAC_076',
  NULL,
  'Double-Periodized Year Map',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Focus',
  'Build double-periodization awareness.',
  'Off-court calendar work.',
  '1. Player and coach map 12 months as two competition cycles. | 2. Each cycle has prep, compete, transition. | 3. Identify 2 peak weeks. | 4. Build training-volume curve. | 5. Monthly review of phase-adherence.',
  '{"doing_well": "Phase transitions are clean.", "working_on": "Don''t peak-train in transition phase.", "current_focus": "Cycle 2 is built on cycle 1''s gains.", "next_step": "Add a triple-periodization variant."}'::jsonb,
  'Coach owns the calendar; reduce to single peak per cycle.',
  'Player owns calendar; introduce surface-specific periodization.',
  'Player articulates current cycle, current phase, and next 4-week emphasis.',
  45,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP2_FIT_077',
  NULL,
  'Recovery Protocol Adherence',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Fitness',
  'Train',
  'Build recovery as a performance behavior, not a rest behavior.',
  'Off-court protocol. Sleep tracker, hydration log, foam roller, stretch routine.',
  '1. Daily protocol: sleep target, hydration target, post-session stretch, post-session nutrition. | 2. Weekly: 1 deload day, 1 active recovery day. | 3. Monthly: deeper recovery week within periodization. | 4. Tracking adherence in app. | 5. Pattern review monthly.',
  '{"doing_well": "Recovery is treated with same discipline as training.", "working_on": "Don''t skip protocol on travel days.", "current_focus": "Sleep is the foundation of all recovery.", "next_step": "Add HRV monitoring; adjust training load to readiness."}'::jsonb,
  'Reduce to 2 protocol items; coach reminds daily.',
  'Add HRV-based load auto-regulation; introduce nutrition specialist consultation.',
  'Protocol adherence at 80%+ for 28 consecutive days.',
  NULL,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP2_COM_078',
  NULL,
  'Tournament Travel Autonomy',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Competition',
  'Game',
  'Build full tournament-travel self-management.',
  'Multi-week travel block. Tournament calendar.',
  '1. Player owns logistics: travel, accommodation, on-site routines. | 2. Coach is available remotely but not on-site. | 3. Player runs pre-match warm-up + cool-down independently. | 4. Match strategy via remote check-in. | 5. Post-trip review + iterate.',
  '{"doing_well": "Player runs the trip without breakdown.", "working_on": "Same routine on travel match as home match.", "current_focus": "Recovery between matches is self-owned.", "next_step": "Player handles a multi-event swing."}'::jsonb,
  'Coach travels for first trip; reduce to single tournament.',
  'Multi-week swing with no coach contact; introduce trip-debrief presentation.',
  'Player completes a tournament trip with pre-match routine adherence and post-trip insights.',
  NULL,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP2_MEN_079',
  NULL,
  'Pressure-Match Visualization',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Warm-Up',
  'Build a structured pre-match visualization protocol.',
  'Pre-match quiet space. 10-minute window.',
  '1. Player runs 10-min visualization: warm-up, first game, pressure point, finish. | 2. Visualization includes physical sensations and emotional states. | 3. Player visualizes both winning and losing handles. | 4. Visualization ends with cue word + physical readiness. | 5. Post-match: rate alignment between visualization and reality.',
  '{"doing_well": "Visualization includes process detail, not just outcome.", "working_on": "Don''t over-script — leave room for adaptation.", "current_focus": "Visualizing how to handle a setback.", "next_step": "Player runs visualization without coach prompts."}'::jsonb,
  'Reduce to 5-min visualization with 2 scenes; coach guides.',
  'Add visualization for between-points reset; introduce post-match decompression visualization.',
  'Player completes a 10-min structured visualization pre-match across 5 matches.',
  10,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP3_TAC_080',
  NULL,
  'Performance-on-Demand Block',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Focus',
  'Build the capacity to execute under conditions that simulate professional pressure.',
  'Full court, yellow ball, multi-day block.',
  '1. Day 1: simulated press conference + match. | 2. Day 2: physical fatigue layer + match. | 3. Day 3: tactical-demand layer (specific game-plan, no improvisation). | 4. Day 4: emotional-demand layer (recovery from previous loss). | 5. Day 5: review + integrate.',
  '{"doing_well": "Player adapts to each demand layer.", "working_on": "Same baseline performance regardless of layer.", "current_focus": "Performance is process-anchored.", "next_step": "Add randomized demand layer; player can''t pre-plan."}'::jsonb,
  'Reduce to 3-day block; one demand layer per day.',
  'Add a 6th day with multi-layer demand; introduce media-pressure layer.',
  'Player completes 5-day block with stable performance baseline.',
  NULL,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP3_TEC_081',
  NULL,
  'Match-Pace Stroke Maintenance',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Technical',
  'Train',
  'Maintain stroke quality at full match pace under fatigue.',
  'Full court, yellow ball, coach feeds + opponent.',
  '1. Pre-fatigue baseline: 20 fed reps per stroke, video. | 2. 30-min high-intensity match-play. | 3. Post-fatigue: 20 fed reps per stroke, video. | 4. Compare pre/post. | 5. Identify which strokes degrade and what cue restores.',
  '{"doing_well": "Degradation under fatigue is small.", "working_on": "Cue restores stroke within 2-3 reps.", "current_focus": "Same shape is the goal — pace can drop.", "next_step": "Add a third measurement at peak fatigue."}'::jsonb,
  'Reduce match-play layer to 15 min; coach restores cue verbally.',
  'Add 3-point measurement (pre, mid, post); introduce stroke-cycle without coach cue.',
  'Stroke degradation under fatigue is within 15% of baseline on video metrics.',
  90,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP3_FIT_082',
  NULL,
  'Triple-Periodized Annual Plan',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Fitness',
  'Focus',
  'Build a triple-periodization annual plan with fitness layered to match.',
  'Off-court calendar work, multi-month.',
  '1. Identify 3 peak competition windows in the year. | 2. Build 3 cycles of prep + compete + transition. | 3. Layer strength, conditioning, recovery onto each cycle. | 4. Monthly fitness benchmarks aligned to phase. | 5. Annual review.',
  '{"doing_well": "Fitness peaks align with competition peaks.", "working_on": "Don''t strength-train heavy in peak compete week.", "current_focus": "Each cycle builds on the last.", "next_step": "Player owns the plan with coach review only."}'::jsonb,
  'Reduce to double-periodization plan as foundation.',
  'Add surface-specific overlay; introduce micro-cycle within each phase.',
  'Player articulates the full year plan with phase-specific fitness emphasis.',
  NULL,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP3_MEN_083',
  NULL,
  'Living-as-a-Pro Daily Log',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Train',
  'Build the daily-log discipline that mirrors professional practice.',
  'Daily protocol with weekly review.',
  '1. Morning: training intent for the day. | 2. Post-session: training review. | 3. Sleep, nutrition, hydration logs. | 4. Match-day: pre-match routine + post-match debrief. | 5. Weekly review with coach.',
  '{"doing_well": "Log is daily and complete.", "working_on": "Honest entry on bad days.", "current_focus": "Patterns over weeks become visible.", "next_step": "Player iterates the log structure based on insights."}'::jsonb,
  'Reduce to 3 fields per day; coach prompts daily.',
  'Add advanced metrics; introduce pattern analysis tooling.',
  'Daily log adherence at 90% over 8 consecutive weeks.',
  15,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP3_COM_084',
  NULL,
  'Pro-Format Tournament Block',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Competition',
  'Game',
  'Compete in tournaments at professional format and intensity.',
  'Multi-week tournament block.',
  '1. 4-6 week competition swing at appropriate professional level. | 2. Player owns logistics, prep, recovery. | 3. Match-by-match strategy build. | 4. Mid-swing review + adjustment. | 5. Post-swing integration into annual plan.',
  '{"doing_well": "Performance arc holds across weeks.", "working_on": "Travel + match recovery is consistent.", "current_focus": "Each match is a learning unit + a result.", "next_step": "Build to a longer swing or higher level."}'::jsonb,
  'Reduce to 3-week swing; coach travels.',
  'Extend swing; introduce double-week back-to-back tournament.',
  'Player completes the swing with stable performance and integrates lessons.',
  NULL,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_FIT_085',
  NULL,
  'Dynamic Warm-Up Sequence',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Fitness',
  'Warm-Up',
  'Standard pre-session dynamic warm-up that scales with stage.',
  'Court space, no equipment beyond racquet for advanced versions.',
  '1. Light jog 2 lines x 4. | 2. Hip openers (knee hugs, leg cradles, lateral lunges) x 6 each. | 3. Shoulder mobility (arm circles, scarecrows, T-Y-Ws) x 8. | 4. Skipping (A-skip, B-skip, lateral skip) x 2 lines. | 5. Sport-specific finish (split-step, mock swings, racquet flips). | 6. Final pulse-raiser: 2 short sprints.',
  '{"doing_well": "Player engages every movement, not just goes through motions.", "working_on": "Range of motion increases through the warm-up.", "current_focus": "Sport-specific finish primes the actual session.", "next_step": "Player runs warm-up unprompted."}'::jsonb,
  'Reduce to 3 movements; coach demonstrates alongside.',
  'Add reactive components; introduce surface-specific variants.',
  'Player completes warm-up with full range of motion and engagement.',
  10,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_FIT_086',
  NULL,
  'Cool-Down + Stretch Sequence',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Fitness',
  'Warm-Up',
  'Standard post-session cool-down (named Warm-Up in session block as a routine bookend).',
  'Court space, foam roller for advanced versions.',
  '1. Light walk + active recovery 3 min. | 2. Static stretches: hamstrings, hip flexors, quads, calves, shoulders, chest x 30s each. | 3. Foam roll lower body 5 min (HP only). | 4. Hydration + nutrition refuel. | 5. Quick session reflection.',
  '{"doing_well": "Cool-down is treated as performance, not afterthought.", "working_on": "Stretches held to full duration.", "current_focus": "Hydration + nutrition within 30 min post-session.", "next_step": "Add HRV check post-cool-down."}'::jsonb,
  'Reduce stretches to 4; coach guides duration.',
  'Add band stretches; introduce sport-massage component.',
  'Player completes full cool-down with appropriate duration on each element.',
  12,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_TEC_087',
  NULL,
  'Footwork Around the Ball',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Technical',
  'Warm-Up',
  'Build the habit of getting feet around the ball, not reaching for it.',
  'Half or full court, depending on stage. Coach feeds.',
  '1. Coach feeds slow ball wide. | 2. Player''s task is footwork only — get feet around the ball, then catch it (no swing). | 3. 8 reps each side. | 4. Then 8 reps with stroke + held finish. | 5. Then 8 reps live tempo.',
  '{"doing_well": "Foot positioning matches stroke type.", "working_on": "Last step is balanced and stable.", "current_focus": "Same foot pattern at all paces.", "next_step": "Add recovery footwork after the stroke."}'::jsonb,
  'Static feed; reduce reps; allow two-handed catch on the no-swing version.',
  'Higher feed pace; introduce surprise direction; combine with recovery footwork.',
  'Player executes correct footwork pattern on 7 of 8 reps each side.',
  12,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_TAC_088',
  NULL,
  'Court Mapping Verbal Drill',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Warm-Up',
  'Reinforce court-mapping vocabulary through naming.',
  'Court space. No equipment.',
  '1. Coach calls a court-mapping zone (middle, crosscourt, short angle, line, transition, endgame). | 2. Player runs to the zone and assumes the appropriate position. | 3. 12 zone calls. | 4. Then with racquet — player mock-strikes from the called zone. | 5. Then with fed ball at the zone.',
  '{"doing_well": "Player names the zone correctly each call.", "working_on": "Position matches the zone''s tactical purpose.", "current_focus": "Vocabulary is automatic.", "next_step": "Player calls own zones based on rally context."}'::jsonb,
  'Reduce zones to 3 (middle, crosscourt, line); coach names with hand signal.',
  'Add zone combinations; introduce zone-prediction based on opponent position.',
  'Player executes correct position and naming on 10 of 12 calls.',
  8,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_MEN_089',
  NULL,
  'One-Word Cue Selection',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Warm-Up',
  'Build a personal one-word cue for activation.',
  'Pre-session or pre-match.',
  '1. Player names 5 candidate cue words. | 2. Tests each across 1 session each. | 3. Notes which felt most activating. | 4. Selects 1 primary + 1 backup. | 5. Cues are referenced pre-match and at pressure points.',
  '{"doing_well": "Cue is short, specific, and personal.", "working_on": "Cue activates physical readiness.", "current_focus": "Same cue across multiple matches.", "next_step": "Cue becomes automatic — referenced without conscious recall."}'::jsonb,
  'Coach proposes 3 candidate cues; reduce testing window.',
  'Player builds 3-cue sequence (pre-match, pre-point, pressure-point).',
  'Player names primary + backup cue and uses each across 3 matches.',
  10,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_COM_090',
  NULL,
  'Self-Reffed Practice Match',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Competition',
  'Game',
  'Standard self-reffed practice match — most reusable format.',
  'Appropriate court for stage, appropriate ball.',
  '1. Players agree on format pre-match. | 2. Self-officiate lines, calls, scoring. | 3. Coach observes only. | 4. Best of stage-appropriate format. | 5. Post-match debrief.',
  '{"doing_well": "Self-officiating is honest and decisive.", "working_on": "Same standard across the match.", "current_focus": "Restart routine between points.", "next_step": "Add a stat focus for the match."}'::jsonb,
  'Coach acts as silent line judge; reduce to short format.',
  'Add a designated tactical focus; introduce stat tracking.',
  'Player completes the match with stable scoring discipline.',
  45,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_TEC_091',
  NULL,
  'Two-Cone Target Game',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Technical',
  'Train',
  'Cooperative target accuracy game scalable across stages.',
  'Court space appropriate to stage. Two cones marking target zones.',
  '1. Coach places two cones in target zones (deuce + ad). | 2. Players rally cooperatively, trying to hit a cone. | 3. Hit a cone = 1 point shared. | 4. First to 5 cone-hits in 5 minutes. | 5. Move cones smaller / further as players succeed.',
  '{"doing_well": "Players celebrate cone-hits.", "working_on": "Same swing for cone target as for general rally.", "current_focus": "Visualize the cone before contact.", "next_step": "Reduce cone size; add a third cone."}'::jsonb,
  'Larger cones; closer cones; reduce target hits.',
  'Smaller targets; introduce moving cones; pace requirement on each shot.',
  'Players reach 5 cone-hits within 5 minutes.',
  8,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_TAC_092',
  NULL,
  'Three-Ball Pattern Build',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Train',
  'Generic 3-ball pattern build — scales across stages by changing pattern complexity.',
  'Appropriate court, two players.',
  '1. Coach defines a 3-ball pattern (e.g., crosscourt + crosscourt + line). | 2. Players rehearse 6 patterns. | 3. Then with live opponent who can disrupt. | 4. Track pattern completions vs disruptions. | 5. Switch pattern, repeat.',
  '{"doing_well": "Pattern is decided pre-rally.", "working_on": "Recovery between pattern shots is appropriate.", "current_focus": "Same execution at high pace as low.", "next_step": "Pattern execution under pressure."}'::jsonb,
  'Pattern is 2 balls; static feed; reduce reps.',
  'Pattern is 5 balls; add contingencies; introduce pattern-counter from opponent.',
  'Player completes pattern cleanly in 4 of 6 attempts.',
  12,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_MOV_093',
  NULL,
  'Recovery Habit Audit',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Movement',
  'Train',
  'Make recovery between shots a tracked habit.',
  'Match or rally context. Coach observes recovery position after each shot.',
  '1. Coach scores recovery position 1-3 after each shot in a 5-min rally block. | 2. Player gets running average. | 3. After block, coach shares scores. | 4. Player names what got in the way of recovery. | 5. Repeat with one focus point.',
  '{"doing_well": "Recovery happens, even on tough balls.", "working_on": "Recovery direction matches bisector.", "current_focus": "Recovery starts on the strike.", "next_step": "Recovery becomes automatic — no conscious focus needed."}'::jsonb,
  'Reduce block to 3 min; coach scores at end only.',
  'Add live-opponent tier; introduce recovery-stat tracking across multiple sessions.',
  'Recovery score average improves by 0.5 across consecutive sessions.',
  8,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_MEN_094',
  NULL,
  'Post-Match Three-Question Debrief',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Warm-Up',
  'Standardized post-match reflection to anchor learning.',
  'Post-match. 5-minute window.',
  '1. Player answers 3 questions: What went well? What didn''t? What''s one focus next? | 2. Coach probes each answer for specificity. | 3. Player commits to the next-focus in writing. | 4. Next session: open with the prior focus check. | 5. Track focus carry-over.',
  '{"doing_well": "Answers are specific and observable.", "working_on": "Don''t conflate result with process.", "current_focus": "Next-focus is one thing only.", "next_step": "Player runs the debrief unprompted."}'::jsonb,
  'Reduce to 1 question; coach proposes the next-focus.',
  'Add a fourth question (opponent insight); introduce video-based debrief.',
  'Player completes debrief with specific answers and follows next-focus into next session.',
  5,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_TEC_095',
  NULL,
  'Volume Hitting Block',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Technical',
  'Train',
  'Pure-volume technical practice — scales by ball type, depth target, and time.',
  'Full or 3/4 court, appropriate ball, coach feeds.',
  '1. 3 minutes continuous fed forehands. | 2. 3 minutes continuous fed backhands. | 3. 3 minutes alternating. | 4. 3 minutes player choice based on call. | 5. Track shot-quality across block.',
  '{"doing_well": "Quality holds through round 4.", "working_on": "Same shape regardless of fatigue.", "current_focus": "Last set has same depth as first.", "next_step": "Increase block to 4 rounds."}'::jsonb,
  'Reduce rounds to 2; longer rest; static feed pace.',
  '5 rounds; add live-opponent variant; introduce stat focus.',
  'Player completes 4 rounds with shot quality holding above 70%.',
  20,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_TAC_096',
  NULL,
  'Game-Style Recognition',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Train',
  'Build the ability to identify opponent game-style and adapt.',
  'Match or scrimmage context.',
  '1. Player observes opponent for 1 game. | 2. Names opponent style (aggressive baseliner, grinder, server, all-court). | 3. Names 2 patterns to use vs that style. | 4. Tests in next 2 games. | 5. Refines style call across the match.',
  '{"doing_well": "Style call is supported by observation.", "working_on": "Don''t lock in style call too early.", "current_focus": "Counter-pattern matches style choice.", "next_step": "Mid-match style update."}'::jsonb,
  'Reduce to 2 style options; coach proposes from observation.',
  'Add hybrid styles; introduce style-shift detection within match.',
  'Player names opponent style, picks counter-patterns, and adapts within match.',
  30,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE2_TEC_097',
  NULL,
  'Volley Punch Series',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Technical',
  'Train',
  'Build basic volley contact at the net with orange-ball bounce.',
  'Three-quarter court, orange ball, coach feeds from baseline.',
  '1. Player at service line. | 2. 10 forehand volleys, 10 backhand. | 3. Block with stable racquet face — no swing. | 4. After 20 reps, alternate wings. | 5. Final 10: live coach drives.',
  '{"doing_well": "Player meets the ball in front of body.", "working_on": "No swing — punch and stop.", "current_focus": "Strings face target.", "next_step": "Add a step-in to each volley."}'::jsonb,
  'Slower feed; closer to net; reduce reps.',
  'Faster feeds; live driving partner; introduce drop-volley.',
  'Player blocks 6 of 10 volleys cleanly into court each wing.',
  10,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE2_TEC_098',
  NULL,
  'Serve Toss Consistency',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Technical',
  'Focus',
  'Build a repeatable toss before adding the serve motion.',
  'Service line, orange ball, no-net version.',
  '1. Player tosses ball into the air. | 2. If toss lands within an arm-length forward target — counts. | 3. 20 tosses without racquet. | 4. Then 20 with racquet held but no swing. | 5. Then 20 with full motion if 15 tosses pass.',
  '{"doing_well": "Toss is repeatable and forward.", "working_on": "Toss arm extends fully before release.", "current_focus": "Same height every toss.", "next_step": "Add motion only when toss is consistent."}'::jsonb,
  'Larger target zone; reduce reps; coach demonstrates.',
  'Smaller target; introduce different serve types tossing differently.',
  'Player lands 15 of 20 tosses in target zone.',
  8,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE3_TEC_099',
  NULL,
  'Return of Serve Block',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Technical',
  'Focus',
  'Build the return-of-serve as a controlled block, not a swing.',
  'Three-quarter court, orange ball, server with bucket.',
  '1. Server hits 10 first serves to deuce. | 2. Returner blocks return crosscourt to a target zone. | 3. 10 returns to ad. | 4. Mix 10 random. | 5. Track returns in target.',
  '{"doing_well": "Block is firm, not soft.", "working_on": "Short backswing — meet the ball in front.", "current_focus": "Same block on first and second serve.", "next_step": "Step in on the second serve."}'::jsonb,
  'Slower serves; reduce target size; coach calls placement.',
  'Live serves at full pace; introduce return + first-strike.',
  'Player lands 6 of 10 returns in target each side.',
  12,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE3_TAC_100',
  NULL,
  'Doubles Positioning Basics',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Tactical',
  'Focus',
  'Introduce doubles court positioning and partner awareness.',
  'Full court, orange ball, 4 players.',
  '1. Server + net partner vs returner + net partner. | 2. Coach narrates positions during 4 fed points. | 3. Then 4 live points with coach pause-and-explain. | 4. Then 4 free play. | 5. Debrief positioning per point.',
  '{"doing_well": "Net partner moves with rally direction.", "working_on": "Don''t crowd partner''s space.", "current_focus": "Communicate after each point.", "next_step": "Switch to I-formation for serve."}'::jsonb,
  'Two-player doubles with simplified positioning; coach narrates each shot.',
  'Add poaching protocols; introduce signal system between partners.',
  'Players maintain correct positions in 6 of 8 live points.',
  20,
  4,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN1_TEC_101',
  NULL,
  'Half-Volley Pickup',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Technical',
  'Train',
  'Build the half-volley as a transition shot.',
  'Full court, green ball, coach feeds at player''s feet near service line.',
  '1. Coach feeds short balls landing near player''s feet. | 2. Player plays half-volley — hits the ball just after bounce. | 3. 10 fed reps. | 4. Then 10 reps with target zone deep crosscourt. | 5. Live phase: half-volley as a transition shot.',
  '{"doing_well": "Player meets the ball with stable racquet face.", "working_on": "Soft hands — absorb, don''t swing.", "current_focus": "Same setup whether forehand or backhand half-volley.", "next_step": "Half-volley followed by net approach."}'::jsonb,
  'Slower feed; static positioning; reduce reps.',
  'Live opponent variant; introduce half-volley + volley combo.',
  'Player executes 6 of 10 half-volleys cleanly into court.',
  10,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN1_TEC_102',
  NULL,
  'Lob Defense and Offense',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Technical',
  'Train',
  'Build the lob as both a defensive recovery and offensive option.',
  'Full court, green ball, coach feeds + opponent at net.',
  '1. Defensive lob: opponent at net, player deep — high lob to back of court. 8 reps. | 2. Offensive lob: opponent crowding net — flatter, deeper lob. 8 reps. | 3. Player chooses based on opponent position. 8 reps. | 4. Live phase. | 5. Track lob success.',
  '{"doing_well": "Lob choice matches opponent position.", "working_on": "Defensive lob clears generously; offensive lob hits the corner.", "current_focus": "Same setup until last second.", "next_step": "Lob into recovery + counter-strike."}'::jsonb,
  'Reduce to one lob type; static opponent position.',
  'Add a third lob (topspin lob); introduce opponent overhead defense.',
  'Player executes appropriate lob in 6 of 8 attempts.',
  12,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN1_TAC_103',
  NULL,
  'Serve and Volley Pattern',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Tactical',
  'Train',
  'Introduce the serve-and-volley pattern.',
  'Full court, green ball, server bucket + returner.',
  '1. Server hits first serve and rushes net. | 2. Returner returns. | 3. Server volleys for finish or sets up. | 4. 10 patterns each side. | 5. Track first volley quality.',
  '{"doing_well": "Server reaches the volley position before returner contact.", "working_on": "First volley is deep, not soft.", "current_focus": "Split-step on returner contact.", "next_step": "Add a put-away volley after the first."}'::jsonb,
  'Coach plays returns at slower pace; reduce reps; static volley target.',
  'Live returner with full options; introduce S+V on second serve.',
  'Player completes serve-and-volley pattern with controlled first volley in 5 of 10.',
  15,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN2_TEC_104',
  NULL,
  'Backhand Slice Approach',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Technical',
  'Focus',
  'Build the slice backhand as an approach shot to net.',
  'Full court, green ball, coach feeds short.',
  '1. Coach feeds short to backhand. | 2. Player hits slice backhand approach down the line. | 3. Player follows in to volley position. | 4. Coach feeds passing reply or no reply. | 5. 12 sequences.',
  '{"doing_well": "Slice approach has low bounce + deep target.", "working_on": "Player commits forward through the strike.", "current_focus": "Volley position is established before passing reply.", "next_step": "Add an inside-out forehand approach variant."}'::jsonb,
  'Slower passing reply; reduce reps; static approach target.',
  'Live opponent passing; introduce drop-volley off the slice approach.',
  'Player completes slice approach + volley in 7 of 12 sequences.',
  14,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN2_TAC_105',
  NULL,
  'Doubles Poach',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Focus',
  'Build the poach as a planned doubles tactic.',
  'Full court, green ball, 4 players.',
  '1. Net partner signals poach intent before serve. | 2. Server hits to predetermined zone. | 3. Net partner poaches the return. | 4. Server covers the open court. | 5. 12 poach attempts, track success.',
  '{"doing_well": "Signal precedes serve; coordination is clean.", "working_on": "Poach commits — no half-poach.", "current_focus": "Server''s coverage match the poach direction.", "next_step": "Introduce fake-poach + counter-poach."}'::jsonb,
  'Coach calls poach pre-serve; reduce attempts; predetermined return.',
  'Live returner with full options; introduce reverse-poach on weak service.',
  'Successful poach in 6 of 12 attempts with appropriate server coverage.',
  20,
  4,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN2_FIT_106',
  NULL,
  'On-Court Plyometric Block',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Fitness',
  'Train',
  'Tennis-specific plyometric work integrated with on-court movement.',
  'Court space, no equipment.',
  '1. Lateral bounds 2x6 each side. | 2. Squat jumps 2x8. | 3. Skater jumps 2x8 each side. | 4. Sport-finish: split-step + lateral bound + simulated stroke 2x6. | 5. Cool-down stretch.',
  '{"doing_well": "Power output consistent.", "working_on": "Soft landings — absorb the impact.", "current_focus": "Last set matches first set.", "next_step": "Add a reactive layer with cue."}'::jsonb,
  'Reduce sets to 1 of each; coach demonstrates form.',
  'Add reactive cue-based jumps; introduce single-leg variants.',
  'Player completes block with stable form across all sets.',
  20,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN3_TAC_107',
  NULL,
  'Return-Game Strategy',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Tactical',
  'Focus',
  'Build a return-game strategy with rotating tactics by score.',
  'Full court, green ball, two players, return focus.',
  '1. Pre-game: returner names 3 tactics (e.g., ''block deep crosscourt'', ''attack second serve'', ''return + first-strike''). | 2. Tactic by score: tactic A on 0-0, tactic B on 30-30, tactic C on break point. | 3. Play full return game. | 4. Repeat 4 games. | 5. Debrief which tactic worked at which score.',
  '{"doing_well": "Tactics are pre-defined and committed to.", "working_on": "Score-tactic mapping is clean.", "current_focus": "Don''t abandon tactic mid-point.", "next_step": "Build to 4-tactic rotation."}'::jsonb,
  'Reduce to 2 tactics; coach signals score-tactic mapping.',
  'Add opponent-style overlays to tactic choice; introduce return-game stat tracking.',
  'Player executes mapped tactic in 6 of 8 score-states.',
  30,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW1_TEC_108',
  NULL,
  'Big-First Serve Pace Work',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Technical',
  'Focus',
  'Build first-serve pace through targeted block work.',
  'Full court, yellow ball, server bucket, radar gun if available.',
  '1. Server hits 10 first serves at 60% effort to wide deuce. | 2. 10 at 80%. | 3. 10 at 100%. | 4. Track in-zone percentage at each effort level. | 5. Find the effort level that maximizes in-zone-with-pace.',
  '{"doing_well": "Pace increases visibly across effort levels.", "working_on": "Toss is consistent across efforts.", "current_focus": "80% effort produces 90% pace.", "next_step": "Sustain optimal effort level for full game."}'::jsonb,
  'Reduce to 5 reps per level; static target; allow longer rest.',
  'Add a fourth effort level; introduce serve-plus-one combos at each level.',
  'Player identifies optimal effort level with measured outcomes.',
  20,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW2_TEC_109',
  NULL,
  'Backhand Topspin Heavy',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Technical',
  'Focus',
  'Build heavy topspin on the two-handed backhand.',
  'Full court, yellow ball, coach feeds.',
  '1. Coach feeds high to backhand. | 2. Player hits heavy topspin crosscourt with high net clearance + heavy bounce. | 3. 12 fed reps. | 4. Then live rally — heavy topspin only on backhand. | 5. Track which generates heaviest bounce.',
  '{"doing_well": "Net clearance is high, bounce is heavy.", "working_on": "Brush up the back of the ball.", "current_focus": "Same swing speed, more spin.", "next_step": "Combine with a flat backhand for variation."}'::jsonb,
  'Slower feed; allow flatter shape; reduce reps.',
  'Add target zone deep + crosscourt; introduce surprise inside-in variant.',
  'Player executes 8 of 12 heavy backhands with visible spin shape.',
  12,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW2_TAC_110',
  NULL,
  'Surface Adaptation Block',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Focus',
  'Build tactical adjustments for surface differences.',
  'If multi-surface available — hard, clay, grass. Single surface session can use simulation.',
  '1. Player names surface and 2 tactical adjustments for it (e.g., ''clay: extend rallies, use slice approach''). | 2. Run 2 sets at that surface tactic. | 3. Switch surface if available; otherwise simulate. | 4. Compare outcomes. | 5. Build surface-tactic library.',
  '{"doing_well": "Tactics differ visibly by surface.", "working_on": "Same execution shape, different selection.", "current_focus": "Surface tactic doesn''t override fundamentals.", "next_step": "Include weather and altitude as adjustment factors."}'::jsonb,
  'Single surface; reduce to 1 tactic adjustment.',
  'Add weather; introduce indoor vs outdoor tactical maps.',
  'Player articulates and applies surface-specific tactics in 2 sets.',
  45,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW3_FIT_111',
  NULL,
  'Anaerobic Capacity Build',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Fitness',
  'Train',
  'Build anaerobic capacity through high-intensity tennis-specific intervals.',
  'Full court, yellow ball, coach feeds.',
  '1. 60s high-intensity rally fed by coach. | 2. 60s active recovery. | 3. Repeat 8 rounds. | 4. Heart rate target zone monitored. | 5. Track quality across rounds.',
  '{"doing_well": "Quality holds through round 6.", "working_on": "Recovery breath in active recovery.", "current_focus": "Same shot quality at minute 8 as minute 1.", "next_step": "Reduce rest to 45s."}'::jsonb,
  'Reduce rounds to 5; longer rest; lower feed pace.',
  'Reduce rest to 30s; introduce 10-round variant.',
  'Player completes 8 rounds with stable quality across rounds.',
  30,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP1_TAC_112',
  NULL,
  'Set-by-Set Tactical Adjustment',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Tactical',
  'Game',
  'Build the habit of set-level tactical adjustment within a match.',
  'Full match context.',
  '1. Set 1: play primary game-plan. | 2. Between sets: 90s analysis — what''s working, what''s not. | 3. Set 2: implement 1 tactical adjustment. | 4. Set 3 (if needed): refine adjustment. | 5. Post-match: review adjustment effectiveness.',
  '{"doing_well": "Adjustment is one variable, not a rebuild.", "working_on": "Between-set analysis is structured.", "current_focus": "Adjustment is committed for the full set.", "next_step": "Mid-set tactical pivot when adjustment isn''t working."}'::jsonb,
  'Coach helps with between-set analysis; reduce to 1 adjustment.',
  'Player runs analysis without prompts; introduce real-time micro-adjustments.',
  'Player executes deliberate set-level adjustment in 2 separate matches.',
  90,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP2_TEC_113',
  NULL,
  'Drop Shot at Pace',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Technical',
  'Focus',
  'Drop shot from baseline at full match pace.',
  'Full court, yellow ball, coach feeds + opponent.',
  '1. Coach feeds high pace to baseline. | 2. Player drops short — same setup as a regular groundstroke until last instant. | 3. 8 fed reps. | 4. Live phase with opponent. | 5. Track drops that aren''t read.',
  '{"doing_well": "Setup masks the drop.", "working_on": "Soft hands at contact under pace.", "current_focus": "Same recovery as a regular groundstroke after the drop.", "next_step": "Drop into follow-up with anticipated reply."}'::jsonb,
  'Reduce feed pace; allow longer setup; reduce reps.',
  'Live opponent who reads aggressively; introduce drop-to-volley combo.',
  'Player executes 5 of 8 drops at pace that aren''t read.',
  14,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP2_TAC_114',
  NULL,
  'Match-Within-Match Tactical Layers',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Game',
  'Build the awareness of tactical layers within a match.',
  'Full match context.',
  '1. Pre-match: identify 3 tactical layers (e.g., point structure / game pattern / set strategy). | 2. Player rates own adherence to each layer per set. | 3. Coach scores in parallel. | 4. Post-match: align ratings + identify gap areas. | 5. Iterate over 5 matches.',
  '{"doing_well": "Each layer is observable.", "working_on": "Layers don''t conflict — they nest.", "current_focus": "Set strategy frames game patterns frames points.", "next_step": "Add a fourth layer — match-arc strategy."}'::jsonb,
  'Reduce to 2 layers; coach pre-defines.',
  'Add a meta-layer (mental state); introduce surface-specific layer maps.',
  'Player articulates 3 layers and rates own adherence post-match.',
  120,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP3_MEN_115',
  NULL,
  'Decompression Protocol Post-Match',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Warm-Up',
  'Build a decompression protocol after high-intensity matches.',
  'Post-match context. Quiet space.',
  '1. Cool-down + hydration. | 2. 15-min decompression window — no devices, no analysis. | 3. Then structured debrief: 3 questions, written. | 4. Then physical recovery (stretch, cold tub if available). | 5. Closure ritual: shower, change, end-of-match marker.',
  '{"doing_well": "Decompression is full duration.", "working_on": "No analysis until decompression complete.", "current_focus": "Same protocol after win as after loss.", "next_step": "Adapt protocol to back-to-back match days."}'::jsonb,
  'Reduce decompression to 5 min; coach guides debrief.',
  'Add a peer-debrief option; introduce video-review timing.',
  'Player runs full protocol post-match across 5 matches.',
  45,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_FIT_116',
  NULL,
  'On-Court Conditioning Circuit',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Fitness',
  'Train',
  'Tennis-specific conditioning circuit using racquet + court.',
  'Full court, racquet, coach feeds.',
  '1. Station 1: 30s shadow groundstrokes. | 2. Station 2: 30s split-step + first step drill. | 3. Station 3: 30s mock serve + sprint to net. | 4. Station 4: 30s lateral shuffle baseline-to-baseline. | 5. 30s rest. | 6. Repeat 4 rounds.',
  '{"doing_well": "Form holds through all 4 stations.", "working_on": "Conditioning supports tennis movement, not isolated work.", "current_focus": "Last round matches first.", "next_step": "Add reactive layer to each station."}'::jsonb,
  'Reduce stations to 2; reduce rounds to 2; longer rest.',
  'Reduce rest to 20s; add 5th station; introduce timed-stat focus.',
  'Player completes 4 rounds with stable form across stations.',
  20,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_TAC_117',
  NULL,
  'First Strike Trigger Library',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Train',
  'Build a personal first-strike trigger library — what cues a first strike.',
  'Full court, appropriate ball, two players.',
  '1. Player and coach review 5 recent matches. | 2. Identify situations where first strike was used (e.g., ''short return'', ''second serve to backhand''). | 3. Build a 5-trigger library with corresponding strike option. | 4. Rehearse each trigger live — 6 reps. | 5. Match context: first strike must be preceded by recognized trigger.',
  '{"doing_well": "Triggers are observable cues.", "working_on": "Strike option matches trigger.", "current_focus": "First strike commits — no half-strike.", "next_step": "Add contingencies for trigger + counter."}'::jsonb,
  'Reduce to 3 triggers; coach proposes from observation.',
  'Add 7-trigger library; introduce counter-trigger when opponent neutralizes.',
  'Player articulates 5 triggers + strike options and uses each in match.',
  30,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_MEN_118',
  NULL,
  'Mid-Match State Check',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Game',
  'Build the habit of mid-match self-state monitoring.',
  'Match-play context.',
  '1. Pre-match: define 4 states (focused, drifting, frustrated, energized). | 2. At each side change: rate current state. | 3. Coach also rates from observation. | 4. If state is ''drifting'' or ''frustrated'', execute one reset behavior. | 5. Post-match: review state-arc.',
  '{"doing_well": "Self-rating matches coach observation.", "working_on": "State change triggers a reset.", "current_focus": "Don''t get stuck in a state — name it and shift.", "next_step": "Pre-empt state shift with cue."}'::jsonb,
  'Reduce to 2 states; coach prompts at each change.',
  'Add a fifth state (overheated); introduce in-rally state-checks.',
  'Player rates state at each side change with coach alignment in 80%.',
  45,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_TEC_119',
  NULL,
  'Stroke Cue-Sheet Reset',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Technical',
  'Focus',
  'Personal cue-sheet for resetting strokes after a slump.',
  'Stroke-by-stroke. Whiteboard or app input.',
  '1. Player and coach build a 1-cue-per-stroke sheet (forehand, backhand, serve, volley). | 2. Cues are short, observable, personal. | 3. After every 5 misses, player references the cue. | 4. Live phase: cue is the only allowed coaching. | 5. Post-session: refine cues.',
  '{"doing_well": "Cue resets the stroke within 2-3 reps.", "working_on": "Cue is one variable.", "current_focus": "Same cue across sessions.", "next_step": "Cue triggers automatically without conscious recall."}'::jsonb,
  'Reduce to 2 strokes; coach proposes cues.',
  'Add advanced strokes (slice, drop, volley); introduce match-context cue use.',
  'Player builds 4-stroke cue sheet and uses each cue successfully in session.',
  20,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_TAC_120',
  NULL,
  'Five-Pattern Match',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Game',
  'Match where player must use each of 5 named patterns at least once.',
  'Match-play context.',
  '1. Pre-match: 5 patterns defined. | 2. Player must execute each in the match. | 3. Coach tracks pattern use per game. | 4. Player rates each pattern''s effectiveness. | 5. Post-match: identify favorite + struggling patterns.',
  '{"doing_well": "Patterns appear naturally in flow.", "working_on": "Don''t force a pattern — wait for the trigger.", "current_focus": "Same pattern execution as in rehearsal.", "next_step": "Add pattern variations within each."}'::jsonb,
  'Reduce to 3 patterns; coach prompts when to use.',
  'Add 7 patterns; introduce pattern-counter when opponent reads.',
  'Player uses all 5 patterns at least once in a match.',
  90,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_DOUBLES_GREEN_121',
  NULL,
  'Doubles Serve Plus Net Cover',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Focus',
  'Standard doubles serve + net cover pattern.',
  'Full court, green/yellow ball, 4 players.',
  '1. Server hits to a defined zone. | 2. Net partner covers by stepping toward the line. | 3. Returner returns. | 4. Server-side plays out the point. | 5. 12 patterns each side.',
  '{"doing_well": "Net partner moves with serve direction.", "working_on": "Don''t crowd partner''s space.", "current_focus": "Communication after each point.", "next_step": "Add poach option from net."}'::jsonb,
  'Reduce to 2 serve zones; coach calls cover direction.',
  'Add I-formation variant; introduce 4-step coordination chain.',
  'Players execute serve + cover pattern cleanly in 8 of 12.',
  20,
  4,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_DOUBLES_YELLOW_122',
  NULL,
  'Doubles Return + Lob Pattern',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Train',
  'Doubles return-and-lob as a position-flipping tactic.',
  'Full court, yellow ball, 4 players.',
  '1. Returner blocks return, partner lobs over server''s net partner. | 2. Pattern flips to net for the returning team. | 3. 10 patterns. | 4. Live phase with full options. | 5. Track positioning success.',
  '{"doing_well": "Lob clears and lands deep.", "working_on": "Position flip is fast.", "current_focus": "Communication on the lob direction.", "next_step": "Add a return-and-lob with disguise."}'::jsonb,
  'Reduce to fed lob; static positioning.',
  'Live opponent + counter-lob options; introduce return-and-poach variant.',
  'Players complete return-and-lob pattern + position flip in 6 of 10.',
  20,
  4,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RETURN_GREEN_123',
  NULL,
  'Return Plus First Strike',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Focus',
  'Build the return + first strike as a 2-shot pattern.',
  'Full court, green/yellow ball, server + returner.',
  '1. Server hits second serve. | 2. Returner attacks return. | 3. Returner''s third ball: first strike to deep zone. | 4. Live phase. | 5. 12 patterns each side.',
  '{"doing_well": "Return commits — not a block.", "working_on": "Third ball is decided pre-rally.", "current_focus": "Recovery between return and third ball.", "next_step": "Add a fourth ball contingency."}'::jsonb,
  'Reduce to fed return; static third-ball target.',
  'Live full options; introduce return-counter pattern.',
  'Player completes return + first strike pattern cleanly in 7 of 12.',
  16,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_SERVE_YELLOW_124',
  NULL,
  'Serve Direction Sequence',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Technical',
  'Focus',
  'Build the ability to serve to 4 directions on demand.',
  'Full court, yellow ball, server bucket.',
  '1. Wide deuce, body deuce, T deuce, then ad mirror. | 2. 5 of each direction. | 3. Then 20 mixed on coach call. | 4. Then 20 player-choice with target zone called. | 5. Track in-zone percentage by direction.',
  '{"doing_well": "Visible direction differentiation.", "working_on": "Same toss for all 4 directions.", "current_focus": "Direction change without telegraph.", "next_step": "Pace + spin + direction matrix."}'::jsonb,
  'Reduce to 2 directions per side; static target.',
  'Add pace variation per direction; introduce serve-plus-one off each direction.',
  'Player hits 14 of 20 mixed directions cleanly into target.',
  18,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_SERVE_HP_125',
  NULL,
  'Pressure-Point Serve',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Technical',
  'Focus',
  'Build serve consistency under pressure-point simulation.',
  'Full court, yellow ball, server bucket.',
  '1. Coach calls a pressure score (e.g., 30-40). | 2. Server hits 1 first serve. | 3. If miss, second serve. | 4. Track first-serve % at pressure scores vs no-pressure. | 5. 20 pressure points.',
  '{"doing_well": "First-serve % holds at pressure.", "working_on": "Same routine at pressure as at no-pressure.", "current_focus": "Ace-or-attack mindset.", "next_step": "Pressure-point serve with disguise."}'::jsonb,
  'Reduce pressure scores; allow longer routine.',
  'Reduce time between points; introduce match-tiebreak pressure.',
  'First-serve % at pressure within 5% of no-pressure baseline.',
  20,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_MEN_126',
  NULL,
  'Pre-Point Routine Standardization',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Warm-Up',
  'Standardize a pre-point routine across stages.',
  'Pre-point context within match or drill.',
  '1. Player and coach define a 4-step pre-point routine: turn, breathe, cue, ready. | 2. Routine practiced for full session. | 3. Routine timed — duration consistent. | 4. Match context: routine adherence tracked. | 5. Iterate.',
  '{"doing_well": "Routine is identical regardless of score.", "working_on": "Same duration each time.", "current_focus": "Cue word triggers physical readiness.", "next_step": "Routine becomes automatic."}'::jsonb,
  'Reduce to 2 steps; coach reminds.',
  'Add a 5th step (visualization); introduce routine-stat tracking.',
  'Routine adhered to in 80% of points across a set.',
  20,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_MOV_127',
  NULL,
  'Recovery Stride Pattern',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Movement',
  'Train',
  'Build the standard recovery stride pattern.',
  'Full court, appropriate ball, coach feeds.',
  '1. Coach feeds wide. | 2. Player hits and recovers with cross-step + open shoulders to ball. | 3. 8 forehand reps + 8 backhand. | 4. Then alternating. | 5. Coach scores recovery stride.',
  '{"doing_well": "Cross-step is one explosive step.", "working_on": "Trail leg leads recovery direction.", "current_focus": "Stay low through cross-step.", "next_step": "Recovery stride + split-step combination."}'::jsonb,
  'Slower feed; static recovery point; reduce reps.',
  'Live opponent variant; introduce 3-shot recovery sequence.',
  'Player executes correct recovery stride in 6 of 8 reps each side.',
  12,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_MEN_128',
  NULL,
  'Loss Reframe Protocol',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Warm-Up',
  'Build a structured protocol for processing losses.',
  'Post-loss context. 24-48 hour window.',
  '1. Within 24h of loss: 3-question reflection (what went wrong, what could have gone differently, what''s the lesson). | 2. 24-48h: identify 1 actionable adjustment. | 3. Next training session: implement adjustment. | 4. Track adjustment effectiveness over 3 sessions. | 5. Post-3-session: archive lesson.',
  '{"doing_well": "Loss is processed without spiraling.", "working_on": "Adjustment is one variable.", "current_focus": "Reflection is honest, not defensive.", "next_step": "Apply protocol after wins too."}'::jsonb,
  'Coach guides reflection; reduce to 1 question.',
  'Add a peer-discussion layer; introduce video-review of loss.',
  'Player completes loss-reframe protocol after 2 losses with successful adjustment implementation.',
  30,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_MOV_129',
  NULL,
  'Forward Movement to Net',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Movement',
  'Train',
  'Build forward movement to net as a deliberate athletic skill.',
  'Full court, appropriate ball, coach feeds.',
  '1. Coach feeds short. | 2. Player approaches with controlled forward movement — not a sprint. | 3. Split-step at appropriate net position. | 4. Volley target. | 5. 12 reps.',
  '{"doing_well": "Approach is controlled, not panicked.", "working_on": "Split-step before volley contact.", "current_focus": "Stay tall through approach.", "next_step": "Add a closing step on volley contact."}'::jsonb,
  'Slower fed approach; reduce reps; static volley target.',
  'Live opponent passing; introduce 2-volley sequence.',
  'Player executes controlled approach + split-step + volley in 8 of 12.',
  14,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_MEN_130',
  NULL,
  'Win Reframe Protocol',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Warm-Up',
  'Build a structured protocol for processing wins — extracting learning, not just celebrating.',
  'Post-win context.',
  '1. Within 24h: 3 questions (what worked, what was lucky, what''s one thing to maintain). | 2. Identify the win pattern + the win contingency. | 3. Next session: practice the win pattern + contingency. | 4. Avoid over-anchoring to one win. | 5. Track win-pattern effectiveness across 3 wins.',
  '{"doing_well": "Win is processed with same discipline as loss.", "working_on": "Don''t conflate luck with skill.", "current_focus": "Maintainable win pattern identified.", "next_step": "Apply protocol to all wins."}'::jsonb,
  'Coach guides reflection; reduce to 1 question.',
  'Add a ''next-level test'' layer; introduce video-review of win.',
  'Player completes win-reframe protocol after 2 wins.',
  20,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED1_TEC_131',
  NULL,
  'Racquet Face Awareness',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Technical',
  'Warm-Up',
  'First experience of racquet face direction control.',
  'Service line, foam ball, modified racquet.',
  '1. Player holds racquet. | 2. Coach holds ball at racquet height. | 3. Player taps ball gently — open face up, then closed face down. | 4. 10 reps each. | 5. Coach calls open or closed; player executes.',
  '{"doing_well": "Player uses full grip — no choking down.", "working_on": "Wrist stable through tap.", "current_focus": "Visible face direction difference.", "next_step": "Add forward swing motion."}'::jsonb,
  'Coach guides racquet position; reduce reps.',
  'Add direction (left/right) to face control; introduce contact at moving ball.',
  'Player demonstrates open and closed face on 8 of 10 attempts.',
  6,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED1_COM_132',
  NULL,
  'Cooperative Counting Game',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'Competition',
  'Game',
  'First experience of counting + tracking own performance.',
  'Service box, foam ball, modified racquet, partner.',
  '1. Players cooperate to keep a rally going. | 2. Count out loud each contact. | 3. Goal: get to 5 together. | 4. After 5 minutes, attempt 8. | 5. Final round: 10.',
  '{"doing_well": "Players count clearly.", "working_on": "Don''t celebrate own contact — celebrate the rally.", "current_focus": "Soft hits — make it easy to keep going.", "next_step": "Introduce a target zone."}'::jsonb,
  'Coach feeds first ball; reduce target to 3.',
  'Add target zone; introduce 3-player rotation.',
  'Players reach a 5-shot rally with audible count.',
  8,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED2_MEN_133',
  NULL,
  'Restart Routine Introduction',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Mentality',
  'Warm-Up',
  'Introduce a simple between-point reset.',
  'Match or drill context.',
  '1. After each point, player turns away from the net. | 2. Three steps then turn back. | 3. Bounce ball, get ready. | 4. 10 points with the routine. | 5. Coach checks consistency.',
  '{"doing_well": "Routine is the same after a miss as after a winner.", "working_on": "Three steps — count them.", "current_focus": "Ready position before next point starts.", "next_step": "Add a breath cue."}'::jsonb,
  'Reduce to 2 steps; coach demonstrates each cycle.',
  'Add cue word; introduce routine before serve too.',
  'Player executes routine on 8 of 10 points.',
  5,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_RED3_TAC_134',
  NULL,
  'First Direction Choice',
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Tactical',
  'Train',
  'Introduce direction as a deliberate choice.',
  'Half court, red/orange ball, coach feeds.',
  '1. Coach feeds ball. | 2. Coach calls ''left'' or ''right'' before bounce. | 3. Player aims into called zone. | 4. 12 reps total. | 5. After: player chooses without call.',
  '{"doing_well": "Player looks at the zone before swing.", "working_on": "Same swing for both directions.", "current_focus": "Racquet face controls direction.", "next_step": "Player calls own direction pre-swing."}'::jsonb,
  'Larger zones; static feed; reduce reps.',
  'Smaller targets; faster feed; introduce direction-change within rally.',
  'Player lands 7 of 12 in called zone.',
  10,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE2_MOV_135',
  NULL,
  'Open-Stance Forehand Pattern',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Movement',
  'Train',
  'Build the open-stance forehand foot pattern.',
  'Three-quarter court, orange ball, coach feeds wide.',
  '1. Coach feeds wide forehand. | 2. Player plants outside foot first — open stance. | 3. Hits crosscourt. | 4. Cross-step recovery to bisector. | 5. 10 reps each side; track stance choice.',
  '{"doing_well": "Outside foot lands on the strike.", "working_on": "Stay low through the open stance.", "current_focus": "Hip rotation drives the swing.", "next_step": "Add neutral-stance variant for non-wide balls."}'::jsonb,
  'Slower feed; reduce reps; static recovery target.',
  'Live opponent; introduce 2-shot pattern with stance variation.',
  'Player executes open stance on 7 of 10 wide reps.',
  12,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE3_FIT_136',
  NULL,
  'Multi-Direction Sprint Block',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Fitness',
  'Train',
  'Tennis-specific sprint block covering multiple directions.',
  'Court space, no equipment.',
  '1. Forward sprint baseline-to-net x 4. | 2. Lateral sprint singles-to-singles x 4 each side. | 3. Diagonal sprint baseline corner-to-net corner x 4. | 4. Backpedal net-to-baseline x 4. | 5. 60s rest, repeat.',
  '{"doing_well": "Form holds across all 16 sprints.", "working_on": "Stop control at each end.", "current_focus": "First step is explosive.", "next_step": "Add change-of-direction trigger at midpoint."}'::jsonb,
  'Reduce to 8 sprints; longer rest.',
  'Add cue-based change of direction; introduce timed-pair reps.',
  'Player completes block with stable form across all 16 sprints.',
  12,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_ORANGE3_TEC_137',
  NULL,
  'Volley Plus Volley Sequence',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Technical',
  'Train',
  'Build the 2-volley sequence.',
  'Three-quarter court, orange ball, coach feeds.',
  '1. Player at service line. | 2. Coach feeds first volley — block to deep crosscourt. | 3. Coach feeds second volley — angle finish. | 4. 10 sequences. | 5. Live phase with passing-shot threat.',
  '{"doing_well": "First volley sets up second.", "working_on": "Move forward between volleys.", "current_focus": "Strings face target on both.", "next_step": "Add a third volley option."}'::jsonb,
  'Slower feeds; static positioning.',
  'Faster feeds; live passing; introduce drop-volley as second.',
  'Player executes 6 of 10 2-volley sequences cleanly.',
  12,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN1_FIT_138',
  NULL,
  'Speed-Endurance Build',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Fitness',
  'Train',
  'Build speed-endurance through repeated short sprints with limited rest.',
  'Court space.',
  '1. 15s sprint, 30s rest x 8. | 2. 20s sprint, 30s rest x 6. | 3. 30s sprint, 30s rest x 4. | 4. Cool-down jog 2 min. | 5. Stretch.',
  '{"doing_well": "Speed holds across rounds.", "working_on": "Recovery breath in rest period.", "current_focus": "Last set matches first.", "next_step": "Reduce rest by 5s."}'::jsonb,
  'Reduce sets per block; longer rest.',
  'Reduce rest to 20s; introduce direction-change variants.',
  'Player completes all 18 sprints with stable speed.',
  20,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN2_TAC_139',
  NULL,
  'Court-Position Awareness Game',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Train',
  'Build awareness of own and opponent court position.',
  'Full court, green ball, two players + coach.',
  '1. Rally with focus on position-awareness. | 2. After each shot, coach asks: ''Where is the opponent?'' | 3. Player names position. | 4. Coach asks: ''Where should you be?'' | 5. Player names target position. | 6. 8 rallies, debrief.',
  '{"doing_well": "Player names opponent position correctly.", "working_on": "Don''t break flow to look — peripheral awareness.", "current_focus": "Recovery position matches opponent threat.", "next_step": "Player calls position without prompt."}'::jsonb,
  'Reduce to coach naming both positions; reduce rallies.',
  'Add a third dimension (depth + width); introduce position-prediction.',
  'Player accurately names own + opponent position on 6 of 8 prompts.',
  15,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_GREEN3_COM_140',
  NULL,
  'Pressure-Tiebreak Series',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Competition',
  'Game',
  'Build pressure-handling through repeated tiebreaks.',
  'Full court, green/yellow ball, two players.',
  '1. Best of 5 tiebreaks (first to 7). | 2. No warm-up between. | 3. Coach watches without intervening. | 4. Players manage scoring + side changes. | 5. Debrief at end.',
  '{"doing_well": "Same routine across tiebreaks.", "working_on": "Don''t carry tiebreak 1 emotion into tiebreak 2.", "current_focus": "Pressure-point routine consistent.", "next_step": "Track first-strike % per tiebreak."}'::jsonb,
  'Reduce to 3 tiebreaks; allow rest between.',
  'Add a champions-tiebreak variant; introduce stat tracking.',
  'Player completes 5 tiebreaks with stable behavior across.',
  45,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW1_TAC_141',
  NULL,
  'Score-State Pattern Map',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Tactical',
  'Train',
  'Build score-state-specific tactical maps.',
  'Match or scrimmage context.',
  '1. Pre-match: define 4 score-states (leading game, tied game, behind game, deuce). | 2. Each state has 2 patterns. | 3. Match: player must use mapped pattern at each state. | 4. Coach tracks. | 5. Debrief.',
  '{"doing_well": "Pattern matches state.", "working_on": "Don''t switch patterns prematurely.", "current_focus": "Same execution at each state.", "next_step": "Add break-point sub-state."}'::jsonb,
  'Reduce to 2 states; coach prompts at each.',
  'Add 4 sub-states; introduce match-tiebreak overlay.',
  'Player executes mapped pattern in 6 of 8 score-states.',
  45,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW2_FIT_142',
  NULL,
  'Match-Day Energy System Build',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Fitness',
  'Train',
  'Build match-day energy: aerobic base + repeated sprints.',
  'Full court, yellow ball, coach feeds.',
  '1. 20-min continuous fed-rally drill at 70%. | 2. 5-min rest. | 3. 10x 30s sprint at 95%, 30s rest. | 4. 5-min rest. | 5. 10-min cool-down rally at 60%.',
  '{"doing_well": "Quality holds across all phases.", "working_on": "Don''t let aerobic base degrade in sprint phase.", "current_focus": "Recovery between phases is active.", "next_step": "Add a strength layer post-cool-down."}'::jsonb,
  'Reduce sprint reps; longer rest; reduce aerobic phase.',
  'Increase sprint count; add strength layer; reduce rest.',
  'Player completes all phases with stable quality.',
  50,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_YELLOW3_COM_143',
  NULL,
  'National-Level Match Format',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Competition',
  'Game',
  'Match format and intensity matching national competition.',
  'Full court, yellow ball, two players, officials if available.',
  '1. Best of 3 sets, full ad scoring. | 2. 10-min formal warm-up. | 3. Match-tiebreak at 1-1. | 4. Players manage scoring. | 5. Debrief at end.',
  '{"doing_well": "Player adapts to longer match format.", "working_on": "Same focus at 5-5 as 0-0.", "current_focus": "Pressure-point routine consistent across sets.", "next_step": "Add an officiating layer."}'::jsonb,
  'Reduce to short sets; allow no-ad on selected games.',
  'Add line judges + chair; introduce best-of-5 format option.',
  'Player completes a national-level match with stable performance.',
  120,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP1_COM_144',
  NULL,
  'Best-of-5 Match Simulation',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'Competition',
  'Game',
  'Match simulation in best-of-5 format.',
  'Full court, yellow ball, two players, officials.',
  '1. Best of 5 sets, full ad scoring. | 2. Standard tournament procedures. | 3. Coach as silent observer. | 4. Players manage all logistics. | 5. Post-match: 30-min structured debrief.',
  '{"doing_well": "Player handles multi-hour match.", "working_on": "Same energy in set 5 as set 1.", "current_focus": "Recovery between sets.", "next_step": "Track set-by-set tactical adjustments."}'::jsonb,
  'Reduce to best of 3 sets; allow shorter sets.',
  'Add scouting + media-style debrief; introduce match-day full-day protocol.',
  'Player completes best-of-5 match end-to-end with stable performance.',
  180,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP2_COM_145',
  NULL,
  'Travel Match Simulation',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Competition',
  'Game',
  'Simulate a travel-day match where player has limited prep time.',
  'Full court, yellow ball, two players.',
  '1. Player arrives at court with 30-min prep window. | 2. Self-managed warm-up + match prep. | 3. Match: best of 3 sets. | 4. Post-match: 15-min recovery + debrief. | 5. Same-day return travel possible.',
  '{"doing_well": "Match performance held with limited prep.", "working_on": "Pre-match routine compressed but effective.", "current_focus": "Recovery is rapid.", "next_step": "Travel-day with multiple matches."}'::jsonb,
  'Allow 60-min prep; coach helps with logistics.',
  'Reduce prep to 15 min; introduce overseas-travel simulation.',
  'Player completes travel-match simulation with stable match performance.',
  180,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_HP3_COM_146',
  NULL,
  'Multi-Match Day',
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Competition',
  'Game',
  'Two matches in one day, simulating tournament double-headers.',
  'Full court, yellow ball, two players.',
  '1. Match 1: morning, full intensity. | 2. 90-min recovery + nutrition. | 3. Match 2: afternoon, full intensity. | 4. Performance tracked across both. | 5. Recovery protocol post-match-2.',
  '{"doing_well": "Match-2 performance holds.", "working_on": "Recovery is structured.", "current_focus": "Mental reset between matches.", "next_step": "Introduce 3-match day variant."}'::jsonb,
  'Reduce match length; longer recovery.',
  'Add a 3rd match; introduce reduced-recovery variant.',
  'Player completes 2 matches in a day with performance held above 80% baseline.',
  360,
  2,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_TEC_147',
  NULL,
  'Stroke Quality Video Audit',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Technical',
  'Focus',
  'Periodic stroke-quality video audit.',
  'Court space, video equipment, coach feeds.',
  '1. Video baseline: 20 reps per stroke. | 2. Coach + player review video together. | 3. Identify 2 cue points per stroke. | 4. Practice cue points for 2 sessions. | 5. Re-video after 2 sessions; compare.',
  '{"doing_well": "Video reveals what feel-only practice misses.", "working_on": "Cue points are observable in slow-mo.", "current_focus": "Visible improvement after 2 sessions.", "next_step": "Self-audit before coach review."}'::jsonb,
  'Reduce to 1 stroke; coach identifies cues.',
  'Add a third stroke; introduce live-context video review.',
  'Visible improvement on video metrics across 2-session block.',
  45,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_TAC_148',
  NULL,
  'Match Pattern Analysis Session',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Focus',
  'Off-court tactical analysis using past match data.',
  'Off-court space. Match recording or stat sheet.',
  '1. Player and coach review last 3 matches. | 2. Identify 5 patterns of play that recurred. | 3. Categorize patterns: winning, neutral, losing. | 4. Build a refinement plan for losing patterns. | 5. Track refinement implementation over 5 matches.',
  '{"doing_well": "Patterns are specific and observable.", "working_on": "Don''t conflate one bad point with a pattern.", "current_focus": "Refinement is one variable per pattern.", "next_step": "Player runs the analysis without coach."}'::jsonb,
  'Reduce to 3 patterns; coach proposes from observation.',
  'Add a 7-pattern analysis; introduce opponent-specific overlays.',
  'Player articulates 5 patterns + refinement plan.',
  90,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_MEN_149',
  NULL,
  'Performance Review Quarterly',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Focus',
  'Quarterly review of overall performance arc.',
  'Off-court space. Match logs, stats, journal.',
  '1. Review last 3 months of matches + training. | 2. Identify 3 wins and 3 challenges. | 3. Map progression on 4 axes (technical, tactical, physical, mental). | 4. Build next-quarter plan. | 5. Coach + player co-sign plan.',
  '{"doing_well": "Review is honest.", "working_on": "Don''t over-anchor to recent matches.", "current_focus": "Plan is one main initiative + 2 maintenance lines.", "next_step": "Player owns the review and proposes plan."}'::jsonb,
  'Coach drives review; reduce axes to 2.',
  'Add peer-review or external-coach-review layer.',
  'Player completes review with co-signed quarter plan.',
  120,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_FIT_150',
  NULL,
  'Active Recovery Day Protocol',
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Fitness',
  'Train',
  'Build the active-recovery day as a standard protocol.',
  'Off-court + light on-court space.',
  '1. Light cardio (jog or bike) 20 min at 60% HR. | 2. Mobility flow 15 min. | 3. Light hitting 30 min — no intensity. | 4. Stretch + foam roll 15 min. | 5. Hydration + nutrition focus.',
  '{"doing_well": "Active recovery is treated with discipline.", "working_on": "Light hitting stays light.", "current_focus": "Same protocol weekly.", "next_step": "Integrate HRV + readiness data."}'::jsonb,
  'Reduce to 2 protocol items; coach guides.',
  'Add HRV monitoring; introduce nutritionist consult.',
  'Player completes active-recovery protocol weekly for 4 weeks.',
  90,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_MEN_152',
  NULL,
  'Coach Communication Protocol',
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Mentality',
  'Warm-Up',
  'Standardize coach-player communication.',
  'Pre-session and post-session structure.',
  '1. Pre-session: 3-min check-in (energy, focus area, questions). | 2. Mid-session: coach delivers max 2 cues per drill. | 3. Post-session: 5-min debrief (what worked, what didn''t, next focus). | 4. Player owns one item from each cycle. | 5. Iterate weekly.',
  '{"doing_well": "Communication is structured, not casual.", "working_on": "Player initiates the check-ins.", "current_focus": "Cues are concrete + observable.", "next_step": "Player runs the protocol without prompts."}'::jsonb,
  'Reduce to pre + post check-in only; coach drives.',
  'Add weekly review meeting; introduce match-day variant.',
  'Player runs full coach-comm protocol for 4 weeks.',
  20,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

INSERT INTO curriculum_drills
  (drill_id, academy_id, name, level_min_id, level_max_id, domain,
   session_block, objective, setup, procedure, coaching_cues,
   progression_easier, progression_harder, success_criteria,
   duration_minutes, players_needed, source_type, is_active)
VALUES (
  'DRILL_CROSS_TAC_153',
  NULL,
  'Pre-Match Game-Plan Builder',
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'Tactical',
  'Warm-Up',
  'Build a structured pre-match game-plan template.',
  'Pre-match. Notebook or app input.',
  '1. Player names opponent + 2 strengths + 2 weaknesses. | 2. Names 3 patterns to use. | 3. Names 1 contingency if patterns fail. | 4. Names 1 mental cue. | 5. Pre-match reads game-plan; post-match reviews.',
  '{"doing_well": "Game-plan is specific.", "working_on": "Don''t over-plan — 3 patterns is enough.", "current_focus": "Contingency is pre-loaded.", "next_step": "Player builds plan without coach input."}'::jsonb,
  'Coach proposes game-plan; reduce to 1 pattern.',
  'Add stat-tracking layer; introduce surface-specific plans.',
  'Player builds and applies a 3-pattern game-plan in 5 matches.',
  30,
  1,
  'global_default',
  true
) ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;

-- ============================================================
-- SECTION 6b: curriculum_drill_tags
-- Generated from the 'tags' column in each drill row.
-- One INSERT per drill-tag pair, using drill_id FK lookup.
-- ============================================================

INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'warm-up'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_MOV_001' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fms'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_MOV_001' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'coordination'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_MOV_001' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'multi-sport'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_MOV_001' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_MOV_001' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fms'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_MOV_002' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'catching'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_MOV_002' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'throwing'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_MOV_002' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'coordination'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_MOV_002' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_MOV_002' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'racquet-skills'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_TEC_003' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'solo'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_TEC_003' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_TEC_003' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'first-contact'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_TEC_003' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_COM_004' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'rally'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_COM_004' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'modified-scoring'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_COM_004' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_COM_004' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'attention'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_MEN_005' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'listening'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_MEN_005' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_MEN_005' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_MEN_005' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'rally'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_TEC_006' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'drop-hit'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_TEC_006' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_TEC_006' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_TEC_006' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'targets'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_TEC_007' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'direction'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_TEC_007' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_TEC_007' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_TEC_007' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'movement'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_MOV_008' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'recovery'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_MOV_008' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'lateral'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_MOV_008' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_MOV_008' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_COM_009' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'modified-scoring'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_COM_009' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'scoring-literacy'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_COM_009' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_COM_009' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'reflection'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_MEN_010' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'self-awareness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_MEN_010' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_MEN_010' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_MEN_010' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_COM_011' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'match-play'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_COM_011' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'self-management'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_COM_011' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_COM_011' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'recognition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_TEC_012' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'decision-making'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_TEC_012' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_TEC_012' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_TEC_012' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'recovery'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_MOV_013' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'movement'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_MOV_013' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_MOV_013' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'first-strike-prep'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_MOV_013' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'match-behavior'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_MEN_014' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'sportsmanship'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_MEN_014' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_MEN_014' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_MEN_014' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'crosscourt'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_TEC_015' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cooperation'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_TEC_015' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_TEC_015' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'rally'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_TEC_015' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'crosscourt'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_TEC_016' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'backhand'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_TEC_016' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_TEC_016' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'rally'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_TEC_016' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'direction-change'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_TAC_017' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_TAC_017' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_TAC_017' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'patterns'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_TAC_017' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_COM_018' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'round-robin'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_COM_018' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_COM_018' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'multi-opponent'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_COM_018' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'split-step'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_MOV_019' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'reaction'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_MOV_019' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'movement'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_MOV_019' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_MOV_019' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'goal-setting'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_MEN_020' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_MEN_020' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'reflection'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_MEN_020' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE1_MEN_020' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'bisector'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TAC_021' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'recovery'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TAC_021' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TAC_021' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TAC_021' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'inside-out'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_022' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'forehand'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_022' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_022' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_022' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'short-angle'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TAC_023' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'court-mapping'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TAC_023' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TAC_023' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TAC_023' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'match-endurance'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_COM_024' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_COM_024' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_COM_024' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'reset'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_COM_024' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'slice'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_025' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'backhand'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_025' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_025' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'defense'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_025' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'reset-routine'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_MEN_026' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_MEN_026' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_MEN_026' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'match-behavior'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_MEN_026' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'patterns'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TAC_027' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'three-shot'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TAC_027' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TAC_027' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TAC_027' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'sanctioned-format'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_COM_028' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'match-simulation'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_COM_028' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_COM_028' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_COM_028' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'first-strike'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TEC_029' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'serve-plus-one'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TEC_029' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TEC_029' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TEC_029' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-step'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_MOV_030' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'recovery'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_MOV_030' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'movement'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_MOV_030' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_MOV_030' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'pre-match-routine'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_MEN_031' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_MEN_031' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_MEN_031' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'readiness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_MEN_031' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'crosscourt'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_032' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'topspin'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_032' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_032' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'rally'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_032' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'direction-change'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_033' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'line'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_033' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'recovery'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_033' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_033' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'patterns'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TAC_034' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'five-shot'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TAC_034' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TAC_034' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TAC_034' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'volley'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_035' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'net'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_035' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_035' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_035' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tiebreak'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_COM_036' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'changeovers'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_COM_036' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_COM_036' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_COM_036' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'stance'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_MOV_037' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'recovery'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_MOV_037' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'movement'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_MOV_037' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_MOV_037' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'score-awareness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_MEN_038' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical-adjustment'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_MEN_038' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_MEN_038' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_MEN_038' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'short-ball'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_039' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'trigger'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_039' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'attack'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_039' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_039' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_039' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'approach'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TEC_040' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'volley'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TEC_040' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'combination'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TEC_040' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TEC_040' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TEC_040' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'endgame'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_041' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'patterns'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_041' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'decision-making'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_041' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_041' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_041' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'second-serve'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TEC_042' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'kick'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TEC_042' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'slice'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TEC_042' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TEC_042' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TEC_042' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'three-set'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_COM_043' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'match-format'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_COM_043' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_COM_043' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_COM_043' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'bisector'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_MOV_044' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'direction-change'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_MOV_044' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'recovery'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_MOV_044' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_MOV_044' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'movement'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_MOV_044' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'body-language'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_MEN_045' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'self-awareness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_MEN_045' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_MEN_045' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_MEN_045' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'personal-style'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TAC_046' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'patterns'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TAC_046' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TAC_046' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TAC_046' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'backhand'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TEC_047' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'down-the-line'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TEC_047' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TEC_047' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TEC_047' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'multi-day'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_COM_048' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tournament'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_COM_048' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_COM_048' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_COM_048' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'opponent-modeling'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TAC_049' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TAC_049' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TAC_049' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'patterns'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TAC_049' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'pressure-routine'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_MEN_050' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_MEN_050' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_MEN_050' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'match-behavior'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_MEN_050' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-ball'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TEC_051' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'adaptation'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TEC_051' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'rally'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TEC_051' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TEC_051' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TEC_051' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'shape-calibration'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TEC_052' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'heavy-flat'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TEC_052' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TEC_052' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TEC_052' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'serve-plus-one'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TAC_053' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'recovery'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TAC_053' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'bisector'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TAC_053' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TAC_053' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TAC_053' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-ball'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_COM_054' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tournament'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_COM_054' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_COM_054' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_COM_054' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'footwork'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_MOV_055' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'ladder'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_MOV_055' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'warm-up'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_MOV_055' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_MOV_055' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'movement'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_MOV_055' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fitness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_FIT_056' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'power'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_FIT_056' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_FIT_056' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tennis-specific'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_FIT_056' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'goal-hierarchy'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_MEN_057' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_MEN_057' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_MEN_057' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'reflection'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_MEN_057' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'periodization'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TAC_058' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'calendar-awareness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TAC_058' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TAC_058' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TAC_058' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'first-strike'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TEC_059' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'forehand'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TEC_059' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'variations'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TEC_059' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TEC_059' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TEC_059' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'pattern-library'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TAC_060' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'personal-style'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TAC_060' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TAC_060' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TAC_060' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'match-scheduling'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_COM_061' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'win-loss'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_COM_061' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_COM_061' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_COM_061' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'drop-shot'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TEC_062' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'disguise'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TEC_062' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TEC_062' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TEC_062' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'endurance'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_FIT_063' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fitness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_FIT_063' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_FIT_063' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tennis-specific'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_FIT_063' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'self-talk'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_MEN_064' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'reframe'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_MEN_064' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_MEN_064' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_MEN_064' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'style-variation'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_TAC_065' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_TAC_065' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_TAC_065' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'advanced'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_TAC_065' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tournament-prep'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_COM_066' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'peaking'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_COM_066' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_COM_066' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_COM_066' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'stroke-refinement'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_TEC_067' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'personal-style'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_TEC_067' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_TEC_067' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_TEC_067' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'identity'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_MEN_068' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_MEN_068' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_MEN_068' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'advanced'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_MEN_068' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'set-recovery'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_TAC_069' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_TAC_069' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_TAC_069' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'advanced'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_TAC_069' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'spin-pace'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_TEC_070' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'calibration'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_TEC_070' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_TEC_070' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_TEC_070' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'opponent-modeling'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_TAC_071' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'scouting'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_TAC_071' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_TAC_071' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_TAC_071' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'strength'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_FIT_072' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fitness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_FIT_072' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_FIT_072' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tennis-specific'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_FIT_072' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'international-format'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_COM_073' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'match-simulation'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_COM_073' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_COM_073' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_COM_073' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'review'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_MEN_074' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'reflection'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_MEN_074' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_MEN_074' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_MEN_074' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'defense-offense'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TEC_075' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'transition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TEC_075' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TEC_075' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TEC_075' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'double-periodization'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TAC_076' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'calendar'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TAC_076' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TAC_076' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TAC_076' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'recovery'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_FIT_077' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fitness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_FIT_077' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_FIT_077' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'protocol'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_FIT_077' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'travel-autonomy'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_COM_078' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_COM_078' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_COM_078' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'life-skills'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_COM_078' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'visualization'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_MEN_079' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_MEN_079' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_MEN_079' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'pre-match'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_MEN_079' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'performance-on-demand'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_TAC_080' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_TAC_080' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'advanced'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_TAC_080' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_TAC_080' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fatigue'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_TEC_081' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'stroke-maintenance'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_TEC_081' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_TEC_081' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_TEC_081' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'triple-periodization'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_FIT_082' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fitness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_FIT_082' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_FIT_082' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'annual'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_FIT_082' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'daily-log'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_MEN_083' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'living-as-a-pro'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_MEN_083' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_MEN_083' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_MEN_083' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'pro-format'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_COM_084' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tournament-swing'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_COM_084' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_COM_084' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_COM_084' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'warm-up'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_085' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'dynamic'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_085' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_085' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fitness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_085' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cool-down'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_086' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'recovery'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_086' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_086' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fitness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_086' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'footwork'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_087' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'positioning'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_087' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_087' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_087' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'court-mapping'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_088' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'vocabulary'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_088' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_088' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_088' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cue-word'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_089' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_089' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_089' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'activation'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_089' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'practice-match'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_COM_090' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'self-reffed'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_COM_090' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_COM_090' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_COM_090' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'target'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_091' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cooperation'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_091' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_091' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_091' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'patterns'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_092' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'three-ball'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_092' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_092' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_092' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'recovery'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MOV_093' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'movement'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MOV_093' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MOV_093' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'habit'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MOV_093' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'debrief'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_094' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'reflection'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_094' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_094' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_094' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'volume'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_095' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hitting'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_095' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_095' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_095' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'game-style'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_096' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'opponent-recognition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_096' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_096' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_096' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'volley'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_097' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_097' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_097' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'net'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_097' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'serve'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_098' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'toss'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_098' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_098' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_TEC_098' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'return-of-serve'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TEC_099' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TEC_099' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TEC_099' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'block'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TEC_099' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'doubles'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TAC_100' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'positioning'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TAC_100' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TAC_100' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TAC_100' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'half-volley'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_101' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'transition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_101' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_101' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_101' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'lob'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_102' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'defense'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_102' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'offense'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_102' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_102' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TEC_102' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'serve-and-volley'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TAC_103' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'patterns'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TAC_103' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TAC_103' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_TAC_103' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'slice-approach'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TEC_104' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TEC_104' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TEC_104' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'net'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TEC_104' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'doubles'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_105' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'poach'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_105' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_105' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_105' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'plyometric'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_FIT_106' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fitness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_FIT_106' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_FIT_106' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'power'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_FIT_106' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'return-game'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TAC_107' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'score-tactics'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TAC_107' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TAC_107' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_TAC_107' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'first-serve'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TEC_108' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'pace'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TEC_108' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TEC_108' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TEC_108' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'backhand'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TEC_109' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'topspin'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TEC_109' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TEC_109' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TEC_109' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'surface-adaptation'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TAC_110' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TAC_110' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TAC_110' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'advanced'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_TAC_110' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'anaerobic'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_FIT_111' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fitness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_FIT_111' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_FIT_111' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'intervals'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_FIT_111' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'set-adjustment'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_TAC_112' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_TAC_112' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_TAC_112' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'advanced'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_TAC_112' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'drop-shot'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TEC_113' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'pace'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TEC_113' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TEC_113' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TEC_113' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical-layers'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TAC_114' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'match-awareness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TAC_114' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TAC_114' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'advanced'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_TAC_114' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'decompression'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_MEN_115' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'recovery'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_MEN_115' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_MEN_115' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_MEN_115' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'conditioning'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_116' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fitness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_116' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_116' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'circuit'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_116' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'first-strike'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_117' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'trigger-library'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_117' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_117' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_117' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'self-state'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_118' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_118' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_118' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'advanced'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_118' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cue-sheet'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_119' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'stroke-reset'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_119' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_119' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_119' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'five-pattern'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_120' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'patterns'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_120' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_120' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_120' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'doubles'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_DOUBLES_GREEN_121' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'serve'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_DOUBLES_GREEN_121' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'net-cover'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_DOUBLES_GREEN_121' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'patterns'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_DOUBLES_GREEN_121' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'doubles'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_DOUBLES_YELLOW_122' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'return'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_DOUBLES_YELLOW_122' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'lob'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_DOUBLES_YELLOW_122' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'patterns'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_DOUBLES_YELLOW_122' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'return'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RETURN_GREEN_123' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'first-strike'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RETURN_GREEN_123' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'patterns'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RETURN_GREEN_123' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RETURN_GREEN_123' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'serve'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_SERVE_YELLOW_124' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'direction'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_SERVE_YELLOW_124' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_SERVE_YELLOW_124' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_SERVE_YELLOW_124' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'serve'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_SERVE_HP_125' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'pressure'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_SERVE_HP_125' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_SERVE_HP_125' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_SERVE_HP_125' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'pre-point-routine'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_126' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_126' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_126' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'recovery-stride'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MOV_127' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'movement'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MOV_127' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MOV_127' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'loss-reframe'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_128' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_128' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_128' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'advanced'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_128' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'forward-movement'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MOV_129' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'approach'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MOV_129' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MOV_129' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'movement'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MOV_129' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'win-reframe'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_130' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_130' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_130' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'advanced'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_130' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'racquet-face'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_TEC_131' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_TEC_131' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_TEC_131' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'first-contact'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_TEC_131' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cooperation'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_COM_132' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'counting'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_COM_132' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_COM_132' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED1_COM_132' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'restart-routine'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_MEN_133' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_MEN_133' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED2_MEN_133' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'direction'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_TAC_134' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'red-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_TAC_134' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_TAC_134' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'first-choice'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_RED3_TAC_134' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'open-stance'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_MOV_135' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_MOV_135' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'movement'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_MOV_135' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE2_MOV_135' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'sprints'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_FIT_136' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fitness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_FIT_136' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_FIT_136' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'multi-direction'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_FIT_136' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'volley'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TEC_137' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'sequence'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TEC_137' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'orange-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TEC_137' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_ORANGE3_TEC_137' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'speed-endurance'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_FIT_138' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_FIT_138' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fitness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN1_FIT_138' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'court-position'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_139' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'awareness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_139' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_139' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN2_TAC_139' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tiebreak'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_COM_140' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'pressure'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_COM_140' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'green-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_COM_140' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_GREEN3_COM_140' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'score-state'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TAC_141' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TAC_141' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TAC_141' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'advanced'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW1_TAC_141' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'energy-system'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_FIT_142' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fitness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_FIT_142' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_FIT_142' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'match-day'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW2_FIT_142' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'national-format'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_COM_143' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_COM_143' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'yellow-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_YELLOW3_COM_143' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'best-of-5'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_COM_144' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'match-simulation'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_COM_144' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_COM_144' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP1_COM_144' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'travel-match'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_COM_145' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_COM_145' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP2_COM_145' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'multi-match'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_COM_146' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'hp-band'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_COM_146' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'competition'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_COM_146' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'advanced'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_HP3_COM_146' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'video'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_147' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'stroke-audit'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_147' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_147' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'technical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TEC_147' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'match-analysis'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_148' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'patterns'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_148' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_148' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_148' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'quarterly-review'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_149' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_149' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_149' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'planning'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_149' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'active-recovery'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_150' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'fitness'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_150' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_150' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'protocol'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_FIT_150' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'coach-communication'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_152' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'mentality'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_152' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_152' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'protocol'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_MEN_152' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'game-plan'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_153' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'pre-match'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_153' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'tactical'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_153' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
INSERT INTO curriculum_drill_tags (drill_id, tag)
SELECT cd.id, 'cross-stage'
FROM curriculum_drills cd
WHERE cd.drill_id = 'DRILL_CROSS_TAC_153' AND cd.academy_id IS NULL
ON CONFLICT (drill_id, tag) DO NOTHING;
-- Total tag inserts: 614

-- ============================================================
-- SECTION 7: curriculum_competition_track (15 rows)
-- Source: AOS_Curriculum_Competition.xlsx — Competition Progression
-- federation_note is NULL — USTA tournament names in match_format
-- and tournament_cadence columns are labeled as federation-specific;
-- non-US academies substitute their federation equivalent.
-- ============================================================

INSERT INTO curriculum_competition_track
  (level_id, match_format, scoring_system, point_density, opponent_pool,
   tournament_cadence, win_loss_target, competition_behaviors,
   parent_role, coach_role, transition_signal, federation_note)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  'Cooperative rallies and target games. No scoring against opponent.',
  'Count to 5 / count to 10 cooperative rallies. Target hits. Coach-led ''who got the ball back'' games.',
  '1-3 minute games. Many short games per session.',
  'Stage peers within the academy. No external competition.',
  'None. Internal play only.',
  'N/A — non-competitive band.',
  'Trying. Listening. Coming back to the line. Cheering peers.',
  'Spectator and supporter. No outcome focus. Ask ''did you have fun?'' not ''did you win?''.',
  'Designs cooperative challenges. Celebrates effort. Models good losing/winning before formal scoring exists.',
  'Player can sustain a 5-rally cooperative point and stays engaged through losing the rally.',
  NULL
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_competition_track
  (level_id, match_format, scoring_system, point_density, opponent_pool,
   tournament_cadence, win_loss_target, competition_behaviors,
   parent_role, coach_role, transition_signal, federation_note)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'First-to-7 mini-games. Target points (hit the cone = 1 point). Self-scoring in pairs.',
  'First to 7. No deuce. Win by 1.',
  'Points last 1-4 shots. Quick cycles.',
  'Stage peers. Coach assigns matchups. Round-robin within the group.',
  'Internal academy round-robin once per month. Optional Red Ball event if available locally.',
  'Coach manages — aim for 3:2 wins:losses (mostly winnable).',
  'Saying the score. Recognizing point won/lost. Honest line calls.',
  'Drives to internal events. No coaching from the side. Praises effort and behaviors, not scores.',
  'Teaches scoring. Reffs early matches. Models neutral reaction to wins and losses.',
  'Player can self-score a first-to-7 game without coach intervention and accepts close calls without dispute.',
  NULL
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_competition_track
  (level_id, match_format, scoring_system, point_density, opponent_pool,
   tournament_cadence, win_loss_target, competition_behaviors,
   parent_role, coach_role, transition_signal, federation_note)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'First-to-7 single games and short timed matches (5 min). Three-game match formats begin.',
  'First to 7, win by 2. Three short games per match (best of 3 first-to-7).',
  'Points 2-6 shots. Sustained rallies appearing.',
  'Stage peers and Red 2 returners (controlled mismatch for confidence).',
  'Internal round-robin twice per month. First external Red Ball tournament if locally available.',
  'Target 3:1 wins:losses at internal events. External event: outcome irrelevant — exposure only.',
  'Pre-point breath. Walking between points. Saying the score before each serve.',
  'Drops off and picks up. No watching from courtside during matches. Debrief should not start with ''did you win''.',
  'Frames first external event as ''going to play and learn''. Reviews behaviors not outcomes.',
  'Player completes a 3-game match without losing composure on a bad call or string of lost points.',
  NULL
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_competition_track
  (level_id, match_format, scoring_system, point_density, opponent_pool,
   tournament_cadence, win_loss_target, competition_behaviors,
   parent_role, coach_role, transition_signal, federation_note)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'Best-of-3 short sets (first to 4, no-ad scoring). Singles primary. Doubles introduced.',
  'Short set to 4, no-ad. Best of 3. Tiebreak at 3-3 to 5.',
  'Points 3-8 shots. Some patterns emerging.',
  'Stage peers. Red 3 graduates. Some Orange 2 exposure for stretch matches.',
  'Internal events twice monthly. One Orange Ball local event per quarter.',
  'Target 3:1 internal, 1:1 at first external Orange events.',
  'Routine before serve. Routine before return. Shifting focus after a lost point.',
  'External tournament travel begins (within 1 hour). Stays out of player''s eye-line during play.',
  'Pre-event briefing covers behaviors and one tactical focus. Post-event review covers what was learned, not won.',
  'Player can play a full match without leaving the court emotionally — disappointment allowed, disengagement not.',
  NULL
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_competition_track
  (level_id, match_format, scoring_system, point_density, opponent_pool,
   tournament_cadence, win_loss_target, competition_behaviors,
   parent_role, coach_role, transition_signal, federation_note)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'Best-of-3 short sets (first to 4, no-ad). Match tiebreak at 1-1.',
  'Same as Orange 1. Doubles match format introduced (first to 4, no-ad, match tiebreak).',
  'Points 4-10 shots. First-strike awareness emerging.',
  'Stage peers. Mix of singles and doubles partners. Orange 3 stretch.',
  'Internal events twice monthly. One Orange Ball event per month locally.',
  'Target 1:1 at external events. Internal 3:2.',
  'One-shot game plan per match (e.g., ''serve to backhand''). Score-state awareness (leading/trailing).',
  'Travels regionally. Begins to recognize opponents and patterns. Does not analyze technique.',
  'Game-plan briefing per match. Two-question debrief: ''what worked?'' and ''what''s one thing to bring next time?''',
  'Player articulates a game-plan before a match and references it in the post-match review.',
  NULL
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_competition_track
  (level_id, match_format, scoring_system, point_density, opponent_pool,
   tournament_cadence, win_loss_target, competition_behaviors,
   parent_role, coach_role, transition_signal, federation_note)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'Best-of-3 short sets. First Orange Ball regional events. Doubles regular.',
  'Short set to 4, no-ad, match tiebreak. Some events use first-to-6 sets.',
  'Points 5-12 shots. Extended exchanges.',
  'Stage peers and Green 1 entrants. Cross-academy matchups.',
  'Internal monthly. Orange Ball regional 1-2 per month. First Green Ball graduation event.',
  'Target 1:1 regional. Outcome de-emphasized; pattern execution emphasized.',
  'Three-pattern game-plan. Score-state recognition (close vs runaway). Adjustment after losing a streak of points.',
  'Travel up to 2 hours. Hotels for weekend events possible. Meal and recovery routines forming.',
  'Pattern-based briefing. Video review optional, short. Records first opponent notes with player.',
  'Player wins one regional Orange Ball match and loses one and reviews each with the coach using pattern language.',
  NULL
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_competition_track
  (level_id, match_format, scoring_system, point_density, opponent_pool,
   tournament_cadence, win_loss_target, competition_behaviors,
   parent_role, coach_role, transition_signal, federation_note)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'Best-of-3 first-to-6 sets, no-ad. Match tiebreak at 1-1. Singles and doubles.',
  'First-to-6 sets, no-ad scoring. Match tiebreak (10-point) at 1-1.',
  'Points 5-15 shots. Tactical layers visible.',
  'Stage peers. Green 2 exposure. Mix of academy peers and regional players.',
  'Local Green Ball events twice monthly. One regional event per month.',
  'Target 1:1 regional. Better than 1:1 against the bottom half of the local field.',
  'Pre-match warm-up routine (15 min). Game-plan with three patterns. Bounce-ball routine before serve.',
  'Travels regionally. Begins to handle nutrition and warm-up independently. Limits courtside coaching to changeover signals only.',
  'Standardized warm-up template handed off. Game plan is collaborative, not coach-imposed.',
  'Player runs the pre-match warm-up and articulates the game-plan in their own words.',
  NULL
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_competition_track
  (level_id, match_format, scoring_system, point_density, opponent_pool,
   tournament_cadence, win_loss_target, competition_behaviors,
   parent_role, coach_role, transition_signal, federation_note)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'Full sets (first-to-6, win by 2 with tiebreak at 6-6 in some events). Best of 3 standard.',
  'First-to-6 with 7-point tiebreak at 6-6. Some events still match-tiebreak the third.',
  'Points 5-18 shots. First-strike vs construction visible.',
  'Stage peers and the bottom of Green 3. Sectional-level exposure.',
  'Local 2/month. Sectional-level event monthly. First sanctioned ranking event.',
  'Target 1:1 at sectional. Better than 1:1 at local.',
  'Score-state adjustments (leading 4-2 plays differently than trailing 2-4). Body language reset routine after a lost game.',
  'Travel includes weekend overnights regularly. Player carries own racquets, schedule, and routine.',
  'Match-by-match goals tied to one technical or tactical focus. Score is recorded but not the headline of the review.',
  'Player adjusts strategy mid-match when down a break and articulates the adjustment afterward.',
  NULL
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_competition_track
  (level_id, match_format, scoring_system, point_density, opponent_pool,
   tournament_cadence, win_loss_target, competition_behaviors,
   parent_role, coach_role, transition_signal, federation_note)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'Full standard scoring. Best of 3 sets, advantage scoring (some events still no-ad).',
  'Standard 6-game sets, advantage scoring (deuce, ad-in, ad-out). 7-point tiebreak at 6-6.',
  'Points 6-20 shots. Style emerging.',
  'Stage peers and bottom of Yellow 1. Sectional and first national-qualifier exposure.',
  'Sectional events monthly. National-qualifier event quarterly. Begins thinking about ranking.',
  'Target slightly better than 1:1 at sectional.',
  'Match-day energy management. Pre-match routine standardized (sleep, nutrition, warm-up). Use of changeover (towel, water, breath).',
  'Travel includes 4-8 hour drives or short flights. Overnights in hotels normal. Player handles tournament check-in independently.',
  'Begins to track win/loss patterns vs opponent style. Identifies which game-styles cause problems and works backward into training.',
  'Player completes a tournament weekend, reviews patterns of wins and losses by opponent style, and brings 1-2 training priorities back to the coach.',
  NULL
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_competition_track
  (level_id, match_format, scoring_system, point_density, opponent_pool,
   tournament_cadence, win_loss_target, competition_behaviors,
   parent_role, coach_role, transition_signal, federation_note)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'Full yellow-ball scoring. Best of 3 sets, advantage scoring. Some events no-ad. ITF/USTA Level 4-5 entry.',
  'Standard 6-game sets, advantage. Tiebreak at 6-6.',
  'Points 6-22 shots. Yellow-ball pace adaptation visible.',
  'Stage peers (Yellow 1 and bottom Yellow 2). National-level entry events.',
  'Sectional monthly. National Level 4-5 quarterly. Begins building a national ranking.',
  'Target 1:1 at Level 5. Outcome at Level 4 events is exposure-driven.',
  'Pre-match scouting (if information available). One-page game-plan. Recovery between matches in same-day double headers.',
  'Travel often involves flights and multi-day events. Family begins coordinating schedules with academy calendar.',
  'Coach may travel to one event per quarter. Game-plan briefing more detailed. Match-day texts limited to logistics, not coaching.',
  'Player wins one match against a Level 5 opponent and reviews their game-plan execution with the coach using video.',
  NULL
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_competition_track
  (level_id, match_format, scoring_system, point_density, opponent_pool,
   tournament_cadence, win_loss_target, competition_behaviors,
   parent_role, coach_role, transition_signal, federation_note)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'Standard scoring. Best of 3. National Level 3-4 events. Some best-of-3 with set tiebreak only.',
  '6-game sets, advantage. Tiebreak at 6-6.',
  'Points 7-25 shots. Tactical layers and game-style visible.',
  'Stage peers and Yellow 3 stretch. Cross-section national exposure.',
  'National events monthly. Builds toward a sectional or national ranking.',
  'Target 1:1 at Level 4. Better at sectional.',
  'Periodization mapping (peak weeks vs train weeks). Scheduled mental skills practice.',
  'Travel includes regular flights. Multi-day events with 2-3 matches per day possible. Player manages own laundry, food, and rest.',
  'Coach uses match data (opponent style, error patterns) to drive next training block. Reviews recordings with player.',
  'Player completes a national-level event with a documented pre-event plan, in-event log, and post-event review.',
  NULL
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_competition_track
  (level_id, match_format, scoring_system, point_density, opponent_pool,
   tournament_cadence, win_loss_target, competition_behaviors,
   parent_role, coach_role, transition_signal, federation_note)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'Standard scoring. National Level 1-3 events. ITF Junior exposure for HP-bound players.',
  'Full standard scoring. Best of 3.',
  'Points 8-30 shots. Style fully visible.',
  'Stage peers and Yellow 3-to-HP. National field.',
  'National Level 1-3 monthly. ITF junior event quarterly if path is HP-bound.',
  'Target 1:1 at Level 3. Better than 1:1 at Level 4 / sectional.',
  'Multi-day tournament management. Loss-recovery (back on court the next day). Scheduling around school and travel.',
  'Travel becomes a logistics operation. Family often makes academic adjustments (online school, missed days).',
  'Coach planning involves periodization across 6-12 month horizons. Tournament selection deliberate.',
  'Player wins a Level 3 event or a round at a Level 1-2 event and demonstrates ability to play 3 matches in 36 hours.',
  NULL
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_competition_track
  (level_id, match_format, scoring_system, point_density, opponent_pool,
   tournament_cadence, win_loss_target, competition_behaviors,
   parent_role, coach_role, transition_signal, federation_note)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'Full national/international scoring. ITF Junior. National Level 1-2. Some ATP/WTA futures-adjacent exposure for top players.',
  'Standard scoring. Best of 3 (junior). Some best-of-5 in elite junior events.',
  'Points 8-35 shots. Pro-style construction.',
  'Top national peers. ITF junior international field.',
  'Targeted ITF schedule. Domestic Level 1-2. Maybe one ITF futures event per year for boundary testing.',
  'Target 1:1 at ITF G4-G5. Better than 1:1 at domestic Level 2.',
  'Pro-style routines. Self-scouting and opponent scouting. Recovery and travel autonomy.',
  'Family handles logistics, but player drives schedule input. Player begins to make own travel and event-selection input.',
  'Coach is the primary planner. Player and coach review draws, match scheduling, and rest cycles together.',
  'Player completes an ITF G4 or G5 event with full match logs, pre-match scouting, and post-event reflection.',
  NULL
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_competition_track
  (level_id, match_format, scoring_system, point_density, opponent_pool,
   tournament_cadence, win_loss_target, competition_behaviors,
   parent_role, coach_role, transition_signal, federation_note)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'ITF Junior G1-G3 and slams junior events. Best-of-3 matches with junior slam exposure for top players.',
  'Standard. Best of 3. Best-of-5 at slams junior boys (varies by year).',
  'Points 10-40 shots. Match construction over hours.',
  'Top junior international field. Junior slam-track players.',
  'ITF G1-G3 schedule with possible slam junior qualifying. Selective domestic events.',
  'Target 1:1 at ITF G3. Outcome at G1-G2 is exposure with breakthroughs targeted.',
  'Pre-match scouting routine. Multi-match-day energy planning. Travel and recovery.',
  'Player travels with coach or coach-team. Family role shifts to support, not logistics.',
  'Coach travels to majority of events. Co-builds the calendar with player. Begins managing media exposure and ranking strategy.',
  'Player breaks into junior top 100 of their cohort or wins an ITF G3 main draw.',
  NULL
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_competition_track
  (level_id, match_format, scoring_system, point_density, opponent_pool,
   tournament_cadence, win_loss_target, competition_behaviors,
   parent_role, coach_role, transition_signal, federation_note)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'ITF Junior slams main draw or transition to ATP/WTA futures (15K) and challenger circuit.',
  'Standard. Best-of-5 at slams (boys). Pro tour scoring at futures and challengers.',
  'Points 8-40 shots. Pro-style match construction.',
  'Top junior international field, futures circuit, and challenger circuit at HP 3 ceiling.',
  'ITF junior slams + selective futures. Player who is futures-leading begins challenger entries.',
  'Outcome targets event-specific. Win one futures match. Qualifying for a challenger.',
  'Pro routines fully internalized. Career planning emerging (pro path or college path).',
  'Family role is emotional support. Player drives schedule with coach.',
  'Coach is travel coach or hands off to a tour coach. Begins college recruiting conversations if college path is chosen.',
  'Player either wins a futures round and enters challenger qualifying, or commits to a top-program college path with a clear academic-tennis schedule.',
  NULL
) ON CONFLICT (level_id) DO NOTHING;

-- ============================================================
-- SECTION 8: curriculum_fitness_guidance (15 rows)
-- Source: AOS_Curriculum_Fitness.xlsx — Fitness Progression sheet
-- fitness_phase normalized per seed-validation-report.md
-- off_court_sessions_per_week_min/max left NULL — source provides
-- weekly minutes, not session counts; cannot safely convert.
-- coaching_notes carries Primary Focus description.
-- ============================================================

INSERT INTO curriculum_fitness_guidance
  (level_id, fitness_phase, primary_energy_system, strength_band,
   key_fitness_tests, off_court_sessions_per_week_min,
   off_court_sessions_per_week_max, coaching_notes)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  'physical_literacy',
  'Aerobic (low-intensity, play-based). No formal energy system work.',
  'Bodyweight only. Animal walks, crawling, climbing. No load.',
  ARRAY['Movement screen: hop on one foot', 'gallop', 'skip', 'throw a ball.'],
  NULL,
  NULL,
  'Fundamental movement patterns. Locomotor variety. Coordination. | Speed: Reaction games, change-of-direction games. No timed sprints. | Endurance: Continuous play (10-30 min). Tag games.'
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_fitness_guidance
  (level_id, fitness_phase, primary_energy_system, strength_band,
   key_fitness_tests, off_court_sessions_per_week_min,
   off_court_sessions_per_week_max, coaching_notes)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  'physical_literacy',
  'Aerobic dominant. Short bursts of anaerobic-alactic during games.',
  'Bodyweight: squats, lunges, push-up progression, hangs, balances.',
  ARRAY['Squat depth', 'broad jump distance', 'bilateral skip.'],
  NULL,
  NULL,
  'FMS+ — fundamental movement skills with a tennis flavor. | Speed: Reaction starts. Side-shuffle relays. Coordination ladders. | Endurance: Continuous play 15-40 min. Recovery built in.'
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_fitness_guidance
  (level_id, fitness_phase, primary_energy_system, strength_band,
   key_fitness_tests, off_court_sessions_per_week_min,
   off_court_sessions_per_week_max, coaching_notes)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  'physical_literacy',
  'Aerobic + alactic. Short-sprint repeats with full recovery.',
  'Bodyweight + light medicine ball (1-2kg). Squats, lunges, presses.',
  ARRAY['10m sprint', 'broad jump', 'single-leg balance hold.'],
  NULL,
  NULL,
  'Coordination + first formal athletic vocabulary. | Speed: 5-10m sprints with full recovery. Ladder drills. Cone reactions. | Endurance: Continuous play 20-45 min. Steady state work appearing.'
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_fitness_guidance
  (level_id, fitness_phase, primary_energy_system, strength_band,
   key_fitness_tests, off_court_sessions_per_week_min,
   off_court_sessions_per_week_max, coaching_notes)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  'athletic_foundation',
  'Alactic dominant on court. Aerobic base from longer rallies and continuous play.',
  'Bodyweight + light external load (2-3kg medicine ball, light bands).',
  ARRAY['10m sprint', 'lateral 5-5-5', 'broad jump', 'plank hold.'],
  NULL,
  NULL,
  'Tennis-specific movement. First-step quickness. Eccentric strength intro. | Speed: 5-10m first-step sprints. Reactive change-of-direction. Lateral shuffles. | Endurance: Continuous play 30-60 min. Aerobic base via longer rallies.'
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_fitness_guidance
  (level_id, fitness_phase, primary_energy_system, strength_band,
   key_fitness_tests, off_court_sessions_per_week_min,
   off_court_sessions_per_week_max, coaching_notes)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  'athletic_foundation',
  'Alactic + lactic-tolerance intro. Long aerobic from continuous play.',
  'Bodyweight + medicine ball (3-4kg). Resistance bands. First introductory sled work.',
  ARRAY['10m sprint', '5-10-5 (pro agility)', 'medicine ball throws', 'broad jump', 'plank hold.'],
  NULL,
  NULL,
  'Multi-directional speed. Eccentric and isometric strength. Aerobic capacity. | Speed: Multi-directional sprints (5-10m). Reactive footwork patterns. | Endurance: Tempo runs (low intensity, longer duration). Continuous play 45-60 min.'
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_fitness_guidance
  (level_id, fitness_phase, primary_energy_system, strength_band,
   key_fitness_tests, off_court_sessions_per_week_min,
   off_court_sessions_per_week_max, coaching_notes)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  'athletic_foundation',
  'Alactic + aerobic + first lactic exposure. Conditioning circuits.',
  'Bodyweight + medicine ball + resistance bands. Some sled or load work for older O3.',
  ARRAY['10m sprint', '5-10-5', 'medicine ball throws', 'push-up rep test', 'plank.'],
  NULL,
  NULL,
  'Athletic foundation completed. Begins tennis-specific patterns. | Speed: Reactive cone drills. Change-of-direction circuits. First short interval work. | Endurance: Tempo runs + continuous tennis play. 45-75 min play sessions.'
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_fitness_guidance
  (level_id, fitness_phase, primary_energy_system, strength_band,
   key_fitness_tests, off_court_sessions_per_week_min,
   off_court_sessions_per_week_max, coaching_notes)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  'sport_performance',
  'Alactic + aerobic. First systematic lactic-tolerance work (longer points).',
  'Bodyweight + light external load. First introductory dumbbell work for older G1 players. Movement quality is still primary.',
  ARRAY['10m sprint', '5-10-5', 'medicine ball throws', 'vertical jump', 'broad jump', 'push-up reps', 'plank.'],
  NULL,
  NULL,
  'Tennis-specific aerobic capacity. Anaerobic-alactic power. First strength block. | Speed: Reactive sprints + on-court split-step training. Recovery footwork. | Endurance: Aerobic base via on-court play (45-75 min) + tempo runs (1-2x per week).'
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_fitness_guidance
  (level_id, fitness_phase, primary_energy_system, strength_band,
   key_fitness_tests, off_court_sessions_per_week_min,
   off_court_sessions_per_week_max, coaching_notes)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  'sport_performance',
  'Alactic + lactic + aerobic. Intervals on court (e.g., 30s on, 30s off rallies).',
  'Light dumbbells, kettlebells, bands. Weight-room introduction for older G2 players (technique-focused, not load-focused).',
  ARRAY['10m sprint', '5-10-5', 'medicine ball throws', 'vertical jump', 'broad jump', 'push-up reps', 'plank', 'beep test (modified).'],
  NULL,
  NULL,
  'Tennis movement patterns. Strength block. Aerobic capacity. First anaerobic intervals. | Speed: On-court split-step + reactive movement. Recovery sprint work. | Endurance: Aerobic 60-90 min total + tempo runs. Intervals on court.'
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_fitness_guidance
  (level_id, fitness_phase, primary_energy_system, strength_band,
   key_fitness_tests, off_court_sessions_per_week_min,
   off_court_sessions_per_week_max, coaching_notes)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  'sport_performance',
  'Alactic + lactic-tolerance + aerobic. Court intervals at higher intensity.',
  'Dumbbells, kettlebells, bands. Older G3 may begin barbell work under qualified S&C coach.',
  ARRAY['10m sprint', '5-10-5', 'medicine ball', 'vertical jump', 'broad jump', 'push-up reps', 'plank', 'beep test', 'repeated sprint test.'],
  NULL,
  NULL,
  'Strength foundation locked. Speed-strength. Lactic-tolerance. | Speed: Reactive + planned sprints. On-court change-of-direction cycles. | Endurance: Aerobic capacity via longer rallies. Tempo runs. Sport-specific intervals.'
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_fitness_guidance
  (level_id, fitness_phase, primary_energy_system, strength_band,
   key_fitness_tests, off_court_sessions_per_week_min,
   off_court_sessions_per_week_max, coaching_notes)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  'high_performance',
  'All systems. Lactic-tolerance work increases. Aerobic ceiling lifts.',
  'Barbell work (squat, deadlift, bench, press) under qualified S&C coach. Olympic lift introduction (technique).',
  ARRAY['10m and 20m sprint', '5-10-5', 'broad jump', 'vertical jump', '1RM estimates', 'beep test', 'repeated sprint test.'],
  NULL,
  NULL,
  'Yellow-ball pace adaptation. Strength block dominant. Speed and endurance balanced. | Speed: Reactive + planned sprints. On-court cycles at yellow-ball pace. | Endurance: Aerobic 90-120 min/week + intervals + tempo runs.'
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_fitness_guidance
  (level_id, fitness_phase, primary_energy_system, strength_band,
   key_fitness_tests, off_court_sessions_per_week_min,
   off_court_sessions_per_week_max, coaching_notes)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  'high_performance',
  'Lactic-tolerance + aerobic ceiling. Court intervals match longest expected match points.',
  'Barbell work. Olympic lift derivatives. Loaded jumps. Sled work.',
  ARRAY['20m sprint', '5-10-5', 'vertical jump', 'broad jump', '1RM estimates', 'beep test', 'repeated sprint test', 'Yo-Yo IR1.'],
  NULL,
  NULL,
  'Strength and speed development. Anaerobic intervals. Aerobic ceiling. | Speed: Sprint work + on-court reactive sprint cycles. | Endurance: Aerobic 120 min/week. Sport-specific intervals 2-3x/week.'
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_fitness_guidance
  (level_id, fitness_phase, primary_energy_system, strength_band,
   key_fitness_tests, off_court_sessions_per_week_min,
   off_court_sessions_per_week_max, coaching_notes)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  'high_performance',
  'All systems at higher volumes. Sport-specific work dominant.',
  'Full-body strength program. Olympic lift derivatives at moderate load. Power development blocks.',
  ARRAY['Full athletic test battery: 20m', 'agility', 'jump tests', '1RM', 'repeated sprint', 'Yo-Yo IR1', 'lactate threshold (if available).'],
  NULL,
  NULL,
  'Speed-strength. Power. Lactic-tolerance. Multi-day match capacity. | Speed: Reactive sprints on and off court. Plyometrics. | Endurance: Sport-specific intervals at match-pace. Aerobic ceiling work.'
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_fitness_guidance
  (level_id, fitness_phase, primary_energy_system, strength_band,
   key_fitness_tests, off_court_sessions_per_week_min,
   off_court_sessions_per_week_max, coaching_notes)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  'high_performance',
  'All systems integrated and individualized.',
  'Full S&C program designed by qualified coach. Strength, power, accessory, prehab.',
  ARRAY['Full battery + individualized markers (e.g.', 'resting HR', 'HRV if available).'],
  NULL,
  NULL,
  'Pro-style off-court program. Strength, power, speed, endurance. | Speed: Sprint, plyo, reactive sprint, sport-specific change-of-direction. | Endurance: Sport-specific aerobic and anaerobic work. Match-pace simulation.'
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_fitness_guidance
  (level_id, fitness_phase, primary_energy_system, strength_band,
   key_fitness_tests, off_court_sessions_per_week_min,
   off_court_sessions_per_week_max, coaching_notes)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  'high_performance',
  'All systems individualized.',
  'Full S&C with periodized blocks. Strength, power, conditioning, accessory.',
  ARRAY['Full battery individualized. Plus tournament debrief (load', 'recovery markers).'],
  NULL,
  NULL,
  'Pro-style program. Periodized to ITF junior calendar. | Speed: Speed and reactive work matched to match demands. | Endurance: Match-pace sport-specific intervals. Aerobic ceiling individualized.'
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_fitness_guidance
  (level_id, fitness_phase, primary_energy_system, strength_band,
   key_fitness_tests, off_court_sessions_per_week_min,
   off_court_sessions_per_week_max, coaching_notes)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  'high_performance',
  'All systems individualized to player style and pro path.',
  'Full pro-style program. Sport S&C coach travels with player or hands off to tour S&C.',
  ARRAY['Full battery + ongoing monitoring (HRV', 'sleep', 'load if instrumented).'],
  NULL,
  NULL,
  'Pro-tour level off-court program. Career planning. | Speed: Pro-level speed work. Plyometric maintenance. | Endurance: Pro-level conditioning. Match-pace work.'
) ON CONFLICT (level_id) DO NOTHING;

-- ============================================================
-- SECTION 9: curriculum_volume_guidance (15 rows)
-- Source: AOS_Curriculum_Volume.xlsx — Volume Progression sheet
-- acr_target_range stored as TEXT (definition pending confirmation
-- per synthesis doc §14.1 — almost certainly Acute:Chronic Workload Ratio).
-- Do not build any ACR algorithm against this field until confirmed.
-- ============================================================

INSERT INTO curriculum_volume_guidance
  (level_id, weekly_hours_min, weekly_hours_max,
   sessions_per_week_min, sessions_per_week_max,
   session_duration_min_minutes, session_duration_max_minutes,
   typical_stage_months_min, typical_stage_months_max,
   reassessment_cadence_weeks, acr_target_range,
   deload_cadence, overload_flags)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 1),
  1.5, 3.0,
  1, 2,
  45, 60,
  6, 12,
  12,
  '0.8-1.2',
  'Built into year structure (school breaks)',
  ARRAY['Watch for disengagement, not overload', 'Volume is low by design.']
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_volume_guidance
  (level_id, weekly_hours_min, weekly_hours_max,
   sessions_per_week_min, sessions_per_week_max,
   session_duration_min_minutes, session_duration_max_minutes,
   typical_stage_months_min, typical_stage_months_max,
   reassessment_cadence_weeks, acr_target_range,
   deload_cadence, overload_flags)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 2),
  2.0, 4.0,
  2, 3,
  45, 60,
  6, 12,
  NULL,
  '0.8-1.2',
  'Built into year structure',
  ARRAY['Watch for fatigue at session end (cue: form deterioration in last 10 min).']
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_volume_guidance
  (level_id, weekly_hours_min, weekly_hours_max,
   sessions_per_week_min, sessions_per_week_max,
   session_duration_min_minutes, session_duration_max_minutes,
   typical_stage_months_min, typical_stage_months_max,
   reassessment_cadence_weeks, acr_target_range,
   deload_cadence, overload_flags)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'red_foundation'::curriculum_stage AND level_number = 3),
  3.0, 5.0,
  3, 3,
  60, 60,
  6, 9,
  8,
  '0.8-1.2',
  'Built into year structure',
  ARRAY['Watch for grip-strength fatigue, attention drop in last 15 min.']
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_volume_guidance
  (level_id, weekly_hours_min, weekly_hours_max,
   sessions_per_week_min, sessions_per_week_max,
   session_duration_min_minutes, session_duration_max_minutes,
   typical_stage_months_min, typical_stage_months_max,
   reassessment_cadence_weeks, acr_target_range,
   deload_cadence, overload_flags)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 1),
  4.0, 6.0,
  3, 4,
  60, 75,
  6, 9,
  8,
  '0.8-1.2',
  'Deload week every 8 weeks',
  ARRAY['First volume bump', 'Watch for sleep changes and elbow/wrist soreness.']
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_volume_guidance
  (level_id, weekly_hours_min, weekly_hours_max,
   sessions_per_week_min, sessions_per_week_max,
   session_duration_min_minutes, session_duration_max_minutes,
   typical_stage_months_min, typical_stage_months_max,
   reassessment_cadence_weeks, acr_target_range,
   deload_cadence, overload_flags)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 2),
  5.0, 7.0,
  4, 4,
  60, 75,
  6, 9,
  8,
  '0.8-1.3',
  'Deload week every 6 weeks',
  ARRAY['Watch for shoulder/elbow soreness as serve volumes increase.']
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_volume_guidance
  (level_id, weekly_hours_min, weekly_hours_max,
   sessions_per_week_min, sessions_per_week_max,
   session_duration_min_minutes, session_duration_max_minutes,
   typical_stage_months_min, typical_stage_months_max,
   reassessment_cadence_weeks, acr_target_range,
   deload_cadence, overload_flags)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'orange_development'::curriculum_stage AND level_number = 3),
  6.0, 8.0,
  4, 5,
  75, 90,
  6, 9,
  8,
  '0.8-1.3',
  'Deload week every 4-6 weeks',
  ARRAY['Watch for back, shoulder, knee discomfort', 'Growth-related concerns starting.']
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_volume_guidance
  (level_id, weekly_hours_min, weekly_hours_max,
   sessions_per_week_min, sessions_per_week_max,
   session_duration_min_minutes, session_duration_max_minutes,
   typical_stage_months_min, typical_stage_months_max,
   reassessment_cadence_weeks, acr_target_range,
   deload_cadence, overload_flags)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 1),
  7.0, 10.0,
  4, 5,
  75, 90,
  6, 9,
  8,
  '0.8-1.3',
  'Deload week every 4 weeks',
  ARRAY['Major volume bump', 'Track: sleep, growth-plate symptoms, form quality.']
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_volume_guidance
  (level_id, weekly_hours_min, weekly_hours_max,
   sessions_per_week_min, sessions_per_week_max,
   session_duration_min_minutes, session_duration_max_minutes,
   typical_stage_months_min, typical_stage_months_max,
   reassessment_cadence_weeks, acr_target_range,
   deload_cadence, overload_flags)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 2),
  9.0, 12.0,
  5, 5,
  90, 90,
  6, 9,
  6,
  '0.8-1.3',
  'Deload week every 4 weeks',
  ARRAY['Watch for school-tennis balance', 'Growth-spurt sensitivity.']
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_volume_guidance
  (level_id, weekly_hours_min, weekly_hours_max,
   sessions_per_week_min, sessions_per_week_max,
   session_duration_min_minutes, session_duration_max_minutes,
   typical_stage_months_min, typical_stage_months_max,
   reassessment_cadence_weeks, acr_target_range,
   deload_cadence, overload_flags)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'green_performance'::curriculum_stage AND level_number = 3),
  10.0, 14.0,
  5, 6,
  90, 105,
  6, 12,
  6,
  '0.8-1.3',
  'Deload week every 4 weeks',
  ARRAY['First periodization layer', 'Watch for chronic load creep, shoulder, wrist, low back.']
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_volume_guidance
  (level_id, weekly_hours_min, weekly_hours_max,
   sessions_per_week_min, sessions_per_week_max,
   session_duration_min_minutes, session_duration_max_minutes,
   typical_stage_months_min, typical_stage_months_max,
   reassessment_cadence_weeks, acr_target_range,
   deload_cadence, overload_flags)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 1),
  12.0, 16.0,
  5, 6,
  90, 120,
  6, 12,
  6,
  '0.8-1.3',
  'Deload week every 4 weeks + monthly easy week',
  ARRAY['Watch for shoulder, low back, wrist', 'Sleep quality drops are an early flag.']
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_volume_guidance
  (level_id, weekly_hours_min, weekly_hours_max,
   sessions_per_week_min, sessions_per_week_max,
   session_duration_min_minutes, session_duration_max_minutes,
   typical_stage_months_min, typical_stage_months_max,
   reassessment_cadence_weeks, acr_target_range,
   deload_cadence, overload_flags)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 2),
  14.0, 18.0,
  6, 6,
  90, 120,
  6, 12,
  6,
  '0.8-1.3',
  'Deload week every 4 weeks',
  ARRAY['Watch for cumulative fatigue', 'Tournament-week volume drops needed.']
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_volume_guidance
  (level_id, weekly_hours_min, weekly_hours_max,
   sessions_per_week_min, sessions_per_week_max,
   session_duration_min_minutes, session_duration_max_minutes,
   typical_stage_months_min, typical_stage_months_max,
   reassessment_cadence_weeks, acr_target_range,
   deload_cadence, overload_flags)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'yellow_competitive'::curriculum_stage AND level_number = 3),
  16.0, 22.0,
  6, 7,
  90, 120,
  6, 12,
  6,
  '0.8-1.3',
  'Periodized — deload every 3-4 weeks',
  ARRAY['Pro-volume territory', 'Soft-tissue and joint integrity is the daily flag.']
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_volume_guidance
  (level_id, weekly_hours_min, weekly_hours_max,
   sessions_per_week_min, sessions_per_week_max,
   session_duration_min_minutes, session_duration_max_minutes,
   typical_stage_months_min, typical_stage_months_max,
   reassessment_cadence_weeks, acr_target_range,
   deload_cadence, overload_flags)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 1),
  18.0, 25.0,
  6, 7,
  90, 150,
  12, 18,
  6,
  '0.8-1.3',
  'Periodized — block-based (build/peak/deload)',
  ARRAY['Pro-volume', 'Track HRV, sleep, soft-tissue daily', 'Travel disruption is a major load factor.']
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_volume_guidance
  (level_id, weekly_hours_min, weekly_hours_max,
   sessions_per_week_min, sessions_per_week_max,
   session_duration_min_minutes, session_duration_max_minutes,
   typical_stage_months_min, typical_stage_months_max,
   reassessment_cadence_weeks, acr_target_range,
   deload_cadence, overload_flags)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 2),
  20.0, 28.0,
  6, 7,
  90, 180,
  12, 18,
  4,
  '0.8-1.3',
  'Periodized — block-based',
  ARRAY['Watch for travel-cumulative fatigue', 'Multi-tournament cycles need recovery weeks.']
) ON CONFLICT (level_id) DO NOTHING;

INSERT INTO curriculum_volume_guidance
  (level_id, weekly_hours_min, weekly_hours_max,
   sessions_per_week_min, sessions_per_week_max,
   session_duration_min_minutes, session_duration_max_minutes,
   typical_stage_months_min, typical_stage_months_max,
   reassessment_cadence_weeks, acr_target_range,
   deload_cadence, overload_flags)
VALUES (
  (SELECT id FROM curriculum_levels WHERE stage = 'high_performance'::curriculum_stage AND level_number = 3),
  20.0, 30.0,
  6, 7,
  90, 180,
  12, 24,
  4,
  '0.8-1.3',
  'Periodized — pro-tour block model',
  ARRAY['Pro-tour volume', 'Individualized monitoring (HRV, load, RPE, soft tissue, sleep).']
) ON CONFLICT (level_id) DO NOTHING;

-- ============================================================
-- drill_gate_mappings: intentionally empty.
-- Populate after mapping strategy is confirmed (synthesis doc §14.5).
-- ============================================================

-- DONE
