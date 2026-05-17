// Sprint 631 — Brian Demo Dataset Polish V1
// Polished realistic demo data for the Brian / Dabul Academy pilot narrative.
// All names, sessions, and observations are fictional demo content.
// DEMO_ONLY — NOT_OFFICIAL — NOT_REAL_DATA
// Never use in production DB queries.

export const BRIAN_DEMO_MARKER = 'DEMO_ONLY — NOT_OFFICIAL — NOT_REAL_DATA' as const

// ── Academy context ────────────────────────────────────────────────────────────

export const BRIAN_ACADEMY = {
  name: 'Dabul Tennis Academy',
  directorName: 'Brian Dabul',
  directorFirstName: 'Brian',
  city: 'Miami, FL',
  founded: 2016,
  totalPlayers: 24,
  totalCoaches: 3,
  description: 'Competitive juniors academy. UTR-focused, full-year program.',
} as const

// ── Coaches ────────────────────────────────────────────────────────────────────

export interface DemoCoach {
  id: string
  name: string
  role: 'head_coach' | 'coach'
  groups: string[]
}

export const BRIAN_COACHES: DemoCoach[] = [
  {
    id: 'demo-coach-martinez',
    name: 'Coach Martinez',
    role: 'head_coach',
    groups: ['Advanced (U18)', 'Elite Squad'],
  },
  {
    id: 'demo-coach-davis',
    name: 'Coach Davis',
    role: 'coach',
    groups: ['Intermediate (U14)', 'Intermediate (U16)'],
  },
  {
    id: 'demo-coach-thompson',
    name: 'Coach Thompson',
    role: 'coach',
    groups: ['Beginners', 'Adult Cardio'],
  },
]

// ── Players ────────────────────────────────────────────────────────────────────

export interface DemoPlayer {
  id: string
  name: string
  age: number
  utr: number | null
  curriculumLevel: string
  group: string
  coachName: string
  demoNote: string
}

export const BRIAN_PLAYERS: DemoPlayer[] = [
  {
    id: 'demo-player-alex',
    name: 'Alex Thornton',
    age: 16,
    utr: 8.2,
    curriculumLevel: 'Advanced',
    group: 'Advanced (U18)',
    coachName: 'Coach Martinez',
    demoNote: 'Star player. UTR rising. Two-handed backhand had a breakthrough this week.',
  },
  {
    id: 'demo-player-sam',
    name: 'Sam Rivera',
    age: 17,
    utr: 9.1,
    curriculumLevel: 'Elite',
    group: 'Elite Squad',
    coachName: 'Coach Martinez',
    demoNote: 'Top player. Mentally strong. Won every point set in last match play sim.',
  },
  {
    id: 'demo-player-maya',
    name: 'Maya Chen',
    age: 15,
    utr: 6.8,
    curriculumLevel: 'Intermediate',
    group: 'Intermediate (U16)',
    coachName: 'Coach Davis',
    demoNote: '2 absences this week with no parent contact. Needs director follow-up.',
  },
  {
    id: 'demo-player-carlos',
    name: 'Carlos Medina',
    age: 16,
    utr: 7.4,
    curriculumLevel: 'Advanced',
    group: 'Advanced (U18)',
    coachName: 'Coach Martinez',
    demoNote: 'Confidence dipping. Second serve regressing. Coach recommends controlled rally period.',
  },
  {
    id: 'demo-player-jordan',
    name: 'Jordan Lee',
    age: 14,
    utr: 5.5,
    curriculumLevel: 'Intermediate',
    group: 'Intermediate (U14)',
    coachName: 'Coach Davis',
    demoNote: 'Arriving late repeatedly (3x this month). Coachable — engagement is good when present.',
  },
  {
    id: 'demo-player-priya',
    name: 'Priya Patel',
    age: 15,
    utr: 6.2,
    curriculumLevel: 'Intermediate',
    group: 'Intermediate (U16)',
    coachName: 'Coach Davis',
    demoNote: 'Kick serve clicking. Best week yet. Consider fast-tracking to Advanced group evaluation.',
  },
  {
    id: 'demo-player-tyler',
    name: 'Tyler Brooks',
    age: 14,
    utr: 4.8,
    curriculumLevel: 'Intermediate',
    group: 'Intermediate (U14)',
    coachName: 'Coach Davis',
    demoNote: 'Footwork on wide balls is the main blocker. Coach flagged for targeted drill work.',
  },
]

// ── DONNA conversation examples for the demo ───────────────────────────────────

export interface DemoDonnaExchange {
  label: string
  coachInput: string
  donnaResponse: string
  category: string
  outcome: string
}

