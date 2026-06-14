// Mega Sprint 2591–2620 — DONNA Proactive COO + Overnight Intelligence V1
// Academy Daily Snapshot — Pure TypeScript type + builder.
// No DB, no migrations, no side effects.
//
// Wraps existing engine outputs (AcademyIntelligencePacket + AcademyPulse +
// WhatChangedResult) into a single morning-ready COO snapshot.
//
// Used by: MorningBriefEngine, DonnaProactiveAlerts, PriorityEscalationEngine,
//          COOHeroBanner, AcademyPulseTimeline

import type { AcademyIntelligencePacket, PrioritizedItem } from '@/lib/donna/academy/academyIntelligenceEngine'
import type { AcademyPulse } from '@/lib/donna/pulse/academyPulseEngine'
import type { WhatChangedResult } from '@/lib/donna/operations/academyChangeEngine'

// ── Health signal ──────────────────────────────────────────────────────────────

export type AcademyHealthSignal = 'healthy' | 'stable' | 'needs_attention' | 'critical' | 'no_data'

function deriveHealthSignal(pulse: AcademyPulse | null, packet: AcademyIntelligencePacket | null): AcademyHealthSignal {
  if (!pulse && !packet) return 'no_data'
  if (pulse) {
    if (pulse.pulseStatus === 'excellent')       return 'healthy'
    if (pulse.pulseStatus === 'stable')          return 'stable'
    if (pulse.pulseStatus === 'needs_attention') return 'needs_attention'
    if (pulse.pulseStatus === 'critical')        return 'critical'
  }
  if (packet) {
    if (packet.overallHealthSignal === 'critical')         return 'critical'
    if (packet.overallHealthSignal === 'attention_needed') return 'needs_attention'
    return 'stable'
  }
  return 'no_data'
}

function deriveHealthSummary(signal: AcademyHealthSignal, pulse: AcademyPulse | null): string {
  if (pulse?.pulseSummary) return pulse.pulseSummary
  if (signal === 'healthy')         return 'Academy is running well — strong momentum to build on.'
  if (signal === 'stable')          return 'Academy is stable — a few items to monitor.'
  if (signal === 'needs_attention') return 'A few things need your attention today.'
  if (signal === 'critical')        return 'The academy needs your immediate attention.'
  return 'Not enough data yet to assess academy health.'
}

// ── Top priorities from packet attention queue ─────────────────────────────────

export interface SnapshotPriority {
  title:   string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  route:   string | null
  ageDays: number
}

function mapUrgency(raw: string): SnapshotPriority['urgency'] {
  if (raw === 'immediate') return 'critical'
  if (raw === 'urgent')    return 'high'
  if (raw === 'medium')    return 'medium'
  return 'low'
}

function buildTopPriorities(packet: AcademyIntelligencePacket | null): SnapshotPriority[] {
  if (!packet) return []
  return packet.attentionQueue.slice(0, 3).map((item: PrioritizedItem) => ({
    title:   item.title,
    urgency: mapUrgency(item.urgency),
    route:   item.playerRoute,
    ageDays: item.daysSince,
  }))
}

// ── Top risk / opportunity ─────────────────────────────────────────────────────

function buildTopRisk(packet: AcademyIntelligencePacket | null): { label: string; route: string | null } | null {
  const top = packet?.riskQueue[0]
  if (!top) return null
  return { label: top.title, route: top.playerRoute }
}

function buildTopOpportunity(packet: AcademyIntelligencePacket | null): { label: string; route: string | null } | null {
  const top = packet?.advancementCandidates[0]
  if (!top) return null
  return {
    label: `${top.name} is ready to advance`,
    route: top.route,
  }
}

// ── Main type ──────────────────────────────────────────────────────────────────

export interface AcademyDailySnapshot {
  generatedAt:         string
  healthSignal:        AcademyHealthSignal
  healthSummary:       string
  topPriorities:       SnapshotPriority[]
  topRisk:             { label: string; route: string | null } | null
  topOpportunity:      { label: string; route: string | null } | null
  attentionCount:      number
  advancementCount:    number
  parentFollowupCount: number
  pendingActionsCount: number
  whatChanged:         WhatChangedResult | null
  directorFirstName:   string
}

// ── Builder ────────────────────────────────────────────────────────────────────

export interface AcademyDailySnapshotInput {
  pulse:            AcademyPulse | null
  packet:           AcademyIntelligencePacket | null
  whatChanged:      WhatChangedResult | null
  directorFirstName: string
}

export function buildAcademyDailySnapshot(input: AcademyDailySnapshotInput): AcademyDailySnapshot {
  const { pulse, packet, whatChanged, directorFirstName } = input
  const healthSignal  = deriveHealthSignal(pulse, packet)
  const healthSummary = deriveHealthSummary(healthSignal, pulse)

  return {
    generatedAt:         new Date().toISOString(),
    healthSignal,
    healthSummary,
    topPriorities:       buildTopPriorities(packet),
    topRisk:             buildTopRisk(packet),
    topOpportunity:      buildTopOpportunity(packet),
    attentionCount:      packet?.attentionQueue.length ?? 0,
    advancementCount:    packet?.advancementCandidates.length ?? 0,
    parentFollowupCount: packet?.parentFollowupQueue.length ?? 0,
    pendingActionsCount: packet?.pendingActionsCount ?? 0,
    whatChanged,
    directorFirstName,
  }
}
