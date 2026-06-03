// Sprint 1761 — DONNA Learning Foundations V1
// Recommendation acceptance tracking — observes what types of proposed actions
// the director tends to approve, reject, or modify.
// No causal claims. No outcome inference. Pattern observation only.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { LearningSignal, LearningConfidence } from './academyLearningEngine'

// ── Helpers ───────────────────────────────────────────────────────────────────

function confidenceFromCount(n: number): LearningConfidence {
  if (n >= 10) return 'medium'
  if (n >= 3)  return 'low'
  return 'insufficient'
}

// ── Recommendation acceptance signals ─────────────────────────────────────────

/** Builds recommendation acceptance tracking signals from available decision history. */
export function buildRecommendationLearningSignals(ctx: DirectorDonnaContext): LearningSignal[] {
  const decisions = ctx.recentDecisions
  if (decisions.length < 3) return []

  const signals: LearningSignal[] = []

  const approved = decisions.filter(d => d.status === 'approved' || d.status === 'executed')
  const rejected = decisions.filter(d => d.status === 'rejected')
  const modified  = decisions.filter(d => d.status === 'modified')
  const total     = decisions.length
  const approvalRate = total > 0 ? approved.length / total : 0
  const conf = confidenceFromCount(total)

  // ── Overall acceptance rate signal ────────────────────────────────────────

  if (total >= 5) {
    const ratePct = Math.round(approvalRate * 100)
    const trend =
      approvalRate >= 0.8 ? 'Most recommendations were approved in this window.' :
      approvalRate >= 0.5 ? 'Approximately half of recommendations were approved in this window.' :
      'More recommendations were rejected than approved in this window — early signal only.'

    signals.push({
      id: 'recommendation_acceptance_rate',
      category: 'director_decision_learning',
      title: 'Recommendation Acceptance Rate',
      summary: `${ratePct}% of recent decisions were approved or executed.`,
      observedPattern: `Of the last ${total} decisions loaded, ${approved.length} were approved/executed, ${rejected.length} were rejected, and ${modified.length} were modified. ${trend}`,
      supportingEvidence: [
        `${total} decisions in the loaded window`,
        `${approved.length} approved/executed`,
        `${rejected.length} rejected`,
        `${modified.length} modified before approval`,
      ],
      affectedPlayers: [],
      affectedLevels: [],
      relatedDecisions: decisions.slice(0, 5).map(d => d.id),
      recommendation: 'This acceptance rate is an early signal only. More history is needed before drawing conclusions about recommendation quality.',
      confidence: conf,
      limitations: [
        'V1 cannot determine whether approved decisions had positive outcomes.',
        `Only the last ${total} decisions are loaded — long-term trends not detectable.`,
        'Approval does not confirm the action was appropriate; rejection does not confirm it was wrong.',
        'This is a count, not a quality measure.',
      ],
      nextAction: 'Continue approving, rejecting, and modifying DONNA recommendations to build a richer learning signal.',
      destination: '/director/review',
    })
  }

  // ── Modified decisions signal ─────────────────────────────────────────────

  if (modified.length >= 2) {
    signals.push({
      id: 'recommendation_modification_pattern',
      category: 'director_decision_learning',
      title: 'Recommendations Modified Before Approval',
      summary: `${modified.length} recommendations were modified before approval — pattern should be monitored.`,
      observedPattern: `${modified.length} of ${total} recent decisions were modified by the director before approval. This pattern should be monitored. It may indicate initial recommendations need refinement — or it may reflect healthy director judgment. Not enough history to distinguish.`,
      supportingEvidence: [
        `${modified.length} modified decisions observed`,
        `${approved.length} approved without modification`,
      ],
      affectedPlayers: [],
      affectedLevels: [],
      relatedDecisions: modified.map(d => d.id),
      recommendation: 'Appears associated with recommendations that needed adjustment. Needs more history to determine if a systematic gap exists.',
      confidence: 'low',
      limitations: [
        'V1 does not know what was changed in each modification.',
        'Small sample — early signal only.',
        'Modification may reflect healthy director judgment, not a DONNA quality gap.',
        'No outcome data available to evaluate whether modifications improved results.',
      ],
      nextAction: 'Review modified decisions to see if a common area of modification emerges.',
      destination: '/director/review',
    })
  }

  return signals
}
