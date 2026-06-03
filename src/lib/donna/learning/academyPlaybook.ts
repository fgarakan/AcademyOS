// Sprint 1761 — DONNA Learning Foundations V1
// Academy Playbook V1 — aggregates observed patterns into a structured playbook
// of what this academy repeatedly approves, monitors, and encounters.
// Pure observation. No causation inferred. No outcome claims.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { AcademyLearningReport, LearningConfidence } from './academyLearningEngine'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PlaybookEntry {
  id:            string
  area:          string
  observedTrend: string
  confidence:    LearningConfidence
  evidence:      string[]
  limitations:   string[]
  monitorFlag:   boolean
}

export interface AcademyPlaybook {
  generatedAt:        string
  decisionWindowSize: number
  entries:            PlaybookEntry[]
  entryCount:         number
  playbookDepth:      LearningConfidence
  playbookNote:       string
}

// ─── Formatter ─────────────────────────────────────────────────────────────────

export function formatPlaybookEntryForDonna(entry: PlaybookEntry): string {
  return [
    `**${entry.area}**`,
    `Observation: ${entry.observedTrend}`,
    `Confidence: ${entry.confidence.charAt(0).toUpperCase() + entry.confidence.slice(1)}`,
    `Evidence: ${entry.evidence.slice(0, 2).join(' · ')}`,
    `Limitations: ${entry.limitations[0]}`,
    entry.monitorFlag ? 'Note: This pattern should be monitored.' : '',
  ].filter(Boolean).join('\n')
}

export function formatPlaybookForDonna(playbook: AcademyPlaybook): string {
  if (playbook.entries.length === 0 || playbook.playbookDepth === 'insufficient') {
    return [
      '**Observed Pattern:**',
      'Not enough history to populate the academy playbook yet.',
      '',
      '**Confidence:** Insufficient',
      '',
      '**Evidence:**',
      '• Decision history is too limited for playbook patterns.',
      '',
      '**Limitations:**',
      '• The playbook requires a history of director decisions, review queue activity, and curriculum data.',
      '• V1 does not infer outcomes — all entries are observational only.',
      '',
      '**Recommended Next Action:**',
      'Continue using DONNA for daily operations. Each decision builds the playbook foundation.',
    ].join('\n')
  }

  const lines: string[] = []

  lines.push(`**Academy Playbook — ${playbook.entryCount} pattern${playbook.entryCount !== 1 ? 's' : ''} observed**`)
  lines.push(`_(Based on ${playbook.decisionWindowSize} decisions loaded — confidence: ${playbook.playbookDepth})_`)
  lines.push('')

  for (const entry of playbook.entries.slice(0, 4)) {
    lines.push(formatPlaybookEntryForDonna(entry))
    lines.push('')
  }

  lines.push(`**Limitations:** ${playbook.playbookNote}`)

  return lines.join('\n')
}

// ─── Builder ───────────────────────────────────────────────────────────────────

