// Sprint 517 — Evidence Requirements Model
// Defines what counts as evidence for curriculum gate criteria.
// Evidence is produced in sessions, then linked to gate records.
// Platform defines evidence types; coaches collect; directors approve advancement.
// Pure TypeScript — no DB calls, no AI, no side effects.

export type EvidenceType =
  | 'coach_note'
  | 'video_clip'
  | 'session_log'
  | 'rally_count'
  | 'assessment_result'
  | 'match_result'
  | 'attendance_record'
  | 'parent_observation'

export type EvidenceStatus =
  | 'required'
  | 'collected'
  | 'reviewed'
  | 'accepted'
  | 'rejected'

export interface EvidenceRequirement {
  requirementId: string
  gateId: string
  levelId: string
  evidenceType: EvidenceType
  description: string
  minimumCount: number
  isRequired: boolean
  isParentVisible: boolean
  isPlayerVisible: boolean
  collectionGuidance: string | null
  approvedAt: string | null
}

export interface EvidenceRecord {
  recordId: string
  requirementId: string
  gateId: string
  playerId: string
  evidenceType: EvidenceType
  status: EvidenceStatus
  notes: string | null
  collectedAt: string
  collectedBy: string
  reviewedAt: string | null
  reviewedBy: string | null
  isParentSafe: boolean
}

export interface GateEvidenceStatus {
  gateId: string
  levelId: string
  requirements: EvidenceRequirement[]
  records: EvidenceRecord[]
  totalRequired: number
  totalCollected: number
  totalAccepted: number
  isComplete: boolean
  missingRequiredEvidence: EvidenceRequirement[]
}

export function computeGateEvidenceStatus(
  requirements: EvidenceRequirement[],
  records: EvidenceRecord[],
  gateId: string,
  levelId: string,
): GateEvidenceStatus {
  const gateRequirements = requirements.filter(r => r.gateId === gateId)
  const gateRecords = records.filter(r => r.gateId === gateId)

  const totalRequired = gateRequirements.filter(r => r.isRequired).length
  const totalCollected = gateRecords.length
  const totalAccepted = gateRecords.filter(r => r.status === 'accepted').length

  const acceptedByRequirement = new Map<string, number>()
  for (const record of gateRecords) {
    if (record.status === 'accepted') {
      const count = acceptedByRequirement.get(record.requirementId) ?? 0
      acceptedByRequirement.set(record.requirementId, count + 1)
    }
  }

  const missingRequiredEvidence = gateRequirements.filter(req => {
    if (!req.isRequired) return false
    const acceptedCount = acceptedByRequirement.get(req.requirementId) ?? 0
    return acceptedCount < req.minimumCount
  })

  const isComplete = missingRequiredEvidence.length === 0

  return {
    gateId,
    levelId,
    requirements: gateRequirements,
    records: gateRecords,
    totalRequired,
    totalCollected,
    totalAccepted,
    isComplete,
    missingRequiredEvidence,
  }
}

export function buildEvidenceSummary(requirements: EvidenceRequirement[]): {
  total: number
  required: number
  optional: number
  byType: Record<EvidenceType, number>
  parentVisibleCount: number
  playerVisibleCount: number
} {
  const byType: Record<EvidenceType, number> = {
    coach_note: 0,
    video_clip: 0,
    session_log: 0,
    rally_count: 0,
    assessment_result: 0,
    match_result: 0,
    attendance_record: 0,
    parent_observation: 0,
  }

  for (const r of requirements) {
    byType[r.evidenceType] = (byType[r.evidenceType] ?? 0) + 1
  }

  return {
    total: requirements.length,
    required: requirements.filter(r => r.isRequired).length,
    optional: requirements.filter(r => !r.isRequired).length,
    byType,
    parentVisibleCount: requirements.filter(r => r.isParentVisible).length,
    playerVisibleCount: requirements.filter(r => r.isPlayerVisible).length,
  }
}

export function getParentSafeEvidence(records: EvidenceRecord[]): EvidenceRecord[] {
  return records.filter(r => r.isParentSafe && r.status === 'accepted')
}

export function getEvidenceTypeLabel(type: EvidenceType): string {
  const labels: Record<EvidenceType, string> = {
    coach_note: 'Coach note',
    video_clip: 'Video clip',
    session_log: 'Session log',
    rally_count: 'Rally count',
    assessment_result: 'Assessment result',
    match_result: 'Match result',
    attendance_record: 'Attendance record',
    parent_observation: 'Parent observation',
  }
  return labels[type]
}

export function getEvidenceStatusLabel(status: EvidenceStatus): string {
  const labels: Record<EvidenceStatus, string> = {
    required: 'Required',
    collected: 'Collected',
    reviewed: 'Under review',
    accepted: 'Accepted',
    rejected: 'Rejected',
  }
  return labels[status]
}
