// Mega Sprint 1265–1294 — DONNA Academy Setup Completion V1
//
// Engine supporting DONNA's guided academy_setup_completion workflow.
//
// Responsibilities:
//   - SETUP_FIELD_IMPORTANCE: explains why each of the 10 setup fields matters
//   - buildSetupMissingFieldRecommendation: uses Evidence Reasoning Engine to
//     explain missing or weak setup fields to the director
//   - getSetupCompletionStatus: reports filled vs. missing fields
//   - buildSetupDraftDescription: human-readable summary for the review banner
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Composes donnaEvidenceReasoningEngine — never replaces it.
//   - All 10 setup fields are defined here as the canonical field list.

import {
  buildEvidencedRecommendation,
} from '@/lib/donna/reasoning/donnaEvidenceReasoningEngine'
import type {
  EvidencedRecommendation,
  EvidenceItem,
} from '@/lib/donna/reasoning/donnaEvidenceReasoningEngine'
import type { ConfidenceResult } from '@/lib/donna/donnaConfidence'

// ── Canonical 10-field list ───────────────────────────────────────────────────

export const ACADEMY_SETUP_REQUIRED_FIELDS = [
  'academy_name',
  'academy_timezone',
  'program_types',
  'levels',
  'groups',
  'staff_plan',
  'weekly_schedule',
  'parent_communication_preferences',
  'curriculum_starting_point',
  'setup_notes',
] as const

export type AcademySetupFieldId = typeof ACADEMY_SETUP_REQUIRED_FIELDS[number]

// ── Field importance definitions ──────────────────────────────────────────────

export interface SetupFieldImportance {
  displayLabel: string
  why: string
  riskIfIgnored: string
  /** DONNA's recommendation when this field is missing */
  missingRecommendation: string
}

export const SETUP_FIELD_IMPORTANCE: Record<AcademySetupFieldId, SetupFieldImportance> = {
  academy_name: {
    displayLabel: 'Academy Name',
    why: 'The academy name appears in every parent communication, player profile, and report. Without it, the system cannot address the academy correctly.',
    riskIfIgnored: 'All communications and reports will show a placeholder name — coaches and parents will see an incomplete system.',
    missingRecommendation: 'Provide the academy name to unlock correct branding across all parent and player communications.',
  },
  academy_timezone: {
    displayLabel: 'Timezone',
    why: 'Session scheduling, attendance timestamps, and automated briefings all depend on the correct timezone. Without it, session times and daily briefings may be off by hours.',
    riskIfIgnored: 'Session records and coach briefings will show incorrect times — especially for multi-session days.',
    missingRecommendation: 'Set the academy timezone so session scheduling and daily briefings show the correct times.',
  },
  program_types: {
    displayLabel: 'Program Types',
    why: 'Program types define how groups, sessions, and curriculum levels are organized. DONNA uses this to frame recommendations by program context.',
    riskIfIgnored: 'I cannot distinguish between development, competition, and adult programs — recommendations will be generic.',
    missingRecommendation: 'Define your program types (e.g. Junior Development, Competition, Adult) to give DONNA program-level context.',
  },
  levels: {
    displayLabel: 'Development Levels',
    why: 'Curriculum levels are the backbone of player placement, progression, session templates, and assessment. Without defined levels, the placement engine and curriculum builder have no structure to work with.',
    riskIfIgnored: 'Players cannot be placed, curriculum items cannot be assigned, and session templates cannot be linked to the correct developmental stage.',
    missingRecommendation: 'Define your development levels (e.g. Red Ball 1–2, Orange Ball, Green Ball) to unlock placement and curriculum structure.',
  },
  groups: {
    displayLabel: 'Player Groups',
    why: 'Training groups determine how players are assigned to sessions, which coaches they work with, and how the weekly schedule is structured. DONNA uses group structure to surface attendance and coach health signals.',
    riskIfIgnored: 'Session planning and attendance tracking will not reflect your real group structure — coach and player signals will be inaccurate.',
    missingRecommendation: 'Describe how players are grouped for training so DONNA can track sessions, attendance, and coach load accurately.',
  },
  staff_plan: {
    displayLabel: 'Coaching Staff',
    why: 'Knowing your coaching staff count and roles allows DONNA to track coach wrap-up completion, flag workload imbalances, and surface coach health signals accurately.',
    riskIfIgnored: 'I cannot detect if a coach is overloaded or missing wrap-ups without knowing how many coaches are active.',
    missingRecommendation: 'Describe your coaching staff (count and roles) so DONNA can track coach engagement and flag issues early.',
  },
  weekly_schedule: {
    displayLabel: 'Weekly Schedule',
    why: 'The weekly schedule defines how many sessions per group per week, which drives session planning, wrap-up expectations, and the daily COO briefing.',
    riskIfIgnored: 'The daily briefing and session completion signals will not match your actual training cadence — missed sessions will not be detected.',
    missingRecommendation: 'Describe your weekly training schedule so the daily briefing and session tracking reflect your real cadence.',
  },
  parent_communication_preferences: {
    displayLabel: 'Parent Communication',
    why: 'Parent communication preferences determine how often and in what format parent updates are sent. DONNA uses this to frame parent-safe content and set update cadence expectations.',
    riskIfIgnored: 'Parent updates may be sent at the wrong frequency or in the wrong tone — reducing trust and clarity for families.',
    missingRecommendation: 'Set your parent communication preferences so DONNA can frame updates with the right tone and frequency.',
  },
  curriculum_starting_point: {
    displayLabel: 'Curriculum Starting Point',
    why: 'The curriculum framework shapes how skills, drills, and progressions are organized within each level. Without it, I cannot suggest curriculum items that match your existing structure.',
    riskIfIgnored: 'Curriculum builder items and templates will not align with your development philosophy — coaches will need to rework them.',
    missingRecommendation: 'Define your curriculum starting point (e.g. ITF ball colours, custom) so the curriculum builder and DONNA recommendations align with your structure.',
  },
  setup_notes: {
    displayLabel: 'Setup Notes',
    why: 'Setup notes give DONNA critical context about launch timelines, compliance requirements, or specific priorities that shape setup decisions.',
    riskIfIgnored: 'I will not know about time-sensitive constraints or special requirements — setup guidance will be generic rather than tailored.',
    missingRecommendation: 'Add any important context (launch date, federation requirements, special priorities) so DONNA can prioritize setup steps correctly.',
  },
}