export function buildAcademyPlaybook(
  ctx: DirectorDonnaContext,
  learningReport: AcademyLearningReport,
): AcademyPlaybook {
  const entries: PlaybookEntry[] = []
  const decisions = ctx.recentDecisions

  // ── Entry: Decision approval pattern ─────────────────────────────────────

  if (decisions.length >= 3) {
    const approved = decisions.filter(d => d.status === 'approved' || d.status === 'executed').length
    const rejected = decisions.filter(d => d.status === 'rejected').length
    const approvalRate = decisions.length > 0 ? Math.round((approved / decisions.length) * 100) : 0

    entries.push({
      id: 'playbook_decision_rate',
      area: 'Decision Rate',
      observedTrend: `${approvalRate}% of recent decisions were approved or executed (${approved} of ${decisions.length} loaded). This is an early signal — not enough history to call this a stable pattern.`,
      confidence: decisions.length >= 10 ? 'medium' : 'low',
      evidence: [
        `${decisions.length} decisions in the loaded window`,
        `${approved} approved/executed, ${rejected} rejected`,
      ],
      limitations: [
        'Only the most recent decisions are loaded — historical trend not available.',
        'V1 cannot determine whether approved decisions led to intended outcomes.',
      ],
      monitorFlag: approvalRate < 50,
    })
  }

  // ── Entry: Review queue load ───────────────────────────────────────────────

  if (ctx.pendingReviews >= 3) {
    entries.push({
      id: 'playbook_review_queue_load',
      area: 'Review Queue Volume',
      observedTrend: `${ctx.pendingReviews} items are currently pending review. If the queue consistently holds this volume, the review cadence may need attention.`,
      confidence: ctx.pendingReviews >= 5 ? 'low' : 'insufficient',
      evidence: [
        `${ctx.pendingReviews} items pending review`,
        ctx.oldestPendingReviewAgeDays !== null
          ? `Oldest item approximately ${ctx.oldestPendingReviewAgeDays} days old`
          : 'Age of oldest item not available',
      ],
      limitations: [
        'V1 cannot confirm whether this is a persistent backlog or a temporary spike.',
        'No causal link to any specific workflow change is inferred.',
      ],
      monitorFlag: ctx.pendingReviews >= 5,
    })
  }

  // ── Entry: Curriculum gap persistence ─────────────────────────────────────

  if (ctx.curriculumGaps.length >= 2) {
    entries.push({
      id: 'playbook_curriculum_gaps',
      area: 'Curriculum Coverage',
      observedTrend: `${ctx.curriculumGaps.length} curriculum gap areas are currently present. Whether these persist across weeks cannot be determined in V1.`,
      confidence: 'low',
      evidence: ctx.curriculumGaps.slice(0, 2),
      limitations: [
        'V1 does not track gap history — cannot confirm recurrence.',
        'Gap cause is not inferred.',
      ],
      monitorFlag: true,
    })
  }

  // ── Entry: Advancement eligibility cluster ────────────────────────────────

  if (ctx.advancementEligibleCount >= 2) {
    entries.push({
      id: 'playbook_advancement_eligibility',
      area: 'Player Advancement Signals',
      observedTrend: `${ctx.advancementEligibleCount} players currently appear advancement-eligible. This is a snapshot observation — formal assessment is required before any advancement proposal.`,
      confidence: 'low',
      evidence: [
        `${ctx.advancementEligibleCount} advancement-eligible players in current data`,
        `${ctx.playerCurriculumStateCount} total curriculum states loaded`,
      ],
      limitations: [
        'V1 does not know if these players have been eligible for a long time or recently.',
        'Advancement eligibility must be confirmed through formal assessment.',
        'No causal link to curriculum or coach actions is inferred.',
      ],
      monitorFlag: ctx.advancementEligibleCount >= 3,
    })
  }

  // ── Entries from learning report signals (top 2, deduplicated) ────────────

  const usedAreas = new Set(entries.map(e => e.id))
  for (const signal of learningReport.signals.slice(0, 2)) {
    const entryId = `playbook_from_signal_${signal.id}`
    if (usedAreas.has(entryId)) continue
    usedAreas.add(entryId)
    entries.push({
      id: entryId,
      area: signal.title,
      observedTrend: signal.observedPattern,
      confidence: signal.confidence,
      evidence: signal.supportingEvidence.slice(0, 2),
      limitations: signal.limitations.slice(0, 2),
      monitorFlag: signal.confidence === 'low' || signal.confidence === 'insufficient',
    })
  }

  const depth: LearningConfidence =
    entries.length >= 4 ? 'medium' :
    entries.length >= 2 ? 'low'    : 'insufficient'

  const playbookNote = depth === 'insufficient'
    ? 'Not enough data to populate the playbook. More decisions, curriculum data, and player activity are needed.'
    : 'This playbook reflects current-snapshot observations only. V1 does not track outcomes or confirm causation. All entries should be treated as early signals requiring further monitoring.'

  return {
    generatedAt:        new Date().toISOString(),
    decisionWindowSize: decisions.length,
    entries,
    entryCount:         entries.length,
    playbookDepth:      depth,
    playbookNote,
  }
}
