// Ball-Level Assessment Template Seed Definitions
// Defines Red Ball, Orange Ball, Green Dot, and Yellow Ball assessment templates.
// Used by seedBallLevelTemplatesAction.ts to populate assessment_templates,
// assessment_template_sections, and assessment_template_skills tables.
// No DB calls here — pure data definitions.

export interface SeedSkill {
  skill_key: string
  display_name: string
  sort_order: number
  is_required: boolean
  appears_in_quick: boolean
  appears_in_standard: boolean
  appears_in_deep: boolean
  scoring_scale: '1_10' | '1_5' | 'pass_fail'
  coach_guidance: string | null
}

export interface SeedSection {
  section_key: string
  display_name: string
  sort_order: number
  pathway_category: string | null
  coach_guidance: string | null
  skills: SeedSkill[]
}

export interface BallLevelTemplateSeed {
  name: string
  description: string
  platform_version: string
  sections: SeedSection[]
}

// ─── Red Ball Assessment ──────────────────────────────────────────────────────

export const RED_BALL_TEMPLATE: BallLevelTemplateSeed = {
  name: 'Red Ball Assessment',
  description: 'Foundation-stage assessment for Red Ball players. Covers movement, ball tracking, stroke foundations, serve, and learning behaviors.',
  platform_version: '1.0',
  sections: [
    {
      section_key: 'movement_foundations',
      display_name: 'Movement Foundations',
      sort_order: 1,
      pathway_category: 'movement',
      coach_guidance: 'Observe natural movement patterns. Look for balance and directional control.',
      skills: [
        { skill_key: 'balance', display_name: 'Balance', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Can the player hold a stable base position while tracking the ball?' },
        { skill_key: 'running', display_name: 'Running', sort_order: 2, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player run toward the ball with reasonable coordination?' },
        { skill_key: 'stopping', display_name: 'Stopping', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Can the player brake and set before contact?' },
        { skill_key: 'direction_changes', display_name: 'Direction Changes', sort_order: 4, is_required: false, appears_in_quick: false, appears_in_standard: false, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player change direction without losing balance?' },
      ],
    },
    {
      section_key: 'ball_tracking',
      display_name: 'Ball Tracking',
      sort_order: 2,
      pathway_category: 'technical',
      coach_guidance: 'Red Ball players must learn to read the ball early. Tracking is a prerequisite for stroke development.',
      skills: [
        { skill_key: 'tracking', display_name: 'Tracking', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player watch the ball all the way to the racket?' },
        { skill_key: 'catching', display_name: 'Catching', sort_order: 2, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Can the player catch a soft toss reliably?' },
        { skill_key: 'judging_bounce', display_name: 'Judging Bounce', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player position correctly relative to the bounce?' },
      ],
    },
    {
      section_key: 'stroke_foundations',
      display_name: 'Stroke Foundations',
      sort_order: 3,
      pathway_category: 'technical',
      coach_guidance: 'Focus on contact quality and finish, not technique perfection at this stage.',
      skills: [
        { skill_key: 'forehand', display_name: 'Forehand', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Is the grip reasonable and does the player make consistent contact?' },
        { skill_key: 'backhand', display_name: 'Backhand', sort_order: 2, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player make contact on the backhand side with control?' },
        { skill_key: 'contact', display_name: 'Contact Quality', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'How clean and consistent is the contact point?' },
        { skill_key: 'finish', display_name: 'Finish / Follow-through', sort_order: 4, is_required: false, appears_in_quick: false, appears_in_standard: false, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player complete the swing through the contact zone?' },
      ],
    },
    {
      section_key: 'serve_foundations',
      display_name: 'Serve Foundations',
      sort_order: 4,
      pathway_category: 'technical',
      coach_guidance: 'Red Ball serve is about rhythm and toss consistency, not power.',
      skills: [
        { skill_key: 'toss', display_name: 'Toss', sort_order: 1, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Can the player toss the ball to a repeatable spot?' },
        { skill_key: 'serve_contact', display_name: 'Contact', sort_order: 2, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player make consistent racket-ball contact on the serve?' },
        { skill_key: 'serve_rhythm', display_name: 'Rhythm', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: false, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Is there a fluid motion connecting the preparation, toss, and swing?' },
      ],
    },
    {
      section_key: 'learning_behaviors',
      display_name: 'Learning Behaviors',
      sort_order: 5,
      pathway_category: 'behavioral',
      coach_guidance: 'At Red Ball, behavioral readiness is as important as physical skills.',
      skills: [
        { skill_key: 'listening', display_name: 'Listening', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player listen and follow basic instructions?' },
        { skill_key: 'effort', display_name: 'Effort', sort_order: 2, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player try hard and stay engaged?' },
        { skill_key: 'sportsmanship', display_name: 'Sportsmanship', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Is the player kind and fair with others?' },
        { skill_key: 'coachability', display_name: 'Coachability', sort_order: 4, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player respond to corrections and try to adjust?' },
      ],
    },
  ],
}

// ─── Orange Ball Assessment ───────────────────────────────────────────────────

export const ORANGE_BALL_TEMPLATE: BallLevelTemplateSeed = {
  name: 'Orange Ball Assessment',
  description: 'Development-stage assessment for Orange Ball players. Covers technical skills, movement, tactical awareness, competition readiness, and behavior.',
  platform_version: '1.0',
  sections: [
    {
      section_key: 'technical',
      display_name: 'Technical',
      sort_order: 1,
      pathway_category: 'technical',
      coach_guidance: 'Orange Ball players should have foundational strokes. Look for consistency and basic directional control.',
      skills: [
        { skill_key: 'forehand', display_name: 'Forehand', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Grip, swing path, contact, and basic consistency.' },
        { skill_key: 'backhand', display_name: 'Backhand', sort_order: 2, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'One or two-handed — is the player comfortable and making contact?' },
        { skill_key: 'serve', display_name: 'Serve', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Toss, contact, and in-court consistency.' },
        { skill_key: 'volley', display_name: 'Volley', sort_order: 4, is_required: false, appears_in_quick: false, appears_in_standard: false, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Can the player block or punch a volley from close range?' },
      ],
    },
    {
      section_key: 'movement',
      display_name: 'Movement',
      sort_order: 2,
      pathway_category: 'movement',
      coach_guidance: 'Can the player move, recover, and arrive in balance?',
      skills: [
        { skill_key: 'recovery', display_name: 'Recovery', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Does the player recover to center after each shot?' },
        { skill_key: 'positioning', display_name: 'Positioning', sort_order: 2, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Is the player in a reasonable position before the ball arrives?' },
        { skill_key: 'balance', display_name: 'Balance', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Does the player stay balanced through contact?' },
      ],
    },
    {
      section_key: 'tactical',
      display_name: 'Tactical',
      sort_order: 3,
      pathway_category: 'tactical',
      coach_guidance: 'Orange Ball tactical awareness centers on direction, consistency, and starting to aim.',
      skills: [
        { skill_key: 'direction', display_name: 'Direction', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Can the player direct the ball cross-court or down the line intentionally?' },
        { skill_key: 'consistency', display_name: 'Consistency', sort_order: 2, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'How many balls in a row can the player keep in play?' },
        { skill_key: 'target_awareness', display_name: 'Target Awareness', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Does the player aim for a target or just rally?' },
      ],
    },
    {
      section_key: 'competition',
      display_name: 'Competition',
      sort_order: 4,
      pathway_category: 'competition',
      coach_guidance: 'Can the player begin to understand and use scoring?',
      skills: [
        { skill_key: 'scoring', display_name: 'Scoring', sort_order: 1, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player understand how to keep score?' },
        { skill_key: 'match_behavior', display_name: 'Match Behavior', sort_order: 2, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player compete with respect and focus?' },
      ],
    },
    {
      section_key: 'behavior',
      display_name: 'Behavior',
      sort_order: 5,
      pathway_category: 'behavioral',
      coach_guidance: null,
      skills: [
        { skill_key: 'focus', display_name: 'Focus', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player stay focused during practice and drills?' },
        { skill_key: 'effort', display_name: 'Effort', sort_order: 2, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player give full effort on every point?' },
        { skill_key: 'coachability', display_name: 'Coachability', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player apply coach feedback during the session?' },
      ],
    },
  ],
}

// ─── Green Dot Assessment ─────────────────────────────────────────────────────

export const GREEN_DOT_TEMPLATE: BallLevelTemplateSeed = {
  name: 'Green Dot Assessment',
  description: 'Performance-stage assessment for Green Dot players. Covers technical depth, court coverage, tactical patterns, competitive play, and behavioral resilience.',
  platform_version: '1.0',
  sections: [
    {
      section_key: 'technical',
      display_name: 'Technical',
      sort_order: 1,
      pathway_category: 'technical',
      coach_guidance: 'Green Dot players should demonstrate all five strokes. Look for reliability under pressure.',
      skills: [
        { skill_key: 'forehand', display_name: 'Forehand', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Spin, depth, and directional control from multiple positions.' },
        { skill_key: 'backhand', display_name: 'Backhand', sort_order: 2, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Groundstroke quality and reliability across the court.' },
        { skill_key: 'serve', display_name: 'Serve', sort_order: 3, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Second serve reliability. Can the player start a point consistently?' },
        { skill_key: 'return', display_name: 'Return', sort_order: 4, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Return of serve quality and placement.' },
        { skill_key: 'volley', display_name: 'Volley', sort_order: 5, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Net approach and volley execution.' },
      ],
    },
    {
      section_key: 'movement',
      display_name: 'Movement',
      sort_order: 2,
      pathway_category: 'movement',
      coach_guidance: 'Green Dot players must cover the full court and recover efficiently.',
      skills: [
        { skill_key: 'court_coverage', display_name: 'Court Coverage', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Does the player reach wide balls and maintain court position?' },
        { skill_key: 'recovery', display_name: 'Recovery', sort_order: 2, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Speed and consistency of recovery after each shot.' },
        { skill_key: 'balance', display_name: 'Balance', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: false, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Contact quality under movement stress.' },
      ],
    },
    {
      section_key: 'tactical',
      display_name: 'Tactical',
      sort_order: 3,
      pathway_category: 'tactical',
      coach_guidance: 'Green Dot players begin building patterns and constructing points.',
      skills: [
        { skill_key: 'direction', display_name: 'Direction', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Intentional shot placement to open the court.' },
        { skill_key: 'depth', display_name: 'Depth', sort_order: 2, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Does the player push the opponent back with depth?' },
        { skill_key: 'rally_patterns', display_name: 'Rally Patterns', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Can the player execute a simple 2–3 ball pattern (e.g., cross-court then DTL)?' },
      ],
    },
    {
      section_key: 'competition',
      display_name: 'Competition',
      sort_order: 4,
      pathway_category: 'competition',
      coach_guidance: null,
      skills: [
        { skill_key: 'scoring', display_name: 'Scoring', sort_order: 1, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Can the player manage score, sides, and serve order independently?' },
        { skill_key: 'problem_solving', display_name: 'Problem Solving', sort_order: 2, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Does the player adjust when something is not working in a match?' },
      ],
    },
    {
      section_key: 'behavior',
      display_name: 'Behavior',
      sort_order: 5,
      pathway_category: 'behavioral',
      coach_guidance: null,
      skills: [
        { skill_key: 'focus', display_name: 'Focus', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: null },
        { skill_key: 'resilience', display_name: 'Resilience', sort_order: 2, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player recover from mistakes without visible disruption?' },
        { skill_key: 'coachability', display_name: 'Coachability', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: null },
      ],
    },
  ],
}

// ─── Yellow Ball Assessment ───────────────────────────────────────────────────

export const YELLOW_BALL_TEMPLATE: BallLevelTemplateSeed = {
  name: 'Yellow Ball Assessment',
  description: 'Competitive-stage assessment for Yellow Ball players. Full technical suite, movement quality, tactical decision-making, match management, mental performance, and behavioral standards.',
  platform_version: '1.0',
  sections: [
    {
      section_key: 'technical',
      display_name: 'Technical',
      sort_order: 1,
      pathway_category: 'technical',
      coach_guidance: 'Full yellow ball technical expectations. Evaluate under match-like pressure.',
      skills: [
        { skill_key: 'forehand', display_name: 'Forehand', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Spin, pace, direction, and consistency under pressure.' },
        { skill_key: 'backhand', display_name: 'Backhand', sort_order: 2, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Reliability as a weapon or neutral shot.' },
        { skill_key: 'serve', display_name: 'Serve', sort_order: 3, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'First serve %, second serve reliability, placement variation.' },
        { skill_key: 'return', display_name: 'Return', sort_order: 4, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Return depth, direction, and neutralizing strong servers.' },
        { skill_key: 'volley', display_name: 'Volley', sort_order: 5, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Net play execution, approach, and put-away.' },
        { skill_key: 'transition', display_name: 'Transition Game', sort_order: 6, is_required: false, appears_in_quick: false, appears_in_standard: false, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Quality of approach shots and mid-court ball handling.' },
      ],
    },
    {
      section_key: 'movement',
      display_name: 'Movement',
      sort_order: 2,
      pathway_category: 'movement',
      coach_guidance: null,
      skills: [
        { skill_key: 'speed', display_name: 'Speed', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'First-step quickness and ability to reach defensive balls.' },
        { skill_key: 'recovery', display_name: 'Recovery', sort_order: 2, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Speed and consistency of recovery to the base position.' },
        { skill_key: 'court_positioning', display_name: 'Court Positioning', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Does the player anticipate and position before the ball arrives?' },
      ],
    },
    {
      section_key: 'tactical',
      display_name: 'Tactical',
      sort_order: 3,
      pathway_category: 'tactical',
      coach_guidance: 'Yellow Ball players should demonstrate intentional point construction.',
      skills: [
        { skill_key: 'pattern_recognition', display_name: 'Pattern Recognition', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Does the player recognize and repeat effective patterns?' },
        { skill_key: 'decision_making', display_name: 'Decision Making', sort_order: 2, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Shot selection quality under time pressure.' },
        { skill_key: 'point_construction', display_name: 'Point Construction', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Can the player build a point through multiple shots to a finish?' },
      ],
    },
    {
      section_key: 'competition',
      display_name: 'Competition',
      sort_order: 4,
      pathway_category: 'competition',
      coach_guidance: null,
      skills: [
        { skill_key: 'match_management', display_name: 'Match Management', sort_order: 1, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Ability to manage pace, score, and self between points.' },
        { skill_key: 'pressure_response', display_name: 'Pressure Response', sort_order: 2, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Does the player raise their level or maintain it on big points?' },
      ],
    },
    {
      section_key: 'mental_performance',
      display_name: 'Mental Performance',
      sort_order: 5,
      pathway_category: 'mental',
      coach_guidance: 'Mental performance is a formal assessment domain at Yellow Ball.',
      skills: [
        { skill_key: 'confidence', display_name: 'Confidence', sort_order: 1, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Does the player trust their shots during pressure situations?' },
        { skill_key: 'resilience', display_name: 'Resilience', sort_order: 2, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'How quickly does the player recover from mistakes or lost sets?' },
        { skill_key: 'emotional_control', display_name: 'Emotional Control', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_10', coach_guidance: 'Is the player calm and composed between and during points?' },
      ],
    },
    {
      section_key: 'behavior',
      display_name: 'Behavior',
      sort_order: 6,
      pathway_category: 'behavioral',
      coach_guidance: null,
      skills: [
        { skill_key: 'effort', display_name: 'Effort', sort_order: 1, is_required: true, appears_in_quick: true, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: null },
        { skill_key: 'responsibility', display_name: 'Responsibility', sort_order: 2, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: 'Does the player own their development and show up prepared?' },
        { skill_key: 'coachability', display_name: 'Coachability', sort_order: 3, is_required: false, appears_in_quick: false, appears_in_standard: true, appears_in_deep: true, scoring_scale: '1_5', coach_guidance: null },
      ],
    },
  ],
}

export const ALL_BALL_LEVEL_TEMPLATES: BallLevelTemplateSeed[] = [
  RED_BALL_TEMPLATE,
  ORANGE_BALL_TEMPLATE,
  GREEN_DOT_TEMPLATE,
  YELLOW_BALL_TEMPLATE,
]
