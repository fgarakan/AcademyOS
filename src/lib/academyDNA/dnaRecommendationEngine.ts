// Mega Sprint 2801–2830 — DONNA Academy Operating Intelligence V1
// DNA-Aware Recommendation Engine
//
// Produces deterministic, DNA-specific recommendations from academy signals.
// Two academies with the same underlying data but different DNA receive different
// recommendations — different priorities, different language, different urgency.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - No AI required. Deterministic rules only.
//   - Does NOT duplicate the existing TypedRecommendation system (proposed_actions table).
//     These are operating intelligence recommendations — not director approvals.
//   - Output is additive: consumed alongside existing attentionEngine outputs.
//   - Every recommendation carries a RecommendationTrace for full explainability.

import type { OperatingModelContext } from './operatingModelContext'
import type { AcademyDNAModelId } from './academyDNAModels'
import {
  buildRecommendationTrace,
  type RecommendationTrace,
  type TraceRiskLevel,
} from './recommendationTrace'

// ── Input signals ─────────────────────────────────────────────────────────────

export interface AcademySignals {
  activePlayers:           number
  stalledPlayerCount:      number   // 180+ days at same curriculum level
  attentionCount:          number   // players on hold or overdue for reassessment
  advancementReadyCount:   number
  reassessmentDueCount:    number
  coachRecapMissingCount:  number
  parentUpdatesPending:    number
  curriculumGapCount:      number
  totalPendingReviews:     number
  averageAttendanceRate:   number | null   // 0–1; null = not tracked
  enrollmentTrend:         'growing' | 'stable' | 'declining' | null
  daysSinceLastAssessment: number | null   // oldest overdue assessment age
  unassignedPlayerCount:   number
}

// ── Output types ──────────────────────────────────────────────────────────────

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low'
export type RecommendationDomain   = 'players' | 'coaches' | 'parents' | 'curriculum' | 'assessments' | 'enrollment' | 'operations'

export interface DnaAwareRecommendation {
  id:             string
  domain:         RecommendationDomain
  priority:       RecommendationPriority
  recommendation: string   // headline
  reason:         string   // one sentence why this matters for THIS academy
  dnaAlignment:   string   // explicit DNA influence statement
  confidence:     'high' | 'medium' | 'low'
  suggestedAction: string
  actionHref:     string
  trace:          RecommendationTrace
}

// ── Rule helpers ──────────────────────────────────────────────────────────────

function makeRec(
  id: string,
  domain: RecommendationDomain,
  priority: RecommendationPriority,
  recommendation: string,
  reason: string,
  dnaAlignment: string,
  suggestedAction: string,
  actionHref: string,
  riskIfIgnored: string,
  riskLevel: TraceRiskLevel,
  signalValues: { count: number; label: string; source: string }[],
  operatingModelInfluence: string,
): DnaAwareRecommendation {
  const dataSignals = signalValues.map(s => ({
    signal:   s.label,
    source:   s.source,
    strength: (s.count >= 3 ? 'strong' : s.count >= 1 ? 'moderate' : 'weak') as 'strong' | 'moderate' | 'weak',
  }))

  const trace = buildRecommendationTrace({
    dataSignals,
    academyDNAInfluence:      dnaAlignment,
    operatingModelInfluence,
    rationale:                `${recommendation}. ${reason}`,
    suggestedAction,
    riskIfIgnored,
    riskLevel,
  })

  return {
    id,
    domain,
    priority,
    recommendation,
    reason,
    dnaAlignment,
    confidence: trace.confidence,
    suggestedAction,
    actionHref,
    trace,
  }
}

// ── Model-specific rule sets ──────────────────────────────────────────────────

