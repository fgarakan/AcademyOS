// Sprint 1776–1805 — DONNA Academy Operating Partner V1
// What Should I Do Today Engine: situation-gated strategic priority generator.
//
// ARCHITECTURAL GUARDS ENFORCED HERE:
//   Guard #1 (Situation Before Priority)  — situation is a REQUIRED parameter; no candidates
//             are generated without it.
//   Guard #2 (Attention ≠ Priority)       — attention signals inform candidate selection but
//             never appear directly as priorities. Candidates are constructed independently.
//   Guard #4 (Director Capacity Model)    — buildCapacityBudget() applied before Top Three Law.
//   Guard #5 (Top Three Law)              — hard slice to 3 after capacity enforcement.
//   Guard #6 (Missing Data Protection)    — when completeness < 20 or situation is unclear
//             with critical data missing, only an investigation priority is returned.
//   Guard #7 (Explainability Required)    — every TodayPriority carries a full explanation.

import type { OperatingPriority, AcademySituationAssessment, SituationType } from './operatingPartnerOutputContract'
import type { OperatingPartnerInputs }     from './operatingPartnerInputContract'
import type { OperatingAttentionReport }   from './academyAttentionEngine'
import type { TradeoffAnalysis }           from './operatingPartnerTradeoffEngine'
import type { DirectorCapacityBudget }     from './directorCapacityModel'
import type { PriorityExplanation }        from './operatingPartnerExplainability'
import { buildTradeoffAnalysis }           from './operatingPartnerTradeoffEngine'
import { buildCapacityBudget, estimateCapacityCost } from './directorCapacityModel'
import { buildPriorityExplanation }        from './operatingPartnerExplainability'

// ── Extended priority type ─────────────────────────────────────────────────────
// TodayPriority extends OperatingPriority with capacity and explanation fields.
// directorDailyBriefEngine strips these back to OperatingPriority for DirectorOperatingBrief.

export interface TodayPriority extends OperatingPriority {
  capacityCost: number
  tradeoff:     TradeoffAnalysis
  explanation:  PriorityExplanation
  whyToday:     string  // why this priority matters specifically today, not just why it exists
}

// ── Result type ────────────────────────────────────────────────────────────────

export interface TodayPriorityResult {
  priorities:        TodayPriority[]    // max 3; situation-gated; within capacity
  primaryAction:     TodayPriority | null
  situation:         AcademySituationAssessment
  budget:            DirectorCapacityBudget
  whatToIgnore:      string[]           // items DONNA is explicitly not surfacing today
  generatedAt:       string
  cannotBrief:       boolean            // true when data is too incomplete to produce any recommendation
  cannotBriefReason: string | null
}

// ── Briefability check ─────────────────────────────────────────────────────────
// Guard #6: only refuse to brief when BOTH situation is unclear AND completeness < 20.
// At 20+, we produce provisional investigation priorities rather than nothing.

function checkBriefability(
  inputs:    OperatingPartnerInputs,
  situation: AcademySituationAssessment,
): { canBrief: boolean; reason: string | null } {
  if (
    inputs.inputCompletenessScore < 20 &&
    situation.situationType === 'unclear_cause_requires_review'
  ) {
    return {
      canBrief: false,
      reason:   `Data completeness is ${inputs.inputCompletenessScore}/100 and situation cannot be classified. Load more data before DONNA can generate recommendations.`,
    }
  }
  return { canBrief: true, reason: null }
}

// ── Candidate generation ───────────────────────────────────────────────────────
// One function per situation type. Each produces 1–4 fully-formed OperatingPriority candidates.
// These are scored by the capacity model; only the fittest (up to 3) are surfaced.

function candidatesForSituation(
  situation: AcademySituationAssessment,
  inputs:    OperatingPartnerInputs,
  _signals:  OperatingAttentionReport,  // available for signal counts if needed
): OperatingPriority[] {
  const t = situation.situationType
  switch (t) {
    case 'unclear_cause_requires_review': return investigationCandidates(inputs, situation)
    case 'communication_gap':             return communicationGapCandidates(inputs)
    case 'coach_execution_gap':           return coachExecutionCandidates(inputs)
    case 'player_progression_bottleneck': return playerProgressionCandidates(inputs)
    case 'curriculum_gap':                return curriculumGapCandidates(inputs)
    case 'assessment_debt':               return assessmentDebtCandidates(inputs)
    case 'parent_retention_risk':         return parentRetentionCandidates(inputs)
    case 'philosophy_drift':              return philosophyDriftCandidates(inputs)
    case 'business_capacity_issue':       return businessCapacityCandidates(inputs)
    case 'opportunity_to_double_down':    return opportunityCandidates(inputs)
  }
}

// ── Situation-specific candidate builders ──────────────────────────────────────

function investigationCandidates(
  inputs:    OperatingPartnerInputs,
  situation: AcademySituationAssessment,
): OperatingPriority[] {
  const missing = [
    ...inputs.missingCriticalInputs,
    ...situation.missingData,
  ].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 3)

  return [{
    rank: 1,
    title: 'Gather missing data before DONNA can advise',
    domain: 'system',
    urgency: 'immediate',
    expectedImpact: 'medium',
    confidence: 'provisional',
    timeEstimate: '15 minutes',
    firstStep: missing.length > 0
      ? `Load the following: ${missing.join(', ')}.`
      : 'Complete academy onboarding and ensure all domains have data loaded.',
    approvalRequired: false,
    evidenceUsed: [`Completeness score: ${inputs.inputCompletenessScore}/100`, 'Situation: unclear_cause_requires_review'],
    missingData: missing,
    reason: 'Situation cannot be classified because critical data is missing. No reliable priority can be generated until the data gaps are resolved.',
  }]
}

