// Player Development Blueprint — Priority Engine V1
//
// Generates 3 priorities for each of 4 development pathways based on
// assessment scores and curriculum stage. Fully deterministic — no AI.
//
// Pathways:
//   SKILL       — from technical_score + movement (physical technique)
//   COMPETITION — from competition_score + tactical_score
//   FITNESS     — from movement_score
//   MENTAL      — from behavioral_score
//
// Each priority has: rank (1–3), label, description, why (coach rationale).
// Priorities are stage-aware: Red Foundation vs Orange Development vs Green+
// players need age/stage-appropriate language and focus areas.
//
// Pure TypeScript — no DB, no API, no mutations, no side effects.

// ── Types ─────────────────────────────────────────────────────────────────────

export type CurriculumStage =
  | 'red_foundation'
  | 'orange_development'
  | 'green_performance'
  | 'yellow_competitive'
  | 'high_performance'

export interface DevelopmentPriority {
  rank: 1 | 2 | 3
  label: string
  description: string
  why: string
  pathway: 'skill' | 'competition' | 'fitness' | 'mental'
}

export interface AssessmentScores {
  technical_score: number | null
  tactical_score: number | null
  movement_score: number | null
  competition_score: number | null
  behavioral_score: number | null
}

export interface BlueprintPriorities {
  skill: DevelopmentPriority[]
  competition: DevelopmentPriority[]
  fitness: DevelopmentPriority[]
  mental: DevelopmentPriority[]
}

// ── Score tier helper ─────────────────────────────────────────────────────────

function tier(score: number | null): 'emerging' | 'developing' | 'established' {
  if (score === null || score < 5) return 'emerging'
  if (score < 7.5) return 'developing'
  return 'established'
}

// ── Stage shorthand ───────────────────────────────────────────────────────────

type StageTier = 'foundation' | 'development' | 'performance'

function stageTier(stage: CurriculumStage): StageTier {
  if (stage === 'red_foundation') return 'foundation'
  if (stage === 'orange_development') return 'development'
  return 'performance'
}

// ── SKILL PATH priorities ─────────────────────────────────────────────────────

