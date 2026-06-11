// Sprint 1775A — DONNA Operating Partner Architecture Audit V1
// Builder stubs: assemble the Operating Partner input payload.
//
// These functions filter, normalise, and collapse philosophy and operational
// inputs into the clean contract shape.
//
// THESE FUNCTIONS MAY:
//   - filter signals by confidence
//   - exclude noisy preference keys (curriculum_expansion)
//   - collapse 'low'/'insufficient' → 'provisional'
//   - strip 'unknown' direction → null
//   - mark missing data explicitly
//   - compute input completeness score
//
// THESE FUNCTIONS MUST NOT:
//   - create priorities
//   - create a daily brief
//   - rank actions
//   - forecast impact
//   - classify situations
//   - execute actions
//   - call the database
//
// Those belong to Sprint 1776–1805.
//
// All philosophy types imported only here — not in Sprint 1776–1805 code.

import type { AcademyIdentityProfile, RealityOverrideAnalysis } from '../philosophy/academyIdentityProfile'
import type { PhilosophyDriftReport, AcademyEvolutionTimeline } from '../philosophy/academyEvolutionTimeline'
import type { PreferenceSignal } from '../philosophy/academyPreferenceExtractor'
import type { DecisionPatternRecord } from '../philosophy/academyDecisionPatterns'
import { getRecentEvolutionPhases } from '../philosophy/academyEvolutionTimeline'
import { getMostAcceptedContentTypes } from '../philosophy/academyDecisionPatterns'

import type {
  OperatingPartnerPhilosophyInputs,
  OperatingPartnerConfidence,
  AcademyIdentityInput,
  IdentityDimensionInput,
  DriftInput,
  AcademyPreferencesInput,
  PreferenceInput,
  DecisionPatternInput,
  AcademyEvolutionInput,
  RealityOverrideInput,
} from './operatingPartnerPhilosophyContract'

import type { OperatingPartnerOperationalInputs } from './operatingPartnerOperationalContract'
import type { OperatingPartnerInputs } from './operatingPartnerInputContract'

// ── Confidence collapse ───────────────────────────────────────────────────────

function collapseConfidence(raw: 'high' | 'medium' | 'low' | 'insufficient'): OperatingPartnerConfidence {
  return raw === 'high' || raw === 'medium' ? 'reliable' : 'provisional'
}

// ── Philosophy inputs builder ─────────────────────────────────────────────────