function communicationGapCandidates(inputs: OperatingPartnerInputs): OperatingPriority[] {
  const { system, parents } = inputs.operations
  const candidates: OperatingPriority[] = []

  if (system.dataAvailable && system.oldestPendingAgeDays !== null && system.oldestPendingAgeDays >= 7) {
    candidates.push({
      rank: 1,
      title: `Clear ${system.pendingApprovalCount} stale item(s) from the approval queue`,
      domain: 'system',
      urgency: 'immediate',
      expectedImpact: 'high',
      confidence: 'reliable',
      timeEstimate: '20 minutes',
      firstStep: 'Open the approval queue and review each pending item. Approve or reject each one to restore the flow.',
      approvalRequired: false,
      evidenceUsed: [`${system.pendingApprovalCount} pending approvals — oldest is ${system.oldestPendingAgeDays} days old`],
      missingData: [],
      reason: 'A stale approval queue blocks coach and curriculum workflows. DONNA cannot confirm coach-proposed changes while approvals are pending.',
    })
  }

  if (parents.dataAvailable && parents.updateOverdueCount >= 3) {
    candidates.push({
      rank: 2,
      title: `Send ${parents.updateOverdueCount} overdue parent update(s)`,
      domain: 'parents',
      urgency: 'this_week',
      expectedImpact: 'medium',
      confidence: 'reliable',
      timeEstimate: '15 minutes',
      firstStep: 'Generate progress updates for overdue families through the parent communication module.',
      approvalRequired: false,
      evidenceUsed: [`${parents.updateOverdueCount} parent updates past transparency threshold`],
      missingData: [],
      reason: 'Overdue parent communication erodes trust and increases retention risk. Clearing this backlog restores the transparency covenant.',
    })
  }

  if (parents.dataAvailable && parents.communicationGapCount >= 5) {
    candidates.push({
      rank: 3,
      title: `Address communication gap: ${parents.communicationGapCount} parents without recent updates`,
      domain: 'parents',
      urgency: 'this_week',
      expectedImpact: 'medium',
      confidence: 'reliable',
      timeEstimate: '20 minutes',
      firstStep: 'Identify which families are in the communication gap and send a brief progress note.',
      approvalRequired: false,
      evidenceUsed: [`${parents.communicationGapCount} parents have not received a recent update`],
      missingData: [],
      reason: 'Communication gaps correlate with parent disengagement and eventual retention risk.',
    })
  }

  if (candidates.length === 0) {
    candidates.push({
      rank: 1,
      title: 'Review outstanding communications and approval queue',
      domain: 'system',
      urgency: 'this_week',
      expectedImpact: 'medium',
      confidence: 'provisional',
      timeEstimate: '15 minutes',
      firstStep: 'Review approval queue and parent communication dashboard.',
      approvalRequired: false,
      evidenceUsed: ['Communication gap situation detected'],
      missingData: inputs.missingCriticalInputs,
      reason: 'Communication gap situation flagged — specific queue data not available to confirm item count.',
    })
  }

  return candidates
}

