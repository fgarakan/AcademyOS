export type InterviewField =
  | 'philosophy'
  | 'player_focus'
  | 'development_priorities'
  | 'competition_approach'
  | 'parent_communication_style'
  | 'coach_operating_style'
  | 'ninety_day_success'

export interface InterviewStep {
  id: string
  field: InterviewField
  stepLabel: string
  question: string
  /** Slightly shorter phrasing optimised for text-to-speech playback */
  spokenQuestion: string
  whyItMatters: string
  chips: string[]
}

export const INTERVIEW_STEPS: InterviewStep[] = [
  {
    id: 'philosophy',
    field: 'philosophy',
    stepLabel: 'Academy Identity',
    question: 'When a parent describes your academy to a friend, what do you want them to say you are great at?',
    spokenQuestion: 'When a parent describes your academy, what do you want them to say you are great at?',
    whyItMatters: 'This shapes how Academy OS frames curriculum, priorities, and coach language across the board.',
    chips: [
      'Technical development',
      'Long-term development',
      'Building competitors',
      'Confidence and character',
      'Strong fundamentals first',
    ],
  },
  {
    id: 'player_focus',
    field: 'player_focus',
    stepLabel: 'Player Development',
    question: 'For the young players at your academy, what matters most in the early stages?',
    spokenQuestion: 'For young players at your academy, what matters most first?',
    whyItMatters: 'This helps Academy OS shape how players are assessed, placed, and progressed through levels.',
    chips: [
      'Love the game',
      'Clean fundamentals',
      'Competing habits',
      'Athletic movement',
      'Mental routines',
    ],
  },
  {
    id: 'development_priorities',
    field: 'development_priorities',
    stepLabel: 'Training Structure',
    question: 'How do you usually group players for training — and what should coaches prioritise in each session?',
    spokenQuestion: 'How do you usually group players, and what should coaches focus on in each session?',
    whyItMatters: 'This guides how session plans are structured and how coaches use their training time.',
    chips: [
      'By age',
      'By ball color / level',
      'By skill level',
      'Technical focus first',
      'Match habits throughout',
    ],
  },
  {
    id: 'competition_approach',
    field: 'competition_approach',
    stepLabel: 'Competition Pathway',
    question: 'How early do you want players starting to build real match habits?',
    spokenQuestion: 'How early do you want players learning match habits and competing?',
    whyItMatters: 'This shapes how players are prepared for tournaments and how results are used as learning.',
    chips: [
      'Early — competition is a great teacher',
      'After fundamentals are solid',
      'Only for competitive groups',
      'Depends on the level',
      'Process over results always',
    ],
  },
  {
    id: 'parent_communication_style',
    field: 'parent_communication_style',
    stepLabel: 'Parent Communication',
    question: 'What do you want parents to understand about how progress works at your academy?',
    spokenQuestion: 'What should parents understand about progress at your academy?',
    whyItMatters: 'Academy OS uses this to shape the tone of all parent-facing updates and guidance.',
    chips: [
      'Clear next steps',
      'Progress takes patience',
      'Effort and habits matter most',
      'Level requirements are specific',
      'Parents should support, not coach',
    ],
  },
  {
    id: 'coach_operating_style',
    field: 'coach_operating_style',
    stepLabel: 'Coaching Style',
    question: 'How direct should coaches be when giving feedback to players?',
    spokenQuestion: 'How direct should coaches be with feedback?',
    whyItMatters: 'This helps Academy OS surface the right tools and prompts for your coaching team day to day.',
    chips: [
      'Very direct — players need clear feedback',
      'Encouraging first',
      'Balanced and contextual',
      'Depends on age and level',
      'Questions over corrections',
    ],
  },
  {
    id: 'ninety_day_success',
    field: 'ninety_day_success',
    stepLabel: '90-Day Goal',
    question: 'What would make the first 90 days of Academy OS feel like a real win for you?',
    spokenQuestion: 'What would make the first 90 days with Academy OS feel like a success?',
    whyItMatters: 'This becomes the lens for every setup decision — keeping the system focused on what matters most.',
    chips: [
      'Coaches aligned around the plan',
      'Players placed into clear levels',
      'Parents understand what comes next',
      'Sessions feel more organised',
      'Director has better visibility',
    ],
  },
]
