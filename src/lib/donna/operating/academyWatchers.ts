// Mega Sprint 2621–2650 — DONNA Operating Layer V1
// Academy Watchers — 7 domain-scoped watchers that extract OperatingSignals
// from existing engine outputs (no new DB queries, no new intelligence).
//
// Each watcher:
//   - evaluates data already computed in page.tsx
//   - detects risk, opportunity, attention, escalation, recommendation
//   - creates OperatingSignal[]
//
// Reuses: OperatingAttentionReport, AcademyIntelligencePacket,
//         AcademySituationAssessment. No duplication.

import type { OperatingAttentionReport } from '@/lib/donna/operations/academyAttentionEngine'
import type { AcademyIntelligencePacket, PrioritizedItem } from '@/lib/donna/academy/academyIntelligenceEngine'
import type { AcademySituationAssessment } from '@/lib/donna/operations/operatingPartnerOutputContract'
import type { OperatingSignal, OperatingSignalSeverity } from './operatingSignal'

// ── Watcher input ─────────────────────────────────────────────────────────────

export interface WatcherInput {
  packet:                    AcademyIntelligencePacket | null
  attentionReport:           OperatingAttentionReport
  situation:                 AcademySituationAssessment
  attentionCount:            number
  advancementReadyCount:     number
  stalledPlayerCount:        number
  parentFollowupCount:       number
  pendingActionsCount:       number
  coachRecapsMissing:        number
  reassessmentDue:           number
  overCapacityGroupCount:    number
  oldestPendingReviewAgeDays: number | null
}

// ── ID generator ──────────────────────────────────────────────────────────────

function sig(
  id: string,
  domain: OperatingSignal['domain'],
  type: OperatingSignal['type'],
  severity: OperatingSignalSeverity,
  confidence: OperatingSignal['confidence'],
  title: string,
  reason: string,
  suggestedAction: string,
  ageDays: number,
  targetEntityLabel: string | null = null,
  targetEntityRoute: string | null = null,
): OperatingSignal {
  return {
    id,
    type,
    severity,
    confidence,
    domain,
    title,
    reason,
    suggestedAction,
    targetEntityLabel,
    targetEntityRoute,
    ageDays,
    isEscalated: false,
    timestamp: new Date().toISOString(),
  }
}

// ── Player Watcher ────────────────────────────────────────────────────────────

export function runPlayerWatcher(input: WatcherInput): OperatingSignal[] {
  const signals: OperatingSignal[] = []
  const { attentionCount, advancementReadyCount, stalledPlayerCount, packet } = input

  if (attentionCount >= 3) {
    signals.push(sig(
      'player_attention_high', 'players', 'risk', 'critical', 'high',
      `${attentionCount} players need immediate attention`,
      `${attentionCount} players are on hold or overdue for reassessment — each day without resolution increases dropout risk.`,
      'Open Players → filter by attention status → address highest-tier first.',
      0, null, '/director/players',
    ))
  } else if (attentionCount > 0) {
    signals.push(sig(
      'player_attention_medium', 'players', 'attention', 'high', 'high',
      `${attentionCount} player${attentionCount !== 1 ? 's' : ''} need${attentionCount === 1 ? 's' : ''} your attention`,
      `Players flagged for attention are blocked from normal progression until reviewed.`,
      'Review each flagged player and clear, reassess, or escalate.',
      0, null, '/director/players',
    ))
  }

  if (advancementReadyCount > 0) {
    signals.push(sig(
      'player_advancement_ready', 'players', 'opportunity', 'high', 'high',
      `${advancementReadyCount} player${advancementReadyCount !== 1 ? 's' : ''} ready to advance`,
      'These players meet all gate criteria. Approval delays reduce motivation and block group placement.',
      'Review advancement criteria → approve or defer each candidate.',
      0, null, '/director/players',
    ))
  }

  if (stalledPlayerCount > 0) {
    const severity: OperatingSignalSeverity = stalledPlayerCount >= 5 ? 'critical' : stalledPlayerCount >= 2 ? 'high' : 'medium'
    signals.push(sig(
      'player_stalled', 'players', 'risk', severity, 'high',
      `${stalledPlayerCount} stalled player${stalledPlayerCount !== 1 ? 's' : ''}`,
      `${stalledPlayerCount} player${stalledPlayerCount !== 1 ? 's have' : ' has'} been at the same level for 180+ days without advancing.`,
      'Review each stalled player with their coach — determine if the block is curriculum, attendance, or engagement.',
      30, null, '/director/players',
    ))
  }

  // Surface top attention queue item from packet
  const topAttention = packet?.attentionQueue[0]
  if (topAttention && (topAttention.urgency === 'immediate' || topAttention.urgency === 'urgent')) {
    signals.push(sig(
      `player_top_attention_${topAttention.playerName.replace(/\s/g, '_')}`,
      'players', 'risk',
      topAttention.urgency === 'immediate' ? 'critical' : 'high',
      'high',
      topAttention.title,
      topAttention.reason,
      topAttention.riskIfIgnored,
      topAttention.daysSince,
      topAttention.playerName,
      topAttention.playerRoute,
    ))
  }

  return signals
}

