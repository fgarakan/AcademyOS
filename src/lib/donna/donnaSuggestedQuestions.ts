// Sprint 1031 — DONNA Suggested Follow Up Questions V1
// Pre-built suggested questions for DONNA chat surfaces.
// Role-aware and context-aware: different sets for director vs coach, different situations.
// No DB calls. No DB writes.

import type { DonnaRole } from '@/lib/donna/donnaRoleBoundaries'
import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { CoachDonnaContext } from '@/lib/donna/coachDonnaContext'

// ── Question shape ────────────────────────────────────────────────────────────

export interface DonnaSuggestedQuestion {
  id: string
  text: string
  actionId: string | null
  domain: 'session' | 'review' | 'players' | 'curriculum' | 'health' | 'wrap_up' | 'general'
  role: DonnaRole | 'both'
  priority: number
}

// ── Base question banks ───────────────────────────────────────────────────────

const DIRECTOR_BASE_QUESTIONS: DonnaSuggestedQuestion[] = [
  {
    id: 'dir_summary',
    text: "What's happening today?",
    actionId: 'summarize_today',
    domain: 'session',
    role: 'director',
    priority: 10,
  },
  {
    id: 'dir_pending',
    text: 'What needs my attention?',
    actionId: 'show_pending_reviews',
    domain: 'review',
    role: 'director',
    priority: 9,
  },
  {
    id: 'dir_risks',
    text: 'What are the current risks?',
    actionId: 'academy_risks',
    domain: 'health',
    role: 'director',
    priority: 8,
  },
  {
    id: 'dir_wrapups',
    text: 'Which coaches still need to wrap up?',
    actionId: null,
    domain: 'wrap_up',
    role: 'director',
    priority: 7,
  },
  {
    id: 'dir_players',
    text: 'Which players need attention?',
    actionId: 'inspect_player',
    domain: 'players',
    role: 'director',
    priority: 7,
  },
  {
    id: 'dir_templates',
    text: 'How are templates being used today?',
    actionId: 'review_templates',
    domain: 'curriculum',
    role: 'director',
    priority: 5,
  },
  {
    id: 'dir_health',
    text: "What's the academy health score?",
    actionId: 'academy_risks',
    domain: 'health',
    role: 'director',
    priority: 6,
  },
  {
    id: 'dir_curriculum',
    text: 'Are there any curriculum bottlenecks?',
    actionId: null,
    domain: 'curriculum',
    role: 'director',
    priority: 4,
  },
]

const COACH_BASE_QUESTIONS: DonnaSuggestedQuestion[] = [
  {
    id: 'coach_sessions',
    text: "What sessions do I have today?",
    actionId: 'start_session',
    domain: 'session',
    role: 'coach',
    priority: 10,
  },
  {
    id: 'coach_wrapup_status',
    text: 'Do I still need to submit a wrap-up?',
    actionId: 'wrap_up',
    domain: 'wrap_up',
    role: 'coach',
    priority: 9,
  },
  {
    id: 'coach_players',
    text: 'How are my players doing today?',
    actionId: null,
    domain: 'players',
    role: 'coach',
    priority: 8,
  },
  {
    id: 'coach_pending',
    text: 'What items are still waiting for the director?',
    actionId: null,
    domain: 'review',
    role: 'coach',
    priority: 7,
  },
  {
    id: 'coach_attendance',
    text: 'Who is present for my session?',
    actionId: 'mark_attendance',
    domain: 'session',
    role: 'coach',
    priority: 8,
  },
  {
    id: 'coach_template',
    text: "What's the plan for my next session?",
    actionId: 'start_session',
    domain: 'curriculum',
    role: 'coach',
    priority: 6,
  },
  {
    id: 'coach_note',
    text: 'I want to capture a player note',
    actionId: 'capture_note',
    domain: 'players',
    role: 'coach',
    priority: 7,
  },
]

// ── First-time setup question bank (Sprint 727) ───────────────────────────────

