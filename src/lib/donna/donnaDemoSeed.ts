// DONNA COO Demo Seed Data — Sprint 507
// Realistic mock data for all COO Intelligence dashboard components.
// CLEARLY MARKED AS DEMO/MOCK — never used in production DB queries.
// Import these in demo pages only.

import type { DonnaCommandBriefData } from '@/components/assistant/DonnaCommandBriefIntegration'
import type { DonnaCOOReportData } from '@/components/assistant/DonnaCOOWeeklyReport'
import type { PlayerAttentionRiskData } from '@/components/assistant/PlayerAttentionRiskDashboard'
import type { GroupHealthData } from '@/components/assistant/GroupHealthReviewDashboard'
import type { CoachSupportData } from '@/components/assistant/CoachSupportNeededDashboard'
import type { ParentCoverageEntry } from '@/components/assistant/ParentTrustCoverageDashboard'
import type { SkillBottleneckEntry } from '@/components/assistant/CurriculumBottleneckDashboard'

// ── Marker ────────────────────────────────────────────────────────────────────

export const DEMO_SEED_MARKER = 'DEMO_ONLY — NOT_OFFICIAL — NOT_REAL_DATA' as const

// ── Command brief seed ────────────────────────────────────────────────────────

export const DEMO_COMMAND_BRIEF_DATA: DonnaCommandBriefData = {
  date: 'Friday, May 16, 2026',
  totalSessionsToday: 4,
  totalPlayersAttending: 32,
  wrapUpsSubmitted: 3,
  wrapUpsOutstanding: 1,
  itemsPendingDirectorReview: 5,
  itemsApprovedAwaitingExecution: 2,
  donnaPrompt: "You have 5 items pending review and one missing wrap-up. Here's what needs your attention today.",
  attentionFlags: [
    {
      type: 'player_support',
      playerName: 'Alex Thornton',
      summary: 'Flagged by coach: repeated concern about technique under pressure',
      urgency: 'high',
    },
    {
      type: 'parent_update',
      playerName: 'Maya Chen',
      summary: 'Parent message draft awaiting director review',
      urgency: 'medium',
    },
    {
      type: 'attendance_exception',
      playerName: 'Jordan Lee',
      summary: 'Absence not confirmed — was expected at 3pm session',
      urgency: 'low',
    },
  ],
  sessions: [
    {
      sessionId: 'demo-session-1',
      groupName: 'Advanced Juniors (U16)',
      coachName: 'Coach Rivera',
      wrapUpSubmitted: true,
      wrapUpPendingItems: 2,
    },
    {
      sessionId: 'demo-session-2',
      groupName: 'Intermediate (U14)',
      coachName: 'Coach Kim',
      wrapUpSubmitted: true,
      wrapUpPendingItems: 1,
    },
    {
      sessionId: 'demo-session-3',
      groupName: 'Beginner Adults',
      coachName: 'Coach Okafor',
      wrapUpSubmitted: true,
      wrapUpPendingItems: 0,
    },
    {
      sessionId: 'demo-session-4',
      groupName: 'Elite Squad',
      coachName: 'Coach Park',
      wrapUpSubmitted: false,
      wrapUpPendingItems: 0,
    },
  ],
}

// ── COO weekly report seed ────────────────────────────────────────────────────

