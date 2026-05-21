// Sprint 476 — Director Template Library Helpers V1
// Filtering, sorting, compliance rollup, and catalogue summary for the director template library.
// Pure TypeScript — no DB calls. Operates on pre-fetched TemplateSummary + compliance data.

import type { TemplateSummary } from './templateQueries'
import type { TemplateComplianceResult } from './templateComplianceChecker'

export type TemplateFilterStatus = 'published' | 'draft' | 'archived' | 'all'
export type TemplateSortKey = 'name' | 'created_at' | 'updated_at' | 'compliance'

export interface TemplateLibraryEntry {
  template: TemplateSummary
  compliance: TemplateComplianceResult | null
  complianceLabel: 'compliant' | 'issues' | 'not_checked'
  lastUpdatedLabel: string
}

export interface TemplateLibraryCatalogue {
  entries: TemplateLibraryEntry[]
  totalCount: number
  compliantCount: number
  hasIssuesCount: number
  draftCount: number
  archivedCount: number
  publishedCount: number
  catalogueSummary: string
}

export interface TemplateFilterOptions {
  status?: TemplateFilterStatus
  searchQuery?: string
  compliantOnly?: boolean
}

function daysSince(isoString: string | null): number {
  if (!isoString) return Infinity
  return (Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60 * 24)
}

function lastUpdatedLabel(template: TemplateSummary): string {
  const ref = template.updated_at ?? template.created_at
  const days = Math.floor(daysSince(ref))
  if (days === 0) return 'Updated today'
  if (days === 1) return 'Updated yesterday'
  if (days < 7) return `Updated ${days.toString()}d ago`
  if (days < 30) return `Updated ${Math.floor(days / 7).toString()}w ago`
  return `Updated ${Math.floor(days / 30).toString()}mo ago`
}

export function buildTemplateLibraryEntry(
  template: TemplateSummary,
  compliance: TemplateComplianceResult | null,
): TemplateLibraryEntry {
  const complianceLabel: 'compliant' | 'issues' | 'not_checked' =
    compliance === null ? 'not_checked' :
    compliance.isCompliant ? 'compliant' : 'issues'

  return {
    template,
    compliance,
    complianceLabel,
    lastUpdatedLabel: lastUpdatedLabel(template),
  }
}

export function filterTemplateLibrary(
  entries: TemplateLibraryEntry[],
  options: TemplateFilterOptions,
): TemplateLibraryEntry[] {
  let result = [...entries]

  if (options.status && options.status !== 'all') {
    result = result.filter(e => e.template.status === options.status)
  }

  if (options.compliantOnly) {
    result = result.filter(e => e.complianceLabel === 'compliant')
  }

  if (options.searchQuery && options.searchQuery.trim().length > 0) {
    const q = options.searchQuery.toLowerCase()
    result = result.filter(e =>
      e.template.name.toLowerCase().includes(q) ||
      (e.template.description ?? '').toLowerCase().includes(q),
    )
  }

  return result
}

export function sortTemplateLibrary(
  entries: TemplateLibraryEntry[],
  sortKey: TemplateSortKey,
  ascending = true,
): TemplateLibraryEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (sortKey === 'name') {
      return a.template.name.localeCompare(b.template.name)
    }
    if (sortKey === 'created_at') {
      return new Date(a.template.created_at).getTime() - new Date(b.template.created_at).getTime()
    }
    if (sortKey === 'updated_at') {
      const aDate = a.template.updated_at ?? a.template.created_at
      const bDate = b.template.updated_at ?? b.template.created_at
      return new Date(aDate).getTime() - new Date(bDate).getTime()
    }
    if (sortKey === 'compliance') {
      const complianceOrder = { compliant: 0, issues: 1, not_checked: 2 }
      return complianceOrder[a.complianceLabel] - complianceOrder[b.complianceLabel]
    }
    return 0
  })
  return ascending ? sorted : sorted.reverse()
}

export function buildTemplateLibraryCatalogue(
  entries: TemplateLibraryEntry[],
): TemplateLibraryCatalogue {
  const compliantCount = entries.filter(e => e.complianceLabel === 'compliant').length
  const hasIssuesCount = entries.filter(e => e.complianceLabel === 'issues').length
  const draftCount = entries.filter(e => e.template.status === 'draft').length
  const archivedCount = entries.filter(e => e.template.status === 'archived').length
  const publishedCount = entries.filter(e => e.template.status === 'published').length

  return {
    entries,
    totalCount: entries.length,
    compliantCount,
    hasIssuesCount,
    draftCount,
    archivedCount,
    publishedCount,
    catalogueSummary: buildCatalogueSummary(publishedCount, hasIssuesCount, draftCount),
  }
}

function buildCatalogueSummary(
  published: number,
  hasIssues: number,
  drafts: number,
): string {
  const parts: string[] = [`${published.toString()} published`]
  if (hasIssues > 0) parts.push(`${hasIssues.toString()} with issues`)
  if (drafts > 0) parts.push(`${drafts.toString()} draft${drafts > 1 ? 's' : ''}`)
  return parts.join(' · ')
}

export function getTemplatesNeedingAttention(entries: TemplateLibraryEntry[]): TemplateLibraryEntry[] {
  return entries.filter(
    e => e.complianceLabel === 'issues' && e.template.status === 'published',
  )
}
