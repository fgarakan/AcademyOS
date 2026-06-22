// Sprint 1742 — Progression Intelligence V1
// Answers: Who is ready? Who is close? Who is stalled? Which levels are bottlenecks?
// Pure TypeScript. No DB calls. No mutations.
// Data sources: playerCurriculumStateSummaries, playerProgressStalls,
//               assessmentCoverageGaps, assessmentSummaries, advancementEligibleCount.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { AcademyObservation } from '@/lib/donna/intelligence/academyIntelligenceEngine'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function playerNames(
  ids: string[],
  ctx: DirectorDonnaContext,
): string[] {
  const nameMap = new Map(ctx.playerCurriculumStateSummaries.map(s => [s.playerId, s.playerName]))
  return ids.map(id => nameMap.get(id) ?? id).filter(Boolean)
}

// ─── Observation builders ────────────────────────────────────────────────────

function buildAdvancementReadyObservation(ctx: DirectorDonnaContext): AcademyObservation | null {
  const eligible = ctx.playerCurriculumStateSummaries.filter(s => s.advancementEligible)
  if (eligible.length === 0) return null

  const names = eligible.map(s => s.playerName)
  const levels = Array.from(new Set(eligible.map(s => s.currentLevelDisplayName ?? 'Unknown').filter(Boolean)))

  const withoutEvidence = ctx.eligibleWithoutAssessmentEvidence
  const evidenceNote = withoutEvidence > 0
    ? `${withoutEvidence} eligible player${withoutEvidence !== 1 ? 's' : ''} have no promotion-ready assessment on file.`
    : 'All eligible players have supporting assessment evidence.'

  return {
    id:       'progression_advancement_ready',
    category: 'progression',
    severity: eligible.length >= 3 ? 'warning' : 'info',
    title:    `${eligible.length} player${eligible.length !== 1 ? 's' : ''} ready to advance`,
    summary:  `${names.slice(0, 3).join(', ')}${eligible.length > 3 ? ` and ${eligible.length - 3} more` : ''} ${eligible.length === 1 ? 'is' : 'are'} marked advancement-eligible. Director confirmation is required before any player moves levels.`,
    evidence: [
      `${eligible.length} advancement-eligible player${eligible.length !== 1 ? 's' : ''} in loaded roster`,
      evidenceNote,
    ],
    affectedPlayers: names,
    affectedLevels:  levels,
    affectedCoaches: [],
    recommendedAction: 'Review each player\'s assessment evidence, then confirm or defer advancement from their profile.',
    destination: '/director/players',
    confidence:  ctx.playerProgressContextAvailable ? 'high' : 'partial',
    limitations: ctx.playerProgressContextAvailable ? [] : ['Player curriculum state data may be incomplete.'],
  }
}

function buildProgressStallObservation(ctx: DirectorDonnaContext): AcademyObservation | null {
  if (ctx.playerProgressStalls.length === 0) return null

  const high   = ctx.playerProgressStalls.filter(s => s.stallSeverity === 'high')
  const medium = ctx.playerProgressStalls.filter(s => s.stallSeverity === 'medium')
  const all    = ctx.playerProgressStalls

  const levelCounts = new Map<string, number>()
  for (const s of all) {
    const lv = s.currentLevelDisplayName ?? 'Unknown'
    levelCounts.set(lv, (levelCounts.get(lv) ?? 0) + 1)
  }
  const topLevel = Array.from(levelCounts.entries()).sort((a, b) => b[1] - a[1])[0]

  const evidence: string[] = [
    `${all.length} stalled player${all.length !== 1 ? 's' : ''} (${high.length} high-severity, ${medium.length} medium)`,
  ]
  if (topLevel) {
    evidence.push(`${topLevel[0]} has the most stalled players (${topLevel[1]})`)
  }

  return {
    id:       'progression_stalls',
    category: 'progression',
    severity: high.length >= 2 ? 'critical' : high.length === 1 ? 'warning' : 'info',
    title:    `${all.length} player${all.length !== 1 ? 's' : ''} stalled — no level movement`,
    summary:  `${high.length} player${high.length !== 1 ? 's are' : ' is'} in a high-severity stall (180+ days at current level). Coach observation and director review recommended before proposing advancement.`,
    evidence,
    affectedPlayers: all.map(s => s.playerName),
    affectedLevels:  Array.from(new Set(all.map(s => s.currentLevelDisplayName ?? 'Unknown'))),
    affectedCoaches: [],
    recommendedAction: 'Open each stalled player\'s profile, review gate evidence and assessment history, and decide whether to advance, flag for intervention, or leave in progress.',
    destination: '/director/players',
    confidence:  ctx.playerProgressStallContextAvailable ? 'high' : 'partial',
    limitations: ctx.playerProgressStallContextAvailable ? [] : ['Stall data derived from loaded roster only (may be incomplete).'],
  }
}