export const DEMO_COO_REPORT_DATA: DonnaCOOReportData = {
  weekLabel: 'Week of May 11–16, 2026',
  generatedAt: 'Fri May 16, 2026 at 6:00pm',
  donnaHeadline: "This week was strong on wrap-up coverage but parent communication needs attention.",
  topInsight: "Wrap-up submission rate improved from 71% to 89% this week — the highest in 4 weeks. Parent outreach coverage is still below 60%.",
  actionRequired: true,
  actionSummary: "5 families haven't had contact in over 30 days. Consider drafting parent updates for Maya Chen, Alex Thornton, and Jordan Lee.",
  sections: [
    {
      title: 'Coach Wrap-Ups',
      metrics: [
        { label: 'Sessions completed', thisWeek: 18, lastWeek: 16, higherIsBetter: true },
        { label: 'Wrap-ups submitted', thisWeek: 16, lastWeek: 11, higherIsBetter: true },
        { label: 'Wrap-up rate', thisWeek: 89, lastWeek: 71, unit: '%', higherIsBetter: true },
        { label: 'Observations created', thisWeek: 23, lastWeek: 18, higherIsBetter: true },
      ],
    },
    {
      title: 'Director Review Queue',
      metrics: [
        { label: 'Items pending review', thisWeek: 5, lastWeek: 8, higherIsBetter: false },
        { label: 'Items approved', thisWeek: 12, lastWeek: 7, higherIsBetter: true },
        { label: 'Items applied', thisWeek: 10, lastWeek: 6, higherIsBetter: true },
      ],
    },
    {
      title: 'Parent Communication',
      metrics: [
        { label: 'Families with contact', thisWeek: 19, lastWeek: 21, higherIsBetter: true },
        { label: 'Coverage rate', thisWeek: 58, lastWeek: 64, unit: '%', higherIsBetter: true },
        { label: 'Parent drafts approved', thisWeek: 4, lastWeek: 3, higherIsBetter: true },
      ],
    },
  ],
}

// ── Player attention risk seed ────────────────────────────────────────────────

export const DEMO_PLAYER_ATTENTION_RISK: PlayerAttentionRiskData[] = [
  {
    playerId: 'demo-player-1',
    playerName: 'Alex Thornton',
    groupName: 'Advanced Juniors (U16)',
    riskLevel: 'high',
    primaryFlag: 'coach_observation_concern',
    flagSummary: 'Technique concern flagged 3 sessions in a row',
    sessionsWithFlag: 3,
    lastFlaggedDate: '2026-05-15',
    pendingProposedActions: 2,
  },
  {
    playerId: 'demo-player-2',
    playerName: 'Jordan Lee',
    groupName: 'Advanced Juniors (U16)',
    riskLevel: 'medium',
    primaryFlag: 'repeated_absence',
    flagSummary: '2 unexplained absences this month',
    sessionsWithFlag: 2,
    lastFlaggedDate: '2026-05-14',
    pendingProposedActions: 1,
  },
  {
    playerId: 'demo-player-3',
    playerName: 'Sam Patel',
    groupName: 'Intermediate (U14)',
    riskLevel: 'low',
    primaryFlag: 'no_progress_note',
    flagSummary: 'No observations submitted in 4 sessions',
    sessionsWithFlag: 0,
    lastFlaggedDate: '2026-05-10',
    pendingProposedActions: 0,
  },
]

// ── Group health seed ─────────────────────────────────────────────────────────

export const DEMO_GROUP_HEALTH: GroupHealthData[] = [
  {
    groupId: 'demo-group-1',
    groupName: 'Advanced Juniors (U16)',
    coachName: 'Coach Rivera',
    sessionsThisWeek: 5,
    attendanceRate: 72,
    wrapUpSubmissionRate: 80,
    topObservationType: 'mixed',
    healthTrend: 'down',
    overallScore: 'at_risk',
    flagCount: 3,
  },
  {
    groupId: 'demo-group-2',
    groupName: 'Intermediate (U14)',
    coachName: 'Coach Kim',
    sessionsThisWeek: 4,
    attendanceRate: 91,
    wrapUpSubmissionRate: 100,
    topObservationType: 'positive',
    healthTrend: 'up',
    overallScore: 'strong',
    flagCount: 0,
  },
  {
    groupId: 'demo-group-3',
    groupName: 'Beginner Adults',
    coachName: 'Coach Okafor',
    sessionsThisWeek: 3,
    attendanceRate: 85,
    wrapUpSubmissionRate: 100,
    topObservationType: 'positive',
    healthTrend: 'stable',
    overallScore: 'stable',
    flagCount: 0,
  },
  {
    groupId: 'demo-group-4',
    groupName: 'Elite Squad',
    coachName: 'Coach Park',
    sessionsThisWeek: 6,
    attendanceRate: 95,
    wrapUpSubmissionRate: 67,
    topObservationType: 'mixed',
    healthTrend: 'stable',
    overallScore: 'stable',
    flagCount: 1,
  },
]

