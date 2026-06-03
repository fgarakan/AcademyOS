// Sprint 1743 — Curriculum Bottleneck Intelligence V1
// Answers: Which levels are bottlenecks? Which skills block advancement?
// Which level should we improve first?
// Pure TypeScript. No DB calls. No mutations.
// Data sources: curriculumTemplateCoverageGaps, curriculumGaps, playerProgressStalls,
//               playerCurriculumStateSummaries, assessmentCoverageGaps.
//
// Every answer uses the structured format:
//   Observation → Confidence → Evidence → Limitations → Recommendation

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { AcademyObservation } from '@/lib/donna/intelligence/academyIntelligenceEngine'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface LevelSignal {
  levelDisplayName: string
  levelId:          string
  stalledCount:     number
  templateCoverage: 'none' | 'partial' | 'covered'
  structuralGaps:   number
  assessmentGaps:   number
  score:            number
}

function buildLevelSignals(ctx: DirectorDonnaContext): LevelSignal[] {
  const signals = new Map<string, LevelSignal>()

  // Stall counts by level
  for (const stall of ctx.playerProgressStalls) {
    const lv = stall.currentLevelDisplayName ?? 'Unknown'
    const existing = signals.get(lv)
    if (existing) {
      existing.stalledCount++
      existing.score += stall.stallSeverity === 'high' ? 3 : 1
    } else {
      signals.set(lv, {
        levelDisplayName: lv,
        levelId:          stall.playerId, // proxy — stall doesn't carry levelId
        stalledCount:     1,
        templateCoverage: 'covered',
        structuralGaps:   0,
        assessmentGaps:   0,
        score:            stall.stallSeverity === 'high' ? 3 : 1,
      })
    }
  }

  // Template coverage gaps
  for (const gap of ctx.curriculumTemplateCoverageGaps) {
    const lv = gap.levelDisplayName
    const existing = signals.get(lv)
    const coverage = gap.matchingTemplateCount === 0 ? 'none' : 'partial'
    const gapScore = gap.severity === 'high' ? 4 : gap.severity === 'medium' ? 2 : 1
    if (existing) {
      existing.templateCoverage = coverage
      existing.score += gapScore
    } else {
      signals.set(lv, {
        levelDisplayName: lv,
        levelId:          gap.levelId,
        stalledCount:     0,
        templateCoverage: coverage,
        structuralGaps:   0,
        assessmentGaps:   0,
        score:            gapScore,
      })
    }
  }

  // Assessment coverage gaps by level
  for (const gap of ctx.assessmentCoverageGaps) {
    const lv = gap.levelDisplayName ?? 'Unknown'
    const existing = signals.get(lv)
    if (existing) {
      existing.assessmentGaps++
      existing.score += 1
    } else {
      signals.set(lv, {
        levelDisplayName: lv,
        levelId:          gap.currentLevelId,
        stalledCount:     0,
        templateCoverage: 'covered',
        structuralGaps:   0,
        assessmentGaps:   1,
        score:            1,
      })
    }
  }

  // Structural gaps from curriculumGaps strings
  for (const gap of ctx.curriculumGaps) {
    // curriculumGaps strings look like "Orange 2 — no drills defined (3 gates exist)"
    // Extract level name from the start of the string
    const match = gap.match(/^([^—–]+)[—–]/)
    if (match) {
      const lv = match[1].trim()
      const existing = signals.get(lv)
      if (existing) {
        existing.structuralGaps++
        existing.score += 2
      } else {
        signals.set(lv, {
          levelDisplayName: lv,
          levelId:          '',
          stalledCount:     0,
          templateCoverage: 'covered',
          structuralGaps:   1,
          assessmentGaps:   0,
          score:            2,
        })
      }
    }
  }

  return Array.from(signals.values()).sort((a, b) => b.score - a.score)
}

// ─── Observation builders ─────────────────────────────────────────────────────

