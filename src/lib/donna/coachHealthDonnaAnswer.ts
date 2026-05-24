// Sprint 733 -- DONNA Coach Health Answer V1
// Answers "How are my coaches doing?", "coach status", "coach performance", etc.
// Uses DirectorDonnaContext: coachCount, missingWrapUps, todaySessions.
// Pure TypeScript. No DB. No mutations.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

const COACH_HEALTH_PATTERNS = /\b(how are my coaches?( doing)?|coaches? (doing|status|performance|health)|coach (summary|overview|report)|are my coaches? (ok|okay|good|on track)|coaches? (wrap.?up|recap) status)\b/i

export function tryAnswerCoachHealthQuestion(
  text: string,
  ctx: DirectorDonnaContext | null,
): DonnaSafeReadAnswer | null {
  if (!COACH_HEALTH_PATTERNS.test(text)) return null

  const coachCount = ctx?.coachCount ?? 0
  const missingWrapUps = ctx?.missingWrapUps ?? 0
  const todaySessions = ctx?.todaySessions ?? 0

  if (coachCount === 0) {
    return {
      actionId: 'coach_health_no_coaches',
      text: "You don't have any coaches added yet. Coaches run sessions, capture player observations, and submit wrap-ups -- all of which flow into your review queue and player records. Want me to take you to Add Coaches?",
      confidence: 'insufficient',
      sourceNote: 'No coaches in system',
      followUp: 'Take me to Add Coaches',
      href: '/director/onboarding/coaches-permissions',
      isAnswerable: true,
    }
  }

  const sessionWord = todaySessions === 1 ? 'session' : 'sessions'
  const coachWord = coachCount === 1 ? 'coach' : 'coaches'

  if (missingWrapUps === 0 && todaySessions > 0) {
    return {
      actionId: 'coach_health_all_good',
      text: `Your ${coachCount} ${coachWord} are on track today. All ${todaySessions} ${sessionWord} have been wrapped up -- no outstanding submissions. You can review completed wrap-ups in the Review Center.`,
      confidence: ctx?.isLive ? 'high' : 'partial',
      sourceNote: ctx?.isLive ? 'Live session data' : 'Demo data',
      followUp: 'Show me the review center',
      href: '/director/review',
      isAnswerable: true,
    }
  }

  if (missingWrapUps > 0) {
    const urgency = missingWrapUps >= 3 ? 'needs attention' : 'is slightly behind'
    return {
      actionId: 'coach_health_missing_wrapups',
      text: `Your coaching team ${urgency}. ${coachCount} ${coachWord} running ${todaySessions} ${sessionWord} today -- ${missingWrapUps} wrap-up${missingWrapUps !== 1 ? 's' : ''} still missing. Coaches need to submit their session recap before the data flows into player records and your review queue. Want me to take you to Sessions to follow up?`,
      confidence: ctx?.isLive ? 'high' : 'partial',
      sourceNote: ctx?.isLive ? 'Live session data' : 'Demo data',
      followUp: 'Show me the missing wrap-ups',
      href: '/director/sessions',
      isAnswerable: true,
    }
  }

  // Has coaches, no sessions today
  return {
    actionId: 'coach_health_no_sessions',
    text: `You have ${coachCount} ${coachWord} in the system. No sessions are scheduled for today, so there are no wrap-ups pending. Check back on a session day to see real-time coaching status.`,
    confidence: ctx?.isLive ? 'high' : 'partial',
    sourceNote: ctx?.isLive ? 'Live session data' : 'Demo data',
    followUp: 'What needs my attention today?',
    href: null,
    isAnswerable: true,
  }
}