export function buildOperatingPartnerPhilosophyInputs(params: {
  academyId:    string
  profile:      AcademyIdentityProfile
  drift:        PhilosophyDriftReport
  preferences:  PreferenceSignal[]
  patterns:     DecisionPatternRecord[]
  timeline:     AcademyEvolutionTimeline
  overrides:    RealityOverrideAnalysis[]
}): OperatingPartnerPhilosophyInputs {
  const { academyId, profile, drift, preferences, patterns, timeline, overrides } = params
  const now = new Date().toISOString()

  // ── Identity: map 10 dimensions, collapse confidence, include drift warnings ─
  const identity: AcademyIdentityInput = {
    dimensions: profile.dimensions.map<IdentityDimensionInput>(dim => ({
      key:           dim.key,
      label:         dim.label,
      finalScore:    dim.finalScore,
      primarySource: dim.primarySource,
      confidence:    collapseConfidence(dim.confidence),
      driftWarning:  dim.driftWarning,
    })),
    overallConfidence: collapseConfidence(profile.overallConfidence),
    narrative:         profile.narrative,
    dataLimitations:   profile.limitations,
  }

  // ── Drift: top 2 drifted dimensions only ─────────────────────────────────
  const driftInput: DriftInput = {
    driftDetected:     drift.driftDetected,
    driftSeverity:     drift.driftSeverity,
    confidence:        collapseConfidence(drift.confidence),
    driftedDimensions: drift.driftedDimensions.slice(0, 2).map(dd => ({
      dimension:   dd.dimension,
      gap:         dd.gap,
      description: dd.description,
    })),
    donnaMessage:    drift.donnaMessage,
    suggestedAction: drift.suggestedAction,
  }

  // ── Preferences: filter, exclude curriculum_expansion, strip unknown dir ──
  const EXCLUDED_KEYS = new Set(['curriculum_expansion'])

  const meaningful = preferences.filter(
    p => p.confidence !== 'insufficient' && !EXCLUDED_KEYS.has(p.key),
  )

  const toInput = (p: PreferenceSignal): PreferenceInput => ({
    label:           p.label,
    score:           p.score,
    direction:       p.direction === 'unknown' ? null : p.direction,
    confidence:      collapseConfidence(p.confidence),
    positiveSignals: p.positiveSignals,
    negativeSignals: p.negativeSignals,
  })

  const topPreferences: PreferenceInput[] = meaningful
    .filter(p => p.score >= 65)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(toInput)

  const topAvoidances: PreferenceInput[] = meaningful
    .filter(p => p.score <= 35)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(toInput)

  const preferencesInput: AcademyPreferencesInput = { topPreferences, topAvoidances }

  // ── Decision patterns: summarise ─────────────────────────────────────────
  const overrides_ = patterns.filter(p => p.decisionArea === 'director_override')
  const overrideCount = overrides_.length
  const overrideRate  = patterns.length > 0 ? overrideCount / patterns.length : 0
  const topContentTypes = getMostAcceptedContentTypes(patterns).slice(0, 3)

  const decisionPatternInput: DecisionPatternInput = {
    totalDecisions:  patterns.length,
    overrideCount,
    overrideRate:    Math.round(overrideRate * 100) / 100,
    topContentTypes,
    dataLimitation:  'V1: curriculum memory records accepted decisions only. Rejection history not tracked.',
  }

  // ── Evolution: recent 90 days only ───────────────────────────────────────
  const recentPhases = getRecentEvolutionPhases(timeline, 90)
  const evolutionInput: AcademyEvolutionInput = {
    recentPhases: recentPhases.map(p => ({
      periodLabel:       p.periodLabel,
      activityLevel:     p.activityLevel,
      dominantTheme:     p.dominantTheme,
      curriculumAdded:   p.curriculumAdded,
      curriculumRemoved: p.curriculumRemoved,
      playersAdvanced:   p.playersAdvanced,
    })),
    overallTheme:    timeline.overallTheme,
    summaryLine:     timeline.summaryLine,
    dataLimitations: timeline.dataLimitations,
  }

  // ── Reality overrides ─────────────────────────────────────────────────────
  const overrideInputs: RealityOverrideInput[] = overrides
    .filter(ro => ro.evidenceStrength !== 'INSUFFICIENT')
    .map(ro => ({
      observedReality:        ro.observedReality,
      contradictedPhilosophy: ro.contradictedPhilosophy,
      evidenceStrength:       ro.evidenceStrength as 'STRONG' | 'MODERATE' | 'WEAK',
      recommendedAction:      ro.recommendedAction,
    }))

  // ── Data window ───────────────────────────────────────────────────────────
  const earliest = timeline.earliestActivity
  const dataWindowDays = earliest
    ? Math.round((Date.now() - new Date(earliest).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return {
    identity,
    drift:       driftInput,
    preferences: preferencesInput,
    decisions:   decisionPatternInput,
    evolution:   evolutionInput,
    overrides:   overrideInputs,
    generatedAt: now,
    academyId,
    dataWindowDays,
  }
}

// ── Operational inputs builder ────────────────────────────────────────────────
// Sprint 1776–1805 will implement the full DB-loading version.
// This stub defines the signature and default empty-state shape.

export function buildEmptyOperationalInputs(
  academyId: string,
): OperatingPartnerOperationalInputs {
  const empty = { dataAvailable: false, missingData: ['Data not yet loaded'] }
  return {
    academyId,
    generatedAt:    new Date().toISOString(),
    dataWindowDays: 0,
    players: {
      ...empty,
      totalPlayerCount:         0,
      levelDistribution:        [],
      stallCount:               0,
      assessmentDueCount:       0,
      advancementEligibleCount: 0,
      attendanceRiskCount:      0,
      readinessBlockerCount:    0,
      playersWithoutLevel:      0,
      playersWithoutCoach:      0,
      hasStallData:             false,
      hasAssessmentData:        false,
      hasAttendanceData:        false,
    },
    coaches: {
      ...empty,
      totalCoachCount:            0,
      missingWrapUpCount:         0,
      missingWrapUpCoachCount:    0,
      inconsistentExecutionCount: 0,
      stagnantPlayerByCoachCount: 0,
      recentWrapUpSubmissionRate: 0,
      hasWrapUpData:              false,
      hasExecutionData:           false,
    },
    curriculum: {
      ...empty,
      weakLevelCount:               0,
      emptyLevelCount:              0,
      missingAssessmentCount:       0,
      missingGateCount:             0,
      contentGapsByType:            {},
      bottleneckLevelCount:         0,
      pendingApprovalCount:         0,
      playerBackedBottleneckCount:  0,
      hasCurriculumData:            false,
      hasGateData:                  false,
      hasPlayerEvidenceData:        false,
    },
    parents: {
      ...empty,
      totalParentCount:       0,
      communicationGapCount:  0,
      updateOverdueCount:     0,
      engagementRiskCount:    0,
      retentionRiskCount:     0,
      transparencyLevel:      'standard',
      hasCommunicationData:   false,
      hasEngagementData:      false,
      hasRetentionData:       false,
    },
    business: {
      ...empty,
      enrollmentTrendSignal:      'unknown',
      capacityIssueCount:         0,
      programImbalanceSignal:     null,
      attendanceTrendLast30Days:  'unknown',
      churnRiskSignal:            'unknown',
      revenueSignal:              'unavailable',
      hasEnrollmentData:          false,
      hasCapacityData:            false,
    },
    system: {
      ...empty,
      pendingApprovalCount:      0,
      oldestPendingAgeDays:      null,
      onboardingIncompleteItems: [],
      unreadAlertCount:          0,
      hasLiveData:               false,
      isAcademyLive:             false,
    },
  }
}

// ── Completeness score ────────────────────────────────────────────────────────
// 0–100. Philosophy layer = 40 points max. Operational domains = 10 points each.

function computeCompletenessScore(
  philosophy: OperatingPartnerPhilosophyInputs,
  ops:        OperatingPartnerOperationalInputs,
): number {
  // Philosophy score (0–40)
  const philoConfidence = philosophy.identity.overallConfidence
  const philoScore = philoConfidence === 'reliable' ? 40
    : philosophy.identity.dimensions.some(d => d.primarySource !== 'default') ? 20
    : 5

  // Operational scores (0–10 per domain = 60 max)
  const domains = [ops.players, ops.coaches, ops.curriculum, ops.parents, ops.business, ops.system]
  const opsScore = domains.reduce((sum, d) => sum + (d.dataAvailable ? 10 : 0), 0)

  return Math.min(100, philoScore + opsScore)
}

function findMissingCriticalInputs(ops: OperatingPartnerOperationalInputs): string[] {
  const missing: string[] = []
  if (!ops.players.dataAvailable)    missing.push('Player operational data')
  if (!ops.curriculum.dataAvailable) missing.push('Curriculum operational data')
  if (!ops.system.dataAvailable)     missing.push('System / approval queue data')
  return missing
}

// ── Combined builder ──────────────────────────────────────────────────────────

export function buildOperatingPartnerInputs(
  academyId:  string,
  philosophy: OperatingPartnerPhilosophyInputs,
  operations: OperatingPartnerOperationalInputs,
): OperatingPartnerInputs {
  return {
    academyId,
    generatedAt:            new Date().toISOString(),
    philosophy,
    operations,
    dataWindowDays:         Math.max(philosophy.dataWindowDays, operations.dataWindowDays),
    inputCompletenessScore: computeCompletenessScore(philosophy, operations),
    missingCriticalInputs:  findMissingCriticalInputs(operations),
  }
}
