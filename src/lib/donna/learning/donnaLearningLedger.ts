// Sprint 2861–2890 — DONNA Learning Ledger V1
// Part 1 — DONNA Learning Ledger
//
// Permanent in-process repository of learning entries.
// Organized by academy, role, topic, concept, source, confidence, and status.
//
// The Ledger is the single source of truth for DONNA's accumulated learning.
// All other engines read from and write to the Ledger.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - In-memory singleton — does not persist between process restarts (DB in future sprint).
//   - All mutations are logged to a simple audit trail.
//   - Status transitions are validated — invalid transitions are rejected.
//   - Never delete entries — archive instead.

import type { LearningEntry, LearningStatus } from './learningEntryModel'
import { canTransition } from './learningEntryModel'
import type { AcademyOSConcept } from '../conversation/donnaMeaningExtractor'
import type { InterpreterRole } from '../conversation/donnaIntentInterpreter'
import type { LearningSourceType, LearningTopicDomain } from './learningEntryModel'

// ── Audit log ─────────────────────────────────────────────────────────────────

export interface LedgerAuditEntry {
  entryId: string
  action: 'added' | 'status_changed' | 'score_updated' | 'clustered' | 'merged'
  from: string | null
  to: string
  performedBy: string    // 'system' or actor name
  at: string             // ISO timestamp
  reason: string | null
}

// ── Ledger stats ──────────────────────────────────────────────────────────────

export interface LedgerStats {
  totalEntries: number
  byStatus: Record<LearningStatus, number>
  bySourceType: Record<LearningSourceType, number>
  byRole: Record<InterpreterRole, number>
  topConcepts: Array<{ concept: AcademyOSConcept; count: number }>
  avgScore: number
  promotionEligibleCount: number
  pendingReviewCount: number
  approvedCount: number
  promotedCount: number
}

// ── Ledger ────────────────────────────────────────────────────────────────────

class DonnaLearningLedgerStore {
  private entries: Map<string, LearningEntry> = new Map()
  private auditLog: LedgerAuditEntry[] = []
  private maxAuditEntries = 2000

  // ── Write ──────────────────────────────────────────────────────────────────

  addEntry(entry: LearningEntry, performedBy = 'system'): string {
    this.entries.set(entry.id, entry)
    this.log({
      entryId: entry.id,
      action: 'added',
      from: null,
      to: entry.status,
      performedBy,
      reason: `Source: ${entry.sourceType}`,
    })
    return entry.id
  }

  updateStatus(
    id: string,
    to: LearningStatus,
    performedBy: string,
    reason?: string,
  ): boolean {
    const entry = this.entries.get(id)
    if (!entry) return false
    if (!canTransition(entry.status, to)) return false

    const now = new Date().toISOString()
    const updated: LearningEntry = {
      ...entry,
      status: to,
      approvedBy:   (to === 'approved' || to === 'promoted') ? performedBy : entry.approvedBy,
      approvedAt:   (to === 'approved' || to === 'promoted') ? now : entry.approvedAt,
      promotedAt:   to === 'promoted' ? now : entry.promotedAt,
    }
    this.entries.set(id, updated)

    this.log({
      entryId: id,
      action: 'status_changed',
      from: entry.status,
      to,
      performedBy,
      reason: reason ?? null,
    })
    return true
  }

  updateScore(id: string, score: number, promotionEligible: boolean): boolean {
    const entry = this.entries.get(id)
    if (!entry) return false
    this.entries.set(id, { ...entry, learningScore: score, promotionEligible })
    this.log({
      entryId: id,
      action: 'score_updated',
      from: null,
      to: String(score),
      performedBy: 'system',
      reason: null,
    })
    return true
  }

  assignCluster(id: string, clusterId: string): boolean {
    const entry = this.entries.get(id)
    if (!entry) return false
    this.entries.set(id, { ...entry, clusterId })
    this.log({
      entryId: id,
      action: 'clustered',
      from: entry.clusterId,
      to: clusterId,
      performedBy: 'system',
      reason: null,
    })
    return true
  }

