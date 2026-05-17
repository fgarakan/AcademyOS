// Sprint 629 — Full Academy Day Simulation V1
// Realistic simulation of a full academy day through the system.
// Shows sessions → wrap-ups → DONNA brief → review queue → director decisions.
// DEMO/SIMULATION ONLY — never used in live DB queries.
// Marker: SIMULATION_ONLY — NOT_OFFICIAL — NOT_REAL_DATA

export const SIMULATION_MARKER = 'SIMULATION_ONLY — NOT_OFFICIAL — NOT_REAL_DATA' as const

// ── Simulated date ─────────────────────────────────────────────────────────────

export const SIM_DATE = '2026-05-17' as const
export const SIM_ACADEMY = 'Dabul Tennis Academy' as const

// ── Session schedule ───────────────────────────────────────────────────────────

export interface SimSession {
  id: string
  name: string
  coachName: string
  startTime: string
  endTime: string
  playerCount: number
  templateName: string
  status: 'completed' | 'in_progress' | 'scheduled'
}

export const SIM_SESSIONS: SimSession[] = [
  {
    id: 'sim-session-001',
    name: 'Blue Group AM',
    coachName: 'Coach Martinez',
    startTime: '08:00',
    endTime: '09:30',
    playerCount: 8,
    templateName: 'Groundstroke Consistency Block',
    status: 'completed',
  },
  {
    id: 'sim-session-002',
    name: 'Red Group AM',
    coachName: 'Coach Davis',
    startTime: '09:30',
    endTime: '11:00',
    playerCount: 10,
    templateName: 'Serve and Return Foundation',
    status: 'completed',
  },
  {
    id: 'sim-session-003',
    name: 'Advanced PM',
    coachName: 'Coach Martinez',
    startTime: '14:00',
    endTime: '16:00',
    playerCount: 6,
    templateName: 'Match Play Simulation',
    status: 'completed',
  },
  {
    id: 'sim-session-004',
    name: 'Beginners PM',
    coachName: 'Coach Thompson',
    startTime: '16:00',
    endTime: '17:00',
    playerCount: 5,
    templateName: 'Racket Skills Introduction',
    status: 'completed',
  },
]

// ── Attendance events ──────────────────────────────────────────────────────────

export interface SimAttendanceEvent {
  sessionId: string
  playerName: string
  status: 'present' | 'absent' | 'late' | 'unexcused'
  note: string | null
  exceptionFlagged: boolean
}

export const SIM_ATTENDANCE_EVENTS: SimAttendanceEvent[] = [
  { sessionId: 'sim-session-001', playerName: 'Alex Thornton', status: 'present', note: null, exceptionFlagged: false },
  { sessionId: 'sim-session-001', playerName: 'Maya Chen', status: 'absent', note: 'Coach: Maya did not show — no message from parent', exceptionFlagged: true },
  { sessionId: 'sim-session-002', playerName: 'Jordan Lee', status: 'late', note: 'Arrived 20 min late — school pickup delay', exceptionFlagged: false },
  { sessionId: 'sim-session-003', playerName: 'Sam Rivera', status: 'present', note: null, exceptionFlagged: false },
]

// ── Coach wrap-ups ─────────────────────────────────────────────────────────────

export interface SimWrapUp {
  sessionId: string
  coachName: string
  submittedAt: string
  answers: {
    attendance: string
    sessionActual: string
    standouts: string | null
    needsAttention: string | null
    followUp: string | null
    parentFlag: string | null
    coachNote: string | null
  }
  proposedActionStatus: 'pending_review' | 'approved' | 'rejected'
}

