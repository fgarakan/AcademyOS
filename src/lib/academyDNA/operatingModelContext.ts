// Mega Sprint 2801–2830 — DONNA Academy Operating Intelligence V1
// OperatingModelContext: unified context bundle for DNA-aware DONNA reasoning.
//
// Aggregates:
//   AcademyDNAModel        — the canonical identity template (which type of academy)
//   StylePresetDefinition  — curriculum philosophy (how sessions are structured)
//   AcademyIdentityProfile — dynamic, evidence-weighted philosophy profile
//   AcademyOperatingModel  — deterministic standards from DNA + preset
//
// Plus four derived domain contexts:
//   curriculumPriorities  — what to teach, in what order, with what language
//   coachStandards        — what DONNA monitors coaches for
//   parentStandards       — communication tone, language style, gap thresholds
//   assessmentStandards   — overdue thresholds, domain weights, escalation rules
//   donnaAssumptions      — morning brief lead, KPI priorities, COO persona
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic: same inputs → same output. No AI required.
//   - identityProfile is always populated: built from blueprintToDna() when not supplied.
//   - Consumed by dnaRecommendationEngine, dnaTodayInfluence, dnaCurriculumBias,
//     dnaCoachAlignment, dnaParentCommsStyle. Single context object — never duplicated.

import type { AcademyDNAModel, AcademyDNAModelId } from './academyDNAModels'
import type { StylePresetDefinition, StylePresetId } from './stylePresetLibrary'
import type { AcademyOperatingModel } from './operatingModelGenerator'
import type { AcademyIdentityProfile } from '@/lib/donna/philosophy/academyIdentityProfile'
import type { StageCategory } from '@/lib/donna/onboarding/donnaOnboardingContextPack'
import { getAcademyDNAModel } from './academyDNAModels'
import { getStylePreset } from './stylePresetLibrary'
import { buildAcademyOperatingModel } from './operatingModelGenerator'
import { blueprintToDna } from './blueprintToDna'
import { buildAcademyIdentityProfile } from '@/lib/donna/philosophy/academyIdentityProfile'

// ── Domain context types ──────────────────────────────────────────────────────

export interface CurriculumPriorityContext {
  topCategory:            StageCategory
  topCategoryLabel:       string
  topCategoryWeight:      number              // 0–100
  emphasisOrder:          string[]            // top 3 category labels
  sessionBias:            string              // human-readable e.g. "Focus on games (28%), movement (22%)"
  lessonPlanGuidance:     string
  progressionLanguage:    string              // "long-term development" vs "competitive readiness"
  perStageTopCategories:  Record<string, StageCategory>
}

export interface CoachStandardsContext {
  recapExpectation:            string
  observationDepth:            string
  autonomyLevel:               string
  developmentFocus:            string
  alignmentChecks:             string[]  // what DONNA monitors per this DNA model
  misalignmentSignals:         string[]  // what triggers an alert
  overdueRecapThresholdDays:   number    // days before DONNA flags missing recap
}

export type ParentLanguageStyle = 'educational' | 'accountability' | 'retention' | 'recruiting'

export interface ParentStandardsContext {
  transparency:                    string
  updateFrequency:                 string
  tone:                            string
  languageStyle:                   ParentLanguageStyle
  keyMessages:                     string[]  // what to emphasize in parent comms
  avoidTopics:                     string[]  // what not to lead with for this model
  communicationGapThresholdDays:   number    // days before DONNA flags a comms gap
  portalVisibility: {
    domainScores:         boolean
    competitionHistory:   boolean
    donnaRecommendations: boolean
    rawCoachNotes:        boolean
    rankings:             boolean
  }
}

export interface AssessmentStandardsContext {
  cadence:                   string
  cadenceLabel:              string
  overdueThresholdDays:      number   // when DONNA flags overdue
  escalationThresholdDays:   number   // when DONNA escalates to director attention
  domainWeights:             { technical: number; tactical: number; fitness: number; mental: number }
  gateStrictness:            string
  assessmentLanguage:        string   // how to frame assessment discussions per DNA model
}