// ── Coach Watcher ─────────────────────────────────────────────────────────────

export function runCoachWatcher(input: WatcherInput): OperatingSignal[] {
  const signals: OperatingSignal[] = []
  const { coachRecapsMissing, situation } = input

  if (coachRecapsMissing > 0) {
    const severity: OperatingSignalSeverity = coachRecapsMissing >= 5 ? 'high' : 'medium'
    signals.push(sig(
      'coach_recaps_missing', 'coaches', 'attention', severity, 'high',
      `${coachRecapsMissing} session${coachRecapsMissing !== 1 ? 's' : ''} missing a coach recap`,
      'Without recaps, DONNA cannot generate accurate player development signals. Missing notes create blind spots.',
      'Ask coaches to complete missing recaps. Consider making recaps a required step before coaches can end a session.',
      0, null, '/director/sessions',
    ))
  }

  // Coach execution gap from situation
  if (situation.situationType === 'coach_execution_gap') {
    signals.push(sig(
      'coach_execution_gap', 'coaches', 'risk', 'high', 'high',
      'Coach execution gap detected',
      'Coaching patterns show inconsistency across the academy — players are receiving uneven development quality.',
      'Review coach performance signals and schedule a coaching alignment session.',
      0, null, '/director/sessions',
    ))
  }

  return signals
}

// ── Parent Watcher ────────────────────────────────────────────────────────────

export function runParentWatcher(input: WatcherInput): OperatingSignal[] {
  const signals: OperatingSignal[] = []
  const { parentFollowupCount, packet } = input

  if (parentFollowupCount > 0) {
    const severity: OperatingSignalSeverity = parentFollowupCount >= 3 ? 'high' : 'medium'
    signals.push(sig(
      'parent_followup_needed', 'parents', 'attention', severity, 'high',
      `${parentFollowupCount} parent${parentFollowupCount !== 1 ? 's' : ''} need${parentFollowupCount === 1 ? 's' : ''} follow-up`,
      'Families who do not hear from the academy within 7 days are at higher risk of disengagement.',
      'Draft parent updates for flagged players. All communications require director approval before sending.',
      0, null, '/director/players',
    ))
  }

  // Surface top parent from packet
  const topParent = packet?.parentFollowupQueue[0]
  if (topParent && topParent.daysSince >= 7) {
    signals.push(sig(
      `parent_overdue_${topParent.playerName.replace(/\s/g, '_')}`,
      'parents', 'risk',
      topParent.daysSince >= 14 ? 'high' : 'medium',
      'high',
      `${topParent.playerName}'s family — ${topParent.daysSince} days without contact`,
      topParent.reason,
      topParent.riskIfIgnored,
      topParent.daysSince,
      topParent.playerName,
      topParent.playerRoute,
    ))
  }

  return signals
}

// ── Curriculum Watcher ────────────────────────────────────────────────────────