function coachExecutionCandidates(inputs: OperatingPartnerInputs): OperatingPriority[] {
  const { coaches, players } = inputs.operations
  const candidates: OperatingPriority[] = []

  if (coaches.dataAvailable && coaches.missingWrapUpCount >= 1) {
    candidates.push({
      rank: 1,
      title: `Clear ${coaches.missingWrapUpCount} outstanding session recap${coaches.missingWrapUpCount > 1 ? 's' : ''}`,
      domain: 'coaches',
      urgency: coaches.missingWrapUpCount >= 5 ? 'immediate' : 'this_week',
      expectedImpact: 'high',
      confidence: 'reliable',
      timeEstimate: '10 minutes',
      firstStep: `Contact the ${coaches.missingWrapUpCoachCount} coach${coaches.missingWrapUpCoachCount > 1 ? 'es' : ''} with missing recaps and request immediate submission.`,
      approvalRequired: false,
      evidenceUsed: [`${coaches.missingWrapUpCount} sessions missing recaps across ${coaches.missingWrapUpCoachCount} coaches`],
      missingData: [],
      reason: "Session recaps are DONNA's primary development intelligence source. Missing recaps create a blind spot that prevents accurate priority detection.",
    })
  }

  if (coaches.dataAvailable && coaches.inconsistentExecutionCount >= 1) {
    candidates.push({
      rank: 2,
      title: `Review delivery consistency with ${coaches.inconsistentExecutionCount} coach${coaches.inconsistentExecutionCount > 1 ? 'es' : ''}`,
      domain: 'coaches',
      urgency: 'this_week',
      expectedImpact: 'medium',
      confidence: coaches.hasExecutionData ? 'reliable' : 'provisional',
      timeEstimate: '20 minutes per coach',
      firstStep: 'Schedule brief 1-on-1 sessions to clarify curriculum delivery expectations and address deviations.',
      approvalRequired: false,
      evidenceUsed: [`${coaches.inconsistentExecutionCount} coaches showing delivery deviation from curriculum plan`],
      missingData: coaches.hasExecutionData ? [] : ['Coach execution data not fully loaded'],
      reason: 'Inconsistent delivery fragments the player development experience and undermines curriculum effectiveness.',
    })
  }

  if (
    players.dataAvailable && coaches.dataAvailable &&
    players.stallCount >= 3 && coaches.missingWrapUpCount >= 2
  ) {
    candidates.push({
      rank: 3,
      title: `Investigate player stall (${players.stallCount} players) linked to coaching gap`,
      domain: 'cross_domain',
      urgency: 'this_week',
      expectedImpact: 'high',
      confidence: 'reliable',
      timeEstimate: '30 minutes',
      firstStep: 'Cross-reference stalled players with coaches who have missing recaps to confirm the connection.',
      approvalRequired: false,
      evidenceUsed: [`${players.stallCount} stalled players`, `${coaches.missingWrapUpCount} missing session recaps`],
      missingData: [],
      reason: 'Player stall and coach execution gaps are co-occurring — the stall may be driven by incomplete coaching rather than curriculum issues.',
    })
  }

  if (coaches.dataAvailable && coaches.stagnantPlayerByCoachCount >= 2) {
    candidates.push({
      rank: 4,
      title: `Review ${coaches.stagnantPlayerByCoachCount} coaches with multiple stalled players`,
      domain: 'coaches',
      urgency: 'this_week',
      expectedImpact: 'medium',
      confidence: 'reliable',
      timeEstimate: '20 minutes',
      firstStep: "Review each flagged coach's recent session plans and player assignment quality.",
      approvalRequired: false,
      evidenceUsed: [`${coaches.stagnantPlayerByCoachCount} coaches with 2+ stalled players assigned`],
      missingData: [],
      reason: 'Multiple stalled players per coach signals a systemic coaching effectiveness gap, not random player variance.',
    })
  }

  if (candidates.length === 0) {
    candidates.push({
      rank: 1,
      title: 'Address coaching execution gap',
      domain: 'coaches',
      urgency: 'this_week',
      expectedImpact: 'medium',
      confidence: 'provisional',
      timeEstimate: '20 minutes',
      firstStep: 'Load coach execution data and identify which coaches require follow-up.',
      approvalRequired: false,
      evidenceUsed: ['Coach execution gap situation detected'],
      missingData: inputs.missingCriticalInputs,
      reason: 'Coaching gap detected but specific data needed to confirm root cause.',
    })
  }

  return candidates
}

function playerProgressionCandidates(inputs: OperatingPartnerInputs): OperatingPriority[] {
  const { players, curriculum } = inputs.operations
  const candidates: OperatingPriority[] = []

  if (curriculum.dataAvailable && curriculum.playerBackedBottleneckCount >= 1) {
    candidates.push({
      rank: 1,
      title: `Fix ${curriculum.playerBackedBottleneckCount} curriculum bottleneck${curriculum.playerBackedBottleneckCount > 1 ? 's' : ''} confirmed by player evidence`,
      domain: 'curriculum',
      urgency: 'immediate',
      expectedImpact: 'high',
      confidence: curriculum.hasPlayerEvidenceData ? 'reliable' : 'provisional',
      timeEstimate: '30 minutes per bottleneck level',
      firstStep: 'Open the curriculum builder and address the content gap in the identified bottleneck levels.',
      approvalRequired: false,
      evidenceUsed: [`${curriculum.playerBackedBottleneckCount} levels with player evidence of bottleneck`],
      missingData: curriculum.hasPlayerEvidenceData ? [] : ['Player evidence data not fully loaded'],
      reason: 'Player evidence is the highest-quality signal. When evidence confirms a curriculum bottleneck, it takes precedence over all other priorities.',
    })
  }

  if (players.dataAvailable && players.advancementEligibleCount >= 3) {
    candidates.push({
      rank: 2,
      title: `Advance ${players.advancementEligibleCount} players who have met level criteria`,
      domain: 'players',
      urgency: 'this_week',
      expectedImpact: 'medium',
      confidence: 'reliable',
      timeEstimate: '15 minutes',
      firstStep: 'Review each advancement-eligible player and confirm with their coach before processing.',
      approvalRequired: true,
      evidenceUsed: [`${players.advancementEligibleCount} players meeting advancement criteria`],
      missingData: [],
      reason: 'Delayed advancement stalls player motivation and creates bottlenecks in level capacity.',
    })
  }

  if (players.dataAvailable && players.readinessBlockerCount >= 2) {
    candidates.push({
      rank: 3,
      title: `Resolve ${players.readinessBlockerCount} evidence blockers preventing advancement`,
      domain: 'players',
      urgency: 'this_week',
      expectedImpact: 'medium',
      confidence: 'reliable',
      timeEstimate: '15 minutes per player',
      firstStep: 'Identify which evidence records are missing for each blocked player and assign collection tasks to coaches.',
      approvalRequired: false,
      evidenceUsed: [`${players.readinessBlockerCount} players blocked by missing evidence records`],
      missingData: [],
      reason: 'Evidence blockers prevent the placement system from functioning correctly — clearing them unlocks advancement.',
    })
  }

  if (candidates.length === 0) {
    candidates.push({
      rank: 1,
      title: 'Investigate player progression bottleneck',
      domain: 'players',
      urgency: 'this_week',
      expectedImpact: 'high',
      confidence: 'provisional',
      timeEstimate: '20 minutes',
      firstStep: 'Load player progression data to identify which levels are blocking advancement.',
      approvalRequired: false,
      evidenceUsed: ['Player progression bottleneck detected'],
      missingData: inputs.missingCriticalInputs,
      reason: 'Bottleneck confirmed by situation classifier but specific level data needed to act.',
    })
  }

  return candidates
}

