// Sprint 954 — Curriculum Execution Intelligence V1
// Identifies gaps between planned curriculum and actual session delivery.
// Pure TypeScript — read-only, no DB calls, no mutations.
// No curriculum mutation. Director review required for any change.

export interface CurriculumExecutionGap {
  type: 'repeated_focus' | 'missing_evidence' | 'priority_not_in_curriculum' | 'low_coverage'
  severity: 'warning' | 'info'
  description: string
  recommendedAction: string
  href: string
}

export interface CurriculumExecutionInput {
  totalSessionsThisPeriod: number
  uniqueFocusAreasDelivered: number
  repeatedFocusAreaCount: number
  playersWithMissingGateEvidence: number
  playersWithPriorityOutsideCurriculum: number
  averageLevelCoveragePercent: number
}

export function detectCurriculumExecutionGaps(
  input: CurriculumExecutionInput,
): CurriculumExecutionGap[] {
  const gaps: CurriculumExecutionGap[] = []

  if (input.repeatedFocusAreaCount > input.uniqueFocusAreasDelivered * 0.5) {
    gaps.push({
      type: 'repeated_focus',
      severity: 'warning',
      description: `${input.repeatedFocusAreaCount} of ${input.uniqueFocusAreasDelivered} focus areas were repeated across sessions this period.`,
      recommendedAction: 'Review the curriculum breadth — coaches may be defaulting to comfort zones.',
      href: '/director/curriculum',
    })
  }
  if (input.playersWithMissingGateEvidence > 0) {
    gaps.push({
      type: 'missing_evidence',
      severity: 'warning',
      description: `${input.playersWithMissingGateEvidence} player${input.playersWithMissingGateEvidence > 1 ? 's' : ''} have active curriculum gates with no evidence submitted.`,
      recommendedAction: 'Review gate status and ask coaches to submit observations.',
      href: '/director/players',
    })
  }
  if (input.playersWithPriorityOutsideCurriculum > 0) {
    gaps.push({
      type: 'priority_not_in_curriculum',
      severity: 'info',
      description: `${input.playersWithPriorityOutsideCurriculum} player${input.playersWithPriorityOutsideCurriculum > 1 ? 's have' : ' has'} priorities not mapped to any curriculum level.`,
      recommendedAction: 'Update the curriculum to include these development areas.',
      href: '/director/curriculum/builder',
    })
  }
  if (input.averageLevelCoveragePercent < 60) {
    gaps.push({
      type: 'low_coverage',
      severity: 'warning',
      description: `Average curriculum level coverage this period: ${Math.round(input.averageLevelCoveragePercent)}%.`,
      recommendedAction: 'Check whether session templates are aligned with curriculum requirements.',
      href: '/director/curriculum',
    })
  }
  return gaps
}