  markDuplicate(id: string, canonicalId: string): boolean {
    const entry = this.entries.get(id)
    if (!entry) return false
    this.entries.set(id, { ...entry, isDuplicate: true, canonicalEntryId: canonicalId })
    this.log({
      entryId: id,
      action: 'merged',
      from: null,
      to: canonicalId,
      performedBy: 'system',
      reason: 'Duplicate detected',
    })
    return true
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  getEntry(id: string): LearningEntry | null {
    return this.entries.get(id) ?? null
  }

  getAllEntries(): LearningEntry[] {
    return Array.from(this.entries.values())
  }

  getEntriesByStatus(status: LearningStatus): LearningEntry[] {
    return Array.from(this.entries.values()).filter(e => e.status === status)
  }

  getEntriesByAcademy(academyId: string): LearningEntry[] {
    return Array.from(this.entries.values()).filter(e => e.academyId === academyId)
  }

  getEntriesByRole(role: InterpreterRole): LearningEntry[] {
    return Array.from(this.entries.values()).filter(e => e.role === role)
  }

  getEntriesByTopic(topic: string): LearningEntry[] {
    const lower = topic.toLowerCase()
    return Array.from(this.entries.values())
      .filter(e => e.topic.toLowerCase().includes(lower))
  }

  getEntriesByDomain(domain: LearningTopicDomain): LearningEntry[] {
    return Array.from(this.entries.values()).filter(e => e.topicDomain === domain)
  }

  getEntriesByConcept(concept: AcademyOSConcept): LearningEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.concepts.includes(concept))
  }

  getEntriesByCluster(clusterId: string): LearningEntry[] {
    return Array.from(this.entries.values()).filter(e => e.clusterId === clusterId)
  }

  getEntriesBySource(sourceType: LearningSourceType): LearningEntry[] {
    return Array.from(this.entries.values()).filter(e => e.sourceType === sourceType)
  }

  getAuditLog(entryId?: string): LedgerAuditEntry[] {
    if (entryId) return this.auditLog.filter(a => a.entryId === entryId)
    return [...this.auditLog]
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  getStats(academyId?: string): LedgerStats {
    const all = academyId
      ? this.getEntriesByAcademy(academyId)
      : this.getAllEntries()

    const byStatus: Record<LearningStatus, number> = {
      captured: 0, reviewing: 0, approved: 0, rejected: 0, promoted: 0, archived: 0,
    }
    const bySourceType: Record<LearningSourceType, number> = {
      conversation: 0, director_voice: 0, coach_observation: 0, parent_feedback: 0,
      player_input: 0, system_observation: 0, brian_direct: 0,
    }
    const byRole: Record<InterpreterRole, number> = {
      director: 0, coach: 0, parent: 0, player: 0,
    }
    const conceptCounts = new Map<AcademyOSConcept, number>()
    let totalScore = 0

    for (const e of all) {
      byStatus[e.status] = (byStatus[e.status] ?? 0) + 1
      bySourceType[e.sourceType] = (bySourceType[e.sourceType] ?? 0) + 1
      byRole[e.role] = (byRole[e.role] ?? 0) + 1
      totalScore += e.learningScore
      for (const c of e.concepts) {
        conceptCounts.set(c, (conceptCounts.get(c) ?? 0) + 1)
      }
    }

    const topConcepts = Array.from(conceptCounts.entries())
      .map(([concept, count]) => ({ concept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalEntries: all.length,
      byStatus,
      bySourceType,
      byRole,
      topConcepts,
      avgScore: all.length > 0 ? Math.round(totalScore / all.length) : 0,
      promotionEligibleCount: all.filter(e => e.promotionEligible).length,
      pendingReviewCount: all.filter(e => e.status === 'captured' || e.status === 'reviewing').length,
      approvedCount: byStatus.approved,
      promotedCount: byStatus.promoted,
    }
  }

  clear(): void {
    this.entries.clear()
    this.auditLog = []
  }

  size(): number {
    return this.entries.size
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private log(entry: Omit<LedgerAuditEntry, 'at'>): void {
    if (this.auditLog.length >= this.maxAuditEntries) {
      this.auditLog.shift()
    }
    this.auditLog.push({ ...entry, at: new Date().toISOString() })
  }
}

// Module-level singleton
export const donnaLearningLedger = new DonnaLearningLedgerStore()