export const BRIAN_DONNA_EXCHANGES: DemoDonnaExchange[] = [
  {
    label: 'Attendance exception',
    coachInput: "Maya Chen didn't show up today. No word from the family.",
    donnaResponse: "Got it. I'll flag this as an unexcused absence for Maya Chen and route it to Brian for review. No attendance record will change until he approves the exception.",
    category: 'attendance_exception',
    outcome: 'Creates pending_review proposed_action. Director decides.',
  },
  {
    label: 'Coach observation — positive',
    coachInput: "Alex Thornton had a breakthrough on his backhand today. Best session yet.",
    donnaResponse: "That's great to hear. I'll capture that as a positive observation for Alex — it'll go into his development profile once Brian reviews it. Any detail on what specifically clicked?",
    category: 'coach_observation',
    outcome: 'Creates pending_review proposed_action. Director reviews before profile update.',
  },
  {
    label: 'Session actual',
    coachInput: "We ran the groundstroke consistency block but spent extra time on cross-court backhand.",
    donnaResponse: "Noted. I'll log that as a session variation — the template block was run with extended backhand cross-court work. Should I flag this for the curriculum log?",
    category: 'session_actual',
    outcome: 'Creates session_actual proposed_action. Template unchanged.',
  },
  {
    label: 'Level readiness question',
    coachInput: "Is Sam Rivera ready to move up?",
    donnaResponse: "Based on available data, Sam has a UTR of 9.1, has completed all Advanced track requirements, and has had two standout weeks. I can flag a level readiness review for Brian — but the decision rests with him and goes through a formal review.",
    category: 'level_readiness',
    outcome: 'Creates level_readiness proposed_action. No automatic promotion.',
  },
  {
    label: 'Parent draft request',
    coachInput: "Can you draft an update for Maya's parents?",
    donnaResponse: "I can draft a parent-safe update for the Chen family. I'll only include appropriate progress notes — no attendance exceptions or internal flags. Brian will review before it goes anywhere near the parent portal.",
    category: 'parent_draft',
    outcome: 'Creates draft parent_draft proposed_action. Director approves before any parent visibility.',
  },
]

// ── Review queue — demo state ──────────────────────────────────────────────────

export interface DemoReviewItem {
  id: string
  category: string
  playerName: string | null
  coachName: string
  summary: string
  isUrgent: boolean
  demoTalkingPoint: string
}

export const BRIAN_REVIEW_QUEUE: DemoReviewItem[] = [
  {
    id: 'demo-review-001',
    category: 'attendance_exception',
    playerName: 'Maya Chen',
    coachName: 'Coach Davis',
    summary: 'Unexcused absence — no parent contact. Coach requesting exception flag.',
    isUrgent: true,
    demoTalkingPoint: "This is where Brian can approve the exception, ask for clarification, or reject it. Nothing changes without his decision.",
  },
  {
    id: 'demo-review-002',
    category: 'coach_observation',
    playerName: 'Alex Thornton',
    coachName: 'Coach Martinez',
    summary: 'Breakthrough on two-handed backhand. Recommend development note.',
    isUrgent: false,
    demoTalkingPoint: "Brian can approve this to add it to Alex's profile, or reject if he wants it reworded.",
  },
  {
    id: 'demo-review-003',
    category: 'coach_observation',
    playerName: 'Carlos Medina',
    coachName: 'Coach Martinez',
    summary: 'Confidence flagged. Second serve regression. Coach suggests controlled rally period.',
    isUrgent: false,
    demoTalkingPoint: "This feeds into Carlos's development plan — but only if Brian approves the observation.",
  },
  {
    id: 'demo-review-004',
    category: 'level_readiness',
    playerName: 'Priya Patel',
    coachName: 'Coach Davis',
    summary: 'Kick serve breakthrough. Coach flagging level readiness for evaluation.',
    isUrgent: false,
    demoTalkingPoint: "No level change happens automatically. Brian reviews the flag and decides whether to open a formal evaluation.",
  },
]

// ── Demo health metrics ────────────────────────────────────────────────────────

export const BRIAN_ACADEMY_HEALTH = {
  score: 74,
  status: 'moderate' as const,
  attendanceRisk: { playerCount: 2, status: 'partial' as const },
  wrapUpCoverage: { completedToday: 3, totalToday: 4, status: 'partial' as const },
  pendingReview: { count: 4, urgentCount: 1, status: 'live' as const },
  parentBacklog: { count: 3, status: 'partial' as const },
  levelReadiness: { count: 1, status: 'live' as const },
}
