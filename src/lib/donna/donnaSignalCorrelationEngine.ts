// Sprint 913.6 — DONNA Cross-Signal Correlation Engine V1
// Detects meaningful relationships between already-ranked signals in DirectorDonnaContext.
// Produces 1–3 "connected insights" that cannot be expressed by any single ranked signal.
//
// Rules:
//   - Deterministic only. No LLM. No DB calls. No mutations.
//   - Never invents data not in ctx. Empty ctx → empty result.
//   - String matching is case-insensitive + trimmed to reduce false negatives.
//   - Raw IDs (playerId, levelId) are never exposed in output text.
//   - Sorted: high severity first, then high confidence, then stable id.
//   - Never surfaces unsupported causal claims — uses "may" / "suggests" hedging.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'

// ── Types ──────────────────────────────────────────────────────────────────────

export type DonnaCorrelationCategory =
  | 'player_development'
  | 'curriculum_execution'
  | 'review_bottleneck'
  | 'coach_execution'
  | 'onboarding_readiness'
  | 'system'

export type DonnaCorrelationConfidence = 'high' | 'medium' | 'low'

export interface DonnaSignalCorrelation {
  id: string
  title: string
  category: DonnaCorrelationCategory
  severity: 'high' | 'medium' | 'low'
  confidence: DonnaCorrelationConfidence
  evidence: string
  whyItMatters: string
  recommendedAction: string
  href?: string
  donnaWillNotDo: string
}

// ── String match helpers ───────────────────────────────────────────────────────

function norm(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().trim()
}

// ── Main builder ───────────────────────────────────────────────────────────────

/**
 * Detects cross-signal correlations from DirectorDonnaContext.
 * Returns an empty array when no meaningful correlations exist.
 * Sorted: high severity → high confidence → stable id.
 */