function rulesFor12UFoundation(
  signals: AcademySignals,
  ctx: OperatingModelContext,
): DnaAwareRecommendation[] {
  const recs: DnaAwareRecommendation[] = []
  const { coachStandards, parentStandards, assessmentStandards } = ctx

  // HIGHEST PRIORITY for 12U: retention signals and parent trust
  if (signals.coachRecapMissingCount > 0) {
    recs.push(makeRec(
      'foundation-recap-missing',
      'coaches',
      signals.coachRecapMissingCount >= 3 ? 'high' : 'medium',
      `${signals.coachRecapMissingCount} coach recap${signals.coachRecapMissingCount > 1 ? 's' : ''} missing — parent trust gap`,
      'In a foundation academy, coach recaps are the primary signal for parent communication. Missing recaps mean parents have nothing to be updated on.',
      'DNA tendency: "Surfaces player enjoyment and engagement signals first" — no recaps = no engagement signals = blind parent communication.',
      'Follow up with coaches to complete outstanding recaps before next parent update cycle.',
      '/director/sessions',
      'Parent updates are blocked. Parents who receive no news assume no progress — dropout risk increases.',
      signals.coachRecapMissingCount >= 3 ? 'high' : 'medium',
      [{ count: signals.coachRecapMissingCount, label: `${signals.coachRecapMissingCount} sessions missing recaps`, source: 'sessions' }],
      `Recap expectation: ${coachStandards.recapExpectation}. Overdue threshold: ${coachStandards.overdueRecapThresholdDays} days.`,
    ))
  }

  if (signals.parentUpdatesPending > 0) {
    recs.push(makeRec(
      'foundation-parent-updates',
      'parents',
      'high',
      `${signals.parentUpdatesPending} parent update${signals.parentUpdatesPending > 1 ? 's' : ''} pending — retention priority`,
      'Parent communication is the primary retention lever in a foundation academy. Pending updates mean parents feel uninformed.',
      'DNA tendency: "Emphasizes parent communication milestones" — parent updates are not optional in this model.',
      'Review and approve pending parent communication drafts before end of week.',
      '/director/review',
      'Silent parents become disengaged parents. Disengaged parents withdraw players. Retention is the primary KPI for this model.',
      'high',
      [{ count: signals.parentUpdatesPending, label: `${signals.parentUpdatesPending} parent updates pending`, source: 'proposed_actions' }],
      `Parent communication gap threshold: ${parentStandards.communicationGapThresholdDays} days. Tone: ${parentStandards.tone}.`,
    ))
  }

  if (signals.stalledPlayerCount > 0) {
    recs.push(makeRec(
      'foundation-player-stall',
      'players',
      'medium',
      `${signals.stalledPlayerCount} player${signals.stalledPlayerCount > 1 ? 's' : ''} stalled — check for engagement issues first`,
      'In a foundation academy, stalls are often engagement problems, not technical gaps. Check enjoyment signals before pushing assessment.',
      'DNA red flag: "Player dropout or disengagement." Before adding assessment pressure, investigate why the player has stopped progressing.',
      'Review the stalled players\' coach observations for engagement signals. Prioritise re-engagement over advancement scheduling.',
      '/director/players',
      'Stalled 12U players who are not re-engaged drop out — and often take their families with them.',
      'medium',
      [{ count: signals.stalledPlayerCount, label: `${signals.stalledPlayerCount} stalled players`, source: 'player_curriculum_states' }],
      `Assessment cadence: ${assessmentStandards.cadenceLabel}. Overdue threshold: ${assessmentStandards.overdueThresholdDays} days.`,
    ))
  }

  if (signals.averageAttendanceRate !== null && signals.averageAttendanceRate < 0.8) {
    const pct = Math.round(signals.averageAttendanceRate * 100)
    recs.push(makeRec(
      'foundation-attendance-drop',
      'players',
      'high',
      `Average attendance at ${pct}% — below 80% retention threshold`,
      'Attendance is the leading indicator of dropout in foundation academies. Below 80% is a retention emergency.',
      'DNA KPI: "attendance_rate" and "player_retention_rate." DNA green flag: "Consistent attendance above 85%." This academy is below threshold.',
      'Review the last 4 weeks of attendance by coach and group. Identify any group or time-slot pattern.',
      '/director/sessions',
      'Attendance below 80% without intervention almost always predicts player dropout within 30 days.',
      'high',
      [{ count: Math.round((1 - signals.averageAttendanceRate) * 100), label: `${pct}% average attendance`, source: 'sessions' }],
      'Attendance is the primary retention signal for this DNA model.',
    ))
  }

  if (signals.reassessmentDueCount > 0) {
    recs.push(makeRec(
      'foundation-reassessment',
      'assessments',
      'low',
      `${signals.reassessmentDueCount} player${signals.reassessmentDueCount > 1 ? 's' : ''} overdue for reassessment`,
      'Foundation academy assessments are milestone celebrations, not performance tests. Schedule them as positive checkpoints.',
      `DNA assessment cadence: ${assessmentStandards.cadenceLabel}. Assessment language: celebrate what players can do.`,
      'Schedule reassessments as fun milestone sessions rather than formal tests. Frame it positively to players and parents.',
      '/director/review',
      'Overdue assessments delay milestone communications, which reduces parent satisfaction.',
      'low',
      [{ count: signals.reassessmentDueCount, label: `${signals.reassessmentDueCount} players overdue`, source: 'player_curriculum_states' }],
      assessmentStandards.assessmentLanguage,
    ))
  }

  return recs
}