function buildTopBottleneckObservation(ctx: DirectorDonnaContext): AcademyObservation | null {
  const levels = buildLevelSignals(ctx)
  if (levels.length === 0) return null

  const top = levels[0]
  const evidenceLines: string[] = []
  if (top.stalledCount > 0)     evidenceLines.push(`${top.stalledCount} player${top.stalledCount !== 1 ? 's' : ''} stalled at this level`)
  if (top.templateCoverage !== 'covered') evidenceLines.push('No class template assigned to this level')
  if (top.structuralGaps > 0)   evidenceLines.push(`${top.structuralGaps} structural curriculum gap${top.structuralGaps !== 1 ? 's' : ''}`)
  if (top.assessmentGaps > 0)   evidenceLines.push(`${top.assessmentGaps} player${top.assessmentGaps !== 1 ? 's' : ''} overdue for assessment`)

  return {
    id:       'curriculum_top_bottleneck',
    category: 'curriculum_health',
    severity: top.stalledCount >= 3 || top.templateCoverage === 'none' ? 'critical' : 'warning',
    title:    `${top.levelDisplayName} shows bottleneck signals`,
    summary:  `${top.levelDisplayName} has the highest combined bottleneck score across stalls, template coverage, and assessment gaps.`,
    evidence: evidenceLines,
    affectedPlayers: ctx.playerProgressStalls.filter(s => s.currentLevelDisplayName === top.levelDisplayName).map(s => s.playerName),
    affectedLevels:  [top.levelDisplayName],
    affectedCoaches: [],
    recommendedAction: `Review ${top.levelDisplayName} curriculum structure, assign a class template if missing, and check player gate evidence.`,
    destination: '/director/curriculum',
    confidence: ctx.playerProgressContextAvailable ? 'partial' : 'low',
    limitations: [
      'Bottleneck score is a composite proxy — not a precise progression rate.',
      'No historical session data used — score is point-in-time only.',
    ],
  }
}