const SKILL_PRIORITIES: Record<StageTier, Record<'emerging' | 'developing' | 'established', DevelopmentPriority[]>> = {
  foundation: {
    emerging: [
      { rank: 1, label: 'Tracking', description: 'Developing consistent eye-on-ball tracking through contact', why: 'Tracking is the foundation of all ball striking. Without it, no stroke pattern can be reliable.', pathway: 'skill' },
      { rank: 2, label: 'Contact Quality', description: 'Establishing clean, centered contact with the ball', why: 'Clean contact at this stage creates confidence and sets correct muscle memory for future stroke development.', pathway: 'skill' },
      { rank: 3, label: 'Ball Control', description: 'Building basic directional and depth control over the ball', why: 'Ball control develops spatial awareness and begins to wire the feedback loop between intent and result.', pathway: 'skill' },
    ],
    developing: [
      { rank: 1, label: 'Contact Spacing', description: 'Learning to create consistent space before contact', why: 'Correct spacing is the most common uncoached gap at this stage. It unlocks stroke efficiency and injury prevention.', pathway: 'skill' },
      { rank: 2, label: 'Swing Path', description: 'Establishing consistent swing paths across forehand and backhand', why: 'Consistent swing path builds the repeatable stroke pattern needed for competition confidence.', pathway: 'skill' },
      { rank: 3, label: 'Serve Rhythm', description: 'Developing a repeatable, comfortable serve rhythm', why: 'A reliable serve reduces pressure points and creates a positive starting pattern for every rally.', pathway: 'skill' },
    ],
    established: [
      { rank: 1, label: 'Spin Variation', description: 'Adding topspin and slice options across groundstrokes', why: 'Spin variation opens tactical options and makes the player harder to read for opponents.', pathway: 'skill' },
      { rank: 2, label: 'Approach Play', description: 'Developing aggressive approach sequences and net positioning', why: 'Short ball recognition and approach play extends tactical options beyond baseline rallying.', pathway: 'skill' },
      { rank: 3, label: 'Stroke Consistency Under Fatigue', description: 'Maintaining stroke quality when physically challenged', why: 'Foundation players who maintain technique under pressure are ready for the next developmental stage.', pathway: 'skill' },
    ],
  },
  development: {
    emerging: [
      { rank: 1, label: 'Contact Spacing', description: 'Rebuilding consistent contact spacing across all strokes', why: 'Spacing breakdown is the most frequent cause of inconsistency at the Orange level.', pathway: 'skill' },
      { rank: 2, label: 'Low Ball Adaptation', description: 'Developing reliable technique for balls below net height', why: 'Low ball handling is a consistent gap that opponents will exploit in competition.', pathway: 'skill' },
      { rank: 3, label: 'Serve Reliability', description: 'Building a high first-serve percentage under match conditions', why: 'Serve reliability directly impacts match confidence and rally control.', pathway: 'skill' },
    ],
    developing: [
      { rank: 1, label: 'Cross-Court Rally Pattern', description: 'Establishing dominant cross-court rally depth and direction', why: 'Cross-court rally mastery is the baseline pattern that all Orange level tactics are built from.', pathway: 'skill' },
      { rank: 2, label: 'Inside-Out Forehand', description: 'Developing the inside-out forehand as a pattern starter', why: 'The inside-out forehand opens the court and creates attacking opportunities from the first short ball.', pathway: 'skill' },
      { rank: 3, label: 'Backhand Slice Reliability', description: 'Building a reliable backhand slice for low balls and defensive situations', why: 'A reliable slice adds tactical depth and a defensive reset option.', pathway: 'skill' },
    ],
    established: [
      { rank: 1, label: 'Heavy Topspin Production', description: 'Developing high topspin production for rally control', why: 'Heavy topspin creates court penetration and pushes opponents back, opening attacking opportunities.', pathway: 'skill' },
      { rank: 2, label: 'Serve + 1 Patterns', description: 'Building serve-and-forehand attack combinations', why: 'Serve + 1 patterns are the most efficient path to free points at the Orange competitive level.', pathway: 'skill' },
      { rank: 3, label: 'Volley Confidence', description: 'Developing reliable put-away volleys at the net', why: 'Net-play confidence adds a weapon that few Orange-level opponents are equipped to handle.', pathway: 'skill' },
    ],
  },
  performance: {
    emerging: [
      { rank: 1, label: 'Stroke Mechanics Under Pressure', description: 'Maintaining technical standards during high-pressure points', why: 'Technical breakdown under pressure is the primary limiter for Green and above players.', pathway: 'skill' },
      { rank: 2, label: 'Return of Serve', description: 'Developing aggressive and reliable return game', why: 'Return games at this level require specific training — passive returning will not compete.', pathway: 'skill' },
      { rank: 3, label: 'Movement Economy', description: 'Improving recovery position and movement efficiency', why: 'Movement economy at higher levels separates players who can sustain rallies from those who cannot.', pathway: 'skill' },
    ],
    developing: [
      { rank: 1, label: 'Directional Variation', description: 'Commanding inside-out, inside-in, and cross-court patterns with intention', why: 'Intentional directional control is the difference between reacting and dictating at the Green level.', pathway: 'skill' },
      { rank: 2, label: 'Second Serve Aggression', description: 'Building an attacking second serve to reduce double-fault pressure', why: 'A passive second serve is exploited at this level. Aggressive kicker or slice opens up serve game.', pathway: 'skill' },
      { rank: 3, label: 'Net Play Integration', description: 'Incorporating net approaches as a regular tactical weapon', why: 'Net play confidence creates versatility and opens tactical options opponents have not prepared for.', pathway: 'skill' },
    ],
    established: [
      { rank: 1, label: 'Serve Dominance', description: 'Establishing the serve as a consistent free-point generator', why: 'At this level, serve quality creates structural advantage in every service game.', pathway: 'skill' },
      { rank: 2, label: 'Transition Game', description: 'Developing aggressive transition from defense to offense', why: 'The ability to flip from defense to attack within a rally is a key differentiator at the competitive level.', pathway: 'skill' },
      { rank: 3, label: 'Weapon Development', description: 'Building one or two signature shots that competitors must plan for', why: 'Weapon shots create psychological pressure and tactical problems that reactive players cannot solve.', pathway: 'skill' },
    ],
  },
}

