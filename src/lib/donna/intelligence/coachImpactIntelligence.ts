// Sprint 1744 — Coach Impact Intelligence V1
// Answers: How is coach activity supporting player progress?
// Frame: support, optimization, development consistency — never punitive.
//
// IMPORTANT DATA LIMITATION:
//   DirectorDonnaContext does not include individual coach names.
//   Only academy-level signals are available: missingWrapUps, todaySessions,
//   assessmentCount, recentAssessmentCount, coachCount.
//   Per-coach attribution is NOT possible without additional data.
//
// Pure TypeScript. No DB calls. No mutations.
// Every answer uses: Observation → Confidence → Evidence → Limitations → Recommendation

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { AcademyObservation } from '@/lib/donna/intelligence/academyIntelligenceEngine'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// ─── Observation builders ─────────────────────────────────────────────────────

function buildWrapUpCoverageObservation(ctx: DirectorDonnaContext): AcademyObservation | null {
  if (ctx.todaySessions === 0) return null

  const missing = ctx.missingWrapUps
  const total   = ctx.todaySessions
  const covered = total - missing
  const rate    = total > 0 ? Math.round((covered / total) * 100) : 0

  if (missing === 0) {
    return {
      id:       'coach_wrapup_complete',
      category: 'coach_impact',
      severity: 'positive',
      title:    'All sessions have coach wrap-ups today',
      summary:  `All ${total} session${total !== 1 ? 's' : ''} today have been wrapped up. Player observations and attendance are flowing into the review queue.`,
      evidence: [`${total} sessions today`, `${covered} wrap-ups submitted (${rate}%)`],
      affectedPlayers: [], affectedLevels: [], affectedCoaches: [],
      recommendedAction: 'Review submitted wrap-ups in the Review Center.',
      destination: '/director/review',
      confidence: 'high',
      limitations: [],
    }
  }

  return {
    id:       'coach_wrapup_missing',
    category: 'coach_impact',
    severity: missing >= 3 ? 'critical' : 'warning',
    title:    `${missing} of ${total} session${total !== 1 ? 's' : ''} missing coach wrap-ups`,
    summary:  `${missing} session${missing !== 1 ? 's have' : ' has'} no wrap-up submitted today. Missing wrap-ups mean player observations, attendance exceptions, and development notes are not flowing into the review queue.`,
    evidence: [
      `${total} sessions scheduled today`,
      `${covered} wrap-up${covered !== 1 ? 's' : ''} submitted (${rate}% coverage)`,
      `${missing} session${missing !== 1 ? 's' : ''} missing wrap-up`,
    ],
    affectedPlayers: [], affectedLevels: [], affectedCoaches: [],
    recommendedAction: 'Follow up with coaches who have not yet submitted wrap-ups. Check the Sessions list to see which sessions are missing.',
    destination: '/director/sessions',
    confidence: 'high',
    limitations: ['Individual coach identification requires coach name data not currently in context.'],
  }
}

