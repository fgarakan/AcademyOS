// demo-only — not saved — not applied — local-only

export type TemplateStatus = 'ready' | 'draft' | 'needs_review'
export type TemplateLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite'
export type FitnessGoal = 'Speed & Agility' | 'Strength & Power' | 'Mobility & Flexibility' | 'Endurance' | 'Coordination'
export type LoadLevel = 'Light' | 'Moderate' | 'High'

export interface MockClassTemplate {
  id: string
  name: string
  level: TemplateLevel
  goal: string
  durationMin: number
  blockCount: number
  drillCount: number
  status: TemplateStatus
  curriculumConnection: string | null
  lastUpdated: string
  track: string
  coachNotes?: string
  tags: string[]
}

export interface MockFitnessTemplate {
  id: string
  name: string
  level: TemplateLevel
  fitnessGoal: FitnessGoal
  load: LoadLevel
  durationMin: number
  exerciseCount: number
  tennisTransfer: string[]
  status: TemplateStatus
  lastUpdated: string
  coachNotes?: string
}

export interface MockTemplateBlock {
  id: string
  title: string
  type: 'warm_up' | 'technical' | 'tactical' | 'physical' | 'match_play' | 'cool_down'
  durationMin: number
  drills: string[]
  coachingFocus: string
}

export interface MockDonnaSuggestion {
  id: string
  title: string
  type: 'class' | 'fitness'
  level: TemplateLevel
  reason: string
  curriculumConnection: string
  playersAffected: number
  groupsAffected: string[]
  estimatedUsefulness: 'High' | 'Medium' | 'Low'
  suggestedGoal: string
}

// ── Class Templates ─────────────────────────────────────────────────────────

export const DEMO_CLASS_TEMPLATES: MockClassTemplate[] = [
  {
    id: 'ct-001',
    name: 'Baseline Consistency — Beginner',
    level: 'Beginner',
    goal: 'Rally consistency from the baseline using open stance and unit turn',
    durationMin: 60,
    blockCount: 4,
    drillCount: 6,
    status: 'ready',
    curriculumConnection: 'Level 1 — Foundational Groundstrokes',
    lastUpdated: '2026-05-15',
    track: 'Technical',
    coachNotes: 'Emphasize recovery position between shots. Rally target: 5 in a row.',
    tags: ['curriculum:level-1', 'domain:groundstrokes'],
  },
  {
    id: 'ct-002',
    name: 'Serve & Return Introduction',
    level: 'Beginner',
    goal: 'Introduce serve mechanics and return positioning',
    durationMin: 60,
    blockCount: 3,
    drillCount: 4,
    status: 'draft',
    curriculumConnection: 'Level 1 — Serve Fundamentals',
    lastUpdated: '2026-05-12',
    track: 'Technical',
    tags: ['curriculum:level-1', 'domain:serve'],
  },
  {
    id: 'ct-003',
    name: 'Net Approach & Volley Patterns',
    level: 'Intermediate',
    goal: 'Build approach shot + volley patterns using split-step timing',
    durationMin: 75,
    blockCount: 5,
    drillCount: 8,
    status: 'ready',
    curriculumConnection: 'Level 2 — Net Game Fundamentals',
    lastUpdated: '2026-05-14',
    track: 'Technical',
    coachNotes: 'Use feed-to-finish format. Focus on first volley contact point.',
    tags: ['curriculum:level-2', 'domain:net-game'],
  },
  {
    id: 'ct-004',
    name: 'Match Play Decision Making',
    level: 'Intermediate',
    goal: 'Apply tactical patterns in simulated match scenarios',
    durationMin: 90,
    blockCount: 4,
    drillCount: 5,
    status: 'ready',
    curriculumConnection: 'Level 2 — Tactical Foundations',
    lastUpdated: '2026-05-10',
    track: 'Tactical',
    tags: ['curriculum:level-2', 'domain:tactics'],
  },
  {
    id: 'ct-005',
    name: 'Advanced Baseline Patterns',
    level: 'Advanced',
    goal: 'Execute inside-out forehand and cross-court pressure patterns',
    durationMin: 90,
    blockCount: 5,
    drillCount: 7,
    status: 'needs_review',
    curriculumConnection: 'Level 3 — Advanced Patterns',
    lastUpdated: '2026-05-08',
    track: 'Tactical',
    tags: ['curriculum:level-3', 'domain:patterns'],
  },
  {
    id: 'ct-006',
    name: 'Transition Game',
    level: 'Advanced',
    goal: 'Offensive and defensive transition from mid-court',
    durationMin: 90,
    blockCount: 5,
    drillCount: 9,
    status: 'draft',
    curriculumConnection: null,
    lastUpdated: '2026-05-06',
    track: 'Tactical',
    tags: ['domain:transition'],
  },
]

// ── Fitness Templates ───────────────────────────────────────────────────────

