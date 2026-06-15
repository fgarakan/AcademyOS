// Mega Sprint 2621–2650 — DONNA Operating Layer V1
// DonnaOperatingLayer — Main orchestrator.
//
// Responsibilities: Observe, Monitor, Detect, Prioritize, Escalate, Guide.
//
// Takes existing engine outputs (no new DB queries).
// Runs all 7 watchers → applies escalations → builds health model → builds guidance.
// Returns OperatingLayerResult — consumed by page.tsx and DonnaOperatingFeed.

import { runAllWatchers } from './academyWatchers'
import type { WatcherInput } from './academyWatchers'
import { applyEscalations, buildPendingFollowUps } from './academyEscalationEngine'
import type { PendingFollowUp } from './academyEscalationEngine'
import { sortSignals, buildFeedItems } from './operatingSignal'
import type { OperatingSignal, OperatingFeedItem } from './operatingSignal'
import { buildAcademyHealthModelV2 } from './academyHealthModelV2'
import type { HealthModelInput, AcademyHealthModelV2 } from './academyHealthModelV2'
import { buildDirectorGuidance } from './directorGuidanceEngine'
import type { DirectorGuidance } from './directorGuidanceEngine'

// ── Input ──────────────────────────────────────────────────────────────────────

export interface OperatingLayerInput extends WatcherInput {
  // Additional fields for health model (not in WatcherInput)
  activePlayers:      number
  totalCoachCount:    number
  curriculumGapCount: number
  attendanceRiskCount: number
}

// ── Result ─────────────────────────────────────────────────────────────────────

export interface OperatingLayerResult {
  signals:          OperatingSignal[]         // all signals, sorted
  escalatedSignals: OperatingSignal[]         // subset: isEscalated === true
  health:           AcademyHealthModelV2
  guidance:         DirectorGuidance
  feedItems:        OperatingFeedItem[]        // max 10, for UI
  pendingFollowUps: PendingFollowUp[]          // items to resurface
  generatedAt:      string
}

// ── Main export ────────────────────────────────────────────────────────────────

export function buildOperatingLayer(input: OperatingLayerInput): OperatingLayerResult {
  // 1. Run all watchers
  const rawSignals = runAllWatchers(input)

  // 2. Apply escalation rules
  const escalatedAll  = applyEscalations(rawSignals)
  const signals       = sortSignals(escalatedAll)
  const escalated     = signals.filter(s => s.isEscalated)

  // 3. Build health model
  const healthInput: HealthModelInput = {
    activePlayers:               input.activePlayers,
    attentionCount:              input.attentionCount,
    stalledPlayerCount:          input.stalledPlayerCount,
    advancementReadyCount:       input.advancementReadyCount,
    coachRecapsMissing:          input.coachRecapsMissing,
    totalCoachCount:             input.totalCoachCount,
    parentFollowupCount:         input.parentFollowupCount,
    overCapacityGroupCount:      input.overCapacityGroupCount,
    curriculumGapCount:          input.curriculumGapCount,
    reassessmentDue:             input.reassessmentDue,
    pendingActionsCount:         input.pendingActionsCount,
    oldestPendingReviewAgeDays:  input.oldestPendingReviewAgeDays,
    attendanceRiskCount:         input.attendanceRiskCount,
    signals,
  }
  const health = buildAcademyHealthModelV2(healthInput)

  // 4. Build guidance
  const guidance = buildDirectorGuidance(signals, health)

  // 5. Build feed items (top 10 for UI)
  const feedItems = buildFeedItems(signals)

  // 6. Build pending follow-ups (Part 7: intelligent follow-up)
  const pendingFollowUps = buildPendingFollowUps(signals)

  return {
    signals,
    escalatedSignals: escalated,
    health,
    guidance,
    feedItems,
    pendingFollowUps,
    generatedAt: new Date().toISOString(),
  }
}

// ── Lightweight builder for orchestrator action ────────────────────────────────
// Used in donnaOrchestratorAction.ts — only has AcademyIntelligencePacket available.
// Returns minimal guidance from packet data only.

import type { AcademyIntelligencePacket } from '@/lib/donna/academy/academyIntelligenceEngine'
import type { OperatingAttentionReport } from '@/lib/donna/operations/academyAttentionEngine'
import type { AcademySituationAssessment } from '@/lib/donna/operations/operatingPartnerOutputContract'

export function buildOperatingLayerFromPacket(
  packet: AcademyIntelligencePacket,
): Pick<OperatingLayerResult, 'signals' | 'health' | 'guidance'> {
  const input: OperatingLayerInput = {
    packet,
    attentionReport: {
      signals: [], totalCount: 0, criticalCount: 0, highCount: 0,
      mediumCount: 0, lowCount: 0,
      domainsWithData: [], domainsMissing: [],
      hasPhilosophySignals: false,
      generatedAt: new Date().toISOString(),
    } as OperatingAttentionReport,
    situation: {
      situationType: 'stable_operations',
      severity:      'low',
      confidence:    'provisional',
      primaryDomain: 'cross_domain',
      signals:       [],
      explanation:   '',
      actionRequired: false,
    } as unknown as AcademySituationAssessment,
    activePlayers:             packet.playerCount,
    attentionCount:            packet.attentionQueue.length,
    advancementReadyCount:     packet.advancementCandidates.length,
    stalledPlayerCount:        packet.riskQueue.filter(r => r.recommendationType === 'stall').length,
    parentFollowupCount:       packet.parentFollowupQueue.length,
    pendingActionsCount:       packet.pendingActionsCount,
    coachRecapsMissing:        0,
    totalCoachCount:           1,
    reassessmentDue:           0,
    overCapacityGroupCount:    0,
    curriculumGapCount:        0,
    attendanceRiskCount:       0,
    oldestPendingReviewAgeDays: null,
  }

  const rawSignals    = runAllWatchers(input)
  const escalatedAll  = applyEscalations(rawSignals)
  const signals       = sortSignals(escalatedAll)

  const healthInput: HealthModelInput = {
    activePlayers:              input.activePlayers,
    attentionCount:             input.attentionCount,
    stalledPlayerCount:         input.stalledPlayerCount,
    advancementReadyCount:      input.advancementReadyCount,
    coachRecapsMissing:         0,
    totalCoachCount:            1,
    parentFollowupCount:        input.parentFollowupCount,
    overCapacityGroupCount:     0,
    curriculumGapCount:         0,
    reassessmentDue:            0,
    pendingActionsCount:        packet.pendingActionsCount,
    oldestPendingReviewAgeDays: null,
    attendanceRiskCount:        0,
    signals,
  }
  const health   = buildAcademyHealthModelV2(healthInput)
  const guidance = buildDirectorGuidance(signals, health)

  return { signals, health, guidance }
}
