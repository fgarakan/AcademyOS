// Sprint 2891–2920 — DONNA Knowledge Promotion Engine V1
// Part 9 — Approved Knowledge Registry
//
// The canonical registry of promoted knowledge items.
// An entry reaches this registry only after a human approver explicitly promotes
// an approved KnowledgePromotionCandidate.
//
// This is distinct from:
//   - src/lib/knowledge/  (external platform knowledge — research, manuals, guidelines)
//   - LearningEntry store (unreviewed/pending entries)
//   - KnowledgePromotionCandidate store (items in review)
//
// This registry stores only DONNA-operational knowledge — internal academy learning
// that has been approved for reuse in DONNA's recommendations and answers.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - In-memory singleton; DB persistence is a future sprint.
//   - Registry entries are immutable after promotion (version-controlled).
//   - Rejected entries NEVER appear in the registry.
//   - Full traceability back to source LearningEntry.

import type { KnowledgeTargetScope } from './knowledgePromotionCandidateModel'
import type { AcademyOSConcept } from '../conversation/donnaMeaningExtractor'
import type { LearningTopicDomain } from '../learning/learningEntryModel'

// ── Registry entry ────────────────────────────────────────────────────────────

export type RegistryEntryStatus = 'active' | 'superseded' | 'archived'

export interface ApprovedKnowledgeEntry {
  id: string
  academyId: string
  scope: KnowledgeTargetScope

  // Content
  title: string
  body: string
  concepts: AcademyOSConcept[]
  topicDomain: LearningTopicDomain
  tags: string[]

  // Traceability (Part 11)
  sourceLearningEntryId: string       // original LearningEntry.id
  sourceCandidateId: string           // original KnowledgePromotionCandidate.id
  sourceEvidence: string[]            // original phrases/evidence that created this
  sourceSummary: string               // original summary from LearningEntry

  // Approval chain
  approvedBy: string
  approvedAt: string
  promotedBy: string
  promotedAt: string
  sourceReliability: number           // carried from LearningEntry
  promotionScore: number              // carried from KnowledgePromotionCandidate

  // Versioning
  version: number                     // incremented when knowledge is updated
  previousVersionId: string | null

  // Status
  status: RegistryEntryStatus

  // Reuse tracking
  reuseCount: number
  lastUsedAt: string | null

  // Metadata
  metadata: Record<string, unknown>
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export interface RegistryAuditEntry {
  entryId: string
  action: 'promoted' | 'accessed' | 'superseded' | 'archived'
  performedBy: string
  at: string
  detail: string | null
}

// ── Registry store ────────────────────────────────────────────────────────────

let _registryCounter = 0
function generateRegistryId(): string {
  _registryCounter += 1
  return `ak-${Date.now()}-${_registryCounter}`
}

class DonnaApprovedKnowledgeStore {
  private entries: Map<string, ApprovedKnowledgeEntry> = new Map()
  private auditLog: RegistryAuditEntry[] = []

  // ── Write ──────────────────────────────────────────────────────────────────

  promote(
    params: Omit<ApprovedKnowledgeEntry, 'id' | 'reuseCount' | 'lastUsedAt' | 'version' | 'previousVersionId' | 'status'>,
    promotedBy: string,
  ): ApprovedKnowledgeEntry {
    const entry: ApprovedKnowledgeEntry = {
      ...params,
      id: generateRegistryId(),
      version: 1,
      previousVersionId: null,
      status: 'active',
      reuseCount: 0,
      lastUsedAt: null,
    }
    this.entries.set(entry.id, entry)
    this.audit(entry.id, 'promoted', promotedBy, `Promoted from candidate ${params.sourceCandidateId}`)
    return entry
  }

  supersede(
    oldEntryId: string,
    newEntryParams: Omit<ApprovedKnowledgeEntry, 'id' | 'reuseCount' | 'lastUsedAt' | 'version' | 'previousVersionId' | 'status'>,
    performedBy: string,
  ): ApprovedKnowledgeEntry | null {
    const old = this.entries.get(oldEntryId)
    if (!old) return null

    // Mark old as superseded
    this.entries.set(oldEntryId, { ...old, status: 'superseded' })
    this.audit(oldEntryId, 'superseded', performedBy, `Superseded by new version`)

    // Create new version
    const newEntry: ApprovedKnowledgeEntry = {
      ...newEntryParams,
      id: generateRegistryId(),
      version: old.version + 1,
      previousVersionId: oldEntryId,
      status: 'active',
      reuseCount: 0,
      lastUsedAt: null,
    }
    this.entries.set(newEntry.id, newEntry)
    this.audit(newEntry.id, 'promoted', performedBy, `Version ${newEntry.version} of "${old.title}"`)
    return newEntry
  }