// ── COMPETITION PATH priorities ───────────────────────────────────────────────

const COMPETITION_PRIORITIES: Record<StageTier, Record<'emerging' | 'developing' | 'established', DevelopmentPriority[]>> = {
  foundation: {
    emerging: [
      { rank: 1, label: 'Scoring Knowledge', description: 'Learning how tennis scoring works and how to track a match', why: 'Understanding scoring removes cognitive load so the player can focus on playing.', pathway: 'competition' },
      { rank: 2, label: 'Rally Tolerance', description: 'Staying engaged in rallies rather than forcing early endings', why: 'Rally tolerance is the foundation of match play development at the early stage.', pathway: 'competition' },
      { rank: 3, label: 'Point Structure Awareness', description: 'Understanding that every point has a pattern: serve, rally, finish', why: 'Early point structure awareness accelerates tactical development at all future levels.', pathway: 'competition' },
    ],
    developing: [
      { rank: 1, label: 'Pattern Recognition', description: 'Identifying when to play cross-court vs down-the-line', why: 'Basic pattern recognition turns rallies into intentional sequences rather than random exchanges.', pathway: 'competition' },
      { rank: 2, label: 'Error Management', description: 'Reducing unforced errors by playing within capability', why: 'Error management is the single highest-leverage competition skill at this stage.', pathway: 'competition' },
      { rank: 3, label: 'Big Point Focus', description: 'Developing a routine for handling pressure points: 30-30, deuce, break point', why: 'Big point awareness turns matches from random outcomes to structured competition experiences.', pathway: 'competition' },
    ],
    established: [
      { rank: 1, label: 'Point Construction', description: 'Building structured point patterns: open the court, attack the weakness', why: 'Point construction is the foundation of competitive tennis intelligence.', pathway: 'competition' },
      { rank: 2, label: 'Pressure Patterns', description: 'Using serve placement and third-ball to create pressure systematically', why: 'Systematic pressure patterns remove reliance on opponent errors and create winning structure.', pathway: 'competition' },
      { rank: 3, label: 'Tiebreak Management', description: 'Developing a specific tiebreak strategy and mental routine', why: 'Tiebreak composure separates players at the foundation level who are ready to compete seriously.', pathway: 'competition' },
    ],
  },
  development: {
    emerging: [
      { rank: 1, label: 'Rally Tolerance', description: 'Building confidence in sustained baseline rallies', why: 'Many Orange players rush points through anxiety. Rally tolerance creates structural patience.', pathway: 'competition' },
      { rank: 2, label: 'Decision Making Under Pressure', description: 'Making consistent choices when behind in a point', why: 'Decision quality under pressure determines match outcomes at this level more than technical skill.', pathway: 'competition' },
      { rank: 3, label: 'Return Game Strategy', description: 'Developing a reliable return plan: depth, neutralization, attack', why: 'A structured return game converts service games into rally opportunities.', pathway: 'competition' },
    ],
    developing: [
      { rank: 1, label: 'Pattern-Based Play', description: 'Using consistent shot patterns to control rallies', why: 'Pattern-based play removes guesswork and builds reproducible winning sequences.', pathway: 'competition' },
      { rank: 2, label: 'Match Adaptability', description: 'Reading and adjusting to opponent patterns during the match', why: 'Match adaptability is what separates pattern-trained players from truly competitive ones.', pathway: 'competition' },
      { rank: 3, label: 'Serving to a Plan', description: 'Using serve placement to set up the first ball response', why: 'Intentional serve placement is the fastest way to gain structural advantage from the first shot.', pathway: 'competition' },
    ],
    established: [
      { rank: 1, label: 'Point Construction', description: 'Executing multi-ball attacking sequences consistently', why: 'At the established Orange level, reactive players cannot compete with those who construct points.', pathway: 'competition' },
      { rank: 2, label: 'Tactical Flexibility', description: 'Switching between aggressive, neutral, and defensive play intentionally', why: 'Tactical flexibility prevents opponents from settling into a game plan.', pathway: 'competition' },
      { rank: 3, label: 'Momentum Management', description: 'Handling momentum shifts with composure and a reset routine', why: 'Momentum management is the most common differentiator in closely contested Orange matches.', pathway: 'competition' },
    ],
  },
  performance: {
    emerging: [
      { rank: 1, label: 'Point Structure Mastery', description: 'Executing multi-phase point patterns without hesitation', why: 'Green and above players must have automatic tactical responses to court situations.', pathway: 'competition' },
      { rank: 2, label: 'Game-Plan Execution', description: 'Implementing a pre-match game plan across a full match', why: 'Consistency in game-plan execution separates developing competitors from established ones.', pathway: 'competition' },
      { rank: 3, label: 'Pressure-Point Closing', description: 'Winning close games and close sets consistently', why: 'Closing ability is the performance-level skill that prevents close matches from becoming losses.', pathway: 'competition' },
    ],
    developing: [
      { rank: 1, label: 'Opponent Analysis', description: 'Reading opponent patterns and adjusting mid-match', why: 'Real-time opponent analysis is a competitive necessity at the Green performance level.', pathway: 'competition' },
      { rank: 2, label: 'Match Rhythm Control', description: 'Using between-point routines to control match rhythm and pace', why: 'Rhythm control transfers competitive pressure onto the opponent.', pathway: 'competition' },
      { rank: 3, label: 'Third-Set Composure', description: 'Maintaining performance quality and decision clarity in third sets', why: 'Third-set performance is a direct measure of competitive maturity.', pathway: 'competition' },
    ],
    established: [
      { rank: 1, label: 'Strategic Depth', description: 'Deploying multiple tactical game plans in the same match', why: 'Strategic depth prevents opponents from solving a single tactical approach.', pathway: 'competition' },
      { rank: 2, label: 'Winning Ugly', description: 'Competing effectively when technique breaks down under fatigue or pressure', why: 'The ability to compete and find solutions when not playing well is a hallmark of elite competitors.', pathway: 'competition' },
      { rank: 3, label: 'Competitive Experience Volume', description: 'Accumulating high match volume across varied competition settings', why: 'At the high performance level, match experience is the accelerator that training alone cannot replace.', pathway: 'competition' },
    ],
  },
}

