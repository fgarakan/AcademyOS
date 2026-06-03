// Sprint 1745 — Retention Intelligence V1
// Answers: Why are players leaving? Which levels have churn risk?
// Frame: development health, not blame.
//
// IMPORTANT DATA LIMITATION:
//   DirectorDonnaContext does not include player departure records, churn history,
//   or departure reason tags. Retention signals are proxy-only:
//   - Stalled players are a churn risk indicator
//   - Attendance exceptions may indicate disengagement
//   - Level clustering patterns may indicate bottleneck-driven attrition
//
// Pure TypeScript. No DB calls. No mutations.
// Every answer uses: Observation → Confidence → Evidence → Limitations → Recommendation

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { AcademyObservation } from '@/lib/donna/intelligence/academyIntelligenceEngine'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Detect level clustering: if many players are concentrated at one level,
 * it may indicate a bottleneck that leads to dropout.
 */
function detectLevelClustering(ctx: DirectorDonnaContext): { level: string; count: number } | null {
  if (ctx.playerCurriculumStateSummaries.length < 3) return null

  const counts = new Map<string, number>()
  for (const s of ctx.playerCurriculumStateSummaries) {
    const lv = s.currentLevelDisplayName ?? 'Unknown'
    counts.set(lv, (counts.get(lv) ?? 0) + 1)
  }

  const total   = ctx.playerCurriculumStateSummaries.length
  const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  const top     = entries[0]

  // Signal clustering if >40% of loaded players are at one level
  if (top && top[1] / total > 0.4) {
    return { level: top[0], count: top[1] }
  }
  return null
}

// ─── Observation builders ─────────────────────────────────────────────────────

function buildStallRetentionRiskObservation(ctx: DirectorDonnaContext): AcademyObservation | null {
  const highStalls = ctx.playerProgressStalls.filter(s => s.stallSeverity === 'high')
  if (highStalls.length === 0) return null

  return {
    id:       'retention_stall_risk',
    category: 'retention',
    severity: highStalls.length >= 3 ? 'critical' : 'warning',
    title:    `${highStalls.length} long-stalled player${highStalls.length !== 1 ? 's' : ''} at retention risk`,
    summary:  `Players stalled for 180+ days without advancement are at elevated risk of disengagement. This is a development health signal — not a judgment about commitment.`,
    evidence: [
      `${highStalls.length} player${highStalls.length !== 1 ? 's' : ''} in high-severity stall (180+ days at current level)`,
      `Affected levels: ${Array.from(new Set(highStalls.map(s => s.currentLevelDisplayName ?? 'Unknown'))).join(', ')}`,
    ],
    affectedPlayers: highStalls.map(s => s.playerName),
    affectedLevels:  Array.from(new Set(highStalls.map(s => s.currentLevelDisplayName ?? 'Unknown'))),
    affectedCoaches: [],
    recommendedAction: 'Review gate evidence for each high-severity stalled player. Consider a parent conversation to discuss development path and re-engage.',
    destination: '/director/players',
    confidence: 'partial',
    limitations: [
      'Stall duration is a proxy for retention risk — some players may be happy at their current level.',
      'No actual departure data is available in the current context.',
    ],
  }
}

function buildAttendanceRetentionObservation(ctx: DirectorDonnaContext): AcademyObservation | null {
  if (ctx.attendanceExceptions === 0) return null

  const severity = ctx.attendanceExceptions >= 5 ? 'warning' : 'info'

  return {
    id:       'retention_attendance_exceptions',
    category: 'retention',
    severity,
    title:    `${ctx.attendanceExceptions} attendance exception${ctx.attendanceExceptions !== 1 ? 's' : ''} pending`,
    summary:  `Attendance exceptions represent players who were absent or added outside the normal roster. Patterns of absence may indicate disengagement or scheduling issues.`,
    evidence: [
      `${ctx.attendanceExceptions} pending attendance exception${ctx.attendanceExceptions !== 1 ? 's' : ''} in Review Center`,
    ],
    affectedPlayers: [], affectedLevels: [], affectedCoaches: [],
    recommendedAction: 'Review attendance exceptions and confirm or flag for follow-up. Recurring absences may warrant a parent conversation.',
    destination: '/director/review',
    confidence: 'high',
    limitations: [
      'Only pending attendance exceptions are visible — historical attendance trends are not in the current context.',
      'Absence reasons are not available without reviewing individual records.',
    ],
  }
}