function curriculumGapCandidates(inputs: OperatingPartnerInputs): OperatingPriority[] {
  const { curriculum } = inputs.operations
  const candidates: OperatingPriority[] = []

  if (curriculum.dataAvailable && curriculum.emptyLevelCount >= 1) {
    candidates.push({
      rank: 1,
      title: `Build content for ${curriculum.emptyLevelCount} empty curriculum level${curriculum.emptyLevelCount > 1 ? 's' : ''}`,
      domain: 'curriculum',
      urgency: curriculum.emptyLevelCount >= 3 ? 'immediate' : 'this_week',
      expectedImpact: 'high',
      confidence: curriculum.hasCurriculumData ? 'reliable' : 'provisional',
      timeEstimate: `${20 * curriculum.emptyLevelCount} minutes`,
      firstStep: 'Open the curriculum builder and add at least 3 academy-owned items to each empty level before the next player intake.',
      approvalRequired: false,
      evidenceUsed: [`${curriculum.emptyLevelCount} levels with no academy-owned content`],
      missingData: [],
      reason: 'Empty levels are the highest-risk curriculum gap — players advancing into them have no curriculum path, which stalls their development.',
    })
  }

  if (curriculum.dataAvailable && curriculum.missingGateCount >= 2) {
    candidates.push({
      rank: 2,
      title: `Define ${curriculum.missingGateCount} missing advancement gate${curriculum.missingGateCount > 1 ? 's' : ''}`,
      domain: 'curriculum',
      urgency: 'this_week',
      expectedImpact: 'high',
      confidence: curriculum.hasGateData ? 'reliable' : 'provisional',
      timeEstimate: '15 minutes per level',
      firstStep: 'Open the curriculum builder for each level missing a gate and define the advancement criteria.',
      approvalRequired: false,
      evidenceUsed: [`${curriculum.missingGateCount} levels have no defined advancement gate`],
      missingData: curriculum.hasGateData ? [] : ['Gate data not loaded'],
      reason: 'Undefined advancement gates prevent coaches from objectively advancing players — every coach decision becomes subjective.',
    })
  }

  if (curriculum.dataAvailable && curriculum.weakLevelCount >= 2) {
    candidates.push({
      rank: 3,
      title: `Strengthen ${curriculum.weakLevelCount} weak curriculum level${curriculum.weakLevelCount > 1 ? 's' : ''} (< 3 items each)`,
      domain: 'curriculum',
      urgency: 'this_month',
      expectedImpact: 'medium',
      confidence: curriculum.hasCurriculumData ? 'reliable' : 'provisional',
      timeEstimate: '15 minutes per level',
      firstStep: 'Identify which weak levels are most frequently visited by players and prioritise those.',
      approvalRequired: false,
      evidenceUsed: [`${curriculum.weakLevelCount} levels with fewer than 3 academy-owned items`],
      missingData: [],
      reason: 'Weak levels reduce coach confidence and lead to informal curriculum drift.',
    })
  }

  if (curriculum.dataAvailable && curriculum.missingAssessmentCount >= 2) {
    candidates.push({
      rank: 4,
      title: `Add success criteria to ${curriculum.missingAssessmentCount} levels missing them`,
      domain: 'curriculum',
      urgency: 'this_month',
      expectedImpact: 'medium',
      confidence: curriculum.hasCurriculumData ? 'reliable' : 'provisional',
      timeEstimate: '10 minutes per level',
      firstStep: 'Add at least 1 assessment or success criteria item to each flagged level.',
      approvalRequired: false,
      evidenceUsed: [`${curriculum.missingAssessmentCount} levels have no assessment items`],
      missingData: [],
      reason: 'Without success criteria, DONNA cannot detect when players have mastered a level.',
    })
  }

  if (candidates.length === 0) {
    candidates.push({
      rank: 1,
      title: 'Address curriculum content gaps',
      domain: 'curriculum',
      urgency: 'this_week',
      expectedImpact: 'high',
      confidence: 'provisional',
      timeEstimate: '30 minutes',
      firstStep: 'Load curriculum data to identify specific content gaps.',
      approvalRequired: false,
      evidenceUsed: ['Curriculum gap situation detected'],
      missingData: inputs.missingCriticalInputs,
      reason: 'Curriculum gap confirmed but specific data needed to identify which levels to address first.',
    })
  }

  return candidates
}