// ── FITNESS PATH priorities ───────────────────────────────────────────────────

const FITNESS_PRIORITIES: Record<StageTier, Record<'emerging' | 'developing' | 'established', DevelopmentPriority[]>> = {
  foundation: {
    emerging: [
      { rank: 1, label: 'Balance', description: 'Developing stable, balanced athletic positioning on and off the ball', why: 'Balance is the base of all athletic movement. Without it, footwork patterns cannot be developed correctly.', pathway: 'fitness' },
      { rank: 2, label: 'Coordination', description: 'Building hand-eye and full-body coordination through movement patterns', why: 'Coordination development at this age has the highest neurological transfer rate. It is the most efficient time to build it.', pathway: 'fitness' },
      { rank: 3, label: 'Basic Mobility', description: 'Developing the hip and shoulder mobility needed for stroke mechanics', why: 'Early mobility work prevents the compensations and restrictions that limit development in later stages.', pathway: 'fitness' },
    ],
    developing: [
      { rank: 1, label: 'Speed Development', description: 'Building first-step speed and linear court speed', why: 'Speed at this stage responds well to training. Earlier investment pays dividends for all future levels.', pathway: 'fitness' },
      { rank: 2, label: 'Agility', description: 'Developing multi-directional change of direction on the court', why: 'Court agility is the physical foundation of tennis-specific movement.', pathway: 'fitness' },
      { rank: 3, label: 'Reaction Time', description: 'Training split-second movement initiation in response to ball direction', why: 'Reaction time training at this stage is developmentally optimal and has lasting neurological benefits.', pathway: 'fitness' },
    ],
    established: [
      { rank: 1, label: 'Athletic Endurance', description: 'Building the aerobic base to sustain long matches and training sessions', why: 'Aerobic fitness determines whether technical and tactical skills can be applied consistently across a full match.', pathway: 'fitness' },
      { rank: 2, label: 'Explosive Footwork', description: 'Developing explosive first steps from the ready position', why: 'Explosive footwork creates time advantages on every ball, particularly on wide balls and short balls.', pathway: 'fitness' },
      { rank: 3, label: 'Recovery Mechanics', description: 'Building efficient recovery steps back to the ready position after each shot', why: 'Recovery mechanics are the most undercoached physical skill and the most directly tied to consistency.', pathway: 'fitness' },
    ],
  },
  development: {
    emerging: [
      { rank: 1, label: 'Lateral Speed', description: 'Building lateral movement speed for wide-ball coverage', why: 'Lateral speed is the most limiting physical factor at the Orange development level.', pathway: 'fitness' },
      { rank: 2, label: 'Court Positioning', description: 'Developing automatic positioning habits relative to ball location', why: 'Court positioning determines whether physical speed is applied to the right location on every shot.', pathway: 'fitness' },
      { rank: 3, label: 'Strength Foundation', description: 'Building the foundational strength for injury prevention and power development', why: 'A strength foundation at this stage prevents the overuse injuries that limit development trajectory.', pathway: 'fitness' },
    ],
    developing: [
      { rank: 1, label: 'Explosive Power', description: 'Developing explosive hip and leg drive for groundstroke power', why: 'Power development at this stage converts technique quality into ball penetration.', pathway: 'fitness' },
      { rank: 2, label: 'Match Fitness', description: 'Building the conditioning to perform at full capacity through third sets', why: 'Match fitness directly determines whether competition performance matches practice performance.', pathway: 'fitness' },
      { rank: 3, label: 'Functional Flexibility', description: 'Maintaining flexibility through growth spurts and load increases', why: 'Flexibility management during physical development periods prevents the stiffness that restricts stroke mechanics.', pathway: 'fitness' },
    ],
    established: [
      { rank: 1, label: 'Power-to-Weight Ratio', description: 'Optimizing athletic power production relative to body composition', why: 'Power-to-weight optimization is the physical differentiator at the advanced Orange level.', pathway: 'fitness' },
      { rank: 2, label: 'Speed-Endurance', description: 'Maintaining sprint speed quality across long points and long matches', why: 'Speed-endurance prevents the physical fade in third sets that leads to tactical collapse.', pathway: 'fitness' },
      { rank: 3, label: 'Injury Resilience', description: 'Building load management habits and physical resilience for high training volumes', why: 'Injury resilience becomes the primary physical constraint as training volume increases at this level.', pathway: 'fitness' },
    ],
  },
  performance: {
    emerging: [
      { rank: 1, label: 'Athletic Power', description: 'Developing whole-body power integration across all strokes', why: 'Power integration separates physically imposing players from technically correct but passive ones at the Green level.', pathway: 'fitness' },
      { rank: 2, label: 'Speed Under Fatigue', description: 'Maintaining movement speed in the third set of competitive matches', why: 'Speed retention under fatigue is a direct competitive differentiator at the performance level.', pathway: 'fitness' },
      { rank: 3, label: 'Physical Preparation Structure', description: 'Building a structured warm-up, warm-down, and recovery routine', why: 'Physical preparation structure is the discipline foundation that supports a full competitive schedule.', pathway: 'fitness' },
    ],
    developing: [
      { rank: 1, label: 'Explosive Movement', description: 'Maximizing explosive first step and directional change', why: 'Explosive movement creates time advantages that make advanced patterns possible under competition pressure.', pathway: 'fitness' },
      { rank: 2, label: 'Competition Load Management', description: 'Managing training and competition loads across a full season', why: 'Load management at this level is the difference between sustainable development and injury-interrupted progress.', pathway: 'fitness' },
      { rank: 3, label: 'Athletic Versatility', description: 'Developing multi-directional athleticism for varied court surfaces and conditions', why: 'Athletic versatility enables consistent performance across the range of competitive environments.', pathway: 'fitness' },
    ],
    established: [
      { rank: 1, label: 'Peak Physical Performance', description: 'Optimizing all physical components for competitive peak performance', why: 'At the high performance level, physical performance is a primary differentiator in close matches.', pathway: 'fitness' },
      { rank: 2, label: 'Recovery Optimization', description: 'Maximizing training adaptation and between-match recovery', why: 'Recovery optimization determines how much of each training session and each match carries over into improvement.', pathway: 'fitness' },
      { rank: 3, label: 'Longevity Planning', description: 'Building the physical foundations for a long, injury-free career', why: 'Physical longevity planning is the most important physical investment at the high performance level.', pathway: 'fitness' },
    ],
  },
}