// ── Completion status ─────────────────────────────────────────────────────────

export interface SetupCompletionStatus {
  complete: boolean
  totalRequired: number
  filledCount: number
  missingFieldIds: AcademySetupFieldId[]
  filledFieldIds: AcademySetupFieldId[]
  completionPct: number
}

/**
 * Returns the completion status of a set of setup answers.
 * "Filled" means the field has a non-empty trimmed value.
 */
export function getSetupCompletionStatus(
  answers: Record<string, string>,
): SetupCompletionStatus {
  const missingFieldIds: AcademySetupFieldId[] = []
  const filledFieldIds: AcademySetupFieldId[] = []

  for (const fieldId of ACADEMY_SETUP_REQUIRED_FIELDS) {
    const value = (answers[fieldId] ?? '').trim()
    if (value.length === 0) {
      missingFieldIds.push(fieldId)
    } else {
      filledFieldIds.push(fieldId)
    }
  }

  const totalRequired = ACADEMY_SETUP_REQUIRED_FIELDS.length
  const filledCount = filledFieldIds.length

  return {
    complete:        missingFieldIds.length === 0,
    totalRequired,
    filledCount,
    missingFieldIds,
    filledFieldIds,
    completionPct:   Math.round((filledCount / totalRequired) * 100),
  }
}

// ── Evidence Reasoning integration ───────────────────────────────────────────

/**
 * Build an EvidencedRecommendation explaining missing or weak setup fields.
 * Uses the Evidence Reasoning Engine to produce a structured explanation with:
 *   - what is missing
 *   - why it matters
 *   - confidence level
 *   - risk if ignored
 *   - recommended next action
 *
 * Pass an empty array to get a "setup is complete" recommendation.
 */
