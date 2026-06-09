// Mega Sprint 1535–1564 — DONNA Today Operating System V1
// Master Today brief engine — orchestrates all sub-engines.
// Accepts pre-loaded signals. Returns a structured TodayBrief.
// Pure TypeScript — no DB, no React, no side effects.

import {
  buildAcademyHealthSummary,
  type AcademyHealthSummary,
  type AcademyHealthInput,
} from './academyHealthSummaryEngine'
import {
  buildDirectorAttentionItems,
  type DirectorAttentionItem,
  type AttentionInput,
} from './directorAttentionEngine'
import {
  buildDirectorPriorities,
  type DirectorPriority,
} from './directorPriorityEngine'
import {
  buildDirectorRisks,
  type DirectorRisk,
  type RiskInput,
} from './directorRiskEngine'
import {
  buildDirectorDecisions,
  type DirectorDecision,
  type DecisionInput,
} from './directorDecisionEngine'

// ── Suggested DONNA prompts (fixed) ───────────────────────────────────────────

export interface DonnaSuggestedPrompt {
  label:  string
  prompt: string
}

export const TODAY_DONNA_PROMPTS: DonnaSuggestedPrompt[] = [
  { label: 'What should I focus on today?',  prompt: 'What should I focus on today?' },
  { label: 'Who needs attention?',           prompt: 'Who needs attention?' },
  { label: 'Which coaches need support?',    prompt: 'Which coaches need support?' },
  { label: 'Who is ready for promotion?',    prompt: 'Who is ready for promotion?' },
  { label: 'What evidence is missing?',      prompt: 'What evidence is missing?' },
  { label: 'What changed?',                  prompt: 'What changed?' },
]

// ── Setup mode detection ──────────────────────────────────────────────────────

export function isSetupMode(input: TodayBriefInput): boolean {
  return !input.isAcademyLive
}

// ── Setup progress ────────────────────────────────────────────────────────────

export interface SetupStep {
  label:     string
  complete:  boolean
  actionLabel: string
  actionHref:  string
}

export function buildSetupSteps(input: TodayBriefInput): SetupStep[] {
  return [
    {
      label:       'Academy identity set up',
      complete:    input.hasAcademyDna,
      actionLabel: 'Set up with DONNA',
      actionHref:  '/director/setup',
    },
    {
      label:       'Players added',
      complete:    input.activePlayers > 0,
      actionLabel: 'Add first player',
      actionHref:  '/director/players/new',
    },
    {
      label:       'Session templates created',
      complete:    input.classTemplateCount > 0,
      actionLabel: 'Create template',
      actionHref:  '/director/templates',
    },
    {
      label:       'First session scheduled',
      complete:    input.sessionsExist,
      actionLabel: 'Schedule session',
      actionHref:  '/director/sessions',
    },
  ]
}

// ── Input ─────────────────────────────────────────────────────────────────────

export interface TodayBriefInput {
  // Setup signals
  isAcademyLive:              boolean
  hasAcademyDna:              boolean
  classTemplateCount:         number
  sessionsExist:              boolean

  // Player signals
  activePlayers:              number
  advancementReadyCount:      number
  stalledPlayerCount:         number
  attentionCount:             number
  reassessmentDue:            number
  playersWithLevel:           number
  playersWithoutLevel:        number
  unassignedPlayerCount:      number   // no primary_coach_id

  // Approval signals
  pendingWrapUpsCount:        number
  assessmentsNeedingReview:   number
  activePlacementReviews:     number
  parentUpdatesPending:       number
  newRequests:                number
  totalPendingReviews:        number
  oldestPendingReviewAgeDays: number | null

  // Coach signals
  coachRecapsMissing:         number

  // Curriculum signals
  curriculumGapCount:         number
  overCapacityGroupCount:     number
}

// ── Output ────────────────────────────────────────────────────────────────────

