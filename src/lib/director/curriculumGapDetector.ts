// Sprint 432 — Curriculum Gap Detector V1
// Pure logic helpers for identifying curriculum gaps at the player and group level.
// No DB calls — operates on data fetched by curriculumProgressQueries.ts.
// Server-side only.

export interface PlayerProgressRecord {
  playerId: string
  requirementId: string
  curriculumLevelId: string
  status: string
  progressValue: number | null
  evidenceCount: number
  lastEvidenceAt: string | null
}

export interface CurriculumGap {
  playerId: string
  requirementId: string
  curriculumLevelId: string
  gapType: 'no_evidence' | 'stalled' | 'low_progress'
  daysSinceLastEvidence: number | null
  evidenceCount: number
  progressValue: number | null
  severity: 'high' | 'medium' | 'low'
}

// Detect curriculum gaps for a single player's progress records.
// A gap is: requirement not completed + one of:
//   - no evidence at all (no_evidence)
//   - last evidence > 30 days ago (stalled)
//   - progressValue < 30% (low_progress)
export function detectPlayerCurriculumGaps(
  records: PlayerProgressRecord[],
  options: { stalledDays?: number; lowProgressThreshold?: number } = {},
): CurriculumGap[] {
  const { stalledDays = 30, lowProgressThreshold = 30 } = options
  const now = Date.now()
  const gaps: CurriculumGap[] = []

  for (const record of records) {
    if (record.status === 'completed' || record.status === 'confirmed') continue

    if (record.evidenceCount === 0) {
      gaps.push({
        playerId: record.playerId,
        requirementId: record.requirementId,
        curriculumLevelId: record.curriculumLevelId,
        gapType: 'no_evidence',
        daysSinceLastEvidence: null,
        evidenceCount: 0,
        progressValue: record.progressValue,
        severity: 'high',
      })
      continue
    }

    const daysSince = record.lastEvidenceAt
      ? Math.floor((now - Date.parse(record.lastEvidenceAt)) / 86_400_000)
      : null

    if (daysSince !== null && daysSince > stalledDays) {
      gaps.push({
        playerId: record.playerId,
        requirementId: record.requirementId,
        curriculumLevelId: record.curriculumLevelId,
        gapType: 'stalled',
        daysSinceLastEvidence: daysSince,
        evidenceCount: record.evidenceCount,
        progressValue: record.progressValue,
        severity: daysSince > 60 ? 'high' : 'medium',
      })
      continue
    }

    const progress = record.progressValue ?? 0
    if (progress < lowProgressThreshold) {
      gaps.push({
        playerId: record.playerId,
        requirementId: record.requirementId,
        curriculumLevelId: record.curriculumLevelId,
        gapType: 'low_progress',
        daysSinceLastEvidence: daysSince,
        evidenceCount: record.evidenceCount,
        progressValue: progress,
        severity: progress < 10 ? 'high' : 'low',
      })
    }
  }

  return gaps.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}

// Count gaps by type for a summary view.
export interface GapSummary {
  totalGaps: number
  noEvidence: number
  stalled: number
  lowProgress: number
  highSeverityCount: number
}

export function summarizeGaps(gaps: CurriculumGap[]): GapSummary {
  return {
    totalGaps: gaps.length,
    noEvidence: gaps.filter(g => g.gapType === 'no_evidence').length,
    stalled: gaps.filter(g => g.gapType === 'stalled').length,
    lowProgress: gaps.filter(g => g.gapType === 'low_progress').length,
    highSeverityCount: gaps.filter(g => g.severity === 'high').length,
  }
}
