// Mega Sprint 634–663 — DONNA Atomic Loop Completion V1
// Pure function: derives DONNA morning brief text from live signal data.
// No DB calls. No LLM. 8 signal combinations covering all academy states.
// Returns line1 (primary statement), line2 (secondary context), urgency flag.

export interface BriefSignals {
  activePlayers: number
  constitutionTotal: number       // total pending items across all queues
  attentionCount: number          // players flagged for immediate attention
  coachRecapsMissing: number      // sessions without a coach recap
  assessmentsNeedingReview: number
  reassessmentDue: number
  parentUpdatesPendingApproval: number
  advancementReadyCount: number
  todaySessionCount: number
  healthPct: number
  totalPendingReviews: number
  topAttentionLabel: string | null // label from cooAttentionReport.topAction
  topAttentionSeverity: 'critical' | 'high' | 'medium' | 'low' | null
  topHealthIssue: string | null
}

export interface BriefNarrative {
  line1: string
  line2: string
  urgency: 'normal' | 'urgent'
  ctaLabel?: string
  ctaHref?: string
}

export function buildMorningBriefNarrative(s: BriefSignals): BriefNarrative {
  const none = { line1: '', line2: '', urgency: 'normal' as const }

  // ── 1. Empty academy — no players yet ───────────────────────────
  if (s.activePlayers === 0 && s.constitutionTotal === 0) {
    return {
      line1: 'Start by adding your first players and assigning curriculum levels.',
      line2: 'Once players are active, I can surface what needs your attention each day.',
      urgency: 'normal',
      ctaLabel: 'Add Players',
      ctaHref: '/director/players',
    }
  }

  // ── 2. Critical alert — top attention item is critical/high ─────
  if (s.topAttentionLabel && (s.topAttentionSeverity === 'critical' || s.topAttentionSeverity === 'high')) {
    const extra: string[] = []
    if (s.coachRecapsMissing > 0)
      extra.push(`${s.coachRecapsMissing} coach recap${s.coachRecapsMissing !== 1 ? 's' : ''} still missing`)
    if (s.totalPendingReviews > 3)
      extra.push(`${s.totalPendingReviews} items in your review queue`)
    return {
      line1: s.topAttentionLabel,
      line2: extra.length > 0 ? `Also: ${extra.join(', ')}.` : '',
      urgency: 'urgent',
      ctaLabel: 'Review Now',
      ctaHref: '/director/review',
    }
  }

  // ── 3. Advancement pipeline active — players ready to level up ──
  if (s.advancementReadyCount > 0 && s.attentionCount === 0 && s.constitutionTotal <= 5) {
    return {
      line1: `${s.advancementReadyCount} player${s.advancementReadyCount !== 1 ? 's' : ''} ${s.advancementReadyCount !== 1 ? 'are' : 'is'} ready to advance — your review is the only thing holding them back.`,
      line2: s.constitutionTotal > 0 ? `${s.constitutionTotal} other item${s.constitutionTotal !== 1 ? 's' : ''} in queue.` : 'Academy is otherwise running to plan.',
      urgency: 'normal',
      ctaLabel: 'Review Advancements',
      ctaHref: '/director/players',
    }
  }

  // ── 4. Recap gap — coach data is incomplete ─────────────────────
  if (s.coachRecapsMissing >= 3 && s.todaySessionCount > 0) {
    return {
      line1: `${s.coachRecapsMissing} sessions are missing coach recaps — player data is incomplete.`,
      line2: s.attentionCount > 0
        ? `${s.attentionCount} player${s.attentionCount !== 1 ? 's' : ''} also need attention. Recaps first — they unlock the rest.`
        : `Send coaches a prompt to complete their wrap-ups before the next session cycle.`,
      urgency: s.coachRecapsMissing >= 5 ? 'urgent' : 'normal',
      ctaLabel: 'Review Queue',
      ctaHref: '/director/review',
    }
  }

  // ── 5. Heavy decision load — many items across queues ───────────
  if (s.constitutionTotal > 8) {
    const breakdown: string[] = []
    if (s.attentionCount > 0)           breakdown.push(`${s.attentionCount} player${s.attentionCount !== 1 ? 's' : ''} flagged`)
    if (s.assessmentsNeedingReview > 0) breakdown.push(`${s.assessmentsNeedingReview} assessment${s.assessmentsNeedingReview !== 1 ? 's' : ''} to review`)
    if (s.coachRecapsMissing > 0)       breakdown.push(`${s.coachRecapsMissing} recap${s.coachRecapsMissing !== 1 ? 's' : ''} missing`)
    return {
      line1: `${s.constitutionTotal} items need your attention today — heavier than usual.`,
      line2: breakdown.length > 0 ? breakdown.join(', ') + '.' : '',
      urgency: 'urgent',
      ctaLabel: 'Start Review',
      ctaHref: '/director/review',
    }
  }

  // ── 6. Health warning — program below threshold ─────────────────
  if (s.healthPct < 60 && s.activePlayers > 0) {
    const issue = s.topHealthIssue ?? `Program health is at ${s.healthPct}% — below the target threshold.`
    return {
      line1: issue,
      line2: s.attentionCount > 0
        ? `${s.attentionCount} player${s.attentionCount !== 1 ? 's' : ''} are flagged. Start there.`
        : `Review player development signals to find the root cause.`,
      urgency: 'urgent',
      ctaLabel: 'View Players',
      ctaHref: '/director/players',
    }
  }

  // ── 7. All clear ────────────────────────────────────────────────
  if (s.constitutionTotal === 0) {
    const sessionNote = s.todaySessionCount > 0
      ? ` ${s.todaySessionCount} session${s.todaySessionCount !== 1 ? 's' : ''} scheduled today.`
      : ''
    return {
      line1: `${s.activePlayers} active player${s.activePlayers !== 1 ? 's' : ''}. No urgent items today — academy is running to plan.`,
      line2: s.advancementReadyCount > 0
        ? `${s.advancementReadyCount} player${s.advancementReadyCount !== 1 ? 's' : ''} eligible for advancement when you're ready.`
        : sessionNote.trim(),
      urgency: 'normal',
    }
  }

  // ── 8. Default — standard work queue ────────────────────────────
  const parts: string[] = []
  if (s.attentionCount > 0)               parts.push(`${s.attentionCount} player${s.attentionCount !== 1 ? 's' : ''} need attention`)
  if (s.assessmentsNeedingReview > 0)     parts.push(`${s.assessmentsNeedingReview} assessment${s.assessmentsNeedingReview !== 1 ? 's' : ''} to review`)
  if (s.coachRecapsMissing > 0)           parts.push(`${s.coachRecapsMissing} recap${s.coachRecapsMissing !== 1 ? 's' : ''} pending`)
  if (s.parentUpdatesPendingApproval > 0) parts.push(`${s.parentUpdatesPendingApproval} parent update${s.parentUpdatesPendingApproval !== 1 ? 's' : ''} waiting`)
  if (s.reassessmentDue > 0)              parts.push(`${s.reassessmentDue} player${s.reassessmentDue !== 1 ? 's' : ''} due for reassessment`)

  const line1 = parts.length > 0
    ? parts.slice(0, 2).join(' and ') + (parts.length > 2 ? `, plus ${parts.length - 2} more.` : '.')
    : `${s.activePlayers} active player${s.activePlayers !== 1 ? 's' : ''}. ${s.constitutionTotal} item${s.constitutionTotal !== 1 ? 's' : ''} in queue.`

  return {
    line1,
    line2: s.todaySessionCount > 0
      ? `${s.todaySessionCount} session${s.todaySessionCount !== 1 ? 's' : ''} scheduled today.`
      : '',
    urgency: s.constitutionTotal > 5 ? 'urgent' : 'normal',
    ctaLabel: 'Review Queue',
    ctaHref: '/director/review',
  }
}