function assessmentDebtCandidates(inputs: OperatingPartnerInputs): OperatingPriority[] {
  const { players } = inputs.operations
  const candidates: OperatingPriority[] = []

  if (players.dataAvailable && players.advancementEligibleCount >= 3) {
    candidates.push({
      rank: 1,
      title: `Schedule evidence collection for ${players.advancementEligibleCount} advancement-ready players`,
      domain: 'players',
      urgency: 'immediate',
      expectedImpact: 'high',
      confidence: players.hasAssessmentData ? 'reliable' : 'provisional',
      timeEstimate: '15 minutes',
      firstStep: 'Assign evidence-collection tasks to the primary coaches for each advancement-eligible player.',
      approvalRequired: false,
      evidenceUsed: [`${players.advancementEligibleCount} players meet advancement criteria`],
      missingData: players.hasAssessmentData ? [] : ['Assessment data not fully loaded'],
      reason: 'Assessment debt compounds — each cycle without advancement evidence delays the next cohort of players.',
    })
  }

  if (players.dataAvailable && players.readinessBlockerCount >= 1) {
    candidates.push({
      rank: 2,
      title: `Clear ${players.readinessBlockerCount} evidence blockers before next assessment cycle`,
      domain: 'players',
      urgency: 'this_week',
      expectedImpact: 'high',
      confidence: 'reliable',
      timeEstimate: '10 minutes per player',
      firstStep: 'Review each blocked player and assign the missing evidence record to their coach.',
      approvalRequired: false,
      evidenceUsed: [`${players.readinessBlockerCount} players blocked from advancement by missing evidence`],
      missingData: [],
      reason: 'Evidence blockers are the most efficient fix — a small effort unlocks advancement for multiple players.',
    })
  }

  if (players.dataAvailable && players.assessmentDueCount >= 3) {
    candidates.push({
      rank: 3,
      title: `Schedule ${players.assessmentDueCount} overdue player assessments`,
      domain: 'players',
      urgency: 'this_week',
      expectedImpact: 'medium',
      confidence: players.hasAssessmentData ? 'reliable' : 'provisional',
      timeEstimate: '10 minutes to schedule, then 1 session per player',
      firstStep: 'Block assessment time in the next week for each overdue player.',
      approvalRequired: false,
      evidenceUsed: [`${players.assessmentDueCount} players due for assessment`],
      missingData: [],
      reason: 'Overdue assessments prevent DONNA from detecting stall vs. growth accurately.',
    })
  }

  if (candidates.length === 0) {
    candidates.push({
      rank: 1,
      title: 'Clear assessment debt before adding new curriculum content',
      domain: 'players',
      urgency: 'this_week',
      expectedImpact: 'high',
      confidence: 'provisional',
      timeEstimate: '20 minutes',
      firstStep: 'Load player assessment data to identify who is overdue.',
      approvalRequired: false,
      evidenceUsed: ['Assessment debt situation detected'],
      missingData: inputs.missingCriticalInputs,
      reason: 'Assessment debt means the system is running on stale development data.',
    })
  }

  return candidates
}

function parentRetentionCandidates(inputs: OperatingPartnerInputs): OperatingPriority[] {
  const { parents, players } = inputs.operations
  const candidates: OperatingPriority[] = []

  if (parents.dataAvailable && parents.retentionRiskCount >= 1) {
    candidates.push({
      rank: 1,
      title: `Contact ${parents.retentionRiskCount} at-risk famil${parents.retentionRiskCount > 1 ? 'ies' : 'y'} before situation escalates`,
      domain: 'parents',
      urgency: 'immediate',
      expectedImpact: 'high',
      confidence: parents.hasRetentionData ? 'reliable' : 'provisional',
      timeEstimate: '10 minutes per family',
      firstStep: 'Draft a personalised progress update for each at-risk family, acknowledging the stall and setting expectations.',
      approvalRequired: false,
      evidenceUsed: [`${parents.retentionRiskCount} families with combined parent disengagement + player stall`],
      missingData: parents.hasRetentionData ? [] : ['Retention signal data not fully loaded'],
      reason: "Combined parent disengagement and player stall is the strongest churn predictor. Early contact prevents cancellation — late contact does not.",
    })
  }

  if (players.dataAvailable && players.stallCount >= 2 && parents.dataAvailable && parents.retentionRiskCount >= 1) {
    candidates.push({
      rank: 2,
      title: `Address player stall for ${players.stallCount} at-risk families`,
      domain: 'cross_domain',
      urgency: 'this_week',
      expectedImpact: 'high',
      confidence: 'reliable',
      timeEstimate: '30 minutes',
      firstStep: 'Identify which stalled players belong to retention-risk families and escalate to their coaches.',
      approvalRequired: false,
      evidenceUsed: [`${players.stallCount} stalled players`, `${parents.retentionRiskCount} retention-risk families`],
      missingData: [],
      reason: 'Stall within retention-risk families is a compound signal. Both coach action and parent communication are needed simultaneously.',
    })
  }

  if (parents.dataAvailable && parents.communicationGapCount >= 3) {
    candidates.push({
      rank: 3,
      title: `Close communication gap for ${parents.communicationGapCount} parents without recent updates`,
      domain: 'parents',
      urgency: 'this_week',
      expectedImpact: 'medium',
      confidence: parents.hasCommunicationData ? 'reliable' : 'provisional',
      timeEstimate: '20 minutes',
      firstStep: 'Generate and send a progress update for each family in the communication gap.',
      approvalRequired: false,
      evidenceUsed: [`${parents.communicationGapCount} parents without recent update`],
      missingData: parents.hasCommunicationData ? [] : ['Communication data not fully loaded'],
      reason: 'Communication gaps are early-stage retention risk. Closing them before disengagement sets in is far more effective than later recovery.',
    })
  }

  if (candidates.length === 0) {
    candidates.push({
      rank: 1,
      title: 'Address parent retention risk',
      domain: 'parents',
      urgency: 'this_week',
      expectedImpact: 'high',
      confidence: 'provisional',
      timeEstimate: '20 minutes',
      firstStep: 'Load parent retention data to identify specific at-risk families.',
      approvalRequired: false,
      evidenceUsed: ['Parent retention risk situation detected'],
      missingData: inputs.missingCriticalInputs,
      reason: 'Retention risk confirmed by situation classifier but family-level data needed to act.',
    })
  }

  return candidates
}