function rulesForPerformance12Plus(
  signals: AcademySignals,
  ctx: OperatingModelContext,
): DnaAwareRecommendation[] {
  const recs: DnaAwareRecommendation[] = []
  const { coachStandards, assessmentStandards } = ctx

  // HIGHEST PRIORITY for Performance: assessment compliance and advancement pipeline
  if (signals.reassessmentDueCount > 0) {
    recs.push(makeRec(
      'perf-assessment-overdue',
      'assessments',
      signals.reassessmentDueCount >= 3 || (signals.daysSinceLastAssessment ?? 0) > 30 ? 'critical' : 'high',
      `${signals.reassessmentDueCount} player${signals.reassessmentDueCount > 1 ? 's' : ''} overdue for assessment — advancement pipeline at risk`,
      'In a performance academy, assessment compliance is non-negotiable. Players cannot be advanced without current assessment data.',
      'DNA tendency: "Leads morning brief with assessment overdue alerts." DNA red flag: "Assessment overdue by more than 14 days."',
      'Schedule assessments immediately. Prioritise players closest to gate criteria completion.',
      '/director/review',
      'Advancement decisions made without assessment data are indefensible. Player and parent trust erodes when progression feels arbitrary.',
      'high',
      [
        { count: signals.reassessmentDueCount, label: `${signals.reassessmentDueCount} players overdue`, source: 'player_curriculum_states' },
        ...(signals.daysSinceLastAssessment !== null ? [{ count: signals.daysSinceLastAssessment, label: `Oldest overdue: ${signals.daysSinceLastAssessment} days`, source: 'assessments' }] : []),
      ],
      `Assessment cadence: ${assessmentStandards.cadenceLabel}. Overdue threshold: ${assessmentStandards.overdueThresholdDays} days. Gate strictness: ${assessmentStandards.gateStrictness}.`,
    ))
  }

  if (signals.stalledPlayerCount > 0) {
    recs.push(makeRec(
      'perf-player-stall',
      'players',
      signals.stalledPlayerCount >= 3 ? 'high' : 'medium',
      `${signals.stalledPlayerCount} player${signals.stalledPlayerCount > 1 ? 's' : ''} stalled — assessment and gate review required`,
      'Performance academy stalls are gate compliance problems. Each stalled player needs a specific gap-closing plan.',
      'DNA tendency: "Flags players stalled at same level for 60+ days." DNA red flag: "Player stagnation exceeding 90 days at same level."',
      'Review gate completion status for each stalled player. Identify the specific blocking criterion and schedule targeted work.',
      '/director/players',
      'Stalled performance players and their families lose confidence in the program. Parent escalations about advancement are predictable.',
      signals.stalledPlayerCount >= 3 ? 'high' : 'medium',
      [{ count: signals.stalledPlayerCount, label: `${signals.stalledPlayerCount} players stalled`, source: 'player_curriculum_states' }],
      `Assessment cadence: ${assessmentStandards.cadenceLabel}. Gate strictness: ${assessmentStandards.gateStrictness}.`,
    ))
  }

  if (signals.advancementReadyCount > 0) {
    recs.push(makeRec(
      'perf-advancement-ready',
      'players',
      'high',
      `${signals.advancementReadyCount} player${signals.advancementReadyCount > 1 ? 's are' : ' is'} advancement-ready — decision required`,
      'Performance academies must act on advancement signals promptly. Delays undermine the credibility of your assessment system.',
      'DNA tendency: "Prioritizes advancement pipeline visibility." DNA program priority: "player_advancement" (rank 1).',
      'Review advancement candidates and approve or defer each with documented rationale within 48 hours.',
      '/director/players',
      'Advancement-ready players who wait too long become frustrated. Their parents become vocal. Pipeline visibility is a core DNA KPI.',
      'high',
      [{ count: signals.advancementReadyCount, label: `${signals.advancementReadyCount} players ready to advance`, source: 'player_curriculum_states' }],
      `Advancement approval: ${ctx.operatingModel.programs.advancementApproval}. Gate strictness: ${assessmentStandards.gateStrictness}.`,
    ))
  }

  if (signals.coachRecapMissingCount > 0) {
    recs.push(makeRec(
      'perf-recap-missing',
      'coaches',
      signals.coachRecapMissingCount >= 3 ? 'high' : 'medium',
      `${signals.coachRecapMissingCount} detailed recap${signals.coachRecapMissingCount > 1 ? 's' : ''} missing — accountability gap`,
      'Performance academy coaches are required to provide detailed observations every session. Missing recaps are accountability failures.',
      'DNA red flag: "Coach recap completion below 80%." Observation depth: "detailed." Coach autonomy: "low."',
      `Follow up with coaches individually. Coaches at this model have low autonomy — recaps are ${coachStandards.recapExpectation}.`,
      '/director/sessions',
      'Without detailed recaps, DONNA cannot track technical progression or flag advancement readiness. The advancement pipeline goes dark.',
      'medium',
      [{ count: signals.coachRecapMissingCount, label: `${signals.coachRecapMissingCount} recaps missing`, source: 'sessions' }],
      `Observation depth: ${coachStandards.observationDepth}. Recap expectation: ${coachStandards.recapExpectation}.`,
    ))
  }

  return recs
}