function buildLevelClusteringObservation(ctx: DirectorDonnaContext): AcademyObservation | null {
  const cluster = detectLevelClustering(ctx)
  if (!cluster) return null

  const pct = Math.round((cluster.count / ctx.playerCurriculumStateSummaries.length) * 100)

  return {
    id:       'retention_level_clustering',
    category: 'retention',
    severity: 'info',
    title:    `${pct}% of loaded players concentrated at ${cluster.level}`,
    summary:  `${cluster.count} of ${ctx.playerCurriculumStateSummaries.length} loaded players are at ${cluster.level}. High concentration at one level can indicate a bottleneck — players may disengage if they feel stuck.`,
    evidence: [
      `${cluster.count} players at ${cluster.level} (${pct}% of loaded roster)`,
    ],
    affectedPlayers: [],
    affectedLevels: [cluster.level],
    affectedCoaches: [],
    recommendedAction: `Review the ${cluster.level} curriculum for bottlenecks. Check whether advancement criteria are clear and achievable.`,
    destination: '/director/curriculum',
    confidence: 'partial',
    limitations: [
      'Clustering analysis uses loaded roster only (up to 30 players) — full academy may differ.',
      'Level concentration is not inherently a problem — it depends on cohort size and progression rate.',
    ],
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function buildRetentionObservations(ctx: DirectorDonnaContext): AcademyObservation[] {
  const obs: AcademyObservation[] = []
  const stall    = buildStallRetentionRiskObservation(ctx)
  const attend   = buildAttendanceRetentionObservation(ctx)
  const cluster  = buildLevelClusteringObservation(ctx)
  if (stall)   obs.push(stall)
  if (attend)  obs.push(attend)
  if (cluster) obs.push(cluster)
  return obs
}

export function buildRetentionAnswer(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const highStalls   = ctx.playerProgressStalls.filter(s => s.stallSeverity === 'high')
  const hasRisk      = highStalls.length > 0 || ctx.attendanceExceptions > 0

  const lines: string[] = []
  lines.push('**Observation:**')

  if (!hasRisk && ctx.playerProgressStalls.length === 0) {
    lines.push('No strong retention risk signals detected in the current context.')
  } else {
    if (highStalls.length > 0) {
      lines.push(`${highStalls.length} player${highStalls.length !== 1 ? 's are' : ' is'} in a high-severity stall (180+ days without advancement) — this is the primary retention risk indicator available.`)
    }
    if (ctx.attendanceExceptions > 0) {
      lines.push(`${ctx.attendanceExceptions} pending attendance exception${ctx.attendanceExceptions !== 1 ? 's' : ''} may signal scheduling or engagement issues.`)
    }
    const cluster = detectLevelClustering(ctx)
    if (cluster) {
      lines.push(`High player concentration at ${cluster.level} may indicate a progression bottleneck contributing to attrition.`)
    }
  }

  lines.push('')
  const confidence = ctx.playerProgressStallContextAvailable ? 'Medium' : 'Low'
  lines.push(`**Confidence:** ${confidence}`)
  lines.push('')
  lines.push('**Evidence:**')
  lines.push(`• ${ctx.playerProgressStalls.length} stalled players (${highStalls.length} high-severity)`)
  lines.push(`• ${ctx.attendanceExceptions} pending attendance exceptions`)
  lines.push(`• ${ctx.playerCount} total active players in academy`)
  lines.push('')
  lines.push('**Limitations:**')
  lines.push('• No actual departure records or churn history in the current context.')
  lines.push('• Departure reason tags (moved, cost, injury, etc.) are not available without reviewing individual records.')
  lines.push('• Stall duration is a proxy for retention risk — some players may be content at their current level.')
  const rosterSize = ctx.playerCurriculumStateSummaries.length
  if (rosterSize < ctx.playerCount) {
    lines.push(`• Analysis uses ${rosterSize} of ${ctx.playerCount} players — full picture requires reviewing all records.`)
  }
  lines.push('')
  lines.push('**Recommendation:**')
  if (highStalls.length > 0) {
    lines.push(`Start with the ${highStalls.length} high-severity stalled player${highStalls.length !== 1 ? 's' : ''} — review their profiles and consider a parent development conversation.`)
  } else if (ctx.attendanceExceptions > 0) {
    lines.push('Review pending attendance exceptions in the Review Center for patterns of recurring absence.')
  } else {
    lines.push('No immediate retention action required. Monitor stall counts and attendance patterns over the next month.')
  }

  return {
    actionId:    'retention_intelligence',
    text:        lines.join('\n'),
    confidence:  ctx.playerProgressStallContextAvailable ? 'partial' : 'partial',
    sourceNote:  'Player stalls + attendance exceptions (proxy signals only — no departure data)',
    followUp:    highStalls.length > 0 ? 'Take me to Players' : ctx.attendanceExceptions > 0 ? 'Go to Review Center' : null,
    href:        highStalls.length > 0 ? '/director/players' : ctx.attendanceExceptions > 0 ? '/director/review' : null,
    isAnswerable: true,
  }
}