const SETUP_QUESTIONS: DonnaSuggestedQuestion[] = [
  {
    id: 'setup_onboarding',
    text: 'Can you help me with onboarding?',
    actionId: 'navigate_onboarding',
    domain: 'general',
    role: 'director',
    priority: 20,
  },
  {
    id: 'setup_coaches',
    text: 'How do I add my coaches?',
    actionId: 'navigate_add_coaches',
    domain: 'general',
    role: 'director',
    priority: 18,
  },
  {
    id: 'setup_players',
    text: 'How do I add my players?',
    actionId: 'navigate_add_players',
    domain: 'general',
    role: 'director',
    priority: 16,
  },
  {
    id: 'setup_next',
    text: 'What should I do first?',
    actionId: 'dashboard_priority',
    domain: 'general',
    role: 'director',
    priority: 14,
  },
]

// ── Context-driven prioritized suggestions ────────────────────────────────────

export function getDirectorSuggestedQuestions(
  ctx: DirectorDonnaContext | null,
  limit = 4,
): DonnaSuggestedQuestion[] {
  // Sprint 727: first-time setup directors get setup-oriented chips
  if (ctx?.isFirstTimeSetup) {
    return SETUP_QUESTIONS.slice(0, limit)
  }

  const questions = [...DIRECTOR_BASE_QUESTIONS]
  const boosts = new Map<string, number>()

  if (ctx) {
    if (ctx.pendingReviews > 0) boosts.set('dir_pending', 5)
    if (ctx.missingWrapUps > 0) boosts.set('dir_wrapups', 4)
    if (ctx.attentionItems.length > 0) boosts.set('dir_players', 4)
    if (ctx.academyRisks.length > 0) boosts.set('dir_risks', 3)
  }

  return questions
    .map(q => ({ ...q, priority: q.priority + (boosts.get(q.id) ?? 0) }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
}

export function getCoachSuggestedQuestions(
  ctx: CoachDonnaContext | null,
  limit = 4,
): DonnaSuggestedQuestion[] {
  const questions = [...COACH_BASE_QUESTIONS]
  const boosts = new Map<string, number>()

  if (ctx) {
    if (ctx.missingWrapUps > 0) boosts.set('coach_wrapup_status', 5)
    if (ctx.todaySessions > 0) boosts.set('coach_sessions', 3)
    if (ctx.pendingSubmissions > 0) boosts.set('coach_pending', 2)
  }

  return questions
    .map(q => ({ ...q, priority: q.priority + (boosts.get(q.id) ?? 0) }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
}

export function getSuggestedQuestionsForRole(
  role: DonnaRole,
  directorCtx: DirectorDonnaContext | null,
  coachCtx: CoachDonnaContext | null,
  limit = 4,
): DonnaSuggestedQuestion[] {
  if (role === 'director') return getDirectorSuggestedQuestions(directorCtx, limit)
  return getCoachSuggestedQuestions(coachCtx, limit)
}

// ── Follow-up questions after specific answers ────────────────────────────────

export interface FollowUpQuestion {
  id: string
  text: string
  actionId: string | null
}

const ANSWER_FOLLOWUPS: Record<string, FollowUpQuestion[]> = {
  summarize_today: [
    { id: 'fu_pending', text: 'Show me the pending items', actionId: 'show_pending_reviews' },
    { id: 'fu_risks', text: 'What are the risks?', actionId: 'academy_risks' },
    { id: 'fu_players', text: 'Which players need attention?', actionId: 'inspect_player' },
  ],
  show_pending_reviews: [
    { id: 'fu_summary', text: "What else is happening today?", actionId: 'summarize_today' },
    { id: 'fu_wrapups', text: 'Which wrap-ups are missing?', actionId: null },
  ],
  academy_risks: [
    { id: 'fu_pending', text: 'Take me to the review queue', actionId: 'show_pending_reviews' },
    { id: 'fu_players', text: 'Show me the at-risk players', actionId: 'inspect_player' },
  ],
  start_session: [
    { id: 'fu_attendance', text: 'Mark attendance', actionId: 'mark_attendance' },
    { id: 'fu_note', text: 'Capture a player note', actionId: 'capture_note' },
    { id: 'fu_wrapup', text: 'Submit wrap-up when done', actionId: 'wrap_up' },
  ],
  wrap_up: [
    { id: 'fu_note', text: 'Capture one more player note', actionId: 'capture_note' },
    { id: 'fu_sessions', text: 'Check my other sessions', actionId: 'start_session' },
  ],
}

export function getFollowUpQuestions(
  answeredActionId: string,
  limit = 2,
): FollowUpQuestion[] {
  return (ANSWER_FOLLOWUPS[answeredActionId] ?? []).slice(0, limit)
}