function rulesForCollegePlacement(
  signals: AcademySignals,
  ctx: OperatingModelContext,
): DnaAwareRecommendation[] {
  const recs: DnaAwareRecommendation[] = []
  const { assessmentStandards } = ctx

  if (signals.stalledPlayerCount > 0) {
    recs.push(makeRec(
      'college-utr-stagnation',
      'players',
      'critical',
      `${signals.stalledPlayerCount} player${signals.stalledPlayerCount > 1 ? 's' : ''} stalled — recruiting timeline at risk`,
      'In a college placement academy, stagnation directly threatens recruiting timelines. College coaches need to see progressive improvement.',
      'DNA red flag: "UTR stagnation or decline over 60 days." DNA escalation trigger: immediate. Every month of stagnation narrows the recruiting window.',
      'Review each stalled player\'s UTR trend, competition schedule, and coach observations. Create an immediate performance plan.',
      '/director/players',
      'Stalled players miss recruiting windows. These windows do not come back. College placement is time-critical.',
      'critical',
      [{ count: signals.stalledPlayerCount, label: `${signals.stalledPlayerCount} players stalled`, source: 'player_curriculum_states' }],
      `Assessment cadence: ${assessmentStandards.cadenceLabel}. Assessment language: recruiting evidence documentation.`,
    ))
  }

  if (signals.advancementReadyCount > 0) {
    recs.push(makeRec(
      'college-tournament-window',
      'players',
      'high',
      `${signals.advancementReadyCount} player${signals.advancementReadyCount > 1 ? 's are' : ' is'} competition-ready — tournament entry review`,
      'College placement players who are assessment-ready should be in active competition. Every tournament builds the recruiting profile.',
      'DNA program priority: "competition_readiness" (rank 2). DNA tendency: "Recommends match play volume adjustments based on assessment."',
      'Review upcoming tournament entry windows for advancement-ready players. Confirm entries with coaches and families.',
      '/director/players',
      'Missed tournament windows are permanently lost recruiting profile-building opportunities.',
      'high',
      [{ count: signals.advancementReadyCount, label: `${signals.advancementReadyCount} assessment-ready players`, source: 'player_curriculum_states' }],
      'Tournament entry is part of the operating model for college placement academies.',
    ))
  }

  if (signals.coachRecapMissingCount > 0) {
    recs.push(makeRec(
      'college-match-notes-missing',
      'coaches',
      'high',
      `${signals.coachRecapMissingCount} session recap${signals.coachRecapMissingCount > 1 ? 's' : ''} missing — recruiting record gap`,
      'In a college placement academy, coach notes are part of the recruiting record. Missing notes cannot be reconstructed after the fact.',
      'DNA red flag: "Coach not documenting match performance observations." Every session is evidence for recruiting conversations.',
      'Ensure coaches understand that their observations are part of the recruiting file, not just operational records.',
      '/director/sessions',
      'Gaps in the coaching record weaken the recruiting case for players approaching contact windows.',
      'high',
      [{ count: signals.coachRecapMissingCount, label: `${signals.coachRecapMissingCount} recaps missing`, source: 'sessions' }],
      'Detailed observation depth required. Every session builds the recruiting narrative.',
    ))
  }

  return recs
}

