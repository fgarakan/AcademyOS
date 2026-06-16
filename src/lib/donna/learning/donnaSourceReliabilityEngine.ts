// Sprint 2861–2890 — DONNA Learning Ledger V1
// Part 7 — Source Reliability Engine
//
// Tracks how reliable each learning source is.
// Reliability influences the learningScore — a high-confidence learning from
// a low-reliability source scores lower than the same learning from the owner.
//
// Reliability is not fixed — it evolves as sources are confirmed or contradicted.
// This sprint ships the initial reliability model; evolution is a future sprint.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Reliability is per source type + optional per-actor adjustment.
//   - Academy owner (brian_direct) always has the highest base reliability.

import type { LearningSourceType } from './learningEntryModel'
import type { InterpreterRole } from '../conversation/donnaIntentInterpreter'

// ── Base reliability by source type ──────────────────────────────────────────

export const SOURCE_BASE_RELIABILITY: Record<LearningSourceType, number> = {
  brian_direct:         0.95, // academy owner — highest trust
  director_voice:       0.85, // appointed director — high trust
  system_observation:   0.75, // automated signal — factual but narrow
  coach_observation:    0.75, // domain expert — high trust for on-court signals
  parent_feedback:      0.65, // subjective but important retention signal
  player_input:         0.55, // valuable self-report; may be emotionally coloured
  conversation:         0.70, // captured from conversation — reliability varies by role
}

// ── Role-adjusted reliability ─────────────────────────────────────────────────
// When source is 'conversation', adjust by the role of the speaker.

const ROLE_RELIABILITY_ADJUSTMENT: Record<InterpreterRole, number> = {
  director: +0.10,  // director in conversation → boost (combines with conversation base)
  coach:    +0.05,
  parent:   -0.05,
  player:   -0.10,
}

// ── Actor-level adjustment ────────────────────────────────────────────────────
// Track how reliable specific named actors have proven to be over time.
// Keys are actor display names (not IDs). Immutable in this sprint.

interface ActorReliabilityRecord {
  actorName: string
  adjustmentDelta: number   // -0.15 to +0.15 additive
  confirmedLearnings: number
  contradictedLearnings: number
  lastUpdatedAt: string
}

class ActorReliabilityStore {
  private actors: Map<string, ActorReliabilityRecord> = new Map()

  register(actorName: string): void {
    if (!this.actors.has(actorName)) {
      this.actors.set(actorName, {
        actorName,
        adjustmentDelta: 0,
        confirmedLearnings: 0,
        contradictedLearnings: 0,
        lastUpdatedAt: new Date().toISOString(),
      })
    }
  }

  recordConfirmation(actorName: string): void {
    const record = this.actors.get(actorName)
    if (!record) return
    const updated = {
      ...record,
      confirmedLearnings: record.confirmedLearnings + 1,
      adjustmentDelta: Math.min(record.adjustmentDelta + 0.02, 0.15),
      lastUpdatedAt: new Date().toISOString(),
    }
    this.actors.set(actorName, updated)
  }

  recordContradiction(actorName: string): void {
    const record = this.actors.get(actorName)
    if (!record) return
    const updated = {
      ...record,
      contradictedLearnings: record.contradictedLearnings + 1,
      adjustmentDelta: Math.max(record.adjustmentDelta - 0.03, -0.15),
      lastUpdatedAt: new Date().toISOString(),
    }
    this.actors.set(actorName, updated)
  }

  getDelta(actorName: string): number {
    return this.actors.get(actorName)?.adjustmentDelta ?? 0
  }

  getAll(): ActorReliabilityRecord[] {
    return Array.from(this.actors.values())
      .sort((a, b) => b.confirmedLearnings - a.confirmedLearnings)
  }
}

export const actorReliabilityStore = new ActorReliabilityStore()

// Pre-register Brian as the highest-trust actor
actorReliabilityStore.register('Brian Dabul')

// ── Main reliability scorer ───────────────────────────────────────────────────

export interface ReliabilityScore {
  baseReliability: number
  roleAdjustment: number
  actorAdjustment: number
  finalReliability: number    // 0–1 clamped
  tier: 'owner' | 'director' | 'staff' | 'community' | 'automated'
}

export function calculateSourceReliability(
  sourceType: LearningSourceType,
  role?: InterpreterRole,
  actorName?: string,
): ReliabilityScore {
  const base = SOURCE_BASE_RELIABILITY[sourceType]
  const roleAdj = sourceType === 'conversation' && role
    ? ROLE_RELIABILITY_ADJUSTMENT[role]
    : 0
  const actorAdj = actorName ? actorReliabilityStore.getDelta(actorName) : 0

  const final = Math.max(0, Math.min(1, base + roleAdj + actorAdj))

  const tier: ReliabilityScore['tier'] =
    sourceType === 'brian_direct'   ? 'owner'
    : sourceType === 'director_voice' ? 'director'
    : sourceType === 'system_observation' ? 'automated'
    : (role === 'director' || role === 'coach') ? 'staff'
    : 'community'

  return {
    baseReliability: base,
    roleAdjustment: roleAdj,
    actorAdjustment: actorAdj,
    finalReliability: Math.round(final * 100) / 100,
    tier,
  }
}
