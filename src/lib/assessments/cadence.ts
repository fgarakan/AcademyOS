// Sprint 583 — Ongoing Assessment Cadence + DONNA Reminders V1
// Defines assessment cadence rules and reminder thresholds for ongoing curriculum assessment.
// No DB reads — works from passed-in date strings.
// Pure TypeScript — no DB calls, no AI calls, no side effects.

export type CadenceFrequency = 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'as_needed'

export type ReminderUrgency = 'on_track' | 'due_soon' | 'overdue' | 'not_yet_assessed'

export interface AssessmentCadenceRule {
  ruleId: string
  label: string
  eventType: string
  frequencyWeeks: number
  frequency: CadenceFrequency
  warnAtDaysBeforeDue: number
  overdueAtDaysPastDue: number
  applicableStages: string[]
  donnaReminderTemplate: string
}

export interface PlayerCadenceStatus {
  playerId: string
  playerName: string
  lastAssessedAt: string | null
  nextDueAt: string | null
  daysUntilDue: number | null
  daysPastDue: number | null
  urgency: ReminderUrgency
  applicableRule: AssessmentCadenceRule
}

export const ASSESSMENT_CADENCE_RULES: AssessmentCadenceRule[] = [
  {
    ruleId: 'cadence_new_intake',
    label: 'New Player Intake',
    eventType: 'new_player_intake',
    frequencyWeeks: 0,
    frequency: 'as_needed',
    warnAtDaysBeforeDue: 0,
    overdueAtDaysPastDue: 0,
    applicableStages: ['red_foundation', 'orange_development', 'green_performance', 'yellow_competitive', 'high_performance'],
    donnaReminderTemplate: 'New player {playerName} has not yet completed an intake assessment. Would you like to start one now?',
  },
  {
    ruleId: 'cadence_quarterly_review',
    label: 'Quarterly Review',
    eventType: 'quarterly_review',
    frequencyWeeks: 13,
    frequency: 'quarterly',
    warnAtDaysBeforeDue: 14,
    overdueAtDaysPastDue: 7,
    applicableStages: ['orange_development', 'green_performance'],
    donnaReminderTemplate: '{playerName} is due for a quarterly assessment in {daysUntilDue} days. Would you like to schedule it?',
  },
  {
    ruleId: 'cadence_biannual_review',
    label: 'Biannual Review',
    eventType: 'quarterly_review',
    frequencyWeeks: 26,
    frequency: 'biannual',
    warnAtDaysBeforeDue: 21,
    overdueAtDaysPastDue: 14,
    applicableStages: ['red_foundation'],
    donnaReminderTemplate: '{playerName} is due for a review in {daysUntilDue} days. Biannual check for Red stage players.',
  },
  {
    ruleId: 'cadence_promotion_gate',
    label: 'Promotion Gate Assessment',
    eventType: 'promotion_gate',
    frequencyWeeks: 0,
    frequency: 'as_needed',
    warnAtDaysBeforeDue: 0,
    overdueAtDaysPastDue: 0,
    applicableStages: ['red_foundation', 'orange_development', 'green_performance', 'yellow_competitive'],
    donnaReminderTemplate: '{playerName} may be ready for a promotion gate assessment. Coach noted readiness signals.',
  },
  {
    ruleId: 'cadence_high_performance',
    label: 'High Performance Review',
    eventType: 'quarterly_review',
    frequencyWeeks: 8,
    frequency: 'monthly',
    warnAtDaysBeforeDue: 7,
    overdueAtDaysPastDue: 3,
    applicableStages: ['high_performance'],
    donnaReminderTemplate: '{playerName} (High Performance) is due for an 8-week check-in in {daysUntilDue} days.',
  },
]

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

export function getCadenceRuleForStage(stage: string): AssessmentCadenceRule {
  return (
    ASSESSMENT_CADENCE_RULES.find(r => r.applicableStages.includes(stage) && r.ruleId !== 'cadence_new_intake' && r.ruleId !== 'cadence_promotion_gate') ??
    ASSESSMENT_CADENCE_RULES[1]
  )
}

export function computeCadenceStatus(
  playerId: string,
  playerName: string,
  stage: string,
  lastAssessedAt: string | null,
): PlayerCadenceStatus {
  const rule = getCadenceRuleForStage(stage)
  const today = new Date()

  if (!lastAssessedAt) {
    return {
      playerId,
      playerName,
      lastAssessedAt: null,
      nextDueAt: null,
      daysUntilDue: null,
      daysPastDue: null,
      urgency: 'not_yet_assessed',
      applicableRule: rule,
    }
  }

  if (rule.frequencyWeeks === 0) {
    return {
      playerId,
      playerName,
      lastAssessedAt,
      nextDueAt: null,
      daysUntilDue: null,
      daysPastDue: null,
      urgency: 'on_track',
      applicableRule: rule,
    }
  }

  const lastDate = new Date(lastAssessedAt)
  const dueDate = addWeeks(lastDate, rule.frequencyWeeks)
  const daysUntilDue = daysBetween(today, dueDate)

  let urgency: ReminderUrgency = 'on_track'
  if (daysUntilDue < 0) {
    urgency = Math.abs(daysUntilDue) >= rule.overdueAtDaysPastDue ? 'overdue' : 'due_soon'
  } else if (daysUntilDue <= rule.warnAtDaysBeforeDue) {
    urgency = 'due_soon'
  }

  return {
    playerId,
    playerName,
    lastAssessedAt,
    nextDueAt: dueDate.toISOString().split('T')[0],
    daysUntilDue: daysUntilDue >= 0 ? daysUntilDue : null,
    daysPastDue: daysUntilDue < 0 ? Math.abs(daysUntilDue) : null,
    urgency,
    applicableRule: rule,
  }
}

export function buildDonnaReminderMessage(status: PlayerCadenceStatus): string {
  const template = status.applicableRule.donnaReminderTemplate
  return template
    .replace('{playerName}', status.playerName)
    .replace('{daysUntilDue}', String(status.daysUntilDue ?? '?'))
}

export const URGENCY_LABELS: Record<ReminderUrgency, string> = {
  on_track: 'On track',
  due_soon: 'Due soon',
  overdue: 'Overdue',
  not_yet_assessed: 'Not yet assessed',
}

export const URGENCY_BADGE_CLASS: Record<ReminderUrgency, string> = {
  on_track: 'text-status-green border-status-green/30',
  due_soon: 'text-status-orange border-status-orange/30',
  overdue: 'text-status-red border-status-red/30',
  not_yet_assessed: 'text-text-muted border-border',
}