export interface TodayBrief {
  setupMode:           boolean
  setupSteps:          SetupStep[]
  academyHealth:       AcademyHealthSummary | null    // null in setup mode
  attentionItems:      DirectorAttentionItem[]
  topPriorities:       DirectorPriority[]
  topRisks:            DirectorRisk[]
  decisionsNeeded:     DirectorDecision[]
  suggestedPrompts:    DonnaSuggestedPrompt[]
  confidence:          'high' | 'medium' | 'low'
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function buildTodayBrief(input: TodayBriefInput): TodayBrief {
  const setupMode = isSetupMode(input)
  const setupSteps = buildSetupSteps(input)

  const healthInput: AcademyHealthInput = {
    activePlayers:              input.activePlayers,
    advancementReadyCount:      input.advancementReadyCount,
    stalledPlayerCount:         input.stalledPlayerCount,
    attentionCount:             input.attentionCount,
    reassessmentDue:            input.reassessmentDue,
    totalPendingReviews:        input.totalPendingReviews,
    coachRecapsMissing:         input.coachRecapsMissing,
    curriculumGapCount:         input.curriculumGapCount,
    overCapacityGroupCount:     input.overCapacityGroupCount,
    playersWithLevel:           input.playersWithLevel,
    classTemplateCount:         input.classTemplateCount,
    sessionsExist:              input.sessionsExist,
    oldestPendingReviewAgeDays: input.oldestPendingReviewAgeDays,
    parentUpdatesPending:       input.parentUpdatesPending,
  }

  const attentionInput: AttentionInput = {
    activePlayers:              input.activePlayers,
    attentionCount:             input.attentionCount,
    stalledPlayerCount:         input.stalledPlayerCount,
    reassessmentDue:            input.reassessmentDue,
    advancementReadyCount:      input.advancementReadyCount,
    pendingWrapUpsCount:        input.pendingWrapUpsCount,
    assessmentsNeedingReview:   input.assessmentsNeedingReview,
    activePlacementReviews:     input.activePlacementReviews,
    parentUpdatesPending:       input.parentUpdatesPending,
    newRequests:                input.newRequests,
    curriculumGapCount:         input.curriculumGapCount,
    overCapacityGroupCount:     input.overCapacityGroupCount,
    coachRecapsMissing:         input.coachRecapsMissing,
    playersWithoutLevel:        input.playersWithoutLevel,
    oldestPendingReviewAgeDays: input.oldestPendingReviewAgeDays,
    totalPendingReviews:        input.totalPendingReviews,
    unassignedPlayerCount:      input.unassignedPlayerCount,
  }

  const riskInput: RiskInput = {
    activePlayers:              input.activePlayers,
    stalledPlayerCount:         input.stalledPlayerCount,
    attentionCount:             input.attentionCount,
    reassessmentDue:            input.reassessmentDue,
    oldestPendingReviewAgeDays: input.oldestPendingReviewAgeDays,
    coachRecapsMissing:         input.coachRecapsMissing,
    overCapacityGroupCount:     input.overCapacityGroupCount,
    curriculumGapCount:         input.curriculumGapCount,
    unassignedPlayerCount:      input.unassignedPlayerCount,
    playersWithoutLevel:        input.playersWithoutLevel,
    totalPendingReviews:        input.totalPendingReviews,
    parentUpdatesPending:       input.parentUpdatesPending,
  }

  const decisionInput: DecisionInput = {
    assessmentsNeedingReview:   input.assessmentsNeedingReview,
    activePlacementReviews:     input.activePlacementReviews,
    pendingWrapUpsCount:        input.pendingWrapUpsCount,
    parentUpdatesPending:       input.parentUpdatesPending,
    newRequests:                input.newRequests,
    advancementReadyCount:      input.advancementReadyCount,
    oldestPendingReviewAgeDays: input.oldestPendingReviewAgeDays,
  }

  const attentionItems  = buildDirectorAttentionItems(attentionInput)
  const topPriorities   = buildDirectorPriorities(attentionItems)
  const topRisks        = buildDirectorRisks(riskInput)
  const decisionsNeeded = buildDirectorDecisions(decisionInput)

  // Suppress intelligence in setup mode
  const academyHealth = setupMode ? null : buildAcademyHealthSummary(healthInput)

  const confidence: TodayBrief['confidence'] =
    input.activePlayers >= 10 ? 'high' :
    input.activePlayers >= 3  ? 'medium' :
                                'low'

  return {
    setupMode,
    setupSteps,
    academyHealth,
    attentionItems,
    topPriorities:    setupMode ? [] : topPriorities,
    topRisks:         setupMode ? [] : topRisks,
    decisionsNeeded,
    suggestedPrompts: TODAY_DONNA_PROMPTS,
    confidence,
  }
}
