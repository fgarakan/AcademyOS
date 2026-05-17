// Sprint 630 — Full Academy Week Simulation V1
// Realistic simulation of a full academy week through the system.
// Extends the day simulation to a 5-day Mon–Fri arc.
// SIMULATION/DEMO ONLY — never used in live DB queries.
// Marker: SIMULATION_ONLY — NOT_OFFICIAL — NOT_REAL_DATA

export const WEEK_SIMULATION_MARKER = 'SIMULATION_ONLY — NOT_OFFICIAL — NOT_REAL_DATA' as const

// ── Week metadata ──────────────────────────────────────────────────────────────

export const SIM_WEEK = {
  startDate: '2026-05-11',
  endDate: '2026-05-15',
  academy: 'Dabul Tennis Academy',
  totalCoaches: 3,
  totalPlayers: 24,
} as const

// ── Daily summary per day ──────────────────────────────────────────────────────

export interface SimDaySummary {
  date: string
  dayLabel: string
  sessions: number
  players: number
  wrapUpsSubmitted: number
  wrapUpsTotal: number
  attendanceExceptions: number
  reviewItemsAdded: number
  reviewItemsCleared: number
  healthScore: number
  donnaNote: string
}

export const SIM_WEEK_DAYS: SimDaySummary[] = [
  {
    date: '2026-05-11',
    dayLabel: 'Monday',
    sessions: 3,
    players: 22,
    wrapUpsSubmitted: 3,
    wrapUpsTotal: 3,
    attendanceExceptions: 0,
    reviewItemsAdded: 2,
    reviewItemsCleared: 0,
    healthScore: 81,
    donnaNote: 'Clean start to the week. All wrap-ups submitted on time. 2 observations in queue.',
  },
  {
    date: '2026-05-12',
    dayLabel: 'Tuesday',
    sessions: 4,
    players: 24,
    wrapUpsSubmitted: 4,
    wrapUpsTotal: 4,
    attendanceExceptions: 1,
    reviewItemsAdded: 4,
    reviewItemsCleared: 2,
    healthScore: 78,
    donnaNote: 'One attendance exception (Jordan Lee, school event). Queue partially cleared — 2 items approved.',
  },
  {
    date: '2026-05-13',
    dayLabel: 'Wednesday',
    sessions: 3,
    players: 20,
    wrapUpsSubmitted: 2,
    wrapUpsTotal: 3,
    attendanceExceptions: 0,
    reviewItemsAdded: 3,
    reviewItemsCleared: 3,
    healthScore: 74,
    donnaNote: "Coach Thompson's wrap-up missing again. Queue fully cleared today — good work. Health dipped slightly.",
  },
  {
    date: '2026-05-14',
    dayLabel: 'Thursday',
    sessions: 4,
    players: 24,
    wrapUpsSubmitted: 4,
    wrapUpsTotal: 4,
    attendanceExceptions: 2,
    reviewItemsAdded: 5,
    reviewItemsCleared: 1,
    healthScore: 70,
    donnaNote: 'Busiest day — 2 attendance exceptions and backlog growing. Queue at 7 items.',
  },
  {
    date: '2026-05-15',
    dayLabel: 'Friday',
    sessions: 3,
    players: 21,
    wrapUpsSubmitted: 3,
    wrapUpsTotal: 3,
    attendanceExceptions: 0,
    reviewItemsAdded: 2,
    reviewItemsCleared: 5,
    healthScore: 76,
    donnaNote: 'Strong recovery. Queue cleared to 4 items. Wrap-up coverage 100%. Good close to the week.',
  },
]

// ── Weekly trend summary ───────────────────────────────────────────────────────

export interface SimWeeklyTrend {
  metric: string
  values: (number | null)[]
  trend: 'up' | 'down' | 'stable'
  note: string
}

export const SIM_WEEKLY_TRENDS: SimWeeklyTrend[] = [
  {
    metric: 'Academy Health Score',
    values: [81, 78, 74, 70, 76],
    trend: 'down',
    note: 'Dipped mid-week due to backlog growth and one wrap-up miss. Partial recovery Friday.',
  },
  {
    metric: 'Wrap-Up Coverage %',
    values: [100, 100, 67, 100, 100],
    trend: 'stable',
    note: 'One miss on Wednesday (Coach Thompson). Otherwise full coverage.',
  },
  {
    metric: 'Attendance Rate %',
    values: [100, 96, 100, 92, 100],
    trend: 'down',
    note: 'Thursday dip — 2 unexcused absences. Overall rate 97.6% for the week.',
  },
  {
    metric: 'Review Queue Size',
    values: [2, 4, 4, 7, 4],
    trend: 'down',
    note: 'Queue peaked Thursday at 7. Friday clearance brought it back to 4.',
  },
]

// ── At-risk players for the week ───────────────────────────────────────────────

export interface SimAtRiskPlayer {
  playerName: string
  missedSessions: number
  coachFlags: number
  riskLevel: 'low' | 'medium' | 'high'
  summary: string
}

export const SIM_AT_RISK_PLAYERS: SimAtRiskPlayer[] = [
  {
    playerName: 'Maya Chen',
    missedSessions: 2,
    coachFlags: 1,
    riskLevel: 'high',
    summary: '2 absences this week — no parent contact on either. Needs director follow-up.',
  },
  {
    playerName: 'Carlos Medina',
    missedSessions: 0,
    coachFlags: 2,
    riskLevel: 'medium',
    summary: 'Confidence flagged twice by Coach Martinez. Technique regression possible — consider assessment.',
  },
  {
    playerName: 'Jordan Lee',
    missedSessions: 0,
    coachFlags: 1,
    riskLevel: 'low',
    summary: 'Late 3 times this month. Coach Davis flagged. Pattern worth noting.',
  },
]

// ── DONNA weekly brief ─────────────────────────────────────────────────────────

export const SIM_DONNA_WEEKLY_BRIEF = {
  generatedAt: '2026-05-15T17:30:00',
  weekLabel: 'Week of May 11–15, 2026',
  healthScoreAvg: 75.8,
  healthScoreTrend: 'down' as const,
  attendanceRateAvg: 97.6,
  wrapUpCoverageAvg: 93.3,
  reviewItemsAdded: 16,
  reviewItemsCleared: 11,
  reviewItemsOutstanding: 4,
  atRiskPlayerCount: 3,
  standoutObservations: 5,
  headline: 'Health trending down mid-week. Queue control was solid by Friday. Maya Chen needs immediate follow-up.',
  topPriorities: [
    'Follow up with Maya Chen family — 2 unexcused absences, no contact.',
    "Schedule a confidence check-in for Carlos Medina this coming week.",
    "Address Coach Thompson's wrap-up consistency — second miss this week.",
  ],
  nextWeekFocus: 'Attendance follow-ups, review queue clearing cadence, and advancing Carlos Medina\'s assessment.',
} as const