function buildTemplateCoverageObservation(ctx: DirectorDonnaContext): AcademyObservation | null {
  const gaps = ctx.curriculumTemplateCoverageGaps
  if (gaps.length === 0) return null

  const high = gaps.filter(g => g.severity === 'high')
  const levels = gaps.map(g => g.levelDisplayName)
  const playerSum = gaps.reduce((s, g) => s + g.playerCountAtLevel, 0)

  return {
    id:       'curriculum_template_coverage',
    category: 'curriculum_health',
    severity: high.length > 0 ? 'critical' : 'warning',
    title:    `${gaps.length} curriculum level${gaps.length !== 1 ? 's' : ''} without a class template`,
    summary:  `${playerSum} player${playerSum !== 1 ? 's are' : ' is'} in curriculum levels with no active class template assigned. Coaches delivering these levels have no structured template to follow.`,
    evidence: [
      `${gaps.length} level${gaps.length !== 1 ? 's' : ''} with active players but no template`,
      `${playerSum} total players affected`,
      high.length > 0 ? `${high.length} high-severity gap${high.length !== 1 ? 's' : ''}` : '',
    ].filter(Boolean),
    affectedPlayers: [],
    affectedLevels:  levels,
    affectedCoaches: [],
    recommendedAction: 'Assign an active class template to each affected curriculum level from the Templates section.',
    destination: '/director/templates',
    confidence:  ctx.templateCoverageContextAvailable ? 'high' : 'partial',
    limitations: ctx.templateCoverageContextAvailable ? [] : ['Template coverage analysis may be incomplete.'],
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function buildCurriculumBottleneckObservations(ctx: DirectorDonnaContext): AcademyObservation[] {
  const obs: AcademyObservation[] = []
  const top      = buildTopBottleneckObservation(ctx)
  const coverage = buildTemplateCoverageObservation(ctx)
  if (top)      obs.push(top)
  if (coverage) obs.push(coverage)
  return obs
}

export function buildCurriculumBottleneckAnswer(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const levels = buildLevelSignals(ctx)

  if (levels.length === 0) {
    return {
      actionId:    'curriculum_bottleneck_no_data',
      text:        [
        '**Observation:**',
        'No curriculum bottleneck signals detected.',
        '',
        '**Confidence:** Low',
        '',
        '**Evidence:**',
        '• No player progress stalls recorded',
        '• No curriculum template coverage gaps found',
        '• No structural curriculum gaps loaded',
        '',
        '**Limitations:**',
        '• Player curriculum state data may not be fully loaded.',
        '• No session delivery data used in this analysis.',
        '',
        '**Recommendation:**',
        'Ensure players have curriculum levels assigned and coaches have submitted recent wrap-ups.',
      ].join('\n'),
      confidence:  'partial' as any,
      sourceNote:  'Curriculum + player state data',
      followUp:    'Go to Curriculum', href: '/director/curriculum',
      isAnswerable: false,
    }
  }

  const top3 = levels.slice(0, 3)
  const lines: string[] = []

  lines.push('**Observation:**')
  lines.push(`${levels.length} curriculum level${levels.length !== 1 ? 's' : ''} show bottleneck signals.`)
  lines.push('')

  for (const lv of top3) {
    lines.push(`**${lv.levelDisplayName}**`)
    if (lv.stalledCount > 0)     lines.push(`  • ${lv.stalledCount} player${lv.stalledCount !== 1 ? 's' : ''} stalled`)
    if (lv.templateCoverage !== 'covered') lines.push('  • No class template assigned')
    if (lv.structuralGaps > 0)   lines.push(`  • ${lv.structuralGaps} structural gap${lv.structuralGaps !== 1 ? 's' : ''} in curriculum content`)
    if (lv.assessmentGaps > 0)   lines.push(`  • ${lv.assessmentGaps} assessment${lv.assessmentGaps !== 1 ? 's' : ''} overdue`)
    lines.push('')
  }

  const hasStallData = ctx.playerProgressContextAvailable
  const hasTemplateData = ctx.templateCoverageContextAvailable
  const confidence = hasStallData && hasTemplateData ? 'Medium' : 'Low'

  lines.push(`**Confidence:** ${confidence}`)
  lines.push('')
  lines.push('**Evidence:**')
  if (ctx.playerProgressStalls.length > 0) lines.push(`• ${ctx.playerProgressStalls.length} player progress stalls`)
  if (ctx.curriculumTemplateCoverageGaps.length > 0) lines.push(`• ${ctx.curriculumTemplateCoverageGaps.length} curriculum-template coverage gaps`)
  if (ctx.curriculumGaps.length > 0) lines.push(`• ${ctx.curriculumGaps.length} structural curriculum gaps`)
  if (ctx.assessmentCoverageGaps.length > 0) lines.push(`• ${ctx.assessmentCoverageGaps.length} assessment coverage gaps`)
  lines.push('')
  lines.push('**Limitations:**')
  lines.push('• Bottleneck score is a composite proxy — not a measured session progression rate.')
  const rosterSize = ctx.playerCurriculumStateSummaries.length
  if (rosterSize < ctx.playerCount) {
    lines.push(`• Only ${rosterSize} of ${ctx.playerCount} players in loaded context — full academy picture may differ.`)
  }
  lines.push('• No historical data used — this is a point-in-time snapshot.')
  lines.push('')
  lines.push('**Recommendation:**')
  if (top3[0]) {
    lines.push(`Review ${top3[0].levelDisplayName} first — highest combined bottleneck score. Assign a class template if missing, and check gate evidence for stalled players.`)
  }

  return {
    actionId:    'curriculum_bottleneck_intelligence',
    text:        lines.join('\n'),
    confidence:  hasStallData && hasTemplateData ? 'high' : 'partial',
    sourceNote:  'Player stalls + template coverage + structural curriculum gaps',
    followUp:    'Go to Curriculum',
    href:        '/director/curriculum',
    isAnswerable: true,
  }
}
