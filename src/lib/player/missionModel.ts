// Sprint 495 — Mission Model V1
// Player mission type definitions and static mission library.
// Missions are short-term, motivating goals tied to curriculum progress.
// player_mission_label exists as a column on the players table (see database.types.ts).
// No new DB tables — missions computed from player state. Pure TypeScript.

export type MissionId =
  | 'complete_first_requirement'
  | 'attend_5_sessions'
  | 'get_coach_observation'
  | 'improve_forehand'
  | 'complete_level_50pct'
  | 'earn_assessment_badge'
  | 'mental_focus_week'
  | 'breathe_and_reset'
  | 'positive_self_talk'
  | 'perfect_attendance_week'
  | 'get_assessment_scheduled'
  | 'complete_curriculum_level'

export type MissionCategory = 'progress' | 'attendance' | 'skills' | 'mental' | 'assessment'

export type MissionDifficulty = 'easy' | 'medium' | 'hard'

export type MissionStatus = 'not_started' | 'in_progress' | 'completed' | 'expired'

export interface MissionCriteria {
  type: string
  threshold: number | null
  description: string
}

export interface MissionDefinition {
  id: MissionId
  title: string
  description: string
  playerFacingHint: string
  category: MissionCategory
  difficulty: MissionDifficulty
  estimatedWeeks: number
  criteria: MissionCriteria
  celebrationMessage: string
  isPlayerVisible: boolean
  isParentVisible: boolean
}

export interface MissionProgress {
  missionId: MissionId
  playerId: string
  status: MissionStatus
  currentValue: number
  targetValue: number
  progressPct: number
  assignedAt: string
  completedAt: string | null
  expiresAt: string | null
  celebrationShown: boolean
}

