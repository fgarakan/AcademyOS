// Sprint 1761 — DONNA Learning Foundations V1
// Decision pattern tracking — observes approval/rejection patterns from proposed_actions history.
// No causal claims. No outcome inference. Pure pattern observation from available decision data.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { LearningSignal, LearningConfidence } from './academyLearningEngine'

// ── Helpers ───────────────────────────────────────────────────────────────────

function confidenceFromCount(n: number): LearningConfidence {
  if (n >= 10) return 'medium'
  if (n >= 3)  return 'low'
  return 'insufficient'
}

// ── Decision pattern signals ──────────────────────────────────────────────────

/** Builds decision tracking signals from available proposed_actions history. */
export function buildDecisionTrackingSignals(ctx: DirectorDonnaContext): LearningSignal[] {
  const decisions = ctx.recentDecisions
  if (decisions.length === 0) return []

  const signals: LearningSignal[] = []

  // ── Module frequency analysis ─────────────────────────────────────────────

  type ModuleCounts = { approved: number; rejected: number; modified: number; total: number }
  const byModule = new Map<string, ModuleCounts>()

  for (const d of decisions) {
    const m = d.targetModule ?? 'unknown'
    const entry = byModule.get(m) ?? { approved: 0, rejected: 0, modified: 0, total: 0 }
    entry.total++
    if (d.status === 'approved' || d.status === 'executed') entry.approved++
    else if (d.status === 'rejected') entry.rejected++
    else if (d.status === 'modified') entry.modified++
    byModule.set(m, entry)
  }

  // Most frequently decided module
  let topModule: string | null = null
  let topCount = 0
  for (const [mod, counts] of Array.from(byModule.entries())) {
    if (counts.total > topCount) { topCount = counts.total; topModule = mod }
  }

  if (topModule !== null && topCount >= 2) {
    const counts = byModule.get(topModule)!
    const approvedPct = counts.total > 0 ? Math.round((counts.approved / counts.total) * 100) : 0

    signals.push({
      id: `decision_module_frequency_${topModule}`,
      category: 'director_decision_learning',
      title: 'Repeated Decision Area — Early Signal',
      summary: `"${topModule}" decisions appear frequently in recent history.`,
      observedPattern: `"${topModule}" appears in ${topCount} of the last ${decisions.length} decisions loaded. ${approvedPct}% of these were approved or executed. This is an early signal — not enough history to confirm this is a persistent pattern.`,
      supportingEvidence: [
        `${topCount} decisions of this type in loaded window`,
        `${counts.approved} approved/executed, ${counts.rejected} rejected, ${counts.modified} modified`,
      ],
      affectedPlayers: [],
      affectedLevels: [],
      relatedDecisions: decisions.filter(d => d.targetModule === topModule).map(d => d.id),
      recommendation: `This area generates recurring decisions. Worth monitoring whether the same situations repeat.`,
      confidence: confidenceFromCount(topCount),
      limitations: [
        'V1 only observes frequency — no outcome data available yet.',
        `Only the last ${decisions.length} decisions are loaded. Long-term patterns not yet detectable.`,
        'Frequency does not indicate the decisions had similar causes or results.',
        'Approval does not confirm the action was appropriate.',
      ],
      nextAction: `Review "${topModule}" decision history in the review queue to assess whether patterns are actionable.`,
      destination: '/director/review',
    })
  }

  // ── Repeated rejection signal ─────────────────────────────────────────────

  const rejectedModules = Array.from(byModule.entries())
    .filter(([, c]) => c.rejected >= 2)
    .sort((a, b) => b[1].rejected - a[1].rejected)

  if (rejectedModules.length > 0) {
    const [mod, counts] = rejectedModules[0]

    signals.push({
      id: `decision_rejection_pattern_${mod}`,
      category: 'director_decision_learning',
      title: 'Repeated Rejections — Pattern Should Be Monitored',
      summary: `"${mod}" decisions were rejected multiple times in recent history.`,
      observedPattern: `"${mod}" had ${counts.rejected} rejections out of ${counts.total} decisions in the loaded history. This is an early signal — not enough history to determine if this is a persistent pattern.`,
      supportingEvidence: [
        `${counts.rejected} rejections observed`,
        `${counts.approved} approvals observed for comparison`,
      ],
      affectedPlayers: [],
      affectedLevels: [],
      relatedDecisions: decisions
        .filter(d => d.targetModule === mod && d.status === 'rejected')
        .map(d => d.id),
      recommendation: `Review rejected "${mod}" decisions to see if a common reason appears. Needs more history before drawing conclusions.`,
      confidence: confidenceFromCount(counts.rejected),
      limitations: [
        'V1 cannot determine why decisions were rejected.',
        'Reviewer notes are not yet aggregated across decisions.',
        'Small sample — early signal only.',
        'Rejection does not confirm the proposed action was wrong.',
      ],
      nextAction: `Check rejected "${mod}" items in the review queue for reviewer notes.`,
      destination: '/director/review',
    })
  }

  return signals
}