function rulesForClubGrowth(
  signals: AcademySignals,
  ctx: OperatingModelContext,
): DnaAwareRecommendation[] {
  const recs: DnaAwareRecommendation[] = []
  const { parentStandards } = ctx

  if (signals.enrollmentTrend === 'declining') {
    recs.push(makeRec(
      'club-enrollment-declining',
      'enrollment',
      'critical',
      'Enrollment is declining — retention and growth intervention needed',
      'Enrollment growth is a primary KPI for club growth academies. A declining trend is the most critical signal DONNA can surface.',
      'DNA program priority: "enrollment_growth" (rank 2) and "retention_growth" (rank 1). DNA red flag: "Enrollment decline over 30 days."',
      'Review enrollment trend by group and age band. Identify which groups are losing players and at what pace.',
      '/director/players',
      'Unchecked enrollment decline becomes structural. The club growth model is entirely dependent on a growing or stable player base.',
      'critical',
      [{ count: 1, label: 'Enrollment trend: declining', source: 'enrollment_records' }],
      `Retention is the #1 KPI for this DNA model. Parent experience drives referrals.`,
    ))
  }

  if (signals.parentUpdatesPending > 0) {
    recs.push(makeRec(
      'club-parent-updates',
      'parents',
      'high',
      `${signals.parentUpdatesPending} parent update${signals.parentUpdatesPending > 1 ? 's' : ''} pending — community experience gap`,
      'In a club growth academy, parent communication builds the community that drives referrals. Pending updates are pending retention touchpoints.',
      'DNA tendency: "Surfaces parent engagement opportunities." DNA program priority: "parent_communication" (rank 3).',
      'Approve pending parent updates with a focus on milestone language — celebrate what players have achieved.',
      '/director/review',
      'Silent parents do not refer new players. The referral pipeline is the primary growth engine for this DNA model.',
      'high',
      [{ count: signals.parentUpdatesPending, label: `${signals.parentUpdatesPending} updates pending`, source: 'proposed_actions' }],
      `Communication gap threshold: ${parentStandards.communicationGapThresholdDays} days. Language style: retention-focused milestones.`,
    ))
  }

  if (signals.stalledPlayerCount > 0) {
    recs.push(makeRec(
      'club-stall-retention-risk',
      'players',
      'medium',
      `${signals.stalledPlayerCount} player${signals.stalledPlayerCount > 1 ? 's' : ''} stalled — prioritise re-engagement over advancement`,
      'Club growth stalls are disengagement signals, not gate failures. Re-engage before adding assessment pressure.',
      'DNA tendency: "Deprioritizes competition signals unless explicitly requested." Stalls here require a community and engagement lens, not an assessment lens.',
      'Review stalled players for attendance patterns and enjoyment signals. Consider a group activity or event to re-energise them.',
      '/director/players',
      'Stalled club growth players often disengage quietly before parents cancel enrollment.',
      'medium',
      [{ count: signals.stalledPlayerCount, label: `${signals.stalledPlayerCount} stalled players`, source: 'player_curriculum_states' }],
      'Retention is prioritised over advancement in this model. Engagement comes before gate compliance.',
    ))
  }

  if (signals.averageAttendanceRate !== null && signals.averageAttendanceRate < 0.75) {
    const pct = Math.round(signals.averageAttendanceRate * 100)
    recs.push(makeRec(
      'club-attendance-warning',
      'enrollment',
      'high',
      `Average attendance at ${pct}% — enrollment health signal`,
      'Low attendance in a club growth academy is a leading indicator of cancellation. Community experience drives attendance.',
      'DNA KPI: "player_retention_rate" and "session_completion_rate." Attendance reflects how much players want to come — it is the experience vote.',
      'Review attendance by group. Consider a community event or program refresh for the underperforming groups.',
      '/director/sessions',
      'Attendance below 75% in a club model almost always precedes cancellation notices within 60 days.',
      'high',
      [{ count: Math.round((1 - signals.averageAttendanceRate) * 100), label: `${pct}% average attendance`, source: 'sessions' }],
      'Attendance is the leading retention signal for this DNA model.',
    ))
  }

  return recs
}

