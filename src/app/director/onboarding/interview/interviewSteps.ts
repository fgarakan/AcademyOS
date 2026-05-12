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
  /** Conversational helper shown below the question */
  helperCopy: string
  /** Spoken/shown when the director's answer seems short or unclear */
  followUpPrompt: string
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
    helperCopy: 'This shapes how Academy OS frames curriculum, priorities, and coach language across the board.',
    followUpPrompt: 'No pressure. Here are a few options — pick the closest one: technical development, long-term player growth, building competitors, confidence and character, or strong fundamentals. You can always add your own note.',
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
    helperCopy: 'This shapes how players are assessed, placed, and progressed through levels from the very start.',
    followUpPrompt: 'Not sure? Think about your youngest players — what would you want a new coach to focus on with them on day one?',
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
    helperCopy: 'This guides how session plans are structured and how coaches use their training time on court.',
    followUpPrompt: 'Let me simplify that. Do you usually group by age, by skill level, or by ball colour? And is technical focus or match habits the bigger priority in a typical session?',
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
    helperCopy: 'This shapes how players are prepared for tournaments and how match results are used as learning.',
    followUpPrompt: 'Here is a simpler version — do you think competition is a great teacher early on, or should fundamentals come first before players start competing seriously?',
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
    helperCopy: 'Academy OS uses this to shape the tone of all parent-facing updates, progress notes, and guidance.',
    followUpPrompt: 'Let me make this simple. What is the one most important thing you want parents to understand about how their child progresses at your academy?',
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
    helperCopy: 'This helps Academy OS surface the right tools and daily prompts for your coaching team.',
    followUpPrompt: 'No right answer here. Think about your best coach — are they more direct and specific, more encouraging first, or do they ask questions rather than give corrections?',
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
    helperCopy: 'This becomes the lens for every setup decision — keeping the system focused on what matters most.',
    followUpPrompt: 'Think smaller. If you had to pick just one thing that would make the first three months feel worth it, what would that be?',
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

// Canonical question accessor — always returns spokenQuestion (TTS-optimised).
// Use this for both the UI heading and the voice response.create payload so they
// stay in sync even if the underlying field names change.
export function getStepQuestion(stepIndex: number): string {
  const s = INTERVIEW_STEPS[stepIndex]
  if (!s) return ''
  return s.spokenQuestion ?? s.question ?? ''
}