export const SIM_WRAP_UPS: SimWrapUp[] = [
  {
    sessionId: 'sim-session-001',
    coachName: 'Coach Martinez',
    submittedAt: '09:45',
    answers: {
      attendance: 'Maya Chen was absent — no heads up from the family.',
      sessionActual: 'Covered the groundstroke consistency block as planned. Spent extra time on cross-court backhand.',
      standouts: 'Alex Thornton had a breakthrough on his two-handed backhand — best session yet.',
      needsAttention: 'Tyler is still struggling with footwork on wide balls — need to address in next session.',
      followUp: 'Set up a footwork drill at the start of next session for Tyler.',
      parentFlag: 'Maya absence — no contact from parent. Director should know.',
      coachNote: null,
    },
    proposedActionStatus: 'pending_review',
  },
  {
    sessionId: 'sim-session-002',
    coachName: 'Coach Davis',
    submittedAt: '11:20',
    answers: {
      attendance: 'Jordan was late but got full drills in. Everyone else present.',
      sessionActual: 'Good session. Serve mechanics went well. Return of serve was weaker than expected — most players hit short.',
      standouts: 'Priya nailed her kick serve today — first time I\'ve seen that consistency from her.',
      needsAttention: null,
      followUp: 'Focus next session on return depth — add a return depth drill to the warm-up block.',
      parentFlag: null,
      coachNote: "Jordan's tardiness is becoming a pattern — this is the third time this month.",
    },
    proposedActionStatus: 'pending_review',
  },
  {
    sessionId: 'sim-session-003',
    coachName: 'Coach Martinez',
    submittedAt: '16:15',
    answers: {
      attendance: 'All 6 players present.',
      sessionActual: 'Match play simulation — ran 3 sets of points. Energy was high.',
      standouts: 'Sam Rivera won every point set. Mentally strong today.',
      needsAttention: "Carlos is losing confidence on the deuce side — his second serve is getting shorter under pressure.",
      followUp: null,
      parentFlag: null,
      coachNote: 'Consider moving Carlos back to controlled rallies for a week — his confidence is dipping.',
    },
    proposedActionStatus: 'pending_review',
  },
  {
    sessionId: 'sim-session-004',
    coachName: 'Coach Thompson',
    submittedAt: null as unknown as string, // Not yet submitted at end of day
    answers: {
      attendance: '',
      sessionActual: '',
      standouts: null,
      needsAttention: null,
      followUp: null,
      parentFlag: null,
      coachNote: null,
    },
    proposedActionStatus: 'pending_review',
  },
]

// ── DONNA daily brief output ───────────────────────────────────────────────────

export interface SimDonnaBrief {
  generatedAt: string
  healthScore: number
  headline: string
  bullets: string[]
  topPriority: string
  reviewQueueCount: number
  urgentCount: number
  wrapUpCoverage: string
}

export const SIM_DONNA_BRIEF: SimDonnaBrief = {
  generatedAt: '17:00',
  healthScore: 72,
  headline: "3 of 4 sessions wrapped. One open item needs your decision before end of day.",
  bullets: [
    'Maya Chen absence — no parent contact. Flag for follow-up or exception.',
    "Coach Davis noted Jordan's tardiness is a recurring pattern (3rd time this month).",
    "Coach Martinez flagged Carlos's confidence drop — suggesting a training adjustment.",
    "Coach Thompson's wrap-up for Beginners PM not yet submitted.",
  ],
  topPriority: "Decide on Maya Chen absence exception — coach is waiting.",
  reviewQueueCount: 4,
  urgentCount: 1,
  wrapUpCoverage: '3 of 4 submitted',
}

// ── Review queue items ─────────────────────────────────────────────────────────

export interface SimReviewItem {
  id: string
  category: 'attendance_exception' | 'wrap_up' | 'coach_observation' | 'parent_draft'
  playerName: string | null
  coachName: string
  summary: string
  isUrgent: boolean
  status: 'pending_review' | 'approved' | 'rejected'
}

export const SIM_REVIEW_ITEMS: SimReviewItem[] = [
  {
    id: 'sim-review-001',
    category: 'attendance_exception',
    playerName: 'Maya Chen',
    coachName: 'Coach Martinez',
    summary: "Unexcused absence. No parent contact. Coach requests exception flag.",
    isUrgent: true,
    status: 'pending_review',
  },
  {
    id: 'sim-review-002',
    category: 'coach_observation',
    playerName: 'Alex Thornton',
    coachName: 'Coach Martinez',
    summary: "Breakthrough on two-handed backhand — standout session. Consider for development note.",
    isUrgent: false,
    status: 'pending_review',
  },
  {
    id: 'sim-review-003',
    category: 'coach_observation',
    playerName: 'Carlos Medina',
    coachName: 'Coach Martinez',
    summary: "Confidence drop on deuce side second serve. Coach recommends controlled rally week.",
    isUrgent: false,
    status: 'pending_review',
  },
  {
    id: 'sim-review-004',
    category: 'wrap_up',
    playerName: null,
    coachName: 'Coach Thompson',
    summary: "Beginners PM wrap-up not yet submitted. Session ended 17:00.",
    isUrgent: false,
    status: 'pending_review',
  },
]

// ── End-of-day DONNA summary ───────────────────────────────────────────────────

export const SIM_EOD_SUMMARY = {
  completedSessions: 4,
  totalPlayersToday: 29, // 8 + 10 + 6 + 5
  wrapUpsSubmitted: 3,
  wrapUpsMissing: 1,
  attendanceExceptions: 1,
  standoutObservations: 3,
  attentionFlags: 2,
  parentFlagsRaised: 1,
  reviewItemsCleared: 0,
  reviewItemsPending: 4,
  donnaEODMessage:
    "Today: 4 sessions, 29 players, 3 of 4 wrap-ups received. One attendance exception needs your decision. " +
    "Three player observations are in your review queue. Coach Thompson's wrap-up is still outstanding.",
} as const