// ── Shared rules (model-agnostic signals that DNA reshapes) ───────────────────

function sharedRules(
  signals: AcademySignals,
  ctx: OperatingModelContext,
): DnaAwareRecommendation[] {
  const recs: DnaAwareRecommendation[] = []

  if (signals.unassignedPlayerCount > 0) {
    const isPerformance = ctx.dnaModelId === 'performance_12plus' || ctx.dnaModelId === 'college_placement'
    recs.push(makeRec(
      'shared-unassigned-coaches',
      'coaches',
      isPerformance ? 'high' : 'medium',
      `${signals.unassignedPlayerCount} player${signals.unassignedPlayerCount > 1 ? 's have' : ' has'} no assigned coach`,
      isPerformance
        ? 'Performance academies require full coach accountability chains. No coach assignment = no accountability for player development.'
        : 'Players without coaches are invisible to the development tracking system.',
      `DNA program priority: "coach_accountability." All ${ctx.dnaModel.name} players must have a primary coach assignment.`,
      'Assign a primary coach to each unassigned player immediately.',
      '/director/players',
      'Players without coach assignments cannot be tracked for advancement, attendance, or engagement.',
      isPerformance ? 'high' : 'medium',
      [{ count: signals.unassignedPlayerCount, label: `${signals.unassignedPlayerCount} players without coach`, source: 'players' }],
      `Coach accountability is a ${ctx.dnaModelId === 'performance_12plus' ? 'ranked program priority' : 'standard operating requirement'}.`,
    ))
  }

  if (signals.curriculumGapCount > 0 && (ctx.dnaModelId === 'performance_12plus' || ctx.dnaModelId === 'college_placement')) {
    recs.push(makeRec(
      'shared-curriculum-gap',
      'curriculum',
      'medium',
      `${signals.curriculumGapCount} curriculum gap${signals.curriculumGapCount > 1 ? 's' : ''} — performance standards at risk`,
      'Performance and college placement academies require complete curriculum coverage at every active level.',
      `DNA emphasis: ${ctx.curriculumPriorities.sessionBias}. Gaps in coverage mean coaches cannot deliver against the operating model's curriculum standards.`,
      'Review the curriculum gaps report and prioritise the stages with active players.',
      '/director/curriculum',
      'Curriculum gaps in performance academies create inconsistent session quality — reducing the reliability of assessment data.',
      'medium',
      [{ count: signals.curriculumGapCount, label: `${signals.curriculumGapCount} curriculum gaps`, source: 'curriculum_levels' }],
      ctx.curriculumPriorities.lessonPlanGuidance,
    ))
  }

  return recs
}

// ── Main engine ───────────────────────────────────────────────────────────────

const MODEL_RULES: Record<
  AcademyDNAModelId,
  (signals: AcademySignals, ctx: OperatingModelContext) => DnaAwareRecommendation[]
> = {
  '12u_foundation':    rulesFor12UFoundation,
  'performance_12plus': rulesForPerformance12Plus,
  'college_placement': rulesForCollegePlacement,
  'club_growth':       rulesForClubGrowth,
}

/**
 * Build DNA-aware recommendations from academy signals + operating context.
 * Returns sorted list (critical → high → medium → low).
 * Deterministic — no AI required.
 */
export function buildDnaAwareRecommendations(
  ctx:     OperatingModelContext,
  signals: AcademySignals,
): DnaAwareRecommendation[] {
  const modelRules = MODEL_RULES[ctx.dnaModelId]
  const modelRecs  = modelRules(signals, ctx)
  const sharedRecs = sharedRules(signals, ctx)

  const all = [...modelRecs, ...sharedRecs]

  const order: Record<RecommendationPriority, number> = {
    critical: 0,
    high:     1,
    medium:   2,
    low:      3,
  }

  return all.sort((a, b) => order[a.priority] - order[b.priority])
}