function philosophyDriftCandidates(inputs: OperatingPartnerInputs): OperatingPriority[] {
  const { drift } = inputs.philosophy

  return [
    {
      rank: 1,
      title: 'Review philosophy drift with director before next intake decision',
      domain: 'philosophy',
      urgency: 'this_month',
      expectedImpact: 'medium',
      confidence: drift.confidence,
      timeEstimate: '20 minutes',
      firstStep: drift.suggestedAction || 'Open the academy DNA review and compare stated preferences against recent curriculum and player decisions.',
      approvalRequired: true,
      evidenceUsed: drift.driftedDimensions.map(d => `Drift in: ${d.dimension} (gap: ${d.gap})`),
      missingData: [],
      reason: 'Philosophy drift means the academy is operating differently from its stated identity. Left unaddressed, it compounds — each new player is placed against an inaccurate profile.',
    },
    {
      rank: 2,
      title: 'Reconcile recent curriculum decisions against academy DNA',
      domain: 'curriculum',
      urgency: 'this_month',
      expectedImpact: 'medium',
      confidence: drift.confidence,
      timeEstimate: '30 minutes',
      firstStep: "Review the last 10 curriculum additions and flag any that contradict the academy's stated philosophy dimensions.",
      approvalRequired: false,
      evidenceUsed: ['Philosophy drift: HIGH severity', ...drift.driftedDimensions.map(d => d.description)],
      missingData: [],
      reason: 'Curriculum decisions accumulate. If they consistently drift from stated philosophy, the curriculum will silently become misaligned with what the director wants to build.',
    },
  ]
}

function businessCapacityCandidates(inputs: OperatingPartnerInputs): OperatingPriority[] {
  const { business } = inputs.operations
  const candidates: OperatingPriority[] = []

  if (business.dataAvailable && business.enrollmentTrendSignal === 'declining') {
    candidates.push({
      rank: 1,
      title: 'Investigate enrollment decline before accepting new players',
      domain: 'business',
      urgency: 'this_week',
      expectedImpact: 'high',
      confidence: business.hasEnrollmentData ? 'reliable' : 'provisional',
      timeEstimate: '30 minutes',
      firstStep: 'Review enrollment data from the last 60 days and identify when the decline began.',
      approvalRequired: false,
      evidenceUsed: ['Enrollment trend signal: declining'],
      missingData: business.hasEnrollmentData ? [] : ['Enrollment data not fully loaded'],
      reason: 'Declining enrollment is a lagging signal — it means the problem existed weeks ago. Early investigation prevents it from compounding.',
    })
  }

  if (business.dataAvailable && business.capacityIssueCount >= 1) {
    candidates.push({
      rank: 2,
      title: `Review allocation for ${business.capacityIssueCount} program(s) at or over capacity`,
      domain: 'business',
      urgency: 'this_week',
      expectedImpact: 'medium',
      confidence: business.hasCapacityData ? 'reliable' : 'provisional',
      timeEstimate: '20 minutes',
      firstStep: 'Open the program capacity view and identify which groups need redistribution before the next session.',
      approvalRequired: false,
      evidenceUsed: [`${business.capacityIssueCount} programs at or over capacity`],
      missingData: business.hasCapacityData ? [] : ['Capacity data not fully loaded'],
      reason: 'Over-capacity sessions degrade quality and frustrate players — the most direct path to churn.',
    })
  }

  if (business.dataAvailable && business.churnRiskSignal === 'high') {
    candidates.push({
      rank: 3,
      title: 'Investigate high churn risk across all domains',
      domain: 'business',
      urgency: 'immediate',
      expectedImpact: 'high',
      confidence: 'reliable',
      timeEstimate: '30 minutes',
      firstStep: 'Review the combined churn signal across parent, player, and business data to identify the root domain.',
      approvalRequired: false,
      evidenceUsed: ['Churn risk signal: HIGH'],
      missingData: [],
      reason: 'High churn risk is a compound signal — waiting makes it more expensive to recover.',
    })
  }

  if (candidates.length === 0) {
    candidates.push({
      rank: 1,
      title: 'Review business capacity and enrollment pipeline',
      domain: 'business',
      urgency: 'this_week',
      expectedImpact: 'medium',
      confidence: 'provisional',
      timeEstimate: '20 minutes',
      firstStep: 'Load business operational data to assess enrollment and capacity state.',
      approvalRequired: false,
      evidenceUsed: ['Business capacity issue situation detected'],
      missingData: inputs.missingCriticalInputs,
      reason: 'Capacity issue flagged by situation classifier but business-level data needed to confirm.',
    })
  }

  return candidates
}

