// Sprint 1095B — Curriculum Level Insight Map
// Static typed insight content for all 15 curriculum levels.
// Used as the primary insight layer until DB level_description / exit_player_profile
// columns are seeded.  Pure TypeScript — no DB calls, no AI, no side effects.

export type LevelKey =
  | 'red1' | 'red2' | 'red3'
  | 'orange1' | 'orange2' | 'orange3'
  | 'green1' | 'green2' | 'green3'
  | 'yellow1' | 'yellow2' | 'yellow3'
  | 'hp1' | 'hp2' | 'hp3'

export interface LevelInsight {
  levelKey: LevelKey
  stage: string          // matches curriculum_stage enum value
  levelNumber: number    // 1, 2, or 3
  directorGoal: string
  exitPlayerProfile: string
  focusAreas: string[]
  readinessSignals: string[]
  commonBlockers: string[]
  parentSafeSummary: string
  donnaPrompt: string
}

export const CURRICULUM_LEVEL_INSIGHT_MAP: Record<LevelKey, LevelInsight> = {

  // ── RED BALL ─────────────────────────────────────────────────────────────────

  red1: {
    levelKey: 'red1',
    stage: 'red_foundation',
    levelNumber: 1,
    directorGoal:
      'Build the athletic foundation and first consistent ball contact. The player enters as an athlete; exits as a beginner tennis player.',
    exitPlayerProfile:
      'Can rally 4–6 consecutive balls with a coach using a correct grip, tracks the ball visually before contact, recovers to starting position after each shot, and engages cooperatively in group activities for a full session.',
    focusAreas: [
      'Hand-eye coordination and ball tracking',
      'Correct grip and basic swing path',
      'Athletic movement and recovery steps',
      'Cooperative play and sustained focus',
    ],
    readinessSignals: [
      'Consistent ball contact with correct grip under guided repetition',
      'Demonstrates athletic ready position between shots',
      'Engages cooperatively with peers for the full session',
      'Follows basic rally rules with a coach feed',
    ],
    commonBlockers: [
      'Inconsistent grip — racquet face keeps changing',
      'Ball-tracking difficulty (looking at racquet, not ball)',
      'Short attention span in group settings',
    ],
    parentSafeSummary:
      'Your child is building the athletic foundation for tennis — coordination, ball tracking, and first contact skills. Sessions are game-based and focused on movement and fun.',
    donnaPrompt: 'What are the Red 1 Foundation gates and what does readiness for Red 2 look like?',
  },

  red2: {
    levelKey: 'red2',
    stage: 'red_foundation',
    levelNumber: 2,
    directorGoal:
      'Develop a repeatable forehand and backhand with correct grip awareness, basic court positioning, and simple rally patterns with a coach.',
    exitPlayerProfile:
      'Can sustain a 6–8 ball cooperative rally from the baseline, demonstrates forehand and backhand with correct grip and swing path, understands basic scoring, and shows early footwork and court positioning awareness.',
    focusAreas: [
      'Forehand and backhand with correct grip and swing path',
      'Basic court positioning and recovery',
      'Cooperative baseline rallying (6–8 balls)',
      'Introduction to basic scoring and rules',
    ],
    readinessSignals: [
      'Drop-hit rally with coach to target zone (3+ shots)',
      'Correct grip maintained consistently during play',
      'Basic split-step timing on opponent contact',
      'Understands basic scoring (love, 15, 30, deuce)',
    ],
    commonBlockers: [
      'Grip reverting under fatigue or fast balls',
      'Footwork limited — stationary hitting habits forming',
      'Difficulty maintaining rally consistency past 4 balls',
    ],
    parentSafeSummary:
      'Your child is developing a repeatable forehand and backhand, learning to position on court, and building basic rally consistency. Technique habits formed here carry through the whole program.',
    donnaPrompt: 'What does a Red 2 Intermediate player need before moving to Red 3?',
  },

  red3: {
    levelKey: 'red3',
    stage: 'red_foundation',
    levelNumber: 3,
    directorGoal:
      'Complete the Red Ball foundation. Players exit able to compete on a mini-court, sustain a 6+ ball rally, understand basic scoring, and are assessed for Orange Ball readiness.',
    exitPlayerProfile:
      'Can sustain a 6+ ball rally cross-court or down-the-line from baseline, demonstrates basic serve mechanics with a clear trophy position, understands match scoring, and shows the emotional regulation to compete in short match formats.',
    focusAreas: [
      'Rally consistency and court direction (cross-court vs down-the-line)',
      'Basic serve mechanics and trophy position',
      'Mini-match play and scoring understanding',
      'Emotional regulation in competitive situations',
    ],
    readinessSignals: [
      '6+ ball baseline rally with direction control',
      'Serve with recognisable trophy position and consistent toss',
      'Completes a mini-match set with correct scoring',
      'Shows composure after errors — does not disengage',
    ],
    commonBlockers: [
      'Serve mechanics not yet consistent — toss or contact unreliable',
      'Emotional dysregulation in early match play',
      'Direction control inconsistent at rally pace',
    ],
    parentSafeSummary:
      'Your child is completing the Red Ball stage. They are learning to compete in small match formats and developing the consistency and composure needed for the Orange Ball transition.',
    donnaPrompt: 'What are the readiness criteria for moving from Red Ball to Orange Ball?',
  },

  // ── ORANGE BALL ───────────────────────────────────────────────────────────────

  orange1: {
    levelKey: 'orange1',
    stage: 'orange_development',
    levelNumber: 1,
    directorGoal:
      'Establish consistent stroke mechanics on a mid-court. Players move to orange felt balls with a longer court and begin to develop real groundstroke quality.',
    exitPlayerProfile:
      'Can rally 8+ balls cross-court from mid-court with correct contact point, swing path, and recovery steps. Footwork patterns are visible and consistent during cooperative play.',
    focusAreas: [
      'Groundstroke contact point and swing path',
      'Footwork and recovery after each shot',
      'Rally consistency at mid-court distance',
      'Introduction to basic tactical patterns',
    ],
    readinessSignals: [
      'Cross-court rally with coach: 8+ consecutive balls',
      'Correct contact point on forehand and backhand',
      'Split-step timing consistent with coach contact',
      'Recovery footwork visible after each groundstroke',
    ],
    commonBlockers: [
      'Contact point inconsistency — hitting late or too early',
      'Recovery footwork absent — static position forming',
      'Struggling with increased distance and speed of orange ball',
    ],
    parentSafeSummary:
      'Your child is developing real stroke mechanics at a mid-court distance. The focus is on building quality contact and footwork habits that will support all future development.',
    donnaPrompt: 'What are the Orange 1 Foundation mechanics focus areas and readiness gates?',
  },

  orange2: {
    levelKey: 'orange2',
    stage: 'orange_development',
    levelNumber: 2,
    directorGoal:
      'Build rally depth, tactical patterns (cross-court and down-the-line), and introduce serve mechanics. This is the core development level for most junior programs.',
    exitPlayerProfile:
      'Can sustain a 10-ball rally with depth and direction control, demonstrates a consistent serve with reliable toss and clean contact, understands and executes basic cross-court/down-the-line patterns under game conditions.',
    focusAreas: [
      'Rally depth and direction control',
      'Serve mechanics — toss, contact, and consistency',
      'Cross-court and down-the-line tactical patterns',
      'Basic point play and shot selection',
    ],
    readinessSignals: [
      '10-ball rally with target zone accuracy',
      'Consistent serve with reliable toss and clean contact',
      'Cross-court vs down-the-line pattern execution under game pressure',
      'Basic point construction understanding (opening, finishing)',
    ],
    commonBlockers: [
      'Serve inconsistency — toss or contact reliability not yet there',
      'Tactical patterns break down under competitive pressure',
      'Depth control — balls consistently short in cooperative play',
    ],
    parentSafeSummary:
      'Your child is in the core development stage of junior tennis. Rally consistency, serve mechanics, and first tactical patterns are the priority. Most time will be spent here before advancing.',
    donnaPrompt: 'What does Orange 2 Intermediate focus on and what does readiness for Orange 3 look like?',
  },

  orange3: {
    levelKey: 'orange3',
    stage: 'orange_development',
    levelNumber: 3,
    directorGoal:
      'Prepare players for full-court Yellow Ball play. Introduce tournament play, consistent serve under game conditions, and tactical pattern execution in competitive points.',
    exitPlayerProfile:
      'Can rally 10+ balls consistently, executes a reliable serve with tactical placement awareness, demonstrates cross-court and down-the-line patterns under competitive conditions, and has completed initial tournament experience.',
    focusAreas: [
      'Consistent serve with tactical placement',
      'Tactical pattern execution under game pressure',
      'Tournament introduction and match composure',
      'Transition readiness for full-court play',
    ],
    readinessSignals: [
      'Consistent serve with directional control under game conditions',
      '10-ball baseline rally with pattern intention',
      'Demonstrated composure across 2–3 match formats',
      'Tactical pattern execution in point play (not just cooperative)',
    ],
    commonBlockers: [
      'Match composure — inconsistent under competitive pressure',
      'Serve placement still unreliable in game situations',
      'Physical readiness for full-court volume not yet there',
    ],
    parentSafeSummary:
      'Your child is entering first competitive tennis environments. Match experience, composure under pressure, and preparation for full-court play are the focus.',
    donnaPrompt: 'What are the Orange to Yellow transition gates and what does the assessment look like?',
  },

  // ── GREEN BALL ────────────────────────────────────────────────────────────────

  green1: {
    levelKey: 'green1',
    stage: 'green_performance',
    levelNumber: 1,
    directorGoal:
      'Establish full-court consistency under pressure. Players refine groundstrokes at full-court distance, develop approach shots, and begin net play.',
    exitPlayerProfile:
      'Can rally 10+ balls cross-court and down-the-line from the full baseline, demonstrates consistent approach shots and basic net play, and competes in short point formats with tactical intention.',
    focusAreas: [
      'Full-court groundstroke consistency under pressure',
      'Approach shots and basic net play',
      'Point construction and tactical decision-making',
      'Physical capacity to train at full-court volume',
    ],
    readinessSignals: [
      'Cross-court rally at full baseline: 10+ balls',
      'Approach shot with controlled direction and depth',
      'Basic volley execution from net position',
      'Completes point play sets with tactical intention',
    ],
    commonBlockers: [
      'Loss of technique at full-court pace — contact point regresses',
      'Net play avoidance — approach and stop at service line',
      'Physical endurance limiting training volume',
    ],
    parentSafeSummary:
      'Your child is developing full-court tennis skills and beginning competitive play. Consistency, court coverage, and tactical awareness are the key focus areas.',
    donnaPrompt: 'What are the Green 1 Foundation gates and how does the green ball stage progress?',
  },

  green2: {
    levelKey: 'green2',
    stage: 'green_performance',
    levelNumber: 2,
    directorGoal:
      'Refine tactical patterns and introduce second-ball attack. Players develop point construction, physical training volume, and competitive match preparation.',
    exitPlayerProfile:
      'Demonstrates consistent serve with second-serve reliability, executes tactical patterns (cross-court → down-the-line combination, approach-volley sequence) under match pressure, and maintains technique through multi-set matches.',
    focusAreas: [
      'Second-serve reliability and tactical placement',
      'Cross-court → down-the-line combination patterns',
      'Approach-volley sequence under game conditions',
      'Multi-set match endurance and mental consistency',
    ],
    readinessSignals: [
      'Second serve with reliable placement under pressure',
      'Tactical combination patterns executed in point play',
      'Maintains technique through 2-hour training sessions',
      'Competitive match play with consistent tactical decision-making',
    ],
    commonBlockers: [
      'Second serve breaks down under pressure — double fault tendency',
      'Tactical patterns collapse in real match situations',
      'Physical fatigue causing technique regression in later sets',
    ],
    parentSafeSummary:
      'Your child is developing advanced tennis skills, competitive match experience, and the mental and physical strength to perform consistently at a higher level.',
    donnaPrompt: 'What does Green 2 Intermediate focus on and what does the exit assessment require?',
  },

  green3: {
    levelKey: 'green3',
    stage: 'green_performance',
    levelNumber: 3,
    directorGoal:
      'Complete the green ball performance stage. Players enter regional tournament competition, demonstrate consistent patterns under match pressure, and are assessed for Yellow Ball readiness.',
    exitPlayerProfile:
      'Competes consistently in regional tournaments, maintains tactical execution and emotional regulation across full match sets, demonstrates strength and endurance appropriate for Yellow Ball training volume.',
    focusAreas: [
      'Regional tournament performance and match management',
      'Emotional regulation across full match sets',
      'Physical preparation for increased Yellow Ball volume',
      'Performance-based assessment readiness',
    ],
    readinessSignals: [
      'Completed 3+ regional tournament matches with consistent performance',
      'Emotional regulation maintained across full match sets',
      'Physical readiness metrics at Yellow Ball training baseline',
      'Assessment score meets advance_min_assessment_score threshold',
    ],
    commonBlockers: [
      'Tournament consistency — different performance in matches vs training',
      'Mental game — emotional dysregulation in close matches',
      'Physical readiness — not yet at Yellow Ball training volume',
    ],
    parentSafeSummary:
      'Your child is in regional tournament competition and preparing for the transition to full competitive tennis. Focus is on match performance, mental strength, and physical preparation.',
    donnaPrompt: 'What are the Green to Yellow transition requirements and what does a ready player look like?',
  },

  // ── YELLOW BALL ───────────────────────────────────────────────────────────────

  yellow1: {
    levelKey: 'yellow1',
    stage: 'yellow_competitive',
    levelNumber: 1,
    directorGoal:
      'Establish full-court yellow ball competency. Players develop depth and direction on all groundstrokes, serve-and-return patterns, and begin approach shot and mental performance work.',
    exitPlayerProfile:
      'Demonstrates consistent depth and direction on forehand and backhand from full baseline, reliable first serve with tactical placement, serve-and-return pattern awareness, and mental performance work has begun.',
    focusAreas: [
      'Groundstroke depth and direction at full pace',
      'First serve tactical placement and reliability',
      'Serve-and-return pattern development',
      'Mental performance — composure and focus habits',
    ],
    readinessSignals: [
      'Baseline rally with depth and direction under competitive pressure',
      'First serve placement consistent across game situations',
      'Serve-and-return pattern execution in point play',
      'Completes mental performance log and reflection work',
    ],
    commonBlockers: [
      'Power vs control balance — pace increasing but accuracy dropping',
      'First serve breakdown under pressure — reverting to safe push',
      'Mental performance inconsistency — not yet a habit',
    ],
    parentSafeSummary:
      'Your child is playing full yellow ball competitive tennis. Depth, direction, serve quality, and mental performance habits are the priority. Tournament experience is regular.',
    donnaPrompt: 'What are the Yellow 1 Foundation development priorities and readiness gates?',
  },

  yellow2: {
    levelKey: 'yellow2',
    stage: 'yellow_competitive',
    levelNumber: 2,
    directorGoal:
      'Develop tactical identity and competitive consistency. Players build pattern play, second-ball attack, volley mechanics, and begin performance data tracking from competition.',
    exitPlayerProfile:
      'Has developed a clear tactical identity (dominant pattern), demonstrates second-ball attack execution in matches, reliable volley under pressure, and tournament results and data inform curriculum decisions.',
    focusAreas: [
      'Tactical identity and dominant pattern development',
      'Second-ball attack — transition from rally to attack',
      'Volley mechanics and net approach confidence',
      'Competition data analysis and curriculum integration',
    ],
    readinessSignals: [
      'Tactical identity visible — consistent pattern across matches',
      'Second-ball attack executed in real match situations',
      'Volley reliable under competitive net approaches',
      'Competition data reviewed and informing training focus',
    ],
    commonBlockers: [
      'Tactical pattern too predictable — opponent adaptation',
      'Second-ball attack rushed — net errors replacing baseline consistency',
      'Volley technical reliability under pressure not yet there',
    ],
    parentSafeSummary:
      'Your child is developing a tactical identity and competitive consistency. Match performance data is being used to guide training, and the program is becoming increasingly individualised.',
    donnaPrompt: 'What does Yellow 2 Intermediate develop and how does tournament performance inform curriculum?',
  },

  yellow3: {
    levelKey: 'yellow3',
    stage: 'yellow_competitive',
    levelNumber: 3,
    directorGoal:
      'Final competitive development stage before elite. Players work on tactical depth, serve variety, net game, and mental skills. Assessment is performance-based and competition-data informed.',
    exitPlayerProfile:
      'Tournament-active at regional/national level, demonstrates serve variety (pace, spin, placement), advanced tactical patterns, consistent net game, and mental skills sufficient for high-pressure match situations.',
    focusAreas: [
      'Serve variety — pace, spin, and placement combinations',
      'Advanced tactical patterns — reading and adjusting in real time',
      'Net game confidence in all surface situations',
      'Mental skills for high-pressure national-level matches',
    ],
    readinessSignals: [
      'Serve variety executed consistently in match situations',
      'Advanced pattern adjustment visible against different opponent styles',
      'Net game confidence across point situations',
      'National-level competition performance meets HP entry thresholds',
    ],
    commonBlockers: [
      'Serve variety development vs. serve reliability — consistency drops',
      'Pattern rigidity — cannot adjust to different opponent styles',
      'Physical preparation gap for HP training volume',
    ],
    parentSafeSummary:
      'Your child is in the final competitive development stage. The program is highly individualised, nationally competitive, and preparing for the High Performance pathway.',
    donnaPrompt: 'What are the Yellow to High Performance transition requirements and assessment criteria?',
  },

  // ── HIGH PERFORMANCE ──────────────────────────────────────────────────────────

  hp1: {
    levelKey: 'hp1',
    stage: 'high_performance',
    levelNumber: 1,
    directorGoal:
      'Pre-elite entry. Introduce physical periodization, advanced tactical game plan development, and national-level competition preparation.',
    exitPlayerProfile:
      'Competes at national level with consistent results, has completed a full periodization cycle, demonstrates advanced tactical game planning for specific opponents, and physical metrics meet HP2 thresholds.',
    focusAreas: [
      'Physical periodization — planned load, recovery, and peak cycles',
      'Advanced tactical game plan development',
      'National competition performance and consistency',
      'Individual skill refinement based on competition data',
    ],
    readinessSignals: [
      'National competition results demonstrate consistent performance',
      'Physical periodization cycle completed with tracked metrics',
      'Opponent-specific tactical game plan executed in match',
      'Physical metrics meet HP2 entry thresholds',
    ],
    commonBlockers: [
      'Physical periodization compliance — training load management',
      'Tactical game planning still reactive rather than proactive',
      'Injury risk from volume increase without proper periodization',
    ],
    parentSafeSummary:
      'Your child is in the High Performance pathway. The program is elite-level, individualised, and nationally competitive. Physical load management and tactical depth are the priority.',
    donnaPrompt: 'What does HP 1 Foundation require and how does it differ from Yellow Ball development?',
  },

  hp2: {
    levelKey: 'hp2',
    stage: 'high_performance',
    levelNumber: 2,
    directorGoal:
      'Elite development. Detailed technical refinement, tactical opposition analysis, and performance tracking at national and international level.',
    exitPlayerProfile:
      'International or high-level national competitor, demonstrating technical refinement from video and data analysis, detailed opponent preparation, and co-designed curriculum with director and coach.',
    focusAreas: [
      'Technical refinement from video and performance data',
      'Detailed opponent analysis and match preparation',
      'International competition experience',
      'Co-designed curriculum — player is an active partner',
    ],
    readinessSignals: [
      'International competition results at appropriate level',
      'Technical refinement implemented from video analysis',
      'Opponent-specific preparation completed for major tournaments',
      'Player demonstrates self-direction and analysis capability',
    ],
    commonBlockers: [
      'Physical burnout risk — elite volume requires expert load management',
      'Technical refinement vs competition disruption — timing is critical',
      'Mental health and travel demands at elite level',
    ],
    parentSafeSummary:
      'Your child is at elite development level. The curriculum is co-designed with the player and informed by international competition data.',
    donnaPrompt: 'What does HP 2 Intermediate focus on and how does curriculum become individualised at this stage?',
  },

  hp3: {
    levelKey: 'hp3',
    stage: 'high_performance',
    levelNumber: 3,
    directorGoal:
      'Professional preparation level. Curriculum is fully individualised and competition-driven. DONNA can help track performance gaps and surface proposed adjustments for director review.',
    exitPlayerProfile:
      'Professional or transitioning to professional. Curriculum is athlete-led, competition-informed, and coach-supported. Every element of development is driven by performance data and individual goals.',
    focusAreas: [
      'Fully individualised and competition-driven curriculum',
      'Professional match preparation and performance analysis',
      'Physical and mental resilience for professional schedule',
      'Transition planning — professional pathway or career development',
    ],
    readinessSignals: [
      'Professional-level competition with consistent results',
      'Self-direction — athlete leads curriculum decisions',
      'Comprehensive performance analysis and data tracking',
      'Professional transition plan or equivalent pathway defined',
    ],
    commonBlockers: [
      'Professional schedule complexity — travel, fatigue, recovery',
      'Injury management at elite volume',
      'Psychological demands of full professional environment',
    ],
    parentSafeSummary:
      'Your child is at the professional preparation level. The development plan is fully individualised and driven by their professional goals and competition performance.',
    donnaPrompt: 'What does HP 3 Matchplay require and how does DONNA assist at the elite level?',
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function getLevelInsight(
  stage: string,
  levelNumber: number,
): LevelInsight | null {
  const stagePrefix: Record<string, string> = {
    red_foundation:     'red',
    orange_development: 'orange',
    green_performance:  'green',
    yellow_competitive: 'yellow',
    high_performance:   'hp',
  }
  const prefix = stagePrefix[stage]
  if (!prefix) return null
  const key = `${prefix}${levelNumber}` as LevelKey
  return CURRICULUM_LEVEL_INSIGHT_MAP[key] ?? null
}