export function runCurriculumWatcher(input: WatcherInput): OperatingSignal[] {
  const signals: OperatingSignal[] = []
  const { overCapacityGroupCount, situation, attentionReport } = input

  if (overCapacityGroupCount > 0) {
    signals.push(sig(
      'group_over_capacity', 'curriculum', 'risk', 'high', 'high',
      `${overCapacityGroupCount} group${overCapacityGroupCount !== 1 ? 's' : ''} over capacity`,
      'Over-capacity groups reduce coaching quality and player experience. Left unchecked, they increase dropout risk.',
      'Create a new group or increase the capacity limit. Do not leave groups over capacity.',
      0, null, '/director',
    ))
  }

  // Curriculum gap from situation
  if (situation.situationType === 'curriculum_gap') {
    const curricSignal = attentionReport.signals.find(s => s.domain === 'curriculum')
    if (curricSignal) {
      signals.push(sig(
        'curriculum_gap', 'curriculum', 'risk',
        curricSignal.severity === 'critical' ? 'critical' : curricSignal.severity === 'high' ? 'high' : 'medium',
        curricSignal.confidence === 'reliable' ? 'high' : 'medium',
        'Curriculum gap blocking player development',
        curricSignal.evidence,
        curricSignal.recommendedDirection,
        0, null, '/director/curriculum',
      ))
    }
  }

  return signals
}

// ── Assessment Watcher ────────────────────────────────────────────────────────

export function runAssessmentWatcher(input: WatcherInput): OperatingSignal[] {
  const signals: OperatingSignal[] = []
  const { reassessmentDue, situation } = input

  if (reassessmentDue > 0) {
    const severity: OperatingSignalSeverity = reassessmentDue >= 5 ? 'high' : 'medium'
    signals.push(sig(
      'assessment_overdue', 'assessments', 'attention', severity, 'high',
      `${reassessmentDue} player${reassessmentDue !== 1 ? 's' : ''} overdue for reassessment`,
      'Without recent assessment evidence, advancement and placement decisions are based on incomplete data.',
      'Schedule assessment sessions for overdue players. DONNA prioritises advancement eligibility after assessments.',
      0, null, '/director/players',
    ))
  }

  if (situation.situationType === 'assessment_debt') {
    signals.push(sig(
      'assessment_debt', 'assessments', 'risk', 'high', 'high',
      'Assessment debt accumulating across the academy',
      'Assessment signals are missing at a rate that degrades DONNA\'s ability to recommend accurately.',
      'Schedule a dedicated assessment week. Set coaches a target: every active player assessed in the next 30 days.',
      30, null, '/director/players',
    ))
  }

  return signals
}

// ── Recommendation Watcher ────────────────────────────────────────────────────

export function runRecommendationWatcher(input: WatcherInput): OperatingSignal[] {
  const signals: OperatingSignal[] = []
  const { pendingActionsCount, oldestPendingReviewAgeDays } = input

  if (pendingActionsCount > 0) {
    const age = oldestPendingReviewAgeDays ?? 0
    const severity: OperatingSignalSeverity = age >= 7 || pendingActionsCount >= 5 ? 'high' : 'medium'
    signals.push(sig(
      'pending_approvals', 'recommendations', 'recommendation', severity, 'high',
      `${pendingActionsCount} action${pendingActionsCount !== 1 ? 's' : ''} pending your approval`,
      age > 0
        ? `The oldest item has been waiting ${age} day${age !== 1 ? 's' : ''}. Queue buildup reduces program responsiveness.`
        : 'Your team is waiting on these decisions.',
      'Open the review queue and start with the oldest urgent items.',
      age, null, '/director/review',
    ))
  }

  return signals
}

// ── Attendance Watcher ────────────────────────────────────────────────────────

export function runAttendanceWatcher(input: WatcherInput): OperatingSignal[] {
  const signals: OperatingSignal[] = []
  const { attentionReport } = input

  const attendanceSignal = attentionReport.signals.find(
    s => s.domain === 'parents' && s.id.includes('retention'),
  )

  if (attendanceSignal && (attendanceSignal.severity === 'critical' || attendanceSignal.severity === 'high')) {
    signals.push(sig(
      'attendance_risk', 'attendance', 'risk',
      attendanceSignal.severity === 'critical' ? 'critical' : 'high',
      attendanceSignal.confidence === 'reliable' ? 'high' : 'medium',
      'Attendance risk pattern detected',
      attendanceSignal.evidence,
      attendanceSignal.recommendedDirection,
      0, null, '/director/players',
    ))
  }

  return signals
}

// ── Run all watchers ──────────────────────────────────────────────────────────

export function runAllWatchers(input: WatcherInput): OperatingSignal[] {
  return [
    ...runPlayerWatcher(input),
    ...runCoachWatcher(input),
    ...runParentWatcher(input),
    ...runCurriculumWatcher(input),
    ...runAssessmentWatcher(input),
    ...runRecommendationWatcher(input),
    ...runAttendanceWatcher(input),
  ]
}