export function buildSetupMissingFieldRecommendation(
  missingFieldIds: string[],
  filledFieldIds: string[],
): EvidencedRecommendation {
  const validMissing = missingFieldIds.filter(
    (id): id is AcademySetupFieldId =>
      ACADEMY_SETUP_REQUIRED_FIELDS.includes(id as AcademySetupFieldId),
  )

  if (validMissing.length === 0) {
    const confidence: ConfidenceResult = {
      confidence:    'high',
      reason:        'all_live',
      label:         'All fields filled',
      detail:        null,
      isAnswerable:  true,
    }
    return buildEvidencedRecommendation({
      recommendation: 'All 10 required academy setup fields are filled. The setup draft is ready for your review and confirmation.',
      evidence: [{
        category:      'assessment',
        claim:         `${ACADEMY_SETUP_REQUIRED_FIELDS.length} of ${ACADEMY_SETUP_REQUIRED_FIELDS.length} setup fields answered.`,
        sourceText:    'DONNA guided setup session — all required fields collected.',
        strength:      'strong',
        dataAvailable: true,
      }],
      confidence,
      category: 'academy_health',
      nextAction: 'Review the setup draft and confirm to save.',
    })
  }

  // Build evidence items from missing fields
  const evidence: EvidenceItem[] = validMissing.map(fieldId => {
    const importance = SETUP_FIELD_IMPORTANCE[fieldId]
    return {
      category:      'assessment',
      claim:         `"${importance.displayLabel}" has not been answered yet.`,
      sourceText:    importance.why,
      strength:      'strong',
      dataAvailable: true,
    }
  })

  const confidence: ConfidenceResult = {
    confidence:   'insufficient',
    reason:       'no_data_yet',
    label:        `${validMissing.length} field${validMissing.length === 1 ? '' : 's'} missing`,
    detail:       `Missing: ${validMissing.map(id => SETUP_FIELD_IMPORTANCE[id].displayLabel).join(', ')}`,
    isAnswerable: false,
  }

  const firstMissing = SETUP_FIELD_IMPORTANCE[validMissing[0]]
  const missingLabels = validMissing.map(id => `"${SETUP_FIELD_IMPORTANCE[id].displayLabel}"`).join(', ')
  const missingInfo = validMissing.map(id => SETUP_FIELD_IMPORTANCE[id].why)
  const risks = validMissing.map(id => SETUP_FIELD_IMPORTANCE[id].riskIfIgnored)

  const recommendation = validMissing.length === 1
    ? `${missingLabels} is required to complete academy setup.`
    : `${validMissing.length} setup fields are still missing: ${missingLabels}.`

  return buildEvidencedRecommendation({
    recommendation,
    evidence,
    confidence,
    missingInfo,
    riskIfIgnored: risks[0] ?? firstMissing.riskIfIgnored,
    nextAction: firstMissing.missingRecommendation,
    category: 'academy_health',
    alternatives: [
      'Continue the guided setup to answer the remaining questions.',
      `Navigate to /director/onboarding to complete the missing steps manually (${validMissing.length} remaining).`,
    ],
  })
}

// ── Draft description ─────────────────────────────────────────────────────────

/**
 * Build a human-readable description of the collected setup answers.
 * Used in the review banner before the director confirms.
 */
export function buildSetupDraftDescription(answers: Record<string, string>): string {
  const lines: string[] = ['**Academy Setup Draft — Ready to Review**', '']

  for (const fieldId of ACADEMY_SETUP_REQUIRED_FIELDS) {
    const value = (answers[fieldId] ?? '').trim()
    const importance = SETUP_FIELD_IMPORTANCE[fieldId]
    if (value) {
      lines.push(`**${importance.displayLabel}:** ${value}`)
    } else {
      lines.push(`**${importance.displayLabel}:** _(not answered)_`)
    }
  }

  return lines.join('\n')
}

/**
 * Build a concise one-line label for the review banner summary.
 * Example: "10 fields collected — Academy Name, Timezone, ..."
 */
export function buildSetupDraftLabel(answers: Record<string, string>): string {
  const status = getSetupCompletionStatus(answers)
  if (status.complete) {
    return `${status.filledCount} of ${status.totalRequired} fields collected — ready to save.`
  }
  const missingLabels = status.missingFieldIds
    .slice(0, 3)
    .map(id => SETUP_FIELD_IMPORTANCE[id].displayLabel)
    .join(', ')
  const more = status.missingFieldIds.length > 3
    ? ` + ${status.missingFieldIds.length - 3} more`
    : ''
  return `${status.filledCount} of ${status.totalRequired} filled. Missing: ${missingLabels}${more}.`
}
