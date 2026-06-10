// Mega Sprint 1625–1654 — DONNA Academy Learning Engine V1
// Signal extractor: converts AcademyMemory[] into typed MemoryLearningSignal[].
// One signal per memory record. Pure TypeScript. No DB. No mutations.

import type { AcademyMemory, MemorySourceType } from '../memory/donnaAcademyMemoryTypes'
import type { MemoryLearningSignal, SignalType, LearningConfidence } from './donnaAcademyLearningTypes'

// ── Source → signal type ──────────────────────────────────────────────────────

function toSignalType(sourceType: MemorySourceType): SignalType {
  switch (sourceType) {
    case 'promotion_decision':   return 'promotion_decision'
    case 'placement_decision':   return 'placement_decision'
    case 'assessment_result':    return 'assessment_result'
    case 'coach_assignment':     return 'coach_assignment'
    case 'coach_wrap_up':        return 'coach_wrap_up'
    case 'parent_update':        return 'parent_update'
    case 'curriculum_change':    return 'curriculum_change'
    case 'director_override':    return 'director_override'
    case 'donna_recommendation': return 'donna_recommendation'
    default:                     return 'proposed_action'
  }
}

// ── Confidence bridge ─────────────────────────────────────────────────────────

function toSignalConfidence(c: AcademyMemory['confidence']): LearningConfidence {
  if (c === 'high')   return 'high'
  if (c === 'medium') return 'medium'
  if (c === 'low')    return 'low'
  return 'insufficient'  // 'inferred' maps to insufficient for learning purposes
}

// ── Extractor ─────────────────────────────────────────────────────────────────

export function extractLearningSignals(memories: AcademyMemory[]): MemoryLearningSignal[] {
  return memories.map(mem => ({
    id:              `sig-${mem.id}`,
    signalType:      toSignalType(mem.sourceType),
    headline:        mem.headline,
    evidence:        mem.evidence,
    confidence:      toSignalConfidence(mem.confidence),
    sourceMemoryIds: [mem.id],
    occurredAt:      mem.occurredAt,
    entityLinks:     mem.entityLinks,
    importance:      mem.importance,
  }))
}

// ── Signal grouping ───────────────────────────────────────────────────────────

export interface SignalGroup {
  signalType: SignalType
  signals:    MemoryLearningSignal[]
  count:      number
  mostRecent: string | null
}

export function groupSignalsByType(signals: MemoryLearningSignal[]): Map<SignalType, SignalGroup> {
  const groups = new Map<SignalType, SignalGroup>()
  for (const sig of signals) {
    const existing = groups.get(sig.signalType)
    if (existing) {
      existing.signals.push(sig)
      existing.count++
      if (!existing.mostRecent || sig.occurredAt > existing.mostRecent) {
        existing.mostRecent = sig.occurredAt
      }
    } else {
      groups.set(sig.signalType, {
        signalType: sig.signalType,
        signals:    [sig],
        count:      1,
        mostRecent: sig.occurredAt,
      })
    }
  }
  return groups
}

// ── Window filter ─────────────────────────────────────────────────────────────

export function signalsInLastDays(signals: MemoryLearningSignal[], days: number): MemoryLearningSignal[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffIso = cutoff.toISOString()
  return signals.filter(s => s.occurredAt >= cutoffIso)
}