export const DEMO_FITNESS_TEMPLATES: MockFitnessTemplate[] = [
  {
    id: 'ft-001',
    name: 'Court Speed & First Step',
    level: 'Intermediate',
    fitnessGoal: 'Speed & Agility',
    load: 'Moderate',
    durationMin: 30,
    exerciseCount: 6,
    tennisTransfer: ['Split-step reaction', 'First step to the ball', 'Recovery sprint'],
    status: 'ready',
    lastUpdated: '2026-05-16',
    coachNotes: 'Best used as a warm-up block before technical sessions.',
  },
  {
    id: 'ft-002',
    name: 'Rotational Power Foundation',
    level: 'Advanced',
    fitnessGoal: 'Strength & Power',
    load: 'High',
    durationMin: 40,
    exerciseCount: 7,
    tennisTransfer: ['Serve power', 'Forehand drive', 'Overhead strength'],
    status: 'ready',
    lastUpdated: '2026-05-14',
  },
  {
    id: 'ft-003',
    name: 'Mobility & Injury Prevention',
    level: 'Beginner',
    fitnessGoal: 'Mobility & Flexibility',
    load: 'Light',
    durationMin: 20,
    exerciseCount: 8,
    tennisTransfer: ['Hip rotation range', 'Shoulder health', 'Ankle stability'],
    status: 'ready',
    lastUpdated: '2026-05-13',
    coachNotes: 'Use at the start or end of every session for all levels.',
  },
  {
    id: 'ft-004',
    name: 'Beginner Coordination Circuit',
    level: 'Beginner',
    fitnessGoal: 'Coordination',
    load: 'Light',
    durationMin: 25,
    exerciseCount: 5,
    tennisTransfer: ['Ball tracking', 'Footwork patterns', 'Hand-eye coordination'],
    status: 'draft',
    lastUpdated: '2026-05-10',
  },
  {
    id: 'ft-005',
    name: 'Tournament Prep Endurance',
    level: 'Elite',
    fitnessGoal: 'Endurance',
    load: 'High',
    durationMin: 45,
    exerciseCount: 8,
    tennisTransfer: ['Three-set match endurance', 'Recovery between points', 'Mental resilience'],
    status: 'needs_review',
    lastUpdated: '2026-05-09',
  },
]

// ── Template Blocks (for detail views) ─────────────────────────────────────

export const DEMO_CLASS_TEMPLATE_BLOCKS: MockTemplateBlock[] = [
  {
    id: 'tb-001',
    title: 'Dynamic Warm-Up',
    type: 'warm_up',
    durationMin: 10,
    drills: ['Ladder footwork', 'Shadow swings', 'Mini rally cooperative'],
    coachingFocus: 'Elevate heart rate and establish rhythm before technical work.',
  },
  {
    id: 'tb-002',
    title: 'Forehand Open Stance',
    type: 'technical',
    durationMin: 15,
    drills: ['Cone target feed', 'Down-the-line rally', 'Cross-court rally'],
    coachingFocus: 'Unit turn, contact point in front, follow-through high.',
  },
  {
    id: 'tb-003',
    title: 'Backhand Slice Introduction',
    type: 'technical',
    durationMin: 12,
    drills: ['High-to-low feed', 'Defensive slice practice'],
    coachingFocus: 'Continental grip, beveled contact, low follow-through.',
  },
  {
    id: 'tb-004',
    title: 'Consistency Rally Game',
    type: 'match_play',
    durationMin: 15,
    drills: ['Rally-to-win game (target: 8 in a row)', 'Down-the-line score'],
    coachingFocus: 'Controlled placement over power. Rally wins, not winners.',
  },
  {
    id: 'tb-005',
    title: 'Cool-Down & Review',
    type: 'cool_down',
    durationMin: 8,
    drills: ['Gentle baseline rally', 'Partner stretch'],
    coachingFocus: 'One-sentence win for each player. What did they improve today?',
  },
]

// ── DONNA Suggestions ───────────────────────────────────────────────────────

export const DEMO_DONNA_SUGGESTIONS: MockDonnaSuggestion[] = [
  {
    id: 'ds-001',
    title: 'Serve Tactics Under Pressure',
    type: 'class',
    level: 'Intermediate',
    reason: 'Your Level 2 players have 3+ sessions logged on serve mechanics but no template for applying serve tactics in competitive points.',
    curriculumConnection: 'Level 2 — Serve Tactics & Patterns',
    playersAffected: 8,
    groupsAffected: ['Intermediate Group A', 'Intermediate Group B'],
    estimatedUsefulness: 'High',
    suggestedGoal: 'T-serve, body serve, and wide serve patterns in simulated pressure points',
  },
  {
    id: 'ds-002',
    title: 'Advanced Footwork & Speed',
    type: 'fitness',
    level: 'Advanced',
    reason: 'Advanced players are logging 4+ technical sessions per week but your fitness library has no high-load speed template at this level.',
    curriculumConnection: 'Level 3 — Physical Development',
    playersAffected: 5,
    groupsAffected: ['Advanced Group'],
    estimatedUsefulness: 'High',
    suggestedGoal: 'Lateral speed, change-of-direction, and recovery sprint for match-pace conditions',
  },
  {
    id: 'ds-003',
    title: 'Beginner Point Construction',
    type: 'class',
    level: 'Beginner',
    reason: 'Level 1 players are consistently in technical sessions but have no template for point play introduction — the curriculum calls for this by month 3.',
    curriculumConnection: 'Level 1 — Introduction to Point Play',
    playersAffected: 12,
    groupsAffected: ['Beginners Group'],
    estimatedUsefulness: 'High',
    suggestedGoal: 'Introduce serve-and-rally points with simple decision-making rules',
  },
  {
    id: 'ds-004',
    title: 'Mobility for Beginners',
    type: 'fitness',
    level: 'Beginner',
    reason: 'No light mobility template exists for Level 1 players. Injury prevention at this age group should be part of every session.',
    curriculumConnection: 'Level 1 — Physical Foundations',
    playersAffected: 12,
    groupsAffected: ['Beginners Group'],
    estimatedUsefulness: 'Medium',
    suggestedGoal: 'Hip, shoulder, and ankle mobility circuits suitable for 8–12 year-olds',
  },
]