export function buildSignalCorrelations(
  ctx: DirectorDonnaContext,
): DonnaSignalCorrelation[] {
  const correlations: DonnaSignalCorrelation[] = []

  // ── Rule 1: Same player stalled AND flagged at-risk ────────────────────────
  // A player appearing in both playerProgressStalls and attentionItems suggests
  // the stall may be linked to observable concern patterns — not just a pace issue.
  if (ctx.playerProgressStallContextAvailable && ctx.playerProgressStalls.length > 0) {
    const stalledNames = new Set(
      ctx.playerProgressStalls.map(s => norm(s.playerName)).filter(Boolean),
    )
    const crossedItems = ctx.attentionItems.filter(
      a => a.playerName && stalledNames.has(norm(a.playerName)),
    )

    if (crossedItems.length > 0) {
      const first = crossedItems[0]
      const stall = ctx.playerProgressStalls.find(s => norm(s.playerName) === norm(first.playerName))
      const levelNote = stall?.currentLevelDisplayName ? ` at ${stall.currentLevelDisplayName}` : ''
      const daysNote = stall ? ` for ${stall.daysAtCurrentLevel} days` : ''
      const riskLevel = crossedItems[0].risk
      correlations.push({
        id: 'player_stalled_and_risk_flagged',
        title: `${first.playerName} is stalled${levelNote} and has attention flags`,
        category: 'player_development',
        severity: riskLevel === 'high' ? 'high' : 'medium',
        confidence: 'high',
        evidence: `${first.playerName} has been${levelNote}${daysNote} without advancing and also appears in ${riskLevel}-risk attention signals (${first.reason}).`,
        whyItMatters: 'A player who is both stalled in development and showing concern signals may need a priority review — not just a routine level check.',
        recommendedAction: `Review ${first.playerName}'s player profile, check recent coach notes, and assess whether intervention or updated evidence is needed before making any level or parent communication decision.`,
        href: '/director/players',
        donnaWillNotDo: 'I will not move the player to a new level or contact their parent automatically.',
      })
    }
  }

  // ── Rule 2: Same level has stalled players AND assessment gaps ─────────────
  // A level appearing in both signals suggests the stall may be partly due to
  // missing assessment evidence — advancement cannot be justified without it.
  if (
    ctx.playerProgressStallContextAvailable &&
    ctx.assessmentContextAvailable &&
    ctx.playerProgressStalls.length > 0 &&
    ctx.assessmentCoverageGaps.length > 0
  ) {
    const stalledLevels = new Set(
      ctx.playerProgressStalls
        .map(s => norm(s.currentLevelDisplayName))
        .filter(Boolean),
    )
    const crossedGaps = ctx.assessmentCoverageGaps.filter(
      g => g.levelDisplayName && stalledLevels.has(norm(g.levelDisplayName)),
    )

    if (crossedGaps.length > 0) {
      const level = crossedGaps[0].levelDisplayName!
      const stalledCount = ctx.playerProgressStalls.filter(
        s => norm(s.currentLevelDisplayName) === norm(level),
      ).length
      correlations.push({
        id: 'level_stalled_and_assessment_gap',
        title: `${level} has stalled players and assessment coverage gaps`,
        category: 'player_development',
        severity: stalledCount >= 2 ? 'high' : 'medium',
        confidence: 'medium',
        evidence: `${level} has ${stalledCount} stalled player${stalledCount !== 1 ? 's' : ''} and at least one assessment coverage gap — level advancement decisions may lack evidence.`,
        whyItMatters: 'Stalled players at a level with assessment gaps may be stuck partly because the evidence base for advancement decisions is incomplete.',
        recommendedAction: `Review the assessment coverage for ${level} and schedule or record assessments before making advancement decisions for stalled players.`,
        href: '/director/players',
        donnaWillNotDo: 'I will not schedule assessments or modify assessment records automatically.',
      })
    }
  }

  // ── Rule 3: Same level has BOTH a template gap AND an assessment gap ────────
  // A level missing both session templates and assessment coverage has compounded
  // execution risk — coaches lack a delivery plan AND evidence is thin.
  if (
    ctx.templateCoverageContextAvailable &&
    ctx.assessmentContextAvailable &&
    ctx.curriculumTemplateCoverageGaps.length > 0 &&
    ctx.assessmentCoverageGaps.length > 0
  ) {
    const templateGapLevelNames = new Set(
      ctx.curriculumTemplateCoverageGaps.map(g => norm(g.levelDisplayName)),
    )
    const doubleGapLevels = ctx.assessmentCoverageGaps.filter(
      g => g.levelDisplayName && templateGapLevelNames.has(norm(g.levelDisplayName)),
    )

    if (doubleGapLevels.length > 0) {
      const level = doubleGapLevels[0].levelDisplayName!
      const tGap = ctx.curriculumTemplateCoverageGaps.find(g => norm(g.levelDisplayName) === norm(level))
      const playerNote = tGap?.playerCountAtLevel
        ? ` with ${tGap.playerCountAtLevel} active player${tGap.playerCountAtLevel !== 1 ? 's' : ''}`
        : ''
      correlations.push({
        id: 'level_double_gap_template_and_assessment',
        title: `${level} has both template and assessment coverage gaps`,
        category: 'curriculum_execution',
        severity: 'medium',
        confidence: 'high',
        evidence: `${level}${playerNote} has no matching session template AND at least one assessment coverage gap — both delivery plan and evidence base are missing.`,
        whyItMatters: 'A level lacking both structured delivery and assessment coverage has compounded execution risk: coaches may lack a plan, and advancement decisions lack evidence.',
        recommendedAction: `Assign a session template to ${level} and schedule assessments to close both gaps. Address the template first since it affects ongoing delivery.`,
        href: '/director/templates',
        donnaWillNotDo: 'I will not create or assign templates or assessments automatically.',
      })
    }
  }

  // ── Rule 4: Stale review queue while high-impact signals exist ─────────────
  // Stale decisions blocking coach/player workflows are amplified when high-impact
  // items (high-risk players, attendance exceptions) are also active.
  const staleAge = ctx.oldestPendingReviewAgeDays ?? 0
  if (
    ctx.pendingReviews > 0 &&
    staleAge >= 7 &&
    (ctx.highRiskPlayerCount > 0 || ctx.attendanceExceptions > 0)
  ) {
    const highImpactNote = ctx.highRiskPlayerCount > 0
      ? `${ctx.highRiskPlayerCount} high-risk player${ctx.highRiskPlayerCount !== 1 ? 's' : ''}`
      : `${ctx.attendanceExceptions} attendance exception${ctx.attendanceExceptions !== 1 ? 's' : ''}`
    correlations.push({
      id: 'stale_queue_with_high_impact',
      title: `Stale review queue while high-impact signals are active`,
      category: 'review_bottleneck',
      severity: staleAge >= 14 || ctx.highRiskPlayerCount > 0 ? 'high' : 'medium',
      confidence: 'medium',
      evidence: `Oldest review item is ${staleAge} days old while ${highImpactNote} also need attention — delays may compound.`,
      whyItMatters: 'A stale review queue alongside active high-impact signals suggests workflow bottlenecks are blocking the decisions that matter most.',
      recommendedAction: 'Open the Review Center, prioritize items connected to high-risk players or attendance exceptions, and clear them before the backlog grows further.',
      href: '/director/review',
      donnaWillNotDo: 'I will not approve or process any review items automatically.',
    })
  }

  // ── Rule 5: Advancement eligible players lack assessment evidence ──────────
  // Players ready to advance but without supporting assessment evidence may be
  // advanced without the proper evidence base — a quality and credibility risk.
  if (ctx.advancementEligibleCount > 0 && ctx.eligibleWithoutAssessmentEvidence > 0) {
    const n = ctx.eligibleWithoutAssessmentEvidence
    correlations.push({
      id: 'advancement_without_assessment_evidence',
      title: `${n} advancement-eligible player${n !== 1 ? 's' : ''} lack promotion assessment evidence`,
      category: 'player_development',
      severity: 'high',
      confidence: 'high',
      evidence: `${ctx.advancementEligibleCount} player${ctx.advancementEligibleCount !== 1 ? 's' : ''} meet advancement criteria, but ${n} of them have no promotion-ready assessment on record.`,
      whyItMatters: 'Advancing players without assessment evidence weakens the credibility of level decisions and may not support parent or player trust in the curriculum.',
      recommendedAction: 'Review assessment records for the advancement-eligible players. Schedule or record promotion-ready assessments before approving level movement.',
      href: '/director/players',
      donnaWillNotDo: 'I will not advance players, schedule assessments, or modify assessment records automatically.',
    })
  }

  // ── Rule 6: Multiple foundation gaps in onboarding ────────────────────────
  // When both players and coaches are missing, the academy cannot run sessions or
  // track observations — the entire intelligence layer has no foundation.
  if (
    (ctx.onboardingReadinessLevel === 'not_started' || ctx.onboardingReadinessLevel === 'partial') &&
    !ctx.hasPlayers &&
    !ctx.hasCoaches
  ) {
    correlations.push({
      id: 'foundation_not_ready',
      title: 'Academy is missing both players and coaches',
      category: 'onboarding_readiness',
      severity: 'medium',
      confidence: 'medium',
      evidence: 'No players and no coaches are configured — DONNA intelligence signals will be minimal or empty until the foundation is set up.',
      whyItMatters: 'Without players and coaches, sessions cannot run, observations cannot be captured, and operating intelligence has nothing to analyze. Setup is blocking the entire intelligence layer.',
      recommendedAction: 'Complete Academy Setup — add coaches first, then players. Each step requires director confirmation on the setup screen.',
      href: '/director/onboarding',
      donnaWillNotDo: 'I will not add coaches or players automatically. Each setup step requires director confirmation.',
    })
  }

  // Sort: high severity → high confidence → stable id
  const SEVERITY = { high: 0, medium: 1, low: 2 }
  const CONF = { high: 0, medium: 1, low: 2 }
  return correlations.sort((a, b) => {
    const sd = SEVERITY[a.severity] - SEVERITY[b.severity]
    if (sd !== 0) return sd
    const cd = CONF[a.confidence] - CONF[b.confidence]
    if (cd !== 0) return cd
    return a.id.localeCompare(b.id)
  })
}

/**
 * Returns the top N correlations, sorted by severity then confidence.
 * Returns [] when no correlations exist — callers should check before using.
 */
export function getTopSignalCorrelations(
  ctx: DirectorDonnaContext,
  limit = 3,
): DonnaSignalCorrelation[] {
  return buildSignalCorrelations(ctx).slice(0, limit)
}