// ── Coach support seed ────────────────────────────────────────────────────────

export const DEMO_COACH_SUPPORT: CoachSupportData[] = [
  {
    coachId: 'demo-coach-4',
    coachName: 'Coach Park',
    role: 'coach',
    sessionsTaught: 6,
    wrapUpsSubmitted: 4,
    wrapUpGapSessions: 2,
    lastActivityDate: '2026-05-14',
    primaryFlag: 'wrap_up_gap',
    supportLevel: 'medium',
    observationsThisWeek: 1,
    unresolvedFollowUps: 0,
  },
  {
    coachId: 'demo-coach-1',
    coachName: 'Coach Rivera',
    role: 'head_coach',
    sessionsTaught: 5,
    wrapUpsSubmitted: 4,
    wrapUpGapSessions: 0,
    lastActivityDate: '2026-05-16',
    primaryFlag: null,
    supportLevel: 'low',
    observationsThisWeek: 6,
    unresolvedFollowUps: 1,
  },
  {
    coachId: 'demo-coach-2',
    coachName: 'Coach Kim',
    role: 'coach',
    sessionsTaught: 4,
    wrapUpsSubmitted: 4,
    wrapUpGapSessions: 0,
    lastActivityDate: '2026-05-16',
    primaryFlag: null,
    supportLevel: 'low',
    observationsThisWeek: 4,
    unresolvedFollowUps: 0,
  },
]

// ── Parent coverage seed ──────────────────────────────────────────────────────

export const DEMO_PARENT_COVERAGE: ParentCoverageEntry[] = [
  {
    playerId: 'demo-player-3',
    playerName: 'Sam Patel',
    groupName: 'Intermediate (U14)',
    parentName: 'Priya Patel',
    lastContactDate: null,
    lastContactType: 'none',
    daysSinceContact: null,
    coverageStatus: 'not_started',
    pendingDraftCount: 0,
  },
  {
    playerId: 'demo-player-2',
    playerName: 'Jordan Lee',
    groupName: 'Advanced Juniors (U16)',
    parentName: 'Chris Lee',
    lastContactDate: '2026-04-12',
    lastContactType: 'parent_message',
    daysSinceContact: 34,
    coverageStatus: 'at_risk',
    pendingDraftCount: 1,
  },
  {
    playerId: 'demo-player-1',
    playerName: 'Alex Thornton',
    groupName: 'Advanced Juniors (U16)',
    parentName: 'Sarah Thornton',
    lastContactDate: '2026-05-01',
    lastContactType: 'parent_message',
    daysSinceContact: 15,
    coverageStatus: 'covered',
    pendingDraftCount: 0,
  },
]

// ── Curriculum bottleneck seed ────────────────────────────────────────────────

export const DEMO_CURRICULUM_BOTTLENECKS: SkillBottleneckEntry[] = [
  {
    skillTag: 'serve_return',
    displayLabel: 'Serve & return mechanics',
    concernFlagCount: 7,
    affectedPlayerCount: 4,
    affectedPlayerNames: ['Alex Thornton', 'Jordan Lee', 'Riley Wang', 'Sam Patel'],
    affectedGroups: ['Advanced Juniors (U16)', 'Intermediate (U14)'],
    mostRecentFlag: '2026-05-15',
    severity: 'critical',
    donnaNote: 'This is appearing in both the U14 and U16 groups — may indicate a curriculum gap rather than individual player issues.',
  },
  {
    skillTag: 'footwork',
    displayLabel: 'Court movement / footwork',
    concernFlagCount: 3,
    affectedPlayerCount: 2,
    affectedPlayerNames: ['Alex Thornton', 'Jamie Santos'],
    affectedGroups: ['Advanced Juniors (U16)'],
    mostRecentFlag: '2026-05-14',
    severity: 'notable',
    donnaNote: null,
  },
]