export const MISSION_DEFINITIONS: Record<MissionId, MissionDefinition> = {
  complete_first_requirement: {
    id: 'complete_first_requirement',
    title: 'Your First Win',
    description: 'Complete your very first curriculum requirement',
    playerFacingHint: 'Ask your coach what to work on first!',
    category: 'progress',
    difficulty: 'easy',
    estimatedWeeks: 1,
    criteria: { type: 'requirements_completed_gte', threshold: 1, description: 'Complete 1 requirement' },
    celebrationMessage: 'You did it! Your first step on the path.',
    isPlayerVisible: true,
    isParentVisible: true,
  },
  attend_5_sessions: {
    id: 'attend_5_sessions',
    title: 'Show Up 5 Times',
    description: 'Attend 5 sessions in a row without missing',
    playerFacingHint: 'Every session brings you closer!',
    category: 'attendance',
    difficulty: 'easy',
    estimatedWeeks: 2,
    criteria: { type: 'attendance_streak_gte', threshold: 5, description: 'Attend 5 consecutive sessions' },
    celebrationMessage: 'Great consistency — showing up is everything!',
    isPlayerVisible: true,
    isParentVisible: true,
  },
  get_coach_observation: {
    id: 'get_coach_observation',
    title: 'Get Noticed',
    description: 'Receive an observation note from your coach',
    playerFacingHint: 'Keep working hard — coaches notice!',
    category: 'skills',
    difficulty: 'easy',
    estimatedWeeks: 1,
    criteria: { type: 'observation_count_gte', threshold: 1, description: 'At least 1 coach observation' },
    celebrationMessage: 'Your coach is paying attention — keep it up!',
    isPlayerVisible: true,
    isParentVisible: true,
  },
  improve_forehand: {
    id: 'improve_forehand',
    title: 'Forehand Focus',
    description: 'Complete a forehand technical requirement at your current level',
    playerFacingHint: 'Ask your coach which forehand skill to focus on.',
    category: 'skills',
    difficulty: 'medium',
    estimatedWeeks: 3,
    criteria: { type: 'domain_requirement_completed', threshold: 1, description: 'Complete 1 technical requirement' },
    celebrationMessage: 'Forehand getting better — the work is paying off!',
    isPlayerVisible: true,
    isParentVisible: true,
  },
  complete_level_50pct: {
    id: 'complete_level_50pct',
    title: 'Halfway Hero',
    description: 'Complete 50% of requirements for your current level',
    playerFacingHint: 'You\'re building momentum — keep going!',
    category: 'progress',
    difficulty: 'medium',
    estimatedWeeks: 6,
    criteria: { type: 'completion_pct_gte', threshold: 50, description: '50% level completion' },
    celebrationMessage: 'Halfway there — you\'re doing great!',
    isPlayerVisible: true,
    isParentVisible: true,
  },
  earn_assessment_badge: {
    id: 'earn_assessment_badge',
    title: 'Ready to Be Tested',
    description: 'Reach 80% level completion and qualify for an assessment',
    playerFacingHint: 'Keep completing requirements to get assessment-ready.',
    category: 'assessment',
    difficulty: 'hard',
    estimatedWeeks: 8,
    criteria: { type: 'completion_pct_gte', threshold: 80, description: '80% level completion' },
    celebrationMessage: 'Assessment ready — you\'ve earned this!',
    isPlayerVisible: true,
    isParentVisible: true,
  },
  mental_focus_week: {
    id: 'mental_focus_week',
    title: 'Mental Game Week',
    description: 'Practice a mental focus routine for 5 sessions',
    playerFacingHint: 'Try your reset routine in every session this week.',
    category: 'mental',
    difficulty: 'medium',
    estimatedWeeks: 2,
    criteria: { type: 'mental_sessions_gte', threshold: 5, description: '5 sessions with mental focus practised' },
    celebrationMessage: 'Your mental game is levelling up!',
    isPlayerVisible: true,
    isParentVisible: false,
  },
  breathe_and_reset: {
    id: 'breathe_and_reset',
    title: 'Breathe & Reset',
    description: 'Practice your breathing reset routine in every session this week',
    playerFacingHint: 'When you feel the pressure, take one breath before your next point.',
    category: 'mental',
    difficulty: 'easy',
    estimatedWeeks: 1,
    criteria: { type: 'mental_sessions_gte', threshold: 3, description: '3 sessions with reset routine practised' },
    celebrationMessage: 'Your reset is getting automatic. Big skill!',
    isPlayerVisible: true,
    isParentVisible: false,
  },
  positive_self_talk: {
    id: 'positive_self_talk',
    title: 'Inner Coach',
    description: 'Replace negative self-talk with a neutral cue in 3 consecutive sessions',
    playerFacingHint: 'When you make an error, say "next ball" instead of criticizing yourself.',
    category: 'mental',
    difficulty: 'medium',
    estimatedWeeks: 2,
    criteria: { type: 'mental_sessions_gte', threshold: 3, description: '3 sessions with positive self-talk focus' },
    celebrationMessage: 'Your inner voice is your best coach. Keep it positive!',
    isPlayerVisible: true,
    isParentVisible: false,
  },
  perfect_attendance_week: {
    id: 'perfect_attendance_week',
    title: 'Perfect Week',
    description: 'Attend every session in a single week',
    playerFacingHint: 'Don\'t miss a session this week!',
    category: 'attendance',
    difficulty: 'easy',
    estimatedWeeks: 1,
    criteria: { type: 'perfect_attendance_week', threshold: null, description: 'No absences in a 7-day window' },
    celebrationMessage: 'Perfect week — you showed up every time!',
    isPlayerVisible: true,
    isParentVisible: true,
  },
  get_assessment_scheduled: {
    id: 'get_assessment_scheduled',
    title: 'Assessment Booked',
    description: 'Have an assessment scheduled by your director',
    playerFacingHint: 'Keep working — the director will book your assessment when you\'re ready.',
    category: 'assessment',
    difficulty: 'medium',
    estimatedWeeks: 4,
    criteria: { type: 'assessment_scheduled', threshold: null, description: 'next_assessment_due is set' },
    celebrationMessage: 'Assessment booked — it\'s your time to shine!',
    isPlayerVisible: true,
    isParentVisible: true,
  },
  complete_curriculum_level: {
    id: 'complete_curriculum_level',
    title: 'Level Complete!',
    description: 'Complete all requirements for your current curriculum level',
    playerFacingHint: 'Finish every requirement to unlock the next level.',
    category: 'progress',
    difficulty: 'hard',
    estimatedWeeks: 12,
    criteria: { type: 'completion_pct_gte', threshold: 100, description: '100% level completion' },
    celebrationMessage: 'Level complete — you\'re ready for what\'s next!',
    isPlayerVisible: true,
    isParentVisible: true,
  },
}

export function getMissionDefinition(id: MissionId): MissionDefinition {
  return MISSION_DEFINITIONS[id]
}

export function getMissionsByCategory(category: MissionCategory): MissionDefinition[] {
  return Object.values(MISSION_DEFINITIONS).filter(m => m.category === category)
}

export function getPlayerVisibleMissions(): MissionDefinition[] {
  return Object.values(MISSION_DEFINITIONS).filter(m => m.isPlayerVisible)
}

export function getMissionDifficultyLabel(difficulty: MissionDifficulty): string {
  const labels: Record<MissionDifficulty, string> = {
    easy: 'Quick win',
    medium: 'Challenge',
    hard: 'Big goal',
  }
  return labels[difficulty]
}