function opportunityCandidates(inputs: OperatingPartnerInputs): OperatingPriority[] {
  const { players, curriculum } = inputs.operations
  const { preferences, evolution }  = inputs.philosophy

  const candidates: OperatingPriority[] = []

  if (players.dataAvailable && players.advancementEligibleCount >= 2) {
    candidates.push({
      rank: 1,
      title: `Capitalise on advancement momentum: advance ${players.advancementEligibleCount} eligible players`,
      domain: 'players',
      urgency: 'this_week',
      expectedImpact: 'high',
      confidence: 'reliable',
      timeEstimate: '15 minutes',
      firstStep: 'Review advancement-eligible players and confirm readiness with their coaches before processing.',
      approvalRequired: true,
      evidenceUsed: [`${players.advancementEligibleCount} players ready for advancement`],
      missingData: [],
      reason: 'Positive momentum is the best time to advance players — delay erodes the motivational signal.',
    })
  }

  if (preferences.topPreferences.length > 0) {
    const top = preferences.topPreferences[0]
    candidates.push({
      rank: 2,
      title: `Double down on your strongest identity signal: ${top.label}`,
      domain: 'curriculum',
      urgency: 'this_month',
      expectedImpact: 'medium',
      confidence: top.confidence,
      timeEstimate: '30 minutes',
      firstStep: `Review which curriculum levels most reflect "${top.label}" and add or strengthen content aligned with it.`,
      approvalRequired: false,
      evidenceUsed: [`Top academy preference: ${top.label} (score ${top.score})`],
      missingData: [],
      reason: 'Your strongest identity signal is your competitive advantage. Making it explicit in curriculum deepens differentiation.',
    })
  }

  const recentPhase = evolution.recentPhases[evolution.recentPhases.length - 1]
  if (recentPhase && recentPhase.activityLevel === 'high' && recentPhase.playersAdvanced >= 3) {
    candidates.push({
      rank: 3,
      title: 'Extend what worked last period to the next cohort',
      domain: 'curriculum',
      urgency: 'this_month',
      expectedImpact: 'medium',
      confidence: 'reliable',
      timeEstimate: '20 minutes',
      firstStep: `Review what drove the ${recentPhase.playersAdvanced} advancements in ${recentPhase.periodLabel} and apply the same approach to the current cohort.`,
      approvalRequired: false,
      evidenceUsed: [`${recentPhase.playersAdvanced} players advanced in ${recentPhase.periodLabel}`],
      missingData: [],
      reason: 'Recent high-activity phases contain proven approaches. Extending them is lower risk than introducing new methods.',
    })
  }

  if (curriculum.dataAvailable && curriculum.emptyLevelCount === 0 && curriculum.missingGateCount === 0) {
    candidates.push({
      rank: 4,
      title: 'Prepare next intake — curriculum is structurally sound',
      domain: 'curriculum',
      urgency: 'this_month',
      expectedImpact: 'medium',
      confidence: 'reliable',
      timeEstimate: '20 minutes',
      firstStep: 'Review group capacity to confirm the academy can absorb new players without degrading session quality.',
      approvalRequired: false,
      evidenceUsed: ['No empty curriculum levels', 'No missing advancement gates'],
      missingData: [],
      reason: 'When the curriculum is structurally sound, growth is the highest-leverage next move.',
    })
  }

  if (candidates.length === 0) {
    candidates.push({
      rank: 1,
      title: 'Identify and reinforce what is working best this month',
      domain: 'cross_domain',
      urgency: 'this_month',
      expectedImpact: 'medium',
      confidence: 'provisional',
      timeEstimate: '20 minutes',
      firstStep: 'Review recent player advancement records and coach submissions to identify positive patterns.',
      approvalRequired: false,
      evidenceUsed: ['Opportunity to double down — no urgent problems detected'],
      missingData: inputs.missingCriticalInputs,
      reason: 'No urgent problems detected. Positive momentum periods are the best time to reinforce what is working.',
    })
  }

  return candidates
}

// ── Candidate scoring ──────────────────────────────────────────────────────────

function scoreCandidates(candidates: OperatingPriority[]): OperatingPriority[] {
  const urgencyScore: Record<string, number> = { immediate: 3, this_week: 2, this_month: 1 }
  const impactScore:  Record<string, number> = { high: 3, medium: 2, low: 1 }
  const confBonus:    Record<string, number> = { reliable: 1, provisional: 0 }

  return [...candidates].sort((a, b) => {
    const scoreA = (urgencyScore[a.urgency] ?? 0) * 3 + (impactScore[a.expectedImpact] ?? 0) * 2 + (confBonus[a.confidence] ?? 0)
    const scoreB = (urgencyScore[b.urgency] ?? 0) * 3 + (impactScore[b.expectedImpact] ?? 0) * 2 + (confBonus[b.confidence] ?? 0)
    return scoreB - scoreA
  })
}

// ── What to ignore ─────────────────────────────────────────────────────────────

function buildWhatToIgnore(
  situation: AcademySituationAssessment,
  inputs:    OperatingPartnerInputs,
): string[] {
  const ignore: string[] = []

  const t: SituationType = situation.situationType

  if (t === 'curriculum_gap') {
    ignore.push('Business metrics — fix curriculum structure before assessing growth capacity.')
    ignore.push('Philosophy preferences — align curriculum to existing identity before refining it further.')
  } else if (t === 'coach_execution_gap') {
    ignore.push('Curriculum expansion — coaches must be aligned before new content is created.')
    ignore.push('Business metrics — coaching consistency must be restored before growth is measured.')
  } else if (t === 'parent_retention_risk') {
    ignore.push('Curriculum development — stabilise at-risk families before adding more content.')
  } else if (t === 'communication_gap') {
    ignore.push('New feature requests — clear the queue backlog before expanding scope.')
  } else if (t === 'philosophy_drift') {
    ignore.push('New player intake — do not expand until the identity question is resolved.')
  } else if (t === 'opportunity_to_double_down') {
    ignore.push('Low-severity edge cases — no urgent problems detected; focus on growth, not maintenance.')
  } else if (t === 'unclear_cause_requires_review') {
    ignore.push('Any concrete action — gather data first before acting on incomplete signals.')
  }

  if (inputs.inputCompletenessScore < 50) {
    ignore.push('Business and philosophy signals — with < 50% data completeness, focus on the most critical operational domain only.')
  }

  return ignore
}

