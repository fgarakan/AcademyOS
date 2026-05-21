// Sprint 433 — Template Compliance Checker V1
// Pure logic helpers for checking that session templates have curriculum alignment.
// Operates on template data fetched by templateRepository.ts.
// No DB calls — pure transformation. Server-side only.

export interface TemplateBlock {
  id: string
  name: string | null
  durationMin: number | null
  curriculumLevelId: string | null
  requirementIds: string[]
}

export interface TemplateComplianceResult {
  templateId: string
  templateName: string
  isCompliant: boolean
  totalDurationMin: number
  blocksWithCurriculumAlignment: number
  blocksWithoutAlignment: number
  alignmentPct: number
  issues: TemplateComplianceIssue[]
}

export interface TemplateComplianceIssue {
  blockId: string
  blockName: string | null
  issueType: 'no_curriculum_alignment' | 'missing_duration' | 'no_requirements_linked'
  severity: 'high' | 'medium' | 'low'
}

// Check a single template's compliance.
export function checkTemplateCompliance(
  templateId: string,
  templateName: string,
  blocks: TemplateBlock[],
): TemplateComplianceResult {
  const issues: TemplateComplianceIssue[] = []
  let totalDuration = 0
  let aligned = 0

  for (const block of blocks) {
    if (block.durationMin) totalDuration += block.durationMin
    else {
      issues.push({
        blockId: block.id,
        blockName: block.name,
        issueType: 'missing_duration',
        severity: 'low',
      })
    }

    const hasAlignment = Boolean(block.curriculumLevelId)
    const hasRequirements = block.requirementIds.length > 0

    if (hasAlignment) {
      aligned += 1
      if (!hasRequirements) {
        issues.push({
          blockId: block.id,
          blockName: block.name,
          issueType: 'no_requirements_linked',
          severity: 'medium',
        })
      }
    } else {
      issues.push({
        blockId: block.id,
        blockName: block.name,
        issueType: 'no_curriculum_alignment',
        severity: 'high',
      })
    }
  }

  const alignmentPct = blocks.length > 0 ? Math.round((aligned / blocks.length) * 100) : 0

  return {
    templateId,
    templateName,
    isCompliant: issues.filter(i => i.severity === 'high').length === 0,
    totalDurationMin: totalDuration,
    blocksWithCurriculumAlignment: aligned,
    blocksWithoutAlignment: blocks.length - aligned,
    alignmentPct,
    issues,
  }
}

// Check multiple templates and return only non-compliant ones.
export function findNonCompliantTemplates(
  results: TemplateComplianceResult[],
): TemplateComplianceResult[] {
  return results.filter(r => !r.isCompliant).sort((a, b) => a.alignmentPct - b.alignmentPct)
}
