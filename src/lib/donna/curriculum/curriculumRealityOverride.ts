// DONNA Curriculum Evolution Engine V1 — Mega Sprint 1866–1895
// Reality Override: detects where reality contradicts curriculum theory or philosophy.
//
// Core principle: Reality Always Wins.
//   Philosophy says X → Reality shows not-X → Reality is correct.
//   Curriculum says Y → Reality shows not-Y → Reality is correct.
//   DONNA says Z → Reality shows not-Z → Reality is correct.
//
// Pure TypeScript — no DB calls.
//
// Override types:
//   philosophy_contradiction  — stated philosophy does not match observable behavior
//   curriculum_mismatch       — curriculum structure does not match what players need
//   advancement_failure       — advancement criteria too aggressive for actual readiness
//   gate_failure              — gate fails to predict actual readiness for next level
//   underuse_signal           — content exists but is structurally irrelevant to players

import type {
  CurriculumLevelSummary,
  CurriculumGateSummary,
  PlayerLevelSummary,
  AcademyDnaSummary,
  CurriculumItemSummary,
} from './curriculumIntelligenceContext'
import type { CurriculumGapReport } from './curriculumGapAnalysis'
import type { GateHealthReport } from './gateEffectivenessEngine'

// ── Types ─────────────────────────────────────────────────────────────────────

export type RealityOverrideType =
  | 'philosophy_contradiction'
  | 'curriculum_mismatch'
  | 'advancement_failure'
  | 'gate_failure'
  | 'underuse_signal'

export interface RealityOverride {
  id:               string
  type:             RealityOverrideType
  title:            string
  severity:         'critical' | 'high' | 'medium'
  philosophyStates: string
  realityShows:     string
  recommendation:   string
  confidence:       number
  evidence:         string[]
  affectedLevelId:  string | null
  affectedGateId:   string | null
}