// ── Why Today builder ─────────────────────────────────────────────────────────
// Explains why this priority matters TODAY, not just why it exists.
// Draws on live operational counts to be specific.

function buildWhyToday(p: OperatingPriority, inputs: OperatingPartnerInputs): string {
  const { players, coaches, curriculum, parents, system } = inputs.operations

  if (p.urgency === 'immediate') {
    if ((p.domain === 'players' || p.domain === 'cross_domain') && players.stallCount > 0) {
      return `${players.stallCount} player${players.stallCount > 1 ? 's are' : ' is'} currently stalled — every session without action deepens their disengagement.`
    }
    if (p.domain === 'coaches' && coaches.missingWrapUpCount > 0) {
      return `${coaches.missingWrapUpCount} session recap${coaches.missingWrapUpCount > 1 ? 's are' : ' is'} outstanding now — DONNA cannot detect development issues without them.`
    }
    if (p.domain === 'parents' && parents.retentionRiskCount > 0) {
      return `${parents.retentionRiskCount} at-risk ${parents.retentionRiskCount > 1 ? 'families are' : 'family is'} waiting — each day of delay increases cancellation probability.`
    }
    if (p.domain === 'system' && system.oldestPendingAgeDays !== null && system.oldestPendingAgeDays >= 3) {
      return `The oldest pending approval is ${system.oldestPendingAgeDays} days old — coach and curriculum workflows are currently blocked until this is cleared.`
    }
    if ((p.domain === 'curriculum' || p.domain === 'cross_domain') && curriculum.playerBackedBottleneckCount > 0) {
      return `${curriculum.playerBackedBottleneckCount} curriculum level${curriculum.playerBackedBottleneckCount > 1 ? 's are' : ' is'} confirmed as a bottleneck by real player evidence — the highest-quality signal DONNA has.`
    }
    if (p.evidenceUsed.length > 0) {
      return `${p.evidenceUsed[0]} — this signal is at its immediate threshold right now.`
    }
  }

  if (p.urgency === 'this_week') {
    if (players.advancementEligibleCount >= 3 && (p.domain === 'players' || p.domain === 'curriculum')) {
      return `${players.advancementEligibleCount} players are currently eligible for advancement — delay erodes their motivation and creates level capacity bottlenecks.`
    }
    if (p.evidenceUsed.length > 0) {
      return `${p.evidenceUsed[0]} — acting this week prevents this from escalating to immediate urgency.`
    }
  }

  return p.reason
}

// ── Cannot-brief result ────────────────────────────────────────────────────────

function buildCannotBriefResult(
  situation: AcademySituationAssessment,
  inputs:    OperatingPartnerInputs,
  reason:    string,
): TodayPriorityResult {
  const budget = buildCapacityBudget([])
  return {
    priorities: [],
    primaryAction: null,
    situation,
    budget,
    whatToIgnore: ['Everything — insufficient data to recommend any action.'],
    generatedAt:  new Date().toISOString(),
    cannotBrief:  true,
    cannotBriefReason: reason,
  }
}

// ── Main entry point ───────────────────────────────────────────────────────────
// Guard #1: situation is REQUIRED — no candidates generated without it.

export function buildTodayPriorities(
  inputs:    OperatingPartnerInputs,
  situation: AcademySituationAssessment,  // Guard #1: required input
  signals:   OperatingAttentionReport,
): TodayPriorityResult {
  const { canBrief, reason } = checkBriefability(inputs, situation)
  if (!canBrief) return buildCannotBriefResult(situation, inputs, reason!)

  // Guard #2: candidates are situation-derived, not signal-derived.
  const rawCandidates = candidatesForSituation(situation, inputs, signals)
  const sortedCandidates = scoreCandidates(rawCandidates)

  // Guard #4: capacity budget applied before Top Three Law.
  const budget = buildCapacityBudget(sortedCandidates)
  const fittingTitles = new Set(budget.allocations.map(a => a.priorityTitle))
  const fittingCandidates = sortedCandidates.filter(c => fittingTitles.has(c.title))

  // Guard #5: Top Three Law — hard limit after capacity enforcement.
  const top3 = fittingCandidates.slice(0, 3)
  const top3Titles = new Set(top3.map(p => p.title))
  const deferred = sortedCandidates.filter(c => !top3Titles.has(c.title))

  // Guard #7: every priority carries a full explanation.
  const priorities: TodayPriority[] = top3.map((p, i) => {
    const ranked: OperatingPriority = { ...p, rank: i + 1 }
    const capacityCost  = budget.allocations.find(a => a.priorityTitle === p.title)?.capacityCost
      ?? estimateCapacityCost(p)
    const tradeoff    = buildTradeoffAnalysis(ranked, deferred, situation)
    const explanation = buildPriorityExplanation(ranked, inputs)
    const whyToday    = buildWhyToday(ranked, inputs)

    return { ...ranked, capacityCost, tradeoff, explanation, whyToday }
  })

  const whatToIgnore = buildWhatToIgnore(situation, inputs)

  return {
    priorities,
    primaryAction:     priorities[0] ?? null,
    situation,
    budget,
    whatToIgnore,
    generatedAt:       new Date().toISOString(),
    cannotBrief:       false,
    cannotBriefReason: null,
  }
}
