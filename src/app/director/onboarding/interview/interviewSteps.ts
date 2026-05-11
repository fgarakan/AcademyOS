export type InterviewField =
  | 'philosophy'
  | 'player_focus'
  | 'development_priorities'
  | 'competition_approach'
  | 'parent_communication_style'
  | 'coach_operating_style'
  | 'ninety_day_success'

export interface InterviewStep {
  field: InterviewField
  stepLabel: string
  question: string
  whyItMatters: string
  chips: string[]
}

export const INTERVIEW_STEPS: InterviewStep[] = [
  {
    field: 'philosophy',
    stepLabel: 'Academy Identity',
    question: 'What does great player development look like at your academy?',
    whyItMatters: 'This shapes how Academy OS frames curriculum, priorities, and coach language.',
    chips: [
      'Build complete players',
      'Develop long-term confidence',
      'Strong fundamentals first',
      'Compete with character',
      'Individual growth over shortcuts',
    ],
  },
  {
    field: 'player_focus',
    stepLabel: 'Player Development Focus',
    question: 'What kind of player is your academy trying to develop?',
    whyItMatters: 'This helps Academy OS shape how players are assessed, placed, and progressed.',
    chips: [
      'Disciplined competitors',
      'Confident problem-solvers',
      'Athletes who love training',
      'Players who understand the game',
      'Mentally tough juniors',
    ],
  },
  {
    field: 'development_priorities',
    stepLabel: 'Training Priorities',
    question: 'What do you want coaches prioritising in every session?',
    whyItMatters: 'This guides how session plans are structured and how coaches use their training time.',
    chips: [
      'Technical foundations',
      'Movement and athleticism',
      'Tactical decision-making',
      'Match habits',
      'Mental routines',
      'Consistent practice standards',
    ],
  },
  {
    field: 'competition_approach',
    stepLabel: 'Competition Philosophy',
    question: 'How does your academy approach competition and match play?',
    whyItMatters: 'This shapes how players are prepared for tournaments and how results are used as learning.',
    chips: [
      'Use matches as feedback',
      'Prepare players for pressure',
      'Teach routines between points',
      'Focus on process over results',
      'Build tournament independence',
    ],
  },
  {
    field: 'parent_communication_style',
    stepLabel: 'Parent Communication',
    question: 'How do you want parents to feel when they hear from your academy?',
    whyItMatters: 'Academy OS uses this to shape the tone of all parent-facing updates and guidance.',
    chips: [
      'Clear and calm updates',
      'Simple progress visibility',
      'Encourage without overcoaching',
      'Explain what to support at home',
      'Keep parents aligned with the plan',
    ],
  },
  {
    field: 'coach_operating_style',
    stepLabel: 'Coach Operating Style',
    question: 'How should coaches use Academy OS day to day?',
    whyItMatters: 'This helps Academy OS surface the right tools and prompts for your coaching team.',
    chips: [
      'Follow the session plan',
      'Capture quick notes',
      'Keep players connected to priorities',
      'Coach with shared language',
      'Report what changed on court',
    ],
  },
  {
    field: 'ninety_day_success',
    stepLabel: '90-Day Success Target',
    question: 'What would make Academy OS feel successful in the first 90 days?',
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