export interface RealityOverrideReport {
  overrides:        RealityOverride[]
  critical:         RealityOverride[]
  totalCount:       number
  computedAt:       string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeId(type: RealityOverrideType, suffix: string): string {
  return `ro_${type.replace(/_/g, '')}_${suffix}`
}

// ── Detectors ─────────────────────────────────────────────────────────────────

function detectPhilosophyContradictions(
  dna: AcademyDnaSummary,
  playerByLevel: PlayerLevelSummary[],
  levels: CurriculumLevelSummary[],
): RealityOverride[] {
  const overrides: RealityOverride[] = []

  if (!dna.hasDna) return overrides

  // Philosophy: advancement requires coach_judgment (director must personally approve)
  // Reality: many players are advancement-eligible → director is potentially not reviewing
  if (dna.advancementApproval === 'coach_judgment') {
    const eligibleTotal = playerByLevel.reduce((s, p) => s + p.advancementEligibleCount, 0)
    const totalPlayers  = playerByLevel.reduce((s, p) => s + p.playerCount, 0)
    if (eligibleTotal > 0 && totalPlayers > 0 && eligibleTotal / totalPlayers > 0.5) {
      overrides.push({
        id:               makeId('philosophy_contradiction', 'advancement_backlog'),
        type:             'philosophy_contradiction',
        title:            'Advancement backlog contradicts strict approval philosophy',
        severity:         'medium',
        philosophyStates: `Academy philosophy: advancement requires ${dna.advancementApproval}`,
        realityShows:     `${eligibleTotal} of ${totalPlayers} players (${Math.round((eligibleTotal / totalPlayers) * 100)}%) are advancement-eligible and waiting`,
        recommendation:   'Review whether the advancement approval process is creating a bottleneck, or whether eligibility criteria need adjustment.',
        confidence:       60,
        evidence: [
          `${eligibleTotal} players eligible to advance`,
          `Philosophy requires director or coach personal approval`,
          `High backlog suggests process friction`,
        ],
        affectedLevelId:  null,
        affectedGateId:   null,
      })
    }
  }

  // Philosophy: competitive juniors → reality: many empty advanced levels
  if (dna.inferredModel === 'competitive_juniors') {
    const emptyAdvanced = levels.filter(l =>
      l.isEmpty && (l.stage.includes('green') || l.stage.includes('high')),
    )
    if (emptyAdvanced.length >= 2) {
      overrides.push({
        id:               makeId('philosophy_contradiction', 'competitive_no_advanced'),
        type:             'philosophy_contradiction',
        title:            'Competitive model with empty advanced-level curriculum',
        severity:         'high',
        philosophyStates: `Academy model: ${dna.inferredModel} — advanced pathway should be fully developed`,
        realityShows:     `${emptyAdvanced.length} advanced levels have no curriculum content`,
        recommendation:   'A competitive academy model without advanced curriculum cannot develop players to competitive readiness.',
        confidence:       70,
        evidence: [
          `Academy DNA model: ${dna.inferredModel}`,
          `Empty levels: ${emptyAdvanced.map(l => l.displayName).join(', ')}`,
        ],
        affectedLevelId:  emptyAdvanced[0]?.id ?? null,
        affectedGateId:   null,
      })
    }
  }

  // Philosophy: recreational → reality: high advancement-eligible counts → players outgrowing structure
  if (dna.inferredModel === 'recreational') {
    const highAdvancement = playerByLevel.filter(p =>
      p.advancementEligibleCount > 0 &&
      p.advancementEligibleCount / Math.max(p.playerCount, 1) >= 0.6 &&
      p.hasEvidence,
    )
    if (highAdvancement.length >= 2) {
      overrides.push({
        id:               makeId('philosophy_contradiction', 'recreational_high_performance'),
        type:             'philosophy_contradiction',
        title:            'Players advancing faster than recreational model expects',
        severity:         'medium',
        philosophyStates: `Academy model: ${dna.inferredModel} — progression is gradual, player enjoyment prioritised`,
        realityShows:     `${highAdvancement.length} levels have 60%+ advancement eligibility — players may be outgrowing the recreational structure`,
        recommendation:   'Consider whether the academy has evolved toward a development model and whether the curriculum should reflect that.',
        confidence:       50,
        evidence: highAdvancement.map(p => `${p.levelName}: ${p.advancementEligibleCount}/${p.playerCount} eligible`),
        affectedLevelId:  null,
        affectedGateId:   null,
      })
    }
  }

  return overrides
}

function detectCurriculumMismatches(
  levels: CurriculumLevelSummary[],
  playerByLevel: PlayerLevelSummary[],
  gapReport: CurriculumGapReport,
): RealityOverride[] {
  const overrides: RealityOverride[] = []

  const playerMap: Record<string, PlayerLevelSummary> = {}
  for (const p of playerByLevel) playerMap[p.levelId] = p

  // Levels with many players but sparse/empty curriculum
  for (const level of levels) {
    const ps = playerMap[level.id]
    if (!ps || ps.playerCount < 5) continue
    if (!level.isSparse && !level.isEmpty) continue

    overrides.push({
      id:               makeId('curriculum_mismatch', level.id),
      type:             'curriculum_mismatch',
      title:            `${level.displayName} has high player load but sparse curriculum`,
      severity:         level.isEmpty ? 'critical' : 'high',
      philosophyStates: `Curriculum structure: ${level.displayName} has ${level.itemCount} items`,
      realityShows:     `${ps.playerCount} players are at this level with insufficient curriculum support`,
      recommendation:   `Prioritise curriculum development at ${level.displayName} — it has the highest active player load relative to content.`,
      confidence:       80,
      evidence: [
        `${ps.playerCount} active players at ${level.displayName}`,
        level.isEmpty ? 'Level has ZERO curriculum content' : `Only ${level.itemCount} items — too sparse for ${ps.playerCount} players`,
        ...(ps.weakDomains.length > 0 ? [`Weak domains: ${ps.weakDomains.join(', ')}`] : []),
      ],
      affectedLevelId:  level.id,
      affectedGateId:   null,
    })
  }

  // Curriculum has game-heavy levels but those levels have struggling players
  for (const gameLevel of gapReport.gameHeavyLevels) {
    const ps = playerMap[gameLevel.levelId]
    if (!ps || ps.playerCount === 0) continue

    const advRate = ps.advancementEligibleCount / ps.playerCount
    if (advRate >= 0.3) continue  // Players are fine

    overrides.push({
      id:               makeId('curriculum_mismatch', `gameheavy_${gameLevel.levelId}`),
      type:             'curriculum_mismatch',
      title:            `Game-heavy curriculum at ${gameLevel.levelName} not producing advancement`,
      severity:         'medium',
      philosophyStates: `Curriculum design: ${gameLevel.pct}% game content at ${gameLevel.levelName}`,
      realityShows:     `Only ${Math.round(advRate * 100)}% of players eligible to advance — game-only approach may lack technical foundation`,
      recommendation:   'Consider adding technical drills to build the foundational skills that game-based content assumes players already have.',
      confidence:       55,
      evidence: [
        `${gameLevel.pct}% of content at ${gameLevel.levelName} is game-based`,
        `${ps.playerCount} players — only ${ps.advancementEligibleCount} advancing`,
        `No technical drills to scaffold game play`,
      ],
      affectedLevelId:  gameLevel.levelId,
      affectedGateId:   null,
    })
  }

  return overrides
}

function detectGateFailures(
  gateReport: GateHealthReport,
): RealityOverride[] {
  const overrides: RealityOverride[] = []

  for (const gate of gateReport.bottlenecks) {
    overrides.push({
      id:               makeId('gate_failure', gate.gateId),
      type:             'gate_failure',
      title:            `Gate "${gate.criterion}" is creating a progression bottleneck`,
      severity:         'high',
      philosophyStates: `Gate design: "${gate.criterion}" should identify players ready for ${gate.toLevelName}`,
      realityShows:     gate.evidence[1] ?? 'Low advancement rate through this gate',
      recommendation:   gate.recommendation ?? 'Review gate criteria against actual player readiness indicators.',
      confidence:       gate.confidence,
      evidence:         gate.evidence,
      affectedLevelId:  gate.fromLevelId,
      affectedGateId:   gate.gateId,
    })
  }

  return overrides
}

function detectUnderuseSignals(
  levels: CurriculumLevelSummary[],
  playerByLevel: PlayerLevelSummary[],
  items: CurriculumItemSummary[],
): RealityOverride[] {
  const overrides: RealityOverride[] = []
  const playerMap: Record<string, PlayerLevelSummary> = {}
  for (const p of playerByLevel) playerMap[p.levelId] = p

  const itemsByLevel: Record<string, number> = {}
  for (const item of items) {
    itemsByLevel[item.levelId] = (itemsByLevel[item.levelId] ?? 0) + 1
  }

  for (const level of levels) {
    const ps = playerMap[level.id]
    const count = itemsByLevel[level.id] ?? 0

    if (count < 8) continue          // Not enough content to flag as overinvestment
    if (!ps || ps.playerCount > 0) continue  // Has players — not underused

    overrides.push({
      id:               makeId('underuse_signal', level.id),
      type:             'underuse_signal',
      title:            `${level.displayName} has extensive content but no active players`,
      severity:         'medium',
      philosophyStates: `Curriculum investment: ${count} items at ${level.displayName}`,
      realityShows:     `0 players are at this level — curriculum investment may not match academy reality`,
      recommendation:   'Verify whether this level is in your active player pathway. If not, focus curriculum effort on active levels instead.',
      confidence:       50,
      evidence: [
        `${count} curriculum items at ${level.displayName}`,
        `0 active players`,
        `Content is available but not being used`,
      ],
      affectedLevelId:  level.id,
      affectedGateId:   null,
    })
  }

  return overrides
}

// ── Main export ───────────────────────────────────────────────────────────────

export function detectRealityOverrides(params: {
  dna:           AcademyDnaSummary
  levels:        CurriculumLevelSummary[]
  gates:         CurriculumGateSummary[]
  playerByLevel: PlayerLevelSummary[]
  items:         CurriculumItemSummary[]
  gapReport:     CurriculumGapReport
  gateReport:    GateHealthReport
}): RealityOverrideReport {
  const { dna, levels, playerByLevel, items, gapReport, gateReport } = params

  const all: RealityOverride[] = [
    ...detectPhilosophyContradictions(dna, playerByLevel, levels),
    ...detectCurriculumMismatches(levels, playerByLevel, gapReport),
    ...detectGateFailures(gateReport),
    ...detectUnderuseSignals(levels, playerByLevel, items),
  ]

  // Sort: critical first, then by confidence descending
  all.sort((a, b) => {
    const sOrder = { critical: 0, high: 1, medium: 2 }
    const diff = sOrder[a.severity] - sOrder[b.severity]
    return diff !== 0 ? diff : b.confidence - a.confidence
  })

  return {
    overrides:  all,
    critical:   all.filter(o => o.severity === 'critical'),
    totalCount: all.length,
    computedAt: new Date().toISOString(),
  }
}