  archive(entryId: string, performedBy: string, reason: string): boolean {
    const entry = this.entries.get(entryId)
    if (!entry) return false
    this.entries.set(entryId, { ...entry, status: 'archived' })
    this.audit(entryId, 'archived', performedBy, reason)
    return true
  }

  recordReuse(entryId: string): boolean {
    const entry = this.entries.get(entryId)
    if (!entry || entry.status !== 'active') return false
    this.entries.set(entryId, {
      ...entry,
      reuseCount: entry.reuseCount + 1,
      lastUsedAt: new Date().toISOString(),
    })
    this.audit(entryId, 'accessed', 'donna', null)
    return true
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  getEntry(id: string): ApprovedKnowledgeEntry | null {
    return this.entries.get(id) ?? null
  }

  getActiveEntries(): ApprovedKnowledgeEntry[] {
    return Array.from(this.entries.values()).filter(e => e.status === 'active')
  }

  getAllEntries(): ApprovedKnowledgeEntry[] {
    return Array.from(this.entries.values())
  }

  getByAcademy(academyId: string): ApprovedKnowledgeEntry[] {
    return this.getActiveEntries().filter(e => e.academyId === academyId)
  }

  getByScope(scope: KnowledgeTargetScope): ApprovedKnowledgeEntry[] {
    return this.getActiveEntries().filter(e => e.scope === scope)
  }

  getByConcept(concept: AcademyOSConcept): ApprovedKnowledgeEntry[] {
    return this.getActiveEntries().filter(e => e.concepts.includes(concept))
  }

  getByDomain(domain: LearningTopicDomain): ApprovedKnowledgeEntry[] {
    return this.getActiveEntries().filter(e => e.topicDomain === domain)
  }

  getBySourceLearningEntry(learningEntryId: string): ApprovedKnowledgeEntry | null {
    return this.getActiveEntries().find(e => e.sourceLearningEntryId === learningEntryId) ?? null
  }

  getAuditLog(entryId?: string): RegistryAuditEntry[] {
    if (entryId) return this.auditLog.filter(a => a.entryId === entryId)
    return [...this.auditLog]
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  getStats(academyId?: string): {
    total: number
    active: number
    archived: number
    superseded: number
    totalReuseCount: number
    byScope: Record<KnowledgeTargetScope, number>
    mostReused: ApprovedKnowledgeEntry | null
  } {
    const all = academyId
      ? this.getAllEntries().filter(e => e.academyId === academyId)
      : this.getAllEntries()

    const active = all.filter(e => e.status === 'active')

    const byScope: Record<KnowledgeTargetScope, number> = {
      academy_specific_knowledge: 0,
      global_platform_knowledge_candidate: 0,
      brian_philosophy_knowledge: 0,
      curriculum_knowledge: 0,
      coach_standard_knowledge: 0,
      parent_communication_knowledge: 0,
      operating_model_knowledge: 0,
    }
    for (const e of active) {
      byScope[e.scope] = (byScope[e.scope] ?? 0) + 1
    }

    const sortedByReuse = [...active].sort((a, b) => b.reuseCount - a.reuseCount)

    return {
      total: all.length,
      active: active.length,
      archived: all.filter(e => e.status === 'archived').length,
      superseded: all.filter(e => e.status === 'superseded').length,
      totalReuseCount: active.reduce((sum, e) => sum + e.reuseCount, 0),
      byScope,
      mostReused: sortedByReuse[0] ?? null,
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

  private audit(entryId: string, action: RegistryAuditEntry['action'], performedBy: string, detail: string | null): void {
    this.auditLog.push({ entryId, action, performedBy, at: new Date().toISOString(), detail })
  }
}

// Module-level singleton
export const donnaApprovedKnowledgeRegistry = new DonnaApprovedKnowledgeStore()