function buildAssessmentCadenceObservation(ctx: DirectorDonnaContext): AcademyObservation | null {
  if (!ctx.assessmentContextAvailable) return null

  const recent = ctx.recentAssessmentCount
  const total  = ctx.assessmentCount

  if (total === 0) {
    return {
      id:       'coach_assessment_none',
      category: 'assessment_health',
      severity: 'warning',
      title:    'No assessments recorded',
      summary:  'No player assessments have been recorded. Without assessments, advancement decisions lack evidence and DONNA\'s readiness signals are unreliable.',
      evidence: ['0 assessments in loaded context'],
      affectedPlayers: [], affectedLevels: [], affectedCoaches: [],
      recommendedAction: 'Ask coaches to submit player assessments. Each player should be assessed at least quarterly.',
      destination: '/director/players',
      confidence: 'high',
      limitations: ['Assessment data is limited to the loaded context window.'],
    }
  }

  const cadenceLabel = recent === 0
    ? 'No assessments in the last 30 days'
    : recent === 1
    ? '1 assessment in the last 30 days'
    : `${recent} assessments in the last 30 days`

  const severity = recent === 0 && total > 0 ? 'warning' : recent >= 3 ? 'positive' : 'info'

  return {
    id:       'coach_assessment_cadence',
    category: 'assessment_health',
    severity,
    title:    `Assessment cadence: ${cadenceLabel}`,
    summary:  recent === 0
      ? 'No assessments have been submitted in the last 30 days. Coaches may need a reminder to assess players regularly.'
      : `${recent} assessment${recent !== 1 ? 's' : ''} submitted in the last 30 days out of ${total} total on record.`,
    evidence: [
      `${total} total assessments in loaded context`,
      `${recent} in the last 30 days`,
      ctx.eligibleWithoutAssessmentEvidence > 0
        ? `${ctx.eligibleWithoutAssessmentEvidence} advancement-eligible player${ctx.eligibleWithoutAssessmentEvidence !== 1 ? 's' : ''} have no promotion-ready assessment`
        : '',
    ].filter(Boolean),
    affectedPlayers: [], affectedLevels: [], affectedCoaches: [],
    recommendedAction: recent === 0
      ? 'Ask coaches to submit assessments for advancement-eligible players this week.'
      : 'Continue regular assessment cadence — aim for at least one assessment per player per quarter.',
    destination: '/director/players',
    confidence: 'high',
    limitations: ['Assessment counts reflect loaded summaries (up to 30 most recent).'],
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function buildCoachImpactObservations(ctx: DirectorDonnaContext): AcademyObservation[] {
  const obs: AcademyObservation[] = []
  const wrapUp = buildWrapUpCoverageObservation(ctx)
  const assess = buildAssessmentCadenceObservation(ctx)
  if (wrapUp) obs.push(wrapUp)
  if (assess) obs.push(assess)
  return obs
}

export function buildCoachImpactAnswer(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const lines: string[] = []

  lines.push('**Observation:**')
  lines.push('Coach activity signals from today\'s sessions and assessment cadence.')
  lines.push('')

  // Wrap-up coverage
  if (ctx.todaySessions > 0) {
    const rate = Math.round(((ctx.todaySessions - ctx.missingWrapUps) / ctx.todaySessions) * 100)
    if (ctx.missingWrapUps === 0) {
      lines.push(`✅ **Wrap-up coverage:** All ${ctx.todaySessions} sessions wrapped up today (${rate}%)`)
    } else {
      lines.push(`⚠️ **Wrap-up coverage:** ${ctx.todaySessions - ctx.missingWrapUps} of ${ctx.todaySessions} sessions wrapped up (${rate}%) — ${ctx.missingWrapUps} missing`)
    }
  } else {
    lines.push('ℹ️ **Wrap-up coverage:** No sessions scheduled today.')
  }

  // Assessment cadence
  if (ctx.assessmentContextAvailable) {
    lines.push(`ℹ️ **Assessment cadence:** ${ctx.recentAssessmentCount} in last 30 days (${ctx.assessmentCount} total on record)`)
    if (ctx.eligibleWithoutAssessmentEvidence > 0) {
      lines.push(`⚠️ **Assessment gap:** ${ctx.eligibleWithoutAssessmentEvidence} advancement-eligible player${ctx.eligibleWithoutAssessmentEvidence !== 1 ? 's' : ''} have no promotion-ready assessment on file`)
    }
  }

  const hasCoaches = ctx.coachCount > 0
  const confidence = ctx.todaySessions > 0 && ctx.assessmentContextAvailable ? 'High' : 'Medium'

  lines.push('')
  lines.push(`**Confidence:** ${confidence}`)
  lines.push('')
  lines.push('**Evidence:**')
  if (hasCoaches) lines.push(`• ${ctx.coachCount} active coach${ctx.coachCount !== 1 ? 'es' : ''} in academy`)
  if (ctx.todaySessions > 0) lines.push(`• ${ctx.todaySessions} sessions today`)
  if (ctx.assessmentContextAvailable) {
    lines.push(`• ${ctx.assessmentCount} total assessments, ${ctx.recentAssessmentCount} in last 30 days`)
  }
  lines.push('')
  lines.push('**Limitations:**')
  lines.push('• Individual coach names are not in the current context — per-coach breakdown is not available.')
  lines.push('• Wrap-up coverage reflects today only — historical trends require session history.')
  lines.push('• Assessment cadence covers loaded summaries (most recent 30).')
  lines.push('')
  lines.push('**Recommendation:**')
  if (ctx.missingWrapUps > 0) {
    lines.push(`Follow up on ${ctx.missingWrapUps} missing wrap-up${ctx.missingWrapUps !== 1 ? 's' : ''} in the Sessions list. Wrap-ups are the primary way coach observations reach the review queue.`)
  } else if (ctx.eligibleWithoutAssessmentEvidence > 0) {
    lines.push(`Ask coaches to submit assessments for ${ctx.eligibleWithoutAssessmentEvidence} advancement-eligible player${ctx.eligibleWithoutAssessmentEvidence !== 1 ? 's' : ''} who lack promotion-ready evidence.`)
  } else {
    lines.push('Coach activity looks healthy. Continue monitoring wrap-up coverage and assessment cadence.')
  }

  return {
    actionId:    'coach_impact_intelligence',
    text:        lines.join('\n'),
    confidence:  ctx.todaySessions > 0 ? 'high' : 'partial',
    sourceNote:  'Session wrap-up coverage + assessment cadence',
    followUp:    ctx.missingWrapUps > 0 ? 'Go to Sessions' : null,
    href:        ctx.missingWrapUps > 0 ? '/director/sessions' : null,
    isAnswerable: true,
  }
}