export interface DonnaAssumptionContext {
  morningBriefLead:          string[]
  recommendationTendencies:  string[]
  escalationTriggers:        string[]
  kpiPriorities:             string[]
  defaultNarrative:          string
  cooPersona:                string   // "Retention-focused COO" vs "Performance-focused COO"
}

// ── Primary context type ──────────────────────────────────────────────────────

export interface OperatingModelContext {
  dnaModelId:       AcademyDNAModelId
  stylePresetId:    StylePresetId
  dnaModel:         AcademyDNAModel
  stylePreset:      StylePresetDefinition
  identityProfile:  AcademyIdentityProfile
  operatingModel:   AcademyOperatingModel
  curriculumPriorities: CurriculumPriorityContext
  coachStandards:       CoachStandardsContext
  parentStandards:      ParentStandardsContext
  assessmentStandards:  AssessmentStandardsContext
  donnaAssumptions:     DonnaAssumptionContext
  hasDna:           boolean
  generatedAt:      string
}

// ── Input ─────────────────────────────────────────────────────────────────────

export interface OperatingModelContextInput {
  dnaModelId:           AcademyDNAModelId
  stylePresetId:        StylePresetId
  /** If supplied, used directly. Otherwise built from blueprintToDna(). */
  identityProfile?:     AcademyIdentityProfile | null
  advancementApproval?: string
  parentTransparency?:  string
  activeStages?:        string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<StageCategory, string> = {
  technique:   'Technique',
  tactics:     'Tactics',
  games:       'Games',
  competition: 'Competition',
  movement:    'Movement',
  mental:      'Mental',
  fun:         'Fun',
}

const CADENCE_LABELS: Record<string, string> = {
  monthly:            'Monthly',
  every_6_weeks:      'Every 6 weeks',
  quarterly:          'Quarterly',
  event_triggered:    'Event-triggered',
  director_triggered: 'Director-triggered',
}

function overdueDaysFromCadence(cadence: string): number {
  // Overdue = 1.5x cadence period (generous window before flagging)
  const map: Record<string, number> = {
    monthly:            45,
    every_6_weeks:      63,
    quarterly:          105,
    event_triggered:    60,
    director_triggered: 90,
  }
  return map[cadence] ?? 60
}

function escalationDaysFromCadence(cadence: string): number {
  // Escalation = 2x cadence period
  const map: Record<string, number> = {
    monthly:            60,
    every_6_weeks:      84,
    quarterly:          140,
    event_triggered:    90,
    director_triggered: 120,
  }
  return map[cadence] ?? 90
}

function recapThresholdDaysFromExpectation(expectation: string): number {
  const map: Record<string, number> = {
    every_session: 3,
    weekly:        10,
    as_needed:     21,
  }
  return map[expectation] ?? 7
}

function communicationGapThresholdFromFrequency(freq: string): number {
  const map: Record<string, number> = {
    weekly:         14,
    monthly:        45,
    milestone_only: 90,
  }
  return map[freq] ?? 45
}

function languageStyleForDnaModel(dnaModelId: AcademyDNAModelId): ParentLanguageStyle {
  const map: Record<AcademyDNAModelId, ParentLanguageStyle> = {
    '12u_foundation':    'educational',
    'performance_12plus': 'accountability',
    'college_placement': 'recruiting',
    'club_growth':       'retention',
  }
  return map[dnaModelId]
}

function cooPersonaFromModel(dnaModelId: AcademyDNAModelId): string {
  const map: Record<AcademyDNAModelId, string> = {
    '12u_foundation':    'Retention-focused COO — long-term development over short-term wins',
    'performance_12plus': 'Performance-focused COO — standards, accountability, advancement pipeline',
    'college_placement': 'Recruiting-focused COO — every session builds a college profile',
    'club_growth':       'Growth-focused COO — community, retention, and enrollment health',
  }
  return map[dnaModelId]
}

function parentKeyMessages(dnaModelId: AcademyDNAModelId): string[] {
  const map: Record<AcademyDNAModelId, string[]> = {
    '12u_foundation': [
      'Your child is enjoying the game and building great habits',
      'We celebrate effort and improvement, not just wins',
      'Consistent attendance is the single biggest driver of progress',
      'We will update you when key milestones are reached',
    ],
    'performance_12plus': [
      'Assessment results and advancement timeline',
      'Technical and tactical progress against academy standards',
      'Competition readiness and upcoming event calendar',
      'Areas the coaching team is focusing on this period',
    ],
    'college_placement': [
      'UTR trend and what is driving it',
      'Tournament schedule and match results',
      'College coach contact status and recruiting timeline',
      'Technical performance notes from coach sessions',
    ],
    'club_growth': [
      'Your player is part of a great community',
      'Celebrate every milestone and improvement',
      'The academy experience — events, socials, group progress',
      'Next program milestone and when to expect an update',
    ],
  }
  return map[dnaModelId]
}

function parentAvoidTopics(dnaModelId: AcademyDNAModelId): string[] {
  const map: Record<AcademyDNAModelId, string[]> = {
    '12u_foundation': [
      'Ranking among peers',
      'Specific score comparisons',
      'Advancement urgency',
    ],
    'performance_12plus': [
      'Vague encouragement without data',
      'Comparison to older age groups',
    ],
    'college_placement': [
      'Generic development language',
      'Non-recruiting milestones',
    ],
    'club_growth': [
      'Competitive standings',
      'Assessment scores unless explicitly requested',
      'Peer comparisons',
    ],
  }
  return map[dnaModelId]
}

function coachAlignmentChecks(dnaModelId: AcademyDNAModelId): string[] {
  const map: Record<AcademyDNAModelId, string[]> = {
    '12u_foundation': [
      'Recap mentions player engagement or enjoyment signal',
      'Observation depth covers movement patterns',
      'No punitive language about competition results',
      'Parent communication notes present when milestone reached',
    ],
    'performance_12plus': [
      'Detailed technical observations per session',
      'Advancement eligibility flagged when gate criteria approached',
      'Competition preparation notes for eligible players',
      'Recap submitted within 24 hours',
    ],
    'college_placement': [
      'Match performance observations documented',
      'UTR impact notes present after competitive events',
      'Mental performance observations included',
      'College-relevant performance metrics noted',
    ],
    'club_growth': [
      'Player engagement and energy levels noted',
      'Community-building activities acknowledged',
      'Milestone celebrations flagged',
      'Retention signals (enthusiasm, attendance intent) observed',
    ],
  }
  return map[dnaModelId]
}

function coachMisalignmentSignals(dnaModelId: AcademyDNAModelId): string[] {
  const map: Record<AcademyDNAModelId, string[]> = {
    '12u_foundation': [
      'Recap missing for 3+ consecutive sessions',
      'No enjoyment or engagement signals in last 5 recaps',
      'Competition emphasis language used for Red Ball players',
      'Parent milestone not flagged after level completion',
    ],
    'performance_12plus': [
      'Detailed observations missing for 2+ sessions',
      'Advancement-eligible player not flagged within 5 days',
      'Recap submission delay exceeding 48 hours (3+ occurrences)',
      'Competition preparation gaps in high_performance group',
    ],
    'college_placement': [
      'No match performance observation after tournament',
      'UTR note missing after rating event',
      'Mental performance not documented for 4+ weeks',
      'College contact pipeline not updated',
    ],
    'club_growth': [
      'Recap pattern shows low energy observations consistently',
      'Community engagement events not documented',
      'Attendance trend not flagged in recap',
      'No player milestone noted when enrollment anniversary reached',
    ],
  }
  return map[dnaModelId]
}

function assessmentLanguageFromModel(dnaModelId: AcademyDNAModelId): string {
  const map: Record<AcademyDNAModelId, string> = {
    '12u_foundation':    'Frame assessments as celebration checkpoints — what has the player mastered? What exciting next challenge is coming?',
    'performance_12plus': 'Frame assessments as professional standards — objective measurement of technical and tactical execution against clear criteria.',
    'college_placement': 'Frame assessments as recruiting evidence — coaches, parents, and college programs need clear, documented performance data.',
    'club_growth':       'Frame assessments as milestone moments — lightweight, positive, and focused on celebrating what the player can do.',
  }
  return map[dnaModelId]
}

function progressionLanguageFromModel(dnaModelId: AcademyDNAModelId): string {
  const map: Record<AcademyDNAModelId, string> = {
    '12u_foundation':    'long-term development and love of the game',
    'performance_12plus': 'competitive readiness and structured advancement',
    'college_placement': 'recruiting pipeline and performance evidence',
    'club_growth':       'community belonging and milestone achievement',
  }
  return map[dnaModelId]
}

function escalationTriggers(dnaModelId: AcademyDNAModelId): string[] {
  const map: Record<AcademyDNAModelId, string[]> = {
    '12u_foundation': [
      'Attendance drops below 75% for any player in 4-week window',
      'No parent communication for a player in 60+ days',
      'Coach recap missing for 4+ consecutive sessions',
      'Player disengagement signals in 3+ recaps',
    ],
    'performance_12plus': [
      'Assessment overdue by more than 30 days',
      'Player stagnation exceeding 90 days at same level',
      'Coach recap rate drops below 80%',
      'Advancement-ready player without director action for 14+ days',
    ],
    'college_placement': [
      'UTR stagnation or decline for 60+ days',
      'Missed tournament entry window for eligible player',
      'No recruiting contact update in 30 days for active prospects',
      'Coach not documenting match performance',
    ],
    'club_growth': [
      'Enrollment declining for 30+ consecutive days',
      'Player dropout spike (3+ cancellations in 7 days)',
      'No new enrollment in 30 days',
      'Parent complaint about experience or communication',
    ],
  }
  return map[dnaModelId]
}

// ── Builder ───────────────────────────────────────────────────────────────────

/**
 * Build a complete OperatingModelContext from a DNA model + style preset.
 * Deterministic — same inputs always produce the same output.
 * No AI required. All derived contexts are pure TypeScript lookups.
 */
export function buildOperatingModelContext(
  input: OperatingModelContextInput,
): OperatingModelContext {
  const dnaModel   = getAcademyDNAModel(input.dnaModelId)
  const stylePreset = getStylePreset(input.stylePresetId)
  const activeStages = input.activeStages ?? dnaModel.defaultActiveStages

  const operatingModel = buildAcademyOperatingModel({
    dnaModelId:          input.dnaModelId,
    stylePresetId:       input.stylePresetId,
    advancementApproval: input.advancementApproval,
    parentTransparency:  input.parentTransparency,
    activeStages,
  })

  // Build or use identity profile
  const dna = blueprintToDna({
    dnaModelId:          input.dnaModelId,
    stylePresetId:       input.stylePresetId,
    advancementApproval: input.advancementApproval,
    parentTransparency:  input.parentTransparency,
    activeStages,
  })

  const identityProfile = input.identityProfile
    ?? buildAcademyIdentityProfile('operating-model-context', dna, [], [], [])

  // ── Curriculum priorities ──────────────────────────────────────────────────

  const weights    = operatingModel.curriculum.aggregateCategoryWeights
  const topCat     = operatingModel.curriculum.topPriorityCategory
  const topWeight  = weights[topCat] ?? 0

  const sortedCats = (Object.entries(weights) as [StageCategory, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const emphasisOrder = sortedCats.map(([cat]) => CATEGORY_LABELS[cat])

  const sessionBias = sortedCats
    .map(([cat, w]) => `${CATEGORY_LABELS[cat]} (${w}%)`)
    .join(', ')

  const lessonPlanGuidance = emphasisOrder.length >= 2
    ? `Prioritise ${emphasisOrder[0]} content with ${emphasisOrder[1]} as secondary focus.`
    : `Prioritise ${emphasisOrder[0] ?? 'balanced'} content.`

  const curriculumPriorities: CurriculumPriorityContext = {
    topCategory:           topCat,
    topCategoryLabel:      CATEGORY_LABELS[topCat],
    topCategoryWeight:     topWeight,
    emphasisOrder,
    sessionBias:           `Focus on: ${sessionBias}`,
    lessonPlanGuidance,
    progressionLanguage:   progressionLanguageFromModel(input.dnaModelId),
    perStageTopCategories: operatingModel.curriculum.perStageTopCategories,
  }

  // ── Coach standards ────────────────────────────────────────────────────────

  const coachStandards: CoachStandardsContext = {
    recapExpectation:          operatingModel.coaches.recapExpectation,
    observationDepth:          operatingModel.coaches.observationDepth,
    autonomyLevel:             operatingModel.coaches.autonomyLevel,
    developmentFocus:          operatingModel.coaches.developmentFocus,
    alignmentChecks:           coachAlignmentChecks(input.dnaModelId),
    misalignmentSignals:       coachMisalignmentSignals(input.dnaModelId),
    overdueRecapThresholdDays: recapThresholdDaysFromExpectation(operatingModel.coaches.recapExpectation),
  }

  // ── Parent standards ───────────────────────────────────────────────────────

  const parentStandards: ParentStandardsContext = {
    transparency:                   operatingModel.parents.transparency,
    updateFrequency:                operatingModel.parents.updateFrequency,
    tone:                           operatingModel.parents.tone,
    languageStyle:                  languageStyleForDnaModel(input.dnaModelId),
    keyMessages:                    parentKeyMessages(input.dnaModelId),
    avoidTopics:                    parentAvoidTopics(input.dnaModelId),
    communicationGapThresholdDays:  communicationGapThresholdFromFrequency(operatingModel.parents.updateFrequency),
    portalVisibility:               operatingModel.parents.portalVisibility,
  }

  // ── Assessment standards ───────────────────────────────────────────────────

  const cadence = operatingModel.assessments.cadence
  const assessmentStandards: AssessmentStandardsContext = {
    cadence,
    cadenceLabel:            CADENCE_LABELS[cadence] ?? cadence,
    overdueThresholdDays:    overdueDaysFromCadence(cadence),
    escalationThresholdDays: escalationDaysFromCadence(cadence),
    domainWeights:           operatingModel.assessments.domainWeights,
    gateStrictness:          operatingModel.assessments.gateStrictness,
    assessmentLanguage:      assessmentLanguageFromModel(input.dnaModelId),
  }

  // ── DONNA assumptions ──────────────────────────────────────────────────────

  const donnaAssumptions: DonnaAssumptionContext = {
    morningBriefLead:         operatingModel.donna.morningBriefEmphasis,
    recommendationTendencies: operatingModel.donna.recommendationTendencies,
    escalationTriggers:       escalationTriggers(input.dnaModelId),
    kpiPriorities:            operatingModel.donna.kpiPriorities,
    defaultNarrative:         `${dnaModel.name} — ${stylePreset.tagline}. ${dnaModel.goal}`,
    cooPersona:               cooPersonaFromModel(input.dnaModelId),
  }

  return {
    dnaModelId:       input.dnaModelId,
    stylePresetId:    input.stylePresetId,
    dnaModel,
    stylePreset,
    identityProfile,
    operatingModel,
    curriculumPriorities,
    coachStandards,
    parentStandards,
    assessmentStandards,
    donnaAssumptions,
    hasDna:           true,
    generatedAt:      new Date().toISOString(),
  }
}