/**
 * Answer a specific COO question using DNA context + signals.
 * Returns a structured answer object.
 */
export function answerCOOQuestion(
  question: 'attention' | 'why' | 'next' | 'dna_alignment' | 'biggest_risk' | 'biggest_opportunity' | 'coach_alignment' | 'player_progression',
  ctx: OperatingModelContext,
  signals: AcademySignals,
  recommendations: DnaAwareRecommendation[],
): { question: string; answer: string; confidence: 'high' | 'medium' | 'low' } {
  const top = recommendations[0]

  const questionLabels: Record<typeof question, string> = {
    attention:          'What needs attention today?',
    why:                'Why?',
    next:               'What should we do next?',
    dna_alignment:      'How does this align with our academy DNA?',
    biggest_risk:       'What is our biggest risk?',
    biggest_opportunity: 'What is our biggest opportunity?',
    coach_alignment:    'Are coaches aligned with our standards?',
    player_progression: 'Are players progressing according to our model?',
  }

  let answer: string

  switch (question) {
    case 'attention':
      answer = top
        ? `${top.recommendation}. (Priority: ${top.priority})`
        : signals.activePlayers === 0
          ? 'No active players — add players to begin operating intelligence.'
          : 'No critical signals detected. Academy is operating within expected parameters for this DNA model.'
      break

    case 'why':
      answer = top
        ? top.reason
        : 'No active signals requiring director attention at this time.'
      break

    case 'next':
      answer = top
        ? top.suggestedAction
        : 'Continue monitoring. No immediate action required.'
      break

    case 'dna_alignment':
      answer = top
        ? `${ctx.dnaModel.name}: ${top.dnaAlignment}`
        : `This academy operates as ${ctx.dnaModel.name}. ${ctx.donnaAssumptions.cooPersona}. Current signals are within DNA-expected parameters.`
      break

    case 'biggest_risk': {
      const riskItem = recommendations.find(r => r.priority === 'critical') ?? recommendations[0]
      answer = riskItem
        ? `${riskItem.recommendation} — ${riskItem.trace.riskIfIgnored}`
        : `No critical risks identified. DNA model red flags to monitor: ${ctx.dnaModel.redFlags[0] ?? 'none currently active'}.`
      break
    }

    case 'biggest_opportunity': {
      const opportunity = signals.advancementReadyCount > 0
        ? `${signals.advancementReadyCount} player${signals.advancementReadyCount > 1 ? 's are' : ' is'} ready to advance — acting now builds momentum.`
        : signals.parentUpdatesPending > 0
          ? `${signals.parentUpdatesPending} parent update${signals.parentUpdatesPending > 1 ? 's' : ''} pending — completing these builds trust and retention.`
          : ctx.dnaModel.greenFlags[0]
            ? `Watch for: ${ctx.dnaModel.greenFlags[0]}.`
            : 'Maintain current trajectory — no specific opportunity signal active.'
      answer = opportunity
      break
    }

    case 'coach_alignment': {
      const recapAlert = signals.coachRecapMissingCount > 0
      const coachStandard = ctx.coachStandards.recapExpectation
      answer = recapAlert
        ? `${signals.coachRecapMissingCount} recap${signals.coachRecapMissingCount > 1 ? 's' : ''} missing. Standard is: ${coachStandard}. ${ctx.coachStandards.misalignmentSignals[0] ?? 'Follow up needed.'}`
        : `Coach recap compliance is on track. Standard: ${coachStandard}. Observation depth expected: ${ctx.coachStandards.observationDepth}.`
      break
    }

    case 'player_progression': {
      const stalled = signals.stalledPlayerCount
      const ready = signals.advancementReadyCount
      answer = stalled > 0
        ? `${stalled} player${stalled > 1 ? 's are' : ' is'} stalled according to this model's progression standard. ${ctx.assessmentStandards.assessmentLanguage}`
        : ready > 0
          ? `${ready} player${ready > 1 ? 's are' : ' is'} advancement-ready. Overall progression is healthy.`
          : 'Player progression is within expected parameters for this DNA model.'
      break
    }
  }

  return {
    question: questionLabels[question],
    answer,
    confidence: recommendations.length > 0 && signals.activePlayers > 0 ? 'high' : 'low',
  }
}