function buildAssessmentOverdueObservation(ctx: DirectorDonnaContext): AcademyObservation | null {
  const overdue = ctx.assessmentCoverageGaps.filter(g => g.gapType === 'no_recent_assessment')
  if (overdue.length === 0) return null

  const highSev = overdue.filter(g => g.severity === 'high')
  const playerIds = overdue.map(g => g.playerId)
  const names = playerNames(playerIds, ctx)
  const levels = Array.from(new Set(overdue.map(g => g.levelDisplayName ?? 'Unknown').filter(Boolean)))

  return {
    id:       'assessment_overdue',
    category: 'assessment_health',
    severity: highSev.length >= 2 ? 'critical' : 'warning',
    title:    `${overdue.length} player${overdue.length !== 1 ? 's' : ''} overdue for assessment`,
    summary:  `${overdue.length} player${overdue.length !== 1 ? 's have' : ' has'} no assessment in the last 90 days. Without regular assessment, advancement decisions lack evidence and DONNA's readiness signals are less reliable.`,
    evidence: [
      `${overdue.length} players with no recent assessment`,
      highSev.length > 0 ? `${highSev.length} classified as high-severity overdue` : '',
    ].filter(Boolean),
    affectedPlayers: names,
    affectedLevels:  Array.from(new Set(levels)),
    affectedCoaches: [],
    recommendedAction: 'Schedule assessments for overdue players and ask coaches to submit updated observations.',
    destination: '/director/players',
    confidence:  ctx.assessmentContextAvailable ? 'high' : 'partial',
    limitations: ctx.assessmentContextAvailable ? [] : ['Assessment data is limited to loaded summaries.'],
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function buildProgressionObservations(ctx: DirectorDonnaContext): AcademyObservation[] {
  const obs: AcademyObservation[] = []
  const ready   = buildAdvancementReadyObservation(ctx)
  const stalls  = buildProgressStallObservation(ctx)
  const overdue = buildAssessmentOverdueObservation(ctx)
  if (ready)   obs.push(ready)
  if (stalls)  obs.push(stalls)
  if (overdue) obs.push(overdue)
  return obs
}

export function buildProgressionAnswer(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const eligible = ctx.playerCurriculumStateSummaries.filter(s => s.advancementEligible)
  const stalls   = ctx.playerProgressStalls
  const overdue  = ctx.assessmentCoverageGaps.filter(g => g.gapType === 'no_recent_assessment')

  if (!ctx.playerProgressContextAvailable && eligible.length === 0 && stalls.length === 0) {
    return {
      actionId:    'progression_no_data',
      text:        'I don\'t have player curriculum state data loaded. Make sure players have been assigned curriculum levels.',
      confidence:  'insufficient' as any,
      sourceNote:  null,
      followUp:    'Go to Players',
      href:        '/director/players',
      isAnswerable: false,
    }
  }

  const lines: string[] = []

  if (eligible.length > 0) {
    const names = eligible.slice(0, 4).map(s => s.playerName).join(', ')
    const more  = eligible.length > 4 ? ` and ${eligible.length - 4} more` : ''
    lines.push(`**Ready to advance (${eligible.length}):** ${names}${more}`)
    if (ctx.eligibleWithoutAssessmentEvidence > 0) {
      lines.push(`  ⚠️ ${ctx.eligibleWithoutAssessmentEvidence} of these have no promotion-ready assessment on file — assess before advancing.`)
    }
  } else {
    lines.push('**Ready to advance:** No players currently marked advancement-eligible.')
  }

  if (stalls.length > 0) {
    const highStalls = stalls.filter(s => s.stallSeverity === 'high')
    const names = stalls.slice(0, 3).map(s => `${s.playerName} (${s.daysAtCurrentLevel}d at ${s.currentLevelDisplayName ?? 'level'})`).join(', ')
    const more  = stalls.length > 3 ? ` and ${stalls.length - 3} more` : ''
    lines.push(`\n**Stalled — no advancement in 90+ days (${stalls.length}):** ${names}${more}`)
    if (highStalls.length > 0) {
      lines.push(`  🔴 ${highStalls.length} in high-severity stall (180+ days)`)
    }
  } else {
    lines.push('\n**Stalled:** No stalled players detected in loaded roster.')
  }

  if (overdue.length > 0) {
    lines.push(`\n**Assessment overdue (${overdue.length}):** ${overdue.length} player${overdue.length !== 1 ? 's have' : ' has'} no assessment in 90+ days.`)
  }

  const rosterSize = ctx.playerCurriculumStateSummaries.length
  const limitNote = rosterSize < ctx.playerCount
    ? `\n_Analysis covers ${rosterSize} of ${ctx.playerCount} players in loaded context._`
    : ''

  return {
    actionId:    'progression_intelligence',
    text:        lines.join('\n') + limitNote,
    confidence:  ctx.playerProgressContextAvailable ? 'high' : 'partial',
    sourceNote:  'Player curriculum states + assessment coverage',
    followUp:    eligible.length > 0 ? 'Take me to Players' : null,
    href:        eligible.length > 0 ? '/director/players' : null,
    isAnswerable: true,
  }
}

// ─── Specific sub-answers ─────────────────────────────────────────────────────

export function buildWhoIsReadyAnswer(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const eligible = ctx.playerCurriculumStateSummaries.filter(s => s.advancementEligible)
  if (eligible.length === 0) {
    return {
      actionId: 'who_is_ready_none',
      text: 'No players are currently marked advancement-eligible in the loaded roster. Assessments and gate evidence must be submitted by coaches before a player can be flagged.',
      confidence: 'high',
      sourceNote: 'Player curriculum states',
      followUp: null, href: null, isAnswerable: true,
    }
  }
  const rows = eligible.map(s => {
    const level = s.currentLevelDisplayName ? ` at ${s.currentLevelDisplayName}` : ''
    return `• ${s.playerName}${level}`
  }).join('\n')
  const evidenceNote = ctx.eligibleWithoutAssessmentEvidence > 0
    ? `\n\n⚠️ ${ctx.eligibleWithoutAssessmentEvidence} player${ctx.eligibleWithoutAssessmentEvidence !== 1 ? 's' : ''} eligible but lack a promotion-ready assessment — review evidence before confirming advancement.`
    : '\n\nAll eligible players have assessment evidence on file.'
  return {
    actionId: 'who_is_ready',
    text: `**${eligible.length} player${eligible.length !== 1 ? 's' : ''} ready to advance:**\n\n${rows}${evidenceNote}\n\nDirector confirmation required — I will not advance anyone automatically.`,
    confidence: ctx.playerProgressContextAvailable ? 'high' : 'partial',
    sourceNote: 'Player curriculum states',
    followUp: 'Take me to Players', href: '/director/players', isAnswerable: true,
  }
}

export function buildWhoIsStalledAnswer(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  if (ctx.playerProgressStalls.length === 0) {
    return {
      actionId: 'who_is_stalled_none',
      text: 'No stalled players detected in the loaded roster. Either all players are progressing, or player curriculum state data hasn\'t been loaded yet.',
      confidence: ctx.playerProgressStallContextAvailable ? 'high' : 'partial',
      sourceNote: 'Player progress stall detector',
      followUp: null, href: null, isAnswerable: true,
    }
  }
  const rows = ctx.playerProgressStalls.map(s => {
    const sev = s.stallSeverity === 'high' ? '🔴' : '🟡'
    return `${sev} ${s.playerName} — ${s.daysAtCurrentLevel} days at ${s.currentLevelDisplayName ?? 'level'} (${s.stallSeverity})`
  }).join('\n')
  return {
    actionId: 'who_is_stalled',
    text: `**${ctx.playerProgressStalls.length} stalled player${ctx.playerProgressStalls.length !== 1 ? 's' : ''}:**\n\n${rows}\n\nOpen each profile to review gate evidence and coach observations before deciding on next steps.`,
    confidence: ctx.playerProgressStallContextAvailable ? 'high' : 'partial',
    sourceNote: 'Player progress stall detector (90+ days threshold)',
    followUp: 'Take me to Players', href: '/director/players', isAnswerable: true,
  }
}
