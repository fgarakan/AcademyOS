// Sprint 487 — Parent Communication Preferences V1
// Defines types, defaults, and validation for parent communication preferences.
// Stored in the parent_profiles.preferences JSON column — no new table.
// Pure TypeScript — no DB calls. Validation runs before any write.

export type ParentSummaryTone = 'encouraging' | 'factual' | 'balanced'
export type ParentUpdateFrequency = 'weekly' | 'biweekly' | 'monthly' | 'on_milestone'
export type ParentLanguageCode = string

export interface ParentCommunicationPreferences {
  summaryTone: ParentSummaryTone
  updateFrequency: ParentUpdateFrequency
  preferredLanguage: ParentLanguageCode | null
  receiveSessionSummaries: boolean
  receiveAssessmentAlerts: boolean
  receiveMilestoneNotifications: boolean
  optOutOfAllCommunications: boolean
}

export const DEFAULT_PARENT_COMMUNICATION_PREFERENCES: ParentCommunicationPreferences = {
  summaryTone: 'balanced',
  updateFrequency: 'weekly',
  preferredLanguage: null,
  receiveSessionSummaries: true,
  receiveAssessmentAlerts: true,
  receiveMilestoneNotifications: true,
  optOutOfAllCommunications: false,
}

const VALID_TONES: ParentSummaryTone[] = ['encouraging', 'factual', 'balanced']
const VALID_FREQUENCIES: ParentUpdateFrequency[] = ['weekly', 'biweekly', 'monthly', 'on_milestone']

export interface PreferenceValidationResult {
  valid: boolean
  errors: string[]
}

export function validateParentCommunicationPreferences(
  input: Partial<ParentCommunicationPreferences>,
): PreferenceValidationResult {
  const errors: string[] = []

  if (input.summaryTone !== undefined && !VALID_TONES.includes(input.summaryTone)) {
    errors.push(`summaryTone must be one of: ${VALID_TONES.join(', ')}.`)
  }

  if (input.updateFrequency !== undefined && !VALID_FREQUENCIES.includes(input.updateFrequency)) {
    errors.push(`updateFrequency must be one of: ${VALID_FREQUENCIES.join(', ')}.`)
  }

  if (
    input.preferredLanguage !== undefined &&
    input.preferredLanguage !== null &&
    (typeof input.preferredLanguage !== 'string' || input.preferredLanguage.length > 10)
  ) {
    errors.push('preferredLanguage must be a short language code (e.g. "en", "es") or null.')
  }

  return { valid: errors.length === 0, errors }
}

export function mergeParentCommunicationPreferences(
  current: ParentCommunicationPreferences,
  updates: Partial<ParentCommunicationPreferences>,
): ParentCommunicationPreferences {
  return { ...current, ...updates }
}

// Check if a communication type is enabled for this parent.
export function isParentCommunicationEnabled(
  prefs: ParentCommunicationPreferences,
  type: 'session_summary' | 'assessment_alert' | 'milestone',
): boolean {
  if (prefs.optOutOfAllCommunications) return false
  if (type === 'session_summary') return prefs.receiveSessionSummaries
  if (type === 'assessment_alert') return prefs.receiveAssessmentAlerts
  if (type === 'milestone') return prefs.receiveMilestoneNotifications
  return false
}

export function getFrequencyLabel(frequency: ParentUpdateFrequency): string {
  const labels: Record<ParentUpdateFrequency, string> = {
    weekly: 'Weekly updates',
    biweekly: 'Every two weeks',
    monthly: 'Monthly updates',
    on_milestone: 'Milestone updates only',
  }
  return labels[frequency]
}

export function getToneLabel(tone: ParentSummaryTone): string {
  const labels: Record<ParentSummaryTone, string> = {
    encouraging: 'Encouraging — focus on growth and positives',
    factual: 'Factual — objective progress data',
    balanced: 'Balanced — mix of progress and encouragement',
  }
  return labels[tone]
}