// ── MENTAL PERFORMANCE PATH priorities ───────────────────────────────────────

const MENTAL_PRIORITIES: Record<StageTier, Record<'emerging' | 'developing' | 'established', DevelopmentPriority[]>> = {
  foundation: {
    emerging: [
      { rank: 1, label: 'Confidence', description: 'Building a positive self-image as a tennis player', why: 'Confidence at the foundation level determines whether a player continues to develop or disengages from the sport.', pathway: 'mental' },
      { rank: 2, label: 'Coachability', description: 'Developing the habit of listening, trying, and adjusting', why: 'Coachability is the multiplier that determines how much value the player gets from every practice.', pathway: 'mental' },
      { rank: 3, label: 'Enjoyment', description: 'Staying connected to the fun of playing and competing', why: 'Enjoyment at this stage is the single most important predictor of long-term development.', pathway: 'mental' },
    ],
    developing: [
      { rank: 1, label: 'Resilience', description: 'Recovering quickly from mistakes and lost points', why: 'Resilience in the face of mistakes determines whether practice reps turn into learning rather than frustration.', pathway: 'mental' },
      { rank: 2, label: 'Focus', description: 'Bringing full attention to the current point rather than past or future', why: 'Present-point focus is the mental foundation of consistent performance under competition conditions.', pathway: 'mental' },
      { rank: 3, label: 'Positive Self-Talk', description: 'Building awareness of internal dialogue and choosing constructive responses', why: 'Positive self-talk is a trainable skill that compounds with experience.', pathway: 'mental' },
    ],
    established: [
      { rank: 1, label: 'Competitive Desire', description: 'Channeling competitiveness into focused effort rather than frustration', why: 'Competitive desire needs direction at this stage — players who learn to use it rather than be used by it develop faster.', pathway: 'mental' },
      { rank: 2, label: 'Pre-Point Routine', description: 'Developing a consistent between-point routine for composure and reset', why: 'Pre-point routines convert the gap between points from anxiety time into preparation time.', pathway: 'mental' },
      { rank: 3, label: 'Practice Quality Mindset', description: 'Approaching practice with intentionality rather than going through the motions', why: 'Practice quality mindset determines the return on coaching investment at every session.', pathway: 'mental' },
    ],
  },
  development: {
    emerging: [
      { rank: 1, label: 'Confidence', description: 'Rebuilding match confidence after early competition challenges', why: 'Many Orange-level players experience a confidence dip as competition increases. Early support accelerates recovery.', pathway: 'mental' },
      { rank: 2, label: 'Composure Under Pressure', description: 'Staying calm and making quality decisions on high-pressure points', why: 'Composure is the mental skill most directly tied to competition performance at this level.', pathway: 'mental' },
      { rank: 3, label: 'Growth Mindset', description: 'Responding to challenges as learning opportunities rather than threats', why: 'Growth mindset is the mental foundation that determines whether competition pressure creates development or stagnation.', pathway: 'mental' },
    ],
    developing: [
      { rank: 1, label: 'Match Focus', description: 'Maintaining tactical focus across full matches including third sets', why: 'Match focus depletion is the most common mental performance gap at the developing Orange level.', pathway: 'mental' },
      { rank: 2, label: 'Winning Mentality', description: 'Developing the expectation of winning and the approach to close opportunities', why: 'Winning mentality determines whether a player fights for every point or allows close matches to slip.', pathway: 'mental' },
      { rank: 3, label: 'Serve Pressure Management', description: 'Staying confident and decisive under double-fault pressure', why: 'Serve pressure management is the single most common mental performance gap in competition.', pathway: 'mental' },
    ],
    established: [
      { rank: 1, label: 'Mental Toughness', description: 'Competing at full intensity even when behind, tired, or frustrated', why: 'Mental toughness is the performance differentiator that determines results when all other factors are equal.', pathway: 'mental' },
      { rank: 2, label: 'Pre-Match Preparation', description: 'Developing a structured pre-match mental routine for optimal performance state', why: 'Pre-match preparation sets the mental foundation for everything that follows in a match.', pathway: 'mental' },
      { rank: 3, label: 'Adversity Response', description: 'Handling bad line calls, bad conditions, and bad opponents with professionalism', why: 'Adversity response determines whether external disruptions remain external or become internal performance saboteurs.', pathway: 'mental' },
    ],
  },
  performance: {
    emerging: [
      { rank: 1, label: 'Performance Mindset', description: 'Bringing peak mental performance consistently regardless of opponent, conditions, or score', why: 'Performance mindset is the mental foundation of all elite competitive development.', pathway: 'mental' },
      { rank: 2, label: 'Pressure Enjoyment', description: 'Finding energy and engagement rather than anxiety in high-pressure moments', why: 'Players who enjoy pressure moments compete better and develop faster in high-intensity environments.', pathway: 'mental' },
      { rank: 3, label: 'Competitive Identity', description: 'Developing a strong, stable sense of identity as a competitor', why: 'Competitive identity stabilizes performance across wins and losses and is the foundation of longevity.', pathway: 'mental' },
    ],
    developing: [
      { rank: 1, label: 'Process Focus', description: 'Staying committed to execution quality regardless of score or outcome', why: 'Process focus is the mental discipline that converts quality practice into consistent match performance.', pathway: 'mental' },
      { rank: 2, label: 'Emotional Intelligence', description: 'Understanding and managing emotional responses during competition', why: 'Emotional intelligence determines whether a player performs their best or becomes reactive under pressure.', pathway: 'mental' },
      { rank: 3, label: 'Competitive Consistency', description: 'Showing up with full competitive effort in every match regardless of ranking or expectations', why: 'Competitive consistency is the mental habit that creates the match volume needed for elite development.', pathway: 'mental' },
    ],
    established: [
      { rank: 1, label: 'Elite Mentality', description: 'Competing with the expectation and belief of high performance', why: 'Elite mentality is self-reinforcing — players who expect to compete well do compete well more consistently.', pathway: 'mental' },
      { rank: 2, label: 'Leadership', description: 'Taking ownership of performance and bringing energy to the team environment', why: 'Leadership at this level creates the competitive environment that accelerates development for everyone around the player.', pathway: 'mental' },
      { rank: 3, label: 'Resilience Under Adversity', description: 'Competing at a high level through injury, loss streaks, and competitive plateaus', why: 'Long-term competitive resilience is the ultimate differentiator in a career of any length.', pathway: 'mental' },
    ],
  },
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate 3 priorities for each of 4 development pathways.
 * Deterministic — no AI, no side effects.
 *
 * @param scores Assessment scores (any may be null)
 * @param stage Curriculum stage key (defaults to 'orange_development')
 */
export function generateBlueprintPriorities(
  scores: AssessmentScores,
  stage: CurriculumStage = 'orange_development',
): BlueprintPriorities {
  const st = stageTier(stage)

  const skillTier = tier(scores.technical_score)
  const compTier = tier(
    scores.competition_score !== null
      ? (scores.competition_score + (scores.tactical_score ?? 5)) / 2
      : scores.tactical_score,
  )
  const fitnessTier = tier(scores.movement_score)
  const mentalTier = tier(scores.behavioral_score)

  return {
    skill:       SKILL_PRIORITIES[st][skillTier],
    competition: COMPETITION_PRIORITIES[st][compTier],
    fitness:     FITNESS_PRIORITIES[st][fitnessTier],
    mental:      MENTAL_PRIORITIES[st][mentalTier],
  }
}

/**
 * Generate a single top priority per pathway (used for the 30-day plan).
 */
export function getTopPriorities(priorities: BlueprintPriorities): {
  skill: DevelopmentPriority
  competition: DevelopmentPriority
  fitness: DevelopmentPriority
  mental: DevelopmentPriority
} {
  return {
    skill:       priorities.skill[0],
    competition: priorities.competition[0],
    fitness:     priorities.fitness[0],
    mental:      priorities.mental[0],
  }
}
